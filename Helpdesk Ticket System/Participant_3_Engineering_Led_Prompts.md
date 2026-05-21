# Participant 3: Helpdesk Ticket System Prompts

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
Prefer complete working code over pseudocode.
Before changing files, inspect the current structure.
After changing files, list the files changed and how to run or check the result.
```

## Copy-Paste Prompts

### Stage 0: Case Scope, Assumptions, And Working Notes

```text
You are helping build a workshop-limited PERN application.

Selected case:
Helpdesk Ticket System

Client explanation:
We need a simple helpdesk system so users can submit support issues and support agents can respond to them. A user should be able to create a ticket with a title, description, category, and their name, then view their own ticket status. A support agent should be able to view submitted tickets, add a response, update the ticket status, and close the ticket when resolved. It would also help if tickets could be filtered by category, submitted user, or status. Users should not be able to close their own tickets, edit agent responses, or view other users' tickets unless allowed. This should be a small PERN prototype using React, Node.js/Express, and Supabase PostgreSQL, focused on the ticket workflow rather than live chat, attachments, or a knowledge base.

Required stack:
- Frontend: React
- Backend: Node.js with Express
- Database: Supabase PostgreSQL

Roles:
- User
- Support agent

Main entity:
Ticket

Task:
Create or update PROJECT_CONTEXT.md in the project codebase.

Instructions:
- Restate the selected case in your own words.
- Define the exact workshop scope.
- Identify the two roles and their responsibilities.
- Identify Ticket and the main workflow.
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

Create or update REQUIREMENTS.md for Helpdesk Ticket System.

Case details:
- Roles: User, Support agent
- User actions: create tickets, view own ticket status, view agent responses, filter own tickets
- Support agent actions: view submitted tickets, add agent responses, update ticket status, close tickets, filter tickets
- Main entity: Ticket
- Important fields: title, description, category, submittedUser, status, agentResponse, createdAt, updatedAt, closedAt
- Initial status values before Stage 11: open, inProgress, resolved, closed
- Main feature: ticket creation, response, status update and closure workflow
- Secondary feature: filter tickets by category, submitted user or status
- Protected action: add or edit agent responses and close tickets
- Validation expectations: title, description, category and submitted user are required; status must use valid values; closed tickets should have a closed date where appropriate
- Security concerns: users must not close their own tickets; users must not edit agent responses; users must not view other users' tickets unless allowed; Supabase service keys must not be exposed in frontend code
- Out of scope: live chat, file attachments, knowledge base articles, SLA dashboards, email notifications

Instructions:
- Write must-have requirements only.
- Create acceptance criteria for each must-have requirement.
- Create a role-permission matrix.
- Define backend-enforced protected actions.
- Define validation rules.
- Define failure cases.
- Define minimum tests or manual checks.
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
Inspect the current codebase, then create or update the PERN project backbone for Helpdesk Ticket System.

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
- Do not implement all business features yet.
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
Implement the database model and data access layer for Helpdesk Ticket System.

Main entity:
Ticket

Important fields:
title, description, category, submittedUser, status, agentResponse, createdAt, updatedAt, closedAt

Initial status values before Stage 11:
open, inProgress, resolved, closed

Roles:
User, Support agent

Instructions:
- Create SQL for the Supabase PostgreSQL table or tables needed for the workshop slice.
- Include primary keys, required fields, status constraints, timestamps, and ownership/access fields where needed.
- Add backend Supabase client configuration using environment variables.
- Add data access functions or service functions for Ticket.
- Keep the data model minimal but complete for ticket creation, response, status update and closure workflow and filter tickets by category, submitted user or status.
- Do not add unrelated entities.
- Add example seed data if useful.
- Update README.md or docs with database setup steps.
- After editing, list all files created or changed.

Output:
1. SQL schema
2. Supabase configuration
3. Data access/service code
4. Example data if useful
5. Setup instructions
6. Risks or assumptions
```

### Stage 4: UI Workflow And Frontend Skeleton

```text
Implement the frontend workflow skeleton for Helpdesk Ticket System.

Roles:
- User
- Support agent

Main workflow:
ticket creation, response, status update and closure workflow

Secondary feature:
filter tickets by category, submitted user or status

Instructions:
- Create role-aware screens for User and Support agent.
- Create forms for the important Ticket fields.
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
Implement the core feature end-to-end for Helpdesk Ticket System.

Core feature:
ticket creation, response, status update and closure workflow

Main entity:
Ticket

Required stack:
- React frontend
- Express API
- Supabase PostgreSQL

Instructions:
- Implement the case workflow actions for Ticket, including create, read, update, and status/lifecycle actions where appropriate.
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
Add workshop-suitable authentication and backend authorization for Helpdesk Ticket System.

Roles:
- User
- Support agent

Protected action:
add or edit agent responses and close tickets

Instructions:
- Add a simple login or role-selection approach suitable for the workshop.
- Store the current user role clearly in the app state.
- Send role/user information to the backend in a simple workshop-safe way.
- Enforce protected actions in Express middleware or route handlers.
- Do not rely only on hiding buttons in React.
- Ensure add or edit agent responses and close tickets is blocked for the wrong role.
- Ensure users cannot modify data they should not modify.
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
Implement the secondary feature for Helpdesk Ticket System.

Secondary feature:
filter tickets by category, submitted user or status

Main entity:
Ticket

Instructions:
- Keep the feature small and directly connected to Ticket.
- Add only the backend route/query changes needed.
- Add only the frontend UI changes needed.
- Ensure the feature respects User and Support agent permissions.
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

### Stage 8: Tests And Manual Verification

```text
Add practical verification for Helpdesk Ticket System.

Instructions:
- Add lightweight automated tests if the project setup supports it.
- If automated tests are not practical, create docs/TEST_PLAN.md with manual checks.
- Cover the main workflow.
- Cover create, view, update, and status/lifecycle actions where implemented.
- Cover required field validation.
- Cover invalid status or invalid input cases.
- Cover User allowed and blocked actions.
- Cover Support agent allowed and blocked actions.
- Cover add or edit agent responses and close tickets.
- Cover filter tickets by category, submitted user or status.
- Include expected results and actual result placeholders.
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
Review and improve security and validation for Helpdesk Ticket System.

Known security concerns:
users must not close their own tickets; users must not edit agent responses; users must not view other users' tickets unless allowed; Supabase service keys must not be exposed in frontend code

Validation expectations:
title, description, category and submitted user are required; status must use valid values; closed tickets should have a closed date where appropriate

Instructions:
- Inspect backend routes and services.
- Ensure required fields are validated on the backend.
- Ensure role checks happen on the backend.
- Ensure add or edit agent responses and close tickets is protected.
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
Refactor Helpdesk Ticket System for maintainability without changing behaviour.

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
Apply this change request to Helpdesk Ticket System:
users can reopen a closed ticket once, and support agents can respond and close the reopened ticket again.

Instructions:
- Do not start coding immediately.
- First perform a short impact analysis.
- Identify affected data fields, database schema, Express routes, service functions, React screens, validation rules, role rules, and tests.
- Apply the smallest safe change.
- Do not rewrite the whole app.
- Keep the project within the selected case scope.
- Update tests or docs/TEST_PLAN.md.
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
Prepare a final review for Helpdesk Ticket System.

Instructions:
- Inspect the completed project.
- Summarize what was built.
- Explain the main workflow end to end.
- Explain the data model.
- Explain how User and Support agent are handled.
- Explain how this protected action is handled: add or edit agent responses and close tickets.
- Explain the validation rules.
- Explain the security checks and remaining risks.
- Explain the tests or manual checks completed.
- Explain what changed after Stage 11.
- Identify known limitations.
- Create a short demo script.
- Create viva questions a supervisor could ask.

Output:
1. Final feature summary
2. Demo script
3. Data model explanation
4. Role/access explanation
5. Testing summary
6. Security summary
7. Stage 11 change summary
8. Known limitations
9. Suggested viva questions
```

## Reusable Quality Recovery Prompt

Use this at any stage when the AI response is incomplete, incorrect, too broad, unsafe, not testable, or not aligned with the selected case.

```text
Revise the previous response for Helpdesk Ticket System.

Keep these constraints:
- React frontend, Express backend, Supabase PostgreSQL database.
- React must call Express API routes.
- Express must handle Supabase access.
- Do not build a Supabase-only React app.
- Keep the scope limited to the selected case.
- Include User, Support agent, Ticket, ticket creation, response, status update and closure workflow, filter tickets by category, submitted user or status, and add or edit agent responses and close tickets.
- Enforce role access in the backend, not only the UI.
- Include backend validation for required fields and status values.
- Avoid pseudocode.
- List exact files to create or change.
- Include how to verify the result.

Issue to fix:
The previous response is incomplete, incorrect, or not aligned with Helpdesk Ticket System.
```

## Error Prompt

Use this when the app fails.

```text
The app failed with this error:

Context:
This is Helpdesk Ticket System, a PERN app using React, Node.js/Express, and Supabase PostgreSQL.

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



