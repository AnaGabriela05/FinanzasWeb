const { body, param, query } = require('express-validator');

const idParamValidator = [param('id').isInt({ min: 1 }).withMessage('ID invalido').toInt()];

exports.createCategoryValidator = [
  body('nombre').trim().notEmpty().withMessage('El nombre es obligatorio'),
  body('tipo').isIn(['ingreso', 'gasto']).withMessage('Tipo debe ser ingreso o gasto'),
  body('global').optional().isBoolean().withMessage('global debe ser booleano').toBoolean()
];

exports.updateCategoryValidator = [
  ...idParamValidator,
  body('nombre').optional().trim().notEmpty().withMessage('El nombre no puede estar vacio'),
  body('tipo').optional().isIn(['ingreso', 'gasto']).withMessage('Tipo debe ser ingreso o gasto'),
  body('global').optional().isBoolean().toBoolean(),
  body('activo').optional().isBoolean().toBoolean()
];

exports.categoryIdParamValidator = idParamValidator;

exports.removeCategoryValidator = [
  ...idParamValidator,
  query('cascade').optional().isIn(['1', 'true', 'yes', '0', 'false', 'no']),
  query('archive').optional().isIn(['1', 'true', 'yes', '0', 'false', 'no'])
];

exports.usageCategoryValidator = [
  ...idParamValidator,
  query('scope').optional().isIn(['mine', 'all'])
];

exports.listCategoryValidator = [
  query('includeArchived').optional().isIn(['1', 'true', 'yes', '0', 'false', 'no'])
];
