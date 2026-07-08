# Equipment Booking System

A web-based portal to request, manage, and filter shared lab equipment bookings. Built with React (Vite), Node.js/Express, and MySQL.

## Project Structure
- `backend/`: Express server logic, database configuration, routes, and middleware.
- `frontend/`: React single-page application.
- `package.json`: Root manager for running the full-stack app.

## Prerequisites
- Node.js (v18 or higher recommended)
- MySQL Server

## Setup Instructions

### 1. Database Setup
Ensure your MySQL server is running, then run the initialization script:
```bash
mysql -u your_username -p < backend/config/schema.sql
```

### 2. Configuration
Copy the `.env.example` in the `backend/` directory to `.env` and fill in your MySQL details:
```bash
cp backend/.env.example backend/.env
```
Key fields to configure:
- `PORT` (default 5001)
- `DB_HOST`
- `DB_PORT` (default 3306)
- `DB_USER`
- `DB_PASSWORD`
- `DB_NAME`

### 3. Installation
Install dependencies for both frontend and backend:
```bash
npm run install:all
```

### 4. Running the Application
To run both the frontend and backend concurrently in development mode:
```bash
npm run dev
```
- Backend runs on: `http://localhost:5001`
- Frontend runs on: `http://localhost:5173`
