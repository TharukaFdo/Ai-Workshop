# Mid-Project Review — Clinic Appointment System

**Review date:** 2026-06-05  
**Stage reviewed:** After secondary feature (filter by doctor / date / status). Before testing, security hardening, and maintainability cleanup.  
**Reviewer:** Automated structured review (read-only pass)  
**Scope:** Case — Receptionist + Doctor roles, Appointment as main entity, visit notes as protected action.

---

## 1. Mid-Review Summary

The prototype is structurally sound and materially complete for a Stage 2 / secondary-feature checkpoint. Both the React frontend (Vite, port 5173) and the Express backend (port 5000) exist as separate processes. All five required MySQL environment variables are used in the backend and never exposed to the React bundle. A repeatable `npm run db:seed` command exists and seeds both tables. Login is database-backed. The backend enforces role rules on every protected route via a middleware that re-queries the database on every request. The core appointment workflow (create, view, update, cancel) is implemented end-to-end. The secondary filter feature (doctor / date / status) is implemented. The visit-note protected action is gated at the backend by role **and** by ownership (`doctor_name` match in the `WHERE` clause).

The most significant gap before moving to testing is that **passwords are stored and compared in plaintext** — there is no hashing. The middleware's authentication token is the raw `username` string passed in the `Authorization` header, which provides no real session security. These are expected pre-hardening gaps but must be flagged. No tests of any kind exist. Doctor names are hardcoded in both frontend dropdowns rather than fetched dynamically from the database. A cancel dedicated DELETE/PATCH endpoint does not exist — cancellation goes through the general PUT update route, which is functional but architecturally weak. There is also no duplicate-booking guard.

Overall readiness for the next stage (testing) is **moderate-good**: the feature surface is there, data flows are wired, but auth must be hardened before meaningful security testing can begin.

---

## 2. Review Scoring Matrix

> Score meaning: 0 = missing · 1 = present but mostly not working · 2 = partially working with major gaps · 3 = mostly working with important gaps · 4 = working with minor gaps · 5 = complete for the selected case scope

| Feature / Area | Functionality 0–5 | Data Persistence 0–5 | Backend Security / Role Control 0–5 | Validation / Error Handling 0–5 | Testing Evidence 0–5 | Maintainability 0–5 | UI / Manual Usability 0–5 | Evidence | Notes |
|---|---:|---:|---:|---:|---:|---:|---:|---|---|
| Project setup and run commands | 4 | — | — | — | 0 | 3 | — | `backend/package.json` scripts: `start`, `dev`, `db:seed`. `frontend/package.json`: `dev`. No root-level orchestration script. | No README with combined run instructions. Two separate terminals required. No `.env` copy step documented. |
| Database setup and starter data | 5 | 5 | — | 3 | 0 | 3 | — | `dbInit.js` drops and recreates both tables; seeds 4 appointments and 4 users. `schema.sql` is in sync. `npm run db:seed` is the entry point. | `DROP TABLE IF EXISTS` on every run = destructive reset, not a migration. No idempotent migration strategy. |
| Login workflow | 4 | 4 | 2 | 3 | 0 | 2 | 4 | `POST /api/login` queries `users` table by `username + password`. Session stored in `localStorage`. Logout clears storage. Error message shown on bad credentials. | **Passwords stored and compared in plaintext.** `localStorage` persistence is a known XSS risk. No token expiry. |
| Role-based access | 4 | 4 | 4 | 3 | 0 | 3 | 4 | `authenticateUser` middleware re-queries DB on every call. `POST /api/appointments` checks `role === 'receptionist'`. `PUT /api/appointments/:id` (booking details) checks `role === 'receptionist'`. `PUT /api/appointments/:id/notes` checks `role === 'doctor'`. UI conditionally renders role views. | Auth token is raw username string — trivially forgeable. No JWT or session token. Middleware is per-route manual application, not a router-level guard. |
| Main create action | 4 | 5 | 4 | 3 | 0 | 3 | 4 | `POST /api/appointments` implemented. All 6 fields validated server-side (`!field` check). Frontend `required` on all inputs. Inserts with default status `Scheduled`. | No date-in-past guard. No duplicate booking check (same doctor + date + time). Contact number accepts any string. `alert()` used for success feedback instead of inline UI. |
| Main view/list action | 4 | 5 | 4 | 2 | 0 | 3 | 4 | `GET /api/appointments` implemented. Doctors automatically filtered to own `doctor_name`. Receptionists see all. Ordered by date/time ASC. Frontend table renders patient, doctor, date, time, status. | Visits note visible to receptionist in the table (read-only preview), which is intentional per case brief. No pagination. All records loaded at once. |
| Main update/status/cancel action | 3 | 4 | 4 | 3 | 0 | 2 | 3 | Edit modal (receptionist) updates all fields including status. Cancel sends PUT with `status: 'Cancelled'` — functional. Backend enforces receptionist-only. | **No dedicated cancel endpoint** — cancel piggybacks PUT. Cancel button only shown for `Scheduled` status in UI, but backend does not block cancelling an already-cancelled or completed appointment. Edit is always available regardless of appointment status (can edit Cancelled/Completed appointments). No confirmation on edits, only on cancel. |
| Protected action | 4 | 5 | 5 | 3 | 0 | 3 | 4 | `PUT /api/appointments/:id/notes` requires `role === 'doctor'` AND enforces `doctor_name = req.user.doctor_name` in the `WHERE` clause. `affectedRows === 0` check returns 403 if doctor doesn't own appointment. UI only shows note button to doctors. Receptionist view shows visit note read-only. | Doctor can add/edit note on a `Cancelled` appointment (UI only hides button for cancelled, but the condition checks `apt.status !== 'Cancelled'` — this is correct in UI; backend has no status guard). Visit note textarea has `required` but an empty string passes the `visit_note === undefined` server check. |
| Secondary feature | 4 | — | — | 2 | 0 | 3 | 4 | Filter by doctor (receptionist only), status (both roles), and date (both roles) implemented client-side. All three filter controls present in UI. Filters compose correctly (AND logic). | Filters are **client-side only** — all records loaded then filtered in JS. Doctor filter for receptionist uses hardcoded option list, not DB-driven. Doctor filter absent from doctor view (appropriate — they only see own). |
| Case-specific: appointment date/time and doctor assignment | 4 | 5 | 4 | 2 | 0 | 3 | 4 | Date (`DATE`) and time (`TIME`) stored as separate columns. Doctor assigned at booking as `VARCHAR`. Date/time display in table. Edit modal allows changing date, time, doctor. | No past-date prevention at backend. Doctor list hardcoded in frontend selects (`Dr. Adams`, `Dr. Baker`, `Dr. Carter`) — not fetched from `users` table. Doctor stored as free-text name, not a foreign key to `users.id`, creating a potential mismatch risk. |
| Case-specific: appointment status and cancellation flow | 3 | 4 | 4 | 2 | 0 | 2 | 3 | Status ENUM (`Scheduled`, `Completed`, `Cancelled`) in DB. Status pill displayed in UI. Doctor note save auto-sets `Completed`. Cancel sets `Cancelled`. Edit modal lets receptionist manually set any status. | No status transition rules enforced at backend (e.g., cannot go from `Cancelled` back to `Scheduled` — backend allows it). Cancel reuses PUT — no atomic cancel endpoint. No audit trail of status changes. |
| Case-specific: visit note privacy and doctor-only editing | 5 | 5 | 5 | 3 | 0 | 4 | 4 | Backend role check + ownership check in SQL `WHERE`. Separate `/notes` endpoint isolates note writes from booking writes. Receptionist sees note read-only in table. Edit modal (receptionist) does not expose `visit_note` field. Doctor view renders notes in a distinct styled preview. | Visit note `required` attribute on textarea but backend only checks `=== undefined`, meaning empty string `""` passes. Saving empty note marks appointment `Completed` with no note text — semantic gap. |
| UI / manual usability | 4 | — | — | — | 0 | 3 | 4 | Clean card layout, Inter font via CSS variable, status pills with colour coding, responsive grid breakpoint at 1100 px, modal overlays with backdrop blur, demo credentials listed on login page. | `alert()` / `window.confirm()` used throughout instead of inline UI feedback. No toast notifications. No accessibility attributes (aria-label, role). No loading indicator on individual action buttons. |
| Security posture | 2 | — | 2 | — | 0 | 2 | — | Role checks present on all write routes. Ownership check on visit notes. CORS enabled (open — no origin restriction). | Plaintext passwords. Username-as-token (trivially spoofable). Wide-open CORS. No rate limiting. No input sanitisation beyond truthy checks. No helmet or similar HTTP-header middleware. Secrets in `.env` but `.env` not gitignored (`.gitignore` is frontend-only). |
| Testing evidence | 0 | 0 | 0 | 0 | 0 | 0 | 0 | No test files, no test runner configured, no test scripts in either `package.json`. | Expected at pre-testing stage. Health endpoint `/api/health` exists and is the only testable hook without a framework. |
| Maintainability | 3 | — | — | — | 0 | 3 | — | Single-file frontend (`App.jsx`, 782 lines). Backend is single-file (`server.js`, 220 lines). No component decomposition, no services layer, no shared constants. `dbInit.js` and `schema.sql` are separate but redundant (schema duplicated). | Code is readable with good inline comments. CSS uses design tokens (CSS custom properties). No TypeScript. No linting configured for backend. ESLint configured for frontend. |

---

## 3. Current Feature Status

| Feature | Implemented | Persisted to DB | Backend-protected | Notes |
|---|:---:|:---:|:---:|---|
| Login (DB-backed) | ✅ | ✅ | ✅ | Plaintext password |
| Logout / session clear | ✅ | — | — | localStorage cleared |
| List appointments | ✅ | ✅ | ✅ | Doctor sees own only (enforced in SQL) |
| Create appointment | ✅ | ✅ | ✅ | Receptionist-only |
| Edit appointment details | ✅ | ✅ | ✅ | Receptionist-only |
| Cancel appointment | ✅ | ✅ | ✅ | Via PUT, not dedicated endpoint |
| Add visit note | ✅ | ✅ | ✅ | Doctor-only + ownership check |
| Edit visit note | ✅ | ✅ | ✅ | Same endpoint as add |
| Filter by doctor | ✅ | — | — | Client-side, receptionist only |
| Filter by status | ✅ | — | — | Client-side, both roles |
| Filter by date | ✅ | — | — | Client-side, both roles |
| Role-aware dashboard | ✅ | — | ✅ | Separate UI branches per role |

---

## 4. Database and Persistence Status

**Tables confirmed:** `appointments`, `users` — both present in `schema.sql` and recreated in `dbInit.js`.

**Seed command:** `npm run db:seed` (calls `node dbInit.js`) — repeatable, destroys and repopulates both tables.

**Appointments table columns:** `id`, `patient_name`, `contact_number`, `doctor_name`, `appointment_date` (DATE), `appointment_time` (TIME), `reason`, `status` (ENUM), `visit_note`, `created_at`, `updated_at`.

**Users table columns:** `id`, `username`, `password` (plaintext VARCHAR), `role` (ENUM: `receptionist` / `doctor`), `doctor_name`, `created_at`.

**Seed accounts:**
- `receptionist` / `password123` → role: receptionist
- `dr_adams` / `password123` → role: doctor, doctor_name: `Dr. Adams`
- `dr_baker` / `password123` → role: doctor, doctor_name: `Dr. Baker`
- `dr_carter` / `password123` → role: doctor, doctor_name: `Dr. Carter`

**Seed appointments:** 4 rows covering Dr. Adams (×2), Dr. Baker, Dr. Carter. One completed with a visit note.

**Gaps:**
- `doctor_name` in `appointments` is a free-text VARCHAR, not a foreign key to `users.id` — referential integrity not enforced.
- `password` column is VARCHAR(100) storing plaintext. No `password_hash` column.
- `schema.sql` is a standalone file that may drift from `dbInit.js` since both define the schema independently.
- `DROP TABLE IF EXISTS` makes `db:seed` destructive — unsuitable once the app has real data.
- No `updated_by` or audit column on appointments.

---

## 5. Login and Role/Access Status

**Login type:** Database-backed (`users` table). `POST /api/login` matches `username` AND `password` (plaintext). Returns `{ user: { username, role, doctor_name } }`.

**Session mechanism:** `localStorage` under key `clinic_user`. The stored object is the raw user row subset. On every protected API call, the `username` field from `localStorage` is sent as the `Authorization` header value (plain string, not a Bearer token). The backend middleware re-fetches the user row from MySQL on each request using that username.

**Role enforcement locations:**
- `POST /api/appointments` — checks `req.user.role === 'receptionist'` ✅
- `PUT /api/appointments/:id` — checks `req.user.role === 'receptionist'` ✅  
- `PUT /api/appointments/:id/notes` — checks `req.user.role === 'doctor'` ✅
- `GET /api/appointments` — no role block but applies doctor-scoping ✅

**Doctor record scoping:** `GET /api/appointments` adds `WHERE doctor_name = ?` using `req.user.doctor_name` when role is `doctor`. The visit-note `PUT` also appends `AND doctor_name = ?` to the `WHERE` clause.

**Gaps:**
- **Plaintext passwords.** No bcrypt or equivalent.
- **Username-as-token is trivially spoofable.** Any user who knows another username can forge a request.
- No session expiry, no refresh mechanism.
- `localStorage` is accessible to any JS on the page — XSS risk.
- No rate limiting on `POST /api/login`.

---

## 6. Protected Action Status

**Protected action:** Add or edit visit notes (`PUT /api/appointments/:id/notes`).

**Enforcement layers:**
1. `authenticateUser` middleware — 401 if no `Authorization` header or username not in DB.
2. Role check — 403 if `req.user.role !== 'doctor'`.
3. SQL ownership — `WHERE id = ? AND doctor_name = ?` uses `req.user.doctor_name` (not user-supplied). `affectedRows === 0` returns 403.

**UI protection:** Receptionist view renders `visit_note` read-only (styled preview). The edit modal (receptionist) has no `visit_note` input field. Doctor view shows "Add Note" / "Edit Note" button per row.

**Gaps:**
- Saving an empty string `""` as `visit_note` passes the server check (`visit_note === undefined` is false for `""`). The appointment is then marked `Completed` with no clinical content.
- A doctor can add/edit a note on a `Cancelled` appointment (backend has no status guard on this endpoint — only the UI hides the button for cancelled rows). An explicit server-side status guard is missing.
- The `/notes` endpoint auto-sets status to `Completed`. There is no way to write a note without completing the appointment — which may be intentional per the case brief but is not documented.

---

## 7. Validation Status

**Backend validation present:**
- `POST /api/login` — checks `!username || !password` → 400.
- `POST /api/appointments` — checks all 6 fields truthy → 400.
- `PUT /api/appointments/:id` — checks all 7 fields truthy → 400.
- `PUT /api/appointments/:id/notes` — checks `visit_note === undefined` → 400.

**Frontend validation present:**
- HTML5 `required` on all booking form inputs and the visit note textarea.
- `window.confirm()` on cancel action.

**Gaps:**
- No date format or past-date validation (backend or frontend).
- No phone number format check (`contact_number` accepts any string, including empty-ish values that pass truthy check if whitespace-only).
- No maximum length enforcement in application logic (DB columns define limits but no application-level response if they are hit).
- Status transitions are not validated — backend allows setting status to any ENUM value in a PUT, including `Scheduled → Scheduled` no-op or `Cancelled → Scheduled` reactivation.
- `visit_note === undefined` check misses empty string — should be `!visit_note || visit_note.trim() === ''`.
- No duplicate-booking detection (same doctor, date, time).
- No server-side check that `doctor_name` submitted at booking matches an actual `users.doctor_name` in the database.

---

## 8. Stage Drift / Early Implementation

The following were reviewed for features implemented ahead of their expected stage:

| Item | Present? | Stage expected | Assessment |
|---|:---:|---|---|
| Unit / integration tests | ❌ | Stage 8+ | Not implemented early — correct |
| JWT or token-based auth | ❌ | Security hardening stage | Not implemented — plaintext auth is below the expected line for even pre-hardening |
| Password hashing | ❌ | Security hardening stage | Missing — a gap, not early drift |
| Input sanitisation / XSS guards | ❌ | Security hardening stage | Not present — expected gap |
| Pagination | ❌ | Not in case scope | Absent — appropriate |
| Audit log / change history | ❌ | Not in case scope | Absent — appropriate |
| Doctor list from DB (dynamic) | ❌ | Could be current stage | Hardcoded — minor gap |
| Role-scoped DB query for doctors | ✅ | Current stage | Correctly implemented |
| Status auto-complete via note save | ✅ | Current stage | Correctly implemented |
| Filter feature (secondary) | ✅ | Current stage | Correctly implemented |

**Verdict:** No features from future stages were implemented early. One item (password hashing) is below acceptable pre-hardening baseline, but this is a gap rather than drift in the other direction.

---

## 9. Issues Found Before Stage 8

Issues are grouped by severity.

### 🔴 Critical (must fix before security hardening stage)

| # | Location | Issue |
|---|---|---|
| C-1 | `backend/server.js` L47, `dbInit.js` L70–75 | **Plaintext passwords.** `users.password` stored as VARCHAR and compared with `WHERE username = ? AND password = ?`. No hashing. |
| C-2 | `backend/server.js` L71 | **Username-as-auth-token.** The `Authorization` header value is the raw username string. Any client can forge any user identity without knowing their password after initial login. |

### 🟠 High (should fix before testing)

| # | Location | Issue |
|---|---|---|
| H-1 | `backend/server.js` L9 | **Wide-open CORS.** `app.use(cors())` allows all origins. Should be restricted to frontend origin for any realistic test. |
| H-2 | `backend/server.js` L188 | **Empty visit note bypasses validation.** `visit_note === undefined` passes for `""`. Appointment gets marked `Completed` with no note. Should check `!visit_note || !visit_note.trim()`. |
| H-3 | `backend/server.js` L180–214 | **No status guard on note endpoint.** Doctor can write a visit note on a `Cancelled` appointment at the API level. |
| H-4 | `frontend/src/App.jsx` L393–396, L451–453, L674–676 | **Hardcoded doctor list in frontend.** Doctor options are static strings. Adding a doctor to the `users` table has no effect on available booking options. |
| H-5 | `backend/server.js` L148–177 | **No status transition rules.** Edit PUT allows any status → any status, including `Cancelled → Scheduled` reactivation. |
| H-6 | `backend/.env` | **`.env` is not gitignored at project root.** The frontend has a `.gitignore` but the backend `.env` containing database credentials has no gitignore protecting it at the backend or root level. |

### 🟡 Medium (should address during cleanup)

| # | Location | Issue |
|---|---|---|
| M-1 | `backend/server.js`, `frontend/src/App.jsx` | **Cancel reuses PUT.** Cancellation is a status-change action semantically distinct from a full edit. A dedicated `PATCH /api/appointments/:id/cancel` or `PUT .../cancel` endpoint would make intent explicit and allow tighter validation. |
| M-2 | `backend/server.js` L112–116 | **Truthy-only field validation.** Whitespace-only strings (e.g., `"   "`) pass the `!field` check. Should use `.trim()`. |
| M-3 | `frontend/src/App.jsx` L151, L212, L240 | **`alert()` / `window.confirm()` for all feedback.** Blocks UI thread; inconsistent UX. Should be replaced with inline toast/banner. |
| M-4 | `backend/server.js`, `dbInit.js` | **Schema defined in two places.** `schema.sql` and `dbInit.js` both declare table DDL. They must be kept in sync manually. |
| M-5 | `frontend/src/App.jsx` | **782-line monolithic component.** All state, handlers, and JSX in a single file. Should be split into LoginPage, ReceptionistDashboard, DoctorDashboard, AppointmentTable, modals. |
| M-6 | `backend/server.js` | **`node --watch` used for dev.** `node --watch` is built-in but not production-equivalent. Acceptable for prototype; note for documentation. |
| M-7 | `appointments.doctor_name` | **Doctor name stored as free text.** Not a foreign key. Booking a `Dr. Smith` who does not exist in `users` is possible — doctor scoping in `GET` would then return no records for that doctor login. |

### 🔵 Low / Cosmetic

| # | Location | Issue |
|---|---|---|
| L-1 | `frontend/src/App.jsx` L47 | **Backend URL hardcoded.** `http://localhost:5000` appears ~7 times. Should be an env variable (`VITE_API_URL`). |
| L-2 | `frontend/README.md` | **README is Vite template boilerplate.** No project-specific run instructions, seed steps, or credential list. |
| L-3 | `frontend/src/App.jsx` L618 | **Cancelled appointments still show "Add/Edit Note" button path.** The condition `apt.status !== 'Cancelled'` hides the button, but note: the appointment_date display uses `new Date(...).toLocaleDateString()` without timezone normalization — date may show one day early in some locales due to UTC midnight issue. |
| L-4 | `backend/package.json` | **No `db:migrate` or incremental migration command.** Only a destructive reset exists. |

---

## 10. Manual Checks Recommended Next

Before proceeding to Stage 8 (testing), the following manual checks should be performed by running the app:

1. **Login smoke test** — log in as each of the 4 seed accounts; verify role-correct dashboard appears; verify logout clears session and redirects to login.
2. **Receptionist workflow** — create an appointment, verify it appears in the list; edit it (change doctor, date, time); cancel it (verify status becomes `Cancelled`; verify Cancel button disappears); verify a second attempt to cancel is blocked by UI.
3. **Doctor workflow** — log in as `dr_adams`; verify only Dr. Adams' appointments appear; add a visit note to a Scheduled appointment; verify status changes to `Completed`; log in as `dr_baker`; attempt to access Dr. Adams' appointment ID via a manual `fetch` or browser request with `dr_baker`'s token — verify 403.
4. **Role isolation test** — with DevTools open, copy the `clinic_user` key from localStorage for the receptionist; manually call `PUT /api/appointments/1/notes` with `Authorization: receptionist` header — verify 403.
5. **Filter test** — verify that filtering by each doctor, each status, and a specific date returns correct subsets; verify that clearing filters restores all records.
6. **DB seed re-run** — run `npm run db:seed` again and verify all data is reset cleanly, with no duplicate-key errors.
7. **Cross-origin request test** — from a browser tab on a different port, verify CORS behaviour (currently open — expected to succeed from anywhere).
8. **Empty visit note test** — as a doctor, submit an empty visit note textarea (currently blocked by frontend `required` but backend would accept empty string if HTML constraint bypassed).

---

## 11. Pass/Fail Table

| Check | Result | Notes |
|---|:---:|---|
| App appears runnable (both servers have start commands) | ✅ Pass | `npm run dev` (frontend), `npm start` / `npm run dev` (backend). No root-level combined start. |
| React and Express are separated into distinct processes | ✅ Pass | `frontend/` (Vite/React, port 5173) and `backend/` (Express, port 5000) are fully separate. |
| React calls Express routes; no direct MySQL from React | ✅ Pass | All DB access is through `fetch('http://localhost:5000/api/...')` in React. MySQL client is backend-only. |
| Backend uses DB_HOST, DB_PORT, DB_USER, DB_PASSWORD, DB_NAME | ✅ Pass | All five variables used in `server.js` L14–18 and `dbInit.js` L6–9. Loaded via `dotenv`. |
| MySQL credentials not exposed in React bundle | ✅ Pass | No `mysql2` import in frontend. No `.env` in frontend directory. |
| Users/login table exists | ✅ Pass | `users` table defined in both `schema.sql` and `dbInit.js`. |
| Repeatable database setup/seed command exists | ✅ Pass | `npm run db:seed` in `backend/package.json`. |
| Login is database-backed | ✅ Pass | `POST /api/login` queries `users` table. Mock/role-selector login is absent. |
| Role restrictions enforced in backend, not only UI | ✅ Pass | `authenticateUser` middleware + role checks on every write route. |
| Visit note add/edit is protected (role + ownership) | ✅ Pass | Role check (doctor only) + SQL `WHERE doctor_name = ?` + `affectedRows === 0` → 403. |
| Doctor scoped to own appointments | ✅ Pass | `GET /api/appointments` adds `WHERE doctor_name = ?` for doctor role. |
| Appointment create workflow implemented | ✅ Pass | `POST /api/appointments` with all fields, receptionist-only. |
| Appointment view/list workflow implemented | ✅ Pass | `GET /api/appointments` with role-aware scoping. |
| Appointment update workflow implemented | ✅ Pass | `PUT /api/appointments/:id` with full field update, receptionist-only. |
| Appointment cancel workflow implemented | ⚠️ Partial | Cancel works via PUT (status → Cancelled). No dedicated cancel endpoint. No server-side status transition guard. |
| Filter by doctor implemented | ✅ Pass | Client-side filter by `doctor_name` for receptionist. |
| Filter by date implemented | ✅ Pass | Client-side filter by `appointment_date`. |
| Filter by status implemented | ✅ Pass | Client-side filter by `status` for both roles. |
| Validation present | ⚠️ Partial | Server-side truthy checks on required fields. Missing: date validation, trim checks, empty-note guard, status transition rules, duplicate booking guard. |
| No future stages implemented early | ✅ Pass | No tests, no JWT, no pagination, no audit trail introduced ahead of schedule. |
| Passwords not stored in plaintext | ❌ Fail | Passwords are VARCHAR, stored and compared as plaintext. No bcrypt. |
| Auth token is not trivially forgeable | ❌ Fail | Auth token is the raw `username` string. No cryptographic signature. |
| CORS restricted to known origins | ❌ Fail | `cors()` called with no options — all origins allowed. |
| `.env` not committed / gitignored | ⚠️ Partial | Frontend `.gitignore` excludes nothing in backend dir. No root `.gitignore`. Backend `.env` is present on disk. `.env.example` exists as template. |
| No hardcoded secrets in source | ✅ Pass | No credentials in `server.js` or `App.jsx` directly. All via `.env`. |

---

*End of mid-project review. No source code was modified during this review.*
