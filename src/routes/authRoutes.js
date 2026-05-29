const express = require('express');
const rateLimit = require('express-rate-limit');
const controller = require('../controllers/authController');
const validateRequest = require('../middlewares/validateRequest');
const { registerValidator, loginValidator } = require('../validators/authValidators');

const router = express.Router();

const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 10,                  // 10 intentos por IP por ventana
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Demasiados intentos. Intenta de nuevo en unos minutos.' }
});

router.post('/register', authRateLimiter, registerValidator, validateRequest, controller.register);
router.post('/login', authRateLimiter, loginValidator, validateRequest, controller.login);

module.exports = router;
