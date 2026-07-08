const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const dbService = require('../services/dbService');
const { signToken } = require('../middleware/authMiddleware');

function hashPassword(password) {
  return crypto.createHash('sha256').update(password).digest('hex');
}

// POST /api/auth/login
router.post('/login', async (req, res, next) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ success: false, message: 'Username and password are required.' });
    }

    const user = await dbService.getUserByUsername(username);
    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid username or password.' });
    }

    const inputHash = hashPassword(password);
    if (inputHash !== user.password_hash) {
      return res.status(401).json({ success: false, message: 'Invalid username or password.' });
    }

    const token = signToken(user.id);
    res.json({
      success: true,
      token,
      user: {
        id: user.id,
        username: user.username,
        role: user.role
      }
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
