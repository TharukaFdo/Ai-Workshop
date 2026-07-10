# Internship Application Tracker Prototype

A lightweight, secure internship application tracking system for students and coordinators built using React, Node.js/Express, and MySQL.

---

## Technical Stack
- **Frontend**: React (Vite), React Router, Lucide Icons, and Custom Vanilla CSS.
- **Backend**: Node.js, Express, `mysql2/promise` (connection pooling), and custom session token authentication.
- **Database**: Local MySQL (database name: `c4p2`).

---

## Installation & Setup

### 1. Database Initialization
Make sure local MySQL is running on port `3306` (or configure via environment variables).

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```
2. Initialize and seed the database schema:
   ```bash
   npm run db:setup
   ```
   *This creates a database named `c4p2`, sets up the tables for `users`, `sessions`, and `applications`, and populates pre-seeded login credentials.*

### 2. Run the Backend Server
1. From the `backend` directory, install Node dependencies:
   ```bash
   npm install
   ```
2. Launch the developer server:
   ```bash
   npm run dev
   ```
   *The backend starts listening on `http://localhost:5001`.*

### 3. Run the Frontend Client
1. Open a new terminal and navigate to the frontend directory:
   ```bash
   cd frontend
   ```
2. Install Node dependencies:
   ```bash
   npm install
   ```
3. Start the Vite React development server:
   ```bash
   npm run dev
   ```
   *Open `http://localhost:5173/` in your browser to view the application.*

---

## Testing Pre-Seeded Accounts

| Username | Password | Role | Description |
| :--- | :--- | :--- | :--- |
| **student1** | `student123` | Student | Can submit applications and view their own status. |
| **student2** | `student123` | Student | Can submit applications and view their own status. |
| **coordinator1** | `coord123` | Coordinator | Can review all applications, write comments, and change status. |

---

## Running Automated Verification Tests
We have integrated a comprehensive testing command that asserts all date validation checks, database-backed authentication, role constraints, and status filtering.

To run the automated tests:
```bash
cd backend
npm test
```
