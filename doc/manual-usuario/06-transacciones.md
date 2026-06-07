# Capítulo 6. Registrar transacciones

## Texto narrativo (para pegar en el .docx)

Las **transacciones** son cada uno de los movimientos económicos que registras en AhorroGo: un sueldo recibido, una compra en el supermercado, el pago del recibo de luz, una transferencia entre cuentas. Cada transacción se asocia obligatoriamente a una categoría (para definir si es ingreso o gasto) y a un método de pago. Este es el módulo que más usarás en el día a día.

### 6.1 Pantalla principal

Accede desde el menú a la opción **Transacciones**. Verás:

- **Encabezado del módulo** con el subtítulo **"Registra cada ingreso y gasto para mantener tu control financiero"**, dos badges informativos (**"Este mes"** con el total gastado en soles del mes en curso, y **"Total movimientos"** con la cantidad histórica) y el botón principal **+ Nueva transacción**.
- **Listado de transacciones** con el título **"Listado de transacciones"**, una línea descriptiva del tipo "Mostrando X de Y movimientos" y, cuando no hay datos, el mensaje **"No hay transacciones registradas todavia."**.

La tabla tiene seis columnas:

1. **Fecha** (formato AAAA-MM-DD).
2. **Detalle** (descripción libre; muestra **"Sin detalle"** si está vacía).
3. **Categoria** (nombre de la categoría más un pill **"ingreso"** o **"gasto"**).
4. **Metodo** (nombre del método de pago o **"Sin metodo"**).
5. **Monto** (en soles peruanos; si la transacción se registró en dólares se muestra el importe en USD y debajo una equivalencia aproximada en soles del estilo "≈ S/ 562.50").
6. **Acciones** (botones **Editar** y **Eliminar**).

Si tienes más de 50 movimientos aparecen los controles de paginación inferiores: el indicador **"Página X de Y"** y los botones **Anterior** y **Siguiente**.

### 6.2 Crear una transacción

1. Pulsa **+ Nueva transacción**. Se abre el modal **"Nueva transaccion"** con el subtítulo **"Completa el formulario para registrar un movimiento"**.
2. Rellena los campos:
   - **Fecha.** Selector de fecha. Por defecto trae el día de hoy. El servidor valida que sea una fecha ISO válida (AAAA-MM-DD) y muestra **"Fecha invalida (formato YYYY-MM-DD)"** si no lo es.
   - **Monto.** Placeholder "Ej. 150". Debe ser un número mayor a cero; en caso contrario el servidor responde **"El monto debe ser mayor a 0"**.
   - **Moneda.** Desplegable con dos opciones: **"Soles (S/)"** (PEN) y **"Dólares ($)"** (USD). Por defecto, PEN. Si eliges USD y escribes un monto, aparecerá debajo del campo un texto auxiliar como **"Equivale a S/ 562.50 aproximadamente."**, calculado con la tasa de cambio actual.
   - **Detalle.** Campo de texto libre con placeholder "Ej. Pago de servicio". Es opcional y admite hasta 200 caracteres.
   - **Categoría.** Desplegable con tus categorías visibles, mostrando el nombre y el tipo entre paréntesis. Es obligatorio.
   - **Método de pago.** Desplegable con tus métodos activos. Es obligatorio.
3. Pulsa **Registrar transaccion**. Se abre el modal **"Confirmar creacion de transaccion"** con el texto **"Se registrara una nueva transaccion con los datos ingresados."**. Pulsa **Guardar** para confirmar.

Cuando se guarda con éxito aparece el toast **"Transaccion creada correctamente"** y la nueva transacción se inserta al inicio del listado. Mientras la solicitud está en curso, el botón muestra el texto **"Guardando..."**.

> **Importante.** Aunque registres una transacción en dólares, los reportes y la salud financiera usan internamente soles peruanos. La tasa de cambio configurada en el servidor es de **3.75 S/ por USD** por defecto y se puede ajustar en el servidor mediante una variable de entorno; el frontend la consulta al iniciar.

### 6.3 Editar una transacción

Pulsa **Editar** en la fila correspondiente. Se abre el modal **"Editar transaccion"** con el subtítulo **"Actualiza la informacion y guarda los cambios"** y todos los campos rellenados. El botón principal pasa a llamarse **Guardar cambios** y aparece un **Cancelar** secundario.

Al confirmar verás el modal **"Confirmar cambios en transaccion"** con el texto **"Se guardaran los cambios de esta transaccion."**, y luego el toast **"Transaccion actualizada correctamente"**.

### 6.4 Eliminar una transacción

Pulsa **Eliminar** en la fila correspondiente. Aparece el modal **"Confirmar eliminacion"** con el texto **«Se eliminara la transaccion "Detalle" por S/ 150.00.»** (o el equivalente en USD). Confirma con el botón rojo **Eliminar** o cancela.

Toast de éxito: **"Transaccion eliminada correctamente"**. Si algo falla aparece **"No se pudo eliminar la transaccion"**.

### 6.5 Filtros y paginación

Cuando trabajas con un volumen importante de movimientos, el listado puede paginarse y filtrarse desde la propia API. Los filtros disponibles internamente son:

- **Rango de fechas** (parámetros `from` y `to` en formato ISO).
- **Categoría** específica (`categoryId`).
- **Método de pago** específico (`paymentMethodId`).
- **Tipo de transacción** (`transactionType`): "ingreso" o "gasto".
- **Página y tamaño**: hasta 200 transacciones por página, con 50 por defecto.

Estos filtros se aprovechan con más detalle desde el módulo **Reportes** (Capítulo 8), pero también pueden aplicarse al listado de Transacciones según la versión de la interfaz en uso. Si el módulo de Reportes que ves en tu pantalla expone filtros, son exactamente los mismos.

### 6.6 Restricciones por rol

El módulo de Transacciones está **bloqueado para administradores**. Si una cuenta administradora intenta crear, leer, editar o eliminar una transacción, el servidor responde con código 403 y el mensaje **"Esta operacion no esta disponible para administradores. El administrador no puede operar como usuario final del sistema."**. Esta es la barrera de Separación de Funciones (SoD) que explicamos en la Parte II del manual.

## Lista de capturas a tomar

### CAPTURA U-11
- **Pantalla:** `/transactions` (vista del listado con datos cargados).
- **Cuenta a usar:** `demo@correo.com`.
- **Estado previo necesario:**
  - Iniciar sesión con la cuenta demo.
  - Asegurarse de que el listado tenga al menos 8 a 10 transacciones de ejemplo, idealmente con una mezcla de ingresos y gastos, y al menos una en USD para mostrar la equivalencia en soles.
- **Qué debe estar visible:**
  - Encabezado **"Transacciones"** con el subtítulo y los badges **Este mes** y **Total movimientos**.
  - Botón **+ Nueva transacción**.
  - Tabla con sus seis columnas (Fecha, Detalle, Categoria, Metodo, Monto, Acciones) y al menos una fila con un monto en dólares con la línea auxiliar "≈ S/ ...".
- **Qué NO debe aparecer:**
  - Modales abiertos.
  - Datos sensibles fuera de la cuenta demo.
- **Resolución y formato:**
  - 1440x900 mínimo, PNG, en idioma español.
- **Notas adicionales:**
  - Si la cuenta tiene más de 50 transacciones, asegúrate de que la captura muestre los controles de paginación al pie.

### CAPTURA U-12
- **Pantalla:** `/transactions` con el modal **"Nueva transaccion"** abierto.
- **Cuenta a usar:** `demo@correo.com`.
- **Estado previo necesario:**
  - Pulsa **+ Nueva transacción**.
  - Rellena los campos con datos de ejemplo: Fecha = día de hoy, Monto = 150, Moneda = "Soles (S/)" (PEN), Detalle = "Compras del mercado", Categoría = una categoría de gasto existente (por ejemplo "Alimentación"), Método = "Tarjeta débito".
- **Qué debe estar visible:**
  - Modal con título **"Nueva transaccion"** y subtítulo "Completa el formulario para registrar un movimiento".
  - Todos los campos rellenados con datos coherentes.
  - Botones **Registrar transaccion** (primario) y **Cancelar** (secundario).
- **Qué NO debe aparecer:**
  - Modal de confirmación encima del formulario.
- **Resolución y formato:**
  - 1440x900 mínimo, PNG, en idioma español.
- **Notas adicionales:**
  - El modal debe centrarse en la pantalla; deja ver una porción del listado de fondo para dar contexto.

### CAPTURA U-13
- **Pantalla:** `/transactions` con el formulario configurado en **USD** y la equivalencia aproximada visible.
- **Cuenta a usar:** `demo@correo.com`.
- **Estado previo necesario:**
  - Abrir el modal **Nueva transaccion**.
  - Seleccionar **Moneda = "Dólares ($)"** y poner Monto = 150.
  - Rellenar también Categoría y Método para que el formulario se vea completo.
- **Qué debe estar visible:**
  - Campo Monto con el valor 150 y el selector Moneda en "Dólares ($)".
  - Texto auxiliar del estilo **"Equivale a S/ 562.50 aproximadamente."** debajo del campo Monto.
- **Qué NO debe aparecer:**
  - Modal de confirmación abierto.
- **Resolución y formato:**
  - 1440x900 mínimo, PNG, en idioma español.
- **Notas adicionales:**
  - Esta captura muestra cómo se evidencia la equivalencia automática. Si la tasa configurada no es 3.75, el manual debe actualizar el monto del ejemplo o adjuntar una nota.
