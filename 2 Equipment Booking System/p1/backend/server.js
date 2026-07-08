const express = require('express');
const cors = require('cors');
const crypto = require('crypto');
const db = require('./db');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Authentication Middleware
const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({ error: 'Authentication token required' });
    }

    const query = `
      SELECT u.id, u.username, u.role 
      FROM sessions s
      JOIN users u ON s.user_id = u.id 
      WHERE s.token = ?
    `;
    const [rows] = await db.query(query, [token]);

    if (rows.length === 0) {
      return res.status(401).json({ error: 'Invalid or expired session token' });
    }

    // Attach user information to request
    req.user = {
      id: rows[0].id,
      username: rows[0].username,
      role: rows[0].role
    };
    next();
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error during authentication' });
  }
};

// Login Route
app.post('/api/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password are required' });
    }

    const [users] = await db.query('SELECT * FROM users WHERE username = ? AND password = ?', [username, password]);
    if (users.length === 0) {
      return res.status(401).json({ error: 'Invalid username or password' });
    }

    const user = users[0];
    const token = crypto.randomBytes(32).toString('hex');

    // Save session in database
    await db.query('INSERT INTO sessions (token, user_id) VALUES (?, ?)', [token, user.id]);

    res.json({
      token,
      user: {
        username: user.username,
        role: user.role
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Database error during login' });
  }
});

// Logout Route
app.post('/api/logout', async (req, res) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (token) {
      await db.query('DELETE FROM sessions WHERE token = ?', [token]);
    }
    res.json({ message: 'Logged out successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Database error during logout' });
  }
});

// Helper to validate booking date, times, and prevent overlapping approved bookings
async function checkBookingConstraints({ id, equipment_name, booking_date, start_time, end_time }) {
  const today = new Date().toISOString().split('T')[0];
  if (booking_date < today) {
    return 'Booking date cannot be in the past.';
  }

  if (start_time >= end_time) {
    return 'End time must be after start time.';
  }

  const overlapQuery = `
    SELECT id FROM bookings 
    WHERE equipment_name = ? 
      AND booking_date = ? 
      AND status = 'Approved'
      AND start_time < ? 
      AND end_time > ?
      ${id ? 'AND id != ?' : ''}
  `;
  const queryParams = [equipment_name, booking_date, end_time, start_time];
  if (id) queryParams.push(id);

  const [overlaps] = await db.query(overlapQuery, queryParams);
  if (overlaps.length > 0) {
    return 'This equipment is already booked/approved for the selected time range.';
  }

  return null;
}

// GET /api/bookings (Protected)
app.get('/api/bookings', authenticateToken, async (req, res) => {
  try {
    const { equipment, date, status, user } = req.query;
    let query = 'SELECT * FROM bookings WHERE 1=1';
    const params = [];
    
    // Server-side enforcement: Staff can ONLY see their own bookings
    if (req.user.role === 'Staff') {
      query += ' AND requested_user = ?';
      params.push(req.user.username);
    } else if (req.user.role === 'Lab Assistant') {
      // Lab assistant can optionally filter by user, otherwise sees all
      if (user) {
        query += ' AND requested_user = ?';
        params.push(user);
      }
    }
    
    if (equipment) {
      query += ' AND equipment_name LIKE ?';
      params.push(`%${equipment}%`);
    }
    if (date) {
      query += ' AND booking_date = ?';
      params.push(date);
    }
    if (status) {
      query += ' AND status = ?';
      params.push(status);
    }
    
    query += ' ORDER BY created_at DESC';
    
    const [rows] = await db.query(query, params);
    res.json(rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Database error fetching bookings' });
  }
});

// POST /api/bookings (Protected - Staff Only)
app.post('/api/bookings', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'Staff') {
      return res.status(403).json({ error: 'Only Staff members can request equipment bookings' });
    }

    const { equipment_name, booking_date, start_time, end_time, purpose } = req.body;
    if (!equipment_name || !booking_date || !start_time || !end_time || !purpose) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    // Run constraint checks
    const constraintError = await checkBookingConstraints({
      equipment_name,
      booking_date,
      start_time,
      end_time
    });
    if (constraintError) {
      return res.status(400).json({ error: constraintError });
    }
    
    const query = `
      INSERT INTO bookings (equipment_name, requested_user, booking_date, start_time, end_time, purpose, status)
      VALUES (?, ?, ?, ?, ?, ?, 'Pending')
    `;
    // Set requested_user strictly from req.user.username (server decides)
    const [result] = await db.query(query, [
      equipment_name, 
      req.user.username, 
      booking_date, 
      start_time, 
      end_time, 
      purpose
    ]);
    
    res.status(201).json({ id: result.insertId, message: 'Booking requested successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Database error creating booking' });
  }
});

// PUT /api/bookings/:id (Protected - Owner Staff Only)
app.put('/api/bookings/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { equipment_name, booking_date, start_time, end_time, purpose } = req.body;
    
    if (!equipment_name || !booking_date || !start_time || !end_time || !purpose) {
      return res.status(400).json({ error: 'All fields are required' });
    }
    
    // Check ownership and status
    const [rows] = await db.query('SELECT requested_user, status FROM bookings WHERE id = ?', [id]);
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Booking not found' });
    }
    
    const booking = rows[0];
    if (booking.requested_user !== req.user.username) {
      return res.status(403).json({ error: 'You are not authorized to update this booking' });
    }
    if (booking.status !== 'Pending') {
      return res.status(400).json({ error: 'Only pending bookings can be edited' });
    }

    // Run constraint checks
    const constraintError = await checkBookingConstraints({
      id,
      equipment_name,
      booking_date,
      start_time,
      end_time
    });
    if (constraintError) {
      return res.status(400).json({ error: constraintError });
    }
    
    const query = `
      UPDATE bookings 
      SET equipment_name = ?, booking_date = ?, start_time = ?, end_time = ?, purpose = ?
      WHERE id = ?
    `;
    await db.query(query, [equipment_name, booking_date, start_time, end_time, purpose, id]);
    
    res.json({ message: 'Booking request updated successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Database error updating booking details' });
  }
});

// PUT /api/bookings/:id/status (Protected - Lab Assistant Only)
app.put('/api/bookings/:id/status', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'Lab Assistant') {
      return res.status(403).json({ error: 'Only Lab Assistants can approve or reject bookings' });
    }

    const { id } = req.params;
    const { status, assistant_comment } = req.body;
    
    if (!status || !['Approved', 'Rejected', 'Collected', 'Returned'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status update' });
    }
    
    let query;
    let params;

    if (['Approved', 'Rejected'].includes(status)) {
      if (assistant_comment === undefined || assistant_comment === null || assistant_comment.trim() === '') {
        return res.status(400).json({ error: 'Assistant comment is required' });
      }
      query = 'UPDATE bookings SET status = ?, assistant_comment = ? WHERE id = ?';
      params = [status, assistant_comment, id];
    } else {
      // For Collected or Returned, assistant_comment is optional
      if (assistant_comment !== undefined && assistant_comment !== null && assistant_comment.trim() !== '') {
        query = 'UPDATE bookings SET status = ?, assistant_comment = ? WHERE id = ?';
        params = [status, assistant_comment, id];
      } else {
        query = 'UPDATE bookings SET status = ? WHERE id = ?';
        params = [status, id];
      }
    }
    
    const [result] = await db.query(query, params);
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Booking not found' });
    }
    
    res.json({ message: `Booking has been marked as ${status.toLowerCase()} successfully` });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Database error updating booking status' });
  }
});

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Backend server is running with MySQL connection pool & Authentication' });
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
