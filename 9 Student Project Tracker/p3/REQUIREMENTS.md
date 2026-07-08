# Student Project Tracker - Requirements Specification

## 1. Functional Requirements

### FR-1: Project Submission (Student)
- **Description**: Students must be able to create a project submission.
- **Acceptance Criteria**:
  - A form is provided to input `title`, `description`, `category`, `studentName`, `supervisorName`, and `submittedDate`.
  - When submitted, the project is saved to the database with an initial status of `submitted` and empty `feedback`.
  - `createdAt` and `updatedAt` timestamps must be automatically set.

### FR-2: Update Submission (Student)
- **Description**: Students must be able to update their own project submissions.
- **Acceptance Criteria**:
  - Students can edit the fields: `title`, `description`, `category`, `studentName`, `supervisorName`, and `submittedDate`.
  - Students cannot update the `status` or edit the `feedback` fields.

### FR-3: View and Filter Submissions (Student & Supervisor)
- **Description**: Users can view and filter submissions.
- **Acceptance Criteria**:
  - Students can view and filter their own submissions.
  - Supervisors can view and filter all project submissions.
  - Filter criteria: `supervisorName`, `category`, or `status`.

### FR-4: Supervisor Review & Feedback (Supervisor)
- **Description**: Supervisors must be able to add/edit feedback and update project status.
- **Acceptance Criteria**:
  - Supervisors can select a submission and add/edit `feedback` text.
  - Supervisors can update the project `status` (must be one of: `submitted`, `underReview`, `approved`, `rejected`).
  - `updatedAt` is updated on changes.

---

## 2. Role-Permission Matrix

| Action / Resource | Student | Supervisor | Backend Enforced? |
| :--- | :---: | :---: | :---: |
| **Create Project Submission** | Yes | No | Yes |
| **Update Own Submission Fields** | Yes | No | Yes |
| **View Own Submissions** | Yes | Yes | Yes |
| **View All Submissions** | No | Yes | Yes |
| **Add/Edit Feedback** | No | Yes | Yes |
| **Update Project Status** | No | Yes | Yes |

---

## 3. Authentication & Authorization Mechanism
- **Prototype Auth**: Since full system integration is out of scope, a lightweight database-backed user table or simple session-based role switcher will be used.
- **Role Validation**: All backend endpoints must verify the requester's role (passed via session, simulated header, or token) before permitting state-changing actions.

---

## 4. Validation Rules

- **Required Fields**: `title`, `description`, `category`, `studentName`, `supervisorName`, and `submittedDate` must not be null or empty.
- **Date Format**: `submittedDate` must be a valid date representation.
- **Status Constraints**: `status` field must strictly match one of:
  - `submitted`
  - `underReview`
  - `approved`
  - `rejected`

---

## 5. Failure Cases & Behavior

- **Validation Failures**: Returns HTTP `400 Bad Request` with structured error messages indicating missing or invalid fields.
- **Unauthorized Actions (Student editing feedback or changing status)**: Returns HTTP `403 Forbidden`.
- **Database Connection Failure**: Returns HTTP `500 Internal Server Error` without leaking raw SQL stack traces to the client.

---

## 6. Verification Checklist

### Minimum Automated Tests
- **Backend Unit/Integration Tests**:
  - Test creation of project submission with valid data (expects HTTP `201`).
  - Test creation with missing required fields (expects HTTP `400`).
  - Test supervisor updating project status/feedback (expects HTTP `200`).
  - Test student attempting to update project status/feedback (expects HTTP `403`).
  - Test filtering submissions by supervisor, category, and status.

### Manual Verification
- Verify the frontend prevents students from interacting with status and feedback controls.
- Verify environment variables (`.env`) properly hide DB credentials and are not compiled/exposed in the client bundle.
