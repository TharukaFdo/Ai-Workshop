# Student Project Tracker - Test Plan

This document outlines the testing strategy, test suites, and instructions for verifying the Student Project Tracker application.

---

## 1. Automated API Testing
The application uses the built-in Node.js test runner (`node:test`) and assertion library (`node:assert`) to perform integration tests against the Express backend and the local MySQL instance.

### Test Coverage
1. **Authentication**: Database-backed credential checks using hashed passwords.
2. **Project Creation**: Field validation (including date format parsing verification), and role restrictions preventing supervisors from submitting projects.
3. **Identity Verification**: Verifies that `studentName` is securely populated from the database session record (`app_users.fullName`), ignoring any client-supplied name modifications in the payload.
4. **Retrieval Access Control**: Ensures students can view and retrieve *only* their own submissions, while supervisors can retrieve all.
4. **Project Modification**: Confirms students can update metadata for their own projects, but block them from editing other students' records.
5. **Supervisor Reviews**: Validates supervisor status transitions (e.g., `approved`) and feedback addition, and restricts students from approving their own projects.
6. **Filtering**: Verifies query parameters for status and categories function correctly.

### Running Automated Tests
First, ensure that your local MySQL server is online, then run:
```bash
npm test
```

---

## 2. Manual Verification Checklist

Verify the following flows manually using the browser user interface:

### Scenario A: Create and Submit a Project (Student Role)
1. Navigate to the frontend dev site.
2. Log in using `alice_student` / `password123`.
3. Submit a new project titled `"TEST: Smart Contracts Review"`.
4. Verify that the project appears in the student's **My Submissions** list with a blue/grey `submitted` status badge.
5. Click **Edit Details**, modify the description, and click **Save Changes**. Verify that the details update in the UI.

### Scenario B: Project Review and Approval (Supervisor Role)
1. Click **Logout** at the top right of the student dashboard.
2. Sign in as `supervisor_john` / `password123`.
3. Locate `"TEST: Smart Contracts Review"` in the submissions list.
4. Select the project to load it into the **Review Panel**.
5. Set status to `Approved` and write review feedback: `"Excellent design proposal. Approved."`
6. Click **Save Review Decision** and confirm the success notification is shown.

### Scenario C: Review Validation (Student Screen Updates)
1. Log out as the supervisor.
2. Log in again as `alice_student` / `password123`.
3. Check the status badge on the submitted project. It must show green `approved`.
4. Verify the supervisor's feedback text is visible beneath the metadata.
