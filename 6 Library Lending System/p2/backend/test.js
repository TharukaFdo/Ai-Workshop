const assert = require('assert');
const db = require('./db');

const BASE_URL = 'http://localhost:5000/api';

async function runTests() {
  console.log('--- STARTING AUTOMATED BACKEND INTEGRATION TESTS ---');

  const TEST_SUFFIX = '_' + Math.random().toString(36).substring(2, 7);
  const testLibrarianUsername = `test_librarian${TEST_SUFFIX}`;
  const testMemberUsername1 = `test_member_a${TEST_SUFFIX}`;
  const testMemberUsername2 = `test_member_b${TEST_SUFFIX}`;
  
  const testBookIsbn = `TEST-ISBN${TEST_SUFFIX}`;
  const testBookTitle = `Test Book Title ${TEST_SUFFIX}`;
  const testBookAuthor = `Test Book Author ${TEST_SUFFIX}`;
  const testBookCategory = 'Fiction';

  let testLibrarianId = null;
  let testMemberId1 = null;
  let testMemberId2 = null;
  let testBookId = null;

  let librarianToken = null;
  let memberToken1 = null;
  let memberToken2 = null;

  try {
    // 1. Setup Test Records in MySQL database
    console.log('1. Seeding temporary test records into MySQL...');
    
    const [libRes] = await db.query(
      'INSERT INTO users (username, role) VALUES (?, "librarian")',
      [testLibrarianUsername]
    );
    testLibrarianId = libRes.insertId;

    const [memRes1] = await db.query(
      'INSERT INTO users (username, role) VALUES (?, "member")',
      [testMemberUsername1]
    );
    testMemberId1 = memRes1.insertId;

    const [memRes2] = await db.query(
      'INSERT INTO users (username, role) VALUES (?, "member")',
      [testMemberUsername2]
    );
    testMemberId2 = memRes2.insertId;

    console.log(`Temporary users created. Librarian ID: ${testLibrarianId}, Member 1 ID: ${testMemberId1}, Member 2 ID: ${testMemberId2}`);

    // 2. Test Login & Authentication
    console.log('2. Testing auth login endpoint...');
    
    let loginRes = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: testLibrarianUsername })
    });
    let loginData = await loginRes.json();
    assert.strictEqual(loginRes.status, 200, 'Librarian login should succeed');
    librarianToken = loginData.token;

    loginRes = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: testMemberUsername1 })
    });
    loginData = await loginRes.json();
    assert.strictEqual(loginRes.status, 200, 'Member 1 login should succeed');
    memberToken1 = loginData.token;

    loginRes = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: testMemberUsername2 })
    });
    loginData = await loginRes.json();
    assert.strictEqual(loginRes.status, 200, 'Member 2 login should succeed');
    memberToken2 = loginData.token;

    // 3. Test Role Protection (Librarian Operations)
    console.log('3. Testing role permissions & spoofing protections...');

    let addBookRes = await fetch(`${BASE_URL}/books`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${memberToken1}`
      },
      body: JSON.stringify({ title: testBookTitle, author: testBookAuthor, isbn: testBookIsbn, category: testBookCategory })
    });
    assert.strictEqual(addBookRes.status, 403, 'Member attempting to create book should receive 403 Forbidden');

    // Successfully add book as Librarian
    addBookRes = await fetch(`${BASE_URL}/books`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${librarianToken}`
      },
      body: JSON.stringify({ title: testBookTitle, author: testBookAuthor, isbn: testBookIsbn, category: testBookCategory })
    });
    let addBookData = await addBookRes.json();
    assert.strictEqual(addBookRes.status, 201, 'Librarian should successfully create book record');
    testBookId = addBookData.id;

    // 4. Test Book Modification (Edit Book Details)
    console.log('4. Testing editing book records...');
    const updatedTitle = `UPDATED: ${testBookTitle}`;
    
    let editBookRes = await fetch(`${BASE_URL}/books/${testBookId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${librarianToken}`
      },
      body: JSON.stringify({ title: updatedTitle, author: testBookAuthor, isbn: testBookIsbn, category: testBookCategory })
    });
    assert.strictEqual(editBookRes.status, 200, 'Librarian should be able to edit book records');

    // 5. Test Search & Filter
    console.log('5. Testing search & filtering parameters...');

    let getBooksRes = await fetch(`${BASE_URL}/books?search=${testBookIsbn}`);
    let getBooksData = await getBooksRes.json();
    assert.strictEqual(getBooksData.length, 1, 'Search query filter should match search term');

    // 6. Test Borrow and Return Workflow
    console.log('6. Testing borrow and return workflow...');

    let borrowRes = await fetch(`${BASE_URL}/books/${testBookId}/borrow`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${memberToken1}` }
    });
    assert.strictEqual(borrowRes.status, 200, 'Member should succeed in borrowing available book');

    // 7. Test Reservations Workflow
    console.log('7. Testing reservations workflow...');

    // Try to reserve available book (should fail since reservations are only on borrowed books)
    const [anotherBookRes] = await db.query(
      'INSERT INTO books (title, author, isbn, category, availabilityStatus) VALUES ("Temp Book", "Temp", ?, "Classic", "Available")',
      [`ISBN-TEMP-${TEST_SUFFIX}`]
    );
    const tempBookId = anotherBookRes.insertId;

    let reserveRes = await fetch(`${BASE_URL}/books/${tempBookId}/reserve`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${memberToken1}` }
    });
    assert.strictEqual(reserveRes.status, 400, 'Reserving an available book should fail with 400');
    await db.query('DELETE FROM books WHERE id = ?', [tempBookId]);

    // Reserve borrowed book as Member 2 (should succeed)
    reserveRes = await fetch(`${BASE_URL}/books/${testBookId}/reserve`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${memberToken2}` }
    });
    assert.strictEqual(reserveRes.status, 200, 'Member should successfully reserve borrowed book');

    // Get reservations list as Librarian
    let resListRes = await fetch(`${BASE_URL}/reservations`, {
      headers: { 'Authorization': `Bearer ${librarianToken}` }
    });
    let resListData = await resListRes.json();
    const testReservation = resListData.find(r => r.bookId === testBookId && r.memberId === testMemberId2);
    assert.ok(testReservation, 'Pending reservation record should exist');
    assert.strictEqual(testReservation.status, 'Pending', 'Reservation should start as Pending');

    // Librarian cancels the reservation
    let cancelRes = await fetch(`${BASE_URL}/reservations/${testReservation.id}/cancel`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${librarianToken}` }
    });
    assert.strictEqual(cancelRes.status, 200, 'Librarian should successfully cancel reservation');

    // Reserve borrowed book as Member 2 again
    reserveRes = await fetch(`${BASE_URL}/books/${testBookId}/reserve`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${memberToken2}` }
    });
    assert.strictEqual(reserveRes.status, 200);

    // Get fresh reservation ID
    resListRes = await fetch(`${BASE_URL}/reservations`, {
      headers: { 'Authorization': `Bearer ${librarianToken}` }
    });
    resListData = await resListRes.json();
    const newReservation = resListData.find(r => r.bookId === testBookId && r.memberId === testMemberId2 && r.status === 'Pending');

    // Librarian fulfills the reservation
    let fulfillRes = await fetch(`${BASE_URL}/reservations/${newReservation.id}/fulfill`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${librarianToken}` }
    });
    assert.strictEqual(fulfillRes.status, 200, 'Librarian should successfully fulfill reservation');

    // Return book successfully as Member 1
    let returnRes = await fetch(`${BASE_URL}/books/${testBookId}/return`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${memberToken1}` }
    });
    assert.strictEqual(returnRes.status, 200, 'Member 1 returns book');

    // 8. Test Deletion Record
    console.log('8. Testing deleting book records...');
    let deleteRes = await fetch(`${BASE_URL}/books/${testBookId}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${librarianToken}` }
    });
    assert.strictEqual(deleteRes.status, 200, 'Librarian deletes book');

    console.log('--- ALL INTEGRATION TESTS PASSED SUCCESSFULLY! ---');
  } catch (error) {
    console.error('--- INTEGRATION TEST FAILED! ---');
    console.error(error);
    process.exitCode = 1;
  } finally {
    console.log('9. Cleaning up test records from database...');
    try {
      if (testBookId) {
        await db.query('DELETE FROM books WHERE id = ?', [testBookId]);
      }
      await db.query('DELETE FROM books WHERE isbn = ?', [testBookIsbn]);
      if (testLibrarianId) {
        await db.query('DELETE FROM users WHERE id = ?', [testLibrarianId]);
      }
      if (testMemberId1) {
        await db.query('DELETE FROM users WHERE id = ?', [testMemberId1]);
      }
      if (testMemberId2) {
        await db.query('DELETE FROM users WHERE id = ?', [testMemberId2]);
      }
      console.log('Cleanup completed.');
    } catch (cleanupErr) {
      console.error('Failed to clean up test database records:', cleanupErr.message);
    }
    db.end();
  }
}

runTests();
