const express = require('express');
const cors = require('cors');
require('dotenv').config();
const db = require('./db');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Basic health check route
app.get('/api/health', async (req, res) => {
  try {
    // Check database connection
    await db.query('SELECT 1');
    res.json({
      status: 'OK',
      message: 'Server is healthy',
      database: 'Connected'
    });
  } catch (error) {
    res.status(500).json({
      status: 'ERROR',
      message: 'Server running, but database connection failed',
      error: error.message
    });
  }
});

// Authentication Middleware - loads user from Database, securing role definition on server side
const authenticateUser = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).json({ error: 'Authentication required. Please log in.' });
  }

  try {
    const [rows] = await db.query(
      'SELECT id, username, display_name, role FROM users WHERE username = ?',
      [authHeader]
    );

    if (rows.length === 0) {
      return res.status(401).json({ error: 'Session invalid. Please log in again.' });
    }

    req.user = rows[0]; // Set verified user object containing role from database
    next();
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// POST login endpoint (Authenticates credentials against MySQL)
app.post('/api/login', async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password are required' });
  }

  try {
    const [rows] = await db.query(
      'SELECT id, username, display_name, role FROM users WHERE username = ? AND password = ?',
      [username, password]
    );

    if (rows.length === 0) {
      return res.status(401).json({ error: 'Invalid username or password' });
    }

    res.json(rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET all requests (Secured with DB user verification)
app.get('/api/requests', authenticateUser, async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM requests ORDER BY created_at DESC');
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST a new request (Server validates role matches 'staff' and resolves requester name from DB)
app.post('/api/requests', authenticateUser, async (req, res) => {
  const { item_name, quantity, reason, requested_date } = req.body;

  if (req.user.role !== 'staff') {
    return res.status(403).json({ error: 'Only staff members can create inventory requests.' });
  }
  
  if (!item_name || quantity === undefined || !reason || !requested_date) {
    return res.status(400).json({ error: 'All fields are required' });
  }

  // Security bounds & length validations
  const parsedQty = parseInt(quantity);
  if (isNaN(parsedQty) || parsedQty <= 0) {
    return res.status(400).json({ error: 'Quantity must be a positive integer greater than 0.' });
  }

  if (item_name.trim().length === 0 || item_name.length > 100) {
    return res.status(400).json({ error: 'Item name must be between 1 and 100 characters.' });
  }

  if (reason.trim().length === 0 || reason.length > 500) {
    return res.status(400).json({ error: 'Reason must be between 1 and 500 characters.' });
  }

  if (isNaN(Date.parse(requested_date))) {
    return res.status(400).json({ error: 'Please provide a valid requested date.' });
  }
  
  try {
    const requester_name = req.user.display_name; // Decide requester name on the server
    const [result] = await db.query(
      'INSERT INTO requests (item_name, quantity, reason, requested_date, requester_name, status) VALUES (?, ?, ?, ?, ?, ?)',
      [item_name.trim(), parsedQty, reason.trim(), requested_date, requester_name, 'pending']
    );
    res.status(201).json({
      id: result.insertId,
      item_name: item_name.trim(),
      quantity: parsedQty,
      reason: reason.trim(),
      requested_date,
      requester_name,
      status: 'pending',
      storekeeper_note: null
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// PUT update status (Server checks DB for storekeeper permissions and self-approval prevention)
app.put('/api/requests/:id/status', authenticateUser, async (req, res) => {
  const { id } = req.params;
  const { status, storekeeper_note, issued_quantity } = req.body;

  const validStatuses = ['approved', 'rejected', 'issued'];
  if (!status || !validStatuses.includes(status)) {
    return res.status(400).json({ error: 'Valid status parameter is required (approved, rejected, or issued).' });
  }

  // 1. Server decides what each logged-in person is allowed to do
  if (req.user.role !== 'storekeeper') {
    return res.status(403).json({ error: 'Only storekeepers can approve, reject, or issue requests.' });
  }

  if (storekeeper_note && storekeeper_note.length > 500) {
    return res.status(400).json({ error: 'Storekeeper note cannot exceed 500 characters.' });
  }

  try {
    const [rows] = await db.query('SELECT * FROM requests WHERE id = ?', [id]);
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Request not found' });
    }

    const request = rows[0];

    // Enforce strict request status state transitions
    if (request.status === 'rejected' || request.status === 'issued') {
      return res.status(400).json({ error: `Cannot change status. Request is already in terminal status "${request.status}".` });
    }

    if (request.status === 'pending' && status === 'issued') {
      return res.status(400).json({ error: 'Cannot issue an item that has not been approved first.' });
    }

    if (request.status === 'approved' && (status === 'approved' || status === 'rejected')) {
      return res.status(400).json({ error: `Cannot set status to "${status}". Request has already been approved.` });
    }

    // 2. Prevent storekeeper from approving or issuing their own requests
    if (request.requester_name.toLowerCase() === req.user.display_name.toLowerCase()) {
      if (status === 'approved' || status === 'issued') {
        return res.status(403).json({ error: 'You cannot approve or issue your own requests.' });
      }
    }

    let parsedIssuedQty = null;
    if (status === 'issued') {
      if (issued_quantity === undefined || issued_quantity === null) {
        return res.status(400).json({ error: 'Issued quantity is required before request can be marked as issued.' });
      }
      parsedIssuedQty = parseInt(issued_quantity);
      if (isNaN(parsedIssuedQty) || parsedIssuedQty <= 0) {
        return res.status(400).json({ error: 'Issued quantity must be a positive integer greater than 0.' });
      }
      if (parsedIssuedQty > request.quantity) {
        return res.status(400).json({ error: `Issued quantity (${parsedIssuedQty}) cannot exceed the requested quantity (${request.quantity}).` });
      }
    }

    const updatedNote = storekeeper_note !== undefined ? storekeeper_note.trim() : request.storekeeper_note;

    await db.query(
      'UPDATE requests SET status = ?, storekeeper_note = ?, issued_quantity = ? WHERE id = ?',
      [status, updatedNote, parsedIssuedQty, id]
    );

    res.json({
      id: parseInt(id),
      status,
      storekeeper_note: updatedNote,
      issued_quantity: parsedIssuedQty
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
