const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const isReset = process.argv.includes('--reset');

async function setup() {
  const connectionConfig = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    port: process.env.DB_PORT || 3306
  };

  let connection;
  try {
    connection = await mysql.createConnection(connectionConfig);
    console.log('Connected to MySQL server.');

    // 1. Create database
    const dbName = process.env.DB_NAME || 'c3p2';
    await connection.query(`CREATE DATABASE IF NOT EXISTS \`${dbName}\`;`);
    console.log(`Database \`${dbName}\` ensured.`);

    // 2. Select database
    await connection.query(`USE \`${dbName}\`;`);

    // 3. Drop tables if reset is requested
    if (isReset) {
      console.log('Reset flag detected. Dropping existing tables...');
      await connection.query('DROP TABLE IF EXISTS `tickets`;');
      await connection.query('DROP TABLE IF EXISTS `users`;');
      console.log('Tables dropped.');
    }

    // 4. Create tables
    await connection.query(`
      CREATE TABLE IF NOT EXISTS \`users\` (
        \`id\` INT AUTO_INCREMENT PRIMARY KEY,
        \`name\` VARCHAR(255) NOT NULL,
        \`email\` VARCHAR(255) NOT NULL UNIQUE,
        \`password\` VARCHAR(255) NOT NULL,
        \`role\` ENUM('user', 'agent') NOT NULL DEFAULT 'user',
        \`createdAt\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);
    console.log('`users` table ensured.');

    await connection.query(`
      CREATE TABLE IF NOT EXISTS \`tickets\` (
        \`id\` INT AUTO_INCREMENT PRIMARY KEY,
        \`title\` VARCHAR(255) NOT NULL,
        \`description\` TEXT NOT NULL,
        \`category\` VARCHAR(100) NOT NULL,
        \`submittedUserId\` INT NOT NULL,
        \`status\` ENUM('open', 'inProgress', 'resolved', 'closed') NOT NULL DEFAULT 'open',
        \`agentResponse\` TEXT DEFAULT NULL,
        \`reopened\` INT NOT NULL DEFAULT 0,
        \`createdAt\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        \`updatedAt\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        \`closedAt\` TIMESTAMP DEFAULT NULL,
        FOREIGN KEY (\`submittedUserId\`) REFERENCES \`users\`(\`id\`) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);
    console.log('`tickets` table ensured.');

    // 5. Seed safe data if users table is empty
    const [users] = await connection.query('SELECT COUNT(*) as count FROM `users`;');
    if (users[0].count === 0) {
      console.log('Seeding initial demo data...');
      
      const hashedPassword = await bcrypt.hash('password123', 10);
      
      // Insert users
      const [userInsert] = await connection.query(`
        INSERT INTO \`users\` (\`name\`, \`email\`, \`password\`, \`role\`) VALUES
        ('Alice Smith', 'alice@example.com', ?, 'user'),
        ('Support Agent 1', 'agent@example.com', ?, 'agent');
      `, [hashedPassword, hashedPassword]);

      // Get Alice's ID
      const [aliceUser] = await connection.query('SELECT `id` FROM `users` WHERE `email` = ?;', ['alice@example.com']);
      const aliceId = aliceUser[0].id;

      // Insert a test ticket
      await connection.query(`
        INSERT INTO \`tickets\` (\`title\`, \`description\`, \`category\`, \`submittedUserId\`, \`status\`) VALUES
        ('VPN Access Issue', 'Cannot connect to the corporate network VPN since this morning.', 'Network', ?, 'open');
      `, [aliceId]);

      console.log('Seed data successfully inserted.');
    } else {
      console.log('Database already has data. Skipping seed.');
    }

    console.log('Database setup completed successfully.');
  } catch (error) {
    console.error('Database setup failed:', error.message);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

setup();
