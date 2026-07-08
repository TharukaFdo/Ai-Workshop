# Mid-Project Review — Workshop Registration System

**Project:** p3 — Workshop Registration System  
**Review Date:** 2026-06-16  
**Review Stage:** After secondary feature (filter) implementation; before testing, security hardening, and maintainability cleanup  
**Reviewer:** Antigravity (AI Code Review Agent)

---

## 1. Mid-Review Summary

The project is a React + Express + MySQL prototype for managing workshop registrations. Both frontend and backend are present and structurally separated. The main workflow (registration → status update → attendance marking) is implemented end-to-end. The secondary feature (filter registrations by workshop title, status, attendance status) is implemented for the organizer, and a client-side-only status filter is present for the participant. The login workflow is database-backed with SHA-256 hashed passwords. Backend role enforcement is in place via a `checkRole` middleware that re-queries the database on every request. The protected actions (mark attendance, edit organizer notes) are correctly restricted to the `organizer` role on the backend.

Key weaknesses before moving to testing and hardening: the token mechanism is the user's email address in plaintext (no real JWT or session), the `x-auth-token` pattern diverges from what REQUIREMENTS.md describes (`x-user-role` / `x-user-email` headers), SHA-256 is documented as a prototype shortcut but is not bcrypt/Argon2, there are no automated tests or test hooks, `participantName` max-length (100 chars) and `registrationDetails` max-length are not enforced on the backend, `deleteRegistrationsByEmail` is a leftover test-utility method exposed in the service layer, the organizer's note textarea uses `onBlur` (fires on every click-away, not on deliberate save), workshop titles are a hardcoded in-memory list on the frontend but not stored as a lookup table in the database, and CORS is configured with a wildcard `app.use(cors())` in production-facing code.

Overall the project is at a **good mid-point**: all primary features are functionally present, role enforcement works correctly, data persists in MySQL, and the UI is polished. The gaps are mostly in hardening, not in missing features.

---

## 2. Review Scoring Matrix

| Feature / Area | Functionality 0-5 | Data Persistence 0-5 | Backend Security / Role Control 0-5 | Validation / Error Handling 0-5 | Testing Evidence 0-5 | Maintainability 0-5 | UI / Manual Usability 0-5 | Evidence | Notes |
|---|---:|---:|---:|---:|---:|---:|---:|---|---|
| Project setup and run commands | 5 | 5 | — | — | 0 | 4 | — | `package.json` root scripts: `install:all`, `dev`, `db:setup`; README documents prerequisites and steps | No test script. `concurrently` is a devDependency at root but not listed in root `package.json` `devDependencies` (it is present as a key but `concurrently` itself is unlisted in root `node_modules` — depends on implicit install). Minor gap. |
| Database setup and starter data | 5 | 5 | — | 3 | 0 | 4 | — | `schema.sql` creates DB, both tables, seeds 3 users and 3 registrations; `setupDb.js` runs it automatically | `setupDb.js` does not load `.env` with explicit path (uses bare `require('dotenv').config()`), which may fail if run from a different CWD. No rollback or idempotent teardown beyond `INSERT IGNORE`. |
| Login workflow | 4 | 4 | 3 | 3 | 0 | 3 | 5 | `POST /api/auth/login` → queries `app_users`, SHA-256 hash compare, returns `{ user, token }` where token = user's email | Token is the raw email string, not a signed JWT. No expiry. Role is re-checked from DB on each request (good), but the "token" could be spoofed by knowing any valid email (no secret signing). REQUIREMENTS.md says `x-user-role` and `x-user-email` headers, but implementation uses `x-auth-token`. Divergence from spec. |
| Role-based access | 4 | 4 | 4 | 3 | 0 | 4 | 4 | `checkRole(['organizer'])` middleware re-queries DB on every protected request; `checkOwnership()` verifies token resolves to a real user | Role sent from client is never trusted (good). However `checkOwnership` does not enforce that the resolved user's role matches a specific set — any DB user passes. Participant cannot reach organizer-only endpoints (verified by route structure). |
| Main create action | 4 | 5 | 4 | 4 | 0 | 4 | 4 | `POST /api/registrations` — server-side required-field check, email regex, ownership enforcement (participant can only use own email), duplicate key handled with friendly message | `participantName` length not validated (REQUIREMENTS.md says max 100 chars). `registrationDetails` length not validated. `workshopTitle` accepts any string (not validated against the known list). |
| Main view/list action | 4 | 5 | 4 | 3 | 0 | 4 | 4 | Organizer: `GET /api/registrations` (role-gated); Participant: `GET /api/registrations/my?email=` (ownership-gated) | Participant endpoint trusts the `email` query param — the backend does compare it against the token user (good), but the check is `req.user.email !== email` which is case-sensitive. Mixed-case email could bypass. |
| Main update/status/cancel action | 4 | 5 | 4 | 4 | 0 | 4 | 4 | `PATCH /:id/status` (organizer only) with enum validation; `PUT /:id` (participant, pending-only) with status guard | No lifecycle guard on status transitions (e.g., can re-open cancelled to pending). This may or may not be intended, but is undocumented. |
| Protected action | 4 | 5 | 5 | 3 | 0 | 4 | 4 | `PATCH /:id/attendance` and `PATCH /:id/notes` both use `checkRole(['organizer'])` — fully DB-backed role check | Attendance has enum validation. Notes has no length or content validation on the backend. Note save fires on textarea `onBlur` (UX gap: saves on every focus-out, not on deliberate action). |
| Secondary feature | 4 | 5 | 4 | 3 | 0 | 3 | 4 | Organizer: all three filters (workshopTitle, status, attendanceStatus) passed as query params to service, applied server-side with parameterized queries. Participant: client-side status filter only | Organizer workshop filter uses exact-match (`=`), not LIKE/partial match — usable with dropdown but limits future flexibility. Participant filter is client-side only (not sent to backend). Filter state is in `useEffect` dependency array, causing auto-refetch on change (reactive, good). |
| Case-specific: registration details and workshop title tracking | 4 | 5 | 4 | 3 | 0 | 3 | 4 | `registrationDetails` (TEXT) and `workshopTitle` (VARCHAR 255) stored in DB; both displayed in participant and organizer views | Workshop titles are a hardcoded JavaScript array in `App.jsx` (WORKSHOPS constant). They are not stored in a DB lookup table. This means a workshop deleted from the array would still appear in old records but not in the filter dropdown. |
| Case-specific: registration status and attendance status lifecycle | 4 | 5 | 4 | 4 | 0 | 4 | 4 | Status: `pending → confirmed → cancelled` (ENUM, organizer-controlled); Attendance: `notMarked → present / absent` (ENUM, organizer-controlled); participant's edit locked to `pending` status only | No rule preventing attendance being marked before status is `confirmed`. No guard preventing cancelling an already-attended registration. These edge cases are not covered by REQUIREMENTS.md but are potential logical gaps. |
| Case-specific: organizer notes and attendance protection | 5 | 5 | 5 | 3 | 0 | 4 | 3 | Both `/notes` and `/attendance` routes use `checkRole(['organizer'])` — participant has no route to reach these. Backend re-queries DB for role on every call. | Notes content has no max length or sanitization. Textarea `onBlur` save UX is awkward (fires unintentionally). Participant view shows `organizerNote` read-only (correct). |
| UI / manual usability | 4 | — | — | 3 | 0 | 3 | 4 | Dark glassmorphism UI with Inter font, status badges, stat cards, toast notifications, tab navigation, table with inline controls | Single-file `App.jsx` (724 lines) handles all state, all API calls, and all rendering. Hard to navigate or extend. No loading state for individual row actions (status/attendance). |
| Security posture | 2 | — | 3 | 2 | 0 | 2 | — | Role re-checked from DB (strong); DB creds in `.env` only (correct); no secret in frontend `.env` beyond API URL | Token is user's email (no signing, no expiry). CORS is open wildcard. SHA-256 is weak for password storage. `x-auth-token` design diverges from REQUIREMENTS.md spec. `deleteRegistrationsByEmail` exposed in service (no route, but exists). `.env` committed to repo (not in `.gitignore` — only frontend has `.gitignore`). |
| Testing evidence | 0 | 0 | 0 | 0 | 0 | 0 | — | No test files, no test framework, no test scripts in any `package.json` | REQUIREMENTS.md Section 6 lists 3 automated test targets and 6 manual checks. None implemented. No test hooks or mock data utilities beyond the seed SQL and a service-layer `deleteRegistrationsByEmail` helper. |
| Maintainability | 2 | — | — | — | 0 | 2 | — | Routes and services are separated; `db.js` is a shared pool module; JSDoc-style comments on service methods | Entire frontend is one 724-line file (`App.jsx`). No component decomposition. No custom hooks. CSS is all in one 698-line file but reasonably structured with CSS variables. No ESLint errors caught (linting config present). No `.env` in root `.gitignore`. |

---

## 3. Current Feature Status

| Feature | Status | Location |
|---|---|---|
| Participant: Register for workshop | ✅ Implemented | `POST /api/registrations`, `App.jsx:handleRegisterSubmit` |
| Participant: View own registrations | ✅ Implemented | `GET /api/registrations/my`, `App.jsx:fetchMyRegistrations` |
| Participant: Edit pending registration details | ✅ Implemented | `PUT /api/registrations/:id`, `App.jsx:handleSaveEdit` |
| Participant: Filter own registrations by status | ✅ Implemented (client-side only) | `App.jsx` lines 511–518 |
| Organizer: View all registrations | ✅ Implemented | `GET /api/registrations`, `App.jsx:fetchOrganizerRegistrations` |
| Organizer: Filter by workshop, status, attendance | ✅ Implemented (server-side) | `registrationService.getAllRegistrations`, query params |
| Organizer: Update registration status | ✅ Implemented | `PATCH /api/registrations/:id/status` |
| Organizer: Mark attendance | ✅ Implemented | `PATCH /api/registrations/:id/attendance` |
| Organizer: Edit organizer notes | ✅ Implemented | `PATCH /api/registrations/:id/notes` |
| Organizer: Dashboard statistics | ✅ Implemented | `App.jsx` stats object (lines 314–319) |

---

## 4. Database and Persistence Status

| Item | Status | Detail |
|---|---|---|
| Database auto-created | ✅ | `CREATE DATABASE IF NOT EXISTS c10p3` in `schema.sql` |
| `app_users` table | ✅ | `id`, `email`, `password` (SHA-256), `role` ENUM, `created_at` |
| `registrations` table | ✅ | All required fields present: `participantName`, `email`, `workshopTitle`, `registrationDetails`, `status` ENUM, `attendanceStatus` ENUM, `organizerNote`, `createdAt`, `updatedAt` |
| Seed data | ✅ | 3 users (1 organizer, 2 participants) + 3 registrations across two workshops |
| Unique constraint | ✅ | `UNIQUE KEY unique_user_workshop (email, workshopTitle)` — prevents double-registration |
| DB credentials in backend only | ✅ | All 5 vars (`DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`) in `backend/.env` only |
| DB credentials exposed in frontend | ✅ None | `frontend/.env` contains only `VITE_API_URL` (not a secret) |
| Repeatable setup command | ✅ | `npm run db:setup` at root, delegates to `node config/setupDb.js` |
| Workshop titles in DB | ❌ Missing | Workshop titles are a hardcoded JS array in `App.jsx`; no `workshops` lookup table |
| Migrations / versioned schema | ❌ Missing | Single `schema.sql` — no migration history |
| Backend `.env` in `.gitignore` | ⚠️ Gap | Backend directory has no `.gitignore`; only the frontend has one. The committed `backend/.env` with `DB_PASSWORD=` is low-risk here (empty password) but the pattern is wrong |

---

## 5. Login and Role/Access Status

**Login type:** Database-backed (not mock-only, not role-selector-only)

- Users are stored in `app_users` with SHA-256 hashed passwords.
- `POST /api/auth/login` queries the database, compares the SHA-256 hash, and returns a token.
- **Token format:** The returned "token" is the user's own email address — a simple identifier, not a cryptographically signed JWT.
- The frontend stores `user` object and `token` (email) in `localStorage` and sends `token` as the `x-auth-token` request header on every API call.
- The backend re-queries the database (`AuthService.findUserByEmail`) on **every protected request** to verify the token resolves to a real user and to read the current role. The client-supplied role is never trusted.
- This means role changes take effect immediately for future requests (strong design for a prototype).

**Divergence from REQUIREMENTS.md:** Section 3 of REQUIREMENTS.md specifies `x-user-role` and `x-user-email` headers. The implementation uses a single `x-auth-token` header containing the user's email. The functional behaviour is equivalent or stronger (role is not trusted from header), but the interface diverges from the written spec.

| Check | Result |
|---|---|
| Login is database-backed | ✅ Yes |
| Passwords hashed | ✅ SHA-256 (weak but present) |
| Role enforced in backend | ✅ DB re-query on every request |
| Role trusted from client header | ✅ Never |
| JWT or signed token | ❌ No — token is raw email |
| Token expiry | ❌ No |
| Participant scoped to own records | ✅ `req.user.email !== email` guard on GET/PUT |

---

## 6. Protected Action Status

**Protected actions:** Mark attendance (`PATCH /:id/attendance`) and Edit organizer notes (`PATCH /:id/notes`)

Both routes are protected by `checkRole(['organizer'])` middleware, which:
1. Reads `x-auth-token` from request headers.
2. Queries `app_users` for the user with that email.
3. Checks that `user.role` is in the allowed list `['organizer']`.
4. Rejects with `403` if the role does not match.

A participant cannot reach either of these endpoints — there is no client-side route to them, and any direct API call would be rejected at the backend middleware level.

**Gap:** The notes `PATCH` does not validate the `organizerNote` body field (no length limit, no null-coercion check). An empty body would update the note to `undefined` which MySQL may store as `NULL` (which is acceptable) but is untested.

---

## 7. Validation Status

| Validation Rule | Backend Enforced | Frontend Enforced | Notes |
|---|---|---|---|
| All registration fields required | ✅ | ✅ (`required` attribute + JS check) | Backend returns `400` with message |
| Email format (regex) | ✅ | ✅ (`type="email"`) | Regex: `/^[^\s@]+@[^\s@]+\.[^\s@]+$/` |
| `participantName` max 100 chars | ❌ | ❌ | REQUIREMENTS.md §4 specifies this; not enforced |
| `registrationDetails` non-empty (only) | ✅ | ✅ | No max length enforced |
| `workshopTitle` from known list | ❌ | ✅ (dropdown) | Backend accepts any string; bypass via direct API call |
| `status` ENUM values | ✅ | ✅ (dropdown) | Service layer validates before DB write |
| `attendanceStatus` ENUM values | ✅ | ✅ (buttons) | Service layer validates before DB write |
| Edit only when `pending` | ✅ | ✅ (button hidden) | Backend re-checks status on PUT |
| Participant own-email only | ✅ | ✅ (email disabled) | Backend checks `req.user.email !== email` |
| Duplicate registration rejected | ✅ | ⚠️ After submission | MySQL unique constraint + `ER_DUP_ENTRY` caught, friendly message returned |
| `organizerNote` length/content | ❌ | ❌ | No validation at any layer |

---

## 8. Stage Drift — Early Implementation

No evidence of testing infrastructure, security hardening utilities, or production deployment configuration being implemented early. The following items belong to future stages and are **not yet present** (correct for this stage):

- No test runner (`jest`, `supertest`, `vitest`, `playwright`) installed or configured.
- No rate limiting (`express-rate-limit`) or helmet middleware.
- No input sanitization library (e.g., `validator.js`, `express-validator`).
- No HTTPS / TLS configuration.
- No logging framework (`morgan`, `winston`).
- No Docker / containerization files.
- No CI/CD pipeline configuration.

One borderline item: `registrationService.deleteRegistrationsByEmail` (lines 124–128 of `registrationService.js`) is a teardown utility that would typically only exist after test infrastructure is set up. It is not exposed through any route and causes no security risk, but it is an early-stage artifact that anticipates testing.

---

## 9. Issues Found Before Stage 8

### High Priority (affects correctness or security)

| # | Issue | Location | Impact |
|---|---|---|---|
| H-1 | Token is the user's raw email string — no signing, no expiry. Any attacker who knows a valid email can forge the header. | `routes/auth.js` line 24, `services/authService.js` | Security: token forgery |
| H-2 | CORS is open wildcard (`app.use(cors())`). In a production or shared-network environment this allows any origin. | `server.js` line 9 | Security: CORS |
| H-3 | `backend/.env` is committed and not in any `.gitignore`. Password is empty now, but the pattern will cause credential leaks once a real password is set. | `backend/` root | Security: credential exposure |
| H-4 | `workshopTitle` accepted as any free-text string on the backend. An organizer filter by workshop title must match exactly. A participant could inject an unexpected title via direct API call. | `routes/registrations.js` line 58, `services/registrationService.js` | Data integrity |

### Medium Priority (affects quality or spec compliance)

| # | Issue | Location | Impact |
|---|---|---|---|
| M-1 | `participantName` has no length validation (REQUIREMENTS.md says max 100 chars). | `routes/registrations.js` line 58 | Spec gap |
| M-2 | `organizerNote` has no length or content validation anywhere. | `routes/registrations.js` line 157 | Validation gap |
| M-3 | Participant filter (by status) is client-side only. If a participant has hundreds of records, all are fetched and filtered in memory. | `App.jsx` lines 511–518 | Scalability / correctness |
| M-4 | `useEffect` dependency array includes `filterWorkshop`, `filterStatus`, `filterAttendance` but also `user`, causing it to refetch on login before the organizer dashboard is even visible. Not harmful, but redundant. | `App.jsx` line 311 | Minor logic issue |
| M-5 | Organizer's note textarea uses `onBlur` — fires a PATCH API call on every click-away, even with no change. | `App.jsx` line 703 | Unnecessary API calls, UX |
| M-6 | `setupDb.js` uses bare `require('dotenv').config()` (no explicit path). If run from a directory other than `backend/`, it will not load the correct `.env`. | `config/setupDb.js` line 4 | Setup reliability |
| M-7 | `x-auth-token` header naming diverges from REQUIREMENTS.md which specifies `x-user-role` and `x-user-email`. | All routes | Spec divergence |
| M-8 | Email comparison (`req.user.email !== email`) is case-sensitive. `User@Example.com` and `user@example.com` would be treated as different emails. | `routes/registrations.js` lines 66, 94, 115 | Edge case / correctness |
| M-9 | Schema comment says password stored as SHA-256 but REQUIREMENTS.md §3 says "plain text for simplicity or simple hashing". Actual implementation uses SHA-256 (better than plain). The spec comment is misleading. | `schema.sql` line 9 | Documentation mismatch |

### Low Priority (maintainability / cleanup)

| # | Issue | Location | Impact |
|---|---|---|---|
| L-1 | All frontend logic (724 lines) is in a single `App.jsx`. No component decomposition, no custom hooks. | `frontend/src/App.jsx` | Maintainability |
| L-2 | `deleteRegistrationsByEmail` in service layer is a test utility with no corresponding route. Belongs in a test helper, not the main service. | `services/registrationService.js` lines 122–128 | Maintainability |
| L-3 | Workshop titles are hardcoded in `App.jsx` (WORKSHOPS constant). No `workshops` table in DB. | `App.jsx` lines 4–9, `schema.sql` | Data integrity, extensibility |
| L-4 | CSS inline styles used in the participant filter section (`App.jsx` lines 490–503). Inconsistent with the CSS class-based approach used everywhere else. | `App.jsx` lines 490–503 | Maintainability |
| L-5 | No `empty-loading` state for individual inline organizer actions (status dropdown, attendance buttons). The full list refetches after each action without a per-row indicator. | `App.jsx` | UX |
| L-6 | No `eslint` script in root `package.json`. Linting must be run manually from `frontend/` only. | Root `package.json` | Tooling gap |
| L-7 | `seeded-users-info` block in login page exposes credentials in the UI. Acceptable for a prototype/demo; must be removed before any real deployment. | `App.jsx` lines 362–370 | Demo artifact |

---

## 10. Manual Checks Recommended Next

The following checks should be performed manually before moving to the testing stage:

1. **Health endpoint:** `GET http://localhost:5000/api/health` — verify `{ status: "OK", database: "Connected successfully" }` is returned.
2. **Login as participant** (`participant@workshop.com` / `user123`) — verify the Registration tab loads, email field is pre-filled and disabled.
3. **Submit a registration** — verify toast confirms success, status tab auto-opens, record appears with status `PENDING`.
4. **Try registering for the same workshop again** — verify the backend rejects with "already registered" message.
5. **Edit registration details while pending** — verify edit saves; then change status to Confirmed in organizer view and verify the Edit button disappears.
6. **Login as organizer** (`organizer@workshop.com` / `admin123`) — verify the full table appears with all 3 seeded registrations.
7. **Apply each filter** — workshop title, status, attendance — verify the table updates correctly.
8. **Update a registration status** — change to Confirmed; verify it persists after page refresh.
9. **Mark attendance** — mark a row Present; verify button highlights and value persists.
10. **Edit organizer note** — type a note, click away; verify it saves (check DB or refresh page).
11. **Direct API attack — attendance by participant:** Send `PATCH http://localhost:5000/api/registrations/1/attendance` with `x-auth-token: participant@workshop.com`. Verify `403` is returned.
12. **Direct API attack — notes by participant:** Send `PATCH http://localhost:5000/api/registrations/1/notes` with `x-auth-token: participant@workshop.com`. Verify `403` is returned.
13. **Direct API attack — view all registrations as participant:** Send `GET http://localhost:5000/api/registrations` with `x-auth-token: participant@workshop.com`. Verify `403` is returned.
14. **DB credential check:** Verify no MySQL credentials appear in `frontend/dist/` (after `npm run build`) or in any `.js` bundle file in the frontend.

---

## 11. Pass/Fail Table

| Check | Result | Evidence |
|---|---|---|
| App appears runnable | ✅ PASS | Root `npm run dev` starts both servers concurrently; README documents all steps |
| React frontend and Express backend are separated | ✅ PASS | Separate `frontend/` and `backend/` directories; no cross-imports |
| React calls Express routes and never connects to MySQL directly | ✅ PASS | Frontend uses `fetch('/api/...')` via Vite proxy; no `mysql2` in frontend `node_modules` |
| Backend uses DB_HOST, DB_PORT, DB_USER, DB_PASSWORD, DB_NAME | ✅ PASS | All 5 vars present in `backend/.env` and used in `config/db.js` |
| DB credentials not exposed in React | ✅ PASS | `frontend/.env` contains only `VITE_API_URL`; no DB vars |
| Needed database tables exist | ✅ PASS | `app_users` and `registrations` tables defined in `schema.sql` |
| Users/login table exists | ✅ PASS | `app_users` table with `email`, `password`, `role` |
| Repeatable database setup/seed command | ✅ PASS | `npm run db:setup` runs `setupDb.js` which executes `schema.sql` with `INSERT IGNORE` seeds |
| Login is database-backed | ✅ PASS | `POST /api/auth/login` queries `app_users` with hashed password comparison |
| Role restrictions enforced in backend (not only UI) | ✅ PASS | `checkRole(['organizer'])` middleware re-queries DB on every protected request |
| Mark attendance is protected | ✅ PASS | `PATCH /:id/attendance` gated by `checkRole(['organizer'])` |
| Edit organizer notes is protected | ✅ PASS | `PATCH /:id/notes` gated by `checkRole(['organizer'])` |
| Users limited to own records (participant) | ✅ PASS | `req.user.email !== email` check on POST, GET `/my`, PUT `/:id` |
| Main workflow implemented (register → status update → attendance) | ✅ PASS | POST → PATCH `/status` → PATCH `/attendance` all present and functional |
| Secondary feature implemented (filter by workshop, status, attendance) | ✅ PASS | Server-side filtering in `getAllRegistrations`; UI filter controls for all three fields |
| Validation is present | ⚠️ PARTIAL | Required fields, email regex, enum values validated; `participantName` length and `workshopTitle` list not validated on backend |
| AI did NOT implement future stages early | ✅ PASS | No test framework, no rate limiting, no helmet, no logging — all correctly absent |
| Token is properly secured | ❌ FAIL | Token is raw email string; no signing, no expiry |
| CORS is configured safely | ❌ FAIL | `app.use(cors())` — open wildcard |
| Backend `.env` is git-ignored | ❌ FAIL | No `.gitignore` in `backend/`; `.env` is committed |
| No automated tests present | ❌ EXPECTED GAP | Correct for this stage; testing is a future stage |
