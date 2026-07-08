# Workshop Registration System Prototype Scaffold

This is a prototype web application designed for managing participant registration and attendance for training workshops.

## Technology Stack
- **Frontend**: React (Vite), Vanilla CSS (glassmorphic dark design)
- **Backend**: Node.js, Express
- **Database**: MySQL

## Project Structure
- `backend/`:
  - `middleware/auth.js`: Database-backed session token authentication middleware.
  - `routes/auth.js`: Authentication routers for login and logout.
  - `routes/registrations.js`: Registration logic routers (create, status lookup, updates).
  - `server.js`: Entry point mounting routes and app middlewares.
  - `db.js`: MySQL pool connections module.
  - `schema.sql`: SQL creation definitions.
  - `scripts/`: DB initialization and resetting helper scripts.
  - `tests/`: Automated API integration tests suite.
- `frontend/`: React components, views, layout, and client-side routing.

## Getting Started

### 1. Database Setup
1. Ensure you have a local MySQL instance running.
2. Run the repeatable database initialization command:
   ```bash
   cd backend
   npm run db:setup
   ```
   Or use the reset command if you wish to clear all tables and start fresh:
   ```bash
   npm run db:reset
   ```
3. This creates the database `c10p2`, tables for `users` and `registrations`, and inserts default accounts:
   - **Organizer**: `organizer` / `password123`
   - **Participant**: `participant` / `password123`

### 2. Environment Configuration
Configure the `backend/.env` file with your local MySQL credentials:
```env
PORT=8081
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=
DB_NAME=c10p2
```

### 3. Running the Backend
Navigate to the `backend/` directory, install dependencies, and start the development server:
```bash
cd backend
npm install
npm run dev
```
The server will start running on port `8081`.

### 4. Running the Frontend
Navigate to the `frontend/` directory, install dependencies, and start the Vite development server:
```bash
cd frontend
npm install
npm run dev
```
The client dashboard will start running, typically at `http://localhost:5173`.
All API calls from the frontend pointing to `/api` are configured to automatically proxy to the backend at `http://localhost:8081`.

### 5. Running Automated Backend Tests
Ensure the backend server is running (`npm run dev` or `node server.js` on port `8081`).
Then, navigate to the `backend/` directory and run:
```bash
cd backend
npm run test
```
This runs the integration test suite, verifies all authorization rules and spoofing protection, and cleans up all generated test records.
