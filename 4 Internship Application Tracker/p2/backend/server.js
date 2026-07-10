const express = require('express');
const cors = require('cors');
const crypto = require('crypto');
const db = require('./db');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5001;

// Middleware
app.use(cors());
app.use(express.json());

const requireAuth = require('./authMiddleware');

// Health Check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Backend server is running.' });
});

// Login API
app.post('/api/auth/login', async (req, res) => {
  const { username, password } = req.body;
  
  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password are required.' });
  }

  try {
    const [users] = await db.query(
      'SELECT id, username, role FROM users WHERE username = ? AND password = ?',
      [username, password]
    );

    if (users.length === 0) {
      return res.status(401).json({ error: 'Invalid username or password.' });
    }

    const user = users[0];

    // Generate a secure session token
    const token = crypto.randomBytes(32).toString('hex');

    // Store session in the database
    await db.query(
      'INSERT INTO sessions (user_id, token) VALUES (?, ?)',
      [user.id, token]
    );

    res.json({
      id: user.id,
      username: user.username,
      role: user.role,
      token: token // This is the single source of authority sent to the client
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Server error during login.' });
  }
});

// List Applications API
app.get('/api/applications', requireAuth, async (req, res) => {
  const { companyName, status } = req.query;
  const { id: userId, role: userRole } = req.user; // Verified role from session db lookup

  try {
    let query = 'SELECT * FROM applications WHERE 1=1';
    const params = [];

    // Role-based authorization: Students can only see their own applications
    if (userRole === 'student') {
      query += ' AND student_id = ?';
      params.push(userId);
    }

    // Secondary filters
    if (companyName) {
      query += ' AND companyName LIKE ?';
      params.push(`%${companyName}%`);
    }

    if (status) {
      query += ' AND status = ?';
      params.push(status);
    }

    query += ' ORDER BY createdAt DESC';

    const [applications] = await db.query(query, params);
    res.json(applications);
  } catch (error) {
    console.error('Fetch applications error:', error);
    res.status(500).json({ error: 'Server error while fetching applications.' });
  }
});

// Submit Application API
app.post('/api/applications', requireAuth, async (req, res) => {
  const { companyName, positionTitle, startDate, endDate, submittedDate } = req.body;
  const { id: userId, role: userRole, username: studentName } = req.user; // Use DB-verified identity

  // Authorization: Only students can submit applications
  if (userRole !== 'student') {
    return res.status(403).json({ error: 'Forbidden. Only students can submit applications.' });
  }

  // Field validations
  if (!companyName || !positionTitle || !startDate || !endDate || !submittedDate) {
    return res.status(400).json({ error: 'All fields are required.' });
  }

  // Date sequence validation
  if (new Date(startDate) >= new Date(endDate)) {
    return res.status(400).json({ error: 'Start Date must be before End Date.' });
  }

  try {
    const [result] = await db.query(
      `INSERT INTO applications 
       (student_id, studentName, companyName, positionTitle, startDate, endDate, submittedDate, status, coordinatorComment) 
       VALUES (?, ?, ?, ?, ?, ?, ?, 'submitted', NULL)`,
      [userId, studentName, companyName, positionTitle, startDate, endDate, submittedDate]
    );

    res.status(201).json({
      id: result.insertId,
      studentName,
      companyName,
      positionTitle,
      startDate,
      endDate,
      submittedDate,
      status: 'submitted',
      coordinatorComment: null
    });
  } catch (error) {
    console.error('Submit application error:', error);
    res.status(500).json({ error: 'Server error during submission.' });
  }
});

// Update Application (Review / Comment / Status update) API
app.put('/api/applications/:id', requireAuth, async (req, res) => {
  const { id } = req.params;
  const { status, coordinatorComment } = req.body;
  const { role: userRole } = req.user; // Verified role from session db lookup

  // Authorization: Only coordinators can review/approve/reject/comment
  if (userRole !== 'coordinator') {
    return res.status(403).json({ error: 'Forbidden. Only coordinators can review applications.' });
  }

  // Status values validation
  const validStatuses = ['submitted', 'underReview', 'approved', 'rejected', 'changesRequested'];
  if (status && !validStatuses.includes(status)) {
    return res.status(400).json({ error: 'Invalid application status value.' });
  }

  try {
    // Check if application exists
    const [apps] = await db.query('SELECT * FROM applications WHERE id = ?', [id]);
    if (apps.length === 0) {
      return res.status(404).json({ error: 'Application not found.' });
    }

    const currentApp = apps[0];
    const newStatus = status || currentApp.status;
    const newComment = coordinatorComment !== undefined ? coordinatorComment : currentApp.coordinatorComment;

    await db.query(
      'UPDATE applications SET status = ?, coordinatorComment = ? WHERE id = ?',
      [newStatus, newComment, id]
    );

    res.json({
      id: currentApp.id,
      student_id: currentApp.student_id,
      studentName: currentApp.studentName,
      companyName: currentApp.companyName,
      positionTitle: currentApp.positionTitle,
      startDate: currentApp.startDate,
      endDate: currentApp.endDate,
      submittedDate: currentApp.submittedDate,
      status: newStatus,
      coordinatorComment: newComment
    });
  } catch (error) {
    console.error('Update application error:', error);
    res.status(500).json({ error: 'Server error during update.' });
  }
});

// Student Resubmit Application API (only allowed when status is 'changesRequested')
app.put('/api/applications/:id/resubmit', requireAuth, async (req, res) => {
  const { id } = req.params;
  const { companyName, positionTitle, startDate, endDate } = req.body;
  const { id: userId, role: userRole } = req.user;

  // Authorization: Only students can edit/resubmit their applications
  if (userRole !== 'student') {
    return res.status(403).json({ error: 'Forbidden. Only students can edit and resubmit applications.' });
  }

  // Field validations
  if (!companyName || !positionTitle || !startDate || !endDate) {
    return res.status(400).json({ error: 'All fields are required.' });
  }

  // Date sequence validation
  if (new Date(startDate) >= new Date(endDate)) {
    return res.status(400).json({ error: 'Start Date must be before End Date.' });
  }

  try {
    // Check if application exists
    const [apps] = await db.query('SELECT * FROM applications WHERE id = ?', [id]);
    if (apps.length === 0) {
      return res.status(404).json({ error: 'Application not found.' });
    }

    const application = apps[0];

    // Ownership check
    if (application.student_id !== userId) {
      return res.status(403).json({ error: 'Forbidden. You do not own this application.' });
    }

    // Status check: Must be changesRequested
    if (application.status !== 'changesRequested') {
      return res.status(400).json({ error: 'Only applications with changes requested can be edited and resubmitted.' });
    }

    const submittedDate = new Date().toISOString().split('T')[0];

    // Reset status to 'submitted' on resubmit
    await db.query(
      `UPDATE applications 
       SET companyName = ?, positionTitle = ?, startDate = ?, endDate = ?, submittedDate = ?, status = 'submitted' 
       WHERE id = ?`,
      [companyName, positionTitle, startDate, endDate, submittedDate, id]
    );

    res.json({
      id: application.id,
      student_id: application.student_id,
      studentName: application.studentName,
      companyName,
      positionTitle,
      startDate,
      endDate,
      submittedDate,
      status: 'submitted',
      coordinatorComment: application.coordinatorComment
    });
  } catch (error) {
    console.error('Resubmit application error:', error);
    res.status(500).json({ error: 'Server error during resubmission.' });
  }
});

// Start Server
app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
