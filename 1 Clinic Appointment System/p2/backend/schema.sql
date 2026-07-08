CREATE DATABASE IF NOT EXISTS clinic_db;
USE clinic_db;

CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    role ENUM('receptionist', 'doctor') NOT NULL,
    session_token VARCHAR(255) NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS appointments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    patient_name VARCHAR(100) NOT NULL,
    patient_phone VARCHAR(20) NOT NULL,
    doctor_name VARCHAR(100) NOT NULL,
    appointment_date DATE NOT NULL,
    appointment_time TIME NOT NULL,
    reason TEXT NOT NULL,
    status ENUM('pending', 'confirmed', 'completed', 'cancelled') NOT NULL DEFAULT 'pending',
    visit_note TEXT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Seed basic test data
INSERT INTO users (username, password, role) VALUES
('receptionist1', 'password123', 'receptionist'),
('dr_smith', 'smith456', 'doctor'),
('dr_adams', 'adams789', 'doctor');

INSERT INTO appointments (patient_name, patient_phone, doctor_name, appointment_date, appointment_time, reason, status, visit_note) VALUES
('John Doe', '555-0199', 'Dr. Smith', '2026-06-10', '09:30:00', 'Routine checkup', 'pending', NULL),
('Jane Doe', '555-0188', 'Dr. Adams', '2026-06-10', '10:30:00', 'Follow-up consultation', 'pending', NULL),
('Bob Johnson', '555-0177', 'Dr. Smith', '2026-06-09', '14:00:00', 'Back pain evaluation', 'completed', 'Patient has mild muscle strain. Prescribed physical therapy and rest.');
