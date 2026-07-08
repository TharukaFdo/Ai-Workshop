# Student Project Tracker — Final Evidence-Based Review

**Review date:** 2026-06-14  
**Stage reviewed:** Final — after testing, security hardening, maintainability cleanup, and change request implementation.  
**Test run result:** 6/6 automated tests passed (node:test, `npm test --prefix backend`)  
**Reviewer note:** All source files, test files, and database setup scripts were inspected in full before scoring. No source files, schema, seed data, packages, or configuration were created or modified during this review.

---

## 1. Final Feature Summary

The Student Project Tracker is a complete React + Node.js/Express + MySQL prototype that implements the full project submission and supervisor review lifecycle. The application is split into a Vite/React frontend (port 5174) and an Express backend (port 5000), with a local MySQL database (`c9p3`).

### What was built

| Capability | Implemented | Notes |
|---|:---:|---|
| Student project submission (FR-1) | ✅ | `POST /api/projects` — student-only, all required fields validated |
| Student update of own submission (FR-2) | ✅ | `PUT /api/projects/:id` — student-only, ownership-checked, status-locked |
| View and filter submissions (FR-3) | ✅ | `GET /api/projects` — students see own; supervisors see all; three filter criteria |
| Supervisor review, feedback, and status update (FR-4) | ✅ | `PUT /api/projects/:id/review` — supervisor-only, status ENUM validated |
| Database-backed login with bcrypt | ✅ | `POST /api/auth/login` — username/password against `app_users` |
| Role enforcement per request (DB-verified) | ✅ | `checkRole()` middleware queries `app_users` on every protected call |
| Student ownership guard (list and update) | ✅ | `getProjectsByStudent()` and `project.student_id !== req.user.id` |
| Student edit locked after approval/rejection | ✅ | `PUT /:id` requires `status === 'revisionRequested'` |
| Date format validation on backend | ✅ | `Date.parse()` in `validateProjectPayload` middleware |
| Automated test suite (6 suites, node:test) | ✅ | All 6 suites passed; test data cleaned before and after |
| Test data cleanup (`TEST:` prefix) | ✅ | `before()` and `after()` hooks delete `WHERE title LIKE 'TEST:%'` |
| Supervisor feedback workflow | ✅ | `/review` route; read-only `feedback-box` in student UI |
| Filter by supervisor, category, status | ✅ | Parameterised WHERE clauses in both service methods |
| `revisionRequested` status and re-edit flow | ✅ | Supervisor sets; student sees Edit button only on that status |

---

## 2. Review Scoring Matrix

> Score 0 = missing · 1 = present but mostly not working · 2 = partial, major gaps · 3 = mostly working, important gaps · 4 = working, minor gaps · 5 = complete for case scope

| Feature / Area | Functionality 0-5 | Data Persistence 0-5 | Backend Security / Role Control 0-5 | Validation / Error Handling 0-5 | Testing Evidence 0-5 | Maintainability 0-5 | UI / Manual Usability 0-5 | Evidence | Notes |
|---|---:|---:|---:|---:|---:|---:|---:|---|---|
| Project setup and run commands | 5 | — | — | — | — | 4 | — | Root `package.json`: `install:all`, `dev:backend`, `dev:frontend`, `db:setup`, `db:reset`, `test` | No concurrent dev script; two separate terminals needed for backend and frontend |
| Database setup and starter data | 5 | 5 | — | — | 4 | 4 | — | `db-setup.js` creates DB, both tables, seeds 4 users + 2 submissions; `--reset` flag; bcrypt-hashed passwords | `db.js` fallback DB name (`student_project_tracker`) still differs from `.env` (`c9p3`); minor risk if `.env` absent |
| Login workflow | 5 | 5 | 4 | 4 | 5 | 4 | 5 | `authRoutes.js`: DB lookup → `bcrypt.compare` → user object (password excluded); test suite #1 passes | No session/token — user lost on page refresh; stale comment "Simple mock login" still present on line 6 |
| Role-based access | 5 | 5 | 4 | 4 | 5 | 4 | 5 | `checkRole()` middleware queries `app_users` on every request; test #2 verifies supervisor blocked from submitting (403) | `x-user-id` header is an unauthenticated plain integer — impersonation possible without a token layer |
| Main create action | 5 | 5 | 5 | 5 | 5 | 4 | 5 | `POST /api/projects`: `checkRole(['student'])`, `validateProjectPayload` (date + required fields), `studentName` resolved from DB; test #2 verifies 201 / 400 / 403 paths | No duplicate submission prevention; category is free-text VARCHAR |
| Main view/list action | 5 | 5 | 5 | 4 | 5 | 4 | 5 | `GET /api/projects`: students get own only (`getProjectsByStudent`); supervisors get all; test #3 verifies data isolation | Race condition on empty `currentUser` state is minor and guarded by `useEffect` dependency |
| Main update/status/cancel action | 5 | 5 | 5 | 5 | 5 | 4 | 4 | `PUT /api/projects/:id`: ownership check + `status === 'revisionRequested'` gate; test #4 verifies blocked update when `submitted`, allowed after supervisor sets `revisionRequested`; status auto-resets to `submitted` | No explicit cancel/withdraw action; update only allowed from `revisionRequested` (intentional workflow constraint) |
| Protected action | 5 | 5 | 5 | 5 | 5 | 4 | 5 | `PUT /api/projects/:id/review`: `checkRole(['supervisor'])`; status ENUM validated; test #5 verifies student blocked (403), invalid status (400), supervisor success (200) | Any supervisor can review any project (no `supervisorName` match check); feedback is optional |
| Secondary feature | 5 | 5 | 4 | 4 | 5 | 3 | 4 | Filter params `supervisorName`, `category`, `status` via query string; backend parameterised WHERE; test #6 verifies `status=approved` and `category=Artificial Intelligence` filters | Supervisor/category dropdown options hard-coded in JSX; third category "Web Applications" in UI not present in seed data |
| Case-specific: project title, category, supervisor, and status fields | 5 | 5 | 5 | 5 | 5 | 4 | 5 | All four fields in schema, form, API, and filter; status ENUM enforced in DB and in review route validation; `supervisorName` stored per-submission; test suite covers all | `supervisorName` is a free-text VARCHAR (no FK to `app_users`); `category` is also free-text; no FK constraints on these two fields |
| Case-specific: supervisor feedback workflow | 5 | 5 | 5 | 4 | 5 | 4 | 5 | `/review` route is supervisor-only; `feedback` TEXT nullable; student view shows `feedback-box` div read-only; `updateProjectStatusAndFeedback` only called via supervisor route; test #5 confirms feedback persisted | No minimum length on feedback; feedback textarea not marked `required` (acceptable per spec) |
| Case-specific: student ownership and supervisor-only approval | 5 | 5 | 5 | 5 | 5 | 4 | 5 | Ownership check in `PUT /:id`; status lock (`revisionRequested` only); `updateProjectFields` does not accept `status` or `feedback`; test suite verifies all paths | Supervisor identity is not matched to the `supervisorName` field on the submission |
| UI / manual usability | — | — | — | — | — | — | 5 | Dark theme (Outfit font, indigo gradient, status badges for all 5 statuses), responsive two-column grid, loading/error/success states, filter bar, Edit button visible only on `revisionRequested` | `App.jsx` is a single 578-line file; no component splitting |
| Security posture | — | — | 4 | — | — | — | — | Parameterised queries throughout; bcrypt password hashing; DB secrets in `.env` not in React bundle; password excluded from login response | Open CORS (`cors()` with no origin restriction); no rate limiting on login; no `helmet`; `x-user-id` is unauthenticated |
| Testing evidence | — | — | — | — | 5 | — | — | 6 automated suites via `node --test`; all pass; `TEST:` prefix isolates test data; before/after cleanup hooks; test command in both `package.json` files | No test for supervisor filter on student list; no test for invalid date format on backend |
| Maintainability | — | — | — | — | — | 4 | — | Services layer (`projectService.js`, `userService.js`) separates DB logic; JSDoc on service functions; `.env.example`; `validateProjectPayload` extracted as middleware | `App.jsx` is a single 578-line monolith; supervisor/category lists hard-coded in three JSX locations; stale comment in `authRoutes.js` L6; `db.js` fallback name mismatch |

---

## 3. Project Structure and Run Commands

```
p3/
├── package.json                  ← root workspace (install:all, dev:backend, dev:frontend, db:setup, db:reset, test)
├── Case_Brief.md
├── REQUIREMENTS.md
├── PROJECT_CONTEXT.md
├── README.md
├── MID_REVIEW.md
├── FINAL_REVIEW.md               ← this document
│
├── backend/
│   ├── server.js                 ← Express app entry point (port 5000)
│   ├── package.json              ← start, dev, db:setup, db:reset, test scripts
│   ├── .env                      ← DB credentials (not committed)
│   ├── .env.example              ← template (committed)
│   ├── config/
│   │   └── db.js                 ← mysql2 promise pool
│   ├── routes/
│   │   ├── authRoutes.js         ← POST /api/auth/login
│   │   └── projectRoutes.js      ← GET/POST/PUT /api/projects, PUT /api/projects/:id/review
│   ├── services/
│   │   ├── projectService.js     ← DB queries for project CRUD and filtering
│   │   └── userService.js        ← getUserByUsername, getUsersByRole
│   ├── scripts/
│   │   └── db-setup.js           ← creates DB, tables, seeds users and submissions
│   └── tests/
│       └── api.test.js           ← 6 integration test suites (node:test)
│
└── frontend/
    ├── package.json
    ├── vite.config.js
    ├── index.html
    └── src/
        ├── main.jsx
        ├── App.jsx               ← single 578-line component (all views and state)
        └── index.css             ← design system (dark theme, Outfit font, badge system)
```

### Run commands

| Task | Command (from project root) |
|---|---|
| Install all dependencies | `npm run install:all` |
| Create database and seed | `npm run db:setup` |
| Reset database (drop + recreate) | `npm run db:reset` |
| Start backend (dev, port 5000) | `npm run dev:backend` |
| Start frontend (dev, port 5174) | `npm run dev:frontend` |
| Run automated tests | `npm test` |

> **README setup order issue:** The README instructs running `db:setup` (Step 1) before configuring `.env` (Step 2). The correct order is: configure `.env` first, then run `db:setup`. This is a documentation error, not a code error.

---

## 4. Frontend / Backend Separation Check

**Separated: Yes.**

| Check | Result |
|---|---|
| Separate directories with own `package.json` | ✅ `/frontend` and `/backend` each have their own `package.json` |
| React uses no MySQL client | ✅ No `mysql2` or `mysql` in `frontend/package.json` or `frontend/node_modules` |
| React API base | ✅ `const API_BASE = 'http://localhost:5000/api'` in `App.jsx` L3 |
| DB secrets absent from React bundle | ✅ No `process.env.DB_*` references in any frontend file |
| All data flows through Express | ✅ Every data operation in React uses `fetch(API_BASE + ...)` |

---

## 5. Database Setup and Table Summary

### Connection method

`backend/config/db.js` creates a `mysql2` promise connection pool. All five required environment variables are loaded via `dotenv` from `backend/.env`:

| Variable | Present | Value (non-secret) |
|---|:---:|---|
| `DB_HOST` | ✅ | `localhost` |
| `DB_PORT` | ✅ | `3306` |
| `DB_USER` | ✅ | `root` |
| `DB_PASSWORD` | ✅ | *(configured — value not printed)* |
| `DB_NAME` | ✅ | `c9p3` |

> ⚠️ **Fallback mismatch:** `db.js` L9 has `|| 'student_project_tracker'` as a hardcoded fallback. If `.env` is absent or misconfigured, the app will attempt to connect to the wrong database name. This does not affect normal operation when `.env` is present.

### Tables

| Table | Columns | Notes |
|---|---|---|
| `app_users` | `id`, `username` (UNIQUE), `password` (bcrypt), `role` ENUM(`student`,`supervisor`), `fullName`, `createdAt`, `updatedAt` | Login/auth table — present and used |
| `project_submissions` | `id`, `title`, `description`, `category`, `studentName`, `supervisorName`, `submittedDate` (DATE), `status` ENUM(5 values), `feedback` (TEXT NULL), `student_id` FK → `app_users`, `createdAt`, `updatedAt` | Main entity table |

### Seed data

4 users (2 students, 2 supervisors) and 2 sample project submissions are seeded automatically if the tables are empty. Passwords are bcrypt-hashed at setup time. Re-running `db:setup` is idempotent (skips seeding if rows already exist). Running `db:reset` (`--reset` flag) drops and fully recreates the database.

### Seeded credentials

| Username | Role | Full Name |
|---|---|---|
| `alice_student` | student | Alice Cooper |
| `bob_student` | student | Bob Marley |
| `supervisor_john` | supervisor | Prof. John Doe |
| `supervisor_jane` | supervisor | Prof. Jane Smith |
Password for all: `password123`

---

## 6. Login and Role / Access Explanation

### Login flow

1. User submits username and password to `POST /api/auth/login`.
2. Backend calls `getUserByUsername()` → returns the full `app_users` row.
3. `bcrypt.compare(password, user.password)` is run. On mismatch → `401`.
4. On success, the user object is returned **without the password field** (destructured out).
5. React stores the user object in `useState(null)`. The object is lost on page refresh (no token or session persistence).

### Role checks

Every protected route is guarded by `checkRole(allowedRoles)` middleware:

1. Reads `x-user-id` integer from request header.
2. If absent → `401 Unauthorized`.
3. Queries `SELECT role, id, fullName FROM app_users WHERE id = ?`.
4. If no row → `401 Unauthorized`.
5. If user's role not in `allowedRoles` array → `403 Forbidden`.
6. Attaches `req.user = { id, role, fullName }` and calls `next()`.

**Role is always verified from the database, never trusted from the client.** The weakness is that `x-user-id` itself is an unauthenticated integer — any client could forge this header. This is a known limitation for a prototype at this stage.

### Access controls

| Route | Allowed Roles | Additional Guard |
|---|---|---|
| `POST /api/auth/login` | None (public) | — |
| `GET /api/projects` | student, supervisor | Students filtered to own `student_id` |
| `GET /api/projects/:id` | student, supervisor | Students blocked from other students' projects (403) |
| `POST /api/projects` | student only | — |
| `PUT /api/projects/:id` | student only | Ownership + `revisionRequested` status lock |
| `PUT /api/projects/:id/review` | supervisor only | Status ENUM validated |

---

## 7. Protected Action Explanation

**Protected action:** Supervisor feedback and status update — `PUT /api/projects/:id/review`

This is the core case-specific protected action. Students must never be able to approve their own projects or write supervisor feedback.

| Guard | Implemented | Code Location |
|---|:---:|---|
| `checkRole(['supervisor'])` applied to route | ✅ | `projectRoutes.js` L152 |
| Role verified against database (not client claim) | ✅ | `checkRole()` middleware L15–16 |
| Status must be a valid ENUM value | ✅ | `validStatuses` array check L157–159; returns 400 if invalid |
| Feedback and status written only via this route | ✅ | `updateProjectStatusAndFeedback()` called only here |
| `updateProjectFields()` (student route) excludes `status` and `feedback` | ✅ | `projectService.js` L89–94 — only student-editable fields |
| Student UI hides the review form entirely | ✅ | Review panel JSX only rendered in supervisor branch (`App.jsx` L483–568) |
| Student blocked at API level (test verified) | ✅ | Test #5: `x-user-id: 1` (Alice) → 403 |
| Supervisor identity matched to submission's `supervisorName` | ❌ | Not implemented — any supervisor can review any project |
| Feedback required for terminal decisions | ❌ | `feedback` is optional (nullable TEXT); no server-side enforcement |

---

## 8. Validation Summary

| Rule | Frontend | Backend | Test Covered |
|---|---|---|---|
| Required: `title`, `description`, `category`, `supervisorName`, `submittedDate` | ✅ HTML `required` + JS guard | ✅ `validateProjectPayload` middleware; returns 400 | ✅ Test #2 |
| Date format: `submittedDate` must be parseable | ✅ `type="date"` constrains input | ✅ `Date.parse()` check in `validateProjectPayload`; returns 400 | ⚠️ Not explicitly tested |
| Status ENUM: must be one of 5 valid values | ✅ `<select>` in review form | ✅ `validStatuses` array; returns 400 | ✅ Test #5 |
| Student edit locked to `revisionRequested` status | ✅ Edit button only shows for `revisionRequested` | ✅ Route check; returns 403 | ✅ Test #4 |
| Ownership: student can only edit own project | ✅ Own projects list only | ✅ `project.student_id !== req.user.id` check; returns 403 | ✅ Test #3 |
| SQL injection protection | — | ✅ Parameterised `?` placeholders throughout all service queries | — |
| Feedback minimum length | ❌ Not enforced | ❌ Not enforced | — |
| Duplicate submission prevention | ❌ Not present | ❌ Not present | — |

> **Change after Mid-Review:** Date format validation was added to the backend. The Mid-Review identified this as gap M3. The `validateProjectPayload` middleware now uses `Date.parse()` and returns HTTP 400 for unparseable values.

---

## 9. Automated and Manual Testing Summary

### Automated test command

```bash
npm test                          # from project root
# equivalent to:
npm test --prefix backend         # runs: node --test tests/api.test.js
```

### Test file

`backend/tests/api.test.js` — 292 lines, uses Node.js built-in `node:test` and `node:assert`. No external test framework is required.

### Test setup and teardown

- `test.before()`: Verifies DB connectivity (`SELECT 1`); cleans any leftover `TEST:` rows from previous runs; starts the Express app on a random free port.
- `test.after()`: Deletes all rows with `title LIKE 'TEST:%'`; closes the HTTP server.
- Test data is isolated by the `TEST:` title prefix convention.

### Test results (2026-06-14, live run)

```
Database connection is OK.
Test server started on port 10248
✔ 1. Authentication: Database-backed Login Checks (245.59ms)
✔ 2. Submission Workflow: Create & Validate Submissions (13.56ms)
✔ 3. Retrieval & Access Controls: View & Filter (17.23ms)
✔ 4. Update Workflow: Edit Metadata & Access Checks (20.28ms)
✔ 5. Review & Lifecycles: Protected Action Checks (Supervisor) (13.59ms)
✔ 6. Filters: Apply supervisor, category, and status searches (3.60ms)
Test server closed.
Result: 6 passed, 0 failed
```

### What each suite checks

| Suite | What it checks |
|---|---|
| 1 | Wrong password → 401; valid student login → 200 + role/fullName; valid supervisor login → 200 + role |
| 2 | Missing fields → 400; supervisor submitting → 403; valid student submission → 201 + ID |
| 3 | Student list returns only own projects; student accessing another student's project by ID → 403; supervisor sees all students' projects |
| 4 | Student update blocked when status is `submitted` → 403; supervisor sets `revisionRequested`; student update succeeds; verifies title/description saved and status reset to `submitted` |
| 5 | Student attempts review → 403; invalid status value → 400; supervisor approves with feedback → 200; DB verification confirms `status` and `feedback` persisted |
| 6 | Filter by `status=approved` returns only approved records; filter by `category=Artificial Intelligence` returns only matching records |

### Gaps not covered by automated tests

- Backend rejection of an invalid date format (e.g., `submittedDate: "not-a-date"`) — partially covered by middleware code; no test assertion.
- Supervisor filter applied to a student's own list.
- Non-existent `x-user-id` value (e.g., `x-user-id: 999`) returning 401 — middleware code handles it but no test asserts it.

### Manual checks required

| Check | Status |
|---|---|
| Frontend prevents students from seeing or interacting with status/feedback controls | Manual — Review panel JSX is not rendered for students |
| `.env` DB credentials not visible in browser Network tab or React bundle | Manual — confirmed by code inspection: no `process.env.DB_*` in frontend |
| Page refresh clears session (no token persistence) | Manual — `useState` holds user; reload loses state |
| Open CORS observable in Network tab | Manual — `cors()` with no origin restriction in `server.js` L11 |
| Supervisor can review any project (cross-supervisor test) | Manual — no backend guard on `supervisorName` match |

---

## 10. Stage 11 Change Summary

The following changes were made after the Mid-Review (Stage 7):

### Resolved from Mid-Review issues

| Mid-Review Issue | Resolution |
|---|---|
| H4 — Student can edit after approval/rejection (no status lock) | ✅ Fixed: `PUT /:id` now requires `status === 'revisionRequested'` (L131–133 of `projectRoutes.js`) |
| M3 — No backend date-format validation | ✅ Fixed: `validateProjectPayload` middleware uses `Date.parse()` (L44–47) |
| M5 — No test runner, no test scripts | ✅ Fixed: `api.test.js` added with 6 suites; `test` script in both `package.json` files |

### New additions since Mid-Review

- `validateProjectPayload` extracted as a named middleware (reused on `POST` and `PUT` routes) — improves maintainability.
- `revisionRequested` status added to the 5-value ENUM (was only 4 values in `REQUIREMENTS.md`) — this is a workflow enhancement.
- `PUT /api/projects/:id` now resets status to `submitted` on successful student update (via `updateProjectFields` setting `status = 'submitted'` in the SQL).
- Edit button in student UI appears **only** for `revisionRequested` projects (L466–476 of `App.jsx`).
- Test data cleanup using `TEST:` prefix pattern.

### Still unresolved from Mid-Review

| Mid-Review Issue | Status |
|---|---|
| C1 — `x-user-id` unauthenticated (impersonation possible) | ⚠️ Remains — acceptable for prototype scope |
| C2 — Session lost on page refresh (no token) | ⚠️ Remains — acceptable for prototype scope |
| H1 — Open CORS | ⚠️ Remains |
| H2 — No rate limiting on login | ⚠️ Remains |
| H3 — No `helmet` | ⚠️ Remains |
| H5 — Any supervisor can review any project | ⚠️ Remains |
| M1 — `db.js` fallback name mismatch | ⚠️ Remains |
| M2 — Supervisor/category lists hard-coded in JSX | ⚠️ Remains |
| M4 — "Web Applications" category in UI not in seed data | ⚠️ Remains |
| L1 — Stale "Simple mock login" comment | ⚠️ Remains |
| L2 — `App.jsx` single 578-line monolith | ⚠️ Remains |
| L3 — No concurrent dev command | ⚠️ Remains |
| L4 — `App.css` unused | ⚠️ Remains |
| L5 — README setup order inverted | ⚠️ Remains |

---

## 11. Stage Drift and Early Work

No feature drift was detected.

- No JWT, OAuth, or persistent sessions (expected to be out of scope for this prototype).
- No file upload handling, email notifications, or audit log.
- No pagination or advanced search.

Items present earlier than their typical stage:
- `bcryptjs` password hashing — present since initial stages; appropriate and beneficial.
- `.env.example` template — good practice; not strictly required at the early build stage.
- `validateProjectPayload` middleware extracted before a refactoring stage would normally require it — a positive maintainability choice.

The `revisionRequested` status (fifth ENUM value) was not listed in `REQUIREMENTS.md §4` which only mentions four values (`submitted`, `underReview`, `approved`, `rejected`). It is used by the application and tested. This is an **undocumented extension** rather than a bug — it improves the workflow — but `REQUIREMENTS.md` was never updated to reflect it.

---

## 12. Security Risks and Exposed-Secret Check

### Exposed secrets check

| Item | Risk | Finding |
|---|---|---|
| `backend/.env` committed to source | 🔴 Risk if in a Git repo | `.gitignore` not present at root; `frontend/.gitignore` does not cover `backend/.env`; `.env` could be committed |
| DB password printed in logs | ✅ Safe | `db-setup.js` and `db.js` do not log credentials |
| DB credentials in React bundle | ✅ Safe | No `process.env.DB_*` references in frontend source |
| Passwords in API responses | ✅ Safe | `authRoutes.js` L23 destructures `password` out before sending response |
| Passwords in test code | ✅ Safe | Test uses `password123` (seed/demo credential only) |
| `DB_PASSWORD` value | — | Not printed in this review (value is present in `.env` but is the local root password for a dev instance) |

### Known security weaknesses (prototype-acceptable)

| Risk | Severity | Detail |
|---|---|---|
| `x-user-id` is an unauthenticated integer header | High | Any client can impersonate any user by setting this header to a different value. A JWT or signed session cookie is needed to bind identity to the login event. |
| No session or token persistence | High | User is held in React `useState` only; lost on page refresh; no server-side session to invalidate. |
| Open CORS (`cors()` with no origin) | Medium | Any origin can make cross-origin requests to the API. Should be restricted to the known frontend origin in production. |
| No rate limiting on login endpoint | Medium | Brute-force attacks against `/api/auth/login` are possible. |
| No `helmet` security headers | Low | No `X-Content-Type-Options`, `X-Frame-Options`, `Content-Security-Policy`, etc. |
| Supervisor can review any project | Low | No check that `supervisorName` on submission matches the logged-in supervisor's `fullName`. |

---

## 13. Documentation / Code Mismatches

| # | Location | Mismatch |
|---|---|---|
| 1 | `authRoutes.js` L6 | Comment reads "Simple mock login endpoint" but login is fully database-backed with bcrypt. |
| 2 | `REQUIREMENTS.md` §4 (Status Constraints) | Lists only 4 status values (`submitted`, `underReview`, `approved`, `rejected`). Code and DB ENUM contain a 5th: `revisionRequested`. |
| 3 | `README.md` (Setup Instructions) | Step 1 says run `db:setup`, Step 2 says configure `.env`. Correct order is: configure `.env` first, then run `db:setup`. |
| 4 | `db.js` L9 | Fallback database name is `student_project_tracker`; `.env` and `db-setup.js` both use `c9p3`. |
| 5 | `PROJECT_CONTEXT.md` (Status Options) | Documents status values as "Pending, Approved, Needs Revision" — legacy names. Actual values are `submitted`, `underReview`, `approved`, `rejected`, `revisionRequested`. |
| 6 | `App.jsx` L312 / filter dropdown | "Web Applications" category option in both the submission form and the filter dropdown; no seed data uses this category. |

---

## 14. Known Limitations

1. **No persistent session or token.** Logging in and then refreshing the browser returns the user to the login screen. Fixing this requires adding JWT tokens or server-side sessions.
2. **`x-user-id` is forgeable.** Any HTTP client can impersonate any user by setting a different integer. Production use requires a signed token.
3. **Supervisor identity not matched to submission.** Any logged-in supervisor can review and change the status of any student's project, regardless of who the nominated `supervisorName` is.
4. **No duplicate submission prevention.** A student can submit the same project title multiple times without error.
5. **Hard-coded supervisor and category lists.** Adding new supervisors or categories requires editing `App.jsx` in multiple places. These should be DB-driven or configurable.
6. **`App.jsx` is a monolith.** All state, handlers, and view rendering are in one 578-line file. Splitting into components would improve testability and readability.
7. **No UI tests.** Only backend HTTP integration tests exist. Frontend behaviour (button visibility, form guards) can only be verified manually.
8. **No concurrent dev command.** Backend and frontend must be started in separate terminals.
9. **Feedback is optional.** A supervisor can change a project's status to `approved` or `rejected` without providing any written feedback. The spec does not require it, but it may cause confusion for students.
10. **`backend/.gitignore` not confirmed.** There is no `.gitignore` at the project root; if the repo is ever initialised, `backend/.env` could be accidentally committed.

---

## 15. Demo Script

Use this script to demonstrate the complete workflow end-to-end in a live session.

### Prerequisites
- MySQL is running locally.
- `backend/.env` is configured with correct credentials.
- `npm run db:setup` has been run from the project root.
- `npm run dev:backend` and `npm run dev:frontend` are both running in separate terminals.
- Open `http://localhost:5174` in a browser.

---

### Step 1 — Student submits a project

1. Log in as **alice_student** / `password123`.
2. Confirm the dashboard shows only Alice's own submissions (no other students' projects visible).
3. Fill in the "Submit New Project" form:
   - Title: `Smart Attendance System`
   - Description: `An AI-powered face-recognition attendance tracker.`
   - Category: `Artificial Intelligence`
   - Supervisor: `Prof. John Doe`
   - Date: today's date
4. Click **Submit Project**.
5. Confirm the new submission appears in "My Submissions" with status badge **submitted**.
6. Note the **Edit Details & Resubmit** button is **not** visible (project is `submitted`, not `revisionRequested`).

---

### Step 2 — Student cannot edit feedback or approve

1. While still logged in as Alice, open the browser DevTools → Network tab.
2. Show that there is no "Review Panel" or status-change control in the student UI.
3. *(Optional for technical audience)* Show via curl/Postman that calling `PUT /api/projects/<id>/review` with `x-user-id: 1` returns **403 Forbidden**.

---

### Step 3 — Supervisor reviews and requests revision

1. Log out, then log in as **supervisor_john** / `password123`.
2. Confirm all submissions from all students are visible.
3. Click on `Smart Attendance System` in the list.
4. In the Review Panel, change status to **Revision Requested**.
5. Enter feedback: `Please clarify the hardware requirements in the description.`
6. Click **Save Review Decision**.
7. Confirm the badge in the list updates to **revisionRequested**.

---

### Step 4 — Student responds to revision request

1. Log out, then log in as **alice_student** / `password123`.
2. Find `Smart Attendance System` — confirm status badge shows **revisionRequested** and the supervisor feedback box is visible with the text `Please clarify the hardware requirements in the description.`
3. Click **Edit Details & Resubmit**.
4. Update the description to include: `Uses a Raspberry Pi 4 with a Pi Camera module.`
5. Click **Save Changes**.
6. Confirm the status resets to **submitted** and the edit form clears.

---

### Step 5 — Supervisor approves

1. Log out, then log in as **supervisor_john** / `password123`.
2. Click on `Smart Attendance System`.
3. Change status to **Approved** and add feedback: `All concerns addressed. Approved for final presentation.`
4. Click **Save Review Decision**.

---

### Step 6 — Demonstrate filters

1. As supervisor, use the filter bar:
   - Filter by **Supervisor: Prof. John Doe** — confirm only John's assigned projects appear.
   - Filter by **Status: Approved** — confirm only approved projects appear.
   - Filter by **Category: Artificial Intelligence** — confirm correct results.
2. Click **Clear Filters** to reset.

---

### Step 7 — Run automated tests

1. In a terminal at the project root:
   ```bash
   npm test
   ```
2. Show all 6 suites passing with no failures.
3. Explain the `TEST:` prefix cleanup convention visible in the test setup and teardown hooks.

---

## 16. Suggested Viva Questions

### Architecture and separation

1. Why is the database configuration kept in `.env` and not hard-coded in the source file? What would happen if `.env` were committed to a public repository?
2. You have a `db.js` fallback database name of `student_project_tracker` but your `.env` uses `c9p3`. When would that fallback activate and what would the effect be?
3. Explain why React never connects to MySQL directly. What is the role of Express in the data flow?
4. The frontend uses `API_BASE = 'http://localhost:5000/api'`. What change would be needed to deploy this to a remote server?

### Role control and security

5. Walk through exactly what happens when a student calls `PUT /api/projects/1/review`. Which code rejects it and at what HTTP status code?
6. `x-user-id` is sent from the browser as a plain integer. Why is this a security weakness? What would you add to prevent user impersonation?
7. Your `checkRole()` middleware queries the database on every single API request. What are the advantages and disadvantages of this approach versus trusting a signed token?
8. Can a student change the `status` field of their own project by sending a modified request body to `PUT /api/projects/:id`? Prove it from the code.

### Workflow and data integrity

9. Explain the `revisionRequested` status. How does a project get into that state, and what does the system allow the student to do after that?
10. What happens to the `status` field when a student successfully edits and resubmits a project? Where is this logic implemented?
11. Can a student submit a project after it has been approved? What would happen if they tried to call the edit endpoint?
12. Supervisor Jane is logged in. Can she review a project that was submitted to Supervisor John? What would you add to the backend to prevent this?

### Testing

13. How does the test suite ensure it does not permanently pollute the database? Show the cleanup mechanism.
14. Which testing framework is used and why does it require no additional installation?
15. Test suite #4 checks that a student's edit is blocked while the status is `submitted`. Explain exactly what the test does step-by-step, including the sequence of API calls.
16. Which scenario is NOT covered by the automated tests that you would add next, and why?

### Database and persistence

17. If the MySQL server is shut down and restarted, do the tables and data persist? How would you recreate everything from scratch?
18. The `project_submissions` table has a `student_id` foreign key to `app_users` with `ON DELETE CASCADE`. What does this mean in practice?
19. Why is `supervisorName` stored as a free-text string in `project_submissions` rather than as a foreign key to `app_users`? What problems does this cause?

### Maintainability and design

20. All your application code is in a single `App.jsx` file. What refactoring would you do next, and how would you decide where to split it?
21. The supervisor dropdown in the submission form is hard-coded. How would you make it database-driven, and which API endpoint would you need to add?
22. Why is there a `services/` layer in the backend, and what would happen if you put all the SQL directly inside the route handlers?

---

*End of Final Review — Student Project Tracker*
