const express = require('express');
const cors = require('cors');
const db = require('./db');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Import and use routes
const authRouter = require('./routes/auth');
const applicationsRouter = require('./routes/applications');

app.use('/api/auth', authRouter);
app.use('/api/applications', applicationsRouter);

// Health Check / Basic Status Route
app.get('/api/health', async (req, res) => {
  try {
    // Try pinging the database
    await db.query('SELECT 1');
    res.json({
      status: 'OK',
      message: 'Server is running and connected to database.',
      timestamp: new Date()
    });
  } catch (error) {
    res.status(500).json({
      status: 'ERROR',
      message: 'Server is running, but database connection failed.',
      error: error.message,
      timestamp: new Date()
    });
  }
});

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}

module.exports = app;
