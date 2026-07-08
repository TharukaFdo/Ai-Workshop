const { spawn } = require('child_process');
const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const TEST_PORT = 5001;
const TEST_BASE_URL = `http://localhost:${TEST_PORT}/api`;

async function runTests() {
  console.log('--- STARTING INTEGRATION TESTS ---');

  // 1. Setup Database Connection
  const db = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '3306', 10),
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD !== undefined ? process.env.DB_PASSWORD : '',
    database: process.env.DB_NAME || 'c3p1'
  });

  console.log('Connected to MySQL. Preparing test accounts...');

  // 2. Clear any old test users
  await db.query('DELETE FROM users WHERE username LIKE "test_%"');

  // 3. Create test users
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash('testpassword', salt);

  const [resAlice] = await db.query(
    'INSERT INTO users (username, password, role) VALUES (?, ?, ?)',
    ['test_alice', hashedPassword, 'customer']
  );
  const [resBob] = await db.query(
    'INSERT INTO users (username, password, role) VALUES (?, ?, ?)',
    ['test_bob', hashedPassword, 'customer']
  );
  const [resAgent] = await db.query(
    'INSERT INTO users (username, password, role) VALUES (?, ?, ?)',
    ['test_agent', hashedPassword, 'agent']
  );

  const aliceId = resAlice.insertId;
  const bobId = resBob.insertId;
  const agentId = resAgent.insertId;

  console.log(`Created test users: test_alice (ID:${aliceId}), test_bob (ID:${bobId}), test_agent (ID:${agentId})`);

  // 4. Start backend server programmatically
  console.log(`Spawning test server on port ${TEST_PORT}...`);
  const serverProcess = spawn('node', ['server.js'], {
    env: { ...process.env, PORT: TEST_PORT.toString() },
    shell: true
  });

  // Give the server a moment to spin up and check health
  await new Promise((resolve) => setTimeout(resolve, 2000));

  let tokens = { alice: '', bob: '', agent: '' };

  try {
    // 5. Test Login & Token Generation
    console.log('Testing authentication endpoint (POST /api/login)...');
    
    // Login Alice
    let loginRes = await fetch(`${TEST_BASE_URL}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'test_alice', password: 'testpassword' })
    });
    let loginData = await loginRes.json();
    if (!loginRes.ok || !loginData.token) throw new Error('Alice login failed');
    tokens.alice = loginData.token;

    // Login Bob
    loginRes = await fetch(`${TEST_BASE_URL}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'test_bob', password: 'testpassword' })
    });
    loginData = await loginRes.json();
    tokens.bob = loginData.token;

    // Login Agent
    loginRes = await fetch(`${TEST_BASE_URL}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'test_agent', password: 'testpassword' })
    });
    loginData = await loginRes.json();
    tokens.agent = loginData.token;

    console.log('✔ Authentication and token issuance passed.');

    // 6. Test Ticket Creation (Alice creates a ticket)
    console.log('Testing ticket creation (POST /api/tickets)...');
    const ticketPayload = {
      title: 'Database connection delay',
      description: 'Queries are taking more than 5 seconds to resolve.',
      category: 'Technical'
    };

    let res = await fetch(`${TEST_BASE_URL}/tickets`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${tokens.alice}`
      },
      body: JSON.stringify(ticketPayload)
    });
    let ticket = await res.json();
    if (res.status !== 201 || !ticket.id) throw new Error('Failed to create ticket for test_alice');
    const ticketId = ticket.id;
    console.log(`✔ Ticket creation passed. Ticket ID: ${ticketId}`);

    // 7. Test Role Boundaries / Permissions
    console.log('Testing access controls & permissions...');

    // A. Bob tries to view Alice's ticket -> Should return 403
    let getRes = await fetch(`${TEST_BASE_URL}/tickets/${ticketId}`, {
      headers: { 'Authorization': `Bearer ${tokens.bob}` }
    });
    if (getRes.status !== 403) {
      throw new Error(`Permission violation: Bob was allowed to access Alice's ticket (status: ${getRes.status})`);
    }

    // B. Alice tries to update the status directly -> Should return 403
    let updateRes = await fetch(`${TEST_BASE_URL}/tickets/${ticketId}/status`, {
      method: 'PATCH',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${tokens.alice}`
      },
      body: JSON.stringify({ status: 'Closed' })
    });
    if (updateRes.status !== 403) {
      throw new Error(`Permission violation: Customer was allowed to modify ticket status (status: ${updateRes.status})`);
    }
    console.log('✔ Permission boundaries correctly enforced (403 returned).');

    // 8. Test main support workflows (Agent replies and updates status)
    console.log('Testing support workflow (reply & resolve)...');

    // Agent replies and sets status to In Progress
    let replyRes = await fetch(`${TEST_BASE_URL}/tickets/${ticketId}/responses`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${tokens.agent}`
      },
      body: JSON.stringify({
        message: 'Looking into this immediately. Please provide logs.',
        status: 'In Progress'
      })
    });
    let updatedTicket = await replyRes.json();
    if (updatedTicket.status !== 'In Progress' || updatedTicket.responses.length !== 1) {
      throw new Error('Failed to post agent reply or update status');
    }

    // Agent closes the ticket
    let closeRes = await fetch(`${TEST_BASE_URL}/tickets/${ticketId}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${tokens.agent}`
      },
      body: JSON.stringify({ status: 'Closed' })
    });
    let closedTicket = await closeRes.json();
    if (closedTicket.status !== 'Closed') {
      throw new Error('Failed to close ticket as agent');
    }
    console.log('✔ Support response log and ticket resolution passed.');

    // 8.5 Test Reopen functionality (Customer reopens ticket once)
    console.log('Testing ticket reopen rules...');
    
    // Alice reopens ticket
    let reopenRes = await fetch(`${TEST_BASE_URL}/tickets/${ticketId}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${tokens.alice}`
      },
      body: JSON.stringify({ status: 'Open' })
    });
    let reopenedTicket = await reopenRes.json();
    if (reopenRes.status !== 200 || reopenedTicket.status !== 'Open' || reopenedTicket.reopened !== 1) {
      throw new Error('Customer failed to reopen ticket once');
    }

    // Agent closes it again
    closeRes = await fetch(`${TEST_BASE_URL}/tickets/${ticketId}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${tokens.agent}`
      },
      body: JSON.stringify({ status: 'Closed' })
    });
    let closedTicket2 = await closeRes.json();
    if (closedTicket2.status !== 'Closed') {
      throw new Error('Agent failed to close reopened ticket');
    }

    // Alice tries to reopen again -> Should return 400
    let reopen2Res = await fetch(`${TEST_BASE_URL}/tickets/${ticketId}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${tokens.alice}`
      },
      body: JSON.stringify({ status: 'Open' })
    });
    if (reopen2Res.status !== 400) {
      throw new Error(`Permission violation: Alice allowed to reopen ticket twice (status: ${reopen2Res.status})`);
    }
    console.log('✔ Ticket reopen controls verified (allowed once, blocked second time).');

    // 9. Test filtering functionality
    console.log('Testing filtering queries...');

    // Agent queries Billing category (should return 0 test tickets)
    let filterRes = await fetch(`${TEST_BASE_URL}/tickets?category=Billing`, {
      headers: { 'Authorization': `Bearer ${tokens.agent}` }
    });
    let filteredList = await filterRes.json();
    const billingCountBefore = filteredList.filter(t => t.id === ticketId).length;
    if (billingCountBefore !== 0) throw new Error('Category filter failed');

    // Agent queries Technical category (should return 1 test ticket)
    filterRes = await fetch(`${TEST_BASE_URL}/tickets?category=Technical`, {
      headers: { 'Authorization': `Bearer ${tokens.agent}` }
    });
    filteredList = await filterRes.json();
    const techCount = filteredList.filter(t => t.id === ticketId).length;
    if (techCount !== 1) throw new Error('Category filter failed to locate technical ticket');

    // Agent queries status Closed (should return 1 test ticket)
    filterRes = await fetch(`${TEST_BASE_URL}/tickets?status=Closed`, {
      headers: { 'Authorization': `Bearer ${tokens.agent}` }
    });
    filteredList = await filterRes.json();
    const closedCount = filteredList.filter(t => t.id === ticketId).length;
    if (closedCount !== 1) throw new Error('Status filter failed to locate closed ticket');

    console.log('✔ Search & filter verification passed.');

  } finally {
    // 10. Clean up database
    console.log('Cleaning up test data from MySQL database...');
    await db.query('DELETE FROM users WHERE username LIKE "test_%"'); // cascades to tickets & responses
    await db.end();

    // 11. Shutdown test server
    console.log('Shutting down test server...');
    serverProcess.kill('SIGINT');
  }

  console.log('--- ALL INTEGRATION TESTS PASSED SUCCESSFULLY ---');
  process.exit(0);
}

runTests().catch((error) => {
  console.error('❌ Test execution failed:', error);
  process.exit(1);
});
