# Helpdesk Ticket System: Final Functionality Walkthrough

This is a participant-facing manual validation checklist, not an AI prompt.

Use this after the final review. The purpose is to manually validate the completed app after testing, security hardening, maintainability cleanup, and the change request.

Do not fix issues while doing this walkthrough. Mark the result as pass, fail, or unclear and continue.

## Case Snapshot

- Roles: User, Support agent
- Main entity: Ticket
- Important fields: title, description, category, submittedUser, status, agentResponse, createdAt, updatedAt, closedAt
- Main workflow: ticket creation, response, status update and closure workflow
- Secondary feature: filter tickets by category, submitted user or status
- Protected action: add or edit agent responses and close tickets
- Original status values: open, inProgress, resolved, closed
- Stage 11 change request: users can reopen a closed ticket once, and support agents can respond and close the reopened ticket again.

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
| User login and access | Log in as User and verify allowed actions: create tickets, view own ticket status, view agent responses, filter own tickets. | |
| Support agent login and access | Log in as Support agent and verify allowed actions: view submitted tickets, add agent responses, update ticket status, close tickets, filter tickets. | |
| Protected action positive case | Correct role can perform: add or edit agent responses and close tickets. | |
| Protected action negative case | Wrong role is blocked from: add or edit agent responses and close tickets, including direct API attempts where possible. | |
| Own-record restriction | A user cannot view, update, approve, close, or comment on records outside their allowed scope where relevant. | |
| Main workflow complete | Complete the full workflow: ticket creation, response, status update and closure workflow. | |
| Secondary feature complete | Validate: filter tickets by category, submitted user or status. | |
| Stage 11 change request | Validate the late change: users can reopen a closed ticket once, and support agents can respond and close the reopened ticket again. | |
| Validation rules | Try invalid or missing data based on: title, description, category and submitted user are required; status must use valid values; closed tickets should have a closed date where appropriate. | |
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
