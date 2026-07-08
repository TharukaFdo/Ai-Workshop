const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const { DB_HOST, DB_PORT, DB_USER, DB_PASSWORD, DB_NAME } = process.env;

const seedRequests = [
  {
    title: 'AC unit blowing warm air',
    description: 'The AC unit in Room 102 is blowing warm air even when set to cool.',
    location: 'Room 102',
    priority: 'High',
    requester_name: 'John Doe',
    status: 'Open',
    technician_notes: null,
    is_urgent: 1
  },
  {
    title: 'Leaking water tap',
    description: 'The tap in the main cafeteria area has a slow drip water leak.',
    location: 'Cafeteria',
    priority: 'Low',
    requester_name: 'Jane Smith',
    status: 'In Progress',
    technician_notes: 'Inspected leak, parts ordered for replacement.',
    is_urgent: 0
  },
  {
    title: 'Broken window latch',
    description: 'The latch on the window in the second-floor library is broken and cannot lock.',
    location: 'Library - 2nd Floor',
    priority: 'Medium',
    requester_name: 'Alice Johnson',
    status: 'Closed',
    technician_notes: 'Replaced broken latch with a new one. Latch tested and window locks correctly.',
    is_urgent: 0
  }
];

async function initializeDatabase() {
  let connection;
  try {
    console.log(`Connecting to MySQL server at ${DB_HOST}:${DB_PORT}...`);
    connection = await mysql.createConnection({
      host: DB_HOST || 'localhost',
      port: DB_PORT || 3306,
      user: DB_USER || 'root',
      password: DB_PASSWORD || ''
    });

    console.log(`Creating database "${DB_NAME}" if it doesn't exist...`);
    await connection.query(`CREATE DATABASE IF NOT EXISTS \`${DB_NAME}\`;`);
    await connection.changeUser({ database: DB_NAME });

    // Drop tables to recreate with new schemas
    console.log('Dropping old tables if they exist to apply new schema...');
    await connection.query('DROP TABLE IF EXISTS `requests`;');
    await connection.query('DROP TABLE IF EXISTS `users`;');

    // Create users table
    console.log('Creating table "users" if it doesn\'t exist...');
    const createUsersTableQuery = `
      CREATE TABLE IF NOT EXISTS \`users\` (
        \`id\` INT AUTO_INCREMENT PRIMARY KEY,
        \`username\` VARCHAR(255) NOT NULL UNIQUE,
        \`password\` VARCHAR(255) NOT NULL,
        \`role\` VARCHAR(50) NOT NULL,
        \`created_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `;
    await connection.query(createUsersTableQuery);

    // Create requests table
    console.log('Creating table "requests" if it doesn\'t exist...');
    const createRequestsTableQuery = `
      CREATE TABLE IF NOT EXISTS \`requests\` (
        \`id\` INT AUTO_INCREMENT PRIMARY KEY,
        \`title\` VARCHAR(255) NOT NULL,
        \`description\` TEXT NOT NULL,
        \`location\` VARCHAR(255) NOT NULL,
        \`priority\` VARCHAR(50) NOT NULL,
        \`requester_name\` VARCHAR(255) NOT NULL,
        \`status\` VARCHAR(50) NOT NULL DEFAULT 'Open',
        \`technician_notes\` TEXT DEFAULT NULL,
        \`is_urgent\` TINYINT(1) DEFAULT 0,
        \`created_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        \`updated_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `;
    await connection.query(createRequestsTableQuery);

    // Seed default users
    const [userRows] = await connection.query('SELECT COUNT(*) as count FROM `users`');
    if (userRows[0].count === 0) {
      console.log('Seeding initial user accounts...');
      const salt = await bcrypt.genSalt(10);
      const requesterPassword = await bcrypt.hash('password123', salt);
      const techPassword = await bcrypt.hash('password123', salt);

      await connection.query(
        'INSERT INTO `users` (username, password, role) VALUES (?, ?, ?)',
        ['requester1', requesterPassword, 'requester']
      );
      await connection.query(
        'INSERT INTO `users` (username, password, role) VALUES (?, ?, ?)',
        ['tech1', techPassword, 'technician']
      );
      console.log('User accounts seeded successfully.');
    } else {
      console.log('Users table already populated. Seeding skipped.');
    }

    // Check if requests table is empty before seeding
    const [rows] = await connection.query('SELECT COUNT(*) as count FROM `requests`');
    if (rows[0].count === 0) {
      console.log('Seeding initial demo requests...');
      for (const req of seedRequests) {
        await connection.query(
          `INSERT INTO \`requests\` (title, description, location, priority, requester_name, status, technician_notes, is_urgent) 
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
          [req.title, req.description, req.location, req.priority, req.requester_name, req.status, req.technician_notes, req.is_urgent]
        );
      }
      console.log('Database requests seeded successfully.');
    } else {
      console.log('Database requests table is already populated. Seeding skipped.');
    }

    console.log('MySQL Database initialization complete!');
  } catch (error) {
    console.error('Failed to initialize database:', error);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

initializeDatabase();
