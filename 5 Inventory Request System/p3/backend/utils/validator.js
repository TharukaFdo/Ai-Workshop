/**
 * Validates inventory request form input parameters.
 */
function validateRequestInput({ itemName, quantity, reason, requestedDate }) {
  if (!itemName || !quantity || !reason || !requestedDate) {
    return 'All fields are required.';
  }

  const qty = parseInt(quantity);
  if (isNaN(qty) || qty <= 0) {
    return 'Quantity must be a positive integer.';
  }

  return null; // Return null if validation passes
}

module.exports = {
  validateRequestInput
};
