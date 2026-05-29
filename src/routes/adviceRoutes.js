const express = require('express');
const auth = require('../middlewares/auth');
const { denyRole } = require('../middlewares/requireRole');
const controller = require('../controllers/adviceController');

const router = express.Router();

router.use(auth);

// Consejos IA se generan sobre el contexto financiero del usuario; no aplica para admin.
const blockAdmin = denyRole('admin');

router.get('/', blockAdmin, controller.getCurrent);
router.get('/history', blockAdmin, controller.getHistory);
router.get('/stats', blockAdmin, controller.getStats);
router.post('/regenerate', blockAdmin, controller.regenerate);

module.exports = router;
