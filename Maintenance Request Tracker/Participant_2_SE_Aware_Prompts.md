# Participant 2: Maintenance Request Tracker Prompts

## Instructions

Copy and paste the prompts in order.

Do not expand them into long prompt-engineering instructions.

If the result is incomplete, use the reusable failure prompt.

If the app gives an error, use the error prompt and paste the error message.

Do not create instruction `.md` files in the project codebase.

## Copy-Paste Prompts

### Stage 0: Case Scope

```text
Summarize Maintenance Request Tracker: roles requester and technician, main entity maintenance request, main feature maintenance request submission, progress update and closure workflow, secondary feature filter requests by location, priority or status, and out of scope.
```

### Stage 1: Requirements

```text
List requirements for Maintenance Request Tracker: main workflow maintenance request submission, progress update and closure workflow, create/view/update/status actions where appropriate, roles, validation, login, protected action add or edit technician notes and close requests, and basic tests.
```

### Stage 2: PERN Structure

```text
Create PERN project structure: React frontend, Express backend, Supabase PostgreSQL, env setup, routes, pages, and run steps.
```

### Stage 3: Data Model

```text
Design Supabase table for maintenance request using title, description, location, priority, requesterName, status, technicianNote, createdAt, updatedAt, closedAt, initial status values submitted, inProgress, completed, closed, required fields, and role fields.
```

### Stage 4: UI Workflow

```text
Create UI workflow for requester and technician: pages, forms, list, filters, role actions, loading, and errors.
```

### Stage 5: Main Feature

```text
Implement maintenance request submission, progress update and closure workflow for maintenance request with React pages, Express routes, Supabase queries, validation, and errors.
```

### Stage 6: Authentication And Authorization

```text
Add login and authorization for requester and technician. Protect add or edit technician notes and close requests in backend and UI.
```

### Stage 7: Secondary Feature

```text
Add filter requests by location, priority or status for maintenance request. Update API, UI, and filters without adding unrelated features.
```

### Stage 8: Testing

```text
Create basic tests or manual checks for the main workflow, validation, login, roles, add or edit technician notes and close requests, and filter requests by location, priority or status.
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
Apply change request: high priority requests must show an urgent flag and cannot be closed unless a technician note has been added. Update data, API, UI, validation, roles, and tests without rewriting the app.
```

### Stage 12: Final Review

```text
Prepare a final review for Maintenance Request Tracker.

Instructions:
- Inspect the completed project.
- Summarize what was built.
- Explain the main workflow end to end.
- Explain the data model.
- Explain how requester and technician are handled.
- Explain how this protected action is handled: add or edit technician notes and close requests.
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
Revise for Maintenance Request Tracker. Keep PERN, small scope, requester, technician, maintenance request, validation, role access, add or edit technician notes and close requests, filter requests by location, priority or status, and fix the issue.
```

## Error Prompt

Use this when the app fails.

```text
Fix this PERN app error. Keep React, Express, and Supabase. Explain the cause briefly and show the changed files:
```



