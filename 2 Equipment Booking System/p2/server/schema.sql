-- Database initialization script for c2p1
CREATE DATABASE IF NOT EXISTS c2p1;
USE c2p1;

-- Drop tables in dependency order
DROP TABLE IF EXISTS bookings;
DROP TABLE IF EXISTS sessions;
DROP TABLE IF EXISTS users;

-- Users table
CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    role ENUM('Staff', 'Assistant') NOT NULL,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Sessions table
CREATE TABLE sessions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    token VARCHAR(255) NOT NULL UNIQUE,
    username VARCHAR(50) NOT NULL,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (username) REFERENCES users(username) ON UPDATE CASCADE ON DELETE CASCADE
);

-- Bookings table
CREATE TABLE bookings (
    id INT AUTO_INCREMENT PRIMARY KEY,
    equipmentName VARCHAR(100) NOT NULL,
    requestedUser VARCHAR(50) NOT NULL,
    bookingDate DATE NOT NULL,
    startTime TIME NOT NULL,
    endTime TIME NOT NULL,
    purpose TEXT NOT NULL,
    status ENUM('Pending', 'Approved', 'Rejected', 'Collected', 'Returned') DEFAULT 'Pending',
    assistantComment TEXT NULL,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (requestedUser) REFERENCES users(username) ON UPDATE CASCADE ON DELETE RESTRICT
);

-- Seed data for workshop
INSERT INTO users (username, password, role) VALUES
('alice_staff', 'password123', 'Staff'),
('bob_staff', 'password123', 'Staff'),
('clara_assistant', 'password123', 'Assistant');

INSERT INTO bookings (equipmentName, requestedUser, bookingDate, startTime, endTime, purpose, status, assistantComment) VALUES
('Spectrophotometer A', 'alice_staff', '2026-06-15', '09:00:00', '12:00:00', 'Measuring absorbance of protein solutions', 'Pending', NULL),
('Centrifuge B', 'bob_staff', '2026-06-16', '14:00:00', '16:00:00', 'Spinning down culture vials', 'Approved', 'Approved - please keep area clean'),
('PCR Machine', 'alice_staff', '2026-06-10', '10:00:00', '13:00:00', 'Amplifying DNA samples', 'Rejected', 'Rejected - equipment is reserved for calibration');
