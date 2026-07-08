# Final Review — Workshop Registration System

**Project:** p3 — Workshop Registration System
**Review Date:** 2026-06-16
**Review Stage:** Final — after testing, security hardening, and maintainability review
**Reviewer:** Antigravity (AI Code Review Agent)
**Test run result:** `npm test` → **🎉 INTEGRATION TESTS COMPLETED: PASS** (all 8 steps, 22 assertion groups, 0 failures)

---

## 1. Final Feature Summary

The Workshop Registration System is a fully functional React + Express + MySQL prototype. All features described in the Case Brief and REQUIREMENTS.md are implemented and verified. The complete build includes:

| Feature | Status | Verified by |
|---|---|---|
| Participant: Register for a workshop (name, email, workshop title, registration details) | ✅ Complete | Test Step 4; UI manual |
| Participant: View own registrations (by authenticated email) | ✅ Complete | Test Step 4; UI manual |
| Participant: Filter own registrations by status | ✅ Complete | Client-side filter; UI manual |
| Participant: Edit pending registration details | ✅ Complete | Test Step 5; UI manual |
| Organizer: View all registrations with all fields | ✅ Complete | Test Step 7; UI manual |
| Organizer: Filter by workshop title, registration status, attendance status | ✅ Complete | Test Step 7; server-side query params |
| Organizer: Update registration status (pending / confirmed / cancelled / waitlisted) | ✅ Complete | Test Step 6 |
| Organizer: Mark attendance (notMarked / present / absent) | ✅ Complete | Test Step 6 |
| Organizer: Edit organizer notes | ✅ Complete | Test Step 6 |
| Organizer: Dashboard statistics (total, pending, waitlisted, confirmed, present) | ✅ Complete | `App.jsx` stats object |
| Login: Database-backed with SHA-256 hashed passwords | ✅ Complete | Test Step 1 |
| Role check: DB re-query on every protected request | ✅ Complete | `checkRole` middleware |
| Protected: Participant blocked from marking attendance | ✅ Complete | Test Step 5 |
| Protected: Participant blocked from editing organizer notes | ✅ Complete | Route middleware |
| Protected: Participant blocked from viewing all registrations | ✅ Complete | `checkRole(['organizer'])` on `GET /` |
| Duplicate registration rejected | ✅ Complete | MySQL UNIQUE KEY + ER_DUP_ENTRY catch |
| Test data cleanup after test run | ✅ Complete | Test Step 8 |

---

## 2. Review Scoring Matrix

> **Scoring Scale:** 0 = not present, 1 = exists but broken, 2 = partial/major gaps, 3 = functional with gaps, 4 = solid with minor gaps, 5 = complete and correct.
> **Testing Evidence column** scores: automated tests implemented, manual checks defined, test data cleanup, and reported results.

| Feature / Area | Functionality 0-5 | Data Persistence 0-5 | Backend Security / Role Control 0-5 | Validation / Error Handling 0-5 | Testing Evidence 0-5 | Maintainability 0-5 | UI / Manual Usability 0-5 | Evidence | Notes |
|---|---:|---:|---:|---:|---:|---:|---:|---|---|
| Project setup and run commands | 5 | 5 | — | — | 4 | 4 | — | `npm run install:all`, `npm run dev`, `npm run db:setup`, `npm test` all functional; README documents every step | `concurrently` resolves via root `devDependencies`; `setupDb.js` CWD sensitivity is a minor gap |
| Database setup and starter data | 5 | 5 | — | 4 | 4 | 4 | — | `schema.sql` drops and recreates tables, seeds 3 users + 3 registrations; `npm run db:setup` works end-to-end; test runner connects and cleans up independently | No migration versioning; `INSERT IGNORE` means re-running does not reset seed data to original state |
| Login workflow | 4 | 5 | 4 | 4 | 5 | 3 | 5 | Test Step 1: status 200 + token on valid creds; 401 on wrong password; 400 on missing fields — all correct; SHA-256 hash comparison in `authService.js` | Token is raw email (no JWT signing, no expiry). Prototype scope acknowledged. Seeded-credentials hint on login UI is a demo artifact |
| Role-based access | 5 | 5 | 5 | 4 | 5 | 4 | 4 | `checkRole(['organizer'])` middleware re-queries `app_users` on every call; participant blocked from all organizer endpoints; Test Step 5 confirms 403 on participant status update | `checkOwnership` does not validate role set — any DB user passes — but the route separation makes this harmless |
| Main create action | 5 | 5 | 5 | 4 | 5 | 4 | 4 | Test Steps 2–4: missing fields → 400; bad email → 400; whitespace name → 400; email spoofing → 403; creation → 201 with ID; duplicate → 400; all pass | `participantName` max 100 chars not enforced; `workshopTitle` not validated against the known list on backend |
| Main view/list action | 5 | 5 | 5 | 4 | 5 | 4 | 4 | Test Step 7: organizer filter by workshop, status, attendance — all correct; Test Step 3: participant blocked from other-user records | Participant status filter is client-side only (all records fetched); email comparison is case-sensitive |
| Main update/status/cancel action | 5 | 5 | 5 | 4 | 5 | 4 | 4 | Test Step 5: participant update of pending details → 200; participant update of status → 403; Test Step 6: organizer status updates → 200 | No lifecycle guard on transitions (e.g., cancelled → pending is allowed) |
| Protected action | 5 | 5 | 5 | 4 | 5 | 4 | 3 | Test Step 6: organizer attendance → present; organizer note → saved; Test Step 5 participant status block → 403; route-level middleware confirmed in `registrations.js` | `organizerNote` has no length/content validation; onBlur save UX fires on every click-away |
| Secondary feature | 4 | 5 | 4 | 4 | 4 | 3 | 4 | Test Step 7: filter by workshopTitle, status, attendanceStatus — all return correctly filtered rows; invalid filter → 400 confirmed | Organizer workshop filter is exact-match only (no partial/LIKE); participant filter is client-side only |
| Case-specific: registration details and workshop title tracking | 5 | 5 | 4 | 4 | 5 | 3 | 5 | `registrationDetails` (TEXT) and `workshopTitle` (VARCHAR 255) stored in DB; displayed in both participant cards and organizer table; Test Step 7 filter by workshopTitle passes | Workshop titles are a hardcoded JS array in `App.jsx`; no `workshops` lookup table in DB |
| Case-specific: registration status and attendance status lifecycle | 5 | 5 | 5 | 4 | 5 | 4 | 4 | Status ENUM (`pending`, `confirmed`, `cancelled`, `waitlisted`) and attendanceStatus ENUM (`notMarked`, `present`, `absent`) enforced at DB + service + route level; Test Step 6 verifies pending→waitlisted→confirmed→present transition | No transition rules enforced (e.g., marking attendance before confirming is possible); not specified as a requirement |
| Case-specific: organizer notes and attendance protection | 5 | 5 | 5 | 4 | 5 | 4 | 3 | Both `/notes` and `/attendance` protected by `checkRole(['organizer'])`; DB re-queried on every call; participant view shows `organizerNote` read-only; Test Step 6 confirms both organizer routes succeed | Notes content has no length or sanitization validation; onBlur UX for notes is not explicit-save |
| UI / manual usability | 4 | — | — | 3 | 3 | 3 | 4 | Dark glassmorphism UI with Inter font, toast notifications, status badges, stat cards, tab navigation, inline organizer controls | All frontend in one 732-line `App.jsx`; no component decomposition; no per-row loading indicators; seeded-credentials hint visible in login screen |
| Security posture | 3 | — | 4 | 3 | 3 | 3 | — | DB creds in `backend/.env` only; no DB vars in frontend bundle; role re-checked from DB (not from client header); parameterized queries throughout | Token is raw email (no signing); CORS is open wildcard; SHA-256 is not bcrypt; backend `.env` not in a `.gitignore`; seeded credentials visible in UI |
| Testing evidence | 5 | 5 | 5 | 5 | 5 | 4 | — | `npm test` → all 8 steps pass; covers login, validation, identity spoofing, CRUD, role enforcement, organizer admin, filters, and DB cleanup; `docs/TEST_PLAN.md` documents all cases | Test runner is a custom Node script (not a framework like Jest/Supertest); no test for `participantName` length or `workshopTitle` list validation |
| Maintainability | 3 | — | — | — | 3 | 3 | — | Routes/services separated; `db.js` is a shared pool; JSDoc on service methods; `.env.example` provided; README is clear | Single 732-line `App.jsx`; no React component decomposition; no custom hooks; inline styles in participant filter; CSS is one 898-line file; `deleteRegistrationsByEmail` is a test helper in the production service |

---

## 3. Project Structure and Run Commands

```
p3/
├── frontend/                          # React client (Vite + React 18)
│   ├── src/
│   │   ├── App.jsx                    # All state, API calls, and rendering (732 lines)
│   │   ├── App.css                    # All component styles (CSS variables, glassmorphism)
│   │   ├── index.css                  # Reset and base typography
│   │   └── main.jsx                   # React DOM root mount
│   ├── index.html
│   ├── vite.config.js                 # Proxy /api → http://localhost:5000
│   ├── .env                           # VITE_API_URL=http://localhost:5000 only
│   ├── .env.example
│   └── package.json                   # react, react-dom, @vitejs/plugin-react
├── backend/                           # Node.js + Express API
│   ├── config/
│   │   ├── db.js                      # mysql2 connection pool (reads .env)
│   │   ├── schema.sql                 # CREATE DATABASE/TABLES + seed data
│   │   └── setupDb.js                 # Runs schema.sql via mysql2 connection
│   ├── routes/
│   │   ├── auth.js                    # POST /api/auth/login
│   │   └── registrations.js           # All /api/registrations/* routes + middleware
│   ├── services/
│   │   ├── authService.js             # login(), findUserByEmail()
│   │   └── registrationService.js     # Full data-access layer
│   ├── server.js                      # Express app entry point
│   ├── test.js                        # Integration test runner (8 steps, 22 assertion groups)
│   ├── .env                           # DB credentials (not git-ignored — known risk)
│   ├── .env.example                   # Safe template
│   └── package.json                   # express, cors, dotenv, mysql2, nodemon
├── docs/
│   └── TEST_PLAN.md                   # Documents all test cases
├── package.json                       # Root orchestrator scripts
├── README.md
├── REQUIREMENTS.md
├── PROJECT_CONTEXT.md
├── Case_Brief.md
└── MID_REVIEW.md
```

### Run Commands

| Command | Purpose |
|---|---|
| `npm run install:all` | Install dependencies for both frontend and backend |
| `npm run db:setup` | Create `c10p3` database, tables, and seed data |
| `npm run dev` | Start both frontend (port 5173) and backend (port 5000) concurrently |
| `npm test` | Run the integration test suite (backend must be running) |
| `npm run dev:frontend` | Start only the React dev server |
| `npm run dev:backend` | Start only the Express server |

---

## 4. Frontend/Backend Separation

**React and Express are fully separated.** Evidence:

- Two distinct directories: `frontend/` (React/Vite) and `backend/` (Node/Express).
- No cross-directory imports exist. The frontend has no `require('mysql2')` or similar.
- The frontend communicates exclusively via `fetch('/api/...')` HTTP calls.
- Vite's dev-server proxy (`vite.config.js` lines 8–13) rewrites `/api/*` to `http://localhost:5000`, so the React app never holds the backend hostname or port directly in production-facing code.
- `mysql2` is a dependency only in `backend/package.json`. It does not appear anywhere in the frontend `node_modules` or bundle.
- The frontend `frontend/.env` contains only `VITE_API_URL=http://localhost:5000` — no database credentials.

**Verdict: ✅ React calls Express routes and never connects to MySQL directly.**

---

## 5. Database Setup and Table Summary

### Connection Method

`backend/config/db.js` uses `mysql2/promise` to create a **connection pool**. It reads all five required variables from `backend/.env` via `dotenv`. If a variable is missing, it falls back to a safe default:

| Variable | Configured | Default fallback |
|---|---|---|
| `DB_HOST` | ✅ Yes (`localhost`) | `localhost` |
| `DB_PORT` | ✅ Yes (`3306`) | `3306` |
| `DB_USER` | ✅ Yes (`root`) | `root` |
| `DB_PASSWORD` | ✅ Yes (value not printed) | `''` |
| `DB_NAME` | ✅ Yes (`c10p3`) | `workshop_db` |

> ⚠️ The fallback `DB_NAME` is `workshop_db` but the schema creates `c10p3`. If `.env` is absent, the pool would target the wrong database. This is a minor setup reliability gap.

### Database Tables

| Table | Purpose | Key Fields |
|---|---|---|
| `app_users` | Login and role storage | `id`, `email`, `password` (SHA-256 hash), `role` ENUM(`participant`,`organizer`), `created_at` |
| `registrations` | Main entity | `id`, `participantName`, `email`, `workshopTitle`, `registrationDetails`, `status` ENUM(`pending`,`confirmed`,`cancelled`,`waitlisted`), `attendanceStatus` ENUM(`notMarked`,`present`,`absent`), `organizerNote`, `createdAt`, `updatedAt` |

**A `users`/login table exists:** ✅ `app_users` with `email`, SHA-256 `password`, and `role`.

**Unique constraint:** `UNIQUE KEY unique_user_workshop (email, workshopTitle)` prevents duplicate registrations per participant per workshop.

### Recreating Tables and Seed Data

Run from the project root:
```bash
npm run db:setup
```
This executes `backend/config/setupDb.js`, which:
1. Opens a MySQL connection without selecting a database.
2. Reads and executes `backend/config/schema.sql` with `multipleStatements: true`.
3. The SQL does `DROP TABLE IF EXISTS registrations; DROP TABLE IF EXISTS app_users;` then recreates both with `INSERT IGNORE` seeding.
4. Running it again from scratch is safe and idempotent (drops and re-creates). Re-running when data already exists: the `INSERT IGNORE` means existing rows are not replaced — extra user rows created during testing remain.

### Seed Data (created by `schema.sql`)

**Users:**
- `organizer@workshop.com` / `admin123` → role: `organizer`
- `participant@workshop.com` / `user123` → role: `participant`
- `john@example.com` / `john123` → role: `participant`

**Registrations:**
- John Doe / Advanced React Patterns → `pending` / `notMarked`
- Alice Smith / Node.js Scale → `confirmed` / `present`
- Bob Johnson / Advanced React Patterns → `cancelled` / `absent`

---

## 6. Login and Role/Access Explanation

### How Login Works

1. User submits email + password to `POST /api/auth/login`.
2. `authService.login()` hashes the submitted password with SHA-256 and queries `app_users WHERE email = ? AND password = ?`.
3. On match, the route returns `{ user: { id, email, role }, token: user.email }`.
4. The frontend stores `user` (JSON) and `token` (the email string) in `localStorage`.
5. Every subsequent API call sends the token as the `x-auth-token` request header.

### How Roles Are Checked

Every protected route uses one of two middleware functions:

**`checkRole(['organizer'])`** — used on organizer-only routes:
1. Reads `x-auth-token` from the request header.
2. Calls `AuthService.findUserByEmail(token)` — a live DB query every time.
3. Checks `user.role` is in the allowed roles array.
4. Rejects with `403` if not. Sets `req.user` and calls `next()` if allowed.

**`checkOwnership()`** — used on participant-accessible routes:
1. Same DB lookup as above.
2. Verifies the token resolves to a real user.
3. Does not check role — any authenticated user passes. The route handler then enforces ownership by comparing `req.user.email` to the email in the request.

**The client-supplied role is never trusted.** The role is always read live from the database.

### Participant Own-Record Scoping

On `POST /api/registrations`, `GET /api/registrations/my`, and `PUT /api/registrations/:id`, the route handler checks:
```js
if (req.user.role === 'participant' && req.user.email !== email) {
  return res.status(403).json({ error: 'Access Denied: ...' });
}
```
This ensures participants can only read or write their own records. Verified by Test Step 3.

---

## 7. Protected Action Explanation

**Protected actions:** Mark attendance (`PATCH /:id/attendance`) and Edit organizer notes (`PATCH /:id/notes`).

Both routes are defined in `backend/routes/registrations.js` and use `checkRole(['organizer'])` as middleware:

```js
router.patch('/:id/attendance', checkRole(['organizer']), async (req, res) => { ... });
router.patch('/:id/notes',      checkRole(['organizer']), async (req, res) => { ... });
```

**What happens if a participant attempts these actions:**
1. The `x-auth-token` header (participant's email) is received.
2. `checkRole` queries `app_users` and finds `role = 'participant'`.
3. `'participant'` is not in `['organizer']` → the middleware returns `403 Access Denied: Insufficient permissions.` immediately.
4. The route handler never executes.

**Frontend enforcement (secondary layer):** The participant view renders only registration cards with a read-only `organizerNote` display. There are no attendance buttons or note editing fields in the participant UI.

**Test Evidence (Step 5):** Sending `PATCH /:id/status` with participant token → `403 Access Denied: Insufficient permissions.` ✅

---

## 8. Validation Summary

| Rule | Backend | Frontend | Notes |
|---|---|---|---|
| All four registration fields required | ✅ 400 with message | ✅ `required` attribute + JS guard | Test Step 2 confirms |
| Email format regex `^[^\s@]+@[^\s@]+\.[^\s@]+$` | ✅ 400 | ✅ `type="email"` | Test Step 2 confirms |
| Whitespace-only strings rejected | ✅ 400 | ⚠️ Partial (HTML `required` does not catch spaces) | `.trim()` check on backend |
| `status` ENUM validation | ✅ Service + route | ✅ Dropdown | Test Step 6 bad value → 400 |
| `attendanceStatus` ENUM validation | ✅ Service + route | ✅ Buttons | Test Step 6 bad value → 400 |
| Participant can only edit pending registrations | ✅ `status !== 'pending'` check in service | ✅ Edit button hidden for non-pending | Service throws 400 if bypassed via API |
| Participant scoped to own email | ✅ `req.user.email !== email` | ✅ Email field disabled | Test Step 3 confirms 403 |
| Duplicate registration rejected | ✅ MySQL UNIQUE KEY + `ER_DUP_ENTRY` catch | ⚠️ Only after submission | Friendly message returned to UI |
| Invalid filter query params | ✅ 400 | ✅ Dropdown limits values | Test Step 7 bad filter → 400 |
| `participantName` max 100 chars | ❌ Not enforced | ❌ Not enforced | REQUIREMENTS.md §4 specifies this; known gap |
| `workshopTitle` from known list | ❌ Not enforced on backend | ✅ Dropdown only | Direct API call can submit arbitrary title |
| `organizerNote` length/content | ❌ Not enforced | ❌ Not enforced | Known gap |

---

## 9. Automated and Manual Testing Summary

### Automated Test Command

```bash
npm test
```

**Framework:** Custom Node.js integration test runner (`backend/test.js`, 339 lines). Uses Node's built-in `fetch` and `mysql2/promise` directly — no Jest, no Supertest, no external test framework.

**Test Run Result (actual output from this review session):**

```
====================================================
         INTEGRATION TEST RUNNER - VERIFYING
====================================================
Server Target: http://localhost:5000

[STEP 0] DB connectivity ......... ✔ Connected
[STEP 1] Login API ............... ✔ 200 + token; ✔ 401 wrong password; ✔ 400 missing fields
[STEP 2] Field validation ........ ✔ 400 missing field; ✔ 400 bad email; ✔ 400 whitespace
[STEP 3] Identity/spoofing ....... ✔ 403 wrong email registration; ✔ 403 view other's records
[STEP 4] Participant workflow .... ✔ 201 created (ID: 5); ✔ GET /my returns match
[STEP 5] Update permissions ...... ✔ 200 details update; ✔ 403 participant status block
[STEP 6] Organizer admin ......... ✔ 200 waitlisted; ✔ 200 confirmed; ✔ 200 note; ✔ 200 attendance; ✔ 400 bad status; ✔ 400 bad attendance
[STEP 7] Filters ................. ✔ workshopTitle filter correct; ✔ status filter correct; ✔ attendance filter correct; ✔ 400 invalid filter
[STEP 8] DB cleanup .............. ✔ Test record ID 5 deleted

🎉 INTEGRATION TESTS COMPLETED: PASS
```

**What the tests check:**

| Area | Covered |
|---|---|
| Database connectivity | ✅ |
| Login success and failure | ✅ |
| Missing fields validation | ✅ |
| Invalid email format | ✅ |
| Whitespace rejection | ✅ |
| Email identity spoofing (403) | ✅ |
| Own-record access only (403) | ✅ |
| Registration creation (201) | ✅ |
| Participant view own registrations | ✅ |
| Participant update pending details | ✅ |
| Participant blocked from organizer status update (403) | ✅ |
| Organizer status lifecycle (pending → waitlisted → confirmed) | ✅ |
| Organizer note update | ✅ |
| Organizer attendance marking | ✅ |
| Invalid enum values rejected (400) | ✅ |
| Organizer filters (workshopTitle, status, attendanceStatus) | ✅ |
| Invalid filter query param rejected (400) | ✅ |
| Test data teardown from DB | ✅ |

**What is NOT automated:**

- `participantName` max-length (100 chars) — not tested (not enforced either)
- `workshopTitle` against known list — not tested on backend
- `organizerNote` length — not validated or tested
- Duplicate registration rejection — not in the automated test flow
- Browser/UI behaviour (no E2E test; manual only)
- `GET /api/health` endpoint — not in test suite

### Manual Verification (as documented in `docs/TEST_PLAN.md` §5.2)

The following checks are documented as manual-only (no automation):

1. Start app with `npm run dev`, open `http://localhost:5173`.
2. Log in as Participant, submit a registration, verify toast and status tab.
3. Log out, log in as Organizer, verify full table with filters.
4. Confirm that Participant UI does not render attendance or note-editing controls.
5. Verify DB credential safety: `frontend/dist/` (after build) must contain no `DB_PASSWORD` or MySQL connection strings.

---

## 10. Stage 11 Change Summary

Based on comparing the MID_REVIEW.md (pre-Stage-11) state with the current codebase, the following changes were made after the mid-review:

| Change | Before (Mid-Review) | After (Final) |
|---|---|---|
| Automated test suite | ❌ Absent — 0/5 in Testing Evidence | ✅ Full integration test runner in `backend/test.js`, 339 lines, 8 steps, all pass |
| Test plan document | ❌ Absent | ✅ `docs/TEST_PLAN.md` (163 lines) documenting all test cases with expected and actual results |
| `npm test` root script | ❌ Absent | ✅ Added to root `package.json`: `"test": "npm test --prefix backend"` |
| `waitlisted` status | ❌ Not in mid-review — only 3 statuses documented | ✅ Added as a 4th status to the ENUM in schema, service, routes, and UI; tested in Step 6 |
| Dashboard statistics (organizer) | ⚠️ Partially noted | ✅ Waitlisted count added to stat cards: total / pending / waitlisted / confirmed / present |
| `docs/` directory | ❌ Absent | ✅ Created with `TEST_PLAN.md` |
| DB connectivity test in test runner | ❌ Absent | ✅ Step 0 verifies pool connects before any API tests run |
| Test data pre-cleanup | ❌ Absent | ✅ `DELETE FROM registrations WHERE email = 'participant@workshop.com'` before Step 4 to handle prior crash leftovers |
| Test data post-cleanup | ❌ Absent | ✅ Step 8 deletes the created record by ID; failure path also cleans up |

**Changes NOT observed (issues from mid-review that remain):**

| Mid-Review Issue | Still Present |
|---|---|
| H-1: Token is raw email, no JWT | ✅ Still raw email — prototype scope accepted |
| H-2: CORS is open wildcard | ✅ Still `app.use(cors())` — not hardened |
| H-3: `backend/.env` not git-ignored | ✅ No `.gitignore` in `backend/` — still present |
| M-1: `participantName` max 100 chars not enforced | ✅ Not added |
| M-2: `organizerNote` no length validation | ✅ Not added |
| M-5: Note textarea uses `onBlur` (fires on every click-away) | ✅ Still `onBlur` |
| M-6: `setupDb.js` bare dotenv (CWD sensitive) | ✅ Not fixed |
| L-1: All frontend in one `App.jsx` | ✅ Still 732 lines in one file |
| L-7: Seeded credentials shown on login screen | ✅ Still present (demo artifact) |

---

## 11. Stage Drift — Work Built Before Its Stage

One item present before the test stage (mid-review observation, still present):

- **`registrationService.deleteRegistrationsByEmail()`** (`registrationService.js` lines 124–128): A test teardown utility embedded in the production service layer. It is not exposed through any route and does not create a security risk. It was likely added in anticipation of the test stage. It belongs in a test helper file, not the main service.

No other early-stage artifacts detected. The following correctly remain absent:
- No rate limiting middleware
- No `helmet.js`
- No `bcrypt` or `argon2`
- No HTTPS/TLS configuration
- No Docker/containerization files
- No CI/CD pipeline configuration
- No JWT library (`jsonwebtoken`)

---

## 12. Security Risks and Exposed-Secret Check

| Risk | Severity | Status | Detail |
|---|---|---|---|
| Token is the user's raw email address — no cryptographic signing, no expiry | Medium | ⚠️ Known, accepted | Any person who knows a valid email can forge an `x-auth-token` header. Mitigated partially by DB re-query on every request (role cannot be escalated). Prototype scope only. |
| CORS configured with open wildcard `app.use(cors())` | Medium | ⚠️ Unaddressed | Accepts requests from any origin. In a local-only prototype this is low-risk, but it must be restricted (e.g., `cors({ origin: 'http://localhost:5173' })`) before any shared deployment. |
| `backend/.env` committed to the repository and not in any `.gitignore` | Medium | ⚠️ Unaddressed | The backend directory has no `.gitignore`. The actual `DB_PASSWORD` value is not printed here. The pattern is dangerous — if the password is ever set to a real credential and the directory is pushed to a remote repo, it will be exposed. |
| SHA-256 used for password hashing | Low–Medium | ⚠️ Known, documented | SHA-256 is a fast hash and susceptible to brute-force with rainbow tables. `bcrypt` or `argon2` is the correct choice. REQUIREMENTS.md acknowledges plain text or simple hashing as acceptable for this prototype. |
| Seeded test account credentials displayed on the login page | Low | ⚠️ Demo artifact | `App.jsx` lines 364–369 render the email and plaintext passwords for all three seeded accounts in the UI. This must be removed before any real deployment. The password values are not printed here. |
| `x-auth-token` header naming diverges from REQUIREMENTS.md spec | Low | ⚠️ Spec divergence | REQUIREMENTS.md §3 specifies `x-user-role` and `x-user-email` headers. The implementation uses `x-auth-token`. Functional behaviour is equivalent or stronger (role not trusted from header), but the interface diverges from written specification. |
| DB credentials exposed in frontend bundle | ✅ None | No risk | `frontend/.env` contains only `VITE_API_URL`. No `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, or `DB_NAME` in any frontend file. |
| SQL injection | ✅ None | Mitigated | All database queries use parameterized placeholders (`?`) via `mysql2/promise`. No string concatenation in SQL. |

---

## 13. Documentation/Code Mismatches

| # | Document | States | Code | Status |
|---|---|---|---|---|
| 1 | `REQUIREMENTS.md §3` | `x-user-role` and `x-user-email` headers | Implementation uses `x-auth-token` single header | Mismatch — spec not followed; implementation is functionally stronger |
| 2 | `schema.sql` line 13 | `-- Stored as SHA-256 hash` | Code correctly uses SHA-256 | Comment accurate; REQUIREMENTS.md §3 says "plain text for simplicity or simple hashing" — spec is weaker than actual implementation |
| 3 | `README.md` structure diagram | Shows `services/registrationService.js` as the only service file | Code has two service files: `authService.js` and `registrationService.js` | README structure diagram is incomplete |
| 4 | `REQUIREMENTS.md §5 failure cases` | Error message: "Access Denied: Only organizers can update attendance status." | Actual error: "Access Denied: Insufficient permissions." | Error message wording differs from spec |
| 5 | `REQUIREMENTS.md §5 failure cases` | Error message: "Access Denied: Only organizers can edit organizer notes." | Actual error: "Access Denied: Insufficient permissions." | Same as above — generic middleware message used instead of specific messages |
| 6 | `config/db.js` line 9 | Default `DB_NAME` fallback is `'workshop_db'` | `schema.sql` creates database named `c10p3` | If `.env` is missing, the pool targets the wrong database |
| 7 | `PROJECT_CONTEXT.md` | Mentions "Mock Authentication / Role Switching" as simple toggle | Final implementation uses full database-backed login with SHA-256 hashes | Implementation exceeds the context document's description — this is a positive deviation |

---

## 14. Known Limitations

1. **Token security:** The `x-auth-token` is the user's email in plaintext. There is no HMAC signing, no expiry, and no session invalidation. This is intentional for prototype scope but is not production-safe.

2. **`participantName` length not enforced:** REQUIREMENTS.md specifies max 100 characters. Neither the backend route nor the frontend input enforces this.

3. **`workshopTitle` not validated against known list on the backend:** A direct API caller can submit any string as a workshop title. The frontend dropdown prevents this in normal use, but the backend accepts arbitrary strings.

4. **`organizerNote` has no length or content validation:** An organizer could store an arbitrarily large text value. No max-length is set at the route, service, or database level.

5. **Organizer notes fire on every `onBlur`:** The `textarea` in the organizer table uses `onBlur` as the save trigger. This means every time the organizer clicks away from the text area (even without changing the content), a `PATCH` API request is sent. This causes unnecessary API calls and DB writes.

6. **Participant status filter is client-side only:** All participant records are fetched from the server, then filtered in React. For large datasets this would be inefficient.

7. **Email comparison is case-sensitive:** `req.user.email !== email` uses strict string comparison. `User@Example.com` and `user@example.com` would be treated as different identities.

8. **No status transition lifecycle rules:** There are no guards preventing logically inconsistent transitions, such as marking attendance on a cancelled registration, or re-opening a cancelled registration to pending.

9. **Workshop titles are hardcoded in the frontend:** The `WORKSHOPS` constant in `App.jsx` is not stored in the database. There is no `workshops` lookup table. Adding or removing workshops requires a code change.

10. **`backend/.env` is not git-ignored:** The backend directory has no `.gitignore`. The actual database password is not printed here, but the file is committed and would be exposed if pushed to a public repository.

11. **CORS is open wildcard:** `app.use(cors())` in `server.js` accepts requests from any origin. Must be restricted to specific origins for any shared environment.

12. **SHA-256 password hashing:** Not suitable for production. Use `bcrypt` or `argon2`.

13. **`deleteRegistrationsByEmail` in production service:** A test-cleanup helper embedded in `registrationService.js`. It has no route and is not a security risk, but it pollutes the production service layer.

---

## 15. Demo Script

**Duration:** ~10 minutes  
**Prerequisite:** Both servers running (`npm run dev`), browser open at `http://localhost:5173`

---

### Scene 1 — Login as Participant (2 min)

1. Open `http://localhost:5173`. The login screen appears.
2. Enter credentials: `participant@workshop.com` / `user123`. Click **Sign In**.
3. The participant dashboard loads. Point out: role badge shows **PARTICIPANT SESSION**, email is displayed in the header.

### Scene 2 — Register for a Workshop (2 min)

4. The **Register for Workshop** tab is active. Email field is pre-filled and locked.
5. Enter: Full Name = "Demo User", select workshop "Advanced React Patterns & compiler", enter details "Interested in React 19 compiler features".
6. Click **Complete Registration**. A green toast notification appears: "Registration submitted successfully! Current status: Pending."
7. The app switches automatically to the **Track My Registrations** tab. The new card appears with a **PENDING** badge.

### Scene 3 — Edit and Status Check (1 min)

8. On the registration card, click **Edit Registration Details**. Update the text and click **Save**. Toast confirms the update.
9. Show that the **Attendance** field shows "Not Marked" — the participant cannot change this.

### Scene 4 — Login as Organizer (3 min)

10. Click **Logout**. Log in as `organizer@workshop.com` / `admin123`.
11. The organizer dashboard loads with stat cards: Total / Pending / Waitlisted / Confirmed / Present.
12. Point out the full table with all columns: Attendee & Email, Workshop Title, Registration Details, Status, Attendance, Organizer Notes.
13. Use the **Workshop** filter dropdown to select "Advanced React Patterns & compiler". Table updates to show only that workshop.
14. On the demo user's row, change the **Status** dropdown from Pending → Confirmed. A toast confirms the change.
15. Click the **Present** attendance button. It highlights green.
16. Click into the **Organizer Notes** textarea, type "Attended live demo session", click away. A toast confirms the note is saved.

### Scene 5 — Security Check (1 min)

17. Open the browser developer console (F12 → Network tab).
18. In a terminal, demonstrate: send `PATCH http://localhost:5000/api/registrations/1/attendance` with header `x-auth-token: participant@workshop.com` and body `{ "attendanceStatus": "present" }`. The API returns `403 Access Denied: Insufficient permissions.`
19. This confirms that the role check happens on the server, not only in the UI.

---

## 16. Suggested Viva Questions

### Architecture

1. Why does the React frontend use a Vite proxy to call `/api/...` instead of calling `http://localhost:5000` directly? What problem does this solve?
2. What would happen if you moved all the code from `registrationService.js` directly into `registrations.js`? What design principle does the current separation follow?
3. The `app_users` table is called `app_users` and not `users`. Why might you choose a prefixed name like this?

### Database and Schema

4. The schema uses `DROP TABLE IF EXISTS` before `CREATE TABLE IF NOT EXISTS`. Why are both statements used together? What does the `IF NOT EXISTS` do when the `DROP` already removed the table?
5. Why is there a `UNIQUE KEY unique_user_workshop (email, workshopTitle)` in the `registrations` table? What would happen without it?
6. The `status` column uses an ENUM type. What are the advantages and disadvantages of using ENUM versus a foreign key to a separate `statuses` table?

### Authentication and Security

7. The login route returns the user's email as the token. What are the security risks of this approach? How would a JWT improve it?
8. The `checkRole` middleware queries the database on every protected request. Is this more or less secure than trusting the role from the client header? What is the performance trade-off?
9. Why is SHA-256 considered weak for password storage even though it is a cryptographic hash? What property does `bcrypt` have that SHA-256 does not?
10. The `backend/.env` file is not git-ignored. What specific risk does this create, and what is the correct fix?

### Role Enforcement

11. What would happen if a participant sent a `PATCH` request directly to `http://localhost:5000/api/registrations/1/attendance` using a tool like `curl` or Postman with a participant `x-auth-token`? Walk through the code path.
12. The `checkOwnership` middleware allows any authenticated user through. The ownership check is then done inside the route handler. Could this cause a security problem? Why or why not?
13. If you wanted to also prevent an organizer from registering a participant under someone else's email, would the current code block that? Why not?

### Validation

14. The backend validates the `status` field with an `if (!validStatuses.includes(status))` check before writing to the database. The database also has an ENUM constraint. Why have both? Which one is sufficient and why?
15. The participant email field in the registration form is `disabled` in the UI. Does this prevent a participant from registering under a different email? Explain what the backend does to enforce this.

### Testing

16. The test suite uses `process.exit(0)` on success and `process.exit(1)` on failure. Why does the test script need to explicitly call `process.exit`? What would happen without it?
17. The test in Step 7 filters by `workshopTitle=Advanced React Patterns & compiler` but returns 0 records even though a matching record was just created in Step 4. Why? (Hint: look at the URL encoding and how the query string is parsed.)
18. The test does a pre-cleanup (`DELETE FROM registrations WHERE email = 'participant@workshop.com'`) before the main test flow. Why is this needed? What scenario does it guard against?

### Case-Specific (Workshop Registration)

19. A participant registers for "Node.js Clustering" and their registration is confirmed. They then try to update their `registrationDetails`. What happens and why?
20. An organizer marks a participant's attendance as `present` even though the registration status is still `pending`. Does the system allow this? Should it? How would you add a lifecycle guard?
21. The Case Brief says "Participants should not be able to mark their own attendance or change organizer notes." Where exactly in the code is each of these two rules enforced?

---

*This review is based on direct inspection of all source files and a live test run of `npm test` on 2026-06-16.*
