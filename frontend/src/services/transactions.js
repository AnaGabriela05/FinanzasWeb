import { API } from '../lib/api'

export const TransactionsService = {
  list(query = '') {
    return API.get(`/api/transactions${query}`)
  },

  create(payload) {
    return API.post('/api/transactions', payload)
  },

  update(id, payload) {
    return API.put(`/api/transactions/${id}`, payload)
  },

  remove(id) {
    return API.del(`/api/transactions/${id}`)
  },

  categories() {
    return API.get('/api/categories')
  },

  paymentMethods() {
    return API.get('/api/payment-methods')
  }
}
