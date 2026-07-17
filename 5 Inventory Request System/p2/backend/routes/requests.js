const express = require('express');
const router = express.Router();
const pool = require('../db');

const authMiddleware = require('../middleware/auth');

// Apply authentication middleware to all endpoints in this router
router.use(authMiddleware);

// GET /api/requests - Get all requests with filters
router.get('/', async (req, res) => {
  const { item_name, requester_name, status } = req.query;
  const user = req.user;

  try {
    let query = 'SELECT * FROM requests WHERE 1=1';
    const params = [];

    // Enforce role permission: Staff can only see their own requests
    if (user.role === 'staff') {
      query += ' AND requester_id = ?';
      params.push(user.id);
    }

    // Apply filtering options
    if (item_name) {
      query += ' AND item_name LIKE ?';
      params.push(`%${item_name}%`);
    }
    if (requester_name) {
      query += ' AND requester_name LIKE ?';
      params.push(`%${requester_name}%`);
    }
    if (status) {
      query += ' AND status = ?';
      params.push(status);
    }

    query += ' ORDER BY created_at DESC';

    const [rows] = await pool.query(query, params);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/requests - Submit a request
router.post('/', async (req, res) => {
  const { item_name, quantity, reason, requested_date } = req.body;
  const user = req.user;

  // Validation
  if (!item_name || String(item_name).trim() === '') {
    return res.status(400).json({ error: 'Item name is required.' });
  }
  
  const qty = parseInt(quantity);
  if (isNaN(qty) || qty <= 0) {
    return res.status(400).json({ error: 'Quantity must be a positive integer.' });
  }

  if (!reason || String(reason).trim() === '') {
    return res.status(400).json({ error: 'Reason for request is required.' });
  }

  if (!requested_date) {
    return res.status(400).json({ error: 'Requested date is required.' });
  }

  try {
    const [result] = await pool.query(
      'INSERT INTO requests (item_name, quantity, reason, requested_date, requester_id, requester_name, status) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [item_name.trim(), qty, reason.trim(), requested_date, user.id, user.username, 'pending']
    );

    const [newRequest] = await pool.query('SELECT * FROM requests WHERE id = ?', [result.insertId]);
    res.status(201).json(newRequest[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/requests/:id/status - Update status (Approve, Reject, Issue)
router.put('/:id/status', async (req, res) => {
  const { id } = req.params;
  const { status, storekeeper_note, issued_quantity } = req.body;
  const user = req.user;

  // 1. Authorization: Only storekeepers can manage requests
  if (user.role !== 'storekeeper') {
    return res.status(403).json({ error: 'Access denied. Only storekeepers can approve or manage requests.' });
  }

  // 2. Validate input status
  const validStatuses = ['approved', 'rejected', 'issued'];
  if (!status || !validStatuses.includes(status)) {
    return res.status(400).json({ error: 'Invalid target status. Must be approved, rejected, or issued.' });
  }

  try {
    // Fetch current request state
    const [requests] = await pool.query('SELECT * FROM requests WHERE id = ?', [id]);
    if (requests.length === 0) {
      return res.status(404).json({ error: 'Request not found.' });
    }
    const request = requests[0];

    // 3. Prevent Self-Approval / Self-Issuing
    if (request.requester_id === user.id) {
      return res.status(403).json({ error: 'Forbidden. Storekeepers cannot approve or manage requests they submitted themselves.' });
    }

    // 4. Validate transition constraints
    if (status === 'issued') {
      if (request.status !== 'approved') {
        return res.status(400).json({ error: 'Only approved requests can be marked as issued.' });
      }

      const issuedQty = parseInt(issued_quantity);
      if (isNaN(issuedQty) || issuedQty <= 0) {
        return res.status(400).json({ error: 'Issued quantity must be a positive integer.' });
      }
      if (issuedQty > request.quantity) {
        return res.status(400).json({ error: `Issued quantity cannot exceed requested quantity of ${request.quantity}.` });
      }

      // Perform update to issued status
      await pool.query(
        'UPDATE requests SET status = ?, storekeeper_note = ?, issued_quantity = ?, issued_at = CURRENT_TIMESTAMP WHERE id = ?',
        [status, storekeeper_note || request.storekeeper_note, issuedQty, id]
      );
    } else {
      // Transitioning to 'approved' or 'rejected'
      await pool.query(
        'UPDATE requests SET status = ?, storekeeper_note = ?, issued_quantity = 0, issued_at = NULL WHERE id = ?',
        [status, storekeeper_note || null, id]
      );
    }

    // Get updated request
    const [updatedRows] = await pool.query('SELECT * FROM requests WHERE id = ?', [id]);
    res.json(updatedRows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
