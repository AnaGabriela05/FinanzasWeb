// Tests unitarios de AuthService + LoginAttemptPolicy.
// AuthService recibe sus dependencias por inyeccion (DI), por eso podemos pasar
// dobles de prueba (vi.fn) y verificar que delega correctamente. La logica de
// "3 fallidos -> bloqueo" vive en LoginAttemptPolicy: la probamos directamente
// porque tambien es un objeto de dominio puro con userRepository inyectado.

// describe/it/expect/vi/beforeEach vienen como globales (vitest.config.mjs -> globals: true)
// porque vitest 4.x no permite `require('vitest')` desde CommonJS.
const AuthService = require('../../src/services/AuthService');
const LoginAttemptPolicy = require('../../src/domain/auth/LoginAttemptPolicy');
const HttpError = require('../../src/errors/HttpError');

// Construye dobles de prueba para las cuatro dependencias de AuthService.
function makeDeps(overrides = {}) {
  return {
    userRepository: {
      findByEmail: vi.fn(),
      findByEmailWithRole: vi.fn(),
      findRoleByName: vi.fn().mockResolvedValue({ id: 2, nombre: 'usuario' }),
      create: vi.fn(),
      incrementFailedAttempts: vi.fn(),
      save: vi.fn()
    },
    passwordHasher: {
      hash: vi.fn().mockResolvedValue('hash:fake'),
      compare: vi.fn()
    },
    tokenIssuer: {
      sign: vi.fn().mockReturnValue('token.jwt.fake')
    },
    loginAttemptPolicy: {
      assertNotLocked: vi.fn(),
      registerFailure: vi.fn(),
      registerSuccess: vi.fn()
    },
    ...overrides
  };
}

describe('AuthService.login', () => {
  let deps;
  let service;

  beforeEach(() => {
    deps = makeDeps();
    service = new AuthService(deps);
  });

  it('credenciales correctas: devuelve token (tokenIssuer fue llamado) y limpia intentos', async () => {
    const userDb = {
      id: 1,
      nombre: 'Ana',
      correo: 'ana@correo.com',
      passwordHash: 'hash:fake',
      role: { nombre: 'usuario' }
    };
    deps.userRepository.findByEmailWithRole.mockResolvedValue(userDb);
    deps.passwordHasher.compare.mockResolvedValue(true);

    const result = await service.login({ correo: 'ana@correo.com', password: 'secreta' });

    expect(result.token).toBe('token.jwt.fake');
    expect(result.user).toEqual({
      id: 1,
      nombre: 'Ana',
      correo: 'ana@correo.com',
      role: 'usuario'
    });
    expect(deps.tokenIssuer.sign).toHaveBeenCalledTimes(1);
    expect(deps.tokenIssuer.sign).toHaveBeenCalledWith(userDb);
    expect(deps.loginAttemptPolicy.registerSuccess).toHaveBeenCalledWith(userDb);
    expect(deps.loginAttemptPolicy.registerFailure).not.toHaveBeenCalled();
  });

  it('password incorrecta: lanza HttpError 401 y delega el incremento de intentos fallidos', async () => {
    const userDb = {
      id: 1,
      nombre: 'Ana',
      correo: 'ana@correo.com',
      passwordHash: 'hash:fake',
      role: { nombre: 'usuario' }
    };
    deps.userRepository.findByEmailWithRole.mockResolvedValue(userDb);
    deps.passwordHasher.compare.mockResolvedValue(false);

    await expect(
      service.login({ correo: 'ana@correo.com', password: 'mala' })
    ).rejects.toMatchObject({ status: 401, message: 'Credenciales invalidas' });

    expect(deps.loginAttemptPolicy.registerFailure).toHaveBeenCalledWith(userDb);
    expect(deps.tokenIssuer.sign).not.toHaveBeenCalled();
  });

  it('correo inexistente: lanza 401 sin tocar password ni politica de intentos', async () => {
    deps.userRepository.findByEmailWithRole.mockResolvedValue(null);

    await expect(
      service.login({ correo: 'nadie@correo.com', password: 'x' })
    ).rejects.toMatchObject({ status: 401 });

    expect(deps.passwordHasher.compare).not.toHaveBeenCalled();
    expect(deps.loginAttemptPolicy.assertNotLocked).not.toHaveBeenCalled();
  });

  it('cuenta bloqueada: AuthService no llega a verificar la password', async () => {
    // Simulamos que la cuenta ya esta bloqueada: assertNotLocked tira 423.
    deps.userRepository.findByEmailWithRole.mockResolvedValue({
      id: 1,
      correo: 'ana@correo.com',
      passwordHash: 'hash:fake',
      role: { nombre: 'usuario' }
    });
    deps.loginAttemptPolicy.assertNotLocked.mockImplementation(() => {
      throw new HttpError(423, 'Cuenta bloqueada por multiples intentos. Intenta de nuevo en ~5 min.');
    });

    await expect(
      service.login({ correo: 'ana@correo.com', password: 'secreta' })
    ).rejects.toMatchObject({ status: 423 });

    // Lo critico: ni siquiera intentamos comparar la password ni emitir token.
    expect(deps.passwordHasher.compare).not.toHaveBeenCalled();
    expect(deps.tokenIssuer.sign).not.toHaveBeenCalled();
  });
});

describe('AuthService.register', () => {
  let deps;
  let service;

  beforeEach(() => {
    deps = makeDeps();
    service = new AuthService(deps);
  });

  it('delega el hasheo de la contrasena a passwordHasher y persiste el hash, no el texto plano', async () => {
    deps.userRepository.findByEmail.mockResolvedValue(null);
    deps.userRepository.create.mockImplementation(async (data) => ({
      id: 99,
      nombre: data.nombre,
      correo: data.correo,
      passwordHash: data.passwordHash
    }));

    const result = await service.register({
      nombre: 'Bruno',
      correo: 'bruno@correo.com',
      password: 'secreta123'
    });

    // Se hasheo la password recibida (no se persiste en texto plano).
    expect(deps.passwordHasher.hash).toHaveBeenCalledWith('secreta123');
    // Y se persistio el hash, NO el password literal.
    const persisted = deps.userRepository.create.mock.calls[0][0];
    expect(persisted.passwordHash).toBe('hash:fake');
    expect(persisted).not.toHaveProperty('password');

    expect(result.status).toBe(201);
    expect(result.body.user).toEqual({ id: 99, nombre: 'Bruno', correo: 'bruno@correo.com' });
  });

  it('correo ya registrado: lanza HttpError 409 y no llama a passwordHasher.hash', async () => {
    deps.userRepository.findByEmail.mockResolvedValue({ id: 1, correo: 'ana@correo.com' });

    await expect(
      service.register({ nombre: 'Ana', correo: 'ana@correo.com', password: 'secreta' })
    ).rejects.toMatchObject({ status: 409, message: 'El correo ya esta registrado' });

    expect(deps.passwordHasher.hash).not.toHaveBeenCalled();
    expect(deps.userRepository.create).not.toHaveBeenCalled();
  });
});

// LoginAttemptPolicy es la pieza que realmente implementa la regla de "3 fallidos
// -> bloqueo". La probamos directamente porque AuthService solo la delega.
describe('LoginAttemptPolicy', () => {
  function buildUser(overrides = {}) {
    return {
      id: 1,
      correo: 'ana@correo.com',
      failedLoginAttempts: 0,
      lockUntil: null,
      ...overrides
    };
  }

  function buildRepo() {
    return {
      // Incrementa el contador en el objeto user para simular la mutacion real.
      incrementFailedAttempts: vi.fn().mockImplementation(async (user) => {
        user.failedLoginAttempts = (user.failedLoginAttempts || 0) + 1;
      }),
      save: vi.fn().mockResolvedValue(undefined)
    };
  }

  it('assertNotLocked no hace nada si la cuenta no tiene lockUntil', () => {
    const policy = new LoginAttemptPolicy({
      userRepository: buildRepo(),
      maxAttempts: 3,
      lockMinutes: 10
    });
    expect(() => policy.assertNotLocked(buildUser())).not.toThrow();
  });

  it('assertNotLocked lanza 423 mientras lockUntil esta vigente', () => {
    const policy = new LoginAttemptPolicy({
      userRepository: buildRepo(),
      maxAttempts: 3,
      lockMinutes: 10
    });
    const futuro = new Date(Date.now() + 5 * 60 * 1000); // dentro de 5 min
    expect(() => policy.assertNotLocked(buildUser({ lockUntil: futuro }))).toThrow(
      expect.objectContaining({ status: 423 })
    );
  });

  it('assertNotLocked no lanza si lockUntil ya expiro', () => {
    const policy = new LoginAttemptPolicy({
      userRepository: buildRepo(),
      maxAttempts: 3,
      lockMinutes: 10
    });
    const pasado = new Date(Date.now() - 1000);
    expect(() => policy.assertNotLocked(buildUser({ lockUntil: pasado }))).not.toThrow();
  });

  it('tras 3 intentos fallidos dentro de la ventana, marca la cuenta como bloqueada', async () => {
    const repo = buildRepo();
    const policy = new LoginAttemptPolicy({
      userRepository: repo,
      maxAttempts: 3,
      lockMinutes: 10
    });
    const user = buildUser();

    // Fallo 1 y 2: solo incrementa, no bloquea.
    await policy.registerFailure(user);
    await policy.registerFailure(user);
    expect(user.failedLoginAttempts).toBe(2);
    expect(user.lockUntil).toBeNull();
    expect(repo.save).not.toHaveBeenCalled();

    // Fallo 3: alcanza el umbral, persiste lockUntil y lanza 423.
    await expect(policy.registerFailure(user)).rejects.toMatchObject({ status: 423 });
    expect(user.lockUntil).toBeInstanceOf(Date);
    expect(user.lockUntil.getTime()).toBeGreaterThan(Date.now());
    expect(user.failedLoginAttempts).toBe(0); // se resetea al bloquear
    expect(repo.save).toHaveBeenCalledWith(user);
  });

  it('registerSuccess limpia contador y lockUntil cuando habia intentos previos', async () => {
    const repo = buildRepo();
    const policy = new LoginAttemptPolicy({
      userRepository: repo,
      maxAttempts: 3,
      lockMinutes: 10
    });
    const user = buildUser({ failedLoginAttempts: 2, lockUntil: new Date() });

    await policy.registerSuccess(user);

    expect(user.failedLoginAttempts).toBe(0);
    expect(user.lockUntil).toBeNull();
    expect(repo.save).toHaveBeenCalledWith(user);
  });

  it('registerSuccess no toca el repositorio si la cuenta no tenia intentos ni lock', async () => {
    const repo = buildRepo();
    const policy = new LoginAttemptPolicy({
      userRepository: repo,
      maxAttempts: 3,
      lockMinutes: 10
    });

    await policy.registerSuccess(buildUser()); // intentos=0, lockUntil=null
    expect(repo.save).not.toHaveBeenCalled();
  });
});
