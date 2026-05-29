const { Op } = require('sequelize');
const { QuizQuestion } = require('../models');

class QuizQuestionRepository {
  /**
   * Retorna preguntas aleatorias para un video, limitadas a `limit`.
   * Usa sequelize.literal('RANDOM()') que en SQLite ordena de forma aleatoria.
   */
  findByVideoId(videoId, limit = 5) {
    return QuizQuestion.findAll({
      where: { videoId },
      order: QuizQuestion.sequelize.random(),
      limit
    });
  }

  /**
   * Retorna preguntas aleatorias excluyendo IDs ya vistos.
   */
  findRandomByVideoId(videoId, limit = 5, excludeIds = []) {
    const where = { videoId };
    if (Array.isArray(excludeIds) && excludeIds.length > 0) {
      where.id = { [Op.notIn]: excludeIds };
    }
    return QuizQuestion.findAll({
      where,
      order: QuizQuestion.sequelize.random(),
      limit
    });
  }

  /**
   * Carga preguntas por IDs (utilizado al calificar el quiz).
   */
  findByIds(ids) {
    if (!Array.isArray(ids) || ids.length === 0) return Promise.resolve([]);
    return QuizQuestion.findAll({ where: { id: { [Op.in]: ids } } });
  }

  /**
   * Inserta multiples preguntas en una sola operacion (seed).
   */
  bulkCreate(questions) {
    if (!Array.isArray(questions) || questions.length === 0) return Promise.resolve([]);
    return QuizQuestion.bulkCreate(questions);
  }

  /**
   * Conteo de preguntas disponibles por videoId.
   */
  countByVideo(videoId) {
    return QuizQuestion.count({ where: { videoId } });
  }

  /**
   * Conteo global agrupado por videoId.
   */
  async countAllGroupedByVideo() {
    const rows = await QuizQuestion.findAll({
      attributes: [
        'videoId',
        [QuizQuestion.sequelize.fn('COUNT', QuizQuestion.sequelize.col('id')), 'total']
      ],
      group: ['videoId'],
      raw: true
    });
    const out = {};
    rows.forEach((row) => { out[row.videoId] = Number(row.total) || 0; });
    return out;
  }

  /**
   * Borra todas las preguntas marcadas como seed (usado para re-correr el seed).
   */
  deleteAllSeed() {
    return QuizQuestion.destroy({ where: { origen: 'seed' } });
  }
}

module.exports = QuizQuestionRepository;
