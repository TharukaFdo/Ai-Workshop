const http = require('http');
const { spawn } = require('child_process');
const db = require('./db');

const request = (method, path, headers = {}, body = null) => {
  return new Promise((resolve, reject) => {
    const req = http.request({
      hostname: 'localhost',
      port: 5001,
      path: `/api${path}`,
      method: method,
      headers: {
        'Content-Type': 'application/json',
        ...headers
      }
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve({
            statusCode: res.statusCode,
            body: data ? JSON.parse(data) : null
          });
        } catch (e) {
          resolve({ statusCode: res.statusCode, body: data });
        }
      });
    });

    req.on('error', reject);
    if (body) {
      req.write(JSON.stringify(body));
    }
    req.end();
  });
};

const runTests = async () => {
  console.log('--- STARTING COMPREHENSIVE WORKFLOW & SECURITY TESTS ---');

  // Test 1: Authentic Login Verification
  console.log('\nTest 1: Verifying authentic login...');
  const studentLogin = await request('POST', '/auth/login', {}, { username: 'student1', password: 'student123' });
  const coordLogin = await request('POST', '/auth/login', {}, { username: 'coordinator1', password: 'coord123' });
  const failLogin = await request('POST', '/auth/login', {}, { username: 'student1', password: 'wrongpassword' });

  if (studentLogin.statusCode !== 200 || !studentLogin.body.token) {
    throw new Error('Student login failed');
  }
  if (coordLogin.statusCode !== 200 || !coordLogin.body.token) {
    throw new Error('Coordinator login failed');
  }
  if (failLogin.statusCode !== 401) {
    throw new Error('Server accepted incorrect password');
  }
  console.log('✓ Login verification checks passed.');

  const student1 = studentLogin.body;
  const coordinator = coordLogin.body;

  // Login as student2 for isolation checks
  const student2Login = await request('POST', '/auth/login', {}, { username: 'student2', password: 'student123' });
  const student2 = student2Login.body;

  // Test 2: Invalid Session Token Security Guard
  console.log('\nTest 2: Testing invalid session token behavior...');
  const invalidTokenRes = await request('GET', '/applications', { 'Authorization': 'Bearer fake-invalid-token' });
  if (invalidTokenRes.statusCode !== 401) {
    throw new Error('Security vulnerability: Server accepted a fake session token');
  }
  console.log('✓ Correctly rejected fake session token (401 Unauthorized)');

  // Test 3: Main Submission & Parameter Validations
  console.log('\nTest 3: Verifying application submission validations...');
  
  // A. Missing required fields
  const missingFieldRes = await request('POST', '/applications', { 'Authorization': `Bearer ${student1.token}` }, {
    companyName: 'TEST_Google'
    // missing other fields
  });
  if (missingFieldRes.statusCode !== 400) {
    throw new Error('Server allowed submission with missing fields');
  }
  console.log('✓ Correctly rejected missing required fields (400 Bad Request)');

  // B. Date sequence validation
  const invalidDatesRes = await request('POST', '/applications', { 'Authorization': `Bearer ${student1.token}` }, {
    companyName: 'TEST_Google',
    positionTitle: 'Intern',
    startDate: '2026-10-02',
    endDate: '2026-10-01', // End date before start date
    submittedDate: '2026-07-08'
  });
  if (invalidDatesRes.statusCode !== 400 || !invalidDatesRes.body.error.includes('Date')) {
    throw new Error('Server allowed invalid date sequence');
  }
  console.log('✓ Correctly rejected end date before start date (400 Bad Request)');

  // C. Valid submission
  const validAppPayload = {
    companyName: 'TEST_AcmeCorp',
    positionTitle: 'Software Engineer Intern',
    startDate: '2026-10-01',
    endDate: '2027-04-01',
    submittedDate: '2026-07-08'
  };
  const submitRes = await request('POST', '/applications', { 'Authorization': `Bearer ${student1.token}` }, validAppPayload);
  if (submitRes.statusCode !== 201 || submitRes.body.status !== 'submitted') {
    throw new Error('Application submission failed');
  }
  const createdApp = submitRes.body;
  console.log('✓ Successfully created valid test application:', createdApp.id);

  // Test 4: Action Protection (Approve/Reject & Comments)
  console.log('\nTest 4: Verifying action protections for approve/reject & comments...');
  
  // Students cannot update status or comments
  const studentActionRes = await request('PUT', `/applications/${createdApp.id}`, { 'Authorization': `Bearer ${student1.token}` }, {
    status: 'approved',
    coordinatorComment: 'Student comments!'
  });
  if (studentActionRes.statusCode !== 403) {
    throw new Error('Vulnerability: Student allowed to self-approve or write comments');
  }
  console.log('✓ Correctly blocked student attempt to approve/comment (403 Forbidden)');

  // Coordinators CAN update status and comments
  const coordActionRes = await request('PUT', `/applications/${createdApp.id}`, { 'Authorization': `Bearer ${coordinator.token}` }, {
    status: 'underReview',
    coordinatorComment: 'Under review details noted.'
  });
  if (coordActionRes.statusCode !== 200 || coordActionRes.body.status !== 'underReview') {
    throw new Error('Coordinator failed to update application status/comments');
  }
  console.log('✓ Coordinator successfully updated status to underReview and added comments');

  // Test 5: Role & Identity Spoofing Guards
  console.log('\nTest 5: Verifying database role/ownership spoofing guards...');

  // A. Header Spoofing (Student sends role header)
  const headerSpoofRes = await request('PUT', `/applications/${createdApp.id}`, { 
    'Authorization': `Bearer ${student1.token}`,
    'x-user-role': 'coordinator' // Attempt to bypass via headers
  }, { status: 'approved' });
  if (headerSpoofRes.statusCode !== 403) {
    throw new Error('Vulnerability: Student was able to perform coordinator action with headers');
  }
  console.log('✓ Successfully blocked forged x-user-role headers');

  // B. Body parameters / studentName Spoofing
  // A student attempts to submit an application for another user by injecting another username or student_id in the body.
  const bodySpoofRes = await request('POST', '/applications', { 'Authorization': `Bearer ${student1.token}` }, {
    ...validAppPayload,
    companyName: 'TEST_SpoofBody',
    student_id: student2.id, // Trying to map application to student2
    studentName: 'Student Two' // Trying to spoof studentName
  });
  if (bodySpoofRes.statusCode === 201) {
    // Check if the application was correctly linked to student1 in the database, NOT student2/Student Two
    if (bodySpoofRes.body.studentName === student1.username) {
      console.log('✓ Blocked body parameter spoofing: Application was linked to verified user name:', bodySpoofRes.body.studentName);
    } else {
      throw new Error('Vulnerability: Backend accepted user/id details sent directly in the request body');
    }
  } else {
    console.log('✓ Body parameter spoofing correctly rejected by validation');
  }

  // C. Ownership query parameter isolation
  // Student 2 tries to fetch Student 1's applications by passing student_id override in query or path
  const student1AppList = await request('GET', '/applications', { 'Authorization': `Bearer ${student2.token}` });
  const containsStudent1App = student1AppList.body.some(app => app.id === createdApp.id);
  if (containsStudent1App) {
    throw new Error('Vulnerability: Student 2 allowed to view Student 1\'s private applications');
  }
  console.log('✓ Correctly enforced student data isolation: Student 2 cannot query/see Student 1 applications');

  // Test 6: Filtering applications
  console.log('\nTest 6: Verifying company and status filters...');
  
  // A. Filter by company name
  const filterCompanyRes = await request('GET', `/applications?companyName=TEST_Acme`, { 'Authorization': `Bearer ${coordinator.token}` });
  const allAcme = filterCompanyRes.body.every(app => app.companyName.includes('TEST_Acme'));
  if (!allAcme || filterCompanyRes.body.length === 0) {
    throw new Error('Company filter returned incorrect or empty results');
  }
  console.log(`✓ Filter by company name ('TEST_Acme') matched only correct records (Count: ${filterCompanyRes.body.length})`);

  // B. Filter by status
  // Let's approve the application first
  await request('PUT', `/applications/${createdApp.id}`, { 'Authorization': `Bearer ${coordinator.token}` }, { status: 'approved' });

  const filterStatusRes = await request('GET', `/applications?status=approved`, { 'Authorization': `Bearer ${coordinator.token}` });
  const allApproved = filterStatusRes.body.every(app => app.status === 'approved');
  if (!allApproved || filterStatusRes.body.length === 0) {
    throw new Error('Status filter returned incorrect or empty results');
  }
  console.log(`✓ Filter by status ('approved') matched only correct records (Count: ${filterStatusRes.body.length})`);

  // Test 7: Changes Requested and Student Resubmission Workflow
  console.log('\nTest 7: Verifying changesRequested & resubmission workflow...');
  
  // A. Coordinator requests changes
  const requestChangesRes = await request('PUT', `/applications/${createdApp.id}`, { 'Authorization': `Bearer ${coordinator.token}` }, {
    status: 'changesRequested',
    coordinatorComment: 'Please update company timeline details.'
  });
  if (requestChangesRes.statusCode !== 200 || requestChangesRes.body.status !== 'changesRequested') {
    console.error('Debug Details - Status:', requestChangesRes.statusCode, 'Body:', requestChangesRes.body);
    throw new Error('Coordinator failed to request changes on application');
  }
  console.log('✓ Coordinator successfully requested changes on application');

  // B. Student attempts to edit and resubmit
  const resubmitPayload = {
    companyName: 'TEST_AcmeCorpResubmitted',
    positionTitle: 'Software Engineer Intern (Updated)',
    startDate: '2026-10-15',
    endDate: '2027-04-15'
  };
  const resubmitRes = await request('PUT', `/applications/${createdApp.id}/resubmit`, { 'Authorization': `Bearer ${student1.token}` }, resubmitPayload);
  if (resubmitRes.statusCode !== 200 || resubmitRes.body.status !== 'submitted' || resubmitRes.body.companyName !== 'TEST_AcmeCorpResubmitted') {
    throw new Error('Student failed to edit and resubmit application');
  }
  console.log('✓ Student successfully edited and resubmitted application (reverted status to submitted)');

  // C. Student tries to edit and resubmit application NOT in changesRequested status (since it is now 'submitted')
  const doubleResubmitRes = await request('PUT', `/applications/${createdApp.id}/resubmit`, { 'Authorization': `Bearer ${student1.token}` }, resubmitPayload);
  if (doubleResubmitRes.statusCode !== 400) {
    throw new Error('Security vulnerability: Student was allowed to edit/resubmit an application not in changesRequested status');
  }
  console.log('✓ Blocked student editing attempt when status is not changesRequested');

  console.log('\n--- CLEANING UP DATABASE TEST RECORDS ---');
  const [cleanupResult] = await db.query("DELETE FROM applications WHERE companyName LIKE 'TEST_%'");
  console.log(`✓ Successfully cleaned up test database entries (Deleted row count: ${cleanupResult.affectedRows})`);

  console.log('\n--- ALL WORKFLOW & SECURITY TESTS PASSED ---');
};

// Reset database first, then run tests
console.log('Resetting database...');
const dbSetup = spawn('node', ['db-setup.js'], { stdio: 'inherit' });
dbSetup.on('close', (code) => {
  if (code !== 0) {
    console.error('Database reset failed');
    process.exit(1);
  }
  runTests().catch(err => {
    console.error(err);
    // Attempt database cleanup even on failure
    db.query("DELETE FROM applications WHERE companyName LIKE 'TEST_%'")
      .then(() => {
        console.log('Cleanup completed on failure.');
        process.exit(1);
      })
      .catch((e) => {
        console.error('Cleanup failed:', e.message);
        process.exit(1);
      });
  });
});
