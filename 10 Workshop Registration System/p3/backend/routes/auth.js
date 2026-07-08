const express = require('express');
const router = express.Router();
const AuthService = require('../services/authService');

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required.' });
    }

    const user = await AuthService.login(email, password);
    // For the workshop prototype, we will return the user info.
    // The email acts as our session token (x-auth-token), which is verified
    // against the database on the backend on every request.
    res.json({
      message: 'Login successful',
      user: {
        id: user.id,
        email: user.email,
        role: user.role
      },
      token: user.email // Simple token format
    });
  } catch (error) {
    res.status(401).json({ error: error.message });
  }
});

module.exports = router;
