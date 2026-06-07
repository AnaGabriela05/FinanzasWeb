# Capítulo 8. Generar y exportar reportes

## Texto narrativo (para pegar en el .docx)

El módulo **Reportes** transforma tus transacciones en gráficos, tablas y archivos descargables. Es el lugar al que llegarás cuando quieras revisar tu actividad por categoría, comparar meses, presentar resultados o llevar tus datos a Excel o PDF. Está diseñado como un panel de "lectura analítica": las ediciones siempre se hacen en el módulo de Transacciones.

### 8.1 Pantalla principal

Desde el menú, selecciona **Reportes**. La pantalla se organiza en cuatro grandes bloques:

1. **Encabezado del módulo** con el subtítulo **"Filtra, analiza y exporta tu actividad financiera"**, el badge **Rango** que muestra el rango de fechas activo (formato AAAA-MM-DD → AAAA-MM-DD) y dos botones rápidos: **Filtros** (con icono ⚙, hace scroll al panel de filtros) y **Exportar** (con icono 📥, dispara la exportación a PDF respetando los filtros vigentes; mientras se procesa muestra **"Exportando…"**).
2. **Panel de filtros** (lateral), con el título **"Filtros del reporte"** y el subtítulo "Ajusta el periodo y el foco del analisis sin salir del tablero.".
3. **Sección visual** con tarjetas resumen, gráficos y KPIs.
4. **Detalle por categoría y por método** y un acceso rápido al módulo de Transacciones.

### 8.2 Filtros disponibles

El panel de filtros expone cinco controles:

- **Desde** y **Hasta.** Selectores de fecha. Por defecto cubren los últimos 90 días.
- **Categoria.** Desplegable con la opción **"Todas"** y todas tus categorías visibles ("Nombre (tipo)").
- **Metodo de pago.** Desplegable con **"Todos"** y todos tus métodos.
- **Tipo de transaccion.** Desplegable con **"Todos"**, **"Ingresos"** y **"Gastos"**.

Botones inferiores:

- **Aplicar filtros** (primario): vuelve a pedir al servidor los datos filtrados.
- **Limpiar**: vuelve a los valores por defecto.

Por debajo se ve un bloque **"Rango activo"** con el texto **"AAAA-MM-DD a AAAA-MM-DD"** y la sección **"Exportar reporte"** con la descripción **"Descarga el resultado filtrado en PDF o Excel."** y dos botones: **Exportar Excel** y **Exportar PDF**. Mientras corre la descarga el botón muestra **"Exportando Excel…"** o **"Exportando PDF…"**.

Más abajo aparecen pequeños chips informativos que reflejan el estado actual del filtro: **"Categoria filtrada"** o **"Todas las categorias"**, **"Metodo filtrado"** o **"Todos los metodos"**, **"Tipo: ingreso"** / **"Tipo: gasto"** o **"Todos los tipos"**.

### 8.3 Panel visual y KPIs

Al aplicar filtros se actualiza el panel principal:

- **Tarjeta de tendencia reciente** con etiquetas dinámicas como **"Mejora mensual"**, **"Presion en gastos"**, **"Sin cambios fuertes"** o **"Sin suficiente historial"**.
- **Mini-tarjetas** con indicadores: **"Presion en gastos"** (valores "Controlada", "Atencion moderada", "Alta" o "Sin base suficiente"), **"Categorias activas"**, **"Metodos detectados"**, **"Mayor categoria de gasto"** y **"Metodo mas usado"** (con "Sin datos" cuando aún no hay actividad).
- **Gráfico de barras "Ingresos vs gastos por mes"** con el subtítulo "Comparacion mensual del flujo de entrada y salida". Dos barras por mes: azul (ingreso) y rosado (gasto).
- **Gráfico circular "Gastos por categoria"** con el subtítulo "Peso relativo de las categorias de gasto", mostrando las cinco principales.
- **Gráfico circular "Uso por metodo de pago"** con el subtítulo "Volumen movilizado por cada metodo", también con el top cinco.

Debajo de los gráficos hay una **grilla de seis KPIs**:

- **Ingresos** — "Entradas registradas en el rango analizado".
- **Gastos** — "Salidas asociadas a categorias de gasto".
- **Saldo** — "Resultado neto del periodo filtrado".
- **Transacciones** — "Movimientos incluidos en el reporte".
- **Categorias con movimiento** — "Categorias con actividad dentro del corte".
- **Metodos usados** — "Metodos detectados en el conjunto filtrado".

### 8.4 Resumen por categoría y método

Más abajo se muestran dos tarjetas en grilla:

- **"Resumen por categoria"** con el subtítulo "Distribucion del monto total por categoria dentro del rango actual". Lista las seis principales con monto, número de transacciones y porcentaje. Si está vacío: **"No hay categorias con movimientos en el filtro actual"**.
- **"Resumen por metodo de pago"** con el subtítulo "Lectura ejecutiva del peso de cada metodo de pago" y, en su caso, **"No hay metodos de pago con movimientos en el filtro actual"**.

Al final del módulo aparece una tarjeta titulada **"El detalle completo vive en Transacciones"**, con el texto **"Este modulo queda enfocado en lectura analitica. Si necesitas revisar movimientos uno por uno, editar registros o validar descripciones, usa el modulo especializado de transacciones."** y un enlace **"Ver detalle en Transacciones"** que te lleva a `/transactions`.

### 8.5 Exportar a Excel y PDF

Las dos exportaciones respetan **todos** los filtros activos. El servidor genera el archivo y lo descarga al instante.

- **Excel (.xlsx).** Hoja única llamada **"Transacciones"** con las columnas Fecha, Descripcion, Categoria, Tipo, Metodo, Ingreso y Gasto. El monto se coloca en la columna **Ingreso** o **Gasto** según el tipo de la categoría.
- **PDF.** Primera página con el título **"Reporte de Transacciones"**, el subtítulo **"Rango: {desde} a {hasta}"**, una tabla con las columnas Fecha, Descripcion, Categoria, Metodo, Ingreso y Gasto, y al final tres totales en soles: **"Total ingresos"**, **"Total gastos"** y **"Saldo (ingresos - gastos)"**. La segunda página trae el subtítulo **"Panel visual"** con dos gráficos: un gráfico de barras **"Ingresos vs Gastos por mes"** y un gráfico de torta **"Distribucion de gastos por categoria"**.

Los archivos se nombran automáticamente como `reporte_transacciones_{desde}_a_{hasta}.pdf` o `.xlsx`.

> **Auditoría.** Cada exportación queda registrada en el servidor con el usuario, formato, rango y nombre de archivo. Esa bitácora es la que verá el administrador en su panel (Capítulo 18). La aplicación nunca expone el contenido del archivo en la bitácora, solo el metadato de la operación.

### 8.6 Modo "vista previa" del administrador

Si un administrador entra al módulo Reportes a través del modo "Vista como usuario" (Capítulo 19), el botón **Exportar** del encabezado y los botones del panel quedan deshabilitados. Aunque el administrador pudiera forzar la petición, el backend la rechaza con código 403 porque los endpoints de reporte tienen la regla `denyRole('admin')`.

## Lista de capturas a tomar

### CAPTURA U-16
- **Pantalla:** `/reports` (vista principal con datos filtrados por los últimos 90 días).
- **Cuenta a usar:** `demo@correo.com`.
- **Estado previo necesario:**
  - Iniciar sesión con la cuenta demo. Asegurarse de que existan al menos 30 transacciones distribuidas en varias categorías y métodos durante los últimos 90 días.
  - Mantener los filtros por defecto (Desde = hace 90 días, Hasta = hoy, Todas, Todos, Todos).
- **Qué debe estar visible:**
  - Encabezado **"Reportes"** con el badge **Rango** y los botones **Filtros** y **Exportar**.
  - Panel de filtros con los cinco selectores y los botones **Aplicar filtros**, **Limpiar**, **Exportar Excel** y **Exportar PDF**.
  - Tarjeta de tendencia y las mini-tarjetas (Presion en gastos, Categorias activas, Metodos detectados, Mayor categoria de gasto, Metodo mas usado).
  - Gráfico de barras **"Ingresos vs gastos por mes"** y al menos uno de los gráficos circulares cargados.
  - Grilla de KPIs (Ingresos, Gastos, Saldo, Transacciones, Categorias con movimiento, Metodos usados).
- **Qué NO debe aparecer:**
  - Toasts ni modales abiertos.
- **Resolución y formato:**
  - 1440x900 mínimo, PNG, en idioma español.
- **Notas adicionales:**
  - Si la pantalla es más alta que 900, puedes tomar dos capturas separadas (vista superior y vista inferior) y unirlas en el documento, pero esta U-16 debe enfocar la zona alta con los filtros y los KPIs.

### CAPTURA U-17
- **Pantalla:** `/reports` con la sección **"Exportar reporte"** y los botones **Exportar Excel** / **Exportar PDF** visibles, idealmente mientras el botón muestra el estado **"Exportando PDF…"**.
- **Cuenta a usar:** `demo@correo.com`.
- **Estado previo necesario:**
  - Aplicar un filtro concreto (por ejemplo Categoría = "Alimentación") para que el chip muestre **"Categoria filtrada"**.
  - Pulsar el botón **Exportar PDF** para capturar el estado **"Exportando PDF…"** antes de que se descargue el archivo.
- **Qué debe estar visible:**
  - Panel de filtros con los valores aplicados.
  - Sección **"Exportar reporte"** con la descripción "Descarga el resultado filtrado en PDF o Excel.".
  - Botón **Exportar PDF** mostrando temporalmente **"Exportando PDF…"** o el botón **Exportar Excel** en estado normal.
  - Chips inferiores reflejando el filtro aplicado (por ejemplo "Categoria filtrada", "Todos los metodos", "Todos los tipos").
- **Qué NO debe aparecer:**
  - Diálogos del navegador para guardar el archivo (cierra el "Guardar como" antes de capturar).
- **Resolución y formato:**
  - 1440x900 mínimo, PNG, en idioma español.
- **Notas adicionales:**
  - Si te resulta difícil capturar el estado "Exportando", lo aceptable es mostrar la sección de exportación con los botones habilitados y los chips reflejando el filtro aplicado.
