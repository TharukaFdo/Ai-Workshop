const mysql = require('mysql2/promise');
require('dotenv').config();

async function seed() {
  const connectionConfig = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    port: parseInt(process.env.DB_PORT || '3306')
  };

  console.log('Connecting to MySQL host...');
  const conn = await mysql.createConnection(connectionConfig);

  const dbName = process.env.DB_NAME || 'c4p1';
  console.log(`Creating database "${dbName}" if it does not exist...`);
  await conn.query(`CREATE DATABASE IF NOT EXISTS \`${dbName}\``);
  await conn.query(`USE \`${dbName}\``);

  console.log('Dropping tables if they exist...');
  await conn.query('DROP TABLE IF EXISTS applications');
  await conn.query('DROP TABLE IF EXISTS users');

  console.log('Creating users table...');
  await conn.query(`
    CREATE TABLE users (
      id INT AUTO_INCREMENT PRIMARY KEY,
      username VARCHAR(255) UNIQUE NOT NULL,
      password VARCHAR(255) NOT NULL,
      role ENUM('student', 'coordinator') NOT NULL
    )
  `);

  console.log('Creating applications table...');
  await conn.query(`
    CREATE TABLE applications (
      id INT AUTO_INCREMENT PRIMARY KEY,
      student_id INT NOT NULL,
      student_name VARCHAR(255) NOT NULL,
      company_name VARCHAR(255) NOT NULL,
      position_title VARCHAR(255) NOT NULL,
      start_date DATE NOT NULL,
      end_date DATE NOT NULL,
      submitted_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      status ENUM('submitted', 'under_review', 'approved', 'rejected', 'needs_changes') DEFAULT 'submitted',
      coordinator_comments TEXT,
      FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);

  console.log('Seeding mock users...');
  const users = [
    ['student1', 'password', 'student'],
    ['student2', 'password', 'student'],
    ['coordinator1', 'password', 'coordinator']
  ];
  await conn.query('INSERT INTO users (username, password, role) VALUES ?', [users]);

  // Fetch the user IDs to map applications correctly
  const [userRows] = await conn.query('SELECT id, username FROM users');
  const userMap = {};
  userRows.forEach(user => {
    userMap[user.username] = user.id;
  });

  console.log('Seeding mock applications...');
  const demoApplications = [
    [userMap['student1'], 'Alice Smith', 'Google', 'Software Engineer Intern', '2026-09-01', '2026-12-15', 'submitted', null],
    [userMap['student1'], 'Alice Smith', 'Meta', 'Data Analyst Intern', '2026-09-10', '2026-12-10', 'needs_changes', 'Please update the start date to a week later.'],
    [userMap['student2'], 'Bob Jones', 'Amazon', 'Product Manager Intern', '2026-10-01', '2027-03-31', 'approved', 'Welcome aboard!'],
    [userMap['student2'], 'Bob Jones', 'Netflix', 'UX Research Intern', '2026-08-01', '2026-11-30', 'rejected', 'We have filled all positions. Please try again next cohort.']
  ];

  const sql = `INSERT INTO applications (student_id, student_name, company_name, position_title, start_date, end_date, status, coordinator_comments) VALUES ?`;
  await conn.query(sql, [demoApplications]);

  console.log('Database seeded successfully!');
  await conn.end();
}

seed().catch(err => {
  console.error('Error seeding database:', err);
  process.exit(1);
});
