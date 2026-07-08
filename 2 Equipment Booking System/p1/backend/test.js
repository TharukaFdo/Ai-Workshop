const assert = require('assert');
const db = require('./db');
require('dotenv').config();

const API_URL = 'http://localhost:5000/api';

async function runTests() {
  console.log('🚀 Starting Integration Tests...');
  let testBookingId = null;
  let staffToken = null;
  let assistantToken = null;
  let secondaryStaffToken = null;

  // 1. Authentication Tests
  console.log('\n--- 1. Testing Login & Authentication ---');
  
  // Test invalid login
  const loginFailRes = await fetch(`${API_URL}/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: 'john_doe', password: 'wrongpassword' })
  });
  assert.strictEqual(loginFailRes.status, 401, 'Invalid login should return 401');
  console.log('✅ Invalid login rejected correctly.');

  // Login as John Doe (Staff)
  const loginStaffRes = await fetch(`${API_URL}/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: 'john_doe', password: 'password123' })
  });
  assert.strictEqual(loginStaffRes.status, 200, 'Valid login should return 200');
  const staffData = await loginStaffRes.json();
  staffToken = staffData.token;
  assert.ok(staffToken, 'Token should be present in login response');
  console.log('✅ Logged in successfully as Staff (john_doe).');

  // Login as Alice (Lab Assistant)
  const loginAssistantRes = await fetch(`${API_URL}/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: 'alice', password: 'password123' })
  });
  const assistantData = await loginAssistantRes.json();
  assistantToken = assistantData.token;
  console.log('✅ Logged in successfully as Assistant (alice).');

  // Login as Jane Smith (Secondary Staff)
  const loginSecStaffRes = await fetch(`${API_URL}/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: 'jane_smith', password: 'password123' })
  });
  const secStaffData = await loginSecStaffRes.json();
  secondaryStaffToken = secStaffData.token;

  // 2. Booking Creation & Permissions
  console.log('\n--- 2. Testing Booking Creation & Role Permissions ---');

  // Assistant cannot create booking
  const createAssisRes = await fetch(`${API_URL}/bookings`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${assistantToken}`
    },
    body: JSON.stringify({
      equipment_name: 'PCR Machine',
      booking_date: '2026-06-20',
      start_time: '10:00:00',
      end_time: '12:00:00',
      purpose: 'Attempted Assistant booking'
    })
  });
  assert.strictEqual(createAssisRes.status, 403, 'Lab Assistant should be forbidden from creating bookings');
  console.log('✅ Assistant blocked from creating bookings.');

  // Past date validation
  const pastRes = await fetch(`${API_URL}/bookings`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${staffToken}`
    },
    body: JSON.stringify({
      equipment_name: 'PCR Machine',
      booking_date: '2020-01-01',
      start_time: '10:00:00',
      end_time: '12:00:00',
      purpose: 'Past date testing'
    })
  });
  assert.strictEqual(pastRes.status, 400, 'Past date should return 400 Bad Request');
  console.log('✅ Rejection of past dates validated.');

  // Time order validation
  const timeOrderRes = await fetch(`${API_URL}/bookings`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${staffToken}`
    },
    body: JSON.stringify({
      equipment_name: 'PCR Machine',
      booking_date: '2026-06-20',
      start_time: '12:00:00',
      end_time: '10:00:00',
      purpose: 'Invalid times testing'
    })
  });
  assert.strictEqual(timeOrderRes.status, 400, 'End time before start time should return 400 Bad Request');
  console.log('✅ Rejection of invalid time ranges validated.');

  // Overlapping approved booking collision validation
  const overlapRes = await fetch(`${API_URL}/bookings`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${staffToken}`
    },
    body: JSON.stringify({
      equipment_name: 'Spectrophotometer',
      booking_date: '2026-06-08',
      start_time: '14:00:00',
      end_time: '16:00:00',
      purpose: 'Collision testing'
    })
  });
  assert.strictEqual(overlapRes.status, 400, 'Overlapping approved booking should return 400');
  console.log('✅ Double-booking collision detection validated.');

  // Staff creates a booking
  const createStaffRes = await fetch(`${API_URL}/bookings`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${staffToken}`
    },
    body: JSON.stringify({
      equipment_name: 'Lab Incubator',
      booking_date: '2026-06-25',
      start_time: '09:00:00',
      end_time: '11:00:00',
      purpose: 'Testing incubator temp stability'
    })
  });
  assert.strictEqual(createStaffRes.status, 201, 'Staff should create booking successfully');
  const createData = await createStaffRes.json();
  testBookingId = createData.id;
  assert.ok(testBookingId, 'Created booking should return an insert ID');
  console.log(`✅ Booking created by Staff. Booking ID: ${testBookingId}`);

  // 3. Viewing & Filtering
  console.log('\n--- 3. Testing Viewing and Query Filters ---');

  // Staff view (should only show their own)
  const viewStaffRes = await fetch(`${API_URL}/bookings`, {
    headers: { 'Authorization': `Bearer ${staffToken}` }
  });
  const staffBookings = await viewStaffRes.json();
  assert.ok(staffBookings.every(b => b.requested_user === 'john_doe'), 'Staff view must only return bookings belonging to them');
  console.log('✅ Staff only received their own booking records.');

  // Assistant view (should show all)
  const viewAssisRes = await fetch(`${API_URL}/bookings`, {
    headers: { 'Authorization': `Bearer ${assistantToken}` }
  });
  const allBookings = await viewAssisRes.json();
  const hasJohn = allBookings.some(b => b.requested_user === 'john_doe');
  const hasJane = allBookings.some(b => b.requested_user === 'jane_smith');
  assert.ok(hasJohn && hasJane, 'Assistant view must list bookings from multiple users');
  console.log('✅ Assistant successfully loaded bookings from all staff members.');

  // Filters check (Filtering by equipment name)
  const filterRes = await fetch(`${API_URL}/bookings?equipment=Lab Incubator`, {
    headers: { 'Authorization': `Bearer ${staffToken}` }
  });
  const filteredBookings = await filterRes.json();
  assert.ok(filteredBookings.every(b => b.equipment_name === 'Lab Incubator'), 'Filter by equipment must only return matching equipment');
  console.log('✅ Filters returned only matching equipment records.');

  // 4. Updating details
  console.log('\n--- 4. Testing Booking Updates & Owner Validation ---');

  // Non-owner trying to edit booking details
  const updateSecRes = await fetch(`${API_URL}/bookings/${testBookingId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${secondaryStaffToken}`
    },
    body: JSON.stringify({
      equipment_name: 'Lab Incubator',
      booking_date: '2026-06-25',
      start_time: '09:00:00',
      end_time: '12:00:00',
      purpose: 'Intruder edit attempt'
    })
  });
  assert.strictEqual(updateSecRes.status, 403, 'Non-owner should be forbidden from editing other bookings');
  console.log('✅ Blocked unauthorized user from editing booking.');

  // Owner edits booking details
  const updateOwnerRes = await fetch(`${API_URL}/bookings/${testBookingId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${staffToken}`
    },
    body: JSON.stringify({
      equipment_name: 'Lab Incubator',
      booking_date: '2026-06-25',
      start_time: '09:00:00',
      end_time: '12:00:00',
      purpose: 'Testing incubator temp stability - UPDATED PURPOSE'
    })
  });
  assert.strictEqual(updateOwnerRes.status, 200, 'Owner should update booking details successfully');
  console.log('✅ Booking details updated successfully by owner.');

  // 5. Approvals & Rejections
  console.log('\n--- 5. Testing Approvals & Comments ---');

  // Staff cannot approve booking
  const approveStaffRes = await fetch(`${API_URL}/bookings/${testBookingId}/status`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${staffToken}`
    },
    body: JSON.stringify({ status: 'Approved', assistant_comment: 'Approved by owner staff' })
  });
  assert.strictEqual(approveStaffRes.status, 403, 'Staff should be forbidden from approving bookings');
  console.log('✅ Staff blocked from approving bookings.');

  // Assistant approves booking
  const approveAssisRes = await fetch(`${API_URL}/bookings/${testBookingId}/status`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${assistantToken}`
    },
    body: JSON.stringify({ status: 'Approved', assistant_comment: 'Valid request, approved for use.' })
  });
  assert.strictEqual(approveAssisRes.status, 200, 'Assistant should approve booking successfully');
  console.log('✅ Booking successfully approved with comment by Lab Assistant.');

  // Assistant marks booking as Collected
  const collectRes = await fetch(`${API_URL}/bookings/${testBookingId}/status`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${assistantToken}`
    },
    body: JSON.stringify({ status: 'Collected' })
  });
  assert.strictEqual(collectRes.status, 200, 'Assistant should mark booking as collected successfully');
  console.log('✅ Booking marked as collected by Assistant.');

  // Assistant marks booking as Returned
  const returnRes = await fetch(`${API_URL}/bookings/${testBookingId}/status`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${assistantToken}`
    },
    body: JSON.stringify({ status: 'Returned' })
  });
  assert.strictEqual(returnRes.status, 200, 'Assistant should mark booking as returned successfully');
  console.log('✅ Booking marked as returned by Assistant.');

  // Staff cannot edit booking anymore once approved/rejected
  const editPostApproveRes = await fetch(`${API_URL}/bookings/${testBookingId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${staffToken}`
    },
    body: JSON.stringify({
      equipment_name: 'Lab Incubator',
      booking_date: '2026-06-25',
      start_time: '09:00:00',
      end_time: '12:00:00',
      purpose: 'Post-approval edit attempt'
    })
  });
  assert.strictEqual(editPostApproveRes.status, 400, 'Staff should be blocked from editing non-pending bookings');
  console.log('✅ Blocked editing of non-pending bookings.');

  // Cleanup test records
  console.log('\n--- Cleanup ---');
  if (testBookingId) {
    await db.query('DELETE FROM bookings WHERE id = ?', [testBookingId]);
    console.log('🧹 Cleaned up test booking request.');
  }
  await db.query('DELETE FROM sessions WHERE token IN (?, ?, ?)', [staffToken, assistantToken, secondaryStaffToken]);
  console.log('🧹 Cleaned up test session tokens.');

  console.log('\n🎉 ALL TESTS PASSED SUCCESSFULLY!');
  process.exit(0);
}

runTests().catch(err => {
  console.error('\n❌ Test suite failed:', err);
  process.exit(1);
});
