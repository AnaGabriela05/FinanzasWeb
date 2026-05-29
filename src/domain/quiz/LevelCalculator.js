/**
 * Calcula el nivel del usuario a partir de los puntos acumulados.
 * Los rangos estan basados en la suma de scores de PRIMEROS intentos.
 */

const LEVELS = [
  { nombre: 'Aprendiz',   minPoints: 0,    maxPoints: 199,         color: '#64748B', icono: '🌱' },
  { nombre: 'Explorador', minPoints: 200,  maxPoints: 499,         color: '#16A34A', icono: '🚀' },
  { nombre: 'Conocedor',  minPoints: 500,  maxPoints: 999,         color: '#0F766E', icono: '💎' },
  { nombre: 'Experto',    minPoints: 1000, maxPoints: 1999,        color: '#F59E0B', icono: '🏆' },
  { nombre: 'Maestro',    minPoints: 2000, maxPoints: Infinity,    color: '#D97706', icono: '👑' }
];

class LevelCalculator {
  /**
   * Retorna la lista completa de niveles (para visualizaciones).
   */
  getAllLevels() {
    return LEVELS.map((lvl) => ({
      nombre: lvl.nombre,
      minPoints: lvl.minPoints,
      maxPoints: Number.isFinite(lvl.maxPoints) ? lvl.maxPoints : null,
      color: lvl.color,
      icono: lvl.icono
    }));
  }

  /**
   * Retorna el nivel correspondiente a un puntaje acumulado.
   */
  getLevel(totalPoints) {
    const pts = Math.max(0, Number(totalPoints) || 0);
    const level = LEVELS.find((l) => pts >= l.minPoints && pts <= l.maxPoints) || LEVELS[0];
    const next = this.getNextLevel(pts);
    const span = Math.max(level.maxPoints - level.minPoints + 1, 1);
    const progresoAlSiguiente = Number.isFinite(level.maxPoints)
      ? Math.min(1, Math.max(0, (pts - level.minPoints) / span))
      : 1;

    return {
      nombre: level.nombre,
      minPoints: level.minPoints,
      maxPoints: Number.isFinite(level.maxPoints) ? level.maxPoints : null,
      color: level.color,
      icono: level.icono,
      progresoAlSiguiente,
      siguiente: next
    };
  }

  /**
   * Retorna el siguiente nivel y los puntos faltantes para alcanzarlo.
   */
  getNextLevel(totalPoints) {
    const pts = Math.max(0, Number(totalPoints) || 0);
    const idx = LEVELS.findIndex((l) => pts >= l.minPoints && pts <= l.maxPoints);
    if (idx === -1 || idx >= LEVELS.length - 1) return null;
    const next = LEVELS[idx + 1];
    return {
      nombre: next.nombre,
      color: next.color,
      icono: next.icono,
      minPoints: next.minPoints,
      puntosFaltantes: Math.max(0, next.minPoints - pts)
    };
  }
}

module.exports = LevelCalculator;
