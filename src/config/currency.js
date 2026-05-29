// Tasa de cambio USD -> PEN. Default: 3.75 (aproximada).
// Se puede overrid via env: EXCHANGE_USD_TO_PEN=3.80
const usdToPen = Number(process.env.EXCHANGE_USD_TO_PEN) || 3.75;

const SUPPORTED = ['PEN', 'USD'];
const BASE_CURRENCY = 'PEN';

function isSupported(code) {
  return SUPPORTED.includes(String(code || '').toUpperCase());
}

function toBase(amount, currency) {
  const value = Number(amount) || 0;
  const code = String(currency || BASE_CURRENCY).toUpperCase();
  if (code === 'USD') return value * usdToPen;
  return value;
}

module.exports = {
  SUPPORTED,
  BASE_CURRENCY,
  usdToPen,
  isSupported,
  toBase
};
