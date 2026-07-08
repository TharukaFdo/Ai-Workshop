# Room Booking System

A simplified room booking application. This project is structured with a separate React frontend (powered by Vite) and an Express backend connecting to a local MySQL database.

---

## Folder Structure
```
/ (root)
├── package.json         # Orchestrates scripts to run front/back together
├── README.md            # Setup and configuration guidelines
├── backend/
│   ├── package.json     # Express server setup and dependencies
│   ├── .env.example     # Configuration keys for server/DB
│   └── server.js        # Main Express API entrypoint
└── frontend/
    ├── package.json     # React client setup and dev server
    ├── .env.example     # Port and API connection strings
    └── index.html       # Vite web layout
```

---

## Getting Started

### 1. Database Setup
1. Ensure your local MySQL instance is running.
2. Setup and seed the database using the automatic migration script:
   ```bash
   npm run db:setup
   ```
   This will automatically create a database named `c8p3`, build the tables (`app_users`, `room_bookings`), and seed initial users and bookings.

### 2. Environment Variables Configuration
Copy `.env.example` configurations to local `.env` files.

#### For the Backend (`/backend`):
Create `/backend/.env` file:
```env
PORT=5000
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=
DB_NAME=c8p3
```

#### For the Frontend (`/frontend`):
Create `/frontend/.env` file:
```env
VITE_API_URL=http://localhost:5000/api
```

---

## Installation & Running the App

### Option A: Monorepo Orchestration (Root)
Install all dependencies and run concurrently from the root directory:
```bash
# 1. Install all dependencies for root, backend, and frontend
npm run install-all

# 2. Run both front & backend concurrently
npm run dev
```

### Option B: Manual Setup
You can also run both apps independently.

#### In the Backend:
```bash
cd backend
npm install
npm run dev
```
The Express server starts on `http://localhost:5000`.

#### In the Frontend:
```bash
cd frontend
npm install
npm run dev
```
The React frontend starts on `http://localhost:3000`.
