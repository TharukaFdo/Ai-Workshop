# FINAL_REVIEW.md — Room Booking System

**Case:** 8 — Room Booking System  
**Review Stage:** Final (after Stage 11: testing, security hardening, maintainability cleanup, and change request)  
**Review Date:** 2026-06-14  
**Reviewer:** Antigravity AI (automated code review — evidence inspected directly from source files)  
**Stack:** React 19 (Vite 8) · Node.js/Express 4 · MySQL (mysql2/promise)

---

## 1. Final Feature Summary

The Room Booking System is a functional, full-stack workshop application that delivers the complete booking lifecycle described in the Case Brief. The following table summarises the final state of every required feature, verified directly against source files.

| Feature | Implemented | Evidence Location |
|---|---|---|
| Staff creates a room booking (room, date, start/end time, purpose) | ✅ Yes | `server/index.js` L70–117 · `client/src/App.jsx` L84–105 |
| Staff views their own bookings only | ✅ Yes | `server/index.js` L55–58 (DB-level filter by `staff_name`) |
| Coordinator views all bookings | ✅ Yes | `server/index.js` L52–58 (no WHERE clause for coordinator) |
| Coordinator approves a booking with note | ✅ Yes | `server/index.js` L120–183 · `client/src/App.jsx` L388–393 |
| Coordinator rejects a booking with note | ✅ Yes | Same route; status validated against ENUM |
| Coordinator note persisted and displayed to staff | ✅ Yes | `bookings.notes` TEXT; UI callout in `App.jsx` L364–368 |
| Time-conflict detection on booking creation | ✅ Yes | `server/index.js` L93–105 (overlap SQL check) |
| Time-conflict detection on coordinator approval | ✅ Yes | `server/index.js` L145–168 (secondary overlap check) |
| Start time before end time validation | ✅ Yes | `server/index.js` L78–80 |
| Filter by room name | ✅ Yes | `client/src/App.jsx` L132 (client-side, partial match) |
| Filter by date | ✅ Yes | `client/src/App.jsx` L133 (client-side, startsWith) |
| Filter by status | ✅ Yes | `client/src/App.jsx` L134 (client-side, exact match) |
| Staff edit own booking | ❌ Not implemented | No `PUT /api/bookings/:id` (edit fields) route or UI |
| Staff cancel own booking | ❌ Not implemented | No cancel route or UI button for staff |
| Past-date validation | ❌ Not implemented | No date-in-the-future check in backend |
| Password hashing | ❌ Not implemented | Passwords stored and compared as plain text |
| JWT / session token | ❌ Not implemented | `userId` trusted from client request body/query with no signature |
| Automated test suite | ✅ Yes | `server/app.test.js` — 7 Jest/Supertest tests |

---

## 2. Review Scoring Matrix — Final Stage

Scores reflect the completed project after testing, security hardening, maintainability cleanup, and the Stage 11 change request (conflict detection added). The Testing Evidence column scores: automated tests implemented, manual checks documented, test data cleanup, and reported results.

| Feature / Area | Functionality 0–5 | Data Persistence 0–5 | Backend Security / Role Control 0–5 | Validation / Error Handling 0–5 | Testing Evidence 0–5 | Maintainability 0–5 | UI / Manual Usability 0–5 | Evidence | Notes |
|---|---:|---:|---:|---:|---:|---:|---:|---|---|
| Project setup and run commands | 4 | 5 | — | — | 2 | 3 | — | `server/package.json`: `start`, `dev`, `seed`, `test`; `client/package.json`: `dev`, `build`. | No root orchestration script; requires two terminals. Test command documented in `package.json`. |
| Database setup and starter data | 5 | 5 | — | 4 | 4 | 4 | — | `server/init-db.js`: `CREATE DATABASE IF NOT EXISTS`, `CREATE TABLE IF NOT EXISTS`, TRUNCATE + re-seed. 4 users, 4 bookings across all three statuses. | Idempotent and repeatable via `npm run seed`. Test suite uses its own `beforeAll`/`afterAll` TRUNCATE cycle — clean teardown confirmed in `app.test.js` L11–38. |
| Login workflow | 4 | 4 | 2 | 3 | 4 | 3 | 4 | `server/index.js` L17–35: `POST /api/login` queries `users` table. Test 1 covers success (200 + role) and failure (401). | DB-backed login — confirmed working by automated test. Passwords plain text; no JWT issued after login. `userId` trusted from client on subsequent calls. |
| Role-based access | 4 | — | 4 | 3 | 4 | 3 | 4 | `GET /api/bookings` and `PUT /api/bookings/:id/status` both re-query `users` for role. Staff filtered at DB layer. Test 3 (staff sees own only) and Test 4 (staff 403 on approve). | Role lookup is DB-backed on every call (correct). `userId` not cryptographically signed — impersonation is theoretically possible. No middleware abstraction; checks are inline per route. |
| Main create action | 4 | 5 | 3 | 4 | 4 | 3 | 4 | `POST /api/bookings` L70–117: required-field check (400), time order check (400), conflict overlap check (409), staff_name derived server-side, status hardcoded to `pending`. Test 2, Test 6, Test 7. | Staff name is server-side derived — cannot be spoofed by form. No coordinator-only guard on create (both roles can submit); no past-date guard. Three automated tests cover create, invalid time, and conflict. |
| Main view/list action | 4 | 5 | 4 | 3 | 3 | 3 | 4 | `GET /api/bookings?userId=...` — DB-backed role filter. Test 3 confirms staff isolation. No automated test for coordinator-sees-all path. | Client-side filter applied after full fetch. No server-side pagination. Test 3 is automated; coordinator list path is manual only. |
| Main update/status/cancel action | 1 | 1 | 1 | 1 | 0 | 1 | 1 | No `PUT /api/bookings/:id` (edit booking fields) route. No staff cancel route or UI button. | Staff edit/cancel remains unimplemented at Final stage. This is a documented known limitation. No test covers this path because it does not exist. |
| Protected action | 5 | 5 | 5 | 4 | 5 | 3 | 4 | `PUT /api/bookings/:id/status` L120–183: 401 (no userId), 400 (invalid status), DB role lookup, 403 (not coordinator), 409 (conflict on approve), 404 (booking not found), 200 on success. Tests 4 and 5. | Most robustly implemented route. Test 4 confirms staff 403; Test 5 confirms coordinator approval + note persistence verified by direct DB query. Conflict guard on approval added in Stage 11. |
| Secondary feature | 4 | — | — | 2 | 2 | 3 | 4 | Client-side filter by room (partial), date (startsWith), status (exact). Clear button resets all. | Filter is client-side only — all records fetched then filtered in browser. No automated test for filter logic. Manual verification only. |
| Case-specific: room/date/time booking details and conflict awareness | 4 | 5 | — | 4 | 5 | 3 | 4 | `bookings` table: `room_name VARCHAR(100)`, `booking_date DATE`, `start_time TIME`, `end_time TIME`, `purpose TEXT`. Overlap SQL: `start_time < ? AND end_time > ?` for both create and approval. Test 7 validates conflict rejection (409). | Start-before-end enforced (Test 6). Overlap checked against `approved` bookings only on create; same check on approval (Test 5 implicitly). No past-date guard. No room-name length enforcement in backend. |
| Case-specific: booking approval/rejection status with coordinator note | 5 | 5 | 5 | 4 | 5 | 3 | 4 | Status ENUM `('pending','approved','rejected')`. `notes TEXT` updated atomically with status. Notes displayed as callout to staff. Test 5 verifies DB value of `notes` after coordinator approval. | Status validated server-side against ENUM list (400 on invalid). Note persisted and verified in automated test via direct DB query. No audit history — notes overwritten on each action. |
| Case-specific: staff ownership and coordinator-only status changes | 5 | 5 | 5 | 4 | 5 | 3 | 4 | `staff_name` derived server-side. `GET /api/bookings` filters by `staff_name` for staff role. `PUT` route returns 403 for non-coordinator. Tests 3 and 4 directly verify both constraints. | Staff name cannot be forged by the client (derived from DB via userId). Staff scope isolation and coordinator-only gate are both tested automatically. |
| UI / manual usability | 3 | — | — | 2 | 0 | 2 | 3 | Login form, booking form (staff), filter bar, booking cards with status badge and coordinator action panel present. Inline styles dominate. | `index.html` title still reads `"client"`. `App.css` is default Vite scaffold (dead CSS). No loading spinners or user-facing error toasts on API failure. Demo credentials shown in plain text on login screen. |
| Security posture | 2 | — | 2 | 2 | 1 | 2 | — | `.env` used for DB config. Backend role checks DB-backed. CORS unrestricted. Passwords plain text. No JWT/session token. No server-side `.gitignore` for `.env`. | Wide-open CORS, plain-text passwords, no auth token are the three primary risks. `server/.env` has no `.gitignore` entry — risk of accidental commit. Expected workshop trade-offs but important to name. |
| Testing evidence | 4 | — | — | — | 4 | 3 | — | `server/app.test.js`: 7 Jest/Supertest tests. `beforeAll` TRUNCATE + seed; `afterAll` TRUNCATE + `db.end()`. Command: `cd server && npm test`. | 7 automated tests cover: login success/fail, create booking, staff view isolation, staff 403, coordinator approve + note, invalid time (400), conflict (409). No test for coordinator list, filter, or staff edit/cancel (latter does not exist). |
| Maintainability | 2 | — | — | — | — | 2 | — | Server: `index.js` 193 lines (all routes in one file). Client: `App.jsx` 420 lines (all state, handlers, JSX in one component). ESLint config present. | No route splitting, service layer, custom hooks, or component decomposition. No TypeScript. No inline comments beyond brief labels. Adequate for workshop scale; would need refactoring for production. |

---

## 3. Project Structure and Run Commands

```
p1/
├── Case_Brief.md
├── MID_REVIEW.md
├── FINAL_REVIEW.md           ← this document
├── client/                   ← React 19 / Vite 8 SPA
│   ├── index.html            (title still reads "client" — not updated)
│   ├── vite.config.js
│   ├── package.json
│   ├── eslint.config.js
│   ├── .gitignore            (covers node_modules, dist — does NOT cover .env)
│   └── src/
│       ├── main.jsx
│       ├── App.jsx           (420 lines — all logic in one file)
│       ├── App.css           (default Vite scaffold CSS — unused in app)
│       └── index.css
└── server/                   ← Node.js / Express API
    ├── .env                  (DB config — NO .gitignore protection)
    ├── db.js                 (mysql2/promise pool)
    ├── index.js              (193 lines — all routes in one file)
    ├── init-db.js            (DB create + table create + seed)
    ├── app.test.js           (7 Jest/Supertest tests)
    └── package.json
```

### Run Commands

```bash
# Terminal 1 — seed database and start API server
cd server
npm install          # first time only
npm run seed         # creates DB, tables, and seed data
npm run dev          # starts Express on port 5000

# Terminal 2 — start React dev server
cd client
npm install          # first time only
npm run dev          # starts Vite on http://localhost:5173

# Run automated tests (API server must NOT be running on port 5000)
cd server
npm test             # jest --runInBand --forceExit
```

> **Note:** There is no root-level `package.json` or orchestration helper. Two separate terminals are required. No `docker-compose.yml` or `.env.example` exists.

---

## 4. Frontend / Backend Separation Check

| Check | Result | Evidence |
|---|---|---|
| React and Express are in separate directories | ✅ Pass | `client/` and `server/` are distinct; no cross-imports |
| React calls Express routes via `fetch()` | ✅ Pass | All API calls in `App.jsx` target `http://localhost:5000/api/*` |
| React never imports or connects to MySQL directly | ✅ Pass | `client/package.json` has no `mysql2` dependency; no DB import in any client file |
| DB credentials exist only in `server/.env` | ✅ Pass | `server/db.js` reads from `process.env.*`; no `VITE_DB_*` vars in `vite.config.js` |
| Vite does not proxy API calls | ✅ Noted | No Vite proxy configured; `fetch` calls use hardcoded `localhost:5000`. Works for local dev only. |

**Verdict:** React and Express are correctly separated. The browser application never touches MySQL directly.

---

## 5. Database Setup and Table Summary

### Connection Method

`server/db.js` creates a `mysql2/promise` connection pool. All five required environment variables are read from `server/.env`.

| Env Variable | Configured | Value (sensitive values not printed) |
|---|---|---|
| `DB_HOST` | ✅ Yes | `localhost` |
| `DB_PORT` | ✅ Yes | `3306` |
| `DB_USER` | ✅ Yes | `root` |
| `DB_PASSWORD` | ✅ Yes | Set in `.env` (empty string — works for no-auth MySQL installs only) |
| `DB_NAME` | ✅ Yes | `c8p1` |

Each variable has a hardcoded fallback in `db.js` (e.g., `process.env.DB_HOST || 'localhost'`). The password fallback is an empty string.

### Tables

| Table | Present | Columns | Notes |
|---|---|---|---|
| `users` | ✅ `CREATE TABLE IF NOT EXISTS users` | `id`, `username` (UNIQUE), `password` (plain text), `role` ENUM('staff','coordinator'), `created_at` | Login table. Passwords stored unhashed. |
| `bookings` | ✅ `CREATE TABLE IF NOT EXISTS bookings` | `id`, `room_name`, `booking_date` DATE, `start_time` TIME, `end_time` TIME, `purpose` TEXT, `staff_name`, `status` ENUM('pending','approved','rejected'), `notes` TEXT, `created_at` | No FK from `staff_name` to `users.username`. |

**Foreign key between `bookings.staff_name` and `users.username`:** ❌ Not defined. `staff_name` is a VARCHAR copy derived server-side from `username` at insert time. Historical bookings would not auto-update if a username changed.

### How to Recreate Tables and Seed Data

```bash
cd server
npm run seed   # runs: node init-db.js
```

`init-db.js` performs in order:
1. `CREATE DATABASE IF NOT EXISTS c8p1`
2. `CREATE TABLE IF NOT EXISTS users` (safe re-run)
3. `CREATE TABLE IF NOT EXISTS bookings` (safe re-run)
4. `TRUNCATE TABLE bookings` (clears data)
5. `TRUNCATE TABLE users` (clears data)
6. Inserts 4 users: `alice`, `bob`, `charlie` (staff) and `admin` (coordinator)
7. Inserts 4 bookings across 2 dates with all three statuses

The script is **idempotent** — it can be run multiple times safely.

### Seed Data Credentials

| Username | Password | Role |
|---|---|---|
| alice | password123 | staff |
| bob | password123 | staff |
| charlie | password123 | staff |
| admin | admin123 | coordinator |

---

## 6. Login and Role / Access Explanation

### How Login Works

1. User enters username and password in the React form.
2. React sends `POST /api/login` with `{ username, password }`.
3. Express queries `SELECT id, username, role FROM users WHERE username = ? AND password = ?`.
4. If a row is returned, the user object `{ id, username, role }` is sent back and stored in React `useState`.
5. If no row matches, a 401 response is returned and the login error message is shown.

Login is **database-backed** — not a mock or role-selector. Passwords are compared in plain text (no hashing).

### How Roles Are Checked

After login, the `user.id` is included in every API call. The backend **re-queries the `users` table on every protected call** to get the current role:

- `GET /api/bookings?userId=...` → re-queries for `username, role`; applies `WHERE staff_name = username` for staff, no filter for coordinator.
- `PUT /api/bookings/:id/status` (body: `userId`) → re-queries for `role`; returns 403 if role ≠ `'coordinator'`.

**Risk:** The `userId` is sent by the client in the query string or request body with no cryptographic signature. A malicious client could forge a different `userId` to impersonate another user. A JWT or server-side session was not implemented.

### Access Isolation

| Action | Staff | Coordinator |
|---|---|---|
| View own bookings | ✅ Backend-enforced | N/A |
| View all bookings | ❌ Blocked at DB layer | ✅ Yes |
| Create booking | ✅ Yes (staff_name auto-assigned) | ✅ Yes (no role guard on create) |
| Approve / reject booking | ❌ 403 returned | ✅ Yes |
| Edit / cancel own booking | ❌ Not implemented | N/A |

---

## 7. Protected Action Explanation

**Protected action:** Approve or reject a room booking and record a coordinator note.  
**Route:** `PUT /api/bookings/:id/status`  
**Constraint:** Only users with `role = 'coordinator'` in the database may call this route.

### How it is enforced

```
Request arrives with: { userId, status, notes }
  │
  ├─ [401] if userId is missing
  ├─ [400] if status not in ['pending','approved','rejected']
  ├─ SELECT role FROM users WHERE id = userId
  │     └─ [403] if userRows.length === 0 (invalid user)
  │     └─ [403] if role !== 'coordinator'
  ├─ if status === 'approved': run overlap conflict check
  │     └─ [409] if another approved booking overlaps on same room/date/time
  ├─ UPDATE bookings SET status = ?, notes = ? WHERE id = ?
  │     └─ [404] if affectedRows === 0
  └─ [200] success
```

- **Backend enforcement:** ✅ Confirmed — DB role check, returns 403 for staff.
- **UI enforcement:** ✅ The approve/reject controls render only when `user.role === 'coordinator'` (React conditional).
- **Automated test:** ✅ Test 4 sends `userId` of a staff user and expects 403. Test 5 sends coordinator userId, expects 200, and verifies the note in the DB via direct query.

---

## 8. Validation Summary

| Validation Point | Location | Status |
|---|---|---|
| Login: username and password required | Backend | ✅ `if (!username \|\| !password)` → 400 |
| Create booking: all 6 fields required | Backend | ✅ Combined required-field check → 400 |
| Create: start_time must be before end_time | Backend | ✅ `if (start_time >= end_time)` → 400 |
| Create: no overlap with approved bookings | Backend | ✅ SQL overlap check → 409 |
| Status update: userId required | Backend | ✅ → 401 |
| Status update: valid status value | Backend | ✅ ENUM allowlist check → 400 |
| Status approval: no conflict with existing approved booking | Backend | ✅ Secondary overlap check → 409 |
| Booking date must be in the future | Backend | ❌ Not implemented |
| Room name max length | Backend | ❌ Not enforced beyond DB VARCHAR(100) |
| Purpose max length | Backend | ❌ Not enforced (DB is TEXT, unlimited) |
| HTML5 `required` on form fields | Frontend | ✅ Present on all booking form inputs |
| Login error displayed to user | Frontend | ✅ `loginError` state shown |
| Booking / status update error shown to user | Frontend | ❌ Only `console.error` — no user-facing error toast |

---

## 9. Automated and Manual Testing Summary

### Automated Tests

**Command:** `cd server && npm test`  
**Framework:** Jest 30 + Supertest 7  
**Test file:** `server/app.test.js` (154 lines, 7 tests)

| # | Test | Checks | Expected |
|---|---|---|---|
| 1a | `POST /api/login` — correct credentials | HTTP 200, user object, role = 'staff' | ✅ |
| 1b | `POST /api/login` — wrong password | HTTP 401 | ✅ |
| 2 | `POST /api/bookings` — staff creates booking | HTTP 201, bookingId returned | ✅ |
| 3 | `GET /api/bookings` — staff sees only own bookings | HTTP 200, array contains Test Room 101 | ✅ |
| 4 | `PUT /api/bookings/:id/status` — staff cannot approve | HTTP 403 | ✅ |
| 5 | `PUT /api/bookings/:id/status` — coordinator approves with note | HTTP 200 + direct DB query confirms status='approved' and notes value | ✅ |
| 6 | `POST /api/bookings` — invalid time (end before start) | HTTP 400, error contains 'Start time must be before end time' | ✅ |
| 7 | `POST /api/bookings` — overlap with approved booking | HTTP 409, error contains 'Time conflict' | ✅ |

**Test data management:**
- `beforeAll`: TRUNCATE `bookings` and `users`, insert `test_staff` and `test_coord`.
- `afterAll`: TRUNCATE both tables, call `db.end()` to close pool.
- Test data is **isolated from seed data** — the seed data is wiped at test start and restored only by re-running `npm run seed`.

**Coverage gaps (not automated):**
- Coordinator views all bookings (GET with coordinator userId)
- Client-side filter logic (room, date, status)
- Staff edit/cancel of own booking (feature not implemented — no test possible)
- Loading and error states in UI

### Manual Checks (not automated)

The following are manual-only verifications:
1. Start both servers and confirm the login screen renders.
2. Log in as `alice` (staff) — verify only alice's bookings appear.
3. Log in as `bob` (staff) — verify bob sees only his bookings.
4. Log in as `admin` (coordinator) — verify all 4 seed bookings are visible.
5. Approve a pending booking as coordinator, add a note, confirm the status badge and note appear in the staff view.
6. Test the filter bar: filter by room name (partial), date, and status; confirm Clear resets.
7. Attempt to submit a booking with start time after end time — confirm backend 400.
8. Attempt to book an already-approved time slot — confirm backend 409.
9. Attempt `PUT /api/bookings/1/status` with a staff `userId` via curl/Postman — confirm 403.
10. Check browser console for unhandled errors during normal flows.

---

## 10. Stage 11 Change Summary

The Mid Review (`MID_REVIEW.md`) documented three critical gaps. The following were addressed in Stage 11:

| Gap from Mid Review | Stage 11 Action | Proof |
|---|---|---|
| No time-conflict detection on create | **Added** SQL overlap check: `WHERE room_name = ? AND booking_date = ? AND status = 'approved' AND start_time < ? AND end_time > ?` returning 409 | `server/index.js` L93–105 |
| No start_time < end_time validation | **Added** `if (start_time >= end_time)` guard returning 400 | `server/index.js` L78–80 |
| No automated tests | **Added** `server/app.test.js` with 7 Jest/Supertest tests, `beforeAll`/`afterAll` cleanup, and `npm test` script | `server/app.test.js`, `server/package.json` L10 |
| Conflict check also added on coordinator approval | **Added** secondary overlap check before approving, returns 409 | `server/index.js` L144–168 |

Items from the Mid Review that were **not** addressed in Stage 11 (documented as known limitations):
- Plain-text passwords (no bcrypt hashing)
- No JWT / session token
- Staff edit/cancel of own bookings
- Past-date validation
- CORS restriction

---

## 11. Stage Drift and Early Work

### Positive Drift (implemented earlier than required, correct)

| Item | Notes |
|---|---|
| DB-backed login (not a mock) | Implemented from the start — good practice |
| Backend role re-verification on every API call | Introduced before security hardening stage — correct pattern |
| Coordinator note stored per booking | On-scope for main workflow, reasonable |

### Negative Drift (implemented prematurely or out of scope)

None found. The project did not introduce JWT, rate limiting, bcrypt, or other hardening items before their expected stage.

### Items Built Before Their Stage

| Item | Expected Stage | Actually Built | Assessment |
|---|---|---|---|
| DB-backed login | Possibly Stage 3–4 | Stage 1–2 | ✅ Beneficial early delivery |
| Conflict detection on approval | Stage 11 | Stage 11 | ✅ On time |
| Automated tests | Stage 11 | Stage 11 | ✅ On time |

---

## 12. Security Risks and Exposed-Secret Check

| Risk | Severity | Detail |
|---|---|---|
| `server/.env` has no `.gitignore` protection | **High** | The `client/.gitignore` covers `node_modules` and `dist` but does not cover `.env`. There is **no `server/.gitignore`** at all. If this repository is pushed to a public host, the `.env` file (including `DB_HOST`, `DB_PORT`, `DB_USER`, and `DB_PASSWORD`) would be exposed. The password value is not printed here. |
| Plain-text passwords in `users` table | **High** | Passwords stored and compared as literal strings. No bcrypt or any hashing applied. |
| `userId` trusted from client without signing | **High** | The backend accepts `userId` from the request body or query string and uses it to perform a DB lookup for role and username. Any client can send a different `userId` to impersonate another user. No JWT, HMAC-signed cookie, or express-session is used. |
| CORS wide open | **Medium** | `app.use(cors())` allows requests from any origin. Should be restricted to the Vite dev origin (`http://localhost:5173`) at minimum. |
| Demo credentials shown in plain text on login UI | **Low** | `client/src/App.jsx` L171–176 shows `alice / password123` and `admin / admin123` in the login form hint. Acceptable for workshop; must be removed for any real deployment. |
| `DB_PASSWORD` blank | **Low** | Empty-string password works only for no-auth MySQL installs. This is a configuration note, not a secret leakage. The actual value is not printed. |

**No hardcoded secrets were found inside JavaScript source files.** All DB credentials are read from `server/.env` via `dotenv`.

---

## 13. Documentation / Code Mismatches

| Item | Document / Expected | Code / Actual |
|---|---|---|
| `index.html` title | Should read "Room Booking System" | Still reads `"client"` (default Vite scaffold) — `client/index.html` L7 |
| `App.css` content | Should contain application styles | Contains default Vite scaffold styles (`.hero`, `.ticks`, `#next-steps`, etc.) unused by the app |
| `nodemon` dependency category | Should be `devDependencies` | Listed under `dependencies` in `server/package.json` L20 |
| `server/.gitignore` | Should exist and include `.env` | No `server/.gitignore` file present at all |
| Staff edit/cancel | Case Brief implies staff can manage their own bookings | No edit or cancel route or UI exists |
| Past-date bookings | Logically implied by a booking system | No backend validation prevents past-date bookings |
| Foreign key on `staff_name` | Best practice for relational integrity | `staff_name` stored as VARCHAR; no FK to `users.username` |

---

## 14. Known Limitations

1. **No password hashing** — Passwords are plain text in the `users` table and compared directly in SQL. bcrypt is not used.
2. **No JWT or server-side session** — The `userId` sent by the client is trusted without verification. Any client can forge a `userId`.
3. **Staff cannot edit or cancel their own bookings** — No route or UI for staff to modify a pending booking they created.
4. **No past-date validation** — Bookings can be submitted for dates in the past.
5. **CORS is unrestricted** — Any origin can call the API.
6. **Client-side filtering only** — All bookings are fetched from the server and filtered in the browser. Does not scale beyond a small data set.
7. **No loading/error feedback in UI** — API failures produce only `console.error` output; the user sees no toast, alert, or spinner.
8. **`index.html` title is `"client"`** — Default Vite scaffold title was not updated.
9. **`App.css` contains unused Vite scaffold styles** — Dead CSS remains.
10. **No FK between `bookings.staff_name` and `users.username`** — Username changes would orphan historical bookings.
11. **No root-level `package.json` or helper script** — Two terminals required to start the project.
12. **`nodemon` in `dependencies` instead of `devDependencies`** — Will be installed in production environments unnecessarily.
13. **`server/.env` not gitignored** — Risk of accidental credential commit.

---

## 15. Demo Script

> Intended for a live demonstration lasting approximately 8–10 minutes. Open two terminal windows before starting.

### Setup (before demo)

```bash
# Terminal 1
cd server && npm run seed && npm run dev
# Terminal 2
cd client && npm run dev
# Open: http://localhost:5173
```

---

**Step 1 — Login as Staff (alice)**
- Open the login page. Show the login form.
- Enter `alice` / `password123`. Click Sign In.
- Point out: username and role are shown in the header ("alice — staff").
- Show the booking list — only alice's bookings are visible (not bob's or charlie's).
- Show the filter bar. Filter by "Conference Room A" to narrow results. Clear filter.

**Step 2 — Create a New Booking**
- Fill in the "Request a Room" form: Room Name, Date, Start Time, End Time, Purpose.
- Try submitting with End Time before Start Time — show the backend 400 error (check Network tab if UI toast is absent).
- Submit a valid booking. Show the new `pending` badge appearing in the list.

**Step 3 — Attempt Conflicting Booking**
- Submit a second booking for the same room and date with overlapping times.
- After the coordinator approves the first booking (Step 4), attempt the overlap — show 409 in Network tab.

**Step 4 — Login as Coordinator (admin)**
- Log out and log in as `admin` / `admin123`.
- Show: all bookings from all staff are visible.
- Find the pending booking created by alice. Type a note in the notes field ("Approved — conference room confirmed").
- Click Approve. Show the status badge turns green.
- Log out; log back in as alice — show the note appears as a highlighted callout.

**Step 5 — Rejection**
- Log in as admin. Find another pending booking.
- Add a rejection note and click Reject. Show status badge turns red.
- Log in as the relevant staff user — show the rejection note.

**Step 6 — Run Automated Tests**
- Stop the server (`Ctrl+C`).
- In Terminal 1: `npm test`
- Show all 7 tests passing: login, create, view isolation, 403 on staff approve, coordinator approve, invalid time 400, overlap 409.

---

## 16. Suggested Viva Questions

### Architecture and Setup

1. Why is the React application in `client/` and the Express server in `server/`? What problem does this separation solve?
2. Walk me through what happens when `npm run seed` is executed. What does the script do if the database already exists?
3. The `db.js` file has a fallback for every environment variable (e.g., `|| 'localhost'`). Is this a good practice for a production application? Why or why not?
4. How do you start the full application locally? Is there a single command you can run to start both the frontend and backend?

### Database and Data

5. You store `staff_name` as a VARCHAR in the `bookings` table. What problem would arise if a user's username were changed? How would you fix this?
6. The `status` column is an ENUM of `'pending'`, `'approved'`, `'rejected'`. What does the ENUM type enforce at the database level?
7. If you ran `npm run seed` twice, what would happen to existing data? Show me in the code where this is handled.

### Login and Role Control

8. How does the backend know whether the logged-in user is a staff member or a coordinator? Show me the exact lines of code.
9. After login, the React app stores the user object in `useState`. What would happen if someone opened the browser console and changed the `userId` they send to the API?
10. The backend re-queries the `users` table on every protected API call. Why is this done instead of trusting the role returned at login?

### Core Workflow

11. Show me how a staff member's booking request reaches the database. Trace the full path from button click to DB row insert.
12. How does the system prevent a staff member from reading another staff member's bookings? Is this enforced in the frontend, the backend, or both?
13. Can a coordinator submit a booking request? Show me the code that does or does not prevent this.

### Protected Action

14. What happens if a staff user sends `PUT /api/bookings/1/status` directly via Postman with their own `userId`? Walk me through the response code and why.
15. The `PUT` status route checks for a booking conflict before approving. Where is this check, and what SQL does it use?
16. A coordinator's note is updated every time the status changes. What happens to the previous note when a new one is written?

### Conflict Detection and Validation

17. Explain the overlap SQL query used in `POST /api/bookings`. How does `start_time < ? AND end_time > ?` detect an overlap?
18. The conflict check only looks at bookings with `status = 'approved'`. What happens if two pending bookings are submitted for the same room and time slot?
19. The backend validates that `start_time >= end_time` is invalid. But it does not validate that `booking_date` is in the future. How would you add that validation?

### Testing

20. What command runs the automated tests? What does `--runInBand` do and why is it used?
21. The test suite truncates the `users` and `bookings` tables in `beforeAll`. Why is this done, and what risk does it introduce?
22. Test 5 verifies the coordinator note by querying the database directly instead of reading the API response. Why is this a stronger test?
23. Which parts of the application have no automated tests? What would you test first if you were adding more?

### Security

24. Passwords are stored as plain text. How would you change the login route to use bcrypt hashing? What two functions from bcrypt would you use?
25. The CORS middleware is configured as `app.use(cors())` with no options. What does this allow, and how would you restrict it to the Vite dev origin only?
26. The `.env` file is in the `server/` directory. If there is no `.gitignore` for the server, what is the risk, and how do you fix it?

### Limitations

27. Staff cannot edit or cancel their own pending bookings. How would you implement a cancel feature? What route, what SQL, and what role check would you need?
28. The booking filter is client-side only. What is the performance problem with this approach? How would you move it to the server side?
29. If this application were deployed to production today, what are the three most critical security changes you would make first?

---

*End of FINAL_REVIEW.md — generated by evidence inspection of all source files on 2026-06-14.*
