const { body, param, query } = require('express-validator');

const idParamValidator = [param('id').isInt({ min: 1 }).withMessage('ID invalido').toInt()];

exports.createPaymentMethodValidator = [
  body('nombre').trim().notEmpty().withMessage('El nombre es obligatorio')
];

exports.updatePaymentMethodValidator = [
  ...idParamValidator,
  body('nombre').optional().trim().notEmpty().withMessage('El nombre no puede estar vacio'),
  body('activo').optional().isBoolean().toBoolean()
];

exports.paymentMethodIdParamValidator = idParamValidator;

exports.removePaymentMethodValidator = [
  ...idParamValidator,
  query('cascade').optional().isIn(['1', 'true', 'yes', '0', 'false', 'no']),
  query('archive').optional().isIn(['1', 'true', 'yes', '0', 'false', 'no'])
];

exports.listPaymentMethodValidator = [
  query('includeArchived').optional().isIn(['1', 'true', 'yes', '0', 'false', 'no'])
];
