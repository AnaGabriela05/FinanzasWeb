const express = require('express');
const auth = require('../middlewares/auth');
const controller = require('../controllers/paymentMethodController');

const router = express.Router();

router.use(auth);
router.post('/', controller.create);
router.get('/listadoTotal', controller.listadoTotal);
router.get('/', controller.list);
router.get('/:id/usage', controller.usage);  //NUEVO
router.put('/:id', controller.update);
router.delete('/:id', controller.remove);

module.exports = router;
