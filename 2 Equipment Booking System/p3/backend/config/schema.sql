-- Create Database if not exists
CREATE DATABASE IF NOT EXISTS `c2p3`;
USE `c2p3`;

-- Drop tables if they exist to allow clean reset
DROP TABLE IF EXISTS `bookings`;
DROP TABLE IF EXISTS `users`;

-- Users table
CREATE TABLE `users` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `username` VARCHAR(50) NOT NULL UNIQUE,
  `role` ENUM('staff', 'assistant') NOT NULL,
  `password` VARCHAR(255) NOT NULL, -- Storing bcrypt password hashes
  `createdAt` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Bookings table
CREATE TABLE `bookings` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `equipmentName` VARCHAR(255) NOT NULL,
  `requestedUser` VARCHAR(100) NOT NULL, -- Storing name or username of the staff member
  `requestedUserId` INT, -- Optional reference to user ID
  `bookingDate` DATE NOT NULL,
  `startTime` TIME NOT NULL,
  `endTime` TIME NOT NULL,
  `purpose` TEXT NOT NULL,
  `status` ENUM('pending', 'approved', 'rejected', 'collected', 'returned') NOT NULL DEFAULT 'pending',
  `assistantComment` VARCHAR(255) DEFAULT NULL,
  `createdAt` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`requestedUserId`) REFERENCES `users`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Insert Mock Users (Password is 'password123' for all)
INSERT INTO `users` (`username`, `role`, `password`) VALUES
('alice_staff', 'staff', '$2b$10$ao/y6piN8OJR2DblKNZj9.oFVi7HrZ0/i4aq99dtLYVZyKv287V.e'),
('bob_staff', 'staff', '$2b$10$ao/y6piN8OJR2DblKNZj9.oFVi7HrZ0/i4aq99dtLYVZyKv287V.e'),
('charlie_assistant', 'assistant', '$2b$10$ao/y6piN8OJR2DblKNZj9.oFVi7HrZ0/i4aq99dtLYVZyKv287V.e');
