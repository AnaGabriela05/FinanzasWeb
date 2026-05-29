// Tests de integracion: login + Segregacion de Funciones (SoD).
//
// El caso clave es el ultimo test: un admin autenticado NO puede crear
// transacciones. Esta regla vive en el middleware denyRole('admin') aplicado
// a las rutas de /api/transactions, y por eso NO se alcanza con tests
// unitarios sobre el servicio: hay que ejercitarlo via HTTP real.
//
// describe/it/expect/beforeAll/afterAll/beforeEach vienen como globales
// (vitest.config.mjs -> globals: true).

const request = require('supertest');
const { app, resetDatabase, closeDatabase } = require('../helpers/testApp');

describe('Integration: auth + SoD', () => {
  let seed;

  beforeAll(async () => {
    seed = await resetDatabase();
  });

  afterAll(async () => {
    await closeDatabase();
  });

  describe('POST /api/auth/login', () => {
    it('credenciales correctas del usuario normal devuelven 200 y un token JWT', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ correo: 'demo@correo.com', password: seed.demoPassword });

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('token');
      expect(typeof res.body.token).toBe('string');
      expect(res.body.token.length).toBeGreaterThan(20);
      expect(res.body.user).toMatchObject({
        correo: 'demo@correo.com',
        role: 'usuario'
      });
    });

    it('password incorrecta devuelve 401 y mensaje de credenciales invalidas', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ correo: 'demo@correo.com', password: 'password-mala' });

      expect(res.status).toBe(401);
      expect(res.body.error).toMatch(/credenciales invalidas/i);
    });

    it('correo inexistente devuelve 401 (mismo mensaje generico que password mala)', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ correo: 'nadie@correo.com', password: 'lo-que-sea' });

      expect(res.status).toBe(401);
    });
  });

  describe('POST /api/transactions (Segregacion de Funciones)', () => {
    async function loginAndGetToken(correo, password) {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ correo, password });
      expect(res.status).toBe(200);
      return res.body.token;
    }

    it('usuario normal autenticado crea una transaccion (201) con datos validos', async () => {
      const token = await loginAndGetToken('demo@correo.com', seed.demoPassword);

      const res = await request(app)
        .post('/api/transactions')
        .set('Authorization', `Bearer ${token}`)
        .send({
          fecha: '2026-05-29',
          monto: 150,
          currency: 'PEN',
          descripcion: 'Almuerzo',
          categoryId: seed.category.id,
          paymentMethodId: seed.paymentMethod.id
        });

      expect(res.status).toBe(201);
      expect(res.body.message).toMatch(/registrada/i);
      expect(res.body.data).toMatchObject({
        monto: 150,
        currency: 'PEN',
        categoryId: seed.category.id,
        paymentMethodId: seed.paymentMethod.id
      });
    });

    it('ADMIN autenticado NO puede crear transacciones: 403 por denyRole (SoD)', async () => {
      const token = await loginAndGetToken('admin@correo.com', seed.adminPassword);

      const res = await request(app)
        .post('/api/transactions')
        .set('Authorization', `Bearer ${token}`)
        .send({
          fecha: '2026-05-29',
          monto: 150,
          currency: 'PEN',
          descripcion: 'Intento ilegal',
          categoryId: seed.category.id,
          paymentMethodId: seed.paymentMethod.id
        });

      expect(res.status).toBe(403);
      // Mensaje exacto del middleware denyRole('admin') en src/middlewares/requireRole.js
      expect(res.body.error).toMatch(/no esta disponible para administradores/i);
      expect(res.body.error).toMatch(/no puede operar como usuario final/i);
    });

    it('sin token, /api/transactions responde 401 (token requerido)', async () => {
      const res = await request(app)
        .post('/api/transactions')
        .send({
          fecha: '2026-05-29',
          monto: 150,
          categoryId: seed.category.id,
          paymentMethodId: seed.paymentMethod.id
        });

      expect(res.status).toBe(401);
      expect(res.body.error).toMatch(/token/i);
    });
  });
});
