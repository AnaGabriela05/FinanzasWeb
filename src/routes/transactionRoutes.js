const express = require('express');
const auth = require('../middlewares/auth');
const { denyRole } = require('../middlewares/requireRole');
const validateRequest = require('../middlewares/validateRequest');
const controller = require('../controllers/transactionController');
const {
  createTransactionValidator,
  updateTransactionValidator,
  listTransactionValidator,
  transactionIdParamValidator
} = require('../validators/transactionValidators');

const router = express.Router();

router.use(auth);

// Transacciones son datos personales del usuario final. El admin no puede tenerlos.
const blockAdmin = denyRole('admin');

router.post('/', blockAdmin, createTransactionValidator, validateRequest, controller.create);
router.get('/', blockAdmin, listTransactionValidator, validateRequest, controller.list);
router.put('/:id', blockAdmin, updateTransactionValidator, validateRequest, controller.update);
router.delete('/:id', blockAdmin, transactionIdParamValidator, validateRequest, controller.remove);

module.exports = router;
