import express from 'express';
import pool from '../db.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

// 1. Fetch Bookings (uses verified role from DB lookup)
router.get('/', authenticate, async (req, res) => {
  const { role, username } = req.user;
  const { equipmentName, bookingDate, status } = req.query;

  try {
    let query = 'SELECT * FROM bookings WHERE 1=1';
    const params = [];

    if (role === 'Staff') {
      query += ' AND requestedUser = ?';
      params.push(username);
    }

    if (equipmentName) {
      query += ' AND equipmentName = ?';
      params.push(equipmentName);
    }
    if (bookingDate) {
      query += ' AND bookingDate = ?';
      params.push(bookingDate);
    }
    if (status) {
      query += ' AND status = ?';
      params.push(status);
    }

    query += ' ORDER BY bookingDate DESC, createdAt DESC';

    const [rows] = await pool.query(query, params);
    res.json(rows);
  } catch (error) {
    console.error('Fetch bookings error:', error);
    res.status(500).json({ error: 'Failed to retrieve bookings.' });
  }
});

// 2. Create Booking Request (verified role from DB lookup)
router.post('/', authenticate, async (req, res) => {
  const { role, username } = req.user;
  
  if (role !== 'Staff') {
    return res.status(403).json({ error: 'Forbidden: Only staff members can request bookings.' });
  }

  const { equipmentName, bookingDate, startTime, endTime, purpose } = req.body;

  if (!equipmentName || !bookingDate || !startTime || !endTime || !purpose) {
    return res.status(400).json({ error: 'All fields (equipmentName, bookingDate, startTime, endTime, purpose) are required.' });
  }

  const today = new Date().toISOString().split('T')[0];
  if (bookingDate < today) {
    return res.status(400).json({ error: 'Booking date cannot be in the past.' });
  }

  if (startTime >= endTime) {
    return res.status(400).json({ error: 'Start time must be earlier than end time.' });
  }

  try {
    const [result] = await pool.query(
      'INSERT INTO bookings (equipmentName, requestedUser, bookingDate, startTime, endTime, purpose, status) VALUES (?, ?, ?, ?, ?, ?, "Pending")',
      [equipmentName, username, bookingDate, startTime, endTime, purpose]
    );

    res.status(201).json({
      message: 'Booking request created successfully.',
      bookingId: result.insertId
    });
  } catch (error) {
    console.error('Create booking error:', error);
    res.status(500).json({ error: 'Failed to create booking request.' });
  }
});

// 3. Update Booking Status (verified Assistant from DB lookup)
router.put('/:id/status', authenticate, async (req, res) => {
  const { role } = req.user;
  const { id } = req.params;
  const { status, assistantComment } = req.body;

  if (role !== 'Assistant') {
    return res.status(403).json({ error: 'Forbidden: Only lab assistants can manage booking requests.' });
  }

  if (!status || !['Approved', 'Rejected', 'Collected', 'Returned'].includes(status)) {
    return res.status(400).json({ error: 'Invalid status. Status must be "Approved", "Rejected", "Collected", or "Returned".' });
  }

  if (status === 'Rejected' && (!assistantComment || !assistantComment.trim())) {
    return res.status(400).json({ error: 'A comment is required when rejecting a booking request.' });
  }

  try {
    const [rows] = await pool.query('SELECT * FROM bookings WHERE id = ?', [id]);
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Booking request not found.' });
    }

    const currentStatus = rows[0].status;

    // Enforce state transition checks
    if ((status === 'Approved' || status === 'Rejected') && currentStatus !== 'Pending') {
      return res.status(400).json({ error: `Cannot change status to ${status} from current status of ${currentStatus}.` });
    }
    if (status === 'Collected' && currentStatus !== 'Approved') {
      return res.status(400).json({ error: `Booking must be Approved before marking as Collected. Current status is ${currentStatus}.` });
    }
    if (status === 'Returned' && currentStatus !== 'Collected') {
      return res.status(400).json({ error: `Booking must be Collected before marking as Returned. Current status is ${currentStatus}.` });
    }

    const comment = assistantComment ? assistantComment.trim() : rows[0].assistantComment; // keep original comment if status transitions forward without new comment

    await pool.query(
      'UPDATE bookings SET status = ?, assistantComment = ? WHERE id = ?',
      [status, comment, id]
    );

    res.json({ message: `Booking request was successfully marked as ${status.toLowerCase()}.` });
  } catch (error) {
    console.error('Update status error:', error);
    res.status(500).json({ error: 'Failed to update booking request status.' });
  }
});

export default router;
