const assert = require('assert');
const db = require('./db');

const API_URL = 'http://localhost:5000/api';

async function runTests() {
  console.log('🧪 Starting secure token integration tests with filtering and spoofing checks...');

  const createdRequestIds = [];
  let requesterToken = '';
  let technicianToken = '';
  let testFailed = false;

  try {
    // Self-healing: Clean up any leftover test records from previous failed runs first
    console.log('Cleaning up any leftover test records before starting...');
    await db.query("DELETE FROM requests WHERE title LIKE '[TEST]%'");

    // 0. Perform Logins to acquire tokens
    console.log('Logging in as Alice (Requester)...');
    const reqLoginRes = await fetch(`${API_URL}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'alice_req', password: 'password123' })
    });
    assert.strictEqual(reqLoginRes.status, 200);
    const reqLoginData = await reqLoginRes.json();
    requesterToken = reqLoginData.token;

    console.log('Logging in as Bob (Technician)...');
    const techLoginRes = await fetch(`${API_URL}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'bob_tech', password: 'password123' })
    });
    assert.strictEqual(techLoginRes.status, 200);
    const techLoginData = await techLoginRes.json();
    technicianToken = techLoginData.token;

    // 0.5. Test Guessable Session Token rejection (Unauthorized 401)
    console.log('Testing guessable Base64 user ID session token rejection...');
    const guessableToken = Buffer.from('1').toString('base64'); // "MQ=="
    const guessableRes = await fetch(`${API_URL}/requests`, {
      headers: { 'Authorization': `Bearer ${guessableToken}` }
    });
    assert.strictEqual(guessableRes.status, 401, 'Guessable Base64 token should be rejected');
    console.log('✓ Guessable token rejection passed.');

    // 1. Setup multiple test requests for filtering assertions
    console.log('Setting up filter test cases...');
    
    // Test Case A: Location 'Lobby 1F', Priority 'High'
    const resA = await fetch(`${API_URL}/requests`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${requesterToken}` },
      body: JSON.stringify({ title: '[TEST] AC Broken', description: 'desc', location: 'Lobby 1F', priority: 'High' })
    });
    const dataA = await resA.json();
    createdRequestIds.push(dataA.id);

    // Test Case B: Location 'Roof 2F', Priority 'Low'
    const resB = await fetch(`${API_URL}/requests`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${requesterToken}` },
      body: JSON.stringify({ title: '[TEST] Light Flickering', description: 'desc', location: 'Roof 2F', priority: 'Low' })
    });
    const dataB = await resB.json();
    createdRequestIds.push(dataB.id);

    // Test Case C: Location 'Lobby 1F', Priority 'Medium'
    const resC = await fetch(`${API_URL}/requests`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${requesterToken}` },
      body: JSON.stringify({ title: '[TEST] Loose door', description: 'desc', location: 'Lobby 1F', priority: 'Medium' })
    });
    const dataC = await resC.json();
    createdRequestIds.push(dataC.id);

    // Set Test Case C status to inProgress via technician to test status filtering
    await fetch(`${API_URL}/requests/${dataC.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${technicianToken}` },
      body: JSON.stringify({ status: 'inProgress', technicianNote: 'In progress note' })
    });

    // Test Case D: High Priority (for validation of closure rules)
    const resD = await fetch(`${API_URL}/requests`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${requesterToken}` },
      body: JSON.stringify({ title: '[TEST] High Priority Item', description: 'desc', location: 'Office', priority: 'High' })
    });
    const dataD = await resD.json();
    createdRequestIds.push(dataD.id);

    // Try to close without note
    console.log('Testing closure block on high priority request with empty note...');
    const invalidCloseRes = await fetch(`${API_URL}/requests/${dataD.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${technicianToken}` },
      body: JSON.stringify({ status: 'closed', technicianNote: '' })
    });
    assert.strictEqual(invalidCloseRes.status, 400, 'Closure without note should fail (400)');
    console.log('✓ Closure block passed.');

    // Close with a note
    console.log('Testing closure success on high priority request with valid note...');
    const validCloseRes = await fetch(`${API_URL}/requests/${dataD.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${technicianToken}` },
      body: JSON.stringify({ status: 'closed', technicianNote: 'Repaired successfully.' })
    });
    assert.strictEqual(validCloseRes.status, 200, 'Closure with note should succeed (200)');
    console.log('✓ Closure success passed.');

    console.log('✓ Filter test cases initialized.');

    // 2. Test Filters (Isolate tests using '[TEST]' title prefix check)
    console.log('Testing filter by Location (Lobby)...');
    const filterLocRes = await fetch(`${API_URL}/requests?location=Lobby`, {
      headers: { 'Authorization': `Bearer ${technicianToken}` }
    });
    const filterLocData = await filterLocRes.json();
    const locTitles = filterLocData.filter(r => r.title.startsWith('[TEST]')).map(r => r.title);
    assert.ok(locTitles.includes('[TEST] AC Broken'));
    assert.ok(locTitles.includes('[TEST] Loose door'));
    assert.ok(!locTitles.includes('[TEST] Light Flickering'));
    console.log('✓ Filter by location passed.');

    console.log('Testing filter by Priority (Low)...');
    const filterPrioRes = await fetch(`${API_URL}/requests?priority=Low`, {
      headers: { 'Authorization': `Bearer ${technicianToken}` }
    });
    const filterPrioData = await filterPrioRes.json();
    const prioTitles = filterPrioData.filter(r => r.title.startsWith('[TEST]')).map(r => r.title);
    assert.strictEqual(prioTitles.length, 1);
    assert.strictEqual(prioTitles[0], '[TEST] Light Flickering');
    console.log('✓ Filter by priority passed.');

    console.log('Testing filter by Status (inProgress)...');
    const filterStatusRes = await fetch(`${API_URL}/requests?status=inProgress`, {
      headers: { 'Authorization': `Bearer ${technicianToken}` }
    });
    const filterStatusData = await filterStatusRes.json();
    const statusTitles = filterStatusData.filter(r => r.title.startsWith('[TEST]')).map(r => r.title);
    assert.strictEqual(statusTitles.length, 1);
    assert.strictEqual(statusTitles[0], '[TEST] Loose door');
    console.log('✓ Filter by status passed.');

    // 3. Test Security: Direct Role/Owner Spoofing Checks
    console.log('Testing role spoofing in request body (attempting technician action using requester token)...');
    const spoofRoleRes = await fetch(`${API_URL}/requests/${dataA.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${requesterToken}` },
      body: JSON.stringify({
        status: 'closed',
        technicianNote: 'Spoofed note',
        role: 'technician'
      })
    });
    assert.strictEqual(spoofRoleRes.status, 403, 'Should reject with 403 Forbidden even if role:technician is passed in body');
    console.log('✓ Role spoofing check passed.');

    console.log('Testing owner name spoofing (attempting to override requester name in submit body)...');
    const spoofOwnerRes = await fetch(`${API_URL}/requests`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${requesterToken}` },
      body: JSON.stringify({
        title: '[TEST] Spoof request',
        description: 'Trying to pretend to be Bob',
        location: 'Lobby',
        priority: 'Low',
        requesterName: 'Bob Technician'
      })
    });
    assert.strictEqual(spoofOwnerRes.status, 201);
    const spoofOwnerData = await spoofOwnerRes.json();
    createdRequestIds.push(spoofOwnerData.id);

    // Verify directly in the DB that the database owner name is derived from DB record of token user, NOT body
    const [spoofDbRows] = await db.query('SELECT requester_name FROM requests WHERE id = ?', [spoofOwnerData.id]);
    assert.strictEqual(spoofDbRows[0].requester_name, 'Alice Requester', 'Database owner must be "Alice Requester" (derived from active token), not "Bob Technician"');
    console.log('✓ Owner name spoofing check passed.');

    console.log('🎉 All integration, filtering, and security spoofing tests passed successfully!');

  } catch (error) {
    console.error('❌ Integration tests failed:', error);
    testFailed = true;
  } finally {
    // 4. Clean up all test records matching our IDs
    if (createdRequestIds.length > 0) {
      console.log('🧹 Cleaning up test request records...');
      await db.query('DELETE FROM requests WHERE id IN (?)', [createdRequestIds]);
      console.log('Cleanup finished.');
    }
    // Close db pool
    await db.end();
    
    if (testFailed) {
      process.exit(1);
    }
  }
}

runTests();
