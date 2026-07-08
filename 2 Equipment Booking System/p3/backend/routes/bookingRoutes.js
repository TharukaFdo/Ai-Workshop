const express = require('express');
const router = express.Router();
const bookingService = require('../services/bookingService');
const jwt = require('jsonwebtoken');
const { pool } = require('../config/db');

// Validation helpers
function isValidTime(timeStr) {
  const timeRegex = /^([01]\d|2[0-3]):[0-5]\d(:[0-5]\d)?$/;
  return timeRegex.test(timeStr);
}

function isValidDate(dateStr) {
  const parsed = Date.parse(dateStr);
  return !isNaN(parsed);
}

// Reusable request body validator
function validateBookingBody(body) {
  const { equipmentName, bookingDate, startTime, endTime, purpose } = body;

  if (!equipmentName || !bookingDate || !startTime || !endTime || !purpose || !purpose.trim()) {
    return 'All fields are required.';
  }

  if (!isValidDate(bookingDate)) {
    return 'Invalid booking date format.';
  }

  if (!isValidTime(startTime) || !isValidTime(endTime)) {
    return 'Invalid start time or end time format.';
  }

  if (endTime <= startTime) {
    return 'End time must be after start time.';
  }

  return null;
}

// Middleware to extract user info from JWT and load details from database
async function getAuthenticatedUser(req, res, next) {
  try {
    const authHeader = req.headers['authorization'];
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'Authentication token missing or invalid' });
    }

    const token = authHeader.split(' ')[1];
    
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'super_secret_workshop_key');
    
    // Load identity and role directly from database to prevent client spoofing
    const [rows] = await pool.query('SELECT id, username, role FROM users WHERE id = ?', [decoded.userId]);
    const user = rows[0];

    if (!user) {
      return res.status(401).json({ message: 'User not found' });
    }

    req.user = {
      id: user.id,
      username: user.username,
      role: user.role
    };
    next();
  } catch (error) {
    console.error('Authentication Error:', error.message);
    return res.status(401).json({ message: 'Authentication failed: Invalid token session' });
  }
}

// GET /api/bookings - Retrieve bookings based on role with optional filtering
router.get('/', getAuthenticatedUser, async (req, res) => {
  try {
    const { equipmentName, bookingDate, status } = req.query;
    const filters = { equipmentName, bookingDate, status };

    if (req.user.role === 'staff') {
      filters.requestedUser = req.user.username;
    } else if (req.user.role !== 'assistant') {
      return res.status(403).json({ message: 'Invalid user role' });
    }

    const bookings = await bookingService.getBookings(filters);
    res.json(bookings);
  } catch (error) {
    console.error('GET Bookings Error:', error);
    res.status(500).json({ message: 'An unexpected database error occurred. Please try again later.' });
  }
});

// POST /api/bookings - Create new booking (Staff only)
router.post('/', getAuthenticatedUser, async (req, res) => {
  try {
    if (req.user.role !== 'staff') {
      return res.status(403).json({ message: 'Only staff members can create booking requests' });
    }

    // Validation
    const validationError = validateBookingBody(req.body);
    if (validationError) {
      return res.status(400).json({ message: validationError });
    }

    const { equipmentName, bookingDate, startTime, endTime, purpose } = req.body;

    const newBooking = await bookingService.createBooking({
      equipmentName,
      requestedUser: req.user.username,
      requestedUserId: req.user.id,
      bookingDate,
      startTime,
      endTime,
      purpose
    });

    res.status(201).json(newBooking);
  } catch (error) {
    console.error('POST Booking Error:', error);
    res.status(500).json({ message: 'An unexpected database error occurred. Please try again later.' });
  }
});

// PUT /api/bookings/:id - Update booking (Staff only, pending bookings only)
router.put('/:id', getAuthenticatedUser, async (req, res) => {
  try {
    if (req.user.role !== 'staff') {
      return res.status(403).json({ message: 'Only staff members can update booking requests' });
    }

    const bookingId = parseInt(req.params.id, 10);
    const existingBooking = await bookingService.getBookingById(bookingId);

    if (!existingBooking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    // Security check: Must own the booking
    if (existingBooking.requestedUser !== req.user.username) {
      return res.status(403).json({ message: 'You are not authorized to edit this booking' });
    }

    // Lifecycle check: Must be pending
    if (existingBooking.status !== 'pending') {
      return res.status(400).json({ message: 'Only pending bookings can be updated' });
    }

    // Validation
    const validationError = validateBookingBody(req.body);
    if (validationError) {
      return res.status(400).json({ message: validationError });
    }

    const { equipmentName, bookingDate, startTime, endTime, purpose } = req.body;

    const updated = await bookingService.updateBooking(bookingId, {
      equipmentName,
      bookingDate,
      startTime,
      endTime,
      purpose
    });

    res.json(updated);
  } catch (error) {
    console.error('PUT Booking Error:', error);
    res.status(500).json({ message: 'An unexpected database error occurred. Please try again later.' });
  }
});

// PATCH /api/bookings/:id/status - Approve, reject, collect or return booking (Assistant only)
router.patch('/:id/status', getAuthenticatedUser, async (req, res) => {
  try {
    if (req.user.role !== 'assistant') {
      return res.status(403).json({ message: 'Only lab assistants can approve or reject booking requests' });
    }

    const bookingId = parseInt(req.params.id, 10);
    const existingBooking = await bookingService.getBookingById(bookingId);

    if (!existingBooking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    const { status, assistantComment } = req.body;

    // Validation
    if (!status || !['approved', 'rejected', 'collected', 'returned'].includes(status)) {
      return res.status(400).json({ message: 'Status must be approved, rejected, collected, or returned' });
    }

    if (['approved', 'rejected'].includes(status) && (!assistantComment || !assistantComment.trim())) {
      return res.status(400).json({ message: 'An assistant comment is required.' });
    }

    // Lifecycle transitions checks
    if (status === 'collected' && existingBooking.status !== 'approved') {
      return res.status(400).json({ message: 'Only approved bookings can be marked as collected.' });
    }

    if (status === 'returned' && existingBooking.status !== 'collected') {
      return res.status(400).json({ message: 'Only collected bookings can be marked as returned.' });
    }

    // Optional comment override for collection/returns
    const commentToSave = (status === 'collected' || status === 'returned')
      ? (assistantComment !== undefined ? assistantComment : existingBooking.assistantComment)
      : assistantComment;

    const updated = await bookingService.updateBookingStatus(bookingId, status, commentToSave);
    res.json(updated);
  } catch (error) {
    console.error('PATCH Booking Status Error:', error);
    res.status(500).json({ message: 'An unexpected database error occurred. Please try again later.' });
  }
});

module.exports = router;
