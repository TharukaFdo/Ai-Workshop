# Library Lending System Prototype

This is the prototype backbone for the **Library Lending System**, built with React, Node.js/Express, and MySQL.

## Project Structure
```
├── backend/
│   ├── config/          # Database configuration wrapper
│   │   └── db.js
│   ├── routes/          # Express API route modules
│   │   └── books.js
│   ├── .env.example     # Environment variables blueprint
│   ├── package.json     # Backend configuration & dependencies
│   └── server.js        # Express app main entrypoint
├── frontend/
│   ├── src/
│   │   ├── App.jsx      # Main application component
│   │   ├── index.css    # Typography, theme variables, core layouts
│   │   └── main.jsx     # Vite-React mounting bootstrap
│   ├── index.html
│   ├── package.json     # Frontend configuration & dependencies
│   └── vite.config.js   # Vite configuration containing local proxy rules
├── README.md            # Installation and setup manual
├── PROJECT_CONTEXT.md   # Project scope, roles, and risks definitions
└── REQUIREMENTS.md      # Functional specifications, constraints, and validation
```

---

## Getting Started

### 1. Database Setup
1. Open your local MySQL CLI or a client tool (e.g., MySQL Workbench).
2. Create a new database:
   ```sql
   CREATE DATABASE library_lending_db;
   ```

### 2. Configure Environment Variables
1. Go to the `backend/` directory.
2. Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```
3. Open `.env` and fill in your local MySQL credentials:
   ```env
   DB_HOST=127.0.0.1
   DB_PORT=3306
   DB_USER=root
   DB_PASSWORD=your_mysql_password
   DB_NAME=library_lending_db
   ```

### 3. Installation
From the root workspace directory, run:
```bash
npm run install:all
```
This command automatically installs all dependencies for the root, frontend, and backend packages.

### 4. Running the Project
To spin up both the Vite dev server (frontend) and nodemon server (backend) concurrently:
```bash
npm run start
```
* Frontend runs on: `http://localhost:3000`
* Backend runs on: `http://localhost:5000`
