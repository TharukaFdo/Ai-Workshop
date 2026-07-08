process.env.PORT = 5002; // Set test port before importing index.js to prevent EADDRINUSE collision
import assert from 'assert';
import pool from './db.js';

const { server } = await import('./index.js'); // Dynamic import to run after setting PORT

const TEST_PORT = 5002;
const BASE_URL = `http://localhost:${TEST_PORT}`;

async function runTests() {
  console.log('🧪 Starting Live Backend Integration & Spoofing Tests...');

  // Prepare database test users
  console.log('🧹 Preparing database test accounts...');
  await pool.query("INSERT IGNORE INTO users (username, password, role) VALUES ('test_staff', 'password123', 'Staff')");
  await pool.query("INSERT IGNORE INTO users (username, password, role) VALUES ('test_assistant', 'password123', 'Assistant')");
  
  // Clear any old test bookings/sessions
  await pool.query("DELETE FROM bookings WHERE requestedUser = 'test_staff'");
  await pool.query("DELETE FROM sessions WHERE username IN ('test_staff', 'test_assistant')");

  try {
    // Test 1: Secure Login & Token Generation
    console.log('👉 Test 1: Secure Login & Token Generation');
    const loginRes = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'test_staff', password: 'password123' })
    });
    assert.strictEqual(loginRes.status, 200);
    const loginData = await loginRes.json();
    assert.ok(loginData.token, 'Should return a valid session token');
    const staffToken = loginData.token;

    // Login assistant
    const astLoginRes = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'test_assistant', password: 'password123' })
    });
    const astLoginData = await astLoginRes.json();
    const assistantToken = astLoginData.token;

    // Test 2: Invalid Login credentials
    console.log('👉 Test 2: Invalid Login');
    const badLoginRes = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'test_staff', password: 'wrong_password' })
    });
    assert.strictEqual(badLoginRes.status, 401);

    // Test 3: Past Date validation check
    console.log('👉 Test 3: Booking Past Date Prevention');
    const pastRes = await fetch(`${BASE_URL}/api/bookings`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${staffToken}`
      },
      body: JSON.stringify({
        equipmentName: 'PCR Machine',
        bookingDate: '2020-01-01',
        startTime: '10:00:00',
        endTime: '12:00:00',
        purpose: 'Test validation'
      })
    });
    assert.strictEqual(pastRes.status, 400);

    // Test 4: Successful Booking Creation
    console.log('👉 Test 4: Successful Booking Creation');
    const createRes = await fetch(`${BASE_URL}/api/bookings`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${staffToken}`
      },
      body: JSON.stringify({
        equipmentName: 'Centrifuge B',
        bookingDate: '2027-12-31',
        startTime: '09:00:00',
        endTime: '11:00:00',
        purpose: 'Integration Test Booking'
      })
    });
    assert.strictEqual(createRes.status, 201);
    const createData = await createRes.json();
    const testBookingId = createData.bookingId;
    assert.ok(testBookingId);

    // Test 5: Role Boundary (Staff cannot approve/reject bookings)
    console.log('👉 Test 5: Role Boundary Protection (Staff cannot update status)');
    const unauthorizedRes = await fetch(`${BASE_URL}/api/bookings/${testBookingId}/status`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${staffToken}`
      },
      body: JSON.stringify({
        status: 'Approved',
        assistantComment: 'Sneaky approve'
      })
    });
    assert.strictEqual(unauthorizedRes.status, 403);

    // Test 6: Rejection Comment Validation
    console.log('👉 Test 6: Rejection Comment Check');
    const rejectCommentRes = await fetch(`${BASE_URL}/api/bookings/${testBookingId}/status`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${assistantToken}`
      },
      body: JSON.stringify({
        status: 'Rejected',
        assistantComment: ''
      })
    });
    assert.strictEqual(rejectCommentRes.status, 400);

    // Test 7: Successful Status update (Assistant rejects with comment)
    console.log('👉 Test 7: Assistant Rejection Action');
    const rejectRes = await fetch(`${BASE_URL}/api/bookings/${testBookingId}/status`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${assistantToken}`
      },
      body: JSON.stringify({
        status: 'Rejected',
        assistantComment: 'Clean rejection'
      })
    });
    assert.strictEqual(rejectRes.status, 200);

    // Test 8: Filter booking list by status
    console.log('👉 Test 8: Booking List Filtering Validation');
    const filterRes = await fetch(`${BASE_URL}/api/bookings?status=Rejected`, {
      headers: { 'Authorization': `Bearer ${staffToken}` }
    });
    const filterData = await filterRes.json();
    assert.strictEqual(filterRes.status, 200);
    assert.ok(filterData.every(b => b.status === 'Rejected'));

    // Test 9: Spoofing Check - Client headers ignored
    console.log('👉 Test 9: Spoofing Check - Custom headers (x-user-role) are ignored');
    const spoofHeaderRes = await fetch(`${BASE_URL}/api/bookings`, {
      headers: {
        'x-user-role': 'Assistant',
        'x-user-name': 'clara_assistant'
      }
    });
    assert.strictEqual(spoofHeaderRes.status, 401, 'Should reject because bearer token is missing');

    // Test 10: Spoofing Check - Body ownership manipulation
    console.log('👉 Test 10: Spoofing Check - Body ownership parameter manipulation is ignored');
    const spoofBodyRes = await fetch(`${BASE_URL}/api/bookings`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${staffToken}`
      },
      body: JSON.stringify({
        equipmentName: 'PCR Machine',
        bookingDate: '2027-12-31',
        startTime: '13:00:00',
        endTime: '15:00:00',
        purpose: 'Attempting to forge requestedUser in body',
        requestedUser: 'alice_staff' // Client attempts to create booking for Alice
      })
    });
    assert.strictEqual(spoofBodyRes.status, 201);
    const spoofBodyData = await spoofBodyRes.json();
    const spoofBookingId = spoofBodyData.bookingId;

    // Verify in database that it was actually created under 'test_staff' and NOT 'alice_staff'
    const [dbRows] = await pool.query('SELECT requestedUser FROM bookings WHERE id = ?', [spoofBookingId]);
    assert.strictEqual(dbRows[0].requestedUser, 'test_staff', 'Ownership must be determined by session, not client request body.');

    // Test 11: Spoofing Check - Query parameter scope validation
    console.log('👉 Test 11: Spoofing Check - Staff cannot access other users bookings via query parameters');
    
    // Seed a booking for bob_staff
    await pool.query(
      "INSERT INTO bookings (equipmentName, requestedUser, bookingDate, startTime, endTime, purpose, status) VALUES ('PCR Machine', 'bob_staff', '2027-12-31', '10:00:00', '11:00:00', 'Bob booking', 'Pending')"
    );

    // test_staff tries to fetch all bookings or forge a different requestedUser query param
    const spoofQueryRes = await fetch(`${BASE_URL}/api/bookings?requestedUser=bob_staff`, {
      headers: { 'Authorization': `Bearer ${staffToken}` }
    });
    const spoofQueryData = await spoofQueryRes.json();
    assert.strictEqual(spoofQueryRes.status, 200);
    // Asserts that no bookings belonging to bob_staff are returned to test_staff
    assert.ok(spoofQueryData.every(b => b.requestedUser === 'test_staff'), 'Staff should only see bookings that they own.');

    // Test 12: Valid Collection & Return Transitions
    console.log('👉 Test 12: Valid Collection & Return Transitions');
    
    // First create a new booking request and approve it
    const newBookingRes = await fetch(`${BASE_URL}/api/bookings`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${staffToken}`
      },
      body: JSON.stringify({
        equipmentName: 'Autoclave',
        bookingDate: '2027-12-31',
        startTime: '08:00:00',
        endTime: '10:00:00',
        purpose: 'Test transitions'
      })
    });
    const newBookingData = await newBookingRes.json();
    const transBookingId = newBookingData.bookingId;

    // 1. Pending -> Approved (Valid)
    const approveRes = await fetch(`${BASE_URL}/api/bookings/${transBookingId}/status`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${assistantToken}`
      },
      body: JSON.stringify({ status: 'Approved', assistantComment: 'Valid approve' })
    });
    assert.strictEqual(approveRes.status, 200);

    // 2. Approved -> Collected (Valid)
    const collectRes = await fetch(`${BASE_URL}/api/bookings/${transBookingId}/status`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${assistantToken}`
      },
      body: JSON.stringify({ status: 'Collected' })
    });
    assert.strictEqual(collectRes.status, 200);

    // Verify database shows Collected
    const [dbRowsCol] = await pool.query('SELECT status FROM bookings WHERE id = ?', [transBookingId]);
    assert.strictEqual(dbRowsCol[0].status, 'Collected');

    // 3. Collected -> Returned (Valid)
    const returnRes = await fetch(`${BASE_URL}/api/bookings/${transBookingId}/status`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${assistantToken}`
      },
      body: JSON.stringify({ status: 'Returned' })
    });
    assert.strictEqual(returnRes.status, 200);

    // Verify database shows Returned
    const [dbRowsRet] = await pool.query('SELECT status FROM bookings WHERE id = ?', [transBookingId]);
    assert.strictEqual(dbRowsRet[0].status, 'Returned');

    // Test 13: Invalid Transitions Validation
    console.log('👉 Test 13: Invalid Transitions Validation');

    // Create a new pending request
    const invalidBookingRes = await fetch(`${BASE_URL}/api/bookings`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${staffToken}`
      },
      body: JSON.stringify({
        equipmentName: 'Autoclave',
        bookingDate: '2027-12-31',
        startTime: '10:00:00',
        endTime: '12:00:00',
        purpose: 'Test invalid transitions'
      })
    });
    const invalidBookingData = await invalidBookingRes.json();
    const invBookingId = invalidBookingData.bookingId;

    // 1. Pending -> Collected (Invalid, should fail with 400)
    const invCollectRes = await fetch(`${BASE_URL}/api/bookings/${invBookingId}/status`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${assistantToken}`
      },
      body: JSON.stringify({ status: 'Collected' })
    });
    assert.strictEqual(invCollectRes.status, 400);

    // Approve it
    await fetch(`${BASE_URL}/api/bookings/${invBookingId}/status`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${assistantToken}`
      },
      body: JSON.stringify({ status: 'Approved', assistantComment: 'Approve' })
    });

    // 2. Approved -> Returned (Invalid, should fail with 400)
    const invReturnRes = await fetch(`${BASE_URL}/api/bookings/${invBookingId}/status`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${assistantToken}`
      },
      body: JSON.stringify({ status: 'Returned' })
    });
    assert.strictEqual(invReturnRes.status, 400);

    console.log('✨ All 13 Live Integration & Spoofing Tests passed successfully!');
  } catch (error) {
    console.error('❌ Integration Test Failure:', error);
    process.exit(1);
  } finally {
    // Clean up test records
    console.log('🧹 Cleaning up test database records...');
    await pool.query("DELETE FROM bookings WHERE requestedUser IN ('test_staff', 'bob_staff')");
    await pool.query("DELETE FROM sessions WHERE username IN ('test_staff', 'test_assistant')");
    await pool.query("DELETE FROM users WHERE username IN ('test_staff', 'test_assistant')");
    
    server.close(() => {
      console.log('🛑 Test server stopped.');
      process.exit(0);
    });
  }
}

runTests();
