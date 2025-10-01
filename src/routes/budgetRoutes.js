const express = require('express');
const auth = require('../middlewares/auth');
const controller = require('../controllers/budgetController');

const router = express.Router();

router.use(auth);
router.post('/', controller.upsert);
router.get('/', controller.list);
router.delete('/:id', controller.remove);
router.put('/:id', controller.update);
module.exports = router;
