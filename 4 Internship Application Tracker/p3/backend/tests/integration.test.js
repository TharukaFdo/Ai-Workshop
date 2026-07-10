const test = require('node:test');
const assert = require('node:assert');
const app = require('../server');
const db = require('../config/db');
const { hashPassword } = require('../utils/hash');

test('Internship Application Tracker Integration Suite', async (t) => {
  let server;
  let port;
  let baseUrl;

  // Store tokens and identifiers generated during tests
  let studentToken;
  let studentId;
  let coordinatorToken;
  let coordinatorId;
  let testAppId;

  // Setup test server and database state
  t.before(async () => {
    // 1. Bind Express to a random available port
    server = app.listen(0);
    port = server.address().port;
    baseUrl = `http://localhost:${port}`;

    // 2. Clear any lingering test residues
    await db.query("DELETE FROM applications WHERE company_name LIKE 'TEST_%'");
    await db.query("DELETE FROM users WHERE username LIKE 'test_%'");

    // 3. Insert mock test users
    const sPass = hashPassword('studentPass123');
    const [studentResult] = await db.query(
      "INSERT INTO users (username, password, role) VALUES ('test_student', ?, 'student')",
      [sPass]
    );
    studentId = studentResult.insertId;

    const cPass = hashPassword('coordPass123');
    const [coordResult] = await db.query(
      "INSERT INTO users (username, password, role) VALUES ('test_coordinator', ?, 'coordinator')",
      [cPass]
    );
    coordinatorId = coordResult.insertId;
  });

  // Cleanup server connection and database tables
  t.after(async () => {
    if (server) server.close();
    await db.query("DELETE FROM applications WHERE company_name LIKE 'TEST_%'");
    await db.query("DELETE FROM users WHERE username LIKE 'test_%'");
    console.log('Database cleaned up, test records purged.');
  });

  // Test Case 1: Database connectivity check
  await t.test('1. Database connectivity check', async () => {
    const [result] = await db.query('SELECT 1 + 1 as sum');
    assert.strictEqual(result[0].sum, 2);
  });

  // Test Case 2: Login failure check
  await t.test('2. Login fails with incorrect password', async () => {
    const response = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'test_student', password: 'wrongpassword' })
    });
    assert.strictEqual(response.status, 401);
    const data = await response.json();
    assert.strictEqual(data.error, 'Invalid username or password.');
  });

  // Test Case 3: Login success check
  await t.test('3. Login succeeds with correct password', async () => {
    const response = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'test_student', password: 'studentPass123' })
    });
    assert.strictEqual(response.status, 200);
    const data = await response.json();
    assert.ok(data.token);
    assert.strictEqual(data.user.role, 'student');
    studentToken = data.token; // Save token for subsequent student calls
  });

  // Test Case 4: Coordinator login check
  await t.test('4. Coordinator login succeeds', async () => {
    const response = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'test_coordinator', password: 'coordPass123' })
    });
    assert.strictEqual(response.status, 200);
    const data = await response.json();
    assert.ok(data.token);
    assert.strictEqual(data.user.role, 'coordinator');
    coordinatorToken = data.token;
  });

  // Test Case 5: Student submits valid application
  await t.test('5. Student submits application successfully', async () => {
    const response = await fetch(`${baseUrl}/api/applications`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${studentToken}`
      },
      body: JSON.stringify({
        studentName: 'Test Student User',
        companyName: 'TEST_Google',
        positionTitle: 'Software QA Intern',
        startDate: '2026-09-01',
        endDate: '2026-12-01',
        submittedDate: '2026-07-08'
      })
    });
    assert.strictEqual(response.status, 201);
    const data = await response.json();
    assert.ok(data.id);
    testAppId = data.id; // Store application ID for update checks
  });

  // Test Case 6: Date Validation Check
  await t.test('6. Student application fails when end date <= start date', async () => {
    const response = await fetch(`${baseUrl}/api/applications`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${studentToken}`
      },
      body: JSON.stringify({
        studentName: 'Test Student User',
        companyName: 'TEST_Meta',
        positionTitle: 'Intern',
        startDate: '2026-12-01',
        endDate: '2026-11-01', // Invalid chronological order
        submittedDate: '2026-07-08'
      })
    });
    assert.strictEqual(response.status, 400);
    const data = await response.json();
    assert.strictEqual(data.error, 'End Date must be strictly after the Start Date.');
  });

  // Test Case 7: Student edits application details (Expected Failure in 'submitted' status)
  await t.test('7. Student cannot edit applications in the "submitted" stage', async () => {
    const response = await fetch(`${baseUrl}/api/applications/${testAppId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${studentToken}`
      },
      body: JSON.stringify({
        studentId: studentId,
        studentName: 'Test Student User',
        companyName: 'TEST_Google_Updated',
        positionTitle: 'QA Lead Intern',
        startDate: '2026-09-01',
        endDate: '2026-12-15'
      })
    });
    assert.strictEqual(response.status, 400);
    const data = await response.json();
    assert.strictEqual(data.error, 'Only applications in the "changesRequested" stage can be modified.');
  });

  // Test Case 7a: Coordinator transitions status to changesRequested
  await t.test('7a. Coordinator transitions application to changesRequested', async () => {
    const response = await fetch(`${baseUrl}/api/applications/${testAppId}/decision`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${coordinatorToken}`
      },
      body: JSON.stringify({
        status: 'changesRequested',
        comment: 'Please extend the end date.'
      })
    });
    assert.strictEqual(response.status, 200);

    const [rows] = await db.query('SELECT * FROM applications WHERE id = ?', [testAppId]);
    assert.strictEqual(rows[0].status, 'changesRequested');
  });

  // Test Case 7b: Student edits and resubmits changesRequested application
  await t.test('7b. Student edits and resubmits changesRequested application successfully', async () => {
    const response = await fetch(`${baseUrl}/api/applications/${testAppId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${studentToken}`
      },
      body: JSON.stringify({
        studentId: studentId,
        studentName: 'Test Student User',
        companyName: 'TEST_Google_Updated',
        positionTitle: 'QA Lead Intern',
        startDate: '2026-09-01',
        endDate: '2026-12-15' // extended
      })
    });
    assert.strictEqual(response.status, 200);

    const [rows] = await db.query('SELECT * FROM applications WHERE id = ?', [testAppId]);
    assert.strictEqual(rows[0].company_name, 'TEST_Google_Updated');
    assert.strictEqual(rows[0].status, 'submitted'); // Resubmitted!
  });

  // Test Case 8: Student blocked from coordinator actions
  await t.test('8. Student is blocked from making review decisions', async () => {
    const response = await fetch(`${baseUrl}/api/applications/${testAppId}/decision`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${studentToken}`
      },
      body: JSON.stringify({
        status: 'approved',
        comment: 'I approve my own application!'
      })
    });
    assert.strictEqual(response.status, 403);
    const data = await response.json();
    assert.strictEqual(data.error, 'Forbidden. Only coordinators can review applications.');
  });

  // Test Case 9: Coordinator review and status transition
  await t.test('9. Coordinator successfully reviews application', async () => {
    const response = await fetch(`${baseUrl}/api/applications/${testAppId}/decision`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${coordinatorToken}`
      },
      body: JSON.stringify({
        status: 'underReview',
        comment: 'TEST_feedback: Credentials look good.'
      })
    });
    assert.strictEqual(response.status, 200);

    // Verify DB update
    const [rows] = await db.query('SELECT * FROM applications WHERE id = ?', [testAppId]);
    assert.strictEqual(rows[0].status, 'underReview');
    assert.strictEqual(rows[0].coordinator_comment, 'TEST_feedback: Credentials look good.');
  });

  // Test Case 10: Student edit lock check
  await t.test('10. Student cannot edit applications that are already underReview', async () => {
    const response = await fetch(`${baseUrl}/api/applications/${testAppId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${studentToken}`
      },
      body: JSON.stringify({
        studentId: studentId,
        studentName: 'Test Student User',
        companyName: 'TEST_Google_Hijacked',
        positionTitle: 'QA Lead Intern',
        startDate: '2026-09-01',
        endDate: '2026-12-15'
      })
    });
    assert.strictEqual(response.status, 400);
    const data = await response.json();
    assert.strictEqual(data.error, 'Only applications in the "changesRequested" stage can be modified.');
  });

  // Test Case 11: Cross-user boundary verification
  await t.test('11. Student cannot read another student\'s application details', async () => {
    // Create an application for another user
    const [otherStudentResult] = await db.query(
      "INSERT INTO users (username, password, role) VALUES ('test_student_2', 'studentPass123', 'student')"
    );
    const otherStudentId = otherStudentResult.insertId;

    const [otherAppResult] = await db.query(`
      INSERT INTO applications (student_id, student_name, company_name, position_title, start_date, end_date, submitted_date, status)
      VALUES (?, 'Student Two', 'TEST_Apple', 'Software Intern', '2026-09-01', '2026-12-01', '2026-07-08', 'submitted')
    `, [otherStudentId]);
    const otherAppId = otherAppResult.insertId;

    // Student 1 tries to fetch Student 2's application
    const response = await fetch(`${baseUrl}/api/applications/${otherAppId}`, {
      headers: {
        'Authorization': `Bearer ${studentToken}`
      }
    });
    assert.strictEqual(response.status, 403);
    const data = await response.json();
    assert.strictEqual(data.error, 'Forbidden. You do not own this application.');
  });

  // Test Case 12: Searching and filtering verification
  await t.test('12. Filtering applications works for coordinators', async () => {
    const response = await fetch(`${baseUrl}/api/applications?companyName=TEST_Google&status=underReview`, {
      headers: {
        'Authorization': `Bearer ${coordinatorToken}`
      }
    });
    assert.strictEqual(response.status, 200);
    const data = await response.json();
    assert.ok(data.length >= 1);
    assert.strictEqual(data[0].company_name, 'TEST_Google_Updated');
  });
});
