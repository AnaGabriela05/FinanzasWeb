const crypto = require('crypto');
const HttpError = require('../errors/HttpError');

const POINTS_PER_CORRECT = 20;
const DEFAULT_QUIZ_SIZE = 5;

class QuizService {
  constructor({
    quizQuestionRepository,
    quizAttemptRepository,
    quizAnswerRepository,
    levelCalculator,
    sequelize
  }) {
    this.quizQuestionRepository = quizQuestionRepository;
    this.quizAttemptRepository = quizAttemptRepository;
    this.quizAnswerRepository = quizAnswerRepository;
    this.levelCalculator = levelCalculator;
    this.sequelize = sequelize;
  }

  /**
   * Inicia un quiz para un video. Retorna las preguntas SIN respuestas correctas.
   */
  async startQuiz(userId, videoId) {
    if (!videoId) throw new HttpError(400, 'videoId es requerido');

    const questions = await this.quizQuestionRepository.findRandomByVideoId(videoId, DEFAULT_QUIZ_SIZE);
    if (questions.length === 0) {
      throw new HttpError(404, 'No hay preguntas disponibles para este video todavía.');
    }

    return {
      quizId: crypto.randomUUID(),
      videoId,
      total: questions.length,
      questions: questions.map((q) => ({
        id: q.id,
        pregunta: q.pregunta,
        opcionA: q.opcionA,
        opcionB: q.opcionB,
        opcionC: q.opcionC,
        opcionD: q.opcionD,
        dificultad: q.dificultad
      }))
    };
  }

  /**
   * Califica un intento, persiste attempt + answers y retorna resultado completo.
   *
   * payload = { videoId, answers: [{ questionId, respuesta, tiempoSegundos }], duracionSegundos }
   */
  async submitQuiz(userId, payload) {
    if (!payload || !payload.videoId) {
      throw new HttpError(400, 'videoId es requerido');
    }
    if (!Array.isArray(payload.answers) || payload.answers.length === 0) {
      throw new HttpError(400, 'Debes enviar al menos una respuesta');
    }

    const videoId = payload.videoId;
    const questionIds = payload.answers.map((a) => Number(a.questionId)).filter(Boolean);
    if (questionIds.length === 0) {
      throw new HttpError(400, 'Respuestas invalidas');
    }

    const questions = await this.quizQuestionRepository.findByIds(questionIds);
    if (questions.length !== questionIds.length) {
      throw new HttpError(400, 'Algunas preguntas no existen o no son validas');
    }

    const questionsByVideo = questions.every((q) => q.videoId === videoId);
    if (!questionsByVideo) {
      throw new HttpError(400, 'Las preguntas no corresponden al video indicado');
    }

    const byId = new Map(questions.map((q) => [q.id, q]));

    let correctas = 0;
    const answersDetalle = payload.answers.map((a) => {
      const question = byId.get(Number(a.questionId));
      const respuestaUsuario = String(a.respuesta || '').toUpperCase();
      const esCorrecta = respuestaUsuario === question.respuestaCorrecta;
      if (esCorrecta) correctas += 1;
      return {
        question,
        respuestaUsuario,
        esCorrecta,
        tiempoSegundos: a.tiempoSegundos != null ? Number(a.tiempoSegundos) : null
      };
    });

    const score = correctas * POINTS_PER_CORRECT;
    const totalPreguntas = answersDetalle.length;

    // Verifica si es el primer intento del usuario para ese video.
    const previousFirst = await this.quizAttemptRepository.findFirstAttempt(userId, videoId);
    const esPrimerIntento = !previousFirst;

    // Puntos totales ANTES de persistir este intento (para detectar subida de nivel).
    const puntosAntes = await this.quizAttemptRepository.sumScoreByUser(userId);
    const nivelAnterior = this.levelCalculator.getLevel(puntosAntes);

    const attempt = await this.sequelize.transaction(async (t) => {
      const created = await this.quizAttemptRepository.create({
        userId,
        videoId,
        score,
        totalPreguntas,
        correctas,
        duracionSegundos: payload.duracionSegundos != null ? Number(payload.duracionSegundos) : null,
        esPrimerIntento,
        cuentaParaScore: esPrimerIntento
      }, { transaction: t });

      const answersToInsert = answersDetalle.map((det) => ({
        attemptId: created.id,
        questionId: det.question.id,
        respuestaUsuario: det.respuestaUsuario,
        esCorrecta: det.esCorrecta,
        tiempoSegundos: det.tiempoSegundos
      }));

      await this.quizAnswerRepository.bulkCreate(answersToInsert, { transaction: t });
      return created;
    });

    // Puntos totales DESPUES (cambian solo si es primer intento).
    const puntosDespues = esPrimerIntento ? puntosAntes + score : puntosAntes;
    const nivelActual = this.levelCalculator.getLevel(puntosDespues);
    const subioDeNivel = nivelAnterior.nombre !== nivelActual.nombre;

    return {
      attemptId: attempt.id,
      score,
      correctas,
      total: totalPreguntas,
      esPrimerIntento,
      cuentaParaScore: esPrimerIntento,
      duracionSegundos: attempt.duracionSegundos,
      answers: answersDetalle.map((det) => ({
        questionId: det.question.id,
        pregunta: det.question.pregunta,
        tuRespuesta: det.respuestaUsuario,
        respuestaCorrecta: det.question.respuestaCorrecta,
        esCorrecta: det.esCorrecta,
        explicacion: det.question.explicacion,
        opciones: {
          A: det.question.opcionA,
          B: det.question.opcionB,
          C: det.question.opcionC,
          D: det.question.opcionD
        }
      })),
      puntosTotalesUsuario: puntosDespues,
      nivelAnterior: { nombre: nivelAnterior.nombre, color: nivelAnterior.color, icono: nivelAnterior.icono },
      nivelActual: { nombre: nivelActual.nombre, color: nivelActual.color, icono: nivelActual.icono },
      subioDeNivel
    };
  }

  /**
   * Progreso global del usuario para la seccion "Mi progreso".
   */
  async getUserProgress(userId) {
    const stats = await this.quizAttemptRepository.getStatsByUser(userId);
    const totalPoints = stats.totalPoints;
    const nivel = this.levelCalculator.getLevel(totalPoints);
    const siguienteRaw = this.levelCalculator.getNextLevel(totalPoints);

    return {
      totalPoints,
      nivel: {
        nombre: nivel.nombre,
        color: nivel.color,
        icono: nivel.icono,
        minPoints: nivel.minPoints,
        maxPoints: nivel.maxPoints,
        progresoAlSiguiente: nivel.progresoAlSiguiente
      },
      siguienteNivel: siguienteRaw
        ? {
            nombre: siguienteRaw.nombre,
            color: siguienteRaw.color,
            icono: siguienteRaw.icono,
            puntosFaltantes: siguienteRaw.puntosFaltantes,
            progreso: nivel.progresoAlSiguiente
          }
        : null,
      niveles: this.levelCalculator.getAllLevels(),
      stats: {
        quizzesCompletados: stats.totalQuizzes,
        promedio: stats.promedio,
        mejorScore: stats.mejorScore,
        quizzesPerfectos: stats.quizzesPerfectos
      }
    };
  }

  /**
   * Estado de quiz por video: cantidad de preguntas, intentos del usuario,
   * mejor score y score del primer intento.
   */
  async getVideosWithQuizStatus(userId) {
    const [counts, summary] = await Promise.all([
      this.quizQuestionRepository.countAllGroupedByVideo(),
      this.quizAttemptRepository.summarizeByUserGroupedByVideo(userId)
    ]);

    const summaryByVideo = new Map(summary.map((s) => [s.videoId, s]));

    return Object.entries(counts).map(([videoId, totalPreguntas]) => {
      const sum = summaryByVideo.get(videoId);
      return {
        videoId,
        totalPreguntas,
        intentosRealizados: sum?.intentosRealizados || 0,
        mejorScore: sum?.mejorScore || 0,
        primerIntentoScore: sum?.primerIntentoScore ?? null,
        quizDisponible: totalPreguntas > 0
      };
    });
  }

  /**
   * Historial paginado de intentos del usuario.
   */
  async getQuizHistory(userId, options = {}) {
    const { items, total, limit, offset } = await this.quizAttemptRepository.findHistoryByUser(userId, options);

    // Para etiquetar reintentos, agrupo por video y enumero cronologicamente.
    const allUserAttempts = await this.quizAttemptRepository.findHistoryByUser(userId, { limit: 1000, offset: 0 });
    const ordenByVideo = new Map();
    [...allUserAttempts.items].reverse().forEach((it) => {
      const arr = ordenByVideo.get(it.videoId) || [];
      arr.push(it.id);
      ordenByVideo.set(it.videoId, arr);
    });

    const enriched = items.map((it) => {
      const orderArr = ordenByVideo.get(it.videoId) || [];
      const index = orderArr.indexOf(it.id);
      const intentoNumero = index >= 0 ? index + 1 : 1;
      return {
        id: it.id,
        videoId: it.videoId,
        score: it.score,
        correctas: it.correctas,
        totalPreguntas: it.totalPreguntas,
        esPrimerIntento: it.esPrimerIntento,
        cuentaParaScore: it.cuentaParaScore,
        duracionSegundos: it.duracionSegundos,
        intentoNumero,
        createdAt: it.createdAt
      };
    });

    return {
      items: enriched,
      total,
      limit,
      offset,
      hasMore: offset + enriched.length < total
    };
  }
}

module.exports = QuizService;
