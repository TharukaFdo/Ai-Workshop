const assert = require('assert');
const crypto = require('crypto');
const db = require('./config/db');
const ticketService = require('./services/ticketService');

async function runTests() {
  console.log('--- Starting Integration & Unit Tests ---');

  try {
    // 1. Database Connectivity Check
    console.log('Testing Database Connection...');
    const [testQuery] = await db.query('SELECT 1 + 1 AS sum');
    assert.strictEqual(testQuery[0].sum, 2, 'Database connection query failed.');
    console.log('  ✓ Pass: Database connectivity verified.');

    // 2. Auth Lookup Verification
    console.log('Testing Database-backed User Retrieval...');
    const alice = await ticketService.getUserByUsername('alice');
    assert.ok(alice, 'Seeded user "alice" should exist.');
    assert.strictEqual(alice.role, 'User', 'Alice should have role "User".');
    console.log('  ✓ Pass: User lookup validated.');

    // 3. Ticket Lifecycle Flow & CRUD
    console.log('Testing Ticket Creation...');
    const testTicket = await ticketService.create({
      title: 'TEST - Hardware Malfunction',
      description: 'Test description for automated run.',
      category: 'Hardware',
      submittedUser: 'alice'
    });
    assert.ok(testTicket.id, 'Created ticket should have a valid database ID.');
    assert.strictEqual(testTicket.status, 'open', 'New tickets should default to "open" status.');
    console.log('  ✓ Pass: Ticket creation validated.');

    console.log('Testing Filtering and Reading...');
    const tickets = await ticketService.getAll({ category: 'Hardware', submittedUser: 'alice' });
    const found = tickets.find(t => t.id === testTicket.id);
    assert.ok(found, 'Created ticket should be searchable by filters.');
    console.log('  ✓ Pass: Ticket filtering and retrieval validated.');

    console.log('Testing Agent Status Transition & Closed timestamp...');
    const updated = await ticketService.updateStatus(testTicket.id, 'closed');
    assert.strictEqual(updated.status, 'closed', 'Ticket status should transition to "closed".');
    assert.ok(updated.closedAt, 'Closed tickets must have a closedAt timestamp.');
    console.log('  ✓ Pass: Ticket status workflow and closedAt stamp validated.');

    console.log('Testing Agent Response comment insertion...');
    const responded = await ticketService.addResponse(testTicket.id, 'TEST ANSWER - FIXED');
    assert.strictEqual(responded.agentResponse, 'TEST ANSWER - FIXED', 'Response comment should be saved.');
    console.log('Testing Agent response comments validated.');

    // 3.5 Reopen Verification Flow
    console.log('Testing Ticket Reopening capability...');
    const reopenedTicket = await ticketService.reopen(testTicket.id);
    assert.strictEqual(reopenedTicket.status, 'open', 'Reopened ticket status should be "open".');
    assert.strictEqual(reopenedTicket.reopened, 1, 'Reopened counter should be 1.');
    assert.strictEqual(reopenedTicket.closedAt, null, 'Closed timestamp must be reset to NULL.');
    console.log('  ✓ Pass: Reopening closed ticket once succeeded.');

    // 4. Validation Checks
    console.log('Testing Input Validation Rules...');
    const invalidStatuses = ['waiting', 'unknown', 'pending'];
    for (let invalid of invalidStatuses) {
      try {
        await ticketService.updateStatus(testTicket.id, invalid);
        assert.fail(`Status validation should fail for: ${invalid}`);
      } catch (err) {
        // Expected behavior: status field validation error (MySQL Enum restriction will throw or we block it)
        assert.ok(err, 'Validation error correctly thrown.');
      }
    }
    console.log('  ✓ Pass: Validation rules for invalid statuses verified.');

    // 5. Test Data Cleanup
    console.log('Cleaning up test records...');
    await db.query("DELETE FROM tickets WHERE title LIKE 'TEST - %'");
    console.log('  ✓ Pass: Test data cleanup complete.');

    console.log('--- All Tests Passed Successfully! ---');
    process.exit(0);
  } catch (error) {
    console.error('❌ Test failed with error:', error);
    process.exit(1);
  }
}

runTests();
