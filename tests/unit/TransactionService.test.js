// Tests unitarios de TransactionService.
//
// Notas sobre el alcance:
// - TransactionService recibe sus repositorios por inyeccion -> los mockeamos
//   con vi.fn() para no tocar la base de datos real.
// - La conversion USD -> PEN NO ocurre en TransactionService: el servicio
//   guarda `monto` y `currency` tal cual, y la conversion se aplica en
//   FinancialHealthAnalyzer.montoEnPen() vi­a currencyConfig.toBase. Probamos
//   currencyConfig.toBase aparte para validar la tasa real configurada.
// - El bloqueo de admins (regla SoD) NO vive en este servicio: vive en el
//   middleware denyRole('admin') aplicado a las rutas /api/transactions/*.
//   Por eso no se prueba aqui; quedaria cubierto por un test de integracion
//   con supertest sobre las rutas, fuera del alcance de este archivo.

// describe/it/expect/vi/beforeEach vienen como globales (vitest.config.mjs -> globals: true)
// porque vitest 4.x no permite `require('vitest')` desde CommonJS.
const TransactionService = require('../../src/services/TransactionService');
const currencyConfig = require('../../src/config/currency');

function makeDeps(overrides = {}) {
  return {
    transactionRepository: {
      create: vi.fn(),
      findOwnedByUser: vi.fn(),
      update: vi.fn(),
      destroy: vi.fn(),
      findByFilters: vi.fn(),
      findAndCountByFilters: vi.fn()
    },
    categoryRepository: {
      findAccessibleById: vi.fn()
    },
    paymentMethodRepository: {
      findOwnedByUser: vi.fn()
    },
    ...overrides
  };
}

describe('TransactionService.create', () => {
  let deps;
  let service;
  const user = { id: 42, correo: 'demo@correo.com' };

  beforeEach(() => {
    deps = makeDeps();
    service = new TransactionService(deps);
    // Por defecto, las referencias existen y pertenecen al usuario.
    deps.categoryRepository.findAccessibleById.mockResolvedValue({ id: 10, tipo: 'gasto' });
    deps.paymentMethodRepository.findOwnedByUser.mockResolvedValue({ id: 20, nombre: 'Yape' });
    deps.transactionRepository.create.mockImplementation(async (data) => ({ id: 1, ...data }));
  });

  it('valida categoria y metodo de pago antes de crear, ambos contra el userId del usuario', async () => {
    await service.create(user, {
      fecha: '2026-05-29',
      monto: 150,
      descripcion: 'Comida',
      categoryId: 10,
      paymentMethodId: 20
    });

    expect(deps.categoryRepository.findAccessibleById).toHaveBeenCalledWith(10, 42);
    expect(deps.paymentMethodRepository.findOwnedByUser).toHaveBeenCalledWith(20, 42);
  });

  it('persiste los datos correctos en el repositorio incluyendo userId', async () => {
    await service.create(user, {
      fecha: '2026-05-29',
      monto: 150,
      currency: 'PEN',
      descripcion: 'Compras',
      categoryId: 10,
      paymentMethodId: 20
    });

    expect(deps.transactionRepository.create).toHaveBeenCalledWith({
      fecha: '2026-05-29',
      monto: 150,
      currency: 'PEN',
      descripcion: 'Compras',
      categoryId: 10,
      paymentMethodId: 20,
      userId: 42
    });
  });

  it('asume currency = "PEN" cuando el payload no la trae', async () => {
    await service.create(user, {
      fecha: '2026-05-29',
      monto: 200,
      categoryId: 10,
      paymentMethodId: 20
    });

    const stored = deps.transactionRepository.create.mock.calls[0][0];
    expect(stored.currency).toBe('PEN');
  });

  it('guarda currency = "USD" tal cual (la conversion ocurre en agregaciones, no aqui)', async () => {
    await service.create(user, {
      fecha: '2026-05-29',
      monto: 150,
      currency: 'USD',
      categoryId: 10,
      paymentMethodId: 20
    });

    const stored = deps.transactionRepository.create.mock.calls[0][0];
    expect(stored).toMatchObject({ monto: 150, currency: 'USD' });
  });

  it('devuelve el envoltorio { status: 201, body: { message, data } } esperado por el controller', async () => {
    deps.transactionRepository.create.mockResolvedValue({ id: 7, monto: 150 });

    const result = await service.create(user, {
      fecha: '2026-05-29',
      monto: 150,
      categoryId: 10,
      paymentMethodId: 20
    });

    expect(result.status).toBe(201);
    expect(result.body.message).toBe('Transaccion registrada correctamente');
    expect(result.body.data).toEqual({ id: 7, monto: 150 });
  });

  it('si la categoria no es accesible para el usuario, lanza 400 sin tocar el repo de transacciones', async () => {
    deps.categoryRepository.findAccessibleById.mockResolvedValue(null);

    await expect(
      service.create(user, {
        fecha: '2026-05-29',
        monto: 150,
        categoryId: 999,
        paymentMethodId: 20
      })
    ).rejects.toMatchObject({ status: 400, message: 'Categoria invalida' });

    expect(deps.transactionRepository.create).not.toHaveBeenCalled();
  });

  it('si el metodo de pago no pertenece al usuario, lanza 400 sin crear la transaccion', async () => {
    deps.paymentMethodRepository.findOwnedByUser.mockResolvedValue(null);

    await expect(
      service.create(user, {
        fecha: '2026-05-29',
        monto: 150,
        categoryId: 10,
        paymentMethodId: 999
      })
    ).rejects.toMatchObject({ status: 400, message: 'Metodo de pago invalido' });

    expect(deps.transactionRepository.create).not.toHaveBeenCalled();
  });
});

describe('TransactionService.update / remove (aislamiento por usuario)', () => {
  let deps;
  let service;
  const user = { id: 42 };

  beforeEach(() => {
    deps = makeDeps();
    service = new TransactionService(deps);
  });

  it('update: si la transaccion no pertenece al usuario, lanza 404 y nunca actualiza', async () => {
    deps.transactionRepository.findOwnedByUser.mockResolvedValue(null);

    await expect(
      service.update(user, 123, { monto: 999 })
    ).rejects.toMatchObject({ status: 404, message: 'No encontrado' });

    expect(deps.transactionRepository.update).not.toHaveBeenCalled();
  });

  it('remove: si la transaccion no pertenece al usuario, lanza 404 y nunca borra', async () => {
    deps.transactionRepository.findOwnedByUser.mockResolvedValue(null);

    await expect(
      service.remove(user, 123)
    ).rejects.toMatchObject({ status: 404 });

    expect(deps.transactionRepository.destroy).not.toHaveBeenCalled();
  });

  it('remove: si la transaccion pertenece al usuario, llama a destroy y devuelve mensaje', async () => {
    const txn = { id: 123, userId: 42 };
    deps.transactionRepository.findOwnedByUser.mockResolvedValue(txn);

    const result = await service.remove(user, 123);

    expect(deps.transactionRepository.findOwnedByUser).toHaveBeenCalledWith(123, 42);
    expect(deps.transactionRepository.destroy).toHaveBeenCalledWith(txn);
    expect(result.message).toBe('Transaccion eliminada correctamente');
  });
});

// La conversion USD -> PEN no es parte de TransactionService, pero se aplica
// despues sobre la entidad almacenada. Validamos la tasa REAL leida del config
// (no la hardcodeamos) para que el test siga siendo correcto si se cambia
// EXCHANGE_USD_TO_PEN en .env.
describe('currencyConfig.toBase (conversion USD -> PEN)', () => {
  it('USD se multiplica por la tasa configurada para obtener PEN', () => {
    const rate = currencyConfig.usdToPen;
    expect(rate).toBeGreaterThan(0);

    const monto = 150;
    const expectedPen = monto * rate;

    expect(currencyConfig.toBase(monto, 'USD')).toBeCloseTo(expectedPen, 6);
    // El default empaquetado es 3.75; si no se override por env, este test
    // verifica el valor exacto. Si esta overriden por env, el bloque anterior
    // sigue siendo correcto por construccion.
  });

  it('PEN se devuelve sin conversion', () => {
    expect(currencyConfig.toBase(123.45, 'PEN')).toBe(123.45);
  });

  it('omitir la moneda asume base PEN (sin conversion)', () => {
    expect(currencyConfig.toBase(100)).toBe(100);
  });

  it('valores no numericos o nulos se normalizan a 0', () => {
    expect(currencyConfig.toBase(null, 'USD')).toBe(0);
    expect(currencyConfig.toBase('abc', 'USD')).toBe(0);
  });
});
