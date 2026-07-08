const mysql = require('mysql2/promise');
require('dotenv').config();

async function runSetup() {
  const host = process.env.DB_HOST || 'localhost';
  const port = process.env.DB_PORT || 3306;
  const user = process.env.DB_USER || 'root';
  const password = process.env.DB_PASSWORD || '';
  const database = process.env.DB_NAME || 'c1p2';

  console.log(`Connecting to MySQL at ${host}:${port} as ${user}...`);

  // Connection without database to create the DB first
  const connection = await mysql.createConnection({
    host,
    port,
    user,
    password
  });

  try {
    // 1. Create database if not exists
    await connection.query(`CREATE DATABASE IF NOT EXISTS \`${database}\`;`);
    console.log(`Database "${database}" verified/created.`);
    await connection.changeUser({ database });

    // 2. Create users table with session_token
    await connection.query(`
      CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        username VARCHAR(50) NOT NULL UNIQUE,
        password VARCHAR(255) NOT NULL,
        role ENUM('receptionist', 'doctor') NOT NULL,
        session_token VARCHAR(255) NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('Table "users" verified/created.');

    // Alter table users to add session_token if not present
    const [userCols] = await connection.query(`
      SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'users' AND COLUMN_NAME = 'session_token'
    `, [database]);

    if (userCols.length === 0) {
      await connection.query('ALTER TABLE users ADD COLUMN session_token VARCHAR(255) NULL;');
      console.log('Added session_token column to users table.');
    }

    // 3. Create appointments table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS appointments (
        id INT AUTO_INCREMENT PRIMARY KEY,
        patient_name VARCHAR(100) NOT NULL,
        patient_phone VARCHAR(20) NOT NULL,
        doctor_name VARCHAR(100) NOT NULL,
        appointment_date DATE NOT NULL,
        appointment_time TIME NOT NULL,
        reason TEXT NOT NULL,
        status VARCHAR(50) NOT NULL DEFAULT 'pending',
        visit_note TEXT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      );
    `);
    console.log('Table "appointments" verified/created.');

    // Migration logic using VARCHAR intermediary to avoid ENUM lockouts
    try {
      // 1. Temporarily change column type to VARCHAR
      await connection.query("ALTER TABLE appointments MODIFY COLUMN status VARCHAR(50) NOT NULL DEFAULT 'pending';");
      
      // 2. Update statuses safely
      await connection.query("UPDATE appointments SET status = 'pending' WHERE status IN ('booked', 'Scheduled');");
      await connection.query("UPDATE appointments SET status = 'completed' WHERE status = 'Completed';");
      await connection.query("UPDATE appointments SET status = 'cancelled' WHERE status = 'Cancelled';");
      
      console.log('Migrated old status values to new ENUM equivalents using VARCHAR temporary type.');
    } catch (err) {
      console.error('Migration notice:', err.message);
    }

    // 3. Modify column to final ENUM type
    await connection.query(`
      ALTER TABLE appointments MODIFY COLUMN status ENUM('pending', 'confirmed', 'completed', 'cancelled') NOT NULL DEFAULT 'pending';
    `);
    console.log('Table "appointments" status ENUM modified to support pending/confirmed.');

    // 4. Seed users safely (only if table is empty)
    const [userRows] = await connection.query('SELECT COUNT(*) as count FROM users');
    if (userRows[0].count === 0) {
      await connection.query(`
        INSERT INTO users (username, password, role) VALUES
        ('receptionist1', 'password123', 'receptionist'),
        ('dr_smith', 'smith456', 'doctor'),
        ('dr_adams', 'adams789', 'doctor');
      `);
      console.log('Seed users successfully added.');
    } else {
      console.log('Table "users" already has records. Skipping user seeds.');
    }

    // 5. Seed appointments safely (only if table is empty)
    const [appointmentRows] = await connection.query('SELECT COUNT(*) as count FROM appointments');
    if (appointmentRows[0].count === 0) {
      await connection.query(`
        INSERT INTO appointments (patient_name, patient_phone, doctor_name, appointment_date, appointment_time, reason, status, visit_note) VALUES
        ('John Doe', '555-0199', 'Dr. Smith', '2026-06-10', '09:30:00', 'Routine checkup', 'pending', NULL),
        ('Jane Doe', '555-0188', 'Dr. Adams', '2026-06-10', '10:30:00', 'Follow-up consultation', 'pending', NULL),
        ('Bob Johnson', '555-0177', 'Dr. Smith', '2026-06-09', '14:00:00', 'Back pain evaluation', 'completed', 'Patient has mild muscle strain. Prescribed physical therapy and rest.');
      `);
      console.log('Seed appointments successfully added.');
    } else {
      console.log('Table "appointments" already has records. Skipping appointment seeds.');
    }

    console.log('Database setup completed successfully.');
  } catch (error) {
    console.error('Database setup failed:', error);
    process.exit(1);
  } finally {
    await connection.end();
  }
}

// Run if called directly
if (require.main === module) {
  runSetup();
}

module.exports = runSetup;
