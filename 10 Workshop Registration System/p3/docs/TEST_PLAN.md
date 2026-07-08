# TEST PLAN - Workshop Registration System Verification

This test plan defines the automated and manual verification procedures for the Workshop Registration System prototype. These checks verify database connectivity, credentials authentication, data validations, and role permissions.

---

## 1. Success Cases

These checks verify that requests containing valid parameters are successfully processed and persisted in the MySQL database.

### 1.1 DB-Backed Login
- **Description**: Verifies that users can sign in with valid credentials stored in `app_users` table.
- **Request**: `POST /api/auth/login` with `{ email: "participant@workshop.com", password: "user123" }`.
- **Expected Result**: Response status `200 OK`, returning user details (`id`, `email`, `role`) and an authorization token.

### 1.2 Registration Creation (Participant)
- **Description**: Verifies that a logged-in participant can successfully register for a workshop.
- **Request**: `POST /api/registrations` with authorization headers, and registration details body.
- **Expected Result**: Response status `201 Created`, returning the saved registration object with a generated auto-increment `id`.

### 1.3 View Own Registrations (Participant)
- **Description**: Verifies that participants can retrieve their registration list.
- **Request**: `GET /api/registrations/my?email=participant@workshop.com`.
- **Expected Result**: Response status `200 OK`, returning an array of registrations matching the participant's email.

### 1.4 Update Pending Registration Details (Participant)
- **Description**: Verifies that details of a pending registration can be modified.
- **Request**: `PUT /api/registrations/:id` with updated `registrationDetails`.
- **Expected Result**: Response status `200 OK`, returning updated registration parameters.

### 1.5 Administrative Operations (Organizer)
- **Description**: Verifies that organizers can confirm/cancel/waitlist status, mark attendance, and edit organizer notes. Waitlisted registrations can also be transitioned directly to confirmed status.
- **Requests**: 
  - `PATCH /api/registrations/:id/status` -> `{ status: "waitlisted" }` (moves pending to waitlist)
  - `PATCH /api/registrations/:id/status` -> `{ status: "confirmed" }` (moves waitlisted to confirmed)
  - `PATCH /api/registrations/:id/notes` -> `{ organizerNote: "note" }`
  - `PATCH /api/registrations/:id/attendance` -> `{ attendanceStatus: "present" }`
- **Expected Result**: Response status `200 OK`, returning updated fields.

### 1.6 Dashboard Filtering (Organizer)
- **Description**: Verifies organizer list filtering options.
- **Request**: `GET /api/registrations?workshopTitle=...&status=...&attendanceStatus=...`
- **Expected Result**: Response status `200 OK`, returning only registrations matching the queried filters.

---

## 2. Failure Cases

These checks verify that invalid payloads and constraint violations are correctly handled and rejected by the server.

### 2.1 Invalid Authentication
- **Description**: Reject login attempts with mismatched credentials.
- **Request**: `POST /api/auth/login` with incorrect password.
- **Expected Result**: Response status `401 Unauthorized`, error message: `"Invalid email or password."`

### 2.2 Missing Required Fields
- **Description**: Reject registration requests lacking necessary fields.
- **Request**: `POST /api/registrations` without `registrationDetails`.
- **Expected Result**: Response status `400 Bad Request`, error message: `"All fields (Name, Email, Workshop, Details) are required."`

### 2.3 Invalid Email Format
- **Description**: Reject emails not matching format regex.
- **Request**: `POST /api/registrations` with email `"invalid-email"`.
- **Expected Result**: Response status `400 Bad Request`, error message: `"Invalid email address format."`

### 2.4 Empty Values and Whitespaces
- **Description**: Reject inputs that are empty spaces.
- **Request**: `POST /api/registrations` with participantName `"   "`.
- **Expected Result**: Response status `400 Bad Request`, error message: `"Required fields cannot be empty spaces."`

### 2.5 Invalid Administrative Update Values
- **Description**: Reject organizer requests trying to set statuses or attendance outside of the valid ENUM values.
- **Requests**: 
  - `PATCH /api/registrations/:id/status` -> `{ status: "invalid_status_value" }`
  - `PATCH /api/registrations/:id/attendance` -> `{ attendanceStatus: "invalid_attendance_value" }`
- **Expected Result**: Response status `400 Bad Request`, error messages describing the invalid values.

### 2.6 Invalid Query Filters
- **Description**: Reject invalid status or attendance filters on the list API.
- **Request**: `GET /api/registrations?status=hack_status`.
- **Expected Result**: Response status `400 Bad Request`, error: `"Invalid registration status filter."`

### 2.7 Editing Confirmed/Cancelled Registrations
- **Description**: Prevent participants from modifying details once status is no longer pending.
- **Request**: `PUT /api/registrations/:id` (where status = `confirmed`).
- **Expected Result**: Response status `400 Bad Request`, error message: `"Cannot edit registration details once status is confirmed or cancelled."`

---

## 3. Role Access Cases (Role Mismatches & Identity Spoofing)

These checks verify role-based permissions and prevent users from accessing or modifying records belonging to other users.

### 3.1 Registering under Another User's Identity
- **Description**: Prevent a participant from registering a workshop under another email address.
- **Request**: Logged in as `participant@workshop.com`, sending `POST /api/registrations` with email `john@example.com`.
- **Expected Result**: Response status `403 Forbidden`, error message: `"Access Denied: Cannot register under another user's email."`

### 3.2 Accessing another Participant's Registration List
- **Description**: Prevent a participant from viewing another user's registrations.
- **Request**: Logged in as `participant@workshop.com`, sending `GET /api/registrations/my?email=john@example.com`.
- **Expected Result**: Response status `403 Forbidden`, error message: `"Access Denied: Cannot view registrations of other users."`

### 3.3 Modifying another Participant's Registration Details
- **Description**: Prevent a participant from editing details of registrations they do not own.
- **Request**: Logged in as `participant@workshop.com`, sending `PUT /api/registrations/:id` (belonging to `john@example.com`).
- **Expected Result**: Response status `403 Forbidden`, error message: `"Access Denied: Cannot modify another user's registration."`

---

## 4. Protected Action Checks (Organizer-Only Restraints)

These checks verify that administrative actions are strictly blocked for participant roles at the server level.

### 4.1 Participant modifying Registration Status
- **Request**: Logged in as `participant@workshop.com`, sending `PATCH /api/registrations/:id/status`.
- **Expected Result**: Response status `403 Forbidden`, error: `"Access Denied: Insufficient permissions."`

### 4.2 Participant modifying Organizer Notes
- **Request**: Logged in as `participant@workshop.com`, sending `PATCH /api/registrations/:id/notes`.
- **Expected Result**: Response status `403 Forbidden`, error: `"Access Denied: Insufficient permissions."`

### 4.3 Participant marking Attendance
- **Request**: Logged in as `participant@workshop.com`, sending `PATCH /api/registrations/:id/attendance`.
- **Expected Result**: Response status `403 Forbidden`, error: `"Access Denied: Insufficient permissions."`

### 4.4 Participant viewing all registrations
- **Request**: Logged in as `participant@workshop.com`, sending `GET /api/registrations`.
- **Expected Result**: Response status `403 Forbidden`, error: `"Access Denied: Insufficient permissions."`

---

## 5. How to Run the Checks

### 5.1 Run Automated Verification Suite
To run the automated integration tests which cover all success, failure, role access, and protected action check cases:

1. **Verify the Backend is Running**:
   Ensure your Express backend server is listening on port `5000`. If it is not running, start it:
   ```bash
   npm run dev:backend
   ```
2. **Execute Tests**:
   Run the test command from the root directory:
   ```bash
   npm test
   ```
   All nine test phases will run, outputting expected versus actual results, and clean up test records from MySQL when completed.

### 5.2 Manual UI Verification
1. Start frontend and backend:
   ```bash
   npm run dev
   ```
2. Open [http://localhost:5173](http://localhost:5173) in your browser.
3. Log in as a Participant (`participant@workshop.com` / `user123`):
   - Submit a new registration.
   - Verify that you can view your registration.
   - Confirm that you cannot see or interact with notes or attendance status editors.
4. Log out and sign in as Organizer (`organizer@workshop.com` / `admin123`):
   - Confirm status updates, note edits, and attendance marking inputs appear.
   - Test the filtering bar to query specific listings.
