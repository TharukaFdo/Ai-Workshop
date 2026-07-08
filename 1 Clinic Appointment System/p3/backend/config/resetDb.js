const mysql = require('mysql2/promise');
const { hashPassword } = require('../utils/hash');
require('dotenv').config();

async function resetDatabase() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || ''
  });

  try {
    console.log('Resetting database...');
    const dbName = process.env.DB_NAME || 'clinic_appointments';

    await connection.query(`DROP DATABASE IF EXISTS \`${dbName}\`;`);
    console.log(`Database '${dbName}' dropped.`);

    await connection.query(`CREATE DATABASE \`${dbName}\`;`);
    console.log(`Database '${dbName}' created.`);

    // Switch database
    await connection.query(`USE \`${dbName}\`;`);

    // Create tables
    await connection.query(`
      CREATE TABLE app_users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        username VARCHAR(50) NOT NULL UNIQUE,
        password_hash VARCHAR(64) NOT NULL,
        role ENUM('Receptionist', 'Doctor') NOT NULL,
        doctor_name VARCHAR(100) NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log("Table 'app_users' created.");

    await connection.query(`
      CREATE TABLE appointments (
        id INT AUTO_INCREMENT PRIMARY KEY,
        patientName VARCHAR(100) NOT NULL,
        patientPhone VARCHAR(20) NULL,
        doctorName VARCHAR(100) NOT NULL,
        appointmentDate DATE NOT NULL,
        appointmentTime TIME NOT NULL,
        reason TEXT NOT NULL,
        status ENUM('pending', 'accepted', 'rejected', 'completed', 'cancelled') NOT NULL DEFAULT 'pending',
        visitNote TEXT NULL,
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      );
    `);
    console.log("Table 'appointments' created.");

    // Seed users with SHA256 hashed passwords
    const pHash = hashPassword('password123');
    await connection.query(`
      INSERT INTO app_users (username, password_hash, role, doctor_name) VALUES
      ('receptionist1', ?, 'Receptionist', NULL),
      ('dr_smith', ?, 'Doctor', 'Dr. Smith'),
      ('dr_jones', ?, 'Doctor', 'Dr. Jones');
    `, [pHash, pHash, pHash]);
    console.log('Seeded demo users.');

    // Seed appointments
    await connection.query(`
      INSERT INTO appointments (patientName, patientPhone, doctorName, appointmentDate, appointmentTime, reason, status) VALUES
      ('John Doe', '555-0199', 'Dr. Smith', CURDATE(), '10:00:00', 'Annual checkup', 'pending'),
      ('Jane Doe', '555-0200', 'Dr. Jones', CURDATE(), '11:30:00', 'Follow up on blood pressure', 'accepted');
    `);
    console.log('Seeded demo appointments.');

    console.log('Database reset completed successfully.');
  } catch (error) {
    console.error('Error resetting database:', error);
    process.exit(1);
  } finally {
    await connection.end();
  }
}

resetDatabase();
