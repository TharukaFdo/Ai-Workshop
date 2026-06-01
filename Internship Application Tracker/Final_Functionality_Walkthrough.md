# Internship Application Tracker: Final Functionality Walkthrough

This is a participant-facing manual validation checklist, not an AI prompt.

Use this after the final review. The purpose is to manually validate the completed app after testing, security hardening, maintainability cleanup, and the change request.

Do not fix issues while doing this walkthrough. Mark the result as pass, fail, or unclear and continue.

## Case Snapshot

- Roles: Student, Coordinator
- Main entity: Internship Application
- Important fields: studentName, companyName, positionTitle, startDate, endDate, submittedDate, status, coordinatorComment, createdAt, updatedAt
- Main workflow: internship application submission, review and status update workflow
- Secondary feature: filter applications by company name or application status
- Protected action: add or edit coordinator comments and approve or reject applications
- Original status values: submitted, underReview, approved, rejected
- Stage 11 change request: coordinators can request changes, and students can edit and resubmit only applications with changes requested.

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
| Student login and access | Log in as Student and verify allowed actions: submit internship applications, view own application status, update own editable application details, filter own applications. | |
| Coordinator login and access | Log in as Coordinator and verify allowed actions: review applications, add coordinator comments, update application status, filter applications. | |
| Protected action positive case | Correct role can perform: add or edit coordinator comments and approve or reject applications. | |
| Protected action negative case | Wrong role is blocked from: add or edit coordinator comments and approve or reject applications, including direct API attempts where possible. | |
| Own-record restriction | A user cannot view, update, approve, close, or comment on records outside their allowed scope where relevant. | |
| Main workflow complete | Complete the full workflow: internship application submission, review and status update workflow. | |
| Secondary feature complete | Validate: filter applications by company name or application status. | |
| Stage 11 change request | Validate the late change: coordinators can request changes, and students can edit and resubmit only applications with changes requested. | |
| Validation rules | Try invalid or missing data based on: student name, company name, position title, start date, end date and submitted date are required; status must use valid values; end date must be after start date. | |
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
