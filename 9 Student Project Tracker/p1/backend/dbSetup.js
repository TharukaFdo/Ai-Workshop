import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';

dotenv.config();

async function initDB() {
  const { DB_HOST, DB_PORT, DB_USER, DB_PASSWORD, DB_NAME } = process.env;

  console.log(`Connecting to MySQL at ${DB_HOST}:${DB_PORT} as ${DB_USER}...`);

  const connection = await mysql.createConnection({
    host: DB_HOST,
    port: DB_PORT || 3306,
    user: DB_USER,
    password: DB_PASSWORD
  });

  try {
    // 1. Create Database
    await connection.query(`CREATE DATABASE IF NOT EXISTS \`${DB_NAME}\`;`);
    console.log(`Database "${DB_NAME}" verified/created.`);

    // Switch to database
    await connection.query(`USE \`${DB_NAME}\`;`);

    // 2. Drop existing projects table to recreate it with foreign key constraints safely
    await connection.query('DROP TABLE IF EXISTS projects;');
    await connection.query('DROP TABLE IF EXISTS users;');

    // 3. Create Users Table
    await connection.query(`
      CREATE TABLE users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        username VARCHAR(100) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        role VARCHAR(50) NOT NULL
      );
    `);
    console.log('Table "users" created.');

    // 4. Seed Users
    const salt = await bcrypt.genSalt(10);
    const alicePassword = await bcrypt.hash('password123', salt);
    const johnPassword = await bcrypt.hash('password123', salt);

    await connection.query(
      `INSERT INTO users (username, password, role) VALUES 
       ('alice', ?, 'student'),
       ('dr_john', ?, 'supervisor')`,
      [alicePassword, johnPassword]
    );
    console.log('Seed users seeded.');

    // 5. Create Projects Table linked to users
    await connection.query(`
      CREATE TABLE projects (
        id INT AUTO_INCREMENT PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        description TEXT NOT NULL,
        category VARCHAR(100) NOT NULL,
        student_name VARCHAR(150) NOT NULL,
        supervisor_name VARCHAR(150) NOT NULL,
        submitted_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        status VARCHAR(50) DEFAULT 'Pending',
        supervisor_feedback TEXT,
        student_id INT,
        FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE SET NULL
      );
    `);
    console.log('Table "projects" created.');

    // Get Alice's ID to link seed projects
    const [userRows] = await connection.query("SELECT id FROM users WHERE username = 'alice'");
    const aliceId = userRows[0].id;

    // 6. Seed Projects
    const demoProjects = [
      [
        'Smart Attendance System',
        'A face-recognition based attendance system for university classrooms.',
        'AI & Machine Learning',
        'Alice Smith',
        'Dr. John Doe',
        'Pending',
        null,
        aliceId
      ],
      [
        'E-Commerce Mobile App',
        'A React Native shopping application integrated with a Stripe payment gateway.',
        'Mobile Development',
        'Bob Johnson',
        'Prof. Jane Williams',
        'Approved',
        'Excellent proposal. Keep up the good work!',
        null
      ]
    ];

    await connection.query(
      `INSERT INTO projects (title, description, category, student_name, supervisor_name, status, supervisor_feedback, student_id) VALUES ?`,
      [demoProjects]
    );
    console.log('Demo projects seeded.');

  } catch (error) {
    console.error('Error setting up the database:', error);
    process.exit(1);
  } finally {
    await connection.end();
  }
}

initDB();
