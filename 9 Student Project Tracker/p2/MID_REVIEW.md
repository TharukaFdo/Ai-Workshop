# Mid-Project Review — Student Project Tracker

**Review date:** 2026-06-15  
**Review stage:** After secondary-feature stage (filters). Before testing, security hardening, and maintainability cleanup.  
**Reviewer note:** Read-only review. No source files were modified.

---

## 1. Mid-Review Summary

The prototype is structurally sound and meaningfully functional. The React/Express/MySQL separation is clean, all five DB_* environment variables are wired correctly, and the backend enforces role checks directly from the database on every protected route. The main submission-and-review workflow is end-to-end implemented: students submit, supervisors review with feedback and status updates, and the `/review` endpoint blocks students from approving their own projects. Filtering by supervisor, category, and status is implemented in both the UI and the backend query.

The most significant pre-testing gaps are: passwords stored in plain text, the token scheme is an easily-forged `token_<userId>` string with no signature, `schema.sql` (the file documented in the README) is out of date with the actual table shape produced by `db-setup.js`, the `/api/projects/users` endpoint leaks the full user list without authentication, the CSS missing `badge-submitted` and `badge-underreview` classes means status badges for those two values render without colour, and the `feedback` column is named `feedback` in `db-setup.js` but the `PUT /api/projects/:id/review` SQL also uses `feedback` — however `schema.sql` defines it as `supervisor_feedback`, so there is a column-name mismatch that will break the review write if the database was set up from `schema.sql` instead of `db-setup.js`. No integration tests have been run yet (the test file exists and is well-written, but requires a live database). No `.gitignore` is present, so the `.env` file with credentials is unprotected.

---

## 2. Review Scoring Matrix

| Feature / Area | Functionality 0–5 | Data Persistence 0–5 | Backend Security / Role Control 0–5 | Validation / Error Handling 0–5 | Testing Evidence 0–5 | Maintainability 0–5 | UI / Manual Usability 0–5 | Evidence | Notes |
|---|---:|---:|---:|---:|---:|---:|---:|---|---|
| Project setup and run commands | 4 | — | — | — | — | 3 | — | `README.md`; `package.json` scripts (`dev`, `db:setup`, `test`) | README is clear; `schema.sql` and `db-setup.js` diverge (column name, missing `student_id`/`supervisor_id` FK columns in schema.sql); no `.gitignore` |
| Database setup and starter data | 4 | 5 | — | 3 | — | 3 | — | `db-setup.js` (creates DB, both tables, 4 users, 2 seed projects); `schema.sql` | `db-setup.js` is fully repeatable and idempotent; `schema.sql` is outdated vs actual table shape; seed projects labelled `TEST_RECORD:` |
| Login workflow | 4 | 4 | 2 | 4 | 3 | 2 | 4 | `auth.js` POST `/api/auth/login`; `App.jsx` `handleLogin` | DB-backed login; returns `token_<id>`; passwords plain-text; token has no signature — trivially forgeable; no logout-server-side invalidation |
| Role-based access | 4 | 4 | 4 | 3 | 3 | 3 | 4 | `projects.js` `authenticateUser` middleware; `req.user` sourced from DB | Token middleware re-fetches user from DB on every request — role cannot be spoofed via token payload; only missing: token forgery risk (see above) |
| Main create action | 5 | 5 | 4 | 4 | 4 | 4 | 4 | `POST /api/projects`; `App.jsx` `handleCreateProject` | Student-only guard in backend; all required fields validated; supervisor verified as a DB `supervisor` role user; student identity set from `req.user`, not client body |
| Main view/list action | 5 | 5 | 3 | 3 | 3 | 4 | 4 | `GET /api/projects`; `App.jsx` `fetchProjects` | Auth required; students auto-scoped to own submissions via `student_id` query param from frontend — **not enforced server-side**; supervisors see all |
| Main update/status/cancel action | 4 | 5 | 4 | 4 | 3 | 4 | 4 | `PUT /api/projects/:id`; `App.jsx` `handleUpdateProject` | Student-role guard + ownership check from DB; all fields required; supervisor lookup validated; no status guard (student can edit an already-approved submission) |
| Protected action | 5 | 5 | 5 | 4 | 4 | 4 | 4 | `PUT /api/projects/:id/review`; `App.jsx` `handleReviewProject` | Supervisor-role-only; assigned-supervisor-only (checked from DB `project.supervisor_id`); status whitelist validated; feedback optional |
| Secondary feature | 5 | 5 | 3 | 3 | 2 | 4 | 4 | `GET /api/projects` query params `status`, `category`, `supervisor_id`; `App.jsx` filter state | All three filters wired to backend; category filter uses free-text match (no DB ENUM), so a custom category value would silently return nothing; filter UI uses hardcoded category list |
| Case-specific: project title, category, supervisor, and status fields | 5 | 5 | 4 | 4 | 3 | 4 | 4 | `db-setup.js` schema; `projects.js` INSERT; `App.jsx` form fields | All four fields present in DB, API, and UI; status ENUM enforced in DB and API whitelist; category is VARCHAR (no DB constraint); supervisor stored as both ID and denormalised name |
| Case-specific: supervisor feedback workflow | 4 | 4 | 5 | 4 | 4 | 3 | 4 | `PUT /:id/review`; `App.jsx` review modal | Feedback textarea, optional; stored in `feedback` column per `db-setup.js`; **column name mismatch**: `schema.sql` uses `supervisor_feedback` — breaks if DB was initialised from `schema.sql`; feedback displayed with accent border in UI |
| Case-specific: student ownership and supervisor-only approval | 5 | 5 | 5 | 4 | 4 | 4 | 5 | `PUT /:id` student_id check; `PUT /:id/review` supervisor_id check | Both ownership checks query DB, not token payload; student blocked from calling `/review`; supervisor blocked from calling student edit route; UI also hides buttons correctly |
| UI / manual usability | 4 | — | — | — | — | 3 | 4 | `App.jsx`; `index.css` | Dark theme, gradient heading, card hover effects, status badges, modal forms; two badge classes (`badge-submitted`, `badge-underreview`) missing from CSS — those statuses render without colour styling |
| Security posture | 2 | — | 2 | — | — | 2 | — | `auth.js`; `db.js`; `projects.js`; `.env` | Plain-text passwords; forgeable token; open CORS (`*`); no rate limiting; `/api/projects/users` unauthenticated; `.env` committed (no `.gitignore`); no helmet/sanitisation |
| Testing evidence | 3 | — | — | — | 3 | 3 | — | `projects.test.js`; `package.json` `test` script | Well-structured integration test file with `beforeAll`/`afterAll`, covers auth, role guard, ownership, review; depends on live seeded DB; no mocks; not yet run |
| Maintainability | 3 | — | — | — | — | 3 | — | All source files | Single-file frontend (636 lines, no component split); no JSDoc/comments in routes beyond inline notes; `db.js` exports both `pool` and `query` helper; `schema.sql` out of sync; no `.gitignore` |

---

## 3. Current Feature Status

| Feature | Implemented | Notes |
|---|---|---|
| Student submits project (title, description, category, supervisor, date) | ✅ Yes | Full backend route + UI modal |
| Supervisor reviews project (status + feedback) | ✅ Yes | Full backend route + UI modal |
| View project list | ✅ Yes | Auth-gated GET with filters |
| Student edits own submission | ✅ Yes | PUT route with ownership check |
| Filter by supervisor | ✅ Yes | Backend + UI select populated from DB |
| Filter by category | ✅ Yes | Backend + UI select (4 hardcoded values) |
| Filter by status | ✅ Yes | Backend + UI select |
| Student-scoped list (student sees only own) | ⚠️ Partial | Frontend sends `student_id` param; backend honours it but does **not** enforce it — a student who omits the param sees all projects |
| Supervisor-scoped review (assigned supervisor only) | ✅ Yes | `supervisor_id` match enforced server-side |

---

## 4. Database and Persistence Status

**Tables created by `db-setup.js`:**

| Table | Exists in setup script | Exists in schema.sql | Notes |
|---|---|---|---|
| `users` | ✅ | ❌ Missing | Login table fully defined in `db-setup.js`; absent from `schema.sql` |
| `projects` | ✅ | ✅ (partial) | `db-setup.js` version includes `student_id`, `supervisor_id` FK columns and correct `feedback` column name; `schema.sql` uses `supervisor_feedback`, lacks FK columns |

**Critical mismatch:** If a developer follows the README and runs `mysql -u root -p < schema.sql`, they get a `projects` table without `student_id`, `supervisor_id`, or the `feedback` column name used by the API. Every authenticated write and the review route will fail. The authoritative setup path is `npm run db:setup`.

**Seed data:** `db-setup.js` seeds 4 users (2 students, 2 supervisors) and 2 projects labelled `TEST_RECORD:`. Seed is idempotent (skips if rows exist). Plain-text passwords (`password123`) are noted in a comment as a workshop shortcut.

**.env DB variables:**

| Variable | Present | Value |
|---|---|---|
| `DB_HOST` | ✅ | `localhost` |
| `DB_PORT` | ✅ | `3306` |
| `DB_USER` | ✅ | `root` |
| `DB_PASSWORD` | ✅ | *(empty — likely local root with no password)* |
| `DB_NAME` | ✅ | `c9p2` |

All five variables are consumed in `db.js`. None appear in the React frontend.

---

## 5. Login and Role/Access Status

**Login type:** Database-backed. `POST /api/auth/login` queries the `users` table for a matching `username + password` row.

**Token scheme:** `token_<userId>` (e.g. `token_3`). Simple string — no HMAC, no JWT signature. Trivially forgeable by incrementing the number.

**Session persistence:** Token and user object stored in `localStorage`. No server-side session store; no server-side logout.

**Role enforcement location:**

| Check | Location | Method |
|---|---|---|
| Role (student/supervisor) | Backend `authenticateUser` + per-route guard | Re-queries `users` table using token's extracted `userId` — cannot be spoofed via token payload |
| Ownership (student's own project) | Backend `PUT /:id` | Compares `project.student_id` with `req.user.id` from DB |
| Assigned supervisor | Backend `PUT /:id/review` | Compares `project.supervisor_id` with `req.user.id` from DB |
| UI button visibility | Frontend `App.jsx` | Secondary guard; does not replace backend checks |

**Login UI:** Username + password form. Credentials cheat-sheet displayed below the form (workshop aid, acceptable at this stage).

**Missing:** No password hashing (bcrypt), no token signature, no refresh mechanism, no rate limiting on login endpoint.

---

## 6. Protected Action Status

**Protected action: Add/edit supervisor feedback and approve/reject projects (`PUT /api/projects/:id/review`)**

| Guard | Implemented | Mechanism |
|---|---|---|
| Must be authenticated | ✅ | `authenticateUser` middleware — returns 401 if token missing or user not found in DB |
| Must be a supervisor | ✅ | `req.user.role !== 'supervisor'` check — returns 403 |
| Must be the assigned supervisor | ✅ | `project.supervisor_id !== req.user.id` check from DB — returns 403 |
| Status value must be valid | ✅ | Whitelist: `['submitted', 'underReview', 'approved', 'rejected']` |
| Student cannot call this route | ✅ | Role check blocks students |

**UI guard:** Review modal button only rendered for `currentUser.role === 'supervisor' && currentUser.id === project.supervisor_id`. Backend is the authoritative guard.

**Gap:** No protection against a supervisor setting `status` back to `submitted` after `approved` (no state-machine lock). This is an acceptable gap at this stage.

---

## 7. Validation Status

| Validation | Location | Notes |
|---|---|---|
| Login: username and password required | Backend `auth.js` | Returns 400 |
| Project create: all five fields required | Backend `projects.js` POST | Returns 400 |
| Project create: supervisor_id must be a valid supervisor in DB | Backend | Returns 400 |
| Project update: all five fields required | Backend `projects.js` PUT | Returns 400 |
| Project update: supervisor_id validated | Backend | Returns 400 |
| Review: status required and whitelisted | Backend `projects.js` PUT review | Returns 400 |
| Review: feedback optional | Backend | `feedback || null` |
| HTML5 `required` on all form fields | Frontend | Present on title, description, category, supervisor, date |
| Category is a free-text VARCHAR | Database | No DB-level ENUM constraint — inconsistent categories would persist |
| Integer parsing for IDs | Backend | `parseInt(..., 10)` used for `supervisor_id`, `student_id`, `userId` |
| No input sanitisation | Backend | No XSS/SQL-injection protection beyond parameterised queries |

Parameterised queries are used throughout, which prevents SQL injection at the query level. No additional sanitisation library is present.

---

## 8. Stage Drift / Early Implementation

| Item | Expected Stage | Found in This Review | Assessment |
|---|---|---|---|
| Integration test file (`projects.test.js`) | Testing stage | Present and structured | **Early** — test file written ahead of the testing stage; covers auth, role, ownership, and review scenarios; depends on live DB |
| `jest` and `supertest` in `devDependencies` | Testing stage | Present in `package.json` | **Early** — test dependencies installed before testing stage |
| `npm run test` script | Testing stage | Present in `package.json` | **Early** |
| `NODE_ENV !== 'test'` guard in `index.js` | Testing stage | Present | **Early** — test-mode awareness implemented before the testing stage |
| `afterAll` cleanup (`DELETE ... LIKE 'INTEGRATION_TEST:%'`) | Testing stage | Present | **Early** — well-formed cleanup pattern |

No business logic from security hardening or maintainability stages was detected (no bcrypt, no helmet, no JWT, no component splitting). The early test scaffold is well-structured and will be useful when the testing stage begins.

---

## 9. Issues Found Before Stage 8

### Critical (blocks correct operation in some setups)

1. **`schema.sql` out of sync with `db-setup.js`**  
   `schema.sql` references column `supervisor_feedback` and omits `student_id`, `supervisor_id` FK columns. The API writes to `feedback`. Running the README-documented setup command will produce a broken database. Developers must use `npm run db:setup` instead.

2. **Student-scoped list not enforced server-side**  
   `GET /api/projects` honours a `student_id` query param, but the backend does not force it for student-role users. A student with a crafted or absent query string can retrieve other students' submissions. Only the frontend adds this param.

### Major (significant security or correctness gaps)

3. **Plain-text password storage**  
   Passwords stored and compared as plain strings. A database leak exposes all credentials directly.

4. **Forgeable session token**  
   `token_<userId>` contains no signature. Any authenticated user can impersonate another user by incrementing the ID. The DB lookup on each request limits impact (the looked-up role is authoritative), but identity can still be impersonated.

5. **`/api/projects/users` is unauthenticated**  
   Returns `id`, `username`, `role`, `full_name` for all users with no token required. This is a user enumeration vector.

6. **`.env` file committed (no `.gitignore`)**  
   The `.env` file containing DB credentials is present in the project directory with no `.gitignore` to exclude it from version control.

### Minor (polish and correctness)

7. **CSS missing `badge-submitted` and `badge-underreview` classes**  
   `index.css` defines `badge-approved` and `badge-rejected` but not `badge-submitted` or `badge-underreview`. Projects with those statuses render the badge element without colour, making status visually ambiguous.

8. **Open CORS (`app.use(cors())`)**  
   CORS is configured with no origin restriction — any domain can call the API.

9. **No status-transition guard on student edits**  
   A student can edit the details of a project that has already been approved or rejected. The edit route has no check on current status before allowing changes.

10. **`db.env.example` is identical to `.env`**  
    `.env.example` contains the same DB name (`c9p2`) as the live `.env` rather than a placeholder. It provides no onboarding benefit.

11. **No `vite.config.js` proxy**  
    The frontend hard-codes `http://localhost:5000` for the API base. A Vite dev proxy would decouple the port from the source file.

---

## 10. Manual Checks Recommended Next

| Check | How to Verify |
|---|---|
| Run `npm run db:setup` against a clean MySQL instance and confirm both tables and all 4 seed users are created | `mysql -u root -e "SHOW TABLES; SELECT * FROM users;" c9p2` |
| Start backend (`npm run dev`) and confirm health check responds | `GET http://localhost:5000/api/health` |
| Start frontend (`npm run dev`) and login as `student_alice` / `password123` | Manual browser test |
| Confirm student sees only own projects in the list | Login as `student_alice`; verify only Alice's submissions appear |
| Confirm student cannot access review modal or call `/review` directly | Login as student; attempt `PUT /api/projects/1/review` with student token |
| Confirm supervisor can submit feedback and change status | Login as `supervisor_carol`; open review modal for Alice's project |
| Confirm wrong supervisor is blocked from reviewing | Login as `supervisor_dave`; attempt to review Carol's assigned project |
| Test filters: select each supervisor, category, status | Manual browser test |
| Confirm badge colours for `submitted` and `underReview` statuses | Visual check — badges will likely be unstyled |
| Confirm `schema.sql` mismatch by running it and then starting backend | Backend will fail on review write with "Unknown column 'feedback'" |

---

## 11. Pass / Fail Table

| Check | Result | Detail |
|---|---|---|
| App appears runnable | ✅ Pass | README setup path works via `npm run db:setup` + `npm run dev` in both dirs |
| React and Express are separated | ✅ Pass | `frontend/` (Vite/React) and `backend/` (Express/Node) are distinct projects |
| React calls Express routes only; no direct MySQL from frontend | ✅ Pass | All DB access via `fetch(http://localhost:5000/api/...)` |
| Backend uses all five DB_* env variables | ✅ Pass | `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME` all present in `db.js` and `.env` |
| No DB credentials exposed in React | ✅ Pass | Frontend contains no DB config |
| Needed database tables exist | ✅ Pass (via `db-setup.js`) | `users` and `projects` tables created with correct shape |
| A users/login table exists | ✅ Pass | `users` table with `username`, `password`, `role`, `full_name` |
| Repeatable database setup or seed command | ✅ Pass | `npm run db:setup` is idempotent |
| Login is database-backed | ✅ Pass | Queries `users` table; returns DB-sourced role |
| Role restrictions enforced in backend | ✅ Pass | `authenticateUser` + per-route role checks query DB |
| Protected action (feedback/approve/reject) protected in backend | ✅ Pass | Role + assigned-supervisor checks enforced server-side |
| Users limited to their own allowed records | ⚠️ Partial | Student ownership on edit is enforced; student list scoping on GET is frontend-only |
| Main workflow implemented (submit → review → feedback → status) | ✅ Pass | Full cycle present across routes and UI |
| Secondary feature (filter by supervisor/category/status) implemented | ✅ Pass | All three filters wired to backend and UI |
| Validation present | ✅ Pass | Required-field checks, supervisor validation, status whitelist; no sanitisation library |
| AI implemented future stages early | ⚠️ Yes | Test file, test deps, and NODE_ENV guard present before testing stage |
| `schema.sql` matches actual DB setup | ❌ Fail | Column name mismatch (`supervisor_feedback` vs `feedback`); missing FK columns |
| Passwords hashed | ❌ Fail | Plain-text storage and comparison |
| Token is tamper-proof | ❌ Fail | `token_<id>` string has no signature |
| `.gitignore` present | ❌ Fail | `.env` file unprotected from version control |
| All status badge CSS classes defined | ❌ Fail | `badge-submitted` and `badge-underreview` missing |
