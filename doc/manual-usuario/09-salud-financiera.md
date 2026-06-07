# Capítulo 9. Salud Financiera

## Texto narrativo (para pegar en el .docx)

La **Salud Financiera** es el indicador que AhorroGo utiliza para resumir, de un solo vistazo, qué tan ordenado va tu manejo del dinero. Aparece en el Dashboard como una tarjeta destacada y combina cuatro métricas en un puntaje del 0 al 100 con un nivel de color (rojo, amarillo, verde o "sin datos").

### 9.1 Qué se analiza y en qué ventana

El cálculo siempre se hace sobre los **últimos 90 días**. Aunque el módulo Reportes te permita filtrar otros rangos, la salud financiera no se ajusta: trabaja con un periodo fijo para que el indicador sea estable y comparable entre usuarios.

Las cuatro métricas que la componen son:

- **Tasa de ahorro** (peso 40 % del puntaje). Mide qué proporción de tus ingresos del periodo te queda después de los gastos.
- **Relación gasto / ingreso** (30 %). Indica qué tan apretado está tu mes: cuanto más cerca del 100 %, más presión.
- **Desfase vs presupuesto** (20 %). Compara los gastos reales contra los presupuestos activos en categorías con presupuesto definido. Si no tienes presupuestos, este componente se excluye y el 20 % se reparte proporcionalmente entre los otros tres.
- **Carga de deuda** (10 %). Aproxima qué porcentaje de tus ingresos se va a categorías que parecen ser deudas. AhorroGo identifica esas categorías por el nombre, buscando palabras como "deuda", "crédito", "tarjeta", "préstamo" o "cuota".

Cada métrica se traduce internamente a un puntaje parcial siguiendo umbrales escalonados, luego se combinan ponderadamente y el resultado final se redondea al entero más cercano entre 0 y 100.

### 9.2 Niveles y descripciones

El puntaje y otras señales determinan a qué **nivel** perteneces, que se muestra como una etiqueta de color y un título descriptivo:

| Nivel | Etiqueta | Título | Cuándo aparece |
|-------|----------|--------|----------------|
| Rojo | "Rojo" | **"Atencion inmediata"** | Cuando los gastos superan los ingresos, el saldo es negativo o el puntaje queda por debajo de 50. |
| Amarillo | "Amarillo" | **"Zona de cuidado"** | Cuando el puntaje queda por debajo de 75 o los gastos representan al menos el 90 % de los ingresos. |
| Verde | "Verde" | **"Buen equilibrio"** | Cuando los ingresos sostienen bien los gastos y el saldo es positivo. |
| Sin datos | "Sin datos" | **"Aun no podemos evaluar tu salud financiera"** | Cuando todavía no hay ingresos ni gastos en los últimos 90 días. |

Cada nivel viene acompañado de una descripción explicativa que aparece bajo el título de la tarjeta:

- **Rojo:** "Tus gastos estan superando lo saludable para tu nivel de ingresos."
- **Amarillo:** "Tus gastos estan cerca de tus ingresos. Conviene vigilar el margen."
- **Verde:** "Tus ingresos sostienen bien tus gastos y mantienes saldo positivo."
- **Sin datos:** "Registra al menos un movimiento en los ultimos 90 dias para activar el indicador."

### 9.3 Cómo lo ves en la pantalla

En el Dashboard la tarjeta de **Salud financiera** ocupa un lugar destacado. Muestra:

- El título y la descripción del nivel.
- Una etiqueta de color (Rojo, Amarillo, Verde o "Sin datos").
- El puntaje del 0 al 100 (o **"—"** cuando aún no aplica).
- Una **barra de progreso** que rellena la fracción correspondiente al puntaje.
- Las cuatro métricas con etiquetas exactas: **"Tasa de ahorro"**, **"Gastos / ingresos"**, **"Desfase vs presupuesto"** y **"Carga de deuda"**. Cuando una métrica no aplica, AhorroGo muestra textos transparentes como **"Sin ingresos"** o **"— sin presupuestos"** en lugar de inventar un valor.
- El pie de la tarjeta indica **"Analisis de los ultimos 90 dias (AAAA-MM-DD a AAAA-MM-DD)."**.
- Un botón final cuyo texto cambia con el nivel: **"💡 Ver consejos personalizados"** (rojo o amarillo), **"💡 Consejos para mantener tu salud"** (verde) o **"💡 Cómo empezar a controlar tus finanzas"** (sin datos). Pulsándolo se abre el módulo de consejos IA (Capítulo 11).

### 9.4 Cómo mejorar tu puntaje

Como referencia rápida, esto es lo que mueve la aguja:

- **Aumenta tu tasa de ahorro.** Si pasa del 20 % de tus ingresos, esa métrica suma al puntaje máximo en su categoría.
- **Mantén la relación gasto/ingreso por debajo del 80 %.** Cuando supera el 95 % pierde puntos rápidamente.
- **Cumple los presupuestos.** Quedar dentro del límite (sin desfase) suma al máximo; superar el 10 % del presupuesto resta.
- **Modera la carga de deuda.** Que las cuotas de deuda no superen el 10 % de tus ingresos optimiza esta métrica.

Como AhorroGo solo mira los últimos 90 días, los esfuerzos recientes se reflejan rápidamente en el indicador. Aprovecha el botón de **consejos personalizados** para que el módulo de IA te sugiera acciones concretas en función de tu nivel actual.

## Lista de capturas a tomar

### CAPTURA U-18
- **Pantalla:** `/dashboard` con la tarjeta de **Salud financiera** en primer plano.
- **Cuenta a usar:** `demo@correo.com`.
- **Estado previo necesario:**
  - La cuenta demo debe tener actividad de los últimos 90 días suficiente para que el indicador esté en nivel **amarillo** o **verde**, con las cuatro métricas calculadas (idealmente con presupuestos activos para que **"Desfase vs presupuesto"** muestre un porcentaje real en vez de "— sin presupuestos").
  - Refrescar el Dashboard para que las tarjetas terminen de cargar.
- **Qué debe estar visible:**
  - Encabezado del Dashboard con el saludo y subtítulo.
  - Tarjeta de **Salud financiera** completa: título de nivel (por ejemplo "Zona de cuidado"), descripción, puntaje numérico, barra de progreso, las cuatro métricas con valores reales y el botón **"💡 Ver consejos personalizados"** (o el texto correspondiente al nivel mostrado).
- **Qué NO debe aparecer:**
  - Modal de consejos IA abierto (el botón debe verse, pero no estar pulsado).
- **Resolución y formato:**
  - 1440x900 mínimo, PNG, en idioma español.
- **Notas adicionales:**
  - Si la cuenta demo no genera todas las métricas con datos, considera registrar un par de transacciones y al menos un presupuesto antes de capturar para que ninguna métrica se muestre como "— sin presupuestos" o "Sin ingresos".
