const mysql = require('mysql2/promise');
require('dotenv').config();

const API_URL = 'http://localhost:5001/api';

async function runTests() {
  console.log('====================================================');
  console.log('      Maintenance Tracker Integration Test Suite     ');
  console.log('====================================================');

  let requesterToken = '';
  let techToken = '';
  let createdRequestId = null;
  let dbConnection = null;

  try {
    // 0. Establish DB connection
    console.log('\n[1/8] Connecting to database...');
    dbConnection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || 3306,
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'c7p1'
    });
    console.log('✓ Database connection established.');

    // 1. Test Login Endpoint
    console.log('\n[2/8] Testing user login...');
    const badLoginRes = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'requester1', password: 'wrongpassword' })
    });
    if (badLoginRes.status !== 401) {
      throw new Error(`Expected invalid login to return 401, got ${badLoginRes.status}`);
    }
    console.log('✓ Invalid credentials rejected correctly.');

    const reqLoginRes = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'requester1', password: 'password123' })
    });
    const reqLoginData = await reqLoginRes.json();
    requesterToken = reqLoginData.token;
    console.log('✓ Requester logged in successfully.');

    const techLoginRes = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'tech1', password: 'password123' })
    });
    const techLoginData = await techLoginRes.json();
    techToken = techLoginData.token;
    console.log('✓ Technician logged in successfully.');

    // 2. Test Request Creation Security & MySQL Persistence
    console.log('\n[3/8] Testing request creation rules (persisting to MySQL)...');
    
    // Check technician cannot create request
    const forbiddenCreateRes = await fetch(`${API_URL}/requests`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${techToken}`
      },
      body: JSON.stringify({
        title: 'TECH_SUBMIT_TEST',
        description: 'Should fail',
        location: 'Zone 5',
        priority: 'High',
        requester_name: 'tech1'
      })
    });
    if (forbiddenCreateRes.status !== 403) {
      throw new Error(`Expected tech request creation to return 403 Forbidden, got ${forbiddenCreateRes.status}`);
    }
    console.log('✓ Technicians are correctly blocked from submitting new requests.');

    // Check invalid priority check
    const badPriorityRes = await fetch(`${API_URL}/requests`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${requesterToken}`
      },
      body: JSON.stringify({
        title: 'BAD_PRIORITY_TEST',
        description: 'Should fail',
        location: 'Zone 5',
        priority: 'CriticalEmergency',
        requester_name: 'requester1'
      })
    });
    if (badPriorityRes.status !== 400) {
      throw new Error(`Expected invalid priority request creation to return 400 Bad Request, got ${badPriorityRes.status}`);
    }
    console.log('✓ Garbage priorities are correctly rejected.');

    // Successful creation
    const newRequestPayload = {
      title: 'TEST_REQUEST_DO_NOT_DELETE_YET',
      description: 'Integration test request description',
      location: 'Test Zone Area 51',
      priority: 'High',
      requester_name: 'requester1'
    };

    const createRes = await fetch(`${API_URL}/requests`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${requesterToken}`
      },
      body: JSON.stringify(newRequestPayload)
    });
    const createData = await createRes.json();
    if (!createRes.ok || !createData.id) {
      throw new Error('Request creation failed: ' + (createData.error || createRes.statusText));
    }
    createdRequestId = createData.id;
    console.log(`✓ Request created successfully with ID #${createdRequestId}.`);

    // Verify written to database directly and holds the urgent flag
    const [rows] = await dbConnection.query('SELECT * FROM requests WHERE id = ?', [createdRequestId]);
    if (rows.length === 0) {
      throw new Error('Request not found in MySQL database directly.');
    }
    if (rows[0].is_urgent !== 1) {
      throw new Error('Expected created High priority request to have is_urgent flag set to 1.');
    }
    console.log('✓ Directly verified request was written to MySQL and has is_urgent = 1.');

    // 3. Test Permissions (Requester trying to update status/notes)
    console.log('\n[4/8] Testing permission restrictions (Requester role block)...');
    const forbiddenUpdateRes = await fetch(`${API_URL}/requests/${createdRequestId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${requesterToken}`
      },
      body: JSON.stringify({
        status: 'In Progress',
        technician_notes: 'Requesters cannot do this'
      })
    });
    if (forbiddenUpdateRes.status !== 403) {
      throw new Error(`Expected requester status update to be 403 Forbidden, got ${forbiddenUpdateRes.status}`);
    }
    console.log('✓ Server blocked requester from updating progress successfully (403 Forbidden).');

    // 4. Test Main Work (Technician updating progress)
    console.log('\n[5/8] Testing technician progress update...');
    const progressUpdateRes = await fetch(`${API_URL}/requests/${createdRequestId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${techToken}`
      },
      body: JSON.stringify({
        status: 'In Progress',
        technician_notes: 'Tech is working on it'
      })
    });
    const progressData = await progressUpdateRes.json();
    if (!progressUpdateRes.ok) {
      throw new Error('Technician update failed: ' + (progressData.error || progressUpdateRes.statusText));
    }
    console.log('✓ Technician successfully updated status to "In Progress".');

    // Test Closure (Urgent Request: must block closure if notes are empty)
    console.log('\n[6/8] Testing request closure note requirement for urgent tickets...');
    
    // First try closing without notes (we updated notes to 'Tech is working on it' in step 5, so let's send an empty notes string to test blocking)
    const badCloseRes = await fetch(`${API_URL}/requests/${createdRequestId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${techToken}`
      },
      body: JSON.stringify({
        status: 'Closed',
        technician_notes: '' // Empty notes
      })
    });
    if (badCloseRes.status !== 400) {
      throw new Error(`Expected urgent closure without notes to return 400 Bad Request, got ${badCloseRes.status}`);
    }
    console.log('✓ Urgent request closure without notes blocked successfully.');

    // Now try closing with valid notes
    const closeRes = await fetch(`${API_URL}/requests/${createdRequestId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${techToken}`
      },
      body: JSON.stringify({
        status: 'Closed',
        technician_notes: 'Urgent issue resolved successfully.'
      })
    });
    const closeData = await closeRes.json();
    if (!closeRes.ok || closeData.status !== 'Closed') {
      throw new Error('Closure with notes failed: ' + (closeData.error || closeRes.statusText));
    }
    console.log('✓ Urgent request closed successfully with notes.');

    // 5. Test Closed Ticket Locking
    console.log('\n[7/8] Testing closed ticket security locking...');
    const lockedUpdateRes = await fetch(`${API_URL}/requests/${createdRequestId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${techToken}`
      },
      body: JSON.stringify({
        status: 'Open',
        technician_notes: 'Trying to reopen closed ticket'
      })
    });
    if (lockedUpdateRes.status !== 400) {
      throw new Error(`Expected update on closed ticket to be blocked with 400 Bad Request, got ${lockedUpdateRes.status}`);
    }
    console.log('✓ Server blocked technician from updating closed ticket successfully.');

    // 6. Test Filters and Stats (Extra Part)
    console.log('\n[8/8] Testing query filters & stats...');
    const statsRes = await fetch(`${API_URL}/requests/stats`, {
      headers: { 'Authorization': `Bearer ${techToken}` }
    });
    const statsData = await statsRes.json();
    if (!statsRes.ok || typeof statsData.total !== 'number') {
      throw new Error('Stats endpoint failed.');
    }
    console.log(`✓ Stats loaded: Total=${statsData.total}, Closed=${statsData.closed}`);

    const filterRes = await fetch(`${API_URL}/requests?status=Closed&location=Test`, {
      headers: { 'Authorization': `Bearer ${techToken}` }
    });
    const filterData = await filterRes.json();
    if (!filterRes.ok) {
      throw new Error('Filter query failed.');
    }
    const hasTestRequest = filterData.some(r => r.id === createdRequestId);
    if (!hasTestRequest) {
      throw new Error('Filtered results did not contain the closed test request.');
    }
    console.log('✓ Query filters successfully verified closed ticket.');

    console.log('\n====================================================');
    console.log('✓ ALL TESTS PASSED SUCCESSFULLY!');
    console.log('====================================================');

  } catch (error) {
    console.error('\n❌ TEST SUITE FAILED:', error.message);
    process.exitCode = 1;
  } finally {
    // 7. Cleanup test data
    if (dbConnection && createdRequestId) {
      console.log('\nCleaning up test data from MySQL database...');
      try {
        await dbConnection.query('DELETE FROM requests WHERE id = ?', [createdRequestId]);
        console.log('✓ Test request deleted successfully.');
      } catch (cleanupErr) {
        console.error('Failed to clean up test data:', cleanupErr);
      }
    }
    if (dbConnection) {
      await dbConnection.end();
    }
    console.log('Test process complete.');
  }
}

setTimeout(runTests, 500);
