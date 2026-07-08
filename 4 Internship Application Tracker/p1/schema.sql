CREATE DATABASE IF NOT EXISTS internship_tracker;
USE internship_tracker;

CREATE TABLE IF NOT EXISTS applications (
  id INT AUTO_INCREMENT PRIMARY KEY,
  student_name VARCHAR(255) NOT NULL,
  company_name VARCHAR(255) NOT NULL,
  position_title VARCHAR(255) NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  submitted_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  status ENUM('submitted', 'under_review', 'approved', 'rejected') DEFAULT 'submitted',
  coordinator_comments TEXT
);
