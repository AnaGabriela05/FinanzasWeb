const router = require('express').Router();
const auth = require('../middlewares/auth');
const ctrl = require('../controllers/learningController');

router.use(auth);
router.get('/topics', ctrl.getTopics);
router.get('/lessons', ctrl.getLessons);
router.get('/lesson/:id', ctrl.getLesson);
router.get('/lesson/:id/quiz', ctrl.getQuiz);
router.post('/lesson/:id/quiz', ctrl.submitQuiz);
router.post('/lesson/:id/complete', ctrl.markComplete);
router.get('/progress/me', ctrl.myProgress);

module.exports = router;
