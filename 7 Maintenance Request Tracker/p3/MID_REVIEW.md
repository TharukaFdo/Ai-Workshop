# Mid-Project Review — Maintenance Request Tracker
**Project:** p3 — Maintenance Request Tracker  
**Review Date:** 2026-06-14  
**Review Stage:** After secondary feature (filter by location/priority/status). Before testing, security hardening, and maintainability cleanup.  
**Reviewer:** Antigravity (automated mid-project review)  
**Scope:** Read-only analysis. No source code, schema, or test files modified.

---

## 1. Mid-Review Summary

The project is a React + Express + MySQL prototype for maintenance request tracking with two roles: Requester and Technician. The core workflow — submission, progress update, and closure — is implemented end-to-end. The secondary filter feature is implemented on both the frontend (dropdowns) and backend (query parameters with parameterised SQL). The architecture is correctly separated with React on port 3000 proxying `/api` calls to Express on port 5000, and MySQL credentials are fully server-side.

Login is database-backed using a custom HMAC-signed token (no `jsonwebtoken` package). Password hashing uses SHA-256 HMAC. Both are functional but carry known prototype-grade security weaknesses that are expected to be addressed in the hardening stage.

The strongest areas are the backend route logic, role enforcement per-request (user re-fetched from DB on every protected call), and the filter query builder. The weakest areas before the next stage are: the seeded passwords stored as `placeholder_hash` until `npm run db:setup` is run separately, the absence of any automated tests or test framework, a `deleteRequestForTest` helper left in the production service file, missing field-length validation in the backend, a hardwired requester-name initialisation in the UI, and a weak token format that is not standard JWT.

Overall the project is in a solid state for a pre-hardening prototype. No critical data-loss or logic bugs were found. The primary gaps are security-quality concerns (password hash algorithm, token format, CORS wildcard) and missing test infrastructure.

---

## 2. Review Scoring Matrix

| Feature / Area | Functionality 0-5 | Data Persistence 0-5 | Backend Security / Role Control 0-5 | Validation / Error Handling 0-5 | Testing Evidence 0-5 | Maintainability 0-5 | UI / Manual Usability 0-5 | Evidence | Notes |
|---|---:|---:|---:|---:|---:|---:|---:|---|---|
| Project setup and run commands | 4 | — | — | — | 0 | 3 | — | `README.md`, root `package.json` scripts, `backend/package.json` | Run instructions present, two-terminal workflow documented. `npm run install-all` helper exists. No `nodemon`; `dev` script calls `node` directly so no auto-restart on change. |
| Database setup and starter data | 4 | 4 | — | — | 0 | 3 | — | `schema.sql`, `scripts/dbSetup.js`, `backend/package.json db:setup` | `schema.sql` seeds placeholder hashes; `dbSetup.js` replaces them with real hashes. Two-step setup is not obvious and can be missed. DB name mismatch between `.env` (`c7p3`) and `.env.example` (`maintenance_db`). |
| Login workflow | 3 | 4 | 2 | 3 | 0 | 3 | 4 | `routes/auth.js`, `utils/auth.js`, `services/userService.js`, `App.jsx` L60-81 | DB-backed login with HMAC-signed custom token. Token is verified on every protected call. No JWT library; custom format is brittle. SHA-256 HMAC (no bcrypt/argon2); secret fallback hardcoded in `utils/auth.js` L4. Token has no revocation mechanism. UI pre-fills `password123` for convenience. |
| Role-based access | 4 | — | 4 | 3 | 0 | 3 | 4 | `routes/requests.js` L9-33, L41-47, L68-70, L109-111, L156-158 | Role is re-fetched from DB on every call (`checkUser` middleware) — correct pattern. Requester-only create, Technician-only PATCH, ownership check on PUT. UI role branching mirrors backend. Minor: no explicit guard preventing a Technician from calling PUT (backend role check covers it). |
| Main create action | 4 | 5 | 4 | 3 | 0 | 4 | 4 | `routes/requests.js` L54-85, `services/requestService.js` L10-17, `App.jsx` L119-159 | POST `/api/requests` guarded, persists all required fields, returns 201. Validation checks all five fields and priority enum. Missing: max-length check on title/location/requesterName per `REQUIREMENTS.md §4`. |
| Main view/list action | 5 | 5 | 5 | 3 | 0 | 4 | 4 | `routes/requests.js` L36-52, `services/requestService.js` L22-80, `App.jsx` L92-117 | Requesters see only their own records (scoped by `requester_id`); Technicians see all. Both support filters. Ordered by `created_at DESC`. No pagination (acceptable for prototype). |
| Main update/status/cancel action | 4 | 5 | 4 | 3 | 0 | 4 | 4 | `routes/requests.js` L87-132 (PUT), L134-169 (PATCH), `services/requestService.js` L85-113 | Requester PUT enforces ownership and `submitted` status guard both in route and in SQL (`WHERE status = 'submitted'`). Technician PATCH sets `closed_at` on closure. No status transition enforcement (e.g., a Technician can jump from `submitted` directly to `closed` or set status back to `submitted`). |
| Protected action | 4 | 5 | 4 | 3 | 0 | 4 | 4 | `routes/requests.js` L155-158, `services/requestService.js` L95-113, `App.jsx` L510-540 | PATCH is Technician-only enforced at backend. Technician note and status update only reachable via `PATCH /:id`. Requester UI hides the technician form. Backend independently rejects a Requester PATCH with 403. No separate "close" endpoint — closing is one status value in PATCH; functionally correct. |
| Secondary feature | 4 | — | 4 | 3 | 0 | 4 | 4 | `routes/requests.js` L36-52, `services/requestService.js` L30-80, `App.jsx` L357-385 | Filters by location, priority, status implemented end-to-end with parameterised SQL. Filter values passed as query params. Requesters' filter scoped to their own records. Filter location values are hardcoded constants in frontend; no free-text risk. |
| Case-specific: location, priority, and problem details | 4 | 5 | 4 | 3 | 0 | 4 | 4 | `schema.sql` L20-24, `routes/requests.js` L57, `App.jsx` L321-345 | Location (VARCHAR 100), Priority (ENUM), Description (TEXT) all present in schema. All required on submit. Displayed in list view and detail modal. Location is a dropdown of five predefined values in UI (no free-text risk, but the constant list is only in `App.jsx` — not shared with backend). Priority badge colouring works. |
| Case-specific: technician notes and progress updates | 4 | 5 | 4 | 3 | 0 | 4 | 4 | `schema.sql` L27, `routes/requests.js` L134-169, `services/requestService.js` L95-113, `App.jsx` L518-539 | `technician_note` column exists (TEXT, nullable). PATCH route updates status and note together. Note is always overwritten (not appended) — a single note field. Requester view shows the note read-only if present (`App.jsx` L495-500). Technician form always allows note editing regardless of status. |
| Case-specific: request closure protection and requester visibility | 4 | 5 | 4 | 3 | 0 | 4 | 4 | `routes/requests.js` L155-158, `schema.sql` L30, `services/requestService.js` L98-113, `App.jsx` L495-508 | Closing is Technician-only via PATCH. `closed_at` is set to `NOW()` on closure. Requester sees note read-only. Requester cannot edit a non-submitted request. No visible closure timestamp in the Requester UI view. |
| UI / manual usability | 4 | — | — | 3 | 0 | 3 | 4 | `frontend/src/App.jsx`, `frontend/src/index.css` | Single-page app with login, dashboard, filter bar, table list, and detail modal. Role-appropriate UI branching. Colour-coded status and priority badges. Responsive two-column layout for Requester. Alert messages for success/error. No loading spinner on detail modal save. No confirmation dialog before closing a request. |
| Security posture | 2 | — | 2 | — | 0 | 2 | — | `backend/.env`, `utils/auth.js`, `server.js` L9, `config/db.js` | DB credentials in `.env` (correct). CORS is `app.use(cors())` — wildcard in dev (acceptable pre-hardening). Custom token, not JWT. SHA-256 HMAC hash, not bcrypt. Secret fallback string hardcoded in source (`utils/auth.js` L4). No rate limiting. No input sanitisation beyond enum checks. `.env` file committed (credentials present, including blank password — low risk but noteworthy). |
| Testing evidence | 0 | — | — | — | 0 | — | — | Entire codebase | No test framework installed (no Jest, Mocha, Vitest, etc.). No test files. One test-cleanup helper (`deleteRequestForTest`) exists in production `requestService.js` — signals test intent but no tests written. `REQUIREMENTS.md §6` defines the test plan. |
| Maintainability | 3 | — | — | — | 0 | 3 | — | All source files | JSDoc comments on service methods. Config clearly separated. Services separated from routes. Entire frontend is one 550-line `App.jsx` — no component decomposition. Hardwired requester-name mapping in `App.jsx` L48. Constants (`LOCATIONS`, `PRIORITIES`, `STATUSES`) duplicated between frontend and not validated against backend. No linter/formatter config. |

---

## 3. Current Feature Status

| Feature | Status | Notes |
|---|---|---|
| Maintenance request submission | ✅ Implemented | POST `/api/requests`, Requester-only, all five fields required, 201 on success |
| View own requests (Requester) | ✅ Implemented | GET `/api/requests` scoped to `requester_id` |
| Edit own open request (Requester) | ✅ Implemented | PUT `/api/requests/:id`, ownership + status=submitted guard |
| View all requests (Technician) | ✅ Implemented | GET `/api/requests`, all records for Technician role |
| Progress update and notes (Technician) | ✅ Implemented | PATCH `/api/requests/:id`, status + technician_note |
| Request closure | ✅ Implemented | Status `closed` via PATCH, `closed_at` set automatically |
| Filter by location / priority / status | ✅ Implemented | Query params on GET, parameterised SQL in service |
| Technician note visible to Requester (read-only) | ✅ Implemented | Rendered in Requester detail modal when note exists |
| Status transition enforcement | ⚠️ Partial | No enforced progression order (e.g., `submitted → closed` is allowed) |
| Field length validation | ⚠️ Missing | Schema sets VARCHAR(100) but backend routes do not check length |
| Confirmation on close | ⚠️ Missing | No "Are you sure?" dialog before closing |
| Closure timestamp visible in UI | ⚠️ Missing | `closed_at` stored in DB but not shown to Requester or Technician in UI |
| Pagination | ➖ Not present | Acceptable for prototype scope |
| File attachments | ➖ Not present | Not in scope |

---

## 4. Database and Persistence Status

### Tables
| Table | Exists in Schema | Seeded | Notes |
|---|---|---|---|
| `app_users` | ✅ | ✅ (3 users) | Username, `password_hash`, role ENUM. Passwords seeded as `placeholder_hash`; `dbSetup.js` replaces with real hash. |
| `requests` | ✅ | ➖ (no sample requests) | All required columns present: title, description, location, priority, requester_name, requester_id, status, technician_note, created_at, updated_at, closed_at. |

### Issues
- **Two-step setup risk:** `schema.sql` seeds `placeholder_hash`; running only `mysql < schema.sql` without subsequently running `npm run db:setup` leaves users with unusable passwords. The README documents the `mysql` CLI import but does not prominently mention running `db:setup` afterwards.
- **DB name mismatch:** `.env` uses `DB_NAME=c7p3`; `.env.example` uses `DB_NAME=maintenance_db`. `schema.sql` creates `c7p3`. Low risk (`.env` is correct) but confusing.
- **No sample request seed data** for immediate demonstration after setup.
- **No foreign key index** on `requests.requester_id` (MySQL adds implicit index for FK, so functional).
- **`DROP TABLE IF EXISTS` in schema** means re-running `npm run db:setup` destroys all data. Acceptable for prototype; needs note.

---

## 5. Login and Role/Access Status

### Login Classification
**Database-backed** — `app_users` table queried on every login. Role loaded from DB on every protected API call (not from token payload alone).

### Authentication Mechanism
| Item | Implementation | Assessment |
|---|---|---|
| Credential storage | `app_users.password_hash` in MySQL | ✅ Correct location |
| Hashing algorithm | SHA-256 HMAC keyed with `JWT_SECRET` | ⚠️ Not a password KDF; no salt; bcrypt/argon2 expected in hardening |
| Token format | Custom `id:role:timestamp.signature` HMAC | ⚠️ Not standard JWT; not compatible with standard JWT libraries/middleware |
| Token expiry | 24-hour timestamp check in `verifyToken` | ✅ Present |
| Token verification | Signature re-computed on every call | ✅ Correct |
| Role source on API call | Re-fetched from DB (`getUserById`) | ✅ Cannot be spoofed via token |
| Secret fallback | Hardcoded in `utils/auth.js` line 4 | ⚠️ Fallback present; secret in `.env` is committed |
| Token revocation | None | ⚠️ Expected gap pre-hardening |

### Role Enforcement (Backend)
| Route | Requester | Technician | Non-auth |
|---|---|---|---|
| GET `/api/requests` | Own records only | All records | 401 |
| POST `/api/requests` | ✅ Allowed | 403 | 401 |
| PUT `/api/requests/:id` | ✅ Own + submitted only | 403 | 401 |
| PATCH `/api/requests/:id` | 403 | ✅ Allowed | 401 |

All four routes require a valid token via the `checkUser` middleware. Role checks are backend-enforced and not solely UI-gated.

---

## 6. Protected Action Status

**Protected action:** Add or edit technician notes and close requests.

| Protection Layer | Present | Detail |
|---|---|---|
| Backend role check on PATCH | ✅ | `routes/requests.js` L156-158: returns 403 if not Technician |
| Backend role check on close (via PATCH status=closed) | ✅ | Same PATCH guard; closing is one status transition |
| `closed_at` set automatically on closure | ✅ | `services/requestService.js` L103-104 |
| Requester UI hides Technician form | ✅ | `App.jsx` L450 branches on `currentUser.role` |
| Requester cannot see Technician note edit field | ✅ | Note shown read-only in Requester modal only when non-empty |
| Ownership check on Requester PUT | ✅ | `routes/requests.js` L114 |
| Status-locked edit for Requester | ✅ | Route L119, Service L89 both enforce `status = 'submitted'` |
| Status transition order enforced | ⚠️ **Missing** | A Technician can set `closed` from `submitted` or reset to `submitted` |
| Confirmation before close | ⚠️ **Missing** | No UI confirmation step |

The core protection requirement ("Requesters cannot close requests or edit technician notes") is correctly enforced at the backend. The gap is the absence of status-order enforcement, which could allow a Technician to close a request that was never marked in-progress.

---

## 7. Validation Status

| Validation Rule | Required by REQUIREMENTS.md | Backend Present | Frontend Present | Notes |
|---|---|---|---|---|
| All five create fields required | §4 | ✅ `routes/requests.js` L60-62 | ✅ `required` HTML + JS guard | |
| Priority must be Low/Medium/High | §4 | ✅ `routes/requests.js` L64-66, L98-100 | ✅ Dropdown only | |
| Status must be valid enum | §4 | ✅ `routes/requests.js` L145-147 | ✅ Dropdown only | |
| Title max 100 chars | §4 | ❌ Missing | ❌ Missing | Schema enforces at DB level; no API error returned |
| Location max 100 chars | §4 | ❌ Missing | ❌ Missing | Same |
| RequesterName max 100 chars | §4 | ❌ Missing | ❌ Missing | Same |
| Description non-empty | §4 | ✅ (covered by "all fields" check) | ✅ `required` + JS trim check | |
| Status token required for PATCH | — | ✅ `routes/requests.js` L141-143 | — | |
| Edit blocked if not submitted | REQ-2 | ✅ Route L119 + SQL L89 | ✅ Inputs disabled + submit hidden | |
| Requester cannot update status/notes | REQ-4 | ✅ 403 on PATCH | ✅ UI hidden | |
| Ownership check | REQ-2 | ✅ `routes/requests.js` L114 | — | |

**Summary:** Field-existence and enum validation is solid. Length validation is absent in the backend (three fields). DB engine will reject over-length strings with a MySQL error which will surface as a 500, not a proper 400 with a user-friendly message.

---

## 8. Stage Drift / Early Implementation

| Item | Expected Stage | Found | Assessment |
|---|---|---|---|
| JWT-style signed token | Hardening stage | Present (custom HMAC token) | Acceptable — the mechanism exists, algorithm upgrade needed |
| `closed_at` timestamp | Core workflow | Present in schema and service | ✅ Correct scope, not drift |
| `deleteRequestForTest` helper | Testing stage | Present in production `requestService.js` | ⚠️ Test utility in production file — should move to test setup |
| `/api/health` endpoint | Ops/infrastructure | Present in `server.js` | Minor early addition; not harmful |
| Token 24-hour expiry | Hardening | Present in `verifyToken` | Acceptable prototype-quality forward step |
| Filter for Requester's own records | Not explicitly scoped to filters | Requester filter also scoped to own records | ✅ Correct behaviour |
| Password hint visible on login screen | — | `password123` shown in UI plain text | ⚠️ Prototype shortcut; must be removed before any real use |

No major features from later stages (e.g., email notifications, file uploads, audit logs) were pre-implemented. Drift is minimal and low-risk.

---

## 9. Issues Found Before Stage 8

Issues are grouped by severity.

### 🔴 High — Would cause test failures or data integrity problems

| # | File | Issue |
|---|---|---|
| H-1 | `schema.sql` L35-38 + `scripts/dbSetup.js` | Seeded users have `placeholder_hash`; running schema only (without `db:setup`) leaves logins broken. README does not clearly sequence these two steps together. |
| H-2 | `backend/utils/auth.js` L17-19 | `verifyPassword` uses SHA-256 HMAC, not a password hashing KDF. Timing-safe comparison (`crypto.timingSafeEqual`) is not used — susceptible to timing attack on hash comparison. |
| H-3 | `routes/requests.js` L134-169 | No status transition order enforced on PATCH. Technician can set status to `submitted` (reopening a closed request) or skip stages (e.g., `submitted → closed`). |

### 🟡 Medium — Gaps that weaken security or correctness but do not break the happy path

| # | File | Issue |
|---|---|---|
| M-1 | `backend/utils/auth.js` L4 | Secret fallback `'super_secret_workshop_key_12345'` hardcoded in source. If `JWT_SECRET` env var is missing the app silently uses the weak default. |
| M-2 | `backend/server.js` L9 | `cors()` with no options allows all origins. Acceptable in dev; needs origin restriction before any non-local deployment. |
| M-3 | `routes/requests.js` L60-62, L94-96 | No max-length validation on `title` (100), `location` (100), `requesterName` (100) as required by `REQUIREMENTS.md §4`. Over-length input triggers an unhandled MySQL error (500 response, no user message). |
| M-4 | `backend/.env` | `.env` file is present in the repository (not gitignored as far as can be determined). Contains `JWT_SECRET` with a real value. |
| M-5 | `services/requestService.js` L117-121 | `deleteRequestForTest` is a production-shipped method intended for test cleanup. Should be removed from production service or isolated to a test helper module. |

### 🔵 Low — Quality, usability, or maintainability concerns

| # | File | Issue |
|---|---|---|
| L-1 | `App.jsx` L48 | Requester name is hardcoded: `alice_requester → 'Alice Smith'`, `charlie_requester → 'Charlie Brown'`. Any new user added to the DB will not get a mapped name and the field will be empty. |
| L-2 | `App.jsx` (entire file) | All UI logic in a single 550-line component with no sub-components. Will become hard to maintain. Not a stage 7 requirement but will impact the maintainability stage score. |
| L-3 | `App.jsx` L3-5 | `LOCATIONS`, `PRIORITIES`, `STATUSES` constants exist only in the frontend. Backend validates priority/status via its own inline arrays. The location list is not validated at all on the backend (open string match). |
| L-4 | `backend/package.json` L8 | `"dev": "node server.js"` — no `nodemon` or equivalent. Backend must be manually restarted on every code change during development. |
| L-5 | `frontend/src/App.jsx` L495-500 | Technician note shown to Requester only when non-empty (`selectedRequest.technician_note &&`). Requester has no indication that a note field exists but is blank. Minor UX gap. |
| L-6 | Schema / UI | `closed_at` is stored in the DB but never rendered in the UI for either role. |
| L-7 | `index.css` L76-92 | `.role-picker` CSS class is defined but the role picker component was removed in favour of database login. Dead CSS. |
| L-8 | `.env.example` L6 | `DB_NAME=maintenance_db` does not match the actual value `c7p3` used in `schema.sql` and `.env`. |
| L-9 | `App.jsx` L270 | Login screen displays `Note: Standard seeded password is password123`. Must be removed before any non-prototype use. |

---

## 10. Manual Checks Recommended Next

Before the testing stage, the following should be verified by hand:

1. **Two-step setup flow:** Run `mysql < backend/schema.sql`, then `npm run db:setup`, then attempt login as `alice_requester` / `password123`. Confirm success. Then attempt login without running `db:setup` first to observe the broken state (and confirm H-1 is real).

2. **Role boundary — Requester cannot PATCH:** Using a REST client (e.g., Postman or curl), log in as `alice_requester`, copy the token, and call `PATCH /api/requests/1` with a valid body. Confirm 403.

3. **Role boundary — Technician cannot POST:** Log in as `bob_technician`, call `POST /api/requests` with a valid body. Confirm 403.

4. **Ownership boundary — Requester A cannot edit Requester B's request:** Log in as `alice_requester`, note a request ID. Log in as `charlie_requester`, call `PUT /api/requests/<alice's id>`. Confirm 403.

5. **Status lock — Requester cannot edit in-progress request:** Submit a request as `alice_requester`, then as `bob_technician` set it to `inProgress`. Log back in as `alice_requester`, attempt `PUT /api/requests/<id>`. Confirm 400 or 403.

6. **Status regression — Technician can set status to submitted (H-3):** As `bob_technician`, set a request to `closed`, then immediately send `PATCH` with `status: "submitted"`. Confirm it succeeds (current bug) and `closed_at` is reset to NULL.

7. **Filter combination:** As `bob_technician`, set filters for Location=`Building A`, Priority=`High`, Status=`submitted`. Confirm only matching records appear.

8. **Requester sees own records only:** Log in as `alice_requester`, note request IDs. Log in as `charlie_requester`, confirm Alice's requests are not visible.

9. **Technician note visibility:** As `bob_technician`, add a note to a request. Log in as `alice_requester`, open the same request, confirm note is visible read-only.

10. **Over-length input (M-3):** Submit a request with a title longer than 100 characters. Confirm the current 500 error (unhandled DB truncation) — this is what length validation should fix.

---

## 11. Pass/Fail Table

| Check | Result | Detail |
|---|---|---|
| App appears runnable | ✅ Pass | `node_modules` present in both `backend/` and `frontend/`. Scripts defined in root and sub-package `package.json`. |
| React and Express are separated | ✅ Pass | Vite React on port 3000; Express on port 5000. Separate directories, separate `package.json`. |
| React calls Express via `/api` proxy, not MySQL directly | ✅ Pass | `vite.config.js` proxy `/api → http://localhost:5000`. No MySQL client in frontend. |
| Backend uses DB_HOST/PORT/USER/PASSWORD/NAME env vars | ✅ Pass | `config/db.js` reads all five from `process.env`. |
| Secrets not exposed to React | ✅ Pass | `.env` is backend-only. Frontend has no environment file. |
| `app_users` / login table exists | ✅ Pass | `app_users` table in `schema.sql` with username, password_hash, role. |
| Repeatable DB setup or seed command | ✅ Pass | `npm run db:setup` (runs `scripts/dbSetup.js`) is documented. Schema re-runnable with DROP/CREATE. |
| Login is database-backed | ✅ Pass | `userService.getUserByUsername` queries `app_users` on login. |
| Role restrictions enforced in backend (not UI-only) | ✅ Pass | `checkUser` middleware re-fetches user from DB; role checks in routes return 401/403. |
| Protected action (add/edit technician notes, close) is backend-protected | ✅ Pass | PATCH route returns 403 for non-Technician. |
| Users limited to own records where relevant | ✅ Pass | Requester GET scoped to `requester_id`; PUT checks ownership. |
| Main workflow implemented (submit → progress → close) | ✅ Pass | POST, PUT, PATCH routes cover full lifecycle. `closed_at` set on close. |
| Filter by location/priority/status implemented | ✅ Pass | Query params on GET, parameterised SQL in both `getAllRequests` and `getRequestsByRequesterId`. |
| Validation present | ⚠️ Partial | Enum and required-field checks present. Max-length validation absent (M-3). |
| No premature future-stage implementation | ✅ Pass | No email, audit logs, file uploads, or hardening features pre-implemented. Custom token is proto-quality, not a full hardening skip. |
| No automated tests | ❌ Fail | No test framework, no test files. `deleteRequestForTest` in production code is the only test-related artifact. |
| Maintainability baseline | ⚠️ Partial | Service/route separation and JSDoc present. Monolithic `App.jsx`, hardwired name mapping, dead CSS, and no linter are gaps. |
