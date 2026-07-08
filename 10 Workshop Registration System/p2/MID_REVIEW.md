# Mid-Project Review — Workshop Registration System

**Case:** 10 – Workshop Registration System (p2)
**Review date:** 2026-06-15
**Stage assessed:** After secondary feature (filter) stage; before testing, security hardening, and maintainability cleanup.
**Reviewer note:** Review-only. No source files, schema, seed data, packages, or tests were created or modified.

---

## 1. Mid-Review Summary

The prototype is structurally well-formed and covers the full described scope without obvious stage drift. The React + Express + MySQL separation is clean. All core and secondary features are present and connected to the database. Backend role enforcement is in place. The main gaps at this stage are minor: passwords are stored in plain text (a hardening task), no participant cancel/self-cancel UI exists (ambiguous in the brief), the workshop list is a hard-coded constant in three separate JSX files rather than a DB-driven table, and no test files or test tooling exist. The project is runnable as-is given a local MySQL instance.

---

## 2. Review Scoring Matrix

> Score meaning: 0 = missing · 1 = present but mostly not working · 2 = partially working with major gaps · 3 = mostly working with important gaps · 4 = working with minor gaps · 5 = complete for the selected case scope

| Feature / Area | Functionality 0-5 | Data Persistence 0-5 | Backend Security / Role Control 0-5 | Validation / Error Handling 0-5 | Testing Evidence 0-5 | Maintainability 0-5 | UI / Manual Usability 0-5 | Evidence | Notes |
|---|---:|---:|---:|---:|---:|---:|---:|---|---|
| Project setup and run commands | 5 | 5 | — | — | 0 | 4 | — | `README.md`, `package.json` scripts in both dirs | Both `npm run dev` commands and `db:setup`/`db:reset` documented; no test runner configured |
| Database setup and starter data | 5 | 5 | — | — | 0 | 4 | — | `schema.sql`, `scripts/setupDb.js`, `scripts/resetDb.js` | Idempotent setup + full reset + demo seed; passwords plain text (hardening gap) |
| Login workflow | 5 | 5 | 3 | 4 | 0 | 3 | 5 | `server.js` L60–99, `OrganizerLogin.jsx` | DB-backed token auth works; plain-text password compare (no bcrypt); credentials displayed in UI hint |
| Role-based access | 5 | 5 | 5 | 4 | 0 | 4 | 4 | `server.js` L110–112, L165–167, L214–223 | All protected routes verify role from DB token lookup; not trust-client |
| Main create action | 5 | 5 | 5 | 4 | 0 | 4 | 5 | `server.js` L102–128, `ParticipantRegistration.jsx` | POST `/api/registrations` requires participant token; name, email, workshop required; email regex on client |
| Main view/list action | 5 | 5 | 5 | 4 | 0 | 3 | 5 | `server.js` L131–160 (participant), L163–197 (organizer) | Participant sees only own rows (userId scoped); organizer sees all; both return DB rows |
| Main update/status/cancel action | 4 | 5 | 4 | 4 | 0 | 3 | 4 | `server.js` L200–257, `OrganizerDashboard.jsx` | Organizer can update status (pending/confirmed/cancelled); participant cannot change attendance/notes; no participant self-cancel UI exists |
| Protected action | 5 | 5 | 5 | 4 | 0 | 4 | 4 | `server.js` L220–223, L235–243 | `attendanceStatus` and `organizerNote` updates are silently ignored or 403'd for non-organizers at route level |
| Secondary feature | 5 | 5 | 4 | 3 | 0 | 3 | 5 | `server.js` L132–150 (participant), L169–188 (organizer); both JSX files | Filter by workshopTitle, status, attendanceStatus on both organizer and participant views; filter uses exact-match only (no partial/LIKE) |
| Case-specific: registration details and workshop title tracking | 5 | 5 | — | 4 | 0 | 3 | 5 | `schema.sql` L20–21, `setupDb.js` seed | `workshopTitle` and `registrationDetails` stored in DB; workshop chosen from fixed dropdown (not a DB-driven workshops table) |
| Case-specific: registration status and attendance status lifecycle | 5 | 5 | 4 | 3 | 0 | 3 | 5 | `schema.sql` L22–23; ENUM definitions | Status: pending → confirmed/cancelled; attendanceStatus: notMarked → present/absent; both ENUMs enforced at DB level; no lifecycle guards in server (e.g., no block on marking attendance of cancelled registration) |
| Case-specific: organizer notes and attendance protection | 5 | 5 | 5 | 4 | 0 | 4 | 5 | `server.js` L220–223, L240–243 | Protected in backend; organizer dashboard has inline note editing with Save button; participant view shows no note field |
| UI/manual usability | 5 | — | — | 4 | 0 | 3 | 5 | All JSX files | Dark glassmorphic design, filter controls, status/attendance badges, loading states, error messages present throughout |
| Security posture | 2 | — | 3 | — | 0 | 2 | — | `server.js`, `db.js`, `.env`, `.gitignore` | `.env` excluded from git; secrets in env vars; CORS open (`*`); plain-text passwords; no rate limiting; no input sanitisation beyond required-field checks |
| Testing evidence | 0 | 0 | 0 | 0 | 0 | 0 | 0 | No test files found | No test framework, no test files, no test scripts in `package.json` |
| Maintainability | 3 | — | — | — | 0 | 3 | — | All source files | Single-file server (~260 lines, manageable); WORKSHOPS constant duplicated across 3 JSX files; no JSDoc/comments; no router split; no API client abstraction in frontend |

---

## 3. Current Feature Status

| Feature | Implemented | Notes |
|---|:---:|---|
| Participant registers for workshop | ✅ | Name, email, workshop title, registration details; status defaults to `pending` |
| Participant views own registration status | ✅ | Scoped to `userId`; shows status + attendance badges |
| Participant filters own registrations | ✅ | By workshop, status, attendance via `/api/registrations/status` query params |
| Participant self-cancel registration | ⚠️ | Backend allows participant to update `status` on own record, but no cancel button in `ParticipantStatus.jsx` UI |
| Organizer views all registrations | ✅ | Full list from `/api/registrations` (organizer only) |
| Organizer filters registrations | ✅ | By workshop, status, attendance via query params |
| Organizer updates registration status | ✅ | Dropdown in dashboard table: pending / confirmed / cancelled |
| Organizer marks attendance | ✅ | Dropdown in dashboard table: notMarked / present / absent |
| Organizer adds/edits notes | ✅ | Inline text input + Save button in dashboard |
| Participant blocked from marking attendance | ✅ | Backend enforces 403 |
| Participant blocked from editing notes | ✅ | Backend enforces 403 |

---

## 4. Database and Persistence Status

| Item | Status | Detail |
|---|:---:|---|
| `users` table | ✅ | `id`, `username`, `password`, `role`, `session_token`, `created_at` |
| `registrations` table | ✅ | All required fields present (see below) |
| `workshopTitle` column | ✅ | `VARCHAR(255)` on registrations |
| `registrationDetails` column | ✅ | `TEXT` on registrations |
| `status` ENUM | ✅ | `pending`, `confirmed`, `cancelled` |
| `attendanceStatus` ENUM | ✅ | `notMarked`, `present`, `absent` |
| `organizerNote` column | ✅ | `TEXT`, nullable |
| `userId` foreign key | ✅ | References `users.id`; `ON DELETE SET NULL` |
| Idempotent setup command | ✅ | `npm run db:setup` (CREATE IF NOT EXISTS + seed) |
| Full reset command | ✅ | `npm run db:reset` (DROP + re-setup) |
| `schema.sql` file | ✅ | Present; used by `setupDb.js` |
| Seed data | ✅ | 1 organizer, 1 participant, 3 demo registrations |
| Password hashing | ❌ | Plain-text stored and compared (hardening gap) |
| Separate workshops table | ❌ | Workshop list is a hard-coded JS constant in 3 files |

**`registrations` schema columns confirmed:**
`id`, `participantName`, `email`, `workshopTitle`, `registrationDetails`, `status`, `attendanceStatus`, `organizerNote`, `userId`, `createdAt`, `updatedAt`

---

## 5. Login and Role/Access Status

| Check | Result | Detail |
|---|:---:|---|
| Login is database-backed | ✅ | `SELECT … WHERE username = ? AND password = ?` against `users` table |
| Login is mock-only | ❌ | Not mock; fully DB-backed |
| Login is role-selector-only | ❌ | Not a role selector; real credentials required |
| Session token generated | ✅ | `crypto.randomBytes(32)` stored in `users.session_token` |
| Token verified from DB on every request | ✅ | `authenticateSession` middleware re-reads `role` from DB (no JWT decode; cannot be spoofed client-side) |
| Role stored client-side only | ❌ | Role is re-read from DB on every authenticated call |
| Organizer-only routes protected | ✅ | `GET /api/registrations`, `PUT /api/registrations/:id` for attendance/notes |
| Participant-only routes protected | ✅ | `POST /api/registrations` checks `role === 'participant'` |
| Participant scoped to own records | ✅ | `GET /api/registrations/status` uses `WHERE userId = req.user.id` |
| Default credentials shown in UI | ⚠️ | `OrganizerLogin.jsx` L83–84 shows `organizer/password123` and `participant/password123` in the login page (acceptable for prototype, should be removed before production) |

---

## 6. Protected Action Status

**Protected actions:** mark attendance, edit organizer notes.

| Check | Result | Detail |
|---|:---:|---|
| Backend blocks participant from setting `attendanceStatus` | ✅ | `server.js` L220–223: 403 if non-organizer sends `attendanceStatus` |
| Backend blocks participant from setting `organizerNote` | ✅ | `server.js` L220–223: 403 if non-organizer sends `organizerNote` |
| Backend also silently skips if role check passes incidentally | ✅ | L235–243: `attendanceStatus` and `organizerNote` only added to UPDATE if `req.user.role === 'organizer'` (double guard) |
| Ownership check for participant updates | ✅ | `server.js` L216–218: participant can only update their own registration |
| UI hides attendance/notes controls from participant | ✅ | `ParticipantStatus.jsx` has no attendance or note editing UI |
| ENUM validation at DB layer | ✅ | MySQL ENUM will reject out-of-range values |

---

## 7. Validation Status

| Location | Type | Detail |
|---|---|---|
| `OrganizerLogin.jsx` L13–16 | Client | Empty username/password rejected before fetch |
| `ParticipantRegistration.jsx` L34–46 | Client | Name required; email required; email regex validated |
| `server.js` L62–63 | Backend | Login requires `username` and `password` |
| `server.js` L105–107 | Backend | Registration requires `participantName`, `email`, `workshopTitle` |
| `server.js` L207–209 | Backend | PUT 404 if registration not found |
| `server.js` L245–247 | Backend | PUT 400 if no valid update fields supplied |
| DB ENUM | DB | `status` and `attendanceStatus` constrained by MySQL ENUM |

**Gaps in validation:**
- No backend email format validation (only client-side regex)
- No duplicate-registration guard (same user + same workshop can be inserted multiple times)
- No status transition guard (e.g., can mark `present` on a `cancelled` registration)
- Workshop title is a free string at the API level; any value is accepted (client uses a fixed dropdown, but direct API calls are unrestricted)

---

## 8. Stage Drift / Early Implementation

No future-stage features appear to have been implemented early. The project does not include:
- Payment or certificate logic
- Email reminders
- Audit/history tables
- Rate limiting or bcrypt (appropriately left for security hardening)
- Automated tests (appropriately left for testing stage)
- Admin/super-user role beyond organizer

The secondary (filter) feature is fully present, which is consistent with the stated review point (after secondary feature stage).

---

## 9. Issues Found Before Stage 8

### Critical / Blocking
| # | Issue | Location | Impact |
|---|---|---|---|
| C1 | Passwords stored and compared as plain text | `server.js` L69, `setupDb.js` L57/70 | Credential exposure if DB is dumped; must be resolved in security hardening stage |

### High / Functional Gaps
| # | Issue | Location | Impact |
|---|---|---|---|
| H1 | No participant self-cancel UI | `ParticipantStatus.jsx` | Participant cannot cancel from the UI even though the backend allows it (route only partially blocks this) |
| H2 | No duplicate-registration guard | `server.js` L114–128 | Same participant can register for the same workshop multiple times |
| H3 | CORS is completely open (`cors()` with no options) | `server.js` L10 | Any origin can call the API; acceptable for local dev, must be restricted in hardening |
| H4 | Workshop list hard-coded in 3 JSX files | `ParticipantRegistration.jsx`, `ParticipantStatus.jsx`, `OrganizerDashboard.jsx` | Adding a workshop requires changing 3 files; API accepts any free-text workshop title |

### Medium / Quality
| # | Issue | Location | Impact |
|---|---|---|---|
| M1 | Default credentials displayed in login UI | `OrganizerLogin.jsx` L83–84 | Development convenience only; must be removed before any public deployment |
| M2 | No status transition lifecycle guard | `server.js` L200–257 | Organizer can mark attendance on a `cancelled` registration; logically inconsistent |
| M3 | No backend email format validation | `server.js` L105–107 | Direct API calls bypass client-side email regex |
| M4 | `alert()` used for update errors in organizer dashboard | `OrganizerDashboard.jsx` L100 | Native browser alert breaks UX consistency |
| M5 | `useEffect` dependency array omits `fetchStatus`/`fetchRegistrations` | `ParticipantStatus.jsx` L54–56, `OrganizerDashboard.jsx` L71–73 | ESLint `exhaustive-deps` violation; unlikely to cause bugs but is a lint issue |

### Low / Maintainability
| # | Issue | Location | Impact |
|---|---|---|---|
| L1 | All Express routes in a single file | `server.js` | Manageable at this size; becomes unwieldy if routes grow |
| L2 | No API client abstraction in frontend | All JSX pages | Raw `fetch` calls with repeated token header boilerplate in every component |
| L3 | No JSDoc or inline comments on middleware/helpers | `server.js` | Minimal; reviewers must read code closely |
| L4 | No `.gitignore` at root (only in `frontend/`) | Root dir | `backend/.env` has its own protection but root-level `.gitignore` is absent |

---

## 10. Manual Checks Recommended Next

1. **Run `npm run db:setup` from `backend/`** and confirm the `c10p2` database, `users`, and `registrations` tables are created with seed data.
2. **Start backend** (`npm run dev` in `backend/`) and hit `GET /api/health` — confirm `{ status: "OK", database: "Connected" }`.
3. **Start frontend** (`npm run dev` in `frontend/`) and verify it proxies to port 8081 correctly.
4. **Login as `participant / password123`** — confirm redirect to "My Registrations", confirm dashboard is not accessible.
5. **Submit a new registration** as participant — confirm it appears in "My Registrations" with `pending` status.
6. **Login as `organizer / password123`** — confirm all registrations are visible.
7. **Change a registration status** from `pending` to `confirmed` — confirm DB update persists on page refresh.
8. **Mark attendance** on a registration — confirm it persists.
9. **Add/edit an organizer note** and save — confirm it persists.
10. **Apply each filter** (workshop, status, attendance) on both views — confirm results narrow correctly.
11. **Try to call `PUT /api/registrations/:id`** with `{ "attendanceStatus": "present" }` using a participant token — confirm 403 response.
12. **Try to call `GET /api/registrations`** with a participant token — confirm 403 response.
13. **Verify `.env` is not tracked by git** (`git status` should not list `backend/.env`).

---

## 11. Pass / Fail Table

| Check | Result | Detail |
|---|:---:|---|
| App appears runnable | ✅ Pass | Both `npm run dev` commands present; `node_modules` exist in both dirs; `README.md` covers full setup |
| React frontend and Express backend are separated | ✅ Pass | `frontend/` and `backend/` are independent projects with separate `package.json` |
| React calls Express routes and never connects to MySQL directly | ✅ Pass | All DB access is in `server.js` via `db.js`; frontend uses only `fetch('/api/…')` |
| Backend uses all five DB env vars without exposing secrets in React | ✅ Pass | `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME` all used in `db.js`; React has no `.env` and no DB config |
| Needed database tables exist (`users`, `registrations`) | ✅ Pass | Both defined in `schema.sql` and created by `setupDb.js` |
| Users/login table exists | ✅ Pass | `users` table with `username`, `password`, `role`, `session_token` |
| Repeatable database setup or seed command | ✅ Pass | `npm run db:setup` (idempotent) and `npm run db:reset` (drop + re-seed) |
| Login is database-backed | ✅ Pass | Queries `users` table; not mock-only or role-selector-only |
| Role restrictions enforced in backend | ✅ Pass | `authenticateSession` re-reads role from DB; routes check `req.user.role` |
| Mark attendance appears protected | ✅ Pass | 403 returned for non-organizer at backend; double-guarded in update builder |
| Edit organizer notes appears protected | ✅ Pass | 403 returned for non-organizer at backend |
| Users limited to own records where relevant | ✅ Pass | Participant status route uses `WHERE userId = req.user.id` |
| Main workflow implemented (register → status update → attendance marking) | ✅ Pass | POST register, PUT status update, PUT attendance marking all working |
| Secondary feature implemented (filter by workshop, status, attendance) | ✅ Pass | All three filters on both organizer and participant views |
| Validation present | ⚠️ Partial | Required fields checked; email regex client-side only; no duplicate guard; no transition guard |
| No future-stage features implemented early | ✅ Pass | No payments, certificates, audit logs, bcrypt, or tests introduced prematurely |
| Missing before testing/hardening stages | ⚠️ See §9 | Plain-text passwords (C1), no duplicate guard (H2), open CORS (H3), alert() for errors (M4) |
