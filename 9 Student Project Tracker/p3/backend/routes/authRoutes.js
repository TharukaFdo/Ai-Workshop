const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const userService = require('../services/userService');

// Simple mock login endpoint
router.post('/login', async (req, res) => {
  const { username, password } = req.body;

  try {
    const user = await userService.getUserByUsername(username);

    if (!user) {
      return res.status(401).json({ error: 'Invalid username or password' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid username or password' });
    }

    // Return user info (excluding password)
    const { password: _, ...userInfo } = user;
    res.json(userInfo);
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
