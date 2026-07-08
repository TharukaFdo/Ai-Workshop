# Final Review: Clinic Appointment System

> **Review Date:** 2026-06-05  
> **Review Stage:** Final — after testing, security hardening, maintainability cleanup, and change request  
> **Reviewer:** Automated evidence-based code review  
> **Project Path:** `p3/`

---

## 1. Final Feature Summary

The Clinic Appointment System is a **React + Express + MySQL** prototype with two roles (**Receptionist** and **Doctor**) managing a single `appointments` entity through a complete lifecycle. The system was built across workshop stages and has reached a substantially complete state.

### What Was Built

| Feature | Status | Key Evidence |
|---|---|---|
| Database-backed login with SHA-256 hashing | ✅ Complete | `POST /api/auth/login`, `app_users` table, `hash.js` |
| Appointment creation (Receptionist only) | ✅ Complete | `POST /api/appointments` with `authMiddleware('Receptionist')` |
| Appointment list/view with auto-scoping | ✅ Complete | `GET /api/appointments`, Doctor auto-filtered to own `doctorName` |
| Appointment booking update (Receptionist only) | ✅ Complete | `PUT /api/appointments/:id/booking` on `pending`/`accepted` only |
| Appointment cancellation (Receptionist only) | ✅ Complete | `PUT /api/appointments/:id/cancel` on `pending`/`accepted` |
| Doctor accept/reject workflow | ✅ Complete | `PUT /:id/accept`, `PUT /:id/reject` with ownership checks |
| Visit notes add/edit (Doctor only, write-protected) | ✅ Complete | `PUT /:id/notes` with `authMiddleware('Doctor')` + ownership check |
| Visit note privacy (read-protected from Receptionist) | ✅ Complete | Backend strips `visitNote` to `null` for Receptionist; UI hides column |
| Filter by doctor, date, status | ✅ Complete | Three filter controls with backend query param handling |
| Automated integration tests | ✅ Complete | `backend/test.js` with 15 assertions + cleanup |
| Database setup/reset scripts | ✅ Complete | `npm run db:setup` (idempotent), `npm run db:reset` (destructive) |
| Root `.gitignore` protecting `.env` | ✅ Complete | Excludes `.env`, `node_modules/`, `dist/` |

### Main Workflow End-to-End

```
Receptionist creates appointment → Status: "pending"
       ↓
Doctor reviews and accepts OR rejects → Status: "accepted" or "rejected"
       ↓ (if accepted)
Doctor adds visit notes and completes → Status: "completed"

At any point (pending or accepted):
Receptionist can edit booking details (reschedule, change doctor)
Receptionist can cancel → Status: "cancelled"
```

1. **Receptionist logs in** via `POST /api/auth/login` with username/password → receives a token.
2. **Receptionist books** an appointment by filling patient name, phone, doctor, date, time, and reason → stored as `pending`.
3. **Receptionist can edit** booking details (patient info, date, time, doctor, reason) while status is `pending` or `accepted`.
4. **Receptionist can cancel** a `pending` or `accepted` appointment → changes to `cancelled`.
5. **Doctor logs in** → sees only their own appointments (backend auto-scopes `doctorName`).
6. **Doctor accepts or rejects** pending appointments → changes to `accepted` or `rejected`.
7. **Doctor adds visit notes** to `accepted` appointments and marks as `completed`.
8. **Both roles** can filter the list by doctor (Receptionist only), date, and status.
9. **Visit notes are private**: Receptionist cannot read them (backend strips to `null`, UI hides the column).

---

## 2. Review Scoring Matrix

| Feature / Area | Functionality 0-5 | Data Persistence 0-5 | Backend Security / Role Control 0-5 | Validation / Error Handling 0-5 | Testing Evidence 0-5 | Maintainability 0-5 | UI / Manual Usability 0-5 | Evidence | Notes |
|---|---:|---:|---:|---:|---:|---:|---:|---|---|
| Project setup and run commands | 5 | N/A | N/A | N/A | 3 | 4 | N/A | [package.json](file:///h:/docs/Demo/Ai-Workshop/1%20Clinic%20Appointment%20System/p3/package.json), [README.md](file:///h:/docs/Demo/Ai-Workshop/1%20Clinic%20Appointment%20System/p3/README.md), [.gitignore](file:///h:/docs/Demo/Ai-Workshop/1%20Clinic%20Appointment%20System/p3/.gitignore) | Root `package.json` has `install:all`, `dev:backend`, `dev:frontend`, `db:setup`, `db:reset`, `test`. README documents setup. Root `.gitignore` excludes `.env`, `node_modules/`, `dist/`. `.env.example` provided. |
| Database setup and starter data | 5 | 5 | N/A | 3 | 3 | 4 | N/A | [setupDb.js](file:///h:/docs/Demo/Ai-Workshop/1%20Clinic%20Appointment%20System/p3/backend/config/setupDb.js), [resetDb.js](file:///h:/docs/Demo/Ai-Workshop/1%20Clinic%20Appointment%20System/p3/backend/config/resetDb.js), [schema.sql](file:///h:/docs/Demo/Ai-Workshop/1%20Clinic%20Appointment%20System/p3/backend/config/schema.sql) | Both `db:setup` (idempotent) and `db:reset` (destructive) exist. Seeds 3 users + 2 demo appointments. `schema.sql` provided as reference. Error handling exits with code 1. |
| Login workflow | 4 | 5 | 4 | 3 | 3 | 3 | 4 | [routes/auth.js](file:///h:/docs/Demo/Ai-Workshop/1%20Clinic%20Appointment%20System/p3/backend/routes/auth.js), [App.jsx L92-118](file:///h:/docs/Demo/Ai-Workshop/1%20Clinic%20Appointment%20System/p3/frontend/src/App.jsx#L92-L118) | DB-backed login with SHA-256 hashing. Frontend shows login form with demo credentials. Token is raw username (acceptable for workshop). Test suite verifies password hash match. No session expiry. |
| Role-based access | 5 | N/A | 5 | 4 | 3 | 4 | 4 | [middleware/auth.js](file:///h:/docs/Demo/Ai-Workshop/1%20Clinic%20Appointment%20System/p3/backend/middleware/auth.js), [routes/appointments.js](file:///h:/docs/Demo/Ai-Workshop/1%20Clinic%20Appointment%20System/p3/backend/routes/appointments.js) | Middleware queries DB per request, does not trust client-sent roles. Each route specifies `requiredRole`. Doctor auto-scoped to own appointments. Ownership checks on accept/reject/notes. |
| Main create action | 5 | 5 | 5 | 4 | 3 | 4 | 4 | [routes/appointments.js L31-52](file:///h:/docs/Demo/Ai-Workshop/1%20Clinic%20Appointment%20System/p3/backend/routes/appointments.js#L31-L52), [appointmentService.js L43-60](file:///h:/docs/Demo/Ai-Workshop/1%20Clinic%20Appointment%20System/p3/backend/services/appointmentService.js#L43-L60) | Receptionist-only POST with full validation (name ≥2, reason ≥5, phone regex, date not in past, time 24h). Persists to MySQL via parameterised query. Test suite verifies creation and default `pending` status. |
| Main view/list action | 5 | 5 | 5 | 3 | 3 | 4 | 4 | [routes/appointments.js L7-28](file:///h:/docs/Demo/Ai-Workshop/1%20Clinic%20Appointment%20System/p3/backend/routes/appointments.js#L7-L28), [appointmentService.js L6-30](file:///h:/docs/Demo/Ai-Workshop/1%20Clinic%20Appointment%20System/p3/backend/services/appointmentService.js#L6-L30) | Both roles can view. Doctor auto-scoped to own `doctorName` in backend. Visit notes stripped to `null` for Receptionist (L18-22). Sorted chronologically. Test suite verifies list and filter results. |
| Main update/status/cancel action | 5 | 5 | 5 | 3 | 4 | 4 | 4 | [routes/appointments.js L54-127](file:///h:/docs/Demo/Ai-Workshop/1%20Clinic%20Appointment%20System/p3/backend/routes/appointments.js#L54-L127), [App.jsx L162-252](file:///h:/docs/Demo/Ai-Workshop/1%20Clinic%20Appointment%20System/p3/frontend/src/App.jsx#L162-L252) | Edit booking on `pending`/`accepted`. Cancel on `pending`/`accepted`. Accept/reject on `pending` with ownership. Confirmation dialog before cancel. Test suite verifies: reschedule, cancel, block-after-completed. |
| Protected action | 5 | 5 | 5 | 4 | 3 | 4 | 4 | [routes/appointments.js L85-113](file:///h:/docs/Demo/Ai-Workshop/1%20Clinic%20Appointment%20System/p3/backend/routes/appointments.js#L85-L113), [routes/appointments.js L17-22](file:///h:/docs/Demo/Ai-Workshop/1%20Clinic%20Appointment%20System/p3/backend/routes/appointments.js#L17-L22) | **Write**: `authMiddleware('Doctor')` + ownership check (L100). **Read**: Backend strips `visitNote` to `null` for Receptionist (L18-22). **UI**: Notes column only shown for Doctor (L520). Both read and write privacy enforced. |
| Secondary feature | 4 | N/A | 3 | 3 | 3 | 4 | 4 | [App.jsx L460-492](file:///h:/docs/Demo/Ai-Workshop/1%20Clinic%20Appointment%20System/p3/frontend/src/App.jsx#L460-L492), [appointmentService.js L6-30](file:///h:/docs/Demo/Ai-Workshop/1%20Clinic%20Appointment%20System/p3/backend/services/appointmentService.js#L6-L30) | Filter by doctor (Receptionist only), date, status. Backend builds dynamic WHERE with parameterised queries. Test suite verifies doctor and status filters. No "Clear filters" button. |
| Case-specific: appointment date/time and doctor assignment | 5 | 5 | 4 | 4 | 3 | 4 | 4 | [validation.js](file:///h:/docs/Demo/Ai-Workshop/1%20Clinic%20Appointment%20System/p3/backend/utils/validation.js), [App.jsx L409-428](file:///h:/docs/Demo/Ai-Workshop/1%20Clinic%20Appointment%20System/p3/frontend/src/App.jsx#L409-L428) | Date cannot be in past. Time must be valid 24h format. Doctor assigned from dropdown. Both create and edit forms have date/time pickers. No double-booking detection (acknowledged limitation). |
| Case-specific: appointment status and cancellation flow | 5 | 5 | 5 | 4 | 4 | 4 | 4 | [appointmentService.js L105-113](file:///h:/docs/Demo/Ai-Workshop/1%20Clinic%20Appointment%20System/p3/backend/services/appointmentService.js#L105-L113), [test.js L104-118](file:///h:/docs/Demo/Ai-Workshop/1%20Clinic%20Appointment%20System/p3/backend/test.js#L104-L118) | Full lifecycle: `pending` → `accepted`/`rejected` → `completed`/`cancelled`. SQL WHERE clauses enforce valid transitions. Cancellation on `pending`/`accepted` only. Test suite covers accept, complete, cancel, and block-after-completed. |
| Case-specific: visit note privacy and doctor-only editing | 5 | 5 | 5 | 4 | 3 | 4 | 4 | [routes/appointments.js L17-22](file:///h:/docs/Demo/Ai-Workshop/1%20Clinic%20Appointment%20System/p3/backend/routes/appointments.js#L17-L22), [routes/appointments.js L99-102](file:///h:/docs/Demo/Ai-Workshop/1%20Clinic%20Appointment%20System/p3/backend/routes/appointments.js#L99-L102) | **Write**: Doctor-only via middleware + ownership enforcement. **Read**: Backend nullifies `visitNote` for Receptionist. **UI**: Notes column hidden for Receptionist (L520). Fixes the critical privacy gap identified in Mid Review. |
| UI/manual usability | N/A | N/A | N/A | N/A | 2 | 3 | 4 | [index.css](file:///h:/docs/Demo/Ai-Workshop/1%20Clinic%20Appointment%20System/p3/frontend/src/index.css), [App.jsx](file:///h:/docs/Demo/Ai-Workshop/1%20Clinic%20Appointment%20System/p3/frontend/src/App.jsx) | Dark glassmorphism theme. Status badges colour-coded. Toast notifications. Modal dialogs. Responsive grid. Loading/error/empty states. `App.css` cleaned. `<title>` still says "frontend". |
| Security posture | N/A | N/A | 4 | 3 | 2 | 3 | N/A | [middleware/auth.js](file:///h:/docs/Demo/Ai-Workshop/1%20Clinic%20Appointment%20System/p3/backend/middleware/auth.js), [.gitignore](file:///h:/docs/Demo/Ai-Workshop/1%20Clinic%20Appointment%20System/p3/.gitignore) | Role from DB per request. Parameterised SQL. SHA-256 hashing. Ownership checks. `.gitignore` covers `.env`. Token is raw username (not cryptographic). CORS `*`. No rate limiting / helmet / HTTPS. |
| Testing evidence | N/A | N/A | N/A | N/A | 3 | 3 | N/A | [test.js](file:///h:/docs/Demo/Ai-Workshop/1%20Clinic%20Appointment%20System/p3/backend/test.js), [TEST_PLAN.md](file:///h:/docs/Demo/Ai-Workshop/1%20Clinic%20Appointment%20System/p3/docs/TEST_PLAN.md) | 15 integration assertions covering DB connectivity, login, CRUD, filters, status transitions, security blocks, and cleanup. No test framework (raw Node.js). No frontend tests. No HTTP-level role enforcement tests (tests use service layer directly). |
| Maintainability | N/A | N/A | N/A | N/A | N/A | 3 | N/A | [App.jsx](file:///h:/docs/Demo/Ai-Workshop/1%20Clinic%20Appointment%20System/p3/frontend/src/App.jsx) (755 lines) | Backend well-structured (routes/services/middleware/config/utils). Frontend is a single 755-line `App.jsx` with no component decomposition. `App.css` cleaned to 2 lines. Inline styles throughout. Doctor list hardcoded in two places. No ESLint in backend. |

---

## 3. Project Structure and Run Commands

### Project Structure

```
p3/
├── .gitignore                          # Excludes .env, node_modules/, dist/
├── Case_Brief.md                       # Original case description
├── MID_REVIEW.md                       # Mid-project review document
├── PROJECT_CONTEXT.md                  # Detailed project context & scope
├── README.md                           # Setup and run instructions
├── REQUIREMENTS.md                     # Functional requirements & validation rules
├── package.json                        # Root monorepo scripts
│
├── backend/
│   ├── .env                            # Environment variables (gitignored)
│   ├── .env.example                    # Template for .env
│   ├── package.json                    # Backend dependencies & scripts
│   ├── server.js                       # Express entry point (port 5000)
│   ├── test.js                         # Integration test suite (15 assertions)
│   ├── config/
│   │   ├── db.js                       # MySQL2 connection pool
│   │   ├── schema.sql                  # Reference SQL schema
│   │   ├── setupDb.js                  # Idempotent DB + seed setup
│   │   └── resetDb.js                  # Destructive drop + recreate + seed
│   ├── middleware/
│   │   └── auth.js                     # Auth + role middleware (DB-backed)
│   ├── routes/
│   │   ├── auth.js                     # POST /api/auth/login
│   │   └── appointments.js             # CRUD + status routes (7 endpoints)
│   ├── services/
│   │   └── appointmentService.js       # Data access layer (parameterised SQL)
│   └── utils/
│       ├── hash.js                     # SHA-256 password hashing
│       └── validation.js               # Appointment field validation
│
├── frontend/
│   ├── index.html                      # Vite HTML entry
│   ├── package.json                    # Frontend dependencies (React 19, Vite 8)
│   ├── vite.config.js                  # Vite config (React plugin)
│   ├── eslint.config.js                # ESLint config
│   └── src/
│       ├── main.jsx                    # React entry point
│       ├── App.jsx                     # Single-file application (755 lines)
│       ├── App.css                     # Cleaned placeholder (2 lines)
│       └── index.css                   # Full design system (344 lines)
│
└── docs/
    └── TEST_PLAN.md                    # Test plan and manual verification checklist
```

### Run Commands

| Command | Purpose | Where |
|---|---|---|
| `npm run install:all` | Install dependencies for both frontend and backend | Root |
| `npm run db:setup` | Create database, tables, and seed data (idempotent) | Root |
| `npm run db:reset` | Drop and recreate database with fresh seed data | Root |
| `npm run dev:backend` | Start Express API on `http://localhost:5000` | Root |
| `npm run dev:frontend` | Start Vite dev server on `http://localhost:5173` | Root |
| `npm test` | Run integration test suite | Root |

---

## 4. Frontend/Backend Separation Check

| Check | Result | Evidence |
|---|---|---|
| Separate directories | ✅ PASS | `frontend/` and `backend/` are independent directories |
| Separate `package.json` files | ✅ PASS | Each has its own dependencies and scripts |
| Different runtimes | ✅ PASS | Frontend: Vite + React 19, Backend: Express 4 + Node.js |
| React calls Express via HTTP | ✅ PASS | Frontend uses `fetch()` to `http://localhost:5000/api/*` |
| React never connects to MySQL directly | ✅ PASS | No `mysql`, `mysql2`, `DB_*`, or `process.env` references in frontend source |
| No shared code between frontend and backend | ✅ PASS | No symlinks or cross-imports between the two directories |

**Verdict**: React and Express are fully separated. The frontend communicates with the backend exclusively through REST API calls over HTTP. At no point does the React application access MySQL directly.

---

## 5. Database Setup and Table Summary

### Database Connection Method

The backend uses the `mysql2/promise` package with a **connection pool** configured in [db.js](file:///h:/docs/Demo/Ai-Workshop/1%20Clinic%20Appointment%20System/p3/backend/config/db.js):

| Parameter | Configured | Source |
|---|---|---|
| `DB_HOST` | ✅ Yes | `process.env.DB_HOST` (default: `localhost`) |
| `DB_PORT` | ✅ Yes | `process.env.DB_PORT` (default: `3306`) |
| `DB_USER` | ✅ Yes | `process.env.DB_USER` (default: `root`) |
| `DB_PASSWORD` | ✅ Yes | `process.env.DB_PASSWORD` (default: `''`) — **value not printed** |
| `DB_NAME` | ✅ Yes | `process.env.DB_NAME` (default: `clinic_appointments`) |

A `.env.example` template is provided. The actual `.env` file is excluded by `.gitignore`.

### Database Tables

| Table | Columns | Purpose |
|---|---|---|
| `app_users` | `id` (PK, AUTO_INCREMENT), `username` (UNIQUE), `password_hash` (SHA-256), `role` (ENUM: Receptionist, Doctor), `doctor_name` (nullable), `created_at` | Login/authentication table with role assignment |
| `appointments` | `id` (PK, AUTO_INCREMENT), `patientName`, `patientPhone`, `doctorName`, `appointmentDate` (DATE), `appointmentTime` (TIME), `reason` (TEXT), `status` (ENUM: pending, accepted, rejected, completed, cancelled), `visitNote` (TEXT, nullable), `createdAt`, `updatedAt` | Main entity table for all appointment data |

**A users/login table exists**: Yes — `app_users` serves as the login table with hashed passwords.

### Recreating Tables and Seed Data

- **`npm run db:setup`** (runs [setupDb.js](file:///h:/docs/Demo/Ai-Workshop/1%20Clinic%20Appointment%20System/p3/backend/config/setupDb.js)): Idempotent — uses `CREATE DATABASE IF NOT EXISTS` and `CREATE TABLE IF NOT EXISTS`. Seeds users/appointments only if tables are empty (`SELECT COUNT(*)`).
- **`npm run db:reset`** (runs [resetDb.js](file:///h:/docs/Demo/Ai-Workshop/1%20Clinic%20Appointment%20System/p3/backend/config/resetDb.js)): Destructive — drops the entire database, recreates tables, and re-seeds fresh data. Guarantees a clean state.

### Seed Data

| Entity | Records | Details |
|---|---|---|
| Users | 3 | `receptionist1` (Receptionist), `dr_smith` (Doctor, Dr. Smith), `dr_jones` (Doctor, Dr. Jones) — all with password `password123` hashed with SHA-256 |
| Appointments | 2 | John Doe → Dr. Smith (pending, today 10:00), Jane Doe → Dr. Jones (accepted, today 11:30) |

---

## 6. Login and Role/Access Explanation

### How the Two Roles Log In

1. Navigate to `http://localhost:5173`.
2. Enter username and password in the login form.
3. Frontend sends `POST /api/auth/login` with `{ username, password }`.
4. Backend looks up `username` in `app_users` table, computes SHA-256 of the input password, and compares against `password_hash`.
5. On match: returns `{ username, role, doctorName, token }` where `token` is the username itself (simplified for workshop).
6. On failure: returns `401` with `"Invalid username or password."`.
7. Frontend stores the response in React state and sends `Authorization: Bearer <token>` on subsequent requests.

### How Roles Are Checked

The [auth middleware](file:///h:/docs/Demo/Ai-Workshop/1%20Clinic%20Appointment%20System/p3/backend/middleware/auth.js) runs on every protected route:

1. Extracts the username from the `Authorization: Bearer <token>` header.
2. **Queries the database** to look up the user's true `role` and `doctor_name` — does **not** trust any client-sent role headers.
3. Populates `req.user = { username, role, doctorName }` from the database result.
4. If a `requiredRole` is specified on the route, checks `req.user.role` against it and returns `403` if mismatched.

### Backend Role Checks Summary

| Route | HTTP Method | Required Role | Additional Checks |
|---|---|---|---|
| `/api/auth/login` | POST | None | Validates credentials against DB |
| `/api/appointments` | GET | Any authenticated | Doctor auto-filtered to own `doctorName`; visit notes stripped for Receptionist |
| `/api/appointments` | POST | Receptionist | Field validation |
| `/api/appointments/:id/booking` | PUT | Receptionist | Only `pending`/`accepted` status |
| `/api/appointments/:id/cancel` | PUT | Receptionist | Only `pending`/`accepted` status |
| `/api/appointments/:id/accept` | PUT | Doctor | Ownership check: `appointment.doctorName === req.user.doctorName` |
| `/api/appointments/:id/reject` | PUT | Doctor | Ownership check: `appointment.doctorName === req.user.doctorName` |
| `/api/appointments/:id/notes` | PUT | Doctor | Ownership check + only `accepted` status |

### Can Users Access Only Their Own Allowed Records?

- **Receptionist**: Sees **all** appointments (as expected — receptionists manage the full schedule). Cannot see visit notes.
- **Doctor**: Sees **only** appointments assigned to their `doctorName`. The backend forces `filters.doctorName = req.user.doctorName` from the DB, overriding any client-sent filter. The doctor **cannot** accept, reject, or add notes to another doctor's appointments (ownership check returns `403`).

---

## 7. Protected Action Explanation

The **protected action** for this case is **visit note privacy and doctor-only editing**.

### Write Protection

- The `PUT /api/appointments/:id/notes` route uses `authMiddleware('Doctor')` — any non-Doctor user receives `403 Forbidden`.
- Within the route, an **ownership check** verifies `appointment.doctorName === req.user.doctorName` — a doctor cannot edit notes on another doctor's appointment (returns `403`).
- The SQL query restricts updates to `WHERE status = 'accepted'` — notes cannot be added to pending, rejected, cancelled, or already completed appointments.

### Read Protection

- The `GET /api/appointments` route (L17-22) **strips `visitNote` to `null`** for any user with `role === 'Receptionist'` before sending the response. This is a **backend-level** privacy filter.
- The frontend **hides the Visit Notes column entirely** when the logged-in user is a Receptionist (L520: `{currentUser.role === 'Doctor' && <th>Visit Notes</th>}`).

### Mid-Review Gap Resolved

The Mid Review identified a **critical privacy gap** (C-1 and C-2): visit notes were visible to Receptionists in both the backend response and the frontend table. This has been **fully resolved** in the final code:
- Backend now nullifies `visitNote` for Receptionist (L18-22 of `routes/appointments.js`).
- Frontend conditionally renders the Visit Notes column only for Doctor.

---

## 8. Validation Summary

### Backend Validation Rules (in [validation.js](file:///h:/docs/Demo/Ai-Workshop/1%20Clinic%20Appointment%20System/p3/backend/utils/validation.js))

| Field | Rule | Implementation |
|---|---|---|
| `patientName` | Required, ≥ 2 characters | `trim().length < 2` check |
| `patientPhone` | Optional, if provided must match `/^[+\d\s-]+$/` | Regex for digits, spaces, dashes, plus |
| `doctorName` | Required (presence check only) | Checks for truthy value; **does not** validate against an allowed list |
| `appointmentDate` | Required, valid date, not in the past | `new Date()` comparison, `isNaN` check |
| `appointmentTime` | Required, valid 24h format `HH:MM` | Regex: `/^([01]\d|2[0-3]):([0-5]\d)(:([0-5]\d))?$/` |
| `reason` | Required, ≥ 5 characters | `trim().length < 5` check |

### Status Transition Enforcement

| Transition | Enforced By |
|---|---|
| Cannot edit booking after completed/cancelled/rejected | SQL `WHERE status IN ('pending', 'accepted')` |
| Cannot add notes to non-accepted appointment | SQL `WHERE status = 'accepted'` |
| Cannot cancel completed/rejected/cancelled appointment | SQL `WHERE status IN ('pending', 'accepted')` |
| Cannot accept non-pending appointment | SQL `WHERE status = 'pending'` |
| Cannot reject non-pending appointment | SQL `WHERE status = 'pending'` |

### Validation Applied On

- `POST /api/appointments` (create) — runs `validateAppointment()`
- `PUT /api/appointments/:id/booking` (edit) — runs `validateAppointment()`
- `PUT /api/appointments/:id/notes` — validates `status` is `completed` or `accepted`

### Validation Limitation

Validation returns a **single string error message** (the first validation failure found), not an array of field-level errors. The REQUIREMENTS.md specifies "array of specific field validation errors", which is not fully met.

---

## 9. Automated and Manual Testing Summary

### Automated Test Command

```bash
npm test
```

This runs `node test.js` in the `backend/` directory.

### What the Tests Check

The [test.js](file:///h:/docs/Demo/Ai-Workshop/1%20Clinic%20Appointment%20System/p3/backend/test.js) file contains **15 integration assertions**:

| # | Test | Type |
|---|---|---|
| 1 | Database connectivity (`SELECT 1`) | Infrastructure |
| 2 | User `dr_smith` exists in `app_users` | Login / seed verification |
| 3 | Password SHA-256 hash matches | Login verification |
| 4 | DB returns correct role and `doctor_name` | Role assignment |
| 5 | Appointment created with auto-increment ID | Create flow |
| 6 | Default status is `pending` | Create flow |
| 7 | New appointment visible in full list | List flow |
| 8 | Doctor filter returns only matching doctor | Filter |
| 9 | Status filter returns only matching status | Filter |
| 10 | Reschedule updates persist to MySQL | Update flow |
| 11 | Doctor accept transitions status | Accept flow |
| 12 | Doctor saves visit notes and completes | Protected action |
| 13 | Status transitions to `completed` | Status lifecycle |
| 14 | Cannot update booking details of completed appointment | Security constraint |
| 15 | Receptionist can cancel appointment | Cancel flow |
| 16 | Cancelled status persisted | Cancel verification |
| 17 | Test records cleaned up | Cleanup |

### Test Data Creation and Cleanup

- **Creation**: Tests use a `TEST-` prefix for patient names (e.g., `TEST-John Doe`, `TEST-Cancel Patient`).
- **Pre-cleanup**: Before tests begin, any lingering `TEST-` prefixed records are deleted: `DELETE FROM appointments WHERE patientName LIKE 'TEST-%'`.
- **Post-cleanup**: After all tests, the same DELETE runs again and asserts `affectedRows > 0`, confirming cleanup succeeded.
- **Result format**: Prints `[PASS]` or `[FAIL]` for each assertion, then a summary line: `TEST RUN SUMMARY: X PASSED, Y FAILED`. Exits with code `0` (all pass) or `1` (any failure).

### What Is NOT Automated

| Gap | Description |
|---|---|
| No HTTP-level role tests | Tests call the **service layer** directly (`appointmentService.*`), bypassing the Express routes and middleware. No test verifies that `PUT /:id/notes` returns `403` when called by a Receptionist, or that `POST /appointments` returns `403` when called by a Doctor. |
| No frontend tests | No React component tests. No Cypress/Playwright end-to-end tests. |
| No test framework | Tests use raw Node.js `assert` pattern, not Jest/Mocha/Vitest. |
| No validation rejection tests | No automated test sends invalid data (missing fields, past date, bad phone) and checks for `400` response. |
| No visit note privacy test | No test verifies that `visitNote` is stripped from Receptionist GET responses. |

### Manual Verification

The [TEST_PLAN.md](file:///h:/docs/Demo/Ai-Workshop/1%20Clinic%20Appointment%20System/p3/docs/TEST_PLAN.md) documents a manual verification checklist covering:
- Login with each demo account
- Booking with past date (error toast verification)
- Valid appointment creation
- Receptionist cannot see visit notes column
- Doctor sees only own appointments
- Doctor add notes and complete workflow

**Verdict**: The project has **partial** automated test coverage. Core CRUD and status lifecycle are tested at the service layer. HTTP-level role enforcement, validation rejection, and frontend behaviour are not automated and rely on manual checks.

---

## 10. Stage 11 Change Summary (What Changed After Mid-Review)

The Mid Review was conducted after the secondary feature stage. The following changes were made in subsequent stages:

### Critical Fixes

| Change | Before (Mid Review) | After (Final) | Files Changed |
|---|---|---|---|
| Visit note read privacy (C-1, C-2) | `visitNote` returned to all roles; column visible to Receptionist | Backend strips `visitNote` to `null` for Receptionist; UI hides column | [routes/appointments.js L17-22](file:///h:/docs/Demo/Ai-Workshop/1%20Clinic%20Appointment%20System/p3/backend/routes/appointments.js#L17-L22), [App.jsx L520](file:///h:/docs/Demo/Ai-Workshop/1%20Clinic%20Appointment%20System/p3/frontend/src/App.jsx#L520) |

### Status Lifecycle Enhancement (Change Request)

| Change | Before | After | Files Changed |
|---|---|---|---|
| Status ENUM expanded | `booked`, `completed`, `cancelled` | `pending`, `accepted`, `rejected`, `completed`, `cancelled` | [schema.sql L25](file:///h:/docs/Demo/Ai-Workshop/1%20Clinic%20Appointment%20System/p3/backend/config/schema.sql#L25), setupDb.js, resetDb.js |
| Doctor accept/reject workflow | Not implemented | Two new routes: `PUT /:id/accept`, `PUT /:id/reject` with ownership checks | [routes/appointments.js L129-173](file:///h:/docs/Demo/Ai-Workshop/1%20Clinic%20Appointment%20System/p3/backend/routes/appointments.js#L129-L173) |
| Accept/reject service functions | Not present | `acceptAppointment()`, `rejectAppointment()` in service layer | [appointmentService.js L118-139](file:///h:/docs/Demo/Ai-Workshop/1%20Clinic%20Appointment%20System/p3/backend/services/appointmentService.js#L118-L139) |
| Notes restricted to accepted | Notes allowed on `booked` status | Notes only on `accepted` status (SQL `WHERE status = 'accepted'`) | [appointmentService.js L95](file:///h:/docs/Demo/Ai-Workshop/1%20Clinic%20Appointment%20System/p3/backend/services/appointmentService.js#L95) |
| UI accept/reject buttons | Not present | Accept + Reject buttons shown for Doctor on `pending` appointments | [App.jsx L576-593](file:///h:/docs/Demo/Ai-Workshop/1%20Clinic%20Appointment%20System/p3/frontend/src/App.jsx#L576-L593) |
| Badge styles added | Only `booked`, `completed`, `cancelled` | Added `badge-pending`, `badge-accepted`, `badge-rejected` | [index.css L159-175](file:///h:/docs/Demo/Ai-Workshop/1%20Clinic%20Appointment%20System/p3/frontend/src/index.css#L159-L175) |

### Security / Maintainability

| Change | Before | After | Files Changed |
|---|---|---|---|
| Root `.gitignore` | Did not exist | Created; excludes `.env`, `node_modules/`, `dist/` | [.gitignore](file:///h:/docs/Demo/Ai-Workshop/1%20Clinic%20Appointment%20System/p3/.gitignore) |
| `App.css` boilerplate | 185 lines of unused Vite CSS | Cleaned to 2 lines (comment only) | [App.css](file:///h:/docs/Demo/Ai-Workshop/1%20Clinic%20Appointment%20System/p3/frontend/src/App.css) |
| Doctor ownership check | Not present on notes route | Added: `appointment.doctorName !== req.user.doctorName` → `403` | [routes/appointments.js L99-102](file:///h:/docs/Demo/Ai-Workshop/1%20Clinic%20Appointment%20System/p3/backend/routes/appointments.js#L99-L102) |

### Testing

| Change | Before | After | Files Changed |
|---|---|---|---|
| Test file | Did not exist | Created with 15 integration assertions | [test.js](file:///h:/docs/Demo/Ai-Workshop/1%20Clinic%20Appointment%20System/p3/backend/test.js) |
| Test plan document | Did not exist | Created with automated + manual verification steps | [TEST_PLAN.md](file:///h:/docs/Demo/Ai-Workshop/1%20Clinic%20Appointment%20System/p3/docs/TEST_PLAN.md) |
| `npm test` script | Did not exist | Added to both root and backend `package.json` | [package.json](file:///h:/docs/Demo/Ai-Workshop/1%20Clinic%20Appointment%20System/p3/package.json), [backend/package.json](file:///h:/docs/Demo/Ai-Workshop/1%20Clinic%20Appointment%20System/p3/backend/package.json) |

---

## 11. Stage Drift or Early Work

| Future Stage | Built Early? | Evidence | Assessment |
|---|---|---|---|
| Database-backed login (typically Stage 8+) | ✅ Yes | `POST /api/auth/login` with SHA-256 against `app_users` | **Beneficial drift** — stronger than role-switcher prototype. |
| Backend role middleware (typically security hardening) | ✅ Yes | `authMiddleware()` queries DB per request | **Beneficial drift** — avoids bolting on security later. |
| Password hashing (typically security hardening) | ✅ Yes | SHA-256 in `hash.js` used from project start | Acceptable for workshop. |
| Doctor ownership enforcement (typically security hardening) | ✅ Yes | Ownership check on accept/reject/notes from initial implementation | **Beneficial drift** — prevents cross-doctor data access. |

**Assessment**: All early implementations are **structurally beneficial**. No harmful premature optimisation or over-engineering was observed. The project followed a sound pattern of building security foundations early rather than retrofitting.

---

## 12. Security Risks and Exposed-Secret Check

### Exposed Secret Risk

| Check | Result | Details |
|---|---|---|
| `.env` excluded from git | ✅ Yes | Root `.gitignore` includes `.env` and `.env.local` |
| `.env.example` uses placeholders | ✅ Yes | `DB_PASSWORD=yourpassword` — no real credentials |
| Secrets in source code | ⚠️ Low risk | Default password `password123` is visible in seed scripts (`setupDb.js`, `resetDb.js`). This is acceptable for demo seed data but would be a risk in production. |
| API keys or tokens in code | ✅ None found | No API keys, JWT secrets, or tokens hardcoded in source |
| Password in `.env` | ⚠️ Present | The `.env` file exists in the working directory with `DB_PASSWORD=` (empty). While gitignored, it's still on disk. |

### Security Posture

| Security Aspect | Status | Notes |
|---|---|---|
| SQL injection protection | ✅ All queries parameterised | Uses `?` placeholders throughout |
| Role verification from DB | ✅ Per-request | Middleware queries `app_users` on every request |
| Password hashing | ✅ SHA-256 | Not bcrypt, but acceptable for workshop |
| Ownership enforcement | ✅ Backend | Doctor cannot access other doctors' appointments |
| Visit note privacy | ✅ Backend + UI | Stripped from Receptionist responses |
| Token security | ⚠️ Raw username | Anyone knowing a username can forge a bearer token |
| CORS configuration | ⚠️ Open (`*`) | Accepts requests from any origin |
| Rate limiting | ❌ Not implemented | No protection against brute force |
| Helmet headers | ❌ Not implemented | No security headers (X-Frame-Options, etc.) |
| HTTPS enforcement | ❌ Not implemented | Runs on HTTP only |
| Session expiry | ❌ Not implemented | Token never expires |

---

## 13. Documentation/Code Mismatches

| Document | States | Code Reality | Severity |
|---|---|---|---|
| **REQUIREMENTS.md** — Status values | `booked`, `completed`, `cancelled` | ENUM is `pending`, `accepted`, `rejected`, `completed`, `cancelled` | Medium — document not updated after status lifecycle enhancement |
| **REQUIREMENTS.md** — Auth mechanism | "dropdown on frontend allows switching users" with `X-Role` headers | Actual login form with `POST /api/auth/login` and Bearer tokens | Low — code is stronger than spec; document not updated |
| **REQUIREMENTS.md** — Validation errors | "array of specific field validation errors" | Returns single string error message | Low — partial implementation |
| **PROJECT_CONTEXT.md** — Out of scope | "Authentication & Authorization: Full user login, password hashing" listed as out of scope | Actually implemented (SHA-256 hashing, DB-backed login) | Low — code exceeds documented scope (positive) |
| **PROJECT_CONTEXT.md** — Contact Number | "Contact Number: String (required)" | `patientPhone` is **optional** in validation and schema (`NULL` allowed) | Low — code is more lenient than spec |
| **index.html** — Page title | N/A | `<title>frontend</title>` — should say "Clinic Appointment System" | Minor |
| **App.jsx L733** — Visit status dropdown | Shows `"booked"` as an option value | Should be `"accepted"` since the valid status values are `accepted` and `completed` for notes | Low — frontend dropdown mislabelled but backend validates correctly |

---

## 14. Known Limitations

| # | Limitation | Impact | Mitigation |
|---|---|---|---|
| 1 | **Token is raw username** — no cryptographic signing | Anyone knowing a valid username can impersonate that user | Middleware re-verifies from DB per request; acceptable for workshop |
| 2 | **No double-booking detection** | Same doctor can be booked for same date/time by multiple receptionists | Acknowledged in PROJECT_CONTEXT as a known risk |
| 3 | **CORS allows all origins** | Any website can make API requests | Acceptable for development; must restrict in production |
| 4 | **No session expiry** | Token never expires; logout is client-side only | Refresh clears React state; no server-side session invalidation |
| 5 | **Single-file frontend** | 755-line `App.jsx` with no component decomposition | Works but reduces maintainability |
| 6 | **No frontend tests** | UI behaviour not automatically verified | Manual checklist in TEST_PLAN.md |
| 7 | **Tests bypass HTTP layer** | Integration tests call service functions directly, not Express routes | Role enforcement middleware is not tested automatically |
| 8 | **Doctor list hardcoded in two places** | Frontend `CLINIC_DOCTORS` array and backend seed data must be kept in sync | No API endpoint to fetch doctor list dynamically |
| 9 | **`doctorName` not validated against allowed list** | Backend accepts any string as doctor name | Frontend dropdown limits choices; backend only checks presence |
| 10 | **No rate limiting or security headers** | Vulnerable to brute force and clickjacking | Acceptable for workshop prototype |
| 11 | **SHA-256 not bcrypt** | Faster to brute force than bcrypt | Acceptable for workshop; not production-grade |
| 12 | **Visit status dropdown mislabelled** | Frontend shows "booked" option in notes editor; should be "accepted" | Backend validates `['completed', 'accepted']` so rejected values fail gracefully |

---

## 15. Demo Script

### Prerequisites
- MySQL server running locally
- Node.js v18+ installed

### Setup (one time)
```bash
cd p3
npm run install:all
npm run db:reset
```

### Step 1: Start Both Servers
```bash
# Terminal 1
npm run dev:backend
# Terminal 2
npm run dev:frontend
```

### Step 2: Run Automated Tests
```bash
# Terminal 3
npm test
```
> **Expected**: All 15 assertions pass with `0 FAILED`. Test records cleaned up.

### Step 3: Receptionist Login & Booking
1. Open `http://localhost:5173` in browser.
2. Log in with **username:** `receptionist1`, **password:** `password123`.
3. Observe: "Book Appointment" sidebar form is visible. No "Visit Notes" column in table.
4. Fill form: Patient: `Demo Patient`, Phone: `555-1111`, Doctor: `Dr. Smith`, Date: tomorrow, Time: `09:30`, Reason: `Routine checkup`.
5. Click **Create Appointment** → green toast appears, appointment visible in table with `pending` badge.

### Step 4: Receptionist Edit & Cancel
6. Click **Edit** on the new appointment → modal opens.
7. Change the time to `10:00` → **Save Changes** → toast confirms update.
8. Click **Cancel** on a different appointment → confirmation dialog → **OK** → status changes to `cancelled`.

### Step 5: Receptionist Filters
9. Use the **Doctor** dropdown to filter by `Dr. Jones` → only Dr. Jones appointments shown.
10. Use the **Status** dropdown to filter by `pending` → only pending appointments shown.
11. Reset filters.

### Step 6: Doctor Login & Review
12. Click **Sign Out**.
13. Log in as **username:** `dr_smith`, **password:** `password123`.
14. Observe: Only Dr. Smith's appointments are visible. **Visit Notes** column is now visible. No "Book Appointment" sidebar.

### Step 7: Doctor Accept & Notes
15. Click **Accept** on a `pending` appointment → status changes to `accepted`.
16. Click **Add/Edit Notes** on the accepted appointment.
17. Enter: `"Blood pressure normal. Prescribed daily vitamin D supplement."`.
18. Select **Complete & close appointment** → **Save Note** → status changes to `completed`, note visible in table.

### Step 8: Doctor Cross-Ownership Block
19. Click **Sign Out**, log in as `dr_jones`.
20. Observe: Only Dr. Jones appointments visible. Dr. Smith's appointments are not shown.

### Step 9: Security Verification (Optional)
21. Open browser DevTools → Console tab.
22. Run:
```javascript
fetch('http://localhost:5000/api/appointments/1/notes', {
  method: 'PUT',
  headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer receptionist1' },
  body: JSON.stringify({ visitNote: 'Hacked', status: 'completed' })
}).then(r => r.json()).then(console.log);
```
> **Expected**: `{ message: "Access denied. Role 'Doctor' required." }` — 403 Forbidden.

---

## 16. Suggested Viva Questions

### Architecture & Setup
1. **Q:** Explain how your frontend and backend communicate. Does React ever connect to MySQL directly?  
   **Expected:** React uses `fetch()` to call Express REST API endpoints. MySQL is only accessed from the backend via the `mysql2/promise` pool. React has no database code.

2. **Q:** What happens if I run `npm run db:setup` twice? What about `npm run db:reset`?  
   **Expected:** `db:setup` is idempotent — uses `IF NOT EXISTS` and checks row counts before seeding. `db:reset` drops the entire database and recreates everything from scratch.

3. **Q:** Show me where the database connection credentials are configured. Are they hardcoded?  
   **Expected:** In `backend/config/db.js`, reading from `process.env` variables (`DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`) loaded from `.env` via `dotenv`. Not hardcoded.

### Authentication & Security
4. **Q:** How does your login work? Is the password stored in plain text?  
   **Expected:** Password is hashed with SHA-256 before storage. Login compares SHA-256 hash of input against `password_hash` in `app_users` table.

5. **Q:** Your token is just the username. Why is this not secure for production, and what mitigates the risk here?  
   **Expected:** Anyone knowing a username could forge a token. Mitigation: middleware re-queries the database per request to verify the user exists and get their true role. For production, JWT with signing would be needed.

6. **Q:** If I use Postman to call `PUT /api/appointments/1/notes` with a Receptionist token, what happens? Show me in the code.  
   **Expected:** The `authMiddleware('Doctor')` checks `req.user.role !== 'Doctor'` and returns `403 Forbidden`. The role comes from the database, not the client.

7. **Q:** Can Dr. Smith edit notes on Dr. Jones's appointment?  
   **Expected:** No. The route checks `appointment.doctorName !== req.user.doctorName` and returns `403` if they don't match. This is an ownership check.

### Core Workflow
8. **Q:** Walk me through the full appointment lifecycle from creation to completion.  
   **Expected:** Receptionist creates (pending) → Doctor accepts (accepted) → Doctor adds notes + completes (completed). Alternative paths: Doctor rejects (rejected), Receptionist cancels (cancelled).

9. **Q:** What happens if a Receptionist tries to cancel a completed appointment?  
   **Expected:** The SQL `WHERE status IN ('pending', 'accepted')` prevents it. `affectedRows` is 0, and the API returns `404: Appointment not found or not in active status`.

10. **Q:** Can a Receptionist see the visit notes that a Doctor wrote?  
    **Expected:** No. The backend strips `visitNote` to `null` for Receptionist role before sending the response, and the frontend hides the entire Visit Notes column for Receptionist.

### Validation
11. **Q:** What validations run when creating an appointment? Show me the code.  
    **Expected:** `validation.js` checks: patientName required + ≥2 chars, doctorName required, appointmentDate required + not in past, appointmentTime required + 24h regex, reason required + ≥5 chars, phone regex if provided.

12. **Q:** Is the appointment date validated on both create and edit?  
    **Expected:** Yes. `validateAppointment()` is called on both `POST /` (create) and `PUT /:id/booking` (edit).

### Testing
13. **Q:** How do you run the tests? What do they cover?  
    **Expected:** `npm test` runs `node test.js`. Covers: DB connectivity, login hash verification, CRUD operations, filter accuracy, status transitions, security constraints (block edit after completed), and cleanup.

14. **Q:** Your tests call the service layer directly. What does this mean for testing the middleware?  
    **Expected:** The auth middleware and role enforcement are not tested automatically. Those are only verified manually or via DevTools/Postman. A production system would need HTTP-level tests using supertest or similar.

15. **Q:** How do tests clean up after themselves?  
    **Expected:** Test data uses a `TEST-` prefix. Pre-cleanup deletes any lingering `TEST-` records. Post-cleanup deletes again and verifies `affectedRows > 0`.

### Design Decisions
16. **Q:** Why did you use SHA-256 instead of bcrypt?  
    **Expected:** SHA-256 is simpler and built into Node.js (`crypto`). For a workshop prototype, it's acceptable. Bcrypt would be needed in production for its salt and work factor.

17. **Q:** Why is the frontend a single 755-line file? How would you improve this?  
    **Expected:** Workshop time constraints. Would decompose into `LoginForm`, `AppointmentTable`, `BookingForm`, `NoteEditor`, `FilterBar` components for better maintainability.

18. **Q:** What would you add to make this production-ready?  
    **Expected:** JWT tokens, bcrypt hashing, CORS restriction, rate limiting, Helmet headers, HTTPS, component decomposition, proper test framework (Jest), frontend tests, double-booking detection, session expiry.
