# FINAL_REVIEW.md — Maintenance Request Tracker
**Review date:** 2026-06-14  
**Stage assessed:** Final — after Stage 11 testing, security hardening, and maintainability cleanup.  
**Reviewer note:** All findings are based on direct inspection of project source files. No source code was modified during this review.

---

## 1. Final Feature Summary

The Maintenance Request Tracker is a full-stack web prototype built with **React 19 + Vite** (client, port 5173) and **Node.js + Express 4** (server, port 5001) backed by a **MySQL** database. The application implements a two-role system — **requester** and **technician** — with JWT-based authentication, bcrypt password hashing, and server-side role enforcement.

| Feature | Status |
|---|---|
| Submit maintenance request (title, description, location, priority, name) | ✅ Implemented — POST `/api/requests` |
| View list of all submitted requests | ✅ Implemented — GET `/api/requests` with auth |
| Progress update by technician (status + notes) | ✅ Implemented — PUT `/api/requests/:id` with role check |
| Close request by technician | ✅ Implemented — via PUT `status: 'Closed'`, server-side protected |
| Filter by status, priority, location | ✅ Implemented — query params + backend WHERE clause |
| Request statistics dashboard (total / open / in progress / closed) | ✅ Implemented — GET `/api/requests/stats` |
| Technician notes (add / edit per card) | ✅ Implemented — stored as TEXT in DB |
| Requester read-only view of technician notes | ✅ Implemented — rendered on every card regardless of role |
| Prevent requester from closing or editing notes | ✅ Implemented — server-side 403; UI hides controls |
| Urgent-request closure guard (High priority requires notes) | ✅ Implemented — server-side + client-side guard |
| Closed-ticket lock (no further modifications) | ✅ Implemented — server-side check returns 400 on any PUT to Closed request |
| `is_urgent` flag computed and stored at creation | ✅ Implemented — `priority === 'High'` sets flag; rendered as pulsing badge |
| Automated integration test suite | ✅ Implemented — `server/scripts/test-app.js` (8 test groups) |
| Test data cleanup | ✅ Implemented — DELETE by ID in `finally` block |
| Dark / light mode responsive UI | ✅ Implemented — CSS `prefers-color-scheme` media query |

---

## 2. Review Scoring Matrix

> **Score scale:** 0 = absent/broken · 1 = skeleton/stub · 2 = partial/major gaps · 3 = works with gaps · 4 = solid with minor gaps · 5 = complete and hardened

| Feature / Area | Functionality 0-5 | Data Persistence 0-5 | Backend Security / Role Control 0-5 | Validation / Error Handling 0-5 | Testing Evidence 0-5 | Maintainability 0-5 | UI / Manual Usability 0-5 | Evidence | Notes |
|---|---:|---:|---:|---:|---:|---:|---:|---|---|
| Project setup and run commands | 4 | 5 | — | — | 3 | 3 | — | `server/package.json` scripts: `start`, `dev`, `db:setup`, `test`; `client/package.json`: `dev`, `build` | No root-level README or unified launcher; two terminals required. No `.env.example`. `node_modules` present in both dirs. |
| Database setup and starter data | 5 | 5 | — | — | 4 | 4 | — | `scripts/init-db.js`; `npm run db:setup` | Idempotent DROP + CREATE + conditional seed. Two users, three requests seeded. bcrypt hashing applied at seed time. |
| Login workflow | 5 | 5 | 4 | 3 | 4 | 3 | 4 | `server/index.js` L51-88; `App.jsx` L120-164 | DB-backed login, bcrypt compare, JWT issued (2h). Token in localStorage. Generic error message on failure. Demo credentials visible in login UI hint box. Missing: field-level inline validation messages. |
| Role-based access | 4 | — | 5 | 3 | 4 | 3 | 4 | `server/index.js` L152-154, L204-206; `App.jsx` L418, L624 | POST restricted to `requester`; PUT restricted to `technician` — both enforced server-side. Test suite verifies both 403 paths. UI conditionally renders role-specific sections. Gap: all authenticated users see all requests (no ownership scope on list). |
| Main create action | 4 | 5 | 4 | 4 | 4 | 3 | 4 | `server/index.js` L150-196; `App.jsx` L174-237 | All five fields stored in DB. Presence + trim validation. Priority enum validated server-side (Low/Medium/High only). `is_urgent` computed at insert. Gap: `requester_name` comes from POST body, not overridden from `req.user.username`. |
| Main view/list action | 4 | 5 | 3 | 2 | 3 | 3 | 4 | `server/index.js` L114-147; `App.jsx` L68-109 | GET requires auth token. Returns all requests sorted newest-first. Gap: no requester-scoped ownership filter (both roles see every record). |
| Main update/status/cancel action | 5 | 5 | 5 | 4 | 5 | 3 | 4 | `server/index.js` L199-268; `App.jsx` L249-310 | PUT requires technician role. Status validated against enum. Dynamic field build (notes and/or status). Returns updated record. Closed-ticket lock enforced server-side. Test verifies technician update path and requester block. |
| Protected action | 5 | 5 | 5 | 4 | 5 | 3 | 4 | `server/index.js` L204-206, L222-234; `App.jsx` L640-663 | Technician role check guards all modifications. Closed-ticket lock prevents any further state changes. Urgent closure requires non-empty notes (server + client). Test verifies: (a) requester blocked 403, (b) urgent close without notes blocked 400, (c) closed ticket re-modification blocked 400. |
| Secondary feature | 4 | — | 3 | 2 | 3 | 3 | 4 | `server/index.js` L115-147; `App.jsx` L22-24, L73-108, L514-556 | Filter by status (exact), priority (exact), location (LIKE) applied in backend. Frontend dropdowns and text input re-fetch via `useEffect`. Stats endpoint returns live aggregate counts. Gap: no debounce on location search; no "clear all filters" button. |
| Case-specific: location, priority, and problem details | 4 | 5 | — | 4 | 4 | 3 | 4 | `init-db.js` L75-89; `server/index.js` L156-172; `App.jsx` L434-487 | All five fields (title, description, location, priority, requester_name) stored in DB and rendered per card. Priority colour-coded badge (red/amber/green). Priority enum validated server-side in POST. `is_urgent` flag stored and displayed as pulsing badge. Gap: no `maxlength` on text inputs. |
| Case-specific: technician notes and progress updates | 4 | 5 | 5 | 4 | 5 | 3 | 4 | `server/index.js` L201, L244-248; `App.jsx` L616-662 | Notes stored in TEXT column. Technician can add/append via textarea. Three action buttons: "Mark In Progress", "Close Request", "Save Notes Only". Notes always visible to requester as read-only. Test verifies note persistence after update. Gap: no character limit; `updated_at` exists in DB but not displayed in UI. |
| Case-specific: request closure protection and requester visibility | 5 | 5 | 5 | 4 | 5 | 3 | 4 | `server/index.js` L204-206, L222-225; `App.jsx` L640-654 | Close action blocked for requesters server-side (403). Closed-ticket lock prevents re-modification by anyone (400). Requester UI: edit/close controls absent (conditional render). Requester still sees technician notes read-only. Test verifies: requester blocked, closed-ticket lock enforced, urgent note requirement. |
| UI/manual usability | 4 | — | — | 3 | 0 | 4 | 4 | `App.jsx`, `App.css`, `index.html` | Dark/light responsive layout. Stats bar, priority badges, status badges, spinner, empty state, success/error banners. `index.html` title still reads `client` (not customised). No `<meta description>`. Technician save feedback uses `alert()` instead of inline toast. No automated UI tests. |
| Security posture | 3 | — | 3 | 3 | 3 | 3 | — | `server/index.js` L10-25; `server/.env` | Parameterised queries (no SQL injection risk). bcrypt hashing. JWT auth on all data routes. Gap: JWT secret in `.env` is the same weak string as the code fallback — no upgrade. CORS still `cors()` with no origin whitelist. No Helmet, no rate limiting on login. Token in `localStorage` (XSS risk). `.env` is not in the server-side `.gitignore`. |
| Testing evidence | 4 | 4 | 5 | 4 | 4 | 3 | — | `server/scripts/test-app.js` (278 lines); `npm test` | 8 sequential integration test groups. Covers: login rejection, role blocks (403), priority validation (400), MySQL write verification (direct query), `is_urgent` flag, progress update, urgent-closure note gate (400), closed-ticket lock (400), stats endpoint, filter query. Test data created and cleaned up (DELETE in `finally`). No unit tests; no test framework (Jest/Vitest). |
| Maintainability | 3 | — | — | — | — | 3 | — | `server/index.js` (273 lines), `App.jsx` (682 lines) | All server logic in one file. All React logic and UI in one file (no component split). No JSDoc. No `.env.example`. No root-level README. `console.error` for error logging (acceptable for prototype). Named npm scripts for all operations. |

---

## 3. Project Structure and Run Commands

```
p1/
├── Case_Brief.md               # Project requirements document
├── MID_REVIEW.md               # Mid-project review (Stage 7)
├── FINAL_REVIEW.md             # This document
│
├── client/                     # React 19 + Vite frontend
│   ├── index.html              # App HTML shell (title: "client" — not customised)
│   ├── vite.config.js          # Vite config (no proxy configured)
│   ├── package.json            # Scripts: dev, build, lint, preview
│   ├── eslint.config.js
│   └── src/
│       ├── main.jsx            # React entry point (StrictMode)
│       ├── App.jsx             # Single-component app (682 lines)
│       ├── App.css             # All styling (699 lines, CSS variables, dark mode)
│       └── index.css           # Body/reset styles
│
└── server/                     # Node.js + Express backend
    ├── index.js                # All Express routes (273 lines)
    ├── .env                    # DB credentials + JWT_SECRET (committed, not gitignored)
    ├── package.json            # Scripts: start, dev, db:setup, test
    └── scripts/
        ├── init-db.js          # Database initialiser + seed (141 lines)
        └── test-app.js         # Integration test suite (278 lines)
```

### Run Commands

| Action | Directory | Command |
|---|---|---|
| Initialise database and seed data | `server/` | `npm run db:setup` |
| Start backend (production) | `server/` | `npm start` |
| Start backend (dev with reload) | `server/` | `npm run dev` |
| Start frontend dev server | `client/` | `npm run dev` |
| Run automated test suite | `server/` | `npm test` |
| Build frontend for production | `client/` | `npm run build` |

> **Note:** No root-level `package.json` or launcher script exists. Both terminals must be started independently.

---

## 4. Frontend / Backend Separation Check

| Check | Result |
|---|---|
| React and Express in separate directories | ✅ `client/` and `server/` — fully separated |
| React has its own `package.json` and `node_modules` | ✅ Confirmed |
| Express has its own `package.json` and `node_modules` | ✅ Confirmed |
| React calls Express via HTTP (fetch) | ✅ All API calls use `fetch('http://localhost:5001/api/...')` |
| React imports `mysql2` or any DB driver | ✅ None — `client/package.json` has no DB dependency |
| Express imports React or Vite | ✅ None — `server/package.json` has no frontend dependency |
| Vite proxy configured | ❌ Not configured — API URL is hardcoded as `http://localhost:5001` in `App.jsx` |
| No MySQL connection in any client file | ✅ Confirmed — DB access exists only in `server/index.js` and `server/scripts/` |

**Verdict:** React and Express are cleanly separated. React never connects to MySQL directly.  
**Gap noted:** The API base URL `http://localhost:5001` is hardcoded in eight places across `App.jsx`. A Vite proxy or an environment variable (`VITE_API_URL`) would be the maintainable approach.

---

## 5. Database Setup and Table Summary

### Connection Configuration

The Express server connects to MySQL using a connection pool (`mysql2/promise`). All five standard variables are read from the `.env` file:

| Variable | Configured in `.env` | Value (summary) |
|---|---|---|
| `DB_HOST` | ✅ Yes | `localhost` |
| `DB_PORT` | ✅ Yes | `3306` |
| `DB_USER` | ✅ Yes | `root` |
| `DB_PASSWORD` | ✅ Yes | Set (not printed) |
| `DB_NAME` | ✅ Yes | `c7p1` |

### Tables

| Table | Purpose | Key Columns |
|---|---|---|
| `users` | Stores login accounts | `id`, `username` (UNIQUE), `password` (bcrypt hash), `role` (`requester`\|`technician`), `created_at` |
| `requests` | Stores maintenance requests | `id`, `title`, `description`, `location`, `priority`, `requester_name`, `status`, `technician_notes`, `is_urgent`, `created_at`, `updated_at` |

A `users` table **exists** and is used for real authentication. Both tables use `InnoDB` with `utf8mb4` charset.

### Recreating Tables and Seed Data

Run `npm run db:setup` in the `server/` directory. The script (`scripts/init-db.js`) will:
1. Connect to MySQL server (no database selected).
2. Create database `c7p1` if not present.
3. **Drop** both `requests` and `users` tables unconditionally, then re-create them with the current schema.
4. Seed two users (`requester1` / `tech1`, both with `password123`, bcrypt-hashed) if the users table is empty.
5. Seed three demo requests (Open, In Progress, Closed) if the requests table is empty.

> **Warning:** The DROP TABLE step is destructive. Running `db:setup` on a live database will erase all existing data.

---

## 6. Login and Role / Access Explanation

### How Users Log In

1. User submits username + password to `POST /api/auth/login`.
2. Server queries `SELECT * FROM users WHERE username = ?`.
3. `bcrypt.compare()` verifies the password against the stored hash.
4. On success: a JWT is signed with `{ id, username, role }`, 2-hour expiry.
5. Client stores the JWT in `localStorage` and the user object in `localStorage` (as JSON).
6. All subsequent API calls include `Authorization: Bearer <token>`.

### How Roles Are Checked

- The `authenticateToken` middleware (`server/index.js` L28-43) verifies the JWT on every protected route and attaches `req.user`.
- `req.user.role` is read from the JWT payload (not from the database on each request).
- **POST `/api/requests`** — enforces `req.user.role !== 'requester'` → 403.
- **PUT `/api/requests/:id`** — enforces `req.user.role !== 'technician'` → 403.
- **GET `/api/requests`** and **GET `/api/requests/stats`** — require a valid token but do not filter by role.

### Requester Visibility of Own Records

Requesters see **all** requests in the system, not just their own. The `GET /api/requests` route has no `WHERE requester_name = req.user.username` clause. This is a known, documented limitation from the Mid Review (issue H1). It was not resolved in the final stages.

---

## 7. Protected Action Explanation

**Protected actions per case brief:** Add or edit technician notes; close a request.

### Server-Side Guards on `PUT /api/requests/:id`

| Guard | Code Location | Behaviour |
|---|---|---|
| Role check | `server/index.js` L204-206 | Returns 403 if `req.user.role !== 'technician'` |
| Request existence | `server/index.js` L215-218 | Returns 404 if the ID does not exist |
| Closed-ticket lock | `server/index.js` L222-225 | Returns 400 if current status is already `Closed` — prevents any further modification by **anyone** including technicians |
| Urgent-closure note gate | `server/index.js` L228-234 | Returns 400 if closing a High-priority or `is_urgent = 1` request with empty `technician_notes` |
| Status enum validation | `server/index.js` L209-211 | Returns 400 for any status value outside `['Open', 'In Progress', 'Closed']` |

### Client-Side Guards (Secondary Layer)

- The technician edit panel is **not rendered** for `user.role === 'requester'` (`App.jsx` L624).
- "Mark In Progress" and "Close Request" buttons are `disabled` when `req.status === 'Closed'` (`App.jsx` L643, L651).
- Client validates notes before sending the close request (`App.jsx` L255-259).

> **Important gap:** Once a request is `Closed`, the closed-ticket lock prevents **re-opening** via the API (status cannot change from `Closed` to anything else). This is correct locking behaviour. There is no dedicated `/close` endpoint — closing is via the generic PUT endpoint.

---

## 8. Validation Summary

| Field / Rule | Frontend | Backend |
|---|---|---|
| Login — username and password required | ✅ JS check + error banner | ✅ 400 if either field missing |
| Create — all 5 fields required | ✅ HTML `required`; JS presence check → `alert()` | ✅ 400 "All fields are required and cannot be empty" |
| Create — fields trimmed before check | ❌ Not trimmed client-side | ✅ `title?.trim()` applied server-side before check |
| Create — priority enum (Low/Medium/High) | ✅ Fixed `<select>` prevents invalid entry | ✅ Validated against `['Low', 'Medium', 'High']` → 400 (added post-mid review) |
| Update — at least one field required | — | ✅ 400 "No fields to update" |
| Update — status enum | — | ✅ Validated against `['Open', 'In Progress', 'Closed']` → 400 |
| Urgent closure — notes required | ✅ Client `alert()` before submit | ✅ 400 "Urgent requests cannot be closed without technician notes" |
| Closed-ticket lock | ✅ Buttons `disabled` in UI | ✅ 400 "Cannot modify a request that has already been Closed" |
| Input length limits | ❌ No `maxlength` attributes | ❌ No server-side length checks |
| SQL injection protection | — | ✅ Parameterised queries (`mysql2` `?` placeholders) throughout |
| XSS protection | ⚠️ React escapes on render; raw values stored in DB | ❌ No server-side sanitisation library (e.g., DOMPurify) |
| Error response format | ⚠️ Mix of `alert()` and banner elements | ✅ Consistent `{ error: "..." }` JSON shape on all error paths |

---

## 9. Automated and Manual Testing Summary

### Automated Test Suite

**Command:** `npm test` (in `server/` directory)  
**File:** `server/scripts/test-app.js` (278 lines)  
**Framework:** None — raw Node.js with `fetch` and `mysql2/promise`. No Jest, no Vitest.

#### Test Groups and What Each Checks

| Group | Description | Expected Result Checked |
|---|---|---|
| [1/8] DB Connection | Connects to MySQL before running any test | Connection established |
| [2/8] Login | Invalid password → 401; `requester1` login → token; `tech1` login → token | Status codes + token presence |
| [3/8] Create Security + Persistence | Technician blocked from POST → 403; invalid priority → 400; valid requester POST → 201 + DB direct query + `is_urgent = 1` | Status codes + MySQL direct read |
| [4/8] Permission Restriction | Requester calls PUT → 403 | Status code 403 |
| [5/8] Technician Progress Update | Technician updates status to "In Progress" with notes → 200 | Response OK |
| [6/8] Urgent Closure Gate | Close with empty notes → 400; close with valid notes → 200 + `status === 'Closed'` | Status codes + response body |
| [7/8] Closed-Ticket Lock | Technician tries to update already-closed request → 400 | Status code 400 |
| [8/8] Filters and Stats | GET `/api/requests/stats` → `total` is number; GET with `status=Closed&location=Test` contains the test record | Response shape + data |

#### Test Data Lifecycle

- Test request created in group [3/8] with title `TEST_REQUEST_DO_NOT_DELETE_YET`.
- `createdRequestId` tracked throughout all groups.
- On completion or failure, the `finally` block issues `DELETE FROM requests WHERE id = ?` to remove the test record.
- Cleanup is **always executed** regardless of test pass/fail.
- Seed data (`init-db.js`) is not touched by the test suite.

### What Is Not Automated

| Area | Status |
|---|---|
| UI/browser interaction tests | ❌ Not automated — no Playwright, Cypress, or Puppeteer |
| Unit tests for validation helpers | ❌ Not automated — no isolated unit tests |
| Filter-specific tests (priority, location-only) | ⚠️ Partial — only one combined filter test |
| Stats accuracy after create/close | ⚠️ Stats checked for shape; values not asserted against expected counts |
| Token expiry or invalid token path | ❌ Not tested |
| Missing-field create validation (empty title, etc.) | ❌ Not tested — only priority validation is tested |

---

## 10. Stage 11 Change Summary

The following changes were introduced after the Mid Review (Stage 7 / Stage 10 boundary):

| Change | Evidence |
|---|---|
| **Priority enum validated in POST handler** | `server/index.js` L170-172 — `!['Low', 'Medium', 'High'].includes(priority)` → 400. This was listed as issue H4 in MID_REVIEW.md. |
| **Closed-ticket lock added to PUT handler** | `server/index.js` L222-225 — checks `currentRequest.status === 'Closed'` → 400. Resolves issue H2 (partial — re-open prevented for everyone, not just requesters). |
| **Urgent-closure note gate added** | `server/index.js` L228-234 — checks `priority === 'High'` or `is_urgent === 1` and rejects close without notes. This is a new protection not present at Mid Review. |
| **Automated integration test suite created** | `server/scripts/test-app.js` — 278-line test suite covering all 8 groups listed above. Resolves the `Testing evidence: 0` score from Mid Review. |
| **`npm test` script added to `server/package.json`** | `package.json` L10 — `"test": "node scripts/test-app.js"`. |
| **`db:setup` script formalised** | `package.json` L9 — `"db:setup": "node scripts/init-db.js"`. Was present at Mid Review but worth confirming. |
| **`is_urgent` flag added to schema, seed, and UI** | `init-db.js` L85, `server/index.js` L174; `App.jsx` L595-597 — `is_urgent` column stored and rendered as pulsing 🚨 URGENT badge. |
| **Input trimming on POST body** | `server/index.js` L159-162 — `title?.trim()`, `description?.trim()`, etc. applied before presence check. |

---

## 11. Stage Drift and Early Work

| Item | Assessment |
|---|---|
| JWT authentication | Not drift — required from Stage 1 to enforce role protection |
| Request statistics dashboard (`/api/requests/stats`) | Minor early addition — not in case brief; does not affect correctness |
| `is_urgent` column and pulsing badge | Reasonable interpretation of "High priority" — not explicitly required but consistent with brief intent |
| `updated_at` column in DB | Appropriate future-proofing; never surfaced in UI — no drift |
| Dark mode CSS | Cosmetic extra; no functional impact |
| Three seed requests (Open, In Progress, Closed) | Appropriate for demo; not drift |
| Demo credentials shown in login UI | Intentional for prototype; would be removed for production |

**No significant stage drift detected.** The test suite and security guards were added in the correct final stages. Nothing that should have been deferred was built early, and nothing is missing that was expected before testing stage.

---

## 12. Security Risks and Exposed-Secret Check

| Risk | Severity | Evidence | Status |
|---|---|---|---|
| `JWT_SECRET` is hardcoded in `.env` as the same weak string as the code fallback | **High** | `server/.env` L7; `server/index.js` L10 | ⚠️ Not resolved — secret was set at build time and never rotated to a strong random value |
| `.env` file is **not excluded from version control** — no `server/.gitignore` exists | **High** | Only `client/.gitignore` exists; `server/` has no `.gitignore` | ⚠️ If committed to Git, DB credentials and JWT secret are exposed |
| CORS configured with `cors()` and no origin whitelist | **Medium** | `server/index.js` L12 | ⚠️ Not resolved — any origin can call the API |
| No `helmet` middleware | **Medium** | `server/package.json` — `helmet` not listed as dependency | ⚠️ Missing security headers (CSP, X-Frame-Options, etc.) |
| No rate limiting on `/api/auth/login` | **Medium** | `server/index.js` L51 — no limiter middleware | ⚠️ Brute-force login attack is possible |
| JWT token stored in `localStorage` | **Low** | `App.jsx` L145-146 | ⚠️ XSS risk; `httpOnly` cookie preferred for production |
| Demo passwords displayed in login UI hint box | **Low** | `App.jsx` L368-370 | ⚠️ Acceptable for local prototype; risky if deployed |
| `DB_PASSWORD` is empty string in `.env` | **Info** | `server/.env` L4 | ℹ️ Root with no password — expected for local dev; unacceptable for any shared environment |

> **Password not printed.** All sensitive values were inspected for key presence only. The `DB_PASSWORD` field is present and configured; its value is not reproduced here.

---

## 13. Documentation / Code Mismatches

| Item | MID_REVIEW.md claim | Current code | Match? |
|---|---|---|---|
| Priority enum not validated in POST | ❌ "Not validated in POST handler" | ✅ Now validated (`server/index.js` L170-172) | ⚠️ MID_REVIEW reflects pre-Stage 11 state — expected |
| No closed-ticket re-open guard | ❌ "No server-side guard prevents re-opening" | ✅ Closed-ticket lock added (`server/index.js` L222-225) | ⚠️ MID_REVIEW reflects pre-Stage 11 state — expected |
| Testing evidence score: 0 | "No test files found" | ✅ Test suite exists in `server/scripts/test-app.js` | ⚠️ MID_REVIEW reflects pre-Stage 11 state — expected |
| `index.html` title is "client" | ❌ Issue M3 noted | ❌ Still reads `<title>client</title>` | ✅ Mismatch persists — not fixed in final stage |
| No `.env.example` | ❌ Issue M6 noted | ❌ Still absent | ✅ Mismatch persists — not fixed in final stage |
| `requester_name` not bound to JWT user | ❌ Issue C1 noted | ❌ Still taken from POST body | ✅ Mismatch persists — not fixed in final stage |
| All requests visible to requesters (no ownership scope) | ❌ Issue H1 noted | ❌ Still returns all records to all roles | ✅ Mismatch persists — not fixed in final stage |

**Summary:** The Mid Review accurately captured all pre-Stage 11 gaps. Four of the seven issues flagged were resolved in Stage 11 (priority validation, closed-ticket lock, urgent note gate, test suite). Three remain unresolved: `index.html` title, `.env.example` absence, `requester_name` identity binding, and ownership scoping.

---

## 14. Known Limitations

| # | Limitation | Impact |
|---|---|---|
| L1 | `requester_name` in POST body is not overridden from `req.user.username` — any authenticated user can impersonate another name | Medium — data integrity gap |
| L2 | All authenticated users (requesters and technicians) see all requests — no ownership scoping on GET `/api/requests` | Medium — privacy gap |
| L3 | API base URL (`http://localhost:5001`) hardcoded in 8 places in `App.jsx` | Medium — breaks if port changes; not environment-driven |
| L4 | No Vite proxy — CORS must remain open for dev to work | Medium — coupling between dev and production config |
| L5 | No input length validation (no `maxlength` in HTML; no length checks in backend) | Medium — oversized inputs can reach the DB |
| L6 | No rate limiting on login endpoint | Medium — brute-force risk |
| L7 | JWT secret in `.env` matches the weak code fallback; no `server/.gitignore` to exclude `.env` | High for production — secret exposed if committed |
| L8 | `updated_at` column exists in DB but is never shown in the UI | Low — information available but not surfaced |
| L9 | Location filter fires a DB query on every keystroke (no debounce) | Low — excessive DB load with fast typing |
| L10 | No "clear all filters" button in UI | Low — minor UX friction |
| L11 | Technician update feedback uses browser `alert()` instead of inline toast | Low — poor UX |
| L12 | `index.html` title reads `client` (Vite default) — not set to application name | Low — SEO and browser tab label incorrect |
| L13 | No `.env.example` file | Low — new developer must infer vars from source |
| L14 | All server logic in one 273-line file; all React logic in one 682-line file | Low for prototype — scalability concern |
| L15 | No test framework (Jest/Vitest) — test suite uses raw Node.js with no assertion library | Low — test failure messages are less descriptive |

---

## 15. Demo Script

**Prerequisites:** MySQL running locally; `npm run db:setup` completed in `server/`; `npm start` running in `server/`; `npm run dev` running in `client/`.

---

### Step 1 — Login as Requester

1. Open `http://localhost:5173` in a browser.
2. Enter username `requester1`, password `password123`.
3. Click **Log In**.
4. **Show:** The dashboard loads. The header shows "requester1 / requester". The submit form is visible on the left. The stats bar shows totals.

---

### Step 2 — Submit a New Maintenance Request

1. In the submit form, fill in:
   - Problem Title: `Broken light in corridor`
   - Location / Room: `3rd Floor East Wing`
   - Priority: `High`
   - Detailed Description: `The main light fitting has failed and the corridor is dark.`
2. Click **Submit Request**.
3. **Show:** The success banner appears ("✓ Request successfully submitted and saved to MySQL!"). The new card appears at the top of the list with a red `HIGH` badge and a pulsing 🚨 URGENT badge. The stats bar increments.

---

### Step 3 — Show Read-Only Visibility (as Requester)

1. Scroll through the request cards.
2. **Show:** No edit controls are visible on any card for the requester role. Technician notes from seed data are visible as read-only text.
3. Attempt to close a request — **show** there is no close button available.

---

### Step 4 — Apply Filters

1. Set the Status filter to `Open` — list filters to open requests only.
2. Set Priority to `High` — list narrows further.
3. Type `3rd Floor` in the Location Search — shows only the newly created request.
4. Clear the filters back to defaults — full list returns.

---

### Step 5 — Log Out and Log In as Technician

1. Click **Log Out**. Returns to login screen.
2. Enter username `tech1`, password `password123`. Click **Log In**.
3. **Show:** Header shows "tech1 / technician". The left panel now shows the "Technician Portal" welcome card instead of the submit form.

---

### Step 6 — Technician Updates Progress and Notes

1. Find the "Broken light in corridor" card (the one just submitted, marked URGENT).
2. In the "Technician Notes" textarea, type: `Inspected — bulb blown, replacement ordered.`
3. Click **Mark In Progress**.
4. **Show:** The card status badge changes to `In Progress`. The notes are saved and visible.

---

### Step 7 — Close the Urgent Request (Note Gate Demonstration)

1. Clear the technician notes field on the same card (erase the text).
2. Click **Close Request**.
3. **Show:** An alert appears — "Error: Urgent requests cannot be closed without technician notes." The request remains In Progress.
4. Re-enter notes: `Replacement bulb fitted and tested. Light confirmed working.`
5. Click **Close Request**.
6. **Show:** The card status badge changes to `Closed`. Both "Mark In Progress" and "Close Request" buttons are now disabled.

---

### Step 8 — Security Demo (API-Level Block)

Open a terminal and run:
```bash
# Attempt to create a request as technician (should be blocked)
curl -X POST http://localhost:5001/api/requests \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <tech_token>" \
  -d '{"title":"test","description":"test","location":"x","priority":"Low","requester_name":"tech1"}'
# Expected: 403 Forbidden
```
**Show:** The API returns `{"error":"Forbidden: Only technicians are authorized to update requests"}` (note: for the create path it returns the requester-only message).

---

### Step 9 — Run Automated Tests

```bash
cd server
npm test
```
**Show:** All 8 test groups pass, test data is cleaned up, "✓ ALL TESTS PASSED SUCCESSFULLY!" is printed.

---

## 16. Suggested Viva Questions

### Architecture
1. Why are the React client and Express server in separate directories with separate `package.json` files? What problem does this solve?
2. Where is the MySQL connection made in this project — in the client or the server? Walk through the code that establishes the connection.
3. What is a connection pool, and why is `mysql.createPool` used instead of `mysql.createConnection`?
4. The Vite config has no proxy. How does the React client reach the Express server? What would break if you changed the server port to 3000?

### Authentication and Security
5. Explain exactly what happens on the server between receiving a login POST request and returning a token. Name every library used.
6. What is bcrypt and why is `bcrypt.compare()` used instead of comparing passwords directly?
7. What is a JWT? What data is stored in the payload of this project's tokens, and how does the server verify a token on each request?
8. Why is storing the JWT in `localStorage` a security concern? What would be the more secure alternative?
9. The `JWT_SECRET` in `.env` is the same string as the code fallback. Why is this a risk? What should be done to fix it?
10. There is no `server/.gitignore`. What would happen if this project were pushed to a public GitHub repository?

### Role-Based Access
11. How does the server know whether the logged-in user is a requester or a technician? Point to the exact line in `server/index.js`.
12. If a technician sends a POST request to `/api/requests`, what response will they get? Where is that decision made?
13. If a requester sends a PUT request to `/api/requests/5` using a valid JWT, what happens? Walk through the code path.
14. What is the difference between the UI hiding the close button and the server enforcing the role check? Which one matters more and why?

### Protected Action and Case-Specific Logic
15. The case brief says "requesters should not be able to close requests." Show every line of code that enforces this rule.
16. What happens if a technician tries to close a High-priority request without entering notes? Which file handles this check first — client or server?
17. What does the `is_urgent` flag represent? How is it set, where is it stored, and how is it displayed in the UI?
18. After a request is closed, what happens if the technician tries to update its status via the API? Point to the exact server-side guard.
19. Can a technician re-open a closed request through the API? Prove it by pointing to the code.

### Database and Persistence
20. If you delete the `c7p1` database and run `npm run db:setup`, what will happen? Will you lose the original seed data?
21. The `init-db.js` script drops tables before recreating them. What is the risk of this approach in a production system?
22. What does the `updated_at` column do in the `requests` table? Why is it there if it's never shown in the UI?
23. What is a parameterised query and where is one used in `server/index.js`? Why does it prevent SQL injection?

### Testing
24. Run `npm test`. Explain what test group [3/8] checks and how it directly verifies MySQL persistence.
25. The test suite uses `fetch` and `mysql2` directly with no test framework. What are the advantages and disadvantages of this approach?
26. How does the test suite clean up the data it creates? What would happen if the server crashed mid-test before cleanup?
27. What is not tested by the automated suite? Name at least three paths that would need manual verification or additional test cases.

### Validation and Error Handling
28. Where is the priority field validated in the create request flow? What HTTP status is returned for an invalid value?
29. If a requester submits the form with an empty title, what happens on the client side and what happens on the server side?
30. Is the `requester_name` field in a new request tied to the logged-in user? Where could an attacker exploit this gap?

---

*End of FINAL_REVIEW.md*
