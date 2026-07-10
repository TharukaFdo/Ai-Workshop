const mysql = require('mysql2/promise');
require('dotenv').config();
const { hashPassword } = require('../utils/hash');

const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '3306'),
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || ''
};

async function setup() {
  let connection;
  try {
    console.log('Connecting to MySQL host to initialize database...');
    connection = await mysql.createConnection(dbConfig);

    // Create database if not exists
    const dbName = process.env.DB_NAME || 'c4p3';
    await connection.query(`CREATE DATABASE IF NOT EXISTS \`${dbName}\`;`);
    console.log(`Database "${dbName}" initialized.`);

    // Use database
    await connection.query(`USE \`${dbName}\`;`);

    // Create Users Table
    console.log('Creating "users" table...');
    await connection.query(`
      CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        username VARCHAR(100) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        role ENUM('student', 'coordinator') NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB;
    `);

    // Create Applications Table
    console.log('Creating "applications" table...');
    await connection.query(`
      CREATE TABLE IF NOT EXISTS applications (
        id INT AUTO_INCREMENT PRIMARY KEY,
        student_id INT NOT NULL,
        student_name VARCHAR(255) NOT NULL,
        company_name VARCHAR(255) NOT NULL,
        position_title VARCHAR(255) NOT NULL,
        start_date DATE NOT NULL,
        end_date DATE NOT NULL,
        submitted_date DATE NOT NULL,
        status ENUM('submitted', 'underReview', 'approved', 'rejected', 'changesRequested') DEFAULT 'submitted',
        coordinator_comment TEXT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE
      ) ENGINE=InnoDB;
    `);

    // Seed Demo Users if they do not exist
    console.log('Seeding demo users...');
    const [existingUsers] = await connection.query('SELECT COUNT(*) as count FROM users');
    if (existingUsers[0].count === 0) {
      const s1Hash = hashPassword('student123');
      const s2Hash = hashPassword('student123');
      const c1Hash = hashPassword('coordinator123');

      await connection.query(`
        INSERT INTO users (username, password, role) VALUES
        ('student1', ?, 'student'),
        ('student2', ?, 'student'),
        ('coordinator1', ?, 'coordinator');
      `, [s1Hash, s2Hash, c1Hash]);
      console.log('Demo users seeded successfully: student1, student2, coordinator1.');
    } else {
      console.log('Users table already contains data, skipping seeding users.');
    }

    // Seed Demo Applications if they do not exist
    console.log('Seeding demo applications...');
    const [existingApps] = await connection.query('SELECT COUNT(*) as count FROM applications');
    if (existingApps[0].count === 0) {
      // Fetch seeded user ids
      const [students] = await connection.query('SELECT id, username FROM users WHERE role = "student"');
      const student1Id = students.find(s => s.username === 'student1')?.id;
      const student2Id = students.find(s => s.username === 'student2')?.id;

      if (student1Id && student2Id) {
        await connection.query(`
          INSERT INTO applications (student_id, student_name, company_name, position_title, start_date, end_date, submitted_date, status, coordinator_comment) VALUES
          (?, 'Student One', 'Google', 'Software Engineering Intern', '2026-09-01', '2026-12-01', '2026-07-08', 'submitted', NULL),
          (?, 'Student One', 'Meta', 'Frontend Intern', '2026-10-01', '2027-01-15', '2026-07-07', 'underReview', 'Reviewing credentials.'),
          (?, 'Student Two', 'Microsoft', 'Product Management Intern', '2026-09-15', '2026-12-15', '2026-07-06', 'approved', 'Approved. Good match.'),
          (?, 'Student Two', 'Netflix', 'Site Reliability Intern', '2026-08-01', '2026-11-01', '2026-07-05', 'rejected', 'Positions already filled.');
        `, [student1Id, student1Id, student2Id, student2Id]);
        console.log('Demo applications seeded successfully.');
      }
    } else {
      console.log('Applications table already contains data, skipping seeding applications.');
    }

    console.log('Database setup completed successfully.');
  } catch (error) {
    console.error('Error setting up the database:', error);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

setup();
