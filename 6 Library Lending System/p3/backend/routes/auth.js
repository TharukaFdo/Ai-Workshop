const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const db = require('../config/db');
const { hashPassword } = require('../utils/hash');

const TOKEN_SECRET = process.env.TOKEN_SECRET || 'library_secret_key_12345';

/**
 * POST /api/auth/login
 * Log in a user and generate a signed session token.
 */
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ message: 'Username and password are required.' });
    }

    const hashedPassword = hashPassword(password);

    // Verify against MySQL DB
    const [rows] = await db.query(
      'SELECT id, username, role FROM app_users WHERE username = ? AND password = ?',
      [username, hashedPassword]
    );
    const user = rows[0];

    if (!user) {
      return res.status(401).json({ message: 'Invalid username or password.' });
    }

    // Generate custom signed token: id.role.signature
    const payload = `${user.id}.${user.role}`;
    const signature = crypto
      .createHmac('sha256', TOKEN_SECRET)
      .update(payload)
      .digest('hex');
    const token = `${payload}.${signature}`;

    res.json({
      token,
      user: {
        id: user.id,
        username: user.username,
        role: user.role
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
