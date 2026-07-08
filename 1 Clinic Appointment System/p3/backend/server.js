const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Routes
const authRoutes = require('./routes/auth');
const appointmentRoutes = require('./routes/appointments');

app.use('/api/auth', authRoutes);
app.use('/api/appointments', appointmentRoutes);

app.get('/health', (req, res) => {
  res.json({ status: 'OK', message: 'Clinic Appointment System API is running' });
});

// Database connectivity check on startup
const db = require('./config/db');
db.query('SELECT 1')
  .then(() => console.log('Successfully connected to MySQL database pool.'))
  .catch((err) => {
    console.error('Warning: MySQL connection pool failed on startup. Ensure local MySQL server is running and configuration is correct.');
    console.error(err.message);
  });

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
