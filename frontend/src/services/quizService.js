import { API } from '../lib/api'

function buildQuery(filters = {}) {
  const params = new URLSearchParams()
  if (filters.limit !== undefined && filters.limit !== null) params.set('limit', filters.limit)
  if (filters.offset !== undefined && filters.offset !== null) params.set('offset', filters.offset)
  const query = params.toString()
  return query ? `?${query}` : ''
}

export const QuizService = {
  startQuiz(videoId) {
    return API.post('/api/quiz/start', { videoId })
  },

  submitQuiz(payload) {
    return API.post('/api/quiz/submit', payload)
  },

  getProgress() {
    return API.get('/api/quiz/progress')
  },

  getVideosStatus() {
    return API.get('/api/quiz/videos-status')
  },

  getHistory(options = {}) {
    return API.get(`/api/quiz/history${buildQuery(options)}`)
  }
}
