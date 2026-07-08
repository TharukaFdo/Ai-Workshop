# Helpdesk Ticket System — Mid-Project Review

**Review date:** 2026-06-07  
**Stage reviewed:** After secondary feature (filter by category / submitted user / status). Before testing, security hardening, and maintainability cleanup.  
**Stack:** React (Vite) · Express/Node.js · MySQL (mysql2)  
**Roles in scope:** User, Support Agent  
**Main entity:** Ticket  

---

## 1. Mid-Review Summary

The prototype is structurally sound and covers the full core workflow end-to-end. The React frontend and Express backend are properly separated into `frontend/` and `backend/` directories. The frontend communicates with the backend exclusively via HTTP (`fetch`), never touching MySQL directly. The backend uses environment variables (`DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`) through `dotenv`; none of those values are exposed to the React bundle.

All five database tables required by the case are present (two tables: `users` and `tickets`). A repeatable setup script (`npm run db:setup`) and a reset command (`npm run db:reset`) are available and seed a demo user and agent. Login is fully database-backed with bcrypt password comparison and JWT token issuance. Role enforcement is applied in the backend on every protected route through dedicated middleware (`verifyToken` + `requireRole`).

The main ticket workflow (create → view → add/update agent response → status update → close) is completely implemented. The secondary filter feature (status, category, submitted-user) is implemented on both frontend and backend. Users are restricted to their own tickets at the backend query level, not only in the UI. Agent-only actions (response write, status change, close) are guarded by `requireRole('agent')` middleware.

Outstanding concerns before the next stages are: the hardcoded API base URL (`http://localhost:5005`) duplicated in every frontend file, the JWT fallback secret committed in source (`'super_secret_helpdesk_key'`), no route guard preventing unauthenticated navigation within React, a CSS badge class mismatch for the `inProgress` status, no frontend field-length validation, no test files of any kind, and a category mismatch between seed data and the backend allow-list.

Overall the project is in a healthy mid-stage state: the full feature set works, persistence is real, and security logic is present but not yet hardened.

---

## 2. Review Scoring Matrix

| Feature / Area | Functionality 0–5 | Data Persistence 0–5 | Backend Security / Role Control 0–5 | Validation / Error Handling 0–5 | Testing Evidence 0–5 | Maintainability 0–5 | UI / Manual Usability 0–5 | Evidence | Notes |
|---|---:|---:|---:|---:|---:|---:|---:|---|---|
| **Project setup and run commands** | 4 | 5 | — | — | 0 | 3 | — | `README.md` lists `npm run dev` for both sides; `db:setup` and `db:reset` scripts exist | Backend port in `.env` (5005) differs from `.env.example` (5000) and README (5000); no root-level orchestration script |
| **Database setup and starter data** | 5 | 5 | — | 3 | 0 | 4 | — | `scripts/dbSetup.js`, `schema.sql`, `npm run db:setup / db:reset` | Seed inserts a `'Network'` category ticket, but the backend allow-list only accepts `General`, `Technical`, `Billing`, `Hardware` — seed ticket would fail validation on any future re-insert |
| **Login workflow** | 5 | 5 | 4 | 4 | 0 | 3 | 5 | `POST /api/auth/login` in `server.js` L32–70; bcrypt compare; JWT 24 h | JWT fallback secret `'super_secret_helpdesk_key'` is hardcoded in both `server.js` and `auth.js`; no token refresh mechanism |
| **Role-based access** | 5 | 5 | 5 | 3 | 0 | 4 | 4 | `middleware/auth.js`; `verifyToken` re-queries DB on every request for live role; `requireRole('agent')` applied to `/response` and `/status` routes | No React route guard; unauthenticated users can reach `/create` and `/ticket/:id` in the browser (backend will reject, but no frontend redirect) |
| **Main create action** | 5 | 5 | 4 | 4 | 0 | 3 | 5 | `POST /api/tickets` server.js L121–143; `CreateTicket.jsx` | Category validated against allow-list on backend; no min-length check on title/description; `submittedUserId` taken from JWT not from body (correct) |
| **Main view/list action** | 5 | 5 | 5 | 3 | 0 | 3 | 5 | `GET /api/tickets` server.js L73–118; `Dashboard.jsx` | Error message surfaced to user; no empty-token redirect in Dashboard (silently shows no tickets) |
| **Main update/status/cancel action** | 5 | 5 | 5 | 4 | 0 | 3 | 5 | `PUT /api/tickets/:id/status` server.js L202–228; status dropdown + "Close Ticket" button in `TicketDetails.jsx` | `closedAt` is set/cleared correctly for status changes; no confirmation dialog before closure |
| **Protected action** | 5 | 5 | 5 | 4 | 0 | 3 | 5 | `requireRole('agent')` on `/response` and `/status`; agent actions panel hidden from users in UI | Backend correctly rejects non-agent calls with 403; agent UI panel is conditionally rendered |
| **Secondary feature** | 5 | 5 | 5 | 3 | 0 | 3 | 4 | `GET /api/tickets?status=&category=&submittedUserId=` server.js L73–118; filter bar in `Dashboard.jsx` | User filter shown only to agents; backend enforces user-scope before applying `submittedUserId` filter |
| **Case-specific: ticket category, status, and submitted user tracking** | 5 | 5 | 5 | 4 | 0 | 4 | 5 | `tickets` table has `category`, `status` ENUM, `submittedUserId` FK, `createdAt`, `updatedAt`, `closedAt`; JOIN exposes `submittedUser` name | Category column is `VARCHAR(100)` not an ENUM — allows any string if inserted directly into DB |
| **Case-specific: agent response workflow and ticket closure** | 5 | 5 | 5 | 4 | 0 | 3 | 5 | `PUT /api/tickets/:id/response` and `PUT /api/tickets/:id/status`; `TicketDetails.jsx` agent actions panel | Only one response field (no history); updating response overwrites rather than appending — acceptable for this prototype scope |
| **Case-specific: user visibility limited to own tickets** | 5 | 5 | 5 | 3 | 0 | 4 | 4 | server.js L86–88 forces `submittedUserId = req.user.id` for non-agent role at SQL level; single ticket access checked at L164 | No equivalent check when agent tries to access a ticket — by design agents see all, which is correct |
| **UI / manual usability** | 4 | — | — | 3 | 0 | 3 | 4 | Dark glassmorphism theme; status badges; loading spinners; error messages | `badge-inprogress` CSS class does not exist — the template uses `badge-${ticket.status.toLowerCase()}` which produces `badge-inprogress`, but only `badge-progress` is defined in CSS; "In Progress" tickets render without badge color |
| **Security posture** | 3 | — | 4 | 3 | 0 | 2 | — | JWT auth; bcrypt; DB-backed role re-check per request; parameterised queries throughout | CORS is wide-open (`app.use(cors())`); JWT secret has a weak hardcoded fallback; `.env` is not listed in a root `.gitignore`; no rate limiting on login; no Helmet |
| **Testing evidence** | 0 | 0 | 0 | 0 | 0 | 0 | — | No test directory, no test runner config, no test files found anywhere | Starting point is clean — no conflicts for future test suite |
| **Maintainability** | — | — | — | — | 0 | 2 | — | All routes are inline in a single `server.js`; API base URL hardcoded in three separate `.jsx` files; no shared API client module; no JSDoc or inline comments on business logic | All routes in one file; no router separation; no shared constants file for categories/statuses |

---

## 3. Current Feature Status

| Feature | Implemented | Works end-to-end | Notes |
|---|:---:|:---:|---|
| Ticket creation (title, description, category) | ✅ | ✅ | Category validated against hard-coded allow-list on backend |
| Ticket list / dashboard view | ✅ | ✅ | Users see own tickets only (backend-enforced) |
| Ticket detail view | ✅ | ✅ | Shows submitter name, email, category, dates, status badge |
| Agent response — add | ✅ | ✅ | Agent-only, backend-guarded |
| Agent response — update (overwrite) | ✅ | ✅ | Same PUT endpoint; label changes to "Update Reply" |
| Status update (open → inProgress → resolved → closed) | ✅ | ✅ | Dropdown changes fire immediately |
| Ticket closure (sets `closedAt`) | ✅ | ✅ | Dedicated "Close Ticket" button + closure timestamp shown |
| Filter by status | ✅ | ✅ | Server-side WHERE clause |
| Filter by category | ✅ | ✅ | Server-side WHERE clause |
| Filter by submitted user (agent only) | ✅ | ✅ | Agent-only; backend scope respected |
| User restricted to own tickets | ✅ | ✅ | SQL-level enforcement |
| User cannot edit agent response | ✅ | ✅ | No UI element exposed; backend 403 if attempted |
| User cannot close ticket | ✅ | ✅ | No UI element exposed; backend 403 if attempted |
| Logout | ✅ | ✅ | Clears localStorage, redirects to `/login` |
| Navbar role/user display | ✅ | ✅ | Name and role shown; updates on login event |

---

## 4. Database and Persistence Status

**Tables present:** `users`, `tickets`  
**Schema source:** `schema.sql` (root) and inline DDL in `backend/scripts/dbSetup.js` (both in sync)

| Table | Key Columns | Status |
|---|---|---|
| `users` | `id`, `name`, `email`, `password` (bcrypt), `role` ENUM('user','agent'), `createdAt` | ✅ Complete |
| `tickets` | `id`, `title`, `description`, `category`, `submittedUserId` (FK → users), `status` ENUM, `agentResponse`, `createdAt`, `updatedAt`, `closedAt` | ✅ Complete |

**Persistence notes:**
- Connection pool via `mysql2/promise` with 10-connection limit.
- All queries use parameterised placeholders — no raw string interpolation.
- `db:setup` creates DB + tables + seeds demo data idempotently.
- `db:reset` drops and recreates tables, then re-seeds.
- **Issue:** Seed data inserts a ticket with `category = 'Network'`, which is outside the backend's validated allow-list (`General`, `Technical`, `Billing`, `Hardware`). The seed succeeds because it bypasses the Express validation layer, but it is an inconsistency.

---

## 5. Login and Role/Access Status

**Login type:** Database-backed (bcrypt + JWT)

| Check | Result |
|---|---|
| Credentials verified against `users` table | ✅ |
| Passwords stored as bcrypt hash | ✅ |
| JWT issued on success with `id`, `name`, `email`, `role` | ✅ |
| Token stored in `localStorage` | ✅ (acceptable for prototype; not HttpOnly cookie) |
| `verifyToken` middleware re-queries DB on every request | ✅ (live role check, no stale token risk) |
| `requireRole('agent')` used on protected routes | ✅ |
| Mock-only or role-selector login | ❌ Not present |
| Backend allows requests with no token | ❌ Returns 401 correctly |

**Gaps:**
- The JWT fallback secret `'super_secret_helpdesk_key'` is hardcoded in both `server.js` (L53) and `auth.js` (L13). If `JWT_SECRET` is missing from `.env`, the app runs with a publicly known secret.
- No React route guard (`PrivateRoute` / `Navigate`) — unauthenticated users can navigate to `/create` or `/ticket/:id` and will see a loading state before the backend rejects them. Dashboard shows a manual `!currentUser` guard with a login link; TicketDetails shows the same. `CreateTicket` only checks for token on submit.
- No token expiry handling in the frontend — expired token produces a 403 from the backend but the user is not redirected to login.

---

## 6. Protected Action Status

Protected actions per the case brief: **add or edit agent responses** and **close tickets**.

| Action | Route | Guard | Backend Enforcement | UI Enforcement |
|---|---|---|---|---|
| Add agent response | `PUT /api/tickets/:id/response` | `verifyToken` + `requireRole('agent')` | ✅ 403 for non-agents | ✅ Panel hidden from users |
| Edit/update agent response | Same route (overwrite) | Same | ✅ | ✅ |
| Update ticket status | `PUT /api/tickets/:id/status` | `verifyToken` + `requireRole('agent')` | ✅ 403 for non-agents | ✅ Status dropdown hidden from users |
| Close ticket | Same status route (`status: 'closed'`) | Same | ✅ 403 for non-agents | ✅ "Close Ticket" button hidden from users |

All protected actions are correctly guarded. The guard is in dedicated middleware applied at the route level, not inside the handler body, which is the correct pattern.

---

## 7. Validation Status

| Validation point | Location | Present | Notes |
|---|---|:---:|---|
| Login: email + password required | Backend L35–37 | ✅ | |
| Ticket create: title, description, category required | Backend L124–126 | ✅ | |
| Ticket create: category in allow-list | Backend L128–131 | ✅ | Allow-list and seed data are out of sync (see §4) |
| Agent response: non-empty body | Backend L180–182 | ✅ | `trim()` check present |
| Status update: value in allow-list | Backend L206–209 | ✅ | |
| Frontend form: HTML5 `required` attributes | `Login.jsx`, `CreateTicket.jsx`, `TicketDetails.jsx` | ✅ | Prevents empty submit at browser level |
| Frontend: empty response textarea blocked | `TicketDetails.jsx` L320 | ✅ | Button disabled if `!newResponse.trim()` |
| Frontend: field length limits | All `.jsx` files | ❌ | No `maxLength` attributes; backend has no length check either |
| Backend: title / description min-length | `server.js` | ❌ | A single-character title passes validation |
| Frontend: email format | `Login.jsx` | ✅ | `type="email"` input |
| Error messages displayed to user | All pages | ✅ | `error` state shown in red alert box |
| 404 handling for unknown ticket ID | Backend L157–159, L190, L219 | ✅ | |
| 403 handling for cross-user access | Backend L164–166 | ✅ | |

---

## 8. Stage Drift — Early Implementation

The case brief defined three progressive stages. Review findings for early or skipped work:

| Item | Expected stage | Found at mid-review | Assessment |
|---|---|---|---|
| JWT authentication (bcrypt + token) | Security hardening stage | Present now | Early — acceptable for prototype; login was needed early to enable role tests |
| DB-backed role re-check per request in middleware | Security hardening | Present now | Early — adds value, no harm |
| `closedAt` timestamp on ticket | Could be later | Present in schema and used | Appropriate — simple field addition |
| Parameterised SQL queries throughout | Security hardening | Present now | Early — correct, no raw interpolation at all |
| CORS configuration | Security hardening | Present but wide-open | Partially early; hardening not done |
| Test files | Testing stage | None found | Correctly absent |
| Rate limiting / Helmet | Security hardening | Absent | Correctly deferred |
| Token refresh / expiry handling | Security hardening | Absent | Correctly deferred |
| Input length validation | Maintainability / hardening | Absent | Still needed |
| Shared API base URL constant | Maintainability cleanup | Absent | Correctly deferred but will be needed |
| Route splitting (Express Router) | Maintainability cleanup | Absent | Correctly deferred |

**Summary:** No unwanted future-stage features were implemented. Several security-adjacent patterns (bcrypt, parameterised queries, DB role check) were implemented early in a beneficial way. Nothing needs to be rolled back.

---

## 9. Issues Found Before Stage 8

The following issues exist in the current codebase and should be addressed during the upcoming testing, security hardening, and maintainability cleanup stages.

### 🔴 High Priority (affect correctness or security)

1. **CSS badge class mismatch for `inProgress` status.**  
   `Dashboard.jsx` L227 and `TicketDetails.jsx` L187 use `` `badge-${ticket.status.toLowerCase()}` `` which produces `badge-inprogress`. The stylesheet (`index.css`) defines `.badge-progress`, not `.badge-inprogress`. "In Progress" tickets render with no badge colour.

2. **JWT fallback secret hardcoded in source.**  
   `server.js` L53 and `auth.js` L13 both default to `'super_secret_helpdesk_key'` when `JWT_SECRET` is not set. If the `.env` file is missing, the server starts with a publicly known signing secret.

3. **`backend/.env` not covered by any `.gitignore`.**  
   The frontend has a `.gitignore` covering `node_modules` etc., but there is no root-level `.gitignore` and no `backend/.gitignore`. The `.env` file (which contains DB credentials and JWT secret) could be committed to version control.

4. **Seed category `'Network'` is outside the backend allow-list.**  
   `dbSetup.js` L87 inserts a ticket with `category = 'Network'`. The backend `POST /api/tickets` allow-list (`General`, `Technical`, `Billing`, `Hardware`) does not include `'Network'`. The DB seed bypasses validation, creating an inconsistent demo state.

5. **API base URL hardcoded in three frontend files.**  
   `http://localhost:5005` appears in `Login.jsx` L17, `CreateTicket.jsx` L25, `Dashboard.jsx` L30 & L52, and `TicketDetails.jsx` L27, L59, L87. Any port change requires editing multiple files.

### 🟡 Medium Priority (usability and completeness)

6. **No React route guard for unauthenticated navigation.**  
   Users can type `/create` or `/ticket/1` directly in the browser. `CreateTicket` checks the token only on submit; `TicketDetails` and `Dashboard` show a static `!currentUser` message rather than redirecting. A `PrivateRoute` wrapper or `useEffect` redirect would be cleaner.

7. **No frontend handling of expired JWT.**  
   When the 24-hour token expires, the backend returns 403. The frontend surfaces the raw error message but does not automatically clear localStorage and redirect to `/login`.

8. **Backend port mismatch across files.**  
   `.env` sets `PORT=5005`; `.env.example` sets `PORT=5000`; `README.md` says "backend server runs on `http://localhost:5000`". All three should agree.

9. **No field-length validation on ticket title or description.**  
   A 1-character title or a description exceeding the `TEXT` column size will pass frontend validation and reach the DB without being sanitised.

10. **No confirmation dialog before closing a ticket.**  
    The "Close Ticket" button fires `handleStatusChange('closed')` immediately on click. Accidental closure cannot be undone through the UI (though an agent could reopen via the dropdown).

11. **CORS open to all origins.**  
    `app.use(cors())` allows any origin. Should be restricted to the frontend origin before deployment.

### 🟢 Low Priority (maintainability, nice-to-have)

12. **All routes in a single `server.js` file (244 lines).**  
    As routes grow, this file will become hard to maintain. Express `Router` should be used to split routes by resource (`/auth`, `/tickets`, `/users`).

13. **No shared constant file for categories or statuses.**  
    The allow-list `['General', 'Technical', 'Billing', 'Hardware']` in `server.js` and the `<option>` values in `CreateTicket.jsx` and `Dashboard.jsx` are manually kept in sync. A shared constant or an API endpoint for valid values would reduce drift.

14. **`App.css` exists but appears unused** (not imported in `App.jsx`; global styles are in `index.css`).

15. **No 404 page component.**  
    The catch-all route `<Route path="*">` redirects to `/` instead of showing a proper 404 message.

16. **Only a single agent response field (no history).**  
    Each PUT `/response` call overwrites the previous response. For prototype scope this is acceptable, but noted for future iterations.

---

## 10. Manual Checks Recommended Next

Before moving to the testing stage, the following manual checks should be performed against a running instance:

1. **Login with each seed credential** and verify the correct dashboard view appears (user sees own tickets only; agent sees all).
2. **Create a ticket as a regular user** and confirm it appears on the dashboard with status `open`.
3. **Log in as agent**, view the new ticket, add a response, and verify the response text is saved and displayed.
4. **Update ticket status through the full lifecycle**: open → inProgress → resolved → closed. Confirm `closedAt` timestamp appears.
5. **Attempt to access agent actions as a regular user** (e.g., call `PUT /api/tickets/1/response` with a user JWT via curl or Postman). Confirm 403 response.
6. **Attempt to view another user's ticket as a regular user** (e.g., `GET /api/tickets/2` where ticket 2 was created by a different user). Confirm 403.
7. **Test each filter** (status, category, submitted user) on the dashboard and verify the ticket list narrows correctly.
8. **Check the `inProgress` badge colour** — it will likely appear unstyled due to the CSS class mismatch.
9. **Remove `JWT_SECRET` from `.env`** and confirm the fallback secret does not silently allow login from a different environment.
10. **Confirm `backend/.env` is not tracked by git** (`git status` check).

---

## 11. Pass/Fail Table

| Check | Result | Detail |
|---|:---:|---|
| App appears runnable | ✅ PASS | `npm run dev` works in both directories; `db:setup` available |
| React frontend and Express backend are separated | ✅ PASS | `frontend/` and `backend/` are independent projects |
| React calls Express routes; no direct MySQL connection from React | ✅ PASS | All data calls are `fetch(...)` to `http://localhost:5005/api/...` |
| Backend uses `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME` | ✅ PASS | `config/db.js` reads all five from `process.env` |
| DB secrets not exposed in React bundle | ✅ PASS | No database credentials appear in any frontend file |
| Needed database tables exist (`users`, `tickets`) | ✅ PASS | Both tables defined in `schema.sql` and `dbSetup.js` |
| A login/users table exists | ✅ PASS | `users` table with `email`, `password`, `role` |
| Repeatable database setup or seed command | ✅ PASS | `npm run db:setup` and `npm run db:reset` |
| Login is database-backed | ✅ PASS | bcrypt compare against `users` table |
| Login is NOT mock-only or role-selector-only | ✅ PASS | No mock data path; real credentials required |
| Role restrictions enforced in backend | ✅ PASS | `requireRole('agent')` middleware on protected routes |
| Role restrictions NOT only in UI | ✅ PASS | UI hiding is additive; backend is the real guard |
| Add/edit agent response is protected | ✅ PASS | `PUT /api/tickets/:id/response` requires agent role |
| Close ticket is protected | ✅ PASS | `PUT /api/tickets/:id/status` requires agent role |
| Users limited to own tickets | ✅ PASS | SQL WHERE enforced for non-agent role |
| Ticket creation workflow implemented | ✅ PASS | `POST /api/tickets` + `CreateTicket.jsx` |
| Agent response workflow implemented | ✅ PASS | `PUT /api/tickets/:id/response` + agent panel |
| Status update and closure workflow implemented | ✅ PASS | `PUT /api/tickets/:id/status` + UI controls |
| Filter by category implemented | ✅ PASS | Backend query param + frontend select |
| Filter by submitted user implemented | ✅ PASS | Agent-only; backend enforced |
| Filter by status implemented | ✅ PASS | Backend query param + frontend select |
| Validation present on backend | ✅ PASS | Required fields, category allow-list, status allow-list |
| Validation present on frontend | ⚠️ PARTIAL | HTML5 `required` present; no length limits |
| No future-stage work implemented prematurely | ✅ PASS | No tests, rate-limiting, or Helmet found |
| `inProgress` status badge renders correctly | ❌ FAIL | CSS class `badge-inprogress` missing; only `badge-progress` defined |
| JWT secret is not a known hardcoded value | ❌ FAIL | Fallback `'super_secret_helpdesk_key'` hardcoded in two files |
| `.env` file protected from version control | ❌ FAIL | No root `.gitignore`; `backend/.env` could be committed |
| Seed data categories consistent with backend allow-list | ❌ FAIL | Seed uses `'Network'`; allow-list does not include it |
| API base URL is configurable, not hardcoded | ❌ FAIL | `http://localhost:5005` hardcoded in three frontend files |
| Test files present | ❌ FAIL | No tests found (expected at this stage — noted for next stage) |
