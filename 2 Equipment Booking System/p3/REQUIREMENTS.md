# Requirements Document: Equipment Booking System

This document details the functional requirements, validation constraints, security rules, and verification checklists for the Equipment Booking System.

---

## 1. Role-Permission Matrix

| Action | Staff Member | Lab Assistant |
| :--- | :---: | :---: |
| Create Booking Request | Yes | No |
| View Own Bookings | Yes | Yes (if requesting, or via admin view) |
| View All Bookings | No | Yes |
| Update Own Pending Booking | Yes | No |
| Approve/Reject Booking | No | Yes |
| Add/Edit Assistant Comment | No | Yes |
| Filter Bookings (by equipment, date, status) | Yes (own only) | Yes (all bookings) |

---

## 2. Core Functional Requirements & Acceptance Criteria

### REQ-1: Prototype Authentication & User Session
- **Description**: The system must support a database-backed prototype login or role switcher utilizing a `users` table to simulate user context (Staff vs. Assistant) on both frontend and backend.
- **Acceptance Criteria**:
  - A persistent database table `users` contains at least `id`, `username`, and `role` (`staff` or `assistant`).
  - The frontend must provide a simple login selector or session mock to switch between these users.
  - The active user's ID and role must be sent with every backend API request (e.g., via a custom header like `X-User-Id` or `Authorization`).

### REQ-2: Create Booking Request (Staff)
- **Description**: Staff members can submit a booking request for lab equipment.
- **Acceptance Criteria**:
  - The creation form requires inputting: `equipmentName`, `bookingDate`, `startTime`, `endTime`, and `purpose`.
  - The `status` is automatically set to `pending` upon creation.
  - The `requestedUser` is automatically set to the currently logged-in staff member.

### REQ-3: View Booking Status (Staff & Lab Assistant)
- **Description**: Users can view lists of bookings matching their permissions.
- **Acceptance Criteria**:
  - Staff members can see a history list of only their own requested bookings.
  - Lab assistants can see a comprehensive list containing all bookings from all users.
  - Each item displays the fields: `equipmentName`, `requestedUser`, `bookingDate`, `startTime`, `endTime`, `purpose`, `status`, `assistantComment`, `createdAt`, and `updatedAt`.

### REQ-4: Update Own Pending Booking (Staff)
- **Description**: A staff member can edit the details of a booking request they submitted, provided its status is still `pending`.
- **Acceptance Criteria**:
  - The update form is only accessible for bookings owned by the active user that are in a `pending` status.
  - Updating a booking updates its fields (`equipmentName`, `bookingDate`, `startTime`, `endTime`, `purpose`) and modifies the `updatedAt` timestamp, leaving `status` as `pending`.
  - Once a booking status is updated to `approved` or `rejected`, the edit interface is disabled/blocked.

### REQ-5: Approve or Reject Booking (Lab Assistant)
- **Description**: A lab assistant can change the status of any booking request and append an explanation.
- **Acceptance Criteria**:
  - The assistant can transition a booking's status to `approved` or `rejected`.
  - The assistant must provide a short comment (`assistantComment`) explaining the decision.
  - The booking's status and comment are updated, and the change is reflected immediately.

### REQ-6: Filter Bookings (Secondary Feature)
- **Description**: Users can filter the booking list to narrow down records.
- **Acceptance Criteria**:
  - Users can filter by:
    - **Equipment**: Dropdown or text search.
    - **Date**: Specific date selector.
    - **Status**: Dropdown filter containing `pending`, `approved`, and `rejected`.
  - Staff filtering applies only to their own bookings. Lab assistant filtering applies to all bookings in the system.

---

## 3. Backend-Enforced Protected Actions
The backend API must validate and enforce authorization controls regardless of frontend restrictions:
1. **No Staff Approval**: Any request to the approval/rejection endpoint that is accompanied by a user profile with the `staff` role must be rejected with an `HTTP 403 Forbidden` response.
2. **Ownership Enforcement for Updates**: Any update request to `/api/bookings/:id` must verify that the requesting user's ID matches the booking's `requestedUser` and that the current status is `pending`. If not, return `HTTP 403 Forbidden`.
3. **No Staff Modification of Comments**: Staff members cannot edit the `assistantComment` field under any circumstances.
4. **Credential Isolation**: Database configuration credentials (username, password, host, port) must be kept in backend environment variables (`.env`) and never exposed to the frontend codebase or API responses.

---

## 4. Validation Rules

- **Required Fields**: `equipmentName`, `bookingDate`, `startTime`, `endTime`, and `purpose` must not be null or empty.
- **Status Enum**: Must be one of `pending`, `approved`, or `rejected`.
- **Date Format**: Must be a valid date representation.
- **Time Ordering**: `endTime` must be strictly after `startTime` for the booking to be processed.
- **Text Lengths**:
  - `equipmentName`: Maximum 255 characters.
  - `purpose`: Maximum 500 characters.
  - `assistantComment`: Maximum 255 characters.

---

## 5. Failure Cases & Expected API Responses

- **Missing Required Fields**: Return `HTTP 400 Bad Request` with descriptive validation errors.
- **End Time Before Start Time**: Return `HTTP 400 Bad Request` with an error message indicating invalid time boundaries.
- **Staff Modifying Approved/Rejected Booking**: Return `HTTP 400 Bad Request` or `HTTP 403 Forbidden` with a message stating that only pending requests can be modified.
- **Unauthorized Actions (e.g. Staff approving a request)**: Return `HTTP 403 Forbidden`.
- **Non-existent Booking ID**: Return `HTTP 404 Not Found`.

---

## 6. Verification Checklist

### Minimum Automated Tests
- **Backend API Tests**:
  - Verify that a `POST /api/bookings` with valid parameters succeeds.
  - Verify that a `POST /api/bookings` with missing fields returns `HTTP 400`.
  - Verify that a `PUT /api/bookings/:id` by a staff member on an approved booking returns `HTTP 403` or `HTTP 400`.
  - Verify that a patch/put to the approval endpoint by a `staff` user returns `HTTP 403`.
  - Verify that a patch/put to the approval endpoint by an `assistant` user with valid status and comment returns `HTTP 200`.

### Manual Checks
- Verify role switcher changes views correctly on the frontend.
- Verify filtering works dynamically for both roles.
- Verify staff cannot see or modify other users' bookings.
