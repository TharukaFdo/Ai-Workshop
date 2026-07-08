require('dotenv').config();
const mysql = require('mysql2/promise');

async function initializeDatabase() {
  console.log('Starting database initialization...');
  
  const connectionConfig = {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '3306', 10),
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
  };

  let connection;
  try {
    // Connect to MySQL server without database first
    connection = await mysql.createConnection(connectionConfig);
    console.log('Connected to MySQL server.');

    const dbName = process.env.DB_NAME || 'c10p1';
    
    // Create database if not exists
    await connection.query(`CREATE DATABASE IF NOT EXISTS \`${dbName}\`;`);
    console.log(`Database "${dbName}" checked/created.`);

    // Use database
    await connection.query(`USE \`${dbName}\`;`);

    // Recreate registrations table
    await connection.query(`DROP TABLE IF EXISTS registrations;`);
    console.log('Dropped existing "registrations" table.');

    await connection.query(`
      CREATE TABLE registrations (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) NOT NULL,
        workshop_title VARCHAR(255) NOT NULL,
        registration_details TEXT,
        status VARCHAR(50) DEFAULT 'pending',
        attendance VARCHAR(50) DEFAULT 'unmarked',
        organizer_notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('Created table "registrations".');

    // Recreate users table
    await connection.query(`DROP TABLE IF EXISTS users;`);
    console.log('Dropped existing "users" table.');

    await connection.query(`
      CREATE TABLE users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        username VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        role VARCHAR(50) NOT NULL
      );
    `);
    console.log('Created table "users".');

    // Insert seed/demo data for registrations
    const seedData = [
      ['Alice Smith', 'alice@example.com', 'React Basics for Beginners', 'Excited to learn React from scratch!', 'pending', 'unmarked', 'First-time registration'],
      ['Bob Johnson', 'bob@example.com', 'Building APIs with Express & Node.js', 'Need backend integration skills.', 'confirmed', 'present', 'Paid via company sponsorship'],
      ['Charlie Brown', 'charlie@example.com', 'Advanced Database Design with MySQL', 'Wants to optimize table indexing.', 'cancelled', 'absent', 'Cancelled due to schedule conflict']
    ];

    const insertQuery = `
      INSERT INTO registrations (name, email, workshop_title, registration_details, status, attendance, organizer_notes)
      VALUES ?
    `;

    await connection.query(insertQuery, [seedData]);
    console.log('Seeded initial registration records.');

    // Insert seed/demo data for users
    const seedUsers = [
      ['org', 'org', 'organizer'],
      ['part', 'part', 'participant']
    ];

    const insertUsersQuery = `
      INSERT INTO users (username, password, role)
      VALUES ?
    `;

    await connection.query(insertUsersQuery, [seedUsers]);
    console.log('Seeded default user credentials.');
    console.log('Database initialization completed successfully!');

  } catch (err) {
    console.error('Error initializing database:', err.message);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
      console.log('Connection closed.');
    }
  }
}

initializeDatabase();
