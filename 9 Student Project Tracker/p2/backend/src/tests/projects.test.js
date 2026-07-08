const request = require('supertest');
const app = require('../index');
const db = require('../db');

describe('Student Project Tracker API Tests with DB Auth', () => {
  let studentAlice = null;
  let studentBob = null;
  let supervisorCarol = null;
  let supervisorDave = null;
  
  let aliceToken = '';
  let bobToken = '';
  let carolToken = '';
  let daveToken = '';
  
  let testProjectId = null;

  // Retrieve our seeded users and log in to get session tokens before starting tests
  beforeAll(async () => {
    process.env.NODE_ENV = 'test';

    const users = await db.query('SELECT id, username, role FROM users');
    studentAlice = users.find(u => u.username === 'student_alice');
    studentBob = users.find(u => u.username === 'student_bob');
    supervisorCarol = users.find(u => u.username === 'supervisor_carol');
    supervisorDave = users.find(u => u.username === 'supervisor_dave');

    // Perform login requests to retrieve db-backed tokens
    const loginAlice = await request(app).post('/api/auth/login').send({ username: 'student_alice', password: 'password123' });
    aliceToken = loginAlice.body.token;

    const loginBob = await request(app).post('/api/auth/login').send({ username: 'student_bob', password: 'password123' });
    bobToken = loginBob.body.token;

    const loginCarol = await request(app).post('/api/auth/login').send({ username: 'supervisor_carol', password: 'password123' });
    carolToken = loginCarol.body.token;

    const loginDave = await request(app).post('/api/auth/login').send({ username: 'supervisor_dave', password: 'password123' });
    daveToken = loginDave.body.token;
  });

  // Clean up any test projects that contain "INTEGRATION_TEST:" prefix
  afterAll(async () => {
    await db.query('DELETE FROM projects WHERE title LIKE "INTEGRATION_TEST:%"');
    await db.pool.end();
  });

  describe('POST /api/projects - Submission Creation', () => {
    it('should fail with 401 if user is not authenticated', async () => {
      const response = await request(app)
        .post('/api/projects')
        .send({
          title: 'INTEGRATION_TEST: Unauthorized Proposal',
          description: 'This proposal should fail.',
          category: 'Web Development',
          supervisor_id: supervisorCarol.id,
          submitted_date: '2026-06-15'
        });
      expect(response.status).toBe(401);
    });

    it('should fail with 403 if a supervisor tries to submit a project', async () => {
      const response = await request(app)
        .post('/api/projects')
        .set('Authorization', `Bearer ${carolToken}`)
        .send({
          title: 'INTEGRATION_TEST: Supervisor Submission',
          description: 'Supervisors shouldn\'t create projects.',
          category: 'Web Development',
          supervisor_id: supervisorDave.id,
          submitted_date: '2026-06-15'
        });
      expect(response.status).toBe(403);
    });

    it('should fail with 400 if required fields are missing', async () => {
      const response = await request(app)
        .post('/api/projects')
        .set('Authorization', `Bearer ${aliceToken}`)
        .send({
          title: 'INTEGRATION_TEST: Incomplete Submission',
          category: 'Web Development',
          supervisor_id: supervisorCarol.id,
          submitted_date: '2026-06-15'
        });
      expect(response.status).toBe(400);
    });

    it('should succeed with 201 when student submits valid project details', async () => {
      const response = await request(app)
        .post('/api/projects')
        .set('Authorization', `Bearer ${aliceToken}`)
        .send({
          title: 'INTEGRATION_TEST: Autonomous Robotics',
          description: 'A study in path mapping robots.',
          category: 'Artificial Intelligence',
          supervisor_id: supervisorCarol.id,
          submitted_date: '2026-06-15'
        });
      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('projectId');
      testProjectId = response.body.projectId;
    });
  });

  describe('PUT /api/projects/:id - Project Updates', () => {
    it('should fail with 400 if student tries to edit their own submission details when status is submitted', async () => {
      const response = await request(app)
        .put(`/api/projects/${testProjectId}`)
        .set('Authorization', `Bearer ${aliceToken}`)
        .send({
          title: 'INTEGRATION_TEST: Autonomous Robotics v2',
          description: 'Updated study description.',
          category: 'Artificial Intelligence',
          supervisor_id: supervisorCarol.id,
          submitted_date: '2026-06-16'
        });
      expect(response.status).toBe(400);
    });

    it('should fail with 403 if a different student tries to edit the project details', async () => {
      const response = await request(app)
        .put(`/api/projects/${testProjectId}`)
        .set('Authorization', `Bearer ${bobToken}`)
        .send({
          title: 'INTEGRATION_TEST: Hijacked Proposal',
          description: 'Bob tries to edit Alice\'s proposal.',
          category: 'Artificial Intelligence',
          supervisor_id: supervisorCarol.id,
          submitted_date: '2026-06-16'
        });
      expect(response.status).toBe(403);
    });

    it('should fail with 400 if student tries to edit an already approved project', async () => {
      // Set status to approved directly in database
      await db.query('UPDATE projects SET status = "approved" WHERE id = ?', [testProjectId]);

      const response = await request(app)
        .put(`/api/projects/${testProjectId}`)
        .set('Authorization', `Bearer ${aliceToken}`)
        .send({
          title: 'INTEGRATION_TEST: Blocked Edit attempt',
          description: 'This edit should be blocked by status lock.',
          category: 'Artificial Intelligence',
          supervisor_id: supervisorCarol.id,
          submitted_date: '2026-06-16'
        });
      expect(response.status).toBe(400);

      // Revert status to submitted for subsequent tests
      await db.query('UPDATE projects SET status = "submitted" WHERE id = ?', [testProjectId]);
    });

    it('should allow student owner to update their own submission details when status is revisionRequested, transitioning status back to submitted', async () => {
      // Set status to revisionRequested directly in database to simulate supervisor requesting revision
      await db.query('UPDATE projects SET status = "revisionRequested" WHERE id = ?', [testProjectId]);

      const response = await request(app)
        .put(`/api/projects/${testProjectId}`)
        .set('Authorization', `Bearer ${aliceToken}`)
        .send({
          title: 'INTEGRATION_TEST: Autonomous Robotics v2',
          description: 'Updated study description.',
          category: 'Artificial Intelligence',
          supervisor_id: supervisorCarol.id,
          submitted_date: '2026-06-16'
        });
      expect(response.status).toBe(200);

      const [updated] = await db.query('SELECT title, description, status FROM projects WHERE id = ?', [testProjectId]);
      expect(updated.title).toBe('INTEGRATION_TEST: Autonomous Robotics v2');
      expect(updated.status).toBe('submitted');
    });
  });

  describe('PUT /api/projects/:id/review - Supervisor Feedback & Status Update', () => {
    it('should fail with 403 if student tries to update feedback or status', async () => {
      const response = await request(app)
        .put(`/api/projects/${testProjectId}/review`)
        .set('Authorization', `Bearer ${aliceToken}`)
        .send({
          status: 'approved',
          feedback: 'I approve myself.'
        });
      expect(response.status).toBe(403);
    });

    it('should fail with 403 if a supervisor other than the assigned one tries to submit review', async () => {
      const response = await request(app)
        .put(`/api/projects/${testProjectId}/review`)
        .set('Authorization', `Bearer ${daveToken}`)
        .send({
          status: 'approved',
          feedback: 'Dave approves.'
        });
      expect(response.status).toBe(403);
    });

    it('should allow the assigned supervisor to update status and add feedback', async () => {
      const response = await request(app)
        .put(`/api/projects/${testProjectId}/review`)
        .set('Authorization', `Bearer ${carolToken}`)
        .send({
          status: 'approved',
          feedback: 'Excellent work. Approved.'
        });
      expect(response.status).toBe(200);

      const [updated] = await db.query('SELECT status, feedback FROM projects WHERE id = ?', [testProjectId]);
      expect(updated.status).toBe('approved');
      expect(updated.feedback).toBe('Excellent work. Approved.');
    });
  });

  describe('Spoofing Prevention Checks', () => {
    it('should reject review submission if student attempts header spoofing', async () => {
      // Alice is a student. She attempts to spoof role by adding headers while passing her student token.
      const response = await request(app)
        .put(`/api/projects/${testProjectId}/review`)
        .set('Authorization', `Bearer ${aliceToken}`)
        .set('x-user-role', 'supervisor')
        .set('role', 'supervisor')
        .set('x-user-id', supervisorCarol.id.toString())
        .send({
          status: 'approved',
          feedback: 'Attempting header spoof.'
        });
      expect(response.status).toBe(403);
    });

    it('should reject review submission if student attempts body spoofing', async () => {
      // Alice tries to pass user info inside the request body
      const response = await request(app)
        .put(`/api/projects/${testProjectId}/review`)
        .set('Authorization', `Bearer ${aliceToken}`)
        .send({
          status: 'approved',
          feedback: 'Attempting body spoof.',
          role: 'supervisor',
          userRole: 'supervisor',
          userId: supervisorCarol.id
        });
      expect(response.status).toBe(403);
    });

    it('should reject review submission if student attempts query parameter spoofing', async () => {
      // Alice tries to pass role/user parameters in query string
      const response = await request(app)
        .put(`/api/projects/${testProjectId}/review?role=supervisor&userRole=supervisor&userId=${supervisorCarol.id}`)
        .set('Authorization', `Bearer ${aliceToken}`)
        .send({
          status: 'approved',
          feedback: 'Attempting query spoof.'
        });
      expect(response.status).toBe(403);
    });

    it('should reject project modification if student attempts to hijack ownership in body/query', async () => {
      // Bob tries to edit Alice's project (testProjectId) by specifying studentAlice details in body
      const response = await request(app)
        .put(`/api/projects/${testProjectId}`)
        .set('Authorization', `Bearer ${bobToken}`)
        .send({
          title: 'INTEGRATION_TEST: Hijacked Proposal v3',
          description: 'Attempting body spoof to override student ownership.',
          category: 'Artificial Intelligence',
          supervisor_id: supervisorCarol.id,
          submitted_date: '2026-06-16',
          student_id: studentAlice.id,
          student_name: studentAlice.full_name
        });
      expect(response.status).toBe(403);
    });
  });
});
