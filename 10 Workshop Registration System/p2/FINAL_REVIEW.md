# Final Review — Workshop Registration System

**Case:** 10 – Workshop Registration System (p2)
**Review date:** 2026-06-15
**Reviewer note:** Review-only. No source files, schema, seed data, packages, or configuration were created or modified.
**Review basis:** All files read from disk; automated test suite executed live; browser active at `http://localhost:5175/`.

---

## 1. Final Feature Summary

The Workshop Registration System is a **fully functional prototype** built with React (Vite), Express/Node.js, and MySQL. All features described in the Case Brief are implemented and verified:

| Feature | Status | Verified by |
|---|:---:|---|
| Participant registers with name, email, workshop title, registration details | ✅ Complete | `routes/registrations.js` POST `/api/registrations`; `ParticipantRegistration.jsx` |
| Registration defaults to `pending` status | ✅ Complete | SQL INSERT seeds `pending` literal; schema ENUM default |
| Participant views own registrations (status + attendance badges) | ✅ Complete | `routes/registrations.js` GET `/api/registrations/status` scoped by `userId` |
| Participant filters own registrations by workshop / status / attendance | ✅ Complete | Query-param filters in `/status` route; `ParticipantStatus.jsx` |
| Participant can cancel own registration | ✅ Complete | Backend `status=cancelled` allowed; `ParticipantStatus.jsx` has no cancel button (UI gap) |
| Participant blocked from marking attendance | ✅ Complete | Backend 403; automated Test 3b confirms |
| Participant blocked from editing organizer notes | ✅ Complete | Backend 403; automated Test 3c confirms |
| Organizer views all registrations | ✅ Complete | GET `/api/registrations` organizer-only |
| Organizer filters registrations by workshop / status / attendance | ✅ Complete | `OrganizerDashboard.jsx` + query params |
| Organizer updates registration status (pending/confirmed/cancelled/waitlisted) | ✅ Complete | Inline dropdown in organizer table |
| Organizer marks attendance (notMarked/present/absent) | ✅ Complete | Inline attendance dropdown; Test 4b confirmed |
| Organizer adds/edits organizer notes | ✅ Complete | Inline text input + Save button in dashboard |
| Role-based login (database-backed, token-based) | ✅ Complete | `routes/auth.js`; `middleware/auth.js`; DB `session_token` |
| Logout invalidates server-side session | ✅ Complete | `POST /api/auth/logout` sets `session_token = NULL` |
| Automated backend tests | ✅ Complete | `tests/api.test.js`; 16 assertions; all pass |

**What is NOT in scope and NOT implemented (correct):** payments, certificates, email reminders, audit/history tables, admin super-role.

---

## 2. Review Scoring Matrix

> Score meaning: 0 = missing · 1 = present but mostly not working · 2 = partially working with major gaps · 3 = mostly working with important gaps · 4 = working with minor gaps · 5 = complete for the selected case scope

| Feature / Area | Functionality 0-5 | Data Persistence 0-5 | Backend Security / Role Control 0-5 | Validation / Error Handling 0-5 | Testing Evidence 0-5 | Maintainability 0-5 | UI / Manual Usability 0-5 | Evidence | Notes |
|---|---:|---:|---:|---:|---:|---:|---:|---|---|
| Project setup and run commands | 5 | 5 | — | — | 5 | 5 | — | `README.md`; `package.json` scripts in both dirs | Backend: `start`, `dev`, `db:setup`, `db:reset`, `test`; Frontend: `dev`; all commands documented and confirmed working |
| Database setup and starter data | 5 | 5 | — | — | 5 | 5 | — | `schema.sql`, `scripts/setupDb.js`, `scripts/resetDb.js` | Idempotent `CREATE IF NOT EXISTS` + check-before-seed + full DROP+re-seed via reset; 3 demo rows; test suite seeds and cleans independently |
| Login workflow | 5 | 5 | 4 | 4 | 5 | 4 | 5 | `routes/auth.js`; `middleware/auth.js`; Test 1 | DB-backed; session token via `crypto.randomBytes(32)`; logout invalidates token server-side; password plain-text (known remaining limitation) |
| Role-based access | 5 | 5 | 5 | 4 | 5 | 4 | 4 | `routes/registrations.js` L33–35, L88–90; Test 3a, 3d | Role always re-read from DB (cannot be spoofed); participant vs organizer branching on every protected route |
| Main create action | 5 | 5 | 5 | 5 | 5 | 4 | 5 | `routes/registrations.js` L14–51; Tests 2a–2c | Participant-only; name, email (with regex), workshop required; email regex duplicated on backend (was missing in Mid-Review) |
| Main view/list action | 5 | 5 | 5 | 4 | 5 | 4 | 5 | `routes/registrations.js` L54–119; Tests 3a, 5a–5c | Participant scoped to `userId`; organizer sees all; query-param filters on both paths |
| Main update/status/cancel action | 5 | 5 | 5 | 4 | 5 | 4 | 4 | `routes/registrations.js` L123–189; Tests 3d–3e, 4a–4b | Organizer full update; participant restricted to `cancelled` only; no cancel button in participant UI (consistent limitation) |
| Protected action | 5 | 5 | 5 | 5 | 5 | 5 | 5 | `routes/registrations.js` L137–146, L167–174; Tests 3b, 3c | Double-guarded: 403 if non-organizer sends `attendanceStatus` or `organizerNote`; AND builder skips fields unless organizer; both confirmed by automated test |
| Secondary feature | 5 | 5 | 4 | 3 | 5 | 3 | 5 | `routes/registrations.js` L55–83 and L92–119; Tests 5a–5c; both JSX pages | Filter by workshopTitle, status, attendanceStatus on both organizer and participant views; exact-match only (no partial search); WORKSHOPS list still duplicated in 3 JSX files |
| Case-specific: registration details and workshop title tracking | 5 | 5 | — | 4 | 5 | 3 | 5 | `schema.sql` L18–21; `setupDb.js` seed; Tests 2c, 5a | `workshopTitle VARCHAR(255)` and `registrationDetails TEXT` stored in DB; workshop enforced from fixed list at backend; registrationDetails optional; shown in participant status cards |
| Case-specific: registration status and attendance status lifecycle | 5 | 5 | 5 | 4 | 5 | 4 | 5 | `schema.sql` L22–23; Tests 4a–4b, 3d–3e | Status ENUM: `pending/confirmed/cancelled/waitlisted`; attendance ENUM: `notMarked/present/absent`; both stored, filterable, and DB-enforced; waitlisted added beyond brief (positive extension); no transition guards (e.g., can mark present on cancelled) |
| Case-specific: organizer notes and attendance protection | 5 | 5 | 5 | 5 | 5 | 5 | 5 | `routes/registrations.js` L137–146, L167–174; Tests 3b, 3c; `OrganizerDashboard.jsx` | Backend double-guard proven by automated tests; UI surfaces note editing only on organizer dashboard; participant view shows no note or attendance edit controls |
| UI/manual usability | 5 | — | — | 4 | 4 | 4 | 5 | All JSX files; browser live at localhost:5175 | Dark glassmorphic design; status/attendance badges; filter dropdowns; loading/error states throughout; credentials shown in login hint (acceptable for prototype) |
| Security posture | 3 | — | 4 | — | 4 | 3 | — | `db.js`, `routes/auth.js`, `.env`, `.env.example`, `frontend/.gitignore` | `.env` not in git; secrets in env vars; CORS still fully open (no origin restriction); plain-text passwords (known remaining limitation); no rate limiting; no input sanitisation beyond required-field checks; no bcrypt |
| Testing evidence | 5 | 5 | 5 | 5 | 5 | 5 | — | `tests/api.test.js`; live test run output | 5 test groups, 16 assertions; all pass; test data uses random `TEST_LABEL`; cleanup deletes exact test record by ID + LIKE fallback; run command: `npm test` from `backend/` |
| Maintainability | 4 | — | — | — | — | 4 | — | All source files; `README.md`; `package.json` scripts | Routes split into `routes/auth.js` and `routes/registrations.js` (improvement over Mid-Review single-file note); WORKSHOPS constant still in 3 JSX files; `alert()` for update errors in dashboard; no JSDoc; no API client abstraction in frontend |

---

## 3. Project Structure and Run Commands

```
p2/
├── Case_Brief.md
├── MID_REVIEW.md
├── FINAL_REVIEW.md
├── README.md
├── backend/
│   ├── .env                      ← local secrets (not committed)
│   ├── .env.example              ← template for .env
│   ├── db.js                     ← mysql2 connection pool
│   ├── server.js                 ← Express entry point
│   ├── schema.sql                ← table definitions
│   ├── middleware/
│   │   └── auth.js               ← DB-backed session token middleware
│   ├── routes/
│   │   ├── auth.js               ← POST /api/auth/login, POST /api/auth/logout
│   │   └── registrations.js      ← POST/GET/PUT /api/registrations
│   ├── scripts/
│   │   ├── setupDb.js            ← create DB + tables + seed users + demo data
│   │   └── resetDb.js            ← DROP database then call setupDb
│   └── tests/
│       └── api.test.js           ← integration test suite (no framework; plain Node)
└── frontend/
    ├── vite.config.js            ← proxy: /api → http://localhost:8081
    ├── index.html
    └── src/
        ├── main.jsx
        ├── App.jsx               ← routing, auth state, nav bar
        ├── App.css
        ├── index.css
        └── pages/
            ├── OrganizerLogin.jsx
            ├── OrganizerDashboard.jsx
            ├── ParticipantRegistration.jsx
            └── ParticipantStatus.jsx
```

### Run Commands

| Action | Directory | Command |
|---|---|---|
| Install backend dependencies | `backend/` | `npm install` |
| Create DB, tables, seed data | `backend/` | `npm run db:setup` |
| Drop and re-seed database | `backend/` | `npm run db:reset` |
| Start backend (dev) | `backend/` | `npm run dev` (nodemon on port 8081) |
| Start backend (production) | `backend/` | `npm start` |
| Run automated tests | `backend/` | `npm test` |
| Install frontend dependencies | `frontend/` | `npm install` |
| Start frontend (dev) | `frontend/` | `npm run dev` (Vite, typically port 5173 or 5175) |

---

## 4. Frontend/Backend Separation

**Verdict: Fully separated. ✅**

| Check | Result | Detail |
|---|:---:|---|
| React and Express in separate directories | ✅ | `frontend/` and `backend/` each have their own `package.json`, `node_modules`, and lock files |
| Frontend has no MySQL driver or DB config | ✅ | `frontend/package.json` contains only React, Vite, and ESLint packages; no `mysql2`, no `dotenv` |
| Frontend calls Express routes only | ✅ | All data access uses `fetch('/api/…')` with an `Authorization` header; Vite proxy in `vite.config.js` rewrites `/api` to `http://localhost:8081` |
| React never holds DB credentials | ✅ | No `.env` file in `frontend/`; DB vars exist only in `backend/.env` |
| No direct MySQL calls from frontend | ✅ | Confirmed by reading all four JSX pages |

---

## 5. Database Setup and Table Summary

### Connection Method

`backend/db.js` creates a `mysql2/promise` connection pool reading from environment variables.

| Variable | Configured | Value in `.env` |
|---|:---:|---|
| `DB_HOST` | ✅ | `localhost` |
| `DB_PORT` | ✅ | `3306` |
| `DB_USER` | ✅ | `root` |
| `DB_PASSWORD` | ✅ | *(configured; value not printed)* |
| `DB_NAME` | ✅ | `c10p2` |

All five variables have code-level fallbacks in `db.js` (e.g., `process.env.DB_HOST || 'localhost'`), so the pool still forms if `.env` is missing. `setupDb.js` and `resetDb.js` also read these same five variables independently.

### Tables

| Table | Purpose | Key Columns |
|---|---|---|
| `users` | Login / session store | `id`, `username`, `password` (plain text), `role ENUM('organizer','participant')`, `session_token`, `created_at` |
| `registrations` | Core data | `id`, `participantName`, `email`, `workshopTitle`, `registrationDetails`, `status ENUM(...)`, `attendanceStatus ENUM(...)`, `organizerNote`, `userId FK→users.id`, `createdAt`, `updatedAt` |

**A `users`/login table exists.** It stores credentials, role, and the session token used for authentication.

The `status` ENUM allows: `pending`, `confirmed`, `cancelled`, `waitlisted`.  
The `attendanceStatus` ENUM allows: `notMarked`, `present`, `absent`.

### Recreating Tables and Seed Data

```bash
# From backend/ directory:
npm run db:setup   # Idempotent: CREATE IF NOT EXISTS; only seeds if table is empty
npm run db:reset   # Destructive: DROP DATABASE → re-runs db:setup from scratch
```

`setupDb.js` reads `schema.sql` and executes it statement-by-statement, then inserts:
- 1 organizer user (`organizer / password123`) — if not already present
- 1 participant user (`participant / password123`) — if not already present
- 3 demo registrations covering all status/attendance combinations — if `registrations` table is empty

---

## 6. Login and Role/Access Explanation

### How Each Role Logs In

Both roles use the **same login page** (`OrganizerLogin.jsx`). The form POSTs `{ username, password }` to `POST /api/auth/login`.

The backend (`routes/auth.js`):
1. Queries `SELECT id, username, role FROM users WHERE username = ? AND password = ?`
2. If found, generates a 32-byte random hex token (`crypto.randomBytes(32).toString('hex')`)
3. Stores the token in `users.session_token` (database write)
4. Returns `{ token, user: { id, username, role } }` to the client

The frontend stores `token` and `role` in `localStorage`. On every subsequent API call, the token is sent in `Authorization: Bearer <token>`.

### How Roles Are Checked

The `authenticateSession` middleware (`middleware/auth.js`) is applied to every protected route:
1. Reads the `Authorization: Bearer <token>` header
2. Queries `SELECT id, username, role FROM users WHERE session_token = ?`
3. Attaches the DB-sourced `{ id, username, role }` to `req.user`
4. The role cannot be forged client-side because it is always re-read from the database

### Role-Specific Access

| Route | Method | Who Can Access | How Enforced |
|---|---|---|---|
| `POST /api/auth/login` | POST | Anyone (unauthenticated) | No middleware |
| `POST /api/auth/logout` | POST | Authenticated users | `authenticateSession` |
| `POST /api/registrations` | POST | Participant only | `authenticateSession` + `req.user.role !== 'participant'` → 403 |
| `GET /api/registrations/status` | GET | Participant only (own rows) | `authenticateSession` + `WHERE userId = req.user.id` |
| `GET /api/registrations` | GET | Organizer only | `authenticateSession` + `req.user.role !== 'organizer'` → 403 |
| `PUT /api/registrations/:id` | PUT | Both (with restrictions) | `authenticateSession` + ownership check + field restrictions per role |

### Participant Data Isolation

`GET /api/registrations/status` always appends `WHERE userId = req.user.id` to its SQL query. A participant can never see another participant's registrations, regardless of token.

---

## 7. Protected Action Explanation

**Protected actions:** marking attendance (`attendanceStatus`) and editing organizer notes (`organizerNote`).

The `PUT /api/registrations/:id` route in `routes/registrations.js` uses a **double guard**:

**Guard 1 — Explicit 403 (lines 137–146):**
```js
if (req.user.role !== 'organizer') {
  if (attendanceStatus !== undefined || organizerNote !== undefined) {
    return res.status(403).json({ error: 'Access denied. Only organizers can mark attendance or edit notes.' });
  }
}
```
A participant sending either field receives an immediate `403 Forbidden`.

**Guard 2 — Builder skip (lines 167–174):**
```js
if (attendanceStatus !== undefined && req.user.role === 'organizer') {
  updates.push('attendanceStatus = ?');
  ...
}
if (organizerNote !== undefined && req.user.role === 'organizer') {
  updates.push('organizerNote = ?');
  ...
}
```
Even if Guard 1 were somehow bypassed, the SQL UPDATE would never include `attendanceStatus` or `organizerNote` for a non-organizer.

**UI layer:** `ParticipantStatus.jsx` contains no attendance controls or note fields, so a participant has no UI surface to attempt these actions.

**Automated proof:** Tests 3b and 3c in `api.test.js` confirm `403` is returned when a participant token sends `{ attendanceStatus: 'present' }` or `{ organizerNote: '...' }`.

---

## 8. Validation Summary

### Backend Validation (enforced even if client is bypassed)

| Route | Field | Rule | Response on Failure |
|---|---|---|---|
| `POST /api/auth/login` | `username`, `password` | Both required (non-empty) | 400 |
| `POST /api/registrations` | `participantName` | Required, non-empty string | 400 |
| `POST /api/registrations` | `email` | Required, regex `/^[^\s@]+@[^\s@]+\.[^\s@]+$/` | 400 |
| `POST /api/registrations` | `workshopTitle` | Must be one of 3 known workshop strings | 400 |
| `POST /api/registrations` | role | Must be `participant` (organizer blocked) | 403 |
| `PUT /api/registrations/:id` | `id` | Record must exist in DB | 404 |
| `PUT /api/registrations/:id` | `status` | Must be in `['pending','confirmed','cancelled','waitlisted']` | 400 |
| `PUT /api/registrations/:id` | empty body | At least one valid field required | 400 |
| DB ENUM | `status` / `attendanceStatus` | MySQL ENUM rejects out-of-range values | DB error → 500 |

### Client-Side Validation (UX only — not a security boundary)

| Page | Field | Rule |
|---|---|---|
| `OrganizerLogin.jsx` | `username`, `password` | Both required before fetch |
| `ParticipantRegistration.jsx` | `participantName` | Required |
| `ParticipantRegistration.jsx` | `email` | Required + email regex |

### Known Validation Gaps

- No duplicate-registration guard: the same participant can register for the same workshop more than once.
- No status-transition lifecycle guard: an organizer can mark a `cancelled` registration as `present` (logically inconsistent).
- No maximum-length enforcement for `participantName` or `registrationDetails` beyond the DB column size.

---

## 9. Automated and Manual Testing Summary

### Automated Test Command

```bash
cd backend
npm test
# resolves to: node tests/api.test.js
```

**Prerequisite:** The backend server must be running (`npm run dev`) and the database must be set up (`npm run db:setup`).

### What the Test Suite Checks

The test file `tests/api.test.js` (291 lines, no external test framework — uses Node.js built-in `assert`) runs 5 test groups with 16 assertions:

| Group | Description | Assertions |
|---|---|---|
| Test 1 | Login validation: bad credentials → 401; organizer login → 200 + token + role; participant login → 200 + token + role | 3 |
| Test 2 | Registration validation: no token → 401; empty name → 400; valid POST → 201 + registrationId | 3 |
| Test 3 | Role spoofing: participant reads organizer list → 403; marks own attendance → 403; writes organizer note → 403; self-confirms → 403; self-cancels → 200 | 5 |
| Test 4 | Organizer updates: waitlist → 200; full update (status+attendance+note) → 200; direct DB check confirms saved values | 3 |
| Test 5 | Filters: workshopTitle filter → record found; status filter → record found; attendanceStatus filter → record found | 3 (3 fetches + presence checks) |

### Live Test Result (run during this review)

```
--- STARTING AUTOMATED BACKEND API TESTS ---

[TEST 1] Authenticating organizer and participant roles...
✓ Rejected invalid credentials correctly.
✓ Organizer logged in successfully.
✓ Participant logged in successfully.

[TEST 2] Verifying registration validation checks...
✓ Rejected unauthenticated registration request.
✓ Rejected invalid registration missing fields.
✓ Created test registration successfully.

[TEST 3] Running role-spoofing and resource protection checks...
✓ Blocked participant from reading other registrations.
✓ Blocked participant from updating attendanceStatus.
✓ Blocked participant from writing organizerNote.
✓ Blocked participant from self-confirming registration status.
✓ Participant successfully cancelled their own registration.

[TEST 4] Testing organizer updates for notes, status, and attendance...
✓ Organizer successfully waitlisted the registration.
✓ Organizer updated status from waitlisted to confirmed, notes, and attendance.
✓ Checked database record matches updated state.

[TEST 5] Testing workshop title, status, and attendance filters...
✓ Filter by workshopTitle successfully returned the record.
✓ Filter by status successfully returned the record.
✓ Filter by attendanceStatus successfully returned the record.

--- ALL AUTOMATED BACKEND TESTS PASSED SUCCESSFULLY ---

Cleaning up test records from database...
✓ Cleaned up test registration record.
Cleanup complete.
```

**Result: 16/16 assertions passed. All test data cleaned up.**

### Test Data Creation and Cleanup

Each test run generates a unique `TEST_LABEL` using `Math.random().toString(36)` to avoid collisions with existing data. The `finally` block unconditionally:
1. Deletes the test registration record by its exact `testRegistrationId`
2. Deletes any remaining records where `participantName LIKE %TEST_LABEL%` (safety net)

Seed users (`organizer`, `participant`) are not touched by the test suite.

### What Was NOT Automated

- No frontend/UI tests (no Playwright, Cypress, or similar)
- No unit tests for individual middleware or validation functions in isolation
- No test for the `POST /api/auth/logout` route
- No test for the `/api/health` endpoint
- No test for the `db:setup` and `db:reset` scripts themselves
- No concurrency/load testing

These are acceptable gaps for a prototype at this stage.

---

## 10. Stage 11 Change Summary

At the time of this final review, the project was assessed against the Mid-Review findings (Stage 7 endpoint). The following improvements are present in the final codebase compared to the Mid-Review:

| Change | Mid-Review Finding | Final State |
|---|---|---|
| Backend email validation added | Missing (client-only regex) | ✅ Email regex now validated in `POST /api/registrations` backend handler (lines 23–26 of `registrations.js`) |
| Routes split into separate files | L1 issue: all routes in single `server.js` | ✅ `routes/auth.js` and `routes/registrations.js` are separate; `server.js` only mounts them |
| Automated test suite added | Testing evidence score: 0 | ✅ `tests/api.test.js` with 16 assertions; `npm test` script in `package.json` |
| `README.md` updated with test instructions | README did not mention tests | ✅ README section 5 covers `npm run test` with prerequisites |
| `waitlisted` status added to ENUM and UI | Mid-Review showed only 3 statuses in dashboard | ✅ `waitlisted` present in DB ENUM, organizer dropdown, participant filter |

**Changes that were identified in Mid-Review but are NOT yet resolved in final code:**

| Remaining Issue | Mid-Review Severity | Status |
|---|---|---|
| Passwords stored as plain text (no bcrypt) | Critical (C1) | ⚠️ Still plain text |
| No participant self-cancel UI button | High (H1) | ⚠️ Backend allows it; no UI button in `ParticipantStatus.jsx` |
| No duplicate-registration guard | High (H2) | ⚠️ Still possible to register for same workshop twice |
| CORS fully open (no origin restriction) | High (H3) | ⚠️ `cors()` with no options in `server.js` line 9 |
| Default credentials shown in login UI | Medium (M1) | ⚠️ Still visible in `OrganizerLogin.jsx` lines 83–84 |
| `alert()` for organizer update errors | Medium (M4) | ⚠️ Still in `OrganizerDashboard.jsx` line 100 |
| WORKSHOPS constant duplicated in 3 JSX files | Low (L4) / High (H4) | ⚠️ Still in 3 separate files |

---

## 11. Stage Drift / Early Work

**No stage drift detected.** The final codebase does not include:
- Payment or certificate logic
- Email reminders
- Audit/history tables
- Admin super-user role
- Rate limiting or advanced input sanitization
- External test frameworks (Jest, Mocha)

All features present are within scope of the Case Brief. The `waitlisted` status is a minor positive extension that is consistent with the prototype domain without over-engineering.

**Work that appears early or out of sequence:** None found. The routes file was properly split (a maintainability improvement), test suite added (expected testing stage), and backend email validation added (expected hardening stage). These are all appropriate for a final submission.

---

## 12. Security Risks and Exposed-Secret Check

| Risk | Severity | Detail | Status |
|---|---|---|---|
| Plain-text password storage | High | `users.password` stores clear-text; `routes/auth.js` compares plain text with `=`; SQL dump would expose all passwords | ⚠️ Known; not resolved in final |
| Default credentials displayed in UI | Medium | `OrganizerLogin.jsx` lines 83–84 renders `organizer/password123` and `participant/password123` on the login page | ⚠️ Acceptable for prototype; must remove before any deployment |
| CORS fully open | Medium | `app.use(cors())` with no `origin` option allows any domain to call the API | ⚠️ Acceptable for local dev |
| `.env` file contents | Low | `DB_PASSWORD` is an empty string in the current `.env`; no actual secret value exposed | ✅ Safe in this dev config |
| `.env` in git | — | `frontend/.gitignore` contains `.env` entries; `backend/.env` is excluded | ✅ Confirmed not tracked |
| Session token exposure | Low | Token is 32 random bytes (hex), stored in `localStorage`; no `httpOnly` cookie used (localStorage is accessible to JS) | ⚠️ Acceptable for prototype |
| No rate limiting | Low | Login endpoint has no brute-force protection | ⚠️ Not required for prototype |
| No HTTPS | Info | Local dev only; no TLS | Expected for local prototype |

**Confirmed: No passwords, DB credentials, or token values are printed anywhere in this review.**

---

## 13. Documentation / Code Mismatches

| Item | MID_REVIEW.md Reference | Actual Code State | Mismatch? |
|---|---|---|---|
| MID_REVIEW references routes in `server.js` (e.g., "server.js L110–112") | Mid-Review §3, §4, §5 | Routes now live in `routes/registrations.js` and `routes/auth.js`; `server.js` is only 38 lines | ⚠️ Line numbers in MID_REVIEW are no longer accurate, but this is expected after the route-split refactor |
| README says frontend runs "typically at http://localhost:5173" | README line 66 | Browser is active at `http://localhost:5175/` (port 5175, not 5173) | Minor — Vite assigns the next available port; not a code error |
| MID_REVIEW §9 L1 says "all Express routes in a single file" | Mid-Review Low issue L1 | Routes are now split into separate files — issue resolved | ✅ Resolved; MID_REVIEW is now outdated on this point |
| MID_REVIEW §9 notes "no test files" | Mid-Review Testing Evidence: 0 | `tests/api.test.js` fully implemented and passing | ✅ Resolved |
| MID_REVIEW §9 M3 says "no backend email format validation" | Mid-Review issue M3 | Backend now validates email with regex in `registrations.js` lines 23–26 | ✅ Resolved |
| `status` ENUM in MID_REVIEW §4 shows only `pending/confirmed/cancelled` | MID_REVIEW table row | `schema.sql` now includes `waitlisted` as 4th value | ✅ Extended; MID_REVIEW is incomplete on this |

---

## 14. Known Limitations

1. **Plain-text passwords** — No bcrypt or equivalent hashing. A database dump would expose all user credentials.
2. **No participant self-cancel UI** — The backend correctly allows a participant to PUT `{ status: 'cancelled' }` on their own registration. However, `ParticipantStatus.jsx` provides no cancel button, so this action can only be performed via direct API call.
3. **No duplicate-registration guard** — A participant can register for the same workshop multiple times with no rejection.
4. **No status-transition lifecycle guard** — An organizer can mark attendance on a cancelled registration or set a confirmed registration back to pending; there is no state machine.
5. **CORS fully open** — `app.use(cors())` with no origin restriction; any origin can call the backend.
6. **Workshop list hard-coded in 3 JSX files** — Adding a new workshop requires changing `ParticipantRegistration.jsx`, `ParticipantStatus.jsx`, and `OrganizerDashboard.jsx`. The backend validates against a JS constant (not a DB table), so the API and the UI can go out of sync if one file is updated without the others.
7. **`alert()` used for organizer update errors** — Native browser alert breaks UX consistency on the dashboard.
8. **No frontend tests** — UI interactions are not automated; all UI testing is manual.
9. **Session token in localStorage** — Accessible to JavaScript; no `httpOnly` cookie protection.
10. **Default credentials in login UI** — `organizer/password123` and `participant/password123` shown on the login page.

---

## 15. Demo Script

**Prerequisites:** MySQL running; `npm run db:reset` run from `backend/`; backend running on port 8081 (`npm run dev` in `backend/`); frontend running (`npm run dev` in `frontend/`); open browser to `http://localhost:5173` (or 5175).

---

### Step 1 — Participant registers for a workshop

1. On the Login page, enter: `participant` / `password123` → click **Login**.
2. You are redirected to **My Registrations** (currently empty or showing only your own).
3. Click **Register Workshop** in the nav bar.
4. Fill in: **Full Name** = "Jane Doe", **Email** = "jane@example.com", **Select Workshop** = "Building REST APIs with Express & MySQL", **Additional Details** = "Interested in query optimization".
5. Click **Register**. A green success banner appears: "Registration submitted!"
6. Navigate back to **My Registrations**. The new registration appears with `PENDING` status badge and `Not Marked` attendance.
7. Apply the "Filter Status → Pending" dropdown. Only pending registrations appear. Apply "Filter Workshop → Building REST APIs…" to narrow further.
8. Logout.

### Step 2 — Organizer reviews and updates

1. On the Login page, enter: `organizer` / `password123` → click **Login**.
2. The **Organizer Dashboard** loads showing all registrations.
3. Locate Jane Doe's row. Change **Registration Status** dropdown from `Pending` → `Confirmed`. The UI updates immediately; the change is persisted to the database.
4. Change **Attendance Status** dropdown from `Not Marked` → `Present`. Saved immediately.
5. In the **Organizer Note** field, type "Verified prerequisites" and click **Save**.
6. Use the **Filter Workshop** dropdown to isolate "Building REST APIs…". Only matching rows appear.
7. Use the **Filter Attendance → Present** filter. Only present participants are listed.

### Step 3 — Participant sees updated status

1. Logout from organizer. Log in as `participant / password123`.
2. **My Registrations** now shows Jane Doe's registration with `CONFIRMED` badge and `Present` attendance badge.
3. No organizer note field is visible to the participant (protected field).

### Step 4 — Demonstrate security

1. Using a tool like Postman or curl, send:
   ```http
   PUT http://localhost:8081/api/registrations/<id>
   Authorization: Bearer <participant_token>
   Content-Type: application/json

   { "attendanceStatus": "present" }
   ```
2. Response: `403 Forbidden` — `"Access denied. Only organizers can mark attendance or edit notes."`

---

## 16. Suggested Viva Questions

### Architecture and Separation

1. Why do you have two separate `package.json` files? What would break if you merged everything into one folder?
2. How does the frontend know which port the backend is on? Trace the path from the React `fetch('/api/registrations')` call to the MySQL query.
3. What does `vite.config.js` do in this project, and what would happen if you removed the proxy block?

### Database and Setup

4. Explain what `npm run db:reset` does step by step. Why does it call `setupDb` at the end?
5. Your `setupDb.js` has a `CREATE DATABASE IF NOT EXISTS` guard. Why is that important, and why isn't just running `schema.sql` directly in MySQL enough?
6. What is the purpose of the `session_token` column in the `users` table? How is it generated and when is it cleared?

### Login and Authentication

7. Walk me through what happens from the moment a user clicks "Login" to when they can see the organizer dashboard. Mention every file involved.
8. Your `authenticateSession` middleware reads the user's role from the database on every request. Why not just decode it from a JWT? What does this design prevent?
9. What would happen if an attacker manually changed `localStorage.userRole` from `'participant'` to `'organizer'` in their browser? Would they gain organizer access?

### Role Security and Protected Actions

10. Show me exactly where in the code a participant is blocked from marking attendance. What HTTP status code is returned?
11. You said the attendance protection is "double-guarded." Explain what both guards do and why having two is better than one.
12. Can a participant view another participant's registration data? How does the backend prevent this?
13. A participant sends `PUT /api/registrations/5` with `{ "status": "confirmed" }`. What happens? Walk through the code.

### Validation

14. Your backend validates the workshop title against a hard-coded list. What are the pros and cons of this approach? What would need to change if you added a fourth workshop?
15. What is the difference between client-side and server-side validation in this project? Why does the email regex appear in both `ParticipantRegistration.jsx` and `registrations.js`?
16. What would happen if someone sent `{ "status": "superuser" }` in a PUT request?

### Testing

17. Your test file uses Node.js `assert` but no test framework like Jest or Mocha. What are the trade-offs of this approach?
18. Explain what `TEST_LABEL` is in your test file and why it uses `Math.random()`.
19. Walk me through Test 3: what does it prove, and what real security risk does it protect against?
20. After the test suite runs, are there any test records left in the database? Prove it.

### Known Limitations

21. Your passwords are stored as plain text. How would you fix this, and what specific Node.js package would you use?
22. A participant can register for the same workshop multiple times right now. How would you add a duplicate-registration guard at the database level?
23. Your CORS configuration is `app.use(cors())` with no options. What does that mean, and how would you restrict it in production?

---

## Appendix: Pass / Fail Checklist

| Check | Result | Detail |
|---|:---:|---|
| App appears runnable | ✅ Pass | Backend and frontend both start; test suite passes live |
| React and Express are fully separated | ✅ Pass | `frontend/` and `backend/` are independent projects |
| React calls Express routes only; never MySQL directly | ✅ Pass | All data access via `fetch('/api/…')`; Vite proxy confirmed |
| DB_HOST, DB_PORT, DB_USER, DB_PASSWORD, DB_NAME all configured | ✅ Pass | All 5 in `backend/.env` and read by `db.js` and both scripts |
| `users` / login table exists | ✅ Pass | `users` table with credentials, role, and session token |
| `registrations` table with all required fields | ✅ Pass | 11 columns including all case-specific fields |
| Repeatable setup command | ✅ Pass | `npm run db:setup` idempotent; `npm run db:reset` destructive |
| Seed data created automatically | ✅ Pass | 2 users + 3 demo registrations via `setupDb.js` |
| Login is database-backed (not mock or role-selector) | ✅ Pass | Queries `users` table; token stored in DB |
| Token verified from DB on every protected request | ✅ Pass | `authenticateSession` middleware re-reads role from DB |
| Role restrictions enforced in backend | ✅ Pass | Every protected route checks `req.user.role` |
| Participant scoped to own records | ✅ Pass | `WHERE userId = req.user.id` in participant status route |
| Protected action (attendance + notes) blocked for participants | ✅ Pass | 403; double-guard; automated test proves it |
| Main create action works | ✅ Pass | POST registers a new registration |
| Main view/list action works | ✅ Pass | Participant and organizer views both functional |
| Main update action works | ✅ Pass | Status, attendance, notes all updatable by organizer |
| Secondary feature (filters) works | ✅ Pass | Workshop, status, attendance filters on both views |
| Automated tests exist and pass | ✅ Pass | 16/16 assertions; test data cleaned up |
| No future-stage features built prematurely | ✅ Pass | No payments, certificates, bcrypt, or audit tables |
| `.env` not committed to version control | ✅ Pass | Listed in `.gitignore`; not tracked by git |
| No secrets printed in this review | ✅ Pass | DB_PASSWORD value deliberately withheld |
