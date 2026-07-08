require('dotenv').config();
const mysql = require('mysql2/promise');

const BASE_URL = `http://localhost:${process.env.PORT || 5005}`;

async function runTests() {
  console.log('--- Starting Integration Tests ---');
  console.log(`Targeting Server: ${BASE_URL}\n`);

  let partUserId, orgUserId, testRegId;
  let pool;

  try {
    // 0. Setup DB connection pool for cleanup
    pool = mysql.createPool({
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '3306', 10),
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'c10p1',
    });

    // Clean up any leftover test data first
    await pool.query("DELETE FROM registrations WHERE email = 'test-runner@example.com'");

    // 1. Test Login (Organizer)
    console.log('Test 1: Login as Organizer...');
    const loginOrgRes = await fetch(`${BASE_URL}/api/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'org', password: 'org' })
    });
    if (!loginOrgRes.ok) throw new Error('Organizer login failed');
    const loginOrgData = await loginOrgRes.json();
    orgUserId = loginOrgData.user.id;
    console.log(`✔ Organizer login successful (User ID: ${orgUserId})`);

    // 2. Test Login (Participant)
    console.log('\nTest 2: Login as Participant...');
    const loginPartRes = await fetch(`${BASE_URL}/api/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'part', password: 'part' })
    });
    if (!loginPartRes.ok) throw new Error('Participant login failed');
    const loginPartData = await loginPartRes.json();
    partUserId = loginPartData.user.id;
    console.log(`✔ Participant login successful (User ID: ${partUserId})`);

    // 3. Test Invalid Login
    console.log('\nTest 3: Login with invalid credentials...');
    const invalidLoginRes = await fetch(`${BASE_URL}/api/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'part', password: 'wrongpassword' })
    });
    if (invalidLoginRes.status === 401) {
      console.log('✔ Invalid credentials correctly rejected (Status: 401)');
    } else {
      throw new Error(`Expected status 401, got ${invalidLoginRes.status}`);
    }

    // 4. Test Registration creation (Participant role)
    console.log('\nTest 4: Create new registration as Participant...');
    const createRegRes = await fetch(`${BASE_URL}/api/registrations`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'x-user-id': partUserId.toString()
      },
      body: JSON.stringify({
        name: 'Test Runner',
        email: 'test-runner@example.com',
        workshop_title: 'React Basics for Beginners',
        registration_details: 'Automated test suite run'
      })
    });
    if (!createRegRes.ok) throw new Error('Registration submission failed');
    const createRegData = await createRegRes.json();
    testRegId = createRegData.registrationId;
    console.log(`✔ Registration created successfully in MySQL (ID: ${testRegId})`);

    // 5. Test view registrations (Participant role)
    console.log('\nTest 5: View registrations list...');
    const getRegsRes = await fetch(`${BASE_URL}/api/registrations`, {
      headers: { 'x-user-id': partUserId.toString() }
    });
    if (!getRegsRes.ok) throw new Error('Failed to fetch registrations');
    const regs = await getRegsRes.json();
    const createdItem = regs.find(r => r.id === testRegId);
    if (!createdItem || createdItem.name !== 'Test Runner') {
      throw new Error('Created registration not found in MySQL data fetch');
    }
    console.log('✔ Registration successfully read back from MySQL');

    // 6. Test Permissions (Participant restricted from PUT updates)
    console.log('\nTest 6: Check Participant permissions (should block PUT updates)...');
    const putPartRes = await fetch(`${BASE_URL}/api/registrations/${testRegId}`, {
      method: 'PUT',
      headers: { 
        'Content-Type': 'application/json',
        'x-user-id': partUserId.toString()
      },
      body: JSON.stringify({ status: 'confirmed' })
    });
    if (putPartRes.status === 403) {
      console.log('✔ Server blocked unauthorized update attempt (Status: 403 Forbidden)');
    } else {
      throw new Error(`Expected status 403, got ${putPartRes.status}`);
    }

    // 7. Test Permissions (Organizer allowed to update)
    console.log('\nTest 7a: Transition registration status to Waitlist (Organizer)...');
    const putWaitlistRes = await fetch(`${BASE_URL}/api/registrations/${testRegId}`, {
      method: 'PUT',
      headers: { 
        'Content-Type': 'application/json',
        'x-user-id': orgUserId.toString()
      },
      body: JSON.stringify({ status: 'waitlisted' })
    });
    if (!putWaitlistRes.ok) throw new Error('Failed to transition to waitlist');
    console.log('✔ Registration successfully transitioned to waitlisted status');

    console.log('\nTest 7b: Confirm Waitlisted status in MySQL...');
    const verifyWaitlistRes = await fetch(`${BASE_URL}/api/registrations`, {
      headers: { 'x-user-id': orgUserId.toString() }
    });
    const verifyWaitlistRegs = await verifyWaitlistRes.json();
    const waitlistedItem = verifyWaitlistRegs.find(r => r.id === testRegId);
    if (!waitlistedItem || waitlistedItem.status !== 'waitlisted') {
      throw new Error('Status was not updated to waitlisted in DB');
    }
    console.log('✔ Waitlisted status verified in database');

    console.log('\nTest 7c: Transition registration status from Waitlist to Confirmed (Organizer)...');
    const putOrgRes = await fetch(`${BASE_URL}/api/registrations/${testRegId}`, {
      method: 'PUT',
      headers: { 
        'Content-Type': 'application/json',
        'x-user-id': orgUserId.toString()
      },
      body: JSON.stringify({ 
        status: 'confirmed', 
        attendance: 'present',
        organizer_notes: 'Verified by integration tests'
      })
    });
    if (!putOrgRes.ok) throw new Error('Organizer update failed');
    console.log('✔ Waitlisted registration confirmed successfully by Organizer');

    // 8. Test Data Persistence Check
    console.log('\nTest 8: Verify modifications persisted in MySQL...');
    const verifyRes = await fetch(`${BASE_URL}/api/registrations`, {
      headers: { 'x-user-id': orgUserId.toString() }
    });
    const verifyRegs = await verifyRes.json();
    const updatedItem = verifyRegs.find(r => r.id === testRegId);
    if (!updatedItem) throw new Error('Updated registration item not found');
    
    if (updatedItem.status === 'confirmed' && 
        updatedItem.attendance === 'present' && 
        updatedItem.organizer_notes === 'Verified by integration tests') {
      console.log('✔ All fields (status, attendance, notes) verified in database');
    } else {
      throw new Error('Persisted data does not match organizer inputs');
    }

    // 9. Test Input Validation Rejections
    console.log('\nTest 9: Verify strict server-side validation error checking...');
    
    // Invalid email check
    const badEmailRes = await fetch(`${BASE_URL}/api/registrations`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-user-id': partUserId.toString() },
      body: JSON.stringify({
        name: 'Bad Email User',
        email: 'notanemail',
        workshop_title: 'React Basics for Beginners'
      })
    });
    if (badEmailRes.status !== 400) {
      throw new Error(`Expected status 400 for bad email format, got ${badEmailRes.status}`);
    }
    console.log('✔ Invalid email format correctly rejected');

    // Invalid workshop title check
    const badWorkshopRes = await fetch(`${BASE_URL}/api/registrations`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-user-id': partUserId.toString() },
      body: JSON.stringify({
        name: 'Bad Workshop User',
        email: 'test@example.com',
        workshop_title: 'Unsanctioned Workshop Topic'
      })
    });
    if (badWorkshopRes.status !== 400) {
      throw new Error(`Expected status 400 for bad workshop title, got ${badWorkshopRes.status}`);
    }
    console.log('✔ Invalid workshop title correctly rejected');

    // Invalid update ID check
    const badIdRes = await fetch(`${BASE_URL}/api/registrations/invalid_id`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', 'x-user-id': orgUserId.toString() },
      body: JSON.stringify({ status: 'confirmed' })
    });
    if (badIdRes.status !== 400) {
      throw new Error(`Expected status 400 for non-integer update ID, got ${badIdRes.status}`);
    }
    console.log('✔ Non-integer update ID correctly rejected');

    console.log('\n--- Cleaning up database test records ---');
    await pool.query('DELETE FROM registrations WHERE id = ?', [testRegId]);
    console.log('✔ Test records removed from MySQL.');

    console.log('\n🎉 ALL TESTS PASSED SUCCESSFULLY! 🎉');
  } catch (err) {
    console.error(`\n❌ TEST FAILURE: ${err.message}`);
    process.exit(1);
  } finally {
    if (pool) {
      await pool.end();
    }
  }
}

runTests();
