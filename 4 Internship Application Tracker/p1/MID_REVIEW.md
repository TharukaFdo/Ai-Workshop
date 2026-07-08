# Mid-Project Review — Internship Application Tracker (p1)

**Review date:** 2026-07-08
**Stage at review:** After secondary feature (filter by company / status). Before testing, security hardening, and maintainability cleanup.
**Reviewer:** Antigravity (automated code review — read-only)

---

## 1. Mid-Review Summary

The project is a well-structured React + Express + MySQL prototype. The separation of concerns between frontend and backend is clean, the main workflow (submit → review → approve/reject) is implemented end-to-end, and the secondary filter feature is in place. The most significant risk before the next stages is that `schema.sql` is **out of sync** with `seed.js` and the running application — the schema file lacks a `users` table and a `student_id` column, making it unusable as a standalone setup document. Authentication uses plain-text passwords with no token or session, which is expected at this prototype stage but must be flagged. Role enforcement exists in the backend but relies entirely on a custom header (`x-user-id`) that any client can forge, making it header-spoofable without a session or JWT. No automated tests exist. Overall the application is functional for a prototype at this stage with contained, well-understood gaps.

---

## 2. Review Scoring Matrix

> **Score meaning:** 0 = missing · 1 = present but mostly not working · 2 = partially working with major gaps · 3 = mostly working with important gaps · 4 = working with minor gaps · 5 = complete for the selected case scope
> **Testing Evidence column:** scores test readiness and any test hooks that already exist — not test results.

| Feature / Area | Functionality 0-5 | Data Persistence 0-5 | Backend Security / Role Control 0-5 | Validation / Error Handling 0-5 | Testing Evidence 0-5 | Maintainability 0-5 | UI / Manual Usability 0-5 | Evidence | Notes |
|---|---:|---:|---:|---:|---:|---:|---:|---|---|
| Project setup and run commands | 4 | — | — | — | 1 | 3 | — | `backend/package.json` has `start`, `dev`, `seed` scripts; `frontend/package.json` has `dev`. No root-level `package.json` or README with combined start instructions. | Two separate `npm run dev` commands required; no orchestration script or README. |
| Database setup and starter data | 3 | 4 | — | — | 1 | 2 | — | `seed.js` creates DB, both tables, and seeds 3 users + 4 applications repeatably. `schema.sql` exists but is incomplete (missing `users` table, missing `student_id` column). | `schema.sql` is a stale artifact that mismatches the actual running schema in `seed.js`. DB_NAME in `.env` is `c4p1`; `.env.example` says `internship_tracker`; seed defaults to `c4p1`. |
| Login workflow | 4 | 4 | 2 | 3 | 1 | 3 | 4 | `POST /api/auth/login` queries `users` table with username + password. Returns `id`, `username`, `role`. Frontend stores the result in `localStorage`. Login error displayed in UI. | Plain-text password comparison in SQL. No password hashing (bcrypt/argon2). No JWT or server-side session — only a stateless `x-user-id` header. Logout is client-side only. |
| Role-based access | 3 | — | 2 | 2 | 1 | 3 | 4 | Backend `authenticate` middleware in `applications.js` re-queries `users` table on every request using `x-user-id` header. Role checked per route. UI conditionally renders student vs coordinator views. | `x-user-id` is a plain integer header — any client can send any user ID. No HMAC, JWT, or session cookie to bind the header to an authenticated session. Role check is correct given the ID, but the ID itself is unauthenticated. |
| Main create action | 4 | 5 | 4 | 3 | 1 | 4 | 4 | `POST /api/applications` enforces `role === 'student'`, validates all five required fields, inserts with `student_id = req.user.id`, returns `applicationId`. Frontend form with all required fields and submit feedback. | No date-logic validation (end_date > start_date). No maximum-length enforcement. `student_name` is a free-text field not tied to the authenticated user's display name. |
| Main view/list action | 4 | 5 | 4 | 3 | 1 | 4 | 4 | `GET /api/applications` returns all applications for coordinators; filters to `student_id = req.user.id` for students. Results ordered by `submitted_date DESC`. Both roles have a list view in the UI. | No pagination. `SELECT *` used on `applications` table only (safe — no password column). |
| Main update/status/cancel action | 4 | 5 | 4 | 3 | 1 | 4 | 4 | `PUT /api/applications/:id` enforces `role === 'coordinator'`, validates status enum, checks application exists, updates status and comments. UI review panel updates list after save. | No student cancel/withdraw action exists (not in case brief, acceptable). No check that the new status is a valid progression (e.g., cannot go back to `submitted` from `approved`). |
| Protected action | 4 | 5 | 3 | 3 | 1 | 4 | 4 | Only coordinators can call `PUT /api/applications/:id`. Students receive HTTP 403 if they attempt it. UI only shows the "Review" button and form to the coordinator role. | Protection relies on `x-user-id` header spoofability. A student who knows a coordinator's numeric ID can act as coordinator. |
| Secondary feature | 4 | — | 4 | 3 | 1 | 4 | 4 | `GET /api/applications` accepts `?status=` and `?company_name=` query params. Backend uses parameterised `LIKE` for company and exact match for status. Both filter controls exist in the UI for both roles and trigger re-fetch via `useEffect`. | Filters are applied on every keystroke via `useEffect`, causing a new HTTP request per character typed in the company field (no debounce). |
| Case-specific: internship company, position, and date fields | 4 | 5 | 4 | 3 | 1 | 4 | 4 | All five case-required fields (`company_name`, `position_title`, `start_date`, `end_date`, plus `submitted_date` auto-set) exist in DB schema (seed), in the POST route, and in both UI forms (submit and display). | No date-range validation (end must be after start). `submitted_date` is server-set (correct), not user-editable. |
| Case-specific: application status review lifecycle | 4 | 5 | 4 | 3 | 1 | 4 | 4 | Status ENUM is `submitted`, `under_review`, `approved`, `rejected`. All four states are selectable in the coordinator review panel. Status is validated against the enum on PUT. Status badges with colour coding shown to both roles. | No lifecycle transition rules enforced (any status → any status allowed). No timestamp recorded when status changes. |
| Case-specific: coordinator comments and approval/rejection protection | 4 | 5 | 3 | 3 | 1 | 4 | 4 | Comments field stored as `TEXT` in DB. PUT route is coordinator-only (HTTP 403 for students). No comment field exposed in the student submission form. Students can read but not write comments. | Same header-spoofability gap as role-based access. Sending `coordinator_comments: null` in PUT will clear existing comments — behaviour not clearly documented. |
| UI / manual usability | 4 | — | — | 3 | 1 | 3 | 4 | Dark glassmorphism design, Outfit font via Google Fonts, gradient title, status colour badges, loading states, success/error feedback messages, demo credentials shown on login screen. | No aria-label or accessibility attributes. Filter fires on every character (no debounce). No confirmation dialog before save. |
| Security posture | 2 | — | 2 | 2 | 1 | 2 | — | `dotenv` used; DB credentials in `.env` (backend only). CORS enabled globally with no origin restriction. Parameterised queries used (no SQL injection risk). | Plain-text passwords. No JWT or session. `x-user-id` header is spoofable. Wide-open CORS. `.env` appears committed. No rate limiting. No helmet/CSP headers. |
| Testing evidence | 0 | 0 | 0 | 0 | 0 | 0 | 0 | No test files, no test runner configured, no test scripts in either `package.json`. `/api/health` endpoint exists as a useful manual smoke-test hook. | Zero test coverage. No test framework installed. Health check endpoint is the only built-in probe. |
| Maintainability | 3 | — | — | — | — | 3 | — | Code is modular (routes split into `auth.js` and `applications.js`). Inline styles dominate the JSX (638-line single-file component). No README. `schema.sql` is stale. DB_NAME mismatch between `.env` and `.env.example`. | Entire React app is one 638-line `App.jsx`. No component decomposition. No shared API helper layer in frontend. |

---

## 3. Current Feature Status

| Feature | Implemented | Notes |
|---|---|---|
| Student submits application | Yes | All required fields present; backend enforces student-only |
| Student views own applications | Yes | Backend scopes to `student_id`; list rendered in UI |
| Student sees application status | Yes | Status badge displayed with colour coding |
| Student sees coordinator comments | Yes | Read-only display in student card |
| Coordinator views all applications | Yes | No row-level scoping for coordinator (correct) |
| Coordinator changes application status | Yes | All four statuses selectable; PUT route validates |
| Coordinator adds/edits comments | Yes | Textarea in review panel; stored in DB |
| Filter by company name | Yes | Backend LIKE query; UI text input |
| Filter by application status | Yes | Backend exact match; UI select dropdown |
| Student cannot approve/reject | Yes | HTTP 403 on PUT; UI hides review form for students |
| Student cannot edit coordinator comments | Yes | No comment field in student UI; backend only accepts updates from coordinators |

---

## 4. Database and Persistence Status

### Tables

| Table | Defined in schema.sql | Defined in seed.js | In use by routes |
|---|---|---|---|
| `users` | Missing | Yes | Yes (auth.js, applications.js) |
| `applications` | Partial (missing student_id, no FK) | Full (with student_id, FK) | Yes |

### Key Fields

| Field | schema.sql | seed.js | Routes |
|---|---|---|---|
| `student_id INT NOT NULL` | Missing | Present | Used in GET scope and POST insert |
| `coordinator_comments TEXT` | Present | Present | Used in PUT |
| `status ENUM(…)` | Present | Present | Used in GET filter and PUT update |
| `submitted_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP` | Present | Present | Used in ORDER BY |

### DB_NAME Mismatch

- `backend/.env` — `DB_NAME=c4p1`
- `backend/.env.example` — `DB_NAME=internship_tracker`
- `seed.js` line 15 — defaults to `c4p1` if `DB_NAME` not set

The running `.env` and seed script agree on `c4p1`, but `.env.example` gives a different value. A developer following the example file will connect to a different database than the one seeded.

### Seed Command

`npm run seed` (run in `backend/`) — creates the database, drops and recreates both tables, inserts 3 users and 4 applications. Repeatable and destructive. No separate migration or rollback mechanism.

---

## 5. Login and Role/Access Status

### Login Implementation

| Check | Status | Detail |
|---|---|---|
| Login backed by `users` DB table | Pass | `SELECT … WHERE username = ? AND password = ?` |
| Password hashing (bcrypt / argon2) | Fail | Plain-text comparison |
| Session or JWT issued on login | Fail | Only user object returned and stored in `localStorage` |
| Logout invalidates server session | Fail | Client-side only: removes from `localStorage` |
| Frontend persists login across refresh | Pass | `localStorage` + `useState` initialiser |

### Role Enforcement

| Check | Status | Detail |
|---|---|---|
| Role stored in `users` table | Pass | `ENUM('student', 'coordinator')` |
| Role checked in backend per route | Pass | `authenticate` middleware + per-route role guard |
| Role check uses DB-backed user record | Pass | Middleware re-queries `users WHERE id = ?` on every request |
| Session/token ties identity to role | Fail | Identity is the `x-user-id` header value — client-supplied integer, unauthenticated |
| UI-only role gating | Supplementary | UI hides coordinator controls from student, but backend is the real gate |

### Authentication Gap (Critical for Security Stage)

The `x-user-id` header is a plain integer. Nothing prevents a student from sending `x-user-id: <coordinator_id>` to gain coordinator access. This is a **header-spoofing vulnerability** that must be addressed in the security hardening stage by replacing the header with a signed JWT or a server-side session cookie.

---

## 6. Protected Action Status

**Protected action:** Add or edit coordinator comments; approve or reject applications (`PUT /api/applications/:id`).

| Check | Status | Detail |
|---|---|---|
| Coordinator-only route enforcement | Pass | `if (req.user.role !== 'coordinator') return 403` |
| Role resolved from DB, not from body | Pass | `authenticate` middleware fetches user from DB using header ID |
| Student UI hides review controls | Pass | Conditional render on `user.role` |
| Student cannot submit status change via API | Pass | Returns HTTP 403 |
| Protection resistant to header spoofing | Fail | If a student knows or guesses a coordinator's numeric ID, they can set the header to that value |
| Comments field absent from student submission route | Pass | `POST /api/applications` never reads or writes `coordinator_comments` |

---

## 7. Validation Status

### Backend Validation

| Rule | Route | Present | Notes |
|---|---|---|---|
| All five required fields non-empty | POST /api/applications | Yes | Simple truthiness check |
| Status must be a known ENUM value | PUT /api/applications/:id | Yes | Explicit allowlist check |
| Application must exist before update | PUT /api/applications/:id | Yes | Pre-fetch + 404 |
| Username and password required for login | POST /api/auth/login | Yes | Non-empty check |
| Only coordinator can PUT | PUT /api/applications/:id | Yes | Role guard |
| Only student can POST | POST /api/applications | Yes | Role guard |
| `end_date` must be after `start_date` | POST /api/applications | No | Missing |
| Field length limits | All routes | No | No maxLength enforcement beyond DB column type |
| `start_date` / `end_date` are valid date strings | POST /api/applications | No | DB will reject invalid formats but no informative error message returned |

### Frontend Validation

| Rule | Present | Notes |
|---|---|---|
| HTML `required` on all form fields | Yes | All five application fields and both login fields |
| Date inputs use `type="date"` | Yes | Browser-enforced date picker |
| Status select restricted to known values | Yes | `<option>` elements only |
| End date after start date | No | No `min` attribute set on `end_date` based on `start_date` |
| Error messages displayed from API | Yes | `loginError`, `submitError`, `reviewError` shown in UI |

---

## 8. Stage Drift — Early Implementation

The following items were not expected at the secondary-feature stage but were found in the codebase.

| Item | Found | Expected stage | Risk |
|---|---|---|---|
| `/api/health` endpoint with DB connectivity check | Yes | Ops/testing stage | Low — useful, no harm |
| `student_id` FK in `applications` table with `ON DELETE CASCADE` | Yes | DB design stage (appropriate) | Low — correct design |
| Inline demo credentials on login screen | Yes | Dev convenience | Low — should be removed before any non-prototype deployment |
| `nodemon` included as devDependency | Yes | Dev tooling (appropriate) | None |
| `.env.example` committed | Yes | Good practice | None — correct |

No advanced features (file upload, email notifications, supervisor accounts) were implemented ahead of schedule. Stage drift is minimal.

---

## 9. Issues Found Before Stage 8

### Critical

| # | Issue | Location | Impact |
|---|---|---|---|
| C1 | `x-user-id` header is not authenticated — any client can send any user ID including a coordinator ID | `backend/routes/applications.js` line 7 | Any user can impersonate any other user, bypassing all role guards |
| C2 | Passwords stored and compared as plain text | `backend/routes/auth.js` line 15, `backend/seed.js` line 54 | Password compromise in DB exposes all credentials immediately |

### High

| # | Issue | Location | Impact |
|---|---|---|---|
| H1 | `schema.sql` is out of sync with the actual schema used by the app | `schema.sql` lines 4–14 | Running `schema.sql` creates an `applications` table without `student_id`, breaking the app; no `users` table exists in it — manual setup from `schema.sql` will fail |
| H2 | `DB_NAME` mismatch between `.env` (`c4p1`) and `.env.example` (`internship_tracker`) | `backend/.env` line 5, `backend/.env.example` line 5 | A new developer copying `.env.example` will point to the wrong database |
| H3 | CORS is wide-open (`app.use(cors())` with no origin allowlist) | `backend/server.js` line 9 | Any origin can make requests to the backend |
| H4 | `.env` file appears to be committed to the project (no `.gitignore` found) | `backend/.env` | DB credentials exposed if the project is pushed to a remote repository |

### Medium

| # | Issue | Location | Impact |
|---|---|---|---|
| M1 | No `end_date > start_date` validation in backend or frontend | `backend/routes/applications.js` line 72, `frontend/src/App.jsx` line 388 | Invalid date ranges can be stored |
| M2 | Company name filter fires a new HTTP request on every keypress (no debounce) | `frontend/src/App.jsx` line 78 | Excessive backend calls while typing |
| M3 | `student_name` is a free-text field not linked to the authenticated user's own name | `backend/routes/applications.js` line 69 | A student can submit an application under any name |
| M4 | `coordinator_comments: null` in a PUT request will clear any existing comment | `backend/routes/applications.js` line 121 | Unintended comment erasure if the UI sends null |
| M5 | No status-transition rules (any state can go to any state) | `backend/routes/applications.js` line 103 | A coordinator can set an `approved` application back to `submitted` |
| M6 | No pagination on application list | `backend/routes/applications.js` line 55 | Performance degradation if the dataset grows |

### Low / Maintainability

| # | Issue | Location | Impact |
|---|---|---|---|
| L1 | Entire React app is one 638-line `App.jsx` file | `frontend/src/App.jsx` | Difficult to read, test, or maintain; no component decomposition |
| L2 | All JSX styling uses inline style objects | `frontend/src/App.jsx` (throughout) | Fragile, verbose, hard to theme; CSS classes defined in `index.css` but largely unused in JSX |
| L3 | No `README.md` with setup instructions | Project root | New contributor cannot set up the project without reading code |
| L4 | No `.gitignore` found | Project root / `backend/` | `node_modules`, `.env`, and other artefacts may be committed |
| L5 | `SELECT *` in authenticate middleware fetches all user columns including `password` into `req.user` | `backend/routes/applications.js` line 13 | Password is attached to every request object |
| L6 | No shared API base URL or fetch wrapper in frontend | `frontend/src/App.jsx` | Hardcoded relative paths throughout; changing API prefix requires multiple edits |

---

## 10. Manual Checks Recommended Next

These checks cannot be confirmed by static code analysis alone and should be verified before moving to the testing stage.

1. **Run `npm run seed` in `backend/`** — confirm it creates the `c4p1` database, both tables, and all seed rows without error.
2. **Start backend (`npm run dev` in `backend/`) and frontend (`npm run dev` in `frontend/`)** — confirm both start without errors.
3. **Log in as `student1 / password`** — confirm only own applications appear (2 records: Google, Meta).
4. **Log in as `student2 / password`** — confirm only own applications appear (2 records: Amazon, Netflix).
5. **Log in as `coordinator1 / password`** — confirm all 4 applications appear.
6. **Filter by company "Google"** — confirm only the Google record appears.
7. **Filter by status "approved"** — confirm only the Amazon record appears.
8. **As coordinator, click Review on the Google application** — change status to `under_review`, add a comment, save — confirm list updates.
9. **Attempt `PUT /api/applications/1` with `x-user-id: <student_id>` via curl or Postman** — confirm HTTP 403 is returned.
10. **Attempt `PUT /api/applications/1` with `x-user-id: <coordinator_id>` while acting as a student** — confirm it succeeds (documents header-spoofing gap C1 for the security stage).
11. **Attempt `GET /api/applications` with `x-user-id: <student2_id>` while acting as student1** — confirm student2's records are returned (documents C1 scope).
12. **Submit an application with `end_date` before `start_date`** — confirm it is accepted (documents M1 for the validation stage).
13. **Open `schema.sql` directly in MySQL** — confirm it fails or produces an incomplete schema (documents H1).

---

## 11. Pass/Fail Table

| Check | Result | Notes |
|---|---|---|
| App appears runnable | PASS | Both `npm run dev` commands present; `node_modules` installed; no obvious syntax errors |
| React and Express are separated | PASS | `frontend/` (Vite + React) and `backend/` (Express) are distinct directories |
| React calls Express routes, never MySQL directly | PASS | All `fetch()` calls in `App.jsx` target `/api/…`; no MySQL client in frontend |
| Backend uses all five required env vars for MySQL | PASS | `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME` all used in `db.js` |
| DB secrets not exposed in React | PASS | `.env` is in `backend/` only; frontend has no `.env`; Vite proxy used |
| `applications` table exists with required fields | PASS (seed) / FAIL (schema.sql) | Seed creates correct table; `schema.sql` is missing `student_id` |
| `users` / login table exists | PASS (seed) / FAIL (schema.sql) | Seed creates `users` table; `schema.sql` has no `users` table |
| Repeatable DB setup / seed command | PASS | `npm run seed` is destructive-repeatable |
| Login is database-backed | PASS | `POST /api/auth/login` queries `users` table |
| Login uses password hashing | FAIL | Plain-text password comparison |
| Role restrictions enforced in backend | PASS (logic) / WARN (identity) | Role logic correct; identity is header-spoofable |
| Protected action (coordinator comments / approve/reject) is backend-enforced | PASS (logic) / WARN (identity) | HTTP 403 returned to non-coordinator role; same spoofing caveat |
| Students limited to their own records | PASS (logic) / WARN (identity) | Backend scopes to `student_id`; student can spoof another user's ID |
| Main workflow (submit → review → status update) implemented | PASS | POST creates; GET lists; PUT updates status and comments |
| Filter by company name implemented | PASS | Backend LIKE query; UI text input with reactive fetch |
| Filter by application status implemented | PASS | Backend exact match; UI select dropdown with reactive fetch |
| Validation present | PARTIAL | Required-field and status-enum checks present; date-logic and length checks missing |
| AI implemented future stages early | PASS (no significant drift) | Only minor convenience items (`/api/health`, `nodemon`) ahead of schedule; no security or test code pre-implemented |
| No automated tests | CONFIRMED | Zero test files or test runner configured |
