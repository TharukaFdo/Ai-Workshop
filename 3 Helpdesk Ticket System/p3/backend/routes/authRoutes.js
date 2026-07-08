const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const ticketService = require('../services/ticketService');

const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_workshop_key';

// Helper to sign username into a simple session token
function signToken(username) {
  const signature = crypto
    .createHmac('sha256', JWT_SECRET)
    .update(username)
    .digest('hex');
  return `${username}.${signature}`;
}

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password are required.' });
    }

    const user = await ticketService.getUserByUsername(username);
    if (!user) {
      return res.status(401).json({ error: 'Invalid username or password.' });
    }

    // Hash the password input with SHA-256
    const inputHash = crypto.createHash('sha256').update(password).digest('hex');
    const isMatch = (password === user.password) || 
                    (inputHash === user.password_hash) || 
                    (inputHash === user.password) || 
                    (password === user.password_hash);
                    
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid username or password.' });
    }

    // Generate signed token
    const token = signToken(user.username);

    res.json({
      token,
      user: {
        username: user.username,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

module.exports = {
  router,
  JWT_SECRET
};
