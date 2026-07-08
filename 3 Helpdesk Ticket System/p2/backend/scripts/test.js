const assert = require('assert');
const { spawn } = require('child_process');
const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const TEST_PORT = 5001;
const BASE_URL = `http://localhost:${TEST_PORT}/api`;

async function runTests() {
  console.log('--- Starting Helpdesk Ticket System Integration Tests ---');
  
  // 1. Setup Database Connection
  const db = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'c3p2',
    port: process.env.DB_PORT || 3306
  });

  console.log('✓ Database connection successful.');

  // Create test Bob user
  const bobEmail = 'bob_test@example.com';
  const hashedPassword = await bcrypt.hash('password123', 10);
  
  // Clean up any residual test users/tickets before we start
  await db.query('DELETE FROM `users` WHERE `email` = ?', [bobEmail]);
  await db.query('DELETE FROM `tickets` WHERE `title` LIKE \'TEST_%\'');

  // Insert Bob
  await db.query('INSERT INTO `users` (`name`, `email`, `password`, `role`) VALUES (?, ?, ?, ?)', [
    'Bob Test',
    bobEmail,
    hashedPassword,
    'user'
  ]);

  console.log('✓ Seeded Bob Test user.');

  // 2. Start the API server in a background process on port 5001
  const serverProcess = spawn('node', ['server.js'], {
    env: { ...process.env, PORT: TEST_PORT },
    cwd: './'
  });

  // Wait for server to start
  await new Promise((resolve) => {
    serverProcess.stdout.on('data', (data) => {
      if (data.toString().includes('running on port')) {
        resolve();
      }
    });
  });

  console.log(`✓ Test API server started on port ${TEST_PORT}.`);

  try {
    // 3. Test Authentication
    console.log('\n--- Testing Authentication ---');
    
    // Login Alice
    const aliceLoginRes = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'alice@example.com', password: 'password123' })
    });
    assert.strictEqual(aliceLoginRes.status, 200);
    const aliceData = await aliceLoginRes.json();
    assert.ok(aliceData.token, 'Alice token is missing.');
    const aliceToken = aliceData.token;
    console.log('  ✓ Pass: Successful user login returns 200 + token.');

    // Login Bob
    const bobLoginRes = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: bobEmail, password: 'password123' })
    });
    const bobData = await bobLoginRes.json();
    const bobToken = bobData.token;
    console.log('  ✓ Pass: Successful second user login verified.');

    // Login Support Agent
    const agentLoginRes = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'agent@example.com', password: 'password123' })
    });
    assert.strictEqual(agentLoginRes.status, 200);
    const agentData = await agentLoginRes.json();
    const agentToken = agentData.token;
    console.log('  ✓ Pass: Successful support agent login verified.');

    // Login Failure (invalid credentials)
    const badLoginRes = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'alice@example.com', password: 'wrongpassword' })
    });
    assert.strictEqual(badLoginRes.status, 401);
    console.log('  ✓ Pass: Invalid login credentials correctly returns 401.');

    // 4. Test Ticket Creation & Validation
    console.log('\n--- Testing Ticket Creation & Validation ---');
    
    // Create Ticket successfully
    const createRes = await fetch(`${BASE_URL}/tickets`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${aliceToken}`
      },
      body: JSON.stringify({
        title: 'TEST_VPN Failure',
        description: 'Cannot connect to VPN',
        category: 'Hardware'
      })
    });
    assert.strictEqual(createRes.status, 201);
    const createData = await createRes.json();
    const ticketId = createData.ticketId;
    assert.ok(ticketId, 'Ticket ID is missing.');
    console.log('  ✓ Pass: Ticket creation succeeded (201).');

    // Create Ticket Validation Failure (missing fields)
    const badCreateRes = await fetch(`${BASE_URL}/tickets`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${aliceToken}`
      },
      body: JSON.stringify({ title: 'TEST_NoDesc', category: 'Hardware' })
    });
    assert.strictEqual(badCreateRes.status, 400);
    console.log('  ✓ Pass: Missing fields on creation correctly returns 400.');

    // Create Ticket Validation Failure (invalid category)
    const badCatRes = await fetch(`${BASE_URL}/tickets`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${aliceToken}`
      },
      body: JSON.stringify({
        title: 'TEST_BadCategory',
        description: 'Testing invalid category',
        category: 'UnknownCategory'
      })
    });
    assert.strictEqual(badCatRes.status, 400);
    console.log('  ✓ Pass: Invalid category value correctly returns 400.');
    // Agent tries to create a ticket (should fail with 403)
    const agentCreateRes = await fetch(`${BASE_URL}/tickets`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${agentToken}`
      },
      body: JSON.stringify({
        title: 'TEST_AgentCreated',
        description: 'Should be rejected',
        category: 'Hardware'
      })
    });
    assert.strictEqual(agentCreateRes.status, 403);
    console.log('  ✓ Pass: Support agents are blocked (403) from creating tickets.');
    // 5. Test Access Control & Ticket Visibility (Roles)
    console.log('\n--- Testing Role Access Control & Record Isolation ---');

    // Alice gets her tickets
    const aliceTicketsRes = await fetch(`${BASE_URL}/tickets`, {
      headers: { 'Authorization': `Bearer ${aliceToken}` }
    });
    const aliceTickets = await aliceTicketsRes.json();
    assert.ok(aliceTickets.every(t => t.submittedUserId === aliceData.user.id));
    console.log('  ✓ Pass: Users can only retrieve their own tickets.');

    // Bob tries to read Alice's ticket details
    const bobReadRes = await fetch(`${BASE_URL}/tickets/${ticketId}`, {
      headers: { 'Authorization': `Bearer ${bobToken}` }
    });
    assert.strictEqual(bobReadRes.status, 403);
    console.log('  ✓ Pass: Users are blocked (403) from viewing other users\' tickets.');

    // Agent reads Alice's ticket details
    const agentReadRes = await fetch(`${BASE_URL}/tickets/${ticketId}`, {
      headers: { 'Authorization': `Bearer ${agentToken}` }
    });
    assert.strictEqual(agentReadRes.status, 200);
    console.log('  ✓ Pass: Support agents can view any ticket details.');

    // 6. Test Filtering
    console.log('\n--- Testing Filtering ---');
    
    // Filter by Category
    const catFilterRes = await fetch(`${BASE_URL}/tickets?category=Hardware`, {
      headers: { 'Authorization': `Bearer ${aliceToken}` }
    });
    const catFiltered = await catFilterRes.json();
    assert.ok(catFiltered.every(t => t.category === 'Hardware'));
    console.log('  ✓ Pass: Category filtering functions correctly.');

    // Filter by Status
    const statusFilterRes = await fetch(`${BASE_URL}/tickets?status=open`, {
      headers: { 'Authorization': `Bearer ${aliceToken}` }
    });
    const statusFiltered = await statusFilterRes.json();
    assert.ok(statusFiltered.every(t => t.status === 'open'));
    console.log('  ✓ Pass: Status filtering functions correctly.');

    // 7. Test Protected Actions: Respond & Status Updates
    console.log('\n--- Testing Protected Actions (Responses & Closing) ---');

    // User tries to respond (should fail)
    const userRespondRes = await fetch(`${BASE_URL}/tickets/${ticketId}/response`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${aliceToken}`
      },
      body: JSON.stringify({ agentResponse: 'User attempting response' })
    });
    assert.strictEqual(userRespondRes.status, 403);
    console.log('  ✓ Pass: Users cannot add or edit agent responses.');

    // User tries to close or update status (should fail)
    const userStatusRes = await fetch(`${BASE_URL}/tickets/${ticketId}/status`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${aliceToken}`
      },
      body: JSON.stringify({ status: 'closed' })
    });
    assert.strictEqual(userStatusRes.status, 403);
    console.log('  ✓ Pass: Users cannot update ticket status.');

    // Agent adds response (succeeds)
    const agentRespondRes = await fetch(`${BASE_URL}/tickets/${ticketId}/response`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${agentToken}`
      },
      body: JSON.stringify({ agentResponse: 'We are resolving the issue.' })
    });
    assert.strictEqual(agentRespondRes.status, 200);
    console.log('  ✓ Pass: Support agents can respond to tickets.');

    // Agent closes ticket (succeeds)
    const agentCloseRes = await fetch(`${BASE_URL}/tickets/${ticketId}/status`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${agentToken}`
      },
      body: JSON.stringify({ status: 'closed' })
    });
    assert.strictEqual(agentCloseRes.status, 200);
    
    // Verify closedAt has been populated in details
    const checkClosedRes = await fetch(`${BASE_URL}/tickets/${ticketId}`, {
      headers: { 'Authorization': `Bearer ${agentToken}` }
    });
    const checkClosedData = await checkClosedRes.json();
    assert.strictEqual(checkClosedData.status, 'closed');
    assert.ok(checkClosedData.closedAt, 'closedAt timestamp was not populated.');
    console.log('  ✓ Pass: Support agents can close tickets and closedAt timestamp is saved.');

    // 7.5 Test Reopening Closed Tickets
    console.log('\n--- Testing Ticket Reopening ---');
    
    // User reopens ticket (succeeds)
    const userReopenRes = await fetch(`${BASE_URL}/tickets/${ticketId}/status`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${aliceToken}`
      },
      body: JSON.stringify({ status: 'open' })
    });
    assert.strictEqual(userReopenRes.status, 200);
    
    // Check ticket details after reopen
    const checkReopenedRes = await fetch(`${BASE_URL}/tickets/${ticketId}`, {
      headers: { 'Authorization': `Bearer ${aliceToken}` }
    });
    const checkReopenedData = await checkReopenedRes.json();
    assert.strictEqual(checkReopenedData.status, 'open');
    assert.strictEqual(checkReopenedData.reopened, 1);
    assert.strictEqual(checkReopenedData.closedAt, null);
    console.log('  ✓ Pass: User can reopen their closed ticket once.');

    // User tries to reopen ticket a second time (should fail with 400 since it is open)
    // First, let's close it as agent to make it closed again
    await fetch(`${BASE_URL}/tickets/${ticketId}/status`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${agentToken}`
      },
      body: JSON.stringify({ status: 'closed' })
    });

    // Now user tries to reopen it again
    const secondReopenRes = await fetch(`${BASE_URL}/tickets/${ticketId}/status`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${aliceToken}`
      },
      body: JSON.stringify({ status: 'open' })
    });
    assert.strictEqual(secondReopenRes.status, 400);
    console.log('  ✓ Pass: User is blocked (400) from reopening the same ticket a second time.');

    // Agent can close it again successfully
    const secondCloseRes = await fetch(`${BASE_URL}/tickets/${ticketId}/status`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${agentToken}`
      },
      body: JSON.stringify({ status: 'closed' })
    });
    assert.strictEqual(secondCloseRes.status, 200);
    console.log('  ✓ Pass: Support agents can respond and close the reopened ticket again.');

    // 8. Test Spoofing Protection
    console.log('\n--- Testing Spoofing Protection ---');

    // Attempt to spoof ownership on create by passing submittedUserId in body
    const spoofCreateRes = await fetch(`${BASE_URL}/tickets`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${aliceToken}`
      },
      body: JSON.stringify({
        title: 'TEST_SpoofTicket',
        description: 'Spoofed ticket',
        category: 'Hardware',
        submittedUserId: bobData.user.id // Attempting to assign ticket to Bob
      })
    });
    assert.strictEqual(spoofCreateRes.status, 201);
    const spoofCreateData = await spoofCreateRes.json();
    
    // Verify it was assigned to Alice (from token) instead of Bob
    const getSpoofedRes = await db.query('SELECT `submittedUserId` FROM `tickets` WHERE `id` = ?', [spoofCreateData.ticketId]);
    assert.strictEqual(getSpoofedRes[0][0].submittedUserId, aliceData.user.id);
    console.log('  ✓ Pass: Direct owner/role spoofing via body parameters is ignored; database identity used.');

    console.log('\n--- All Automated Backend Tests Passed Successfully! ---');
  } finally {
    // 9. Clean Up & Shutdown
    console.log('Cleaning up test data...');
    await db.query('DELETE FROM `users` WHERE `email` = ?', [bobEmail]);
    await db.query('DELETE FROM `tickets` WHERE `title` LIKE \'TEST_%\'');
    await db.end();

    serverProcess.kill();
    console.log('✓ Test API server shut down.');
  }
}

runTests().catch(err => {
  console.error('\n❌ Test execution failed with error:', err);
  process.exit(1);
});
