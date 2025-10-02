const express = require('express');
const auth = require('../middlewares/auth');
const controller = require('../controllers/reportController');

const router = express.Router();
router.use(auth);

router.get('/transactions/export', controller.transactionsExport);
router.get('/insights', controller.insights); 
module.exports = router;
