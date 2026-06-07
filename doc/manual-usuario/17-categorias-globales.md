# Capítulo 17. Gestión de categorías globales

## Texto narrativo (para pegar en el .docx)

La sección **Categorías globales** (ruta `/admin/categories`, ícono **🏷️** del sidebar) es donde el administrador mantiene el **catálogo compartido** que todos los usuarios verán al crear sus transacciones y presupuestos. Tener un buen catálogo global hace que las cuentas nuevas sean usables desde el primer minuto y que los reportes agregados del sistema tengan consistencia.

### 17.1 Encabezado

La cabecera muestra:

- **Título:** **"Categorías globales"**.
- **Subtítulo:** **"Catálogo compartido por todos los usuarios"**.
- Badge **"Total: [count]"** con la cantidad de categorías globales.
- Botón principal en la esquina derecha: **"+ Nueva categoría global"**.

### 17.2 Tabla de categorías globales

La tabla tiene cuatro columnas:

| Columna | Render |
|--------|--------|
| **Nombre** | Texto plano. |
| **Tipo** | Pill ámbar para **"gasto"**, verde para **"ingreso"**. |
| **Estado** | Pill verde **"Activa"** o gris **"Archivada"**. |
| **Acciones** | Botones: **Editar**, **Archivar** (solo cuando la categoría está activa) y **Eliminar** (rojo). |

### 17.3 Crear una categoría global

1. Pulsa **+ Nueva categoría global**. Se abre el modal con el título correspondiente y los siguientes campos:
   - **Nombre.** Placeholder "Ej. Educación". Obligatorio.
   - **Tipo.** Desplegable con **"Gasto"** o **"Ingreso"**.
2. Pulsa el botón primario (**Crear** / **Guardar cambios** según corresponda). Mientras se procesa muestra **"Guardando..."**.
3. Confirma con **Cancelar** o el botón primario.

El backend valida que el nombre no esté vacío y que el tipo sea `ingreso` o `gasto`. Tras crearse, la categoría queda disponible para todos los usuarios de inmediato.

### 17.4 Editar una categoría global

Pulsa **Editar** en la fila. Aparece el mismo formulario pre-rellenado. Los cambios afectan a la categoría tal como la ven todos los usuarios; las categorías personales que cada usuario haya creado a partir de copias automáticas (ver Capítulo 4) no se modifican.

### 17.5 Archivar y eliminar

- **Archivar** marca la categoría como `activo=false`. El modal de confirmación muestra: **«Se archivará "Nombre". Los usuarios la dejarán de ver pero su historial queda intacto.»**. Después de confirmar, los usuarios dejan de verla en sus desplegables pero las transacciones y presupuestos previos siguen funcionando con normalidad.
- **Eliminar** intenta borrar la categoría. Si nadie la usa, se elimina sin más. Si hay transacciones o presupuestos asociados, el backend responde con el código 409 y el mensaje **"Categoria global en uso"**. El frontend abre entonces un modal de confirmación con el texto **«La categoría "Nombre" tiene transacciones/presupuestos asociados. Al confirmar se ELIMINARÁN también esos registros de los usuarios.»** y el botón **Eliminar TODO** en tono de peligro. Al confirmar, el sistema borra la categoría junto con todos los registros vinculados (cascade=1).

> **Advertencia.** Eliminar con cascada es una acción irreversible. La opción correcta para preservar la consistencia histórica casi siempre es **archivar**. Reserva el borrado total para casos donde la categoría se haya creado por error o contenga datos de prueba.

### 17.6 Por qué no hay aquí categorías personales

El administrador no toca categorías personales: cada usuario gestiona las suyas desde la sección de usuario (Capítulo 4). Esta separación es deliberada para no exponer al administrador detalles personales del taxonomía de cada cuenta.

## Lista de capturas a tomar

### CAPTURA A-06
- **Pantalla:** `/admin/categories` (listado de categorías globales).
- **Cuenta a usar:** `admin@correo.com`.
- **Estado previo necesario:**
  - Iniciar sesión con la cuenta administradora.
  - Asegurarse de que existan al menos seis categorías globales con mezcla de tipos (gasto/ingreso) y estados (activa/archivada).
- **Qué debe estar visible:**
  - Sidebar con **Categorías globales** marcado como activo.
  - Encabezado **"Categorías globales"** con el subtítulo **"Catálogo compartido por todos los usuarios"** y el badge **"Total: N"**.
  - Botón **"+ Nueva categoría global"** visible.
  - Tabla con sus cuatro columnas, mostrando ambos pills de tipo (gasto ámbar, ingreso verde) y al menos una fila con estado **"Archivada"**.
  - Botones de acción visibles en al menos una fila (**Editar**, **Archivar** o **Eliminar**).
- **Qué NO debe aparecer:**
  - Modales o toasts abiertos.
- **Resolución y formato:**
  - 1440x900 mínimo, PNG, en idioma español.
- **Notas adicionales:**
  - Si tu entorno solo tiene categorías activas, archiva una de prueba para mostrar el contraste de pills.

### CAPTURA A-07
- **Pantalla:** `/admin/categories` con el modal **"+ Nueva categoría global"** abierto.
- **Cuenta a usar:** `admin@correo.com`.
- **Estado previo necesario:**
  - Pulsa **+ Nueva categoría global** y rellena el campo **Nombre** con "Educación" y selecciona Tipo = "Gasto".
- **Qué debe estar visible:**
  - Tabla al fondo (parcialmente cubierta por el modal).
  - Modal centrado con el título de creación, los campos Nombre y Tipo rellenados con los valores propuestos y los botones **Cancelar** y **Crear** (este último puede mostrarse en estado **"Guardando..."** si quieres reflejar la espera, pero en general muestra **Crear** o el equivalente en el código).
- **Qué NO debe aparecer:**
  - Datos sensibles.
- **Resolución y formato:**
  - 1440x900 mínimo, PNG, en idioma español.
- **Notas adicionales:**
  - Si la cuenta administradora no permite crear (por ejemplo en un entorno cerrado), basta con abrir el modal sin enviar la creación.
