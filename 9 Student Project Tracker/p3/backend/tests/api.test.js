const test = require('node:test');
const assert = require('node:assert');
const http = require('http');
const app = require('../server');
const db = require('../config/db');

let server;
let port;
let baseUrl;

// Test variables to store generated IDs
let testStudent1Id = 1; // Alice Cooper (from seed)
let testStudent2Id = 2; // Bob Marley (from seed)
let testSupervisorId = 3; // Prof. John Doe (from seed)
let createdProjectId = null;

// Helper to make HTTP requests using fetch
async function apiRequest(path, options = {}) {
  const url = `${baseUrl}${path}`;
  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers
    }
  });

  let body = null;
  const contentType = response.headers.get('content-type');
  if (contentType && contentType.includes('application/json')) {
    body = await response.json();
  } else {
    body = await response.text();
  }

  return { status: response.status, body };
}

test.before(async () => {
  // Test DB Connectivity
  try {
    await db.query('SELECT 1');
    console.log('Database connection is OK.');
  } catch (err) {
    console.error('Database connection failed:', err);
    process.exit(1);
  }

  // Clear existing test entries if any
  await db.query("DELETE FROM project_submissions WHERE title LIKE 'TEST:%'");

  // Start the server on a random port
  server = http.createServer(app);
  await new Promise((resolve) => {
    server.listen(0, () => {
      port = server.address().port;
      baseUrl = `http://localhost:${port}`;
      resolve();
    });
  });
  console.log(`Test server started on port ${port}`);
});

test.after(async () => {
  // Cleanup database test entries
  await db.query("DELETE FROM project_submissions WHERE title LIKE 'TEST:%'");
  
  // Close resources
  if (server) {
    await new Promise((resolve) => server.close(resolve));
  }
  console.log('Test server closed.');
});

// --- Test Suites ---

test('1. Authentication: Database-backed Login Checks', async (t) => {
  // Failure Case: Invalid credentials
  const res1 = await apiRequest('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ username: 'alice_student', password: 'wrongpassword' })
  });
  assert.strictEqual(res1.status, 401);
  assert.ok(res1.body.error);

  // Success Case: Valid student login
  const res2 = await apiRequest('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ username: 'alice_student', password: 'password123' })
  });
  assert.strictEqual(res2.status, 200);
  assert.strictEqual(res2.body.role, 'student');
  assert.strictEqual(res2.body.fullName, 'Alice Cooper');

  // Success Case: Valid supervisor login
  const res3 = await apiRequest('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ username: 'supervisor_john', password: 'password123' })
  });
  assert.strictEqual(res3.status, 200);
  assert.strictEqual(res3.body.role, 'supervisor');
  assert.strictEqual(res3.body.fullName, 'Prof. John Doe');
});

test('2. Submission Workflow: Create & Validate Submissions', async (t) => {
  // Failure Case: Student tries to submit with missing required fields
  const res1 = await apiRequest('/api/projects', {
    method: 'POST',
    headers: { 'x-user-id': testStudent1Id.toString() },
    body: JSON.stringify({ title: 'TEST: Missing Category Project', description: 'Some description' })
  });
  assert.strictEqual(res1.status, 400);

  // Failure Case: Supervisor tries to submit project (Blocked Action)
  const res2 = await apiRequest('/api/projects', {
    method: 'POST',
    headers: { 'x-user-id': testSupervisorId.toString() },
    body: JSON.stringify({
      title: 'TEST: Supervisor Project',
      description: 'Supervisors shouldn\'t submit',
      category: 'Artificial Intelligence',
      studentName: 'Prof. John Doe',
      supervisorName: 'Prof. John Doe',
      submittedDate: '2026-06-14'
    })
  });
  assert.strictEqual(res2.status, 403);

  // Success Case: Student submits valid project (Allowed Action)
  const res3 = await apiRequest('/api/projects', {
    method: 'POST',
    headers: { 'x-user-id': testStudent1Id.toString() },
    body: JSON.stringify({
      title: 'TEST: Diagnostic Tool',
      description: 'An AI-powered diagnostic helper',
      category: 'Artificial Intelligence',
      studentName: 'Alice Cooper',
      supervisorName: 'Prof. John Doe',
      submittedDate: '2026-06-14'
    })
  });
  assert.strictEqual(res3.status, 201);
  assert.ok(res3.body.id);
  createdProjectId = res3.body.id;
});

test('3. Retrieval & Access Controls: View & Filter', async (t) => {
  // Student view constraint check
  // Alice (Student 1) retrieves projects
  const res1 = await apiRequest('/api/projects', {
    method: 'GET',
    headers: { 'x-user-id': testStudent1Id.toString() }
  });
  assert.strictEqual(res1.status, 200);
  // Ensure Alice only receives projects associated with her student ID
  const allOurs = res1.body.every(p => p.student_id === testStudent1Id);
  assert.ok(allOurs);

  // Student trying to fetch other student's project directly (Blocked Action)
  // Let's create a temporary project for Bob (Student 2) to test
  const resCreateBob = await apiRequest('/api/projects', {
    method: 'POST',
    headers: { 'x-user-id': testStudent2Id.toString() },
    body: JSON.stringify({
      title: 'TEST: Bob Secret Project',
      description: 'Bob secret details',
      category: 'Web Applications',
      studentName: 'Bob Marley',
      supervisorName: 'Prof. Jane Smith',
      submittedDate: '2026-06-14'
    })
  });
  const bobProjectId = resCreateBob.body.id;

  // Alice tries to retrieve Bob's project directly (Blocked Action)
  const res2 = await apiRequest(`/api/projects/${bobProjectId}`, {
    method: 'GET',
    headers: { 'x-user-id': testStudent1Id.toString() }
  });
  assert.strictEqual(res2.status, 403);

  // Supervisor retrieves projects (Allowed to see all)
  const res3 = await apiRequest('/api/projects', {
    method: 'GET',
    headers: { 'x-user-id': testSupervisorId.toString() }
  });
  assert.strictEqual(res3.status, 200);
  const containsAlice = res3.body.some(p => p.student_id === testStudent1Id);
  const containsBob = res3.body.some(p => p.student_id === testStudent2Id);
  assert.ok(containsAlice && containsBob);
});

test('4. Update Workflow: Edit Metadata & Access Checks', async (t) => {
  // Failure Case: Student tries to update project details while status is 'submitted' (Blocked)
  const resFail = await apiRequest(`/api/projects/${createdProjectId}`, {
    method: 'PUT',
    headers: { 'x-user-id': testStudent1Id.toString() },
    body: JSON.stringify({
      title: 'TEST: Diagnostic Tool Updated',
      description: 'An updated description attempt',
      category: 'Artificial Intelligence',
      supervisorName: 'Prof. John Doe',
      submittedDate: '2026-06-14'
    })
  });
  assert.strictEqual(resFail.status, 403);

  // Supervisor sets status to 'revisionRequested'
  const resSetRevision = await apiRequest(`/api/projects/${createdProjectId}/review`, {
    method: 'PUT',
    headers: { 'x-user-id': testSupervisorId.toString() },
    body: JSON.stringify({ status: 'revisionRequested', feedback: 'Please update title' })
  });
  assert.strictEqual(resSetRevision.status, 200);

  // Success Case: Student updates own project details now that it is 'revisionRequested' (Allowed)
  const resSuccess = await apiRequest(`/api/projects/${createdProjectId}`, {
    method: 'PUT',
    headers: { 'x-user-id': testStudent1Id.toString() },
    body: JSON.stringify({
      title: 'TEST: Diagnostic Tool Updated',
      description: 'An updated AI-powered diagnostic helper description',
      category: 'Artificial Intelligence',
      supervisorName: 'Prof. John Doe',
      submittedDate: '2026-06-14'
    })
  });
  assert.strictEqual(resSuccess.status, 200);

  // Check updated fields are saved and status reset back to 'submitted'
  const resCheck = await apiRequest(`/api/projects/${createdProjectId}`, {
    method: 'GET',
    headers: { 'x-user-id': testStudent1Id.toString() }
  });
  assert.strictEqual(resCheck.body.title, 'TEST: Diagnostic Tool Updated');
  assert.strictEqual(resCheck.body.description, 'An updated AI-powered diagnostic helper description');
  assert.strictEqual(resCheck.body.status, 'submitted');
});

test('5. Review & Lifecycles: Protected Action Checks (Supervisor)', async (t) => {
  // Failure Case: Student tries to review own project (Blocked Action)
  const res1 = await apiRequest(`/api/projects/${createdProjectId}/review`, {
    method: 'PUT',
    headers: { 'x-user-id': testStudent1Id.toString() },
    body: JSON.stringify({ status: 'approved', feedback: 'I approve myself' })
  });
  assert.strictEqual(res1.status, 403);

  // Failure Case: Supervisor uses invalid status value
  const res2 = await apiRequest(`/api/projects/${createdProjectId}/review`, {
    method: 'PUT',
    headers: { 'x-user-id': testSupervisorId.toString() },
    body: JSON.stringify({ status: 'invalid_status_value', feedback: 'Review feedback' })
  });
  assert.strictEqual(res2.status, 400);

  // Success Case: Supervisor approves project with feedback (Allowed Action)
  const res3 = await apiRequest(`/api/projects/${createdProjectId}/review`, {
    method: 'PUT',
    headers: { 'x-user-id': testSupervisorId.toString() },
    body: JSON.stringify({ status: 'approved', feedback: 'Excellent work. Approved.' })
  });
  assert.strictEqual(res3.status, 200);

  // Confirm values in Database
  const resVerify = await apiRequest(`/api/projects/${createdProjectId}`, {
    method: 'GET',
    headers: { 'x-user-id': testStudent1Id.toString() }
  });
  assert.strictEqual(resVerify.body.status, 'approved');
  assert.strictEqual(resVerify.body.feedback, 'Excellent work. Approved.');
});

test('6. Filters: Apply supervisor, category, and status searches', async (t) => {
  // Filter by status 'approved'
  const res1 = await apiRequest('/api/projects?status=approved', {
    method: 'GET',
    headers: { 'x-user-id': testSupervisorId.toString() }
  });
  assert.strictEqual(res1.status, 200);
  assert.ok(res1.body.length > 0);
  assert.ok(res1.body.every(p => p.status === 'approved'));

  // Filter by category
  const res2 = await apiRequest('/api/projects?category=Artificial%20Intelligence', {
    method: 'GET',
    headers: { 'x-user-id': testSupervisorId.toString() }
  });
  assert.strictEqual(res2.status, 200);
  assert.ok(res2.body.every(p => p.category === 'Artificial Intelligence'));
});
