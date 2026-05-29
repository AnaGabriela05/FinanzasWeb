const HttpError = require('../../errors/HttpError');

const SYSTEM_PROMPT = `Eres un asesor financiero personal experto en finanzas de jovenes peruanos entre 18 y 35 anos. Tu objetivo es dar consejos practicos, accionables, en espanol peruano natural, sin tecnicismos financieros. Cada consejo debe ser breve (maximo 2 oraciones) y enfocado en una accion concreta.

Debes retornar exactamente entre 3 y 5 consejos en formato JSON valido,
sin texto adicional, con esta estructura:

{
  "consejos": [
    { "tipo": "ahorro" | "gasto" | "presupuesto" | "deuda", "contenido": "texto del consejo" }
  ]
}`;

class OpenAiAdvisor {
  constructor({ apiKey, model = 'gpt-4o-mini' } = {}) {
    this.apiKey = apiKey;
    this.model = model;
    this._client = null;
  }

  getClient() {
    if (this._client) return this._client;
    // Carga perezosa para no romper si el paquete no esta instalado en modo mock.
    // eslint-disable-next-line global-require
    const OpenAI = require('openai');
    this._client = new OpenAI({ apiKey: this.apiKey });
    return this._client;
  }

  /**
   * Llama a la API de OpenAI con un prompt contextualizado y devuelve
   * un array de objetos { tipo, contenido }.
   */
  async generateAdvice(financialContext = {}) {
    const userPrompt = buildUserPrompt(financialContext);
    const client = this.getClient();

    let response;
    try {
      response = await client.chat.completions.create({
        model: this.model,
        temperature: 0.7,
        response_format: { type: 'json_object' },
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: userPrompt }
        ]
      });
    } catch (err) {
      throw new HttpError(502, 'Error al llamar al servicio de IA.', {
        cause: err?.message || String(err)
      });
    }

    const content = response?.choices?.[0]?.message?.content;
    if (!content) {
      throw new HttpError(502, 'La IA no retorno contenido.');
    }

    let parsed;
    try {
      parsed = JSON.parse(content);
    } catch (err) {
      throw new HttpError(502, 'La IA retorno un JSON invalido.', { cause: err.message });
    }

    const consejos = Array.isArray(parsed?.consejos) ? parsed.consejos : parsed;
    if (!Array.isArray(consejos)) {
      throw new HttpError(502, 'La IA retorno una estructura inesperada.');
    }

    return consejos;
  }
}

function buildUserPrompt(ctx) {
  const m = ctx.metricas || {};
  const top = (ctx.topCategoriasGasto || [])
    .map((c, i) => `${i + 1}. ${c.nombre}: S/ ${c.total}`)
    .join('\n');

  return `Analiza la situacion financiera de un usuario peruano y genera consejos personalizados.

Datos del usuario (ultimos 90 dias):
- Score de salud financiera: ${ctx.score ?? 'sin datos'}/100
- Nivel del semaforo: ${ctx.nivel || 'neutral'}
- Tasa de ahorro: ${formatPct(m.tasaAhorro)}
- Ratio gastos/ingresos: ${formatPct(m.ratioGasto)}
- Cumplimiento de presupuesto (sobrepaso relativo): ${formatPct(m.cumplimientoPresupuesto)}
- Carga de deuda: ${formatPct(m.cargaDeuda)}

Top 3 categorias con mas gasto:
${top || '- (sin datos)'}

Genera entre 3 y 5 consejos personalizados segun esta situacion. Se directo, practico y contextualizado al Peru (puedes mencionar Soles, costos tipicos peruanos, habitos comunes).`;
}

function formatPct(v) {
  if (v === null || v === undefined || Number.isNaN(v) || !Number.isFinite(v)) return 'sin datos';
  return `${Math.round(Number(v) * 100)}%`;
}

module.exports = OpenAiAdvisor;
