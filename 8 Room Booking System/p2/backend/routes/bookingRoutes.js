const express = require('express');
const router = express.Router();
const db = require('../config/db');
const { authenticateToken } = require('../middleware/auth');
const { validateRequiredFields, isDateInPast, isInvalidTimeRange } = require('../utils/validation');

// Apply auth middleware to all booking routes
router.use(authenticateToken);

// GET /api/bookings - Get bookings with filters (room, date, status)
router.get('/', async (req, res) => {
  const { room, date, status } = req.query;

  let query = "SELECT id, room_name, DATE_FORMAT(booking_date, '%Y-%m-%d') AS booking_date, start_time, end_time, purpose, requester_name, user_id, status, coordinator_note, created_at FROM bookings WHERE 1=1";
  const queryParams = [];

  // Scoping: Staff can only see their own bookings
  if (req.user.role !== 'Coordinator') {
    query += ' AND user_id = ?';
    queryParams.push(req.user.id);
  }

  // Filters
  if (room) {
    query += ' AND room_name LIKE ?';
    queryParams.push(`%${room}%`);
  }
  if (date) {
    query += ' AND booking_date = ?';
    queryParams.push(date);
  }
  if (status) {
    query += ' AND status = ?';
    queryParams.push(status);
  }

  query += ' ORDER BY booking_date DESC, start_time DESC';

  try {
    const [rows] = await db.query(query, queryParams);
    res.json(rows);
  } catch (error) {
    console.error('Error fetching bookings:', error);
    res.status(500).json({ error: 'Database error' });
  }
});

// POST /api/bookings - Create booking
router.post('/', async (req, res) => {
  const { room_name, booking_date, start_time, end_time, purpose, requester_name } = req.body;

  const requiredFields = ['room_name', 'booking_date', 'start_time', 'end_time', 'purpose', 'requester_name'];
  if (!validateRequiredFields(requiredFields, req.body)) {
    return res.status(400).json({ error: 'All fields are required' });
  }

  if (isDateInPast(booking_date)) {
    return res.status(400).json({ error: 'Booking date cannot be in the past' });
  }

  if (isInvalidTimeRange(start_time, end_time)) {
    return res.status(400).json({ error: 'Start time must be before end time' });
  }

  try {
    // Check overlap for APPROVED bookings in the same room on the same date
    const [overlapRows] = await db.query(
      `SELECT * FROM bookings 
       WHERE room_name = ? 
       AND booking_date = ? 
       AND status = 'approved' 
       AND ((start_time <= ? AND end_time > ?) OR (start_time < ? AND end_time >= ?) OR (? <= start_time AND ? >= end_time))`,
      [room_name, booking_date, start_time, start_time, end_time, end_time, start_time, end_time]
    );

    if (overlapRows.length > 0) {
      return res.status(409).json({ error: 'Conflict: The room is already booked for this time range' });
    }

    const [result] = await db.query(
      'INSERT INTO bookings (room_name, booking_date, start_time, end_time, purpose, requester_name, user_id, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [room_name, booking_date, start_time, end_time, purpose, requester_name, req.user.id, 'pending']
    );

    res.status(201).json({ id: result.insertId, message: 'Booking requested successfully' });
  } catch (error) {
    console.error('Error creating booking:', error);
    res.status(500).json({ error: 'Database error' });
  }
});

// PUT /api/bookings/:id - Update booking
router.put('/:id', async (req, res) => {
  const { id } = req.params;
  const { room_name, booking_date, start_time, end_time, purpose, requester_name } = req.body;

  const requiredFields = ['room_name', 'booking_date', 'start_time', 'end_time', 'purpose', 'requester_name'];
  if (!validateRequiredFields(requiredFields, req.body)) {
    return res.status(400).json({ error: 'All fields are required' });
  }

  if (isInvalidTimeRange(start_time, end_time)) {
    return res.status(400).json({ error: 'Start time must be before end time' });
  }

  try {
    const [bookingRows] = await db.query('SELECT * FROM bookings WHERE id = ?', [id]);
    if (bookingRows.length === 0) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    const booking = bookingRows[0];

    // Access control: check ownership directly from database fields
    if (req.user.role !== 'Coordinator' && booking.user_id !== req.user.id) {
      return res.status(403).json({ error: 'Forbidden: You cannot edit another user\'s booking' });
    }

    // Only allow editing pending bookings for Staff
    if (req.user.role !== 'Coordinator' && booking.status !== 'pending') {
      return res.status(400).json({ error: 'Cannot modify a booking that is already resolved' });
    }

    // Update query
    const newStatus = req.user.role === 'Coordinator' ? booking.status : 'pending';

    // Verify overlap if the resulting booking status is approved
    if (newStatus === 'approved') {
      const [overlapRows] = await db.query(
        `SELECT * FROM bookings 
         WHERE room_name = ? 
         AND booking_date = ? 
         AND status = 'approved' 
         AND id != ?
         AND ((start_time <= ? AND end_time > ?) OR (start_time < ? AND end_time >= ?) OR (? <= start_time AND ? >= end_time))`,
        [room_name, booking_date, id, start_time, start_time, end_time, end_time, start_time, end_time]
      );

      if (overlapRows.length > 0) {
        return res.status(409).json({ error: 'Conflict: The room is already booked for this time range' });
      }
    }

    await db.query(
      'UPDATE bookings SET room_name = ?, booking_date = ?, start_time = ?, end_time = ?, purpose = ?, requester_name = ?, status = ? WHERE id = ?',
      [room_name, booking_date, start_time, end_time, purpose, requester_name, newStatus, id]
    );

    res.json({ message: 'Booking updated successfully' });
  } catch (error) {
    console.error('Error updating booking:', error);
    res.status(500).json({ error: 'Database error' });
  }
});

// PATCH /api/bookings/:id/status - Approve or reject booking (Coordinator only, or Staff cancel own pending)
router.patch('/:id/status', async (req, res) => {
  const { id } = req.params;
  const { status, coordinator_note } = req.body;

  if (!status || !['approved', 'rejected', 'cancelled'].includes(status)) {
    return res.status(400).json({ error: 'Valid status is required' });
  }

  try {
    const [bookingRows] = await db.query('SELECT * FROM bookings WHERE id = ?', [id]);
    if (bookingRows.length === 0) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    const booking = bookingRows[0];

    // Authorization checks
    if (status === 'cancelled') {
      // Staff members can only cancel their own pending bookings
      if (req.user.role !== 'Coordinator') {
        if (booking.user_id !== req.user.id) {
          return res.status(403).json({ error: 'Forbidden: You cannot cancel another user\'s booking' });
        }
        if (booking.status !== 'pending') {
          return res.status(400).json({ error: 'Cannot cancel a booking that has already been resolved' });
        }
      }
    } else {
      // Approve/Reject statuses are restricted to Coordinators
      if (req.user.role !== 'Coordinator') {
        return res.status(403).json({ error: 'Forbidden: Only coordinators can approve or reject bookings' });
      }
    }

    // Overlap checks for approvals
    if (status === 'approved') {
      const [overlapRows] = await db.query(
        `SELECT * FROM bookings 
         WHERE room_name = ? 
         AND booking_date = ? 
         AND status = 'approved' 
         AND id != ?
         AND ((start_time <= ? AND end_time > ?) OR (start_time < ? AND end_time >= ?) OR (? <= start_time AND ? >= end_time))`,
        [booking.room_name, booking.booking_date, booking.id, booking.start_time, booking.start_time, booking.end_time, booking.end_time, booking.start_time, booking.end_time]
      );

      if (overlapRows.length > 0) {
        return res.status(409).json({ error: 'Conflict: Overlaps with an already approved booking' });
      }
    }

    const note = status === 'cancelled' ? 'Cancelled by requester' : coordinator_note;

    await db.query(
      'UPDATE bookings SET status = ?, coordinator_note = ? WHERE id = ?',
      [status, note || null, id]
    );

    res.json({ message: `Booking status updated to ${status} successfully` });
  } catch (error) {
    console.error('Error updating booking status:', error);
    res.status(500).json({ error: 'Database error' });
  }
});

module.exports = router;
