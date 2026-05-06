import { API } from '../lib/api'

export const PaymentMethodsService = {
  list() {
    return API.get('/api/payment-methods')
  },

  create(payload) {
    return API.post('/api/payment-methods', payload)
  },

  update(id, payload) {
    return API.put(`/api/payment-methods/${id}`, payload)
  },

  remove(id, query = '') {
    return API.del(`/api/payment-methods/${id}${query}`)
  },

  usage(id) {
    return API.get(`/api/payment-methods/${id}/usage`)
  }
}
