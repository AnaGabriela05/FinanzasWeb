import { useCallback, useEffect, useMemo, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import Layout from '../components/Layout'
import ModuleHeader from '../components/layout/ModuleHeader'
import VideoModal from '../components/learning/VideoModal'
import AdvisorTab from '../components/advice/AdvisorTab'
import QuizModal from '../components/quiz/QuizModal'
import ProgressTab from '../components/quiz/ProgressTab'
import { QuizService } from '../services/quizService'
import { VIDEOS, getYoutubeThumb, getYoutubeWatchUrl } from '../data/videos'
import { usePreviewMode } from '../hooks/usePreviewMode'

const ALL_TAGS = Array.from(new Set(VIDEOS.flatMap((video) => video.tags || []))).sort()

const TABS = [
  { id: 'videos',   label: 'Videos educativos' },
  { id: 'advice',   label: 'Mi asesor IA' },
  { id: 'progress', label: 'Mi progreso' }
]

export default function Learning() {
  const location = useLocation()
  const navigate = useNavigate()
  const isPreview = usePreviewMode()
  const [search, setSearch] = useState('')
  const [tag, setTag] = useState('')
  const [activeVideo, setActiveVideo] = useState(null)
  const [quizVideo, setQuizVideo] = useState(null)
  const [videosStatus, setVideosStatus] = useState([])
  const [progress, setProgress] = useState(null)

  const initialTab = useMemo(() => {
    const params = new URLSearchParams(location.search)
    const requested = params.get('tab')
    return TABS.some((t) => t.id === requested) ? requested : 'videos'
  }, [location.search])

  const [tab, setTab] = useState(initialTab)

  useEffect(() => {
    setTab(initialTab)
  }, [initialTab])

  function selectTab(id) {
    setTab(id)
    const params = new URLSearchParams(location.search)
    if (id === 'videos') params.delete('tab')
    else params.set('tab', id)
    const query = params.toString()
    navigate(`/learning${query ? `?${query}` : ''}`, { replace: true })
  }

  const refreshQuizData = useCallback(() => {
    if (isPreview) {
      setVideosStatus([])
      setProgress(null)
      return
    }
    Promise.all([
      QuizService.getVideosStatus().catch(() => []),
      QuizService.getProgress().catch(() => null)
    ]).then(([status, prog]) => {
      setVideosStatus(Array.isArray(status) ? status : [])
      setProgress(prog)
    })
  }, [isPreview])

  useEffect(() => {
    refreshQuizData()
  }, [refreshQuizData])

  const statusByVideo = useMemo(() => {
    const map = new Map()
    videosStatus.forEach((s) => map.set(s.videoId, s))
    return map
  }, [videosStatus])

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase()
    const tagFilter = tag.trim().toLowerCase()

    return VIDEOS.filter((video) => {
      const haystack = [
        video.title,
        video.channel,
        video.series,
        ...(video.tags || [])
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()

      const matchesQuery = !query || haystack.includes(query)
      const matchesTag =
        !tagFilter ||
        (video.tags || []).map((item) => item.toLowerCase()).includes(tagFilter)

      return matchesQuery && matchesTag
    })
  }, [search, tag])

  function handleQuizCompleted() {
    refreshQuizData()
  }

  const headerBadge = useMemo(() => {
    if (!progress?.nivel) {
      return { icon: '🎓', label: 'Aprendiz', value: '0 pts', variant: 'brand' }
    }
    return {
      icon: progress.nivel.icono,
      label: progress.nivel.nombre,
      value: `${progress.totalPoints} pts`,
      variant: 'brand'
    }
  }, [progress])

  return (
    <>
      <Layout>
        <ModuleHeader
          subtitle="Mira videos, anota aprendizajes y consulta tu asesor IA"
          badges={[headerBadge]}
        />

        <nav
          role="tablist"
          aria-label="Secciones de Aprendizaje"
          style={{
            display: 'flex',
            gap: 4,
            borderBottom: '1px solid #E2E8F0',
            marginBottom: 20
          }}
        >
          {TABS.map((item) => {
            const active = tab === item.id
            return (
              <button
                key={item.id}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => selectTab(item.id)}
                style={{
                  border: 'none',
                  background: 'transparent',
                  padding: '10px 16px',
                  borderBottom: active ? '3px solid #0F766E' : '3px solid transparent',
                  color: active ? '#0F766E' : '#475569',
                  fontWeight: active ? 700 : 500,
                  cursor: 'pointer'
                }}
              >
                {item.label}
              </button>
            )
          })}
        </nav>

        {tab === 'videos' ? (
          <>
            <section className="learning-toolbar">
              <input
                type="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Buscar tema, canal o serie..."
                className="learning-search"
              />

              <select
                className="learning-tag"
                value={tag}
                onChange={(event) => setTag(event.target.value)}
                aria-label="Filtrar por tema"
              >
                <option value="">Todos los temas</option>
                {ALL_TAGS.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </section>

            {filtered.length === 0 ? (
              <section className="module-feedback">
                No hay videos que coincidan con tu búsqueda.
              </section>
            ) : (
              <section className="learning-grid">
                {filtered.map((video) => {
                  const status = statusByVideo.get(video.youtubeId)
                  const tieneQuiz = status?.quizDisponible
                  const primerScore = status?.primerIntentoScore
                  return (
                    <article key={video.youtubeId} className="learning-card">
                      <a
                        className="learning-card__thumb"
                        href={getYoutubeWatchUrl(video.youtubeId)}
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label={`Abrir ${video.title} en YouTube`}
                      >
                        <img
                          loading="lazy"
                          src={getYoutubeThumb(video.youtubeId)}
                          alt={video.title}
                        />
                      </a>

                      <div className="learning-card__body">
                        <h3 title={video.title}>{video.title}</h3>
                        <p className="learning-card__channel">{video.channel}</p>

                        {video.tags?.length ? (
                          <div className="learning-card__tags">
                            {video.tags.map((item) => (
                              <span key={item} className="learning-tag-pill">
                                {item}
                              </span>
                            ))}
                          </div>
                        ) : null}

                        {primerScore !== undefined && primerScore !== null ? (
                          <span
                            className="inline-flex items-center gap-1 self-start rounded-full bg-teal-50 text-teal-800 text-xs font-medium px-2 py-0.5 mt-1"
                            title="Score de tu primer intento (el que cuenta para tu nivel)"
                          >
                            🎯 Primer intento: {primerScore}/100
                          </span>
                        ) : null}

                        <div className="learning-card__actions" style={{ flexWrap: 'wrap', gap: 6 }}>
                          <a
                            className="button-secondary"
                            href={getYoutubeWatchUrl(video.youtubeId)}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            YouTube
                          </a>
                          <button
                            className="button-secondary"
                            type="button"
                            onClick={() => setActiveVideo(video)}
                          >
                            Ver aquí
                          </button>
                          <button
                            className="button-primary"
                            type="button"
                            disabled={!tieneQuiz || isPreview}
                            onClick={() => setQuizVideo(video)}
                            title={
                              isPreview
                                ? 'No disponible en modo vista previa'
                                : tieneQuiz
                                  ? 'Tomar quiz de este video'
                                  : 'Sin preguntas disponibles'
                            }
                          >
                            🎯 Tomar quiz
                          </button>
                        </div>
                      </div>
                    </article>
                  )
                })}
              </section>
            )}
          </>
        ) : null}

        {tab === 'advice' ? (
          isPreview ? (
            <PreviewSectionEmpty
              title="Mi asesor IA"
              body="Esta sección muestra consejos generados con IA a partir del comportamiento financiero del usuario. No está disponible en modo vista previa."
            />
          ) : <AdvisorTab />
        ) : null}

        {tab === 'progress' ? (
          isPreview ? (
            <PreviewSectionEmpty
              title="Mi progreso"
              body="Esta sección muestra el progreso del usuario en los quizzes educativos. No está disponible en modo vista previa."
            />
          ) : (
            <ProgressTab
              videosStatus={videosStatus}
              onTakeQuiz={(video) => setQuizVideo(video)}
              onRefresh={refreshQuizData}
            />
          )
        ) : null}
      </Layout>

      <VideoModal
        open={!!activeVideo}
        video={activeVideo}
        onClose={() => setActiveVideo(null)}
      />

      <QuizModal
        open={!!quizVideo}
        video={quizVideo}
        onClose={() => setQuizVideo(null)}
        onCompleted={handleQuizCompleted}
      />
    </>
  )
}

function PreviewSectionEmpty({ title, body }) {
  return (
    <section className="bg-white border border-slate-200 rounded-xl p-6 text-center">
      <h2 className="text-base font-semibold text-slate-900 mb-2">{title}</h2>
      <p className="text-sm text-slate-600 m-0">{body}</p>
    </section>
  )
}
