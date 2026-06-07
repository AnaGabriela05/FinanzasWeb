const express = require('express');
const morgan = require('morgan');
const cors = require('cors');
const logger = require('./config/logger');

const authRoutes        = require('./routes/authRoutes');
const categoryRoutes    = require('./routes/categoryRoutes');
const transactionRoutes = require('./routes/transactionRoutes');
const budgetRoutes      = require('./routes/budgetRoutes');
const methodRoutes      = require('./routes/paymentMethodRoutes');
const roleRoutes        = require('./routes/roleRoutes');
const reportRoutes      = require('./routes/reportRoutes');
const learningRoutes    = require('./routes/learningRoutes');
const adviceRoutes      = require('./routes/adviceRoutes');
const quizRoutes        = require('./routes/quizRoutes');
const adminRoutes       = require('./routes/adminRoutes');

const app = express();

const allowedOrigins = (process.env.CORS_ORIGINS || 'http://localhost:5173')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

app.use(cors({
  origin(origin, callback) {
    if (!origin) return callback(null, true); // permitir requests sin origin (curl, server-to-server)
    if (allowedOrigins.includes(origin)) return callback(null, true);
    return callback(new Error(`Origen no permitido por CORS: ${origin}`));
  },
  credentials: true
}));
app.use(express.json());
// Log HTTP de acceso (morgan). Se omite en test para no ensuciar la salida de
// vitest; el logger de aplicacion (winston) sigue siendo la pieza estructurada.
if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('dev'));
}

// Health
app.get('/api/health', (req, res) => res.json({ ok: true, service: 'finanzas' }));

// Configuracion publica (tasa de cambio actual)
const currencyConfig = require('./config/currency');
app.get('/api/config/currency', (req, res) => res.json({
  base: currencyConfig.BASE_CURRENCY,
  supported: currencyConfig.SUPPORTED,
  usdToPen: currencyConfig.usdToPen
}));

// API
app.use('/api/auth', authRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/budgets', budgetRoutes);
app.use('/api/payment-methods', methodRoutes);
app.use('/api/roles', roleRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/learning', learningRoutes);
app.use('/api/advice', adviceRoutes);
app.use('/api/quiz', quizRoutes);
app.use('/api/admin', adminRoutes);

// 404 para cualquier ruta no /api/*
app.use((req, res) => {
  res.status(404).json({ error: 'Ruta no encontrada' });
});

// Error handler
// Loguea el error con stack (sin volcar req.body, que puede traer credenciales).
app.use((err, req, res, next) => { // eslint-disable-line no-unused-vars
  logger.error('unhandled_error', {
    message: err.message,
    stack: err.stack,
    method: req.method,
    path: req.originalUrl,
    status: err.status || 500
  });
  res.status(err.status || 500).json({ error: err.message || 'Error interno' });
});

module.exports = app;
