/**
 * Helper function mapping user names to official doctor names.
 * @param {string} username 
 * @returns {string|null} Doctor Name
 */
function getDoctorName(username) {
  if (!username) return null;
  const lowerName = username.toLowerCase();
  if (lowerName.includes('smith')) return 'Dr. Smith';
  if (lowerName.includes('adams')) return 'Dr. Adams';
  return null;
}

/**
 * Validates appointment input data structure and limits.
 * @param {object} data 
 * @returns {string|null} Validation error message, or null if valid.
 */
function validateAppointment(data) {
  const { patient_name, patient_phone, doctor_name, appointment_date, appointment_time, reason } = data;
  if (!patient_name || !patient_phone || !doctor_name || !appointment_date || !appointment_time || !reason) {
    return 'All appointment fields are required.';
  }
  // alphabetic check for patient name
  if (!/^[a-zA-Z\s]+$/.test(patient_name)) {
    return 'Patient Name must contain alphabetic characters and spaces only.';
  }
  // phone check
  if (!/^[0-9\-\+\s\(\)]+$/.test(patient_phone)) {
    return 'Patient Phone contains invalid characters.';
  }
  // date check (must not be in the past)
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const selectedDate = new Date(appointment_date);
  if (selectedDate < today) {
    return 'Appointment Date must not be in the past.';
  }
  return null;
}

module.exports = {
  getDoctorName,
  validateAppointment
};
