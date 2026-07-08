const db = require('../db');

async function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Extract token from "Bearer <token>"

  if (!token) {
    return res.status(401).json({ error: 'Access token is required. Please log in.' });
  }

  try {
    const [rows] = await db.query('SELECT id, username, role FROM users WHERE session_token = ?', [token]);
    
    if (rows.length === 0) {
      return res.status(401).json({ error: 'Invalid or expired session. Please log in again.' });
    }

    // Attach user record retrieved from DB to the request
    req.user = rows[0];
    next();
  } catch (error) {
    console.error('Authentication middleware error:', error);
    res.status(500).json({ error: 'Authentication check failed due to database error' });
  }
}

module.exports = authenticateToken;
