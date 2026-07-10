const db = require('./db');

/**
 * Secure auth middleware verifying session tokens against the database
 */
const requireAuth = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized. Please sign in.' });
  }
  
  const token = authHeader.split(' ')[1];

  try {
    // Look up user information using the session token in the database
    const [sessions] = await db.query(
      `SELECT u.id, u.username, u.role 
       FROM sessions s 
       JOIN users u ON s.user_id = u.id 
       WHERE s.token = ?`,
      [token]
    );

    if (sessions.length === 0) {
      return res.status(401).json({ error: 'Unauthorized. Invalid or expired session.' });
    }

    const user = sessions[0];
    // Attach database-validated user identity to request object
    req.user = { id: user.id, username: user.username, role: user.role };
    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    res.status(500).json({ error: 'Internal server error during authorization check.' });
  }
};

module.exports = requireAuth;
