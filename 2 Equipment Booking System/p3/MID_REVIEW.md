# Mid-Project Review — Equipment Booking System (p3)

**Review date:** 2026-06-05  
**Stage reviewed:** After secondary feature (filter bookings), before testing, security hardening, and maintainability cleanup  
**Reviewer:** Antigravity AI — automated code review pass  
**Source path:** `backend/` · `frontend/`

---

## 1. Mid-Review Summary

The Equipment Booking System is a full-stack React + Express + MySQL application that is **runnable in its current state**. The separation of concerns between frontend and backend is correctly established, JWT-based authentication is backed by a real `users` table, and the four core booking routes (create, list, update, approve/reject) are all present and wired end-to-end. The secondary feature — filtering by equipment name, date, and status — is fully implemented and driven by backend query parameters rather than client-side slicing.

The two most significant gaps at this stage are:

1. **No cancel-booking action.** The matrix row "Main update/status/cancel action" is only partially satisfied — staff can edit pending bookings, but there is no way to withdraw or cancel a request.
2. **No automated tests exist.** The `deleteBooking` service function is commented as "primarily used for test cleanup" but no test runner, test files, or test scripts are present in either package.

Security posture is better than average for a workshop prototype: the JWT secret has a weak default value baked into the source code, CORS is wide-open, and the `.env` file is committed to the repository (containing a blank password). These are expected pre-hardening issues.

Overall the project is solidly at the **mid-point**: all primary workflow routes work, the database is correctly modelled, and the UI is polished and role-aware.

---

## 2. Review Scoring Matrix

> Score meaning: 0 = missing · 1 = present but mostly not working · 2 = partially working with major gaps · 3 = mostly working with important gaps · 4 = working with minor gaps · 5 = complete for the selected case scope

| Feature / Area | Functionality 0-5 | Data Persistence 0-5 | Backend Security / Role Control 0-5 | Validation / Error Handling 0-5 | Testing Evidence 0-5 | Maintainability 0-5 | UI / Manual Usability 0-5 | Evidence | Notes |
|---|---:|---:|---:|---:|---:|---:|---:|---|---|
| Project setup and run commands | 4 | — | — | — | — | 4 | — | Root `package.json` has `install:all`, `dev`, `db:setup` scripts; README documents steps | `npm run dev` starts both servers concurrently; DB setup is a separate manual step |
| Database setup and starter data | 5 | 5 | — | — | — | 4 | — | `config/schema.sql` creates DB, both tables, drops and recreates on re-run; 3 seed users with bcrypt hashes | Seed data embedded in `schema.sql`; re-running drops all data — no migration system |
| Login workflow | 4 | 4 | 4 | 4 | 0 | 4 | 4 | `POST /api/auth/login` hits DB, compares bcrypt hash, issues JWT; `LoginForm.jsx` posts to `/api/auth/login` | JWT secret has a hard-coded fallback in `authRoutes.js:33` and `bookingRoutes.js:19`; no refresh token; no rate limit |
| Role-based access | 4 | — | 4 | 3 | 0 | 4 | 4 | `getAuthenticatedUser` middleware re-queries `users` table on every request; role checked inside each route handler | Role loaded from DB not JWT payload — prevents client spoofing; role checks repeated inline rather than via shared guard |
| Main create action | 5 | 5 | 5 | 4 | 0 | 4 | 5 | `POST /api/bookings` enforces `staff` role, validates all five required fields, checks `endTime > startTime`, writes to DB | No future-date validation on `bookingDate` |
| Main view/list action | 5 | 5 | 5 | 3 | 0 | 4 | 5 | `GET /api/bookings` scopes results to `requestedUser` for staff, returns all for assistant; `useEffect` re-fetches on filter change | `createdAt`/`updatedAt` columns present in DB but not displayed in either dashboard table |
| Main update/status/cancel action | 3 | 4 | 5 | 4 | 0 | 4 | 3 | `PUT /api/bookings/:id` checks ownership and `status === 'pending'` before updating; edit button hidden for non-pending rows | **No cancel/withdraw action** — staff cannot delete or cancel their own pending booking |
| Protected action | 5 | 5 | 5 | 5 | 0 | 4 | 5 | `PATCH /api/bookings/:id/status` is assistant-only (403 for staff); requires non-empty `assistantComment`; validates status enum | Comment required both backend (L163-165 `bookingRoutes.js`) and `ActionModal` (L9-11) — double guard in place |
| Secondary feature | 5 | 5 | 5 | 3 | 0 | 4 | 5 | Filter params (`equipmentName`, `bookingDate`, `status`) forwarded as query strings; `bookingService.getBookings` builds parameterised SQL; staff filter AND-combined with `requestedUser` lock | No "Clear filters" button; equipment filter is free-text input (inconsistent with BookingForm fixed dropdown) |
| Case-specific: equipment booking date/time and purpose fields | 5 | 5 | — | 4 | 0 | 4 | 5 | `bookingDate` (DATE), `startTime` (TIME), `endTime` (TIME), `purpose` (TEXT) in schema, form, and backend; `endTime > startTime` enforced front and back | `purpose` 500-char limit enforced by HTML `maxLength` only — not enforced by SQL column or API layer |
| Case-specific: booking approval/rejection with assistant comment | 5 | 5 | 5 | 5 | 0 | 4 | 5 | Full approve/reject cycle: modal → PATCH → DB update → re-fetch; `assistantComment` stored and displayed in both views | `updateBookingStatus` service has no lifecycle guard — can re-approve an already approved/rejected booking |
| Case-specific: staff-only ownership of own booking requests | 4 | — | 4 | 3 | 0 | 4 | 4 | `GET` enforces `requestedUser = username` for staff; `PUT` checks `existingBooking.requestedUser !== req.user.username` and returns 403 | Ownership checked by username string not `requestedUserId` FK — mismatch in logic though low risk due to UNIQUE constraint |
| UI / manual usability | 4 | — | — | — | — | 4 | 4 | Dark glassmorphic design, status badges, toast notifications, modal for review, empty-state messaging, loading state | No `createdAt`/`updatedAt` display; no cancel button; purpose/comment cells truncated with no tooltip or expand |
| Security posture | 2 | — | 3 | — | 0 | 2 | — | JWT auth on all booking routes; role loaded from DB; DB creds in `.env` not exposed to React | `.env` committed to repo; hard-coded JWT secret fallback in source; CORS fully open; no Helmet or rate limiting |
| Testing evidence | 0 | — | — | — | 0 | — | — | No test files, no test runner configured, no test scripts in any `package.json` | `deleteBooking` labelled "for test cleanup" — shows intent but nothing implemented |
| Maintainability | 3 | — | — | — | — | 3 | — | Service layer cleanly separates DB logic; JSDoc on all service functions; `.env.example` provided | `getAuthenticatedUser` inline in `bookingRoutes.js`; `RoleSwitcher.jsx` is dead code; no ESLint/Prettier |

---

## 3. Current Feature Status

| Requirement | Route / File | Status |
|---|---|---|
| REQ-1 — DB-backed login | `POST /api/auth/login` | ✅ Implemented |
| REQ-2 — Create booking (staff) | `POST /api/bookings` | ✅ Implemented |
| REQ-3 — View bookings (staff own / assistant all) | `GET /api/bookings` | ✅ Implemented |
| REQ-4 — Update pending booking (staff, own) | `PUT /api/bookings/:id` | ✅ Implemented |
| REQ-4 — Cancel pending booking (staff) | — | ❌ Missing |
| REQ-5 — Approve / Reject + comment (assistant) | `PATCH /api/bookings/:id/status` | ✅ Implemented |
| REQ-6 — Filter by equipment, date, status | `GET /api/bookings?…` | ✅ Implemented |

---

## 4. Database and Persistence Status

- **Tables present:** `users`, `bookings` — both correctly defined in `config/schema.sql`.
- **Users table:** `id`, `username`, `role` ENUM(`staff`,`assistant`), `password` (bcrypt), `createdAt`, `updatedAt`.
- **Bookings table:** `id`, `equipmentName`, `requestedUser`, `requestedUserId` (FK to `users`), `bookingDate`, `startTime`, `endTime`, `purpose`, `status` ENUM(`pending`,`approved`,`rejected`), `assistantComment`, `createdAt`, `updatedAt`.
- **Seed data:** 3 users seeded in `schema.sql` (`alice_staff`, `bob_staff`, `charlie_assistant`), all with password `password123` (bcrypt hash).
- **Setup command:** `npm run db:setup` — calls `node config/db-setup.js` which reads and executes `schema.sql`.
- **Gap:** `db:setup` is not chained into `npm run dev`. A first-time user must run it manually before starting the app.
- **Gap:** Re-running `db:setup` drops and recreates all tables — no migration system. All data is lost on reset.
- **Gap:** `purpose` field is `TEXT` in SQL — the 500-character limit is only enforced by the HTML `maxLength` attribute, not at the database or API layer.

---

## 5. Login and Role/Access Status

- **Login type:** **Database-backed** with bcrypt password hashing and JWT token issuance.
- **Session storage:** JWT stored in `localStorage` (`token` + `user` keys); role and user info re-loaded from DB on every authenticated API call via `getAuthenticatedUser` middleware.
- **Role enforcement location:** Backend (not UI-only). The `getAuthenticatedUser` function re-queries the `users` table using the JWT `userId` claim — the role in the token payload is not used at all, correctly preventing client-side role spoofing.
- **Gap:** The JWT secret defaults to `'super_secret_workshop_key'` in source code if `JWT_SECRET` env var is absent. This fallback is hard-coded in two files: `authRoutes.js:33` and `bookingRoutes.js:19`.
- **Gap:** There is no token expiry handling in the frontend — an expired token will cause a 401 fetch error displayed as a red toast but will not automatically redirect to login.
- **Note:** `RoleSwitcher.jsx` contains a hardcoded `MOCK_USERS` array from an earlier prototype phase. It is imported nowhere in the current app — dead code but not harmful.

---

## 6. Protected Action Status

**Protected action:** Approve or reject bookings and add assistant comment.

| Check | Result |
|---|---|
| Route restricted to `assistant` role? | ✅ Yes — `PATCH /api/bookings/:id/status` returns 403 if `req.user.role !== 'assistant'` |
| Role loaded from DB (not from JWT claim or client header)? | ✅ Yes — `getAuthenticatedUser` re-fetches role from `users` table |
| `assistantComment` required by backend? | ✅ Yes — returns 400 if comment is missing or blank (`bookingRoutes.js:163-165`) |
| Status enum validated? | ✅ Yes — only `'approved'` or `'rejected'` accepted |
| Approve/reject buttons hidden from staff in UI? | ✅ Yes — `AssistantDashboard` is only rendered for `assistant` role |
| Re-approval of already-decided booking blocked? | ❌ No — no lifecycle guard on `PATCH`; an assistant can overwrite an existing `approved` or `rejected` status |
| Staff can modify `assistantComment` via `PUT`? | ✅ No — the `PUT` route only accepts `equipmentName`, `bookingDate`, `startTime`, `endTime`, `purpose`; `assistantComment` is excluded |

---

## 7. Validation Status

| Rule | Frontend | Backend |
|---|---|---|
| All booking fields required | ✅ `BookingForm` checks all five fields | ✅ POST and PUT routes check all five fields |
| `endTime` > `startTime` | ✅ String comparison in `BookingForm` | ✅ String comparison in `bookingRoutes.js:73-75, 124-126` |
| `purpose` max 500 chars | ✅ `maxLength="500"` on textarea | ❌ Not validated — SQL TEXT column has no limit; no API check |
| `assistantComment` max 255 chars | ✅ `maxLength="255"` on ActionModal textarea | ❌ Not validated — only presence/blank check in route |
| `assistantComment` required for approve/reject | ✅ ActionModal frontend check | ✅ Backend route check |
| Status enum (`pending`/`approved`/`rejected`) | N/A — values hardcoded in UI | ✅ Validated in PATCH route |
| `bookingDate` is a valid date | ✅ Browser enforces `type="date"` | ❌ Not validated server-side |
| `bookingDate` must be in the future | ❌ No restriction | ❌ Not validated |
| Login: username and password required | ✅ `required` attribute on inputs | ✅ Checked in `authRoutes.js:12-14` |

---

## 8. Stage Drift / Early Implementation

The following items were implemented beyond the expected secondary-feature stage scope:

| Item | Assessment |
|---|---|
| JWT auth with bcrypt + DB-backed users | Expected for this stage — no drift |
| Vite proxy `/api` → `localhost:5001` | Expected — no drift |
| `deleteBooking` service function | **Minor early addition** — labelled "for test cleanup" but no tests exist yet; route is not exposed via Express, so no runtime risk |
| `RoleSwitcher.jsx` component | **Leftover from earlier prototype** — imported nowhere; dead code rather than stage drift |
| `db-setup.js` automation script | Appropriate setup tooling — no drift |

No features from testing, security hardening, or maintainability cleanup stages appear to have been implemented early.

---

## 9. Issues Found Before Stage 8

### Critical / Blocking

| # | Issue | Location |
|---|---|---|
| C-1 | `.env` file is committed to the repository. It contains the `JWT_SECRET` value. | `backend/.env` |
| C-2 | Hard-coded JWT secret fallback `'super_secret_workshop_key'` in two source files — any developer who skips `.env` setup shares the same secret. | `authRoutes.js:33`, `bookingRoutes.js:19` |

### High Priority

| # | Issue | Location |
|---|---|---|
| H-1 | No cancel-booking action. Staff cannot withdraw a pending booking — there is no DELETE or PATCH-to-cancelled endpoint or UI button. | REQUIREMENTS REQ-4 implied; no route exists |
| H-2 | `PATCH /api/bookings/:id/status` has no lifecycle guard. An assistant can overwrite a booking that is already `approved` or `rejected`. | `bookingRoutes.js:142-172` |
| H-3 | CORS is fully open (`app.use(cors())`). In production this would allow any origin to call the API. | `server.js:10` |

### Medium Priority

| # | Issue | Location |
|---|---|---|
| M-1 | Ownership checked by `requestedUser` (username string) instead of `requestedUserId` (FK integer). | `bookingRoutes.js:108` |
| M-2 | No server-side validation that `bookingDate` is a valid date or is in the future. | `bookingRoutes.js:66-91` |
| M-3 | `purpose` max length (500) and `assistantComment` max length (255) enforced only by HTML `maxLength`, not by backend API. | `bookingRoutes.js`, `bookingService.js` |
| M-4 | Frontend has no token expiry handling. A 401 from an expired token shows a red toast but does not redirect to login. | `App.jsx` fetch handlers |
| M-5 | No `db:setup` step in the main `dev` script. First-time setup requires running `npm run db:setup` manually. | Root `package.json` |
| M-6 | `createdAt` and `updatedAt` columns from the DB are not shown in either dashboard table, contradicting REQ-3 acceptance criteria. | `StaffDashboard.jsx`, `AssistantDashboard.jsx` |

### Low Priority / Cleanup

| # | Issue | Location |
|---|---|---|
| L-1 | `RoleSwitcher.jsx` is dead code — never imported or used in the current app. | `frontend/src/components/RoleSwitcher.jsx` |
| L-2 | `getAuthenticatedUser` middleware defined inline in `bookingRoutes.js` instead of a shared `middleware/auth.js` file. | `bookingRoutes.js:9-38` |
| L-3 | No ESLint or Prettier configuration. Code style consistency not enforced. | Both packages |
| L-4 | No filter "Clear" / "Reset" button in either dashboard. | `StaffDashboard.jsx`, `AssistantDashboard.jsx` |
| L-5 | Equipment name filter is free-text input but `BookingForm` uses a fixed dropdown — inconsistency may confuse users. | `StaffDashboard.jsx:27-34` |
| L-6 | Login form pre-populates `alice_staff` / `password123` in state (useful for demo; should be removed before any public deployment). | `LoginForm.jsx:4-5` |
| L-7 | `purpose` and `assistantComment` table cells are truncated with CSS ellipsis but no tooltip or expand mechanism exists. | `index.css:278-289` |
| L-8 | No loading/disabled state on the booking form submit button — double-click could submit duplicate bookings. | `BookingForm.jsx:135` |

---

## 10. Manual Checks Recommended Next

1. **Login flow** — Verify `alice_staff` and `bob_staff` log in and see only their own bookings. Verify `charlie_assistant` sees all bookings.
2. **Staff cannot approve** — Attempt `PATCH /api/bookings/1/status` with a staff JWT; confirm 403 response.
3. **Ownership enforcement** — Log in as `alice_staff`, create a booking. Log out, log in as `bob_staff`, attempt `PUT /api/bookings/<alice's id>` via API; confirm 403.
4. **Edit lock after approval** — As `charlie_assistant`, approve a booking. Log back in as the owning staff and confirm the Edit button is hidden.
5. **Assistant comment required** — In ActionModal, attempt to submit without a comment; confirm frontend blocks it. Also confirm backend returns 400 if comment omitted via direct API call.
6. **Filter behaviour** — Verify each filter (equipment, date, status) works individually and in combination. Verify staff filters apply only to their own records.
7. **Re-approval guard (missing)** — As `charlie_assistant`, approve a booking then reject it via API; confirm it currently succeeds (documenting gap H-2).
8. **JWT expiry** — Set `expiresIn` to `1s` temporarily, wait, then use the app; observe error experience.
9. **Schema reset** — Run `npm run db:setup` twice; confirm seed data resets and no duplicate-key errors occur.

---

## 11. Pass / Fail Table

| Check | Result | Notes |
|---|---|---|
| App appears runnable | ✅ Pass | Both servers start with `npm run dev`; Vite proxy routes `/api` to Express on port 5001 |
| React and Express are separated | ✅ Pass | `frontend/` is a standalone Vite/React project; `backend/` is a standalone Express project |
| React calls Express routes, not MySQL directly | ✅ Pass | All data access via `fetch('/api/…')`; no DB client in frontend |
| Backend uses DB_HOST, DB_PORT, DB_USER, DB_PASSWORD, DB_NAME | ✅ Pass | All five env vars used in `config/db.js` and `config/db-setup.js` |
| DB secrets not exposed in React | ✅ Pass | `.env` is backend-only; Vite does not forward env vars to browser |
| Required database tables exist | ✅ Pass | `users` and `bookings` tables defined in `schema.sql` |
| Users/login table exists | ✅ Pass | `users` table with `id`, `username`, `role`, `password` |
| Repeatable database setup command | ✅ Pass | `npm run db:setup` runs `db-setup.js` which applies `schema.sql` (DROP + CREATE) |
| Login is database-backed | ✅ Pass | `POST /api/auth/login` queries `users` table, verifies bcrypt hash |
| Role restrictions enforced in backend | ✅ Pass | `getAuthenticatedUser` loads role from DB; each route checks role independently |
| Approve/reject protected (assistant-only) | ✅ Pass | PATCH route returns 403 for non-assistant roles |
| Staff limited to own booking records | ✅ Pass | GET scoped by `requestedUser`; PUT checks ownership by username |
| Main booking workflow implemented (create/view/update/approve-reject) | ⚠️ Partial | Create ✅ View ✅ Update ✅ Approve/Reject ✅ — Cancel ❌ missing |
| Filter by equipment, date, status implemented | ✅ Pass | All three filters implemented; backend applies them via parameterised SQL |
| Validation present | ⚠️ Partial | Required fields and time ordering validated; max-length and date validity only partially enforced server-side |
| AI has not implemented future stages early | ✅ Pass | No tests, no Helmet, no rate limiting, no migrations — all correctly deferred |
| What is missing before testing/hardening/cleanup | See §9 | Cancel booking (H-1); PATCH lifecycle guard (H-2); CORS config (H-3); server-side length validation (M-3); token expiry handling (M-4); `createdAt`/`updatedAt` display (M-6) |
