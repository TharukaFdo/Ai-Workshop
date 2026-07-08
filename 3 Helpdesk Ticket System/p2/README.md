# Helpdesk Ticket System Prototype

This repository contains a prototype of the **Helpdesk Ticket System** built using React (Vite), Node.js (Express), and MySQL.

## Project Structure

```text
├── backend/
│   ├── config/
│   │   └── db.js            # MySQL connection configuration using pool
│   ├── .env                 # Environment variables configuration (Port, Database secrets)
│   ├── .env.example         # Template for environment variables
│   ├── package.json         # Backend dependencies & script definitions
│   └── server.js            # Express server entry point with routes scaffold
├── frontend/
│   ├── src/
│   │   ├── components/      # React shared components
│   │   │   └── Navbar.jsx   # Header navigation
│   │   ├── pages/           # Client-side router pages
│   │   │   ├── Dashboard.jsx
│   │   │   ├── Login.jsx
│   │   │   ├── CreateTicket.jsx
│   │   │   └── TicketDetails.jsx
│   │   ├── App.jsx          # Route mapping definition
│   │   ├── index.css        # Global CSS stylesheet & design tokens
│   │   └── main.jsx         # Client mount entry point
│   ├── package.json         # Frontend dependencies & dev scripts
│   └── vite.config.js       # Vite bundler options
├── schema.sql               # MySQL database migration script
└── README.md                # System documentation
```

## Running the Application

### 1. Database Setup
Ensure you have a local MySQL instance running.
Run the database migration script:
```bash
mysql -u root -p < schema.sql
```

### 2. Run Backend
Navigate to the `backend` folder, set up your `.env` file, and start the development server:
```bash
cd backend
npm install
npm run dev
```
The backend server runs on `http://localhost:5000`.

### 3. Run Frontend
Navigate to the `frontend` folder and start the Vite development server:
```bash
cd frontend
npm install
npm run dev
```
The frontend server runs on `http://localhost:5173`.
