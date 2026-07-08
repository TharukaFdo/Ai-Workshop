const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
require('dotenv').config();

async function setupDatabase() {
  const connectionConfig = {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || ''
  };

  const dbName = process.env.DB_NAME || 'c9p3';

  // Read arguments to see if a reset is requested
  const forceReset = process.argv.includes('--reset');

  try {
    const connection = await mysql.createConnection(connectionConfig);
    console.log('Connected to MySQL server successfully.');

    // Drop database if force reset is requested
    if (forceReset) {
      await connection.query(`DROP DATABASE IF EXISTS \`${dbName}\``);
      console.log(`Database "${dbName}" dropped for reset.`);
    }

    // Create database if not exists
    await connection.query(`CREATE DATABASE IF NOT EXISTS \`${dbName}\``);
    console.log(`Database "${dbName}" checked/created.`);

    // Use database
    await connection.query(`USE \`${dbName}\``);

    // Create app_users table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS app_users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        username VARCHAR(255) NOT NULL UNIQUE,
        password VARCHAR(255) NOT NULL,
        role ENUM('student', 'supervisor') NOT NULL,
        fullName VARCHAR(255) NOT NULL,
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);
    console.log('Table "app_users" checked/created.');

    // Create project_submissions table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS project_submissions (
        id INT AUTO_INCREMENT PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        description TEXT NOT NULL,
        category VARCHAR(255) NOT NULL,
        studentName VARCHAR(255) NOT NULL,
        supervisorName VARCHAR(255) NOT NULL,
        submittedDate DATE NOT NULL,
        status ENUM('submitted', 'underReview', 'approved', 'rejected', 'revisionRequested') NOT NULL DEFAULT 'submitted',
        feedback TEXT NULL,
        student_id INT NOT NULL,
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (student_id) REFERENCES app_users(id) ON DELETE CASCADE
      )
    `);
    console.log('Table "project_submissions" checked/created.');

    // Hash demo password
    const hashedPassword = await bcrypt.hash('password123', 10);

    // Seed app_users
    const [existingUsers] = await connection.query('SELECT COUNT(*) as count FROM app_users');
    if (existingUsers[0].count === 0) {
      await connection.query(`
        INSERT INTO app_users (username, password, role, fullName) VALUES
        ('alice_student', ?, 'student', 'Alice Cooper'),
        ('bob_student', ?, 'student', 'Bob Marley'),
        ('supervisor_john', ?, 'supervisor', 'Prof. John Doe'),
        ('supervisor_jane', ?, 'supervisor', 'Prof. Jane Smith')
      `, [hashedPassword, hashedPassword, hashedPassword, hashedPassword]);
      console.log('Demo users seeded with hashed passwords.');
    } else {
      console.log('Users table already contains data. Skipping seeding.');
    }

    // Seed project_submissions
    const [existingSubmissions] = await connection.query('SELECT COUNT(*) as count FROM project_submissions');
    if (existingSubmissions[0].count === 0) {
      // Get the user ID of Alice and Bob
      const [users] = await connection.query('SELECT id, username FROM app_users');
      const alice = users.find(u => u.username === 'alice_student');
      const bob = users.find(u => u.username === 'bob_student');

      if (alice && bob) {
        await connection.query(`
          INSERT INTO project_submissions (title, description, category, studentName, supervisorName, submittedDate, status, feedback, student_id) VALUES
          ('AI Chatbot for Customer Service', 'A natural language processing based chatbot.', 'Artificial Intelligence', 'Alice Cooper', 'Prof. John Doe', '2026-06-10', 'submitted', NULL, ?),
          ('E-commerce Mobile App', 'A mobile commerce platform built with React Native.', 'Mobile Applications', 'Bob Marley', 'Prof. Jane Smith', '2026-06-12', 'underReview', 'Initial structure looks good. Need to see DB architecture.', ?)
        `, [alice.id, bob.id]);
        console.log('Demo project submissions seeded.');
      }
    } else {
      console.log('Project submissions table already contains data. Skipping seeding.');
    }

    await connection.end();
    console.log('Database setup completed successfully.');
  } catch (error) {
    console.error('Error during database setup:', error);
    process.exit(1);
  }
}

setupDatabase();
