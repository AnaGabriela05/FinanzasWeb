const HttpError = require('../../errors/HttpError');

class LoginAttemptPolicy {
  constructor({ userRepository, maxAttempts, lockMinutes }) {
    this.userRepository = userRepository;
    this.maxAttempts = maxAttempts;
    this.lockMinutes = lockMinutes;
  }

  assertNotLocked(user) {
    if (!user.lockUntil) return;

    const now = new Date();
    const lockUntil = new Date(user.lockUntil);
    if (lockUntil <= now) return;

    const minutes = Math.ceil((lockUntil - now) / 60000);
    throw new HttpError(
      423,
      `Cuenta bloqueada por multiples intentos. Intenta de nuevo en ~${minutes} min.`
    );
  }

  async registerFailure(user) {
    await this.userRepository.incrementFailedAttempts(user);

    if (user.failedLoginAttempts >= this.maxAttempts) {
      user.lockUntil = new Date(Date.now() + this.lockMinutes * 60 * 1000);
      user.failedLoginAttempts = 0;
      await this.userRepository.save(user);
      throw new HttpError(
        423,
        `Cuenta bloqueada por ${this.lockMinutes} minutos por multiples intentos.`
      );
    }
  }

  async registerSuccess(user) {
    if (!user.failedLoginAttempts && !user.lockUntil) return;

    user.failedLoginAttempts = 0;
    user.lockUntil = null;
    await this.userRepository.save(user);
  }
}

module.exports = LoginAttemptPolicy;
