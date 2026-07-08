# FINAL_REVIEW.md — Student Project Tracker (Case 9, p1)

**Review Stage:** Final — after testing, security hardening, maintainability cleanup, and change request implementation  
**Review Date:** 2026-06-15  
**Reviewer:** Automated final review (evidence-based; no source files modified)  
**Scope:** Review only. No source code, schema, seed data, packages, or configuration modified.

---

## 1. Final Feature Summary

The Student Project Tracker is a working React + Express + MySQL prototype that satisfies all requirements of the case brief. The following table summarises every feature and its current implementation state.

| Feature | Status | Evidence Location |
|---|---|---|
| Student project submission (create) | ✅ Complete | `POST /api/projects`, `App.jsx` form |
| Student project edit (Revision Requested only) | ✅ Complete — improved from mid-review | `PUT /api/projects/:id` student branch, `handleEditStart` |
| Project list (all authenticated users) | ⚠️ Not scoped per student | `GET /api/projects` — no `WHERE student_id = ?` for students |
| Supervisor review panel | ✅ Complete | Inline panel, `App.jsx` lines 506–535 |
| Supervisor feedback (add/edit) | ✅ Complete | `supervisor_feedback` field, supervisor PUT branch |
| Status update (Pending / Approved / Rejected / Revision Requested) | ✅ Complete — 4-value enum | `server.js` lines 248–254 |
| Filter by supervisor, category, status | ✅ Complete | Query params + LIKE / exact match, filter bar |
| Filter reset | ✅ Complete | Reset button, `App.jsx` line 454 |
| Student feedback read-only view | ✅ Complete | Conditional render, `App.jsx` lines 488–503 |
| Login (DB-backed, JWT, bcrypt) | ✅ Complete | `POST /api/auth/login`, `users` table |
| Logout / session clear | ✅ Complete | `localStorage` clear + state reset |
| Session persistence on reload | ✅ Complete | `useEffect` mount read from `localStorage` |
| Input validation (title, description, category, supervisor_name) | ✅ Complete — added after mid-review | `validateProjectInput` middleware, `server.js` lines 86–114 |
| Status enum validation (server-side) | ✅ Complete — added after mid-review | `server.js` lines 248–251 |
| Rate limiting — login endpoint | ✅ Complete — added after mid-review | `loginLimiter`, 15 attempts / 15 min |
| Rate limiting — general API | ✅ Complete — added after mid-review | `generalLimiter`, 150 req / 15 min |
| Restricted CORS (origin whitelist) | ✅ Complete — added after mid-review | `allowedOrigins` array, `server.js` lines 15–24 |
| Supervisor feedback max-length validation | ✅ Complete — added after mid-review | `server.js` lines 256–258 (1000-char cap) |
| Revision Requested workflow (full cycle) | ✅ Complete — added after mid-review | 4th status; student edit unlocked only on this status |
| Automated integration tests (8 tests, cleanup) | ✅ Complete — added after mid-review | `backend/test.js`; `npm test` → all pass |
| Student record scoping (GET scoped to own) | ❌ Still missing | `GET /api/projects` returns all rows regardless of role |
| Debounce on supervisor filter text input | ❌ Not added | Every keystroke triggers a DB query |
| `alert()` replaced with in-page notification (Save Review) | ❌ Not addressed | `App.jsx` line 225 |
| Root-level README with run instructions | ❌ Not present | Only `frontend/README.md` (Vite scaffold) |
| Backend `.gitignore` (`.env` protection) | ❌ Not present | `.env` remains committable |
| `.env.example` file | ❌ Not present | No reference template for new setup |
| `supervisor_name` linked to users row | ❌ By design | Free-text field per case brief |

**Net assessment:** The project is substantially complete. All case-brief requirements are implemented and backed by passing automated tests. The primary remaining gap — student record scoping in `GET /api/projects` — was present at mid-review and was not closed in the final stage. All security hardening, enum validation, a new `Revision Requested` workflow, and 8 automated integration tests with cleanup were delivered after the mid-review.

---

## 2. Review Scoring Matrix

> **Score key:** 0 = missing · 1 = present but mostly not working · 2 = partially working, major gaps · 3 = mostly working, important gaps · 4 = working, minor gaps · 5 = complete for case scope

| Feature / Area | Functionality 0-5 | Data Persistence 0-5 | Backend Security / Role Control 0-5 | Validation / Error Handling 0-5 | Testing Evidence 0-5 | Maintainability 0-5 | UI / Manual Usability 0-5 | Evidence | Notes |
|---|---:|---:|---:|---:|---:|---:|---:|---|---|
| **Project setup and run commands** | 4 | — | — | — | 3 | 3 | — | `backend/package.json`: `start`, `dev`, `db:init`, `test`. `frontend/package.json`: `dev`, `build`. Two-directory setup verified. | No root README; `frontend/README.md` is the Vite scaffold default, not project-specific. Two separate `npm` start commands required. |
| **Database setup and starter data** | 5 | 5 | — | 3 | 4 | 3 | — | `dbSetup.js`: idempotent DROP + CREATE + bcrypt seed. `npm run db:init` confirmed working. Two users, two demo projects seeded. | Second demo project (`Bob Johnson`) has `student_id = null` — orphan seed; Bob cannot log in. DROP-before-CREATE is destructive. No migration system. |
| **Login workflow** | 5 | 5 | 4 | 4 | 5 | 4 | 5 | `POST /api/auth/login`: DB query, bcrypt.compare, JWT signed with `JWT_SECRET` (1-day expiry). Rate-limited to 15 attempts/15 min. Test 1 (both roles) and invalid-credential paths confirmed in `test.js`. | JWT stored in `localStorage` (XSS-accessible). `JWT_SECRET = supersecretkey123` is weak and committed in `.env`. No token refresh mechanism. |
| **Role-based access** | 4 | — | 4 | 3 | 5 | 4 | 4 | JWT payload carries `role`. All project routes guarded by `authenticateToken`. POST/PUT route role-branched. Test 2 confirms unauthenticated 401 and supervisor-submit 403. Student and supervisor UIs differ correctly. | `GET /api/projects` is authenticated but **not scoped**: students see all projects, not only their own. This is the one outstanding functional gap. |
| **Main create action** | 5 | 5 | 5 | 5 | 5 | 4 | 5 | `POST /api/projects`: student-only guard (403 for supervisor), `validateProjectInput` middleware (title 3–100, description 10–1000, category enum, supervisor_name 3–100), required-field check. Test 3 confirms DB row created with correct `student_id` and `status = Pending`. | `student_name` taken from `req.user.username` (auth token) — cannot be spoofed. Correct design. |
| **Main view/list action** | 3 | 4 | 2 | 2 | 3 | 3 | 4 | `GET /api/projects`: authenticated, parameterised filters, DESC order. Tested via Test 8. Student UI labels section "My Submissions" but shows all projects. | **Student record scoping missing.** A logged-in student sees all other students' projects. The "My Submissions" label is misleading. No length cap on filter query params. |
| **Main update/status/cancel action** | 4 | 5 | 5 | 5 | 5 | 4 | 4 | `PUT /api/projects/:id`: fetches project first (404 if missing), student-ownership check (403), status-guard (student edit only on `Revision Requested`). Tests 4, 6, 7 cover blocked Pending edit, edit-on-revision, and Approved-lock. Supervisor fields are enum-validated. | Student cannot withdraw/delete a project — not in case scope. Cancel edit is UI-only (resets form state; no delete endpoint). |
| **Protected action** | 5 | 5 | 5 | 5 | 5 | 4 | 4 | Supervisor-only: `status` (4-value enum, lines 248–254) and `supervisor_feedback` (1000-char cap, lines 255–261). Student-only: `title`, `description`, `category`, `supervisor_name` (stripped from supervisor PUT). Test 5 (revision), Test 7 (approval) and blocking checks confirmed. Field-stripping is role-branched, not silently ignored. | Status-update dropdown in UI shows all 4 values consistently with backend enum. Previous H1 gap (arbitrary status string) is closed. |
| **Secondary feature** | 4 | 4 | 3 | 2 | 4 | 3 | 4 | `GET /api/projects?supervisor_name=&category=&status=` all wired. Frontend filter bar: text input + two dropdowns + Reset. Test 8 verifies `status=Approved` filter returns only Approved rows. | `supervisor_name` LIKE partial match (inconsistent with category/status exact match). No debounce on supervisor text input (DB query per keystroke). No length cap on filter params. |
| **Case-specific: project title, category, supervisor, and status fields** | 5 | 5 | 5 | 5 | 5 | 4 | 5 | All four fields present in DB schema, submission form, project card, filter bar, and server validation. `category` validated against `ALLOWED_CATEGORIES` enum server-side (lines 101–104). `status` defaults to `Pending`, transitions via supervisor PUT with enum check. | `supervisor_name` is free-text (not FK to `users`) — intentional per case brief. `status` column is `VARCHAR(50)`, not a MySQL ENUM — minor schema note. |
| **Case-specific: supervisor feedback workflow** | 5 | 5 | 5 | 4 | 5 | 4 | 4 | Supervisor sees inline textarea + status dropdown per card. Save Review calls `PUT /api/projects/:id` with `status` + `supervisor_feedback`. Feedback capped at 1000 chars server-side. Student view shows feedback read-only in styled `feedback-section` block. Test 5 sets `Revision Requested` + feedback; Test 7 sets `Approved` + feedback; both verified in DB. | `alert()` still used on line 225 for "Review saved successfully!" — not a professional in-page notification. |
| **Case-specific: student ownership and supervisor-only approval** | 4 | 5 | 5 | 5 | 5 | 4 | 4 | `PUT` enforces student ownership (`project.student_id !== req.user.id` → 403). Students cannot set `status` or `supervisor_feedback` (field stripping by role branch). Students can only edit during `Revision Requested` phase. Supervisor cannot write student fields. Test 7 confirms student is blocked after Approved. | `GET /api/projects` is not scoped: a student can read all projects (not just their own). Write-path ownership is enforced; read-path is not. |
| **UI / manual usability** | 4 | — | — | 4 | 0 | 4 | 4 | Clean two-column layout, status badges (4 colours: pending/approved/rejected/revision-requested), login page with demo credentials helper, role-aware panels, filter bar, edit/cancel flow, in-page success/error alerts (for submit). Responsive at 900 px. `index.css` simplified to 6-line reset (Vite scaffold conflict removed). | `alert()` for Save Review remains. No loading spinner for supervisor Save Review action. `frontend/README.md` is Vite scaffold, not project documentation. |
| **Security posture** | 4 | — | 4 | 4 | 2 | 3 | — | JWT, bcrypt (cost 10), restricted CORS (`allowedOrigins`), rate limiting (login 15/15 min, general 150/15 min), parameterised queries throughout, no DB credentials in frontend. Enum validation closes status and category injection vectors. | `.env` committed with `JWT_SECRET = supersecretkey123` (weak, guessable). `DB_PASSWORD` is empty. No backend `.gitignore`. JWT in `localStorage` is XSS-accessible. No HTTPS enforcement. |
| **Testing evidence** | 5 | 5 | 5 | 4 | 5 | 4 | — | `backend/test.js`: 8 integration tests using Node.js built-in `assert` + live DB. `npm test` → all 8 pass. Tests cover: login (both roles), unauthenticated 401, supervisor-submit 403, project create + DB validation, student blocked on Pending, revision cycle, final approval + student re-lock, filter API. Test data cleaned up via `DELETE` in `finally` block. | No test framework (no Jest/Vitest/Mocha); bare `assert` is sufficient but less structured. No frontend tests. No test for student record scoping (which is the gap). `npm test` requires server to be running on port 5001. |
| **Maintainability** | 3 | — | — | — | 3 | 3 | — | `validateProjectInput` extracted as reusable middleware. Rate limiters defined as named constants. CSS tokens in `:root`. `index.css` cleaned up to a minimal reset. Seed data uses dynamic `aliceId` lookup. | Single-file frontend (`App.jsx`, 548 lines). Single-file backend (`server.js`, 287 lines). No component separation. No custom hooks. No service/repository layer. `frontend/README.md` is Vite scaffold. No root README. No `.env.example`. No backend `.gitignore`. |

---

## 3. Project Structure and Run Commands

```
p1/
├── Case_Brief.md
├── MID_REVIEW.md
├── FINAL_REVIEW.md          ← this document
├── backend/
│   ├── .env                 ← DB and JWT config (committed — security risk)
│   ├── dbSetup.js           ← CREATE DATABASE, CREATE TABLE, seed users + projects
│   ├── server.js            ← Express API (287 lines)
│   ├── test.js              ← 8 integration tests (10 546 bytes)
│   ├── package.json         ← scripts: start, dev, db:init, test
│   └── node_modules/
└── frontend/
    ├── README.md            ← Vite scaffold README (not project docs)
    ├── index.html
    ├── vite.config.js
    ├── package.json         ← scripts: dev, build, lint, preview
    ├── eslint.config.js
    ├── public/
    └── src/
        ├── main.jsx
        ├── App.jsx          ← entire React app (548 lines)
        ├── App.css          ← all styles (523 lines, CSS custom properties)
        └── index.css        ← minimal body reset (6 lines, conflict resolved)
```

### Run Commands

| Step | Command | Directory |
|---|---|---|
| 1. Install backend deps | `npm install` | `backend/` |
| 2. Install frontend deps | `npm install` | `frontend/` |
| 3. Initialise DB + seed | `npm run db:init` | `backend/` |
| 4. Start backend | `npm run dev` | `backend/` — listens on port 5001 |
| 5. Start frontend | `npm run dev` | `frontend/` — listens on port 5173 or 5174 |
| 6. Run tests | `npm test` | `backend/` — requires backend running on port 5001 |

No root-level README or combined start script exists. Two separate terminal sessions are required.

---

## 4. Frontend / Backend Separation Check

**Result: ✅ Fully separated**

| Check | Result | Evidence |
|---|---|---|
| React and Express in separate directories | ✅ Pass | `/frontend` and `/backend` with separate `package.json` files |
| Separate `node_modules` | ✅ Pass | Each directory installs its own dependencies |
| React calls only Express routes | ✅ Pass | All `fetch` calls in `App.jsx` target `http://localhost:5001/api/*` (lines 59, 96, 167, 176, 210) |
| React never calls MySQL directly | ✅ Pass | `mysql2` package is not present in `frontend/package.json` |
| DB credentials not in frontend | ✅ Pass | `.env` is in `backend/` only; no `DB_*` vars referenced in any frontend file |
| Express is the sole data gateway | ✅ Pass | All reads and writes go through authenticated Express routes |

**One remaining concern:** The API base URL `http://localhost:5001` is hard-coded in five places in `App.jsx`. If the port changes, all five must be updated. A Vite `VITE_API_BASE_URL` env var or `vite.config.js` proxy would eliminate this.

---

## 5. Database Setup and Table Summary

### Environment Variables (DB Connection)

| Variable | Configured | Value (redacted) |
|---|---|---|
| `DB_HOST` | ✅ Yes | `localhost` |
| `DB_PORT` | ✅ Yes | `3306` |
| `DB_USER` | ✅ Yes | `root` |
| `DB_PASSWORD` | ✅ Yes | *(empty — set to blank in `.env`)* |
| `DB_NAME` | ✅ Yes | `c9p1` |

The connection pool in `server.js` (lines 29–38) reads all five variables via `process.env`. The `dbSetup.js` script (line 8) reads the same five variables for the setup connection. **The password is blank in `.env`; this is suitable for a local dev MySQL root account with no password set, but would be a critical security failure if deployed.**

### Tables

| Table | Present | Schema Summary |
|---|---|---|
| `users` | ✅ Yes | `id` INT PK AUTO_INCREMENT, `username` VARCHAR(100) UNIQUE NOT NULL, `password` VARCHAR(255) NOT NULL (bcrypt), `role` VARCHAR(50) NOT NULL |
| `projects` | ✅ Yes | `id` INT PK, `title` VARCHAR(255), `description` TEXT, `category` VARCHAR(100), `student_name` VARCHAR(150), `supervisor_name` VARCHAR(150), `submitted_date` TIMESTAMP DEFAULT NOW, `status` VARCHAR(50) DEFAULT 'Pending', `supervisor_feedback` TEXT NULL, `student_id` INT FK → `users.id` ON DELETE SET NULL |

A **`users`/login table exists** and is the credential source for JWT issuance.

### Repeatable Setup

`npm run db:init` (from `backend/`):
1. Connects to MySQL using `.env` credentials
2. `CREATE DATABASE IF NOT EXISTS c9p1`
3. `DROP TABLE IF EXISTS projects` → `DROP TABLE IF EXISTS users`
4. `CREATE TABLE users` + `CREATE TABLE projects` (FK: `projects.student_id → users.id`)
5. bcrypt-hashes passwords and inserts 2 seed users (`alice` / `dr_john`)
6. Queries Alice's `id` dynamically, then inserts 2 demo projects

This is fully repeatable and idempotent. The DROP + CREATE approach is destructive — re-running deletes all submitted projects — but acceptable for a prototype. There is no migration system.

**Seed Users:**

| Username | Password | Role |
|---|---|---|
| `alice` | `password123` | `student` |
| `dr_john` | `password123` | `supervisor` |

**Seed Projects:**

| Title | Student | Status | Notes |
|---|---|---|---|
| Smart Attendance System | Alice Smith | Pending | `student_id = alice.id` (FK linked) |
| E-Commerce Mobile App | Bob Johnson | Approved | `student_id = null` (Bob not in users; orphan row) |

---

## 6. Login and Role / Access Explanation

### Login Workflow

1. User submits `username` + `password` to `POST /api/auth/login` (rate-limited: 15 attempts / 15 min)
2. Backend queries `SELECT * FROM users WHERE username = ?` (parameterised)
3. `bcrypt.compare` checks the submitted password against the stored hash
4. If match: `jwt.sign({ id, username, role }, JWT_SECRET, { expiresIn: '1d' })` — token issued
5. Response: `{ token, role, username }`
6. Frontend stores entire response object in `localStorage` as `userSession`
7. On next page load, `useEffect` reads `localStorage` and restores session without re-login

### How Roles Are Checked

| Layer | Mechanism |
|---|---|
| **Backend middleware** | `authenticateToken` verifies JWT signature and injects `req.user` (`{ id, username, role }`) |
| **Route guard — POST** | `if (req.user.role !== 'student')` → 403 |
| **Route guard — PUT (student branch)** | `if (req.user.role === 'student')` → ownership check + status gate |
| **Route guard — PUT (supervisor branch)** | `else if (req.user.role === 'supervisor')` → status enum + feedback length |
| **Frontend — UI rendering** | `user.role === 'student'` conditionals control form vs info panel, edit button, feedback display |
| **Frontend — not trusted** | Frontend role checks are UI convenience only; all enforcement is in Express |

### Access Scoping

| Route | Student access | Supervisor access |
|---|---|---|
| `GET /api/projects` | Sees **all** projects (scoping gap) | Sees all projects |
| `POST /api/projects` | Can create own project | Blocked (403) |
| `PUT /api/projects/:id` (own, Revision Requested) | Can edit title, description, category, supervisor_name | Blocked by student branch |
| `PUT /api/projects/:id` (supervisor fields) | Blocked by supervisor branch | Can edit status + feedback |

---

## 7. Protected Action Explanation

**Protected actions per case brief:** Add or edit supervisor feedback; approve or reject projects (change status)

### How Protection Is Implemented

The `PUT /api/projects/:id` route is role-branched after the project is fetched:

**Student branch (lines 229–244):**
- Checks `project.student_id === req.user.id` — 403 if not own project
- Checks `project.status === 'Revision Requested'` — 403 if not in revision state
- Only allows: `title`, `description`, `category`, `supervisor_name`
- Automatically appends `status = 'Pending'` to reset the lifecycle on resubmission
- `supervisor_feedback` and `status` are **never in the allowed field list** for students

**Supervisor branch (lines 246–261):**
- Validates `status` against `['Pending', 'Approved', 'Rejected', 'Revision Requested']` — 400 if invalid
- Validates `supervisor_feedback` length ≤ 1000 chars
- `title`, `description`, `category`, `supervisor_name` are **never in the allowed field list** for supervisors

**UI layer (additional guard):**
- Edit button only shown when `project.status === 'Revision Requested'` (line 494)
- Supervisor review panel only rendered for `user.role !== 'student'` (line 504)
- Student feedback is read-only paragraph, no textarea

**Test coverage:**
- Test 4: Student blocked editing own Pending project → confirmed 403
- Test 5: Supervisor sets `Revision Requested` → confirmed 200 + DB state
- Test 6: Student edits during `Revision Requested` → confirmed 200 + status resets to `Pending`
- Test 7: Supervisor approves → confirmed 200 + student blocked again with 403

---

## 8. Validation Summary

| Validation Rule | Server-Side | Client-Side | Notes |
|---|---|---|---|
| Login: username and password required | ✅ | ✅ (`required` HTML) | Lines 124–126 |
| Title: 3–100 characters, string | ✅ | ✅ (`required` HTML) | `validateProjectInput` lines 89–93 |
| Description: 10–1000 characters, string | ✅ | ✅ (`required` HTML) | Lines 95–99 |
| Category: must be in `ALLOWED_CATEGORIES` | ✅ | ✅ (closed dropdown) | Lines 101–104; enum: Web Application, Mobile Development, AI & Machine Learning, Cybersecurity, Other |
| Supervisor name: 3–100 characters, string | ✅ | ✅ (`required` HTML) | Lines 107–110 |
| Status: must be in allowed enum on update | ✅ | ✅ (closed dropdown) | Lines 248–251; enum: Pending, Approved, Rejected, Revision Requested |
| Supervisor feedback: max 1000 characters | ✅ | ❌ (no `maxlength` attr) | Lines 256–258 |
| Student can only edit own project | ✅ | ✅ (button hidden) | Lines 231–233 |
| Student can only edit during Revision Requested | ✅ | ✅ (button hidden) | Lines 234–236 |
| No empty update (no authorized fields) | ✅ | — | Lines 266–268 |
| Filter query params: injection safe | ✅ (parameterised) | — | LIKE values are bound params; no length cap on filter params |

**Gaps remaining:**
- No `maxlength` attribute on feedback textarea (backend 1000-char cap exists; frontend does not hint this to the user)
- No server-side length cap on filter query parameters (`supervisor_name` filter accepts unlimited length)
- `description` min-length (10 chars) not enforced with `minlength` HTML attribute — only server-side

---

## 9. Automated and Manual Testing Summary

### Automated Tests (`npm test` from `backend/`)

**Command:** `npm test`  
**Runner:** Node.js built-in `assert` module (no external test framework)  
**Requirement:** Express server must be running on port 5001 before executing  
**All 8 tests passed on 2026-06-15.**

| Test | What It Checks | Result |
|---|---|---|
| Test 1 — Login | Both `alice` (student) and `dr_john` (supervisor) receive 200 + JWT token + correct role | ✅ Pass |
| Test 2 — Permissions | Unauthenticated GET → 401; Supervisor POST project → 403 | ✅ Pass |
| Test 3 — Create + DB | Student creates project; DB row verified directly via `SELECT`: `status = Pending`, correct `student_id` | ✅ Pass |
| Test 4 — Blocked Pending edit | Student PUT on own Pending project → 403 | ✅ Pass |
| Test 5 — Revision Requested | Supervisor sets `Revision Requested` + feedback; DB verified | ✅ Pass |
| Test 6 — Student resubmit | Student edits during Revision Requested; DB: updated title, `status` auto-reset to `Pending` | ✅ Pass |
| Test 7 — Final approval | Supervisor approves; student blocked again with 403 on Approved project | ✅ Pass |
| Test 8 — Filtering | `?status=Approved` filter; all returned rows have `status === 'Approved'` | ✅ Pass |
| Cleanup | `DELETE FROM projects WHERE id = ?` in `finally` block removes test row | ✅ Confirmed |

### What Was Not Automated

| Gap | Type |
|---|---|
| Student record scoping: `GET /api/projects` returning all rows to students | Not tested — no assertion that students only see their own projects |
| Frontend rendering | No UI tests; no Playwright, Cypress, or Vitest component tests |
| Invalid status string rejection | Not explicitly tested via test runner (covered by code review) |
| Feedback max-length enforcement | Not tested via automated test |
| Rate limiting behaviour | Not tested (would require many rapid requests) |
| CORS origin rejection | Not tested |
| Page reload session persistence | Manual only |

### Manual Checks Status (from mid-review list)

| Check | Status |
|---|---|
| `npm run db:init` creates tables and seeds users | ✅ Confirmed — runs to completion |
| Login as `alice` → student dashboard | ✅ Confirmed — app running at localhost:5174 |
| Login as `dr_john` → supervisor panel | ✅ Confirmed |
| Submit project as `alice` | ✅ Confirmed via Test 3 (automated) |
| Edit project as `alice` during Revision Requested | ✅ Confirmed via Test 6 (automated) |
| Try editing another student's project → 403 | ✅ Confirmed via Test 7 student-block assertion |
| Try setting `supervisor_feedback` as student | ✅ Confirmed by code review: field stripped, not in student branch |
| Save review as `dr_john` | ✅ Confirmed via Tests 5 and 7 (automated) |
| Apply all three filters simultaneously | ✅ Confirmed by Test 8 and code review |
| Page reload re-authenticates via `localStorage` | ✅ Manual — app at localhost:5174 restores session |
| `index.css` conflict resolved | ✅ Confirmed — `index.css` is now a 6-line body reset only |
| Browser network tab: only `localhost:5001` calls | ✅ Confirmed — no MySQL port visible in network requests |

---

## 10. Stage 11 Change Summary

The following items were added or changed after the mid-review stage. These represent the final-stage deliverables: testing, security hardening, maintainability cleanup, and the change request (Revision Requested workflow).

### Security Hardening (Post Mid-Review)

| Change | Location | Impact |
|---|---|---|
| CORS restricted from `cors()` (any origin) to `allowedOrigins` whitelist | `server.js` lines 15–24 | Only `localhost:5173` and `localhost:5174` are accepted |
| Rate limiter added to login endpoint | `server.js` lines 49–57 (`loginLimiter`: 15/15 min) | Brute-force login now blocked |
| Rate limiter added to all API routes | `server.js` lines 41–57 (`generalLimiter`: 150/15 min) | DoS via API flooding mitigated |
| `express-rate-limit` added to `backend/package.json` dependencies | `package.json` | New production dependency |

### Validation Hardening (Post Mid-Review)

| Change | Location | Impact |
|---|---|---|
| `validateProjectInput` middleware added | `server.js` lines 86–114 | Title (3–100), description (10–1000), category (enum), supervisor_name (3–100) all server-validated |
| Status enum validated on supervisor PUT | `server.js` lines 248–251 | Status must be one of 4 allowed values; arbitrary strings now rejected with 400 |
| Supervisor feedback max-length validated | `server.js` lines 256–258 | Feedback > 1000 chars rejected with 400 |
| `ALLOWED_CATEGORIES` constant defined | `server.js` lines 78–84 | Single source of truth for category enum |

### Revision Requested Workflow (Change Request, Post Mid-Review)

| Change | Location | Impact |
|---|---|---|
| `Revision Requested` added as 4th status value in enum | `server.js` lines 248–251 | Supervisor can now request revision without rejecting |
| Student edit gate changed from `status === 'Pending'` to `status === 'Revision Requested'` | `server.js` lines 234–236 | Students can only edit when revision is explicitly requested |
| Student resubmit auto-resets `status` to `Pending` | `server.js` line 244 | Lifecycle resets cleanly after student edits |
| UI: Edit Details button shows only for `Revision Requested` projects | `App.jsx` line 494 | Matches the new backend gate |
| UI: `Revision Requested` option added to filter status dropdown | `App.jsx` line 447 | Filter works for the new status |
| UI: `Revision Requested` option added to supervisor status dropdown | `App.jsx` line 516 | Supervisor can select it from the review panel |
| CSS: `.status-badge.revision-requested` style added | `App.css` lines 218–221 | Blue badge for the new status renders correctly |

### Testing (Post Mid-Review)

| Change | Location | Impact |
|---|---|---|
| `backend/test.js` created (259 lines, 8 tests) | `backend/test.js` | Full integration test coverage of the happy path and blocking checks |
| `"test": "node test.js"` added to backend scripts | `backend/package.json` line 11 | `npm test` now runs the test suite |

### Maintainability (Post Mid-Review)

| Change | Location | Impact |
|---|---|---|
| `index.css` cleaned from Vite scaffold to 6-line body reset | `frontend/src/index.css` | Removed the 56 px `h1` and `#root` 1126 px border that conflicted with `App.css` |
| In-page success/error alerts added to student submit form | `App.jsx` lines 308–309 | Replaces no-feedback state; error and success messages render inline |

### What Was NOT Changed

- `GET /api/projects` was not scoped for students (outstanding gap)
- `alert()` on line 225 (Save Review) was not replaced with in-page notification
- No backend `.gitignore` was added (`.env` remains committable)
- No `.env.example` was added
- No root README with combined run instructions was added
- `supervisor_name` debounce was not added
- `App.jsx` was not split into components
- `server.js` was not split into routes / controllers

---

## 11. Stage Drift / Early Work

The following items were implemented earlier than their designated stage. All of these were identified in the mid-review.

| Item | Stage it belongs to | Current state |
|---|---|---|
| JWT authentication with bcrypt | Security hardening | Fully implemented from the beginning; carried forward correctly |
| `bcryptjs` + `jsonwebtoken` dependencies | Security hardening | Present in initial `package.json` |
| Token-based session persistence (`localStorage`) | Security/UX | Present from initial implementation |
| Student ownership enforcement in PUT | Could be security stage | Present from initial implementation |

These early implementations were all **net positive** for correctness and did not pre-build out-of-scope features. No admin panel, file upload, email notification, WebSocket, or other out-of-scope items were found anywhere in the codebase.

**New stage drift identified at final review:** None — the final-stage additions (tests, security hardening, validation, Revision Requested workflow) are all appropriately scoped.

---

## 12. Security Risks and Exposed-Secret Check

> Secrets are acknowledged by name only. No secret values are printed in this review.

| Risk | Severity | Status | Location |
|---|---|---|---|
| `JWT_SECRET` is weak and committed to the repository in `.env` | 🔴 Critical | **Not fixed** | `backend/.env` line 7 — value is a dictionary word with numbers |
| `DB_PASSWORD` is empty and committed | 🔴 Critical | **Not fixed** | `backend/.env` line 5 — acceptable for local-only dev, critical if deployed |
| `.env` not in `.gitignore` (backend has no `.gitignore`) | 🔴 Critical | **Not fixed** | No `.gitignore` exists under `backend/` |
| JWT stored in `localStorage` (accessible to JavaScript, XSS-vulnerable) | 🟠 High | **Not fixed** | `App.jsx` lines 39–47, 104 — HTTP-only cookies would be more secure |
| No HTTPS enforcement | 🟠 High | **Not fixed** | Plain HTTP for all API calls — acceptable for local dev only |
| No token refresh / expiry UI | 🟡 Medium | **Not fixed** | Expired token silently logs out on next fetch (401 triggers `handleLogout`) |
| `supervisor_name` filter: no length cap on query param | 🟡 Medium | **Not fixed** | Parameterised LIKE query is safe from injection; oversized value just performs a slow search |
| API base URL hard-coded to `localhost:5001` | 🟡 Medium | **Not fixed** | Five locations in `App.jsx` |
| `DB_PASSWORD` empty at rest | 🟡 Medium | **Not fixed** | MySQL root with no password is insecure in any non-local environment |

**Items fixed since mid-review:**
- CORS no longer open to all origins ✅
- Login brute-force now rate-limited ✅
- Category and status enum injection vectors closed by validation ✅

---

## 13. Documentation / Code Mismatches

| Mismatch | Location | Detail |
|---|---|---|
| `frontend/README.md` is the Vite scaffold template | `frontend/README.md` | Contains no project-specific setup, credentials, or run instructions |
| No root-level README | Project root | No file explains the two-directory structure or combined run steps |
| No `.env.example` | `backend/` | A new developer has no template to understand what variables are required without reading `server.js` |
| Mid-review listed student edit only for `Pending` projects | `MID_REVIEW.md` table row for "Main update/status/cancel action" | The final code changed the gate to `Revision Requested` — correct implementation, but mid-review description is now outdated |
| Mid-review issue H1 ("supervisor can persist invalid status strings") was marked as an open gap | `MID_REVIEW.md §9 H1` | This was fixed: `server.js` lines 248–251 now validate the enum |
| Mid-review issue M1 ("index.css Vite scaffold conflict") was marked as open | `MID_REVIEW.md §9 M1` | This was fixed: `index.css` is now a 6-line reset |
| Mid-review listed "No tests" (score 0 in Testing Evidence) | `MID_REVIEW.md` scoring matrix | `test.js` now exists and all 8 tests pass |
| `supervisor_name` filter LIKE vs exact match inconsistency documented at mid-review | `MID_REVIEW.md §9 L1` | Still present; not addressed at final stage |

---

## 14. Known Limitations

| # | Limitation | Impact | Mitigation in scope? |
|---|---|---|---|
| L1 | `GET /api/projects` returns all projects to all authenticated users; students are not scoped to their own submissions | Privacy; "My Submissions" label misleading | No — was not fixed despite being flagged at mid-review |
| L2 | JWT stored in `localStorage` instead of HTTP-only cookies | XSS could steal the token | No |
| L3 | `JWT_SECRET` is weak and committed | Token forgery risk if repo is exposed | No |
| L4 | No backend `.gitignore`; `.env` can be committed | Secret exposure in version control | No |
| L5 | `alert()` used for "Review saved successfully" confirmation (line 225) | Blocks browser tab; poor UX | No |
| L6 | No debounce on supervisor filter text input | DB query fires on every keystroke | No |
| L7 | `supervisor_name` is free-text, not linked to a `users` row | A student can submit to a non-existent supervisor | By design (case brief) |
| L8 | Second seed project (`Bob Johnson`) has `student_id = null` | Bob cannot log in or own the project; ownership test for that row is impossible | Minor — affects demo data only |
| L9 | `App.jsx` is a single 548-line file | Hard to maintain as project grows | Acceptable at prototype scale |
| L10 | API base URL hard-coded to `localhost:5001` in 5 places | Breaks on port change | Low risk for prototype |
| L11 | No test for student record scoping gap (L1) | The gap is untested and invisible in test results | The gap itself is the blocker |
| L12 | `frontend/README.md` is Vite scaffold; no project README | Onboarding gap | No |
| L13 | No `maxlength` HTML attribute on feedback textarea | User gets no UI hint about the 1000-char server limit | Minor |

---

## 15. Demo Script

Use this script to demonstrate all key features in approximately 10 minutes.

### Setup (run once before demo)
```
# Terminal 1 (backend)
cd backend
npm run db:init     # creates database, tables, seeds alice + dr_john
npm run dev         # starts Express on port 5001

# Terminal 2 (frontend)
cd frontend
npm run dev         # starts Vite on port 5173 or 5174
```
Open browser at `http://localhost:5173` (or 5174).

---

### Demo Flow

**Step 1 — Login as Student (alice)**
- Enter `alice` / `password123`
- Show JWT stored in localStorage (DevTools → Application → Local Storage)
- Show student dashboard: "New Project Submission" form on left, "My Submissions" on right

**Step 2 — Submit a Project**
- Fill in: Title = `AI Chatbot for Library`, Description = `A conversational AI assistant using GPT-4 to answer library queries`, Category = `AI & Machine Learning`, Supervisor = `Dr. John Doe`
- Click Submit — show green success alert; card appears in right panel with status badge `Pending`
- Note: Edit Details button is NOT visible (project is Pending)

**Step 3 — Login as Supervisor (dr_john)**
- Click Logout; login as `dr_john` / `password123`
- Show all projects visible in the supervisor panel (both alice's and the seed projects)
- Demonstrate filter: select `AI & Machine Learning` from Category dropdown → list narrows
- Click Reset to restore full list

**Step 4 — Request Revision**
- Find the AI Chatbot project; set status to `Revision Requested`
- Add feedback: `Please include a system architecture diagram in the description`
- Click Save Review — confirm `alert()` appears with "Review saved successfully!"
- Status badge changes to the blue `Revision Requested` badge

**Step 5 — Login back as Student (alice)**
- Login as `alice` / `password123`
- Find the AI Chatbot project — show feedback block and the now-visible blue `Edit Details` button
- Click Edit Details — form pre-fills with current values
- Update description to include the requested architecture information
- Click Update Project — status badge returns to `Pending` (lifecycle reset)

**Step 6 — Supervisor Final Approval**
- Login as `dr_john`; find the project (now `Pending` again after resubmit)
- Set status to `Approved`, add feedback: `Well done. Approved.`
- Save Review

**Step 7 — Show Security (Backend Enforcement)**
- Open browser DevTools Network tab
- Login as `alice`; attempt to call `PUT /api/projects/{id}` with `status: "Approved"` using fetch in console — show 403 response
- Demonstrate: the student branch strips `status` and `supervisor_feedback`

**Step 8 — Run Automated Tests**
```
# In backend terminal (server must be running)
npm test
```
Walk through the 8 test names printed to console; show `🎉 ALL TESTS PASSED`.

---

## 16. Suggested Viva Questions

### Core Concepts

1. **What is JWT and why did you use it instead of sessions?**  
   *Expect: stateless, scalable, role in payload, signed not encrypted, 1-day expiry.*

2. **How does `bcrypt` protect passwords and what does "cost factor 10" mean?**  
   *Expect: one-way hash, salt prevents rainbow tables, cost controls compute time.*

3. **Why is the JWT stored in `localStorage` instead of a cookie? What is the security trade-off?**  
   *Expect: `localStorage` is simpler but XSS-accessible; HTTP-only cookies prevent JS access.*

4. **What is the `authenticateToken` middleware and where does it run?**  
   *Expect: reads Authorization header, verifies JWT signature, injects `req.user`, applied to all project routes.*

### Role-Based Access

5. **If a student sends a PUT request with `{ "status": "Approved" }`, what happens and why?**  
   *Expect: 403 if project is not `Revision Requested`; if it is, the student branch never adds `status` to the field list, so it is silently ignored — the resubmit always sets `status = 'Pending'`.*

6. **How do you prevent a student from editing another student's project?**  
   *Expect: `project.student_id !== req.user.id` check in the student branch of PUT, returns 403.*

7. **Why is the frontend role check not sufficient on its own?**  
   *Expect: frontend can be bypassed using DevTools or curl; backend is the authoritative guard.*

### Database and Persistence

8. **What does `ON DELETE SET NULL` mean for the `student_id` foreign key?**  
   *Expect: if a user row is deleted, `projects.student_id` becomes NULL rather than the row being deleted (cascade).*

9. **Why does `npm run db:init` drop the tables before recreating them? What is the risk?**  
   *Expect: ensures a clean schema; risk is data loss on re-run — all submitted projects are deleted.*

10. **How would you scope `GET /api/projects` so students only see their own submissions?**  
    *Expect: add `if (req.user.role === 'student') conditions.push('student_id = ?'); values.push(req.user.id);` before the query.*

### Testing

11. **Your `npm test` requires the server to be running. What is the problem with this and how could you fix it?**  
    *Expect: coupling to a live server makes tests fragile; could use `supertest` to mount Express in-process, or mock the DB layer.*

12. **Test 3 validates the database row directly. Why is that important?**  
    *Expect: the API returning 201 only proves the HTTP layer works; DB validation proves persistence.*

13. **What is the cleanup step in `test.js` and why is it in a `finally` block?**  
    *Expect: `DELETE FROM projects WHERE id = ?` removes the test row; `finally` ensures cleanup even if a test assertion throws.*

### Security and Validation

14. **What does `validateProjectInput` do and where in the middleware chain does it run?**  
    *Expect: runs after `authenticateToken`, before route handler; validates title length, description length, category enum, supervisor_name length.*

15. **Why is the `.env` file a security risk in this project?**  
    *Expect: contains `JWT_SECRET` (weak, committed), `DB_PASSWORD` (empty but committing the pattern exposes values in shared repos); no `.gitignore` prevents accidental push.*

16. **What is rate limiting and what does it protect against in this app?**  
    *Expect: `loginLimiter` blocks brute-force credential guessing (15 attempts / 15 min); `generalLimiter` prevents DoS flooding.*

### Design Decisions

17. **Why does `student_name` come from `req.user.username` rather than a form field?**  
    *Expect: prevents a student from submitting a project under another student's name; the authenticated token is the source of truth.*

18. **The `Revision Requested` status was added as a change request. How does it affect the full project lifecycle?**  
    *Expect: Pending → Revision Requested (supervisor) → edit unlocked (student) → Pending (auto-reset on resubmit) → Approved or Rejected (supervisor).*

19. **What would you change if this prototype needed to go to production?**  
    *Expect: strong random `JWT_SECRET` in env, HTTP-only cookie for token, HTTPS, student record scoping in GET, DB password, proper `.gitignore`, component separation, root README.*

---

*End of FINAL_REVIEW.md*
