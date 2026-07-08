const db = require('../config/db');

/**
 * Authentication and Authorization Middleware
 * Verifies the user using the Authorization header (containing the username)
 * against the database, then checks their role.
 */
module.exports = function authMiddleware(requiredRole) {
  return async (req, res, next) => {
    const authHeader = req.headers['authorization'];
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'Authentication required. Missing Bearer token.' });
    }

    // Extract the mock token (which is the username in this workshop prototype)
    const tokenUsername = authHeader.substring(7).trim();
    if (!tokenUsername) {
      return res.status(401).json({ message: 'Invalid token format.' });
    }

    try {
      // Query the database to retrieve true role and ownership details
      const [rows] = await db.query('SELECT username, role, doctor_name FROM app_users WHERE username = ?', [tokenUsername]);
      const user = rows[0];

      if (!user) {
        return res.status(401).json({ message: 'Session expired or user not found.' });
      }

      // Populate user info from the database (do not trust browser-sent roles)
      req.user = {
        username: user.username,
        role: user.role,
        doctorName: user.doctor_name
      };

      // Check role permissions
      if (requiredRole && req.user.role !== requiredRole) {
        return res.status(403).json({ message: `Access denied. Role '${requiredRole}' required.` });
      }

      next();
    } catch (err) {
      console.error('Auth middleware error:', err);
      return res.status(500).json({ message: 'Internal server error during authentication.' });
    }
  };
};
