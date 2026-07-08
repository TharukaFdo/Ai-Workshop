# Final Review — Maintenance Request Tracker
**Project:** p3 — Maintenance Request Tracker  
**Review Date:** 2026-06-14  
**Review Stage:** Final — after testing, security hardening, and maintainability cleanup.  
**Reviewer:** Antigravity (automated evidence-based final review)  
**Scope:** Read-only analysis. No source code, schema, seed data, package files, or configuration was modified.

---

## 1. Final Feature Summary

The Maintenance Request Tracker is a full-stack prototype built with **React 18 (Vite)** on the frontend and **Express 4 / Node.js** on the backend, backed by a **MySQL** database (database name `c7p3`). It implements a two-role system — **Requester** and **Technician** — covering the complete maintenance request lifecycle from submission through progress tracking to closure.

| Feature | Status | Evidence |
|---|---|---|
| Maintenance request submission (title, description, location, priority, name) | ✅ Complete | `POST /api/requests`, `routes/requests.js` L54–88, `schema.sql` L18–32 |
| View own requests (Requester scoped) | ✅ Complete | `GET /api/requests`, scoped to `requester_id`, `requestService.js` L60–80 |
| Edit own open request details | ✅ Complete | `PUT /api/requests/:id`, ownership + `status='submitted'` guard |
| View all requests (Technician) | ✅ Complete | `GET /api/requests`, all records for Technician role |
| Filter by location, priority, status | ✅ Complete | Query params, parameterised SQL in `requestService.js` L30–80 |
| Progress update and technician notes (Technician) | ✅ Complete | `PATCH /api/requests/:id`, `requestService.js` L98–126 |
| Request closure with `closed_at` timestamp | ✅ Complete | `status='closed'` via PATCH; `closed_at` set to `NOW()` |
| High-priority closure note requirement | ✅ Complete | Backend route + service double-check; 400 returned without note |
| Technician note visible to Requester (read-only) | ✅ Complete | `App.jsx` L503–508; shown when non-empty |
| Database-backed login with role | ✅ Complete | `app_users` table; HMAC-signed custom token |
| Role-gated API routes | ✅ Complete | `checkUser` middleware; role re-fetched from DB on every call |
| Automated integration tests | ✅ Complete (9 tests) | `backend/tests/requests.test.js` — Node built-in test runner |
| Test cleanup (`deleteRequestForTest`) | ✅ Complete | `after()` hook cleans test record; pool closed |
| Status transition order enforcement | ⚠️ Partial | No enforced `submitted→inProgress→completed→closed` progression |
| Field max-length validation (title/location/name 100 chars) | ⚠️ Missing | Schema enforces via VARCHAR(100) but no API-level 400 returned |
| `closed_at` visible in UI | ⚠️ Missing | Stored in DB; not rendered for either role |
| Closure confirmation dialog | ⚠️ Missing | No UI "Are you sure?" step |

---

## 2. Review Scoring Matrix

| Feature / Area | Functionality 0-5 | Data Persistence 0-5 | Backend Security / Role Control 0-5 | Validation / Error Handling 0-5 | Testing Evidence 0-5 | Maintainability 0-5 | UI / Manual Usability 0-5 | Evidence | Notes |
|---|---:|---:|---:|---:|---:|---:|---:|---|---|
| Project setup and run commands | 4 | — | — | — | 4 | 3 | — | `README.md`, root `package.json`, `backend/package.json` | Two-terminal workflow documented. `npm run install-all`, `db:setup`, `test` all wired at root. No `nodemon`; no single-command start. |
| Database setup and starter data | 4 | 4 | — | — | 4 | 3 | — | `schema.sql`, `scripts/dbSetup.js`, `npm run db:setup` | `dbSetup.js` replaces placeholder hashes with real HMAC hashes. Schema is repeatable (DROP/CREATE). DB name mismatch between `.env.example` and actual `.env`/`schema.sql`. No sample request rows seeded. |
| Login workflow | 4 | 4 | 3 | 4 | 4 | 3 | 4 | `routes/auth.js`, `utils/auth.js`, `services/userService.js`, `App.jsx` L60–81 | DB-backed login; HMAC-signed custom token with 24-hr expiry; token verified on every call. SHA-256 HMAC (not bcrypt); secret fallback hardcoded in source. No token revocation. |
| Role-based access | 5 | — | 5 | 4 | 4 | 4 | 4 | `routes/requests.js` L9–33, L41–47, L68–70, L112–113, L165–166 | Role re-fetched from DB on every protected call (cannot be spoofed via token). Requester-only POST, Technician-only PATCH, ownership check on PUT, scoped GET. UI mirrors backend. |
| Main create action | 4 | 5 | 4 | 4 | 5 | 4 | 4 | `routes/requests.js` L54–88, `requestService.js` L10–17, `App.jsx` L119–159 | POST guarded, persists all five required fields, returns 201. Enum and required-field checks present. Missing max-length backend validation (3 fields). |
| Main view/list action | 5 | 5 | 5 | 4 | 5 | 4 | 4 | `routes/requests.js` L36–52, `requestService.js` L22–80, `App.jsx` L92–117 | Requesters see only own records (scoped by `requester_id`). Technicians see all. Filter combinations use parameterised SQL. Ordered by `created_at DESC`. |
| Main update/status/cancel action | 4 | 5 | 5 | 4 | 5 | 4 | 4 | `routes/requests.js` L91–141 (PUT), L144–191 (PATCH), `requestService.js` L85–126 | Requester PUT enforces ownership and `submitted` guard in both route and SQL. Technician PATCH sets `closed_at` on closure. No enforced transition order. |
| Protected action | 5 | 5 | 5 | 5 | 5 | 4 | 4 | `routes/requests.js` L165–166, L170–176; `requestService.js` L100–108; `App.jsx` L216–219 | PATCH is Technician-only (403 for others). High-priority closure without note blocked at route AND service layer (double-check). Frontend also pre-validates. |
| Secondary feature | 5 | — | 5 | 4 | 5 | 4 | 4 | `requestService.js` L30–80, `routes/requests.js` L36–52, `App.jsx` L362–390 | Filter by location, priority, status end-to-end with parameterised SQL. Requester filters scoped to own records. Both `getAllRequests` and `getRequestsByRequesterId` support all three filters. |
| Case-specific: location, priority, and problem details | 5 | 5 | 4 | 4 | 5 | 4 | 4 | `schema.sql` L20–24, `routes/requests.js` L57–68, `App.jsx` L321–345, `index.css` badge classes | Location (VARCHAR 100, dropdown), Priority (ENUM), Description (TEXT) present in schema and enforced on submit. All rendered in list and detail modal. Priority badge colours distinguish severity. High priority marked with urgency indicator. |
| Case-specific: technician notes and progress updates | 5 | 5 | 5 | 4 | 5 | 4 | 4 | `schema.sql` L27, `routes/requests.js` L144–191, `requestService.js` L98–126, `App.jsx` L540–548 | `technician_note` (TEXT, nullable) in schema. PATCH updates status and note atomically. Requester sees note read-only. Technician form always editable. Test 7 exercises status update and note write. |
| Case-specific: request closure protection and requester visibility | 5 | 5 | 5 | 5 | 5 | 4 | 4 | `routes/requests.js` L165–176, `requestService.js` L100–108, `schema.sql` L30, `App.jsx` L503–516 | Closing is Technician-only (403 for Requester). `closed_at` set to NOW() on closure. High-priority requests blocked from closure without a note at route AND service layers. Requester sees note read-only; edit fields disabled when not `submitted`. Test 8.5 confirms closure note protection. Test 9 confirms `closed_at` populated. |
| UI / manual usability | 4 | — | — | 4 | 3 | 3 | 4 | `App.jsx`, `index.css` | Login with user selector, dashboard with filter bar, table with clickable rows, detail modal. Role-appropriate UI branching. Colour-coded badges. Responsive two-column Requester layout. No `closed_at` shown, no confirmation dialog. Entire UI in one 563-line file. |
| Security posture | 3 | — | 3 | — | 3 | 3 | — | `backend/.env`, `utils/auth.js`, `server.js` L9, `config/db.js` | DB credentials backend-only ✅. CORS wildcard (dev acceptable). Custom HMAC token (not JWT). SHA-256 HMAC password hash (not bcrypt). `JWT_SECRET` fallback hardcoded in source. `.env` committed to repo with real secret value. |
| Testing evidence | 5 | — | — | — | 5 | 4 | — | `backend/tests/requests.test.js` (9 tests, 170 lines), `docs/TEST_PLAN.md` | Node built-in test runner. 9 integration tests: DB connectivity, auth, create, filter, own-edit, ownership check, technician update, state-locked edit, high-priority note block, closure. `after()` hook cleans test record and closes pool. Test plan documented. |
| Maintainability | 3 | — | — | — | 4 | 3 | — | All source files | JSDoc on service methods. Config, services, routes separated. Constants module. Entire frontend is one monolithic 563-line `App.jsx`. Hardwired requester name map. Dead `.role-picker` CSS. `.env.example` DB name mismatch. No linter config. `deleteRequestForTest` in production service file. |

---

## 3. Project Structure and Run Commands

```
p3/
├── package.json                  # Root: install-all, backend, frontend, db:setup, test
├── README.md
├── REQUIREMENTS.md
├── Case_Brief.md
├── PROJECT_CONTEXT.md
├── MID_REVIEW.md
├── FINAL_REVIEW.md
├── docs/
│   └── TEST_PLAN.md
├── backend/
│   ├── package.json              # start, dev, db:setup, test
│   ├── .env                      # actual credentials (committed — see §12)
│   ├── .env.example              # template (DB_NAME value is wrong — see §13)
│   ├── server.js                 # Express entry point, port 5000
│   ├── schema.sql                # DROP/CREATE tables + placeholder seeds
│   ├── config/
│   │   ├── db.js                 # mysql2/promise pool — reads all 5 env vars
│   │   └── constants.js          # PRIORITIES, STATUSES arrays
│   ├── routes/
│   │   ├── auth.js               # POST /api/auth/login
│   │   └── requests.js           # GET, POST, PUT, PATCH /api/requests
│   ├── services/
│   │   ├── requestService.js     # DB ops for requests + deleteRequestForTest helper
│   │   └── userService.js        # getUserByUsername, getUserById
│   ├── utils/
│   │   └── auth.js               # hashPassword, verifyPassword, generateToken, verifyToken
│   ├── scripts/
│   │   └── dbSetup.js            # runs schema.sql + replaces placeholder hashes
│   └── tests/
│       └── requests.test.js      # 9 integration tests (Node built-in test runner)
└── frontend/
    ├── package.json              # dev (vite), build, preview
    ├── vite.config.js            # port 3000, proxy /api → localhost:5000
    ├── index.html
    └── src/
        ├── main.jsx              # React root mount
        ├── App.jsx               # Entire SPA (563 lines, single component)
        └── index.css             # CSS custom properties, all component styles
```

### Run Commands

```bash
# One-time dependency install (both backend and frontend)
npm run install-all

# Database initialisation — repeatable, destroys and recreates all tables
npm run db:setup

# Start backend   →  http://localhost:5000  (Terminal 1)
npm run backend

# Start frontend  →  http://localhost:3000  (Terminal 2)
npm run frontend

# Run automated tests (MySQL must be running and db:setup must have been run)
npm test
```

> **Note:** There is no single-command start. Two terminals are required. The backend runs with `node server.js` — no hot-reload. Manual restart is needed after backend code changes.

---

## 4. Frontend/Backend Separation

React and Express are **fully separated**. They live in independent directories (`frontend/` and `backend/`), each with their own `package.json` and `node_modules`. They run on different ports.

| Check | Result | Evidence |
|---|---|---|
| Frontend runs on separate port | ✅ | `vite.config.js` L8: `port: 3000` |
| Backend runs on separate port | ✅ | `server.js` L7: `PORT=5000` (from env or default) |
| Frontend proxies `/api` to backend | ✅ | `vite.config.js` L9–11: `proxy: { '/api': 'http://localhost:5000' }` |
| React never connects to MySQL directly | ✅ | No MySQL client in `frontend/` dependencies. `mysql2` is backend-only. |
| DB credentials never in frontend | ✅ | Only `backend/.env` holds credentials. No `.env` file in `frontend/`. |
| No direct SQL in frontend code | ✅ | `App.jsx` uses `fetch('/api/...')` exclusively. |

---

## 5. Database Setup and Table Summary

### Connection Method

`backend/config/db.js` creates a `mysql2/promise` connection pool reading from environment variables:

| Variable | Configured | Value |
|---|---|---|
| `DB_HOST` | ✅ | `localhost` |
| `DB_PORT` | ✅ | `3306` |
| `DB_USER` | ✅ | `root` |
| `DB_PASSWORD` | ✅ | *(password not printed — see `backend/.env`)* |
| `DB_NAME` | ✅ | `c7p3` |

All five variables are read from `process.env`. Each has a code-level fallback default in `config/db.js` L5–9.

### Tables

| Table | Purpose | Key Columns |
|---|---|---|
| `app_users` | Login identity and role | `id`, `username`, `password_hash`, `role ENUM('Requester','Technician')`, `created_at` |
| `requests` | Maintenance request records | `id`, `title`, `description`, `location`, `priority ENUM('Low','Medium','High')`, `requester_name`, `requester_id FK→app_users`, `status ENUM('submitted','inProgress','completed','closed')`, `technician_note`, `created_at`, `updated_at`, `closed_at` |

A **login/users table exists** (`app_users`). Passwords are stored as HMAC-SHA256 hashes keyed by `JWT_SECRET`.

### How Tables and Seed Data Are Created Again

1. Execute `backend/schema.sql` via the MySQL CLI (`mysql -u root -p < backend/schema.sql`). This creates the `c7p3` database, drops and recreates both tables, and inserts three `app_users` rows with the literal string `placeholder_hash` as their passwords.
2. Run `npm run db:setup` (calls `scripts/dbSetup.js`). This re-executes the schema and then replaces all `placeholder_hash` values with the real HMAC-SHA256 hash of `password123` computed using the `JWT_SECRET` from `.env`.

> **Warning:** Step 2 is mandatory. Skipping it leaves the database in a state where logins fail because the stored hash is the literal text `placeholder_hash`. Re-running `db:setup` also deletes all request data (the schema uses `DROP TABLE IF EXISTS`).

### Seed Users

| Username | Role | Password |
|---|---|---|
| `alice_requester` | Requester | `password123` |
| `charlie_requester` | Requester | `password123` |
| `bob_technician` | Technician | `password123` |

No sample `requests` rows are seeded. The requests table is empty after setup.

---

## 6. Login and Role/Access Explanation

### Login Flow

1. User selects a username and enters password on the login screen (`App.jsx` L248–280).
2. Frontend sends `POST /api/auth/login` with `{ username, password }`.
3. `routes/auth.js` calls `userService.getUserByUsername(username)` — queries `app_users` by username.
4. If a user is found, `authUtils.verifyPassword(password, user.password_hash)` computes an HMAC-SHA256 hash of the submitted password (keyed by `JWT_SECRET`) and compares it with the stored hash using string equality.
5. On match, `authUtils.generateToken(user)` creates a custom signed token with the format `id:role:timestamp.HMAC_signature`.
6. Token and user object (`{ id, username, role }`) are returned to the frontend.
7. Frontend stores both in `localStorage`; all subsequent API requests send `Authorization: Bearer <token>`.

### Token Verification on Every Protected Call

The `checkUser` middleware in `routes/requests.js` (L9–34) runs before every protected route:
1. Extracts the `Bearer` token from the `Authorization` header.
2. Calls `authUtils.verifyToken(token)` — re-computes the expected HMAC signature, compares it against the token's signature segment, and checks that the timestamp is within 24 hours.
3. Calls `userService.getUserById(payload.id)` — **re-fetches the user's role from the database on every API call**. The role in the token is ignored for authorisation purposes; only the DB record is trusted.
4. Attaches the live `user` object to `req.user` for use in the route handler.

### Role Enforcement Matrix

| Route | Requester | Technician | Unauthenticated |
|---|---|---|---|
| `GET /api/requests` | Own records only (scoped by `requester_id`) | All records | 401 |
| `POST /api/requests` | ✅ Allowed | 403 | 401 |
| `PUT /api/requests/:id` | ✅ Own request + `status='submitted'` only | 403 | 401 |
| `PATCH /api/requests/:id` | 403 | ✅ Allowed | 401 |
| `GET /api/health` | Open (no auth required) | Open | Open |

All role restrictions are **backend-enforced**. The React UI shows or hides forms for usability, but the backend independently rejects any out-of-role or out-of-ownership call.

---

## 7. Protected Action Explanation

**Protected action:** Technician notes and progress updates (including request closure) are restricted to the Technician role. Requesters cannot close requests or edit technician notes.

### Protection Layers

| Layer | Check | Code Location |
|---|---|---|
| Backend role guard on PATCH | Returns 403 if `req.user.role !== 'Technician'` | `routes/requests.js` L165–167 |
| High-priority note requirement — route layer | Returns 400 if `status='closed'`, `priority='High'`, and no note present | `routes/requests.js` L170–176 |
| High-priority note requirement — service layer | Throws error with same condition before executing UPDATE | `requestService.js` L100–108 (double-check) |
| `closed_at` set on closure | `closed_at = NOW()` added to the UPDATE query when status is `closed` | `requestService.js` L115–116 |
| Requester UI hides Technician form | Modal branches on `currentUser.role` | `App.jsx` L458 |
| Requester UI disables fields when not `submitted` | `disabled={selectedRequest.status !== 'submitted'}` on all edit inputs | `App.jsx` L466, L474, L486, L498 |
| Requester note field shown read-only | Rendered only when `selectedRequest.technician_note` is truthy | `App.jsx` L503 |
| Frontend pre-validation for closure | Checks note before sending PATCH | `App.jsx` L216–219 |

The high-priority closure note rule is the only rule with **double backend enforcement** (route handler and service layer independently reject the invalid request).

---

## 8. Validation Summary

| Rule | Required By | Backend | Frontend | Notes |
|---|---|---|---|---|
| All five create fields required | REQUIREMENTS §4 | ✅ `routes/requests.js` L62–64 | ✅ HTML `required` + JS trim guard | |
| Priority must be Low/Medium/High | REQUIREMENTS §4 | ✅ `routes/requests.js` L66–68 | ✅ Dropdown constrains input | |
| Status must be valid enum | REQUIREMENTS §4 | ✅ `routes/requests.js` L154–156 | ✅ Dropdown constrains input | |
| PUT fields required (title, description, location, priority) | REQ-2 | ✅ `routes/requests.js` L97–99 | ✅ HTML `required` | |
| PATCH status required | — | ✅ `routes/requests.js` L150–152 | ✅ Dropdown always has a value | |
| Edit blocked if not `submitted` | REQ-2 | ✅ Route L122–124 + SQL `WHERE status='submitted'` L89 | ✅ Fields disabled; submit hidden | Two-layer enforcement |
| Requester cannot update status/notes | REQ-4 | ✅ 403 on PATCH | ✅ UI hides form | |
| Ownership check on PUT | REQ-2 | ✅ `routes/requests.js` L117–119 | — | |
| High-priority close requires note | Case-specific | ✅ Route L170–176 + Service L100–108 | ✅ `App.jsx` L216–219 | Triple enforcement |
| Title max 100 chars | REQUIREMENTS §4 | ❌ Missing | ❌ Missing | DB rejects via VARCHAR(100) — returns 500, not 400 |
| Location max 100 chars | REQUIREMENTS §4 | ❌ Missing | ❌ Missing | Same |
| RequesterName max 100 chars | REQUIREMENTS §4 | ❌ Missing | ❌ Missing | Same |
| Status transition order | REQ-4 implied | ❌ Missing | ❌ Missing | Technician can jump `submitted→closed` or revert |

**Summary:** Enum validation, required-field checks, role guards, ownership checks, and the case-specific closure protection are solid. Three max-length checks remain missing in the backend. Status transition ordering remains unenforced.

---

## 9. Automated and Manual Testing Summary

### Automated Tests

**Command:** `npm test` (from root) → runs `node --test tests/requests.test.js` inside `backend/`.  
**Framework:** Node.js built-in test runner (`node:test`, `node:assert`). No external test library required.  
**File:** `backend/tests/requests.test.js` — 9 tests, 170 lines.

| # | Test Name | What It Checks |
|---|---|---|
| 1 | Database connectivity | `SELECT 1` against the pool succeeds |
| 2 | Authentication login password verification | `verifyPassword('password123', hash)` → true; wrong password → false |
| 3 | Submit maintenance request (Requester role allowed) | `createRequest()` inserts record, returns auto-increment ID, `status='submitted'` |
| 4 | Filter requests by location, priority, or status | `getAllRequests({ priority: 'High' })` includes test record; `{ status: 'inProgress' }` excludes it |
| 5 | Update own request details (Owner allowed when status is submitted) | `updateRequestDetails()` succeeds and title is updated in DB |
| 6 | Blocked: Update details by non-owner or when status is not submitted | Confirms `request.requester_id !== charlie_requester.id` (ownership data integrity) |
| 7 | Technician allowed: progress update and note edit | `updateRequestStatusAndNotes()` sets `inProgress` and stores note |
| 8 | Blocked: Requester updating details after status is inProgress | `updateRequestDetails()` returns `false` (SQL `WHERE status='submitted'` blocks it) |
| 8.5 | Technician blocked: close high priority request without technician note | `assert.rejects()` confirms error is thrown when note is empty and priority is High |
| 9 | Technician allowed: close request | Status becomes `closed`, `closed_at` is non-null in DB |

**Setup:** `before()` hook fetches all three seeded users and asserts they are present.  
**Cleanup:** `after()` hook deletes the test request by ID and ends the DB pool connection.

### Expected Console Output

```
✔ Database connectivity (Xms)
✔ Authentication login password verification (Xms)
✔ Submit maintenance request (Requester role allowed) (Xms)
✔ Filter requests by location, priority, or status (Xms)
✔ Update own request details (Owner allowed when status is submitted) (Xms)
✔ Blocked: Update details by non-owner or when status is not submitted (Xms)
✔ Technician allowed: progress update and note edit (Xms)
✔ Blocked: Requester updating details after status is inProgress (Xms)
✔ Technician blocked: close high priority request without technician note (Xms)
✔ Technician allowed: close request (Xms)
```

### What Was NOT Automated (Manual Checks Required)

| Gap | Reason |
|---|---|
| HTTP-level 401/403 status codes from routes | Tests call service functions directly, not via HTTP. Route-level guards need a REST client (Postman/curl) to verify HTTP status codes. |
| Frontend UI role-branching | No frontend test framework (no Vitest, Playwright, Testing Library). All frontend coverage is manual. |
| Filter dropdowns in the UI | Manual: navigate to `http://localhost:3000` and test dropdowns. |
| `closed_at` stored in DB | Manual: `SELECT * FROM requests WHERE status='closed'` in a MySQL client. |
| Status transition regression (H-3) | Manual: send `PATCH` with `status='submitted'` on a closed request and observe it succeeds (current gap). |
| Over-length input returning 500 | Manual: send a title longer than 100 characters; observe 500 response instead of 400. |

---

## 10. Stage 11 Change Summary

Changes made after the mid-review (Stage 7) through to the final stage:

| Area | Change | Evidence |
|---|---|---|
| **Testing infrastructure added** | 9 automated integration tests written using the Node built-in test runner. No test file existed at mid-review. | `backend/tests/requests.test.js` (new, 170 lines) |
| **Test cleanup hooked up** | `deleteRequestForTest` helper (pre-existing in `requestService.js`) is now actively called in the `after()` hook, and the DB pool is closed cleanly. | `requests.test.js` L25–32 |
| **Test plan documented** | `docs/TEST_PLAN.md` created documenting all test cases, success/failure cases, role access cases, and manual verification guide. | `docs/TEST_PLAN.md` (new, 92 lines) |
| **High-priority note protection strengthened** | Service-layer double-check added in `requestService.js` L100–108. Route-level check existed at mid-review; service layer now independently enforces the same rule. | `requestService.js` L100–108 |
| **Frontend pre-validation for closure added** | `App.jsx` L216–219: client-side guard blocks PATCH send if status=`closed`, priority=`High`, and note is empty. | `App.jsx` L216–219 |
| **Root test command wired** | `npm test` at root level delegates to `npm run test --prefix backend`. | Root `package.json` L10 |

**What was not changed (remaining gaps from mid-review):**
- Password hashing algorithm remains SHA-256 HMAC (not upgraded to bcrypt/argon2).
- Custom token format not replaced with standard JWT.
- CORS wildcard remains (`app.use(cors())`).
- Max-length validation for title/location/requesterName still absent in backend API.
- Status transition order still not enforced.
- `App.jsx` remains a single monolithic 563-line file.
- `closed_at` still not displayed in the UI for either role.
- Hardwired requester name mapping still in `App.jsx` L48.
- `.env` file is still committed to the repository containing real secret values.
- `.env.example` `DB_NAME` mismatch not corrected.

---

## 11. Stage Drift / Early Work

| Item | Expected Stage | Found | Assessment |
|---|---|---|---|
| Custom HMAC signed token | Hardening stage | Present from early stages | Acceptable — mechanism exists; algorithm upgrade is the hardening step |
| `closed_at` column | Core workflow stage | Present in schema and service from early stage | ✅ Correctly scoped — not drift |
| `deleteRequestForTest` helper | Testing stage | In production `requestService.js` from early stage | ⚠️ Test utility shipped in production service; now used by tests so serves a purpose, but should be isolated to a test module |
| `/api/health` route | Ops/infrastructure | In `server.js` from early stage | Minor early addition; not harmful |
| Token 24-hour expiry | Hardening | In `verifyToken` from early stage | Acceptable prototype-quality forward step |
| High-priority note rule (route layer) | Case-specific | Present from mid-review | ✅ Final stage strengthened it with a service layer double-check |
| Filter scoped to Requester's own records | Not explicitly staged | Present from early | ✅ Correct behaviour |

No email notifications, file attachments, audit logs, or advanced security measures (rate limiting, bcrypt) were pre-implemented. Stage drift is minimal and low-risk.

---

## 12. Security Risks and Exposed-Secret Check

> Actual secret values are not printed. The existence and risk level of each risk is stated.

| Risk | Severity | Detail |
|---|---|---|
| `.env` committed to repository | 🟡 Medium | `backend/.env` is present in the project directory. It contains a real `JWT_SECRET` value (not a placeholder) and the database password (currently empty, low impact). If pushed to a shared Git host, the `JWT_SECRET` would be exposed, allowing token forgery. |
| `JWT_SECRET` fallback hardcoded in source | 🟡 Medium | `utils/auth.js` L4: if `JWT_SECRET` env var is absent, the app silently falls back to a hardcoded string. Anyone reading the source can forge valid tokens when the env var is missing or if the application uses the fallback. |
| SHA-256 HMAC used for password hashing | 🟡 Medium | `authUtils.hashPassword` uses `crypto.createHmac('sha256', JWT_SECRET)`. This is not a password KDF (key derivation function). It has no per-user salt, is fast (brute-force friendly), and its security depends entirely on the `JWT_SECRET` remaining secret. bcrypt or argon2 are expected for any real use. |
| `verifyPassword` uses string equality | 🟢 Low | `===` comparison instead of `crypto.timingSafeEqual`. In theory susceptible to timing attacks; not practically exploitable in a local prototype. |
| CORS wildcard | 🟢 Low | `server.js` L9: `app.use(cors())` allows all origins. Acceptable in local development; must be restricted before any deployment. |
| Login screen displays default password | 🟢 Low | `App.jsx` L274–276 renders `Note: Standard seeded password is password123`. Acceptable for demo; must be removed for any real use. |
| No rate limiting on login | 🟢 Low | No protection against brute-force login attempts. Acceptable for a local prototype. |
| Token has no revocation mechanism | 🟢 Low | A signed token remains valid for 24 hours even after a client-side logout. Logout only clears `localStorage`. Acceptable for prototype scope. |

**DB credentials are NOT exposed to the React frontend.** The `.env` file is backend-only and the frontend directory contains no environment file.

---

## 13. Documentation/Code Mismatches

| Document | Claim | Reality | Impact |
|---|---|---|---|
| `REQUIREMENTS.md` §2 | Auth via `X-User-Role` and `X-User-Id` headers or "basic session headers" | Implementation uses a custom HMAC-signed `Authorization: Bearer` token; role is re-fetched from DB on each call | Low — the implemented mechanism is stronger than the document's placeholder description, but the document is outdated |
| `.env.example` L6 | `DB_NAME=maintenance_db` | `schema.sql` creates database `c7p3`; actual `.env` uses `c7p3` | Medium — following `.env.example` literally would create a config pointing at a non-existent database, causing connection failures |
| `REQUIREMENTS.md` §6 | Frontend unit tests (validation messages, role-switch toggling) | No frontend tests exist; no frontend test framework configured | Low — frontend test requirement was not met; this is a known gap |
| `docs/TEST_PLAN.md` expected output | Lists 9 named tests | Test file contains test "8.5" which does not appear in the expected output table | Low — minor documentation gap; the test exists and passes |
| `REQUIREMENTS.md` §4 | Max-length validation on title, location, requesterName (100 chars) | No backend API validation present; MySQL returns a column-too-long error as an unhandled 500 | Medium — requirement is documented, not implemented |

---

## 14. Known Limitations

1. **No status transition ordering.** A Technician can set a request directly from `submitted` to `closed`, or revert a `closed` request back to `submitted`. REQUIREMENTS.md implies a progression but it is not enforced in code.
2. **No field max-length validation in the API.** Titles, location names, and requester names longer than 100 characters cause an unhandled MySQL error, returning a 500 response instead of a 400 with a user-friendly message.
3. **`closed_at` not displayed in the UI.** The timestamp is stored in the database and confirmed by automated tests, but neither the Requester nor the Technician can see it in the interface.
4. **Monolithic frontend.** The entire SPA is 563 lines in a single `App.jsx` file with no component decomposition, limiting testability and maintainability.
5. **No frontend tests.** REQUIREMENTS.md §6 calls for frontend unit tests (form validation messages, role-switch toggling). None were implemented. All frontend coverage is manual.
6. **Hardwired requester name mapping.** `App.jsx` L48 maps only `alice_requester → 'Alice Smith'`; any other requester username will produce an empty or incorrect pre-fill.
7. **No pagination.** Acceptable for the prototype scope but would break usability with more than a few dozen records.
8. **No sample request seed data.** After setup, the requests table is empty. A demonstration requires creating data manually.
9. **Password hashing is not production-grade.** SHA-256 HMAC is used instead of a proper KDF like bcrypt or argon2.
10. **`.env` committed to the repository.** If pushed to a shared Git host, the `JWT_SECRET` is exposed.
11. **No closure confirmation dialog.** Accidental closure is possible with a single click.
12. **No hot-reload in development.** Backend uses `node server.js`; no `nodemon` means a manual restart is required after every backend code change.

---

## 15. Demo Script

**Prerequisites:** MySQL is running, `npm run db:setup` has been run, both servers are started in separate terminals.

### Scene 1 — Requester Submits a Request
1. Open `http://localhost:3000` in a browser.
2. Select **Alice Smith (Requester)** from the dropdown, enter `password123`, click **Login**.
3. Show the empty "My Requests" list on the dashboard.
4. Fill in the Submit Request form:
   - Your Name: `Alice Smith`
   - Problem Title: `Broken light fixture`
   - Location: `Building A`
   - Priority: `High`
   - Description: `Ceiling light in the conference room has been flickering since Monday.`
5. Click **Submit Request**. Show the green success alert. The new request appears in the table with status badge `submitted` and the 🚨 Urgent marker.

### Scene 2 — Requester Edits Own Open Request
1. Click the request row to open the detail modal.
2. Change Priority to `Medium`. Click **Update Details**. Show the success message.
3. Click the row again — confirm Priority is now `Medium`.

### Scene 3 — Technician Views All Requests and Updates Progress
1. Click **Logout**. Select **Bob Tech (Technician)**, password `password123`, **Login**.
2. Show the "All Requests Dashboard" — Alice's request is visible with all fields.
3. Use the Priority filter dropdown → select `High`. (If the priority was changed to Medium in Scene 2, first create a new High-priority request as Alice, then return here.) Show the list filtered.
4. Clear filter. Click Alice's request row.
5. The modal shows the read-only info panel (Submitted By, Location, Description).
6. Set Status to `inProgress`, add Technician Notes: `Inspected the fitting. Ordered a replacement ballast.`
7. Click **Save Workflow & Notes**. Show the success message.

### Scene 4 — Requester Cannot Edit an In-Progress Request
1. Logout. Log in as Alice (`alice_requester` / `password123`).
2. Click the request row that Bob updated.
3. Show that all input fields (title, location, priority, description) are **disabled**.
4. Show the Technician Notes panel displaying Bob's note in read-only view.
5. Show the footer message: _"This request is already in progress or closed and cannot be modified."_

### Scene 5 — Technician Closes Request with High-Priority Note Enforcement
1. Logout. Log in as Bob.
2. Open a High-priority request. Set Status to `closed`. Leave Technician Notes empty.
3. Click **Save Workflow & Notes**. Show the frontend error: _"High priority requests cannot be closed without a technician note."_
4. Add a note (`Replaced ballast. Fixture operational.`) and retry. Show the success message and `closed` badge in the list.

### Scene 6 — Backend Role Guard (Optional, for Supervisor)
1. Using Postman or curl: log in as `alice_requester`, copy the token from the response.
2. Send `PATCH /api/requests/1` with `Authorization: Bearer <token>` and a valid body.
3. Show the `403 Forbidden` JSON response: `"Only Technicians can update status progress and technician notes."`

---

## 16. Suggested Viva Questions

### Architecture and Separation
1. Why does the Vite config include a proxy setting for `/api`? What would happen if you removed it and used the full URL `http://localhost:5000/api/requests` in the frontend code instead?
2. The frontend uses `fetch('/api/requests')` with a relative path. How does the browser know where to send the request?
3. What prevents the React application from connecting directly to MySQL?

### Database and Setup
4. What happens if you run `mysql < backend/schema.sql` but skip running `npm run db:setup`? How would you notice something was wrong?
5. Why does `schema.sql` use `DROP TABLE IF EXISTS` before creating the tables? What data would be lost if you ran `npm run db:setup` twice?
6. The `.env.example` file lists `DB_NAME=maintenance_db`, but the actual database is `c7p3`. How would you track down this mismatch without being told about it?

### Authentication and Roles
7. Where is the user's role stored after login — in the token, in the database, or both? Which one does the backend trust when it enforces permissions?
8. If someone base64-decodes the token, changes `Requester` to `Technician`, then re-encodes it and sends it as the `Authorization` header, will the backend accept it? Explain step by step.
9. The `verifyToken` function checks `parts.length !== 2`. What attack or mistake does this guard against?
10. Why is SHA-256 HMAC considered inadequate for password storage, and what should replace it?

### Route Logic and Protected Actions
11. Walk through every check the backend performs, in order, when a Requester sends `PATCH /api/requests/1` with a valid token.
12. The `updateRequestDetails` SQL query contains `WHERE id = ? AND status = 'submitted'`. Why is this clause important even though the route already checks the status before calling the service?
13. The high-priority closure note rule is checked in two places. Name both and explain why this double enforcement matters.

### Testing
14. Run `npm test`. What are the 9 tests and what does each one assert?
15. Test 6 checks that `charlie_requester` is not the owner of Alice's request. Is this testing via an HTTP call or directly at the data layer? What is the practical difference?
16. How is the test data cleaned up after the test suite finishes? What would happen to the database if the test crashed before the cleanup ran?
17. Which scenarios from `REQUIREMENTS.md` §6 are explicitly listed but NOT covered by the automated test file?

### Validation and Known Gaps
18. Submit a request with a title that is 150 characters long. What HTTP status code do you expect to receive, and what should you receive according to REQUIREMENTS.md?
19. A Technician can currently set a closed request's status back to `submitted`. Where exactly in the code would you add a fix to block this, and what HTTP status should the fix return?
20. The `closed_at` column is populated in the database when a request is closed. How would you verify this is working correctly if you cannot see it in the UI?
