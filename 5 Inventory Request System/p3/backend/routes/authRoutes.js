const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const db = require('../config/db');
const { JWT_SECRET } = require('../middleware/authMiddleware');

/**
 * POST /api/auth/login
 * Validates credentials and returns JWT token.
 */
router.post('/login', async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password are required.' });
  }

  try {
    const [rows] = await db.query('SELECT * FROM users WHERE username = ?', [username]);
    const user = rows[0];

    if (!user) {
      return res.status(401).json({ error: 'Invalid username or password.' });
    }

    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid username or password.' });
    }

    // Generate JWT token containing the user ID
    const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '8h' });

    res.json({
      token,
      user: {
        id: user.id,
        username: user.username,
        role: user.role,
        full_name: user.full_name
      }
    });
  } catch (error) {
    console.error('Error in login auth:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

module.exports = router;
