const express = require('express');
const auth = require('../middlewares/auth');
const controller = require('../controllers/categoryController');

const router = express.Router();

router.use(auth);
router.post('/', controller.create);
router.get('/', controller.list);
router.put('/:id', controller.update);
router.delete('/:id', controller.remove);

module.exports = router;
