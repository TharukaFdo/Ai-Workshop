# Mid-Project Review — Library Lending System

**Review Date:** 2026-07-13
**Stage:** After secondary-feature implementation (search/filter) — before testing, security hardening, and maintainability cleanup.
**Reviewer scope:** Read-only structural and code analysis. No source code was modified.

---

## 1. Mid-Review Summary

The project is a React + Express + MySQL prototype for a small library lending system. Both tiers are present and separated. The core lending workflow (borrow/return), librarian-only book CRUD, and member search/filter are all implemented end-to-end. The backend enforces role restrictions in middleware, not only the UI. The database is MySQL-backed with a repeatable seed script. Passwords are stored and compared in plaintext — the most significant security debt. There are no automated tests and no test hooks. The `vite.config.js` lacks a dev-server proxy, so the frontend hardcodes `http://localhost:5001`, which is a minor but noteworthy portability gap. The HTML `<title>` is still the Vite default ("client"). The `README.md` is the Vite template boilerplate and has not been replaced. Overall the functional scope for this stage is strong, with isolated gaps in security, portability, and documentation.

---

## 2. Review Scoring Matrix

| Feature / Area | Functionality 0-5 | Data Persistence 0-5 | Backend Security / Role Control 0-5 | Validation / Error Handling 0-5 | Testing Evidence 0-5 | Maintainability 0-5 | UI / Manual Usability 0-5 | Evidence | Notes |
|---|---:|---:|---:|---:|---:|---:|---:|---|---|
| Project setup and run commands | 4 | 5 | 5 | 3 | 0 | 3 | 5 | `server/package.json` scripts: `start`, `dev`, `db:init`; `client/package.json` scripts: `dev`, `build`, `preview` | No root-level orchestration script; client and server must be started separately; README is Vite boilerplate; HTML title is "client" |
| Database setup and starter data | 5 | 5 | 4 | 4 | 0 | 4 | 4 | `server/init-db.js` creates DB + tables + seeds users and books idempotently via TRUNCATE + re-insert | `.env` present in server with all five required vars; passwords not hashed in seed; no `server/.gitignore` |
| Login workflow | 4 | 4 | 1 | 4 | 0 | 2 | 4 | `POST /api/login` queries `users` table, returns `{id, username, role}`; frontend sends credentials via fetch | **Plaintext password storage and comparison** — no hashing; no token/session; no server-side logout invalidation |
| Role-based access | 4 | 5 | 4 | 3 | 0 | 3 | 4 | `authenticate` middleware re-queries DB on every request using `x-user-id` + `x-user-role` headers; role checks in every protected route | Headers are attacker-controllable (no JWT/session); middleware trusts client-supplied role rather than deriving it from DB record alone |
| Main create action | 5 | 5 | 4 | 4 | 0 | 4 | 4 | `POST /api/books` requires `authenticate` + `role === 'librarian'`; validates title/author/isbn/category; inserts to DB; frontend form with client-side pre-validation | No ISBN format/uniqueness validation; category is free-text in DB but UI uses fixed dropdown |
| Main view/list action | 5 | 5 | 4 | 3 | 0 | 4 | 5 | `GET /api/books` behind `authenticate`; returns all books; frontend renders card grid (member) and management table (librarian) | No server-side pagination or sorting; all books returned in one payload |
| Main update/status/cancel action | 5 | 5 | 4 | 4 | 0 | 4 | 4 | `PUT /api/books/:id` (librarian edit); `POST /api/books/:id/borrow` and `/return` (member); all behind `authenticate` + role check | `PUT` response body omits status/borrow fields; frontend merge could mask borrow state on a currently-borrowed book |
| Protected action | 5 | 5 | 5 | 4 | 0 | 4 | 4 | Add (`POST /api/books`), Edit (`PUT /api/books/:id`), Delete (`DELETE /api/books/:id`) all return HTTP 403 for non-librarian; UI hides controls for members | Backend protection is present and consistent |
| Secondary feature | 5 | 3 | 3 | 2 | 0 | 3 | 5 | Client-side filter on title/author/ISBN (search), category dropdown, and availability toggle implemented in `filteredBooks` derived state | Filter is **client-side only** — no server-side query endpoint; search also matches ISBN (not in brief); no filter-specific empty-state message |
| Case-specific: book catalog fields and availability status | 5 | 5 | 4 | 4 | 0 | 4 | 4 | `books` table has id, title, author, isbn, category, status, borrowed_member, borrowed_date, return_date — all fields from brief present | `status` is VARCHAR(50), not ENUM; no DB-level constraint on valid status values |
| Case-specific: borrow and return lending workflow | 5 | 5 | 5 | 4 | 0 | 4 | 4 | Borrow sets status=Borrowed, records member/dates with 14-day return window; Return clears fields; both check current status before acting | Only member role can borrow/return; no librarian override route for admin-return |
| Case-specific: librarian-only book management and member borrowing ownership | 5 | 5 | 5 | 4 | 0 | 4 | 4 | Borrow/return routes compare `req.user.username !== memberName`; backend also checks `book.borrowed_member !== memberName` on return | Ownership check relies on username string match, not user ID |
| UI / manual usability | 4 | 4 | 3 | 3 | 0 | 3 | 4 | Dark-mode UI, card grid for members, table for librarian, status badges, inline success/error messages | HTML title is "client"; App.css is essentially empty; all styles are inline; no CSS variables; librarian view has no search/filter; borrow/return errors use `alert()` |
| Security posture | 2 | 3 | 2 | 3 | 0 | 2 | 3 | `.env` isolates DB credentials from React; CORS enabled; authenticate middleware hits DB on every request | Plaintext passwords; no signed session; role spoofable via header; CORS has no origin restriction; no rate-limiting; no input sanitization beyond presence checks |
| Testing evidence | 0 | 0 | 0 | 0 | 0 | 0 | 0 | No test files, no test runner config, no test scripts in either package.json | No unit, integration, or E2E test infrastructure exists |
| Maintainability | 2 | 3 | 3 | 3 | 0 | 2 | 3 | Code is readable; route logic clear; `init-db.js` is a reusable seed script | All Express routes in single 261-line `index.js`; all React in single 875-line `App.jsx`; no component decomposition; README is Vite default; inline styles throughout; no environment documentation |

---

## 3. Current Feature Status

| Feature | Implemented | Where |
|---|---|---|
| Login (DB-backed) | Yes | `POST /api/login` → `users` table |
| Logout (client-side) | Yes | `handleLogout()` clears state |
| View all books | Yes | `GET /api/books` + card/table UI |
| Add book (librarian) | Yes | `POST /api/books` |
| Edit book (librarian) | Yes | `PUT /api/books/:id` |
| Delete book (librarian) | Yes | `DELETE /api/books/:id` |
| Borrow book (member) | Yes | `POST /api/books/:id/borrow` |
| Return book (member) | Yes | `POST /api/books/:id/return` |
| Search by title | Yes (client-side) | `filteredBooks` in `App.jsx` |
| Filter by category | Yes (client-side) | `filteredBooks` in `App.jsx` |
| Filter by availability | Yes (client-side) | `filteredBooks` in `App.jsx` |
| Role enforcement (backend) | Yes | `authenticate` middleware + per-route checks |
| Borrowing ownership enforcement | Yes | Username comparison on borrow + return routes |
| 14-day return window | Yes | Computed in borrow route |
| Health check endpoint | Yes | `GET /api/health` |

---

## 4. Database and Persistence Status

**Tables declared in `init-db.js`:**

| Table | Exists in schema | Key columns |
|---|---|---|
| `books` | Yes | id, title, author, isbn, category, status, borrowed_member, borrowed_date, return_date |
| `users` | Yes | id, username (UNIQUE), password, role |

**Seed data:**
- 4 books (Fiction x2, Science, Technology) — all Available
- 3 users: `librarian1` (librarian), `alice` (member), `bob` (member)

**Seed command:** `npm run db:init` (in `server/`)

**Environment variables used by backend:**

| Variable | Present in .env | Used in db.js | Used in init-db.js |
|---|---|---|---|
| DB_HOST | Yes | Yes | Yes |
| DB_PORT | Yes | Yes | Yes |
| DB_USER | Yes | Yes | Yes |
| DB_PASSWORD | Yes | Yes | Yes |
| DB_NAME | Yes | Yes | Yes |

**React never imports `mysql2` or reads `.env` DB variables** — confirmed. `App.jsx` uses `fetch` only.

**Gaps:**
- `status` column is VARCHAR(50) rather than an ENUM; no DB constraint prevents invalid status values.
- `isbn` has no UNIQUE constraint in the schema, allowing duplicate ISBNs.
- Passwords stored and compared in plaintext (no hashing).
- No `server/.gitignore` to prevent committing `.env`.

---

## 5. Login and Role/Access Status

**Login mechanism:** Database-backed. `POST /api/login` queries `users WHERE username = ? AND password = ?` and returns `{id, username, role}`.

**Session model:** Stateless headers. The client stores `{id, username, role}` in React state and sends `x-user-id` / `x-user-role` on every subsequent request. The `authenticate` middleware re-queries the DB using both values.

**Role enforcement location:**

| Check | Backend | Frontend |
|---|---|---|
| Only librarian can add book | Yes — index.js:71 | Yes — UI shows form only for librarian |
| Only librarian can edit book | Yes — index.js:104 | Yes — Edit button only in librarian table |
| Only librarian can delete book | Yes — index.js:134 | Yes — Delete button only in librarian table |
| Only member can borrow | Yes — index.js:154 | Yes — Borrow button only in member card |
| Only member can return | Yes — index.js:208 | Yes — Return button only when isBorrowedByMe |
| Member cannot borrow for others | Yes — index.js:166 | Partial — UI sends user.username, no spoof UI exists |
| Member cannot return others' books | Yes — index.js:236 | Partial — UI hides Return unless isBorrowedByMe |

**Security gap:** Because there is no signed token (JWT or session cookie), an attacker who knows a valid `user.id` could attempt to pass an arbitrary `x-user-role` header. The double check (id + role both verified against DB) partially mitigates this, but the pattern is weaker than a signed token.

---

## 6. Protected Action Status

Protected actions = Add, Edit, Delete book records (librarian only).

| Action | Route | HTTP method | Role check in backend | Returns 403 for non-librarian |
|---|---|---|---|---|
| Add book | `/api/books` | POST | Yes — `req.user.role !== 'librarian'` | Yes |
| Edit book | `/api/books/:id` | PUT | Yes — `req.user.role !== 'librarian'` | Yes |
| Delete book | `/api/books/:id` | DELETE | Yes — `req.user.role !== 'librarian'` | Yes |

All three protected routes also require the `authenticate` middleware, so an unauthenticated request (no headers) receives HTTP 401 before the role check is reached.

---

## 7. Validation Status

| Location | What is validated | Present |
|---|---|---|
| Frontend login form | Username and password non-empty | Yes |
| Frontend book form | All four fields non-empty before submit | Yes |
| Backend `POST /api/login` | Username and password required | Yes |
| Backend `POST /api/books` | title, author, isbn, category required | Yes |
| Backend `PUT /api/books/:id` | title, author, isbn, category required | Yes |
| Backend `POST /api/books/:id/borrow` | memberName required; book exists; status === Available | Yes |
| Backend `POST /api/books/:id/return` | memberName required; book exists; status === Borrowed; borrower match | Yes |
| Backend `DELETE /api/books/:id` | Checks affectedRows for 404 | Yes |

**Missing validation:**
- No ISBN format or uniqueness validation.
- No maximum length enforcement on title/author/category beyond DB column definition.
- Category accepted as free text in DB; the UI dropdown is the only guard.
- No numeric validation on `:id` path params (non-numeric IDs cause MySQL type coercion rather than an explicit 400).

---

## 8. Stage Drift / Early Implementation

| Item | Verdict |
|---|---|
| Password hashing | Not implemented — correctly deferred |
| JWT / signed session tokens | Not implemented — correctly deferred |
| Rate limiting / brute-force protection | Not implemented — correctly deferred |
| Automated tests / test runner | Not present — correctly deferred |
| Server-side search/filter API | Not implemented — client-side filter used; acceptable at this stage |
| Pagination | Not implemented — acceptable at prototype scale |
| Fines, barcode scanning, reminders | Not present — correctly excluded per brief |
| Multi-file component structure | Not refactored — single App.jsx; acceptable but noted |

No significant early-implementation drift detected. The AI did not add features beyond the stated scope.

---

## 9. Issues Found Before Stage 8

### Critical (must fix before production hardening stage)

1. **Plaintext passwords** — `users.password` stores raw strings; `SELECT ... WHERE password = ?` compares plaintext. Needs bcrypt or equivalent before security hardening stage.
2. **Unsigned session model** — `x-user-id` / `x-user-role` headers are client-controlled with no cryptographic signature. A minimal fix is to re-derive role from the DB row alone in `authenticate` and ignore the client-supplied role header, removing one spoofable surface.

### High (should fix before final review)

3. **No `server/.gitignore`** — `server/.env` containing DB credentials is not protected from accidental commits. The client directory has a `.gitignore`; the server directory does not.
4. **CORS wildcard** — `app.use(cors())` allows any origin. Should restrict to the configured frontend origin before security hardening.
5. **Hardcoded backend URL** — `http://localhost:5001` appears 9+ times in `App.jsx`. Should be a Vite environment variable (`VITE_API_URL`) or a Vite proxy entry so the app works in non-localhost environments.
6. **`PUT /api/books/:id` response body incomplete** — the edit route returns `{ id, title, author, isbn, category }` but omits `status`, `borrowed_member`, `borrowed_date`, and `return_date`. The frontend merges with `{ ...b, ...savedBook }`, which could cause borrow state to be lost in the UI if a book is currently borrowed when edited.

### Medium (quality and usability gaps)

7. **HTML `<title>` is "client"** — `index.html` was never updated from the Vite template default.
8. **`README.md` is Vite template boilerplate** — no project-specific setup or run instructions exist.
9. **`App.css` is essentially empty** — all styling is inline; no CSS custom properties or shared design tokens; future style changes are expensive.
10. **Single-file backend (`index.js`, 261 lines)** — all routes in one file; noted for maintainability.
11. **Single-file frontend (`App.jsx`, 875 lines)** — no component decomposition; will grow unwieldy.
12. **`alert()` used for borrow/return errors** — blocks the UI; should be replaced with inline error state (as the login form already does).
13. **Librarian view has no search/filter** — the inventory management table shows all books with no filtering; usability gap for large catalogs.
14. **`status` column has no DB-level ENUM constraint** — any string can be written; the application logic is the only guard.
15. **`isbn` column has no UNIQUE constraint** — duplicate ISBNs can be inserted without error.
16. **`init-db.js` uses `TRUNCATE` on every run** — intentional for demo reset but would destroy real data; this is correct for a prototype but must not carry forward.

### Low (minor)

17. **No Google Fonts or consistent font stack in CSS** — fonts are only specified in inline `fontFamily` strings in JSX.
18. **`vite.config.js` has no proxy config** — a `server.proxy` entry to forward `/api` to `localhost:5001` would remove hardcoded URL references from the frontend.
19. **`oxlintrc.json` exists but lint is not wired into a pre-commit hook or CI step** — the linter is configured but not enforced.

---

## 10. Manual Checks Recommended Next

1. **Run `npm run db:init` in `server/`** and confirm all tables are created and all seed rows are inserted without error.
2. **Start backend** (`npm run dev` in `server/`) and verify `GET http://localhost:5001/api/health` returns `{"status":"ok"}`.
3. **Start frontend** (`npm run dev` in `client/`) and log in as `librarian1 / lib123`. Verify:
   - Book list loads (librarian inventory table visible).
   - Add a new book → confirm it appears in the table and persists on reload.
   - Edit that book → confirm the change is saved.
   - Delete that book → confirm it is removed.
4. **Log in as `alice / alice123` (member)**. Verify:
   - Book grid loads with Available/Borrowed badges.
   - Borrow an available book → status changes to Borrowed, due date shown.
   - Return the book → status returns to Available.
5. **Cross-member ownership test:** Log in as `alice`, borrow a book. Log in as `bob`, attempt to return that book — expect HTTP 403.
6. **Search/filter test:** Use title search, category dropdown, and availability toggle independently and in combination.
7. **Role-spoofing test (manual API):** Send `POST /api/books` with `x-user-id: 2` (alice's ID) and `x-user-role: librarian` — expect HTTP 401 (DB lookup will fail because alice's role in the DB is 'member').
8. **Unauthenticated request test:** Send `GET /api/books` with no headers — expect HTTP 401.
9. **Confirm `server/.env` is not committed** if this project is using Git.

---

## 11. Pass / Fail Table

| Check | Result | Notes |
|---|---|---|
| App appears runnable | Pass | Both `npm run dev` (client) and `npm start` / `npm run dev` (server) scripts present; `node_modules` present in both |
| React frontend and Express backend are separated | Pass | `client/` and `server/` are distinct directories with separate `package.json` files |
| React calls Express routes only (no direct MySQL) | Pass | `App.jsx` uses `fetch` to `localhost:5001`; `mysql2` is only in `server/` |
| Backend uses DB_HOST, DB_PORT, DB_USER, DB_PASSWORD, DB_NAME | Pass | All five present in `server/.env` and consumed by `db.js` and `init-db.js` |
| Secrets not exposed in React | Pass | No `.env` in `client/`; no DB variables with VITE_ prefix |
| `books` table exists in schema | Pass | Declared in `init-db.js` with all required fields |
| `users`/login table exists | Pass | `users` table declared in `init-db.js` with id/username/password/role |
| Repeatable database setup/seed command | Pass | `npm run db:init` in `server/` |
| Login is database-backed | Pass | `POST /api/login` queries `users` table |
| Role restrictions enforced in backend | Pass | `authenticate` middleware + per-route role checks return 401/403 |
| Add/Edit/Delete book records protected | Pass | All three routes require librarian role; return 403 otherwise |
| Users limited to their own records | Pass | Borrow/return enforce `req.user.username === memberName` and `book.borrowed_member === memberName` |
| Borrow/return workflow implemented | Pass | Both routes functional with status, dates, and ownership checks |
| Search/filter by title, category, availability implemented | Pass (client-side) | Implemented as client-side derived state; no server-side query endpoint |
| Validation present | Pass (basic) | Required-field checks on all forms and routes; no format/uniqueness validation |
| No premature future-stage features | Pass | No hashing, JWT, tests, or advanced features implemented ahead of schedule |
| Passwords hashed | Fail | Plaintext password storage and comparison |
| No hardcoded backend URL in React | Fail | `http://localhost:5001` hardcoded 9+ times in `App.jsx` |
| `server/.env` protected from Git | Warn | No `server/.gitignore` found; `.env` may be committed |
| Project README updated | Fail | `client/README.md` is unmodified Vite template boilerplate |
| HTML `<title>` updated | Fail | `<title>client</title>` in `index.html` |
