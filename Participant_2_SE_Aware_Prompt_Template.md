# Participant 2 Prompt Pack Template: SE-Aware

## Purpose

Use this template to create the case-specific prompt pack for Participant 2.

Participant 2 is derived from the Participant 3 master prompt pack, but with reduced detail. This participant uses software engineering terms, but does not give AI long context, detailed reasoning instructions, or comprehensive prompt-engineering controls.

The goal is to see whether short SE-aware prompts produce a better project than AI-dependent prompting, and where they still fall short compared with engineering-led prompting.

## Template Preparation Notes

Before giving this prompt pack to a participant, replace these placeholders:

```text
[CASE_TITLE]
[ROLE_1]
[ROLE_2]
[MAIN_ENTITY]
[IMPORTANT_FIELDS]
[STATUS_VALUES]
[MAIN_FEATURE]
[SECONDARY_FEATURE]
[PROTECTED_ACTION]
[CHANGE_REQUEST]
[SUPABASE_DATABASE_URL]
[SUPABASE_DATABASE_PASSWORD]
```

Rules for preparing this pack:

- Keep Stages 0 to 11 concise.
- Keep Stage 12 as the shared final review prompt for fair comparison.
- Use selected SE terms such as requirements, roles, workflow actions, validation, authentication, authorization, testing, security, and refactor.
- Do not include the full client case paragraph.
- Do not include detailed acceptance criteria.
- Do not ask for detailed tradeoff analysis.
- Do not ask AI to create instruction `.md` files in the codebase.
- Keep the database values as placeholders until the facilitator supplies them.
- Adjust grammar and plural forms when replacing placeholders.

## Instructions

Copy and paste the prompts in order.

Do not expand them into long prompt-engineering instructions.

Use one stage at a time. If the AI implements future-stage features early, use the reusable failure prompt.

If the result is incomplete, use the reusable failure prompt.

If the app gives an error, use the error prompt and paste the error message.

Do not create instruction `.md` files in the project codebase.

## Copy-Paste Prompts

### Stage 0: Case Scope

```text
Summarize [CASE_TITLE]: roles [ROLE_1] and [ROLE_2], main entity [MAIN_ENTITY], main feature [MAIN_FEATURE], secondary feature [SECONDARY_FEATURE], and out of scope. Do not create project files yet.
```

### Stage 1: Requirements

```text
List requirements for [CASE_TITLE]: main workflow [MAIN_FEATURE], create/view/update/status actions where appropriate, roles, validation, database-backed login, protected action [PROTECTED_ACTION], and basic automated tests. Do not create application code yet.
```

### Stage 2: PERN Structure

```text
Create PERN project structure: React frontend, Express backend, Supabase PostgreSQL, env setup, routes, pages, and run steps. Scaffold only. Do not implement the full business workflow yet.
```

### Stage 3: Data Model

```text
Design Supabase table for [MAIN_ENTITY] using [IMPORTANT_FIELDS], initial status values [STATUS_VALUES], required fields, and role fields.

Use this Supabase PostgreSQL database information:
DATABASE_URL: [SUPABASE_DATABASE_URL]
Database password: [SUPABASE_DATABASE_PASSWORD]

Requirements:
- Use the Express backend with `pg` and DATABASE_URL for database access.
- Do not use Supabase URL/key style configuration for database queries.
- Put secrets only in backend `.env`; never expose them in React.
- Create a repeatable database setup script, for example `npm run db:setup`.
- Create safe seed data for the workshop.
- Create a login/users table for [ROLE_1] and [ROLE_2].
- Do not rely on hard-coded frontend-only accounts.
- Use clearly labelled test records in the same Supabase database and clean them up after tests.
- Do not drop existing tables unless the command is clearly named as a demo reset command.
- Do not implement UI features in this stage.
```

### Stage 4: UI Workflow

```text
Create UI workflow for [ROLE_1] and [ROLE_2]: pages, forms, list, filters, role actions, loading, and errors.
```

### Stage 5: Main Feature

```text
Implement [MAIN_FEATURE] for [MAIN_ENTITY] with React pages, Express routes, Supabase queries, validation, and errors.
```

### Stage 6: Authentication And Authorization

```text
Add database-backed login and authorization for [ROLE_1] and [ROLE_2]. Use the users/login table from Stage 3. Protect [PROTECTED_ACTION] in backend and UI. Do not use hard-coded frontend-only accounts.
```

### Stage 7: Secondary Feature

```text
Add [SECONDARY_FEATURE] for [MAIN_ENTITY]. Update API, UI, and filters without adding unrelated features.
```

### Mid Review Stage

Use this after Stage 7 and before Stage 8. This is the same review prompt used by all three participant types for fair comparison.

```text
Conduct a mid-project review for [CASE_TITLE].

This is review only.
Do not modify application source code.
Do not modify database schema or seed data.
Do not install packages.
Do not create tests.
Do not fix issues.
Only create or update MID_REVIEW.md.

Case details:
- Roles: [ROLE_1], [ROLE_2]
- Main entity: [MAIN_ENTITY]
- Main workflow: [MAIN_FEATURE]
- Secondary feature: [SECONDARY_FEATURE]
- Protected action: [PROTECTED_ACTION]

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
- Whether [PROTECTED_ACTION] appears protected.
- Whether users appear limited to their own allowed records where relevant.
- Whether [MAIN_FEATURE] appears implemented.
- Whether [SECONDARY_FEATURE] appears implemented.
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

### Stage 8: Testing

```text
Create automated backend tests and a test command for the main workflow, validation, database-backed login, roles, [PROTECTED_ACTION], and [SECONDARY_FEATURE]. Use clearly labelled test records in the same Supabase database and clean them up after tests. Add manual checks only as a supplement.
```

### Stage 9: Security And Validation

```text
Review security and validation. Fix required fields, backend role access, users accessing records outside their role, exposed secrets, fake/in-memory storage, and bad error handling.
```

### Stage 10: Maintainability

```text
Refactor for maintainability: clear names, smaller files, reusable helpers, no behaviour changes, and setup notes.
```

### Stage 11: Change Request

Use this only when the facilitator reaches Stage 11.

```text
Apply change request: [CHANGE_REQUEST]. Update data, database setup scripts, API, UI, validation, roles, and automated tests without rewriting the app.
```

### Stage 12: Final Review

```text
Prepare a final evidence-based review for [CASE_TITLE].

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
- Explain how [ROLE_1] and [ROLE_2] login works.
- Explain how this protected action is handled: [PROTECTED_ACTION].
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

## Reusable Failure Prompt

Use this at any stage when the AI output is incomplete, incorrect, too broad, or not aligned with the selected case.

```text
Revise for [CASE_TITLE]. Keep PERN, small scope, [ROLE_1], [ROLE_2], [MAIN_ENTITY], validation, backend role access, database-backed login, [PROTECTED_ACTION], [SECONDARY_FEATURE], automated checks, and fix the issue. Do only the current stage.
```

## Error Prompt

Use this when the app fails.

```text
Fix this PERN app error. Keep React, Express, and Supabase. Explain the cause briefly and show the changed files:
```

