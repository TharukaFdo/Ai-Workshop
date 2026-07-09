# Cross-Participant Case Evaluation Prompt

## Purpose

Use this prompt after all three participants have completed the same case.

Run it from inside the selected case folder, where the case brief, participant prompt packs, and the three generated participant project folders are available.

The prompt creates one shared comparison report for the case. It evaluates Participant 1, Participant 2, and Participant 3 fairly using the same criteria, rather than relying only on each participant project's own `FINAL_REVIEW.md`.

## When To Use

Use this after:

- Participant 1 has completed the project and final review.
- Participant 2 has completed the project and final review.
- Participant 3 has completed the project and final review.
- The facilitator wants one comparative evidence report for the whole case.

## Copy-Paste Prompt

```text
You are evaluating three AI-assisted implementations of the same workshop case.

Run this evaluation from the current case folder.

The current folder should contain:
- Case_Brief.md
- Participant_1_AI_Dependent_Prompts.md
- Participant_2_SE_Aware_Prompts.md
- Participant_3_Engineering_Led_Prompts.md
- One generated project folder for Participant 1
- One generated project folder for Participant 2
- One generated project folder for Participant 3

Your task:
Create one comparison report named CASE_COMPARATIVE_EVALUATION.md in the current case folder.

This is review only.
Do not modify any participant project source code.
Do not modify databases.
Do not run destructive commands.
Do not install packages.
Do not rewrite any existing MID_REVIEW.md or FINAL_REVIEW.md file.
Only create or update CASE_COMPARATIVE_EVALUATION.md.

Important privacy and security rules:
- Do not print real database passwords, JWT secrets, tokens, or full connection settings.
- If an .env file exists, inspect only the variable names and whether secrets are exposed in the wrong place.
- Redact credential values as [REDACTED].
- Do not copy chat history sections that contain credentials.

Step 1: Identify the case and participant folders
- Read Case_Brief.md.
- Read the three participant prompt packs.
- Identify the case title, roles, main entity, main workflow, secondary feature, protected action, change request, and case-specific review rows.
- Find the three participant implementation folders.
- Use folder names, prompt pack names, or nearby evidence to map each folder to:
  - Participant 1: AI-dependent
  - Participant 2: SE-aware
  - Participant 3: Engineering-led
- If there are multiple iterations, use the latest clearly named completed iteration. State which folders you selected.
- Ignore node_modules, dist/build output, lockfile internals, generated assets, and dependency folders unless they reveal a direct issue.

Step 2: Evidence to inspect for each participant
For each participant folder, inspect available evidence:
- Project structure
- README or setup notes
- MID_REVIEW.md, if present
- FINAL_REVIEW.md, if present
- chat history file, if present
- backend package scripts
- frontend package scripts
- backend .env.example
- backend .env variable names only, with values redacted
- database setup or seed scripts
- backend routes, middleware, services, and database configuration
- frontend pages/components and API calls
- automated test files and test scripts
- documentation kept in the codebase

Do not rely only on FINAL_REVIEW.md.
Use FINAL_REVIEW.md as one evidence source, then verify important claims against code and project files where practical.

Step 3: Required stack and architecture checks
For each participant, check whether:
- The project uses React for the frontend.
- The project uses Node.js/Express for the backend.
- The project uses local MySQL for persistence.
- React calls Express API routes.
- React does not connect directly to MySQL.
- MySQL credentials are only used by the backend.
- The backend uses environment variables such as DB_HOST, DB_PORT, DB_USER, DB_PASSWORD, and DB_NAME.
- The backend uses a real database driver such as mysql2/promise.
- The project avoids browser-only, fake, or in-memory storage for required data.
- There is a repeatable database setup or seed command.
- There is a users/login table or equivalent database-backed login mechanism.

Step 4: Case-specific checks
Use the selected case details from Case_Brief.md and the prompt packs.

Create a case-specific checklist for this case, including:
- The two roles and their allowed actions.
- The main entity fields.
- The main workflow.
- The secondary feature.
- The protected action.
- The Stage 11 change request.
- The three case-specific review areas listed in the prompt packs.

Then evaluate each participant against those case-specific requirements.

For example, do not only say "protected action works".
Say whether the specific protected action for this case works, who can perform it, who is blocked, and whether the backend enforces it.

Step 5: Scoring rules
Use the same 0 to 5 scale for all three participants.

Score meaning:
- 0 = missing
- 1 = present but mostly not working
- 2 = partially working with major gaps
- 3 = mostly working with important gaps
- 4 = working with minor gaps
- 5 = complete for the selected case scope and supported by evidence

Do not give a 5 unless the evidence is visible in code, tests, review files, or clear documentation.
Do not reward attractive UI if persistence, backend access control, or validation is weak.
Do not reward claimed tests unless a test file, test command, and result evidence exist.
Penalize security risks even if the UI appears complete.
Penalize projects that implement the wrong stack or bypass the backend.
Penalize role checks that only exist in the frontend.
Penalize credentials stored in source code or exposed in frontend files.

Step 6: Build the comparison matrices
Create one matrix with one row per feature/area and one score column per participant.

Use this exact table structure:

| Feature / Area | P1 Score 0-5 | P2 Score 0-5 | P3 Score 0-5 | Best Participant | Evidence Summary | Key Difference |
|---|---:|---:|---:|---|---|---|
| Project setup and run commands |  |  |  |  |  |  |
| Required stack and architecture |  |  |  |  |  |  |
| Frontend/backend separation |  |  |  |  |  |  |
| Database setup and starter data |  |  |  |  |  |  |
| Login workflow |  |  |  |  |  |  |
| Role-based access |  |  |  |  |  |  |
| Main create action |  |  |  |  |  |  |
| Main view/list action |  |  |  |  |  |  |
| Main update/status/cancel action |  |  |  |  |  |  |
| Protected action |  |  |  |  |  |  |
| Secondary feature |  |  |  |  |  |  |
| Stage 11 change request |  |  |  |  |  |  |
| Case-specific review area 1 |  |  |  |  |  |  |
| Case-specific review area 2 |  |  |  |  |  |  |
| Case-specific review area 3 |  |  |  |  |  |  |
| Validation and error handling |  |  |  |  |  |  |
| Backend security and authorization |  |  |  |  |  |  |
| Credential handling |  |  |  |  |  |  |
| Automated testing evidence |  |  |  |  |  |  |
| Test data cleanup |  |  |  |  |  |  |
| Maintainability and code organization |  |  |  |  |  |  |
| UI/manual usability |  |  |  |  |  |  |
| Documentation and explanation quality |  |  |  |  |  |  |
| Stage discipline and prompt adherence |  |  |  |  |  |  |

Replace "Case-specific review area 1/2/3" with the actual case-specific areas found in the prompt packs.

Step 7: Weighted summary
Create a weighted score summary using these categories:

| Category | Weight | P1 Score 0-5 | P2 Score 0-5 | P3 Score 0-5 | Evidence Notes |
|---|---:|---:|---:|---:|---|
| Functional completeness | 20% |  |  |  |  |
| Data persistence and database setup | 15% |  |  |  |  |
| Authentication and authorization | 15% |  |  |  |  |
| Case-specific correctness | 15% |  |  |  |  |
| Validation and security | 15% |  |  |  |  |
| Testing evidence | 10% |  |  |  |  |
| Maintainability and documentation | 10% |  |  |  |  |

Then calculate an overall weighted score out of 5 for each participant.

If exact calculation is not practical, estimate transparently and explain the estimate.

Step 8: Qualitative comparison
Write a fair comparison under these headings:

1. Overall ranking
2. What Participant 1 did well
3. Where Participant 1 failed or depended too much on AI
4. What Participant 2 improved compared with Participant 1
5. Where Participant 2 still fell short
6. What Participant 3 improved compared with Participant 2
7. Where Participant 3 still had weaknesses
8. Whether P3 is clearly better than P2 and P1, and whether the evidence supports that conclusion
9. Whether P2 is clearly better than P1, and whether the evidence supports that conclusion
10. Any surprising result where the expected order did not hold

Step 9: Evidence-based issue comparison
Create these issue tables:

Critical issues:
| Participant | Issue | Evidence | Impact |
|---|---|---|---|

Major issues:
| Participant | Issue | Evidence | Impact |
|---|---|---|---|

Minor issues:
| Participant | Issue | Evidence | Impact |
|---|---|---|---|

Do not include generic comments.
Each issue must name the participant and evidence.

Step 10: Staff discussion output
Create a facilitator discussion section:

- What this case shows about AI-dependent development.
- What this case shows about using software engineering concepts.
- What this case shows about engineering-led prompting.
- What staff should ask in a viva for this case.
- What evidence students should be asked to submit.
- Which failures would be hard to notice from a UI demo alone.
- Which failures require code/database/test inspection.

Step 11: Final report format
Create CASE_COMPARATIVE_EVALUATION.md with this structure:

# Case Comparative Evaluation

## 1. Case And Folder Mapping
Include selected case, participant folders used, and any assumptions.

## 2. Case-Specific Evaluation Criteria
List roles, main entity, main workflow, secondary feature, protected action, Stage 11 change request, and the three case-specific review areas.

## 3. Evidence Sources Used
List reviewed files for each participant.

## 4. Cross-Participant Score Matrix
Use the matrix from Step 6.

## 5. Weighted Summary
Use the weighted table from Step 7 and give final weighted scores.

## 6. Overall Ranking
Rank P1, P2, and P3. Explain the ranking with evidence.

## 7. Participant-by-Participant Analysis
Discuss each participant separately.

## 8. Case-Specific Feature Comparison
Compare the actual business features of the selected case.

## 9. Security, Authentication, And Authorization Comparison
Compare real backend controls, not only UI controls.

## 10. Testing Evidence Comparison
Compare automated tests, test commands, test results, and cleanup.

## 11. Maintainability And Documentation Comparison
Compare structure, code organization, documentation, and explainability.

## 12. Stage Discipline And Prompt-Adherence Comparison
Compare whether each participant followed the intended workshop stages.

## 13. Critical, Major, And Minor Issues
Use the issue tables from Step 9.

## 14. Staff Discussion Points
Use the facilitator discussion output from Step 10.

## 15. Final Conclusion
State what this case reveals about the three AI-use styles.

Important:
The final report must be evidence-based, balanced, and comparable.
Do not automatically assume Participant 3 is best.
Do not automatically assume Participant 1 is worst.
Rank them according to the actual evidence found in the three implementations.
```
