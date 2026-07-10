# Final Review — Internship Application Tracker (p1)

**Review date:** 2026-07-08
**Stage at review:** After testing, security hardening, maintainability cleanup, and change request (Stage 11+).
**Reviewer:** Antigravity (automated code review — read-only, evidence-based)

---

## 1. Final Feature Summary

The Internship Application Tracker is a two-role, three-tier prototype built with React 18 (Vite), Node.js/Express 4, and local MySQL via mysql2.

### What was built

| Feature | Implemented | Evidence file |
|---|---|---|
| Student submits internship application | Yes | backend/routes/applications.js POST / |
| Student views only own applications | Yes | GET / scoped by student_id = req.user.id |
| Student sees status and coordinator comments (read-only) | Yes | UI card renders coordinator_comments |
| Student can edit and resubmit when status is needs_changes | Yes | PUT /:id/resubmit — owner + status guard |
| Coordinator views all applications | Yes | GET / returns all rows for coordinator role |
| Coordinator reviews an application (status + comments) | Yes | PUT /:id — coordinator-only route |
| Coordinator can set needs_changes status | Yes | ENUM includes needs_changes; route validates |
| Filter by company name (partial LIKE) | Yes | ?company_name= query param |
| Filter by application status | Yes | ?status= query param |
| Student cannot approve/reject/review | Yes | HTTP 403 on PUT /:id for non-coordinator |
| Student cannot write coordinator comments | Yes | No comment field in POST; PUT is coordinator-only |
| DB-backed login with role return | Yes | POST /api/auth/login queries users table |
| All five case-required fields persisted | Yes | company_name, position_title, start_date, end_date, submitted_date |
| Health check endpoint | Yes | GET /api/health probes DB |
| Automated integration test suite | Yes | backend/test.js — 24 assertions |
| Repeatable seed script | Yes | npm run seed (backend/) |

### What was not built (by design / case scope)

- Password hashing (bcrypt/argon2) — plain-text comparison used
- JWT or signed session — x-user-id header remains an unauthenticated integer
- CORS origin restriction — wide-open cors() remains
- Pagination on application lists
- Status-transition rules (any state to any state permitted by coordinator)
- Document upload, supervisor accounts, email notifications (explicitly excluded in Case Brief)


---

## 2. Review Scoring Matrix

> **Score meaning:** 0 = missing · 1 = present but mostly not working · 2 = partially working with major gaps · 3 = mostly working with important gaps · 4 = working with minor gaps · 5 = complete for the selected case scope
> **Testing Evidence column (Final Review):** scores implemented automated tests, manual checks, cleanup of test data, and reported test results.

| Feature / Area | Functionality 0-5 | Data Persistence 0-5 | Backend Security / Role Control 0-5 | Validation / Error Handling 0-5 | Testing Evidence 0-5 | Maintainability 0-5 | UI / Manual Usability 0-5 | Evidence | Notes |
|---|---:|---:|---:|---:|---:|---:|---:|---|---|
| Project setup and run commands | 4 | — | — | — | 3 | 3 | — | backend/package.json: start, dev, seed, test; frontend/package.json: dev. Both node_modules installed. | No root-level orchestration script or README. Two separate terminals required to start. |
| Database setup and starter data | 5 | 5 | — | — | 4 | 3 | — | seed.js creates DB, drops/recreates both tables, inserts 3 users + 4 applications. Repeatable. | schema.sql still diverges from seed.js (missing users table, missing student_id, ENUM missing needs_changes). No migration tool. |
| Login workflow | 4 | 4 | 2 | 4 | 4 | 3 | 4 | POST /api/auth/login — parameterised query against users table. Returns id, username, role. Frontend stores in localStorage. Login tested in test.js line 28-46. | Plain-text password comparison. No JWT or session — only stateless x-user-id header. Logout is client-side only. |
| Role-based access | 4 | — | 2 | 3 | 4 | 3 | 4 | authenticate middleware in applications.js re-queries users table per request. Role guards on every route. Tests confirm 403 on cross-role attempts (lines 80-108). | x-user-id is a client-supplied integer — not bound to a signed token. Spoofable. Role logic is correct given the resolved user. |
| Main create action | 5 | 5 | 4 | 5 | 5 | 4 | 4 | POST / enforces role === 'student' (403), validates all fields (whitespace, non-empty, length <= 255, date format, end_date >= start_date), inserts student_id = req.user.id. Test lines 49-75 verify DB row, company_name, and default status = 'submitted'. | student_name is free-text — not locked to the authenticated user's name. |
| Main view/list action | 4 | 5 | 4 | 3 | 4 | 4 | 4 | GET / returns scoped rows for students and all rows for coordinators. Ordered DESC by submitted_date. Student list test (lines 103-108) confirms Bob Jones records are hidden from student1. | SELECT * — safe (no password in applications table). No pagination. Filter fires per keypress (no debounce). |
| Main update/status/cancel action | 4 | 5 | 4 | 4 | 5 | 4 | 4 | PUT /:id — coordinator-only. Validates status ENUM (now includes needs_changes). COALESCE preserves existing status if not provided. Application existence check (404). Tests lines 167-183 confirm DB reflects approved status and comments after coordinator PUT. | No status-transition enforcement (approved to submitted is allowed). Setting coordinator_comments: null clears the field. |
| Protected action | 5 | 5 | 3 | 4 | 5 | 4 | 4 | PUT /:id returns HTTP 403 for non-coordinators (tested line 92-100). PUT /:id/resubmit enforces student-only, owner check, and status guard (needs_changes only → 400). Tests confirm all three guards (lines 128-164). | Protection relies on x-user-id header. If a student sends a coordinator numeric ID they gain coordinator access. Not mitigated without a signed token. |
| Secondary feature | 4 | — | 4 | 3 | 4 | 4 | 4 | Company filter: parameterised LIKE %value%. Status filter: exact match. Both tested in lines 186-202. Coordinator and student UIs both include filter controls. | Filter fires per keystroke (no debounce). needs_changes filter option absent from coordinator status dropdown in UI (but is in student dropdown). |
| Case-specific: internship company, position, and date fields | 5 | 5 | 4 | 5 | 5 | 4 | 4 | company_name, position_title, start_date, end_date present in DB (seed), POST route, resubmit route, and both UI forms. submitted_date auto-set by DB DEFAULT CURRENT_TIMESTAMP. Date format and end >= start validated in backend (lines 91-100) and frontend (lines 162-168). | No min attribute on end_date HTML input for browser-level guard — relies on backend. |
| Case-specific: application status review lifecycle | 4 | 5 | 4 | 4 | 5 | 4 | 4 | ENUM: submitted, under_review, approved, rejected, needs_changes. All selectable in coordinator panel. Status validates against allowlist. Colour-coded badges for all five states. Full needs_changes → resubmit → submitted cycle tested (lines 110-164). | No lifecycle transition rules (e.g., approved → submitted not blocked). No status-change timestamp column. |
| Case-specific: coordinator comments and approval/rejection protection | 5 | 5 | 3 | 4 | 5 | 4 | 4 | Comments stored as TEXT. PUT /:id coordinator-only (HTTP 403 for students — tested line 92-100). No comment field in POST or resubmit routes. maxLength={1000} in textarea; backend validates length <= 1000. Comments displayed read-only in student card. | Same x-user-id spoofability gap. Null PUT clears existing comment. |
| UI / manual usability | 4 | — | — | 4 | 2 | 3 | 4 | Dark glassmorphism, Outfit font, gradient title, status badges, loading states, success/error messages, demo credentials on login screen. Edit & Resubmit button appears only when status === 'needs_changes'. | No aria-label or accessibility attributes. No debounce on company filter. No confirmation dialog before save. Demo credentials visible on login page. |
| Security posture | 2 | — | 2 | — | 3 | 2 | — | Parameterised queries throughout (no SQL injection). .env in backend only; frontend has no DB credentials. x-user-id validated as a positive integer before DB query. | Plain-text passwords. No JWT or session. x-user-id spoofable. CORS wide-open. No helmet/CSP. No rate limiting. .env likely committed (no .gitignore found). SELECT * in authenticate attaches password to req.user. |
| Testing evidence | 4 | 4 | 4 | 4 | 4 | 3 | — | backend/test.js — 223-line integration suite. 24 assertions. Covers login, DB write verification, role 403 enforcement, student scope, needs_changes flow, resubmit flow, coordinator approval, and both filters. Test data created during run; createdAppId deleted in finally block. | No test framework (no Jest/Mocha/Supertest) — uses raw fetch + custom assert(). No frontend tests. No coverage report. Requires seed data to pre-exist. |
| Maintainability | 3 | — | — | — | — | 3 | — | Routes split into auth.js and applications.js. db.js centralises pool config. Vite proxy avoids hardcoded backend URL in frontend. .env.example present. | All React in one 723-line App.jsx. All JSX uses inline styles. No README. schema.sql is stale. No .gitignore. SELECT * in middleware. No shared fetch wrapper. |


---

## 3. Project Structure and Run Commands

`
p1/
+-- Case_Brief.md                  # Project requirements
+-- MID_REVIEW.md                  # Mid-project review document
+-- FINAL_REVIEW.md                # This document
+-- schema.sql                     # STALE -- diverges from seed.js
+-- backend/
|   +-- .env                       # Live credentials -- should not be committed
|   +-- .env.example               # Template (DB_NAME value differs from .env)
|   +-- db.js                      # mysql2 connection pool (promise API)
|   +-- server.js                  # Express app, route mounting, health check
|   +-- seed.js                    # DB/table creation + demo data
|   +-- test.js                    # Integration test suite (24 assertions)
|   +-- package.json               # start, dev, seed, test scripts
|   +-- package-lock.json
|   +-- routes/
|       +-- auth.js                # POST /api/auth/login
|       +-- applications.js        # GET, POST, PUT /:id, PUT /:id/resubmit
+-- frontend/
    +-- index.html                 # Vite entry HTML
    +-- vite.config.js             # Port 3000, proxy /api to localhost:5000
    +-- package.json               # dev, build, lint, preview scripts
    +-- package-lock.json
    +-- src/
        +-- main.jsx               # React root mount
        +-- App.jsx                # Entire application (723 lines, single component)
        +-- index.css              # Design tokens, glassmorphism, button styles
`

### Run commands

`ash
# 1. One-time database setup (run in backend/)
cd backend
npm install
npm run seed           # creates DB, tables, and demo users/applications

# 2. Start backend (run in backend/)
npm run dev            # nodemon server.js -> http://localhost:5000

# 3. Start frontend (run in frontend/, separate terminal)
cd frontend
npm install
npm run dev            # vite -> http://localhost:3000

# 4. Run automated tests (seed must be run first; test starts its own server on 5001)
cd backend
npm test               # node test.js
`

---

## 4. Frontend / Backend Separation Check

| Check | Result | Detail |
|---|---|---|
| React and Express are in separate directories | PASS | frontend/ (Vite + React 18) and backend/ (Express 4) are fully separate. |
| React never imports or requires MySQL | PASS | frontend/package.json has no mysql2 or any DB dependency. |
| React calls Express routes, not MySQL directly | PASS | All 6 fetch() calls in App.jsx target /api/auth/login or /api/applications[/:id][/resubmit]. |
| Frontend does not contain DB credentials | PASS | .env is in backend/ only. frontend/ has no .env file. |
| API calls use a proxy, not a hardcoded backend URL | PASS | vite.config.js proxies /api to http://localhost:5000. React uses relative paths. |
| Backend does not serve React files | PASS | server.js mounts no static file middleware. Vite dev server is separate. |

**Verdict:** Separation is clean and correct. React and Express are genuinely separated.

---

## 5. Database Setup and Table Summary

### Database connection method

backend/db.js creates a mysql2 connection pool using the promise API. All five required environment variables are configured:

| Variable | Configured | Default in db.js |
|---|---|---|
| DB_HOST | Yes | 'localhost' |
| DB_PORT | Yes | 3306 |
| DB_USER | Yes | 'root' |
| DB_PASSWORD | Yes | (not printed -- read from .env) |
| DB_NAME | Yes | 'c4p1' |

> The actual value of DB_PASSWORD is not reproduced in this review.

### Tables used

| Table | Defined in schema.sql | Defined in seed.js | Used by routes |
|---|---|---|---|
| users | Missing | Yes | auth.js login query; applications.js authenticate middleware |
| applications | Partial (missing student_id, no FK, missing needs_changes) | Full | All routes in applications.js |

### users table (from seed.js -- authoritative)

`sql
CREATE TABLE users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  role ENUM('student', 'coordinator') NOT NULL
)
`

### applications table (from seed.js -- authoritative)

`sql
CREATE TABLE applications (
  id INT AUTO_INCREMENT PRIMARY KEY,
  student_id INT NOT NULL,
  student_name VARCHAR(255) NOT NULL,
  company_name VARCHAR(255) NOT NULL,
  position_title VARCHAR(255) NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  submitted_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  status ENUM('submitted','under_review','approved','rejected','needs_changes') DEFAULT 'submitted',
  coordinator_comments TEXT,
  FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE
)
`

> WARNING: schema.sql is stale. It lacks the users table, lacks student_id, and its ENUM does not include needs_changes. Applying schema.sql directly to MySQL produces a broken, incompatible schema that crashes the application.

### How tables and seed data are re-created

Run once in backend/:
`ash
npm run seed
`
seed.js connects to MySQL (without specifying a database), issues CREATE DATABASE IF NOT EXISTS, then DROP TABLE IF EXISTS on both tables before recreating them. It inserts 3 users and 4 applications. The operation is destructive and repeatable.

Demo accounts after seed:

| Username | Password | Role |
|---|---|---|
| student1 | password | student |
| student2 | password | student |
| coordinator1 | password | coordinator |


---

## 6. Login and Role / Access Explanation

### How login works

1. User submits username + password in the React form.
2. App.jsx handleLogin() POSTs to /api/auth/login (via Vite proxy to Express).
3. auth.js runs: SELECT id, username, role FROM users WHERE username = ? AND password = ? (parameterised, plain-text comparison).
4. On match: returns { id, username, role } as JSON.
5. React stores the object in localStorage and sets user state. The page re-renders into the authenticated view.
6. On page refresh, useState initialiser reads localStorage to restore the session without re-logging in.

### How roles are checked per request

Every protected route passes through the authenticate middleware in applications.js:

1. Reads req.headers['x-user-id'] (a plain integer string).
2. Parses it and validates it is a positive integer.
3. Runs SELECT * FROM users WHERE id = ? -- re-validates the user exists in DB on every request.
4. Attaches the full user row to req.user.
5. Per-route guards then check req.user.role:
   - POST / -- role !== 'student' -> HTTP 403
   - PUT /:id -- role !== 'coordinator' -> HTTP 403
   - PUT /:id/resubmit -- role !== 'student' -> HTTP 403, then student_id !== req.user.id -> HTTP 403

### Spoofing caveat

The x-user-id header is client-supplied and unsigned. Any client that knows (or guesses) a coordinator's integer ID can send that ID as the header and gain coordinator-level access. This is a known limitation not resolved in the current codebase.

### Who can access whose records

- **Students:** GET /api/applications automatically adds WHERE student_id = req.user.id. Students are prevented from seeing other students' records by the backend WHERE clause, not just by UI.
- **Coordinators:** No row-level scoping -- all applications returned. Correct per the case brief.
- **Student resubmit:** PUT /:id/resubmit checks existing[0].student_id !== req.user.id -- a student cannot resubmit another student's application even if they know its ID.

---

## 7. Protected Action Explanation

**Protected action:** Approving, rejecting, or adding/editing coordinator comments on an application (PUT /api/applications/:id).

### Backend protection chain for coordinator review

`
Request -> authenticate middleware
        -> check role === 'coordinator' (else 403)
        -> validate status enum (else 400)
        -> validate comment length <= 1000 (else 400)
        -> SELECT to confirm application exists (else 404)
        -> UPDATE applications SET status, coordinator_comments WHERE id = ?
`

### Backend protection chain for student resubmit

`
Request -> authenticate middleware
        -> check role === 'student' (else 403)
        -> validate all five fields (else 400)
        -> SELECT application by id
        -> check student_id === req.user.id (else 403 -- cross-owner block)
        -> check status === 'needs_changes' (else 400 -- state guard)
        -> UPDATE fields, SET status = 'submitted'
`

### What the test confirms

- test.js line 92-100: A student sending PUT /:id receives HTTP 403.
- test.js line 128-147: needs_changes -> student resubmit -> back to submitted confirmed in DB.
- test.js line 149-164: A second resubmit (status now submitted, not needs_changes) returns HTTP 400.
- test.js line 167-183: Coordinator approval returns 200; DB row confirms status = 'approved' and correct comments value.

### UI protection

The coordinator review form (status dropdown + comments textarea) is rendered only when user.role === 'coordinator'. The "Edit & Resubmit" button is rendered only when app.status === 'needs_changes'.

---

## 8. Validation Summary

### Backend validation rules

| Rule | Route | Present | Detail |
|---|---|---|---|
| username and password required (non-empty) | POST /api/auth/login | Yes | Returns 400 if missing |
| All five application fields required and non-whitespace | POST / and PUT /:id/resubmit | Yes | ?.trim() then truthiness check |
| Field length <= 255 characters | POST / and PUT /:id/resubmit | Yes | Added post-mid-review |
| start_date and end_date are valid dates | POST / and PUT /:id/resubmit | Yes | isNaN(new Date(...).getTime()) check |
| end_date must not be before start_date | POST / and PUT /:id/resubmit | Yes | end < start -> 400 |
| status must be in allowlist | PUT /:id | Yes | Explicit array check |
| coordinator_comments <= 1000 characters | PUT /:id | Yes | Added post-mid-review |
| Application must exist before update | PUT /:id | Yes | Pre-fetch + 404 |
| Resubmit only if status === 'needs_changes' | PUT /:id/resubmit | Yes | State guard -> 400 |
| Resubmit only by application owner | PUT /:id/resubmit | Yes | student_id comparison -> 403 |
| Only coordinator can PUT /:id | PUT /:id | Yes | Role guard -> 403 |
| Only student can POST / | POST / | Yes | Role guard -> 403 |
| Only student can PUT /:id/resubmit | PUT /:id/resubmit | Yes | Role guard -> 403 |

### Frontend validation rules

| Rule | Present | Detail |
|---|---|---|
| HTML required on all form fields | Yes | All application and login fields |
| Date inputs use type="date" | Yes | Browser enforces date picker |
| maxLength={255} on text inputs | Yes | Matches backend limit |
| maxLength={1000} on comments textarea | Yes | Matches backend limit |
| end_date >= start_date client check | Yes | end < start -> setSubmitError before fetch |
| Error messages displayed from API | Yes | loginError, submitError, reviewError |
| Status select restricted to known values | Yes | option elements only |

**Improvement from mid-review:** Date-range validation (end >= start) and field length limits (255 / 1000) were both absent at mid-review and are now present in both backend and frontend.


---

## 9. Automated and Manual Testing Summary

### Automated test command

`ash
cd backend
npm test          # runs: node test.js
`

test.js starts its own Express server on port 5001 (not 5000), runs all assertions, then closes the server and ends the DB pool in a finally block.

### What the test checks (24 assertions)

| # | Assertion | Lines |
|---|---|---|
| 1 | Student login returns HTTP 200 | 33 |
| 2 | Role of student1 is "student" | 35 |
| 3 | Coordinator login returns HTTP 200 | 43 |
| 4 | Role of coordinator1 is "coordinator" | 45 |
| 5 | Student submission returns HTTP 201 | 66 |
| 6 | Returned applicationId is defined | 69 |
| 7 | DB row exists for created application | 73 |
| 8 | DB company_name matches input | 74 |
| 9 | DB status defaults to "submitted" | 75 |
| 10 | Coordinator cannot POST (HTTP 403) | 89 |
| 11 | Student cannot PUT /:id (HTTP 403) | 100 |
| 12 | Student list excludes other student records | 107-108 |
| 13 | Coordinator needs_changes update returns HTTP 200 | 125 |
| 14 | Student resubmit returns HTTP 200 | 142 |
| 15 | DB status is "submitted" after resubmit | 146 |
| 16 | DB position_title updated after resubmit | 147 |
| 17 | Second resubmit (wrong status) returns HTTP 400 | 164 |
| 18 | Coordinator approval returns HTTP 200 | 178 |
| 19 | DB status is "approved" after coordinator PUT | 182 |
| 20 | DB coordinator_comments saved correctly | 183 |
| 21 | Company filter returns results | 193 |
| 22 | All company filter results contain "TestCorp" | 194 |
| 23 | Status filter returns results | 201 |
| 24 | All status filter results have status "approved" | 202 |

### Test data lifecycle

- One application ("TestCorp Inc / QA Automation Intern") is created during the test run via the authenticated POST call.
- The returned applicationId is tracked in createdAppId.
- In the finally block, DELETE FROM applications WHERE id = ? removes the test row -- cleanup runs even if a test assertion fails.
- Seed users (student1, student2, coordinator1) must exist before tests run. The test suite relies on npm run seed having been executed first.

### Expected test output (based on code analysis; requires seeded MySQL instance)

`
Starting Integration Tests...

--- 1. Testing Auth & Login ---
[PASS] Student login should return status 200
[PASS] Role of student1 should be "student"
[PASS] Coordinator login should return status 200
[PASS] Role of coordinator1 should be "coordinator"

--- 2. Testing Saving to MySQL (Student Submission) ---
[PASS] Student submission should succeed with 201
[PASS] Should return created applicationId
[PASS] Database row should exist for created application
[PASS] Database company name should match input
[PASS] Default status should be "submitted"

--- 3. Testing Server-side Permission Restrictions ---
[PASS] Coordinators should not be permitted to submit student applications (403)
[PASS] Students should not be permitted to review applications (403)
[PASS] Student view should exclude other student records

--- 4. Testing Needs Changes & Student Resubmit Flow ---
[PASS] Coordinator request changes should return 200
[PASS] Student resubmit should succeed with 200
[PASS] Status should return to "submitted"
[PASS] Position title should be updated in DB
[PASS] Blocked student resubmission of non-needs_changes application (400)
[PASS] Coordinator approval should return 200
[PASS] Status should be updated to "approved" in MySQL
[PASS] Comments should be saved in MySQL

--- 5. Testing Search Filters ---
[PASS] Should find applications by company name filter
[PASS] All returns should contain "TestCorp"
[PASS] Should find applications by status filter
[PASS] All returns should have status "approved"

ALL TESTS PASSED SUCCESSFULLY!
`

### What was not automated

- **Frontend component tests** -- No React Testing Library, Playwright, or Cypress. UI interactions are manual-only.
- **Login failure paths** -- No test for wrong password (401) or missing fields (400).
- **Filter with empty results** -- No assertion that an impossible filter returns an empty array.
- **Resubmit by wrong owner** -- No test for student2 attempting to resubmit student1's application.
- **Database error paths** -- No tests with invalid DB state.
- **Coverage measurement** -- No framework producing a coverage report.

---

## 10. Stage 11 Change Summary

Changes confirmed present in the final codebase that were absent at the mid-review:

| Change | Location | Evidence |
|---|---|---|
| needs_changes status added to ENUM | seed.js line 45 | ENUM now includes 'needs_changes' |
| PUT /:id/resubmit route added | applications.js lines 163-229 | Full resubmit route with role, owner, and state guards |
| end_date >= start_date validation added to backend | applications.js lines 97-100 | if (end < start) -> 400 in both POST and resubmit |
| Field length validation added (<= 255 text, <= 1000 comments) | applications.js lines 86-88, 136-138 | String.length > 255/1000 checks |
| Date format validation added | applications.js lines 91-95 | isNaN(new Date(...).getTime()) in both POST and resubmit |
| Complete integration test suite added | backend/test.js | 223-line file; npm test script in package.json |
| Test data cleanup added | test.js lines 210-218 | finally block deletes test row by ID |
| Edit & Resubmit UI button added (student view) | App.jsx lines 545-555 | Button only shows when status === 'needs_changes' |
| Frontend date-range validation added | App.jsx lines 162-168 | end < start -> setSubmitError before fetch |
| Frontend maxLength attributes added | App.jsx lines 400, 417, 434, 695 | 255 on text inputs, 1000 on textarea |

---

## 11. Stage Drift or Early Work

| Item | Found | Expected Stage | Risk |
|---|---|---|---|
| /api/health endpoint with DB connectivity check | server.js lines 20-37 | Ops/monitoring stage | Low -- useful smoke-test hook; no harm |
| student_id FK with ON DELETE CASCADE | seed.js line 47 | DB design stage (appropriate) | None -- correct relational design |
| Demo credentials displayed on login screen | App.jsx lines 321-329 | Dev convenience | Low -- must be removed before any non-prototype deployment |
| nodemon devDependency | backend/package.json line 19 | Dev tooling (appropriate) | None |
| .env.example committed | backend/.env.example | Good practice | None -- correct |

No features from explicitly excluded scope (file upload, supervisor accounts, email notifications) were pre-implemented.


---

## 12. Security Risks and Exposed-Secret Check

| Risk | Severity | Detail | Status |
|---|---|---|---|
| x-user-id header is unauthenticated | Critical | Any client can send any user ID. Knowing a coordinator integer ID grants full coordinator access. | Not mitigated -- no JWT or signed session |
| Plain-text passwords in database | Critical | auth.js compares raw strings. DB compromise reveals all credentials instantly. | Not mitigated -- no bcrypt/argon2 |
| backend/.env likely committed (no .gitignore found) | Critical | DB credentials exposed if the project is pushed to any remote repository. | Not mitigated -- no .gitignore found |
| CORS wide-open (app.use(cors())) | High | Any origin can make cross-origin requests to the backend. No allowlist configured. | Not mitigated |
| SELECT * in authenticate middleware | Medium | The password column is attached to req.user on every request. | Not mitigated |
| No helmet or security headers | Medium | No X-Content-Type-Options, Strict-Transport-Security, or Content-Security-Policy. | Not mitigated |
| No rate limiting on login endpoint | Medium | Brute-force login attempts are not throttled. | Not mitigated |
| schema.sql mismatch is a setup risk | Medium | A developer who runs schema.sql instead of seed.js will build a broken schema. | Not fixed -- schema.sql still stale |
| DB_NAME mismatch between .env and .env.example | Medium | .env uses c4p1; .env.example says internship_tracker. | Not fixed |

> **Secret check:** The actual value of DB_PASSWORD from backend/.env has not been read or printed in this review. Only the variable name and the fact that it is configured were confirmed.

---

## 13. Documentation / Code Mismatches

| Document | Code | Mismatch |
|---|---|---|
| schema.sql ENUM: submitted, under_review, approved, rejected | seed.js ENUM: adds needs_changes | schema.sql missing needs_changes; also missing users table and student_id column |
| .env.example DB_NAME=internship_tracker | .env DB_NAME=c4p1; seed.js default 'c4p1' | A developer copying .env.example will point to a non-existent database |
| PUT /:id valid statuses in code include needs_changes | Case Brief only mentions: submitted, under review, approved, rejected | needs_changes is a beneficial extension not documented in Case_Brief.md |
| No README.md | backend/package.json has 4 scripts; frontend/package.json has 4 scripts | New contributors cannot set up the project without reading source code |
| Case Brief: students should not be able to approve their own applications | Code: students cannot approve any application (not just their own) | Code is stricter than spec -- acceptable |

---

## 14. Known Limitations

1. **Header-spoofing vulnerability** -- x-user-id is unauthenticated. Mitigation requires JWT or signed session cookies.
2. **Plain-text passwords** -- Acceptable only for a prototype. Any deployment must use bcrypt or argon2.
3. **No pagination** -- GET /api/applications returns all rows. Performance degrades as the dataset grows.
4. **No status-transition rules** -- A coordinator can set approved to submitted. Status moves in any direction.
5. **No status-change audit log** -- No timestamp column records when a status changed or who changed it.
6. **No debounce on company filter** -- One HTTP request per keystroke in the company search field.
7. **Student name is free-text** -- student_name is not locked to the authenticated user's username.
8. **needs_changes missing from coordinator filter dropdown** -- The coordinator status filter select in the UI does not include needs_changes, though the backend accepts it.
9. **schema.sql is stale** -- Cannot be used as a standalone DB setup tool.
10. **No .gitignore** -- node_modules and .env may be committed to version control.
11. **Single App.jsx monolith** -- 723-line single-file React app; difficult to unit test individual components.
12. **No frontend tests** -- All UI behaviour must be verified manually.
13. **Test suite requires pre-seeded DB** -- npm test will fail if npm run seed has not been run first.
14. **Wide-open CORS** -- No origin restriction on the Express server.
15. **Demo credentials visible on login page** -- Appropriate for a prototype; must be removed before any deployment.

---

## 15. Demo Script

Use this script to demonstrate the full end-to-end workflow in approximately 8 minutes.

### Pre-demo setup (2 minutes)

`ash
# Terminal 1 -- Backend
cd backend && npm run seed && npm run dev

# Terminal 2 -- Frontend
cd frontend && npm run dev
`

Open http://localhost:3000 in a browser.

---

### Scene 1 -- Student submits an application (2 minutes)

1. Log in as student1 / password.
2. Point out: only "Student Dashboard" is shown -- no coordinator controls.
3. Fill in the form: Company = Microsoft, Position = Cloud Intern, Start = 2026-09-01, End = 2026-12-15.
4. Click Submit Application -- note the success message and the new card appearing in "My Submissions".
5. Point out the status badge: SUBMITTED (blue).
6. Log out.

---

### Scene 2 -- Coordinator reviews and requests changes (2 minutes)

1. Log in as coordinator1 / password.
2. Point out: all four seeded applications plus the new Microsoft application are visible.
3. Use the company filter to type "Microsoft" -- list narrows to one row.
4. Click Review on the Microsoft row.
5. Change status to Needs Changes, enter comment: "Please add a supervisor contact name."
6. Click Save Review -- note the list updates and the badge changes to NEEDS CHANGES (purple).
7. Log out.

---

### Scene 3 -- Student resubmits (1 minute)

1. Log in as student1 / password.
2. The Microsoft card now shows NEEDS CHANGES and the coordinator comment.
3. Click Edit & Resubmit -- the form pre-fills with existing data.
4. Update the Position Title to "Cloud Intern (Supervisor: Jane Lee)".
5. Click Resubmit -- status badge returns to SUBMITTED.
6. Log out.

---

### Scene 4 -- Coordinator approves (1 minute)

1. Log in as coordinator1 / password.
2. Click Review on the Microsoft row (now back to Submitted).
3. Change status to Approved, comment: "All details confirmed. Welcome!"
4. Click Save Review -- badge turns APPROVED (green).

---

### Scene 5 -- Role protection proof (30 seconds, optional)

Open a terminal and run:
`ash
curl -X PUT http://localhost:5000/api/applications/1 -H "Content-Type: application/json" -H "x-user-id: <student1_id>" -d "{\"status\":\"approved\"}"
`
Response: {"error":"Forbidden. Only coordinators can review applications."} (HTTP 403)

---

### Scene 6 -- Run automated tests (30 seconds, optional)

`ash
cd backend && npm test
`
All 24 assertions pass and cleanup output is shown.

---

## 16. Suggested Viva Questions

### Project setup and architecture

1. Why are there two package.json files? What would you change to allow the project to be started with a single command from the root?
2. The Vite config has a proxy setting pointing to localhost:5000. What problem does this solve, and what would happen in production without it?
3. Why is schema.sql in the project if seed.js already creates the tables? What would a correct version of schema.sql contain?

### Database and persistence

4. What does ON DELETE CASCADE on the student_id foreign key do? Give an example of when this would trigger.
5. Why does seed.js use DROP TABLE IF EXISTS before creating tables? Is this safe for a production database? What would you use instead?
6. There are two different values of DB_NAME in the project. Where are they, and why is this a problem?

### Login and roles

7. What does the authenticate middleware do? Why does it make a database query on every single request?
8. A student logs in and receives { id: 2, username: "student1", role: "student" }. How does the backend verify that subsequent requests actually come from student1?
9. What is header spoofing in this context? How would you fix it?

### Protected actions

10. Walk through exactly what happens when student1 tries to call PUT /api/applications/1 with status approved. Which line of code rejects it, and what HTTP status code does it return?
11. Why does the resubmit route check existing[0].student_id !== req.user.id? What attack does this prevent?
12. What happens if a coordinator calls PUT /api/applications/1 with coordinator_comments: null? Is this the desired behaviour?

### Validation

13. The backend checks end_date < start_date. Why is this check still present in the frontend too? Which one is the true security boundary and why?
14. What would happen if you removed the status allowlist check in the PUT route? Could an attacker inject arbitrary data into the status column?
15. Why does the backend validate field length (> 255) even though the MySQL column is VARCHAR(255)?

### Testing

16. test.js does not use Jest or Mocha -- it uses raw fetch and a custom assert() function. What are the trade-offs of this approach compared to a proper test framework?
17. The test deletes the created application in a finally block. Why finally rather than at the end of the try block?
18. npm test starts a server on port 5001. Why not reuse port 5000? What would happen if you did?
19. Name two important scenarios that the current test suite does not cover. How would you add them?

### Security

20. The project uses app.use(cors()) with no options. What does this allow? How would you restrict it to allow only http://localhost:3000?
21. SELECT * is used in the authenticate middleware. What column does this unnecessarily load into memory on every request?
22. Passwords are stored and compared as plain text. Without showing the actual password, explain how you would migrate to hashed passwords using bcrypt.

### Case-specific

23. The Case Brief says "students should not be able to approve their own applications." Does the current code enforce this only for their own applications, or for all applications? Is that stronger or weaker than what was specified?
24. How does the system know which applications belong to which student? Trace the field from the database to the API response to the UI card.
25. A coordinator sets status to needs_changes. What must happen before the student can resubmit? List every check the backend performs on the resubmit route.

---

*End of Final Review -- Internship Application Tracker (p1)*
*Reviewed: 2026-07-08 | Files inspected: 13 | Lines read: ~1,800 | Assertions verified: 24*
