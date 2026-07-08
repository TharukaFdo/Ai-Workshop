# Final Review — Equipment Booking System (p3)

**Review date:** 2026-06-06  
**Stages covered:** Full project — setup through testing, security hardening, maintainability cleanup, and change request  
**Reviewer:** Antigravity AI — automated code review pass with live test execution  
**Source path:** `backend/` · `frontend/`  
**Live test result:** `npm test` — **ALL TESTS PASSED SUCCESSFULLY ✅** (11 tests, zero failures, test data cleaned up)

---

## 1. Final Feature Summary

The Equipment Booking System is a complete full-stack web application built with **React 18 (Vite)** on the frontend and **Express.js + MySQL** on the backend. All primary and secondary requirements from `REQUIREMENTS.md` have been implemented. The system supports two roles — **Staff** (request equipment) and **Lab Assistant** (review and manage requests) — each with dedicated UI dashboards enforced by server-side role checks.

| Requirement | Status |
|---|---|
| REQ-1 — DB-backed login with JWT | ✅ Complete |
| REQ-2 — Create booking (staff only) | ✅ Complete |
| REQ-3 — View bookings (staff own / assistant all) | ⚠️ Partial — `createdAt`/`updatedAt` not displayed in tables |
| REQ-4 — Update own pending booking (staff) | ✅ Complete |
| REQ-4 — Cancel pending booking (staff) | ❌ Not implemented |
| REQ-5 — Approve/reject + assistant comment (assistant) | ✅ Complete |
| REQ-5 — Collected/returned lifecycle (change request) | ✅ Complete — status extended |
| REQ-6 — Filter by equipment, date, status | ✅ Complete |
| Automated test suite | ✅ Complete — 11 test cases, all passing |
| Test data cleanup | ✅ Complete — `TEST_` prefix strategy + `deleteBooking` |

**What was built:** A two-role booking portal where staff submit equipment requests with a date, start/end time, and purpose. Lab assistants review requests through a modal, provide a mandatory comment, and can approve or reject them. After approval, assistants can mark equipment as collected and later returned. Filters on both dashboards query the backend directly, and the access scope (own vs. all) is enforced server-side.

---

## 2. Review Scoring Matrix

> **Score key:** 0 = missing · 1 = present but mostly not working · 2 = partially working with major gaps · 3 = mostly working with important gaps · 4 = working with minor gaps · 5 = complete for this case scope

| Feature / Area | Functionality 0–5 | Data Persistence 0–5 | Backend Security / Role Control 0–5 | Validation / Error Handling 0–5 | Testing Evidence 0–5 | Maintainability 0–5 | UI / Manual Usability 0–5 | Evidence | Notes |
|---|---:|---:|---:|---:|---:|---:|---:|---|---|
| Project setup and run commands | 4 | — | — | — | — | 4 | — | Root `package.json` scripts: `install:all`, `dev`, `db:setup`, `test`; README documents all steps | `npm run dev` starts both servers concurrently; `db:setup` is still a manual pre-step not chained into `dev` |
| Database setup and starter data | 5 | 5 | — | — | 4 | 4 | — | `config/schema.sql` — DROP+CREATE both tables, seeds 3 bcrypt users; `db-setup.js` reads and executes SQL; `npm run db:setup` documented | Re-running drops all data (no migrations); `db:setup` confirmed repeatable via git log; test suite validates DB connectivity |
| Login workflow | 5 | 5 | 4 | 4 | 5 | 4 | 5 | `POST /api/auth/login` — queries `users`, compares bcrypt hash, signs JWT; `LoginForm.jsx` posts to `/api/auth/login` via Vite proxy; token stored in `localStorage` | Test 2 asserts invalid password → 401 and valid logins → JWT with correct role; JWT fallback secret remains hard-coded in two source files |
| Role-based access | 5 | — | 5 | 4 | 5 | 4 | 5 | `getAuthenticatedUser` re-queries `users` table per request; role checked inline in each route; UI renders role-appropriate dashboard | Tests 3–6 cover role blocking (403) for assistant creation and staff approval; role loaded from DB not JWT payload |
| Main create action | 5 | 5 | 5 | 4 | 5 | 4 | 5 | `POST /api/bookings` — staff-only (403 otherwise); validates 5 required fields; `endTime > startTime`; inserts to DB; returns 201 + `{id, status:'pending'}` | Test 3 covers assistant block, missing fields, bad time ordering, valid creation; no future-date check |
| Main view/list action | 4 | 5 | 5 | 3 | 5 | 4 | 4 | `GET /api/bookings` — staff scoped to `requestedUser = username`; assistant gets all; filters via query params; `bookingService.getBookings` builds parameterised SQL | Test 4 asserts Alice sees only hers, Bob sees only his, Charlie sees all; `createdAt`/`updatedAt` not displayed in dashboard tables (REQ-3 gap) |
| Main update/status/cancel action | 4 | 5 | 5 | 5 | 5 | 4 | 4 | `PUT /api/bookings/:id` — staff-only, ownership check by username, `status=pending` guard; test 5 asserts Bob blocked from Alice's booking; test 7 asserts lock after approval | **No cancel/withdraw action** — mid-review gap H-1 remains; UI shows "Locked" for non-pending rows but no cancel button |
| Protected action | 5 | 5 | 5 | 5 | 5 | 4 | 5 | `PATCH /api/bookings/:id/status` — assistant-only (403); enum validated; `assistantComment` required for approve/reject (400 if blank); lifecycle transitions enforced | Tests 6, 6.1, 6.2, 6.3 cover approval, collection, return, and invalid transitions; staff → approve blocked with 403 |
| Secondary feature | 5 | 5 | 5 | 3 | 4 | 4 | 4 | `GET /api/bookings?equipmentName=…&bookingDate=…&status=…` — `bookingService` builds parameterised SQL; test 8 verifies filter result; staff `requestedUser` lock AND-combined with filters | Test 8 validates combined filter; no "Clear filters" UI button; equipment filter is free-text vs. fixed dropdown in BookingForm |
| Case-specific: equipment booking date/time and purpose fields | 5 | 5 | — | 4 | 5 | 4 | 5 | `bookingDate` (DATE), `startTime` (TIME), `endTime` (TIME), `purpose` (TEXT) in schema, form, and routes; `endTime > startTime` dual-enforced (frontend + backend) | `purpose` 500-char HTML `maxLength` only — not enforced by API or SQL; no future-date validation; test 3 covers time ordering rejection |
| Case-specific: booking approval/rejection with assistant comment | 5 | 5 | 5 | 5 | 5 | 4 | 5 | Full cycle: `ActionModal` → `PATCH /api/bookings/:id/status` → DB update → UI re-fetch; `assistantComment` required front (modal) and back (route) | Test 6 confirms blank comment → 400; approved booking stores and displays comment in both dashboards; lifecycle transitions tested end-to-end |
| Case-specific: staff-only ownership of own booking requests | 5 | — | 5 | 4 | 5 | 4 | 5 | `GET` scopes by `requestedUser = username`; `PUT` checks `existingBooking.requestedUser !== req.user.username` → 403; tests 4 and 5 cover both sides | Ownership checked by username string, not `requestedUserId` FK — low risk due to UNIQUE constraint; test evidence covers both read-isolation and write-isolation |
| UI / manual usability | 4 | — | — | — | — | 4 | 4 | Dark glassmorphic design; status badges; toast notifications; `ActionModal` for approve/reject; role-tagged header; loading state; empty-state cards | `createdAt`/`updatedAt` not in tables; no cancel booking button; no "Clear filters" button; purpose cell truncated with no expand |
| Security posture | 3 | — | 4 | — | 3 | 3 | — | JWT on all booking routes; role loaded from DB; DB credentials backend-only; `.env` not tracked by git (`git ls-files` shows empty result) | Hard-coded JWT fallback secret in `authRoutes.js:33` and `bookingRoutes.js:52`; CORS fully open (`cors()`); no Helmet; no rate limiting |
| Testing evidence | 5 | — | — | — | 5 | 4 | — | `backend/tests/run-tests.js` — 11 test cases using Node.js `assert` + native `fetch`; zero-dependency; test server on port 5099; `TEST_` prefix cleanup confirmed; `npm test` passes | All 11 tests passed live; `docs/TEST_PLAN.md` documents coverage; manual visual checklist also documented |
| Maintainability | 3 | — | — | — | — | 3 | — | Service layer (`bookingService.js`) separates SQL from routes; JSDoc on all service functions; `.env.example` provided; `TEST_PLAN.md` and `docs/` present | `getAuthenticatedUser` defined inline in `bookingRoutes.js` not extracted to `middleware/`; `RoleSwitcher.jsx` is dead code; no ESLint/Prettier; `LoginForm.jsx` pre-fills demo credentials |

---

## 3. Project Structure and Run Commands

```
p3/
├── package.json                  ← Root orchestrator (install:all, dev, db:setup, test)
├── README.md
├── REQUIREMENTS.md
├── Case_Brief.md
├── PROJECT_CONTEXT.md
├── MID_REVIEW.md
├── FINAL_REVIEW.md               ← this file
├── docs/
│   └── TEST_PLAN.md
├── backend/
│   ├── server.js                 ← Express entry point (port 5001)
│   ├── package.json              ← scripts: start, dev, db:setup, test
│   ├── .env                      ← local credentials (not git-tracked)
│   ├── .env.example              ← template committed to repo
│   ├── config/
│   │   ├── db.js                 ← mysql2/promise pool, testConnection()
│   │   ├── db-setup.js           ← reads and executes schema.sql
│   │   └── schema.sql            ← CREATE DATABASE, tables, seed users
│   ├── routes/
│   │   ├── authRoutes.js         ← POST /api/auth/login
│   │   └── bookingRoutes.js      ← GET/POST/PUT /api/bookings, PATCH /api/bookings/:id/status
│   ├── services/
│   │   └── bookingService.js     ← getBookings, createBooking, updateBooking, updateBookingStatus, deleteBooking
│   └── tests/
│       └── run-tests.js          ← 11 integration tests, auto-cleanup
└── frontend/
    ├── index.html
    ├── vite.config.js            ← proxy /api → http://localhost:5001
    ├── package.json
    └── src/
        ├── main.jsx
        ├── App.jsx               ← state hub, fetch handlers, role routing
        ├── index.css             ← dark glassmorphic design system
        └── components/
            ├── LoginForm.jsx
            ├── StaffDashboard.jsx
            ├── AssistantDashboard.jsx
            ├── BookingForm.jsx
            ├── ActionModal.jsx
            └── RoleSwitcher.jsx  ← dead code (never imported)
```

### Run commands

| Command | Action |
|---|---|
| `npm run install:all` | Install backend and frontend `node_modules` |
| `npm run db:setup` | Run `config/db-setup.js` → creates DB `c2p3`, tables, seeds 3 users |
| `npm run dev` | Start Express (port 5001) + Vite dev server (port 5173) concurrently |
| `npm test` | Run `backend/tests/run-tests.js` — 11 integration tests |

**Full first-run sequence:**
```bash
npm run install:all
# Edit backend/.env with your MySQL credentials
npm run db:setup
npm run dev
```

---

## 4. Frontend/Backend Separation Check

| Check | Result |
|---|---|
| React and Express are in separate directories | ✅ Yes — `frontend/` (Vite/React) and `backend/` (Express) are fully independent Node projects |
| React calls Express via HTTP, not directly to MySQL | ✅ Yes — all data access via `fetch('/api/…')` in `App.jsx`; no `mysql2` in frontend |
| API routing via Vite proxy | ✅ Yes — `vite.config.js` proxies `/api` to `http://localhost:5001`; no hardcoded backend URL in React source |
| DB credentials exposed to React bundle | ✅ No — `.env` is backend-only; Vite does not expose it to the browser |
| Express does not serve React files | ✅ Correct separation — Vite dev server handles frontend; Express handles API only |

The proxy configuration in `vite.config.js` (lines 9–14) transparently forwards `/api` calls from the browser to Express. In production a real reverse proxy (e.g., Nginx) would be needed — this is appropriate for a workshop prototype.

---

## 5. Database Setup and Table Summary

### Connection method

Configured in `backend/config/db.js` using `mysql2/promise` connection pool:

| Variable | Configured | Default if missing |
|---|---|---|
| `DB_HOST` | ✅ Yes | `localhost` |
| `DB_PORT` | ✅ Yes | `3306` |
| `DB_USER` | ✅ Yes | `root` |
| `DB_PASSWORD` | ✅ Yes | `''` (empty string) |
| `DB_NAME` | ✅ Yes | `c2p3` |

> **Note:** The `DB_PASSWORD` value in `backend/.env` is set and not empty. It is **not printed here**. The `.env` file is confirmed **not tracked by git** (`git ls-files backend/.env` returns empty). No `.gitignore` exists in `backend/` — the file simply was never `git add`-ed.

### Database tables

| Table | Columns | Role |
|---|---|---|
| `users` | `id`, `username` (UNIQUE), `role` ENUM(`staff`,`assistant`), `password` (bcrypt), `createdAt`, `updatedAt` | Authentication, role lookup |
| `bookings` | `id`, `equipmentName`, `requestedUser`, `requestedUserId` (FK → `users.id`), `bookingDate` (DATE), `startTime` (TIME), `endTime` (TIME), `purpose` (TEXT), `status` ENUM(`pending`,`approved`,`rejected`,`collected`,`returned`), `assistantComment`, `createdAt`, `updatedAt` | Core domain entity |

A `users` / login table **does exist**. It is the source of truth for both authentication (`authRoutes.js`) and role enforcement (`getAuthenticatedUser` in `bookingRoutes.js`).

### Recreating tables and seed data

Run `npm run db:setup` at any time. The script (`config/db-setup.js`) reads `config/schema.sql` and executes it with `multipleStatements: true`. The SQL begins with:
```sql
DROP TABLE IF EXISTS `bookings`;
DROP TABLE IF EXISTS `users`;
CREATE TABLE `users` …
CREATE TABLE `bookings` …
INSERT INTO `users` … -- alice_staff, bob_staff, charlie_assistant (all: password123)
```
**Effect:** Full reset — all existing data is destroyed and the 3 seed users are re-inserted. This is idempotent (no duplicate-key errors) but destructive of any production data. There is no migration system.

---

## 6. Login and Role/Access Explanation

### How the two roles log in

Both roles use the same login form (`LoginForm.jsx`). The form POSTs `{username, password}` to `/api/auth/login`.

The backend (`authRoutes.js`):
1. Queries `SELECT * FROM users WHERE username = ?`
2. Compares submitted password against the bcrypt hash via `bcrypt.compare()`
3. On match, signs a JWT containing `{ userId: user.id }` (not the role) with a 8-hour expiry
4. Returns `{ token, user: { id, username, role } }`

The frontend stores both the token and user object in `localStorage`. On every subsequent API call, the token is sent as `Authorization: Bearer <token>`.

### How roles are checked

`getAuthenticatedUser` middleware in `bookingRoutes.js` runs on every booking route:
1. Extracts and verifies the JWT
2. Queries `SELECT id, username, role FROM users WHERE id = ?` using the `userId` claim
3. Sets `req.user = { id, username, role }` from the **database row** — the role claim is **never read from the JWT payload**

This prevents client-side role spoofing: even if a user tampered with the JWT, the role would be re-fetched from the database.

### Access scope enforcement

| Action | Staff | Assistant |
|---|---|---|
| `GET /api/bookings` | Filtered by `requestedUser = req.user.username` | No extra filter — sees all |
| `POST /api/bookings` | Allowed | 403 Forbidden |
| `PUT /api/bookings/:id` | Allowed (own pending only) | 403 Forbidden |
| `PATCH /api/bookings/:id/status` | 403 Forbidden | Allowed |

---

## 7. Protected Action Explanation

**Protected action:** Approve or reject a booking request and record an assistant comment.

**Route:** `PATCH /api/bookings/:id/status`

### Backend checks (in order)

1. **Authentication** — `getAuthenticatedUser` middleware verifies JWT and loads user from DB (returns 401 if missing/invalid)
2. **Role check** — `req.user.role !== 'assistant'` → 403 Forbidden (blocks all staff)
3. **Booking existence** — `getBookingById(bookingId)` → 404 if not found
4. **Status enum** — must be one of `['approved', 'rejected', 'collected', 'returned']` → 400 if invalid
5. **Comment required** — for `approved` or `rejected`, `assistantComment` must be non-empty and non-whitespace → 400 if blank
6. **Lifecycle guard** — `collected` only from `approved`; `returned` only from `collected` → 400 for invalid transitions

### Frontend enforcement

- The `AssistantDashboard` is only rendered when `currentUser.role === 'assistant'` (checked in `App.jsx`)
- The `ActionModal` requires a non-empty comment before calling `onSubmit` (checked in `ActionModal.jsx:9–12`)
- Approve/Reject buttons only appear for `status === 'pending'` rows; Collected/Returned buttons are lifecycle-gated

### What the mid-review noted as missing (H-2)

The mid-review flagged that the `PATCH` route had no lifecycle guard — an assistant could re-approve an already approved booking. This has been **fixed**: lifecycle transitions are now enforced (test 6.3 confirms `collected → collected` returns 400).

---

## 8. Validation Summary

### Booking creation/update validation (frontend + backend)

| Rule | Frontend (`BookingForm`) | Backend (`bookingRoutes.js`) |
|---|---|---|
| All 5 fields required | ✅ Inline check before `onSubmit` | ✅ `validateBookingBody()` returns 400 |
| `endTime` > `startTime` | ✅ String comparison | ✅ String comparison (`endTime <= startTime` → 400) |
| `startTime` / `endTime` format HH:MM | ✅ `type="time"` browser enforcement | ✅ Regex `/^([01]\d|2[0-3]):[0-5]\d(:[0-5]\d)?$/` |
| `bookingDate` is a valid date | ✅ `type="date"` browser enforcement | ✅ `Date.parse()` check → 400 if NaN |
| `bookingDate` must be in the future | ❌ No restriction | ❌ Not validated |
| `purpose` max 500 chars | ✅ `maxLength="500"` on textarea | ❌ Not enforced at API layer |
| `assistantComment` max 255 chars | ✅ `maxLength="255"` on modal | ❌ Not enforced at API layer |
| `assistantComment` required for approve/reject | ✅ ActionModal check | ✅ Backend route check |
| Status enum | N/A — values hardcoded in UI | ✅ Array `includes()` check |
| Username and password required for login | ✅ `required` HTML attributes | ✅ Explicit null check → 400 |

---

## 9. Automated and Manual Testing Summary

### Automated tests

**Command:** `npm test` (from project root) — runs `backend/tests/run-tests.js`

**Test framework:** Zero-dependency — Node.js built-in `assert` + native `fetch` (Node 18+)

**Setup:** Starts a temporary Express server on port 5099; uses the real MySQL database connected via `.env`.

**Cleanup:** On completion (pass or fail), deletes all rows where `equipmentName LIKE 'TEST_%'` and closes the MySQL pool.

**Live result (run during this review):**
```
Test 1:  DB Connectivity                              PASSED
Test 2:  Authentication Login (invalid + valid)       PASSED
Test 3:  Booking Creation & Validation                PASSED
Test 4:  View Bookings Access Controls                PASSED
Test 5:  Editing Pending Booking Requests             PASSED
Test 6:  Reviewing status & decision comment rules    PASSED
Test 6.1 Assistant marking booking as collected       PASSED
Test 6.2 Assistant marking booking as returned        PASSED
Test 6.3 Enforcing invalid lifecycle transitions      PASSED
Test 7:  Locked action check (edit after approval)    PASSED
Test 8:  Dynamic filtering options                    PASSED

ALL TESTS PASSED SUCCESSFULLY ✅
Cleaning up test records... (done)
```

**What the tests cover:**
- DB connectivity
- Invalid login rejection (401) and valid multi-role login (JWT issuance)
- Assistant blocked from creating bookings (403)
- Missing fields (400) and invalid time ordering (400)
- Valid booking creation → pending status
- Staff data isolation (Alice sees only hers, Bob sees only his, Charlie sees all)
- Cross-user edit blocked (Bob → Alice's booking → 403)
- Own-user edit allowed (Alice → Alice's pending booking → 200)
- Staff approval attempt blocked (403)
- Blank assistant comment blocked (400)
- Valid assistant approval with comment (200)
- Collected lifecycle step (200)
- Returned lifecycle step (200)
- Invalid lifecycle transition `returned → collected` (400)
- Edit lock after approval (400)
- Combined filter query (equipment + status)

**What is NOT automated:**
- UI visual rendering, responsive layout, and toast notification display
- Browser login form submission flow
- Filter "Clear" UX behaviour
- `createdAt`/`updatedAt` display gap (would need browser test)
- Token expiry handling on the frontend
- Manual schema-reset verification (`npm run db:setup` twice)

**Manual verification checklist** is documented in `docs/TEST_PLAN.md` § 2.

---

## 10. Stage 11 Change Summary

Stage 11 introduced the **equipment collection and return lifecycle** — extending the booking status beyond the original `pending / approved / rejected` trio:

### What changed

| Item | Before Stage 11 | After Stage 11 |
|---|---|---|
| `status` ENUM in `schema.sql` | `pending, approved, rejected` | `pending, approved, rejected, collected, returned` |
| `PATCH /api/bookings/:id/status` accepted statuses | `approved`, `rejected` | `approved`, `rejected`, `collected`, `returned` |
| Lifecycle guards | None | `collected` only from `approved`; `returned` only from `collected` |
| `AssistantDashboard` action buttons | Approve / Reject only | + Mark Collected (when approved) + Mark Returned (when collected) |
| Test coverage | Not present | Tests 6.1, 6.2, 6.3 added |
| `docs/TEST_PLAN.md` | Not present | Added — documents automated and manual test steps |

### Comment handling for collect/return

When status is `collected` or `returned`, the `assistantComment` is optional. If not provided, the route preserves the existing comment from the original approval decision. This is the correct behaviour for audit continuity.

---

## 11. Stage Drift and Early Implementation

| Item | Assessment |
|---|---|
| `deleteBooking` service function | Present since mid-review — labelled "for test cleanup"; never exposed as an HTTP route. Now used by `run-tests.js` cleanup via `pool.query`. Low-risk early addition. |
| `RoleSwitcher.jsx` | Leftover from an earlier prototype that used mock users instead of JWT login. Never imported in the current app. Dead code. Not drift — it predates the current login system. |
| `collected`/`returned` status and lifecycle | Introduced as the Stage 11 change request. Not premature — added at the correct stage. |
| `docs/TEST_PLAN.md` | Added as part of the test stage. Appropriate timing. |
| `bcrypt`/JWT auth | Present from the initial commit. Expected for this case — no drift. |

**No features from future stages** (e.g., Helmet, rate limiting, CORS whitelisting, database migrations, user registration) appear to have been implemented.

---

## 12. Security Risks and Exposed-Secret Check

> Secrets are not printed. Keys are listed; values are redacted or described.

| Risk | Severity | Evidence | Status |
|---|---|---|---|
| Hard-coded JWT fallback secret | **High** | `authRoutes.js:33` and `bookingRoutes.js:52` both contain `process.env.JWT_SECRET \|\| 'super_secret_workshop_key'` — any deployment where `.env` is not set shares the same predictable secret | Not fixed. Present in final code. |
| `.env` file committed to git | **Resolved** | `git ls-files backend/.env` returns empty — the file is **not tracked**. No `.gitignore` exists but the file was simply never staged. Risk is present for a future `git add .` accident. | Low current risk; no `.gitignore` protection. |
| CORS fully open | **Medium** | `server.js:10` — `app.use(cors())` with no origin restriction. Any browser page on any domain can call the API in production. | Not fixed. Acceptable for workshop prototype. |
| No Helmet | **Low** | No `helmet` middleware — HTTP security headers (HSTS, X-Frame-Options, CSP) not set. | Not fixed. Workshop scope. |
| No rate limiting | **Low** | Login endpoint has no brute-force protection. | Not fixed. Workshop scope. |
| DB credentials not in React | ✅ Safe | `.env` is backend-only; Vite does not forward non-`VITE_`-prefixed vars to the browser. | Correct. |
| Passwords stored as bcrypt hash | ✅ Safe | `schema.sql` seeds bcrypt hashes; `authRoutes.js` uses `bcrypt.compare()`. | Correct. |
| Role loaded from DB, not JWT | ✅ Safe | `getAuthenticatedUser` always re-fetches `role` from `users` table. | Correct. |
| Login pre-fills demo credentials | **Low** | `LoginForm.jsx:4–5` pre-populates `alice_staff` / `password123` in React state — convenient for demo, a bad habit for any real deployment. | Not fixed. |

---

## 13. Documentation / Code Mismatches

| Document claim | Code reality | Mismatch? |
|---|---|---|
| `REQUIREMENTS.md` REQ-3 — display `createdAt` and `updatedAt` | Neither `StaffDashboard.jsx` nor `AssistantDashboard.jsx` renders these columns | ✅ **Mismatch** — these fields exist in the DB rows returned by the API but are not displayed |
| `REQUIREMENTS.md` REQ-4 — implies cancel/withdraw | No `DELETE` route or cancel PATCH exists | ✅ **Mismatch** — acknowledged gap since mid-review |
| `REQUIREMENTS.md` § 4 — `purpose` max 500 chars, `assistantComment` max 255 chars | Backend does not enforce these limits — only HTML `maxLength` | ✅ **Mismatch** — partial enforcement |
| `REQUIREMENTS.md` REQ-6 status filter dropdown — "containing `pending`, `approved`, and `rejected`" | Both dashboards also include `collected` and `returned` in the status dropdown | ✅ **Minor** — the change request added two statuses but the requirements text was not updated |
| `README.md` setup step 1 — suggests `mysql -u … < backend/config/schema.sql` | The canonical command is `npm run db:setup` which calls `db-setup.js` | ⚠️ **Minor inconsistency** — both work but the preferred automation script is not mentioned first |
| `MID_REVIEW.md` identified H-2 (no PATCH lifecycle guard) | Lifecycle guard is now implemented and tested (test 6.3) | ✅ **Fixed** — correctly resolved after mid-review |
| `MID_REVIEW.md` identified — no test files | `backend/tests/run-tests.js` now exists and all 11 tests pass | ✅ **Fixed** |

---

## 14. Known Limitations

| # | Limitation | Impact |
|---|---|---|
| L-1 | **No cancel booking action.** Staff cannot withdraw a pending request. | Medium — user must contact assistant to reject it |
| L-2 | **`createdAt`/`updatedAt` not displayed.** REQ-3 specifies these fields; they are in the DB and API response but hidden. | Low — data is there, just not shown |
| L-3 | **No future-date validation.** Staff can book equipment for a past date. | Low — a simple `bookingDate >= TODAY` check would fix it |
| L-4 | **`purpose` and `assistantComment` length limits only HTML-enforced.** Direct API calls can bypass the 500/255 char limits. | Low — workshop prototype, single-server deployment |
| L-5 | **Ownership checked by username string**, not `requestedUserId` FK. | Very low — `username` is UNIQUE; only a risk if usernames are ever reused after deletion |
| L-6 | **Hard-coded JWT fallback secret** in two source files. If `.env` is misconfigured, all deployments share one secret. | High for production; acceptable for workshop |
| L-7 | **No token expiry handling on frontend.** An expired token shows a red toast error but does not redirect to the login page. | Low — 8-hour expiry, workshop session |
| L-8 | **No `db:setup` in `npm run dev` chain.** First-time setup requires a manual extra step. | Low — README documents it |
| L-9 | **No "Clear filters" button.** Users must manually clear each filter field. | Low UX issue |
| L-10 | **`RoleSwitcher.jsx` is dead code.** Never imported; shipped in the bundle. | Negligible — Vite tree-shaking excludes it from the production build |
| L-11 | **Login form pre-populates `alice_staff` / `password123`.** Fine for demos, problematic for any real deployment. | Low for workshop |
| L-12 | **CORS is fully open.** No `origin` restriction passed to `cors()`. | Irrelevant in workshop localhost; critical in production |
| L-13 | **No ESLint or Prettier.** Code style enforced only by convention. | Maintainability concern |

---

## 15. Demo Script

**Duration:** ~8 minutes  
**Prerequisites:** Both servers running (`npm run dev`), database seeded, browser open at `http://localhost:5173`

---

**Step 1 — Staff creates a booking (2 min)**

1. On the login screen, use default credentials `alice_staff` / `password123`. Click **Login**.
2. Point out the role badge "STAFF" and the header showing "Logged in as: alice_staff".
3. Click **+ Request Equipment**.
4. Select "Centrifuge X1" from the equipment dropdown.
5. Set booking date to tomorrow, start time 09:00, end time 11:00, purpose "Protein separation experiment".
6. Click **Submit Request** — observe toast "Booking requested successfully!" and the new row with status badge **pending**.
7. Attempt to submit again without filling "Purpose" — observe frontend validation error.
8. Click **Logout**.

**Step 2 — Staff isolation check (1 min)**

1. Log in as `bob_staff` / `password123`.
2. Observe that Bob's dashboard is empty (or only Bob's bookings) — Alice's request is not visible.
3. **Log out**.

**Step 3 — Assistant review with comment (2 min)**

1. Log in as `charlie_assistant` / `password123`.
2. Observe all bookings visible, including Alice's "Centrifuge X1" request.
3. Click **Approve** on Alice's request.
4. In the modal, leave the comment blank and click Confirm — observe frontend validation error.
5. Enter comment "Slot confirmed — lab is free" and click **Confirm Approval**.
6. Observe the status badge changes to **approved** and the comment is displayed in the table.
7. Click **Mark Collected** on the approved row. Status updates to **collected**.
8. Click **Mark Returned** on the collected row. Status updates to **returned**.

**Step 4 — Staff sees the final status (1 min)**

1. **Log out** as Charlie. Log in as `alice_staff`.
2. Alice's booking now shows status **returned** and Charlie's comment.
3. The Edit button in the Actions column shows "Locked" — confirming the edit lock.

**Step 5 — Run automated tests (2 min)**

Open a terminal and run:
```bash
npm test
```
Show the 11 test lines passing and the cleanup confirmation. Explain what each test group covers.

---

## 16. Suggested Viva Questions

### Project structure and architecture

1. *"Explain why the React frontend never connects directly to MySQL."*  
   → Expected: Vite proxy forwards `/api` calls to Express; only Express uses `mysql2`.

2. *"If you deployed this to a public server and removed the Vite dev server, how would the React app still reach the Express API?"*  
   → Expected: A reverse proxy (Nginx/Apache) or serving the React build from Express itself.

3. *"What is the purpose of the `vite.config.js` proxy configuration?"*  
   → Expected: Avoid CORS issues in development by transparently forwarding `/api` requests from port 5173 to port 5001.

### Database and security

4. *"Why does `getAuthenticatedUser` re-query the database on every request instead of reading the role from the JWT payload?"*  
   → Expected: Prevents client-side role spoofing — if a user forged a JWT with `role: 'assistant'`, the DB lookup would return their actual `staff` role.

5. *"What would happen if the `JWT_SECRET` environment variable was not set in `.env`?"*  
   → Expected: The fallback `'super_secret_workshop_key'` is used — a known, weak secret that anyone who reads the source code can use to forge tokens.

6. *"Your `.env` file has no `.gitignore`. What is the risk, and how would you fix it?"*  
   → Expected: A `git add .` would commit the real password. Fix: add `.env` to `.gitignore` in the backend folder.

7. *"How are passwords stored and verified in this system?"*  
   → Expected: Bcrypt hashes stored in `users.password`; `bcrypt.compare()` in `authRoutes.js` at login.

### Role and ownership enforcement

8. *"Walk me through what happens server-side when `bob_staff` tries to edit Alice's booking."*  
   → Expected: JWT verified → user loaded from DB → role is `staff` ✅ → `getBookingById` → `existingBooking.requestedUser !== req.user.username` → 403.

9. *"Could a staff member approve their own booking by calling the API directly with a crafted request?"*  
   → Expected: No — `PATCH /api/bookings/:id/status` checks `req.user.role !== 'assistant'` and returns 403 regardless of payload content.

10. *"How does the system ensure a staff member only sees their own bookings?"*  
    → Expected: `GET /api/bookings` — when `req.user.role === 'staff'`, `filters.requestedUser = req.user.username` is injected before calling `bookingService.getBookings()`.

### Validation and testing

11. *"You validate `endTime > startTime` in both the frontend and backend. Why do you need both?"*  
    → Expected: Frontend check gives immediate user feedback (UX). Backend check is the authoritative security guard — anyone can bypass the frontend by calling the API directly.

12. *"What does `npm test` actually do, and how does it clean up after itself?"*  
    → Expected: Starts a temporary Express server on port 5099, runs 11 `assert`-based integration tests using real DB, then deletes all rows where `equipmentName LIKE 'TEST_%'` and closes the connection pool.

13. *"Your `purpose` field has a 500-character limit in the form, but none in the backend. What is the risk?"*  
    → Expected: A direct API call with a very long `purpose` would store it in the `TEXT` column without truncation. Fix: add an API-layer length check in `validateBookingBody`.

### Lifecycle and change request

14. *"What is the sequence of status transitions a booking can go through?"*  
    → Expected: `pending → approved → collected → returned` (happy path); `pending → rejected` (rejection path). Invalid transitions return 400.

15. *"Why is the assistant comment preserved when marking a booking as `collected` or `returned`?"*  
    → Expected: The original approval comment serves as audit trail. The collect/return transition uses the existing comment unless a new one is supplied.

---

*End of Final Review — Equipment Booking System (p3)*  
*Review date: 2026-06-06 · All 11 automated tests confirmed passing at time of review*
