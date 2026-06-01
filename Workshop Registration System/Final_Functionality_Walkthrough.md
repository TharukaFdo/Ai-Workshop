# Workshop Registration System: Final Functionality Walkthrough

This is a participant-facing manual validation checklist, not an AI prompt.

Use this after the final review. The purpose is to manually validate the completed app after testing, security hardening, maintainability cleanup, and the change request.

Do not fix issues while doing this walkthrough. Mark the result as pass, fail, or unclear and continue.

## Case Snapshot

- Roles: Participant, Organizer
- Main entity: Registration
- Important fields: participantName, email, workshopTitle, registrationDetails, status, attendanceStatus, organizerNote, createdAt, updatedAt
- Main workflow: workshop registration, status update and attendance marking workflow
- Secondary feature: filter registrations by workshop title, registration status or attendance status
- Protected action: mark attendance and edit organizer notes
- Original status values: 
- Stage 11 change request: organizers can move pending registrations to a waitlisted status, and waitlisted registrations can later be confirmed.

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
| Participant login and access | Log in as Participant and verify allowed actions: create registrations, view own registration status, update own pending registration details, filter own registrations. | |
| Organizer login and access | Log in as Organizer and verify allowed actions: view registrations, update registration status, add organizer notes, mark attendance, filter registrations. | |
| Protected action positive case | Correct role can perform: mark attendance and edit organizer notes. | |
| Protected action negative case | Wrong role is blocked from: mark attendance and edit organizer notes, including direct API attempts where possible. | |
| Own-record restriction | A user cannot view, update, approve, close, or comment on records outside their allowed scope where relevant. | |
| Main workflow complete | Complete the full workflow: workshop registration, status update and attendance marking workflow. | |
| Secondary feature complete | Validate: filter registrations by workshop title, registration status or attendance status. | |
| Stage 11 change request | Validate the late change: organizers can move pending registrations to a waitlisted status, and waitlisted registrations can later be confirmed. | |
| Validation rules | Try invalid or missing data based on: participant name, email, workshop title and registration details are required; email should use a simple valid format; registration status must use valid values; attendance status must be notMarked, present or absent. | |
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
