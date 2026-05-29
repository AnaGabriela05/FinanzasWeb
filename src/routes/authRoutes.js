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
  // Los tests de integracion ejecutan varios logins seguidos desde la misma IP.
  // Sin este skip, el rate limit dispararia 429 y enmascararia el caso real.
  skip: () => process.env.NODE_ENV === 'test',
  message: { error: 'Demasiados intentos. Intenta de nuevo en unos minutos.' }
});

router.post('/register', authRateLimiter, registerValidator, validateRequest, controller.register);
router.post('/login', authRateLimiter, loginValidator, validateRequest, controller.login);

module.exports = router;
