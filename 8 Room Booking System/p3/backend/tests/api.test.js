const assert = require('assert');
const express = require('express');
const cors = require('cors');
const pool = require('../config/db');
const bookingRoutes = require('../routes/bookingRoutes');
const userRoutes = require('../routes/userRoutes');
const authRoutes = require('../routes/authRoutes');
const errorHandler = require('../middleware/errorHandler');

const TEST_PORT = 5001;
const BASE_URL = `http://localhost:${TEST_PORT}/api`;

// Express App Setup for Tests
const app = express();
app.use(cors());
app.use(express.json());
app.use('/api/bookings', bookingRoutes);
app.use('/api/users', userRoutes);
app.use('/api/auth', authRoutes);
app.use(errorHandler);

let server;

// Helper to clean up database test records
async function cleanupDatabase() {
  console.log('Cleaning up [TEST-ROOM] records from MySQL database...');
  await pool.query("DELETE FROM room_bookings WHERE room_name LIKE '[TEST-ROOM]%'");
}

async function runTests() {
  console.log('Starting end-to-end API verification suite...');
  
  // Start server
  server = app.listen(TEST_PORT, () => {
    console.log(`Test Express server running on port ${TEST_PORT}`);
  });

  try {
    // 0. Database Connection Check
    const [dbCheck] = await pool.query('SELECT 1');
    assert.deepStrictEqual(dbCheck[0], { '1': 1 }, 'Database connection pool check failed');
    console.log('✓ Database connection: Verified');

    // Run cleanups first
    await cleanupDatabase();

    // 1. Auth Login Tests
    console.log('Testing User Login...');
    
    // Success Login (Staff)
    const staffLoginRes = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'alice_staff', password: 'password123' })
    });
    const staffLoginData = await staffLoginRes.json();
    assert.strictEqual(staffLoginRes.status, 200, 'Staff login should succeed');
    assert.strictEqual(staffLoginData.success, true);
    assert.ok(staffLoginData.token, 'Token should be returned');
    assert.strictEqual(staffLoginData.user.role, 'staff');
    const staffToken = staffLoginData.token;
    const staffUserId = staffLoginData.user.id;
    console.log('✓ Staff Login: Verified');

    // Success Login (Coordinator)
    const coordLoginRes = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'charlie_coord', password: 'password123' })
    });
    const coordLoginData = await coordLoginRes.json();
    assert.strictEqual(coordLoginRes.status, 200, 'Coordinator login should succeed');
    const coordToken = coordLoginData.token;
    console.log('✓ Coordinator Login: Verified');

    // Failed Login (Wrong Password)
    const failedLoginRes = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'alice_staff', password: 'wrong_password' })
    });
    assert.strictEqual(failedLoginRes.status, 401, 'Should block invalid credentials');
    console.log('✓ Block Unauthorized Login: Verified');

    // 2. Room Booking Workflow Validation
    console.log('Testing Booking Submissions...');
    
    // Create Booking Success (Staff)
    const createRes = await fetch(`${BASE_URL}/bookings`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${staffToken}`
      },
      body: JSON.stringify({
        roomName: '[TEST-ROOM] Conference A',
        bookingDate: '2026-06-25',
        startTime: '10:00:00',
        endTime: '12:00:00',
        purpose: 'Staff project review session',
        requesterId: staffUserId
      })
    });
    const createData = await createRes.json();
    assert.strictEqual(createRes.status, 201);
    assert.strictEqual(createData.booking.status, 'pending');
    const bookingId = createData.booking.id;
    console.log('✓ Create Booking (Pending): Verified');

    // Validation Check: Invalid Chronological Times (EndTime <= StartTime)
    const badTimeRes = await fetch(`${BASE_URL}/bookings`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${staffToken}`
      },
      body: JSON.stringify({
        roomName: '[TEST-ROOM] Conference A',
        bookingDate: '2026-06-25',
        startTime: '14:00:00',
        endTime: '13:00:00',
        purpose: 'Invalid time request',
        requesterId: staffUserId
      })
    });
    assert.strictEqual(badTimeRes.status, 400, 'Chronological time error should return 400');
    console.log('✓ Chronology time validation checks: Verified');

    // 3. Permission & Access Checks
    console.log('Testing Role Permissions & Authorization...');

    // Block Staff from Approving Bookings
    const staffApproveRes = await fetch(`${BASE_URL}/bookings/${bookingId}/status`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${staffToken}`
      },
      body: JSON.stringify({ status: 'approved', coordinatorNote: 'Cheating' })
    });
    assert.strictEqual(staffApproveRes.status, 403, 'Staff must not be allowed to approve bookings');
    console.log('✓ Block Staff Approvals (Protected Route): Verified');

    // Bob tries to edit Alice's booking
    const bobLoginRes = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'bob_staff', password: 'password123' })
    });
    const bobToken = (await bobLoginRes.json()).token;
    const bobEditRes = await fetch(`${BASE_URL}/bookings/${bookingId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${bobToken}`
      },
      body: JSON.stringify({
        roomName: '[TEST-ROOM] Conference A',
        bookingDate: '2026-06-25',
        startTime: '10:00:00',
        endTime: '12:00:00',
        purpose: 'Attempting hijack'
      })
    });
    assert.strictEqual(bobEditRes.status, 403, 'Staff must not edit other users bookings');
    console.log('✓ Block cross-user booking modification: Verified');

    // 4. Coordinator Actions & Validation
    console.log('Testing Coordinator Actions...');

    // Approve booking
    const approveRes = await fetch(`${BASE_URL}/bookings/${bookingId}/status`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${coordToken}`
      },
      body: JSON.stringify({ status: 'approved', coordinatorNote: 'Confirmed.' })
    });
    const approveData = await approveRes.json();
    assert.strictEqual(approveRes.status, 200);
    assert.strictEqual(approveData.booking.status, 'approved');
    console.log('✓ Coordinator Approval: Verified');

    // 5. Overlapping Booking Conflict Prevention
    console.log('Testing Overlap Conflict Prevention...');

    // Create a second overlapping request for Bob
    const bobBookingRes = await fetch(`${BASE_URL}/bookings`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${bobToken}`
      },
      body: JSON.stringify({
        roomName: '[TEST-ROOM] Conference A',
        bookingDate: '2026-06-25',
        startTime: '11:00:00',
        endTime: '13:00:00', // Overlaps with Alice's approved slot (10:00 - 12:00)
        purpose: 'Conflicting meeting',
        requesterId: 2
      })
    });
    const bobBookingData = await bobBookingRes.json();
    const bobBookingId = bobBookingData.booking.id;

    // Coordinator attempts to approve Bob's overlapping booking
    const coordConflictRes = await fetch(`${BASE_URL}/bookings/${bobBookingId}/status`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${coordToken}`
      },
      body: JSON.stringify({ status: 'approved', coordinatorNote: 'Try overlapping' })
    });
    assert.strictEqual(coordConflictRes.status, 409, 'Overlapping approved bookings must return 409 Conflict');
    console.log('✓ Double-booking overlap block: Verified');

    // 6. Filtering Test
    console.log('Testing filtering functionality...');
    const filterRes = await fetch(`${BASE_URL}/bookings?roomName=[TEST-ROOM]`, {
      headers: { 'Authorization': `Bearer ${coordToken}` }
    });
    const filterData = await filterRes.json();
    assert.ok(filterData.bookings.length > 0);
    assert.ok(filterData.bookings.every(b => b.roomName.includes('[TEST-ROOM]')), 'Filtering should match roomName keyword query');
    console.log('✓ Filtering by Room name: Verified');

    // Cleanup after test success
    await cleanupDatabase();
    console.log('All end-to-end API test assertions passed successfully!');
  } catch (error) {
    console.error('Test execution failed with error:', error);
    process.exit(1);
  } finally {
    // Shutdown server
    if (server) {
      server.close();
    }
    process.exit(0);
  }
}

runTests();
