const express = require('express');
const router = express.Router();
const RegistrationService = require('../services/registrationService');
const AuthService = require('../services/authService');

// Shared helper to retrieve and verify user from the x-auth-token header
const getAuthenticatedUser = async (req) => {
  const token = req.headers['x-auth-token'];
  if (!token) {
    throw { status: 401, error: 'Access Denied: Missing authorization token.' };
  }
  const user = await AuthService.findUserByEmail(token);
  if (!user) {
    throw { status: 403, error: 'Access Denied: User not found.' };
  }
  return user;
};

// Middleware to perform database-backed authorization checks by role
const checkRole = (roles) => {
  return async (req, res, next) => {
    try {
      const user = await getAuthenticatedUser(req);
      if (!roles.includes(user.role)) {
        return res.status(403).json({ error: 'Access Denied: Insufficient permissions.' });
      }
      req.user = user;
      next();
    } catch (err) {
      if (err.status) {
        return res.status(err.status).json({ error: err.error });
      }
      res.status(500).json({ error: 'Authorization error: ' + err.message });
    }
  };
};

// Middleware to verify user identity for personal operations
const checkOwnership = () => {
  return async (req, res, next) => {
    try {
      const user = await getAuthenticatedUser(req);
      req.user = user;
      next();
    } catch (err) {
      if (err.status) {
        return res.status(err.status).json({ error: err.error });
      }
      res.status(500).json({ error: 'Ownership validation error: ' + err.message });
    }
  };
};

// Participant: Create registration
router.post('/', checkOwnership(), async (req, res) => {
  try {
    const { participantName, email, workshopTitle, registrationDetails } = req.body;
    
    // Server-side validation
    if (!participantName || !email || !workshopTitle || !registrationDetails) {
      return res.status(400).json({ error: 'All fields (Name, Email, Workshop, Details) are required.' });
    }
    if (!participantName.trim() || !workshopTitle.trim() || !registrationDetails.trim()) {
      return res.status(400).json({ error: 'Required fields cannot be empty spaces.' });
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ error: 'Invalid email address format.' });
    }

    // Security: Participant can only register using their own authenticated email address
    if (req.user.role === 'participant' && req.user.email !== email) {
      return res.status(403).json({ error: 'Access Denied: Cannot register under another user\'s email.' });
    }

    const reg = await RegistrationService.createRegistration({
      participantName,
      email,
      workshopTitle,
      registrationDetails
    });
    res.status(201).json(reg);
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ error: 'You are already registered for this workshop.' });
    }
    // Security: Avoid detailed DB internal error leaks
    res.status(500).json({ error: 'Internal server error occurred.' });
  }
});

// Participant: View own registrations
router.get('/my', checkOwnership(), async (req, res) => {
  try {
    const { email } = req.query;
    if (!email) {
      return res.status(400).json({ error: 'Email parameter is required.' });
    }

    // Security: Participant can only view their own registrations
    if (req.user.role === 'participant' && req.user.email !== email) {
      return res.status(403).json({ error: 'Access Denied: Cannot view registrations of other users.' });
    }

    const regs = await RegistrationService.getRegistrationsByEmail(email);
    res.json(regs);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error occurred.' });
  }
});

// Participant: Update registration details (Must be pending)
router.put('/:id', checkOwnership(), async (req, res) => {
  try {
    const { id } = req.params;
    const { email, registrationDetails } = req.body;
    if (!email || !registrationDetails) {
      return res.status(400).json({ error: 'Email and registration details are required.' });
    }
    if (!registrationDetails.trim()) {
      return res.status(400).json({ error: 'Registration details cannot be empty.' });
    }

    // Security: Participant can only modify details of their own registration
    if (req.user.role === 'participant' && req.user.email !== email) {
      return res.status(403).json({ error: 'Access Denied: Cannot modify another user\'s registration.' });
    }

    const updated = await RegistrationService.updateRegistrationDetails(parseInt(id), email, { registrationDetails });
    res.json(updated);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Organizer: View all registrations (with filters)
router.get('/', checkRole(['organizer']), async (req, res) => {
  try {
    const { workshopTitle, status, attendanceStatus } = req.query;
    
    // Server-side query parameter validation
    if (status && !['pending', 'confirmed', 'cancelled', 'waitlisted'].includes(status)) {
      return res.status(400).json({ error: 'Invalid registration status filter.' });
    }
    if (attendanceStatus && !['notMarked', 'present', 'absent'].includes(attendanceStatus)) {
      return res.status(400).json({ error: 'Invalid attendance status filter.' });
    }

    const regs = await RegistrationService.getAllRegistrations({
      workshopTitle,
      status,
      attendanceStatus
    });
    res.json(regs);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error occurred.' });
  }
});

// Organizer: Update registration status
router.patch('/:id/status', checkRole(['organizer']), async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    
    if (!status) {
      return res.status(400).json({ error: 'Status is required.' });
    }
    if (!['pending', 'confirmed', 'cancelled', 'waitlisted'].includes(status)) {
      return res.status(400).json({ error: 'Invalid registration status.' });
    }

    const updated = await RegistrationService.updateRegistrationStatus(parseInt(id), status);
    res.json(updated);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Organizer: Update organizer note
router.patch('/:id/notes', checkRole(['organizer']), async (req, res) => {
  try {
    const { id } = req.params;
    const { organizerNote } = req.body;
    
    if (organizerNote === undefined || organizerNote === null) {
      return res.status(400).json({ error: 'Organizer note is required.' });
    }

    const updated = await RegistrationService.updateOrganizerNote(parseInt(id), organizerNote);
    res.json(updated);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Organizer: Update attendance status
router.patch('/:id/attendance', checkRole(['organizer']), async (req, res) => {
  try {
    const { id } = req.params;
    const { attendanceStatus } = req.body;
    
    if (!attendanceStatus) {
      return res.status(400).json({ error: 'Attendance status is required.' });
    }
    if (!['notMarked', 'present', 'absent'].includes(attendanceStatus)) {
      return res.status(400).json({ error: 'Invalid attendance status.' });
    }

    const updated = await RegistrationService.updateAttendanceStatus(parseInt(id), attendanceStatus);
    res.json(updated);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

module.exports = router;
