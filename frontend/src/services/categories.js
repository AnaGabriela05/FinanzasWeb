import { API } from '../lib/api'

export const CategoriesService = {
  list() {
    return API.get('/api/categories')
  },

  create(payload) {
    return API.post('/api/categories', payload)
  },

  update(id, payload) {
    return API.put(`/api/categories/${id}`, payload)
  },

  remove(id, query = '') {
    return API.del(`/api/categories/${id}${query}`)
  },

  usage(id) {
    return API.get(`/api/categories/${id}/usage`)
  }
}
