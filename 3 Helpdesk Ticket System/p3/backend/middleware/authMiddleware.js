const crypto = require('crypto');
const ticketService = require('../services/ticketService');
const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_workshop_key';

const checkRole = (allowedRoles) => {
  return async (req, res, next) => {
    try {
      const authHeader = req.headers['authorization'];
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Access denied. Missing or invalid token.' });
      }

      const token = authHeader.split(' ')[1];
      const parts = token.split('.');
      if (parts.length !== 2) {
        return res.status(401).json({ error: 'Access denied. Invalid token format.' });
      }

      const [username, signature] = parts;

      // Verify signature
      const expectedSignature = crypto
        .createHmac('sha256', JWT_SECRET)
        .update(username)
        .digest('hex');

      if (signature !== expectedSignature) {
        return res.status(401).json({ error: 'Access denied. Tampered token signature.' });
      }

      // Secure database lookup - do NOT trust role data sent by client
      const dbUser = await ticketService.getUserByUsername(username);
      if (!dbUser) {
        return res.status(401).json({ error: 'Access denied. User not found in system database.' });
      }

      // Check role permissions
      if (!allowedRoles.includes(dbUser.role)) {
        return res.status(403).json({ error: `Access denied. Role ${dbUser.role} is not authorized for this action.` });
      }

      // Attach database-validated user details to req
      req.user = {
        username: dbUser.username,
        role: dbUser.role
      };

      next();
    } catch (err) {
      console.error('Auth middleware error:', err);
      return res.status(500).json({ error: 'Internal Server Error' });
    }
  };
};

module.exports = {
  checkRole
};
