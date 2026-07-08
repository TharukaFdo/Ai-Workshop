const express = require('express');
const router = express.Router();
const requestService = require('../services/requestService');
const userService = require('../services/userService');
const authUtils = require('../utils/auth');
const { PRIORITIES, STATUSES } = require('../config/constants');

// Helper middleware to extract and validate authenticated user from signed token
const checkUser = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Authorization token is missing or malformed.' });
  }

  const token = authHeader.substring(7); // Extract token part
  const payload = authUtils.verifyToken(token);

  if (!payload) {
    return res.status(401).json({ error: 'Invalid or expired authorization token.' });
  }

  try {
    // Load user and role from database
    const user = await userService.getUserById(payload.id);
    if (!user) {
      return res.status(401).json({ error: 'User not found in database.' });
    }
    req.user = user;
    next();
  } catch (error) {
    console.error('Auth verification error:', error);
    res.status(500).json({ error: 'Authorization verification failed.' });
  }
};

// GET requests (Filtered by role and filters)
router.get('/', checkUser, async (req, res) => {
  try {
    const { location, priority, status } = req.query;
    let data;

    if (req.user.role === 'Requester') {
      // Requesters can only see their own requests
      data = await requestService.getRequestsByRequesterId(req.user.id, { location, priority, status });
    } else {
      // Technicians see all requests
      data = await requestService.getAllRequests({ location, priority, status });
    }
    res.json(data);
  } catch (error) {
    console.error('GET /requests error:', error);
    res.status(500).json({ error: 'Failed to retrieve requests.' });
  }
});

// POST a new maintenance request
router.post('/', checkUser, async (req, res) => {
  try {
    const { title, description, location, priority, requesterName } = req.body;

    // Validation
    if (!title || !description || !location || !priority || !requesterName) {
      return res.status(400).json({ error: 'All fields (title, description, location, priority, requesterName) are required.' });
    }

    if (!PRIORITIES.includes(priority)) {
      return res.status(400).json({ error: `Priority must be one of: ${PRIORITIES.join(', ')}` });
    }

    if (req.user.role !== 'Requester') {
      return res.status(403).json({ error: 'Only Requesters can submit new maintenance requests.' });
    }

    const newRequest = await requestService.createRequest({
      title: title.trim(),
      description: description.trim(),
      location: location.trim(),
      priority,
      requesterName: requesterName.trim(),
      requesterId: req.user.id
    });

    res.status(201).json(newRequest);
  } catch (error) {
    console.error('POST /requests error:', error);
    res.status(500).json({ error: 'Failed to create request.' });
  }
});

// PUT (update details) - Requester workflow
router.put('/:id', checkUser, async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, location, priority } = req.body;

    // Validation
    if (!title || !description || !location || !priority) {
      return res.status(400).json({ error: 'All fields are required.' });
    }

    if (!PRIORITIES.includes(priority)) {
      return res.status(400).json({ error: `Priority must be one of: ${PRIORITIES.join(', ')}` });
    }

    // Retrieve request first to verify state and ownership
    const request = await requestService.getRequestById(id);
    if (!request) {
      return res.status(404).json({ error: 'Request not found.' });
    }

    // Role verification
    if (req.user.role !== 'Requester') {
      return res.status(403).json({ error: 'Only Requesters can edit request details.' });
    }

    // Ownership verification
    if (request.requester_id !== req.user.id) {
      return res.status(403).json({ error: 'You do not own this request.' });
    }

    // Workflow state constraint
    if (request.status !== 'submitted') {
      return res.status(400).json({ error: 'Requests that are in progress or completed/closed cannot be edited.' });
    }

    const updated = await requestService.updateRequestDetails(id, {
      title: title.trim(),
      description: description.trim(),
      location: location.trim(),
      priority
    });
    if (!updated) {
      return res.status(500).json({ error: 'Failed to update request.' });
    }

    res.json({ message: 'Request details updated successfully.' });
  } catch (error) {
    console.error('PUT /requests/:id error:', error);
    res.status(500).json({ error: 'Failed to update request details.' });
  }
});

// PATCH (update status / notes) - Technician workflow
router.patch('/:id', checkUser, async (req, res) => {
  try {
    const { id } = req.params;
    const { status, technicianNote } = req.body;

    // Validation
    if (!status) {
      return res.status(400).json({ error: 'Status is required.' });
    }

    if (!STATUSES.includes(status)) {
      return res.status(400).json({ error: `Invalid status value. Must be one of: ${STATUSES.join(', ')}` });
    }

    // Retrieve request
    const request = await requestService.getRequestById(id);
    if (!request) {
      return res.status(404).json({ error: 'Request not found.' });
    }

    // Role verification
    if (req.user.role !== 'Technician') {
      return res.status(403).json({ error: 'Only Technicians can update status progress and technician notes.' });
    }

    // High priority close validation constraint
    if (status === 'closed' && request.priority === 'High') {
      const pendingNote = technicianNote ? technicianNote.trim() : '';
      const existingNote = request.technician_note ? request.technician_note.trim() : '';
      if (!pendingNote && !existingNote) {
        return res.status(400).json({ error: 'High priority requests cannot be closed without a technician note.' });
      }
    }

    const updated = await requestService.updateRequestStatusAndNotes(id, {
      status,
      technicianNote: technicianNote ? technicianNote.trim() : (request.technician_note || '')
    });
    if (!updated) {
      return res.status(500).json({ error: 'Failed to update request status/notes.' });
    }

    res.json({ message: 'Request status and notes updated successfully.' });
  } catch (error) {
    console.error('PATCH /requests/:id error:', error);
    res.status(500).json({ error: 'Failed to update status and notes.' });
  }
});

module.exports = router;
