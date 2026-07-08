const pool = require('../db');

// Database-backed authentication session middleware
const authenticateSession = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized. Authorization header missing or malformed.' });
  }

  const token = authHeader.split(' ')[1];
  try {
    // Look up the user's role and identity directly from the database using the token
    const [rows] = await pool.query(
      'SELECT id, username, role FROM users WHERE session_token = ?',
      [token]
    );

    if (rows.length === 0) {
      return res.status(401).json({ error: 'Session expired or invalid token.' });
    }

    // Attach verified user credentials from database to request object
    req.user = rows[0];
    next();
  } catch (err) {
    return res.status(500).json({ error: 'Authentication database query failed.', details: err.message });
  }
};

module.exports = authenticateSession;
