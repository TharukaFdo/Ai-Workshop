const crypto = require('crypto');
const dbService = require('../services/dbService');

const SECRET_KEY = process.env.JWT_SECRET || 'workshop_super_secret_key_12345';

// Helper to sign a simplified token
function signToken(userId) {
  // Token expires in 2 hours
  const expiresAt = Date.now() + 2 * 60 * 60 * 1000; 
  const data = `${userId}:${expiresAt}`;
  const signature = crypto.createHmac('sha256', SECRET_KEY).update(data).digest('hex');
  return `${data}:${signature}`;
}

// Verification Middleware
async function authMiddleware(req, res, next) {
  try {
    const authHeader = req.header('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ success: false, message: 'Access denied. Missing Authorization Bearer token.' });
    }

    const token = authHeader.split(' ')[1];
    const parts = token.split(':');
    if (parts.length !== 3) {
      return res.status(400).json({ success: false, message: 'Invalid token structure.' });
    }

    const [userId, expiresAt, signature] = parts;
    
    // Check expiration
    if (Date.now() > parseInt(expiresAt)) {
      return res.status(401).json({ success: false, message: 'Token has expired. Please login again.' });
    }

    // Verify signature
    const data = `${userId}:${expiresAt}`;
    const expectedSignature = crypto.createHmac('sha256', SECRET_KEY).update(data).digest('hex');
    
    if (signature !== expectedSignature) {
      return res.status(401).json({ success: false, message: 'Token signature verification failed.' });
    }

    // Query database directly to fetch fresh role and details (NEVER trust user role sent directly by browser)
    const user = await dbService.getUserById(parseInt(userId));
    if (!user) {
      return res.status(404).json({ success: false, message: 'Authenticated user not found in database.' });
    }

    // Attach user profile directly to request
    req.user = {
      id: user.id,
      username: user.username,
      role: user.role
    };

    next();
  } catch (err) {
    next(err);
  }
}

module.exports = {
  authMiddleware,
  signToken
};
