const assert = require('assert');
const mysql = require('mysql2/promise');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const BASE_URL = 'http://localhost:8081';

// Setup database connection for verification and cleanup
async function getDbConnection() {
  return await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '3306'),
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'c10p2'
  });
}

async function runTests() {
  console.log('--- STARTING AUTOMATED BACKEND API TESTS ---');
  let dbConnection;
  try {
    dbConnection = await getDbConnection();
  } catch (err) {
    console.error('CRITICAL: Cannot connect to MySQL for test verification/cleanup.', err.message);
    process.exit(1);
  }

  // Define unique test identifiers
  const TEST_LABEL = 'TEST_RECORD_' + Math.random().toString(36).substring(7);
  const TEST_NAME = 'Test User ' + TEST_LABEL;
  const TEST_EMAIL = `test_${TEST_LABEL}@example.com`;
  const TEST_WORKSHOP = 'Building REST APIs with Express & MySQL';

  let organizerToken = '';
  let participantToken = '';
  let participantUserId = null;
  let testRegistrationId = null;

  try {
    // -------------------------------------------------------------
    // Test 1: Authentication & Login Checks
    // -------------------------------------------------------------
    console.log('\n[TEST 1] Authenticating organizer and participant roles...');
    
    // 1a. Invalid Login
    const badLoginRes = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'organizer', password: 'wrong_password' })
    });
    assert.strictEqual(badLoginRes.status, 401, 'Invalid login should return 401 Unauthorized');
    console.log('✓ Rejected invalid credentials correctly.');

    // 1b. Organizer Login
    const orgLoginRes = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'organizer', password: 'password123' })
    });
    assert.strictEqual(orgLoginRes.status, 200, 'Organizer login failed');
    const orgData = await orgLoginRes.json();
    assert.ok(orgData.token, 'No token returned for organizer login');
    assert.strictEqual(orgData.user.role, 'organizer', 'Expected role to be organizer');
    organizerToken = orgData.token;
    console.log('✓ Organizer logged in successfully.');

    // 1c. Participant Login
    const partLoginRes = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'participant', password: 'password123' })
    });
    assert.strictEqual(partLoginRes.status, 200, 'Participant login failed');
    const partData = await partLoginRes.json();
    assert.ok(partData.token, 'No token returned for participant login');
    assert.strictEqual(partData.user.role, 'participant', 'Expected role to be participant');
    participantToken = partData.token;
    participantUserId = partData.user.id;
    console.log('✓ Participant logged in successfully.');

    // -------------------------------------------------------------
    // Test 2: Validation on registration creation
    // -------------------------------------------------------------
    console.log('\n[TEST 2] Verifying registration validation checks...');
    
    // 2a. Attempt without auth token
    const unauthCreateRes = await fetch(`${BASE_URL}/api/registrations`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        participantName: TEST_NAME,
        email: TEST_EMAIL,
        workshopTitle: TEST_WORKSHOP
      })
    });
    assert.strictEqual(unauthCreateRes.status, 401, 'Registration without session token should return 401');
    console.log('✓ Rejected unauthenticated registration request.');

    // 2b. Attempt with missing fields
    const invalidCreateRes = await fetch(`${BASE_URL}/api/registrations`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${participantToken}`
      },
      body: JSON.stringify({
        participantName: '', // Empty
        email: TEST_EMAIL,
        workshopTitle: TEST_WORKSHOP
      })
    });
    assert.strictEqual(invalidCreateRes.status, 400, 'Registration with empty name should return 400');
    console.log('✓ Rejected invalid registration missing fields.');

    // 2c. Successful registration
    const createRes = await fetch(`${BASE_URL}/api/registrations`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${participantToken}`
      },
      body: JSON.stringify({
        participantName: TEST_NAME,
        email: TEST_EMAIL,
        workshopTitle: TEST_WORKSHOP,
        registrationDetails: 'Testing validation constraints'
      })
    });
    assert.strictEqual(createRes.status, 201, 'Participant registration should succeed');
    const createData = await createRes.json();
    assert.ok(createData.registrationId, 'Should return created registration ID');
    testRegistrationId = createData.registrationId;
    console.log('✓ Created test registration successfully.');

    // -------------------------------------------------------------
    // Test 3: Restricted Actions Protection & Spoofing Checks
    // -------------------------------------------------------------
    console.log('\n[TEST 3] Running role-spoofing and resource protection checks...');

    // 3a. Participant trying to query other people's registrations
    const getListAsPartRes = await fetch(`${BASE_URL}/api/registrations`, {
      headers: { 'Authorization': `Bearer ${participantToken}` }
    });
    assert.strictEqual(getListAsPartRes.status, 403, 'Participant fetching organizer list should return 403');
    console.log('✓ Blocked participant from reading other registrations.');

    // 3b. Participant trying to mark their own attendance
    const updateAttendanceAsPartRes = await fetch(`${BASE_URL}/api/registrations/${testRegistrationId}`, {
      method: 'PUT',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${participantToken}`
      },
      body: JSON.stringify({ attendanceStatus: 'present' })
    });
    assert.strictEqual(updateAttendanceAsPartRes.status, 403, 'Participant marking attendance should return 403');
    console.log('✓ Blocked participant from updating attendanceStatus.');

    // 3c. Participant trying to write organizer notes
    const updateNotesAsPartRes = await fetch(`${BASE_URL}/api/registrations/${testRegistrationId}`, {
      method: 'PUT',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${participantToken}`
      },
      body: JSON.stringify({ organizerNote: 'I am organizer now!' })
    });
    assert.strictEqual(updateNotesAsPartRes.status, 403, 'Participant editing organizer notes should return 403');
    console.log('✓ Blocked participant from writing organizerNote.');

    // 3d. Participant trying to self-confirm (PUT status to confirmed)
    const selfConfirmRes = await fetch(`${BASE_URL}/api/registrations/${testRegistrationId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${participantToken}`
      },
      body: JSON.stringify({ status: 'confirmed' })
    });
    assert.strictEqual(selfConfirmRes.status, 403, 'Participant trying to self-confirm status should return 403');
    console.log('✓ Blocked participant from self-confirming registration status.');

    // 3e. Participant can successfully cancel their own registration
    const selfCancelRes = await fetch(`${BASE_URL}/api/registrations/${testRegistrationId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${participantToken}`
      },
      body: JSON.stringify({ status: 'cancelled' })
    });
    assert.strictEqual(selfCancelRes.status, 200, 'Participant should be allowed to cancel their own registration');
    console.log('✓ Participant successfully cancelled their own registration.');

    // -------------------------------------------------------------
    // Test 4: Organizer Actions (Mark Attendance and Notes)
    // -------------------------------------------------------------
    console.log('\n[TEST 4] Testing organizer updates for notes, status, and attendance...');

    // 4a. Update Status to waitlisted as organizer
    const updateWaitlistRes = await fetch(`${BASE_URL}/api/registrations/${testRegistrationId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${organizerToken}`
      },
      body: JSON.stringify({ status: 'waitlisted' })
    });
    assert.strictEqual(updateWaitlistRes.status, 200, 'Organizer should be allowed to waitlist registrations');
    console.log('✓ Organizer successfully waitlisted the registration.');

    // 4b. Update Note & Attendance & Confirm status from waitlisted
    const updateRes = await fetch(`${BASE_URL}/api/registrations/${testRegistrationId}`, {
      method: 'PUT',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${organizerToken}`
      },
      body: JSON.stringify({
        status: 'confirmed',
        attendanceStatus: 'present',
        organizerNote: 'Verified qualifications and marked present.'
      })
    });
    assert.strictEqual(updateRes.status, 200, 'Organizer update should succeed');
    console.log('✓ Organizer updated status from waitlisted to confirmed, notes, and attendance.');

    // Verify in database directly
    const [rows] = await dbConnection.query('SELECT * FROM registrations WHERE id = ?', [testRegistrationId]);
    assert.strictEqual(rows.length, 1, 'Record should exist in database');
    assert.strictEqual(rows[0].status, 'confirmed', 'Expected confirmed status');
    assert.strictEqual(rows[0].attendanceStatus, 'present', 'Expected present attendance');
    assert.strictEqual(rows[0].organizerNote, 'Verified qualifications and marked present.', 'Expected matched note');
    console.log('✓ Checked database record matches updated state.');

    // -------------------------------------------------------------
    // Test 5: Query Filters (Organizer list)
    // -------------------------------------------------------------
    console.log('\n[TEST 5] Testing workshop title, status, and attendance filters...');

    // 5a. Match correct workshop title
    const matchWorkshopRes = await fetch(`${BASE_URL}/api/registrations?workshopTitle=${encodeURIComponent(TEST_WORKSHOP)}`, {
      headers: { 'Authorization': `Bearer ${organizerToken}` }
    });
    const matchWorkshopData = await matchWorkshopRes.json();
    assert.ok(matchWorkshopData.length >= 1, 'Should find at least 1 registration for the workshop');
    assert.ok(matchWorkshopData.some(r => r.id === testRegistrationId), 'Should contain our test record');
    console.log('✓ Filter by workshopTitle successfully returned the record.');

    // 5b. Match correct status
    const matchStatusRes = await fetch(`${BASE_URL}/api/registrations?status=confirmed`, {
      headers: { 'Authorization': `Bearer ${organizerToken}` }
    });
    const matchStatusData = await matchStatusRes.json();
    assert.ok(matchStatusData.some(r => r.id === testRegistrationId), 'Should contain confirmed record');
    console.log('✓ Filter by status successfully returned the record.');

    // 5c. Match correct attendance
    const matchAttendanceRes = await fetch(`${BASE_URL}/api/registrations?attendanceStatus=present`, {
      headers: { 'Authorization': `Bearer ${organizerToken}` }
    });
    const matchAttendanceData = await matchAttendanceRes.json();
    assert.ok(matchAttendanceData.some(r => r.id === testRegistrationId), 'Should contain present record');
    console.log('✓ Filter by attendanceStatus successfully returned the record.');

    console.log('\n--- ALL AUTOMATED BACKEND TESTS PASSED SUCCESSFULLY ---');
  } catch (error) {
    console.error('\n❌ TEST SUITE FAILED:', error);
    process.exitCode = 1;
  } finally {
    // -------------------------------------------------------------
    // Cleanup: Remove all test records matching TEST_LABEL
    // -------------------------------------------------------------
    console.log('\nCleaning up test records from database...');
    try {
      if (testRegistrationId) {
        await dbConnection.query('DELETE FROM registrations WHERE id = ?', [testRegistrationId]);
        console.log('✓ Cleaned up test registration record.');
      }
      await dbConnection.query('DELETE FROM registrations WHERE participantName LIKE ?', [`%${TEST_LABEL}%`]);
      console.log('Cleanup complete.');
    } catch (cleanErr) {
      console.error('Failed to clean up test records:', cleanErr.message);
    }
    await dbConnection.end();
  }
}

runTests();
