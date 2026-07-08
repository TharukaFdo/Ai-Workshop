CREATE DATABASE IF NOT EXISTS c8p2;
USE c8p2;

CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(100) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    role ENUM('Staff', 'Coordinator') NOT NULL
);

CREATE TABLE IF NOT EXISTS sessions (
    token VARCHAR(255) PRIMARY KEY,
    user_id INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS bookings (
    id INT AUTO_INCREMENT PRIMARY KEY,
    room_name VARCHAR(100) NOT NULL,
    booking_date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    purpose VARCHAR(255) NOT NULL,
    requester_name VARCHAR(100) NOT NULL,
    user_id INT NOT NULL,
    status ENUM('pending', 'approved', 'rejected', 'cancelled') DEFAULT 'pending' NOT NULL,
    coordinator_note TEXT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Seed users if they do not exist
INSERT IGNORE INTO users (id, username, password, role) VALUES
(1, 'alice_staff', 'password123', 'Staff'),
(2, 'bob_staff', 'password123', 'Staff'),
(3, 'charlie_coord', 'password123', 'Coordinator');

-- Seed initial bookings for testing
INSERT IGNORE INTO bookings (id, room_name, booking_date, start_time, end_time, purpose, requester_name, user_id, status, coordinator_note) VALUES
(1, 'Conference Room A', '2026-06-20', '09:00:00', '11:00:00', 'Project kickoff meeting', 'alice_staff', 1, 'approved', 'Approved request - sounds good.'),
(2, 'Meeting Room B', '2026-06-21', '14:00:00', '15:30:00', 'Design review sync', 'bob_staff', 2, 'pending', NULL),
(3, 'Board Room', '2026-06-22', '10:00:00', '12:00:00', 'Q2 Review meeting', 'alice_staff', 1, 'rejected', 'Room already booked for executive presentation.');
