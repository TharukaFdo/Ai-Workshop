# Final Review — Workshop Registration System

**Case:** Workshop Registration System (Case 10, Prototype 1)
**Review Stage:** Final — after testing, security hardening, maintainability cleanup, and Stage 11 change request
**Date:** 2026-06-16
**Reviewer:** AI Code Review (evidence-based inspection of actual project files + live test run)

---

## 1. Final Feature Summary

The Workshop Registration System is a fully functional two-tier prototype built with React 18 (Vite), Express 4 (Node.js), and local MySQL via mysql2. Both tiers are physically separated into independent `frontend/` and `backend/` directories, each with their own `package.json`. The frontend communicates with the backend exclusively through HTTP calls to `/api/*` routes — it never connects to MySQL directly.

### What Was Built

| Feature | Status | Evidence |
|---|---|---|
| Participant registration form (name, email, workshop, details) | ✅ Complete | `App.jsx` L136–177, `POST /api/registrations` |
| Workshop title selection (3 fixed titles) | ✅ Complete | `App.jsx` L50–54; `server.js` L112–119 |
| Registration details free-text field | ✅ Complete | `App.jsx` L501–512; `db-init.js` L39 |
| View registration list with status and attendance badges | ✅ Complete | Participant view `App.jsx` L520–554; Organizer view L612–783 |
| Organizer update registration status | ✅ Complete | `App.jsx` L179–203; `PUT /api/registrations/:id` |
| Organizer mark attendance (present/absent/unmarked) | ✅ Complete | `App.jsx` L205–229; `PUT /api/registrations/:id` |
| Organizer add/edit organizer notes | ✅ Complete | `App.jsx` L231–256; `PUT /api/registrations/:id` |
| Filter by workshop title (organizer) | ✅ Complete | `App.jsx` L259–264; client-side |
| Filter by registration status (organizer) | ✅ Complete | `App.jsx` L259–264; client-side |
| Filter by attendance status (organizer) | ✅ Complete | `App.jsx` L259–264; client-side |
| Database-backed login with role detection | ✅ Complete | `server.js` L55–75; `db-init.js` L77–89 |
| Health check endpoint | ✅ Complete | `server.js` L209–227 |
| Repeatable database init + seed command | ✅ Complete | `db-init.js`; `npm run db:init` |
| Automated integration tests (13 assertions) | ✅ Complete | `test.js`; `npm test`; all pass |
| Participant scoping (own records only) | ❌ Not implemented | `GET /api/registrations` returns all rows for all roles |
| Backend filter query parameters | ❌ Not implemented | Filtering is entirely client-side |
| Password hashing | ❌ Not implemented | Plain-text comparison in DB |
| JWT / signed session token | ❌ Not implemented | Plain `x-user-id` header used |
| Participant role restriction on POST | ❌ Not implemented | Any authenticated user can call `POST /api/registrations` |

---

## 2. Review Scoring Matrix

| Feature / Area | Functionality 0-5 | Data Persistence 0-5 | Backend Security / Role Control 0-5 | Validation / Error Handling 0-5 | Testing Evidence 0-5 | Maintainability 0-5 | UI / Manual Usability 0-5 | Evidence | Notes |
|---|---:|---:|---:|---:|---:|---:|---:|---|---|
| Project setup and run commands | 5 | 5 | 0 | 0 | 4 | 4 | 0 | `backend/package.json` scripts: `start`, `dev`, `db:init`, `test`; `frontend/package.json`: `dev`, `build`; Vite proxy to `:5005`; both servers confirmed running during test run | No root-level README or `.env.example`. Both servers must be started manually. |
| Database setup and starter data | 5 | 5 | 0 | 0 | 4 | 4 | 0 | `db-init.js` creates DB, drops/recreates both tables, seeds 3 registrations + 2 users; test confirmed `npm run db:init` works | Script is destructive (DROP IF EXISTS) — acceptable for prototype. No migration versioning. |
| Login workflow | 4 | 5 | 2 | 4 | 5 | 3 | 5 | Tests 1–3 all passed: organizer login ✔, participant login ✔, invalid credentials → 401 ✔; length caps (50 chars) and type checks present in `server.js` L57–63 | Plain-text passwords; spoofable `x-user-id` header; no token/session. Demo credentials still displayed on login screen. |
| Role-based access | 4 | 4 | 3 | 3 | 5 | 3 | 4 | Test 6 confirmed participant receives 403 on PUT; `authenticateUser` middleware does DB lookup on every request; UI renders separate views per role | `GET /api/registrations` enforces auth but not role — both roles see all rows. `POST` route is not role-restricted. |
| Main create action | 4 | 5 | 3 | 5 | 5 | 3 | 5 | Test 4 created registration (ID: 8), persisted to MySQL; Test 9 confirmed email format and workshop title rejections (400); name/email/workshop required enforced | Any authenticated user (including organizer) can POST. No `submitted_by` user linkage in DB. |
| Main view/list action | 4 | 5 | 2 | 3 | 5 | 3 | 5 | Test 5 read back created registration from MySQL; both participant and organizer views display all records | No participant scoping — participants see all registrations. No backend filter params. |
| Main update/status/cancel action | 5 | 5 | 4 | 5 | 5 | 4 | 5 | Tests 7a–7c exercised waitlist → confirmed lifecycle; Test 8 verified all three fields (status, attendance, notes) persisted in DB; `server.js` dynamic SET builder; 404 on missing id; enum guards in place | `req.req_body \|\| req.body` bug present — harmless in practice (`req.req_body` always undefined so `req.body` is always used). |
| Protected action | 5 | 5 | 5 | 4 | 5 | 4 | 5 | Test 6 confirmed participant blocked (403); Test 7c confirmed organizer allowed; attendance and note edit UI only rendered in organizer view (`currentUser.role === 'organizer'` guard); backend PUT role-checks all three fields atomically | Notes visible to participants in read-only list — case brief does not explicitly prohibit this. No state-machine guard (attendance can be set on pending record). |
| Secondary feature | 5 | 4 | 0 | 0 | 1 | 3 | 5 | Client-side filter state for workshop, status, and attendance; dropdowns in organizer filter bar; `filteredRegistrations` computed array; count badge; 3-way filter combining all criteria | Filter not tested in `test.js`. Client-side only — no backend query params. |
| Case-specific: registration details and workshop title tracking | 5 | 5 | 3 | 5 | 5 | 4 | 5 | `workshop_title VARCHAR(255)` and `registration_details TEXT` in schema; form collects both; server whitelist validation for titles (`server.js` L112–119); Test 9 confirmed invalid title rejected; both displayed in both role views | Titles hardcoded in JS array, not a `workshops` table. Filter relies on exact string match. |
| Case-specific: registration status and attendance status lifecycle | 5 | 5 | 4 | 5 | 5 | 4 | 5 | `status` (pending/confirmed/cancelled/waitlisted) and `attendance` (unmarked/present/absent) columns with defaults; enum validation in PUT; Tests 7a→7b→7c proved status lifecycle; Test 8 proved field persistence | No state-machine guard (e.g., confirm before marking attendance). `waitlisted` is a bonus 4th status beyond the case brief's 3. |
| Case-specific: organizer notes and attendance protection | 5 | 5 | 5 | 4 | 5 | 4 | 5 | `organizer_notes TEXT` column; inline edit UI only in organizer view; PUT route role-checks all updates; Test 6 confirmed 403 for participant; Test 7c saved `organizer_notes: 'Verified by integration tests'`; Test 8 confirmed notes in DB | Notes readable by participants in list view. Acceptable per case brief wording. |
| UI/manual usability | 5 | 0 | 0 | 3 | 0 | 4 | 5 | Dark premium glassmorphism design with `Plus Jakarta Sans` + `Outfit` fonts; Lucide icons; loading spinner; success/error banners; DB connection badge; role-sensitive layout; status and attendance badges with colour-coded styling | `animate-spin` CSS class referenced in JSX but not defined in `index.css` — spinner icon visible but does not animate. Font requires Google Fonts CDN. |
| Security posture | 2 | 0 | 2 | 4 | 3 | 2 | 0 | `authenticateUser` and role-check on PUT; parameterised queries throughout (mysql2 `?` placeholders); length caps on all text inputs; email regex; workshop whitelist; dotenv for DB credentials | Plain-text passwords; spoofable user-ID header; open CORS wildcard; no rate limiting; no `helmet`; no HTTPS; participants see all records; no `submitted_by` linkage. |
| Testing evidence | 5 | 5 | 5 | 5 | 5 | 4 | 0 | `test.js` — 13 assertions across 9 test groups; `npm test` → all pass; live run captured: `🎉 ALL TESTS PASSED SUCCESSFULLY!`; test cleanup deletes `test-runner@example.com` records by ID after each run | No test framework (Jest/Mocha) — raw Node.js + native `fetch`. No frontend/unit tests. Filter feature not covered. |
| Maintainability | 3 | 0 | 0 | 0 | 0 | 3 | 0 | Route and logic comments throughout `server.js`; `db-init.js` fully separated from server; dotenv config; `nodemon` for dev reload; ESLint in frontend devDeps | Entire frontend is one 791-line `App.jsx` — no component decomposition. No `.env.example`, no root README. `req.req_body \|\| req.body` latent bug in `server.js` (3 occurrences). |

---

## 3. Project Structure and Run Commands

```
p1/
├── Case_Brief.md
├── MID_REVIEW.md
├── FINAL_REVIEW.md           ← this document
│
├── backend/
│   ├── .env                  ← DB credentials (not committed to VCS ideally)
│   ├── package.json
│   ├── server.js             ← Express API server (233 lines)
│   ├── db-init.js            ← Database initialiser + seeder (104 lines)
│   ├── test.js               ← Integration test suite (229 lines)
│   └── node_modules/
│
└── frontend/
    ├── index.html
    ├── package.json
    ├── vite.config.js        ← Vite dev server + proxy config
    ├── src/
    │   ├── main.jsx
    │   ├── App.jsx           ← Entire React application (791 lines)
    │   └── index.css
    └── node_modules/
```

### Run Commands

| Step | Command | Directory |
|---|---|---|
| Install backend deps | `npm install` | `backend/` |
| Install frontend deps | `npm install` | `frontend/` |
| Initialise DB + seed | `npm run db:init` | `backend/` |
| Start backend (dev) | `npm run dev` | `backend/` (port 5005) |
| Start backend (prod) | `npm start` | `backend/` (port 5005) |
| Start frontend | `npm run dev` | `frontend/` (port 5173) |
| Run tests | `npm test` | `backend/` (requires backend running) |

---

## 4. Frontend/Backend Separation Check

| Check | Result | Evidence |
|---|---|---|
| React and Express are physically separated | ✅ Pass | `frontend/` and `backend/` are distinct directories with independent `package.json` files and separate `node_modules/` |
| React calls Express routes only — never MySQL directly | ✅ Pass | All MySQL access is in `backend/server.js`. `frontend/src/App.jsx` uses `fetch('/api/...')` exclusively. No `mysql2` in `frontend/package.json`. |
| Vite proxies `/api` to Express | ✅ Pass | `vite.config.js` L10–14: `'/api'` → `http://localhost:5005` with `changeOrigin: true` |
| DB credentials never reach the browser bundle | ✅ Pass | `.env` is in `backend/`. Vite does not bundle backend files. No `DB_*` variables appear in any frontend file. |

---

## 5. Database Setup and Table Summary

### Connection Method

The backend reads all five DB variables from `backend/.env` via `dotenv`:

| Variable | Configured | Default Fallback |
|---|---|---|
| `DB_HOST` | ✅ | `localhost` |
| `DB_PORT` | ✅ | `3306` |
| `DB_USER` | ✅ | `root` |
| `DB_PASSWORD` | ✅ | *(not printed)* |
| `DB_NAME` | ✅ | `c10p1` |

`mysql2/promise` creates a connection pool (`connectionLimit: 10`) in `server.js` and a single connection in `db-init.js` for setup.

### Tables

| Table | Columns | Notes |
|---|---|---|
| `registrations` | `id` INT PK AI, `name` VARCHAR(255) NOT NULL, `email` VARCHAR(255) NOT NULL, `workshop_title` VARCHAR(255) NOT NULL, `registration_details` TEXT, `status` VARCHAR(50) DEFAULT `'pending'`, `attendance` VARCHAR(50) DEFAULT `'unmarked'`, `organizer_notes` TEXT, `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP | All case-required fields present. No `submitted_by` FK to users. |
| `users` | `id` INT PK AI, `username` VARCHAR(255) UNIQUE NOT NULL, `password` VARCHAR(255) NOT NULL, `role` VARCHAR(50) NOT NULL | Login table present. Password stored as plain text (not hashed). |

**A `users`/login table exists.**

### How to Recreate Tables and Seed Data

Run `npm run db:init` from `backend/` (executes `node db-init.js`). The script:
1. Connects to MySQL server without selecting a database.
2. Creates the `c10p1` database if it does not exist.
3. `DROP TABLE IF EXISTS registrations` then recreates it.
4. `DROP TABLE IF EXISTS users` then recreates it.
5. Inserts 3 seed registrations (Alice/pending, Bob/confirmed, Charlie/cancelled).
6. Inserts 2 seed users (`org`/organizer, `part`/participant).

**Warning:** Every run of `db-init.js` destroys and re-creates both tables. All live data is lost. Acceptable for a prototype; destructive in any persistent environment.

---

## 6. Login and Role/Access Explanation

### How Login Works

1. User submits username + password from the React login form.
2. React POSTs to `POST /api/login` (proxied to Express).
3. Express queries `SELECT id, username, role FROM users WHERE username = ? AND password = ?` (plain-text comparison).
4. On success, returns `{ user: { id, username, role } }`.
5. React stores the user object in `localStorage`.
6. All subsequent API calls send `x-user-id: <user.id>` as a request header.

### How Roles Are Checked

Every protected route calls the `authenticateUser` middleware (`server.js` L36–52):
1. Reads `req.headers['x-user-id']`.
2. Queries `SELECT * FROM users WHERE id = ?`.
3. If found, sets `req.user = row` (containing `role`).
4. The `PUT /api/registrations/:id` route then checks `req.user.role !== 'organizer'` and returns 403 if the caller is not an organizer.

### What Is and Is Not Restricted

| Route | Auth Required | Role Restricted |
|---|---|---|
| `POST /api/login` | No | No |
| `GET /api/health` | No | No |
| `POST /api/registrations` | ✅ (any authenticated user) | ❌ No role restriction — organizer can also create |
| `GET /api/registrations` | ✅ (any authenticated user) | ❌ No role restriction — participants see all rows |
| `PUT /api/registrations/:id` | ✅ | ✅ Organizer only (403 for participant) |

### Record-Level Scoping

**Participants cannot access only their own records.** The `GET /api/registrations` route returns all rows for any authenticated user, regardless of role. Participants see registrations submitted by all other participants. This is a known limitation carried forward from the mid-review (issue C3).

---

## 7. Protected Action Explanation

**Protected actions (from case brief):** Participants must not be able to mark their own attendance or change organizer notes.

### How Protection Is Implemented

| Layer | Implementation |
|---|---|
| Backend route | Single `PUT /api/registrations/:id` handles status, attendance, and organizer_notes. Line 142–144 of `server.js`: `if (req.user.role !== 'organizer') return res.status(403).json(...)`. This fires before any field update — no separate attendance or notes endpoints are needed. |
| UI layer | The attendance button group and "Edit Note" control are rendered exclusively inside the `currentUser.role === 'organizer'` JSX block (`App.jsx` L559). The participant view (`App.jsx` L451) shows only read-only status/attendance badges and a read-only note display. |
| Test proof | Test 6 in `test.js`: participant sends `PUT /api/registrations/:id` with `status: 'confirmed'` → server returns 403. ✔ confirmed in live run. |

**Bypassing the UI does not help:** Even if a participant calls the PUT endpoint directly (via DevTools or Postman), the backend `authenticateUser` middleware + role check blocks the request at the server before any DB write occurs.

---

## 8. Validation Summary

### Server-Side Validation (backend/server.js)

| Rule | Route | Code Location |
|---|---|---|
| Username and password must be strings, ≤ 50 chars | POST /api/login | L57–63 |
| Name required, string, 2–100 chars | POST /api/registrations | L97–99 |
| Email required, string, ≤ 150 chars | POST /api/registrations | L101–103 |
| Email format regex `^[^\s@]+@[^\s@]+\.[^\s@]+$` | POST /api/registrations | L106–109 |
| Workshop title must be in allowed whitelist (3 titles) | POST /api/registrations | L112–119 |
| Registration details ≤ 1000 chars (if provided) | POST /api/registrations | L121–123 |
| Registration ID must be a positive integer | PUT /api/registrations/:id | L149–152 |
| Status must be one of: pending, confirmed, cancelled, waitlisted | PUT /api/registrations/:id | L160–162 |
| Attendance must be one of: present, absent, unmarked | PUT /api/registrations/:id | L163–165 |
| Organizer notes ≤ 1000 chars (if provided) | PUT /api/registrations/:id | L166–168 |
| At least one field must be provided in PUT | PUT /api/registrations/:id | L188–190 |
| SQL injection protection | All DB routes | Parameterised queries (`?` placeholders) throughout |

### Frontend Validation (App.jsx)

| Rule | Location |
|---|---|
| Login: both fields required (JS guard) | L95–98 |
| Registration: name + email required (JS guard) | L138–141 |
| Email: HTML5 `type="email"` attribute | L479 |
| Workshop: select always has a value (no empty option) | L492–498 |

### What Was Not Automated for Validation Tests

The test suite covers email format rejection and workshop title rejection (Test 9). Organizer notes length, name length, and registration details length are validated in code but **not covered by automated tests** — manual verification is required for those cases.

---

## 9. Automated and Manual Testing Summary

### Automated Test Command

```
npm test          (from backend/ directory)
node test.js      (equivalent direct command)
```

**Requires the backend server to be running first** (`npm run dev` in `backend/`).

### What the Tests Check (test.js — 13 assertions, 9 test groups)

| Test | Assertion | Result |
|---|---|---|
| 1 | Organizer login → `{ user: { id, username, role } }`, status 200 | ✔ PASS |
| 2 | Participant login → `{ user: { id, username, role } }`, status 200 | ✔ PASS |
| 3 | Invalid credentials → status 401 | ✔ PASS |
| 4 | Participant creates registration → status 201 + `registrationId` returned | ✔ PASS |
| 5 | Created registration read back from MySQL by name | ✔ PASS |
| 6 | Participant attempts PUT → status 403 | ✔ PASS |
| 7a | Organizer transitions status to `waitlisted` → status 200 | ✔ PASS |
| 7b | Waitlisted status verified in DB | ✔ PASS |
| 7c | Organizer transitions from waitlisted → confirmed + sets attendance + notes | ✔ PASS |
| 8 | All three fields (`status`, `attendance`, `organizer_notes`) verified in DB | ✔ PASS |
| 9a | Invalid email format → status 400 | ✔ PASS |
| 9b | Invalid workshop title → status 400 | ✔ PASS |
| 9c | Non-integer PUT ID → status 400 | ✔ PASS |

**Live test result (2026-06-16):** `🎉 ALL TESTS PASSED SUCCESSFULLY!`

### Test Data Creation and Cleanup

- **Before any test:** `DELETE FROM registrations WHERE email = 'test-runner@example.com'` clears any leftover records from a previous failed run.
- **During tests:** One record with `email: 'test-runner@example.com'` is created.
- **After all tests:** `DELETE FROM registrations WHERE id = ?` (specific ID) removes the test record.
- The 3 seed records (Alice, Bob, Charlie) are **not touched** by the test suite.

### What Was Not Automated

| Gap | Type |
|---|---|
| Client-side filter logic | Not tested — no frontend test suite |
| Organizer notes length cap (1000 chars) | Manual only |
| Name length validation (2–100 chars) | Manual only |
| Registration details length cap (1000 chars) | Manual only |
| `animate-spin` CSS animation rendering | Manual only (visual check) |
| Participant data scoping (seeing all other users' records) | Not tested — known limitation |
| Health check endpoint response | Not tested (endpoint exists, not called in test.js) |

### Manual Checks That Remain

1. Run `npm run db:init` → confirm clean console output with no errors.
2. Log in as `part`/`part` → submit a registration → confirm it appears in the list.
3. Log in as `org`/`org` → use all three filter dropdowns → confirm filter count badge updates.
4. As organizer, click all status buttons → confirm status badge updates instantly.
5. As organizer, click attendance buttons → confirm attendance badge changes.
6. As organizer, click "Edit Note" → type a note → Save → confirm it persists after page refresh.
7. Trigger a page load and observe whether the spinner icon spins (expected: icon visible, no animation — `animate-spin` undefined in CSS).
8. As participant, observe that all other participants' registrations are visible (known limitation C3).

---

## 10. What Changed After Stage 11 (Post-Mid-Review)

Comparing the final files against the mid-review findings:

| Area | Mid-Review Finding | Final State |
|---|---|---|
| Automated tests | ❌ None | ✅ `test.js` — 13 assertions, all pass; cleanup included |
| `npm test` script | ❌ Missing | ✅ Added to `backend/package.json` |
| Email format validation (backend) | ❌ Missing | ✅ Regex added to `POST /api/registrations` (`server.js` L106–109) |
| Length caps on text inputs | ❌ Missing | ✅ Name (2–100), email (≤150), details (≤1000), notes (≤1000), login fields (≤50) |
| Type checks on string inputs | ❌ Missing | ✅ `typeof x !== 'string'` guards added to all POST/PUT fields |
| Workshop title whitelist (backend) | ❌ Missing | ✅ `allowedWorkshops` array added to POST route |
| Invalid PUT ID guard | ❌ Missing | ✅ `isNaN(numericId) \|\| numericId <= 0` check added |
| `waitlisted` status added | Not present at mid-review | ✅ 4th status value added to both front and backend enum |
| Login credentials hint | Present | Still present (unchanged — acceptable for prototype) |
| Plain-text passwords | ❌ Flagged C1 | ❌ Still plain text (not addressed) |
| Spoofable user-ID header | ❌ Flagged C2 | ❌ Still `x-user-id` plain header (not addressed) |
| Participant data scoping | ❌ Flagged C3 | ❌ Still returns all rows (not addressed) |
| `req.req_body \|\| req.body` bug | ❌ Flagged M1 | ❌ Still present in 3 locations |
| POST role restriction (participant only) | ❌ Flagged M2 | ❌ Not addressed |
| `animate-spin` CSS undefined | ❌ Flagged M3 | ❌ Still missing from `index.css` |
| Frontend component decomposition | ❌ Flagged m7 | ❌ Still one 791-line App.jsx |
| Root README / `.env.example` | ❌ Flagged m1/m2 | ❌ Still absent |

**Summary of Stage 11 additions:** Testing infrastructure (test.js + npm script), comprehensive server-side validation (email regex, length caps, type checks, workshop whitelist, numeric ID guard), and the `waitlisted` status bonus feature. Security and structural gaps from the mid-review were **not addressed**.

---

## 11. Stage Drift — Early Implementation

No future-stage features were detected. The implementation contains:
- No payment processing
- No email/SMS notification system
- No certificate generation
- No advanced user management or admin panel
- No file uploads

The only forward-leaning item is the `/api/health` endpoint — a useful operational addition that goes beyond the case brief but is harmless and appropriate for a prototype.

**The `waitlisted` status** is a minor extension beyond the case brief's stated three statuses (pending/confirmed/cancelled). It does not represent premature work; it adds value to the lifecycle and is fully integrated into validation, UI, and tests.

---

## 12. Security Risks and Exposed-Secret Check

### DB Secret Exposure Check

- `backend/.env` contains `DB_PASSWORD` — **password is not printed in this review**.
- `.env` is in `backend/` only and is not referenced by any frontend file.
- Vite does not bundle `backend/` files — the password does not reach the browser.
- **Risk:** If `.env` were committed to a public git repository, credentials would be exposed. No `.gitignore` was observed in the project root. This is an onboarding and deployment risk.

### Security Risks Summary

| Risk | Severity | Status |
|---|---|---|
| Plain-text passwords in `users` table | High | ❌ Not fixed |
| `x-user-id` header is trivially spoofable — any user can impersonate any other user by forging the header | High | ❌ Not fixed |
| Open CORS wildcard (`app.use(cors())`) — any origin can call the API | Medium | ❌ Not fixed |
| No rate limiting on login endpoint — brute-force possible | Medium | ❌ Not fixed |
| No `helmet` middleware — no security-related HTTP headers set | Medium | ❌ Not fixed |
| No HTTPS — credentials transmitted in plain text over HTTP | High (in production) | Acceptable for local prototype |
| Participants see all other participants' records | Medium | ❌ Not fixed |
| Login form displays demo credentials on screen | Low | Acceptable for prototype |
| No `submitted_by` foreign key — no way to scope queries by user | Medium | ❌ Not fixed — data model limitation |
| No `.gitignore` observed | Medium | Risk of `.env` being committed |

---

## 13. Documentation / Code Mismatches

| # | Mismatch | Detail |
|---|---|---|
| D1 | `req.req_body \|\| req.body` — incorrect pattern | `req.req_body` is always `undefined` in Express; `req.body` is always used. The code works accidentally but is factually wrong. Present in `server.js` at L56, L90, and L154. Not mentioned in any documentation as a known issue but flagged in mid-review. |
| D2 | `animate-spin` CSS class referenced but not defined | `App.jsx` L431 (`className={loading ? 'animate-spin' : ''}`) and L528, L625 reference `animate-spin`. This class does not exist in `index.css`. The spinner icon renders but does not animate. No mention of this in any doc except the mid-review flag (M3). |
| D3 | Mid-review states App.jsx was 777 lines at mid-review | Final file is 791 lines — consistent with validation additions and `waitlisted` status. No mismatch, just growth. |
| D4 | Mid-review Issue M4 states "no `users.id` foreign key on registrations prevents participant scoping fix" | The final code still has no `submitted_by` column and the scoping issue was not fixed. The data model documentation in mid-review correctly predicted this as a blocker. |
| D5 | Case brief says "pending, confirmed, or cancelled" for registration status | The implementation adds a 4th status: `waitlisted`. This is an extension, not a contradiction — the case brief does not say the list is exhaustive. |

---

## 14. Known Limitations

1. **No participant data scoping.** `GET /api/registrations` returns all rows for all authenticated users. Participants can see every other participant's name, email, workshop, and registration details. Root cause: no `submitted_by` user ID column in the `registrations` table.

2. **Spoofable authentication.** The `x-user-id` HTTP header is set by the browser and is trivially forgeable. Any user who knows another user's numeric ID can impersonate them. A real system would require a signed JWT or session cookie.

3. **Plain-text passwords.** Passwords are stored and compared as clear text in MySQL. Any database read (accidental or malicious) exposes all credentials.

4. **No role restriction on POST.** Any authenticated user — including the organizer — can submit new registrations. The case brief implies participants register; there is no backend enforcement of this.

5. **Client-side filtering only.** The filter feature loads all rows from the DB before filtering in the browser. For large datasets this is a performance and privacy concern.

6. **`animate-spin` not defined.** The loading spinner icon shows but does not rotate because the CSS animation class is missing from `index.css`.

7. **`req.req_body || req.body` pattern.** A latent bug that accidentally works because `req.req_body` is always `undefined`. Harmless now but misleading and brittle.

8. **Destructive db-init.** Running `npm run db:init` wipes all data in both tables every time. No migration strategy exists.

9. **No root README or `.env.example`.** A new developer has no documented instructions to start the system and must guess the required environment variables.

10. **Single-file frontend.** The entire 791-line React application is in one `App.jsx` file — no component decomposition, making it hard to unit-test or maintain.

11. **No attendance-before-confirmation guard.** The server does not enforce that attendance can only be marked on confirmed registrations. Organizers can mark attendance on pending or cancelled records.

12. **Open CORS.** The API accepts requests from any origin. In a production deployment this would need to be scoped to the specific frontend domain.

---

## 15. Demo Script

**Prerequisite:** Both servers running. DB initialised.

```
Step 1 — OPEN: http://localhost:5173

Step 2 — PARTICIPANT WORKFLOW
  a. Log in as: part / part
  b. Fill the registration form:
       Name: Jane Demo
       Email: jane@demo.com
       Workshop: React Basics for Beginners
       Details: Learning React for a new project
  c. Click "Register Now"
  d. Observe: success banner "Successfully registered! Status is currently Pending."
  e. Observe: new row appears in "My Registration Statuses" list with Pending + Unmarked badges
  f. Note: All other seed registrations (Alice, Bob, Charlie) are also visible — known limitation

Step 3 — LOG OUT
  a. Click "Sign Out" button in header

Step 4 — ORGANIZER WORKFLOW
  a. Log in as: org / org
  b. Observe: organizer portal loads with 4 registrations (3 seed + Jane Demo)
  c. Demonstrate filter: select "React Basics for Beginners" in Workshop Title → count drops to 2
  d. Reset filter to "All Workshops"
  e. On Jane Demo's card:
       Click "Confirmed" in REGISTRATION STATUS → badge changes to Confirmed
       Click "Present" in ATTENDANCE → badge changes to Present
       Click "Edit Note" → type "Verified in demo run" → click Save
  f. Observe: all three updates reflect instantly (optimistic update in UI)

Step 5 — VERIFY PERSISTENCE
  a. Click the Refresh button (circular arrow) in the header
  b. Observe: Jane Demo still shows Confirmed / Present / "Verified in demo run" → data persisted in MySQL

Step 6 — PROTECTION DEMO (requires browser DevTools or Postman)
  a. Log in as participant (part / part)
  b. Open DevTools > Network > find any request > note x-user-id value
  c. In Postman/curl, send:
       PUT http://localhost:5005/api/registrations/1
       Header: x-user-id: 2   (participant's ID)
       Body: { "attendance": "present" }
  d. Observe: 403 Forbidden {"error":"Forbidden: Only organizers can perform this action"}

Step 7 — RUN AUTOMATED TESTS (in a separate terminal)
  cd backend
  npm test
  → All 13 assertions should pass, ending with 🎉 ALL TESTS PASSED SUCCESSFULLY!
```

---

## 16. Suggested Viva Questions

### Architecture and Separation

1. Why is the React frontend and Express backend in separate directories with separate `package.json` files? What would break if you imported `mysql2` directly into App.jsx?
2. What does the Vite proxy in `vite.config.js` do, and why is it needed during development? Would it still be needed in a production build?
3. Explain the flow of a registration from the React form submission to the MySQL insert. Name each file involved.

### Database and Setup

4. What does `npm run db:init` do step by step? What happens to existing data when you run it a second time?
5. Why does `db-init.js` connect to MySQL without specifying a database name first?
6. If you wanted to add a new workshop title, what files would you have to change and why?
7. Why is there no foreign key between `registrations` and `users`? What problem does this cause?

### Login and Roles

8. How does the server know which user is making a request after login? What are the security risks of this approach?
9. What is the difference between authentication and authorisation? Which file implements each in this project?
10. If a participant changes their `x-user-id` header to the organizer's ID in DevTools, what can they now do? How would you fix this?
11. Why are plain-text passwords a problem? What would you change in both `db-init.js` and `server.js` to use hashed passwords?

### Protected Action and Validation

12. A participant tries to mark attendance by sending a PUT request directly to Express. Walk through exactly what happens on the server, line by line, until the 403 is returned.
13. The `PUT /api/registrations/:id` route uses a dynamic query builder. Explain why this is safer than building the SQL string with string concatenation.
14. Why is server-side validation necessary even when the React form already validates the input?
15. The email regex used is `/^[^\s@]+@[^\s@]+\.[^\s@]+$/`. Is this sufficient? What valid emails would it reject or accept incorrectly?

### Testing

16. The test suite uses raw `fetch` calls inside a plain Node.js script rather than Jest or Mocha. What are the trade-offs of this approach?
17. How does the test suite ensure it does not permanently pollute the database? Walk through the cleanup strategy.
18. Test 7a, 7b, and 7c test a `waitlisted → confirmed` status transition. Why are these three separate assertions rather than one?
19. Which features are not covered by the automated tests? How would you write a test for the client-side filter?

### Known Issues and Trade-offs

20. The mid-review identified `req.req_body || req.body` as a latent bug. Explain why it works accidentally and what the correct pattern is.
21. Participants can see all other participants' registrations. Describe the minimum schema change and route change needed to fix this.
22. The `animate-spin` class is referenced in JSX but not defined in CSS. How would you diagnose this without the source code review, and how would you fix it?
23. Open CORS (`app.use(cors())`) is flagged as a security risk. What does CORS protect against, and how would you restrict it to only allow `http://localhost:5173`?
24. The project has no root-level README. If you were handing this project to a new developer, what five pieces of information would you put in the README first?
