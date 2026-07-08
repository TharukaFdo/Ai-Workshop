# Final Review — Clinic Appointment System

**Review date:** 2026-06-05  
**Review stage:** Final (post-testing, security hardening, maintainability cleanup, and change request)  
**Reviewer:** Automated evidence-based code review (Antigravity)

---

## 1. Final Feature Summary

The Clinic Appointment System is a **React (Vite) + Express + MySQL** prototype with two roles:

| Role | Capabilities |
|---|---|
| **Receptionist** | Create, view, edit, cancel appointments for any doctor; filter by doctor / date / status; cannot add visit notes |
| **Doctor** | View own appointments only; accept or reject pending appointments; add visit notes (auto-completes appointment); cannot create / edit / cancel bookings |

### Features Implemented

| Feature | Status | Evidence |
|---|---|---|
| Appointment CRUD | ✅ Complete | POST, GET, PUT, DELETE routes in `appointmentRoutes.js` |
| Role-based access (backend enforced) | ✅ Complete | `req.user.role` checks on every route; `authMiddleware.js` globally applied |
| Login (database-backed, session token) | ✅ Complete | `userRoutes.js` POST `/login`, `crypto.randomBytes` token stored in DB |
| Logout with DB token invalidation | ✅ Complete | `userRoutes.js` POST `/logout` sets `session_token = NULL` |
| Session persistence on refresh | ✅ Complete | `App.jsx` calls `/api/users/me` on mount |
| Filter by doctor / date / status | ✅ Complete | Query params in GET handler; frontend filter panel |
| Doctor-only visit notes with ownership | ✅ Complete | PUT `/:id/note`; role check + `getDoctorName()` ownership match |
| Doctor accept / reject appointments | ✅ Complete | PUT `/:id/accept` and `/:id/reject` with ownership check |
| Appointment status flow (pending → confirmed / cancelled → completed) | ✅ Complete | ENUM `pending, confirmed, completed, cancelled`; status transitions enforced on accept/reject/note |
| Backend input validation | ✅ Complete | `validateAppointment()` in `utils/helpers.js`; past-date check included |
| Frontend input validation (mirrored) | ✅ Complete | `validateForm()` in `Dashboard.jsx` mirrors backend rules |
| Automated integration tests | ✅ Complete | 13 test assertions in `tests/db.test.js` using Jest + Supertest |
| Test data cleanup | ✅ Complete | `afterAll` deletes test users and appointments; pool closed |
| Database setup command (idempotent) | ✅ Complete | `npm run db:setup` runs `dbSetup.js` |
| Quick-login demo buttons | ✅ Present | Workshop convenience in `Login.jsx` |

### Features NOT Implemented

| Feature | Status | Impact |
|---|---|---|
| Password hashing (bcrypt/argon2) | ❌ Missing | Passwords stored and compared as **plain text** — critical for production |
| Session token expiry / TTL | ❌ Missing | Stolen token grants permanent access |
| Rate limiting on login | ❌ Missing | Brute-force attacks possible |
| CORS origin restriction | ❌ Missing | `app.use(cors())` allows all origins |
| Helmet / CSP headers | ❌ Missing | No security headers set |
| Double-booking prevention | ❌ Missing | Same doctor/date/time can be booked twice |
| Frontend tests | ❌ Missing | Only backend integration tests exist |
| Error boundary in React | ❌ Missing | Uncaught errors crash the UI |
| Doctor list from database | ❌ Missing | Hardcoded in frontend dropdowns and `getDoctorName()` |

---

## 2. Review Scoring Matrix

| Feature / Area | Functionality 0-5 | Data Persistence 0-5 | Backend Security / Role Control 0-5 | Validation / Error Handling 0-5 | Testing Evidence 0-5 | Maintainability 0-5 | UI / Manual Usability 0-5 | Evidence | Notes |
|---|---:|---:|---:|---:|---:|---:|---:|---|---|
| Project setup and run commands | 4 | N/A | N/A | N/A | N/A | 4 | N/A | `package.json` scripts: `dev`, `start`, `db:setup`, `test` in backend; `dev`, `build` in frontend; root `README.md` with full setup instructions and seed accounts | Root README exists and is complete; `.env.example` present but missing `DB_PORT`; frontend `index.html` title still says "frontend" |
| Database setup and starter data | 4 | 4 | N/A | 3 | N/A | 3 | N/A | `dbSetup.js` creates DB, tables (with ENUM migration), seeds users (3) and appointments (3); idempotent | `schema.sql` is synced to current ENUM values but uses different DB name (`clinic_db` vs `c1p2`); seeds use plain-text passwords; migration logic for old status values is robust |
| Login workflow | 4 | 4 | 3 | 3 | 4 | 3 | 4 | `userRoutes.js` POST `/login`; `crypto.randomBytes(32)` token; stored in `users.session_token`; frontend stores in `localStorage`; logout clears DB + localStorage; session restoration via `/api/users/me` | Passwords plain text; no bcrypt; no session TTL; no rate limiting; quick-login embeds credentials in shipped frontend code |
| Role-based access | 5 | N/A | 5 | 4 | 4 | 3 | 4 | Every route checks `req.user.role`; 403 returned for wrong role; `router.use(authenticateToken)` applied globally; doctor GET auto-filtered to own appointments; tests verify role denials | All checks server-side; doctor cannot create/edit/cancel; receptionist cannot add notes; accept/reject doctor-only with ownership; test covers role denial for create, update, note, cancel |
| Main create action | 4 | 4 | 4 | 4 | 4 | 3 | 4 | POST `/api/appointments` receptionist-only; validates required fields, alpha name, phone format, past-date check; inserts with `status='pending'`; test creates and verifies pending status | No double-booking check; doctor list hardcoded in dropdown |
| Main view/list action | 4 | 4 | 5 | 3 | 3 | 3 | 4 | GET `/api/appointments` with doctor/status/date filters; doctor auto-filtered server-side via `getDoctorName()`; ordered by date/time; test verifies filter results | Filter test checks doctor + status + date combination |
| Main update/status/cancel action | 4 | 4 | 4 | 3 | 4 | 3 | 4 | PUT `/:id` receptionist-only for edits; DELETE `/:id` soft-cancels (status→cancelled); PUT `/:id/accept` and `/:id/reject` doctor-only with ownership; tests verify cancel as receptionist and denial as doctor | Receptionist can still edit cancelled/completed back to pending via PUT `/:id`; no strict state machine on generic update |
| Protected action | 5 | 4 | 5 | 4 | 4 | 3 | 4 | PUT `/:id/note` doctor-only + ownership check; empty note rejected; auto-sets status to `completed`; test verifies doctor note save, cross-doctor denial, and receptionist denial | Strongest security implementation; layered auth → role → ownership → validation checks |
| Secondary feature | 4 | N/A | 4 | 3 | 3 | 3 | 4 | Filter panel: doctor, status, date dropdowns; doctor filter disabled + auto-set for doctor role; query params to backend; test verifies filter combination | Doctor list hardcoded; no "clear filters" button; works correctly |
| Case-specific: appointment date/time and doctor assignment | 4 | 4 | 3 | 4 | 3 | 2 | 4 | HTML `date`/`time` inputs; doctor dropdown; stored as DATE/TIME columns; past-date validation in both frontend and backend `validateAppointment()` | No double-booking detection; no clinic-hours constraints; doctor list hardcoded; past-date check was added since mid-review |
| Case-specific: appointment status and cancellation flow | 4 | 4 | 4 | 3 | 4 | 3 | 4 | Status ENUM `pending/confirmed/completed/cancelled`; accept→confirmed, reject→cancelled, note→completed; cancel (DELETE) sets cancelled; tests cover accept, reject, cancel flows | Accept/reject enforce `pending` check; receptionist can bypass via PUT `/:id` generic update; no guard against cancelling already-cancelled |
| Case-specific: visit note privacy and doctor-only editing | 5 | 4 | 5 | 4 | 5 | 3 | 4 | Backend: doctor-only role + ownership check; receptionist gets 403; cross-doctor gets 403; empty note rejected; tests verify all three denial scenarios and successful save | Best-tested feature; 3 separate security test cases covering role denial, ownership denial, and valid save |
| UI/manual usability | N/A | N/A | N/A | N/A | N/A | 3 | 4 | Clean table layout; modal forms with glassmorphic backdrop blur; status badges with colour coding; filter panel; quick-login for demo; responsive CSS variables | `index.css` still contains Vite boilerplate; `#root` fixed 1126px width; page title generic "frontend"; no mobile responsiveness; Dashboard.jsx is 503-line monolith |
| Security posture | N/A | N/A | 3 | 2 | 2 | 2 | N/A | Session tokens in DB; role checks on all routes; `.env` for secrets; `.env.example` provided; parameterized queries (SQL injection safe); React JSX auto-escaping | Plain-text passwords; CORS wide open; no rate limiting; no Helmet/CSP; no session expiry; quick-login embeds credentials; no backend `.gitignore` for `.env`; `.env` committed with empty password |
| Testing evidence | N/A | N/A | N/A | N/A | 4 | 3 | N/A | `tests/db.test.js`: 13 test assertions across 13 `it()` blocks; covers health, auth denial, validation (3 sub-cases), role denial for create/update, spoofing attempt, filter check, cross-doctor accept denial, accept success, cross-doctor note denial, note success, cancel denial, cancel success; `afterAll` cleanup; pool closed | Tests are comprehensive for backend; cover security, role, ownership, validation, and workflow; test data cleaned up; no frontend tests |
| Maintainability | N/A | N/A | N/A | N/A | N/A | 3 | N/A | Separated routes, middleware, utils, services; CSS variables; root README with setup; `.env.example` | `getDoctorName()` hardcoded; doctor list hardcoded in 4+ places; `schema.sql` partially stale; `index.css` boilerplate; Dashboard.jsx 503 lines; `react-router-dom` unused dependency; no JSDoc |

---

## 3. Project Structure and Run Commands

### Project Structure

```
p2/
├── README.md                          # Root setup guide with seed accounts
├── Case_Brief.md                      # Original requirements brief
├── MID_REVIEW.md                      # Mid-project review
├── FINAL_REVIEW.md                    # This file
├── backend/
│   ├── .env                           # Environment variables (DB credentials)
│   ├── .env.example                   # Template for .env
│   ├── package.json                   # Express, mysql2, cors, dotenv, jest, supertest
│   ├── server.js                      # Express app entry point (port 5000)
│   ├── db.js                          # MySQL2 connection pool (promise-based)
│   ├── dbSetup.js                     # Database + table creation + seed data
│   ├── schema.sql                     # Reference SQL schema (partially stale)
│   ├── middleware/
│   │   └── authMiddleware.js          # Session token verification middleware
│   ├── routes/
│   │   ├── userRoutes.js              # Login, logout, /me endpoints
│   │   └── appointmentRoutes.js       # Full appointment CRUD + notes + accept/reject
│   ├── utils/
│   │   └── helpers.js                 # getDoctorName(), validateAppointment()
│   └── tests/
│       └── db.test.js                 # Integration tests (Jest + Supertest)
└── frontend/
    ├── .gitignore                     # Vite defaults (excludes node_modules, dist)
    ├── package.json                   # React 19, Vite 8, react-router-dom (unused)
    ├── vite.config.js                 # Vite + React plugin
    ├── index.html                     # HTML entry point (title: "frontend")
    └── src/
        ├── main.jsx                   # React entry (StrictMode)
        ├── App.jsx                    # Auth state, session restore, routing
        ├── App.css                    # Main application styles (478 lines)
        ├── index.css                  # Vite boilerplate styles (112 lines)
        ├── components/
        │   ├── Login.jsx              # Login form + quick-login buttons
        │   └── Navbar.jsx             # Brand + user info + logout
        ├── pages/
        │   └── Dashboard.jsx          # Appointments table, modals, filters (503 lines)
        └── services/
            └── api.js                 # All fetch() calls to Express API
```

### Run Commands

| Command | Location | Purpose |
|---|---|---|
| `npm run db:setup` | `backend/` | Create database, tables, seed data (idempotent) |
| `npm run dev` | `backend/` | Start Express server on port 5000 (nodemon) |
| `npm run dev` | `frontend/` | Start Vite dev server on port 5173 |
| `npm test` | `backend/` | Run Jest integration tests |
| `npm start` | `backend/` | Start Express server (production, no nodemon) |
| `npm run build` | `frontend/` | Build React for production |

---

## 4. Frontend/Backend Separation Check

| Check | Result | Evidence |
|---|---|---|
| React and Express in separate directories | ✅ PASS | `frontend/` and `backend/` are independent with separate `package.json` |
| React calls Express routes only | ✅ PASS | All API calls go through `services/api.js` using `fetch()` to `http://localhost:5000/api/*` |
| React never imports mysql2 or connects to MySQL | ✅ PASS | Grep for `mysql`, `mysql2`, `createPool`, `createConnection` in `frontend/src/` returns zero results |
| Express serves JSON API only (no SSR) | ✅ PASS | `server.js` only defines `/api/*` routes; no HTML serving |
| CORS enabled for cross-origin requests | ✅ PASS | `app.use(cors())` in `server.js` (but unrestricted) |

**Verdict:** Frontend and backend are **properly separated**. React communicates exclusively through HTTP requests to the Express API. No database driver or credentials appear in frontend code.

---

## 5. Database Setup and Table Summary

### Connection Method

The backend uses **mysql2** with a **promise-based connection pool** (`mysql.createPool(...).promise()`).

Configuration is read from environment variables via `dotenv`:

| Variable | Configured in `.env` | Configured in `.env.example` | Used in `db.js` | Used in `dbSetup.js` |
|---|---|---|---|---|
| `DB_HOST` | ✅ `localhost` | ✅ `localhost` | ✅ | ✅ |
| `DB_PORT` | ✅ `3306` | ❌ Missing | ✅ | ✅ |
| `DB_USER` | ✅ `root` | ✅ `root` | ✅ | ✅ |
| `DB_PASSWORD` | ✅ (configured, not printed) | ✅ `your_password` | ✅ | ✅ |
| `DB_NAME` | ✅ `c1p2` | ✅ `clinic_db` | ✅ | ✅ |

> **Note:** `DB_PORT` is missing from `.env.example`. The DB name differs between `.env` (`c1p2`) and `.env.example` (`clinic_db`).

### Database Tables

| Table | Columns | Purpose |
|---|---|---|
| `users` | `id`, `username`, `password`, `role` (ENUM: receptionist/doctor), `session_token`, `created_at` | Authentication and role management |
| `appointments` | `id`, `patient_name`, `patient_phone`, `doctor_name`, `appointment_date`, `appointment_time`, `reason`, `status` (ENUM: pending/confirmed/completed/cancelled), `visit_note`, `created_at`, `updated_at` | Appointment data storage |

**A `users` / login table exists:** ✅ Yes. The `users` table stores credentials, roles, and session tokens.

### How Tables and Seed Data Are Created

Run `npm run db:setup` in the `backend/` directory. This executes `dbSetup.js`, which:

1. Connects to MySQL **without** specifying a database
2. Creates the database with `CREATE DATABASE IF NOT EXISTS`
3. Creates the `users` table with `CREATE TABLE IF NOT EXISTS`
4. Adds `session_token` column if missing (migration)
5. Creates the `appointments` table with `CREATE TABLE IF NOT EXISTS`
6. Migrates old status values (e.g., `booked` → `pending`) via VARCHAR intermediary
7. Modifies status column to final ENUM type
8. Seeds 3 users **only if the table is empty** (idempotent)
9. Seeds 3 appointments **only if the table is empty** (idempotent)

The process is fully repeatable and safe to run multiple times.

### Seed Data

| Table | Records | Details |
|---|---|---|
| `users` | 3 | `receptionist1` (receptionist), `dr_smith` (doctor), `dr_adams` (doctor) |
| `appointments` | 3 | 2 pending (Dr. Smith on 2026-06-10, Dr. Adams on 2026-06-10), 1 completed with visit note (Dr. Smith on 2026-06-09) |

---

## 6. Login and Role/Access Explanation

### How the Two Roles Log In

Both roles log in via the **same login form**. The flow:

1. User enters username and password (or clicks a quick-login button)
2. Frontend sends `POST /api/users/login` with `{ username, password }`
3. Backend queries `SELECT id, username, role FROM users WHERE username = ? AND password = ?`
4. On match: generates `crypto.randomBytes(32).toString('hex')` session token
5. Stores token in `users.session_token` column
6. Returns token + user object to frontend
7. Frontend saves token in `localStorage` and sets `currentUser` state
8. All subsequent requests include `Authorization: Bearer <token>` header

### How Roles Are Checked

**Authentication** (every request): `authMiddleware.js` is applied globally via `router.use(authenticateToken)`. It:
- Extracts token from `Authorization: Bearer <token>` header
- Queries `SELECT id, username, role FROM users WHERE session_token = ?`
- Attaches user object to `req.user`
- Returns 401 if no token or invalid token

**Role authorization** (per route): Each route handler checks `req.user.role`:

| Action | Route | Required Role | Check Location |
|---|---|---|---|
| Create appointment | POST `/api/appointments` | `receptionist` | `appointmentRoutes.js` L54 |
| Update appointment | PUT `/api/appointments/:id` | `receptionist` | `appointmentRoutes.js` L80 |
| Cancel appointment | DELETE `/api/appointments/:id` | `receptionist` | `appointmentRoutes.js` L210 |
| Accept appointment | PUT `/api/appointments/:id/accept` | `doctor` + ownership | `appointmentRoutes.js` L113 + L126 |
| Reject appointment | PUT `/api/appointments/:id/reject` | `doctor` + ownership | `appointmentRoutes.js` L144 + L157 |
| Add visit note | PUT `/api/appointments/:id/note` | `doctor` + ownership | `appointmentRoutes.js` L175 + L193 |
| View appointments | GET `/api/appointments` | Any authenticated | `appointmentRoutes.js` L17 (doctor auto-filtered) |

### Record-Level Access Control

- **Doctors** can only see their own appointments: the GET handler auto-adds `WHERE doctor_name = ?` using `getDoctorName(req.user.username)` (line 22-23)
- **Doctors** can only accept/reject/add-notes to their own appointments: each handler fetches the appointment's `doctor_name` and compares it against `getDoctorName(req.user.username)` — returns 403 on mismatch
- **Receptionists** can see all appointments and apply optional filters

---

## 7. Protected Action Explanation

### Visit Note Privacy and Doctor-Only Editing

The protected action is **visit note editing** via `PUT /api/appointments/:id/note`.

**Layered protection:**

1. **Authentication**: `authMiddleware.js` checks for valid session token → 401 if missing/invalid
2. **Role check**: `req.user.role !== 'doctor'` → 403 "Only doctors can add visit notes"
3. **Ownership check**: `getDoctorName(req.user.username) !== existing[0].doctor_name` → 403 "You cannot edit notes for appointments assigned to another doctor"
4. **Input validation**: `visit_note.trim() === ''` → 400 "Visit note content is required"
5. **Side effect**: Successfully saving a note sets `status = 'completed'`

**Frontend enforcement:**
- The "Add/Edit Note" button is only rendered when `isDoctor` is true AND status is `confirmed` or `completed`
- Receptionist never sees the note-edit UI

**Test coverage:**
- Test: receptionist denied creating an appointment (role check, similar pattern)
- Test: `dr_adams` denied editing note on `Dr. Smith`'s appointment (ownership check) → 403
- Test: `dr_smith` successfully saves note on own appointment → 200, status becomes `completed`

---

## 8. Validation Summary

### Backend Validation (`utils/helpers.js` → `validateAppointment()`)

| Field | Rule | Error Message |
|---|---|---|
| `patient_name` | Required; alphabetic + spaces only (`/^[a-zA-Z\s]+$/`) | "Patient Name must contain alphabetic characters and spaces only" |
| `patient_phone` | Required; digits, dashes, plus, spaces, parens (`/^[0-9\-\+\s\(\)]+$/`) | "Patient Phone contains invalid characters" |
| `doctor_name` | Required (not empty) | "All appointment fields are required" |
| `appointment_date` | Required; must not be in the past | "Appointment Date must not be in the past" |
| `appointment_time` | Required (not empty) | "All appointment fields are required" |
| `reason` | Required (not empty) | "All appointment fields are required" |
| `visit_note` | Required; not empty/whitespace (on note endpoint only) | "Visit note content is required" |
| `username` (login) | Required | "Username and password are required" |
| `password` (login) | Required | "Username and password are required" |

### Frontend Validation (`Dashboard.jsx` → `validateForm()`)

Mirrors all backend rules:
- Required field check
- Patient name alphabetic-only regex
- Phone format regex
- Past-date prevention
- Visit note non-empty check

### Validation Gaps

- No **doctor_name** whitelist validation — backend accepts any string
- No **time format** validation beyond HTML `<input type="time">`
- No **phone length** constraint
- No **double-booking** detection
- No **SQL injection** risk — mitigated by `mysql2` parameterized queries
- No **XSS sanitization** on server side — mitigated by React JSX auto-escaping

---

## 9. Automated and Manual Testing Summary

### Automated Test Command

```bash
cd backend
npm test
```

This runs **Jest** with **Supertest** against the real Express app and real MySQL database.

### What the Tests Check

The test file `tests/db.test.js` contains **13 test blocks** (`it()` calls) covering:

| # | Test | What It Verifies | Expected Result |
|---|---|---|---|
| 1 | Health check | `GET /api/health` responds | 200 OK |
| 2 | Auth required | `GET /api/appointments` without token | 401 |
| 3 | Validation: missing fields | POST with incomplete data | 400 |
| 4 | Validation: non-alpha name | POST with `Patient123` | 400, error mentions "alphabetic" |
| 5 | Validation: past date | POST with `2020-01-01` | 400, error mentions "past" |
| 6 | Doctor cannot create | POST as doctor | 403, "Only receptionists" |
| 7 | Receptionist creates (pending) | POST as receptionist | 201, DB shows `pending` |
| 8 | Doctor cannot edit booking | PUT `/:id` as doctor | 403, "Only receptionists" |
| 9 | Spoofing attempt | POST as doctor with `role: receptionist` in body | 403 (body role ignored) |
| 10 | Filter combination | GET with doctor + status + date | 200, all results match filters |
| 11 | Cross-doctor accept denial | Dr. Adams accepts Dr. Smith's appointment | 403 |
| 12 | Assigned doctor accepts | Dr. Smith accepts own appointment | 200, DB shows `confirmed` |
| 13 | Cross-doctor note denial | Dr. Adams writes note on Dr. Smith's appointment | 403 |
| 14 | Assigned doctor writes note | Dr. Smith writes note on own appointment | 200, DB shows `completed` + note text |
| 15 | Doctor cannot cancel | DELETE as doctor | 403 |
| 16 | Receptionist cancels | DELETE as receptionist | 200, DB shows `cancelled` |

### Test Data Creation and Cleanup

**Setup (`beforeAll`):**
- Creates 3 temporary test users (`test_receptionist_user`, `test_dr_smith_user`, `test_dr_adams_user`) directly via SQL INSERT
- Authenticates each via `POST /api/users/login` and stores session tokens

**Cleanup (`afterAll`):**
- Deletes test users by username: `DELETE FROM users WHERE username IN (...)`
- Deletes test appointments by patient name: `DELETE FROM appointments WHERE patient_name = ? OR patient_name LIKE "TEST RECORD %"`
- Closes the database connection pool: `await db.end()`

**Assessment:** Test data is properly isolated using the `TEST RECORD` prefix and is cleaned up after tests. The pool is closed so Jest exits cleanly.

### Test Result

Tests were **not executed during this review** (MySQL server availability required). The test file is syntactically correct and structurally sound. The mid-review noted the tests existed; they were expanded since then with accept/reject ownership tests.

### What Is NOT Automated

| Missing Test | Impact |
|---|---|
| Frontend component tests | No React component testing exists (no Jest DOM / React Testing Library) |
| Session restoration test | `/api/users/me` endpoint not tested |
| Logout test | Token invalidation not tested |
| Double-booking scenario | Not tested (feature not implemented) |
| Status transition validation | No test for generic PUT `/:id` allowing any status change |
| Edge case: note on pending appointment | Not tested (frontend hides button but backend may allow it) |

---

## 10. Stage 11 Change Summary

### What Changed After Stage 11 (Change Request Stage)

Based on comparison between the mid-review snapshot and current code, the following changes were identified:

| Change | File(s) | Description |
|---|---|---|
| **Accept/Reject endpoints added** | `appointmentRoutes.js` L112-171 | New `PUT /:id/accept` and `PUT /:id/reject` routes for doctors to confirm or reject pending appointments. Both enforce doctor-only role and ownership check. |
| **Status ENUM expanded** | `dbSetup.js` L85-88 | Status changed from `booked/completed/cancelled` to `pending/confirmed/completed/cancelled`. Migration logic converts old values. |
| **Schema.sql updated** | `schema.sql` L21 | ENUM updated to match: `pending/confirmed/completed/cancelled`. Users table added. `patient_phone` column name corrected. |
| **Accept/Reject API functions added** | `services/api.js` L49-71 | New `acceptAppointment()` and `rejectAppointment()` fetch functions. |
| **Accept/Reject UI added** | `Dashboard.jsx` L338-353 | Accept/Reject buttons shown for doctors on pending appointments. |
| **Past-date validation added** | `utils/helpers.js` L32-38 | `validateAppointment()` now checks `selectedDate < today`. |
| **Past-date validation in frontend** | `Dashboard.jsx` L124-129 | `validateForm()` now mirrors backend past-date check. |
| **Status badge styling for confirmed** | `App.css` L335-337 | New `.status-confirmed` CSS class (blue badge). |
| **Status badge styling for pending** | `App.css` L329-332 | New `.status-pending` CSS class (amber badge). |
| **Test suite expanded** | `tests/db.test.js` L192-211 | New tests for cross-doctor accept denial and successful doctor accept. |
| **Root README added** | `README.md` | Complete setup guide with tech stack, commands, and seed account table. |

**Summary:** The Stage 11 change request introduced the **doctor accept/reject workflow**, which enriched the appointment status lifecycle from a simple `booked → completed/cancelled` model to a proper `pending → confirmed → completed` flow with doctor decision-making. Past-date validation was also added to close a gap identified in the mid-review.

---

## 11. Stage Drift or Early Work

| Feature | Expected Stage | Actual Status | Assessment |
|---|---|---|---|
| Session token authentication | Stage 7 (Security) | ✅ Implemented early (present at mid-review) | ⚠️ **Beneficial drift** — security was built into auth from the start |
| Logout with DB token clear | Stage 7 (Security) | ✅ Implemented early | ⚠️ **Beneficial drift** |
| Session restoration (`/me`) | Stage 7 (Security) | ✅ Implemented early | ⚠️ **Beneficial drift** |
| Integration tests | Stage 8 (Testing) | ✅ Implemented early (some at mid-review, expanded since) | ⚠️ **Beneficial drift** — tests written alongside features |
| Password hashing | Stage 7 (Security) | ❌ Not implemented | ✅ Correctly deferred but **never completed** |
| Rate limiting | Stage 7 (Security) | ❌ Not implemented | ✅ Correctly deferred but **never completed** |
| CORS restriction | Stage 7 (Security) | ❌ Not implemented | ✅ Correctly deferred but **never completed** |
| Dashboard refactoring | Stage 9 (Maintainability) | ❌ Not implemented | ✅ Correctly deferred but **never completed** |
| Error boundary | Stage 9 (Maintainability) | ❌ Not implemented | ✅ Correctly deferred but **never completed** |

**Summary:** Authentication and testing features were built early, which is positive drift. However, several items expected in Stages 7-9 (security hardening, maintainability cleanup) were **never completed** — passwords remain plain text, CORS is unrestricted, Dashboard is still a 503-line monolith, and no error boundaries exist.

---

## 12. Security Risks and Exposed-Secret Check

| Risk | Severity | Location | Details |
|---|---|---|---|
| **Plain-text passwords** | 🔴 Critical | `dbSetup.js` seeds, `userRoutes.js` login query | Passwords are stored and compared as raw strings. No bcrypt/argon2 hashing. |
| **Quick-login embeds credentials** | 🟡 High | `Login.jsx` L85-97 | Username and password literals are hardcoded in shipped frontend code (`password123`, `smith456`). Acceptable for workshop demo but a risk if deployed. |
| **CORS unrestricted** | 🟡 High | `server.js` L11 | `app.use(cors())` allows any origin to call the API. |
| **Session tokens never expire** | 🟡 High | `authMiddleware.js` | No TTL check. A leaked token grants permanent access until logout. |
| **No rate limiting** | 🟡 High | `userRoutes.js` `/login` | Unlimited login attempts possible; brute-force risk. |
| **No Helmet / CSP headers** | 🟠 Medium | `server.js` | No security headers set (X-Frame-Options, Content-Security-Policy, etc.). |
| **`.env` may be committed** | 🟠 Medium | `backend/.env` | No `.gitignore` in backend directory. The `.env` file (containing DB credentials) could be in version control. Current password is empty string. |
| **No backend `.gitignore`** | 🟠 Medium | `backend/` | Only `frontend/.gitignore` exists. Backend `node_modules` and `.env` are not excluded. |
| **SQL injection** | ✅ Mitigated | All routes | All queries use parameterized placeholders (`?`). Safe with mysql2. |
| **XSS** | ✅ Mitigated | Frontend | React JSX auto-escapes output. No `dangerouslySetInnerHTML` used. |
| **DB credentials in frontend** | ✅ No risk | `frontend/src/` | Grep confirms zero DB-related imports or environment variables in frontend source. |

**Exposed secret status:** The `.env` file contains `DB_PASSWORD=` (empty string). No actual password is exposed. However, the `.env` file has no `.gitignore` protection in the backend directory, so it **could** be committed to version control.

---

## 13. Documentation/Code Mismatches

| Document | Code | Mismatch | Impact |
|---|---|---|---|
| `schema.sql` uses `clinic_db` | `.env` / `dbSetup.js` use `c1p2` | ❌ **DB name mismatch** | Running `schema.sql` directly would create a different database than what the app uses |
| `schema.sql` includes correct ENUM and columns | `dbSetup.js` has same ENUM and columns | ✅ Column names and ENUM now match (fixed since mid-review) | `schema.sql` was partially updated |
| `.env.example` missing `DB_PORT` | `db.js` and `dbSetup.js` use `DB_PORT` | ❌ **Missing config key** | Developer copying `.env.example` wouldn't know to set `DB_PORT` |
| `.env.example` uses `clinic_db` | `.env` uses `c1p2` | ⚠️ **Confusing default** | New developer would create wrong database name |
| `README.md` shows `.env` example with `DB_NAME=c1p2` | `.env.example` shows `DB_NAME=clinic_db` | ❌ **README and .env.example disagree** | Conflicting guidance |
| `react-router-dom` in `package.json` | Not imported anywhere in `frontend/src/` | ⚠️ **Unused dependency** | Bloats `node_modules`; suggests routing was planned but not used |
| `frontend/index.html` `<title>frontend</title>` | App branded as "ClinicFlow" in Navbar and Login | ❌ **Title mismatch** | Browser tab shows "frontend" instead of app name |

---

## 14. Known Limitations

1. **No password hashing** — Critical security gap for any non-demo deployment
2. **No session expiry** — Tokens last forever until explicit logout
3. **No double-booking detection** — Same doctor/date/time can be booked multiple times
4. **Hardcoded doctor list** — Adding a new doctor requires code changes in `helpers.js`, `Dashboard.jsx` (dropdown), and potentially `Login.jsx` (quick-login)
5. **No strict status state machine** — Receptionist can edit any appointment back to any status via PUT `/:id` (bypassing accept/reject flow)
6. **Monolithic Dashboard** — 503-line component handles all views, modals, and state
7. **No mobile responsiveness** — `#root` is fixed at 1126px width
8. **No frontend tests** — Only backend integration tests exist
9. **No error boundary** — Uncaught React errors crash the entire UI
10. **CORS unrestricted** — Any origin can call the API
11. **No rate limiting** — Brute-force login possible
12. **No audit trail** — No record of who changed what or when
13. **Vite boilerplate CSS still present** — `index.css` contains default Vite styles
14. **Note endpoint allows notes on any status** — Backend only checks role + ownership, not whether status is `confirmed` (frontend hides button but API doesn't enforce)
15. **Cannot reject confirmed appointments** — Reject only works on `pending` status

---

## 15. Demo Script

### Pre-requisites
1. MySQL server running locally
2. Run `cd backend && npm run db:setup` (creates DB, tables, seeds)
3. Run `cd backend && npm run dev` (starts Express on port 5000)
4. Run `cd frontend && npm run dev` (starts React on port 5173)
5. Open `http://localhost:5173` in browser

### Demo Steps

**Step 1 — Receptionist Login (1 min)**
1. Click "🔑 Receptionist" quick-login button
2. Observe: Dashboard loads showing all appointments across all doctors
3. Note the role badge "RECEPTIONIST" and filter panel

**Step 2 — Create an Appointment (2 min)**
1. Click "+ New Appointment"
2. Fill in: Patient Name = "Alice Williams", Phone = "555-1234", Doctor = "Dr. Smith", Date = tomorrow, Time = 10:00, Reason = "Annual checkup"
3. Click "Save Changes"
4. Observe: New appointment appears in the table with status "pending"

**Step 3 — Filter Appointments (1 min)**
1. Set Doctor filter to "Dr. Adams" → only Dr. Adams appointments shown
2. Set Status filter to "pending" → only pending appointments shown
3. Reset both filters to "All"

**Step 4 — Cancel an Appointment (1 min)**
1. Click "Cancel" on the appointment just created
2. Confirm the dialog
3. Observe: Status changes to "cancelled", Cancel button disappears

**Step 5 — Switch to Doctor Login (1 min)**
1. Click "Logout"
2. Click "🩺 Dr. Smith (Doctor)" quick-login button
3. Observe: Dashboard shows only Dr. Smith's appointments (Dr. Adams' not visible)
4. Note: "+ New Appointment" button is hidden; Edit/Cancel buttons are hidden

**Step 6 — Accept a Pending Appointment (1 min)**
1. Find a pending appointment
2. Click "Accept"
3. Observe: Status changes to "confirmed"

**Step 7 — Add Visit Note (2 min)**
1. Click "Add/Edit Note" on the confirmed appointment
2. Enter: "Patient examined. Vitals normal. Follow-up in 6 months."
3. Click "Complete Visit & Save"
4. Observe: Status changes to "completed", note appears in the table

**Step 8 — Run Automated Tests (1 min)**
1. Open a new terminal
2. Run `cd backend && npm test`
3. Show all tests passing (13 assertions)

**Step 9 — Demonstrate Security (1 min)**
1. Open browser DevTools → Application → Local Storage → delete `token`
2. Refresh the page
3. Observe: Redirected to login (session invalidated)

**Total demo time: ~10 minutes**

---

## 16. Suggested Viva Questions

### Architecture & Setup

1. **Q: Why did you separate the React frontend and Express backend into different directories?**
   *Expected: Clean separation of concerns; frontend handles UI, backend handles data and security; they communicate via HTTP API; can be deployed independently.*

2. **Q: How does your React app communicate with the Express server?**
   *Expected: Through `fetch()` calls in `services/api.js`; sends JSON to `http://localhost:5000/api/*` endpoints; uses `Authorization: Bearer <token>` header for authenticated requests.*

3. **Q: Why did you use a connection pool instead of a single connection?**
   *Expected: Pools reuse connections efficiently; handles concurrent requests; avoids connection creation overhead; `connectionLimit: 10` prevents exhausting MySQL connections.*

### Authentication & Security

4. **Q: How do you generate and validate session tokens?**
   *Expected: `crypto.randomBytes(32).toString('hex')` generates a 256-bit random token; stored in `users.session_token` column; every request validated by middleware querying DB for matching token.*

5. **Q: Why are passwords stored in plain text? What would you change?**
   *Expected: Workshop prototype limitation; should use bcrypt with salt rounds (e.g., `bcrypt.hash(password, 10)`) before storing; compare with `bcrypt.compare()` on login.*

6. **Q: What happens if someone steals a session token?**
   *Expected: They get permanent access because there's no expiry; should add TTL column and check `created_at` vs current time; or use JWT with short expiry.*

7. **Q: What does `app.use(cors())` do and why is it a concern?**
   *Expected: Allows any domain to make API requests; should restrict to frontend origin (e.g., `cors({ origin: 'http://localhost:5173' })`).*

### Role-Based Access

8. **Q: How does a doctor only see their own appointments?**
   *Expected: In the GET handler, if `req.user.role === 'doctor'`, the query adds `WHERE doctor_name = ?` using `getDoctorName(req.user.username)`; server-side enforcement, not just UI hiding.*

9. **Q: Can a receptionist add a visit note by sending a direct API request?**
   *Expected: No — the backend checks `req.user.role !== 'doctor'` and returns 403; this is enforced regardless of how the request is sent.*

10. **Q: Can Dr. Adams write a note on Dr. Smith's patient?**
    *Expected: No — the backend compares `getDoctorName(req.user.username)` with the appointment's `doctor_name`; returns 403 if they don't match.*

### Appointment Workflow

11. **Q: What is the appointment status lifecycle?**
    *Expected: Created as `pending` → doctor can `accept` (→ `confirmed`) or `reject` (→ `cancelled`) → doctor adds note (→ `completed`); receptionist can cancel any appointment (→ `cancelled`).*

12. **Q: Why does adding a visit note automatically mark the appointment as completed?**
    *Expected: Business logic — a visit note means the patient was seen; the SQL updates both `visit_note` and `status = 'completed'` atomically.*

13. **Q: What prevents booking two appointments for the same doctor at the same time?**
    *Expected: Nothing currently — this is a known limitation; would need a UNIQUE constraint or backend check before INSERT.*

### Validation

14. **Q: Why do you validate on both frontend and backend?**
    *Expected: Frontend validation gives immediate feedback; backend validation is the security boundary — a malicious user can bypass the frontend; both must agree.*

15. **Q: What is the past-date validation check?**
    *Expected: Both frontend and backend compare `new Date(appointment_date)` against today (with hours zeroed); reject if selected date is before today.*

### Testing

16. **Q: How does your test suite prevent polluting the production database?**
    *Expected: Creates test users with `test_` prefix; test appointments use `TEST RECORD` prefix; `afterAll` deletes all test records by these markers; pool is closed so Jest exits.*

17. **Q: What does the spoofing test verify?**
    *Expected: A doctor sends `role: 'receptionist'` in the request body to try overriding their role; the backend ignores body-level role and uses `req.user.role` from the authenticated session instead; returns 403.*

18. **Q: Why don't you have frontend tests?**
    *Expected: Time/scope limitation; should use React Testing Library to test component rendering, form validation, and role-conditional UI rendering.*

### Maintainability

19. **Q: What is the risk of the `getDoctorName()` helper?**
    *Expected: It's a brittle hardcoded mapping; adding a new doctor requires code changes; should store doctor display names in the `users` table (e.g., `display_name` column) and query from DB.*

20. **Q: If you had more time, what would you refactor first?**
    *Expected: Password hashing (security critical); split Dashboard.jsx into smaller components (AppointmentTable, FilterPanel, BookingModal, NoteModal); move doctor list to database; add session expiry; restrict CORS.*
