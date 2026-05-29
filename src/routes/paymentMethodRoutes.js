const express = require('express');
const auth = require('../middlewares/auth');
const { denyRole } = require('../middlewares/requireRole');
const validateRequest = require('../middlewares/validateRequest');
const controller = require('../controllers/paymentMethodController');
const {
  createPaymentMethodValidator,
  updatePaymentMethodValidator,
  removePaymentMethodValidator,
  listPaymentMethodValidator,
  paymentMethodIdParamValidator
} = require('../validators/paymentMethodValidators');

const router = express.Router();

router.use(auth);

// Metodos de pago son datos personales del usuario.
const blockAdmin = denyRole('admin');

router.post('/', blockAdmin, createPaymentMethodValidator, validateRequest, controller.create);
router.get('/listadoTotal', blockAdmin, controller.listadoTotal);
router.get('/', blockAdmin, listPaymentMethodValidator, validateRequest, controller.list);
router.get('/:id/usage', blockAdmin, paymentMethodIdParamValidator, validateRequest, controller.usage);
router.put('/:id', blockAdmin, updatePaymentMethodValidator, validateRequest, controller.update);
router.delete('/:id', blockAdmin, removePaymentMethodValidator, validateRequest, controller.remove);

module.exports = router;
