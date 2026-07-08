# Project Context: Helpdesk Ticket System

This document outlines the scope, roles, entities, workflows, assumptions, and risks for the Helpdesk Ticket System prototype.

## 1. Case Restatement
The Helpdesk Ticket System is a web-based prototype designed to connect users (submitting support issues) with support agents (resolving issues). The system enables users to create, track, and view their own support tickets. Support agents can view all submitted tickets, respond to them, update status progress, and resolve/close them. The focus is strictly on the core ticketing workflow (creation, agent response, status management, and filtering) rather than full helpdesk suite capabilities like real-time chat, file attachments, or a knowledge base.

---

## 2. Roles and Responsibilities

### User (Requester)
*   **Create Tickets:** Can submit new tickets by providing a title, description, category, and their name.
*   **View Own Tickets:** Can view their own ticket status and history.
*   **Security Restrictions:** 
    *   Cannot view tickets submitted by other users.
    *   Cannot edit support agent responses.
    *   Cannot close or delete their own tickets.

### Support Agent
*   **View All Tickets:** Can browse and search all tickets submitted across the system.
*   **Respond to Tickets:** Can add comments/responses to tickets.
*   **Manage Ticket Status:** Can update ticket status (e.g., Open, In Progress, Resolved).
*   **Close Tickets:** Can resolve and close tickets.
*   **Security Restrictions:**
    *   Cannot edit or modify the original ticket title/description submitted by the user.

---

## 3. Main Entity: Ticket
The primary entity in this system is the **Ticket**.

### Fields/Attributes:
*   `id`: Unique identifier (Auto-incremented integer)
*   `title`: Brief summary of the issue (String, e.g., VARCHAR)
*   `description`: Detailed explanation of the issue (Text)
*   `category`: Category classification (String/Enum, e.g., Hardware, Software, Network)
*   `creator_name`: Name of the user submitting the ticket (String)
*   `status`: Current status of the ticket (Enum: `Open`, `In Progress`, `Closed`)
*   `agent_response`: The text response/comment added by the support agent (Text, nullable)
*   `created_at`: Timestamp of ticket creation
*   `updated_at`: Timestamp of last modification

### Main Ticket Workflow:
1.  **Creation:** A User submits a ticket. The status is initialized to `Open`.
2.  **In Progress:** An Agent views the open ticket, sets the status to `In Progress`, and adds a response or asks for clarification.
3.  **Resolution:** Once addressed, the Agent updates the status to `Closed` (Resolved).

---

## 4. Secondary Feature: Filtering and Searching
To facilitate ticket management, the system must allow support agents (and potentially users for their own list) to filter tickets by:
*   **Category** (e.g., Hardware vs. Software)
*   **Status** (e.g., Open vs. Closed)
*   **Submitted User** (creator_name)

---

## 5. Scope Boundaries

### In-Scope (Exact Workshop Scope):
*   A responsive React frontend for both users and support agents.
*   An Express/Node.js backend with RESTful API endpoints.
*   Local MySQL database for persistence (tables for tickets/users).
*   Role simulation/selection (e.g., a simple role switcher or login simulator to demonstrate user vs. agent functionality).
*   Basic status transitions: `Open` -> `In Progress` -> `Closed`.
*   Data validation on ticket submission and responses.
*   Ticket filtering by status, category, and user.

### Out of Scope:
*   Live chat or instant messaging.
*   File attachments or uploads.
*   Knowledge base or FAQ articles.
*   Multi-agent assignment or complex routing rules.
*   Email or push notifications.
*   Production-grade OAuth2/OpenID authentication (a simple mock authentication/role selection is sufficient).

---

## 6. Assumptions and Missing Details
*   **Role Switcher:** Since there is no complex authentication requested, we assume a simple role selection interface (or simulated login) is acceptable to demonstrate the two user views.
*   **Categories:** We assume a standard set of categories is predefined (e.g., `Software`, `Hardware`, `Network`, `Billing`, `Other`).
*   **Single Agent Response:** We assume a ticket needs at least a single response field or a simple conversation thread of comments. The initial scope specifies "add a response," so a single response text field per ticket is assumed, though a basic comment log is preferred if time permits.
*   **Authentication & Session Persistence:** We assume a simple local storage or state-based session is sufficient for simulating "their own tickets" for the User role.

---

## 7. Likely Risks
*   **Privilege Escalation:** Users attempting to access other users' tickets via URL path manipulation or api endpoint tampering.
*   **State Conflict:** Multiple agents viewing/updating the same ticket simultaneously.
*   **Input Sanitization:** SQL injection or Cross-Site Scripting (XSS) via rich text description/response inputs.
