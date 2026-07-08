## Case

We need a lightweight web-based Internship Application Tracker where students can submit internship applications and academic coordinators can review, comment on, and approve or reject them. It is a small prototype built with React for the frontend, Node.js/Express for the backend API, and a local MySQL database for persistence.

## Workshop Scope

This workshop will produce a fully functional but minimal prototype that covers:

1. **Student application submission** — Students enter their name, company name, position title, start date, end date, and the submitted date (prefilled to today).
2. **Application viewing** — Students can view their own applications and current status.
3. **Coordinator review workflow** — Coordinators view all applications, add comments, and update status (submitted, under review, approved, rejected).
4. **Filtering** — Both students and coordinators can filter applications by company name or application status.
5. **Basic authentication** — Two role-based login modes: Student and Coordinator.

What is **included** in this session:
- `package.json` setup for client and server
- Express REST API with MySQL (via `mysql2`)
- React UI with forms, list views, and filtering
- Role-based access control (client-side plus server-side enforcement)

## Roles and Responsibilities

| Role | Responsibilities |
|------|-----------------|
| **Student** | Log in, submit an internship application, view their own applications and statuses, filter by company or status. |
| **Coordinator** | Log in, view all applications, add/edit comments, update application status, filter by company or status. |

**Restriction:** A student cannot approve their own applications. A student cannot edit or delete coordinator comments.

## Main Entity and Workflow

**Entity:** `InternshipApplication`

| Field | Type | Notes |
|-------|------|-------|
| `id` | INT (PK, AUTO_INCREMENT) | |
| `student_name` | VARCHAR(150) | |
| `company_name` | VARCHAR(150) | |
| `position_title` | VARCHAR(150) | |
| `start_date` | DATE | |
| `end_date` | DATE | |
| `submitted_date` | DATE | Defaults to today on creation |
| `status` | ENUM('submitted','under_review','approved','rejected') | Default: `submitted` |
| `coordinator_comment` | TEXT | Nullable, editable only by coordinators |
| `created_at` | DATETIME | Auto-managed |
| `updated_at` | DATETIME | Auto-managed |

**Core workflow:**

1. Student logs in as a Student.
2. Student fills in the application form and submits it (status → `submitted`).
3. Coordinator logs in as a Coordinator.
4. Coordinator filters/views applications, updates status, and adds comments.
5. Student refreshes their view to see the current status and any coordinator comments.

## Secondary Feature

**Filtering** by company name (text match) and/or application status (enum) is a secondary (but required) feature. It reduces the review surface area for coordinators and helps students locate specific submissions.

## Out of Scope

- Document uploads (resumes, cover letters, etc.)
- Company supervisor accounts or any external approver
- Payment processing or job postings
- Email / notification system
- Multi-tenant or cloud deployment
- Unit or integration tests (prototype only)
- Admin or user-management features (no user database — role selected at login)

## Assumptions

- There is no user database. Roles are selected via a login toggle (Student / Coordinator) without credential verification — a common prototype simplification.
- The student name submitted is trust-based (no account lookup).
- A single MySQL database runs locally; connection credentials are expected to be configured via environment variables.
- All API routes are protected by a server-side middleware that checks the active role.
- Date fields use ISO format (`YYYY-MM-DD`).
- The application stores one application per "submission event" rather than per student (students can submit multiple applications).
- Filtering uses a simple `LIKE` for company name and exact match for status on the server.
- Both client and server enforce: students cannot approve/reject applications, and only coordinators can edit `coordinator_comment`.

## Missing Details

- How does a coordinator identify *which* student submitted which application? (Currently only `student_name` text — no unique student ID.)
- Are students allowed to edit or resubmit an application after the coordinator has already reviewed it?
- Should there be a maximum or minimum number of applications per student?
- What should happen when an application's end_date is in the past?
- Should the submitted_date be auto-generated or manually entered by the student?
- Database name and table name preferences?
- API request/response format conventions and error code standards?
- Deployment or run instructions for the prototype (e.g., `npm start` conventions)?

## Scope Boundaries

- **In scope**: React client with login toggle, application form, application list with filtering; Express REST API with CRUD + status-update + comment endpoints; MySQL schema with one `internship_applications` table; server-side role enforcement.
- **Out of scope**: User accounts, authentication tokens, email notifications, file uploads, pagination, exports (CSV/PDF), responsive/mobile UI polish, tests, CI/CD.

## Risk Notes

| Risk | Mitigation |
|------|------------|
- MySQL may not be installed or configured on the workshop machine | Provide a `db/init.sql` script and clear step-by-step setup instructions in README; fall back to an SQLite mock if needed.
- CORS issues between React dev server and Express | Configure Express `cors` middleware for `localhost` with explicit port allowances.
- Students accidentally approving their own applications (if role toggle is misused) | Enforce the restriction **server-side** in the status-update endpoint; do not rely solely on client-side disabling.
- Enum mismatch between MySQL and application code | Mirror the enum values in both the MySQL schema and the Express validation layer; validate the status string before update.
- Prototype data persisting between workshop sessions | Ship a `db/reset.sql` script or provide a "clear all data" admin endpoint for demo purposes.
