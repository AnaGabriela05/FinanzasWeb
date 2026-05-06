import { API } from '../lib/api'

export const BudgetsService = {
  list(params = {}) {
    const query = new URLSearchParams()

    if (params.mes) query.set('mes', params.mes)
    if (params.anio) query.set('anio', params.anio)

    const suffix = query.toString() ? `?${query.toString()}` : ''
    return API.get(`/api/budgets${suffix}`)
  },

  create(payload) {
    return API.post('/api/budgets', payload)
  },

  update(id, payload) {
    return API.put(`/api/budgets/${id}`, payload)
  },

  remove(id) {
    return API.del(`/api/budgets/${id}`)
  },

  categories() {
    return API.get('/api/categories')
  }
}
