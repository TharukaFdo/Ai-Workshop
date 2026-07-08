# Final Review — Student Project Tracker

**Review date:** 2026-06-15  
**Review stage:** Final — after testing, security hardening, maintainability cleanup, and the Stage 11 change request.  
**Reviewer note:** Read-only review. No source files were modified. All findings are based on direct file inspection and a live automated test run against the seeded MySQL database.

---

## 1. Final Feature Summary

The Student Project Tracker is a complete React/Express/MySQL prototype that implements the full submission-review-feedback-status lifecycle described in the Case Brief.

| Feature | Status | Evidence file(s) |
|---|---|---|
| Student submits project (title, description, category, supervisor, date) | ✅ Complete | `projects.js` POST `/api/projects`; `Modals.jsx` SubmitProjectModal |
| Supervisor reviews project (status + feedback) | ✅ Complete | `projects.js` PUT `/api/projects/:id/review`; `Modals.jsx` ReviewProjectModal |
| Student edits own submission (resubmission after revision request) | ✅ Complete | `projects.js` PUT `/api/projects/:id`; `ProjectCard.jsx` edit button |
| View project list | ✅ Complete | `projects.js` GET `/api/projects`; `App.jsx` |
| Filter by supervisor, category, status | ✅ Complete | `FiltersPanel.jsx`; `projects.js` query params |
| Student-scoped list (student sees only own) | ✅ Complete | `projects.js` L61–63 — enforced server-side for all student-role requests |
| Supervisor-scoped review (assigned supervisor only) | ✅ Complete | `projects.js` L195–197 — `project.supervisor_id` DB check |
| Project fields: title, category, supervisor, status | ✅ Complete | `db-setup.js` schema; `projects.js` INSERT; all form components |
| Supervisor feedback workflow | ✅ Complete | `PUT /:id/review`; feedback stored in `feedback` column; displayed in `ProjectCard.jsx` |
| Student ownership guard | ✅ Complete | `PUT /:id` checks `project.student_id === req.user.id` from DB |
| Supervisor-only approval/rejection/status change | ✅ Complete | `PUT /:id/review` role + assigned-supervisor double check |
| Status-transition lock on student edit | ✅ Complete | `projects.js` L146–148 — only `revisionRequested` status allows student edits |
| Password hashing | ✅ Complete | `auth.js` uses `bcryptjs.compareSync`; `db-setup.js` hashes with `bcrypt.hashSync(password, 10)` |
| HMAC-signed session token | ✅ Complete | `auth.js` (routes) generates `<userId>.<hmacSha256>`; `middleware/auth.js` verifies signature |
| CORS restricted to known origin | ✅ Complete | `index.js` `cors({ origin: 'http://localhost:5173' })` |
| `.gitignore` protecting `.env` | ✅ Complete | `.gitignore` lists `.env`, `.env.local`, etc. |
| All status badge CSS classes | ✅ Complete | `index.css` defines `badge-submitted`, `badge-underreview`, `badge-approved`, `badge-rejected`, `badge-revisionrequested` |
| Frontend split into components | ✅ Complete | `LoginScreen.jsx`, `FiltersPanel.jsx`, `ProjectCard.jsx`, `Modals.jsx` |
| `schema.sql` matches `db-setup.js` | ✅ Complete | Both use `feedback` column, `student_id`, `supervisor_id` FK columns, `revisionRequested` ENUM value |
| Automated integration tests (all pass) | ✅ Complete | 15/15 tests pass — `npm run test` in `backend/` |
| `db:reset` script | ✅ Complete | `db-reset.js` drops DB and calls `db-setup.js` |
| `JWT_SECRET` in `.env` and consumed in code | ✅ Complete | Present in `.env`; used by `middleware/auth.js` and `routes/auth.js` |

---

## 2. Review Scoring Matrix

| Feature / Area | Functionality 0-5 | Data Persistence 0-5 | Backend Security / Role Control 0-5 | Validation / Error Handling 0-5 | Testing Evidence 0-5 | Maintainability 0-5 | UI / Manual Usability 0-5 | Evidence | Notes |
|---|---:|---:|---:|---:|---:|---:|---:|---|---|
| Project setup and run commands | 5 | — | — | — | — | 5 | — | `README.md`; `package.json` scripts (`dev`, `db:setup`, `db:reset`, `test`) | README matches code; `.gitignore` present and covers `.env`; `.env.example` has placeholder `JWT_SECRET`; `schema.sql` now matches `db-setup.js` |
| Database setup and starter data | 5 | 5 | — | 4 | 5 | 5 | — | `db-setup.js`; `db-reset.js`; `schema.sql` | Idempotent setup + full reset script; passwords hashed with bcrypt (saltRounds=10); seed labelled `TEST_RECORD:`; `schema.sql` now in sync |
| Login workflow | 5 | 4 | 5 | 4 | 5 | 4 | 5 | `routes/auth.js`; `middleware/auth.js`; `LoginScreen.jsx` | DB-backed; bcrypt compare; HMAC-SHA256 signed token (`<id>.<sig>`); signature verified on every request; no server-side session store (acceptable for prototype) |
| Role-based access | 5 | 5 | 5 | 4 | 5 | 5 | 5 | `middleware/auth.js`; `projects.js`; test suite spoofing group | Middleware re-fetches role from DB; 4 spoofing-prevention tests pass (header, body, query, ownership); role cannot be elevated via any client-supplied input |
| Main create action | 5 | 5 | 5 | 5 | 5 | 5 | 5 | `POST /api/projects`; test `201` case | Student-only guard; all fields required; supervisor validated against DB; student identity sourced from `req.user` not body |
| Main view/list action | 5 | 5 | 5 | 4 | 4 | 5 | 5 | `GET /api/projects`; `App.jsx`; `projects.js` L61–63 | Student boundary now enforced server-side for student-role users; supervisors see all; filters wired to backend |
| Main update/status/cancel action | 5 | 5 | 5 | 5 | 5 | 5 | 5 | `PUT /api/projects/:id`; test update group | Student-role guard + ownership DB check + status-transition lock (`revisionRequested` only); resubmission resets status to `submitted` |
| Protected action | 5 | 5 | 5 | 5 | 5 | 5 | 5 | `PUT /api/projects/:id/review`; test review + spoofing groups | Supervisor-role guard; assigned-supervisor DB check; `revisionRequested` added to whitelist; feedback optional; all 6 related tests pass |
| Secondary feature | 5 | 5 | 4 | 4 | 3 | 5 | 5 | `GET /api/projects` query params; `FiltersPanel.jsx` | All three filters wired to backend; category remains a VARCHAR (no DB ENUM) so a direct API call with a custom category value would persist; no dedicated filter tests |
| Case-specific: project title, category, supervisor, and status fields | 5 | 5 | 5 | 5 | 5 | 5 | 5 | `db-setup.js` schema; `projects.js` INSERT; form components; `schema.sql` | All four fields in DB, API, UI; status ENUM in DB and API whitelist; category from controlled dropdown; supervisor stored as ID + denormalised name; schema matches |
| Case-specific: supervisor feedback workflow | 5 | 5 | 5 | 5 | 5 | 5 | 5 | `PUT /:id/review`; `ReviewProjectModal`; `ProjectCard.jsx`; test `allow assigned supervisor` | Feedback optional; stored in `feedback` column; `schema.sql` now uses `feedback` (was `supervisor_feedback` at mid-review); feedback displayed with accent border; test verifies DB persistence |
| Case-specific: student ownership and supervisor-only approval | 5 | 5 | 5 | 5 | 5 | 5 | 5 | `PUT /:id` student_id check; `PUT /:id/review` supervisor_id check; spoofing test group | Both checks query DB; student blocked from `/review` (role guard); supervisor blocked from student-edit route (role guard); UI button visibility matches backend logic |
| UI / manual usability | 5 | — | — | — | — | 5 | 5 | `App.jsx`; `index.css`; component files | Dark theme; gradient heading; card hover; all 6 badge classes defined; status-transition UX (edit button only shows for `revisionRequested`); modals; responsive grid layout |
| Security posture | 5 | — | 5 | — | 5 | 5 | — | `index.js`; `auth.js`; `middleware/auth.js`; `.gitignore`; `.env` | bcrypt passwords; HMAC token; CORS restricted to `localhost:5173`; `/api/projects/users` requires auth; `.gitignore` covers `.env`; parameterised queries throughout |
| Testing evidence | — | — | — | — | 5 | 5 | — | `projects.test.js`; `npm run test` output | 15/15 tests pass; covers auth, role guards, ownership, status locks, spoofing prevention; `INTEGRATION_TEST:` prefix used for isolation; `afterAll` cleans up test rows; `pool.end()` releases connections |
| Maintainability | — | — | — | — | — | 5 | — | All source files | Frontend split into 4 components; JSDoc comments on all backend routes and middleware; `db.js` exports clean `query` helper; `schema.sql` in sync; `.gitignore` present; `db:reset` script enables clean re-runs |

---

## 3. Project Structure and Run Commands

```
p2/
├── .gitignore                  ← covers .env, node_modules, dist
├── Case_Brief.md
├── MID_REVIEW.md
├── README.md                   ← setup instructions (accurate)
├── schema.sql                  ← reference DDL (now matches db-setup.js)
├── backend/
│   ├── .env                    ← not tracked (covered by .gitignore)
│   ├── .env.example            ← template with placeholder JWT_SECRET
│   ├── package.json
│   └── src/
│       ├── db.js               ← mysql2/promise pool; query helper
│       ├── index.js            ← Express app; CORS; routes; health check
│       ├── middleware/
│       │   └── auth.js         ← HMAC token verification + DB user lookup
│       ├── routes/
│       │   ├── auth.js         ← POST /api/auth/login (bcrypt compare)
│       │   └── projects.js     ← GET/POST/PUT routes; student scoping
│       ├── scripts/
│       │   ├── db-setup.js     ← creates DB, tables, seeds 4 users + 2 projects
│       │   └── db-reset.js     ← drops DB then calls db-setup.js
│       └── tests/
│           └── projects.test.js ← 15 Jest/supertest integration tests
└── frontend/
    ├── index.html
    ├── package.json
    └── src/
        ├── App.jsx             ← state management; fetch calls; modal orchestration
        ├── index.css           ← dark theme; all badge classes; card hover
        ├── main.jsx
        └── components/
            ├── FiltersPanel.jsx    ← status/category/supervisor selects
            ├── LoginScreen.jsx     ← login form + demo credentials helper
            ├── Modals.jsx          ← Submit, Edit, Review modal forms
            └── ProjectCard.jsx     ← per-project card with action buttons
```

### Run Commands

```bash
# Terminal 1 — Database setup (one-time or after reset)
cd backend
npm install
npm run db:setup          # creates c9p2 DB, tables, 4 users, 2 seed projects
# Optional reset to clean state:
npm run db:reset

# Terminal 2 — Backend
cd backend
npm run dev               # nodemon → http://localhost:5000

# Terminal 3 — Frontend
cd frontend
npm install
npm run dev               # Vite → http://localhost:5173

# Automated tests (backend/ terminal)
npm run test              # Jest --runInBand --forceExit → 15/15 PASS
```

---

## 4. Frontend/Backend Separation Check

| Check | Result | Detail |
|---|---|---|
| React and Express are in separate directories | ✅ Pass | `frontend/` (Vite/React 18) and `backend/` (Express/Node) are completely separate npm projects with their own `package.json`, `node_modules`, and `src/` trees |
| React calls Express routes; never connects to MySQL | ✅ Pass | All DB access is via `fetch('http://localhost:5000/api/...')` in `App.jsx`; no `mysql2` or DB config anywhere in `frontend/` |
| No DB credentials in frontend source | ✅ Pass | `frontend/src/` contains zero references to DB_* variables, MySQL, or connection strings |
| API base URL is a constant in App.jsx | ✅ Note | `const API_BASE = 'http://localhost:5000/api/projects'` (L7); no Vite proxy configured — port is hard-coded, which is an acceptable workshop constraint |

---

## 5. Database Setup and Table Summary

### Environment Variables

All five DB_* variables are configured in `backend/.env` and consumed in `backend/src/db.js`:

| Variable | Present | Value |
|---|---|---|
| `DB_HOST` | ✅ | `localhost` |
| `DB_PORT` | ✅ | `3306` |
| `DB_USER` | ✅ | `root` |
| `DB_PASSWORD` | ✅ | *(empty — local root with no password; not printed)* |
| `DB_NAME` | ✅ | `c9p2` |
| `JWT_SECRET` | ✅ | Present in `.env`; not a DB variable but required for HMAC signing — not printed |

### Tables

| Table | Created by | Present in schema.sql | Notes |
|---|---|---|---|
| `users` | `db-setup.js` | ✅ Yes | `id`, `username`, `password` (VARCHAR 255), `role` (ENUM student/supervisor), `full_name`, `created_at` |
| `projects` | `db-setup.js` | ✅ Yes | `id`, `title`, `description`, `category`, `student_name`, `student_id` (FK → users), `supervisor_name`, `supervisor_id` (FK → users), `submitted_date`, `status` (ENUM — 5 values including `revisionRequested`), `feedback` (TEXT NULL), `created_at`, `updated_at` |

**`schema.sql` synchronisation:** At mid-review, `schema.sql` used `supervisor_feedback` and lacked FK columns. In the final version, `schema.sql` matches `db-setup.js` exactly — both use `feedback`, both declare `student_id`/`supervisor_id` FKs, and both include `revisionRequested` in the ENUM.

### Repeatable Setup

- `npm run db:setup` — idempotent: creates DB if not exists; creates tables if not exist; seeds users and projects only if tables are empty.
- `npm run db:reset` — drops the `c9p2` database and immediately calls `db-setup.js` to recreate and reseed from scratch.

### Seed Data

4 users seeded with bcrypt-hashed `password123`:

| Username | Role | Full name |
|---|---|---|
| `student_alice` | student | Alice Smith |
| `student_bob` | student | Bob Jones |
| `supervisor_carol` | supervisor | Carol Johnson |
| `supervisor_dave` | supervisor | Dave Wilson |

2 seed projects (`TEST_RECORD:` prefix, skipped if rows exist):
- Alice → Carol (status: `submitted`)
- Bob → Dave (status: `underReview`, with feedback)

---

## 6. Login and Role/Access Explanation

### Login Flow

1. User submits username + password to `POST /api/auth/login`.
2. Backend queries `users` WHERE `username = ?` — parameterised.
3. `bcrypt.compareSync(plainPassword, user.password)` — hashed compare.
4. On success: generates `<userId>.<HMAC-SHA256(userId, JWT_SECRET)>` token and returns it with the user object (no password field).
5. Frontend stores token + user in `localStorage`; sends `Authorization: Bearer <token>` on every subsequent request.

### Token Verification (every protected request)

1. `middleware/auth.js` extracts `<userId>.<signature>` from the `Authorization` header.
2. Re-computes expected signature using `JWT_SECRET` and compares — returns 401 if mismatch.
3. Queries `SELECT id, username, role, full_name FROM users WHERE id = ?` — returns 401 if user not found.
4. Attaches DB-sourced `req.user` to the request. Role cannot be spoofed via token payload or request body.

### Role Checks

| Check | Location | Mechanism |
|---|---|---|
| Student role (create) | `POST /api/projects` L86 | `req.user.role !== 'student'` → 403 |
| Student role (update) | `PUT /api/projects/:id` L128 | `req.user.role !== 'student'` → 403 |
| Supervisor role (review) | `PUT /api/projects/:id/review` L181 | `req.user.role !== 'supervisor'` → 403 |
| Student boundary (list) | `GET /api/projects` L61–63 | If `req.user.role === 'student'`, SQL appended `AND student_id = req.user.id` — students cannot see other students' projects regardless of query params |
| Ownership (student edit) | `PUT /api/projects/:id` L141 | `project.student_id !== req.user.id` → 403 |
| Assigned supervisor | `PUT /api/projects/:id/review` L195 | `project.supervisor_id !== req.user.id` → 403 |
| UI button visibility | `ProjectCard.jsx` L52, L57 | Edit button: `role=student && id===student_id && status==='revisionRequested'`; Review button: `role=supervisor && id===supervisor_id` |

---

## 7. Protected Action Explanation

**Protected action: Supervisor feedback + status update — `PUT /api/projects/:id/review`**

This is the core protected action required by the Case Brief ("students must not be able to edit supervisor feedback or approve their own projects").

| Guard layer | Implemented | Code location | Test coverage |
|---|---|---|---|
| Must provide valid HMAC-signed token | ✅ | `middleware/auth.js` — 401 on missing/invalid token | Test: 401 unauthenticated case |
| Must be supervisor role | ✅ | `projects.js` L181 — 403 if not supervisor | Test: `403 if student tries to update` |
| Must be the assigned supervisor | ✅ | `projects.js` L195 — compares `project.supervisor_id` (from DB) with `req.user.id` (from DB) | Test: `403 if different supervisor` |
| Status must be from whitelist | ✅ | `projects.js` L185 — `['submitted','underReview','approved','rejected','revisionRequested']` | Backend whitelist; UI dropdown constrained |
| Student header/body/query spoofing blocked | ✅ | Role sourced exclusively from DB; no request input accepted | Tests: 3 spoofing prevention cases all pass |
| Feedback is optional | ✅ | `projects.js` L201 — `feedback || null` | Test: approved with feedback verified in DB |

---

## 8. Validation Summary

| Validation | Location | HTTP code | Notes |
|---|---|---|---|
| Login: username + password required | `routes/auth.js` L12 | 400 | Also `required` in HTML form |
| Login: credentials must match DB | `routes/auth.js` L23 | 401 | bcrypt compare |
| Project create: all 5 fields required | `projects.js` L90 | 400 | title, description, category, supervisor_id, submitted_date |
| Project create: supervisor must exist and have supervisor role | `projects.js` L94–101 | 400 | Parameterised query against `users` table |
| Project update: all 5 fields required | `projects.js` L132 | 400 | Same field set |
| Project update: project must exist | `projects.js` L136–139 | 404 | DB lookup before ownership check |
| Project update: status lock | `projects.js` L146–148 | 400 | Only `revisionRequested` status allows student edits |
| Review: status required + whitelisted | `projects.js` L186 | 400 | 5-value whitelist including `revisionRequested` |
| Review: feedback optional | `projects.js` L201 | — | Stored as NULL if omitted |
| Integer parsing on IDs | `projects.js` throughout | — | `parseInt(..., 10)` on supervisor_id, student_id, userId |
| HTML5 `required` on all form fields | All modal form inputs | — | Client-side first-pass validation |
| Parameterised queries | All DB calls in `routes/` and `middleware/` | — | Prevents SQL injection at query level |
| No external sanitisation library | Backend | — | XSS prevention relies on React's auto-escaping in the UI; no server-side sanitiser |
| Category is a controlled dropdown | `Modals.jsx`; `FiltersPanel.jsx` | — | 4 fixed values in UI; no DB ENUM constraint — a crafted API call with a custom category value would persist |

---

## 9. Automated and Manual Testing Summary

### Automated Tests

**Command:** `cd backend && npm run test`  
**Framework:** Jest + supertest (`--runInBand --forceExit`)  
**Requirements:** Live MySQL instance with `npm run db:setup` already executed.

**Result: 15/15 tests PASS (5.305 s)**

```
PASS src/tests/projects.test.js (5.305 s)
  Student Project Tracker API Tests with DB Auth
    POST /api/projects - Submission Creation
      ✓ should fail with 401 if user is not authenticated (8 ms)
      ✓ should fail with 403 if a supervisor tries to submit a project (5 ms)
      ✓ should fail with 400 if required fields are missing (5 ms)
      ✓ should succeed with 201 when student submits valid project details (12 ms)
    PUT /api/projects/:id - Project Updates
      ✓ should fail with 400 if student tries to edit their own submission details when status is submitted (8 ms)
      ✓ should fail with 403 if a different student tries to edit the project details (7 ms)
      ✓ should fail with 400 if student tries to edit an already approved project (12 ms)
      ✓ should allow student owner to update their own submission details when status is revisionRequested, transitioning status back to submitted (15 ms)
    PUT /api/projects/:id/review - Supervisor Feedback & Status Update
      ✓ should fail with 403 if student tries to update feedback or status (5 ms)
      ✓ should fail with 403 if a supervisor other than the assigned one tries to submit review (5 ms)
      ✓ should allow the assigned supervisor to update status and add feedback (11 ms)
    Spoofing Prevention Checks
      ✓ should reject review submission if student attempts header spoofing (6 ms)
      ✓ should reject review submission if student attempts body spoofing (5 ms)
      ✓ should reject review submission if student attempts query parameter spoofing (6 ms)
      ✓ should reject project modification if student attempts to hijack ownership in body/query (5 ms)

Test Suites: 1 passed, 1 total
Tests:       15 passed, 15 total
Time:        5.667 s
```

### What the Tests Cover

- **Authentication:** 401 on missing token.
- **Role guards:** 403 when supervisor submits, 403 when student reviews.
- **Field validation:** 400 on missing required fields.
- **Ownership:** 403 when Bob attempts to edit Alice's project.
- **Status lock:** 400 on edit attempt when status is `submitted`; 400 on edit when status is `approved`.
- **Resubmission:** 200 on edit when status is `revisionRequested`; DB verified (`status` → `submitted`, title updated).
- **Review write:** 200 for assigned supervisor; DB verified (`status` = `approved`, `feedback` = expected string).
- **Spoofing prevention:** Header, body, and query-string role injection all blocked (4 tests).

### Test Data Isolation

- Test rows use the prefix `INTEGRATION_TEST:` in the title.
- `afterAll` runs `DELETE FROM projects WHERE title LIKE 'INTEGRATION_TEST:%'` to clean up.
- `pool.end()` is called in `afterAll` to release all DB connections.
- Seed data (`TEST_RECORD:` prefix) is not touched or deleted by the test suite.

### What Is Not Automated

- Filter behaviour (status, category, supervisor) — no dedicated integration test. Manual verification required.
- UI rendering and badge colour correctness — no frontend test runner configured. Manual browser check required.
- `db:setup` idempotency and `db:reset` behaviour — not tested by Jest. Manual verification via MySQL client.

---

## 10. Stage 11 Change Summary

The following changes were made after the mid-review (Stage 11 security hardening, testing, maintainability, and the change request):

### Security Hardening

| What changed | Mid-review state | Final state |
|---|---|---|
| Password storage | Plain-text in DB; plain-text compare in login | `bcryptjs` hashes at seed time (`saltRounds=10`); `bcrypt.compareSync` in login |
| Session token | `token_<userId>` — no signature, trivially forgeable | `<userId>.<HMAC-SHA256(userId, JWT_SECRET)>` — signature verified on every request |
| `JWT_SECRET` | Not present | Added to `.env`, `.env.example`; consumed in `routes/auth.js` and `middleware/auth.js` |
| CORS | `app.use(cors())` — open wildcard | `cors({ origin: 'http://localhost:5173', credentials: true })` |
| `/api/projects/users` unauthenticated | No auth required | Requires `Authorization` header via `authenticateUser` |
| `.gitignore` | Not present | Added; covers `.env`, `node_modules/`, `dist/`, IDE dirs |

### Maintainability

| What changed | Mid-review state | Final state |
|---|---|---|
| Frontend structure | Single `App.jsx` (636 lines) | `App.jsx` (460 lines) + 4 focused components: `LoginScreen`, `FiltersPanel`, `ProjectCard`, `Modals` |
| JSDoc comments | Absent | Added to all backend route handlers and `middleware/auth.js` |
| `schema.sql` | Out of sync — `supervisor_feedback`, no FK columns | Synchronised with `db-setup.js`; correct column name `feedback`; FK columns present; `revisionRequested` in ENUM |
| `.env.example` | Identical to `.env` (same DB name, no placeholder secret) | `JWT_SECRET=your_secret_key_here` (placeholder); otherwise matches `.env` structure |

### Change Request (Student Edit / Status Lock)

| What changed | Mid-review state | Final state |
|---|---|---|
| Student can edit any owned submission | `PUT /:id` allowed edit if ownership matched, regardless of status | Status-transition lock added: only `revisionRequested` status allows student edits; approved/submitted/underReview/rejected all return 400 |
| New status added | 4 statuses: `submitted, underReview, approved, rejected` | 5th status `revisionRequested` added to DB ENUM, API whitelist, UI dropdowns, and CSS badge class |
| `badge-revisionrequested` CSS class | Not present | Added to `index.css` |
| All status badge classes | `badge-submitted` and `badge-underreview` missing | All 6 classes defined: `badge-submitted`, `badge-underreview`, `badge-approved`, `badge-rejected`, `badge-revisionrequested`, `badge-pending` |
| Student edit button visibility | Shown for all own projects | Shown only when `project.status === 'revisionRequested'` |
| Server-side student list scoping | Frontend sent `student_id` param; backend honoured it but did not enforce it | Backend enforces: if `req.user.role === 'student'`, SQL always adds `AND student_id = req.user.id` regardless of query params |
| Automated tests | Test file present but not run; 0 test results | 15/15 tests pass including status-lock tests and spoofing-prevention group |

---

## 11. Stage Drift / Early Work

| Item | Expected stage | When found | Assessment |
|---|---|---|---|
| `projects.test.js` (full file) | Testing stage | Present at mid-review | **Early** — scaffolded ahead of testing stage; was well-structured and needed only minor adjustment for the status-lock change |
| `jest` + `supertest` in `devDependencies` | Testing stage | Present at mid-review | **Early** — dependencies installed before stage |
| `npm run test` script in `package.json` | Testing stage | Present at mid-review | **Early** |
| `NODE_ENV !== 'test'` guard in `index.js` | Testing stage | Present at mid-review | **Early** — test-mode server awareness implemented before testing stage |
| `afterAll` cleanup pattern | Testing stage | Present at mid-review | **Early** — well-formed |

No business logic from stages that were not yet reached was detected at mid-review (no bcrypt, no HMAC, no component split at that point). All early work was in the test infrastructure, which benefited the project.

---

## 12. Security Risks and Exposed-Secret Check

### Residual Risks (acceptable for a workshop prototype)

| Risk | Severity | Detail |
|---|---|---|
| No rate limiting on login endpoint | Low | An attacker can make unlimited login attempts; no lockout mechanism. Acceptable for a local workshop prototype; would require express-rate-limit or similar in production. |
| No HTTPS | Low | Running over plain HTTP. All credentials travel unencrypted. This is expected for a local development prototype. |
| Category is a free-text VARCHAR | Low | The DB has no ENUM constraint on `category`; a direct API call with a crafted category value would persist. The UI constrains to 4 values, but the backend does not validate the category string. |
| No input sanitisation library | Low | Parameterised queries prevent SQL injection. React auto-escapes JSX output, preventing DOM XSS. No `DOMPurify` or equivalent for raw HTML rendering (none is used). |
| `localStorage` token storage | Low | Tokens are stored in `localStorage` (XSS-accessible). For a workshop, this is standard practice. A production system would prefer `httpOnly` cookies. |
| No server-side session store / logout | Low | Logout is client-side only (clears `localStorage`). The token remains technically valid until the secret changes. Acceptable for a local prototype. |

### Exposed-Secret Check

| Item | Status |
|---|---|
| `DB_PASSWORD` printed in this review | Not printed |
| `JWT_SECRET` printed in this review | Not printed |
| `.env` file tracked by git | Protected — `.gitignore` covers `.env` |
| `.env.example` contains production secrets | Safe — `JWT_SECRET=your_secret_key_here` (placeholder); `DB_PASSWORD=` (empty, acceptable for a local-root dev setup) |
| DB credentials in frontend source | None — confirmed by inspection of all `frontend/src/` files |

---

## 13. Documentation / Code Mismatches

All critical mismatches from the mid-review have been resolved.

| Item | Mid-review state | Final state |
|---|---|---|
| `schema.sql` column name | `supervisor_feedback` (broken) | `feedback` (matches API and `db-setup.js`) |
| `schema.sql` FK columns | Missing `student_id`, `supervisor_id` | Present with FOREIGN KEY constraints |
| `schema.sql` ENUM values | 4 values | 5 values including `revisionRequested` |
| README setup path | Referenced `schema.sql` as an alternative | Updated to `npm run db:setup` as the authoritative path |
| `.env.example` vs `.env` | Identical (same DB name, no JWT placeholder) | `.env.example` has `JWT_SECRET=your_secret_key_here` as a placeholder |
| Badge CSS classes | `badge-submitted` and `badge-underreview` missing | All 6 badge classes present in `index.css` |
| `/api/projects/users` authentication | Documented as auth-required but code had no middleware | Now enforced with `authenticateUser` at the route level |

### Remaining Minor Mismatches

| Item | Note |
|---|---|
| No Vite dev proxy in `vite.config.js` | `App.jsx` hard-codes `http://localhost:5000`. Acceptable for a workshop; a Vite proxy would make the port configurable. README documents the ports explicitly. |
| `/api/projects/users/public` endpoint | A public endpoint (`GET /api/projects/users/public`) returns only usernames for the login helper box. It is not mentioned in the README. It intentionally returns only usernames (no roles or IDs). |

---

## 14. Known Limitations

1. **No rate limiting on `/api/auth/login`** — Unlimited password-guessing attempts are possible. Use `express-rate-limit` in a production deployment.
2. **Category is a free-text VARCHAR at the DB level** — The UI restricts to 4 values, but a direct API call can store any string. Add a DB ENUM or backend validation list to enforce constraints.
3. **No Vite proxy for API URL** — The API base URL (`http://localhost:5000`) is hard-coded in `App.jsx`. Changing the backend port requires a source code edit.
4. **No server-side logout invalidation** — Tokens remain valid server-side after client logout. Token lifetime is bounded only by the `JWT_SECRET` remaining unchanged.
5. **`localStorage` token storage** — Standard for client-side apps but XSS-accessible. `httpOnly` cookies would be more secure for a production system.
6. **No frontend test runner** — There are no React component or UI tests. Browser manual checks are the only UI verification method.
7. **No filter integration tests** — The filter behaviour (`?status=`, `?category=`, `?supervisor_id=`) is wired correctly but has no automated test coverage.
8. **Supervisor-to-student assignment is one-directional** — A supervisor cannot be re-assigned after initial submission. The student must resubmit with a different supervisor selection (only possible when status is `revisionRequested`).
9. **No status-transition guard on supervisor review** — A supervisor can freely move a project between any valid status values in any order (e.g., `approved` back to `submitted`). A state-machine lock would improve workflow integrity.
10. **Credentials cheat-sheet visible on login screen** — The demo account usernames and password are displayed below the login form. This is intentional for the workshop but must be removed before any real deployment.

---

## 15. Demo Script

> **Preparation:** Ensure `npm run dev` is running in both `backend/` and `frontend/`. Open `http://localhost:5173` in a browser. A second browser tab or incognito window is useful for switching roles.

### Scene 1 — Student Submits a Project (2 min)

1. Log in as `student_alice` / `password123`.
2. Note the header: *"Signed in as: Alice Smith"*. Role badge shows *student*.
3. Observe the project list — Alice sees only her own submissions (student scoping enforced server-side).
4. Click **Submit New Project**.
5. Fill in: Title = *"Smart Water Management System"*, Description = *"IoT-based water monitoring"*, Category = *Artificial Intelligence*, Supervisor = *Carol Johnson*, Date = today's date.
6. Click **Submit Project** — success banner appears; new card appears in the list with status badge **SUBMITTED**.

### Scene 2 — Supervisor Reviews and Requests Revision (2 min)

1. Open a second browser tab and log in as `supervisor_carol` / `password123`.
2. Supervisor sees all projects. Locate *Smart Water Management System*.
3. Note that no Edit button is visible for the supervisor on this card.
4. Click **Review & Update Status**.
5. Change status to *Revision Requested*, type feedback: *"Please add system architecture diagram."*
6. Click **Submit Review** — success banner; card status badge updates to **REVISION REQUESTED** with feedback displayed.

### Scene 3 — Student Resubmits After Revision (1 min)

1. Return to Alice's tab. Refresh the page. The project now shows **REVISION REQUESTED** and the supervisor's feedback.
2. The **Edit Details** button is now visible (it only appears for `revisionRequested` status).
3. Click **Edit Details**, update the description, click **Save Changes**.
4. Status automatically resets to **SUBMITTED** — Alice has resubmitted; the card shows the updated description.

### Scene 4 — Protected Action Demonstration (1 min)

1. Still as Alice (student), attempt to call the review API directly. Open browser DevTools → Console → run:
   ```js
   fetch('http://localhost:5000/api/projects/1/review', {
     method: 'PUT',
     headers: {
       'Content-Type': 'application/json',
       'Authorization': 'Bearer ' + localStorage.getItem('token')
     },
     body: JSON.stringify({ status: 'approved', feedback: 'I approve myself.' })
   }).then(r => r.json()).then(console.log);
   ```
2. Response: `{ "error": "Only supervisors can add feedback or update project status." }` — 403 Forbidden. Backend blocks the attempt regardless of the UI.

### Scene 5 — Filters (30 sec)

1. As Carol (supervisor), use the **Filter by Supervisor** dropdown to show only Carol's projects.
2. Use **Filter by Category** to filter by *Artificial Intelligence*.
3. Combine filters — list updates live via backend query.

### Scene 6 — Automated Tests (30 sec)

1. Open a terminal in `backend/` and run `npm run test`.
2. Show: 15/15 tests pass in ~5 seconds, with test names visible in verbose output.

---

## 16. Suggested Viva Questions

### Architecture and Separation

1. Where in the code does the React frontend communicate with the Express backend? Show the exact line.
2. What would happen if you removed the `Authorization` header from a `fetch` call in `App.jsx`? Trace the execution path on the backend.
3. Why does `db.js` export both a `pool` and a `query` helper? When would you use `pool` directly vs the `query` helper?
4. The frontend hard-codes `http://localhost:5000`. What would break if the backend moved to port 4000? How would you fix this without touching `App.jsx`?

### Database and Setup

5. Run `npm run db:setup` twice in a row. What happens on the second run? Show which lines in `db-setup.js` ensure this is safe.
6. What is the difference between `npm run db:setup` and `npm run db:reset`? When would you use each?
7. Which column stores supervisor feedback in the `projects` table? What type is it, and is it required?
8. Open MySQL and run `DESCRIBE projects;`. Point to the foreign key columns. What would happen if you tried to insert a project with a `student_id` that does not exist in `users`?

### Login and Token Security

9. What was the original token format at mid-review? What is it now? Why is the new format more secure even though it is not a JWT?
10. The `middleware/auth.js` re-queries the `users` table on every request. Why? What attack does this prevent?
11. A student guesses that the token format is `<userId>.<signature>` and tries to forge a supervisor's token by using `supervisorCarol.id` with a random signature. What happens when the backend processes this token? Trace the exact code path.
12. Where are passwords hashed in this project? What algorithm is used, and what is `saltRounds=10`?

### Role Checks and Protected Actions

13. Open `projects.js` and find every location where a role check is performed. List them in order and explain what each one guards.
14. Bob is a student and tries to edit Alice's project submission. Walk through exactly what the backend checks and where the request is rejected.
15. Carol is a supervisor assigned to Alice's project. Dave is a supervisor assigned to Bob's project. What happens if Dave tries to review Alice's project? Which line rejects the request?
16. The review route has a status whitelist. Write the five valid status values from memory. What would the API return if a supervisor sent `status: "pending"`?

### Case-Specific: Project Fields, Feedback, Ownership

17. Point to the four case-specific fields in the `projects` table schema. Which one has a database-level constraint (ENUM)? Which one does not?
18. Is supervisor feedback required when submitting a review? Show the code line that handles an empty feedback value.
19. A student submits a project. The supervisor marks it `approved`. Can the student now edit the project? Explain the status-lock mechanism and which test proves it.
20. The `revisionRequested` status was added as a change request. List every place in the codebase that had to change to support this new status.

### Testing

21. What is the test cleanup pattern used in this project? Run the test suite and show that no `INTEGRATION_TEST:` rows remain after the tests finish.
22. The test uses `db.query` directly to manipulate the database inside a test (e.g., setting status to `approved`). Why is this done, and what is the risk of doing this in a production test suite?
23. The test suite does not test filter behaviour. If you had to add one test for the status filter, write the test case description and the HTTP call you would make.
24. What does `--runInBand` do in the Jest command? Why is it important for this test suite?

### Security and Limitations

25. The credentials cheat-sheet is shown on the login page. Would this be acceptable in a production system? What would you do instead?
26. There is no rate limiting on the login endpoint. What kind of attack does this enable? Name one npm package that would fix it.
27. The `.gitignore` now covers `.env`. But the `.env` was committed before `.gitignore` was added. What command would you run to verify that `.env` is not in the git history?
28. Name two limitations of this prototype that would need to be addressed before it could be used with real student data.
