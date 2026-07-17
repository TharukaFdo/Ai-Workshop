const mysql = require('mysql2/promise');
const crypto = require('crypto');
require('dotenv').config();

const apiBase = 'http://localhost:5000';
const testIsbn = `TST-${Date.now()}`;
let testBookId = null;
let memberToken = null;
let librarianToken = null;

// Helper to make API requests
async function apiCall(path, options = {}) {
  const url = `${apiBase}${path}`;
  const response = await fetch(url, options);
  const text = await response.text();
  let json = {};
  try {
    json = JSON.parse(text);
  } catch (e) {
    json = { raw: text };
  }
  return { status: response.status, data: json };
}

async function start() {
  console.log('====================================================');
  console.log('         RUNNING AUTOMATED TEST SUITE               ');
  console.log('====================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(title, condition, expectedMsg = '', actualMsg = '') {
    if (condition) {
      console.log(`[PASS] ${title}`);
      passed++;
    } else {
      console.log(`[FAIL] ${title}`);
      if (expectedMsg || actualMsg) {
        console.log(`       Expected: ${expectedMsg}`);
        console.log(`       Actual:   ${actualMsg}`);
      }
      failed++;
    }
  }

  // --- TEST 1: Database Connection ---
  try {
    const health = await apiCall('/api/health');
    assert(
      'Database Connectivity Check',
      health.status === 200 && health.data.database === 'Connected',
      'Status: 200, DB: Connected',
      `Status: ${health.status}, DB: ${health.data.database}`
    );
  } catch (e) {
    assert('Database Connectivity Check', false, 'DB Connection OK', e.message);
    process.exit(1);
  }

  // --- TEST 2: Auth Login Success (Member) ---
  const memberLogin = await apiCall('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: 'member1', password: 'password123' })
  });
  assert(
    'Login credentials - member1',
    memberLogin.status === 200 && !!memberLogin.data.token,
    'Status 200, JWT token returned',
    `Status: ${memberLogin.status}`
  );
  memberToken = memberLogin.data.token;

  // --- TEST 3: Auth Login Success (Librarian) ---
  const libLogin = await apiCall('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: 'librarian1', password: 'password123' })
  });
  assert(
    'Login credentials - librarian1',
    libLogin.status === 200 && !!libLogin.data.token,
    'Status 200, JWT token returned',
    `Status: ${libLogin.status}`
  );
  librarianToken = libLogin.data.token;

  // --- TEST 4: Auth Login Failure ---
  const badLogin = await apiCall('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: 'member1', password: 'wrongpassword' })
  });
  assert(
    'Login credentials - Bad password rejection',
    badLogin.status === 401,
    'Status 401 Unauthorized',
    `Status: ${badLogin.status}`
  );

  // --- TEST 5: Librarian Allowed to Create Book ---
  const createBook = await apiCall('/api/books', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${librarianToken}`
    },
    body: JSON.stringify({
      title: 'Automated Test Book',
      author: 'Test Bot',
      isbn: testIsbn,
      category: 'Science',
      availabilityStatus: 'available'
    })
  });
  assert(
    'Librarian allowed action - Create Book',
    createBook.status === 201 && !!createBook.data.id,
    'Status 201, Book created',
    `Status: ${createBook.status}`
  );
  if (createBook.data) {
    testBookId = createBook.data.id;
  }

  // --- TEST 6: Validation Check - Missing required fields ---
  const badCreate = await apiCall('/api/books', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${librarianToken}`
    },
    body: JSON.stringify({
      author: 'No Title Author',
      isbn: 'BAD-123',
      category: 'Science'
    })
  });
  assert(
    'Validation - Require fields (missing title)',
    badCreate.status === 400,
    'Status 400 Bad Request',
    `Status: ${badCreate.status}`
  );

  // --- TEST 7: Validation Check - Invalid status value ---
  const badStatusCreate = await apiCall('/api/books', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${librarianToken}`
    },
    body: JSON.stringify({
      title: 'Bad status book',
      author: 'Bot',
      isbn: 'BAD-STATUS-123',
      category: 'Science',
      availabilityStatus: 'unknown_status'
    })
  });
  assert(
    'Validation - Rejects invalid status enum value',
    badStatusCreate.status === 400,
    'Status 400 Bad Request',
    `Status: ${badStatusCreate.status}`
  );

  // --- TEST 7b: Validation Check - Rejects manually setting status to borrowed during update ---
  const directUpdateBorrowed = await apiCall(`/api/books/${testBookId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${librarianToken}`
    },
    body: JSON.stringify({
      availabilityStatus: 'borrowed'
    })
  });
  assert(
    'Validation - Rejects manual status update to borrowed',
    directUpdateBorrowed.status === 400,
    'Status 400 Bad Request',
    `Status: ${directUpdateBorrowed.status}`
  );

  // --- TEST 8: Member Blocked from Creating Book ---
  const memberCreate = await apiCall('/api/books', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${memberToken}`
    },
    body: JSON.stringify({
      title: 'Hack Book',
      author: 'Hack Author',
      isbn: 'HACK-999',
      category: 'Fiction'
    })
  });
  assert(
    'Member blocked action - Create Book',
    memberCreate.status === 403,
    'Status 403 Forbidden',
    `Status: ${memberCreate.status}`
  );

  // --- TEST 9: Search/Filter check ---
  const searchResult = await apiCall(`/api/books?title=Automated`, {
    headers: { 'Authorization': `Bearer ${memberToken}` }
  });
  const foundBook = searchResult.data.find(b => b.id === testBookId);
  assert(
    'Search catalog by Title parameter',
    searchResult.status === 200 && !!foundBook,
    'Status 200, test book found in search results',
    `Status: ${searchResult.status}, Count: ${searchResult.data.length}`
  );

  // --- TEST 10: Member Allowed to Borrow Book ---
  const borrowRes = await apiCall(`/api/books/${testBookId}/borrow`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${memberToken}` }
  });
  assert(
    'Member allowed action - Borrow available book',
    borrowRes.status === 200 && borrowRes.data.status === 'borrowed',
    'Status 200, state status updated to "borrowed"',
    `Status: ${borrowRes.status}, Status value: ${borrowRes.data.status}`
  );

  // --- TEST 11: Blocked action - Borrow checked-out book ---
  const doubleBorrow = await apiCall(`/api/books/${testBookId}/borrow`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${memberToken}` }
  });
  assert(
    'Lending check - Cannot borrow already borrowed book',
    doubleBorrow.status === 409,
    'Status 409 Conflict',
    `Status: ${doubleBorrow.status}`
  );

  // --- TEST 12a: Login member2 ---
  const member2Login = await apiCall('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: 'member2', password: 'password123' })
  });
  const member2Token = member2Login.data.token;

  // --- TEST 12b: Member 2 Reserves borrowed book ---
  const reserveRes = await apiCall(`/api/books/${testBookId}/reserve`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${member2Token}` }
  });
  assert(
    'Member allowed action - Reserve borrowed book',
    reserveRes.status === 200 && reserveRes.data.reservationStatus === 'pending',
    'Status 200, reservationStatus is pending',
    `Status: ${reserveRes.status}`
  );

  // --- TEST 12c: Double Reservation Rejection ---
  const doubleReserve = await apiCall(`/api/books/${testBookId}/reserve`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${memberToken}` }
  });
  assert(
    'Reservation constraint - Cannot reserve an already reserved book',
    doubleReserve.status === 400,
    'Status 400 Bad Request',
    `Status: ${doubleReserve.status}`
  );

  // --- TEST 12d: Librarian Cancels Reservation ---
  const cancelRes = await apiCall(`/api/books/${testBookId}/reservation/cancel`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${librarianToken}` }
  });
  assert(
    'Librarian allowed action - Cancel pending reservation',
    cancelRes.status === 200 && cancelRes.data.reservationStatus === null,
    'Status 200, reservationStatus is null',
    `Status: ${cancelRes.status}`
  );

  // --- TEST 12e: Member 2 Reserves book again ---
  await apiCall(`/api/books/${testBookId}/reserve`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${member2Token}` }
  });

  // --- TEST 12f: Librarian Fulfills Reservation ---
  const fulfillRes = await apiCall(`/api/books/${testBookId}/reservation/fulfill`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${librarianToken}` }
  });
  assert(
    'Librarian allowed action - Fulfill pending reservation',
    fulfillRes.status === 200 && fulfillRes.data.status === 'borrowed' && fulfillRes.data.borrowedMember === 3,
    'Status 200, status is borrowed, checked out to member2',
    `Status: ${fulfillRes.status}`
  );

  // --- TEST 12: Blocked action - Return book owned by another member ---
  const badReturn = await apiCall(`/api/books/${testBookId}/return`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${memberToken}` }
  });
  assert(
    'Security check - Cannot return a book checked out to another member',
    badReturn.status === 400 || badReturn.status === 403,
    'Status 400 or 403 error',
    `Status: ${badReturn.status}`
  );

  // --- TEST 13: Member Allowed to Return Book ---
  const returnRes = await apiCall(`/api/books/${testBookId}/return`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${member2Token}` }
  });
  assert(
    'Member allowed action - Return own book',
    returnRes.status === 200 && returnRes.data.status === 'available',
    'Status 200, state status reverted to "available"',
    `Status: ${returnRes.status}`
  );

  // --- TEST 14: Clean up test book record ---
  const deleteRes = await apiCall(`/api/books/${testBookId}`, {
    method: 'DELETE',
    headers: { 'Authorization': `Bearer ${librarianToken}` }
  });
  assert(
    'Librarian allowed action - Delete book record (cleanup)',
    deleteRes.status === 200,
    'Status 200 Deleted',
    `Status: ${deleteRes.status}`
  );

  console.log('\n====================================================');
  console.log(` TESTS RUN COMPLETE. Passed: ${passed}, Failed: ${failed}`);
  console.log('====================================================');

  if (failed > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

start().catch(err => {
  console.error('Test execution error:', err);
  process.exit(1);
});
