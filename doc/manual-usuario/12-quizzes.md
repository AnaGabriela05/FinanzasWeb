# Capítulo 12. Quizzes y sistema de puntos

## Texto narrativo (para pegar en el .docx)

El sistema de quizzes es la parte lúdica del Módulo de Aprendizaje. Cada video del catálogo viene acompañado de un breve cuestionario con preguntas de opción múltiple. Responder correctamente te da puntos, los puntos te suben de **nivel** y los niveles te dan reconocimiento visible dentro del sistema.

### 12.1 Catálogo de preguntas

AhorroGo distribuye **72 preguntas** distribuidas en **9 videos** del módulo de aprendizaje (8 preguntas por video). Cada pregunta tiene un nivel de dificultad: **fácil**, **media** o **difícil**. La distribución estándar por video es 3 fáciles + 3 medias + 2 difíciles, aunque puede variar ligeramente.

Cuando inicias un quiz, el servidor selecciona **5 preguntas aleatorias** del video correspondiente. Es decir, los quizzes son **aleatorios dentro de cada video**, por lo que dos intentos sobre el mismo video pueden tener preguntas distintas. Las opciones se etiquetan A, B, C y D, y cada pregunta trae una explicación que se muestra al final.

> **Aclaración respecto a la plantilla.** El proyecto en su versión actual organiza las 72 preguntas en **9 videos** y **3 niveles de dificultad por pregunta**. La separación en "5 niveles" mencionada en la plantilla del manual corresponde a los **rangos de nivel del usuario** (Aprendiz, Explorador, Conocedor, Experto, Maestro), no a la distribución de preguntas. Se detalla la equivalencia más abajo.

### 12.2 Cómo se toma un quiz

Desde la pestaña **Mi progreso** o desde la pestaña **Videos educativos** verás botones del tipo **🎯 Tomar quiz** asociados a cada video. Al pulsarlo se abre el modal **"Quiz: [Título del video]"** que sigue cuatro fases:

1. **Loading.** Aparecen esqueletos animados mientras se cargan las preguntas.
2. **Active.** Pregunta por pregunta. La cabecera muestra **"Pregunta X de Y"** y, en el lado derecho, el nivel de dificultad de la pregunta actual. Debajo del título se ve una barra de progreso. Las cuatro opciones se muestran como botones con su letra (A, B, C, D) en un círculo y el texto a continuación. La opción seleccionada queda resaltada con borde teal. Al pie hay dos botones: **Cancelar** (secundario) y **Siguiente pregunta** (que pasa a **Finalizar quiz** en la última pregunta).
3. **Submitting.** Tras pulsar **Finalizar quiz** aparece el mensaje **"Calificando tus respuestas..."** con un spinner mientras el backend evalúa.
4. **Done.** Se muestra el resultado.

En la fase **Done** ves:

- Si subiste de nivel, un banner colorizado tipo **"¡Subiste al nivel Explorador! 🚀"**.
- Tu puntuación en grande, con formato **"75 / 100"** (cada respuesta correcta vale 20 puntos; cinco preguntas × 20 = máximo 100 por quiz).
- Un emoji y mensaje según el puntaje:
  - 100: **"🎉 ¡Perfecto! Conoces el tema al detalle."**
  - 80 o más: **"👏 ¡Muy bien! Tienes un buen dominio."**
  - 60 o más: **"💪 Bien, pero hay espacio para mejorar."**
  - Menos de 60: **"📖 Te recomendamos revisar el video nuevamente."**
- Una línea de detalle con las correctas, la duración y la etiqueta **"Primer intento (cuenta para tu nivel)"** o **"Reintento (no suma)"**.
- Un badge con tus **"Puntos totales"** y otro con tu nivel actual.
- Un botón colapsable **"▼ Ver detalle de respuestas"** que despliega, pregunta por pregunta, tu elección, la respuesta correcta y la explicación. Las respuestas correctas se ven en verde y las incorrectas en rojo.

Finalmente puedes pulsar **Reintentar quiz** (vuelve a abrir el mismo quiz) o **Volver a videos** (cierra el modal).

### 12.3 Sistema de puntos

- Cada **respuesta correcta vale 20 puntos**.
- Cada quiz puede dar como máximo **100 puntos** (5 × 20).
- **Solo el primer intento de cada video** suma puntos al total oficial. Los reintentos son útiles para mejorar tu comprensión o tu "mejor puntaje histórico" del video, pero no incrementan tu puntaje acumulado.
- No hay límite de intentos por video.

### 12.4 Niveles de usuario (rangos)

A medida que sumas puntos en tus primeros intentos, AhorroGo te asigna automáticamente un rango. Hay cinco niveles:

| Nivel | Icono | Rango de puntos | Color |
|-------|-------|-----------------|-------|
| **Aprendiz** | 🌱 | 0 – 199 | Gris (slate) |
| **Explorador** | 🚀 | 200 – 499 | Verde |
| **Conocedor** | 💎 | 500 – 999 | Teal |
| **Experto** | 🏆 | 1.000 – 1.999 | Ámbar |
| **Maestro** | 👑 | 2.000 o más | Naranja |

El rango se ve en el badge del encabezado del Módulo de Aprendizaje y en la tarjeta principal de la pestaña **Mi progreso**.

### 12.5 Pestaña "Mi progreso"

Esta pestaña concentra tu avance:

- **Encabezado** "Tu progreso de aprendizaje" con una frase que recuerda que solo el primer intento cuenta.
- **Insignia de nivel grande** con el icono, el nombre, el color del nivel y los puntos acumulados. Debajo, una barra de progreso muestra cuánto te falta para el siguiente nivel y aparece un texto como **"Faltan Y pts para 🚀 Explorador"** o **"Nivel máximo alcanzado 🎉"** cuando ya eres Maestro.
- **Cuatro KPIs** con etiquetas: **"Puntos totales"**, **"Quizzes completados"**, **"Promedio aciertos"** y **"Quizzes perfectos"**.
- **Próximos pasos.** Hasta tres tarjetas con videos que aún no tienen quiz completado y su botón **🎯 Tomar quiz**.
- **Listado de niveles** que recapitula los cinco rangos con sus umbrales, para que veas qué te falta para subir.
- **Historial de intentos.** Lista paginada con los más recientes primero, mostrando el video, el puntaje, el número de intento, la fecha relativa y un icono según el resultado (🏆 si fue 100, 👍 si fue 80+, 📖 si fue menor).

### 12.6 Cómo se guarda y cómo se contabiliza

Por debajo, cuando finalizas un quiz, el backend guarda en transacción un registro de **QuizAttempt** con tu puntaje, duración y fecha, junto con los detalles individuales en **QuizAnswer** (qué opción elegiste y cuánto tiempo te tomó por pregunta). El servicio detecta si es tu primer intento sobre ese video para marcar si "cuenta para tu nivel".

## Lista de capturas a tomar

### CAPTURA U-23
- **Pantalla:** `/learning?tab=progress` (pestaña **Mi progreso**) con datos visibles.
- **Cuenta a usar:** `demo@correo.com`.
- **Estado previo necesario:**
  - Iniciar sesión con la cuenta demo.
  - Asegurarse de que la cuenta tenga al menos 3 quizzes completados, idealmente con un puntaje acumulado que la ubique en un nivel intermedio (por ejemplo Explorador o Conocedor) para que se vea bien la barra de progreso hacia el siguiente nivel.
- **Qué debe estar visible:**
  - Encabezado **"Tu progreso de aprendizaje"** y subtítulo.
  - Insignia grande de nivel actual con icono, nombre, puntos acumulados y barra de progreso al siguiente nivel ("Faltan X pts para 💎 Conocedor", por ejemplo).
  - Las cuatro tarjetas KPI: **Puntos totales**, **Quizzes completados**, **Promedio aciertos**, **Quizzes perfectos**.
  - Sección **"Próximos pasos"** con al menos una o dos tarjetas de videos pendientes y su botón **🎯 Tomar quiz**.
- **Qué NO debe aparecer:**
  - Modal de quiz abierto.
- **Resolución y formato:**
  - 1440x900 mínimo, PNG, en idioma español.
- **Notas adicionales:**
  - Si la cuenta demo aún no tiene intentos, ejecuta al menos tres quizzes con respuestas correctas antes de la captura.

### CAPTURA U-24
- **Pantalla:** Modal de quiz en la fase **"Done"** mostrando el resultado.
- **Cuenta a usar:** `demo@correo.com`.
- **Estado previo necesario:**
  - Tomar un quiz sobre un video que la cuenta demo aún no haya completado para que aparezca la etiqueta **"Primer intento (cuenta para tu nivel)"** y, si la cuenta está cerca del umbral del siguiente nivel, eventualmente el banner de subida de nivel.
  - Responder las cinco preguntas, idealmente acertando al menos cuatro, para que el puntaje muestre 80 o 100.
- **Qué debe estar visible:**
  - Modal con el título **"Quiz: [Título del video]"**.
  - Puntuación grande (por ejemplo **"80 / 100"**).
  - Emoji y mensaje de feedback ("👏 ¡Muy bien! Tienes un buen dominio.", o el equivalente al puntaje obtenido).
  - Línea con el detalle de correctas, duración y etiqueta de intento.
  - Badge con **"Puntos totales"** y badge del nivel actual.
  - Botón **"▼ Ver detalle de respuestas"**.
  - Botones finales **Reintentar quiz** y **Volver a videos**.
- **Qué NO debe aparecer:**
  - Spinner de "Calificando tus respuestas..." (la captura debe ser de la fase Done, no Submitting).
- **Resolución y formato:**
  - 1440x900 mínimo, PNG, en idioma español.
- **Notas adicionales:**
  - Si la cuenta demo está cerca del umbral, intenta que el banner **"¡Subiste al nivel ...!"** aparezca para reforzar la captura, pero si no se da, basta con el resultado.
