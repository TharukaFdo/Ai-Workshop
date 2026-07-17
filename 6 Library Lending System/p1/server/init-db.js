const mysql = require('mysql2/promise');
require('dotenv').config();

async function initDB() {
  const host = process.env.DB_HOST || 'localhost';
  const port = parseInt(process.env.DB_PORT || '3306');
  const user = process.env.DB_USER || 'root';
  const password = process.env.DB_PASSWORD || '';
  const dbName = process.env.DB_NAME || 'c6p1';

  console.log(`Connecting to MySQL server at ${host}:${port}...`);
  
  const connection = await mysql.createConnection({
    host,
    port,
    user,
    password
  });

  try {
    // 1. Create database if not exists
    console.log(`Creating database "${dbName}" if it doesn't exist...`);
    await connection.query(`CREATE DATABASE IF NOT EXISTS \`${dbName}\``);

    // 2. Select the database
    await connection.query(`USE \`${dbName}\``);

    // 3. Create books table
    console.log('Creating "books" table...');
    await connection.query(`
      CREATE TABLE IF NOT EXISTS books (
        id INT AUTO_INCREMENT PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        author VARCHAR(255) NOT NULL,
        isbn VARCHAR(100) NOT NULL,
        category VARCHAR(100) NOT NULL,
        status VARCHAR(50) DEFAULT 'Available',
        borrowed_member VARCHAR(255) DEFAULT NULL,
        borrowed_date DATE DEFAULT NULL,
        return_date DATE DEFAULT NULL
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    // 4. Create users table
    console.log('Creating "users" table...');
    await connection.query(`
      CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        username VARCHAR(255) NOT NULL UNIQUE,
        password VARCHAR(255) NOT NULL,
        role VARCHAR(50) NOT NULL
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    // 5. Create reservations table
    console.log('Creating "reservations" table...');
    await connection.query(`
      CREATE TABLE IF NOT EXISTS reservations (
        id INT AUTO_INCREMENT PRIMARY KEY,
        book_id INT NOT NULL,
        member_username VARCHAR(255) NOT NULL,
        reserved_date DATE NOT NULL,
        status VARCHAR(50) DEFAULT 'Pending',
        FOREIGN KEY (book_id) REFERENCES books(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    // 6. Clear existing records to re-prepare demo data
    console.log('Clearing existing books, users and reservations...');
    await connection.query('SET FOREIGN_KEY_CHECKS = 0');
    await connection.query('TRUNCATE TABLE reservations');
    await connection.query('TRUNCATE TABLE books');
    await connection.query('TRUNCATE TABLE users');
    await connection.query('SET FOREIGN_KEY_CHECKS = 1');

    // 7. Seed initial books
    console.log('Seeding demo books...');
    const seedBooks = [
      ['The Great Gatsby', 'F. Scott Fitzgerald', '9780743273565', 'Fiction', 'Available'],
      ['To Kill a Mockingbird', 'Harper Lee', '9780446310789', 'Fiction', 'Available'],
      ['A Brief History of Time', 'Stephen Hawking', '9780553380163', 'Science', 'Available'],
      ['Clean Code', 'Robert C. Martin', '9780132350884', 'Technology', 'Available']
    ];

    for (const book of seedBooks) {
      await connection.query(
        'INSERT INTO books (title, author, isbn, category, status) VALUES (?, ?, ?, ?, ?)',
        book
      );
    }

    // 8. Seed initial users
    console.log('Seeding user accounts...');
    const seedUsers = [
      ['librarian1', 'lib123', 'librarian'],
      ['alice', 'alice123', 'member'],
      ['bob', 'bob123', 'member']
    ];

    for (const u of seedUsers) {
      await connection.query(
        'INSERT INTO users (username, password, role) VALUES (?, ?, ?)',
        u
      );
    }

    console.log('✓ Database initialization and seeding completed successfully.');
  } catch (error) {
    console.error('❌ Error initializing database:', error);
    process.exit(1);
  } finally {
    await connection.end();
  }
}

initDB();
