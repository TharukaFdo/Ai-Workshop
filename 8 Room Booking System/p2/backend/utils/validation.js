/**
 * Checks if any required field is missing in the object
 */
const validateRequiredFields = (requiredKeys, body) => {
  for (const key of requiredKeys) {
    if (!body[key] || (typeof body[key] === 'string' && !body[key].trim())) {
      return false;
    }
  }
  return true;
};

/**
 * Checks if the provided date string is before the current local date
 */
const isDateInPast = (dateStr) => {
  const today = new Date().toISOString().split('T')[0];
  return dateStr < today;
};

/**
 * Checks if the startTime matches or is chronologically after the endTime
 */
const isInvalidTimeRange = (startTime, endTime) => {
  return startTime >= endTime;
};

module.exports = {
  validateRequiredFields,
  isDateInPast,
  isInvalidTimeRange
};
