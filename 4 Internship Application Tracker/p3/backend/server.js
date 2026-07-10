const express = require('express');
const cors = require('cors');
require('dotenv').config();
const db = require('./config/db');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    message: 'Backend server is running',
    timestamp: new Date()
  });
});

// Authentication routing
const authRoutes = require('./routes/authRoutes');
app.use('/api/auth', authRoutes);

// Applications routing
const applicationRoutes = require('./routes/applicationRoutes');
app.use('/api/applications', applicationRoutes);

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}

module.exports = app;
