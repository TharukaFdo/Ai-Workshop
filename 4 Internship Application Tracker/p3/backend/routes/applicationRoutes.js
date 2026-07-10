const express = require('express');
const router = express.Router();
const service = require('../services/applicationService');
const { authMiddleware } = require('../middleware/authMiddleware');
const db = require('../config/db');

// Apply auth middleware to all applications routes
router.use(authMiddleware);

// Valid status list
const VALID_STATUSES = ['submitted', 'underReview', 'approved', 'rejected', 'changesRequested'];

/**
 * GET /api/applications
 * Fetch list of applications (students can only view their own; coordinators see all)
 */
router.get('/', async (req, res) => {
  try {
    const filters = {};

    if (req.user.role === 'student') {
      // Force student to view only their own records
      filters.studentId = req.user.id;
    } else {
      // Coordinators can optionally filter by studentId, company, and status
      filters.studentId = req.query.studentId ? parseInt(req.query.studentId) : null;
    }

    if (req.query.companyName) {
      filters.companyName = req.query.companyName;
    }
    if (req.query.status) {
      filters.status = req.query.status;
    }

    const results = await service.getApplications(filters);
    res.json(results);
  } catch (error) {
    console.error('Error fetching applications:', error);
    res.status(500).json({ error: 'Failed to fetch applications.' });
  }
});

/**
 * GET /api/applications/:id
 * Retrieve details of a single application (verified with ownership checks)
 */
router.get('/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const app = await service.getApplicationById(id);
    if (!app) {
      return res.status(404).json({ error: 'Application not found.' });
    }

    // Security: Student cannot read other student's applications
    if (req.user.role === 'student' && app.student_id !== req.user.id) {
      return res.status(403).json({ error: 'Forbidden. You do not own this application.' });
    }

    res.json(app);
  } catch (error) {
    console.error('Error fetching application details:', error);
    res.status(500).json({ error: 'Failed to fetch application details.' });
  }
});

/**
 * POST /api/applications
 * Student creates/submits a new internship application
 */
router.post('/', async (req, res) => {
  try {
    // Security: Only students can submit applications
    if (req.user.role !== 'student') {
      return res.status(403).json({ error: 'Forbidden. Only students can submit applications.' });
    }

    const { companyName, positionTitle, startDate, endDate, submittedDate } = req.body;

    // Field presence validation
    if (!companyName || !positionTitle || !startDate || !endDate || !submittedDate) {
      return res.status(400).json({ error: 'All fields (Company, Position, Start Date, End Date, Submitted Date) are required.' });
    }

    // Chronological date validation
    if (new Date(endDate) <= new Date(startDate)) {
      return res.status(400).json({ error: 'End Date must be strictly after the Start Date.' });
    }

    // Security: Lookup verified user identity from DB instead of trusting client input
    const [userRows] = await db.query('SELECT username FROM users WHERE id = ?', [req.user.id]);
    if (!userRows || userRows.length === 0) {
      return res.status(401).json({ error: 'Unauthorized. User record not found.' });
    }
    const verifiedStudentName = userRows[0].username;

    const newId = await service.createApplication(req.user.id, {
      studentName: verifiedStudentName,
      companyName,
      positionTitle,
      startDate,
      endDate,
      submittedDate
    });

    res.status(201).json({ id: newId, message: 'Application submitted successfully.' });
  } catch (error) {
    console.error('Error creating application:', error);
    res.status(500).json({ error: 'Failed to submit application.' });
  }
});

/**
 * PUT /api/applications/:id
 * Student updates their own application details (only if status is 'submitted' and owned by student)
 */
router.put('/:id', async (req, res) => {
  try {
    // Security: Only students can update application parameters
    if (req.user.role !== 'student') {
      return res.status(403).json({ error: 'Forbidden. Only students can edit applications.' });
    }

    const id = parseInt(req.params.id);
    const { companyName, positionTitle, startDate, endDate } = req.body;

    // Validation checks
    if (!companyName || !positionTitle || !startDate || !endDate) {
      return res.status(400).json({ error: 'All fields (Company, Position, Start Date, End Date) are required for update.' });
    }

    if (new Date(endDate) <= new Date(startDate)) {
      return res.status(400).json({ error: 'End Date must be strictly after the Start Date.' });
    }

    const existing = await service.getApplicationById(id);
    if (!existing) {
      return res.status(404).json({ error: 'Application not found.' });
    }

    // Security: Student must own the application
    if (existing.student_id !== req.user.id) {
      return res.status(403).json({ error: 'Forbidden. You do not own this application.' });
    }

    // Business Logic: Block update if status is not 'changesRequested'
    if (existing.status !== 'changesRequested') {
      return res.status(400).json({ error: 'Only applications in the "changesRequested" stage can be modified.' });
    }

    // Security: Lookup verified user identity from DB instead of trusting client input
    const [userRows] = await db.query('SELECT username FROM users WHERE id = ?', [req.user.id]);
    if (!userRows || userRows.length === 0) {
      return res.status(401).json({ error: 'Unauthorized. User record not found.' });
    }
    const verifiedStudentName = userRows[0].username;

    const success = await service.updateStudentApplication(id, req.user.id, {
      studentName: verifiedStudentName,
      companyName,
      positionTitle,
      startDate,
      endDate
    });

    if (!success) {
      return res.status(400).json({ error: 'Update failed.' });
    }

    res.json({ message: 'Application updated successfully.' });
  } catch (error) {
    console.error('Error updating application:', error);
    res.status(500).json({ error: 'Failed to update application.' });
  }
});

/**
 * PUT /api/applications/:id/decision
 * Coordinator reviews, sets status, and adds comments (forbidden for students)
 */
router.put('/:id/decision', async (req, res) => {
  try {
    // Security: Only coordinators can edit comments or approve/reject applications
    if (req.user.role !== 'coordinator') {
      return res.status(403).json({ error: 'Forbidden. Only coordinators can review applications.' });
    }

    const id = parseInt(req.params.id);
    const { status, comment } = req.body;

    if (!status || !VALID_STATUSES.includes(status)) {
      return res.status(400).json({ error: 'Invalid status update. Choose submitted, underReview, approved, or rejected.' });
    }

    const success = await service.updateCoordinatorDecision(id, status, comment);
    if (!success) {
      return res.status(404).json({ error: 'Application not found.' });
    }

    res.json({ message: 'Review decision recorded successfully.' });
  } catch (error) {
    console.error('Error processing coordinator decision:', error);
    res.status(500).json({ error: 'Failed to update application status.' });
  }
});

module.exports = router;
