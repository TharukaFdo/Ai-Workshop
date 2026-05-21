# Participant 2: Inventory Request System Prompts

## Instructions

Copy and paste the prompts in order.

Do not expand them into long prompt-engineering instructions.

If the result is incomplete, use the reusable failure prompt.

If the app gives an error, use the error prompt and paste the error message.

Do not create instruction `.md` files in the project codebase.

## Copy-Paste Prompts

### Stage 0: Case Scope

```text
Summarize Inventory Request System: roles staff member and storekeeper, main entity inventory request, main feature inventory request submission, approval/rejection and issue workflow, secondary feature filter requests by item name, requester or status, and out of scope.
```

### Stage 1: Requirements

```text
List requirements for Inventory Request System: main workflow inventory request submission, approval/rejection and issue workflow, create/view/update/status actions where appropriate, roles, validation, login, protected action approve or reject requests, mark items issued, and edit storekeeper notes, and basic tests.
```

### Stage 2: PERN Structure

```text
Create PERN project structure: React frontend, Express backend, Supabase PostgreSQL, env setup, routes, pages, and run steps.
```

### Stage 3: Data Model

```text
Design Supabase table for inventory request using itemName, quantity, reason, requestedDate, requesterName, status, storekeeperNote, issuedQuantity, issuedAt, createdAt, updatedAt, initial status values pending, approved, rejected, issued, required fields, and role fields.
```

### Stage 4: UI Workflow

```text
Create UI workflow for staff member and storekeeper: pages, forms, list, filters, role actions, loading, and errors.
```

### Stage 5: Main Feature

```text
Implement inventory request submission, approval/rejection and issue workflow for inventory request with React pages, Express routes, Supabase queries, validation, and errors.
```

### Stage 6: Authentication And Authorization

```text
Add login and authorization for staff member and storekeeper. Protect approve or reject requests, mark items issued, and edit storekeeper notes in backend and UI.
```

### Stage 7: Secondary Feature

```text
Add filter requests by item name, requester or status for inventory request. Update API, UI, and filters without adding unrelated features.
```

### Stage 8: Testing

```text
Create basic tests or manual checks for the main workflow, validation, login, roles, approve or reject requests, mark items issued, and edit storekeeper notes, and filter requests by item name, requester or status.
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
Apply change request: approved requests require an issued quantity before they can be marked issued, and issued quantity cannot exceed requested quantity. Update data, API, UI, validation, roles, and tests without rewriting the app.
```

### Stage 12: Final Review

```text
Prepare a final review for Inventory Request System.

Instructions:
- Inspect the completed project.
- Summarize what was built.
- Explain the main workflow end to end.
- Explain the data model.
- Explain how staff member and storekeeper are handled.
- Explain how this protected action is handled: approve or reject requests, mark items issued, and edit storekeeper notes.
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
Revise for Inventory Request System. Keep PERN, small scope, staff member, storekeeper, inventory request, validation, role access, approve or reject requests, mark items issued, and edit storekeeper notes, filter requests by item name, requester or status, and fix the issue.
```

## Error Prompt

Use this when the app fails.

```text
Fix this PERN app error. Keep React, Express, and Supabase. Explain the cause briefly and show the changed files:
```



