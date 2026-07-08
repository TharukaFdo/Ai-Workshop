# Internship Application Tracker

A lightweight prototype for students to submit internship applications and coordinators to review them. Built with **React** (frontend), **Express** (backend), and **MySQL** (database).

---

## Project Structure

```
├── backend/
│   ├── config/database.js
│   ├── database/
│   │   ├── schema-001-schema.sql
│   │   ├── seed-001-demo-data.sql
│   │   ├── database-setup.js
│   │   └── reset-demo-data.js
│   ├── middleware/
│   ├── routes/
│   ├── services/
│   ├── .env
│   ├── .env.example
│   ├── package.json
│   └── server.js
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   ├── package.json
├── docs/
├── package.json
├── PROJECT_CONTEXT.md
└── REQUIREMENTS.md
```

---

## Prerequisites

- **Node.js** (v18 or later)
- **MySQL** server v8.0+
- A MySQL user with `CREATE DATABASE` privilege (default `root`)

---

## Environment Variables

### Backend: `backend/.env`

```env
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=c4p3
```

### Frontend: `frontend/.env` (optional)

```env
VITE_API_URL=http://localhost:5000/api
```

---

## Database Setup

### Step 1 — Install dependencies

```bash
cd backend
npm install
cd ..
cd frontend
npm install
cd ..
```

### Step 2 — Run schema and seed (non-destructive)

```bash
cd backend
npm run db:setup
cd ..
```

This script:
1. Creates the database `c4p3` (if it doesn't exist)
2. Applies the schema in `database/schema-001-schema.sql` (IF NOT EXISTS)
3. Applies demo seed data in `database/seed-001-demo-data.sql` (INSERT IGNORE)

### Step 3 — Verify database

```bash
cd backend
node database/database-setup.js
cd ..
```

Expected output:
```
Connecting to MySQL server...
Database ready.
Schema applied.
Demo seed data applied.
Tables prepared:
  app_users: 3 rows
  internship_applications: 5 rows
Done. Database setup complete.
```

### Step 4 — Reset demo data (optional)

```bash
cd backend
npm run db:reset
cd ..
```

This removes all sample data and resets auto-increment counters.

---

## Demo Users

| Username   | Password  | Role         | Display Name         |
|------------|-----------|--------------|-----------------------|
| student1   | demo123   | student      | Alice Student        |
| student2   | demo123   | student      | Bob Intern           |
| coord1     | demo123   | coordinator  | Dr. Jane Coordinator |

Passwords are bcrypt-hashed in the seed SQL.

---

## Running the Application

### Start backend (development)

```bash
cd backend
npm run dev
```

Server starts at `http://localhost:5000`

### Start frontend (development)

```bash
cd frontend
npm start
```

Frontend starts at `http://localhost:3000`

---

## Database Schema

### `app_users`

| Column       | Type               | Notes                          |
|-------------|---------------------|--------------------------------|
| id          | INT AUTO_INCREMENT | Primary Key                    |
| username    | VARCHAR(50)        | UNIQUE                         |
| password_hash | VARCHAR(255)     | bcrypt hash                    |
| role        | ENUM               | `student`, `coordinator`       |
| display_name | VARCHAR(150)      | Nullable                       |
| created_at  | DATETIME           | Auto                           |
| updated_at  | DATETIME           | Auto on update                 |

### `internship_applications`

| Column          | Type       | Notes                          |
|----------------|------------|--------------------------------|
| id             | INT AUTO_INCREMENT | Primary Key                    |
| student_name   | VARCHAR(150) | Not NULL                      |
| company_name   | VARCHAR(150) | Not NULL                      |
| position_title | VARCHAR(150) | Not NULL                      |
| start_date     | DATE       | Not NULL                      |
| end_date       | DATE       | Not NULL                      |
| submitted_date | DATE       | Not NULL                      |
| status         | ENUM       | `submitted`, `under_review`, `approved`, `rejected` (default: `submitted`) |
| coordinator_comment | TEXT   | Nullable                       |
| created_at     | DATETIME   | Auto                           |
| updated_at     | DATETIME   | Auto on update                 |

### Constraints

- `start_date < end_date` enforced at application layer
- Status transitions: only coordinators may change status
- `coordinator_comment` only editable by coordinators (enforced server-side)

---

## Testing Notes

### Automated tests (to be added later)

- Test database records will use the same local MySQL database (`c4p3`)
- Test records will be named with prefix `test_` (e.g. `test_student`)
- A cleanup script will remove all `test_` prefixed rows after test runs

### Manual checks

- Connect to MySQL and run:
  ```sql
  USE c4p3;
  SELECT * FROM app_users;
  SELECT * FROM internship_applications;
  ```
- Verify both tables have the demo rows from the seed script

---

## Notes & Assumptions

1. There is no user registration flow — demo accounts are seed-created.
2. Passwords are stored as bcrypt hashes; the demo seed uses a known hash for "demo123".
3. In production, add JWT or session-based auth.
4. The frontend `.env` must NOT contain database credentials — only the API base URL.
5. The database configuration (`db_host`, `db_port`, `db_user`, `db_password`, `db_name`) is read **only** in the backend via environment variables. Never pass credentials to the browser or store them in source control.
