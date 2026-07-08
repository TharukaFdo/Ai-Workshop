const express = require('express');
const router = express.Router();
const dbService = require('../services/dbService');
const { authMiddleware } = require('../middleware/authMiddleware');

// Enforce auth middleware for all booking requests
router.use(authMiddleware);

// Middleware to validate core booking inputs
const validateBookingInput = (req, res, next) => {
  const { roomName, bookingDate, startTime, endTime, purpose } = req.body;
  if (!roomName || !bookingDate || !startTime || !endTime || !purpose) {
    return res.status(400).json({ success: false, message: 'All fields are required.' });
  }
  if (endTime <= startTime) {
    return res.status(400).json({ success: false, message: 'End time must be after start time.' });
  }
  next();
};

// GET /api/bookings - fetch bookings based on filters & role
router.get('/', async (req, res, next) => {
  try {
    const { id: userId, role } = req.user;

    const filters = {
      roomName: req.query.roomName,
      bookingDate: req.query.bookingDate,
      status: req.query.status
    };

    let bookings;
    if (role === 'coordinator') {
      bookings = await dbService.getAllBookings(filters);
    } else {
      bookings = await dbService.getBookingsByRequester(userId, filters);
    }

    res.json({ success: true, bookings });
  } catch (error) {
    next(error);
  }
});

// POST /api/bookings - submit a new room booking request
router.post('/', validateBookingInput, async (req, res, next) => {
  try {
    const { id: userId, role } = req.user;
    const { roomName, bookingDate, startTime, endTime, purpose, requesterId } = req.body;

    if (!requesterId) {
      return res.status(400).json({ success: false, message: 'Requester identity is required.' });
    }

    // Security check: staff should not be booking on behalf of another user
    if (role !== 'coordinator' && parseInt(requesterId) !== userId) {
      return res.status(403).json({ success: false, message: 'Unauthorized: Cannot create booking requests for other users.' });
    }

    // Check if requester exists
    const user = await dbService.getUserById(requesterId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'Requester user not found.' });
    }

    const insertId = await dbService.createBooking({
      roomName,
      bookingDate,
      startTime,
      endTime,
      purpose,
      requesterId
    });

    const newBooking = await dbService.getBookingById(insertId);
    res.status(201).json({ success: true, booking: newBooking });
  } catch (error) {
    next(error);
  }
});

// PUT /api/bookings/:id - update booking details (for owner and only while pending)
router.put('/:id', validateBookingInput, async (req, res, next) => {
  try {
    const { id: userId, role } = req.user;
    const bookingId = parseInt(req.params.id);
    const { roomName, bookingDate, startTime, endTime, purpose } = req.body;

    const booking = await dbService.getBookingById(bookingId);
    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found.' });
    }

    if (booking.status !== 'pending') {
      return res.status(400).json({ success: false, message: 'Only pending bookings can be updated.' });
    }

    // Security check: staff can only update their own bookings
    if (role !== 'coordinator' && booking.requesterId !== userId) {
      return res.status(403).json({ success: false, message: 'Unauthorized: Cannot update bookings owned by other users.' });
    }

    await dbService.updateBookingDetails(bookingId, { roomName, bookingDate, startTime, endTime, purpose });
    const updated = await dbService.getBookingById(bookingId);
    res.json({ success: true, booking: updated });
  } catch (error) {
    next(error);
  }
});

// PUT /api/bookings/:id/status - Approve or Reject a booking (Coordinator only)
router.put('/:id/status', async (req, res, next) => {
  try {
    const { role } = req.user;
    const bookingId = parseInt(req.params.id);
    const { status, coordinatorNote } = req.body;

    if (role !== 'coordinator') {
      return res.status(403).json({ success: false, message: 'Forbidden: Only coordinators can approve or reject booking requests.' });
    }

    if (!['approved', 'rejected'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status value. Must be "approved" or "rejected".' });
    }

    const booking = await dbService.getBookingById(bookingId);
    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found.' });
    }

    // Overlapping double booking conflict check
    if (status === 'approved') {
      const conflictExists = await dbService.checkConflict(
        booking.roomName,
        booking.bookingDate,
        booking.startTime,
        booking.endTime,
        bookingId
      );
      if (conflictExists) {
        return res.status(409).json({ 
          success: false, 
          message: `Double Booking Conflict: The room "${booking.roomName}" is already approved for another request at this time slot.` 
        });
      }
    }

    await dbService.updateBookingStatus(bookingId, status, coordinatorNote);
    const updated = await dbService.getBookingById(bookingId);
    res.json({ success: true, booking: updated });
  } catch (error) {
    next(error);
  }
});

// PUT /api/bookings/:id/cancel - cancel a booking (Owner or Coordinator)
router.put('/:id/cancel', async (req, res, next) => {
  try {
    const { id: userId, role } = req.user;
    const bookingId = parseInt(req.params.id);

    const booking = await dbService.getBookingById(bookingId);
    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found.' });
    }

    // Security check: staff can only cancel their own bookings
    if (role !== 'coordinator' && booking.requesterId !== userId) {
      return res.status(403).json({ success: false, message: 'Unauthorized: Cannot cancel bookings owned by other users.' });
    }

    if (!['pending', 'approved'].includes(booking.status)) {
      return res.status(400).json({ success: false, message: 'Only pending or approved bookings can be cancelled.' });
    }

    await dbService.updateBookingStatus(bookingId, 'cancelled', booking.coordinatorNote);
    const updated = await dbService.getBookingById(bookingId);
    res.json({ success: true, booking: updated });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
