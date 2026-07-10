const crypto = require('crypto');
require('dotenv').config();

const SECRET = process.env.JWT_SECRET || 'prototype_secret_key_12345';

/**
 * Generates a signed token for a user.
 */
function generateToken(id, role) {
  const payload = `${id}.${role}`;
  const signature = crypto
    .createHmac('sha256', SECRET)
    .update(payload)
    .digest('hex');
  return `${payload}.${signature}`;
}

/**
 * Express middleware to authenticate tokens and verify signatures.
 */
function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Access denied. No token provided.' });
  }

  const token = authHeader.split(' ')[1];
  const parts = token.split('.');
  if (parts.length !== 3) {
    return res.status(401).json({ error: 'Access denied. Malformed token.' });
  }

  const [id, role, signature] = parts;
  const recomputedSignature = crypto
    .createHmac('sha256', SECRET)
    .update(`${id}.${role}`)
    .digest('hex');

  if (signature !== recomputedSignature) {
    return res.status(401).json({ error: 'Access denied. Signature mismatch.' });
  }

  req.user = {
    id: parseInt(id),
    role: role
  };
  next();
}

module.exports = {
  authMiddleware,
  generateToken
};
