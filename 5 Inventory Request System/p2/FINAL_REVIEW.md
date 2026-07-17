# Final Review — Inventory Request System

**Case:** Inventory Request System (Case 5, Project 2)
**Review Stage:** Final — after testing, security hardening, maintainability cleanup, and change request
**Review Date:** 2026-07-11
**Reviewer:** Antigravity AI
**Stack:** React 19 + Vite 8 (frontend) · Express 4 + mysql2 (backend) · MySQL (database)
**Source files inspected before writing this review:**
`server.js`, `db.js`, `db-setup.js`, `schema.sql`, `sessionStore.js`,
`middleware/auth.js`, `routes/requests.js`, `test.js`, `package.json` (both),
`App.jsx`, `index.css`, `App.css`, `main.jsx`, `vite.config.js`, `index.html`,
`.env.example`, `Case_Brief.md`, `MID_REVIEW.md`

---

## 1. Final Feature Summary

The Inventory Request System is a two-tier web prototype. Staff submit inventory requests; storekeepers review, approve, reject, and issue those requests. The full lifecycle works end to end through the React → Express → MySQL chain. Nine automated integration tests run with a single `npm test` command in the backend and pass cleanly. The database is fully MySQL-backed with env-var configuration and a repeatable setup script.

| Feature | Status | Evidence |
|---|---|---|
| Submit request (item, quantity, reason, date) | Complete | `requests.js` L49-82; `App.jsx` L142-184 |
| View own requests (staff, scoped) | Complete | `requests.js` L20-23; `App.jsx` L40-71 |
| View all requests (storekeeper, filtered) | Complete | `requests.js` L11-46; `App.jsx` L40-71 |
| Approve request | Complete | `requests.js` L85-147; storekeeper-only 403 guard |
| Reject request | Complete | Same endpoint, same guard |
| Mark as issued (with issued_quantity) | Complete | `requests.js` L115-132; issued_at timestamped |
| Storekeeper note (write-protected) | Complete | Note only accepted via storekeeper-only PUT endpoint |
| Self-approval prevention | Complete | `requests.js` L110-112; backend enforced |
| Filter by item name | Complete | LIKE query, reactive; `requests.js` L26-29 |
| Filter by requester name | Complete | LIKE query, storekeeper-only in UI |
| Filter by status | Complete | Exact match dropdown |
| Database-backed login | Complete | `server.js` L18-52; `users` table |
| Database-backed session tokens | Complete | `sessions` table; `auth.js` DB-lookup |
| Role enforcement on every route | Complete | `authMiddleware` applied router-wide |
| Repeatable DB setup and reset | Complete | `npm run db:setup` / `npm run db:reset` |
| Automated integration tests | Complete | `test.js` 306 lines, 9 test cases; `npm test` |
| Staff cannot edit storekeeper notes | Complete | No staff write path at API level |
| Staff cannot see other staff's requests | Complete | GET enforces `requester_id = user.id` for staff |

---

## 2. Review Scoring Matrix

> Score meaning: 0 = missing · 1 = present but mostly not working · 2 = partially working with major gaps · 3 = mostly working with important gaps · 4 = working with minor gaps · 5 = complete for the selected case scope

| Feature / Area | Functionality 0-5 | Data Persistence 0-5 | Backend Security / Role Control 0-5 | Validation / Error Handling 0-5 | Testing Evidence 0-5 | Maintainability 0-5 | UI / Manual Usability 0-5 | Evidence | Notes |
|---|---:|---:|---:|---:|---:|---:|---:|---|---|
| Project setup and run commands | 5 | 5 | — | — | — | 4 | — | `backend/package.json` scripts: `start`, `dev`, `db:setup`, `db:reset`, `test`; `frontend/package.json`: `dev`, `build`, `lint`, `preview` | No root-level `package.json` combining both starts; must open two terminals. `nodemon` devDependency present. |
| Database setup and starter data | 5 | 5 | — | — | 5 | 3 | — | `db-setup.js` L1-135; `--reset` flag; seed users (Alice/Bob/Charlie) and 4 sample requests | `schema.sql` is stale (wrong DB name, missing `users`, wrong column name). `db-setup.js` is the authoritative setup and works correctly. |
| Login workflow | 5 | 5 | 4 | 4 | 5 | 3 | 5 | `server.js` L18-52; `auth.js` L1-32; `test.js` T0 (login + bad-login tested) | Session token stored in `sessions` DB table (replaces old in-memory Map). Plaintext password comparison — no bcrypt. Token uses `Math.random()` (not CSPRNG). Demo credentials shown on login page. |
| Role-based access | 5 | 5 | 5 | 4 | 5 | 4 | 5 | `auth.js` L13-26; `requests.js` L8, L91-92, L20-23; `test.js` T3, T8, T9 | `authMiddleware` queries `sessions` then `users` table on every request. Role never trusted from client. Staff scoped to own records. Storekeeper-only actions return 403. Header/query/body spoofing tested and blocked (T9). |
| Main create action | 5 | 5 | 5 | 5 | 5 | 4 | 5 | `requests.js` L49-82; `test.js` T1 (success) + T2 (validation); `App.jsx` L142-184 | POST validates all 4 fields. Sets requester_id/requester_name from DB session — not from body. Body spoofing tested and blocked (T8). |
| Main view/list action | 5 | 5 | 5 | 4 | 4 | 4 | 4 | `requests.js` L11-46; `test.js` T7 (filter retrieval); `App.jsx` L40-71 | Staff GET enforces `requester_id = user.id`. Parameterised LIKE queries. Status exact match. Ordered by `created_at DESC`. No explicit test for staff-scope isolation. |
| Main update/status/cancel action | 5 | 5 | 5 | 5 | 5 | 4 | 4 | `requests.js` L85-147; `test.js` T4 (approve), T6 (issue with boundaries) | PUT handles approved/rejected/issued. Transition guard: only `approved` can move to `issued`. `issued_quantity` and `issued_at` recorded. No staff cancel (not in case brief). |
| Protected action | 5 | 5 | 5 | 5 | 5 | 4 | 5 | `requests.js` L91-93, L110-112; `test.js` T3, T5, T8, T9; `App.jsx` L516-598 | Storekeeper role enforced at API level (403 for staff). Self-approval blocked at API level (403 when requester_id === user.id). Note write-path storekeeper-only. Role spoofing via headers/body/query blocked and tested. |
| Secondary feature | 5 | 5 | 5 | 4 | 4 | 4 | 4 | `requests.js` L25-37; `test.js` T7; `App.jsx` L426-465 | Three filters: item_name (LIKE), requester_name (LIKE), status (exact). Parameterised queries. Requester filter shown only to storekeeper in UI. |
| Case-specific: item, quantity, reason, and requester fields | 5 | 5 | 5 | 5 | 5 | 4 | 5 | `db-setup.js` L59-76 (schema); `requests.js` L50-74; `test.js` T1, T2, T8 | All four case fields in DB schema, validated on POST, taken from session for requester fields. Body spoofing of requester fields rejected and tested. |
| Case-specific: approve/reject/issued status lifecycle | 5 | 5 | 5 | 5 | 5 | 4 | 4 | `db-setup.js` L68 (ENUM); `requests.js` L96-132; `test.js` T4, T6 | ENUM `('pending','approved','rejected','issued')`. Transition rules enforced. `issued_at` timestamped. `issued_quantity` stored. Quantity boundary tested (missing, exceeding, valid). |
| Case-specific: storekeeper note protection and staff ownership | 5 | 5 | 5 | 5 | 5 | 4 | 4 | `requests.js` L87, L130-131, L136-137; `test.js` T3, T5, T9; `App.jsx` L509-513 | Note only writable via storekeeper-only PUT endpoint. No note field in staff form. Note shown read-only for both roles. Staff ownership enforced via `requester_id = user.id` in GET. |
| UI / manual usability | 4 | — | — | 4 | — | 3 | 4 | `App.jsx` (611 lines); `index.css` (355 lines) | Clean card layout, colour-coded status badges, glassmorphism header, hover animations, responsive grid (900 px breakpoint). `<title>frontend</title>` still Vite scaffold default. No meta description. Success/error alerts never auto-dismiss. |
| Security posture | 4 | — | 4 | — | 4 | 3 | — | `auth.js`; `server.js`; `db.js`; `test.js` T8, T9 | Positives: DB env vars, role read from DB each request, parameterised queries, sessions in DB, spoofing tests automated. Gaps: plaintext passwords, `Math.random()` token, `GET /api/users` unauthenticated, broad CORS. |
| Testing evidence | 5 | — | — | — | 5 | 4 | — | `backend/test.js` (306 lines); `package.json` `"test"` script | 9 automated integration test cases. DB reset before tests. Cleanup after. `npm test` is the single command. No test framework (plain Node). No frontend tests. |
| Maintainability | 3 | — | — | — | — | 3 | — | All source files | Clear naming, comments present, single-responsibility routes. All 611 lines of React UI in one file; base URL hardcoded 6 times; `schema.sql` diverges from `db-setup.js`; no backend linter; no test framework. |

---

## 3. Project Structure and Run Commands

```
p2/
├── Case_Brief.md
├── MID_REVIEW.md
├── FINAL_REVIEW.md          <- this file
│
├── backend/
│   ├── .env                 <- git-ignored; contains actual credentials
│   ├── .env.example         <- safe reference; DB_PASSWORD left blank
│   ├── db.js                <- mysql2 connection pool; reads 5 env vars
│   ├── db-setup.js          <- creates DB/tables, seeds users & requests, --reset flag
│   ├── schema.sql           <- STALE — does not match live schema (see section 5)
│   ├── server.js            <- Express entry; /api/login, /api/logout, /api/users, /api/health
│   ├── sessionStore.js      <- deprecated; single comment line only
│   ├── test.js              <- 306-line automated integration test; npm test
│   ├── middleware/
│   │   └── auth.js          <- DB-backed token-to-user lookup middleware
│   ├── routes/
│   │   └── requests.js      <- GET/POST /api/requests; PUT /api/requests/:id/status
│   └── package.json
│
└── frontend/
    ├── index.html           <- title still "frontend" (Vite scaffold default)
    ├── vite.config.js
    ├── package.json
    └── src/
        ├── main.jsx         <- mounts App
        ├── App.jsx          <- entire UI: login, dashboard, forms, request cards (611 lines)
        ├── App.css          <- minimal overrides
        └── index.css        <- design system: tokens, layout, badges, buttons (355 lines)
```

### Run Commands

| Purpose | Command | Directory |
|---|---|---|
| Install backend dependencies | `npm install` | `backend/` |
| Install frontend dependencies | `npm install` | `frontend/` |
| Create DB, tables, seed data | `npm run db:setup` | `backend/` |
| Drop and recreate everything | `npm run db:reset` | `backend/` |
| Start backend (production) | `npm start` | `backend/` |
| Start backend (dev, hot-reload) | `npm run dev` | `backend/` |
| Start frontend dev server | `npm run dev` | `frontend/` |
| Run automated tests | `npm test` | `backend/` |
| Lint frontend | `npm run lint` | `frontend/` |

There is no root-level `package.json`. Two terminals are required.

---

## 4. Frontend / Backend Separation Check

**Verdict: Fully separated.**

| Check | Result | Evidence |
|---|---|---|
| React and Express in separate directories | Pass | `frontend/` and `backend/` are entirely independent |
| Separate `package.json` files | Pass | Each directory has its own dependencies and scripts |
| React calls Express routes only | Pass | All data access in `App.jsx` uses `fetch('http://localhost:5000/api/...')` |
| React never imports `mysql2` | Pass | `mysql2` absent from `frontend/package.json`; no import in any `.jsx` file |
| MySQL connection exists only in backend | Pass | `db.js` is backend-only; pool not exported to frontend |
| No shared code directory | Pass | No `shared/` or `common/` folder crossing the boundary |

The only coupling is the hardcoded `http://localhost:5000` base URL used six times in `App.jsx` (lines 49, 85, 108, 160, 193, 230). This is a maintainability issue, not a separation violation.

---

## 5. Database Setup and Table Summary

### Connection Configuration

The backend reads all five required variables from `.env` via `dotenv`:

| Variable | Default fallback in `db.js` | Configured in `.env.example` |
|---|---|---|
| `DB_HOST` | `'localhost'` | `localhost` |
| `DB_PORT` | `3306` | `3306` |
| `DB_USER` | `'root'` | `root` |
| `DB_PASSWORD` | `''` | *(blank — actual value in `.env` not printed)* |
| `DB_NAME` | `'inventory_request_db'` | `c5p2` |

Note: `db.js` falls back to `'inventory_request_db'` but `.env.example` sets `DB_NAME=c5p2`. When `.env` is present the env var wins. This is a minor naming inconsistency between the fallback and the documented default.

### Tables Created by `db-setup.js` (authoritative)

| Table | Key Columns | Notes |
|---|---|---|
| `users` | `id`, `username` (UNIQUE), `password`, `role` ENUM('staff','storekeeper'), `created_at` | Login/auth table. Seeded with Alice, Bob (staff) and Charlie (storekeeper). |
| `sessions` | `token` (PK), `user_id` (FK to users.id CASCADE), `created_at` | DB-backed session store. Replaces the old in-memory Map. |
| `requests` | `id`, `item_name`, `quantity`, `reason`, `requested_date`, `requester_id` (FK to users.id), `requester_name`, `status` ENUM('pending','approved','rejected','issued'), `storekeeper_note`, `issued_quantity`, `issued_at`, `created_at`, `updated_at` | Core entity. `updated_at` uses `ON UPDATE CURRENT_TIMESTAMP`. |

A **`users`/login table exists.** It holds username, password, and role.

### How Tables and Seed Data Are Created Again

```bash
# First run or after DB drop:
npm run db:setup    # creates DB (c5p2), creates all 3 tables, seeds 3 users + 4 requests

# Full reset (drops tables, recreates, reseeds):
npm run db:reset
```

`db-setup.js` uses `CREATE TABLE IF NOT EXISTS` and seeds only when the table is empty, making it safe to re-run without duplicating data.

### How Test Data Is Created and Cleaned Up

`test.js` creates test data at runtime:

- **Before tests:** forks `db-setup.js --reset` to wipe and reseed everything.
- **During tests:** HTTP POST calls insert records with names like `'Test Wireless Mouse'`; one record is also inserted directly via DB query (`'Charlie Test Request'`).
- **After tests:** `DELETE FROM requests WHERE item_name LIKE 'Test %' OR item_name = 'Charlie Test Request'` removes them.

**Known issue:** The seeded sample records (e.g. `'Test Laptop Stand'`, `'Test HDMI Cable'`) also match `LIKE 'Test %'`, so after a reset-then-test run those seed records will be deleted too. This is a minor inconsistency in the cleanup pattern.

### Stale `schema.sql`

`schema.sql` (15 lines) is the original draft schema and does not match the live schema:

| Item | `schema.sql` | `db-setup.js` (authoritative) |
|---|---|---|
| Database name | `inventory_request_db` | `c5p2` |
| `users` table | Missing | Present |
| `sessions` table | Missing | Present |
| Note column name | `storekeeper_notes` (plural) | `storekeeper_note` (singular) |
| `requester_id` FK | Missing | Present |
| `issued_quantity`, `issued_at` | Missing | Present |
| `updated_at` | Missing | Present |

`schema.sql` should not be used as a setup reference.

---

## 6. Login and Role/Access Explanation

### How Users Log In

1. User submits `POST /api/login` with `{ username, password }`.
2. Express queries `SELECT * FROM users WHERE username = ?` with a parameterised query.
3. If the user is found, `user.password === password` is compared directly (plaintext — no bcrypt).
4. On match, a session token `'token_' + Math.random().toString(36) + '_' + user.id` is generated.
5. The token is `INSERT`ed into the `sessions` table with the user's `user_id`.
6. The response returns `{ token, user: { id, username, role } }`.
7. The React frontend stores `token` and `user` in `localStorage`.
8. Every subsequent API call sends `Authorization: Bearer <token>`.

### How the Storekeeper Logs In Differently

There is no separate login form or URL. The role is determined by the `role` column in the `users` table after login. Charlie (storekeeper) logs in with the same form. After login the UI conditionally renders the submit form (staff only) or the storekeeper dashboard panel, and shows/hides action controls per role.

### How Roles Are Checked on Every Request

`authMiddleware` (`middleware/auth.js`) is applied to all `/api/requests` routes (`router.use(authMiddleware)`):

1. Extracts `Bearer <token>` from the `Authorization` header.
2. Queries `sessions` table: `SELECT user_id FROM sessions WHERE token = ?`.
3. If no session found — returns 401.
4. Queries `users` table: `SELECT * FROM users WHERE id = ?`.
5. Attaches the full user record (including `role`) to `req.user`.
6. Role is always read from the database — never from the client request body, headers, or query parameters.

### Where Role Checks Live

| Check | Location | Effect |
|---|---|---|
| Token presence | `auth.js` L8-10 | 401 if missing |
| Token validity (session in DB) | `auth.js` L14-17 | 401 if not found |
| User record exists | `auth.js` L21-24 | 401 if deleted |
| Storekeeper-only: approve/reject/issue | `requests.js` L91-93 | 403 for staff |
| Staff scoped to own records | `requests.js` L20-23 | SQL adds `AND requester_id = ?` |
| Self-approval block | `requests.js` L110-112 | 403 if requester_id equals logged-in user id |

---

## 7. Protected Action Explanation

The case requires that staff cannot approve, reject, or issue requests, and cannot write storekeeper notes.

### Layer 1 — Role Guard

In `routes/requests.js`, line 91-93:

```js
if (user.role !== 'storekeeper') {
  return res.status(403).json({ error: 'Access denied. Only storekeepers can approve or manage requests.' });
}
```

This applies to `PUT /api/requests/:id/status` — the only endpoint that can change status or write notes.

### Layer 2 — Self-Action Guard

Line 110-112:

```js
if (request.requester_id === user.id) {
  return res.status(403).json({ error: 'Forbidden. Storekeepers cannot approve or manage requests they submitted themselves.' });
}
```

### Layer 3 — Note Write-Path Restriction

`storekeeper_note` is only accepted as part of the `PUT /api/requests/:id/status` request body. No separate note endpoint exists. The staff submit form has no note field. A staff user has no HTTP endpoint through which to write a storekeeper note.

### Layer 4 — Staff Record Ownership

`GET /api/requests` always appends `AND requester_id = ?` for staff users. A staff member cannot read another staff member's records regardless of filter parameters.

### UI Rendering (not a substitute for backend checks)

- Action panel (`Approve`/`Reject`/`Mark as Issued` buttons) rendered only when `currentUser.role === 'storekeeper'`.
- Self-submitted request shows "⚠ Self-approval blocked" warning instead of action buttons.
- The backend enforces all of the above independently — no bypass risk from DOM manipulation.

---

## 8. Validation Summary

### Backend — POST /api/requests (`requests.js` L53-69)

| Field | Rule | HTTP Error | Message |
|---|---|---|---|
| `item_name` | Present and non-empty after trim | 400 | "Item name is required." |
| `quantity` | `parseInt` must be >= 1 (isNaN or <= 0 rejected) | 400 | "Quantity must be a positive integer." |
| `reason` | Present and non-empty after trim | 400 | "Reason for request is required." |
| `requested_date` | Truthy (not null/undefined/empty) | 400 | "Requested date is required." |

### Backend — PUT /api/requests/:id/status (`requests.js` L96-126)

| Check | HTTP Error | Message |
|---|---|---|
| `status` must be in `['approved','rejected','issued']` | 400 | "Invalid target status. Must be approved, rejected, or issued." |
| `issued_quantity` required and > 0 when status = 'issued' | 400 | "Issued quantity must be a positive integer." |
| `issued_quantity` <= original `quantity` | 400 | "Issued quantity cannot exceed requested quantity of N." |
| Request must be `approved` before it can be `issued` | 400 | "Only approved requests can be marked as issued." |
| Request not found | 404 | "Request not found." |

### Frontend — `App.jsx` (pre-fetch checks)

- `item_name.trim()` non-empty, `quantity > 0`, `reason.trim()` non-empty before `fetch` call.
- `issuedQty` range checked client-side in `handleMarkIssued`.
- HTML `required` attributes on all form inputs.

### Validation Gaps

| Gap | Severity |
|---|---|
| `requested_date` format not validated backend-side (a string like "not-a-date" would insert `0000-00-00` in lenient SQL mode) | Medium |
| No maximum length checks on `item_name`, `reason`, `storekeeper_note` | Low |
| No server-side HTML sanitisation (XSS risk is low due to React JSX escaping, but not addressed at API level) | Low |

---

## 9. Automated and Manual Testing Summary

### Automated Test Command

```bash
cd backend
npm test
```

This runs `node test.js`.

### What the Test Script Does

`test.js` (306 lines) is a standalone Node.js integration test with no external test framework. Steps:

1. **Resets the database** by forking `db-setup.js --reset` (drops and reseeds all tables).
2. **Starts the Express server** as a child process on port 5000.
3. **Waits 1.5 seconds** for the server to bind the port.
4. Runs 10 test cases using `fetch` and a custom `assert` helper that prints PASS or throws.
5. **Cleans up** test records: `DELETE FROM requests WHERE item_name LIKE 'Test %' OR item_name = 'Charlie Test Request'`.
6. Kills the server process and exits with code 0 (pass) or 1 (fail).

### Test Cases

| Test | What it checks |
|---|---|
| T0 — Login | Alice login returns 200 + token; Charlie login returns 200 + token; wrong password returns 401 |
| T1 — Submit request | POST with valid data returns 201; `status = 'pending'`; `requester_name = 'Alice'` (from session, not body) |
| T2 — Validation failure | POST with empty item_name and negative quantity returns 400 with error field |
| T3 — Staff blocked from approving | Alice's token on PUT /status returns 403; error message mentions "Only storekeepers can approve" |
| T4 — Storekeeper approves | Charlie's token on PUT /status returns 200; status transitions to 'approved'; note saved |
| T5 — Self-approval blocked | Charlie inserts own request directly in DB; PUT /status with Charlie's token returns 403 |
| T6 — Mark as issued (boundaries) | Missing qty returns 400; qty exceeds requested returns 400; valid qty returns 200; `issued_quantity` and `issued_at` verified |
| T7 — Filter retrieval | GET with `item_name=Wireless` returns >= 1 result; item_name contains 'Wireless' |
| T8 — Body spoofing | POST with `requester_name: 'Charlie'`, `requester_id: charlieId`, `status: 'approved'` in body returns 201 but records Alice's real identity and pending status |
| T9 — Header/query spoofing | Alice's token on PUT with `role=storekeeper` in body, query string, and custom headers returns 403 |

### What Was Not Automated

| Gap | Impact |
|---|---|
| Staff cannot see other staff's records via filter manipulation | Not tested |
| Frontend behaviour (login UI, form submission, role-conditional rendering) | No frontend tests; Vitest not installed |
| `GET /api/users` unauthenticated access | Not covered in `test.js` |
| Session persistence across server restart | Not tested |
| Date format edge cases | Not tested |

---

## 10. Stage 11 Change Summary

The Mid-Review was written after the secondary-feature stage. Comparing mid-review findings to the final state:

### Issues Resolved After Mid-Review

| Mid-Review Issue | Mid-Review Finding | Final State |
|---|---|---|
| C1 — In-memory session store | Sessions stored in `Map`, lost on restart | **Fixed.** `sessions` DB table created; `auth.js` queries DB; `sessionStore.js` is now a single deprecated-comment line |

### Issues Not Resolved

| Mid-Review Issue | Mid-Review Finding | Final State |
|---|---|---|
| C2 — Plaintext passwords | No bcrypt | **Not fixed.** `server.js` L33 still uses `===` comparison |
| C3 — `GET /api/users` unauthenticated | Exposed all usernames/roles | **Not fixed.** `server.js` L69 still has no `authMiddleware` |
| C4 — `Math.random()` token | Not cryptographically secure | **Not fixed.** `server.js` L38 unchanged |
| I2 — Hardcoded base URL | 6 occurrences in `App.jsx` | **Not fixed.** Still at L49, 85, 108, 160, 193, 230 |
| I3 — Broad CORS | `app.use(cors())` allows `*` | **Not fixed.** `server.js` L8 unchanged |
| I4 — `<title>frontend</title>` | Generic Vite scaffold title | **Not fixed.** `index.html` L7 unchanged |
| M1 — All UI in one file | 611 lines in `App.jsx` | **Not changed.** 611 lines, no component split |

### Items Added / Improved After Mid-Review

| Item | Change |
|---|---|
| `sessions` DB table | New; created in `db-setup.js`; `auth.js` rewritten to query it |
| `test.js` growth | Expanded from 229 lines to 306 lines; added T8 (body spoofing) and T9 (header/query spoofing) |
| Self-approval UI warning | `App.jsx` — "⚠ Self-approval blocked" message for storekeeper viewing own requests |
| `sessionStore.js` | Content replaced with deprecation comment instead of being deleted |

---

## 11. Stage Drift / Early Work

| Item | Expected Stage | Found at Mid-Review | Final State |
|---|---|---|---|
| Integration test script (`test.js`) | Stage 8 (testing) | Already present (229 lines) | Expanded to 306 lines — expected and appropriate |
| `issued_quantity` and `issued_at` tracking | Stage 6-7 scope | Present and working | Unchanged — correctly implemented |
| `updated_at` `ON UPDATE` timestamp | Maintainability stage | Present in DB schema | Unchanged |
| Spoofing-specific test cases (T8, T9) | Security hardening stage | Not yet present at mid-review | Added — appropriate for final stage |

No features beyond the case scope (email, PDF export, barcode scanning, inventory catalog) were added.

---

## 12. Security Risks and Exposed-Secret Check

**No secrets are printed in this review.** Actual credential values from `.env` are not disclosed.

| Risk | Severity | Evidence | Status |
|---|---|---|---|
| Plaintext password storage and comparison | High | `server.js` L33: `user.password !== password` | Open — bcrypt not used |
| `Math.random()` session token (not CSPRNG) | Medium | `server.js` L38 | Open |
| No session expiry | Medium | `sessions` table has `created_at` but no expiry check or TTL logic | Open |
| `GET /api/users` unauthenticated | Medium | `server.js` L69-76: no `authMiddleware` | Open |
| CORS allows all origins | Medium | `server.js` L8: `app.use(cors())` with no `{ origin }` option | Open |
| `http://localhost:5000` hardcoded in React source | Low | `App.jsx` L49, 85, 108, 160, 193, 230 | Open |
| Backend has no `.gitignore` | Medium | `.env` file with real credentials could be accidentally committed | Open |
| Seed cleanup matches seed data names | Low | `db-setup.js` seeds `'Test Laptop Stand'` etc.; `LIKE 'Test %'` in cleanup would delete them | Minor data management inconsistency |

### Secret Exposure Assessment

- `DB_PASSWORD` is in `.env` which was not read during this review and is not printed.
- `.env.example` shows `DB_PASSWORD=` (blank) — safe.
- No credentials appear in any `.jsx`, `.js`, or `.json` source file.
- The backend directory has no `.gitignore`. If the backend directory is committed to Git, `.env` with a real password could be included.

---

## 13. Documentation / Code Mismatches

| Mismatch | Source A | Source B | Impact |
|---|---|---|---|
| DB name: `inventory_request_db` vs `c5p2` | `schema.sql` L1-2 | `.env.example` L6; `db-setup.js` L21 | Running `schema.sql` directly creates the wrong database |
| `storekeeper_notes` (plural) vs `storekeeper_note` (singular) | `schema.sql` L12 | `db-setup.js` L69; `requests.js` L87 | Column name mismatch — would cause query failures if `schema.sql` were used |
| `users` table missing from `schema.sql` | `schema.sql` | `db-setup.js` L36-44 | `schema.sql` is not a usable standalone setup script |
| `sessions` table missing from `schema.sql` | `schema.sql` | `db-setup.js` L48-55 | Same issue |
| `db.js` fallback DB name `inventory_request_db` | `db.js` L9 | `.env.example` sets `c5p2` | When `.env` is absent the app connects to a different DB than the one `db-setup.js` creates |
| Mid-Review listed C3 (`GET /api/users`) as a gap | `MID_REVIEW.md` C3 | `server.js` L69 (unchanged) | Issue documented but not resolved |
| Mid-Review listed C4 (`Math.random()`) as a gap | `MID_REVIEW.md` C4 | `server.js` L38 (unchanged) | Issue documented but not resolved |
| Mid-Review listed C2 (plaintext passwords) as a gap | `MID_REVIEW.md` C2 | `server.js` L33 (unchanged) | Issue documented but not resolved |

---

## 14. Known Limitations

| # | Limitation | Risk Level |
|---|---|---|
| L1 | Passwords stored and compared as plaintext; no bcrypt | High |
| L2 | Session tokens generated with `Math.random()` — not cryptographically secure | Medium |
| L3 | No session expiry — tokens are valid indefinitely until logout or DB drop | Medium |
| L4 | `GET /api/users` is unauthenticated — exposes all usernames and roles | Medium |
| L5 | CORS open to all origins (`*`) — any domain can call the API | Medium |
| L6 | `schema.sql` is stale and misleading — should not be used for setup | Low |
| L7 | `http://localhost:5000` hardcoded 6 times in React — breaks in non-local environments | Low |
| L8 | All 611 lines of UI in a single `App.jsx` — difficult to maintain and test | Low |
| L9 | No frontend tests (no Vitest, no React Testing Library) | Low |
| L10 | Page title is `frontend` (Vite scaffold default) — poor UX and SEO | Low |
| L11 | No meta description in `index.html` | Low |
| L12 | No backend `.gitignore` — `.env` could be accidentally committed with real credentials | Medium |
| L13 | `requested_date` format not validated server-side — invalid date strings accepted | Low |
| L14 | Success/error alerts never auto-dismiss — cleared only by the next action | Low |
| L15 | `sessionStore.js` is an orphaned one-line comment file rather than deleted | Cosmetic |
| L16 | Test seed cleanup (`LIKE 'Test %'`) also matches seeded sample data names (e.g. 'Test Laptop Stand') | Low |

---

## 15. Demo Script

### Prerequisites

- MySQL running locally on port 3306
- `.env` file present in `backend/` with correct credentials
- `npm install` run in both `backend/` and `frontend/`

### Setup

```bash
# Terminal A — backend
cd backend
npm run db:reset      # drops and recreates DB, tables, seeds users + requests
npm run dev           # starts Express on http://localhost:5000

# Terminal B — frontend
cd frontend
npm run dev           # starts Vite dev server on http://localhost:5173
```

Open browser to `http://localhost:5173`.

---

**Scene 1 — Staff Login and Request Submission**

```
Log in as: Alice / password123
Notice: Submit Request form on the left; no Approve/Reject buttons visible.
Fill in: Item Name "Wireless Headset", Quantity 2, Reason "Remote work audio setup", Date today.
Click Submit Request.
Confirm the new card appears in the list with status badge "pending".
```

**Scene 2 — Staff Access Restriction (API level)**

```
As Alice, attempt to approve via API:
  PUT http://localhost:5000/api/requests/1/status
  Authorization: Bearer <Alice's token>
  Body: { "status": "approved" }
Confirm response: 403 Forbidden — "Only storekeepers can approve or manage requests."
```

**Scene 3 — Storekeeper Login and Approval**

```
Log in as: Charlie / password123
Notice: Storekeeper Dashboard panel on the left; all requests visible.
Find Alice's "Wireless Headset" request (status: pending).
Type a note: "Approved for home office budget."
Click Approve.
Confirm status badge changes to "approved" and note appears on the card.
```

**Scene 4 — Self-Approval Block**

```
As Charlie, scroll to any request where "Requested by = Charlie".
Confirm the action buttons are replaced with "⚠ Self-approval blocked".
```

**Scene 5 — Mark as Issued**

```
As Charlie, find Alice's "Wireless Headset" request (status: approved).
Set Issued Qty to 2, add note "Collected from storage room B."
Click Mark as Issued.
Confirm status badge changes to "issued"; "Issued Qty: 2" and timestamp appear.
```

**Scene 6 — Filter**

```
Type "Wireless" in the Item Name filter.
Confirm only matching requests appear.
Select "issued" in the Status dropdown.
Confirm only issued requests appear.
```

**Scene 7 — Automated Tests**

```
In Terminal A (backend):
npm test
Observe: database reset, server start, 10 test cases run.
Confirm output ends with: "All integration and spoofing tests passed successfully!"
Observe cleanup: "Cleanup completed."
```

---

## 16. Suggested Viva Questions

### Architecture and Setup

1. Why does the project have two separate `package.json` files? What would happen if you merged them?
2. What does `npm run db:reset` do step by step? What is the `--reset` flag in `db-setup.js`?
3. Explain why `schema.sql` and `db-setup.js` define different column names for the storekeeper note field.
4. If you deployed this app to a server, what would you change in `App.jsx` to stop the hardcoded `localhost:5000` from breaking it?
5. Why does `vite.config.js` have no proxy configured, and what would a proxy configuration accomplish?

### Database and Login

6. Walk through what happens in the database when Charlie logs in and then submits a PUT request.
7. Why does `authMiddleware` do two database queries on every request instead of one?
8. What is stored in the `sessions` table? What happens to those rows when the user logs out?
9. Why is `Math.random()` considered insecure for session token generation? What should replace it?
10. What risk does plaintext password storage introduce? How would bcrypt change the login flow?

### Role Control and Protected Actions

11. Point to the exact line in `requests.js` that prevents a staff member from approving a request. Explain what HTTP status code is returned and why.
12. Could a logged-in staff member send a request body with `"role": "storekeeper"` and bypass the role check? Why or why not?
13. Where exactly in the code does the system prevent a storekeeper from approving their own request?
14. Show where in the code staff members are prevented from seeing other staff members' requests. Would adding `?requester_id=2` to the URL bypass this?

### Validation

15. What happens if a staff member submits a POST with `quantity: -3`? Trace the exact validation path.
16. What would happen if someone submitted `requested_date: "hello"` to the API? Is this handled?
17. Why does the backend validate fields that the frontend already validates? What attack would bypass frontend-only validation?

### Testing

18. Run `npm test`. What does the test do before sending any HTTP requests?
19. How does Test 8 (body spoofing) prove that the `requester_name` field cannot be forged by the client?
20. What would need to change to convert `test.js` into a Jest test suite?
21. The test cleanup uses `DELETE FROM requests WHERE item_name LIKE 'Test %'`. What is the unintended side effect of this on seeded data?
22. Why is there no test verifying that Alice cannot see Bob's requests?

### Security and Limitations

23. `GET /api/users` is in `server.js` with no auth middleware. What information does it expose and what could an attacker do with it?
24. The CORS configuration is `app.use(cors())`. What does this mean and what would a more restrictive setting look like?
25. If a session token is stolen, how long is it valid? How would you add an expiry?
26. `sessionStore.js` contains only a comment. Why is it still in the project? Should it be deleted?
