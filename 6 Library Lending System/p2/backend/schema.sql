CREATE DATABASE IF NOT EXISTS c6p2;
USE c6p2;

CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(50) NOT NULL UNIQUE,
  role ENUM('librarian', 'member') NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS books (
  id INT AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  author VARCHAR(255) NOT NULL,
  isbn VARCHAR(50) NOT NULL UNIQUE,
  category VARCHAR(100) NOT NULL,
  availabilityStatus ENUM('Available', 'Borrowed', 'Unavailable') DEFAULT 'Available' NOT NULL,
  borrowedMemberId INT NULL,
  borrowedDate DATE NULL,
  returnDate DATE NULL,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (borrowedMemberId) REFERENCES users(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS sessions (
  token VARCHAR(255) PRIMARY KEY,
  userId INT NOT NULL,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS reservations (
  id INT AUTO_INCREMENT PRIMARY KEY,
  bookId INT NOT NULL,
  memberId INT NOT NULL,
  status ENUM('Pending', 'Fulfilled', 'Cancelled') DEFAULT 'Pending' NOT NULL,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (bookId) REFERENCES books(id) ON DELETE CASCADE,
  FOREIGN KEY (memberId) REFERENCES users(id) ON DELETE CASCADE
);

-- Safe seeding
INSERT IGNORE INTO users (id, username, role) VALUES 
(1, 'librarian1', 'librarian'),
(2, 'member1', 'member'),
(3, 'member2', 'member');

INSERT IGNORE INTO books (id, title, author, isbn, category, availabilityStatus) VALUES
(1, 'The Great Gatsby', 'F. Scott Fitzgerald', '9780743273565', 'Fiction', 'Available'),
(2, 'To Kill a Mockingbird', 'Harper Lee', '9780061120084', 'Classic', 'Available'),
(3, '1984', 'George Orwell', '9780451524935', 'Dystopian', 'Available');
