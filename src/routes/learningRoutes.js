const express = require('express');
const router  = express.Router();
const auth    = require('../middlewares/auth');   // debe poner req.user.id
const ctrl    = require('../controllers/learningController');

router.use(auth); // ← protege todo

router.get('/:videoId/state', ctrl.getState);
router.put('/:videoId/state', ctrl.saveState);

module.exports = router;
