const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'UP',
    timestamp: new Date(),
    service: 'Inventory Request System Backend API'
  });
});

// Route imports
const userRoutes = require('./routes/userRoutes');
const requestRoutes = require('./routes/requestRoutes');
const authRoutes = require('./routes/authRoutes');

// Mount routes
app.use('/api/users', userRoutes);
app.use('/api/requests', requestRoutes);
app.use('/api/auth', authRoutes);

app.listen(PORT, () => {
  console.log(`Backend server running on port ${PORT}`);
});
