const express = require('express');
const pool = require('../db');
const authenticateSession = require('../middleware/auth');

const router = express.Router();

const WORKSHOPS = [
  'Introduction to React & State Management',
  'Building REST APIs with Express & MySQL',
  'Advanced Frontend Systems & Deployment'
];

// Submit registration (authenticated participant only)
router.post('/', authenticateSession, async (req, res) => {
  const { participantName, email, workshopTitle, registrationDetails } = req.body;

  if (typeof participantName !== 'string' || !participantName.trim() ||
      typeof email !== 'string' || !email.trim() ||
      typeof workshopTitle !== 'string' || !workshopTitle.trim()) {
    return res.status(400).json({ error: 'Name, email, and workshop title must be non-empty strings.' });
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email.trim())) {
    return res.status(400).json({ error: 'Invalid email address format.' });
  }

  if (!WORKSHOPS.includes(workshopTitle.trim())) {
    return res.status(400).json({ error: 'Invalid workshop selection.' });
  }

  // Force linking registration to the authenticated participant's user id
  if (req.user.role !== 'participant') {
    return res.status(403).json({ error: 'Access denied. Only participants can register for workshops.' });
  }

  try {
    const [result] = await pool.query(
      `INSERT INTO registrations (participantName, email, workshopTitle, registrationDetails, status, attendanceStatus, userId) 
       VALUES (?, ?, ?, ?, 'pending', 'notMarked', ?)`,
      [participantName, email, workshopTitle, registrationDetails || '', req.user.id]
    );

    return res.status(201).json({
      message: 'Registration submitted successfully.',
      registrationId: result.insertId
    });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to save registration in database.', details: err.message });
  }
});

// Fetch user status (returns only user-owned registrations from database)
router.get('/status', authenticateSession, async (req, res) => {
  const { workshopTitle, status, attendanceStatus } = req.query;

  let sql = 'SELECT id, participantName, email, workshopTitle, registrationDetails, status, attendanceStatus, createdAt FROM registrations WHERE userId = ?';
  const params = [req.user.id];

  if (workshopTitle && workshopTitle !== '') {
    sql += ' AND workshopTitle = ?';
    params.push(workshopTitle);
  }

  if (status && status !== '') {
    sql += ' AND status = ?';
    params.push(status);
  }

  if (attendanceStatus && attendanceStatus !== '') {
    sql += ' AND attendanceStatus = ?';
    params.push(attendanceStatus);
  }

  sql += ' ORDER BY createdAt DESC';

  try {
    const [rows] = await pool.query(sql, params);
    return res.json(rows);
  } catch (err) {
    return res.status(500).json({ error: 'Failed to retrieve registrations from database.', details: err.message });
  }
});

// Fetch all registrations (filtered, organizer only)
router.get('/', authenticateSession, async (req, res) => {
  // Check the role lookup from database
  if (req.user.role !== 'organizer') {
    return res.status(403).json({ error: 'Access denied. Organizer role required.' });
  }

  const { workshopTitle, status, attendanceStatus } = req.query;

  let sql = 'SELECT * FROM registrations WHERE 1=1';
  const params = [];

  if (workshopTitle && workshopTitle !== '') {
    sql += ' AND workshopTitle = ?';
    params.push(workshopTitle);
  }

  if (status && status !== '') {
    sql += ' AND status = ?';
    params.push(status);
  }

  if (attendanceStatus && attendanceStatus !== '') {
    sql += ' AND attendanceStatus = ?';
    params.push(attendanceStatus);
  }

  sql += ' ORDER BY createdAt DESC';

  try {
    const [rows] = await pool.query(sql, params);
    return res.json(rows);
  } catch (err) {
    return res.status(500).json({ error: 'Database query failed.', details: err.message });
  }
});

// Update registration (authenticated organizer or participant with restrictions)
router.put('/:id', authenticateSession, async (req, res) => {
  const { id } = req.params;
  const { status, attendanceStatus, organizerNote } = req.body;

  try {
    // 1. Look up the registration first to inspect ownership and current data
    const [existing] = await pool.query('SELECT * FROM registrations WHERE id = ?', [id]);
    if (existing.length === 0) {
      return res.status(404).json({ error: 'Registration record not found.' });
    }

    const registration = existing[0];

    // 2. Perform database-backed role validation
    if (req.user.role !== 'organizer') {
      // Check ownership
      if (registration.userId !== req.user.id) {
        return res.status(403).json({ error: 'Access denied. You do not own this registration.' });
      }

      // Check restricted actions: participants cannot mark attendance or edit organizer notes
      if (attendanceStatus !== undefined || organizerNote !== undefined) {
        return res.status(403).json({ error: 'Access denied. Only organizers can mark attendance or edit notes.' });
      }

      // Check restricted status updates: participants can only set status to cancelled (cannot confirm or pending themselves)
      if (status !== undefined && status !== 'cancelled') {
        return res.status(403).json({ error: 'Access denied. Participants can only cancel their registration.' });
      }
    }

    // 3. Build dynamic query
    const updates = [];
    const params = [];

    if (status !== undefined) {
      const ALLOWED_STATUSES = ['pending', 'confirmed', 'cancelled', 'waitlisted'];
      if (!ALLOWED_STATUSES.includes(status)) {
        return res.status(400).json({ error: 'Invalid registration status value.' });
      }
      updates.push('status = ?');
      params.push(status);
    }

    if (attendanceStatus !== undefined && req.user.role === 'organizer') {
      updates.push('attendanceStatus = ?');
      params.push(attendanceStatus);
    }

    if (organizerNote !== undefined && req.user.role === 'organizer') {
      updates.push('organizerNote = ?');
      params.push(organizerNote);
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'No valid fields for update provided.' });
    }

    params.push(id);
    const updateSql = `UPDATE registrations SET ${updates.join(', ')} WHERE id = ?`;

    await pool.query(updateSql, params);
    return res.json({ message: 'Registration updated successfully.' });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to update registration.', details: err.message });
  }
});

module.exports = router;
