const db = require('../db');

// Authentication middleware resolving session and user details directly from MySQL database
async function requireAuth(req, res, next) {
  const authHeader = req.headers['authorization'];
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized. Token required.' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const [sessionRows] = await db.query('SELECT userId FROM sessions WHERE token = ?', [token]);
    if (sessionRows.length === 0) {
      return res.status(401).json({ error: 'Unauthorized. Invalid or expired session.' });
    }

    const userId = sessionRows[0].userId;

    const [rows] = await db.query('SELECT id, username, role FROM users WHERE id = ?', [userId]);
    if (rows.length === 0) {
      await db.query('DELETE FROM sessions WHERE token = ?', [token]);
      return res.status(401).json({ error: 'Unauthorized. User record not found.' });
    }

    req.user = rows[0];
    req.token = token;
    next();
  } catch (err) {
    res.status(500).json({ error: 'Authentication database check failed.' });
  }
}

// Role authorization middleware for Librarians
function requireLibrarian(req, res, next) {
  if (req.user.role !== 'librarian') {
    return res.status(403).json({ error: 'Access denied. Librarian role required.' });
  }
  next();
}

module.exports = {
  requireAuth,
  requireLibrarian
};
