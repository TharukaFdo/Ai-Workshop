# Maintenance Request Tracker Prototype

A web-based maintenance problem reporting and tracking prototype built with **React**, **Express/Node.js**, and **MySQL**.

## Project Structure
*   `backend/`: Express server, router endpoints, database connection config, and the SQL schema.
*   `frontend/`: React SPA powered by Vite.
*   `PROJECT_CONTEXT.md`: High-level summary of roles, scope, and workflows.
*   `REQUIREMENTS.md`: Detailed system requirements and validation/verification rules.

---

## Setup Instructions

### 1. Database Setup
1.  Ensure you have a local instance of **MySQL** running.
2.  Log into your MySQL client and execute the schema located at `backend/schema.sql` to initialize the database and seed roles:
    ```bash
    mysql -u root -p < backend/schema.sql
    ```

### 2. Environment Variables Configuration
1.  Navigate to the `backend/` directory.
2.  Copy `.env.example` to `.env`:
    ```bash
    cp .env.example .env
    ```
3.  Configure database credentials in `backend/.env`:
    *   `DB_HOST`: Database host (typically `localhost`)
    *   `DB_PORT`: Database port (typically `3306`)
    *   `DB_USER`: Database user
    *   `DB_PASSWORD`: Database password
    *   `DB_NAME`: Database name (`c7p3`)

### 3. Dependencies Installation
From the root workspace folder, run the script helper to install packages for both frontend and backend directories:
```bash
npm run install-all
```

---

## Running the Application

To run the project, start the backend and frontend servers in separate terminal windows:

### Terminal 1: Backend
```bash
npm run backend
```
The backend server runs on `http://localhost:5000`.

### Terminal 2: Frontend
```bash
npm run frontend
```
The frontend dev server runs on `http://localhost:3000`.
