# Capítulo 4. Gestión de categorías

## Texto narrativo (para pegar en el .docx)

Las categorías son la columna vertebral de AhorroGo: cada transacción debe asociarse a una categoría para que el sistema sepa si se trata de un ingreso o de un gasto y para que los reportes puedan agrupar tu actividad. El módulo se encuentra en el menú principal bajo la opción **Categorias**.

### 4.1 Tipos de categoría

AhorroGo maneja dos alcances:

- **Globales.** Son catálogos compartidos creados por el administrador (por ejemplo, "Alimentación", "Transporte", "Sueldo"). Aparecen automáticamente para todos los usuarios y no se pueden editar directamente; si intentas modificar una global como usuario, AhorroGo creará una copia personal para ti.
- **Personales.** Las que tú creas para tu propio perfil. Solo tú las ves.

Cada categoría tiene un **tipo**, que puede ser **"gasto"** o **"ingreso"**. El tipo es lo que determina si los movimientos asociados se sumarán a tus salidas o a tus entradas.

### 4.2 Pantalla principal

La página **"Categorias"** se divide en dos zonas:

- A la **izquierda**, el formulario para **Nueva categoria** (o **Editar categoria** cuando seleccionas una existente).
- A la **derecha**, la **tabla de categorías visibles** con cuatro columnas:
  - **Nombre** (si la categoría está archivada se muestra junto al nombre la etiqueta "Inactiva").
  - **Tipo** (pill de color: amarillo/naranja para gasto, verde para ingreso).
  - **Alcance** (etiqueta "Global" o "Personal").
  - **Acciones** (botones **Editar** y **Eliminar**).

En el encabezado del módulo aparece el subtítulo **"Organiza tus ingresos y gastos por categoría"**, dos badges de contadores (categorías personales y globales) y, si la lista está vacía, el mensaje **"No hay categorias disponibles todavia."**.

### 4.3 Crear una categoría

1. Pulsa el botón **+ Nueva categoria** o sitúa el cursor en el formulario de la izquierda.
2. Completa los campos:
   - **Nombre.** Placeholder "Ej. Alimentacion". Es obligatorio; al guardar se recortan los espacios sobrantes.
   - **Tipo.** Selecciona **"gasto"** o **"ingreso"**. El valor por defecto es "gasto".
   - **Marcar como global.** Esta casilla solo aparece si tu rol es administrador, así que como usuario regular no la verás.
3. Pulsa **Crear categoria**.
4. Aparecerá una ventana de confirmación con el título **"Confirmar creacion de categoria"** y el texto **"Se creara una nueva categoria con los datos ingresados."**. Confirma pulsando **Guardar** o cancela con **Cancelar**.

Cuando todo va bien aparece un toast verde con **"Categoria creada correctamente"** y la nueva categoría se ve al instante en la tabla.

### 4.4 Editar una categoría

Pulsa **Editar** en la fila correspondiente. El formulario de la izquierda cambia su título a **"Editar categoria"** y el botón principal pasa a llamarse **Guardar cambios**. Si decides no continuar, el botón **Cancelar** restablece el formulario al modo creación.

Al confirmar verás el modal **"Confirmar cambios en categoria"** con el texto **"Se guardaran los cambios de esta categoria."**. Tras aceptar aparece el toast **"Categoria actualizada correctamente"**.

> **Nota técnica.** Si editas una categoría que originalmente era global, AhorroGo crea automáticamente una **copia personal** con tus cambios. La global original sigue intacta para los demás usuarios.

### 4.5 Eliminar una categoría

El comportamiento de **Eliminar** depende de si la categoría tiene movimientos o presupuestos asociados.

**Caso 1: la categoría no se está usando.**
- Aparece el modal **"Confirmar eliminacion"** con el texto **«Se eliminara la categoria "Nombre".»**.
- Botón rojo **Eliminar** para confirmar.
- Toast de éxito al terminar.

**Caso 2: la categoría tiene transacciones o presupuestos asociados.**
- AhorroGo abre el modal **"Gestionar categoria con dependencias"**, más grande y con dos secciones:
  - **Detalle de la categoría** (nombre, tipo, estado, alcance).
  - **Dependencias asociadas:** indica cuántas **"Transacciones asociadas"** y cuántos **"Presupuestos asociados"** existen.
- Bajo el detalle se muestra una nota de impacto: **"Cambiar o eliminar esta categoria tambien impactara indirectamente los reportes que usan esas transacciones y presupuestos."**.
- Tres botones de acción:
  - **Cancelar.** Cierra el modal sin cambios.
  - **Archivar (mantener historial).** Marca la categoría como inactiva (`activo=false`), pero conserva los movimientos y presupuestos asociados. Aparece luego en la tabla con el rótulo "Inactiva". Toast: **"Categoria archivada correctamente"**.
  - **Eliminar TODO** (rojo, peligro). Borra la categoría junto con todas sus transacciones y presupuestos asociados. Toast: **"Categoria eliminada junto con sus dependencias"**. Esta acción es irreversible.

Si la operación falla aparece el toast rojo **"No se pudo eliminar la categoria"**.

### 4.6 Buenas prácticas

- Antes de borrar una categoría con historial, considera **archivarla**. Así conservas tus reportes históricos y simplemente la sacas de la vista para nuevas operaciones.
- Si una categoría global no encaja con tu uso real, créate una personal específica en vez de pelearte con la global.
- Mantén una cantidad manejable de categorías (idealmente entre 8 y 15) para que los reportes sean legibles.

## Lista de capturas a tomar

### CAPTURA U-07
- **Pantalla:** `/categories` (vista principal con tabla poblada).
- **Cuenta a usar:** `demo@correo.com`.
- **Estado previo necesario:**
  - La cuenta demo debe tener un mix de categorías globales y al menos dos personales (gasto e ingreso) ya creadas.
  - El formulario de la izquierda debe estar en modo **Nueva categoria** (vacío, sin selección).
- **Qué debe estar visible:**
  - Encabezado **"Categorias"** con el subtítulo **"Organiza tus ingresos y gastos por categoría"** y los badges de personales/globales.
  - Formulario **"Nueva categoria"** con el campo Nombre y el selector Tipo en valor "gasto".
  - Tabla con varias filas mostrando las columnas Nombre, Tipo, Alcance y Acciones.
  - Al menos una fila con alcance **"Global"** y al menos una con **"Personal"**.
- **Qué NO debe aparecer:**
  - Modales abiertos.
  - Toasts.
- **Resolución y formato:**
  - 1440x900 mínimo, PNG, en idioma español.
- **Notas adicionales:**
  - Verifica que el menú superior tenga **"Categorias"** marcada como activa.

### CAPTURA U-08
- **Pantalla:** `/categories` con el formulario en modo **Editar categoria**.
- **Cuenta a usar:** `demo@correo.com`.
- **Estado previo necesario:**
  - Pulsa **Editar** sobre una categoría personal existente (por ejemplo, "Comida fuera").
- **Qué debe estar visible:**
  - Formulario con el título **"Editar categoria"**, el campo Nombre con el valor actual, el selector Tipo con la opción correcta y los botones **Guardar cambios** (primario) y **Cancelar** (secundario).
  - Tabla a la derecha intacta.
- **Qué NO debe aparecer:**
  - Modal de confirmación abierto.
- **Resolución y formato:**
  - 1440x900 mínimo, PNG, en idioma español.
- **Notas adicionales:**
  - Selecciona una categoría que sea claramente personal (no global) para evitar confusiones con el comportamiento de copia automática.

### CAPTURA U-09
- **Pantalla:** `/categories` con el modal **"Gestionar categoria con dependencias"** abierto.
- **Cuenta a usar:** `demo@correo.com`.
- **Estado previo necesario:**
  - Pulsa **Eliminar** en una categoría que tenga al menos un par de transacciones o presupuestos asociados (por ejemplo "Alimentación").
- **Qué debe estar visible:**
  - Modal centrado con el título **"Gestionar categoria con dependencias"**.
  - Bloque de detalle de la categoría (nombre, tipo, estado, alcance).
  - Sección con los conteos **"Transacciones asociadas"** y **"Presupuestos asociados"**.
  - Nota informativa "Cambiar o eliminar esta categoria tambien impactara indirectamente los reportes...".
  - Botones inferiores: **Cancelar**, **Archivar (mantener historial)** y **Eliminar TODO** (rojo).
- **Qué NO debe aparecer:**
  - Tabla de categorías visible (el modal puede mostrarse sobre el fondo oscurecido, pero el foco debe estar en el modal).
- **Resolución y formato:**
  - 1440x900 mínimo, PNG, en idioma español.
- **Notas adicionales:**
  - Esta captura es la prueba visual del flujo de dependencias y es importante que el modal esté completo y centrado.
