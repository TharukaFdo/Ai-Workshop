CREATE DATABASE IF NOT EXISTS c4p2;
USE c4p2;

-- Users/login table
CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(50) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL, -- Plaintext for prototype/workshop simplicity
  role ENUM('student', 'coordinator') NOT NULL,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Sessions table
CREATE TABLE IF NOT EXISTS sessions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  token VARCHAR(255) NOT NULL UNIQUE,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Applications table
CREATE TABLE IF NOT EXISTS applications (
  id INT AUTO_INCREMENT PRIMARY KEY,
  student_id INT NOT NULL,
  studentName VARCHAR(255) NOT NULL,
  companyName VARCHAR(255) NOT NULL,
  positionTitle VARCHAR(255) NOT NULL,
  startDate DATE NOT NULL,
  endDate DATE NOT NULL,
  submittedDate DATE NOT NULL,
  status ENUM('submitted', 'underReview', 'approved', 'rejected', 'changesRequested') NOT NULL DEFAULT 'submitted',
  coordinatorComment TEXT NULL,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Safely alter column if table already exists
ALTER TABLE applications MODIFY COLUMN status ENUM('submitted', 'underReview', 'approved', 'rejected', 'changesRequested') NOT NULL DEFAULT 'submitted';

-- Seed users safely
INSERT INTO users (id, username, password, role)
VALUES 
  (1, 'student1', 'student123', 'student'),
  (2, 'student2', 'student123', 'student'),
  (3, 'coordinator1', 'coord123', 'coordinator')
ON DUPLICATE KEY UPDATE 
  username = VALUES(username),
  password = VALUES(password),
  role = VALUES(role);

-- Seed application safely
INSERT INTO applications (id, student_id, studentName, companyName, positionTitle, startDate, endDate, submittedDate, status, coordinatorComment)
VALUES
  (1, 1, 'Student One', 'Google', 'Software Engineer Intern', '2026-10-01', '2027-04-01', '2026-07-08', 'submitted', NULL),
  (2, 2, 'Student Two', 'Meta', 'Frontend Developer Intern', '2026-11-01', '2027-05-01', '2026-07-07', 'approved', 'Perfect candidate portfolio, approved.')
ON DUPLICATE KEY UPDATE
  student_id = VALUES(student_id),
  studentName = VALUES(studentName),
  companyName = VALUES(companyName),
  positionTitle = VALUES(positionTitle),
  startDate = VALUES(startDate),
  endDate = VALUES(endDate),
  submittedDate = VALUES(submittedDate),
  status = VALUES(status),
  coordinatorComment = VALUES(coordinatorComment);
