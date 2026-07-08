# Test Plan: Room Booking System

This plan outlines the verification strategy for the Room Booking System, including lightweight automated backend tests and manual frontend walkthrough checks.

---

## 1. Automated Tests Configuration
The automated tests reside in `backend/tests/api.test.js` and use Node's built-in `assert` library. They perform backend API checks, database queries, and role validation.

### Execution Command:
```bash
npm test
```

---

## 2. Automated Test Scenarios

### Scenario A: Database & Connection Integrity
*   **Test Case A1**: Connect to the local MySQL instance pool and fetch the tables check.
    *   *Expected Result*: Query succeeds, indicating the database is accessible.

### Scenario B: Authentication & Session Login
*   **Test Case B1**: Login with correct demo credentials (`alice_staff` / `password123`).
    *   *Expected Result*: Returns status `200` with the custom HMAC session token.
*   **Test Case B2**: Login with invalid password (`alice_staff` / `wrong_pass`).
    *   *Expected Result*: Returns `401 Unauthorized`.

### Scenario C: Staff Member Permissions (Allowed & Blocked)
*   **Test Case C1**: Request a new pending booking.
    *   *Expected Result*: Creates entry with status `pending`.
*   **Test Case C2**: View own bookings.
    *   *Expected Result*: Returns list containing Alice's requested bookings.
*   **Test Case C3**: Update own pending booking details.
    *   *Expected Result*: Returns modified details.
*   **Test Case C4 (Blocked)**: Try to approve own booking request.
    *   *Expected Result*: Request fails with `403 Forbidden`.
*   **Test Case C5 (Blocked)**: Try to view or edit another user's bookings.
    *   *Expected Result*: Request fails with `403 Forbidden`.

### Scenario D: Coordinator Permissions (Allowed & Blocked)
*   **Test Case D1**: View all bookings.
    *   *Expected Result*: Returns bookings list from all requesters.
*   **Test Case D2**: Approve a pending booking request.
    *   *Expected Result*: Booking status transitions to `approved`.
*   **Test Case D3**: Reject a pending booking request with notes.
    *   *Expected Result*: Status transitions to `rejected` with `coordinator_note` populated.

### Scenario E: Business Logic & Constraints
*   **Test Case E1**: Overlapping booking check (Conflict).
    *   *Expected Result*: Approving a second booking that overlaps on dates/times in the same room is blocked with `409 Conflict`.
*   **Test Case E2**: Time chronology check.
    *   *Expected Result*: Submitting a request where `endTime <= startTime` returns `400 Bad Request`.

---

## 3. Cleanup Strategy
To ensure the local database is kept clean, the automated test script prefix-marks all test room entries with `[TEST-ROOM]` and runs a `DELETE FROM room_bookings WHERE room_name LIKE '[TEST-ROOM]%'` query during both the setup and teardown stages.
