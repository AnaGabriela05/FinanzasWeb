class CategoryDependencyResolver {
  constructor({ transactionRepository, budgetRepository, sequelize }) {
    this.transactionRepository = transactionRepository;
    this.budgetRepository = budgetRepository;
    this.sequelize = sequelize;
  }

  async resolveUsage(category, { userId, isAdmin, scopeAll = false }) {
    const scope = category.global && isAdmin && scopeAll ? 'all' : 'mine';
    const where = scope === 'all'
      ? { categoryId: category.id }
      : { userId, categoryId: category.id };

    const [txCount, budgetCount] = await Promise.all([
      this.transactionRepository.count(where),
      this.budgetRepository.count(where)
    ]);

    return { scope, where, txCount, budgetCount };
  }

  async removeWithDependencies(categoryId, where, cascade) {
    await this.sequelize.transaction(async (transaction) => {
      if (cascade) {
        await this.transactionRepository.destroyWhere(where, transaction);
        await this.budgetRepository.destroyWhere(where, transaction);
      }

      await this.sequelize.models.Category.destroy({
        where: { id: categoryId },
        transaction
      });
    });
  }
}

module.exports = CategoryDependencyResolver;
