// Tasa actual USD -> PEN. Default razonable; se actualiza al iniciar app via /api/config/currency.
let usdToPen = 3.75

export function setExchangeRate(rate) {
  const value = Number(rate)
  if (Number.isFinite(value) && value > 0) {
    usdToPen = value
  }
}

export function getExchangeRate() {
  return usdToPen
}

const penFormatter = new Intl.NumberFormat('es-PE', {
  style: 'currency',
  currency: 'PEN',
  maximumFractionDigits: 2
})

const usdFormatter = new Intl.NumberFormat('es-PE', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 2
})

export function formatPEN(amount) {
  return penFormatter.format(Number(amount || 0))
}

export function formatUSD(amount) {
  return usdFormatter.format(Number(amount || 0))
}

export function formatAmount(amount, currency = 'PEN') {
  if (currency === 'USD') return formatUSD(amount)
  return formatPEN(amount)
}

// Para mostrar montos de transacciones: si es USD muestra original + aprox en PEN.
// Devuelve { display, approx, isForeign } para que el caller renderice como prefiera.
export function describeAmount(amount, currency = 'PEN') {
  if (currency === 'USD') {
    return {
      display: formatUSD(amount),
      approx: formatPEN(Number(amount || 0) * usdToPen),
      isForeign: true
    }
  }
  return {
    display: formatPEN(amount),
    approx: null,
    isForeign: false
  }
}
