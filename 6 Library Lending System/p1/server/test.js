const BASE_URL = 'http://localhost:5001/api';

async function runTests() {
  console.log('🚀 Starting Library Lending System API Integration Tests...\n');
  let testBookId = null;
  let passedCount = 0;
  let failedCount = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(` ✅ PASS: ${message}`);
      passedCount++;
    } else {
      console.error(` ❌ FAIL: ${message}`);
      failedCount++;
    }
  }

  try {
    // 1. Test Login Endpoint
    console.log('--- Testing User Login ---');
    
    // Librarian login success
    const loginLibRes = await fetch(`${BASE_URL}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'librarian1', password: 'lib123' })
    });
    assert(loginLibRes.status === 200, 'Librarian login should return HTTP 200');
    const libUser = await loginLibRes.json();

    // Member login success
    const loginMemberRes = await fetch(`${BASE_URL}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'alice', password: 'alice123' })
    });
    assert(loginMemberRes.status === 200, 'Member login should return HTTP 200');
    const memberUser = await loginMemberRes.json();

    // Invalid login check
    const invalidLoginRes = await fetch(`${BASE_URL}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'alice', password: 'wrongpassword' })
    });
    assert(invalidLoginRes.status === 401, 'Invalid credentials should return HTTP 401 Unauthorized');


    // 2. Test Role Permissions (Adding Books)
    console.log('\n--- Testing Role Permissions (Add Book) ---');
    
    // Alice (member) tries to add a book
    const addForbiddenRes = await fetch(`${BASE_URL}/books`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-user-id': memberUser.id.toString(),
        'x-user-role': memberUser.role
      },
      body: JSON.stringify({
        title: 'Forbidden Book',
        author: 'Forbidden Author',
        isbn: '0000000000',
        category: 'Fiction'
      })
    });
    assert(addForbiddenRes.status === 403, 'Members should be forbidden from adding books (HTTP 403)');

    // Librarian adds a book
    const addAllowedRes = await fetch(`${BASE_URL}/books`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-user-id': libUser.id.toString(),
        'x-user-role': libUser.role
      },
      body: JSON.stringify({
        title: 'Integration Test Book',
        author: 'Test Bot',
        isbn: '9998887776',
        category: 'Technology'
      })
    });
    assert(addAllowedRes.status === 201, 'Librarians should be allowed to add books (HTTP 201)');
    const newBook = await addAllowedRes.json();
    testBookId = newBook.id;


    // 3. Safety Validation Checks
    console.log('\n--- Testing Safety & Input Validation ---');

    // Duplicate ISBN check
    const addDuplicateRes = await fetch(`${BASE_URL}/books`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-user-id': libUser.id.toString(),
        'x-user-role': libUser.role
      },
      body: JSON.stringify({
        title: 'Duplicate Book Title',
        author: 'Duplicate Author',
        isbn: '9998887776',
        category: 'Technology'
      })
    });
    assert(addDuplicateRes.status === 400, 'Duplicate ISBN submission should return HTTP 400 Bad Request');


    // 4. Test Lending & Borrowing Workflows
    console.log('\n--- Testing Lending Workflows (Borrow / Return) ---');

    // Alice borrows book under her own name
    const borrowSuccessRes = await fetch(`${BASE_URL}/books/${testBookId}/borrow`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-user-id': memberUser.id.toString(),
        'x-user-role': memberUser.role
      },
      body: JSON.stringify({ memberName: 'alice' })
    });
    assert(borrowSuccessRes.status === 200, 'Member can borrow book under their own name (HTTP 200)');


    // 5. Test Reservations Workflows
    console.log('\n--- Testing Reservation Workflows ---');

    // Bob logs in
    const loginBobRes = await fetch(`${BASE_URL}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'bob', password: 'bob123' })
    });
    const bobUser = await loginBobRes.json();

    // Bob reserves the book borrowed by Alice
    const reserveRes = await fetch(`${BASE_URL}/books/${testBookId}/reserve`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-user-id': bobUser.id.toString(),
        'x-user-role': bobUser.role
      },
      body: JSON.stringify({ memberName: 'bob' })
    });
    assert(reserveRes.status === 201, 'Members can reserve borrowed books (HTTP 201)');
    const reservationObj = await reserveRes.json();
    assert(reservationObj.status === 'Pending', 'Reservation status starts as Pending');

    // Bob tries to reserve again (Duplicate reservation)
    const reserveDupRes = await fetch(`${BASE_URL}/books/${testBookId}/reserve`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-user-id': bobUser.id.toString(),
        'x-user-role': bobUser.role
      },
      body: JSON.stringify({ memberName: 'bob' })
    });
    assert(reserveDupRes.status === 400, 'Duplicate reservation should return HTTP 400 Bad Request');

    // Librarian fulfills the reservation
    const fulfillRes = await fetch(`${BASE_URL}/reservations/${reservationObj.id}/fulfill`, {
      method: 'POST',
      headers: {
        'x-user-id': libUser.id.toString(),
        'x-user-role': libUser.role
      }
    });
    assert(fulfillRes.status === 200, 'Librarians can fulfill reservations (HTTP 200)');
    const fulfilledObj = await fulfillRes.json();
    assert(fulfilledObj.status === 'Fulfilled', 'Reservation marked as Fulfilled');

    // Verify book is now checked out to Bob
    const getBooksRes = await fetch(`${BASE_URL}/books`, {
      headers: {
        'x-user-id': memberUser.id.toString(),
        'x-user-role': memberUser.role
      }
    });
    const booksList = await getBooksRes.json();
    const updatedTestBook = booksList.find(b => b.id === testBookId);
    assert(updatedTestBook.status === 'Borrowed' && updatedTestBook.borrowed_member === 'bob', 'Book status transitions to borrowed by reserving member');


    // 6. Test Cancel Reservation Flow
    console.log('\n--- Testing Reservation Cancellation ---');
    
    // Borrow book again (it is currently borrowed by Bob, let's make Alice reserve it)
    const cancelReserveRes = await fetch(`${BASE_URL}/books/${testBookId}/reserve`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-user-id': memberUser.id.toString(),
        'x-user-role': memberUser.role
      },
      body: JSON.stringify({ memberName: 'alice' })
    });
    const cancelResvObj = await cancelReserveRes.json();

    // Librarian cancels reservation
    const cancelRes = await fetch(`${BASE_URL}/reservations/${cancelResvObj.id}/cancel`, {
      method: 'POST',
      headers: {
        'x-user-id': libUser.id.toString(),
        'x-user-role': libUser.role
      }
    });
    assert(cancelRes.status === 200, 'Librarians can cancel reservations (HTTP 200)');
    const cancelledObj = await cancelRes.json();
    assert(cancelledObj.status === 'Cancelled', 'Reservation marked as Cancelled');


    // 7. Cleanup test data
    console.log('\n--- Cleaning Up Test Data ---');
    if (testBookId) {
      const deleteRes = await fetch(`${BASE_URL}/books/${testBookId}`, {
        method: 'DELETE',
        headers: {
          'x-user-id': libUser.id.toString(),
          'x-user-role': libUser.role
        }
      });
      assert(deleteRes.status === 200, 'Librarian can delete the test book (HTTP 200)');
    }

  } catch (error) {
    console.error('❌ Test Execution Error:', error);
    failedCount++;
  }

  console.log('\n--- Test Execution Summary ---');
  console.log(`Passed: ${passedCount}`);
  console.log(`Failed: ${failedCount}`);

  if (failedCount > 0) {
    console.error('\n❌ Tests failed.');
    process.exit(1);
  } else {
    console.log('\n✨ All tests passed successfully!');
    process.exit(0);
  }
}

runTests();
