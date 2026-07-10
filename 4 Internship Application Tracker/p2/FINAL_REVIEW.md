# FINAL REVIEW — Internship Application Tracker

**Project path:** `p2`
**Review date:** 2026-07-08
**Reviewer note:** Code-only review. No source files were modified. All findings are evidence-based from direct file inspection of every backend and frontend source file.

---

## 1. Final Feature Summary

The Internship Application Tracker is a two-role, React + Express + MySQL prototype. Every feature listed in the Case Brief is implemented and backed by code evidence. The critical security weakness identified in the Mid Review (no real session token) has been **fully resolved**: the system now issues a cryptographically random 64-character hex session token (`crypto.randomBytes(32).toString('hex')`), stores it in a `sessions` database table, and validates it on every protected request via a JOIN query in `authMiddleware.js`. The test suite has been expanded to match the final feature set.

| Feature | Code Evidence | Status |
|---|---|---|
| Student submits application (company, position, dates) | `POST /api/applications` — `server.js:99–141` | ✅ Complete |
| Student views own applications only | `GET /api/applications` scoped by `student_id = ?` — `server.js:72–75` | ✅ Complete |
| Coordinator views all applications | `GET /api/applications` — no student-id filter when `role = coordinator` | ✅ Complete |
| Coordinator updates status and adds comment | `PUT /api/applications/:id` — `server.js:144–192` | ✅ Complete |
| Filter by company name (LIKE) | `?companyName=` query param — `server.js:78–81` | ✅ Complete |
| Filter by application status | `?status=` query param — `server.js:83–86` | ✅ Complete |
| Student cannot approve own application | `403` if `req.user.role !== 'coordinator'` — `server.js:150–152` | ✅ Complete |
| Student cannot edit coordinator comment | No student route to `PUT /api/applications/:id` | ✅ Complete |
| Student can edit and resubmit when changesRequested | `PUT /api/applications/:id/resubmit` — `server.js:195–260` | ✅ Complete (bonus) |
| `changesRequested` status value | Schema ENUM + UI badge + coordinator review modal | ✅ Complete (bonus) |
| Student cannot resubmit unless status is changesRequested | Status check at `server.js:230–232` | ✅ Complete |
| Student withdrawal/cancel | No `DELETE /api/applications/:id` route | ❌ Not implemented |
| Rejection must include a comment | No validation on `PUT` | ❌ Not implemented |
| Status-transition guard (no backward moves) | No guard — any status can follow any other | ❌ Not implemented |
| Pagination | Not implemented | ❌ Not implemented |

---

## 2. Review Scoring Matrix

> Score meaning: 0 = missing · 1 = present but mostly not working · 2 = partially working with major gaps · 3 = mostly working with important gaps · 4 = working with minor gaps · 5 = complete for the selected case scope

| Feature / Area | Functionality 0-5 | Data Persistence 0-5 | Backend Security / Role Control 0-5 | Validation / Error Handling 0-5 | Testing Evidence 0-5 | Maintainability 0-5 | UI / Manual Usability 0-5 | Evidence | Notes |
|---|---:|---:|---:|---:|---:|---:|---:|---|---|
| Project setup and run commands | 5 | 5 | — | — | — | 5 | — | `package.json` in both `backend/` and `frontend/` with named scripts. `node_modules` present. `.env` + `.env.example` in backend. | All five env vars documented. README covers setup steps for both servers. |
| Database setup and starter data | 5 | 5 | — | — | 5 | 4 | — | `schema.sql` creates DB + 3 tables + seeds 3 users + 2 applications idempotently. `db-setup.js` runs it. `npm run db:setup` is the single command. Test resets and re-seeds DB before running. | `db.js` fallback DB name (`internship_tracker`) still differs from schema DB name (`c4p2`) if `.env` is absent. Plaintext passwords retained as documented workshop simplification. |
| Login workflow | 5 | 5 | 5 | 4 | 5 | 4 | 5 | `POST /api/auth/login` queries `users`, issues `crypto.randomBytes(32)` hex token, stores it in `sessions` table. Failure returns `401`. Missing fields return `400`. Frontend stores `{id, username, role, token}` in `localStorage`. | Passwords still plaintext in DB — documented as workshop-only. Quick-select dropdown pre-fills credentials for demo convenience. |
| Role-based access | 5 | — | 5 | 4 | 5 | 4 | 4 | `requireAuth` middleware JOINs `sessions` to `users` on every request. Role is read from DB row, never from client. Fake token returns `401`. Forged `x-user-role` header returns `403` (tested in `test.js:142–149`). | No token expiry / server-side session invalidation. CORS still fully open. |
| Main create action | 5 | 5 | 5 | 4 | 5 | 4 | 5 | `POST /api/applications` enforces `role === 'student'` (DB-verified), validates all five required fields, validates date order, inserts with `status='submitted'` and `coordinatorComment=null`. Identity taken from `req.user`. | `submittedDate` still accepted from request body — could be forged. `studentName` UI field is editable (backend ignores it and uses `req.user.username`). |
| Main view/list action | 5 | 5 | 5 | 4 | 5 | 4 | 5 | `GET /api/applications` scopes students to `student_id = req.user.id`. Coordinators see all. `ORDER BY createdAt DESC`. Frontend renders responsive table with status badges, formatted dates, comments column. | No pagination. Filter fires a DB query on every keystroke (no debounce). |
| Main update/status/cancel action | 5 | 5 | 5 | 4 | 5 | 4 | 4 | `PUT /api/applications/:id` restricted to coordinator. Validates status enum. Fetches row before update. Frontend review modal (blur overlay) lets coordinator set status + comment. | No status-transition guard. No student cancel/withdraw route. |
| Protected action | 5 | 5 | 5 | 4 | 5 | 4 | 5 | `PUT /api/applications/:id` returns `403` for any non-coordinator. Both comment and status are on the same coordinator-only route. Student attempt is blocked at DB-verified role check, not just UI. Test 4 explicitly verifies this. | No audit trail. No rejection-requires-comment enforcement. |
| Secondary feature | 5 | — | 5 | 4 | 5 | 4 | 5 | `?companyName=` uses LIKE (`%value%`). `?status=` uses exact match. Both are combined. Frontend filter bar re-fetches reactively. Tests 6A and 6B confirm filter correctness. | No debounce on text field. |
| Case-specific: internship company, position, and date fields | 5 | 5 | 5 | 4 | 5 | 4 | 5 | Schema: `companyName VARCHAR(255) NOT NULL`, `positionTitle VARCHAR(255) NOT NULL`, `startDate DATE NOT NULL`, `endDate DATE NOT NULL`, `submittedDate DATE NOT NULL`. All five validated required + date-order check. Both client and server enforce date order. | No maximum length enforcement beyond DB column. No minimum date. `submittedDate` accepted from body. |
| Case-specific: application status review lifecycle | 5 | 5 | 5 | 4 | 5 | 4 | 5 | Schema ENUM: `submitted`, `underReview`, `approved`, `rejected`, `changesRequested` (bonus). All states visible with colour-coded badges. Coordinator sets state via modal. Test 7 covers changesRequested → resubmit cycle. | No state-machine guard on transitions. Status badge for `changesRequested` is amber-coloured (distinct from `underReview`). |
| Case-specific: coordinator comments and approval/rejection protection | 5 | 5 | 5 | 4 | 5 | 4 | 5 | `coordinatorComment TEXT NULL` column. Only `PUT /api/applications/:id` writes it, which is coordinator-only. Test 4 confirms student gets `403` when attempting to write a comment. Coordinator modal textarea is the only UI path. | Comment is optional even for rejections. No comment history. |
| UI / manual usability | 5 | — | — | 4 | — | 4 | 5 | Dark glassmorphism theme, Outfit font, HSL-tuned colour palette, status badge colours, loading spinners, inline error banners, blur-overlay modals, responsive table. Quick-select dropdown aids demo. | No success toast after submit. No pagination. Student name UI field is editable (misleading). |
| Security posture | 4 | — | 4 | — | 5 | 4 | — | Real crypto session token, sessions DB table, `requireAuth` JOIN, parameterised queries throughout, `.env.example` committed. | CORS fully open. Plaintext passwords. No rate limiting. No `helmet`. No token expiry. Whitespace-only strings not rejected. `submittedDate` forgeable. |
| Testing evidence | — | — | — | — | 5 | — | — | 264-line `test.js` runs 7 numbered test groups + automatic DB reset before tests + `DELETE WHERE companyName LIKE 'TEST_%'` cleanup on pass and fail. Command: `npm test` (backend). | No test framework. Server must be running before `npm test`. No unit tests. No frontend tests. |
| Maintainability | — | — | — | — | — | 4 | — | Clear file separation: `db.js`, `authMiddleware.js`, `server.js`, `db-setup.js`, `schema.sql`, `test.js`. Frontend split into `Login.jsx`, `SubmitApplication.jsx`, `Dashboard.jsx`, `App.jsx`. Inline comments throughout. `.env.example` present. `README.md` covers setup. | `db.js` fallback name mismatch. No ESLint in backend. No logging middleware. No Vite API proxy (hardcoded URL). |

---

## 3. Project Structure and Run Commands

```
p2/
├── Case_Brief.md
├── README.md
├── MID_REVIEW.md
├── FINAL_REVIEW.md
├── backend/
│   ├── .env                    ← real credentials (should be gitignored)
│   ├── .env.example            ← safe template committed to repo
│   ├── authMiddleware.js       ← session token -> DB lookup -> req.user
│   ├── db-setup.js             ← reads schema.sql, runs via multipleStatements
│   ├── db.js                   ← mysql2/promise connection pool
│   ├── package.json
│   ├── schema.sql              ← CREATE DATABASE + 3 tables + seed data
│   ├── server.js               ← Express routes (5 endpoints)
│   └── test.js                 ← 264-line integration test suite
└── frontend/
    ├── .gitignore
    ├── index.html
    ├── package.json
    ├── vite.config.js
    └── src/
        ├── App.jsx             ← router, navbar, auth state
        ├── index.css           ← design system (dark glassmorphism)
        ├── main.jsx
        └── components/
            ├── Dashboard.jsx   ← application table, filter bar, review modal, resubmit modal
            ├── Login.jsx       ← login form with quick-select dropdown
            └── SubmitApplication.jsx  ← new application form (student only)
```

### Run Commands

```bash
# 1. Database (run once, or to reset)
cd backend
npm install
npm run db:setup          # creates c4p2 DB, tables, seed data

# 2. Backend
npm run dev               # nodemon on http://localhost:5001

# 3. Frontend (separate terminal)
cd frontend
npm install
npm run dev               # Vite on http://localhost:5173

# 4. Tests (backend must be running first)
cd backend
npm test                  # node test.js
```

---

## 4. Frontend/Backend Separation Check

**React and Express are cleanly separated.**

- The frontend lives entirely under `frontend/` with its own `package.json` (Vite, React, react-router-dom, lucide-react). It has no `mysql2` or `express` dependency.
- The backend lives entirely under `backend/` with its own `package.json` (express, mysql2, cors, dotenv, nodemon). It has no React dependency.
- The frontend communicates with the backend **exclusively** through `fetch()` calls to `http://localhost:5001/api/*`. The constant `API_BASE_URL = 'http://localhost:5001/api'` is defined at the top of each component file (`Login.jsx`, `Dashboard.jsx`, `SubmitApplication.jsx`).
- The frontend **never** imports or instantiates any MySQL client. There is no `mysql2` package reference in any frontend file.
- The only cross-boundary link is the `Authorization: Bearer <token>` HTTP header sent by the frontend and read by the backend.

**Minor gap:** No Vite dev proxy is configured in `vite.config.js`. The frontend URL is hardcoded in three files. If the backend port changes, all three must be updated manually.

---

## 5. Database Setup and Table Summary

### Connection Method

`db.js` creates a `mysql2/promise` connection pool. All five env vars are used:

| Variable | Used in `db.js` | Fallback value |
|---|---|---|
| `DB_HOST` | Yes — `process.env.DB_HOST` | `'localhost'` |
| `DB_PORT` | Yes — `process.env.DB_PORT` | `3306` |
| `DB_USER` | Yes — `process.env.DB_USER` | `'root'` |
| `DB_PASSWORD` | Yes — `process.env.DB_PASSWORD` | (not printed in this review) |
| `DB_NAME` | Yes — `process.env.DB_NAME` | `'internship_tracker'` (mismatch — see note) |

> **Fallback name mismatch:** `schema.sql` creates the database `c4p2`. If the `.env` file is absent or `DB_NAME` is not set, `db.js` connects to `internship_tracker`, which does not exist.

### Database Tables

| Table | Purpose | Key Columns |
|---|---|---|
| `users` | Login / identity table | `id`, `username`, `password` (plaintext), `role ENUM('student','coordinator')`, `createdAt`, `updatedAt` |
| `sessions` | Token store | `id`, `user_id FK→users.id`, `token VARCHAR(255) UNIQUE`, `createdAt` |
| `applications` | Core data store | `id`, `student_id FK→users.id`, `studentName`, `companyName`, `positionTitle`, `startDate DATE`, `endDate DATE`, `submittedDate DATE`, `status ENUM(5 values)`, `coordinatorComment TEXT NULL`, timestamps |

A `users` login table exists. It is defined in `schema.sql`.

### Recreating Tables and Seed Data

```bash
cd backend
npm run db:setup
```

This runs `db-setup.js`, which opens a MySQL connection without specifying a database, reads `schema.sql`, and executes it with `multipleStatements: true`. The SQL uses `CREATE TABLE IF NOT EXISTS` and `INSERT … ON DUPLICATE KEY UPDATE` so the command is fully idempotent and safe to repeat.

---

## 6. Login and Role/Access Explanation

### How the Two Roles Log In

1. User visits `/login`. The quick-select dropdown pre-fills credentials for one of the three seeded accounts.
2. The form calls `POST /api/auth/login` with `{username, password}`.
3. The backend queries: `SELECT id, username, role FROM users WHERE username = ? AND password = ?`
4. If a row is found, `crypto.randomBytes(32).toString('hex')` generates a 64-character hex session token.
5. The token is stored: `INSERT INTO sessions (user_id, token) VALUES (?, ?)`
6. The response returns `{id, username, role, token}`. The frontend stores this in `localStorage` under `tracker_user`.
7. On logout, `localStorage` is cleared. The session row is **not** deleted from the database (no server-side invalidation).

### How Roles Are Checked on Every Request

Every protected route uses the `requireAuth` middleware (`authMiddleware.js`):

1. Reads the `Authorization: Bearer <token>` header.
2. Executes: `SELECT u.id, u.username, u.role FROM sessions s JOIN users u ON s.user_id = u.id WHERE s.token = ?`
3. If no row is found, returns `401 Unauthorized`.
4. If found, attaches `{id, username, role}` to `req.user` — values come from the database, not the client.
5. The route handler reads `req.user.role` to enforce action-level access.

Any `x-user-role` header injected by the client is ignored. Role cannot be spoofed.

### Record Access Isolation

In `GET /api/applications`:

```js
if (userRole === 'student') {
  query += ' AND student_id = ?';
  params.push(userId);   // userId = req.user.id from DB session lookup
}
```

A student cannot override this by passing query parameters. `userId` comes from the database via the session token.

---

## 7. Protected Action Explanation

**Protected action:** Approving, rejecting, setting status, and writing coordinator comments on an application.

### How It Is Handled

`PUT /api/applications/:id` is the only write path for status and comments. It enforces:

```js
if (userRole !== 'coordinator') {
  return res.status(403).json({ error: 'Forbidden. Only coordinators can review applications.' });
}
```

`userRole` comes from `req.user.role`, populated by `requireAuth` from the DB JOIN — not from any client-supplied value. A student sending a PUT with their own valid token receives `403 Forbidden`. A student adding a forged `x-user-role: coordinator` header still receives `403` because that header is never read. Test 4 in `test.js` confirms both directions (student blocked, coordinator allowed).

The **resubmit route** (`PUT /api/applications/:id/resubmit`) is the inverse: it enforces `role === 'student'` and additionally checks:
- The token student owns the application (`application.student_id === userId`).
- The application is in `changesRequested` status.

---

## 8. Validation Summary

### Backend Validation Rules

| Rule | Location | HTTP Response |
|---|---|---|
| `username` and `password` required at login | `server.js:25–27` | `400` |
| Invalid credentials | `server.js:35–37` | `401` |
| All five application fields required on submit | `server.js:109–111` | `400 — "All fields are required."` |
| `startDate` must be strictly before `endDate` | `server.js:114–116` | `400 — "Start Date must be before End Date."` |
| Status must be one of the five ENUM values on update | `server.js:155–158` | `400 — "Invalid application status value."` |
| Application must exist before update | `server.js:162–165` | `404 — "Application not found."` |
| Resubmit: all four fields required | `server.js:206–208` | `400` |
| Resubmit: date order check | `server.js:211–213` | `400` |
| Resubmit: student must own the application | `server.js:225–227` | `403` |
| Resubmit: application must be in `changesRequested` | `server.js:230–232` | `400` |

### Frontend Validation Rules (Client-Side Pre-checks)

| Rule | Component |
|---|---|
| Date order check before fetch call | `SubmitApplication.jsx:25–28`, `Dashboard.jsx:137–141` |
| HTML `required` attribute on all form fields | Both form components |

### Known Validation Gaps

| Gap | Impact |
|---|---|
| `submittedDate` accepted from request body | Student can forge a past submission date |
| No `.trim()` on string fields | Whitespace-only strings (`"   "`) pass the `!companyName` check |
| No max-length enforcement in backend | Strings can reach DB column limit without API-level rejection |
| No minimum date check | Dates in the past are accepted |
| Rejection does not require a non-empty comment | Coordinator can reject with no explanation |

---

## 9. Automated and Manual Testing Summary

### Automated Test Command

```bash
cd backend
npm test        # runs: node test.js
```

### What the Test Does

`test.js` (264 lines) is a self-contained integration test suite using Node's built-in `http` module. No test framework (Jest/Mocha) is used. Before running, it spawns `node db-setup.js` as a child process to reset and re-seed the database.

| Test # | Description | Assertions |
|---|---|---|
| 1 | Authentic login verification | Student login → `200` + token. Coordinator login → `200` + token. Wrong password → `401`. |
| 2 | Invalid session token | Fake `Bearer fake-invalid-token` → `401`. |
| 3 | Application submission validations | Missing fields → `400`. End before start → `400`. Valid submission → `201` with `status='submitted'`. |
| 4 | Action protection | Student PUT (approve + comment) → `403`. Coordinator PUT (underReview + comment) → `200`. |
| 5 | Spoofing guards | A. Forged `x-user-role: coordinator` → `403`. B. Body injection of `student_id`/`studentName` → application linked to token owner. C. Student2 cannot see Student1 applications. |
| 6 | Filtering | `?companyName=TEST_Acme` → only matching records. `?status=approved` → only approved records. |
| 7 | changesRequested and resubmission | Coordinator sets `changesRequested` → `200`. Student edits and resubmits → `200`, status resets to `submitted`. Immediate re-attempt → `400`. |
| Cleanup | Database cleanup | `DELETE FROM applications WHERE companyName LIKE 'TEST_%'` on both pass and fail paths. |

### Expected Result

All 7 test groups pass. Exit code `0` on success. Cleanup runs regardless of outcome.

### What Was Not Automated

| Gap | Impact |
|---|---|
| No frontend tests | React components, routing guards, modal open/close, and role-conditional buttons are manual-only. |
| No unit tests | Individual helpers (date comparison, `formatDate`) have no isolated tests. |
| No test framework | Pass/fail determined by `throw new Error(...)` inside `if` checks. |
| Server must be pre-started | `npm test` fails if `http://localhost:5001` is not already listening. |
| No login field length test | Backend accepts very long usernames without API rejection. |

---

## 10. What Changed After the Mid Review (Stage 11 Changes)

| Mid Review Issue | Resolution | Evidence |
|---|---|---|
| **H-1** — No real session token; `x-user-id` header trusted | ✅ Resolved. Token is `crypto.randomBytes(32).toString('hex')`. Stored in `sessions` table. `authMiddleware.js` validates via JOIN. | `authMiddleware.js`, `server.js:42–48`, `schema.sql:14–21` |
| **H-2** — Plaintext passwords | ⚠️ Retained as documented workshop simplification. Comment in `schema.sql:8`. | `schema.sql` |
| **H-4** — CORS fully open | ⚠️ Not resolved. `app.use(cors())` remains in `server.js:11`. | `server.js:11` |
| **M-1** — `submittedDate` accepted from body | ⚠️ Not resolved. Still accepted as a body field. | `server.js:100` |
| **M-2** — Whitespace-only strings pass | ⚠️ Not resolved. No `.trim()` added. | `server.js:109–111` |
| **M-6** — `db.js` fallback name mismatch | ⚠️ Not resolved. Default fallback is still `'internship_tracker'`. | `db.js:9` |
| **L-1** — All frontend logic in one file | ✅ Resolved. Frontend split into `App.jsx`, `Dashboard.jsx`, `Login.jsx`, `SubmitApplication.jsx`. | `frontend/src/components/` |
| Test coverage expanded | ✅ `test.js` grew to 264 lines, adding spoofing guard tests, changesRequested/resubmit workflow, and automatic DB reset. | `test.js` |
| `changesRequested` status + resubmit route | ✅ New `PUT /api/applications/:id/resubmit` route, ENUM extended, UI badge and modal added. | `server.js:195–260`, `schema.sql:33`, `Dashboard.jsx:421–509` |

---

## 11. Stage Drift and Early Work

| Item | Expected Stage | Present at Final | Assessment |
|---|---|---|---|
| `test.js` (integration test suite) | Testing stage | Present and expanded | Originally built one stage early (noted in Mid Review). The final test suite is larger and more comprehensive — stage drift was productive. |
| `changesRequested` status + resubmit route | Not in Case Brief | Present | Implemented as a bonus feature beyond the Case Brief scope. It is well-integrated, fully tested, and does not break any stated requirement. |
| Token-based session auth | Security hardening stage | Present | Correct — addressed in the final security hardening phase as intended. |
| Password hashing (bcrypt) | Security hardening stage | Absent | Not resolved. Explicitly retained as workshop simplification. |
| Pagination | Not requested | Absent | Correct — not implemented ahead of schedule. |
| `helmet` middleware | Security hardening stage | Absent | Not implemented. |

---

## 12. Security Risks and Exposed-Secret Check

### Exposed Secret Risk

| Risk | File | Finding |
|---|---|---|
| `.env` present in `backend/` | `backend/.env` | The file exists (80 bytes). `DB_PASSWORD` is not printed in this review. If no `backend/.gitignore` ignores it, it could be committed to version control. |
| `.env.example` committed | `backend/.env.example` | Safe — contains only placeholder structure. Password field is blank. |
| Frontend has no DB credentials | All `frontend/src/` files | Safe — no MySQL credentials in any frontend file. |
| Seed credentials in `schema.sql` | `backend/schema.sql` | Risk — `schema.sql` contains hardcoded plaintext passwords. If committed to a public repository, workshop credentials are visible. Acceptable for a prototype. |

### Remaining Security Risks

| Risk | Severity | Detail |
|---|---|---|
| Plaintext passwords | Medium | `password VARCHAR(255)` stores passwords without hashing. `bcrypt` was intentionally omitted. |
| CORS fully open | Medium | `app.use(cors())` allows any origin. Should restrict to `http://localhost:5173` for the prototype. |
| Session tokens never expire | Medium | `sessions` rows are never deleted. A stolen token is valid indefinitely. No server-side logout path. |
| No rate limiting | Low | `POST /api/auth/login` accepts unlimited attempts. Brute-force is not throttled. |
| No `helmet` | Low | HTTP security headers (X-Frame-Options, CSP, etc.) are not set. |
| `submittedDate` forgeable | Low | Backend accepts `submittedDate` from the request body. Server should set this to `NOW()`. |
| Whitespace-only field bypass | Low | `!companyName` passes for `"   "`. `.trim()` should be applied before the check. |
| `db.js` fallback name mismatch | Low | Default DB name is `internship_tracker`; schema creates `c4p2`. Missing `.env` causes silent connection failure to wrong DB. |

---

## 13. Documentation and Code Mismatches

| Item | Document | Code | Mismatch |
|---|---|---|---|
| Auth token description | Mid Review stated `mock-token-{id}-{role}` was returned | `server.js` now uses `crypto.randomBytes(32)` | Resolved — Mid Review was accurate at the time. |
| DB name | `README.md` says database name is `c4p2` | `db.js` fallback is `internship_tracker'` | Active mismatch — README is correct; `db.js` default is wrong. |
| Frontend component location | Mid Review referred to all 690 lines in `App.jsx` | Code is now split across four files | Resolved — component split happened after Mid Review. |
| `changesRequested` status | Not in Case Brief or Mid Review | Present in schema ENUM, UI, backend, tests | Extension beyond spec — bonus feature not documented in `Case_Brief.md`. |
| `schema.sql` ALTER TABLE on line 41 | Not documented | Present in `schema.sql` | The ALTER was added to update a column definition during development. Creates a double definition (CREATE + ALTER). Functionally safe but redundant. |

---

## 14. Known Limitations

1. **No student withdrawal/cancel.** No `DELETE /api/applications/:id` route. A student cannot retract a submitted application.
2. **No status-transition guard.** A coordinator can move an application from `approved` back to `submitted`. No state machine.
3. **No rejection-requires-comment validation.** A coordinator can reject with an empty `coordinatorComment`.
4. **Plaintext passwords.** Stored and compared in plaintext. `bcrypt` was intentionally excluded.
5. **Session tokens never expire.** Logging out clears `localStorage` but does not delete the session token from the database. A captured token is valid indefinitely.
6. **CORS fully open.** Any origin can make requests to the backend API.
7. **`submittedDate` is client-controlled.** A student can send any date as the submission date.
8. **No pagination.** All applications returned in a single query.
9. **No debounce on company filter.** Every keystroke triggers a backend query.
10. **No success notification.** After submitting an application, user is silently redirected with no confirmation.
11. **Hardcoded API URL.** `http://localhost:5001/api` is duplicated in three frontend files with no Vite proxy.
12. **`db.js` fallback name mismatch.** Default DB name is `internship_tracker`, but schema creates `c4p2`.
13. **No frontend tests.** UI behaviour, routing guards, and component rendering are not covered by any automated test.

---

## 15. Demo Script

Use this script to demonstrate the system end-to-end in approximately 8–10 minutes.

### Step 0 — Start the System

```bash
# Terminal 1
cd backend && npm run db:setup && npm run dev

# Terminal 2
cd frontend && npm run dev
# Open http://localhost:5173
```

### Step 1 — Student Login and View

1. On the login page, the quick-select dropdown shows three seeded accounts.
2. Select **student1 (Student Account)**. Click **Sign In**.
3. Dashboard shows one application row — `Student One | Google | Software Engineer Intern | Submitted`.
4. The **Submit Application** button is visible. The **Review** button is **not** visible.

### Step 2 — Submit a New Application

1. Click **Submit Application**.
2. Fill in: Company `Acme Corp`, Position `Backend Intern`, Start `2026-10-01`, End `2027-04-01`.
3. Test client-side validation: set End Date before Start Date — error message appears immediately.
4. Correct the dates and click **Submit Application**.
5. Redirect to dashboard. New row appears with status `Submitted`.

### Step 3 — Student Isolation Check

1. Sign out. Log in as **student2**.
2. Dashboard shows only Student Two's application (Meta row). The Acme Corp row is **not visible**.

### Step 4 — Coordinator Review

1. Sign out. Log in as **coordinator1**.
2. Dashboard shows **all** applications (Google, Meta, and Acme Corp rows).
3. Company filter: type `Acme` — only the Acme Corp row appears. Clear filter.
4. Status filter: select `Approved` — only the Meta row appears. Reset to `All Statuses`.
5. Click **Review** on the Acme Corp row. The blur-overlay modal opens.
6. Change status to `Under Review`. Add comment: `Documents look good, reviewing further.` Click **Save Decision**.
7. The row updates in place. Status badge changes to `Under Review`.
8. Click **Review** again. Change status to `Changes Requested`. Comment: `Please update company timeline.` Save.

### Step 5 — Student Resubmit

1. Sign out. Log in as **student1**.
2. The Acme Corp row now shows `Changes Requested` with the coordinator comment visible.
3. An **Edit & Resubmit** button appears. Click it.
4. Update Company Name to `Acme Corp Updated`. Adjust dates. Click **Resubmit Application**.
5. Row updates. Status reverts to `Submitted`. Comment is preserved.

### Step 6 — Run Automated Tests (Optional, with server running)

```bash
cd backend && npm test
# Expected: all test groups pass, cleanup deletes TEST_* rows
```

---

## 16. Suggested Viva Questions

### Architecture and Separation

1. Explain what happens from the moment a user clicks **Sign In** to the moment the dashboard loads. Name every file involved.
2. Why does the frontend never connect to MySQL directly? What would break if it did?
3. What is `mysql2/promise` and why is a connection pool used instead of a single connection?
4. What does `multipleStatements: true` do in `db-setup.js`, and why is it needed?

### Authentication and Sessions

5. Before the final stage, the backend used an `x-user-id` integer header for authentication. What was the security risk, and how was it fixed?
6. How does `crypto.randomBytes(32).toString('hex')` compare to a JWT? What does this implementation lack that a JWT provides?
7. What happens if a user closes the browser without logging out? Is the session still valid?
8. What SQL query does `requireAuth` execute, and what does it prevent?

### Role-Based Access

9. A student submits a PUT request with their own valid token and adds `x-user-role: coordinator` to the header. Walk through exactly what happens on the backend.
10. How does the backend prevent Student 2 from viewing Student 1's applications by changing a query parameter?
11. Point to the exact lines of code that enforce the coordinator-only protection on the PUT route.

### Validation and Data Integrity

12. Where is the date-order validation applied? Is it applied in both places? What is the difference in effect?
13. Why is accepting `submittedDate` from the request body a security concern? How would you fix it?
14. What does `ON DUPLICATE KEY UPDATE` do in `schema.sql`, and why is it used?

### Testing

15. How does `test.js` reset the database before running tests? Why is this important?
16. How does the test verify that a student cannot impersonate a coordinator? Walk through Test 5A line by line.
17. The test uses `DELETE FROM applications WHERE companyName LIKE 'TEST_%'` for cleanup. What is the naming convention, and could this accidentally delete real data?
18. What are three things the automated tests do **not** cover, and how would you address them?

### Security and Limitations

19. If an attacker knows a valid session token (e.g., from reading `localStorage`), what can they do with it? What is missing that would prevent indefinite access?
20. Why is CORS important? What is the risk of using `app.use(cors())` with no options in a production API?
21. You store passwords in plaintext. If the `users` table were leaked, what is the immediate consequence? How would `bcrypt` reduce the risk?
22. The `changesRequested` status and the resubmit route were not in the Case Brief. How did you ensure this addition did not break the core requirements?

---

*Review prepared from direct file inspection of all source files. No code was modified during this review.*
