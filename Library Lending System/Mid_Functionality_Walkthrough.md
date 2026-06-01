# Library Lending System: Mid Functionality Walkthrough

This is a participant-facing manual validation checklist, not an AI prompt.

Use this after the Mid Review Stage and before Stage 8. The purpose is to check the raw application before formal testing, security hardening, maintainability cleanup, and the change request.

Do not fix issues while doing this walkthrough. Mark the result as pass, fail, or unclear and continue.

## Case Snapshot

- Roles: Librarian, Member
- Main entity: Book
- Important fields: title, author, isbn, category, availabilityStatus, borrowedMember, borrowedDate, returnDate, createdAt, updatedAt
- Main workflow: book record management and borrow/return workflow
- Secondary feature: search or filter books by title, category or availability
- Protected action: add, edit or remove book records
- Expected early status values: available, borrowed, unavailable

## Before You Start

- Start the backend and frontend using the run instructions produced by the AI.
- If the project has a database setup command, run it only if the app cannot start because tables are missing.
- Use one clearly labelled test record, for example `MIDTEST-yourname-001`.
- Do not paste or expose database passwords in screenshots or notes.

## Mid Walkthrough Checks

| Check | Expected Result | Pass/Fail/Notes |
|---|---|---|
| App starts | Frontend and backend start without obvious crashes. | |
| Frontend/backend separation | React app loads separately from the Express API. | |
| API route use | Frontend actions call Express API routes, not Supabase directly from React. | |
| Supabase persistence | A new test record saves to Supabase and remains after refresh/reload. | |
| Database setup | Required tables exist or there is a repeatable setup/seed command. | |
| Login/access screen | The app provides a way to act as both roles. Note whether this is database-backed, mock, role selector, or missing. | |
| Librarian allowed actions | As Librarian, check: add books, edit book records, remove book records, view lending status, filter books. | |
| Member allowed actions | As Member, check: view available books, borrow books, return own borrowed books, filter books. | |
| Protected action allowed | As the correct role, attempt: add, edit or remove book records. | |
| Protected action blocked | As the wrong role, attempt: add, edit or remove book records. It should be blocked by the backend, not only hidden in the UI. | |
| Own-record restriction | Try to access or modify another user role/member/owner record where relevant. It should be blocked. | |
| Main workflow | Complete the workflow: book record management and borrow/return workflow. | |
| Secondary feature | Use the secondary feature: search or filter books by title, category or availability. | |
| Validation | Try invalid or missing data based on: title, author, ISBN and category are required; availability status must use valid values; borrowed member and dates must match the lending state. | |
| Error handling | Errors should be understandable and should not expose secrets or stack traces. | |
| Stage drift | Note anything that appears to belong to testing/security/refactoring/change-request stages already. | |

## Cleanup

- Remove, cancel, close, or clearly label the `MIDTEST` record if the app supports it.
- If cleanup is not possible, record the exact test data left in Supabase.

## Mid Walkthrough Decision

- Raw app appears functional:
- Major failures before testing/security:
- Items to verify again after Stage 8:
- Items to verify again after Stage 9:
- Items to verify again after Stage 10:
