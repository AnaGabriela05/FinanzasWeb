const express = require('express');
const auth = require('../middlewares/auth');
const { denyRole } = require('../middlewares/requireRole');
const controller = require('../controllers/quizController');

const router = express.Router();

router.use(auth);

// Los quizzes son progreso personal del usuario final.
const blockAdmin = denyRole('admin');

router.post('/start', blockAdmin, controller.start);
router.post('/submit', blockAdmin, controller.submit);
router.get('/progress', blockAdmin, controller.getProgress);
router.get('/videos-status', blockAdmin, controller.getVideosStatus);
router.get('/history', blockAdmin, controller.getHistory);

module.exports = router;
