const jwt = require('jsonwebtoken');
const userService = require('../services/userService');

const JWT_SECRET = process.env.JWT_SECRET || 'workshop-secret-key-123';

/**
 * Authentication middleware to verify JWT and retrieve the user from the database.
 */
async function authenticate(req, res, next) {
  const authHeader = req.headers['authorization'];
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Access Denied: No token provided' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    // Fetch user details from database to avoid trusting client-provided role data
    const user = await userService.getUserById(decoded.userId);
    if (!user) {
      return res.status(401).json({ error: 'Access Denied: User not found in system' });
    }

    req.user = user; // Set database-verified user record
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Access Denied: Invalid or expired token' });
  }
}

/**
 * Role authorization helper.
 */
function requireRole(role) {
  return (req, res, next) => {
    if (!req.user || req.user.role !== role) {
      return res.status(403).json({ error: `Forbidden: Requires ${role} role.` });
    }
    next();
  };
}

module.exports = {
  authenticate,
  requireRole,
  JWT_SECRET
};
