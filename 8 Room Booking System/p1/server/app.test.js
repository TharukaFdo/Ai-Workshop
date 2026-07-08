const request = require('supertest');
const app = require('./index');
const db = require('./db');

describe('Room Booking API Tests', () => {
  let staffId;
  let coordinatorId;
  let bookingId;

  // Insert fresh clean test data before tests run
  beforeAll(async () => {
    // Enable clean queries
    await db.query('SET FOREIGN_KEY_CHECKS = 0;');
    await db.query('TRUNCATE TABLE bookings;');
    await db.query('TRUNCATE TABLE users;');
    await db.query('SET FOREIGN_KEY_CHECKS = 1;');

    // Seed test users
    const [staffResult] = await db.query(
      'INSERT INTO users (username, password, role) VALUES (?, ?, ?)',
      ['test_staff', 'test_pass', 'staff']
    );
    staffId = staffResult.insertId;

    const [coordinatorResult] = await db.query(
      'INSERT INTO users (username, password, role) VALUES (?, ?, ?)',
      ['test_coord', 'test_pass', 'coordinator']
    );
    coordinatorId = coordinatorResult.insertId;
  });

  // Clean up database after tests complete
  afterAll(async () => {
    await db.query('SET FOREIGN_KEY_CHECKS = 0;');
    await db.query('TRUNCATE TABLE bookings;');
    await db.query('TRUNCATE TABLE users;');
    await db.query('SET FOREIGN_KEY_CHECKS = 1;');
    await db.end();
  });

  // Test 1: Authentication / Login
  test('POST /api/login - succeeds with correct credentials', async () => {
    const res = await request(app)
      .post('/api/login')
      .send({ username: 'test_staff', password: 'test_pass' });
    
    expect(res.status).toBe(200);
    expect(res.body.user).toBeDefined();
    expect(res.body.user.role).toBe('staff');
  });

  test('POST /api/login - fails with incorrect credentials', async () => {
    const res = await request(app)
      .post('/api/login')
      .send({ username: 'test_staff', password: 'wrong_password' });
    
    expect(res.status).toBe(401);
  });

  // Test 2: Main workflow - Creating bookings
  test('POST /api/bookings - staff member can create booking', async () => {
    const res = await request(app)
      .post('/api/bookings')
      .send({
        userId: staffId,
        room_name: 'Test Room 101',
        booking_date: '2026-06-20',
        start_time: '10:00:00',
        end_time: '11:30:00',
        purpose: 'Integration testing session'
      });
    
    expect(res.status).toBe(201);
    expect(res.body.bookingId).toBeDefined();
    bookingId = res.body.bookingId;
  });

  // Test 3: Main workflow - Viewing bookings (Permissions check)
  test('GET /api/bookings - staff member gets only their own bookings', async () => {
    const res = await request(app)
      .get('/api/bookings')
      .query({ userId: staffId });
    
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.some(b => b.room_name === 'Test Room 101')).toBe(true);
  });

  // Test 4: Permissions - Staff cannot approve/reject bookings
  test('PUT /api/bookings/:id/status - staff cannot approve bookings', async () => {
    const res = await request(app)
      .put(`/api/bookings/${bookingId}/status`)
      .send({
        userId: staffId,
        status: 'approved',
        notes: 'Trying to self approve'
      });
    
    expect(res.status).toBe(403);
  });

  // Test 5: Main workflow - Coordinator approvals and notes
  test('PUT /api/bookings/:id/status - coordinator can approve booking with notes', async () => {
    const res = await request(app)
      .put(`/api/bookings/${bookingId}/status`)
      .send({
        userId: coordinatorId,
        status: 'approved',
        notes: 'Approved during unit tests.'
      });
    
    expect(res.status).toBe(200);

    const [rows] = await db.query('SELECT status, notes FROM bookings WHERE id = ?', [bookingId]);
    expect(rows[0].status).toBe('approved');
    expect(rows[0].notes).toBe('Approved during unit tests.');
  });

  // Test 6: Safety - Invalid times are rejected
  test('POST /api/bookings - rejects if end time is before start time', async () => {
    const res = await request(app)
      .post('/api/bookings')
      .send({
        userId: staffId,
        room_name: 'Test Room 101',
        booking_date: '2026-06-20',
        start_time: '14:00:00',
        end_time: '13:00:00',
        purpose: 'Meeting with invalid time bounds'
      });
    
    expect(res.status).toBe(400);
    expect(res.body.error).toContain('Start time must be before end time');
  });

  // Test 7: Safety - Double booking validation
  test('POST /api/bookings - rejects if booking overlaps with an approved booking', async () => {
    // Attempting to book Test Room 101 on 2026-06-20 from 10:30 to 11:00 (overlaps with approved 10:00 - 11:30)
    const res = await request(app)
      .post('/api/bookings')
      .send({
        userId: staffId,
        room_name: 'Test Room 101',
        booking_date: '2026-06-20',
        start_time: '10:30:00',
        end_time: '11:00:00',
        purpose: 'Attempting conflicting booking'
      });
    
    expect(res.status).toBe(409);
    expect(res.body.error).toContain('Time conflict');
  });
});
