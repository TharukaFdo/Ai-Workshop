const express = require('express');
const router = express.Router();
const db = require('../config/db');
const { generateToken } = require('../middleware/authMiddleware');
const { hashPassword } = require('../utils/hash');

/**
 * POST /api/auth/login
 * Verifies username and hashed password, returning a signed token and user role.
 */
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password are required.' });
    }

    // Lookup user in DB
    const [rows] = await db.query('SELECT * FROM users WHERE username = ?', [username]);
    const user = rows[0];

    if (!user) {
      return res.status(401).json({ error: 'Invalid username or password.' });
    }

    // Hash and compare password
    const hashed = hashPassword(password);
    if (user.password !== hashed) {
      return res.status(401).json({ error: 'Invalid username or password.' });
    }

    // Generate token
    const token = generateToken(user.id, user.role);

    res.json({
      token,
      user: {
        id: user.id,
        username: user.username,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal login server error.' });
  }
});

module.exports = router;
