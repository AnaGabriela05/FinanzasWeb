const express = require('express');
const auth = require('../middlewares/auth');
const controller = require('../controllers/categoryController');

const router = express.Router();

router.use(auth);
router.post('/', controller.create);
router.get('/', controller.list);
router.get('/listadoTotal', controller.listadoTotal);
router.put('/:id', controller.update);
router.delete('/:id', controller.remove);

// Restaurar visibilidad de una global oculta para el usuario
router.post('/:id/restore', controller.restore);

// Uso/estadísticas (para el modal de confirmación)
// Por defecto scope=mine; admin puede usar ?scope=all en categorías globales
router.get('/:id/usage', controller.usage);
// Alias opcional por compatibilidad con front antiguo:
router.get('/:id/stats', controller.usage);

module.exports = router;
