# Requirements Specification: Clinic Appointment System

This document outlines the functional and non-functional requirements, validation rules, security permissions, and verification criteria for the Clinic Appointment System prototype.

---

## 1. Role-Permission Matrix

| Action | Receptionist | Doctor | Enforced By |
| :--- | :---: | :---: | :--- |
| **Create Appointment** | Yes | No | Backend API & Frontend UI |
| **Read Booking Details** | Yes | Yes | Backend API & Frontend UI |
| **Update Booking Details** (Time, Date, Reason, Patient Info) | Yes | No | Backend API & Frontend UI |
| **Cancel Appointment** | Yes | No | Backend API & Frontend UI |
| **View Visit Notes** | No | Yes | Backend API & Frontend UI |
| **Add/Edit Visit Notes** | No | Yes | Backend API & Frontend UI |
| **Update Appointment Status (Booked -> Completed)** | No | Yes | Backend API & Frontend UI |
| **Filter Appointments** (By Doctor, Date, Status) | Yes | Yes | Frontend UI |

---

## 2. Authentication & Prototype "Login" Mechanism
* **Prototype Mock Auth**: To enforce role-based rules securely in the backend, the prototype will use a simplified header-based simulated identity system or a mock login/session table.
* **Mechanism**: A dropdown on the frontend allows switching users (e.g., "Alice - Receptionist", "Dr. Smith - Doctor"). When making API requests, the client will send a custom header (e.g., `X-Role: Receptionist` or `X-Role: Doctor`, along with a mock user identifier `X-User-Id`). 
* **Backend Validation**: The backend Express API will intercept requests and validate that the incoming role has permission to execute the requested route/action.

---

## 3. Must-Have Functional Requirements & Acceptance Criteria

### F-REQ-1: Appointment Creation (Receptionist)
* **Description**: Allow a receptionist to schedule a new appointment.
* **Acceptance Criteria**:
  - GIVEN a Receptionist is logged in, WHEN they enter valid details (Patient Name, Patient Phone, Doctor Name, Date, Time, Reason) and submit, THEN the system saves the appointment with status `booked` and returns a success response.
  - GIVEN a Receptionist is logged in, WHEN they omit required fields (Patient Name, Doctor Name, Date, Time, Reason), THEN the system returns validation errors and does not save.

### F-REQ-2: Appointment List & Filtering (Receptionist & Doctor)
* **Description**: Allow users to view list of appointments, filterable by date, doctor, or status.
* **Acceptance Criteria**:
  - GIVEN a logged-in user (Receptionist or Doctor), WHEN they view the schedule, THEN they see a list of appointments sorted chronologically.
  - GIVEN a logged-in user, WHEN they filter by doctor name, date, or status (booked, completed, cancelled), THEN the list updates dynamically to display only matching records.

### F-REQ-3: Update Booking Details (Receptionist)
* **Description**: Allow receptionists to reschedule or modify booking details.
* **Acceptance Criteria**:
  - GIVEN a Receptionist is logged in, WHEN they modify the date, time, doctor, or reason for a `booked` appointment, THEN the updates are saved.
  - GIVEN a Doctor is logged in, WHEN they attempt to modify booking details via the API or UI, THEN the system rejects the action with a `403 Forbidden` error.

### F-REQ-4: Cancel Appointment (Receptionist)
* **Description**: Allow receptionists to cancel appointments.
* **Acceptance Criteria**:
  - GIVEN a Receptionist is logged in, WHEN they select an appointment and click "Cancel", THEN its status is updated to `cancelled` and the modification is persisted.

### F-REQ-5: Manage Visit Notes (Doctor)
* **Description**: Allow doctors to add and edit clinical visit notes.
* **Acceptance Criteria**:
  - GIVEN a Doctor is logged in, WHEN they select an appointment and add/edit the `visitNote`, THEN the system saves the note and allows status updates to `completed`.
  - GIVEN a Receptionist is logged in, WHEN they load the appointment or attempt to submit updates to the `visitNote` field via API, THEN they are blocked (UI hides notes, backend rejects write with `403 Forbidden`).

---

## 4. Validation Rules

| Field Name | Type | Required | Constraints / Validation |
| :--- | :--- | :---: | :--- |
| `patientName` | String | Yes | Minimum 2 characters, alphanumeric and spaces. |
| `patientPhone` | String | No | Must match a simple phone format if provided (e.g., digits, spaces, dashes, optionally starting with `+`). |
| `doctorName` | String | Yes | Must match one of the predefined clinic doctors. |
| `appointmentDate` | Date | Yes | Must be a valid date in `YYYY-MM-DD` format. Cannot be in the past (must be today or later). |
| `appointmentTime` | Time | Yes | Must be a valid time format `HH:MM` in 24-hour style. |
| `reason` | String | Yes | Minimum 5 characters, brief summary of visit reason. |
| `status` | String | Yes | Must be exactly one of: `booked`, `completed`, `cancelled`. |
| `visitNote` | String | No | Text field, only writable if requester has role `Doctor`. |

---

## 5. Failure Cases & Error Handling
* **Unauthenticated/Unauthorized Role**: Accessing a route without the correct role header returns `403 Forbidden` with a descriptive message (e.g., "Access Denied: Doctors cannot edit booking details").
* **Invalid Field Data**: Validation checks (empty fields, past dates, invalid phone formats) fail with `400 Bad Request` and return an array of specific field validation errors.
* **Non-existent Records**: Attempting to update or cancel an appointment ID that does not exist in the database returns `404 Not Found`.
* **State Transition Violations**: Attempting to write a visit note on a `cancelled` appointment or editing a `completed` booking's date/time returns a `400 Bad Request`.

---

## 6. Verification Checklist

### Automated Tests (Suggested Minimum)
1. **Backend Integration Tests**:
   - `POST /api/appointments` yields `201 Created` with valid receptionist data.
   - `POST /api/appointments` yields `400 Bad Request` with missing fields.
   - `PUT /api/appointments/:id/notes` yields `403 Forbidden` when requesting role is `Receptionist`.
   - `PUT /api/appointments/:id/notes` yields `200 OK` and saves when role is `Doctor`.
2. **Frontend Component Tests**:
   - Verify note-taking textarea is hidden/disabled when current role is set to `Receptionist`.
   - Verify cancel/edit buttons are hidden/disabled when current role is set to `Doctor`.

### Manual Checks
1. **Role Switcher Verification**: Switch user role from "Receptionist" to "Doctor" in UI and ensure view elements change instantly.
2. **Filter Functionality**: Confirm filtering by date ranges, doctor select, and status pills returns correct records.
3. **Database Integrity Check**: Verify that when doctor saves a visit note, the corresponding row in the MySQL table updates `visitNote`, `status`, and `updatedAt` accurately.
