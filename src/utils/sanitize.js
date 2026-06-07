// Saneo de entrada en la capa de servicio (equivalente Node de Apache Commons
// Lang/Text). Complementa a express-validator: aunque las rutas ya validan, el
// servicio normaliza/sanea antes de persistir como defensa en profundidad.
//
// Apoyado en `validator` (la libreria base sobre la que se construye
// express-validator).

const validator = require('validator');

// trim + escape de HTML para texto libre (nombre, descripcion).
// Reduce el riesgo de XSS almacenado neutralizando < > & " ' /.
// Devuelve el valor sin tocar si es null/undefined (para preservar "no enviado").
function sanitizeText(value) {
  if (value == null) return value;
  return validator.escape(validator.trim(String(value)));
}

// Valida y normaliza un correo. Devuelve el correo normalizado (minusculas,
// canonicalizacion de proveedor) o null si no es un email valido.
function sanitizeEmail(value) {
  const trimmed = validator.trim(String(value == null ? '' : value));
  if (!validator.isEmail(trimmed)) return null;
  // normalizeEmail puede devolver false ante casos raros: caemos a minusculas.
  return validator.normalizeEmail(trimmed) || trimmed.toLowerCase();
}

// Enmascara un correo para logs: deja visibles los 2 primeros caracteres del
// usuario y oculta el resto. "ana.perez@correo.com" -> "an*******@correo.com".
function maskEmail(value) {
  const email = String(value == null ? '' : value);
  const at = email.indexOf('@');
  if (at < 1) return '***';
  const user = email.slice(0, at);
  const domain = email.slice(at + 1);
  const head = user.slice(0, 2);
  return `${head}${'*'.repeat(Math.max(1, user.length - head.length))}@${domain}`;
}

module.exports = { sanitizeText, sanitizeEmail, maskEmail };
