# Capítulo 15. Métricas y KPIs del sistema

## Texto narrativo (para pegar en el .docx)

La sección **Métricas** (ruta `/admin/metrics`, accesible desde el ícono **📊** del sidebar) es la pantalla principal del Panel de Administración. Resume el estado del sistema en cuatro tarjetas y cuatro bloques visuales. Toda la información que aparece aquí es **agregada y anónima**: no hay un solo dato monetario por usuario individual.

### 15.1 Encabezado

La cabecera muestra:

- **Título:** **"Panel de control"**.
- **Subtítulo:** **"Resumen del sistema (datos agregados, sin información personal)"**. Este texto es deliberado: refuerza visualmente la separación de funciones.
- Dos badges informativos a la derecha: **"Usuarios: [total]"** y **"Globales activas: [count]"**, con los totales de usuarios y categorías globales activas respectivamente.

### 15.2 Cuatro tarjetas KPI

Las primeras métricas se presentan en una grilla de cuatro tarjetas, cada una con un icono, una etiqueta principal y una pista descriptiva:

- **Usuarios totales (👥).** Total registrado. Pista: **"[activos] activos · [bloqueados] bloqueados"**, separando el detalle entre cuentas vigentes y cuentas bloqueadas por intentos fallidos.
- **Transacciones del mes (💸).** Total de transacciones registradas por todos los usuarios en el mes actual. Pista: variación porcentual respecto al mes anterior (**"+X%"** o **"-X%"**). No se muestran montos.
- **Categorías globales (🏷️).** Conteo de categorías globales activas. Pista: **"Promedio personales: N"** indicando cuántas categorías personales suele tener cada usuario.
- **Exportaciones del mes (📥).** Total de exportaciones (PDF + XLSX) realizadas en el mes actual. Pista: **"PDF [n] · XLSX [n]"** con el desglose por formato.

### 15.3 Gráficos y rankings

Debajo de las tarjetas aparecen cuatro bloques adicionales:

- **Registros por mes** (gráfico de barras). Subtítulo **"Usuarios nuevos en los últimos 6 meses."**. Eje X con los nombres de los meses (Ene, Feb, …) y eje Y con la cantidad de registros nuevos por mes.
- **Salud financiera** (gráfico de torta o anillo). Subtítulo **"Distribución agregada anónima."** Leyenda con los cuatro colores: **Verde**, **Amarillo**, **Rojo** y **Neutral**. Importante: en la versión actual los porcentajes que se muestran son una **estimación agregada y anónima**; en algunos despliegues puede aparecer como dato placeholder (predominantemente "Neutral") hasta que el cálculo agregado se conecte de forma definitiva.
- **Top categorías globales.** Subtítulo **"Por cantidad de usuarios distintos que las usan."** Tabla con dos columnas: **Nombre** y **Usuarios**, mostrando hasta cinco entradas.
- **Top métodos de pago.** Subtítulo **"Por cantidad de usuarios activos que los usan."** Tabla análoga con hasta tres entradas.

### 15.4 Cómo se construyen estos datos

El servicio `AdminService.getMetrics()` se apoya en el `AdminRepository`, que ejecuta consultas agregadas directamente contra la base. Los conteos están filtrados por roles para excluir a los administradores del grupo "usuarios". Las cifras nunca contienen información identificable: solo totales, porcentajes y rankings de uso.

### 15.5 Qué hacer con esta información

- Si **"Usuarios bloqueados"** crece de forma anormal, conviene revisar la pestaña Usuarios para investigar posibles ataques de fuerza bruta y desbloquear las cuentas legítimas afectadas.
- Si la **variación de transacciones del mes** es negativa de forma sostenida, puede indicar caída de uso y conviene revisar la disponibilidad del servicio.
- Los **Top de categorías y métodos** ayudan a decidir qué catálogos globales conviene priorizar o limpiar.

## Lista de capturas a tomar

### CAPTURA A-03
- **Pantalla:** `/admin/metrics` (Panel de control en su totalidad).
- **Cuenta a usar:** `admin@correo.com`.
- **Estado previo necesario:**
  - Iniciar sesión con la cuenta administradora.
  - Asegurarse de que el sistema tenga datos suficientes (varios usuarios, decenas de transacciones, al menos un par de exportaciones del mes) para que todas las tarjetas y gráficos se muestren con valores reales.
- **Qué debe estar visible:**
  - Topbar y sidebar del panel admin, con **Métricas** marcado como activo.
  - Encabezado **"Panel de control"** y subtítulo **"Resumen del sistema (datos agregados, sin información personal)"**.
  - Badges de la derecha (**Usuarios** y **Globales activas**).
  - Las cuatro tarjetas KPI con valores reales.
  - Los cuatro bloques inferiores: **Registros por mes**, **Salud financiera**, **Top categorías globales** y **Top métodos de pago**.
- **Qué NO debe aparecer:**
  - Ningún dato monetario individual.
  - Modales abiertos.
- **Resolución y formato:**
  - 1440x900 mínimo, PNG, en idioma español.
- **Notas adicionales:**
  - Si la pantalla resulta más alta que 900 píxeles, opta por una captura que cubra el encabezado y las cuatro tarjetas KPI con la zona superior de los gráficos; documenta las visualizaciones inferiores en el texto.
