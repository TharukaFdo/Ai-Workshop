# Student Project Tracker

A prototype application for students to submit software projects and supervisors to review and add feedback.

## Project Structure
- `/backend`: Node.js Express server + MySQL connection.
- `/frontend`: React client build with Vite.

## Setup Instructions

### Prerequisites
- Node.js (v18+)
- MySQL database instance

### 1. Database Setup
Ensure MySQL is running locally. You do not need to manually create the database. Simply configure the credentials in the next step, then run the setup script:
```bash
npm run db:setup
```
This script will automatically create the database `c9p3` and seed it with prototype roles and mock submissions.

### 2. Configure Environment Variables
Rename or copy `backend/.env.example` to `backend/.env` and fill in your local MySQL credentials:
```env
PORT=5000
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=
DB_NAME=c9p3
```

### 3. Installation
From the root directory, run:
```bash
npm run install:all
```

### 4. Running the Application
To run the backend developer server:
```bash
npm run dev:backend
```

To run the frontend developer server:
```bash
npm run dev:frontend
```
The frontend will start on [http://localhost:5173](http://localhost:5173) (or next available port).
