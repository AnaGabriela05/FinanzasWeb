// app.js
const express = require('express');
const morgan = require('morgan');
const cors = require('cors');
const path = require('path');

const authRoutes        = require('./routes/authRoutes');
const categoryRoutes    = require('./routes/categoryRoutes');
const transactionRoutes = require('./routes/transactionRoutes');
const budgetRoutes      = require('./routes/budgetRoutes');
const methodRoutes      = require('./routes/paymentMethodRoutes');
const roleRoutes        = require('./routes/roleRoutes');
const reportRoutes      = require('./routes/reportRoutes');
const learningRoutes    = require('./routes/learningRoutes'); // ← CORRECTO

const app = express();

app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

// Frontend estático
app.use(express.static(path.join(__dirname, '..', 'public')));

// Health
app.get('/api/health', (req, res) => res.json({ ok: true, service: 'finanzas' }));

// API
app.use('/api/auth', authRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/budgets', budgetRoutes);
app.use('/api/payment-methods', methodRoutes);
app.use('/api/roles', roleRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/learning', learningRoutes);  // ← AQUI

// Fallback
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'public', 'index.html'));
});

// Error handler
app.use((err, req, res, next) => {
  console.error(err);
  res.status(err.status || 500).json({ error: err.message || 'Error interno' });
});

module.exports = app;
