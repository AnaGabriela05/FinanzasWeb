const isProduction = process.env.NODE_ENV === 'production';

if (isProduction && !process.env.JWT_SECRET) {
  throw new Error(
    'JWT_SECRET es obligatorio en produccion. Define la variable de entorno antes de arrancar el servidor.'
  );
}

const jwtSecret = process.env.JWT_SECRET || 'dev_secret';

if (!isProduction && jwtSecret === 'dev_secret') {
  // eslint-disable-next-line no-console
  console.warn('[auth] Usando JWT_SECRET por defecto "dev_secret" (solo desarrollo).');
}

module.exports = {
  jwt: {
    secret: jwtSecret,
    expiresIn: process.env.JWT_EXPIRES_IN || '8h'
  },
  loginAttempts: {
    maxAttempts: Number(process.env.LOGIN_MAX_ATTEMPTS) || 3,
    lockMinutes: Number(process.env.LOGIN_LOCK_MINUTES) || 10
  },
  passwordHashRounds: Number(process.env.PASSWORD_HASH_ROUNDS) || 10
};
