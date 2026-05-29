import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import Modal from '../Modal'
import Skeleton from '../Skeleton'
import { QuizService } from '../../services/quizService'
import { useToast } from '../Toast'

const SCORE_MESSAGES = [
  { min: 100, emoji: '🎉', text: '¡Perfecto! Conoces el tema al detalle.' },
  { min: 80,  emoji: '👏', text: '¡Muy bien! Tienes un buen dominio.' },
  { min: 60,  emoji: '💪', text: 'Bien, pero hay espacio para mejorar.' },
  { min: 0,   emoji: '📖', text: 'Te recomendamos revisar el video nuevamente.' }
]

function getScoreFeedback(score) {
  return SCORE_MESSAGES.find((m) => score >= m.min) || SCORE_MESSAGES[SCORE_MESSAGES.length - 1]
}

function formatDuration(seconds) {
  if (seconds === null || seconds === undefined) return ''
  const m = Math.floor(seconds / 60)
  const s = Math.floor(seconds % 60)
  return m > 0 ? `${m}m ${s}s` : `${s}s`
}

const LETTERS = ['A', 'B', 'C', 'D']

export default function QuizModal({ open, video, onClose, onCompleted }) {
  const toast = useToast()
  const [phase, setPhase] = useState('loading') // loading | active | submitting | done
  const [questions, setQuestions] = useState([])
  const [currentIdx, setCurrentIdx] = useState(0)
  const [answers, setAnswers] = useState({})
  const [questionTimings, setQuestionTimings] = useState({})
  const [questionStartAt, setQuestionStartAt] = useState(null)
  const [quizStartAt, setQuizStartAt] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const [result, setResult] = useState(null)
  const [error, setError] = useState('')
  const [showDetail, setShowDetail] = useState(false)

  const videoId = video?.youtubeId
  const videoTitle = video?.title || ''
  const cancelRef = useRef(false)

  const reset = useCallback(() => {
    cancelRef.current = false
    setPhase('loading')
    setQuestions([])
    setCurrentIdx(0)
    setAnswers({})
    setQuestionTimings({})
    setQuestionStartAt(null)
    setQuizStartAt(null)
    setSubmitting(false)
    setResult(null)
    setError('')
    setShowDetail(false)
  }, [])

  const loadQuiz = useCallback(async (vId) => {
    setPhase('loading')
    setError('')
    try {
      const data = await QuizService.startQuiz(vId)
      if (cancelRef.current) return
      setQuestions(Array.isArray(data?.questions) ? data.questions : [])
      const now = Date.now()
      setQuizStartAt(now)
      setQuestionStartAt(now)
      setPhase('active')
    } catch (err) {
      if (!cancelRef.current) {
        setError(err.message || 'No se pudo cargar el quiz')
        setPhase('error')
      }
    }
  }, [])

  useEffect(() => {
    if (!open) {
      cancelRef.current = true
      reset()
      return undefined
    }
    if (!videoId) return undefined

    cancelRef.current = false
    reset()
    loadQuiz(videoId)

    return () => {
      cancelRef.current = true
    }
  }, [open, videoId, loadQuiz, reset])

  const currentQuestion = questions[currentIdx]
  const totalQuestions = questions.length
  const progressPct = totalQuestions > 0 ? ((currentIdx + 1) / totalQuestions) * 100 : 0
  const isLast = currentIdx === totalQuestions - 1
  const selectedForCurrent = currentQuestion ? answers[currentQuestion.id] : null

  function selectAnswer(letter) {
    if (!currentQuestion) return
    setAnswers((prev) => ({ ...prev, [currentQuestion.id]: letter }))
  }

  function goNext() {
    if (!currentQuestion) return
    const elapsed = questionStartAt ? Math.max(0, Math.round((Date.now() - questionStartAt) / 1000)) : null
    setQuestionTimings((prev) => ({ ...prev, [currentQuestion.id]: elapsed }))
    if (isLast) {
      handleSubmit()
    } else {
      setCurrentIdx((idx) => idx + 1)
      setQuestionStartAt(Date.now())
    }
  }

  async function handleSubmit() {
    setPhase('submitting')
    setSubmitting(true)
    setError('')

    const duracionSegundos = quizStartAt
      ? Math.max(0, Math.round((Date.now() - quizStartAt) / 1000))
      : null

    const lastTiming = currentQuestion && questionStartAt
      ? Math.max(0, Math.round((Date.now() - questionStartAt) / 1000))
      : null

    const payload = {
      videoId,
      duracionSegundos,
      answers: questions.map((q) => ({
        questionId: q.id,
        respuesta: answers[q.id] || 'A',
        tiempoSegundos: questionTimings[q.id] ?? (q.id === currentQuestion?.id ? lastTiming : null)
      }))
    }

    try {
      const data = await QuizService.submitQuiz(payload)
      if (cancelRef.current) return
      setResult(data)
      setPhase('done')
      if (typeof onCompleted === 'function') {
        try { onCompleted(data) } catch { /* noop */ }
      }
    } catch (err) {
      if (!cancelRef.current) {
        setError(err.message || 'No se pudo calificar el quiz')
        setPhase('error')
        toast.error(err.message || 'No se pudo calificar el quiz')
      }
    } finally {
      setSubmitting(false)
    }
  }

  function handleRetry() {
    reset()
    loadQuiz(videoId)
  }

  const allAnswered = useMemo(
    () => questions.length > 0 && questions.every((q) => !!answers[q.id]),
    [questions, answers]
  )

  const feedback = result ? getScoreFeedback(result.score) : null

  return (
    <Modal
      open={open}
      title={videoTitle ? `Quiz: ${videoTitle}` : 'Quiz'}
      size="large"
      onClose={onClose}
      footer={phase === 'done' ? (
        <>
          <button type="button" className="button-secondary" onClick={handleRetry}>
            Reintentar quiz
          </button>
          <button type="button" className="button-primary" onClick={onClose}>
            Volver a videos
          </button>
        </>
      ) : phase === 'active' ? (
        <>
          <button type="button" className="button-secondary" onClick={onClose}>
            Cancelar
          </button>
          <button
            type="button"
            className="button-primary"
            onClick={goNext}
            disabled={!selectedForCurrent}
          >
            {isLast ? 'Finalizar quiz' : 'Siguiente pregunta'}
          </button>
        </>
      ) : null}
    >
      {/* Estado A: Loading */}
      {phase === 'loading' ? (
        <div className="flex flex-col gap-3">
          <Skeleton height={16} width="40%" />
          <Skeleton height={28} width="80%" />
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} height={52} radius={10} />
          ))}
        </div>
      ) : null}

      {/* Estado de error */}
      {phase === 'error' ? (
        <div className="flex flex-col gap-3">
          <p className="text-red-600">{error}</p>
          <button type="button" className="button-secondary self-start" onClick={onClose}>
            Cerrar
          </button>
        </div>
      ) : null}

      {/* Estado B: Quiz activo */}
      {phase === 'active' && currentQuestion ? (
        <div className="flex flex-col gap-4">
          <header className="flex items-center justify-between">
            <span className="text-sm font-medium text-slate-600">
              Pregunta {currentIdx + 1} de {totalQuestions}
            </span>
            <span className="text-xs text-slate-400 uppercase tracking-wide">
              {currentQuestion.dificultad}
            </span>
          </header>

          <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
            <div
              className="h-2 rounded-full bg-teal-700 transition-all duration-300"
              style={{ width: `${progressPct}%` }}
            />
          </div>

          <h3 className="text-lg font-semibold text-slate-900 leading-snug">
            {currentQuestion.pregunta}
          </h3>

          <div className="grid gap-2">
            {LETTERS.map((letter) => {
              const text = currentQuestion[`opcion${letter}`]
              const selected = selectedForCurrent === letter
              return (
                <button
                  key={letter}
                  type="button"
                  onClick={() => selectAnswer(letter)}
                  className={`text-left rounded-xl border-2 px-4 py-3 transition-all flex items-start gap-3 hover:shadow-md ${
                    selected
                      ? 'border-teal-700 bg-teal-50'
                      : 'border-slate-200 bg-white hover:border-slate-300'
                  }`}
                >
                  <span
                    className={`shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold ${
                      selected ? 'bg-teal-700 text-white' : 'bg-slate-100 text-slate-700'
                    }`}
                  >
                    {letter}
                  </span>
                  <span className="text-sm text-slate-800">{text}</span>
                </button>
              )
            })}
          </div>

          {!allAnswered && isLast ? (
            <p className="text-xs text-amber-700">
              Aún tienes preguntas sin responder. Asegúrate de seleccionar una opción en cada una antes de finalizar.
            </p>
          ) : null}
        </div>
      ) : null}

      {/* Estado C: Enviando */}
      {phase === 'submitting' ? (
        <div className="flex flex-col items-center gap-4 py-8">
          <Skeleton width={80} height={80} radius="50%" />
          <p className="text-slate-600">Calificando tus respuestas...</p>
        </div>
      ) : null}

      {/* Estado D: Resultado */}
      {phase === 'done' && result ? (
        <div className="flex flex-col gap-5">
          {result.subioDeNivel ? (
            <div
              className="rounded-xl px-4 py-3 text-white font-semibold flex items-center gap-2"
              style={{ background: result.nivelActual?.color || '#0F766E' }}
            >
              <span aria-hidden="true">{result.nivelActual?.icono || '🎖️'}</span>
              <span>¡Subiste al nivel {result.nivelActual?.nombre}!</span>
            </div>
          ) : null}

          <div className="text-center">
            <div className="text-5xl font-bold text-slate-900">
              {result.score} <span className="text-2xl text-slate-400">/ 100</span>
            </div>
            <p className="mt-2 text-slate-600">
              <span aria-hidden="true">{feedback?.emoji} </span>
              {feedback?.text}
            </p>
            <p className="mt-1 text-xs text-slate-500">
              {result.correctas} de {result.total} correctas
              {result.duracionSegundos != null ? ` · ${formatDuration(result.duracionSegundos)}` : ''}
              {result.esPrimerIntento ? ' · Primer intento (cuenta para tu nivel)' : ' · Reintento (no suma)'}
            </p>
          </div>

          <div className="flex flex-wrap gap-2 justify-center text-sm">
            <span className="rounded-full bg-slate-100 text-slate-700 px-3 py-1">
              Puntos totales: <strong>{result.puntosTotalesUsuario}</strong>
            </span>
            <span
              className="rounded-full px-3 py-1 text-white"
              style={{ background: result.nivelActual?.color || '#0F766E' }}
            >
              {result.nivelActual?.icono} {result.nivelActual?.nombre}
            </span>
          </div>

          <button
            type="button"
            onClick={() => setShowDetail((v) => !v)}
            className="self-start text-sm font-medium text-teal-700 hover:text-teal-800"
            aria-expanded={showDetail}
          >
            {showDetail ? '▲ Ocultar detalle de respuestas' : '▼ Ver detalle de respuestas'}
          </button>

          {showDetail ? (
            <div className="flex flex-col gap-3">
              {result.answers.map((ans, i) => (
                <article
                  key={ans.questionId}
                  className={`rounded-xl border-2 p-3 ${
                    ans.esCorrecta ? 'border-green-300 bg-green-50' : 'border-red-300 bg-red-50'
                  }`}
                >
                  <div className="flex items-start gap-2">
                    <span
                      aria-hidden="true"
                      className={`shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white ${
                        ans.esCorrecta ? 'bg-green-600' : 'bg-red-600'
                      }`}
                    >
                      {ans.esCorrecta ? '✓' : '✗'}
                    </span>
                    <div className="flex flex-col gap-1">
                      <p className="text-sm font-semibold text-slate-900">
                        {i + 1}. {ans.pregunta}
                      </p>
                      <p className="text-xs text-slate-700">
                        Tu respuesta: <strong>{ans.tuRespuesta}</strong>
                        {' · '}
                        {ans.opciones?.[ans.tuRespuesta]}
                      </p>
                      {!ans.esCorrecta ? (
                        <p className="text-xs text-slate-700">
                          Correcta: <strong>{ans.respuestaCorrecta}</strong>
                          {' · '}
                          {ans.opciones?.[ans.respuestaCorrecta]}
                        </p>
                      ) : null}
                      {ans.explicacion ? (
                        <p className="text-xs text-slate-600 italic mt-1">
                          {ans.explicacion}
                        </p>
                      ) : null}
                    </div>
                  </div>
                </article>
              ))}
            </div>
          ) : null}
        </div>
      ) : null}
    </Modal>
  )
}
