# Helpdesk Ticket System — Mid-Project Review

**Review Date:** 2026-06-07  
**Review Stage:** After secondary feature (filter) stage — before testing, security hardening, and maintainability cleanup  
**Reviewer:** Antigravity AI Review Agent  
**Project Path:** `backend/` + `frontend/` (React + Vite / Express + MySQL)

---

## 1. Mid-Review Summary

The project is a React (Vite) + Express + MySQL helpdesk prototype. Both tiers are present and separated. The backend exposes a REST API and the frontend communicates through Vite's dev proxy — no direct MySQL access from the browser. All five required DB environment variables are loaded from `.env`. A `seed.js` script provides a repeatable, destructive-reset + seed flow. Login is fully database-backed using bcrypt + JWT. Role-based access (customer / agent) is enforced server-side on every protected endpoint. All primary workflow endpoints are implemented: ticket creation, listing (with ownership filter), single-ticket detail + responses, agent response posting with optional status update, and direct status PATCH. Filtering by category, status, and submitted user is functional in both backend and frontend. The "Close Ticket" action is agent-only on both backend and UI. Customers cannot view other users' tickets or change ticket status — enforced at the API layer.

**Key gaps before the next stages:**
- No automated tests of any kind.
- JWT secret has no `.env` entry — falls back to a hardcoded string if `JWT_SECRET` is missing from `.env`.
- `CORS` is wide-open (`app.use(cors())`); no origin restriction.
- Validation is basic (presence checks only); no length limits, enum validation, or sanitisation.
- Customers can post a response to any ticket at all — the backend only blocks status changes for customers, but the ownership check for posting a response only fires on the `responses` route, and customers are not blocked from accessing another customer's ticket detail if they know the ID via the URL (detail-fetch route does enforce this, but the check compares `ticket.user_id !== req.user.id`).
- `status-badge.inprogress` CSS class is broken: `ticket.status.toLowerCase().replace(' ', '')` produces `"in progress"` → `"in progress"` (single replace, not global), not `"inprogress"`. The `In Progress` badge will not match the `.progress` CSS class.
- No `.gitignore` — `.env` with credentials is not excluded from version control.
- Response edit is not implemented (which is in-scope as a "protected action" — agents cannot edit a previous response — no edit endpoint exists, which is correct from a restriction standpoint, but the requirement says "edit agent responses" is a protected action, implying it should be accessible to agents; currently it is not implemented at all).
- `DB_PORT` is missing from `.env.example`.
- No README with run instructions.

---

## 2. Review Scoring Matrix

| Feature / Area | Functionality 0-5 | Data Persistence 0-5 | Backend Security / Role Control 0-5 | Validation / Error Handling 0-5 | Testing Evidence 0-5 | Maintainability 0-5 | UI / Manual Usability 0-5 | Evidence | Notes |
|---|---:|---:|---:|---:|---:|---:|---:|---|---|
| Project setup and run commands | 4 | 5 | 4 | 3 | 0 | 3 | 4 | `package.json` scripts: `start`, `dev`, `db:seed`; Vite on 3000, Express on 5000 | No README; no `.gitignore`; `.env.example` missing `DB_PORT`; JWT_SECRET not in `.env` |
| Database setup and starter data | 5 | 5 | 4 | 4 | 0 | 4 | 4 | `schema.sql` + `seed.js`; repeatable destructive reset; bcrypt-hashed passwords | `seed.js` duplicates schema — two schema sources to keep in sync |
| Login workflow | 5 | 5 | 4 | 4 | 0 | 4 | 4 | DB-backed; bcrypt compare; JWT 24 h; 401 on bad credentials; demo hints shown | JWT_SECRET falls back to hardcoded string; broad CORS |
| Role-based access | 4 | 5 | 4 | 3 | 0 | 4 | 4 | `authMiddleware` global after `/api/login`; role checked on ticket list, detail, response, status routes | No dedicated role check middleware (`requireAgent`); role logic is inline per route |
| Main create action | 5 | 5 | 4 | 3 | 0 | 4 | 4 | `POST /api/tickets` creates ticket linked to `req.user.id`; returns full row with `created_by` | Title/description presence checked; no max-length; category not validated against allowed values |
| Main view/list action | 5 | 5 | 5 | 3 | 0 | 4 | 4 | `GET /api/tickets` enforces customer ownership filter; agent sees all; returns `created_by` join | No pagination; category/status values accepted as-is from query string |
| Main update/status/cancel action | 5 | 5 | 5 | 3 | 0 | 4 | 4 | `PATCH /api/tickets/:id/status` — agent-only enforced; `affectedRows` check for 404 | Status value not validated against ENUM; any string can be written to DB |
| Protected action | 3 | 4 | 4 | 3 | 0 | 3 | 3 | Agent-only Close Ticket button in UI + `PATCH` is agent-only in backend; response editing is absent | Edit-response endpoint not implemented; "protected action" partially met (close yes, edit no) |
| Secondary feature | 5 | 5 | 4 | 3 | 0 | 4 | 4 | Category, status, and user filters wired in both UI and backend; SQL uses parameterised queries | User filter is an exact username match (case-sensitive); no partial/search match |
| Case-specific: ticket category, status, and submitted user tracking | 5 | 5 | 5 | 3 | 0 | 4 | 4 | `category`, `status` columns in `tickets`; `user_id` FK to `users`; `created_by` join in all list queries | Category stored as free-text VARCHAR; no DB constraint restricts to allowed values |
| Case-specific: agent response workflow and ticket closure | 4 | 5 | 4 | 3 | 0 | 4 | 4 | `POST /api/tickets/:id/responses` uses transaction; status updated atomically with response; Close uses `PATCH` | Response editing not implemented; no confirmation step before closure |
| Case-specific: user visibility limited to own tickets | 5 | 5 | 5 | 4 | 0 | 4 | 4 | List route appends `AND t.user_id = ?` for customers; detail route returns 403 for cross-user access | Consistent enforcement on both list and detail endpoints |
| UI / manual usability | 4 | — | — | 3 | 0 | 3 | 4 | Dark theme; status badges; conversation bubbles; role badge; logout; backend status indicator | `In Progress` badge CSS broken (class mismatch); no loading spinners on ticket detail fetch; alert() used for success/error feedback |
| Security posture | 2 | — | 3 | 2 | 0 | 2 | — | JWT auth on all routes; bcrypt; parameterised queries | No JWT_SECRET in `.env`; wide-open CORS; no rate limiting; no input sanitisation; no `.gitignore`; `.env` not excluded |
| Testing evidence | 0 | 0 | 0 | 0 | 0 | 0 | 0 | No test files, no test runner, no test scripts | No test framework installed; no mocks; no test hooks |
| Maintainability | 3 | — | — | — | 0 | 3 | — | Single-file server.js; single-file App.jsx; inline comments on routes | No route separation; no service layer; schema duplicated in seed.js; no `.gitignore`; no README |

---

## 3. Current Feature Status

| Feature | Status | Location |
|---|---|---|
| Ticket creation (customer) | ✅ Implemented | `POST /api/tickets`, `App.jsx` lines 184–209 |
| Ticket list (customer — own only) | ✅ Implemented | `GET /api/tickets` lines 75–115 `server.js` |
| Ticket list (agent — all) | ✅ Implemented | `GET /api/tickets` with no ownership filter for agents |
| Ticket detail + responses | ✅ Implemented | `GET /api/tickets/:id` lines 118–169 |
| Agent adds response + updates status | ✅ Implemented | `POST /api/tickets/:id/responses` lines 200–286 |
| Customer adds response to own ticket | ✅ Implemented | Same route, ownership enforced |
| Status update (agent-only) | ✅ Implemented | `PATCH /api/tickets/:id/status` lines 288–320 |
| Close ticket (agent-only) | ✅ Implemented | Direct "Close Ticket" button → `PATCH` + backend check |
| Filter by category | ✅ Implemented | Query param + SQL WHERE clause |
| Filter by status | ✅ Implemented | Query param + SQL WHERE clause |
| Filter by submitted user (agent only) | ✅ Implemented | Query param + SQL, UI hidden for customers |
| Edit agent response | ❌ Not implemented | No PATCH/PUT endpoint for `responses`; no UI control |
| User cannot view other tickets | ✅ Implemented | List and detail both enforce ownership |
| User cannot close ticket | ✅ Implemented | UI hides button; backend rejects status change from customers |

---

## 4. Database and Persistence Status

| Item | Finding |
|---|---|
| `users` table | ✅ Exists — `id`, `username`, `password` (bcrypt), `role` ENUM |
| `tickets` table | ✅ Exists — `id`, `title`, `description`, `category`, `user_id` FK, `status` ENUM, `created_at`, `updated_at` |
| `responses` table | ✅ Exists — `id`, `ticket_id` FK, `user_id` FK, `message`, `created_at` |
| Repeatable setup | ✅ `node seed.js` (or `npm run db:seed`) drops and recreates all tables then inserts test data |
| `schema.sql` | ✅ Present at project root; includes `IF NOT EXISTS` guards |
| Schema duplication | ⚠️ `seed.js` contains its own `CREATE TABLE` statements — two sources of truth |
| DB credentials exposure | ✅ Backend reads from `process.env`; frontend has no DB package or connection |
| `DB_PORT` variable | ⚠️ Present in `.env` and `db.js` but missing from `.env.example` |
| Seed data | ✅ 1 agent, 3 customers, 3 tickets across different statuses, 3 responses |

---

## 5. Login and Role/Access Status

| Item | Finding |
|---|---|
| Login type | ✅ Database-backed — queries `users` table, bcrypt compare |
| Token mechanism | ✅ JWT signed with secret, 24 h expiry |
| Role in token | ✅ `{ id, username, role }` payload |
| JWT_SECRET | ⚠️ Not in `.env` or `.env.example`; falls back to hardcoded `'fallback_secret_key_for_helpdesk_prototype'` |
| `authMiddleware` placement | ✅ Applied globally via `app.use(authMiddleware)` after `/api/login` and `/api/health` |
| Customer sees only own tickets | ✅ Backend enforces `AND t.user_id = ?` |
| Agent sees all tickets | ✅ No ownership filter for agent role |
| Agent-only routes | ✅ Status update checked per route; close button checked per route |
| Session persistence | ✅ Token and user stored in `localStorage`; restored on page load |
| Logout | ✅ Clears `localStorage`, resets state |
| Auto-logout on 401 | ✅ `authFetch` wrapper handles 401 globally |

---

## 6. Protected Action Status

**Scope:** "Add or edit agent responses" and "close tickets" are designated protected actions — restricted to agents.

| Protected Action | Backend Enforced | UI Enforced | Notes |
|---|---|---|---|
| Agent adds response | ✅ `authMiddleware` required; no explicit agent-only check, but customer ownership check blocks cross-user posting | ✅ Response form shown to all on own tickets | Any authenticated user can post a response to their own ticket — this is by design |
| Agent updates status via response | ✅ `status` body param only applied if `req.user.role === 'agent'` | ✅ Status dropdown only shown to agents | Correct |
| Agent closes ticket | ✅ `PATCH /api/tickets/:id/status` returns 403 for non-agents | ✅ "Close Ticket" button hidden for customers | Correct |
| Edit agent response | ❌ No `PATCH /responses/:id` endpoint | ❌ No UI control | Not implemented; requirement implies agents should be able to edit their own responses |
| Customer cannot change status | ✅ Backend returns 403 if customer sends `status` on response route | ✅ Status dropdown hidden in UI | Correct |
| Customer cannot view other tickets | ✅ List scoped by `user_id`; detail returns 403 | ✅ No link or path to other tickets in UI | Correct |

---

## 7. Validation Status

| Validation Point | Status | Detail |
|---|---|---|
| Login: required fields | ✅ | Returns 400 if username or password missing |
| Ticket create: required fields | ✅ | Returns 400 if title, description, or category missing |
| Ticket create: category ENUM | ❌ | Category accepted as any string; not validated against allowed list |
| Ticket create: field length | ❌ | No `maxLength` on title or description |
| Response: required message | ✅ | Returns 400 if message missing |
| Status update: required value | ✅ | Returns 400 if status missing |
| Status update: ENUM validation | ❌ | Any string passed as status will be written to DB (MySQL ENUM silently truncates in non-strict mode) |
| SQL injection | ✅ | All queries use parameterised placeholders (`?`) |
| Frontend required fields | ✅ | HTML `required` on form inputs; JS guard on empty `replyMessage` |
| Frontend error display | ⚠️ | Login errors shown in styled div; ticket submit uses `alert()`; response errors use `console.error` + `alert()` |

---

## 8. Stage Drift / Early Implementation

The following were implemented ahead of the expected stage sequence:

| Item | Stage Expected | Found |
|---|---|---|
| bcrypt password hashing | Security hardening | ✅ In `seed.js` and `POST /api/login` |
| JWT authentication | Security / auth stage | ✅ Fully implemented with `authMiddleware` |
| Transaction for response + status update | Maintainability / robustness | ✅ `beginTransaction` / `commit` / `rollback` in responses route |
| DB connection pool (not single connection) | Maintainability | ✅ `mysql2/promise` pool in `config/db.js` |
| Health check endpoint | Observability / ops | ✅ `GET /api/health` |
| Auto-logout on 401 | Security / UX polish | ✅ In `authFetch` wrapper |
| Animated status indicator | UI polish | ✅ Pulsing dot in header |

No evidence of testing infrastructure, rate limiting, input sanitisation, or CORS restriction being added early — those remain for later stages.

---

## 9. Issues Found Before Stage 8

### Critical

| ID | Severity | Area | Description |
|---|---|---|---|
| I-01 | Critical | Security | `JWT_SECRET` not defined in `.env` or `.env.example`; uses hardcoded fallback `'fallback_secret_key_for_helpdesk_prototype'` — tokens are predictable if the fallback is known |
| I-02 | Critical | Security | No `.gitignore` — `.env` containing `DB_PASSWORD` would be committed to version control |

### High

| ID | Severity | Area | Description |
|---|---|---|---|
| I-03 | High | Security | `app.use(cors())` allows all origins; should restrict to `http://localhost:3000` at minimum during development |
| I-04 | High | Functionality | Edit agent response is not implemented — neither API endpoint (`PATCH /api/responses/:id`) nor UI control exists |
| I-05 | High | UI Bug | `In Progress` status badge is broken: `ticket.status.toLowerCase().replace(' ', '')` produces `"in progress"`, not `"inprogress"`. CSS class `.status-badge.progress` requires the string `"progress"`, not `"in progress"` — the badge renders with no colour styling |

### Medium

| ID | Severity | Area | Description |
|---|---|---|---|
| I-06 | Medium | Validation | `category` is a free-text VARCHAR — no backend validation against the four allowed values (`Technical`, `Billing`, `Hardware`, `General`) |
| I-07 | Medium | Validation | `status` is accepted as any string on `PATCH /api/tickets/:id/status` — should be validated against the ENUM list |
| I-08 | Medium | Validation | No maximum length enforced on `title` (255 in DB) or `description` (TEXT) at the API layer |
| I-09 | Medium | Maintainability | `schema.sql` and `seed.js` contain duplicate `CREATE TABLE` DDL — changes to one must be mirrored in the other |
| I-10 | Medium | Maintainability | `server.js` is monolithic (325 lines, all routes inline) — no route files or controller separation |
| I-11 | Medium | Maintainability | `App.jsx` is monolithic (675 lines, all views in one component) — no component separation |
| I-12 | Medium | Setup | `DB_PORT` is missing from `.env.example` despite being used in `db.js` and present in `.env` |

### Low

| ID | Severity | Area | Description |
|---|---|---|---|
| I-13 | Low | UX | `alert()` is used for ticket submit success and response errors — not styled to match the UI |
| I-14 | Low | UX | No loading state shown when fetching ticket details (`fetchTicketDetails`) — list loads instantly but detail view has no spinner |
| I-15 | Low | UX | Filter by submitted user is exact case-sensitive match — partial username searches do not work |
| I-16 | Low | Setup | No `README.md` with setup or run instructions |
| I-17 | Low | Security | Response route does not verify the ticket exists before the `beginTransaction` call when ticket not found — rollback is called but connection is already obtained (minor resource concern) |

---

## 10. Manual Checks Recommended Next

Before proceeding to testing, security hardening, and maintainability cleanup, verify the following manually:

1. **Run `npm run db:seed`** from `backend/` and confirm the terminal shows all table creation and seed insert steps without errors.
2. **Start backend** (`npm run dev` in `backend/`) and **frontend** (`npm run dev` in `frontend/`) — confirm both start without errors and the browser shows `Connected to Database` in the header indicator.
3. **Login as `alice` / `password`** — confirm only Alice's ticket is visible (not Bob's or Charlie's).
4. **Login as `agent` / `password`** — confirm all three tickets are visible; confirm category, status, and user filters each narrow results correctly.
5. **Attempt cross-user ticket access:** While logged in as `alice`, manually navigate to `/api/tickets/2` (Bob's ticket) — confirm the API returns 403.
6. **Attempt status change as customer:** While logged in as `alice`, open her ticket and confirm the status dropdown is hidden; send a raw `PATCH /api/tickets/1/status` with `{ "status": "Closed" }` and the alice JWT — confirm 403 is returned.
7. **Verify Close Ticket button:** Log in as `agent`, open a non-Closed ticket, click "Close Ticket" — confirm status changes to `Closed` and the button disappears.
8. **Submit a response as agent with a status change** in one action — confirm ticket status updates atomically.
9. **Check `In Progress` badge rendering** — open Bob's ticket (status `In Progress`) and inspect whether the badge has the amber/yellow colour or renders as plain text (expected: broken — no colour).
10. **Attempt to POST a ticket with an invalid category** (e.g. `"category": "Hacking"`) via a direct API call — confirm it is accepted (gap I-06).
11. **Attempt to PATCH status with an invalid value** (e.g. `"status": "Banana"`) — confirm it is accepted (gap I-07).
12. **Confirm `.env` is not in version control** (expected: no `.gitignore`, so it would be included — gap I-02).

---

## 11. Pass/Fail Table

| Check | Result | Notes |
|---|---|---|
| App appears runnable | ✅ Pass | Both tiers have `node_modules`, valid `package.json`, and start scripts |
| React and Express are separated | ✅ Pass | `frontend/` (Vite + React) and `backend/` (Express) are distinct processes |
| React calls Express routes only (no direct MySQL) | ✅ Pass | Frontend uses `fetch('/api/...')` via Vite proxy; no `mysql2` dependency in frontend |
| Backend uses DB_HOST, DB_PORT, DB_USER, DB_PASSWORD, DB_NAME | ✅ Pass | All five variables read in `config/db.js` via `process.env` |
| No DB secrets exposed in React | ✅ Pass | `.env` is backend-only; Vite does not expose it unless `VITE_` prefix is used |
| Needed database tables exist (`users`, `tickets`, `responses`) | ✅ Pass | All three tables defined in `schema.sql` and `seed.js` |
| A users/login table exists | ✅ Pass | `users` table with `username`, `password` (bcrypt), `role` |
| Repeatable database setup or seed command | ✅ Pass | `npm run db:seed` — destructive reset + insert |
| Login is database-backed | ✅ Pass | Queries `users`, bcrypt.compare, issues JWT |
| Role restrictions enforced in backend | ✅ Pass | Role checked per route in `server.js`; not only in UI |
| Add/edit agent responses and close tickets protected | ⚠️ Partial | Close protected ✅; edit response not implemented ❌ |
| Users limited to own tickets | ✅ Pass | Enforced on both list and detail endpoints |
| Ticket creation, response, status update, and closure workflow | ✅ Pass | All stages implemented end-to-end |
| Filter by category, submitted user, or status | ✅ Pass | All three filter dimensions functional |
| Validation present | ⚠️ Partial | Presence checks only; no ENUM, length, or sanitisation validation |
| No future-stage early implementation that breaks scope | ✅ Pass | bcrypt and JWT implemented early but do not interfere with scope |
| No automated tests | — | As expected at this stage; test readiness score is 0/5 |
| Critical security gaps addressed | ❌ Fail | JWT_SECRET missing; wide-open CORS; no `.gitignore` |
| Maintainability acceptable for next stage | ⚠️ Marginal | Monolithic files acceptable at prototype stage but will need refactoring before production |
