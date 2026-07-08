const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const appointmentService = require('../services/appointmentService');
const { validateAppointment } = require('../utils/validation');

// GET /api/appointments (Both Receptionist & Doctor can view)
router.get('/', authMiddleware(), async (req, res) => {
  try {
    const filters = {
      doctorName: req.user.role === 'Doctor' ? req.user.doctorName : req.query.doctorName,
      appointmentDate: req.query.appointmentDate,
      status: req.query.status
    };
    const appointments = await appointmentService.getAllAppointments(filters);
    
    // Privacy safeguard: Strip visit notes for Receptionist role
    if (req.user.role === 'Receptionist') {
      appointments.forEach(app => {
        app.visitNote = null;
      });
    }
    
    res.json(appointments);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/appointments (Only Receptionist)
router.post('/', authMiddleware('Receptionist'), async (req, res) => {
  try {
    const validationError = validateAppointment(req.body);
    if (validationError) {
      return res.status(400).json({ message: validationError });
    }

    const { patientName, patientPhone, doctorName, appointmentDate, appointmentTime, reason } = req.body;

    const newAppointment = await appointmentService.createAppointment({
      patientName,
      patientPhone,
      doctorName,
      appointmentDate,
      appointmentTime,
      reason
    });
    res.status(201).json(newAppointment);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// PUT /api/appointments/:id/booking (Only Receptionist)
router.put('/:id/booking', authMiddleware('Receptionist'), async (req, res) => {
  try {
    const validationError = validateAppointment(req.body);
    if (validationError) {
      return res.status(400).json({ message: validationError });
    }

    const { patientName, patientPhone, doctorName, appointmentDate, appointmentTime, reason } = req.body;

    const updated = await appointmentService.updateAppointmentBooking(req.params.id, {
      patientName,
      patientPhone,
      doctorName,
      appointmentDate,
      appointmentTime,
      reason
    });

    if (updated) {
      res.json({ message: 'Appointment booking details updated successfully.' });
    } else {
      res.status(404).json({ message: 'Appointment not found or not in editable status.' });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});



// PUT /api/appointments/:id/notes (Only Doctor)
router.put('/:id/notes', authMiddleware('Doctor'), async (req, res) => {
  try {
    const { visitNote, status } = req.body;
    if (!status || !['completed', 'accepted'].includes(status)) {
      return res.status(400).json({ message: 'Valid status is required.' });
    }

    // Retrieve appointment details to verify ownership
    const appointment = await appointmentService.getAppointmentById(req.params.id);
    if (!appointment) {
      return res.status(404).json({ message: 'Appointment not found.' });
    }

    // Enforce ownership: Doctor can only update notes for their assigned appointments
    if (appointment.doctorName !== req.user.doctorName) {
      return res.status(403).json({ message: 'Access denied. You can only update notes for your own appointments.' });
    }

    const updated = await appointmentService.updateAppointmentNotes(req.params.id, visitNote, status);
    if (updated) {
      res.json({ message: 'Appointment visit notes updated successfully.' });
    } else {
      res.status(404).json({ message: 'Appointment not in active status.' });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// PUT /api/appointments/:id/cancel (Only Receptionist)
router.put('/:id/cancel', authMiddleware('Receptionist'), async (req, res) => {
  try {
    const updated = await appointmentService.cancelAppointment(req.params.id);
    if (updated) {
      res.json({ message: 'Appointment cancelled successfully.' });
    } else {
      res.status(404).json({ message: 'Appointment not found or not in active status.' });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// PUT /api/appointments/:id/accept (Only Doctor)
router.put('/:id/accept', authMiddleware('Doctor'), async (req, res) => {
  try {
    const appointment = await appointmentService.getAppointmentById(req.params.id);
    if (!appointment) {
      return res.status(404).json({ message: 'Appointment not found.' });
    }

    if (appointment.doctorName !== req.user.doctorName) {
      return res.status(403).json({ message: 'Access denied. You can only manage your own appointments.' });
    }

    const updated = await appointmentService.acceptAppointment(req.params.id);
    if (updated) {
      res.json({ message: 'Appointment accepted successfully.' });
    } else {
      res.status(404).json({ message: 'Appointment is not in pending status.' });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// PUT /api/appointments/:id/reject (Only Doctor)
router.put('/:id/reject', authMiddleware('Doctor'), async (req, res) => {
  try {
    const appointment = await appointmentService.getAppointmentById(req.params.id);
    if (!appointment) {
      return res.status(404).json({ message: 'Appointment not found.' });
    }

    if (appointment.doctorName !== req.user.doctorName) {
      return res.status(403).json({ message: 'Access denied. You can only manage your own appointments.' });
    }

    const updated = await appointmentService.rejectAppointment(req.params.id);
    if (updated) {
      res.json({ message: 'Appointment rejected successfully.' });
    } else {
      res.status(404).json({ message: 'Appointment is not in pending status.' });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
