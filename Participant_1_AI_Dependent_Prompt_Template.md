# Participant 1 Prompt Pack Template: AI-Dependent

## Purpose

Use this template to create the case-specific prompt pack for Participant 1.

Participant 1 is derived from the Participant 2 prompt pack by removing software engineering concepts and reducing the wording to short casual requests. This participant depends heavily on AI and lets AI decide many details.

The goal is to see what happens when the participant uses AI to build the same selected case with minimal planning, minimal technical language, and little control over the result.

## Template Preparation Notes

Before giving this prompt pack to a participant, replace these placeholders:

```text
[CASE_SHORT_NAME]
[CASE_TITLE]
[ROLE_1]
[ROLE_2]
[MAIN_ENTITY]
[MAIN_FEATURE]
[SECONDARY_FEATURE]
[PROTECTED_ACTION]
[CHANGE_REQUEST]
[SUPABASE_DATABASE_URL]
[SUPABASE_DATABASE_PASSWORD]
```

Rules for preparing this pack:

- Keep Stages 0 to 11 short and casual.
- Keep Stage 12 as the shared final review prompt for fair comparison.
- Use the shortest useful case name for `[CASE_SHORT_NAME]`.
- Do not add software engineering terms to Stages 0 to 11.
- Do not add detailed project instructions.
- Do not include the full client case paragraph inside the prompts.
- Do not ask for planning documents or instruction `.md` files.
- Keep the database values as placeholders until the facilitator supplies them.
- Adjust grammar and plural forms when replacing placeholders.

## Instructions

Copy and paste the prompts in order.

Do not rewrite the prompts into longer technical prompts.

Use one prompt at a time. If the AI starts doing later stages early, stop it and use the reusable failure prompt.

If the result is wrong or incomplete, use the reusable failure prompt.

If the app gives an error, use the error prompt and paste the error message.

Do not create instruction `.md` files in the project codebase.

## Copy-Paste Prompts

### Stage 0: Start The App

```text
I want to build a [CASE_SHORT_NAME] app. Where should I start? Only explain first steps. Do not create or edit files yet.
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
Make [MAIN_ENTITY] save in Supabase and show again.

Use this Supabase PostgreSQL database information:
DATABASE_URL: [SUPABASE_DATABASE_URL]
Database password: [SUPABASE_DATABASE_PASSWORD]

Put the database connection only in the backend .env file.
Create the needed table or tables and starter records now.
Add a simple command to create the demo tables again if needed.
Do not use fake, browser-only, or in-memory storage.
Only do this database-saving step.
```

### Stage 4: Make The Screens

```text
Make simple screens for [ROLE_1] and [ROLE_2].
```

### Stage 5: Add The Main Work

```text
Add [MAIN_FEATURE].
```

### Stage 6: Add Login

```text
Add login for [ROLE_1] and [ROLE_2].
Save login users in Supabase, not only inside React.
Keep it simple, but make the backend check login and role before protected actions.
Only do this login step.
```

### Stage 7: Add The Extra Part

```text
Add [SECONDARY_FEATURE].
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

### Stage 8: Check The App

```text
Check if the app works and fix broken parts.
Add a simple test command I can run.
The test should check saving to Supabase, login, permissions, the main work, and the extra part.
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
Change the app: [CHANGE_REQUEST]
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
- Explain how tables and starter data are created again if needed.
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

Use this at any stage when the AI output is wrong, too big, incomplete, broken, or not matching the selected case.

```text
This is wrong. Make it match the [CASE_SHORT_NAME] app, keep it simple, and fix it.
Do only the current stage.
Keep React, Express, and Supabase.
Do not use fake/in-memory storage when Supabase is required.
Do not put database secrets in React.
```

## Error Prompt

Use this when the app fails.

```text
Fix this error:
```

