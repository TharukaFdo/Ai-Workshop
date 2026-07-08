const express = require('express');
const router = express.Router();
const ticketService = require('../services/ticketService');
const { verifyToken, requireRole } = require('../middleware/auth');

// Get tickets with filters
router.get('/', verifyToken, async (req, res) => {
  const { status, category, submittedUserId } = req.query;
  const isAgent = req.user.role === 'agent';

  try {
    const tickets = await ticketService.getAll({
      status,
      category,
      submittedUserId,
      isAgent
    });
    res.json(tickets);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch tickets.' });
  }
});

// Create ticket route (User-only, with trim validations)
router.post('/', verifyToken, requireRole('user'), async (req, res) => {
  const { title, description, category } = req.body;

  if (!title || typeof title !== 'string' || !title.trim() ||
      !description || typeof description !== 'string' || !description.trim() ||
      !category || typeof category !== 'string' || !category.trim()) {
    return res.status(400).json({ error: 'Title, description, and category are required and cannot be empty.' });
  }

  const allowedCategories = ['General', 'Technical', 'Billing', 'Hardware'];
  const trimmedCategory = category.trim();
  if (!allowedCategories.includes(trimmedCategory)) {
    return res.status(400).json({ error: `Category must be one of: ${allowedCategories.join(', ')}` });
  }

  try {
    const ticketId = await ticketService.create({
      title: title.trim(),
      description: description.trim(),
      category: trimmedCategory,
      submittedUserId: req.user.id
    });
    res.status(201).json({ message: 'Ticket created successfully.', ticketId });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to create ticket.' });
  }
});

// Get single ticket details
router.get('/:id', verifyToken, async (req, res) => {
  const { id } = req.params;

  try {
    const ticket = await ticketService.getById(id);

    if (!ticket) {
      return res.status(404).json({ error: 'Ticket not found.' });
    }

    // Access control check
    if (req.user.role !== 'agent' && ticket.submittedUserId !== req.user.id) {
      return res.status(403).json({ error: 'Access denied. You do not own this ticket.' });
    }

    res.json(ticket);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch ticket details.' });
  }
});

// Update agent response (Agent-only)
router.put('/:id/response', verifyToken, requireRole('agent'), async (req, res) => {
  const { id } = req.params;
  const { agentResponse } = req.body;

  if (agentResponse === undefined || agentResponse.trim() === '') {
    return res.status(400).json({ error: 'Response body cannot be empty.' });
  }

  try {
    const success = await ticketService.updateResponse(id, agentResponse);

    if (!success) {
      return res.status(404).json({ error: 'Ticket not found.' });
    }

    res.json({ message: 'Response added successfully.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to add response.' });
  }
});

// Update ticket status / closure (Agent can update to any status, User can only reopen their own closed tickets once)
router.put('/:id/status', verifyToken, async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  const allowedStatuses = ['open', 'inProgress', 'resolved', 'closed'];
  if (!status || !allowedStatuses.includes(status)) {
    return res.status(400).json({ error: 'Invalid status value.' });
  }

  try {
    const ticket = await ticketService.getById(id);
    if (!ticket) {
      return res.status(404).json({ error: 'Ticket not found.' });
    }

    // Role-based validation
    if (req.user.role === 'user') {
      // 1. Ownership check
      if (ticket.submittedUserId !== req.user.id) {
        return res.status(403).json({ error: 'Access denied. You do not own this ticket.' });
      }

      // 2. Can only update to open (reopen)
      if (status !== 'open') {
        return res.status(403).json({ error: 'Access denied. Users can only transition status to reopen (open).' });
      }

      // 3. Reopen limits check
      if (ticket.status !== 'closed') {
        return res.status(400).json({ error: 'Only closed tickets can be reopened.' });
      }

      if (ticket.reopened >= 1) {
        return res.status(400).json({ error: 'This ticket has already been reopened once.' });
      }

      // Perform reopen
      await ticketService.reopen(id);
      return res.json({ message: 'Ticket reopened successfully.' });
    }

    // Support Agent status update
    const success = await ticketService.updateStatus(id, status);
    if (!success) {
      return res.status(404).json({ error: 'Ticket not found.' });
    }

    res.json({ message: `Ticket status updated to ${status}.` });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update ticket status.' });
  }
});

module.exports = router;
