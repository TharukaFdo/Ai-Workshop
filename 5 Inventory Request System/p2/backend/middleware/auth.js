const pool = require('../db');

// Middleware to authenticate user via session token
async function authMiddleware(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Authentication token required.' });
  }

  try {
    // Verify session from database
    const [sessionRows] = await pool.query('SELECT user_id FROM sessions WHERE token = ?', [token]);
    if (sessionRows.length === 0) {
      return res.status(401).json({ error: 'Invalid or expired session token.' });
    }
    const userId = sessionRows[0].user_id;

    // Load full user details securely from database
    const [rows] = await pool.query('SELECT * FROM users WHERE id = ?', [userId]);
    if (rows.length === 0) {
      return res.status(401).json({ error: 'User account not found.' });
    }
    req.user = rows[0]; // Securely populates req.user with database record details
    next();
  } catch (err) {
    res.status(500).json({ error: 'Database authentication lookup failed.' });
  }
}

module.exports = authMiddleware;
