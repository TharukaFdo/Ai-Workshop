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
Stack: PERN
Frontend: React
Backend: Node.js with Express
Database: PostgreSQL using Supabase
```

Supabase is used as the managed PostgreSQL database. The Express backend remains the API layer between React and the database.

Required before the workshop:

- VS Code.
- GitHub Copilot access.
- Node.js and npm.
- Supabase account.
- Ability to run a local React and Node.js/Express project.

Participants should not switch to another stack during the workshop.

## 4. Project Requirements

Each project must be reduced to a small vertical slice.

Minimum project scope:

- One main entity.
- One main feature or lifecycle workflow.
- Two user roles.
- Login or user access.
- One protected action.
- One secondary feature.
- Input validation.
- Supabase PostgreSQL storage.
- Basic testing.
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

Stage 11 should only be pasted when the facilitator reaches the change request checkpoint.

Stage 12 uses the same final review prompt across all three participants so the outputs are directly comparable.

| Stage | Focus |
|---|---|
| 0 | Case selection and setup |
| 1 | Initial project interpretation |
| 2 | System design and architecture backbone |
| 3 | Data and domain modeling |
| 4 | UI and workflow design |
| 5 | Core feature implementation |
| 6 | Authentication and authorization |
| 7 | Secondary feature or workflow |
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
- Same PERN/Supabase stack.
- Same timebox.
- Same checkpoints.
- Same final change request.

Intentionally different:

- Participant 1 uses the AI-dependent prompt pack.
- Participant 2 uses the SE-aware prompt pack.
- Participant 3 uses the engineering-led prompt pack and may keep instruction `.md` documents in the codebase.

The final discussion should compare:

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
