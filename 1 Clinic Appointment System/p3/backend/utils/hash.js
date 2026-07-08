const crypto = require('crypto');

/**
 * Hashing utility to compute SHA256 hashes for user passwords.
 */
function hashPassword(password) {
  return crypto.createHash('sha256').update(password).digest('hex');
}

module.exports = {
  hashPassword
};
