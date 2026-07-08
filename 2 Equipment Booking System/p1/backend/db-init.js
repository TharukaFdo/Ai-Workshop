const mysql = require('mysql2/promise');
require('dotenv').config();

async function init() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
  });

  console.log('Connected to MySQL server. Creating database if not exists...');
  await connection.query(`CREATE DATABASE IF NOT EXISTS \`${process.env.DB_NAME || 'c2p1'}\``);
  await connection.query(`USE \`${process.env.DB_NAME || 'c2p1'}\``);

  // Drop tables in order of dependencies
  console.log('Dropping existing tables...');
  await connection.query('DROP TABLE IF EXISTS bookings');
  await connection.query('DROP TABLE IF EXISTS sessions');
  await connection.query('DROP TABLE IF EXISTS users');

  console.log('Creating users table...');
  await connection.query(`
    CREATE TABLE users (
      id INT AUTO_INCREMENT PRIMARY KEY,
      username VARCHAR(255) UNIQUE NOT NULL,
      password VARCHAR(255) NOT NULL,
      role ENUM('Staff', 'Lab Assistant') NOT NULL
    )
  `);

  console.log('Creating sessions table...');
  await connection.query(`
    CREATE TABLE sessions (
      token VARCHAR(255) PRIMARY KEY,
      user_id INT NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);

  console.log('Creating bookings table...');
  await connection.query(`
    CREATE TABLE bookings (
      id INT AUTO_INCREMENT PRIMARY KEY,
      equipment_name VARCHAR(255) NOT NULL,
      requested_user VARCHAR(255) NOT NULL,
      booking_date DATE NOT NULL,
      start_time TIME NOT NULL,
      end_time TIME NOT NULL,
      purpose TEXT NOT NULL,
      status ENUM('Pending', 'Approved', 'Rejected', 'Collected', 'Returned') DEFAULT 'Pending',
      assistant_comment TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  console.log('Seeding initial users...');
  // Passwords stored in plain text for simplicity as per small app requirements
  const seedUsers = [
    ['john_doe', 'password123', 'Staff'],
    ['jane_smith', 'password123', 'Staff'],
    ['alice', 'password123', 'Lab Assistant']
  ];
  for (const user of seedUsers) {
    await connection.query(
      'INSERT INTO users (username, password, role) VALUES (?, ?, ?)',
      user
    );
  }

  console.log('Seeding initial bookings...');
  const seedBookings = [
    ['Centrifuge A', 'john_doe', '2026-06-08', '09:00:00', '11:00:00', 'DNA extraction experiments', 'Pending', null],
    ['Spectrophotometer', 'jane_smith', '2026-06-08', '13:00:00', '15:00:00', 'Protein concentration analysis', 'Approved', 'Approved for general use'],
    ['Autoclave 1', 'john_doe', '2026-06-09', '10:00:00', '12:00:00', 'Sterilization of lab glassware', 'Rejected', 'Maintenance scheduled for Autoclave 1'],
    ['PCR Machine', 'jane_smith', '2026-06-10', '14:00:00', '17:00:00', 'Amplifying target DNA sequence', 'Pending', null]
  ];

  for (const booking of seedBookings) {
    await connection.query(
      `INSERT INTO bookings (equipment_name, requested_user, booking_date, start_time, end_time, purpose, status, assistant_comment)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      booking
    );
  }

  console.log('Database initialized and seeded successfully.');
  await connection.end();
}

init().catch(err => {
  console.error('Error initializing database:', err);
  process.exit(1);
});
