# Mid-Project Review — Workshop Registration System

**Case:** Workshop Registration System (Case 10, Prototype 1)
**Review Stage:** After secondary feature (filter) stage — before testing, security hardening, and maintainability cleanup
**Date:** 2026-06-15
**Reviewer:** AI Code Review

---

## 1. Mid-Review Summary

The Workshop Registration System prototype is a two-tier React + Express + MySQL application. At this stage both tiers exist, are wired together, and the core registration workflow plus the secondary filter feature are implemented. The backend runs under `nodemon` via `npm run dev` and connects to a local MySQL database named `c10p1`. A repeatable database setup script (`db-init.js`) creates tables and seeds demo data in one command. Login is database-backed with role detection. The organizer-only `PUT /api/registrations/:id` route is protected by a backend `authenticateUser` middleware and a role check.

Notable gaps before the next stages: passwords are stored and compared in plain text (no hashing), the authentication header is a plain user-ID sent from the browser (not a signed token), participants can see all other participants' registrations (no user-scoping on the list), there are no automated tests or test hooks, and the `req.req_body || req.body` pattern is a latent bug (always evaluates to `req.body` because `req.req_body` is always `undefined` — it works accidentally but is incorrect code).

Overall the project is substantially complete for its current scope and ready to move forward to testing and security hardening.

---

## 2. Review Scoring Matrix

| Feature / Area | Functionality 0-5 | Data Persistence 0-5 | Backend Security / Role Control 0-5 | Validation / Error Handling 0-5 | Testing Evidence 0-5 | Maintainability 0-5 | UI / Manual Usability 0-5 | Evidence | Notes |
|---|---:|---:|---:|---:|---:|---:|---:|---|---|
| Project setup and run commands | 4 | 5 | 0 | 0 | 0 | 4 | 0 | `backend/package.json` scripts: `start`, `dev`, `db:init`; `frontend/package.json` scripts: `dev`, `build`; `vite.config.js` proxy to `:5005` | No `.env.example`, no root-level `README` or `package.json`. Both servers must be started manually in separate terminals. |
| Database setup and starter data | 5 | 5 | 0 | 0 | 0 | 4 | 0 | `db-init.js` creates DB, drops/recreates both tables, seeds 3 registrations + 2 users in one `node db-init.js` run | Script is destructive (DROP IF EXISTS) — fine for a prototype seed but data is wiped on every re-run. No migration versioning. |
| Login workflow | 4 | 5 | 2 | 3 | 0 | 3 | 5 | `POST /api/login` queries `users` table; returns `{user:{id,username,role}}`; stored in `localStorage`; subsequent requests send `x-user-id` header | Plain-text password comparison (`WHERE username=? AND password=?`). No token/session; user ID header is easily spoofable. Login form shows demo credentials on screen. |
| Role-based access | 4 | 4 | 3 | 2 | 0 | 3 | 4 | `authenticateUser` middleware looks up user from DB on every request; `PUT` route checks `req.user.role !== 'organizer'`; UI renders different views per role | `GET /api/registrations` enforces auth but not role (both roles see all rows — participants see every user's data). No backend check preventing participant from calling `POST` on behalf of arbitrary user. |
| Main create action | 4 | 5 | 3 | 3 | 0 | 3 | 5 | `POST /api/registrations` — authenticated, inserts name/email/workshop_title/registration_details; returns 201 + insertId | No email format validation on the backend. Any authenticated user (including organizer) can POST a new registration — not restricted to participant role. |
| Main view/list action | 4 | 5 | 2 | 2 | 0 | 3 | 5 | `GET /api/registrations` — authenticated; returns all rows ordered by `created_at DESC` | No participant scoping — participants see all registrations from all users. Should filter by the participant's own records. |
| Main update/status/cancel action | 4 | 5 | 4 | 4 | 0 | 3 | 5 | `PUT /api/registrations/:id` — role-checked; dynamic SET builder; validates status/attendance enum values; returns 404 on missing id | `req.req_body || req.body` bug (harmless in practice but incorrect). No optimistic-lock: concurrent updates could race. |
| Protected action | 4 | 5 | 4 | 3 | 0 | 3 | 5 | Mark attendance and edit organizer notes both go through the same `PUT` endpoint which enforces `role === 'organizer'`; UI edit controls only rendered in organizer view | Protection is at the endpoint level only (no field-level guard preventing organizer from omitting attendance while updating notes separately — already handled by dynamic builder). Participant view is read-only for these fields. |
| Secondary feature | 5 | 4 | 0 | 0 | 0 | 3 | 5 | Client-side filter state for workshop title, registration status, and attendance; dropdowns in organizer filter bar; `filteredRegistrations` computed array; count badge | Filtering is client-side only. Backend has no `?workshop=&status=&attendance=` query parameters. For large datasets this would be a scalability problem. |
| Case-specific: registration details and workshop title tracking | 5 | 5 | 3 | 3 | 0 | 4 | 5 | `workshop_title VARCHAR(255)` and `registration_details TEXT` in schema; form collects both; displayed in both participant and organizer views | Workshop titles are hardcoded in a JS array on the frontend; no `workshops` table. Title is stored as free text, so filter depends on exact string match. |
| Case-specific: registration status and attendance status lifecycle | 5 | 5 | 4 | 4 | 0 | 4 | 5 | `status` (pending/confirmed/cancelled) and `attendance` (unmarked/present/absent) columns with defaults; enum validation in PUT route; badge rendering for both statuses | No state-machine enforcement (e.g., attendance cannot be marked before confirmation). Both statuses default correctly. |
| Case-specific: organizer notes and attendance protection | 4 | 5 | 4 | 3 | 0 | 3 | 5 | `organizer_notes TEXT` column; inline edit UI only in organizer view; PUT route role-checks before any field update; participant view shows notes read-only | Notes visible to participants in the read-only list. If notes should be organizer-only, the GET route would need to strip that field for participants. Case brief is silent on this — current behaviour is arguably correct. |
| UI/manual usability | 5 | 0 | 0 | 0 | 0 | 4 | 5 | Dark premium design, lucide icons, status badges, loading spinner, success/error messages, DB connectivity badge in header, filter count badge, role-sensitive layout | `animate-spin` class referenced in JSX but not defined in `index.css`. Font loading depends on Google Fonts CDN (network required). |
| Security posture | 1 | 0 | 2 | 0 | 0 | 2 | 0 | `authenticateUser` and role check on PUT; CORS enabled (open wildcard); dotenv for DB credentials | Plain-text passwords; spoofable user-ID header; no rate limiting; no input sanitisation beyond required-field checks; no HTTPS enforcement; all registrations visible to all authenticated users. |
| Testing evidence | 0 | 0 | 0 | 0 | 0 | 0 | 0 | No test files, no test scripts in `package.json`, no test framework installed | No test hooks, no health-check automation, no CI config. `/api/health` endpoint exists and is useful for smoke testing. |
| Maintainability | 2 | 0 | 0 | 0 | 0 | 2 | 0 | `db-init.js` separates DB setup from server; dotenv for config; ESLint listed in frontend dev deps | Entire frontend is a single 777-line `App.jsx` — no component decomposition. Backend is a single 185-line `server.js` — no route files. No JSDoc, no API docs, no `.env.example`, no root README. `req.req_body || req.body` bug present in two routes. |

---

## 3. Current Feature Status

| Feature | Status | Location |
|---|---|---|
| Participant registration form (name, email, workshop, details) | ✅ Implemented | `App.jsx` L129–170, `POST /api/registrations` |
| View registration list with status and attendance badges | ✅ Implemented | `App.jsx` L508–541 (participant), L598–769 (organizer) |
| Organizer update registration status | ✅ Implemented | `App.jsx` L172–196, `PUT /api/registrations/:id` |
| Organizer mark attendance | ✅ Implemented | `App.jsx` L198–222, `PUT /api/registrations/:id` |
| Organizer edit notes | ✅ Implemented | `App.jsx` L224–249, `PUT /api/registrations/:id` |
| Filter by workshop title | ✅ Implemented (client-side) | `App.jsx` L35, L252–257, L556–566 |
| Filter by registration status | ✅ Implemented (client-side) | `App.jsx` L36, L252–257, L568–580 |
| Filter by attendance status | ✅ Implemented (client-side) | `App.jsx` L37, L252–257, L582–595 |
| Database-backed login with role | ✅ Implemented | `server.js` L51–66, `db-init.js` L77–89 |
| Health check endpoint | ✅ Implemented | `server.js` L161–179 |
| Participant scoping (own records only) | ❌ Missing | `GET /api/registrations` returns all rows for all roles |
| Backend filter query params | ❌ Missing | Filtering is entirely client-side |
| Password hashing | ❌ Missing | Plain-text comparison in DB |
| JWT or signed session token | ❌ Missing | Plain user-ID header used |
| Automated tests | ❌ Missing | No test framework installed |
| Participant role restriction on POST | ❌ Missing | Any authenticated user can create registrations |

---

## 4. Database and Persistence Status

**Tables confirmed in `db-init.js`:**

| Table | Columns | Notes |
|---|---|---|
| `registrations` | id, name, email, workshop_title, registration_details, status, attendance, organizer_notes, created_at | All case-required fields present. Defaults: status=`pending`, attendance=`unmarked`. |
| `users` | id, username, password, role | Password stored as plain text. No `email` column on users. |

**Setup command:** `node db-init.js` (alias: `npm run db:init` from `backend/`)

**Seed data:** 3 pre-seeded registrations (pending/confirmed/cancelled, various attendance) and 2 users (`org`/organizer, `part`/participant).

**Issues:**
- `db-init.js` drops both tables on every run — all data is wiped and re-seeded. Acceptable for a prototype, destructive in any persistent environment.
- No `workshops` table; workshop titles are a hardcoded JS array and free-text `VARCHAR` in DB — filter relies on exact string match.
- No foreign key between `registrations` and `users` — registrations are not linked to the submitting user's `id`.
- No `updated_at` timestamp column on `registrations`.

---

## 5. Login and Role/Access Status

| Aspect | Finding |
|---|---|
| Login type | Database-backed (`users` table) |
| Credential storage | Plain-text password in `users.password` |
| Auth mechanism post-login | `x-user-id` header (user's DB id, sent from `localStorage`) |
| Server-side auth check | `authenticateUser` middleware — DB lookup on every request |
| Role detection | From `users.role` field on every request (not from token claim) |
| Organizer restriction | ✅ `PUT` route checks `req.user.role !== 'organizer'` |
| Participant restriction on write | ⚠️ `POST /api/registrations` is open to any authenticated user — organizer can also create registrations |
| Participant data scoping | ❌ `GET /api/registrations` returns all rows; participants see all registrations, not just their own |
| Session expiry | ❌ No expiry; `localStorage` entry persists until `handleLogout()` is called |

---

## 6. Protected Action Status

**Protected actions per case brief:** Mark attendance, edit organizer notes.

| Check | Finding |
|---|---|
| Backend route protecting both | ✅ Single `PUT /api/registrations/:id` handles both; role guard at line 104 of `server.js` returns 403 for non-organizers |
| UI protection | ✅ Attendance buttons and "Edit Note" controls only rendered inside `currentUser.role === 'organizer'` block |
| Participant read of notes | ⚠️ Participant view shows `organizer_notes` — if notes contain internal-only information this could be a disclosure concern; case brief does not explicitly prohibit it |
| Backend validation of attendance values | ✅ Enum check: `['present', 'absent', 'unmarked']` |
| Attendance requires confirmed status first | ❌ No state-machine guard — attendance can be marked on pending or cancelled registrations |

---

## 7. Validation Status

| Validation Point | Backend | Frontend |
|---|---|---|
| Name required | ✅ (`server.js` L83) | ✅ (`required` attribute + JS guard L131) |
| Email required | ✅ (`server.js` L83) | ✅ (`type="email"` + `required`) |
| Email format | ❌ No regex/format check on backend | ✅ Browser `type="email"` only |
| Workshop title required | ✅ (`server.js` L83) | ✅ (select always has a value) |
| Status enum | ✅ (`server.js` L112–116) | ✅ (only valid buttons rendered) |
| Attendance enum | ✅ (`server.js` L113–119) | ✅ (only valid buttons rendered) |
| No fields provided in PUT | ✅ (`server.js` L140–142) | N/A |
| Login: both fields required | ✅ (`server.js` L53–55) | ✅ (`required` + JS guard L88–90) |
| SQL injection | ⚠️ Parameterised queries used (mysql2 `?` placeholders) — safe for current inputs, but no additional sanitisation layer | N/A |
| XSS | ❌ No `helmet` or CSP headers; React JSX auto-escapes output so practical risk is low | N/A |

---

## 8. Stage Drift — Early Implementation

No significant future-stage work was detected. The implementation matches the stated scope (registration + status update + attendance marking + filter). No payment flows, email notifications, certificate generation, or advanced user management were observed.

The one forward-leaning item is the `/api/health` endpoint, which is a useful operational addition beyond the case brief but is harmless and appropriate.

---

## 9. Issues Found Before Stage 8

### Critical
| # | Issue | Location | Impact |
|---|---|---|---|
| C1 | Passwords stored and compared in plain text | `db-init.js` L79–80, `server.js` L57 | Security — any DB read exposes all credentials |
| C2 | Auth uses plain user-ID header — trivially spoofable | `server.js` L33, all fetch calls in `App.jsx` | Security — any browser user can impersonate any other user by changing the header |
| C3 | Participant `GET /api/registrations` returns all registrations — no user scoping | `server.js` L69–77 | Privacy and access control — participants can see other participants' data |

### Major
| # | Issue | Location | Impact |
|---|---|---|---|
| M1 | `req.req_body || req.body` — `req.req_body` is always `undefined`; body is read from `req.body` accidentally | `server.js` L52, L81, L109 | Latent bug — works now because `req.body` is defined, but misleading and fragile |
| M2 | No role restriction on `POST /api/registrations` — organizer can also create registrations | `server.js` L80 | Role boundary violation |
| M3 | `animate-spin` CSS class referenced but not defined in `index.css` | `App.jsx` L418, L515 | UI — spinner animation will not render |
| M4 | No `users.id` foreign key on `registrations` — no link between a registration and the user who submitted it | `db-init.js` L33–45 | Data model — prevents participant scoping fix |
| M5 | Client-side filtering only — no backend query params | `server.js` (no filter logic) | Scalability — all rows loaded before filtering |

### Minor
| # | Issue | Location | Impact |
|---|---|---|---|
| m1 | No `.env.example` — new developers must guess required variables | `backend/.env` only | Onboarding friction |
| m2 | No root-level `README.md` — no instructions to start both servers | Project root | Onboarding friction |
| m3 | No `updated_at` timestamp on `registrations` | `db-init.js` L33–45 | Auditability |
| m4 | `db-init.js` is destructive on every run — all data lost | `db-init.js` L30, L49 | Data loss risk if run accidentally on a populated DB |
| m5 | Workshop titles hardcoded in frontend array and not in a DB table | `App.jsx` L43–47, `db-init.js` | Filter breaks if a title is mistyped; no way to add workshops without code change |
| m6 | CORS configured with open wildcard (`app.use(cors())`) | `server.js` L10 | Security — any origin can call the API |
| m7 | Entire frontend in one 777-line `App.jsx` — no component decomposition | `frontend/src/App.jsx` | Maintainability — difficult to navigate or unit-test |
| m8 | No attendance-before-confirmation guard | `server.js` L103–158 | Workflow — attendance can be marked on a pending or cancelled registration |
| m9 | Login form exposes demo credentials on screen | `App.jsx` L366–370 | Acceptable for prototype, remove before any real deployment |

---

## 10. Manual Checks Recommended Next

1. **Run both servers** — confirm `npm run db:init` initialises the DB, then `npm run dev` in both `backend/` and `frontend/` starts cleanly.
2. **Login as participant (`part`/`part`)** — verify the registration form submits successfully and appears in the participant's own list.
3. **Verify spoofability** — in DevTools, change the `x-user-id` request header to another user's ID and confirm the backend grants access (confirms C2).
4. **Verify participant data leak** — log in as `part`, confirm registrations for `Alice`, `Bob`, and `Charlie` all appear (confirms C3).
5. **Login as organizer (`org`/`org`)** — confirm filters work, status buttons update status, attendance buttons update attendance, and note edit saves correctly.
6. **Try PUT as participant via DevTools/Postman** — send `PUT /api/registrations/1` with `x-user-id: <participant-id>` header; confirm 403 is returned (validates protected action backend guard).
7. **Check spinner** — trigger a load and observe whether the loading spinner animates (confirms M3 — `animate-spin` undefined).
8. **Confirm health badge** — DB connected indicator in header should show green when backend is running.

---

## 11. Pass/Fail Table

| Check | Result | Notes |
|---|---|---|
| App appears runnable | ✅ Pass | Both packages have `node_modules`; scripts are defined; proxy configured |
| React and Express are separated | ✅ Pass | `frontend/` and `backend/` are distinct directories with independent `package.json` files |
| React calls Express routes, never MySQL directly | ✅ Pass | All DB access is in `server.js`; frontend uses `fetch('/api/...')` only |
| Backend uses DB_HOST/PORT/USER/PASSWORD/NAME from env | ✅ Pass | `server.js` L17–21 and `db-init.js` L8–11 read all five variables from `.env` via `dotenv` |
| No DB secrets exposed in React | ✅ Pass | `.env` is in `backend/`; Vite does not bundle it; no DB credentials in `frontend/` |
| Needed database tables exist | ✅ Pass | `registrations` and `users` tables created by `db-init.js` |
| Users/login table exists | ✅ Pass | `users` table with id, username, password, role |
| Repeatable DB setup/seed command | ✅ Pass | `npm run db:init` → `node db-init.js` |
| Login is database-backed | ✅ Pass | `POST /api/login` queries `users` table |
| Role restrictions enforced in backend | ⚠️ Partial | PUT protected; GET and POST have no role restriction |
| Mark attendance protected in backend | ✅ Pass | `PUT` route role-checks before any update |
| Edit organizer notes protected in backend | ✅ Pass | Same `PUT` route role-check covers notes |
| Users limited to own records | ❌ Fail | `GET /api/registrations` returns all rows regardless of role or user |
| Main workflow implemented (register → status update → attendance) | ✅ Pass | All three steps are working end-to-end |
| Filter by workshop title, status, attendance | ✅ Pass | Client-side filtering implemented and functional |
| Validation present | ⚠️ Partial | Required field checks present; email format and backend sanitisation missing |
| No future stages implemented early | ✅ Pass | No payments, email, or advanced features observed |
| Items missing before Stage 8 (testing/security/maintainability) | See Section 9 | 3 critical, 5 major, 9 minor issues identified |
