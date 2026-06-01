# Student Project Tracker: Final Functionality Walkthrough

This is a participant-facing manual validation checklist, not an AI prompt.

Use this after the final review. The purpose is to manually validate the completed app after testing, security hardening, maintainability cleanup, and the change request.

Do not fix issues while doing this walkthrough. Mark the result as pass, fail, or unclear and continue.

## Case Snapshot

- Roles: Student, Supervisor
- Main entity: Project Submission
- Important fields: title, description, category, studentName, supervisorName, submittedDate, status, feedback, createdAt, updatedAt
- Main workflow: project submission, supervisor review, feedback and status update workflow
- Secondary feature: filter projects by supervisor, category or status
- Protected action: add or edit supervisor feedback and approve or reject projects
- Original status values: submitted, underReview, approved, rejected
- Stage 11 change request: supervisors can request revisions, and students can edit and resubmit only submissions with revision requested status.

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
| Student login and access | Log in as Student and verify allowed actions: create project submissions, update own editable submissions, view own status, filter own submissions. | |
| Supervisor login and access | Log in as Supervisor and verify allowed actions: view submitted projects, add feedback, update project status, filter projects. | |
| Protected action positive case | Correct role can perform: add or edit supervisor feedback and approve or reject projects. | |
| Protected action negative case | Wrong role is blocked from: add or edit supervisor feedback and approve or reject projects, including direct API attempts where possible. | |
| Own-record restriction | A user cannot view, update, approve, close, or comment on records outside their allowed scope where relevant. | |
| Main workflow complete | Complete the full workflow: project submission, supervisor review, feedback and status update workflow. | |
| Secondary feature complete | Validate: filter projects by supervisor, category or status. | |
| Stage 11 change request | Validate the late change: supervisors can request revisions, and students can edit and resubmit only submissions with revision requested status. | |
| Validation rules | Try invalid or missing data based on: title, description, category, student name, supervisor name and submitted date are required; status must use valid values; submitted date must be valid. | |
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
