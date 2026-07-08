# Workshop Registration System

A lightweight prototype web application to manage training workshop registrations and attendance, built using React, Express, Node.js, and local MySQL.

---

## Project Structure

```
p3/
├── frontend/             # React Client (Vite scaffolded)
│   ├── src/
│   │   ├── App.jsx
│   │   └── App.css
│   └── vite.config.js    # Sets up proxy /api to target backend port 5000
├── backend/              # Node.js Express Server
│   ├── config/
│   │   ├── db.js         # MySQL2 Connection Pool setup
│   │   ├── schema.sql    # Database schema, tables, and seed users
│   │   └── setupDb.js    # Automated database creation and schema setup
│   ├── services/
│   │   └── registrationService.js # Data Access / Service layer
│   ├── server.js         # Server entry point
│   ├── .env.example      # Example environment configuration
│   └── package.json
├── package.json          # Root scripts to run both apps simultaneously
├── PROJECT_CONTEXT.md    # High-level architecture, scope, & constraints
└── REQUIREMENTS.md       # Validation rules, security requirements & checklist
```

---

## Getting Started

### Prerequisites
* **Node.js**: v18+ (tested on v24.12.0)
* **MySQL**: Local instance running (default port `3306`)

### 1. Database Setup
You do not need to manually create the database. Simply configure your credentials in `.env` (see below) and run the setup script:

```bash
# Run database setup (Creates database `c10p3` and imports schema automatically)
npm run db:setup
```

### 2. Configure Environment Variables
Ensure the `.env` file in the `backend/` directory matches your credentials:
```ini
PORT=5000
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=
DB_NAME=c10p3
```

### 3. Installation
From the root workspace directory, run:
```bash
npm run install:all
```
This command automatically installs dependencies for both the frontend and backend.

### 4. Running the Application locally
To run both the frontend developer server and the backend server concurrently:
```bash
npm run dev
```
* **Frontend Dev Server**: [http://localhost:5173](http://localhost:5173)
* **Backend API**: [http://localhost:5000](http://localhost:5000)
* **Health Endpoint**: [http://localhost:5000/api/health](http://localhost:5000/api/health)
