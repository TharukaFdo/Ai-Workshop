-- Create database if not exists
CREATE DATABASE IF NOT EXISTS c7p3;
USE c7p3;

DROP TABLE IF EXISTS requests;
DROP TABLE IF EXISTS app_users;

-- Users table for prototype login/role identity
CREATE TABLE IF NOT EXISTS app_users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(100) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  role ENUM('Requester', 'Technician') NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Maintenance Requests table
CREATE TABLE IF NOT EXISTS requests (
  id INT AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(100) NOT NULL,
  description TEXT NOT NULL,
  location VARCHAR(100) NOT NULL,
  priority ENUM('Low', 'Medium', 'High') NOT NULL,
  requester_name VARCHAR(100) NOT NULL,
  requester_id INT NOT NULL,
  status ENUM('submitted', 'inProgress', 'completed', 'closed') DEFAULT 'submitted',
  technician_note TEXT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  closed_at TIMESTAMP NULL,
  FOREIGN KEY (requester_id) REFERENCES app_users(id) ON DELETE CASCADE
);

-- Seed some default users for prototype testing
INSERT IGNORE INTO app_users (id, username, password_hash, role) VALUES 
(1, 'alice_requester', 'placeholder_hash', 'Requester'),
(2, 'bob_technician', 'placeholder_hash', 'Technician'),
(3, 'charlie_requester', 'placeholder_hash', 'Requester');
