CREATE DATABASE IF NOT EXISTS inventory_request_db;
USE inventory_request_db;

CREATE TABLE IF NOT EXISTS requests (
  id INT AUTO_INCREMENT PRIMARY KEY,
  item_name VARCHAR(255) NOT NULL,
  quantity INT NOT NULL,
  reason TEXT NOT NULL,
  requested_date DATE NOT NULL,
  requester_name VARCHAR(255) NOT NULL,
  status ENUM('Pending', 'Approved', 'Rejected', 'Issued') DEFAULT 'Pending',
  storekeeper_notes TEXT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
