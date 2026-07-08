const mysql = require('mysql2/promise');
const crypto = require('crypto');
require('dotenv').config();

const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || ''
};

function hashPassword(password) {
  return crypto.createHash('sha256').update(password).digest('hex');
}

async function setupDatabase() {
  console.log('Connecting to MySQL host to set up database...');
  let connection;
  try {
    connection = await mysql.createConnection(dbConfig);
    
    const dbName = process.env.DB_NAME || 'c8p3';
    console.log(`Re-creating database "${dbName}" for auth migration...`);
    
    // Drop existing tables to ensure clean auth columns setup
    await connection.query(`CREATE DATABASE IF NOT EXISTS \`${dbName}\`;`);
    await connection.query(`USE \`${dbName}\`;`);
    
    await connection.query('SET FOREIGN_KEY_CHECKS = 0;');
    await connection.query('DROP TABLE IF EXISTS room_bookings;');
    await connection.query('DROP TABLE IF EXISTS app_users;');
    await connection.query('SET FOREIGN_KEY_CHECKS = 1;');

    // Create app_users table with password_hash
    console.log('Creating table "app_users"...');
    await connection.query(`
      CREATE TABLE IF NOT EXISTS app_users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        username VARCHAR(50) NOT NULL UNIQUE,
        password_hash VARCHAR(255) NOT NULL,
        role ENUM('staff', 'coordinator') NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB;
    `);

    // Create room_bookings table
    console.log('Creating table "room_bookings"...');
    await connection.query(`
      CREATE TABLE IF NOT EXISTS room_bookings (
        id INT AUTO_INCREMENT PRIMARY KEY,
        room_name VARCHAR(100) NOT NULL,
        booking_date DATE NOT NULL,
        start_time TIME NOT NULL,
        end_time TIME NOT NULL,
        purpose TEXT NOT NULL,
        requester_id INT NOT NULL,
        status ENUM('pending', 'approved', 'rejected', 'cancelled') NOT NULL DEFAULT 'pending',
        coordinator_note TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (requester_id) REFERENCES app_users(id) ON DELETE CASCADE
      ) ENGINE=InnoDB;
    `);

    // Seed data
    console.log('Seeding initial data...');
    
    const passHash = hashPassword('password123');
    
    // Seed Users
    await connection.query(`
      INSERT INTO app_users (username, password_hash, role) VALUES
      ('alice_staff', ?, 'staff'),
      ('bob_staff', ?, 'staff'),
      ('charlie_coord', ?, 'coordinator');
    `, [passHash, passHash, passHash]);
    console.log('Demo users seeded with password "password123": alice_staff, bob_staff, charlie_coord.');

    // Get user ids
    const [users] = await connection.query('SELECT id, username FROM app_users');
    const alice = users.find(u => u.username === 'alice_staff');
    const bob = users.find(u => u.username === 'bob_staff');

    if (alice && bob) {
      await connection.query(`
        INSERT INTO room_bookings (room_name, booking_date, start_time, end_time, purpose, requester_id, status, coordinator_note) VALUES
        ('Conference Room A', '2026-06-20', '09:00:00', '11:00:00', 'Project kickoff meeting', ?, 'approved', 'Approved. Good to go.'),
        ('Boardroom', '2026-06-21', '14:00:00', '16:00:00', 'Quarterly review', ?, 'pending', NULL),
        ('Meeting Room B', '2026-06-20', '11:30:00', '13:00:00', 'Team sync', ?, 'rejected', 'Conflict with maintenance window.');
      `, [alice.id, bob.id, alice.id]);
      console.log('Initial room bookings seeded successfully.');
    }

    console.log('Database setup and migration completed successfully.');
  } catch (error) {
    console.error('Error during database setup:', error);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

setupDatabase();
