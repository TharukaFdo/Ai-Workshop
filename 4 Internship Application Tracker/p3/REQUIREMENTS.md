# Internship Application Tracker - Requirements Specification

This document details the functional and non-functional requirements for the Internship Application Tracker prototype.

---

## 1. Role-Permission Matrix

| Action / Resource | Student | Coordinator | Backend Enforced? |
| :--- | :---: | :---: | :---: |
| **Submit New Application** | Yes | No | Yes (Only students can submit) |
| **View Own Applications** | Yes | Yes (As part of all) | Yes (Student filtered by user ID) |
| **View All Applications** | No | Yes | Yes (Coordinator only) |
| **Update Own Application Details** | Yes (If status is `changesRequested`) | No | Yes (Checked on update API; status resets to `submitted`) |
| **Update Application Status** | No | Yes | Yes (Only coordinators can transition status) |
| **Add / Edit Coordinator Comments** | No | Yes | Yes (Only coordinators can modify comments) |
| **Filter Applications** | Yes (Own list) | Yes (All list) | Yes |

---

## 2. Authentication & Prototype Login Mechanism
To enforce the role-permission matrix, the database must contain a prototype user credentials table:
- **`users` Table**:
  - `id` (INT, Primary Key, Auto-increment)
  - `username` (VARCHAR, Unique, Not Null)
  - `password_hash` (VARCHAR, Not Null)
  - `role` (ENUM: `'student'`, `'coordinator'`, Not Null)

A lightweight session token, JWT, or custom authorization header containing the user role/ID will be passed on all backend requests to verify authentication and role boundaries.

---

## 3. Must-Have Functional Requirements

### FR-1: Internship Application Submission (Student)
- **Description**: Students must be able to submit their internship application details.
- **Acceptance Criteria**:
  - A form is provided with fields: Student Name, Company Name, Position Title, Start Date, End Date, and Submitted Date.
  - Successfully submitted applications are saved in the database with status `submitted`.
  - The UI updates automatically to show the newly submitted application in the student's list.

### FR-2: Application Status & Comments Tracking (Student)
- **Description**: Students must be able to view their own application statuses and view coordinator feedback comments. Students can edit and resubmit ONLY applications with status `changesRequested`.
- **Acceptance Criteria**:
  - The student dashboard lists all applications submitted by the logged-in student.
  - The status (`submitted`, `underReview`, `approved`, `rejected`, `changesRequested`) and any coordinator comment are visible.
  - Students cannot edit or submit comments.
  - Students can edit and resubmit applications *only* when status is `changesRequested`. Resubmission resets the status back to `submitted`.

### FR-3: Coordinator Review & Decisions (Coordinator)
- **Description**: Coordinators must be able to review, comment on, and update application statuses (including requesting changes).
- **Acceptance Criteria**:
  - Coordinators can view a master list of all submitted student applications.
  - Coordinators can click an application to edit its status and comment.
  - Status transitions are restricted to: `submitted`, `underReview`, `approved`, `rejected`, `changesRequested`.
  - Updating status or comments successfully persists to the database and is reflected in the UI.

### FR-4: Filtering Applications (Student & Coordinator)
- **Description**: Users can filter applications by company name or application status.
- **Acceptance Criteria**:
  - A text input filters results by Company Name (partial, case-insensitive match).
  - A dropdown filter selects applications by Status.
  - Students filter only their own applications; coordinators filter the global list.

---

## 4. Input Validation Rules

### Application Fields validation:
- **Student Name**: Required, Non-empty string.
- **Company Name**: Required, Non-empty string.
- **Position Title**: Required, Non-empty string.
- **Start Date**: Required, Valid Date format.
- **End Date**: Required, Valid Date format, must be strictly after **Start Date**.
- **Submitted Date**: Required, Valid Date format.
- **Status**: Must be one of `submitted`, `underReview`, `approved`, `rejected`.

---

## 5. Failure Cases

| Scenario | Input / Action | Expected System Behavior |
| :--- | :--- | :--- |
| **Invalid Dates** | End Date is before Start Date | Reject submission; return HTTP 400 with a clear error message. |
| **Missing Fields** | Submission missing Student Name | Reject submission; return HTTP 400 with field-specific errors. |
| **Unauthenticated Request**| Call API without token/role | Reject request; return HTTP 401 Unauthorized. |
| **Student Self-Approval** | Student attempts status update API | Reject request; return HTTP 403 Forbidden. |
| **Student Edits Comments** | Student attempts comment update API| Reject request; return HTTP 403 Forbidden. |

---

## 6. Verification Checklist

### Minimum Automated Tests
- **Backend API Tests**:
  - Validate role permissions (403 Forbidden on Student attempts to write comments/status).
  - Validate field validation (400 Bad Request on missing fields or End Date before Start Date).
  - Validate successful application lifecycle transitions.
- **Database Model Tests**:
  - Ensure schema validation rules align with constraints.

### Manual Verification Checks
- Log in as a Student and verify that editing comments/status fields is disabled in the UI.
- Log in as a Coordinator and verify the ability to modify comments/status, filter by status, and filter by company name.
- Verify MySQL database credentials are not exposed in frontend React code (e.g., config checks, env file checks).
