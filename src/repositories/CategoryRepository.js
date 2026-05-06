const { Op } = require('sequelize');
const { Category, UserCategoryHide } = require('../models');

class CategoryRepository {
  create(data) {
    return Category.create(data);
  }

  findById(id) {
    return Category.findByPk(id);
  }

  findAccessibleById(categoryId, userId) {
    return Category.findOne({
      where: {
        id: categoryId,
        [Op.or]: [{ global: true }, { userId }]
      }
    });
  }

  findVisibleForUser(userId, includeArchived = false) {
    return UserCategoryHide.findAll({
      where: { userId, hidden: true },
      attributes: ['categoryId']
    }).then((hiddenRows) => {
      const hiddenIds = hiddenRows.map((row) => row.categoryId);
      const whereAnd = [
        { [Op.or]: [{ global: true }, { userId }] }
      ];

      if (hiddenIds.length) {
        whereAnd.push({ id: { [Op.notIn]: hiddenIds } });
      }

      if (!includeArchived) {
        whereAnd.push({ activo: true });
      }

      return Category.findAll({
        where: { [Op.and]: whereAnd },
        order: [['global', 'DESC'], ['nombre', 'ASC']]
      });
    });
  }

  findOrCreatePersonalCopy({ userId, nombre, tipo }) {
    return Category.findOrCreate({
      where: { userId, nombre },
      defaults: { nombre, tipo, global: false, userId, activo: true }
    });
  }

  update(category, data) {
    return category.update(data);
  }

  destroyById(id, transaction) {
    return Category.destroy({ where: { id }, transaction });
  }

  findHiddenRow(userId, categoryId) {
    return UserCategoryHide.findOne({ where: { userId, categoryId } });
  }

  hideForUser(userId, categoryId) {
    return UserCategoryHide.findOrCreate({
      where: { userId, categoryId },
      defaults: { hidden: true }
    });
  }

  removeHiddenRow(row) {
    return row.destroy();
  }
}

module.exports = CategoryRepository;
