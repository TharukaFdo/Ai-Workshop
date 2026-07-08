const db = require('../db');
const crypto = require('crypto');

/**
 * Middleware to authenticate API requests by verifying secure session token signatures
 * and querying matching user records from the MySQL database.
 */
const authenticateUser = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: "Access denied. Authentication token missing." });
    }

    const token = authHeader.split(' ')[1];
    if (!token) {
      return res.status(401).json({ error: "Access denied. Invalid session token." });
    }

    const parts = token.split('.');
    if (parts.length !== 2) {
      return res.status(401).json({ error: "Access denied. Invalid session token shape." });
    }

    const [userIdStr, signature] = parts;
    const userId = parseInt(userIdStr, 10);

    if (isNaN(userId)) {
      return res.status(401).json({ error: "Access denied. Invalid token format." });
    }

    // Verify token signature using HMAC-SHA256 and JWT_SECRET
    const secret = process.env.JWT_SECRET || 'fallback_secret';
    const expectedSignature = crypto.createHmac('sha256', secret)
      .update(userId.toString())
      .digest('hex');

    if (signature !== expectedSignature) {
      return res.status(401).json({ error: "Access denied. Token signature verification failed." });
    }

    // Look up the user's role directly from the database
    const [user] = await db.query(
      'SELECT id, username, role, full_name FROM users WHERE id = ?',
      [userId]
    );

    if (!user) {
      return res.status(401).json({ error: "Access denied. User session does not exist." });
    }

    // Attach verified database user profile details to request
    req.user = user;
    next();
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

module.exports = authenticateUser;
