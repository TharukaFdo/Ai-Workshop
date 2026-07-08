# MID_REVIEW.md — Maintenance Request Tracker
**Review Date:** 2026-06-14  
**Stage:** After secondary feature (filter). Before testing, security hardening, and maintainability cleanup.  
**Reviewer:** Antigravity (AI review pass)  
**Project path:** `backend/` + `frontend/`  
**Stack:** React 18 (Vite) · Node.js/Express · MySQL (mysql2)

---

## 1. Mid-Review Summary

The prototype is runnable end-to-end. The React frontend and Express backend are cleanly separated. The Vite dev-proxy correctly routes `/api/*` calls to `localhost:5000`; the frontend never touches MySQL directly. The backend reads credentials from `.env` variables (`DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`) — none are exposed to the React bundle.

Core workflow is implemented: a requester submits requests; a technician updates status and adds notes; closing a request is restricted to technicians at the backend. Filters by location, priority, and status are present on both the backend query and the UI for both roles.

The most significant issues are: (a) the token scheme is trivially reversible Base64 of a numeric user ID — anyone who knows a user ID can forge a token; (b) passwords are stored and compared in plaintext; (c) the requester visibility rule is coupled to a hardcoded display-name mapping (`alice_req → Alice Requester`) that will silently fail for any other requester account; (d) no CORS origin restriction; (e) a non-standard HTTP 444 status code is used for "not found" instead of 404; (f) no input length or sanitisation beyond required-field checks; and (g) the `schema.sql` seed block uses `ON DUPLICATE KEY UPDATE title=title` which is a no-op guard — any re-run will silently skip duplicates but will not prevent inserting extra rows if keys differ.

A `test.js` integration script was delivered alongside the core code. This is a mild stage-drift item — it was not requested at this stage — but it is a positive artefact and covers the main happy paths and the role-enforcement guard.

---

## 2. Review Scoring Matrix

> Score meaning: 0 = missing · 1 = present but mostly not working · 2 = partially working with major gaps · 3 = mostly working with important gaps · 4 = working with minor gaps · 5 = complete for the selected case scope

| Feature / Area | Functionality 0-5 | Data Persistence 0-5 | Backend Security / Role Control 0-5 | Validation / Error Handling 0-5 | Testing Evidence 0-5 | Maintainability 0-5 | UI / Manual Usability 0-5 | Evidence | Notes |
|---|---:|---:|---:|---:|---:|---:|---:|---|---|
| Project setup and run commands | 4 | — | — | — | — | 3 | — | `README.md`, `package.json` scripts (`dev`, `start`, `db:setup`, `test`) | Two separate start commands needed (no root-level `package.json` / concurrently). README shows `mysql` CLI method; `npm run db:setup` also works but is undocumented in README. |
| Database setup and starter data | 4 | 5 | — | — | — | 3 | — | `schema.sql`, `dbSetup.js`, `npm run db:setup` | Seed uses `ON DUPLICATE KEY UPDATE title=title` (no-op guard on requests). `dbSetup.js` splits SQL by `;` which may break multi-line comments. `schema.sql` includes `CREATE DATABASE` + both tables + seed in one file — repeatable via `db:setup`. |
| Login workflow | 4 | 4 | 2 | 3 | 3 | 3 | 4 | `server.js` L64-90, `App.jsx` L84-112 | DB-backed login confirmed. Token = Base64(userId) — trivially forgeable. No hashing on passwords (plaintext `=` comparison). Session persisted in `localStorage` with `mrt_token` / `mrt_user`. Login error shown in UI. |
| Role-based access | 4 | — | 4 | 3 | 3 | 3 | 4 | `server.js` L136-168 (requester-only create), L172-211 (technician-only update) | Role is re-read from DB on every authenticated request via `authenticateUser` middleware — not trusted from client. UI branching matches backend roles. Technician cannot create; requester cannot update — both enforced server-side. |
| Main create action | 4 | 5 | 4 | 4 | 3 | 3 | 4 | `server.js` L135-169, `App.jsx` L123-160 | POST `/api/requests` requires `requester` role. Fields: title, description, location, priority all validated as required. Priority enum validated. `requester_name` derived server-side from DB user — not from client payload. |
| Main view/list action | 4 | 5 | 4 | 3 | 3 | 3 | 4 | `server.js` L92-133, `App.jsx` L54-82 | GET `/api/requests` gated by `authenticateUser`. Requesters see only their own records (backend WHERE clause). Technicians see all. Loading/error states handled in UI. |
| Main update/status/cancel action | 4 | 5 | 4 | 3 | 3 | 3 | 4 | `server.js` L171-212, `App.jsx` L162-192 | PUT `/api/requests/:id` restricted to technician role at backend. Status enum validated. `closed_at` timestamp set automatically on close and cleared on reopen. No `cancel` action for requesters (out of case scope, acceptable). |
| Protected action | 4 | 5 | 4 | 3 | 3 | 3 | 4 | `server.js` L177-178, `test.js` L93-107 | Add/edit technician notes and close requests are both gated by `role !== 'technician'` check in the PUT handler. `test.js` confirms 403 for requester attempting PUT. UI hides edit panel for requesters. |
| Secondary feature | 4 | — | 4 | 3 | 2 | 3 | 4 | `server.js` L93-133, `App.jsx` L424-487, L534-597 | Filters by location (LIKE), priority (=), status (=) passed as query params to backend. Backend builds WHERE dynamically. Filter UI present for both roles. Clear button present. No debounce on location text input (fires on every keystroke). |
| Case-specific: location, priority, and problem details | 4 | 5 | — | 4 | 2 | 3 | 4 | `schema.sql` L14-26, `server.js` L143-151 | All three fields stored in DB with correct types (VARCHAR/ENUM). Priority enum enforced at DB and API level. Location is free text (VARCHAR 255) — no enum or validation beyond required. Problem detail = description (TEXT). Fields displayed in card UI with icons and priority colour-coding. |
| Case-specific: technician notes and progress updates | 4 | 5 | 4 | 3 | 3 | 3 | 4 | `server.js` L203-206, `App.jsx` L690-699 | `technician_note` stored as TEXT, updated via PUT. Notes visible to requesters in read-only card view. Edit panel available to technicians. No audit trail / append — each save overwrites the previous note. |
| Case-specific: request closure protection and requester visibility | 4 | 5 | 4 | 3 | 3 | 3 | 4 | `server.js` L177-178, L196-201, `App.jsx` L517-521 | Closure gated to technicians backend. `closed_at` recorded. Requester sees technician note in card (read-only). Requester cannot access the edit/update panel (UI-only protection reinforced by backend 403). |
| UI/manual usability | 4 | — | — | 3 | — | 3 | 4 | `index.css`, `App.jsx` styling | Dark theme, colour-coded priorities, status badges. Two-column layout for technician. Sticky update panel. Role label in header. Loading and error states shown. No form validation hints beyond browser `required`. No confirmation dialog before closing a request. |
| Security posture | 1 | — | 2 | 2 | — | 2 | — | `server.js` L9 (`cors()`), L12-24 (token), `db.js` | Passwords plaintext. Token = Base64(userId) — not signed, forgeable. CORS open (`*`). HTTP 444 used instead of 404 (non-standard). No rate limiting. No helmet. No input length caps. No SQL injection risk (parameterised queries used throughout — positive). |
| Testing evidence | 3 | — | — | — | 3 | 2 | — | `backend/test.js`, `package.json` `"test": "node test.js"` | Integration test script covers: login for both roles, unauthorised create (401), valid create (201), validation failure (400), requester trying PUT (403), technician update (200) with DB assertion, and technician close (200) with `closed_at` DB assertion. Requires live DB and running server. No test framework (jest/mocha); uses Node `assert`. No isolated/unit tests. No frontend tests. |
| Maintainability | 3 | — | — | — | — | 3 | — | All source files | All logic in two files (`server.js` 217 lines, `App.jsx` 757 lines). No route splitting or controllers. No component decomposition. Inline styles throughout (no CSS classes). Hardcoded display-name mapping (`alice_req → Alice Requester`) couples DB usernames to UI strings. Magic strings for statuses and priorities repeated across files. No JSDoc/comments beyond basic inline notes. |

---

## 3. Current Feature Status

| Feature | Status |
|---|---|
| Submit maintenance request (title, description, location, priority, requester name) | ✅ Working |
| View own requests (requester scope) | ✅ Working (backend enforced, with caveat — see §5) |
| View all requests (technician scope) | ✅ Working |
| Update request status | ✅ Working |
| Add / edit technician notes | ✅ Working |
| Close request | ✅ Working |
| Filter by location | ✅ Working (LIKE search) |
| Filter by priority | ✅ Working (exact match) |
| Filter by status | ✅ Working (exact match) |
| Clear filters | ✅ Working |
| Display technician notes to requester | ✅ Working (read-only card) |
| Record `closed_at` timestamp | ✅ Working |
| `closed_at` cleared when status moves away from closed | ✅ Working |
| Health check endpoint | ✅ Working |
| Session persistence across page refresh | ✅ Working (localStorage) |

---

## 4. Database and Persistence Status

**Tables present in `schema.sql`:**
- `users` — id, username, password (plaintext), role ENUM('requester','technician') ✅
- `requests` — id, title, description, location, priority ENUM, requester_name, status ENUM, technician_note, created_at, updated_at, closed_at ✅

**Seed data:**
- 2 users: `alice_req` (requester), `bob_tech` (technician) ✅
- 3 seed requests (submitted, inProgress, closed) covering all statuses ✅

**Setup commands:**
- `npm run db:setup` (runs `dbSetup.js` — reads `schema.sql`, splits by `;`, executes each statement) ✅
- Direct: `mysql -u root -p < backend/schema.sql` ✅
- Both paths are repeatable; `CREATE TABLE IF NOT EXISTS` and `ON DUPLICATE KEY UPDATE` guards prevent destructive re-runs ✅

**Issues:**
- `ON DUPLICATE KEY UPDATE title=title` on requests seed is a no-op (no unique constraint on `title`). If the seed is run on an empty table it inserts fine. If run again, it will insert duplicates because the primary key (`AUTO_INCREMENT id`) will differ — guard does not work as intended.
- `dbSetup.js` splits SQL by `;` which may incorrectly split multi-statement strings or comments containing semicolons.
- `db.js` falls back to `maintenance_db` as default database name, but `.env` and `schema.sql` use `c7p2` — inconsistency if `.env` is missing.

---

## 5. Login and Role/Access Status

**Login type:** Database-backed with token issuance ✅  
**Mechanism:** POST `/api/login` queries `users` table by `username` AND `password` (plaintext match). Returns `{ token, user }`.  
**Token format:** `Buffer.from(String(userId)).toString('base64')` — Base64 of the numeric user ID. This is **not a signed JWT or HMAC token** and is trivially forgeable by any party who knows or guesses a user ID.  
**Token validation:** On each protected request, `authenticateUser` decodes the token, queries the DB by the decoded `userId`, and attaches `req.user` — role is always re-read from DB, not trusted from the client ✅  
**Session persistence:** `localStorage` (`mrt_user`, `mrt_token`) ✅  

**Requester visibility scoping (backend):**
```js
// server.js L101-106
if (req.user.role === 'requester') {
  conditions.push('requester_name = ?');
  const displayName = req.user.username === 'alice_req' ? 'Alice Requester' : req.user.username;
  params.push(displayName);
}
```
This hardcodes the mapping `alice_req → Alice Requester`. Any requester whose display name differs from their username will see no requests because the WHERE clause will filter by their raw `username` (e.g., `bob_req`) while stored requests have a different `requester_name`. This is a **logic defect** that will silently break multi-user scenarios.

**Role enforcement summary:**
| Action | UI restriction | Backend restriction |
|---|---|---|
| Create request | Requester form shown only | 403 if role ≠ requester ✅ |
| Update status / add note | Edit panel shown only to technician | 403 if role ≠ technician ✅ |
| Close request | No close UI for requester | 403 if role ≠ technician ✅ |
| View all requests | Technician only | Backend WHERE clause for requester ✅ |

---

## 6. Protected Action Status

**Protected action:** Add or edit technician notes AND close requests.

Both actions use the same `PUT /api/requests/:id` endpoint, which enforces:
```js
if (req.user.role !== 'technician') {
  return res.status(403).json({ error: 'Forbidden: Only technicians can update requests' });
}
```

This check runs **after** the `authenticateUser` middleware confirms the user exists in the DB. A forged or expired token would be caught at authentication first.

The `test.js` script explicitly asserts a 403 when a requester token is used to attempt a PUT — the test will confirm backend enforcement is working when run.

**Gap:** There is no "already closed" guard on the backend. A technician can re-open a closed request by setting status back to `submitted`, `inProgress`, or `completed`. Whether this is intentional is not specified in the case brief.

---

## 7. Validation Status

### Backend Validation

| Check | Present | Location |
|---|---|---|
| Login: username and password required | ✅ | `server.js` L66-68 |
| Create: all fields required | ✅ | `server.js` L144-146 |
| Create: priority must be Low/Medium/High | ✅ | `server.js` L148-151 |
| Update: status required | ✅ | `server.js` L181-183 |
| Update: status must be valid enum value | ✅ | `server.js` L185-188 |
| Request must exist before update | ✅ | `server.js` L191-194 |
| Input length limits | ❌ Missing | — |
| Description/note content sanitisation | ❌ Missing | — |
| Location format validation | ❌ Missing (free text, no constraints) | — |

> **Note:** Non-standard HTTP 444 used for "not found" at `server.js` L193 — should be 404.

### Frontend Validation

| Check | Present | Method |
|---|---|---|
| All create fields required | ✅ | HTML `required` attribute |
| Priority must be selected | ✅ | Always pre-selected (Medium) |
| Status must be selected | ✅ | Always pre-selected (current status) |
| Form error displayed | ✅ | `formError` / `updateError` state |
| Login error displayed | ✅ | `loginError` state |
| No min/max length hints | ❌ Missing | — |
| No field-level inline error messages | ❌ Missing (only banner-level) | — |

---

## 8. Stage Drift / Early Implementation

| Item | Assessment |
|---|---|
| `test.js` integration script | **Mild stage drift** — testing was not part of the current stage scope, but the script is present and covers the main workflows. It is a positive artefact, not a risk. Score it under Testing Evidence. |
| `closed_at` timestamp tracking | **Within scope** — mentioned in the case brief as part of the closure workflow. Not early. |
| `updated_at` auto-update column | **Minor early addition** — not required by the case brief but harmless. |
| `health` endpoint | **Neutral** — standard scaffolding practice, not scope-specific. |
| `.env.example` | **Good practice**, not drift. |

No advanced features from future stages (e.g., email notification, file attachments, audit log, advanced auth) were implemented early.

---

## 9. Issues Found Before Stage 8 (Testing, Security, Maintainability)

### Critical (would fail security hardening)
1. **Forgeable token** — Token is `Base64(userId)`. No signature, no expiry. Any party can forge a valid token by encoding any integer. Must be replaced with HMAC-signed JWT or similar before security hardening.
2. **Plaintext passwords** — Passwords stored and compared without hashing. `bcrypt` or equivalent required.
3. **CORS fully open** — `app.use(cors())` with no origin whitelist. Must be restricted to the Vite dev origin or production domain.

### High (would cause functional failures in testing)
4. **Requester scoping hardcoded** — `alice_req → Alice Requester` mapping in `server.js` L104 breaks all requester accounts other than `alice_req`. The `requests` table does not store `user_id`; it stores a free-text `requester_name`. This mismatch must be resolved (either store `user_id` FK or derive `requester_name` consistently at creation and lookup).
5. **HTTP 444 for not found** — Non-standard code at `server.js` L193. Some HTTP clients and proxies may behave unexpectedly. Replace with 404.
6. **Seed guard ineffective** — `ON DUPLICATE KEY UPDATE title=title` on the requests seed does not prevent duplicate inserts because there is no `UNIQUE` constraint on `title`. Re-running the seed will duplicate seed rows.

### Medium (gaps before testing is reliable)
7. **No input length validation** — Title, description, location, and technician notes have no server-side length cap. DB columns are `VARCHAR(255)` / `TEXT`; oversized inputs would be silently truncated by MySQL or cause DB errors.
8. **No debounce on location filter** — Every keystroke triggers a new API fetch. Under normal latency this is acceptable, but it will produce excessive requests in testing.
9. **No re-open guard** — A technician can set a closed request back to any status. If the case brief intends closure to be permanent, this needs a guard.
10. **`db.js` default database name mismatch** — Falls back to `maintenance_db` if `DB_NAME` env is absent, but the actual database is `c7p2`. A missing `.env` would connect to the wrong (or non-existent) database silently.

### Low (maintainability cleanup)
11. **All logic in two files** — `server.js` (217 lines) and `App.jsx` (757 lines). No route splitting, no React component decomposition.
12. **Magic strings repeated** — Status values (`'submitted'`, `'inProgress'`, etc.) and priority values (`'Low'`, `'Medium'`, `'High'`) are repeated across `server.js`, `App.jsx`, and `schema.sql` without shared constants.
13. **Inline styles throughout App.jsx** — No CSS classes; all styles are inline objects. Makes bulk style changes difficult.
14. **No `.gitignore`** — `.env` (with DB credentials) could be accidentally committed.
15. **README references wrong default DB name** — README does not mention `npm run db:setup`; it only shows the `mysql` CLI method.
16. **`test.js` requires live server and DB** — No mocking. Must document this prerequisite before tests are used in CI.

---

## 10. Manual Checks Recommended Next

1. **Run `npm run db:setup` from scratch** — Verify the script succeeds on a clean MySQL instance and the seed data loads correctly.
2. **Log in as `alice_req`** — Submit a request and confirm it appears in the list. Then log out and log in as `bob_tech` — confirm the request is visible. Then try to update as `alice_req` directly via `curl` / Postman with the requester token — expect 403.
3. **Log in as `bob_tech`** — Update a request status to `inProgress`, add a technician note, then close it. Log back in as `alice_req` — confirm the technician note is visible (read-only) and the status shows "Closed".
4. **Test the filter controls** — Apply each filter individually (location, priority, status) and in combination. Confirm the list updates and the backend returns filtered results.
5. **Test forged token** — Encode `1` or `2` as Base64 and send `Authorization: Bearer <base64>` — confirm the backend accepts it (to document the vulnerability before hardening).
6. **Re-run `npm run db:setup` on an already-seeded DB** — Check for duplicate seed rows.
7. **Check CORS** — Access `http://localhost:5000/api/requests` directly from a different origin to confirm there is no restriction currently.
8. **Try submitting a request with a very long description** — Check whether the backend rejects it or MySQL silently truncates.

---

## 11. Pass/Fail Table

| Check | Result | Note |
|---|---|---|
| App appears runnable | ✅ PASS | Both servers start; separate `npm run dev` in each directory |
| React and Express are separated | ✅ PASS | Distinct `frontend/` and `backend/` directories; no shared code |
| React calls Express routes, never MySQL directly | ✅ PASS | Vite proxy routes `/api/*` to Express; no `mysql2` in frontend |
| Backend uses env vars for DB credentials | ✅ PASS | All five vars present: `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME` |
| Secrets not exposed in React | ✅ PASS | `.env` is backend-only; no env vars referenced in `frontend/` |
| `users` / login table exists | ✅ PASS | `users` table in `schema.sql`; DB-backed login endpoint |
| Repeatable DB setup command | ✅ PASS | `npm run db:setup` — idempotent for table creation; seed guard partial (see Issue #6) |
| Login is database-backed | ✅ PASS | Queries `users` table; not mock-only or role-selector-only |
| Role restrictions enforced in backend | ✅ PASS | `authenticateUser` middleware + role checks on create and update endpoints |
| Protected action (add/edit notes, close) is backend-protected | ✅ PASS | 403 returned for any non-technician attempting PUT |
| Requester limited to own records (backend) | ⚠️ PARTIAL | WHERE clause present but uses hardcoded username-to-name mapping; breaks for any user other than `alice_req` |
| Main workflow implemented (submit → progress → close) | ✅ PASS | All three phases functional end-to-end |
| Filter by location, priority, status implemented | ✅ PASS | Backend query + UI controls for both roles |
| Validation present | ✅ PASS | Required-field and enum checks on backend; `required` attrs on frontend |
| No premature future-stage implementation | ✅ PASS | Minor: `test.js` delivered early (beneficial, not harmful) |
| Passwords hashed | ❌ FAIL | Plaintext passwords stored and compared |
| Token is signed / unforgeable | ❌ FAIL | Base64(userId) — trivially forgeable |
| CORS restricted | ❌ FAIL | Open CORS (`*`) — no origin whitelist |
| HTTP status codes correct | ⚠️ PARTIAL | 444 used for "not found" — should be 404 |
| No `.gitignore` protecting `.env` | ❌ FAIL | `.env` with credentials could be committed |
