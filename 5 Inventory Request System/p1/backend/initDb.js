const mysql = require('mysql2/promise');
require('dotenv').config();

async function initDb() {
  console.log('Connecting to MySQL server...');
  
  // Connect without database first to ensure database exists
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '3306'),
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || ''
  });

  const dbName = process.env.DB_NAME || 'c5p1';
  console.log(`Creating database "${dbName}" if not exists...`);
  await connection.query(`CREATE DATABASE IF NOT EXISTS \`${dbName}\``);
  await connection.query(`USE \`${dbName}\``);

  console.log('Re-creating requests table...');
  await connection.query(`DROP TABLE IF EXISTS requests`);
  
  const createTableQuery = `
    CREATE TABLE requests (
      id INT AUTO_INCREMENT PRIMARY KEY,
      item_name VARCHAR(255) NOT NULL,
      quantity INT NOT NULL,
      reason TEXT NOT NULL,
      requested_date DATE NOT NULL,
      requester_name VARCHAR(255) NOT NULL,
      status ENUM('pending', 'approved', 'rejected', 'issued') DEFAULT 'pending',
      storekeeper_note TEXT NULL,
      issued_quantity INT DEFAULT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )
  `;
  await connection.query(createTableQuery);

  console.log('Re-creating users table...');
  await connection.query(`DROP TABLE IF EXISTS users`);

  const createUsersTableQuery = `
    CREATE TABLE users (
      id INT AUTO_INCREMENT PRIMARY KEY,
      username VARCHAR(255) NOT NULL UNIQUE,
      password VARCHAR(255) NOT NULL,
      display_name VARCHAR(255) NOT NULL,
      role ENUM('staff', 'storekeeper') NOT NULL
    )
  `;
  await connection.query(createUsersTableQuery);

  console.log('Seeding user accounts...');
  const seedUsersQuery = `
    INSERT INTO users (username, password, display_name, role) VALUES
    ('alice', 'password', 'Alice Smith', 'staff'),
    ('bob', 'password', 'Bob Jones', 'staff'),
    ('john', 'password', 'John Doe', 'storekeeper'),
    ('sarah', 'password', 'Sarah Jenkins', 'storekeeper')
  `;
  await connection.query(seedUsersQuery);

  console.log('Seeding initial demo data...');
  const seedQuery = `
    INSERT INTO requests (item_name, quantity, reason, requested_date, requester_name, status, storekeeper_note, issued_quantity) VALUES
    ('MacBook Pro Charger', 1, 'Lost my original charger at a client site', '2026-07-09', 'Alice Smith', 'pending', NULL, NULL),
    ('Ergonomic Keyboard', 2, 'For new developers joining next week', '2026-07-08', 'Bob Jones', 'approved', 'Approved for IT department', NULL),
    ('Office Chairs', 5, 'Replacing broken conference room chairs', '2026-07-07', 'Charlie Brown', 'issued', 'Handed over by storekeeper on 2026-07-08', 5),
    ('Wireless Mouse', 1, 'Current mouse scroll wheel is malfunctioning', '2026-07-05', 'Alice Smith', 'rejected', 'No replacement stock available at the moment', NULL)
  `;
  await connection.query(seedQuery);

  console.log('Database initialized successfully!');
  await connection.end();
}

initDb().catch(err => {
  console.error('Error initializing database:', err);
  process.exit(1);
});
