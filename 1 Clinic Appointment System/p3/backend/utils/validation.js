/**
 * Validation helper for appointment requests.
 * Checks required fields, formats, lengths, and logical constraints.
 */
function validateAppointment(data) {
  const { patientName, patientPhone, doctorName, appointmentDate, appointmentTime, reason } = data;

  if (!patientName || !doctorName || !appointmentDate || !appointmentTime || !reason) {
    return 'patientName, doctorName, appointmentDate, appointmentTime, and reason are required fields.';
  }

  if (patientName.trim().length < 2) {
    return 'Patient Name must be at least 2 characters.';
  }

  if (reason.trim().length < 5) {
    return 'Reason for visit must be at least 5 characters.';
  }

  // Validate phone format if provided
  if (patientPhone && patientPhone.trim() !== '') {
    const phoneRegex = /^[+\d\s-]+$/;
    if (!phoneRegex.test(patientPhone)) {
      return 'Patient phone must contain only digits, spaces, dashes, or plus sign.';
    }
  }

  // Validate date is not in the past
  const inputDate = new Date(appointmentDate);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  if (isNaN(inputDate.getTime())) {
    return 'Appointment date is invalid.';
  }

  if (inputDate < today) {
    return 'Appointment date cannot be in the past.';
  }

  // Validate time format (HH:MM or HH:MM:SS)
  const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)(:([0-5]\d))?$/;
  if (!timeRegex.test(appointmentTime)) {
    return 'Appointment time must be a valid 24-hour time format (HH:MM).';
  }

  return null;
}

module.exports = {
  validateAppointment
};
