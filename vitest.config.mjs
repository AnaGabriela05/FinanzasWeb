// Vitest config para AhorroGo.
// El proyecto es CommonJS ("type": "commonjs"), por eso este archivo es .mjs
// y usa `export default` (ESM) para evitar el error de carga de configuracion.
export default {
  test: {
    environment: 'node',
    globals: true,
    include: ['tests/unit/**/*.test.js']
  }
};
