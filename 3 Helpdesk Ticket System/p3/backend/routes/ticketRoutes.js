const express = require('express');
const router = express.Router();
const ticketService = require('../services/ticketService');
const { checkRole } = require('../middleware/authMiddleware');

const VALID_CATEGORIES = ['Software', 'Hardware', 'Network', 'Billing', 'Other'];
const VALID_STATUSES = ['open', 'inProgress', 'resolved', 'closed'];

// Get tickets (Both roles allowed, but filters are role-restricted)
router.get('/', checkRole(['User', 'Support agent']), async (req, res) => {
  try {
    const filters = {};
    if (req.query.category) filters.category = req.query.category;
    if (req.query.status) filters.status = req.query.status;

    // Enforce that Users can only retrieve their own tickets
    if (req.user.role === 'User') {
      filters.submittedUser = req.user.username;
    } else {
      // Support agents can filter by user
      if (req.query.submittedUser) {
        filters.submittedUser = req.query.submittedUser;
      }
    }

    const tickets = await ticketService.getAll(filters);
    res.json(tickets);
  } catch (error) {
    console.error('Error fetching tickets:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Submit ticket (Only User role)
router.post('/', checkRole(['User']), async (req, res) => {
  try {
    const { title, description, category, submittedUser } = req.body;

    // Validation
    if (!title || !title.trim()) {
      return res.status(400).json({ error: 'Title is required.' });
    }
    if (!description || !description.trim()) {
      return res.status(400).json({ error: 'Description is required.' });
    }
    if (!category || !VALID_CATEGORIES.includes(category)) {
      return res.status(400).json({ error: 'Valid category is required.' });
    }
    if (!submittedUser || submittedUser !== req.user.username) {
      return res.status(400).json({ error: 'Invalid user session details.' });
    }

    const newTicket = await ticketService.create({
      title: title.trim(),
      description: description.trim(),
      category,
      submittedUser
    });

    res.status(201).json(newTicket);
  } catch (error) {
    console.error('Error creating ticket:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Update ticket status or agent response (Support agent can do any, User can only reopen their own closed tickets once)
router.patch('/:id', checkRole(['User', 'Support agent']), async (req, res) => {
  try {
    const { id } = req.params;
    const { status, agentResponse } = req.body;

    const ticket = await ticketService.getById(id);
    if (!ticket) {
      return res.status(404).json({ error: 'Ticket not found.' });
    }

    // Role-based logic
    if (req.user.role === 'User') {
      // 1. Ownership check
      if (ticket.submittedUser !== req.user.username) {
        return res.status(403).json({ error: 'Access denied. You do not own this ticket.' });
      }

      // 2. Validate actions allowed for user
      if (agentResponse !== undefined) {
        return res.status(403).json({ error: 'Access denied. Users cannot edit agent responses.' });
      }

      if (status !== 'open') {
        return res.status(403).json({ error: 'Access denied. Users can only transition status to reopen (open).' });
      }

      // 3. Reopen validation rules
      if (ticket.status !== 'closed') {
        return res.status(400).json({ error: 'Only closed tickets can be reopened.' });
      }

      if (ticket.reopened >= 1) {
        return res.status(400).json({ error: 'This ticket has already been reopened once and cannot be reopened again.' });
      }

      // 4. Perform reopen
      const updatedTicket = await ticketService.reopen(id);
      return res.json(updatedTicket);
    }

    // Support Agent logic
    let updatedTicket = ticket;

    // Handle status update if provided
    if (status !== undefined) {
      if (!VALID_STATUSES.includes(status)) {
        return res.status(400).json({ error: `Invalid status. Must be one of: ${VALID_STATUSES.join(', ')}` });
      }
      updatedTicket = await ticketService.updateStatus(id, status);
    }

    // Handle agent response update if provided
    if (agentResponse !== undefined) {
      updatedTicket = await ticketService.addResponse(id, agentResponse);
    }

    res.json(updatedTicket);
  } catch (error) {
    console.error('Error updating ticket:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

module.exports = router;
