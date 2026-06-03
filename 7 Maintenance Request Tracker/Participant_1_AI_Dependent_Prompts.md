# Participant 1: Maintenance Request Tracker Prompts

## Instructions

Copy and paste the prompts in order.

Do not rewrite the prompts into longer technical prompts.

If the result is wrong or incomplete, use the reusable failure prompt.

If the app gives an error, use the error prompt and paste the error message.

Do not create instruction `.md` files in the project codebase.

## Copy-Paste Prompts

### Stage 0: Start The App

```text
I want to build a maintenance request tracker app. Where should I start? Only explain first steps. Do not create or edit files yet.
```

### Stage 1: Understand The App

```text
Tell me what this app should do. Do not create or edit files yet.
```

### Stage 2: Create The Project

```text
Set up the project files so I can run the app. Only create the basic React frontend and Express backend files. Do not add the main features yet.
```

### Stage 3: Save The Main Thing

```text
Make maintenance requests save in MySQL and show again even after refresh.

Use these local MySQL details and put them only in the backend .env file:
DB_HOST=[MYSQL_HOST]
DB_PORT=[MYSQL_PORT]
DB_USER=[MYSQL_USER]
DB_PASSWORD=[MYSQL_PASSWORD]
DB_NAME=[MYSQL_DATABASE]

Keep the MySQL password out of React or browser code.
Add an easy command I can run if the demo data needs to be prepared again.
Do not use temporary browser storage or sample-only data.
Only do this saving step.
```

### Stage 4: Make The Screens

```text
Make simple screens for requester and technician.
```

### Stage 5: Add The Main Work

```text
Add creating, viewing, updating progress and closing maintenance requests.
```

### Stage 6: Add Login

```text
Add login for requester and technician.
Save login users in local MySQL, not only inside React.
The server should decide what each logged-in person is allowed to do.
Do not let the browser decide the role by itself.
Only do this login step.
```

### Stage 7: Add The Extra Part

```text
Add filtering by location, priority or status.
```

### Mid Review Stage

Use this after Stage 7 and before Stage 8. This is the same review prompt used by all three participant types for fair comparison.

```text
Conduct a mid-project review for Maintenance Request Tracker.

This is review only.
Do not modify application source code.
Do not modify database schema or seed data.
Do not install packages.
Do not create tests.
Do not fix issues.
Only create or update MID_REVIEW.md.

Case details:
- Roles: Requester, Technician
- Main entity: Maintenance Request
- Main workflow: maintenance request submission, progress update and closure workflow
- Secondary feature: filter requests by location, priority or status
- Protected action: add or edit technician notes and close requests

Case-specific review focus:
- location, priority, and problem details
- technician notes and progress updates
- request closure protection and requester visibility

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
- Whether add or edit technician notes and close requests appears protected.
- Whether users appear limited to their own allowed records where relevant.
- Whether maintenance request submission, progress update and closure workflow appears implemented.
- Whether filter requests by location, priority or status appears implemented.
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
| Case-specific: location, priority, and problem details |  |  |  |  |  |  |  |  |  |
| Case-specific: technician notes and progress updates |  |  |  |  |  |  |  |  |  |
| Case-specific: request closure protection and requester visibility |  |  |  |  |  |  |  |  |  |
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

### Stage 8: Check The App

```text
Check if the app works and fix broken parts.
Add a simple test command I can run.
The test should check saving to local MySQL, login, permissions, the main work, and the extra part.
Use test data and clean it up.
```

### Stage 9: Make It Safer

```text
Make the app safer and stop users doing wrong things.
```

### Stage 10: Clean It Up

```text
Clean up the code and keep the app working.
```

### Stage 11: Change Request

Use this only when the facilitator reaches Stage 11.

```text
Change the app: high priority requests need an urgent flag and cannot be closed without a technician note.
```

### Stage 12: Final Review

```text
Prepare a final evidence-based review for Maintenance Request Tracker.

Case-specific review focus:
- location, priority, and problem details
- technician notes and progress updates
- request closure protection and requester visibility

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
| Case-specific: location, priority, and problem details |  |  |  |  |  |  |  |  |  |
| Case-specific: technician notes and progress updates |  |  |  |  |  |  |  |  |  |
| Case-specific: request closure protection and requester visibility |  |  |  |  |  |  |  |  |  |
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

Use this at any stage when the AI output is wrong, too big, incomplete, broken, or not matching the selected case.

```text
This is wrong. Make it match the maintenance request tracker app, keep it simple, and fix it.
Do only the current stage.
Keep React, Express, Node.js, and MySQL.
Do not save only in browser memory when MySQL is required.
Do not put database secrets in React.
```
## Error Prompt

Use this when the app fails.

```text
Fix this error:
```