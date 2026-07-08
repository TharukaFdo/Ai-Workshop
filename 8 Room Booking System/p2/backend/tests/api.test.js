const mysql = require('mysql2/promise');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const db = require('../config/db');

// Set test port and start server programmatically
process.env.PORT = '5001';
const serverInstance = require('../server'); // Express starts listening automatically on 5001

const BASE_URL = 'http://localhost:5001/api';

async function runTests() {
  console.log('\n=== RUNNING AUTOMATED BACKEND INTEGRATION TESTS ===\n');

  let testStaffId = null;
  let testStaffToken = null;
  let testCoordId = null;
  let testCoordToken = null;
  let testBookingId = null;
  let otherBookingId = null;

  try {
    // 1. Database Cleanup of old test records
    console.log('1. Cleaning up previous test data...');
    await db.query("DELETE FROM sessions WHERE user_id IN (SELECT id FROM users WHERE username LIKE 'TEST_%')");
    await db.query("DELETE FROM bookings WHERE room_name LIKE 'TEST_%' OR requester_name LIKE 'TEST_%'");
    await db.query("DELETE FROM users WHERE username LIKE 'TEST_%'");

    // Seed test users
    const [staffResult] = await db.query(
      "INSERT INTO users (username, password, role) VALUES ('TEST_staff', 'password123', 'Staff')"
    );
    testStaffId = staffResult.insertId;

    const [coordResult] = await db.query(
      "INSERT INTO users (username, password, role) VALUES ('TEST_coord', 'password123', 'Coordinator')"
    );
    testCoordId = coordResult.insertId;

    // Seed an "other" booking representing another staff member's booking
    const [otherResult] = await db.query(
      "INSERT INTO bookings (room_name, booking_date, start_time, end_time, purpose, requester_name, user_id, status) VALUES ('TEST_OtherRoom', '2026-12-01', '10:00:00', '11:00:00', 'Other sync', 'other_user', ?, 'pending')",
      [testCoordId] // Owned by coord so staff cannot modify
    );
    otherBookingId = otherResult.insertId;

    console.log('Test users and records seeded.');

    // 2. Test Login API
    console.log('\n2. Testing Login API...');
    const staffLoginRes = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'TEST_staff', password: 'password123' })
    });
    const staffLoginData = await staffLoginRes.json();
    if (staffLoginRes.status !== 200 || !staffLoginData.token) {
      throw new Error('Staff login failed');
    }
    testStaffToken = staffLoginData.token;
    console.log('✔ Staff login successful. Token issued.');

    const coordLoginRes = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'TEST_coord', password: 'password123' })
    });
    const coordLoginData = await coordLoginRes.json();
    testCoordToken = coordLoginData.token;
    console.log('✔ Coordinator login successful. Token issued.');

    const badLoginRes = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'TEST_staff', password: 'wrongpassword' })
    });
    if (badLoginRes.status !== 401) {
      throw new Error(`Expected 401 for bad password, got ${badLoginRes.status}`);
    }
    console.log('✔ Invalid password rejected with 401.');

    // 3. Test Booking Creation & Validations
    console.log('\n3. Testing Booking Creation & Input Validations...');
    
    // Past Date Validation
    const pastDateRes = await fetch(`${BASE_URL}/bookings`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${testStaffToken}`
      },
      body: JSON.stringify({
        room_name: 'TEST_RoomA',
        booking_date: '2020-01-01',
        start_time: '09:00:00',
        end_time: '10:00:00',
        purpose: 'Test Kickoff',
        requester_name: 'TEST_staff'
      })
    });
    if (pastDateRes.status !== 400) {
      throw new Error(`Expected 400 for past date, got ${pastDateRes.status}`);
    }
    console.log('✔ Past date booking rejected with 400.');

    // End Time chronologically before Start Time Validation
    const invalidTimeRes = await fetch(`${BASE_URL}/bookings`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${testStaffToken}`
      },
      body: JSON.stringify({
        room_name: 'TEST_RoomA',
        booking_date: '2026-12-10',
        start_time: '11:00:00',
        end_time: '10:00:00',
        purpose: 'Test Sync',
        requester_name: 'TEST_staff'
      })
    });
    if (invalidTimeRes.status !== 400) {
      throw new Error(`Expected 400 for end time before start time, got ${invalidTimeRes.status}`);
    }
    console.log('✔ End time before start time rejected with 400.');

    // Successful Creation
    const createRes = await fetch(`${BASE_URL}/bookings`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${testStaffToken}`
      },
      body: JSON.stringify({
        room_name: 'TEST_RoomA',
        booking_date: '2026-12-10',
        start_time: '09:00:00',
        end_time: '10:00:00',
        purpose: 'Test Meeting Room A',
        requester_name: 'TEST_staff'
      })
    });
    const createData = await createRes.json();
    if (createRes.status !== 201 || !createData.id) {
      throw new Error(`Expected 201 for valid booking request, got ${createRes.status}`);
    }
    testBookingId = createData.id;
    console.log('✔ Valid booking request created successfully with status 201.');

    // 4. Test Security, Spoofing, and Resource Protection
    console.log('\n4. Testing Security, Role & Owner Spoofing Protections...');

    // Missing Token
    const noTokenRes = await fetch(`${BASE_URL}/bookings`);
    if (noTokenRes.status !== 401) {
      throw new Error(`Expected 401 for missing token, got ${noTokenRes.status}`);
    }
    console.log('✔ Missing session token rejected with 401.');

    // Attempting to approve/reject bookings as Staff Member
    const staffApproveRes = await fetch(`${BASE_URL}/bookings/${testBookingId}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${testStaffToken}`
      },
      body: JSON.stringify({ status: 'approved', coordinator_note: 'Illegal approval' })
    });
    if (staffApproveRes.status !== 403) {
      throw new Error(`Expected 403 for staff trying to approve bookings, got ${staffApproveRes.status}`);
    }
    console.log('✔ Staff approval request rejected with 403 Forbidden.');

    // Attempting to spoof role by injecting headers
    const headerSpoofRes = await fetch(`${BASE_URL}/bookings`, {
      headers: {
        'Authorization': `Bearer ${testStaffToken}`,
        'x-user-role': 'Coordinator',
        'x-user-id': testCoordId.toString()
      }
    });
    const headerSpoofData = await headerSpoofRes.json();
    // Verify that Staff only sees their own bookings despite sending coordinator headers
    const hasOtherRoom = headerSpoofData.some(b => b.room_name === 'TEST_OtherRoom');
    if (hasOtherRoom) {
      throw new Error('Spoofing check failed: Staff member retrieved Coordinator records using spoof headers');
    }
    console.log('✔ Header/role spoofing check blocked: request resolved correctly from DB session.');

    // Staff member editing another user's booking
    const editOtherRes = await fetch(`${BASE_URL}/bookings/${otherBookingId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${testStaffToken}`
      },
      body: JSON.stringify({
        room_name: 'TEST_OtherRoomUpdate',
        booking_date: '2026-12-01',
        start_time: '10:00:00',
        end_time: '11:00:00',
        purpose: 'Hacked',
        requester_name: 'Hacker'
      })
    });
    if (editOtherRes.status !== 403) {
      throw new Error(`Expected 403 when updating another user's booking, got ${editOtherRes.status}`);
    }
    console.log("✔ Editing another user's booking rejected with 403 Forbidden.");

    // 5. Test Filters
    console.log('\n5. Testing Filter Queries...');
    
    // Filter by room name
    const filterRoomRes = await fetch(`${BASE_URL}/bookings?room=RoomA`, {
      headers: { 'Authorization': `Bearer ${testStaffToken}` }
    });
    const filterRoomData = await filterRoomRes.json();
    if (!filterRoomData.every(b => b.room_name.includes('RoomA'))) {
      throw new Error('Filter by room name failed');
    }
    console.log('✔ Filtering by Room Name verified.');

    // Filter by date
    const filterDateRes = await fetch(`${BASE_URL}/bookings?date=2026-12-10`, {
      headers: { 'Authorization': `Bearer ${testStaffToken}` }
    });
    const filterDateData = await filterDateRes.json();
    if (!filterDateData.every(b => b.booking_date.startsWith('2026-12-10'))) {
      throw new Error('Filter by date failed');
    }
    console.log('✔ Filtering by Date verified.');

    // Filter by status
    const filterStatusRes = await fetch(`${BASE_URL}/bookings?status=pending`, {
      headers: { 'Authorization': `Bearer ${testStaffToken}` }
    });
    const filterStatusData = await filterStatusRes.json();
    if (!filterStatusData.every(b => b.status === 'pending')) {
      throw new Error('Filter by status failed');
    }
    console.log('✔ Filtering by Status verified.');

    // 6. Test Coordinator Approvals & Notes
    console.log('\n6. Testing Coordinator Approval & Note updates...');
    const approveRes = await fetch(`${BASE_URL}/bookings/${testBookingId}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${testCoordToken}`
      },
      body: JSON.stringify({ status: 'approved', coordinator_note: 'TEST_note: Approved for workshop demo' })
    });
    if (approveRes.status !== 200) {
      throw new Error(`Expected 200 for coordinator approval, got ${approveRes.status}`);
    }
    
    // Fetch updated record and verify fields
    const checkRes = await fetch(`${BASE_URL}/bookings`, {
      headers: { 'Authorization': `Bearer ${testCoordToken}` }
    });
    const checkData = await checkRes.json();
    const updatedRecord = checkData.find(b => b.id === testBookingId);
    if (!updatedRecord || updatedRecord.status !== 'approved' || updatedRecord.coordinator_note !== 'TEST_note: Approved for workshop demo') {
      throw new Error('Coordinator approval or note change not persisted in DB');
    }
    console.log('✔ Coordinator approval and note persisted successfully.');

    // 6.5 Test Overlap Collision checks
    console.log('\n6.5. Testing Booking Overlap / Collision Protection...');
    
    // Attempting to request a booking overlapping the approved one (testBookingId)
    // TEST_RoomA, 2026-12-10, 09:00:00 to 10:00:00 (already approved)
    // We try to request a booking from 09:30 to 10:30 on the same date/room
    const overlapRequestRes = await fetch(`${BASE_URL}/bookings`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${testStaffToken}`
      },
      body: JSON.stringify({
        room_name: 'TEST_RoomA',
        booking_date: '2026-12-10',
        start_time: '09:30:00',
        end_time: '10:30:00',
        purpose: 'Overlapping request',
        requester_name: 'TEST_staff'
      })
    });
    if (overlapRequestRes.status !== 409) {
      throw new Error(`Expected 409 Conflict for overlapping booking request, got ${overlapRequestRes.status}`);
    }
    console.log('✔ Overlapping booking creation rejected with 409 Conflict.');

    // Create a non-overlapping pending booking: 11:00 to 12:00
    const nonOverlapRes = await fetch(`${BASE_URL}/bookings`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${testStaffToken}`
      },
      body: JSON.stringify({
        room_name: 'TEST_RoomA',
        booking_date: '2026-12-10',
        start_time: '11:00:00',
        end_time: '12:00:00',
        purpose: 'Valid Request',
        requester_name: 'TEST_staff'
      })
    });
    const nonOverlapData = await nonOverlapRes.json();
    const pendingBookingId = nonOverlapData.id;
    console.log('✔ Non-overlapping booking request created.');

    // Manually force the pending booking to overlap (staff can update details to overlap as long as status remains pending)
    const staffForceUpdateRes = await fetch(`${BASE_URL}/bookings/${pendingBookingId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${testStaffToken}`
      },
      body: JSON.stringify({
        room_name: 'TEST_RoomA',
        booking_date: '2026-12-10',
        start_time: '09:30:00',
        end_time: '10:30:00',
        purpose: 'Forced Overlap',
        requester_name: 'TEST_staff'
      })
    });
    if (staffForceUpdateRes.status !== 200) {
      throw new Error(`Expected 200 for staff modifying pending request details, got ${staffForceUpdateRes.status}`);
    }

    // Now, coordinator tries to APPROVE this overlapping booking (pendingBookingId)
    const overlapApproveRes = await fetch(`${BASE_URL}/bookings/${pendingBookingId}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${testCoordToken}`
      },
      body: JSON.stringify({ status: 'approved', coordinator_note: 'Illegal approval overlap' })
    });
    if (overlapApproveRes.status !== 409) {
      throw new Error(`Expected 409 Conflict when approving overlapping booking, got ${overlapApproveRes.status}`);
    }
    console.log('✔ Overlapping booking approval blocked with 409 Conflict.');

    console.log('\n=== ALL TESTS PASSED SUCCESSFULLY! ===\n');
  } catch (error) {
    console.error('\n❌ TEST RUN ENCOUNTERED AN ERROR:\n', error.message);
    process.exit(1);
  } finally {
    // 7. Cleanup test records
    console.log('Cleaning up database test records...');
    try {
      await db.query("DELETE FROM sessions WHERE user_id IN (SELECT id FROM users WHERE username LIKE 'TEST_%')");
      await db.query("DELETE FROM bookings WHERE room_name LIKE 'TEST_%' OR requester_name LIKE 'TEST_%'");
      await db.query("DELETE FROM users WHERE username LIKE 'TEST_%'");
      console.log('Cleanup completed successfully.');
    } catch (cleanupErr) {
      console.error('Failed to clean up test records:', cleanupErr.message);
    }
    // Shut down server
    process.exit(0);
  }
}

runTests();
