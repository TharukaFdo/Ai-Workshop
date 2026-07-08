# Mid-Project Review — Equipment Booking System

**Review date:** 2026-06-06  
**Stage reviewed:** After secondary-feature implementation (filter bookings), before testing, security hardening, and maintainability cleanup.  
**Reviewer:** Automated static code review (no execution).  
**Scope:** React + Express + MySQL (local). Roles: Staff Member, Lab Assistant.

---

## 1. Mid-Review Summary

The project is in a strong state for its current stage. A working React (Vite) frontend and a dedicated Express backend are correctly separated into `client/` and `server/` sub-directories. The React app communicates with Express through Vite's proxy (`/api → http://localhost:5000`), and never directly touches MySQL. The database schema is complete and well-normalised. Login is fully database-backed with a session-token pattern (no mock, no role-selector). Role enforcement exists in every relevant backend route. All primary CRUD actions and the secondary filter feature are present. A `test.js` integration script exists, which is ahead of the expected stage but not harmful.

Key gaps before testing/hardening: passwords are stored in plaintext, CORS is open (`*`), no `.gitignore` protects `.env`, logout does not invalidate the server-side session, there is no `cancel` action for staff's own pending bookings, and the `db:setup` script does not use `.env` for the database name correctly (it uses a hardcoded default `c2p1` while `.env.example` uses `lab_equipment_booking`).

---

## 2. Review Scoring Matrix

| Feature / Area | Functionality 0-5 | Data Persistence 0-5 | Backend Security / Role Control 0-5 | Validation / Error Handling 0-5 | Testing Evidence 0-5 | Maintainability 0-5 | UI / Manual Usability 0-5 | Evidence | Notes |
|---|---:|---:|---:|---:|---:|---:|---:|---|---|
| Project setup and run commands | 4 | 5 | 3 | 3 | 2 | 3 | 5 | `client/package.json` (`dev`), `server/package.json` (`dev`, `db:setup`), Vite proxy config | No root-level `package.json` or unified start script; two terminals required. README absent. `.env` mismatch (`c2p1` vs `lab_equipment_booking` in example). |
| Database setup and starter data | 5 | 5 | 3 | 4 | 2 | 4 | 4 | `schema.sql`, `db-setup.js`, `npm run db:setup` | `db-setup.js` reads `.env` for credentials but does a fresh `DROP TABLE` on every run (destructive). Passwords in seed data are plaintext — acceptable at this stage but flagged. |
| Login workflow | 4 | 5 | 2 | 4 | 4 | 3 | 5 | `POST /api/auth/login` (index.js L60-91), `App.jsx` L81-106 | DB-backed, session token issued and stored in `sessions` table. Logout clears `localStorage` only — token remains valid in DB indefinitely. Password stored/compared as plaintext. |
| Role-based access | 5 | 5 | 4 | 4 | 4 | 4 | 5 | `authenticate` middleware (index.js L26-57); role read from DB on every request | Role is re-read from DB per request — not trusted from client. Staff create blocked for Assistant (403). Approve/reject blocked for Staff (403). |
| Main create action | 5 | 5 | 4 | 4 | 4 | 4 | 5 | `POST /api/bookings` (index.js L133-169), `App.jsx` L117-153 | All required fields validated. Past-date guard. Start-time < end-time guard. `requestedUser` set server-side from session. |
| Main view/list action | 5 | 5 | 5 | 4 | 4 | 4 | 5 | `GET /api/bookings` (index.js L94-130), `App.jsx` L42-65 | Staff see only their own rows (`AND requestedUser = ?`). Assistant sees all. Ordered by `bookingDate DESC, createdAt DESC`. |
| Main update/status/cancel action | 2 | 2 | 3 | 2 | 2 | 2 | 2 | `PUT /api/bookings/:id/status` is Assistant-only | No cancel/withdraw action for Staff on their own Pending requests. No edit action for Staff. The only update route is the approve/reject route, which is correctly locked to Assistant. |
| Protected action | 5 | 5 | 5 | 4 | 4 | 4 | 5 | `PUT /api/bookings/:id/status` (index.js L172-207), modal in `App.jsx` L492-542 | Role checked in backend (403 for non-Assistant). Comment required for Rejection enforced in both UI and backend. |
| Secondary feature | 5 | 5 | 5 | 4 | 3 | 4 | 5 | `GET /api/bookings?equipmentName=&bookingDate=&status=` (index.js L96-122), filter bar `App.jsx` L282-327 | All three filters (equipment, date, status) implemented end-to-end. Filters are applied server-side using parameterised queries. |
| Case-specific: equipment booking date/time and purpose fields | 5 | 5 | 4 | 4 | 3 | 4 | 5 | `schema.sql` L30-43, `POST /api/bookings` L140-148, create form `App.jsx` L338-403 | All six booking fields present: `equipmentName`, `bookingDate`, `startTime`, `endTime`, `purpose`, `requestedUser`. Date and time inputs with `min` attribute. `purpose` textarea. |
| Case-specific: booking approval/rejection with assistant comment | 5 | 5 | 5 | 4 | 4 | 4 | 5 | `PUT /api/bookings/:id/status` (index.js L172-207), `App.jsx` modal L492-542 | `assistantComment` stored. Rejection requires non-empty comment (both backend and frontend). Approve does not require comment (acceptable). Comment displayed on booking card. |
| Case-specific: staff-only ownership of own booking requests | 5 | 5 | 5 | 4 | 3 | 4 | 4 | `GET /api/bookings` (index.js L103-106), `POST /api/bookings` L134-138 | `requestedUser` is always set from `req.user.username` (session-verified), never from client body. Staff list query filtered to own rows in backend. No cancel/edit for staff own requests — minor gap. |
| UI / manual usability | 4 | 3 | 3 | 4 | 1 | 3 | 5 | `index.css` (441 lines), `App.jsx` | Dark glassmorphism UI; role-adaptive layout (staff 1:2 grid, assistant full-width); status badges; loading spinner; auto-clearing success toast; demo credentials shown on login. No mobile breakpoint for assistant layout. |
| Security posture | 2 | 3 | 3 | 3 | 1 | 2 | 3 | `server/index.js` (CORS, auth), `server/.env` | CORS fully open (`*`). Passwords plaintext. Logout is client-only (token survives in DB). No `helmet`. No rate limiting. No `.gitignore` observed. `DB_NAME` mismatch between `.env` and `.env.example`. |
| Testing evidence | 4 | 4 | 4 | 4 | 4 | 3 | 2 | `server/test.js` (307 lines, 8 tests) | Integration test file present and runnable via `npm test`. Tests cover login, invalid login, past-date validation, create booking, role protection (Staff cannot approve), rejection comment validation, successful reject, and filter queries. No unit tests or test framework (uses Node `assert`). Not a formal test suite but demonstrates real test coverage. |
| Maintainability | 2 | 3 | 3 | 3 | 2 | 2 | 3 | All logic in single `index.js`; all UI in single `App.jsx` | No routing library. No repository layer. No JSDoc or README. Inline styles mixed with CSS classes throughout `App.jsx`. `EQUIPMENT_LIST` constant is hardcoded in frontend (not from DB). No error-boundary in React. `test.js` duplicates the auth middleware and all route logic from `index.js`. |

---

## 3. Current Feature Status

| Feature | Status | Location |
|---|---|---|
| User login (DB-backed, token session) | ✅ Complete | `POST /api/auth/login` |
| User logout (client-side only) | ⚠️ Partial | `App.jsx` handleLogout — token not invalidated in DB |
| Staff: create booking request | ✅ Complete | `POST /api/bookings` |
| Staff: view own booking requests | ✅ Complete | `GET /api/bookings` |
| Staff: cancel/edit own pending booking | ❌ Missing | No route or UI |
| Assistant: view all booking requests | ✅ Complete | `GET /api/bookings` |
| Assistant: approve booking with comment | ✅ Complete | `PUT /api/bookings/:id/status` |
| Assistant: reject booking with required comment | ✅ Complete | `PUT /api/bookings/:id/status` |
| Filter by equipment name | ✅ Complete | query param `equipmentName` |
| Filter by booking date | ✅ Complete | query param `bookingDate` |
| Filter by status | ✅ Complete | query param `status` |
| Clear filters | ✅ Complete | `handleClearFilters` in `App.jsx` |
| API health check | ✅ Present | `GET /api/health` |

---

## 4. Database and Persistence Status

**Tables present in `schema.sql`:**

| Table | Purpose | Notes |
|---|---|---|
| `users` | Authentication source of truth | id, username, password (plaintext), role ENUM('Staff','Assistant') |
| `sessions` | Server-side token store | token, username FK, createdAt |
| `bookings` | Main entity | All 9 required fields present |

**Seed data:**
- 2 Staff accounts (`alice_staff`, `bob_staff`)
- 1 Assistant account (`clara_assistant`)
- 3 sample bookings (Pending, Approved, Rejected) — covers all status states

**Setup command:** `npm run db:setup` in `server/` — runs `db-setup.js`, which reads `schema.sql` and executes it statement by statement.

**Issues:**
- `db-setup.js` drops and recreates tables on every run — no incremental migration.
- `.env` uses `DB_NAME=c2p1`; `.env.example` uses `DB_NAME=lab_equipment_booking` — inconsistent; a developer following the example would point to a non-existent database.
- `DB_PORT` is present in `db.js` and `.env` but absent from `.env.example`.
- No `schema_version` or migration tracking.
- Passwords stored as plaintext in both schema seed and login comparison.

---

## 5. Login and Role/Access Status

**Login type:** Database-backed with server-side session tokens.  
**Token mechanism:** `crypto.randomUUID()` stored in `sessions` table; verified on every authenticated request by re-querying the DB.  
**Role source on protected routes:** Role is read from the `users` table on every API call inside the `authenticate` middleware — role is never trusted from the client.

**Positive findings:**
- `req.user` is always populated from DB, not from a JWT claim or request body.
- Staff role restriction on `GET /api/bookings` is server-enforced (`AND requestedUser = ?`).
- Assistant restriction on approve/reject is server-enforced (HTTP 403 for non-Assistant).
- Staff restriction on create is server-enforced (HTTP 403 for non-Staff).

**Gaps:**
- Logout does not delete the session row from `sessions` — token remains usable.
- No password hashing (bcrypt absent).
- Session tokens never expire (no `expiresAt` column or TTL).
- No logout endpoint (`DELETE /api/auth/session` or equivalent) exists.

---

## 6. Protected Action Status

**Protected action:** Approve or reject a booking and add an assistant comment.

| Check | Result |
|---|---|
| Route exists | ✅ `PUT /api/bookings/:id/status` |
| Backend role check (Assistant only) | ✅ Returns 403 for non-Assistant |
| Comment required for Rejection | ✅ Backend returns 400 if comment empty/missing for Rejected status |
| Comment optional for Approval | ✅ Accepted but not mandated |
| Comment stored in DB | ✅ `assistantComment` column in `bookings` |
| Comment displayed in UI | ✅ `comment-box` element shown when `booking.assistantComment` is truthy |
| UI controls shown only to Assistant | ✅ `user.role === 'Assistant' && booking.status === 'Pending'` guard |
| Staff cannot self-approve | ✅ Backend 403; UI hides controls from Staff |
| Booking not found guard | ✅ Returns 404 if ID not in DB |

**Minor gap:** Backend does not prevent an Assistant from re-approving or re-rejecting an already-decided booking (no guard on current `status === 'Pending'` in the PUT route). The UI only shows controls for Pending bookings, but the backend would accept a status update on a non-Pending booking.

---

## 7. Validation Status

### Backend Validation (`server/index.js`)

| Rule | Location | Result |
|---|---|---|
| Required fields on create (all 5 booking fields) | L142-144 | ✅ 400 returned |
| Booking date not in the past | L146-149 | ✅ 400 returned |
| Start time must be before end time | L151-153 | ✅ 400 returned |
| Login: username + password required | L63-65 | ✅ 400 returned |
| Login: invalid credentials | L70-71 | ✅ 401 returned |
| Approve/Reject: valid status value | L181-183 | ✅ 400 for unknown status |
| Reject: comment required | L185-187 | ✅ 400 returned |
| Booking not found | L190-193 | ✅ 404 returned |
| Unauthenticated requests | L29-31 | ✅ 401 returned |
| Wrong role on create | L136-138 | ✅ 403 returned |
| Wrong role on approve/reject | L177-179 | ✅ 403 returned |

### Frontend Validation (`client/src/App.jsx`)

| Rule | Location | Result |
|---|---|---|
| All booking fields required (UI check) | L122-124 | ✅ |
| Date min attribute (today) | L359 | ✅ prevents past dates in date picker |
| Rejection comment required in modal | L164-168 | ✅ |
| HTML5 `required` on form inputs | various | ✅ |

**Gaps:**
- No maximum length validation on `purpose` or `assistantComment` fields (backend or frontend).
- No format validation for `bookingDate` (relies on HTML date input type).
- No check that `endTime` is not more than, say, 24 hours after `startTime` (only checks order).
- No check for duplicate bookings (same user, same equipment, overlapping time).

---

## 8. Stage Drift / Early Implementation

The following items appear to be **ahead of the expected stage** (implemented before the testing and security hardening stages):

| Item | Assessment |
|---|---|
| `server/test.js` — 8 integration tests with DB cleanup | Implemented during or after the secondary feature stage. Not harmful; tests are runnable. Counts as early implementation of the testing stage. |
| `GET /api/health` health check endpoint | Useful but not a case requirement — minor forward-reach. |
| Sessions table with server-side token invalidation framework | Architecture is correct; logout invalidation is simply not wired up yet. |
| `db:setup` npm script | Clean and appropriate for this stage. |

No premature implementation of future change-request features (e.g., notifications, booking history, or admin panel) was detected.

---

## 9. Issues Found Before Stage 8

### Critical (must fix before final review)

| # | Issue | Location |
|---|---|---|
| C1 | Passwords stored and compared as plaintext | `schema.sql` L46-49, `index.js` L70 |
| C2 | Logout does not invalidate server-side session token | `App.jsx` L109-114 — no `DELETE` request to `/api/auth/logout` |
| C3 | No server-side session expiry | `sessions` table has no `expiresAt`; `authenticate` never checks TTL |
| C4 | CORS open to all origins (`cors()` with no options) | `index.js` L12 |

### Important (affects correctness or scope)

| # | Issue | Location |
|---|---|---|
| I1 | Staff cannot cancel or withdraw their own Pending booking | No `DELETE /api/bookings/:id` or cancel route; not in UI |
| I2 | Backend allows re-approving/re-rejecting already-decided bookings | `PUT /api/bookings/:id/status` — no `status === 'Pending'` guard |
| I3 | `.env` and `.env.example` use different `DB_NAME` values | `.env` = `c2p1`; `.env.example` = `lab_equipment_booking` |
| I4 | `DB_PORT` absent from `.env.example` | Developer following example cannot set custom port |
| I5 | Equipment list hardcoded in frontend | `EQUIPMENT_LIST` in `App.jsx` L3; adding a new item requires a code change |

### Minor (quality / maintainability)

| # | Issue | Location |
|---|---|---|
| M1 | No `.gitignore` — `.env` with credentials may be committed | Not found in file listing |
| M2 | No project-level `README.md` with setup steps | Root has only `Case_Brief.md` |
| M3 | `test.js` duplicates entire route and middleware logic from `index.js` | `server/test.js` — divergence risk |
| M4 | No `helmet` or security headers | `server/index.js` |
| M5 | Inline styles scattered throughout JSX | `App.jsx` — mixed with CSS classes |
| M6 | All UI in a single 548-line `App.jsx` | No component separation |
| M7 | No `max-length` on text fields | `purpose`, `assistantComment` in schema and UI |
| M8 | `db-setup.js` is destructive on every run (drops tables) | `schema.sql` L6-8 |
| M9 | No error boundary in React | `main.jsx` / `App.jsx` |
| M10 | Assistant layout has no responsive breakpoint | `.dashboard-grid.assistant-layout` has no `@media` rule |

---

## 10. Manual Checks Recommended Next

1. **Run the app end-to-end** — start both `server/` and `client/` (`npm run dev` in each), run `npm run db:setup` first.
2. **Login as `alice_staff`** — verify only Alice's own bookings are visible; verify create form works; confirm no Approve/Reject buttons appear.
3. **Login as `clara_assistant`** — verify all bookings from all users appear; verify Approve and Reject buttons appear only on Pending bookings; approve one with a comment and reject one with a comment.
4. **Attempt approval as Staff** — call `PUT /api/bookings/:id/status` with a Staff token directly (e.g., via curl or browser DevTools) — confirm 403 response.
5. **Attempt to view another staff member's bookings as Staff** — call `GET /api/bookings` with `bob_staff` token — confirm only Bob's bookings are returned.
6. **Test filters** — apply each of the three filter controls (equipment, date, status) and confirm list updates correctly.
7. **Test past-date rejection** — try to submit a booking with yesterday's date — confirm error message appears.
8. **Test reject without comment** — confirm backend and frontend both block submission.
9. **Test logout persistence** — copy the session token before logout, log out, then send an authenticated request with the copied token — confirm the server still accepts it (documents Issue C2).
10. **Run `npm test` in `server/`** — confirm all 8 integration tests pass.

---

## 11. Pass/Fail Table

| Check | Result | Notes |
|---|---|---|
| App appears runnable | ✅ Pass | Both `npm run dev` commands present; `node_modules` installed; `.env` present |
| React and Express are separated | ✅ Pass | `client/` and `server/` are fully independent |
| React calls Express routes only (no direct MySQL) | ✅ Pass | All fetch calls go to `/api/*` proxied to Express |
| Backend uses `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME` | ✅ Pass | `db.js` reads all five variables from `process.env` |
| Secrets not exposed in React | ✅ Pass | No DB credentials in `client/` |
| Required database tables exist | ✅ Pass | `users`, `sessions`, `bookings` in `schema.sql` |
| Users/login table exists | ✅ Pass | `users` table with `username`, `password`, `role` |
| Repeatable database setup/seed command | ✅ Pass | `npm run db:setup` in `server/` |
| Login is database-backed | ✅ Pass | Not mock, not role-selector — full DB lookup with session token |
| Role restrictions enforced in backend | ✅ Pass | Role re-read from DB on every request in `authenticate` middleware |
| Approve/reject appears protected (backend) | ✅ Pass | 403 for non-Assistant at route level |
| Users limited to their own records | ✅ Pass | Staff list query scoped to `requestedUser = username` server-side |
| Create/view/update/approve-reject workflow implemented | ⚠️ Partial | Create ✅, View ✅, Approve/Reject ✅, but **Update/Cancel by Staff is missing** |
| Filter by equipment/date/status implemented | ✅ Pass | All three filters work end-to-end |
| Validation present | ✅ Pass | Backend and frontend validation both present |
| No premature future-stage features | ✅ Pass | `test.js` is early but within scope; no out-of-scope features detected |
| Passwords hashed | ❌ Fail | Plaintext passwords — must be addressed in security hardening stage |
| Session logout invalidates token | ❌ Fail | Server-side token not deleted on logout |
| CORS restricted | ❌ Fail | Open `*` — must be addressed in security hardening stage |
| `.gitignore` protects `.env` | ❌ Fail | No `.gitignore` found |
| README / setup documentation | ❌ Fail | No README |
