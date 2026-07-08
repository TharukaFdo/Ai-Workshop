const mysql = require('mysql2/promise');
require('dotenv').config();

const BASE_URL = 'http://localhost:5000/api';

async function runTests() {
  console.log('--- STARTING INTEGRATION TESTS ---');

  // 1. Establish DB pool for cleaning up test data
  const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '3306'),
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'c1p1'
  });

  let testAppointmentId1 = null;
  let testAppointmentId2 = null;

  try {
    // 2. Health check
    console.log('\n[TEST 1] Server Health Check...');
    const healthRes = await fetch(`${BASE_URL}/health`);
    if (!healthRes.ok) throw new Error('Health check failed');
    console.log('✅ Server is up and running.');

    // 3. Login checks
    console.log('\n[TEST 2] Authentication and login...');
    
    // Invalid login
    const badLoginRes = await fetch(`${BASE_URL}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'receptionist', password: 'wrongpassword' })
    });
    if (badLoginRes.status !== 401) {
      throw new Error(`Expected 401 status for invalid login, got ${badLoginRes.status}`);
    }
    console.log('✅ Correctly rejected invalid credentials (401).');

    // Valid receptionist login
    const recLoginRes = await fetch(`${BASE_URL}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'receptionist', password: 'password123' })
    });
    if (!recLoginRes.ok) throw new Error('Receptionist login failed');
    const recUser = await recLoginRes.json();
    console.log('✅ Successfully logged in as receptionist.');

    // Valid doctor login
    const docLoginRes = await fetch(`${BASE_URL}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'dr_adams', password: 'password123' })
    });
    if (!docLoginRes.ok) throw new Error('Doctor login failed');
    const docUser = await docLoginRes.json();
    console.log('✅ Successfully logged in as Dr. Adams.');

    // 4. Booking and Approval workflow
    console.log('\n[TEST 3] Booking & Status Workflow (Pending -> Confirmed -> Completed)...');

    const newApt = {
      patient_name: 'Workflow Test User',
      contact_number: '555-8888',
      doctor_name: 'Dr. Adams',
      appointment_date: '2026-06-20',
      appointment_time: '10:00:00',
      reason: 'Approval test'
    };

    // Receptionist books a new appointment
    const bookRes = await fetch(`${BASE_URL}/appointments`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': 'receptionist'
      },
      body: JSON.stringify(newApt)
    });
    if (!bookRes.ok) throw new Error('Failed to book appointment as receptionist');
    const createdApt = await bookRes.json();
    testAppointmentId1 = createdApt.id;
    
    if (createdApt.status !== 'Pending') {
      throw new Error(`Expected initial status to be Pending, got ${createdApt.status}`);
    }
    console.log(`✅ Appointment successfully booked. Initial status is Pending. ID: ${testAppointmentId1}`);

    // Try to write note on Pending appointment (should be blocked)
    const earlyNoteRes = await fetch(`${BASE_URL}/appointments/${testAppointmentId1}/notes`, {
      method: 'PUT',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': 'dr_adams'
      },
      body: JSON.stringify({ visit_note: 'Unallowed note' })
    });
    if (earlyNoteRes.status !== 400) {
      throw new Error(`Expected 400 for writing note on Pending appointment, got ${earlyNoteRes.status}`);
    }
    console.log('✅ Correctly blocked adding notes to a Pending appointment (400).');

    // Doctor accepts (Confirms) the appointment
    const acceptRes = await fetch(`${BASE_URL}/appointments/${testAppointmentId1}/status`, {
      method: 'PUT',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': 'dr_adams'
      },
      body: JSON.stringify({ status: 'Confirmed' })
    });
    if (!acceptRes.ok) throw new Error('Failed to accept appointment as Dr. Adams');
    console.log('✅ Dr. Adams successfully Confirmed the appointment request.');

    // Fetch and check status is now Confirmed
    const confirmGetRes = await fetch(`${BASE_URL}/appointments`, {
      headers: { 'Authorization': 'receptionist' }
    });
    const confirmList = await confirmGetRes.json();
    const confirmedApt = confirmList.find(apt => apt.id === testAppointmentId1);
    if (!confirmedApt || confirmedApt.status !== 'Confirmed') {
      throw new Error('Appointment status is not Confirmed');
    }
    console.log('✅ Confirmed status verified in appointment list.');

    // 5. Conflict Validation checks (Double-booking confirmed slots)
    console.log('\n[TEST 4] Double-Booking Validation (Confirmed conflicts)...');

    const duplicateApt = {
      patient_name: 'Conflict User',
      contact_number: '555-9999',
      doctor_name: 'Dr. Adams',
      appointment_date: '2026-06-20',
      appointment_time: '10:00:00', // same slot
      reason: 'Conflict test'
    };

    // Receptionist books a second appointment for the same slot (starts as Pending)
    const bookRes2 = await fetch(`${BASE_URL}/appointments`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': 'receptionist'
      },
      body: JSON.stringify(duplicateApt)
    });
    if (!bookRes2.ok) throw new Error('Failed to book second slot holder');
    const createdApt2 = await bookRes2.json();
    testAppointmentId2 = createdApt2.id;
    console.log('✅ Second appointment requested (Pending).');

    // Doctor tries to Accept/Confirm the conflicting pending appointment (should fail)
    const conflictAcceptRes = await fetch(`${BASE_URL}/appointments/${testAppointmentId2}/status`, {
      method: 'PUT',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': 'dr_adams'
      },
      body: JSON.stringify({ status: 'Confirmed' })
    });
    if (conflictAcceptRes.status !== 409) {
      throw new Error(`Expected 409 conflict when confirming double-booked slot, got ${conflictAcceptRes.status}`);
    }
    console.log('✅ Correctly blocked doctor from confirming a double-booked slot (409).');

    // 6. Completing confirmed appointment
    console.log('\n[TEST 5] Doctor Completing Appointment with Notes...');

    const noteRes = await fetch(`${BASE_URL}/appointments/${testAppointmentId1}/notes`, {
      method: 'PUT',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': 'dr_adams'
      },
      body: JSON.stringify({ visit_note: 'Patient is healthy. Verified all checks.' })
    });
    if (!noteRes.ok) throw new Error('Dr. Adams failed to add visit note');
    console.log('✅ Dr. Adams successfully recorded clinical notes.');

    // Fetch and check status is now Completed
    const finalGetRes = await fetch(`${BASE_URL}/appointments`, {
      headers: { 'Authorization': 'receptionist' }
    });
    const finalList = await finalGetRes.json();
    const finalApt = finalList.find(apt => apt.id === testAppointmentId1);
    if (!finalApt || finalApt.status !== 'Completed') {
      throw new Error('Appointment status is not Completed');
    }
    console.log('✅ Confirmed status auto-updated to Completed.');

    // 7. Modifying locks
    console.log('\n[TEST 6] Modification Lock checks...');

    // Try to modify completed appointment (should fail)
    const lockEditRes = await fetch(`${BASE_URL}/appointments/${testAppointmentId1}`, {
      method: 'PUT',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': 'receptionist'
      },
      body: JSON.stringify({
        ...finalApt,
        reason: 'Attempting to change finalized details'
      })
    });
    if (lockEditRes.status !== 400) {
      throw new Error(`Expected 400 status when editing Completed appointment, got ${lockEditRes.status}`);
    }
    console.log('✅ Correctly blocked modifications on Completed appointments.');

    console.log('\n⭐ ALL TESTS COMPLETED SUCCESSFULLY! ⭐');

  } catch (err) {
    console.error('\n❌ TEST SUITE FAILED:', err.message);
    process.exitCode = 1;
  } finally {
    // Cleanup test data from MySQL
    console.log('\nCleaning up test data from MySQL database...');
    try {
      if (testAppointmentId1) {
        await pool.query('DELETE FROM appointments WHERE id = ?', [testAppointmentId1]);
        console.log('🧹 Cleaned up test appointment ID:', testAppointmentId1);
      }
      if (testAppointmentId2) {
        await pool.query('DELETE FROM appointments WHERE id = ?', [testAppointmentId2]);
        console.log('🧹 Cleaned up test appointment ID:', testAppointmentId2);
      }
    } catch (cleanupErr) {
      console.error('Failed to clean up test data:', cleanupErr.message);
    }
    await pool.end();
    console.log('Closed database connection pool.');
  }
}

runTests();
