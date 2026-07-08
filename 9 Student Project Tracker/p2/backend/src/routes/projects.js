const express = require('express');
const router = express.Router();
const db = require('../db');
const authenticateUser = require('../middleware/auth');

/**
 * GET /api/projects/users
 * Returns list of all user profiles (Requires authentication)
 */
router.get('/users', authenticateUser, async (req, res) => {
  try {
    const users = await db.query('SELECT id, username, role, full_name FROM users');
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/projects/users/public
 * Returns list of usernames for onboarding help box (Public endpoint)
 */
router.get('/users/public', async (req, res) => {
  try {
    const users = await db.query('SELECT username FROM users');
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Require authentication for all subsequent endpoints
router.use(authenticateUser);

/**
 * GET /api/projects
 * Fetches project submissions list based on query filter properties (status, category, supervisor)
 * Enforces student boundary scoping in database lookup.
 */
router.get('/', async (req, res) => {
  try {
    const { status, category, supervisor_id } = req.query;
    
    let sql = 'SELECT * FROM projects WHERE 1=1';
    const params = [];
    
    if (status) {
      sql += ' AND status = ?';
      params.push(status);
    }
    if (category) {
      sql += ' AND category = ?';
      params.push(category);
    }
    if (supervisor_id) {
      sql += ' AND supervisor_id = ?';
      params.push(parseInt(supervisor_id, 10));
    }

    // Server-side boundary scoping: Students can only retrieve their own project records
    if (req.user.role === 'student') {
      sql += ' AND student_id = ?';
      params.push(req.user.id);
    } else if (req.query.student_id) {
      sql += ' AND student_id = ?';
      params.push(parseInt(req.query.student_id, 10));
    }
    
    sql += ' ORDER BY created_at DESC';
    
    const projects = await db.query(sql, params);
    res.json(projects);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/projects
 * Creates a new project submission. Enforces student role check.
 */
router.post('/', async (req, res) => {
  try {
    const { title, description, category, supervisor_id, submitted_date } = req.body;
    
    if (req.user.role !== 'student') {
      return res.status(403).json({ error: "Only students are authorized to submit project proposals." });
    }
    
    if (!title || !description || !category || !supervisor_id || !submitted_date) {
      return res.status(400).json({ error: "All fields are required." });
    }
    
    const [supervisor] = await db.query(
      'SELECT full_name FROM users WHERE id = ? AND role = "supervisor"',
      [parseInt(supervisor_id, 10)]
    );
    
    if (!supervisor) {
      return res.status(400).json({ error: "Selected supervisor does not exist." });
    }
    
    const result = await db.query(
      `INSERT INTO projects 
        (title, description, category, student_name, student_id, supervisor_name, supervisor_id, submitted_date, status) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'submitted')`,
      [title, description, category, req.user.full_name, req.user.id, supervisor.full_name, parseInt(supervisor_id, 10), submitted_date]
    );
    
    res.status(201).json({
      message: "Project submission created successfully.",
      projectId: result.insertId
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * PUT /api/projects/:id
 * Updates details of a project submission. Enforces owner student ID check and status-transition locks.
 */
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, category, supervisor_id, submitted_date } = req.body;
    
    if (req.user.role !== 'student') {
      return res.status(403).json({ error: "Only students can modify their project submissions." });
    }
    
    if (!title || !description || !category || !supervisor_id || !submitted_date) {
      return res.status(400).json({ error: "All fields are required." });
    }
    
    const [project] = await db.query('SELECT * FROM projects WHERE id = ?', [id]);
    if (!project) {
      return res.status(404).json({ error: "Project submission not found." });
    }
    
    if (project.student_id !== req.user.id) {
      return res.status(403).json({ error: "You are not authorized to update this project submission." });
    }

    // Status lock: Students can edit and resubmit ONLY submissions with revisionRequested status
    if (project.status !== 'revisionRequested') {
      return res.status(400).json({ error: 'Only submissions with "revisionRequested" status can be edited and resubmitted.' });
    }
    
    const [supervisor] = await db.query(
      'SELECT full_name FROM users WHERE id = ? AND role = "supervisor"',
      [parseInt(supervisor_id, 10)]
    );
    if (!supervisor) {
      return res.status(400).json({ error: "Selected supervisor does not exist." });
    }
    
    // Resubmitting sets the status back to 'submitted'
    await db.query(
      `UPDATE projects 
       SET title = ?, description = ?, category = ?, supervisor_name = ?, supervisor_id = ?, submitted_date = ?, status = 'submitted' 
       WHERE id = ?`,
      [title, description, category, supervisor.full_name, parseInt(supervisor_id, 10), submitted_date, id]
    );
    
    res.json({ message: "Project submission resubmitted successfully." });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * PUT /api/projects/:id/review
 * Updates status and feedback of a project submission. Enforces assigned supervisor check.
 */
router.put('/:id/review', async (req, res) => {
  try {
    const { id } = req.params;
    const { status, feedback } = req.body;
    
    if (req.user.role !== 'supervisor') {
      return res.status(403).json({ error: "Only supervisors can add feedback or update project status." });
    }
    
    const validStatuses = ['submitted', 'underReview', 'approved', 'rejected', 'revisionRequested'];
    if (!status || !validStatuses.includes(status)) {
      return res.status(400).json({ error: "Invalid status value." });
    }
    
    const [project] = await db.query('SELECT * FROM projects WHERE id = ?', [id]);
    if (!project) {
      return res.status(404).json({ error: "Project submission not found." });
    }
    
    if (project.supervisor_id !== req.user.id) {
      return res.status(403).json({ error: "You are not the designated supervisor for this project." });
    }
    
    await db.query(
      'UPDATE projects SET status = ?, feedback = ? WHERE id = ?',
      [status, feedback || null, id]
    );
    
    res.json({ message: "Project review updated successfully." });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
