# Test Plan: Clinic Appointment System Verification

This document outlines the testing strategy, test suites, verification checks, and security assertions for the Clinic Appointment System prototype.

---

## 1. Automated Integration Test Suite (`npm test`)

The automated suite executes database-backed assertions to verify core functionality, roles, validation parameters, and security boundaries.

### Success Cases
1. **Connectivity check**: Validates that the MySQL connection pool initializes properly.
2. **Database-backed Login check**: Confirms that hashed logins are checked in the database, yielding matching roles and ownership properties.
3. **Creation Flow**: Verifies scheduling records defaults status to `pending`.
4. **List & Filters**: Confirms filtering by `doctorName` or `status` isolates records correctly.
5. **Modification & Rescheduling**: Confirms receptionists can modify details when appointments are in `pending` or `accepted` status.
6. **Clinical Notes Completion**: Confirms doctors can save notes and transition statuses to `completed` for `accepted` appointments.
7. **Cancellation**: Confirms receptionists can cancel bookings, changing status to `cancelled` for `pending` or `accepted` appointments.

### Failure Cases & Constraints
1. **Past Date Check**: Validates that past dates are blocked on the API.
2. **Note Update Constraint**: Validates that note updates are blocked for non-accepted (e.g. pending, cancelled, rejected) appointments.
3. **Rescheduling Constraint**: Validates that rescheduling is blocked for appointments that are completed, cancelled, or rejected.

### Role Authorization & Boundaries
* **Receptionist Boundaries**: Receptionists are blocked from updating note values (`403 Forbidden`).
* **Doctor Boundaries**: Doctors are blocked from editing booking details or changing schedule times on any appointment.
* **Doctor Ownership Constraint**: Doctors are strictly blocked from editing notes or changing the status of appointments assigned to other doctors. Attempting to write notes to a different doctor's appointment returns a `403 Forbidden` error from the backend.
* **Privacy Safeguards**: Visit notes are stripped from responses returned to users with the `Receptionist` role.

---

## 2. Manual Verification Checklist

Follow these steps in the local environment:

### Step 1: Initialize Database & Run Server
```bash
npm run db:reset
npm run dev:backend
npm run dev:frontend
```

### Step 2: Login and Booking (Receptionist)
1. Navigate to `http://localhost:5173`.
2. Log in using `username: receptionist1` and `password: password123`.
3. Try booking an appointment with a past date. Verify the red error toast appears: `"Appointment date cannot be in the past."`
4. Book a valid appointment (e.g. Patient: `John Doe`, Doctor: `Dr. Smith`). Verify the booking is added to the table.
5. Confirm that **no visit note column is visible** in the table layout.

### Step 3: Schedule View & Note Writing (Doctor)
1. Click **Sign Out**, and log in as `dr_smith` (`password123`).
2. Verify you can only see appointments assigned to "Dr. Smith".
3. Verify the **Visit Notes** column is now visible.
4. Click **Add/Edit Notes**, input diagnosis notes, and select "Complete & close".
5. Save the note. Confirm the status badge updates to `completed`.

---

## 3. Remaining Security Limitations
* **Token Signatures**: Authentication uses simple username bearer tokens. Production environments must replace this with signed JSON Web Tokens (JWT) or session keys.
* **Double Booking Checks**: There is no automatic time slot validation to check if a doctor is already booked for that hour.
