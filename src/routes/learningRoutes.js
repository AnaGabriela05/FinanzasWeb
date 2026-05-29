const express = require('express');
const auth = require('../middlewares/auth');
const { denyRole } = require('../middlewares/requireRole');
const controller = require('../controllers/learningController');

const router = express.Router();

router.use(auth);

// Notas y checklist son datos personales del usuario.
const blockAdmin = denyRole('admin');

router.get('/:videoId/state', blockAdmin, controller.getState);
router.put('/:videoId/state', blockAdmin, controller.saveState);

module.exports = router;
