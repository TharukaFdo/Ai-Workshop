const express = require('express');
const router = express.Router();
const db = require('../db');
const authenticateToken = require('../middleware/authMiddleware');
const { getDoctorName, validateAppointment } = require('../utils/helpers');

// Apply authenticateToken middleware to all routes
router.use(authenticateToken);

// GET appointments with filtering and role-based restriction
router.get('/', async (req, res) => {
  const { doctor, status, date } = req.query;
  let query = 'SELECT id, patient_name, patient_phone, doctor_name, DATE_FORMAT(appointment_date, "%Y-%m-%d") AS appointment_date, appointment_time, reason, status, visit_note, created_at, updated_at FROM appointments WHERE 1=1';
  const queryParams = [];

  // Enforce doctor schedule visibility restrictions based on db profile
  if (req.user.role === 'doctor') {
    const assignedDoc = getDoctorName(req.user.username);
    if (!assignedDoc) {
      return res.status(403).json({ error: 'Doctor profile configuration mismatch.' });
    }
    query += ' AND doctor_name = ?';
    queryParams.push(assignedDoc);
  } else {
    // Receptionists can query filter parameters
    if (doctor) {
      query += ' AND doctor_name = ?';
      queryParams.push(doctor);
    }
  }

  if (status) {
    query += ' AND status = ?';
    queryParams.push(status);
  }
  if (date) {
    query += ' AND appointment_date = ?';
    queryParams.push(date);
  }

  query += ' ORDER BY appointment_date ASC, appointment_time ASC';

  try {
    const [rows] = await db.query(query, queryParams);
    res.json(rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Database query failed' });
  }
});

// POST create appointment (Receptionist only, starts as 'pending')
router.post('/', async (req, res) => {
  if (req.user.role !== 'receptionist') {
    return res.status(403).json({ error: 'Permission denied. Only receptionists can book appointments.' });
  }

  const validationError = validateAppointment(req.body);
  if (validationError) {
    return res.status(400).json({ error: validationError });
  }

  const { patient_name, patient_phone, doctor_name, appointment_date, appointment_time, reason } = req.body;

  try {
    const [result] = await db.query(
      `INSERT INTO appointments (patient_name, patient_phone, doctor_name, appointment_date, appointment_time, reason, status)
       VALUES (?, ?, ?, ?, ?, ?, 'pending')`,
      [patient_name, patient_phone, doctor_name, appointment_date, appointment_time, reason]
    );
    res.status(201).json({ id: result.insertId, message: 'Appointment booked successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to save appointment' });
  }
});

// PUT update appointment details (Receptionist only)
router.put('/:id', async (req, res) => {
  if (req.user.role !== 'receptionist') {
    return res.status(403).json({ error: 'Permission denied. Only receptionists can edit booking details.' });
  }

  const validationError = validateAppointment(req.body);
  if (validationError) {
    return res.status(400).json({ error: validationError });
  }

  const { patient_name, patient_phone, doctor_name, appointment_date, appointment_time, reason, status } = req.body;
  const appointmentId = req.params.id;

  try {
    const [existing] = await db.query('SELECT status FROM appointments WHERE id = ?', [appointmentId]);
    if (existing.length === 0) {
      return res.status(404).json({ error: 'Appointment not found' });
    }

    await db.query(
      `UPDATE appointments 
       SET patient_name = ?, patient_phone = ?, doctor_name = ?, appointment_date = ?, appointment_time = ?, reason = ?, status = ?
       WHERE id = ?`,
      [patient_name, patient_phone, doctor_name, appointment_date, appointment_time, reason, status || 'pending', appointmentId]
    );
    res.json({ message: 'Appointment updated successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to update appointment' });
  }
});

// PUT accept appointment (Doctor only, ownership check)
router.put('/:id/accept', async (req, res) => {
  if (req.user.role !== 'doctor') {
    return res.status(403).json({ error: 'Permission denied. Only doctors can accept appointments.' });
  }

  const appointmentId = req.params.id;

  try {
    const [existing] = await db.query('SELECT doctor_name, status FROM appointments WHERE id = ?', [appointmentId]);
    if (existing.length === 0) {
      return res.status(404).json({ error: 'Appointment not found' });
    }

    const assignedDoc = getDoctorName(req.user.username);
    if (existing[0].doctor_name !== assignedDoc) {
      return res.status(403).json({ error: 'Permission denied. You cannot accept appointments assigned to another doctor.' });
    }

    if (existing[0].status !== 'pending') {
      return res.status(400).json({ error: 'Only pending appointments can be accepted.' });
    }

    await db.query(`UPDATE appointments SET status = 'confirmed' WHERE id = ?`, [appointmentId]);
    res.json({ message: 'Appointment confirmed successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to accept appointment' });
  }
});

// PUT reject appointment (Doctor only, ownership check)
router.put('/:id/reject', async (req, res) => {
  if (req.user.role !== 'doctor') {
    return res.status(403).json({ error: 'Permission denied. Only doctors can reject appointments.' });
  }

  const appointmentId = req.params.id;

  try {
    const [existing] = await db.query('SELECT doctor_name, status FROM appointments WHERE id = ?', [appointmentId]);
    if (existing.length === 0) {
      return res.status(404).json({ error: 'Appointment not found' });
    }

    const assignedDoc = getDoctorName(req.user.username);
    if (existing[0].doctor_name !== assignedDoc) {
      return res.status(403).json({ error: 'Permission denied. You cannot reject appointments assigned to another doctor.' });
    }

    if (existing[0].status !== 'pending') {
      return res.status(400).json({ error: 'Only pending appointments can be rejected.' });
    }

    await db.query(`UPDATE appointments SET status = 'cancelled' WHERE id = ?`, [appointmentId]);
    res.json({ message: 'Appointment rejected/cancelled successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to reject appointment' });
  }
});

// PUT update visit note (Doctor only, ownership check, marks as 'completed')
router.put('/:id/note', async (req, res) => {
  if (req.user.role !== 'doctor') {
    return res.status(403).json({ error: 'Permission denied. Only doctors can add visit notes.' });
  }

  const { visit_note } = req.body;
  const appointmentId = req.params.id;

  if (visit_note === undefined || visit_note === null || visit_note.trim() === '') {
    return res.status(400).json({ error: 'Visit note content is required' });
  }

  try {
    const [existing] = await db.query('SELECT doctor_name FROM appointments WHERE id = ?', [appointmentId]);
    if (existing.length === 0) {
      return res.status(404).json({ error: 'Appointment not found' });
    }

    const assignedDoc = getDoctorName(req.user.username);
    if (existing[0].doctor_name !== assignedDoc) {
      return res.status(403).json({ error: 'Permission denied. You cannot edit notes for appointments assigned to another doctor.' });
    }

    await db.query(
      `UPDATE appointments SET visit_note = ?, status = 'completed' WHERE id = ?`,
      [visit_note, appointmentId]
    );
    res.json({ message: 'Visit note added and appointment completed successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to add visit note' });
  }
});

// DELETE cancel appointment (Receptionist only)
router.delete('/:id', async (req, res) => {
  if (req.user.role !== 'receptionist') {
    return res.status(403).json({ error: 'Permission denied. Only receptionists can cancel appointments.' });
  }

  const appointmentId = req.params.id;

  try {
    const [existing] = await db.query('SELECT status FROM appointments WHERE id = ?', [appointmentId]);
    if (existing.length === 0) {
      return res.status(404).json({ error: 'Appointment not found' });
    }

    await db.query(`UPDATE appointments SET status = 'cancelled' WHERE id = ?`, [appointmentId]);
    res.json({ message: 'Appointment cancelled successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to cancel appointment' });
  }
});

module.exports = router;
