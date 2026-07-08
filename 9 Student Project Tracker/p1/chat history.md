# Chat Conversation

Note: _This is purely the output of the chat conversation and does not contain any raw data, codebase snippets, etc. used to generate the output._

### User Input

# Student Project Tracker

We need a simple system to help students submit their software project details and allow supervisors to review them without relying on scattered documents and messages. A student should be able to create and update their own project submission with details such as title, description, category, student name, supervisor name, submitted date, and current status. A supervisor should be able to view submitted projects, add feedback, and update the project status. It would also help if projects could be filtered by supervisor, category, or status. Students must not be able to edit supervisor feedback or approve their own projects. This should be a small React, Express, Node.js, and MySQL prototype using React, Node.js/Express, and local MySQL, focused only on submission, review, feedback, and status tracking.

I want to build a student project tracker app. Where should I start? Only explain first steps. Do not create or edit files yet.

*Listed directory [p1](file:///h:/docs/Demo/Ai-Workshop/9%20Student%20Project%20Tracker/p1) *

*Viewed [Case_Brief.md](file:///h:/docs/Demo/Ai-Workshop/9%20Student%20Project%20Tracker/p1/Case_Brief.md) *

### Planner Response

To build the **Student Project Tracker** prototype, here are the recommended first steps to get started:

### 1. Database Setup (MySQL)
Create a single table (e.g., `projects`) to store all project details. 
* **Columns to define:**
  * `id` (INT, Primary Key, Auto-increment)
  * `title` (VARCHAR)
  * `description` (TEXT)
  * `category` (VARCHAR)
  * `student_name` (VARCHAR)
  * `supervisor_name` (VARCHAR)
  * `submitted_date` (DATE or TIMESTAMP)
  * `status` (VARCHAR/ENUM: e.g., `'Pending'`, `'Approved'`, `'Rejected'`)
  * `supervisor_feedback` (TEXT, Nullable)

### 2. Backend API Setup (Node.js & Express)
Initialize a basic Express server to handle database communication.
* **Dependencies to install:** `express`, `mysql2` (or `mysql2/promise` for async/await), `cors`, and `dotenv` for configuration.
* **API Endpoints to implement:**
  * `GET /api/projects` (Retrieves projects with optional filters for supervisor, category, and status)
  * `POST /api/projects` (Allows students to submit a new project; defaults status to `'Pending'`)
  * `PUT /api/projects/:id` (Allows updating project details or supervisor feedback/status)

### 3. Frontend Client Setup (React)
Set up a single-page React interface. Since this is a prototype, you can toggle between **Student View** and **Supervisor View** using a simple role switcher at the top.
* **Student Interface:**
  * A submission form to input/edit title, description, category, student name, and supervisor name.
  * A read-only view of supervisor feedback and status (ensuring they cannot modify them).
* **Supervisor Interface:**
  * A dashboard showing all submissions with dropdown filters (by supervisor, category, or status).
  * A form/modal on each project to add/edit feedback and update the project status (e.g., Approved, Rejected).

---

### How would you like to proceed?
Once you are ready, let me know, and we can write an **Implementation Plan** to set up the directories and database configuration!

### User Input

Tell me what this app should do. Do not create or edit files yet.

### Planner Response

Based on the requirements, the **Student Project Tracker** is a collaborative workflow tool with two distinct roles: **Students** and **Supervisors**. Here is exactly what the app should do:

### 1. Student Capabilities
* **Submit a Project:** Students can create a new project submission by entering:
  * Title
  * Description
  * Category (e.g., Web App, Mobile App, AI/ML)
  * Student Name
  * Supervisor Name
* **Update Project Details:** A student can edit details of their submitted project (e.g., updating the title or description if it hasn't been approved yet).
* **View Status & Feedback:** Students can see the current status of their submission (e.g., *Pending*, *Approved*, *Rejected*) and read any feedback comments left by their supervisor.
* **Strict Limitations (Role Guardrails):** 
  * Students **must not** be able to edit or delete supervisor feedback.
  * Students **must not** be able to approve or change the status of their own projects.

### 2. Supervisor Capabilities
* **View Submissions:** Supervisors can view a list of all submitted projects.
* **Filter Projects:** To manage high volumes of submissions, supervisors (or students) can filter the projects list by:
  * Assigned Supervisor
  * Category
  * Current Status
* **Review & Evaluate:** A supervisor can select a project to:
  * Add or update **written feedback**.
  * Update the **status** of the project (e.g., moving it from *Pending* to *Approved* or *Changes Requested* / *Rejected*).

### 3. Core Workflow
1. **Creation:** A student submits a project. The system automatically sets its status to `Pending` and leaves the supervisor feedback empty.
2. **Review:** The supervisor filters the projects to find their assigned submissions, reviews the details, adds comments, and updates the status to `Approved` or `Rejected`.
3. **Tracking:** The student checks the dashboard, sees the updated status and feedback, and knows whether they need to update details or if their project is approved.

### User Input

Set up the project files so I can run the app. Only create the basic React frontend and Express backend files. Do not add the main features yet.

*Edited relevant file*

### Planner Response

I have created the [implementation plan](file:///C:/Users/Tharu/.gemini/antigravity-ide/brain/f62dd699-7e3d-4614-927d-dc44da4a4a49/implementation_plan.md) to initialize the backend and frontend folders. 

Please review the plan and let me know if you approve it so I can proceed with the setup!

*Edited relevant file*

*Edited relevant file*

*Edited relevant file*

*Edited relevant file*

*User accepted the command `npm install`*

*User accepted the command `npx -y create-vite --help`*

*User accepted the command `npx -y create-vite frontend --template react`*

*User accepted the command `npm install`*

*Listed directory [frontend](file:///h:/docs/Demo/Ai-Workshop/9%20Student%20Project%20Tracker/p1/frontend) *

*Listed directory [src](file:///h:/docs/Demo/Ai-Workshop/9%20Student%20Project%20Tracker/p1/frontend/src) *

### Planner Response

I am waiting for the frontend dependencies to finish installing. Once completed, we will verify the skeleton.

*Viewed [App.jsx](file:///h:/docs/Demo/Ai-Workshop/9%20Student%20Project%20Tracker/p1/frontend/src/App.jsx) *

*Edited relevant file*

*User accepted the command `npm run dev`*

*User accepted the command `npm run dev`*

*Viewed [task-56.log](file:///C:/Users/Tharu/.gemini/antigravity-ide/brain/f62dd699-7e3d-4614-927d-dc44da4a4a49/.system_generated/tasks/task-56.log) *

*Viewed [task-54.log](file:///C:/Users/Tharu/.gemini/antigravity-ide/brain/f62dd699-7e3d-4614-927d-dc44da4a4a49/.system_generated/tasks/task-54.log) *

*Edited relevant file*

*Edited relevant file*

*Viewed [task-54.log](file:///C:/Users/Tharu/.gemini/antigravity-ide/brain/f62dd699-7e3d-4614-927d-dc44da4a4a49/.system_generated/tasks/task-54.log) *

*User accepted the command `npm run dev`*

*Edited relevant file*

*Edited relevant file*

### Planner Response

I have successfully set up the basic project files and verified that they can run and connect to each other.

### Summary of Changes:
- **Express Backend:** Initialized under [backend](file:///h:/docs/Demo/Ai-Workshop/9%20Student%20Project%20Tracker/p1/backend) running on port `5001`. It provides a simple `/api/health` connectivity test endpoint.
- **React Frontend:** Scaffolded with Vite under [frontend](file:///h:/docs/Demo/Ai-Workshop/9%20Student%20Project%20Tracker/p1/frontend) running on port `5174`. It automatically fetches and displays the health status of the backend server.

You can view a summary of the setup and the connection verification in the [walkthrough](file:///C:/Users/Tharu/.gemini/antigravity-ide/brain/f62dd699-7e3d-4614-927d-dc44da4a4a49/walkthrough.md).

### User Input

Make project submissions save in MySQL and show again even after refresh.

Use these local MySQL details and put them only in the backend .env file:
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=
DB_NAME=create new one as c9p1

Keep the MySQL password out of React or browser code.
Add an easy command I can run if the demo data needs to be prepared again.
Do not use temporary browser storage or sample-only data.
Only do this saving step.

*Edited relevant file*

### Planner Response

I have updated the [implementation plan](file:///C:/Users/Tharu/.gemini/antigravity-ide/brain/f62dd699-7e3d-4614-927d-dc44da4a4a49/implementation_plan.md) with details for setting up the MySQL database, adding the initialization and seeding script, and updating the API endpoints to retrieve and save submissions. 

Please review and approve the plan to proceed with execution!

*Edited relevant file*

*Edited relevant file*

*Viewed [package.json](file:///h:/docs/Demo/Ai-Workshop/9%20Student%20Project%20Tracker/p1/backend/package.json) *

*Edited relevant file*

*Edited relevant file*

*User accepted the command `npm run db:init`*

*Edited relevant file*

*Viewed [task-75.log](file:///C:/Users/Tharu/.gemini/antigravity-ide/brain/f62dd699-7e3d-4614-927d-dc44da4a4a49/.system_generated/tasks/task-75.log) *

*Edited relevant file*

*Edited relevant file*

*Edited relevant file*

*Edited relevant file*

### Planner Response

I have implemented MySQL database storage and persistence.

### Key Additions:
1. **MySQL Setup:** Configured connection variables (using `DB_NAME=c9p1`) inside the [backend .env file](file:///h:/docs/Demo/Ai-Workshop/9%20Student%20Project%20Tracker/p1/backend/.env) (leaving the password secure from the frontend).
2. **Database Initialization Command:** Added the `npm run db:init` command to the [backend package.json](file:///h:/docs/Demo/Ai-Workshop/9%20Student%20Project%20Tracker/p1/backend/package.json). This executes [dbSetup.js](file:///h:/docs/Demo/Ai-Workshop/9%20Student%20Project%20Tracker/p1/backend/dbSetup.js), which auto-creates the database/tables and seeds initial demo projects.
3. **Data Persistence:** Wired the React frontend and Express backend to save submissions into MySQL. A browser reload preserves the data.

You can view the full setup and verification details in the [walkthrough](file:///C:/Users/Tharu/.gemini/antigravity-ide/brain/f62dd699-7e3d-4614-927d-dc44da4a4a49/walkthrough.md).

### User Input

Make simple screens for student and supervisor.

*Edited relevant file*

### Planner Response

I have created the [implementation plan](file:///C:/Users/Tharu/.gemini/antigravity-ide/brain/f62dd699-7e3d-4614-927d-dc44da4a4a49/implementation_plan.md) for adding the Student and Supervisor screens along with the backend PUT endpoint for reviews.

Please review and approve the plan so we can implement these screens!

*Edited relevant file*

*Viewed [server.js](file:///h:/docs/Demo/Ai-Workshop/9%20Student%20Project%20Tracker/p1/backend/server.js) *

*Edited relevant file*

*Edited relevant file*

*Viewed [App.css](file:///h:/docs/Demo/Ai-Workshop/9%20Student%20Project%20Tracker/p1/frontend/src/App.css) *

*Edited relevant file*

*Viewed [App.css](file:///h:/docs/Demo/Ai-Workshop/9%20Student%20Project%20Tracker/p1/frontend/src/App.css) *

*Edited relevant file*

*Edited relevant file*

### Planner Response

I have implemented the role-specific screens for both **Students** and **Supervisors**!

### Summary of Changes:
1. **Role Switcher:** Added a toggle bar at the top of the app to switch between the **Student** and **Supervisor** views.
2. **Student Screen:** Allows submitting new projects and displays submitted projects with read-only status and supervisor feedback.
3. **Supervisor Screen:** Hides the submission form and displays a **Filter Submissions** panel (filter by supervisor name, category, and status). Project cards in this view render inline inputs to update status and supervisor feedback.
4. **Backend Route:** Implemented the `PUT /api/projects/:id` endpoint in [server.js](file:///h:/docs/Demo/Ai-Workshop/9%20Student%20Project%20Tracker/p1/backend/server.js) to persist status and feedback updates to the MySQL database.

You can find the full verification and screenshots in the [walkthrough](file:///C:/Users/Tharu/.gemini/antigravity-ide/brain/f62dd699-7e3d-4614-927d-dc44da4a4a49/walkthrough.md).

### User Input

Add creating, viewing, reviewing and approving or rejecting project submissions.

*Edited relevant file*

### Planner Response

I have created the [implementation plan](file:///C:/Users/Tharu/.gemini/antigravity-ide/brain/f62dd699-7e3d-4614-927d-dc44da4a4a49/implementation_plan.md) to add the editing capability for students, completing all aspects of creating, viewing, reviewing, and approving/rejecting submissions.

Please review and approve the plan to proceed!

*Edited relevant file*

*Edited relevant file*

*Edited relevant file*

*Viewed [App.css](file:///h:/docs/Demo/Ai-Workshop/9%20Student%20Project%20Tracker/p1/frontend/src/App.css) *

*Edited relevant file*

*Edited relevant file*

*Edited relevant file*

### Planner Response

I have completed the integration of the complete project submission lifecycle!

### Summary of Changes:
1. **Dynamic Update API Route:** Updated the `PUT /api/projects/:id` endpoint in [server.js](file:///h:/docs/Demo/Ai-Workshop/9%20Student%20Project%20Tracker/p1/backend/server.js) to accept and save student updates for project fields (`title`, `description`, etc.) as well as supervisor status/feedback changes.
2. **Student Edit Features:** Added an **Edit Details** button to the student's project cards (visible only when the status is `'Pending'`). Clicking this switches the submission form into edit mode so students can update their proposals.
3. **Guardrail Enforcement:** Once a supervisor changes the status of a project (e.g. to `Approved` or `Rejected`), the **Edit Details** button is automatically hidden, ensuring students cannot alter reviewed projects.

You can view the full workflow verification recording and screenshots in the [walkthrough](file:///C:/Users/Tharu/.gemini/antigravity-ide/brain/f62dd699-7e3d-4614-927d-dc44da4a4a49/walkthrough.md).

### User Input

Add login for student and supervisor.
Save login users in local MySQL, not only inside React.
The server should decide what each logged-in person is allowed to do.
Do not let the browser decide the role by itself.
Only do this login step.

*Edited relevant file*

### Planner Response

I have created the [implementation plan](file:///C:/Users/Tharu/.gemini/antigravity-ide/brain/f62dd699-7e3d-4614-927d-dc44da4a4a49/implementation_plan.md) to integrate the local MySQL-backed login system, server-side JWT authentication, and role authorization checks.

Please review and approve the plan to begin execution!

*Edited relevant file*

*User accepted the command `npm install bcryptjs jsonwebtoken`*

*Edited relevant file*

*Edited relevant file*

*User accepted the command `npm run db:init`*

*Edited relevant file*

*Edited relevant file*

*Viewed [App.css](file:///h:/docs/Demo/Ai-Workshop/9%20Student%20Project%20Tracker/p1/frontend/src/App.css) *

*Edited relevant file*

*Viewed [task-75.log](file:///C:/Users/Tharu/.gemini/antigravity-ide/brain/f62dd699-7e3d-4614-927d-dc44da4a4a49/.system_generated/tasks/task-75.log) *

*Edited relevant file*

*Edited relevant file*

### Planner Response

I have implemented secure, server-side verified login and authentication.

### Summary of Changes:
1. **User Schema & Seed:** Added the `users` table to the database setup in [dbSetup.js](file:///h:/docs/Demo/Ai-Workshop/9%20Student%20Project%20Tracker/p1/backend/dbSetup.js). Seeded default student (`alice`) and supervisor (`dr_john`) accounts with hashed passwords (both using password: `password123`).
2. **Server-Side Token Authentication:** Added JWT authentication middleware and a `/api/auth/login` route to [server.js](file:///h:/docs/Demo/Ai-Workshop/9%20Student%20Project%20Tracker/p1/backend/server.js). The server decodes JWT tokens on all requests and strictly verifies if the user role is authorized to perform the given action.
3. **Login Dashboard UI:** Added a login interface in [App.jsx](file:///h:/docs/Demo/Ai-Workshop/9%20Student%20Project%20Tracker/p1/frontend/src/App.jsx) and saved session tokens to `localStorage` to ensure persistence across reloads. 

You can view the full login and role authorization walkthrough in the [walkthrough](file:///C:/Users/Tharu/.gemini/antigravity-ide/brain/f62dd699-7e3d-4614-927d-dc44da4a4a49/walkthrough.md).

### User Input

Add filtering by supervisor, category or status.

*Edited relevant file*

### Planner Response

I have created the [implementation plan](file:///C:/Users/Tharu/.gemini/antigravity-ide/brain/f62dd699-7e3d-4614-927d-dc44da4a4a49/implementation_plan.md) to implement API-level filtering by supervisor name, category, and status, and to provide a unified filters bar in the UI.

Please review and approve the plan so we can implement it!

*Edited relevant file*

*Viewed [server.js](file:///h:/docs/Demo/Ai-Workshop/9%20Student%20Project%20Tracker/p1/backend/server.js) *

*Edited relevant file*

*Edited relevant file*

*Viewed [App.css](file:///h:/docs/Demo/Ai-Workshop/9%20Student%20Project%20Tracker/p1/frontend/src/App.css) *

*Edited relevant file*

*Edited relevant file*

*Edited relevant file*

### Planner Response

I have implemented database-level project filtering by supervisor name, category, and status.

### Summary of Changes:
1. **API Query Filtering:** Modified `GET /api/projects` in [server.js](file:///h:/docs/Demo/Ai-Workshop/9%20Student%20Project%20Tracker/p1/backend/server.js) to dynamically build and run SQL queries using parameters for `supervisor_name`, `category`, and `status`.
2. **Unified Filter Bar:** Built a modern horizontal filter bar at the top of the submissions list in [App.jsx](file:///h:/docs/Demo/Ai-Workshop/9%20Student%20Project%20Tracker/p1/frontend/src/App.jsx) (available in both Student and Supervisor views). Changing any filters automatically serializes query parameters and fetches matching results from the server.
3. **Filter Reset:** Added a **Reset** button that instantly clears filters and re-fetches all submissions.

You can view the filtering walkthrough and demo recordings in the [walkthrough](file:///C:/Users/Tharu/.gemini/antigravity-ide/brain/f62dd699-7e3d-4614-927d-dc44da4a4a49/walkthrough.md).

### User Input

Check if the app works and fix broken parts.
Add a simple test command I can run.
The test should check saving to local MySQL, login, permissions, the main work, and the extra part.
Use test data and clean it up.

*Edited relevant file*

### Planner Response

I have created the [implementation plan](file:///C:/Users/Tharu/.gemini/antigravity-ide/brain/f62dd699-7e3d-4614-927d-dc44da4a4a49/implementation_plan.md) for adding an automated integration test script.

Please review and approve the plan so we can create and run the tests!
*(Remember: the backend server must be running on port 5001 to pass the HTTP tests)*.


*Edited relevant file*

*Edited relevant file*

*Edited relevant file*

*User accepted the command `npm test`*

*Edited relevant file*

*Edited relevant file*

### Planner Response

I have successfully added a full automated test suite to verify the application's correctness.

### Key Additions:
1. **Automated Integration Test Script:** Created [test.js](file:///h:/docs/Demo/Ai-Workshop/9%20Student%20Project%20Tracker/p1/backend/test.js) in the backend. This script automates logging in as student/supervisor, verifies permissions, performs submission and edit operations, reviews and changes status/feedback, tests list filtering, and conducts database verification.
2. **Auto-Cleanup:** The test uses clean test data and automatically purges its temporary records from the MySQL database at the end of the run.
3. **Register Test Command:** Added the `test` command to the backend [package.json](file:///h:/docs/Demo/Ai-Workshop/9%20Student%20Project%20Tracker/p1/backend/package.json).

You can run the tests at any time in the `backend/` directory by executing:
```bash
npm test
```

Please find the detailed test coverage details in the [walkthrough](file:///C:/Users/Tharu/.gemini/antigravity-ide/brain/f62dd699-7e3d-4614-927d-dc44da4a4a49/walkthrough.md).

### User Input

Make the app safer and stop users doing wrong things.

*Edited relevant file*

### Planner Response

I have created the [security implementation plan](file:///C:/Users/Tharu/.gemini/antigravity-ide/brain/f62dd699-7e3d-4614-927d-dc44da4a4a49/implementation_plan.md) to implement rate limiting, strict input validation, and restricted CORS origins to make the app secure and prevent wrong actions.

Please review and approve the plan to begin execution!

*Edited relevant file*

*User accepted the command `npm install express-rate-limit`*

*Edited relevant file*

*User accepted the command `npm test`*

*Edited relevant file*

*Edited relevant file*

### Planner Response

I have implemented security hardening measures to secure the application.

### Key Additions:
1. **Rate Limiting:** Installed `express-rate-limit` to protect the API from denial-of-service and brute-force login attacks. Applied a general limit of 150 requests per 15 minutes, and a strict limit of 15 login attempts per 15 minutes.
2. **Strict CORS Configurations:** Restricted CORS in [server.js](file:///h:/docs/Demo/Ai-Workshop/9%20Student%20Project%20Tracker/p1/backend/server.js) to only accept requests coming from your frontend client ports (`5173` and `5174`), blocking outside domains.
3. **Server-side Input Validation:** Implemented a `validateProjectInput` helper that validates the formats and string lengths of project titles, descriptions, categories, supervisor names, statuses, and feedback fields.

All changes have been successfully validated by running the test suite:
```bash
npm test
```

For more details on the validation checks and rate limiting rules, please refer to the [walkthrough](file:///C:/Users/Tharu/.gemini/antigravity-ide/brain/f62dd699-7e3d-4614-927d-dc44da4a4a49/walkthrough.md).

### User Input

Clean up the code and keep the app working.

*Viewed [main.jsx](file:///h:/docs/Demo/Ai-Workshop/9%20Student%20Project%20Tracker/p1/frontend/src/main.jsx) *

*Viewed [index.css](file:///h:/docs/Demo/Ai-Workshop/9%20Student%20Project%20Tracker/p1/frontend/src/index.css) *

*Edited relevant file*

*User accepted the command `npm test`*

*Edited relevant file*

### Planner Response

I have completed the code cleanup process to ensure a neat presentation.

### Summary of Changes:
- **CSS Reset:** Cleaned up [index.css](file:///h:/docs/Demo/Ai-Workshop/9%20Student%20Project%20Tracker/p1/frontend/src/index.css) to prevent the default Vite framework stylesheet from overriding the custom grid, margins, and center alignments designed in [App.css](file:///h:/docs/Demo/Ai-Workshop/9%20Student%20Project%20Tracker/p1/frontend/src/App.css).
- **Validation Run:** Ran `npm test` to confirm that the app's functionality remains 100% intact.
- **Visual Validation:** Verified in the browser that the login portal renders correctly with proper spacing and alignments.

You can view the cleanup logs and rendering results in the [walkthrough](file:///C:/Users/Tharu/.gemini/antigravity-ide/brain/f62dd699-7e3d-4614-927d-dc44da4a4a49/walkthrough.md).

### User Input

Change the app: supervisors can request revisions, and students can edit and resubmit only those submissions.

*Edited relevant file*

### Planner Response

I have created the [implementation plan](file:///C:/Users/Tharu/.gemini/antigravity-ide/brain/f62dd699-7e3d-4614-927d-dc44da4a4a49/implementation_plan.md) to implement the revision request and restricted student editing workflow.

Please review and approve the plan so we can modify the code and update the integration test suite!

*Edited relevant file*

*Viewed [server.js](file:///h:/docs/Demo/Ai-Workshop/9%20Student%20Project%20Tracker/p1/backend/server.js) *

*Edited relevant file*

*Viewed [App.jsx](file:///h:/docs/Demo/Ai-Workshop/9%20Student%20Project%20Tracker/p1/frontend/src/App.jsx) *

*Viewed [App.jsx](file:///h:/docs/Demo/Ai-Workshop/9%20Student%20Project%20Tracker/p1/frontend/src/App.jsx) *

*Edited relevant file*

*Viewed [App.css](file:///h:/docs/Demo/Ai-Workshop/9%20Student%20Project%20Tracker/p1/frontend/src/App.css) *

*Viewed [App.css](file:///h:/docs/Demo/Ai-Workshop/9%20Student%20Project%20Tracker/p1/frontend/src/App.css) *

*Edited relevant file*

*Edited relevant file*

*Viewed [test.js](file:///h:/docs/Demo/Ai-Workshop/9%20Student%20Project%20Tracker/p1/backend/test.js) *

*Edited relevant file*

*User accepted the command `npm test`*

*Edited relevant file*

*Edited relevant file*

### Planner Response

I have implemented the revision request and restricted student editing workflow.

### Summary of Changes:
1. **Status Transition Guardrails:** Configured the student `PUT /api/projects/:id` endpoint in [server.js](file:///h:/docs/Demo/Ai-Workshop/9%20Student%20Project%20Tracker/p1/backend/server.js) so that students are **blocked** from editing if their project status is `'Pending'`, `'Approved'`, or `'Rejected'`. Editing is strictly allowed **only** if the status is `'Revision Requested'`.
2. **Auto-resubmit Trigger:** Saving edits on a `'Revision Requested'` project automatically sets the project status back to `'Pending'` on the backend, queueing it for supervisor review and locking the student out of further edits.
3. **Supervisor Controls:** Added the `'Revision Requested'` status option to the supervisor review dropdown and filter options in [App.jsx](file:///h:/docs/Demo/Ai-Workshop/9%20Student%20Project%20Tracker/p1/frontend/src/App.jsx).
4. **Style Update:** Styled the new status badge in [App.css](file:///h:/docs/Demo/Ai-Workshop/9%20Student%20Project%20Tracker/p1/frontend/src/App.css) to distinguish revision requests from pending, approved, and rejected states.

All integration test assertions have been updated in [test.js](file:///h:/docs/Demo/Ai-Workshop/9%20Student%20Project%20Tracker/p1/backend/test.js) and pass successfully:
```bash
npm test
```

Please see the walkthrough, recording, and screenshots in the [walkthrough](file:///C:/Users/Tharu/.gemini/antigravity-ide/brain/f62dd699-7e3d-4614-927d-dc44da4a4a49/walkthrough.md).