# Final Review — Inventory Request System

**Project:** Inventory Request System (Case 5, Prototype 3)
**Review Stage:** Final — after testing, security hardening, maintainability cleanup, and change request implementation
**Review Date:** 2026-07-11
**Reviewed By:** Antigravity (AI Code Review Agent)
**Scope:** Read-only. No source code, schema, seed data, or configuration was created or modified. All findings are evidence-based and cite specific files and line numbers.

---

## 1. Final Feature Summary

The Inventory Request System is a two-tier web prototype built with **React (Vite)** on the frontend and **Node.js / Express** on the backend, with **MySQL** for persistence. The application is functionally complete at the prototype scope.

### What was built

| Feature | Status | Route / Location |
|---|---|---|
| DB-backed JWT login (bcrypt) | ✅ Complete | `POST /api/auth/login` → `authRoutes.js` |
| Staff: submit new request | ✅ Complete | `POST /api/requests` → `requestRoutes.js:31` |
| Staff: view own requests (scoped) | ✅ Complete | `GET /api/requests` → `requestRoutes.js:8` |
| Staff: edit own pending request | ✅ Complete | `PUT /api/requests/:id` → `requestRoutes.js:58` |
| Storekeeper: view all requests | ✅ Complete | `GET /api/requests` (unscoped) |
| Storekeeper: approve / reject | ✅ Complete | `PUT /api/requests/:id/approve` → `requestRoutes.js:82` |
| Storekeeper: add note on review | ✅ Complete | Body field on approve route |
| Storekeeper: mark as issued | ✅ Complete | `PUT /api/requests/:id/issue` → `requestRoutes.js:112` |
| Filtering (both roles) | ✅ Complete | Query params on GET |
| Self-approval / self-issue blocked | ✅ Complete | Route + service level checks |
| Body-spoofing prevention | ✅ Complete | Server ignores body `requesterId`, `status`, `requesterName` |
| Automated integration test suite | ✅ Complete | `backend/scripts/test.js` (9 test groups) |
| Test data cleanup | ✅ Complete | DELETE on `VERIFY_TEST_%` prefix in finally block |

---

## 2. Review Scoring Matrix

> Scores are **0–5**: 0 = missing · 1 = present but mostly not working · 2 = partially working, major gaps · 3 = mostly working, important gaps · 4 = working, minor gaps · 5 = complete for scope

| Feature / Area | Functionality 0-5 | Data Persistence 0-5 | Backend Security / Role Control 0-5 | Validation / Error Handling 0-5 | Testing Evidence 0-5 | Maintainability 0-5 | UI / Manual Usability 0-5 | Evidence | Notes |
|---|---:|---:|---:|---:|---:|---:|---:|---|---|
| Project setup and run commands | 5 | — | — | — | 4 | 4 | — | Root `package.json` scripts: `install:all`, `db:setup`, `dev`, `test`. README covers all setup steps. | README step 3 shows `DB_NAME=inventory_db`; actual default in `.env.example` and `db_init.js` is `c5p3`. Minor doc mismatch persists. |
| Database setup and starter data | 5 | 5 | — | — | 5 | 4 | — | `db_init.js` drops, re-creates, and seeds on every run. 4 users (2 staff, 2 storekeeper) and 4 requests covering all 4 statuses. Test suite resets DB as first step. | Script is a full wipe — not a migration. Acceptable for prototype scope. |
| Login workflow | 5 | 5 | 5 | 4 | 5 | 4 | 5 | `POST /api/auth/login` — bcrypt compare, JWT signed with `userId` only, 8h expiry. Tests cover valid login (200) and bad-password (401). Demo credentials shown on login screen. | `JWT_SECRET` falls back to a hardcoded literal if not set in `.env`. Not set in current `.env` — fallback is active. |
| Role-based access | 5 | — | 5 | 4 | 5 | 4 | 4 | `authenticate` re-fetches user from DB on every request. `requireRole('staff')` on POST, `requireRole('storekeeper')` on approve/issue. Staff scope enforced by injecting `requesterId`. Tests 3 and 4 cover allowed/blocked actions for both roles. | `PUT /api/requests/:id` has no `requireRole('staff')` middleware; service ownership check compensates. |
| Main create action | 5 | 5 | 5 | 4 | 5 | 5 | 5 | `POST /api/requests` — `requireRole('staff')` enforced. All 4 fields checked. `quantity > 0`. `requesterId` and `requesterName` derived from JWT-verified user. Status hardcoded to `pending`. Test 2 covers success and bad validation. Test 9 covers spoofing. | No max-length server-side check for `itemName` (255) or `reason` (500). |
| Main view/list action | 5 | 5 | 5 | 3 | 4 | 4 | 5 | `GET /api/requests` — `authenticate` required. Staff `requesterId` forced. Test 3 asserts staff sees only own records. Test 4 asserts storekeeper sees all. | `GET /api/users` has no `authenticate` guard — publicly accessible. Test suite does not cover this endpoint. |
| Main update/status/cancel action | 4 | 5 | 4 | 4 | 4 | 4 | 4 | `PUT /api/requests/:id` — ownership verified in service. Status guard: only `pending` editable. Returns full updated record. | No `requireRole('staff')` on route. No cancel/withdraw action for staff. |
| Protected action | 5 | 5 | 5 | 5 | 5 | 4 | 5 | `PUT /:id/approve` and `PUT /:id/issue` both require `authenticate` + `requireRole('storekeeper')`. Self-approval/self-issue blocked at route level. Status transitions validated in service. Tests 5, 6, 7 cover all scenarios. | Storekeeper note is optional (nullable). No API-layer max-length check despite spec requiring 500 chars. |
| Secondary feature | 5 | 5 | 5 | 4 | 4 | 4 | 5 | LIKE filtering on `item_name`, `requester_name`, `status`. Staff scope maintained via `requesterId` injection regardless of filter params. Test 8 verifies filter query. | No input debounce — every keystroke fires an API call. |
| Case-specific: item, quantity, reason, and requester fields | 5 | 5 | 5 | 4 | 5 | 5 | 5 | All four fields in DB schema as NOT NULL. Backend validation requires all. `requester_name` auto-set from DB-verified user. `quantity > 0` enforced. Test 2 covers valid submission and bad inputs. Test 9 confirms requester name cannot be spoofed. | No server-side max-length check. `requestedDate` format not validated beyond presence. |
| Case-specific: approve/reject/issued status lifecycle | 5 | 5 | 5 | 5 | 5 | 5 | 5 | ENUM `pending→approved/rejected→issued` in DB. Illegal transitions rejected by service. `issued_quantity` and `issued_at` populated on issue. Tests 5 and 6 automate all transitions including invalid ones. All four states rendered with colour-coded badges. | No `cancelled` state — outside stated scope. |
| Case-specific: storekeeper note protection and staff ownership | 5 | 5 | 5 | 4 | 5 | 5 | 5 | Note only writable via `PUT /:id/approve` (storekeeper-only). No standalone note-edit endpoint. Staff cannot write notes. Staff ownership on edit enforced in service. UI renders note in read-only `note-box` for all roles. | Note max-length not enforced at API layer. |
| UI / manual usability | 4 | — | — | — | 3 | 4 | 4 | Dark glassmorphic theme, animated modals, colour-coded status badges, role-aware controls, success toast. Demo credentials shown on login screen. | `alert()` used for some client-side errors. CSS typo `justifycontent` (line 439). `Outfit`/`Inter` fonts declared but no `<link>` in `index.html`. |
| Security posture | 4 | — | 4 | — | 4 | 4 | — | JWT verified server-side. Role re-fetched from DB. Self-action blocked. Body spoofing prevented. Secrets in `backend/.env`. Test 9 verifies spoofing prevention. | `JWT_SECRET` hardcoded fallback active. `GET /api/users` unauthenticated. No `.gitignore`. No `helmet`, no rate limiting. |
| Testing evidence | 4 | 4 | 4 | 4 | 4 | 4 | — | `backend/scripts/test.js` — 314-line integration runner. 9 test groups, 20+ assertions. Covers login, submission, validation, roles, approval, issuance, self-approval, filter, spoofing. `VERIFY_TEST_` prefix + `finally` cleanup. Command: `npm test`. | No frontend tests. Custom `assert()` only — no framework. `TEST_PLAN.md` actual-output column has placeholder text. |
| Maintainability | 4 | — | — | — | — | 4 | — | Clear folder structure. JSDoc comments on service functions and middleware. Service layer decoupled from routes. Validator extracted to `utils/`. Test cleanup in `finally`. | All React logic in one 708-line `App.jsx`. No TypeScript. No ESLint config. No error boundaries. |

---

## 3. Project Structure and Run Commands

```
p3/
├── package.json                   ← root orchestrator (concurrently, install:all, test)
├── README.md
├── REQUIREMENTS.md
├── PROJECT_CONTEXT.md
├── Case_Brief.md
├── MID_REVIEW.md
├── FINAL_REVIEW.md
├── docs/
│   └── TEST_PLAN.md
├── backend/
│   ├── .env                       ← live secrets (DB credentials)
│   ├── .env.example               ← safe template
│   ├── package.json               ← start, dev (nodemon), db:setup, test
│   ├── server.js                  ← Express entry, mounts routes
│   ├── config/
│   │   └── db.js                  ← mysql2 connection pool (promise mode)
│   ├── middleware/
│   │   └── authMiddleware.js      ← authenticate(), requireRole()
│   ├── routes/
│   │   ├── authRoutes.js          ← POST /api/auth/login
│   │   ├── requestRoutes.js       ← CRUD + approve + issue
│   │   └── userRoutes.js          ← GET /api/users (unguarded)
│   ├── services/
│   │   ├── requestService.js      ← all DB logic for requests
│   │   └── userService.js         ← DB lookups for users
│   ├── utils/
│   │   └── validator.js           ← validateRequestInput()
│   └── scripts/
│       ├── db_init.js             ← DROP + CREATE + SEED
│       └── test.js                ← integration test runner
└── frontend/
    ├── index.html
    ├── package.json               ← vite, react, react-dom
    ├── vite.config.js             ← proxy /api → localhost:5000
    └── src/
        ├── main.jsx
        ├── App.jsx                ← all React logic (708 lines)
        └── index.css              ← glassmorphic design system
```

### Run Commands

| Command | What it does |
|---|---|
| `npm run install:all` | Installs backend and frontend `node_modules` |
| `npm run db:setup` | Runs `db_init.js` — drops, creates, and seeds the database |
| `npm run dev` | Starts backend (port 5000) and frontend (port 5173) concurrently |
| `npm test` | Runs `backend/scripts/test.js` — integration test suite |
| `npm run start:backend` | Backend only |
| `npm run start:frontend` | Frontend only |

---

## 4. Frontend / Backend Separation Check

**Correctly separated.** React (port 5173) and Express (port 5000) are in distinct directories with separate `package.json` files, separate `node_modules`, and separate development servers.

- Vite's `server.proxy` in `vite.config.js` forwards all `/api/*` requests to `http://localhost:5000`. The browser never makes cross-origin requests directly to MySQL.
- The frontend has **zero MySQL dependencies** — `mysql2`, `bcryptjs`, `dotenv`, and `jsonwebtoken` are backend-only.
- The frontend stores the JWT in `localStorage` and sends it as a `Bearer` token in the `Authorization` header.
- **The React app never connects to MySQL directly.** All database access is through the Express REST API.

---

## 5. Database Setup and Table Summary

### Connection Method

`backend/config/db.js` creates a `mysql2` **connection pool** (promise mode). All five required environment variables are consumed:

| Variable | Configured? | Source |
|---|---|---|
| `DB_HOST` | ✅ Yes | `.env` (falls back to `127.0.0.1`) |
| `DB_PORT` | ✅ Yes | `.env` (falls back to `3306`) |
| `DB_USER` | ✅ Yes | `.env` (falls back to `root`) |
| `DB_PASSWORD` | ✅ Yes | `.env` — **password not printed here** |
| `DB_NAME` | ✅ Yes | `.env` (falls back to `inventory_db`; `.env.example` and `db_init.js` default to `c5p3`) |

All queries use parameterised placeholders (`?`), preventing SQL injection.

### Tables Used

| Table | Purpose | Notable Columns |
|---|---|---|
| `users` | Login and identity store | `id`, `username`, `password_hash`, `role` ENUM('staff','storekeeper'), `full_name`, `created_at` |
| `inventory_requests` | Primary domain entity | `id`, `item_name`, `quantity`, `reason`, `requested_date`, `requester_id` (FK→users), `requester_name`, `status` ENUM('pending','approved','rejected','issued'), `storekeeper_note`, `issued_quantity`, `issued_at`, `created_at`, `updated_at` |

A **users/login table exists** (`users`). Passwords are stored as bcrypt hashes (cost factor 10). Role is a DB ENUM — it cannot be injected via application input.

### Re-creating Tables and Seed Data

Run `npm run db:setup`. `db_init.js`:
1. Connects to MySQL without a specific database.
2. `CREATE DATABASE IF NOT EXISTS c5p3`.
3. `DROP TABLE IF EXISTS inventory_requests` then `DROP TABLE IF EXISTS users` (FK-aware order).
4. Re-creates both tables.
5. Seeds 4 users: `john_staff`, `jane_staff`, `bob_storekeeper`, `alice_storekeeper` (password: `password123`).
6. Seeds 4 requests — one per status.

This is a **full wipe-and-reseed**, not a migration. The test suite also calls this as its first step.

---

## 6. Login and Role/Access Explanation

### How the Two Roles Log In

Both roles use the same login form (`POST /api/auth/login`) with `username` + `password`. The server:
1. Queries `SELECT * FROM users WHERE username = ?`.
2. Runs `bcrypt.compare(password, user.password_hash)`.
3. On match, signs a JWT containing only `{ userId }` with an 8-hour expiry.
4. Returns the token and a safe user object (no password hash).

**Staff demo accounts:** `john_staff`, `jane_staff` (password: `password123`)
**Storekeeper demo accounts:** `bob_storekeeper`, `alice_storekeeper` (password: `password123`)

### How Roles Are Checked

On every protected request, `authMiddleware.authenticate`:
1. Extracts the `Authorization: Bearer <token>` header.
2. Verifies the JWT signature and expiry with `jwt.verify`.
3. **Re-fetches the user row from the database** using `decoded.userId` — role always comes from DB, never from the token payload.
4. Attaches the database-sourced user object to `req.user`.

`requireRole(role)` then checks `req.user.role === role` and returns `403 Forbidden` if not matching.

### Record-Level Access

- **Staff:** GET handler forces `requesterId = user.id` — staff can only see their own records regardless of query params.
- **Storekeeper:** No `requesterId` restriction — sees all records.
- **Edit ownership:** `requestService.updateRequestDetails` checks `request.requester_id !== requesterId` and throws before touching the DB.

---

## 7. Protected Action Explanation

The case-specific protected action is the storekeeper's ability to write `storekeeper_note` and change status to `approved`, `rejected`, or `issued`.

| Check | Enforcement Point | Code Location |
|---|---|---|
| Approve/reject requires storekeeper | `requireRole('storekeeper')` | `requestRoutes.js:82` |
| Issue requires storekeeper | `requireRole('storekeeper')` | `requestRoutes.js:112` |
| Self-approval blocked | `existing.requester_id === user.id` → 403 | `requestRoutes.js:96-98` |
| Self-issue blocked | same pattern | `requestRoutes.js:126-128` |
| Approve only from pending | `request.status !== 'pending'` → error | `requestService.js:88-90` |
| Issue only from approved | `request.status !== 'approved'` → error | `requestService.js:110-112` |
| Note written only via approve route | No standalone note endpoint exists | Architecture |
| Staff cannot write note | `requireRole('storekeeper')` blocks route entirely | `requestRoutes.js:82` |

The self-approval check compares `requester_id` from the DB row against the ID from the JWT-verified user lookup. Neither value comes from the request body — spoofing is structurally impossible.

---

## 8. Validation Summary

### Frontend (UI-layer)
- All four create/edit fields are marked `required` via HTML.
- `quantity` uses `type="number" min="1"`.
- `issuedQuantity` is capped at `max={activeActionRequest.quantity}`.
- Empty fields trigger `alert()` before fetch is called.

### Backend (API-layer, always enforced)

| Rule | Enforced In | Response |
|---|---|---|
| All four request fields required | `validator.js:5` | 400 — "All fields are required." |
| Quantity must be positive integer | `validator.js:9-12` | 400 — "Quantity must be a positive integer." |
| Approve status must be "approved" or "rejected" | `requestRoutes.js:86-88` | 400 — "Invalid status transition." |
| Issue quantity must be positive | `requestRoutes.js:116-118` | 400 — "Issued quantity must be positive." |
| Issued quantity ≤ requested quantity | `requestService.js:113-115` | 400 |
| Edit only allowed on pending | `requestService.js:66-68` | 400 |
| Approve only on pending | `requestService.js:88-90` | 400 |
| Issue only on approved | `requestService.js:110-112` | 400 |

### Gaps
- No server-side max-length check for `itemName`, `reason`, or `storekeeperNote`.
- `requestedDate` format not validated (any non-empty string accepted at API layer).

---

## 9. Automated and Manual Testing Summary

### Automated Test Command

```bash
npm test
# internally: npm test --prefix backend → node scripts/test.js
```

### What the Test Suite Does

`backend/scripts/test.js` (314 lines) on each run:

1. **Resets the database** — forks `db_init.js` to wipe and re-seed.
2. **Connects to MySQL directly** — fetches John, Jane, and Bob's rows for assertions.
3. **Forks the backend server** — waits 1.5 s for it to bind.
4. Runs **9 named test groups**:

| Test Group | What it checks |
|---|---|
| Test 0 | Database connection successful |
| Test 1 | Valid login → 200 + JWT; invalid password → 401 |
| Test 2 | Submit request: 201 + correct fields; bad inputs → 400 |
| Test 3 | Staff can view own records; cannot approve (403); cannot see other staff records |
| Test 4 | Storekeeper cannot submit (403); sees requests from multiple staff |
| Test 5 | Approve: 200 + status transition; invalid status value → 400 |
| Test 6 | Issue: exceed-quantity → 400; valid issue → 200 + `issued` + `issued_quantity` + `issued_at` |
| Test 7 | Self-approval: direct DB insert of Bob's own request → Bob approves → 403 |
| Test 8 | Filter query: `itemName + status` → only matching results |
| Test 9 | Body spoofing: `requesterId`, `requesterName`, `status` in body all ignored |

5. **Cleans up** — `DELETE FROM inventory_requests WHERE item_name LIKE "VERIFY_TEST_%"` in a `finally` block.
6. Kills the forked server. Exits `0` (pass) or `1` (fail).

### What Is Not Automated

- **Frontend component tests** — no vitest/jest-dom. React UI is not tested programmatically.
- **`GET /api/users` endpoint** — not covered.
- **Max-length validation** — no oversized input tests.
- **No test framework** — custom `assert()` only; no reporter, no coverage.
- **Manual test results** — `docs/TEST_PLAN.md` "Actual Output" column contains placeholder text; real run results were not recorded.

---

## 10. Stage 11 Change Summary

Stage 11 covers testing, security hardening, and maintainability cleanup.

### Added (not present at mid-review)
- **Full integration test suite** (`backend/scripts/test.js`) — mid-review recorded `Testing evidence: 0/5`.
- **Test data isolation and cleanup** — `VERIFY_TEST_` prefix + `finally` block DELETE.
- **`docs/TEST_PLAN.md`** — formal test case inventory TC-01 through TC-16.
- **Spoofing prevention test (Test 9)** — explicitly verifies body fields are ignored.

### Present but not improved since mid-review
- `JWT_SECRET` hardcoded fallback — still active (not set in `.env`).
- `GET /api/users` — still unauthenticated.
- No `.gitignore` — still absent.
- No `helmet` or rate limiting.
- `App.jsx` still monolithic (708 lines).
- Inline `alert()` calls still present.

Testing infrastructure was the clear Stage 11 deliverable. Several security hardening items were identified but not resolved in code.

---

## 11. Stage Drift or Early Work

| Item | Observation |
|---|---|
| DB-backed bcrypt login | More advanced than "simple role-selector" in `PROJECT_CONTEXT.md §7` — built early, positive outcome |
| Self-approval guard | Implemented at route level during core feature stage, not only in security hardening |
| Body-spoofing prevention | Server always ignored `requesterId`/`requesterName`/`status` from body from the beginning — not a Stage 11 addition |
| `issued_quantity` and `issued_at` columns | In schema from initial design — built early |
| Integration test suite | Only appeared after Stage 11; confirmed absent at mid-review |
| `docs/TEST_PLAN.md` | Appeared after secondary feature stage |

No feature contradicts a later stage's intent. Earlier-than-expected security features strengthened the prototype.

---

## 12. Security Risks and Exposed-Secret Check

> **No secrets are printed in this review.**

| Risk | Severity | Status |
|---|---|---|
| `JWT_SECRET` hardcoded fallback in `authMiddleware.js:4` — literal string is active because `JWT_SECRET` is not defined in `backend/.env` | **High** | ⚠️ Active |
| No `.gitignore` at project root — `backend/.env` and `node_modules/` could be committed | **High** | ⚠️ Active |
| `GET /api/users` returns IDs, usernames, roles, full names with no authentication | **Medium** | ⚠️ Active |
| No `helmet` middleware — HTTP security headers not set | **Low** | ⚠️ Active |
| No rate limiting on `/api/auth/login` — brute-force login not throttled | **Low** | ⚠️ Active |
| CORS set to `*` (`app.use(cors())` with no origin restriction) | **Low** | ⚠️ Prototype acceptable |
| `localStorage` JWT — susceptible to XSS; acceptable at prototype scope | **Low** | Documented risk |
| DB credentials confirmed in `backend/.env` only; not in frontend files | ✅ Correct | — |
| No input sanitisation library — React's JSX escaping prevents reflected XSS in UI | **Low** | Partially mitigated |

---

## 13. Documentation / Code Mismatches

| Location | Document Says | Code / Reality |
|---|---|---|
| `README.md` step 3 | `DB_NAME=inventory_db` | `.env.example` and `db_init.js` default to `c5p3` |
| `PROJECT_CONTEXT.md §2` | "simple session simulation (e.g., dropdown menu)" | Full JWT + bcrypt login was implemented |
| `docs/TEST_PLAN.md` — Actual Output column | `[As expected in TC-XX]` (placeholder) | No real test run results recorded |
| `docs/TEST_PLAN.md` §5 — Manual Checks | References "Charlie (Storekeeper)" | No such user exists; seed has `bob_storekeeper` and `alice_storekeeper` |
| `REQUIREMENTS.md §3 F-01` | `requesterName` listed as a form input field | Implementation correctly auto-derives it from session — not a user input |
| `REQUIREMENTS.md §5 Scenario A` | Error: `"Access Denied: Storekeeper role required."` | Actual: `"Forbidden: Requires storekeeper role."` |
| `REQUIREMENTS.md §5 Scenario B` | Error: `"Access Denied: You cannot approve or issue your own request."` | Actual: `"Forbidden: You cannot approve or reject your own request."` |

---

## 14. Known Limitations

1. **No `.gitignore`** — `backend/.env` at risk if repo is pushed to a remote.
2. **`JWT_SECRET` fallback active** — a predictable literal secret is in use.
3. **`GET /api/users` unauthenticated** — user listing exposed without a token.
4. **No server-side max-length validation** — `itemName`, `reason`, and `storekeeperNote` can exceed spec limits.
5. **`requestedDate` format not validated** — any non-empty string accepted at API layer.
6. **No debounce on filter inputs** — every keystroke fires an API request.
7. **Monolithic `App.jsx`** — 708 lines, no component decomposition, no error boundaries.
8. **`alert()` for client-side errors** — blocks the UI thread; not inline feedback.
9. **Test plan "Actual Output" placeholders** — manual test evidence not recorded.
10. **Frontend fonts not imported** — `Outfit`/`Inter` declared but no `<link>` in `index.html`; system-ui fallback active.
11. **No cancel/withdraw action for staff** — staff cannot cancel a pending request.
12. **`PUT /api/requests/:id` missing `requireRole('staff')`** — storekeeper gets ownership error instead of clean 403.

---

## 15. Demo Script

Use this script to demonstrate the system end-to-end in approximately 5 minutes.

### Step 0 — Start the system
```bash
npm run db:setup   # wipe and re-seed database
npm run dev        # start backend (5000) and frontend (5173)
```
Open `http://localhost:5173`.

### Step 1 — Staff login and request submission
1. Log in as **`john_staff`** / `password123`.
2. Header shows "John Doe (Staff) — STAFF".
3. Fill the **New Inventory Request** form:
   - Item Name: `USB-C Hub`
   - Quantity: `3`
   - Reason: `Remote work kit upgrade`
   - Required Date: (any future date)
4. Click **Submit Request**. Green toast appears. New card shows status **PENDING**.

### Step 2 — Staff cannot approve
5. Using Postman or curl, send `PUT /api/requests/<id>/approve` with John's token.
6. Response: `403 Forbidden: Requires storekeeper role.`

### Step 3 — Storekeeper review
7. Sign Out. Log in as **`bob_storekeeper`** / `password123`.
8. All Inventory Requests shows requests from both John and Jane.
9. Find John's USB-C Hub. Click **Approve / Reject**.
10. Enter note: `Approved — budget confirmed.`
11. Click **Approve**. Status changes to **APPROVED**.

### Step 4 — Self-approval blocked
12. Insert a request with Bob as `requester_id` directly into MySQL (as done in Test 7). Attempt to approve it as Bob — UI shows "Self-approval disabled"; backend returns 403.

### Step 5 — Issue items
13. Click **Mark as Issued** on the approved USB-C Hub.
14. Set issued quantity to `3`. Click **Confirm Delivery**.
15. Status changes to **ISSUED**. Issued Qty and Issued At are displayed.

### Step 6 — Staff view (read-only note)
16. Sign Out. Log in as `john_staff`.
17. USB-C Hub shows status **ISSUED**, note "Approved — budget confirmed." in read-only box. No Edit button.

### Step 7 — Automated tests
18. In terminal: `npm test`. All test groups print `✓ PASS` and the run ends with `All integration tests completed successfully!`

---

## 16. Suggested Viva Questions

### Architecture
1. Why does the backend re-fetch the user from the database on every request instead of trusting the role stored in the JWT payload?
2. What is the purpose of the Vite proxy in `vite.config.js`? What security problem would arise if the frontend made direct MySQL calls?
3. Why is React in one directory and Express in another? What would break if they shared the same `package.json`?

### Database and Authentication
4. What does `pool.promise()` return, and why is a pool used instead of a direct connection?
5. Why is the column named `password_hash` rather than `password`? What does `bcrypt.compare` do with it?
6. The `role` column is a MySQL ENUM. What happens if you try to insert `role = 'admin'` directly?

### Role-Based Access
7. A staff member calls `GET /api/requests?requesterId=999`. What does the server return and why?
8. Explain step by step what happens when `requireRole('storekeeper')` is used as middleware.
9. Where is the self-approval check implemented, and why is it at the route level rather than only in the service?

### Status Lifecycle
10. What are the four valid states? Draw the allowed transition graph. What happens if a storekeeper calls the issue endpoint on a `pending` request?
11. Why does the issue endpoint accept an `issuedQuantity` field, and what validation prevents it from exceeding the original `quantity`?
12. Can a staff member edit a request after it has been approved? Which file and line enforces this?

### Security
13. The `JWT_SECRET` in `authMiddleware.js` has a hardcoded fallback. What is the practical risk, and how would you fix it?
14. `GET /api/users` has no `authenticate` guard. What information is exposed and why is that a risk?
15. There is no `.gitignore`. What specific files could be committed and why are they sensitive?

### Testing
16. Explain how `test.js` isolates test data. What naming convention is used, and how is cleanup guaranteed even if an assertion fails?
17. Test 7 inserts a row directly into MySQL instead of using `POST /api/requests`. Why?
18. What does exit code `0` vs `1` mean, and how would a CI pipeline use this?

### Validation
19. Name two validation rules enforced in both the frontend and backend, and two enforced only in the backend.
20. A client sends `POST /api/requests` with body `{ "status": "approved", "requesterId": 99 }`. Walk through exactly what the server does with those two fields.

---

*End of Final Review — Inventory Request System*
