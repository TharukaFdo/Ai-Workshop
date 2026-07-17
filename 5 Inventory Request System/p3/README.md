# Inventory Request System Prototype

A web prototype where staff members can request inventory items and storekeepers can manage and track approvals and issuing.

## Tech Stack
- **Frontend**: React (with Vite & Vanilla CSS)
- **Backend**: Node.js & Express
- **Database**: Local MySQL

## Prerequisites
- Node.js (v16+)
- MySQL local server running

## Setup Instructions

1. **Clone & Install Dependencies**
   Run the following command in the root directory to install dependencies for both frontend and backend:
   ```bash
   npm install
   npm run install:all
   ```

2. **Database Setup**
   - Make sure your local MySQL server is running (default port `3306`).
   - Run the database setup script to automatically create and seed the `c5p3` database:
     ```bash
     npm run db:setup
     ```

3. **Backend Environment Setup**
   - Navigate to `backend/` and copy `.env.example` to `.env`:
     ```bash
     cp backend/.env.example backend/.env
     ```
   - Update the variables with your local MySQL credentials:
     ```env
     PORT=5000
     DB_HOST=127.0.0.1
     DB_PORT=3306
     DB_USER=your_username
     DB_PASSWORD=your_password
     DB_NAME=inventory_db
     ```

4. **Running the Application**
   From the root directory, run both servers concurrently:
   ```bash
   npm run dev
   ```
   - Backend will run at `http://localhost:5000`
   - Frontend will run at `http://localhost:5173`
