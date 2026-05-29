const express = require('express');
const auth = require('../middlewares/auth');
const { denyRole } = require('../middlewares/requireRole');
const controller = require('../controllers/reportController');

const router = express.Router();
router.use(auth);

// Reportes consultan/exportan transacciones del usuario. No aplica para admin.
const blockAdmin = denyRole('admin');

router.get('/transactions/export', blockAdmin, controller.transactionsExport);
router.get('/insights', blockAdmin, controller.insights);
router.get('/overview', blockAdmin, controller.overview);
router.get('/exports', blockAdmin, controller.listExports);

module.exports = router;
