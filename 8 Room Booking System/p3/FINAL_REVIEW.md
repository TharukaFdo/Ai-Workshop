# Final Review — Room Booking System

**Review Date:** 2026-06-14  
**Review Stage:** After testing, security hardening, maintainability cleanup, and the Stage 11 change request.  
**Reviewer:** Antigravity AI Code Review  
**Project Path:** `p3/`  
**Stack:** React 18 (Vite 5) + Express 4 + MySQL (`mysql2`)  
**Mid-Review Reference:** `MID_REVIEW.md` (same directory)

---

## 1. Final Feature Summary

The Room Booking System is a fully functional two-role web application that digitalises the shared room booking workflow. Staff members log in with a real database-backed account, submit booking requests specifying room, date, start/end time, and purpose, and then view and manage their own bookings. Coordinators log in to see all requests from every staff member, filter by room/date/status, and approve or reject each request with an optional explanatory note.

**All primary functional requirements from the Case Brief and REQUIREMENTS.md are satisfied:**

| Requirement | Delivered |
|---|---|
| Staff submits room booking (room, date, start, end, purpose) | ✅ |
| Staff views own bookings and status | ✅ |
| Staff edits own pending bookings | ✅ |
| Staff cancels own pending/approved bookings | ✅ |
| Coordinator views all requests | ✅ |
| Coordinator approves/rejects with note | ✅ |
| Filter by room, date, status (both roles) | ✅ |
| Staff cannot approve or see other users' bookings | ✅ (backend enforced) |
| Double-booking conflict blocked on approval | ✅ (with known boundary note) |
| Database-backed login with role | ✅ (exceeds prototype scope) |
| Automated backend tests | ✅ (added after mid-review) |

---

## 2. Review Scoring Matrix

| Feature / Area | Functionality 0-5 | Data Persistence 0-5 | Backend Security / Role Control 0-5 | Validation / Error Handling 0-5 | Testing Evidence 0-5 | Maintainability 0-5 | UI / Manual Usability 0-5 | Evidence | Notes |
|---|---:|---:|---:|---:|---:|---:|---:|---|---|
| Project setup and run commands | 5 | 5 | — | — | 4 | 4 | — | Root `package.json` scripts: `install-all`, `dev`, `db:setup`, `test`; README documents both Option A (monorepo) and Option B (manual) startup; `backend/.env` present | `frontend/.env` not committed; README instructs manual creation. `JWT_SECRET` not listed in `.env.example`. No `--seed-only` flag. |
| Database setup and starter data | 5 | 5 | — | — | 4 | 4 | — | `config/setupDb.js` drops and recreates `app_users` and `room_bookings`, seeds 3 users + 3 bookings; `npm run db:setup` works from root; automated test verifies DB connection | SHA-256 (no salt) used for passwords instead of bcrypt. Seed password printed to console. No migration versioning. |
| Login workflow | 5 | 5 | 4 | 4 | 4 | 4 | 5 | `POST /api/auth/login` checks `app_users.password_hash`; HMAC token with 2 h expiry issued; `localStorage` stores token; auth middleware verifies on every request; wrong-password test passes 401 | SHA-256 unsalted (acceptable for workshop scope). Hardcoded `JWT_SECRET` fallback remains. Token in `localStorage` (XSS risk noted). No auto-logout on 401 in frontend. |
| Role-based access | 5 | 4 | 5 | 4 | 4 | 4 | 4 | Auth middleware re-reads role from DB on every request; staff/coordinator paths split in `bookingRoutes.js`; cross-user edit blocked by ownership check; automated test verifies 403 for cross-user edit | `/api/users` route is unprotected and returns all users including `password_hash` — this was flagged at mid-review (H2) and **remains unresolved** in the current codebase. |
| Main create action | 5 | 5 | 4 | 4 | 4 | 4 | 4 | `POST /api/bookings` validates all required fields and end>start; blocks staff booking on behalf of other users; `dbService.createBooking` inserts with status `pending`; test creates booking and asserts `pending` status | No future-date guard. No max-duration limit. |
| Main view/list action | 5 | 5 | 5 | 4 | 4 | 4 | 4 | `GET /api/bookings` returns coordinator all rows, staff own rows only — enforced server-side; camelCase mapping via `mapBookingRow`; filter params applied in parameterised SQL | Raw HTTP status text used in fetch error message rather than user-friendly wording. |
| Main update/status/cancel action | 4 | 4 | 4 | 4 | 4 | 3 | 4 | `PUT /api/bookings/:id` guards pending-only + ownership; `PUT /api/bookings/:id/cancel` allows cancel of pending and approved; both tested in automated suite | REQUIREMENTS §4 allows `approved → rejected` by coordinator; the cancel route only sets `cancelled`, not `rejected`. Re-approving an already-approved booking is not blocked. |
| Protected action | 5 | 5 | 5 | 4 | 5 | 4 | 5 | `PUT /api/bookings/:id/status` requires auth token + `coordinator` role; conflict check via `dbService.checkConflict` before `approved`; note saved; automated test blocks staff with 403; 409 returned on overlap | Conflict SQL `start_time < endTime AND end_time > startTime` — boundary-touching bookings (A ends 10:00, B starts 10:00) are not treated as conflicts. Documented as known limitation. |
| Secondary feature | 5 | 5 | 5 | 4 | 4 | 4 | 4 | Filters `roomName`, `bookingDate`, `status` as query params; `getAllBookings` and `getBookingsByRequester` apply parameterised SQL filters; automated test checks `roomName` filter; `Clear Filters` button in UI | Date filter is exact-match only (no range). Room LIKE filter may return wider results than expected for short names. |
| Case-specific: room/date/time booking details and conflict awareness | 4 | 5 | 4 | 4 | 5 | 4 | 4 | Room, date, start_time, end_time stored as separate DB columns (VARCHAR/DATE/TIME); `checkConflict` runs on approve with room+date+time overlap check; automated 409 conflict test passes | Boundary-touch edge case not flagged (documented). No front-end conflict preview. No past-date validation. |
| Case-specific: booking approval/rejection status with coordinator note | 5 | 5 | 5 | 4 | 5 | 4 | 5 | Status ENUM (`pending`, `approved`, `rejected`, `cancelled`); `coordinator_note TEXT` column; review modal captures note; note displayed on booking card; automated approval test verifies status transitions to `approved` | Coordinator note is optional on approve/reject — no requirement mandates it being required, but UX note: leaving it blank on rejection gives staff no feedback. |
| Case-specific: staff ownership and coordinator-only status changes | 5 | 5 | 5 | 4 | 5 | 4 | 4 | Staff edit/cancel blocked for non-owners by `booking.requesterId !== userId` on backend; approve/reject restricted to coordinator by `role !== 'coordinator'` check; automated tests verify both 403 cases | UI hides edit/cancel for non-pending, but coordinator "Review" button shown on all statuses including already-approved. Coordinator can trivially re-approve. |
| UI / manual usability | 4 | — | — | 3 | 2 | 3 | 4 | Dark theme (Outfit font); responsive CSS grid; status badge colours; coordinator note box with accent border; booking cards with hover lift; modal for review; notification with auto-dismiss | JSX inline style bug on App.jsx line 318 (`color: var(--text-secondary)` missing quotes) was flagged at mid-review — **remains present** in source. No loading state during status update/cancel. No auto-logout on 401. App.jsx remains a single 641-line file (no component decomposition). |
| Security posture | 4 | — | 4 | — | 3 | 3 | — | HMAC token with 2 h expiry; role re-read from DB on every request; parameterised queries throughout; SQL errors masked by error handler | `/api/users` still unprotected + exposes `password_hash` (H2 unresolved). SHA-256 unsalted password. Hardcoded JWT_SECRET fallback. CORS fully open. Stack traces returned in non-production. |
| Testing evidence | 4 | 4 | 4 | 4 | 5 | 4 | — | `backend/tests/api.test.js` (245 lines); `npm test` from root runs it; covers DB connection, staff login, coordinator login, wrong-password block, create booking, time validation, staff-blocks-approve (403), cross-user-edit (403), coordinator approval, conflict prevention (409), filter; `[TEST-ROOM]` prefix cleanup before+after | No test framework (no Jest/Mocha); uses Node `assert` + raw `fetch`. No frontend tests. `docs/TEST_PLAN.md` documents scenarios. Some mid-review scenarios (C2 view list, D3 reject) are documented in TEST_PLAN but not in the automated script. |
| Maintainability | 3 | — | — | — | 3 | 3 | — | Clean `backend/` folder structure; service layer (`dbService.js`) separates DB queries from route logic; `mapBookingRow` centralises field mapping; `.env.example` provided for backend | All frontend logic in a single 641-line `App.jsx` — no component decomposition. Duplicate `hashPassword` in `setupDb.js` and `authRoutes.js`. No API version prefix. No JSDoc. `JWT_SECRET` not in `.env.example`. |

---

## 3. Project Structure and Run Commands

```
p3/  (monorepo root)
├── package.json            # Root orchestrator (install-all, dev, db:setup, test)
├── README.md               # Setup guide
├── REQUIREMENTS.md         # Functional requirements and validation rules
├── PROJECT_CONTEXT.md      # Roles, entities, workflow, assumptions
├── Case_Brief.md           # Original one-paragraph case description
├── MID_REVIEW.md           # Mid-project review (this file's predecessor)
├── FINAL_REVIEW.md         # This file
├── docs/
│   └── TEST_PLAN.md        # Automated + manual test scenarios
├── backend/
│   ├── package.json        # Express scripts: start, dev, db:setup, test
│   ├── .env                # ✅ Present — DB + port config (see §5)
│   ├── .env.example        # Template for .env
│   ├── server.js           # Express entry point; mounts routes + error handler
│   ├── config/
│   │   ├── db.js           # mysql2 connection pool (reads .env)
│   │   └── setupDb.js      # Drop→Create→Seed script
│   ├── middleware/
│   │   ├── authMiddleware.js   # HMAC token verify; DB role lookup; signToken helper
│   │   └── errorHandler.js    # Centralised error response; masks DB errors
│   ├── routes/
│   │   ├── authRoutes.js   # POST /api/auth/login
│   │   ├── bookingRoutes.js  # CRUD + status + cancel for /api/bookings
│   │   └── userRoutes.js   # GET /api/users (UNPROTECTED — see §12)
│   ├── services/
│   │   └── dbService.js    # All SQL queries; mapBookingRow helper
│   └── tests/
│       └── api.test.js     # End-to-end API verification suite (245 lines)
└── frontend/
    ├── package.json        # Vite + React 18
    ├── .env.example        # VITE_API_URL template
    ├── vite.config.js      # Vite on port 3000
    ├── index.html          # Vite shell
    └── src/
        ├── main.jsx        # React root mount
        ├── App.jsx         # Entire frontend (641 lines, single component)
        └── index.css       # Dark theme design system (494 lines)
```

### Run Commands

```bash
# --- One-time setup (from root) ---
npm run install-all        # Install root + backend + frontend dependencies
npm run db:setup           # Create DB c8p3, tables, and seed data

# --- Development (from root) ---
npm run dev                # Starts backend (port 5000) + frontend (port 3000) concurrently

# --- Testing (from root) ---
npm test                   # Runs backend/tests/api.test.js

# --- Individual services ---
npm run dev:backend        # Express only on port 5000
npm run dev:frontend       # Vite only on port 3000

# --- Backend only (from backend/) ---
cd backend && npm run dev  # nodemon server.js
```

---

## 4. Frontend / Backend Separation Check

| Check | Result |
|---|---|
| Separate directories with independent `package.json` | ✅ `backend/` and `frontend/` are fully independent Node projects |
| Frontend uses only `fetch()` to Express API — no direct MySQL | ✅ `App.jsx` makes all API calls via `fetch()` to `apiUrl` (`http://localhost:5000/api`) |
| Backend has exclusive MySQL access | ✅ Only `backend/config/db.js` and `backend/services/dbService.js` import `mysql2` |
| DB credentials not in frontend | ✅ Frontend `.env.example` only contains `VITE_API_URL` |
| CORS enabled for cross-origin calls | ✅ `app.use(cors())` in `server.js` (open, see §12) |
| Frontend env var exposed to browser | `VITE_API_URL` only — the API base URL, which is safe |

**Verdict:** React and Express are cleanly separated. React calls Express routes and never connects to MySQL directly. ✅

---

## 5. Database Setup and Table Summary

### Connection Method

`backend/config/db.js` creates a `mysql2/promise` connection **pool** using environment variables:

| Variable | Configured In | Default Fallback |
|---|---|---|
| `DB_HOST` | `backend/.env` ✅ | `localhost` |
| `DB_PORT` | `backend/.env` ✅ | `3306` |
| `DB_USER` | `backend/.env` ✅ | `root` |
| `DB_PASSWORD` | `backend/.env` ✅ | *(empty string — password not printed here)* |
| `DB_NAME` | `backend/.env` ✅ | `c8p3` |

All five required variables are present and configured. The actual password value is in `backend/.env` only and is not reproduced in this document.

### Tables

| Table | Columns | Purpose |
|---|---|---|
| `app_users` | `id`, `username`, `password_hash`, `role ENUM('staff','coordinator')`, `created_at` | Users and login table ✅ |
| `room_bookings` | `id`, `room_name`, `booking_date`, `start_time`, `end_time`, `purpose`, `requester_id` (FK → `app_users`), `status ENUM('pending','approved','rejected','cancelled')`, `coordinator_note`, `created_at`, `updated_at` | Main booking entity |

A **users/login table exists**: `app_users` stores `username`, `password_hash`, and `role`.

### Re-Creating Tables and Seed Data

```bash
npm run db:setup        # from project root
# OR
cd backend && npm run db:setup
```

This runs `node config/setupDb.js` which:
1. Connects to MySQL using the `.env` credentials.
2. Creates the database `c8p3` if it does not exist.
3. `SET FOREIGN_KEY_CHECKS = 0` → drops `room_bookings` then `app_users` → `SET FOREIGN_KEY_CHECKS = 1`.
4. Creates `app_users` and `room_bookings` fresh.
5. Inserts 3 seed users: `alice_staff`, `bob_staff` (both `staff` role), `charlie_coord` (`coordinator` role) — all with password `password123`.
6. Inserts 3 seed bookings: one `approved`, one `pending`, one `rejected` (with coordinator note).

⚠️ The setup script is **destructive** — it drops all data each time it runs. There is no `--seed-only` option.

---

## 6. Login and Role / Access Explanation

### How the Two Roles Log In

Both roles use the same login screen at the React SPA entry point:

1. User enters `username` and `password` on the login form.
2. React `POST /api/auth/login` with `{ username, password }`.
3. Express looks up the user by `username` in `app_users`, hashes the submitted password with SHA-256, and compares with `password_hash`.
4. On match, Express calls `signToken(user.id)` which produces a custom token: `userId:expiresAt:hmacSignature` (2-hour expiry, signed with `JWT_SECRET` via HMAC-SHA256).
5. Response: `{ success: true, token, user: { id, username, role } }`.
6. Frontend stores `token` and `user` in `localStorage`.

**Seed credentials (all passwords are `password123`):**

| Username | Role |
|---|---|
| `alice_staff` | staff |
| `bob_staff` | staff |
| `charlie_coord` | coordinator |

### How Roles Are Checked

Every request to `/api/bookings/*` passes through `authMiddleware`:

1. Reads `Authorization: Bearer <token>` header.
2. Splits token into `userId:expiresAt:signature`.
3. Checks `Date.now() > expiresAt` — returns 401 if expired.
4. Re-computes HMAC and compares to signature — returns 401 if mismatch.
5. Queries `app_users WHERE id = userId` — **role is always read fresh from the database; the client-supplied role is never trusted**.
6. Attaches `{ id, username, role }` to `req.user`.

Route-level role enforcement in `bookingRoutes.js`:

| Endpoint | Check |
|---|---|
| `GET /api/bookings` | `role === 'coordinator'` → all bookings; else → own bookings only |
| `POST /api/bookings` | `role !== 'coordinator' && requesterId !== userId` → 403 |
| `PUT /api/bookings/:id` (edit details) | `role !== 'coordinator' && booking.requesterId !== userId` → 403 |
| `PUT /api/bookings/:id/status` | `role !== 'coordinator'` → 403 |
| `PUT /api/bookings/:id/cancel` | `role !== 'coordinator' && booking.requesterId !== userId` → 403 |

**Users can access only their own allowed records:** Staff who call `GET /api/bookings` receive only rows where `requester_id = req.user.id` (enforced in `dbService.getBookingsByRequester`). All write operations additionally verify `booking.requesterId === userId` for the `staff` role.

---

## 7. Protected Action Explanation

**Protected action:** Approve or reject a room booking request and save a coordinator note.

**Endpoint:** `PUT /api/bookings/:id/status`

**How it is protected (layer by layer):**

1. **Auth layer** — `router.use(authMiddleware)` is applied to all booking routes. No valid token → 401 before the handler runs.
2. **Role layer** — Handler immediately checks `if (role !== 'coordinator') return res.status(403)`. A `staff` token cannot proceed. Confirmed by automated test: staff token → 403.
3. **Input validation** — `status` must be `'approved'` or `'rejected'`; anything else → 400.
4. **Existence check** — `dbService.getBookingById(bookingId)` → if not found → 404.
5. **Conflict check (approval path)** — If `status === 'approved'`, `dbService.checkConflict(roomName, bookingDate, startTime, endTime, excludeBookingId)` queries `room_bookings` for any other `approved` booking in the same room on the same date where `start_time < endTime AND end_time > startTime`. If a conflict exists → 409. Confirmed by automated test.
6. **Persist** — `dbService.updateBookingStatus(id, status, coordinatorNote)` updates both `status` and `coordinator_note`.
7. **Response** — Full updated booking object returned.

---

## 8. Validation Summary

| Rule | Frontend | Backend | Notes |
|---|---|---|---|
| All fields required (roomName, bookingDate, startTime, endTime, purpose) | ✅ | ✅ | Frontend: `if (!roomName ‖ ...)` + `required` HTML attr; Backend: `validateBookingInput` middleware |
| `endTime > startTime` | ✅ | ✅ | Frontend shows notification; Backend returns 400 |
| `requesterId` required on create | ✅ (sends `activeUser.id`) | ✅ | Backend returns 400 if missing |
| Staff `requesterId` must match own `userId` | — | ✅ | Returns 403 |
| Booking must exist | — | ✅ | Returns 404 |
| Edit only allowed when `status === 'pending'` | ✅ (button hidden) | ✅ | Returns 400 if not pending |
| Cancel only allowed for `pending` or `approved` | — | ✅ | Returns 400 otherwise |
| Status value for approve/reject must be `approved` or `rejected` | — | ✅ | Returns 400 for invalid value |
| Conflict check on approval | — | ✅ | Returns 409 if overlap detected |
| Database-level status ENUM | — | ✅ | `ENUM('pending','approved','rejected','cancelled')` enforced by MySQL |
| Raw DB errors masked from client | — | ✅ | `errorHandler.js` intercepts SQL errors and returns a generic message |

**Known Missing Validations (not added after mid-review):**
- No past-date guard — `bookingDate` can be yesterday.
- No maximum booking duration.
- Re-approving an already-`approved` booking is not blocked.
- Purpose field has no max-length check at application level.

---

## 9. Automated and Manual Testing Summary

### Automated Tests

**Command:** `npm test` (from project root) or `cd backend && npm test`  
**File:** `backend/tests/api.test.js` (245 lines)  
**Framework:** Node.js built-in `assert` + native `fetch` — no Jest or Mocha dependency.  
**Test server:** Spins up an Express instance on port 5001 (separate from dev port 5000).

**What the tests check:**

| # | Scenario | Expected | Assertion |
|---|---|---|---|
| 0 | Database connection | Pool responds | `SELECT 1` matches `{ '1': 1 }` |
| 1a | Staff login (correct creds) | 200 + token + `role: 'staff'` | `assert.strictEqual(res.status, 200)` |
| 1b | Coordinator login (correct creds) | 200 + token | Status 200 |
| 1c | Wrong password | 401 | `assert.strictEqual(res.status, 401)` |
| 2a | Create booking as staff | 201 + `status: 'pending'` | Status + `booking.status` |
| 2b | Invalid time (endTime ≤ startTime) | 400 | `assert.strictEqual(res.status, 400)` |
| 3a | Staff tries to approve (protected) | 403 | `assert.strictEqual(res.status, 403)` |
| 3b | Bob edits Alice's booking (cross-user) | 403 | `assert.strictEqual(res.status, 403)` |
| 4 | Coordinator approves booking | 200 + `status: 'approved'` | Status + `booking.status` |
| 5 | Coordinator approves overlapping booking | 409 | `assert.strictEqual(res.status, 409)` |
| 6 | Filter by roomName | 200 + all match filter | `.every(b => b.roomName.includes('[TEST-ROOM]'))` |

**Test data cleanup:** Test records use prefix `[TEST-ROOM]` in `room_name`. `cleanupDatabase()` runs `DELETE FROM room_bookings WHERE room_name LIKE '[TEST-ROOM]%'` both before and after all tests.

**Result (based on code inspection):** All assertions are correctly written and the logic aligns with the backend implementation. The test suite should pass on a correctly configured MySQL instance with seed data present.

### What Was Not Automated

The following scenarios are in `docs/TEST_PLAN.md` but are **manual-only**, not in the automated script:

- **C2** — Staff views own booking list (manual: check UI shows only own rows).
- **C3** — Staff updates own pending booking details (no PUT details test in script).
- **D3** — Coordinator rejects a booking with a note (no reject test in script; only approve is automated).
- **Token expiry** — No test that a deliberately expired or corrupted token returns 401.
- **Filter by date / filter by status** — Only `roomName` filter is tested; `bookingDate` and `status` filters are manual.
- **All UI behaviour** — Role-conditional rendering, notification auto-dismiss, form reset, modal open/close.
- **`/api/users` unprotected exposure** — Flagged in mid-review but not included in any automated assertion.

---

## 10. Stage 11 Change Summary

The mid-review was conducted at Stage 8 (after secondary feature, before testing). The following changes are observable between the mid-review code state and the current files:

| Change | Evidence |
|---|---|
| **Automated test suite added** (`backend/tests/api.test.js`) | File did not exist at mid-review (0 test files); now 245 lines covering 11 scenarios |
| **`npm test` script added** to root `package.json` | Root `package.json` now includes `"test": "npm test --prefix backend"` |
| **`npm test` script added** to `backend/package.json` | `"test": "node tests/api.test.js"` |
| **`docs/TEST_PLAN.md` created** | Documents automated scenarios and cleanup strategy |
| **`[TEST-ROOM]` prefix cleanup strategy** | `cleanupDatabase()` in test file deletes test records before and after |

**What was NOT changed after Stage 11 (open issues from mid-review that remain):**

| Mid-Review Issue | Status |
|---|---|
| H1 — JSX inline style bug (App.jsx line 318: `color: var(--text-secondary)` missing quotes) | ⚠️ **Unresolved** — still present in source |
| H2 — `/api/users` unprotected, exposes `password_hash` | ⚠️ **Unresolved** — `userRoutes.js` has no `authMiddleware` |
| M1 — SHA-256 unsalted password hash, duplicate `hashPassword` | ⚠️ **Unresolved** |
| M2 — Hardcoded `JWT_SECRET` fallback | ⚠️ **Unresolved** |
| M3 — Boundary-touching booking conflict not detected | ⚠️ **Unresolved** (documented as known limitation) |
| M4 — Stack traces returned in non-production | ⚠️ **Unresolved** |
| M5 — Re-approve of already-approved booking not blocked | ⚠️ **Unresolved** |
| M6 — CORS fully open | ⚠️ **Unresolved** |
| L1 — `App.jsx` 641 lines, no component decomposition | ⚠️ **Unresolved** |
| L3 — `JWT_SECRET` missing from `.env.example` | ⚠️ **Unresolved** |

---

## 11. Stage Drift / Early Work

Items implemented earlier than their nominal stage required:

| Item | Stage Required | When Built | Assessment |
|---|---|---|---|
| HMAC token-based authentication with 2-hour expiry | Requirements called for `X-User-Id`/`X-User-Role` header prototype | Before mid-review (Stages 1–8) | Net positive — exceeds scope. Adds real session security. |
| `authMiddleware` re-reads role from DB on every request | Not required in prototype stage | Before mid-review | Good defensive practice; no negative side effects. |
| `errorHandler.js` centralised error middleware | Not required at early stages | Before mid-review | Appropriate — improves consistency. |
| `mapBookingRow` camelCase conversion in service layer | Not required explicitly | Before mid-review | Good maintainability choice. |
| Conflict check on approval | Was in REQUIREMENTS but is an advanced feature | Before mid-review | Implementation matches spec; not truly early. |
| Automated tests | Required in final stages | Added at Stage 11 | On-time for the testing stage. |

**No future-stage features detected:** No email notifications, no audit log, no admin panel, no recurring bookings.

---

## 12. Security Risks and Exposed-Secret Check

| Risk | Severity | Status | Detail |
|---|---|---|---|
| `JWT_SECRET` hardcoded fallback in `authMiddleware.js` | Medium | ⚠️ Unresolved | If `backend/.env` is missing, the app silently uses `'workshop_super_secret_key_12345'`. Any token signed with the default secret is valid. Should throw on startup if not set. |
| `backend/.env` contains real credentials | Low for workshop | ⚠️ Present | File is committed to the workspace. In a real project this must be in `.gitignore`. Password value not reproduced here. |
| `/api/users` returns `password_hash` to unauthenticated callers | High | ⚠️ Unresolved (H2) | `GET /api/users` has no `authMiddleware`. Any caller can retrieve all usernames, roles, and password hashes. This was flagged at mid-review and not fixed. |
| SHA-256 unsalted password hashing | Medium | ⚠️ Unresolved (M1) | SHA-256 without a salt is vulnerable to rainbow-table attacks. `bcrypt` or `argon2` with a salt should be used. The workshop scope makes this acceptable, but it must be noted. |
| CORS fully open (`app.use(cors())`) | Low-Medium | ⚠️ Unresolved (M6) | Any origin can call the API. Should be restricted to the frontend origin (`http://localhost:3000`) at minimum. |
| Stack traces returned when `NODE_ENV` not set | Low | ⚠️ Unresolved (M4) | `errorHandler.js` returns `err.stack` unless `NODE_ENV === 'production'`. No `.env` sets `NODE_ENV`, so traces are always returned. |
| Token stored in `localStorage` | Low | Noted | Susceptible to XSS. For a workshop prototype this is acceptable. `HttpOnly` cookies would be safer. |
| `JWT_SECRET` not documented in `.env.example` | Low | ⚠️ Unresolved (L3) | A developer copying `.env.example` would not know to set this key. |
| Duplicate `hashPassword` function | Low | ⚠️ Unresolved (M1) | Defined in both `setupDb.js` and `authRoutes.js`. A change to one would not update the other — a maintenance risk. |

**No plain-text passwords are printed in this review.** The `backend/.env` password field is configured but its value is not reproduced here.

---

## 13. Documentation / Code Mismatches

| Mismatch | Source | Detail |
|---|---|---|
| `PROJECT_CONTEXT.md` lists `staff_name` as a column | `PROJECT_CONTEXT.md` line 38 | The entity diagram says `staff_name VARCHAR(100)`. The actual table uses `requester_id INT` (FK to `app_users`). The implementation is better than the document (uses FK instead of free text), but the document is outdated. |
| `PROJECT_CONTEXT.md` Out of Scope says "A mock login/role switcher will be used" | `PROJECT_CONTEXT.md` line 65 | A real database-backed login with HMAC tokens was implemented. The out-of-scope statement is no longer accurate. |
| REQUIREMENTS §3 says client will pass `X-User-Id` or `X-User-Role` header | `REQUIREMENTS.md` line 61 | The actual implementation uses `Authorization: Bearer <token>`. The prototype header approach was superseded by the HMAC token system. |
| `README.md` folder structure diagram omits `docs/`, `middleware/`, `services/`, `tests/` subdirectories | `README.md` lines 8–19 | The diagram is simplified and does not reflect all directories. Minor documentation gap. |
| `docs/TEST_PLAN.md` Scenario C3 (staff updates own booking) and D3 (coordinator rejects) are documented but not in `api.test.js` | `docs/TEST_PLAN.md` | The automated script does not cover these two documented scenarios. |
| REQUIREMENTS §4 state machine says coordinator can move `approved → rejected` | `REQUIREMENTS.md` line 73 | The `/api/bookings/:id/status` endpoint accepts both `approved` and `rejected` and does not gate on current status (except the booking must exist). So this transition is technically possible via API. However, the UI `Review` modal calls `handleSubmitReview` with `approved` or `rejected` regardless of the current status — so the UI allows re-approving already-approved or re-rejecting already-rejected. No backend guard exists either, making this an implicit mismatch between the intended state machine and actual behaviour. |

---

## 14. Known Limitations

1. **No past-date validation:** Staff can submit a booking for yesterday. Neither frontend nor backend blocks this.
2. **Boundary-touching conflict not flagged:** If booking A ends at 10:00 and booking B starts at 10:00, the SQL condition `start_time < endTime AND end_time > startTime` evaluates as `10:00 < 10:00 → false`, so no conflict is detected. Whether back-to-back bookings should be allowed is not decided in the requirements.
3. **Re-approval of an already-approved booking:** The `/status` endpoint does not guard against `status === 'approved'` on an already-`approved` booking. The conflict check re-runs, but if no conflict is found it silently succeeds.
4. **`/api/users` unprotected:** Returns all users and their `password_hash` without authentication. This is a security regression that was not fixed after mid-review.
5. **JSX inline style bug (App.jsx line 318):** `color: var(--text-secondary)` inside a JS style object is a syntax error (missing string quotes). This would cause a React runtime crash at the login screen in a strictly mode environment. If the app appears to function, it may be because certain bundler/browser combinations tolerate the invalid expression, or it has been tested only in ways that bypass this line.
6. **No auto-logout on 401:** If the token expires, the next API call returns 401, but `App.jsx` only shows a fetch error notification — the session is not cleared and the user is not redirected to the login screen.
7. **No frontend `.env` committed:** `frontend/.env` does not exist. The frontend falls back to the hardcoded `http://localhost:5000/api`. Works locally but is not explicit configuration.
8. **No component decomposition:** All 641 lines of frontend logic are in a single `App.jsx`. A `BookingCard`, `BookingForm`, `FilterBar`, and `ReviewModal` decomposition would significantly improve maintainability.
9. **Destructive setup script:** `npm run db:setup` drops all data every run. There is no `--seed-only` option for adding test data without wiping existing records.
10. **No API version prefix:** All routes are at `/api/...` with no `/api/v1/`. Future versioning requires adding a prefix with a breaking change.
11. **CORS fully open:** Any domain can call the API. Acceptable for local workshop but a risk if the backend is ever accessible over a network.

---

## 15. Demo Script

**Prerequisites:** MySQL running; `npm run db:setup` completed; `npm run dev` running (both ports).  
**URL:** `http://localhost:3000`

### Scene 1 — Staff Workflow (alice_staff)

1. **Open** `http://localhost:3000`. Login screen appears with demo credentials listed.
2. **Log in** as `alice_staff` / `password123`. Click **Sign In**.
3. **Observe** header shows "Logged in as: alice_staff [staff]". Left panel shows "Request Room Booking" form. Right panel shows "My Booking Requests".
4. **Check seed data** — Alice's two seed bookings are visible (`Conference Room A – approved`, `Meeting Room B – rejected` with coordinator note "Conflict with maintenance window.").
5. **Submit a new booking** — Select "Boardroom", pick a future date, set Start 09:00, End 10:30, Purpose "Demo session". Click **Submit Request**.
6. **Observe** notification: "Booking request submitted successfully!" New card appears with status `pending` and Edit/Cancel buttons.
7. **Edit the booking** — Click **Edit** on the new pending card. Form populates with existing values. Change the purpose to "Updated demo session". Click **Save Changes**.
8. **Filter test** — Select "Boardroom" in Filter by Room. Confirm only the Boardroom booking appears. Click **Clear Filters**.
9. **Cancel test** — Click **Cancel** on the pending booking. Confirm dialog appears. Confirm → status changes to `cancelled`, action buttons disappear.
10. **Logout** — Click **Logout**. Returns to login screen.

### Scene 2 — Coordinator Workflow (charlie_coord)

1. **Log in** as `charlie_coord` / `password123`.
2. **Observe** no booking form panel. Right panel shows "All Booking Requests" — all bookings from all staff visible including Bob's and Alice's. Each card shows the requester's name.
3. **Filter** by Status = "pending". Confirm only pending bookings show.
4. **Clear Filters** and click **Review** on a pending booking.
5. **Review modal** opens — shows room, date, time, purpose, requester. Enter a note: "Approved for demo purposes.". Click **Approve**.
6. **Observe** booking status changes to `approved`, note appears on the card.
7. **Conflict demo** — If there is a second pending booking for the same room/date/time overlap: click **Review** → **Approve**. Observe error notification: "Double Booking Conflict: The room '...' is already approved for another request at this time slot."
8. **Reject demo** — Click **Review** on another pending booking. Enter note: "Not available.". Click **Reject**. Status changes to `rejected`, note visible.
9. **Logout.**

### Scene 3 — Automated Test

```bash
# From project root
npm test
```

Observe console output:
```
✓ Database connection: Verified
✓ Staff Login: Verified
✓ Coordinator Login: Verified
✓ Block Unauthorized Login: Verified
✓ Create Booking (Pending): Verified
✓ Chronology time validation checks: Verified
✓ Block Staff Approvals (Protected Route): Verified
✓ Block cross-user booking modification: Verified
✓ Coordinator Approval: Verified
✓ Double-booking overlap block: Verified
✓ Filtering by Room name: Verified
All end-to-end API test assertions passed successfully!
```

---

## 16. Suggested Viva Questions

### Project Setup and Architecture

1. Why does the project have three `package.json` files? What does each one control?
2. Explain what `npm run install-all` does and why it is needed for a monorepo structure.
3. What would happen if `backend/.env` were deleted? What would break first and why?
4. Why is `VITE_API_URL` in the frontend `.env` but all five database variables are only in the backend `.env`?

### Database and Data Layer

5. Open `config/setupDb.js`. Why does the script call `SET FOREIGN_KEY_CHECKS = 0` before dropping tables?
6. The `room_bookings` table uses `requester_id INT` as a foreign key. The original context document listed `staff_name VARCHAR`. Why is a foreign key better? What would break if the user were deleted with `ON DELETE CASCADE`?
7. If you needed to add a `cancelled_at` timestamp column to `room_bookings` without destroying existing data, how would you change the setup script?
8. Why is `password_hash` stored in the database instead of the plain-text password?

### Authentication and Role Control

9. Walk through what happens from the moment a user clicks "Sign In" to the moment they can see their bookings. Name every file involved.
10. Why does `authMiddleware.js` re-read the user's role from the database on every request instead of extracting it from the token?
11. A staff member manually crafts a request to `PUT /api/bookings/1/status` with `{ "status": "approved" }` and their valid token. Walk through every check the backend performs before deciding whether to allow or reject this.
12. What is the purpose of the HMAC signature in the custom token? What would happen if you changed `JWT_SECRET` after users had already logged in?

### Booking Workflow and Conflict Logic

13. Explain the `checkConflict` SQL query in `dbService.js`. Draw a timeline of two bookings — one that would be caught as a conflict and one that would not.
14. A coordinator tries to approve booking B for "Conference Room A" on 2026-06-20, 10:00–12:00. Booking A for the same room/date was already approved for 09:00–11:00. Would the conflict check catch this? What about 09:00–10:00?
15. The cancel endpoint calls `updateBookingStatus(bookingId, 'cancelled', booking.coordinatorNote)`. What is `booking.coordinatorNote` doing here, and why might this behaviour be surprising?
16. REQUIREMENTS §4 says a `rejected` booking can be moved to `approved` by a coordinator. Is this supported by the current API? Is it supported by the UI?

### Testing

17. How does the test suite avoid polluting the live database? What is the naming convention used and where is the cleanup called?
18. The test file uses Node's `assert` module and raw `fetch`. What are the trade-offs of this approach compared to using Jest and Supertest?
19. The automated test for staff approval returns 403. Explain step by step how this is verified — from the fetch call in the test to the response returned by the server.
20. Name two test scenarios that are in `docs/TEST_PLAN.md` but are not covered by the automated script. How would you add one of them?

### Security and Known Limitations

21. Open `userRoutes.js`. What security problem exists on the only route in this file? How would you fix it in two lines of code?
22. The `errorHandler.js` returns `err.stack` in its response. Under what condition does it do this, and why is this a risk if the backend is ever reached from outside localhost?
23. If `backend/.env` is missing or the `JWT_SECRET` key is absent, what happens at runtime? What would be a safer approach?
24. Give two reasons why storing the session token in `localStorage` is less secure than storing it in an `HttpOnly` cookie.

