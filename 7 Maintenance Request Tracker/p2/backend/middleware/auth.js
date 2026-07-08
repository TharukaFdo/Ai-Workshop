const db = require('../db');

const authenticateUser = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized: Missing or invalid token format' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const [rows] = await db.query(
      'SELECT id, username, role FROM users WHERE session_token = ?',
      [token]
    );

    if (rows.length === 0) {
      return res.status(401).json({ error: 'Unauthorized: Invalid or expired session' });
    }

    req.user = rows[0];
    next();
  } catch (error) {
    console.error('Database authentication error:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

module.exports = authenticateUser;
