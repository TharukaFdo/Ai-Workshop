# Mid-Project Review — Inventory Request System

**Project:** Inventory Request System (Case 5, Prototype 3)  
**Review Stage:** After secondary feature (filter) implementation — before testing, security hardening, and maintainability cleanup  
**Review Date:** 2026-07-11  
**Reviewed By:** Antigravity (AI Code Review Agent)  
**Scope:** Read-only review. No source code, schema, seed data, or test files were created or modified.

---

## 1. Mid-Review Summary

The project is a two-tier web application built with **React (Vite)** on the frontend and **Node.js / Express** on the backend, backed by **MySQL**. The architecture is correctly separated: the frontend never touches the database directly — all data access goes through the Express API, which in turn reads MySQL credentials exclusively from backend environment variables.

All four phases of the main workflow (submit → approve/reject → issue) are implemented and wired end-to-end. Role-based access control is enforced in the backend (JWT + `requireRole` middleware), not only in the UI. The secondary filter feature is implemented for both roles with the correct per-role restrictions applied.

There are no automated tests and no test infrastructure. Several low-severity issues are present that are expected at this stage and should be addressed in the upcoming security hardening and maintainability cleanup passes. One functional correctness gap (storekeeper `PUT /:id` ownership leak) stands out as a notable pre-testing issue.

Overall, the project is in **good shape** for its current stage, with a healthy feature-complete core. The items below should be tracked before the final review.

---

## 2. Review Scoring Matrix

> Scores are **0–5**: 0 = missing · 1 = present but mostly not working · 2 = partially working, major gaps · 3 = mostly working, important gaps · 4 = working, minor gaps · 5 = complete for scope

| Feature / Area | Functionality 0-5 | Data Persistence 0-5 | Backend Security / Role Control 0-5 | Validation / Error Handling 0-5 | Testing Evidence 0-5 | Maintainability 0-5 | UI / Manual Usability 0-5 | Evidence | Notes |
|---|---:|---:|---:|---:|---:|---:|---:|---|---|
| Project setup and run commands | 4 | — | — | — | 0 | 4 | — | `package.json` root scripts: `install:all`, `db:setup`, `dev`. README documents all steps. | README shows `DB_NAME=inventory_db` but actual default is `c5p3`. Minor doc mismatch. |
| Database setup and starter data | 5 | 5 | — | — | 0 | 4 | — | `backend/scripts/db_init.js` — idempotent DROP + CREATE + seed. 4 users, 4 sample requests covering all 4 statuses. `npm run db:setup` alias present. | Script wipes all data on every run; acceptable for prototype seeding. |
| Login workflow | 5 | 5 | 4 | 4 | 0 | 4 | 5 | `POST /api/auth/login` — DB-backed bcrypt comparison, JWT issued (8 h). Frontend stores token + user in `localStorage`. 401 triggers auto-logout. Demo credential hints shown on login screen. | `JWT_SECRET` falls back to a hardcoded string if env var is missing. Must be moved to `.env` before security hardening. |
| Role-based access | 4 | — | 4 | 3 | 0 | 4 | 4 | `authenticate` re-fetches user from DB on every request (role cannot be spoofed). `requireRole('storekeeper')` guards approve/issue. Staff scoped to own requests via `requesterId` injection. | `PUT /:id` (edit request) has no `requireRole('staff')` — architectural gap; service ownership check partially compensates. |
| Main create action | 5 | 5 | 5 | 4 | 0 | 4 | 5 | `POST /api/requests` — `requireRole('staff')` enforced. All four required fields checked. `quantity > 0` enforced. Status defaults to `pending`. Service inserts and returns full record. | No max-length check for `itemName` (255) or `reason` (500) at API layer. |
| Main view/list action | 5 | 5 | 5 | 3 | 0 | 4 | 5 | `GET /api/requests` — `authenticate` required. Staff: `requesterId` forced to own ID. Storekeeper: sees all. `ORDER BY created_at DESC`. | `GET /api/users` has no `authenticate` guard — user list publicly accessible. |
| Main update/status/cancel action | 4 | 5 | 3 | 4 | 0 | 4 | 4 | `PUT /:id` — ownership verified in service (`requester_id === userId`). Status guard: only `pending` editable. Returns updated record. | Route missing `requireRole('staff')`. No cancel/withdraw action for staff. |
| Protected action | 5 | 5 | 5 | 4 | 0 | 4 | 4 | `PUT /:id/approve` + `PUT /:id/issue` — both require `authenticate` + `requireRole('storekeeper')`. Self-approval/self-issue blocked at route level. Status transition guards in service. Note only written via protected routes. | Storekeeper note is optional (nullable). No max-length check at API layer despite spec requiring 500 chars. |
| Secondary feature | 5 | 5 | 5 | 4 | 0 | 4 | 5 | `GET /api/requests?itemName=&requesterName=&status=` — LIKE filtering in service. Staff `requesterId` forced; requester-name filter UI hidden for staff. Filters trigger re-fetch via `useEffect` dependency. | No debounce on text inputs — every keystroke fires an API call. |
| Case-specific: item, quantity, reason, and requester fields | 5 | 5 | 5 | 4 | 0 | 4 | 5 | All four fields present in DB schema (NOT NULL), required validation in both frontend and backend. `requester_name` auto-populated from JWT-verified user. `quantity` enforced > 0. | No max-length enforcement at API level (only DB column length). `reason` is TEXT with no DB max. |
| Case-specific: approve/reject/issued status lifecycle | 5 | 5 | 5 | 5 | 0 | 4 | 5 | Four-state ENUM in DB: `pending → approved/rejected`, `approved → issued`. Illegal transitions rejected by service. `issued_quantity` and `issued_at` recorded on issue. All states rendered with distinct colour-coded badges. | No explicit `cancelled` or `withdrawn` state — out of current scope. |
| Case-specific: storekeeper note protection and staff ownership | 5 | 5 | 5 | 4 | 0 | 4 | 5 | Note only writable via `PUT /:id/approve` (storekeeper-only route). Note is read-only in UI for staff (note-box, no edit input). Staff ownership enforced in service. Storekeeper cannot edit staff request details. | Note max-length (500 chars) not enforced at API layer. |
| UI / manual usability | 4 | — | — | — | 0 | 4 | 4 | Dark glassmorphic theme, animated modals, status colour badges, role-aware controls. Edit, review, and issue modals functional. Success toast with auto-dismiss. | `alert()` used for client-side validation errors. CSS inline style typo `justifycontent` (missing hyphen). `Outfit`/`Inter` fonts declared but not imported via `<link>`. |
| Security posture | 3 | — | 3 | — | 0 | 3 | — | JWT verified server-side. Role re-fetched from DB. Self-action blocked. CORS enabled. Secrets in `.env`. | `JWT_SECRET` hardcoded fallback. `GET /api/users` unauthenticated. No rate limiting, no helmet, no input sanitisation. `.gitignore` not verified. |
| Testing evidence | 0 | 0 | 0 | 0 | 0 | 0 | — | No test files, no test runner, no test scripts exist anywhere in the project. No jest/vitest/supertest dependency in any package.json. | Expected at this stage per review scope. |
| Maintainability | 3 | — | — | — | — | 3 | — | Clear folder structure (routes/services/middleware/config/scripts). JSDoc comments on all service functions and middleware. Service layer decoupled from routes. | All React logic in one 708-line App.jsx — no component decomposition. No TypeScript. No ESLint config. No React error boundaries. |

---

## 3. Current Feature Status

| Feature | Implemented | Backend Route | Frontend UI | Notes |
|---|---|---|---|---|
| Staff: Submit request | ✅ Yes | `POST /api/requests` | Form in left panel | All required fields present |
| Staff: View own requests | ✅ Yes | `GET /api/requests` (scoped) | Right panel list | Backend enforces scope |
| Staff: Edit pending request | ✅ Yes | `PUT /api/requests/:id` | Edit modal | Only pending; ownership enforced in service |
| Staff: Filter own requests | ✅ Yes | Query params on GET | Item name + status filters | Requester-name filter hidden in UI for staff |
| Storekeeper: View all requests | ✅ Yes | `GET /api/requests` | Right panel list | No scope restriction |
| Storekeeper: Approve/Reject | ✅ Yes | `PUT /api/requests/:id/approve` | Review modal | Self-approval blocked at route + service |
| Storekeeper: Add note | ✅ Yes | Via approve/reject body | Textarea in review modal | Correctly write-protected |
| Storekeeper: Mark as issued | ✅ Yes | `PUT /api/requests/:id/issue` | Issue modal | issued_quantity + issued_at recorded |
| Storekeeper: Filter all requests | ✅ Yes | Query params on GET | Item name + requester name + status | All three filters active |
| Login (DB-backed) | ✅ Yes | `POST /api/auth/login` | Login form | bcrypt + JWT |
| Logout | ✅ Yes | Client-side only | Sign Out button | Clears localStorage token |
| Role display in header | ✅ Yes | From JWT/DB | Header identity line | Shows full name + role |

---

## 4. Database and Persistence Status

### Schema

| Table | Exists in script | Key Columns |
|---|---|---|
| `users` | ✅ Yes | `id`, `username`, `password_hash`, `role` ENUM('staff','storekeeper'), `full_name`, `created_at` |
| `inventory_requests` | ✅ Yes | `id`, `item_name`, `quantity`, `reason`, `requested_date`, `requester_id` (FK→users), `requester_name`, `status` ENUM('pending','approved','rejected','issued'), `storekeeper_note`, `issued_quantity`, `issued_at`, `created_at`, `updated_at` |

### Persistence Assessment

- All required data fields are present in the schema.
- FK relationship `requester_id → users.id` declared with `ON DELETE CASCADE`.
- `updated_at` uses `ON UPDATE CURRENT_TIMESTAMP` — automatic audit trail.
- `issued_at` is a separate `TIMESTAMP` column.
- Seed script creates 4 users (2 staff, 2 storekeeper) and 4 requests (one per status) — good manual test coverage.
- DB credentials reside in `backend/.env` only; frontend has no database dependencies.

### Issues

- `db_init.js` connects with a root-level connection and blank `DB_PASSWORD` default — fragile in shared environments.
- README step 3 shows `DB_NAME=inventory_db` but `.env.example` and `db_init.js` both default to `c5p3`. Documentation mismatch.

---

## 5. Login and Role/Access Status

### Login Type

**Database-backed with JWT.** Not mock-only, not role-selector-only.

- `POST /api/auth/login`: queries `users` table, bcrypt compare, JWT signed with only `userId`.
- Every protected request re-fetches the user row from DB via `userService.getUserById(decoded.userId)` — role is always read from the database, never trusted from the token payload.
- Token lifetime: 8 hours. Stored in `localStorage`.

### Role Enforcement — Backend

| Endpoint | Role Guard | Method |
|---|---|---|
| `POST /api/requests` | `requireRole('staff')` | Middleware |
| `PUT /api/requests/:id` | `authenticate` only | ⚠️ No role guard — see Issues |
| `PUT /api/requests/:id/approve` | `requireRole('storekeeper')` | Middleware |
| `PUT /api/requests/:id/issue` | `requireRole('storekeeper')` | Middleware |
| `GET /api/requests` | `authenticate` only | Data-scoped by role in handler |
| `GET /api/users` | ❌ None | Unauthenticated — see Issues |

### Role Enforcement — Frontend (UI-only, not security-critical)

- Staff: sees submit form and edit button on own pending requests only.
- Storekeeper: sees review and issue buttons only on eligible requests; self-action UI hint shown.
- Role is read from `localStorage` for UI rendering — acceptable since backend enforces all real decisions.

---

## 6. Protected Action Status

**Protected actions: approve/reject, mark as issued, edit storekeeper note**

| Check | Status | Evidence |
|---|---|---|
| Approve requires storekeeper role | ✅ Enforced | `requireRole('storekeeper')` in `requestRoutes.js:84` |
| Reject requires storekeeper role | ✅ Enforced | Same route as approve |
| Issue requires storekeeper role | ✅ Enforced | `requireRole('storekeeper')` in `requestRoutes.js:114` |
| Self-approval blocked | ✅ Enforced | `existing.requester_id === user.id` check at `requestRoutes.js:98` |
| Self-issue blocked | ✅ Enforced | Same pattern at `requestRoutes.js:128` |
| Approve only from pending | ✅ Enforced | `request.status !== 'pending'` guard in `requestService.js:88` |
| Issue only from approved | ✅ Enforced | `request.status !== 'approved'` guard in `requestService.js:110` |
| Storekeeper note write-only via approve route | ✅ Enforced | No standalone note-edit endpoint exists |
| Staff cannot write storekeeper note | ✅ Enforced | `requireRole('storekeeper')` blocks staff from the approve route entirely |
| Staff ownership on edit | ✅ Enforced | Service: `request.requester_id !== requesterId` → throws |
| Storekeeper cannot edit staff request details | ✅ Effectively | Service ownership check uses `requesterId` from JWT-verified user |

**All explicitly listed protected actions are correctly guarded in the backend.**

---

## 7. Validation Status

### Backend Validation

| Field / Rule | Enforced |
|---|---|
| `itemName` required | ✅ `requestRoutes.js:35` |
| `quantity` required + > 0 | ✅ `requestRoutes.js:38` |
| `reason` required | ✅ `requestRoutes.js:35` |
| `requestedDate` required | ✅ `requestRoutes.js:35` |
| `status` value check on approve | ✅ `requestRoutes.js:88` |
| `issuedQuantity` > 0 | ✅ `requestRoutes.js:118` |
| `issuedQuantity` ≤ requested quantity | ✅ `requestService.js:113` |
| Username + password required at login | ✅ `authRoutes.js:14` |
| itemName max 255 chars | ❌ Missing at API layer |
| reason max 500 chars | ❌ Missing at API layer (TEXT column, no DB max) |
| storekeeperNote max 500 chars | ❌ Missing at API layer |
| requestedDate must be valid ISO date | ❌ No format check — any string accepted |
| quantity must be integer (not float) | ⚠️ Partial — `parseInt` used but floats truncated silently |

### Frontend Validation

| Check | Enforced |
|---|---|
| All four required fields | ✅ `required` attr + JS guard |
| Quantity > 0 | ✅ `parseInt(newQuantity) <= 0` check |
| Issued quantity > 0 and ≤ requested | ✅ JS guard in `handleStorekeeperIssue` |
| Username and password present | ✅ JS guard + `required` |
| Error feedback for invalid login | ✅ Inline message below form |
| Error feedback for form validation | ⚠️ Uses `alert()` — not inline UI component |

---

## 8. Stage Drift — Early Implementation

| Area | Finding |
|---|---|
| Testing | ✅ No tests created early. No test runner or test dependencies installed. |
| Security hardening | ✅ Correctly not done early. JWT for auth is expected, not premature. |
| Pagination | ✅ Not implemented — flat list. Acceptable at this stage. |
| Audit log / history table | ✅ Not implemented. `updated_at` is the only automatic trail. |
| User management UI | ✅ Not implemented. |
| Email / notification | ✅ Not implemented. |

**Conclusion:** No meaningful stage drift detected. The project implements exactly what the requirements specify without jumping ahead.

---

## 9. Issues Found Before Stage 8

Issues are classified as **Major**, **Minor**, or **Observation**.

### MAJOR-01 — `PUT /api/requests/:id` missing role guard

- **File:** `backend/routes/requestRoutes.js:58`
- **Detail:** The edit-own-request route applies `authenticate` but not `requireRole('staff')`. A storekeeper with a valid JWT can reach this route. The service layer checks `requester_id === userId` (blocking edits to requests they do not own), but there is no formal role-level restriction.
- **Risk:** A storekeeper who also has a pending request (acting as both roles) can edit it via this route, bypassing the implicit architectural rule that storekeepers do not edit requests.
- **Recommendation:** Add `requireRole('staff')` to this route before the final review.

### MAJOR-02 — `GET /api/users` is unauthenticated

- **File:** `backend/routes/userRoutes.js:6`
- **Detail:** The `/api/users` endpoint returns `id`, `username`, `role`, and `full_name` for all users without requiring any authentication. The comment "mock users" suggests a leftover from an earlier implementation phase.
- **Risk:** Exposes the full user directory and role assignments to any unauthenticated caller.
- **Recommendation:** Add `authenticate` middleware, or remove the endpoint if unused.

### MINOR-01 — `JWT_SECRET` hardcoded fallback

- **File:** `backend/middleware/authMiddleware.js:4`
- **Detail:** `const JWT_SECRET = process.env.JWT_SECRET || 'workshop-secret-key-123';`
- **Risk:** If `.env` is missing `JWT_SECRET`, the application silently uses a publicly known secret, defeating JWT security.
- **Recommendation:** Remove the fallback; throw a startup error if `JWT_SECRET` is not set.

### MINOR-02 — README `DB_NAME` documentation mismatch

- **File:** `README.md:42`
- **Detail:** Example env block shows `DB_NAME=inventory_db` but `.env.example` and `db_init.js` both default to `c5p3`.
- **Risk:** Developer following the README will create a mismatched database.
- **Recommendation:** Update the README example to match the actual default.

### MINOR-03 — No debounce on filter inputs

- **File:** `frontend/src/App.jsx:41-44`
- **Detail:** `useEffect` depends on `filterItemName` and `filterRequesterName`. Every keystroke triggers a new API call.
- **Risk:** Excessive requests on fast typing. Not a functional bug at prototype scale.
- **Recommendation:** Add debounce (e.g., 300 ms) before security hardening phase.

### MINOR-04 — `alert()` used for client-side validation errors

- **File:** `frontend/src/App.jsx:128, 161, 247`
- **Detail:** Frontend validation errors use native `alert()` dialogs instead of the inline error-message design used for the login form.
- **Risk:** Poor UX; inconsistent with the established design system.
- **Recommendation:** Replace with inline error state and a styled `div` following the `loginError` pattern.

### MINOR-05 — CSS inline style typo `justifycontent`

- **File:** `frontend/src/App.jsx:439`
- **Detail:** `justifycontent: 'space-between'` — the hyphen is missing. In React, the correct camelCase is `justifyContent`. The property is silently ignored.
- **Risk:** Request list header row may not space correctly between title and loading indicator.
- **Recommendation:** Change to `justifyContent`.

### MINOR-06 — Google Font not loaded

- **File:** `frontend/src/index.css:15`, `frontend/index.html`
- **Detail:** `'Outfit'` and `'Inter'` are declared in the CSS custom property but no `<link>` tag imports them from Google Fonts.
- **Risk:** Typography falls back to `system-ui` on most machines, diverging from the intended design.
- **Recommendation:** Add a Google Fonts `<link>` import to `frontend/index.html`.

### OBSERVATION-01 — No `.gitignore` verified

- **Detail:** No `.gitignore` was found in the project root or `backend/`. The `backend/.env` file contains credentials. Without `.gitignore`, `.env` could be accidentally committed.
- **Recommendation:** Add `.gitignore` entries for `*.env` and `node_modules/`.

### OBSERVATION-02 — Float inputs silently truncated for quantity fields

- **File:** `backend/routes/requestRoutes.js:38, 118`
- **Detail:** `parseInt(issuedQuantity)` truncates floats. `"1.9"` becomes `1`, with no error returned. `NaN` is correctly rejected by the `<= 0` check.
- **Recommendation:** Add `Number.isInteger(Number(value))` check before `parseInt`.

### OBSERVATION-03 — No staff cancel/withdraw action

- **Detail:** Staff can submit and edit pending requests but cannot withdraw one they no longer need. Not currently in scope per REQUIREMENTS.md but noted for future consideration.

---

## 10. Manual Checks Recommended Next

| # | Check | Role | Expected Outcome |
|---|---|---|---|
| 1 | Run `npm run db:setup` on a clean MySQL instance | — | DB `c5p3` created; 4 users and 4 requests seeded; no errors |
| 2 | Run `npm run dev` from project root | — | Backend on 5000, frontend on 5173; `/api/health` returns UP |
| 3 | Log in as `john_staff` / `password123` | Staff | Dashboard shown; only john's 2 requests visible |
| 4 | Submit a new request with all fields | Staff | Success toast; new request with `pending` status in list |
| 5 | Edit the new pending request | Staff | Changes persist; list refreshes correctly |
| 6 | Filter by item name | Staff | List narrows to matching items only |
| 7 | Filter by status = `approved` | Staff | Only approved requests shown |
| 8 | Log in as `bob_storekeeper` / `password123` | Storekeeper | All 5+ requests from all staff visible |
| 9 | Filter by requester name | Storekeeper | Only matching staff's requests shown |
| 10 | Approve a pending request with a note | Storekeeper | Status → `approved`; note visible on request card |
| 11 | Attempt to re-approve the same request | Storekeeper | Error: "Can only approve or reject requests that are pending" |
| 12 | Mark an approved request as issued with quantity | Storekeeper | Status → `issued`; issued quantity and timestamp displayed |
| 13 | Attempt to approve a request where SK is requester | Storekeeper | UI hint "Self-approval disabled"; backend returns 403 if called directly |
| 14 | Call `PUT /api/requests/1/approve` with a staff JWT | Staff (via tool) | Backend returns 403 Forbidden |
| 15 | Call `GET /api/users` with no token | — | Currently returns 200 (MAJOR-02); confirm unauthenticated access |
| 16 | Call `GET /api/requests` with no token | — | Backend returns 401 Unauthorized |
| 17 | Call `POST /api/requests` with a storekeeper JWT | Storekeeper | Backend returns 403 Forbidden |
| 18 | Log in as staff; verify storekeeper note is read-only | Staff | Note-box renders as text only; no edit input visible |
| 19 | Verify rejected request from seed data shows storekeeper note | Any | Note-box visible on request card if note is set |
| 20 | Log out and verify re-login is required | — | No data accessible without a token; 401 on any API call |

---

## 11. Pass/Fail Table

| Checkpoint | Result | Notes |
|---|---|---|
| App appears runnable (start scripts, dependencies present) | ✅ PASS | Root `npm run dev`, backend `npm start`, frontend `npm run dev` all defined |
| React frontend and Express backend are separated | ✅ PASS | `frontend/` and `backend/` are distinct projects with separate `package.json` |
| React calls Express routes only — no direct MySQL from frontend | ✅ PASS | All data access via `/api/*` fetch calls; Vite proxy configured |
| Backend uses all five DB env vars from `.env` only | ✅ PASS | `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME` all in `backend/.env`, consumed by `config/db.js` |
| Secrets not exposed in React build | ✅ PASS | No `VITE_DB_*` or similar vars; DB config is backend-only |
| `users` table exists in DB script | ✅ PASS | `db_init.js` creates `users` with `password_hash` and `role` ENUM |
| `inventory_requests` table exists with required columns | ✅ PASS | All fields including `storekeeper_note`, `issued_quantity`, `issued_at` present |
| Repeatable database setup/seed command exists | ✅ PASS | `npm run db:setup` → `node scripts/db_init.js` — idempotent DROP+CREATE |
| Login is database-backed (not mock-only or role-selector-only) | ✅ PASS | `POST /api/auth/login` queries DB, bcrypt compare, JWT issued |
| Role restrictions enforced in backend (not only UI) | ✅ PASS | `requireRole()` middleware on protected routes; role re-fetched from DB per request |
| Approve/reject protected by backend role check | ✅ PASS | `requireRole('storekeeper')` on `PUT /:id/approve` |
| Mark as issued protected by backend role check | ✅ PASS | `requireRole('storekeeper')` on `PUT /:id/issue` |
| Edit storekeeper note protected | ✅ PASS | Only writable via storekeeper-only approve route; no standalone edit endpoint |
| Staff limited to own requests in list | ✅ PASS | `requesterId` injected server-side when `user.role === 'staff'` |
| Main workflow (submit → approve/reject → issue) implemented | ✅ PASS | All three stages wired end-to-end |
| Secondary feature (filter by item, requester, status) implemented | ✅ PASS | All three filter params active; per-role filter restrictions enforced |
| Validation present in backend | ✅ PASS with gaps | Core required fields checked; max-length and date format not validated |
| No future stages implemented early (tests, security hardening) | ✅ PASS | No test files, no helmet/rate-limiting, no user management UI |
| `PUT /:id` edit route formally restricts to staff role | ❌ FAIL | Route applies only `authenticate`, not `requireRole('staff')` (MAJOR-01) |
| `GET /api/users` requires authentication | ❌ FAIL | Endpoint is unauthenticated; returns user directory publicly (MAJOR-02) |
| `JWT_SECRET` requires env var (no hardcoded fallback) | ❌ FAIL | Falls back to `'workshop-secret-key-123'` if env var is missing (MINOR-01) |

---

*End of Mid-Project Review*
