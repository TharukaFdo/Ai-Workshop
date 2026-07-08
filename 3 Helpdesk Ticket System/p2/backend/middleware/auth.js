const jwt = require('jsonwebtoken');
const userService = require('../services/userService');

const verifyToken = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access denied. No token provided.' });
  }

  try {
    const verified = jwt.verify(token, process.env.JWT_SECRET || 'super_secret_helpdesk_key');
    
    // Database-backed lookup: verify user exists and get their latest role
    const user = await userService.getUserById(verified.id);
    if (!user) {
      return res.status(403).json({ error: 'User no longer exists.' });
    }

    // Attach latest database record to request
    req.user = user;
    next();
  } catch (err) {
    res.status(403).json({ error: 'Invalid or expired token.' });
  }
};

const requireRole = (role) => {
  return (req, res, next) => {
    if (!req.user || req.user.role !== role) {
      return res.status(403).json({ error: 'Forbidden. Insufficient permissions.' });
    }
    next();
  };
};

module.exports = {
  verifyToken,
  requireRole
};
