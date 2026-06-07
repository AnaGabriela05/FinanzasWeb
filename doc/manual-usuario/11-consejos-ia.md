# Capítulo 11. Consejos IA personalizados

## Texto narrativo (para pegar en el .docx)

Dentro del Módulo de Aprendizaje encontrarás la pestaña **Mi asesor IA**, que es donde AhorroGo te entrega **consejos personalizados** basados en tu actividad financiera de los últimos 90 días. A diferencia de los videos, este contenido no es estático: se genera dinámicamente para tu cuenta y se enfoca en cuatro temas: ahorro, presupuesto, gasto y deuda.

### 11.1 Cómo se genera un consejo

AhorroGo combina dos motores en el backend:

- **Modo IA real (OpenAI):** si el servidor tiene configurada una clave de OpenAI (`OPENAI_API_KEY`), los consejos se generan con el modelo `gpt-4o-mini`. El prompt incluye tu nivel de salud financiera, tu puntaje y las cuatro métricas que se calculan en el Dashboard. El modelo responde con un JSON estructurado que el sistema valida y guarda como hasta cinco consejos individuales.
- **Modo MOCK (predeterminado):** si no hay clave de OpenAI configurada, el sistema usa una **biblioteca interna de consejos predefinidos** segmentados por nivel de salud financiera (rojo, amarillo, verde, neutral). El usuario no percibe la diferencia en términos de interfaz; cada consejo aparece con el mismo formato y etiquetas. La ventaja del modo MOCK es que el contenido siempre está disponible y no consume llamadas externas.

En ambos casos los consejos se guardan en la base de datos con tu identificador de usuario, su tipo (`ahorro`, `gasto`, `presupuesto` o `deuda`), el contenido y la fecha de generación. Cualquier consejo de menos de 7 días se considera **vigente** y vuelve a mostrarse al abrir la pestaña sin generar nuevos.

### 11.2 Pantalla principal del asesor

En la pestaña **Mi asesor IA** verás:

- **Encabezado** con el título **"Tu asesor financiero personal"** y el subtítulo **"Consejos personalizados basados en tu actividad financiera."**.
- **Botón principal "🔄 Generar nuevos consejos"** (esquina superior derecha). Al pulsarlo el botón pasa a mostrar **"Generando..."** mientras el servidor procesa la petición.
- **Cuatro tarjetas KPI** con un resumen:
  - **"Total recibidos"** → cantidad total de consejos que has acumulado.
  - **"Último consejo"** → fecha del consejo más reciente.
  - **"Tipo más frecuente"** → tipo con más apariciones en tu historial (Ahorro / Presupuesto / Gasto / Deuda).
  - **"Próxima regeneración"** → fecha estimada (por defecto cada 7 días) en la que se podrá generar un nuevo lote.

### 11.3 Bloque "Consejos actuales"

A continuación aparece la sección **"Consejos actuales"** con una grilla de tarjetas (hasta cinco) que muestran los consejos vigentes. Cada tarjeta de consejo (`AdviceCard`) trae:

- Un **badge de tipo** con un icono y color distintivo:
  - 💰 **Ahorro** — fondo teal.
  - 📊 **Presupuesto** — fondo verde.
  - ⚠️ **Gasto** — fondo amarillo.
  - 🔴 **Deuda** — fondo rojo.
- El **contenido** del consejo (hasta 800 caracteres).
- La **fecha relativa** ("hoy", "hace 1 día", "hace 4 días", etc.).

Cuando aún no tienes consejos generados aparece el texto **"Aún no tienes consejos generados."** acompañado del botón **"Generar mis primeros consejos"**, que llama al mismo flujo que el botón principal.

> **Tiempos de espera.** Si está activo el modo MOCK, la generación es casi instantánea. Con OpenAI, el tiempo varía entre unos pocos segundos y una decena, dependiendo de la latencia del servicio externo. Mientras tanto se ven placeholders animados en lugar de las tarjetas.

### 11.4 Bloque "Historial completo"

Más abajo encontrarás la sección **"Historial completo"** con todos los consejos guardados, ordenados por mes (formato YYYY-MM). Sobre el listado hay un grupo de chips de filtro: **Todos**, **Ahorro**, **Presupuesto**, **Gasto**, **Deuda**. Al hacer clic en uno se filtra el historial al tipo seleccionado.

Si tu historial es largo, al final del bloque aparece el botón **"Cargar más"** que pide la siguiente página al servidor.

### 11.5 Información adicional

Al pie del módulo se encuentra una sección colapsable titulada **"ℹ️ Cómo funciona tu asesor IA"** que explica con palabras sencillas que los consejos se basan en el análisis de los últimos 90 días, que el servidor se actualiza cada 7 días, que puedes regenerarlos manualmente cuando quieras y que tu información no se comparte con terceros más allá del análisis interno.

### 11.6 Limitaciones técnicas conocidas

- AhorroGo **no expone una acción "marcar como aplicado"** en esta versión del frontend. Los consejos se conservan en historial pero no se etiquetan como hechos o pendientes; corresponde al usuario actuar según su criterio.
- La generación está pensada para usuarios con datos suficientes. Si no tienes movimientos en los últimos 90 días, los consejos serán genéricos y orientados a empezar a registrar tu actividad.
- En modo MOCK, los consejos son los mismos para todos los usuarios del mismo nivel de salud financiera. En modo OpenAI, varían en cada generación.

## Lista de capturas a tomar

### CAPTURA U-21
- **Pantalla:** `/learning?tab=advice` (pestaña **Mi asesor IA**) con consejos vigentes.
- **Cuenta a usar:** `demo@correo.com`.
- **Estado previo necesario:**
  - Iniciar sesión con la cuenta demo y abrir el Módulo de Aprendizaje.
  - Cambiar a la pestaña **Mi asesor IA**.
  - Asegurarse de que existan al menos tres consejos vigentes. Si no es así, pulsar **🔄 Generar nuevos consejos** y esperar a que la sección "Consejos actuales" se llene.
- **Qué debe estar visible:**
  - Encabezado **"Tu asesor financiero personal"** y subtítulo "Consejos personalizados basados en tu actividad financiera.".
  - Botón **"🔄 Generar nuevos consejos"** en la esquina superior derecha.
  - Las cuatro tarjetas KPI con valores reales (Total recibidos, Último consejo, Tipo más frecuente, Próxima regeneración).
  - Sección **"Consejos actuales"** con tres a cinco tarjetas mostrando el badge de tipo (💰 Ahorro, 📊 Presupuesto, ⚠️ Gasto, 🔴 Deuda), el contenido completo y la fecha relativa.
- **Qué NO debe aparecer:**
  - Estado "Generando..." (la captura debe mostrar consejos ya generados, no el botón pulsado).
- **Resolución y formato:**
  - 1440x900 mínimo, PNG, en idioma español.
- **Notas adicionales:**
  - Si el entorno de pruebas usa OpenAI, no incluyas en la captura ninguna respuesta que mencione la clave o el modelo: solo los consejos finales.

### CAPTURA U-22
- **Pantalla:** `/learning?tab=advice` con la sección **"Historial completo"** visible y el filtro **"Ahorro"** aplicado.
- **Cuenta a usar:** `demo@correo.com`.
- **Estado previo necesario:**
  - Estando en la pestaña Mi asesor IA, haz scroll hasta la sección Historial completo.
  - Pulsa el chip **Ahorro** para filtrar.
- **Qué debe estar visible:**
  - Encabezado **"Historial completo"**.
  - Grupo de chips con los filtros **Todos**, **Ahorro** (resaltado como activo), **Presupuesto**, **Gasto** y **Deuda**.
  - Lista de tarjetas filtradas por tipo "Ahorro", agrupadas por mes (cabeceras tipo "2026-04", "2026-03").
  - Si corresponde, el botón **"Cargar más"** al final.
- **Qué NO debe aparecer:**
  - Tarjetas que no sean de tipo "Ahorro" (el filtro debe estar bien aplicado).
- **Resolución y formato:**
  - 1440x900 mínimo, PNG, en idioma español.
- **Notas adicionales:**
  - Si la cuenta demo no tiene suficiente historial de tipo "Ahorro", repite la generación de consejos varias veces o cambia el filtro al tipo con más datos para mostrar un ejemplo representativo. Documenta en la nota la elección del filtro.
