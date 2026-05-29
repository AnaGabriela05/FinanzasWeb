const jwt = require('jsonwebtoken');

class TokenIssuer {
  constructor({ secret, expiresIn }) {
    this.secret = secret;
    this.expiresIn = expiresIn;
  }

  sign(user) {
    return jwt.sign(
      {
        id: user.id,
        correo: user.correo,
        role: user.role?.nombre || 'usuario'
      },
      this.secret,
      { expiresIn: this.expiresIn }
    );
  }

  verify(token) {
    return jwt.verify(token, this.secret);
  }
}

module.exports = TokenIssuer;
