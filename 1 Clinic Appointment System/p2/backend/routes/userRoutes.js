const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const db = require('../db');
const authenticateToken = require('../middleware/authMiddleware');

// Login endpoint: Authenticate, generate token, and save to DB
router.post('/login', async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password are required' });
  }

  try {
    const [users] = await db.query('SELECT id, username, role FROM users WHERE username = ? AND password = ?', [username, password]);
    
    if (users.length === 0) {
      return res.status(401).json({ error: 'Invalid username or password' });
    }

    const user = users[0];
    // Generate a unique secure random session token
    const sessionToken = crypto.randomBytes(32).toString('hex');

    // Persist token in database
    await db.query('UPDATE users SET session_token = ? WHERE id = ?', [sessionToken, user.id]);

    res.json({
      message: 'Login successful',
      token: sessionToken,
      user: {
        id: user.id,
        username: user.username,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Database error during login' });
  }
});

// Logout endpoint: Clear session token in database
router.post('/logout', authenticateToken, async (req, res) => {
  try {
    await db.query('UPDATE users SET session_token = NULL WHERE id = ?', [req.user.id]);
    res.json({ message: 'Logged out successfully' });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({ error: 'Database error during logout' });
  }
});

// Fetch current user details dynamically from session token
router.get('/me', authenticateToken, (req, res) => {
  res.json({ user: req.user });
});

module.exports = router;
