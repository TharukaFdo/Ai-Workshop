const express = require('express');
const router = express.Router();
const userService = require('../services/userService');
const { verifyToken, requireRole } = require('../middleware/auth');

// Fetch all users list (Agent-only, for filter options)
router.get('/', verifyToken, requireRole('agent'), async (req, res) => {
  try {
    const users = await userService.getAllUsers();
    res.json(users);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch users.' });
  }
});

module.exports = router;
