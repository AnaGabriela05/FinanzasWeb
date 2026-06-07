// Logger de aplicacion (equivalente Node de Logback).
//
// - Formato JSON con timestamp -> facil de parsear/ingestar por herramientas.
// - Transports: consola siempre; archivo logs/app.log solo fuera de test
//   (en test no queremos crear archivos ni ensuciar la salida de pruebas).
// - Nivel segun NODE_ENV: en test el logger queda en `silent` para no
//   contaminar el output de vitest; en el resto, 'info' (configurable via
//   LOG_LEVEL).
//
// Seguridad: NUNCA pasar a este logger contraseñas, hashes ni tokens JWT.
// Para correos usar maskEmail() de utils/sanitize antes de loguear.

const fs = require('fs');
const path = require('path');
const winston = require('winston');

const env = process.env.NODE_ENV || 'development';
const isTest = env === 'test';

// Nivel: silencioso en test; configurable por LOG_LEVEL; 'info' por defecto.
const level = process.env.LOG_LEVEL || (isTest ? 'error' : 'info');

const transports = [
  new winston.transports.Console()
];

// Solo persistimos a archivo fuera de test (evita crear logs/app.log en CI).
if (!isTest) {
  const logsDir = path.join(__dirname, '..', '..', 'logs');
  fs.mkdirSync(logsDir, { recursive: true });
  transports.push(
    new winston.transports.File({ filename: path.join(logsDir, 'app.log') })
  );
}

const logger = winston.createLogger({
  level,
  silent: isTest, // en test no emite nada
  defaultMeta: { service: 'ahorrogo' },
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }), // captura err.stack si se pasa un Error
    winston.format.json()
  ),
  transports
});

module.exports = logger;
