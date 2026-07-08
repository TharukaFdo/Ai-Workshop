const db = require('../config/db');

/**
 * Middleware to authenticate request token and fetch user details from database
 */
const authenticateToken = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Expected "Bearer <token>"

  if (!token) {
    return res.status(401).json({ error: 'Unauthorized: Missing session token' });
  }

  try {
    // Resolve user details using token mapping in database
    const [rows] = await db.query(
      `SELECT u.id, u.username, u.role 
       FROM sessions s
       JOIN users u ON s.user_id = u.id
       WHERE s.token = ?`,
      [token]
    );

    if (rows.length === 0) {
      return res.status(403).json({ error: 'Forbidden: Invalid or expired session' });
    }

    // Bind authenticated user properties to the request context
    req.user = rows[0];
    next();
  } catch (error) {
    console.error('Session authentication error:', error);
    res.status(500).json({ error: 'Internal server authorization error' });
  }
};

module.exports = { authenticateToken };
