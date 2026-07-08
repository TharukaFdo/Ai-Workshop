# Test Plan: Equipment Booking System

This document describes the validation plan, including automated and manual check steps, to verify features, security permissions, and input constraints.

---

## 1. Automated Integration Tests
A zero-dependency test script is available in [run-tests.js](file:///h:/docs/Demo/Ai-Workshop/2%20Equipment%20Booking%20System/p3/backend/tests/run-tests.js). 

### Setup and Tear-Down
- **Port Isolation**: Starts a temporary Express server on port `5099` to prevent conflicts with local development server ports.
- **Tear-Down Cleanup**: Automatically executes a MySQL query to delete any created test bookings (where `equipmentName` is prefixed with `TEST_`).
- **Connection Closure**: Closes the MySQL pool after tests finish to ensure the Node process exits cleanly.

### Test Coverage

#### Success Cases
- **Database Connectivity**: Validates query executions return expected values.
- **Authentication**: Checks that valid staff (`alice_staff`) and assistant (`charlie_assistant`) user profiles receive valid JWT tokens.
- **Booking Creation**: Confirms valid parameter requests save correctly in a `pending` status.
- **Booking Editing**: Verifies staff members can update details for their own pending booking request.
- **Booking Review**: Confirms lab assistants can successfully transition status to `approved` or `rejected` with an attached comment.
- **Collection & Return Lifecycle**: Verifies assistant can mark approved bookings as `collected`, and collected bookings as `returned`.

#### Failure Cases & Input Constraints
- **Incorrect Authentication**: Rejects incorrect passwords with an `HTTP 401 Unauthorized` response.
- **Missing Required Fields**: Verifies submissions without required parameters return `HTTP 400 Bad Request`.
- **Chronological Rule Violation**: Confirms submissions where `endTime` is before `startTime` return `HTTP 400 Bad Request`.
- **Modification Locks**: Verifies staff cannot update a booking once it has been approved or rejected.
- **Invalid Lifecycle Transitions**: Verifies database constraints block illogical transitions (e.g. from `pending` directly to `collected`, or `returned` back to `collected`).

#### Role Authorization & Security Matrix
- **Creation Restrictions**: Confirms lab assistants are blocked (`HTTP 403`) from creating booking requests.
- **Record Isolation**: Verifies staff members are blocked (`HTTP 403` or restricted list rows) from accessing or editing other users' booking requests.
- **Review Permissions**: Verifies staff members are blocked (`HTTP 403`) from invoking the approval/rejection patch endpoints.
- **Decision Rationale constraint**: Verifies status changes are blocked (`HTTP 400`) if the assistant comment is omitted or empty during approval/rejection.

---

## 2. Execution Instructions

### Run Automated Tests
From the root directory, execute:
```bash
npm test
```

### Manual Visual Verification
1. Run `npm run dev` to start frontend and backend.
2. Login as `alice_staff` with password `password123`.
3. Book an item successfully. Verify the item displays as `pending`.
4. Login as `charlie_assistant` with password `password123`.
5. Select Alice's request, click `Approve`, and write a comment. Verify the list updates status.
6. Now, on Charlie's dashboard, click `Mark Collected` on the approved request. Verify the status updates to `collected`.
7. Click `Mark Returned` on the collected request. Verify the status updates to `returned`.
8. Switch back to Alice and confirm that she can view the updated `collected` and `returned` statuses.
