import { API } from '../lib/api'
import { Auth } from '../lib/auth'

function buildQuery(filters = {}) {
  const params = new URLSearchParams()

  if (filters.from) params.set('from', filters.from)
  if (filters.to) params.set('to', filters.to)
  if (filters.categoryId) params.set('categoryId', filters.categoryId)
  if (filters.paymentMethodId) params.set('paymentMethodId', filters.paymentMethodId)
  if (filters.transactionType) params.set('transactionType', filters.transactionType)

  const query = params.toString()
  return query ? `?${query}` : ''
}

function getFilenameFromDisposition(header, fallback) {
  if (!header) return fallback

  const match = header.match(/filename="?([^"]+)"?/)
  return match?.[1] || fallback
}

export const ReportService = {
  getOverview() {
    return API.get('/api/reports/overview')
  },

  getInsights(filters = {}) {
    return API.get(`/api/reports/insights${buildQuery(filters)}`)
  },

  getTransactions(filters = {}) {
    return API.get(`/api/transactions${buildQuery(filters)}`)
  },

  getCategories() {
    return API.get('/api/categories')
  },

  getPaymentMethods() {
    return API.get('/api/payment-methods')
  },

  async downloadExport(filters = {}, format = 'pdf') {
    const query = buildQuery({ ...filters, format })
    const token = Auth.token()
    const response = await fetch(`/api/reports/transactions/export${query}`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {}
    })

    if (!response.ok) {
      const text = await response.text()

      try {
        const data = JSON.parse(text)
        throw new Error(data?.error || data?.message || 'No se pudo generar la exportacion')
      } catch {
        throw new Error(text || 'No se pudo generar la exportacion')
      }
    }

    const blob = await response.blob()
    const filename = getFilenameFromDisposition(
      response.headers.get('content-disposition'),
      `reporte.${format === 'xlsx' ? 'xlsx' : 'pdf'}`
    )

    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = filename
    document.body.appendChild(link)
    link.click()
    link.remove()
    URL.revokeObjectURL(url)
  }
}
