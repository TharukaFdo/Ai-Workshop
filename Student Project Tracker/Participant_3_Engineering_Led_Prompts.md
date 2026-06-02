# Participant 3: Student Project Tracker Prompts

## Instructions

Copy and paste the prompts in order.

Let the AI inspect and edit the codebase when the prompt asks it to.

Review the AI output before accepting it.

Reject output that:

- Changes the required PERN/Supabase stack.
- Bypasses the Express backend.
- Ignores role restrictions.
- Skips backend validation.
- Adds unrelated features.
- Rewrites the whole project unnecessarily.
- Stores secrets in frontend code.
- Uses client-supplied role or owner headers as authorization proof.
- Leaves unused Supabase SDK config or dependencies.

You may keep instruction `.md` files in the project codebase when the prompts ask for them.

## Global Rules For Every Prompt

These rules are already included across the stage prompts. If the AI drifts, paste the relevant rule again.

```text
Use React for the frontend, Node.js/Express for the backend, and Supabase PostgreSQL for the database.
React must call Express API routes. Express must handle Supabase database access.
Do not build a Supabase-only React app.
Use direct PostgreSQL access from Express with pg; do not add unused Supabase SDK clients/config.
If frontend environment variables are needed, use only a non-secret API URL such as VITE_API_URL.
Keep the project small and focused on the selected case.
Do not add features outside the client case unless the prompt asks for them.
Do only the current stage. Do not implement future-stage functionality early.
Prefer complete working code over pseudocode.
Before changing files, inspect the current structure.
After changing files, list the files changed and how to run or check the result.
```
## Copy-Paste Prompts

### Stage 0: Case Scope, Assumptions, And Working Notes

```text
You are helping build a workshop-limited PERN application.

Selected case:
Student Project Tracker

Client explanation:
We need a simple system to help students submit their software project details and allow supervisors to review them without relying on scattered documents and messages. A student should be able to create and update their own project submission with details such as title, description, category, student name, supervisor name, submitted date, and current status. A supervisor should be able to view submitted projects, add feedback, and update the project status. It would also help if projects could be filtered by supervisor, category, or status. Students must not be able to edit supervisor feedback or approve their own projects. This should be a small PERN prototype using React, Node.js/Express, and Supabase PostgreSQL, focused only on submission, review, feedback, and status tracking.

Required stack:
- Frontend: React
- Backend: Node.js with Express
- Database: Supabase PostgreSQL

Roles:
- Student
- Supervisor

Main entity:
Project Submission

Task:
Create or update PROJECT_CONTEXT.md in the project codebase.

Instructions:
- Restate the selected case in your own words.
- Define the exact workshop scope.
- Identify the two roles and their responsibilities.
- Identify Project Submission and the main workflow.
- Identify the secondary feature.
- Identify what is out of scope.
- Identify assumptions and missing details.
- Identify likely risks.
- Do not write application code yet.

Output:
1. PROJECT_CONTEXT.md content
2. Assumptions
3. Missing details
4. Scope boundaries
5. Risk notes
```

### Stage 1: Requirements, Acceptance Criteria, And Role Rules

```text
Use the selected case and PROJECT_CONTEXT.md.

Create or update REQUIREMENTS.md for Student Project Tracker.

Case details:
- Roles: Student, Supervisor
- Student actions: create project submissions, update own editable submissions, view own status, filter own submissions
- Supervisor actions: view submitted projects, add feedback, update project status, filter projects
- Main entity: Project Submission
- Important fields: title, description, category, studentName, supervisorName, submittedDate, status, feedback, createdAt, updatedAt
- Initial status values before Stage 11: submitted, underReview, approved, rejected
- Main feature: project submission, supervisor review, feedback and status update workflow
- Secondary feature: filter projects by supervisor, category or status
- Protected action: add or edit supervisor feedback and approve or reject projects
- Validation expectations: title, description, category, student name, supervisor name and submitted date are required; status must use valid values; submitted date must be valid
- Security concerns: students must not edit supervisor feedback; students must not approve their own projects; users must not access actions outside their role; Supabase service keys must not be exposed in frontend code
- Out of scope: full LMS integration, file uploads, grading rubrics, team allocation, plagiarism checking

Instructions:
- Write must-have requirements only.
- Create acceptance criteria for each must-have requirement.
- Create a role-permission matrix.
- Define backend-enforced protected actions.
- Define the need for a database-backed prototype login table or auth mechanism.
- Define validation rules.
- Define failure cases.
- Define minimum automated tests and any manual checks.
- Keep the scope suitable for a one-day workshop.
- Do not write application code yet.

Output:
1. REQUIREMENTS.md content
2. Acceptance criteria
3. Role-permission matrix
4. Validation rules
5. Failure cases
6. Minimum verification checklist
```

### Stage 2: PERN Architecture Backbone And Project Scaffold

```text
Inspect the current codebase, then create or update the PERN project backbone for Student Project Tracker.

Required architecture:
- React frontend
- Node.js/Express backend
- Supabase PostgreSQL database
- React calls Express API routes
- Express handles all Supabase access

Instructions:
- If the project is empty, scaffold a simple frontend and backend.
- Keep the structure simple and workshop-friendly.
- Create clear frontend, backend, config, and documentation areas.
- Add .env.example files without real secrets.
- Add package scripts to run frontend and backend. If a root package.json is created, its scripts must delegate to real frontend/backend commands; do not leave placeholder scripts that fail.
- Add a README.md with setup and run steps.
- Prepare a placeholder for DATABASE_URL in backend .env.example.
- Do not implement all business features yet.
- Do not implement login, full CRUD, or secondary features in this stage.
- Do not add unrelated frameworks.
- After editing, list all files created or changed.

Expected structure may include:
- frontend/
- backend/
- backend/routes/
- backend/services/
- backend/middleware/
- backend/config/
- docs/

Output:
1. Files created or changed
2. Backend setup
3. Frontend setup
4. Environment variables needed
5. Run commands
6. Known setup risks
```

### Stage 3: Supabase Data Model And Database Access

```text
Implement the database model and data access layer for Student Project Tracker.

Main entity:
Project Submission

Important fields:
title, description, category, studentName, supervisorName, submittedDate, status, feedback, createdAt, updatedAt

Initial status values before Stage 11:
submitted, underReview, approved, rejected

Roles:
Student, Supervisor

Supabase PostgreSQL connection information to use:
DATABASE_URL: [SUPABASE_DATABASE_URL]
Database password: [SUPABASE_DATABASE_PASSWORD]

Instructions:
- Use direct PostgreSQL access from the Express backend with pg and DATABASE_URL.
- Do not use Supabase URL/key style configuration for database queries. Do not install or scaffold @supabase/supabase-js for this workshop unless it is actively used; prefer pg only and remove unused SDK config.
- Put DATABASE_URL only in backend .env files. Never expose database credentials in React. If the frontend needs an environment variable, use only a non-secret API base URL such as VITE_API_URL.
- Create SQL for the Supabase PostgreSQL table or tables needed for the workshop slice.
- Include a database-backed prototype login table, for example app_users, with role and ownership/identity fields for the two roles.
- Include primary keys, required fields, status constraints, timestamps, and ownership/access fields where needed.
- Add backend database configuration using environment variables.
- Add data access functions or service functions for Project Submission.
- Keep the data model minimal but complete for the main workflow and secondary feature.
- Do not add unrelated entities.
- Add example seed data, including demo users for the two roles.
- Add a repeatable non-destructive database setup script, for example npm run db:setup.
- Add a clearly labelled demo reset script only if reset is needed.
- Plan for automated tests to create clearly labelled test records in the same Supabase database and clean them up.
- Do not use fake, browser-only, or in-memory storage.
- Do not implement UI features in this stage.
- Update README.md or docs with database setup steps.
- Run or describe a database connection/setup check and report the result.
- After editing, list all files created or changed.

Output:
1. SQL schema
2. Database configuration
3. Data access/service code
4. Example data if useful
5. Demo users/login table setup
6. Setup and test-data cleanup instructions
7. Connection/setup check result
8. Risks or assumptions
```

### Stage 4: UI Workflow And Frontend Skeleton

```text
Implement the frontend workflow skeleton for Student Project Tracker.

Roles:
- Student
- Supervisor

Main workflow:
project submission, supervisor review, feedback and status update workflow

Secondary feature:
filter projects by supervisor, category or status

Instructions:
- Create role-aware screens for Student and Supervisor.
- Create forms for the important Project Submission fields.
- Create list/detail views needed for the workflow.
- Add simple navigation.
- Add loading, empty, success, and error states.
- Add basic client-side checks, but do not rely on frontend checks for security.
- Make the UI polished and clearly better than a basic scaffold. Use a responsive dashboard layout, clear role-specific sections, status badges, useful loading/empty/error states, and subtle transitions or animations. Avoid putting most styling inline in App.jsx; use a maintainable CSS file or clear component styling structure.
- Do not add unnecessary landing pages.
- After editing, list all files created or changed.

Output:
1. Frontend files created or changed
2. Screens/components implemented
3. User flow summary
4. Manual UI checks
5. Known gaps
```

### Stage 5: Core Feature Implementation End-To-End

```text
Implement the core feature end-to-end for Student Project Tracker.

Core feature:
project submission, supervisor review, feedback and status update workflow

Main entity:
Project Submission

Required stack:
- React frontend
- Express API
- Supabase PostgreSQL

Instructions:
- Implement the case workflow actions for Project Submission, including create, read, update, and status/lifecycle actions where appropriate.
- Add Express routes for the core workflow.
- Connect routes to Supabase through backend service functions.
- Connect React screens to Express API routes.
- Add backend validation for required fields and status values.
- Add user-friendly frontend error messages.
- Keep the implementation small and focused.
- Do not bypass Express.
- After editing, list all files created or changed.

Output:
1. Backend routes implemented
2. Backend service/data functions implemented
3. Frontend workflow implemented
4. Validation added
5. Manual check steps
6. Remaining issues
```

### Stage 6: Authentication And Backend Authorization

```text
Add workshop-suitable authentication and backend authorization for Student Project Tracker.

Roles:
- Student
- Supervisor

Protected action:
add or edit supervisor feedback and approve or reject projects

Instructions:
- Add database-backed prototype login using the users/login table from Stage 3.
- Do not store credentials only in React.
- If a password dependency is reasonable, store seeded demo passwords as hashes.
- Add a backend login endpoint that verifies the user and returns the authenticated user role and identity.
- Store the authenticated user role and identity clearly in the app state.
- Send authenticated user information to the backend using a simple signed token/session if practical. If a simplified user ID token is used, never trust role, owner, or doctor/resource names sent directly by the browser; protected routes must load role and ownership from the database.
- Enforce protected actions in Express middleware or route handlers.
- Do not rely only on hiding buttons in React.
- Ensure add or edit supervisor feedback and approve or reject projects is blocked for the wrong role.
- Ensure users cannot modify data they should not modify.
- Ensure the second role can access only their assigned/owned records where the case requires it.
- Clearly mark what is simplified for the workshop.
- After editing, list all files created or changed.

Output:
1. Auth approach
2. Backend authorization checks
3. Frontend role handling
4. Protected action behaviour
5. Allowed-action checks
6. Blocked-action checks
7. Remaining security limitations
```

### Stage 7: Secondary Feature Implementation

```text
Implement the secondary feature for Student Project Tracker.

Secondary feature:
filter projects by supervisor, category or status

Main entity:
Project Submission

Instructions:
- Keep the feature small and directly connected to Project Submission.
- Add only the backend route/query changes needed.
- Add only the frontend UI changes needed.
- Ensure the feature respects Student and Supervisor permissions.
- Ensure backend validation still applies.
- Do not add unrelated features.
- After editing, list all files created or changed.

Output:
1. Backend changes
2. Frontend changes
3. Data/query changes
4. Permission behaviour
5. Manual verification steps
6. Risks introduced
```

### Mid Review Stage

Use this after Stage 7 and before Stage 8. This is the same review prompt used by all three participant types for fair comparison.

```text
Conduct a mid-project review for Student Project Tracker.

This is review only.
Do not modify application source code.
Do not modify database schema or seed data.
Do not install packages.
Do not create tests.
Do not fix issues.
Only create or update MID_REVIEW.md.

Case details:
- Roles: Student, Supervisor
- Main entity: Project Submission
- Main workflow: project submission, supervisor review, feedback and status update workflow
- Secondary feature: filter projects by supervisor, category or status
- Protected action: add or edit supervisor feedback and approve or reject projects

Review the project as it currently exists after the secondary feature stage and before testing, security hardening, and maintainability cleanup.

Check:
- Whether the app appears runnable.
- Whether React frontend and Express backend are separated.
- Whether React calls Express routes instead of Supabase directly.
- Whether Supabase uses DATABASE_URL in the backend without exposing secrets in React.
- Whether the needed database tables appear to exist, including whether a users/login table exists.
- Whether there is a repeatable database setup or seed command.
- Whether login is database-backed, mock-only, role-selector-only, or missing.
- Whether role restrictions are enforced in the backend, not only the UI.
- Whether add or edit supervisor feedback and approve or reject projects appears protected.
- Whether users appear limited to their own allowed records where relevant.
- Whether project submission, supervisor review, feedback and status update workflow appears implemented.
- Whether filter projects by supervisor, category or status appears implemented.
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
- 5 = complete for workshop scope

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

### Stage 8: Tests And Manual Verification

```text
Add practical verification for Student Project Tracker.

Instructions:
- Add lightweight automated tests and expose them through a clear command, for example npm test. If a root package exists, root npm test must run the backend tests or README must clearly direct the exact backend test command; do not leave a failing placeholder test script.
- Use clearly labelled test records in the same Supabase database and clean them up after tests.
- Do not rely only on manual checks.
- Cover the main workflow.
- Cover create, view, update, and status/lifecycle actions where implemented.
- Cover required field validation.
- Cover database setup or at least database connectivity.
- Cover database-backed login.
- Cover invalid status or invalid input cases.
- Cover Student allowed and blocked actions.
- Cover Supervisor allowed and blocked actions.
- Cover users trying to access records outside their role/identity.
- Cover add or edit supervisor feedback and approve or reject projects.
- Cover filter projects by supervisor, category or status.
- Include expected results and actual result placeholders.
- Add docs/TEST_PLAN.md as a supplement to the automated tests.
- After editing, list all files created or changed.

Output:
1. Tests or TEST_PLAN.md
2. Success cases
3. Failure cases
4. Role access cases
5. Protected action checks
6. How to run or perform the checks
```

### Stage 9: Security And Validation Hardening

```text
Review and improve security and validation for Student Project Tracker.

Known security concerns:
students must not edit supervisor feedback; students must not approve their own projects; users must not access actions outside their role; Supabase service keys must not be exposed in frontend code

Validation expectations:
title, description, category, student name, supervisor name and submitted date are required; status must use valid values; submitted date must be valid

Instructions:
- Inspect backend routes and services.
- Ensure required fields are validated on the backend.
- Ensure role checks happen on the backend.
- Ensure the protected action is protected.
- Ensure authenticated identity is used for protected actions, not client-supplied role, owner, or doctor/resource headers.
- Ensure users cannot access records outside their allowed role/identity.
- Ensure fake/in-memory storage is not masking database failures.
- Ensure frontend secrets are not exposed.
- Ensure Supabase service keys are not used in frontend code.
- Ensure API errors do not expose sensitive details.
- Remove unused Supabase SDK clients/config if the project uses pg with DATABASE_URL.
- Apply focused fixes only.
- Update docs/TEST_PLAN.md or tests with any new checks.
- After editing, list all files created or changed.

Output:
1. Security issues found
2. Validation issues found
3. Fixes applied
4. Checks added or updated
5. Remaining risks
```

### Stage 10: Maintainability Refactor And Documentation

```text
Refactor Student Project Tracker for maintainability without changing behaviour.

Instructions:
- Identify duplicated code.
- Remove dead scaffolding, unused config files, and unused dependencies.
- Identify unclear names.
- Identify oversized files or mixed responsibilities.
- Move repeated API calls, validation logic, or constants into reusable helpers where useful.
- Keep the structure simple.
- Do not introduce unnecessary abstractions.
- Update README.md, PROJECT_CONTEXT.md, and REQUIREMENTS.md if the implementation changed.
- Rerun or restate the checks that should still pass.
- After editing, list all files created or changed.

Output:
1. Maintainability issues found
2. Refactoring changes made
3. Behaviour that must remain unchanged
4. Documentation updates
5. Checks to rerun
6. Remaining technical debt
```

### Stage 11: Change Request Impact And Implementation

Use this only when the facilitator reaches Stage 11.

```text
Apply this change request to Student Project Tracker:
supervisors can request revisions, and students can edit and resubmit only submissions with revision requested status.

Instructions:
- Do not start coding immediately.
- First perform a short impact analysis.
- Identify affected data fields, database schema, Express routes, service functions, React screens, validation rules, role rules, and tests.
- Apply the smallest safe change.
- Do not rewrite the whole app.
- Keep the project within the selected case scope.
- Update database setup scripts, automated tests, and docs/TEST_PLAN.md.
- Update README.md or PROJECT_CONTEXT.md if needed.
- After editing, list all files created or changed.

Output:
1. Impact analysis
2. Files affected
3. Data model changes
4. Backend changes
5. Frontend changes
6. Validation/access changes
7. Checks updated
8. Remaining risks
```

### Stage 12: Final Review

```text
Prepare a final evidence-based review for Student Project Tracker.

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
- Explain whether React calls Express, not Supabase directly.
- Explain the database connection method. Say whether DATABASE_URL is configured, but do not print the password.
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
## Reusable Quality Recovery Prompt

Use this at any stage when the AI response is incomplete, incorrect, too broad, unsafe, not testable, or not aligned with the selected case.

```text
Revise the previous response for Student Project Tracker.

Keep these constraints:
- React frontend, Express backend, Supabase PostgreSQL database.
- React must call Express API routes.
- Express must handle Supabase access.
- Do not build a Supabase-only React app.
- Keep the scope limited to the selected case.
- Include Student, Supervisor, Project Submission, project submission, supervisor review, feedback and status update workflow, filter projects by supervisor, category or status, and add or edit supervisor feedback and approve or reject projects.
- Enforce role access in the backend, not only the UI.
- Use database-backed prototype login, not frontend-only hard-coded accounts.
- Use real Supabase PostgreSQL through Express, not fake/in-memory storage.
- Include backend validation for required fields and status values.
- Include automated verification where practical.
- Do only the current stage.
- Avoid pseudocode.
- List exact files to create or change.
- Include how to verify the result.

Issue to fix:
The previous response is incomplete, incorrect, or not aligned with Student Project Tracker.
```
## Error Prompt

Use this when the app fails.

```text
The app failed with this error:

Context:
This is Student Project Tracker, a PERN app using React, Node.js/Express, and Supabase PostgreSQL.

Rules:
- Do not change the stack.
- Do not bypass Express.
- Do not rewrite unrelated files.

Instructions:
- Identify the likely cause.
- Ask for missing file content only if required.
- Suggest the smallest safe fix.
- Show exact file changes.
- Explain how to verify the fix.
```