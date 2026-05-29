const { QuizAnswer, QuizQuestion } = require('../models');

class QuizAnswerRepository {
  /**
   * Inserta multiples respuestas en una sola operacion.
   */
  bulkCreate(answers, options = {}) {
    if (!Array.isArray(answers) || answers.length === 0) return Promise.resolve([]);
    return QuizAnswer.bulkCreate(answers, options);
  }

  /**
   * Retorna las respuestas de un intento con la pregunta asociada.
   */
  findByAttemptId(attemptId) {
    return QuizAnswer.findAll({
      where: { attemptId },
      include: [{ model: QuizQuestion, as: 'question' }],
      order: [['id', 'ASC']]
    });
  }
}

module.exports = QuizAnswerRepository;
