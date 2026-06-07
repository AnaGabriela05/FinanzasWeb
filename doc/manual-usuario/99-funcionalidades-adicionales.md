# Funcionalidades adicionales detectadas y discrepancias con la plantilla

Este archivo documenta los hallazgos hechos al revisar el código que no estaban contemplados en la plantilla del manual o que difieren ligeramente de lo asumido por ella. Sirve como punto de decisión para una próxima revisión.

## Funcionalidades adicionales detectadas

Las siguientes funciones existen en el código pero no aparecen como capítulos propios en la plantilla. Quedan aquí listadas para que el responsable del manual decida si conviene añadirlas o no.

### 1. Notas y checklist por video en Aprendizaje
El modal de cada video del Módulo de Aprendizaje (`VideoModal`) ofrece tres sub-pestañas: **Puntos clave**, **Mis notas** y **Checklist**. La pestaña **Mis notas** soporta texto libre con guardado automático (debounce 600 ms), botón **Copiar** al portapapeles, botón **Descargar .txt** y un límite de 8000 caracteres por video. La pestaña **Checklist** permite crear/marcar/eliminar tareas. Todo se persiste por usuario y por `videoId` mediante el endpoint `GET/PUT /api/learning/:videoId/state`.

Está cubierto en el Capítulo 10, pero podría merecer una sección destacada con su propia captura si se quiere resaltar esta funcionalidad personal.

### 2. KPIs del asesor IA y filtros por tipo
Más allá del botón "Generar consejo", la pestaña **Mi asesor IA** expone cuatro tarjetas KPI (**Total recibidos**, **Último consejo**, **Tipo más frecuente**, **Próxima regeneración**) y filtros por tipo (**Todos / Ahorro / Presupuesto / Gasto / Deuda**) sobre el historial paginado. La plantilla no menciona estos detalles; quedaron cubiertos en el Capítulo 11 con la captura U-22.

### 3. Página Auditoría limitada a exportaciones
La pantalla **Auditoría** del panel administrativo solo registra **exportaciones de reportes** (tabla `ExportLog`). No hay una bitácora persistente separada para acciones administrativas (bloqueos de usuarios, cambios en categorías globales, etc.). Esto se mencionó en el Capítulo 18 y conviene aclararlo en la versión final del manual para no generar expectativas equivocadas.

### 4. Conversión de moneda PEN/USD en transacciones
El módulo de Transacciones permite registrar movimientos en dólares y muestra la equivalencia aproximada en soles bajo el campo Monto. La tasa por defecto es 3.75 PEN/USD pero se obtiene del endpoint `/api/config/currency`, configurable vía la variable `EXCHANGE_USD_TO_PEN`. Esta funcionalidad está cubierta en el Capítulo 6 con U-13.

### 5. Política de bloqueo de cuentas y rate limiting
El sistema aplica dos capas de protección contra fuerza bruta: bloqueo por usuario (3 intentos / 10 minutos) y rate limit por IP (10 intentos / 15 minutos sobre `/api/auth/*`). Documentado en los capítulos 2 y 13.

### 6. Endpoint público de configuración de moneda
Existe `GET /api/config/currency` sin autenticación que devuelve la moneda base, las soportadas y la tasa. No tiene UI propia (es consumido al cargar la SPA), pero conviene saberlo si en algún momento se quiere documentar la integración técnica.

### 7. Modo MOCK vs OpenAI explícito
El servicio de consejos elige automáticamente entre `OpenAiAdvisor` y `MockAdvisor` según exista o no la variable `OPENAI_API_KEY`. En ambos casos la UI es idéntica. Documentado en el Capítulo 11.

### 8. Mensajes empty-state explícitos para preview admin
La preview que ve el administrador en `/admin/preview/dashboard` muestra el mensaje **"Estado inicial vacío. Así verá esta pantalla un usuario recién registrado."** cuando no hay datos. Documentado en el Capítulo 19.

---

## Discrepancias con la plantilla

### D-1. "5 niveles" para las preguntas vs. para los usuarios
La plantilla del manual menciona "72 preguntas distribuidas en 5 niveles". El código real organiza las **72 preguntas en 9 videos** (8 preguntas cada uno) con **tres niveles de dificultad por pregunta**: `facil`, `media`, `dificil`. Los **5 niveles** del sistema corresponden a los **rangos del usuario** según puntos acumulados (Aprendiz → Explorador → Conocedor → Experto → Maestro), no a la distribución de las preguntas. El Capítulo 12 lo aclara explícitamente.

### D-2. Rangos del usuario diferentes a los asumidos
La plantilla menciona el sistema "Aprendiz → Aficionado → Experto → Maestro". El código define cinco rangos con nombres distintos:

- **Aprendiz** (0–199 pts, 🌱)
- **Explorador** (200–499 pts, 🚀)
- **Conocedor** (500–999 pts, 💎)
- **Experto** (1.000–1.999 pts, 🏆)
- **Maestro** (2.000+ pts, 👑)

Recomiendo actualizar el cuerpo del manual para usar los nombres reales del sistema.

### D-3. "Marcar consejo como aplicado"
La plantilla sugiere documentar la acción de "marcar como aplicado" para los consejos IA. En la versión actual del código **esa acción no existe**: los consejos se guardan, se filtran y se regeneran cada 7 días, pero no hay un toggle para marcarlos como hechos. Recomiendo o bien quitar esa mención de la plantilla, o bien dejarla como funcionalidad futura.

### D-4. Acceso a "Salud Financiera" desde su propio capítulo
La plantilla incluye "Salud Financiera" (Capítulo 9) como bloque independiente. En el código, este indicador **vive físicamente dentro del Dashboard** (`/dashboard`) y no tiene una ruta propia. La captura U-18 sale del Dashboard. El texto del Capítulo 9 lo aclara para evitar confusión.

### D-5. Cantidad de preguntas por intento
La plantilla no especifica el número de preguntas por intento; el código fija **5 preguntas aleatorias por quiz**, no las 8 totales del video. Se cubre en el Capítulo 12.

### D-6. Botón "Generar consejo" vs "Generar nuevos consejos"
La plantilla menciona un botón "Generar consejo". El texto exacto en el frontend es **"🔄 Generar nuevos consejos"** (genera hasta cinco a la vez, no uno). Se documentó textualmente en el Capítulo 11.

### D-7. Selección de la moneda y formato del monto
La plantilla no detalla la posibilidad de registrar transacciones en USD. El frontend ofrece esta opción con conversión visual. Documentado en el Capítulo 6 (U-13).

---

## Resumen

| Tipo | Cantidad |
|------|----------|
| Funcionalidades adicionales detectadas | 8 |
| Discrepancias con la plantilla | 7 |

Estas notas no requieren intervención en el código del sistema; son ajustes a considerar en la próxima revisión del manual académico para que la documentación quede perfectamente alineada con la implementación.
