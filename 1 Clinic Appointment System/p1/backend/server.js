const express = require('express');
const cors = require('cors');
const mysql = require('mysql2');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Database pool setup
const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '3306'),
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'c1p1',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// Check database connection status on startup
pool.getConnection((err, connection) => {
  if (err) {
    console.error('Database connection failed:', err.message);
  } else {
    console.log(`Successfully connected to MySQL database: ${process.env.DB_NAME || 'c1p1'}`);
    connection.release();
  }
});

// Basic health check route
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Clinic Appointment System API is running' });
});

// Login Endpoint
app.post('/api/login', (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password are required' });
  }

  const query = 'SELECT username, role, doctor_name FROM users WHERE username = ? AND password = ?';
  pool.query(query, [username, password], (err, results) => {
    if (err) {
      console.error('Login database query failed:', err);
      return res.status(500).json({ error: 'Server database error' });
    }

    if (results.length === 0) {
      return res.status(401).json({ error: 'Invalid username or password' });
    }

    res.json({ user: results[0] });
  });
});

// Server-side Authentication & Role Verification Middleware
const authenticateUser = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return res.status(401).json({ error: 'Access denied. No authorization header provided.' });
  }

  const username = authHeader;

  const query = 'SELECT username, role, doctor_name FROM users WHERE username = ?';
  pool.query(query, [username], (err, results) => {
    if (err || results.length === 0) {
      return res.status(401).json({ error: 'Access denied. Invalid session or user.' });
    }

    req.user = results[0];
    next();
  });
};

// Helper: check if a doctor is already double-booked (conflicts only apply to Confirmed or Completed slots)
const isDoubleBooked = (doctor_name, appointment_date, appointment_time, excludeId = null) => {
  return new Promise((resolve, reject) => {
    let query = `
      SELECT id FROM appointments 
      WHERE doctor_name = ? AND appointment_date = ? AND appointment_time = ? AND status IN ('Confirmed', 'Completed')
    `;
    const params = [doctor_name, appointment_date, appointment_time];
    if (excludeId) {
      query += ' AND id != ?';
      params.push(excludeId);
    }
    pool.query(query, params, (err, results) => {
      if (err) return reject(err);
      resolve(results.length > 0);
    });
  });
};

// Get appointments (doctors only see their own, receptionists see all)
app.get('/api/appointments', authenticateUser, (req, res) => {
  let query = 'SELECT * FROM appointments';
  const params = [];

  if (req.user.role === 'doctor') {
    query += ' WHERE doctor_name = ?';
    params.push(req.user.doctor_name);
  }

  query += ' ORDER BY appointment_date ASC, appointment_time ASC';

  pool.query(query, params, (err, results) => {
    if (err) {
      console.error('Error fetching appointments:', err);
      return res.status(500).json({ error: 'Database query failed' });
    }
    res.json(results);
  });
});

// Create a new appointment (receptionist only) - defaults to Pending
app.post('/api/appointments', authenticateUser, async (req, res) => {
  if (req.user.role !== 'receptionist') {
    return res.status(403).json({ error: 'Forbidden. Only receptionists can book appointments.' });
  }

  const { patient_name, contact_number, doctor_name, appointment_date, appointment_time, reason } = req.body;

  if (!patient_name || !contact_number || !doctor_name || !appointment_date || !appointment_time || !reason) {
    return res.status(400).json({ error: 'All fields are required.' });
  }

  // 1. Validate Date: Must not be in the past
  const todayStr = new Date().toLocaleDateString('en-CA');
  const formattedInputDate = new Date(appointment_date).toLocaleDateString('en-CA');
  if (formattedInputDate < todayStr) {
    return res.status(400).json({ error: 'Cannot book appointments in the past.' });
  }

  // 2. Validate Contact Number format
  const phoneRegex = /^[0-9+\-\s()]{7,15}$/;
  if (!phoneRegex.test(contact_number)) {
    return res.status(400).json({ error: 'Contact number must be a valid phone number (7-15 digits/characters).' });
  }

  // Insert appointment as Pending.
  const query = `
    INSERT INTO appointments 
    (patient_name, contact_number, doctor_name, appointment_date, appointment_time, reason, status) 
    VALUES (?, ?, ?, ?, ?, ?, 'Pending')
  `;

  pool.query(
    query,
    [patient_name, contact_number, doctor_name, formattedInputDate, appointment_time, reason],
    (err, result) => {
      if (err) {
        console.error('Error saving appointment:', err);
        return res.status(500).json({ error: 'Database save failed.' });
      }
      res.status(201).json({
        id: result.insertId,
        patient_name,
        contact_number,
        doctor_name,
        appointment_date: formattedInputDate,
        appointment_time,
        reason,
        status: 'Pending',
        visit_note: null
      });
    }
  );
});

// Update appointment details or status (receptionist only) - locks completed/confirmed/cancelled
app.put('/api/appointments/:id', authenticateUser, (req, res) => {
  if (req.user.role !== 'receptionist') {
    return res.status(403).json({ error: 'Forbidden. Only receptionists can modify appointment details.' });
  }

  const { id } = req.params;
  const { patient_name, contact_number, doctor_name, appointment_date, appointment_time, reason, status } = req.body;

  if (!patient_name || !contact_number || !doctor_name || !appointment_date || !appointment_time || !reason || !status) {
    return res.status(400).json({ error: 'All fields are required.' });
  }

  pool.query('SELECT status FROM appointments WHERE id = ?', [id], async (err, results) => {
    if (err || results.length === 0) {
      return res.status(404).json({ error: 'Appointment not found.' });
    }

    const currentStatus = results[0].status;

    // Confirmed, Completed, and Cancelled appointments are locked from details modification by receptionist.
    if (currentStatus === 'Completed' || currentStatus === 'Confirmed' || currentStatus === 'Cancelled') {
      return res.status(400).json({ error: 'Confirmed, Completed, or Cancelled appointments cannot be modified.' });
    }

    // Validate Date: Must not be in the past
    const todayStr = new Date().toLocaleDateString('en-CA');
    const formattedInputDate = new Date(appointment_date).toLocaleDateString('en-CA');
    if (formattedInputDate < todayStr && status !== 'Cancelled') {
      return res.status(400).json({ error: 'Cannot set appointment date in the past.' });
    }

    // Validate Contact Number
    const phoneRegex = /^[0-9+\-\s()]{7,15}$/;
    if (!phoneRegex.test(contact_number)) {
      return res.status(400).json({ error: 'Contact number must be a valid phone number (7-15 digits/characters).' });
    }

    const query = `
      UPDATE appointments 
      SET patient_name = ?, contact_number = ?, doctor_name = ?, appointment_date = ?, appointment_time = ?, reason = ?, status = ?
      WHERE id = ?
    `;

    pool.query(
      query,
      [patient_name, contact_number, doctor_name, formattedInputDate, appointment_time, reason, status, id],
      (err, result) => {
        if (err) {
          console.error('Error updating appointment:', err);
          return res.status(500).json({ error: 'Database update failed.' });
        }
        res.json({ message: 'Appointment updated successfully.' });
      }
    );
  });
});

// Doctor Status Update Endpoint (Accept/Confirm or Reject) - doctor only, for their own appointments
app.put('/api/appointments/:id/status', authenticateUser, (req, res) => {
  if (req.user.role !== 'doctor') {
    return res.status(403).json({ error: 'Forbidden. Only doctors can accept or reject appointments.' });
  }

  const { id } = req.params;
  const { status } = req.body;

  if (status !== 'Confirmed' && status !== 'Rejected') {
    return res.status(400).json({ error: 'Invalid status. Can only set status to Confirmed or Rejected.' });
  }

  pool.query('SELECT status, doctor_name, appointment_date, appointment_time FROM appointments WHERE id = ?', [id], async (err, results) => {
    if (err || results.length === 0) {
      return res.status(404).json({ error: 'Appointment not found.' });
    }

    const appointment = results[0];

    // Verify ownership
    if (appointment.doctor_name !== req.user.doctor_name) {
      return res.status(403).json({ error: 'Forbidden. This appointment is assigned to another doctor.' });
    }

    // Verify it is currently Pending
    if (appointment.status !== 'Pending') {
      return res.status(400).json({ error: 'Can only accept or reject Pending appointments.' });
    }

    try {
      // If accepting, enforce double-booking conflict checks
      if (status === 'Confirmed') {
        const formattedDate = new Date(appointment.appointment_date).toLocaleDateString('en-CA');
        const conflicted = await isDoubleBooked(appointment.doctor_name, formattedDate, appointment.appointment_time);
        if (conflicted) {
          return res.status(409).json({ error: `Conflict. You are already booked at ${appointment.appointment_time} on this date.` });
        }
      }

      const query = 'UPDATE appointments SET status = ? WHERE id = ?';
      pool.query(query, [status, id], (err, result) => {
        if (err) {
          console.error('Error updating appointment status:', err);
          return res.status(500).json({ error: 'Database update failed.' });
        }
        res.json({ message: `Appointment successfully ${status.toLowerCase()}.` });
      });
    } catch (conflictError) {
      console.error('Database query conflict check failed:', conflictError);
      res.status(500).json({ error: 'Server conflict validation check failed.' });
    }
  });
});

// Update doctor visit notes (doctors only, for their own CONFIRMED appointments)
app.put('/api/appointments/:id/notes', authenticateUser, (req, res) => {
  if (req.user.role !== 'doctor') {
    return res.status(403).json({ error: 'Forbidden. Only doctors can write visit notes.' });
  }

  const { id } = req.params;
  const { visit_note } = req.body;

  if (visit_note === undefined) {
    return res.status(400).json({ error: 'Visit note is required.' });
  }

  pool.query('SELECT status, doctor_name FROM appointments WHERE id = ?', [id], (err, results) => {
    if (err || results.length === 0) {
      return res.status(404).json({ error: 'Appointment not found.' });
    }

    const appointment = results[0];

    // Verify ownership
    if (appointment.doctor_name !== req.user.doctor_name) {
      return res.status(403).json({ error: 'Forbidden. This appointment is assigned to another doctor.' });
    }

    // Notes can only be added to Confirmed or Completed appointments.
    if (appointment.status !== 'Confirmed' && appointment.status !== 'Completed') {
      return res.status(400).json({ error: 'Cannot write clinical notes on Pending, Rejected, or Cancelled appointments.' });
    }

    const query = `
      UPDATE appointments 
      SET visit_note = ?, status = 'Completed'
      WHERE id = ? AND doctor_name = ?
    `;

    pool.query(
      query,
      [visit_note, id, req.user.doctor_name],
      (err, result) => {
        if (err) {
          console.error('Error updating visit note:', err);
          return res.status(500).json({ error: 'Database update failed.' });
        }
        res.json({ message: 'Visit note updated and appointment completed successfully.' });
      }
    );
  });
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
