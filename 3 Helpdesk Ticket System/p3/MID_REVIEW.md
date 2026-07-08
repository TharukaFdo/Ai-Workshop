# Mid-Project Review — Helpdesk Ticket System

**Review date:** 2026-06-07  
**Stage reviewed:** After secondary feature (ticket filtering) — before testing, security hardening, and maintainability cleanup  
**Reviewer scope:** Static code review; no tests created, no source code modified, no packages installed  
**Stack:** React 19 (Vite) · Express 4 · MySQL 2 · plain HMAC token auth

---

## 1. Mid-Review Summary

The project is structurally sound and, given a running MySQL instance, appears launchable with `npm run db:setup && npm run dev`.  
The core helpdesk workflow — ticket creation, agent response, status update, and closure — is fully implemented end-to-end.  
The secondary filtering feature (category, status, submitted user) is also complete.  
Backend role enforcement is real and database-backed, not UI-only.  
The main gaps at this stage are: no JWT library (the token scheme is hand-rolled HMAC and has a known weakness), no input sanitisation against XSS, no rate limiting, no test framework installed, and a minor UI bug in the status badge mapping for `inProgress`.

---

## 2. Review Scoring Matrix

| Feature / Area | Functionality 0–5 | Data Persistence 0–5 | Backend Security / Role Control 0–5 | Validation / Error Handling 0–5 | Testing Evidence 0–5 | Maintainability 0–5 | UI / Manual Usability 0–5 | Evidence | Notes |
|---|---:|---:|---:|---:|---:|---:|---:|---|---|
| **Project setup and run commands** | 5 | 5 | — | — | 0 | 4 | — | `package.json` root scripts; `npm run dev`, `db:setup`, `install:all` all wired | No CI config; no test runner script |
| **Database setup and starter data** | 5 | 5 | — | 4 | 0 | 4 | — | `schema.sql` + `dbSetup.js`; seed users and tickets included; DROP/CREATE pattern makes it repeatable | `.env.example` present; password blank in example is a minor concern |
| **Login workflow** | 4 | 5 | 4 | 4 | 0 | 3 | 4 | `POST /api/auth/login`; SHA-256 hash compare against `app_users`; HMAC-signed token returned; stored in `localStorage` | Not a standard JWT; no expiry on token; SHA-256 passwords are not bcrypt |
| **Role-based access** | 5 | — | 5 | 4 | 0 | 4 | 4 | `checkRole()` middleware does DB lookup every request; role not trusted from client; 401/403 returned correctly | `JWT_SECRET` falls back to hardcoded string if env var missing |
| **Main create action** | 5 | 5 | 5 | 4 | 0 | 4 | 4 | `POST /api/tickets` restricted to `User` role; `submittedUser` cross-checked against `req.user.username`; title/description/category validated; status defaults to `open` | No max-length guard on `title`/`description` in the route handler |
| **Main view/list action** | 5 | 5 | 5 | 4 | 0 | 4 | 4 | `GET /api/tickets` enforces `submittedUser` filter for Users; agents get all; parameterised queries used; loading/empty states in UI | Agent user-filter is a free-text input, not a dropdown of known users |
| **Main update/status/cancel action** | 5 | 5 | 5 | 4 | 0 | 4 | 4 | `PATCH /api/tickets/:id` restricted to Support Agent; valid status enum enforced; `closedAt` set when status becomes `closed` | No guard against updating an already-closed ticket back to `open` |
| **Protected action** | 5 | 5 | 5 | 4 | 0 | 4 | 4 | `agentResponse` write is inside the same agent-only `PATCH` route; UI shows response field only for agents; users see read-only view | No backend check that an empty string `agentResponse` is explicitly rejected |
| **Secondary feature** | 5 | — | 5 | 4 | 0 | 4 | 4 | Filters by `category`, `status`, `submittedUser` wired in both frontend and backend; Users' `submittedUser` filter is forcibly overridden server-side | Agent username filter is a free-text input with no debounce; not a usability blocker |
| **Case-specific: ticket category, status, and submitted user tracking** | 5 | 5 | — | 4 | 0 | 4 | 4 | `category` (enum-validated), `status` (enum), `submittedUser` (FK to `app_users`) all stored; `createdAt`, `updatedAt`, `closedAt` timestamps present | `submittedUser` stores username string, not FK by `id`; cascade on username update is handled, but rename-cascade is a fragile pattern |
| **Case-specific: agent response workflow and ticket closure** | 5 | 5 | 5 | 4 | 0 | 4 | 4 | Agent can add/edit `agentResponse` and set `status`; `closedAt` auto-set on `closed`; modal form in UI shows agent controls only | No validation requiring an `agentResponse` before the agent can set `closed`; ticket can be closed with an empty response |
| **Case-specific: user visibility limited to own tickets** | 5 | — | 5 | — | 0 | — | 4 | Backend forces `submittedUser = req.user.username` for User role; client also sends the filter, but server ignores/overrides it | If a User calls the API with a spoofed `submittedUser` query param, the server still applies the correct username — confirmed in `ticketRoutes.js` L17–18 |
| **UI / manual usability** | 4 | — | — | — | 0 | — | 4 | Dark glassmorphic theme, responsive two-column layout, modal detail view, role badge, loading spinner, empty state, error/success messages | Status badge CSS class is `.badge-inprogress` but `ticket.status` value is `inProgress` (camelCase); `badge-${ticket.status.toLowerCase()}` → `badge-inprogress` ✓ actually matches correctly; demo account selector on login screen is helpful |
| **Security posture** | 2 | — | 3 | 2 | 0 | 3 | — | DB credentials stay in backend `.env`, never bundled into Vite build; parameterised queries prevent SQL injection; CORS is open (`cors()` with no origin list); no Helmet; no rate limiting; no bcrypt; no token expiry | Open CORS, missing Helmet, no request size limits, SHA-256 passwords — all expected issues for pre-hardening stage |
| **Testing evidence** | 0 | 0 | 0 | 0 | 0 | 0 | — | No test files found anywhere in the project source; no Jest/Vitest/Supertest installed | `REQUIREMENTS.md` §7 documents the full verification checklist; that spec exists but no code tests do |
| **Maintainability** | — | — | — | — | 0 | 3 | — | Code is well-structured: separate `config/`, `middleware/`, `routes/`, `services/`; single-file frontend (`App.jsx` 580 lines) is starting to grow; no component split yet; no JSDoc or inline comments on business logic | `JWT_SECRET` duplicated between `authRoutes.js` and `authMiddleware.js`; magic string `'super_secret_workshop_key'` in two files |

---

## 3. Current Feature Status

| Feature | Implemented | Notes |
|---|:---:|---|
| Ticket creation (User only) | ✅ | Role-enforced on backend |
| Ticket list — user sees own tickets only | ✅ | Server-side forced filter |
| Ticket list — agent sees all tickets | ✅ | Full list, filterable |
| Agent adds / edits response | ✅ | `PATCH /api/tickets/:id` |
| Status update (open → inProgress → resolved → closed) | ✅ | Enum validated backend |
| `closedAt` timestamp on closure | ✅ | Set in `ticketService.updateStatus` |
| Filter by category | ✅ | Both roles |
| Filter by status | ✅ | Both roles |
| Filter by submitted user | ✅ | Agent only (server-enforced) |
| Ticket detail modal | ✅ | Read-only for User, editable for Agent |
| Persistent session via localStorage | ✅ | Token + user object stored |
| Repeatable DB setup command | ✅ | `npm run db:setup` |

---

## 4. Database and Persistence Status

**Tables present in `schema.sql`:**

| Table | Columns of interest | Notes |
|---|---|---|
| `app_users` | `id`, `username` (UNIQUE), `password_hash`, `role` ENUM | Seed: 2 Users (alice, bob), 2 Agents (agent_carter, agent_smith) |
| `tickets` | `id`, `title`, `description`, `category`, `submittedUser` (FK → `app_users.username`), `status` ENUM, `agentResponse`, `createdAt`, `updatedAt`, `closedAt` | Seed: 3 tickets covering open/inProgress/closed states |

**DB setup:** `node config/dbSetup.js` parses `schema.sql` via semicolon-split and runs each statement; safe for the current schema.

**Gaps:**
- The FK is on `username` (a string), not on `id`. An `ON UPDATE CASCADE` is present, but renaming a user would cascade silently. A FK on `id` with a `submittedUsername` stored separately is safer for production.
- No migration system (e.g. Flyway, Knex migrations). The setup script is a full DROP/recreate, so any live data is lost on re-run. Acceptable for prototype; note for future stages.

---

## 5. Login and Role/Access Status

**Login mechanism:** Database-backed (not mock-only, not role-selector-only).

| Check | Result |
|---|---|
| Login calls `app_users` in MySQL | ✅ via `ticketService.getUserByUsername` |
| Password comparison | SHA-256 hash compare (not bcrypt — expected gap pre-hardening) |
| Token type | Hand-rolled `username.hmac_signature` (not a standard JWT; no expiry, no payload claims) |
| Role source on protected requests | DB lookup inside `checkRole` — role is **not** read from the token payload |
| `JWT_SECRET` env fallback | Falls back to `'super_secret_workshop_key'` if `JWT_SECRET` not in `.env` — the current `.env` does **not** set `JWT_SECRET`, so the fallback is always used |
| CORS | Wide open — `cors()` with no `origin` option |

**Role access enforcement:**

| Endpoint | User | Agent | Enforcement location |
|---|---|---|---|
| `POST /api/auth/login` | Open | Open | — |
| `GET /api/tickets` | Own only | All | `checkRole` + server-side filter |
| `POST /api/tickets` | ✅ allowed | ❌ 403 | `checkRole(['User'])` |
| `PATCH /api/tickets/:id` | ❌ 403 | ✅ allowed | `checkRole(['Support agent'])` |

---

## 6. Protected Action Status

**Protected actions:** Add/edit agent response · Update ticket status · Close ticket

All three are protected by `checkRole(['Support agent'])` on the `PATCH /api/tickets/:id` route.

- A `User` sending `PATCH` receives `403 Forbidden` with an error message — confirmed in middleware.
- The UI hides the edit form for non-agents, but that is a UI convenience only; the backend independently enforces the restriction.
- `agentResponse` is not settable via `POST /api/tickets` (the create route does not accept it).

**Gap:** No backend check prevents a `Support agent` from closing a ticket (`status: 'closed'`) without providing an `agentResponse`. This means a ticket can be closed silently without any written response.

---

## 7. Validation Status

| Field | Frontend check | Backend check | Notes |
|---|:---:|:---:|---|
| `title` — required, non-empty | ✅ HTML `required` + JS trim check | ✅ `!title || !title.trim()` → 400 | No max-length enforced |
| `description` — required, non-empty | ✅ HTML `required` + JS trim check | ✅ `!description || !description.trim()` → 400 | No max-length enforced |
| `category` — must be valid enum | ✅ `<select>` restricted to valid options | ✅ `VALID_CATEGORIES.includes(category)` → 400 | Consistent |
| `submittedUser` — must match session user | ✅ sent as `currentUser.username` | ✅ `submittedUser !== req.user.username` → 400 | Good cross-check |
| `status` — must be valid enum | ✅ `<select>` restricted | ✅ `VALID_STATUSES.includes(status)` → 400 | Consistent |
| `agentResponse` — optional string | ✅ textarea, no constraint | ✅ Optional, no constraint | An empty string `""` is accepted and will overwrite a previous response |
| Username/password on login | ✅ both `required` | ✅ both checked for presence → 400 | — |

**Missing validations:**
- No `maxLength` on `title` (DB column is VARCHAR(255)); an over-length string would cause a MySQL truncation error, not a clean 400.
- No XSS sanitisation on `description` or `agentResponse` (expected for pre-hardening stage).
- No rate limiting on `POST /api/auth/login`.

---

## 8. Stage Drift — Early Implementation

The following items go **beyond** what the secondary feature stage strictly required:

| Item | Status | Assessment |
|---|---|---|
| `closedAt` timestamp | Implemented | Aligns exactly with AC-3.2; appropriate |
| `updatedAt` auto-updated by MySQL `ON UPDATE CURRENT_TIMESTAMP` | Implemented | Good DB-level tracking; appropriate |
| `.env.example` template | Present | Good practice; not an over-reach |
| `getAllUsers()` in `ticketService` | Present but **unused** | Minor stage drift — written but never called; leftover from a planned feature (agent username dropdown) |
| Demo account selector on login screen | Implemented | Workshop convenience; not a production feature — acceptable |
| `dist/` folder in `frontend/` | Present | Pre-built bundle exists; suggests `npm run build` was run at some point — no functional impact |

No significant future-stage over-implementation was detected (no email, no file upload, no admin panel, no audit log).

---

## 9. Issues Found Before Stage 8

### Critical / Must Fix Before Testing

| # | Issue | Location | Impact |
|---|---|---|---|
| C1 | `JWT_SECRET` not set in `.env`; hardcoded fallback `'super_secret_workshop_key'` is always used | `backend/.env`, `authRoutes.js` L6, `authMiddleware.js` L3 | Any attacker knowing the fallback can forge valid tokens |
| C2 | `JWT_SECRET` is duplicated in two source files instead of a shared constant | `authRoutes.js` L6, `authMiddleware.js` L3 | If one is changed, signatures will mismatch silently |

### High / Should Fix Before Testing

| # | Issue | Location | Impact |
|---|---|---|---|
| H1 | Passwords hashed with SHA-256, not bcrypt/argon2 | `authRoutes.js` L32, `schema.sql` L32–37 | SHA-256 is fast; trivial brute-force of weak passwords |
| H2 | Hand-rolled token has no expiry; stolen token is valid forever | `authRoutes.js` L9–14 | Session hijack persists indefinitely |
| H3 | CORS is fully open (`cors()` with no origin restriction) | `backend/index.js` L8 | Any origin can call the API |
| H4 | No `helmet` middleware; missing standard security headers | `backend/index.js` | XSS, clickjacking, MIME sniffing exposure |

### Medium / Note for Security Hardening Stage

| # | Issue | Location | Impact |
|---|---|---|---|
| M1 | No max-length validation on `title` and `description` | `ticketRoutes.js` L40–44 | Over-length input causes MySQL error instead of clean 400 |
| M2 | No XSS sanitisation on free-text fields (`description`, `agentResponse`) | Routes + service | Stored XSS if output is ever rendered as HTML without escaping (React auto-escapes, so currently safe) |
| M3 | Agent can close a ticket without an `agentResponse` | `ticketRoutes.js` L88–91 | Business rule gap (not a security issue) |
| M4 | `getAllUsers()` is defined in `ticketService` but never called | `ticketService.js` L68–71 | Dead code; minor noise |
| M5 | Agent "filter by user" is a free-text input, not a validated enum | `App.jsx` L415–421 | Any string is sent to the server; non-existent usernames return empty results silently |
| M6 | FK on `submittedUser` uses `username` string instead of `user.id` | `schema.sql` L28 | Fragile if usernames ever become editable |
| M7 | No request body size limit | `backend/index.js` | Large payloads not capped; default Express limit is 100 KB |

### Low / Maintainability

| # | Issue | Location | Impact |
|---|---|---|---|
| L1 | `App.jsx` is a single 580-line monolithic component | `frontend/src/App.jsx` | Hard to test individual UI sections; no component split |
| L2 | No JSDoc or inline comments on business-logic functions | Service + routes | Reduces readability for new contributors |
| L3 | `nodemon` is only in `devDependencies`; `npm run dev` uses `nodemon` — fine as-is | `backend/package.json` | No functional issue; noted for clarity |

---

## 10. Manual Checks Recommended Next

The following manual verification steps are recommended before or during Stage 8 testing:

1. **Login — valid credentials:** Log in as `alice` / `password123`; confirm token and user object are stored in `localStorage`.
2. **Login — invalid credentials:** Try wrong password; confirm `401` error message appears in the UI.
3. **User ticket isolation:** Log in as `alice`; confirm only alice's 2 seed tickets appear. Log in as `bob`; confirm only bob's 1 seed ticket appears.
4. **API isolation bypass attempt:** Using curl or Postman, call `GET /api/tickets` with alice's token and `?submittedUser=bob`; confirm the response still only returns alice's tickets.
5. **Agent full-list view:** Log in as `agent_carter`; confirm all 3 seed tickets from both users appear.
6. **Agent PATCH — response + closure:** Select the open VPN ticket; add an agent response, set status to `closed`, save. Confirm `closedAt` is set in the database.
7. **Role enforcement — 403 test:** Log in as `alice` (User role); use the browser console to send `PATCH /api/tickets/1` with a valid User token; confirm `403 Forbidden` is returned.
8. **Filters:** As agent, filter by `status=open`; confirm only open tickets appear. Filter by `category=Hardware`; confirm only hardware tickets. Filter by `submittedUser=alice`; confirm only alice's tickets.
9. **Create ticket validation:** As User, try submitting a ticket with empty title; confirm `400` error message is shown in the UI.
10. **DB setup repeatability:** Run `npm run db:setup` twice; confirm it completes successfully and seed data is reset.

---

## 11. Pass/Fail Table

| Check | Result | Notes |
|---|:---:|---|
| App appears runnable | ✅ PASS | `npm run dev` starts both services; `npm run db:setup` initialises DB |
| React frontend and Express backend are separated | ✅ PASS | `/frontend` (Vite/React, port 5173) and `/backend` (Express, port 5000) are entirely separate |
| React calls Express routes and never connects to MySQL directly | ✅ PASS | `frontend/src/config.js` points to `localhost:5000/api`; no MySQL client in frontend `package.json` |
| Backend uses DB_HOST, DB_PORT, DB_USER, DB_PASSWORD, DB_NAME | ✅ PASS | All five vars used in `db.js` and `dbSetup.js`; secrets never leave the backend |
| Needed database tables exist including users/login table | ✅ PASS | `app_users` and `tickets` both defined in `schema.sql` |
| Repeatable database setup or seed command exists | ✅ PASS | `npm run db:setup` → `node config/dbSetup.js` runs `schema.sql` including seed data; DROP/CREATE makes it idempotent |
| Login is database-backed | ✅ PASS | `POST /api/auth/login` queries `app_users`; not mock-only or role-selector-only |
| Role restrictions enforced in the backend | ✅ PASS | `checkRole()` middleware does a live DB lookup; role from token body is never trusted |
| Add/edit agent responses and close tickets is protected | ✅ PASS | `PATCH /api/tickets/:id` gated to `Support agent` only |
| Users limited to their own records | ✅ PASS | `GET /api/tickets` force-applies `submittedUser = req.user.username` for User role |
| Ticket creation, response, status update, and closure workflow | ✅ PASS | All four workflow steps implemented end-to-end |
| Filter by category, submitted user, or status | ✅ PASS | All three filter dimensions wired in backend and UI |
| Validation is present | ✅ PASS | Required fields checked; enum values validated; errors returned as JSON with HTTP 400/401/403 |
| AI implemented future stages early | ⚠️ MINOR | `getAllUsers()` exists but is unused; `dist/` folder present (pre-built); no significant over-reach |
| Missing before testing / security hardening | ⚠️ SEE §9 | No test framework; no bcrypt; no JWT expiry; open CORS; no Helmet; `JWT_SECRET` missing from `.env` |
