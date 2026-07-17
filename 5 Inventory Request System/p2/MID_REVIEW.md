# Mid-Project Review — Inventory Request System
**Case:** Inventory Request System (Case 5, Project 2)
**Review Stage:** After secondary feature (filter) — before Stage 8 (testing), security hardening, and maintainability cleanup
**Review Date:** 2026-07-11
**Reviewer:** Antigravity AI
**Stack:** React 19 + Vite (frontend) · Express 4 + mysql2 (backend) · MySQL (database)

---

## 1. Mid-Review Summary

The project is structurally sound and further along than the expected stage boundary. Both layers are cleanly separated, every API call flows through Express, the database is fully MySQL-backed with env-var configuration, and the core happy-path for submission → approval → rejection → issuance is implemented and enforced on the backend. The secondary filter feature is also complete. Notably, a 229-line integration test script (`test.js`) was committed ahead of Stage 8, which is stage drift.

The main weaknesses at this stage are: plaintext password storage, a volatile in-memory session store (restarts destroy all sessions), a stale `schema.sql` that does not match the schema created by `db-setup.js`, a hardcoded `http://localhost:5000` base URL in the React source, a missing title/SEO meta tag in `index.html`, and the absence of a `cancelled` or staff-cancel workflow mentioned as a plausible edge case. None of these block normal demonstration use, but all are expected to be addressed in later stages.

Overall the project is in good health for this stage.

---

## 2. Review Scoring Matrix

> Score meaning: 0 = missing · 1 = present but mostly not working · 2 = partially working with major gaps · 3 = mostly working with important gaps · 4 = working with minor gaps · 5 = complete for the selected case scope

| Feature / Area | Functionality 0-5 | Data Persistence 0-5 | Backend Security / Role Control 0-5 | Validation / Error Handling 0-5 | Testing Evidence 0-5 | Maintainability 0-5 | UI / Manual Usability 0-5 | Evidence | Notes |
|---|---:|---:|---:|---:|---:|---:|---:|---|---|
| Project setup and run commands | 5 | 5 | — | — | — | 4 | — | `backend/package.json` scripts: `start`, `dev`, `db:setup`, `db:reset`, `test`; `frontend/package.json`: `dev`, `build`, `lint`, `preview` | Both layers have clear run commands. No root-level `package.json` or README combining both starts in one step. |
| Database setup and starter data | 4 | 5 | — | — | — | 3 | — | `db-setup.js` (124 lines), `schema.sql` (15 lines) | `db-setup.js` correctly creates `users` + `requests` tables, seeds 3 users and 4 sample requests, and supports `--reset`. `schema.sql` is stale: it still uses the old `inventory_request_db` DB name, lacks the `users` table entirely, and uses `storekeeper_notes` (plural) vs `storekeeper_note` (singular) in the live schema. |
| Login workflow | 4 | 3 | 3 | 4 | 4 | 3 | 5 | `server.js` lines 20–54; `App.jsx` lines 80–121 | Database-backed login with username/password matching. Plaintext password comparison — no bcrypt. In-memory `Map` session store (lost on restart). Token format is `token_<random>_<userId>` — low entropy. Login/logout endpoints return clear errors. Demo credentials shown in UI. |
| Role-based access | 5 | 4 | 4 | 4 | 4 | 4 | 4 | `requests.js` lines 8–34 (`authMiddleware`); lines 116–119 (storekeeper guard); lines 46–49 (staff scope) | `authMiddleware` queries DB on every request to confirm role — not trusting client-supplied role. Staff are scoped to their own records server-side. Storekeeper-only actions return 403 for staff. Role is read from DB, not from JWT/token payload. |
| Main create action | 5 | 5 | 4 | 5 | 4 | 4 | 5 | `requests.js` lines 75–108; `App.jsx` lines 142–184 | POST /api/requests validates item_name, quantity (positive int), reason, requested_date. Sets `requester_id` and `requester_name` from authenticated session, not from the request body. Returns 201 with the new record. UI has all four fields with required attributes. |
| Main view/list action | 5 | 5 | 5 | 4 | 4 | 4 | 4 | `requests.js` lines 37–72; `App.jsx` lines 40–71 | GET /api/requests scopes staff to `requester_id = user.id`. Storekeeper gets all requests. Returns ordered list. UI renders each request card with item name, requester, quantity, date, reason, note, status badge, and (when issued) issued_quantity and issued_at. |
| Main update/status/cancel action | 4 | 5 | 5 | 4 | 4 | 3 | 4 | `requests.js` lines 110–173; `App.jsx` lines 187–252 | PUT /api/requests/:id/status handles approved, rejected, issued. Transition guard: only `approved` can move to `issued`. No staff cancel-own-request action and no re-open path exists (not mentioned in the case brief, acceptable). No PATCH for editing own pending request either. |
| Protected action | 5 | 5 | 5 | 4 | 4 | 4 | 4 | `requests.js` lines 116–119, 136–138; `App.jsx` lines 516–598 | Approve, reject, issued: backend enforces storekeeper role (403 for staff). Self-approval/self-issue: backend checks `request.requester_id === user.id` (403). Storekeeper note is only writable via the status update endpoint, which is storekeeper-only. UI shows action panel only for storekeeper and hides it for self-requests with a warning message. |
| Secondary feature | 5 | 5 | 5 | 4 | 4 | 4 | 4 | `requests.js` lines 51–63; `App.jsx` lines 29–33, 132–138, 426–466 | Filters: item_name (LIKE), requester_name (LIKE), status (exact). All three applied server-side with parameterised queries. Requester filter shown only for storekeeper in UI (staff always see only own records). Status dropdown covers all four values. Filters reactive to input change via `useEffect`. |
| Case-specific: item, quantity, reason, and requester fields | 5 | 5 | 5 | 5 | 4 | 4 | 5 | `db-setup.js` lines 47–64 (schema); `requests.js` lines 79–100; `App.jsx` lines 346–404 | All four case fields present in DB schema, validated on POST, taken from session for `requester_id`/`requester_name` (staff cannot forge). `quantity` enforced as positive int. `reason` enforced non-empty. `requested_date` required. |
| Case-specific: approve/reject/issued status lifecycle | 5 | 5 | 5 | 5 | 4 | 4 | 4 | `requests.js` lines 110–173; `db-setup.js` line 56 | ENUM `('pending','approved','rejected','issued')`. Transition rules enforced: pending→approved, pending→rejected (storekeeper only), approved→issued (storekeeper only, with issued_quantity). `issued_at` timestamped. `issued_quantity` stored and displayed. No regression path from issued/rejected (appropriate). |
| Case-specific: storekeeper note protection and staff ownership | 5 | 5 | 5 | 4 | 4 | 4 | 4 | `requests.js` lines 116–119, 155–164; `App.jsx` lines 509–513 | Note is only writable through PUT /api/requests/:id/status which requires storekeeper role. Staff have no endpoint to write notes. Staff submit form does not include a note field. Note is shown read-only in the request card for both roles. Staff record ownership enforced via `requester_id = user.id` in GET scope. |
| UI / manual usability | 4 | — | — | 4 | — | 3 | 4 | `App.jsx` (611 lines); `index.css` (355 lines) | Clean card layout, status badges with colour coding, glassmorphism header, hover lift effects, responsive grid (collapses at 900 px). Action panel visible only to storekeeper. Demo credentials listed on login page. Page `<title>` still reads "frontend" (unchanged from Vite scaffold). No toast auto-dismiss; success/error messages persist until next action or page refresh. |
| Security posture | 2 | — | 3 | — | — | 2 | — | `db.js`, `server.js`, `sessionStore.js` | Positives: env vars for all DB credentials; role read from DB each request; parameterised queries throughout; CORS applied. Gaps: plaintext passwords (no hashing); `Math.random()` session tokens (not cryptographically secure); in-memory session store (no persistence, no expiry); `GET /api/users` exposes all usernames and roles without authentication; broad CORS (`*`). |
| Testing evidence | 3 | — | — | — | 3 | 2 | — | `backend/test.js` (229 lines); `package.json` `"test"` script | A 229-line integration test script covering login, submission, validation, staff-blocked-approve, storekeeper-approve, self-approval block, mark-issued, and filter is present and wired to `npm test`. It uses Node's built-in `fetch` and direct DB queries. No framework (no Jest/Mocha). Script was committed before Stage 8 (stage drift). No frontend tests. |
| Maintainability | 3 | — | — | — | — | 3 | — | Entire codebase | Positives: single responsibility in routes, clear naming, comments present. Gaps: all 611 lines of React UI in one file (`App.jsx`); `schema.sql` diverges from `db-setup.js`; base URL `http://localhost:5000` hardcoded in 6 places in `App.jsx` (lines 49, 85, 108, 160, 193, 230); no shared constant or env variable for it; no linting configuration for backend (only `oxlint` for frontend). |

---

## 3. Current Feature Status

| Feature | Implemented | Notes |
|---|---|---|
| Submit inventory request (item, quantity, reason, date) | Complete | All fields validated front-end and back-end |
| View own requests (staff) | Complete | Scoped by `requester_id` in DB query |
| View all requests (storekeeper) | Complete | Unscoped GET with filters |
| Approve request | Complete | Storekeeper only, pending→approved, note saved |
| Reject request | Complete | Storekeeper only, pending→rejected, note saved |
| Mark as issued | Complete | Approved→issued only, issued_quantity + issued_at recorded |
| Storekeeper note | Complete | Written via status endpoint, read-only for staff |
| Filter by item name | Complete | LIKE query, reactive filter UI |
| Filter by requester name | Complete | LIKE query, shown only to storekeeper in UI |
| Filter by status | Complete | Exact match dropdown |
| Self-approval prevention | Complete | Backend check requester_id === user.id |
| Staff cannot write storekeeper notes | Complete | No write path for staff at API level |
| Staff cancel own request | Not in case brief | Not implemented; acceptable |
| Edit a pending request | Not in case brief | Not implemented; acceptable |

---

## 4. Database and Persistence Status

### Tables in db-setup.js (authoritative)

| Table | Columns | Notes |
|---|---|---|
| `users` | id, username, password, role, created_at | Seeded with Alice (staff), Bob (staff), Charlie (storekeeper) |
| `requests` | id, item_name, quantity, reason, requested_date, requester_id, requester_name, status, storekeeper_note, issued_quantity, issued_at, created_at, updated_at | FK to users.id with CASCADE |

### Schema discrepancies

- `schema.sql` references `inventory_request_db` as the database name; `.env` and `db-setup.js` use `c5p2`. Running `schema.sql` directly would create the wrong database.
- `schema.sql` omits the `users` table entirely — it is not runnable as a standalone setup script.
- `schema.sql` uses `storekeeper_notes` (plural); `db-setup.js` uses `storekeeper_note` (singular).
- `schema.sql` omits `requester_id`, `issued_quantity`, `issued_at`, `updated_at`.

### Persistence gaps

- Session tokens are stored in a `Map` in process memory. A backend restart clears all sessions, forcing all users to log in again.
- No password hashing — passwords are stored and compared as plaintext strings.

### Repeatable setup

- `npm run db:setup` → creates DB, tables, seeds users and requests.
- `npm run db:reset` → drops and recreates everything. Repeatable.

---

## 5. Login and Role/Access Status

### Login type

**Database-backed.** The `/api/login` endpoint queries the `users` table, matches `username`, compares `password` directly (plaintext), then issues an in-memory session token.

### Role enforcement location

| Check | Location | Verdict |
|---|---|---|
| Token presence and validity | `authMiddleware` in `routes/requests.js` | Backend |
| Role read from DB on each request | `authMiddleware` line 22 | Backend |
| Storekeeper-only approve/reject/issue | `requests.js` line 117 | Backend |
| Staff scoped to own records | `requests.js` lines 46–48 | Backend |
| Self-approval block | `requests.js` line 136 | Backend |
| Action panel hidden for staff | `App.jsx` line 516 | UI layer only (backend enforces independently — no bypass risk) |

### Gaps

- `/api/users` (server.js line 67) is an unauthenticated endpoint. Any caller without a session token receives all usernames and roles.
- Session token entropy: `Math.random()` is not cryptographically random. Guessable in theory.
- No session expiry — tokens live until the process restarts or explicit logout is called.

---

## 6. Protected Action Status

| Protected Action | Backend Enforced | How |
|---|---|---|
| Approve a request | Yes | 403 if `user.role !== 'storekeeper'` |
| Reject a request | Yes | 403 if `user.role !== 'storekeeper'` |
| Mark as issued | Yes | 403 if `user.role !== 'storekeeper'`; also requires prior `approved` status |
| Edit storekeeper note | Yes | Note only accepted via PUT /api/requests/:id/status which requires storekeeper role |
| Self-approval prevention | Yes | 403 if `request.requester_id === user.id` |
| Staff viewing other staff's requests | Yes | GET query always adds `AND requester_id = ?` for staff role |

No bypass path was found in the backend routes.

---

## 7. Validation Status

### Backend validation — POST /api/requests

| Field | Check | Error message |
|---|---|---|
| `item_name` | Non-empty after trim | "Item name is required." |
| `quantity` | parseInt, must be > 0 | "Quantity must be a positive integer." |
| `reason` | Non-empty after trim | "Reason for request is required." |
| `requested_date` | Truthy check (format not validated) | "Requested date is required." |

### Backend validation — PUT /api/requests/:id/status

| Check | Error |
|---|---|
| Status must be approved/rejected/issued | "Invalid target status." |
| Issued-quantity required and > 0 when marking issued | "Issued quantity must be a positive integer." |
| Issued-quantity <= requested quantity | "Issued quantity cannot exceed requested quantity of N." |
| Cannot issue unless current status is approved | "Only approved requests can be marked as issued." |

### Frontend validation (App.jsx)

- Item name non-empty, quantity > 0, reason non-empty checked before fetch.
- Date field has `required` HTML attribute; no additional format check.
- Issued-quantity checked client-side in `handleMarkIssued`.

### Gaps

- `requested_date` format is not validated backend-side; a string like `"not-a-date"` would be inserted and MySQL would store `0000-00-00` or throw a data truncation warning depending on SQL mode.
- No maximum length validation on `item_name`, `reason`, `storekeeper_note`.
- No sanitisation beyond `trim()` — XSS risk is low due to React JSX escaping on display, but no server-side HTML sanitisation is present.

---

## 8. Stage Drift / Early Implementation

| Item | Expected Stage | Found |
|---|---|---|
| Integration test script (`test.js`, 229 lines) covering 7 test cases | Stage 8 (testing) | Present in current commit |
| `npm test` script wired in package.json | Stage 8 | Present |
| `issued_quantity` and `issued_at` tracking | Potentially Stage 6 advanced | Present and working |
| `updated_at` column with ON UPDATE trigger | Maintainability stage | Present in DB schema |

The test script is functional and well-structured — this is beneficial for the upcoming stage but counts as drift from the stage boundary described in the brief.

No features beyond the case scope (e.g., email notifications, inventory catalog, PDF export) were added.

---

## 9. Issues Found Before Stage 8

### Critical — must fix before production use

| # | File | Issue |
|---|---|---|
| C1 | `backend/sessionStore.js` | In-memory `Map` session store — sessions lost on any server restart |
| C2 | `backend/server.js` line 35 | Plaintext password comparison — no hashing (bcrypt or similar needed) |
| C3 | `backend/server.js` lines 67–74 | `GET /api/users` is unauthenticated — exposes all usernames and roles to anyone |
| C4 | `backend/server.js` line 40 | `Math.random()` session token — not cryptographically secure |

### Important — fix before testing or security hardening

| # | File | Issue |
|---|---|---|
| I1 | `backend/schema.sql` | Stale — wrong DB name, missing `users` table, wrong column name (`storekeeper_notes` vs `storekeeper_note`), missing columns. Misleads anyone using it as the source of truth |
| I2 | `frontend/src/App.jsx` (lines 49, 85, 108, 160, 193, 230) | Base URL `http://localhost:5000` hardcoded six times — breaks in any non-local environment |
| I3 | `backend/server.js` line 8 | `app.use(cors())` with no origin restriction — allows requests from any origin |
| I4 | `frontend/index.html` line 7 | `<title>frontend</title>` — generic Vite scaffold title, no meta description |

### Minor — clean up in maintainability stage

| # | File | Issue |
|---|---|---|
| M1 | `frontend/src/App.jsx` | All 611 lines in a single file — no component separation |
| M2 | `backend/db-setup.js` line 35 | Passwords stored as plaintext — no note or migration path documented |
| M3 | `frontend/src/App.jsx` | Success and error messages never auto-dismiss — user must trigger a new action to clear them |
| M4 | `frontend/index.html` | No `<meta name="description">` tag |
| M5 | `backend/` | No ESLint or backend linter configured (frontend has oxlint) |
| M6 | `backend/test.js` | No test framework (Jest/Mocha/Vitest) — plain Node script, limited structured reporting |

---

## 10. Manual Checks Recommended Next

Before advancing to Stage 8:

1. Run `npm run db:reset` then `npm run db:setup` and confirm all three users and four sample requests appear in the database with correct column names.
2. Start backend (`npm run dev`) and frontend (`npm run dev`) simultaneously and confirm both start without errors.
3. Log in as Alice (staff) and confirm: submit form is visible, only Alice's own requests appear, approve/reject/issue controls are hidden, storekeeper note input is absent.
4. Log in as Charlie (storekeeper) and confirm: no submit form, all requests visible, action panel appears for non-self requests, self-request shows "Self-approval blocked" warning.
5. Approve a pending request as Charlie and confirm status badge updates and storekeeper note is saved and visible.
6. Mark an approved request as issued with a quantity and confirm `issued_quantity` and `issued_at` display correctly.
7. Test filter by item name — type a partial name and confirm the list updates.
8. Test filter by requester name — as storekeeper, filter by "Alice" and confirm only Alice's requests appear.
9. Test filter by status — select "pending" and confirm only pending items show.
10. Try approving as Alice via API directly (e.g., Postman PUT /api/requests/1/status with Alice's token) — confirm 403 response.
11. Call `GET /api/users` without a token and note the unauthenticated response (issue C3).
12. Restart the backend while logged in — confirm the session token no longer works (issue C1 confirmed).
13. Compare `schema.sql` with `db-setup.js` and confirm the discrepancies listed in Section 4 exist.

---

## 11. Pass/Fail Table

| Check | Result | Detail |
|---|---|---|
| App appears runnable | Pass | Backend `npm run dev` + frontend `npm run dev`; all dependencies in `node_modules` |
| React frontend and Express backend are separated | Pass | Independent directories, independent `package.json`, separate ports |
| React calls Express routes and never connects to MySQL directly | Pass | No `mysql2` in frontend `package.json`; all data via `fetch` to `localhost:5000` |
| Backend uses DB_HOST, DB_PORT, DB_USER, DB_PASSWORD, DB_NAME | Pass | `db.js` reads all five env vars with `process.env.*` |
| DB credentials not exposed in React | Pass | Frontend has no `.env` with DB vars; no DB package |
| Needed database tables exist (`users`, `requests`) | Pass | Both tables created in `db-setup.js` |
| Users/login table exists | Pass | `users` table with `username`, `password`, `role` |
| Repeatable database setup or seed command | Pass | `npm run db:setup` / `npm run db:reset` |
| Login is database-backed | Pass | `/api/login` queries `users` table |
| Role restrictions enforced in backend, not only UI | Pass | `authMiddleware` + role checks in route handlers |
| Approve/reject/issue/notes appears protected | Pass | Storekeeper role check + self-approval block at API layer |
| Users limited to own allowed records | Pass | Staff GET scoped by `requester_id = user.id` |
| Submission → approval/rejection → issue workflow implemented | Pass | Full lifecycle through PUT /api/requests/:id/status with transition guards |
| Filter by item name, requester, status implemented | Pass | All three filters applied server-side |
| Validation is present | Pass | Backend validates all required fields; frontend pre-validates before fetch |
| AI implemented future stages early | Partial | `test.js` integration test script committed before Stage 8 |
| `schema.sql` matches `db-setup.js` | Fail | Stale — wrong DB name, missing table, wrong column name, missing columns |
| Session tokens are secure | Fail | `Math.random()`, in-memory only, no expiry |
| Passwords hashed | Fail | Plaintext comparison — no bcrypt |
| `GET /api/users` protected | Fail | Unauthenticated endpoint exposes user list |
| App title/SEO set | Fail | `<title>frontend</title>` — generic Vite scaffold default |
