const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

const pool = require('./db');

// Routes
const requestRoutes = require('./routes/requests');
app.use('/api/requests', requestRoutes);

// Database-backed login
app.post('/api/login', async (req, res) => {
  const { username, password } = req.body;
  
  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password are required.' });
  }

  try {
    const [rows] = await pool.query('SELECT * FROM users WHERE username = ?', [username]);
    if (rows.length === 0) {
      return res.status(401).json({ error: 'Invalid username or password.' });
    }

    const user = rows[0];
    // Prototype password matching
    if (user.password !== password) {
      return res.status(401).json({ error: 'Invalid username or password.' });
    }

    // Generate session token
    const token = 'token_' + Math.random().toString(36).substring(2) + '_' + user.id;
    await pool.query('INSERT INTO sessions (token, user_id) VALUES (?, ?)', [token, user.id]);

    res.json({
      token,
      user: {
        id: user.id,
        username: user.username,
        role: user.role
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Logout endpoint
app.post('/api/logout', async (req, res) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (token) {
    try {
      await pool.query('DELETE FROM sessions WHERE token = ?', [token]);
    } catch (err) {
      // Log or ignore logout errors
    }
  }
  res.json({ message: 'Logged out successfully.' });
});

app.get('/api/users', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT id, username, role FROM users ORDER BY username ASC');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Backend is healthy and reachable.' });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
