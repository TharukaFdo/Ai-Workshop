const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
require('dotenv').config();

async function seed() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '3306', 10),
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD !== undefined ? process.env.DB_PASSWORD : ''
  });

  console.log('Connected to MySQL server. Preparing c3p1 database...');

  // Create database
  await connection.query('CREATE DATABASE IF NOT EXISTS c3p1;');
  await connection.query('USE c3p1;');

  // Drop tables in order of dependency
  console.log('Dropping existing tables...');
  await connection.query('DROP TABLE IF EXISTS responses;');
  await connection.query('DROP TABLE IF EXISTS tickets;');
  await connection.query('DROP TABLE IF EXISTS users;');

  // Create users table
  console.log('Creating users table...');
  await connection.query(`
    CREATE TABLE users (
      id INT AUTO_INCREMENT PRIMARY KEY,
      username VARCHAR(100) UNIQUE NOT NULL,
      password VARCHAR(255) NOT NULL,
      role ENUM('customer', 'agent') NOT NULL
    );
  `);

  // Create tickets table
  console.log('Creating tickets table...');
  await connection.query(`
    CREATE TABLE tickets (
      id INT AUTO_INCREMENT PRIMARY KEY,
      title VARCHAR(255) NOT NULL,
      description TEXT NOT NULL,
      category VARCHAR(50) NOT NULL,
      user_id INT NOT NULL,
      status ENUM('Open', 'In Progress', 'Resolved', 'Closed') DEFAULT 'Open',
      reopened TINYINT DEFAULT 0,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );
  `);

  // Create responses table
  console.log('Creating responses table...');
  await connection.query(`
    CREATE TABLE responses (
      id INT AUTO_INCREMENT PRIMARY KEY,
      ticket_id INT NOT NULL,
      user_id INT NOT NULL,
      message TEXT NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (ticket_id) REFERENCES tickets(id) ON DELETE CASCADE,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );
  `);

  // Insert Users with hashed passwords
  console.log('Seeding users...');
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash('password', salt);

  const [agentResult] = await connection.query(
    'INSERT INTO users (username, password, role) VALUES (?, ?, ?)',
    ['agent', hashedPassword, 'agent']
  );
  const [aliceResult] = await connection.query(
    'INSERT INTO users (username, password, role) VALUES (?, ?, ?)',
    ['alice', hashedPassword, 'customer']
  );
  const [bobResult] = await connection.query(
    'INSERT INTO users (username, password, role) VALUES (?, ?, ?)',
    ['bob', hashedPassword, 'customer']
  );
  const [charlieResult] = await connection.query(
    'INSERT INTO users (username, password, role) VALUES (?, ?, ?)',
    ['charlie', hashedPassword, 'customer']
  );

  const agentId = agentResult.insertId;
  const aliceId = aliceResult.insertId;
  const bobId = bobResult.insertId;
  const charlieId = charlieResult.insertId;

  // Insert Tickets linked to users
  console.log('Seeding initial tickets...');
  const [t1] = await connection.query(
    'INSERT INTO tickets (title, description, category, user_id, status) VALUES (?, ?, ?, ?, ?)',
    ['Cannot login to dashboard', 'I keep getting a 403 error code when trying to access the main dashboard. Please help!', 'Technical', aliceId, 'Open']
  );
  const [t2] = await connection.query(
    'INSERT INTO tickets (title, description, category, user_id, status) VALUES (?, ?, ?, ?, ?)',
    ['Billing discrepancy on May invoice', 'My credit card was charged twice for the monthly subscription. I need a refund for the second charge.', 'Billing', bobId, 'In Progress']
  );
  const [t3] = await connection.query(
    'INSERT INTO tickets (title, description, category, user_id, status) VALUES (?, ?, ?, ?, ?)',
    ['Requesting new monitor', 'Our team needs a secondary monitor for the new designer joining next week.', 'Hardware', charlieId, 'Resolved']
  );

  const ticket1Id = t1.insertId;
  const ticket2Id = t2.insertId;
  const ticket3Id = t3.insertId;

  // Insert Responses linked to tickets and users
  console.log('Seeding initial responses...');
  // Response on Bob's billing ticket (In Progress) from Agent
  await connection.query(
    'INSERT INTO responses (ticket_id, user_id, message) VALUES (?, ?, ?)',
    [ticket2Id, agentId, 'Hello Bob, I am currently checking with our billing department regarding the double charge. I will update you as soon as I have more details.']
  );

  // Responses on Charlie's hardware ticket (Resolved)
  await connection.query(
    'INSERT INTO responses (ticket_id, user_id, message) VALUES (?, ?, ?)',
    [ticket3Id, agentId, 'Hi Charlie, the monitor has been ordered and should arrive by Monday. I will close this ticket now.']
  );
  await connection.query(
    'INSERT INTO responses (ticket_id, user_id, message) VALUES (?, ?, ?)',
    [ticket3Id, charlieId, 'Thank you! Appreciate the quick response.']
  );

  console.log('Database seeded successfully!');
  await connection.end();
}

seed().catch(err => {
  console.error('Error seeding database:', err);
  process.exit(1);
});
