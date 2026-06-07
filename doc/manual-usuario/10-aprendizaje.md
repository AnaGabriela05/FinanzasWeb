# Capítulo 10. Módulo de Aprendizaje

## Texto narrativo (para pegar en el .docx)

El **Módulo de Aprendizaje** complementa las funciones financieras con contenido educativo, un asesor de IA y un sistema de quizzes con niveles. Está pensado para que aprendas a interpretar tus números, evites errores comunes y refuerces tu cultura financiera con ejercicios prácticos. Se accede desde la opción **Aprendizaje** del menú principal o haciendo clic en el botón **"Ver mi progreso →"** que aparece en el Dashboard cuando ya tienes actividad.

### 10.1 Tres pestañas, tres propósitos

La pantalla `/learning` se organiza en **tres pestañas** (tabs) bien diferenciadas:

1. **Videos educativos.** El catálogo de contenido. Aquí encuentras los videos curados por el equipo de AhorroGo, organizados por tema. Cada video puede acompañarse de "puntos clave", un espacio personal para tus notas y un checklist con tareas para aplicar lo aprendido.
2. **Mi asesor IA.** Tu motor de **consejos personalizados**. Es el corazón del Capítulo 11.
3. **Mi progreso.** Tu **panel de gamificación**: puntos acumulados, nivel actual, historial de quizzes y próximos pasos sugeridos. Se trata en el Capítulo 12.

El encabezado del módulo muestra un badge dinámico con tu rango actual (por ejemplo, **"🌱 Aprendiz 0 pts"** si recién comienzas) que va cambiando a medida que sumas puntos en los quizzes.

### 10.2 Pestaña "Videos educativos"

Esta pestaña presenta el catálogo de videos en una grilla. El contenido del catálogo es **estático en el frontend**: cada tarjeta muestra el título, el canal, la serie a la que pertenece y unas etiquetas de tema. Hay nueve videos disponibles que abarcan, entre otros temas, prevención de estafas financieras, decisiones financieras saludables y bienestar económico personal.

Cuando haces clic en **Ver aquí** sobre una tarjeta se abre el modal del video con tres sub-pestañas internas:

- **Puntos clave.** Lista los aprendizajes más importantes del video según lo definido por el equipo de contenido. Si el video no trae puntos definidos, esta pestaña aparece vacía.
- **Mis notas.** Un cuadro de texto libre donde puedes anotar lo que quieras del video. AhorroGo guarda automáticamente tus notas cada vez que dejas de escribir; verás el indicador **"Guardado"** en verde a medida que se sincroniza. También dispones de dos botones: **Copiar** (para llevar el texto al portapapeles) y **Descargar .txt** (para conservar tus notas como archivo). El límite es de 8000 caracteres por video.
- **Checklist.** Un panel con tareas. Para crear una nueva, escribe en el campo de texto y pulsa **Añadir**. Cada tarea aparece con un checkbox para marcarla como completada y una **x** para eliminarla. Es ideal para anotar acciones concretas: "Reducir mis gastos hormiga", "Configurar presupuesto de Alimentación", etc.

Notas y checklist se guardan **por video y por usuario**, así que cada vez que vuelvas a un video encontrarás tu trabajo anterior. El servidor utiliza un debounce de aproximadamente 600 milisegundos para evitar guardar a cada tecleo.

### 10.3 Cómo se relaciona con quizzes y consejos

- Cada uno de los nueve videos tiene asociado un **quiz** de cinco preguntas. Desde la pestaña Mi progreso (Capítulo 12) puedes ver qué quizzes te faltan, cuáles ya completaste y empezar uno nuevo desde el botón **🎯 Tomar quiz** de la tarjeta del video.
- La pestaña **Mi asesor IA** se nutre de tu actividad financiera real, no de los videos. Verla aquí, dentro de Aprendizaje, refuerza la idea de que aprender y aplicar son dos caras del mismo proceso.

### 10.4 Disponibilidad

El módulo de Aprendizaje también se bloquea para los administradores: las acciones de notas y checklist requieren rol usuario, y el backend responde con código 403 si alguien con rol administrador intenta usarlas. Esto se alinea con la separación de funciones descrita en la Parte II.

## Lista de capturas a tomar

### CAPTURA U-19
- **Pantalla:** `/learning` con la pestaña **"Videos educativos"** activa.
- **Cuenta a usar:** `demo@correo.com`.
- **Estado previo necesario:**
  - Iniciar sesión con la cuenta demo y entrar al módulo Aprendizaje.
  - Asegurarse de que la pestaña activa sea **Videos educativos** (es la pestaña por defecto, "videos").
- **Qué debe estar visible:**
  - Encabezado de Aprendizaje con el badge de rango actual (por ejemplo "🌱 Aprendiz X pts" o el rango que corresponda a la cuenta demo).
  - Las tres pestañas (**Videos educativos**, **Mi asesor IA**, **Mi progreso**), con la primera resaltada como activa.
  - Grilla con al menos cinco tarjetas de video, cada una mostrando título, canal o serie y etiquetas.
- **Qué NO debe aparecer:**
  - Modal de video abierto.
- **Resolución y formato:**
  - 1440x900 mínimo, PNG, en idioma español.
- **Notas adicionales:**
  - El menú superior debe tener **"Aprendizaje"** marcada como activa.

### CAPTURA U-20
- **Pantalla:** `/learning` con el modal de un video abierto en la sub-pestaña **"Mis notas"**.
- **Cuenta a usar:** `demo@correo.com`.
- **Estado previo necesario:**
  - Pulsa **Ver aquí** en una tarjeta de video con puntos clave definidos (por ejemplo, alguno de los videos sobre prevención de estafas).
  - Cambia a la sub-pestaña **Mis notas** y escribe un par de líneas de ejemplo, por ejemplo: "Revisar mis estados de cuenta", "No compartir mis claves por WhatsApp".
- **Qué debe estar visible:**
  - Modal con el título del video, el reproductor (o miniatura) a la izquierda y el panel de pestañas internas a la derecha.
  - Las tres sub-pestañas (**Puntos clave**, **Mis notas**, **Checklist**) con **Mis notas** activa.
  - Textarea con las notas escritas, indicador **"Guardado"** en verde y los botones **Copiar** y **Descargar .txt**.
- **Qué NO debe aparecer:**
  - Ningún dato confidencial.
- **Resolución y formato:**
  - 1440x900 mínimo, PNG, en idioma español.
- **Notas adicionales:**
  - Espera a que el indicador "Guardado" aparezca antes de capturar para que se vea claramente que el guardado automático funciona.
