const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '3306'),
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || ''
};

const DB_NAME = process.env.DB_NAME || 'c5p3';

async function initializeDatabase() {
  let connection;
  try {
    console.log(`Connecting to MySQL server at ${dbConfig.host}:${dbConfig.port}...`);
    connection = await mysql.createConnection(dbConfig);

    console.log(`Ensuring database "${DB_NAME}" exists...`);
    await connection.query(`CREATE DATABASE IF NOT EXISTS \`${DB_NAME}\`;`);
    await connection.query(`USE \`${DB_NAME}\`;`);

    console.log('Re-creating users table...');
    await connection.query(`DROP TABLE IF EXISTS \`inventory_requests\`;`);
    await connection.query(`DROP TABLE IF EXISTS \`users\`;`);

    await connection.query(`
      CREATE TABLE \`users\` (
        \`id\` INT AUTO_INCREMENT PRIMARY KEY,
        \`username\` VARCHAR(50) NOT NULL UNIQUE,
        \`password_hash\` VARCHAR(255) NOT NULL,
        \`role\` ENUM('staff', 'storekeeper') NOT NULL,
        \`full_name\` VARCHAR(100) NOT NULL,
        \`created_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    console.log('Re-creating inventory_requests table...');
    await connection.query(`
      CREATE TABLE \`inventory_requests\` (
        \`id\` INT AUTO_INCREMENT PRIMARY KEY,
        \`item_name\` VARCHAR(255) NOT NULL,
        \`quantity\` INT NOT NULL,
        \`reason\` TEXT NOT NULL,
        \`requested_date\` DATE NOT NULL,
        \`requester_id\` INT NOT NULL,
        \`requester_name\` VARCHAR(100) NOT NULL,
        \`status\` ENUM('pending', 'approved', 'rejected', 'issued') DEFAULT 'pending',
        \`storekeeper_note\` TEXT NULL,
        \`issued_quantity\` INT NULL,
        \`issued_at\` TIMESTAMP NULL,
        \`created_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        \`updated_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (\`requester_id\`) REFERENCES \`users\`(\`id\`) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    console.log('Seeding initial users...');
    const defaultPasswordHash = bcrypt.hashSync('password123', 10);
    const users = [
      ['john_staff', defaultPasswordHash, 'staff', 'John Doe (Staff)'],
      ['jane_staff', defaultPasswordHash, 'staff', 'Jane Smith (Staff)'],
      ['bob_storekeeper', defaultPasswordHash, 'storekeeper', 'Bob Johnson (Storekeeper)'],
      ['alice_storekeeper', defaultPasswordHash, 'storekeeper', 'Alice Brown (Storekeeper)']
    ];

    for (const user of users) {
      await connection.query(
        `INSERT INTO \`users\` (\`username\`, \`password_hash\`, \`role\`, \`full_name\`) VALUES (?, ?, ?, ?);`,
        user
      );
    }

    console.log('Seeding initial inventory requests...');
    const [dbUsers] = await connection.query(`SELECT id, username, full_name FROM users;`);
    const john = dbUsers.find(u => u.username === 'john_staff');
    const jane = dbUsers.find(u => u.username === 'jane_staff');

    const requests = [
      ['ThinkPad Laptop', 2, 'New developers joining the team', '2026-07-15', john.id, john.full_name, 'pending', null, null, null],
      ['HDMI Cables', 5, 'Meeting room setup refresh', '2026-07-12', john.id, john.full_name, 'approved', 'Approved for meeting rooms setup.', null, null],
      ['Wireless Mouse', 10, 'Replacing broken office mice', '2026-07-20', jane.id, jane.full_name, 'pending', null, null, null],
      ['Ergonomic Office Chair', 1, 'Medical accommodation request', '2026-07-10', jane.id, jane.full_name, 'issued', 'Medical documentation verified.', 1, new Date()]
    ];

    for (const req of requests) {
      await connection.query(
        `INSERT INTO \`inventory_requests\` 
        (\`item_name\`, \`quantity\`, \`reason\`, \`requested_date\`, \`requester_id\`, \`requester_name\`, \`status\`, \`storekeeper_note\`, \`issued_quantity\`, \`issued_at\`) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`,
        req
      );
    }

    console.log('Database initialization completed successfully!');
  } catch (error) {
    console.error('Error during database initialization:', error.message);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

initializeDatabase();
