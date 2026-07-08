const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('./config/db');
const authMiddleware = require('./middleware/auth');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret_key_for_helpdesk_prototype';

// Disable Express fingerprinting header
app.disable('x-powered-by');

// 1. Custom Secure Headers Middleware (Offline-safe alternative to Helmet)
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader(
    'Content-Security-Policy',
    "default-src 'self'; style-src 'self' 'unsafe-inline' fonts.googleapis.com; font-src fonts.gstatic.com; img-src 'self' data:;"
  );
  next();
});

app.use(cors());
app.use(express.json());

// 2. Custom Memory-Based Rate Limiter Middleware
const loginAttempts = new Map();
function rateLimiter(limit, windowMs) {
  return (req, res, next) => {
    const ip = req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress;
    const now = Date.now();

    if (!loginAttempts.has(ip)) {
      loginAttempts.set(ip, { count: 1, resetTime: now + windowMs });
      return next();
    }

    const data = loginAttempts.get(ip);
    if (now > data.resetTime) {
      loginAttempts.set(ip, { count: 1, resetTime: now + windowMs });
      return next();
    }

    data.count++;
    if (data.count > limit) {
      return res.status(429).json({ error: 'Too many requests. Please try again later.' });
    }
    next();
  };
}

// 3. Input Sanitization Helper
function sanitizeInput(str) {
  if (typeof str !== 'string') return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
}

// Verify database connection pool on startup
db.getConnection()
  .then((conn) => {
    console.log('Database connected successfully to c3p1');
    conn.release();
  })
  .catch((err) => {
    console.error('Database connection failed:', err);
  });

// GET /api/health - Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Helpdesk API is running and connected' });
});

// POST /api/login - Authenticate user and issue JWT (with rate limiting)
app.post('/api/login', rateLimiter(20, 60000), async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password are required' });
    }

    // Input sanitization/validation
    const cleanUsername = sanitizeInput(username).trim();
    if (cleanUsername.length > 50) {
      return res.status(400).json({ error: 'Username too long' });
    }

    const [rows] = await db.query('SELECT * FROM users WHERE username = ?', [cleanUsername]);
    if (rows.length === 0) {
      return res.status(401).json({ error: 'Invalid username or password' });
    }

    const user = rows[0];
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid username or password' });
    }

    // Sign JWT
    const token = jwt.sign(
      { id: user.id, username: user.username, role: user.role },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({
      token,
      user: {
        id: user.id,
        username: user.username,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Server error during login' });
  }
});

// --- PROTECTED ROUTES ---
app.use(authMiddleware);

// GET /api/tickets - Fetch tickets (Filtered by permission: Customer vs Agent)
app.get('/api/tickets', async (req, res) => {
  try {
    const { category, status, created_by } = req.query;
    let query = `
      SELECT t.*, u.username AS created_by 
      FROM tickets t
      JOIN users u ON t.user_id = u.id
      WHERE 1=1
    `;
    const params = [];

    // Enforce role boundary
    if (req.user.role === 'customer') {
      query += ' AND t.user_id = ?';
      params.push(req.user.id);
    } else if (req.user.role === 'agent') {
      if (created_by) {
        query += ' AND u.username = ?';
        params.push(sanitizeInput(created_by).trim());
      }
    }

    if (category) {
      const allowedCategories = ['Technical', 'Billing', 'Hardware', 'General'];
      if (allowedCategories.includes(category)) {
        query += ' AND t.category = ?';
        params.push(category);
      }
    }
    if (status) {
      const allowedStatuses = ['Open', 'In Progress', 'Resolved', 'Closed'];
      if (allowedStatuses.includes(status)) {
        query += ' AND t.status = ?';
        params.push(status);
      }
    }

    query += ' ORDER BY t.created_at DESC';

    const [rows] = await db.query(query, params);
    res.json(rows);
  } catch (error) {
    console.error('Error fetching tickets:', error);
    res.status(500).json({ error: 'Failed to fetch tickets' });
  }
});

// GET /api/tickets/:id - Fetch single ticket and its responses
app.get('/api/tickets/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const ticketId = parseInt(id, 10);
    if (isNaN(ticketId)) {
      return res.status(400).json({ error: 'Invalid ticket ID' });
    }

    // Get ticket details and creator username
    const [tickets] = await db.query(
      `SELECT t.*, u.username AS created_by 
       FROM tickets t 
       JOIN users u ON t.user_id = u.id 
       WHERE t.id = ?`,
      [ticketId]
    );

    if (tickets.length === 0) {
      return res.status(404).json({ error: 'Ticket not found' });
    }

    const ticket = tickets[0];

    // Enforce role boundary: Customers cannot view other users' tickets
    if (req.user.role === 'customer' && ticket.user_id !== req.user.id) {
      return res.status(403).json({ error: 'Access denied. You cannot view other users tickets.' });
    }

    // Get ticket responses with responder username
    const [responses] = await db.query(
      `SELECT r.*, u.username AS responder_name, u.role AS responder_role
       FROM responses r
       JOIN users u ON r.user_id = u.id
       WHERE r.ticket_id = ?
       ORDER BY r.created_at ASC`,
      [ticketId]
    );

    const formattedResponses = responses.map(r => ({
      id: r.id,
      ticket_id: r.ticket_id,
      responder_name: r.responder_role === 'agent' ? 'Support Agent' : r.responder_name,
      message: r.message,
      created_at: r.created_at
    }));

    res.json({
      ...ticket,
      responses: formattedResponses
    });
  } catch (error) {
    console.error('Error fetching ticket details:', error);
    res.status(500).json({ error: 'Failed to fetch ticket details' });
  }
});

// POST /api/tickets - Create a new ticket (linked to active user)
app.post('/api/tickets', async (req, res) => {
  try {
    const { title, description, category } = req.body;

    if (!title || !description || !category) {
      return res.status(400).json({ error: 'Title, description, and category are required' });
    }

    // Strict input length validation
    const cleanTitle = sanitizeInput(title).trim();
    const cleanDescription = sanitizeInput(description).trim();
    const cleanCategory = category.trim();

    if (cleanTitle.length < 3 || cleanTitle.length > 150) {
      return res.status(400).json({ error: 'Title must be between 3 and 150 characters' });
    }
    if (cleanDescription.length < 10 || cleanDescription.length > 5000) {
      return res.status(400).json({ error: 'Description must be between 10 and 5000 characters' });
    }

    const allowedCategories = ['Technical', 'Billing', 'Hardware', 'General'];
    if (!allowedCategories.includes(cleanCategory)) {
      return res.status(400).json({ error: 'Invalid category option' });
    }

    const [result] = await db.query(
      'INSERT INTO tickets (title, description, category, user_id) VALUES (?, ?, ?, ?)',
      [cleanTitle, cleanDescription, cleanCategory, req.user.id]
    );

    const [newTicket] = await db.query(
      `SELECT t.*, u.username AS created_by 
       FROM tickets t 
       JOIN users u ON t.user_id = u.id 
       WHERE t.id = ?`, 
      [result.insertId]
    );

    res.status(201).json(newTicket[0]);
  } catch (error) {
    console.error('Error creating ticket:', error);
    res.status(500).json({ error: 'Failed to create ticket' });
  }
});

// POST /api/tickets/:id/responses - Add a response and update ticket status (RBAC enforced)
app.post('/api/tickets/:id/responses', async (req, res) => {
  const connection = await db.getConnection();
  try {
    const { id } = req.params;
    const ticketId = parseInt(id, 10);
    if (isNaN(ticketId)) {
      return res.status(400).json({ error: 'Invalid ticket ID' });
    }

    const { message, status } = req.body;
    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    // Validation
    const cleanMessage = sanitizeInput(message).trim();
    if (cleanMessage.length < 1 || cleanMessage.length > 2000) {
      return res.status(400).json({ error: 'Message must be between 1 and 2000 characters' });
    }

    await connection.beginTransaction();

    // Verify ticket exists
    const [tickets] = await connection.query('SELECT * FROM tickets WHERE id = ?', [ticketId]);
    if (tickets.length === 0) {
      await connection.rollback();
      return res.status(404).json({ error: 'Ticket not found' });
    }

    const ticket = tickets[0];

    // Enforce role boundary
    if (req.user.role === 'customer') {
      if (ticket.user_id !== req.user.id) {
        await connection.rollback();
        return res.status(403).json({ error: 'Access denied. You cannot reply to other users tickets.' });
      }
      if (status && status !== ticket.status) {
        await connection.rollback();
        return res.status(403).json({ error: 'Access denied. Customers cannot change ticket status.' });
      }
    }

    // Add response
    await connection.query(
      'INSERT INTO responses (ticket_id, user_id, message) VALUES (?, ?, ?)',
      [ticketId, req.user.id, cleanMessage]
    );

    // Update status if agent provided it
    if (status && req.user.role === 'agent') {
      const allowedStatuses = ['Open', 'In Progress', 'Resolved', 'Closed'];
      if (!allowedStatuses.includes(status)) {
        await connection.rollback();
        return res.status(400).json({ error: 'Invalid status option' });
      }
      await connection.query('UPDATE tickets SET status = ? WHERE id = ?', [status, ticketId]);
    }

    await connection.commit();

    // Fetch updated ticket and responses
    const [updatedTicket] = await db.query(
      `SELECT t.*, u.username AS created_by 
       FROM tickets t 
       JOIN users u ON t.user_id = u.id 
       WHERE t.id = ?`,
      [ticketId]
    );

    const [responses] = await db.query(
      `SELECT r.*, u.username AS responder_name, u.role AS responder_role
       FROM responses r
       JOIN users u ON r.user_id = u.id
       WHERE r.ticket_id = ?
       ORDER BY r.created_at ASC`,
      [ticketId]
    );

    const formattedResponses = responses.map(r => ({
      id: r.id,
      ticket_id: r.ticket_id,
      responder_name: r.responder_role === 'agent' ? 'Support Agent' : r.responder_name,
      message: r.message,
      created_at: r.created_at
    }));

    res.json({
      ...updatedTicket[0],
      responses: formattedResponses
    });
  } catch (error) {
    await connection.rollback();
    console.error('Error adding response:', error);
    res.status(500).json({ error: 'Failed to add response' });
  } finally {
    connection.release();
  }
});

// PATCH /api/tickets/:id/status - Update ticket status (Agent actions, plus Customer Reopen once)
app.patch('/api/tickets/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const ticketId = parseInt(id, 10);
    if (isNaN(ticketId)) {
      return res.status(400).json({ error: 'Invalid ticket ID' });
    }

    const { status } = req.body;
    if (!status) {
      return res.status(400).json({ error: 'Status is required' });
    }

    const allowedStatuses = ['Open', 'In Progress', 'Resolved', 'Closed'];
    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({ error: 'Invalid status option' });
    }

    // Role-based security checks
    if (req.user.role === 'customer') {
      // Get current ticket
      const [tickets] = await db.query('SELECT * FROM tickets WHERE id = ?', [ticketId]);
      if (tickets.length === 0) {
        return res.status(404).json({ error: 'Ticket not found' });
      }
      const ticket = tickets[0];

      // Must be ticket owner
      if (ticket.user_id !== req.user.id) {
        return res.status(403).json({ error: 'Access denied. You cannot modify other users tickets.' });
      }

      // Customer can ONLY update to 'Open' (reopen)
      if (status !== 'Open') {
        return res.status(403).json({ error: 'Access denied. Customers can only reopen tickets (status: Open).' });
      }

      // Ticket must currently be Closed
      if (ticket.status !== 'Closed') {
        return res.status(400).json({ error: 'Only closed tickets can be reopened.' });
      }

      // Must not have been reopened yet
      if (ticket.reopened !== 0) {
        return res.status(400).json({ error: 'This ticket has already been reopened once.' });
      }

      // Reopen ticket
      await db.query('UPDATE tickets SET status = ?, reopened = 1 WHERE id = ?', ['Open', ticketId]);
    } else if (req.user.role === 'agent') {
      const [result] = await db.query('UPDATE tickets SET status = ? WHERE id = ?', [status, ticketId]);
      if (result.affectedRows === 0) {
        return res.status(404).json({ error: 'Ticket not found' });
      }
    } else {
      return res.status(403).json({ error: 'Access denied.' });
    }

    const [updatedTicket] = await db.query(
      `SELECT t.*, u.username AS created_by 
       FROM tickets t 
       JOIN users u ON t.user_id = u.id 
       WHERE t.id = ?`,
      [ticketId]
    );
    res.json(updatedTicket[0]);
  } catch (error) {
    console.error('Error updating status:', error);
    res.status(500).json({ error: 'Failed to update ticket status' });
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
