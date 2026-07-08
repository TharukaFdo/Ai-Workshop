import pool from '../db.js';

export const authenticate = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized: Missing or invalid token format.' });
  }
  
  const token = authHeader.split(' ')[1];

  try {
    // 1. Look up token in database sessions
    const [sessionRows] = await pool.query('SELECT username FROM sessions WHERE token = ?', [token]);
    if (sessionRows.length === 0) {
      return res.status(401).json({ error: 'Unauthorized: Invalid session token.' });
    }
    const username = sessionRows[0].username;

    // 2. Look up user role directly from database users table
    const [userRows] = await pool.query('SELECT role FROM users WHERE username = ?', [username]);
    if (userRows.length === 0) {
      return res.status(401).json({ error: 'Unauthorized: User no longer exists.' });
    }
    const role = userRows[0].role;

    // Attach verified identity to request object
    req.user = { username, role, token };
    next();
  } catch (error) {
    console.error('Authentication middleware error:', error);
    res.status(500).json({ error: 'Authentication internal server error.' });
  }
};
