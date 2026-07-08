# Final Review — Room Booking System

**Review date:** 2026-06-14  
**Reviewer note:** Read-only review. All findings are based on direct inspection of the actual project files. No source code, schema, seed data, package files, or configuration was modified.

---

## 1. Final Feature Summary

The project is a **Room Booking System** built with React (Vite), Node.js/Express, and local MySQL. It implements the full booking workflow described in `Case_Brief.md`: a Staff member can request a room, view their own bookings, edit or cancel pending requests; a Coordinator can view all requests, approve or reject them with a note, and a secondary filter-by-room/date/status feature is implemented on both tiers.

The following features are **fully implemented and evidenced in code**:

| Feature | Status | Key File Evidence |
|---|---|---|
| Create booking request (room, date, start/end time, purpose, name) | ✅ Complete | `backend/routes/bookingRoutes.js` POST `/api/bookings` |
| View own bookings (Staff — scoped) | ✅ Complete | `bookingRoutes.js` GET: `user_id = req.user.id` when role ≠ Coordinator |
| View all bookings (Coordinator — unscoped) | ✅ Complete | Same GET route; no `user_id` filter applied for Coordinators |
| Edit pending booking (Staff — own only) | ✅ Complete | `bookingRoutes.js` PUT `/:id` — ownership + pending-status guard |
| Cancel own pending booking (Staff) | ✅ Complete | `bookingRoutes.js` PATCH `/:id/status` with `cancelled` status |
| Approve booking with note (Coordinator only) | ✅ Complete | PATCH route; 403 returned for non-Coordinator |
| Reject booking with note (Coordinator only) | ✅ Complete | Same PATCH route; same role guard |
| Conflict/overlap detection on create | ✅ Complete | `bookingRoutes.js` POST — SQL overlap query, returns 409 |
| Conflict/overlap detection on approve | ✅ Complete | PATCH status route — SQL overlap query re-run before setting `approved` |
| Filter by room, date, status | ✅ Complete | GET `/api/bookings?room=&date=&status=`; dynamic parameterised query |
| Session-based token authentication | ✅ Complete | `authRoutes.js`, `middleware/auth.js`, `sessions` table |
| Role resolved from DB on every request | ✅ Complete | `auth.js` joins `sessions` + `users` — no client-side role trust |
| Automated backend integration tests | ✅ Complete | `backend/tests/api.test.js` (custom runner, Node fetch) |
| Test data isolation and cleanup | ✅ Complete | `TEST_` prefix pattern; cleaned in `finally` block |
| DB setup script | ✅ Complete | `npm run db:setup` → `scripts/dbSetup.js` → `db/schema.sql` |

**Limitations still present at final stage** (see Section 14):
- Passwords stored in plaintext (no bcrypt).
- CORS remains fully open.
- No session expiry or server-side logout endpoint.
- API base URL hardcoded in frontend source (6 occurrences).
- `requester_name` is free text, not auto-filled from session user.
- No `.gitignore` found at project root.
- PUT (edit) route has no overlap re-check.
- `.env.example` missing `DB_PORT`; a duplicate with a leading-space filename also exists.

---

## 2. Review Scoring Matrix

> Score meaning: 0 = missing · 1 = present but mostly not working · 2 = partially working with major gaps · 3 = mostly working with important gaps · 4 = working with minor gaps · 5 = complete for selected case scope

| Feature / Area | Functionality 0-5 | Data Persistence 0-5 | Backend Security / Role Control 0-5 | Validation / Error Handling 0-5 | Testing Evidence 0-5 | Maintainability 0-5 | UI / Manual Usability 0-5 | Evidence | Notes |
|---|---:|---:|---:|---:|---:|---:|---:|---|---|
| Project setup and run commands | 5 | 5 | 5 | 4 | 4 | 3 | 4 | `backend/package.json`: `start`, `dev`, `db:setup`, `test`; `frontend/package.json`: `dev`, `build`; `node_modules` present in both | No root README; `.env.example` missing `DB_PORT`; duplicate `.env.example` with leading-space filename persists |
| Database setup and starter data | 5 | 5 | 5 | 4 | 4 | 3 | 4 | `db/schema.sql` creates DB `c8p2`, tables `users`/`sessions`/`bookings`, seeds 3 users + 3 bookings; callable via `npm run db:setup` | Seed passwords in plaintext; no teardown/re-seed script; `dbSetup.js` semicolon-split approach is fragile for multi-statement SQL |
| Login workflow | 4 | 4 | 2 | 4 | 5 | 3 | 4 | `POST /api/auth/login` → DB query → opaque token → stored in `sessions`; token used as Bearer on all requests; tested in `api.test.js` (staff login, coord login, bad password → 401) | Plaintext password comparison (no bcrypt); no logout endpoint; no token expiry |
| Role-based access | 5 | 5 | 5 | 4 | 5 | 4 | 4 | Role from DB join on every request; staff scope enforced in GET; approve/reject blocked for non-Coordinators; spoofing test passes in automated suite | No rate-limiting; Coordinator not blocked at backend from POST-ing a booking (UI only hides it) |
| Main create action | 4 | 5 | 5 | 4 | 5 | 4 | 4 | `POST /api/bookings`; all 6 fields validated; past-date and time-order checked; overlap query returns 409; user_id always set from `req.user.id`; tested end-to-end in `api.test.js` | `requester_name` free-text, not auto-filled; overlap logic covers all cases but uses 3-clause OR instead of canonical `NOT (end <= newStart OR start >= newEnd)` |
| Main view/list action | 5 | 5 | 5 | 4 | 4 | 4 | 4 | GET scoped by role; filter params parameterised; returns all required fields; filter tests in automated suite | No server-side pagination; `booking_date` split on `T` in UI (works, minor assumption) |
| Main update/status/cancel action | 3 | 4 | 4 | 3 | 4 | 3 | 3 | PUT checks ownership and pending status; PATCH handles approve/reject/cancel with role + ownership guards; tested in `api.test.js` | PUT missing overlap re-check; inline cancel handler in Dashboard.jsx duplicates fetch instead of reusing `handleStatusUpdate`; staff can only cancel own pending (correct) |
| Protected action | 5 | 5 | 5 | 4 | 5 | 4 | 4 | PATCH `/:id/status` → 403 for non-Coordinator on approve/reject; overlap re-check on approval; coordinator note persisted; all paths tested in automated suite | Note is optional; no backend enforcement that a note is required for rejected status |
| Secondary feature | 5 | 5 | 5 | 4 | 4 | 4 | 4 | Room (LIKE), date (exact), status (exact) filters; dynamic parameterised query; frontend filter inputs with auto-refetch on change; Clear Filters button | No UI feedback when zero results are due to active filters vs. no data at all |
| Case-specific: room/date/time booking details and conflict awareness | 4 | 5 | 5 | 4 | 5 | 4 | 4 | All 6 required fields collected; overlap checked on create and on approval; past-date and time-order validated on both frontend and backend; 409 returned and tested | PUT (edit) skips overlap check; no minimum booking duration enforced |
| Case-specific: booking approval/rejection status with coordinator note | 5 | 5 | 5 | 4 | 5 | 4 | 4 | Status ENUM: pending/approved/rejected/cancelled; `coordinator_note` column present; note returned to UI and displayed for all roles; approval + note persistence verified in automated test | Note not required on rejection; no audit timestamp beyond `updated_at` |
| Case-specific: staff ownership and coordinator-only status changes | 5 | 5 | 5 | 4 | 5 | 4 | 4 | GET scoped to own records for Staff; PUT and PATCH verify `user_id` from DB; approve/reject Coordinator-only enforced in backend; spoofing header test confirms DB-side resolution | `requester_name` not bound to `user.username` (staff can enter any name) |
| UI / manual usability | 4 | 4 | 3 | 3 | 3 | 3 | 4 | Dark glassmorphism theme; status badges; loading/empty states; modal form; sample credentials on login; role-appropriate views | API URL hardcoded in 6 places; no `vite.config.js`; alert messages not auto-dismissed; Coordinator cannot create bookings from UI |
| Security posture | 2 | 3 | 3 | 3 | 3 | 2 | 3 | DB secrets in `.env`; parameterised queries; role from DB not client; spoofing test automated | Plaintext passwords; open CORS; no session expiry; no `.gitignore` found (`.env` could be committed to git) |
| Testing evidence | 4 | 4 | 5 | 5 | 5 | 4 | 4 | `api.test.js`: 15 automated checks across login, creation, validation, role enforcement, spoofing, filters, approval, overlap, cleanup; run via `npm test` | No test framework (Jest/Mocha); no test report file; tests exit process on failure; no frontend tests |
| Maintainability | 3 | 3 | 4 | 3 | 4 | 3 | 3 | Route files separated; config module; validation utility module; `.env.example`; seed data; consistent naming | No root README; API URL not centralised; inline cancel handler duplicated; no backend ESLint config; duplicate `.env.example` with leading-space filename |

---

## 3. Project Structure and Run Commands

```
p2/
├── Case_Brief.md
├── MID_REVIEW.md
├── FINAL_REVIEW.md
├── db/
│   └── schema.sql                  ← Database DDL + seed data
├── backend/                        ← Node.js / Express server (independent package)
│   ├── .env                        ← Real secrets (DB credentials, PORT)
│   ├── .env.example                ← Template (missing DB_PORT; duplicate with leading-space name exists)
│   ├── package.json                ← scripts: start, dev, db:setup, test
│   ├── server.js                   ← Express entry point; CORS, JSON body parser, routes, error handler
│   ├── config/
│   │   └── db.js                   ← mysql2/promise pool; reads all 5 DB_* env vars
│   ├── middleware/
│   │   └── auth.js                 ← authenticateToken; DB join of sessions + users
│   ├── routes/
│   │   ├── authRoutes.js           ← POST /api/auth/login
│   │   └── bookingRoutes.js        ← GET, POST, PUT /:id, PATCH /:id/status
│   ├── scripts/
│   │   └── dbSetup.js              ← Reads schema.sql; executes statements; callable via npm run db:setup
│   ├── utils/
│   │   └── validation.js           ← validateRequiredFields, isDateInPast, isInvalidTimeRange
│   └── tests/
│       └── api.test.js             ← Custom integration test runner (Node fetch + mysql2)
└── frontend/                       ← React / Vite app (independent package)
    ├── index.html
    ├── package.json                ← scripts: dev, build, lint, preview
    └── src/
        ├── main.jsx
        ├── App.jsx                 ← Root: login state, localStorage persistence
        ├── index.css               ← Dark glassmorphism design system
        ├── components/
        │   └── BookingForm.jsx     ← Create/Edit modal form; frontend validation
        └── pages/
            ├── Login.jsx           ← POST /api/auth/login; credential hints
            └── Dashboard.jsx       ← List, filter, approve/reject, cancel; role-conditional UI
```

**Run commands:**

| Action | Directory | Command |
|---|---|---|
| Create database, tables, and seed data | `backend/` | `npm run db:setup` |
| Start backend (production) | `backend/` | `npm start` |
| Start backend (dev, auto-reload) | `backend/` | `npm run dev` |
| Run automated tests | `backend/` | `npm test` |
| Start frontend dev server | `frontend/` | `npm run dev` |

Backend default port: **5000**. Frontend dev server default port: **5173** (Vite default).

---

## 4. Frontend/Backend Separation Check

**✅ Fully separated.**

| Check | Result | Evidence |
|---|---|---|
| Separate directories | ✅ | `backend/` and `frontend/` with independent `package.json` files |
| Separate `node_modules` | ✅ | Both directories contain their own `node_modules` |
| React never imports `mysql2` | ✅ | `frontend/package.json` lists only `react`, `react-dom`, Vite, and ESLint plugins |
| React has no DB connection code | ✅ | No DB-related code in any `.jsx` file; all data fetched via `fetch()` to `http://localhost:5000/api/...` |
| DB credentials not in frontend | ✅ | No `.env` in `frontend/`; no DB vars in any frontend file |
| Frontend calls Express routes only | ✅ | All 6 fetch calls target `http://localhost:5000/api/auth/login` or `http://localhost:5000/api/bookings` |

**Known limitation:** The API base URL is hardcoded as the literal string `http://localhost:5000` in 6 places across `Login.jsx` (line 20) and `Dashboard.jsx` (lines 32, 65, 66, 100, 293). There is no `vite.config.js`, so a Vite proxy cannot be configured. This forces the CORS middleware to remain active even in development.

---

## 5. Database Setup and Table Summary

### Connection Method

`backend/config/db.js` creates a `mysql2/promise` connection pool. It reads all configuration from environment variables via `dotenv`. The actual `.env` file contains **6 keys**:

| Variable | Configured | Note |
|---|---|---|
| `PORT` | ✅ Yes | Express server port |
| `DB_HOST` | ✅ Yes | MySQL server host |
| `DB_PORT` | ✅ Yes | MySQL server port (3306 by default in code) |
| `DB_USER` | ✅ Yes | MySQL username |
| `DB_PASSWORD` | ✅ Yes | Present — value not printed in this review |
| `DB_NAME` | ✅ Yes | Database name (`c8p2`) |

> **Note:** `DB_PORT` is present in the real `.env` but is **missing** from `.env.example` (the template file). The `.env.example` also has a duplicate file with a leading-space in the filename (`" .env.example"`).

### Tables

| Table | Purpose | Key Columns |
|---|---|---|
| `users` | Stores login credentials and roles | `id`, `username`, `password` (plaintext), `role ENUM('Staff','Coordinator')` |
| `sessions` | Maps tokens to users; acts as auth store | `token VARCHAR(255) PK`, `user_id FK → users.id`, `created_at` |
| `bookings` | All booking records | `id`, `room_name`, `booking_date DATE`, `start_time TIME`, `end_time TIME`, `purpose`, `requester_name`, `user_id FK`, `status ENUM(pending/approved/rejected/cancelled)`, `coordinator_note TEXT NULL`, `created_at`, `updated_at` |

A **`users` / login table exists** — it is the `users` table with a `role` ENUM column.

### How Tables and Seed Data Are Created

1. Edit `backend/.env` with your MySQL credentials.
2. Run `npm run db:setup` from the `backend/` directory.
3. This executes `backend/scripts/dbSetup.js`, which:
   - Connects to MySQL using the env vars (no `DB_NAME` initially so it can create the database).
   - Reads `db/schema.sql` as a UTF-8 string.
   - Splits the SQL on semicolons and executes each statement in sequence.
4. `db/schema.sql` creates the database `c8p2` if it does not exist, creates all three tables with `CREATE TABLE IF NOT EXISTS`, and inserts seed users and bookings using `INSERT IGNORE` (so re-running is safe without duplicating seeds).

**Seed users:** `alice_staff` (Staff), `bob_staff` (Staff), `charlie_coord` (Coordinator). All with password `password123` (plaintext).  
**Seed bookings:** 3 records — one `approved` with a note (Conference Room A), one `pending` (Meeting Room B), one `rejected` with a note (Board Room).

---

## 6. Login and Role/Access Explanation

### How the Two Roles Log In

Both roles use the **same login form and the same endpoint** (`POST /api/auth/login`). The role is determined by which user account is used.

1. User submits `username` + `password` via `Login.jsx` → `POST /api/auth/login`.
2. Backend queries: `SELECT id, username, role FROM users WHERE username = ? AND password = ?` (plaintext comparison).
3. If matched, a 48-character random hex token is generated with `crypto.randomBytes(24)` and inserted into the `sessions` table.
4. The response returns `{ token, id, username, role }`.
5. The frontend stores this in `localStorage` under the key `rb_user` and passes the user object down as props.
6. Every subsequent API call includes `Authorization: Bearer <token>`.

### How Roles Are Checked

The `authenticateToken` middleware in `backend/middleware/auth.js` runs on **every** request to `/api/bookings`:

```
Authorization header → extract token → JOIN sessions + users WHERE token = ? → populate req.user = { id, username, role }
```

The role comes **from the database**, not from any client-supplied header or cookie. The automated test explicitly confirms that injecting `x-user-role: Coordinator` in the request headers does not grant coordinator privileges — the backend resolves identity from the DB session only.

### Ownership / Record Scoping

| Action | Staff | Coordinator |
|---|---|---|
| GET /api/bookings | Only own records (`AND user_id = req.user.id`) | All records (no filter) |
| PUT /:id (edit) | Only own records AND status = 'pending' | Allowed for any booking |
| PATCH /:id/status with `cancelled` | Only own records AND status = 'pending' | Allowed for any booking |
| PATCH /:id/status with `approved`/`rejected` | ❌ 403 Forbidden | ✅ Allowed |

---

## 7. Protected Action Explanation

**Protected action: Approve or reject a room booking and write a coordinator note.**

This action is protected at the backend route level, independent of the UI.

| Layer | Mechanism | Location |
|---|---|---|
| Authentication | `authenticateToken` middleware — all booking routes require a valid session token | `bookingRoutes.js` line 8: `router.use(authenticateToken)` |
| Role check | `if (req.user.role !== 'Coordinator') return res.status(403)` for `approved`/`rejected` statuses | `bookingRoutes.js` lines 184–188 |
| Overlap re-check on approve | SQL overlap query run again before setting status to `approved`; returns 409 if conflict | `bookingRoutes.js` lines 192–206 |
| Note stored | `UPDATE bookings SET status = ?, coordinator_note = ?` | `bookingRoutes.js` lines 210–213 |
| UI enforcement | Approve/Reject buttons only rendered for `user.role === 'Coordinator'` | `Dashboard.jsx` line 243 |

**Automated test evidence:** `api.test.js` step 4 — staff token sent with `{ status: 'approved' }` → confirmed 403. Step 6 — coordinator token sent → confirmed 200 and note persisted in DB.

---

## 8. Validation Summary

| Rule | Frontend (BookingForm.jsx) | Backend (bookingRoutes.js / validation.js) |
|---|---|---|
| All 6 booking fields required | ✅ Line 38: empty/whitespace check | ✅ `validateRequiredFields` utility |
| Booking date not in past | ✅ Line 44: compared to `today` | ✅ `isDateInPast` utility — returns 400 |
| Start time strictly before end time | ✅ Line 49: `startTime >= endTime` | ✅ `isInvalidTimeRange` utility — returns 400 |
| Room conflict on create | ❌ Not on frontend | ✅ SQL overlap query — returns 409 |
| Room conflict on edit (PUT) | ❌ Not on frontend | ❌ **Not implemented in PUT route** |
| Room conflict on approve (PATCH) | ❌ Not on frontend | ✅ SQL overlap query — returns 409 |
| Valid status value on PATCH | ❌ Not explicitly on frontend | ✅ Checked against allowlist — returns 400 |
| Login fields required | ✅ Login.jsx line 11 | ✅ `validateRequiredFields` in authRoutes.js |
| SQL injection prevention | N/A | ✅ All queries use `?` parameterised placeholders |

**Known gap:** The PUT (edit) route applies no overlap check. A staff member can update a pending booking to overlap an approved slot, and the conflict will not be rejected until a coordinator tries to approve — at which point the approval-time overlap check will catch it (409).

---

## 9. Automated and Manual Testing Summary

### Automated Tests

**Command:** `npm test` (from `backend/` directory)  
**Runner:** Custom Node.js script — `backend/tests/api.test.js`  
**Framework:** None (plain Node `fetch` + `mysql2/promise`; no Jest, Mocha, or similar)  
**Server:** Test file sets `process.env.PORT = '5001'` and `require`s `server.js` to start Express on a separate port, avoiding collision with a running dev server.

**What the test checks (15 assertions):**

| Step | What Is Tested | Pass Condition |
|---|---|---|
| 1 | Cleanup & seeding of isolated test data | `TEST_` prefix users, bookings inserted |
| 2a | Staff login | Status 200, token in response |
| 2b | Coordinator login | Status 200, token in response |
| 2c | Invalid password | Status 401 |
| 3a | Past date booking creation | Status 400 |
| 3b | End time before start time | Status 400 |
| 3c | Valid booking creation | Status 201, ID returned |
| 4a | Missing auth token | Status 401 |
| 4b | Staff trying to approve (protected action) | Status 403 |
| 4c | Header/role spoofing (x-user-role, x-user-id) | Staff still sees only own records |
| 4d | Staff editing another user's booking | Status 403 |
| 5a | Filter by room name | All returned records match room filter |
| 5b | Filter by date | All returned records match date filter |
| 5c | Filter by status | All returned records match status filter |
| 6 | Coordinator approves booking with note | Status 200; note and status verified in DB via GET |
| 6.5a | Overlapping booking creation | Status 409 |
| 6.5b | Staff updates pending booking to overlapping slot | Status 200 (pending — allowed) |
| 6.5c | Coordinator tries to approve overlapping booking | Status 409 |
| Cleanup | All `TEST_*` records deleted from sessions, bookings, users | `finally` block always runs |

**Test data isolation:** All test users are prefixed `TEST_`, all test rooms prefixed `TEST_`. Cleanup uses `DELETE WHERE username LIKE 'TEST_%'` and `DELETE WHERE room_name LIKE 'TEST_%' OR requester_name LIKE 'TEST_%'`. Cleanup runs in `finally` so it executes even on test failure.

**What is not automated:**
- Frontend rendering and UI interactions (no Playwright, Cypress, or React Testing Library).
- Login page UI validation.
- Session persistence across page reload.
- Coordinator note input and button interaction in the UI.
- Filter UI behaviour.
- No test report file is generated; results are stdout only.

---

## 10. Stage 11 Change Summary

The MID_REVIEW.md (recorded after Stage 7 — secondary feature) documented the following as missing. The table below shows what changed after that point:

| Issue from Mid-Review | Status at Final Review | Evidence |
|---|---|---|
| No automated tests of any kind | ✅ **Resolved** | `backend/tests/api.test.js` — 15+ assertions; `npm test` script added to `backend/package.json` |
| PUT route missing overlap check | ❌ **Still open** | `bookingRoutes.js` PUT handler still has no overlap query |
| No `.gitignore` | ❌ **Still open** | No `.gitignore` found in project root or backend/frontend directories |
| CORS fully open | ❌ **Still open** | `server.js` line 8: `app.use(cors())` — no origin restriction |
| Plaintext passwords | ❌ **Still open** | `authRoutes.js` line 16: plaintext WHERE clause; no bcrypt |
| No session expiry or logout endpoint | ❌ **Still open** | No `expires_at` column in `sessions`; no DELETE endpoint in `authRoutes.js` |
| API URL hardcoded in 6 places | ❌ **Still open** | All 6 occurrences in `Login.jsx` and `Dashboard.jsx` remain |
| No `vite.config.js` | ❌ **Still open** | `frontend/` root still has no Vite config file |
| Inline cancel duplicates fetch | ❌ **Still open** | `Dashboard.jsx` lines 290–311 still contain a separate inline fetch |
| Alert messages not auto-dismissed | ❌ **Still open** | No timeout clearing in `Dashboard.jsx` |
| `.env.example` missing `DB_PORT` | ❌ **Still open** | `.env.example` confirmed to have 5 keys, not including `DB_PORT` |

**What was added after the mid-review stage:**
- `backend/tests/api.test.js` — comprehensive integration test suite.
- `"test": "node tests/api.test.js"` script added to `backend/package.json`.

---

## 11. Stage Drift and Early Work

No evidence of work implemented ahead of its expected stage. The project is appropriately scoped:

| Area | Finding |
|---|---|
| Testing | `api.test.js` present — consistent with post-Stage 7 testing stage |
| Security hardening (bcrypt, helmet, rate limiting) | Not implemented — this is the main remaining gap, expected to be a later hardening stage that was not completed |
| Pagination | Not present — not required by case brief |
| Email/notification | Not present — not in scope |
| Role management UI | Not present — not in scope |
| Audit log table | Not present — not in scope |
| Frontend tests | Not present — no Cypress, Playwright, or React Testing Library configured |

No future-stage work was detected. The only drift concern is that several mid-review-identified issues (password hashing, CORS, session expiry, `.gitignore`) remain unresolved, suggesting the security hardening stage items were not applied.

---

## 12. Security Risks and Exposed-Secret Check

> Secrets are **not printed** in this review. The following describes risk categories only.

| Risk | Severity | File | Detail |
|---|---|---|---|
| Plaintext password storage and comparison | 🔴 Critical | `db/schema.sql`, `authRoutes.js` | Passwords are seeded and compared without hashing. Any direct read of the `users` table exposes all credentials. |
| `.env` likely committable to git | 🔴 Critical | Project root | No `.gitignore` was found at any level of the project. If this is inside a git repository, `backend/.env` containing DB credentials could be committed and pushed. |
| No session expiry | 🟠 High | `db/schema.sql` sessions table | The `sessions` table has no `expires_at` column. A stolen or leaked token remains valid indefinitely until manually deleted from the DB. |
| No server-side logout | 🟠 High | `authRoutes.js` | The logout action in `App.jsx` only clears `localStorage`. The session token is not deleted from the `sessions` table, so it continues to authenticate API calls. |
| Open CORS | 🟠 High | `server.js` line 8 | `cors()` with no `origin` option allows any website to make authenticated API requests, enabling cross-site request forgery from any origin. |
| API URL hardcoded in frontend | 🟡 Medium | `Login.jsx` L20; `Dashboard.jsx` L32, 65, 66, 100, 293 | Not a direct secret exposure, but reduces portability and makes environment management error-prone. |
| `requester_name` is free text | 🟡 Medium | `BookingForm.jsx`, `bookingRoutes.js` | A Staff user can enter any name as the requester. The booking's `user_id` is always set correctly from `req.user.id`, but the displayed name is unverified. |
| `.env.example` has leading-space duplicate | 🟢 Low | `backend/` | A file named `" .env.example"` (with a leading space) exists alongside the real `.env.example`. This is a cosmetic issue but could confuse developers. |

---

## 13. Documentation/Code Mismatches

| # | Mismatch |
|---|---|
| D-1 | `.env.example` lists `DB_NAME=room_booking_db` but the actual `backend/.env` and `db/schema.sql` use `DB_NAME=c8p2`. A new developer following `.env.example` would point to a nonexistent database. |
| D-2 | `.env.example` omits `DB_PORT` entirely, but `config/db.js` and `scripts/dbSetup.js` both read `process.env.DB_PORT`. The code works (falls back to `3306`) but the template is incomplete. |
| D-3 | The `MID_REVIEW.md` `Pass/Fail` table states "No future stages implemented early," which is consistent. The mid-review correctly identified all gaps that remain open at the final stage. No mismatch between mid-review findings and current code state. |
| D-4 | The `MID_REVIEW.md` lists `Testing evidence` with a score of 0 for all columns and states "No unit tests, integration tests, or test runner configured in either package.json." The final project has `api.test.js` and the `test` script, confirming this was added after the mid-review, consistent with the staged development model. |

---

## 14. Known Limitations

| # | Limitation | Impact |
|---|---|---|
| L-1 | **Plaintext passwords** — no bcrypt or any hashing | Critical security gap for any non-workshop use |
| L-2 | **No `.gitignore`** — `backend/.env` is at risk of being committed | DB credentials exposed if code is pushed to a remote repository |
| L-3 | **No session expiry or server-side logout** — tokens are permanent | Stolen tokens remain valid indefinitely |
| L-4 | **CORS fully open** — any origin can call the API | Enables cross-site requests from any website |
| L-5 | **PUT (edit) route has no overlap check** — a staff edit can silently produce a time conflict | Conflict only caught at approval time; poor UX and data integrity risk |
| L-6 | **API URL hardcoded in 6 places** — `http://localhost:5000` | Breaking change if port or host changes; requires 6 edits |
| L-7 | **No `vite.config.js`** — Vite proxy cannot be configured | CORS dependency cannot be removed in development |
| L-8 | **`requester_name` is free text** — not auto-filled from authenticated user | A staff member can create a booking under any name |
| L-9 | **No frontend tests** — no UI automation | All frontend validation and rendering verified manually only |
| L-10 | **No test framework** (Jest/Mocha) — test suite is a custom Node script | No standard test reporting, no watch mode, no CI integration |
| L-11 | **No server-side pagination** — all matching bookings returned in one query | Acceptable at workshop scale; would fail with large datasets |
| L-12 | **Alert messages not auto-dismissed** — error/success banners remain until next action | Minor UX friction |
| L-13 | **Coordinator cannot create bookings via UI** — "Book a Room" button hidden for Coordinators | Whether Coordinators should be able to create bookings is ambiguous in the case brief; backend does not block it |
| L-14 | **`dbSetup.js` semicolon-split is fragile** — may fail on some SQL constructs | Low risk for the current schema but could break if schema gains stored procedures or triggers |
| L-15 | **`.env.example` incomplete and duplicated** — missing `DB_PORT`; leading-space duplicate file | New developer setup confusion |

---

## 15. Demo Script

> Assumes both servers are running: `npm run dev` in `backend/` (port 5000) and `npm run dev` in `frontend/` (port 5173).

### Step 1 — Run database setup
```
cd backend
npm run db:setup
```
Confirm: "Database schema and seed data loaded successfully!"

### Step 2 — Login as Staff (alice_staff)
- Open `http://localhost:5173` in a browser.
- Log in with `alice_staff` / `password123`.
- **Observe:** Only Alice's own bookings are shown (Conference Room A — approved; Board Room — rejected).
- **Observe:** No Approve/Reject buttons visible; only Edit (disabled for non-pending) and Cancel (disabled for non-pending) buttons.

### Step 3 — Create a new booking (Staff)
- Click **"+ Book a Room"**.
- Enter: Room = `Demo Room`, Date = a future date, Start = `10:00`, End = `11:00`, Purpose = `Demo meeting`, Name = `Alice`.
- Click **Submit Request**.
- **Observe:** New row appears with status `pending`.

### Step 4 — Try to create a conflicting booking (Staff)
- Click **"+ Book a Room"** again.
- Enter the same room, date, and overlapping times (e.g., `10:30`–`11:30`).
- **Observe:** Error message "Conflict: The room is already booked for this time range" — **but only after the first booking is approved**. At creation time, only approved bookings trigger the conflict check.

### Step 5 — Login as Coordinator (charlie_coord)
- Logout, then log in with `charlie_coord` / `password123`.
- **Observe:** All bookings from all users are visible.
- **Observe:** Approve/Reject buttons and note input appear for each booking.

### Step 6 — Approve the new pending booking with a note
- Find the `Demo Room` / `pending` booking.
- Type a note: `Approved for demo session`.
- Click **Approve**.
- **Observe:** Status changes to `approved`; note displayed in the Coordinator Note column.

### Step 7 — Reject a booking
- Find another pending booking.
- Type: `Room not available`.
- Click **Reject**.
- **Observe:** Status changes to `rejected`; note displayed.

### Step 8 — Test filter
- In the Filter row, type `Demo` in Search Room.
- **Observe:** Only the Demo Room booking appears.
- Click **Clear Filters** to restore all.

### Step 9 — Attempt to approve an overlapping booking (conflict check)
- Create a second booking for the same room/date that overlaps the approved one.
- As coordinator, try to approve it.
- **Observe:** 409 Conflict error — "Overlaps with an already approved booking."

### Step 10 — Run automated tests
```
cd backend
npm test
```
**Observe:** 15 checks run sequentially; console shows ✔ for each passing assertion; "ALL TESTS PASSED SUCCESSFULLY!" printed; test records cleaned up.

---

## 16. Suggested Viva Questions

### Architecture and Separation

1. Why are the React frontend and Express backend in separate directories with their own `package.json` files? What would break if React imported `mysql2` directly?
2. The frontend calls `http://localhost:5000/api/bookings` using the native `fetch` API. Why is this hardcoded string a problem, and how would you fix it using a Vite proxy?
3. What is the role of the `cors()` middleware in `server.js`, and why is calling it with no arguments a security concern in a production environment?

### Database and Session Management

4. Look at `db/schema.sql` line 35. Why does the seed INSERT use `INSERT IGNORE` instead of `INSERT`? What happens if you run `npm run db:setup` a second time?
5. The `sessions` table has a `token` column as the primary key and a `created_at` column, but no `expires_at` column. What risk does this create, and what would you add to fix it?
6. How does the `authenticateToken` middleware in `auth.js` know which user is making a request? What SQL join does it perform, and why is it more secure than reading the role from the request headers?

### Role-Based Access Control

7. Open `bookingRoutes.js`. Find the line that prevents a Staff member from approving a booking. What HTTP status code is returned, and where exactly is the check in the file?
8. A user sends `GET /api/bookings` with a valid Staff token but also includes the header `x-user-role: Coordinator`. Will they see all bookings or only their own? Prove it by pointing to the middleware code.
9. The `user_id` column in the `bookings` table is always set to `req.user.id` on creation (line 82 of `bookingRoutes.js`). Why is this important even though the frontend also sends the form data?

### Conflict Detection

10. Explain the overlap detection SQL query in the POST route. Why does it only check against bookings with status `approved` and not all bookings? What is the consequence of this design decision?
11. The PUT (edit booking) route does not run an overlap check. Describe exactly what sequence of actions a Staff member could take that would result in an approved conflict, and what would happen when the coordinator tries to approve the second booking.

### Validation and Testing

12. Validation is present on both the frontend (`BookingForm.jsx`) and the backend (`bookingRoutes.js`). Why is frontend validation alone insufficient? Give a specific example of how backend validation provides protection that frontend validation cannot.
13. The test file in `api.test.js` uses the naming prefix `TEST_` for all test users, rooms, and requester names. What is the purpose of this convention, and how does the cleanup code use it?
14. The test suite starts a second Express server on port 5001 (`process.env.PORT = '5001'`). Why is this done instead of using the already-running dev server on port 5000?

### Security

15. The `authRoutes.js` login query is `SELECT ... WHERE username = ? AND password = ?`. This uses parameterised queries, so SQL injection is prevented. What other security problem remains with this comparison, and what Node.js library would you use to fix it?
16. There is no `.gitignore` file in the project. What specific file would be exposed if this project were pushed to a public GitHub repository, and what information does that file contain?
17. Look at `App.jsx` `handleLogout`. It removes `rb_user` from `localStorage`. After logout, is the session token still usable to call `GET /api/bookings` directly from Postman? Why or why not?
