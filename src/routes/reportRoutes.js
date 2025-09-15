const express = require('express');
const auth = require('../middlewares/auth');
const controller = require('../controllers/reportController');

const router = express.Router();
router.use(auth);

// GET /api/reports/transactions/export?from=YYYY-MM-DD&to=YYYY-MM-DD&categoryId=&paymentMethodId=&format=pdf|xlsx
router.get('/transactions/export', controller.transactionsExport);

module.exports = router;
