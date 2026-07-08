# Mid-Project Review — Equipment Booking System

**Review date:** 2026-06-07  
**Review stage:** After secondary-feature (filter) implementation; before testing, security hardening, and maintainability cleanup.  
**Reviewed by:** AI mid-project reviewer  
**Project stack:** React 19 (Vite) + Express 4 + MySQL 2  
**Repo root:** `p1/`  — `backend/` and `frontend/` as separate sub-directories.

---

## 1. Mid-Review Summary

The Equipment Booking System has reached a functional end-to-end state that covers all required features from the Case Brief. The React frontend and Express backend are correctly separated. The backend enforces role-based access control in code, not only in the UI. Passwords are stored in plaintext — acknowledged in a comment as a known simplification for this scope. Session tokens are persisted to a `sessions` database table, making authentication truly database-backed. The secondary filtering feature (equipment, date, status) is implemented on both the frontend and the backend query layer. No test files, security-hardening middleware (rate limiting, Helmet, HTTPS), or substantial maintainability tooling exist yet, which is expected at this stage.

The main gaps before the next phases are: plaintext password storage, no `.env` exclusion from the backend `.gitignore`, no CORS restriction, no session expiry, no input sanitisation beyond required-field checks, no frontend token refresh, and no project-level README with run commands.

---

## 2. Review Scoring Matrix

> Score meaning: 0 = missing · 1 = present but mostly not working · 2 = partially working with major gaps · 3 = mostly working with important gaps · 4 = working with minor gaps · 5 = complete for the selected case scope

| Feature / Area | Functionality 0–5 | Data Persistence 0–5 | Backend Security / Role Control 0–5 | Validation / Error Handling 0–5 | Testing Evidence 0–5 | Maintainability 0–5 | UI / Manual Usability 0–5 | Evidence | Notes |
|---|---:|---:|---:|---:|---:|---:|---:|---|---|
| Project setup and run commands | 3 | — | — | — | 0 | 2 | — | `backend/package.json` scripts: `start`, `dev`, `db:init`; `frontend/package.json` scripts: `dev`, `build`. No root-level README or unified start script. | Missing project-level README; `.env` not in backend `.gitignore`; `node_modules` present for both halves. |
| Database setup and starter data | 5 | 5 | — | — | 0 | 3 | — | `db-init.js` creates DB, all 3 tables, and seeds 2 staff + 1 assistant + 4 bookings in one `npm run db:init` command. | Passwords seeded as plaintext; re-running drops and recreates all data (destructive but repeatable). |
| Login workflow | 4 | 4 | 3 | 3 | 0 | 3 | 4 | `POST /api/login` queries `users` table, creates a `sessions` row with `crypto.randomBytes(32)` token. Token + user JSON stored in `localStorage`. | Plaintext password comparison (`WHERE password = ?`); no bcrypt; no session TTL; no HTTPS; CORS wildcard (`*`). |
| Role-based access | 4 | 4 | 4 | 3 | 0 | 3 | 4 | `authenticateToken` middleware resolves role from the `sessions` JOIN in every protected route. `GET /api/bookings` filters rows by `req.user.role === 'Staff'` server-side. `POST /api/bookings` returns 403 if not Staff. `PUT /api/bookings/:id/status` returns 403 if not Lab Assistant. | No backend `.gitignore` excludes `.env`; CORS is open; no rate limiting. |
| Main create action | 5 | 5 | 4 | 4 | 0 | 3 | 5 | `POST /api/bookings` — requires all 5 fields, sets `requested_user` from `req.user.username` (server-side), defaults status to `Pending`. Frontend form has dropdown, date, time pair, and textarea. | No date-in-the-past validation; no end-time-after-start-time validation on the backend. |
| Main view/list action | 5 | 5 | 5 | 3 | 0 | 3 | 5 | `GET /api/bookings` returns only own rows for Staff, all rows for Lab Assistant. Staff sees card layout; Lab Assistant sees table with all columns including `requested_user` and `assistant_comment`. | No pagination; no total count returned; `fetchBookings` error is only logged, not surfaced to the user. |
| Main update/status/cancel action | 4 | 4 | 4 | 4 | 0 | 3 | 4 | `PUT /api/bookings/:id` checks `requested_user === req.user.username` and `status === 'Pending'` before allowing edit. Frontend shows "Edit Request" button only on Pending cards. | No "cancel booking" (delete or soft-cancel) action exists; only field editing is supported. No backend date validation on update. |
| Protected action | 5 | 5 | 5 | 4 | 0 | 3 | 5 | `PUT /api/bookings/:id/status` hard-gated to `Lab Assistant` role by `req.user.role` check. Requires non-empty `assistant_comment`. Frontend review modal is only rendered in the Lab Assistant branch of the UI. | No check that the booking is still `Pending` before the status update (a double-click race); no audit log. |
| Secondary feature | 5 | 5 | 5 | 3 | 0 | 3 | 4 | Filter parameters `equipment`, `date`, `status` are sent as query strings and applied server-side in `GET /api/bookings` with parameterised queries. Both Staff and Lab Assistant views have the same filter bar with live update via `useEffect`. | No debounce on the equipment text filter (fires a request on every keystroke); no URL state persistence for filters. |
| Case-specific: equipment booking date/time and purpose fields | 5 | 5 | — | 3 | 0 | 3 | 5 | DB schema: `booking_date DATE`, `start_time TIME`, `end_time TIME`, `purpose TEXT` — all `NOT NULL`. Frontend: `<input type="date">`, `<input type="time">` × 2, `<textarea>`. Backend: required-field check on all 5 booking fields. | No backend validation that end_time > start_time or booking_date ≥ today. |
| Case-specific: booking approval/rejection with assistant comment | 5 | 5 | 5 | 4 | 0 | 3 | 5 | `PUT /api/bookings/:id/status` accepts `status ∈ {Approved, Rejected}` and non-empty `assistant_comment`. DB column `assistant_comment TEXT`. Frontend modal enforces non-empty comment before sending. Both validations (UI + backend) are present. | Approved/Rejected bookings cannot be re-reviewed (UI shows "Reviewed", backend does not restrict re-update by API). |
| Case-specific: staff-only ownership of own booking requests | 5 | 5 | 5 | 4 | 0 | 3 | 5 | `GET /api/bookings` appends `AND requested_user = req.user.username` for Staff — cannot be bypassed. `PUT /api/bookings/:id` explicitly checks `booking.requested_user !== req.user.username` and returns 403. `requested_user` is always set from `req.user.username` on create. | Staff could theoretically call `PUT /api/bookings/:id/status` and receive a 403 from the role check — tested path. |
| UI / manual usability | 4 | — | — | — | 0 | 3 | 4 | Clean two-panel layout for Staff; table layout for Lab Assistant. Dark-mode support via `prefers-color-scheme`. Status badges colour-coded. Modal animation present. Refresh button available. | No loading spinner during fetch; no empty-state illustration; App title in `index.html` still reads "frontend" (Vite default); `App.css` still contains unused Vite scaffold styles. |
| Security posture | 1 | — | 2 | — | 0 | 1 | — | Token-based session with DB lookup is a meaningful step above mock auth. Parameterised queries via `mysql2` prevent SQL injection. | Plaintext passwords; open CORS (`*`); no Helmet; no rate limiting; no HTTPS enforcement; no session expiry; `.env` not gitignored in backend; token in `localStorage` (XSS risk). |
| Testing evidence | 0 | 0 | 0 | 0 | 0 | 0 | — | No test files, no test runner, no test scripts in either `package.json`. No `data-testid` attributes in JSX. | As expected before the testing stage. |
| Maintainability | 2 | — | — | — | 0 | 2 | — | Single-file backend (`server.js`, 246 lines) and single-file frontend (`App.jsx`, 582 lines). No linting errors block the ESLint config, but `App.css` contains dead Vite scaffold styles. No JSDoc, no TypeScript, no component decomposition. | Acceptable for small scope but will hinder the security and testing stages. |

---

## 3. Current Feature Status

| Feature | Status |
|---|---|
| Staff: create booking request | ✅ Implemented and DB-backed |
| Staff: view own bookings | ✅ Implemented, server-enforced |
| Staff: edit own pending booking | ✅ Implemented with ownership + status check |
| Staff: cancel booking | ❌ Not implemented (no delete or soft-cancel) |
| Lab Assistant: view all bookings | ✅ Implemented |
| Lab Assistant: approve with comment | ✅ Implemented, role-gated |
| Lab Assistant: reject with comment | ✅ Implemented, role-gated |
| Filter by equipment | ✅ Implemented (LIKE, server-side) |
| Filter by date | ✅ Implemented (exact match, server-side) |
| Filter by status | ✅ Implemented (exact match, server-side) |
| Logout (session invalidation) | ✅ Implemented (deletes session row) |

---

## 4. Database and Persistence Status

**Tables present (defined in `db-init.js`):**

| Table | Purpose | Key Columns |
|---|---|---|
| `users` | Login identity and role | `id`, `username`, `password` (plaintext), `role ENUM('Staff','Lab Assistant')` |
| `sessions` | Token ↔ user mapping | `token VARCHAR(255) PK`, `user_id FK → users.id`, `created_at` |
| `bookings` | Main entity | `id`, `equipment_name`, `requested_user`, `booking_date DATE`, `start_time TIME`, `end_time TIME`, `purpose TEXT`, `status ENUM('Pending','Approved','Rejected')`, `assistant_comment TEXT`, `created_at` |

**Setup command:** `npm run db:init` (in `backend/`) — destructive/repeatable.  
**Seed users:** `john_doe` (Staff), `jane_smith` (Staff), `alice` (Lab Assistant) — all password `password123`.  
**Seed bookings:** 4 records covering all three statuses.

**Gaps:**
- `requested_user` is stored as a VARCHAR username string, not a foreign key to `users.id`. This breaks referential integrity if usernames change.
- No migration tooling (Flyway, db-migrate, Knex migrations). `db:init` is drop-and-recreate only.
- No `updated_at` column on `bookings`.

---

## 5. Login and Role/Access Status

**Login type:** Database-backed (not mock-only, not role-selector-only).  
**Mechanism:** Username + password POST → DB lookup → `crypto.randomBytes(32)` token stored in `sessions` table → returned to client → stored in `localStorage`.  
**Session resolution:** Every protected route calls `authenticateToken`, which re-queries `sessions JOIN users` to resolve `id`, `username`, and `role`.

**Role enforcement summary:**

| Route | Enforcement |
|---|---|
| `GET /api/bookings` | Auth required; Staff rows scoped by `req.user.username` in SQL |
| `POST /api/bookings` | Auth required; 403 if `req.user.role !== 'Staff'` |
| `PUT /api/bookings/:id` | Auth required; 403 if ownership mismatch; 400 if status ≠ Pending |
| `PUT /api/bookings/:id/status` | Auth required; 403 if `req.user.role !== 'Lab Assistant'` |
| `POST /api/logout` | No auth middleware (token extracted manually) |
| `GET /api/health` | Public |

**Gaps:**
- Passwords stored as plaintext (`WHERE password = ?`); no bcrypt or hashing.
- No session TTL — sessions live indefinitely until the user logs out.
- No HTTPS; token transmitted in plain HTTP headers locally.
- CORS is configured as `app.use(cors())` — defaults to `*` (all origins).

---

## 6. Protected Action Status

**Action:** Approve or reject a booking with an assistant comment  
**Route:** `PUT /api/bookings/:id/status`

**Backend checks (in order):**
1. `authenticateToken` middleware — must have a valid session token.
2. `req.user.role !== 'Lab Assistant'` → 403 returned immediately.
3. `status` not in `['Approved', 'Rejected']` → 400 validation error.
4. `assistant_comment` empty or whitespace → 400 validation error.
5. `affectedRows === 0` → 404 (booking not found).

**Frontend checks:**
- Review modal only rendered in `user.role === 'Lab Assistant'` branch.
- Client-side check: `assistantComment.trim()` empty → `setActionError()` before fetch.

**Gaps:**
- No backend check that the booking is still `Pending` before updating. A concurrent second review could overwrite a previous decision.
- No record of which Lab Assistant approved/rejected (no `reviewed_by` column).
- Staff role can call the endpoint directly via curl/Postman and receive 403 (correct), but no dedicated "already reviewed" guard exists.

---

## 7. Validation Status

| Location | What Is Validated |
|---|---|
| Frontend login form | Both fields non-empty (client-side only) |
| Backend `/api/login` | Both fields present (400); credentials match DB (401) |
| Frontend booking form | All 4 fields non-empty before fetch |
| Backend `POST /api/bookings` | All 5 fields present (400); role is Staff (403) |
| Backend `PUT /api/bookings/:id` | All 5 fields present (400); ownership (403); status Pending (400) |
| Backend `PUT /api/bookings/:id/status` | Role is Lab Assistant (403); status in allowed enum (400); comment non-empty (400) |

**Missing validations:**
- `booking_date` ≥ today (no past-date check on backend or frontend).
- `end_time` > `start_time` (no time logic validation).
- `purpose` minimum length or maximum length.
- `equipment_name` not validated against an allowed list on the backend (only a frontend dropdown; the API accepts any string).
- No rate limiting on login (brute-force risk).

---

## 8. Stage Drift / Early Implementation

| Area | Observation |
|---|---|
| Authentication | Token-based DB session auth is more complete than a typical "Stage 1" mock-auth. This is appropriate for the case scope but will need hardening before production. |
| Role enforcement | Backend role enforcement is present from the start — correct, not early. |
| Parameterised queries | Used throughout — good practice included early; no SQL injection risk from application code. |
| Dark mode | `prefers-color-scheme` CSS implemented alongside the main UI — cosmetic extra, no harm. |
| Modal animation | `@keyframes modalEnter` — minor early polish, harmless. |
| `App.css` scaffold styles | Vite-default `App.css` still contains `.counter`, `.hero`, `.ticks`, etc. — dead code from the template, not application logic. Should be cleaned. |
| No early test stubs | No test files created ahead of the testing stage — correct scope management. |
| No security middleware | Helmet, rate-limit, bcrypt, HTTPS — all absent. Correct at this stage; scheduled for security hardening. |

**Verdict:** No significant stage drift. One minor leftover: Vite scaffold code in `App.css`.

---

## 9. Issues Found Before Stage 8

### Critical (must fix before security hardening)

| # | Issue | Location | Impact |
|---|---|---|---|
| C1 | Passwords stored as plaintext in DB | `db-init.js` seeds + `server.js` L56 | Any DB read exposes all credentials |
| C2 | `.env` is not in backend `.gitignore` | `frontend/.gitignore` (backend has no `.gitignore`) | DB credentials committed if pushed |
| C3 | CORS allows all origins (`*`) | `server.js` L10 | Any website can call the API |
| C4 | No session TTL or expiry | `sessions` table + `authenticateToken` | Sessions live forever; no forced re-login |

### High (fix before testing stage)

| # | Issue | Location | Impact |
|---|---|---|---|
| H1 | No backend check that booking is still Pending before approve/reject | `server.js` L208–237 | Race condition; already-decided bookings can be overwritten |
| H2 | `requested_user` stored as VARCHAR, not FK to `users.id` | `db-init.js` L44, L55 | Referential integrity gap; user renames would orphan bookings |
| H3 | No cancel/delete action for bookings | All files | Staff cannot withdraw a submitted request |
| H4 | Fetch errors in `fetchBookings` are only `console.error`'d, not shown in UI | `App.jsx` L87–89 | Silent failures; user sees stale data with no notice |
| H5 | `index.html` title is "frontend" (Vite default) | `frontend/index.html` L7 | Bad browser tab and SEO title |

### Medium (improve before or during testing)

| # | Issue | Location | Impact |
|---|---|---|---|
| M1 | No past-date validation on `booking_date` | Backend + Frontend | Staff can create bookings in the past |
| M2 | No end_time > start_time validation | Backend + Frontend | Logically invalid time ranges pass |
| M3 | `equipment_name` not validated against a server-side list | `server.js` POST + PUT | Any string accepted; bypass of frontend dropdown |
| M4 | No debounce on equipment filter text input | `App.jsx` L381–383 | One API call per keystroke |
| M5 | No loading/spinner state during fetch operations | `App.jsx` | UI gives no feedback while waiting for the backend |
| M6 | Dead scaffold code in `App.css` | `frontend/src/App.css` | Unused CSS; maintainability noise |
| M7 | No root-level README with setup/run instructions | Project root | New developers cannot onboard without reading both sub-folder READMEs |
| M8 | `node_modules` committed to version control (both halves) | `p1/backend/node_modules`, `p1/frontend/node_modules` | Bloated repo; re-install produces canonical output |
| M9 | No `updated_at` timestamp on `bookings` | `db-init.js` | Cannot audit when a booking was last modified |

### Low / Cosmetic

| # | Issue | Location | Impact |
|---|---|---|---|
| L1 | `frontend/README.md` is unchanged Vite template text | `frontend/README.md` | Misleading documentation |
| L2 | `App.jsx` and `server.js` are monolithic single files | Both | Harder to test individual units; acceptable at this size |
| L3 | No `data-testid` attributes in JSX | `App.jsx` | Will require additions before automated UI testing |
| L4 | Approved/Rejected bookings can still be re-reviewed via the API (no backend guard) | `server.js` L208 | Minor logical gap; UI shows "Reviewed" but API is open |

---

## 10. Manual Checks Recommended Next

Before starting the testing and security hardening stages, the following manual checks should be performed:

1. **Run `npm run db:init`** in `backend/` and confirm it completes without error on a clean MySQL instance.
2. **Start backend** with `npm run dev` — confirm `Server is running on port 5000` appears.
3. **Start frontend** with `npm run dev` — confirm Vite serves on port 5173 and the login page renders.
4. **Login as Staff** (`john_doe` / `password123`) — confirm only john_doe's bookings appear.
5. **Login as Lab Assistant** (`alice` / `password123`) — confirm all bookings from all users appear.
6. **Create a new booking as Staff** — verify it appears in the list with Pending status.
7. **Edit the pending booking** — verify changes are saved.
8. **Try to call `PUT /api/bookings/:id/status` as a Staff session token** (e.g., via curl) — expect 403.
9. **Approve a booking as Lab Assistant** with a blank comment — expect the UI error message.
10. **Approve a booking with a comment** — verify status changes to Approved and comment appears.
11. **Test filters** (equipment text, date picker, status dropdown) — verify the list narrows for both roles.
12. **Logout** — verify the session row is deleted and the login page is shown.
13. **Attempt to use the old token after logout** (e.g., via curl) — expect 401.

---

## 11. Pass/Fail Table

| Check | Result | Notes |
|---|---|---|
| App appears runnable | ✅ PASS | Both halves have `npm run dev`; `node_modules` present; `db:init` script available |
| React and Express are separated | ✅ PASS | `frontend/` and `backend/` are distinct directories with independent `package.json` |
| React calls Express routes only (no direct MySQL) | ✅ PASS | All `fetch()` calls target `http://localhost:5000/api/*`; `mysql2` is absent from frontend `package.json` |
| Backend uses DB_HOST, DB_PORT, DB_USER, DB_PASSWORD, DB_NAME | ✅ PASS | `db.js` and `db-init.js` both read all five vars from `process.env` with fallbacks |
| DB secrets not exposed in React | ✅ PASS | No `.env` file in `frontend/`; no DB config in any frontend file |
| Needed database tables exist (users, sessions, bookings) | ✅ PASS | All three tables defined and created in `db-init.js` |
| Users/login table exists | ✅ PASS | `users` table with `username`, `password`, `role` |
| Repeatable database setup/seed command | ✅ PASS | `npm run db:init` (destructive drop-recreate-seed) |
| Login is database-backed | ✅ PASS | `POST /api/login` queries `users` table; token stored in `sessions` table |
| Role restrictions enforced in backend | ✅ PASS | `req.user.role` checked in every relevant route handler |
| Approve/reject bookings protected (Lab Assistant only) | ✅ PASS | `PUT /api/bookings/:id/status` returns 403 for non-Lab-Assistant sessions |
| Assistant comment required for approve/reject | ✅ PASS | Backend 400 on empty/whitespace comment; frontend UI also enforces |
| Users limited to own records (Staff) | ✅ PASS | Server-side `AND requested_user = req.user.username` in `GET /api/bookings` for Staff |
| Booking create/view/update/approve-reject workflow implemented | ✅ PASS | All four actions present and functional |
| Filter by equipment/date/status implemented | ✅ PASS | All three filters applied server-side in `GET /api/bookings` |
| Validation present | ✅ PASS (partial) | Required-field and role checks present; date/time logic and equipment-list validation missing |
| No early-stage implementations (test/security) | ✅ PASS | No test files; no Helmet/rate-limit/bcrypt — all deferred correctly |
| Passwords not hashed | ⚠️ FAIL | Plaintext comparison in `server.js` L56; acknowledged in comment but must be fixed in security stage |
| `.env` excluded from version control | ⚠️ FAIL | Backend has no `.gitignore`; `.env` would be committed |
| CORS restricted | ⚠️ FAIL | `app.use(cors())` — defaults to `*` |
| Session expiry implemented | ⚠️ FAIL | No TTL on `sessions` rows; sessions persist until logout |
