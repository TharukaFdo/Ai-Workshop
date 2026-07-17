const { fork } = require('child_process');
const mysql = require('mysql2/promise');
require('dotenv').config();

const BASE_URL = 'http://localhost:5000';

async function runTests() {
  console.log('=== Start Inventory System Verification Suite ===');
  
  // 1. Reset Database
  console.log('Resetting database...');
  const dbInitProcess = fork('scripts/db_init.js');
  await new Promise((resolve) => dbInitProcess.on('exit', resolve));
  
  // Establish database connection to verify records directly and seed verification constraints
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '3306'),
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'c5p3'
  });

  const [[john]] = await connection.query('SELECT * FROM users WHERE username = "john_staff"');
  const [[jane]] = await connection.query('SELECT * FROM users WHERE username = "jane_staff"');
  const [[bob]] = await connection.query('SELECT * FROM users WHERE username = "bob_storekeeper"');

  if (!john || !jane || !bob) {
    console.error('Test users not found in database.');
    process.exit(1);
  }

  // 2. Start Backend Server
  console.log('Starting backend server...');
  const server = fork('server.js');
  
  // Wait for server to bind
  await new Promise((resolve) => setTimeout(resolve, 1500));

  let exitCode = 0;

  try {
    const assert = (condition, message) => {
      if (!condition) {
        throw new Error(`Assertion Failed: ${message}`);
      }
      console.log(`✓ PASS: ${message}`);
    };

    // --- TEST 0: Database Connection and Setup check ---
    assert(connection !== null, 'Database connection established successfully');

    // --- TEST 1: Database-Backed Login Flow ---
    console.log('\nRunning Test 1: Database-backed JWT Login...');
    const loginRes = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'john_staff', password: 'password123' })
    });
    assert(loginRes.status === 200, 'Valid login returns 200 OK');
    const { token: johnToken } = await loginRes.json();
    assert(johnToken !== undefined, 'John is issued a valid JWT token');

    const bobLoginRes = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'bob_storekeeper', password: 'password123' })
    });
    const { token: bobToken } = await bobLoginRes.json();

    const badLoginRes = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'john_staff', password: 'badpassword' })
    });
    assert(badLoginRes.status === 401, 'Invalid password rejected with 401 Unauthorized');

    // --- TEST 2: Submit New Request (Staff allowed, validations verified) ---
    console.log('\nRunning Test 2: Request Submission & Validation...');
    const postRes = await fetch(`${BASE_URL}/api/requests`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${johnToken}`
      },
      body: JSON.stringify({
        itemName: 'VERIFY_TEST_ItemA',
        quantity: 5,
        reason: 'Verification testing workspace',
        requestedDate: '2026-07-11'
      })
    });
    assert(postRes.status === 201, 'Request submission status should be 201 Created');
    const newRequest = await postRes.json();
    assert(newRequest.item_name === 'VERIFY_TEST_ItemA', 'Item name matches');
    assert(newRequest.status === 'pending', 'Initial request state is pending');

    // Bad validations
    const badPostRes = await fetch(`${BASE_URL}/api/requests`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${johnToken}`
      },
      body: JSON.stringify({
        itemName: '',
        quantity: -1,
        reason: '',
        requestedDate: '2026-07-11'
      })
    });
    assert(badPostRes.status === 400, 'Invalid request parameters return 400 Bad Request');

    // --- TEST 3: Role Authorization - Staff Allowed & Blocked Actions ---
    console.log('\nRunning Test 3: Staff allowed & blocked actions...');
    // Blocked: Staff cannot approve/reject requests
    const staffApproveRes = await fetch(`${BASE_URL}/api/requests/${newRequest.id}/approve`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${johnToken}`
      },
      body: JSON.stringify({ status: 'approved', storekeeperNote: 'Staff approved' })
    });
    assert(staffApproveRes.status === 403, 'Staff is blocked from approving requests (403 Forbidden)');

    // Allowed: Staff can view their own requests
    const staffListRes = await fetch(`${BASE_URL}/api/requests`, {
      headers: { 'Authorization': `Bearer ${johnToken}` }
    });
    assert(staffListRes.status === 200, 'Staff can view their requests list (200 OK)');
    const staffList = await staffListRes.json();
    assert(staffList.every(r => r.requester_id === john.id), 'Staff list contains only their own requests');

    // Blocked: Staff cannot access requests of other users
    const janeLoginRes = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'jane_staff', password: 'password123' })
    });
    const { token: janeToken } = await janeLoginRes.json();
    const janeListRes = await fetch(`${BASE_URL}/api/requests`, {
      headers: { 'Authorization': `Bearer ${janeToken}` }
    });
    const janeList = await janeListRes.json();
    assert(!janeList.some(r => r.requester_id === john.id), 'Jane cannot view John\'s request records');

    // --- TEST 4: Role Authorization - Storekeeper Allowed & Blocked Actions ---
    console.log('\nRunning Test 4: Storekeeper allowed & blocked actions...');
    // Blocked: Storekeeper cannot submit new requests (requires staff role)
    const storekeeperPostRes = await fetch(`${BASE_URL}/api/requests`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${bobToken}`
      },
      body: JSON.stringify({
        itemName: 'VERIFY_TEST_ItemB',
        quantity: 1,
        reason: 'Storekeeper submission attempt',
        requestedDate: '2026-07-11'
      })
    });
    assert(storekeeperPostRes.status === 403, 'Storekeeper is blocked from submitting requests (403 Forbidden)');

    // Allowed: Storekeeper can view all requests
    const storekeeperListRes = await fetch(`${BASE_URL}/api/requests`, {
      headers: { 'Authorization': `Bearer ${bobToken}` }
    });
    assert(storekeeperListRes.status === 200, 'Storekeeper can view all requests (200 OK)');
    const storekeeperList = await storekeeperListRes.json();
    // Verify it has both John's and Jane's records
    const hasJohn = storekeeperList.some(r => r.requester_name.includes('John'));
    const hasJane = storekeeperList.some(r => r.requester_name.includes('Jane'));
    assert(hasJohn && hasJane, 'Storekeeper list retrieves requests from multiple staff members');

    // --- TEST 5: Approve or Reject request & Edit Notes (Storekeeper) ---
    console.log('\nRunning Test 5: Approve/Reject & Edit Notes...');
    const approveRes = await fetch(`${BASE_URL}/api/requests/${newRequest.id}/approve`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${bobToken}`
      },
      body: JSON.stringify({
        status: 'approved',
        storekeeperNote: 'Approved under verification testing'
      })
    });
    assert(approveRes.status === 200, 'Storekeeper approved request successfully');
    const approvedReq = await approveRes.json();
    assert(approvedReq.status === 'approved', 'Status transitioned to approved');
    assert(approvedReq.storekeeper_note === 'Approved under verification testing', 'Storekeeper note saved');

    // Invalid transition check
    const badTransitionRes = await fetch(`${BASE_URL}/api/requests/${newRequest.id}/approve`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${bobToken}`
      },
      body: JSON.stringify({ status: 'pending' }) // Invalid status
    });
    assert(badTransitionRes.status === 400, 'Invalid status transitions are rejected with 400');

    // --- TEST 6: Mark Items Issued (Storekeeper) ---
    console.log('\nRunning Test 6: Mark items as issued...');
    // Fails validation: issued quantity exceeds requested quantity (requested was 5, trying to issue 6)
    const exceedIssueRes = await fetch(`${BASE_URL}/api/requests/${newRequest.id}/issue`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${bobToken}`
      },
      body: JSON.stringify({ issuedQuantity: 6 })
    });
    assert(exceedIssueRes.status === 400, 'Issued quantity exceeding requested limit returns 400 Bad Request');

    // Succeeds: Valid issued quantity (5)
    const validIssueRes = await fetch(`${BASE_URL}/api/requests/${newRequest.id}/issue`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${bobToken}`
      },
      body: JSON.stringify({ issuedQuantity: 5 })
    });
    assert(validIssueRes.status === 200, 'Marking items issued returns 200 OK');
    const issuedReq = await validIssueRes.json();
    assert(issuedReq.status === 'issued', 'Status is now issued');
    assert(issuedReq.issued_quantity === 5, 'Issued quantity matches');
    assert(issuedReq.issued_at !== null, 'Issued timestamp set');

    // --- TEST 7: Self-Approval Prevention Guard ---
    console.log('\nRunning Test 7: Self-approval prevention...');
    // Create a request where Bob (Storekeeper) is the requester. Since Bob cannot use POST /api/requests,
    // we bypass it and insert the test record directly into the DB.
    const [bobRequest] = await connection.query(
      `INSERT INTO \`inventory_requests\` 
      (\`item_name\`, \`quantity\`, \`reason\`, \`requested_date\`, \`requester_id\`, \`requester_name\`, \`status\`) 
      VALUES (?, ?, ?, ?, ?, ?, ?);`,
      ['VERIFY_TEST_BobSelfItem', 2, 'Testing self approval restriction', '2026-07-11', bob.id, bob.full_name, 'pending']
    );
    
    // Bob attempts to approve his own request
    const selfApproveRes = await fetch(`${BASE_URL}/api/requests/${bobRequest.insertId}/approve`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${bobToken}`
      },
      body: JSON.stringify({
        status: 'approved',
        storekeeperNote: 'Trying to self approve'
      })
    });
    assert(selfApproveRes.status === 403, 'Storekeeper is blocked from approving their own request (403 Forbidden)');

    // --- TEST 8: Query Filtering (Item Name, Requester, Status) ---
    console.log('\nRunning Test 8: Filter queries...');
    const filterRes = await fetch(`${BASE_URL}/api/requests?itemName=VERIFY_TEST_&status=issued`, {
      headers: { 'Authorization': `Bearer ${bobToken}` }
    });
    assert(filterRes.status === 200, 'Filter query returns 200 OK');
    const filtered = await filterRes.json();
    assert(filtered.length >= 1, 'Filter returns matching verification record');
    assert(filtered.every(r => r.item_name.includes('VERIFY_TEST_') && r.status === 'issued'), 'Results match filters');

    // --- TEST 9: Body and Parameter Security Spoofing prevention check ---
    console.log('\nRunning Test 9: Body/Header parameter spoofing prevention...');
    const spoofPostRes = await fetch(`${BASE_URL}/api/requests`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${johnToken}`
      },
      body: JSON.stringify({
        itemName: 'VERIFY_TEST_Spoof',
        quantity: 1,
        reason: 'Spoofing attempt',
        requestedDate: '2026-07-11',
        // Attempting to spoof identity
        requesterName: 'Bob Johnson (Storekeeper)',
        requesterId: bob.id,
        status: 'approved'
      })
    });
    assert(spoofPostRes.status === 201, 'Request submission returns 201 Created');
    const spoofedRequest = await spoofPostRes.json();
    assert(spoofedRequest.requester_name === john.full_name, 'Requester name derived from authenticated DB token instead of client body input');
    assert(spoofedRequest.requester_id === john.id, 'Requester ID derived from authenticated DB token instead of client body input');
    assert(spoofedRequest.status === 'pending', 'Status forced to pending ignoring client body input');

    console.log('\nAll integration tests completed successfully!');

  } catch (err) {
    console.error('\nTest Execution Failed:', err.message);
    exitCode = 1;
  } finally {
    // 3. Cleanup Test Records
    console.log('Cleaning up test records from database...');
    await connection.query('DELETE FROM \`inventory_requests\` WHERE item_name LIKE "VERIFY_TEST_%"');
    
    // Close processes
    await connection.end();
    server.kill();
    // Let port clear
    await new Promise((resolve) => setTimeout(resolve, 500));
    process.exit(exitCode);
  }
}

runTests();
