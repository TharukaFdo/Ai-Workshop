# REQUIREMENTS — Internship Application Tracker

## 1. Must-Have Requirements

| ID | Requirement |
|----|-------------|
| **R01** | **Student Login** — Users can select a role (Student or Coordinator) to enter the application. |
| **R02** | **Submit Application (Student)** — Students can submit a complete internship application with all required fields. |
| **R03** | **View Own Applications (Student)** — Students can view a list of their own submitted applications with current status and coordinator comments. |
| **R04** | **Edit Own Application (Student)** — Students can edit their own application details when status is `submitted` or `under_review`. |
| **R05** | **Filter Applications (All Roles)** — Students and coordinators can filter the application list by company name and/or status. |
| **R06** | **Review Application (Coordinator)** — Coordinators can view all applications, including student-submitted fields and any existing comments. |
| **R07** | **Add / Edit Coordinator Comment** — Coordinators can add or edit a comment on any application. |
| **R08** | **Update Application Status (Coordinator)** — Coordinators can change an application status between the four defined values. |
| **R09** | **Server-Side Role Enforcement** — All actions are enforced server-side by role; client-side restrictions are supplementary only. |
| **R10** | **Data Validation** — All form submissions are validated on the server before database insertion or update. |

---

## 2. Acceptance Criteria

### AC-R01 — Student Login
- [ ] The landing page presents a role selection toggle (Student / Coordinator).
- [ ] Selecting a role stores it in session storage and redirects to the role-appropriate dashboard.
- [ ] No credentials are required.

### AC-R02 — Submit Application (Student)
- [ ] A student sees a form with fields: `studentName`, `companyName`, `positionTitle`, `startDate`, `endDate`, `submittedDate`.
- [ ] The `submittedDate` field is pre-filled with the current date (read-only) or user-editable depending on preference.
- [ ] On submit, a `POST /api/applications` request is made.
- [ ] The server validates all required fields; invalid submissions return HTTP 400 with field-level errors.
- [ ] On success, the application is stored with `status` set to `submitted` and `coordinatorComment` set to `NULL`.
- [ ] The client displays a success message and navigates to the applications list.

### AC-R03 — View Own Applications (Student)
- [ ] The student dashboard displays all applications where `studentName` matches the login name.
- [ ] Each row shows: `companyName`, `positionTitle`, `status`, `coordinatorComment`.
- [ ] Rows are sorted by `createdAt` descending.
- [ ] Filtering by company name and/or status updates the displayed rows.

### AC-R04 — Edit Own Application (Student)
- [ ] The student sees an edit button on each row of their application list.
- [ ] The edit form matches the submit form with pre-filled values.
- [ ] Editing is only allowed when `status` is `submitted` or `under_review`; otherwise the edit button is disabled with a tooltip.
- [ ] On save, a `PATCH /api/applications/:id` request is made; the server verifies the logged-in student name matches the application's `studentName`.
- [ ] `coordinatorComment` is never displayed in the edit form.

### AC-R05 — Filter Applications (All Roles)
- [ ] A filter bar with two inputs exists on every application list view: `companyName` (text) and `status` (dropdown).
- [ ] Submitting the filter issues a GET request with query parameters `?companyName=&status=` (empty string = no filter on that field).
- [ ] Server uses `LIKE` for `companyName` and `=` for `status`.
- [ ] A "Clear" button resets both filters immediately.

### AC-R06 — Review Application (Coordinator)
- [ ] The coordinator dashboard displays all applications from the database (respecting filters).
- [ ] Each row shows: `studentName`, `companyName`, `positionTitle`, `startDate`, `endDate`, `submittedDate`, `status`, `coordinatorComment`.
- [ ] Clicking an application opens a detail view with all fields and a comment editor.

### AC-R07 — Add / Edit Coordinator Comment
- [ ] The coordinator detail view includes a `coordinatorComment` textarea.
- [ ] Saving the comment issues a `PATCH /api/applications/:id/comment` request with the role enforced as `coordinator`.
- [ ] The server rejects the request if the active role is not `coordinator` (HTTP 403).
- [ ] The comment persists to the database and is reflected immediately on the client.

### AC-R08 — Update Application Status (Coordinator)
- [ ] The coordinator detail view includes a status dropdown with values: `submitted`, `under_review`, `approved`, `rejected`.
- [ ] Saving the status issues a `PATCH /api/applications/:id/status` request.
- [ ] The server rejects the request if the active role is not `coordinator` (HTTP 403).
- [ | ] **Critical check:** the server verifies that the application's `studentName` does not match any coordinator identity (in this prototype, the role check itself is sufficient since only coordinators can send the request).
- [ | ] The server validates that the new status is one of the four allowed values.
- [ | ] On success, the `updated_at` column is refreshed.

### AC-R09 — Server-Side Role Enforcement
- [ ] Every write endpoint (`POST`, `PATCH`, `DELETE`) checks the active role from the session/headers.
- [ ] The `PATCH /applications/:id/status` endpoint rejects non-coordinator roles with HTTP 403.
- [ | ] The `PATCH /applications/:id/comment` endpoint rejects non-coordinator roles with HTTP 403.
- [ | ] The `PATCH /applications/:id` endpoint for students verifies the requesting `studentName` matches the application `studentName`.

### AC-R10 — Data Validation
- [ | ] Server-side validation rejects missing or empty `studentName`, `companyName`, `positionTitle`, `startDate`, `endDate`, and `submittedDate`.
- [ | ] `startDate` and `endDate` must be valid ISO dates; `endDate > startDate` is enforced.
- [ | ] `status` on update must be one of: `submitted`, `under_review`, `approved`, `rejected`.
- [ | ] Invalid input returns HTTP 400 with a JSON body of `{ errors: [{ field, message }] }`.

---

## 3. Role-Permission Matrix

| Action | Student | Coordinator |
|--------|:-------:|:-----------:|
| Login (select role) | ✅ | ✅ |
| Submit new application | ✅ | ❌ |
| View own applications | ✅ | ❌ |
| View all applications | ❌ | ✅ |
| Edit own application (status `submitted` or `under_review`) | ✅ | ❌ |
| Edit any application | ❌ | ❌ |
| Update application status | ❌ | ✅ |
| View coordinator comments | ✅ | ✅ |
| Add coordinator comment | ❌ | ✅ |
| Edit coordinator comment | ❌ | ✅ |
| Filter by company name | ✅ | ✅ |
| Filter by status | ✅ | ✅ |
| View non-owned application details | ❌ | ✅ |

---

## 4. Validation Rules

| Field | Rules |
|-------|-------|
| `studentName` | Required, string, min 2 chars, max 150 chars, no pure whitespace. |
| `companyName` | Required, string, min 2 chars, max 150 chars. |
| `positionTitle` | Required, string, min 2 chars, max 150 chars. |
| `startDate` | Required, valid date, must be before or equal to `endDate`. |
| `endDate` | Required, valid date, must be after `startDate`. |
| `submittedDate` | Required, valid date, defaults to current date on creation. |
| `status` | One of: `submitted`, `under_review`, `approved`, `rejected`. Only changeable by coordinator via PATCH. |
| `coordinatorComment` | Optional, string, max 2000 chars. Only changeable by coordinator via PATCH. |

**Date format:** ISO 8601 (`YYYY-MM-DD`).

**Server-side date validation:** reject dates that are not parseable or are `Invalid Date`.

**Null checks:** reject `null` or empty-string inputs for required fields (`studentName`, `companyName`, `positionTitle`, `startDate`, `endDate`).

---

## 5. Protected Actions (Backend-Enforced)

| Endpoint | Method | Protected By | Protection Detail |
|----------|--------|-------------|-------------------|
| `/api/applications` | POST | Role check | Only `student` role allowed. |
| `/api/applications/:id` (edit) | PATCH | Role + ownership | `student` role with `studentName` match. Rejects coordinators. |
| `/api/applications/:id/status` | PATCH | Role check | Only `coordinator` role allowed. Rejects students. |
| `/api/applications/:id/comment` | PATCH | Role check | Only `coordinator` role allowed. Rejects students. |
| `/api/applications` (list) | GET | Role check | Students see only their own rows; coordinators see all rows. |

**Enforcement mechanism:** The Express middleware reads the active role from session storage (transmitted via request headers or cookies). If the role does not match the endpoint expectation, the middleware returns HTTP 403 with `{ error: "Forbidden: insufficient role" }`.

---

## 6. Authentication / Identity Mechanism

Since this is a prototype without user accounts, identity is established at login time:

- The role selection on the login page stores `{ role, studentName }` in **session storage**.
- Every API request includes these values in a `X-Role` and `X-Student-Name` header (or cookie).
- The Express middleware (`requireRole`) verifies the role and validates it against the endpoint's permission table.
- No password or token is required. For production, this mechanism should be replaced with a real auth system (JWT, sessions, OAuth, etc.).

**Database backup:** No login table is required. If an auth mechanism is desired for future extension, the schema should include:

```sql
CREATE TABLE users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role ENUM('student', 'coordinator') NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

This table is **not** part of the current prototype scope.

---

## 7. Failure Cases

| Case | Expected Behavior |
|------|-------------------|
| Missing `studentName` on submit | HTTP 400, `{ errors: [{ field: "studentName", message: "is required" }] }` |
| `endDate < startDate` | HTTP 400, `{ errors: [{ field: "endDate", message: "must be after startDate" }] }` |
| Empty `coordinatorComment` | Accepted — the field is optional. Set to `NULL` if empty. |
| Student attempts to update status | HTTP 403, `{ error: "Forbidden: insufficient role" }` |
| Student attempts to edit another student's application | HTTP 403, `{ error: "Forbidden: does not own this application" }` |
| Coordinator updates status with invalid value | HTTP 400, `{ errors: [{ field: "status", message: "must be one of: submitted, under_review, approved, rejected" }] }` |
| MySQL connection failure on API startup | Server logs error; all API endpoints return HTTP 503 with `{ error: "Database unavailable" }`. |
| MySQL query error during runtime | HTTP 500, `{ error: "Internal server error" }`. |
| CORS error (React dev server on port 3000, Express on 5000) | `cors` middleware configured to allow `http://localhost:3000`. |
| Filtered list returns no results | Display "No applications found" message (not an error). |
| Client navigates without role set | Redirect to login page. |

---

## 8. Minimum Automated Tests

| Test Category | Test Cases |
|---------------|-----------|
| **API — POST /applications** | - Validates all required fields (5 sub-tests for each missing field).<br>- Rejects `endDate < startDate`.<br>- Accepts valid payload and inserts row.<br>- Rejects non-student role with 403. |
| **API — PATCH /applications/:id (student edit)** | - Validates ownership (`studentName` match).<br>- Rejects edit when status is `approved` or `rejected`.<br>- Accepts valid edit within allowed statuses. |
| **API — PATCH /applications/:id/status (coordinator)** | - Rejects student role with 403.<br>- Validates valid status enum value.<br>- Accepts valid status update by coordinator. |
| **API — PATCH /applications/:id/comment (coordinator)** | - Rejects student role with 403.<br>- Accepts valid comment by coordinator.<br>- Accepts empty/null comment (optional field). |
| **API — GET /applications** | - Student: returns only own applications.<br>- Coordinator: returns all applications.<br>- Filters by `companyName` and `status`. |
| **Database — Schema** | - Verify `internship_applications` table has all required columns, correct types, and defaults. |

---

## 9. Manual Verification Checklist

| Check | Method |
|-------|--------|
| Student submits a complete application | Login as Student → fill form → submit → verify DB row with `status=submitted` |
| Student sees only own applications | Submit as Student A → login as Student B → verify Student A's apps are not visible |
| Student cannot edit approved application | Set status to `approved` as coordinator → login as student → verify edit button is disabled |
| Student cannot approve own application | Login as Student → attempt PATCH /status → verify 403 response |
| Student cannot edit coordinator comment | Login as Student → verify comment field is not editable / not present in edit form |
| Coordinator edits any application | Login as Coordinator → edit any app → verify DB update |
| Coordinator adds comment | Login as Coordinator → add comment → verify persistence |
| Filter by company name (text match) | Enter partial company name → verify filtered results |
| Filter by status | Select status → verify filtered results |
| Clear filters | Click Clear → verify all results reappear |
| Start date equals end date | Submit with same dates → verify 400 error |
| Server validates all fields | Send partial payload → verify all missing fields return errors |
| Endpoints return correct HTTP codes | 200 (GET success), 201 (POST success), 200 (PATCH success), 400 (validation), 403 (forbidden), 503 (DB error) |

---

## 9. Out of Scope

This document does **not** cover:
- User registration or password-based authentication
- Document/file uploads (resumes, cover letters, offer letters)
- Company supervisor or external approver accounts
- Placement/job matching algorithms
- Email or push notifications
- CSV/PDF export of applications
- Pagination or infinite scroll for large datasets
- Mobile-responsive or accessibility compliance
- Integration testing or end-to-end UI tests
- Multi-database or cloud deployments
- Admin panels for user management
