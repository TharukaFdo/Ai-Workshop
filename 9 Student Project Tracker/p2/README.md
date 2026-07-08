# Student Project Tracker Prototype

This is a prototype of the Student Project Tracker application. It consists of a React frontend built with Vite and an Express backend connecting to a local MySQL database.

## Prerequisites

- Node.js (v18+)
- MySQL

## Setup Instructions

### 1. Database Configuration & Setup

You can configure and populate the MySQL database using the repeatable scripts:

1. Create a database named `c9p2` in your local MySQL instance.
2. In the `backend` directory, copy `.env.example` to `.env` and configure your database parameters:
   ```env
   PORT=5000
   DB_HOST=localhost
   DB_PORT=3306
   DB_USER=root
   DB_PASSWORD=your_password
   DB_NAME=c9p2
   JWT_SECRET=your_jwt_signing_key_here
   ```
3. Navigate to the `backend` directory, install dependencies, and run the setup script to construct tables and seed hashed credentials:
   ```bash
   cd backend
   npm install
   npm run db:setup
   ```
4. If you want to drop the database and perform a clean reseed at any time, run the reset command:
   ```bash
   npm run db:reset
   ```

### 2. Startup Servers

#### Start Backend
```bash
cd backend
npm run dev
```
The server will run on `http://localhost:5000`.

#### Start Frontend
```bash
cd frontend
npm install
npm run dev
```
Vite will start the React server at `http://localhost:5173`.

### 3. Run Automated Tests
You can verify the backend routes, database constraints, input validations, and role spoofing prevention using Jest integration tests:
```bash
cd backend
npm run test
```

---

## Code Architecture

*   **Backend Structure:**
    *   [db.js](file:///h:/docs/Demo/Ai-Workshop/9%20Student%20Project%20Tracker/p2/backend/src/db.js): Promisified MySQL connection pool.
    *   [auth.js (middleware)](file:///h:/docs/Demo/Ai-Workshop/9%20Student%20Project%20Tracker/p2/backend/src/middleware/auth.js): Cryptographically checks session signatures and validates user roles from the database.
    *   [auth.js (routes)](file:///h:/docs/Demo/Ai-Workshop/9%20Student%20Project%20Tracker/p2/backend/src/routes/auth.js): Secure login with password hashing verification.
    *   [projects.js (routes)](file:///h:/docs/Demo/Ai-Workshop/9%20Student%20Project%20Tracker/p2/backend/src/routes/projects.js): Project proposal submission and supervisor reviews.
*   **Frontend Structure:**
    *   [App.jsx](file:///h:/docs/Demo/Ai-Workshop/9%20Student%20Project%20Tracker/p2/frontend/src/App.jsx): Main dashboard state management.
    *   [components/](file:///h:/docs/Demo/Ai-Workshop/9%20Student%20Project%20Tracker/p2/frontend/src/components/): Modular React layouts:
        *   [LoginScreen.jsx](file:///h:/docs/Demo/Ai-Workshop/9%20Student%20Project%20Tracker/p2/frontend/src/components/LoginScreen.jsx): Secure login form.
        *   [FiltersPanel.jsx](file:///h:/docs/Demo/Ai-Workshop/9%20Student%20Project%20Tracker/p2/frontend/src/components/FiltersPanel.jsx): Category, status, and supervisor filters.
        *   [ProjectCard.jsx](file:///h:/docs/Demo/Ai-Workshop/9%20Student%20Project%20Tracker/p2/frontend/src/components/ProjectCard.jsx): Submissions list card.
        *   [Modals.jsx](file:///h:/docs/Demo/Ai-Workshop/9%20Student%20Project%20Tracker/p2/frontend/src/components/Modals.jsx): Submit, edit, and review modals.
