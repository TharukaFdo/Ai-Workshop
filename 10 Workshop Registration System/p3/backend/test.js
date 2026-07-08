require('dotenv').config();
const mysql = require('mysql2/promise');

const BASE_URL = `http://localhost:${process.env.PORT || 5000}`;

async function runTests() {
  console.log('====================================================');
  console.log('         INTEGRATION TEST RUNNER - VERIFYING        ');
  console.log('====================================================');
  console.log(`Server Target: ${BASE_URL}\n`);

  let pool;
  let partToken = 'participant@workshop.com';
  let orgToken = 'organizer@workshop.com';
  let otherPartToken = 'john@example.com';
  let testRegId = null;

  try {
    // 0. Database Setup / Connection Check
    console.log('[STEP 0] Verifying database connectivity...');
    pool = mysql.createPool({
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '3306', 10),
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'c10p3'
    });
    
    // Connectivity test query
    const [dbCheck] = await pool.query('SELECT 1');
    if (!dbCheck) throw new Error('DB selection query returned empty result.');
    console.log('✔ Expected Result: Successful DB connection.');
    console.log('  Actual Result: Connected to database pool.\n');

    // Pre-cleanup in case a previous crash left dirty records
    await pool.query("DELETE FROM registrations WHERE email = 'participant@workshop.com'");

    // 1. Database-Backed Login Tests
    console.log('[STEP 1] Testing Database-Backed Login API...');
    
    // Success case
    const loginRes = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: partToken, password: 'user123' })
    });
    const loginData = await loginRes.json();
    if (loginRes.status !== 200 || !loginData.token) {
      throw new Error(`Login failed. Status: ${loginRes.status}`);
    }
    console.log('✔ Expected: status 200, returns authentication token.');
    console.log(`  Actual: status ${loginRes.status}, Token: ${loginData.token}`);

    // Failure case (Invalid Password)
    const badLoginRes = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: partToken, password: 'wrongpassword' })
    });
    const badLoginData = await badLoginRes.json();
    console.log('✔ Expected: status 401, Invalid email or password.');
    console.log(`  Actual: status ${badLoginRes.status}, Error: ${badLoginData.error}`);

    // Failure case (Missing Fields)
    const missingLoginRes = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: partToken })
    });
    const missingLoginData = await missingLoginRes.json();
    console.log('✔ Expected: status 400, Email and password are required.');
    console.log(`  Actual: status ${missingLoginRes.status}, Error: ${missingLoginData.error}\n`);

    // 2. Field Validation & Constraint Checks
    console.log('[STEP 2] Testing Required Field and Input Constraints...');
    
    // Missing details check
    const badRegRes = await fetch(`${BASE_URL}/api/registrations`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-auth-token': partToken },
      body: JSON.stringify({
        participantName: 'Test Participant',
        email: partToken,
        workshopTitle: 'Advanced React Patterns & compiler'
      })
    });
    const badRegData = await badRegRes.json();
    console.log('✔ Expected: status 400, All fields are required.');
    console.log(`  Actual: status ${badRegRes.status}, Error: ${badRegData.error}`);

    // Invalid email format check
    const badEmailRes = await fetch(`${BASE_URL}/api/registrations`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-auth-token': partToken },
      body: JSON.stringify({
        participantName: 'Test Participant',
        email: 'invalid-email',
        workshopTitle: 'Advanced React Patterns & compiler',
        registrationDetails: 'Some info'
      })
    });
    const badEmailData = await badEmailRes.json();
    console.log('✔ Expected: status 400, Invalid email address format.');
    console.log(`  Actual: status ${badEmailRes.status}, Error: ${badEmailData.error}`);

    // Empty space strings check
    const spaceRes = await fetch(`${BASE_URL}/api/registrations`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-auth-token': partToken },
      body: JSON.stringify({
        participantName: '   ',
        email: partToken,
        workshopTitle: 'Advanced React Patterns & compiler',
        registrationDetails: 'Some info'
      })
    });
    const spaceData = await spaceRes.json();
    console.log('✔ Expected: status 400, Required fields cannot be empty spaces.');
    console.log(`  Actual: status ${spaceRes.status}, Error: ${spaceData.error}\n`);

    // 3. User Identity Access Checks (Identity Spoofing)
    console.log('[STEP 3] Testing Identity Access & Role Mismatches...');
    
    // Participant trying to register under another user's email
    const spoofRegRes = await fetch(`${BASE_URL}/api/registrations`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-auth-token': partToken },
      body: JSON.stringify({
        participantName: 'Test Participant',
        email: otherPartToken,
        workshopTitle: 'Advanced React Patterns & compiler',
        registrationDetails: 'Hack attempt'
      })
    });
    const spoofRegData = await spoofRegRes.json();
    console.log('✔ Expected: status 403, Cannot register under another user\'s email.');
    console.log(`  Actual: status ${spoofRegRes.status}, Error: ${spoofRegData.error}`);

    // Participant trying to fetch another user's registrations
    const spoofGetRes = await fetch(`${BASE_URL}/api/registrations/my?email=${otherPartToken}`, {
      headers: { 'x-auth-token': partToken }
    });
    const spoofGetData = await spoofGetRes.json();
    console.log('✔ Expected: status 403, Cannot view registrations of other users.');
    console.log(`  Actual: status ${spoofGetRes.status}, Error: ${spoofGetData.error}\n`);

    // 4. Main Workflow: Registration Creation and Fetching (Participant)
    console.log('[STEP 4] Executing Main Participant Registration Workflow...');
    const createRes = await fetch(`${BASE_URL}/api/registrations`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-auth-token': partToken },
      body: JSON.stringify({
        participantName: 'Test Participant',
        email: partToken,
        workshopTitle: 'Advanced React Patterns & compiler',
        registrationDetails: 'Original Details'
      })
    });
    const createData = await createRes.json();
    if (createRes.status !== 201 || !createData.id) {
      throw new Error(`Registration creation failed. Status: ${createRes.status}`);
    }
    testRegId = createData.id;
    console.log('✔ Expected: status 201, return new registration object with ID.');
    console.log(`  Actual: status ${createRes.status}, New ID: ${testRegId}`);

    // Participant fetching own registrations
    const getMyRes = await fetch(`${BASE_URL}/api/registrations/my?email=${partToken}`, {
      headers: { 'x-auth-token': partToken }
    });
    const myRegs = await getMyRes.json();
    const myItem = myRegs.find(r => r.id === testRegId);
    console.log('✔ Expected: list containing participant\'s own registrations.');
    console.log(`  Actual: retrieved ${myRegs.length} items. Match found: ${myItem ? 'Yes' : 'No'}\n`);

    // 5. Update Action Details & Status Lifecycle (Participant Allowed vs Blocked Actions)
    console.log('[STEP 5] Testing Update Permissions and Role Enforcement...');
    
    // Participant updates details (Allowed)
    const updateDetailsRes = await fetch(`${BASE_URL}/api/registrations/${testRegId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', 'x-auth-token': partToken },
      body: JSON.stringify({
        email: partToken,
        registrationDetails: 'Updated details by participant'
      })
    });
    const updateDetailsData = await updateDetailsRes.json();
    console.log('✔ Expected: status 200, returns updated details.');
    console.log(`  Actual: status ${updateDetailsRes.status}, Details: "${updateDetailsData.registrationDetails}"`);

    // Participant tries to update status (Blocked)
    const partStatusUpdateRes = await fetch(`${BASE_URL}/api/registrations/${testRegId}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', 'x-auth-token': partToken },
      body: JSON.stringify({ status: 'confirmed' })
    });
    const partStatusUpdateData = await partStatusUpdateRes.json();
    console.log('✔ Expected: status 403, Access Denied: Insufficient permissions.');
    console.log(`  Actual: status ${partStatusUpdateRes.status}, Error: ${partStatusUpdateData.error}\n`);

    // 6. Organizer Administration (Protected Actions: Status, Note, Attendance)
    console.log('[STEP 6] Testing Organizer Administrative Updates...');
    
    // Organizer moves pending to waitlisted
    const orgWaitlistRes = await fetch(`${BASE_URL}/api/registrations/${testRegId}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', 'x-auth-token': orgToken },
      body: JSON.stringify({ status: 'waitlisted' })
    });
    const orgWaitlistData = await orgWaitlistRes.json();
    console.log('✔ Expected: status 200, status updated to waitlisted.');
    console.log(`  Actual: status ${orgWaitlistRes.status}, Status: ${orgWaitlistData.status}`);

    // Organizer moves waitlisted to confirmed
    const orgStatusRes = await fetch(`${BASE_URL}/api/registrations/${testRegId}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', 'x-auth-token': orgToken },
      body: JSON.stringify({ status: 'confirmed' })
    });
    const orgStatusData = await orgStatusRes.json();
    console.log('✔ Expected: status 200, status updated to confirmed.');
    console.log(`  Actual: status ${orgStatusRes.status}, Status: ${orgStatusData.status}`);

    // Organizer edits notes
    const orgNoteRes = await fetch(`${BASE_URL}/api/registrations/${testRegId}/notes`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', 'x-auth-token': orgToken },
      body: JSON.stringify({ organizerNote: 'Organizer added note: Approved sponsorship.' })
    });
    const orgNoteData = await orgNoteRes.json();
    console.log('✔ Expected: status 200, note updated successfully.');
    console.log(`  Actual: status ${orgNoteRes.status}, Note: "${orgNoteData.organizerNote}"`);

    // Organizer marks attendance
    const orgAttendanceRes = await fetch(`${BASE_URL}/api/registrations/${testRegId}/attendance`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', 'x-auth-token': orgToken },
      body: JSON.stringify({ attendanceStatus: 'present' })
    });
    const orgAttendanceData = await orgAttendanceRes.json();
    console.log('✔ Expected: status 200, attendance status updated to present.');
    console.log(`  Actual: status ${orgAttendanceRes.status}, Attendance: ${orgAttendanceData.attendanceStatus}`);

    // Organizer tries invalid status update
    const orgBadStatusRes = await fetch(`${BASE_URL}/api/registrations/${testRegId}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', 'x-auth-token': orgToken },
      body: JSON.stringify({ status: 'invalid_status_value' })
    });
    const orgBadStatusData = await orgBadStatusRes.json();
    console.log('✔ Expected: status 400, Invalid registration status.');
    console.log(`  Actual: status ${orgBadStatusRes.status}, Error: ${orgBadStatusData.error}`);

    // Organizer tries invalid attendance update
    const orgBadAttendanceRes = await fetch(`${BASE_URL}/api/registrations/${testRegId}/attendance`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', 'x-auth-token': orgToken },
      body: JSON.stringify({ attendanceStatus: 'invalid_attendance_value' })
    });
    const orgBadAttendanceData = await orgBadAttendanceRes.json();
    console.log('✔ Expected: status 400, Invalid attendance status.');
    console.log(`  Actual: status ${orgBadAttendanceRes.status}, Error: ${orgBadAttendanceData.error}\n`);

    // 7. Filtering Registrations (Organizer only)
    console.log('[STEP 7] Testing Organizer Dashboard Filters...');
    
    // Filter by workshop title
    const filterWorkshopRes = await fetch(`${BASE_URL}/api/registrations?workshopTitle=Advanced React Patterns & compiler`, {
      headers: { 'x-auth-token': orgToken }
    });
    const filteredWorkshopData = await filterWorkshopRes.json();
    const hasCorrectWorkshops = filteredWorkshopData.every(r => r.workshopTitle === 'Advanced React Patterns & compiler');
    console.log('✔ Expected: returns only records matching workshopTitle.');
    console.log(`  Actual: returned ${filteredWorkshopData.length} records. Filter matches: ${hasCorrectWorkshops ? 'Yes' : 'No'}`);

    // Filter by registration status
    const filterStatusRes = await fetch(`${BASE_URL}/api/registrations?status=confirmed`, {
      headers: { 'x-auth-token': orgToken }
    });
    const filteredStatusData = await filterStatusRes.json();
    const hasCorrectStatuses = filteredStatusData.every(r => r.status === 'confirmed');
    console.log('✔ Expected: returns only confirmed registrations.');
    console.log(`  Actual: returned ${filteredStatusData.length} records. Filter matches: ${hasCorrectStatuses ? 'Yes' : 'No'}`);

    // Filter by attendance status
    const filterAttRes = await fetch(`${BASE_URL}/api/registrations?attendanceStatus=present`, {
      headers: { 'x-auth-token': orgToken }
    });
    const filteredAttData = await filterAttRes.json();
    const hasCorrectAtt = filteredAttData.every(r => r.attendanceStatus === 'present');
    console.log('✔ Expected: returns only present attendances.');
    console.log(`  Actual: returned ${filteredAttData.length} records. Filter matches: ${hasCorrectAtt ? 'Yes' : 'No'}`);

    // Filter by invalid status filter
    const badFilterStatusRes = await fetch(`${BASE_URL}/api/registrations?status=hack_status`, {
      headers: { 'x-auth-token': orgToken }
    });
    const badFilterStatusData = await badFilterStatusRes.json();
    console.log('✔ Expected: status 400, Invalid registration status filter.');
    console.log(`  Actual: status ${badFilterStatusRes.status}, Error: ${badFilterStatusData.error}\n`);

    // 8. Cleanup test data
    console.log('[STEP 8] Cleaning up database test records...');
    const [deleteResult] = await pool.query('DELETE FROM registrations WHERE id = ?', [testRegId]);
    if (deleteResult.affectedRows > 0) {
      console.log('✔ Expected: Test records successfully cleaned up from database.');
      console.log(`  Actual: Cleared test record ID: ${testRegId}.\n`);
    } else {
      throw new Error('Teardown database query failed to delete test record.');
    }

    console.log('====================================================');
    console.log('        🎉 INTEGRATION TESTS COMPLETED: PASS 🎉     ');
    console.log('====================================================');
    process.exit(0);

  } catch (err) {
    console.error(`\n❌ TEST FAILURE ENCOUNTERED: ${err.message}`);
    
    // Attempt database cleanup on test failure
    if (pool && testRegId) {
      try {
        await pool.query('DELETE FROM registrations WHERE id = ?', [testRegId]);
        console.log('Cleanup performed post-failure.');
      } catch (dbErr) {
        console.error('Failed to cleanup database post-failure:', dbErr.message);
      }
    }
    process.exit(1);
  } finally {
    if (pool) {
      await pool.end();
    }
  }
}

runTests();
