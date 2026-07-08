const mysql = require('mysql2/promise');
require('dotenv').config();

async function initDB() {
  // First, connect to MySQL without a database name to ensure the DB exists
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || ''
  });

  const dbName = process.env.DB_NAME || 'c8p1';
  console.log(`Ensuring database "${dbName}" exists...`);
  await connection.query(`CREATE DATABASE IF NOT EXISTS \`${dbName}\`;`);
  await connection.end();

  // Connect to target database
  const dbConnection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: dbName
  });

  console.log('Creating table "users" if it does not exist...');
  await dbConnection.query(`
    CREATE TABLE IF NOT EXISTS users (
      id INT AUTO_INCREMENT PRIMARY KEY,
      username VARCHAR(100) UNIQUE NOT NULL,
      password VARCHAR(100) NOT NULL,
      role ENUM('staff', 'coordinator') NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `);

  console.log('Creating table "bookings" if it does not exist...');
  await dbConnection.query(`
    CREATE TABLE IF NOT EXISTS bookings (
      id INT AUTO_INCREMENT PRIMARY KEY,
      room_name VARCHAR(100) NOT NULL,
      booking_date DATE NOT NULL,
      start_time TIME NOT NULL,
      end_time TIME NOT NULL,
      purpose TEXT NOT NULL,
      staff_name VARCHAR(100) NOT NULL,
      status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
      notes TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // Clear existing data
  console.log('Clearing existing data and seeding database...');
  await dbConnection.query('SET FOREIGN_KEY_CHECKS = 0;');
  await dbConnection.query('TRUNCATE TABLE bookings;');
  await dbConnection.query('TRUNCATE TABLE users;');
  await dbConnection.query('SET FOREIGN_KEY_CHECKS = 1;');

  // Seed Users (plain text passwords for simple workshop demo)
  const demoUsers = [
    ['alice', 'password123', 'staff'],
    ['bob', 'password123', 'staff'],
    ['charlie', 'password123', 'staff'],
    ['admin', 'admin123', 'coordinator']
  ];
  const insertUsersQuery = `
    INSERT INTO users (username, password, role)
    VALUES ?
  `;
  await dbConnection.query(insertUsersQuery, [demoUsers]);

  // Seed Bookings
  const demoBookings = [
    ['Conference Room A', '2026-06-15', '09:00:00', '10:30:00', 'Project kickoff meeting', 'alice', 'approved', 'Approved. Good to go.'],
    ['Conference Room B', '2026-06-15', '11:00:00', '12:00:00', 'Client presentation', 'bob', 'pending', null],
    ['Boardroom', '2026-06-16', '14:00:00', '16:00:00', 'Quarterly review', 'charlie', 'rejected', 'Room is undergoing maintenance. Please select another room.'],
    ['Conference Room A', '2026-06-16', '10:00:00', '11:00:00', 'Sprint planning', 'alice', 'pending', null]
  ];

  const insertBookingsQuery = `
    INSERT INTO bookings (room_name, booking_date, start_time, end_time, purpose, staff_name, status, notes)
    VALUES ?
  `;
  await dbConnection.query(insertBookingsQuery, [demoBookings]);
  console.log('Demo database populated successfully with users and bookings!');
  await dbConnection.end();
}

if (require.main === module) {
  initDB()
    .then(() => {
      console.log('Database initialization completed.');
      process.exit(0);
    })
    .catch((err) => {
      console.error('Database initialization failed:', err);
      process.exit(1);
    });
}

module.exports = initDB;
