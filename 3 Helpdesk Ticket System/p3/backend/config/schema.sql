CREATE DATABASE IF NOT EXISTS c3p3;
USE c3p3;

-- Drop tables if they exist to support fresh setup
DROP TABLE IF EXISTS tickets;
DROP TABLE IF EXISTS app_users;

-- Create app_users table
CREATE TABLE app_users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(100) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role ENUM('User', 'Support agent') NOT NULL
);

-- Create tickets table
CREATE TABLE tickets (
  id INT AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  category VARCHAR(100) NOT NULL,
  submittedUser VARCHAR(100) NOT NULL,
  status ENUM('open', 'inProgress', 'resolved', 'closed') NOT NULL DEFAULT 'open',
  agentResponse TEXT NULL,
  reopened INT NOT NULL DEFAULT 0,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  closedAt TIMESTAMP NULL,
  FOREIGN KEY (submittedUser) REFERENCES app_users(username) ON UPDATE CASCADE ON DELETE RESTRICT
);

-- Insert demo users (password is 'password' and 'password123' compatible)
-- Hash of 'password': 5e884898da28047151d0e56f8dc6292773603d0d6aabbdd62a11ef721d1542d8
-- Hash of 'password123': ef92b778bafe771e8929ab57e5377d07acf67e5520e3d42f59a979222c1db4b2
INSERT INTO app_users (username, password, password_hash, role) VALUES 
('alice', 'password', '5e884898da28047151d0e56f8dc6292773603d0d6aabbdd62a11ef721d1542d8', 'User'),
('bob', 'password', '5e884898da28047151d0e56f8dc6292773603d0d6aabbdd62a11ef721d1542d8', 'User'),
('agent_carter', 'password', '5e884898da28047151d0e56f8dc6292773603d0d6aabbdd62a11ef721d1542d8', 'Support agent'),
('agent_smith', 'password', '5e884898da28047151d0e56f8dc6292773603d0d6aabbdd62a11ef721d1542d8', 'Support agent');

-- Insert initial seed tickets
INSERT INTO tickets (title, description, category, submittedUser, status, agentResponse, closedAt) VALUES
('VPN connection failure', 'Cannot connect to corporate VPN since this morning.', 'Network', 'alice', 'open', NULL, NULL),
('Laptop battery swelling', 'The battery of my ThinkPad is swollen and pushing the trackpad up.', 'Hardware', 'bob', 'inProgress', 'Please bring it to the IT desk for a replacement.', NULL),
('Software license expired', 'My Photoshop license is showing as expired. Need renewal.', 'Software', 'alice', 'closed', 'License has been renewed. You should be able to log in now.', NOW());
