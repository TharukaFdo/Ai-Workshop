# Final Review — Helpdesk Ticket System

**Review date:** 2026-06-07
**Stage reviewed:** Final — after testing, security hardening, maintainability cleanup, and change request (ticket reopen)
**Reviewer scope:** Full static code inspection of every source file; no source code modified
**Stack:** React 19 (Vite) · Express 4 · mysql2 (promise pool) · Node.js · plain HMAC token auth · vanilla CSS (glassmorphic dark theme)

---

## 1. Final Feature Summary

The Helpdesk Ticket System is a complete, running full-stack web prototype that lets **Users** submit support tickets and **Support Agents** respond to and resolve them. Every functional requirement from the Case Brief is implemented end-to-end.

| Feature | Status | Evidence |
|---|:---:|---|
| User login (database-backed) | YES | POST /api/auth/login to app_users table |
| Support Agent login | YES | Same endpoint; role read from DB |
| Ticket creation (User only) | YES | POST /api/tickets; checkRole(['User']) |
| Ticket list — User sees own tickets only | YES | GET /api/tickets; server forces submittedUser = req.user.username |
| Ticket list — Agent sees all tickets | YES | Same route; no forced filter for agents |
| Agent adds/edits agentResponse | YES | PATCH /api/tickets/:id; checkRole(['Support agent']) |
| Status update (open->inProgress->resolved->closed) | YES | updateStatus() in ticketService; MySQL ENUM enforced |
| closedAt timestamp auto-set on closure | YES | ticketService.updateStatus() sets closedAt = new Date() |
| Filter by category | YES | Both roles; parameterised query |
| Filter by status | YES | Both roles; parameterised query |
| Filter by submitted user (Agent only) | YES | Agent can pass ?submittedUser=; User role override prevents access to others' tickets |
| Ticket detail modal | YES | Agent: editable form; User: read-only view |
| Change request: User can reopen closed ticket once | YES | ticketService.reopen(); reopened counter; PATCH ownership + reopen guard |
| Repeatable DB setup | YES | npm run db:setup -> dbSetup.js -> schema.sql |
| Automated tests | YES | npm run test -> backend/test.js (Node assert, 8 check groups) |
| Test data cleanup | YES | DELETE FROM tickets WHERE title LIKE 'TEST - %' at end of test |
| Persistent session via localStorage | YES | Token + user object stored on login; cleared on logout |

---

## 2. Review Scoring Matrix

| Feature / Area | Functionality 0-5 | Data Persistence 0-5 | Backend Security / Role Control 0-5 | Validation / Error Handling 0-5 | Testing Evidence 0-5 | Maintainability 0-5 | UI / Manual Usability 0-5 | Evidence | Notes |
|---|---:|---:|---:|---:|---:|---:|---:|---|---|
| Project setup and run commands | 5 | 5 | - | - | 3 | 4 | - | Root package.json wires npm run dev, db:setup, install:all, test; README.md documents each step | No CI config; concurrently used for dev-time parallel start |
| Database setup and starter data | 5 | 5 | - | 4 | 4 | 4 | - | schema.sql + dbSetup.js; DROP/CREATE pattern makes it repeatable; 4 seed users + 3 seed tickets covering open/inProgress/closed | JWT_SECRET missing from both .env and .env.example |
| Login workflow | 4 | 5 | 4 | 4 | 3 | 3 | 5 | POST /api/auth/login; SHA-256 hash compare against app_users; HMAC-signed token returned; stored in localStorage; login error shown in UI | Not a standard JWT; no expiry; SHA-256 not bcrypt |
| Role-based access | 5 | - | 5 | 4 | 3 | 4 | 5 | checkRole() middleware does live DB lookup per request; role never trusted from client; 401/403 returned correctly | JWT_SECRET falls back to hardcoded string; no token expiry |
| Main create action | 5 | 5 | 5 | 4 | 4 | 4 | 5 | POST /api/tickets; checkRole(['User']); submittedUser cross-checked against req.user.username; title/description/category validated; status defaults to open; test creates ticket and asserts ID + status | No max-length guard on title/description in route handler |
| Main view/list action | 5 | 5 | 5 | 4 | 4 | 4 | 5 | GET /api/tickets; User forced to own tickets server-side; parameterised queries; filter by category/status/user; loading/empty states in UI; test verifies filter and retrieval | Agent user filter is free-text, not a validated dropdown |
| Main update/status/cancel action | 5 | 5 | 5 | 4 | 4 | 4 | 5 | PATCH /api/tickets/:id; checkRole(['Support agent']); valid status enum enforced; closedAt set when closed; test verifies status transition and timestamp | No guard preventing agent from re-opening an already-open ticket |
| Protected action | 5 | 5 | 5 | 4 | 4 | 4 | 5 | agentResponse write inside agent-only PATCH; UI shows response field only for agents; users see read-only view; test inserts agentResponse and asserts it is saved | Empty string agentResponse accepted; can overwrite prior response |
| Secondary feature | 5 | - | 5 | 4 | 3 | 4 | 5 | Filters by category, status, submittedUser wired in both frontend and backend; Users' submittedUser filter forcibly overridden server-side | Agent username filter not validated against known users |
| Case-specific: ticket category, status, and submitted user tracking | 5 | 5 | - | 4 | 4 | 4 | 5 | category (VALID_CATEGORIES enum check), status (MySQL ENUM + VALID_STATUSES), submittedUser (FK to app_users.username) all stored; createdAt, updatedAt, closedAt timestamps present | FK is on username string, not on id; cascade on rename is fragile |
| Case-specific: agent response workflow and ticket closure | 5 | 5 | 5 | 4 | 4 | 4 | 5 | Agent can add/edit agentResponse and set status; closedAt auto-set on closed; modal form shows agent controls; test asserts agentResponse saved and closedAt set | No business rule requiring agentResponse before closure |
| Case-specific: user visibility limited to own tickets | 5 | - | 5 | - | 4 | - | 5 | Backend forces submittedUser = req.user.username for User role in GET /api/tickets; spoofed query param ignored; PATCH /:id ownership check returns 403 for non-owned tickets | 403 path not exercised in automated test (manual only) |
| UI / manual usability | 5 | - | - | - | 3 | - | 5 | Dark glassmorphic theme; responsive two-column layout for User, single-column for Agent; modal detail view; role badge; loading spinner; empty state; error/success messages; demo account selector | App.jsx is a single 614-line monolithic component |
| Security posture | 3 | - | 3 | 3 | 2 | 3 | - | DB credentials stay in backend .env, never bundled into Vite build; parameterised queries prevent SQL injection; JWT_SECRET missing from .env (hardcoded fallback always used); CORS open; no Helmet; no bcrypt; no token expiry | Open CORS, missing Helmet, SHA-256 passwords, no request size limit |
| Testing evidence | 4 | 4 | 3 | 4 | 4 | 4 | - | backend/test.js; 8 assertion groups; DB connectivity, user lookup, ticket CRUD, status lifecycle with closedAt, agentResponse save, reopen flow, invalid status rejection, test data cleanup | No framework (Jest/Vitest/Supertest); no HTTP-layer tests; 403 path not tested automatically |
| Maintainability | - | - | - | - | 3 | 3 | - | Separate config/, middleware/, routes/, services/ layers; App.jsx 614 lines (monolithic); no JSDoc on business logic; JWT_SECRET duplicated in two source files; getAllUsers() is dead code | nodemon in devDependencies only; .env.example present |


---

## 3. Project Structure and Run Commands

`
p3/                                  <- Monorepo root
+-- package.json                     <- Root scripts: dev, test, db:setup, install:all
+-- README.md
+-- Case_Brief.md
+-- PROJECT_CONTEXT.md
+-- REQUIREMENTS.md
+-- MID_REVIEW.md
+-- FINAL_REVIEW.md
+-- docs/
|   +-- TEST_PLAN.md
+-- backend/
|   +-- .env                         <- DB credentials (not committed to VCS ideally)
|   +-- .env.example                 <- Template (committed)
|   +-- package.json                 <- start, dev (nodemon), db:setup, test
|   +-- index.js                     <- Express entry point (port 5000)
|   +-- test.js                      <- Automated integration tests (Node assert)
|   +-- config/
|   |   +-- db.js                    <- mysql2 connection pool
|   |   +-- dbSetup.js               <- Runs schema.sql to init/reset DB
|   |   +-- schema.sql               <- DDL + seed data
|   +-- middleware/
|   |   +-- authMiddleware.js        <- checkRole() HMAC token verification + DB lookup
|   +-- routes/
|   |   +-- authRoutes.js            <- POST /api/auth/login
|   |   +-- ticketRoutes.js          <- GET/POST/PATCH /api/tickets
|   +-- services/
|       +-- ticketService.js         <- All DB queries (parameterised)
+-- frontend/
    +-- package.json                 <- React 19 + Vite
    +-- vite.config.js
    +-- index.html
    +-- src/
        +-- main.jsx
        +-- App.jsx                  <- All UI logic (614 lines, single component)
        +-- config.js                <- API_BASE_URL (reads VITE_API_URL env var)
        +-- index.css                <- Full design system (496 lines, glassmorphic dark)
        +-- App.css                  <- Minimal (imported to avoid lint warnings)
`

### Run Commands

| Command | Effect |
|---|---|
| npm install && npm run install:all | Install root, backend, and frontend dependencies |
| npm run db:setup | Create DB c3p3, run schema.sql, seed demo data |
| npm run dev | Start backend (port 5000) + frontend (port 5173) concurrently |
| npm run test | Run backend/test.js automated integration tests |
| npm run start:backend | Start backend only (production-style, node index.js) |
| npm run start:frontend | Start frontend only (npm run dev) |

---

## 4. Frontend/Backend Separation Check

**React and Express are fully separated into two independent sub-projects.**

| Check | Result | Evidence |
|---|:---:|---|
| Frontend and backend in separate directories | YES | frontend/ (Vite/React, port 5173) and backend/ (Express, port 5000) |
| Frontend has no MySQL client dependency | YES | frontend/package.json contains only react, react-dom, and Vite dev tools — no mysql2 |
| Frontend calls Express routes via HTTP only | YES | frontend/src/config.js: API_BASE_URL = 'http://localhost:5000/api'; all fetch calls use this constant |
| DB credentials never reach the browser | YES | process.env.DB_* loaded only in backend/config/db.js via dotenv; Vite only bundles VITE_ prefixed env vars |
| CORS enabled on backend | YES | app.use(cors()) in backend/index.js; allows the Vite dev server origin |

---

## 5. Database Setup and Table Summary

### Connection Method

The backend uses **mysql2/promise** with a connection pool (mysql.createPool()).

All five environment variables are configured in backend/config/db.js:

| Variable | Present in db.js | Present in .env.example | Present in .env |
|---|:---:|:---:|:---:|
| DB_HOST | YES (fallback: localhost) | YES | YES |
| DB_PORT | YES (fallback: 3306) | YES | YES |
| DB_USER | YES (fallback: root) | YES | YES |
| DB_PASSWORD | YES (fallback: empty string) | YES (value omitted from this review) | YES (value not printed here) |
| DB_NAME | YES (fallback: c3p3) | YES | YES |

> **Note:** JWT_SECRET is **absent** from both .env and .env.example. The hardcoded fallback 'super_secret_workshop_key' is always used at runtime.

### Tables

| Table | Columns | Notes |
|---|---|---|
| app_users | id (PK auto-increment), username (UNIQUE), password (plain text - legacy), password_hash (SHA-256 hex), role ENUM('User', 'Support agent') | Login/user table. Seed: alice (User), bob (User), agent_carter (Agent), agent_smith (Agent) |
| tickets | id (PK), title, description, category, submittedUser (FK->app_users.username), status ENUM('open','inProgress','resolved','closed'), agentResponse (nullable TEXT), reopened (INT default 0), createdAt, updatedAt, closedAt (nullable TIMESTAMP) | Main entity. Seed: 3 tickets covering open/inProgress/closed states |

A **users/login table exists** (app_users). It is queried on every authenticated request inside checkRole() — role is never trusted from the client.

### Recreating Tables and Seed Data

Run from the project root at any time: npm run db:setup

This executes node backend/config/dbSetup.js, which:
1. Connects to MySQL without selecting a database.
2. Runs CREATE DATABASE IF NOT EXISTS c3p3.
3. Reads backend/config/schema.sql, splits on semicolons, and executes each statement.
4. schema.sql starts with DROP TABLE IF EXISTS tickets; DROP TABLE IF EXISTS app_users — making it a full, idempotent reset.
5. Inserts 4 seed users and 3 seed tickets.

WARNING: Running db:setup on a live database destroys all existing data. Acceptable for a prototype; not suitable for production.

---

## 6. Login and Role/Access Explanation

### Login Flow

1. User submits POST /api/auth/login with { username, password }.
2. Backend calls ticketService.getUserByUsername(username) — queries app_users directly.
3. Password is verified by SHA-256 hashing the input and comparing against password_hash. A fallback also accepts the plaintext password column (legacy compatibility — the plaintext column is an undocumented artefact).
4. On success, a token is generated: username.HMAC_SHA256(username, JWT_SECRET) — this is NOT a standard JWT; no payload claims, no expiry, not base64-encoded.
5. Token and user object { username, role } are returned to the client and stored in localStorage.

### Role Check on Every Protected Request

Every protected route is wrapped by checkRole(allowedRoles) middleware:

1. Reads Authorization: Bearer <token> header.
2. Splits token into [username, signature] on '.'.
3. Recomputes HMAC_SHA256(username) and verifies the signature — tampered tokens are rejected (401).
4. Queries app_users for the username — deleted users cannot authenticate (401).
5. Checks allowedRoles.includes(dbUser.role) — mismatched role returns 403.
6. Attaches req.user = { username, role } (from DB, not from token) for downstream use.

### Role Access Table

| Endpoint | User | Support Agent | Enforcement |
|---|:---:|:---:|---|
| POST /api/auth/login | Open | Open | None needed |
| GET /api/tickets | Own only | All tickets | checkRole(['User','Support agent']) + server-side filter |
| POST /api/tickets | Allowed | 403 | checkRole(['User']) |
| PATCH /api/tickets/:id | Reopen own closed ticket only | Full update | checkRole(['User','Support agent']) + ownership + business rule checks |

---

## 7. Protected Action Explanation

**Protected action: Add/edit agent response (agentResponse) and update/close ticket status**

Both actions sit inside PATCH /api/tickets/:id, guarded by checkRole(['User', 'Support agent']).

**For Support Agents:**
- Can update status to any value in VALID_STATUSES (open, inProgress, resolved, closed).
- Can write any text to agentResponse.
- closedAt is automatically set when status === 'closed'; null otherwise.
- No ownership check — agents can update any ticket.

**For Users (reopen only path):**
- If agentResponse is present in the body -> 403 Forbidden.
- If status is anything other than 'open' -> 403 Forbidden.
- If the ticket is not in 'closed' state -> 400 Bad Request.
- If ticket.reopened >= 1 -> 400 Bad Request.
- If ticket.submittedUser !== req.user.username -> 403 Forbidden.
- If all checks pass -> ticketService.reopen(id) sets status='open', closedAt=NULL, increments reopened.

The UI shows Reopen Ticket (Once) only when ticket.status === 'closed' && ticket.reopened === 0, consistent with backend guards. The agent edit form is completely hidden for Users; Users see a read-only view.

---

## 8. Validation Summary

### Field-Level Validation

| Field | Frontend Check | Backend Check | HTTP Code | Notes |
|---|:---:|:---:|:---:|---|
| title — required, non-empty | HTML required + JS .trim() | !title or !title.trim() | 400 | No max-length |
| description — required, non-empty | HTML required + JS .trim() | !description or !description.trim() | 400 | No max-length |
| category — valid enum | select restricted | VALID_CATEGORIES.includes(category) | 400 | Consistent; 5 values |
| submittedUser — must match session | Sent as currentUser.username | submittedUser !== req.user.username | 400 | Prevents spoofed ownership |
| status — valid enum | select restricted | VALID_STATUSES.includes(status) | 400 | Consistent; 4 values |
| agentResponse — optional | Textarea | Optional, no constraint | - | Empty string accepted; overwrites prior response |
| username/password on login | Both required | Both checked for presence | 400 | Generic error (no user enumeration) |
| Token presence | - | Missing/malformed -> 401 | 401 | Signature verified |
| Role authorization | - | Wrong role -> 403 | 403 | DB-backed; not token-trusted |

### Missing / Weak Validations
- No maxLength on title (VARCHAR 255) or description/agentResponse (TEXT columns) -> MySQL error on over-length, not a clean 400.
- No XSS sanitisation — React auto-escapes rendered content so currently safe, but stored data is raw.
- No rate limiting on POST /api/auth/login.
- No validation requiring agentResponse to be non-empty before an agent can set status = 'closed'.


---

## 9. Automated and Manual Testing Summary

### Automated Tests

**Command:** npm run test (from project root) or node test.js (from backend/)
**Framework:** Node.js built-in assert module — no Jest, Vitest, Mocha, or Supertest installed.
**Layer tested:** Service layer + direct DB queries (not HTTP routes).

| # | Test | Assertion | Status |
|---|---|---|---|
| 1 | Database connectivity | SELECT 1+1 AS sum returns 2 | PASS |
| 2 | Auth user lookup | getUserByUsername('alice') returns user with role = 'User' | PASS |
| 3 | Ticket creation | Created ticket has valid id, status = 'open' | PASS |
| 4 | Ticket filtering | Filter by category=Hardware + submittedUser=alice finds the created ticket | PASS |
| 5 | Status update + closedAt | updateStatus(id, 'closed') -> status = 'closed', closedAt not null | PASS |
| 6 | Agent response save | addResponse(id, 'TEST ANSWER') -> agentResponse = 'TEST ANSWER' | PASS |
| 7 | Ticket reopen | reopen(id) -> status = 'open', reopened = 1, closedAt = null | PASS |
| 8 | Invalid status rejection | updateStatus(id, 'waiting'/'unknown'/'pending') -> error thrown | PASS |
| - | Test data cleanup | DELETE FROM tickets WHERE title LIKE 'TEST - %' | PASS |

**What is automated:** DB connection, user lookup, full ticket CRUD lifecycle, closedAt timestamp, agentResponse persistence, reopen counter, invalid status rejection, test data cleanup.

**What is NOT automated (manual only):**
- HTTP route layer: no Supertest; 403 enforcement paths are not tested via actual HTTP requests.
- Login endpoint (POST /api/auth/login) is not called in the test script.
- User ownership enforcement (PATCH by a non-owner -> 403) is not exercised by the test.
- All frontend/UI behaviour is manual only.

### Manual Verification Steps (from docs/TEST_PLAN.md)

1. Launch with npm run dev -> open http://localhost:5173.
2. Sign in as alice (password: password123) -> verify only alice's 2 seed tickets appear.
3. Sign in as bob -> verify only bob's 1 ticket appears; Alice's are hidden.
4. Sign in as agent_carter -> verify all 3 seed tickets appear.
5. Select the open VPN ticket -> set status to inProgress, add a response -> save; verify changes.
6. Set status to closed -> verify closedAt is recorded (visible in modal).
7. Sign in as alice; click the closed ticket -> verify Reopen Ticket (Once) button appears; click it; verify status returns to open.
8. Click the ticket again -> button should be gone (already reopened once).
9. Submit a ticket with empty title -> verify 400 error message appears in UI.
10. Run npm run db:setup twice -> verify it completes successfully and seed data is reset.

---

## 10. Stage 11 Change Summary

The final change request (the "reopen" feature) added the following after the mid-project review:

### What Changed

**backend/config/schema.sql**
- Added eopened INT NOT NULL DEFAULT 0 column to the tickets table.

**backend/services/ticketService.js**
- Added reopen(id) method: UPDATE tickets SET status = 'open', closedAt = NULL, reopened = reopened + 1 WHERE id = ?

**backend/routes/ticketRoutes.js**
- Extended PATCH /api/tickets/:id to handle the User reopen path.
- Guard chain: (1) ownership check -> 403, (2) agentResponse write attempt -> 403, (3) status-must-be-open -> 403, (4) ticket-must-be-closed -> 400, (5) reopened-limit -> 400, (6) call reopen().

**backend/test.js**
- Added the reopen test block (assertion group 7).
- Asserts status = 'open', reopened = 1, closedAt = null after reopen.

**frontend/src/App.jsx**
- Added Reopen Ticket (Once) button in the User read-only modal view.
- Button visible only when ticket.status === 'closed' && ticket.reopened === 0.
- Sends PATCH /api/tickets/:id with { status: 'open' } and Bearer token on click.

---

## 11. Stage Drift and Early Work

| Item | Assessment |
|---|---|
| closedAt timestamp | Appropriate — required by AC-3.2 |
| updatedAt ON UPDATE CURRENT_TIMESTAMP | Appropriate — standard DB practice |
| .env.example template | Appropriate — good practice, not over-reach |
| getAllUsers() in ticketService.js (never called) | Dead code — written for a planned agent username dropdown that was never completed; minor stage drift |
| dist/ folder in frontend/ | Build artefact present (npm run build was run); no functional impact; should be in .gitignore |
| password plaintext column in app_users | Legacy artefact — both password (plain) and password_hash (SHA-256) exist; the plaintext column is undocumented and was never cleaned up |
| Demo account selector on login screen | Acceptable — workshop convenience; not a production feature |

No significant future-stage over-implementation was detected. No email, file upload, admin panel, audit log, or multi-agent assignment was built.

---

## 12. Security Risks and Exposed-Secret Check

### Secret Risk Inventory

| Secret / Credential | Location | Risk Level | Notes |
|---|---|---|---|
| Database password | backend/.env | Medium | Present in .env. No root-level .gitignore found — .env may be committed to version control. Only frontend/.gitignore exists and it does not cover backend/.env. |
| JWT_SECRET | authRoutes.js L6, authMiddleware.js L3 | High | Missing from .env and .env.example. Hardcoded fallback 'super_secret_workshop_key' is always active. Anyone knowing the fallback can forge valid tokens for any username. |
| Plaintext password column | app_users table / schema.sql | High | Plaintext passwords stored in DB and visible in seed SQL. password_hash is SHA-256 (not bcrypt), which is fast to brute-force. |

Passwords are NOT printed in this review. The concern is the storage mechanism, not the values.

### Other Security Issues

| Issue | Risk | Notes |
|---|---|---|
| CORS fully open (cors() with no origin) | Medium | Any origin can call the API |
| No helmet middleware | Medium | Missing X-Content-Type-Options, X-Frame-Options, etc. |
| Hand-rolled HMAC token — no expiry | Medium | Stolen token is valid forever; no server-side session invalidation |
| No rate limiting on login | Medium | Brute-force of passwords is unthrottled |
| No request body size limit | Low | Express default is 100 KB; no express.json({ limit }) set |
| No maxLength on title/description | Low | Over-length input causes MySQL error, not a clean 400 |
| dist/ potentially committed | Low | Build artefacts should be in .gitignore |

---

## 13. Documentation and Code Mismatches

| Document Claim | Code Reality | Gap |
|---|---|---|
| REQUIREMENTS.md s4: "dropdown/switcher in UI; x-user-role and x-user-name sent in headers" | Implementation uses Authorization: Bearer token + DB lookup for role; no custom x-user-role header | Mismatch — requirements describe a simpler role-switcher; implementation is more secure (real auth) but deviates from the spec text |
| PROJECT_CONTEXT.md s3: field named creator_name | Schema uses submittedUser | Naming mismatch — functional equivalent, different field name |
| PROJECT_CONTEXT.md s3: status values Open/In Progress/Closed (3 values, sentence case) | Schema and code use open/inProgress/resolved/closed (4 values, lowercase/camelCase) | Extended scope — resolved added as intermediate state; casing differs |
| REQUIREMENTS.md role matrix: "Update Ticket Status — User: No — Enforced" | Code allows Users to PATCH status to 'open' (reopen) | Post-change deviation — reopen feature extends the User role; TEST_PLAN.md TC-08/09 documents this, so the test plan is consistent with the code |
| Both password and password_hash columns exist in schema | authRoutes.js checks all four combinations of both columns | The plaintext password column is an undocumented artefact not mentioned in any design doc |
| MID_REVIEW.md s9 issue C1: "JWT_SECRET not set in .env" | Still not set after the final stage | The critical issue identified in the mid-review was not resolved |

---

## 14. Known Limitations

1. No standard JWT — token is username.hmac_hex; no expiry, no payload claims, not compatible with standard JWT libraries.
2. SHA-256 password hashing — not bcrypt/argon2; fast to brute-force.
3. JWT_SECRET hardcoded fallback — always active; a known secret allows token forgery.
4. No server-side session invalidation — logout only clears localStorage; token remains valid until server restart.
5. Single agentResponse field — only one response per ticket; no conversation thread or comment history.
6. No agentResponse required before closure — agents can close tickets without writing a response.
7. No max-length validation — title and description exceed VARCHAR/TEXT limits -> MySQL error, not 400.
8. CORS fully open — any origin can call the API.
9. No Helmet — missing standard HTTP security headers.
10. No rate limiting — login endpoint is brute-forceable.
11. getAllUsers() dead code — defined in ticketService.js but never called.
12. password plaintext column — stored in app_users and visible in schema.sql; undocumented artefact.
13. App.jsx monolithic — 614 lines in a single component; not component-split; harder to test UI sections individually.
14. No root .gitignore — backend/.env may be committed to version control.
15. Full DROP/recreate on db:setup — live data is destroyed on every setup run.
16. No migration system — schema changes require a full reset.
17. FK on username string — submittedUser FK references app_users.username, not id; fragile if usernames become editable.
18. Agent user filter is free-text — non-existent usernames silently return empty results; no validation against known users.


---

## 15. Demo Script

**Duration:** ~8 minutes
**Prerequisites:** npm run dev running; browser open at http://localhost:5173

### Scene 1 — User Login and Ticket Submission (2 min)
1. Show the login screen. Point out the demo account selector.
2. Click alice (User) -> auto-fills username. Type password123 -> click Sign In.
3. Show the two-column layout: Submit Support Ticket left, My Tickets right.
4. Point out that only Alice's 2 seed tickets are visible.
5. Fill in: Title = Email sync broken, Category = Software, Description = Outlook is not syncing since the update.
6. Click Submit Ticket. Show the success message and the new ticket in the list.

### Scene 2 — User Ticket Isolation (1 min)
7. Sign out. Log in as bob (User).
8. Show that only Bob's 1 ticket is visible — Alice's are hidden.
9. Explain that the backend forces submittedUser = bob regardless of any query parameter the client sends.

### Scene 3 — Agent Workflow (2.5 min)
10. Sign out. Log in as agent_carter (Support agent).
11. Show the single-column layout with All Support Tickets — all 4 tickets visible.
12. Use the Status filter -> select open -> show only open tickets.
13. Use the Category filter -> select Software -> show only software tickets.
14. Click the Email sync broken ticket -> modal opens.
15. Set status to inProgress. Add response: We are investigating the Outlook sync issue. -> click Save & Update.
16. Close modal. Show the ticket now shows the agent response indicator (speech bubble icon).
17. Click the ticket again -> set status to closed -> click Save & Update.
18. Click the ticket again -> show closedAt timestamp recorded in the modal.

### Scene 4 — Ticket Reopen (1 min)
19. Sign out. Log in as alice.
20. Click the now-closed Email sync broken ticket.
21. Show the Reopen Ticket (Once) button. Click it.
22. Show the ticket returns to open status.
23. Click the ticket again -> show the button is gone (already reopened once).

### Scene 5 — Security Enforcement (1 min)
24. Open browser DevTools -> Console. Paste a fetch call to PATCH /api/tickets/1 with { status: 'closed' } using Alice's token. Show 403 Forbidden is returned.
25. Mention that the backend enforced this independently of the UI.

### Scene 6 — Automated Tests (0.5 min)
26. In terminal, run npm run test. Show all 8 check groups pass and test data is cleaned up.

---

## 16. Suggested Viva Questions

### Architecture and Separation
1. Why are the React frontend and Express backend in two separate directories? What would go wrong if the frontend directly connected to MySQL?
2. How does frontend/src/config.js determine which backend URL to call? What would you change to point it at a production server?
3. What does cors() with no options do, and what is the security risk? How would you restrict it to specific origins?

### Database and Persistence
4. Walk through exactly what happens when npm run db:setup is run. What is the risk of running it on a database that already has live tickets?
5. Why does schema.sql use DROP TABLE IF EXISTS before creating tables? Name one alternative approach that would not destroy existing data.
6. Why is the foreign key on submittedUser referencing app_users.username (a string) instead of app_users.id? What could go wrong if a username is ever renamed?

### Authentication and Roles
7. Describe exactly how a token is created at login and how it is verified on a protected request. Why is it not a standard JWT?
8. The checkRole() middleware queries the database on every single protected request. What is the benefit of this design compared to reading the role from the token? What is the cost?
9. Where is JWT_SECRET defined? What happens at runtime if the environment variable is not set? What is the security impact?
10. Why is SHA-256 not a good choice for password hashing? What would you use instead, and why?

### Ticket Workflow and Role Control
11. A User sends a direct HTTP PATCH request to /api/tickets/1 with { "status": "closed" }. Walk through every check the backend performs and explain the exact HTTP response returned.
12. How does the system ensure a User can only see their own tickets? Show where in the code this is enforced. Can a User bypass this by adding ?submittedUser=bob to the URL?
13. Explain the reopen feature. What are the guard conditions checked before a reopen is allowed? Which checks exist only on the backend, and which also exist in the UI?

### Validation and Error Handling
14. If a User submits a ticket with title = "" (empty string), what happens? Trace the error from the frontend to the database layer.
15. What happens if an agent sends { "status": "waiting" } in a PATCH request? Where exactly is "waiting" rejected?
16. Can an agent save an empty agentResponse string that overwrites a previous response? Is this a bug or a design choice? How would you fix it?

### Testing and Quality
17. What does npm run test actually test? Does it test the HTTP routes? If not, what is missing and how would you add route-level testing?
18. How is test data cleaned up? Could the cleanup fail in a way that leaves dirty data behind? When would that happen?
19. App.jsx is 614 lines in a single component. What are the maintenance risks of this design? How would you split it into smaller components?
20. The getAllUsers() function exists in ticketService.js but is never called. How would you detect this kind of dead code automatically?
