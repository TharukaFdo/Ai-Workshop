const mysql = require('mysql2/promise');
require('dotenv').config();

const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '3306'),
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
};

async function setup() {
  const isReset = process.argv.includes('--reset');
  console.log(`Starting database setup (Reset mode: ${isReset})...`);

  let connection;
  try {
    // 1. Connect without database parameter to ensure database exists
    connection = await mysql.createConnection(dbConfig);
    
    // Create database if not exists
    await connection.query(`CREATE DATABASE IF NOT EXISTS \`${process.env.DB_NAME || 'c5p2'}\``);
    console.log(`Database "${process.env.DB_NAME || 'c5p2'}" checked/created.`);
    
    // Use the database
    await connection.query(`USE \`${process.env.DB_NAME || 'c5p2'}\``);

    // 2. Handle Reset if flagged
    if (isReset) {
      console.log("Dropping existing tables for reset...");
      await connection.query(`DROP TABLE IF EXISTS requests`);
      await connection.query(`DROP TABLE IF EXISTS sessions`);
      await connection.query(`DROP TABLE IF EXISTS users`);
    }

    // 3. Create Users Table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        username VARCHAR(50) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        role ENUM('staff', 'storekeeper') NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('Table "users" checked/created.');

    // Create Sessions Table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS sessions (
        token VARCHAR(255) PRIMARY KEY,
        user_id INT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);
    console.log('Table "sessions" checked/created.');

    // 4. Create Requests Table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS requests (
        id INT AUTO_INCREMENT PRIMARY KEY,
        item_name VARCHAR(255) NOT NULL,
        quantity INT NOT NULL,
        reason TEXT NOT NULL,
        requested_date DATE NOT NULL,
        requester_id INT NOT NULL,
        requester_name VARCHAR(255) NOT NULL,
        status ENUM('pending', 'approved', 'rejected', 'issued') DEFAULT 'pending',
        storekeeper_note TEXT NULL,
        issued_quantity INT DEFAULT 0,
        issued_at TIMESTAMP NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (requester_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);
    console.log('Table "requests" checked/created.');

    // 5. Seed Users if table is empty
    const [existingUsers] = await connection.query('SELECT COUNT(*) as count FROM users');
    if (existingUsers[0].count === 0) {
      console.log('Seeding default users...');
      const seedUsers = [
        ['Alice', 'password123', 'staff'],
        ['Bob', 'password123', 'staff'],
        ['Charlie', 'password123', 'storekeeper']
      ];
      await connection.query(
        'INSERT INTO users (username, password, role) VALUES ?',
        [seedUsers]
      );
      console.log('Users seeded successfully.');
    } else {
      console.log('Users table already contains data, skipping seed.');
    }

    // 6. Seed Test Requests if table is empty
    const [existingRequests] = await connection.query('SELECT COUNT(*) as count FROM requests');
    if (existingRequests[0].count === 0) {
      console.log('Seeding initial test inventory requests...');
      
      // Get Alice and Bob IDs
      const [[alice]] = await connection.query('SELECT id, username FROM users WHERE username = "Alice"');
      const [[bob]] = await connection.query('SELECT id, username FROM users WHERE username = "Bob"');

      if (alice && bob) {
        const seedRequests = [
          ['Test Laptop Stand', 2, 'Ergonomic workspace setup', '2026-07-11', alice.id, alice.username, 'pending', null, 0, null],
          ['Test HDMI Cable', 5, 'Conference room setup', '2026-07-10', bob.id, bob.username, 'approved', 'Approved for meeting rooms', 0, null],
          ['Test Desk Chair', 1, 'Replacement for broken chair', '2026-07-09', alice.id, alice.username, 'issued', 'Issued from main storage', 1, new Date()],
          ['Test Gaming Mouse', 1, 'Testing input lag', '2026-07-08', bob.id, bob.username, 'rejected', 'Non-standard item requested', 0, null]
        ];
        
        await connection.query(
          'INSERT INTO requests (item_name, quantity, reason, requested_date, requester_id, requester_name, status, storekeeper_note, issued_quantity, issued_at) VALUES ?',
          [seedRequests]
        );
        console.log('Test requests seeded successfully.');
      }
    } else {
      console.log('Requests table already contains data, skipping seed.');
    }

    console.log('Database setup completed successfully.');
  } catch (error) {
    console.error('Error setting up database:', error);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

setup();
