const express = require('express');
const router = express.Router();
const db = require('../config/db');
const { hashPassword } = require('../utils/hash');

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    
    if (!username || !password) {
      return res.status(400).json({ message: 'Username and password are required.' });
    }

    // Look up user in database
    const [rows] = await db.query('SELECT username, password_hash, role, doctor_name FROM app_users WHERE username = ?', [username]);
    const user = rows[0];

    if (!user) {
      return res.status(401).json({ message: 'Invalid username or password.' });
    }

    // Verify SHA-256 password hash
    const inputHash = hashPassword(password);
    if (inputHash !== user.password_hash) {
      return res.status(401).json({ message: 'Invalid username or password.' });
    }

    // Return authenticated details (including a token which is the username for mock session verification)
    res.json({
      username: user.username,
      role: user.role,
      doctorName: user.doctor_name,
      token: user.username // Simplified token for workshop prototype
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
