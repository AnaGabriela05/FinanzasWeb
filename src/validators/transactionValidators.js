const { body, param, query } = require('express-validator');

const idParamValidator = [param('id').isInt({ min: 1 }).withMessage('ID invalido').toInt()];

exports.createTransactionValidator = [
  body('fecha').isISO8601().withMessage('Fecha invalida (formato YYYY-MM-DD)'),
  body('monto').isFloat({ gt: 0 }).withMessage('El monto debe ser mayor a 0').toFloat(),
  body('currency').optional().isIn(['PEN', 'USD']).withMessage('Moneda invalida'),
  body('descripcion').optional({ nullable: true }).isString().isLength({ max: 200 }),
  body('categoryId').isInt({ min: 1 }).withMessage('categoryId invalido').toInt(),
  body('paymentMethodId').isInt({ min: 1 }).withMessage('paymentMethodId invalido').toInt()
];

exports.updateTransactionValidator = [
  ...idParamValidator,
  body('fecha').optional().isISO8601().withMessage('Fecha invalida'),
  body('monto').optional().isFloat({ gt: 0 }).withMessage('El monto debe ser mayor a 0').toFloat(),
  body('currency').optional().isIn(['PEN', 'USD']).withMessage('Moneda invalida'),
  body('descripcion').optional({ nullable: true }).isString().isLength({ max: 200 }),
  body('categoryId').optional().isInt({ min: 1 }).toInt(),
  body('paymentMethodId').optional().isInt({ min: 1 }).toInt()
];

exports.transactionIdParamValidator = idParamValidator;

exports.listTransactionValidator = [
  query('from').optional().isISO8601().withMessage('from invalido'),
  query('to').optional().isISO8601().withMessage('to invalido'),
  query('categoryId').optional().isInt({ min: 1 }).toInt(),
  query('paymentMethodId').optional().isInt({ min: 1 }).toInt(),
  query('transactionType').optional().isIn(['ingreso', 'gasto']),
  query('page').optional().isInt({ min: 1 }).withMessage('page debe ser entero positivo').toInt(),
  query('limit').optional().isInt({ min: 1, max: 200 }).withMessage('limit debe estar entre 1 y 200').toInt()
];
