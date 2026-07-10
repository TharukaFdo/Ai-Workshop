# Mid-Project Review — Internship Application Tracker

**Review Date:** 2026-07-08  
**Stage Under Review:** After secondary feature (filter) stage, before testing, security hardening, and maintainability cleanup  
**Reviewer:** Antigravity AI Code Review  
**Project Path:** `p3/`  
**Case:** Internship Application Tracker (Roles: Student, Coordinator)

---

## 1. Mid-Review Summary

The prototype is structurally sound and covers the majority of the required functional scope for its current stage. The React frontend (Vite, port 3000) and Express backend (port 5000) are properly separated with a Vite dev proxy. The backend is the single point of MySQL access; no database credentials reach the frontend. Database setup and seeding are scripted and repeatable. Login is fully database-backed with SHA-256 password hashing and a custom HMAC-signed token that carries `user.id` and `user.role`. All protected routes use an `authMiddleware` that verifies the token signature before allowing access. Role-based guards are enforced at the route layer for every sensitive action.

The main submission workflow, coordinator review/decision workflow, and the secondary filter feature are all implemented end-to-end. Key gaps before the next stages are: `JWT_SECRET` is not in `.env` (hardcoded fallback is present in source), CORS is wide-open (`cors()` with no origin restriction), password hashing uses SHA-256 instead of bcrypt, there is no combined reset+reseed convenience command, `submittedDate` is user-editable rather than auto-set server-side, an explicit student delete/withdraw action is absent, and there are no test files or test runner configuration of any kind. No future-stage work (rate limiting, helmet, integration tests) was pre-implemented — stage drift is not present.

---

## 2. Review Scoring Matrix

> Score meaning: 0 = missing · 1 = present but mostly not working · 2 = partially working with major gaps · 3 = mostly working with important gaps · 4 = working with minor gaps · 5 = complete for selected case scope

| Feature / Area | Functionality 0-5 | Data Persistence 0-5 | Backend Security / Role Control 0-5 | Validation / Error Handling 0-5 | Testing Evidence 0-5 | Maintainability 0-5 | UI / Manual Usability 0-5 | Evidence | Notes |
|---|---:|---:|---:|---:|---:|---:|---:|---|---|
| Project setup and run commands | 5 | 5 | — | — | — | 4 | — | `package.json` root: `install:all`, `dev`, `db:setup`, `db:reset`; README covers all steps | `JWT_SECRET` absent from `.env`; no combined `db:fresh` command |
| Database setup and starter data | 5 | 5 | — | — | — | 4 | — | `scripts/dbSetup.js` creates DB, both tables, seeds 2 students + 1 coordinator + 4 sample applications idempotently | `DB_NAME` fallback differs between `config/db.js` (`'internship_tracker'`) and `scripts/dbSetup.js` (`'c4p3'`) |
| Login workflow | 5 | 5 | 3 | 4 | 0 | 4 | 5 | `POST /api/auth/login` queries `users` table, SHA-256 compares, returns HMAC-signed custom token; localStorage persistence; login page shows seeded credentials | SHA-256 (no salt) is not a safe password KDF; `JWT_SECRET` hardcoded fallback; no login lockout |
| Role-based access | 5 | — | 5 | 4 | 0 | 4 | 5 | `authMiddleware` validates HMAC on every `/api/applications` route; coordinator vs. student branches in GET, POST, PUT, and `/decision` all present; student list forced to own records | CORS is open (`cors()` — no origin whitelist); no rate limiting |
| Main create action | 5 | 5 | 5 | 5 | 0 | 4 | 5 | `POST /api/applications` student-only guard, all-fields required, end > start date check, inserts with `status='submitted'`; client mirrors these checks; UI refreshes on success | `submittedDate` user-editable in both UI and API (should be auto-stamped server-side) |
| Main view/list action | 5 | 5 | 5 | 4 | 0 | 4 | 5 | `GET /api/applications` forces `student_id` filter for students; coordinators see all; filter params forwarded; `GET /:id` checks ownership for students | No pagination; `SELECT *` in service always returns all columns |
| Main update/status/cancel action | 4 | 4 | 5 | 5 | 0 | 4 | 4 | `PUT /:id` checks ownership + `status='submitted'` guard; UI shows Edit only when status is `submitted`, shows "Locked" otherwise | No student delete/withdraw; no `submittedDate` update on re-edit |
| Protected action | 5 | 5 | 5 | 4 | 0 | 4 | 5 | `PUT /:id/decision` blocks non-coordinators (403); validates status against `VALID_STATUSES` whitelist; updates `status` + `coordinator_comment` atomically; review panel is coordinator-only in UI | No forward-only status transition guard; comment is optional (nulled if blank) |
| Secondary feature | 5 | — | 4 | 4 | 0 | 4 | 5 | Company name filter uses parameterised `LIKE %?%`; status filter uses exact match; both wired in frontend with `useEffect` re-fetch on change; both roles have filter UI | Frontend passes redundant `studentId` for students; no debounce on keystroke filter |
| Case-specific: internship company, position, and date fields | 5 | 5 | — | 5 | 0 | 4 | 5 | `company_name`, `position_title`, `start_date`, `end_date` present in DB schema as `VARCHAR`/`DATE NOT NULL`, in API body, and in UI form with `required` + JS date validation | `submitted_date` user-editable not server-stamped; no max-length enforcement in API layer |
| Case-specific: application status review lifecycle | 5 | 5 | 5 | 4 | 0 | 4 | 5 | Four-state ENUM (`submitted`, `underReview`, `approved`, `rejected`) in DB and in `VALID_STATUSES`; colour-coded badges in both role views; coordinator changes any listed state | No forward-only transition enforcement; no timestamp recorded on status change |
| Case-specific: coordinator comments and approval/rejection protection | 5 | 5 | 5 | 4 | 0 | 4 | 5 | `/decision` is coordinator-only at backend level; comment stored in `coordinator_comment TEXT NULL`; shown as read-only feedback in student view; no comment input in student form | Comment is optional with no minimum; no audit trail of who set the comment |
| UI / manual usability | 5 | — | — | 4 | 0 | 4 | 5 | Dark-mode design with Outfit font, gradient header, colour-coded badges, filter bar, loading states, alert banners; responsive grid with Vite/React | Alert banners do not auto-dismiss; plaintext seeded credentials on login page; no aria labels |
| Security posture | 2 | — | 3 | — | 0 | 3 | — | HMAC signature prevents role tampering; parameterised queries prevent SQL injection; no DB secrets in frontend | SHA-256 password hash (no salt); hardcoded secret fallback; CORS wildcard; no helmet; no rate limiting; `JWT_SECRET` not in `.env` |
| Testing evidence | 0 | 0 | 0 | 0 | 0 | 0 | 0 | No test files, no test runner config, no `test` script in any `package.json` | Full gap — expected at this stage but noted for Stage 8 |
| Maintainability | — | — | — | — | — | 3 | — | Well-commented routes and service functions; clear folder separation (routes/services/middleware/config); `.env.example` provided | All React logic in one 697-line `App.jsx`; no component decomposition; no shared API utility in frontend; no ESLint/Prettier; no `.gitignore` found |

---

## 3. Current Feature Status

| Feature | Implemented | Working End-to-End | Notes |
|---|:---:|:---:|---|
| Student login (DB-backed) | ✅ | ✅ | SHA-256 hash; no bcrypt |
| Coordinator login (DB-backed) | ✅ | ✅ | Same mechanism |
| Student application submission | ✅ | ✅ | All required fields; date validation |
| Student view own applications | ✅ | ✅ | Backend enforces `student_id` filter |
| Student edit own (submitted only) | ✅ | ✅ | Ownership + status guard at backend |
| Coordinator view all applications | ✅ | ✅ | No studentId restriction for coordinator |
| Coordinator approve/reject | ✅ | ✅ | Backend 403 for non-coordinator |
| Coordinator add/edit comments | ✅ | ✅ | Same `/decision` endpoint |
| Filter by company name (partial) | ✅ | ✅ | Parameterised LIKE match |
| Filter by status | ✅ | ✅ | Exact ENUM match |
| Status badge display (all 4 states) | ✅ | ✅ | Colour-coded in both role views |
| Coordinator comment display (student view) | ✅ | ✅ | Read-only feedback box |
| Student delete/withdraw application | ❌ | ❌ | Not required by spec; not implemented |
| Status transition enforcement (forward-only) | ❌ | ❌ | Any valid status can overwrite any other |
| Auto-stamped `submitted_date` | ❌ | ❌ | User-supplied, not server-set |
| Logout / session invalidation | ✅ | ✅ | Client-side token/user removal from localStorage |

---

## 4. Database and Persistence Status

### Tables Present (in `scripts/dbSetup.js`)

| Table | Present | Key Columns | Notes |
|---|:---:|---|---|
| `users` | ✅ | `id`, `username`, `password` (VARCHAR), `role` ENUM(`student`,`coordinator`), `created_at` | Column is `password` — REQUIREMENTS.md specifies `password_hash`; minor naming mismatch |
| `applications` | ✅ | `id`, `student_id` FK → `users.id`, `student_name`, `company_name`, `position_title`, `start_date DATE`, `end_date DATE`, `submitted_date DATE`, `status` ENUM, `coordinator_comment TEXT`, `created_at`, `updated_at` | All case-specific fields present; `updated_at` auto-updates on any change |

### Seed Data

| Seed | Present | Details |
|---|:---:|---|
| Demo users | ✅ | `student1`/`student123`, `student2`/`student123`, `coordinator1`/`coordinator123` — seeded only when `users` table is empty |
| Demo applications | ✅ | 4 applications covering all 4 statuses, some with coordinator comments — seeded only when `applications` table is empty |

### DB Setup Commands

| Command | Present | Notes |
|---|:---:|---|
| `npm run db:setup` (root) | ✅ | Idempotent; creates DB, tables, seeds if empty |
| `npm run db:reset` (root) | ✅ | Drops DB only — does **not** re-seed |
| Combined reset + reseed | ❌ | No `db:fresh` command; user must run two commands manually |

### DB_NAME Fallback Mismatch

- `backend/config/db.js` fallback: `'internship_tracker'`
- `backend/scripts/dbSetup.js` fallback: `'c4p3'`
- `backend/.env` value: `c4p3`

The `.env` value is used at runtime so this is non-critical, but the fallback strings are inconsistent and could cause confusion if `.env` is absent.

---

## 5. Login and Role/Access Status

### Login Type

**Database-backed.** `POST /api/auth/login` performs a real `SELECT` against the `users` table, compares a SHA-256 hash of the submitted password against the stored hash, and returns a custom HMAC-signed token on success. This is not mock-only and not a role-selector.

### Token Mechanism

The custom token (`id.role.signature`) is HMAC-SHA256-signed with a `JWT_SECRET` (falling back to a hardcoded string). The `authMiddleware` recomputes the signature on every request to verify authenticity. This prevents role tampering — a student cannot change their token to claim coordinator role without knowing the secret.

### Role Enforcement — Backend Checks

| Check | Route | Enforced |
|---|---|:---:|
| Auth required (token missing/invalid) | All `/api/applications/*` | ✅ |
| Students only can submit | `POST /api/applications` | ✅ |
| Students edit only own (if submitted) | `PUT /api/applications/:id` | ✅ |
| Students read only own list | `GET /api/applications` | ✅ |
| Students cannot access another student's detail | `GET /api/applications/:id` | ✅ |
| Coordinator-only decision endpoint | `PUT /api/applications/:id/decision` | ✅ |

### Login Gaps

- `JWT_SECRET` is **not** in `.env` — falls back to hardcoded `'prototype_secret_key_12345'`
- Password stored as plain SHA-256 (no salt) — vulnerable to rainbow table attacks
- No token expiry — tokens are valid forever once issued
- No account lockout after repeated failed login attempts

---

## 6. Protected Action Status

**Protected Action:** Add/edit coordinator comments and approve/reject applications

| Protection Layer | Present | Detail |
|---|:---:|---|
| Backend role check | ✅ | `PUT /:id/decision` returns HTTP 403 for any non-coordinator role |
| Status whitelist validation | ✅ | `VALID_STATUSES` array check; HTTP 400 returned for invalid values |
| UI restriction | ✅ | Review panel and "Review" button rendered only in the coordinator interface; no comment input exists in student interface |
| Token required (authMiddleware) | ✅ | `authMiddleware` runs before the decision route via `router.use(authMiddleware)` |

### Protected Action Gaps

- No status transition graph — a coordinator can set `approved → submitted` or `rejected → underReview`
- Comment is entirely optional; no requirement to include a reason when approving or rejecting
- No audit log (who made the decision, when)
- `coordinator_comment` is overwritten on every call — no comment history preserved

---

## 7. Validation Status

| Validation Rule | Client (React) | Backend (Express) | DB Constraint |
|---|:---:|:---:|:---:|
| All fields required on submit | ✅ | ✅ | `NOT NULL` |
| End date strictly after start date | ✅ | ✅ | — |
| Status must be in valid list | — | ✅ | ENUM |
| Username + password required on login | ✅ | ✅ | — |
| Status required for decision endpoint | — | ✅ | — |
| Student name non-empty | ✅ | ✅ | `NOT NULL` |
| Company name non-empty | ✅ | ✅ | `NOT NULL` |
| Position title non-empty | ✅ | ✅ | `NOT NULL` |

### Validation Gaps

- No max-length enforcement on text fields in the API layer (`VARCHAR(255)` in DB is the only cap)
- `submittedDate` is user-controlled — no server-side override to use the current date on insert
- Date format validity relies on MySQL `DATE` column type rejecting bad strings; no explicit ISO format check in JS
- No whitespace trimming on string inputs before DB insert (e.g., `"  Google  "` stores and matches literally)

---

## 8. Stage Drift or Early Implementation

**Stage drift: None detected.**

The following were reviewed and confirmed absent (correct for this stage):

- No test files, test runners (jest/vitest/mocha), or `test` npm scripts
- No security hardening packages (`helmet`, `express-rate-limit`, `cors` with origin list)
- No bcrypt or argon2 password hashing
- No input sanitisation library (`express-validator`, `sanitize-html`)
- No logging framework (`winston`, `pino`)
- No API documentation (`swagger`, `openapi`)
- No pagination or cursor-based sorting on list endpoints
- No environment-specific build configuration (staging vs. production)

The project contains exactly what the secondary-feature stage calls for, and no more.

---

## 9. Issues Found Before Stage 8

Issues are grouped by severity. **Do not fix during this review.**

### 🔴 High — Must address before security hardening

| # | Issue | Location | Detail |
|---|---|---|---|
| H-1 | Weak password hashing — SHA-256, no salt | `authRoutes.js`, `dbSetup.js` | SHA-256 is a general-purpose hash function, not a password KDF. No salt means identical passwords produce identical hashes. Must replace with bcrypt or argon2 before any real deployment. |
| H-2 | `JWT_SECRET` hardcoded fallback in source | `authMiddleware.js` line 4 | `'prototype_secret_key_12345'` is committed in source code. Add `JWT_SECRET` to `.env` and `.env.example`; remove the fallback value. |
| H-3 | Token never expires | `authMiddleware.js` | Custom token contains no expiry field. A stolen token is valid indefinitely. Add an `exp` claim and validate it in `authMiddleware`. |
| H-4 | CORS open to all origins | `server.js` line 9 | `app.use(cors())` allows any origin. Restrict to `http://localhost:3000` in development and to the production domain in production. |

### 🟡 Medium — Address in maintainability or security cleanup

| # | Issue | Location | Detail |
|---|---|---|---|
| M-1 | `submittedDate` is user-editable | `applicationRoutes.js` line 78, `App.jsx` lines 457–465 | Submission date should be auto-stamped by the server (`new Date().toISOString().split('T')[0]`) and ignored in the request body. |
| M-2 | No status transition guard | `applicationRoutes.js` line 177 | Any coordinator can move status backwards (e.g., `approved → submitted`). A transition whitelist enforcing the intended lifecycle would close this gap. |
| M-3 | `DB_NAME` fallback inconsistency | `config/db.js` line 9 vs `scripts/dbSetup.js` line 23 | One falls back to `'internship_tracker'`, the other to `'c4p3'`. Align both to `'c4p3'`. |
| M-4 | No combined reset + reseed command | `package.json` | `db:reset` drops DB but does not re-seed. Add `"db:fresh": "npm run db:reset --prefix backend && npm run db:setup --prefix backend"` at the root. |
| M-5 | No whitespace trimming on string inputs | `applicationRoutes.js`, `applicationService.js` | Text fields like `" Google "` store and match literally. Trim before insert and before filter queries. |
| M-6 | `users.password` column name vs spec | `dbSetup.js` line 37, `authRoutes.js` line 33 | REQUIREMENTS.md specifies `password_hash`. Rename the column for clarity and alignment with the spec. |
| M-7 | Filter inputs not debounced | `App.jsx` line 97 | Every keystroke in the company name filter triggers a `fetch`. Add a 300 ms debounce before the hardening stage. |

### 🔵 Low — Address in maintainability cleanup

| # | Issue | Location | Detail |
|---|---|---|---|
| L-1 | Monolithic `App.jsx` (697 lines) | `frontend/src/App.jsx` | All state, handlers, and UI in one file. Decompose into `LoginPage`, `StudentDashboard`, `CoordinatorDashboard`, `ApplicationForm`, `ApplicationTable` components. |
| L-2 | No frontend API service layer | `frontend/src/App.jsx` | All `fetch()` calls are inline. A dedicated `api.js` module would centralise base URL, bearer token header injection, and error handling. |
| L-3 | No ESLint or Prettier config | Project root | No code style enforcement. Add `eslint` + `prettier` with shared config. |
| L-4 | No `.gitignore` found | Project root | `node_modules`, `.env`, and `dist` directories would be committed. Create a `.gitignore` immediately. |
| L-5 | Alert banners do not auto-dismiss | `App.jsx` | Success alerts should auto-clear after ~4 s. Error alerts may remain until dismissed manually. |
| L-6 | No `<meta description>` in `index.html` | `frontend/index.html` | Only a `<title>` tag is present. SEO and accessibility meta tags are absent. |
| L-7 | No aria labels on interactive elements | `App.jsx` | Buttons and inputs lack `aria-label`/`aria-describedby` for screen reader support. |

---

## 10. Manual Checks Recommended Next

Before entering testing and hardening, manually verify the following:

| # | Check | How to Verify |
|---|---|---|
| MC-1 | Login blocks invalid credentials | Attempt login with a wrong password; expect HTTP 401 and a visible error message |
| MC-2 | Student cannot see the coordinator review panel | Log in as `student1`; confirm no "Review" button or status-edit form is rendered |
| MC-3 | Student sees only own applications | Log in as `student1`; confirm `student2`'s applications (Microsoft, Netflix) do not appear in the list |
| MC-4 | Student cannot edit a non-submitted application | Log in as `student1`; the Meta application has status `underReview` — confirm no Edit button is shown |
| MC-5 | Coordinator can set status and comment | Log in as `coordinator1`; click Review on an application; change status + add comment; confirm success message and DB row updated |
| MC-6 | Company name filter — partial match | Type `goo` in company filter as coordinator; confirm only the Google application is listed |
| MC-7 | Status filter works | Select `approved` in status dropdown as coordinator; confirm only the Microsoft application appears |
| MC-8 | Backend rejects student calling `/decision` | Use curl/Postman with a student token to `PUT /api/applications/1/decision`; expect HTTP 403 |
| MC-9 | Unauthenticated request is rejected | Call any `/api/applications` route without an `Authorization` header; expect HTTP 401 |
| MC-10 | DB credentials not in frontend build | Run `npm run build --prefix frontend`; search `dist/` for `DB_PASSWORD`, `DB_HOST`, `DB_USER`; expect zero results |
| MC-11 | Date validation — end before start | Submit application with `endDate` before `startDate`; expect client and/or server error message |
| MC-12 | Logout clears session | Log in, click Sign Out; open browser DevTools → Application → Local Storage; confirm `token` and `user` keys are gone |

---

## 11. Pass / Fail Table

| Criterion | Result | Notes |
|---|:---:|---|
| App appears runnable (scripts, dependencies, README) | ✅ PASS | All scripts present; README steps complete; `node_modules` present in all three locations |
| React frontend and Express backend are separated | ✅ PASS | Separate `frontend/` and `backend/` directories; Vite dev proxy (`/api → localhost:5000`) bridges them |
| React calls Express routes only — no direct MySQL | ✅ PASS | `mysql2` is not installed in frontend; no DB env vars referenced in any frontend file |
| Backend uses DB_HOST, DB_PORT, DB_USER, DB_PASSWORD, DB_NAME | ✅ PASS | All five env vars consumed in `config/db.js` and `scripts/dbSetup.js` |
| No DB secrets exposed in React | ✅ PASS | Grep confirmed zero DB variable references in `frontend/` |
| `users`/login table exists | ✅ PASS | `users` table created in `dbSetup.js` with `id`, `username`, `password`, `role` |
| `applications` table exists with all required fields | ✅ PASS | `company_name`, `position_title`, `start_date`, `end_date`, `status`, `coordinator_comment` all present |
| Repeatable DB setup and seed command | ✅ PASS | `npm run db:setup` is idempotent — seeds only when tables are empty |
| Login is database-backed (not mock / not role-selector) | ✅ PASS | Real DB query + SHA-256 hash comparison; returns signed token |
| Role restrictions enforced in backend | ✅ PASS | All six role-boundary checks present at route layer before any DB call |
| Protected action backend-protected (comments / approve / reject) | ✅ PASS | `PUT /:id/decision` returns HTTP 403 for non-coordinator at backend level |
| Students limited to own records | ✅ PASS | GET list forces `student_id = req.user.id`; GET detail ownership check returns 403 |
| Main workflow (submit → review → status update) implemented | ✅ PASS | Full end-to-end path implemented and working |
| Secondary feature (filter by company / status) implemented | ✅ PASS | Both filters working at backend and frontend with live re-fetch |
| Validation present (required fields, date logic, status enum) | ✅ PASS | Dual-layer validation (client + server); date comparison on both layers |
| No future-stage work pre-implemented (no stage drift) | ✅ PASS | No test files, no hardening libraries pre-added |
| Password hashing is production-safe | ❌ FAIL | SHA-256 with no salt — must upgrade to bcrypt or argon2 |
| `JWT_SECRET` managed in `.env` (not hardcoded) | ❌ FAIL | `JWT_SECRET` absent from `.env`; hardcoded fallback present in `authMiddleware.js` |
| CORS restricted to known origins | ❌ FAIL | Open `cors()` — no origin restriction |
| Token has expiry | ❌ FAIL | Custom token contains no `exp` claim; tokens are valid indefinitely |
| `submittedDate` server-stamped | ❌ FAIL | User-supplied; server should ignore and auto-set to current date |
| `.gitignore` present | ❌ FAIL | Not found; `node_modules` and `.env` would be committed |
| Test infrastructure present | ⚠️ EXPECTED GAP | Zero tests — expected and appropriate at this stage; flagged for Stage 8 |
