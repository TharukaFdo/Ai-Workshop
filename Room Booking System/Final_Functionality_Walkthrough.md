# Room Booking System: Final Functionality Walkthrough

This is a participant-facing manual validation checklist, not an AI prompt.

Use this after the final review. The purpose is to manually validate the completed app after testing, security hardening, maintainability cleanup, and the change request.

Do not fix issues while doing this walkthrough. Mark the result as pass, fail, or unclear and continue.

## Case Snapshot

- Roles: Staff member, Coordinator
- Main entity: Room Booking
- Important fields: roomName, bookingDate, startTime, endTime, purpose, requesterName, status, coordinatorNote, createdAt, updatedAt
- Main workflow: room booking request create, view, update and approve/reject workflow
- Secondary feature: filter bookings by room, date or status
- Protected action: approve or reject room bookings and edit coordinator notes
- Original status values: pending, approved, rejected, cancelled
- Stage 11 change request: approved room bookings must not overlap with another approved booking for the same room, date and time range.

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
| Staff member login and access | Log in as Staff member and verify allowed actions: request room bookings, view own booking status, update own pending booking details, filter own bookings. | |
| Coordinator login and access | Log in as Coordinator and verify allowed actions: view all room booking requests, approve or reject bookings, update booking status, add coordinator notes, filter bookings. | |
| Protected action positive case | Correct role can perform: approve or reject room bookings and edit coordinator notes. | |
| Protected action negative case | Wrong role is blocked from: approve or reject room bookings and edit coordinator notes, including direct API attempts where possible. | |
| Own-record restriction | A user cannot view, update, approve, close, or comment on records outside their allowed scope where relevant. | |
| Main workflow complete | Complete the full workflow: room booking request create, view, update and approve/reject workflow. | |
| Secondary feature complete | Validate: filter bookings by room, date or status. | |
| Stage 11 change request | Validate the late change: approved room bookings must not overlap with another approved booking for the same room, date and time range. | |
| Validation rules | Try invalid or missing data based on: room name, booking date, start time, end time, purpose and requester name are required; status must use valid values; end time must be after start time. | |
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
