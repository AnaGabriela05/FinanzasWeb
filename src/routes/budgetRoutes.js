const express = require('express');
const auth = require('../middlewares/auth');
const { denyRole } = require('../middlewares/requireRole');
const validateRequest = require('../middlewares/validateRequest');
const controller = require('../controllers/budgetController');
const {
  upsertBudgetValidator,
  updateBudgetValidator,
  listBudgetValidator,
  budgetIdParamValidator
} = require('../validators/budgetValidators');

const router = express.Router();

router.use(auth);

const blockAdmin = denyRole('admin');

router.post('/', blockAdmin, upsertBudgetValidator, validateRequest, controller.upsert);
router.get('/', blockAdmin, listBudgetValidator, validateRequest, controller.list);
router.put('/:id', blockAdmin, updateBudgetValidator, validateRequest, controller.update);
router.delete('/:id', blockAdmin, budgetIdParamValidator, validateRequest, controller.remove);

module.exports = router;
