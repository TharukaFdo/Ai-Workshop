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
```

Rules for preparing this pack:

- Keep Stages 0 to 11 concise.
- Keep Stage 12 as the shared final review prompt for fair comparison.
- Use selected SE terms such as requirements, roles, workflow actions, validation, authentication, authorization, testing, security, and refactor.
- Do not include the full client case paragraph.
- Do not include detailed acceptance criteria.
- Do not ask for detailed tradeoff analysis.
- Do not ask AI to create instruction `.md` files in the codebase.
- Adjust grammar and plural forms when replacing placeholders.

## Instructions

Copy and paste the prompts in order.

Do not expand them into long prompt-engineering instructions.

If the result is incomplete, use the reusable failure prompt.

If the app gives an error, use the error prompt and paste the error message.

Do not create instruction `.md` files in the project codebase.

## Copy-Paste Prompts

### Stage 0: Case Scope

```text
Summarize [CASE_TITLE]: roles [ROLE_1] and [ROLE_2], main entity [MAIN_ENTITY], main feature [MAIN_FEATURE], secondary feature [SECONDARY_FEATURE], and out of scope.
```

### Stage 1: Requirements

```text
List requirements for [CASE_TITLE]: main workflow [MAIN_FEATURE], create/view/update/status actions where appropriate, roles, validation, login, protected action [PROTECTED_ACTION], and basic tests.
```

### Stage 2: PERN Structure

```text
Create PERN project structure: React frontend, Express backend, Supabase PostgreSQL, env setup, routes, pages, and run steps.
```

### Stage 3: Data Model

```text
Design Supabase table for [MAIN_ENTITY] using [IMPORTANT_FIELDS], initial status values [STATUS_VALUES], required fields, and role fields.
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
Add login and authorization for [ROLE_1] and [ROLE_2]. Protect [PROTECTED_ACTION] in backend and UI.
```

### Stage 7: Secondary Feature

```text
Add [SECONDARY_FEATURE] for [MAIN_ENTITY]. Update API, UI, and filters without adding unrelated features.
```

### Stage 8: Testing

```text
Create basic tests or manual checks for the main workflow, validation, login, roles, [PROTECTED_ACTION], and [SECONDARY_FEATURE].
```

### Stage 9: Security And Validation

```text
Review security and validation. Fix required fields, role access, exposed secrets, and bad error handling.
```

### Stage 10: Maintainability

```text
Refactor for maintainability: clear names, smaller files, reusable helpers, no behaviour changes, and setup notes.
```

### Stage 11: Change Request

Use this only when the facilitator reaches Stage 11.

```text
Apply change request: [CHANGE_REQUEST]. Update data, API, UI, validation, roles, and tests without rewriting the app.
```

### Stage 12: Final Review

```text
Prepare a final review for [CASE_TITLE].

Instructions:
- Inspect the completed project.
- Summarize what was built.
- Explain the main workflow end to end.
- Explain the data model.
- Explain how [ROLE_1] and [ROLE_2] are handled.
- Explain how this protected action is handled: [PROTECTED_ACTION].
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

## Reusable Failure Prompt

Use this at any stage when the AI output is incomplete, incorrect, too broad, or not aligned with the selected case.

```text
Revise for [CASE_TITLE]. Keep PERN, small scope, [ROLE_1], [ROLE_2], [MAIN_ENTITY], validation, role access, [PROTECTED_ACTION], [SECONDARY_FEATURE], and fix the issue.
```

## Error Prompt

Use this when the app fails.

```text
Fix this PERN app error. Keep React, Express, and Supabase. Explain the cause briefly and show the changed files:
```

