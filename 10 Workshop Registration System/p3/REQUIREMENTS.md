# Requirements: Workshop Registration System

This document outlines the functional and non-functional requirements, validation rules, security controls, and verification steps for the Workshop Registration System prototype.

---

## 1. Functional Requirements & Acceptance Criteria

### FR-1: Participant Workshop Registration
* **Description**: A user can register for a workshop by filling out a registration form.
* **Acceptance Criteria**:
  * The form must require `participantName`, `email`, `workshopTitle`, and `registrationDetails`.
  * Email must match a basic valid email pattern (`^[^\s@]+@[^\s@]+\.[^\s@]+$`).
  * On successful submission, the system saves the record in the database with status set to `pending` and attendance status set to `notMarked`.

### FR-2: Participant View & Filter Own Registrations
* **Description**: A participant can view a list of their own registrations and filter them.
* **Acceptance Criteria**:
  * The participant must be able to lookup their registrations by entering their email address.
  * The system displays matching registrations showing `workshopTitle`, `registrationDetails`, `status`, and `attendanceStatus`.
  * The participant can filter this list by registration status.

### FR-3: Participant Update Pending Registration Details
* **Description**: A participant can edit their own registration details while the status is `pending`.
* **Acceptance Criteria**:
  * A participant can modify the `registrationDetails` field of their own record.
  * The system must reject modifications if the registration status is `confirmed` or `cancelled`.

### FR-4: Organizer View and Filter All Registrations
* **Description**: Organizers can see a comprehensive master list of all registrations in the system.
* **Acceptance Criteria**:
  * The dashboard must present all fields: `participantName`, `email`, `workshopTitle`, `status`, `attendanceStatus`, and `organizerNote`.
  * The organizer can search/filter records by `workshopTitle`, `status`, or `attendanceStatus`.

### FR-5: Organizer Status and Attendance Management
* **Description**: Organizers can update registration statuses and track attendance.
* **Acceptance Criteria**:
  * Organizers can change the status of a registration to `pending`, `confirmed`, or `cancelled`.
  * Organizers can set the attendance status to `notMarked`, `present`, or `absent`.
  * Organizers can append or edit notes in `organizerNote`.

---

## 2. Role-Permission Matrix

| Action | Participant | Organizer | Enforcement Layer |
| :--- | :---: | :---: | :---: |
| **Create Registration** | Yes | Yes | Client & API |
| **View Own Registrations** | Yes | Yes | Client & API (By email query) |
| **Update Own Registration Details** | Yes (If Pending) | Yes | Client & API (State check) |
| **View All Registrations** | No | Yes | API (Role enforced) |
| **Update Registration Status** | No | Yes | API (Role enforced) |
| **Edit Organizer Notes** | No | Yes | API (Role enforced) |
| **Mark Attendance** | No | Yes | API (Role enforced) |

---

## 3. Security and Authentication Mechanism

For this prototype, a **Database-Backed Prototype Login Table** is established to separate roles safely without requiring full password hashing / OAuth setup:
* **Users Table**: Contains fields `id`, `email`, `password` (plain text for simplicity in this prototype, or simple hashing), and `role` (`participant` or `organizer`).
* **Session Simulation**: Upon login, a simple JSON payload / mock token is returned to the client and stored in `localStorage`.
* **Request Header Protection**:
  * All API calls must supply the `x-user-role` and `x-user-email` headers.
  * The backend validates these headers against the database configuration before modifying registration details, status, or attendance.
  * MySQL database credentials must reside entirely in a backend `.env` file and never be exposed/committed to frontend bundles.

---

## 4. Validation Rules

* **Fields & Formats**:
  * `participantName`: Required, non-empty string (max 100 chars).
  * `email`: Required, valid email format (e.g., must contain `@` and `.`).
  * `workshopTitle`: Required, non-empty string.
  * `registrationDetails`: Required, non-empty string.
  * `status`: Must be one of `pending`, `confirmed`, `cancelled`.
  * `attendanceStatus`: Must be one of `notMarked`, `present`, `absent`.

* **State Constraints**:
  * Updates to registration details by a participant are rejected if `status` is not `pending`.

---

## 5. Failure Cases & Expected System Responses

1. **Invalid Email Format**: Reject with `400 Bad Request` and message "Invalid email address format."
2. **Missing Required Fields**: Reject with `400 Bad Request` listing the missing fields.
3. **Attempting to Edit Confirmed/Cancelled Details**: Reject with `400 Bad Request` / `403 Forbidden` and message "Cannot edit registration details once status is confirmed or cancelled."
4. **Unauthorized Attendance Marking**: A participant attempts to PATCH `attendanceStatus`. Reject with `403 Forbidden` and message "Access Denied: Only organizers can update attendance status."
5. **Unauthorized Notes Editing**: A participant attempts to edit `organizerNote`. Reject with `403 Forbidden` and message "Access Denied: Only organizers can edit organizer notes."

---

## 6. Minimum Verification Checklist

### Automated Tests (Targeted Backend/API Checks)
- **POST** `/api/registrations`: Ensure registration is created with default status `pending` and attendance `notMarked`.
- **PUT** `/api/registrations/:id`: Ensure `403 Forbidden` is returned when requesting update with role `participant` on a `confirmed` status.
- **PATCH** `/api/registrations/:id/attendance`: Ensure `403 Forbidden` is returned when a participant attempts to modify attendance.

### Manual Verification
1. Open application as Participant, submit a valid registration, check status page.
2. Attempt to submit with invalid email, verify error message appears.
3. Switch role to Organizer, verify list displays registration.
4. Update registration status to "Confirmed" and verify.
5. Switch back to Participant, verify that the "Edit Details" button is disabled or yields a validation error when attempting to update.
6. Verify database credential safety (no `.env` contents present in any client bundle files).
