-- Create Database if not exists
CREATE DATABASE IF NOT EXISTS c10p2;
USE c10p2;

-- Users Table
CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(100) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  role ENUM('organizer', 'participant') NOT NULL,
  session_token VARCHAR(255) NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Registrations Table
CREATE TABLE IF NOT EXISTS registrations (
  id INT AUTO_INCREMENT PRIMARY KEY,
  participantName VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL,
  workshopTitle VARCHAR(255) NOT NULL,
  registrationDetails TEXT,
  status ENUM('pending', 'confirmed', 'cancelled', 'waitlisted') NOT NULL DEFAULT 'pending',
  attendanceStatus ENUM('notMarked', 'present', 'absent') NOT NULL DEFAULT 'notMarked',
  organizerNote TEXT,
  userId INT NULL,
  createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (userId) REFERENCES users(id) ON DELETE SET NULL
);
