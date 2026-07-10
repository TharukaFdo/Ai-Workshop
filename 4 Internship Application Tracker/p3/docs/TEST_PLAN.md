# Test Plan - Internship Application Tracker

This document outlines the testing strategy, case definitions, and steps required to verify the functional requirements, role boundaries, validations, and database constraints of the Internship Application Tracker.

---

## 1. Authentication & Role Approach
- **Database Login**: The system queries the `users` table, hashes input passwords using `SHA-256`, and matches records.
- **TAMPER-PROOF SESSION TOKENS**: Sessions are represented by a custom signed token: `id.role.signature` where `signature` is generated with `Hmac-SHA256` using a server secret.
- **REST Validation**: The backend parses the token, queries the active session role context, and prevents clients from forging credentials.

---

## 2. Test Cases Specification

### Success Cases
1. **Successful Authentication**:
   - **Input**: `POST /api/auth/login` with `{ "username": "student1", "password": "student123" }`.
   - **Expected Result**: HTTP 200 containing a signed token and user role.
2. **Submit Application**:
   - **Input**: `POST /api/applications` as a Student.
   - **Expected Result**: HTTP 201; record persisted in MySQL with status `submitted`.
3. **Update Application**:
   - **Input**: `PUT /api/applications/:id` as the owning Student.
   - **Expected Result**: HTTP 200; details modified.

### Validation & Failure Cases
1. **Missing Fields**:
   - **Input**: `POST /api/applications` with missing `companyName`.
   - **Expected Result**: HTTP 400 Bad Request with field validation warnings.
2. **Date Order Violation**:
   - **Input**: `POST /api/applications` where `endDate = 2026-01-01` and `startDate = 2026-02-01`.
   - **Expected Result**: HTTP 400 Bad Request stating "End Date must be strictly after the Start Date."
3. **Invalid Credentials**:
   - **Input**: `POST /api/auth/login` with wrong password.
   - **Expected Result**: HTTP 401 Unauthorized.
4. **Transition Block for Non-ChangesRequested Application**:
   - **Input**: Student attempts to edit their application when its status is `submitted`, `underReview`, `approved`, or `rejected`.
   - **Expected Result**: HTTP 400 Bad Request stating "Only applications in the 'changesRequested' stage can be modified."
5. **Allow Edit and Resubmit on Changes Requested**:
   - **Input**: Student edits an application whose status is `changesRequested` and submits.
   - **Expected Result**: HTTP 200 OK. Application status transitions back to `submitted`.

### Role Access & Protected Action Checks
1. **Student Self-Approval / Comment Edit (Blocked)**:
   - **Input**: Student tries to access `PUT /api/applications/:id/decision`.
   - **Expected Result**: HTTP 403 Forbidden.
2. **Coordinator Submitting Applications (Blocked)**:
   - **Input**: Coordinator tries to access `POST /api/applications`.
   - **Expected Result**: HTTP 403 Forbidden.
3. **Cross-Ownership Read/Write Block (Blocked)**:
   - **Input**: `student1` tries to access or edit an application owned by `student2`.
   - **Expected Result**: HTTP 403 Forbidden.

---

## 3. How to Run Verification

### Running Automated Integration Tests
Automated tests are implemented using Node's native `node:test` runner. To execute the automated suite:
1. Ensure the MySQL database is configured and running.
2. Setup the test environment:
   ```bash
   npm run db:setup
   ```
3. Run the tests:
   ```bash
   npm test
   ```

### Manual E2E Check Script
1. Start both servers: `npm run dev`.
2. Open [http://localhost:3000](http://localhost:3000).
3. Log in as `student1` / `student123`.
4. Submit a test application to "Tesla" for "SRE Intern". Confirm it displays in the table. Verify that the "Edit" action is NOT available for this application (as its status is `submitted` and locked).
5. Log in as `student2` / `student123`. Confirm that `student1`'s Tesla application is **not** visible.
6. Log in as `coordinator1` / `coordinator123`. Search for "Tesla". Confirm the application displays.
7. Click "Review" on Tesla. Set status to "Changes Requested" and write feedback comments. Click "Save".
8. Log back in as `student1`. Confirm the status is now "Changes Requested". Verify that the "Edit" button is now enabled.
9. Click "Edit", modify the position to "SRE Intern II", and save. Confirm the status transitions back to "Submitted" and the edit controls lock again.

---

## 4. Security Limitations & Workshop Caveats
- **Secret Secret Key**: The `JWT_SECRET` falls back to a hardcoded string if not defined in the `.env` file. For production, ensure this is a long, randomly generated secret.
- **Cross-Site Scripting (XSS)**: Tokens are stored in `localStorage`, which is vulnerable to XSS. In a production system, HttpOnly secure cookies are recommended to store session ids.
