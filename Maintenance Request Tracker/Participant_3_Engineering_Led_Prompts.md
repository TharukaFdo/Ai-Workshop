# Participant 3: Maintenance Request Tracker Prompts

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

You may keep instruction `.md` files in the project codebase when the prompts ask for them.

## Global Rules For Every Prompt

These rules are already included across the stage prompts. If the AI drifts, paste the relevant rule again.

```text
Use React for the frontend, Node.js/Express for the backend, and Supabase PostgreSQL for the database.
React must call Express API routes. Express must handle Supabase database access.
Do not build a Supabase-only React app.
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
Maintenance Request Tracker

Client explanation:
We need a simple system for people to report maintenance problems and for technicians to update the progress of the work. A requester should be able to submit a maintenance request with a title, description, location, priority, and their name, then view the current status. A technician should be able to view submitted requests, add technician notes, update the progress, and close a request after the work is completed. It would also help if requests could be filtered by location, priority, or status. Requesters should not be able to close requests or edit technician notes. This should be a small prototype built with React, Node.js/Express, and Supabase PostgreSQL, focused on request submission, progress updates, and closure.

Required stack:
- Frontend: React
- Backend: Node.js with Express
- Database: Supabase PostgreSQL

Roles:
- Requester
- Technician

Main entity:
Maintenance Request

Task:
Create or update PROJECT_CONTEXT.md in the project codebase.

Instructions:
- Restate the selected case in your own words.
- Define the exact workshop scope.
- Identify the two roles and their responsibilities.
- Identify Maintenance Request and the main workflow.
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

Create or update REQUIREMENTS.md for Maintenance Request Tracker.

Case details:
- Roles: Requester, Technician
- Requester actions: submit maintenance requests, view own request status, update own open request details, filter own requests
- Technician actions: view submitted requests, add technician notes, update progress, close requests, filter requests
- Main entity: Maintenance Request
- Important fields: title, description, location, priority, requesterName, status, technicianNote, createdAt, updatedAt, closedAt
- Initial status values before Stage 11: submitted, inProgress, completed, closed
- Main feature: maintenance request submission, progress update and closure workflow
- Secondary feature: filter requests by location, priority or status
- Protected action: add or edit technician notes and close requests
- Validation expectations: title, description, location, priority and requester name are required; priority and status must use valid values
- Security concerns: requesters must not close requests; requesters must not edit technician notes; users must not access actions outside their role; Supabase service keys must not be exposed in frontend code
- Out of scope: asset inventory, photo uploads, contractor management, scheduling, procurement

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
Inspect the current codebase, then create or update the PERN project backbone for Maintenance Request Tracker.

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
- Add package scripts to run frontend and backend.
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
Implement the database model and data access layer for Maintenance Request Tracker.

Main entity:
Maintenance Request

Important fields:
title, description, location, priority, requesterName, status, technicianNote, createdAt, updatedAt, closedAt

Initial status values before Stage 11:
submitted, inProgress, completed, closed

Roles:
Requester, Technician

Supabase PostgreSQL connection information to use:
DATABASE_URL: [SUPABASE_DATABASE_URL]
Database password: [SUPABASE_DATABASE_PASSWORD]

Instructions:
- Use direct PostgreSQL access from the Express backend with pg and DATABASE_URL.
- Do not use Supabase URL/key style configuration for database queries.
- Put DATABASE_URL only in backend .env files. Never expose database credentials in React.
- Create SQL for the Supabase PostgreSQL table or tables needed for the workshop slice.
- Include a database-backed prototype login table, for example app_users, with role and ownership/identity fields for the two roles.
- Include primary keys, required fields, status constraints, timestamps, and ownership/access fields where needed.
- Add backend database configuration using environment variables.
- Add data access functions or service functions for Maintenance Request.
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
Implement the frontend workflow skeleton for Maintenance Request Tracker.

Roles:
- Requester
- Technician

Main workflow:
maintenance request submission, progress update and closure workflow

Secondary feature:
filter requests by location, priority or status

Instructions:
- Create role-aware screens for Requester and Technician.
- Create forms for the important Maintenance Request fields.
- Create list/detail views needed for the workflow.
- Add simple navigation.
- Add loading, empty, success, and error states.
- Add basic client-side checks, but do not rely on frontend checks for security.
- Keep styling simple and readable.
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
Implement the core feature end-to-end for Maintenance Request Tracker.

Core feature:
maintenance request submission, progress update and closure workflow

Main entity:
Maintenance Request

Required stack:
- React frontend
- Express API
- Supabase PostgreSQL

Instructions:
- Implement the case workflow actions for Maintenance Request, including create, read, update, and status/lifecycle actions where appropriate.
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
Add workshop-suitable authentication and backend authorization for Maintenance Request Tracker.

Roles:
- Requester
- Technician

Protected action:
add or edit technician notes and close requests

Instructions:
- Add database-backed prototype login using the users/login table from Stage 3.
- Do not store credentials only in React.
- If a password dependency is reasonable, store seeded demo passwords as hashes.
- Add a backend login endpoint that verifies the user and returns the authenticated user role and identity.
- Store the authenticated user role and identity clearly in the app state.
- Send authenticated user information to the backend in a simple workshop-safe way.
- Enforce protected actions in Express middleware or route handlers.
- Do not rely only on hiding buttons in React.
- Ensure add or edit technician notes and close requests is blocked for the wrong role.
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
Implement the secondary feature for Maintenance Request Tracker.

Secondary feature:
filter requests by location, priority or status

Main entity:
Maintenance Request

Instructions:
- Keep the feature small and directly connected to Maintenance Request.
- Add only the backend route/query changes needed.
- Add only the frontend UI changes needed.
- Ensure the feature respects Requester and Technician permissions.
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
- Whether add or edit technician notes and close requests appears protected.
- Whether users appear limited to their own allowed records where relevant.
- Whether maintenance request submission, progress update and closure workflow appears implemented.
- Whether filter requests by location, priority or status appears implemented.
- Whether validation is present.
- Whether the AI implemented future stages early.
- What is missing before testing, security hardening, and maintainability cleanup.

Save the review in MID_REVIEW.md with:
1. Mid-review summary
2. Current feature status
3. Database and persistence status
4. Login and role/access status
5. Protected action status
6. Validation status
7. Stage drift or early implementation
8. Issues found before Stage 8
9. Manual checks recommended next
10. Pass/fail table
```

### Stage 8: Tests And Manual Verification

```text
Add practical verification for Maintenance Request Tracker.

Instructions:
- Add lightweight automated tests and expose them through a clear command, for example npm test.
- Use clearly labelled test records in the same Supabase database and clean them up after tests.
- Do not rely only on manual checks.
- Cover the main workflow.
- Cover create, view, update, and status/lifecycle actions where implemented.
- Cover required field validation.
- Cover database setup or at least database connectivity.
- Cover database-backed login.
- Cover invalid status or invalid input cases.
- Cover Requester allowed and blocked actions.
- Cover Technician allowed and blocked actions.
- Cover users trying to access records outside their role/identity.
- Cover add or edit technician notes and close requests.
- Cover filter requests by location, priority or status.
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
Review and improve security and validation for Maintenance Request Tracker.

Known security concerns:
requesters must not close requests; requesters must not edit technician notes; users must not access actions outside their role; Supabase service keys must not be exposed in frontend code

Validation expectations:
title, description, location, priority and requester name are required; priority and status must use valid values

Instructions:
- Inspect backend routes and services.
- Ensure required fields are validated on the backend.
- Ensure role checks happen on the backend.
- Ensure the protected action is protected.
- Ensure authenticated identity is used for protected actions, not only a client-supplied role selector.
- Ensure users cannot access records outside their allowed role/identity.
- Ensure fake/in-memory storage is not masking database failures.
- Ensure frontend secrets are not exposed.
- Ensure Supabase service keys are not used in frontend code.
- Ensure API errors do not expose sensitive details.
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
Refactor Maintenance Request Tracker for maintainability without changing behaviour.

Instructions:
- Identify duplicated code.
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
Apply this change request to Maintenance Request Tracker:
high priority requests must show an urgent flag and cannot be closed unless a technician note has been added.

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
Prepare a final evidence-based review for Maintenance Request Tracker.

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

Output:
1. Final feature summary
2. Project structure and run commands
3. Frontend/backend separation check
4. Database setup and table summary
5. Login and role/access explanation
6. Protected action explanation
7. Validation summary
8. Automated and manual testing summary
9. Stage 11 change summary
10. Stage drift or early work
11. Security risks and exposed-secret check
12. Documentation/code mismatches
13. Known limitations
14. Demo script
15. Suggested viva questions
```
## Reusable Quality Recovery Prompt

Use this at any stage when the AI response is incomplete, incorrect, too broad, unsafe, not testable, or not aligned with the selected case.

```text
Revise the previous response for Maintenance Request Tracker.

Keep these constraints:
- React frontend, Express backend, Supabase PostgreSQL database.
- React must call Express API routes.
- Express must handle Supabase access.
- Do not build a Supabase-only React app.
- Keep the scope limited to the selected case.
- Include Requester, Technician, Maintenance Request, maintenance request submission, progress update and closure workflow, filter requests by location, priority or status, and add or edit technician notes and close requests.
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
The previous response is incomplete, incorrect, or not aligned with Maintenance Request Tracker.
```
## Error Prompt

Use this when the app fails.

```text
The app failed with this error:

Context:
This is Maintenance Request Tracker, a PERN app using React, Node.js/Express, and Supabase PostgreSQL.

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