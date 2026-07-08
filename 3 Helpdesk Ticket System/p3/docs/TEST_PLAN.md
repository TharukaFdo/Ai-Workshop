# Test Plan: Helpdesk Ticket System

This document outlines the testing strategy, test cases, and verification checklist for the Helpdesk Ticket System.

---

## 1. Testing Strategy
Our testing is divided into:
1.  **Automated Backend Integration Tests:** Verify database connectivity, API route behavior, authentication, input validation, and role-based permissions.
2.  **Manual UI Walkthroughs:** Verify the frontend application layout, user workflow, responsiveness, state management, and permissions.

---

## 2. Test Cases

### Success Cases
*   **TC-01: User Submit Ticket**
    *   *Role:* User (`alice`)
    *   *Input:* Title="VPN issue", Description="Cannot access", Category="Network"
    *   *Expected Result:* Ticket created in database, status set to `open`, `createdAt` set to current time, ticket appears in Alice's list.
*   **TC-02: Support Agent Add Response**
    *   *Role:* Support Agent (`agent_carter`)
    *   *Input:* Ticket ID = 1, Status = `inProgress`, Response = "Under investigation"
    *   *Expected Result:* Database updated, status set to `inProgress`, response comment saved successfully.
*   **TC-03: Support Agent Resolve Ticket**
    *   *Role:* Support Agent (`agent_carter`)
    *   *Input:* Ticket ID = 1, Status = `closed`
    *   *Expected Result:* Database updated, status set to `closed`, `closedAt` set to the current timestamp.

### Validation & Failure Cases
*   **TC-04: Submit Empty Fields**
    *   *Role:* User (`alice`)
    *   *Input:* Title="", Description=""
    *   *Expected Result:* Form validation blocks submission; backend API returns `400 Bad Request`.
*   **TC-05: Submit Invalid Status**
    *   *Role:* Support Agent (`agent_carter`)
    *   *Input:* PATCH status = "waiting" (invalid)
    *   *Expected Result:* Backend API rejects with `400 Bad Request`.

### Security & Role Authorization Cases
*   **TC-06: User Accessing Other's Ticket**
    *   *Role:* User (`bob`)
    *   *Action:* Tries to load Alice's ticket or filter by Alice's name.
    *   *Expected Result:* Frontend hides other users' records; backend restricts query strictly to Bob's tickets.
*   **TC-07: User Modifying Status (Bypassing UI)**
    *   *Role:* User (`alice`)
    *   *Action:* Direct API PATCH request to close a ticket.
    *   *Expected Result:* Backend rejects with `403 Forbidden` because only agents are allowed to transition statuses.
*   **TC-08: User Reopen Closed Ticket**
    *   *Role:* User (`alice`)
    *   *Action:* Click "Reopen Ticket" on a closed ticket she owns.
    *   *Expected Result:* Ticket transitions back to `open` status, `closedAt` resets to `NULL`, and `reopened` count increments to `1`.
*   **TC-09: User Reopen Ticket Multiple Times**
    *   *Role:* User (`alice`)
    *   *Action:* Attempt to reopen a ticket that has already been reopened once (`reopened` count = 1).
    *   *Expected Result:* UI blocks action / API rejects request with `400 Bad Request`.

---

## 3. Running Verification Checks

### Automated Tests
To run the automated integration tests:
```bash
npm run test
```

### Manual Checks
1.  Launch the application using `npm run dev`.
2.  Open the web app (e.g., `http://localhost:5173`).
3.  Autofill and sign in as `alice`.
4.  Submit a ticket. Verify that it appears in your list.
5.  Sign out and log in as `agent_carter`.
6.  Click the ticket in the dashboard, update status to `In Progress` and add a comment. Save changes.
7.  Verify the updates appear on the dashboard.
