const express = require('express');
const crypto = require('crypto');
const db = require('../db');

const router = express.Router();

// Login endpoint
router.post('/login', async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password are required' });
  }

  try {
    const [rows] = await db.query(
      'SELECT id, username, role FROM users WHERE username = ? AND password = ?',
      [username, password]
    );

    if (rows.length === 0) {
      return res.status(401).json({ error: 'Invalid username or password' });
    }

    const user = rows[0];
    const token = crypto.randomBytes(32).toString('hex');

    await db.query(
      'UPDATE users SET session_token = ? WHERE id = ?',
      [token, user.id]
    );

    res.json({
      token,
      user: { id: user.id, username: user.username, role: user.role }
    });
  } catch (error) {
    console.error('Login database error:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

module.exports = router;
