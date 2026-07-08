# Maintenance Request Tracker - Scaffold

This is the initial scaffold for the Maintenance Request Tracker application, built using React (Vite), Node.js/Express, and MySQL.

## 📂 Project Structure

```text
├── backend/
│   ├── config/      # Configuration helpers (db.js)
│   ├── .env         # Server environment variables (created)
│   ├── db.js        # Database connection pool config
│   ├── package.json # Backend script & dependency declarations
│   ├── schema.sql   # SQL statements to set up database schema
│   └── server.js    # Express application root / entrypoint
└── frontend/
    ├── src/
    │   ├── App.jsx  # Primary React app container
    │   ├── index.css# Design tokens and styles
    │   └── main.jsx # Vite entry point
    ├── index.html   # Main layout file
    ├── package.json # Client scripts & dependencies
    └── vite.config.js # Proxy and builder config
```

---

## 🛠️ Getting Started

### 1. Database Setup
Ensure you have a local instance of MySQL running, then run the database initialization script:
```bash
mysql -u root -p < backend/schema.sql
```
*Note: Update `.env` credentials in `backend/.env` if your local MySQL configuration uses a different user, port, or password.*

### 2. Run the Backend Server
Navigate to the `backend/` directory and start the server:
```bash
cd backend
npm run dev
# Or start directly using node
npm start
```
The server will start running on `http://localhost:5000`.

### 3. Run the Frontend App
Navigate to the `frontend/` directory and start the Vite development server:
```bash
cd frontend
npm run dev
```
The application will start running on `http://localhost:3000`.

---

## 🔗 Verification
Open `http://localhost:3000` in your browser. The dashboard should perform a health check on the `/api/health` route and indicate:
- **API Health Status**: `OK`
- **Database Connection**: `Connected`
