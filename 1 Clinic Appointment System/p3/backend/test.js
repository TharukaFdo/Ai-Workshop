const db = require('./config/db');
const appointmentService = require('./services/appointmentService');
const crypto = require('crypto');

function hashPassword(password) {
  return crypto.createHash('sha256').update(password).digest('hex');
}

async function runTests() {
  console.log('==================================================');
  console.log('   CLINIC APPOINTMENT SYSTEM: INTEGRATION TESTS');
  console.log('==================================================');

  let passedTests = 0;
  let failedTests = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(`[PASS] - ${message}`);
      passedTests++;
    } else {
      console.error(`[FAIL] - ${message}`);
      failedTests++;
    }
  }

  try {
    // 1. Database Connectivity Check
    const [connCheck] = await db.query('SELECT 1');
    assert(connCheck.length > 0, 'Database connectivity established successfully.');

    // 2. Database-backed Login Checks
    const testUsername = 'dr_smith';
    const rawPassword = 'password123';
    const [userRows] = await db.query('SELECT password_hash, role, doctor_name FROM app_users WHERE username = ?', [testUsername]);
    
    assert(userRows.length > 0, 'User "dr_smith" exists in the login table.');
    const dbHash = userRows[0].password_hash;
    const inputHash = hashPassword(rawPassword);
    assert(inputHash === dbHash, 'User password hashes match correctly.');
    assert(userRows[0].role === 'Doctor' && userRows[0].doctor_name === 'Dr. Smith', 'Database returns correct role and doctor assignment details.');

    // Cleanup any lingering old test records first
    await db.query("DELETE FROM appointments WHERE patientName LIKE 'TEST-%'");

    // 3. Create Appointment (Main Workflow)
    const testData = {
      patientName: 'TEST-John Doe',
      patientPhone: '555-1234',
      doctorName: 'Dr. Smith',
      appointmentDate: '2026-07-10',
      appointmentTime: '14:30:00',
      reason: 'Regular consultation'
    };

    const newApp = await appointmentService.createAppointment(testData);
    assert(newApp.id !== undefined, 'Appointment created with auto-increment ID.');
    assert(newApp.status === 'pending', 'Default status is set to "pending".');

    const testAppId = newApp.id;

    // 4. View / List & Filtering Checks
    const allApps = await appointmentService.getAllAppointments();
    assert(allApps.some(app => app.id === testAppId), 'Newly created appointment is visible in full list.');

    const filteredDoc = await appointmentService.getAllAppointments({ doctorName: 'Dr. Smith' });
    assert(filteredDoc.every(app => app.doctorName === 'Dr. Smith'), 'Doctor filter returns only matches for specific doctor.');

    const filteredStatus = await appointmentService.getAllAppointments({ status: 'completed' });
    assert(filteredStatus.every(app => app.status === 'completed'), 'Status filter returns only completed records.');

    // 5. Reschedule Booking Details
    const updateData = {
      patientName: 'TEST-John Doe Updated',
      patientPhone: '555-9999',
      doctorName: 'Dr. Jones',
      appointmentDate: '2026-07-11',
      appointmentTime: '09:00:00',
      reason: 'Updated consultation details'
    };

    const bookingUpdated = await appointmentService.updateAppointmentBooking(testAppId, updateData);
    assert(bookingUpdated === true, 'Receptionist allowed action: update pending/accepted appointment details.');

    const updatedApp = await appointmentService.getAppointmentById(testAppId);
    assert(updatedApp.patientName === 'TEST-John Doe Updated', 'Updates successfully persisted to MySQL.');

    // 6. Doctor Accept Appointment Flow
    const acceptAction = await appointmentService.acceptAppointment(testAppId);
    assert(acceptAction === true, 'Doctor allowed action: accept a pending appointment.');

    // 7. Protected Actions: Add/Edit Visit Notes (Doctor role - allowed only for accepted appointments)
    const noteSaved = await appointmentService.updateAppointmentNotes(testAppId, 'Diagnosis: Healthy.', 'completed');
    assert(noteSaved === true, 'Doctor allowed action: Save visit notes and complete accepted booking.');

    const completedApp = await appointmentService.getAppointmentById(testAppId);
    assert(completedApp.status === 'completed', 'Appointment status transitioned to completed.');
    assert(completedApp.visitNote === 'Diagnosis: Healthy.', 'Visit notes updated successfully.');

    // 8. Security block: Cannot edit details when status is completed
    const illegalUpdate = await appointmentService.updateAppointmentBooking(testAppId, updateData);
    assert(illegalUpdate === false, 'Security constraint: Cannot update booking details of a completed appointment.');

    // 9. Cancel Workflow Check (Create another record to cancel)
    const cancelTarget = await appointmentService.createAppointment({
      patientName: 'TEST-Cancel Patient',
      patientPhone: '555-0000',
      doctorName: 'Dr. Jones',
      appointmentDate: '2026-08-01',
      appointmentTime: '11:00:00',
      reason: 'Soon to be cancelled'
    });

    const isCancelled = await appointmentService.cancelAppointment(cancelTarget.id);
    assert(isCancelled === true, 'Receptionist allowed action: cancel appointment.');

    const cancelledCheck = await appointmentService.getAppointmentById(cancelTarget.id);
    assert(cancelledCheck.status === 'cancelled', 'Appointment status set to cancelled.');

    // 9. Cleanup Test Data
    const cleanupResult = await db.query("DELETE FROM appointments WHERE patientName LIKE 'TEST-%'");
    assert(cleanupResult[0].affectedRows > 0, 'Test records cleaned up successfully.');

  } catch (error) {
    console.error('Fatal test execution failure:', error);
    failedTests++;
  } finally {
    console.log('==================================================');
    console.log(`TEST RUN SUMMARY: ${passedTests} PASSED, ${failedTests} FAILED`);
    console.log('==================================================');
    process.exit(failedTests > 0 ? 1 : 0);
  }
}

runTests();
