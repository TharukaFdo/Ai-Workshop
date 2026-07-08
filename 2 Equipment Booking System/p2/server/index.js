import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { testConnection } from './db.js';
import authRouter from './routes/auth.js';
import bookingsRouter from './routes/bookings.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// API Health Check
app.get('/api/health', async (req, res) => {
  const dbConnected = await testConnection();
  res.json({
    status: 'online',
    database: dbConnected ? 'connected' : 'disconnected',
    timestamp: new Date()
  });
});

// Mount modular routes
app.use('/api/auth', authRouter);
app.use('/api/bookings', bookingsRouter);

const server = app.listen(PORT, async () => {
  console.log(`🚀 Express server running on port ${PORT}`);
  await testConnection();
});

export { app, server };
