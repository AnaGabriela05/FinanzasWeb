# Capítulo 5. Gestión de métodos de pago

## Texto narrativo (para pegar en el .docx)

Los **métodos de pago** representan la forma concreta con la que entregas o recibes el dinero: efectivo, tarjeta de débito, tarjeta de crédito, billetera móvil, transferencia, etc. Cada transacción se asocia obligatoriamente a un método de pago, y los reportes los utilizan para mostrar cómo se distribuye tu actividad. A diferencia de las categorías, **los métodos de pago siempre son personales**: no existen métodos globales compartidos.

### 5.1 Pantalla principal

Desde el menú principal selecciona **Metodos de pago**. La pantalla mantiene el mismo diseño en dos zonas que viste en Categorías:

- **A la izquierda**, el formulario de creación o edición.
- **A la derecha**, la tabla con tres columnas:
  - **Nombre** del método.
  - **Estado** (pill verde **"Activo"** o gris **"Inactivo"**).
  - **Acciones** (**Editar** y **Eliminar**).

El encabezado del módulo trae el subtítulo **"Define los métodos de pago que usas con frecuencia"** y un badge verde con el contador **"Activos"**. Si todavía no hay métodos registrados se muestra el mensaje **"No hay metodos de pago disponibles todavia."**.

### 5.2 Crear un método de pago

1. Coloca el cursor en el campo **Nombre** del formulario. Placeholder: "Ej. Tarjeta debito".
2. Pulsa el botón **Crear metodo**. Al hacerlo aparece el modal **"Confirmar creacion de metodo de pago"** con el texto **"Se creara un nuevo metodo de pago con los datos ingresados."**.
3. Confirma con **Guardar** o cancela con **Cancelar**.

Si todo funciona correctamente verás el toast **"Metodo de pago creado correctamente"** y la nueva entrada aparecerá en la tabla con estado **"Activo"**. Las únicas reglas de validación son que el nombre sea obligatorio y no quede vacío al recortar espacios; el servidor responde con un mensaje claro en caso contrario.

### 5.3 Editar un método

Pulsa **Editar** en la fila correspondiente. El formulario cambia a **"Editar metodo de pago"** y aparece una casilla adicional: **"Metodo activo"**. Esta casilla es la forma rápida de archivar/reactivar un método sin tener que eliminarlo:

- Desmarcada → el método queda como **Inactivo** y deja de ofrecerse en los formularios de transacciones.
- Marcada → el método vuelve a estar disponible.

Al guardar verás el modal **"Confirmar cambios en metodo de pago"** con la descripción **"Se guardaran los cambios de este metodo de pago."**. El toast de éxito es **"Metodo de pago actualizado correctamente"**.

### 5.4 Eliminar un método

Como en categorías, el comportamiento cambia según existan o no transacciones asociadas:

**Sin transacciones asociadas.**
- Modal **"Confirmar eliminacion"** con el texto **«Se eliminara el metodo de pago "Nombre".»**.
- Botón rojo **Eliminar** para confirmar.

**Con transacciones asociadas.**
- Se abre el modal **"Gestionar metodo de pago con dependencias"**, con el detalle del método (nombre, estado), el conteo **"Transacciones asociadas"** y la nota **"Cambiar o eliminar este metodo de pago afectara indirectamente los reportes que usan esas transacciones."**.
- Tres botones:
  - **Cancelar** para abandonar.
  - **Archivar (mantener historial)**, que simplemente cambia el estado a Inactivo y conserva las transacciones. Toast: **"Metodo de pago archivado correctamente"**.
  - **Eliminar TODO** (rojo), que borra el método **y todas las transacciones asociadas**. Toast: **"Metodo de pago eliminado junto con sus transacciones"**.

Si la operación falla, verás los mensajes **"No se pudo guardar el metodo de pago"** o **"No se pudo eliminar el metodo de pago"**.

### 5.5 Sugerencias

- Crea pocos métodos pero significativos: por ejemplo **Efectivo**, **Tarjeta débito BCP**, **Yape**. Demasiados métodos hacen difícil leer los reportes.
- Si dejas de usar uno, **archívalo** desde el botón **Editar** o desde la opción **Archivar** del modal de dependencias. Así no pierdes el historial.
- Recuerda que los administradores **no tienen** métodos de pago propios: este módulo es exclusivo del rol usuario y el backend rechaza explícitamente las solicitudes administrativas.

## Lista de capturas a tomar

### CAPTURA U-10
- **Pantalla:** `/payment-methods` (vista principal con al menos tres métodos visibles).
- **Cuenta a usar:** `demo@correo.com`.
- **Estado previo necesario:**
  - La cuenta debe tener al menos tres métodos creados (por ejemplo Efectivo, Tarjeta débito, Yape).
  - Asegúrate de que al menos uno esté **Activo** y, idealmente, uno marcado como **Inactivo** para mostrar el contraste de los pills de estado.
  - El formulario debe estar en modo **Nuevo metodo de pago** (vacío, con placeholder visible).
- **Qué debe estar visible:**
  - Encabezado **"Metodos de pago"** con el subtítulo "Define los métodos de pago que usas con frecuencia" y el badge **Activos**.
  - Formulario "Nuevo metodo de pago" con el campo Nombre vacío y el botón **Crear metodo**.
  - Tabla con tres columnas (Nombre, Estado, Acciones) y al menos tres filas. Los estados deben verse claramente: un pill verde "Activo" y un pill gris "Inactivo".
- **Qué NO debe aparecer:**
  - Modales o toasts abiertos.
  - Datos sensibles inventados (los nombres deben ser genéricos y representativos).
- **Resolución y formato:**
  - 1440x900 mínimo, PNG, en idioma español.
- **Notas adicionales:**
  - El menú superior debe mostrar **"Metodos de pago"** marcado como activo.
