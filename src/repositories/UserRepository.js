const { User, Role } = require('../models');

class UserRepository {
  findByEmail(correo) {
    return User.findOne({ where: { correo } });
  }

  findByEmailWithRole(correo) {
    return User.findOne({
      where: { correo },
      include: [{ model: Role, as: 'role' }]
    });
  }

  findRoleByName(nombre) {
    return Role.findOne({ where: { nombre } });
  }

  create(data) {
    return User.create(data);
  }

  save(user) {
    return user.save();
  }

  async incrementFailedAttempts(user) {
    await user.increment('failedLoginAttempts');
    await user.reload();
    return user;
  }
}

module.exports = UserRepository;
