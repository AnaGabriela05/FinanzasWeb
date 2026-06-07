# Capítulo 3. Recorrido por el Dashboard

## Texto narrativo (para pegar en el .docx)

El Dashboard es la pantalla principal del rol usuario. Concentra en una sola vista los indicadores clave de los últimos 90 días: cuánto ingresaste, cuánto gastaste, cómo está tu salud financiera y cuántos movimientos has registrado. Aquí también encontrarás un acceso rápido para crear una nueva transacción y un panel resumen del Módulo de Aprendizaje.

### 3.1 Encabezado y saludo

La parte superior del Dashboard te recibe con un saludo personalizado: **"Hola, [tu nombre]"**, y debajo el subtítulo **"Resumen de tus finanzas en los últimos 90 días"**. A la derecha hay un botón primario **"Nueva transacción"** que te lleva directamente al módulo de Transacciones (`/transactions?nueva=1`) con el formulario de creación ya abierto.

### 3.2 Tarjetas de métricas

El Dashboard organiza la información en una **grilla de seis tarjetas** con el mismo formato visual (etiqueta, valor destacado, descripción):

- **Ingresos.** Total acumulado de movimientos en categorías de tipo ingreso dentro del periodo analizado. Descripción: "Total del periodo analizado.".
- **Gastos.** Suma de movimientos en categorías de tipo gasto. Descripción: "Suma de movimientos en categorias de gasto.".
- **Saldo.** Resultado de restar gastos a ingresos. Descripción: "Diferencia entre ingresos y gastos del periodo.".
- **Categorias.** Número de categorías visibles en tu sesión actual (incluye globales y personales). Descripción: "Categorias visibles para tu sesion.".
- **Metodos de pago.** Cantidad de métodos de pago activos asociados a tu cuenta. Descripción: "Metodos activos asociados a tu cuenta.".
- **Movimientos analizados.** Cantidad de transacciones consideradas en el período. Descripción: "Transacciones consideradas en el periodo.".

Todos los montos están en soles peruanos y se muestran con el formato local **"S/ 1,234.00"**. Si aún no has registrado nada, los importes aparecen en **0** y los conteos en **0** sin marcar error: simplemente todavía no hay datos.

### 3.3 Tarjeta de Salud Financiera

A la derecha (o debajo en pantallas pequeñas) hay una **tarjeta especial de Salud Financiera** que resume tu situación con un puntaje y un nivel de color. Esta tarjeta es la que más vale la pena entender:

- **Etiqueta:** "Salud financiera".
- **Título de nivel.** Cambia según el estado: "Atencion inmediata" (rojo), "Zona de cuidado" (amarillo), "Buen equilibrio" (verde) o "Aun no podemos evaluar tu salud financiera" (neutral, cuando aún no hay movimientos).
- **Descripción** breve explicando el porqué del nivel.
- **Puntaje.** Un número del 0 al 100 acompañado de la etiqueta de color (Rojo, Amarillo, Verde o "Sin datos"). El cálculo detallado y los umbrales se explican en el Capítulo 9.
- **Barra de progreso** que rellena el porcentaje correspondiente al puntaje.
- **Cuatro métricas** con etiquetas exactas: **"Tasa de ahorro"**, **"Gastos / ingresos"**, **"Desfase vs presupuesto"** y **"Carga de deuda"**. Cuando un dato no aplica (por ejemplo, no hay ingresos en el periodo) aparece **"Sin ingresos"** o, en el caso de presupuestos, **"— sin presupuestos"**.
- **Nota de rango.** "Analisis de los ultimos 90 dias (AAAA-MM-DD a AAAA-MM-DD)."
- **Botón de consejo.** El texto del botón cambia con el nivel: **"💡 Ver consejos personalizados"** cuando estás en rojo o amarillo, **"💡 Consejos para mantener tu salud"** en verde, y **"💡 Cómo empezar a controlar tus finanzas"** cuando no hay datos. Al pulsarlo se abre el módulo de consejos IA (Capítulo 11).

### 3.4 Progreso de aprendizaje

Si ya completaste algún quiz, debajo del bloque principal aparece una tarjeta **"Mi progreso de aprendizaje"** con tu nivel actual (Aprendiz, Explorador, Conocedor, Experto o Maestro) y un botón **"Ver mi progreso →"** que te lleva al Módulo de Aprendizaje en la pestaña **"Mi progreso"** (Capítulo 12).

### 3.5 Cuando algo va mal

- Mientras el Dashboard pide los datos al servidor verás esqueletos grises (skeletons) en lugar de las tarjetas. Es un estado breve y normal.
- Si la carga falla aparece el bloque **"No se pudo cargar el dashboard"** con el detalle del error. Lo más habitual es que el servidor no esté disponible o que tu sesión haya expirado (recuerda que el token vive 8 horas); en ese segundo caso, volver a iniciar sesión soluciona el problema.

## Lista de capturas a tomar

### CAPTURA U-05
- **Pantalla:** `/dashboard` (vista completa del Dashboard).
- **Cuenta a usar:** `demo@correo.com`.
- **Estado previo necesario:**
  - Iniciar sesión con la cuenta de demostración para que se carguen los datos sintéticos.
  - Esperar a que terminen de cargarse las seis tarjetas y la tarjeta de Salud Financiera (sin skeletons visibles).
- **Qué debe estar visible:**
  - Encabezado **"Hola, [nombre demo]"** y el subtítulo **"Resumen de tus finanzas en los últimos 90 días"**.
  - Botón **"Nueva transacción"** en la esquina derecha.
  - Las seis tarjetas de métricas con valores reales (Ingresos, Gastos, Saldo, Categorias, Metodos de pago, Movimientos analizados).
  - Tarjeta de **Salud financiera** con su título, descripción, puntaje, barra de progreso, las cuatro métricas y el botón de consejo.
  - Barra superior con la marca **AhorroGo** y el menú con la opción **Dashboard** marcada como activa.
- **Qué NO debe aparecer:**
  - Notificaciones (toasts) abiertas.
  - Modales abiertos.
  - Skeletons o estados de carga.
- **Resolución y formato:**
  - 1440x900 mínimo, PNG, en idioma español.
- **Notas adicionales:**
  - Asegúrate de que el menú principal esté contraído (sin el menú hamburguesa abierto en mobile) y que el botón **Salir** sea visible al extremo derecho.

### CAPTURA U-06
- **Pantalla:** `/dashboard` con foco en la **tarjeta de Salud Financiera**.
- **Cuenta a usar:** `demo@correo.com`.
- **Estado previo necesario:**
  - Misma sesión del Capítulo 3.
  - Idealmente la cuenta demo debe estar en un nivel **amarillo o verde** para mostrar un caso "interesante" con métricas calculadas.
- **Qué debe estar visible:**
  - La tarjeta de Salud Financiera con título de nivel, descripción, puntaje numérico, etiqueta de color (Rojo/Amarillo/Verde), barra de progreso, las cuatro métricas (Tasa de ahorro, Gastos / ingresos, Desfase vs presupuesto, Carga de deuda), la nota del rango de 90 días y el botón **"💡 Ver consejos personalizados"** (o el texto que corresponda al nivel).
- **Qué NO debe aparecer:**
  - El modal de consejos abierto.
- **Resolución y formato:**
  - 1440x900 mínimo, PNG, en idioma español.
- **Notas adicionales:**
  - Si tu pantalla es ancha puedes recortar la captura a la tarjeta para hacerla más legible en el manual, pero conserva siempre el contexto del encabezado del Dashboard arriba.
