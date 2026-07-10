# Internship Application Tracker

A prototype application allowing students to submit internship placement details and coordinators to review and update status fields with feedback comments.

## Project Structure
- `frontend/`: React single page application with Vite bundler.
- `backend/`: Express.js API server configured with a MySQL database connection.
- `PROJECT_CONTEXT.md`: High-level business goals, scope, roles, and constraints.
- `REQUIREMENTS.md`: Detailed system requirements, user acceptance criteria, and permissions matrix.

## Prerequisites
- **Node.js** (v18+ recommended)
- **MySQL Server** (running locally)

## Getting Started

### 1. Environment Configuration
Create a `.env` file in the `backend/` directory (or copy `backend/.env.example`):
```env
PORT=5000
DB_HOST=localhost
DB_PORT=3306
DB_USER=your_mysql_username
DB_PASSWORD=your_mysql_password
DB_NAME=c4p3
```

### 2. Database Setup
Ensure your local MySQL server is running, then run the database setup script to create and seed the `c4p3` database:
```bash
npm run db:setup
```

### 3. Installation
Install all dependencies for root, frontend, and backend packages using:
```bash
npm run install:all
```

### 4. Running the Application
To run both the frontend React server (on port 3000) and backend Express server (on port 5000) concurrently in development mode:
```bash
npm run dev
```

- Frontend: [http://localhost:3000](http://localhost:3000)
- Backend: [http://localhost:5000](http://localhost:5000)
- Health Check: [http://localhost:5000/api/health](http://localhost:5000/api/health)
