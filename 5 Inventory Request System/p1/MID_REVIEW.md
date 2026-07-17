# Mid-Project Review — Inventory Request System

**Case:** Inventory Request System  
**Review Stage:** After secondary feature (filter), before testing, security hardening, and maintainability cleanup  
**Review Date:** 2026-07-10  
**Reviewer:** Antigravity (AI code review)  
**Files Reviewed:** `schema.sql`, `backend/server.js`, `backend/db.js`, `backend/initDb.js`, `backend/.env`, `backend/.env.example`, `backend/package.json`, `frontend/src/App.jsx`, `frontend/src/App.css`, `frontend/src/main.jsx`, `frontend/index.html`, `frontend/package.json`, `frontend/vite.config.js`

---

## 1. Mid-Review Summary

The project is a React + Express + MySQL prototype for an internal inventory request workflow. Both tiers are present and correctly separated. The backend is Express-served on port 5000; the frontend is a Vite/React SPA that proxies `/api` calls to Express and never connects to MySQL directly. A repeatable `npm run init-db` command fully recreates and seeds the database. Login is database-backed with role stored in MySQL. Role enforcement exists in the backend for every protected route. The primary workflow (submit → approve/reject → issued) is implemented end-to-end. Client-side filtering by item name, requester, and status is present and functional. The main gaps before the next stages are: plaintext passwords in the database, an overly broad CORS policy (`*`), no server-side filtering (filter is purely client-side), no server-side input length caps or quantity-positive check at the route level, the `schema.sql` file at root is a partial duplicate of `initDb.js` but lacks the `users` table, and the page `<title>` remains the Vite default "frontend".

**Overall readiness:** The app appears runnable after `npm run init-db` (backend) and `npm run dev` (frontend). All main case requirements are present. No future stages appear to have been pre-implemented.

---

## 2. Review Scoring Matrix

> Score meaning: 0 = missing · 1 = present but mostly not working · 2 = partially working with major gaps · 3 = mostly working with important gaps · 4 = working with minor gaps · 5 = complete for the selected case scope

| Feature / Area | Functionality 0-5 | Data Persistence 0-5 | Backend Security / Role Control 0-5 | Validation / Error Handling 0-5 | Testing Evidence 0-5 | Maintainability 0-5 | UI / Manual Usability 0-5 | Evidence | Notes |
|---|---:|---:|---:|---:|---:|---:|---:|---|---|
| Project setup and run commands | 4 | 5 | 5 | 4 | 0 | 3 | 4 | `backend/package.json` scripts: `start`, `dev`, `init-db`; `frontend/package.json` scripts: `dev`, `build`; Vite proxy configured | `init-db` drops and recreates tables — safe for dev, destructive in production; no root-level README with combined run instructions |
| Database setup and starter data | 4 | 5 | 5 | 3 | 0 | 3 | 4 | `initDb.js` creates DB + both tables + seeds users + seeds demo requests; `backend/.env.example` present | `schema.sql` at root lacks `users` table — diverged from `initDb.js`; passwords stored plaintext |
| Login workflow | 4 | 5 | 3 | 4 | 0 | 3 | 4 | `POST /api/login` queries `users` table by username + password; role returned from DB; user object stored in `localStorage` | No password hashing (plaintext); no JWT/session token — username sent as `Authorization` header on every request; no HTTPS enforcement |
| Role-based access | 4 | 4 | 4 | 4 | 0 | 3 | 4 | `authenticateUser` middleware re-queries DB on every request; role attached from DB row; staff-only create and storekeeper-only status update enforced in backend | `GET /api/requests` returns all requests to both roles — no row-level filtering by role in backend (staff sees all requests, not just their own) |
| Main create action | 5 | 5 | 5 | 4 | 0 | 4 | 5 | `POST /api/requests` checks `role === 'staff'`; `requester_name` resolved server-side from `req.user.display_name`; fields persisted to DB | No max-length check on `item_name` or `reason` at route level; no quantity > 0 check at route level (MySQL `CHECK` in `schema.sql` omitted in `initDb.js`) |
| Main view/list action | 4 | 5 | 3 | 3 | 0 | 3 | 4 | `GET /api/requests` authenticated; results ordered `created_at DESC`; displayed in responsive table | No pagination; all requests returned to both roles regardless of ownership (staff can see other staff's requests) |
| Main update/status/cancel action | 4 | 5 | 4 | 3 | 0 | 3 | 4 | `PUT /api/requests/:id/status` authenticated; status transitions (pending→approved/rejected, approved→issued) enforced in UI; storekeeper note updated atomically | No status transition guard in backend (e.g. re-rejecting an already-issued request is API-level possible); no cancel route for staff |
| Protected action | 4 | 5 | 4 | 4 | 0 | 3 | 4 | `storekeeper` role enforced in backend for approve/reject/issue; `display_name` comparison prevents self-approval and self-issue in backend | `display_name` comparison is case-insensitive but string-based — fragile if display names are edited; storekeeper can still self-reject via direct API call |
| Secondary feature | 4 | 4 | 2 | 3 | 0 | 3 | 4 | Filter by item name, requester, and status implemented in React state (`filteredRequests`); all three filters work correctly in the UI | Filtering is client-side only — all records fetched from DB, then filtered locally; no backend query params; requester filter hidden from staff in UI |
| Case-specific: item, quantity, reason, and requester fields | 5 | 5 | 5 | 4 | 0 | 4 | 5 | All four fields present in DB schema, form, API request/response, and list display; `requester_name` resolved server-side; `quantity` parsed as integer in frontend | No server-side `quantity > 0` guard at route level (only HTML `min="1"` on input); no `item_name` max length validation at route level |
| Case-specific: approve/reject/issued status lifecycle | 4 | 5 | 4 | 3 | 0 | 3 | 4 | Four-value ENUM `(pending, approved, rejected, issued)` in DB; UI renders correct action buttons per status; transition from approved→issued present | No backend enforcement of valid transition order (e.g. issued→pending not blocked at API level); UI correctly hides buttons for finalized statuses but API does not guard it |
| Case-specific: storekeeper note protection and staff ownership | 4 | 5 | 4 | 4 | 0 | 3 | 4 | Staff cannot write notes (no edit endpoint exposed to staff); note only flows through `PUT /api/requests/:id/status` which is storekeeper-only; staff UI shows notes read-only | Storekeeper can self-reject via API (only self-approve/issue blocked); note has no max length; cannot update note without also changing status |
| UI / manual usability | 4 | 4 | 3 | 3 | 0 | 3 | 4 | Dark glassmorphism theme; status badges with colour coding; responsive layout; demo credentials shown on login page; loading/error/empty states handled | Page `<title>` is "frontend" (Vite default); no favicon file; `alert()` used for error feedback; no success toast after submit |
| Security posture | 1 | 3 | 2 | 2 | 0 | 2 | 2 | `authenticateUser` re-queries DB; role from DB not client | Plaintext passwords; username sent as Bearer token (no real token); CORS open `*`; no rate limiting; no input sanitisation beyond parameterized queries |
| Testing evidence | 0 | 0 | 0 | 0 | 0 | 0 | 0 | No test files, test runner config, or test scripts found | No `jest`, `vitest`, `supertest`, or any testing dependency present |
| Maintainability | 3 | 3 | 3 | 3 | 0 | 3 | 3 | Single-file backend and single-file frontend — readable at this prototype scale; `.env.example` provided; `oxlint` configured in frontend | All backend logic in one 170-line `server.js`; no route separation; no service/controller layer; `schema.sql` diverged from `initDb.js` |

---

## 3. Current Feature Status

| Feature | Implemented | Works End-to-End | Notes |
|---|---|---|---|
| Staff submits inventory request | Yes | Yes | Form → POST /api/requests → DB insert |
| Storekeeper views all requests | Yes | Yes | GET /api/requests → table display |
| Staff views requests | Yes | Partial | Staff sees ALL requests, not just their own (backend returns all) |
| Storekeeper approves request | Yes | Yes | PUT /api/requests/:id/status → status=approved |
| Storekeeper rejects request | Yes | Yes | PUT /api/requests/:id/status → status=rejected |
| Storekeeper marks as issued | Yes | Yes | PUT /api/requests/:id/status → status=issued |
| Storekeeper adds note | Yes | Yes | Note included in status PUT body |
| Staff cannot approve/issue | Yes | Yes | Backend role check on PUT endpoint |
| Staff cannot edit notes | Yes | Yes | No staff-accessible note endpoint |
| Self-approval prevention | Yes | Partial | Blocks approved/issued; does not block self-reject via API |
| Filter by item name | Yes | Yes | Client-side filter |
| Filter by requester | Yes | Partial | UI only shows to storekeeper; client-side only |
| Filter by status | Yes | Yes | Client-side filter with dropdown |

---

## 4. Database and Persistence Status

- **Tables created:** `requests` and `users` — both created by `initDb.js`
- **Seed data:** 4 demo users (2 staff, 2 storekeeper) + 4 demo requests seeded automatically
- **Repeatable setup:** `npm run init-db` in `backend/` drops and recreates both tables, then re-seeds — fully repeatable
- **ENV variables used:** `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME` — all referenced in `db.js` and `initDb.js`
- **Secrets in React:** None — frontend has no database credentials and no direct MySQL dependency
- **Divergence issue:** `schema.sql` at the project root defines only `requests` (not `users`) and does not match `initDb.js`. It appears to be an earlier draft and could mislead a reviewer. It is not used by any npm script.
- **Password storage:** Plaintext in the `users` table — a known gap for the security hardening stage

---

## 5. Login and Role/Access Status

- **Login type:** Database-backed. `POST /api/login` queries `users` table with `username` and `password` (plaintext match). Role is loaded from the database row, not set by the client.
- **Session mechanism:** The returned user object `{ id, username, display_name, role }` is stored in `localStorage`. On subsequent requests the `username` field is sent as the `Authorization` header. The backend re-queries the `users` table on every authenticated request to fetch and verify the role — this is correct in principle, but using `username` as the token is not a real authentication token.
- **Role enforcement in backend:**
  - `POST /api/requests`: requires `role === 'staff'` — enforced
  - `PUT /api/requests/:id/status`: requires `role === 'storekeeper'` — enforced
  - `GET /api/requests`: only requires authentication (any valid user) — no role-scoped row filtering
- **UI-only restrictions that also have backend guards:** Role restriction on submit and status update are duplicated in both UI and backend — correct layering.
- **UI-only restrictions with no backend guard:** The requester filter being hidden from staff is a display preference, not a security concern.

---

## 6. Protected Action Status

**Protected actions per case brief:** approve or reject requests, mark items issued, edit storekeeper notes.

| Protected Action | Backend Guard | How Enforced | Gap |
|---|---|---|---|
| Approve request | Yes | `role === 'storekeeper'` check in `PUT /api/requests/:id/status` | No status transition guard (can re-approve already-approved) |
| Reject request | Yes | Same endpoint, same role check | Storekeeper can reject their own request via API (self-reject not blocked) |
| Mark as issued | Yes | Same endpoint, same role check; `isOwnRequest` also checked | `isOwnRequest` comparison uses `display_name` string match — fragile |
| Edit storekeeper note | Yes | Note only flows through the storekeeper-only status endpoint | No dedicated note-only endpoint; note is always updated with status |

---

## 7. Validation Status

| Location | Validation Present | Details |
|---|---|---|
| Frontend — login form | Yes | `required` on both fields; error banner shown on failure |
| Frontend — request form | Yes | `required` on all fields; `min="1"` on quantity; client-side guard before fetch |
| Backend — login | Yes | Checks `!username || !password`; returns 400 |
| Backend — create request | Yes | Checks all four fields present; returns 400; role check returns 403 |
| Backend — status update | Partial | Checks `!status`; role check present; but no whitelist of valid status values; no transition-order guard |
| Backend — quantity positive | Missing | No `quantity > 0` check in the route handler (only `min="1"` in HTML input) |
| Backend — input length | Missing | No max-length check at route level |
| Backend — status enum validation | Missing | Any string sent as `status` causes a MySQL ENUM error surfacing as 500, not a 400 |
| Error messages returned to client | Partial | Some errors return `error.message` from DB exceptions — may leak internal info in production |

---

## 8. Stage Drift / Early Implementation

No evidence of future stages being pre-implemented. The project does not include:
- Password hashing (security hardening stage)
- JWT or session tokens (security hardening stage)
- Rate limiting or CORS restriction (security hardening stage)
- Unit or integration tests (testing stage)
- Route modularisation or service layer (maintainability stage)
- Pagination or server-side filtering (not in case scope)

The only minor drift observation: the `authenticateUser` middleware re-queries the DB on every request, which is a correct security pattern. This is appropriate and not premature since it ensures role cannot be spoofed from client state.

---

## 9. Issues Found Before Stage 8

### Critical (security hardening stage blockers)

1. **Plaintext passwords** — `users` table stores passwords as plain strings. `bcrypt` or equivalent must be added before any security hardening stage.
2. **No real auth token** — `username` is used as a bearer token. Any client that knows a username can impersonate that user without a password (the middleware only checks if the username exists in `users`, not that a password was verified for this session). A JWT or server-side session is required.
3. **CORS open to all origins** — `app.use(cors())` with no options allows any origin. Should be restricted to the frontend origin.

### High (functional gaps)

4. **Staff sees all requests** — `GET /api/requests` returns all rows to both roles. The case brief implies staff should see their own requests only. The backend has no row-level filter by `requester_name = req.user.display_name` for staff.
5. **No backend status transition guard** — The API allows setting any status string on any request. An already-issued request can be set back to pending via direct API call. The four-value lifecycle is only enforced in the UI.
6. **Self-reject not blocked** — Backend only prevents `approved` and `issued` on own requests. A storekeeper can call the API to reject their own request.

### Medium (validation and error handling)

7. **No server-side quantity > 0 guard** — `initDb.js` omits the `CHECK (quantity > 0)` constraint present in `schema.sql`. An API call with `quantity: -5` would succeed.
8. **No input length validation at route level** — Item name and reason have no max-length check in the route handler; only the MySQL column definition provides an implicit limit, surfacing as a DB error (500) rather than a user-friendly 400.
9. **Status enum not whitelisted in route** — An invalid status value (e.g. `"foo"`) causes a MySQL ENUM error returned as a raw 500 rather than a 400 with a clear message.
10. **DB error messages surfaced to client** — `res.status(500).json({ error: error.message })` may leak internal DB error strings to the browser.

### Low (maintainability and UX)

11. **`schema.sql` diverged from `initDb.js`** — Root-level `schema.sql` does not define the `users` table and is not used by any script. Misleading for future contributors.
12. **Page `<title>` is "frontend"** — Vite default not updated. Should be "Inventory Request System".
13. **`alert()` used for error feedback** — Several error paths use `window.alert()`. Should be replaced with styled in-page messages.
14. **No success feedback after submit** — Form clears after submission but no toast or confirmation message appears.
15. **No favicon file** — `index.html` references `/favicon.svg` which does not exist in `/public`.
16. **`authenticateUser` error leaks** — The catch block in `authenticateUser` returns `error.message` directly in a 500 response.

---

## 10. Manual Checks Recommended Next

1. **Run `npm run init-db` in `backend/`** — Confirm both tables are created and all seed rows inserted without errors.
2. **Start backend with `npm run dev`** — Hit `GET /api/health` and confirm `{ status: "OK", database: "Connected" }`.
3. **Start frontend with `npm run dev`** — Confirm login page loads without console errors.
4. **Login as `alice` / `password`** — Confirm staff dashboard shows; confirm submit form is visible; confirm action panel is NOT visible.
5. **Submit a new request as alice** — Confirm row appears immediately in the table with status "pending".
6. **Login as `john` / `password`** — Confirm storekeeper dashboard loads with all requests; confirm submit form is NOT visible.
7. **Approve alice's request as john** — Confirm status changes to "approved" in UI; confirm DB row updated.
8. **Mark approved request as issued as john** — Confirm status changes to "issued"; confirm action panel shows "Request finalized".
9. **Attempt to approve john's own request** — Confirm "Self-approval disabled" message appears in UI and API returns 403.
10. **Filter by item name "charger"** — Confirm only matching rows displayed.
11. **Filter by status "rejected"** — Confirm only rejected rows displayed.
12. **Attempt direct API call `PUT /api/requests/1/status` with `status: "approved"` and `Authorization: alice`** — Confirm 403 returned (staff cannot update status).
13. **Attempt direct API call `PUT /api/requests/1/status` with `status: "approved"` and no `Authorization` header** — Confirm 401 returned.
14. **Attempt login with wrong password** — Confirm 401 and error banner displayed.
15. **Test `quantity: -1` via direct API POST** — Confirm behavior (expected to pass at this stage, demonstrating issue #7).

---

## 11. Pass/Fail Table

| Check | Status | Finding |
|---|---|---|
| App appears runnable | Pass | `npm run init-db` + `npm run dev` (both dirs) should produce a working app |
| React and Express are separated | Pass | Separate `frontend/` and `backend/` directories with independent `package.json` files |
| React calls Express, never MySQL directly | Pass | No MySQL dependency in `frontend/package.json`; all data via `/api` fetch calls |
| Backend uses DB_HOST, DB_PORT, DB_USER, DB_PASSWORD, DB_NAME | Pass | All five variables referenced in `db.js` and `initDb.js` via `dotenv` |
| Secrets not exposed in React | Pass | No `.env` file in frontend; no DB credentials in any frontend file |
| `users`/login table exists | Pass | `users` table created and seeded in `initDb.js` |
| `requests` table exists | Pass | `requests` table created and seeded in `initDb.js` |
| Repeatable DB setup command | Pass | `npm run init-db` drops, recreates, and seeds both tables |
| Login is database-backed | Pass | `POST /api/login` queries `users` table; role from DB |
| Role restrictions enforced in backend | Pass | `authenticateUser` + role checks on create and status routes |
| Protected actions require storekeeper role in backend | Pass | `PUT /api/requests/:id/status` enforces `role === 'storekeeper'` |
| Staff limited to own records | Partial fail | Backend returns all records; no server-side row filter for staff |
| Self-approval/issue blocked in backend | Partial pass | Blocked for approved and issued; self-reject not blocked |
| Submission workflow implemented | Pass | Create request form → POST → DB → list update |
| Approval/rejection workflow implemented | Pass | Approve and reject actions → PUT → DB → UI update |
| Issued workflow implemented | Pass | Mark issued action → PUT → DB → UI update |
| Filter by item name implemented | Pass | Client-side filter working |
| Filter by requester implemented | Partial pass | Working but client-side only; hidden from staff |
| Filter by status implemented | Pass | Client-side dropdown filter working |
| Frontend validation present | Pass | `required` attributes + client-side guard |
| Backend validation present | Partial pass | Field presence checked; no quantity > 0, no length cap, no status whitelist |
| No future stages pre-implemented | Pass | No hashing, tokens, tests, or route modules found |
| Passwords hashed | Fail | Plaintext passwords in `users` table (expected gap at this stage) |
| Real auth token used | Fail | Username sent as token (expected gap at this stage) |
| CORS restricted | Fail | Open `*` CORS (expected gap at this stage) |
| Tests present | Not applicable | No test files or test runner configured (expected at this stage) |
| Page title set correctly | Fail | `<title>` is "frontend" — Vite default not updated |
