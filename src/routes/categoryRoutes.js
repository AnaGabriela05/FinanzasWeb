const express = require('express');
const auth = require('../middlewares/auth');
const { denyRole } = require('../middlewares/requireRole');
const validateRequest = require('../middlewares/validateRequest');
const controller = require('../controllers/categoryController');
const {
  createCategoryValidator,
  updateCategoryValidator,
  removeCategoryValidator,
  usageCategoryValidator,
  listCategoryValidator,
  categoryIdParamValidator
} = require('../validators/categoryValidators');

const router = express.Router();

router.use(auth);

// El admin gestiona categorias globales en /api/admin/categories.
// Aqui (CRUD de usuario final) se le bloquean POST/PUT/DELETE.
// La LECTURA del catalogo queda abierta para que el modo "Vista como usuario" funcione.
const blockAdminWrite = denyRole('admin');

router.post('/', blockAdminWrite, createCategoryValidator, validateRequest, controller.create);
router.get('/', listCategoryValidator, validateRequest, controller.list);
router.get('/listadoTotal', controller.listadoTotal);
router.put('/:id', blockAdminWrite, updateCategoryValidator, validateRequest, controller.update);
router.delete('/:id', blockAdminWrite, removeCategoryValidator, validateRequest, controller.remove);

router.post('/:id/restore', blockAdminWrite, categoryIdParamValidator, validateRequest, controller.restore);

router.get('/:id/usage', usageCategoryValidator, validateRequest, controller.usage);
router.get('/:id/stats', usageCategoryValidator, validateRequest, controller.usage);

module.exports = router;
