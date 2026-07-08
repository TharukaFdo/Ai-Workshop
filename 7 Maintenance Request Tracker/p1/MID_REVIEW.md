# MID_REVIEW.md — Maintenance Request Tracker
**Review date:** 2026-06-14  
**Stage assessed:** After secondary feature (filter) implementation, before testing, security hardening, and maintainability cleanup.  
**Reviewer note:** Source code read-only. No modifications were made.

---

## 1. Mid-Review Summary

The project is a React + Express + MySQL maintenance request tracker. The core architecture is correctly separated (Vite/React client on port 5173, Express server on port 5001). Login is database-backed with bcrypt password hashing and JWT issuance. The primary workflow (submit → view → update → close) is implemented end-to-end. Role-based protection of the update/close route is enforced server-side. The filter feature (status, priority, location) is implemented in both UI and backend. 

Key gaps before proceeding to testing and security hardening: no server-side ownership check on request creation (requester can submit on behalf of anyone by supplying a different `requester_name`), no requester-scoped list (all authenticated users see all requests), the JWT secret is committed in `.env` with a weak default in code, CORS is fully open (`cors()` with no origin restriction), no rate limiting, no input length/content validation beyond presence checks, no `updated_at` tracking surfaced in the UI, and no structured error responses that a test suite can rely on.

---

## 2. Review Scoring Matrix

| Feature / Area | Functionality 0-5 | Data Persistence 0-5 | Backend Security / Role Control 0-5 | Validation / Error Handling 0-5 | Testing Evidence 0-5 | Maintainability 0-5 | UI / Manual Usability 0-5 | Evidence | Notes |
|---|---:|---:|---:|---:|---:|---:|---:|---|---|
| Project setup and run commands | 4 | 5 | — | — | 1 | 3 | — | `server/package.json` scripts: `start`, `dev`, `db:setup`; `client/package.json` scripts: `dev`, `build` | No root-level `package.json` or `README` with unified start; two separate terminals required. `nodemon` present for dev. No `.env.example`. |
| Database setup and starter data | 5 | 5 | — | — | 1 | 4 | — | `scripts/init-db.js`; `npm run db:setup` | Idempotent: CREATE IF NOT EXISTS, seeds only when tables are empty. Both tables created. Three seed requests and two seed users provided. |
| Login workflow | 5 | 5 | 4 | 3 | 0 | 3 | 4 | `server/index.js` L51-89; `client/src/App.jsx` L120-164 | DB-backed with bcrypt + JWT. Token stored in localStorage. Credentials shown in login UI hint box (acceptable for demo, a concern for production). Generic error message on failure (good). Missing field-level validation messages beyond alert. |
| Role-based access | 4 | — | 4 | 2 | 0 | 3 | 4 | `server/index.js` L181-188; `App.jsx` L409, L610 | PUT `/api/requests/:id` enforces `technician` role server-side. Requester UI hides the technician edit panel. Requester can still call PUT via curl—correctly rejected 403. Gap: `GET /api/requests` returns all records to both roles (no requester-scoped filter). |
| Main create action | 4 | 5 | 3 | 3 | 0 | 3 | 4 | `server/index.js` L150-178; `App.jsx` L174-237 | POST `/api/requests` requires auth (token). Fields: title, description, location, priority, requester_name. Status defaults to `Open`. Validation: presence-only, no length caps. Gap: `requester_name` taken from request body—any logged-in user can impersonate another name; it should be overridden from `req.user`. |
| Main view/list action | 4 | 5 | 3 | 2 | 0 | 3 | 4 | `server/index.js` L114-148; `App.jsx` L68-109 | GET `/api/requests` requires auth. Returns all requests ordered by `created_at DESC`. Gap: no ownership filter—requester sees every request in the system. |
| Main update/status/cancel action | 4 | 5 | 5 | 3 | 0 | 3 | 4 | `server/index.js` L180-235; `App.jsx` L249-301 | PUT `/api/requests/:id` restricted to technician role server-side. Status validated against `['Open', 'In Progress', 'Closed']`. Dynamic field update (status and/or notes). "Closed" UI buttons disabled once closed. Gap: no check that prevents re-opening a closed request from the API. |
| Protected action | 4 | 5 | 5 | 3 | 0 | 3 | 4 | `server/index.js` L186-188; `App.jsx` L610, L629, L636 | Technician-only update enforced with `req.user.role !== 'technician'` → 403. Requester UI does not render the edit/close controls. Close button disabled if already closed. Gap: no separate "close" endpoint—closing is done via the same PUT with `status: 'Closed'`; no server-side guard preventing re-open after close. |
| Secondary feature | 4 | — | 3 | 2 | 0 | 3 | 4 | `server/index.js` L116-148; `App.jsx` L22-24, L73-108, L504-546 | Filter by status, priority (exact match), and location (LIKE search) in backend. Frontend dropdowns trigger re-fetch. Filters applied live via `useEffect`. Gap: location filter uses `LIKE %text%` which works but has no debounce—every keystroke fires a DB query. No "clear filters" button. |
| Case-specific: location, priority, and problem details | 4 | 5 | — | 3 | 0 | 3 | 4 | `init-db.js` L67-80; `App.jsx` L425-478 | All five request fields (title, description, location, priority, requester_name) stored in DB and rendered in UI. Priority shown as colour-coded badge. Location shown per card. Description shown in full. Gap: no input length validation; priority enum validated only in PUT, not in POST. |
| Case-specific: technician notes and progress updates | 4 | 5 | 5 | 3 | 0 | 3 | 4 | `server/index.js` L210-213; `App.jsx` L601-606, L614-623 | `technician_notes` stored in TEXT column. Technician can add/edit via textarea. Requester sees notes read-only on card. Buttons: "Mark In Progress", "Close Request", "Save Notes Only". Gap: no character limit on notes; no timestamp for when notes were last updated (though `updated_at` column exists in DB). |
| Case-specific: request closure protection and requester visibility | 4 | 5 | 5 | 3 | 0 | 3 | 4 | `server/index.js` L186-188; `App.jsx` L629, L636 | Close action blocked for requesters server-side (role check). UI close button disabled when status is already Closed. Requester can see technician notes read-only. Gap: no server-side guard preventing a technician from re-opening a closed request via API; no `closed_at` timestamp. |
| UI/manual usability | 4 | — | — | 3 | 0 | 4 | 4 | `App.jsx`, `App.css` | Dark/light theme via `prefers-color-scheme`. Responsive grid layout. Colour-coded priority and status badges. Stats bar. Loading spinner. Empty state. Success/error banners. Gap: `index.html` title is `client` (not customised). No page-level `<meta description>`. Alert dialogs used for feedback instead of inline messages. |
| Security posture | 2 | — | 3 | 2 | 0 | 2 | — | `server/index.js` L10-12 | JWT secret has weak hardcoded fallback. `.env` committed (no `.gitignore` check here but `.env` is open). CORS is `cors()` with no origin whitelist. No Helmet, no rate limiting. No input sanitisation beyond presence checks. No SQL injection risk (parameterised queries used throughout). |
| Testing evidence | 0 | 0 | 0 | 0 | 0 | 0 | — | No test files found | No test runner configured. No unit, integration, or E2E tests. No test scripts in either `package.json`. No mocking helpers or test fixtures beyond the seed data. |
| Maintainability | 2 | — | — | — | — | 2 | — | `server/index.js`, `client/src/App.jsx` | All server logic in one 242-line file. All React logic and UI in one 668-line `App.jsx` (no component split). No JSDoc or inline API documentation. No `.env.example`. No root-level README. Console.error used for logging (acceptable for prototype). |

---

## 3. Current Feature Status

| Feature | Status |
|---|---|
| Submit maintenance request (title, description, location, priority, name) | ✅ Implemented — POST /api/requests with all 5 fields |
| View submitted requests (list) | ✅ Implemented — GET /api/requests with auth |
| Progress update by technician | ✅ Implemented — PUT /api/requests/:id with role check |
| Close request by technician | ✅ Implemented — via PUT with status: 'Closed', protected server-side |
| Filter by status | ✅ Implemented — query param + backend WHERE clause |
| Filter by priority | ✅ Implemented — query param + backend WHERE clause |
| Filter by location | ✅ Implemented — LIKE search in backend |
| Request statistics dashboard | ✅ Implemented — GET /api/requests/stats |
| Technician notes (add/edit) | ✅ Implemented — included in PUT endpoint, stored in DB |
| Requester read-only view of notes | ✅ Implemented — notes displayed in card for all roles |
| Prevent requester from closing or editing notes | ✅ Implemented — server-side role check; UI hiding as secondary layer |

---

## 4. Database and Persistence Status

| Check | Result |
|---|---|
| MySQL connection uses env vars | ✅ `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME` all used |
| Secrets in React client | ✅ None — React has no DB connection |
| `users` table exists | ✅ Defined in `init-db.js`, columns: id, username, password (hashed), role, created_at |
| `requests` table exists | ✅ Defined in `init-db.js`, columns: id, title, description, location, priority, requester_name, status, technician_notes, created_at, updated_at |
| Repeatable setup command | ✅ `npm run db:setup` in server directory (idempotent) |
| Seed users | ✅ `requester1` / `password123` (requester role), `tech1` / `password123` (technician role) |
| Seed requests | ✅ 3 seed records covering Open, In Progress, and Closed states |
| `updated_at` tracked | ✅ Column exists with `ON UPDATE CURRENT_TIMESTAMP`; not surfaced in UI |
| Passwords hashed | ✅ bcrypt with salt round 10 |

---

## 5. Login and Role/Access Status

| Check | Result |
|---|---|
| Login mechanism | ✅ Database-backed — queries `users` table, compares bcrypt hash, issues JWT |
| Mock-only or role-selector | ❌ Not present — real authentication only |
| JWT issued on login | ✅ 2-hour expiry; contains `id`, `username`, `role` |
| Token stored client-side | ⚠️ `localStorage` (acceptable for prototype; XSS risk in production) |
| Token sent to backend | ✅ `Authorization: Bearer <token>` header on all API calls |
| Role read from token in backend | ✅ `req.user.role` from JWT payload |
| Requester sees only their own requests | ❌ Not implemented — all authenticated users see all requests |
| Technician actions blocked for requesters (server-side) | ✅ PUT route checks `req.user.role !== 'technician'` → 403 |
| Create action requires login | ✅ `authenticateToken` middleware on POST /api/requests |
| List action requires login | ✅ `authenticateToken` middleware on GET /api/requests |
| Stats action requires login | ✅ `authenticateToken` middleware on GET /api/requests/stats |

---

## 6. Protected Action Status

**Protected actions per case brief:** Add or edit technician notes; close requests.

| Check | Result |
|---|---|
| Only technicians can update technician_notes via API | ✅ Role check on PUT `/api/requests/:id` line 186 |
| Only technicians can set status to Closed via API | ✅ Same role check covers status update |
| Requester cannot call PUT endpoint | ✅ Returns 403 with message "Forbidden: Only technicians are authorized to update requests" |
| UI hides edit panel from requesters | ✅ `user?.role === 'technician'` conditional on lines 610 |
| Closed request cannot be re-opened via UI | ✅ "Mark In Progress" and "Close Request" buttons disabled when `req.status === 'Closed'` |
| Closed request cannot be re-opened via API | ❌ No server-side guard — a technician can PUT `status: 'Open'` on a closed request via API |
| Separate endpoint or guard for close action | ❌ Closing is via generic PUT; no dedicated close route or state machine guard |

---

## 7. Validation Status

| Area | Frontend | Backend |
|---|---|---|
| Login — required fields | ✅ HTML `required`; JS check with error message | ✅ 400 if username or password missing |
| Create request — all fields required | ✅ HTML `required`; JS `alert` if any field empty | ✅ 400 with "All fields are required" |
| Create request — priority enum | ✅ Fixed `<select>` prevents invalid value | ❌ Not validated in POST handler |
| Update request — status enum | — | ✅ Validated against `['Open', 'In Progress', 'Closed']` |
| Update request — at least one field | — | ✅ 400 if no fields to update |
| Input length limits | ❌ No `maxlength` attributes | ❌ No length checks |
| SQL injection protection | — | ✅ Parameterised queries throughout |
| XSS protection | ❌ No sanitisation | ❌ No sanitisation (React escapes on render, but stored value is raw) |
| Error response format | ⚠️ Mix of `alert()` and banners | ⚠️ Consistent `{ error: "..." }` JSON shape, but no error codes |

---

## 8. Stage Drift / Early Implementation

| Item | Assessment |
|---|---|
| JWT authentication | Appropriate for this case — not early drift; needed to enforce role-based protection |
| Request statistics dashboard | Minor early addition — not required by the case brief but does not harm the core workflow |
| `updated_at` DB column | Appropriate future-proofing; not surfaced yet |
| Dark mode CSS | Cosmetic extra; does not affect functionality |
| LocalStorage persistence of token/user | Appropriate for prototype; would need `httpOnly` cookie in production |
| No pagination on request list | Expected gap for prototype stage; not drift |
| No routing / multi-page navigation | Expected for single-file prototype; not drift |

No significant stage drift was detected. The AI did not implement testing infrastructure, security hardening, or maintainability tooling ahead of schedule.

---

## 9. Issues Found Before Stage 8 (Testing, Security, Maintainability)

### Critical
| # | Issue | Location |
|---|---|---|
| C1 | `requester_name` in POST body is not overridden from `req.user.username` — any authenticated user can submit requests under another person's name | `server/index.js` L152, L169 |
| C2 | JWT secret has a hardcoded weak fallback `'supersecretkeyformaintenanceapp'` — if `JWT_SECRET` env var is missing, server starts with a known secret | `server/index.js` L10 |
| C3 | CORS configured with `cors()` and no origin whitelist — any origin can call the API | `server/index.js` L12 |

### High
| # | Issue | Location |
|---|---|---|
| H1 | All authenticated users (including requesters) can retrieve all requests via GET `/api/requests` — no ownership scoping | `server/index.js` L115 |
| H2 | No server-side guard prevents a technician from re-opening a closed request via API (`status: 'Closed'` → `status: 'Open'`) | `server/index.js` L195-234 |
| H3 | No rate limiting on login endpoint — brute force risk | `server/index.js` L51 |
| H4 | `priority` enum not validated in POST handler — any string can be stored as priority | `server/index.js` L151-177 |

### Medium
| # | Issue | Location |
|---|---|---|
| M1 | No input length validation on any field (title, description, location, requester_name, technician_notes) | Both files |
| M2 | Location filter fires a DB query on every keystroke — no debounce | `App.jsx` L117 (useEffect dependency) |
| M3 | `index.html` title is `client` — not set to application name | `client/index.html` L7 |
| M4 | Login page shows exact demo credentials in the UI — acceptable in dev, risky if deployed | `App.jsx` L357-361 |
| M5 | Token stored in `localStorage` instead of `httpOnly` cookie — XSS risk | `App.jsx` L145-146 |
| M6 | No `.env.example` file — new developer must infer required vars from source code | `server/` |

### Low
| # | Issue | Location |
|---|---|---|
| L1 | `updated_at` column exists in DB but is never shown in the UI | `App.jsx` card footer only shows `created_at` |
| L2 | No "clear filters" button — user must reset each filter manually | `App.jsx` L504-546 |
| L3 | Feedback on technician save uses `alert()` instead of inline notification | `App.jsx` L297 |
| L4 | All server logic in one file; all React logic and UI in one file | `server/index.js`, `App.jsx` |
| L5 | No root-level README with unified start instructions | Project root |

---

## 10. Manual Checks Recommended Next

1. **Start both servers** (`npm run dev` in `client/`, `npm start` in `server/`) and confirm both run without errors.
2. **Run `npm run db:setup`** in `server/` on a fresh database and verify all tables and seed data are created.
3. **Login as `requester1`** and confirm the submit form is visible and a new request can be created.
4. **Login as `tech1`** and confirm the technician edit panel appears on each request card.
5. **Attempt to close a request as `requester1`** via the UI — confirm the close controls are absent.
6. **Attempt PUT `/api/requests/1`** with a requester JWT (via curl or Postman) — confirm 403 is returned.
7. **Attempt PUT `/api/requests/1` with `status: 'Open'`** using a technician JWT on a closed request — confirm whether this is accepted or rejected (currently accepted; expected gap).
8. **Submit a request with a missing field** (e.g., empty title) — confirm the 400 error is returned and displayed.
9. **Apply all three filters simultaneously** and confirm the request list updates correctly.
10. **Try an invalid priority string** (e.g., `"Urgent"`) via POST — confirm whether it is accepted or rejected.
11. **Check browser localStorage** after login — confirm the JWT is stored and the user object is present.
12. **Verify the stats bar** updates after submitting a new request or closing one.
13. **Check dark mode** by switching the OS theme — confirm the UI adapts.

---

## 11. Pass / Fail Table

| Check | Result |
|---|---|
| App appears runnable (separate start commands exist, node_modules present) | ✅ Pass |
| React frontend and Express backend are separated | ✅ Pass — `client/` (Vite/React, port 5173) and `server/` (Express, port 5001) |
| React calls Express routes and never connects to MySQL directly | ✅ Pass — all DB access is in `server/index.js` |
| Backend uses DB_HOST, DB_PORT, DB_USER, DB_PASSWORD, DB_NAME | ✅ Pass — all five vars used in pool config |
| No secrets in React | ✅ Pass — React has no DB credentials |
| `users` table exists | ✅ Pass — defined in `init-db.js` |
| `requests` table exists | ✅ Pass — defined in `init-db.js` |
| Repeatable database setup/seed command | ✅ Pass — `npm run db:setup` (idempotent) |
| Login is database-backed | ✅ Pass — bcrypt + JWT, not mock or role-selector |
| Role restrictions enforced in backend (not only UI) | ✅ Pass — PUT route has server-side role check |
| Technician notes protected (add/edit) | ✅ Pass — backend role check; gap: no closed-state re-open guard |
| Close request protected | ✅ Pass — backend role check; gap: no re-open guard after close |
| Requester visibility of notes is read-only | ✅ Pass — notes displayed, edit controls hidden |
| Users limited to own records where relevant | ❌ Fail — requesters see all requests (no ownership scope on list) |
| `requester_name` bound to authenticated user | ❌ Fail — taken from POST body, not overridden from JWT |
| Main create/view/update/close workflow implemented | ✅ Pass |
| Filter by location, priority, status implemented | ✅ Pass |
| Validation present (presence checks) | ✅ Pass (partial) |
| Priority enum validated in POST | ❌ Fail — not checked in create handler |
| No early stage drift detected | ✅ Pass |
| No tests implemented | ✅ Pass (expected at this stage; no premature test scaffolding) |
