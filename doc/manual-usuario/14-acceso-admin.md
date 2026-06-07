# Capítulo 14. Acceso al Panel de Administración

## Texto narrativo (para pegar en el .docx)

El **Panel de Administración** es el espacio reservado para las cuentas con rol `admin`. Está pensado para gestionar el sistema (usuarios, catálogos globales, métricas, bitácora) **sin acceder a la información financiera personal** de los usuarios finales. Esta separación de funciones (SoD, Separation of Duties) es uno de los pilares de seguridad de AhorroGo: el administrador puede activar o bloquear cuentas, pero no puede ver ni manipular las transacciones, presupuestos o reportes individuales.

### 14.1 Cómo se identifica un administrador

El rol del usuario se asigna en el momento del registro o por el propio sistema en la siembra inicial. Para los fines del manual usamos la cuenta de demostración **`admin@correo.com`**, que tiene rol `admin` y no tiene datos financieros personales asociados.

Cuando un administrador inicia sesión con sus credenciales en la pantalla común (`/`), el flujo es idéntico al de un usuario regular hasta que el backend devuelve la respuesta de login. La diferencia clave es que la respuesta indica `role: "admin"`, y el frontend redirige automáticamente a `/admin` en lugar de a `/dashboard`. Cualquier intento de un administrador de entrar a `/dashboard` u otra ruta de usuario se redirige también a `/admin` (es la guarda `UserRoute` la que lo hace en el cliente).

### 14.2 Estructura del Panel de Administración

Al entrar a `/admin` la aplicación carga el componente `AdminLayout`, con un diseño distinto al de la zona de usuario:

- **Barra superior (topbar) con tema teal.** A la izquierda muestra **"AhorroGo · Panel admin"** como marca; a la derecha el saludo **"Hola, [nombre]"** seguido de dos botones: **"👤 Vista como usuario"** (que abre el modo de previsualización del Capítulo 19) y **"Cerrar sesión"** (que limpia el token y devuelve a la pantalla pública).
- **Sidebar fija** de 240 píxeles a la izquierda, con cuatro entradas de navegación:
  - **📊 Métricas** → `/admin/metrics`.
  - **👥 Usuarios** → `/admin/users`.
  - **🏷️ Categorías globales** → `/admin/categories`.
  - **📋 Auditoría** → `/admin/audit`.
- **Área principal** donde se renderiza la sección activa.

La identidad visual del panel es claramente distinta a la del usuario: el color teal predomina en el sidebar y la sección activa se marca con fondo teal-50, texto teal-800 y peso de fuente en negrita.

### 14.3 Cómo se aplica la separación de funciones

A nivel de servidor, los administradores tienen vetado el acceso a todos los endpoints orientados a la operación financiera de los usuarios. Esto incluye:

- **Transacciones**: `POST/GET/PUT/DELETE /api/transactions/*` responden con código 403 y el mensaje **"Esta operacion no esta disponible para administradores. El administrador no puede operar como usuario final del sistema."**
- **Presupuestos**: las mismas operaciones bajo `/api/budgets/*` están bloqueadas.
- **Reportes**: tanto `/api/reports/overview`, `/api/reports/insights`, `/api/reports/transactions/export` como `/api/reports/exports` rechazan a los administradores.
- **Módulo de aprendizaje**: los endpoints de estado de aprendizaje y consejos IA tampoco están disponibles para administradores.

Esto se complementa con la restricción inversa: las rutas bajo `/api/admin/*` solo aceptan cuentas con rol `admin`. Cualquier intento por parte de un usuario regular responde con código 403 y **"No autorizado: rol insuficiente"**.

En la práctica esto significa que **no existe una sola pantalla del panel donde aparezcan montos individuales**. Los conteos y agregados que verá el administrador en los siguientes capítulos son siempre globales y anónimos.

### 14.4 Por qué esto importa

Esta separación cumple dos objetivos: por un lado **protege la privacidad financiera del usuario**, ya que ni siquiera el administrador puede consultar tu historial de transacciones; por otro **mantiene la integridad del sistema**, ya que evita que un solo perfil pueda crear datos, validarlos y luego analizarlos sin ningún control. En el flujo académico del curso Integrador I, este modelo es el equivalente práctico al control de "principio de mínimo privilegio".

## Lista de capturas a tomar

### CAPTURA A-01
- **Pantalla:** Pantalla de inicio de sesión (`/`) tras introducir las credenciales de administrador.
- **Cuenta a usar:** `admin@correo.com`.
- **Estado previo necesario:**
  - Sesión cerrada.
  - Tener el cursor justo encima del botón **Entrar** o el botón en estado **"Ingresando..."** para evidenciar el inicio de sesión.
- **Qué debe estar visible:**
  - Pantalla **"Iniciar sesion"** con el campo Correo lleno con `admin@correo.com` y el campo Contraseña enmascarado pero claramente con contenido.
  - Botón **Entrar** (o **"Ingresando..."**) bien visible.
- **Qué NO debe aparecer:**
  - La contraseña en texto plano.
  - Toasts ni errores.
- **Resolución y formato:**
  - 1440x900 mínimo, PNG, en idioma español.
- **Notas adicionales:**
  - Inmediatamente después de pulsar **Entrar** el sistema redirige a `/admin`. La captura puede tomarse justo antes para mostrar el detalle "admin@correo.com" en el campo de correo.

### CAPTURA A-02
- **Pantalla:** `/admin/metrics` (vista inicial del Panel de Administración).
- **Cuenta a usar:** `admin@correo.com`.
- **Estado previo necesario:**
  - Iniciar sesión con la cuenta administradora.
  - Esperar a que se carguen las métricas iniciales.
- **Qué debe estar visible:**
  - Topbar con **"AhorroGo · Panel admin"** y los botones **"👤 Vista como usuario"** y **"Cerrar sesión"**.
  - Sidebar con las cuatro entradas (📊 Métricas, 👥 Usuarios, 🏷️ Categorías globales, 📋 Auditoría) y la entrada **Métricas** marcada como activa.
  - Área principal con la cabecera **"Panel de control"** y el subtítulo **"Resumen del sistema (datos agregados, sin información personal)"**.
- **Qué NO debe aparecer:**
  - Datos financieros individuales (no debe haber montos por usuario).
  - Modales abiertos.
- **Resolución y formato:**
  - 1440x900 mínimo, PNG, en idioma español.
- **Notas adicionales:**
  - Esta captura sirve para presentar la "primera mirada" del panel; en el Capítulo 15 se documentarán las métricas en detalle.
