import { API } from '../lib/api'

function buildQuery(params = {}) {
  const search = new URLSearchParams()

  if (params.page) search.set('page', params.page)
  if (params.limit) search.set('limit', params.limit)
  if (params.from) search.set('from', params.from)
  if (params.to) search.set('to', params.to)
  if (params.categoryId) search.set('categoryId', params.categoryId)
  if (params.paymentMethodId) search.set('paymentMethodId', params.paymentMethodId)
  if (params.transactionType) search.set('transactionType', params.transactionType)

  const qs = search.toString()
  return qs ? `?${qs}` : ''
}

export const TransactionsService = {
  list(params = {}) {
    return API.get(`/api/transactions${buildQuery(params)}`)
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
