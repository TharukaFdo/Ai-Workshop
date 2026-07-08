# Mid-Project Review: Clinic Appointment System

> **Review Date:** 2026-06-05  
> **Review Stage:** After secondary feature (filtering), before testing / security hardening / maintainability cleanup  
> **Reviewer:** Automated code review  
> **Project Path:** `p3/`

---

## 1. Mid-Review Summary

The Clinic Appointment System is a React + Express + MySQL prototype with two roles (Receptionist, Doctor) managing a single `appointments` table. The project has completed through the secondary feature stage (filter by doctor, date, status) and is in a **substantially functional state**. Key strengths include a database-backed login flow with SHA-256 hashed passwords, backend role enforcement via middleware that queries the database (not trusting client-sent roles), and a clean separation between frontend and backend. Key weaknesses include visit notes being visible to Receptionists in the UI table, the `App.css` file containing leftover Vite boilerplate, no `.gitignore` at the project root covering the backend `.env`, the API base URL being hardcoded, and the mock token being the raw username rather than a cryptographic token.

Overall, the project is ahead of a typical mid-project checkpoint: it already has a database-backed login (not just a role selector), backend middleware that re-verifies the user's role from the database on every request, and proper SQL parameterisation throughout. These are characteristics often found only after a security hardening stage.

---

## 2. Review Scoring Matrix

| Feature / Area | Functionality 0-5 | Data Persistence 0-5 | Backend Security / Role Control 0-5 | Validation / Error Handling 0-5 | Testing Evidence 0-5 | Maintainability 0-5 | UI / Manual Usability 0-5 | Evidence | Notes |
|---|---:|---:|---:|---:|---:|---:|---:|---|---|
| Project setup and run commands | 4 | N/A | N/A | N/A | 0 | 3 | N/A | [package.json](file:///h:/docs/Demo/Ai-Workshop/1%20Clinic%20Appointment%20System/p3/package.json), [README.md](file:///h:/docs/Demo/Ai-Workshop/1%20Clinic%20Appointment%20System/p3/README.md) | Root package.json has `install:all`, `dev:backend`, `dev:frontend`, `db:setup`, `db:reset`. README documents setup steps. No root `.gitignore`; backend `.env` with empty password committed. |
| Database setup and starter data | 4 | 5 | N/A | 3 | 0 | 4 | N/A | [setupDb.js](file:///h:/docs/Demo/Ai-Workshop/1%20Clinic%20Appointment%20System/p3/backend/config/setupDb.js), [resetDb.js](file:///h:/docs/Demo/Ai-Workshop/1%20Clinic%20Appointment%20System/p3/backend/config/resetDb.js), [schema.sql](file:///h:/docs/Demo/Ai-Workshop/1%20Clinic%20Appointment%20System/p3/backend/config/schema.sql) | Both `db:setup` (idempotent) and `db:reset` (destructive) scripts exist. Seeds 3 users and 2 demo appointments. Schema has `app_users` + `appointments` tables. `schema.sql` also provided as reference. Error handling prints to console and exits with code 1. |
| Login workflow | 4 | 5 | 4 | 3 | 0 | 3 | 4 | [routes/auth.js](file:///h:/docs/Demo/Ai-Workshop/1%20Clinic%20Appointment%20System/p3/backend/routes/auth.js), [App.jsx L92-118](file:///h:/docs/Demo/Ai-Workshop/1%20Clinic%20Appointment%20System/p3/frontend/src/App.jsx#L92-L118) | Database-backed login with SHA-256 password hashing. Frontend shows login form with demo credentials. Token is the raw username (not cryptographically secure but acceptable for workshop). No session expiry, no JWT. |
| Role-based access | 4 | N/A | 4 | 3 | 0 | 4 | 4 | [middleware/auth.js](file:///h:/docs/Demo/Ai-Workshop/1%20Clinic%20Appointment%20System/p3/backend/middleware/auth.js), [routes/appointments.js](file:///h:/docs/Demo/Ai-Workshop/1%20Clinic%20Appointment%20System/p3/backend/routes/appointments.js) | Auth middleware looks up user in DB, assigns `req.user` from DB (does not trust headers for role). Each route passes `requiredRole` to middleware. Doctor GET auto-filters to own `doctorName`. UI conditionally shows/hides controls per role. |
| Main create action | 5 | 5 | 4 | 4 | 0 | 4 | 4 | [routes/appointments.js L68-89](file:///h:/docs/Demo/Ai-Workshop/1%20Clinic%20Appointment%20System/p3/backend/routes/appointments.js#L68-L89), [appointmentService.js L43-60](file:///h:/docs/Demo/Ai-Workshop/1%20Clinic%20Appointment%20System/p3/backend/services/appointmentService.js#L43-L60), [App.jsx L128-159](file:///h:/docs/Demo/Ai-Workshop/1%20Clinic%20Appointment%20System/p3/frontend/src/App.jsx#L128-L159) | Receptionist-only POST with validation (name ≥2 chars, reason ≥5 chars, phone regex, date not in past, time 24h format). Persists to MySQL via parameterised query. Form resets on success. |
| Main view/list action | 4 | 5 | 4 | 3 | 0 | 4 | 4 | [routes/appointments.js L52-65](file:///h:/docs/Demo/Ai-Workshop/1%20Clinic%20Appointment%20System/p3/backend/routes/appointments.js#L52-L65), [appointmentService.js L6-30](file:///h:/docs/Demo/Ai-Workshop/1%20Clinic%20Appointment%20System/p3/backend/services/appointmentService.js#L6-L30), [App.jsx L464-547](file:///h:/docs/Demo/Ai-Workshop/1%20Clinic%20Appointment%20System/p3/frontend/src/App.jsx#L464-L547) | Both roles can view; Doctor is auto-scoped to their own `doctorName` in backend. Sorted chronologically. Table renders patient details, date/time, reason, status badge, visit notes, actions. Visit notes column is visible to both roles (privacy gap). |
| Main update/status/cancel action | 4 | 5 | 4 | 3 | 0 | 4 | 4 | [routes/appointments.js L91-151](file:///h:/docs/Demo/Ai-Workshop/1%20Clinic%20Appointment%20System/p3/backend/routes/appointments.js#L91-L151), [App.jsx L162-208](file:///h:/docs/Demo/Ai-Workshop/1%20Clinic%20Appointment%20System/p3/frontend/src/App.jsx#L162-L208) | Edit booking (Receptionist, `PUT /:id/booking`) only on `booked` appointments. Cancel (`PUT /:id/cancel`) only on `booked` status. Doctor notes (`PUT /:id/notes`) rejects cancelled appointments. Confirmation dialog before cancel. Status transitions are enforced in SQL WHERE clauses. |
| Protected action | 3 | 5 | 4 | 3 | 0 | 3 | 3 | [routes/appointments.js L120-137](file:///h:/docs/Demo/Ai-Workshop/1%20Clinic%20Appointment%20System/p3/backend/routes/appointments.js#L120-L137), [App.jsx L500-533](file:///h:/docs/Demo/Ai-Workshop/1%20Clinic%20Appointment%20System/p3/frontend/src/App.jsx#L500-L533) | Visit notes editing is Doctor-only in backend (`authMiddleware('Doctor')`). UI hides the "Add/Edit Notes" button for Receptionist. **However**, visit note text is displayed in the table to both roles (line 503), violating the requirement that Receptionists cannot view visit notes. Backend GET returns `visitNote` field to all authenticated users. |
| Secondary feature | 4 | N/A | 3 | 3 | 0 | 4 | 4 | [App.jsx L416-446](file:///h:/docs/Demo/Ai-Workshop/1%20Clinic%20Appointment%20System/p3/frontend/src/App.jsx#L416-L446), [routes/appointments.js L53-61](file:///h:/docs/Demo/Ai-Workshop/1%20Clinic%20Appointment%20System/p3/backend/routes/appointments.js#L53-L61) | Filter by doctor (Receptionist only, hidden for Doctor since auto-scoped), date, and status. Filters passed as query params to backend. Backend builds dynamic WHERE clauses with parameterised queries. Filters refresh on change via `useEffect`. No "Clear filters" button. |
| Case-specific: appointment date/time and doctor assignment | 4 | 5 | 4 | 4 | 0 | 4 | 4 | [routes/appointments.js L7-50](file:///h:/docs/Demo/Ai-Workshop/1%20Clinic%20Appointment%20System/p3/backend/routes/appointments.js#L7-L50), [App.jsx L354-383](file:///h:/docs/Demo/Ai-Workshop/1%20Clinic%20Appointment%20System/p3/frontend/src/App.jsx#L354-L383) | Date/time validated: date cannot be past, time must be 24h format. Doctor assigned from hardcoded dropdown list. Both create and edit forms provide date picker and time picker. No double-booking detection (acknowledged risk in PROJECT_CONTEXT). Doctor list is hardcoded in both frontend and seed data. |
| Case-specific: appointment status and cancellation flow | 4 | 5 | 4 | 3 | 0 | 4 | 4 | [appointmentService.js L102-110](file:///h:/docs/Demo/Ai-Workshop/1%20Clinic%20Appointment%20System/p3/backend/services/appointmentService.js#L102-L110), [App.jsx L188-208](file:///h:/docs/Demo/Ai-Workshop/1%20Clinic%20Appointment%20System/p3/frontend/src/App.jsx#L188-L208) | Cancellation only on `booked` status (SQL WHERE `status = 'booked'`). Status is an ENUM with `booked`, `completed`, `cancelled`. Confirmation dialog shown. Cancel button hidden for non-booked. Missing: `Checked In` status from PROJECT_CONTEXT workflow is not implemented. |
| Case-specific: visit note privacy and doctor-only editing | 3 | 5 | 4 | 3 | 0 | 3 | 2 | [App.jsx L502-504](file:///h:/docs/Demo/Ai-Workshop/1%20Clinic%20Appointment%20System/p3/frontend/src/App.jsx#L502-L504), [middleware/auth.js](file:///h:/docs/Demo/Ai-Workshop/1%20Clinic%20Appointment%20System/p3/backend/middleware/auth.js) | **Write protection**: Backend enforces Doctor-only write on `PUT /:id/notes`. **Read protection gap**: Backend GET returns `visitNote` to all roles; frontend table shows visit notes column to Receptionists. REQUIREMENTS.md specifies "UI hides notes, backend rejects write" — write is enforced, read is not hidden in UI or filtered in API. |
| UI/manual usability | N/A | N/A | N/A | N/A | 0 | 3 | 4 | [index.css](file:///h:/docs/Demo/Ai-Workshop/1%20Clinic%20Appointment%20System/p3/frontend/src/index.css), [App.jsx](file:///h:/docs/Demo/Ai-Workshop/1%20Clinic%20Appointment%20System/p3/frontend/src/App.jsx) | Dark-themed glassmorphism design. Status badges color-coded. Toast notifications for feedback. Modal dialogs for edit/notes. Responsive grid layout. Loading/error/empty states handled. `App.css` is Vite boilerplate (not imported). `<title>` still says "frontend". |
| Security posture | N/A | N/A | 3 | 3 | 0 | 3 | N/A | [middleware/auth.js](file:///h:/docs/Demo/Ai-Workshop/1%20Clinic%20Appointment%20System/p3/backend/middleware/auth.js), [backend/.env](file:///h:/docs/Demo/Ai-Workshop/1%20Clinic%20Appointment%20System/p3/backend/.env) | Role looked up from DB per request (good). Parameterised SQL throughout (good). SHA-256 hashing (not bcrypt, but acceptable for workshop). Token is raw username (not cryptographic). CORS set to `*` (all origins). `.env` committed with empty password. No rate limiting. No helmet. No HTTPS enforcement. |
| Testing evidence | N/A | N/A | N/A | N/A | 0 | 0 | N/A | No test files found | Zero test files. No test framework installed. No test scripts in package.json. No Cypress/Playwright/Jest/Vitest setup. Expected for pre-testing stage. |
| Maintainability | N/A | N/A | N/A | N/A | N/A | 2 | N/A | [App.jsx](file:///h:/docs/Demo/Ai-Workshop/1%20Clinic%20Appointment%20System/p3/frontend/src/App.jsx) (681 lines) | Entire frontend is a single 681-line `App.jsx` (no component decomposition). Backend has good separation (routes/services/middleware/config). `App.css` is unused Vite boilerplate. Inline styles throughout App.jsx. No ESLint config in backend. No `.env` gitignore at root. Doctor list hardcoded in two places (frontend + seed). |

---

## 3. Current Feature Status

| Feature | Status | Evidence |
|---|---|---|
| Appointment creation (Receptionist) | ✅ Implemented | `POST /api/appointments` with validation, Receptionist-only middleware |
| Appointment list/view (Both roles) | ✅ Implemented | `GET /api/appointments` with dynamic filters, doctor auto-scoping |
| Appointment update/edit (Receptionist) | ✅ Implemented | `PUT /api/appointments/:id/booking`, only `booked` status editable |
| Appointment cancellation (Receptionist) | ✅ Implemented | `PUT /api/appointments/:id/cancel`, confirmation dialog, `booked` → `cancelled` |
| Visit notes add/edit (Doctor) | ✅ Implemented (write) | `PUT /api/appointments/:id/notes`, Doctor-only backend enforcement |
| Visit note viewing | ⚠️ Privacy gap | Notes visible to Receptionist in table (violates requirement) |
| Filter by doctor | ✅ Implemented | Query param + backend WHERE clause; hidden for Doctor (auto-scoped) |
| Filter by date | ✅ Implemented | Date picker + `appointmentDate` query param |
| Filter by status | ✅ Implemented | Dropdown + `status` query param |
| Status badges | ✅ Implemented | `badge-booked`, `badge-completed`, `badge-cancelled` CSS classes |
| `Checked In` status | ❌ Not implemented | PROJECT_CONTEXT mentions it, but ENUM only has `booked/completed/cancelled` |

---

## 4. Database and Persistence Status

| Check | Result | Details |
|---|---|---|
| MySQL connection via env vars | ✅ Pass | `db.js` uses `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME` from `process.env` |
| `appointments` table exists | ✅ Pass | Created in both `setupDb.js` and `resetDb.js` with all required columns |
| `app_users` table exists | ✅ Pass | Includes `id`, `username`, `password_hash`, `role`, `doctor_name` |
| Schema matches entity spec | ✅ Pass | All fields from PROJECT_CONTEXT present: `patientName`, `patientPhone`, `doctorName`, `appointmentDate`, `appointmentTime`, `reason`, `status`, `visitNote`, `createdAt`, `updatedAt` |
| Seed data provided | ✅ Pass | 3 users (`receptionist1`, `dr_smith`, `dr_jones`) + 2 demo appointments |
| Repeatable setup command | ✅ Pass | `npm run db:setup` (idempotent) and `npm run db:reset` (destructive + re-seed) |
| SQL injection protection | ✅ Pass | All queries use parameterised placeholders (`?`) |
| Frontend direct DB access | ✅ No violation | No `mysql`, `DB_*`, or `process.env` references in frontend source |
| `.env.example` provided | ✅ Pass | Backend has `.env.example` with placeholder values |
| `.env` committed | ⚠️ Risk | Backend `.env` is in the working directory with empty `DB_PASSWORD`; no root `.gitignore` excluding it |

---

## 5. Login and Role/Access Status

| Check | Result | Details |
|---|---|---|
| Login type | Database-backed | Username + SHA-256 password verified against `app_users` table |
| Login endpoint | `POST /api/auth/login` | Returns `{ username, role, doctorName, token }` |
| Token mechanism | Username as Bearer token | Not cryptographic, but middleware re-verifies from DB per request |
| Role verification in middleware | ✅ Backend-enforced | `auth.js` queries DB for role; does not trust client-sent `X-Role` headers |
| POST create appointment | Receptionist-only | `authMiddleware('Receptionist')` on route |
| PUT update booking | Receptionist-only | `authMiddleware('Receptionist')` on route |
| PUT cancel appointment | Receptionist-only | `authMiddleware('Receptionist')` on route |
| PUT update notes | Doctor-only | `authMiddleware('Doctor')` on route |
| GET appointments | Both roles | `authMiddleware()` (no required role); Doctor auto-filtered by `doctorName` |
| UI role conditioning | ✅ Present | Create form, Edit/Cancel buttons hidden for Doctor; Notes button hidden for Receptionist |
| Doctor sees only own appointments | ✅ Backend-enforced | `routes/appointments.js` L56: Doctor's `doctorName` is set from `req.user`, not from query param |

---

## 6. Protected Action Status

### Visit Notes (Protected Action)

| Aspect | Status | Evidence |
|---|---|---|
| Backend write protection | ✅ Enforced | `PUT /:id/notes` uses `authMiddleware('Doctor')` — returns 403 for non-Doctor |
| Backend read filtering | ❌ Not filtered | `GET /api/appointments` returns `visitNote` field to all roles |
| Frontend write protection | ✅ Button hidden | "Add/Edit Notes" button only shown when `currentUser.role === 'Doctor'` |
| Frontend read protection | ❌ Not hidden | Visit Notes column shown to Receptionist (`{appointment.visitNote \|\| '—'}` at L503) |
| Cancelled appointment guard | ✅ Enforced | SQL `WHERE status != 'cancelled'` prevents note edits on cancelled appointments |

**Gap**: Receptionists can see visit note text in the table. REQUIREMENTS.md (F-REQ-5) states: *"UI hides notes, backend rejects write with 403 Forbidden"*. The UI does not hide the notes column/content for Receptionist.

---

## 7. Validation Status

| Validation Rule | Backend | Frontend | Notes |
|---|---|---|---|
| `patientName` required, ≥2 chars | ✅ | ✅ (HTML `required`) | Backend checks `trim().length < 2` |
| `doctorName` required | ✅ | ✅ (dropdown) | Dropdown pre-selects valid doctor; backend checks presence |
| `doctorName` must match predefined list | ❌ | ✅ (dropdown limits) | Backend does not validate against an allowed doctor list |
| `appointmentDate` required, not in past | ✅ | ✅ (HTML `required`) | Backend creates `Date` object and compares to today |
| `appointmentTime` required, 24h format | ✅ | ✅ (HTML `type="time"`) | Backend regex: `/^([01]\d\|2[0-3]):([0-5]\d)(:([0-5]\d))?$/` |
| `reason` required, ≥5 chars | ✅ | ✅ (HTML `required`) | Backend checks `trim().length < 5` |
| `patientPhone` format if provided | ✅ | Partial | Backend regex: `/^[+\d\s-]+$/`; frontend uses `type="text"` (no pattern) |
| `visitNote` only writable by Doctor | ✅ | ✅ | Backend middleware + UI button visibility |
| `status` must be valid value | ✅ | ✅ | Backend checks `['completed', 'booked'].includes(status)` on notes route; ENUM in DB |
| State transition: no edit after completed | ✅ | ✅ | SQL `WHERE status = 'booked'` on booking update; UI hides edit button for non-booked |
| State transition: no notes on cancelled | ✅ | ✅ | SQL `WHERE status != 'cancelled'`; UI hides notes button for cancelled |
| Past date validation on edit | ✅ | Not enforced in browser | `validateAppointment` runs on PUT as well, so backend catches it |
| Validation returns specific field errors | ⚠️ Partial | N/A | Returns single string message, not an array of field-level errors per REQUIREMENTS spec |

---

## 8. Stage Drift or Early Implementation

| Future Stage | Implemented Early? | Evidence | Assessment |
|---|---|---|---|
| Database-backed login (typically Stage 8+) | ✅ Yes | `POST /api/auth/login` with SHA-256 password hash against `app_users` table | **Beneficial drift** — stronger than the typical role-switcher prototype. Aligns with REQUIREMENTS.md spec. |
| Backend role middleware (typically security hardening) | ✅ Yes | `authMiddleware()` re-queries DB per request, does not trust client headers | **Beneficial drift** — provides backend enforcement from the start. |
| Password hashing | ✅ Yes | SHA-256 hash in `setupDb.js` and `resetDb.js` | Acceptable for workshop; not bcrypt, but functional. |
| Testing framework | ❌ Not yet | No test files, no test dependencies | Expected — testing is a future stage. |
| Rate limiting / Helmet / CORS hardening | ❌ Not yet | CORS is `*`, no helmet, no rate limiting | Expected — security hardening is a future stage. |
| Component decomposition | ❌ Not yet | Single 681-line App.jsx | Expected — maintainability cleanup is a future stage. |

**Assessment**: The project has **positive** stage drift. Implementing database-backed login and backend role enforcement early is structurally sound and avoids the risky pattern of bolting on security later. No harmful premature optimisation or over-engineering was observed.

---

## 9. Issues Found Before Stage 8

### Critical Issues

| # | Issue | Severity | Location | Description |
|---|---|---|---|---|
| C-1 | Visit notes visible to Receptionist | Critical | [App.jsx L502-504](file:///h:/docs/Demo/Ai-Workshop/1%20Clinic%20Appointment%20System/p3/frontend/src/App.jsx#L502-L504) | The table shows `appointment.visitNote` to all roles. REQUIREMENTS F-REQ-5 states Receptionist should not view visit notes. Both UI and backend GET should filter this. |
| C-2 | Backend GET returns `visitNote` to all roles | Critical | [appointmentService.js L7](file:///h:/docs/Demo/Ai-Workshop/1%20Clinic%20Appointment%20System/p3/backend/services/appointmentService.js#L7) | `SELECT *` returns all fields including `visitNote` regardless of requesting user's role. |

### Important Issues

| # | Issue | Severity | Location | Description |
|---|---|---|---|---|
| I-1 | `.env` committed with credentials | Important | [backend/.env](file:///h:/docs/Demo/Ai-Workshop/1%20Clinic%20Appointment%20System/p3/backend/.env) | Real `.env` is in working directory. No root `.gitignore` excludes `backend/.env`. Password is empty but structure leaks config. |
| I-2 | Token is raw username | Important | [routes/auth.js L38](file:///h:/docs/Demo/Ai-Workshop/1%20Clinic%20Appointment%20System/p3/backend/routes/auth.js#L38) | `token: user.username` — anyone who knows a valid username can forge a bearer token. Mitigated by workshop scope. |
| I-3 | `doctorName` not validated against allowed list | Important | [routes/appointments.js L7-50](file:///h:/docs/Demo/Ai-Workshop/1%20Clinic%20Appointment%20System/p3/backend/routes/appointments.js#L7-L50) | `validateAppointment()` checks presence but not that `doctorName` matches a predefined set. A client could POST a non-existent doctor name. |
| I-4 | CORS allows all origins | Important | [server.js L8](file:///h:/docs/Demo/Ai-Workshop/1%20Clinic%20Appointment%20System/p3/backend/server.js#L8) | `app.use(cors())` — accepts requests from any origin. Expected for dev but needs tightening. |
| I-5 | `Checked In` status missing | Important | [schema.sql L25](file:///h:/docs/Demo/Ai-Workshop/1%20Clinic%20Appointment%20System/p3/backend/config/schema.sql#L25) | PROJECT_CONTEXT describes a `Checked In` workflow step, but ENUM is `booked/completed/cancelled`. The REQUIREMENTS spec also only lists three statuses, so this may be intentional simplification. |

### Minor Issues

| # | Issue | Severity | Location | Description |
|---|---|---|---|---|
| M-1 | HTML title is "frontend" | Minor | [index.html L7](file:///h:/docs/Demo/Ai-Workshop/1%20Clinic%20Appointment%20System/p3/frontend/index.html#L7) | `<title>frontend</title>` — should be "Clinic Appointment System" |
| M-2 | `App.css` is unused Vite boilerplate | Minor | [App.css](file:///h:/docs/Demo/Ai-Workshop/1%20Clinic%20Appointment%20System/p3/frontend/src/App.css) | 185 lines of boilerplate CSS not imported anywhere. Should be deleted. |
| M-3 | API base URL hardcoded | Minor | [App.jsx L4](file:///h:/docs/Demo/Ai-Workshop/1%20Clinic%20Appointment%20System/p3/frontend/src/App.jsx#L4) | `const API_BASE_URL = 'http://localhost:5000/api'` — should use Vite env var for flexibility. |
| M-4 | Doctor list duplicated | Minor | [App.jsx L6](file:///h:/docs/Demo/Ai-Workshop/1%20Clinic%20Appointment%20System/p3/frontend/src/App.jsx#L6), [setupDb.js L67](file:///h:/docs/Demo/Ai-Workshop/1%20Clinic%20Appointment%20System/p3/backend/config/setupDb.js#L67) | `CLINIC_DOCTORS` array in frontend and seed SQL must be kept in sync manually. Consider fetching from backend. |
| M-5 | Single 681-line component | Minor | [App.jsx](file:///h:/docs/Demo/Ai-Workshop/1%20Clinic%20Appointment%20System/p3/frontend/src/App.jsx) | All UI logic in one file. Should be decomposed into `LoginForm`, `AppointmentTable`, `BookingForm`, `NoteEditor`, `FilterBar` components. |
| M-6 | Validation returns single string, not array | Minor | [routes/appointments.js L11](file:///h:/docs/Demo/Ai-Workshop/1%20Clinic%20Appointment%20System/p3/backend/routes/appointments.js#L11) | REQUIREMENTS specify `400 Bad Request` with "array of specific field validation errors". Current implementation returns first error only. |
| M-7 | No error boundary in React | Minor | [App.jsx](file:///h:/docs/Demo/Ai-Workshop/1%20Clinic%20Appointment%20System/p3/frontend/src/App.jsx) | No React error boundary to catch rendering errors. |
| M-8 | `useEffect` dependency warning | Minor | [App.jsx L88-90](file:///h:/docs/Demo/Ai-Workshop/1%20Clinic%20Appointment%20System/p3/frontend/src/App.jsx#L88-L90) | `fetchAppointments` used in `useEffect` without being in the dependency array or wrapped in `useCallback`. |
| M-9 | No Vite proxy configured | Minor | [vite.config.js](file:///h:/docs/Demo/Ai-Workshop/1%20Clinic%20Appointment%20System/p3/frontend/vite.config.js) | No API proxy in Vite config; relies on CORS for dev. A `/api` proxy would be cleaner. |
| M-10 | No meta description | Minor | [index.html](file:///h:/docs/Demo/Ai-Workshop/1%20Clinic%20Appointment%20System/p3/frontend/index.html) | Missing `<meta name="description">` tag. |

---

## 10. Manual Checks Recommended Next

| # | Check | Priority | How to Verify |
|---|---|---|---|
| 1 | App starts without errors | High | Run `npm run db:setup`, `npm run dev:backend`, `npm run dev:frontend`; confirm no console errors |
| 2 | Login with each demo account | High | Test `receptionist1`, `dr_smith`, `dr_jones` with password `password123` |
| 3 | Login with wrong password | High | Submit incorrect password; confirm 401 response and error display |
| 4 | Create appointment as Receptionist | High | Fill all fields; verify appointment appears in table and MySQL |
| 5 | Edit appointment as Receptionist | High | Click Edit on `booked` appointment; modify date; verify change persists |
| 6 | Cancel appointment as Receptionist | High | Cancel a `booked` appointment; confirm status changes to `cancelled` |
| 7 | Add visit note as Doctor | High | Log in as `dr_smith`; add note to a `booked` appointment; verify note saved |
| 8 | Complete appointment as Doctor | High | Set status to `completed` while saving notes; verify badge updates |
| 9 | Verify Receptionist cannot add notes via API | High | Use browser DevTools / curl to `PUT /api/appointments/1/notes` with receptionist token; expect 403 |
| 10 | Verify Doctor cannot create appointment via API | High | `POST /api/appointments` with `dr_smith` token; expect 403 |
| 11 | Filter by doctor | Medium | As Receptionist, filter by `Dr. Smith`; confirm only Dr. Smith's appointments shown |
| 12 | Filter by date | Medium | Set date filter; confirm only matching date appointments shown |
| 13 | Filter by status | Medium | Filter by `cancelled`; confirm only cancelled appointments shown |
| 14 | Doctor sees only own appointments | Medium | Log in as `dr_smith`; confirm no `dr_jones` appointments visible |
| 15 | Verify visit note visibility to Receptionist | Medium | Log in as `receptionist1`; check if visit notes text appears in table (current: it does — bug) |
| 16 | Validation: submit empty form | Medium | Try creating appointment with empty fields; verify error shown |
| 17 | Validation: past date | Medium | Enter a past date; verify backend rejects with 400 |
| 18 | Responsive layout | Low | Resize browser; verify sidebar collapses and table scrolls |

---

## 11. Pass/Fail Table

| # | Check | Result | Notes |
|---|---:|---|---|
| 1 | App appears runnable | ✅ PASS | Package scripts, dependencies, and server entry points all present. `node_modules` exist in both frontend and backend. |
| 2 | React frontend and Express backend separated | ✅ PASS | `frontend/` (Vite + React) and `backend/` (Express) are independent directories with separate `package.json` files. |
| 3 | React calls Express routes, never connects to MySQL directly | ✅ PASS | Frontend uses `fetch()` to `http://localhost:5000/api/*`. No `mysql`, `DB_*`, or `process.env` in frontend source. |
| 4 | Backend uses DB_HOST, DB_PORT, DB_USER, DB_PASSWORD, DB_NAME; no secrets in React | ✅ PASS | `db.js` reads all five env vars. `.env.example` provided. No secrets in frontend. |
| 5 | Needed database tables exist (including users/login table) | ✅ PASS | `app_users` (with password hash) and `appointments` tables defined in schema and setup scripts. |
| 6 | Repeatable database setup or seed command exists | ✅ PASS | `npm run db:setup` (idempotent) and `npm run db:reset` (drop + recreate + seed). |
| 7 | Login is database-backed | ✅ PASS | `POST /api/auth/login` verifies SHA-256 hash against `app_users.password_hash`. Not mock-only or role-selector-only. |
| 8 | Role restrictions enforced in backend, not only UI | ✅ PASS | `authMiddleware(requiredRole)` queries DB for user, checks `req.user.role` server-side. Each mutating route specifies required role. |
| 9 | Visit notes write appears protected | ✅ PASS | `PUT /:id/notes` requires `authMiddleware('Doctor')`. |
| 10 | Visit notes read appears protected | ❌ FAIL | Backend `SELECT *` returns `visitNote` to all roles. Frontend shows notes column to Receptionist. |
| 11 | Users limited to own allowed records | ✅ PASS | Doctor's GET auto-scopes via `req.user.doctorName`. Receptionist sees all (as expected). |
| 12 | Appointment CRUD workflow implemented | ✅ PASS | Create, view, update, cancel all functional with role guards and status checks. |
| 13 | Filter by doctor, date, status implemented | ✅ PASS | Three filter controls present with backend query param handling. |
| 14 | Validation present | ✅ PASS | Backend `validateAppointment()` checks required fields, lengths, date, time format, phone format. |
| 15 | AI implemented future stages early | ⚠️ NOTE | Database-backed login and backend role middleware implemented early (positive drift — structurally beneficial). |
| 16 | Missing before testing / security hardening / maintainability | ⚠️ NOTE | See sections 9 and 10. Key items: visit note privacy fix, component decomposition, test framework setup, CORS tightening, `.gitignore` for `.env`. |
