const crypto = require('crypto');

/**
 * Hashes a plaintext password using SHA-256.
 * @param {string} password - The plaintext password to hash.
 * @returns {string} - The SHA-256 hexadecimal hash string.
 */
function hashPassword(password) {
  return crypto.createHash('sha256').update(password).digest('hex');
}

module.exports = {
  hashPassword
};
