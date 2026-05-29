const MOCK_LIBRARY = {
  rojo: [
    { tipo: 'gasto', contenido: 'Tus gastos estan superando lo saludable para tu nivel de ingresos. Revisa tus ultimas transacciones y elimina los gastos no esenciales esta semana.' },
    { tipo: 'presupuesto', contenido: 'Establece presupuestos mensuales por categoria. Empieza con tus dos categorias de mayor gasto.' },
    { tipo: 'ahorro', contenido: 'Apunta a guardar al menos S/ 50 esta quincena, aunque sea poco. La constancia importa mas que el monto.' },
    { tipo: 'deuda', contenido: 'Si tienes deudas en tarjetas, prioriza pagar primero la que tiene mayor tasa de interes. Es matematica pura, no emocion.' }
  ],
  amarillo: [
    { tipo: 'ahorro', contenido: 'Tu salud financiera es aceptable pero puede mejorar. Intenta aumentar tu tasa de ahorro al 20% este mes.' },
    { tipo: 'presupuesto', contenido: 'Revisa el cumplimiento de tus presupuestos. Hay categorias donde podrias ajustar el limite mensual.' },
    { tipo: 'gasto', contenido: 'Identifica gastos hormiga: pequenos gastos diarios que suman al mes. Por ejemplo, snacks o servicios de streaming que no usas.' }
  ],
  verde: [
    { tipo: 'ahorro', contenido: 'Excelente! Tu salud financiera esta sana. Considera invertir parte de tu ahorro en instrumentos como fondos mutuos o CTS.' },
    { tipo: 'presupuesto', contenido: 'Manten tus presupuestos actuales. Estas demostrando disciplina financiera.' },
    { tipo: 'ahorro', contenido: 'Es buen momento para definir metas de ahorro a mediano plazo: un viaje, un curso, o un fondo de emergencia.' }
  ],
  neutral: [
    { tipo: 'gasto', contenido: 'Registra al menos 10 transacciones para que el sistema pueda analizar tu comportamiento financiero.' },
    { tipo: 'presupuesto', contenido: 'Configura presupuestos por categoria para empezar a tomar control de tu dinero.' },
    { tipo: 'ahorro', contenido: 'Define al menos una meta de ahorro concreta. Tener un objetivo claro multiplica las probabilidades de lograrlo.' }
  ]
};

class MockAdvisor {
  /**
   * Retorna un set de consejos pre-armados segun el nivel del semaforo financiero.
   * Mantiene la misma firma que OpenAiAdvisor para permitir intercambiarlos.
   *
   * @param {Object} financialContext
   * @param {('rojo'|'amarillo'|'verde'|'neutral')} financialContext.nivel
   * @returns {Promise<Array<{tipo: string, contenido: string}>>}
   */
  async generateAdvice(financialContext = {}) {
    const nivel = String(financialContext.nivel || 'neutral').toLowerCase();
    const consejos = MOCK_LIBRARY[nivel] || MOCK_LIBRARY.neutral;
    return consejos.map((consejo) => ({ ...consejo }));
  }
}

module.exports = MockAdvisor;
