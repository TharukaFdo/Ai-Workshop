const express = require('express');
const crypto = require('crypto');
const db = require('../db');

const router = express.Router();

// Login endpoint: Authenticate user against MySQL database and issue session token
router.post('/login', async (req, res) => {
  const { username } = req.body;
  if (!username) {
    return res.status(400).json({ error: 'Username is required.' });
  }

  try {
    const [rows] = await db.query('SELECT id, username, role FROM users WHERE username = ?', [username]);
    if (rows.length === 0) {
      return res.status(401).json({ error: 'Invalid username. Please check your credentials.' });
    }

    const user = rows[0];
    const token = crypto.randomUUID();

    await db.query('INSERT INTO sessions (token, userId) VALUES (?, ?)', [token, user.id]);

    res.json({ token, user: { id: user.id, username: user.username, role: user.role } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Logout endpoint: Destroy session token from database
router.post('/logout', async (req, res) => {
  const authHeader = req.headers['authorization'];
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    try {
      await db.query('DELETE FROM sessions WHERE token = ?', [token]);
    } catch (err) {
      // Ignore database failures during logout request
    }
  }
  res.json({ message: 'Logged out successfully.' });
});

module.exports = router;
