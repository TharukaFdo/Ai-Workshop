const request = require('supertest');
const app = require('../server');
const db = require('../db');

describe('Clinic Appointment System API Integration, Filtering & Status Flow Tests', () => {
  const testPatientName = 'TEST RECORD Patient XYZ';
  
  // User credentials
  const receptionistUsername = 'test_receptionist_user';
  const smithUsername = 'test_dr_smith_user';
  const adamsUsername = 'test_dr_adams_user';

  let receptionistToken = '';
  let smithToken = '';
  let adamsToken = '';

  let createdAppointmentId = null;

  beforeAll(async () => {
    // Insert mock users for security tests
    await db.query(
      'INSERT INTO users (username, password, role) VALUES (?, ?, ?), (?, ?, ?), (?, ?, ?)',
      [
        receptionistUsername, 'pass1', 'receptionist',
        smithUsername, 'pass2', 'doctor',
        adamsUsername, 'pass3', 'doctor'
      ]
    );

    // Authenticate and retrieve session tokens
    const repRes = await request(app).post('/api/users/login').send({ username: receptionistUsername, password: 'pass1' });
    receptionistToken = repRes.body.token;

    const smithRes = await request(app).post('/api/users/login').send({ username: smithUsername, password: 'pass2' });
    smithToken = smithRes.body.token;

    const adamsRes = await request(app).post('/api/users/login').send({ username: adamsUsername, password: 'pass3' });
    adamsToken = adamsRes.body.token;
  });

  afterAll(async () => {
    // Clean up test records
    try {
      await db.query('DELETE FROM users WHERE username IN (?, ?, ?)', [receptionistUsername, smithUsername, adamsUsername]);
      await db.query('DELETE FROM appointments WHERE patient_name = ? OR patient_name LIKE "TEST RECORD %"', [testPatientName]);
    } catch (err) {
      console.error('Error cleaning up test records:', err);
    }
    // Close the connection pool to let Jest exit clean
    await db.end();
  });

  it('should respond with health OK', async () => {
    const res = await request(app).get('/api/health');
    expect(res.statusCode).toEqual(200);
    expect(res.body).toHaveProperty('status', 'OK');
  });

  it('should deny access to appointments endpoint if token is missing', async () => {
    const res = await request(app).get('/api/appointments');
    expect(res.statusCode).toEqual(401);
  });

  it('should fail appointment creation with validation errors', async () => {
    // 1. Missing fields
    let res = await request(app)
      .post('/api/appointments')
      .set('Authorization', `Bearer ${receptionistToken}`)
      .send({ patient_name: 'TEST RECORD Bad' });
    expect(res.statusCode).toEqual(400);

    // 2. Non-alphabetic name
    res = await request(app)
      .post('/api/appointments')
      .set('Authorization', `Bearer ${receptionistToken}`)
      .send({
        patient_name: 'TEST RECORD Patient123', // contains numbers
        patient_phone: '555-1234',
        doctor_name: 'Dr. Smith',
        appointment_date: '2026-06-12',
        appointment_time: '14:00:00',
        reason: 'Checkup'
      });
    expect(res.statusCode).toEqual(400);
    expect(res.body.error).toContain('Patient Name must contain alphabetic characters');

    // 3. Past date
    res = await request(app)
      .post('/api/appointments')
      .set('Authorization', `Bearer ${receptionistToken}`)
      .send({
        patient_name: 'TEST RECORD Patient ABC',
        patient_phone: '555-1234',
        doctor_name: 'Dr. Smith',
        appointment_date: '2020-01-01', // past date
        appointment_time: '14:00:00',
        reason: 'Checkup'
      });
    expect(res.statusCode).toEqual(400);
    expect(res.body.error).toContain('Appointment Date must not be in the past');
  });

  it('should fail appointment creation for doctor roles (receptionist only)', async () => {
    const res = await request(app)
      .post('/api/appointments')
      .set('Authorization', `Bearer ${smithToken}`)
      .send({
        patient_name: testPatientName,
        patient_phone: '555-1234',
        doctor_name: 'Dr. Smith',
        appointment_date: '2026-06-12',
        appointment_time: '14:00:00',
        reason: 'Consultation'
      });

    expect(res.statusCode).toEqual(403);
    expect(res.body.error).toContain('Permission denied. Only receptionists');
  });

  it('should successfully book a new appointment under receptionist session starting as pending', async () => {
    const res = await request(app)
      .post('/api/appointments')
      .set('Authorization', `Bearer ${receptionistToken}`)
      .send({
        patient_name: testPatientName,
        patient_phone: '555-9876',
        doctor_name: 'Dr. Smith',
        appointment_date: '2026-06-12',
        appointment_time: '14:00:00',
        reason: 'Consultation evaluate'
      });

    expect(res.statusCode).toEqual(201);
    expect(res.body).toHaveProperty('id');
    createdAppointmentId = res.body.id;

    // Verify it starts as pending in DB
    const [rows] = await db.query('SELECT status FROM appointments WHERE id = ?', [createdAppointmentId]);
    expect(rows[0].status).toEqual('pending');
  });

  it('should deny updating appointment booking details if user is a doctor', async () => {
    const res = await request(app)
      .put(`/api/appointments/${createdAppointmentId}`)
      .set('Authorization', `Bearer ${smithToken}`)
      .send({
        patient_name: testPatientName,
        patient_phone: '555-9876',
        doctor_name: 'Dr. Smith',
        appointment_date: '2026-06-13',
        appointment_time: '15:30:00',
        reason: 'Consultation evaluate update'
      });

    expect(res.statusCode).toEqual(403);
    expect(res.body.error).toContain('Only receptionists can edit booking details');
  });

  it('should reject parameter-based spoofing attempts (e.g. body role, headers, query overrides)', async () => {
    let res = await request(app)
      .post('/api/appointments')
      .set('Authorization', `Bearer ${smithToken}`)
      .send({
        patient_name: testPatientName,
        patient_phone: '555-1234',
        doctor_name: 'Dr. Smith',
        appointment_date: '2026-06-12',
        appointment_time: '14:00:00',
        reason: 'Consultation',
        role: 'receptionist',
        user: { role: 'receptionist' }
      });
    expect(res.statusCode).toEqual(403);
  });

  it('should apply filters correctly (doctor, status, date) when queried by receptionist', async () => {
    const res = await request(app)
      .get('/api/appointments')
      .set('Authorization', `Bearer ${receptionistToken}`)
      .query({ doctor: 'Dr. Smith', status: 'pending', date: '2026-06-12' });

    expect(res.statusCode).toEqual(200);
    expect(Array.isArray(res.body)).toBe(true);
    
    res.body.forEach(app => {
      expect(app.doctor_name).toEqual('Dr. Smith');
      expect(app.status).toEqual('pending');
      expect(app.appointment_date).toEqual('2026-06-12');
    });
  });

  it('should deny accepting an appointment assigned to another doctor (ownership check)', async () => {
    // Dr. Adams tries to accept Dr. Smith's appointment
    const res = await request(app)
      .put(`/api/appointments/${createdAppointmentId}/accept`)
      .set('Authorization', `Bearer ${adamsToken}`);

    expect(res.statusCode).toEqual(403);
  });

  it('should allow the assigned doctor to accept the pending appointment (confirmed status)', async () => {
    // Dr. Smith accepts own appointment
    const res = await request(app)
      .put(`/api/appointments/${createdAppointmentId}/accept`)
      .set('Authorization', `Bearer ${smithToken}`);

    expect(res.statusCode).toEqual(200);

    const [rows] = await db.query('SELECT status FROM appointments WHERE id = ?', [createdAppointmentId]);
    expect(rows[0].status).toEqual('confirmed');
  });

  it('should deny adding/editing visit notes for a patient assigned to another doctor (ownership check)', async () => {
    const res = await request(app)
      .put(`/api/appointments/${createdAppointmentId}/note`)
      .set('Authorization', `Bearer ${adamsToken}`)
      .send({ visit_note: 'Malicious note from Dr. Adams' });

    expect(res.statusCode).toEqual(403);
  });

  it('should allow the assigned doctor to submit visit notes and complete the confirmed appointment', async () => {
    const res = await request(app)
      .put(`/api/appointments/${createdAppointmentId}/note`)
      .set('Authorization', `Bearer ${smithToken}`)
      .send({ visit_note: 'TEST RECORD Patient is healing well' });

    expect(res.statusCode).toEqual(200);

    const [rows] = await db.query('SELECT status, visit_note FROM appointments WHERE id = ?', [createdAppointmentId]);
    expect(rows[0].status).toEqual('completed');
    expect(rows[0].visit_note).toEqual('TEST RECORD Patient is healing well');
  });

  it('should deny cancellation of appointments for doctors', async () => {
    const res = await request(app)
      .delete(`/api/appointments/${createdAppointmentId}`)
      .set('Authorization', `Bearer ${smithToken}`);

    expect(res.statusCode).toEqual(403);
  });

  it('should allow receptionists to cancel appointments', async () => {
    const res = await request(app)
      .delete(`/api/appointments/${createdAppointmentId}`)
      .set('Authorization', `Bearer ${receptionistToken}`);

    expect(res.statusCode).toEqual(200);

    const [rows] = await db.query('SELECT status FROM appointments WHERE id = ?', [createdAppointmentId]);
    expect(rows[0].status).toEqual('cancelled');
  });
});
