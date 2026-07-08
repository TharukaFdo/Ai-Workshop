const express = require('express');
const router = express.Router();
const db = require('../db');

// POST /api/auth/login
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

    res.json({
      id: rows[0].id,
      username: rows[0].username,
      role: rows[0].role
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Server database error during login' });
  }
});

module.exports = router;
