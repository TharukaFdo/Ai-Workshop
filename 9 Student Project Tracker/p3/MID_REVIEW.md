# Student Project Tracker — Mid-Project Review

**Review date:** 2026-06-14  
**Stage reviewed:** After secondary feature (filter by supervisor / category / status) — before testing, security hardening, and maintainability cleanup.  
**Reviewer note:** Code read only. No source files, schema, seed data, tests, or packages were created or modified.

---

## 1. Mid-Review Summary

The project is a React + Express + MySQL prototype for student project submission and supervisor review. At this stage both the frontend (Vite/React, port 5174) and backend (Express, port 5000) appear to be running, as evidenced by the active browser tab on `http://localhost:5174/`. All four core functional requirements from `REQUIREMENTS.md` are present in code:

- **FR-1** project submission (student) — implemented  
- **FR-2** student update of own submission — implemented  
- **FR-3** view and filter (supervisor/category/status) — implemented  
- **FR-4** supervisor review, feedback, and status update — implemented  

The architecture separation is correct: React never touches MySQL; all data flows through Express REST routes. The backend uses `bcryptjs` for password hashing and DB-backed role verification in every protected route. No JWT or session tokens are used — the user ID is passed in a plain `x-user-id` header, which is a significant security gap for later stages. No automated tests exist yet. Supervisor filter dropdowns are hard-coded in the UI rather than database-driven, creating a minor maintainability issue. Category options in the submission form and filter dropdowns are mismatched with the seed data (three options in UI vs only two used in seeds). No stage drift (no features beyond Stage 7 scope) was detected.

---

## 2. Review Scoring Matrix

> Score 0 = missing · 1 = present but mostly not working · 2 = partial, major gaps · 3 = mostly working, important gaps · 4 = working, minor gaps · 5 = complete for case scope

| Feature / Area | Functionality 0–5 | Data Persistence 0–5 | Backend Security / Role Control 0–5 | Validation / Error Handling 0–5 | Testing Evidence 0–5 | Maintainability 0–5 | UI / Manual Usability 0–5 | Evidence | Notes |
|---|---:|---:|---:|---:|---:|---:|---:|---|---|
| Project setup and run commands | 5 | — | — | — | — | 4 | — | `package.json` root scripts: `install:all`, `dev:backend`, `dev:frontend`, `db:setup`, `db:reset` | No concurrent dev command; must open two terminals |
| Database setup and starter data | 5 | 5 | — | — | — | 4 | — | `scripts/db-setup.js` creates DB, both tables, seeds 4 users + 2 submissions; `--reset` flag drops and recreates | `.env` present with all 5 required vars; fallback hard-codes still reference old DB name `student_project_tracker` in `db.js` |
| Login workflow | 4 | 4 | 3 | 3 | 0 | 3 | 4 | `authRoutes.js`: DB lookup → `bcrypt.compare` → returns user object; login page in `App.jsx` L72–98 | No session/token issued; user object stored only in React state — lost on page refresh; comment on line 6 of `authRoutes.js` still says "Simple mock login" though it is DB-backed |
| Role-based access | 4 | 4 | 4 | 3 | 0 | 3 | 4 | `checkRole()` middleware in `projectRoutes.js` L8–35 queries `app_users` on every request; role is verified from DB, not from a client-supplied header value | `x-user-id` header is unauthenticated — any client can impersonate any user ID; no token or session binding |
| Main create action | 5 | 5 | 5 | 4 | 0 | 4 | 4 | `POST /api/projects` — `checkRole(['student'])` applied; all six required fields validated (L83–85); inserts with `status='submitted'` and correct `student_id` | No date-format validation beyond HTML5 `type="date"`; duplicate submissions not blocked |
| Main view/list action | 5 | 5 | 4 | 3 | 0 | 4 | 5 | `GET /api/projects` — students see only their own; supervisors see all; `x-user-id` checked against DB | Student list fetch does not guard against empty `currentUser` race condition (minor) |
| Main update/status/cancel action | 4 | 4 | 5 | 4 | 0 | 4 | 4 | `PUT /api/projects/:id` — `checkRole(['student'])` + ownership check (`project.student_id !== req.user.id`); updates student fields only | No restriction on editing approved/rejected submissions — student can still edit after supervisor decision; no cancel/withdraw action |
| Protected action | 4 | 4 | 5 | 4 | 0 | 3 | 4 | `PUT /api/projects/:id/review` — `checkRole(['supervisor'])` enforced; feedback and status written only via this route; students route has no `feedback` field in `updateProjectFields` | Supervisor is not checked against the assigned `supervisorName` on the submission — any logged-in supervisor can review any project |
| Secondary feature | 4 | 4 | 4 | 2 | 0 | 3 | 4 | Filter params `supervisorName`, `category`, `status` passed via query string to `GET /api/projects`; backend appends WHERE clauses with parameterised queries | Supervisor and category filter options are hard-coded in the UI; no validation on filter input on backend (unexpected filter values silently ignored, not harmful but not noted) |
| Case-specific: project title, category, supervisor, and status fields | 4 | 5 | 5 | 4 | 0 | 3 | 4 | All four fields present in schema, form, and API; `status` ENUM enforced in DB and validated in review route; `supervisorName` is free-text string stored in submissions | `supervisorName` and `category` are free-text — no FK constraint; filter dropdown offers a third category ("Web Applications") not present in seed data |
| Case-specific: supervisor feedback workflow | 4 | 5 | 5 | 3 | 0 | 4 | 4 | `PUT /:id/review` is supervisor-only; `feedback` column nullable TEXT; student side shows feedback read-only in a `feedback-box` div; no student write path to feedback | No minimum length validation on feedback; feedback is optional (allowed by requirements) but UI textarea is not marked required — acceptable |
| Case-specific: student ownership and supervisor-only approval | 4 | 4 | 5 | 3 | 0 | 3 | 4 | Ownership check on `PUT /:id`; status/feedback not included in `updateProjectFields`; supervisor approval via dedicated `/review` route only | Student can still edit a project after it is approved/rejected; no server-side guard on supervisor identity relative to the project's `supervisorName` |
| UI / manual usability | — | — | — | — | — | — | 4 | `index.css` — dark theme, Outfit font, status badges, responsive grid, loading/error/success states, hover effects | Supervisor filter is available to students (filtering their own list), which is consistent with FR-3 but slightly redundant |
| Security posture | — | — | 2 | — | — | — | — | Parameterised queries used throughout; DB secrets in `.env` not exposed to React; `bcrypt` password hashing | CORS is open (`app.use(cors())`); no rate limiting; no helmet; `x-user-id` header is not authenticated — elevation of privilege possible without a token |
| Testing evidence | — | — | — | — | 0 | — | — | No test files found in project source directories | No test runner, no test script in `package.json`; `REQUIREMENTS.md` §6 lists required tests but none are implemented |
| Maintainability | — | — | — | — | — | 3 | — | Services layer (`projectService.js`, `userService.js`) separate DB logic; JSDoc comments on service functions; `.env.example` provided | All UI in one 575-line `App.jsx`; no component splitting; supervisor/category lists are hard-coded in two separate places in JSX; stale comment "Simple mock login" in `authRoutes.js`; `db.js` has a different fallback DB name than `.env` |

---

## 3. Current Feature Status

| Requirement | Status | Route / File |
|---|---|---|
| FR-1 Student submits project | ✅ Implemented | `POST /api/projects` — `projectRoutes.js` L79 |
| FR-2 Student updates own submission | ✅ Implemented | `PUT /api/projects/:id` — `projectRoutes.js` L105 |
| FR-3 View and filter submissions | ✅ Implemented | `GET /api/projects` — `projectRoutes.js` L38; filters in `projectService.js` L6–56 |
| FR-4 Supervisor review, feedback, status update | ✅ Implemented | `PUT /api/projects/:id/review` — `projectRoutes.js` L142 |
| Student sees own submissions only | ✅ Backend enforced | `getProjectsByStudent()` called when `role === 'student'` |
| Supervisor sees all submissions | ✅ Backend enforced | `getAllProjects()` called when `role === 'supervisor'` |
| Students cannot edit feedback/status | ✅ Backend enforced | `updateProjectFields()` does not accept feedback/status |
| Filter by supervisor / category / status | ✅ Implemented | Parameterised WHERE clauses in both service methods |

---

## 4. Database and Persistence Status

| Item | Finding |
|---|---|
| `app_users` table | ✅ Created by `db-setup.js` with `id`, `username`, `password` (bcrypt), `role` ENUM, `fullName`, timestamps |
| `project_submissions` table | ✅ Created with all required fields: `title`, `description`, `category`, `studentName`, `supervisorName`, `submittedDate`, `status` ENUM, `feedback`, `student_id` FK, timestamps |
| Users/login table | ✅ Present — `app_users`; login is database-backed with bcrypt |
| Seed data | ✅ 4 users (2 students, 2 supervisors) + 2 sample submissions with hashed passwords |
| `--reset` flag | ✅ `node scripts/db-setup.js --reset` drops and recreates the database idempotently |
| DB env vars | ✅ All five (`DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`) in `backend/.env`; read via `dotenv` |
| Secrets in React bundle | ✅ Not present — React only talks to `http://localhost:5000/api` |
| `db.js` fallback name mismatch | ⚠️ Hard-coded fallback in `db.js` line 9 is `student_project_tracker`; `.env` and `db-setup.js` use `c9p3` — if `.env` is absent the app connects to the wrong database |

---

## 5. Login and Role/Access Status

| Item | Finding |
|---|---|
| Login type | Database-backed (`app_users` table), bcrypt password comparison |
| Session / token | ❌ None — user object is held in React `useState` only; lost on page refresh |
| Identity header | `x-user-id` (plain integer) sent from React on every API request |
| Role lookup on backend | ✅ `checkRole()` fetches role from DB using `x-user-id` on every request — not trusting any client-supplied role claim |
| Impersonation risk | ⚠️ Any client can forge `x-user-id: <another_user_id>` because there is no token binding the header to the login event |
| Student/supervisor UI split | ✅ Separate layouts rendered per `currentUser.role`; supervisor review panel not rendered for students |
| Logout | ✅ Clears React state; no server-side session to invalidate |

---

## 6. Protected Action Status

**Protected action:** Add or edit supervisor feedback / approve or reject projects (`PUT /api/projects/:id/review`)

| Check | Result |
|---|---|
| Route restricted to `supervisor` role | ✅ `checkRole(['supervisor'])` applied |
| Role verified against database | ✅ SQL query on `app_users` in middleware |
| Student UI hides the review form | ✅ Review panel JSX only rendered in supervisor branch |
| Student has no backend path to write feedback | ✅ `PUT /api/projects/:id` (student route) calls `updateProjectFields()` which does not include `feedback` or `status` |
| Student has no backend path to change status | ✅ Same as above |
| Supervisor identity checked against `supervisorName` on submission | ❌ Missing — any authenticated supervisor can review any project, regardless of assignment |
| Feedback field required for approval/rejection | ❌ Not enforced — `feedback` is optional in the review route |

---

## 7. Validation Status

| Rule | Frontend | Backend |
|---|---|---|
| Required fields: title, description, category, studentName, supervisorName, submittedDate | ✅ HTML `required` + JS guard in `handleCreateOrUpdateProject` | ✅ Explicit check in `POST` and `PUT` routes with 400 response |
| Status must be one of four valid values | ✅ `<select>` constrains UI | ✅ `validStatuses` array check in review route with 400 response |
| Date format | ✅ HTML `type="date"` input | ❌ No backend format validation — any string passes |
| Feedback minimum length | ❌ Not required | ❌ Not required (acceptable per spec, but no guard even for whitespace-only entries) |
| SQL injection protection | — | ✅ Parameterised queries (`?` placeholders) throughout `projectService.js` and `userService.js` |
| Duplicate submission prevention | ❌ Not present | ❌ Not present |
| Student edits own projects only (ownership) | ✅ Edit button only on student's own list | ✅ `project.student_id !== req.user.id` check in `PUT /:id` |

---

## 8. Stage Drift / Early Implementation

No evidence of features beyond the Stage 7 scope was found:

- No JWT or OAuth (not expected until security stage)
- No automated tests (expected in next stage)
- No email notifications, audit logs, or file upload handling
- No pagination or advanced search — not in scope

The only items that could be considered slightly ahead of schedule are:
- `bcryptjs` password hashing in the login flow (a security hardening concern, but present and correct)
- `.env.example` template file (good practice, not required at this stage)

Both are appropriate and beneficial inclusions at this stage.

---

## 9. Issues Found Before Stage 8

### Critical
| # | Issue | Location |
|---|---|---|
| C1 | `x-user-id` header is unauthenticated — any client can impersonate any user by providing a different integer | All routes using `checkRole()` |
| C2 | No session or token — user session lost on page refresh; user must log in again | React `useState` only |

### High
| # | Issue | Location |
|---|---|---|
| H1 | Open CORS (`cors()` with no origin restriction) | `server.js` L11 |
| H2 | No rate limiting on login endpoint — brute force possible | `authRoutes.js` |
| H3 | No `helmet` or security headers | `server.js` |
| H4 | Student can edit a project after it has been approved or rejected — no status lock | `PUT /api/projects/:id` |
| H5 | Any supervisor can review any project — no check that `supervisorName` on submission matches the logged-in supervisor | `PUT /api/projects/:id/review` |

### Medium
| # | Issue | Location |
|---|---|---|
| M1 | Fallback DB name in `db.js` (`student_project_tracker`) differs from `.env` (`c9p3`) — will connect to wrong DB if `.env` is missing | `backend/config/db.js` L9 |
| M2 | Supervisor and category options hard-coded in JSX; not sourced from DB — adding new supervisors requires UI code change | `App.jsx` L299–313, L383–409 |
| M3 | No backend date-format validation for `submittedDate` | `projectRoutes.js` L83, L110 |
| M4 | Third filter category "Web Applications" present in UI but not in seed data | `App.jsx` L313 |
| M5 | No test runner, test framework, or test scripts defined in any `package.json` | All `package.json` files |

### Low
| # | Issue | Location |
|---|---|---|
| L1 | Stale comment "Simple mock login endpoint" in `authRoutes.js` when login is DB-backed | `authRoutes.js` L6 |
| L2 | `App.jsx` is a single 575-line file — all views, state, and handlers in one component | `frontend/src/App.jsx` |
| L3 | No concurrent dev command — two terminals required to run backend and frontend | Root `package.json` |
| L4 | `App.css` exists but is unused (all styles are in `index.css`) | `frontend/src/App.css` |
| L5 | README setup order is inverted — environment config (step 2) should precede `db:setup` (step 1) | `README.md` |

---

## 10. Manual Checks Recommended Next

1. **Run `npm run db:setup` from root** and confirm both tables are created and seeded without errors.
2. **Log in as `alice_student` / `password123`** — verify the project list shows only Alice's submissions and the review panel is not visible.
3. **Log in as `supervisor_john` / `password123`** — verify all submissions appear, click one, submit feedback and change status; confirm the list updates.
4. **Test filter controls** for supervisor, category, and status both as student and supervisor — confirm results change correctly.
5. **Attempt to call `PUT /api/projects/1/review` with `x-user-id: 1`** (Alice's ID) via curl/Postman — expect 403.
6. **Attempt to call `PUT /api/projects/1/review` with `x-user-id: 3`** (supervisor_john's ID) via curl/Postman — confirm it succeeds and that no validation blocks cross-supervisor review.
7. **Attempt to call `PUT /api/projects/1` with `x-user-id: 2`** (Bob's ID) — expect 403 (ownership check).
8. **Attempt `x-user-id: 99` (non-existent user)** on any route — expect 401.
9. **Reload the browser page after login** — confirm the session is lost and the login screen reappears.
10. **Check the browser Network tab** — confirm no DB credentials, user passwords, or secret keys appear in any API response.

---

## 11. Pass / Fail Table

| Check | Result | Detail |
|---|---|---|
| App appears runnable | ✅ Pass | Frontend on port 5174 (active tab), backend on port 5000; `node_modules` present in both |
| React and Express are separated | ✅ Pass | `/frontend` and `/backend` are distinct directories with their own `package.json` |
| React calls Express, never MySQL | ✅ Pass | `API_BASE = 'http://localhost:5000/api'`; no MySQL client in frontend dependencies |
| Backend uses all five DB env vars | ✅ Pass | `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME` — all in `.env` and read via `dotenv` |
| DB secrets not exposed in React bundle | ✅ Pass | No `process.env.DB_*` references in frontend code |
| `app_users` / login table exists | ✅ Pass | `app_users` table created in `db-setup.js` |
| `project_submissions` table exists | ✅ Pass | Created in `db-setup.js` with all required columns |
| Repeatable DB setup / seed command | ✅ Pass | `npm run db:setup` (idempotent) and `npm run db:reset` (destructive) |
| Login is database-backed | ✅ Pass | `getUserByUsername()` → `bcrypt.compare()` |
| Role restrictions enforced in backend | ✅ Pass | `checkRole()` middleware queries DB for every protected request |
| Supervisor feedback / approval is protected | ✅ Pass | `PUT /:id/review` is supervisor-only at backend |
| Students limited to their own records (list) | ✅ Pass | `getProjectsByStudent(req.user.id)` |
| Students limited to their own records (update) | ✅ Pass | Ownership check in `PUT /:id` |
| Main workflow implemented | ✅ Pass | Submit → review → feedback + status update visible to student |
| Filter by supervisor / category / status | ✅ Pass | Query params passed to parameterised WHERE clauses |
| Validation present | ⚠️ Partial | Required fields and status enum validated; date format not validated on backend |
| No early-stage drift | ✅ Pass | No features beyond Stage 7 scope detected |
| Unauthenticated identity header (x-user-id) | ❌ Fail | Plain integer header — impersonation possible; to be addressed in security stage |
| Session persistence across reload | ❌ Fail | React state only — no token/session; lost on refresh |
| No automated tests | ❌ Fail | No test files, no test runner, no test scripts |
| Supervisor restricted to assigned projects | ❌ Fail | Any supervisor can review any project |
| Student edit blocked after approval/rejection | ❌ Fail | No status lock on student update route |
