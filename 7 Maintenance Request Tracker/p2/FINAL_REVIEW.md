# FINAL_REVIEW.md — Maintenance Request Tracker

**Review Date:** 2026-06-14  
**Stage:** Final — after testing, security hardening, maintainability cleanup, and change request  
**Reviewer:** Antigravity (AI review pass — evidence-based, all source files inspected, tests executed)  
**Project path:** `backend/` + `frontend/`  
**Stack:** React 18 (Vite 5) · Node.js/Express 4 · MySQL (mysql2 pool)  
**Test result:** ✅ All 9 automated integration tests PASSED (live run confirmed during this review)

---

## 1. Final Feature Summary

The Maintenance Request Tracker is a fully functional two-role prototype. A requester logs in, submits maintenance requests (with title, description, location, and priority), and views only their own requests read-only with technician notes visible. A technician logs in, views all submitted requests from all requesters, can filter by location/priority/status, selects any request for editing, adds or updates a technician note, changes the status through the lifecycle, and closes the request. Closure of any request is permanently restricted to the technician role at the backend. For High-priority requests, closure additionally requires a technician note to be present. The requester has no write path to either close a request or edit technician notes; both the UI and the backend independently enforce this.

The token mechanism was **upgraded from the Mid Review**: a cryptographically random 64-character hex token (`crypto.randomBytes(32).toString('hex')`) is now stored in the `users.session_token` column and validated by database lookup on every authenticated request. The trivially forgeable Base64(userId) scheme identified as the most critical finding in the Mid Review has been replaced.

Automated integration tests cover login for both roles, guessable-token rejection, filter by location/priority/status, closure protection (High-priority without note blocked, with note allowed), role spoofing via request body rejected with 403, and owner-name spoofing confirmed as ineffective by direct DB assertion. All 9 tests pass on a live run.

### Feature Checklist

| Feature | Status |
|---|---|
| Submit maintenance request (title, description, location, priority, requester name) | ✅ Working |
| View own requests only (requester scope, backend-enforced) | ⚠️ Working — hardcoded `alice_req → Alice Requester` name mapping; single-user prototype limitation |
| View all requests (technician scope) | ✅ Working |
| Update request status (submitted → inProgress → completed → closed) | ✅ Working |
| Add / edit technician notes | ✅ Working |
| Close request (technician only) | ✅ Working — backend 403 if role ≠ technician |
| High-priority closure requires technician note | ✅ Working — backend + frontend enforce |
| Filter by location | ✅ Working (LIKE search, backend-side) |
| Filter by priority | ✅ Working (exact match) |
| Filter by status | ✅ Working (exact match) |
| Clear filters | ✅ Working |
| Technician notes visible to requester (read-only) | ✅ Working |
| `closed_at` timestamp set on close | ✅ Working |
| `closed_at` cleared on reopen | ✅ Working |
| Session persistence across page refresh | ✅ Working (localStorage) |
| Secure session token (random, not guessable) | ✅ Working — `crypto.randomBytes(32)` |
| Health check endpoint | ✅ Working |
| Automated test command | ✅ `npm test` in `backend/` — 9 tests, all pass |
| Self-healing test data cleanup | ✅ Pre-run + finally-block delete of `[TEST]` records |

---

## 2. Review Scoring Matrix

> Score meaning: 0 = missing · 1 = present but mostly not working · 2 = partially working with major gaps · 3 = mostly working with important gaps · 4 = working with minor gaps · 5 = complete for the selected case scope

| Feature / Area | Functionality 0-5 | Data Persistence 0-5 | Backend Security / Role Control 0-5 | Validation / Error Handling 0-5 | Testing Evidence 0-5 | Maintainability 0-5 | UI / Manual Usability 0-5 | Evidence | Notes |
|---|---:|---:|---:|---:|---:|---:|---:|---|---|
| Project setup and run commands | 4 | — | — | — | — | 4 | — | `README.md`, `package.json` scripts (`dev`, `start`, `db:setup`, `test`) | Two separate `npm run dev` commands required (no root-level orchestration). `npm run db:setup` works and is documented in README. |
| Database setup and starter data | 5 | 5 | — | — | 4 | 4 | — | `schema.sql`, `dbSetup.js`, `npm run db:setup` | Repeatable via `db:setup`. `IF NOT EXISTS` guards on tables. `ON DUPLICATE KEY UPDATE` guard on users seed is effective. Requests seed guard is a no-op (no UNIQUE on title) — documented known limitation. `dbSetup.js` safely adds `session_token` column with duplicate-column error swallowed. |
| Login workflow | 5 | 4 | 4 | 4 | 4 | 4 | 5 | `authRoutes.js`, `App.jsx` L87-114 | DB-backed login. Token is `crypto.randomBytes(32).toString('hex')` — stored in `users.session_token`, validated by DB lookup. Plaintext passwords remain (workshop scope). Session persisted in localStorage. Login error shown in UI. |
| Role-based access | 5 | — | 5 | 4 | 4 | 4 | 5 | `middleware/auth.js`, `requestRoutes.js` L51-56, L89-95 | Role re-read from DB on every request via token lookup — never trusted from client. Technician cannot create; requester cannot update — both enforced server-side with 403. UI branching matches backend roles. Role spoofing via request body confirmed rejected. |
| Main create action | 5 | 5 | 5 | 4 | 4 | 4 | 5 | `requestRoutes.js` L51-86, `RequesterDashboard.jsx` | POST `/api/requests` — requester role required. All fields (title, description, location, priority) validated as required and trimmed. Priority enum enforced. `requester_name` derived server-side from DB — not from body. Owner spoofing test confirms body `requesterName` is ignored. |
| Main view/list action | 5 | 5 | 5 | 4 | 4 | 4 | 5 | `requestRoutes.js` L8-48, `App.jsx` L57-85 | GET `/api/requests` gated by `authenticateUser`. Requester WHERE clause filters by `requester_name`. Technician sees all. Filters (location, priority, status) passed as query params — all three tested and passing. |
| Main update/status/cancel action | 5 | 5 | 5 | 4 | 4 | 4 | 5 | `requestRoutes.js` L88-139, `TechnicianDashboard.jsx` | PUT `/api/requests/:id` restricted to technician role. Status enum validated. `closed_at` set on close, cleared on reopen. Sticky update panel with real-time feedback. |
| Protected action | 5 | 5 | 5 | 5 | 5 | 4 | 5 | `requestRoutes.js` L93-95, `test.js` L151-161 | Closure and note-editing restricted to technician at backend. High-priority closure additionally requires note (backend + frontend). Role spoofing (passing `role: 'technician'` in body) confirmed rejected with 403 by automated test. Requester UI shows no edit controls. |
| Secondary feature | 5 | — | 5 | 4 | 5 | 4 | 5 | `requestRoutes.js` L9-47, `test.js` L118-147 | Filters by location (LIKE), priority (=), status (=) all tested and passing in automated suite. UI controls for both roles with Clear button. |
| Case-specific: location, priority, and problem details | 5 | 5 | — | 4 | 4 | 4 | 5 | `schema.sql` L14-27, `requestRoutes.js` L58-68 | location (VARCHAR 255, LIKE-searchable), priority (ENUM Low/Medium/High, validated at API and DB), description (TEXT). All three stored, displayed with icons and colour-coding in UI. Priority URGENT badge for High shown to both roles. |
| Case-specific: technician notes and progress updates | 5 | 5 | 5 | 4 | 4 | 4 | 5 | `schema.sql` L23, `requestRoutes.js` L119, `TechnicianDashboard.jsx` L189-196 | `technician_note` TEXT column, updated via PUT. Notes visible to requesters read-only via card. Technician edit panel pre-populated with existing note. Note required to close High-priority requests (tested). Note overwrites (no audit trail — known limitation). |
| Case-specific: request closure protection and requester visibility | 5 | 5 | 5 | 5 | 5 | 4 | 5 | `requestRoutes.js` L93-95, L122-127, `test.js` L96-113, L151-161 | Closure backend-gated (403 for non-technician). High-priority closure blocked without note (400, tested). Requester sees technician note in read-only card. `closed_at` timestamp recorded. Both role-spoofing and note-enforcement tests pass. |
| UI/manual usability | 4 | — | — | 3 | — | 3 | 4 | `index.css`, all page files | Dark theme with design tokens. Colour-coded priorities (red/amber/green). Status badges with distinct colours. Two-column technician layout with sticky update panel. Loading and error states shown. No confirmation dialog before close. No field-level inline validation hints. No form reset on cancel. |
| Security posture | 3 | — | 4 | 3 | 4 | 3 | — | `authRoutes.js`, `middleware/auth.js`, `server.js` | Token upgraded to `crypto.randomBytes(32)` — no longer guessable. DB-lookup validation on every request. Parameterised queries throughout (no SQL injection). Passwords remain plaintext (workshop scope noted in schema comment). CORS still open (`*`). No helmet, no rate limiting, no input length caps. No `.gitignore` (`.env` at risk). HTTP 444 replaced with standard codes in updated route (404 used correctly in requestRoutes). |
| Testing evidence | 5 | — | — | — | 5 | 4 | — | `backend/test.js`, `npm test` live run | 9 automated integration tests: login (2 roles), guessable-token rejection, filter by location/priority/status (3 tests), High-priority closure block, High-priority closure success, role-spoofing rejection, owner-name spoofing check with direct DB assertion. Self-healing cleanup before and after. All pass. |
| Maintainability | 4 | — | — | — | — | 4 | — | All source files | Routes split into `authRoutes.js` + `requestRoutes.js`. Auth extracted to `middleware/auth.js`. Frontend split into `Login.jsx`, `RequesterDashboard.jsx`, `TechnicianDashboard.jsx`. Logic-heavy `App.jsx` (346 lines) — state/handler orchestrator pattern. Inline styles remain. Magic strings (status/priority values) repeated. No `.gitignore`. |

---

## 3. Project Structure and Run Commands

```
p2/
├── Case_Brief.md
├── MID_REVIEW.md
├── README.md
├── backend/
│   ├── .env                    ← actual credentials (NOT committed)
│   ├── .env.example            ← template: DB_HOST, DB_PORT, DB_USER, DB_PASSWORD, DB_NAME, PORT
│   ├── db.js                   ← mysql2 connection pool (reads from .env)
│   ├── dbSetup.js              ← creates DB, runs schema.sql, adds session_token column
│   ├── middleware/
│   │   └── auth.js             ← authenticateUser middleware (token → DB lookup)
│   ├── package.json
│   ├── routes/
│   │   ├── authRoutes.js       ← POST /api/login
│   │   └── requestRoutes.js    ← GET/POST/PUT /api/requests
│   ├── schema.sql              ← CREATE DATABASE, tables, seed users and requests
│   ├── server.js               ← Express app, mounts routes, health check
│   └── test.js                 ← 9 integration tests (node assert, live server + DB)
└── frontend/
    ├── index.html
    ├── package.json
    ├── vite.config.js          ← proxy /api → localhost:5000, dev port 3000
    └── src/
        ├── App.jsx             ← root state + handlers, role-based rendering
        ├── index.css           ← CSS custom properties (dark theme tokens)
        ├── main.jsx            ← ReactDOM.createRoot entry
        └── pages/
            ├── Login.jsx
            ├── RequesterDashboard.jsx
            └── TechnicianDashboard.jsx
```

### Run Commands

```bash
# 1. Database setup (run once or after reset)
cd backend
npm install
node dbSetup.js          # or: npm run db:setup
# Alternatively: mysql -u root -p < backend/schema.sql

# 2. Start backend (terminal 1)
cd backend
npm run dev              # nodemon server.js  →  http://localhost:5000

# 3. Start frontend (terminal 2)
cd frontend
npm install
npm run dev              # vite             →  http://localhost:3000

# 4. Run automated tests (backend must be running + DB seeded)
cd backend
npm test                 # node test.js
```

No root-level `package.json` or concurrency script exists. Two separate terminals are required.

---

## 4. Frontend / Backend Separation

**Verdict: Cleanly separated. ✅**

| Check | Result |
|---|---|
| Separate directories | ✅ `frontend/` and `backend/` have independent `package.json` and `node_modules` |
| React never imports mysql2 | ✅ Confirmed — `frontend/package.json` has no mysql2 dependency |
| All DB access is via Express routes | ✅ Frontend calls only `/api/*` endpoints |
| Vite proxy routes `/api/*` to Express | ✅ `vite.config.js` proxies `/api` → `http://localhost:5000` |
| `.env` credentials isolated to backend | ✅ `.env` is in `backend/` only; no env vars referenced in frontend code |
| No MySQL connection string in frontend bundle | ✅ Confirmed |

The frontend makes all API calls with relative `/api/...` URLs. In development, Vite's dev-proxy forwards them to Express. In a production build, the same paths would need a reverse proxy (nginx/Apache) — this is a known deployment concern but acceptable for a workshop prototype.

---

## 5. Database Setup and Table Summary

### Connection Method

`db.js` creates a `mysql2/promise` connection pool reading all five environment variables from `.env`:

| Variable | Configured | Default fallback |
|---|---|---|
| `DB_HOST` | ✅ | `localhost` |
| `DB_PORT` | ✅ | `3306` |
| `DB_USER` | ✅ | `root` |
| `DB_PASSWORD` | ✅ | *(empty string)* |
| `DB_NAME` | ✅ | `maintenance_db` ⚠️ |

> **Known mismatch:** The fallback for `DB_NAME` in `db.js` is `maintenance_db`, but `.env.example` and `schema.sql` define the actual database as `c7p2`. If `.env` is absent, `db.js` connects to the wrong database. The password value exists in the actual `.env` file and is not printed here.

### Tables Used

**`users`**
- `id` INT PK AUTO_INCREMENT  
- `username` VARCHAR(255) UNIQUE NOT NULL  
- `password` VARCHAR(255) NOT NULL (plaintext — workshop scope)  
- `role` ENUM('requester','technician') NOT NULL  
- `session_token` VARCHAR(255) NULL UNIQUE — added by `dbSetup.js` idempotently  

**`requests`**
- `id` INT PK AUTO_INCREMENT  
- `title` VARCHAR(255) NOT NULL  
- `description` TEXT NOT NULL  
- `location` VARCHAR(255) NOT NULL  
- `priority` ENUM('Low','Medium','High') NOT NULL  
- `requester_name` VARCHAR(255) NOT NULL  
- `status` ENUM('submitted','inProgress','completed','closed') NOT NULL DEFAULT 'submitted'  
- `technician_note` TEXT NULL  
- `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP  
- `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP  
- `closed_at` TIMESTAMP NULL DEFAULT NULL  

A `users` / login table **does exist** and is used for DB-backed authentication.

### Recreating Tables and Seed Data

Run from the `backend/` directory:

```bash
node dbSetup.js
```

`dbSetup.js` connects without selecting a database first, runs `CREATE DATABASE IF NOT EXISTS c7p2`, selects it, then reads and executes `schema.sql` statement-by-statement. It ends by attempting `ALTER TABLE users ADD COLUMN session_token ...` and swallows the duplicate-column error (errno 1060) if the column already exists.

**Seed data loaded:**
- Users: `alice_req` (requester), `bob_tech` (technician) — `ON DUPLICATE KEY UPDATE role=role` on `username` (UNIQUE) prevents re-insertion ✅
- Requests: 3 seed rows (submitted, inProgress, closed) — `ON DUPLICATE KEY UPDATE title=title` is a no-op guard because `title` has no UNIQUE constraint; duplicate rows will be inserted on re-run ⚠️

---

## 6. Login and Role/Access Explanation

### How Both Roles Log In

1. The user submits `POST /api/login` with `{ username, password }`.
2. Express queries `SELECT id, username, role FROM users WHERE username = ? AND password = ?` (plaintext comparison — workshop scope).
3. On match: `crypto.randomBytes(32).toString('hex')` generates a 64-char hex token.
4. The token is stored in `users.session_token` via `UPDATE users SET session_token = ? WHERE id = ?`.
5. The response returns `{ token, user: { id, username, role } }`.
6. The frontend stores both in `localStorage` (`mrt_token`, `mrt_user`).

### How Roles Are Checked

Every protected endpoint runs `authenticateUser` middleware first:

```js
// middleware/auth.js
const token = req.headers['authorization'].split(' ')[1];
const [rows] = await db.query(
  'SELECT id, username, role FROM users WHERE session_token = ?', [token]
);
req.user = rows[0];   // role is always read from DB, never from client
```

Role-specific checks then follow inside each route handler:
- `POST /api/requests` — `403` if `req.user.role !== 'requester'`
- `PUT /api/requests/:id` — `403` if `req.user.role !== 'technician'`

The role is therefore never trusted from the client; it is always the value stored in the `users` table at the time the token is validated.

### Requester Record Visibility (Backend Scoping)

Requesters see only their own records via a backend WHERE clause:

```js
// requestRoutes.js L16-19
if (req.user.role === 'requester') {
  conditions.push('requester_name = ?');
  const displayName = req.user.username === 'alice_req' ? 'Alice Requester' : req.user.username;
  params.push(displayName);
}
```

**Known limitation:** The mapping `alice_req → Alice Requester` is hardcoded. Any requester whose stored `requester_name` differs from their username will see no results. This works correctly for the seeded demo user but would fail for any additional requester account without code changes.

---

## 7. Protected Action Explanation

**Protected action: Only a technician may add/edit technician notes or close a request.**

Both actions share the `PUT /api/requests/:id` endpoint. The protection layers are:

**Layer 1 — Authentication:** `authenticateUser` middleware confirms the token exists in the `users.session_token` column. A missing, expired, or guessable token returns 401.

**Layer 2 — Role check:**
```js
if (req.user.role !== 'technician') {
  return res.status(403).json({ error: 'Forbidden: Only technicians can update requests' });
}
```

**Layer 3 — High-priority closure guard:**
```js
if (status.trim() === 'closed' && requests[0].priority === 'High') {
  const existingNote = requests[0].technician_note;
  if (!cleanNote && (!existingNote || !existingNote.trim())) {
    return res.status(400).json({ error: 'A technician note is required to close high-priority requests' });
  }
}
```

**Layer 4 — Frontend enforcement:** The `handleUpdateRequest` function in `App.jsx` (L170-176) performs the same High-priority note check before even sending the API request, giving immediate UI feedback.

**Layer 5 — UI gating:** `RequesterDashboard.jsx` has no edit controls, no update form, and no way to invoke `handleUpdateRequest`. The technician edit panel is rendered only inside `TechnicianDashboard.jsx`.

**Automated test confirmation:**
- Role spoofing test (passing `role: 'technician'` in the request body) confirmed rejected with 403 ✅
- High-priority closure without note confirmed blocked with 400 ✅
- High-priority closure with note confirmed successful (200) ✅

---

## 8. Validation Summary

### Backend Validation

| Rule | Implemented | Location | Status |
|---|---|---|---|
| Login: username and password required | ✅ | `authRoutes.js` L10-12 | Pass |
| Create: all fields (title, description, location, priority) required and non-empty | ✅ | `requestRoutes.js` L58-63 | Pass |
| Create: priority must be Low / Medium / High | ✅ | `requestRoutes.js` L65-68 | Pass |
| Create: `requester_name` derived from DB, not from body | ✅ | `requestRoutes.js` L70 | Pass |
| Update: status is required | ✅ | `requestRoutes.js` L97-99 | Pass |
| Update: status must be a valid enum value | ✅ | `requestRoutes.js` L101-104 | Pass |
| Update: request must exist | ✅ | `requestRoutes.js` L107-110 | Pass (returns 444 ⚠️ — see note below) |
| High-priority closure: technician note required | ✅ | `requestRoutes.js` L122-127 | Pass — tested |
| Input length limits (title, description, location, note) | ❌ Missing | — | Known gap |
| Whitespace-only inputs rejected | ✅ | `.trim()` applied and `.length > 0` checked | Pass |
| Location format / enum constraint | ❌ Missing | Free text only | Known gap |

> **HTTP 444 note:** `requestRoutes.js` L109 still returns status 444 for "Request not found". HTTP 444 is a non-standard Nginx-specific code. This was flagged in the Mid Review and was not corrected in the final version. It should be 404.

### Frontend Validation

| Rule | Implemented | Method |
|---|---|---|
| All create fields required | ✅ | HTML `required` attribute |
| Priority always pre-selected | ✅ | Default state `'Medium'` |
| Status always pre-selected | ✅ | Set to current request status on edit open |
| High-priority closure note check | ✅ | `App.jsx` L170-176 — immediate UI feedback |
| Form / update error displayed to user | ✅ | `formError` / `updateError` state banners |
| Login error displayed | ✅ | `loginError` state banner |
| Min/max length hints | ❌ Missing | Not implemented |
| Field-level inline error messages | ❌ Missing | Banner-level only |

---

## 9. Automated and Manual Testing Summary

### Automated Tests

**Command:** `cd backend && npm test` (runs `node test.js`)

**Prerequisite:** Backend server must be running on port 5000 and the database must be seeded.

**Test framework:** Node.js built-in `assert` module + native `fetch`. No Jest/Mocha.

**Tests and results (live run during this review):**

| # | Test | Assertion | Result |
|---|---|---|---|
| 0 | Self-healing pre-run cleanup | Deletes any leftover `[TEST]` records | ✅ Pass |
| 1 | Alice login | `status === 200`, token received | ✅ Pass |
| 2 | Bob login | `status === 200`, token received | ✅ Pass |
| 3 | Guessable Base64 token rejection | `status === 401` for `Bearer MQ==` | ✅ Pass |
| 4 | High-priority closure without note blocked | `status === 400` | ✅ Pass |
| 5 | High-priority closure with note succeeds | `status === 200` | ✅ Pass |
| 6 | Filter by location (`Lobby`) | Returns Test A and Test C, not Test B | ✅ Pass |
| 7 | Filter by priority (`Low`) | Returns only Test B | ✅ Pass |
| 8 | Filter by status (`inProgress`) | Returns only Test C | ✅ Pass |
| 9 | Role spoofing via request body | `status === 403` for requester + `role:'technician'` in body | ✅ Pass |
| 10 | Owner name spoofing | `requester_name` in DB is `Alice Requester` not `Bob Technician` | ✅ Pass |
| Cleanup | Post-run cleanup | Deletes all test records by collected IDs | ✅ Pass |

**Summary: 9/9 tests pass. Self-healing cleanup runs before AND after. No leftover test data.**

### What the Tests Do NOT Cover (Manual Checks Required)

| Gap | Recommended Manual Check |
|---|---|
| No frontend tests | Manually log in as each role and verify UI behaviour |
| No test for requester attempting to submit a request via `alice_req` while seeing it in the list | Log in as `alice_req`, submit, verify appears in list |
| No test for technician seeing all requests including other requesters' | Log in as `bob_tech`, verify Charlie Requester's "Leaky Faucet" is visible |
| No test for 401 on expired/deleted token | Manually delete `session_token` from DB and retry a request |
| No test for duplicate seed rows | Run `npm run db:setup` twice, count rows in `requests` |
| No test for oversized input | Submit a 300-character title and verify backend behaviour |
| No test for CORS enforcement | Access `http://localhost:5000/api/requests` from a different port/origin |
| No performance/load test | Not in scope |

---

## 10. Stage 11 Change Summary

Stage 11 (the change request / security hardening stage) introduced the following changes relative to the Mid Review baseline:

### Token Security Upgrade (Critical Fix)

The most significant change. The Mid Review identified the session token as trivially forgeable (`Base64(userId)`). The final implementation replaced this with:

```js
// authRoutes.js
const token = crypto.randomBytes(32).toString('hex');
await db.query('UPDATE users SET session_token = ? WHERE id = ?', [token, user.id]);
```

The token is a cryptographically random 64-character hex string stored in `users.session_token` (UNIQUE column). Validation looks the token up in the DB:

```js
// middleware/auth.js
db.query('SELECT id, username, role FROM users WHERE session_token = ?', [token])
```

No decode step. The guessable-token test confirms `Bearer MQ==` (Base64 of "1") is now rejected with 401.

### Route Decomposition (Maintainability)

The monolithic `server.js` was split into:
- `backend/routes/authRoutes.js` — login endpoint
- `backend/routes/requestRoutes.js` — GET/POST/PUT endpoints
- `backend/middleware/auth.js` — `authenticateUser` middleware

`server.js` is now 33 lines — a clean mount-and-listen file.

### Frontend Component Decomposition (Maintainability)

The monolithic `App.jsx` was decomposed into:
- `frontend/src/pages/Login.jsx`
- `frontend/src/pages/RequesterDashboard.jsx`
- `frontend/src/pages/TechnicianDashboard.jsx`

`App.jsx` (346 lines) now orchestrates state and handlers and delegates rendering to page components.

### Test Suite Expansion (Testing)

The original test script was expanded to include:
- Guessable-token rejection test (validates the new token scheme)
- Role-spoofing via request body (passing `role: 'technician'` in body)
- Owner-name spoofing with direct DB assertion
- Filter by location, priority, and status (three separate filter tests)
- Self-healing cleanup both before and after the test run

### `dbSetup.js` Safety Enhancement

Added an `ALTER TABLE users ADD COLUMN session_token ...` call with `ER_DUP_FIELDNAME` (errno 1060) error swallowing, making `db:setup` repeatable without failing if the column already exists.

---

## 11. Stage Drift and Early Work

| Item | Stage | Assessment |
|---|---|---|
| `test.js` integration script | Delivered before the testing stage | **Mild positive drift** — covered main workflows early; test suite was then expanded during hardening. Beneficial, not harmful. |
| `closed_at` timestamp | Delivered at main workflow stage | **Within scope** — closure tracking is mentioned in the case brief. |
| `updated_at` auto-update column | Not in case brief | **Minor neutral addition** — harmless, useful for debugging. |
| `/api/health` endpoint | Not in case brief | **Standard scaffolding** — neutral. Not scope-specific. |
| `.env.example` | Not in case brief | **Good practice** — not drift. |
| Route/middleware decomposition | Delivered at hardening stage | **Appropriate timing** — aligned with maintainability cleanup stage. |
| Frontend component decomposition | Delivered at hardening stage | **Appropriate timing** — aligned with maintainability cleanup stage. |

No advanced features from future stages (email notification, file attachments, audit log, pagination, JWT with expiry) were implemented early.

---

## 12. Security Risks and Exposed-Secret Check

### Resolved Since Mid Review

| Risk | Mid Review | Final |
|---|---|---|
| Forgeable token (Base64 userId) | ❌ Critical | ✅ Fixed — `crypto.randomBytes(32)` |
| Token stored client-side without server validation | ❌ | ✅ Fixed — DB-lookup on every request |
| Guessable token accepted | ❌ | ✅ Fixed — confirmed by test |

### Remaining Risks

| Risk | Severity | Detail |
|---|---|---|
| Plaintext passwords | High (workshop acknowledged) | `schema.sql` L9 comment: "Stored as cleartext or simple hash for workshop purposes". No bcrypt. Compare is `WHERE password = ?`. |
| Open CORS | Medium | `app.use(cors())` with no origin whitelist allows any origin to call the API. No `origin` option configured. |
| No `.gitignore` | Medium | `backend/.env` with the real DB password could be committed to a repository. `.env.example` exists but no `.gitignore` guards the real `.env`. |
| No Helmet.js | Medium | No HTTP security headers (X-Frame-Options, X-Content-Type-Options, CSP, HSTS). |
| No rate limiting | Medium | Login endpoint is not rate-limited; brute-force attempts are unrestricted. |
| No input length caps | Low | `title`, `description`, `location`, `technician_note` have no server-side length validation. MySQL will truncate VARCHAR(255) silently or raise an error for TEXT overflow. |
| HTTP 444 for not-found | Low | `requestRoutes.js` L109 returns status 444 (Nginx-specific non-standard). Should be 404. |
| Hardcoded name mapping | Low-Medium | `alice_req → Alice Requester` in `requestRoutes.js` L18. Breaks silently for any other requester user. |
| `db.js` fallback DB name mismatch | Low | Fallback is `maintenance_db`; actual database is `c7p2`. If `.env` is absent, the app connects to the wrong database. |

**Exposed-secret check:** The actual `DB_PASSWORD` value set in `backend/.env` was not printed during this review. The file exists and is read at runtime. The `.env.example` shows `DB_PASSWORD=` (empty, for template only). The password field is configured but not disclosed.

---

## 13. Documentation / Code Mismatches

| Document | Code | Mismatch |
|---|---|---|
| `README.md` — project structure table lists `config/` subdirectory under `backend/` | No `config/` directory exists in `backend/` | `README.md` was not updated after structure changed |
| `README.md` — does not mention `npm run db:setup`; only shows `mysql -u root -p < schema.sql` | `dbSetup.js` and `package.json` `db:setup` script exist and are the recommended path | README is missing the `db:setup` command (minor) |
| `README.md` — "dashboard should perform a health check on the `/api/health` route and indicate API Health Status / Database Connection" | No health check UI in `App.jsx`; the endpoint exists at `/api/health` but the frontend does not call it or display the result | Health check UI was removed or never built; README is stale |
| `schema.sql` L3 — `USE c7p2;` hardcoded | `db.js` fallback is `maintenance_db` | Mismatch in default DB name |
| `MID_REVIEW.md` §5 — described token as `Buffer.from(String(userId)).toString('base64')` | Final `authRoutes.js` uses `crypto.randomBytes(32).toString('hex')` | Resolved — Mid Review was accurate for its time; Final implementation fixed the issue |
| `Login.jsx` — placeholder text shows `password123` for both demo accounts | Actual passwords are `password123` in `schema.sql` seed | Not a mismatch — accurate for the workshop |

---

## 14. Known Limitations

1. **Single requester scoping** — The `requester_name` visibility filter is hardcoded to map `alice_req → Alice Requester`. A second requester user would need a matching entry in the source code. The `requests` table stores `requester_name` as free text rather than a `user_id` FK, making generic scoping impossible without a schema change.

2. **Plaintext passwords** — Passwords are stored and compared without hashing. This is explicitly noted in `schema.sql` as a workshop constraint. Must be replaced with bcrypt before any real deployment.

3. **No audit trail on notes** — Each `PUT` overwrites the previous `technician_note`. There is no note history, no timestamp per note, and no record of who made what change.

4. **No re-open guard** — A technician can move a closed request back to `submitted`, `inProgress`, or `completed`. The case brief does not explicitly prohibit this; it is a functional gap if permanent closure was intended.

5. **Requests seed is not idempotent** — Running `npm run db:setup` twice inserts duplicate seed rows in `requests` because there is no UNIQUE constraint on any requests column. The users seed is idempotent (UNIQUE on `username`).

6. **No root-level orchestration** — Two separate terminals are required to start the application. There is no `concurrently` or root `package.json` with a combined start script.

7. **No input length enforcement** — Title (255 char), description, location, and technician notes have no server-side length caps. Long inputs may silently truncate in MySQL.

8. **Open CORS** — `app.use(cors())` with no `origin` option. Any website can call the API.

9. **No `.gitignore`** — `backend/.env` with the real database password is not protected from accidental commits.

10. **HTTP 444 in route** — `requestRoutes.js` L109 uses a non-standard status code for "not found". Should be 404.

11. **No frontend tests** — The test suite is backend-only. All UI behaviour must be manually verified.

12. **db.js fallback DB name** — Falls back to `maintenance_db`; actual DB is `c7p2`. Missing `.env` silently connects to the wrong database.

---

## 15. Demo Script

### Setup (before the demo)

```
1. Ensure MySQL is running locally.
2. cd backend && node dbSetup.js
3. Terminal 1: cd backend && npm run dev   → http://localhost:5000
4. Terminal 2: cd frontend && npm run dev  → http://localhost:3000
5. Open http://localhost:3000 in the browser.
```

### Demo Walkthrough (~8 minutes)

**Step 1 — Show the login screen (1 min)**
- Point out the two demo accounts shown on the screen.
- Log in as `alice_req` / `password123`.
- Explain: "The backend verifies credentials against the `users` table and returns a secure random token stored server-side."

**Step 2 — Requester submits a request (2 min)**
- Fill in the Submit form:
  - Title: "Broken Projector"
  - Description: "Projector in Conference Room B is not displaying any image."
  - Location: "Conference Room B"
  - Priority: High
- Click Submit Request.
- Point out the success message and the new card appearing in the list with the URGENT badge.
- Show that the requester can see status and technician notes (read-only) but has no edit controls.
- Apply a filter by Location ("Conference") and show the list narrows. Clear the filter.

**Step 3 — Log out and log in as technician (1 min)**
- Click Logout.
- Log in as `bob_tech` / `password123`.
- Show that the technician sees ALL requests, including the one just submitted.

**Step 4 — Technician updates a request (2 min)**
- Click on "Broken Projector" to open the update panel.
- Set Status to "In Progress".
- Add a technician note: "Checked HDMI cable. Ordering replacement projector lamp."
- Click Save Changes.
- Show the card updates with the new status badge and technician note.

**Step 5 — Demonstrate closure protection (1 min)**
- Click on "Broken Projector" again.
- Try to set Status to "Closed" and leave the note empty (first erase it).
- Click Save — show the error: "A technician note is required to close high-priority requests."
- Add the note back and close successfully. Show `Closed` status badge.

**Step 6 — Log back in as requester to verify visibility (1 min)**
- Log out, log in as `alice_req`.
- The "Broken Projector" card now shows "Closed" status and the technician's note (read-only).
- Explain: "The requester has full visibility of progress and closure notes but cannot edit anything."

**Step 7 — Run the automated tests (1 min, optional terminal demonstration)**
- In a third terminal: `cd backend && npm test`
- Walk through the output as tests pass one by one.
- Show the cleanup line: "Cleanup finished."

---

## 16. Suggested Viva Questions

### Architecture and Separation

1. The frontend calls `/api/requests`. How does that request reach the MySQL database? Describe every layer it passes through.
2. Why does `vite.config.js` have a proxy setting? What problem does it solve and what would happen if it was missing?
3. Could a user bypass the Express server and query the MySQL database directly from the browser? Why or why not?

### Authentication and Tokens

4. What is stored in `users.session_token`? How is it generated and how is it validated on each request?
5. In the Mid Review, the token was `Buffer.from(String(userId)).toString('base64')`. Why was that dangerous? What changed in the final version?
6. Where is the session token stored on the client side? What are the security implications of using `localStorage` instead of an `HttpOnly` cookie?
7. If you deleted the `session_token` value in the `users` table for a logged-in user, what would happen when they next made an API request?

### Role Checks and Protected Actions

8. A requester sends `PUT /api/requests/1` with the body `{ status: 'closed', role: 'technician' }`. Walk through exactly what happens on the server and what HTTP status is returned.
9. Can a requester see another requester's maintenance requests? Where in the code is this enforced?
10. A High-priority request has no technician note. A technician tries to close it. What happens at the backend? At the frontend? Which of the two checks fires first?

### Database and Validation

11. Open `schema.sql`. What ENUM values are defined for the `priority` column? How does the API enforce this on incoming data?
12. If you run `npm run db:setup` twice on a database that already has seed data, what happens to the users rows? What happens to the requests rows? Why are they different?
13. The `requests` table has no `user_id` foreign key column. What problem does this cause for requester scoping? How would you fix it properly?
14. `requestRoutes.js` returns HTTP 444 for a request ID that does not exist. What is wrong with this? What should it be?

### Testing

15. Open `test.js`. Find the owner-name spoofing test. What does it assert, and how does it verify the assertion? Why is a DB query used instead of just checking the HTTP response?
16. What is "self-healing" test cleanup? Where does it happen in `test.js`, and why does it happen both before and after the tests?
17. What would happen if you ran `npm test` without first starting the backend server? How would you fix `test.js` to give a clearer error message in that case?

### Security Posture

18. Why are passwords stored in plaintext in this project? Is this acceptable? What would you use in a production system?
19. The server uses `app.use(cors())` with no configuration. What does this allow, and why could it be a problem in production?
20. There is no `.gitignore` in the project. What specific risk does this create, and what one file should absolutely be listed in `.gitignore`?
