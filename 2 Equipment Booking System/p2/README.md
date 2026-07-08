# Lab Equipment Booking System

A secure React, Node.js/Express, and local MySQL booking management application designed to handle shared lab equipment reservations for staff members and lab assistants.

## Folder Architecture

```
├── client/                     # React Frontend Component (Vite)
│   ├── src/
│   │   ├── components/         # Reusable React UI Elements
│   │   │   ├── LoginForm.jsx   # Stateful Authentication Form
│   │   │   ├── FilterBar.jsx   # Dynamic Listings Filter Bar
│   │   │   ├── BookingForm.jsx # Request Submission Form (Staff)
│   │   │   ├── BookingCard.jsx # Info Card & Decisions Panel
│   │   │   └── DecisionModal.jsx # Assistant Comments overlay
│   │   ├── App.jsx             # React Orchestrator State Container
│   │   ├── index.css           # UI Glassmorphic Styling Sheet
│   │   └── main.jsx
│   ├── index.html
│   └── vite.config.js
│
└── server/                     # Express Backend API Component
    ├── middleware/
    │   └── auth.js             # Token session database validator
    ├── routes/
    │   ├── auth.js             # Authentication controllers
    │   └── bookings.js         # Booking requests controllers
    ├── db.js                   # MySQL connection pool builder
    ├── db-setup.js             # Seeding / Migration execution script
    ├── index.js                # App Entrypoint / Listener
    ├── schema.sql              # Database structure
    └── test.js                 # Integration & Spoofing Test Suite
```

## Setup Instructions

### 1. Database Configuration
1. Ensure your local MySQL server is active on `localhost:3306`.
2. Configure credentials inside the backend environment file:
   Create a `.env` file under `server/` containing:
   ```env
   PORT=5000
   DB_HOST=localhost
   DB_PORT=3306
   DB_USER=your_username
   DB_PASSWORD=your_password
   DB_NAME=c2p1
   ```

### 2. Database Migration & Seeding
Deploy and seed the database schemas by running the setup script in the `server` directory:
```bash
cd server
npm run db:setup
```
This executes the migrations inside `schema.sql` and sets up the following demo credentials:
*   **Staff Members**: `alice_staff` / `password123`, `bob_staff` / `password123`
*   **Lab Assistant**: `clara_assistant` / `password123`

---

## Execution Instructions

### Run Backend Server
Start the Express server watching for files:
```bash
cd server
npm run dev
```

### Run Frontend Client
Start the Vite developer server:
```bash
cd client
npm run dev
```
Open `http://localhost:3000` in the browser to interact with the UI.

---

## Testing Instructions

### Run Automated Integration & Spoofing Tests
Run the test runner to execute all 11 security and controller integrations:
```bash
cd server
npm run test
```
The test suite starts an isolated backend listener on port `5002` (preventing EADDRINUSE collisions) and cleans up all generated mock entries automatically after completion.
