const { QuizAttempt, QuizAnswer, QuizQuestion } = require('../models');

class QuizAttemptRepository {
  /**
   * Crea un nuevo intento.
   */
  create(data, options = {}) {
    return QuizAttempt.create(data, options);
  }

  /**
   * Todos los intentos del usuario para un video, ordenados por fecha ascendente.
   */
  findByUserAndVideo(userId, videoId) {
    return QuizAttempt.findAll({
      where: { userId, videoId },
      order: [['createdAt', 'ASC'], ['id', 'ASC']]
    });
  }

  /**
   * Retorna el primer intento del usuario para un video (el que cuenta para score).
   */
  findFirstAttempt(userId, videoId) {
    return QuizAttempt.findOne({
      where: { userId, videoId },
      order: [['createdAt', 'ASC'], ['id', 'ASC']]
    });
  }

  /**
   * Historial paginado del usuario incluyendo las respuestas y preguntas.
   */
  async findHistoryByUser(userId, options = {}) {
    const limit = Math.min(Number(options.limit) || 30, 100);
    const offset = Math.max(Number(options.offset) || 0, 0);

    const { count, rows } = await QuizAttempt.findAndCountAll({
      where: { userId },
      order: [['createdAt', 'DESC'], ['id', 'DESC']],
      limit,
      offset
    });

    return { items: rows, total: count, limit, offset };
  }

  /**
   * Suma de scores de PRIMEROS intentos del usuario.
   */
  async sumScoreByUser(userId) {
    const result = await QuizAttempt.findOne({
      where: { userId, cuentaParaScore: true },
      attributes: [[QuizAttempt.sequelize.fn('SUM', QuizAttempt.sequelize.col('score')), 'total']],
      raw: true
    });
    return Number(result?.total || 0);
  }

  /**
   * Conteo de quizzes unicos completados (primer intento por video).
   */
  countFirstAttemptsByUser(userId) {
    return QuizAttempt.count({ where: { userId, cuentaParaScore: true } });
  }

  /**
   * Mejor score logrado por el usuario (sobre todos los intentos).
   */
  async maxScoreByUser(userId) {
    const result = await QuizAttempt.findOne({
      where: { userId },
      attributes: [[QuizAttempt.sequelize.fn('MAX', QuizAttempt.sequelize.col('score')), 'max']],
      raw: true
    });
    return Number(result?.max || 0);
  }

  /**
   * Estadisticas agregadas para la seccion "Mi progreso".
   * - totalQuizzes: cantidad de quizzes unicos completados (primer intento)
   * - totalPoints: suma de scores de primeros intentos
   * - promedio: promedio de scores de TODOS los intentos
   * - mejorScore: mejor puntaje individual del usuario
   * - quizzesPerfectos: cantidad de intentos con score = 100
   */
  async getStatsByUser(userId) {
    const [totalQuizzes, totalPoints, promedioRow, mejorScore, perfectos] = await Promise.all([
      this.countFirstAttemptsByUser(userId),
      this.sumScoreByUser(userId),
      QuizAttempt.findOne({
        where: { userId },
        attributes: [[QuizAttempt.sequelize.fn('AVG', QuizAttempt.sequelize.col('score')), 'avg']],
        raw: true
      }),
      this.maxScoreByUser(userId),
      QuizAttempt.count({ where: { userId, score: 100 } })
    ]);

    return {
      totalQuizzes,
      totalPoints,
      promedio: promedioRow?.avg !== null && promedioRow?.avg !== undefined
        ? Math.round(Number(promedioRow.avg) * 10) / 10
        : 0,
      mejorScore,
      quizzesPerfectos: perfectos
    };
  }

  /**
   * Conjunto de videoIds en los que el usuario ya tiene primer intento.
   */
  async findCompletedVideoIds(userId) {
    const rows = await QuizAttempt.findAll({
      where: { userId, cuentaParaScore: true },
      attributes: ['videoId'],
      raw: true
    });
    return rows.map((r) => r.videoId);
  }

  /**
   * Resumen por video: mejor score, score del primer intento y cantidad de intentos.
   */
  async summarizeByUserGroupedByVideo(userId) {
    const all = await QuizAttempt.findAll({
      where: { userId },
      order: [['createdAt', 'ASC'], ['id', 'ASC']],
      raw: true
    });

    const map = new Map();
    for (const row of all) {
      const acc = map.get(row.videoId) || {
        videoId: row.videoId,
        intentosRealizados: 0,
        mejorScore: 0,
        primerIntentoScore: null,
        ultimoIntentoFecha: null
      };
      acc.intentosRealizados += 1;
      if (row.score > acc.mejorScore) acc.mejorScore = row.score;
      if (acc.primerIntentoScore === null && row.cuentaParaScore) {
        acc.primerIntentoScore = row.score;
      }
      acc.ultimoIntentoFecha = row.createdAt;
      map.set(row.videoId, acc);
    }
    return Array.from(map.values());
  }

  /**
   * Carga el attempt incluyendo las respuestas y preguntas (para historial detallado).
   */
  findByIdWithAnswers(attemptId) {
    return QuizAttempt.findByPk(attemptId, {
      include: [{
        model: QuizAnswer,
        as: 'answers',
        include: [{ model: QuizQuestion, as: 'question' }]
      }]
    });
  }
}

module.exports = QuizAttemptRepository;
