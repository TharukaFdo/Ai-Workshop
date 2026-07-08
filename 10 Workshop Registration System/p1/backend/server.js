require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mysql = require('mysql2/promise');

const app = express();
const PORT = process.env.PORT || 5005;

// Global Middleware
app.use(cors());
app.use(express.json());

/**
 * Database Connection Pool
 * Set up connection configuration resiliently so that database startup errors
 * do not crash the Express server process.
 */
let pool;
try {
  pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '3306', 10),
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'c10p1',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
  });
  console.log('Database pool initialized.');
} catch (err) {
  console.error('Error creating database pool:', err.message);
}

// Authentication & Authorization Middleware
const authenticateUser = async (req, res, next) => {
  const userId = req.headers['x-user-id'];
  if (!userId) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  try {
    const [rows] = await pool.query('SELECT * FROM users WHERE id = ?', [userId]);
    if (rows.length === 0) {
      return res.status(401).json({ error: 'User not found' });
    }
    req.user = rows[0]; // { id, username, role }
    next();
  } catch (err) {
    console.error('Auth middleware error:', err);
    res.status(500).json({ error: 'Internal server authorization error' });
  }
};

// Login Route
app.post('/api/login', async (req, res) => {
  const { username, password } = req.req_body || req.body;
  if (!username || !password || typeof username !== 'string' || typeof password !== 'string') {
    return res.status(400).json({ error: 'Username and password must be valid strings' });
  }
  
  if (username.length > 50 || password.length > 50) {
    return res.status(400).json({ error: 'Username and password must not exceed 50 characters' });
  }

  try {
    const [rows] = await pool.query('SELECT id, username, role FROM users WHERE username = ? AND password = ?', [username, password]);
    if (rows.length === 0) {
      return res.status(401).json({ error: 'Invalid username or password' });
    }
    res.json({ user: rows[0] });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Internal server error during login' });
  }
});

// Get all registrations
app.get('/api/registrations', authenticateUser, async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM registrations ORDER BY created_at DESC');
    res.json(rows);
  } catch (err) {
    console.error('Error fetching registrations:', err);
    res.status(500).json({ error: 'Database error fetching registrations' });
  }
});

// Create new registration
app.post('/api/registrations', authenticateUser, async (req, res) => {
  const { name, email, workshop_title, registration_details } = req.req_body || req.body;
  
  if (!name || !email || !workshop_title) {
    return res.status(400).json({ error: 'Name, email, and workshop title are required fields' });
  }

  // Type and length validations
  if (typeof name !== 'string' || name.trim().length < 2 || name.length > 100) {
    return res.status(400).json({ error: 'Name must be a valid string between 2 and 100 characters' });
  }

  if (typeof email !== 'string' || email.length > 150) {
    return res.status(400).json({ error: 'Email must be a valid string under 150 characters' });
  }

  // Email format validation (Regex check)
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({ error: 'Invalid email format' });
  }

  // Workshop title constraint check
  const allowedWorkshops = [
    'React Basics for Beginners',
    'Building APIs with Express & Node.js',
    'Advanced Database Design with MySQL'
  ];
  if (!allowedWorkshops.includes(workshop_title)) {
    return res.status(400).json({ error: 'Selected workshop is invalid or not offered' });
  }

  if (registration_details && (typeof registration_details !== 'string' || registration_details.length > 1000)) {
    return res.status(400).json({ error: 'Registration details must not exceed 1000 characters' });
  }

  try {
    const [result] = await pool.query(
      'INSERT INTO registrations (name, email, workshop_title, registration_details) VALUES (?, ?, ?, ?)',
      [name.trim(), email.trim(), workshop_title, registration_details ? registration_details.trim() : '']
    );
    res.status(201).json({
      message: 'Registration submitted successfully',
      registrationId: result.insertId
    });
  } catch (err) {
    console.error('Error inserting registration:', err);
    res.status(500).json({ error: 'Database error saving registration' });
  }
});

// Update registration (status, attendance, organizer notes)
app.put('/api/registrations/:id', authenticateUser, async (req, res) => {
  if (req.user.role !== 'organizer') {
    return res.status(403).json({ error: 'Forbidden: Only organizers can perform this action' });
  }

  const { id } = req.params;
  
  // ID validation (must be positive integer)
  const numericId = parseInt(id, 10);
  if (isNaN(numericId) || numericId <= 0) {
    return res.status(400).json({ error: 'Invalid registration ID' });
  }

  const { status, attendance, organizer_notes } = req.req_body || req.body;

  // Validation
  const validStatuses = ['pending', 'confirmed', 'cancelled', 'waitlisted'];
  const validAttendance = ['present', 'absent', 'unmarked'];

  if (status && !validStatuses.includes(status)) {
    return res.status(400).json({ error: 'Invalid status value' });
  }
  if (attendance && !validAttendance.includes(attendance)) {
    return res.status(400).json({ error: 'Invalid attendance value' });
  }
  if (organizer_notes && (typeof organizer_notes !== 'string' || organizer_notes.length > 1000)) {
    return res.status(400).json({ error: 'Organizer notes must not exceed 1000 characters' });
  }

  try {
    // Build dynamic query depending on what's provided
    const updates = [];
    const values = [];

    if (status !== undefined) {
      updates.push('status = ?');
      values.push(status);
    }
    if (attendance !== undefined) {
      updates.push('attendance = ?');
      values.push(attendance);
    }
    if (organizer_notes !== undefined) {
      updates.push('organizer_notes = ?');
      values.push(organizer_notes);
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'No update fields provided' });
    }

    values.push(id);
    const query = `UPDATE registrations SET ${updates.join(', ')} WHERE id = ?`;
    
    const [result] = await pool.query(query, values);
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Registration record not found' });
    }

    res.json({ message: 'Registration updated successfully' });
  } catch (err) {
    console.error('Error updating registration:', err);
    res.status(500).json({ error: 'Database error updating registration' });
  }
});

// Health Check Route
app.get('/api/health', async (req, res) => {
  let dbStatus = 'disconnected';
  try {
    if (pool) {
      const connection = await pool.getConnection();
      connection.release();
      dbStatus = 'connected';
    }
  } catch (err) {
    dbStatus = `error: ${err.message}`;
  }

  res.json({
    status: 'ok',
    message: 'Backend server is running',
    timestamp: new Date(),
    database: dbStatus
  });
});

// Start Server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
