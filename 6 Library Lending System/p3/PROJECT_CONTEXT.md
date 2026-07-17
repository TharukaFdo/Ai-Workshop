# Project Context: Library Lending System

## 1. Case Restatement
The goal of this project is to build a web-based prototype for a library lending system. The system enables a small library to track books and their borrowing status. It supports two distinct user roles: **Librarian** (who handles administrative tasks like managing the book catalog) and **Member** (who searches the catalog, borrows, and returns books). The system must track key details of books and control permissions strictly so members cannot perform administrative tasks or borrow books on behalf of other members.

---

## 2. Workshop Scope
The scope covers a fully functional web-based prototype built with the following stack:
*   **Frontend**: React (with smooth design, styling, and navigation)
*   **Backend**: Node.js with Express (REST API endpoints with role-based simulation or authentication)
*   **Database**: Local MySQL (storing book catalog data and borrowing logs)

The application will demonstrate the complete lifecycle of book management and lending workflows.

---

## 3. User Roles and Responsibilities

### Librarian
*   **Create**: Add new book records to the library catalog.
*   **Read**: View all books, their metadata, and current borrowing/reservation details.
*   **Update**: Modify existing book records (title, author, ISBN, category).
*   **Delete**: Remove books from the catalog.
*   **Reservations**: Fulfill or cancel pending reservations placed on borrowed books.

### Member
*   **Read**: View available books, search, and filter.
*   **Borrow**: Check out a book under their own identity.
*   **Return**: Mark a currently borrowed book as returned.
*   **Reserve**: Place a reservation on a book that is currently checked out by another member.

---

## 4. Main Entity and Core Workflow

### Main Entity: `Book`
The system tracks the following attributes for each book:
*   `id` (Unique identifier)
*   `title`
*   `author`
*   `isbn`
*   `category`
*   `status` (e.g., Available, Borrowed, Unavailable)
*   `borrowed_by` (Member ID)
*   `borrowed_date` (Date)
*   `return_date` (Date)
*   `reservedMember` (Member ID of reserving member)
*   `reservationStatus` (e.g. pending, fulfilled, cancelled)

### Main Workflow: Lending Lifecycle
1.  **Book Creation**: A Librarian adds a book record to the system; its initial status is set to `Available`.
2.  **Discovery**: A Member browses, searches, or filters the catalog.
3.  **Borrowing**: A Member selects an available book and borrows it. The status changes to `Borrowed`, `borrowed_by` is set to the current member, and `borrowed_date` is recorded.
4.  **Reservation**: If a book is borrowed, another Member can reserve it. Its `reservationStatus` becomes `pending`.
5.  **Fulfillment/Cancellation**: A Librarian can fulfill the reservation (which automatically checks it out to the reserving member) or cancel it (clearing the reservation fields).
6.  **Returning**: The Member returns the book. The status changes back to `Available`, and borrowing fields are cleared.

---

## 5. Secondary Features
*   **Search**: Filtering the catalog by Title.
*   **Filter by Category**: Narrowing down books by genres or departments.
*   **Filter by Availability**: Easily showing only "Available" books.

---

## 6. Out of Scope
*   Handling or calculating fines/penalties for overdue books.
*   Barcode scanning, RFID integration, or physical book tracking.
*   Automated notifications, email alerts, or reminders for return deadlines.
*   Multi-copy inventory management (each record represents a single unique book copy).
*   Advanced user authentication/authorization systems (e.g., OAuth/SSO), though simple role selection or mock logins will be used to enforce rules.

---

## 7. Assumptions and Missing Details
*   **Authentication/Authorization**: We assume a simplified login or role switcher is sufficient to identify the current user and their role (Librarian vs. Member).
*   **Member Identification**: We assume members have a unique name or ID that is stored when borrowing.
*   **Simulated Time**: Date tracking will use local system time.
*   **ISBN Validation**: No complex external API verification (like OpenLibrary) is required for ISBN verification; basic format checking is sufficient.

---

## 8. Likely Risks
*   **State Desynchronization**: Multiple users attempting to borrow the same book simultaneously (race conditions in the database).
*   **Role Bypassing**: Ensure API endpoints for creating/deleting books are secured so a Member cannot execute them via raw HTTP requests (e.g. Postman).
*   **Data Integrity**: Deleting a book record that is currently borrowed. (We must decide whether to prevent deletion of checked-out books or cascade the deletion).
