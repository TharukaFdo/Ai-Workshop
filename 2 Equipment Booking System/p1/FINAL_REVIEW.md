# Final Review — Equipment Booking System

**Review date:** 2026-06-07  
**Review stage:** Final — after testing, security hardening, maintainability cleanup, and change request implementation.  
**Reviewed by:** AI final reviewer (evidence-based, code-verified)  
**Project stack:** React 19 (Vite 8) + Express 4 + MySQL 2 (mysql2)  
**Repo root:** `p1/` — `backend/` and `frontend/` as separate sub-directories  
**Mid-review reference:** `MID_REVIEW.md` (same directory)

---

## 1. Final Feature Summary

The Equipment Booking System is a full-stack web application that allows staff members to request shared lab equipment and lab assistants to approve or reject those requests. All features required by the Case Brief are present and working.

**What was built:**

| Feature | Status | Evidence file |
|---|---|---|
| Staff: create booking request (equipment, date, start/end time, purpose) | ✅ Complete | `server.js` L168–210, `App.jsx` L132–175 |
| Staff: view **only own** bookings | ✅ Complete, server-enforced | `server.js` L133–136 |
| Staff: edit own **pending** booking | ✅ Complete with dual check | `server.js` L212–260 |
| Lab Assistant: view **all** bookings | ✅ Complete | `server.js` L137–143 |
| Lab Assistant: approve booking with required comment | ✅ Complete | `server.js` L262–307, `App.jsx` L177–206 |
| Lab Assistant: reject booking with required comment | ✅ Complete | same as above |
| Lab Assistant: mark booking Collected | ✅ Complete (post-mid addition) | `server.js` L285–293, `App.jsx` L209–225 |
| Lab Assistant: mark booking Returned | ✅ Complete (post-mid addition) | same as above |
| Filter by equipment (LIKE, server-side) | ✅ Complete | `server.js` L144–148 |
| Filter by date (exact match, server-side) | ✅ Complete | `server.js` L149–152 |
| Filter by status (exact match, server-side) | ✅ Complete | `server.js` L153–156 |
| Login (database-backed session token) | ✅ Complete | `server.js` L48–78, `db.js` |
| Logout (session row deleted) | ✅ Complete | `server.js` L80–93 |
| Past-date booking rejection | ✅ Complete (post-mid addition) | `server.js` L97–100 |
| End-time-after-start-time check | ✅ Complete (post-mid addition) | `server.js` L102–104 |
| Overlap/double-booking prevention | ✅ Complete (post-mid addition) | `server.js` L106–124 |
| Automated integration test suite | ✅ Complete (post-mid addition) | `backend/test.js`, `npm test` |
| Staff cancel booking | ❌ Not implemented | No DELETE or soft-cancel route in `server.js` |

**Verdict:** The project is **substantially complete** against the Case Brief requirements. The one outstanding gap (cancel booking) was documented in the Mid Review as a known gap and remains unresolved. All other mid-review critical and high gaps related to validation and testing were addressed.

---

## 2. Review Scoring Matrix

> Score meaning: 0 = missing · 1 = present but mostly not working · 2 = partially working with major gaps · 3 = mostly working with important gaps · 4 = working with minor gaps · 5 = complete for the selected case scope

| Feature / Area | Functionality 0-5 | Data Persistence 0-5 | Backend Security / Role Control 0-5 | Validation / Error Handling 0-5 | Testing Evidence 0-5 | Maintainability 0-5 | UI / Manual Usability 0-5 | Evidence | Notes |
|---|---:|---:|---:|---:|---:|---:|---:|---|---|
| Project setup and run commands | 4 | — | — | — | 3 | 3 | — | `backend/package.json`: `start`, `dev`, `db:init`, `test`; `frontend/package.json`: `dev`, `build`. No root-level README; both `node_modules` present. | `test` script added post-mid. Still no root-level README. `index.html` title still reads "frontend". |
| Database setup and starter data | 5 | 5 | — | — | 4 | 3 | — | `db-init.js` creates DB + 3 tables + seeds 3 users and 4 bookings in one `npm run db:init`. `test.js` cleans its own test records after every run. | Passwords seeded as plaintext. Repeatable but destructive (drop-recreate). No migration tooling. |
| Login workflow | 4 | 4 | 3 | 4 | 4 | 3 | 4 | `POST /api/login`: queries `users`, creates `sessions` row with `crypto.randomBytes(32)` token. Tests verify 401 on bad password and 200 on valid login. Token stored in `localStorage`. | Passwords still plaintext (no bcrypt). No session TTL. No HTTPS. CORS still `*`. No rate-limit on login route. |
| Role-based access | 5 | 5 | 4 | 4 | 5 | 3 | 5 | `authenticateToken` middleware resolves role from DB join on every protected route. Tests verify Lab Assistant blocked from POST, Staff blocked from status update, non-owner blocked from PUT. | No CORS restriction; no Helmet; no rate limiting. |
| Main create action | 5 | 5 | 5 | 5 | 5 | 3 | 5 | `POST /api/bookings`: all 5 fields required, `requested_user` forced from `req.user.username`, defaults to `Pending`. Tests: past date → 400; invalid time order → 400; overlap → 400; success → 201. | No backend equipment-name whitelist (any string accepted; bypasses frontend dropdown). |
| Main view/list action | 5 | 5 | 5 | 3 | 4 | 3 | 5 | `GET /api/bookings`: Staff scoped to own rows; Lab Assistant sees all. Tests verify staff isolation and assistant all-user visibility. Filter test also included. | No pagination. Fetch errors in `App.jsx` still only `console.error`'d — not surfaced to the user in the UI. |
| Main update/status/cancel action | 4 | 4 | 5 | 5 | 4 | 3 | 4 | `PUT /api/bookings/:id`: ownership + pending-status enforced. Tests: non-owner → 403; owner edit → 200; edit post-approval → 400. `checkBookingConstraints` re-runs on edit. | No cancel (delete/soft-cancel) action. Only edit of pending bookings. |
| Protected action | 5 | 5 | 5 | 5 | 5 | 3 | 5 | `PUT /api/bookings/:id/status`: role check (403), status enum check (400), non-empty comment for Approve/Reject (400). Tests: staff → 403; approval with comment → 200; edit post-approval → 400. | No backend guard preventing re-review of an already-decided booking. No `reviewed_by` audit column. |
| Secondary feature | 5 | 5 | 5 | 4 | 4 | 3 | 4 | Filters `equipment`, `date`, `status` applied server-side. Filter test in `test.js` (equipment filter). Frontend filter bar on both Staff and Assistant views. | No debounce on text filter. No URL persistence for filters. Only equipment filter automated; date and status filter not specifically tested. |
| Case-specific: equipment booking date/time and purpose fields | 5 | 5 | — | 5 | 5 | 3 | 5 | DB: `booking_date DATE NOT NULL`, `start_time TIME NOT NULL`, `end_time TIME NOT NULL`, `purpose TEXT NOT NULL`. Backend validates all 5 fields present, past date, time order, and overlap. Test suite covers past date (400) and invalid time order (400). | No minimum/maximum length for `purpose`. `equipment_name` not validated against a server-side whitelist. |
| Case-specific: booking approval/rejection with assistant comment | 5 | 5 | 5 | 5 | 5 | 3 | 5 | `PUT /api/bookings/:id/status`: `assistant_comment` required and non-empty for Approved/Rejected (both UI and backend enforce). Tests: staff approve attempt → 403; assistant approve with comment → 200. `assistant_comment TEXT` column in DB. | No re-review guard (concurrent duplicate-decision possible). No `reviewed_by` audit trail. |
| Case-specific: staff-only ownership of own booking requests | 5 | 5 | 5 | 5 | 5 | 3 | 5 | `GET /api/bookings` server-appends `AND requested_user = req.user.username` for Staff — cannot be bypassed from the frontend. `requested_user` set from `req.user.username` on creation. `PUT /api/bookings/:id` checks ownership explicitly (403 on mismatch). Tests: staff-only-own-records assert; non-owner edit blocked (403). | Username stored as VARCHAR, not FK to `users.id` — referential integrity gap remains. |
| UI / manual usability | 4 | — | — | — | 3 | 3 | 4 | Clean two-panel layout (Staff) and table layout (Assistant). Dark-mode via `prefers-color-scheme`. Status badges colour-coded. Modal with animation for approve/reject. Refresh button. Collect/Return action buttons for Lab Assistant. | `index.html` title still "frontend". No loading spinner. No empty-state illustration. No cancel booking UI. |
| Security posture | 2 | — | 2 | — | 2 | 2 | — | Token-based session with DB lookup. Parameterised queries prevent SQL injection. Session deleted on logout. | Plaintext passwords (no bcrypt). CORS `*`. No Helmet. No rate limiting. No session TTL. `.env` not in backend `.gitignore`. Token in `localStorage` (XSS risk). |
| Testing evidence | 4 | 4 | 5 | 5 | 5 | 4 | — | `backend/test.js`: 307-line integration test suite. 13 `assert.strictEqual` / `assert.ok` checks. Covers login, role blocks, CRUD, ownership, validation (past date, time order, overlap), approval lifecycle. Cleans test booking + sessions after run. `npm test` command defined. | No frontend/UI tests. No test runner framework (Jest, Mocha) — uses raw Node `assert` + `fetch`. Test run requires backend to be running on port 5000. |
| Maintainability | 3 | — | — | — | — | 3 | — | `server.js` (316 lines), `App.jsx` (623 lines) — single-file pattern. `App.css` unused Vite scaffold styles still present. No JSDoc, no TypeScript, no component decomposition. ESLint config present in frontend. `test.js` is self-contained and well-structured with section headers. | `App.css` dead code not cleaned. No root README. `frontend/README.md` still Vite template. Monolithic files acceptable at this scale. |

---

## 3. Project Structure and Run Commands

```
p1/
├── Case_Brief.md                    # Original requirements (4 lines)
├── MID_REVIEW.md                    # Mid-project review document
├── FINAL_REVIEW.md                  # This document
│
├── backend/
│   ├── .env                         # DB credentials (DB_HOST, DB_PORT, DB_USER, DB_PASSWORD, DB_NAME, PORT)
│   ├── db.js                        # mysql2 connection pool, reads .env
│   ├── db-init.js                   # DB + table creation + seed data (run once)
│   ├── server.js                    # Express app, all routes (316 lines)
│   ├── test.js                      # Integration test suite (307 lines)
│   ├── package.json                 # Dependencies: express, cors, mysql2, dotenv, nodemon
│   └── node_modules/
│
└── frontend/
    ├── .gitignore                   # Excludes node_modules, dist (does NOT exclude .env)
    ├── index.html                   # Entry HTML (title still "frontend" — not fixed)
    ├── vite.config.js               # Vite + React plugin, no proxy configured
    ├── package.json                 # Dependencies: react, react-dom; dev: vite, eslint
    ├── eslint.config.js             # ESLint config
    └── src/
        ├── main.jsx                 # React root mount
        ├── App.jsx                  # Full application (623 lines, single component)
        ├── App.css                  # Minimal reset (unused Vite scaffold styles still present)
        └── index.css                # Full design system (658 lines)
```

**Run commands:**

```bash
# 1. Setup database (once, or to reset)
cd backend
npm install
npm run db:init

# 2. Start backend
npm run dev           # nodemon on port 5000
# or
npm start             # plain node

# 3. Start frontend (new terminal)
cd ../frontend
npm install
npm run dev           # Vite on port 5173

# 4. Run automated tests (backend must be running on port 5000)
cd backend
npm test
```

---

## 4. Frontend/Backend Separation Check

**React and Express are correctly separated.**

| Check | Result | Evidence |
|---|---|---|
| Separate directories with independent package.json | ✅ Yes | `backend/package.json` + `frontend/package.json` — no shared root package |
| `mysql2` absent from frontend | ✅ Yes | `frontend/package.json` has no database dependency of any kind |
| All frontend DB access goes through Express routes | ✅ Yes | Every `fetch()` call in `App.jsx` targets `http://localhost:5000/api/*` |
| Frontend has no `.env` with DB credentials | ✅ Yes | No `.env` file in `frontend/`; no DB config in any frontend file |
| No Vite proxy configured (direct fetch to port 5000) | Noted | `vite.config.js` has no `server.proxy` — frontend hardcodes `http://localhost:5000`. Works locally but not production-ready |

**Conclusion:** React never connects to MySQL directly. All data flows through Express HTTP routes.

---

## 5. Database Setup and Table Summary

**Connection method:** `mysql2` connection pool in `backend/db.js`. All five environment variables are configured and read from `.env`:

| Variable | Configured | Default fallback |
|---|---|---|
| `DB_HOST` | ✅ | `localhost` |
| `DB_PORT` | ✅ | `3306` |
| `DB_USER` | ✅ | `root` |
| `DB_PASSWORD` | ✅ | *(not printed)* — `''` fallback |
| `DB_NAME` | ✅ | `c2p1` |

`DB_PASSWORD` is confirmed set in `.env`; it is not printed in this review.

**Tables defined in `db-init.js`:**

| Table | Purpose | Key columns |
|---|---|---|
| `users` | Login identity and role | `id INT PK AUTO_INCREMENT`, `username VARCHAR(255) UNIQUE NOT NULL`, `password VARCHAR(255) NOT NULL` *(plaintext)*, `role ENUM('Staff','Lab Assistant') NOT NULL` |
| `sessions` | Token ↔ user mapping (DB-backed auth) | `token VARCHAR(255) PK`, `user_id INT FK → users.id ON DELETE CASCADE`, `created_at TIMESTAMP` |
| `bookings` | Main entity | `id INT PK`, `equipment_name VARCHAR(255) NOT NULL`, `requested_user VARCHAR(255) NOT NULL`, `booking_date DATE NOT NULL`, `start_time TIME NOT NULL`, `end_time TIME NOT NULL`, `purpose TEXT NOT NULL`, `status ENUM('Pending','Approved','Rejected','Collected','Returned') DEFAULT 'Pending'`, `assistant_comment TEXT`, `created_at TIMESTAMP` |

A `users` / login table **does exist** (`users` table with `username`, `password`, `role`).

**How tables and seed data are created:**

```bash
cd backend
npm run db:init    # runs node db-init.js
```

This script:
1. Connects to MySQL without a database selected.
2. Creates `c2p1` database if not exists.
3. Drops `bookings`, `sessions`, `users` in dependency order.
4. Re-creates all three tables with correct schema.
5. Seeds 3 users: `john_doe` (Staff), `jane_smith` (Staff), `alice` (Lab Assistant) — all password `password123`.
6. Seeds 4 bookings covering Pending, Approved, and Rejected statuses.

The script is **destructive and repeatable** — re-running it drops all data and starts fresh.

---

## 6. Login and Role/Access Explanation

**How users log in:**

1. User submits username + password to `POST /api/login`.
2. Backend queries `users` WHERE `username = ?` AND `password = ?` (plaintext comparison — known limitation).
3. On match: `crypto.randomBytes(32).toString('hex')` generates a 64-character token.
4. Token is inserted into `sessions` table with the user's `id`.
5. Token and user object (`username`, `role`) returned to client.
6. Frontend stores token in `localStorage` and attaches it as `Authorization: Bearer <token>` on all subsequent requests.

**How roles are checked:**

- Every protected route calls `authenticateToken` middleware first.
- Middleware queries `sessions JOIN users WHERE token = ?` to resolve `id`, `username`, and `role`.
- Role is attached to `req.user.role` and checked inline in each route handler.

**Role enforcement table:**

| Route | Who can call it | Enforcement |
|---|---|---|
| `POST /api/login` | Anyone (public) | Credential check only |
| `POST /api/logout` | Anyone with a token | Deletes session row |
| `GET /api/bookings` | Authenticated | Staff: SQL scoped to `requested_user = req.user.username`; Assistant: sees all (optional user filter) |
| `POST /api/bookings` | Staff only | 403 if `req.user.role !== 'Staff'` |
| `PUT /api/bookings/:id` | Booking owner (Staff) only | 403 if username mismatch; 400 if status ≠ Pending |
| `PUT /api/bookings/:id/status` | Lab Assistant only | 403 if `req.user.role !== 'Lab Assistant'` |
| `GET /api/health` | Public | No auth |

**Can users access only their own allowed records?**

- **Staff:** Yes — `GET /api/bookings` appends `AND requested_user = ?` at the SQL layer when `req.user.role === 'Staff'`. This cannot be bypassed from the frontend. Even if a Staff user passes a `user=` query parameter, it is silently ignored (the Staff branch does not read the `user` query param — it always uses `req.user.username`).
- **Lab Assistant:** Can see all bookings. Can optionally filter by username. Cannot create bookings (403).
- **Ownership on edit:** `PUT /api/bookings/:id` re-fetches the booking's `requested_user` from DB and compares to `req.user.username`. If they don't match, 403 is returned — a second staff member cannot edit another's booking.

---

## 7. Protected Action Explanation

**Protected action:** Approve or reject a booking with a required assistant comment.

**Route:** `PUT /api/bookings/:id/status`

**Backend checks (in order):**

1. `authenticateToken` middleware: valid session token required (401 if missing/invalid).
2. `req.user.role !== 'Lab Assistant'` → 403 `Only Lab Assistants can approve or reject bookings`.
3. `status` not in `['Approved', 'Rejected', 'Collected', 'Returned']` → 400 `Invalid status update`.
4. For Approved or Rejected: `assistant_comment` empty or whitespace-only → 400 `Assistant comment is required`.
5. For Collected or Returned: `assistant_comment` optional (stored if provided).
6. `affectedRows === 0` → 404 `Booking not found`.

**Frontend checks:**

- The entire Lab Assistant action interface (Review button → modal) is inside a `user.role === 'Lab Assistant'` conditional in `App.jsx` — not rendered for Staff at all.
- Client-side: `assistantComment.trim() === ''` → sets `actionError` and blocks the fetch.

**Test coverage:** `test.js` Section 5 verifies:
- Staff token → `PUT /status` → 403 ✅
- Lab Assistant token + valid comment → `PUT /status` (Approve) → 200 ✅
- Collect → 200 ✅ ; Return → 200 ✅
- Staff edit post-approval → 400 ✅

**Known gap:** No backend check that the booking is still `Pending` before approve/reject. A concurrent second Lab Assistant request could overwrite a prior decision via the API. No `reviewed_by` audit column.

---

## 8. Validation Summary

**All validation checks confirmed in `server.js`:**

| Layer | What is validated | Result if fails |
|---|---|---|
| Frontend login | Both fields non-empty | Error message shown |
| Backend `/api/login` | Fields present | 400; credentials wrong → 401 |
| Frontend booking form | All 4 visible fields non-empty | `setFormError()` |
| Backend `POST /api/bookings` | Role = Staff | 403 |
| Backend `POST /api/bookings` | All 5 fields present | 400 |
| Backend `POST /api/bookings` | `booking_date` ≥ today | 400 `Booking date cannot be in the past` |
| Backend `POST /api/bookings` | `end_time` > `start_time` | 400 `End time must be after start time` |
| Backend `POST /api/bookings` | No approved overlap for same equipment+date+time | 400 `This equipment is already booked/approved` |
| Backend `PUT /api/bookings/:id` | Ownership match | 403 |
| Backend `PUT /api/bookings/:id` | Status = Pending | 400 |
| Backend `PUT /api/bookings/:id` | All 5 fields present | 400 |
| Backend `PUT /api/bookings/:id` | Date/time/overlap constraints (same helper) | 400 |
| Backend `PUT /api/bookings/:id/status` | Role = Lab Assistant | 403 |
| Backend `PUT /api/bookings/:id/status` | Status in enum | 400 |
| Backend `PUT /api/bookings/:id/status` | Comment non-empty (Approve/Reject) | 400 |
| Backend `PUT /api/bookings/:id/status` | Booking exists | 404 |

**Remaining gaps (not validated):**

- `purpose` has no minimum or maximum length check.
- `equipment_name` is not validated against a server-side whitelist — any string can be POSTed via API, bypassing the frontend dropdown.
- No rate limiting on `/api/login` (brute-force risk).
- Frontend booking form does not enforce past-date or time-order before sending — relies on backend rejection.

---

## 9. Automated and Manual Testing Summary

### Automated Tests

**Command:** `npm test` (in `backend/`)  
**File:** `backend/test.js` (307 lines)  
**Framework:** Node.js built-in `assert` module + native `fetch` — no external test runner.  
**Requirement:** Backend server must already be running on `http://localhost:5000`.

**What the test suite checks (13 assertions across 5 sections):**

| Section | Test | Assertion |
|---|---|---|
| 1. Authentication | Invalid password | 401 |
| 1. Authentication | Valid staff login (john_doe) | 200 + token present |
| 1. Authentication | Valid assistant login (alice) | 200 + token |
| 1. Authentication | Valid secondary staff login (jane_smith) | 200 + token |
| 2. Booking creation | Lab Assistant blocked from creating | 403 |
| 2. Booking creation | Past date rejected | 400 |
| 2. Booking creation | Invalid time order rejected | 400 |
| 2. Booking creation | Overlapping approved booking rejected | 400 |
| 2. Booking creation | Staff creates booking successfully | 201 + ID returned |
| 3. View/filter | Staff only receives own records | `every(b => requested_user === 'john_doe')` |
| 3. View/filter | Assistant sees bookings from multiple users | Both john_doe and jane_smith present |
| 3. View/filter | Equipment filter returns matching records only | `every(b => equipment_name === 'Lab Incubator')` |
| 4. Update | Non-owner blocked from editing | 403 |
| 4. Update | Owner updates booking successfully | 200 |
| 5. Approval | Staff blocked from approving | 403 |
| 5. Approval | Assistant approves with comment | 200 |
| 5. Approval | Assistant marks Collected | 200 |
| 5. Approval | Assistant marks Returned | 200 |
| 5. Approval | Staff blocked from editing post-approval | 400 |

**Cleanup:** After all tests, the test booking row is deleted by ID and all three test session tokens are deleted. Test data does not pollute the seed dataset.

**Reported result (as of review):** When backend is running with seed data, all assertions pass and the console prints `🎉 ALL TESTS PASSED SUCCESSFULLY!`.

### What is NOT automated

- **Frontend/UI tests:** No Playwright, Cypress, or React Testing Library tests exist. No `data-testid` attributes in `App.jsx`.
- **Login form validation (frontend):** Only tested by manual use of the UI.
- **Filter combinations (date + status):** Only the equipment text filter is tested automatically. Date and status filters are manual-check only.
- **Logout flow:** No automated verification that the old token is rejected after logout. Manual check required.
- **Dark mode rendering:** Manual only.

### Manual Check Checklist

| Check | How to verify |
|---|---|
| DB init without errors | `npm run db:init` → no errors in console |
| Backend starts | `npm run dev` → `Server is running on port 5000` |
| Frontend starts | `npm run dev` → Vite on port 5173, login page renders |
| Staff sees only own bookings | Login as `john_doe` → confirm only john_doe records |
| Assistant sees all bookings | Login as `alice` → confirm records from both john_doe and jane_smith |
| Create booking as Staff | Fill form, submit → appears in list as Pending |
| Edit pending booking | Click Edit, change purpose, submit → updated |
| Approve with empty comment | Modal: leave comment empty, click Approve → error shown |
| Approve with comment | Modal: add comment, click Approve → status changes |
| Staff approve via API (curl) | `curl -X PUT …/status -H "Authorization: Bearer <staffToken>"` → 403 |
| Old token after logout | Log out, then use saved token in curl → 401 |

---

## 10. Stage 11 Change Summary

The Mid Review identified the following gaps. The following table records what changed after the mid-review stage:

| Gap (from Mid Review) | Addressed? | Evidence |
|---|---|---|
| No past-date validation on `booking_date` (M1) | ✅ Fixed | `server.js` L97–100: `checkBookingConstraints` returns error if `booking_date < today` |
| No `end_time > start_time` validation (M2) | ✅ Fixed | `server.js` L102–104: returns error if `start_time >= end_time` |
| No double-booking / overlap detection | ✅ Added (new) | `server.js` L106–124: SQL overlap query against Approved bookings |
| No automated tests (Testing Evidence = 0) | ✅ Fixed | `backend/test.js` added; `npm test` script in `package.json` |
| Test data not cleaned up | ✅ Fixed | `test.js` L290–297: deletes test booking + sessions after run |
| Collect/Return lifecycle states missing | ✅ Added (new) | `server.js` L285–293, `App.jsx` L209–225, Collect/Return buttons in UI |
| Status ENUM too narrow | ✅ Fixed | ENUM extended to `('Pending','Approved','Rejected','Collected','Returned')` in `db-init.js` |
| Passwords stored as plaintext (C1) | ❌ Not fixed | `server.js` L56 still uses plaintext comparison; `db-init.js` still seeds plaintext |
| `.env` not in backend `.gitignore` (C2) | ❌ Not fixed | Backend still has no `.gitignore` file |
| CORS allows all origins (C3) | ❌ Not fixed | `app.use(cors())` still at `server.js` L10 |
| No session TTL (C4) | ❌ Not fixed | Sessions still live indefinitely |
| No Helmet security headers | ❌ Not added | No Helmet import in `server.js` |
| `index.html` title "frontend" (H5) | ❌ Not fixed | `frontend/index.html` L7 still reads `<title>frontend</title>` |
| No root README | ❌ Not added | No root-level README in `p1/` |
| `App.css` dead scaffold styles (M6) | ❌ Not cleaned | `App.css` still contains unused styles |
| Staff cancel booking (H3) | ❌ Not implemented | No DELETE or soft-cancel route |

**Summary:** The post-mid work focused correctly on validation completeness, the full booking lifecycle (Collected/Returned states), and automated testing. Security hardening items (bcrypt, CORS restriction, Helmet, session TTL) were not addressed.

---

## 11. Stage Drift and Early Work

| Area | Observation |
|---|---|
| DB-backed session auth | Implemented from the start — more complete than a typical Stage 1 mock auth, but appropriate for the case scope. |
| Backend role enforcement | Present from the beginning — correct, not early. |
| Parameterised queries | Used throughout from day one — good practice; prevents SQL injection. |
| Dark mode CSS | `prefers-color-scheme` implemented alongside the main UI — cosmetic extra, no harm. |
| Modal animation (`@keyframes modalEnter`) | Minor early polish, harmless. |
| Collected/Returned states | Added after mid-review — slightly beyond the Case Brief's "approve/reject" scope but well-integrated; no harm done. |
| Overlap detection | Added after mid-review — a natural extension of the time-slot booking concept; not in Case Brief but improves correctness. |
| `App.css` scaffold code | Vite-default `App.css` still contains dead `.counter`, `.hero`, `.ticks`, etc. styles — dead code from the template, not application logic. Not cleaned at final stage. |
| No test stubs before testing stage | Correct scope management — no test files were created ahead of the testing stage. |

**Verdict:** No harmful stage drift. Two minor cosmetic leftover items: Vite scaffold code in `App.css` and default `frontend` page title — both documented in mid-review and still unfixed at final stage.

---

## 12. Security Risks and Exposed-Secret Check

| Risk | Severity | Status | Location |
|---|---|---|---|
| Plaintext password storage and comparison | 🔴 High | Not fixed | `db-init.js` seed + `server.js` L56 |
| No backend `.gitignore` — `.env` would be committed | 🔴 High | Not fixed | `p1/backend/` has no `.gitignore`; `.env` exists with credentials |
| CORS open to all origins (`app.use(cors())`) | 🟠 Medium | Not fixed | `server.js` L10 |
| No session TTL — tokens live indefinitely | 🟠 Medium | Not fixed | `sessions` table + `authenticateToken` |
| Token stored in `localStorage` (XSS risk) | 🟠 Medium | Not fixed | `App.jsx` L8, L116–117 |
| No HTTP security headers (Helmet) | 🟠 Medium | Not fixed | `server.js` — no Helmet import |
| No rate limiting on `/api/login` | 🟠 Medium | Not fixed | `server.js` L48 |
| No HTTPS enforcement | 🟡 Low (local dev) | Expected | Local dev environment |
| `equipment_name` not validated server-side against whitelist | 🟡 Low | Not fixed | `server.js` POST + PUT; only frontend dropdown enforces |

**Exposed-secret check:**

- The `.env` file exists at `backend/.env` and contains `DB_PASSWORD` set to a value.
- The password is **not printed** in this review.
- Because the backend has **no `.gitignore`**, the `.env` file would be included in any `git add .` or `git commit -a` — this is a high-risk credential exposure if the repository is ever pushed to a remote.
- The frontend `.gitignore` correctly excludes `node_modules` and `dist` but the backend has no equivalent file.

**Recommendation:** Add `backend/.gitignore` containing at minimum: `.env`, `node_modules/`.

---

## 13. Documentation/Code Mismatches

| Item | Document claim | Code reality |
|---|---|---|
| Mid Review L70: `status ENUM('Pending','Approved','Rejected')` | Mid Review listed only 3 statuses | `db-init.js` L52 now shows 5 statuses: `Pending`, `Approved`, `Rejected`, `Collected`, `Returned` — schema was extended post-mid |
| Mid Review L29 "No date-in-the-past validation" | Mid Review identified this as a gap | Fixed in `server.js` `checkBookingConstraints` — Mid Review is now outdated on this point |
| Mid Review L29 "No end-time-after-start-time validation" | Same | Fixed — outdated |
| Mid Review L39 "Testing Evidence = 0" | Testing stage had zero tests | `test.js` now exists and `npm test` is defined |
| Mid Review L34 "No backend validation that end_time > start_time or booking_date ≥ today" | Gap noted | Resolved |
| `frontend/README.md` | Still contains default Vite template content | Not updated to describe the actual project |
| `index.html` `<title>` | Says "frontend" | Should say "Lab Equipment Booking System" or similar |
| Case Brief: "should store … status, and assistant comment" | Brief implies simple approve/reject | Implementation includes Collected and Returned states — beyond brief scope but not contradictory |

---

## 14. Known Limitations

1. **No password hashing.** Passwords are stored and compared as plaintext. Any database read (by a developer, DBA, or attacker with DB access) exposes all user credentials.
2. **No `.gitignore` in backend.** `.env` with DB credentials will be committed if version control is used naively.
3. **No CORS restriction.** Any website can call the API on behalf of a logged-in user.
4. **No session expiry.** Sessions persist until the user explicitly logs out. A stolen token is valid indefinitely.
5. **No cancel booking.** Staff cannot withdraw a submitted request. Only editing is possible, and only while status is Pending.
6. **No re-review guard.** A Lab Assistant can call `PUT /api/bookings/:id/status` on an already-Approved booking via the API and overwrite the decision. The UI prevents this but the backend does not.
7. **No `reviewed_by` audit column.** There is no record of which Lab Assistant approved or rejected a booking.
8. **`requested_user` stored as VARCHAR username.** Not a foreign key to `users.id`. If a username changes, bookings become orphaned.
9. **No pagination.** All bookings are returned in a single query with no limit. This will degrade performance at scale.
10. **Hardcoded API base URL.** `http://localhost:5000` is hardcoded in `App.jsx`. The frontend cannot be deployed to a different environment without code changes.
11. **Tests require a running server.** `npm test` does not start the backend — it must already be running. No test isolation from production seed data (tests operate on the shared DB).
12. **Frontend equipment list is hardcoded.** The `EQUIPMENTS` constant in `App.jsx` is a static array. New equipment cannot be added without code changes.
13. **No frontend error surfacing for `fetchBookings` failures.** Errors are only `console.error`'d — the user sees a stale/empty list with no notice.

---

## 15. Demo Script

**Setup (5 minutes before demo):**

```bash
# Terminal 1 (Backend)
cd p1/backend
npm run db:init    # confirm "Database initialized and seeded successfully."
npm run dev        # confirm "Server is running on port 5000"

# Terminal 2 (Frontend)
cd p1/frontend
npm run dev        # confirm Vite on http://localhost:5173
```

**Demo flow (suggested order ~10 minutes):**

**Step 1 — Show the login page**
- Open `http://localhost:5173` in a browser.
- Show the login form. Attempt to log in with a wrong password — show the error message.

**Step 2 — Staff workflow (john_doe)**
- Log in as `john_doe` / `password123`.
- Point out the role badge ("Staff") in the header.
- Show the booking form: equipment dropdown, date picker, start/end time pickers, purpose textarea.
- Submit a new booking for a future date — confirm it appears in the list as Pending.
- Try to submit with a past date — show the backend error `Booking date cannot be in the past`.
- Try to submit with end time before start time — show the error.
- Click "Edit Request" on the new Pending booking. Change the purpose and save. Confirm the update.

**Step 3 — Ownership check (jane_smith trying to edit john_doe's booking)**
- Log out. Log in as `jane_smith` / `password123`.
- Confirm jane_smith sees only her own bookings (no john_doe bookings visible).
- *(Via curl or browser dev tools, show that a direct PUT to john_doe's booking ID returns 403.)*

**Step 4 — Lab Assistant workflow (alice)**
- Log out. Log in as `alice` / `password123`.
- Show the table view — bookings from both john_doe and jane_smith visible.
- Click "Review" on john_doe's new Pending booking.
- Attempt to approve with an empty comment — show the validation error.
- Enter a comment and click Approve — confirm the status badge changes to Approved.
- Click "Collect" on the approved booking — confirm it changes to Collected.
- Click "Return" — confirm it changes to Returned.
- Reject the other Pending booking with a comment — confirm Rejected status.

**Step 5 — Filters**
- As alice, type "centrifuge" in the equipment filter — confirm list narrows.
- Select a date — confirm the list further narrows.
- Clear filters — confirm all bookings reappear.

**Step 6 — Run tests**
- In Terminal 1 (backend still running):

```bash
npm test
```

- Show all green checkmarks and `🎉 ALL TESTS PASSED SUCCESSFULLY!`

**Step 7 — Logout**
- Log out as alice — confirm redirect to login page.

---

## 16. Suggested Viva Questions

**Architecture and separation:**
1. Why does the backend use `mysql2` and the frontend uses `fetch`? What would happen if you imported `mysql2` in the frontend?
2. Where is the database connection configured? What happens if `DB_HOST` is not set in `.env`?
3. Why is there no Vite proxy configured? What problem does that cause in a real deployment?

**Authentication and sessions:**
4. Walk me through what happens from the moment a user clicks "Sign In" to when their role appears in the header.
5. Where is the session token stored on the client? What security risk does that create?
6. How does the backend know which user is making a request? Show me the code.
7. What happens to the session when a user logs out? How is it verified server-side?

**Role-based access:**
8. A Staff user opens browser DevTools and manually sends a POST request to `/api/bookings/:id/status` with a Lab Assistant's endpoint. What does the server return and why?
9. Could a Staff user retrieve another staff member's bookings by adding `?user=jane_smith` to the URL? Show me where the backend prevents this.
10. Who sets the `requested_user` field on a new booking — the frontend or the backend? Why does it matter?

**Validation:**
11. What validations run before a booking is created? List them in order.
12. What is `checkBookingConstraints` and when is it called? What three things does it check?
13. A booking for "Spectrophotometer" on 2026-06-08 from 13:00–15:00 already exists with status Approved. What happens if a staff member tries to book the same equipment on the same day from 14:00–16:00?

**Database design:**
14. Why is `requested_user` stored as a VARCHAR username rather than a foreign key to `users.id`? What problem does this create?
15. What does `DROP TABLE IF EXISTS bookings` at the start of `db-init.js` mean for existing data?
16. Why are `Collected` and `Returned` useful additional states beyond Approved and Rejected?

**Testing:**
17. How do you run the automated tests? What must be true before you run them?
18. What does `assert.strictEqual(res.status, 403, '...')` do if the response is 200 instead of 403?
19. The test suite creates a booking during the test. How does it ensure this test booking is removed after the test finishes?
20. Which parts of the application are NOT covered by the automated tests? How would you add frontend tests?

**Security:**
21. What is the security risk of storing passwords as plaintext? How would you fix it?
22. If this project were pushed to GitHub without a backend `.gitignore`, what information could anyone with repository access see?
23. What does `app.use(cors())` do and why is it a security concern for a production API?
24. A session token is stolen from `localStorage`. How long is it valid? What would need to change to limit this?

---

*End of Final Review — Equipment Booking System*
