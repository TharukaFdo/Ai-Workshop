# Final Evidence-Based Review — Library Lending System (p3)

**Review date:** 2026-07-16
**Reviewer:** Antigravity AI (automated code review — evidence-based, read-only inspection)
**Case:** Library Lending System — Roles: Librarian / Member — Main entity: Book
**Source inspected:** All files under `backend/` and `frontend/src/`, plus `package.json`, `docs/TEST_PLAN.md`, `REQUIREMENTS.md`, `MID_REVIEW.md`, `README.md`, `backend/.env`, and `backend/.env.example`

---

## 1. Final Feature Summary

The Library Lending System prototype is **complete and functional** for its declared workshop scope. All five functional requirements from `REQUIREMENTS.md` are implemented, database-backed, and protected at the backend API level. The three major gaps identified in the Mid Review — no automated tests, no `TOKEN_SECRET` in `.env`, and the inconsistent "borrowed" state via the edit form — have been partially addressed in the final stage:

| Item | Mid-Review status | Final status |
|---|---|---|
| Automated test suite | Missing | **Implemented** — `scripts/runTests.js`, 14+ assertions |
| `TOKEN_SECRET` in `.env` | FAIL — absent | **Still absent** — falls back to hardcoded string |
| Edit form creating inconsistent borrow state | FAIL | **Mitigated** — backend now rejects PUT with status=borrowed if book was not already borrowed |
| CORS wide-open | Issue | **Unchanged** — `app.use(cors())` with no restrictions |
| Reservation workflow (secondary feature) | Not in mid-review scope | **Added** — Member reserve, Librarian fulfill/cancel |
| `docs/TEST_PLAN.md` | Not in mid-review | **Added** — full written test plan |

The system handles: book catalog CRUD (librarian-only), borrow/return lending workflow with ownership enforcement, a reservation system, search/filter, real database-backed login, and HMAC-signed role tokens re-validated against the database on every request.

---

## 2. Review Scoring Matrix

Score meaning: 0 = missing · 1 = present but mostly broken · 2 = partially working with major gaps · 3 = mostly working with important gaps · 4 = working with minor gaps · 5 = complete for scope

| Feature / Area | Functionality 0-5 | Data Persistence 0-5 | Backend Security / Role Control 0-5 | Validation / Error Handling 0-5 | Testing Evidence 0-5 | Maintainability 0-5 | UI / Manual Usability 0-5 | Evidence | Notes |
|---|---:|---:|---:|---:|---:|---:|---:|---|---|
| Project setup and run commands | 5 | — | — | — | 4 | 3 | — | Root `package.json`: `install:all`, `db:setup`, `start`, `test` via `concurrently` | README still says create DB manually; actual setup creates it automatically — mismatch persists |
| Database setup and starter data | 5 | 5 | — | — | 5 | 4 | — | `scripts/dbSetup.js` creates DB+tables idempotently, seeds 3 users and 4 books with hashed passwords | Test suite verifies DB connection as test 1 |
| Login workflow | 5 | 5 | 4 | 4 | 5 | 4 | 5 | `POST /api/auth/login` queries `app_users`, compares SHA-256 hash, issues HMAC-signed token; tests 2–4 validate all login cases | TOKEN_SECRET not in `.env`; falls back to hardcoded string; no `/logout` endpoint |
| Role-based access | 5 | — | 5 | 4 | 5 | 4 | 5 | `authenticate` re-fetches DB row; `requireLibrarian`/`requireMember` on all routes; test 8 asserts member gets 403 on POST /api/books | DB role always authoritative; token role claim cannot be forged without HMAC key |
| Main create action | 5 | 5 | 5 | 4 | 5 | 4 | 5 | `POST /api/books` guarded by `requireLibrarian`; tests 5, 6, 7 validate create, missing-field rejection, bad-status rejection | No ISBN format/length check; raw DB error shown on duplicate ISBN |
| Main view/list action | 5 | 5 | 4 | 4 | 4 | 4 | 5 | `GET /api/books` requires `authenticate`; returns all fields; search test (test 9) validates filter | Both roles can browse — correct per spec |
| Main update/status/cancel action | 5 | 5 | 5 | 4 | 4 | 4 | 5 | `PUT /api/books/:id` with `requireLibrarian`; test 7b confirms direct status=borrowed transition is rejected | Edit form still shows "borrowed" option in dropdown — blocked at backend only |
| Protected action | 5 | 5 | 5 | 5 | 5 | 4 | 5 | `POST`, `PUT`, `DELETE /api/books` require `authenticate`+`requireLibrarian`; test 8 confirms 403; test 12 confirms 400/403 on cross-user return | Every protected route covered by at least one automated assertion |
| Secondary feature | 5 | 5 | 4 | 3 | 4 | 4 | 5 | `GET /api/books?title=&category=&availabilityStatus=`; parameterised LIKE for title; test 9 validates; UI filter bar wired for both roles | Category filter is exact-case; no sanitisation beyond parameterised query |
| Case-specific: book catalog fields and availability status | 5 | 5 | — | 4 | 5 | 4 | 4 | `books` table: `title`, `author`, `isbn`, `category`, `availabilityStatus` ENUM, `borrowedMember` FK, `borrowedDate`, `returnDate`, plus reservation columns; all rendered in UI | Librarian table shows raw `borrowedMember` integer not username; `borrowedDate` is DATE not DATETIME |
| Case-specific: borrow and return lending workflow | 5 | 5 | 5 | 5 | 5 | 5 | 4 | `POST /api/books/:id/borrow` — `requireMember`, DB transaction with `FOR UPDATE`, 14-day window; `returnBook` enforces FK ownership; tests 10, 11, 12, 13, 14 cover full workflow | Test 12f assumes member2 has fixed ID 3 — brittle if seed order changes |
| Case-specific: librarian-only book management and member borrowing ownership | 5 | 5 | 5 | 5 | 5 | 4 | 4 | Librarian add/edit/delete protected at route level; borrow uses `req.user.id` from DB-backed token; return checks `book.borrowedMember !== Number(memberId)`; tests 8 + 12 prove both constraints | UI also hides controls from members but server remains the authority |
| UI/manual usability | 4 | — | — | 3 | 3 | 3 | 4 | Dark-mode Outfit-font SPA; login page with demo credentials; librarian side-by-side table+form; member card grid; status badges; live filter; `docs/TEST_PLAN.md` has 9 manual check steps | No pagination; member ID not resolved to username; no button loading state |
| Security posture | 3 | — | 3 | — | 3 | 2 | — | Parameterised queries; SHA-256 password hashing; HMAC-signed token; DB role re-validation per request; ownership check on return | TOKEN_SECRET falls back to hardcoded string; CORS wide-open; no helmet; no rate limiting; some 500 blocks expose `error.message` |
| Testing evidence | 5 | 4 | 5 | 4 | 5 | 4 | — | `scripts/runTests.js` — 14+ API integration tests; self-cleaning (test book deleted at end); `npm test` wired; `docs/TEST_PLAN.md` documents all scenarios and manual steps | No isolated unit tests for service methods; no test framework (custom `assert` helper); test 12f hardcodes member2 ID |
| Maintainability | 4 | — | — | — | 4 | 4 | — | Concerns separated: `config/` / `middleware/` / `routes/` / `services/` / `utils/`; JSDoc on all service methods and middleware; `.env.example` present | Entire frontend in one 719-line `App.jsx`; no component split; no shared API client; README partially outdated; no `.gitignore` |

---

## 3. Project Structure and Run Commands

```
p3/
├── backend/
│   ├── config/
│   │   └── db.js               # mysql2/promise pool — reads all env vars
│   ├── middleware/
│   │   └── auth.js             # authenticate, requireLibrarian, requireMember
│   ├── routes/
│   │   ├── auth.js             # POST /api/auth/login
│   │   └── books.js            # Full CRUD + borrow/return/reserve routes
│   ├── scripts/
│   │   ├── dbSetup.js          # Create DB, tables, seed data
│   │   └── runTests.js         # 14+ API integration tests (self-cleaning)
│   ├── services/
│   │   └── bookService.js      # All DB queries and business logic (315 lines)
│   ├── utils/
│   │   └── hash.js             # SHA-256 hashPassword helper
│   ├── server.js               # Express entry point, mounts routes
│   ├── .env                    # Local credentials (NOT committed — no .gitignore)
│   ├── .env.example            # Credential template
│   └── package.json            # express, mysql2, cors, dotenv, nodemon
├── frontend/
│   ├── src/
│   │   ├── App.jsx             # Single-component SPA (719 lines)
│   │   ├── index.css           # Design system — dark mode, Outfit font, tokens
│   │   └── main.jsx            # Vite/React mount point
│   ├── index.html
│   ├── vite.config.js          # Vite proxy: /api → http://localhost:5000
│   └── package.json            # react, react-dom, vite
├── docs/
│   └── TEST_PLAN.md            # Written test plan and manual UI checks
├── Case_Brief.md
├── MID_REVIEW.md
├── PROJECT_CONTEXT.md
├── README.md
├── REQUIREMENTS.md
└── package.json                # Root scripts: install:all, db:setup, start, test
```

### Run Commands

| Purpose | Command |
|---|---|
| Install all dependencies | `npm run install:all` (from root) |
| Create tables + seed data | `npm run db:setup` (from root) |
| Start both servers | `npm run start` (from root) |
| Run automated tests | `npm test` (from root; backend must be running first) |

- Frontend: `http://localhost:3000`
- Backend API: `http://localhost:5000`

---

## 4. Frontend/Backend Separation Check

**React and Express are fully separated.**

| Check | Result |
|---|---|
| React (`frontend/`) and Express (`backend/`) are in separate directories | PASS |
| No shared `node_modules` or shared source code | PASS |
| `mysql2` appears only in `backend/package.json` | PASS |
| React uses `fetch('/api/...')` via Vite dev proxy to `http://localhost:5000` | PASS |
| Vite proxy (`vite.config.js` line 9) forwards `/api` requests to Express | PASS |
| No MySQL connection string or credentials anywhere in `frontend/src/` | PASS |
| Frontend never connects to MySQL directly | **CONFIRMED** |

The Vite proxy is the only bridge. React never imports `mysql2`. DB credentials exist solely on the server side.

---

## 5. Database Setup and Table Summary

### Connection Method

`backend/config/db.js` creates a `mysql2/promise` connection pool. All five required environment variables are read:

| Variable | Configured | Default fallback in code |
|---|---|---|
| `DB_HOST` | Yes — in `.env` as `localhost` | `'127.0.0.1'` |
| `DB_PORT` | Yes — in `.env` as `3306` | `3306` |
| `DB_USER` | Yes — in `.env` as `root` | `'root'` |
| `DB_PASSWORD` | Yes — key present in `.env` (value not printed) | *(none)* |
| `DB_NAME` | Yes — in `.env` as `c6p3` | `'library_lending_db'` |

**Note:** `TOKEN_SECRET` is **NOT** in `.env`. Both `routes/auth.js` and `middleware/auth.js` fall back to the hardcoded string `'library_secret_key_12345'` — see Section 12.

### Tables Used

| Table | Purpose |
|---|---|
| `app_users` | Login credentials and roles — **this is the users/login table** |
| `books` | Book catalog, availability state, lending state, and reservation state |

A users/login table **exists** as `app_users`.

### app_users Schema

| Column | Type | Notes |
|---|---|---|
| `id` | INT AUTO_INCREMENT PK | — |
| `username` | VARCHAR(50) UNIQUE NOT NULL | — |
| `password` | VARCHAR(255) NOT NULL | SHA-256 hex — not bcrypt |
| `role` | ENUM('Librarian','Member') NOT NULL | — |
| `created_at` | TIMESTAMP DEFAULT CURRENT_TIMESTAMP | — |

### books Schema

| Column | Type | Notes |
|---|---|---|
| `id` | INT AUTO_INCREMENT PK | — |
| `title` | VARCHAR(255) NOT NULL | — |
| `author` | VARCHAR(255) NOT NULL | — |
| `isbn` | VARCHAR(20) UNIQUE NOT NULL | — |
| `category` | VARCHAR(100) NOT NULL | — |
| `availabilityStatus` | ENUM('available','borrowed','unavailable') | DEFAULT 'available' |
| `borrowedMember` | INT FK → `app_users(id)` ON DELETE SET NULL | NULL when not borrowed |
| `borrowedDate` | DATE DEFAULT NULL | Set on borrow |
| `returnDate` | DATE DEFAULT NULL | Set to borrow date + 14 days |
| `reservedMember` | INT FK → `app_users(id)` ON DELETE SET NULL | Added in Stage 11 |
| `reservationStatus` | ENUM('pending','fulfilled','cancelled') DEFAULT NULL | Added in Stage 11 |
| `createdAt` | TIMESTAMP DEFAULT CURRENT_TIMESTAMP | — |
| `updatedAt` | TIMESTAMP ON UPDATE CURRENT_TIMESTAMP | — |

### Recreating from Scratch

Run `npm run db:setup` from the project root. The script:
1. Creates the database if it does not exist using `DB_NAME` from `.env`.
2. Creates both tables with `CREATE TABLE IF NOT EXISTS` (idempotent).
3. Runs an ALTER TABLE migration block to add reservation columns to existing schemas.
4. Seeds 3 users (`librarian1`, `member1`, `member2`) with `ON DUPLICATE KEY UPDATE` — safe to re-run.
5. Seeds 4 books (2 available, 1 borrowed by member1, 1 unavailable) with `ON DUPLICATE KEY UPDATE isbn=isbn`.

---

## 6. Login and Role/Access Explanation

### How the Two Roles Log In

1. User submits username and password to `POST /api/auth/login`.
2. Backend hashes the submitted password with SHA-256 (`utils/hash.js`).
3. Queries `SELECT id, username, role FROM app_users WHERE username = ? AND password = ?`.
4. On match, generates a custom HMAC-signed token: `userId.role.hmac_sha256_hex`.
5. Returns token and user object `{id, username, role}` as JSON.
6. React stores both in `localStorage` (`lib_token`, `lib_user`).
7. All subsequent `fetch` calls include `Authorization: Bearer <token>`.

**Seed credentials:** All three accounts use password `password123`.

### How Roles Are Checked

Every protected route passes through two middleware layers:

1. **`authenticate`** (`middleware/auth.js`): Extracts Bearer token, verifies HMAC signature using `TOKEN_SECRET`, re-queries `app_users` by `id` to get the fresh DB role, sets `req.user`.
2. **`requireLibrarian`** or **`requireMember`**: Checks `req.user.role` and returns `403` on mismatch.

The DB role is always authoritative. A forged token claiming a different role still uses the real DB role (after passing HMAC verification).

### Route Access Matrix

| Route | Middleware | Librarian | Member | Unauthenticated |
|---|---|---|---|---|
| `GET /api/books` | `authenticate` | 200 | 200 | 401 |
| `GET /api/books/:id` | `authenticate` | 200 | 200 | 401 |
| `POST /api/books` | `authenticate` + `requireLibrarian` | 201 | **403** | 401 |
| `PUT /api/books/:id` | `authenticate` + `requireLibrarian` | 200 | **403** | 401 |
| `DELETE /api/books/:id` | `authenticate` + `requireLibrarian` | 200 | **403** | 401 |
| `POST /api/books/:id/borrow` | `authenticate` + `requireMember` | **403** | 200 | 401 |
| `POST /api/books/:id/return` | `authenticate` + `requireMember` | **403** | 200 / 400 | 401 |
| `POST /api/books/:id/reserve` | `authenticate` + `requireMember` | **403** | 200 | 401 |
| `POST /api/books/:id/reservation/fulfill` | `authenticate` + `requireLibrarian` | 200 | **403** | 401 |
| `POST /api/books/:id/reservation/cancel` | `authenticate` + `requireLibrarian` | 200 | **403** | 401 |

---

## 7. Protected Action Explanation

### Librarian-Only Book Management

The three protected Librarian actions are **Add Book**, **Edit Book**, and **Remove Book**.

All three are guarded identically in `routes/books.js`:
- `POST /api/books` (line 38): `authenticate, requireLibrarian`
- `PUT /api/books/:id` (line 51): `authenticate, requireLibrarian`
- `DELETE /api/books/:id` (line 64): `authenticate, requireLibrarian`

A Member sending any of these receives `403 Access Denied: Librarian role required.` — the route handler never executes. Proven by automated test 8.

**Additional guard on DELETE:** `BookService.deleteBook` checks `book.availabilityStatus === 'borrowed'` and throws before running the DELETE query, preventing orphaned lending records.

### Member Borrowing Ownership

- `POST /api/books/:id/borrow` uses `req.user.id` (from DB — not from request body). The client cannot inject a different member ID.
- `POST /api/books/:id/return` checks `book.borrowedMember !== Number(memberId)` and throws `'You cannot return a book borrowed by another member.'` — proven by automated test 12 (cross-user return rejected with 400).

---

## 8. Validation Summary

### Backend Validation (bookService.js)

| Rule | Status | Location |
|---|---|---|
| Title, Author, ISBN, Category required on create | ✅ | `createBook` line 49 |
| `availabilityStatus` must be valid ENUM on create | ✅ | `createBook` line 54 |
| Required fields cannot be emptied on update | ✅ | `updateBook` line 86 |
| `availabilityStatus` must be valid ENUM on update | ✅ | `updateBook` line 76 |
| Cannot manually set status to `borrowed` via edit (unless already borrowed) | ✅ | `updateBook` lines 90–92 |
| Book must exist before update/delete | ✅ | `updateBook` line 74, `deleteBook` line 117 |
| Cannot delete a currently borrowed book | ✅ | `deleteBook` lines 119–121 |
| Book must be `available` before borrowing | ✅ | `borrowBook` line 143 |
| Member can only return their own borrowed book | ✅ | `returnBook` line 186 |
| Only `borrowed` books can be reserved | ✅ | `reserveBook` line 218 |
| At most one pending reservation per book | ✅ | `reserveBook` line 221 |
| Member cannot reserve their own borrowed book | ✅ | `reserveBook` line 224 |
| Username and password required for login | ✅ | `routes/auth.js` line 17 |

### Frontend Validation (App.jsx)

| Rule | Status |
|---|---|
| Login: username and password both required (JS + HTML `required`) | ✅ |
| Add/Edit form: all four fields required (JS check + HTML `required`) | ✅ |

### Gaps

- No ISBN format validation (length, check-digit) — DB UNIQUE prevents duplicates but not malformed values.
- No maximum-length validation at the application layer beyond DB column limits.
- Category filter is exact-case match (`WHERE category = ?`).
- Some `catch` blocks return `error.message` in 500 responses — potential information leakage.

---

## 9. Automated and Manual Testing Summary

### Automated Tests

**Command:** `npm test` (from root) → `node backend/scripts/runTests.js`
**Prerequisite:** Backend must be running.

The test script makes real HTTP calls against the live server. It uses a custom inline `assert()` helper and prints `[PASS]` / `[FAIL]` per case.

| Test # | What it checks | Expected |
|---|---|---|
| 1 | DB health check | 200, DB=Connected |
| 2 | Member login success | 200, token returned |
| 3 | Librarian login success | 200, token returned |
| 4 | Bad password rejected | 401 |
| 5 | Librarian can create book | 201, id returned |
| 6 | Missing title rejected | 400 |
| 7 | Invalid status value rejected | 400 |
| 7b | Direct status=borrowed via PUT blocked | 400 |
| 8 | Member blocked from creating book | 403 |
| 9 | Search by title filter | 200, test book found |
| 10 | Member can borrow available book | 200, status=borrowed |
| 11 | Double borrow prevented | 409 |
| 12b | Member can reserve borrowed book | 200, pending |
| 12c | Double reservation blocked | 400 |
| 12d | Librarian cancels reservation | 200, null |
| 12f | Librarian fulfills reservation | 200, borrowed |
| 12 | Cross-user return blocked | 400 or 403 |
| 13 | Member can return own book | 200, available |
| 14 | Test book cleaned up (DELETE) | 200 |

**Test cleanup:** The test book (timestamped ISBN `TST-{Date.now()}`) is deleted at the end of the run. No permanent test data is left in the database.

**Coverage:** All required automated checks from `REQUIREMENTS.md` Section 6.1 are covered. The suite also covers the Stage 11 reservation workflow.

### What Was Not Automated

- No isolated unit tests for individual `BookService` methods.
- No test for a valid PUT (update with correct fields) returning a correct response body.
- No test for DELETE of a borrowed book returning an error.
- No frontend test coverage (no Playwright, Cypress, or React Testing Library).
- Manual UI checks are documented in `docs/TEST_PLAN.md` Section 3 (9 scenarios) but are not automated.

---

## 10. Stage 11 Change Summary

Stage 11 introduced the **Reservation Workflow**. The following was added after the Mid Review:

### Backend
- Three new service methods: `reserveBook`, `fulfillReservation`, `cancelReservation` in `bookService.js`.
- Three new routes in `routes/books.js`: `POST /api/books/:id/reserve` (Member only), `POST /api/books/:id/reservation/fulfill` (Librarian only), `POST /api/books/:id/reservation/cancel` (Librarian only).

### Database
- `books` table gained two new columns: `reservedMember INT FK` and `reservationStatus ENUM`.
- `dbSetup.js` includes an ALTER TABLE migration block so re-running `db:setup` safely adds columns to an existing schema.

### Frontend
- Member card: "Reserve Book" button shown when book is borrowed by someone else with no active reservation.
- Reservation indicator shows who reserved and distinguishes "Your reservation" from others.
- Librarian table: "Reserved (Member X)" cell with Fulfill/Cancel buttons for pending reservations.

### Documentation and Testing
- `docs/TEST_PLAN.md` added as a new file.
- `scripts/runTests.js` added from scratch with 14+ assertions; tests 12b–12f cover the full reservation cycle.
- Also added in this stage: backend guard that prevents manually setting `availabilityStatus=borrowed` via the edit PUT route (`updateBook` lines 90–92).

---

## 11. Stage Drift / Early Work

| Item | Verdict | Detail |
|---|---|---|
| `FOR UPDATE` DB transaction lock in borrow/return/reserve | Slightly ahead but necessary | Required for correct concurrency; prevents double-borrow at data level |
| HMAC-signed token + DB role re-validation | Slightly ahead but necessary | Required for borrow-ownership enforcement to work correctly |
| JSDoc on all service and middleware functions | Maintainability stage — harmless | Present from early stages |
| `ON DUPLICATE KEY UPDATE` idempotent seed | Good practice — in scope | Present from the beginning |
| Reservation workflow | Added at correct final stage | Not present in Mid Review |
| No helmet / rate limiting / strict CORS | Expected gap | Security hardening deferred — still absent in final |
| No `.gitignore` | Persistent gap | Should have been added in any stage |

No features from beyond the declared scope were prematurely implemented.

---

## 12. Security Risks and Exposed-Secret Check

| Risk | Severity | Detail |
|---|---|---|
| `TOKEN_SECRET` not in `.env` | **High** | Both `routes/auth.js` (line 7) and `middleware/auth.js` (line 4) fall back to a hardcoded literal. Anyone who knows the fallback can forge valid HMAC tokens. The `.env` file does not include this key. |
| No `.gitignore` | **High** | The actual `backend/.env` file (with real DB credentials) is on disk. A `git init && git add .` would commit it. The password value was **not printed** in this review. |
| CORS wide-open | **Medium** | `app.use(cors())` in `server.js` allows any origin. Must be restricted before deployment. |
| SHA-256 password hashing (not bcrypt) | **Medium** | SHA-256 is fast — susceptible to brute-force and rainbow-table attacks. Acceptable for a workshop prototype only. |
| `error.message` in 500 responses | **Low** | Several `catch` blocks return the raw error message. DB column names or file paths could leak in production. |
| No rate limiting | **Low** | No `express-rate-limit` on login or API endpoints. Acceptable for local scope. |
| No helmet | **Low** | No HTTP security headers. Acceptable for a local prototype. |

**DB password confirmation:** The `DB_PASSWORD` key is present in `backend/.env`. Its value was **not printed in this review**. The `backend/.env.example` uses the placeholder `your_password_here` — safe to commit.

---

## 13. Documentation / Code Mismatches

| Document | Claim | Code Reality | Severity |
|---|---|---|---|
| `README.md` Step 1 | "Open MySQL CLI and run `CREATE DATABASE library_lending_db;`" | `scripts/dbSetup.js` creates the DB automatically using `DB_NAME` from `.env` (value: `c6p3`). No manual step needed. | Medium — confusing for a new developer |
| `README.md` structure diagram | Does not list `middleware/`, `scripts/`, `services/`, `utils/`, or `docs/` directories | All four backend subdirectories and `docs/` exist and contain production code | Low — outdated diagram |
| `REQUIREMENTS.md` Section 5 | Member returns another's book → `403 Forbidden` | `bookService.js` throws a plain Error caught as `400 Bad Request`. Test 12 accepts 400 or 403. | Low — spec says 403, implementation returns 400 |
| `docs/TEST_PLAN.md` Step 8 | "Badge updated with Reserved by Member 3" | member2 ID is 3 only if seed ran in default insertion order. Hardcoded ID is brittle. | Low — documentation is fragile |
| `.env.example` | `DB_NAME=library_lending_db` | Actual `.env`: `DB_NAME=c6p3`. Default fallback in `dbSetup.js` also says `c6p3`. | Low — discrepancy between example and actual |

---

## 14. Known Limitations

1. **`TOKEN_SECRET` absent from `.env`** — All tokens are signed with the hardcoded fallback key.
2. **No `.gitignore`** — The live `.env` file with real credentials could be accidentally committed to version control.
3. **SHA-256 password hashing** — Not bcrypt; vulnerable to offline brute-force. Prototype only.
4. **CORS unrestricted** — Any web page can make credentialed API calls to the backend.
5. **No logout endpoint** — Token invalidation is client-side only. A stolen token is valid indefinitely.
6. **`borrowedDate` is `DATE` not `DATETIME`** — Exact borrow timestamp is silently truncated by MySQL.
7. **Librarian table shows raw `borrowedMember` integer** — Username is not resolved; no JOIN to `app_users`.
8. **Test 12f hardcodes member2 ID as `3`** — If seed order or auto-increment changes, this assertion produces a false negative.
9. **No ISBN format validation** — Any string is accepted as an ISBN.
10. **No pagination** — Catalog loads all records in a single query; degrades with a large dataset.
11. **Single `App.jsx` (719 lines)** — All UI, state, and fetch logic in one file; difficult to extend without refactoring.
12. **No React error boundary** — An uncaught render error shows a blank screen.
13. **No production build tested** — The Vite dev proxy does not apply in a built bundle without a reverse proxy.

---

## 15. Demo Script

**Pre-conditions:** `npm run db:setup` has been run; `npm run start` is running; open `http://localhost:3000`.

### Scene 1 — Login Gate
1. Observe the login page — no catalog is visible without logging in.
2. Enter an incorrect password → see the red "Invalid username or password" alert.

### Scene 2 — Librarian Workflow
3. Log in as `librarian1` / `password123`.
4. Header shows "Logged in as librarian1 (Librarian)". DB badge shows "Connected".
5. Submit Add New Book form with the Title field empty → see validation alert.
6. Fill all fields (e.g., Title: *The Pragmatic Programmer*, Author: *Dave Thomas*, ISBN: *9780135957059*, Category: *Technology*) → click **Create Record** → book appears in the table.
7. Click **Edit** on the new book → change the author → click **Save Changes** → table updates.
8. Locate "1984" (borrowed) in the table → observe Member ID and due date in the Lending State column.
9. Click **Delete** on the test book → confirm dialog → book removed.

### Scene 3 — Member Workflow
10. Log out → log in as `member1` / `password123`.
11. Observe: no Add/Edit/Delete controls visible anywhere.
12. Type "1984" in the search bar → only that book appears.
13. Select "Available" in the status filter → only available books shown.
14. Click **Borrow Book** on The Great Gatsby → badge changes to orange "borrowed"; button changes to red "Return Book".
15. Log out → log in as `member2` → locate The Great Gatsby → click **Reserve Book** → reservation indicator appears.

### Scene 4 — Reservation & Librarian Management
16. Log out → log in as `librarian1` → locate The Great Gatsby in inventory → observe "Reserved (Member X)" with Fulfill/Cancel buttons.
17. Click **Fulfill** → book is transferred to member2's account.

### Scene 5 — Security Check (via curl or Postman)
18. `POST http://localhost:5000/api/books` with member1 Bearer token → `403 Forbidden`.
19. `POST http://localhost:5000/api/books/1/return` with member2 token (book borrowed by member1) → `400 Bad Request`.

---

## 16. Suggested Viva Questions

### Architecture & Separation
1. Why does React use `/api` instead of `http://localhost:5000` directly? What configures that?
2. What happens to the Vite proxy when you run `vite build`? How would you handle this in production?
3. Why is `mysql2` only in the backend's `package.json` and not the frontend's?

### Authentication & Token Security
4. Describe the full flow from entering a password to a protected API call succeeding.
5. The token contains the user's role. Could a Member edit the token to claim the Librarian role? Why or why not?
6. Where is `TOKEN_SECRET` used and what happens right now if it is not set in `.env`? What should you fix?
7. Why does `authenticate` middleware re-query the database on every request instead of just trusting the token's role claim?

### Role Control
8. If a Member calls `DELETE /api/books/1` directly with a valid token, what happens and which file handles it?
9. Can a Librarian borrow or return a book? Show the code that prevents it.
10. Why can't a Member set `borrowedMember` to a different user's ID when borrowing?

### Database & Persistence
11. What happens if you run `npm run db:setup` twice? Which SQL keywords make this safe?
12. The `borrowedDate` column is `DATE`, but `borrowBook()` inserts `new Date()`. What is the consequence?
13. Why is there a `FOREIGN KEY (borrowedMember) REFERENCES app_users(id) ON DELETE SET NULL` constraint?

### Validation & Business Rules
14. What stops a Librarian from saving a book record with an empty title via a direct API call?
15. What HTTP status code is returned when a book is already borrowed and another member tries to borrow it? Why that specific code?
16. What prevents a member from returning a book they didn't borrow?
17. Why does `updateBook` reject setting `availabilityStatus=borrowed` unless the book is already borrowed?

### Testing
18. How does the test suite clean up after itself? Is any test data left in the database after `npm test`?
19. Why does test 12f hardcode the value `3` for member2's ID? How would you make it more robust?
20. The test runner uses `node scripts/runTests.js` without a test framework. What is the tradeoff compared to using Jest or Mocha?

### Security & Known Gaps
21. Is the `.env` file safe to commit to GitHub? What is missing that would prevent an accidental commit?
22. SHA-256 is used for password hashing. Why is bcrypt preferred in production systems?
23. What does `app.use(cors())` do, and what security risk does leaving it unrestricted create?
24. There is no `/api/auth/logout` endpoint. What are the implications of client-side-only logout?
