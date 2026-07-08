const express = require('express');
const router = express.Router();
const db = require('../config/db');
const crypto = require('crypto');
const { validateRequiredFields } = require('../utils/validation');

// POST /api/auth/login - Validate login credentials and issue token
router.post('/login', async (req, res) => {
  const { username, password } = req.body;

  if (!validateRequiredFields(['username', 'password'], req.body)) {
    return res.status(400).json({ error: 'Username and password are required' });
  }

  try {
    const [rows] = await db.query('SELECT id, username, role FROM users WHERE username = ? AND password = ?', [username, password]);

    if (rows.length === 0) {
      return res.status(401).json({ error: 'Invalid username or password' });
    }

    const user = rows[0];

    // Generate random secure token
    const token = crypto.randomBytes(24).toString('hex');

    // Store token in the sessions database table
    await db.query('INSERT INTO sessions (token, user_id) VALUES (?, ?)', [token, user.id]);

    res.json({
      token: token,
      id: user.id,
      username: user.username,
      role: user.role
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Database error' });
  }
});

module.exports = router;
