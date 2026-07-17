const crypto = require('crypto');

/**
 * Computes a SHA-256 hash for passwords.
 * @param {string} password - The plaintext password.
 * @returns {string} The hashed hex signature.
 */
const hashPassword = (password) => {
  return crypto.createHash('sha256').update(password).digest('hex');
};

module.exports = {
  hashPassword
};
