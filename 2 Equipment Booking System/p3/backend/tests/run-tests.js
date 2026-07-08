const assert = require('assert');
const express = require('express');
const cors = require('cors');
const { pool } = require('../config/db');
const authRoutes = require('../routes/authRoutes');
const bookingRoutes = require('../routes/bookingRoutes');

const TEST_PORT = 5099;
const BASE_URL = `http://localhost:${TEST_PORT}`;

// Setup mock express server for testing
const app = express();
app.use(cors());
app.use(express.json());
app.use('/api/auth', authRoutes);
app.use('/api/bookings', bookingRoutes);

let server;

async function setup() {
  return new Promise((resolve) => {
    server = app.listen(TEST_PORT, () => {
      console.log(`Test server listening on port ${TEST_PORT}`);
      resolve();
    });
  });
}

async function cleanup() {
  console.log('Cleaning up test records...');
  // Delete all bookings created for tests (prefixed with 'TEST_')
  await pool.query("DELETE FROM bookings WHERE equipmentName LIKE 'TEST_%'");
  if (server) {
    server.close();
    console.log('Test server stopped.');
  }
  await pool.end(); // close mysql pool to allow exit
}

async function runTests() {
  await setup();

  let aliceToken = '';
  let bobToken = '';
  let charlieToken = '';
  let createdBookingId = null;

  try {
    // 1. Database Connectivity Check
    console.log('Test 1: Testing DB Connectivity...');
    const [dbTest] = await pool.query('SELECT 1');
    assert.strictEqual(dbTest[0]['1'], 1, 'Database connection failed');
    console.log('  PASSED');

    // 2. Authentication Login tests
    console.log('Test 2: Testing Authentication Login...');
    
    // Invalid credentials
    const loginFailRes = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'alice_staff', password: 'wrong_password' })
    });
    assert.strictEqual(loginFailRes.status, 401, 'Should fail with 401 for incorrect password');
    console.log('  PASSED (Invalid login rejected)');

    // Staff Login (Alice)
    const aliceRes = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'alice_staff', password: 'password123' })
    });
    assert.strictEqual(aliceRes.status, 200, 'Alice login failed');
    const aliceData = await aliceRes.json();
    aliceToken = aliceData.token;
    assert.strictEqual(aliceData.user.role, 'staff', 'Alice should have staff role');

    // Staff Login (Bob)
    const bobRes = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'bob_staff', password: 'password123' })
    });
    bobToken = (await bobRes.json()).token;

    // Assistant Login (Charlie)
    const charlieRes = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'charlie_assistant', password: 'password123' })
    });
    charlieToken = (await charlieRes.json()).token;
    console.log('  PASSED (Valid logins succeed)');

    // 3. Create Booking Request & Validation Checks
    console.log('Test 3: Booking Request Creation & Validation...');
    
    // Assistant trying to request booking (blocked)
    const assistantCreateRes = await fetch(`${BASE_URL}/api/bookings`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${charlieToken}`
      },
      body: JSON.stringify({
        equipmentName: 'TEST_Microscope',
        bookingDate: '2026-06-15',
        startTime: '10:00',
        endTime: '12:00',
        purpose: 'Assistant request'
      })
    });
    assert.strictEqual(assistantCreateRes.status, 403, 'Assistants should be blocked from creating bookings');

    // Invalid time ordering (end before start)
    const timeValRes = await fetch(`${BASE_URL}/api/bookings`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${aliceToken}`
      },
      body: JSON.stringify({
        equipmentName: 'TEST_Microscope',
        bookingDate: '2026-06-15',
        startTime: '12:00',
        endTime: '10:00',
        purpose: 'Testing time error'
      })
    });
    assert.strictEqual(timeValRes.status, 400, 'Should reject end time before start time');

    // Missing fields
    const missingValRes = await fetch(`${BASE_URL}/api/bookings`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${aliceToken}`
      },
      body: JSON.stringify({
        equipmentName: 'TEST_Microscope',
        bookingDate: '2026-06-15',
        startTime: '10:00',
        endTime: '12:00'
        // purpose is missing
      })
    });
    assert.strictEqual(missingValRes.status, 400, 'Should reject missing fields');

    // Valid creation (Alice)
    const validCreateRes = await fetch(`${BASE_URL}/api/bookings`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${aliceToken}`
      },
      body: JSON.stringify({
        equipmentName: 'TEST_Microscope',
        bookingDate: '2026-06-15',
        startTime: '10:00',
        endTime: '12:00',
        purpose: 'Cell structures'
      })
    });
    assert.strictEqual(validCreateRes.status, 201, 'Booking creation failed');
    const createdBooking = await validCreateRes.json();
    createdBookingId = createdBooking.id;
    assert.strictEqual(createdBooking.status, 'pending');
    console.log('  PASSED');

    // 4. View Bookings & Access Separation
    console.log('Test 4: View Bookings Access Controls...');
    
    // Alice requests list (should contain only Alice's bookings)
    const aliceListRes = await fetch(`${BASE_URL}/api/bookings`, {
      headers: { 'Authorization': `Bearer ${aliceToken}` }
    });
    const aliceList = await aliceListRes.json();
    assert(aliceList.every(b => b.requestedUser === 'alice_staff'), 'Alice should only see her own requests');

    // Bob requests list (should not contain Alice's request)
    const bobListRes = await fetch(`${BASE_URL}/api/bookings`, {
      headers: { 'Authorization': `Bearer ${bobToken}` }
    });
    const bobList = await bobListRes.json();
    assert(bobList.every(b => b.requestedUser === 'bob_staff'), "Bob should only see Bob's requests");

    // Charlie (Assistant) requests list (should see all requests, including Alice's)
    const charlieListRes = await fetch(`${BASE_URL}/api/bookings`, {
      headers: { 'Authorization': `Bearer ${charlieToken}` }
    });
    const charlieList = await charlieListRes.json();
    assert(charlieList.some(b => b.id === createdBookingId), 'Assistant should see Alice\'s booking request');
    console.log('  PASSED');

    // 5. Update Pending Bookings & Ownership Rules
    console.log('Test 5: Editing Pending Booking Requests...');
    
    // Bob trying to edit Alice's booking request (blocked)
    const bobEditRes = await fetch(`${BASE_URL}/api/bookings/${createdBookingId}`, {
      method: 'PUT',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${bobToken}`
      },
      body: JSON.stringify({
        equipmentName: 'TEST_Centrifuge',
        bookingDate: '2026-06-15',
        startTime: '10:00',
        endTime: '12:00',
        purpose: 'Breaching boundaries'
      })
    });
    assert.strictEqual(bobEditRes.status, 403, 'Bob should not be allowed to edit Alice\'s request');

    // Alice editing her own pending request (allowed)
    const aliceEditRes = await fetch(`${BASE_URL}/api/bookings/${createdBookingId}`, {
      method: 'PUT',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${aliceToken}`
      },
      body: JSON.stringify({
        equipmentName: 'TEST_Centrifuge',
        bookingDate: '2026-06-15',
        startTime: '11:00',
        endTime: '13:00',
        purpose: 'Spinning test'
      })
    });
    assert.strictEqual(aliceEditRes.status, 200, 'Alice should be allowed to edit her own request');
    const updatedBooking = await aliceEditRes.json();
    assert.strictEqual(updatedBooking.equipmentName, 'TEST_Centrifuge');
    assert.strictEqual(updatedBooking.startTime, '11:00:00');
    console.log('  PASSED');

    // 6. Review Status Actions (Approve/Reject & Comments)
    console.log('Test 6: Reviewing status & decision comment rules...');
    
    // Alice (Staff) trying to approve her own request (blocked)
    const staffApproveRes = await fetch(`${BASE_URL}/api/bookings/${createdBookingId}/status`, {
      method: 'PATCH',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${aliceToken}`
      },
      body: JSON.stringify({ status: 'approved', assistantComment: 'Cheating' })
    });
    assert.strictEqual(staffApproveRes.status, 403, 'Staff should be blocked from approving requests');

    // Assistant reviewing without decision comment (blocked)
    const commentFailRes = await fetch(`${BASE_URL}/api/bookings/${createdBookingId}/status`, {
      method: 'PATCH',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${charlieToken}`
      },
      body: JSON.stringify({ status: 'approved', assistantComment: ' ' })
    });
    assert.strictEqual(commentFailRes.status, 400, 'Decision comment is mandatory');

    // Assistant approving request with comment (allowed)
    const assistantApproveRes = await fetch(`${BASE_URL}/api/bookings/${createdBookingId}/status`, {
      method: 'PATCH',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${charlieToken}`
      },
      body: JSON.stringify({ status: 'approved', assistantComment: 'Approved for research slot' })
    });
    assert.strictEqual(assistantApproveRes.status, 200, 'Assistant approval failed');
    const approvedBooking = await assistantApproveRes.json();
    assert.strictEqual(approvedBooking.status, 'approved');
    assert.strictEqual(approvedBooking.assistantComment, 'Approved for research slot');
    console.log('  PASSED');

    // 6.1: Assistant marking as collected (allowed)
    console.log('Test 6.1: Assistant marking booking as collected...');
    const collectedRes = await fetch(`${BASE_URL}/api/bookings/${createdBookingId}/status`, {
      method: 'PATCH',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${charlieToken}`
      },
      body: JSON.stringify({ status: 'collected' })
    });
    assert.strictEqual(collectedRes.status, 200, 'Marking collected failed');
    const collectedBooking = await collectedRes.json();
    assert.strictEqual(collectedBooking.status, 'collected');
    console.log('  PASSED');

    // 6.2: Assistant marking as returned (allowed)
    console.log('Test 6.2: Assistant marking booking as returned...');
    const returnedRes = await fetch(`${BASE_URL}/api/bookings/${createdBookingId}/status`, {
      method: 'PATCH',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${charlieToken}`
      },
      body: JSON.stringify({ status: 'returned' })
    });
    assert.strictEqual(returnedRes.status, 200, 'Marking returned failed');
    const returnedBooking = await returnedRes.json();
    assert.strictEqual(returnedBooking.status, 'returned');
    console.log('  PASSED');

    // 6.3: Invalid status transition (e.g. from returned back to collected)
    console.log('Test 6.3: Enforcing invalid lifecycle status transitions...');
    const invalidTransitionRes = await fetch(`${BASE_URL}/api/bookings/${createdBookingId}/status`, {
      method: 'PATCH',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${charlieToken}`
      },
      body: JSON.stringify({ status: 'collected' })
    });
    assert.strictEqual(invalidTransitionRes.status, 400, 'Should reject invalid lifecycle transitions');
    console.log('  PASSED');

    // 7. Update Lock Check (Staff trying to edit approved request)
    console.log('Test 7: Locked action check (Staff editing approved booking)...');
    const staffEditAfterApproveRes = await fetch(`${BASE_URL}/api/bookings/${createdBookingId}`, {
      method: 'PUT',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${aliceToken}`
      },
      body: JSON.stringify({
        equipmentName: 'TEST_Microscope',
        bookingDate: '2026-06-15',
        startTime: '11:00',
        endTime: '13:00',
        purpose: 'Attempting edit after approval'
      })
    });
    assert.strictEqual(staffEditAfterApproveRes.status, 400, 'Should reject updates on non-pending requests');
    console.log('  PASSED');

    // 8. Filtering checks
    console.log('Test 8: Testing dynamic filtering options...');
    const filterRes = await fetch(`${BASE_URL}/api/bookings?equipmentName=Centrifuge&status=returned`, {
      headers: { 'Authorization': `Bearer ${charlieToken}` }
    });
    const filterList = await filterRes.json();
    assert(filterList.every(b => b.equipmentName.includes('Centrifuge') && b.status === 'returned'), 'Filters should restrict list rows');
    console.log('  PASSED');

    console.log('\nALL TESTS PASSED SUCCESSFULLY! ✅');
  } catch (error) {
    console.error('\nTEST FAILURE ❌:', error.message);
    process.exitCode = 1;
  } finally {
    await cleanup();
  }
}

runTests();
