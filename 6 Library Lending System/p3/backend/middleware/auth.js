const crypto = require('crypto');
const db = require('../config/db');

const TOKEN_SECRET = process.env.TOKEN_SECRET || 'library_secret_key_12345';

/**
 * Middleware to authenticate requests. Extracts custom HMAC-signed token,
 * verifies signature, and fetches user details from the database.
 */
const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({ message: 'Authentication required. No token provided.' });
    }

    const parts = token.split('.');
    if (parts.length !== 3) {
      return res.status(401).json({ message: 'Authentication failed. Invalid token format.' });
    }

    const [id, role, signature] = parts;

    // Verify signature
    const expectedSignature = crypto
      .createHmac('sha256', TOKEN_SECRET)
      .update(`${id}.${role}`)
      .digest('hex');

    if (signature !== expectedSignature) {
      return res.status(403).json({ message: 'Authentication failed. Invalid token signature.' });
    }

    // Crucial: Load fresh role from DB to prevent client-side token spoofing/tampering
    const [rows] = await db.query(
      'SELECT id, username, role FROM app_users WHERE id = ?',
      [id]
    );
    const user = rows[0];

    if (!user) {
      return res.status(403).json({ message: 'User account not found.' });
    }

    // Attach verified user entity to request
    req.user = user;
    next();
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

/**
 * Authorization Guard: Block request unless user is a Librarian.
 */
const requireLibrarian = (req, res, next) => {
  if (!req.user || req.user.role !== 'Librarian') {
    return res.status(403).json({ message: 'Access Denied: Librarian role required.' });
  }
  next();
};

/**
 * Authorization Guard: Block request unless user is a Member.
 */
const requireMember = (req, res, next) => {
  if (!req.user || req.user.role !== 'Member') {
    return res.status(403).json({ message: 'Access Denied: Member role required.' });
  }
  next();
};

module.exports = {
  authenticate,
  requireLibrarian,
  requireMember
};
