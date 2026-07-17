# Library Lending System — Mid-Project Review

**Project path:** `p2`
**Review stage:** After secondary feature (search/filter). Before testing, security hardening, and maintainability cleanup.
**Reviewed:** 2026-07-13
**Reviewer:** Antigravity AI (automated static review — no tests run, no code modified)

---

## 1. Mid-Review Summary

The project is a React + Express + MySQL prototype for a library lending system. Frontend (`frontend/`) and backend (`backend/`) are correctly separated into two independent subdirectories, each with its own `package.json` and `node_modules`. The application is **runnable as-is** provided a local MySQL server is available and `npm run db:setup` has been executed.

**Headline findings:**

- Architecture is clean and well-separated — React never touches MySQL directly.
- All five `DB_*` environment variables are present and used correctly in `db.js`; secrets stay server-side.
- `schema.sql` declares both `users` and `books` tables with correct fields and a repeatable `INSERT IGNORE` seed.
- Login is **database-backed** (username lookup against MySQL), but there is **no password field** — authentication is username-only.
- Role enforcement is implemented **on the backend** via two middleware functions (`requireAuth`, `requireLibrarian`).
- All protected book management routes (POST/PUT/DELETE `/api/books`) are guarded by both middleware layers.
- Borrow ownership is enforced server-side: a member can only return a book they personally borrowed.
- The secondary feature (search by title/author/ISBN + filter by category + filter by availability status) is implemented in both backend query logic and the React UI.
- Sessions are in-memory (`Map`); they are lost on server restart — acceptable for a prototype but a gap for persistence.
- No password hashing, no HTTPS enforcement, no rate limiting, no input sanitization beyond presence checks — expected at this stage but logged as pre-hardening items.
- No test files exist anywhere in the project.
- `App.css` still contains Vite scaffold styles (`.hero`, `.ticks`, `#next-steps`, `#spacer`, `#docs`) that are unused by the actual application.
- `index.html` `<title>` is still the Vite default `"frontend"`.
- The backend URL `http://localhost:5000` is hard-coded in every `fetch()` call in `App.jsx` — no environment variable is used on the React side.

---

## 2. Review Scoring Matrix

Scores are for the **current raw project** before testing, security hardening, maintainability cleanup, and any change request.

| Feature / Area | Functionality 0-5 | Data Persistence 0-5 | Backend Security / Role Control 0-5 | Validation / Error Handling 0-5 | Testing Evidence 0-5 | Maintainability 0-5 | UI / Manual Usability 0-5 | Evidence | Notes |
|---|---:|---:|---:|---:|---:|---:|---:|---|---|
| Project setup and run commands | 4 | 4 | — | — | 0 | 3 | — | `backend/package.json`: `start`, `dev`, `db:setup` scripts. `frontend/package.json`: `dev`, `build`, `lint`. Both `node_modules` present. | No root-level README with combined startup instructions. Hard-coded port 5000 in React. |
| Database setup and starter data | 4 | 5 | — | — | 0 | 4 | — | `schema.sql` creates DB + tables, seeds 3 users + 3 books with `INSERT IGNORE`. `setup-db.js` reads and runs the file. `npm run db:setup` wires it up. | `INSERT IGNORE` is idempotent. No migration versioning. |
| Login workflow | 3 | 3 | 2 | 3 | 0 | 3 | 4 | `POST /api/auth/login` queries `users` table by username, issues `crypto.randomUUID()` token in server-side Map. React stores token + user in `localStorage`. Logout invalidates token. | No password column. Username-only login is database-backed but weak. Sessions lost on server restart. |
| Role-based access | 4 | 4 | 4 | 3 | 0 | 4 | 4 | `requireAuth` re-queries DB on every request for live role. `requireLibrarian` returns 403 for non-librarians. React UI conditionally renders controls by role. | Role read from DB on every request — no stale token risk. UI enforcement backed by backend enforcement. |
| Main create action | 4 | 5 | 5 | 4 | 0 | 4 | 4 | `POST /api/books` — guarded by `requireAuth + requireLibrarian`. Validates required fields. Checks duplicate ISBN. Inserts to DB. Returns 201 + created record. | `availabilityStatus` fixed to "Available" on create — correct. No max-length validation. |
| Main view/list action | 5 | 5 | 3 | 3 | 0 | 4 | 4 | `GET /api/books` — public, no auth. JOINs users for `borrowedMemberName`. React renders table with color-coded status badges and due-date detail. | Public endpoint exposes who borrowed each book. May be intentional for a public catalog but is a privacy gap. |
| Main update/status/cancel action | 4 | 5 | 5 | 4 | 0 | 4 | 3 | `PUT /api/books/:id` — guarded. Updates all book fields. Duplicate ISBN check excludes self. `POST /api/books/:id/return` clears all borrow fields. | Edit form allows librarian to set status "Borrowed" without setting borrower fields — potential data inconsistency. |
| Protected action | 5 | 5 | 5 | 4 | 0 | 4 | 4 | POST/PUT/DELETE `/api/books` all carry `requireAuth, requireLibrarian`. Delete blocks removal of currently-borrowed books. React hides controls for members. | Backend is the authoritative guard. |
| Secondary feature | 4 | 4 | 3 | 3 | 0 | 3 | 4 | `GET /api/books` accepts `search` (LIKE on title/author/isbn), `category` (exact), `availabilityStatus` (exact). React UI: text input + two select dropdowns. `useEffect` re-fetches on filter change. | Search matches author and ISBN in addition to title — minor over-scope. No debounce on search. Category dropdown is hard-coded. |
| Case-specific: book catalog fields and availability status | 4 | 5 | 4 | 4 | 0 | 4 | 4 | `books` table: all case-brief fields present. `availabilityStatus ENUM('Available','Borrowed','Unavailable')`. Status badge color-codes all three states. | "Unavailable" exists but has no dedicated workflow to set it except via the librarian edit form. |
| Case-specific: borrow and return lending workflow | 4 | 5 | 5 | 4 | 0 | 4 | 4 | Borrow sets Borrowed + borrowedMemberId + borrowedDate + 14-day returnDate. Return clears all four fields and resets to Available. Member-only borrow enforced server-side. | Return date auto-set to +14 days; no custom due date (acceptable for prototype). |
| Case-specific: librarian-only book management and member borrowing ownership | 5 | 5 | 5 | 4 | 0 | 4 | 4 | Librarian: CRUD via `requireLibrarian`. Member: borrow enforced; return only if `borrowedMemberId === user.id` or user is librarian. Both enforced server-side. | Members cannot borrow for others. Librarian can return any book (admin override — correct). |
| UI / manual usability | 3 | — | — | 3 | 0 | 3 | 3 | Single-page React SPA. Table layout with action buttons per row. Filter bar always visible. Sidebar form for add/edit. Toast-style error/success messages with auto-dismiss. | No router. `<title>` reads "frontend". Dead CSS in App.css. No loading spinner or empty-state image. |
| Security posture | 1 | 2 | 3 | 2 | 0 | 2 | — | Backend role checks correct. Parameterized queries protect against SQL injection. Wide-open CORS. Token in localStorage. No password storage. No rate limiting. No Helmet. | Security hardening expected at a later stage. Scores reflect current raw state. |
| Testing evidence | 0 | 0 | 0 | 0 | 0 | 0 | — | No test files. No test runner configured. No test scripts in either package.json. `oxlint` is a linter, not a test runner. | — |
| Maintainability | 2 | — | — | — | 0 | 2 | — | No root README. Frontend README is Vite default. Dead CSS in App.css. Hard-coded backend URL in React. No JSDoc or API docs. `App.jsx` is 565 lines single-file. | Code is readable within each file. Single-file frontend will need splitting before final review. |

---

## 3. Current Feature Status

| Feature | Implemented | Backend Route | Auth Guard | Notes |
|---|---|---|---|---|
| Add book record | YES | `POST /api/books` | `requireAuth + requireLibrarian` | Working |
| Edit book record | YES | `PUT /api/books/:id` | `requireAuth + requireLibrarian` | Working |
| Delete book record | YES | `DELETE /api/books/:id` | `requireAuth + requireLibrarian` | Blocks if Borrowed |
| View book catalog | YES | `GET /api/books` | None (public) | Intentional? Exposes borrow names |
| Borrow book | YES | `POST /api/books/:id/borrow` | `requireAuth` + member role check | Sets 14-day return date |
| Return book | YES | `POST /api/books/:id/return` | `requireAuth` + ownership check | Librarian override allowed |
| Search by title/author/ISBN | YES | `GET /api/books?search=` | None | Author+ISBN are over-scope extras |
| Filter by category | YES | `GET /api/books?category=` | None | Exact match |
| Filter by availability | YES | `GET /api/books?availabilityStatus=` | None | Exact match |
| Login | YES | `POST /api/auth/login` | — | No password |
| Logout | YES | `POST /api/auth/logout` | Bearer token | Deletes from in-memory Map |
| Health check | YES | `GET /api/health` | None | Useful for deployment checks |

---

## 4. Database and Persistence Status

### Tables in `schema.sql`

| Table | Present | Key Fields | Notes |
|---|---|---|---|
| `users` | YES | `id`, `username`, `role ENUM('librarian','member')`, `created_at` | No `password` column — username-only auth |
| `books` | YES | `id`, `title`, `author`, `isbn UNIQUE`, `category`, `availabilityStatus ENUM(...)`, `borrowedMemberId FK→users`, `borrowedDate`, `returnDate`, `createdAt`, `updatedAt` | All case-brief fields present |

### Seed data (`schema.sql` lines 27–35)

```
users: librarian1 (librarian), member1 (member), member2 (member)
books: The Great Gatsby, To Kill a Mockingbird, 1984 — all Available
```

Seeds use `INSERT IGNORE` — idempotent and safe to re-run.

### Connection

- `db.js` uses `mysql2/promise` with a connection pool.
- All five required env vars (`DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`) are read from `.env` via `dotenv`.
- `.env.example` is committed and mirrors `.env` (actual `.env` is also committed with empty password — acceptable for a local prototype but would be a secret-leak in a real repo).
- `DB_NAME` default fallback in `db.js` is `library_lending_db`, but `schema.sql` creates and uses `c6p2` — minor mismatch if `.env` is absent.

### Persistence gap

Session tokens are stored in a `Map` in Node.js process memory. Restarting the backend invalidates all active sessions. Book data persists in MySQL correctly.

---

## 5. Login and Role/Access Status

### Login mechanism

- **Type:** Database-backed username lookup — **not** mock-only, **not** role-selector-only.
- `POST /api/auth/login` queries `SELECT id, username, role FROM users WHERE username = ?`.
- On match: issues `crypto.randomUUID()` token, stores `token → userId` in server-side `Map`.
- On no match: returns `401 Invalid username`.
- **No password:** Any caller who knows a valid username can authenticate. This is a known prototype limitation.
- Token is returned to the client; React stores it in `localStorage`.

### Session validation on every protected request

`requireAuth` middleware:
1. Reads `Authorization: Bearer <token>` header.
2. Looks up `userId` from the in-memory `sessions` Map.
3. **Re-queries the database** (`SELECT id, username, role FROM users WHERE id = ?`) to attach a live `req.user`.
4. If the user row is gone, the session is deleted and 401 is returned.

This design prevents stale role data from living in a signed token.

### Role enforcement

- `requireLibrarian` checks `req.user.role !== 'librarian'` and returns 403.
- Borrow endpoint: inline `if (user.role !== 'member')` check returns 403 for librarians trying to borrow.
- Return endpoint: `if (user.role !== 'librarian' && book.borrowedMemberId !== user.id)` returns 403.
- All role checks are **server-side only**; UI hiding is supplemental.

---

## 6. Protected Action Status

**Protected actions:** Add, Edit, Delete book records (librarian only)

| Route | Middleware chain | 401 if no token | 403 if not librarian | Note |
|---|---|---|---|---|
| `POST /api/books` | `requireAuth, requireLibrarian` | YES | YES | Static review |
| `PUT /api/books/:id` | `requireAuth, requireLibrarian` | YES | YES | Static review |
| `DELETE /api/books/:id` | `requireAuth, requireLibrarian` | YES | YES | Static review |

**Additional business rule:** `DELETE /api/books/:id` checks `availabilityStatus === 'Borrowed'` and returns 400 — prevents deletion of currently-borrowed books.

**Gap:** The `PUT` route allows a librarian to set `availabilityStatus` to `"Borrowed"` without setting `borrowedMemberId`, `borrowedDate`, or `returnDate`. This could create an inconsistent book record (status=Borrowed, no borrower). The borrow workflow sets all four fields atomically; the edit form bypasses that.

---

## 7. Validation Status

### Backend validation present

| Route | Checks |
|---|---|
| `POST /api/auth/login` | Username required (400) |
| `POST /api/books` | title/author/isbn/category required (400); duplicate ISBN (400) |
| `PUT /api/books/:id` | title/author/isbn/category required (400); duplicate ISBN excluding self (400) |
| `DELETE /api/books/:id` | Book exists (404); not currently borrowed (400) |
| `POST /api/books/:id/borrow` | Book exists (404); availabilityStatus === Available (400); role === member (403) |
| `POST /api/books/:id/return` | Book exists (404); availabilityStatus === Borrowed (400); ownership (403) |

### Backend validation gaps

- No max-length enforcement on `title`, `author`, `isbn`, `category` (DB column lengths enforce a hard limit, but no friendly error is returned before the DB rejects it).
- No ISBN format validation (numeric, 10 or 13 digits).
- No `availabilityStatus` enum validation in the PUT route — an arbitrary string will cause an uncaught 500 from MySQL.
- `PUT /api/books/:id` does not verify the book exists before updating — will silently succeed with `affectedRows: 0` if the ID is invalid; no 404 returned.
- `GET /api/books?search=` does not escape SQL LIKE wildcards (`%`, `_`) in the user input.

### Frontend validation present

- Login form: empty username check before API call.
- Book form: presence check for all four required fields before API call.
- React form inputs use the `required` HTML attribute.

### Frontend validation gaps

- No ISBN format check in UI.
- No field length limits (`maxLength` not set on inputs).
- No real-time inline field feedback — errors shown only via toast after a failed API call.

---

## 8. Stage Drift / Early Implementation

| Item | Expected Stage | Status |
|---|---|---|
| Unit / integration / e2e tests | Stage 8+ | Not implemented — correct |
| JWT / signed tokens | Security hardening | Not implemented — correct |
| Password hashing (bcrypt) | Security hardening | Not implemented — correct |
| HTTPS / TLS | Security hardening | Not implemented — correct |
| Rate limiting | Security hardening | Not implemented — correct |
| Helmet.js | Security hardening | Not implemented — correct |
| Fine calculation | Out of scope | Not implemented — correct |
| Barcode / ISBN scanner | Out of scope | Not implemented — correct |
| Email reminders | Out of scope | Not implemented — correct |
| Multi-copy / reservation queue | Out of scope | Not implemented — correct |

**No significant stage drift detected.** The implementation matches the expected end-of-secondary-feature state.

One minor over-scope item: the `GET /api/books?search=` filter matches on `author` and `isbn` in addition to `title`. The case brief specifies title, category, and availability. Searching by author and ISBN is a useful addition but was not requested.

---

## 9. Issues Found Before Stage 8

Issues are categorized by severity. None should be fixed now; they are logged for subsequent stages.

### High — Security (fix in security hardening stage)

| # | Issue | Location |
|---|---|---|
| H1 | No password authentication — username alone grants access | `server.js:58-78`, `schema.sql:4-9` |
| H2 | In-memory session store lost on server restart | `server.js:14` |
| H3 | CORS is wide-open (`cors()` with no origin restriction) | `server.js:10` |
| H4 | Session token stored in `localStorage` — vulnerable to XSS | `App.jsx:70-71` |
| H5 | `.env` committed to repository (empty password but still a leak pattern) | `backend/.env` |
| H6 | No Helmet.js — missing HTTP security headers | `server.js` |
| H7 | No rate limiting on login endpoint | `server.js:58` |

### Medium — Correctness / Data Integrity

| # | Issue | Location |
|---|---|---|
| M1 | `PUT /api/books/:id` allows setting `availabilityStatus: "Borrowed"` without borrow fields — orphaned borrow state | `server.js:148-170` |
| M2 | `PUT /api/books/:id` returns success even if `id` does not exist (no 404 guard) | `server.js:162-166` |
| M3 | `availabilityStatus` not validated against enum values in PUT body; invalid value yields uncaught 500 from MySQL | `server.js:163` |
| M4 | `db.js` fallback DB name is `library_lending_db` but `schema.sql` creates `c6p2` — mismatch if `.env` is absent | `db.js:8`, `schema.sql:1` |
| M5 | React hard-codes `http://localhost:5000` in all `fetch()` calls — breaks in any non-localhost environment | `App.jsx:57,80,104,154,185,204,222` |

### Low — Maintainability / Polish

| # | Issue | Location |
|---|---|---|
| L1 | `App.jsx` is 565 lines, single file — all state, logic, and JSX in one component | `frontend/src/App.jsx` |
| L2 | `App.css` contains dead Vite scaffold styles (`.hero`, `.ticks`, `#next-steps`, `#spacer`, `#docs`, `.counter`) | `frontend/src/App.css` |
| L3 | `index.html <title>` still reads `"frontend"` (Vite default) | `frontend/index.html:7` |
| L4 | `frontend/README.md` is the Vite template default — no project-specific instructions | `frontend/README.md` |
| L5 | No root-level `README.md` with combined startup instructions | Project root |
| L6 | `index.css` sets `text-align: center` on `#root` — conflicts with left-aligned table content | `frontend/src/index.css:62` |
| L7 | Search input has no debounce — fires a backend request on every keystroke | `App.jsx:33,346` |
| L8 | Category list in React is hard-coded — does not update if new categories are added via edit form | `App.jsx:27,356` |
| L9 | No `VITE_API_URL` or equivalent env variable for the API base URL in the frontend | `App.jsx` throughout |

---

## 10. Manual Checks Recommended Next

The following checks cannot be completed by static review alone and should be performed manually before the final review:

1. **Run database setup:** `cd backend && npm run db:setup` — verify it creates `c6p2`, `users`, and `books` tables without error.
2. **Start backend:** `npm run dev` — confirm server starts on port 5000 and `GET /api/health` returns `{"status":"ok"}`.
3. **Start frontend:** `cd frontend && npm run dev` — confirm Vite dev server starts and the login page renders.
4. **Login as librarian1:** Verify dashboard loads, "Add Book Record" button is visible.
5. **Add a new book as librarian1:** Fill in all fields — confirm it appears in the table.
6. **Edit the book as librarian1:** Change category — confirm the change persists.
7. **Delete an available book as librarian1:** Confirm removal. Then try deleting a borrowed book — confirm the 400 error.
8. **Login as member1:** Verify "Add Book Record" button is absent.
9. **Borrow a book as member1:** Confirm status changes to Borrowed, borrower name and due date shown.
10. **Try to borrow the same book again:** Confirm 400 "not available" error.
11. **Login as member2:** Confirm the Return button does not appear for member1's borrowed book.
12. **Return the book as member1:** Confirm status resets to Available.
13. **Search by title substring:** Confirm filtered results.
14. **Filter by category:** Confirm only matching books shown.
15. **Filter by availability "Borrowed":** Confirm only borrowed books shown.
16. **Attempt protected route without token:** POST to `/api/books` with no Authorization header — expect 401.
17. **Attempt protected route as member:** Use a member token to DELETE a book — expect 403.
18. **Restart backend server:** Confirm a previously stored session token no longer works (in-memory session loss).

---

## 11. Pass/Fail Table

| Check | Result | Notes |
|---|---|---|
| App appears runnable | PASS | Both `node_modules` present; start scripts defined; MySQL setup script available |
| React and Express are separated | PASS | Separate `frontend/` and `backend/` with independent `package.json` |
| React never connects to MySQL directly | PASS | React only calls `http://localhost:5000/api/*`; no `mysql2` in frontend |
| Backend uses all 5 DB env vars | PASS | `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME` all used in `db.js` |
| DB secrets not exposed in React | PASS | `.env` is backend-only; React has no `.env`; no DB credentials in `App.jsx` |
| `users` / login table exists | PASS | `users` table in `schema.sql` with `id`, `username`, `role` |
| `books` table with all required fields | PASS | All case-brief fields present including borrow tracking fields |
| Repeatable DB setup / seed command | PASS | `npm run db:setup` runs `setup-db.js` which executes `schema.sql` with `INSERT IGNORE` |
| Login is database-backed | PASS (weak) | Username queried from MySQL; no password — authentication is username-only |
| Role restrictions enforced in backend | PASS | `requireAuth + requireLibrarian` on all protected routes; inline member/ownership checks |
| Add/Edit/Delete book protected | PASS | All three routes behind `requireAuth + requireLibrarian` |
| Members limited to own borrow records | PASS | Return endpoint checks `borrowedMemberId === user.id` server-side |
| Book record management implemented | PASS | Full CRUD via POST/GET/PUT/DELETE `/api/books` |
| Borrow/return workflow implemented | PASS | Borrow sets all fields + due date; return clears all fields |
| Search/filter by title, category, availability | PASS | Backend LIKE search + exact-match filters; React UI controls all three |
| Validation present | PARTIAL | Required field checks present; missing ISBN format, length limits, enum validation on PUT, 404 on PUT for missing ID |
| No future stages implemented early | PASS | No tests, no JWT, no bcrypt, no rate limiting, no out-of-scope features |
| No known blocking regressions | PASS | All primary features appear logically correct by static review |
