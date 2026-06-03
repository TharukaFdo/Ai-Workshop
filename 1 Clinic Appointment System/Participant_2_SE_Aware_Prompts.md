# Participant 2: Clinic Appointment System Prompts

## Instructions

Copy and paste the prompts in order.

Do not expand them into long prompt-engineering instructions.

Use one stage at a time. If the AI implements future-stage features early, use the reusable failure prompt.

If the result is incomplete, use the reusable failure prompt.

If the app gives an error, use the error prompt and paste the error message after it.

Do not create instruction `.md` files in the project codebase.

## Copy-Paste Prompts

### Stage 0: Case Scope

```text
Summarize Clinic Appointment System: roles receptionist and doctor, main entity appointment, main feature appointment management, filtering, and out of scope. Do not create project files yet.
```

### Stage 1: Requirements

```text
List requirements for Clinic Appointment System: appointment create/view/update/cancel workflow, roles, validation, login, protected action add/edit visit notes, and basic automated tests. Do not create application code yet.
```

### Stage 2: React/Express/MySQL Structure

```text
Create React, Express, Node.js, and MySQL project structure: React frontend, Express backend, local MySQL, env setup, routes, pages, and run steps. Scaffold only. Do not implement the full business workflow yet.
```

### Stage 3: Data Model

```text
Design MySQL table for appointment using patientName, patientPhone, doctorName, date, time, reason, status, visitNote, initial status values booked, completed, cancelled, required fields, and role fields.

Use these local MySQL details and put them only in the backend .env file:
DB_HOST=[MYSQL_HOST]
DB_PORT=[MYSQL_PORT]
DB_USER=[MYSQL_USER]
DB_PASSWORD=[MYSQL_PASSWORD]
DB_NAME=[MYSQL_DATABASE]

Requirements:
- Use the Express backend with mysql2/promise and DB_HOST, DB_PORT, DB_USER, DB_PASSWORD, and DB_NAME for database access.
- Do not use a single database URL or API-key style configuration for database queries.
- Put secrets only in backend .env; never expose them in React.
- Create a repeatable database setup script, for example npm run db:setup.
- Create safe seed data for the workshop.
- Create a login/users table for the two roles.
- Do not rely on hard-coded frontend-only accounts.
- Use clearly labelled test records in the same local MySQL database and clean them up after tests.
- Do not drop existing tables unless the command is clearly named as a demo reset command.
- Do not implement UI features in this stage.
```

### Stage 4: UI Workflow

```text
Create UI workflow for receptionist and doctor: pages, forms, list, filters, role actions, loading, and errors.
```

### Stage 5: Main Feature

```text
Implement appointment create, view, update and cancel with React pages, Express routes, MySQL queries, validation, and errors.
```

### Stage 6: Authentication And Authorization

```text
Add database-backed login and authorization for receptionist and doctor. Use the users/login table from Stage 3. Use a simple login-issued user identity or session token for later requests. Protected backend routes must look up/check the user's role and ownership from the database before allowing actions. Do not trust a role, user type, or owner name sent directly from the browser as proof of permission. Protect add/edit visit notes in backend and UI. Do not use hard-coded frontend-only accounts.
```

### Stage 7: Secondary Feature

```text
Add appointment filtering by doctor, date or status. Update API, UI, and filters without adding unrelated features.
```

### Mid Review Stage

Use this after Stage 7 and before Stage 8. This is the same review prompt used by all three participant types for fair comparison.

```text
Conduct a mid-project review for Clinic Appointment System.

This is review only.
Do not modify application source code.
Do not modify database schema or seed data.
Do not install packages.
Do not create tests.
Do not fix issues.
Only create or update MID_REVIEW.md.

Case details:
- Roles: Receptionist, Doctor
- Main entity: Appointment
- Main workflow: appointment create, view, update and cancel workflow
- Secondary feature: filter appointments by doctor, date or status
- Protected action: add or edit visit notes

Case-specific review focus:
- appointment date/time and doctor assignment
- appointment status and cancellation flow
- visit note privacy and doctor-only editing

Review the project as it currently exists after the secondary feature stage and before testing, security hardening, and maintainability cleanup.

Check:
- Whether the app appears runnable.
- Whether React frontend and Express backend are separated.
- Whether React calls Express routes and never connects to MySQL directly.
- Whether the backend uses DB_HOST, DB_PORT, DB_USER, DB_PASSWORD, and DB_NAME for MySQL without exposing secrets in React.
- Whether the needed database tables appear to exist, including whether a users/login table exists.
- Whether there is a repeatable database setup or seed command.
- Whether login is database-backed, mock-only, role-selector-only, or missing.
- Whether role restrictions are enforced in the backend, not only the UI.
- Whether add or edit visit notes appears protected.
- Whether users appear limited to their own allowed records where relevant.
- Whether appointment create, view, update and cancel workflow appears implemented.
- Whether filter appointments by doctor, date or status appears implemented.
- Whether validation is present.
- Whether the AI implemented future stages early.
- What is missing before testing, security hardening, and maintainability cleanup.

Use the same review process and scoring matrix that will be used in the final review, so the before/after comparison is fair.

Create a review scoring matrix in MID_REVIEW.md before the issue list. Score each row from 0 to 5.

Score meaning:
- 0 = missing
- 1 = present but mostly not working
- 2 = partially working with major gaps
- 3 = mostly working with important gaps
- 4 = working with minor gaps
- 5 = complete for the selected case scope

For the Mid Review, score the current raw project before testing, security hardening, maintainability cleanup, and the change request. For the Testing Evidence column, score test readiness and any test hooks that already exist. Do not create tests.

Use this exact matrix structure:

| Feature / Area | Functionality 0-5 | Data Persistence 0-5 | Backend Security / Role Control 0-5 | Validation / Error Handling 0-5 | Testing Evidence 0-5 | Maintainability 0-5 | UI / Manual Usability 0-5 | Evidence | Notes |
|---|---:|---:|---:|---:|---:|---:|---:|---|---|
| Project setup and run commands |  |  |  |  |  |  |  |  |  |
| Database setup and starter data |  |  |  |  |  |  |  |  |  |
| Login workflow |  |  |  |  |  |  |  |  |  |
| Role-based access |  |  |  |  |  |  |  |  |  |
| Main create action |  |  |  |  |  |  |  |  |  |
| Main view/list action |  |  |  |  |  |  |  |  |  |
| Main update/status/cancel action |  |  |  |  |  |  |  |  |  |
| Protected action |  |  |  |  |  |  |  |  |  |
| Secondary feature |  |  |  |  |  |  |  |  |  |
| Case-specific: appointment date/time and doctor assignment |  |  |  |  |  |  |  |  |  |
| Case-specific: appointment status and cancellation flow |  |  |  |  |  |  |  |  |  |
| Case-specific: visit note privacy and doctor-only editing |  |  |  |  |  |  |  |  |  |
| UI/manual usability |  |  |  |  |  |  |  |  |  |
| Security posture |  |  |  |  |  |  |  |  |  |
| Testing evidence |  |  |  |  |  |  |  |  |  |
| Maintainability |  |  |  |  |  |  |  |  |  |

Save the review in MID_REVIEW.md with:
1. Mid-review summary
2. Review scoring matrix
3. Current feature status
4. Database and persistence status
5. Login and role/access status
6. Protected action status
7. Validation status
8. Stage drift or early implementation
9. Issues found before Stage 8
10. Manual checks recommended next
11. Pass/fail table
```

### Stage 8: Testing

```text
Create automated backend tests and a test command for appointment create/view/update/cancel workflow, validation, login, roles, visit notes, and appointment filtering.
Use clearly labelled test records in the same local MySQL database and clean them up after tests.
Add manual checks only as a supplement. Include a check that direct role/owner spoofing from browser headers, request body, or query parameters is rejected.
```

### Stage 9: Security And Validation

```text
Review security and validation. Fix required fields, backend role access, login-to-authorization gaps, raw role/owner headers, users accessing records outside their role, exposed secrets, fake/in-memory storage, and bad error handling.
```

### Stage 10: Maintainability

```text
Refactor for maintainability: clear names, smaller files, reusable helpers, no behaviour changes, and setup notes.
```

### Stage 11: Change Request

Use this only when the facilitator reaches Stage 11.

```text
Apply change request: appointments start as pending, doctors can accept or reject them, and accepted appointments become confirmed. Update data, database setup scripts, API, UI, validation, roles, and automated tests without rewriting the app.
```

### Stage 12: Final Review

```text
Prepare a final evidence-based review for Clinic Appointment System.

Case-specific review focus:
- appointment date/time and doctor assignment
- appointment status and cancellation flow
- visit note privacy and doctor-only editing

Instructions:
- This is review only.
- Do not modify application source code, database schema, seed data, package files, or configuration.
- Only create or update FINAL_REVIEW.md.
- Inspect the actual completed project files before answering.
- Do not say the project is complete unless the files, database setup, login, role checks, and tests prove it.
- Summarize what was built.
- Explain the main workflow end to end.
- List the final project structure.
- Explain whether React and Express are separated.
- Explain whether React calls Express routes and never connects to MySQL directly.
- Explain the database connection method. Say whether DB_HOST, DB_PORT, DB_USER, DB_PASSWORD, and DB_NAME are configured, but do not print the password.
- List the database tables used and whether a users/login table exists.
- Explain how tables and seed data are created again if needed.
- Explain how test data is created and cleaned up.
- Explain how the two roles log in and how roles are checked.
- Explain how the protected action for this case is handled.
- Explain the validation rules.
- Explain which backend role checks exist and which actions they protect.
- Explain whether users can access only their own allowed records.
- Explain the automated test command, what it checks, and the result.
- If only manual checks exist, say clearly what was not automated.
- Explain what changed after Stage 11.
- Identify anything that was built before its stage.
- Identify any mismatch between documents and code.
- Identify any exposed secret risk without printing secrets.
- Identify known limitations.
- Create a short demo script.
- Create viva questions a supervisor could ask.
- Create the same review scoring matrix used in the Mid Review, using the same rows, columns, and 0 to 5 score scale.
- For the Final Review, score the completed project after testing, security hardening, maintainability cleanup, and the change request.
- For the Testing Evidence column, score implemented automated tests, manual checks, cleanup of test data, and reported test results.

Use this exact matrix structure:

| Feature / Area | Functionality 0-5 | Data Persistence 0-5 | Backend Security / Role Control 0-5 | Validation / Error Handling 0-5 | Testing Evidence 0-5 | Maintainability 0-5 | UI / Manual Usability 0-5 | Evidence | Notes |
|---|---:|---:|---:|---:|---:|---:|---:|---|---|
| Project setup and run commands |  |  |  |  |  |  |  |  |  |
| Database setup and starter data |  |  |  |  |  |  |  |  |  |
| Login workflow |  |  |  |  |  |  |  |  |  |
| Role-based access |  |  |  |  |  |  |  |  |  |
| Main create action |  |  |  |  |  |  |  |  |  |
| Main view/list action |  |  |  |  |  |  |  |  |  |
| Main update/status/cancel action |  |  |  |  |  |  |  |  |  |
| Protected action |  |  |  |  |  |  |  |  |  |
| Secondary feature |  |  |  |  |  |  |  |  |  |
| Case-specific: appointment date/time and doctor assignment |  |  |  |  |  |  |  |  |  |
| Case-specific: appointment status and cancellation flow |  |  |  |  |  |  |  |  |  |
| Case-specific: visit note privacy and doctor-only editing |  |  |  |  |  |  |  |  |  |
| UI/manual usability |  |  |  |  |  |  |  |  |  |
| Security posture |  |  |  |  |  |  |  |  |  |
| Testing evidence |  |  |  |  |  |  |  |  |  |
| Maintainability |  |  |  |  |  |  |  |  |  |

Output:
1. Final feature summary
2. Review scoring matrix
3. Project structure and run commands
4. Frontend/backend separation check
5. Database setup and table summary
6. Login and role/access explanation
7. Protected action explanation
8. Validation summary
9. Automated and manual testing summary
10. Stage 11 change summary
11. Stage drift or early work
12. Security risks and exposed-secret check
13. Documentation/code mismatches
14. Known limitations
15. Demo script
16. Suggested viva questions
```
## Reusable Failure Prompt

Use this at any stage when the AI output is incomplete, incorrect, too broad, or not aligned with the selected case.

```text
Revise for Clinic Appointment System. Keep React, Express, Node.js, and MySQL, small scope, receptionist, doctor, appointment, validation, backend role access, database-backed login, visit note protection, filtering, automated checks, and fix the issue. Do only the current stage.
```
## Error Prompt

Use this when the app fails. Paste the actual error message after the prompt.

```text
Fix this React, Express, Node.js, and MySQL app error. Keep React, Express, Node.js, and MySQL. Explain the cause briefly and show the changed files:
```