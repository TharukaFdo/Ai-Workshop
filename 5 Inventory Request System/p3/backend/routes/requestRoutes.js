const express = require('express');
const router = express.Router();
const requestService = require('../services/requestService');
const { authenticate, requireRole } = require('../middleware/authMiddleware');
const { validateRequestInput } = require('../utils/validator');

// Get request listing with filtering (Secured with authenticate middleware)
router.get('/', authenticate, async (req, res) => {
  try {
    const user = req.user;
    const { itemName, requesterName, status } = req.query;

    // Staff members are strictly limited to their own requests
    const requesterId = user.role === 'staff' ? user.id : undefined;

    const requests = await requestService.getRequests({
      itemName,
      requesterName,
      requesterId,
      status
    });

    res.json(requests);
  } catch (error) {
    console.error('Error fetching requests:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Submit a new request (Only staff members allowed)
router.post('/', authenticate, requireRole('staff'), async (req, res) => {
  try {
    const user = req.user;
    const { itemName, quantity, reason, requestedDate } = req.body;

    const validationError = validateRequestInput({ itemName, quantity, reason, requestedDate });
    if (validationError) {
      return res.status(400).json({ error: validationError });
    }

    const request = await requestService.createRequest({
      itemName,
      quantity: parseInt(quantity),
      reason,
      requestedDate,
      requesterId: user.id,
      requesterName: user.full_name
    });

    res.status(201).json(request);
  } catch (error) {
    console.error('Error creating request:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Update a pending request (Only owner allowed)
router.put('/:id', authenticate, async (req, res) => {
  try {
    const user = req.user;
    const { itemName, quantity, reason, requestedDate } = req.body;

    const validationError = validateRequestInput({ itemName, quantity, reason, requestedDate });
    if (validationError) {
      return res.status(400).json({ error: validationError });
    }

    const updated = await requestService.updateRequestDetails(parseInt(req.params.id), user.id, {
      itemName,
      quantity: parseInt(quantity),
      reason,
      requestedDate
    });

    res.json(updated);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Approve or Reject request (Only storekeepers allowed, self-approval blocked)
router.put('/:id/approve', authenticate, requireRole('storekeeper'), async (req, res) => {
  try {
    const user = req.user;
    const { status, storekeeperNote } = req.body;
    if (status !== 'approved' && status !== 'rejected') {
      return res.status(400).json({ error: 'Invalid status transition.' });
    }

    const existing = await requestService.getRequestById(parseInt(req.params.id));
    if (!existing) {
      return res.status(404).json({ error: 'Request not found.' });
    }

    // Staff must not approve their own requests
    if (existing.requester_id === user.id) {
      return res.status(403).json({ error: 'Forbidden: You cannot approve or reject your own request.' });
    }

    const updated = await requestService.updateRequestStatus(parseInt(req.params.id), {
      status,
      storekeeperNote: storekeeperNote || null
    });

    res.json(updated);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Issue request (Only storekeepers allowed, self-issuing blocked)
router.put('/:id/issue', authenticate, requireRole('storekeeper'), async (req, res) => {
  try {
    const user = req.user;
    const { issuedQuantity } = req.body;
    if (!issuedQuantity || parseInt(issuedQuantity) <= 0) {
      return res.status(400).json({ error: 'Issued quantity must be positive.' });
    }

    const existing = await requestService.getRequestById(parseInt(req.params.id));
    if (!existing) {
      return res.status(404).json({ error: 'Request not found.' });
    }

    // Staff must not issue their own requests
    if (existing.requester_id === user.id) {
      return res.status(403).json({ error: 'Forbidden: You cannot issue items for your own request.' });
    }

    const updated = await requestService.issueRequest(parseInt(req.params.id), {
      issuedQuantity: parseInt(issuedQuantity)
    });

    res.json(updated);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

module.exports = router;
