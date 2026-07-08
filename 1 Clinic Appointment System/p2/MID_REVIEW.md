# Mid-Project Review — Clinic Appointment System

**Review date:** 2026-06-05  
**Review stage:** After secondary feature (filter appointments), before testing, security hardening, and maintainability cleanup  
**Reviewer:** Automated code review (Antigravity)

---

## 1. Mid-Review Summary

The Clinic Appointment System is a React (Vite) + Express + MySQL prototype with two roles (Receptionist and Doctor) managing patient appointments. The project is structurally sound: frontend and backend are cleanly separated into `frontend/` and `backend/` directories, React calls Express REST routes exclusively, and the backend uses environment variables for MySQL credentials via `.env` / `dotenv`. The core appointment CRUD workflow (create, view, update, cancel) is implemented with proper role restrictions enforced in backend route handlers. The secondary feature (filter by doctor, date, status) is functional. Visit notes are protected behind doctor-only access with an ownership check in the backend.

**Key strengths at this stage:**
- Clean React ↔ Express architecture with no direct DB access from the frontend.
- Database-backed login with session tokens stored in DB (not JWT, not mock).
- Backend role enforcement on every protected route (not UI-only).
- Doctor ownership check for visit notes prevents cross-doctor editing.
- Repeatable database setup via `npm run db:setup`.
- Both frontend and backend validation of appointment fields.

**Key concerns at this stage:**
- Passwords stored in plain text (no hashing) — expected pre-security-hardening.
- `schema.sql` is out of sync with `dbSetup.js` (different column names, different status enum values, no users table).
- Quick-login buttons in the Login component expose seed credentials in shipped frontend code.
- `index.css` contains Vite boilerplate styles that partially conflict with `App.css`.
- `CORS` is fully open (`app.use(cors())`) with no origin restriction.
- No rate limiting on login endpoint.
- The `getDoctorName()` helper uses a brittle hardcoded username-to-doctor mapping.
- `react-router-dom` is listed as a dependency but not used anywhere in the app.

---

## 2. Review Scoring Matrix

| Feature / Area | Functionality 0-5 | Data Persistence 0-5 | Backend Security / Role Control 0-5 | Validation / Error Handling 0-5 | Testing Evidence 0-5 | Maintainability 0-5 | UI / Manual Usability 0-5 | Evidence | Notes |
|---|---:|---:|---:|---:|---:|---:|---:|---|---|
| Project setup and run commands | 4 | N/A | N/A | N/A | N/A | 3 | N/A | `package.json` scripts: `dev`, `start`, `db:setup` in backend; `dev`, `build` in frontend; both `node_modules` present | Missing root-level README with setup instructions; `.env.example` present but `DB_PORT` missing from it; frontend title is generic "frontend" |
| Database setup and starter data | 4 | 4 | N/A | 3 | N/A | 3 | N/A | `dbSetup.js` creates DB, tables, seeds users and appointments; `schema.sql` also exists | `schema.sql` is stale (uses `contact_number` vs `patient_phone`, `Scheduled` vs `booked`, no users table); `dbSetup.js` is the authoritative setup; seeds use plain-text passwords |
| Login workflow | 4 | 4 | 3 | 3 | 2 | 3 | 4 | `userRoutes.js` POST `/login` checks DB, generates `crypto.randomBytes` token, stores in DB; `authMiddleware.js` validates token per-request; frontend stores token in `localStorage` | Passwords stored/compared in plain text; no bcrypt/argon2; quick-login buttons embed credentials in frontend source; no login rate limiting; session has no TTL/expiry |
| Role-based access | 4 | N/A | 4 | 3 | 2 | 3 | 4 | Backend checks `req.user.role` on POST, PUT, PUT/:id/note, DELETE routes; returns 403 for wrong role; frontend hides buttons conditionally | All role checks are in backend route handlers; doctor GET restricted to own appointments via `getDoctorName()`; receptionist cannot add notes; doctor cannot create/edit/cancel appointments |
| Main create action | 4 | 4 | 4 | 4 | 2 | 3 | 4 | POST `/api/appointments` receptionist-only; validates required fields, patient name alpha-only, phone format; inserts into MySQL | No duplicate appointment check (same patient/doctor/date/time); no past-date prevention; doctor list is hardcoded in frontend dropdown |
| Main view/list action | 4 | 4 | 4 | 3 | 2 | 3 | 4 | GET `/api/appointments` with query params; doctor role auto-filtered to own appointments server-side; results ordered by date/time | Works correctly; doctor cannot see other doctors' appointments; receptionist sees all with optional filters |
| Main update/status/cancel action | 4 | 4 | 4 | 3 | 2 | 3 | 3 | PUT `/:id` receptionist-only for booking edits; DELETE `/:id` sets status to `cancelled` (soft delete); frontend confirmation dialog | Cancel does not prevent re-cancelling already cancelled appointments; receptionist can edit cancelled/completed appointments back to booked; no audit trail |
| Protected action | 4 | 4 | 4 | 3 | 2 | 3 | 4 | PUT `/:id/note` doctor-only; ownership check compares `getDoctorName(req.user.username)` with `existing[0].doctor_name`; empty note rejected | Adding a note auto-sets status to `completed`; note can be overwritten by same doctor; `getDoctorName()` is brittle hardcoded mapping |
| Secondary feature | 4 | N/A | 3 | 3 | 1 | 3 | 4 | Filter panel with doctor, status, date dropdowns; query params sent to backend; doctor filter disabled and auto-set for doctor role | Doctor list is hardcoded in both frontend and `getDoctorName()`; no "clear filters" button; empty string params sent to backend (harmless but untidy) |
| Case-specific: appointment date/time and doctor assignment | 4 | 4 | 3 | 2 | 1 | 2 | 4 | Date and time inputs use HTML `date`/`time` types; doctor assigned from dropdown; stored as DATE and TIME columns in MySQL | No past-date validation; no double-booking check for same doctor/time slot; doctor list hardcoded; no time-range constraints (e.g., clinic hours) |
| Case-specific: appointment status and cancellation flow | 4 | 4 | 4 | 3 | 2 | 3 | 3 | Status enum `booked/completed/cancelled`; cancellation is soft-delete; frontend hides Cancel button for already-cancelled; backend allows re-cancellation | No guard against cancelling completed appointments; receptionist can change any status via edit modal; no status transition rules enforced |
| Case-specific: visit note privacy and doctor-only editing | 5 | 4 | 5 | 3 | 2 | 3 | 4 | Backend enforces doctor-only + ownership check; receptionist gets 403 on note endpoint; cross-doctor attempt returns 403; frontend only shows note button for doctors | Strong implementation; both role + ownership enforced server-side; note visible to all roles in table (read-only display) which is acceptable |
| UI/manual usability | N/A | N/A | N/A | N/A | N/A | 3 | 4 | Clean table layout, modal forms, status badges, filter panel, quick-login for demo convenience | `index.css` Vite boilerplate conflicts slightly; `#root` has fixed width 1126px; no mobile responsiveness; page title is "frontend" not app name; no loading skeleton |
| Security posture | N/A | N/A | 2 | 2 | 1 | 2 | N/A | Session tokens in DB; role checks on all routes; `.env` for secrets; `.env.example` provided | Plain-text passwords; CORS wide open; no rate limiting; no HTTPS enforcement; no input sanitization beyond basic validation; quick-login embeds credentials; no CSP headers; session never expires |
| Testing evidence | N/A | N/A | N/A | N/A | 3 | 3 | N/A | `tests/db.test.js` exists with 8 integration tests using supertest; covers health, auth denial, role denial, create, update denial, ownership, note save, cancel | Tests exist and are well-structured; they test real DB; cleanup in afterAll; jest + supertest configured; but tests have not been verified to run; no frontend tests |
| Maintainability | N/A | N/A | N/A | N/A | N/A | 2 | N/A | Reasonable file structure; separated routes, middleware, services; CSS variables for theming | `getDoctorName()` hardcoded mapping; doctor list hardcoded in multiple places; `schema.sql` stale; `index.css` boilerplate left in; no JSDoc; Dashboard.jsx is 448 lines (monolithic); `react-router-dom` unused dependency |

---

## 3. Current Feature Status

| Feature | Status | Frontend | Backend | Notes |
|---|---|---|---|---|
| Appointment create | ✅ Implemented | Create modal with form validation | POST `/api/appointments` with role + validation | Receptionist-only; all fields required |
| Appointment view/list | ✅ Implemented | Table with all appointment data | GET `/api/appointments` with role-based filtering | Doctor auto-filtered to own appointments |
| Appointment update | ✅ Implemented | Edit modal pre-populated | PUT `/api/appointments/:id` with role check | Receptionist-only |
| Appointment cancel | ✅ Implemented | Cancel button with confirm dialog | DELETE `/api/appointments/:id` (soft delete) | Sets status to `cancelled`; receptionist-only |
| Filter by doctor | ✅ Implemented | Dropdown (disabled for doctors) | Query param `doctor` on GET | Doctor list hardcoded |
| Filter by date | ✅ Implemented | Date input | Query param `date` on GET | Works correctly |
| Filter by status | ✅ Implemented | Dropdown (booked/completed/cancelled) | Query param `status` on GET | Works correctly |
| Visit notes (protected) | ✅ Implemented | Note modal for doctors only | PUT `/api/appointments/:id/note` with ownership | Auto-completes appointment |
| Login | ✅ Implemented | Login form + quick-login buttons | POST `/api/users/login` with DB lookup + session token | Database-backed; plain-text passwords |
| Logout | ✅ Implemented | Logout button in navbar | POST `/api/users/logout` clears session token in DB | Token cleared from DB and localStorage |
| Session persistence | ✅ Implemented | `useEffect` checks `/api/users/me` on load | GET `/api/users/me` returns user from session token | Survives page refresh |

---

## 4. Database and Persistence Status

### Tables

| Table | Defined in `dbSetup.js` | Defined in `schema.sql` | Used by backend routes | Status |
|---|---|---|---|---|
| `users` | ✅ Yes (id, username, password, role, session_token, created_at) | ❌ No | ✅ `userRoutes.js`, `authMiddleware.js` | Functional |
| `appointments` | ✅ Yes (id, patient_name, patient_phone, doctor_name, appointment_date, appointment_time, reason, status, visit_note, created_at, updated_at) | ⚠️ Partial (uses `contact_number` instead of `patient_phone`, `Scheduled/Completed/Cancelled` instead of `booked/completed/cancelled`) | ✅ `appointmentRoutes.js` | Functional via `dbSetup.js`; `schema.sql` is stale |

### Schema Drift: `dbSetup.js` vs `schema.sql`

| Aspect | `dbSetup.js` (authoritative) | `schema.sql` (stale) |
|---|---|---|
| Phone column name | `patient_phone` | `contact_number` |
| Status enum values | `'booked', 'completed', 'cancelled'` | `'Scheduled', 'Completed', 'Cancelled'` |
| Users table | ✅ Defined and seeded | ❌ Missing |
| Database name | `c1p2` (from `.env`) | `clinic_db` (hardcoded) |

### Seed Data

| Entity | Count | Details |
|---|---|---|
| Users | 3 | `receptionist1` (receptionist), `dr_smith` (doctor), `dr_adams` (doctor) |
| Appointments | 3 | 2 booked (Dr. Smith, Dr. Adams), 1 completed with visit note (Dr. Smith) |

### Database Setup Command

```bash
cd backend
npm run db:setup    # runs node dbSetup.js
```

- ✅ Creates database if not exists
- ✅ Creates tables if not exist
- ✅ Seeds only if tables are empty (idempotent)
- ✅ Handles `session_token` column migration
- ⚠️ Passwords seeded in plain text

### Environment Variables

| Variable | Used in `db.js` | Used in `dbSetup.js` | In `.env` | In `.env.example` |
|---|---|---|---|---|
| `DB_HOST` | ✅ | ✅ | ✅ `localhost` | ✅ `localhost` |
| `DB_PORT` | ✅ | ✅ | ✅ `3306` | ❌ Missing |
| `DB_USER` | ✅ | ✅ | ✅ `root` | ✅ `root` |
| `DB_PASSWORD` | ✅ | ✅ | ✅ (empty) | ✅ `your_password` |
| `DB_NAME` | ✅ | ✅ | ✅ `c1p2` | ✅ `clinic_db` |

- ✅ No database credentials exposed in frontend code
- ✅ Frontend uses `VITE_API_URL` env var for API base URL

---

## 5. Login and Role/Access Status

### Login Type

**Database-backed login** — Not mock, not role-selector-only.

- Backend queries `users` table matching `username` and `password` (plain text comparison)
- On success, generates `crypto.randomBytes(32).toString('hex')` session token
- Token stored in `users.session_token` column in DB
- Token returned to frontend and saved in `localStorage`

### Authentication Flow

```
Frontend Login Form → POST /api/users/login → DB lookup → session token generated → stored in DB + localStorage
                                                                                     ↓
Every subsequent request → Authorization: Bearer <token> → authMiddleware → DB lookup by token → req.user populated
```

### Role Enforcement Matrix

| Action | Route | Receptionist | Doctor | Unauthenticated | Enforcement Location |
|---|---|---|---|---|---|
| View appointments | GET `/api/appointments` | ✅ All | ✅ Own only | ❌ 401 | `authMiddleware.js` + `appointmentRoutes.js` L40-53 |
| Create appointment | POST `/api/appointments` | ✅ | ❌ 403 | ❌ 401 | `appointmentRoutes.js` L77-78 |
| Update appointment | PUT `/api/appointments/:id` | ✅ | ❌ 403 | ❌ 401 | `appointmentRoutes.js` L103-104 |
| Cancel appointment | DELETE `/api/appointments/:id` | ✅ | ❌ 403 | ❌ 401 | `appointmentRoutes.js` L172-173 |
| Add/edit visit note | PUT `/api/appointments/:id/note` | ❌ 403 | ✅ Own only | ❌ 401 | `appointmentRoutes.js` L136-137 + L154-157 |
| Login | POST `/api/users/login` | ✅ | ✅ | ✅ | Public route |
| Logout | POST `/api/users/logout` | ✅ | ✅ | ❌ 401 | `authMiddleware.js` |
| Get current user | GET `/api/users/me` | ✅ | ✅ | ❌ 401 | `authMiddleware.js` |

### Security Gaps (Pre-Hardening)

- ❌ Passwords stored and compared in **plain text** (no bcrypt/argon2)
- ❌ Session tokens have **no expiry/TTL**
- ❌ No **rate limiting** on login endpoint
- ❌ **CORS wide open** — `app.use(cors())` with no origin whitelist
- ❌ Quick-login buttons in `Login.jsx` L85-97 embed seed credentials in frontend source
- ⚠️ `getDoctorName()` mapping is hardcoded — adding a new doctor requires code changes in `appointmentRoutes.js`

---

## 6. Protected Action Status

### Visit Note Protection

**Implementation:** `PUT /api/appointments/:id/note` in [appointmentRoutes.js](file:///h:/docs/Demo/Ai-Workshop/1%20Clinic%20Appointment%20System/p2/backend/routes/appointmentRoutes.js#L134-L168)

| Check | Enforced | Location | HTTP Response |
|---|---|---|---|
| Authentication required | ✅ | `authMiddleware.js` (applied globally via `router.use`) | 401 |
| Doctor role required | ✅ | `appointmentRoutes.js` L136 | 403 "Only doctors can add visit notes" |
| Doctor owns appointment | ✅ | `appointmentRoutes.js` L154-157 — compares `getDoctorName(req.user.username)` with DB `doctor_name` | 403 "You cannot edit notes for appointments assigned to another doctor" |
| Note not empty | ✅ | `appointmentRoutes.js` L143 | 400 "Visit note content is required" |

**Verdict:** Visit note protection is **well-implemented** with layered checks (auth → role → ownership → validation). This is one of the strongest parts of the implementation.

### Frontend Protection

- ✅ Note button only rendered for doctor role (`Dashboard.jsx` L302-309)
- ✅ Edit/Cancel buttons only rendered for receptionist role (`Dashboard.jsx` L284-301)
- ✅ New Appointment button only rendered for receptionist role (`Dashboard.jsx` L190-194)

---

## 7. Validation Status

### Backend Validation

| Field | Validation | Location |
|---|---|---|
| `patient_name` | Required; alphabetic + spaces only (`/^[a-zA-Z\s]+$/`) | `appointmentRoutes.js` L16, L20-22 |
| `patient_phone` | Required; digits, dashes, plus, spaces, parens (`/^[0-9\-\+\s\(\)]+$/`) | `appointmentRoutes.js` L16, L24-26 |
| `doctor_name` | Required (not empty) | `appointmentRoutes.js` L16 |
| `appointment_date` | Required (not empty) | `appointmentRoutes.js` L16 |
| `appointment_time` | Required (not empty) | `appointmentRoutes.js` L16 |
| `reason` | Required (not empty) | `appointmentRoutes.js` L16 |
| `visit_note` | Required; not empty/whitespace | `appointmentRoutes.js` L143 |
| `username` (login) | Required | `userRoutes.js` L11 |
| `password` (login) | Required | `userRoutes.js` L11 |

### Frontend Validation

| Field | Validation | Location |
|---|---|---|
| `patient_name` | Required; alphabetic + spaces only | `Dashboard.jsx` L108, L111 |
| `patient_phone` | Required; same regex as backend | `Dashboard.jsx` L108, L114 |
| `appointment_date` | Required | `Dashboard.jsx` L108 |
| `appointment_time` | Required | `Dashboard.jsx` L108 |
| `reason` | Required | `Dashboard.jsx` L108 |
| `visit_note` | Required; not empty | `Dashboard.jsx` L153 |
| Login fields | HTML `required` attribute | `Login.jsx` L58, L69 |

### Validation Gaps

- ❌ No **date format validation** beyond HTML `<input type="date">` — backend accepts whatever string is sent
- ❌ No **past-date prevention** — appointments can be booked in the past
- ❌ No **time format validation** beyond HTML `<input type="time">`
- ❌ No **doctor name validation** against a whitelist — backend accepts any string as `doctor_name`
- ❌ No **phone length/format constraints** beyond the character check
- ❌ No **SQL injection prevention** explicitly — mitigated by `mysql2` parameterized queries (safe)
- ❌ No **XSS sanitization** — React auto-escapes JSX but no server-side sanitization

---

## 8. Stage Drift or Early Implementation

| Feature | Expected Stage | Current Status | Assessment |
|---|---|---|---|
| Testing (unit/integration) | Stage 8 (Testing) | `tests/db.test.js` exists with 8 integration tests | ⚠️ **Implemented early** — tests were written before the testing stage. The test file is well-structured with supertest integration tests covering auth, role enforcement, ownership, and CRUD. This is beneficial but represents stage drift. |
| Session token auth | Stage 7 (Security hardening) | Fully implemented | ⚠️ **Implemented early** — session tokens with DB storage and middleware validation were added before security hardening. Beneficial drift. |
| Logout with DB token clear | Stage 7 (Security hardening) | Fully implemented | ⚠️ **Implemented early** — same as above. |
| Session restoration | Stage 7 (Security hardening) | Implemented via `/api/users/me` check on app load | ⚠️ **Implemented early**. |
| Password hashing | Stage 7 (Security hardening) | ❌ Not implemented | ✅ Correctly deferred — passwords are plain text as expected pre-hardening. |
| Rate limiting | Stage 7 (Security hardening) | ❌ Not implemented | ✅ Correctly deferred. |
| CORS restriction | Stage 7 (Security hardening) | ❌ Not implemented | ✅ Correctly deferred. |
| Error boundary | Stage 9 (Maintainability) | ❌ Not implemented | ✅ Correctly deferred. |
| Code splitting/refactoring | Stage 9 (Maintainability) | ❌ Not implemented | ✅ Correctly deferred — Dashboard.jsx is monolithic but acceptable pre-cleanup. |

**Summary:** Testing and authentication features were implemented earlier than their designated stage. This is positive stage drift — it strengthens the project rather than creating problems. No harmful premature implementation was found.

---

## 9. Issues Found Before Stage 8

### Critical Issues

| # | Issue | Severity | File(s) | Description |
|---|---|---|---|---|
| C1 | Plain-text passwords | Critical | `dbSetup.js` L74-76, `userRoutes.js` L16 | Passwords stored and compared as plain text. Must be hashed before any deployment. Expected to be addressed in security hardening stage. |
| C2 | `schema.sql` out of sync | Critical | `schema.sql` vs `dbSetup.js` | `schema.sql` uses different column names (`contact_number` vs `patient_phone`), different status values (`Scheduled` vs `booked`), different DB name (`clinic_db` vs `c1p2`), and is missing the `users` table entirely. Running `schema.sql` directly would create a broken database. |

### High Issues

| # | Issue | Severity | File(s) | Description |
|---|---|---|---|---|
| H1 | Hardcoded doctor mapping | High | `appointmentRoutes.js` L7-11 | `getDoctorName()` maps usernames to doctor display names with a brittle hardcoded function. Adding a new doctor requires code changes. Should be a DB column (e.g., `users.display_name`). |
| H2 | No session expiry | High | `authMiddleware.js` | Session tokens never expire. A stolen token grants permanent access. |
| H3 | Quick-login embeds credentials | High | `Login.jsx` L85-97 | Hardcoded username/password pairs in shipped frontend code. Acceptable for workshop demo but must be removed before any real use. |
| H4 | CORS wide open | High | `server.js` L11 | `app.use(cors())` allows any origin. Should be restricted to frontend origin. |
| H5 | No status transition rules | High | `appointmentRoutes.js` L102-132 | Receptionist can change any appointment to any status via the edit form (e.g., set cancelled back to booked, or set booked to completed without a doctor visit note). No state machine enforced. |

### Medium Issues

| # | Issue | Severity | File(s) | Description |
|---|---|---|---|---|
| M1 | No past-date prevention | Medium | `appointmentRoutes.js`, `Dashboard.jsx` | Appointments can be created with dates in the past. |
| M2 | No double-booking check | Medium | `appointmentRoutes.js` L76-99 | No check for conflicting appointments (same doctor, date, time). |
| M3 | `.env.example` missing `DB_PORT` | Medium | `.env.example` | The `.env.example` template is missing `DB_PORT` which is used in both `db.js` and `dbSetup.js`. |
| M4 | Unused `react-router-dom` dependency | Medium | `frontend/package.json` L15 | `react-router-dom` is listed as a dependency but not imported or used anywhere in the frontend code. |
| M5 | Monolithic Dashboard component | Medium | `Dashboard.jsx` (448 lines) | Single component handles appointment table, create modal, edit modal, note modal, filter panel, all state management. Should be split into smaller components. |
| M6 | `index.css` Vite boilerplate | Medium | `index.css` | Contains default Vite/React template styles (accent colors, code styling, fixed `#root` width of 1126px) that partially conflict with `App.css` custom styles. |
| M7 | Generic page title | Medium | `index.html` L7 | HTML title is "frontend" instead of "Clinic Appointment System" or "ClinicFlow". |

### Low Issues

| # | Issue | Severity | File(s) | Description |
|---|---|---|---|---|
| L1 | No root README | Low | Project root | No instructions on how to set up and run the full project. Only `frontend/README.md` exists with Vite boilerplate. |
| L2 | Doctor list hardcoded in frontend | Low | `Dashboard.jsx` L23, L39-42, L207-210, L353-354 | Doctor options in dropdowns and filter-to-username mapping are hardcoded. Should be fetched from backend. |
| L3 | No clear-filters UI | Low | `Dashboard.jsx` | No button to reset all filter selections at once. |
| L4 | Cancel on already-cancelled | Low | `appointmentRoutes.js` L170-190 | Backend allows setting status to `cancelled` on already-cancelled appointments (no-op but no guard). |
| L5 | `.env` committed with DB credentials | Low | `backend/.env` | The `.env` file appears to be checked into the repository. Should be in `.gitignore`. |
| L6 | No `.gitignore` in backend | Low | `backend/` | No `.gitignore` file in backend directory; `node_modules` and `.env` may be committed. |

---

## 10. Manual Checks Recommended Next

| # | Check | Priority | Verification Steps |
|---|---|---|---|
| 1 | **Full startup test** | High | Run `cd backend && npm run db:setup` then `npm run dev`; run `cd frontend && npm run dev`; verify both start without errors and frontend loads at `http://localhost:5173` |
| 2 | **Login flow** | High | Log in as `receptionist1`/`password123`; verify dashboard loads; log out; log in as `dr_smith`/`smith456`; verify doctor-filtered view |
| 3 | **Create appointment** | High | As receptionist, click "+ New Appointment", fill all fields, submit; verify appointment appears in table and persists after page refresh |
| 4 | **Edit appointment** | High | As receptionist, click "Edit" on an appointment, modify fields, save; verify changes persist |
| 5 | **Cancel appointment** | High | As receptionist, click "Cancel" on a booked appointment; verify status changes to `cancelled`; verify Cancel button disappears for cancelled appointments |
| 6 | **Visit note as correct doctor** | High | As `dr_smith`, click "Add/Edit Note" on a Dr. Smith appointment; enter note and save; verify status becomes `completed` and note displays |
| 7 | **Visit note cross-doctor rejection** | High | As `dr_smith`, attempt to add note on a Dr. Adams appointment (if visible — should not be due to server-side filter); test via Postman/curl |
| 8 | **Receptionist note rejection** | High | As receptionist, verify no "Add/Edit Note" button appears; test PUT `/:id/note` via Postman with receptionist token — expect 403 |
| 9 | **Doctor create rejection** | High | As doctor, verify no "+ New Appointment" button; test POST `/api/appointments` via Postman with doctor token — expect 403 |
| 10 | **Filter combinations** | Medium | Test all filter combinations: doctor only, status only, date only, doctor+status, all three, none |
| 11 | **Validation rejection** | Medium | Try creating appointment with empty fields, non-alpha patient name, invalid phone — verify frontend and backend both reject |
| 12 | **Unauthenticated access** | Medium | In browser devtools, delete token from localStorage, try accessing `/api/appointments` directly — verify 401 response |
| 13 | **Session restoration** | Medium | Log in, refresh page, verify session persists without re-login |
| 14 | **Run existing tests** | Medium | Run `cd backend && npm test` — verify all 8 tests pass |

---

## 11. Pass/Fail Table

| Check | Result | Evidence / Notes |
|---|---|---|
| App appears runnable | ✅ PASS | Both `frontend/` and `backend/` have `package.json` with proper scripts, `node_modules` present, entry points exist (`server.js`, `main.jsx`) |
| React frontend and Express backend are separated | ✅ PASS | `frontend/` (Vite + React) and `backend/` (Express) are independent directories with separate `package.json` |
| React calls Express routes, never connects to MySQL directly | ✅ PASS | Frontend uses `fetch()` calls via `services/api.js` to `http://localhost:5000/api/*`; no `mysql2` or DB imports in frontend; grep confirms zero DB references in `frontend/src/` |
| Backend uses env vars for MySQL, secrets not exposed in React | ✅ PASS | `db.js` and `dbSetup.js` use `process.env.DB_HOST/DB_PORT/DB_USER/DB_PASSWORD/DB_NAME` via `dotenv`; `.env` in backend only; grep confirms zero `DB_PASSWORD` references in frontend source |
| Needed database tables exist (including users/login table) | ✅ PASS | `dbSetup.js` creates `users` (with login + role + session_token) and `appointments` tables; both used by routes |
| Repeatable database setup or seed command exists | ✅ PASS | `npm run db:setup` is idempotent — creates DB/tables if not exist, seeds only if empty; also exports for programmatic use |
| Login is database-backed | ✅ PASS | `userRoutes.js` queries `users` table with username + password; not mock or role-selector; session token stored in DB |
| Role restrictions enforced in backend (not UI-only) | ✅ PASS | Every route checks `req.user.role` and returns 403 for unauthorized roles; `authMiddleware.js` validates session token on every request; `router.use(authenticateToken)` applied globally |
| Visit notes (protected action) appears protected | ✅ PASS | Doctor-only role check + ownership verification in backend; receptionist gets 403; cross-doctor gets 403 |
| Users limited to own records where relevant | ✅ PASS | Doctors auto-filtered to own appointments via `getDoctorName()` in GET handler (L40-46); visit note ownership check prevents cross-doctor editing |
| Appointment CRUD workflow appears implemented | ✅ PASS | Create (POST), View (GET with filters), Update (PUT /:id), Cancel (DELETE /:id as soft-delete) all implemented with backend role checks |
| Filter by doctor, date, status appears implemented | ✅ PASS | Filter panel in Dashboard; query params passed to GET route; backend builds dynamic WHERE clause; doctor filter auto-set and disabled for doctor role |
| Validation is present | ✅ PASS | Both frontend (`Dashboard.jsx` L107-118) and backend (`appointmentRoutes.js` L14-28) validate required fields, patient name format, phone format; visit note emptiness checked; login fields validated |
| AI implemented future stages early | ⚠️ PARTIAL | Session token auth, logout, session restoration, and integration tests were implemented early (expected in Stage 7-8). This is beneficial drift — no harmful premature implementation found. |
| What is missing before testing, security hardening, and cleanup | See below | — |

### What Is Missing Before Testing, Security Hardening, and Maintainability Cleanup

1. **Password hashing** (bcrypt/argon2) — critical for security hardening
2. **Session token expiry/TTL** — tokens currently last forever
3. **CORS origin restriction** — currently allows all origins
4. **Rate limiting** on login endpoint
5. **Status transition rules** — no state machine preventing invalid status changes
6. **Past-date prevention** for appointment booking
7. **Double-booking detection** for same doctor/time
8. **`schema.sql` sync** with `dbSetup.js` or removal of stale file
9. **Doctor list from database** instead of hardcoded in frontend and `getDoctorName()`
10. **`index.css` cleanup** — remove Vite boilerplate styles
11. **Dashboard component splitting** — 448-line monolith needs decomposition
12. **Root README** with full project setup instructions
13. **Remove unused `react-router-dom`** dependency
14. **Input sanitization** for XSS prevention on server side
15. **Backend `.gitignore`** to exclude `node_modules` and `.env`
16. **Page title update** from "frontend" to app name
17. **Frontend tests** — only backend integration tests exist
18. **Error boundaries** in React for graceful error handling
19. **Remove quick-login credential exposure** or gate behind dev mode flag
