const express = require('express');
const cors = require('cors');
const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5001;
const JWT_SECRET = process.env.JWT_SECRET || 'supersecretkeyformaintenanceapp';

app.use(cors());
app.use(express.json());

// Setup database pool
const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'c7p1',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// Middleware to authenticate JWT
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid or expired token' });
    }
    req.user = user;
    next();
  });
};

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Maintenance Request Tracker API is running' });
});

// User Login Endpoint
app.post('/api/auth/login', async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password are required' });
  }

  try {
    const [rows] = await pool.query('SELECT * FROM users WHERE username = ?', [username]);
    if (rows.length === 0) {
      return res.status(401).json({ error: 'Invalid username or password' });
    }

    const user = rows[0];
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Invalid username or password' });
    }

    const token = jwt.sign(
      { id: user.id, username: user.username, role: user.role },
      JWT_SECRET,
      { expiresIn: '2h' }
    );

    res.json({
      token,
      user: {
        id: user.id,
        username: user.username,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Fetch request statistics (Secure: logged in users only)
app.get('/api/requests/stats', authenticateToken, async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN status = 'Open' THEN 1 ELSE 0 END) as open,
        SUM(CASE WHEN status = 'In Progress' THEN 1 ELSE 0 END) as inProgress,
        SUM(CASE WHEN status = 'Closed' THEN 1 ELSE 0 END) as closed
      FROM requests
    `);
    res.json({
      total: rows[0].total || 0,
      open: rows[0].open || 0,
      inProgress: rows[0].inProgress || 0,
      closed: rows[0].closed || 0
    });
  } catch (error) {
    console.error('Error fetching request stats:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Fetch all requests (Secure: logged in users only)
app.get('/api/requests', authenticateToken, async (req, res) => {
  const { status, priority, location } = req.query;

  try {
    let query = 'SELECT * FROM requests';
    const conditions = [];
    const params = [];

    if (status && status !== 'All') {
      conditions.push('status = ?');
      params.push(status);
    }
    if (priority && priority !== 'All') {
      conditions.push('priority = ?');
      params.push(priority);
    }
    if (location && location.trim() !== '') {
      conditions.push('location LIKE ?');
      params.push(`%${location}%`);
    }

    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }

    query += ' ORDER BY created_at DESC';

    const [rows] = await pool.query(query, params);
    res.json(rows);
  } catch (error) {
    console.error('Error fetching requests:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Create a new request (Secure: Requesters only)
app.post('/api/requests', authenticateToken, async (req, res) => {
  // Enforce server-side role check
  if (req.user.role !== 'requester') {
    return res.status(403).json({ error: 'Forbidden: Only requesters are authorized to submit new requests' });
  }

  let { title, description, location, priority, requester_name } = req.body;

  // Trim inputs
  title = title?.trim();
  description = description?.trim();
  location = location?.trim();
  requester_name = requester_name?.trim();

  // Basic validation
  if (!title || !description || !location || !priority || !requester_name) {
    return res.status(400).json({ error: 'All fields are required and cannot be empty' });
  }

  // Value bounds check
  if (!['Low', 'Medium', 'High'].includes(priority)) {
    return res.status(400).json({ error: 'Invalid priority level' });
  }

  const is_urgent = priority === 'High' ? 1 : 0;

  try {
    const query = `
      INSERT INTO requests (title, description, location, priority, requester_name, status, is_urgent)
      VALUES (?, ?, ?, ?, ?, 'Open', ?)
    `;
    const [result] = await pool.query(query, [
      title,
      description,
      location,
      priority,
      requester_name,
      is_urgent
    ]);

    const [newRequestRows] = await pool.query('SELECT * FROM requests WHERE id = ?', [result.insertId]);
    res.status(201).json(newRequestRows[0]);
  } catch (error) {
    console.error('Error creating request:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Update a request (Secure: Technician only)
app.put('/api/requests/:id', authenticateToken, async (req, res) => {
  const { id } = req.params;
  const { status, technician_notes } = req.body;

  // Enforce server-side role check
  if (req.user.role !== 'technician') {
    return res.status(403).json({ error: 'Forbidden: Only technicians are authorized to update requests' });
  }

  // Validation
  if (status && !['Open', 'In Progress', 'Closed'].includes(status)) {
    return res.status(400).json({ error: 'Invalid status value' });
  }

  try {
    // Check if request exists
    const [existing] = await pool.query('SELECT * FROM requests WHERE id = ?', [id]);
    if (existing.length === 0) {
      return res.status(404).json({ error: 'Request not found' });
    }

    const currentRequest = existing[0];

    // Lock closed tickets: Reject modifications if status is already 'Closed'
    if (currentRequest.status === 'Closed') {
      return res.status(400).json({ error: 'Bad Request: Cannot modify a request that has already been Closed' });
    }

    // Enforce note validation when closing urgent requests
    const targetStatus = status || currentRequest.status;
    if (targetStatus === 'Closed' && (currentRequest.priority === 'High' || currentRequest.is_urgent === 1)) {
      const mergedNotes = technician_notes !== undefined ? technician_notes : currentRequest.technician_notes;
      if (!mergedNotes || mergedNotes.trim() === '') {
        return res.status(400).json({ error: 'Urgent requests cannot be closed without technician notes' });
      }
    }

    // Build dynamic update
    const updateFields = [];
    const queryParams = [];

    if (status !== undefined) {
      updateFields.push('status = ?');
      queryParams.push(status);
    }
    if (technician_notes !== undefined) {
      updateFields.push('technician_notes = ?');
      queryParams.push(technician_notes);
    }

    if (updateFields.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    queryParams.push(id);
    const updateQuery = `
      UPDATE requests 
      SET ${updateFields.join(', ')} 
      WHERE id = ?
    `;

    await pool.query(updateQuery, queryParams);

    const [updatedRows] = await pool.query('SELECT * FROM requests WHERE id = ?', [id]);
    res.json(updatedRows[0]);
  } catch (error) {
    console.error('Error updating request:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
