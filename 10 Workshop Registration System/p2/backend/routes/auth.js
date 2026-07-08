const express = require('express');
const crypto = require('crypto');
const pool = require('../db');
const authenticateSession = require('../middleware/auth');

const router = express.Router();

// Database-backed login
router.post('/login', async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password are required.' });
  }

  try {
    // Find the user by credentials in database
    const [rows] = await pool.query(
      'SELECT id, username, role FROM users WHERE username = ? AND password = ?',
      [username, password]
    );

    if (rows.length === 0) {
      return res.status(401).json({ error: 'Invalid username or password.' });
    }

    const user = rows[0];

    // Generate secure session token dynamically
    const sessionToken = crypto.randomBytes(32).toString('hex');

    // Save session token directly in the database
    await pool.query(
      'UPDATE users SET session_token = ? WHERE id = ?',
      [sessionToken, user.id]
    );

    return res.json({
      token: sessionToken,
      user: {
        id: user.id,
        username: user.username,
        role: user.role
      }
    });
  } catch (err) {
    return res.status(500).json({ error: 'Database login error.', details: err.message });
  }
});

// Logout Route (authenticated users)
router.post('/logout', authenticateSession, async (req, res) => {
  try {
    await pool.query('UPDATE users SET session_token = NULL WHERE id = ?', [req.user.id]);
    return res.json({ message: 'Logged out successfully.' });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to log out.', details: err.message });
  }
});

module.exports = router;
