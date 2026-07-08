# Helpdesk Ticket System — Final Review

**Review Date:** 2026-06-07  
**Review Stage:** Final — after testing, security hardening, maintainability cleanup, and change request  
**Reviewer:** Antigravity AI Review Agent  
**Project Path:** `backend/` (Express + MySQL) + `frontend/` (React + Vite)  
**Source of evidence:** Direct inspection of all project files — `server.js`, `middleware/auth.js`, `config/db.js`, `seed.js`, `test.js`, `App.jsx`, `index.css`, `vite.config.js`, `package.json` (both tiers), `schema.sql`, `.env` (key names only), `.env.example`, `Case_Brief.md`, `MID_REVIEW.md`.

---

## 1. Final Feature Summary

The project is a fully separated React (Vite) + Express (Node.js) + MySQL helpdesk prototype. All core features described in the Case Brief are implemented and verifiable in code:

| Feature | Status |
|---|---|
| Customer creates ticket (title, description, category) | ✅ Implemented |
| Customer views their own tickets only | ✅ Implemented + backend-enforced |
| Customer adds response to own ticket | ✅ Implemented |
| Customer reopens a closed ticket (once only) | ✅ Implemented — Stage 11 change |
| Agent views all submitted tickets | ✅ Implemented |
| Agent adds response to any ticket + updates status atomically | ✅ Implemented (transactional) |
| Agent changes ticket status directly | ✅ Implemented |
| Agent closes ticket | ✅ Implemented (protected) |
| Filter by category | ✅ Implemented |
| Filter by status | ✅ Implemented |
| Filter by submitted username (agent only) | ✅ Implemented |
| `created_by` (submitted user) visible on all ticket views | ✅ Implemented |
| Edit agent response | ❌ Not implemented |
| Ticket attachment, live chat, knowledge base | ❌ Out of scope (correct) |

**One feature gap persists throughout all stages:** An edit-response endpoint (`PATCH /api/responses/:id`) and its UI control were never added. The Case Brief states users should not be able to "edit agent responses", which implies agents *can* edit their own — this ambiguity means the omission is debatable, but as of final stage it remains absent.

---

## 2. Review Scoring Matrix

| Feature / Area | Functionality 0-5 | Data Persistence 0-5 | Backend Security / Role Control 0-5 | Validation / Error Handling 0-5 | Testing Evidence 0-5 | Maintainability 0-5 | UI / Manual Usability 0-5 | Evidence | Notes |
|---|---:|---:|---:|---:|---:|---:|---:|---|---|
| Project setup and run commands | 5 | 5 | 4 | 4 | 4 | 3 | 4 | `package.json` scripts: `start`, `dev`, `db:seed`, `test`; Vite on 3000, Express on 5000; Vite proxy configured | No README; no `.gitignore`; `JWT_SECRET` still missing from `.env` and `.env.example` |
| Database setup and starter data | 5 | 5 | 4 | 4 | 4 | 4 | 4 | `schema.sql` at root; `seed.js` does destructive DROP+CREATE+INSERT; bcrypt-hashed passwords; `npm run db:seed` documented | `seed.js` duplicates DDL from `schema.sql`; `DB_NAME` in `.env.example` says `helpdesk_db` but actual DB is `c3p1` |
| Login workflow | 5 | 5 | 4 | 5 | 4 | 4 | 4 | DB-backed; bcrypt compare; JWT 24 h; rate limiter 20 req/min per IP; 401 on bad credentials; demo account hints in UI | `JWT_SECRET` not in `.env`; falls back to known hardcoded string; CORS still wide-open |
| Role-based access | 5 | 5 | 5 | 4 | 4 | 4 | 4 | `authMiddleware` global after `/api/login` and `/api/health`; role checked inline per route on list, detail, response, and status routes; test verifies 403 on cross-role action | No dedicated `requireAgent` middleware — role logic is inline per route (acceptable for prototype) |
| Main create action | 5 | 5 | 5 | 5 | 4 | 4 | 4 | `POST /api/tickets`; requires auth; `user_id` taken from JWT; sanitisation applied; title 3–150 chars; description 10–5000 chars; category validated against allowlist | Frontend form uses HTML `required` but does not enforce char limits client-side |
| Main view/list action | 5 | 5 | 5 | 4 | 4 | 4 | 4 | `GET /api/tickets` enforces `AND t.user_id = ?` for customers; agent sees all; `created_by` JOIN; category and status filter values validated against allowlists | No pagination; user filter is exact case-sensitive match |
| Main update/status/cancel action | 5 | 5 | 5 | 5 | 4 | 4 | 4 | `PATCH /api/tickets/:id/status`; status validated against allowlist; customer path restricted to reopen-once only; agent path verified with `affectedRows` check | Customer reopen guard relies on `reopened` flag in DB, set correctly |
| Protected action | 4 | 4 | 5 | 4 | 4 | 3 | 4 | Agent-only close: UI button hidden for customers + backend returns 403; customer cannot set status to Closed; cross-user response blocked | Edit-response endpoint never implemented; only the "close" half of the protected action is complete |
| Secondary feature | 5 | 5 | 5 | 5 | 4 | 4 | 4 | Category, status, user filters wired in both UI and backend; SQL parameterised; filter values validated against allowlists before inclusion in query | Submitted-user filter is exact username match; partial search not supported |
| Case-specific: ticket category, status, and submitted user tracking | 5 | 5 | 5 | 5 | 4 | 4 | 4 | `category` VARCHAR(50), `status` ENUM, `user_id` FK to `users`; `created_by` join on all list and detail queries; category validated against allowlist in backend | `category` stored as VARCHAR not ENUM — allowlist is enforced by code, not by DB constraint |
| Case-specific: agent response workflow and ticket closure | 5 | 5 | 5 | 4 | 4 | 4 | 4 | `POST /api/tickets/:id/responses` uses `beginTransaction` / `commit` / `rollback`; agent can update status in same request; `PATCH /api/tickets/:id/status` closes ticket; test verifies end-to-end | Response message validated 1–2000 chars; no confirmation dialog before closure |
| Case-specific: user visibility limited to own tickets | 5 | 5 | 5 | 5 | 5 | 5 | 4 | List: `AND t.user_id = ?` for customers; detail: 403 if `ticket.user_id !== req.user.id`; response POST: 403 if ownership fails; test verifies Bob cannot see Alice's ticket | Consistent enforcement on list, detail, and response routes — fully tested |
| UI / manual usability | 4 | — | — | 4 | 3 | 3 | 4 | Dark theme; status badges; conversation bubbles; role badge; logout; pulsing backend indicator; reopen button conditionally shown | `In Progress` badge CSS class mapping bug — badge renders unstyled; `alert()` still used for submit feedback |
| Security posture | 4 | — | 4 | 4 | 3 | 3 | — | Custom security headers (CSP, X-Frame, X-XSS, etc.); `app.disable('x-powered-by')`; rate limiter on login; input sanitisation; parameterised queries; bcrypt; JWT | `JWT_SECRET` not in `.env`; CORS still wide-open; no `.gitignore` |
| Testing evidence | 4 | 4 | 5 | 4 | 4 | 4 | — | `test.js` 269 lines: spawns server on port 5001; creates test users; runs 11 assertions covering auth, RBAC, workflow, reopen, and filtering; cleans up via CASCADE DELETE | No test framework; custom runner only; no browser/UI tests; no separate test DB |
| Maintainability | 3 | — | — | — | 3 | 3 | — | Inline comments on each route group; `config/db.js` isolates DB pool; `middleware/auth.js` isolates JWT check; `.env.example` present | `server.js` is 462 lines all in one file; `App.jsx` is 687 lines all in one component; no README; no `.gitignore`; schema duplicated in `seed.js` |

---

## 3. Project Structure and Run Commands

```
p1/
├── Case_Brief.md
├── MID_REVIEW.md
├── FINAL_REVIEW.md
├── schema.sql                          # Reference DDL (IF NOT EXISTS guards)
├── backend/
│   ├── .env                            # Active env config (not in Git — but no .gitignore!)
│   ├── .env.example                    # Template (missing JWT_SECRET and DB_PORT; wrong DB_NAME)
│   ├── package.json                    # Scripts: start, dev, db:seed, test
│   ├── server.js                       # Express app — 462 lines, all routes inline
│   ├── seed.js                         # Destructive reset + seed (duplicates DDL)
│   ├── test.js                         # Integration test runner — 269 lines
│   ├── config/
│   │   └── db.js                       # mysql2/promise pool — reads from process.env
│   └── middleware/
│       └── auth.js                     # JWT verification middleware
└── frontend/
    ├── index.html
    ├── package.json                    # React 18, lucide-react, Vite 5
    ├── vite.config.js                  # Port 3000; proxy /api → http://localhost:5000
    └── src/
        ├── main.jsx                    # React root mount
        ├── App.jsx                     # 687 lines — all views in one component
        └── index.css                   # 512 lines — full dark-theme design system
```

### Run Commands

| Action | Command | Directory |
|---|---|---|
| Install backend dependencies | `npm install` | `backend/` |
| Install frontend dependencies | `npm install` | `frontend/` |
| Create database + seed data | `npm run db:seed` | `backend/` |
| Start backend (production) | `npm start` | `backend/` |
| Start backend (dev, hot reload) | `npm run dev` | `backend/` |
| Start frontend (dev, port 3000) | `npm run dev` | `frontend/` |
| Run automated integration tests | `npm test` | `backend/` |

---

## 4. Frontend/Backend Separation Check

**React and Express are fully separated.** They run as independent processes on different ports.

| Check | Result |
|---|---|
| React lives in `frontend/` (Vite + React 18) | ✅ |
| Express lives in `backend/` (Node.js / Express 4) | ✅ |
| React communicates with Express via `fetch('/api/...')` only | ✅ |
| Vite proxy rewrites `/api/*` → `http://localhost:5000/api/*` | ✅ — `vite.config.js` lines 9–15 |
| `mysql2` in `frontend/package.json` | ❌ Not present — correct |
| Any `VITE_` prefixed DB variables that would expose credentials to browser | ❌ None — correct |
| Frontend directly opens a MySQL connection | ❌ Never — correct |

The frontend never talks to MySQL. All data access goes through Express routes. The Vite proxy is the only coupling mechanism during development; in production a reverse proxy (e.g. Nginx) would serve the same purpose.

---

## 5. Database Setup and Table Summary

### Environment Variable Configuration

All five required variables are configured in `backend/.env` (key names confirmed; password value not printed):

| Variable | In `.env` | In `.env.example` | In `db.js` |
|---|---|---|---|
| `DB_HOST` | ✅ | ✅ | ✅ (`process.env.DB_HOST \|\| 'localhost'`) |
| `DB_PORT` | ✅ | ❌ Missing | ✅ (`process.env.DB_PORT \|\| '3306'`) |
| `DB_USER` | ✅ | ✅ | ✅ (`process.env.DB_USER \|\| 'root'`) |
| `DB_PASSWORD` | ✅ | ✅ (placeholder only) | ✅ (value not printed here) |
| `DB_NAME` | ✅ | ✅ (wrong: `helpdesk_db`) | ✅ (`process.env.DB_NAME \|\| 'c3p1'`) |
| `JWT_SECRET` | ❌ Missing | ❌ Missing | Falls back to hardcoded string |

### Tables

Database name: **`c3p1`**

| Table | Columns | Notes |
|---|---|---|
| `users` | `id` PK, `username` UNIQUE, `password` VARCHAR(255) bcrypt, `role` ENUM(`customer`,`agent`) | Login table — exists and is queried for every login |
| `tickets` | `id` PK, `title` VARCHAR(255), `description` TEXT, `category` VARCHAR(50), `user_id` FK→`users`, `status` ENUM(4 values), `reopened` TINYINT DEFAULT 0, `created_at`, `updated_at` | `reopened` added as Stage 11 change request |
| `responses` | `id` PK, `ticket_id` FK→`tickets`, `user_id` FK→`users`, `message` TEXT, `created_at` | Both FKs have ON DELETE CASCADE |

### How to Recreate Tables and Seed Data

Run from `backend/`:
```bash
npm run db:seed
# equivalent: node seed.js
```
`seed.js` steps:
1. Connects to MySQL (no database selected).
2. Runs `CREATE DATABASE IF NOT EXISTS c3p1`.
3. Drops `responses`, `tickets`, `users` in dependency order.
4. Recreates all three tables.
5. Inserts 1 agent + 3 customers — all with bcrypt-hashed password `"password"`.
6. Inserts 3 tickets across different statuses (Open, In Progress, Resolved).
7. Inserts 3 responses across two tickets.

`schema.sql` at the project root provides the same DDL with `IF NOT EXISTS` guards and can be run as:
```bash
mysql -u root -p < schema.sql
```
It does not include seed rows or DROP statements — use it to create tables on an empty database without wiping data.

---

## 6. Login and Role/Access Explanation

### How Login Works

1. User submits username + password to `POST /api/login`.
2. Route is rate-limited: max 20 requests per IP per 60 seconds (custom in-memory `rateLimiter` in `server.js` lines 34–56).
3. `sanitizeInput()` applied to username; length-checked ≤ 50 chars.
4. Backend runs `SELECT * FROM users WHERE username = ?` (parameterised).
5. `bcrypt.compare(password, user.password)` is called.
6. On success, a JWT is signed with `{ id, username, role }` payload, 24-hour expiry.
7. Frontend stores token and user object in `localStorage`. `authFetch` attaches `Authorization: Bearer <token>` on every subsequent call.
8. On any 401 response, `authFetch` automatically calls `handleLogout()` — clears localStorage and resets all state.

### How Roles Are Checked

`authMiddleware` is registered via `app.use(authMiddleware)` **after** the public `/api/login` and `/api/health` routes. Every route below that line requires a valid JWT. `req.user` is set to the decoded payload `{ id, username, role }`.

Role enforcement per route:

| Route | Customer | Agent |
|---|---|---|
| `GET /api/tickets` | `AND t.user_id = req.user.id` appended | No ownership filter; optional `created_by` filter |
| `GET /api/tickets/:id` | 403 if `ticket.user_id !== req.user.id` | Full access |
| `POST /api/tickets` | Creates ticket linked to `req.user.id` (not request body) | Can also create |
| `POST /api/tickets/:id/responses` | 403 if not owner; 403 if attempts status change | Can reply + set status atomically |
| `PATCH /api/tickets/:id/status` | Only `'Open'` allowed; must own ticket; ticket must be Closed; `reopened === 0` | Full status set; `affectedRows` check for 404 |

### Seed Credentials (Demo Accounts)

| Username | Role | Password |
|---|---|---|
| `agent` | agent | `password` |
| `alice` | customer | `password` |
| `bob` | customer | `password` |
| `charlie` | customer | `password` |

---

## 7. Protected Action Explanation

**Designated protected actions: close ticket (agent-only) and prevent customers from changing ticket status.**

### Close Ticket — Agent Only

- **Backend (`PATCH /api/tickets/:id/status`):** If `req.user.role === 'customer'` and the requested status is not `'Open'`, returns HTTP 403: `"Access denied. Customers can only reopen tickets (status: Open)."` A customer sending `status: 'Closed'` gets 403.
- **UI:** "Close Ticket" button (App.jsx line 485–494) renders only when `user.role === 'agent' && ticketDetails.status !== 'Closed'`. Customers never see the button.
- **Test:** `test.js` lines 128–138 — Alice PATCHes `status: 'Closed'`, asserts response status `=== 403`.

### Cross-User Response Blocked

- **Backend:** `POST /api/tickets/:id/responses` lines 318–327 — checks `ticket.user_id !== req.user.id` for customers and returns 403.
- **Test:** `test.js` lines 120–125 — Bob GETs Alice's ticket, asserts response status `=== 403`.

### Customer Ticket Reopen — Once Only (Stage 11 Change)

- **Backend:** Customer can PATCH status to `'Open'` only if: they own the ticket, current status is `'Closed'`, and `ticket.reopened === 0`. On success, sets `reopened = 1`.
- **UI:** "Reopen Ticket" button shown only when `user.role === 'customer' && ticketDetails.status === 'Closed' && ticketDetails.reopened === 0` (App.jsx lines 496–506).
- **Test:** Alice reopens (asserts `reopened === 1`), agent re-closes, Alice attempts second reopen (asserts HTTP 400).

### Edit Agent Response — Not Implemented

No `PATCH /api/responses/:id` endpoint and no UI control for editing. The Case Brief says "users should not be able to edit agent responses" — this was implemented passively by having no edit endpoint. Agents also cannot edit their own responses. This was not resolved in any stage.

---

## 8. Validation Summary

### Backend Validation

| Field | Rule |
|---|---|
| Login username | Required; sanitised; max 50 chars |
| Login password | Required |
| Ticket title | Required; sanitised; 3–150 chars |
| Ticket description | Required; sanitised; 10–5000 chars |
| Ticket category | Required; validated against allowlist `['Technical','Billing','Hardware','General']` |
| Response message | Required; sanitised; 1–2000 chars |
| Status (PATCH) | Required; validated against `['Open','In Progress','Resolved','Closed']` |
| Status (response POST, agent) | Validated against same allowlist before DB write |
| Ticket ID in URL | `parseInt(..., 10)`; returns 400 if `isNaN` |

### Input Sanitisation

`sanitizeInput()` (server.js lines 59–68) encodes `&`, `<`, `>`, `"`, `'`, `/` as HTML entities. Applied to: login username, ticket title, description, response message, and the `created_by` filter parameter.

### SQL Injection

All queries use `?` placeholder syntax with `mysql2/promise`. No string concatenation used for user-supplied values in SQL.

### Frontend Validation

HTML `required` attributes on all form inputs. `replyMessage.trim()` guard before response submission. No client-side char-length enforcement (backend is authoritative).

### Remaining Gap

`category` is stored as `VARCHAR(50)` — allowlist enforced by application code only, not by a DB ENUM constraint. A direct DB insert could bypass the validation.

---

## 9. Automated and Manual Testing Summary

### Automated Test

**Command:** `npm test` (from `backend/`)  
**Runner:** `node test.js` — custom integration test, no external framework  
**File:** `backend/test.js` — 269 lines

**Setup:**
- Connects to MySQL; deletes any leftover `test_` users.
- Inserts `test_alice` (customer), `test_bob` (customer), `test_agent` (agent).
- Spawns a second Express server on port **5001** (separate from the development server on 5000).
- Waits 2 seconds for server boot, then sends HTTP requests via Node's built-in `fetch`.

**Teardown (in `finally` block — always runs):**
- `DELETE FROM users WHERE username LIKE "test_%"` — CASCADE removes all associated tickets and responses.
- Kills the spawned server process.

**What the test verifies:**

| Step | Assertion |
|---|---|
| Login (3 accounts) | JWT token issued for all three test accounts |
| Ticket creation (Alice) | HTTP 201 and `ticket.id` returned |
| Cross-user GET (Bob → Alice's ticket) | HTTP 403 |
| Customer status PATCH to Closed (Alice) | HTTP 403 |
| Agent reply + In Progress | `status === 'In Progress'` and `responses.length === 1` |
| Agent close | `status === 'Closed'` |
| Customer reopen (first time) | HTTP 200, `status === 'Open'`, `reopened === 1` |
| Agent re-close | `status === 'Closed'` |
| Customer reopen (second time) | HTTP 400 |
| Category filter (Billing) | Test ticket NOT in results |
| Category filter (Technical) | Test ticket IS in results |
| Status filter (Closed) | Test ticket IS in results |

**Result:** All assertions are `throw`-on-fail. Final `console.log('--- ALL INTEGRATION TESTS PASSED SUCCESSFULLY ---')` and `process.exit(0)` are reached only if every assertion passes.

### What Was Not Automated

- UI rendering and visual appearance (no Cypress/Playwright tests).
- CSS badge class mapping — the `In Progress` styling bug is not caught by API tests.
- CORS header validation.
- Rate limiter behaviour under load (manual only).
- `.gitignore` / secret management.
- Pagination or large-volume data behaviour.

### Manual Checks Recommended

1. Run `npm run db:seed` from `backend/` — confirm all table creation and insert steps complete.
2. Start both servers; open `http://localhost:3000` — confirm "Connected to Database" indicator.
3. Log in as `alice` — verify only Alice's ticket is listed (not Bob's or Charlie's).
4. Log in as `agent` — verify all tickets appear; test each filter dimension independently.
5. As `agent`, click a non-Closed ticket, click "Close Ticket" — confirm status changes.
6. Log back in as that ticket's owner — confirm "Reopen Ticket" button appears; click it; confirm it disappears after use.
7. Inspect the `In Progress` badge on Bob's ticket — expect no amber colour (known CSS bug).
8. POST `{ "category": "Hacking" }` to `/api/tickets` — confirm HTTP 400 (validation enforced).
9. PATCH `{ "status": "Banana" }` to `/api/tickets/1/status` as agent — confirm HTTP 400.
10. Confirm no `.gitignore` exists and `.env` is not excluded from the working directory.

---

## 10. Stage 11 Change Summary

The post-Stage-11 change request was the **customer ticket-reopen feature**.

### What Changed

| Component | Change |
|---|---|
| `tickets` table | Added `reopened TINYINT DEFAULT 0` column |
| `PATCH /api/tickets/:id/status` | Added customer branch: validates ownership, requires current status `Closed`, requires `reopened === 0`, updates both `status` and `reopened` atomically |
| `App.jsx` | Added "Reopen Ticket" button in sidebar — conditionally shown only when customer owns a closed ticket with `reopened === 0` |
| `test.js` | Added reopen test: Alice reopens once (assert `reopened === 1`), agent re-closes, Alice attempts second reopen (assert HTTP 400) |

### Mid Review Gaps Still Unresolved in Final Stage

| Gap | Mid Review | Final |
|---|---|---|
| `JWT_SECRET` not in `.env` | ❌ | ❌ Still falls back to hardcoded string |
| CORS wide-open | ❌ | ❌ Still `app.use(cors())` |
| No `.gitignore` | ❌ | ❌ Still absent |
| Edit agent response | ❌ | ❌ Still not implemented |
| `In Progress` CSS badge bug | ❌ | ❌ Still present |
| `DB_PORT` missing from `.env.example` | ❌ | ❌ Still missing |
| `DB_NAME` mismatch in `.env.example` | Not noted | ❌ New finding — says `helpdesk_db`, real DB is `c3p1` |
| No README | ❌ | ❌ Still absent |

### Mid Review Gaps Resolved in Final Stage

| Gap | Evidence |
|---|---|
| Category not validated against allowlist | `allowedCategories` check in `POST /api/tickets` (server.js line 260) |
| Status not validated against allowlist | `allowedStatuses` checks in PATCH and response routes |
| No length validation on title/description | 3–150 and 10–5000 char checks (server.js lines 253–258) |
| No input sanitisation | `sanitizeInput()` applied to all user string inputs |
| No rate limiting | `rateLimiter(20, 60000)` on `/api/login` |
| No security headers | Custom headers middleware (CSP, X-Frame, X-XSS, Referrer-Policy) |
| No automated tests | `test.js` integration suite (269 lines, 12 assertions) |

---

## 11. Stage Drift / Early Work

### Implemented Before Expected Stage (Present Since Initial Build)

| Item | Stage Expected | Where Found |
|---|---|---|
| bcrypt password hashing | Security hardening | `seed.js`, `POST /api/login` |
| JWT authentication | Security / auth stage | `server.js`, `middleware/auth.js` |
| DB transaction (response+status) | Maintainability / robustness | `POST /api/tickets/:id/responses` |
| DB connection pool | Maintainability | `config/db.js` (mysql2/promise pool) |
| Health check endpoint | Observability | `GET /api/health` |
| Auto-logout on 401 | Security / UX polish | `authFetch` wrapper in `App.jsx` |
| Animated status indicator | UI polish | Pulsing dot in header |

None of the early implementations break scope or conflict with later stages — they are additive. They did, however, mean the Mid Review understated the security baseline because these hardening items were treated as "expected later."

---

## 12. Security Risks and Exposed-Secret Check

**The password value from `.env` is not printed in this review.**

| Risk | Severity | Status |
|---|---|---|
| `JWT_SECRET` not in `.env` — falls back to hardcoded `'fallback_secret_key_for_helpdesk_prototype'` visible in `server.js` and `auth.js` | **Critical** | ❌ Unresolved — any reader of source code can forge valid JWTs |
| No `.gitignore` — `.env` (with `DB_PASSWORD`) would be committed to version control | **Critical** | ❌ Unresolved — confirmed no `.gitignore` in project root or `backend/` |
| CORS wide-open (`app.use(cors())`) | **High** | ❌ Unresolved — any origin can issue credentialed API requests |
| `DB_NAME` mismatch in `.env.example` | **Medium** | ❌ New finding — template says `helpdesk_db`, app uses `c3p1` |
| `DB_PORT` missing from `.env.example` | **Low** | ❌ Unresolved |
| `JWT_SECRET` missing from `.env.example` | **Low** | ❌ Unresolved |
| SQL injection | — | ✅ Mitigated — all queries parameterised with `?` |
| XSS via stored content | — | ✅ Partially mitigated — `sanitizeInput()` encodes HTML entities |
| Password storage | — | ✅ Mitigated — bcrypt with `genSalt(10)` |
| Brute-force login | — | ✅ Mitigated — 20 req/min per IP rate limiter |
| Server fingerprinting | — | ✅ Mitigated — `app.disable('x-powered-by')` |

---

## 13. Documentation / Code Mismatches

| Mismatch | Detail |
|---|---|
| `.env.example` says `DB_NAME=helpdesk_db` | Actual database is `c3p1`; `db.js` defaults to `c3p1`; `seed.js` creates `c3p1` — template is wrong |
| `.env.example` missing `DB_PORT` | Used in `db.js`; present in `.env`; absent from template |
| `.env.example` missing `JWT_SECRET` | Used in `server.js` and `auth.js`; absent from template |
| `seed.js` contains full CREATE TABLE DDL | `schema.sql` also contains it — two sources of truth; schema changes must be applied in both places |
| Mid Review issue I-04: "edit-response should be accessible to agents" | Still not implemented; Case Brief wording is ambiguous — never resolved |
| `In Progress` badge CSS | `ticket.status.toLowerCase().replace(' ', '')` produces `"in progress"` (single replace, space not removed); CSS class `.status-badge.progress` expects `"progress"` — never matches |

---

## 14. Known Limitations

1. **JWT_SECRET fallback** — Tokens are signed with a known hardcoded string. Anyone with access to the source can forge valid JWTs.
2. **No `.gitignore`** — `.env` containing `DB_PASSWORD` is not excluded from Git.
3. **CORS wide-open** — Production deployment would expose the API to all origins.
4. **Edit agent response absent** — No endpoint or UI exists for editing posted responses.
5. **`In Progress` badge unstyled** — CSS class mismatch means the badge renders without amber colour.
6. **Monolithic files** — `server.js` (462 lines) and `App.jsx` (687 lines) contain all logic in single files.
7. **No README** — No setup or run instructions; a new developer must read `package.json` scripts.
8. **`DB_NAME` mismatch in `.env.example`** — Template instructs the wrong database name.
9. **No pagination** — Ticket list returns all rows; performance degrades at scale.
10. **User filter is exact-match case-sensitive** — Partial username searches return no results.
11. **Test runner uses shared MySQL instance** — No separate test database; tests run against the same MySQL server as the development environment.
12. **No test framework** — Custom `node test.js` runner provides no test isolation, parallel execution, retry logic, or structured failure output.
13. **`alert()` for user feedback** — Submit success and error messages use `alert()` rather than in-UI styled notifications.
14. **Test cleanup relies on `LIKE "test_%"` pattern** — A real user whose username begins with `test_` would have their data deleted by the test cleanup.

---

## 15. Demo Script

**Prerequisites:** MySQL running; `node_modules` installed in both `backend/` and `frontend/`.

```bash
# Terminal 1
cd backend
npm run db:seed   # reset and seed database
npm run dev       # Express on port 5000

# Terminal 2
cd frontend
npm run dev       # React on port 3000

# Open http://localhost:3000
```

**Step 1 — Customer creates a ticket**
1. Log in as `alice / password`.
2. Dashboard shows only Alice's ticket ("Cannot login to dashboard").
3. Fill Create Support Ticket: Title `"VPN not connecting"`, Category `Technical`, Description `"VPN has been failing for two days."`.
4. Click **Submit Ticket** — new ticket appears in the list with status **Open**.

**Step 2 — Agent responds and updates status**
1. Log out. Log in as `agent / password`.
2. All tickets are visible. Filter by **Status: Open** — only Open tickets show.
3. Click Alice's new ticket. No conversation history yet.
4. Type reply: `"Looking into the VPN issue — please provide your IP address."`, set status dropdown to **In Progress**, click **Send Reply**.
5. Confirm status badge updates to **In Progress** (note: badge may be unstyled — see known bug).

**Step 3 — Agent closes ticket**
1. Still on ticket detail. Click **Close Ticket** in the sidebar.
2. Status changes to **Closed** and the button disappears.

**Step 4 — Customer reopens (once)**
1. Log out. Log in as `alice`.
2. Click the closed ticket. A **Reopen Ticket** button appears in the sidebar.
3. Click **Reopen Ticket** — status returns to **Open**, button disappears.
4. Log in as `agent`. Close the ticket again.
5. Log back in as `alice`. The **Reopen Ticket** button is gone — already used once.

**Step 5 — Demonstrate access control**
1. Logged in as `alice`, open browser devtools → Console.
2. Run: `fetch('/api/tickets/2', { headers: { Authorization: 'Bearer ' + localStorage.getItem('token') } }).then(r => console.log(r.status))`
3. Console shows `403` — Bob's ticket is inaccessible to Alice.

**Step 6 — Automated tests**
```bash
cd backend
npm test
# Expected: --- ALL INTEGRATION TESTS PASSED SUCCESSFULLY ---
```

---

## 16. Suggested Viva Questions

### Architecture

1. Why does the React frontend not have `mysql2` as a dependency? How does it communicate with the database?
2. What is the role of the Vite proxy in `vite.config.js`? What would happen if it were removed during development?
3. Why is `app.use(authMiddleware)` placed *after* the `/api/login` and `/api/health` routes rather than at the top of the file?

### Database

4. Walk through exactly what happens when `npm run db:seed` is run. Why does it `DROP TABLE` before recreating?
5. Why are both `schema.sql` and `seed.js` present? In what scenario would you use each?
6. What does `ON DELETE CASCADE` on the `responses` table accomplish? How does the test cleanup exploit this?

### Security and Role Control

7. A customer sends `PATCH /api/tickets/3/status` with `{ "status": "Closed" }` and a valid JWT. Walk through exactly what the backend does and what HTTP status code is returned.
8. What is the `reopened` column for? What would happen if you removed the `ticket.reopened !== 0` check from the customer reopen path?
9. What is the risk of `JWT_SECRET` not being set in `.env`? What attack does the known fallback string enable?
10. `app.use(cors())` is currently wide-open. What does this allow, and what should it be changed to for a production deployment?

### Validation

11. What does `sanitizeInput()` do? Which inputs are sanitised? Does it prevent SQL injection, and if not, what does?
12. How is an invalid category (e.g. `"Hacking"`) rejected? Is this enforced by the database or by application code?
13. If a user sends `title: "A"` (one character), what happens and which layer catches it?

### Testing

14. How does `test.js` avoid interfering with the production seed data?
15. What does the test do after all tests complete, even if one fails? Why is `finally` used rather than running cleanup at the end of the `try` block?
16. Name one thing the automated tests cannot verify that would require a browser-based testing tool.

### Bugs and Limitations

17. Open Bob's ticket (status `In Progress`). What visual difference do you expect in the status badge compared to an `Open` ticket? Look at `App.jsx` line 379 — why might the styling not appear as expected?
18. What files and code changes would be needed to implement the "edit agent response" feature that is currently absent?
19. The test cleanup uses `DELETE FROM users WHERE username LIKE "test_%"`. What would happen to a real user whose username starts with `test_`?
