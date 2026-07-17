const assert = require('assert');
const db = require('./db');

const BASE_URL = 'http://localhost:5000/api';

async function runTests() {
  console.log('🚀 Starting Integration & Security Tests...\n');

  try {
    // 1. Verify Database Connectivity
    console.log('Testing DB connection...');
    await db.query('SELECT 1');
    console.log('✅ DB Connection Successful!\n');

    // 2. Test Login API
    console.log('Testing login endpoint...');
    
    // Test Correct Credentials
    const loginRes = await fetch(`${BASE_URL}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'alice', password: 'password' })
    });
    assert.strictEqual(loginRes.status, 200, 'Login should succeed with status 200');
    const userData = await loginRes.json();
    assert.strictEqual(userData.username, 'alice', 'Username should match');
    assert.strictEqual(userData.role, 'staff', 'Role should be staff');
    console.log('✅ Correct login credentials passed');

    // Test Incorrect Credentials
    const badLoginRes = await fetch(`${BASE_URL}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'alice', password: 'wrongpassword' })
    });
    assert.strictEqual(badLoginRes.status, 401, 'Bad login should fail with status 401');
    console.log('✅ Incorrect login credentials blocked');

    // 3. Test Endpoint Security & Headers
    console.log('\nTesting permission security...');
    
    // No auth header
    const noAuthRes = await fetch(`${BASE_URL}/requests`);
    assert.strictEqual(noAuthRes.status, 401, 'Request without auth header should fail');
    console.log('✅ Missing auth header blocked');

    // Storekeeper trying to submit request
    const badRoleSubmit = await fetch(`${BASE_URL}/requests`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'john' // John is a storekeeper
      },
      body: JSON.stringify({
        item_name: 'Test Desk',
        quantity: 1,
        reason: 'Testing role permission',
        requested_date: '2026-07-15'
      })
    });
    assert.strictEqual(badRoleSubmit.status, 403, 'Storekeeper creating request should be blocked with 403');
    console.log('✅ Storekeeper restricted from creating requests');

    // 4. Test Safety Constraints (Invalid values & bounds)
    console.log('\nTesting Input Validation & Bounds Safety...');

    // Negative quantity check
    const badQtySubmit = await fetch(`${BASE_URL}/requests`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'alice'
      },
      body: JSON.stringify({
        item_name: 'Invalid Qty Desk',
        quantity: -10,
        reason: 'Testing negative boundary bounds',
        requested_date: '2026-07-15'
      })
    });
    assert.strictEqual(badQtySubmit.status, 400, 'Negative quantity should be rejected with status 400');
    console.log('✅ Negative request quantity blocked by server');

    // Excessively long text input check
    const longItemSubmit = await fetch(`${BASE_URL}/requests`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'alice'
      },
      body: JSON.stringify({
        item_name: 'A'.repeat(150), // Limit is 100
        quantity: 5,
        reason: 'Testing text bounds limit',
        requested_date: '2026-07-15'
      })
    });
    assert.strictEqual(longItemSubmit.status, 400, 'Long item name should be rejected with status 400');
    console.log('✅ Database overflow protection validated (oversized input rejected)');

    // 5. Test Request Lifecycle (Creating, Viewing, Approving, Rejecting, Issuing)
    console.log('\nTesting Request Lifecycle & State Transitions...');

    // A. Staff member Alice submits a request
    const createRequestRes = await fetch(`${BASE_URL}/requests`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'alice'
      },
      body: JSON.stringify({
        item_name: 'TEST_ITEM_AUTOTEST',
        quantity: 3,
        reason: 'Temporary test request',
        requested_date: '2026-07-20'
      })
    });
    assert.strictEqual(createRequestRes.status, 201, 'Request creation should succeed with 201');
    const newRequest = await createRequestRes.json();
    assert.strictEqual(newRequest.item_name, 'TEST_ITEM_AUTOTEST');
    assert.strictEqual(newRequest.requester_name, 'Alice Smith', 'Server should map username to full Display Name');
    console.log('✅ Request created successfully (persisted to MySQL)');

    // B. View requests list
    const getRequestsRes = await fetch(`${BASE_URL}/requests`, {
      headers: { 'Authorization': 'alice' }
    });
    const requestsList = await getRequestsRes.json();
    const createdReqExists = requestsList.some(r => r.id === newRequest.id);
    assert.ok(createdReqExists, 'Created request should exist in requests list');
    console.log('✅ Request retrieved successfully');

    // C. Staff member trying to approve request (Forbidden)
    const staffApproveRes = await fetch(`${BASE_URL}/requests/${newRequest.id}/status`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'alice'
      },
      body: JSON.stringify({
        status: 'approved',
        storekeeper_note: 'Illegal staff approval'
      })
    });
    assert.strictEqual(staffApproveRes.status, 403, 'Staff approving request should return 403');
    console.log('✅ Staff member blocked from approving requests');

    // D. Self-approval verification (Storekeeper cannot approve their own requests)
    // Create a request submitted by Storekeeper John Doe manually
    const [mockRequestResult] = await db.query(
      'INSERT INTO requests (item_name, quantity, reason, requested_date, requester_name, status) VALUES (?, ?, ?, ?, ?, ?)',
      ['Self Approval Test Laptop', 1, 'Self approval testing', '2026-07-20', 'John Doe', 'pending']
    );
    const mockRequestId = mockRequestResult.insertId;

    // John (Storekeeper) tries to approve John Doe's request (should fail)
    const selfApproveRes = await fetch(`${BASE_URL}/requests/${mockRequestId}/status`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'john'
      },
      body: JSON.stringify({
        status: 'approved',
        storekeeper_note: 'Trying to self-approve'
      })
    });
    assert.strictEqual(selfApproveRes.status, 403, 'Storekeeper self-approving should return 403');
    console.log('✅ Self-approval guard blocked John Doe from approving John Doe\'s request');

    // E. Storekeeper Sarah Jenkins approves Alice's request (Success)
    const approveRes = await fetch(`${BASE_URL}/requests/${newRequest.id}/status`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'sarah'
      },
      body: JSON.stringify({
        status: 'approved',
        storekeeper_note: 'Approved for test'
      })
    });
    assert.strictEqual(approveRes.status, 200, 'Storekeeper approval should succeed');
    const approvedData = await approveRes.json();
    assert.strictEqual(approvedData.status, 'approved');
    console.log('✅ Request approved successfully with storekeeper notes');

    // F. Test Invalid State Transition (Approved -> Approved or Approved -> Pending)
    const doubleApproveRes = await fetch(`${BASE_URL}/requests/${newRequest.id}/status`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'sarah'
      },
      body: JSON.stringify({ status: 'approved' })
    });
    assert.strictEqual(doubleApproveRes.status, 400, 'Re-approving an already approved request must fail');
    console.log('✅ State transition guard: double approval blocked');

    // G1. Storekeeper Sarah Jenkins tries to mark Alice's request as Issued without quantity (should fail)
    const issueNoQtyRes = await fetch(`${BASE_URL}/requests/${newRequest.id}/status`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'sarah'
      },
      body: JSON.stringify({ status: 'issued' })
    });
    assert.strictEqual(issueNoQtyRes.status, 400, 'Issuing without issued_quantity should fail');
    console.log('✅ Issuing blocked when issued_quantity is missing');

    // G2. Storekeeper Sarah Jenkins tries to mark Alice's request as Issued with excess quantity (should fail)
    const issueExcessQtyRes = await fetch(`${BASE_URL}/requests/${newRequest.id}/status`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'sarah'
      },
      body: JSON.stringify({ status: 'issued', issued_quantity: 10 }) // Requested was 3
    });
    assert.strictEqual(issueExcessQtyRes.status, 400, 'Issuing quantity exceeding request quantity should fail');
    console.log('✅ Issuing blocked when issued_quantity is greater than requested');

    // G3. Storekeeper Sarah Jenkins marks Alice's request as Issued with valid quantity (Success)
    const issueRes = await fetch(`${BASE_URL}/requests/${newRequest.id}/status`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'sarah'
      },
      body: JSON.stringify({
        status: 'issued',
        issued_quantity: 3
      })
    });
    assert.strictEqual(issueRes.status, 200, 'Storekeeper issuing should succeed');
    const issuedData = await issueRes.json();
    assert.strictEqual(issuedData.status, 'issued');
    assert.strictEqual(issuedData.issued_quantity, 3);
    console.log('✅ Request issued successfully with valid issued_quantity');

    // H. Test Invalid State Transition (Issued -> Rejected)
    const postIssueModifyRes = await fetch(`${BASE_URL}/requests/${newRequest.id}/status`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'sarah'
      },
      body: JSON.stringify({ status: 'rejected' })
    });
    assert.strictEqual(postIssueModifyRes.status, 400, 'Modifying status of issued request must fail');
    console.log('✅ State transition guard: modifying issued requests blocked');

    // 6. Cleanup Test Records
    console.log('\nCleaning up test data...');
    await db.query('DELETE FROM requests WHERE id IN (?, ?)', [newRequest.id, mockRequestId]);
    console.log('✅ Test data cleaned up successfully');

    console.log('\n🎉 ALL TESTS AND SECURITY SAFETY CHECKS PASSED! 🎉');
    process.exit(0);

  } catch (error) {
    console.error('\n❌ TEST FAILED:', error.message);
    process.exit(1);
  }
}

// Wait for a second to ensure database is ready
setTimeout(runTests, 1000);
