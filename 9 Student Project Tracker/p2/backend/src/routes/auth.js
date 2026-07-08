const express = require('express');
const router = express.Router();
const db = require('../db');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

// POST /api/auth/login - Database-backed secure login
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: "Username and password are required." });
    }

    // Retrieve user by username
    const [user] = await db.query(
      'SELECT id, username, password, role, full_name FROM users WHERE username = ?',
      [username]
    );

    // Verify user exists and check hashed password
    if (!user || !bcrypt.compareSync(password, user.password)) {
      return res.status(401).json({ error: "Invalid username or password." });
    }

    // Generate secure session token: <userId>.<hmacSignature>
    const secret = process.env.JWT_SECRET || 'fallback_secret';
    const signature = crypto.createHmac('sha256', secret)
      .update(user.id.toString())
      .digest('hex');
    const token = `${user.id}.${signature}`;

    res.json({
      message: "Login successful",
      token,
      user: {
        id: user.id,
        username: user.username,
        role: user.role,
        full_name: user.full_name
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
