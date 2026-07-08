# Final Review — Clinic Appointment System

**Review date:** 2026-06-05  
**Stage reviewed:** Final — after testing, security hardening, maintainability cleanup, and Stage 11 change request.  
**Reviewer:** Automated structured review (read-only pass)  
**Scope:** Case — Receptionist + Doctor roles · Appointment as main entity · visit notes as protected action.  
**Test run status:** ⭐ ALL 6 AUTOMATED TESTS PASSED (evidence captured live during this review)

---

## 1. Final Feature Summary

The Clinic Appointment System is a **fully working prototype** comprising a React 19 / Vite frontend (port 5173) and an Express 4 / Node.js backend (port 5000), backed by a MySQL database. The two processes are completely separated. Every write route is guarded by an `authenticateUser` middleware and a role check. The visit-note protected action is guarded by both role and SQL-level doctor ownership.

| Feature | Status | Evidence |
|---|:---:|---|
| DB-backed login (receptionist + 3 doctors) | ✅ Complete | `POST /api/login` queries `users` table; test confirmed |
| Logout / session clear | ✅ Complete | `localStorage.removeItem('clinic_user')` |
| Create appointment (receptionist only) | ✅ Complete | `POST /api/appointments`; receptionist-only role check |
| List appointments (role-scoped) | ✅ Complete | `GET /api/appointments`; doctor sees own only via SQL WHERE |
| Edit appointment details (Pending only) | ✅ Complete | `PUT /api/appointments/:id`; locks Confirmed/Completed/Cancelled |
| Cancel appointment (Pending/Rejected only) | ✅ Complete | PUT with status:Cancelled; UI and backend both block locked statuses |
| Doctor accept/reject Pending appointment | ✅ Complete | `PUT /api/appointments/:id/status`; doctor-only + ownership check |
| Double-booking conflict detection | ✅ Complete | 409 returned when confirming same doctor/date/time slot; test confirmed |
| Add/edit visit note → auto-Completed | ✅ Complete | `PUT /api/appointments/:id/notes`; doctor-only + ownership + status guard |
| Block notes on Pending appointments | ✅ Complete | Server returns 400; test confirmed |
| Edit lock on Completed/Confirmed/Cancelled | ✅ Complete | Server returns 400; test confirmed |
| Filter by doctor / status / date | ✅ Complete | Client-side composite filters; both roles |
| Past-date booking prevention | ✅ Complete | Backend + frontend both enforce |
| Phone number format validation | ✅ Complete | Regex `/^[0-9+\-\s()]{7,15}$/` in backend and frontend |
| Automated integration test suite | ✅ Complete | `npm test` — 6 test groups, all pass, DB cleaned up after |

**Comparison with Mid Review:** At the mid review, zero tests existed, no past-date guard was in the backend, no double-booking check existed, the edit PUT had no status lock, and the notes endpoint had no status guard. All of these gaps were resolved by the final stage.

---

## 2. Review Scoring Matrix

> Score meaning: 0 = missing · 1 = present but mostly not working · 2 = partially working with major gaps · 3 = mostly working with important gaps · 4 = working with minor gaps · 5 = complete for the selected case scope

| Feature / Area | Functionality 0-5 | Data Persistence 0-5 | Backend Security / Role Control 0-5 | Validation / Error Handling 0-5 | Testing Evidence 0-5 | Maintainability 0-5 | UI / Manual Usability 0-5 | Evidence | Notes |
|---|---:|---:|---:|---:|---:|---:|---:|---|---|
| Project setup and run commands | 5 | — | — | — | 4 | 3 | — | `backend/package.json`: `start`, `dev`, `db:seed`, `test`. `frontend/package.json`: `dev`. Both servers start independently. | No root-level combined runner. Backend URL hardcoded as `http://localhost:5000` in `App.jsx`. No root `.gitignore`. |
| Database setup and starter data | 5 | 5 | — | 4 | 5 | 3 | — | `npm run db:seed` drops and recreates both tables; seeds 4 appointments and 4 users. `schema.sql` exists as reference. Test suite runs against live DB and cleans up test rows. | `DROP TABLE IF EXISTS` is destructive — not a migration. `schema.sql` and `dbInit.js` both define schema independently (duplication risk). No incremental migration. |
| Login workflow | 5 | 5 | 3 | 4 | 4 | 3 | 5 | `POST /api/login` queries `users` table by `username + password`. Session in `localStorage`. Error banner shown on bad credentials. Test 2 confirms rejection of wrong password (401) and success for both roles. | Passwords stored and compared in **plaintext** — no bcrypt. Auth token is raw `username` string (trivially spoofable). No session expiry. `localStorage` is XSS-accessible. |
| Role-based access | 5 | 5 | 4 | 4 | 4 | 3 | 5 | `authenticateUser` middleware re-queries DB on every call. Three write routes have explicit role checks. Doctor view is SQL-scoped. UI branches completely by role. Tests confirm receptionist books and doctor accepts. | Auth token is raw username — no cryptographic proof. No rate limiting on login. |
| Main create action | 5 | 5 | 5 | 4 | 4 | 3 | 4 | `POST /api/appointments` — receptionist-only (403 if doctor). 6 fields validated truthy. Past-date guard active. Phone regex enforced. Inserts with `status='Pending'`. Tested in Test 3. | Doctor list hardcoded in frontend select, not fetched from DB. `alert()` used for success. Whitespace-only strings pass `!field` check (no `.trim()`). |
| Main view/list action | 5 | 5 | 5 | 3 | 3 | 3 | 4 | `GET /api/appointments` — doctor SQL-scoped to own `doctor_name`. Receptionist sees all. Ordered ASC. Visit note visible read-only to receptionist. Tests verify confirmed status appears in full list. | No server-side pagination (all rows loaded). Filters are client-side only. Date display may show one day early in some locales due to UTC midnight parsing. |
| Main update/status/cancel action | 4 | 5 | 5 | 4 | 4 | 3 | 4 | Edit PUT locks Confirmed/Completed/Cancelled (400). Cancel is via PUT with `status:'Cancelled'`, restricted to Pending/Rejected in UI and backend. Doctor status update via separate `/status` endpoint. Test 6 confirms modification lock on Completed. | No dedicated cancel endpoint (semantic gap). Edit requires all 7 fields (no partial PATCH). |
| Protected action | 5 | 5 | 5 | 4 | 5 | 4 | 4 | `/notes` endpoint: middleware (401), role check (403), SQL ownership (403), status guard (400). Tests confirm blocked on Pending (400) and successful on Confirmed. Receptionist has no note input in UI or API access. | Empty string `""` passes `=== undefined` check. Saving note always auto-sets `Completed`. |
| Secondary feature | 5 | — | — | 3 | 3 | 3 | 4 | Filter by doctor (receptionist), status (both), date (both) — composite AND logic. All 3 controls present in both role views. | Filters are client-side only. Doctor filter uses hardcoded option list, not DB-driven. |
| Case-specific: appointment date/time and doctor assignment | 4 | 5 | 4 | 4 | 4 | 3 | 4 | `appointment_date DATE` and `appointment_time TIME` as separate typed columns. Past-date blocked at backend and frontend. Test 3 verifies date/time storage and retrieval. | Doctor stored as free-text `VARCHAR`, not FK to `users.id`. Date display may show UTC-offset date in some environments. |
| Case-specific: appointment status and cancellation flow | 4 | 5 | 5 | 4 | 5 | 3 | 4 | Status ENUM: Pending, Confirmed, Rejected, Completed, Cancelled. Double-booking blocks Confirmed conflicting slot (409). Edit locked once Confirmed/Completed/Cancelled. Tests cover Pending→Confirmed→Completed and conflict (409). | No audit trail of status changes. Receptionist can set any ENUM value via raw API call (edit modal limits to Pending/Cancelled, but server accepts any valid ENUM). |
| Case-specific: visit note privacy and doctor-only editing | 5 | 5 | 5 | 4 | 5 | 4 | 4 | Backend enforces role + SQL ownership on every note write. Status guard blocks Pending/Rejected/Cancelled server-side. Receptionist sees note read-only. Edit modal for receptionist has no `visit_note` field. Tests confirm block on Pending (400) and success on Confirmed. | Empty string passes `=== undefined` check. Saving note always auto-sets `Completed`. |
| UI / manual usability | 4 | — | — | — | 3 | 3 | 4 | CSS design tokens (Inter font, status colour pills, modal blur overlay, responsive grid at 1100 px). Demo credentials on login page. Role-aware dashboard. | `alert()` / `window.confirm()` used throughout — no toast system. No ARIA attributes. |
| Security posture | 3 | — | 3 | — | 3 | 2 | — | Role checks on all write routes. SQL ownership on note endpoint. `.env.example` provided. No secrets hardcoded in source files. | Plaintext passwords. Username-as-token. Wide-open CORS (`cors()` no options). No `helmet`. No rate limiting. Backend `.env` not gitignored. |
| Testing evidence | 5 | — | — | — | 5 | 4 | — | `npm test` — 6 test groups, 13 assertions. Covers health check, invalid login (401), both role logins, Pending booking, note-on-Pending block (400), doctor confirm, conflict (409), note save, status auto-complete, modification lock (400). All pass. Test data deleted in `finally` block. | Custom fetch-based runner (no Jest/Mocha). No frontend tests. No negative cross-role test. |
| Maintainability | 3 | — | — | — | — | 3 | — | Inline comments in `server.js`. CSS custom properties as design tokens. `dbInit.js` separate from server. `.env.example` documents all variables. ESLint configured for frontend. | `App.jsx` is 880 lines. `server.js` is 344 lines. No TypeScript. Backend URL hardcoded 7x. `schema.sql` and `dbInit.js` duplicate DDL. |

---

## 3. Project Structure and Run Commands

```
p1/
├── Case_Brief.md
├── MID_REVIEW.md
├── FINAL_REVIEW.md               ← this file
├── schema.sql                    ← DDL reference (not the active seed source)
│
├── backend/
│   ├── .env                      ← active credentials (NOT gitignored — risk)
│   ├── .env.example              ← safe template committed to repo
│   ├── dbInit.js                 ← database setup + seed script
│   ├── server.js                 ← Express API (344 lines, single file)
│   ├── test.js                   ← integration test suite (240 lines)
│   └── package.json
│
└── frontend/
    ├── index.html
    ├── vite.config.js
    ├── .gitignore                ← covers frontend only; no backend .env coverage
    └── src/
        ├── App.jsx               ← entire UI (880 lines, single component)
        ├── App.css               ← all styles (645 lines)
        ├── index.css
        └── main.jsx
```

### Run commands

| Action | Directory | Command |
|---|---|---|
| Start backend (production) | `backend/` | `npm start` |
| Start backend (dev, watch) | `backend/` | `npm run dev` |
| Re-seed database | `backend/` | `npm run db:seed` |
| Run automated tests | `backend/` | `npm test` |
| Start frontend (dev) | `frontend/` | `npm run dev` |

Both servers must run simultaneously. Frontend starts on **port 5173**, backend on **port 5000**.

---

## 4. Frontend / Backend Separation Check

| Check | Result |
|---|:---:|
| Frontend and backend are separate Node processes | ✅ Yes |
| Frontend is Vite/React (`frontend/`) — no Express code | ✅ Yes |
| Backend is Express/Node (`backend/`) — no React code | ✅ Yes |
| All React data fetching goes through `fetch('http://localhost:5000/api/...')` | ✅ Yes |
| `mysql2` package exists only in `backend/package.json` | ✅ Yes |
| No MySQL credentials or `.env` DB vars in frontend directory | ✅ Yes |
| Frontend React bundle never connects to MySQL directly | ✅ Yes — impossible by design |

React calls Express routes exclusively. The `mysql2` connection pool is created only in `backend/server.js` and `backend/dbInit.js`. The frontend `package.json` has no database dependency.

---

## 5. Database Setup and Table Summary

### Connection method

`server.js` uses `mysql.createPool(...)` from `mysql2`. `dbInit.js` uses `mysql.createConnection(...)` from `mysql2/promise`. Both read from environment variables via `dotenv`:

| Variable | Configured? | Default fallback |
|---|:---:|---|
| `DB_HOST` | ✅ Yes | `localhost` |
| `DB_PORT` | ✅ Yes | `3306` |
| `DB_USER` | ✅ Yes | `root` |
| `DB_PASSWORD` | ✅ Yes | `''` *(not printed)* |
| `DB_NAME` | ✅ Yes | `c1p1` |

No database password is printed in this review. The `.env.example` file confirms all five keys are documented.

### Tables

| Table | Purpose | Key columns |
|---|---|---|
| `users` | Login credentials and role store | `id`, `username`, `password` (plaintext VARCHAR), `role` ENUM(`receptionist`,`doctor`), `doctor_name` |
| `appointments` | Main entity | `id`, `patient_name`, `contact_number`, `doctor_name`, `appointment_date` DATE, `appointment_time` TIME, `reason`, `status` ENUM(5 values), `visit_note`, `created_at`, `updated_at` |

A **login / users table exists**. Confirmed in both `schema.sql` and `dbInit.js`.

### Re-creating tables and seed data

Run `npm run db:seed` from the `backend/` directory. This executes `node dbInit.js`, which:
1. Creates the database (`c1p1`) if absent.
2. Drops and recreates the `appointments` table.
3. Drops and recreates the `users` table.
4. Inserts 4 seed appointments (3 Pending, 1 Completed with a visit note).
5. Inserts 4 seed user accounts (1 receptionist, 3 doctors).

> **Warning:** `DROP TABLE IF EXISTS` on every run is destructive. All existing data is lost. This is a reset, not a migration.

### Seed accounts

| Username | Role | doctor_name |
|---|---|---|
| `receptionist` | receptionist | — |
| `dr_adams` | doctor | `Dr. Adams` |
| `dr_baker` | doctor | `Dr. Baker` |
| `dr_carter` | doctor | `Dr. Carter` |

All seed passwords are `password123` (stored in plaintext — see Security section).

---

## 6. Login and Role / Access Explanation

### Login flow

1. User submits username + password to `POST /api/login`.
2. Backend queries: `SELECT username, role, doctor_name FROM users WHERE username = ? AND password = ?`.
3. On match: returns `{ user: { username, role, doctor_name } }`.
4. Frontend stores this object in `localStorage` under key `clinic_user`.
5. Every subsequent API call sends `user.username` as the raw `Authorization` header value.
6. The `authenticateUser` middleware re-queries `SELECT ... FROM users WHERE username = ?` on **every** protected request to validate the identity.

### Role checks (backend)

| Route | Role required | Enforcement |
|---|---|---|
| `GET /api/appointments` | Any authenticated user | Middleware only; doctor SQL-scoped |
| `POST /api/appointments` | `receptionist` | `req.user.role !== 'receptionist'` → 403 |
| `PUT /api/appointments/:id` | `receptionist` | `req.user.role !== 'receptionist'` → 403 |
| `PUT /api/appointments/:id/status` | `doctor` | `req.user.role !== 'doctor'` → 403 |
| `PUT /api/appointments/:id/notes` | `doctor` | `req.user.role !== 'doctor'` → 403 |

### Record scoping

- **Doctors:** `GET /api/appointments` adds `WHERE doctor_name = req.user.doctor_name` — doctors cannot see other doctors' appointments even with a forged request (the backend reads `doctor_name` from the re-queried user row, not from user input).
- **Receptionists:** see all appointments.
- **Doctor status update and note update:** both additionally check `appointment.doctor_name !== req.user.doctor_name` → 403 before proceeding.

---

## 7. Protected Action Explanation

**Protected action:** Add or edit a visit note — `PUT /api/appointments/:id/notes`

**Enforcement layers (all server-side):**

1. **Middleware** — `authenticateUser` re-queries `users` table; returns 401 if header is absent or username is unknown.
2. **Role gate** — `req.user.role !== 'doctor'` → **403 Forbidden**.
3. **Ownership gate** — fetches appointment then checks `appointment.doctor_name !== req.user.doctor_name` → **403 Forbidden**. `req.user.doctor_name` comes from the server-side DB query, never from the client request.
4. **Status gate** — `appointment.status !== 'Confirmed' && appointment.status !== 'Completed'` → **400 Bad Request**. Blocks notes on `Pending`, `Rejected`, and `Cancelled` appointments.
5. **SQL double-guard** — `UPDATE appointments SET visit_note = ?, status = 'Completed' WHERE id = ? AND doctor_name = ?` uses `req.user.doctor_name` in the `WHERE` clause as a final ownership barrier.

**UI protection:**
- Receptionist dashboard renders `visit_note` as a styled read-only preview; the edit modal has no `visit_note` field.
- Doctor dashboard shows "Add Note" only for `Confirmed` appointments and "Edit Note" only for `Completed` ones. No note button for `Pending`, `Rejected`, or `Cancelled`.

**Test evidence:** Test 3 confirms that attempting a note on a `Pending` appointment returns **400**. Test 5 confirms that a note on a `Confirmed` appointment succeeds and auto-transitions to `Completed`.

---

## 8. Validation Summary

### Backend validation (enforced server-side)

| Route | Rule | HTTP response |
|---|---|---|
| `POST /api/login` | `!username \|\| !password` | 400 |
| `POST /api/appointments` | All 6 fields must be truthy | 400 |
| `POST /api/appointments` | `appointment_date` must not be in the past | 400 |
| `POST /api/appointments` | `contact_number` must match `/^[0-9+\-\s()]{7,15}$/` | 400 |
| `PUT /api/appointments/:id` | All 7 fields must be truthy | 400 |
| `PUT /api/appointments/:id` | Locked if status is Confirmed / Completed / Cancelled | 400 |
| `PUT /api/appointments/:id` | `appointment_date` must not be past (unless Cancelled) | 400 |
| `PUT /api/appointments/:id` | Phone regex enforced | 400 |
| `PUT /api/appointments/:id/status` | Status must be `Confirmed` or `Rejected` | 400 |
| `PUT /api/appointments/:id/status` | Appointment must be `Pending` | 400 |
| `PUT /api/appointments/:id/status` | Doctor must own the appointment | 403 |
| `PUT /api/appointments/:id/status` | Double-booking check (conflict on Confirmed slots) | 409 |
| `PUT /api/appointments/:id/notes` | `visit_note === undefined` | 400 |
| `PUT /api/appointments/:id/notes` | Appointment must be `Confirmed` or `Completed` | 400 |
| `PUT /api/appointments/:id/notes` | Doctor must own the appointment | 403 |

### Frontend validation (client-side — not the security layer)

- HTML5 `required` on all form inputs and visit note textarea.
- `min={todayStr}` attribute on date inputs.
- Past-date JS check in `handleSubmit` and `handleUpdate`.
- Phone regex check in `handleSubmit` and `handleUpdate`.
- `window.confirm()` on cancel action.
- `startWritingNotes()` pre-checks status before opening modal.

### Known validation gaps

- `visit_note === undefined` check passes for `""` (empty string) — appointment is marked `Completed` with no clinical content.
- No `.trim()` on text fields — whitespace-only strings (`"   "`) pass the `!field` truthy check.
- `doctor_name` is not validated against the `users` table on booking — a non-existent doctor name can be submitted via a raw API call.
- Status in the edit PUT is not strictly transition-validated — a raw API call could set status to any ENUM value.

---

## 9. Automated and Manual Testing Summary

### Automated tests — `npm test` (node test.js)

**Command:** `npm test` in `backend/` directory (requires backend server running on port 5000).  
**Runner:** Custom `fetch`-based Node.js script — no external test framework.  
**DB cleanup:** `finally` block deletes test-created appointment rows by ID.

| Test | What it checks | Result |
|---|---|---|
| TEST 1 — Health check | `GET /api/health` returns 200 | ✅ Pass |
| TEST 2 — Authentication | Invalid credentials → 401; receptionist login → 200; doctor login → 200 | ✅ Pass |
| TEST 3 — Booking & status workflow | Receptionist creates appointment → status `Pending`; block note on Pending → 400; doctor confirms → status `Confirmed` verified in list | ✅ Pass |
| TEST 4 — Double-booking conflict | Second appointment for same doctor/date/time → book OK (Pending); doctor tries to confirm → 409 | ✅ Pass |
| TEST 5 — Complete with notes | Doctor saves note on Confirmed → 200; status verified as `Completed` in list | ✅ Pass |
| TEST 6 — Modification lock | Receptionist tries to edit Completed appointment → 400 | ✅ Pass |

**Result recorded live during this review: ⭐ ALL TESTS COMPLETED SUCCESSFULLY!**

### What is NOT automated (requires manual checks)

| Check | Manual only | Why |
|---|---|---|
| Receptionist cannot call `PUT /api/appointments/:id/notes` | Manual | No negative cross-role test in `test.js` |
| Doctor cannot see another doctor's appointments | Manual | No cross-doctor scoping test |
| Frontend rendering / UI interactions | Manual | No React component tests |
| Filter controls (doctor / status / date) | Manual | Client-side only; not covered by API tests |
| Empty visit note submission (bypass HTML `required`) | Manual | Not in test suite; backend gap still present |
| Session persistence across page refresh | Manual | `localStorage` behaviour not tested |
| Cancel workflow in the UI | Manual | Cancel uses PUT — not a dedicated test case |

---

## 10. Stage 11 Change Summary

The following items were added or fixed after the Mid Review (Stage 11 / final hardening):

| Change | Location | Mid-Review state | Final state |
|---|---|---|---|
| Past-date booking guard (backend) | `server.js` L136–140, L204–208 | Missing | ✅ Added |
| Phone number format validation (backend) | `server.js` L143–146, L211–214 | Missing | ✅ Added (regex) |
| Appointment edit lock (Confirmed/Completed/Cancelled) | `server.js` L199–201 | Missing | ✅ Added |
| Doctor status update endpoint | `server.js` L237–289 | Missing | ✅ Added (`PUT /api/appointments/:id/status`) |
| Double-booking conflict check | `server.js` L84–100, L268–273 | Missing | ✅ Added (`isDoubleBooked()` helper, 409 response) |
| Status guard on notes endpoint | `server.js` L317–319 | Missing | ✅ Added (blocks Pending / Rejected / Cancelled) |
| Doctor ownership check on status update | `server.js` L257–259 | Missing | ✅ Added |
| Integration test suite | `backend/test.js` | No tests | ✅ Added (6 test groups, 13 assertions, DB cleanup) |
| App.jsx size growth | `frontend/src/App.jsx` | 782 lines (mid review) | 880 lines (+98 for new handlers and modals) |

---

## 11. Stage Drift / Early Implementation

| Item | Present? | Stage expected | Assessment |
|---|:---:|---|---|
| Integration test suite | ✅ | Final stage | Correctly introduced at final stage |
| Past-date backend validation | ✅ | Should have been earlier | Added in final — correct time, slightly late |
| Double-booking conflict check | ✅ | Final / hardening | Correctly added |
| JWT or token-based auth | ❌ | Security hardening stage | Not implemented — plaintext username-as-token remains |
| Password hashing (bcrypt) | ❌ | Security hardening stage | Not implemented — passwords stored in plaintext |
| Helmet or HTTP security headers | ❌ | Security hardening stage | Not implemented |
| Rate limiting on login | ❌ | Security hardening stage | Not implemented |
| CORS origin restriction | ❌ | Security hardening stage | `cors()` called with no options — still wide-open |
| Input `.trim()` guards | ❌ | Maintainability cleanup | Not implemented |
| Component decomposition | ❌ | Maintainability cleanup | Single 880-line `App.jsx` remains |
| Backend URL env variable | ❌ | Maintainability cleanup | Hardcoded `http://localhost:5000` in 7 places |
| Dynamic doctor list from DB | ❌ | Could be current stage | Still hardcoded in frontend selects |
| Root `.gitignore` | ❌ | Security hardening | Not created — backend `.env` unprotected |

**Verdict:** No features from future stages were introduced early. However, three critical security hardening items (password hashing, JWT/session tokens, CORS restriction) that were flagged as `❌ Fail` in the Mid Review were **not resolved** before the final stage.

---

## 12. Security Risks and Exposed-Secret Check

| Risk | Severity | Status | Detail |
|---|---|---|---|
| Plaintext passwords | 🔴 Critical | **Not fixed** | `users.password` is VARCHAR; compared with `WHERE password = ?`. No bcrypt or equivalent. |
| Username-as-auth-token | 🔴 Critical | **Not fixed** | `Authorization` header is the raw `username` string. Any user who knows another username can forge API requests without knowing their password. |
| No CORS origin restriction | 🟠 High | **Not fixed** | `app.use(cors())` with no `origin` option — all origins allowed. |
| Backend `.env` not gitignored | 🟠 High | **Not fixed** | `frontend/.gitignore` covers frontend files only. No `backend/.gitignore` or root `.gitignore`. `.env` containing DB credentials is unprotected by version control. |
| `localStorage` session storage | 🟡 Medium | By design | `clinic_user` in `localStorage` is accessible to any script on the page — XSS risk. No HttpOnly cookie alternative. |
| Empty visit note marks Completed | 🟡 Medium | **Not fixed** | `visit_note === undefined` check passes empty string `""`. Appointment marked `Completed` with no clinical content. |
| No `helmet` headers | 🟡 Medium | **Not fixed** | No X-Frame-Options, Content-Security-Policy, or similar HTTP security headers. |
| No rate limiting | 🟡 Medium | **Not fixed** | `POST /api/login` is unthrottled — susceptible to brute-force attacks. |
| Hardcoded backend URL | 🔵 Low | **Not fixed** | `http://localhost:5000` appears 7× in `App.jsx`. Not a secret risk but a deployment config risk. |
| No secrets hardcoded in source | ✅ OK | Clean | No credentials appear in `server.js`, `App.jsx`, or any committed source file. All via `.env`. |
| `.env.example` present | ✅ OK | Clean | All five DB variable names documented without values. |

**Password note:** This review confirms passwords are stored and compared in plaintext. The exact password values are not printed here but are visible in `dbInit.js` seed data.

---

## 13. Documentation / Code Mismatches

| # | Document | Code | Mismatch |
|---|---|---|---|
| D-1 | `schema.sql` line 2: targets database `clinic_appointments` | `dbInit.js` line 16: uses `DB_NAME \|\| 'c1p1'` | Reference schema targets a different database name than the active code. Live system uses `c1p1`. |
| D-2 | `schema.sql` uses `CREATE TABLE IF NOT EXISTS` | `dbInit.js` uses `DROP TABLE IF EXISTS` then `CREATE TABLE` | Schema file is append-safe; init script is destructive. Running `schema.sql` directly would not seed users or reset data. |
| D-3 | Mid Review issue H-3: "No status guard on note endpoint" | Final `server.js` L317–319 | **Fixed** — status guard added. |
| D-4 | Mid Review issue C-1: plaintext passwords | Final `server.js` L47 | **Not fixed** — still plaintext. |
| D-5 | Mid Review issue C-2: username-as-token | Final `server.js` L70 | **Not fixed** — still raw username. |
| D-6 | Mid Review issue H-1: wide-open CORS | Final `server.js` L9 | **Not fixed** — `cors()` still called with no options. |
| D-7 | `frontend/README.md` | Still Vite template boilerplate | No project-specific run instructions, seed steps, or credential list. |

---

## 14. Known Limitations

1. **Plaintext passwords** — stored and compared as cleartext. Production-unacceptable.
2. **Auth token is spoofable** — any user who knows another's username can forge requests after initial login.
3. **No session expiry** — a session in `localStorage` never expires.
4. **Hardcoded doctor list** — adding a new doctor to the `users` table has no effect on the frontend dropdown options.
5. **Doctor name as free text** — no foreign key from `appointments.doctor_name` to `users.doctor_name`. A non-existent doctor name can be booked via a raw API call.
6. **Destructive seed** — `npm run db:seed` destroys all existing data. Cannot be used on a live instance.
7. **Empty visit note bug** — submitting an empty note via raw API call (bypassing HTML `required`) marks the appointment `Completed` with `visit_note = ""`.
8. **Client-side filters only** — all appointments are fetched first; filters run in JavaScript. Will degrade with large datasets.
9. **No pagination** — all records returned in a single query.
10. **No ARIA / accessibility** — no `aria-label`, `role`, or focus management on modals or dynamic content.
11. **Date UTC offset display bug** — `new Date(apt.appointment_date).toLocaleDateString()` without timezone normalisation may display one day behind in non-UTC locales.
12. **Backend URL hardcoded** — deploying to any environment requires editing 7 occurrences in `App.jsx`.
13. **Whitespace-only input** — `"   "` passes `!field` truthy validation on all text fields.
14. **No root `.gitignore`** — `backend/.env` is unprotected by version control.

---

## 15. Demo Script

### Prerequisites

- MySQL running. Database `c1p1` seeded via `npm run db:seed` in `backend/`.
- Backend running: `npm run dev` in `backend/` (port 5000).
- Frontend running: `npm run dev` in `frontend/` (port 5173).
- Browser open at `http://localhost:5173`.

---

### Scene 1 — Login (Receptionist)

> "The system opens at a login screen. I'll log in as the receptionist who handles all bookings."

1. Enter username: `receptionist`, password: `password123` → click **Sign In**.
2. Show: receptionist dashboard with booking form on the left and the full appointment list on the right.
3. Point out the **status colour pills** — yellow (Pending), blue (Confirmed), green (Completed), red (Cancelled/Rejected).

---

### Scene 2 — Book a New Appointment

> "A patient calls in. I'll book an appointment for them."

1. Fill the booking form: Patient Name: `Jane Doe`, Contact: `555-1234`, Doctor: `Dr. Adams`, Date: tomorrow's date, Time: `11:00`, Reason: `Annual checkup`.
2. Click **Request Appointment** — alert confirms booking; new row appears with status `Pending`.
3. Attempt to book with a **past date** → alert blocks it. *(Backend also blocks it — show in DevTools.)*

---

### Scene 3 — Logout and Login as Doctor

> "Dr. Adams logs in to review their schedule."

1. Click **Logout**. Return to login page.
2. Enter `dr_adams` / `password123` → Sign In.
3. Show: doctor dashboard showing **only Dr. Adams' appointments** — Jane Doe's Pending booking appears; Dr. Baker's or Dr. Carter's patients are not visible.

---

### Scene 4 — Doctor Accepts Appointment

> "Dr. Adams reviews the request and accepts it."

1. Find Jane Doe's row (status: `Pending`).
2. Click ✅ **Accept** → appointment status changes to `Confirmed`.

---

### Scene 5 — Doctor Records Visit Note

> "The consultation is done. Dr. Adams records clinical notes."

1. Jane Doe's row now shows **Add Note** button.
2. Click **Add Note** → modal opens with patient name and appointment date.
3. Type a note: `"Healthy. No concerns. Advised annual blood work."` → click **Save & Complete**.
4. Row status changes from `Confirmed` to **Completed**. Note preview appears in the table.

---

### Scene 6 — Visit Note Privacy (Receptionist View)

> "Let's prove the receptionist cannot write notes."

1. Logout as doctor. Login as `receptionist`.
2. Find Jane Doe's completed row. Show: note is visible **read-only** in the patient cell (dashed border preview).
3. Click **Edit** on a Pending row — show that the edit modal has **no visit note field**.
4. Open browser DevTools → Console. Manually call `fetch(...)` with `Authorization: receptionist` to `PUT /api/appointments/1/notes` → returns **403 Forbidden**.

---

### Scene 7 — Cancellation Flow

> "A patient cancels before the appointment is confirmed."

1. As receptionist, find a `Pending` appointment. Click ❌ **Cancel** → confirm dialog → status changes to `Cancelled`.
2. Attempt the same on a `Confirmed` or `Completed` row — UI shows **Locked**. Backend also returns 400 if attempted via API.

---

### Scene 8 — Run Automated Tests

> "The project ships with an integration test suite."

```bash
cd backend
npm test
```

Show terminal output with all 6 ✅ passing, then the 🧹 cleanup lines, confirming no test pollution.

---

## 16. Suggested Viva Questions

### Project understanding

1. Why are the frontend and backend in separate directories run as separate processes? What would break if React tried to import `mysql2` directly?
2. What does `npm run db:seed` do step by step? What happens to existing data when you run it a second time?
3. How does the system know which user is making a request to the backend? Trace from clicking a button in React to the SQL query that validates the caller.

### Role-based access

4. If a receptionist opens DevTools and sends `PUT /api/appointments/1/notes` with their `Authorization` header, what HTTP status code does the server return and why?
5. How does the backend ensure a doctor can only see their own appointments? At what layer is this enforced — frontend, middleware, or SQL?
6. If two doctors share the same `doctor_name` value in the `users` table, what would happen when either logs in? Is this a bug or a design assumption?

### Status and workflow

7. Explain the full appointment lifecycle from creation to completion. What triggers each status change and who is allowed to trigger it?
8. What happens if a receptionist tries to edit an appointment that is already `Confirmed`? Where is this blocked — frontend, backend, or both?
9. Why does saving a visit note automatically set the appointment status to `Completed`? Is there a way to save a note without completing the appointment?
10. What is the double-booking rule? How does the server detect a conflict and what HTTP status code does it return?

### Database

11. Why does `server.js` use `createPool` but `dbInit.js` uses `createConnection`? When would you choose one over the other?
12. What is the difference between `schema.sql` and `dbInit.js`? Which one is actually used to set up the live database?
13. The `doctor_name` column in `appointments` is a `VARCHAR`, not a foreign key to `users.id`. What problems could this cause, and how would you fix it?

### Security

14. What is the current authentication token? How could a user forge a request as another user? What would you use instead in a production system?
15. Passwords are stored as plain text. What function would you use to hash them? Describe the change to both the seed script and the login query.
16. If you replaced the username-as-token with a JWT, what fields would you include in the payload and how would the middleware verify it?
17. CORS is currently wide open. How would you restrict it to allow requests only from `http://localhost:5173`?

### Testing

18. Walk through what TEST 4 (double-booking conflict) actually does — what requests does it send, what does it check, and how does it clean up?
19. The test suite does not test whether a receptionist can call the `/notes` endpoint. If you were to add this test, what assertion would you make?
20. Why does the `finally` block in `test.js` exist? What would happen to the database if a test failed midway and the cleanup did not run?

### Code quality

21. `App.jsx` is 880 lines. How would you decompose it into smaller components? Name at least three components you would extract and what state each would own.
22. The backend URL `http://localhost:5000` appears seven times in `App.jsx`. How would you centralise this? What Vite mechanism would you use for environment-specific values?
23. What is the difference between `node --watch server.js` (the `dev` script) and `node server.js` (the `start` script)? Why not use `nodemon` instead?

---

*End of final review. No source code was modified during this review.*  
*Test evidence: all 6 automated tests passed live on 2026-06-05 during review execution.*
