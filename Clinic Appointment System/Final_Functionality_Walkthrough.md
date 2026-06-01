# Clinic Appointment System: Final Functionality Walkthrough

This is a participant-facing manual validation checklist, not an AI prompt.

Use this after the final review. The purpose is to manually validate the completed app after testing, security hardening, maintainability cleanup, and the change request.

Do not fix issues while doing this walkthrough. Mark the result as pass, fail, or unclear and continue.

## Case Snapshot

- Roles: Receptionist, Doctor
- Main entity: Appointment
- Important fields: patientName, patientPhone, doctorName, appointmentDate, appointmentTime, reason, status, visitNote, createdAt, updatedAt
- Main workflow: appointment create, view, update and cancel workflow
- Secondary feature: filter appointments by doctor, date or status
- Protected action: add or edit visit notes
- Original status values: booked, completed, cancelled
- Stage 11 change request: Appointments must start as pending. Doctors can accept or reject pending appointments. Only accepted appointments should be treated as confirmed.

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
| Receptionist login and access | Log in as Receptionist and verify allowed actions: create appointments, view appointments, update booking details, cancel appointments, filter appointments, view appointment status. | |
| Doctor login and access | Log in as Doctor and verify allowed actions: view assigned appointments, view schedule, add visit notes, edit visit notes, mark appointments completed where appropriate. | |
| Protected action positive case | Correct role can perform: add or edit visit notes. | |
| Protected action negative case | Wrong role is blocked from: add or edit visit notes, including direct API attempts where possible. | |
| Own-record restriction | A user cannot view, update, approve, close, or comment on records outside their allowed scope where relevant. | |
| Main workflow complete | Complete the full workflow: appointment create, view, update and cancel workflow. | |
| Secondary feature complete | Validate: filter appointments by doctor, date or status. | |
| Stage 11 change request | Validate the late change: Appointments must start as pending. Doctors can accept or reject pending appointments. Only accepted appointments should be treated as confirmed. | |
| Validation rules | Try invalid or missing data based on: patient name, doctor name, date, time and reason are required; status must use valid values; appointment date/time must be valid; patient phone should use a simple valid format if provided. | |
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
