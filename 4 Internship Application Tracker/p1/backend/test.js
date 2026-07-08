const app = require('./server');
const db = require('./db');

const PORT = 5001;
const BASE_URL = `http://localhost:${PORT}`;

function assert(condition, message) {
  if (!condition) {
    throw new Error(`Assertion failed: ${message}`);
  }
  console.log(`✅ [PASS] ${message}`);
}

async function runTests() {
  console.log('Starting Integration Tests...');

  // Start temporary test server
  const server = app.listen(PORT);
  console.log(`Test server listening on port ${PORT}`);

  let createdAppId = null;
  let student1Id = null;
  let coordinator1Id = null;

  try {
    // 1. Test Login Endpoint
    console.log('\n--- 1. Testing Auth & Login ---');
    const loginResStudent = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'student1', password: 'password' })
    });
    assert(loginResStudent.status === 200, 'Student login should return status 200');
    const studentData = await loginResStudent.json();
    assert(studentData.role === 'student', 'Role of student1 should be "student"');
    student1Id = studentData.id;

    const loginResCoord = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'coordinator1', password: 'password' })
    });
    assert(loginResCoord.status === 200, 'Coordinator login should return status 200');
    const coordData = await loginResCoord.json();
    assert(coordData.role === 'coordinator', 'Role of coordinator1 should be "coordinator"');
    coordinator1Id = coordData.id;

    // 2. Test Application Creation (Saving to MySQL)
    console.log('\n--- 2. Testing Saving to MySQL (Student Submission) ---');
    const submissionData = {
      student_name: 'Alice Smith',
      company_name: 'TestCorp Inc',
      position_title: 'QA Automation Intern',
      start_date: '2026-09-01',
      end_date: '2026-12-01'
    };

    const submitRes = await fetch(`${BASE_URL}/api/applications`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-user-id': student1Id.toString()
      },
      body: JSON.stringify(submissionData)
    });
    assert(submitRes.status === 201, 'Student submission should succeed with 201');
    const submitResult = await submitRes.json();
    createdAppId = submitResult.applicationId;
    assert(createdAppId !== undefined && createdAppId !== null, 'Should return created applicationId');

    // Verify written record exists in DB
    const [dbRows] = await db.query('SELECT * FROM applications WHERE id = ?', [createdAppId]);
    assert(dbRows.length === 1, 'Database row should exist for created application');
    assert(dbRows[0].company_name === 'TestCorp Inc', 'Database company name should match input');
    assert(dbRows[0].status === 'submitted', 'Default status should be "submitted"');

    // 3. Test Permissions / Access Control
    console.log('\n--- 3. Testing Server-side Permission Restrictions ---');
    
    // Test Coordinator trying to submit a student application (Should fail with 403)
    const coordSubmitRes = await fetch(`${BASE_URL}/api/applications`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-user-id': coordinator1Id.toString()
      },
      body: JSON.stringify(submissionData)
    });
    assert(coordSubmitRes.status === 403, 'Coordinators should not be permitted to submit student applications (403)');

    // Test Student trying to approve/review their own application (Should fail with 403)
    const studentReviewRes = await fetch(`${BASE_URL}/api/applications/${createdAppId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'x-user-id': student1Id.toString()
      },
      body: JSON.stringify({ status: 'approved', coordinator_comments: 'Sneaky approve' })
    });
    assert(studentReviewRes.status === 403, 'Students should not be permitted to review applications (403)');

    // Test student viewing query limits (only own applications)
    const studentListRes = await fetch(`${BASE_URL}/api/applications`, {
      headers: { 'x-user-id': student1Id.toString() }
    });
    const studentApps = await studentListRes.json();
    const containsOtherStudentData = studentApps.some(app => app.student_name === 'Bob Jones'); // Bob Jones belongs to student2
    assert(!containsOtherStudentData, 'Student view should exclude other student records');

    // 4. Test Coordinator Review & Needs Changes / Resubmit Flow
    console.log('\n--- 4. Testing Needs Changes & Student Resubmit Flow ---');
    
    // Coordinator sets to needs_changes
    const needsChangesRes = await fetch(`${BASE_URL}/api/applications/${createdAppId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'x-user-id': coordinator1Id.toString()
      },
      body: JSON.stringify({
        status: 'needs_changes',
        coordinator_comments: 'Please update position title.'
      })
    });
    assert(needsChangesRes.status === 200, 'Coordinator request changes should return 200');

    // Student edits and resubmits
    const resubmitRes = await fetch(`${BASE_URL}/api/applications/${createdAppId}/resubmit`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'x-user-id': student1Id.toString()
      },
      body: JSON.stringify({
        student_name: 'Alice Smith',
        company_name: 'TestCorp Inc',
        position_title: 'Junior QA Engineer Intern', // revised
        start_date: '2026-09-01',
        end_date: '2026-12-01'
      })
    });
    assert(resubmitRes.status === 200, 'Student resubmit should succeed with 200');

    // Verify it is status "submitted" in DB and position updated
    const [dbRowsResubmitted] = await db.query('SELECT * FROM applications WHERE id = ?', [createdAppId]);
    assert(dbRowsResubmitted[0].status === 'submitted', 'Status should return to "submitted"');
    assert(dbRowsResubmitted[0].position_title === 'Junior QA Engineer Intern', 'Position title should be updated in DB');

    // Test that student cannot edit an application that is not in "needs_changes" state anymore
    const failedResubmitRes = await fetch(`${BASE_URL}/api/applications/${createdAppId}/resubmit`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'x-user-id': student1Id.toString()
      },
      body: JSON.stringify({
        student_name: 'Alice Smith',
        company_name: 'TestCorp Inc',
        position_title: 'Hack position',
        start_date: '2026-09-01',
        end_date: '2026-12-01'
      })
    });
    assert(failedResubmitRes.status === 400, 'Blocked student resubmission of non-needs_changes application (400)');

    // Now Coordinator approves
    const reviewRes = await fetch(`${BASE_URL}/api/applications/${createdAppId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'x-user-id': coordinator1Id.toString()
      },
      body: JSON.stringify({
        status: 'approved',
        coordinator_comments: 'Excellent profile. Approved.'
      })
    });
    assert(reviewRes.status === 200, 'Coordinator approval should return 200');

    // Verify update reflects in DB
    const [dbRowsUpdated] = await db.query('SELECT * FROM applications WHERE id = ?', [createdAppId]);
    assert(dbRowsUpdated[0].status === 'approved', 'Status should be updated to "approved" in MySQL');
    assert(dbRowsUpdated[0].coordinator_comments === 'Excellent profile. Approved.', 'Comments should be saved in MySQL');

    // 5. Test Filters (Extra Part)
    console.log('\n--- 5. Testing Search Filters ---');
    
    // Filter by company name
    const filterCompanyRes = await fetch(`${BASE_URL}/api/applications?company_name=TestCorp`, {
      headers: { 'x-user-id': coordinator1Id.toString() }
    });
    const filteredByCompany = await filterCompanyRes.json();
    assert(filteredByCompany.length > 0, 'Should find applications by company name filter');
    assert(filteredByCompany.every(app => app.company_name.includes('TestCorp')), 'All returns should contain "TestCorp"');

    // Filter by status
    const filterStatusRes = await fetch(`${BASE_URL}/api/applications?status=approved`, {
      headers: { 'x-user-id': coordinator1Id.toString() }
    });
    const filteredByStatus = await filterStatusRes.json();
    assert(filteredByStatus.length > 0, 'Should find applications by status filter');
    assert(filteredByStatus.every(app => app.status === 'approved'), 'All returns should have status "approved"');

    console.log('\n🌟 ALL TESTS PASSED SUCCESSFULLY! 🌟');
  } catch (error) {
    console.error('\n❌ TEST SUITE FAILED WITH ERROR:', error);
    process.exitCode = 1;
  } finally {
    // 6. Cleanup
    console.log('\n--- Cleaning up Test Data ---');
    if (createdAppId) {
      await db.query('DELETE FROM applications WHERE id = ?', [createdAppId]);
      console.log(`Deleted test application ID: ${createdAppId}`);
    }
    // Close resources
    server.close();
    await db.end();
    console.log('Test server closed and DB pool ended.');
  }
}

runTests();
