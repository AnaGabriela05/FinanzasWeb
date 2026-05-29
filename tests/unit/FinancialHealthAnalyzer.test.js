// Tests unitarios puros (sin mocks) para FinancialHealthAnalyzer.
// El analizador es una clase de calculo: recibe transacciones + presupuestos y
// devuelve score + nivel + metricas. No habla con BD ni con el reloj real
// porque le inyectamos `now` por parametro.

// describe/it/expect/beforeEach vienen como globales (vitest.config.mjs -> globals: true)
// porque vitest 4.x no permite `require('vitest')` desde CommonJS.
const FinancialHealthAnalyzer = require('../../src/domain/analyzers/FinancialHealthAnalyzer');

// Reloj fijo: la ventana de 90 dias termina en este instante.
const NOW = new Date('2026-05-29T12:00:00Z');

// Constructores rapidos para mantener los tests legibles.
function tx({ fecha = '2026-05-15', monto, tipo, nombre = '-', currency = 'PEN', categoryId = 1 }) {
  return {
    fecha,
    monto,
    currency,
    category: { id: categoryId, tipo, nombre }
  };
}

function budget({ mes = 5, anio = 2026, montoMensual, categoryId = 1 }) {
  return { mes, anio, montoMensual, categoryId };
}

describe('FinancialHealthAnalyzer.analyzeHealth', () => {
  let analyzer;

  beforeEach(() => {
    analyzer = new FinancialHealthAnalyzer();
  });

  it('sin movimientos en la ventana de 90 dias devuelve nivel "neutral" y score null', () => {
    const result = analyzer.analyzeHealth({
      transactions: [],
      budgets: [],
      now: NOW
    });

    expect(result.level.key).toBe('neutral');
    expect(result.score).toBeNull();
    expect(result.metrics).toEqual({
      savingRate: null,
      expenseRatio: null,
      budgetOvershootRel: null,
      debtLoad: null
    });
    expect(result.totals).toEqual({ ingresos: 0, gastos: 0, saldo: 0, transactionCount: 0 });
    expect(result.range.days).toBe(90);
  });

  it('ignora transacciones fuera de la ventana (mas de 90 dias)', () => {
    // Fecha 2020-01-01 esta MUY fuera del rango: no debe contar.
    const result = analyzer.analyzeHealth({
      transactions: [tx({ fecha: '2020-01-01', monto: 99999, tipo: 'ingreso' })],
      budgets: [],
      now: NOW
    });

    expect(result.level.key).toBe('neutral');
    expect(result.totals.ingresos).toBe(0);
  });

  it('perfil sano: tasa de ahorro alta, gasto bajo, sin deuda -> verde con score 100', () => {
    const transactions = [
      tx({ fecha: '2026-05-10', monto: 5000, tipo: 'ingreso', nombre: 'Sueldo', categoryId: 10 }),
      tx({ fecha: '2026-05-12', monto: 2000, tipo: 'gasto', nombre: 'Comida', categoryId: 20 })
    ];
    // Presupuesto holgado para que budgetOvershootRel = 0.
    const budgets = [budget({ mes: 5, anio: 2026, montoMensual: 2500, categoryId: 20 })];

    const result = analyzer.analyzeHealth({ transactions, budgets, now: NOW });

    expect(result.level.key).toBe('success');
    expect(result.level.label).toBe('Verde');
    expect(result.score).toBe(100);
    expect(result.metrics.savingRate).toBeCloseTo(0.6, 5);    // (5000-2000)/5000
    expect(result.metrics.expenseRatio).toBeCloseTo(0.4, 5);  // 2000/5000
    expect(result.metrics.budgetOvershootRel).toBe(0);
    expect(result.metrics.debtLoad).toBe(0);
  });

  it('perfil ajustado: gastos ~95% de ingresos -> amarillo (warning)', () => {
    const transactions = [
      tx({ fecha: '2026-05-10', monto: 1000, tipo: 'ingreso', categoryId: 10 }),
      tx({ fecha: '2026-05-15', monto: 950, tipo: 'gasto', nombre: 'Servicios', categoryId: 20 })
    ];

    const result = analyzer.analyzeHealth({ transactions, budgets: [], now: NOW });

    expect(result.level.key).toBe('warning');
    expect(result.level.label).toBe('Amarillo');
    // Saving rate = 50/1000 = 0.05 -> sub-score 40 (>=0 pero <0.1)
    // Expense ratio = 0.95 -> sub-score 70 (en limite superior del rango medio)
    // Debt load = 0 -> sub-score 100
    // Sin presupuestos: totalWeight = 0.8, score = (40*0.4 + 70*0.3 + 100*0.1)/0.8 = 58.75 -> 59
    expect(result.score).toBeLessThan(75);
    expect(result.score).toBeGreaterThanOrEqual(50);
  });

  it('perfil negativo: gastos > ingresos -> rojo (danger) y score bajo', () => {
    const transactions = [
      tx({ fecha: '2026-05-05', monto: 1000, tipo: 'ingreso', categoryId: 10 }),
      tx({ fecha: '2026-05-20', monto: 1500, tipo: 'gasto', nombre: 'Comida', categoryId: 20 })
    ];

    const result = analyzer.analyzeHealth({ transactions, budgets: [], now: NOW });

    expect(result.level.key).toBe('danger');
    expect(result.level.label).toBe('Rojo');
    expect(result.totals.saldo).toBe(-500);
    expect(result.score).toBeLessThan(50);
  });

  it('expone las 4 sub-metricas con la direccion correcta del score', () => {
    // Caso 1: tasa de ahorro buena -> savingRate refleja ahorro positivo
    const sano = analyzer.analyzeHealth({
      transactions: [
        tx({ fecha: '2026-05-10', monto: 4000, tipo: 'ingreso', categoryId: 10 }),
        tx({ fecha: '2026-05-12', monto: 1000, tipo: 'gasto', categoryId: 20 })
      ],
      budgets: [],
      now: NOW
    });
    // Caso 2: tasa de ahorro pobre -> savingRate refleja ahorro casi nulo
    const ajustado = analyzer.analyzeHealth({
      transactions: [
        tx({ fecha: '2026-05-10', monto: 1000, tipo: 'ingreso', categoryId: 10 }),
        tx({ fecha: '2026-05-12', monto: 950, tipo: 'gasto', categoryId: 20 })
      ],
      budgets: [],
      now: NOW
    });

    // Ambos perfiles tienen las cuatro metricas presentes (budgetOvershootRel null porque no hay presupuestos).
    for (const result of [sano, ajustado]) {
      expect(result.metrics).toHaveProperty('savingRate');
      expect(result.metrics).toHaveProperty('expenseRatio');
      expect(result.metrics).toHaveProperty('budgetOvershootRel');
      expect(result.metrics).toHaveProperty('debtLoad');
    }

    // Mejor tasa de ahorro -> mejor score (peso 40%, el mas alto).
    expect(sano.metrics.savingRate).toBeGreaterThan(ajustado.metrics.savingRate);
    expect(sano.score).toBeGreaterThan(ajustado.score);
  });

  it('detecta categorias de "deuda" por nombre y eleva la metrica debtLoad', () => {
    const sinDeuda = analyzer.analyzeHealth({
      transactions: [
        tx({ fecha: '2026-05-10', monto: 1000, tipo: 'ingreso', categoryId: 10 }),
        tx({ fecha: '2026-05-12', monto: 400, tipo: 'gasto', nombre: 'Comida', categoryId: 20 })
      ],
      budgets: [],
      now: NOW
    });
    const conDeudaAlta = analyzer.analyzeHealth({
      transactions: [
        tx({ fecha: '2026-05-10', monto: 1000, tipo: 'ingreso', categoryId: 10 }),
        // Nombre con la palabra "Tarjeta" -> matchea el regex de deuda.
        tx({ fecha: '2026-05-12', monto: 400, tipo: 'gasto', nombre: 'Tarjeta credito', categoryId: 21 })
      ],
      budgets: [],
      now: NOW
    });

    expect(sinDeuda.metrics.debtLoad).toBe(0);
    expect(conDeudaAlta.metrics.debtLoad).toBeCloseTo(0.4, 5); // 400 / 1000
  });

  it('sin presupuestos: budgetOvershootRel es null y el peso del 20% se redistribuye', () => {
    // Perfil identico salvo por la ausencia de presupuestos: la metrica debe quedar null
    // y el score debe seguir siendo computable (no NaN).
    const transactions = [
      tx({ fecha: '2026-05-10', monto: 5000, tipo: 'ingreso', categoryId: 10 }),
      tx({ fecha: '2026-05-12', monto: 2000, tipo: 'gasto', categoryId: 20 })
    ];

    const result = analyzer.analyzeHealth({ transactions, budgets: [], now: NOW });

    expect(result.metrics.budgetOvershootRel).toBeNull();
    expect(result.score).not.toBeNaN();
    // Score esperado: (100*0.4 + 100*0.3 + 100*0.1) / 0.8 = 100. Confirma redistribucion.
    expect(result.score).toBe(100);
  });

  it('presupuesto superado en >10% deteriora el score frente al mismo gasto dentro del presupuesto', () => {
    const transactions = [
      tx({ fecha: '2026-05-10', monto: 5000, tipo: 'ingreso', categoryId: 10 }),
      tx({ fecha: '2026-05-12', monto: 2000, tipo: 'gasto', categoryId: 20 })
    ];

    const dentro = analyzer.analyzeHealth({
      transactions,
      budgets: [budget({ mes: 5, anio: 2026, montoMensual: 2500, categoryId: 20 })],
      now: NOW
    });
    const sobregirado = analyzer.analyzeHealth({
      transactions,
      budgets: [budget({ mes: 5, anio: 2026, montoMensual: 1000, categoryId: 20 })],
      now: NOW
    });

    // Sobregirado: extra = 1000, sumBudget = 1000 -> overshootRel = 1 (100%)
    expect(sobregirado.metrics.budgetOvershootRel).toBeGreaterThan(0.1);
    // Score con sobregiro tiene que ser menor que con presupuesto cumplido.
    expect(sobregirado.score).toBeLessThan(dentro.score);
  });
});
