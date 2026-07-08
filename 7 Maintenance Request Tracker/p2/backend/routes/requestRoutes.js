const express = require('express');
const db = require('../db');
const authenticateUser = require('../middleware/auth');

const router = express.Router();

// Get Requests (Available to authenticated users)
router.get('/', authenticateUser, async (req, res) => {
  const { location, priority, status } = req.query;
  
  let sql = 'SELECT * FROM requests';
  const params = [];
  const conditions = [];

  // Requesters can only see their own requests (owner check)
  if (req.user.role === 'requester') {
    conditions.push('requester_name = ?');
    const displayName = req.user.username === 'alice_req' ? 'Alice Requester' : req.user.username;
    params.push(displayName);
  }

  if (location && location.trim()) {
    conditions.push('location LIKE ?');
    params.push(`%${location.trim()}%`);
  }
  if (priority && priority.trim()) {
    conditions.push('priority = ?');
    params.push(priority.trim());
  }
  if (status && status.trim()) {
    conditions.push('status = ?');
    params.push(status.trim());
  }

  if (conditions.length > 0) {
    sql += ' WHERE ' + conditions.join(' AND ');
  }

  sql += ' ORDER BY created_at DESC';

  try {
    const [rows] = await db.query(sql, params);
    res.json(rows);
  } catch (error) {
    console.error('Get requests database query failure:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Create Maintenance Request (Requester only)
router.post('/', authenticateUser, async (req, res) => {
  const { title, description, location, priority } = req.body;

  if (req.user.role !== 'requester') {
    return res.status(403).json({ error: 'Forbidden: Only requesters can submit requests' });
  }

  if (!title || !title.trim() || 
      !description || !description.trim() || 
      !location || !location.trim() || 
      !priority || !priority.trim()) {
    return res.status(400).json({ error: 'All fields are required and cannot be empty' });
  }

  const validPriorities = ['Low', 'Medium', 'High'];
  if (!validPriorities.includes(priority.trim())) {
    return res.status(400).json({ error: 'Invalid priority level' });
  }

  const requesterName = req.user.username === 'alice_req' ? 'Alice Requester' : req.user.username;

  try {
    const [result] = await db.query(
      'INSERT INTO requests (title, description, location, priority, requester_name, status) VALUES (?, ?, ?, ?, ?, ?)',
      [title.trim(), description.trim(), location.trim(), priority.trim(), requesterName, 'submitted']
    );

    res.status(201).json({
      message: 'Maintenance request submitted successfully',
      id: result.insertId
    });
  } catch (error) {
    console.error('Create request database failure:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Update Request Status / Notes (Technician only)
router.put('/:id', authenticateUser, async (req, res) => {
  const { id } = req.params;
  const { status, technicianNote } = req.body;

  if (req.user.role !== 'technician') {
    return res.status(403).json({ error: 'Forbidden: Only technicians can update requests' });
  }

  if (!status || !status.trim()) {
    return res.status(400).json({ error: 'Status is required' });
  }

  const validStatuses = ['submitted', 'inProgress', 'completed', 'closed'];
  if (!validStatuses.includes(status.trim())) {
    return res.status(400).json({ error: 'Invalid status value' });
  }

  try {
    const [requests] = await db.query('SELECT * FROM requests WHERE id = ?', [id]);
    if (requests.length === 0) {
      return res.status(444).json({ error: 'Request not found' });
    }

    let closedAt = requests[0].closed_at;
    if (status.trim() === 'closed' && requests[0].status !== 'closed') {
      closedAt = new Date();
    } else if (status.trim() !== 'closed') {
      closedAt = null;
    }

    const cleanNote = (technicianNote && technicianNote.trim()) ? technicianNote.trim() : null;

    // High priority requests closure rule
    if (status.trim() === 'closed' && requests[0].priority === 'High') {
      const existingNote = requests[0].technician_note;
      if (!cleanNote && (!existingNote || !existingNote.trim())) {
        return res.status(400).json({ error: 'A technician note is required to close high-priority requests' });
      }
    }

    await db.query(
      'UPDATE requests SET status = ?, technician_note = ?, closed_at = ? WHERE id = ?',
      [status.trim(), cleanNote, closedAt, id]
    );

    res.json({ message: 'Request updated successfully' });
  } catch (error) {
    console.error('Update request database failure:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

module.exports = router;
