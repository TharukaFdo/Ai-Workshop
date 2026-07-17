# Test Plan: Inventory Request System

This document outlines the testing strategy, case inventory, and instructions for verifying the Inventory Request System.

---

## 1. Success Cases

| Test Case ID | Name | Description | Inputs | Expected Output | Actual Output |
|---|---|---|---|---|---|
| TC-01 | User Login | Authenticate users against the database. | Username: `john_staff`, Password: `password123` | `200 OK`, JSON response containing user details and valid JWT token. | [As expected in TC-01] |
| TC-02 | Submit Request | Staff submits a valid inventory request. | Item: `ThinkPad Laptop`, Qty: `2`, Reason: `Development`, Date: `2026-07-15` | `201 Created`, status set to `pending`. | [As expected in TC-02] |
| TC-03 | Approve Request | Storekeeper approves a pending request. | ID: `1`, status: `approved`, note: `Approved for developers` | `200 OK`, status set to `approved`. | [As expected in TC-03] |
| TC-04 | Issue Items | Storekeeper marks approved requests as issued. | ID: `1`, status: `issued`, issuedQuantity: `2` | `200 OK`, status set to `issued`, `issued_quantity` set, timestamp recorded. | [As expected in TC-04] |
| TC-05 | List Requests | User views request lists. | Active token | `200 OK`, array of requests returned. | [As expected in TC-05] |

---

## 2. Failure Cases

| Test Case ID | Name | Description | Inputs | Expected Output | Actual Output |
|---|---|---|---|---|---|
| TC-06 | Bad Login | Authenticate with invalid password. | Username: `john_staff`, Password: `wrong` | `401 Unauthorized` | [As expected in TC-06] |
| TC-07 | Missing Request Fields | Submit request with empty item name. | Item: `""`, Qty: `2`, Reason: `test` | `400 Bad Request`, error: `"All fields are required."` | [As expected in TC-07] |
| TC-08 | Negative Quantity | Submit request with non-positive quantity. | Item: `ThinkPad Laptop`, Qty: `-5` | `400 Bad Request`, error: `"Quantity must be a positive integer."` | [As expected in TC-08] |
| TC-09 | Exceed Issued Qty | Storekeeper tries to issue more than requested. | Requested: `2`, Issued: `3` | `400 Bad Request`, error: `"Issued quantity exceeding requested limit"` | [As expected in TC-09] |

---

## 3. Role Access Cases

| Test Case ID | Name | Description | Authenticated User | Expected Output | Actual Output |
|---|---|---|---|---|---|
| TC-10 | Staff View Restriction | Staff members must see only their own requests. | `john_staff` | `200 OK`, returned list contains requests where `requester_id` equals John's ID. | [As expected in TC-10] |
| TC-11 | Storekeeper View Access | Storekeeper can view requests from all users. | `bob_storekeeper` | `200 OK`, returned list contains requests from John, Jane, etc. | [As expected in TC-11] |
| TC-12 | Request Filters | Filter list by name, requester, or status. | Status: `issued` | `200 OK`, returned list contains only requests with `issued` status. | [As expected in TC-12] |

---

## 4. Protected Action Checks & Spoofing Prevention

| Test Case ID | Name | Description | Input / Action | Expected Output | Actual Output |
|---|---|---|---|---|---|
| TC-13 | Staff Approve Attempt | Staff tries to approve request. | PUT `/api/requests/1/approve` by John | `403 Forbidden`, error: `"Requires storekeeper role."` | [As expected in TC-13] |
| TC-14 | Self-Approval Guard | Storekeeper tries to approve their own request. | Bob approves a request submitted by Bob | `403 Forbidden`, error: `"You cannot approve or reject your own request."` | [As expected in TC-14] |
| TC-15 | Body Parameter Spoofing | Client attempts to force approval status during request creation. | Body contains `status: "approved"` | `201 Created`, but `status` is overridden to `pending`. | [As expected in TC-15] |
| TC-16 | Requester ID Spoofing | Client attempts to submit request on behalf of another user ID. | Body contains `requesterId: 99` | `201 Created`, but `requester_id` is set to the token owner ID. | [As expected in TC-16] |

---

## 5. How to Run the Checks

### Automated Test Runner
To run the full suite of automated assertions, execute the following command in the project root:
```bash
npm test
```
*Note: Make sure your MySQL database is running and configured correctly in `backend/.env`.*

### Manual Checks Verification
1. Boot the frontend and backend using `npm run dev`.
2. Open the React UI dashboard.
3. Attempt to register/log in as John (Staff). Try to approve a pending request by issuing a manual request to `/api/requests/:id/approve` using an API client like Postman or Curl. Confirm that the server returns a `403 Forbidden` error.
4. Try to submit a request as John. Log out, then log in as Charlie (Storekeeper). Navigate to requests and confirm the request is visible and can be approved.
