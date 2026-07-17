const mysql = require('mysql2/promise');
const { hashPassword } = require('../utils/hash');
require('dotenv').config();

const { DB_HOST, DB_PORT, DB_USER, DB_PASSWORD, DB_NAME } = process.env;

async function run() {
  console.log('Starting Database Setup (with secure password hashing & reservations)...');
  
  // 1. Initial connection without database
  const connection = await mysql.createConnection({
    host: DB_HOST || 'localhost',
    port: DB_PORT || 3306,
    user: DB_USER || 'root',
    password: DB_PASSWORD || ''
  });

  console.log(`Creating database "${DB_NAME || 'c6p3'}" if it doesn't exist...`);
  await connection.query(`CREATE DATABASE IF NOT EXISTS \`${DB_NAME || 'c6p3'}\``);
  await connection.end();

  // 2. Connect directly to the database
  const db = await mysql.createConnection({
    host: DB_HOST || 'localhost',
    port: DB_PORT || 3306,
    user: DB_USER || 'root',
    password: DB_PASSWORD || '',
    database: DB_NAME || 'c6p3'
  });

  console.log('Creating "app_users" table...');
  await db.query(`
    CREATE TABLE IF NOT EXISTS app_users (
      id INT AUTO_INCREMENT PRIMARY KEY,
      username VARCHAR(50) UNIQUE NOT NULL,
      password VARCHAR(255) NOT NULL,
      role ENUM('Librarian', 'Member') NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB;
  `);

  console.log('Creating "books" table...');
  await db.query(`
    CREATE TABLE IF NOT EXISTS books (
      id INT AUTO_INCREMENT PRIMARY KEY,
      title VARCHAR(255) NOT NULL,
      author VARCHAR(255) NOT NULL,
      isbn VARCHAR(20) UNIQUE NOT NULL,
      category VARCHAR(100) NOT NULL,
      availabilityStatus ENUM('available', 'borrowed', 'unavailable') NOT NULL DEFAULT 'available',
      borrowedMember INT DEFAULT NULL,
      borrowedDate DATE DEFAULT NULL,
      returnDate DATE DEFAULT NULL,
      reservedMember INT DEFAULT NULL,
      reservationStatus ENUM('pending', 'fulfilled', 'cancelled') DEFAULT NULL,
      createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      FOREIGN KEY (borrowedMember) REFERENCES app_users(id) ON DELETE SET NULL,
      FOREIGN KEY (reservedMember) REFERENCES app_users(id) ON DELETE SET NULL
    ) ENGINE=InnoDB;
  `);

  // Migration helper: Alter table if running setup on existing schema
  try {
    await db.query('ALTER TABLE books ADD COLUMN reservedMember INT DEFAULT NULL');
    await db.query("ALTER TABLE books ADD COLUMN reservationStatus ENUM('pending', 'fulfilled', 'cancelled') DEFAULT NULL");
    await db.query('ALTER TABLE books ADD FOREIGN KEY (reservedMember) REFERENCES app_users(id) ON DELETE SET NULL');
    console.log('Schema migration applied successfully.');
  } catch (e) {
    // Columns might already exist, which is fine
    console.log('Schema migration check: Columns already present.');
  }

  console.log('Seeding "app_users" table...');
  await db.query(`
    INSERT INTO app_users (username, password, role)
    VALUES 
      ('librarian1', ?, 'Librarian'),
      ('member1', ?, 'Member'),
      ('member2', ?, 'Member')
    ON DUPLICATE KEY UPDATE password=VALUES(password);
  `, [hashPassword('password123'), hashPassword('password123'), hashPassword('password123')]);

  console.log('Seeding "books" table...');
  const [users] = await db.query('SELECT id, username FROM app_users');
  const userMap = {};
  users.forEach(u => { userMap[u.username] = u.id; });

  await db.query(`
    INSERT INTO books (title, author, isbn, category, availabilityStatus, borrowedMember, borrowedDate, returnDate, reservedMember, reservationStatus)
    VALUES 
      ('The Great Gatsby', 'F. Scott Fitzgerald', '9780743273565', 'Fiction', 'available', NULL, NULL, NULL, NULL, NULL),
      ('To Kill a Mockingbird', 'Harper Lee', '9780061120084', 'Classic', 'available', NULL, NULL, NULL, NULL, NULL),
      ('1984', 'George Orwell', '9780451524935', 'Dystopian', 'borrowed', ?, CURRENT_DATE(), DATE_ADD(CURRENT_DATE(), INTERVAL 14 DAY), NULL, NULL),
      ('Clean Code', 'Robert C. Martin', '9780132350884', 'Technology', 'unavailable', NULL, NULL, NULL, NULL, NULL)
    ON DUPLICATE KEY UPDATE isbn=isbn;
  `, [userMap['member1']]);

  console.log('Database setup complete successfully.');
  await db.end();
}

run().catch(err => {
  console.error('Error setting up database:', err);
  process.exit(1);
});
