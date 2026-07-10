# Final Review — Internship Application Tracker

**Review Date:** 2026-07-10  
**Stage Under Review:** Final — after testing, security hardening, maintainability cleanup, and change request stage  
**Reviewer:** Antigravity AI Code Review  
**Project Path:** `p3/`  
**Case:** Internship Application Tracker (Roles: Student, Coordinator)  
**Evidence basis:** All files inspected directly; scores reflect file-verified state — not claimed state.

---

## 1. Final Feature Summary

The Internship Application Tracker is a full-stack web prototype built with React 18 (Vite, port 3000) and Express.js (port 5000) backed by a MySQL database. It implements a two-role system — students and coordinators — with database-backed authentication, custom HMAC-signed tokens, per-route role guards, and a five-stage application lifecycle (`submitted → underReview → changesRequested → approved/rejected`).

### What was built

| Feature | Verdict |
|---|:---:|
| Student login (DB-backed, SHA-256) | ✅ |
| Coordinator login (DB-backed, SHA-256) | ✅ |
| Student: submit internship application (company, position, start/end date) | ✅ |
| Student: view own applications only (backend-enforced) | ✅ |
| Student: edit own application only when status is `changesRequested` | ✅ |
| Student: resubmit resets status to `submitted` | ✅ |
| Student: read coordinator comments (read-only) | ✅ |
| Coordinator: view all applications | ✅ |
| Coordinator: set status (5-value ENUM) | ✅ |
| Coordinator: write/update feedback comment | ✅ |
| Protected action: `/decision` route 403 for non-coordinators | ✅ |
| Filter by company name (partial LIKE) | ✅ |
| Filter by status (exact ENUM match) | ✅ |
| Colour-coded status badges (5 statuses, 4 styled — see L-10) | ✅ |
| Token-authenticated API routes | ✅ |
| Cross-student isolation (403 on GET /:id for non-owners) | ✅ |
| Repeatable DB setup + seed command | ✅ |
| Automated integration test suite (12 sub-tests) | ✅ |
| Test data created in `before` hook and cleaned in `after` hook | ✅ |
| `.env.example` provided | ✅ |
| Student delete / withdraw | ❌ Not required by spec |
| Forward-only status transitions | ❌ Not enforced |
| Token expiry | ❌ Not implemented |
| `JWT_SECRET` in `.env` | ❌ Missing |
| `bcrypt` / `argon2` password hashing | ❌ SHA-256 (no salt) used |
| CORS restricted to known origins | ❌ Open wildcard |
| `.gitignore` | ❌ Not found |

---

## 2. Review Scoring Matrix

> Score meaning: 0 = missing · 1 = present but mostly not working · 2 = partially working with major gaps · 3 = mostly working with important gaps · 4 = working with minor gaps · 5 = complete for selected case scope

| Feature / Area | Functionality 0-5 | Data Persistence 0-5 | Backend Security / Role Control 0-5 | Validation / Error Handling 0-5 | Testing Evidence 0-5 | Maintainability 0-5 | UI / Manual Usability 0-5 | Evidence | Notes |
|---|---:|---:|---:|---:|---:|---:|---:|---|---|
| Project setup and run commands | 5 | 5 | — | — | — | 4 | — | Root `package.json`: `install:all`, `dev`, `db:setup`, `db:reset`, `test`; README covers all steps | `JWT_SECRET` absent from `.env`; no `db:fresh` combined command; no `.gitignore` |
| Database setup and starter data | 5 | 5 | — | — | 4 | 4 | — | `dbSetup.js` idempotently creates DB, `users` and `applications` tables, seeds 3 users + 4 applications; test suite uses `before`/`after` hooks with `test_` prefix rows | `DB_NAME` fallback differs between `config/db.js` (`internship_tracker`) and `scripts/dbSetup.js` (`c4p3`); no `db:fresh` command |
| Login workflow | 5 | 5 | 3 | 4 | 4 | 4 | 5 | Test 2 verifies 401 on bad password; tests 3–4 verify both role logins (200 + token); `authRoutes.js` queries `users`, SHA-256 compares, returns HMAC token; `localStorage` persistence | SHA-256 no-salt not a production KDF; `JWT_SECRET` missing from `.env` (hardcoded fallback active); no token expiry; no login lockout |
| Role-based access | 5 | — | 5 | 4 | 5 | 4 | 5 | `authMiddleware` HMAC-verifies every `/api/applications` route; student list forced to own `student_id`; coordinator sees all; test 8 verifies 403 for student on `/decision`; test 11 verifies 403 cross-student read | CORS wildcard (`cors()` — no origin allowlist); no rate limiting |
| Main create action | 5 | 5 | 5 | 5 | 5 | 4 | 5 | `POST /api/applications` student-only guard; all-fields required; `endDate > startDate` validated; student identity re-verified from DB; inserts with `status='submitted'`; test 5 verifies 201 + new ID | `submittedDate` user-editable; no server-side auto-stamp; no API max-length enforcement |
| Main view/list action | 5 | 5 | 5 | 4 | 4 | 4 | 5 | `GET /api/applications` forces `student_id` filter for students; coordinators see all; `GET /:id` ownership check returns 403; test 11 confirms 403; test 12 verifies coordinator filter | No pagination; `SELECT *` returns all columns; no debounce on filter inputs |
| Main update/status/cancel action | 4 | 4 | 5 | 5 | 5 | 4 | 4 | `PUT /:id` checks ownership + `changesRequested` guard; SQL WHERE also re-guards; tests 7, 7a, 7b, 10 cover the full edit-lock and resubmit lifecycle end-to-end | No student delete/withdraw; `submittedDate` not updated on resubmission |
| Protected action | 5 | 5 | 5 | 4 | 5 | 4 | 5 | `PUT /:id/decision` returns 403 for non-coordinator (test 8); `VALID_STATUSES` whitelist → 400 on invalid; `status` + `coordinator_comment` updated atomically; coordinator-only review panel in UI; comment read-only in student view | No forward-only transition guard; comment optional; no audit trail |
| Secondary feature | 5 | — | 4 | 4 | 4 | 4 | 5 | Company name filter: parameterised `LIKE %?%`; status filter: exact ENUM match; both in `useEffect` re-fetch; both roles have filter UI; test 12 verifies coordinator filter | Redundant `studentId` param from frontend (harmless); no debounce on company keystroke |
| Case-specific: internship company, position, and date fields | 5 | 5 | — | 5 | 5 | 4 | 5 | `company_name`, `position_title`, `start_date DATE NOT NULL`, `end_date DATE NOT NULL` in schema, POST/PUT body, and form; dual-layer validation; test 6 verifies date error (400 + message) | `submitted_date` user-editable; no API max-length beyond VARCHAR(255); no whitespace trimming |
| Case-specific: application status review lifecycle | 5 | 5 | 5 | 4 | 5 | 4 | 5 | Five-value ENUM in DB and `VALID_STATUSES`; colour-coded badges; coordinator sets any listed state; test 7a verifies `changesRequested`; test 9 verifies `underReview` + comment persists in DB | No forward-only transition; `changesRequested` badge CSS class missing |
| Case-specific: coordinator comments and approval/rejection protection | 5 | 5 | 5 | 4 | 5 | 4 | 5 | `/decision` is coordinator-only at backend (403 for students — test 8); comment in `coordinator_comment TEXT NULL`; test 9 verifies comment persists in DB; comment shown read-only in student view | Comment optional (no minimum); no comment history; no audit of who set each status |
| UI / manual usability | 5 | — | — | 4 | 0 | 4 | 5 | Dark-mode (deep navy `#0b0f19`), Outfit Google Font, gradient header, colour-coded badges, filter bar, loading states, alert banners; responsive grid (350px form + 1fr table ≥1024px) | Alert banners do not auto-dismiss; credentials shown plain on login page; `changesRequested` badge unstyled; no aria labels; no meta description |
| Security posture | 2 | — | 3 | — | 3 | 3 | — | HMAC signature prevents token role-tampering; parameterised queries prevent SQL injection; DB credentials absent from all frontend files; student identity re-verified from DB on write | SHA-256 no-salt hash; `JWT_SECRET` hardcoded fallback; no token expiry; CORS wildcard; no helmet; no rate limiting; `localStorage` token storage (XSS risk) |
| Testing evidence | 4 | 4 | 5 | 5 | 5 | 4 | — | 12 sub-tests via `node:test`; `before`/`after` hooks create and purge `test_` users and `TEST_` applications; tests cover DB, login, create, date validation, edit-lock, resubmit, role-block, cross-user isolation, and coordinator filter | No frontend/UI automated test; test 11 inserts `test_student_2` with unhashed password; no explicit separate cleanup for this user (covered by `LIKE 'test_%'` pattern) |
| Maintainability | — | — | — | — | — | 3 | — | Well-commented routes and service functions; clear folder separation; `.env.example` and `TEST_PLAN.md` provided | All React logic in a single 700-line `App.jsx`; no component decomposition; no shared API utility; no ESLint/Prettier; no `.gitignore`; `DB_NAME` fallback inconsistency |

---

## 3. Project Structure and Run Commands

```
p3/
├── package.json                   ← Root (concurrently, install:all, dev, test, db:setup, db:reset)
├── README.md
├── REQUIREMENTS.md
├── PROJECT_CONTEXT.md
├── Case_Brief.md
├── MID_REVIEW.md
├── docs/
│   └── TEST_PLAN.md
├── backend/
│   ├── package.json               ← start, dev (nodemon), db:setup, db:reset, test
│   ├── server.js                  ← Express app; /api/health, /api/auth, /api/applications
│   ├── .env                       ← PORT, DB_HOST, DB_PORT, DB_USER, DB_PASSWORD, DB_NAME (no JWT_SECRET)
│   ├── .env.example               ← Template (JWT_SECRET entry absent)
│   ├── config/
│   │   └── db.js                  ← mysql2/promise connection pool; testConnection() on startup
│   ├── middleware/
│   │   └── authMiddleware.js      ← generateToken(), authMiddleware() — HMAC-SHA256
│   ├── routes/
│   │   ├── authRoutes.js          ← POST /api/auth/login
│   │   └── applicationRoutes.js   ← GET /, GET /:id, POST /, PUT /:id, PUT /:id/decision
│   ├── services/
│   │   └── applicationService.js  ← createApplication, getApplications, getApplicationById,
│   │                                  updateStudentApplication, updateCoordinatorDecision
│   ├── utils/
│   │   └── hash.js                ← hashPassword() — crypto SHA-256
│   ├── scripts/
│   │   ├── dbSetup.js             ← CREATE DATABASE, CREATE TABLE users + applications, seed
│   │   └── dbReset.js             ← DROP DATABASE
│   └── tests/
│       └── integration.test.js    ← 12 sub-tests, node:test runner
└── frontend/
    ├── package.json               ← vite, react 18.3, react-dom
    ├── vite.config.js             ← port 3000, /api proxy → localhost:5000
    ├── index.html
    └── src/
        ├── main.jsx               ← ReactDOM.createRoot
        ├── App.jsx                ← All state, handlers, and UI (700 lines — monolithic)
        └── index.css              ← Design system: CSS variables, badges, grid, forms
```

### Run Commands

| Goal | Command (from `p3/`) |
|---|---|
| Install all dependencies | `npm run install:all` |
| Create DB + tables + seed data | `npm run db:setup` |
| Drop database | `npm run db:reset` |
| Drop and re-seed (two steps) | `npm run db:reset` then `npm run db:setup` |
| Start both servers (dev) | `npm run dev` |
| Run automated test suite | `npm test` |
| Backend only | `npm run dev:backend` |
| Frontend only | `npm run dev:frontend` |

---

## 4. Frontend / Backend Separation Check

**Verdict: ✅ Properly separated.**

| Check | Result |
|---|:---:|
| Frontend in `frontend/`, backend in `backend/` — separate directories | ✅ |
| Vite dev proxy routes `/api` → `http://localhost:5000` (`vite.config.js` lines 10–14) | ✅ |
| React uses relative `/api/...` paths only — never an absolute backend URL | ✅ |
| `mysql2` is in `backend/package.json` only — absent from `frontend/package.json` | ✅ |
| No `DB_HOST`, `DB_USER`, `DB_PASSWORD`, or `DB_NAME` in any file under `frontend/` | ✅ (grep-verified) |
| Frontend `dist/` build does not include `backend/.env` (Vite does not bundle `.env`) | ✅ |

React never connects to MySQL. All database interaction is exclusively inside the Express backend. The Vite dev proxy transparently relays `/api` calls during development; in production a reverse proxy (e.g., nginx) would perform the same function.

---

## 5. Database Setup and Table Summary

### Connection Method

`backend/config/db.js` creates a `mysql2/promise` **connection pool** (limit 10) reading these environment variables from `backend/.env`:

| Variable | Present in `.env` | Fallback in code |
|---|:---:|---|
| `DB_HOST` | ✅ | `localhost` |
| `DB_PORT` | ✅ | `3306` |
| `DB_USER` | ✅ | `root` |
| `DB_PASSWORD` | ✅ (value withheld from this review) | `''` (empty string) |
| `DB_NAME` | ✅ | `internship_tracker` ← **mismatch** (see note) |

> **DB_NAME fallback mismatch:** `config/db.js` falls back to `'internship_tracker'`, but `scripts/dbSetup.js` falls back to `'c4p3'`. The actual `.env` sets `DB_NAME=c4p3`, so this is non-critical at runtime. However, if `.env` is absent, the pool and the setup script would target different databases.

`JWT_SECRET` is **not** present in `backend/.env` or `backend/.env.example`. The hardcoded fallback string in `authMiddleware.js` line 4 is the active signing key at runtime.

### Tables

| Table | Created By | Key Columns |
|---|---|---|
| `users` | `scripts/dbSetup.js` | `id` INT PK AUTO_INCREMENT, `username` VARCHAR(100) UNIQUE NOT NULL, `password` VARCHAR(255) NOT NULL, `role` ENUM(`student`,`coordinator`) NOT NULL, `created_at` TIMESTAMP |
| `applications` | `scripts/dbSetup.js` | `id` PK, `student_id` FK → `users.id` ON DELETE CASCADE, `student_name`, `company_name`, `position_title`, `start_date DATE`, `end_date DATE`, `submitted_date DATE`, `status` ENUM(5 values) DEFAULT `submitted`, `coordinator_comment TEXT NULL`, `created_at`, `updated_at` AUTO UPDATE |

Both tables use `ENGINE=InnoDB`. A `users` table with `id` and `role` exists and backs the login system.

### Seed Data

| Record | Username | Role | Credentials |
|---|---|---|---|
| Demo student 1 | `student1` | student | password `student123` (SHA-256 hashed in DB) |
| Demo student 2 | `student2` | student | password `student123` (SHA-256 hashed in DB) |
| Demo coordinator | `coordinator1` | coordinator | password `coordinator123` (SHA-256 hashed in DB) |

4 demo applications are seeded covering all statuses (`submitted`, `underReview`, `approved`, `rejected`), some with coordinator comments. Seeding is idempotent — runs only when `COUNT(*) = 0`.

### Recreating Tables and Seed Data

```bash
npm run db:reset         # drops the 'c4p3' database
npm run db:setup         # creates DB, tables, and seeds all demo data
```

No combined `db:fresh` script is provided — two commands must be run manually.

---

## 6. Login and Role/Access Explanation

### Login Flow (both roles)

1. Browser POSTs `{ username, password }` to `/api/auth/login`.
2. Backend queries `SELECT * FROM users WHERE username = ?`.
3. Input password is hashed: `crypto.createHash('sha256').update(password).digest('hex')`.
4. Hash is compared against the stored `users.password` value.
5. On match, `generateToken(user.id, user.role)` creates: `{id}.{role}.{HMAC-SHA256-of-payload}`.
6. Token and `{ id, username, role }` are returned; React stores both in `localStorage`.
7. All subsequent API calls attach `Authorization: Bearer {token}`.

### How roles are checked

`router.use(authMiddleware)` runs before every `/api/applications` route:
- Splits the token, recomputes the HMAC, rejects with 401 if the signature does not match.
- Sets `req.user = { id, role }` from the verified payload.
- Route handlers inspect `req.user.role` for specific guards.

| Guard | Route | HTTP code on violation |
|---|---|---|
| Token missing / invalid | All `/api/applications/*` | 401 |
| `role !== 'student'` (submit) | `POST /api/applications` | 403 |
| `role !== 'student'` (update) | `PUT /api/applications/:id` | 403 |
| Student list sees only own records | `GET /api/applications` | Forced WHERE `student_id = req.user.id` |
| Student detail read of another's record | `GET /api/applications/:id` | 403 |
| `role !== 'coordinator'` (decision) | `PUT /api/applications/:id/decision` | 403 |

Student identity on write operations is **re-verified by a DB lookup** (`SELECT username FROM users WHERE id = ?`) — the backend does not trust `studentName` from the request body.

---

## 7. Protected Action Explanation

**Protected action:** Coordinator adds/edits comments and approves or rejects applications via `PUT /api/applications/:id/decision`.

| Protection Layer | Mechanism | File / Line |
|---|---|---|
| Token required | `router.use(authMiddleware)` runs first | `applicationRoutes.js` line 8 |
| Coordinator-only role check | `if (req.user.role !== 'coordinator') → 403` | `applicationRoutes.js` lines 185–187 |
| Status whitelist | `VALID_STATUSES.includes(status)` → 400 on invalid | `applicationRoutes.js` lines 11, 192–194 |
| Atomic DB write | `UPDATE applications SET status = ?, coordinator_comment = ? WHERE id = ?` | `applicationService.js` lines 67–73 |
| UI restriction | Review panel and "Review" button only rendered inside coordinator branch | `App.jsx` lines 563–688 |
| Automated test | Test 8 verifies student token receives 403 on this route | `integration.test.js` lines 211–226 |

**What is NOT protected:**
- No forward-only lifecycle guard — coordinator can move `approved → submitted`.
- No minimum comment length required when rejecting.
- No audit trail of who changed the status and when.
- `coordinator_comment` is overwritten on every call; no comment history is stored.

---

## 8. Validation Summary

| Validation Rule | Client (React) | Backend (Express) | DB Constraint | Automated Test |
|---|:---:|:---:|:---:|:---:|
| All application fields required on submit | ✅ | ✅ | NOT NULL | Test 5 (positive) |
| `endDate` strictly after `startDate` | ✅ | ✅ | — | Test 6 (400 + message) |
| Status in `VALID_STATUSES` whitelist | — | ✅ | ENUM | — |
| Username + password required on login | ✅ | ✅ | — | Test 2 |
| Student cannot edit non-`changesRequested` app | ✅ (UI hides Edit button) | ✅ (status check + SQL WHERE) | — | Tests 7, 10 |
| Only students can submit | — | ✅ (403) | — | — |
| Only coordinators can call `/decision` | — | ✅ (403) | — | Test 8 |
| Student owns the application being updated | — | ✅ (ownership check + WHERE) | FK | Test 11 (read isolation) |

**Remaining validation gaps:**
- No API-level max-length enforcement beyond MySQL's VARCHAR(255) column cap.
- `submittedDate` is user-supplied; server does not auto-stamp the current date.
- No whitespace trimming on text fields before DB insert or filter query.
- Date format validity relies on MySQL's `DATE` type rejection; no explicit ISO-format parse in JS.

---

## 9. Automated and Manual Testing Summary

### Automated Test Suite

**Command:** `npm test` (from `p3/` root) → `npm test --prefix backend` → `node --test tests/integration.test.js`

**Runner:** Node.js native `node:test` module (no third-party framework required)

**Cleanup:** `before` hook inserts `test_student` and `test_coordinator` with `hashPassword()`-hashed credentials. `after` hook closes the server and deletes all `test_%` users and `TEST_%` applications.

| # | Sub-test | What it checks | Outcome asserted |
|---|---|---|---|
| 1 | DB connectivity | `SELECT 1+1 = 2` | DB is reachable |
| 2 | Login failure | Wrong password → body | 401 + `Invalid username or password.` |
| 3 | Student login success | Correct credentials → token | 200 + `role: student` + token present |
| 4 | Coordinator login success | Correct credentials → token | 200 + `role: coordinator` + token present |
| 5 | Student submits application | Valid POST → DB insert | 201 + new `id` in response |
| 6 | Date validation | `endDate < startDate` | 400 + `End Date must be strictly after the Start Date.` |
| 7 | Edit locked in `submitted` status | PUT on submitted app | 400 + `changesRequested stage can be modified` |
| 7a | Coordinator transitions to `changesRequested` | PUT `/decision` + DB check | 200 + DB `status = changesRequested` |
| 7b | Student edits and resubmits | PUT on `changesRequested` app + DB check | 200 + DB `status = submitted`, company updated |
| 8 | Student blocked from `/decision` | Student token on decision route | 403 + `Only coordinators can review applications.` |
| 9 | Coordinator review persists | PUT `/decision` + DB SELECT | 200 + DB `status` and `coordinator_comment` match payload |
| 10 | Edit locked in `underReview` | PUT on underReview app | 400 + `changesRequested stage can be modified` |
| 11 | Cross-student isolation | Student 1 GETs Student 2's app | 403 + `You do not own this application.` |
| 12 | Coordinator filter | GET with company + status params | 200 + result array length ≥ 1 |

### What was NOT automated

| Gap | Reason |
|---|---|
| Browser/UI rendering and layout | No Playwright or Cypress E2E tests |
| `changesRequested` badge CSS styling | Visual-only; no style assertion in test |
| Alert banner auto-dismiss | UI interaction only |
| `dist/` build free of DB credentials | Manual build + grep check |
| Login lockout after failed attempts | Feature does not exist |

---

## 10. Stage 11 Change Summary

The key change implemented after the Mid-Review (secondary-feature stage) was the **changesRequested resubmission workflow**:

| Item | Mid-Review State | Final State |
|---|---|---|
| Student edit lock condition | Blocked if `status !== 'submitted'` | Changed to block if `status !== 'changesRequested'` — students edit only when coordinator explicitly requests changes |
| Resubmission status reset | Described in spec | `UPDATE ... SET status = 'submitted' WHERE status = 'changesRequested'`; verified by test 7b |
| Automated tests | Zero test files — Testing evidence: 0 in Mid-Review matrix | Full 12-test suite in `integration.test.js`; `"test"` script in both `package.json` files |
| `TEST_PLAN.md` | Not present | Added to `docs/TEST_PLAN.md` |
| `VALID_STATUSES` count | 4-value array (implied) | 5 values confirmed: `submitted`, `underReview`, `approved`, `rejected`, `changesRequested` |

**Issues from Mid-Review NOT resolved:**
- `JWT_SECRET` still missing from `.env`; hardcoded fallback still active.
- Password hashing still SHA-256 (no salt); `bcrypt`/`argon2` not added.
- CORS still open wildcard (`cors()`).
- Token has no expiry.
- `submittedDate` still user-editable.
- `.gitignore` still absent.
- `DB_NAME` fallback inconsistency between `config/db.js` and `scripts/dbSetup.js` remains.
- All React logic still in a single 700-line `App.jsx`.

---

## 11. Stage Drift and Early-Built Work

**Stage drift (future-stage features built before their stage): None detected.**

No production hardening libraries (`helmet`, `express-rate-limit`, `bcrypt`, `sanitize-html`) were pre-added. No pagination, no API documentation, no CI/CD configuration was pre-implemented.

### Work correctly staged

| Feature | Stage | Assessment |
|---|---|---|
| `changesRequested` resubmission flow | Final change request stage | Correct — added in the final stage |
| Filter feature | Secondary feature stage | Correct |
| HMAC-signed custom token | Prototype auth stage | Correct — no JWT library; custom implementation |
| Integration test suite | Testing stage | Correct — not pre-added before this stage |

---

## 12. Security Risks and Exposed-Secret Check

> Password values and secret key values are not printed in this review.

| Risk | Severity | Location | Detail |
|---|---|---|---|
| `JWT_SECRET` hardcoded fallback in source | 🔴 High | `authMiddleware.js` line 4 | `process.env.JWT_SECRET \|\| 'prototype_secret_key_12345'` — the fallback is the active key because `JWT_SECRET` is absent from `.env`. Anyone who reads the source can forge valid tokens. |
| No `.gitignore` present | 🔴 High | Project root | `node_modules/` and `backend/.env` (containing DB password) would be committed to version control if `git add .` is run. |
| SHA-256 (no salt) password hashing | 🔴 High | `utils/hash.js`, `authRoutes.js`, `dbSetup.js` | SHA-256 is a fast general-purpose hash, not a password KDF. Without a salt, identical passwords produce identical hashes and are vulnerable to rainbow-table attacks. Must be replaced with bcrypt or argon2. |
| Token never expires | 🟡 Medium | `authMiddleware.js` | The token `{id}.{role}.{signature}` contains no timestamp or `exp` field. A stolen token grants indefinite access. |
| CORS open to all origins | 🟡 Medium | `server.js` line 9 | `app.use(cors())` allows any origin to make requests to the API. Should be restricted to `http://localhost:3000` in development. |
| `localStorage` token storage | 🟡 Medium | `App.jsx` lines 121–122 | Tokens in `localStorage` are accessible to any JavaScript on the page, making them vulnerable to XSS. HttpOnly cookies would be safer. |
| No rate limiting | 🟡 Medium | `server.js` | The login endpoint can be brute-forced without limit — no throttle or lockout exists. |
| No `helmet` HTTP security headers | 🟡 Medium | `server.js` | No `X-Content-Type-Options`, `X-Frame-Options`, or `Content-Security-Policy` headers are set. |
| Plaintext credentials on login page | 🟢 Low | `App.jsx` lines 356–361 | Demo credentials displayed on the login page. Acceptable for a closed prototype; remove before any shared deployment. |

**DB credentials in frontend — confirmed absent.** `mysql2` is not in `frontend/package.json`. No `DB_*` variable is referenced in any file under `frontend/`. Vite does not bundle `backend/.env`.

---

## 13. Documentation / Code Mismatches

| # | Document | Claim | Actual Code | Impact |
|---|---|---|---|---|
| D-1 | `REQUIREMENTS.md` §2 | Column named `password_hash` | `dbSetup.js` creates column named `password` | Minor naming mismatch; the concept is identical but the spec column name differs |
| D-2 | `REQUIREMENTS.md` §4 | Status valid values: 4 listed (`submitted`, `underReview`, `approved`, `rejected`) | Code has 5 values — `changesRequested` also in the ENUM and `VALID_STATUSES` | Code is more complete than the spec in this section; not a defect |
| D-3 | `PROJECT_CONTEXT.md` §4 | `submitted_date` described as `TIMESTAMP DEFAULT CURRENT_TIMESTAMP` | `dbSetup.js` creates it as `DATE NOT NULL` (user-supplied) | Spec implies auto-stamping; implementation requires manual input |
| D-4 | `PROJECT_CONTEXT.md` §4 | Field named `coordinator_comments` (plural) | DB column is `coordinator_comment` (singular) | Minor naming difference; no functional impact |
| D-5 | `PROJECT_CONTEXT.md` §7 Assumptions | "A simple header-based role selector or a mock login screen" assumed | Full DB-backed login with HMAC-signed token implemented | Implementation exceeds the assumption — an improvement |
| D-6 | `backend/.env.example` | Does not include `JWT_SECRET` entry | `authMiddleware.js` requires `JWT_SECRET` for production-safe signing | The example file is incomplete; should include `JWT_SECRET=your_secret_here` |
| D-7 | `MID_REVIEW.md` §8 | Student edit reported as locked at `submitted` status | `PUT /:id` now locks on `status !== 'changesRequested'` | Mid-Review text is now outdated (it is a historical document); code is correct for the final stage |

---

## 14. Known Limitations

| # | Limitation | Impact |
|---|---|---|
| L-1 | SHA-256 (no salt) password hashing | Vulnerable to rainbow-table attacks; not safe for any real deployment |
| L-2 | `JWT_SECRET` absent from `.env`; hardcoded fallback active in source | Source-code readers can forge valid tokens |
| L-3 | Tokens do not expire | Stolen tokens grant indefinite access |
| L-4 | CORS open to all origins | Any web page can call the API from a user's browser |
| L-5 | No `.gitignore` | `node_modules/` and `backend/.env` (with DB password) would be committed |
| L-6 | `submittedDate` user-editable | Students can set any arbitrary submission date |
| L-7 | No forward-only status transition guard | Coordinator can reverse finalized decisions (e.g., `approved → submitted`) |
| L-8 | Monolithic 700-line `App.jsx` | All state, handlers, and UI in one file — hard to maintain or test |
| L-9 | No pagination on application list | Full table scan returned on every GET; degrades at scale |
| L-10 | `changesRequested` badge has no CSS class | `badge-changesRequested` not defined in `index.css`; the badge renders as plain unstyled text |
| L-11 | No debounce on company name filter input | Each keystroke triggers a fetch request |
| L-12 | `DB_NAME` fallback inconsistency | `config/db.js` defaults to `internship_tracker`; `scripts/dbSetup.js` defaults to `c4p3` |
| L-13 | Test 11 inserts unhashed password for `test_student_2` | Inconsistency in test setup; no login would work for this test user via the API |
| L-14 | No combined `db:fresh` command | Two manual commands required to reset and reseed |
| L-15 | No audit trail for coordinator decisions | No record of who changed what status and when; comment is overwritten on every call |

---

## 15. Demo Script

> **Prerequisites:** MySQL running locally. Run `npm run db:setup` then `npm run dev`. Open `http://localhost:3000`.

### Scene 1 — Student submits an application

1. Log in as `student1` / `student123`.
2. Fill the form — Company: **Tesla**, Position: **Site Reliability Intern**, Start: `2026-09-01`, End: `2026-12-01`, Submitted: today.
3. Click **Submit Application**. Observe the success banner and the new row in "My Applications" with a yellow **submitted** badge.
4. Observe the **Locked** label in the Actions column — the application cannot be edited at this status.

### Scene 2 — Student isolation

5. Log out. Log in as `student2` / `student123`.
6. Confirm that `student1`'s Tesla application is **not visible** — only `student2`'s own applications appear.

### Scene 3 — Coordinator requests changes

7. Log out. Log in as `coordinator1` / `coordinator123`.
8. All student applications are visible in the Review Dashboard.
9. Type **Tesla** in the Company filter — only the Tesla row remains.
10. Click **Review**. Set Status to **Changes Requested**. Add comment: *"Please extend the end date to at least 3 months after start."*
11. Click **Save Review**. Badge updates to `changesRequested`.

### Scene 4 — Student edits and resubmits

12. Log out. Log in as `student1` / `student123`.
13. The Tesla row now shows `changesRequested` and the coordinator comment is visible below the badge.
14. The **Edit** button is now active. Click it.
15. Change End Date to `2027-01-01`. Click **Save Changes**.
16. Status resets to **Submitted** and the Edit button returns to **Locked**.

### Scene 5 — Coordinator approves

17. Log out. Log in as `coordinator1` / `coordinator123`.
18. Find the Tesla application. Click **Review**.
19. Set Status to **Approved**. Add comment: *"Good. Approved."* Click **Save Review**.
20. Badge turns green **Approved**.

### Scene 6 — Security demonstration (protected action)

21. With `student1`'s token (from browser `localStorage`), attempt `PUT /api/applications/1/decision` with `{ "status": "approved", "comment": "self-approved!" }` via DevTools or curl.
22. The backend returns HTTP **403 Forbidden** — the coordinator-only role check fires before any DB query.

---

## 16. Suggested Viva Questions

### Architecture and separation

1. Why is the Vite dev proxy necessary? What would break if the frontend called `http://localhost:5000/api/...` directly instead of `/api/...`?
2. How does the backend know which MySQL database to connect to? What happens if the `.env` file is missing entirely?
3. `DB_NAME` defaults to different values in `config/db.js` and `scripts/dbSetup.js`. What is the actual runtime effect, and how would you fix it?

### Authentication and tokens

4. Walk me through exactly what happens between a user clicking "Sign In" and seeing their dashboard — from the browser request to MySQL and back.
5. Your token format is `{id}.{role}.{signature}`. Why is the HMAC signature important? Demonstrate how a student would try to forge a coordinator token and why it would fail.
6. Why is SHA-256 without a salt considered weak for password storage? What specific attack does a per-user salt defend against?
7. Your token never expires. What are the consequences of a stolen token, and how would you add expiry to the existing custom token format?

### Role-based access control

8. Which file and which exact line of code prevents a student from approving their own application? What HTTP status code is returned?
9. A student sends a crafted HTTP request directly to `GET /api/applications` without the `studentId` query parameter. What does the backend return, and why?
10. How does the backend prevent student A from reading student B's application details if student A knows the application ID?

### Database and data flow

11. If the database is wiped and `npm run db:setup` is run, what exact records will exist? How many tables, how many rows, and which statuses?
12. What is the difference between `db:setup` and `db:reset`? What exact sequence of commands does a developer run to reach a clean seeded state?
13. Why does `updateStudentApplication` include `AND status = 'changesRequested'` in the SQL WHERE clause if the route already checks this in JavaScript before calling the service?

### Testing

14. How does the test suite avoid overwriting or corrupting seed data? Walk me through the `before` and `after` hooks in detail.
15. In test 11, why is `test_student_2`'s password inserted as a plain SQL string rather than through `hashPassword()`? Could you log in as `test_student_2` during the test run?
16. Which test case covers the protected coordinator decision action? What would need to change in the test if forward-only status transitions were added?

### Validation and edge cases

17. Show the two places where "end date must be after start date" is enforced. If the backend check were removed, could a client with developer tools bypass it?
18. A student submits company name `"  Google  "` with leading and trailing spaces. What does the database store, and how does this affect the company name filter?
19. `submittedDate` is user-supplied. Describe a realistic scenario where this causes incorrect data, and explain the server-side fix.

### Security and limitations

20. What is the risk of storing the session token in `localStorage`? What would you use instead in a production system, and why is it safer?
21. If `JWT_SECRET` is not set in `.env`, what secret is actually used to sign tokens at runtime? Why is this a security risk even for a local closed prototype?
22. A coordinator can move status from `approved` back to `submitted`. Is this a bug or a missing feature? How would you implement a forward-only transition guard, and what data structure would you use to define the allowed transitions?

---

*End of Final Review — Internship Application Tracker · Reviewed 2026-07-10*
