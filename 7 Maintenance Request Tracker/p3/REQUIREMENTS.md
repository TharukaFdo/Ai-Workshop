# Requirements: Maintenance Request Tracker

This document defines the functional and non-functional requirements, acceptance criteria, security policies, and validation rules for the Maintenance Request Tracker prototype.

---

## 1. Role-Permission Matrix

| Action | Requester | Technician | Enforced By |
| :--- | :---: | :---: | :---: |
| **Submit Maintenance Request** | Yes | No | Backend & Frontend |
| **View Own Request Status** | Yes | No | Backend & Frontend |
| **Update Own Open Request Details** | Yes | No | Backend & Frontend |
| **Filter Own Requests** | Yes | No | Frontend |
| **View All Submitted Requests** | No | Yes | Backend & Frontend |
| **Add/Edit Technician Notes** | No | Yes | Backend |
| **Update Request Progress** | No | Yes | Backend |
| **Close Request** | No | Yes | Backend |
| **Filter All Requests** | No | Yes | Frontend |

---

## 2. Authentication & Authorization Mechanism

*   **Database-Backed Prototype Login**: A simple database table for `users` (or roles) will store username and role (`Requester` or `Technician`). 
*   **Role Enforcement**: The backend API will identify the user context via a request header (e.g., `X-User-Role` and `X-User-Id` or basic session headers) and validate permissions before allowing any state-changing operations. 
*   **Security Constraint**: Database credentials must be kept in server-side environment variables (`.env`) and never exposed to the React frontend.

---

## 3. Must-Have Requirements & Acceptance Criteria

### REQ-1: Maintenance Request Submission
*   **Description**: A Requester can submit a new maintenance request.
*   **Acceptance Criteria**:
    *   Form fields required: Title, Description, Location, Priority, Requester Name.
    *   On successful submission, the request is persisted in the database with status `submitted`.
    *   `createdAt` and `updatedAt` timestamps are set automatically.

### REQ-2: View and Update Own Open Requests (Requester)
*   **Description**: A Requester can view requests they submitted and update details (title, description, location, priority) of their requests while they remain open (i.e., status is `submitted`).
*   **Acceptance Criteria**:
    *   Requester can edit fields only if status is `submitted`.
    *   If status has changed to `inProgress`, `completed`, or `closed`, edits are blocked and rejected by both frontend and backend.
    *   Requester cannot edit `technicianNote`, `status`, `closedAt`, or other technician fields.

### REQ-3: View and Filter Requests (Technician)
*   **Description**: A Technician can view all requests submitted across the system and filter them.
*   **Acceptance Criteria**:
    *   Technicians can view a list of all maintenance requests.
    *   Technicians can filter the list by location, priority, and status (`submitted`, `inProgress`, `completed`, `closed`).

### REQ-4: Progress Updates & Closure Workflow (Technician)
*   **Description**: A Technician can update status progress, add/edit technician notes, and close requests.
*   **Acceptance Criteria**:
    *   Technicians can move a request status: `submitted` $\rightarrow$ `inProgress` $\rightarrow$ `completed` $\rightarrow$ `closed`.
    *   Technicians can add or update `technicianNote` at any stage.
    *   When status transitions to `closed`, the backend automatically sets `closedAt` timestamp.
    *   Requesters cannot update progress or add/edit technician notes.

---

## 4. Validation Rules

*   **Required Fields**: `title`, `description`, `location`, `priority`, and `requesterName` must not be empty or null.
*   **Allowed Priority Values**: Must be one of `Low`, `Medium`, or `High`.
*   **Allowed Status Values**: Must be one of `submitted`, `inProgress`, `completed`, or `closed`.
*   **Length Boundaries**:
    *   `title`: Max 100 characters.
    *   `location`: Max 100 characters.
    *   `requesterName`: Max 100 characters.

---

## 5. Failure Cases & Error Handling

*   **Unauthorized Action**:
    *   *Scenario*: A Requester attempts to close a request or edit technician notes.
    *   *Response*: The backend returns `403 Forbidden` with an error message.
*   **Edit Locked Request**:
    *   *Scenario*: A Requester attempts to update details on a request that is already `inProgress`, `completed`, or `closed`.
    *   *Response*: The backend returns `400 Bad Request` explaining that the request is locked.
*   **Missing Required Fields**:
    *   *Scenario*: Submission contains empty fields.
    *   *Response*: The backend returns `400 Bad Request` detailing the missing fields.
*   **Invalid Enum Value**:
    *   *Scenario*: Client sends an invalid status (e.g. `fixed`) or priority (e.g. `urgent`).
    *   *Response*: The backend returns `400 Bad Request` with validation details.

---

## 6. Verification Plan

### Minimum Automated Tests
1.  **Unit/Integration Tests (Backend)**:
    *   Test that submitting a request with valid data returns `201 Created` and sets status to `submitted`.
    *   Test that submitting with missing fields returns `400 Bad Request`.
    *   Test that a Requester updating their request when status is `submitted` succeeds.
    *   Test that a Requester updating their request when status is `inProgress` fails with `400 Bad Request`.
    *   Test that a Requester attempting to update `technicianNote` or `status` is blocked (`403 Forbidden`).
    *   Test that a Technician updating progress or saving notes succeeds.
2.  **Unit Tests (Frontend)**:
    *   Test that validation messages are displayed for empty form fields.
    *   Test that role switching toggles the visible components (e.g., hides the edit technician note action for Requesters).

### Manual Checks
1.  Verify filter dropdowns correctly filter the request list.
2.  Verify the role selection switcher immediately updates UI permissions and interface views.
3.  Check database tables directly using a MySQL client to ensure `closedAt` timestamp is populated only when status becomes `closed`.
