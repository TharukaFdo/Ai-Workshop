# Test Plan: Maintenance Request Tracker

This document outlines the test cases, authentication checks, role permissions, and validation coverage for testing the Maintenance Request Tracker prototype.

---

## 1. Automated Tests Coverage
Automated integration tests are defined in [backend/tests/requests.test.js](file:///h:/docs/Demo/Ai-Workshop/7%20Maintenance%20Request%20Tracker/p3/backend/tests/requests.test.js) and cover:
1.  **Database Connectivity**: Validates that a connection can be established to the local MySQL instance `c7p3`.
2.  **Authentication Login**: Verifies SHA256 hashed password comparison.
3.  **Submission Workflow**: Ensures a Requester can create a request with status `submitted`.
4.  **Filtering Capabilities**: Verifies requests are filtered by priority, status, and location.
5.  **State Lockouts**: Confirms that Requesters are blocked from editing details if status shifts to `inProgress`.
6.  **Technician Actions**: Verifies Technicians can update status progress and write technician notes.
7.  **High Priority Note Restriction**: Asserts that Technicians cannot close High priority requests unless a technician note is supplied.
8.  **Request Closure**: Confirms Technicians can close requests, updating the `closed_at` timestamp in the database.

---

## 2. Success Cases
*   **Request Creation**:
    *   *Input*: Title, Description, Location, Priority, Requester Name, valid User ID.
    *   *Expected Result*: Status `201 Created` returned. Request inserted with `status = 'submitted'`, `created_at` timestamp populated.
*   **Request Updating (Requester)**:
    *   *Input*: Modified title/description on a request owned by the requester in `submitted` status.
    *   *Expected Result*: Status `200 OK` returned. Fields updated in the database.
*   **Request Status Update (Technician)**:
    *   *Input*: Status change to `inProgress` and technician notes string.
    *   *Expected Result*: Status `200 OK` returned. Status and notes updated in the database.
*   **Request Closure (Technician)**:
    *   *Input*: Status change to `closed`.
    *   *Expected Result*: Status `200 OK` returned. `status` becomes `closed` and `closed_at` is set to the current timestamp.

---

## 3. Failure Cases
*   **Missing Fields**:
    *   *Input*: Submit request with empty `title` or `description`.
    *   *Expected Result*: Status `400 Bad Request` returned with error details.
*   **Invalid Enum Values**:
    *   *Input*: Submit request with priority `Urgent` instead of `High`/`Medium`/`Low`.
    *   *Expected Result*: Status `400 Bad Request` returned.
*   **Invalid Password Login**:
    *   *Input*: Post login request with wrong password.
    *   *Expected Result*: Status `401 Unauthorized` returned.
*   **Expired or Modified Token**:
    *   *Input*: Modifying the signed payload segment of the token.
    *   *Expected Result*: Status `401 Unauthorized` returned due to signature validation failure.

---

## 4. Role Access Cases & Protected Actions
*   **Ownership Check**:
    *   *Input*: Requester `Charlie` attempts to update a request submitted by Requester `Alice`.
    *   *Expected Result*: Status `403 Forbidden` returned.
*   **Unauthorized Technician Note Update**:
    *   *Input*: Requester `Alice` attempts to edit technician notes or submit status progress.
    *   *Expected Result*: Status `403 Forbidden` returned.
*   **Unauthorized Close**:
    *   *Input*: Requester `Alice` attempts to set status to `closed`.
    *   *Expected Result*: Status `403 Forbidden` returned.

---

## 5. Verification Execution Guide

### Automated Tests
Run the test suite from the root folder:
```bash
npm test
```
*Expected console output*:
```
✔ Database connectivity (Xms)
✔ Authentication login password verification (Xms)
✔ Submit maintenance request (Requester role allowed) (Xms)
✔ Filter requests by location, priority, or status (Xms)
✔ Update own request details (Owner allowed when status is submitted) (Xms)
✔ Blocked: Update details by non-owner or when status is not submitted (Xms)
✔ Technician allowed: progress update and note edit (Xms)
✔ Blocked: Requester updating details after status is inProgress (Xms)
✔ Technician allowed: close request (Xms)
```

### Manual Verification
1.  Navigate to `http://localhost:3000`.
2.  Log in as `alice_requester` with password `password123`.
3.  Submit a request. Modify its details.
4.  Logout and log in as `bob_technician` with password `password123`.
5.  Find Alice's request and update status to `In Progress`.
6.  Logout and log back in as `alice_requester`. Try to edit. Verify fields are disabled.
