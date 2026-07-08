const express = require('express');
const router = Router = express.Router();
const projectService = require('../services/projectService');
const db = require('../config/db');

// Middleware to verify user role from the database
function checkRole(allowedRoles) {
  return async (req, res, next) => {
    const userId = req.headers['x-user-id'];

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized: Missing identity headers' });
    }

    try {
      const [rows] = await db.query('SELECT role, id, fullName FROM app_users WHERE id = ?', [userId]);
      const user = rows[0];

      if (!user) {
        return res.status(401).json({ error: 'Unauthorized: Invalid user session' });
      }

      if (!allowedRoles.includes(user.role)) {
        return res.status(403).json({ error: 'Forbidden: Insufficient permissions' });
      }

      req.user = { id: user.id, role: user.role, fullName: user.fullName };
      next();
    } catch (error) {
      console.error('Authorization middleware error:', error);
      res.status(500).json({ error: 'Internal server authorization error' });
    }
  };
}

// Helper middleware to validate common project payload fields
function validateProjectPayload(req, res, next) {
  const { title, description, category, supervisorName, submittedDate } = req.body;

  if (!title || !description || !category || !supervisorName || !submittedDate) {
    return res.status(400).json({ error: 'All fields (title, description, category, supervisorName, submittedDate) are required' });
  }

  const parsedDate = Date.parse(submittedDate);
  if (isNaN(parsedDate)) {
    return res.status(400).json({ error: 'submittedDate must be a valid date format (YYYY-MM-DD)' });
  }

  next();
}

// Get project submissions (students see only theirs or filter, supervisors see all)
router.get('/', checkRole(['student', 'supervisor']), async (req, res) => {
  const { supervisorName, category, status } = req.query;
  const filters = { supervisorName, category, status };

  try {
    let projects;
    if (req.user.role === 'student') {
      projects = await projectService.getProjectsByStudent(req.user.id, filters);
    } else {
      projects = await projectService.getAllProjects(filters);
    }
    res.json(projects);
  } catch (error) {
    console.error('Error fetching projects:', error);
    res.status(500).json({ error: 'Failed to fetch projects' });
  }
});

// Get single project details
router.get('/:id', checkRole(['student', 'supervisor']), async (req, res) => {
  const projectId = parseInt(req.params.id, 10);

  try {
    const project = await projectService.getProjectById(projectId);
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    // Access control: student can only view their own projects
    if (req.user.role === 'student' && project.student_id !== req.user.id) {
      return res.status(403).json({ error: 'Forbidden: Access to other students projects is denied' });
    }

    res.json(project);
  } catch (error) {
    console.error('Error fetching project:', error);
    res.status(500).json({ error: 'Failed to fetch project details' });
  }
});

// Create new project submission (student only)
router.post('/', checkRole(['student']), validateProjectPayload, async (req, res) => {
  const { title, description, category, supervisorName, submittedDate } = req.body;

  try {
    const projectId = await projectService.createProject({
      title,
      description,
      category,
      studentName: req.user.fullName, // SECURE: resolved from database record
      supervisorName,
      submittedDate,
      studentId: req.user.id
    });
    res.status(201).json({ id: projectId, message: 'Project submitted successfully' });
  } catch (error) {
    console.error('Error creating project:', error);
    res.status(500).json({ error: 'Failed to create project' });
  }
});

// Update student-editable fields of own project (student only)
router.put('/:id', checkRole(['student']), validateProjectPayload, async (req, res) => {
  const projectId = parseInt(req.params.id, 10);
  const { title, description, category, supervisorName, submittedDate } = req.body;

  try {
    const project = await projectService.getProjectById(projectId);
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    // Access control: verify ownership
    if (project.student_id !== req.user.id) {
      return res.status(403).json({ error: 'Forbidden: You can only update your own project submissions' });
    }

    // Workflow constraint: can only edit if status is 'revisionRequested'
    if (project.status !== 'revisionRequested') {
      return res.status(403).json({ error: 'Forbidden: You can only edit projects that have a status of revisionRequested' });
    }

    await projectService.updateProjectFields(projectId, {
      title,
      description,
      category,
      studentName: req.user.fullName, // SECURE: resolved from database record
      supervisorName,
      submittedDate
    });

    res.json({ message: 'Project details updated successfully' });
  } catch (error) {
    console.error('Error updating project:', error);
    res.status(500).json({ error: 'Failed to update project details' });
  }
});

// Update status & feedback (supervisor only)
router.put('/:id/review', checkRole(['supervisor']), async (req, res) => {
  const projectId = parseInt(req.params.id, 10);
  const { status, feedback } = req.body;

  // Validation
  const validStatuses = ['submitted', 'underReview', 'approved', 'rejected', 'revisionRequested'];
  if (!status || !validStatuses.includes(status)) {
    return res.status(400).json({ error: `Invalid status. Must be one of: ${validStatuses.join(', ')}` });
  }

  try {
    const project = await projectService.getProjectById(projectId);
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    await projectService.updateProjectStatusAndFeedback(projectId, status, feedback || null);
    res.json({ message: 'Project review and status updated successfully' });
  } catch (error) {
    console.error('Error reviewing project:', error);
    res.status(500).json({ error: 'Failed to update review status' });
  }
});

module.exports = router;
