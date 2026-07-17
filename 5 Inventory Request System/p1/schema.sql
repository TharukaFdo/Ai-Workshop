-- Create database
CREATE DATABASE IF NOT EXISTS inventory_db;
USE inventory_db;

-- Create inventory requests table
CREATE TABLE IF NOT EXISTS requests (
    id INT AUTO_INCREMENT PRIMARY KEY,
    item_name VARCHAR(255) NOT NULL,
    quantity INT NOT NULL CHECK (quantity > 0),
    reason TEXT NOT NULL,
    requested_date DATE NOT NULL,
    requester_name VARCHAR(255) NOT NULL,
    status ENUM('pending', 'approved', 'rejected', 'issued') DEFAULT 'pending',
    storekeeper_note TEXT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Seed some initial data for testing
INSERT INTO requests (item_name, quantity, reason, requested_date, requester_name, status, storekeeper_note) VALUES
('MacBook Pro Charger', 1, 'Lost my original charger at a client site', '2026-07-09', 'Alice Smith', 'pending', NULL),
('Ergonomic Keyboard', 2, 'For new developers joining next week', '2026-07-08', 'Bob Jones', 'approved', 'Approved for IT department'),
('Office Chairs', 5, 'Replacing broken conference room chairs', '2026-07-07', 'Charlie Brown', 'issued', 'Handed over by storekeeper on 2026-07-08'),
('Wireless Mouse', 1, 'Current mouse scroll wheel is malfunctioning', '2026-07-05', 'Alice Smith', 'rejected', 'No replacement stock available at the moment');
