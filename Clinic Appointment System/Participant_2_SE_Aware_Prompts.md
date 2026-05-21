# Participant 2: Clinic Appointment System Prompts

## Instructions

Copy and paste the prompts in order.

Do not expand them into long prompt-engineering instructions.

If the result is incomplete, use the reusable failure prompt.

If the app gives an error, use the error prompt and paste the error message after it.

Do not create instruction `.md` files in the project codebase.

## Copy-Paste Prompts

### Stage 0: Case Scope

```text
Summarize Clinic Appointment System: roles receptionist and doctor, main entity appointment, main feature appointment management, filtering, and out of scope.
```

### Stage 1: Requirements

```text
List requirements for Clinic Appointment System: appointment create/view/update/cancel workflow, roles, validation, login, protected action add/edit visit notes, and basic tests.
```

### Stage 2: PERN Structure

```text
Create PERN project structure: React frontend, Express backend, Supabase PostgreSQL, env setup, routes, pages, and run steps.
```

### Stage 3: Data Model

```text
Design Supabase table for appointment using patientName, patientPhone, doctorName, date, time, reason, status, visitNote, initial status values booked, completed, cancelled, required fields, and role fields.
```

### Stage 4: UI Workflow

```text
Create UI workflow for receptionist and doctor: pages, forms, list, filters, role actions, loading, and errors.
```

### Stage 5: Main Feature

```text
Implement appointment create, view, update and cancel with React pages, Express routes, Supabase queries, validation, and errors.
```

### Stage 6: Authentication And Authorization

```text
Add login and authorization for receptionist and doctor. Protect add/edit visit notes in backend and UI.
```

### Stage 7: Secondary Feature

```text
Add appointment filtering by doctor, date or status. Update API, UI, and filters without adding unrelated features.
```

### Stage 8: Testing

```text
Create basic tests or manual checks for appointment create/view/update/cancel workflow, validation, login, roles, visit notes, and appointment filtering.
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
Apply change request: appointments start as pending, doctors can accept or reject them, and accepted appointments become confirmed. Update data, API, UI, validation, roles, and tests without rewriting the app.
```

### Stage 12: Final Review

```text
Prepare a final review for Clinic Appointment System.

Instructions:
- Inspect the completed project.
- Summarize what was built.
- Explain the main workflow end to end.
- Explain the data model.
- Explain how Receptionist and Doctor are handled.
- Explain how add or edit visit notes is protected.
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
Revise for Clinic Appointment System. Keep PERN, small scope, receptionist, doctor, appointment, validation, role access, visit note protection, filtering, and fix the issue.
```

## Error Prompt

Use this when the app fails. Paste the actual error message after the prompt.

```text
Fix this PERN app error. Keep React, Express, and Supabase. Explain the cause briefly and show the changed files:
```
