# Mid-Project Review — Room Booking System

**Review Date:** 2026-06-14  
**Review Stage:** After secondary feature (filter by room/date/status). Before testing, security hardening, and maintainability cleanup.  
**Reviewer:** Antigravity AI Code Review  
**Project Path:** `p3/`  
**Stack:** React (Vite) + Express + MySQL (`mysql2`)

---

## 1. Mid-Review Summary

The project is structurally sound and well ahead of where a typical mid-stage build sits. The frontend/backend separation is clean, routing is correctly wired, and the primary workflow (create → view → update → approve/reject) is implemented end-to-end with real database persistence. The secondary feature (filter by room, date, status) is fully present. The auth layer is notably stronger than the prototype-level requirement called for — a custom HMAC token is issued at login and verified on every protected route, and the role is re-read from the database on every authenticated request rather than trusting browser-supplied headers.

Key gaps at this stage are: no `frontend/.env` file (frontend falls back to a hardcoded localhost default), the `/api/users` endpoint is unprotected and leaks password hashes, the conflict-check SQL condition covers only strict interior overlap and would miss same-start or same-end edge cases, the status state machine is partially enforced (pending-only edits work, but coordinator cancel of approved bookings is blocked by a missing status check), and there are no automated tests of any kind.

Overall the project is in a good position to move forward into testing and security hardening with a short list of targeted fixes.

---

## 2. Review Scoring Matrix

| Feature / Area | Functionality 0-5 | Data Persistence 0-5 | Backend Security / Role Control 0-5 | Validation / Error Handling 0-5 | Testing Evidence 0-5 | Maintainability 0-5 | UI / Manual Usability 0-5 | Evidence | Notes |
|---|---:|---:|---:|---:|---:|---:|---:|---|---|
| Project setup and run commands | 4 | 5 | — | — | 0 | 4 | — | `package.json` root scripts: `install-all`, `dev`, `db:setup`; backend has `start`/`dev`/`db:setup`; frontend has `dev`/`build`/`preview` | No `frontend/.env` file committed; falls back to hardcoded default. No health-check test. |
| Database setup and starter data | 5 | 5 | — | — | 0 | 4 | — | `config/setupDb.js` drops and recreates both tables, seeds 3 users + 3 bookings; `npm run db:setup` from root | SHA-256 used for passwords instead of bcrypt. Hardcoded seed password printed to console. No migration versioning. |
| Login workflow | 4 | 5 | 4 | 3 | 0 | 3 | 4 | `POST /api/auth/login` in `authRoutes.js`; username+password checked against `app_users.password_hash`; custom HMAC token (2 h expiry) returned; stored in `localStorage` | SHA-256 password hashing (no salt); `JWT_SECRET` falls back to hardcoded string; token in `localStorage` (XSS risk noted for hardening stage). |
| Role-based access | 4 | 4 | 4 | 3 | 0 | 3 | 4 | `authMiddleware.js` re-reads role from DB on every request; `bookingRoutes.js` splits coordinator vs. staff paths; `/api/users` is **unprotected** | `/api/users` returns full `app_users` rows including `password_hash` with no auth guard — medium severity exposure. |
| Main create action | 4 | 5 | 4 | 4 | 0 | 4 | 4 | `POST /api/bookings`; validates all required fields + end>start; blocks staff booking on behalf of other users; `dbService.createBooking` inserts with status `pending` | No future-date guard on booking date. No max-booking-duration limit. |
| Main view/list action | 5 | 5 | 5 | 4 | 0 | 4 | 4 | `GET /api/bookings`; coordinator gets all rows (JOIN with `app_users`), staff gets own rows only — enforced server-side; camelCase mapping in `mapBookingRow` | Error message on fetch failure is the raw HTTP status text, not a user-friendly message. |
| Main update/status/cancel action | 3 | 4 | 4 | 3 | 0 | 3 | 4 | `PUT /api/bookings/:id` (pending-only, own-only for staff); `PUT /api/bookings/:id/cancel` (own or coordinator) | Cancel endpoint allows cancelling `pending` and `approved` but not `rejected` — consistent. However, REQUIREMENTS §4 says coordinator can change `approved → cancelled`; the cancel route allows this. REQUIREMENTS §4 says `approved → rejected` (by coordinator) is valid but the cancel route only sets status=`cancelled` — a separate coordinator-cancel-to-rejected path does not exist. PUT /api/bookings/:id (edit details) correctly blocks non-pending. |
| Protected action | 5 | 5 | 5 | 4 | 0 | 4 | 5 | `PUT /api/bookings/:id/status` checks `role === 'coordinator'` before proceeding; validates `approved`/`rejected` only; runs conflict check before setting `approved`; coordinator note saved | Conflict SQL misses boundary-touching bookings (end=start of another). Status endpoint does not guard against approving an already-approved booking (re-approve silently succeeds). |
| Secondary feature | 5 | 5 | 5 | 4 | 0 | 4 | 4 | Filters `roomName`, `bookingDate`, `status` passed as query params; both `getAllBookings` and `getBookingsByRequester` in `dbService.js` apply filters via parameterised SQL; `Clear Filters` button in UI | Room filter uses LIKE — partial match across all bookings may be confusing for staff with a short room list. Date filter is exact-match only (no range). |
| Case-specific: room/date/time booking details and conflict awareness | 4 | 5 | 4 | 4 | 0 | 3 | 4 | Room, date, start time, end time stored as separate DB columns; `checkConflict` called before approval; frontend shows all fields on card | Conflict SQL: `start_time < endTime AND end_time > startTime` — misses bookings where start times are equal (same-start edge case). No front-end conflict preview. |
| Case-specific: booking approval/rejection status with coordinator note | 5 | 5 | 5 | 4 | 0 | 4 | 5 | Status ENUM in DB; `coordinator_note TEXT` column; review modal lets coordinator enter note then approve or reject; note shown on booking card | Coordinator note is optional — the field can be submitted blank for approve/reject. No requirement says it must be mandatory but could be a UX concern. |
| Case-specific: staff ownership and coordinator-only status changes | 5 | 5 | 5 | 4 | 0 | 4 | 4 | Staff can edit/cancel only own bookings (checked by `booking.requesterId !== userId` on backend); approve/reject restricted to coordinator by role check; UI hides staff actions on non-own bookings | Staff sees all own bookings including other statuses but edit/cancel buttons correctly hidden for non-pending. Coordinator "Review" button shown on all bookings regardless of current status. |
| UI / manual usability | 4 | — | — | 3 | 0 | 3 | 4 | Dark theme with Outfit font; responsive grid; status badge colours; coordinator note displayed inline; booking cards with hover animation; modal for review | JSX syntax error on line 318 of App.jsx: `color: var(--text-secondary)` — a JS expression `var(...)` in an inline-style object string will cause a runtime error. No loading indicator during status update. |
| Security posture | 3 | — | 3 | — | 0 | 3 | — | HMAC token with expiry and DB-lookup on every request; role never trusted from client; parameterised queries throughout | SHA-256 (unsalted) for passwords; hardcoded `JWT_SECRET` fallback; `/api/users` unprotected + exposes hash; `errorHandler` leaks stack traces in non-production; CORS is open (`app.use(cors())` with no origin restriction). |
| Testing evidence | 0 | 0 | 0 | 0 | 0 | 0 | 0 | No test files, no test dependencies (jest/supertest/vitest) in any package.json | No test hooks, no test data factories, no test environment config. |
| Maintainability | 3 | — | — | — | 0 | 3 | — | Clean folder structure; service layer separates DB queries from route logic; `mapBookingRow` centralises field mapping; `.env.example` provided | All app logic lives in a single 641-line `App.jsx` — no component decomposition. No API version prefix. No JSDoc or meaningful inline comments beyond brief labels. Duplicate `hashPassword` function in both `setupDb.js` and `authRoutes.js`. |

---

## 3. Current Feature Status

| Feature | Status | Notes |
|---|---|---|
| Room booking create (staff) | ✅ Working | Required fields validated on both frontend and backend |
| Room booking view/list (own - staff) | ✅ Working | Backend enforces staff sees only own records |
| Room booking view/list (all - coordinator) | ✅ Working | Backend returns all bookings with requester username joined |
| Room booking edit/update (pending only) | ✅ Working | Backend enforces pending-only and ownership |
| Room booking cancel | ✅ Working | Allows cancel of pending and approved bookings |
| Coordinator approve/reject | ✅ Working | Role-checked on backend; conflict check runs on approve |
| Coordinator note (add/edit) | ✅ Working | Saved to DB; displayed on cards |
| Filter by room | ✅ Working | LIKE query; partial match |
| Filter by date | ✅ Working | Exact-match DATE comparison |
| Filter by status | ✅ Working | Exact-match ENUM comparison |
| Clear filters | ✅ Working | Button appears when any filter is active |
| Double-booking conflict check | ⚠️ Partial | Interval logic misses boundary-touching slots |
| Status state machine | ⚠️ Partial | Coordinator re-approve of already-approved booking not blocked; `rejected → approved` supported by status endpoint but UI always shows "Review" regardless of status |
| Login (database-backed) | ✅ Working | Credentials checked against `app_users`; HMAC token issued |
| Logout | ✅ Working | Clears localStorage and resets state |
| Token expiry | ✅ Working | 2-hour expiry enforced in middleware |

---

## 4. Database and Persistence Status

**Tables present:** `app_users`, `room_bookings`  
**Users/login table:** ✅ Yes — `app_users` with `id`, `username`, `password_hash`, `role`, `created_at`  
**Booking table:** ✅ Yes — `room_bookings` with all required columns including `coordinator_note`, `status` ENUM, timestamps

**Repeatable setup:** ✅ `npm run db:setup` (from root) runs `node config/setupDb.js` which drops and recreates tables then seeds 3 users and 3 bookings.

**Concerns:**
- Password stored as unsalted SHA-256 hash — collision-resistant but weak against rainbow tables.
- No migration versioning; re-running `db:setup` is destructive (drops existing data).
- No separate seed vs. schema scripts; seeding is bundled with DDL.
- Seed password `password123` is printed to console in plain text.

---

## 5. Login and Role/Access Status

**Login type:** Database-backed with a custom HMAC token — exceeds the prototype requirement which only called for `X-User-Id`/`X-User-Role` header passing.

**How it works:**
1. `POST /api/auth/login` → username/password checked against `app_users.password_hash` (SHA-256).
2. Custom token issued: `userId:expiresAt:hmacSignature` (2-hour expiry).
3. Stored in `localStorage`.
4. Every protected request sends `Authorization: Bearer <token>`.
5. `authMiddleware` verifies expiry, re-signs, and re-fetches user from DB to get live role.

**Role enforcement:**
- ✅ Staff see only own bookings (`GET /api/bookings` → `getBookingsByRequester`)
- ✅ Coordinator sees all bookings (`GET /api/bookings` → `getAllBookings`)
- ✅ Approve/reject requires `role === 'coordinator'` checked in route handler
- ✅ Edit/cancel checks ownership for staff role
- ⚠️ `/api/users` route has **no auth middleware** — returns all users including `password_hash`

**Frontend role control:**
- ✅ Staff booking form shown only for `role === 'staff'`
- ✅ Review button shown only for `role === 'coordinator'`
- ✅ Edit/Cancel buttons shown only for `role === 'staff'` and `status === 'pending'`
- These are UI-only guards, but backend enforcement is also present (defence in depth is correct).

---

## 6. Protected Action Status

**Protected action:** Approve or reject room bookings and edit coordinator notes

| Check | Result |
|---|---|
| `PUT /api/bookings/:id/status` requires auth token | ✅ — all booking routes use `router.use(authMiddleware)` |
| Coordinator role enforced before approve/reject | ✅ — `if (role !== 'coordinator') return 403` |
| Conflict check before approval | ✅ — `dbService.checkConflict` called for `approved` status |
| Coordinator note persisted | ✅ — passed to `updateBookingStatus(id, status, coordinatorNote)` |
| Staff cannot call status endpoint | ✅ — verified by role check |
| UI Approve/Reject button only rendered for coordinator | ✅ |
| Conflict SQL boundary edge case | ⚠️ — `start_time < endTime AND end_time > startTime` — misses bookings touching at a single point (e.g., booking A ends 10:00, booking B starts 10:00 — would NOT be flagged as a conflict; this is arguably acceptable behaviour but should be explicitly decided) |
| Re-approve of already-approved booking | ⚠️ — status endpoint does not block setting `approved` on a booking already `approved` |

---

## 7. Validation Status

| Validation Rule | Frontend | Backend | Notes |
|---|---|---|---|
| All required fields present | ✅ | ✅ | Both check roomName, bookingDate, startTime, endTime, purpose |
| End time after start time | ✅ | ✅ | Both enforce `endTime > startTime` |
| Booking date is in the future | ❌ | ❌ | No past-date guard anywhere |
| Status enum constraint | ✅ (ENUM) | ✅ | DB ENUM + route-level check for approve/reject |
| Conflict on approve | — | ✅ | Server-side only (correct) |
| Ownership on update | — | ✅ | `booking.requesterId !== userId` |
| Ownership on cancel | — | ✅ | Same check |
| Required `requesterId` on create | ✅ | ✅ | Checked in POST route |
| `requesterId` matches logged-in user (staff) | — | ✅ | `parseInt(requesterId) !== userId` for non-coordinator |
| State machine: only pending editable | — | ✅ | `booking.status !== 'pending'` guard |
| State machine: cancel only pending/approved | — | ✅ | `!['pending','approved'].includes(booking.status)` guard |
| Error messages returned as structured JSON | — | ✅ | All routes return `{ success: false, message }` |

**Missing validations (before testing stage):**
- No past-date guard (`bookingDate` can be set to yesterday)
- No maximum booking duration rule
- No minimum booking duration rule
- Purpose field has no maximum length enforced at application level (DB has `TEXT` which is fine but a practical cap is missing)
- Status transition: coordinator re-approving an already-approved booking is not blocked

---

## 8. Stage Drift / Early Implementation

The following were implemented beyond what the secondary feature stage required:

| Item | Scope vs. Requirements |
|---|---|
| HMAC token-based authentication with expiry | Requirements called for a simpler `X-User-Id`/`X-User-Role` header prototype; a full custom token system was implemented instead. This is a net positive but represents early security hardening. |
| `authMiddleware` re-reads user from DB on every request | Exceeds prototype requirement; good practice for hardening stage |
| Custom error handler middleware (`errorHandler.js`) | Not required at this stage; implemented early — appropriate |
| `mapBookingRow` camelCase conversion in service layer | Not explicitly required; improves maintainability — appropriate |
| Conflict check on approve | Was in the requirements, so not truly early, but the implementation quality is notable |

No future-stage features were found (e.g., no email notifications, no admin panel, no audit log implemented).

---

## 9. Issues Found Before Stage 8

### 🔴 High Priority

| ID | File | Line | Issue |
|---|---|---|---|
| H1 | `frontend/src/App.jsx` | 318 | JSX inline style contains `color: var(--text-secondary)` as a raw string inside a JS object literal — this is a syntax error. The string `var(--text-secondary)` is not a valid JS value for an inline style property. Should be `color: 'var(--text-secondary)'`. Will cause a render crash at the login screen. |
| H2 | `backend/routes/userRoutes.js` | 6 | `GET /api/users` has no `authMiddleware` — returns all rows from `app_users` including `password_hash` to unauthenticated callers. Should at minimum require auth, and should exclude `password_hash` from the response. |

### 🟠 Medium Priority

| ID | File | Line | Issue |
|---|---|---|---|
| M1 | `backend/config/setupDb.js` | 12 | `hashPassword` uses `crypto.createHash('sha256')` with no salt. The same function is duplicated in `authRoutes.js` line 7. Should be extracted to a shared utility and replaced with `bcrypt` at the security hardening stage. |
| M2 | `backend/middleware/authMiddleware.js` | 4 | `JWT_SECRET` falls back to a hardcoded value `'workshop_super_secret_key_12345'`. If `.env` is missing, the app silently uses this weak secret. Should throw on startup if secret is not set. |
| M3 | `backend/services/dbService.js` | 153 | Conflict SQL: `start_time < ? AND end_time > ?` (params: `endTime`, `startTime`) — boundary-touching slots (booking A ends 10:00, booking B starts 10:00) are not flagged as conflicts. Whether this is intentional should be documented. |
| M4 | `backend/middleware/errorHandler.js` | 11 | Stack traces are returned in responses unless `NODE_ENV === 'production'`. No `NODE_ENV` is set in `.env` — so traces are exposed in a dev environment that could face external traffic. Should require explicit `NODE_ENV=production` to suppress. |
| M5 | `backend/routes/bookingRoutes.js` | 113–154 | `PUT /:id/status` does not block re-approving an already-approved booking. A second `approved` call would re-run the conflict check but silently succeed. Should guard: `if (booking.status === status) return 400`. |
| M6 | `backend/server.js` | 14 | `app.use(cors())` is open with no origin restriction. Should be tightened to allow only the frontend origin at the security hardening stage. |

### 🟡 Low Priority / Notes for Cleanup

| ID | File | Issue |
|---|---|---|
| L1 | `frontend/src/App.jsx` | Single 641-line component — no decomposition into smaller components (BookingCard, BookingForm, FilterBar, ReviewModal). Maintainability concern. |
| L2 | `backend/routes/bookingRoutes.js` | `PUT /:id/cancel` reuses `updateBookingStatus` and passes `booking.coordinatorNote` as the existing note — this effectively preserves the note on cancel rather than clearing or requiring a new note. Behaviour is implicit and undocumented. |
| L3 | `backend/` | No `JWT_SECRET` key is documented in `.env.example` — the key is read in `authMiddleware.js` but not listed as a required env var. |
| L4 | All | No API version prefix (e.g., `/api/v1/`) — makes future versioning harder. |
| L5 | `frontend/src/App.jsx` | No loading state during status update (approve/reject) or cancel — user can double-click buttons. |
| L6 | Whole project | No `frontend/.env` committed — the README instructs users to create it manually but it does not exist. Frontend falls back to `http://localhost:5000/api` which works locally but could silently use wrong URL. |
| L7 | `backend/config/setupDb.js` | Setup script is destructive (drops tables); no `--seed-only` or incremental migration option exists. |

---

## 10. Manual Checks Recommended Next

1. **Login screen render** — Confirm the app loads without a crash. The `var(--text-secondary)` inline style issue (H1) will throw at the login screen if not resolved first.
2. **Staff login flow** — Log in as `alice_staff` / `password123`, confirm the booking list shows only alice's bookings, confirm the booking form appears, submit a booking, verify it appears as `pending`.
3. **Staff cannot approve** — While logged in as `alice_staff`, attempt `PUT /api/bookings/1/status` with `{"status":"approved"}` directly via curl/Postman — confirm 403 is returned.
4. **Coordinator login flow** — Log in as `charlie_coord`, confirm all 3 seed bookings appear, open the Review modal, enter a note, approve a booking — confirm status changes and note appears.
5. **Conflict detection** — Approve two overlapping bookings for the same room/date/time via the coordinator UI — confirm the second approval returns a 409 conflict message.
6. **Filter functionality** — Apply each filter (room, date, status) individually and in combination; confirm list narrows correctly; confirm Clear Filters resets the list.
7. **`/api/users` exposure** — Visit `http://localhost:5000/api/users` unauthenticated in a browser; confirm it returns user data (document this as a known issue H2 for the hardening stage).
8. **Token expiry** — Manually corrupt or expire the token in localStorage; confirm the next API call returns 401 and the UI handles it gracefully (currently no auto-logout on 401 is present in `App.jsx`).
9. **Past date booking** — Submit a booking with yesterday's date via the frontend; confirm it is accepted (document as missing validation).
10. **Edit a non-pending booking** — Attempt `PUT /api/bookings/1` on a seed `approved` booking; confirm 400 is returned.

---

## 11. Pass / Fail Table

| Check | Result | Detail |
|---|---|---|
| App appears runnable | ⚠️ Conditional | Runnable after manual `.env` creation and `db:setup`. JSX syntax error (H1) will crash the login page. |
| React frontend and Express backend are separated | ✅ Pass | Separate `/frontend` and `/backend` directories with independent `package.json` files |
| React calls Express routes and never connects to MySQL directly | ✅ Pass | All DB access is through Express; frontend uses only `fetch()` to Express API endpoints |
| Backend uses DB_HOST, DB_PORT, DB_USER, DB_PASSWORD, DB_NAME without exposing in React | ✅ Pass | All five variables present in `backend/.env` and `backend/config/db.js`; `VITE_API_URL` in frontend only |
| Needed database tables exist including users/login table | ✅ Pass | `app_users` (users/login) and `room_bookings` both present in `setupDb.js` |
| Repeatable database setup or seed command | ✅ Pass | `npm run db:setup` from root; fully scripted |
| Login is database-backed | ✅ Pass | `app_users.password_hash` verified in `authRoutes.js`; exceeds prototype scope |
| Role restrictions enforced in backend, not only UI | ✅ Pass | `authMiddleware` re-reads role from DB; all role checks are in route handlers |
| Approve/reject and coordinator note are protected | ✅ Pass | `PUT /:id/status` checks `role === 'coordinator'` on backend |
| Users limited to their own allowed records | ✅ Pass | `GET /api/bookings` scopes staff to own records; edit/cancel checks ownership |
| Main workflow (create → view → update → approve/reject) implemented | ✅ Pass | All four stages present and functional |
| Filter by room, date, status implemented | ✅ Pass | All three filters implemented in both frontend and backend |
| Validation present | ⚠️ Partial | Required fields and time ordering validated; past-date guard missing; no max duration |
| AI implemented future stages early | ⚠️ Minor | HMAC token auth implemented (required scope was simpler header prototype) |
| Missing before testing, security hardening, maintainability cleanup | ❌ See issues | H1 (JSX crash), H2 (unprotected users route), M1–M6 (medium issues), L1–L7 (low/cleanup) |
