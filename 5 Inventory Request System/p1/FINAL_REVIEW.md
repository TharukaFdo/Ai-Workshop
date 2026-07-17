# Final Evidence-Based Review — Inventory Request System

**Case:** Inventory Request System (Case 5, Project 1)
**Review Stage:** Final — after testing, security hardening, maintainability cleanup, and the issued-quantity change request
**Review Date:** 2026-07-10
**Reviewer:** Antigravity (AI code review)
**Files Inspected:** `Case_Brief.md`, `schema.sql`, `MID_REVIEW.md`, `backend/server.js` (221 lines), `backend/db.js` (16 lines), `backend/initDb.js` (82 lines), `backend/package.json`, `backend/test.js` (270 lines), `backend/.env.example`, `frontend/index.html`, `frontend/vite.config.js`, `frontend/package.json`, `frontend/src/main.jsx`, `frontend/src/App.jsx` (512 lines), `frontend/src/App.css` (584 lines)

---

## 1. Final Feature Summary

The Inventory Request System is a React + Express + MySQL web prototype that covers the complete staff-to-storekeeper inventory workflow described in the Case Brief. All primary features are present and working end-to-end through the full stack. The backend enforces every role rule independently of the frontend. An automated integration test suite of 17 named assertions is included and covers the critical lifecycle. The issued-quantity feature (change request / Stage 11) is fully implemented.

### What was built

| Feature | Implemented | Evidence |
|---|---|---|
| Staff submits request (item, qty, reason, date) | YES | POST /api/requests to DB INSERT |
| Requester name resolved server-side | YES | req.user.display_name in server.js:119 |
| Storekeeper views all requests | YES | GET /api/requests to table render |
| Staff views own requests (UI label only) | PARTIAL | All rows returned from DB; staff sees all records |
| Approve / reject / issue lifecycle | YES | PUT /api/requests/:id/status + DB ENUM |
| Storekeeper note on status update | YES | storekeeper_note column; note-only endpoint absent |
| Issued quantity recording | YES | issued_quantity column; validated <= requested qty |
| Self-approval and self-issue blocked | YES | Backend display_name comparison |
| Self-reject not blocked | GAP | Only approved/issued comparisons in server.js:181 |
| Filter by item, requester, status | YES | Client-side React state filter |
| Login backed by MySQL users table | YES | POST /api/login queries users table |
| Role read from DB on every request | YES | authenticateUser middleware re-queries DB |
| Repeatable DB init + seed | YES | npm run init-db (node initDb.js) |
| Automated integration tests | YES | npm test (node test.js) — 17 assertions |
| Test data cleanup after run | YES | DELETE at test.js:256 |

---

## 2. Review Scoring Matrix

> Score: 0 = missing · 1 = present but mostly broken · 2 = partial with major gaps · 3 = mostly working with important gaps · 4 = working with minor gaps · 5 = complete for the selected scope

| Feature / Area | Functionality 0-5 | Data Persistence 0-5 | Backend Security / Role Control 0-5 | Validation / Error Handling 0-5 | Testing Evidence 0-5 | Maintainability 0-5 | UI / Manual Usability 0-5 | Evidence | Notes |
|---|---:|---:|---:|---:|---:|---:|---:|---|---|
| Project setup and run commands | 5 | 5 | 5 | 4 | 4 | 4 | 4 | backend/package.json: start, dev, init-db, test; frontend: dev, build, lint; Vite proxy to :5000 | No root README combining both run commands; page title still "frontend" |
| Database setup and starter data | 5 | 5 | 5 | 4 | 4 | 3 | 4 | initDb.js drops/re-creates requests + users, seeds 4 users + 4 demo rows; .env.example present | schema.sql at root lacks users table and issued_quantity — never called by any script; passwords plaintext |
| Login workflow | 4 | 5 | 3 | 4 | 4 | 3 | 4 | POST /api/login matches username+password in users; returns {id, username, display_name, role}; stored in localStorage; tested in test.js:19-37 | Plaintext password comparison; username used as bearer token (no JWT); no HTTPS |
| Role-based access | 5 | 5 | 4 | 4 | 5 | 4 | 4 | authenticateUser re-queries DB on every request; staff-only create; storekeeper-only status update; tested with role mismatch returning 403 | GET /api/requests returns all rows to both roles — no server-side row filter for staff |
| Main create action | 5 | 5 | 5 | 5 | 4 | 4 | 5 | POST /api/requests: role check, field presence, qty positive integer, item_name <=100 chars, reason <=500 chars, date parse valid; requester_name from DB; parameterized INSERT | No unique constraint prevents duplicate item submissions |
| Main view/list action | 4 | 5 | 3 | 3 | 3 | 3 | 4 | GET /api/requests authenticated; returns all rows ordered created_at DESC; responsive table with loading/error/empty states | No pagination; all rows returned to both roles; staff should ideally only see their own rows |
| Main update/status/cancel action | 5 | 5 | 5 | 5 | 5 | 4 | 4 | PUT /api/requests/:id/status: storekeeper-only; status whitelisted; full state-machine guard; storekeeper_note <=500 chars; all transitions tested in test.js:133-252 | No cancel/withdraw action for staff; note cannot be updated without changing status |
| Protected action | 5 | 5 | 5 | 5 | 5 | 4 | 4 | Self-approval blocked in server.js:181; tested with John-John own request (test.js:156-169); note only flows through storekeeper-only endpoint | Self-reject not blocked; display_name string comparison fragile if names are edited |
| Secondary feature | 4 | 4 | 2 | 3 | 2 | 3 | 4 | Item, requester, status filters in React state; all three work in UI; requester filter visible to storekeeper only | All records fetched first; filtering is client-side only; not tested in automated suite |
| Case-specific: item, quantity, reason, and requester fields | 5 | 5 | 5 | 5 | 4 | 4 | 5 | All four fields in DB schema, form, API body, and list display; requester_name resolved server-side; quantity parsed+positive checked; item_name <=100+trimmed; reason <=500+trimmed | Quantity has no upper bound limit in backend |
| Case-specific: approve/reject/issued status lifecycle | 5 | 5 | 5 | 5 | 5 | 4 | 5 | Four-value ENUM enforced in DB; full state-machine in server.js:167-177; every invalid transition returns 400; issued_quantity required on issue, validated <= requested qty | — |
| Case-specific: storekeeper note protection and staff ownership | 5 | 5 | 5 | 4 | 4 | 4 | 4 | Note only writable through storekeeper-only endpoint; staff UI renders note read-only; isOwnRequest badge shown; backend blocks self-approve/issue | Self-reject not blocked; note cannot be edited independently of status |
| UI / manual usability | 4 | 4 | 3 | 3 | 2 | 3 | 4 | Dark glassmorphism theme; status badges with colour coding; responsive grid; demo credentials on login; loading/error/empty states handled | Page title is "frontend"; favicon.svg referenced but missing; alert() used for some errors; no success toast |
| Security posture | 3 | 3 | 3 | 4 | 3 | 3 | 3 | authenticateUser re-queries DB; parameterized queries throughout; status whitelisted; input length capped | Plaintext passwords; username sent as bearer (no real token); CORS open *; no rate limiting; no HTTPS |
| Testing evidence | 4 | 4 | 5 | 5 | 5 | 4 | 3 | npm test runs node test.js; 17 labelled assertions; covers DB connection, login, auth, role, validation, full lifecycle, state transitions, self-approval guard, issued-qty; test data cleaned up | No test framework; filter feature not covered; no frontend automated tests |
| Maintainability | 4 | 4 | 4 | 4 | 4 | 4 | 4 | .env.example present; comments on every route; oxlint configured; init-db fully repeatable; test file self-documenting; parameterized queries | All backend logic in one 221-line server.js; no route separation; schema.sql diverged; no root README |


---

## 3. Project Structure and Run Commands

```
5 Inventory Request System/p1/
├── Case_Brief.md               <- original case description
├── MID_REVIEW.md               <- mid-project review document
├── FINAL_REVIEW.md             <- this document
├── schema.sql                  <- early draft schema (not used by any script)
│
├── backend/
│   ├── .env                    <- real credentials (NOT committed to git)
│   ├── .env.example            <- safe template: DB_HOST, DB_PORT, DB_USER, DB_PASSWORD, DB_NAME
│   ├── db.js                   <- mysql2 connection pool (reads .env)
│   ├── initDb.js               <- creates DB + tables + seeds data
│   ├── server.js               <- Express routes + middleware (221 lines)
│   ├── test.js                 <- integration test suite (270 lines)
│   ├── package.json            <- scripts: start, dev, init-db, test
│   └── node_modules/
│
└── frontend/
    ├── index.html              <- Vite entry; title still "frontend"
    ├── vite.config.js          <- Vite + /api proxy to :5000
    ├── package.json            <- scripts: dev, build, lint, preview
    ├── .gitignore
    ├── .oxlintrc.json
    ├── public/                 <- (favicon.svg missing)
    └── src/
        ├── main.jsx            <- React root mount
        ├── App.jsx             <- entire app (512 lines, single component)
        ├── App.css             <- 584-line design system (dark glassmorphism)
        └── index.css           <- minimal resets
```

### Run commands (in order)

```bash
# Terminal 1 — backend
cd backend
npm install
cp .env.example .env        # fill in DB credentials
npm run init-db             # creates/resets DB, tables, seed data
npm run dev                 # nodemon server.js on port 5000

# Terminal 2 — frontend
cd frontend
npm install
npm run dev                 # Vite dev server on port 5173

# Terminal 3 — automated tests (backend must be running)
cd backend
npm test                    # node test.js
```

---

## 4. Frontend / Backend Separation

**Verdict: Fully separated. React never connects to MySQL directly.**

| Check | Finding |
|---|---|
| Separate directories | frontend/ and backend/ are independent with their own package.json and node_modules |
| Separate processes | Backend runs with node server.js on port 5000; frontend runs with vite on port 5173 |
| MySQL dependency in frontend | Not present — frontend/package.json contains only react, react-dom, and dev tools |
| How React reaches Express | Vite dev proxy: vite.config.js:9 routes all /api/* calls from port 5173 to http://localhost:5000 |
| All fetch calls go to /api | Confirmed — App.jsx uses /api/login, /api/requests, /api/requests/:id/status exclusively |
| DB credentials in frontend | None — no .env file in frontend/; no MySQL connection string anywhere in src/ |

---

## 5. Database Setup and Table Summary

### Connection method

backend/db.js creates a mysql2 connection pool. All five variables are configured via dotenv:

| Variable | Default fallback | Configured in .env.example |
|---|---|---|
| DB_HOST | localhost | YES |
| DB_PORT | 3306 | YES |
| DB_USER | root | YES |
| DB_PASSWORD | '' (empty) | YES (value not printed here) |
| DB_NAME | c5p1 | YES |

The pool uses waitForConnections: true, connectionLimit: 10, and exports pool.promise() so all callers use async/await with parameterized queries.

### Tables

| Table | Columns | Purpose |
|---|---|---|
| users | id, username, password, display_name, role ENUM('staff','storekeeper') | Login and role store |
| requests | id, item_name, quantity, reason, requested_date, requester_name, status ENUM(...), storekeeper_note, issued_quantity, created_at, updated_at | Inventory request records |

A users / login table exists. Passwords are stored **plaintext** (known limitation).

### Recreating tables and seed data

Run `npm run init-db` from the backend/ directory. initDb.js:
1. Connects to MySQL without selecting a database.
2. CREATE DATABASE IF NOT EXISTS c5p1.
3. DROP TABLE IF EXISTS requests then CREATE TABLE requests.
4. DROP TABLE IF EXISTS users then CREATE TABLE users.
5. Inserts 4 users (alice/staff, bob/staff, john/storekeeper, sarah/storekeeper) — all with password "password".
6. Inserts 4 demo requests covering all four status values (pending, approved, issued, rejected).

This is fully repeatable and destructive — all existing data is wiped on each run.

---

## 6. Login and Role / Access Explanation

### How the two roles log in

Both roles use the same login form. The user enters username and password. The frontend POSTs to /api/login. The backend (server.js:56-76) queries:

```sql
SELECT id, username, display_name, role FROM users
WHERE username = ? AND password = ?
```

If exactly one row matches, the user object `{ id, username, display_name, role }` is returned as JSON. The frontend stores this in localStorage (key: inventory_user). On every subsequent request the frontend sends username in the Authorization header.

**Demo credentials (from initDb.js seed):**

| Username | Password | Role | Display name |
|---|---|---|---|
| alice | password | staff | Alice Smith |
| bob | password | staff | Bob Jones |
| john | password | storekeeper | John Doe |
| sarah | password | storekeeper | Sarah Jenkins |

### How roles are checked

The authenticateUser middleware (server.js:32-53) is applied to every /api/requests route. It re-queries the users table by the Authorization header value (the username) and attaches the live DB row as req.user. The role cannot be spoofed by the client because it is always read from the database, not from the request body.

Route-level role checks:

| Route | Who is allowed | Guard location |
|---|---|---|
| POST /api/requests | staff only | server.js:92 — req.user.role !== 'staff' returns 403 |
| PUT /api/requests/:id/status | storekeeper only | server.js:150 — req.user.role !== 'storekeeper' returns 403 |
| GET /api/requests | Any authenticated user | No role filter — both roles see all rows |

### Record-level access

Staff members see all requests from all staff in the table. The GET /api/requests route applies no WHERE requester_name = ? filter for the staff role. The UI labels the logged-in user's own rows with a purple "You" badge, but this is cosmetic — no data is hidden. This is a known gap consistent with the Mid Review finding.


---

## 7. Protected Action Explanation

**Case-specific protected actions:** approve, reject, and issue requests; write storekeeper notes.

### Backend guards in server.js

1. **Role guard** (server.js:150-152): Any request to PUT /api/requests/:id/status by a non-storekeeper receives `403 Forbidden — Only storekeepers can approve, reject, or issue requests.`

2. **State-machine guard** (server.js:167-177):
   - If status is already rejected or issued — 400 (terminal, cannot change).
   - If status is pending and new status is issued — 400 (must approve first).
   - If status is approved and new status is approved or rejected — 400 (already approved).

3. **Self-approval guard** (server.js:180-184): Compares request.requester_name.toLowerCase() with req.user.display_name.toLowerCase(). If they match and new status is approved or issued — `403 — You cannot approve or issue your own requests.`
   **Gap:** The check does not include rejected, so a storekeeper can self-reject via direct API call.

4. **Note write protection**: storekeeper_note is only writable via the storekeeper-only PUT /api/requests/:id/status endpoint. There is no dedicated note endpoint exposed to staff. Staff UI renders notes read-only.

5. **Issued-quantity guard** (server.js:186-198):
   - issued_quantity required when status === 'issued' — missing returns 400.
   - Must be a positive integer — invalid returns 400.
   - Cannot exceed request.quantity — excess returns 400.

---

## 8. Validation Summary

### Backend validation (server.js)

| Rule | Field | HTTP response |
|---|---|---|
| Username and password both present | Login | 400 |
| All four request fields present | Create request | 400 |
| Role must be staff | Create request | 403 |
| quantity must be a positive integer | Create request | 400 |
| item_name must be 1-100 characters (trimmed) | Create request | 400 |
| reason must be 1-500 characters (trimmed) | Create request | 400 |
| requested_date must be a parseable date | Create request | 400 |
| status must be in [approved, rejected, issued] | Status update | 400 |
| Role must be storekeeper | Status update | 403 |
| storekeeper_note <= 500 characters | Status update | 400 |
| State-machine transitions (see section 7) | Status update | 400 |
| Self-approve/issue blocked | Status update | 403 |
| issued_quantity required on issue | Status update | 400 |
| issued_quantity must be positive integer | Status update | 400 |
| issued_quantity <= request.quantity | Status update | 400 |
| Request must exist | Status update | 404 |

### Frontend validation (App.jsx)

| Rule | Field | How |
|---|---|---|
| All fields non-empty before POST | Create request | alert() guard at App.jsx:110 |
| quantity >= 1 | Quantity input | min="1" on input type="number" |
| issued_quantity positive and <= requested | Issue action | App.jsx:153-160 alert guard |
| Login fields required | Login form | required attribute |

All frontend validations are duplicated at the backend. The backend is the authoritative guard.

---

## 9. Automated and Manual Testing Summary

### Automated tests — npm test (node test.js)

**Command:** cd backend && npm test
**Framework:** Plain Node.js — assert (stdlib) + fetch (Node 18+ global) + direct db.query calls
**Requires:** Backend running on port 5000 + DB seeded

| # | Test description | File:line |
|---|---|---|
| 1 | DB connection alive (SELECT 1) | test.js:12 |
| 2 | Login with correct credentials — 200, role=staff | test.js:19-27 |
| 3 | Login with wrong password — 401 | test.js:31-36 |
| 4 | GET requests without auth header — 401 | test.js:43-44 |
| 5 | Storekeeper creates request — 403 | test.js:48-61 |
| 6 | Negative quantity in create request — 400 | test.js:68-81 |
| 7 | Item name > 100 chars — 400 (overflow guard) | test.js:85-98 |
| 8 | Staff creates request — 201, requester_name = "Alice Smith" | test.js:105-121 |
| 9 | Created request appears in GET list | test.js:125-130 |
| 10 | Staff attempts to approve — 403 | test.js:134-145 |
| 11 | Storekeeper self-approve — 403 | test.js:150-169 |
| 12 | Storekeeper (Sarah) approves Alice's request — 200, status=approved | test.js:172-186 |
| 13 | Double-approve — 400 (state guard) | test.js:189-198 |
| 14 | Issue without issued_quantity — 400 | test.js:201-210 |
| 15 | Issue with issued_quantity > requested — 400 | test.js:213-222 |
| 16 | Issue with valid issued_quantity — 200, status=issued | test.js:225-240 |
| 17 | Modify issued request — 400 (terminal state guard) | test.js:243-252 |
| Cleanup | DELETE test rows by ID | test.js:256 |

**Expected result:** All 17 assertions pass. Exit code 0. Prints "ALL TESTS AND SECURITY SAFETY CHECKS PASSED!"

### What is NOT automated

| Gap | Detail |
|---|---|
| Filter feature | No test checks item/requester/status filtering |
| Frontend UI | No browser or component tests (no Vitest, Playwright, etc.) |
| Login form UI | No test verifies UI error banner appearance |
| Storekeeper note persistence | Not individually asserted after approval |
| Favicon / page title | Not checked programmatically |

### Manual checks recommended

1. Visit http://localhost:5173 — confirm login screen with glassmorphism card loads.
2. Login as alice / password — confirm staff dashboard (form visible, no action panel).
3. Submit a new request — confirm row appears immediately.
4. Login as john / password — confirm storekeeper dashboard (no submit form; action panel visible).
5. Approve alice's request — confirm status badge changes to "Approved".
6. Mark approved request as issued (qty 1) — confirm "Issued: 1/1" badge.
7. Attempt to approve john's own request — confirm "Self-approval disabled" label in UI.
8. Filter by item name "charger" — confirm only MacBook Pro Charger row shows.
9. Filter by status "rejected" — confirm only rejected row shows.
10. Direct API: PUT /api/requests/1/status with Authorization: alice, body {status:"approved"} — confirm 403.
11. Direct API: GET /api/requests with no Authorization header — confirm 401.


---

## 10. Stage 11 Change Summary

The change request introduced after Stage 11 was the addition of the **issued quantity** feature:

> When a storekeeper marks a request as "issued", they must record how many items were actually issued, and that number cannot exceed the originally requested quantity.

### What changed

| File | Change |
|---|---|
| backend/initDb.js:33 | Added issued_quantity INT DEFAULT NULL column to CREATE TABLE requests |
| backend/initDb.js:67-71 | Seed row for Office Chairs now includes issued_quantity = 5 |
| backend/server.js:142 | issued_quantity destructured from request body in status-update route |
| backend/server.js:186-198 | Full validation block: required, positive integer, <= request.quantity |
| backend/server.js:202-205 | UPDATE query now writes issued_quantity to DB |
| backend/server.js:207-212 | Response body includes issued_quantity field |
| frontend/src/App.jsx:35 | issuedQuantities state map added |
| frontend/src/App.jsx:103-105 | handleIssuedQtyChange handler added |
| frontend/src/App.jsx:147-162 | Issued-quantity validation added before PUT |
| frontend/src/App.jsx:171-174 | issued_quantity included in PUT request body |
| frontend/src/App.jsx:186 | issued_quantity merged into local state after update |
| frontend/src/App.jsx:417-418 | "Issued: X/Y" display badge in status column |
| frontend/src/App.jsx:469-479 | Qty-to-issue input rendered for approved requests |
| backend/test.js:200-240 | Three new test cases: missing qty — 400; excess qty — 400; valid qty — 200 |

---

## 11. Stage Drift and Early Work

### Stage drift (work found ahead of its intended stage)

**None observed.** The project does not contain:
- Password hashing (bcrypt) — not present.
- JWT or signed session tokens — not present.
- Rate limiting (express-rate-limit) — not present.
- Route modularisation (routes/ directory, Router objects) — not present.
- Frontend component decomposition (components/ folder) — not present.

The one pre-pattern observation from the Mid Review remains valid: authenticateUser re-queries the DB on every request. This is a correct security pattern, not early work — it ensures the role cannot be spoofed from a stale local token.

### Work built across consistent stages

| Stage | Deliverable | Present |
|---|---|---|
| Setup | React + Express scaffold | YES |
| DB + login | users table, POST /api/login, initDb.js | YES |
| Create | POST /api/requests, form | YES |
| View | GET /api/requests, table | YES |
| Status lifecycle | PUT /api/requests/:id/status, ENUM | YES |
| Protected action | Self-approval guard, note protection | YES |
| Secondary feature | Client-side filters | YES |
| Testing | test.js with 17 assertions | YES |
| Security hardening | Input length caps, status whitelist, bounds checks | YES (partial — no hashing/tokens) |
| Maintainability | Comments, .env.example, oxlint | YES (partial — no README, schema.sql not updated) |
| Change request | issued_quantity end-to-end | YES |

---

## 12. Security Risks and Exposed-Secret Check

### Risks identified (no secrets printed)

| Risk | Severity | Detail |
|---|---|---|
| Plaintext passwords | CRITICAL | users.password stores passwords as plain text. Any DB dump exposes all credentials. |
| Username used as bearer token | CRITICAL | Authorization header contains only username. Any party knowing a username can impersonate that user after login without a password — the middleware only checks if the username exists, not that a password was verified for this session. |
| .env file with no backend .gitignore | HIGH | backend/.env contains real DB credentials. frontend/.gitignore exists but only covers the frontend directory. A git add . from the project root could commit real credentials. |
| CORS open to all origins | HIGH | app.use(cors()) with no origin option allows any website to make requests to the backend. Should be restricted to http://localhost:5173 or the production frontend origin. |
| DB error messages in 500 responses | MEDIUM | catch (error) { res.status(500).json({ error: error.message }) } — internal database error strings may leak table names or query structure. |
| authenticateUser error leak | MEDIUM | The catch block in the middleware also returns error.message directly in a 500 response. |
| No HTTPS | MEDIUM | No TLS configuration. Credentials and the username token travel in cleartext over the network. |
| No rate limiting | MEDIUM | The login endpoint accepts unlimited attempts — brute-force login is trivially possible. |
| Demo credentials in UI | LOW | The login page HTML explicitly lists all demo usernames and the shared password "password". Must be removed before any real deployment. |

### Exposed-secret check result

- .env.example — **Safe.** Contains placeholder values only (no real password).
- backend/.env — **Contains real credentials.** A backend/.gitignore that excludes .env is absent — risk that git add . from project root commits real credentials.
- frontend/ — **No secrets.** No database credentials, no API keys, no .env file.

---

## 13. Documentation / Code Mismatches

| Document | Claim | Reality in Code | Severity |
|---|---|---|---|
| schema.sql (root) | Defines requests table with CHECK (quantity > 0) | initDb.js omits the CHECK constraint; the operative table has no DB-level quantity check | Medium |
| schema.sql (root) | No issued_quantity column | initDb.js and server.js both include issued_quantity — schema.sql is at least one stage behind | High |
| schema.sql (root) | No users table | initDb.js creates users — schema.sql is incomplete | High |
| schema.sql (root) | Uses database name inventory_db | initDb.js and .env.example use c5p1 | Medium |
| schema.sql (root) | Seed data for Office Chairs has no issued_quantity | initDb.js seeds issued_quantity = 5 for the same row | Medium |
| frontend/index.html:7 | title is "frontend" | Case Brief expects "Inventory Request System" | Low |
| frontend/index.html:5 | References /favicon.svg | File does not exist in frontend/public/ — 404 in browser | Low |
| MID_REVIEW issues list | "No backend status transition guard" | server.js:167-177 now fully guards all transitions | Resolved |
| MID_REVIEW issues list | "No server-side quantity > 0 guard" | server.js:101-103 now checks parsedQty <= 0 | Resolved |
| MID_REVIEW issues list | "No input length validation at route level" | server.js:106-112 now checks item_name <=100 and reason <=500 | Resolved |
| MID_REVIEW issues list | "Status enum not whitelisted in route" | server.js:144-146 now whitelists [approved, rejected, issued] | Resolved |
| MID_REVIEW issues list | "No storekeeper_note length limit" | server.js:154-156 now caps at 500 characters | Resolved |
| MID_REVIEW issues list | "No test files present" | backend/test.js with 17 assertions now exists | Resolved |


---

## 14. Known Limitations

1. **Plaintext passwords** — users.password is stored without hashing. Anyone with read access to the MySQL database has all user passwords.
2. **Username-as-token** — The Authorization header carries only username, not a signed token. A session token (JWT or server-side session) is required before any real deployment.
3. **Staff sees all records** — GET /api/requests returns all rows regardless of role. Staff should ideally only see their own requests; no server-side row-level filter is applied.
4. **Self-reject not blocked** — A storekeeper can reject their own request via a direct API call. server.js:181 only checks for approved and issued.
5. **Client-side filtering only** — Item name, requester, and status filters work in React state after all rows are fetched. No backend query parameters are supported.
6. **Note cannot be updated independently** — There is no endpoint to update storekeeper_note without also changing status. Notes on rejected or issued requests are frozen.
7. **CORS open to all origins** — No cors({ origin: '...' }) restriction. Any website can call the API.
8. **No bcrypt or express-rate-limit** — Login is vulnerable to brute-force.
9. **No root-level backend/.gitignore** — Real credentials in backend/.env could be accidentally committed to git.
10. **schema.sql is stale** — Does not match initDb.js (missing users table, missing issued_quantity column, different DB name). Should either be updated or deleted to prevent confusion.
11. **Page title not updated** — frontend/index.html still reads "frontend" as the title.
12. **Favicon missing** — frontend/public/favicon.svg referenced but not present.
13. **No pagination** — All requests are returned in a single query. Will degrade for large datasets.
14. **No quantity upper bound** — item_name and reason have maximum length guards, but quantity has no maximum cap.
15. **No frontend automated tests** — No Vitest, Playwright, or Cypress. UI behaviour is only verified manually.

---

## 15. Demo Script

> Audience: a supervisor or assessor watching a 5-7 minute live demo.
> Pre-requisites: run npm run init-db in backend, then start both servers.

**Step 1 — Show the login screen**
"The app starts at the login page. Both staff and storekeepers use the same form; roles are looked up from the MySQL users table on every request."

**Step 2 — Log in as Alice (staff)**
Log in with alice / password.
"Alice sees the 'Request New Inventory Item' form on the left and her requests on the right. There are no approve/reject buttons — the role check on the backend prevents it."

**Step 3 — Staff submits a new request**
Fill in: Item = USB-C Hub, Quantity = 2, Reason = For new laptop setup, Date = today. Click Submit.
"The row appears immediately with status PENDING. The requester name is resolved by the server from Alice's display name — the client cannot fake it."

**Step 4 — Log out and log in as John (storekeeper)**
Log in with john / password.
"John's view has no submit form. He sees all requests with an Action Panel column."

**Step 5 — Storekeeper approves the request**
Find Alice's USB-C Hub row. Type a note: In stock, approved. Click Approve.
"Status changes to APPROVED. The note is persisted in MySQL."

**Step 6 — Show the issued-quantity input**
"When John clicks Mark as Issued, the system requires him to enter how many were actually issued, and it cannot exceed the requested quantity."
Enter 2. Click Mark as Issued. Show "Issued: 2/2" badge.

**Step 7 — Demonstrate self-approval block**
Scroll to a row where the requester is John Doe (demo seed or create via initDb.js).
"On own requests, the action panel shows 'Self-approval disabled' and any API attempt returns 403."

**Step 8 — Show filters**
Type "charger" in Filter by Item — only the MacBook Pro Charger row remains.
Select Rejected in the status dropdown — only the Wireless Mouse row.
Type "Alice" in Filter by Staff — only Alice's rows.

**Step 9 — Run the automated tests**
Switch to the backend terminal. Run npm test.
Walk through the output — 17 assertions, exits 0.
"Tests cover login, auth, role enforcement, input bounds, the full lifecycle, self-approval guard, issued-quantity edge cases, and test-data cleanup."

---

## 16. Suggested Viva Questions

### Architecture and separation

1. Why does the React frontend use a Vite proxy instead of calling http://localhost:5000 directly?
2. What would change if you deployed the frontend to Netlify and the backend to Render?
3. Why does db.js use pool.promise() instead of a single mysql.createConnection()?

### Database and persistence

4. If you run npm run init-db while the app is open in a browser, what happens to the existing session?
5. Why does schema.sql exist alongside initDb.js? Which one does the app actually use?
6. The requests table has created_at and updated_at timestamps. Where are these used in the application?

### Login and authentication

7. What does the authenticateUser middleware do on every request, and why is that important?
8. Could a user change their role to storekeeper by editing localStorage? How does the backend prevent this?
9. What is the security risk of sending username as the Authorization header?

### Role-based access

10. Which backend routes are role-protected, and which are only authentication-protected?
11. A storekeeper logs in and tries to submit a new inventory request. Trace what happens step by step.
12. Why is staff able to see all requests in the table, even those submitted by other staff members?

### Protected action and lifecycle

13. How does the backend prevent a storekeeper from approving their own request?
14. Can a storekeeper reject their own request? Show where in the code the check is or is not made.
15. If a request is already issued and someone sends PUT /api/requests/3/status with {status: "pending"}, what HTTP response does the API return and why?
16. What happens if the issued_quantity in a PUT body is larger than the quantity stored in the DB?

### Validation

17. How does the backend protect against someone submitting an item name that is 10,000 characters long?
18. If you send {status: "hacked"} to the status endpoint, what is the HTTP response code and why?
19. Why does the backend re-parse and re-validate quantity even though the HTML input has type="number" min="1"?

### Testing

20. test.js uses plain node assert and fetch. What are the trade-offs compared to using jest and supertest?
21. How does the test suite avoid polluting the database with permanent test data?
22. The test creates a mockRequestId using a direct DB INSERT. Why not use the POST /api/requests endpoint instead?

### Security

23. What is the risk of storing passwords in plaintext? What change would you make to fix it?
24. The backend uses res.status(500).json({ error: error.message }). What information could this leak?
25. What does app.use(cors()) with no options allow, and how would you restrict it to the frontend only?
