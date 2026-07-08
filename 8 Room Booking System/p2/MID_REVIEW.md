# Mid-Project Review — Room Booking System

**Review date:** 2026-06-14  
**Stage reviewed:** After secondary feature (filter bookings); before testing, security hardening, and maintainability cleanup.  
**Reviewer note:** Read-only review. No source code, schema, or package files were modified.

---

## 1. Mid-Review Summary

The project is a React + Express + MySQL room booking system.
Both the frontend (Vite/React) and backend (Express/Node.js) are properly separated into their own directories with independent `package.json` files.
The backend exposes a REST API consumed by the frontend over HTTP; the React code contains no MySQL connection.
Database credentials are stored in `backend/.env` and read via `process.env`; they are never exposed to the browser.

The main workflow — create, view, update, and approve/reject a booking — is implemented end-to-end.
The secondary feature (filter by room, date, status) is implemented on both the backend query layer and the frontend UI.
The protected action (approve/reject, coordinator note) is enforced in the backend middleware and route handler.
Staff ownership scoping is enforced in the backend.

**Key concerns before Stage 8:**
- Passwords stored in plaintext (no hashing). This is the most critical security gap.
- CORS is fully open (`cors()` with no origin restriction).
- No session expiry or logout endpoint; tokens persist indefinitely in `sessions`.
- API base URL is hardcoded as `http://localhost:5000` in every frontend fetch call (6 occurrences).
- No `vite.config.js` present; Vite proxy cannot be configured without it.
- The `.env.example` has a duplicate with a leading space (`" .env.example"`); the real file omits `DB_PORT`.
- No root-level README with combined run instructions.
- No automated tests of any kind.
- The `requester_name` field is a free-text input; it is not auto-filled from the logged-in user, so a staff member can enter any name.
- The Coordinator "Book a Room" button is hidden in the UI, but there is no backend block preventing a coordinator from POST-ing a booking via direct API call.
- The booking update route (PUT) does not re-check for time-slot conflicts when a booking is edited.
- Alert/feedback messages are not auto-dismissed; they remain on screen until a new action clears them.

---

## 2. Review Scoring Matrix

> Score meaning: 0 = missing · 1 = present but mostly not working · 2 = partially working with major gaps · 3 = mostly working with important gaps · 4 = working with minor gaps · 5 = complete for the selected case scope

| Feature / Area | Functionality 0-5 | Data Persistence 0-5 | Backend Security / Role Control 0-5 | Validation / Error Handling 0-5 | Testing Evidence 0-5 | Maintainability 0-5 | UI / Manual Usability 0-5 | Evidence | Notes |
|---|---:|---:|---:|---:|---:|---:|---:|---|---|
| Project setup and run commands | 4 | 5 | 5 | 4 | 0 | 3 | 4 | `backend/package.json` scripts: `start`, `dev`, `db:setup`; `frontend/package.json` scripts: `dev`, `build`, `lint`; `node_modules` present in both | No root-level README with combined startup instructions; `.env.example` duplicated with leading-space filename; `DB_PORT` missing from `.env.example` |
| Database setup and starter data | 4 | 5 | 5 | 4 | 0 | 3 | 4 | `db/schema.sql` creates DB, all 3 tables, seeds 3 users and 3 bookings; `backend/scripts/dbSetup.js` is callable via `npm run db:setup` | Seed passwords stored in plaintext; no idempotent teardown/re-seed command; `dbSetup.js` uses a manual semicolon-split rather than `multipleStatements` option, which may fail on some SQL blocks |
| Login workflow | 4 | 4 | 2 | 4 | 0 | 3 | 4 | `POST /api/auth/login` queries `users` table, returns opaque token stored in `sessions`; token sent as Bearer header on all subsequent requests; `localStorage` persistence with JSON parse safety | Passwords compared in plaintext (no bcrypt); no logout endpoint to invalidate the server-side session token; no token expiry column or TTL enforcement |
| Role-based access | 4 | 4 | 4 | 3 | 0 | 3 | 4 | `authenticateToken` middleware reads role from DB on every request; staff scope enforced in GET route; approve/reject blocked for non-Coordinators at the route level | No backend guard preventing a Coordinator from submitting a new booking via direct API call (only UI-hidden); no rate limiting or brute-force protection |
| Main create action | 4 | 5 | 4 | 4 | 0 | 3 | 4 | `POST /api/bookings` requires auth token, inserts with `user_id = req.user.id`, validates all fields, checks past-date, checks time order, checks overlap against approved bookings | `requester_name` is free text and not auto-populated from the authenticated user; overlap logic uses 3-clause OR which technically covers all cases but is not the canonical `NOT (end <= newStart OR start >= newEnd)` pattern |
| Main view/list action | 5 | 5 | 5 | 4 | 0 | 4 | 4 | `GET /api/bookings` scopes staff to `user_id = req.user.id`; coordinators see all; data returned as JSON array; frontend renders table with all key fields | No server-side pagination; large datasets would load entirely; `booking_date` returned as ISO string and split on `T` in UI (works, minor) |
| Main update/status/cancel action | 3 | 4 | 4 | 3 | 0 | 3 | 3 | `PUT /api/bookings/:id` checks ownership and `pending` status for staff before allowing edit; `PATCH /api/bookings/:id/status` handles approve, reject, cancel with ownership and role checks | PUT does not re-run overlap check when editing room/date/time; staff can only cancel their own pending bookings via PATCH but the inline cancel handler in Dashboard.jsx duplicates the fetch call instead of reusing `handleStatusUpdate` |
| Protected action | 4 | 5 | 4 | 4 | 0 | 3 | 4 | `PATCH /api/bookings/:id/status` blocks `approved`/`rejected` for non-Coordinators at backend (line 198–200, bookingRoutes.js); coordinator note stored in `coordinator_note` column | Note is optional; no backend enforcement that a note is required for `rejected` status; overlap re-check runs on approval which is correct |
| Secondary feature | 5 | 5 | 5 | 4 | 0 | 3 | 4 | Room (LIKE), date (exact), status filters passed as query params; backend builds parameterised query dynamically; frontend has three filter inputs and Clear Filters button; filter changes trigger auto-refetch via `useEffect` dependency | Room filter does a LIKE match (partial), which is helpful but may need an exact-match option; no UI indication when zero results are due to active filters vs. no data at all |
| Case-specific: room/date/time booking details and conflict awareness | 4 | 5 | 4 | 4 | 0 | 3 | 4 | All six required fields collected (room, date, start\_time, end\_time, purpose, requester\_name); overlap checked on create and on approval; past-date and time-order validated on both frontend and backend | Update (PUT) skips the overlap check; time inputs stored as MySQL TIME and displayed correctly as HH:MM; no minimum booking duration enforced |
| Case-specific: booking approval/rejection status with coordinator note | 4 | 5 | 4 | 4 | 0 | 3 | 4 | Status ENUM covers all 4 states; `coordinator_note` column exists and is returned to UI; note displayed in table for all roles | Note not required on rejection; cancelled bookings auto-set note to "Cancelled by requester" (reasonable); no audit trail or timestamp for status changes beyond `updated_at` |
| Case-specific: staff ownership and coordinator-only status changes | 4 | 5 | 4 | 3 | 0 | 3 | 4 | GET scopes staff to their records; PUT and PATCH verify `user_id` ownership; approve/reject requires Coordinator role checked in DB | `requester_name` not bound to `user.username`, so a staff member can name themselves anything; no backend check that a Staff user cannot POST a booking for another `user_id` (though `user_id` is always set to `req.user.id` in the insert, so this is mitigated) |
| UI / manual usability | 4 | 4 | 3 | 3 | 0 | 3 | 4 | Dark glassmorphism theme; status badges with colour coding; loading and empty states present; modal form for create/edit; sample credentials shown on login page | No `vite.config.js` so no Vite proxy; API URL hardcoded in 6 places; alert messages do not auto-dismiss; Coordinator cannot create bookings from the UI (may or may not be intentional per case scope) |
| Security posture | 2 | 3 | 2 | 3 | 0 | 2 | 3 | DB secrets in `.env` not in source; token auth via sessions table; parameterised queries prevent SQL injection | Plaintext passwords; open CORS; no session expiry; no input sanitisation library; `.env` committed (not in .gitignore since no .gitignore found at project root) |
| Testing evidence | 0 | 0 | 0 | 0 | 0 | 1 | 0 | Health check endpoint `/api/health` exists; seed data covers 3 status states for manual testing | No unit tests, integration tests, or test runner configured in either package.json |
| Maintainability | 3 | 3 | 3 | 3 | 0 | 3 | 3 | Route files separated; config in its own module; consistent naming conventions; seed data included; `.env.example` present | No root README; API URL not centralised; inline cancel handler duplicates fetch logic; no ESLint config committed for backend; duplicate `.env.example` with leading space in filename |

---

## 3. Current Feature Status

| Feature | Implemented | Notes |
|---|---|---|
| Create booking request | ✅ Yes | All 6 fields; overlap check; past-date guard |
| View own bookings (Staff) | ✅ Yes | Scoped by `user_id` in backend |
| View all bookings (Coordinator) | ✅ Yes | No scoping filter applied for Coordinators |
| Edit pending booking (Staff) | ✅ Yes | Ownership + status check in backend |
| Cancel own pending booking (Staff) | ✅ Yes | PATCH with `cancelled` status |
| Approve booking (Coordinator) | ✅ Yes | Role check in backend; overlap re-check on approval |
| Reject booking (Coordinator) | ✅ Yes | Role check in backend |
| Add coordinator note | ✅ Yes | Optional text stored in `coordinator_note` |
| Filter by room | ✅ Yes | LIKE partial match |
| Filter by date | ✅ Yes | Exact date match |
| Filter by status | ✅ Yes | Exact status match |
| Clear filters | ✅ Yes | UI button resets all three filters |
| Logout | ⚠️ Partial | Clears localStorage and state; no server-side token invalidation |
| Session persistence across page reload | ✅ Yes | User object read from localStorage on mount |

---

## 4. Database and Persistence Status

| Item | Status | Detail |
|---|---|---|
| Database name | `c8p2` | Defined in `db/schema.sql` and `backend/.env` |
| `users` table | ✅ Present | `id`, `username`, `password`, `role ENUM('Staff','Coordinator')` |
| `sessions` table | ✅ Present | `token PK`, `user_id FK`, `created_at`; no expiry column |
| `bookings` table | ✅ Present | All required columns including `coordinator_note`, `status ENUM`, `updated_at` |
| Seed users | ✅ Present | `alice_staff`, `bob_staff` (Staff); `charlie_coord` (Coordinator) |
| Seed bookings | ✅ Present | 3 records covering approved, pending, rejected states |
| Setup command | ✅ `npm run db:setup` | Runs `scripts/dbSetup.js` which reads and executes `db/schema.sql` |
| Teardown/re-seed command | ❌ Missing | No `DROP TABLE` or reset script; must run manually or re-run with `IF NOT EXISTS` guards |
| All env vars present | ⚠️ Partial | `.env` has all 5 vars (`DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`); `.env.example` is missing `DB_PORT` |
| Password hashing | ❌ Missing | Passwords stored and compared as plaintext |

---

## 5. Login and Role/Access Status

| Item | Status | Detail |
|---|---|---|
| Login type | Database-backed | Queries `users` table; not mock-only or role-selector-only |
| Token mechanism | Custom opaque token | 48-char hex string stored in `sessions` table |
| Token validated per request | ✅ Yes | `authenticateToken` middleware joins `sessions` + `users` tables |
| Role resolved from DB | ✅ Yes | Role comes from `users.role` at request time, not from client-supplied data |
| Frontend role awareness | ✅ Yes | Role used to conditionally render Approve/Reject UI |
| Backend role enforcement | ✅ Yes | Not dependent on UI; checked in route handler |
| Logout server-side | ❌ Missing | No `DELETE /api/auth/logout` endpoint; session token is not removed from DB |
| Token expiry | ❌ Missing | No `expires_at` column in `sessions`; tokens are permanent until manual DB cleanup |
| Password security | ❌ Plaintext | `WHERE username = ? AND password = ?` with unhashed comparison |

---

## 6. Protected Action Status

**Protected action: Approve or reject room bookings and edit coordinator note.**

| Check | Result | Location |
|---|---|---|
| Route requires auth token | ✅ | `authenticateToken` middleware applied to all `/api/bookings` routes (bookingRoutes.js line 38) |
| Role verified from DB, not from client | ✅ | `req.user.role` comes from DB join in middleware |
| Approve blocked for Staff | ✅ | bookingRoutes.js line 198: returns 403 if `role !== 'Coordinator'` |
| Reject blocked for Staff | ✅ | Same block as approve (line 198) |
| Staff can cancel only own pending | ✅ | bookingRoutes.js lines 189–194: ownership + status guard |
| Note stored on approve/reject | ✅ | `coordinator_note` updated alongside `status` in PATCH |
| UI buttons hidden for Staff | ✅ | Dashboard.jsx line 243: `user.role === 'Coordinator'` guard |
| Note required on rejection | ❌ | `coordinator_note` is optional; no backend enforcement of note on reject |
| Overlap re-check on approval | ✅ | bookingRoutes.js lines 205–218 |

---

## 7. Validation Status

| Validation | Frontend | Backend |
|---|---|---|
| All booking fields required | ✅ BookingForm.jsx line 38 | ✅ bookingRoutes.js line 83 |
| Booking date not in past | ✅ BookingForm.jsx line 44 | ✅ bookingRoutes.js line 88 |
| Start time before end time | ✅ BookingForm.jsx line 49 | ✅ bookingRoutes.js line 92 |
| Conflict check on create | ❌ Not on frontend | ✅ bookingRoutes.js lines 98–109 |
| Conflict check on edit (PUT) | ❌ Not on frontend | ❌ Not in bookingRoutes.js PUT handler |
| Conflict check on approve | ❌ Not on frontend | ✅ bookingRoutes.js lines 205–218 |
| Valid status on PATCH | ❌ Not explicitly on frontend | ✅ bookingRoutes.js line 173 |
| Login fields required | ✅ Login.jsx line 11 | ✅ authRoutes.js line 10 |
| SQL injection prevention | N/A | ✅ All queries use parameterised placeholders |

**Gap:** The PUT (edit) route has no overlap re-check. A staff member can edit a pending booking to a time slot that conflicts with an approved booking, and that conflict will not be caught until a coordinator tries to approve it.

---

## 8. Stage Drift / Early Implementation

No evidence of future stage work implemented ahead of schedule.

| Area | Finding |
|---|---|
| Testing | No test files, no test runner, no test scripts — consistent with pre-testing stage |
| Security hardening | No bcrypt, no rate limiting, no CORS restriction, no helmet — consistent with pre-hardening stage |
| Pagination | Not present — not expected at this stage |
| Audit logging | Not present — not expected at this stage |
| Role management UI | Not present — not expected at this stage |
| Email/notification | Not present — not expected at this stage |

The implementation is appropriately scoped for the secondary feature stage. No premature advanced features were detected.

---

## 9. Issues Found Before Stage 8

### Critical

| # | Issue | File | Detail |
|---|---|---|---|
| C-1 | Plaintext passwords | `db/schema.sql`, `authRoutes.js` line 15 | Passwords seeded and compared without hashing. Any DB read exposes all credentials. |
| C-2 | No session invalidation on logout | `App.jsx` handleLogout, `authRoutes.js` | Tokens remain valid in the `sessions` table after the user clicks Logout. |
| C-3 | No `.gitignore` at project root | Project root | `backend/.env` (containing DB credentials) would be committed to version control. |

### High

| # | Issue | File | Detail |
|---|---|---|---|
| H-1 | Open CORS | `server.js` line 8 | `cors()` with no origin option allows any origin to call the API |
| H-2 | API URL hardcoded in 6 places | `Login.jsx` L20; `Dashboard.jsx` L32, L65–66, L100, L293 | Changing the backend port or host requires 6 edits; breaks in any environment other than local |
| H-3 | No `vite.config.js` | `frontend/` root | Vite proxy cannot be configured; CORS dependency is forced even in development |
| H-4 | PUT route missing overlap check | `bookingRoutes.js` lines 124–166 | Editing a pending booking can silently produce a time conflict that is not caught until approval |

### Medium

| # | Issue | File | Detail |
|---|---|---|---|
| M-1 | `requester_name` is free text | `BookingForm.jsx` L148; `bookingRoutes.js` L80 | Not auto-filled from `req.user.username`; staff can type any name |
| M-2 | No session expiry | `db/schema.sql` sessions table | `sessions` has no `expires_at` column; old tokens accumulate and never expire |
| M-3 | No logout endpoint | `authRoutes.js` | Server-side token not deleted on logout; only localStorage is cleared |
| M-4 | `.env.example` missing `DB_PORT` | `backend/.env.example` | Actual `.env` uses `DB_PORT=3306`; the example template omits it; a duplicate with a leading-space filename also exists |
| M-5 | No root README | Project root | No combined startup instructions for a developer running the project for the first time |
| M-6 | Inline cancel handler duplicates fetch | `Dashboard.jsx` lines 290–311 | Cancel button has its own inline `fetch` instead of calling the existing `handleStatusUpdate` function |
| M-7 | Alert messages do not auto-dismiss | `Dashboard.jsx` | `error` and `successMsg` remain on screen until the next action; no timeout clearing |
| M-8 | `dbSetup.js` semicolon-split approach | `backend/scripts/dbSetup.js` line 29 | Splitting SQL on `;\r?\n` is fragile; may break on SQL blocks with semicolons inside strings or on the final statement with no trailing newline |

### Low

| # | Issue | File | Detail |
|---|---|---|---|
| L-1 | Coordinator cannot create bookings via UI | `Dashboard.jsx` line 149 | "Book a Room" button only shown for Staff; whether Coordinators should also be able to create bookings is not explicitly specified in the case brief, but the backend does not block it |
| L-2 | No note required on rejection | `bookingRoutes.js` PATCH handler | A coordinator can reject a booking without providing a reason |
| L-3 | No minimum booking duration | `bookingRoutes.js` POST | A 1-second booking is technically valid |
| L-4 | No server-side pagination | `bookingRoutes.js` GET | All matching bookings returned in one query; acceptable at workshop scale |
| L-5 | `booking_date` display splits on `T` | `Dashboard.jsx` line 229 | Works correctly but relies on ISO string format assumption; fragile if date format changes |

---

## 10. Manual Checks Recommended Next

1. **Run `npm run db:setup`** from `backend/` and verify the database, tables, and seed records are created without error.
2. **Start both servers** (`npm run dev` in `backend/` and `npm run dev` in `frontend/`) and confirm they start on ports 5000 and 5173 respectively.
3. **Login as `alice_staff` / `password123`** — verify only Alice's own bookings are visible; confirm Approve/Reject buttons do not appear.
4. **Login as `charlie_coord` / `password123`** — verify all three seed bookings are visible; confirm Approve and Reject buttons appear.
5. **Test overlap detection:** create a new booking on the same room/date/time as the existing approved booking (Conference Room A, 2026-06-20, 09:00–11:00) and confirm a 409 error is returned.
6. **Test coordinator approval overlap:** try approving the pending booking (Meeting Room B) — no overlap expected, should succeed.
7. **Test filter combinations:** filter by room "Conference", date, and status individually and in combination.
8. **Test session persistence:** log in, close the browser tab, reopen, and confirm the session is restored from localStorage.
9. **Test token isolation:** call `GET http://localhost:5000/api/bookings` without an `Authorization` header and verify a 401 response.
10. **Test role enforcement via curl/Postman:** send `PATCH /api/bookings/2/status` with `{ "status": "approved" }` using a Staff user's token and verify a 403 response.
11. **Verify `.env` is not tracked by git** (if the repo is initialised): run `git status` and confirm `.env` is excluded.

---

## 11. Pass/Fail Table

| Criterion | Result | Notes |
|---|---|---|
| App appears runnable | ✅ Pass | Both `node_modules` present; scripts defined; health endpoint available |
| React and Express are separated | ✅ Pass | Separate directories and `package.json` files |
| React calls Express routes only (no direct MySQL) | ✅ Pass | No MySQL dependency or connection in frontend source |
| Backend uses all 5 required DB env vars | ✅ Pass | All 5 vars used in `config/db.js` and `scripts/dbSetup.js` |
| Secrets not exposed in React | ✅ Pass | No `.env` in frontend; no DB credentials in frontend source |
| Users/login table exists | ✅ Pass | `users` table defined in schema with `username`, `password`, `role` |
| Repeatable DB setup command | ⚠️ Partial | `npm run db:setup` exists; no teardown/re-seed command |
| Login is database-backed | ✅ Pass | Queries `users` table; token stored in `sessions` |
| Role restrictions enforced in backend | ✅ Pass | Middleware + route-level checks; role resolved from DB |
| Protected action (approve/reject/note) is backend-protected | ✅ Pass | 403 returned for non-Coordinator; confirmed in route handler |
| Staff limited to own records | ✅ Pass | GET scoped; PUT and PATCH ownership-checked |
| Main workflow (create/view/update/approve/reject) implemented | ✅ Pass | All five operations present and functional |
| Secondary feature (filter by room/date/status) implemented | ✅ Pass | All three filters functional on backend and frontend |
| Validation present | ✅ Pass (with gaps) | Required fields, past-date, time-order validated; PUT missing overlap check |
| No future stages implemented early | ✅ Pass | No premature test suites, security libraries, or advanced features detected |
| Missing before Stage 8 | See section 9 | Password hashing, session expiry/invalidation, .gitignore, CORS config, API URL centralisation, PUT overlap check are the primary gaps |
