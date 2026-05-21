# Participant 2: Library Lending System Prompts

## Instructions

Copy and paste the prompts in order.

Do not expand them into long prompt-engineering instructions.

If the result is incomplete, use the reusable failure prompt.

If the app gives an error, use the error prompt and paste the error message.

Do not create instruction `.md` files in the project codebase.

## Copy-Paste Prompts

### Stage 0: Case Scope

```text
Summarize Library Lending System: roles librarian and member, main entity book, main feature book record management and borrow/return workflow, secondary feature search or filter books by title, category or availability, and out of scope.
```

### Stage 1: Requirements

```text
List requirements for Library Lending System: main workflow book record management and borrow/return workflow, create/view/update/status actions where appropriate, roles, validation, login, protected action add, edit or remove book records, and basic tests.
```

### Stage 2: PERN Structure

```text
Create PERN project structure: React frontend, Express backend, Supabase PostgreSQL, env setup, routes, pages, and run steps.
```

### Stage 3: Data Model

```text
Design Supabase table for book using title, author, isbn, category, availabilityStatus, borrowedMember, borrowedDate, returnDate, createdAt, updatedAt, initial status values available, borrowed, unavailable, required fields, and role fields.
```

### Stage 4: UI Workflow

```text
Create UI workflow for librarian and member: pages, forms, list, filters, role actions, loading, and errors.
```

### Stage 5: Main Feature

```text
Implement book record management and borrow/return workflow for book with React pages, Express routes, Supabase queries, validation, and errors.
```

### Stage 6: Authentication And Authorization

```text
Add login and authorization for librarian and member. Protect add, edit or remove book records in backend and UI.
```

### Stage 7: Secondary Feature

```text
Add search or filter books by title, category or availability for book. Update API, UI, and filters without adding unrelated features.
```

### Stage 8: Testing

```text
Create basic tests or manual checks for the main workflow, validation, login, roles, add, edit or remove book records, and search or filter books by title, category or availability.
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
Apply change request: members can reserve borrowed books, and librarians can mark reservations as fulfilled or cancelled. Update data, API, UI, validation, roles, and tests without rewriting the app.
```

### Stage 12: Final Review

```text
Prepare a final review for Library Lending System.

Instructions:
- Inspect the completed project.
- Summarize what was built.
- Explain the main workflow end to end.
- Explain the data model.
- Explain how librarian and member are handled.
- Explain how this protected action is handled: add, edit or remove book records.
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
Revise for Library Lending System. Keep PERN, small scope, librarian, member, book, validation, role access, add, edit or remove book records, search or filter books by title, category or availability, and fix the issue.
```

## Error Prompt

Use this when the app fails.

```text
Fix this PERN app error. Keep React, Express, and Supabase. Explain the cause briefly and show the changed files:
```



