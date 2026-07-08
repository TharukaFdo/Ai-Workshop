const mysql = require('mysql2/promise');
require('dotenv').config();

async function initDatabase() {
  const config = {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '3306'),
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || ''
  };

  try {
    console.log('Connecting to MySQL host...');
    const connection = await mysql.createConnection(config);

    const dbName = process.env.DB_NAME || 'c1p1';
    console.log(`Creating database "${dbName}" if it does not exist...`);
    await connection.query(`CREATE DATABASE IF NOT EXISTS \`${dbName}\`;`);

    console.log(`Using database "${dbName}"...`);
    await connection.query(`USE \`${dbName}\`;`);

    console.log('Recreating "appointments" table...');
    await connection.query(`DROP TABLE IF EXISTS appointments;`);
    await connection.query(`
      CREATE TABLE appointments (
        id INT AUTO_INCREMENT PRIMARY KEY,
        patient_name VARCHAR(100) NOT NULL,
        contact_number VARCHAR(20) NOT NULL,
        doctor_name VARCHAR(100) NOT NULL,
        appointment_date DATE NOT NULL,
        appointment_time TIME NOT NULL,
        reason TEXT NOT NULL,
        status ENUM('Pending', 'Confirmed', 'Rejected', 'Completed', 'Cancelled') NOT NULL DEFAULT 'Pending',
        visit_note TEXT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      );
    `);

    console.log('Recreating "users" table...');
    await connection.query(`DROP TABLE IF EXISTS users;`);
    await connection.query(`
      CREATE TABLE users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        username VARCHAR(50) UNIQUE NOT NULL,
        password VARCHAR(100) NOT NULL,
        role ENUM('receptionist', 'doctor') NOT NULL,
        doctor_name VARCHAR(100) NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    console.log('Seeding initial appointment data...');
    const sampleAppointments = [
      ['Alice Johnson', '123-456-7890', 'Dr. Adams', '2026-06-06', '09:00:00', 'Annual checkup', 'Pending', null],
      ['Bob Smith', '987-654-3210', 'Dr. Adams', '2026-06-06', '10:30:00', 'High blood pressure follow-up', 'Pending', null],
      ['Charlie Brown', '555-0199', 'Dr. Baker', '2026-06-07', '14:00:00', 'Persistent cough', 'Pending', null],
      ['Diana Prince', '555-0188', 'Dr. Carter', '2026-06-05', '11:00:00', 'Routine blood work discussion', 'Completed', 'Patient is in good health. Keep standard diet.']
    ];

    const insertAptSql = `
      INSERT INTO appointments 
      (patient_name, contact_number, doctor_name, appointment_date, appointment_time, reason, status, visit_note)
      VALUES ?
    `;
    await connection.query(insertAptSql, [sampleAppointments]);

    console.log('Seeding user accounts...');
    const sampleUsers = [
      ['receptionist', 'password123', 'receptionist', null],
      ['dr_adams', 'password123', 'doctor', 'Dr. Adams'],
      ['dr_baker', 'password123', 'doctor', 'Dr. Baker'],
      ['dr_carter', 'password123', 'doctor', 'Dr. Carter']
    ];

    const insertUserSql = `
      INSERT INTO users 
      (username, password, role, doctor_name)
      VALUES ?
    `;
    await connection.query(insertUserSql, [sampleUsers]);

    console.log('Database successfully initialized and seeded with appointments & users!');
    await connection.end();
    process.exit(0);
  } catch (error) {
    console.error('Initialization error:', error.message);
    process.exit(1);
  }
}

initDatabase();
