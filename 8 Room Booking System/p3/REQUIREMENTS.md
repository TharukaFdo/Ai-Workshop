# Requirements Document: Room Booking System

This document details the functional and non-functional requirements, validation rules, role permissions, and verification checklists for the Room Booking System.

---

## 1. Functional Requirements & Acceptance Criteria

### FR1: Room Booking Request Creation (Staff Member)
*   **Description**: Staff members can submit a request to book a room.
*   **Acceptance Criteria**:
    *   The user is presented with a booking form containing the following fields: Room Name, Booking Date, Start Time, End Time, Purpose, and Requester Name.
    *   Submitting the form with valid information creates a new booking with the status set to `pending`.
    *   Form validation blocks submissions if any required fields are missing or if the end time is before/equal to the start time.

### FR2: View and Manage Own Bookings (Staff Member)
*   **Description**: Staff members can view the list of their own bookings, check their status, and edit/cancel their own pending bookings.
*   **Acceptance Criteria**:
    *   Staff members can view their own booking requests including current status and coordinator notes.
    *   Staff members can update details (room, date, times, purpose) of their booking *only* if the status is `pending`.
    *   Staff members can cancel their own pending booking (which transitions the status to `cancelled`).
    *   Staff members cannot edit or cancel bookings that have already been `approved`, `rejected`, or `cancelled`.

### FR3: Dashboard and Booking Management (Coordinator)
*   **Description**: Coordinators can view all bookings, filter them, and approve, reject, or update their statuses.
*   **Acceptance Criteria**:
    *   Coordinators can view a comprehensive list of all booking requests from all staff members.
    *   Coordinators can approve or reject a pending booking request.
    *   Coordinators can add or edit a "coordinator note" when approving or rejecting a booking.
    *   Coordinators can change the status of bookings (e.g., transition `approved` to `cancelled` or `rejected` if circumstances change).

### FR4: Filtering (Both Roles)
*   **Description**: Users can filter lists of room bookings.
*   **Acceptance Criteria**:
    *   Staff members can filter *their own* bookings by Room Name, Booking Date, or Status.
    *   Coordinators can filter *all* bookings by Room Name, Booking Date, or Status.

---

## 2. Role-Permission Matrix

| Action | Staff Member | Coordinator | Enforced By |
| :--- | :---: | :---: | :--- |
| **Create Booking Request** | Yes | Yes | Frontend & Backend API |
| **View Own Bookings** | Yes | Yes | Frontend & Backend API |
| **View All Bookings** | No | Yes | Backend API |
| **Update Own Pending Booking Details** | Yes | Yes | Frontend & Backend API |
| **Cancel Own Pending Booking** | Yes | Yes | Frontend & Backend API |
| **Approve / Reject Bookings** | No | Yes | Backend API |
| **Add / Edit Coordinator Notes** | No | Yes | Backend API |
| **Edit/Approve Other Users' Bookings** | No | Yes | Backend API |

---

## 3. Security & Protected Actions
*   **No Frontend Credentials**: Database credentials and environment variables (e.g., `DB_USER`, `DB_PASSWORD`) must be stored in server-side configuration/environment files and never exposed to the frontend.
*   **Backend Role Verification**: The backend API must verify the role of the requesting user before performing write actions.
    *   *Approve/Reject Endpoint*: Must reject requests if the requester role is not `coordinator`.
    *   *Update/Delete/Cancel Booking Endpoint*: If the requester role is `staff`, the backend must verify that the booking owner matches the requester name, and that the booking status is `pending`.
*   **Prototype Authentication Mechanism**:
    *   Since full session auth is out of scope, a simple database-backed or mock table representation of users/roles will be used. A `users` table (`id`, `username`, `role`) will be queried to simulate authentication. The client will pass a header `X-User-Id` or `X-User-Role` representing the active logged-in user to authenticate API calls in this prototype.

---

## 4. Validation Rules

*   **Field Presence**: `roomName`, `bookingDate`, `startTime`, `endTime`, `purpose`, and `requesterName` are strictly required (non-empty).
*   **DateTime Chronology**: `endTime` must be chronologically after `startTime`.
*   **Status Enum**: `status` must be one of: `pending`, `approved`, `rejected`, `cancelled`.
*   **State Machine Transitions**:
    *   `pending` can transition to `approved`, `rejected`, or `cancelled`.
    *   `approved` can transition to `cancelled` or `rejected` (by Coordinator).
    *   `rejected` can transition to `approved` (by Coordinator).
    *   `cancelled` is a terminal state and cannot be modified.

---

## 5. Failure Cases & Error Handling

1.  **Validation Failure**: Submit request missing fields or invalid times $\rightarrow$ API returns `400 Bad Request` with structured error messages.
2.  **Unauthorized Access**: Staff member tries to approve a booking or view all bookings $\rightarrow$ API returns `403 Forbidden`.
3.  **Conflict / Double Booking**: Coordinator tries to approve a booking that overlaps in room, date, and time with an already `approved` booking $\rightarrow$ API returns `409 Conflict` and prevents the update.
4.  **Modification of Locked Booking**: User tries to edit a booking that is already `approved`, `rejected`, or `cancelled` $\rightarrow$ API returns `400 Bad Request`.
5.  **Resource Not Found**: Attempting to view or update a booking ID that does not exist $\rightarrow$ API returns `404 Not Found`.

---

## 6. Verification Checklist

### Minimum Automated Tests (Recommended unit/integration tests)
*   **Backend Validation Tests**: Verify that submitting missing fields or end times before start times returns `400 Bad Request`.
*   **Backend Auth & Role Tests**:
    *   Verify that API requests to approve/reject a booking without `coordinator` role headers return `403 Forbidden`.
    *   Verify that a staff user cannot modify/cancel bookings owned by another user.
*   **Double Booking Prevention Test**: Verify that the database/API prevents two overlapping room bookings from being concurrently `approved`.

### Manual Checks
*   Toggle between Staff and Coordinator roles in the UI and ensure appropriate elements (like "Approve" buttons or "View All" logs) are conditionally rendered.
*   Verify that filter components correctly narrow down list records by room name, date, and status.
