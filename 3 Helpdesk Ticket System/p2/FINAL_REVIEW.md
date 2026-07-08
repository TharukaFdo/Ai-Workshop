# Helpdesk Ticket System — Final Evidence-Based Review

**Review date:** 2026-06-07  
**Review stage:** Final — after testing, security hardening, maintainability cleanup, and change request (ticket reopening).  
**Stack:** React 19 (Vite 8) · Express 4 / Node.js · MySQL (mysql2/promise)  
**Roles in scope:** `user`, `agent` (Support Agent)  
**Main entity:** Ticket  
**Review basis:** Direct inspection of all source files, scripts, and chat build history. No assumptions from documentation alone.

---

## 1. Final Feature Summary

The Helpdesk Ticket System is a fully working, database-backed prototype that covers the complete ticket lifecycle from creation to closure and reopening. The system implements two authenticated roles (`user` and `agent`), enforces ownership and role restrictions at the SQL and middleware layers, provides a secondary filtering feature, and ships with an automated integration test suite that exercises and cleans up its own test data.

| Feature | Implemented | Verified end-to-end |
|---|:---:|:---:|
| User login (bcrypt + JWT) | ✅ | ✅ |
| Agent login (bcrypt + JWT) | ✅ | ✅ |
| Ticket creation (user-only) | ✅ | ✅ |
| Ticket list dashboard | ✅ | ✅ |
| Ticket detail view | ✅ | ✅ |
| Agent: add/update response | ✅ | ✅ |
| Agent: status lifecycle (open → inProgress → resolved → closed) | ✅ | ✅ |
| Agent: close ticket with `closedAt` timestamp | ✅ | ✅ |
| User: reopen closed ticket once | ✅ | ✅ |
| Agent: re-close a reopened ticket | ✅ | ✅ |
| Filter by status | ✅ | ✅ |
| Filter by category | ✅ | ✅ |
| Agent filter by submitted user | ✅ | ✅ |
| Users restricted to own tickets (SQL level) | ✅ | ✅ |
| Spoofing prevention (body `submittedUserId` ignored) | ✅ | ✅ |
| Automated backend test suite with cleanup | ✅ | ✅ |

---

## 2. Review Scoring Matrix

Scores are based on direct code inspection and confirmed chat-history test outputs. Testing Evidence scores reflect the presence, quality, and completeness of automated tests plus cleanup evidence.

| Feature / Area | Functionality 0-5 | Data Persistence 0-5 | Backend Security / Role Control 0-5 | Validation / Error Handling 0-5 | Testing Evidence 0-5 | Maintainability 0-5 | UI / Manual Usability 0-5 | Evidence | Notes |
|---|---:|---:|---:|---:|---:|---:|---:|---|---|
| **Project setup and run commands** | 5 | 5 | — | — | 4 | 4 | — | `README.md`; `npm run dev` (backend/frontend); `db:setup`, `db:reset`, `test` scripts in `package.json` | Port in `.env` (5005) still differs from README (5000) and `.env.example` (5000) — minor doc mismatch |
| **Database setup and starter data** | 5 | 5 | — | 4 | 4 | 5 | — | `scripts/dbSetup.js` + `schema.sql`; `db:setup` idempotent; `db:reset --reset` flag; seed seeds `users` + 1 demo ticket | Seed ticket uses category `'Network'`, which is outside the backend allow-list `['General','Technical','Billing','Hardware']` — inconsistency persists |
| **Login workflow** | 5 | 5 | 4 | 5 | 5 | 4 | 5 | `POST /api/auth/login`; bcrypt compare; JWT 24 h; `authRoutes.js`; test: alice 200, agent 200, bad pw 401 | JWT fallback secret `'super_secret_helpdesk_key'` hardcoded in `auth.js` L13 and `authRoutes.js` L28 as fallback — risk if `.env` is absent |
| **Role-based access** | 5 | 5 | 5 | 4 | 5 | 5 | 4 | `middleware/auth.js` `verifyToken` + `requireRole`; DB re-query per request; test: agent blocked from creating, user blocked from responding | No React `PrivateRoute` guard; `/create` reachable unauthenticated until submit |
| **Main create action** | 5 | 5 | 5 | 5 | 5 | 5 | 5 | `POST /api/tickets`; `requireRole('user')`; trim + type check; category allow-list; `submittedUserId` from JWT (never body); test: 201, 400 missing, 400 bad category, 403 agent | Solid; agent-block test confirmed |
| **Main view/list action** | 5 | 5 | 5 | 4 | 5 | 5 | 5 | `GET /api/tickets`; SQL-level user scope; JOIN for `submittedUser` name; test: alice only sees own tickets | No frontend redirect for unauthenticated access |
| **Main update/status/cancel action** | 5 | 5 | 5 | 5 | 5 | 5 | 5 | `PUT /api/tickets/:id/status`; agent full lifecycle; `closedAt` set/cleared; test: agent closes and closedAt populated | Ownership check also enforced before status change for user role |
| **Protected action** | 5 | 5 | 5 | 5 | 5 | 5 | 5 | `requireRole('agent')` on `PUT /:id/response`; user attempt → 403 confirmed in test; agent panel hidden in UI | Both backend and UI guards present — no reliance on UI alone |
| **Secondary feature** | 5 | 5 | 5 | 4 | 5 | 5 | 5 | `GET /api/tickets?status=&category=&submittedUserId=`; parameterised WHERE clauses; test: category filter, status filter verified | User-scope enforced before applying submittedUserId filter in `ticketService.js` |
| **Case-specific: ticket category, status, and submitted user tracking** | 5 | 5 | 5 | 4 | 5 | 5 | 5 | `tickets` table has `category VARCHAR(100)`, `status ENUM('open','inProgress','resolved','closed')`, `submittedUserId INT FK`, `createdAt`, `updatedAt`, `closedAt`; JOIN exposes `submittedUser` name | `category` is `VARCHAR(100)` not ENUM — any value can be inserted directly to DB bypassing Express validation; seed uses `'Network'` |
| **Case-specific: agent response workflow and ticket closure** | 5 | 5 | 5 | 5 | 5 | 5 | 5 | `PUT /:id/response` agent-only; `PUT /:id/status` closes with `closedAt`; test: response 200, close 200, closedAt populated, re-close after reopen 200 | Single response field (overwrites, no history) — acceptable at prototype scope |
| **Case-specific: user visibility limited to own tickets** | 5 | 5 | 5 | 5 | 5 | 5 | 5 | `ticketService.getAll`: `!isAgent` forces `WHERE submittedUserId = ?`; `GET /:id` ownership check returns 403 for wrong user; test: Bob 403 on Alice's ticket | SQL-level enforcement; not UI-only |
| **UI / manual usability** | 4 | — | — | 4 | 3 | 4 | 4 | Dark glassmorphism theme; Outfit font; status badges; loading spinners; error messages; responsive filter bar | `badge-inprogress` CSS class still missing in `index.css` (only `badge-progress` defined) — "In Progress" badge renders unstyled |
| **Security posture** | 4 | — | 4 | 4 | 4 | 4 | — | JWT + bcrypt; DB-backed role re-check; parameterised SQL throughout; `requireRole` middleware; spoofing test present | CORS still wide-open (`app.use(cors())`); JWT fallback secret in source; no Helmet; no rate limiting; `backend/.env` not protected by any `.gitignore` |
| **Testing evidence** | 5 | 5 | 5 | 5 | 5 | 5 | — | `scripts/test.js` (373 lines); 20+ assertions; spawns test server on port 5001; seeds Bob Test user; cleans up `TEST_%` tickets and Bob; test output confirmed passing | No frontend/E2E tests; manual UI checks documented in chat history only |
| **Maintainability** | — | — | — | — | 4 | 5 | — | Routes split into `authRoutes`, `ticketRoutes`, `userRoutes`; services layer (`ticketService`, `userService`); `config.js` centralises `API_BASE_URL`; `server.js` ≤ 39 lines | `App.css` exists but is not imported — dead file; no shared constant for categories/statuses across frontend and backend |

---

## 3. Project Structure and Run Commands

```
p2/
├── Case_Brief.md
├── MID_REVIEW.md
├── README.md
├── schema.sql                          ← manual MySQL import option
├── backend/
│   ├── .env                            ← real secrets (not in git per frontend .gitignore scope)
│   ├── .env.example                    ← template without secrets
│   ├── package.json                    ← npm scripts: start, dev, db:setup, db:reset, test
│   ├── server.js                       ← Express entry point (39 lines)
│   ├── config/
│   │   └── db.js                       ← mysql2/promise pool
│   ├── middleware/
│   │   └── auth.js                     ← verifyToken + requireRole
│   ├── routes/
│   │   ├── authRoutes.js               ← POST /api/auth/login
│   │   ├── ticketRoutes.js             ← ticket CRUD + status + response
│   │   └── userRoutes.js               ← GET /api/users (agent-only)
│   ├── services/
│   │   ├── ticketService.js            ← all ticket SQL queries
│   │   └── userService.js              ← user lookup queries
│   └── scripts/
│       ├── dbSetup.js                  ← idempotent DB + table + seed creator
│       └── test.js                     ← automated integration tests
└── frontend/
    ├── .gitignore                      ← covers node_modules, dist (NOT backend/.env)
    ├── vite.config.js
    ├── package.json
    └── src/
        ├── config.js                   ← API_BASE_URL (centralised)
        ├── App.jsx                     ← routing
        ├── index.css                   ← design tokens + global styles
        ├── App.css                     ← exists but NOT imported (dead file)
        ├── components/
        │   └── Navbar.jsx
        └── pages/
            ├── Login.jsx
            ├── Dashboard.jsx
            ├── CreateTicket.jsx
            └── TicketDetails.jsx
```

### Run Commands

```bash
# Database — run once (or after schema change)
cd backend && npm run db:setup       # create DB + tables + seed
cd backend && npm run db:reset       # drop + recreate + seed (destructive)

# Backend
cd backend && npm install
cd backend && npm run dev            # nodemon server.js on port 5005

# Frontend
cd frontend && npm install
cd frontend && npm run dev           # Vite dev server on http://localhost:5173

# Tests
cd backend && npm test               # automated integration tests
```

---

## 4. Frontend/Backend Separation

**Verdict: Fully separated.**

- The React frontend lives entirely in `frontend/`. It has its own `package.json`, `vite.config.js`, and `.gitignore`.
- The Express backend lives entirely in `backend/`. It has its own `package.json` and `.env`.
- There is no root-level `package.json` (no monorepo orchestration) — the two apps must be started separately.
- The React app communicates with the backend exclusively through `fetch(...)` HTTP calls to `http://localhost:5005/api/...` (or `VITE_API_URL` if set). No MySQL driver, no database credentials, and no `mysql2` package appear anywhere in the frontend directory.
- The backend's `db.js` uses `mysql2/promise` only. No ORM. No connection string masking the five individual credentials.

---

## 5. Database Setup and Table Summary

### Connection method

`backend/config/db.js` creates a `mysql2/promise` connection pool using five environment variables:

| Variable | Configured | Default fallback |
|---|:---:|---|
| `DB_HOST` | ✅ `.env` L2 | `'localhost'` |
| `DB_PORT` | ✅ `.env` L6 | `3306` |
| `DB_USER` | ✅ `.env` L3 | `'root'` |
| `DB_PASSWORD` | ✅ `.env` L4 | *(not printed — blank in this installation)* |
| `DB_NAME` | ✅ `.env` L5 | `'c3p2'` |

All five are read at startup from `process.env`. None appear in any frontend file.

### Tables

| Table | Columns | Notes |
|---|---|---|
| `users` | `id` PK, `name`, `email` UNIQUE, `password` (bcrypt hash), `role` ENUM('user','agent'), `createdAt` | Login/identity table ✅ |
| `tickets` | `id` PK, `title`, `description`, `category VARCHAR(100)`, `submittedUserId` INT FK→users, `status` ENUM('open','inProgress','resolved','closed'), `agentResponse` TEXT, `reopened` INT DEFAULT 0, `createdAt`, `updatedAt`, `closedAt` | Main entity ✅ |

Both tables defined in `schema.sql` (root) and identically in `scripts/dbSetup.js`. Both are in sync.

### Setup and re-seeding

```bash
npm run db:setup   # creates DB if absent, creates tables IF NOT EXISTS, seeds if users table empty
npm run db:reset   # drops tickets + users, then runs setup — full clean state
```

The seed creates two users: `alice@example.com` (role: `user`) and `agent@example.com` (role: `agent`), both with password `password123` (bcrypt hash). A single demo ticket is inserted for Alice.

> **Note:** The seed inserts a ticket with `category = 'Network'`, which is not in the backend's validated allow-list (`General`, `Technical`, `Billing`, `Hardware`). This inconsistency has persisted from the mid-review through to final.

---

## 6. Login and Role/Access Explanation

### How each role logs in

Both roles use the same `POST /api/auth/login` endpoint:

1. Client POSTs `{ email, password }` to `/api/auth/login`.
2. Backend calls `userService.getUserByEmail(email)` — real DB query against `users` table.
3. `bcrypt.compare(password, user.password)` is called. Failure → `401`.
4. On success, a JWT is signed with `{ id, name, email, role }` payload, `expiresIn: '24h'`, using `process.env.JWT_SECRET`.
5. Token and user object (no password) returned to client.
6. React stores token in `localStorage.helpdesk_token` and user in `localStorage.helpdesk_user`.

Demo credentials (both `password123`):
- **User role:** `alice@example.com`
- **Agent role:** `agent@example.com`

### How roles are checked

Every protected route calls `verifyToken` middleware first:

1. Extracts `Authorization: Bearer <token>` header.
2. Calls `jwt.verify(token, process.env.JWT_SECRET)`.
3. **Crucially:** re-queries the DB for the user by `verified.id` via `userService.getUserById`. Attaches the fresh DB record to `req.user`. Token claims for role are not trusted; the database record is authoritative.
4. `requireRole('agent')` checks `req.user.role !== 'agent'` and returns `403` if wrong.

This pattern means a stolen or expired-but-still-signed token for a deleted user is rejected because the DB lookup returns `null`.

---

## 7. Protected Action Explanation

The case-specific protected actions are **add/edit agent response** and **close tickets**.

| Action | Route | Middleware chain | Backend behaviour |
|---|---|---|---|
| Add agent response | `PUT /api/tickets/:id/response` | `verifyToken` → `requireRole('agent')` | Non-agent → `403`. Agent → saves `agentResponse` to DB. |
| Update agent response | Same route (overwrite) | Same | Same — last write wins. |
| Update ticket status | `PUT /api/tickets/:id/status` | `verifyToken` | Agent: any valid status. User: only `open` (reopen), own ticket only, once. |
| Close ticket | Same status route (`status: 'closed'`) | `verifyToken` | User blocked (403) from setting `closed`. Agent allowed; sets `closedAt = now()`. |
| Reopen ticket (change request) | Same status route (`status: 'open'`) | `verifyToken` | User allowed only if: owns ticket, current status is `closed`, `reopened < 1`. |

The UI hides agent controls from users, but the backend enforces independently. A user sending a raw `PUT` request with an agent's token is still blocked by `requireRole`. A user sending a raw `PUT` with their own token to `/response` gets `403` from `requireRole('agent')`.

---

## 8. Validation Summary

### Backend validation (authoritative)

| Rule | Location | Status |
|---|---|---|
| Login: email + password required | `authRoutes.js` L11–13 | ✅ |
| Ticket create: title, description, category required and non-empty | `ticketRoutes.js` L29–32 | ✅ |
| Ticket create: trim + typeof string check | `ticketRoutes.js` L29–31 | ✅ |
| Ticket create: category in allow-list `['General','Technical','Billing','Hardware']` | `ticketRoutes.js` L35–39 | ✅ |
| Ticket create: `submittedUserId` from JWT, not body | `ticketRoutes.js` L46 | ✅ |
| Agent response: non-empty (trim check) | `ticketRoutes.js` L83–85 | ✅ |
| Status update: value in allow-list `['open','inProgress','resolved','closed']` | `ticketRoutes.js` L106–109 | ✅ |
| Status update ownership: user can only update own tickets | `ticketRoutes.js` L120–122 | ✅ |
| Reopen: only from `closed` state | `ticketRoutes.js` L130–132 | ✅ |
| Reopen: only once (`reopened >= 1` → 400) | `ticketRoutes.js` L134–136 | ✅ |
| Single ticket access: user blocked from other users' tickets | `ticketRoutes.js` L67–69 | ✅ |
| 404 for missing ticket ID | `ticketRoutes.js` L62–64, L91, L113–115 | ✅ |
| Title/description minimum length | Not present | ❌ — one-character values pass |
| Category as DB ENUM (full enforcement) | Not present | ❌ — `VARCHAR(100)` allows any value via direct SQL |

### Frontend validation

| Rule | Location | Status |
|---|---|---|
| Email format | `Login.jsx` `type="email"` | ✅ |
| Required fields (HTML5) | All forms | ✅ |
| Disabled submit button if response textarea empty | `TicketDetails.jsx` L332 | ✅ |
| Field length limits (`maxLength`) | Not present | ❌ |
| Expired JWT → auto redirect to login | Not present | ❌ |

---

## 9. Automated and Manual Testing Summary

### Automated test command

```bash
cd backend && npm test
# Alias: npm run test
```

**Test file:** `backend/scripts/test.js` (373 lines, no third-party test framework — uses Node.js built-in `assert`)

**What the test suite does:**

1. **Setup:** Connects directly to the MySQL database; deletes any residual `bob_test@example.com` user and `TEST_%`-prefixed tickets; inserts a fresh Bob Test user.
2. **Spins up the Express server** on port 5001 (separate from the live port 5005) using `child_process.spawn`.
3. **Runs the following assertions** using `fetch`:

| Test group | Assertions |
|---|---|
| Authentication | Alice login 200 + token; Bob login verified; agent login 200; bad password 401 |
| Ticket creation | 201 on valid; 400 on missing fields; 400 on invalid category; 403 when agent creates |
| Role isolation | Alice sees only own tickets; Bob 403 on Alice's ticket; agent 200 on any ticket |
| Filtering | Category filter correct; status filter correct |
| Protected actions | User 403 on response; user 403 on status close; agent 200 on response; agent 200 on close; `closedAt` populated |
| Ticket reopening | User reopens own closed ticket 200; `reopened = 1`, `closedAt = null` after reopen; second reopen 400; agent re-closes 200 |
| Spoofing prevention | Alice submits `submittedUserId = Bob.id`; DB record confirms assigned to Alice's ID |

4. **Cleanup (in `finally` block):** Deletes `bob_test@example.com` user and all `TEST_%` tickets; ends DB connection; kills the test server process.

**Confirmed test output (from chat history, 2026-06-07):**
```
--- All Automated Backend Tests Passed Successfully! ---
```

### What is NOT automated

- No frontend/E2E tests (no Playwright, Cypress, or Selenium).
- No unit tests for individual service functions or middleware in isolation.
- The `inProgress` CSS badge class mismatch (`badge-inprogress` vs `badge-progress`) is not caught by any test.
- UI responsiveness and visual rendering are manual only.
- The following must be verified manually:
  - Dashboard renders correctly in the browser for both roles.
  - Status badge colour for "In Progress" (known to be unstyled — see §13).
  - Logout clears session and redirects.
  - Filter dropdowns respond correctly in the UI.
  - "Reopen Ticket (Once)" button visibility logic in the browser.

---

## 10. Stage 11 Change Summary

**Change request:** *Users can reopen a closed ticket once, and support agents can respond and close the reopened ticket again.*

This was the final change applied to the `p2` workspace. The following were modified:

### Data model

- Added `reopened INT NOT NULL DEFAULT 0` column to the `tickets` table.
- Updated `schema.sql` and `scripts/dbSetup.js` in sync.
- `npm run db:reset` was confirmed to apply the new column.

### Backend

- `ticketService.js`: Added `reopen(id)` method — sets `status = 'open'`, `closedAt = NULL`, `reopened = reopened + 1`.
- `ticketRoutes.js`: `PUT /:id/status` extended to handle user role with three guards: ownership check, `status === 'open'` restriction, current-status-must-be-`closed` check, and `reopened >= 1` cap returning 400.

### Frontend

- `TicketDetails.jsx`: Added conditional `Reopen Ticket (Once)` button — visible only when `!isAgent && ticket.status === 'closed' && (ticket.reopened === undefined || ticket.reopened === 0)`.

### Tests

- `test.js` extended with a dedicated `--- Testing Ticket Reopening ---` section covering: reopen success (200), `reopened = 1` assertion, `closedAt = null` assertion, second reopen blocked (400), agent re-close (200).

### Behaviour preserved

All existing tests continued to pass after the change. The reopening feature was additive; no existing routes or service functions were removed or changed in a breaking way.

---

## 11. Stage Drift and Early Work

The project followed a staged build process. The following items were built ahead of their expected stage, or items that were expected at certain stages were absent.

| Item | Expected stage | Actual | Assessment |
|---|---|---|---|
| bcrypt password hashing | Security hardening | Present from DB-setup stage | ✅ Beneficial early — login needed it |
| JWT authentication | Security hardening | Present from auth stage | ✅ Beneficial early |
| DB-backed role re-check per request (`verifyToken`) | Security hardening | Present from auth stage | ✅ Correct pattern early |
| Parameterised SQL queries | Security hardening | Present throughout | ✅ Correct from the start — no raw concatenation |
| Route splitting into separate files | Maintainability cleanup | Applied in maintainability stage | ✅ Done at correct stage |
| `config.js` for `API_BASE_URL` | Maintainability cleanup | Applied in maintainability stage | ✅ Done at correct stage |
| Automated tests | Testing stage | Applied in testing stage | ✅ Correct stage |
| `reopened` field | Change request (Stage 11) | Applied in change request stage | ✅ Not premature |
| Rate limiting / Helmet | Security hardening | Absent at final | ⚠️ Not implemented — flagged in mid-review, not resolved |
| Frontend `PrivateRoute` guard | Security hardening / UX | Absent at final | ⚠️ Not implemented — flagged in mid-review, not resolved |
| CORS restriction to frontend origin | Security hardening | Absent at final (`cors()` with no options) | ⚠️ Not resolved |
| Input min/max length validation | Validation hardening | Absent at final | ⚠️ Flagged, not resolved |

**No work appears to have been implemented prematurely in a way that caused harm.** The early security patterns (bcrypt, parameterised queries, JWT) are universally correct and posed no conflict with later stages. The items flagged at mid-review that remain unresolved are known limitations, not regressions.

---

## 12. Security Risks and Exposed-Secret Check

### Risk inventory

| Risk | Severity | Status | Evidence |
|---|---|---|---|
| JWT fallback secret hardcoded in source | 🔴 High | Not resolved | `auth.js` L13 and `authRoutes.js` L28 both default to `'super_secret_helpdesk_key'` if `JWT_SECRET` env var is absent. If `.env` is missing at runtime, the server starts with a known signing key. |
| `backend/.env` not covered by `.gitignore` | 🔴 High | Not resolved | Only `frontend/.gitignore` exists. There is no `backend/.gitignore` and no root `.gitignore`. Running `git status` from the project root would show `backend/.env` as untracked and at risk of accidental commit. |
| CORS open to all origins | 🟡 Medium | Not resolved | `server.js` L13: `app.use(cors())` with no `origin` option — any domain can call the API. |
| No rate limiting on login endpoint | 🟡 Medium | Not resolved | `POST /api/auth/login` has no throttle — brute-force is possible. |
| No Helmet for HTTP security headers | 🟡 Medium | Not resolved | No `helmet` package installed or used. |
| Token stored in `localStorage` | 🟡 Medium | By design (prototype) | Documented as acceptable for prototype; noted in mid-review. XSS would expose the token. |
| No expired JWT handling in frontend | 🟡 Medium | Not resolved | A 403 from an expired token surfaces as a raw error message; user is not redirected to login. |
| DB credentials not exposed in React bundle | ✅ Resolved | `config.js` only exposes `API_BASE_URL`; no DB env vars in frontend |
| SQL injection | ✅ Resolved | Parameterised placeholders used in every query in both `ticketService.js` and `userService.js` |
| Body `submittedUserId` spoofing | ✅ Resolved | Ignored; JWT identity used exclusively |
| Role/header spoofing | ✅ Resolved | `req.user` set from DB query result, not from any client-supplied header or body field |

> **Password field:** The `DB_PASSWORD` is configured in `backend/.env`. It is blank in this installation. This review does not print the value. The key concern is that the `.env` file itself is not gitignored at the backend level.

---

## 13. Documentation / Code Mismatches

| Item | Documentation says | Code does | Verdict |
|---|---|---|---|
| Backend port | `README.md` says `5000`; `.env.example` says `5000` | `backend/.env` sets `PORT=5005`; `frontend/src/config.js` defaults to `5005` | ❌ README and `.env.example` are out of date |
| Seed ticket category | Seed file inserts `'Network'` | Allow-list: `['General','Technical','Billing','Hardware']` | ❌ Seed creates data that would fail backend validation |
| `App.css` file | Not documented | Exists but not imported anywhere in the codebase | ⚠️ Dead file — would cause confusion |
| `schema.sql` vs `dbSetup.js` schema | Both define the same DDL | Both are identical for `users` and `tickets` | ✅ In sync |
| `.env.example` DB_NAME | Shows `c3p2` | `backend/.env` uses `c3p2`; code defaults to `c3p2` | ✅ Consistent |
| Test command location | Chat history says run from `backend/`; `package.json` has `"test": "node scripts/test.js"` | Must run `npm test` from `backend/`; no root-level delegation | ⚠️ README does not document the test command |
| `inProgress` CSS badge | Dashboard and TicketDetails use `` `badge-${ticket.status.toLowerCase()}` `` → `badge-inprogress` | `index.css` defines `.badge-progress`, not `.badge-inprogress` | ❌ Badge renders unstyled for "In Progress" tickets — known issue from mid-review, not resolved |

---

## 14. Known Limitations

1. **`badge-inprogress` CSS mismatch:** "In Progress" status badge has no colour — renders as plain text. The template produces `badge-inprogress` but only `.badge-progress` is defined in `index.css`. This was flagged at mid-review and remains unresolved.

2. **JWT fallback secret in source:** If `JWT_SECRET` is not in `.env`, both `auth.js` and `authRoutes.js` fall back to the publicly known string `'super_secret_helpdesk_key'`.

3. **`backend/.env` unprotected from version control:** No `backend/.gitignore` or root `.gitignore` exists. The actual database password and JWT secret could be committed.

4. **Seed category inconsistency:** The demo ticket seeded by `dbSetup.js` uses `category = 'Network'`, which is not in the backend's validated category list.

5. **README port mismatch:** README and `.env.example` both document port `5000`; the actual `.env` uses `5005`.

6. **No frontend route guard:** Unauthenticated users can navigate directly to `/create` or `/ticket/:id`. The backend correctly rejects their API calls with `401`/`403`, but there is no `PrivateRoute` wrapper in React to redirect them cleanly to `/login`.

7. **Expired JWT not handled in UI:** When the 24-hour token expires, the backend returns `403`. The frontend shows the raw error string rather than clearing localStorage and redirecting to the login page.

8. **No field length validation:** One-character titles and descriptions pass both frontend and backend validation. The database `TEXT` column has no explicit upper limit enforced at the application layer.

9. **CORS open to all origins:** `app.use(cors())` without an `origin` option allows any domain.

10. **Single response field (no history):** Each `PUT /response` overwrites the previous agent response. Acceptable for prototype scope.

11. **No `App.css` import:** The file exists but is never imported. This is a dead file that could cause confusion.

12. **No frontend/E2E automated tests:** Coverage is backend integration tests only. Visual, routing, and UI interaction issues are not caught automatically.

---

## 15. Demo Script

The following script can be followed to demonstrate all major features in approximately 5–8 minutes.

### Prerequisites
- MySQL running locally; `npm run db:setup` has been run in `backend/`.
- `npm run dev` running in `backend/` and `npm run dev` running in `frontend/`.
- Browser open to `http://localhost:5173`.

### Step 1 — User creates a ticket
1. Navigate to `http://localhost:5173`. The navbar shows a **Login** button; the dashboard prompts to log in.
2. Click **Login** and enter: Email `alice@example.com`, Password `password123`. Click **Sign In**.
3. Dashboard loads showing Alice's tickets. Observe: "Submit Ticket" button visible (user role).
4. Click **Submit Ticket**. Fill in: Title `VPN Not Working`, Category `Technical`, Description `Unable to connect to VPN since today morning.` Click **Submit Ticket**.
5. Return to dashboard. New ticket appears with status `Open`.

### Step 2 — Agent views and responds
6. Click the **logout** icon (top-right). Log in as `agent@example.com` / `password123`.
7. Dashboard now shows **all** tickets including Alice's. Observe the "Submitted By" column and agent filter dropdown.
8. Click **View Details** on the VPN ticket. Observe the right-side "Agent Actions" panel.
9. From the status dropdown, select **In Progress**. The status badge updates immediately.
10. In the "Write Response" textarea, type: `We have identified the VPN server issue and are working on a fix.` Click **Send Reply**.
11. The response appears in the "Agent Responses" card on the left.

### Step 3 — Agent closes the ticket
12. Click the **Close Ticket** button. The status changes to `Closed` and a "Closed on [date]" message appears.

### Step 4 — User reopens (change request)
13. Logout. Log in as Alice (`alice@example.com` / `password123`).
14. Click **View Details** on the VPN ticket. Observe: ticket is `Closed`, agent response visible (read-only), **Reopen Ticket (Once)** button present.
15. Click **Reopen Ticket (Once)**. Status returns to `Open`. The button disappears.

### Step 5 — Security check (optional, manual API call)
16. Using the browser devtools Network tab or Postman, attempt `PUT /api/tickets/{id}/response` with Alice's token. Observe `403 Forbidden`.
17. Attempt to view another user's ticket ID directly in the URL as Alice. Observe `403 Forbidden`.

### Step 6 — Filtering
18. Log in as agent. On the dashboard, select status `Open` from the filter dropdown. List narrows.
19. Change category filter to `Technical`. List narrows further.
20. Use the user dropdown to select Alice. Only Alice's tickets appear.

---

## 16. Suggested Viva Questions

### Project overview
1. Walk me through the full lifecycle of a support ticket from creation to closure — which files are involved at each step?
2. Why did you use two separate `package.json` files instead of a monorepo root?

### Authentication and security
3. What happens in `verifyToken` when a token is received? Why does it re-query the database instead of trusting the JWT payload directly?
4. If I remove the `JWT_SECRET` line from your `.env` file and restart the server, what happens? Is this a security problem?
5. How does your backend prevent a user from submitting a ticket that claims to belong to a different user?
6. Your `backend/.env` contains real credentials. What would you do before pushing this project to a public repository?

### Role access and protected actions
7. What is `requireRole` and where does it sit in the middleware chain? Show me an example route where it is applied.
8. I am logged in as a user and I send `PUT /api/tickets/1/response` with my own JWT. Walk me through exactly what the backend does and what response I get.
9. Your UI hides the "Agent Actions" panel from users. If I use the browser devtools to make the panel visible, can I submit the form successfully?

### Database
10. What SQL query does `ticketService.getAll` build for a regular user? How is the user's identity injected into that query safely?
11. What does `closedAt` store, and how is it set to `NULL` when a ticket is reopened?
12. What is the purpose of the `reopened` column and what value does it reach at most? Where is the cap enforced — in the database or the application?

### Testing
13. Walk me through what `npm test` does from start to finish, including setup and cleanup.
14. How does the test suite avoid polluting the production dataset?
15. Your test suite spawns a server on port 5001. What happens if that port is already in use?

### Known issues
16. I notice "In Progress" tickets in your dashboard look different from other status badges. Why?
17. What would happen if someone navigated directly to `/create` in the browser without being logged in?
18. Your `seed` inserts a ticket with category `'Network'`, but your backend allow-list does not include `'Network'`. How does that happen, and is it a problem?

### Architecture
19. Before the maintainability refactoring stage, all routes were in a single `server.js`. What changed, and why is the new structure better?
20. If you were to take this prototype to production, what are the three most important changes you would make?

---

*End of Final Review — 2026-06-07*
