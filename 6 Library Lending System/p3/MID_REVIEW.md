# Mid-Project Review — Library Lending System (p3)

**Review date:** 2026-07-16
**Stage reviewed:** After secondary feature (search/filter) — before testing, security hardening, and maintainability cleanup
**Reviewer:** Antigravity AI (automated code review)
**Case:** Library Lending System — Roles: Librarian / Member — Main entity: Book

---

## 1. Mid-Review Summary

The project is substantially complete for its current stage. Both the React frontend and the Express/MySQL backend exist and are separated correctly. The full book-management CRUD workflow (add, edit, delete) is implemented and protected to Librarians only at the backend level. The borrow/return lending workflow is implemented with ownership enforcement: a member can only return their own borrowed book. Search and filter by title, category, and availability status are fully wired from the UI through the API to the database query. A repeatable database setup command (`npm run db:setup`) creates and seeds both required tables. Login is fully database-backed with SHA-256 hashed passwords and a custom HMAC-signed token; the auth middleware re-validates the user role from the database on every protected request.

Notable gaps before the next stages: no test files exist at all; the TOKEN_SECRET falls back to a hardcoded string if the env var is absent; CORS is wide-open; there is no rate limiting or helmet; the README setup instructions are partially mismatched from the actual `db:setup` script; the librarian inventory table shows raw member IDs instead of usernames; and there is no `/logout` endpoint (client-side only).

---

## 2. Review Scoring Matrix

Score meaning: 0 = missing · 1 = present but mostly not working · 2 = partially working with major gaps · 3 = mostly working with important gaps · 4 = working with minor gaps · 5 = complete for scope

| Feature / Area | Functionality 0-5 | Data Persistence 0-5 | Backend Security / Role Control 0-5 | Validation / Error Handling 0-5 | Testing Evidence 0-5 | Maintainability 0-5 | UI / Manual Usability 0-5 | Evidence | Notes |
|---|---:|---:|---:|---:|---:|---:|---:|---|---|
| Project setup and run commands | 4 | — | — | — | 0 | 3 | — | `package.json`: `install:all`, `db:setup`, `start` via `concurrently` | README step 1 says to create DB manually; `db:setup` creates it automatically — mismatch |
| Database setup and starter data | 5 | 5 | — | — | 0 | 4 | — | `scripts/dbSetup.js` creates DB if missing, creates `app_users` + `books`, seeds 3 users and 4 books with `ON DUPLICATE KEY UPDATE` | Idempotent; passwords hashed at seed time |
| Login workflow | 5 | 5 | 4 | 4 | 0 | 4 | 5 | `POST /api/auth/login` queries `app_users`, compares SHA-256 hash, issues HMAC-signed `id.role.signature` token | No `/api/auth/logout` endpoint; TOKEN_SECRET has a hardcoded fallback |
| Role-based access | 5 | — | 5 | 4 | 0 | 4 | 5 | `authenticate` re-fetches user row from DB; `requireLibrarian` / `requireMember` guards on all relevant routes; UI renders correct view per role | Role from token is never blindly trusted — DB row is always reloaded |
| Main create action | 5 | 5 | 5 | 4 | 0 | 4 | 5 | `POST /api/books` with `requireLibrarian`; `BookService.createBook` validates required fields and enum status | No ISBN uniqueness error surfaced clearly to UI (DB constraint exists but raw error shown) |
| Main view/list action | 5 | 5 | 4 | 4 | 0 | 4 | 5 | `GET /api/books` authenticated for any logged-in user; returns full catalog with lending state | Correct — both roles may view the catalog |
| Main update/status/cancel action | 5 | 5 | 5 | 4 | 0 | 4 | 5 | `PUT /api/books/:id` with `requireLibrarian`; validates fields, accepts partial update, returns updated row | Librarian can set `availabilityStatus=borrowed` without a borrower FK via edit form — data-consistency gap |
| Protected action | 5 | 5 | 5 | 4 | 0 | 4 | 5 | `POST`, `PUT`, `DELETE /api/books` all require `authenticate` + `requireLibrarian`; returns 403 to any other role | Backend enforcement confirmed in `routes/books.js` lines 38, 51, 64 |
| Secondary feature | 5 | 5 | 4 | 3 | 0 | 4 | 5 | `GET /api/books?title=&category=&availabilityStatus=` — parameterised `LIKE` for title; exact match for category/status; UI has live filter inputs for both roles | No input sanitisation beyond parameterised query; category is exact-case match |
| Case-specific: book catalog fields and availability status | 5 | 5 | — | 4 | 0 | 4 | 4 | `books` table has: `id`, `title`, `author`, `isbn`, `category`, `availabilityStatus` ENUM, `borrowedMember` FK, `borrowedDate`, `returnDate`, `createdAt`, `updatedAt` | All required fields present; librarian table shows `borrowedMember` as raw integer, not username |
| Case-specific: borrow and return lending workflow | 5 | 5 | 5 | 4 | 0 | 5 | 4 | `POST /api/books/:id/borrow` — `requireMember`; DB transaction with `FOR UPDATE` lock; 14-day return window; `returnBook` checks FK ownership before clearing | Ownership enforced; member cannot return another member's book |
| Case-specific: librarian-only book management and member borrowing ownership | 5 | 5 | 5 | 4 | 0 | 4 | 4 | Librarian add/edit/delete protected at route level. Member borrow uses `req.user.id` from DB-backed token — client cannot override borrower ID. Return checks FK ownership | UI also hides librarian controls from members — server is the authority |
| UI / manual usability | 4 | — | — | 3 | 0 | 3 | 4 | Dark-mode Outfit-font UI; login page with demo credentials; librarian table + add/edit form side-by-side; member card grid with borrow/return buttons; status badges; live filter bar | No pagination; borrowedMember shows as ID not username; no loading state on borrow/return buttons |
| Security posture | 3 | — | 3 | — | 0 | 2 | — | Parameterised queries; DB-re-validated token; ownership check on return; passwords hashed | CORS wide-open; TOKEN_SECRET fallback hardcoded; no helmet; no rate limiting |
| Testing evidence | 0 | 0 | 0 | 0 | 0 | 0 | 0 | No test files, no test runner dependency, no test scripts in any `package.json` | Health endpoint `GET /api/health` is the only built-in testability hook |
| Maintainability | 4 | — | — | — | 0 | 4 | — | Concerns separated: config / middleware / routes / services; JSDoc on all service methods and middleware; `.env.example` present | All frontend logic in one 621-line `App.jsx`; no component split; no shared API client; README partially outdated |

---

## 3. Current Feature Status

| Feature | Status | Notes |
|---|---|---|
| List all books (authenticated) | Implemented | `GET /api/books` |
| Add book (Librarian only) | Implemented | `POST /api/books` + backend guard |
| Edit book (Librarian only) | Implemented | `PUT /api/books/:id` + backend guard |
| Delete book (Librarian only) | Implemented | `DELETE /api/books/:id` + backend guard; blocks if book is borrowed |
| View single book | Implemented | `GET /api/books/:id` |
| Borrow book (Member only) | Implemented | `POST /api/books/:id/borrow` + DB transaction + 14-day window |
| Return book (Member only, own book only) | Implemented | `POST /api/books/:id/return` + ownership check |
| Search by title | Implemented | `LIKE` query on `title` |
| Filter by category | Implemented | Exact-match query on `category` |
| Filter by availability status | Implemented | Exact-match on `availabilityStatus` |
| Health/DB connectivity check | Implemented | `GET /api/health`; shown in header badge |
| Pagination | Not implemented | Out of scope for current stage |
| Logout endpoint | Not implemented | Client-side localStorage clear only |
| Member borrow history | Not implemented | Out of scope per case brief |
| Fines / overdue tracking | Not implemented | Out of scope per case brief |

---

## 4. Database and Persistence Status

**Tables created:** `app_users`, `books`
**Setup command:** `npm run db:setup` → runs `node scripts/dbSetup.js`
**Idempotent:** Yes — `CREATE TABLE IF NOT EXISTS` and `ON DUPLICATE KEY UPDATE`
**DB name in use:** `c6p3` (via `.env` DB_NAME) vs `library_lending_db` in `.env.example` and README

### `app_users` table schema

| Column | Type | Notes |
|---|---|---|
| `id` | INT AUTO_INCREMENT PK | — |
| `username` | VARCHAR(50) UNIQUE NOT NULL | — |
| `password` | VARCHAR(255) NOT NULL | SHA-256 hex hash |
| `role` | ENUM('Librarian','Member') NOT NULL | — |
| `created_at` | TIMESTAMP DEFAULT CURRENT_TIMESTAMP | — |

### `books` table schema

| Column | Type | Notes |
|---|---|---|
| `id` | INT AUTO_INCREMENT PK | — |
| `title` | VARCHAR(255) NOT NULL | — |
| `author` | VARCHAR(255) NOT NULL | — |
| `isbn` | VARCHAR(20) UNIQUE NOT NULL | — |
| `category` | VARCHAR(100) NOT NULL | — |
| `availabilityStatus` | ENUM('available','borrowed','unavailable') DEFAULT 'available' | — |
| `borrowedMember` | INT FK → `app_users(id)` ON DELETE SET NULL | NULL when not borrowed |
| `borrowedDate` | DATE DEFAULT NULL | NULL when not borrowed |
| `returnDate` | DATE DEFAULT NULL | NULL when not borrowed |
| `createdAt` | TIMESTAMP DEFAULT CURRENT_TIMESTAMP | — |
| `updatedAt` | TIMESTAMP ON UPDATE CURRENT_TIMESTAMP | — |

**Seed data:** 3 users (1 Librarian, 2 Members), 4 books (2 available, 1 borrowed by member1, 1 unavailable)

**Issues:**
- `.env` sets `DB_NAME=c6p3` but README instructs creating `library_lending_db` — not a blocker since `db:setup` creates whatever `DB_NAME` resolves to.
- `borrowedDate` is `DATE` but `borrowBook()` inserts `new Date()` (full timestamp). MySQL truncates silently to date-only; `DATETIME` would be more precise.

---

## 5. Login and Role/Access Status

**Login type:** Fully database-backed
**Password storage:** SHA-256 hex (not bcrypt — weaker, acceptable for this stage)
**Token format:** Custom HMAC-signed: `userId.role.hmac_sha256_signature`
**Token secret:** `process.env.TOKEN_SECRET` with fallback `'library_secret_key_12345'` — `.env` file does not include `TOKEN_SECRET`
**Token re-validation:** Every protected request re-queries `app_users` by ID and uses the fresh DB role — client cannot escalate via a tampered token
**Logout:** Client-side only (localStorage cleared); no server-side token invalidation

### Role enforcement matrix

| Route | Middleware | Librarian | Member | Unauthenticated |
|---|---|---|---|---|
| `GET /api/books` | `authenticate` | 200 | 200 | 401 |
| `GET /api/books/:id` | `authenticate` | 200 | 200 | 401 |
| `POST /api/books` | `authenticate` + `requireLibrarian` | 201 | 403 | 401 |
| `PUT /api/books/:id` | `authenticate` + `requireLibrarian` | 200 | 403 | 401 |
| `DELETE /api/books/:id` | `authenticate` + `requireLibrarian` | 200 | 403 | 401 |
| `POST /api/books/:id/borrow` | `authenticate` + `requireMember` | 403 | 200 | 401 |
| `POST /api/books/:id/return` | `authenticate` + `requireMember` | 403 | 200 (own book) / 400 | 401 |

Librarians cannot borrow books — `requireMember` blocks them. This matches the case brief.

---

## 6. Protected Action Status

The three protected actions are **add book**, **edit book**, and **remove book**.

All three are enforced at the Express route level with both `authenticate` and `requireLibrarian` middleware (`routes/books.js` lines 38, 51, 64). A Member sending a direct API request receives `403 Access Denied: Librarian role required.` regardless of what the frontend renders. The auth middleware re-loads the user row from the database before the role check, so a tampered token claiming a different role will fail the HMAC signature check before reaching the role guard.

The **delete** action has an additional business-rule guard: a book with `availabilityStatus === 'borrowed'` cannot be deleted, preventing orphaned lending records.

---

## 7. Validation Status

### Backend validation (BookService)

| Rule | Implemented | Location |
|---|---|---|
| Title, Author, ISBN, Category required on create | Yes | `bookService.js` line 49 |
| `availabilityStatus` must match ENUM values | Yes | `bookService.js` lines 54, 76 |
| Required fields cannot be emptied on update | Yes | `bookService.js` line 86 |
| Book must exist before update or delete | Yes | `bookService.js` lines 73, 104 |
| Cannot delete a currently borrowed book | Yes | `bookService.js` line 107 |
| Book must be `available` before borrowing | Yes | `bookService.js` line 131 |
| Member can only return their own borrowed book | Yes | `bookService.js` line 174 |
| Username and password required for login | Yes | `routes/auth.js` line 20 |

### Frontend validation (App.jsx)

| Rule | Implemented |
|---|---|
| Login: username and password required (JS + HTML required) | Yes |
| Add/Edit form: all four fields required (JS + HTML required) | Yes |

### Gaps

- No ISBN format validation (length, numeric, check-digit)
- No maximum-length validation beyond DB column limits
- Category filter is exact-case on the backend; mitigated by dropdown being populated from live data
- Some `catch` blocks return `error.message` in 500 responses — potential information leakage

---

## 8. Stage Drift / Early Implementation

| Item | Verdict | Detail |
|---|---|---|
| DB transaction with `FOR UPDATE` lock in borrow/return | Slightly ahead | Belongs to security hardening but required for correctness |
| HMAC-signed token with DB re-validation | Slightly ahead | Security hardening work — but makes the app correctly functional |
| 14-day checkout window / `borrowedDate` / `returnDate` | In scope | Required by borrow workflow |
| JSDoc comments on all service methods | In scope | Maintainability — not harmful |
| `ON DUPLICATE KEY UPDATE` idempotent seed | In scope | Good practice at any stage |
| No test files or test runner | Expected | Tests are a later stage |
| No helmet / rate limiting / strict CORS | Expected | Security hardening is a later stage |
| No fines, reservations, or borrow history | Correct | Out of scope per case brief |

No features from future stages were prematurely implemented. Minor security constructs (HMAC, DB role reload) were included but are necessary for the app to function correctly rather than being speculative future work.

---

## 9. Issues Found Before Stage 8

### High — functional gaps or correctness risks

1. **TOKEN_SECRET not in `.env`** — `middleware/auth.js` line 4 and `routes/auth.js` line 6 both fall back to `'library_secret_key_12345'` if `TOKEN_SECRET` is absent. Anyone who knows the fallback can forge valid tokens. The `.env` file does not define this variable.

2. **Edit form allows inconsistent borrow state** — `PUT /api/books/:id` accepts `availabilityStatus=borrowed` without requiring `borrowedMember`, `borrowedDate`, or `returnDate`. A librarian can create a row where status is `borrowed` but all lending columns are `NULL`, breaking the return workflow for that book.

3. **README–code mismatch** — README step 1 instructs the user to manually run `CREATE DATABASE library_lending_db;`. The `db:setup` script creates the database automatically using `DB_NAME` from `.env` (`c6p3`). A new user following the README will create the wrong database and have a confusing setup experience.

### Medium — usability or minor correctness

4. **Librarian table shows raw member ID** — The "Lending State" column shows `Member ID: 3` instead of a username. The `books` table stores only the FK integer; a JOIN to `app_users` is not implemented.

5. **`borrowedDate` is `DATE` not `DATETIME`** — `borrowBook()` inserts `new Date()` (full timestamp). MySQL truncates to date-only silently. The 14-day window is unaffected, but the exact borrow time is lost.

6. **CORS wide-open** — `app.use(cors())` allows any origin. Acceptable for development; must be restricted before deployment.

7. **Category exact-case filter** — `WHERE category = ?` is case-sensitive. UI dropdown is populated from live data so real-world impact is low, but it is fragile.

8. **`error.message` in 500 responses** — Several catch blocks expose raw DB or Node error messages. Schema or path details could leak in production.

### Low — cleanup and polish

9. **No loading or disabled state on borrow/return buttons** — Double-clicking sends two requests. DB transaction lock prevents double-borrow at the data layer, but the UX is rough.

10. **No error boundary in React** — `main.jsx` mounts without a React `ErrorBoundary`. An uncaught render error crashes the whole app with a blank screen.

11. **Alert auto-dismiss only** — 5-second timer auto-clears error alerts with no persistent error log. The × button is small and easy to miss.

12. **No `.gitignore`** — `.env` with real credentials could be accidentally committed if the developer initialises git.

---

## 10. Manual Checks Recommended Next

1. Run `npm run db:setup` and confirm both tables are created and seed rows inserted with no errors.
2. Start the app with `npm run start` and verify frontend loads at `http://localhost:3000` and `GET /api/health` returns `{"status":"OK","database":"Connected"}`.
3. Login as `librarian1 / password123` and verify: add/edit/delete controls are visible; filter bar works for title, category, and status.
4. Login as `member1 / password123` and verify: no add/edit/delete controls visible; "Borrow Book" appears on available books; "Return Book" appears only on the book borrowed by member1; borrowing a book updates its status immediately in the UI.
5. Login as `member2 / password123` and verify the book borrowed by member1 shows a disabled "Borrowed by Member X" button — not a return button.
6. Using a REST client (curl or Postman), send `POST /api/books` with a Member token and verify a `403` response — confirming server-side enforcement independent of the UI.
7. Send `POST /api/books/:id/borrow` with a Librarian token and verify a `403` response.
8. Attempt to return member1's book while authenticated as member2 via direct API call and verify a `400` ownership error.
9. Verify `GET /api/health` while the backend is stopped shows the `DB: Offline` indicator in the frontend header.
10. Run `npm run db:setup` a second time and confirm no data is duplicated (idempotency check).

---

## 11. Pass/Fail Table

| Check | Result | Notes |
|---|---|---|
| App appears runnable | PASS | All dependencies installed; `npm run start` wires both servers; DB setup is one command |
| React frontend and Express backend are separated | PASS | `frontend/` is Vite+React; `backend/` is Express; no shared code |
| React calls Express routes, never MySQL directly | PASS | All `/api/*` calls go through Vite proxy to Express; no `mysql2` in frontend |
| Backend uses DB_HOST, DB_PORT, DB_USER, DB_PASSWORD, DB_NAME | PASS | `config/db.js` reads all five vars from `process.env`; `.env` present with all five |
| Secrets not exposed in React | PASS | No DB credentials in `frontend/`; Vite proxy does not forward `.env` to the browser |
| Needed database tables exist (`app_users`, `books`) | PASS | Both created and seeded by `scripts/dbSetup.js` |
| Users/login table exists | PASS | `app_users` table with `username`, `password` (hashed), `role` |
| Repeatable database setup and seed command | PASS | `npm run db:setup`; idempotent via `IF NOT EXISTS` and `ON DUPLICATE KEY UPDATE` |
| Login is database-backed | PASS | `POST /api/auth/login` queries `app_users`; passwords compared as SHA-256 hash |
| Role restrictions enforced in backend | PASS | `requireLibrarian` / `requireMember` middleware on all relevant routes; role re-loaded from DB |
| Add, edit, remove book records are protected | PASS | All three routes require `authenticate` + `requireLibrarian` |
| Users limited to their own records (return ownership) | PASS | `returnBook` compares `book.borrowedMember` to `req.user.id` and rejects on mismatch |
| Book record management (CRUD) implemented | PASS | Create, Read, Update, Delete all present with service layer and route handlers |
| Borrow and return workflow implemented | PASS | Both endpoints present; DB transactions; 14-day return window; status updates persist |
| Search and filter by title, category, availability implemented | PASS | Query params wired from UI through `getAllBooks` to parameterised WHERE clauses |
| Validation present | PASS | Backend validates required fields, enum values, business rules; frontend validates required fields |
| AI did not implement future stages early | PASS | No test files; no helmet/rate-limit; CORS wide-open — appropriate for stage. HMAC re-validation is slightly ahead but required for correctness |
| TOKEN_SECRET defined in .env | FAIL | `.env` does not include `TOKEN_SECRET`; falls back to hardcoded string |
| README setup instructions match actual scripts | FAIL | README says to create DB manually; `db:setup` creates it automatically with a different default name |
| Edit form cannot create inconsistent borrow state | FAIL | Librarian can set `availabilityStatus=borrowed` without setting borrower FK via `PUT /api/books/:id` |
