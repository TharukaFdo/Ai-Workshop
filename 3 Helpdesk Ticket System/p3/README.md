# Helpdesk Ticket System

This is a prototype Helpdesk Ticket System built using React, Express, Node.js, and local MySQL.

## Project Structure
*   `frontend/`: React application (Vite-based)
*   `backend/`: Express server, database configurations, routing, and controller logic
*   `PROJECT_CONTEXT.md`: High-level workflow, roles, and scope definition
*   `REQUIREMENTS.md`: Detailed functional requirements, validation, and acceptance criteria

---

## Getting Started

### Prerequisites
*   Node.js (v16 or higher recommended)
*   MySQL Server running locally

### Database Setup
To initialize or reset the database, run the repeatable database setup script from the root directory:
```bash
npm run db:setup
```
This script creates the database `c3p3`, builds the `app_users` and `tickets` tables, and inserts initial seed data (demo users and tickets).

### Environment Configuration
1.  Create a `.env` file in the `backend/` directory (you can copy `backend/.env.example` as a template):
    ```env
    PORT=5000
    DB_HOST=localhost
    DB_PORT=3306
    DB_USER=root
    DB_PASSWORD=
    DB_NAME=c3p3
    ```

### Installation
From the root project directory, run:
```bash
# Install root, backend, and frontend dependencies
npm install
npm run install:all
```

---

## Running the Application

### Option 1: Run Both Frontend and Backend Concurrently (Recommended)
From the root directory, run:
```bash
npm run dev
```

### Option 2: Run Separately
*   **Backend:**
    ```bash
    cd backend
    npm run start  # or npm run dev for nodemon
    ```
*   **Frontend:**
    ```bash
    cd frontend
    npm install    # if not done already
    npm run dev
    ```
