# Final Review — Library Lending System

**Review Date:** 2026-07-13  
**Reviewer scope:** Read-only inspection of all completed project files. No source code, database schema, seed data, package files, or configuration were modified.  
**Evidence basis:** `server/index.js`, `server/db.js`, `server/init-db.js`, `server/test.js`, `server/package.json`, `server/.env`, `client/src/App.jsx`, `client/package.json`, `client/vite.config.js`, `client/index.html`, `client/.gitignore`, `Case_Brief.md`, `MID_REVIEW.md`.

---

## 1. Final Feature Summary

The Library Lending System is a React + Express + MySQL prototype that implements the full lending workflow described in `Case_Brief.md`. All core features are present and enforced at the backend level.

| Feature | Status | Evidence |
|---|---|---|
| Login (DB-backed, two roles) | Complete | `POST /api/login` - `users` table |
| Logout (client-side) | Complete | `handleLogout()` clears React state |
| View all books (catalog) | Complete | `GET /api/books` + card grid (member) / table (librarian) |
| Add book - librarian only | Complete | `POST /api/books` - 403 for member role |
| Edit book - librarian only | Complete | `PUT /api/books/:id` - 403 for member role |
| Delete book - librarian only | Complete | `DELETE /api/books/:id` - 403 for member role |
| Borrow book - member only | Complete | `POST /api/books/:id/borrow` - 403 for librarian |
| Return book - member, own book only | Complete | `POST /api/books/:id/return` - 403 for librarian or other member |
| Search by title / author / ISBN | Complete (client-side) | `filteredBooks` derived state in `App.jsx` |
| Filter by category | Complete (client-side) | `selectedCategory` filter in `App.jsx` |
| Filter by availability | Complete (client-side) | `availabilityFilter` state in `App.jsx` |
| Role enforcement - backend | Complete | `authenticate` middleware + per-route `req.user.role` checks |
| Borrowing ownership enforcement | Complete | `req.user.username !== memberName` on borrow; `book.borrowed_member !== memberName` on return |
| 14-day return window | Complete | Computed in borrow route via `returnDate.setDate(+14)` |
| Book reservation system (secondary/change-request feature) | Complete | `POST /api/books/:id/reserve`, `POST /api/reservations/:id/fulfill`, `POST /api/reservations/:id/cancel` |
| Automated integration tests | Present | `server/test.js` - 16 assertions, custom runner using native `fetch` |
| Test data cleanup | Present | Test deletes the inserted test book at end of `test.js` |
| Health check endpoint | Complete | `GET /api/health` |

**What is NOT built (per brief exclusions):** fines, barcode scanning, reminders, SMS/email notifications, pagination, server-side full-text search, JWT, hashed passwords.

---

## 2. Review Scoring Matrix

Scored after testing, security hardening, maintainability cleanup, and reservation change request.
Testing Evidence column covers: automated test existence, manual check instructions, test data cleanup, and reported results.

| Feature / Area | Functionality 0-5 | Data Persistence 0-5 | Backend Security / Role Control 0-5 | Validation / Error Handling 0-5 | Testing Evidence 0-5 | Maintainability 0-5 | UI / Manual Usability 0-5 | Evidence | Notes |
|---|---:|---:|---:|---:|---:|---:|---:|---|---|
| Project setup and run commands | 4 | 5 | 5 | 3 | 2 | 3 | 5 | `server/package.json` scripts: `start`, `dev`, `db:init`, `test`; `client/package.json`: `dev`, `build`, `preview` | No root-level orchestration script; two terminals required; README still Vite boilerplate; HTML title is still "client" |
| Database setup and starter data | 5 | 5 | 4 | 4 | 3 | 4 | 4 | `init-db.js` creates DB + 3 tables + seeds; `npm run db:init` is repeatable via TRUNCATE + re-insert | Passwords in seed are plaintext; `server/.gitignore` absent so `.env` could be committed |
| Login workflow | 4 | 4 | 1 | 4 | 3 | 2 | 4 | `POST /api/login` queries `users` table; returns `{id, username, role}`; 401 on bad credentials; frontend validates non-empty fields before POST | Plaintext password storage and comparison - no bcrypt; no JWT/session; no server-side logout invalidation |
| Role-based access | 4 | 5 | 4 | 3 | 3 | 3 | 4 | `authenticate` middleware re-queries DB on every request using both `x-user-id` and `x-user-role` headers; role checks in every protected route | Headers are client-controllable - no signed token; role is re-verified from DB row which partially mitigates spoofing, but pattern is weaker than JWT |
| Main create action | 5 | 5 | 5 | 5 | 3 | 4 | 4 | `POST /api/books` - librarian role check, `validateBookDetails()` helper trims/validates all 4 fields, ISBN numeric+length check, duplicate ISBN check, DB insert | Category is validated by UI dropdown only (not enforced in backend beyond presence) |
| Main view/list action | 5 | 5 | 4 | 3 | 3 | 4 | 5 | `GET /api/books` returns all books for any authenticated user; member sees card grid; librarian sees management table | No server-side pagination; all rows returned in single payload |
| Main update/status/cancel action | 5 | 5 | 4 | 4 | 3 | 4 | 4 | `PUT /api/books/:id` (librarian edit); `POST /api/books/:id/borrow` and `/return` (member) - all behind `authenticate` + role check | `PUT` response omits borrow fields; frontend merge with `{...b, ...savedBook}` could lose borrow display state if book is borrowed when edited |
| Protected action | 5 | 5 | 5 | 4 | 4 | 4 | 4 | Add/Edit/Delete return HTTP 403 for member role; automated test asserts member POST to 403; unauthenticated request to 401 | Test covers add-by-member (403) and add-by-librarian (201); edit/delete 403 cases are manual-only |
| Secondary feature | 5 | 3 | 4 | 3 | 3 | 3 | 5 | Reservation system: member reserves borrowed books, librarian fulfills/cancels; all behind authenticate + role checks; duplicate reservation prevented; automated tests cover full reserve-fulfill-cancel flow | Reservation was built as secondary feature - goes beyond search/filter originally listed; search/filter remains client-side only |
| Case-specific: book catalog fields and availability status | 5 | 5 | 4 | 4 | 4 | 4 | 4 | `books` table: id, title, author, isbn, category, status, borrowed_member, borrowed_date, return_date - all 9 fields from brief present; status is toggled via borrow/return routes | `status` is VARCHAR(50), not ENUM; no DB-level constraint prevents invalid status strings |
| Case-specific: borrow and return lending workflow | 5 | 5 | 5 | 5 | 4 | 4 | 4 | Borrow: sets status="Borrowed", records member/dates (+14 days); Return: clears to Available; both routes check current status before acting; automated test exercises borrow success path | Test covers borrow success; return path is not directly asserted in `test.js` (reservation fulfill path overrides the borrow state) |
| Case-specific: librarian-only book management and member borrowing ownership | 5 | 5 | 5 | 4 | 4 | 4 | 4 | Add/Edit/Delete: 403 for non-librarian; Borrow/Return: 403 for librarian; username match enforced on borrow and return; `book.borrowed_member` check on return prevents cross-member return | Ownership check uses username string, not user ID |
| UI / manual usability | 4 | 4 | 3 | 3 | 2 | 3 | 4 | Dark-mode UI (slate palette), card grid for members, management table for librarian, status badges, inline form success/error, credential helper on login screen | HTML title is "client"; borrow/return errors use `alert()`; all styles are inline; no CSS variables; librarian view has no search/filter |
| Security posture | 2 | 3 | 2 | 3 | 2 | 2 | 3 | `.env` isolates DB credentials from React; CORS enabled; `authenticate` re-queries DB on every request; no DB secrets in client bundle | Plaintext passwords; unsigned headers; CORS wildcard (no origin restriction); no rate-limiting; `server/.env` unprotected from Git |
| Testing evidence | 3 | 3 | 3 | 3 | 4 | 3 | 3 | `server/test.js`: 16 assertions, custom fetch-based runner, `npm test` script; covers login, role permission, validation, borrow, reservations, cancel, cleanup | No test framework (Jest/Vitest); no unit tests; no E2E browser tests; server must be running separately before `npm test`; return path not directly asserted |
| Maintainability | 2 | 3 | 3 | 3 | 2 | 2 | 3 | Code is readable; route logic is clear; `init-db.js` is a reusable seed script; `validateBookDetails` extracted as helper | All Express routes in single 478-line `index.js`; all React in single 1146-line `App.jsx`; no component decomposition; README is Vite default; inline styles throughout |

---

## 3. Project Structure and Run Commands

```
6 Library Lending System/p1/
├── Case_Brief.md
├── MID_REVIEW.md
├── FINAL_REVIEW.md          <- this file
├── client/                  (React 19 + Vite 8)
│   ├── .gitignore
│   ├── .oxlintrc.json
│   ├── README.md            <- still Vite template boilerplate
│   ├── index.html           <- <title>client</title> (not updated)
│   ├── package.json
│   ├── vite.config.js
│   ├── public/
│   └── src/
│       ├── App.css          <- effectively empty (17 bytes)
│       ├── App.jsx          <- entire frontend (1146 lines, monolithic)
│       ├── assets/
│       ├── index.css
│       └── main.jsx
└── server/                  (Node.js + Express 4)
    ├── .env                 <- DB credentials (no .gitignore in server/)
    ├── db.js                <- mysql2/promise pool, reads .env
    ├── index.js             <- all API routes (478 lines, monolithic)
    ├── init-db.js           <- creates DB + tables + seed data
    ├── package.json
    └── test.js              <- integration test runner (248 lines)
```

### Run Commands

| Action | Directory | Command |
|---|---|---|
| Create DB + tables + seed data | `server/` | `npm run db:init` |
| Start backend (dev, hot-reload) | `server/` | `npm run dev` |
| Start backend (production) | `server/` | `npm start` |
| Run automated tests | `server/` | `npm test` (requires server already running) |
| Start frontend dev server | `client/` | `npm run dev` |
| Build production frontend | `client/` | `npm run build` |

No root-level `package.json` or `concurrently` script exists. Two separate terminal windows are required to run the full stack.

---

## 4. Frontend/Backend Separation Check

| Criterion | Result | Evidence |
|---|---|---|
| React and Express are in separate directories | Pass | `client/` and `server/` are distinct directories with independent `package.json` files and separate `node_modules` |
| React calls Express routes via HTTP - never MySQL directly | Pass | `App.jsx` uses native `fetch()` to `http://localhost:5001/api/*`; `mysql2` is a dependency only in `server/package.json` |
| No MySQL credentials in React bundle | Pass | `client/.env` does not exist; no `VITE_DB_*` variables; React bundle contains only `localhost:5001` URLs |
| Backend URL is hardcoded | Warning | `http://localhost:5001` appears 9+ times in `App.jsx`; no Vite proxy and no `VITE_API_URL` environment variable; the app breaks if the backend port changes |
| `vite.config.js` has proxy configured | No | `vite.config.js` contains only the React plugin; no `server.proxy` entry |

---

## 5. Database Setup and Table Summary

### Connection Method

`server/db.js` creates a `mysql2/promise` connection pool. All five required variables are read from `server/.env` via `dotenv`:

| Variable | Configured in `.env` | Default fallback in code | Notes |
|---|---|---|---|
| `DB_HOST` | Yes (`localhost`) | `'localhost'` | - |
| `DB_PORT` | Yes (`3306`) | `3306` | - |
| `DB_USER` | Yes (`root`) | `'root'` | - |
| `DB_PASSWORD` | Yes (value present) | `''` | Not printed in this review |
| `DB_NAME` | Yes (`c6p1`) | `'c6p1'` | - |

`init-db.js` opens a separate `mysql2/promise` direct connection (not the pool) to run DDL and seed operations. It reads the same five variables.

### Database Tables

| Table | Exists in `init-db.js` | Key Columns | Notes |
|---|---|---|---|
| `books` | Yes | `id`, `title` (VARCHAR 255), `author` (VARCHAR 255), `isbn` (VARCHAR 100), `category` (VARCHAR 100), `status` (VARCHAR 50, default 'Available'), `borrowed_member` (VARCHAR 255, nullable), `borrowed_date` (DATE, nullable), `return_date` (DATE, nullable) | `status` is VARCHAR - no ENUM constraint; `isbn` has no UNIQUE DB constraint (uniqueness enforced in application logic only) |
| `users` | Yes | `id`, `username` (VARCHAR 255, UNIQUE), `password` (VARCHAR 255), `role` (VARCHAR 50) | Passwords stored in plaintext - no bcrypt hashing |
| `reservations` | Yes | `id`, `book_id` (FK -> `books.id` ON DELETE CASCADE), `member_username` (VARCHAR 255), `reserved_date` (DATE), `status` (VARCHAR 50, default 'Pending') | Added as part of secondary/change-request feature; cascade delete ensures reservations are cleaned up when a book is deleted |

A `users` / login table exists. The `users` table holds `id`, `username`, `password`, and `role`. Login queries this table directly.

### How to Recreate Tables and Seed Data

```bash
# From the server/ directory:
npm run db:init
```

`init-db.js` performs these steps idempotently:
1. `CREATE DATABASE IF NOT EXISTS c6p1`
2. `CREATE TABLE IF NOT EXISTS books ...`
3. `CREATE TABLE IF NOT EXISTS users ...`
4. `CREATE TABLE IF NOT EXISTS reservations ...`
5. `SET FOREIGN_KEY_CHECKS = 0; TRUNCATE TABLE reservations; TRUNCATE TABLE books; TRUNCATE TABLE users; SET FOREIGN_KEY_CHECKS = 1;`
6. INSERT 4 seed books (Fiction x2, Science x1, Technology x1) - all Available
7. INSERT 3 seed users: `librarian1` (librarian), `alice` (member), `bob` (member)

Running this command at any time resets all data to the original demo state. Running it again after testing restores the starting state.

---

## 6. Login and Role/Access Explanation

### How Login Works

1. User submits username + password on the React login form.
2. Frontend calls `POST /api/login` with JSON body `{ username, password }`.
3. Backend queries `SELECT id, username, role FROM users WHERE username = ? AND password = ?`.
4. On match: returns `{ id, username, role }` with HTTP 200.
5. On no match: returns HTTP 401 `{ error: 'Invalid username or password' }`.
6. React stores the returned object in `useState(null)` as `user`.
7. On every subsequent API call, React sends `x-user-id` and `x-user-role` as HTTP headers.

There is no JWT, cookie, or server-side session. The session lives entirely in React component state and is lost on page reload.

### How Role Checks Work

The `authenticate` middleware (lines 37-56 of `index.js`) runs on every protected route:

1. Reads `req.headers['x-user-id']` and `req.headers['x-user-role']`.
2. Queries `SELECT * FROM users WHERE id = ? AND role = ?`.
3. If the row exists: attaches `req.user = rows[0]` and calls `next()`.
4. If no row: returns HTTP 401.

After `authenticate` passes, each route performs an additional `req.user.role` check:

| Route | Required Role | Failure Response |
|---|---|---|
| `POST /api/books` | `librarian` | HTTP 403 |
| `PUT /api/books/:id` | `librarian` | HTTP 403 |
| `DELETE /api/books/:id` | `librarian` | HTTP 403 |
| `POST /api/books/:id/borrow` | `member` | HTTP 403 |
| `POST /api/books/:id/return` | `member` | HTTP 403 |
| `POST /api/books/:id/reserve` | `member` | HTTP 403 |
| `POST /api/reservations/:id/fulfill` | `librarian` | HTTP 403 |
| `POST /api/reservations/:id/cancel` | `librarian` | HTTP 403 |
| `GET /api/books` | any authenticated | HTTP 401 (no headers) |
| `GET /api/reservations` | any authenticated; member sees own only | HTTP 401 (no headers) |

### Member Record Isolation

Members are restricted to their own borrowing records by username-equality checks in the backend:

- **Borrow:** `req.user.username !== memberName` returns HTTP 403 "cannot borrow books on behalf of other members"
- **Return:** `req.user.username !== memberName` returns HTTP 403 "cannot return books on behalf of other members"; additionally `book.borrowed_member !== memberName` returns HTTP 403 "cannot return a book borrowed by another member"
- **Reserve:** `req.user.username !== memberName` returns HTTP 403
- **Reservation visibility:** `GET /api/reservations` filters to `WHERE r.member_username = ?` for the member role; librarians see all

---

## 7. Protected Action Explanation

The protected actions per the case brief are: add book, edit book, delete book (librarian only).

All three are implemented with dual-layer protection:

1. **`authenticate` middleware** - verifies `x-user-id` + `x-user-role` pair against the `users` table. An unauthenticated request (missing headers) is rejected with HTTP 401 before the route handler runs.
2. **Route-level role check** - `if (req.user.role !== 'librarian') return res.status(403).json(...)` is the first line in each protected route handler.

The UI additionally hides the Add/Edit/Delete form and buttons entirely when `user.role !== 'librarian'`, but this is a UX measure only - the backend check is authoritative.

**Automated test coverage for protected actions:**
- `test.js` asserts that `POST /api/books` with member credentials returns HTTP 403 (line 68).
- `test.js` asserts that `POST /api/books` with librarian credentials returns HTTP 201 (line 85).
- Edit (PUT) and Delete (DELETE) 403 paths are not directly asserted in `test.js`; they are manual-check items only.

---

## 8. Validation Summary

### Frontend Validation (client/src/App.jsx)

| Field / Action | Rule |
|---|---|
| Login - username | Required, trimmed; empty returns inline error |
| Login - password | Required, trimmed; empty returns inline error |
| Book form - title | Required, trimmed; empty returns inline error |
| Book form - author | Required, trimmed; empty returns inline error |
| Book form - isbn | Required; numeric digits only (spaces/hyphens stripped); length 10-17 chars |
| Book form - category | Required; selected from fixed dropdown (Fiction / Science / Technology / Biography) |

### Backend Validation (server/index.js - `validateBookDetails` helper and individual routes)

| Location | Rule | Error Response |
|---|---|---|
| `POST /api/login` | username + password required | HTTP 400 |
| `validateBookDetails()` | All 4 fields required, trimmed, non-empty | HTTP 400 |
| `validateBookDetails()` | title <= 255, author <= 255, isbn <= 50, category <= 100 chars | HTTP 400 |
| `validateBookDetails()` | ISBN: numeric-only after stripping spaces/hyphens; raw length 10-17 chars | HTTP 400 |
| `POST /api/books` | ISBN must not already exist in `books` table | HTTP 400 |
| `PUT /api/books/:id` | ISBN must not exist on a different book | HTTP 400 |
| `PUT /api/books/:id` | Book must exist (affectedRows check) | HTTP 404 |
| `DELETE /api/books/:id` | Book must exist (affectedRows check) | HTTP 404 |
| `POST /api/books/:id/borrow` | memberName required | HTTP 400 |
| `POST /api/books/:id/borrow` | Book must exist | HTTP 404 |
| `POST /api/books/:id/borrow` | Book status must be 'Available' | HTTP 400 |
| `POST /api/books/:id/return` | memberName required | HTTP 400 |
| `POST /api/books/:id/return` | Book must exist | HTTP 404 |
| `POST /api/books/:id/return` | Book status must be 'Borrowed' | HTTP 400 |
| `POST /api/books/:id/return` | `book.borrowed_member` must match `memberName` | HTTP 403 |
| `POST /api/books/:id/reserve` | memberName required | HTTP 400 |
| `POST /api/books/:id/reserve` | Book must be 'Borrowed' (not Available) | HTTP 400 |
| `POST /api/books/:id/reserve` | Member cannot reserve their own borrowed book | HTTP 400 |
| `POST /api/books/:id/reserve` | No duplicate pending reservation for same member + book | HTTP 400 |
| `POST /api/reservations/:id/fulfill` | Reservation must exist + status 'Pending' | HTTP 400/404 |
| `POST /api/reservations/:id/cancel` | Reservation must exist + status 'Pending' | HTTP 400/404 |

**Known validation gaps:**
- `status` column has no DB-level ENUM - application logic is the only constraint.
- `isbn` has no UNIQUE index in the DDL - uniqueness is enforced in application code only.
- Numeric path params (`:id`) are not validated as integers - MySQL coercion handles non-numeric IDs silently.
- Category is free-text at the DB level; the UI dropdown is the only category restriction.

---

## 9. Automated and Manual Testing Summary

### Automated Tests

**Command:** `npm test` (from `server/` - requires the Express server to already be running)  
**Runner:** Custom Node.js script (`server/test.js`) using native `fetch` - no Jest, Vitest, or Mocha.  
**Test count:** 16 assertions across 7 logical groups.

| Group | What is checked | Assertions |
|---|---|---|
| User login | Librarian 200, member 200, invalid credentials 401 | 3 |
| Role permissions (add book) | Member POST returns 403, librarian POST returns 201 | 2 |
| Input validation | Duplicate ISBN returns 400 | 1 |
| Borrow workflow | Member borrow under own name returns 200 | 1 |
| Reservation workflow | Reserve borrowed book returns 201 + status Pending; duplicate reserve returns 400; librarian fulfill returns 200 + status Fulfilled; book now checked out to reserving member | 5 |
| Cancel reservation | Librarian cancel returns 200 + status Cancelled | 2 |
| Cleanup | Librarian deletes test book returns 200 | 1 |

**Test data lifecycle:** `test.js` inserts one book (isbn: '9998887776') and exercises it through the full workflow. At the end it deletes that book via `DELETE /api/books/:id`. The seed users (librarian1, alice, bob) are used directly and not modified. No fixture teardown for users is needed.

**Expected test pass result (when server and DB are initialized):**  
`All tests passed successfully!` - process exit 0.

### What is NOT Automated

| Gap | Impact |
|---|---|
| No test framework (Jest/Vitest) | No test isolation, mocking, or structured test report |
| No unit tests | `validateBookDetails`, `authenticate`, and individual route handlers are tested only through HTTP calls |
| Edit book (PUT) 403 path | Not asserted in test.js - manual check only |
| Delete book (DELETE) 403 path | Not asserted in test.js - manual check only |
| Return book path | Not directly asserted - reservation fulfill overwrites borrow state before any explicit return test |
| Search/filter logic | Client-side only - no test exercises filtering |
| Cross-member return rejection (403) | Not in test.js - manual check only |
| Role-spoofing rejection | Not in test.js - manual check only |
| UI / browser automation | No E2E tests (Playwright/Cypress) |

### Manual Check Instructions

1. Run `npm run db:init` in `server/` - confirm 3 tables created, seed inserted.
2. Start `npm run dev` in `server/` - verify `GET http://localhost:5001/api/health` returns `{"status":"ok"}`.
3. Start `npm run dev` in `client/` - open browser.
4. Log in as `librarian1 / lib123` - verify inventory table, add/edit/delete book.
5. Log in as `alice / alice123` - borrow a book, verify status + due date; return the book.
6. Log in as `alice`, borrow a book; log in as `bob`, attempt to return it - expect HTTP 403 error alert.
7. Use search box, category dropdown, availability filter - verify correct subsets display.
8. Send `GET /api/books` with no headers - expect HTTP 401.
9. Confirm `server/.env` is not committed if Git is in use.

---

## 10. Stage 11 Change Summary

The primary change introduced after the mid-review stage (Stage 11 / change request / secondary feature completion) is the Book Reservation System.

### What Changed

| Area | Change |
|---|---|
| `server/index.js` | Added 4 new routes: `GET /api/reservations`, `POST /api/books/:id/reserve`, `POST /api/reservations/:id/fulfill`, `POST /api/reservations/:id/cancel` - file grew from ~261 lines to 478 lines |
| `server/init-db.js` | Added `reservations` table DDL with FK to `books.id` ON DELETE CASCADE; added `TRUNCATE TABLE reservations` to the reset sequence - file grew from ~80 lines to 117 lines |
| `client/src/App.jsx` | Added `reservations` state, `fetchReservations()`, `handleReserve()`, `handleFulfillReservation()`, `handleCancelReservation()`; added "My Reservations" table for members; added "Reservations Management Queue" table for librarians with Fulfill/Cancel buttons - file grew from ~875 lines to 1146 lines |
| `server/test.js` | Integrated reservation tests into the test suite - file created (248 lines); previously no test file existed at mid-review |
| `server/package.json` | `"test": "node test.js"` script added |

Also resolved between mid-review and final review:
- ISBN duplicate check added to both `POST /api/books` and `PUT /api/books/:id`.
- Field length caps added to `validateBookDetails` helper.

### What the Reservation Feature Does

- A member can reserve a book that is currently Borrowed by another member.
- The reservation is stored in the `reservations` table with status `Pending`.
- A librarian can Fulfill the reservation - the backend updates `books.status` to `Borrowed` and sets `borrowed_member` to the reserver, effectively transferring the book checkout.
- A librarian can Cancel a pending reservation.
- A member cannot reserve a book they have already borrowed.
- A member cannot place a duplicate pending reservation for the same book.
- Members see only their own reservations; librarians see all.

---

## 11. Stage Drift and Early Implementation

| Item | Verdict |
|---|---|
| Password hashing (bcrypt) | Not implemented - correctly deferred / still absent at final stage |
| JWT / signed session tokens | Not implemented - correctly deferred; stateless header model used throughout |
| Rate limiting / brute-force protection | Not implemented - correctly deferred |
| Server-side search/filter endpoints | Not implemented - client-side filter; acceptable for prototype scope |
| Pagination | Not implemented - acceptable at demo scale |
| Fines, barcode, reminders | Not present - correctly excluded per brief |
| Reservation system | Built as the Stage 11 secondary feature / change request - appropriate timing |
| Multi-file component structure | Not refactored - single-file backend and frontend; noted as maintainability gap |
| Automated tests | Added at Stage 11 - correctly introduced at testing stage |

No significant early-stage drift detected. No features were implemented ahead of their appropriate stage, and no features outside the brief scope were added without rationale.

---

## 12. Security Risks and Exposed-Secret Check

| Risk | Severity | Detail |
|---|---|---|
| Plaintext password storage | Critical | `users.password` stores raw strings. `SELECT ... WHERE password = ?` compares plaintext. Any DB read access exposes all passwords immediately. |
| Client-controlled role headers | High | `x-user-id` and `x-user-role` are sent by the browser with no cryptographic signature. The `authenticate` middleware mitigates this by re-querying both `id` AND `role` from the DB, so a spoofed role alone is rejected. However, an attacker who knows a valid librarian `id` could attempt to forge headers. A signed JWT or session cookie would eliminate this surface. |
| CORS wildcard | Medium | `app.use(cors())` permits requests from any origin. Should be restricted to `http://localhost:5173` (or the configured frontend origin) before deployment. |
| `server/.env` not protected from Git | Medium | No `server/.gitignore` file exists. If this project is under Git version control, `server/.env` containing `DB_PASSWORD` could be committed and pushed. The client directory has a `.gitignore`; the server directory has none. |
| Hardcoded backend URL in React | Low | `http://localhost:5001` appears 9+ times in `App.jsx`. Not a security risk but makes the app non-portable. |
| No rate limiting | Low | The login endpoint has no brute-force protection. Acceptable for a local prototype. |
| No input sanitization beyond presence/length | Low | SQL injection is mitigated by parameterized queries (mysql2 prepared statements used throughout). No raw string concatenation in SQL. |

**Secret exposure check:** The `DB_PASSWORD` value in `server/.env` is present. Its value is **not printed** in this review. The key `DB_PASSWORD` exists with a value on line 5 of `server/.env`. There is no `server/.gitignore` to prevent this file from being committed to source control.

---

## 13. Documentation/Code Mismatches

| Item | Document says | Code reality | Mismatch? |
|---|---|---|---|
| Mid-review noted "no test files" | MID_REVIEW.md line 33: "No test files, no test runner config, no test scripts" | `server/test.js` (248 lines) and `"test": "node test.js"` now exist | Resolved - test added at Stage 11 |
| Mid-review noted `index.js` is 261 lines | MID_REVIEW.md line 34 | `index.js` is now 478 lines (reservation routes added) | Expected - reflects Stage 11 growth |
| Mid-review noted `App.jsx` is 875 lines | MID_REVIEW.md line 34 | `App.jsx` is now 1146 lines | Expected - reservation UI added |
| Mid-review noted no reservation table | Not explicitly stated, but `reservations` absent from schema section | `init-db.js` now creates `reservations` table | Expected - change request addition |
| Mid-review "ISBN no uniqueness validation" | MID_REVIEW.md line 24 | ISBN duplicate check added in both POST and PUT routes | Resolved in Stage 11 |
| Mid-review "no max length enforcement" | MID_REVIEW.md line 146 | `validateBookDetails` now enforces title <= 255, author <= 255, isbn <= 50, category <= 100 | Resolved in Stage 11 |
| `Case_Brief.md` mentions search/filter | "search or filter books by title, category, or availability" | Client-side filter in `filteredBooks` - no server endpoint | Functional match; implementation is client-side only |
| HTML `<title>` | Expected: "Library Lending System" or similar | `<title>client</title>` - still the Vite default | Not corrected |
| `client/README.md` | Expected: project-specific run instructions | Still the Vite template boilerplate | Not corrected |

---

## 14. Known Limitations

1. **Plaintext passwords** - the most critical unresolved security debt. No bcrypt or equivalent is in place.
2. **No signed session** - `x-user-id`/`x-user-role` headers are client-controlled; no JWT or signed cookie.
3. **CORS allows all origins** - `app.use(cors())` with no `origin` option.
4. **Hardcoded backend URL** - `http://localhost:5001` in 9+ places in `App.jsx`; app is non-portable.
5. **`server/.env` unprotected from Git** - no `server/.gitignore`; credentials risk accidental commit.
6. **No server-side logout** - logout is React state clear only; no token invalidation or session termination.
7. **`status` column has no ENUM constraint** - any string can be written to `books.status`; application logic is the only guard.
8. **`isbn` has no UNIQUE index** in DDL - uniqueness enforced in code only; direct DB writes could create duplicates.
9. **`PUT /api/books/:id` response omits borrow fields** - frontend merges `{...b, ...savedBook}` which could wipe borrow display state for a currently-borrowed book.
10. **Automated test run requires server to be manually started first** - `npm test` will fail if Express is not already running.
11. **Return path not directly asserted in test.js** - reservation fulfill overwrites borrow state, so the explicit return workflow lacks an automated assertion.
12. **Alert dialogs for borrow/return errors** - `alert()` blocks the browser UI; should use inline state.
13. **Librarian inventory view has no search or filter** - usability gap for large catalogs.
14. **Category is not enforced at backend level** - the category dropdown in the UI is the only constraint.
15. **HTML `<title>` is still "client"** - not updated from Vite template.
16. **`client/README.md` is Vite boilerplate** - no project setup or run instructions.
17. **Single-file frontend (1146 lines) and backend (478 lines)** - monolithic; no component decomposition or route module separation.
18. **All React styles are inline** - no CSS variables, no shared design tokens; `App.css` is empty.
19. **No pagination** - `GET /api/books` returns all rows; will degrade with large catalogs.

---

## 15. Demo Script

### Prerequisites

```bash
# Terminal 1 - Backend
cd server
npm run db:init          # create DB, tables, seed data
npm run dev              # start Express on port 5001

# Terminal 2 - Frontend
cd client
npm run dev              # start Vite dev server (default: http://localhost:5173)
```

### Step-by-Step Demo

**Step 1 - Health check**  
Navigate to `http://localhost:5001/api/health`. Confirm `{"status":"ok","message":"Library Lending API is running"}`.

**Step 2 - Login as librarian**  
Open `http://localhost:5173`. On the login screen, note the demo credentials displayed below the form. Enter `librarian1` / `lib123` and click Sign In.

**Step 3 - Librarian catalog management**  
- Observe the Inventory Management table with 4 seed books and their statuses.
- Fill the Add Book form: Title="Test Novel", Author="Demo Author", ISBN="1234567890", Category=Fiction. Click Add Book.
- Confirm the new book appears in the table with status Available.
- Click Edit on the new book. Change the title to "Updated Novel". Click Update Book.
- Confirm the title updates in the table without disturbing the status.

**Step 4 - Logout and login as member**  
Click Logout. Enter `alice` / `alice123` and Sign In.

**Step 5 - Member catalog view and borrow**  
- Observe the card grid showing all books with green Available badges.
- Use the search bar to type "Updated". Confirm only the test book displays.
- Use the Category dropdown to select Fiction. Confirm the filtered list.
- Click Borrow on "Updated Novel". Observe the card changes to red Borrowed badge with due date (today + 14 days) and a Return button.

**Step 6 - Return**  
Click Return on "Updated Novel". Observe the card returns to green Available with a Borrow button.

**Step 7 - Cross-member ownership and reservation check**  
- As alice, borrow "The Great Gatsby".
- Logout. Login as `bob` / `bob123`.
- "The Great Gatsby" shows as Borrowed. Bob sees a Reserve button (not Return).
- Click Reserve. Confirm "Reservation placed successfully!" alert. Reservation appears in My Reservations table with status Pending.

**Step 8 - Librarian fulfils reservation**  
Logout. Login as `librarian1`. Go to Reservations Management Queue. Click Fulfill on bob's reservation. Confirm status changes to Fulfilled. Check Inventory - "The Great Gatsby" is now borrowed by bob.

**Step 9 - Run automated tests**  
In a third terminal (server must still be running):
```bash
cd server
npm test
```
Observe 16 assertions, all PASS, and the summary "All tests passed successfully!"

**Step 10 - Cleanup**  
Librarian deletes "Updated Novel" from the Inventory Management table.

---

## 16. Suggested Viva Questions

### Architecture and Separation

1. Why is `mysql2` only in `server/package.json` and not in `client/package.json`? What would happen if a student imported it in `App.jsx`?
2. You have `http://localhost:5001` written 9 times in `App.jsx`. What is the problem with that approach and what are two ways to fix it?
3. What does the `authenticate` middleware do, and why is it applied to most routes but not `POST /api/login`?

### Database and Schema

4. What is the purpose of `SET FOREIGN_KEY_CHECKS = 0` in `init-db.js`? What risk does that introduce if used carelessly?
5. Why does the `books.status` column use `VARCHAR(50)` instead of an `ENUM`? What would need to change to add an ENUM constraint?
6. If you delete a book that has pending reservations, what happens to those reservation rows? Where is this behaviour declared in the schema?

### Security

7. Passwords are stored as plaintext strings. Name the hash function you would use and explain the difference between hashing and encrypting.
8. An attacker intercepts network traffic and sees `x-user-id: 1` and `x-user-role: librarian` in a request header. Explain exactly why the `authenticate` middleware does or does not stop a spoofed request.
9. What is the current CORS configuration and what specific change would you make before deploying to a shared server?

### Role Enforcement

10. Show in code where the backend prevents a member from adding a book. What HTTP status code is returned and what is the JSON body?
11. A member sends `POST /api/books/:id/return` with `memberName: "alice"` but Alice did not borrow that book. What two backend checks prevent this from succeeding?
12. Why is it insufficient to only hide the Delete button in the React UI for members? Where must the protection exist and why?

### Lending Workflow

13. Walk through every database write that occurs when a member successfully borrows a book. What columns change and to what values?
14. What is the business rule about reserving an available book? Where is that rule enforced in the code?
15. When a librarian fulfils a reservation, which two tables are updated and in what order? What would go wrong if the reservation status were updated before the book status?

### Testing

16. `npm test` fails immediately with a connection refused error. What does that mean and what must you do before running the tests?
17. The test file does not test the `PUT /api/books/:id` route with a member token. Write the fetch call and assertion you would add to cover that case.
18. After `npm test` finishes, is the database in the same state as before the test ran? Justify your answer from the test code.

### Maintainability

19. `App.jsx` is 1146 lines and contains login UI, librarian UI, member UI, and all API calls in a single file. What refactoring strategy would you apply and what files would you create?
20. The `client/README.md` still says "React + Vite". Write three bullet points that should be in a proper project README for this system.

---

*End of Final Review*
