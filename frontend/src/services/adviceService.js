import { API } from '../lib/api'

function buildQuery(filters = {}) {
  const params = new URLSearchParams()
  if (filters.limit !== undefined && filters.limit !== null) params.set('limit', filters.limit)
  if (filters.offset !== undefined && filters.offset !== null) params.set('offset', filters.offset)
  if (filters.tipo) params.set('tipo', filters.tipo)
  const query = params.toString()
  return query ? `?${query}` : ''
}

export const AdviceService = {
  getCurrentAdvice() {
    return API.get('/api/advice')
  },

  getAdviceHistory(options = {}) {
    return API.get(`/api/advice/history${buildQuery(options)}`)
  },

  regenerateAdvice() {
    return API.post('/api/advice/regenerate', {})
  },

  getAdviceStats() {
    return API.get('/api/advice/stats')
  }
}
