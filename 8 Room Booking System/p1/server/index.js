const express = require('express');
const cors = require('cors');
const db = require('./db');
require('dotenv').config();

const app = express();

app.use(cors());
app.use(express.json());

// API health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Room Booking API is running.' });
});

// Authentication / Login Endpoint
app.post('/api/login', async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password are required' });
  }

  try {
    const [rows] = await db.query('SELECT id, username, role FROM users WHERE username = ? AND password = ?', [username, password]);
    if (rows.length === 0) {
      return res.status(401).json({ error: 'Invalid username or password' });
    }

    res.json({ user: rows[0] });
  } catch (error) {
    console.error('Error logging in:', error);
    res.status(500).json({ error: 'Server authentication failed' });
  }
});

// GET bookings
app.get('/api/bookings', async (req, res) => {
  const { userId } = req.query;

  if (!userId) {
    return res.status(401).json({ error: 'User must be authenticated' });
  }

  try {
    const [userRows] = await db.query('SELECT username, role FROM users WHERE id = ?', [userId]);
    if (userRows.length === 0) {
      return res.status(403).json({ error: 'Invalid user credentials' });
    }

    const { username, role } = userRows[0];
    let query = 'SELECT * FROM bookings';
    let params = [];

    if (role === 'staff') {
      query += ' WHERE staff_name = ?';
      params.push(username);
    }
    
    query += ' ORDER BY booking_date DESC, start_time DESC';
    const [rows] = await db.query(query, params);
    res.json(rows);
  } catch (error) {
    console.error('Error fetching bookings:', error);
    res.status(500).json({ error: 'Database query failed' });
  }
});

// POST a new booking with Input Validation and Double-Booking Check
app.post('/api/bookings', async (req, res) => {
  const { userId, room_name, booking_date, start_time, end_time, purpose } = req.body;

  if (!userId || !room_name || !booking_date || !start_time || !end_time || !purpose) {
    return res.status(400).json({ error: 'All fields are required' });
  }

  // 1. Validate times
  if (start_time >= end_time) {
    return res.status(400).json({ error: 'Start time must be before end time.' });
  }

  try {
    const [userRows] = await db.query('SELECT username, role FROM users WHERE id = ?', [userId]);
    if (userRows.length === 0) {
      return res.status(403).json({ error: 'Invalid user credentials' });
    }

    const { username } = userRows[0];

    // 2. Prevent Double Booking Conflict Check:
    // Check if there is an approved booking for the same room, on the same date,
    // where the times overlap: (start_time < existing_end_time) AND (end_time > existing_start_time).
    const conflictQuery = `
      SELECT id FROM bookings 
      WHERE room_name = ? 
        AND booking_date = ? 
        AND status = 'approved'
        AND start_time < ? 
        AND end_time > ?
    `;
    const [conflicts] = await db.query(conflictQuery, [room_name, booking_date, end_time, start_time]);
    
    if (conflicts.length > 0) {
      return res.status(409).json({ error: 'Time conflict! The room is already booked and approved during this interval.' });
    }

    const query = `
      INSERT INTO bookings (room_name, booking_date, start_time, end_time, purpose, staff_name, status)
      VALUES (?, ?, ?, ?, ?, ?, 'pending')
    `;
    const [result] = await db.query(query, [room_name, booking_date, start_time, end_time, purpose, username]);
    res.status(201).json({ message: 'Booking created successfully', bookingId: result.insertId });
  } catch (error) {
    console.error('Error creating booking:', error);
    res.status(500).json({ error: 'Database insert failed' });
  }
});

// PUT update booking status (Coordinator only)
app.put('/api/bookings/:id/status', async (req, res) => {
  const { id } = req.params;
  const { status, notes, userId } = req.body;

  if (!userId) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  if (!status || !['pending', 'approved', 'rejected'].includes(status)) {
    return res.status(400).json({ error: 'Valid status is required' });
  }

  try {
    const [userRows] = await db.query('SELECT role FROM users WHERE id = ?', [userId]);
    if (userRows.length === 0) {
      return res.status(403).json({ error: 'Invalid user credentials' });
    }

    const userRole = userRows[0].role;

    if (userRole !== 'coordinator') {
      return res.status(403).json({ error: 'Access denied. Only coordinators can update booking status.' });
    }

    // If approving, make sure it doesn't conflict with another ALREADY approved booking
    if (status === 'approved') {
      // Get target booking details
      const [bookingRows] = await db.query('SELECT room_name, booking_date, start_time, end_time FROM bookings WHERE id = ?', [id]);
      if (bookingRows.length === 0) {
        return res.status(404).json({ error: 'Booking not found' });
      }

      const { room_name, booking_date, start_time, end_time } = bookingRows[0];

      // Check conflicts, ignoring the current request itself
      const conflictQuery = `
        SELECT id FROM bookings 
        WHERE room_name = ? 
          AND booking_date = ? 
          AND status = 'approved'
          AND id != ?
          AND start_time < ? 
          AND end_time > ?
      `;
      const [conflicts] = await db.query(conflictQuery, [room_name, booking_date, id, end_time, start_time]);
      
      if (conflicts.length > 0) {
        return res.status(409).json({ error: 'Conflict! Cannot approve booking due to another approved schedule.' });
      }
    }

    const query = 'UPDATE bookings SET status = ?, notes = ? WHERE id = ?';
    const [result] = await db.query(query, [status, notes || null, id]);
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    res.json({ message: 'Booking updated successfully' });
  } catch (error) {
    console.error('Error updating booking status:', error);
    res.status(500).json({ error: 'Database update failed' });
  }
});

if (require.main === module) {
  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
  });
}

module.exports = app;
