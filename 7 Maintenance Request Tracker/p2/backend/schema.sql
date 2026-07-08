-- Database creation if not done by script
CREATE DATABASE IF NOT EXISTS c7p2;
USE c7p2;

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(255) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL, -- Stored as cleartext or simple hash for workshop purposes
  role ENUM('requester', 'technician') NOT NULL,
  session_token VARCHAR(255) NULL UNIQUE
);

-- Maintenance Requests table
CREATE TABLE IF NOT EXISTS requests (
  id INT AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  location VARCHAR(255) NOT NULL,
  priority ENUM('Low', 'Medium', 'High') NOT NULL,
  requester_name VARCHAR(255) NOT NULL,
  status ENUM('submitted', 'inProgress', 'completed', 'closed') NOT NULL DEFAULT 'submitted',
  technician_note TEXT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  closed_at TIMESTAMP NULL DEFAULT NULL
);

-- Seed users
INSERT INTO users (username, password, role)
VALUES 
  ('alice_req', 'password123', 'requester'),
  ('bob_tech', 'password123', 'technician')
ON DUPLICATE KEY UPDATE role=role;

-- Seed initial requests
INSERT INTO requests (title, description, location, priority, requester_name, status, technician_note, closed_at)
VALUES
  ('Broken AC Unit', 'The air conditioning unit in Room 302 is blowing hot air.', 'Room 302', 'High', 'Alice Requester', 'submitted', NULL, NULL),
  ('Flickering Lights', 'Fluorescent tubes in the main lobby are flickering.', 'Lobby', 'Medium', 'Alice Requester', 'inProgress', 'Scheduled replacement bulbs.', NULL),
  ('Leaky Faucet', 'The sink faucet in the 2nd floor restroom is dripping.', 'Restroom 2F', 'Low', 'Charlie Requester', 'closed', 'Replaced washer. No more leaks.', '2026-06-14 10:00:00')
ON DUPLICATE KEY UPDATE title=title;
