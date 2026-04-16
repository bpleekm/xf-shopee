const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'xf-shopee-backend',
    version: '1.0.0'
  });
});

// Hello world endpoint
app.get('/api/hello', (req, res) => {
  res.json({ message: 'Hello from XF Shopee Backend!' });
});

// Sample users endpoint (placeholder)
app.get('/api/users', (req, res) => {
  res.json([
    { id: 1, name: 'Admin User', role: 'admin' },
    { id: 2, name: 'Employee User', role: 'employee' },
    { id: 3, name: 'Guest User', role: 'guest' }
  ]);
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Endpoint not found' });
});

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Internal server error' });
});

// Start server
app.listen(PORT, () => {
  console.log(`XF Shopee Backend listening on port ${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/api/health`);
  console.log(`Hello endpoint: http://localhost:${PORT}/api/hello`);
  console.log(`Sample users: http://localhost:${PORT}/api/users`);
});

module.exports = app;