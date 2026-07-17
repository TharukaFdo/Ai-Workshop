# Library Lending System — Final Review

**Project path:** `p2`
**Review stage:** Final — after testing, security hardening, maintainability cleanup, and change request.
**Reviewed:** 2026-07-16
**Reviewer:** Antigravity AI (evidence-based static review of all project files — no code modified, no source files altered)

---

## 1. Final Feature Summary

The project is a React + Express + MySQL prototype for a small library lending system. It correctly separates a React 19 frontend (Vite) from a Node/Express backend. All primary case brief features are implemented and functional at the code level.

| Feature | Status | Evidence file(s) |
|---|---|---|
| Add book record (librarian only) | ✅ Implemented | `backend/routes/books.js` L45–65 |
| Edit book record (librarian only) | ✅ Implemented | `backend/routes/books.js` L68–90 |
| Delete book record (librarian only) | ✅ Implemented | `backend/routes/books.js` L93–111 |
| View / list book catalog | ✅ Implemented | `backend/routes/books.js` L8–42 |
| Borrow book (member only) | ✅ Implemented | `backend/routes/books.js` L114–145 |
| Return book (borrower or librarian) | ✅ Implemented | `backend/routes/books.js` L148–176 |
| Search by title / author / ISBN | ✅ Implemented | `backend/routes/books.js` L21–25 |
| Filter by category | ✅ Implemented | `backend/routes/books.js` L26–28 |
| Filter by availability status | ✅ Implemented | `backend/routes/books.js` L29–33 |
| Reserve borrowed book (member only) | ✅ Implemented (change request / extra) | `backend/routes/books.js` L179–216 |
| Manage reservations (librarian) | ✅ Implemented (change request / extra) | `backend/routes/books.js` L219–275 |
| Login (username-only, DB-backed) | ✅ Implemented | `backend/routes/auth.js` L8–29 |
| Logout (session destroy) | ✅ Implemented | `backend/routes/auth.js` L32–43 |
| Automated backend integration tests | ✅ Implemented | `backend/test.js` (244 lines) |
| Health check endpoint | ✅ Implemented | `backend/server.js` L19–21 |

---

## 2. Review Scoring Matrix

Scores reflect the **final completed project** after testing, security hardening, maintainability cleanup, and the reservation change request.

| Feature / Area | Functionality 0-5 | Data Persistence 0-5 | Backend Security / Role Control 0-5 | Validation / Error Handling 0-5 | Testing Evidence 0-5 | Maintainability 0-5 | UI / Manual Usability 0-5 | Evidence | Notes |
|---|---:|---:|---:|---:|---:|---:|---:|---|---|
| Project setup and run commands | 5 | 4 | — | — | 3 | 3 | — | `backend/package.json` scripts: `start`, `dev`, `db:setup`, `test`. `frontend/package.json` scripts: `dev`, `build`, `lint`, `preview`. Both `node_modules` present. | No root-level README or combined startup guide. Hard-coded `localhost:5000` URL in React remains. |
| Database setup and starter data | 5 | 5 | — | — | 4 | 4 | — | `schema.sql` creates DB (`c6p2`), all tables, seeds 3 users + 3 books via `INSERT IGNORE`. `setup-db.js` re-runs idempotently. `npm run db:setup` wires it. | No migration versioning. `db.js` fallback DB name (`library_lending_db`) differs from `schema.sql` (`c6p2`). |
| Login workflow | 3 | 4 | 2 | 3 | 4 | 3 | 4 | `POST /api/auth/login` queries `users` by username; issues `crypto.randomUUID()` token stored in MySQL `sessions` table. Logout deletes from `sessions`. Tests cover login for all three user types. | No password — username-only. Token persists across restarts (DB-backed sessions). `localStorage` token storage is an XSS risk. |
| Role-based access | 5 | 4 | 5 | 4 | 4 | 4 | 4 | `requireAuth` re-queries DB on every request. `requireLibrarian` returns 403. Inline member/ownership checks on borrow and return. Tests verify 403 for member → add book. | Role check is live from DB — no stale JWT risk. |
| Main create action | 5 | 5 | 5 | 4 | 4 | 4 | 4 | `POST /api/books` guarded by `requireAuth + requireLibrarian`. Validates required fields (400). Duplicate ISBN check (400). Returns 201. Test: member gets 403; librarian creates successfully. | No max-length validation on text fields. |
| Main view/list action | 5 | 5 | 3 | 3 | 4 | 4 | 4 | `GET /api/books` public endpoint. JOINs `users` for borrower name and `reservations` for pending reservation. React renders color-coded status badges, due date, borrower name, reservation indicator. Test: ISBN search returns exactly one result. | Public endpoint exposes who borrowed each book (possible privacy gap). No server-side pagination. |
| Main update/status/cancel action | 4 | 5 | 5 | 3 | 4 | 4 | 3 | `PUT /api/books/:id` guarded; duplicate ISBN excluding self. `POST /api/books/:id/return` resets all borrow fields. Reservation cancel: `POST /api/reservations/:id/cancel`. Tests cover reservation cancel and book return. | `PUT` allows setting `availabilityStatus: "Borrowed"` without borrow fields — orphaned state possible. No 404 guard if book ID does not exist on PUT. |
| Protected action | 5 | 5 | 5 | 4 | 5 | 4 | 4 | POST/PUT/DELETE `/api/books` all carry `requireAuth, requireLibrarian`. Test explicitly proves member gets 403 on book create. Delete checks for Borrowed status before removing. | Backend is the authoritative guard; UI hiding is supplemental. |
| Secondary feature | 4 | 4 | 3 | 3 | 4 | 3 | 4 | `GET /api/books?search=&category=&availabilityStatus=`. LIKE search on title/author/ISBN. Exact match on category and status. React: text input + two dropdowns; `useEffect` re-fetches on every filter change. Test: search by ISBN returns exactly 1 result. | No debounce on search input. Category dropdown is hard-coded. Search matches author and ISBN (minor over-scope vs. case brief). |
| Case-specific: book catalog fields and availability status | 5 | 5 | 4 | 4 | 4 | 4 | 5 | `books` table: `title`, `author`, `isbn UNIQUE`, `category`, `availabilityStatus ENUM('Available','Borrowed','Unavailable')`, `borrowedMemberId FK`, `borrowedDate`, `returnDate`, `createdAt`, `updatedAt`. React displays all fields with color-coded status badges. | `Unavailable` has no dedicated workflow; only settable via librarian edit form. |
| Case-specific: borrow and return lending workflow | 5 | 5 | 5 | 4 | 5 | 4 | 5 | Borrow sets `Borrowed` + `borrowedMemberId` + `borrowedDate` + 14-day `returnDate` atomically. Return clears all four fields, resets to `Available`. Member-only borrow enforced server-side. Tests cover full borrow to return cycle. | Return due date fixed at +14 days; no custom due date (acceptable for prototype). |
| Case-specific: librarian-only book management and member borrowing ownership | 5 | 5 | 5 | 4 | 5 | 4 | 5 | Librarian: full CRUD via `requireLibrarian`. Member: borrow for self only; return only if `borrowedMemberId === user.id` OR librarian. Tests: member adds book gets 403; member 2 return member 1 book blocked by ownership logic. | Ownership enforcement is server-side. Librarian can return any book (correct admin override). |
| UI / manual usability | 3 | — | — | 3 | 0 | 3 | 3 | Single-page React SPA. Table layout. Filter bar. Sidebar form for add/edit (librarian only). Toast error/success messages auto-dismiss at 4.5 s. Reservation queue panel for librarian. Quick-login buttons on login screen. | No router. `<title>` still reads "frontend". Dead CSS in `App.css`. No frontend automated tests. `text-align: center` on `#root` conflicts with left-aligned table. |
| Security posture | 3 | 4 | 4 | 3 | 3 | 3 | — | Sessions now DB-backed (`sessions` table) — survive restarts. Parameterized queries (`mysql2`) prevent SQL injection. `requireAuth + requireLibrarian` on all write routes. No Helmet, no rate limiting, no HTTPS, wide-open CORS remain. | Password-free login remains the biggest single vulnerability. `.env` committed (empty password, but file present). |
| Testing evidence | 4 | 4 | 4 | 4 | 4 | 4 | — | `backend/test.js`: 244-line automated integration test suite. Covers login, role protection, book CRUD, search, borrow, reserve, cancel, fulfill, return, delete. Seeds isolated test users/books with random suffix. Cleans up in `finally` block. Run with `npm test`. | No frontend/UI tests. No test framework (uses Node native `assert`). Requires server to be running. |
| Maintainability | 3 | — | — | — | 3 | 3 | — | Code is readable. Files named consistently. `db.js` uses connection pool. Middleware extracted. `App.jsx` is 717 lines (grown from 565 at mid-review). Dead CSS in `App.css` unremediated. Hard-coded URL unremediated. Frontend README is Vite default. No root README. | No JSDoc. No API documentation. No component splitting. Category list still hard-coded. |

---

## 3. Project Structure and Run Commands

```
p2/
├── Case_Brief.md
├── MID_REVIEW.md
├── FINAL_REVIEW.md          ← this file
├── backend/
│   ├── .env                 ← NOT for public repos; committed here with empty password
│   ├── .env.example
│   ├── db.js                ← mysql2/promise connection pool
│   ├── middleware/
│   │   └── auth.js          ← requireAuth, requireLibrarian
│   ├── node_modules/
│   ├── package.json
│   ├── package-lock.json
│   ├── routes/
│   │   ├── auth.js          ← POST /api/auth/login, POST /api/auth/logout
│   │   └── books.js         ← all book and reservation routes (278 lines)
│   ├── schema.sql           ← DDL + seed data (4 tables)
│   ├── server.js            ← Express entry point
│   ├── setup-db.js          ← runs schema.sql against MySQL
│   └── test.js              ← automated integration tests (244 lines)
└── frontend/
    ├── .gitignore
    ├── .oxlintrc.json
    ├── README.md            ← Vite default (not project-specific)
    ├── index.html           ← <title> still reads "frontend"
    ├── node_modules/
    ├── package.json
    ├── package-lock.json
    ├── public/
    ├── src/
    │   ├── App.css          ← contains dead Vite scaffold CSS
    │   ├── App.jsx          ← 717-line single-component SPA
    │   ├── assets/
    │   ├── index.css        ← design tokens, light/dark mode
    │   └── main.jsx         ← React 19 entry point
    └── vite.config.js
```

### Run commands

```bash
# 1. Database setup (run once, or to reset)
cd backend
npm install
npm run db:setup          # node setup-db.js → executes schema.sql

# 2. Backend dev server
npm run dev               # nodemon server.js → http://localhost:5000

# 3. Backend automated tests (server must be running first)
npm test                  # node test.js

# 4. Frontend dev server (separate terminal)
cd ../frontend
npm install
npm run dev               # vite → http://localhost:5173 (default)
```

---

## 4. Frontend / Backend Separation Check

| Check | Result | Evidence |
|---|---|---|
| Separate directory trees | YES | `frontend/` and `backend/` with independent `package.json` and `node_modules` |
| Independent package files | YES | `frontend/package.json` (React, Vite, oxlint) vs. `backend/package.json` (Express, mysql2, dotenv, nodemon) |
| React calls Express routes, never MySQL | YES | Every `fetch()` in `App.jsx` targets `http://localhost:5000/api/*`. The `mysql2` package exists only in `backend/node_modules`. |
| No DB credentials in React code | YES | No `.env` in frontend. `App.jsx` contains no DB connection strings. |
| No `mysql2` in frontend dependencies | YES | `frontend/package.json` dependencies: `react`, `react-dom` only. |

React hard-codes `http://localhost:5000` directly in every `fetch()` call in `App.jsx` (approximately 15 occurrences). No `VITE_API_URL` or `.env` is used on the frontend side. This is a maintainability limitation but does not break the separation requirement.

---

## 5. Database Setup and Table Summary

### Connection method

`backend/db.js` creates a `mysql2/promise` connection **pool** with the following configuration:

| Variable | Key | Default fallback |
|---|---|---|
| `DB_HOST` | Host | `localhost` |
| `DB_PORT` | Port | `3306` |
| `DB_USER` | User | `root` |
| `DB_PASSWORD` | Password | *(empty string)* — **not printed** |
| `DB_NAME` | Database | `library_lending_db` |

All five required variables are configured and read correctly from `.env` via `dotenv`. The actual `.env` file is committed to the repository with an empty password, which is acceptable for a local prototype but would be a secret-leak pattern in a real repository.

> **Mismatch:** The `db.js` fallback database name is `library_lending_db`, but `schema.sql` creates and selects `c6p2`. If `.env` is absent or `DB_NAME` is unset, the application will connect to the wrong (non-existent) database. The `.env.example` correctly sets `DB_NAME=c6p2`.

### Tables

| Table | Present | Key Columns | Notes |
|---|---|---|---|
| `users` | YES | `id INT PK`, `username VARCHAR(50) UNIQUE`, `role ENUM('librarian','member')`, `created_at` | No `password` column — username-only auth |
| `books` | YES | `id INT PK`, `title`, `author`, `isbn UNIQUE`, `category`, `availabilityStatus ENUM('Available','Borrowed','Unavailable')`, `borrowedMemberId FK→users`, `borrowedDate DATE`, `returnDate DATE`, `createdAt`, `updatedAt` | All case-brief fields present |
| `sessions` | YES | `token VARCHAR(255) PK`, `userId FK→users (CASCADE DELETE)`, `createdAt` | DB-backed session store — survives server restarts |
| `reservations` | YES | `id INT PK`, `bookId FK→books (CASCADE DELETE)`, `memberId FK→users (CASCADE DELETE)`, `status ENUM('Pending','Fulfilled','Cancelled')`, `createdAt` | Change request / extra feature |

A `users` / login table exists. It holds `id`, `username`, and `role`, and is used by both the login route and the `requireAuth` middleware.

### Seed data

`schema.sql` lines 44–53 use `INSERT IGNORE` to seed:
- **Users:** `librarian1` (librarian), `member1` (member), `member2` (member)
- **Books:** *The Great Gatsby*, *To Kill a Mockingbird*, *1984* — all `Available`

### Re-creating tables and seed data

```bash
cd backend
npm run db:setup
```

`setup-db.js` connects without specifying a database, then runs the entire `schema.sql` file using `multipleStatements: true`. `CREATE TABLE IF NOT EXISTS` and `INSERT IGNORE` make it fully idempotent — safe to re-run without destroying existing data. To fully reset, drop the `c6p2` database in MySQL first, then re-run `npm run db:setup`.

---

## 6. Login and Role / Access Explanation

### How the two roles log in

Both roles use the same login page. There is no password field. The user types a username (e.g., `librarian1` or `member1`) and clicks **Sign In**.

**Backend flow (`POST /api/auth/login`):**
1. Receives `{ username }` in the request body.
2. Queries: `SELECT id, username, role FROM users WHERE username = ?`
3. If not found → `401 Invalid username`.
4. If found → generates `crypto.randomUUID()` token, inserts into `sessions` table.
5. Returns `{ token, user: { id, username, role } }` to the client.

**Client:**
- Stores `token` and `user` in `localStorage`.
- React reads role from `localStorage` user object for UI rendering decisions.
- The backend re-reads the role from the database on every protected request (no stale token risk).

### How roles are checked

| Check location | Mechanism | Effect |
|---|---|---|
| `requireAuth` middleware | Reads `Authorization: Bearer <token>` header; looks up `userId` from `sessions` table; re-queries `users` for live role; attaches `req.user` | Returns 401 if token missing or invalid |
| `requireLibrarian` middleware | Checks `req.user.role !== 'librarian'` | Returns 403 for any non-librarian |
| Borrow endpoint inline | `if (user.role !== 'member')` | Returns 403 if a librarian tries to borrow |
| Return endpoint inline | `if (user.role !== 'librarian' && book.borrowedMemberId !== user.id)` | Returns 403 if a member tries to return a book they did not borrow |
| React UI (supplemental) | `currentUser?.role === 'librarian'` conditions | Hides/shows Add Book, Edit, Delete buttons |

All role enforcement is authoritative on the backend. React UI hiding is supplemental only.

### Can users access only their own allowed records?

Yes, by code proof:

- **Members cannot borrow for others:** The borrow route uses `user.id` from `req.user` (set by middleware from the live DB session), not from the request body.
- **Members cannot return other members' books:** `book.borrowedMemberId !== user.id` enforces ownership server-side. Only a librarian may override.
- **Members see the same public book catalog as librarians** — intentional for a library system, but the catalog exposes who borrowed each book (borrower username visible to all).

---

## 7. Protected Action Explanation

The case-specific protected action is **librarian-only book management** (add, edit, delete book records).

| Route | Method | Middleware chain | 401 if no token | 403 if not librarian |
|---|---|---|---|---|
| `/api/books` | POST (Add) | `requireAuth` + `requireLibrarian` | YES | YES |
| `/api/books/:id` | PUT (Edit) | `requireAuth` + `requireLibrarian` | YES | YES |
| `/api/books/:id` | DELETE | `requireAuth` + `requireLibrarian` | YES | YES |
| `/api/reservations` | GET (list) | `requireAuth` + `requireLibrarian` | YES | YES |
| `/api/reservations/:id/fulfill` | POST | `requireAuth` + `requireLibrarian` | YES | YES |
| `/api/reservations/:id/cancel` | POST | `requireAuth` + `requireLibrarian` | YES | YES |

Additional business rules on DELETE (`books.js` L97–104):
- Returns `404` if book does not exist.
- Returns `400 Cannot delete a book that is currently borrowed` if `availabilityStatus === 'Borrowed'`.

The automated test at `test.js` L85–93 explicitly verifies that a member token receives `403` when attempting `POST /api/books`.

---

## 8. Validation Summary

### Backend validation (code-proven)

| Route | Validations |
|---|---|
| `POST /api/auth/login` | Username required → 400 |
| `POST /api/books` | title, author, isbn, category all required → 400; duplicate ISBN → 400 |
| `PUT /api/books/:id` | Same required-field check; duplicate ISBN excluding self → 400 |
| `DELETE /api/books/:id` | Book exists → 404; not Borrowed → 400 |
| `POST /api/books/:id/borrow` | Book exists → 404; availabilityStatus === Available → 400 if not; role === member → 403 |
| `POST /api/books/:id/return` | Book exists → 404; availabilityStatus === Borrowed → 400 if not; ownership → 403 |
| `POST /api/books/:id/reserve` | Book exists → 404; availabilityStatus === Borrowed → 400 if not; no duplicate pending reservation → 400 |
| `POST /api/reservations/:id/fulfill` | Reservation exists → 404; status === Pending → 400 if not |
| `POST /api/reservations/:id/cancel` | Reservation exists → 404; status === Pending → 400 if not |

### Frontend validation

- Login: empty username check before API call; HTML `required` attribute.
- Book form: presence check for all four required fields before API call; HTML `required` on each input.
- Delete: `window.confirm()` dialog before DELETE request.
- Delete button disabled in UI when `availabilityStatus === 'Borrowed'`.

### Validation gaps (persisting from mid-review)

- No max-length validation on title, author, isbn, category fields.
- No ISBN format validation (numeric, 10 or 13 digits).
- `PUT /api/books/:id` does not validate `availabilityStatus` against enum values — an arbitrary string causes an uncaught MySQL 500.
- `PUT /api/books/:id` does not verify the book exists before updating — silently succeeds with `affectedRows: 0`; no 404 returned.
- `GET /api/books?search=` does not escape SQL LIKE wildcards (%, _) in user input.

---

## 9. Automated and Manual Testing Summary

### Automated tests — `backend/test.js`

**Command:** `cd backend && npm test`
**Requirement:** Express backend must be running (`npm run dev`) before running tests.
**Framework:** Node built-in `assert` module (no Jest/Mocha/Vitest).

**What the test suite covers (8 logical sections):**

| # | Section | What it checks |
|---|---|---|
| 1 | Seed test data | Directly inserts isolated test librarian, member 1, member 2 via `db.query` with random suffix |
| 2 | Login & auth | `POST /api/auth/login` returns 200 for all three test users; tokens captured |
| 3 | Role protection | Member token → `POST /api/books` → asserts 403; librarian token → same → asserts 201 |
| 4 | Edit book | Librarian PUT book → asserts 200 |
| 5 | Search/filter | `GET /api/books?search=<isbn>` → asserts exactly 1 result |
| 6 | Borrow/return | Member borrows available book → asserts 200; member 1 returns own book → asserts 200 |
| 7 | Reservations | Member 2 reserves borrowed book → 200; librarian lists; librarian cancels → 200; re-reserve; librarian fulfills → 200 |
| 8 | Delete book | Librarian DELETE book → asserts 200 |
| 9 | Cleanup | `finally` block deletes all test users and books regardless of pass/fail |

**Cleanup strategy:** A `finally` block always executes. It deletes test book by ID and by ISBN (double-safety), and all three test users by ID. Cascade deletes in the schema automatically remove `sessions` and `reservations` rows for those users.

**Test isolation:** All test records use a random 5-character suffix (e.g., `test_librarian_abc12`), preventing collisions with seed data.

### What is not automated

- **No frontend / UI tests** — no Cypress, Playwright, or React Testing Library tests. All frontend verification must be done manually.
- **No unit tests** — individual middleware functions (`requireAuth`, `requireLibrarian`) are not tested in isolation.
- **No test for 401 (missing token)** — the suite does not call a protected route without a token.
- **No test for duplicate ISBN** — the 400 duplicate-ISBN response is not exercised.
- **No test for deleting a borrowed book** — the 400 block on DELETE is not exercised.

### Manual checks still required

1. Start `npm run dev` → confirm `GET /api/health` returns `{"status":"ok"}`.
2. Start frontend `npm run dev` → confirm login page renders correctly.
3. Log in as `librarian1` → confirm "Add Book Record" button visible.
4. Log in as `member1` → confirm "Add Book Record" button absent.
5. Borrow a book as `member1` → confirm status badge changes to Borrowed, borrower name and due date shown.
6. As `member2`, confirm the Return button is absent for `member1`'s borrowed book.
7. Filter by category and availability → confirm filtered results are correct.
8. Attempt `POST /api/books` with no Authorization header → expect 401.
9. Attempt `DELETE /api/books/:id` with a member token → expect 403.
10. Restart the backend → confirm existing sessions still work (DB-backed sessions survive restarts).

---

## 10. Stage 11 Change Summary

Between the mid-review (end of Stage 10 / secondary feature) and the final review, the following changes were made:

### Sessions moved from in-memory Map to MySQL `sessions` table

**Mid-review state:** `server.js` used a module-level `Map`. Sessions were lost on every server restart.

**Final state:** A `sessions` table now exists in `schema.sql`. `routes/auth.js` inserts into `sessions` on login and deletes from `sessions` on logout. `middleware/auth.js` queries `SELECT userId FROM sessions WHERE token = ?` on every request. Sessions survive server restarts. This resolved mid-review issue **H2**.

### Reservation feature added (change request)

A new `reservations` table was added to `schema.sql`. Six new backend routes were added in `routes/books.js`:
- `POST /api/books/:id/reserve` — member reserves a borrowed book
- `GET /api/reservations` — librarian lists all reservations
- `POST /api/reservations/:id/fulfill` — librarian marks fulfilled
- `POST /api/reservations/:id/cancel` — librarian cancels

React `App.jsx` grew from ~565 lines to 717 lines to add the **Active Reservations Queue** panel (librarian only), **Reserve** button for members, and handler functions for fulfill/cancel.

### Automated test suite added

`backend/test.js` (244 lines) was created. `"test": "node test.js"` script added to `package.json`. This resolved the testing gap from mid-review.

### Changes that were NOT made (persisting mid-review issues)

| Mid-Review Issue | Status |
|---|---|
| H1 — No password authentication | Not fixed |
| H3 — Wide-open CORS | Not fixed |
| H4 — Token in localStorage | Not fixed |
| H5 — `.env` committed | Not fixed |
| H6 — No Helmet.js | Not fixed |
| H7 — No rate limiting | Not fixed |
| M1 — PUT allows Borrowed status without borrow fields | Not fixed |
| M2 — PUT no 404 for missing ID | Not fixed |
| M3 — PUT no enum validation on status | Not fixed |
| M4 — DB name mismatch in fallback | Not fixed |
| M5 — Hard-coded `localhost:5000` in React | Not fixed |
| L1 — `App.jsx` single large file | Not fixed (now 717 lines, worse) |
| L2 — Dead CSS in `App.css` | Not fixed |
| L3 — `<title>` reads "frontend" | Not fixed |
| L4 — Frontend README is Vite default | Not fixed |
| L5 — No root README | Not fixed |
| L6 — `text-align: center` on `#root` | Not fixed |
| L7 — No search debounce | Not fixed |
| L8 — Hard-coded category list | Not fixed |
| L9 — No `VITE_API_URL` env variable | Not fixed |

---

## 11. Stage Drift / Early Implementation

| Item | Expected Stage | Status |
|---|---|---|
| Unit tests (isolated functions) | Test stage | Not implemented — acceptable |
| Frontend UI tests (Cypress/Playwright) | Test stage | Not implemented — gap |
| JWT / signed tokens | Security hardening | Not implemented — correct |
| Password hashing (bcrypt) | Security hardening | Not implemented — known gap |
| HTTPS / TLS enforcement | Security hardening | Not implemented — correct |
| Rate limiting | Security hardening | Not implemented — known gap |
| Helmet.js headers | Security hardening | Not implemented — known gap |
| Fine calculation | Out of scope | Not implemented — correct |
| Barcode / ISBN scanner | Out of scope | Not implemented — correct |
| Email / SMS reminders | Out of scope | Not implemented — correct |
| Pagination | Out of scope | Not implemented — correct |

**Items implemented ahead of their declared stage:**

The `reservations` feature (table, routes, UI) was delivered at the final stage as an explicitly requested **change request**. It is not in the original `Case_Brief.md` and was not in the mid-review feature list (listed as out-of-scope under "Multi-copy / reservation queue"). Because it was a requested change rather than unauthorized scope creep, it does not constitute harmful stage drift.

**Minor over-scope from secondary feature (unchanged from mid-review):** `GET /api/books?search=` matches on `author` and `isbn` in addition to the case-brief's `title`. This is an additive extra and not a conflict.

---

## 12. Security Risks and Exposed-Secret Check

> WARNING: The backend `.env` file is committed to the repository. It contains `DB_PASSWORD=` (empty value for a local prototype). In a real project with a non-empty password, this would constitute a credential leak. The pattern is incorrect regardless of whether the current value is empty. The `.env` file should be added to `.gitignore`.

| Risk | Severity | Detail |
|---|---|---|
| No password authentication | HIGH | Any person who knows a valid username can log in. The `users` table has no `password` column. Prototype-level known limitation. |
| `.env` committed to repository | MEDIUM | `backend/.env` is present in the project directory. If pushed to a public repo, all DB configuration is exposed. |
| Token stored in `localStorage` | MEDIUM | XSS attack can steal the session token. `HttpOnly` cookies would be safer. |
| Wide-open CORS (`cors()` with no options) | MEDIUM | Any origin can make requests to the backend. Should be restricted to the frontend origin. |
| No Helmet.js | MEDIUM | Missing HTTP security headers (X-Frame-Options, CSP, HSTS, etc.). |
| No rate limiting on `/api/auth/login` | MEDIUM | Brute-force username enumeration is possible. |
| Parameterized queries in use | MITIGATED | All DB queries use `mysql2` prepared statements with `?` placeholders — SQL injection is prevented. |
| DB password value | NOT PRINTED | The `.env` and `.env.example` both set `DB_PASSWORD=` (empty). The actual password value is not reproduced in this review. |

---

## 13. Documentation / Code Mismatches

| # | Mismatch | Document | Code |
|---|---|---|---|
| 1 | DB name fallback mismatch | `MID_REVIEW.md` §4 correctly documents this | `db.js` L8 fallback = `library_lending_db`; `schema.sql` L1–2 creates `c6p2` |
| 2 | Mid-review describes sessions as in-memory Map | `MID_REVIEW.md` §5 L124 says "in-memory sessions Map" | Sessions are now DB-backed (`sessions` table) — mid-review was accurate at time of writing but is now outdated |
| 3 | Mid-review feature table does not list reservations | `MID_REVIEW.md` §3 | `backend/routes/books.js` has 6 reservation routes; `schema.sql` has `reservations` table |
| 4 | `frontend/README.md` is Vite default | States "React + Vite template" | Actual project is a library lending system prototype |
| 5 | `<title>` in `index.html` reads "frontend" | `frontend/index.html` L7 | Application is "Library Lending System" |
| 6 | `App.css` contains Vite scaffold classes | `.hero`, `.ticks`, `#next-steps`, `#spacer`, `#docs`, `.counter` defined | None of these classes are used in `App.jsx` — dead CSS |
| 7 | `index.css` sets `text-align: center` on `#root` | `frontend/src/index.css` L61 | `App.jsx` renders left-aligned tables — creates visual alignment conflict |

---

## 14. Known Limitations

1. **No password authentication.** Login is username-only. Any person who knows a valid username can authenticate. This is the single largest security limitation for moving to production.
2. **Sessions table not indexed by userId.** `token` is the PK (implicitly indexed), but there is no explicit index on `userId` in `sessions`. Acceptable at prototype scale.
3. **Hard-coded backend URL in React.** All ~15 `fetch()` calls in `App.jsx` use the literal string `http://localhost:5000`. Deploying the frontend to any other host requires a manual find-and-replace.
4. **Single-component frontend.** `App.jsx` is 717 lines with all state, logic, and JSX in one component. No component splitting, no custom hooks, no React Router.
5. **No frontend tests.** There are no React Testing Library, Cypress, or Playwright tests. Frontend correctness relies entirely on manual checks.
6. **No ISBN format validation.** Any string is accepted as an ISBN. There is no check for 10- or 13-digit numeric format.
7. **`PUT /api/books/:id` allows orphaned borrow state.** A librarian can set `availabilityStatus` to `"Borrowed"` via the edit form without setting `borrowedMemberId`, `borrowedDate`, or `returnDate`, creating an inconsistent record.
8. **`PUT /api/books/:id` has no 404 guard.** If the book ID does not exist, the route silently returns 200 with `affectedRows: 0`.
9. **Category list is hard-coded** in `App.jsx` (L28) and the filter dropdown. New categories added via book records will not appear in the dropdown.
10. **No search debounce.** The search input fires a backend request on every keystroke.
11. **No server-side pagination.** All books are returned in one query. For a large catalog this would degrade performance.
12. **`Unavailable` status has no workflow.** It exists in the ENUM and can be set via the librarian edit form, but there is no dedicated route or UI action to mark a book unavailable.
13. **Reservation fulfillment does not transfer borrowership.** `POST /api/reservations/:id/fulfill` marks the reservation `Fulfilled` but does not update the book's `borrowedMemberId` to the reserving member. The hand-over requires a separate borrow action.
14. **`.env` committed to repository.** Bad practice even with an empty password value. `.gitignore` does not exclude `.env`.

---

## 15. Demo Script

Estimated time: 8–10 minutes. Audience: supervisor or evaluator.

### Pre-flight

```bash
# Terminal 1
cd backend && npm run db:setup    # confirm "Database and tables initialized successfully"
cd backend && npm run dev          # confirm "Server is running on port 5000"

# Terminal 2
cd frontend && npm run dev         # confirm Vite dev server URL (e.g., http://localhost:5173)
```

Open `http://localhost:5173` in a browser.

---

### Step 1 — Login as Librarian (1 min)

1. Click the **librarian1** quick-fill button. Username fills automatically.
2. Click **Sign In**. Dashboard loads.
3. Header shows: *Signed in as: **librarian1** (LIBRARIAN)*.
4. Point out the **+ Add Book Record** button — only visible for librarians.
5. Point out **Edit** and **Delete** buttons in every book row.

### Step 2 — Librarian Adds a Book (1 min)

1. Click **+ Add Book Record**. Sidebar form appears.
2. Fill in: Title = `Demo Book`, Author = `Demo Author`, ISBN = `9999999999`, Category = `Fiction`.
3. Click **Add Book**. Success toast. New book appears with status **Available** (green badge).

### Step 3 — Librarian Edits the Book (30 sec)

1. Click **Edit** on the Demo Book row.
2. Change Title to `Demo Book — Updated`. Click **Update Book**. Updated title appears in table.

### Step 4 — Login as Member (30 sec)

1. Click **Sign Out**. Click **member1**, then **Sign In**.
2. Header shows: *Signed in as: **member1** (MEMBER)*.
3. Confirm: No "Add Book Record" button. No Edit/Delete buttons in any row.

### Step 5 — Member Borrows a Book (1 min)

1. Find **Demo Book — Updated** (Available). Click **Borrow**.
2. Status badge changes to **Borrowed** (amber). Row shows borrower name and due date (+14 days).
3. **Return** button appears for this row. **Borrow** button disappears.

### Step 6 — Ownership Check (1 min)

1. Log out. Log in as **member2**.
2. Find Demo Book — Updated (Borrowed). Confirm: No Return button. **Reserve** button appears.
3. Optionally demonstrate the API directly: POST to `/api/books/<id>/return` with member2's token returns **403 Access denied. You can only return books you borrowed.**

### Step 7 — Member2 Reserves the Book (30 sec)

1. While logged in as member2, click **Reserve** on the borrowed Demo Book.
2. Success toast. Reserve button disappears. Status cell shows: *Reserved by: member2*.

### Step 8 — Librarian Manages Reservation (1 min)

1. Log out. Log in as **librarian1**.
2. Scroll to **Active Reservations Queue**.
3. Reservation for Demo Book / member2 shows with status **Pending**.
4. Click **Fulfill**. Status changes to **Fulfilled**.

### Step 9 — Member Returns the Book (30 sec)

1. Log out. Log in as **member1**.
2. Find Demo Book — Updated (Borrowed). Click **Return**. Status resets to **Available** (green).

### Step 10 — Search and Filter (1 min)

1. Type `Demo` in the search box. Only Demo Book appears.
2. Clear search. Select **Dystopian** in category filter — shows only *1984*.
3. Select **Borrowed** in the status filter — confirm only borrowed books show.

### Step 11 — Librarian Deletes the Book (30 sec)

1. Log out. Log in as **librarian1**. Click **Delete** on Demo Book — Updated. Confirm. Book removed.
2. To demonstrate delete protection: borrow a book first — the Delete button is greyed out and disabled. A direct API call would return **400 Cannot delete a book that is currently borrowed.**

### Step 12 — Run Automated Tests (1 min)

```bash
cd backend
npm test
```

Expected output:
```
--- STARTING AUTOMATED BACKEND INTEGRATION TESTS ---
1. Seeding temporary test records into MySQL...
Temporary users created. Librarian ID: ..., Member 1 ID: ..., Member 2 ID: ...
2. Testing auth login endpoint...
3. Testing role permissions & spoofing protections...
4. Testing editing book records...
5. Testing search & filtering parameters...
6. Testing borrow and return workflow...
7. Testing reservations workflow...
8. Testing deleting book records...
--- ALL INTEGRATION TESTS PASSED SUCCESSFULLY! ---
9. Cleaning up test records from database...
Cleanup completed.
```

---

## 16. Suggested Viva Questions

### Architecture and setup

1. Why are the frontend and backend in separate directories with separate `package.json` files? What would break if you moved them into one?
2. What does `npm run db:setup` actually do, step by step? What happens if you run it twice?
3. Why is `INSERT IGNORE` used in the seed section of `schema.sql`? What alternative could you use?
4. What is the `db.js` fallback database name? Does it match what `schema.sql` creates? What happens if a developer forgets to create the `.env` file?
5. Explain `waitForConnections`, `connectionLimit`, and `queueLimit` in the connection pool. Why is a pool better than a single connection?

### Login and sessions

6. How does the login system work if there is no password column in the `users` table?
7. Where is the session token stored after login — on the server and on the client? What are the security trade-offs of each choice?
8. Why does `requireAuth` re-query the `users` table on every request instead of just trusting the token payload?
9. What happened to sessions when the server restarted in the mid-project version? How was this fixed in the final version?
10. What would you add to the login system to make it production-grade?

### Role enforcement

11. What HTTP status code does a non-librarian receive when they try to add a book? Which middleware returns it?
12. Can a member borrow a book on behalf of another member? Where in the code does that enforcement happen?
13. Can a librarian borrow a book? Show me the exact line that prevents this.
14. Who can return a book? Where is the ownership check and what does it compare?
15. Is the role enforcement in React's UI sufficient on its own? Why or why not?

### Database and persistence

16. What are the four fields that get updated in the `books` table when a member borrows a book? What are they reset to when the book is returned?
17. What does the `ENUM('Available','Borrowed','Unavailable')` constraint do at the database level? What happens if you insert a value not in the enum?
18. What is the purpose of the `reservations` table? What are the possible status values and when does each apply?
19. The `borrowedMemberId` column has `ON DELETE SET NULL`. What does that mean? Give a scenario where it activates.
20. How would you add a `password_hash` column to the `users` table without losing existing data?

### Validation and error handling

21. What validation does the backend perform when a librarian submits the Add Book form? List every check.
22. If a librarian edits a book and sets `availabilityStatus` to "Borrowed" without setting the borrower — what happens in the database? Is this a problem?
23. Why is there no 404 returned from `PUT /api/books/:id` when the book ID does not exist?
24. The search query uses SQL `LIKE ?` with `%` wildcards. What happens if a user types `%` as their search term? Is that a problem?
25. What additional validation would you add to the ISBN field?

### Testing

26. How does `test.js` prevent test data from polluting the production seed data?
27. The test suite uses Node's built-in `assert` module. What test framework would you use instead for a larger project, and why?
28. The tests require the Express server to be running. What is the downside of this approach compared to unit tests?
29. Name three cases that the automated test suite does NOT cover. How would you add them?
30. What does the `finally` block in `test.js` do? What would happen to the database if you removed it and a test failed halfway through?

### Security

31. What does Helmet.js add to an Express application? Name two specific HTTP headers it sets.
32. The CORS middleware is configured as `app.use(cors())` with no options. What does this allow, and what should it be restricted to?
33. Why is storing a session token in `localStorage` less secure than storing it in an `HttpOnly` cookie?
34. What is a brute-force attack on a login endpoint and why is the current `/api/auth/login` route vulnerable to it?
35. The `.env` file is committed to the repository. What is the risk, and how would you prevent it?

### Design and trade-offs

36. `App.jsx` is 717 lines with all state, logic, and JSX in one component. How would you refactor it?
37. The category filter dropdown is hard-coded in React. What would be a better approach?
38. `GET /api/books` is a public endpoint that shows who borrowed each book. Is that appropriate for a library system? What would you change?
39. Fulfilling a reservation marks it as Fulfilled but does not update the book's `borrowedMemberId`. Is this a functional gap? How would you fix it?
40. If this prototype needed to handle 10,000 books, what changes would be needed to the `/api/books` route and the frontend?
