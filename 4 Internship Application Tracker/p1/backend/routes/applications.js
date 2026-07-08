const express = require('express');
const router = express.Router();
const db = require('../db');

// Middleware to authenticate user and resolve their role
async function authenticate(req, res, next) {
  const userId = req.headers['x-user-id'];
  if (!userId) {
    return res.status(401).json({ error: 'Authentication required. User ID header missing.' });
  }

  const parsedId = parseInt(userId, 10);
  if (isNaN(parsedId) || parsedId <= 0) {
    return res.status(401).json({ error: 'Invalid user session. User ID must be a numeric integer.' });
  }

  try {
    const [rows] = await db.query('SELECT * FROM users WHERE id = ?', [parsedId]);
    if (rows.length === 0) {
      return res.status(401).json({ error: 'Invalid user session. Please log in again.' });
    }
    req.user = rows[0]; // Save user info in request object
    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    res.status(500).json({ error: 'Server authentication database error' });
  }
}

// GET /api/applications - Fetch applications (role-specific access)
router.get('/', authenticate, async (req, res) => {
  const { status, company_name } = req.query;
  let sql = 'SELECT * FROM applications';
  const params = [];
  const conditions = [];

  // Enforce Student limit: Students only see their own applications
  if (req.user.role === 'student') {
    conditions.push('student_id = ?');
    params.push(req.user.id);
  }

  if (status) {
    conditions.push('status = ?');
    params.push(status);
  }

  if (company_name) {
    conditions.push('company_name LIKE ?');
    params.push(`%${company_name}%`);
  }

  if (conditions.length > 0) {
    sql += ' WHERE ' + conditions.join(' AND ');
  }

  sql += ' ORDER BY submitted_date DESC';

  try {
    const [rows] = await db.query(sql, params);
    res.json(rows);
  } catch (error) {
    console.error('Error fetching applications:', error);
    res.status(500).json({ error: 'Database error fetching applications' });
  }
});

// POST /api/applications - Submit a new application (Students only)
router.post('/', authenticate, async (req, res) => {
  if (req.user.role !== 'student') {
    return res.status(403).json({ error: 'Forbidden. Only students can submit applications.' });
  }

  const { student_name, company_name, position_title, start_date, end_date } = req.body;

  // Whitespace and existence validation
  const trimmedStudent = student_name?.trim();
  const trimmedCompany = company_name?.trim();
  const trimmedPosition = position_title?.trim();

  if (!trimmedStudent || !trimmedCompany || !trimmedPosition || !start_date || !end_date) {
    return res.status(400).json({ error: 'All fields are required and cannot be empty whitespace.' });
  }

  // Length constraints to prevent DB error
  if (trimmedStudent.length > 255 || trimmedCompany.length > 255 || trimmedPosition.length > 255) {
    return res.status(400).json({ error: 'Input fields cannot exceed 255 characters.' });
  }

  // Date validity check
  const start = new Date(start_date);
  const end = new Date(end_date);
  if (isNaN(start.getTime()) || isNaN(end.getTime())) {
    return res.status(400).json({ error: 'Invalid start date or end date format.' });
  }

  // Date range constraints
  if (end < start) {
    return res.status(400).json({ error: 'End Date cannot be earlier than Start Date.' });
  }

  try {
    const query = `
      INSERT INTO applications (student_id, student_name, company_name, position_title, start_date, end_date, status)
      VALUES (?, ?, ?, ?, ?, ?, 'submitted')
    `;
    const [result] = await db.query(query, [req.user.id, trimmedStudent, trimmedCompany, trimmedPosition, start_date, end_date]);
    
    res.status(201).json({
      message: 'Application submitted successfully',
      applicationId: result.insertId
    });
  } catch (error) {
    console.error('Error saving application:', error);
    res.status(500).json({ error: 'Database error saving application' });
  }
});

// PUT /api/applications/:id - Review and update status / comments (Coordinators only)
router.put('/:id', authenticate, async (req, res) => {
  if (req.user.role !== 'coordinator') {
    return res.status(403).json({ error: 'Forbidden. Only coordinators can review applications.' });
  }

  const { id } = req.params;
  const { status, coordinator_comments } = req.body;

  // Basic status validation
  const validStatuses = ['submitted', 'under_review', 'approved', 'rejected', 'needs_changes'];
  if (status && !validStatuses.includes(status)) {
    return res.status(400).json({ error: 'Invalid application status' });
  }

  // Coordinator comments validation
  const trimmedComments = coordinator_comments?.trim();
  if (trimmedComments && trimmedComments.length > 1000) {
    return res.status(400).json({ error: 'Comments cannot exceed 1000 characters.' });
  }

  try {
    // Check if application exists
    const [existing] = await db.query('SELECT * FROM applications WHERE id = ?', [id]);
    if (existing.length === 0) {
      return res.status(404).json({ error: 'Application not found' });
    }

    const query = `
      UPDATE applications 
      SET status = COALESCE(?, status), 
          coordinator_comments = ? 
      WHERE id = ?
    `;
    await db.query(query, [status, trimmedComments || null, id]);

    res.json({ message: 'Application updated successfully' });
  } catch (error) {
    console.error('Error updating application:', error);
    res.status(500).json({ error: 'Database error updating application' });
  }
});

// PUT /api/applications/:id/resubmit - Student edits and resubmits application (owner only, only if status is 'needs_changes')
router.put('/:id/resubmit', authenticate, async (req, res) => {
  if (req.user.role !== 'student') {
    return res.status(403).json({ error: 'Forbidden. Only students can edit and resubmit applications.' });
  }

  const { id } = req.params;
  const { student_name, company_name, position_title, start_date, end_date } = req.body;

  // Whitespace and existence validation
  const trimmedStudent = student_name?.trim();
  const trimmedCompany = company_name?.trim();
  const trimmedPosition = position_title?.trim();

  if (!trimmedStudent || !trimmedCompany || !trimmedPosition || !start_date || !end_date) {
    return res.status(400).json({ error: 'All fields are required and cannot be empty whitespace.' });
  }

  // Length constraints
  if (trimmedStudent.length > 255 || trimmedCompany.length > 255 || trimmedPosition.length > 255) {
    return res.status(400).json({ error: 'Input fields cannot exceed 255 characters.' });
  }

  // Date validity check
  const start = new Date(start_date);
  const end = new Date(end_date);
  if (isNaN(start.getTime()) || isNaN(end.getTime())) {
    return res.status(400).json({ error: 'Invalid start date or end date format.' });
  }

  // Date range constraints
  if (end < start) {
    return res.status(400).json({ error: 'End Date cannot be earlier than Start Date.' });
  }

  try {
    // Check application status and owner
    const [existing] = await db.query('SELECT * FROM applications WHERE id = ?', [id]);
    if (existing.length === 0) {
      return res.status(404).json({ error: 'Application not found.' });
    }

    if (existing[0].student_id !== req.user.id) {
      return res.status(403).json({ error: 'Forbidden. You do not own this application.' });
    }

    if (existing[0].status !== 'needs_changes') {
      return res.status(400).json({ error: 'Forbidden. Only applications with status "Needs Changes" can be resubmitted.' });
    }

    const query = `
      UPDATE applications 
      SET student_name = ?,
          company_name = ?,
          position_title = ?,
          start_date = ?,
          end_date = ?,
          status = 'submitted'
      WHERE id = ?
    `;
    await db.query(query, [trimmedStudent, trimmedCompany, trimmedPosition, start_date, end_date, id]);

    res.json({ message: 'Application resubmitted successfully' });
  } catch (error) {
    console.error('Error resubmitting application:', error);
    res.status(500).json({ error: 'Database error resubmitting application' });
  }
});

module.exports = router;
