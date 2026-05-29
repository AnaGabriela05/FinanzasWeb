const { body } = require('express-validator');

exports.registerValidator = [
  body('nombre').trim().notEmpty().withMessage('El nombre es obligatorio'),
  body('correo').isEmail().withMessage('Correo invalido'),
  body('password').isLength({ min: 6 }).withMessage('La contrasena debe tener al menos 6 caracteres')
];

exports.loginValidator = [
  body('correo').isEmail().withMessage('Correo invalido'),
  body('password').notEmpty().withMessage('La contrasena es obligatoria')
];
