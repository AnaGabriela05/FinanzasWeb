const express = require('express');
const auth = require('../middlewares/auth');
const controller = require('../controllers/roleController');

const router = express.Router();

router.use(auth);
router.get('/', controller.list);

module.exports = router;
