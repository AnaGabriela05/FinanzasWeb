const express = require('express');
const auth = require('../middlewares/auth');
const { requireRole } = require('../middlewares/requireRole');
const controller = require('../controllers/adminController');

const router = express.Router();

// Toda /api/admin/* requiere JWT valido + rol 'admin'.
router.use(auth);
router.use(requireRole('admin'));

// Usuarios
router.get('/users', controller.listUsers);
router.get('/users/:id', controller.getUserMetadata);
router.post('/users/:id/lock', controller.lockUser);
router.post('/users/:id/unlock', controller.unlockUser);
router.post('/users/:id/reset-attempts', controller.resetFailedAttempts);

// Categorias globales
router.post('/categories', controller.createGlobalCategory);
router.put('/categories/:id', controller.updateGlobalCategory);
router.post('/categories/:id/archive', controller.archiveGlobalCategory);
router.delete('/categories/:id', controller.deleteGlobalCategory);

// Metricas y auditoria
router.get('/metrics', controller.getMetrics);
router.get('/metrics/registrations', controller.getRegistrationsChart);
router.get('/audit/exports', controller.getExportLogs);

module.exports = router;
