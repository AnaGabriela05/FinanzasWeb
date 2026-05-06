class PaymentMethodDependencyResolver {
  constructor({ transactionRepository }) {
    this.transactionRepository = transactionRepository;
  }

  async resolveUsage(paymentMethodId, userId) {
    const where = { userId, paymentMethodId };
    const txCount = await this.transactionRepository.count(where);

    return { where, txCount };
  }

  async removeWithDependencies(where, cascade) {
    if (cascade) {
      await this.transactionRepository.destroyWhere(where);
    }
  }
}

module.exports = PaymentMethodDependencyResolver;
