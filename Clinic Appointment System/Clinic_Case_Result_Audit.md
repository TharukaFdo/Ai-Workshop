# Clinic Appointment System Result Audit

This audit reviews the three generated Clinic Appointment System outputs against their chat histories and source code.

No prompt changes have been applied yet. This document records the issues observed before updating the workshop flow.

## Evidence Reviewed

- `ai teaching p1 case 1/chat history.md`
- `ai teaching p2 case 1/chat history.md`
- `ai teaching p3 case 1/chat history.md`
- Backend and frontend source code for all three outputs
- Database schema/configuration files where present
- Test files or test plans where present

Verification performed:

- P1 frontend build: passed
- P2 frontend build: passed
- P3 frontend build: passed
- P1/P2/P3 backend syntax checks: passed

Build output folders were removed after verification to avoid leaving generated artifacts.

## Participant 1: AI Dependent Output

Overall result: The project became a usable prototype, but it did not follow the intended staged learning flow.

Confirmed observations:

- The first prompt caused the AI to plan, scaffold, install dependencies, create backend/frontend code, and start servers before later stages were reached.
- The final project is separated into `client/` and `server/`, so frontend/backend separation exists in the final result.
- Supabase persistence was only properly configured after the Stage 3 style prompt where the connection string/password was supplied.
- Before Supabase was configured, the backend used an in-memory fallback. This makes the app appear to work even when the real database is not working.
- The database uses one `appointments` table only.
- `server/schema.sql` drops and recreates the appointments table, which is risky if reused on non-demo data.
- Login is hard-coded in the React frontend with usernames/passwords such as receptionist/doctor demo accounts.
- The backend trusts the `X-User-Role` header. There is no real user table, password verification, token, or session.
- Doctor identity is mostly controlled by frontend filtering. The backend does not strongly prove that a doctor is only acting on their own appointments.
- Testing was mostly manual/API checking. There is no automated test suite or `npm test` workflow.

Key risks:

- The in-memory fallback can hide Supabase failures.
- The project can be marked "working" even when the database schema or connection is broken.
- Hard-coded login and trusted role headers are acceptable only as a clearly labelled workshop simplification.
- No user table means authentication cannot be meaningfully assessed.
- The app moved into future stages immediately, which weakens comparison with the staged approaches.

## Participant 2: SE Aware Output

Overall result: This is the strongest implementation from a functionality and testing perspective, but it still drifted beyond the intended stage boundaries.

Confirmed observations:

- The final project is separated into `frontend/` and `backend/`.
- Stage 2 created a large amount of working backend/frontend code before later implementation stages.
- The backend uses `DATABASE_URL` with `pg`.
- The backend creates the `appointments` table automatically on server startup if it does not exist.
- The database still uses one `appointments` table only.
- There is no user table or doctor table.
- Login is a mock frontend login using fixed demo accounts.
- Backend authorization is based on a trusted `X-User-Role` header.
- Automated integration tests exist in `backend/tests/integration.js`.
- The automated tests require a live backend and live database; they are not exposed through `npm test`.
- Test seeding writes to the same configured database, so cleanup/isolation must be explicit.
- Validation, double-booking prevention, and status transition checks are stronger than P1 and P3.

Key risks:

- The implementation still uses mock authentication, not database-backed login.
- Doctor identity is not strongly enforced by the backend. A doctor role header can act as "doctor" without proving which doctor they are.
- The `GET /api/appointments` endpoint is not protected by role middleware.
- The server creates a table but does not provide a proper migration system.
- Tests are automated, but the workshop should not treat them as clean test isolation because they depend on live services and live data.

## Participant 3: Engineering-Led Output

Overall result: This output followed the documentation-first flow better than P1 and P2, but the final implementation is less complete.

Confirmed observations:

- Stage 0 and Stage 1 behaved as intended by creating `PROJECT_CONTEXT.md` and `REQUIREMENTS.md` before application code.
- The final project is separated into `frontend/` and `backend/`.
- The project includes `docs/schema.sql` and `docs/TEST_PLAN.md`.
- The backend uses `DATABASE_URL` with `pg` in the final code.
- Earlier in the chat history, the AI used or asked for Supabase URL/key style configuration before the user corrected it to use the database connection string.
- There is no persistent migration/init script in the final project. Table creation happened through one-off commands in the chat history.
- `README.md` still instructs users to run SQL manually in Supabase.
- `REQUIREMENTS.md` still references the earlier statuses `booked`, `completed`, and `cancelled`, while the final schema/code uses `pending`, `accepted`, `rejected`, `completed`, and `cancelled`.
- There is no real login screen. The UI uses a role selector/simulation.
- There is no user table and no database-backed authentication.
- Backend authorization is based on the `x-user-role` header only.
- Testing is manual only through `docs/TEST_PLAN.md`; no automated test suite exists.

Key risks:

- The generated documentation and final code are inconsistent.
- The database can fail unless tables are manually created or recreated from the chat-history commands.
- The final result does not include the login expected by the workshop flow.
- Doctor identity is not enforced by backend authentication or a user table.
- The output looks disciplined because of the documents, but the executable system still needs stronger verification.

## User-Reported Issues Checked

| Issue | Audit Result |
| --- | --- |
| Supabase connection string not used unless given in Stage 3 | Confirmed. P1 and P2 only became live DB-backed after the database prompt. P3 initially drifted toward Supabase key-style setup before being corrected. |
| Future stages done before reaching them | Confirmed for P1. Partially confirmed for P2. P3 was better early, but still required later corrective commands. |
| Frontend/backend not separated | Not confirmed in final outputs. All three final outputs have separate frontend and backend folders, though P1 reached this too early. |
| DB not working because table does not exist | Confirmed as a real risk. P1 masks this with fallback, P2 creates one table at startup, P3 needed manual/one-off migration commands. |
| Tests are not automated | Confirmed for P1 and P3. P2 has automated integration tests, but they are not isolated or wired as `npm test`. |
| No login for third participant | Confirmed. P3 uses role simulation, not a login flow. |
| Test data cleanup at Stage 3/8 | Missing across all outputs. They use the configured Supabase database but do not consistently isolate and clean test records. |
| All data in one table | Confirmed for all three outputs. This is acceptable for a minimal appointment prototype, but not enough for real login/users. |
| No user table for login | Confirmed for all three outputs. |

## Additional Issues Found

1. Real Supabase credentials appear in chat histories and `.env` files. These outputs should not be shared externally until secrets are removed or rotated.
2. Authentication is consistently simulated. None of the three outputs implements a database-backed user table, password handling, sessions, JWTs, or Supabase Auth.
3. Backend role enforcement is incomplete for "doctor can only access own appointments." The UI filters by doctor, but the backend generally trusts user-supplied role/query information.
4. The workshop prompts allow the AI to claim success without requiring evidence of database table existence, migration execution, test execution, and role-boundary verification.
5. Stage 3 needs stronger database setup wording. It should require the actual PostgreSQL connection string, a repeatable schema creation path, seed data, and a database connection check.
6. Stage 8 needs stronger automated test wording. "Manual checks if practical" leads to weak outputs. The workshop should require at least lightweight backend integration tests where possible.
7. Stage 12 needs a more comprehensive final report. The current prompt allows a high-level summary without forcing the AI to disclose gaps, failed checks, manual fixes, or documentation/code drift.
8. P3 shows that having more documentation does not automatically produce a working, verified project. The final report must compare documents against source code.
9. P1 shows that AI-dependent prompting can produce something visually complete while skipping the intended learning process.
10. P2 shows that SE-aware prompts improve structure and testing, but still need guardrails to prevent stage jumping and weak authentication.

## Stage 12 Prompt Should Be Updated To Require

The final review prompt should require a comprehensive report with:

1. Full project structure produced.
2. Confirmation that React and Express are separate and that React calls Express, not Supabase directly.
3. Database connection method used, including whether `DATABASE_URL` is configured.
4. Database tables actually present or expected, including whether a repeatable migration/init script exists.
5. Whether seed data was inserted and where.
6. How test data is created, labelled, and cleaned up in the same Supabase database.
7. Authentication method used: real login, mock login, role selector, or hard-coded accounts.
8. Whether a user table exists.
9. Whether backend role checks are implemented and which endpoints are protected.
10. Whether doctor-only access is enforced by backend identity, not only frontend filtering.
11. Automated test commands, actual results, and what the tests cover.
12. Manual checks performed, if any.
13. Known failures, incomplete requirements, and assumptions.
14. Any stage drift: features implemented before the intended stage.
15. Security risks, especially exposed credentials and trusted client headers.
16. Documentation/code mismatches.
17. Stage 11 change request impact on schema, API, UI, validation, and tests.

The Stage 12 prompt should also tell the AI not to claim that the project is complete unless it has evidence for database setup, login/auth behavior, role restrictions, and test execution.

## Immediate Prompt Fix Areas For Later

Do not fix these until the workshop flow is updated deliberately:

1. Add database connection string requirement before Stage 3 implementation.
2. Require a repeatable DB setup command or script, not only manual SQL.
3. Decide whether mock login is acceptable or whether a `users` table is required for the workshop comparison.
4. Require clearly labelled test records and cleanup in the same Supabase database.
5. Require automated backend tests for P2 and P3, and intentionally keep P1 weaker only if that is part of the comparison design.
6. Add explicit "do not implement future stages" wording to each stage prompt, especially P1 and P2.
7. Update Stage 12 into an evidence-based final audit/report prompt.
