const { body, param, query } = require('express-validator');

const idParamValidator = [param('id').isInt({ min: 1 }).withMessage('ID invalido').toInt()];

exports.upsertBudgetValidator = [
  body('categoryId').isInt({ min: 1 }).withMessage('categoryId invalido').toInt(),
  body('montoMensual').isFloat({ gt: 0 }).withMessage('montoMensual debe ser mayor a 0').toFloat(),
  body('mes').isInt({ min: 1, max: 12 }).withMessage('mes debe estar entre 1 y 12').toInt(),
  body('anio').isInt({ min: 2000, max: 2100 }).withMessage('anio invalido').toInt()
];

exports.updateBudgetValidator = [
  ...idParamValidator,
  body('categoryId').optional().isInt({ min: 1 }).toInt(),
  body('montoMensual').optional().isFloat({ gt: 0 }).toFloat(),
  body('mes').optional().isInt({ min: 1, max: 12 }).toInt(),
  body('anio').optional().isInt({ min: 2000, max: 2100 }).toInt()
];

exports.budgetIdParamValidator = idParamValidator;

exports.listBudgetValidator = [
  query('mes').optional().isInt({ min: 1, max: 12 }).toInt(),
  query('anio').optional().isInt({ min: 2000, max: 2100 }).toInt()
];
