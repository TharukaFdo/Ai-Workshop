# Requirements Specification: Library Lending System

## 1. Functional Requirements

### RF-1: Book Catalog Management (Librarian Only)
*   **Description**: The Librarian must be able to manage book records in the catalog.
*   **Acceptance Criteria**:
    *   Librarian can add a new book record with required fields (Title, Author, ISBN, Category). The book is initially marked as `available`.
    *   Librarian can update existing book details (Title, Author, ISBN, Category, Availability Status).
    *   Librarian can delete a book record from the catalog.
    *   Members cannot access the forms or make API requests to add, edit, or delete books.

### RF-2: Book Browsing & Search (Librarian & Member)
*   **Description**: Users must be able to view and search/filter the catalog.
*   **Acceptance Criteria**:
    *   Both roles can view a catalog list containing all book fields (Title, Author, ISBN, Category, Status).
    *   Users can search books by title (case-insensitive partial match).
    *   Users can filter books by category and/or availability status (`available`, `borrowed`, `unavailable`).

### RF-3: Borrowing Workflow (Member Only)
*   **Description**: A Member can borrow an available book.
*   **Acceptance Criteria**:
    *   A Member can select a book with status `available` and check it out under their own name.
    *   Upon borrowing, the book status changes to `borrowed`.
    *   `borrowedMember` is set to the current logged-in Member's identifier.
    *   `borrowedDate` is set to the current system date.
    *   `returnDate` is calculated and set to 14 days from the current date.
    *   Members cannot borrow books that are currently `borrowed` or `unavailable`.
    *   Members cannot specify another member's name to borrow on their behalf.

### RF-4: Return Workflow (Member Only)
*   **Description**: A Member can return a book they borrowed.
*   **Acceptance Criteria**:
    *   A Member can view books currently checked out to them.
    *   A Member can initiate a return for their checked-out book.
    *   Upon returning, the book status reverts to `available`.
    *   `borrowedMember`, `borrowedDate`, and `returnDate` are set to `NULL` (or empty values).
    *   Members cannot return books borrowed by other members.

### RF-5: Reservation Workflow (Member & Librarian)
*   **Description**: Members can reserve borrowed books, and Librarians manage reservation statuses.
*   **Acceptance Criteria**:
    *   A Member can reserve a book only if its status is `borrowed`.
    *   A book can have at most one pending reservation.
    *   Members cannot reserve books they currently have checked out themselves.
    *   Librarians can mark a reservation as fulfilled (automatically checks out the book to the reserving member and clears reservation fields) or cancelled (clears reservation fields).

---

## 2. Role-Permission Matrix

| Action | Librarian | Member | Backend Enforcement |
|---|:---:|:---:|---|
| **Add Book** | Yes | No | Enforced (Requires Librarian token/session check) |
| **Edit Book Details** | Yes | No | Enforced (Requires Librarian token/session check) |
| **Remove Book** | Yes | No | Enforced (Requires Librarian token/session check) |
| **View Catalog / Lending Status** | Yes | Yes | Open (Available to authenticated users) |
| **Search / Filter Catalog** | Yes | Yes | Open (Available to authenticated users) |
| **Borrow Book (Self)** | No | Yes | Enforced (Restricted to Member; must match current identity) |
| **Borrow Book (Others)** | No | No | Enforced (Blocked on API level) |
| **Return Book (Self)** | No | Yes | Enforced (Restricted to Member; must match current identity) |
| **Reserve Book** | No | Yes | Enforced (Restricted to Member; allowed only if borrowed) |
| **Fulfill Reservation** | Yes | No | Enforced (Requires Librarian token/session check) |
| **Cancel Reservation** | Yes | No | Enforced (Requires Librarian token/session check) |

---

## 3. Authentication & Session Strategy
*   **Database-backed Auth / Role Switcher**:
    *   To keep the prototype simple yet secure, a basic `users` table will store user records with roles (`Librarian`, `Member`).
    *   A simple login screen allows users to select or type their user credentials, issuing a mock session token containing their ID and role.
    *   All API calls must transmit this role/session identifier (e.g., via a Header or Bearer Token).
    *   Backend routes must parse this header to validate the role before processing state changes.

---

## 4. Validation Rules

*   **Required Fields**:
    *   `title`: String, length 1–255, cannot be empty.
    *   `author`: String, length 1–255, cannot be empty.
    *   `isbn`: String, valid ISBN-10 or ISBN-13 format, must be unique in the catalog.
    *   `category`: String, cannot be empty.
*   **Availability Status**:
    *   Must only be one of the enum values: `available`, `borrowed`, `unavailable`.
*   **Lending State Consistency**:
    *   If status = `available` or `unavailable`: `borrowedMember`, `borrowedDate`, and `returnDate` must be `NULL` (or empty).
    *   If status = `borrowed`: `borrowedMember` must be a valid, non-empty member identifier, and both dates must be valid dates.
*   **Reservation State Consistency**:
    *   `reservedMember` and `reservationStatus` can only be set (non-NULL) when `availabilityStatus` is `borrowed`.
    *   If `reservationStatus` is set, it must only be one of the enum values: `pending`, `fulfilled`, `cancelled`.
    *   If `reservationStatus` is `pending`, `reservedMember` must not match `borrowedMember`.

---

## 5. Failure Cases & Expected Behaviors

| Scenario | Expected Failure / Behavior | API Response |
|---|---|---|
| Member tries to create a book | Authorization denied. Operation blocked. | `403 Forbidden` |
| Member attempts to delete a book | Authorization denied. Operation blocked. | `403 Forbidden` |
| Member borrows an already borrowed book | Lending rejected; state conflict. | `409 Conflict` |
| Member borrows on behalf of another user | ID mismatch validation fails. | `400 Bad Request` or `403 Forbidden` |
| Saving a book with missing title | Validation fails. Book not saved. | `400 Bad Request` |
| Member returns a book they did not borrow | Operation rejected; member ownership mismatch. | `403 Forbidden` |

---

## 6. Verification Checklist

### Minimum Automated Tests
1.  **Unit Tests (Backend APIs)**:
    *   `POST /api/books` returns `403` when authenticated as a Member.
    *   `POST /api/books` returns `201` and creates a book when authenticated as a Librarian.
    *   `POST /api/books/:id/borrow` returns `200` and updates fields when a Member borrows an available book.
    *   `POST /api/books/:id/borrow` returns `409` or `400` when trying to borrow a book already checked out.
    *   `POST /api/books/:id/return` returns `403` if a Member tries to return a book borrowed by someone else.
2.  **Validation Tests**:
    *   Sending invalid status values returns `400`.
    *   Sending empty titles or authors returns `400`.

### Manual Checks
1.  Verify the role selection switcher dynamically changes visible elements on the UI (Librarian sees Management dashboard; Member only sees Catalog and Borrowing options).
2.  Confirm that MySQL database credentials are only read from backend environment variables (`.env`) and never exposed in compiled React source files.
3.  Simulate consecutive checkouts to verify that dates are calculated correctly (+14 days).
