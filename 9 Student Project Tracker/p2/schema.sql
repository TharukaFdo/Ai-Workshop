-- Create database if not exists
CREATE DATABASE IF NOT EXISTS c9p2;
USE c9p2;

-- Create users table
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    role ENUM('student', 'supervisor') NOT NULL,
    full_name VARCHAR(100) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create projects table
CREATE TABLE IF NOT EXISTS projects (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    category VARCHAR(100) NOT NULL,
    student_name VARCHAR(100) NOT NULL,
    student_id INT NOT NULL,
    supervisor_name VARCHAR(100) NOT NULL,
    supervisor_id INT NOT NULL,
    submitted_date DATE NOT NULL,
    status ENUM('submitted', 'underReview', 'approved', 'rejected', 'revisionRequested') NOT NULL DEFAULT 'submitted',
    feedback TEXT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (student_id) REFERENCES users(id),
    FOREIGN KEY (supervisor_id) REFERENCES users(id)
);
