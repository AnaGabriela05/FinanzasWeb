import { useCallback, useEffect, useMemo, useState } from 'react'
import LevelBadge from './LevelBadge'
import Skeleton from '../Skeleton'
import { QuizService } from '../../services/quizService'
import { VIDEOS } from '../../data/videos'

function scoreIcon(score) {
  if (score === 100) return '🏆'
  if (score >= 80)   return '👍'
  return '📖'
}

function relativeDate(iso) {
  if (!iso) return ''
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return ''
  const days = Math.floor((Date.now() - date.getTime()) / 86400000)
  if (days <= 0) return 'hoy'
  if (days === 1) return 'hace 1 día'
  if (days < 7)   return `hace ${days} días`
  if (days < 30)  return `hace ${Math.floor(days / 7)} sem.`
  return `hace ${Math.floor(days / 30)} meses`
}

const PAGE_SIZE = 20

export default function ProgressTab({ onTakeQuiz, videosStatus = [], onRefresh }) {
  const [progress, setProgress] = useState(null)
  const [loadingProgress, setLoadingProgress] = useState(true)

  const [history, setHistory] = useState([])
  const [historyTotal, setHistoryTotal] = useState(0)
  const [historyOffset, setHistoryOffset] = useState(0)
  const [loadingHistory, setLoadingHistory] = useState(true)

  const videosById = useMemo(() => {
    const map = new Map()
    VIDEOS.forEach((v) => map.set(v.youtubeId, v))
    return map
  }, [])

  const pendingVideos = useMemo(() => {
    const statusByVideo = new Map(videosStatus.map((s) => [s.videoId, s]))
    return VIDEOS
      .filter((v) => {
        const st = statusByVideo.get(v.youtubeId)
        return !st || st.primerIntentoScore == null
      })
      .slice(0, 3)
  }, [videosStatus])

  const loadProgress = useCallback(() => {
    setLoadingProgress(true)
    return QuizService.getProgress()
      .then((data) => setProgress(data))
      .catch(() => setProgress(null))
      .finally(() => setLoadingProgress(false))
  }, [])

  const loadHistory = useCallback((append = false) => {
    setLoadingHistory(true)
    const offset = append ? historyOffset : 0
    return QuizService.getHistory({ limit: PAGE_SIZE, offset })
      .then((data) => {
        const items = Array.isArray(data?.items) ? data.items : []
        if (append) {
          setHistory((prev) => [...prev, ...items])
          setHistoryOffset(offset + items.length)
        } else {
          setHistory(items)
          setHistoryOffset(items.length)
        }
        setHistoryTotal(Number(data?.total) || 0)
      })
      .catch(() => { /* silencioso */ })
      .finally(() => setLoadingHistory(false))
  }, [historyOffset])

  useEffect(() => {
    loadProgress()
    loadHistory(false)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const niveles = progress?.niveles || []
  const nivelActualNombre = progress?.nivel?.nombre
  const nivelActualIdx = niveles.findIndex((n) => n.nombre === nivelActualNombre)

  return (
    <section className="flex flex-col gap-6">
      <header>
        <h2 className="text-2xl font-bold text-slate-900">Tu progreso de aprendizaje</h2>
        <p className="text-sm text-slate-500 mt-1">
          Sube de nivel completando quizzes. Solo el primer intento de cada video suma a tu puntaje oficial.
        </p>
      </header>

      {/* Level badge expandido */}
      {loadingProgress ? (
        <Skeleton height={110} radius={12} />
      ) : (
        <LevelBadge
          nivel={progress?.nivel}
          siguienteNivel={progress?.siguienteNivel}
          totalPoints={progress?.totalPoints || 0}
        />
      )}

      {/* KPIs */}
      <div className="grid gap-3 grid-cols-2 md:grid-cols-4">
        <KpiCard label="Puntos totales" value={loadingProgress ? '—' : progress?.totalPoints ?? 0} />
        <KpiCard label="Quizzes completados" value={loadingProgress ? '—' : progress?.stats?.quizzesCompletados ?? 0} />
        <KpiCard
          label="Promedio aciertos"
          value={loadingProgress ? '—' : `${progress?.stats?.promedio ?? 0}/100`}
        />
        <KpiCard label="Quizzes perfectos" value={loadingProgress ? '—' : progress?.stats?.quizzesPerfectos ?? 0} />
      </div>

      {/* Próximos pasos */}
      <section className="flex flex-col gap-2">
        <h3 className="text-lg font-semibold text-slate-900">Próximos pasos</h3>
        {pendingVideos.length === 0 ? (
          <p className="text-sm text-slate-600">
            🎉 ¡Has completado todos los quizzes disponibles! Reintenta para mejorar tus scores.
          </p>
        ) : (
          <div className="grid gap-3 md:grid-cols-3">
            {pendingVideos.map((video) => (
              <article
                key={video.youtubeId}
                className="rounded-xl border border-slate-200 bg-white p-3 flex flex-col gap-2 shadow-sm"
              >
                <h4 className="text-sm font-semibold text-slate-900 line-clamp-2">{video.title}</h4>
                <p className="text-xs text-slate-500">{video.channel}</p>
                <button
                  type="button"
                  className="self-start text-xs font-medium text-white bg-teal-700 hover:bg-teal-800 px-3 py-1.5 rounded-lg"
                  onClick={() => onTakeQuiz?.(video)}
                >
                  🎯 Tomar quiz
                </button>
              </article>
            ))}
          </div>
        )}
      </section>

      {/* Sistema de niveles */}
      <section className="flex flex-col gap-3">
        <h3 className="text-lg font-semibold text-slate-900">Sistema de niveles</h3>
        <div className="flex items-center justify-between gap-2 overflow-x-auto">
          {niveles.map((nivel, idx) => {
            const unlocked = idx <= nivelActualIdx
            const isCurrent = idx === nivelActualIdx
            return (
              <div key={nivel.nombre} className="flex items-center gap-2 shrink-0">
                <div
                  className={`flex flex-col items-center text-center px-2 ${
                    isCurrent ? 'scale-110' : ''
                  }`}
                >
                  <span
                    className="text-2xl"
                    style={{ filter: unlocked ? 'none' : 'grayscale(0.6) opacity(0.55)' }}
                    aria-hidden="true"
                  >
                    {nivel.icono}
                  </span>
                  <span
                    className={`text-xs font-semibold mt-1 ${unlocked ? '' : 'text-slate-400'}`}
                    style={unlocked ? { color: nivel.color } : null}
                  >
                    {nivel.nombre}
                  </span>
                  <span className="text-[10px] text-slate-500">
                    {nivel.minPoints}
                    {nivel.maxPoints != null ? `–${nivel.maxPoints}` : '+'}
                  </span>
                  {unlocked ? (
                    <span className="text-green-600 text-xs mt-0.5">✓</span>
                  ) : (
                    <span className="text-slate-400 text-xs mt-0.5">🔒</span>
                  )}
                </div>
                {idx < niveles.length - 1 ? (
                  <span
                    className="h-px w-6 md:w-10"
                    style={{ background: idx < nivelActualIdx ? '#16A34A' : '#CBD5E1' }}
                  />
                ) : null}
              </div>
            )
          })}
        </div>
      </section>

      {/* Historial */}
      <section className="flex flex-col gap-3">
        <h3 className="text-lg font-semibold text-slate-900">Historial de quizzes</h3>
        {loadingHistory && history.length === 0 ? (
          <div className="flex flex-col gap-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} height={56} radius={10} />
            ))}
          </div>
        ) : history.length === 0 ? (
          <p className="text-sm text-slate-500">
            Aún no tienes intentos registrados. Toma tu primer quiz desde la pestaña “Videos educativos”.
          </p>
        ) : (
          <div className="flex flex-col gap-2">
            {history.map((it) => {
              const video = videosById.get(it.videoId)
              return (
                <article
                  key={it.id}
                  className="rounded-xl border border-slate-200 bg-white p-3 flex items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span aria-hidden="true" className="text-2xl">{scoreIcon(it.score)}</span>
                    <div className="flex flex-col min-w-0">
                      <p className="text-sm font-semibold text-slate-900 truncate">
                        {video?.title || it.videoId}
                      </p>
                      <p className="text-xs text-slate-500">
                        {it.cuentaParaScore
                          ? <span className="text-teal-700 font-medium">Primer intento</span>
                          : <span>Reintento N°{it.intentoNumero}</span>}
                        {' · '}
                        {relativeDate(it.createdAt)}
                      </p>
                    </div>
                  </div>
                  <span
                    className={`shrink-0 text-sm font-bold ${
                      it.score === 100 ? 'text-green-600' : it.score >= 60 ? 'text-slate-900' : 'text-amber-700'
                    }`}
                  >
                    {it.score}/100
                  </span>
                </article>
              )
            })}
            {history.length < historyTotal ? (
              <div className="text-center">
                <button
                  type="button"
                  className="button-secondary"
                  disabled={loadingHistory}
                  onClick={() => loadHistory(true)}
                >
                  {loadingHistory ? 'Cargando...' : 'Cargar más'}
                </button>
              </div>
            ) : null}
          </div>
        )}
      </section>
    </section>
  )
}

function KpiCard({ label, value }) {
  return (
    <article className="rounded-xl border border-slate-200 bg-white p-3 flex flex-col gap-1 shadow-sm">
      <span className="text-[11px] uppercase tracking-wide text-slate-500 font-medium">{label}</span>
      <strong className="text-xl text-slate-900">{value}</strong>
    </article>
  )
}
