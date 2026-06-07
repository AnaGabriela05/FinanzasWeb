# Capítulo 19. Modo «Vista como usuario»

## Texto narrativo (para pegar en el .docx)

El modo **"Vista como usuario"** es una característica pensada para que el administrador pueda **previsualizar la interfaz que verán los usuarios finales** sin operar con datos reales. Es útil para soporte, documentación, capturas de pantalla, capacitaciones y validación visual tras cambios. Pero su diseño es muy claro respecto al límite: el administrador **no puede crear, editar ni borrar nada** mientras está en este modo, y el backend refuerza esa restricción.

### 19.1 Cómo se activa

Desde el Panel de Administración pulsa el botón **"👤 Vista como usuario"** que aparece en la barra superior, junto al saludo. Esa acción te lleva a la URL `/admin/preview/dashboard` y el frontend monta el componente **`PreviewLayout`**, que envuelve las páginas de usuario regulares (Dashboard, Categorías, Métodos de pago, Transacciones, Presupuestos, Reportes, Aprendizaje) bajo una experiencia restringida.

### 19.2 Cómo se reconoce el modo

En la parte superior aparece una **banda fija (sticky banner)** con un fondo ámbar y bordes ámbar claros, que dice textualmente:

> **"🔍 Modo vista previa · Estás viendo la app como la verá un usuario. Los datos personales mostrados son vacíos o de demostración. Ninguna acción de creación está habilitada."**

A la derecha del banner hay un botón **"← Volver al panel admin"** que devuelve al administrador a `/admin`.

Además, dentro del menú propio del Layout de usuario que verás más abajo, el botón habitual **Salir** cambia su texto a **"Volver al panel"** y, en lugar de cerrar sesión, te lleva de nuevo a `/admin`. Esto evita que el administrador cierre accidentalmente su sesión administradora mientras explora la vista de usuario.

### 19.3 Qué se ve

Las pantallas que se muestran son las mismas que verá un usuario real, pero los datos suelen estar **vacíos o ser de demostración** porque la cuenta administradora no tiene transacciones, presupuestos ni reportes propios. En particular:

- El **Dashboard** muestra el mensaje empty-state **"Estado inicial vacío. Así verá esta pantalla un usuario recién registrado."** cuando no hay datos.
- Las pantallas de **Transacciones**, **Presupuestos** y **Reportes** se renderizarán con sus formularios habituales, pero las acciones de creación/edición/eliminación están deshabilitadas en el cliente.

### 19.4 Por qué nada se puede crear

Esta es la parte clave para entender el modo. Aunque la interfaz oculte o deshabilite los botones de acción, el backend mantiene su barrera de Separación de Funciones: como la cuenta sigue teniendo rol `admin`, cualquier intento de llegar a `/api/transactions`, `/api/budgets`, `/api/reports/*` o `/api/learning/*` responderá con código **403** y el mensaje **"Esta operacion no esta disponible para administradores. El administrador no puede operar como usuario final del sistema."**.

Es decir, hay **doble protección**:

1. La interfaz informa visualmente al administrador y deshabilita los disparadores.
2. El servidor rechaza la solicitud aunque alguien intentara forzarla.

Esto garantiza que el administrador nunca pueda generar datos personales en nombre de un usuario, ni siquiera por accidente.

### 19.5 Cómo se reconoce internamente

El propio frontend usa el hook `usePreviewMode`, que detecta si la URL comienza con `/admin/preview/`. Ese hook le dice al `Layout` y a otras pantallas que:

- Adapten los enlaces de navegación para que apunten a sus equivalentes dentro de `/admin/preview/...`.
- Reemplacen el botón **Salir** por **"Volver al panel"**.
- Marquen ciertos controles como deshabilitados.

### 19.6 Cuándo conviene usarlo

- Para **revisar la experiencia tras un cambio de UI**.
- Para **tomar capturas de pantalla** del manual o presentaciones, sin necesidad de pedir prestada una cuenta de usuario.
- Para **explicar el sistema en demos** a partes interesadas (docentes, evaluadores), reforzando que ni siquiera el administrador ve datos personales reales.

## Lista de capturas a tomar

### CAPTURA A-09
- **Pantalla:** `/admin/preview/dashboard` con el banner ámbar visible.
- **Cuenta a usar:** `admin@correo.com`.
- **Estado previo necesario:**
  - Iniciar sesión con la cuenta administradora.
  - Pulsar el botón **"👤 Vista como usuario"** de la barra superior.
- **Qué debe estar visible:**
  - Banner sticky en la parte superior con el texto completo **"🔍 Modo vista previa · Estás viendo la app como la verá un usuario. Los datos personales mostrados son vacíos o de demostración. Ninguna acción de creación está habilitada."** y el botón **"← Volver al panel admin"** a la derecha.
  - Debajo del banner, el Dashboard en estado vacío con el mensaje "Estado inicial vacío. Así verá esta pantalla un usuario recién registrado." o, si la cuenta tiene datos sintéticos en preview, las tarjetas correspondientes.
  - El menú lateral o superior con la entrada **Dashboard** activa y, si está visible, el botón **"Volver al panel"** en lugar de **Salir**.
- **Qué NO debe aparecer:**
  - Datos personales reales de otros usuarios.
- **Resolución y formato:**
  - 1440x900 mínimo, PNG, en idioma español.
- **Notas adicionales:**
  - Es una de las capturas más importantes del bloque administrativo: refleja la promesa de SoD. Si el manual lo permite, puedes complementar esta captura con una segunda mostrando la página de Transacciones en preview con los botones de creación deshabilitados; documéntalo como nota A-09.b si se necesitara.
