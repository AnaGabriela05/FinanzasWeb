const HttpError = require('../errors/HttpError');

/**
 * Middleware que verifica que el usuario autenticado tenga un rol especifico.
 * Debe usarse DESPUES del middleware de autenticacion JWT.
 */
function requireRole(roleName) {
  return (req, res, next) => {
    if (!req.user || req.user.role !== roleName) {
      return next(new HttpError(403, 'No autorizado: rol insuficiente'));
    }
    next();
  };
}

/**
 * Middleware inverso: rechaza si el usuario TIENE un rol especifico.
 * Usado para impedir que admins llamen a endpoints de usuario final.
 */
function denyRole(roleName) {
  return (req, res, next) => {
    if (req.user && req.user.role === roleName) {
      return next(new HttpError(
        403,
        'Esta operacion no esta disponible para administradores. ' +
        'El administrador no puede operar como usuario final del sistema.'
      ));
    }
    next();
  };
}

module.exports = { requireRole, denyRole };
