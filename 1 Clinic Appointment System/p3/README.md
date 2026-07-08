# Clinic Appointment System

A simplified Clinic Appointment System prototype developed using React, Node.js with Express, and local MySQL.

## Project Structure
* `frontend/`: React application scaffolded using Vite.
* `backend/`: Node.js Express server handling business logic, simulated authorization, and database access.

## Prerequisites
* Node.js (v18+ recommended)
* MySQL Server running locally

## Setup Instructions

### 1. Database Configuration
1. Log into your local MySQL instance.
2. Create a database:
   ```sql
   CREATE DATABASE clinic_appointments;
   ```

### 2. Environment Setup
1. Navigate to the `backend/` directory.
2. Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```
3. Update `.env` with your MySQL connection credentials:
   ```env
   DB_HOST=localhost
   DB_PORT=3306
   DB_USER=root
   DB_PASSWORD=your_mysql_password
   DB_NAME=clinic_appointments
   PORT=5000
   ```

### 3. Installation
Install all dependencies from the root directory:
```bash
npm run install:all
```

## Running the Application

### Start the Backend API
Run the Express development server (runs on `http://localhost:5000` by default):
```bash
npm run dev:backend
```

### Start the Frontend Dev Server
Run the Vite development server:
```bash
npm run dev:frontend
```
Open `http://localhost:5173` in your browser.
