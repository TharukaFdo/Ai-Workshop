const crypto = require('crypto');
require('dotenv').config();

const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_workshop_key_12345';

const authUtils = {
  /**
   * Hash a plain password using SHA256
   */
  hashPassword(password) {
    return crypto.createHmac('sha256', JWT_SECRET).update(password).digest('hex');
  },

  /**
   * Compare a plain password with a stored hash
   */
  verifyPassword(password, hash) {
    const hashed = this.hashPassword(password);
    return hashed === hash;
  },

  /**
   * Generate a secure, signed token: "userId:role:timestamp.signature"
   */
  generateToken(user) {
    const payload = `${user.id}:${user.role}:${Date.now()}`;
    const signature = crypto.createHmac('sha256', JWT_SECRET).update(payload).digest('hex');
    return `${payload}.${signature}`;
  },

  /**
   * Verify a signed token and extract the payload
   */
  verifyToken(token) {
    if (!token) return null;
    const parts = token.split('.');
    if (parts.length !== 2) return null;

    const [payload, signature] = parts;
    const expectedSignature = crypto.createHmac('sha256', JWT_SECRET).update(payload).digest('hex');

    if (signature !== expectedSignature) {
      return null; // Invalid signature
    }

    const [id, role, timestamp] = payload.split(':');
    
    // Check if token is older than 24 hours (86400000 ms)
    if (Date.now() - parseInt(timestamp) > 86400000) {
      return null; // Expired
    }

    return { id: parseInt(id), role };
  }
};

module.exports = authUtils;
