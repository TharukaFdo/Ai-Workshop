# Final Review — Equipment Booking System (Case 2 / Project 2)

**Review date:** 2026-06-06  
**Reviewed by:** Evidence-based static + live code inspection (no source code was modified).  
**Scope:** React 18 (Vite) + Node.js/Express + local MySQL. Two roles: Staff Member, Lab Assistant.  
**Test result (live):** ✅ All 13 automated integration & spoofing tests passed on this machine at time of review.

---

## 1. Final Feature Summary

The Equipment Booking System is a fully separated, database-backed single-page application. The React frontend talks exclusively to an Express REST API, which in turn talks to a local MySQL database. There is no direct MySQL access from the browser.

| Feature | Status | Evidence |
|---|---|---|
| DB-backed login with session token | ✅ Complete | `POST /api/auth/login` → `sessions` table |
| Logout (client-side only) | ⚠️ Partial | localStorage cleared; DB token **not** invalidated |
| Staff: create booking request | ✅ Complete | `POST /api/bookings` |
| Staff: view own bookings only | ✅ Complete | `GET /api/bookings` — `AND requestedUser = ?` enforced in backend |
| Staff: cancel/withdraw own pending booking | ❌ Missing | No route or UI element |
| Assistant: view all bookings | ✅ Complete | `GET /api/bookings` — no ownership filter for Assistant role |
| Assistant: approve with optional comment | ✅ Complete | `PUT /api/bookings/:id/status` |
| Assistant: reject with required comment | ✅ Complete | Backend 400 if comment empty on Rejected status |
| Status lifecycle: Pending → Approved / Rejected | ✅ Complete | State machine in `bookings.js` |
| Status lifecycle: Approved → Collected → Returned | ✅ Complete | Three additional states; transitions enforced |
| Filter by equipment, date, status | ✅ Complete | Query params applied server-side with parameterised queries |
| Comment stored and displayed | ✅ Complete | `assistantComment` column; shown on booking card |
| API health check | ✅ Present | `GET /api/health` |
| Passwords hashed | ❌ Missing | Plaintext comparison in `auth.js` and seed data |
| Server-side logout endpoint | ❌ Missing | No `DELETE /api/auth/session` route |
| CORS locked to origin | ❌ Missing | `cors()` with no options — open `*` |
| `.gitignore` | ❌ Missing | Not found anywhere in the project tree |
| Helmet / security headers | ❌ Missing | Not installed |
| README with setup docs | ✅ Added | `README.md` present at project root (added after mid-review) |
| Automated integration tests | ✅ Complete | 13 tests, all passed live |

---

## 2. Review Scoring Matrix

Scores reflect the **completed project** after testing, security hardening, maintainability cleanup, and the Stage 11 change request (Collected/Returned lifecycle). The Testing Evidence column covers implemented automated tests, manual-verification coverage, test-data cleanup, and reported results.

| Feature / Area | Functionality 0-5 | Data Persistence 0-5 | Backend Security / Role Control 0-5 | Validation / Error Handling 0-5 | Testing Evidence 0-5 | Maintainability 0-5 | UI / Manual Usability 0-5 | Evidence | Notes |
|---|---:|---:|---:|---:|---:|---:|---:|---|---|
| Project setup and run commands | 5 | 5 | 3 | 4 | 3 | 4 | 5 | `client/package.json` (`dev`), `server/package.json` (`dev`, `db:setup`, `test`), Vite proxy, README | README now present with full setup steps. Still requires two terminals (no root script). `.env.example` DB_NAME (`lab_equipment_booking`) differs from actual `.env` (`c2p1`) — doc/code mismatch. |
| Database setup and starter data | 5 | 5 | 3 | 4 | 4 | 4 | 5 | `schema.sql`, `db-setup.js`, `npm run db:setup` | Fully repeatable with a single command. Drops and recreates tables (destructive but acceptable for workshop). Seed data covers all three statuses. Passwords remain plaintext in seed. |
| Login workflow | 4 | 5 | 2 | 4 | 5 | 4 | 5 | `routes/auth.js`, `middleware/auth.js`, Test 1 & 2 | DB-backed session token with `crypto.randomUUID()`. Token verified in DB on every request. Password stored and compared in plaintext — critical gap. Logout clears `localStorage` only; token stays live in DB. |
| Role-based access | 5 | 5 | 5 | 4 | 5 | 4 | 5 | `middleware/auth.js`, `routes/bookings.js`, Tests 5 & 9 | Role re-read from `users` table on every authenticated request — cannot be spoofed by client. Staff blocked from status update (403). Assistant blocked from booking creation (403). |
| Main create action | 5 | 5 | 5 | 5 | 5 | 4 | 5 | `routes/bookings.js` L45-81, Tests 3 & 4 | All five fields validated. Past-date guard. `startTime < endTime` guard. `requestedUser` always set from session. Test 10 confirms body spoofing of `requestedUser` is silently ignored. |
| Main view/list action | 5 | 5 | 5 | 4 | 5 | 4 | 5 | `routes/bookings.js` L8-42, Tests 8 & 11 | Staff scope enforced server-side. Assistant sees all. Test 11 confirms `?requestedUser=bob_staff` from Staff token only returns their own rows. Ordered `bookingDate DESC, createdAt DESC`. |
| Main update/status/cancel action | 2 | 2 | 3 | 2 | 2 | 2 | 2 | `routes/bookings.js` L84-132 | No cancel/withdraw action for Staff on their own Pending bookings. The only update route is the Assistant approval/rejection route. This gap was present at mid-review and remains unresolved. |
| Protected action | 5 | 5 | 5 | 5 | 5 | 4 | 5 | `routes/bookings.js` L84-132, `DecisionModal.jsx`, Tests 5, 6 & 7 | Role check (403 non-Assistant). Status enum check (400 invalid). Comment required for Rejection (400 if empty). State transition machine blocks re-approving an already-decided booking. Both frontend and backend enforce comment requirement. |
| Secondary feature | 5 | 5 | 5 | 4 | 4 | 4 | 5 | `routes/bookings.js` L10-34, `FilterBar.jsx`, Test 8 | Three filters (equipment, date, status) applied server-side using parameterised queries. Filter bar auto-refetches on change. Test 8 validates status filter returns only matching rows. |
| Case-specific: equipment booking date/time and purpose fields | 5 | 5 | 5 | 5 | 5 | 4 | 5 | `schema.sql` L30-43, `routes/bookings.js` L52-65, `BookingForm.jsx` | `bookingDate` (DATE), `startTime` (TIME), `endTime` (TIME), `purpose` (TEXT) — all present in DB schema, validated on backend, and collected from UI form inputs. `min` attribute on date picker prevents past dates in browser. Backend also rejects past dates. |
| Case-specific: booking approval/rejection with assistant comment | 5 | 5 | 5 | 5 | 5 | 4 | 5 | `routes/bookings.js` L83-132, `DecisionModal.jsx`, `BookingCard.jsx`, Tests 6 & 7 | Comment stored in `assistantComment` TEXT column. Rejection mandates non-empty comment (backend 400 + frontend `required`). Approval accepts optional comment. Comment displayed on every booking card where it is non-null. Test 7 verifies full rejection flow live. |
| Case-specific: staff-only ownership of own booking requests | 5 | 5 | 5 | 5 | 5 | 4 | 4 | `routes/bookings.js` L16-18 & L46-50, Tests 10 & 11 | `requestedUser` is always taken from `req.user.username` (session-resolved), never from the request body or URL. Staff GET query is forced to `AND requestedUser = ?`. Test 10 proves body injection is silently discarded. Test 11 proves query-param bypass is blocked. No cancel/edit own booking — minor gap. |
| UI / manual usability | 4 | 3 | 3 | 4 | 2 | 3 | 5 | `index.css` (453 lines), `App.jsx`, all components | Dark glassmorphism design; two custom Google Fonts; colour-coded status badges; loading spinner; 5-second auto-clearing success toast; demo credentials shown on login page. Staff layout uses responsive 1:2 grid above 900px. Assistant layout has no responsive breakpoint (full-width only). |
| Security posture | 2 | 3 | 3 | 3 | 2 | 2 | 3 | `server/index.js`, `server/.env`, `server/routes/auth.js` | Token-based DB session is a good foundation. Critical gaps remain: plaintext passwords, open CORS (`*`), no `helmet`, no session expiry, no rate limiting, no logout endpoint, no `.gitignore`. These issues were flagged at mid-review and none were resolved. |
| Testing evidence | 5 | 5 | 5 | 5 | 5 | 4 | 3 | `server/test.js` (332 lines, 13 tests) — live run confirmed ✅ all passed | 13 live integration tests covering login, invalid login, past-date validation, booking creation, role boundary (Staff cannot approve), reject-comment validation, successful rejection, filter validation, spoofing via custom headers, spoofing via body, spoofing via query params, full Collected/Returned lifecycle, and invalid transition blocking. DB cleanup in `finally` block. |
| Maintainability | 3 | 3 | 3 | 3 | 3 | 3 | 3 | `client/src/`, `server/`, README | Code is modularly split into components and routes. README added. Issues: inline styles mixed with CSS classes throughout JSX; no JSDoc; equipment list hardcoded in frontend; no error boundary; no repository layer; `test.js` imports the real `pool` and server, making it an integration test only (no unit tests). |

---

## 3. Project Structure and Run Commands

```
p2/
├── Case_Brief.md
├── MID_REVIEW.md
├── README.md
│
├── client/                         # React 18 Frontend (Vite 5)
│   ├── index.html
│   ├── package.json                # scripts: dev, build, preview
│   ├── vite.config.js              # port 3000; proxy /api → localhost:5000
│   └── src/
│       ├── main.jsx
│       ├── App.jsx                 # State orchestrator (316 lines)
│       ├── index.css               # Glassmorphism design system (453 lines)
│       └── components/
│           ├── LoginForm.jsx       # Authentication form
│           ├── FilterBar.jsx       # Equipment / date / status filters
│           ├── BookingForm.jsx     # Staff booking request form
│           ├── BookingCard.jsx     # Booking display card with action controls
│           └── DecisionModal.jsx   # Assistant comment modal
│
└── server/                         # Express 4 Backend
    ├── package.json                # scripts: start, dev, db:setup, test
    ├── .env                        # Real credentials (not committed)
    ├── .env.example                # Template (DB_NAME mismatch — see §12)
    ├── index.js                    # App entry point; mounts routes (36 lines)
    ├── db.js                       # mysql2/promise pool (31 lines)
    ├── db-setup.js                 # Runs schema.sql statement-by-statement
    ├── schema.sql                  # DDL + seed data
    ├── test.js                     # 13 integration & spoofing tests (332 lines)
    ├── middleware/
    │   └── auth.js                 # Bearer token → DB session → role lookup
    └── routes/
        ├── auth.js                 # POST /api/auth/login
        └── bookings.js             # GET, POST /api/bookings; PUT /:id/status
```

### Run Commands

```bash
# 1. First-time database setup (run once, or to reset)
cd server
npm install
npm run db:setup

# 2. Start backend (keep terminal open)
cd server
npm run dev          # nodemon watches for changes on port 5000

# 3. Start frontend (separate terminal)
cd client
npm install
npm run dev          # Vite dev server on port 3000

# 4. Run automated tests (server must NOT be running on port 5000 during test)
cd server
npm test             # Spins up isolated server on port 5002, runs 13 tests, cleans up
```

Open `http://localhost:3000` in a browser. The Vite proxy forwards all `/api/*` requests to `http://localhost:5000`.

---

## 4. Frontend/Backend Separation Check

| Question | Answer |
|---|---|
| Are React and Express in separate directories? | **Yes.** `client/` and `server/` are fully independent folders with their own `package.json`, `node_modules`, and `npm run dev` commands. |
| Does React ever connect to MySQL directly? | **No.** The `client/` folder contains no database driver. All data access goes through `fetch('/api/...')` calls. |
| How does React reach Express in development? | Vite's `server.proxy` config forwards every `/api/*` request from `localhost:3000` to `localhost:5000`. The React code uses relative paths (`/api/bookings`) and never hardcodes `localhost:5000`. |
| Are database credentials present anywhere in the React code? | **No.** All credentials live in `server/.env` only. |

---

## 5. Database Setup and Table Summary

### Connection Method

`server/db.js` creates a `mysql2/promise` connection pool using environment variables:

| Variable | Configured? | Source |
|---|---|---|
| `DB_HOST` | ✅ Yes | `process.env.DB_HOST \|\| 'localhost'` |
| `DB_PORT` | ✅ Yes | `process.env.DB_PORT \|\| '3306'` |
| `DB_USER` | ✅ Yes | `process.env.DB_USER \|\| 'root'` |
| `DB_PASSWORD` | ✅ Yes | `process.env.DB_PASSWORD \|\| ''` (password not printed here) |
| `DB_NAME` | ✅ Yes | `process.env.DB_NAME \|\| 'c2p1'` |

All five variables are set in `server/.env`. The pool uses `waitForConnections: true`, `connectionLimit: 10`.

### Database Tables

| Table | Purpose | Key Columns |
|---|---|---|
| `users` | Authentication source of truth; login table | `id`, `username` (UNIQUE), `password` (plaintext ⚠️), `role` ENUM('Staff','Assistant') |
| `sessions` | Server-side session token store | `id`, `token` (UNIQUE), `username` FK → `users.username`, `createdAt` |
| `bookings` | Main entity | `id`, `equipmentName`, `requestedUser` FK, `bookingDate` DATE, `startTime` TIME, `endTime` TIME, `purpose` TEXT, `status` ENUM(Pending/Approved/Rejected/Collected/Returned), `assistantComment` TEXT NULL |

A `users` table exists and is the login source of truth. Login does not use mocks or role selectors.

### Seed Data (from `schema.sql`)

| Username | Role | Password |
|---|---|---|
| `alice_staff` | Staff | `password123` (plaintext) |
| `bob_staff` | Staff | `password123` (plaintext) |
| `clara_assistant` | Assistant | `password123` (plaintext) |

Three sample bookings cover Pending, Approved, and Rejected statuses.

### Recreating Tables and Seed Data

Run `npm run db:setup` inside the `server/` directory at any time. This executes `db-setup.js`, which:
1. Connects without specifying a database.
2. Creates the database if it does not exist (`CREATE DATABASE IF NOT EXISTS`).
3. Reads `schema.sql` and executes each statement in sequence.
4. `schema.sql` issues `DROP TABLE IF EXISTS` for `bookings`, `sessions`, `users` (in dependency order), then recreates them and inserts seed rows.

**Effect:** Every run destroys and recreates all data. This is intentional for a workshop environment but would be destructive in production.

---

## 6. Login and Role/Access Explanation

### Login Flow

1. User submits `POST /api/auth/login` with `{ username, password }`.
2. Backend queries the `users` table for a matching `username`.
3. If found, password is compared in plaintext (⚠️ no bcrypt).
4. On success, `crypto.randomUUID()` generates a unique session token which is inserted into the `sessions` table.
5. The response contains `{ token, username, role }`.
6. React stores this payload in `localStorage` and passes the `token` as an `Authorization: Bearer <token>` header on all subsequent API calls.

### Role Verification on Every Request

The `authenticate` middleware (`server/middleware/auth.js`) runs on every protected route:

1. Extracts the Bearer token from the `Authorization` header.
2. Queries `sessions` table: `SELECT username FROM sessions WHERE token = ?`.
3. If the session exists, queries `users` table: `SELECT role FROM users WHERE username = ?`.
4. Attaches `{ username, role, token }` to `req.user`.

The role is **re-read from the database on every request**, not decoded from a client-supplied JWT or header. A client cannot spoof their role by modifying request headers or bodies.

### Role-Based Guards

| Action | Allowed Roles | Enforcement |
|---|---|---|
| `POST /api/bookings` (create) | Staff only | `if (role !== 'Staff') return res.status(403)` |
| `GET /api/bookings` (list) | Both — but scoped | Staff query appends `AND requestedUser = username`; Assistant sees all |
| `PUT /api/bookings/:id/status` (approve/reject/collect/return) | Assistant only | `if (role !== 'Assistant') return res.status(403)` |

### Staff Ownership Scope

When `role === 'Staff'`, the `GET /api/bookings` route automatically adds:

```sql
AND requestedUser = ?    -- bound to req.user.username
```

This is non-bypassable. Even if the client sends `?requestedUser=bob_staff`, that query parameter is **not** a recognised filter; the backend never reads `requestedUser` from query params. Test 11 confirms this: a `test_staff` token requesting `?requestedUser=bob_staff` returns only `test_staff`'s own records.

---

## 7. Protected Action Explanation

**Protected action:** Approve or reject a booking request and record an assistant comment.

**Route:** `PUT /api/bookings/:id/status` (`server/routes/bookings.js` L84-132)

**Enforcement chain:**

1. **Authentication** — `authenticate` middleware rejects any request without a valid session token (HTTP 401).
2. **Role check** — `if (role !== 'Assistant')` returns HTTP 403. Staff cannot approve or reject any booking, including their own.
3. **Status enum validation** — Only `['Approved', 'Rejected', 'Collected', 'Returned']` are accepted; any other value returns HTTP 400.
4. **Comment requirement** — If `status === 'Rejected'` and `assistantComment` is empty or whitespace, returns HTTP 400.
5. **State machine transitions** — Enforced at the backend:
   - `Approved` or `Rejected` only from `Pending`.
   - `Collected` only from `Approved`.
   - `Returned` only from `Collected`.
   - Any transition that violates these rules returns HTTP 400 with a descriptive message.
6. **Booking existence check** — Returns HTTP 404 if the booking ID does not exist.

**Frontend enforcement (secondary, not security-critical):**
- Approve/Reject buttons shown only to `Assistant` role and only on `Pending` bookings (`BookingCard.jsx`).
- Collect/Return buttons shown contextually for `Approved`/`Collected` states.
- `DecisionModal.jsx` marks the comment `textarea` as `required` when `actionType === 'Rejected'`.

---

## 8. Validation Summary

### Backend Validation (`server/routes/`)

| Rule | Location | HTTP Response |
|---|---|---|
| Username and password required on login | `auth.js` L10-12 | 400 |
| Invalid credentials | `auth.js` L17-18 | 401 |
| Unauthenticated request (missing/invalid token) | `middleware/auth.js` L6-16 | 401 |
| All 5 booking fields required on create | `bookings.js` L54-56 | 400 |
| Booking date must not be in the past | `bookings.js` L58-61 | 400 |
| Start time must be earlier than end time | `bookings.js` L63-65 | 400 |
| `requestedUser` set from session (never from body) | `bookings.js` L68-70 | N/A — silently overridden |
| Only Assistant can create status update | `bookings.js` L89-91 | 403 |
| Only Staff can create bookings | `bookings.js` L48-50 | 403 |
| Status must be a valid enum value | `bookings.js` L93-95 | 400 |
| Comment required when Rejecting | `bookings.js` L97-99 | 400 |
| Booking must exist before status update | `bookings.js` L102-105 | 404 |
| State transition guard (Pending → Approved/Rejected) | `bookings.js` L110-112 | 400 |
| State transition guard (Approved → Collected) | `bookings.js` L113-115 | 400 |
| State transition guard (Collected → Returned) | `bookings.js` L116-118 | 400 |

### Frontend Validation (`client/src/`)

| Rule | Location | Method |
|---|---|---|
| All booking fields required (UI check before submit) | `App.jsx` L127-130 | Inline guard + error message |
| Date picker `min` = today | `BookingForm.jsx` L35 | HTML `min` attribute |
| All form inputs marked `required` | `BookingForm.jsx`, `LoginForm.jsx` | HTML5 `required` |
| Comment required for Rejection | `App.jsx` L168-172, `DecisionModal.jsx` L31 | Guard + HTML `required` |

### Known Validation Gaps

- No maximum length on `purpose` or `assistantComment` (DB schema uses TEXT; no `maxlength` on inputs).
- No duplicate booking detection (same equipment, same user, overlapping time slot).
- No check that the booking window is within a single calendar day.
- Frontend date `min` is bypassed if the user submits via API — backend correctly enforces the past-date rule independently.

---

## 9. Automated and Manual Testing Summary

### Automated Tests

**Command:** `cd server && npm test` (runs `node test.js`)  
**Framework:** Node.js built-in `assert` module + native `fetch`  
**Live result (run during this review):** ✅ All 13 tests passed

| # | Test Name | What It Checks | Result |
|---|---|---|---|
| 1 | Secure Login & Token Generation | `POST /api/auth/login` returns 200 and a valid token | ✅ Pass |
| 2 | Invalid Login | Wrong password returns 401 | ✅ Pass |
| 3 | Booking Past Date Prevention | Booking with `bookingDate: '2020-01-01'` returns 400 | ✅ Pass |
| 4 | Successful Booking Creation | Valid booking for future date returns 201 with `bookingId` | ✅ Pass |
| 5 | Role Boundary — Staff cannot update status | Staff token on `PUT /api/bookings/:id/status` returns 403 | ✅ Pass |
| 6 | Rejection Comment Required | Empty comment on Rejected status returns 400 | ✅ Pass |
| 7 | Assistant Rejection Action | Valid rejection with comment returns 200 | ✅ Pass |
| 8 | Booking List Filter Validation | `?status=Rejected` returns only Rejected bookings | ✅ Pass |
| 9 | Spoofing — Custom headers ignored | Request with `x-user-role: Assistant` but no Bearer token returns 401 | ✅ Pass |
| 10 | Spoofing — Body `requestedUser` ignored | Booking created with spoofed `requestedUser` in body is saved under session owner | ✅ Pass |
| 11 | Spoofing — Query param scope bypass blocked | Staff token with `?requestedUser=bob_staff` only returns own bookings | ✅ Pass |
| 12 | Valid Collection & Return Transitions | Pending → Approved → Collected → Returned, each step 200; DB verified | ✅ Pass |
| 13 | Invalid Transitions Blocked | Pending → Collected returns 400; Approved → Returned returns 400 | ✅ Pass |

**Test data lifecycle:** The `runTests()` function inserts `test_staff` and `test_assistant` users at the start using `INSERT IGNORE`. A `finally` block always runs `DELETE FROM bookings WHERE requestedUser IN ('test_staff', 'bob_staff')`, then deletes sessions and users. The main seed accounts (`alice_staff`, `bob_staff`, `clara_assistant`) are untouched.

**What is not automated:**
- No unit tests for individual functions or middleware in isolation.
- No UI / end-to-end browser tests (no Playwright or Cypress).
- No test for the logout session-invalidation gap (the gap is documented in this review as a known limitation).
- Filter tests only check `status=Rejected`; `equipmentName` and `bookingDate` filters are not covered by automated tests.

### Manual Verification Performed for This Review

1. Browsed `http://localhost:3000` — login page rendered with demo credentials shown.
2. Logged in as `alice_staff` — booking form visible; list shows only Alice's bookings; no Approve/Reject buttons.
3. Logged in as `clara_assistant` — no booking form; all bookings visible; Approve/Reject buttons present on Pending rows.
4. Applied each filter (equipment, date, status) — list updated on each change.
5. Submitted a booking with a past date — backend rejected with error message shown.
6. Attempted to reject without a comment — both frontend and backend blocked.
7. Approved a booking as Assistant with an optional comment — comment appeared on card.
8. Ran `npm test` — all 13 tests passed (output recorded above).

---

## 10. Stage 11 Change Summary

The Stage 11 change request extended the booking status lifecycle with two new states: **Collected** and **Returned**.

### Changes Made

**Backend (`server/routes/bookings.js`):**
- Status enum validation extended: `['Approved', 'Rejected', 'Collected', 'Returned']`.
- Two new transition guards added:
  - `Collected` only allowed from `Approved`.
  - `Returned` only allowed from `Collected`.
- Comment carryforward logic: if no new comment is provided on a `Collected` or `Returned` transition, the existing `assistantComment` is preserved.

**Database (`server/schema.sql`):**
- `status` ENUM extended from `('Pending', 'Approved', 'Rejected')` to `('Pending', 'Approved', 'Rejected', 'Collected', 'Returned')`.

**Frontend (`client/src/components/BookingCard.jsx`):**
- "Mark as Collected" button rendered for `status === 'Approved'` bookings (Assistant only).
- "Mark as Returned" button rendered for `status === 'Collected'` bookings (Assistant only).

**Frontend (`client/src/components/FilterBar.jsx`):**
- Collected and Returned added to the status filter dropdown.

**Automated Tests (`server/test.js`):**
- Test 12: Full lifecycle Pending → Approved → Collected → Returned — each step verified against DB.
- Test 13: Invalid transitions (Pending → Collected, Approved → Returned) verified to return 400.

---

## 11. Stage Drift and Early Work

| Item | Assessment |
|---|---|
| `server/test.js` present before testing stage | The file existed at mid-review (8 tests). It was an early implementation of the testing stage. Not harmful — tests are runnable. Count this as ahead of schedule, not a violation. |
| `GET /api/health` endpoint | Useful convenience endpoint; not a case requirement. Minor forward reach — no impact. |
| `sessions` table with server-side token store | Architecture is correct and appropriate. The gap (logout not deleting the row) is an omission, not early work. |
| README added after mid-review | Mid-review flagged "No README" as a fail. README is now present. This is a resolved finding, not drift. |
| Stage 11 `Collected`/`Returned` states | Implemented as part of the explicit Stage 11 change request. Not premature. |

No features outside the case scope (e.g., notifications, booking history, admin panel, equipment management) were detected.

---

## 12. Security Risks and Exposed-Secret Check

### Exposed-Secret Risk

| Risk | Location | Status |
|---|---|---|
| `.env` file with real credentials in the project directory | `server/.env` | ⚠️ **High risk** — no `.gitignore` found anywhere in the project. If this directory is committed to a repository, credentials will be exposed. |
| `DB_PASSWORD` in `.env` | `server/.env` | Password exists (value not printed in this review). |
| Plaintext passwords in `schema.sql` seed data | `schema.sql` L46-49 | Seed account passwords are hardcoded in plaintext in a committed SQL file. These are workshop demo passwords but should be noted. |
| `DB_NAME` mismatch in `.env.example` | `.env.example` uses `lab_equipment_booking`; actual `.env` uses `c2p1` | Documentation mismatch — a developer following the example would configure the wrong database. |
| `DB_PORT` absent from `.env.example` | `.env.example` | Developer cannot set a custom port by following the example alone. |

### Security Gaps in Code

| Gap | Severity | Location |
|---|---|---|
| Passwords stored and compared as plaintext | Critical | `schema.sql`, `routes/auth.js` L17 |
| CORS open to all origins (`cors()` with no config) | High | `server/index.js` L13 |
| No `helmet` (missing security headers) | Medium | `server/index.js` |
| Session tokens never expire (no TTL or `expiresAt`) | Medium | `sessions` table, `middleware/auth.js` |
| Logout does not invalidate server-side session token | Medium | `App.jsx` L114-119; no `DELETE /api/auth/session` route |
| No rate limiting on login endpoint | Medium | `routes/auth.js` |
| No `.gitignore` protecting `.env` | Critical (ops risk) | Project root and `server/` |

---

## 13. Documentation/Code Mismatches

| # | Mismatch | Document | Code |
|---|---|---|---|
| M1 | `DB_NAME` default value | `.env.example` says `lab_equipment_booking` | `db.js` L11 fallback and actual `.env` use `c2p1` |
| M2 | `DB_PORT` missing from example | `.env.example` does not list `DB_PORT` | `db.js` L8 reads `process.env.DB_PORT`; real `.env` has it |
| M3 | README test count | `README.md` L84 says "11 security and controller integrations" | `test.js` has **13** tests (count was not updated after Stage 11 added Tests 12 & 13) |
| M4 | Mid-review showed all code in `index.js` | `MID_REVIEW.md` scoring rows reference `index.js` line numbers for routes | Routes were refactored into `routes/auth.js` and `routes/bookings.js` before or during mid-review; `index.js` is now only 36 lines (entry point). The mid-review scores reference correct behaviour but stale line numbers. |

---

## 14. Known Limitations

1. **No password hashing.** Passwords are stored as plaintext in the `users` table and compared directly. A database breach exposes all credentials.
2. **Logout does not revoke server-side session.** Copying the token before logout and reusing it will succeed. The token remains in the `sessions` table indefinitely.
3. **No session expiry.** Tokens live forever unless the database is wiped.
4. **No `.gitignore`.** The `.env` file and its database password would be committed if a `git init` were run in this directory.
5. **CORS fully open.** Any origin can call the Express API. In production this would need to be locked to the frontend's domain.
6. **No `helmet`.** Security headers (CSP, HSTS, X-Frame-Options, etc.) are absent.
7. **Staff cannot cancel or withdraw their own Pending bookings.** There is no `DELETE /api/bookings/:id` or cancel/withdraw route.
8. **Equipment list hardcoded in frontend.** `EQUIPMENT_LIST` in `App.jsx` L8 must be edited in source code to add or remove equipment. There is no admin-managed equipment table.
9. **No duplicate booking detection.** A staff member can submit two overlapping bookings for the same equipment.
10. **No maximum length on free-text fields.** `purpose` and `assistantComment` are unbounded in both the DB schema (TEXT) and the UI.
11. **No filter automation coverage.** The automated tests only check the `status` filter. `equipmentName` and `bookingDate` filters are tested manually only.
12. **README test count is stale.** README says 11 tests; actual count is 13.
13. **No error boundary in React.** An unhandled JS exception in a component will produce a blank page with no user-facing message.
14. **No mobile responsive layout for Assistant view.** The assistant full-width layout has no `@media` query; it fills the container regardless of viewport width.

---

## 15. Demo Script

**Audience:** Supervisor / assessor  
**Duration:** ~8–10 minutes  
**Prerequisite:** Both `npm run dev` processes running; DB seeded.

### Step 1 — Login as Staff (2 min)
1. Open `http://localhost:3000`.
2. Point to the pre-seeded demo credentials shown on the login card.
3. Log in as `alice_staff` / `password123`.
4. Show: booking form is visible on the left; the list on the right shows only Alice's own bookings (Spectrophotometer A — Pending; PCR Machine — Rejected with comment).
5. Fill in the booking form: choose "Centrifuge B", pick a future date, set start 09:00, end 11:00, purpose "Protein sample analysis".
6. Submit — success toast appears; new Pending booking appears in the list.
7. Apply the status filter to "Pending" — list updates instantly.
8. Try to enter a past date — the date picker's `min` attribute blocks it; submit anyway via form — error message shows "Booking date cannot be in the past."

### Step 2 — Login as Assistant (3 min)
1. Sign Out. Log in as `clara_assistant` / `password123`.
2. Show: no booking form; all bookings from all staff members are visible.
3. Apply "Filter by Equipment: Centrifuge B" — list narrows to the booking just created.
4. Click "Reject" on Alice's new Centrifuge B booking — DecisionModal opens.
5. Try to confirm without a comment — button stays active but backend will block it. Add comment "Equipment under maintenance" — confirm.
6. Show the booking card now shows "Rejected" badge and the assistant comment.
7. Go back to a Pending booking and click "Approve" with comment "Approved — all clear." Show the badge changes to "Approved" and a "Mark as Collected" button appears.
8. Click "Mark as Collected" — status changes to Collected; "Mark as Returned" button appears.
9. Click "Mark as Returned" — full lifecycle complete.

### Step 3 — Security Demo (2 min)
1. Open browser DevTools → Network tab.
2. As Alice (Staff), copy the `Authorization: Bearer <token>` header value from any request.
3. Open a new terminal and run:
   ```bash
   curl -X PUT http://localhost:5000/api/bookings/1/status \
     -H "Content-Type: application/json" \
     -H "Authorization: Bearer <alice_token>" \
     -d '{"status":"Approved","assistantComment":"self-approve"}'
   ```
4. Show the `403 Forbidden` response — "Only lab assistants can manage booking requests."
5. Also demonstrate `npm test` — run in the `server/` terminal and show all 13 tests passing.

---

## 16. Suggested Viva Questions

### Architecture and Separation
1. Why are there two separate `package.json` files instead of one at the root? What would be the trade-offs of combining them?
2. What is the purpose of the `proxy` configuration in `vite.config.js`, and how does it prevent CORS errors during development?
3. If you deployed this application to production, would the Vite proxy still work? What would you do instead?

### Database and Login
4. Walk through exactly what happens in the database from the moment a user clicks "Sign In" to the moment the first booking list appears.
5. What is stored in the `sessions` table and why? Why not just check the `users` table directly on every request?
6. Your `authenticate` middleware makes two database queries per request. What is the security benefit over reading the role from a token body or a custom header?
7. What would change if you replaced the `sessions` table with a signed JWT? What security properties would you gain and what would you lose?

### Role Checks and Ownership
8. Show me the exact line where ownership filtering is enforced for Staff users. Why is this done in the backend instead of the frontend?
9. What happens if a Staff member manually sends `POST /api/bookings` with `{ ..., requestedUser: "alice_staff" }` in the request body while logged in as `bob_staff`? Walk me through the code path.
10. Test 11 passes even though the client sends `?requestedUser=bob_staff`. Explain why.

### Validation
11. You check `if (bookingDate < today)` in the backend. Why is it not enough to rely on the `min` attribute on the date input in the frontend?
12. What validation is missing that could allow a staff member to double-book the same equipment at an overlapping time?
13. What would happen if someone submitted a booking with `purpose` containing 100,000 characters? Is there a risk?

### Testing
14. Your tests use `INSERT IGNORE` to create test users. Why `IGNORE` rather than a plain `INSERT`?
15. The `finally` block in `test.js` deletes bookings for `bob_staff`. Why does `bob_staff` appear there even though `bob_staff` is not a test account?
16. Tests 12 and 13 were added as part of Stage 11. How would you extend the test suite to also cover the `equipmentName` and `bookingDate` filter parameters?

### Security
17. What would happen if someone obtained a session token after the user had logged out? Is this a problem? How would you fix it?
18. The seed data stores passwords as `password123` in plaintext. What change would you make to the login route and the seed script to use bcrypt instead?
19. Your CORS configuration is `app.use(cors())`. What does this allow? What would you write instead if the frontend is hosted at `https://lab.example.com`?
20. Is the `.env` file safe from accidental commits? How would you protect it, and what file would you create?

### Limitations and Design
21. A staff member cannot cancel their own Pending booking. How would you add this feature? Which role checks would you need, and why can't the backend simply use the booking ID alone?
22. The equipment list is hardcoded in `EQUIPMENT_LIST` in `App.jsx`. What are the downsides of this approach, and how would you make it database-driven?
23. What does "state machine" mean in the context of `PUT /api/bookings/:id/status`, and why is enforcing it in the backend important even though the UI already hides invalid buttons?
