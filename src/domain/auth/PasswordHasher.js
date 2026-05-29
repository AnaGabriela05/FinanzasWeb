const bcrypt = require('bcryptjs');

class PasswordHasher {
  constructor({ rounds = 10 } = {}) {
    this.rounds = rounds;
  }

  hash(plain) {
    return bcrypt.hash(plain, this.rounds);
  }

  compare(plain, hash) {
    return bcrypt.compare(plain, hash);
  }
}

module.exports = PasswordHasher;
