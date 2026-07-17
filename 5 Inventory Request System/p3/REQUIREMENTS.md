# Functional & Non-Functional Requirements: Inventory Request System

This document outlines the detailed system requirements, acceptance criteria, role-based security configurations, and validation rules for the Inventory Request System web prototype.

---

## 1. Role-Permission Matrix
The system enforces strict access control rules between the two roles (Staff Member and Storekeeper).

| Action / Capability | Staff Member | Storekeeper | Backend Enforced? |
| :--- | :---: | :---: | :---: |
| **Submit Inventory Request** | Yes | No | Yes |
| **View Own Submitted Requests** | Yes | Yes (as self) | Yes |
| **Update Own Pending Request Details** | Yes | No | Yes |
| **Filter Own Requests** | Yes | No | Yes |
| **Review All Submitted Requests** | No | Yes | Yes |
| **Approve or Reject Any Request** | No | Yes | Yes |
| **Add / Edit Storekeeper Notes** | No | Yes | Yes |
| **Mark Approved Request as Issued** | No | Yes | Yes |
| **Filter All Requests** | No | Yes | Yes |

*Note on Self-Approval restriction:* A Storekeeper who submits a request (if acting as a staff member) must not be allowed to approve, reject, or issue their own request.

---

## 2. Authentication Mechanism for Prototype
To simulate and test roles without full-blown security infrastructure, a simple database-backed authentication/simulation mechanism will be implemented:
- A `users` table containing `id`, `username`, `role` (ENUM('staff', 'storekeeper')), and `full_name`.
- A simple session simulation (e.g., using a dropdown menu in the header to switch active users or a simulated header token) will determine the active user identity.
- Database credentials (MySQL host, port, username, password) must reside purely in backend environment configuration (`.env` file) and never be exposed to the client.

---

## 3. Must-Have Functional Requirements & Acceptance Criteria

### F-01: Inventory Request Submission (Staff)
* **Requirement**: Staff members must be able to submit a new inventory request.
* **Acceptance Criteria**:
  * Form inputs required: `itemName` (text), `quantity` (positive integer), `reason` (text), `requestedDate` (date), and `requesterName` (derived from current user session).
  * On successful submission, a request record is created with state set to `pending`.
  * The interface must show a success notification, and the list of requests must refresh.

### F-02: View & Update Own Requests (Staff)
* **Requirement**: Staff members can view the status of their requests and modify details if they are still `pending`.
* **Acceptance Criteria**:
  * Staff members can only view requests where they are the owner.
  * If a request's status is `pending`, an "Edit" option is available to modify `itemName`, `quantity`, `reason`, and `requestedDate`.
  * If a request's status is `approved`, `rejected`, or `issued`, editing is completely disabled.

### F-03: Review Dashboard (Storekeeper)
* **Requirement**: Storekeepers must have access to a dashboard displaying all requests in the system.
* **Acceptance Criteria**:
  * The dashboard displays requests from all staff members.
  * For each request, the details displayed include: item name, requester name, quantity, requested date, current status, and storekeeper notes.

### F-04: Approval & Rejection Workflow (Storekeeper)
* **Requirement**: Storekeepers can approve or reject pending requests and add feedback notes.
* **Acceptance Criteria**:
  * Storekeeper can change status from `pending` to `approved` or `rejected`.
  * Storekeeper can add a custom message in the `storekeeperNote` field.
  * The action is blocked if the request is already `approved`, `rejected`, or `issued`.
  * The action is blocked if the request owner is the current storekeeper (preventing self-approval).

### F-05: Issuing Workflow (Storekeeper)
* **Requirement**: Storekeepers can transition `approved` requests to the `issued` state.
* **Acceptance Criteria**:
  * The "Mark as Issued" action is visible only for requests in the `approved` state.
  * Upon marking as issued, the storekeeper records the actual `issuedQuantity` (must be $\le$ requested quantity) and `issuedAt` timestamp.
  * Request status transitions to `issued`.

### F-06: Dynamic Filtering (Staff & Storekeeper)
* **Requirement**: Both roles must be able to filter request lists dynamically.
* **Acceptance Criteria**:
  * Staff members can filter *their own* requests by Item Name, or Status.
  * Storekeepers can filter *all* requests by Item Name, Requester Name, or Status.

---

## 4. Input Validation Rules
All inputs are validated at both the frontend (UI level validation) and backend (API layer enforcement).

| Field | Type | Rules |
| :--- | :--- | :--- |
| `itemName` | String | Required, non-empty, max 255 characters |
| `quantity` | Integer | Required, must be greater than 0 |
| `reason` | String | Required, non-empty, max 500 characters |
| `requestedDate`| Date | Required, must be a valid ISO date |
| `requesterName`| String | Required, auto-set from authenticated user context |
| `status` | ENUM | Valid values: `pending`, `approved`, `rejected`, `issued` |
| `storekeeperNote`| String | Nullable, max 500 characters |
| `issuedQuantity`| Integer | Optional (Required only when transitioning to `issued`), must be $> 0$ and $\le$ requested quantity |

---

## 5. Failure Cases & System Responses

### Scenario A: Unauthorized Action Attempt
* **Trigger**: A Staff member attempts to call the `/api/requests/:id/approve` endpoint directly.
* **Response**: Backend responds with status `403 Forbidden` and message `"Access Denied: Storekeeper role required."`

### Scenario B: Self-Approval Attempt
* **Trigger**: A Storekeeper tries to approve an inventory request that they submitted as a staff member.
* **Response**: Backend detects matching requester ID and action user ID, responds with status `403 Forbidden` and message `"Access Denied: You cannot approve or issue your own request."`

### Scenario C: Edit Post-Approval / Post-Rejection
* **Trigger**: A user attempts to update request details after a storekeeper has already approved or rejected it.
* **Response**: Backend responds with status `400 Bad Request` and message `"Cannot update requests that are not in pending status."`

### Scenario D: Invalid Transition to Issued
* **Trigger**: A storekeeper attempts to mark a `pending` or `rejected` request as `issued` directly.
* **Response**: Backend responds with status `400 Bad Request` and message `"Only approved requests can be marked as issued."`

---

## 6. Verification Plan

### A. Automated Tests
1. **API Integration Tests**:
   - `POST /api/requests` validation checks (e.g. negative quantity must return `400`).
   - `PUT /api/requests/:id/approve` role-based authentication check (staff role must return `403`).
   - Self-approval block validation (returns `403`).
2. **Frontend Component Tests**:
   - Verify that staff members do not see approval buttons or edit boxes for storekeeper notes.
   - Verify that the edit form is disabled when status is not `pending`.

### B. Manual Checks
1. Log in as a Staff member, submit a request, and check that status is `pending`.
2. Edit the pending request, verify changes persist.
3. Log in as Storekeeper, search/filter for the request, approve it and write a note.
4. Log back in as Staff, verify status is `approved` and the storekeeper note is visible but read-only. Verify the Edit button is gone.
5. Log in as Storekeeper, mark the approved item as issued, specify the issued quantity. Check that status is now `issued`.
