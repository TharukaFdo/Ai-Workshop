# AI-Assisted SDP Workshop: Key Points Summary

## 1. Workshop Purpose

This is a one-day staff development workshop for academic staff involved in SDP supervision, assessment, moderation, and academic quality decisions.

The workshop helps staff understand how AI-assisted development behaves under three different usage patterns:

1. AI-dependent development without software engineering understanding.
2. AI-assisted development with limited software engineering concepts.
3. Engineering-led AI-assisted development with software engineering and prompt engineering skills.

The aim is not to stop AI use. The aim is to understand where AI-generated projects fail, what evidence staff should look for, and how SDP assessment can be improved.

## 2. Core Workshop Setup

Each group selects one predefined case from the facilitator's case bank.

Each group has three participants:

| Participant | AI-use style | Main rule |
|---|---|---|
| Participant 1 | AI-dependent | Copy-pastes short casual prompts |
| Participant 2 | SE-aware | Copy-pastes short software-engineering prompts |
| Participant 3 | Engineering-led | Copy-pastes comprehensive prompt-engineering prompts |

All three participants build the same selected case separately.

The comparison is based on the development process, not only the final application.

## 3. Required Technology And Accounts

All implementations must use the same stack:

```text
Stack: React, Express, Node.js, and MySQL
Frontend: React
Backend: Node.js with Express
Database: Local MySQL
```

MySQL is used as the locally running database. The Express backend remains the API layer between React and the database.

Required before the workshop:

- Antigravity IDE installed and ready to use.
- Antigravity IDE AI chat/agent access.
- Node.js and npm.
- Local MySQL server access.
- MySQL host, port, user, password, and database name for each participant or group.
- Clear test-data cleanup rule for automated tests using the same local MySQL database.
- Ability to run a local React and Node.js/Express project.

Participants should not switch to another stack during the workshop.

Distribution note: participant handouts should include only the case brief, assigned prompt pack, templates, and workshop summary. Do not distribute generated project output folders, `.env` files, node_modules folders, or chat histories that contain supplied database credentials.

## 4. Project Requirements

Each project must be reduced to a small vertical slice.

Minimum project scope:

- One main entity.
- One main feature or lifecycle workflow.
- Two user roles.
- Login or user access.
- Database-backed prototype users/login table.
- One protected action.
- One secondary feature.
- Input validation.
- local MySQL storage.
- Repeatable database setup or seed script.
- Basic automated testing where practical.
- Security review.
- Maintainability improvement.
- One late change request.

The predefined case must be small enough to complete in one day. If time is limited, reduce feature completeness rather than skipping testing, security, maintainability, or the change request.

## 5. Participant Rules

### Participant 1: AI-Dependent

- Receives the selected case and Participant 1 prompt pack.
- Copy-pastes short casual prompts in order.
- Uses short casual development prompts.
- Does not use software engineering terms in the development prompts.
- Does not create or keep instruction documents in the project codebase.
- Facilitator observes checkpoints but does not coach software engineering behaviour.

### Participant 2: SE-Aware

- Receives the selected case and Participant 2 prompt pack.
- Copy-pastes short prompts with selected software engineering terms.
- Uses concise software-engineering development prompts.
- Does not use long prompt-engineering templates.
- Does not create or keep instruction documents in the project codebase.

### Participant 3: Engineering-Led

- Receives the selected case and Participant 3 prompt pack.
- Copy-pastes comprehensive prompt templates.
- Considers assumptions, risks, design decisions, tests, security issues, and rejected AI outputs.
- Reviews AI output before using it.
- May keep instruction `.md` documents in the project codebase.

This documentation rule is intentional. It helps compare whether persistent instruction documents improve AI-assisted development quality.

## 6. Workshop Flow

The workshop follows these stages. At each stage, participants copy and paste only the next prompt from their assigned prompt pack.

The Mid Review Stage is a review-only AI prompt used after Stage 7 and before Stage 8. It saves `MID_REVIEW.md` and must not change source code, database schema, seed data, package files, or configuration.

The Mid Review must include the shared review scoring matrix. The same matrix structure is used again in the Final Review so staff can compare the project before and after testing, security hardening, maintainability cleanup, and the change request.

Each major feature or area is scored from 0 to 5 for functionality, data persistence, backend role/security control, validation/error handling, testing evidence, maintainability, and UI/manual usability. Each case also includes case-specific review rows for its own business features, such as approval workflows, protected notes, attendance marking, borrowing/returning, filtering, or ownership rules. This allows staff to compare the three outputs without reading the full codebase first.

Stage 11 should only be pasted when the facilitator reaches the change request checkpoint.

Stage 12 uses the same final review prompt across all three participants so the outputs are directly comparable. It saves `FINAL_REVIEW.md` and must not change the application. The final review must use the same scoring matrix rows, columns, and 0 to 5 scale as the Mid Review.

| Stage | Focus |
|---|---|
| 0 | Case selection and setup |
| 1 | Initial project interpretation |
| 2 | System design and architecture backbone |
| 3 | Data and domain modeling, MySQL connection setup, seed data, and test-data cleanup |
| 4 | UI and workflow design |
| 5 | Core feature implementation |
| 6 | Authentication and authorization |
| 7 | Secondary feature or workflow |
| Mid Review Stage | Review-only raw project audit before testing, security, and maintainability |
| 8 | Testing and verification |
| 9 | Security and validation improvement |
| 10 | Maintainability and refactoring |
| 11 | Change request challenge |
| 12 | Final review and explanation |

All participants move through the same checkpoints. The prompt pack quality differs by participant role.

## 7. Comparison Method

The comparison should focus on how each AI-use pattern performs.

Kept the same:

- Same selected case.
- Same React/Express/Node/MySQL stack.
- Same timebox.
- Same checkpoints.
- Same final change request.

Intentionally different:

- Participant 1 uses the AI-dependent prompt pack.
- Participant 2 uses the SE-aware prompt pack.
- Participant 3 uses the engineering-led prompt pack and may keep instruction `.md` documents in the codebase.

The final discussion should compare:

- The mid and final scoring matrices.
- What looked complete but failed under review.
- Which version had real authentication and authorization.
- Which version handled testing and security better.
- Which version was easiest to change.
- Which participant could explain the code.
- What this reveals about SDP assessment and viva questions.

## 8. Expected Staff Outcomes

By the end of the workshop, staff should be able to:

- Identify signs of AI dependency in student projects.
- Distinguish generated code from engineered software.
- Evaluate testing, security, maintainability, and explanation quality.
- Ask stronger viva and demo questions.
- Decide what AI-use evidence students should submit.
- Improve SDP assessment criteria for AI-assisted development.
