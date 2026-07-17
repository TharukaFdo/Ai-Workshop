const express = require('express');
const router = express.Router();
const userService = require('../services/userService');

// Get all mock users
router.get('/', async (req, res) => {
  try {
    const users = await userService.getAllUsers();
    res.json(users);
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

module.exports = router;
