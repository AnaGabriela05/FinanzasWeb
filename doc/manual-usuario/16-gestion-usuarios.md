# Capítulo 16. Gestión de usuarios

## Texto narrativo (para pegar en el .docx)

La sección **Usuarios** (ruta `/admin/users`, ícono **👥** del sidebar) es el espacio del administrador para gestionar las cuentas registradas. Aquí puedes buscar a un usuario, ver su detalle anonimizado, bloquear o desbloquear cuentas y resetear contadores de intentos fallidos. Es importante recordar que **los administradores no aparecen** en este listado: la pantalla solo muestra cuentas con rol `usuario`.

### 16.1 Encabezado y filtros

La cabecera tiene:

- **Título:** **"Usuarios"**.
- **Subtítulo:** **"Gestión de cuentas de usuario (los admins no aparecen aquí)"**.
- Badge **"Total: [count]"** con la cantidad de usuarios listados según los filtros activos.

Justo debajo están los filtros:

- **Buscar por correo o nombre.** Campo de texto libre que busca coincidencias parciales en `nombre` y `correo`.
- **Estado.** Desplegable con tres opciones: **"Todos"**, **"Activos"** y **"Bloqueados"**.

### 16.2 Tabla de usuarios

La tabla muestra ocho columnas:

| Columna | Descripción |
|--------|-------------|
| **Nombre** | Nombre del usuario (ordenable). |
| **Correo** | Correo del usuario (ordenable). En correos largos se aplica `break-all` para que entren en la celda. |
| **Rol** | Tipo de rol en mayúsculas (USUARIO). |
| **Registro** | Fecha de creación de la cuenta en formato corto (`dd-MMM-yyyy`, locale es-PE). Ordenable. |
| **Última actividad** | Fecha de última actualización del registro. Ordenable. |
| **Estado** | Pill de color: verde **"✓ Activo"** para cuentas operativas, ámbar **"⚠️ N fallidos"** cuando hay intentos fallidos acumulados sin bloqueo, rojo **"🔒 Bloqueado"** cuando la cuenta está bloqueada. |
| **# Transacciones** | Cantidad total de transacciones registradas por el usuario. Es un agregado, no un detalle de los montos. Ordenable. |
| **Acciones** | Botones contextuales (ver siguiente apartado). |

### 16.3 Acciones disponibles

Cada fila ofrece un set de botones que cambia según el estado:

- **Detalle.** Siempre disponible. Abre el modal **UserDetailModal** con un resumen completo del usuario (nombre, correo, rol, fecha de registro, último acceso, valor de `lockUntil` si aplica, número de intentos fallidos y conteos de transacciones, categorías, métodos y presupuestos del usuario). Es la única pantalla del panel donde se muestra el conteo agregado por usuario; nunca aparecen montos.
- **Bloquear** (rojo). Visible cuando el usuario está activo. Confirma con el modal **"Se bloqueará "[correo]" por 30 minutos."** y el botón **Bloquear** (peligro). El bloqueo manual dura **30 minutos** y queda registrado contra esa cuenta.
- **Desbloquear** (teal). Visible cuando el usuario está bloqueado. Confirma con **"Se desbloqueará "[correo]" inmediatamente."** y el botón **Desbloquear**.
- **Reset intentos** (ámbar). Visible cuando el usuario tiene intentos fallidos acumulados (mayores a cero) pero todavía no está bloqueado. Confirma con **"Se reseteará el contador de intentos fallidos de "[correo]"."** y el botón **Resetear**.

Todas estas acciones son operaciones administrativas reales contra la base de datos. Su efecto es inmediato: el usuario afectado verá el cambio en su próximo intento de inicio de sesión o en su próxima consulta.

### 16.4 Modal de detalle del usuario

El modal **UserDetailModal** organiza la información en bloques:

- **Datos básicos:** nombre, correo, rol, fecha de registro y fecha de último acceso.
- **Estado de seguridad:** valor de `lockUntil` (si está bloqueado), `failedLoginAttempts` (intentos fallidos acumulados) y el flag `bloqueado`.
- **Conteos de actividad:** `transactionCount`, `categoryCount`, `paymentMethodCount` y `budgetCount`. Solo cantidades, sin montos.

No hay desde aquí forma de cambiar la contraseña del usuario, ni de ver su historial financiero. Si un usuario olvida su contraseña, la versión actual del sistema no contempla un flujo automatizado de recuperación; corresponde al administrador crear, si fuera necesario, una nueva cuenta y comunicar la situación al usuario.

### 16.5 Cuándo bloquear y cuándo no

- **Bloquea** cuando detectes patrones sospechosos: incremento abrupto de intentos fallidos, correos que parecen automatizados, etc.
- **Desbloquea** cuando un usuario legítimo te contacte tras quedar bloqueado por intentos fallidos repetidos.
- **Resetea intentos** cuando un usuario haya cometido un error puntual al teclear su contraseña pero todavía no haya alcanzado el umbral de bloqueo; así no quedará a un paso del bloqueo automático.

## Lista de capturas a tomar

### CAPTURA A-04
- **Pantalla:** `/admin/users` (listado de usuarios con varias filas).
- **Cuenta a usar:** `admin@correo.com`.
- **Estado previo necesario:**
  - Iniciar sesión con la cuenta administradora.
  - Asegurarse de que existan al menos 5 o 6 usuarios, idealmente con estados variados: alguno con intentos fallidos (pill ámbar), alguno bloqueado (pill rojo) y el resto activos.
  - Mantener el filtro **Estado** en **"Todos"** para mostrar la mezcla.
- **Qué debe estar visible:**
  - Sidebar con **Usuarios** marcado como activo.
  - Encabezado **"Usuarios"** con el subtítulo **"Gestión de cuentas de usuario (los admins no aparecen aquí)"** y el badge **"Total: N"**.
  - Filtros de búsqueda y estado.
  - Tabla con todas las columnas y al menos cinco filas representativas, mostrando los tres tipos de pill de estado.
  - Botones de acciones (**Detalle**, **Bloquear**/**Desbloquear**/**Reset intentos** según corresponda) visibles en al menos una fila.
- **Qué NO debe aparecer:**
  - Modales abiertos.
  - Información personal real fuera del entorno de pruebas (usa nombres como "Usuario Demo", "Cuenta Prueba", etc.).
- **Resolución y formato:**
  - 1440x900 mínimo, PNG, en idioma español.
- **Notas adicionales:**
  - Si la base de datos del entorno de demostración no tiene usuarios bloqueados, fuerza el escenario antes de capturar: ingresa varias veces con una contraseña incorrecta hasta que la cuenta se bloquee, captura, y luego desbloquéala.

### CAPTURA A-05
- **Pantalla:** `/admin/users` con el modal de confirmación **Bloquear** abierto.
- **Cuenta a usar:** `admin@correo.com`.
- **Estado previo necesario:**
  - Pulsar **Bloquear** en la fila de una cuenta activa de prueba.
- **Qué debe estar visible:**
  - Tabla de usuarios al fondo.
  - Modal de confirmación con el título correspondiente y la descripción exacta **«Se bloqueará "usuario@ejemplo.com" por 30 minutos.»** (reemplazando el correo real por el de la cuenta de prueba).
  - Botones **Cancelar** y **Bloquear** (este último en tono de peligro).
- **Qué NO debe aparecer:**
  - Datos sensibles fuera de las cuentas de prueba.
- **Resolución y formato:**
  - 1440x900 mínimo, PNG, en idioma español.
- **Notas adicionales:**
  - Cancela el bloqueo después de capturar para no afectar a una cuenta real. Si necesitas mostrar también el modal de **Detalle**, considera intercambiarlo aquí o sumarlo como variante interna.
