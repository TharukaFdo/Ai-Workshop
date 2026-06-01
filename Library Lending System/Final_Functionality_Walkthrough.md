# Library Lending System: Final Functionality Walkthrough

This is a participant-facing manual validation checklist, not an AI prompt.

Use this after the final review. The purpose is to manually validate the completed app after testing, security hardening, maintainability cleanup, and the change request.

Do not fix issues while doing this walkthrough. Mark the result as pass, fail, or unclear and continue.

## Case Snapshot

- Roles: Librarian, Member
- Main entity: Book
- Important fields: title, author, isbn, category, availabilityStatus, borrowedMember, borrowedDate, returnDate, createdAt, updatedAt
- Main workflow: book record management and borrow/return workflow
- Secondary feature: search or filter books by title, category or availability
- Protected action: add, edit or remove book records
- Original status values: available, borrowed, unavailable
- Stage 11 change request: members can reserve borrowed books, and librarians can mark reservations as fulfilled or cancelled.

## Before You Start

- Start the backend and frontend using the final README or run instructions.
- Run the database setup command only if the app cannot run because tables or seed data are missing.
- Run the automated test command if one exists, usually `npm test` or the command listed by the app.
- Use clearly labelled test records, for example `FINALTEST-yourname-001`.
- Clean up test records at the end or record what remains.

## Final Walkthrough Checks

| Check | Expected Result | Pass/Fail/Notes |
|---|---|---|
| App starts from documented commands | Backend and frontend start using documented commands. | |
| Automated tests | Test command runs and reports what was checked. | |
| Database setup repeatability | Database setup/seed command exists and is documented. | |
| Supabase persistence | Test data saves to Supabase and remains after refresh/restart. | |
| Test data cleanup | Test records are clearly labelled and removed or safely left with notes. | |
| Login table/auth | The app uses database-backed prototype login or clearly documents any simplification. | |
| Librarian login and access | Log in as Librarian and verify allowed actions: add books, edit book records, remove book records, view lending status, filter books. | |
| Member login and access | Log in as Member and verify allowed actions: view available books, borrow books, return own borrowed books, filter books. | |
| Protected action positive case | Correct role can perform: add, edit or remove book records. | |
| Protected action negative case | Wrong role is blocked from: add, edit or remove book records, including direct API attempts where possible. | |
| Own-record restriction | A user cannot view, update, approve, close, or comment on records outside their allowed scope where relevant. | |
| Main workflow complete | Complete the full workflow: book record management and borrow/return workflow. | |
| Secondary feature complete | Validate: search or filter books by title, category or availability. | |
| Stage 11 change request | Validate the late change: members can reserve borrowed books, and librarians can mark reservations as fulfilled or cancelled. | |
| Validation rules | Try invalid or missing data based on: title, author, ISBN and category are required; availability status must use valid values; borrowed member and dates must match the lending state. | |
| Security checks | Confirm secrets are not in React, API errors are safe, and backend checks roles. | |
| Maintainability evidence | Code is separated into reasonable files/modules and README reflects final setup. | |
| Final review evidence | `FINAL_REVIEW.md` honestly lists test results, limitations, risks, and doc/code mismatches. | |

## Cleanup

- Remove, cancel, close, or clearly label all `FINALTEST` records if the app supports it.
- If cleanup is not possible, record the exact test data left in Supabase.

## Final Walkthrough Decision

- App suitable for demonstration:
- App suitable for SDP-style submission:
- Major remaining failures:
- Viva questions this walkthrough suggests:
- Evidence that should be requested from a student:
