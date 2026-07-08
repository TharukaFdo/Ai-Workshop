const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
require('dotenv').config();

async function setupDatabase() {
  const host = process.env.DB_HOST || 'localhost';
  const port = parseInt(process.env.DB_PORT || '3306', 10);
  const user = process.env.DB_USER || 'root';
  const password = process.env.DB_PASSWORD !== undefined ? process.env.DB_PASSWORD : '';
  const dbName = process.env.DB_NAME || 'c9p2';

  console.log(`Connecting to MySQL at ${host}:${port} as ${user}...`);

  let connection;
  try {
    connection = await mysql.createConnection({ host, port, user, password });
    await connection.query(`CREATE DATABASE IF NOT EXISTS \`${dbName}\``);
    console.log(`Database "${dbName}" verified/created successfully.`);
  } catch (error) {
    console.error('Failed to connect or create database:', error.message);
    process.exit(1);
  } finally {
    if (connection) await connection.end();
  }

  try {
    connection = await mysql.createConnection({ host, port, user, password, database: dbName });

    // 1. Users Table
    console.log('Creating users table...');
    await connection.query(`
      CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        username VARCHAR(50) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        role ENUM('student', 'supervisor') NOT NULL,
        full_name VARCHAR(100) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // 2. Projects Table
    console.log('Creating projects table...');
    await connection.query(`
      CREATE TABLE IF NOT EXISTS projects (
        id INT AUTO_INCREMENT PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        description TEXT NOT NULL,
        category VARCHAR(100) NOT NULL,
        student_name VARCHAR(100) NOT NULL,
        student_id INT NOT NULL,
        supervisor_name VARCHAR(100) NOT NULL,
        supervisor_id INT NOT NULL,
        submitted_date DATE NOT NULL,
        status ENUM('submitted', 'underReview', 'approved', 'rejected', 'revisionRequested') NOT NULL DEFAULT 'submitted',
        feedback TEXT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (student_id) REFERENCES users(id),
        FOREIGN KEY (supervisor_id) REFERENCES users(id)
      )
    `);

    // 3. Seed Users with hashed passwords
    console.log('Checking and seeding users...');
    const [existingUsers] = await connection.query('SELECT COUNT(*) AS count FROM users');
    if (existingUsers[0].count === 0) {
      const saltRounds = 10;
      const usersToSeed = [
        ['student_alice', 'password123', 'student', 'Alice Smith'],
        ['student_bob', 'password123', 'student', 'Bob Jones'],
        ['supervisor_carol', 'password123', 'supervisor', 'Carol Johnson'],
        ['supervisor_dave', 'password123', 'supervisor', 'Dave Wilson']
      ];

      for (const [username, plainPassword, role, fullName] of usersToSeed) {
        const hashedPassword = bcrypt.hashSync(plainPassword, saltRounds);
        await connection.query(
          'INSERT INTO users (username, password, role, full_name) VALUES (?, ?, ?, ?)',
          [username, hashedPassword, role, fullName]
        );
      }
      console.log('Users table seeded with demo accounts (hashed passwords).');
    } else {
      console.log('Users table already contains data. Skipping seeding.');
    }

    // 4. Seed Projects (Clearly labeled test records)
    console.log('Checking and seeding projects...');
    const [existingProjects] = await connection.query('SELECT COUNT(*) AS count FROM projects');
    if (existingProjects[0].count === 0) {
      const [[alice]] = await connection.query('SELECT id, full_name FROM users WHERE username = "student_alice"');
      const [[bob]] = await connection.query('SELECT id, full_name FROM users WHERE username = "student_bob"');
      const [[carol]] = await connection.query('SELECT id, full_name FROM users WHERE username = "supervisor_carol"');
      const [[dave]] = await connection.query('SELECT id, full_name FROM users WHERE username = "supervisor_dave"');

      if (alice && bob && carol && dave) {
        const projectsToSeed = [
          [
            'TEST_RECORD: AI Chatbot Assistant', 
            'A basic chatbot application leveraging modern NLP techniques.', 
            'Artificial Intelligence', 
            alice.full_name, 
            alice.id, 
            carol.full_name, 
            carol.id, 
            '2026-06-01', 
            'submitted', 
            null
          ],
          [
            'TEST_RECORD: Decentralized File Sharing', 
            'A secure, peer-to-peer file sharing protocol build on Web3 technologies.', 
            'Cybersecurity', 
            bob.full_name, 
            bob.id, 
            dave.full_name, 
            dave.id, 
            '2026-06-05', 
            'underReview', 
            'Looks promising, please refine project architecture.'
          ]
        ];

        for (const proj of projectsToSeed) {
          await connection.query(`
            INSERT INTO projects 
              (title, description, category, student_name, student_id, supervisor_name, supervisor_id, submitted_date, status, feedback) 
            VALUES 
              (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            proj
          );
        }
        console.log('Projects table seeded with test records.');
      }
    } else {
      console.log('Projects table already contains data. Skipping seeding.');
    }

    console.log('Database setup completed successfully.');
  } catch (error) {
    console.error('Error during database setup:', error.message);
    process.exit(1);
  } finally {
    if (connection) await connection.end();
  }
}

setupDatabase();
