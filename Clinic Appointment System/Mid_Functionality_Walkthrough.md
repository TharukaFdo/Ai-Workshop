# Clinic Appointment System: Mid Functionality Walkthrough

This is a participant-facing manual validation checklist, not an AI prompt.

Use this after the Mid Review Stage and before Stage 8. The purpose is to check the raw application before formal testing, security hardening, maintainability cleanup, and the change request.

Do not fix issues while doing this walkthrough. Mark the result as pass, fail, or unclear and continue.

## Case Snapshot

- Roles: Receptionist, Doctor
- Main entity: Appointment
- Important fields: patientName, patientPhone, doctorName, appointmentDate, appointmentTime, reason, status, visitNote, createdAt, updatedAt
- Main workflow: appointment create, view, update and cancel workflow
- Secondary feature: filter appointments by doctor, date or status
- Protected action: add or edit visit notes
- Expected early status values: booked, completed, cancelled

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
| Receptionist allowed actions | As Receptionist, check: create appointments, view appointments, update booking details, cancel appointments, filter appointments, view appointment status. | |
| Doctor allowed actions | As Doctor, check: view assigned appointments, view schedule, add visit notes, edit visit notes, mark appointments completed where appropriate. | |
| Protected action allowed | As the correct role, attempt: add or edit visit notes. | |
| Protected action blocked | As the wrong role, attempt: add or edit visit notes. It should be blocked by the backend, not only hidden in the UI. | |
| Own-record restriction | Try to access or modify another user role/member/owner record where relevant. It should be blocked. | |
| Main workflow | Complete the workflow: appointment create, view, update and cancel workflow. | |
| Secondary feature | Use the secondary feature: filter appointments by doctor, date or status. | |
| Validation | Try invalid or missing data based on: patient name, doctor name, date, time and reason are required; status must use valid values; appointment date/time must be valid; patient phone should use a simple valid format if provided. | |
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
