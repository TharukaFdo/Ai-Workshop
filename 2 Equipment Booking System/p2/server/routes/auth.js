import express from 'express';
import crypto from 'crypto';
import pool from '../db.js';

const router = express.Router();

router.post('/login', async (req, res) => {
  const { username, password } = req.body;
  
  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password are required.' });
  }

  try {
    // Look up user
    const [rows] = await pool.query('SELECT * FROM users WHERE username = ?', [username]);
    if (rows.length === 0 || rows[0].password !== password) {
      return res.status(401).json({ error: 'Invalid username or password.' });
    }

    const user = rows[0];
    
    // Generate secure session token
    const token = crypto.randomUUID();

    // Insert into database sessions
    await pool.query('INSERT INTO sessions (token, username) VALUES (?, ?)', [token, username]);

    res.json({
      token,
      username: user.username,
      role: user.role
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error during login.' });
  }
});

export default router;
