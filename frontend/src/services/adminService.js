import { API } from '../lib/api'

function buildQuery(filters = {}) {
  const params = new URLSearchParams()
  Object.entries(filters).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== '') params.set(k, v)
  })
  const query = params.toString()
  return query ? `?${query}` : ''
}

export const AdminService = {
  listUsers(filters = {}) {
    return API.get(`/api/admin/users${buildQuery(filters)}`)
  },
  getUserMetadata(id) {
    return API.get(`/api/admin/users/${id}`)
  },
  lockUser(id, minutos = 10) {
    return API.post(`/api/admin/users/${id}/lock`, { minutos })
  },
  unlockUser(id) {
    return API.post(`/api/admin/users/${id}/unlock`, {})
  },
  resetFailedAttempts(id) {
    return API.post(`/api/admin/users/${id}/reset-attempts`, {})
  },

  createGlobalCategory(data) {
    return API.post('/api/admin/categories', data)
  },
  updateGlobalCategory(id, data) {
    return API.put(`/api/admin/categories/${id}`, data)
  },
  archiveGlobalCategory(id) {
    return API.post(`/api/admin/categories/${id}/archive`, {})
  },
  deleteGlobalCategory(id, cascade = false) {
    const qs = cascade ? '?cascade=1' : ''
    return API.del(`/api/admin/categories/${id}${qs}`)
  },

  getMetrics() {
    return API.get('/api/admin/metrics')
  },
  getRegistrationsChart(meses = 6) {
    return API.get(`/api/admin/metrics/registrations?meses=${meses}`)
  },
  getExportLogs(filters = {}) {
    return API.get(`/api/admin/audit/exports${buildQuery(filters)}`)
  }
}
