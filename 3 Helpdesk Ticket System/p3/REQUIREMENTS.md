# Requirements Specification: Helpdesk Ticket System

This document details the functional and non-functional requirements, acceptance criteria, role-permission matrix, validation rules, failure cases, and verification checklist for the Helpdesk Ticket System.

---

## 1. Functional Requirements (Must-Have Only)

### FR-1: Ticket Submission (User)
*   **Description:** A user must be able to create a ticket by filling out a form with a title, description, category, and their name.
*   **Status Initial State:** All newly submitted tickets must start with the status `open`.

### FR-2: Ticket History & Status View (User)
*   **Description:** A user must be able to view a list of only their own submitted tickets, showing their current status, timestamps, and any agent responses.

### FR-3: Ticket Management Dashboard (Support Agent)
*   **Description:** An agent must be able to view all submitted tickets across the entire system.
*   **Actions:** An agent can add/edit a response to a ticket, update the ticket status, and close the ticket when resolved.

### FR-4: Ticket Filtering (User & Support Agent)
*   **Description:** 
    *   Agents must be able to filter the global list of tickets by **category**, **submitted user (creator)**, or **status**.
    *   Users must be able to filter their own list of tickets by **category** or **status**.

---

## 2. Acceptance Criteria (AC)

### AC-1: Ticket Submission
*   **AC-1.1:** Submitting a ticket with all required fields (title, description, category, submittedUser) creates a record in the database.
*   **AC-1.2:** The ticket is created with status = `open`, `createdAt` set to the current timestamp, and `agentResponse` set to NULL.

### AC-2: User Ticket Isolation
*   **AC-2.1:** A user can only see tickets where `submittedUser` matches their current active user session/identity.
*   **AC-2.2:** Accessing or requesting a ticket owned by another user via direct API call must return a `403 Forbidden` error.

### AC-3: Agent Operations & Response Workflow
*   **AC-3.1:** Agents can update a ticket's status to `inProgress`, `resolved`, or `closed`.
*   **AC-3.2:** When an agent updates a ticket status to `closed`, the system must set `closedAt` to the current timestamp.
*   **AC-3.3:** Agents can save or update `agentResponse` on any ticket. Users cannot edit this field.

---

## 3. Role-Permission Matrix

| Action / Feature | User | Support Agent | Backend Enforcement |
| :--- | :---: | :---: | :--- |
| **Create Ticket** | Yes | No | Enforced (Only User role allowed) |
| **View Own Tickets** | Yes | Yes | Enforced (Filtered by username/ID) |
| **View All Tickets** | No | Yes | Enforced (Forbidden for User role) |
| **Add/Edit Agent Response** | No | Yes | Enforced (Forbidden for User role) |
| **Update Ticket Status** | No | Yes | Enforced (Forbidden for User role) |
| **Close Ticket** | No | Yes | Enforced (Forbidden for User role) |

---

## 4. Auth & Role Switcher Mechanism
To simulate roles securely without full production identity providers:
*   A **Prototype Mock Authentication** will be implemented.
*   A simple `users` table or hardcoded mock accounts will exist (`user1`, `user2` with role `User`, and `agent1` with role `Support agent`).
*   A dropdown/switcher in the UI header allows switching active roles.
*   The active role and username are sent in API request headers (e.g., `x-user-role` and `x-user-name`) and verified by backend middleware.

---

## 5. Validation Rules

| Field | Required | Type / Values | Validation Rule |
| :--- | :---: | :--- | :--- |
| `title` | Yes | String (1-255 chars) | Cannot be empty, null, or only whitespace |
| `description` | Yes | Text | Cannot be empty, null, or only whitespace |
| `category` | Yes | String / Enum | Must be one of: `Software`, `Hardware`, `Network`, `Billing`, `Other` |
| `submittedUser`| Yes | String (1-100 chars) | Must match the authenticated user's name |
| `status` | Yes | Enum | Must be one of: `open`, `inProgress`, `resolved`, `closed` |
| `agentResponse` | No | Text | Optional, editable only by Support Agent |
| `closedAt` | No | Timestamp | Set automatically when status changes to `closed` |

---

## 6. Failure Cases

*   **FC-1: Missing Fields on Submission**
    *   *Input:* Submission of a ticket with an empty title or description.
    *   *Result:* API returns `400 Bad Request` with an explicit validation error message; UI displays the error state on the form.
*   **FC-2: Unauthorized Status Update**
    *   *Input:* A client with the `User` role makes a PATCH request to change a ticket status to `closed`.
    *   *Result:* API returns `403 Forbidden` and does not modify the database.
*   **FC-3: Accessing Non-Owned Tickets**
    *   *Input:* A `User` client requests ticket details for a ticket ID submitted by another user.
    *   *Result:* API returns `404 Not Found` or `403 Forbidden` to prevent information disclosure.
*   **FC-4: Exposure of DB Credentials**
    *   *Input:* Client requests frontend assets.
    *   *Result:* Environment variables (`.env`) containing database credentials must only be loaded on the Node.js backend and never bundled into the React build.

---

## 7. Minimum Verification Checklist

### Automated Tests (Targeted)
*   **API Tests:**
    *   `POST /api/tickets` (success on valid data, `400` on missing fields).
    *   `GET /api/tickets` (filtered correctly based on the requester's identity/role).
    *   `PATCH /api/tickets/:id` (updating status/response success for agents, `403` for users).

### Manual Verification
*   Log in as a User, submit a ticket, and verify it appears in the User's list.
*   Log in as another User, and verify that the first user's ticket is not visible.
*   Log in as an Agent, verify that all tickets are listed, select a ticket, add a response, change the status to `closed`, and verify that the `closedAt` timestamp is recorded.
*   Verify filters (category, status, submitted user) return correct results in the agent view.
