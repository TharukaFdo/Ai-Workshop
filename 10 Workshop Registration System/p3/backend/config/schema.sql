-- Create database if not exists
CREATE DATABASE IF NOT EXISTS c10p3;
USE c10p3;

-- Drop tables if they exist to ensure clean setup and correct password hashing
DROP TABLE IF EXISTS registrations;
DROP TABLE IF EXISTS app_users;

-- Table for users (Mock/Prototype Auth)
CREATE TABLE IF NOT EXISTS app_users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  email VARCHAR(255) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL, -- Stored as SHA-256 hash
  role ENUM('participant', 'organizer') NOT NULL DEFAULT 'participant',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table for registrations
CREATE TABLE IF NOT EXISTS registrations (
  id INT AUTO_INCREMENT PRIMARY KEY,
  participantName VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL,
  workshopTitle VARCHAR(255) NOT NULL,
  registrationDetails TEXT NOT NULL,
  status ENUM('pending', 'confirmed', 'cancelled', 'waitlisted') NOT NULL DEFAULT 'pending',
  attendanceStatus ENUM('notMarked', 'present', 'absent') NOT NULL DEFAULT 'notMarked',
  organizerNote TEXT DEFAULT NULL,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY unique_user_workshop (email, workshopTitle)
);

-- Seed initial test users (SHA-256 hashed passwords)
-- organizer@workshop.com -> admin123
-- participant@workshop.com -> user123
-- john@example.com -> john123
INSERT IGNORE INTO app_users (email, password, role) VALUES 
('organizer@workshop.com', '240be518fabd2724ddb6f04eeb1da5967448d7e831c08c8fa822809f74c720a9', 'organizer'),
('participant@workshop.com', 'e606e38b0d8c19b24cf0ee3808183162ea7cd63ff7912dbb22b5e803286b4446', 'participant'),
('john@example.com', '5cf5a228f41852d76a2b6e1ad546d0a793a3843fb32f91eb3be7a6b22576b53a', 'participant');

-- Seed initial test registrations
INSERT IGNORE INTO registrations (participantName, email, workshopTitle, registrationDetails, status, attendanceStatus, organizerNote) VALUES
('John Doe', 'john@example.com', 'Advanced React Patterns & compiler', 'Interested in React 19 features', 'pending', 'notMarked', NULL),
('Alice Smith', 'alice@example.com', 'Node.js Scale, Performance & Clustering', 'Has 2 years Express experience', 'confirmed', 'present', 'Checked in early'),
('Bob Johnson', 'bob@example.com', 'Advanced React Patterns & compiler', 'Wants to learn custom hooks', 'cancelled', 'absent', 'Cancelled due to schedule conflict');
