# Inventory Request System: Final Functionality Walkthrough

This is a participant-facing manual validation checklist, not an AI prompt.

Use this after the final review. The purpose is to manually validate the completed app after testing, security hardening, maintainability cleanup, and the change request.

Do not fix issues while doing this walkthrough. Mark the result as pass, fail, or unclear and continue.

## Case Snapshot

- Roles: Staff member, Storekeeper
- Main entity: Inventory Request
- Important fields: itemName, quantity, reason, requestedDate, requesterName, status, storekeeperNote, issuedQuantity, issuedAt, createdAt, updatedAt
- Main workflow: inventory request submission, approval/rejection and issue workflow
- Secondary feature: filter requests by item name, requester or status
- Protected action: approve or reject requests, mark items issued, and edit storekeeper notes
- Original status values: pending, approved, rejected, issued
- Stage 11 change request: approved requests require an issued quantity before they can be marked issued, and issued quantity cannot exceed requested quantity.

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
| Staff member login and access | Log in as Staff member and verify allowed actions: submit inventory requests, view own request status, update own pending request details, filter own requests. | |
| Storekeeper login and access | Log in as Storekeeper and verify allowed actions: review all requests, approve or reject requests, add storekeeper notes, mark approved items as issued, filter requests. | |
| Protected action positive case | Correct role can perform: approve or reject requests, mark items issued, and edit storekeeper notes. | |
| Protected action negative case | Wrong role is blocked from: approve or reject requests, mark items issued, and edit storekeeper notes, including direct API attempts where possible. | |
| Own-record restriction | A user cannot view, update, approve, close, or comment on records outside their allowed scope where relevant. | |
| Main workflow complete | Complete the full workflow: inventory request submission, approval/rejection and issue workflow. | |
| Secondary feature complete | Validate: filter requests by item name, requester or status. | |
| Stage 11 change request | Validate the late change: approved requests require an issued quantity before they can be marked issued, and issued quantity cannot exceed requested quantity. | |
| Validation rules | Try invalid or missing data based on: item name, quantity, reason, requested date and requester name are required; quantity must be positive; status must use valid values. | |
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
