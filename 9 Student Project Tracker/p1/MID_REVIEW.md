# MID_REVIEW.md — Student Project Tracker (Case 9, p1)

**Review Stage:** Mid-project — after secondary feature (filter), before testing, security hardening, and maintainability cleanup  
**Review Date:** 2026-06-15  
**Reviewer:** Automated mid-project review  
**Scope:** Review only. No source code, schema, seed data, packages, or tests modified.

---

## 1. Mid-Review Summary

The project is a React + Express + MySQL prototype matching the case brief. Both the frontend (Vite/React) and backend (Express/Node.js) are present and structurally separated. The backend connects to MySQL exclusively via environment variables and serves a REST API. The React frontend communicates only with Express routes over HTTP — no direct MySQL access from the browser.

The core workflow is substantially implemented: students can submit and edit their own projects; supervisors can view all projects, add feedback, and approve/reject. The secondary filter feature (by supervisor, category, status) is implemented end-to-end in both the backend query and the frontend filter bar. JWT-based authentication and role enforcement exist in the backend for all project routes. A repeatable `db:init` script seeds the database with users and demo projects.

Key gaps at this stage: the `.env` file is committed with a weak `JWT_SECRET` and an empty `DB_PASSWORD`; CORS is wide open; the backend `GET /api/projects` returns all projects to all authenticated users without scoping students to their own records; no input length or content validation beyond required-field checks; no tests or test tooling; no project-level README with run instructions; and the `index.css` still contains Vite scaffold variables that clash with `App.css` tokens.

Overall, the project is in a solid "mid-prototype" state. The main workflow is functional, role control exists at the backend, and the secondary feature is done. The primary remaining work before the final review is: student record scoping, security hardening, input validation depth, and maintainability cleanup.

---

## 2. Review Scoring Matrix

> **Score key:** 0 = missing · 1 = present but mostly not working · 2 = partially working, major gaps · 3 = mostly working, important gaps · 4 = working, minor gaps · 5 = complete for case scope

| Feature / Area | Functionality 0–5 | Data Persistence 0–5 | Backend Security / Role Control 0–5 | Validation / Error Handling 0–5 | Testing Evidence 0–5 | Maintainability 0–5 | UI / Manual Usability 0–5 | Evidence | Notes |
|---|---:|---:|---:|---:|---:|---:|---:|---|---|
| **Project setup and run commands** | 3 | — | — | — | 0 | 2 | — | `backend/package.json` scripts: `start`, `dev`, `db:init`. `frontend/package.json` scripts: `dev`, `build`. No root-level README or combined start command. | Two separate `npm` commands required; no root README explaining them. |
| **Database setup and starter data** | 4 | 5 | — | 2 | 0 | 3 | — | `dbSetup.js`: creates DB, drops/recreates `users` + `projects`, seeds 2 users (bcrypt) and 2 demo projects. Run via `npm run db:init`. | DROP-before-CREATE is destructive on re-run. `.env` committed to repo. No migration system. |
| **Login workflow** | 4 | 4 | 4 | 3 | 0 | 3 | 4 | `POST /api/auth/login` in `server.js` lines 52–81: queries `users` table, bcrypt.compare, issues JWT (1 day). Frontend stores session in `localStorage`. | Weak `JWT_SECRET` (`supersecretkey123`) in committed `.env`. No refresh token. Token expiry not surfaced to user. |
| **Role-based access** | 4 | — | 3 | 2 | 0 | 3 | 4 | JWT payload carries `role`. All project routes guarded by `authenticateToken` middleware. Create route checks `role === 'student'`; PUT route branches on role. Student and supervisor UIs differ. | `GET /api/projects` is authenticated but not role-scoped: students see all projects, not only their own. |
| **Main create action** | 4 | 4 | 4 | 3 | 0 | 3 | 4 | `POST /api/projects` (lines 120–141): student-only guard, required-field check, inserts with `student_id = req.user.id`. Frontend form for title, description, category, supervisor. | `student_name` taken from `req.user.username` (auth token), not a free-text field — good. No max-length validation. Category not validated against enum server-side. |
| **Main view/list action** | 4 | 4 | 2 | 2 | 0 | 3 | 4 | `GET /api/projects` (lines 84–117): authenticated, returns all rows. Student UI labels section "My Submissions" but shows all projects (no `WHERE student_id = ?` for students). | **Student record scoping missing in backend.** Student sees all other students' projects. |
| **Main update/status/cancel action** | 4 | 4 | 4 | 3 | 0 | 3 | 4 | `PUT /api/projects/:id` (lines 144–198): fetches project first, checks ownership for student (`student_id === req.user.id`), blocks edit if not Pending. Cancel edit resets form client-side. | Student cannot cancel/withdraw a submitted project; only edit while Pending. Status-cancel is UI-only (no delete/withdraw endpoint). |
| **Protected action** | 4 | 4 | 4 | 2 | 0 | 3 | 4 | PUT endpoint branches by role: students cannot write `status` or `supervisor_feedback`; supervisors cannot write `title`, `description`, `category`, `supervisor_name`. Student UI shows feedback read-only. Edit button only shown for Pending projects. | No server-side validation that `status` value is one of `[Pending, Approved, Rejected]`. Supervisor can set any status string. |
| **Secondary feature** | 4 | 4 | 3 | 2 | 0 | 3 | 4 | `GET /api/projects?supervisor_name=&category=&status=` all wired in backend (lines 85–116). Frontend filter bar has text input for supervisor, dropdowns for category and status, and a Reset button. Filters re-fetch on change via `useEffect`. | `supervisor_name` uses LIKE (partial match) — inconsistent with `category`/`status` exact match. No debounce on supervisor text input (fires a DB query on every keystroke). |
| **Case-specific: project title, category, supervisor, and status fields** | 4 | 5 | 4 | 3 | 0 | 3 | 4 | All four fields present in DB schema, submission form, project card, and filter bar. `status` defaults to `'Pending'`, updated by supervisor. Category is a closed dropdown in the UI. | Category not validated as enum server-side. `supervisor_name` is free-text (not linked to a users row). `status` not validated to allowed values server-side. |
| **Case-specific: supervisor feedback workflow** | 4 | 4 | 4 | 2 | 0 | 3 | 4 | Supervisor sees inline textarea + status dropdown per project card. Save Review calls `PUT /api/projects/:id` with `status` + `supervisor_feedback`. Student view shows feedback read-only in a styled block if present. | `alert()` used for save confirmation — not suitable for production. No feedback required before status change. |
| **Case-specific: student ownership and supervisor-only approval** | 4 | 4 | 4 | 2 | 0 | 3 | 4 | PUT enforces student ownership (`project.student_id !== req.user.id` → 403). Students cannot set `status` (field stripped server-side). Supervisors cannot touch student fields. Edit button only appears for Pending projects in student UI. | Student sees all projects (not scoped to their own in GET). A student can attempt to PATCH another student's project ID if they know it — ownership check does catch this on the backend. |
| **UI / manual usability** | 4 | — | — | 3 | 0 | 3 | 4 | Clean two-column layout, status badges with colour coding, login page, role-aware panels, filter bar, edit/cancel flow, success/error alerts. Responsive breakpoint at 900 px. | `index.css` Vite scaffold tokens conflict with `App.css` tokens (font-size 56 px `h1`, `#root` width 1126 px with border). Two CSS files define competing `h1`/`h2` rules. `alert()` used instead of in-page notification. |
| **Security posture** | 2 | — | 2 | 2 | 0 | 1 | — | JWT used, bcrypt for passwords, env vars for DB credentials, no DB credentials in frontend code, parameterised queries (mysql2 `?` placeholders). | `.env` committed with secrets. `JWT_SECRET = supersecretkey123`. `DB_PASSWORD` empty. `cors()` with no origin restriction. No rate limiting on login. No HTTP-only cookies (token in `localStorage`). No HTTPS enforcement. |
| **Testing evidence** | 0 | 0 | 0 | 0 | 0 | 0 | 0 | No test files, no test runner configured, no test scripts in either `package.json`. | No test infrastructure at all. |
| **Maintainability** | 2 | — | — | — | 0 | 2 | — | Single-file frontend (546 lines in `App.jsx`), single-file backend (203 lines in `server.js`). No component separation, no custom hooks, no service/repository layer. No root README. No `.env.example`. No ESLint fix pass. | Acceptable at prototype stage. Will need component extraction and route/controller separation before final review. |

---

## 3. Current Feature Status

| Feature | Status | Location |
|---|---|---|
| Project submission (create) | ✅ Implemented | `POST /api/projects`, `App.jsx` form |
| Project edit (student, Pending only) | ✅ Implemented | `PUT /api/projects/:id`, `handleEditStart` / `handleSubmit` |
| Project list (all authenticated users) | ⚠️ Partial — not scoped for students | `GET /api/projects`, `App.jsx` project list |
| Supervisor review panel | ✅ Implemented | `PUT /api/projects/:id`, inline review panel in `App.jsx` |
| Supervisor feedback (add/edit) | ✅ Implemented | `supervisor_feedback` field, supervisor PUT branch |
| Status update (Pending/Approved/Rejected) | ✅ Implemented | `status` field, supervisor PUT branch |
| Filter by supervisor | ✅ Implemented | Query param + LIKE, frontend text input |
| Filter by category | ✅ Implemented | Query param + exact match, frontend dropdown |
| Filter by status | ✅ Implemented | Query param + exact match, frontend dropdown |
| Filter reset | ✅ Implemented | "Reset" button clears all three filters |
| Student feedback read-only view | ✅ Implemented | Conditional render in student card |
| Login (DB-backed, JWT) | ✅ Implemented | `POST /api/auth/login`, `users` table |
| Logout / session clear | ✅ Implemented | `localStorage` clear + state reset |
| Session persistence (page reload) | ✅ Implemented | `localStorage` session restore on mount |
| Student record scoping in list | ❌ Missing | `GET /api/projects` returns all rows regardless of role |
| Status value validation (server-side) | ❌ Missing | Any string accepted as `status` |
| Category value validation (server-side) | ❌ Missing | Any string accepted as `category` |
| Input length validation | ❌ Missing | Only `required` HTML attribute present |
| Project delete / withdraw | ❌ Not in scope (case brief) | — |

---

## 4. Database and Persistence Status

### Tables

| Table | Present | Source | Notes |
|---|---|---|---|
| `users` | ✅ Yes | `dbSetup.js` line 32–39 | id, username (unique), password (bcrypt), role |
| `projects` | ✅ Yes | `dbSetup.js` line 56–70 | id, title, description, category, student_name, supervisor_name, submitted_date (TIMESTAMP), status (default Pending), supervisor_feedback (nullable TEXT), student_id (FK → users) |

### Seed Data

| Seed record | Table | Notes |
|---|---|---|
| `alice` / `password123` / `student` | `users` | bcrypt hash |
| `dr_john` / `password123` / `supervisor` | `users` | bcrypt hash |
| Smart Attendance System | `projects` | student_id = alice, status = Pending |
| E-Commerce Mobile App | `projects` | student_id = NULL (Bob Johnson is not a users row), status = Approved, feedback present |

### Persistence Assessment

- **Setup command:** `npm run db:init` (from `backend/`) — repeatable and idempotent (DROP + CREATE).  
- **DB credentials:** read from `.env` via `dotenv` — correct pattern; however `.env` is not in `.gitignore` for the backend (only the frontend `.gitignore` is present).  
- **Connection pool:** used in `server.js` (mysql2 `createPool`) — correct.  
- **Issue:** The second seed project (`Bob Johnson`) references `student_id = null` because Bob is not a `users` row. This means the FK is satisfied (ON DELETE SET NULL), but the student cannot log in or own that project.

---

## 5. Login and Role / Access Status

### Login Type
**Database-backed JWT login** — not mock, not role-selector-only.

| Aspect | Assessment |
|---|---|
| Credential source | MySQL `users` table |
| Password storage | bcrypt (cost factor 10) |
| Token format | JWT, signed with `JWT_SECRET`, 1-day expiry |
| Token storage | `localStorage` |
| Session restore | `useEffect` on mount reads `localStorage` |
| Role in token | Yes — `{ id, username, role }` |
| Middleware | `authenticateToken` applied to all project routes |

### Role Enforcement Summary

| Route | Enforcement |
|---|---|
| `POST /api/projects` | `role === 'student'` required (403 otherwise) |
| `GET /api/projects` | Authenticated (any role); **not scoped by student** |
| `PUT /api/projects/:id` | Role-branched: student fields vs supervisor fields; student ownership checked |

### Gaps
- `GET /api/projects` is not scoped: students receive all projects from all students.
- No route exists to register new users — only the two seeded users can log in.
- No token refresh mechanism; expired token causes auto-logout on next fetch (401 triggers `handleLogout`).

---

## 6. Protected Action Status

**Protected actions (case brief):** Add or edit supervisor feedback · Approve or reject projects (change status)

| Check | Result |
|---|---|
| Student cannot set `supervisor_feedback` via API | ✅ Backend strips this field from student PUT |
| Student cannot set `status` via API | ✅ Backend strips this field from student PUT |
| Supervisor cannot edit title/description/category/supervisor_name | ✅ Backend strips these fields from supervisor PUT |
| Student edit button only shown for own Pending project | ✅ UI conditional; backend ownership enforced |
| Supervisor feedback UI only shown to supervisor role | ✅ Rendered only in `user.role !== 'student'` branch |
| Student feedback display is read-only | ✅ No edit controls rendered for student |

### Remaining gap
The supervisor PUT branch does **not validate** that the supplied `status` value is within the allowed set (`Pending`, `Approved`, `Rejected`). A supervisor can persist an arbitrary string as status (e.g., `"Approved✓"` or `"LGTM"`), which would break the status badge CSS class matching on the frontend.

---

## 7. Validation Status

| Validation point | Present | Type | Notes |
|---|---|---|---|
| Login: username and password required | ✅ | Server-side | Lines 54–56 in `server.js` |
| Project create: title, description, category, supervisor required | ✅ | Server-side required check | Line 126 |
| Project create: fields also `required` in HTML form | ✅ | Client-side HTML | |
| Category: enum check | ❌ | Missing | Any string passes the insert |
| Status: enum check | ❌ | Missing | Any string passes the update |
| Max length on title / supervisor_name | ❌ | Missing | DB column is VARCHAR(255/150); no JS/Express check |
| Supervisor feedback: max length | ❌ | Missing | DB is TEXT; no length cap |
| Student can only edit Pending projects | ✅ | Server-side | Lines 164–166 |
| Student can only edit own project | ✅ | Server-side | Lines 161–163 |
| Empty update rejected | ✅ | Server-side | Lines 182–184 (`fields.length === 0`) |
| Filter values: supervisor_name injection | ⚠️ | Parameterised but LIKE | `%${supervisor_name}%` is passed as a bound param — safe from SQL injection, but no length cap on the query parameter |

---

## 8. Stage Drift / Early Implementation

The following items were implemented **earlier than their designated stage** or go beyond the current stage scope:

| Item | Stage it belongs to | Found at |
|---|---|---|
| JWT authentication with bcrypt | Security hardening stage | Fully implemented now in `server.js` and `dbSetup.js` |
| `bcryptjs` dependency | Security hardening stage | Already in `backend/package.json` |
| `jsonwebtoken` dependency | Security hardening stage | Already in `backend/package.json` |
| Token-based session persistence (localStorage) | Security/UX hardening | Implemented in `App.jsx` useEffect |
| Student ownership enforcement in PUT | Could be security stage | Present now |

No future-stage items appear to be missing that were pre-built incorrectly; the early JWT implementation is a net positive for the prototype's correctness. No admin panel, file upload, email notification, or other out-of-scope features were pre-built.

---

## 9. Issues Found Before Stage 8

### Critical / Blocking

| # | Issue | Location | Impact |
|---|---|---|---|
| C1 | `GET /api/projects` returns all rows to all authenticated users; students see other students' projects | `server.js` line 84 | Privacy; "My Submissions" label is misleading |
| C2 | `.env` committed to repository with real credentials | `backend/.env` | Secret exposure |
| C3 | `JWT_SECRET = supersecretkey123` (weak, committed) | `backend/.env` line 7 | Token forgery risk |

### High

| # | Issue | Location | Impact |
|---|---|---|---|
| H1 | `status` field not validated to allowed enum on update | `server.js` PUT handler | Supervisor can persist invalid status strings |
| H2 | `category` field not validated to enum on create or update | `server.js` POST/PUT | Invalid categories can be inserted |
| H3 | CORS is fully open (`cors()` with no origin option) | `server.js` line 13 | Any origin can call the API |
| H4 | No rate limiting on `POST /api/auth/login` | `server.js` | Brute-force login possible |
| H5 | JWT stored in `localStorage` (XSS-accessible) | `App.jsx` lines 104, 39–47 | Token theft via XSS |

### Medium

| # | Issue | Location | Impact |
|---|---|---|---|
| M1 | `index.css` Vite scaffold conflicts with `App.css` (h1 56 px, `#root` 1126 px border, competing tokens) | `index.css` / `App.css` | Visual layout interference; `h1` inside `.login-card` picks up 56 px |
| M2 | `alert()` used for review save confirmation | `App.jsx` line 225 | Poor UX; blocks the browser tab |
| M3 | No debounce on supervisor filter text input; every keystroke triggers a DB query | `App.jsx` handleFilterChange → useEffect | Unnecessary DB load |
| M4 | Second seed project (`Bob Johnson`) has `student_id = null` — no matching user | `dbSetup.js` line 97 | Bob's project cannot be tested for student-ownership |
| M5 | No `.env.example` file and no backend `.gitignore` | repo root | Secrets committed; no guidance for new setup |
| M6 | No root-level `README.md` with run instructions | repo root | Onboarding gap |
| M7 | No input max-length validation for title, description, supervisor_name, feedback | server.js POST/PUT | Oversized payloads can fill DB columns |

### Low / Polish

| # | Issue | Location | Impact |
|---|---|---|---|
| L1 | `supervisor_name` filter uses LIKE (partial match) but `category`/`status` use exact match — inconsistent | `server.js` lines 92–102 | Minor UX inconsistency |
| L2 | Token expiry not shown to user; expired token silently logs out on next action | `App.jsx` | Confusing UX |
| L3 | No loading spinner shown while fetching projects | `App.jsx` | Minor UX |
| L4 | `vite.config.js` has no dev server proxy configured; `localhost:5001` is hard-coded in frontend | `App.jsx` lines 59, 96, 167, 176, 210 | Hard-coded URL; breaks in non-default environments |
| L5 | `cancel-btn`, `clear-btn`, `role-btn.active` CSS classes defined but some selectors unused (`role-btn.active` never applied) | `App.css` | Dead CSS |

---

## 10. Manual Checks Recommended Next

The following checks cannot be fully confirmed by static review and should be verified by running the application:

1. **Run `npm run db:init` from `backend/`** — confirm `users` and `projects` tables are created and both seed users are insertable.
2. **Login as `alice` / `password123`** — confirm JWT is issued, stored in localStorage, and the student dashboard shows projects (note: will show all projects due to C1).
3. **Login as `dr_john` / `password123`** — confirm supervisor panel appears and all projects are listed.
4. **Submit a new project as `alice`** — confirm `POST /api/projects` inserts a row with `student_id = alice.id` and `status = Pending`.
5. **Edit the new project as `alice`** — confirm the Edit Details button appears, PUT succeeds, and the list refreshes.
6. **Try editing another student's project by direct PUT** — confirm the backend returns 403 (`You can only update your own projects`).
7. **Try setting `supervisor_feedback` via PUT as `alice`** — confirm the field is silently stripped (no 403; the response is 200 but feedback unchanged in DB).
8. **Save a review as `dr_john`** — confirm status and feedback are written to the DB and reflected after re-fetch.
9. **Try setting status to an arbitrary string as `dr_john`** — confirm it succeeds (expected gap H1; document result).
10. **Apply all three filters simultaneously** — confirm the AND combination works and the Reset button clears all filters.
11. **Reload the page after login** — confirm `localStorage` restore re-authenticates without requiring re-login.
12. **Inspect `h1` styling** — confirm whether `index.css` 56 px rule overrides `App.css` `.login-card h1` 1.8 rem rule (issue M1).
13. **Check browser network tab** — confirm frontend makes fetch calls only to `localhost:5001`, never to a MySQL port directly.

---

## 11. Pass / Fail Table

| Check | Result | Notes |
|---|---|---|
| App appears runnable | ✅ Pass | Both `package.json` files have `dev`/`start` scripts; `node_modules` present |
| React frontend and Express backend are separated | ✅ Pass | `/frontend` and `/backend` directories; separate `package.json` files |
| React calls Express routes only (never MySQL directly) | ✅ Pass | All fetch calls target `http://localhost:5001/api/*`; `mysql2` not in frontend dependencies |
| Backend uses DB_HOST, DB_PORT, DB_USER, DB_PASSWORD, DB_NAME | ✅ Pass | `server.js` lines 18–22; `dbSetup.js` line 8 |
| DB secrets not exposed in React | ✅ Pass | No DB env vars in `frontend/` |
| `users`/login table exists | ✅ Pass | `users` table defined in `dbSetup.js` |
| `projects` table exists | ✅ Pass | `projects` table defined in `dbSetup.js` |
| Repeatable DB setup / seed command | ✅ Pass | `npm run db:init` (DROP + CREATE + seed) |
| Login is database-backed | ✅ Pass | Queries `users` table, bcrypt verify, JWT issued |
| Role restrictions enforced in backend | ✅ Pass (with gap) | All routes use `authenticateToken`; POST/PUT role-branched — but GET not scoped per student |
| Protected action (supervisor feedback + approve/reject) is backend-enforced | ✅ Pass | Role-branch in PUT strips student from writing feedback/status |
| Users limited to their own records | ❌ Fail | `GET /api/projects` returns all rows; student scoping absent |
| Project submission workflow implemented | ✅ Pass | Create + edit flow present |
| Supervisor review + feedback + status workflow implemented | ✅ Pass | Inline review panel, PUT endpoint working |
| Filter by supervisor, category, status implemented | ✅ Pass | All three filters wired backend + frontend |
| Validation present | ⚠️ Partial Pass | Required-field checks present; enum and length validation absent |
| AI did not implement future stages early (out-of-scope features) | ✅ Pass | No admin panel, file upload, email, etc. |
| JWT / auth implemented early (stage drift) | ⚠️ Note | bcrypt + JWT are security-stage items, but correctly implemented and beneficial |
| Missing before testing/security/maintainability stages | See §9 | C1 (student scoping), C2/C3 (secrets), H1/H2 (enum validation), H3/H4/H5 (security), M1 (CSS conflict), M4 (orphan seed), M6 (README) |
