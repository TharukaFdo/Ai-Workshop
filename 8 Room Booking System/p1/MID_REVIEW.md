# MID_REVIEW.md — Room Booking System
**Case:** 8 — Room Booking System  
**Review Stage:** Mid-project (after secondary feature, before testing / security hardening / maintainability cleanup)  
**Review Date:** 2026-06-14  
**Reviewer:** Antigravity AI (automated code review)  
**Stack:** React (Vite) · Node.js/Express · MySQL (mysql2)

---

## 1. Mid-Review Summary

The Room Booking System has reached the end of the secondary-feature stage. A working React SPA (Vite, `client/`) and a separate Express API (`server/`) are present. The two tiers are correctly separated; the React app talks exclusively to Express over HTTP and never imports or connects to MySQL directly. Environment variables for all five required DB keys are present in `server/.env` and consumed only in `server/db.js`.

The core booking lifecycle — create, list, approve/reject — is functionally implemented. The coordinator-only status route enforces its role check against the database on every call. Staff ownership is enforced by the backend: the `GET /api/bookings` route re-derives the user's role and username from the DB and filters accordingly, so a staff member cannot see another user's bookings by crafting a different `userId`.

Key gaps at this stage are: passwords stored in plain text, no token-based session (user ID is passed in request bodies/query strings with no server-side session or JWT verification), no time-conflict detection before creating a booking, no staff-initiated update/cancel path, and no automated tests.

The project is runnable from source if MySQL is available and `npm run seed` has been executed in the `server/` directory.

---

## 2. Review Scoring Matrix

| Feature / Area | Functionality 0-5 | Data Persistence 0-5 | Backend Security / Role Control 0-5 | Validation / Error Handling 0-5 | Testing Evidence 0-5 | Maintainability 0-5 | UI / Manual Usability 0-5 | Evidence | Notes |
|---|---:|---:|---:|---:|---:|---:|---:|---|---|
| Project setup and run commands | 4 | 5 | — | — | 0 | 3 | — | `server/package.json` scripts: `start`, `dev`, `seed`; `client/package.json` scripts: `dev`, `build`. No root-level orchestration script. | `npm run seed` + `npm run dev` (both dirs) suffices but requires two terminals; no root `package.json`, no docker-compose, no README run guide. |
| Database setup and starter data | 5 | 5 | — | 3 | 0 | 4 | — | `server/init-db.js` creates DB, creates `users` and `bookings` tables via `CREATE TABLE IF NOT EXISTS`, truncates and re-seeds. Triggered via `npm run seed`. | Repeatable and idempotent. Plain-text seed passwords noted as demo-only. `DB_PASSWORD` is blank, which works only for no-auth MySQL installs. |
| Login workflow | 4 | 4 | 2 | 3 | 0 | 3 | 4 | `POST /api/login` queries `users` table; role returned from DB. Frontend shows credential hints in the UI. | Login is database-backed (good). Passwords stored and compared in plain text — no hashing. No session token/JWT issued; user ID is stored in React state only; the backend trusts whatever `userId` is sent in the request body/query. |
| Role-based access | 4 | — | 4 | 3 | 0 | 3 | 4 | `GET /api/bookings` and `PUT /api/bookings/:id/status` both re-query `users` table for the role. Staff are filtered to their own records at the DB layer. Coordinator sees all. | Role lookup uses the DB on every protected call (correct pattern). However, the backend trusts the `userId` supplied by the client with no signature verification — a manipulated `userId` could impersonate another user. No middleware abstraction; role checks are inline. |
| Main create action | 4 | 5 | 3 | 3 | 0 | 3 | 4 | `POST /api/bookings` — backend re-derives `staff_name` from DB using `userId`; `status` is hardcoded to `'pending'`. Required fields validated with 400 response. | Staff name is correctly assigned server-side (cannot be spoofed by the form). No end_time > start_time validation. No overlap/conflict check. Coordinators can also submit the create form in theory (backend has no role restriction on create). |
| Main view/list action | 4 | 5 | 4 | 3 | 0 | 3 | 4 | `GET /api/bookings?userId=...` — DB-backed role check; staff see only their own rows; coordinator sees all. Ordered by `booking_date DESC, start_time DESC`. | Client-side filter applied on top of the returned set. No server-side pagination. No loading/error state shown in UI beyond console.error. |
| Main update/status/cancel action | 1 | 1 | 1 | 1 | 0 | 1 | 1 | No `PUT /api/bookings/:id` (edit booking fields) route exists. No staff cancel route. Only the coordinator status-update route exists. | Staff have no way to edit or cancel their own pending bookings. This is a significant workflow gap for the main update action. |
| Protected action | 4 | 5 | 4 | 3 | 0 | 3 | 4 | `PUT /api/bookings/:id/status` — DB role check: returns 403 if role ≠ `'coordinator'`. Notes field updated atomically with status. UI approve/reject controls are conditionally rendered for coordinator only. | Backend enforcement present and DB-backed (correct). No audit log. Missing: coordinator cannot set status back to `pending` via UI (though the backend permits it). The client `userId` trust issue applies here too. |
| Secondary feature | 4 | — | — | 2 | 0 | 3 | 4 | Client-side filter by room name (partial match, case-insensitive), date (startsWith), and status (exact match). Clear button resets all filters. | Filtering is client-side only — all records are fetched and filtered in the browser. No server-side filter parameters. Works for demo scale but does not scale. Date filter uses `startsWith`, which works for ISO dates but is fragile. |
| Case-specific: room/date/time booking details and conflict awareness | 3 | 4 | — | 2 | 0 | 2 | 3 | Room name, date, start time, end time, and purpose are all collected and persisted. `bookings` table stores `booking_date DATE`, `start_time TIME`, `end_time TIME`. | No overlap detection: two bookings for the same room, same date, overlapping times will be accepted without any warning. No `end_time > start_time` validation. No past-date guard. |
| Case-specific: booking approval/rejection status with coordinator note | 4 | 5 | 4 | 3 | 0 | 3 | 4 | Status ENUM `('pending','approved','rejected')` in DB. `notes TEXT` field updated with status. Notes displayed to staff as a highlighted callout. | No separate history/audit. Notes are overwritten on each status update. Coordinator can re-approve or re-reject (useful but not restricted). |
| Case-specific: staff ownership and coordinator-only status changes | 4 | 5 | 4 | 3 | 0 | 3 | 3 | Staff name derived server-side from `userId`. Staff list shows only their own records. Status update route enforces coordinator role from DB. | No staff edit/cancel of own bookings. No validation that the booking being updated exists and belongs to expected domain before DB write. |
| UI / manual usability | 3 | — | — | 2 | 0 | 2 | 3 | Login form, booking form (staff), filter bar, booking cards with status badge and coordinator action panel are all present and functional. | `App.css` is the default Vite scaffold CSS — most UI styling is done via inline styles in `App.jsx`. `index.html` title is still `"client"`. Demo credentials shown in plain text on the login screen (acceptable for workshop, not for production). No loading spinners or user-facing error toasts. |
| Security posture | 1 | — | 1 | 1 | 0 | 1 | — | `.env` used for DB config server-side. CORS enabled globally without restriction. No password hashing. No session/JWT. `userId` trusted from client. | Wide-open CORS, plain-text passwords, no auth token — expected pre-hardening state but important gaps to document. |
| Testing evidence | 0 | 0 | 0 | 0 | 0 | 0 | — | No test files, test framework config, or test scripts found anywhere in the project. | No Vitest/Jest/Supertest setup. No `test` script in either `package.json`. No test hooks, fixtures, or mocks present. |
| Maintainability | 2 | — | — | — | 0 | 2 | — | All server logic is in one file (`index.js`, 146 lines). All React logic is in one file (`App.jsx`, 420 lines). No route split, no service layer, no custom hooks, no component decomposition. | ESLint config present (`eslint.config.js`). No comments beyond brief inline labels. No TypeScript. Will become difficult to extend as the feature set grows. |

---

## 3. Current Feature Status

| Feature | Implemented | Notes |
|---|---|---|
| Staff creates a room booking | ✅ Yes | All required fields collected; `status` set to `pending` server-side |
| Staff views their own bookings | ✅ Yes | Backend filters by `staff_name` derived from DB; not spoofable by client |
| Coordinator views all bookings | ✅ Yes | Role check in `GET /api/bookings`; all rows returned for coordinator |
| Coordinator approves a booking | ✅ Yes | `PUT /api/bookings/:id/status` with DB role gate |
| Coordinator rejects a booking | ✅ Yes | Same route; status validated against ENUM list |
| Coordinator adds/edits notes | ✅ Yes | Notes updated atomically with status in the same PUT call |
| Staff updates (edits) their booking | ❌ Missing | No edit route; no UI edit path for staff |
| Staff cancels their booking | ❌ Missing | No cancel route or action button for staff |
| Filter by room | ✅ Yes | Client-side partial match |
| Filter by date | ✅ Yes | Client-side `startsWith` match |
| Filter by status | ✅ Yes | Client-side exact match |
| Time conflict detection | ❌ Missing | No overlap query before insert |

---

## 4. Database and Persistence Status

**Database:** MySQL, database name `c8p1`  
**Connection config location:** `server/.env` and `server/db.js` only — correct, React never touches this  
**Env variables present:** `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME` — all five required variables are declared  
**DB_PASSWORD:** empty string — works only for passwordless MySQL root installs; will need to be set for any other environment  

### Tables

| Table | Present in init script | Purpose |
|---|---|---|
| `users` | ✅ `CREATE TABLE IF NOT EXISTS users` | Stores username, password (plain text), role ENUM |
| `bookings` | ✅ `CREATE TABLE IF NOT EXISTS bookings` | Stores all booking fields + status + notes |

**Foreign key between `bookings` and `users`:** ❌ Not defined — `staff_name` is stored as a VARCHAR copy of `username`, not a FK. If a username changes, historical bookings would be orphaned.  

**Setup command:** `npm run seed` (runs `node init-db.js`) — creates DB if not existing, creates tables, truncates, and re-seeds. Repeatable and idempotent.  

**Seed data:** 4 users (3 staff, 1 coordinator), 4 bookings across two dates with all three statuses represented.

---

## 5. Login and Role/Access Status

| Check | Result |
|---|---|
| Login is database-backed | ✅ Yes — `POST /api/login` queries `users` table |
| Login is mock-only or role-selector-only | ❌ No — it is genuinely DB-backed |
| Role comes from DB | ✅ Yes — returned in login response and re-verified on each protected API call |
| Passwords hashed | ❌ No — plain text in DB and compared with plain text query |
| Session token / JWT issued after login | ❌ No — user object stored in React state only; no server-side session |
| Backend verifies identity on each request | ⚠️ Partial — backend re-queries the `users` table using the `userId` sent by the client, but the `userId` itself is not signed or verified; it can be forged by the client |
| Role restrictions enforced backend-side | ✅ Yes — status update route rejects non-coordinators with 403 |
| Role restrictions enforced frontend-only (UI hiding only) | ⚠️ UI hides coordinator controls from staff, but backend enforcement also exists |

---

## 6. Protected Action Status

**Protected action:** Approve or reject room bookings and edit coordinator notes  
**Route:** `PUT /api/bookings/:id/status`

| Check | Result |
|---|---|
| Route rejects unauthenticated calls (no userId) | ✅ Yes — returns 401 |
| Route validates status value | ✅ Yes — checks against `['pending','approved','rejected']`, returns 400 if invalid |
| Route looks up user role from DB | ✅ Yes — `SELECT role FROM users WHERE id = ?` |
| Route returns 403 for staff | ✅ Yes — `if (userRole !== 'coordinator') return res.status(403)` |
| Route verifies booking exists before updating | ✅ Yes — checks `result.affectedRows === 0`, returns 404 |
| Coordinator note is persisted | ✅ Yes — notes stored in `bookings.notes` |
| UI restricts approve/reject controls to coordinator | ✅ Yes — `{user.role === 'coordinator' && ...}` |
| Audit trail / history | ❌ No |

The protected action is the most robustly implemented part of the backend. The only structural risk is the unsigned `userId` trust issue that applies across all routes.

---

## 7. Validation Status

| Validation Point | Location | Status |
|---|---|---|
| Login: username and password required | Backend | ✅ `if (!username \|\| !password)` → 400 |
| Create booking: all fields required | Backend | ✅ `if (!userId \|\| !room_name \|\| ...)` → 400 |
| Status update: userId required | Backend | ✅ → 401 |
| Status update: valid status value | Backend | ✅ ENUM check → 400 |
| Booking date in the future | Backend | ❌ Missing |
| End time after start time | Backend | ❌ Missing |
| Room-date-time overlap check | Backend | ❌ Missing |
| Room name max length | Backend | ❌ Missing (DB is VARCHAR(100)) |
| Purpose max length | Backend | ❌ Missing (DB is TEXT, no limit enforced) |
| HTML5 `required` on form fields | Frontend | ✅ Present on all booking form inputs |
| Login error displayed to user | Frontend | ✅ `loginError` state shown |
| Booking submission errors shown to user | Frontend | ❌ Only `console.error` — no user-facing error message |
| Status update errors shown to user | Frontend | ❌ Only `console.error` — no user-facing error message |

---

## 8. Stage Drift — Early Implementation

The following items were **not** expected at this stage but were found to be already present:

| Item | Status | Assessment |
|---|---|---|
| DB-backed login (expected: possibly mock) | ✅ Implemented | Positive drift — correctly implemented earlier than strictly necessary |
| Backend role re-verification on every API call | ✅ Implemented | Positive drift — good security pattern introduced early |
| Coordinator notes stored per booking | ✅ Implemented | On-scope for the main workflow, reasonable |
| Filter controls visible to both staff and coordinator | ✅ Present | Correct scope for the secondary feature |

No significant **negative** stage drift was found. The project has not implemented future-stage items such as JWT authentication, rate limiting, input sanitisation libraries, or automated tests. The implementation is appropriately scoped to the current stage.

---

## 9. Issues Found Before Stage 8

The issues below are observations for the record. No code was changed.

### Critical (must fix before testing stage)

1. **No auth token / session**: The backend trusts `userId` supplied in request bodies and query parameters with no signature. Any client can set `userId` to another user's ID and read their bookings or trigger actions as that user. A session token, JWT, or express-session must be introduced before the testing stage.

2. **Plain-text passwords**: Passwords are stored as plain text in the `users` table and compared directly in SQL. Password hashing (e.g. bcrypt) is required before security hardening.

3. **No time-conflict detection**: The `POST /api/bookings` route does not check for overlapping bookings for the same room. Two bookings for the same room at the same time can be created without any warning. An overlap query (`WHERE room_name = ? AND booking_date = ? AND start_time < ? AND end_time > ?`) is needed.

### High (significant workflow gaps)

4. **No staff edit or cancel route**: Staff cannot modify or retract their own pending bookings. The `PUT /api/bookings/:id/status` route exists for coordinators only. A separate `PUT /api/bookings/:id` (for staff editing their own booking) and/or a cancel action is missing.

5. **No end_time > start_time validation**: The backend accepts bookings where `end_time` is earlier than or equal to `start_time`.

6. **No past-date validation**: The backend accepts bookings for past dates.

### Medium

7. **CORS is wide open**: `app.use(cors())` with no origin restriction accepts requests from any domain. Should be restricted to the Vite dev origin (or proxied) before hardening.

8. **No user-facing error messages on booking actions**: Failures in `POST /api/bookings` and `PUT /api/bookings/:id/status` are silently swallowed in the frontend (`console.error` only). The user sees no feedback if the API call fails.

9. **`index.html` title is still `"client"`**: The default Vite scaffold title was not updated.

10. **`App.css` is the default Vite scaffold**: The file contains styles for Vite template components (`.hero`, `.ticks`, `#next-steps`, etc.) that are not used in the application. It adds dead weight and is confusing.

11. **No FK between `bookings.staff_name` and `users.username`**: The booking stores `staff_name` as a freeform VARCHAR. If a username is updated, historical bookings would not reflect the change. A `user_id` FK would be safer.

12. **No loading state in UI**: API calls have no loading indicator; the UI does not prevent double-submit on the booking form.

### Low

13. **`DB_PASSWORD` is blank**: Fine for local no-auth MySQL, but the `.env` should note that this must be changed for any shared or production environment.

14. **`nodemon` listed as a production dependency**: In `server/package.json`, `nodemon` is in `dependencies` rather than `devDependencies`.

15. **No root-level `package.json` or run guide**: Starting the project requires two separate terminal sessions with no documented order or helper script.

---

## 10. Manual Checks Recommended Next

Before proceeding to the testing and security hardening stage, the following manual checks are recommended:

1. **Run the seed script and confirm tables are created**: `cd server && npm run seed` — verify the `c8p1` database, `users` table, and `bookings` table exist with seed data.

2. **Start both servers and confirm baseline login works**: `cd server && npm run dev` and `cd client && npm run dev` — log in as `alice / password123` (staff) and verify only alice's bookings are visible.

3. **Confirm staff cannot see other staff bookings**: Log in as `bob` — verify bob sees only his own bookings and not alice's.

4. **Confirm coordinator sees all bookings**: Log in as `admin / admin123` — verify all 4 seed bookings are visible.

5. **Test approve/reject as coordinator**: Approve a pending booking, add a note, confirm the status badge changes and the note appears in the staff view.

6. **Attempt to approve a booking as staff via direct API call**: Send `PUT /api/bookings/1/status` with `userId` of a staff user and confirm a `403` is returned.

7. **Test the filter controls**: Filter by room name, date, and status — confirm results are narrowed correctly and the Clear button resets all filters.

8. **Attempt to create a conflicting booking**: Submit two bookings for the same room, date, and overlapping time — confirm the system currently accepts both (known gap to document for the next stage).

9. **Check browser console for unhandled errors during normal use**.

10. **Verify the `.env` is not committed to version control**: Check `.gitignore` in `server/` and confirm `.env` is listed.

---

## 11. Pass/Fail Table

| Check | Result | Notes |
|---|---|---|
| App appears runnable | ✅ Pass | Both client and server have `dev` scripts and installed `node_modules` |
| React and Express are separated into distinct directories | ✅ Pass | `client/` and `server/` are separate; no cross-import |
| React calls Express routes and never connects to MySQL directly | ✅ Pass | All `fetch()` calls target `http://localhost:5000/api/*`; no mysql2 import in client |
| Backend uses DB_HOST, DB_PORT, DB_USER, DB_PASSWORD, DB_NAME | ✅ Pass | All five env vars present in `server/.env` and read in `server/db.js` |
| Secrets not exposed in React | ✅ Pass | `.env` is in `server/` only; `vite.config.js` has no `VITE_DB_*` vars |
| `users` / login table exists | ✅ Pass | `users` table created in `init-db.js` with username, password, role |
| `bookings` table exists | ✅ Pass | `bookings` table created with all required fields |
| Repeatable DB setup or seed command | ✅ Pass | `npm run seed` is idempotent |
| Login is database-backed | ✅ Pass | `POST /api/login` queries `users` table; not mock or role-selector-only |
| Role restrictions enforced in the backend | ✅ Pass | Status update route enforces coordinator role via DB lookup |
| Approve/reject protected from staff in backend | ✅ Pass | Returns 403 for non-coordinator `userId` |
| Staff limited to their own records | ✅ Pass | `GET /api/bookings` applies DB-driven staff filter |
| Main workflow (create, view, approve/reject) implemented | ✅ Pass (with gaps) | Create and view work; staff edit/cancel missing |
| Secondary feature (filter by room, date, status) implemented | ✅ Pass | All three filter controls present and working (client-side) |
| Validation present | ⚠️ Partial | Required-field checks present; no time/overlap/date validation |
| AI implemented future stages early | ✅ No drift | No premature JWT, rate limiting, or test framework introduced |
| No automated tests exist | ✅ Confirmed | No test files or test framework found |
| Plain-text passwords | ❌ Fail | Pre-hardening known issue — must be fixed before Stage 8 |
| Auth tokens / session | ❌ Fail | Pre-hardening known issue — userId trusted from client without verification |
| Time-conflict detection | ❌ Fail | Missing — overlapping bookings accepted silently |
| Staff edit/cancel of own bookings | ❌ Fail | Route and UI not implemented |
