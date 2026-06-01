# Maintenance Request Tracker: Mid Functionality Walkthrough

This is a participant-facing manual validation checklist, not an AI prompt.

Use this after the Mid Review Stage and before Stage 8. The purpose is to check the raw application before formal testing, security hardening, maintainability cleanup, and the change request.

Do not fix issues while doing this walkthrough. Mark the result as pass, fail, or unclear and continue.

## Case Snapshot

- Roles: Requester, Technician
- Main entity: Maintenance Request
- Important fields: title, description, location, priority, requesterName, status, technicianNote, createdAt, updatedAt, closedAt
- Main workflow: maintenance request submission, progress update and closure workflow
- Secondary feature: filter requests by location, priority or status
- Protected action: add or edit technician notes and close requests
- Expected early status values: submitted, inProgress, completed, closed

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
| Requester allowed actions | As Requester, check: submit maintenance requests, view own request status, update own open request details, filter own requests. | |
| Technician allowed actions | As Technician, check: view submitted requests, add technician notes, update progress, close requests, filter requests. | |
| Protected action allowed | As the correct role, attempt: add or edit technician notes and close requests. | |
| Protected action blocked | As the wrong role, attempt: add or edit technician notes and close requests. It should be blocked by the backend, not only hidden in the UI. | |
| Own-record restriction | Try to access or modify another user role/member/owner record where relevant. It should be blocked. | |
| Main workflow | Complete the workflow: maintenance request submission, progress update and closure workflow. | |
| Secondary feature | Use the secondary feature: filter requests by location, priority or status. | |
| Validation | Try invalid or missing data based on: title, description, location, priority and requester name are required; priority and status must use valid values. | |
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
