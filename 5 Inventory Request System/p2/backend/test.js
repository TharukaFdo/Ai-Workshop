const { fork } = require('child_process');
const mysql = require('mysql2/promise');
require('dotenv').config();

const BASE_URL = 'http://localhost:5000';

async function runTests() {
  console.log('--- Starting Automated Login, Authorization & Spoofing Prevention Tests ---');
  
  // 1. Reset database first using setup script
  console.log('Resetting database...');
  const setupDb = fork('db-setup.js', ['--reset']);
  await new Promise((resolve) => setupDb.on('exit', resolve));
  
  // Connect to DB directly to fetch seeded user IDs for verification
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '3306'),
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'c5p2'
  });

  const [[aliceUser]] = await connection.query('SELECT * FROM users WHERE username = "Alice"');
  const [[charlieUser]] = await connection.query('SELECT * FROM users WHERE username = "Charlie"');

  // 2. Start Express server in background
  console.log('Starting Express server...');
  const server = fork('server.js');
  
  // Wait a short duration to ensure server port is bound
  await new Promise((resolve) => setTimeout(resolve, 1500));

  let exitCode = 0;

  try {
    // Assert helper
    const assert = (condition, message) => {
      if (!condition) {
        throw new Error(`Assertion Failed: ${message}`);
      }
      console.log(`✓ PASS: ${message}`);
    };

    // --- TEST 0: Log in to retrieve session tokens ---
    console.log('\nRunning Test 0: Login and obtain session tokens...');
    
    // Login Alice
    const aliceLoginRes = await fetch(`${BASE_URL}/api/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'Alice', password: 'password123' })
    });
    assert(aliceLoginRes.status === 200, 'Alice login status should be 200 OK');
    const { token: aliceToken } = await aliceLoginRes.json();
    assert(aliceToken !== undefined, 'Alice token is issued');

    // Login Charlie
    const charlieLoginRes = await fetch(`${BASE_URL}/api/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'Charlie', password: 'password123' })
    });
    assert(charlieLoginRes.status === 200, 'Charlie login status should be 200 OK');
    const { token: charlieToken } = await charlieLoginRes.json();
    assert(charlieToken !== undefined, 'Charlie token is issued');

    // Test bad login
    const badLoginRes = await fetch(`${BASE_URL}/api/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'Alice', password: 'wrongpassword' })
    });
    assert(badLoginRes.status === 401, 'Invalid password should return 401 Unauthorized');

    // --- TEST 1: Submit new inventory request as Alice (Staff) ---
    console.log('\nRunning Test 1: Submit new inventory request...');
    const postRes = await fetch(`${BASE_URL}/api/requests`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${aliceToken}`
      },
      body: JSON.stringify({
        item_name: 'Test Wireless Mouse',
        quantity: 3,
        reason: 'Office desk replacement',
        requested_date: '2026-07-11'
      })
    });
    
    assert(postRes.status === 201, 'Request creation status should be 201 Created');
    const newRequest = await postRes.json();
    assert(newRequest.item_name === 'Test Wireless Mouse', 'Item name should match input');
    assert(newRequest.status === 'pending', 'Initial status should be pending');
    assert(newRequest.requester_name === 'Alice', 'Requester name should be Alice');

    // --- TEST 2: Submit with invalid data (fails validation) ---
    console.log('\nRunning Test 2: Validation checks...');
    const badRes = await fetch(`${BASE_URL}/api/requests`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${aliceToken}`
      },
      body: JSON.stringify({
        item_name: '',
        quantity: -5,
        reason: '',
        requested_date: '2026-07-11'
      })
    });
    assert(badRes.status === 400, 'Bad input should return 400 Bad Request');
    const badResData = await badRes.json();
    assert(badResData.error !== undefined, `Should return validation error: "${badResData.error}"`);

    // --- TEST 3: Staff (Alice) attempts to approve request (fails authorization) ---
    console.log('\nRunning Test 3: Guard staff from approving requests...');
    const staffApproveRes = await fetch(`${BASE_URL}/api/requests/${newRequest.id}/status`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${aliceToken}`
      },
      body: JSON.stringify({
        status: 'approved',
        storekeeper_note: 'Sneaky approval note'
      })
    });
    assert(staffApproveRes.status === 403, 'Staff approval should return 403 Forbidden');
    const staffApproveData = await staffApproveRes.json();
    assert(staffApproveData.error.includes('Only storekeepers can approve'), 'Error message should restrict to storekeepers');

    // --- TEST 4: Storekeeper (Charlie) approves request (succeeds) ---
    console.log('\nRunning Test 4: Storekeeper approval...');
    const approveRes = await fetch(`${BASE_URL}/api/requests/${newRequest.id}/status`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${charlieToken}`
      },
      body: JSON.stringify({
        status: 'approved',
        storekeeper_note: 'Approved for general use'
      })
    });
    assert(approveRes.status === 200, 'Storekeeper approval should return 200 OK');
    const approvedRequest = await approveRes.json();
    assert(approvedRequest.status === 'approved', 'Status should transition to approved');
    assert(approvedRequest.storekeeper_note === 'Approved for general use', 'Note should be saved');

    // --- TEST 5: Self-Approval Prevention (Charlie tries to approve request made by Charlie) ---
    console.log('\nRunning Test 5: Self-approval prevention...');
    // Create a request where Charlie (storekeeper) is the requester
    const [charlieReqResult] = await connection.query(
      'INSERT INTO requests (item_name, quantity, reason, requested_date, requester_id, requester_name, status) VALUES (?, ?, ?, ?, ?, ?, ?)',
      ['Charlie Test Request', 1, 'Testing self-approval', '2026-07-11', charlieUser.id, charlieUser.username, 'pending']
    );
    const charlieReqId = charlieReqResult.insertId;

    const selfApproveRes = await fetch(`${BASE_URL}/api/requests/${charlieReqId}/status`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${charlieToken}`
      },
      body: JSON.stringify({
        status: 'approved',
        storekeeper_note: 'Trying to self-approve'
      })
    });
    assert(selfApproveRes.status === 403, 'Self-approval should return 403 Forbidden');
    const selfApproveData = await selfApproveRes.json();
    assert(selfApproveData.error.includes('Storekeepers cannot approve or manage requests they submitted'), 'Error should forbid self-action');

    // --- TEST 6: Storekeeper marks approved request as Issued (with boundaries) ---
    console.log('\nRunning Test 6: Mark request as issued (with boundary validations)...');
    
    // Fails: Missing issued quantity
    const badIssueRes1 = await fetch(`${BASE_URL}/api/requests/${newRequest.id}/status`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${charlieToken}`
      },
      body: JSON.stringify({
        status: 'issued',
        storekeeper_note: 'Missing qty'
      })
    });
    assert(badIssueRes1.status === 400, 'Omitting issued quantity should return 400 Bad Request');

    // Fails: Issued quantity exceeds requested quantity (requested was 3, trying to issue 4)
    const badIssueRes2 = await fetch(`${BASE_URL}/api/requests/${newRequest.id}/status`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${charlieToken}`
      },
      body: JSON.stringify({
        status: 'issued',
        issued_quantity: 4,
        storekeeper_note: 'Exceeding qty'
      })
    });
    assert(badIssueRes2.status === 400, 'Exceeding requested quantity should return 400 Bad Request');

    // Succeeds: Valid issued quantity (3)
    const issueRes = await fetch(`${BASE_URL}/api/requests/${newRequest.id}/status`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${charlieToken}`
      },
      body: JSON.stringify({
        status: 'issued',
        issued_quantity: 3,
        storekeeper_note: 'Handed over to staff'
      })
    });
    assert(issueRes.status === 200, 'Marking issued with valid quantity should return 200 OK');
    const issuedRequest = await issueRes.json();
    assert(issuedRequest.status === 'issued', 'Status should transition to issued');
    assert(issuedRequest.issued_quantity === 3, 'Issued quantity should be recorded');
    assert(issuedRequest.issued_at !== null, 'Issued timestamp should be set');

    // --- TEST 7: Filtering and List retrieval ---
    console.log('\nRunning Test 7: Retrieval and filtering queries...');
    const listRes = await fetch(`${BASE_URL}/api/requests?item_name=Wireless`, {
      headers: {
        'Authorization': `Bearer ${charlieToken}`
      }
    });
    assert(listRes.status === 200, 'List retrieval with filter should return 200 OK');
    const filteredList = await listRes.json();
    assert(filteredList.length >= 1, 'Should find at least 1 item matching "Wireless"');
    assert(filteredList[0].item_name.includes('Wireless'), 'Item name should match query');

    // --- TEST 8: Spoofing Prevention - Submission Body Spoofing ---
    console.log('\nRunning Test 8: Body Spoofing check...');
    const spoofPostRes = await fetch(`${BASE_URL}/api/requests`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${aliceToken}`
      },
      body: JSON.stringify({
        item_name: 'Test Spoofed Monitor',
        quantity: 1,
        reason: 'Attempting to spoof name',
        requested_date: '2026-07-11',
        // Attempt to spoof fields
        requester_name: 'Charlie',
        requester_id: charlieUser.id,
        status: 'approved'
      })
    });
    assert(spoofPostRes.status === 201, 'Spoofed post creation returns 201 Created');
    const spoofedRequest = await spoofPostRes.json();
    assert(spoofedRequest.requester_name === 'Alice', 'Should ignore body requester_name spoof and use DB authenticated username "Alice"');
    assert(spoofedRequest.requester_id === aliceUser.id, 'Should ignore body requester_id spoof and use DB authenticated user ID');
    assert(spoofedRequest.status === 'pending', 'Should ignore body status spoof and force status to "pending"');

    // --- TEST 9: Spoofing Prevention - Header & Query Parameter Spoofing ---
    console.log('\nRunning Test 9: Header and Query Spoofing check...');
    // Alice tries to approve her request by sending spoofed role parameters in body/query/headers
    const spoofApproveRes = await fetch(`${BASE_URL}/api/requests/${newRequest.id}/status?role=storekeeper`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${aliceToken}`,
        'x-user-role': 'storekeeper',
        'x-role': 'storekeeper'
      },
      body: JSON.stringify({
        status: 'approved',
        storekeeper_note: 'Attempting to spoof storekeeper status',
        role: 'storekeeper'
      })
    });
    assert(spoofApproveRes.status === 403, 'Should reject spoofed approval request with 403 Forbidden');
    const spoofApproveData = await spoofApproveRes.json();
    assert(spoofApproveData.error.includes('Only storekeepers can approve'), 'Should fetch role securely from DB using the session token, ignoring client parameters');

    console.log('\nAll integration and spoofing tests passed successfully!');

    // Cleanup: clean up test requests created during run
    console.log('\nCleaning up test records...');
    await connection.query('DELETE FROM requests WHERE item_name LIKE "Test %" OR item_name = "Charlie Test Request"');
    console.log('Cleanup completed.');

  } catch (err) {
    console.error('\nTest execution failed:', err);
    exitCode = 1;
  } finally {
    // Shutdown servers and connection
    await connection.end();
    server.kill();
    // Wait a short duration to ensure process frees port
    await new Promise((resolve) => setTimeout(resolve, 500));
    process.exit(exitCode);
  }
}

runTests();
