# Clinic Appointment System (Prototype)

A simple, role-based Web Application where clinic Receptionists can manage schedules (CRUD operations), and Doctors can view their personal appointment book and input visit summaries.

## Tech Stack
* **Frontend**: React (Vite, custom CSS)
* **Backend**: Node.js / Express
* **Database**: Local MySQL (MySQL2 driver)

---

## Setup & Running Guide

### 1. Database Setup
1. Make sure your local MySQL server is running.
2. In `/backend`, copy `.env.example` to `.env` and set your credentials:
   ```env
   PORT=5000
   DB_HOST=localhost
   DB_PORT=3306
   DB_USER=root
   DB_PASSWORD=
   DB_NAME=c1p2
   ```
3. Initialize the database schema and seed data:
   ```bash
   cd backend
   npm run db:setup
   ```

### 2. Run the Express Backend
```bash
cd backend
npm run dev
```
* **Server endpoint**: `http://localhost:5000`
* **Test Suite**: Run `npm test` inside `/backend` to check API and security permissions.

### 3. Run the React Frontend
```bash
cd frontend
npm run dev
```
* **Client access**: `http://localhost:5173` (by default)

---

## Workshop Access Accounts (Seeded)

| Username | Password | Role | Doctor Identifier |
|---|---|---|---|
| `receptionist1` | `password123` | Receptionist | *N/A (All schedules)* |
| `dr_smith` | `smith456` | Doctor | Dr. Smith |
| `dr_adams` | `adams789` | Doctor | Dr. Adams |
