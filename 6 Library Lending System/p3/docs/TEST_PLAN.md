# Test Plan: Library Lending System

This test plan details the verification strategy, test coverage, manual inspection procedures, and execution steps for the Library Lending System prototype.

---

## 1. Testing Strategy & Scope
The verification process covers both **automated API integration tests** and **manual UI acceptance tests**. 
*   **Database state**: Tests operate directly on the local MySQL database instance using clean-room test identifiers.
*   **Cleanup**: Any test records generated (e.g. books created during automated testing) are cleanly purged at the end of the script execution block.

---

## 2. Automated Test Coverage
The automated test runner (`npm test`) covers the following 14 test scenarios:

### Database & Auth
1.  **Database Connectivity**: Tests connection health check endpoint (`GET /api/health`).
2.  **Member Login Success**: Asserts authentication with `member1` / `password123` returns a valid signed bearer token.
3.  **Librarian Login Success**: Asserts authentication with `librarian1` / `password123` returns a valid signed bearer token.
4.  **Login Bad Password Rejection**: Asserts invalid credentials return `401 Unauthorized`.

### Librarian Actions
5.  **Librarian Create Book**: Asserts a Librarian can create a book record (`POST /api/books`).
6.  **Required Fields Validation**: Checks that omitting the `title` returns `400 Bad Request`.
7.  **Status Value Validation**: Checks that supplying an invalid availability status string returns `400 Bad Request`.
7b. **Manual Status Transition Lock**: Verifies that setting status to `borrowed` directly via `PUT /api/books/:id` is blocked, enforcing the checkout workflow.
8.  **Delete Book Record**: Confirms that a Librarian can remove a book from the catalog (`DELETE /api/books/:id`).

### Member Actions & Limits
9.  **Search & Filter**: Verifies searching for a book title by query parameters (`GET /api/books?title=...`) filters records correctly.
10. **Member Create Block**: Confirms a Member account attempting to create a book is rejected with `403 Forbidden`.
11. **Borrow Book**: Confirms a Member can check out an available book.
12. **Double Borrow Prevention**: Confirms a Member cannot borrow a book that is already checked out (`409 Conflict`).
12b. **Reserve Book**: Confirms a Member can reserve a book checked out to another member.
12c. **Double Reservation Prevention**: Rejects placing a second reservation on a book that is already reserved.
12d. **Cancel Reservation**: Asserts that a Librarian can cancel a pending reservation.
12f. **Fulfill Reservation**: Confirms a Librarian can fulfill a reservation, transferring checkout to the reserving member.
13. **Cross-User Return Block**: Confirms a Member cannot return a book checked out to another user (`400/403 Error`).
14. **Return Book**: Confirms a Member can return a book checked out to themselves.

---

## 3. Manual UI Acceptance Checks

Perform these checks within the web interface at `http://localhost:3000`:

| Step | Action | Expected Behavior |
|---|---|---|
| 1 | Navigate to page before logging in | App displays the custom Login page. User cannot see dashboard or catalog grids. |
| 2 | Enter invalid password | Displays a red alert banner: "Invalid username or password". |
| 3 | Log in as `librarian1` | Top bar displays "Logged in as librarian1 (Librarian)". Left sidebar renders "Add New Book" form. Right side displays inventory table with "Edit" and "Delete" actions. |
| 4 | Add a book with missing fields | Clicking "Create Record" highlights missing fields or displays a validation alert. |
| 5 | Edit an existing book | Click "Edit" -> form populates -> modify Author -> click "Save Changes". Table updates immediately. |
| 6 | Log out and sign in as `member1` | Left-side administrative forms are hidden. Main grid renders catalog cards with search controls and status badges. |
| 7 | Borrow an available book | Click "Borrow Book". Badge updates to "borrowed" (orange), and button changes to "Return Book" (red). |
| 8 | Log out and sign in as `member2` | Locate the book borrowed by `member1`. Click "Reserve Book" to reserve it. Badge is updated with "Reserved by Member 3". |
| 9 | Log in as `librarian1` | View the book in inventory. Renders "Reserved (Member 3)" next to Fulfill/Cancel buttons. Click "Fulfill" or "Cancel" to verify reservation flow. |

---

## 4. How to Execute Tests
1.  Ensure local MySQL is running and the database has been constructed and seeded:
    ```bash
    npm run db:setup
    ```
2.  Launch the application backend & frontend:
    ```bash
    npm run start
    ```
3.  Open a new terminal window and run the test suite:
    ```bash
    npm test
    ```
