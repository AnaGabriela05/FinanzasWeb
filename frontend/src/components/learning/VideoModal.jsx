import { useEffect, useRef, useState } from 'react'
import Modal from '../Modal'
import Skeleton from '../Skeleton'
import { useToast } from '../Toast'
import { getYoutubeEmbedUrl, getYoutubeWatchUrl } from '../../data/videos'
import { LearningService } from '../../services/learning'

const TABS = [
  { id: 'points', label: 'Puntos clave' },
  { id: 'notes', label: 'Mis notas' },
  { id: 'checklist', label: 'Checklist' }
]

const SAVE_DEBOUNCE_MS = 600

function makeChecklistItem(text) {
  return {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    text,
    done: false
  }
}

export default function VideoModal({ video, open, onClose }) {
  const toast = useToast()
  const [tab, setTab] = useState('points')
  const [notes, setNotes] = useState('')
  const [checklist, setChecklist] = useState([])
  const [todoText, setTodoText] = useState('')
  const [loading, setLoading] = useState(false)
  const [savedFlash, setSavedFlash] = useState(false)

  const initializedRef = useRef(false)
  const saveTimerRef = useRef(null)
  const flashTimerRef = useRef(null)

  useEffect(() => {
    if (!open || !video) {
      initializedRef.current = false
      return
    }

    let cancelled = false
    setTab('points')
    setLoading(true)

    LearningService.getState(video.youtubeId)
      .then((state) => {
        if (cancelled) return
        setNotes(state?.notes || '')
        const list = Array.isArray(state?.checklist) ? state.checklist : []
        setChecklist(list.map((item, index) => ({
          id: item.id || `${Date.now()}-${index}`,
          text: String(item.text || ''),
          done: Boolean(item.done)
        })))
        initializedRef.current = true
      })
      .catch((err) => {
        if (cancelled) return
        toast.error(err.message || 'No se pudo cargar el estado del video')
        initializedRef.current = true
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current)
      if (flashTimerRef.current) clearTimeout(flashTimerRef.current)
    }
  }, [open, video, toast])

  useEffect(() => {
    if (!open || !video || !initializedRef.current) return

    if (saveTimerRef.current) clearTimeout(saveTimerRef.current)

    saveTimerRef.current = setTimeout(async () => {
      try {
        await LearningService.saveState(video.youtubeId, { notes, checklist })
        setSavedFlash(true)
        if (flashTimerRef.current) clearTimeout(flashTimerRef.current)
        flashTimerRef.current = setTimeout(() => setSavedFlash(false), 1200)
      } catch (err) {
        toast.error(err.message || 'No se pudo guardar')
      }
    }, SAVE_DEBOUNCE_MS)

    return () => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current)
    }
  }, [notes, checklist, open, video])

  function handleAddTodo() {
    const text = todoText.trim()
    if (!text) return
    setChecklist((current) => [...current, makeChecklistItem(text)])
    setTodoText('')
  }

  function handleToggleTodo(id) {
    setChecklist((current) =>
      current.map((item) => (item.id === id ? { ...item, done: !item.done } : item))
    )
  }

  function handleDeleteTodo(id) {
    setChecklist((current) => current.filter((item) => item.id !== id))
  }

  async function handleCopyNotes() {
    try {
      await navigator.clipboard.writeText(notes)
      toast.success('Notas copiadas al portapapeles')
    } catch {
      toast.error('No se pudo copiar al portapapeles')
    }
  }

  function handleDownloadNotes() {
    const blob = new Blob([notes || ''], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `${(video?.title || 'notas').replace(/\s+/g, '_')}.txt`
    document.body.appendChild(link)
    link.click()
    link.remove()
    URL.revokeObjectURL(url)
  }

  if (!video) return null

  const points = Array.isArray(video.points) ? video.points : []

  const footer = (
    <>
      <a
        className="button-secondary"
        href={getYoutubeWatchUrl(video.youtubeId)}
        target="_blank"
        rel="noopener noreferrer"
      >
        Abrir en YouTube
      </a>
      <button className="button-primary" type="button" onClick={onClose}>
        Cerrar
      </button>
    </>
  )

  return (
    <Modal open={open} title={video.title} size="xl" onClose={onClose} footer={footer}>
      <div className="video-modal-grid">
        <div className="video-modal__player">
          {open ? (
            <iframe
              src={getYoutubeEmbedUrl(video.youtubeId)}
              title={video.title}
              allow="autoplay; encrypted-media; picture-in-picture"
              allowFullScreen
            />
          ) : null}
        </div>

        <aside className="video-modal__side">
          <nav className="video-tabs" role="tablist">
            {TABS.map((item) => (
              <button
                key={item.id}
                type="button"
                role="tab"
                aria-selected={tab === item.id}
                className={`video-tab ${tab === item.id ? 'video-tab--active' : ''}`}
                onClick={() => setTab(item.id)}
              >
                {item.label}
              </button>
            ))}
          </nav>

          {loading ? (
            <div className="video-tab-panel">
              <Skeleton width="100%" height={14} />
              <Skeleton width="90%" height={14} style={{ marginTop: 8 }} />
              <Skeleton width="70%" height={14} style={{ marginTop: 8 }} />
              <Skeleton width="80%" height={14} style={{ marginTop: 8 }} />
            </div>
          ) : (
            <div className="video-tab-panel">
              {tab === 'points' ? (
                points.length ? (
                  <ul className="video-points">
                    {points.map((point, index) => (
                      <li key={index}>{point}</li>
                    ))}
                  </ul>
                ) : (
                  <p className="video-empty">Sin puntos clave para este video.</p>
                )
              ) : null}

              {tab === 'notes' ? (
                <>
                  <textarea
                    className="video-notes"
                    value={notes}
                    onChange={(event) => setNotes(event.target.value)}
                    placeholder="Escribe tus notas aquí..."
                    rows={10}
                  />
                  <div className="video-notes-tools">
                    <button className="button-secondary" type="button" onClick={handleCopyNotes}>
                      Copiar
                    </button>
                    <button
                      className="button-secondary"
                      type="button"
                      onClick={handleDownloadNotes}
                    >
                      Descargar .txt
                    </button>
                    <span className={`video-saved ${savedFlash ? 'video-saved--show' : ''}`}>
                      Guardado
                    </span>
                  </div>
                </>
              ) : null}

              {tab === 'checklist' ? (
                <>
                  <div className="video-todo-add">
                    <input
                      type="text"
                      value={todoText}
                      onChange={(event) => setTodoText(event.target.value)}
                      onKeyDown={(event) => {
                        if (event.key === 'Enter') {
                          event.preventDefault()
                          handleAddTodo()
                        }
                      }}
                      placeholder="Nueva tarea o acción..."
                    />
                    <button
                      className="button-primary"
                      type="button"
                      onClick={handleAddTodo}
                      disabled={!todoText.trim()}
                    >
                      Añadir
                    </button>
                  </div>

                  {checklist.length === 0 ? (
                    <p className="video-empty">Sin tareas todavía.</p>
                  ) : (
                    <ul className="video-todo-list">
                      {checklist.map((item) => (
                        <li
                          key={item.id}
                          className={`video-todo ${item.done ? 'video-todo--done' : ''}`}
                        >
                          <label>
                            <input
                              type="checkbox"
                              checked={item.done}
                              onChange={() => handleToggleTodo(item.id)}
                            />
                            <span>{item.text}</span>
                          </label>
                          <button
                            type="button"
                            className="video-todo-del"
                            onClick={() => handleDeleteTodo(item.id)}
                            aria-label="Eliminar"
                          >
                            x
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </>
              ) : null}
            </div>
          )}
        </aside>
      </div>
    </Modal>
  )
}
