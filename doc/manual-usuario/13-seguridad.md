# Capítulo 13. Cerrar sesión y seguridad

## Texto narrativo (para pegar en el .docx)

Esta sección reúne todo lo que un usuario regular debe saber sobre cómo cerrar su sesión y cómo AhorroGo protege su cuenta. Aunque el sistema gestiona la mayoría de las salvaguardas por su cuenta, conviene conocerlas para entender qué sucede cuando ves un mensaje de error o cuando vuelves a la app después de un tiempo.

### 13.1 Cómo cerrar sesión

En la barra superior, al final del menú de navegación, encontrarás el botón **Salir**. Al pulsarlo:

- Se borra el **token de sesión (JWT)** y los datos del usuario almacenados localmente en tu navegador (`localStorage`).
- La aplicación te redirige automáticamente a la pantalla de inicio de sesión (`/`).
- Cualquier petición posterior a la API ya no llevará el token, así que el servidor responderá con código 401 si alguien intenta reusar una URL interna.

Si cierras el navegador sin pulsar **Salir**, el token persiste en `localStorage` hasta que expira o hasta que lo borres explícitamente. AhorroGo no usa cookies HttpOnly: tu sesión vive en el almacenamiento del propio navegador.

### 13.2 Duración del token y expiración automática

El token JWT que se emite al iniciar sesión tiene una duración de **8 horas** (configurable en el servidor a través de la variable `JWT_EXPIRES_IN`). Cuando el token expira:

- Las llamadas a la API devolverán el código 401 con un mensaje del estilo **"Token inválido o expirado"**.
- La interfaz mostrará el error donde corresponda (en el Dashboard suele aparecer el bloque **"No se pudo cargar el dashboard"**).
- Tendrás que volver a iniciar sesión para que se emita un nuevo token.

### 13.3 Política de intentos fallidos y bloqueo

AhorroGo protege tu cuenta contra ataques por fuerza bruta con dos capas:

- **Por usuario:** después de **3 intentos fallidos consecutivos** en `/api/auth/login` tu cuenta queda **bloqueada durante 10 minutos**. Aparecerá el mensaje **"Cuenta bloqueada por 10 minutos por multiples intentos."** o, si vuelves a intentar mientras dura el bloqueo, **"Cuenta bloqueada por multiples intentos. Intenta de nuevo en ~X min."**. Estos valores se pueden ajustar desde el servidor con las variables `LOGIN_MAX_ATTEMPTS` y `LOGIN_LOCK_MINUTES`, pero la configuración por defecto es la mencionada.
- **Por dirección IP:** se permite un máximo de **10 intentos cada 15 minutos** sobre los endpoints de registro y login. Si se supera, todos los intentos desde esa IP reciben el mensaje **"Demasiados intentos. Intenta de nuevo en unos minutos."** durante la ventana correspondiente.

El bloqueo por usuario se libera solo al cumplirse el tiempo. Para liberarlo manualmente hace falta intervención del administrador (ver Capítulo 16).

### 13.4 Cómo se guarda tu contraseña

La contraseña que estableces nunca se guarda en texto plano. El servidor aplica un algoritmo de **hashing unidireccional con salt** estándar (bcrypt, 10 rondas por defecto). Esto significa que aunque alguien lograra acceder a la base de datos, no podría reconstruir tu contraseña original. Tampoco hay forma de "ver" la contraseña desde el panel administrativo: el administrador puede bloquear o desbloquear cuentas, pero no leer credenciales (Capítulo 16).

### 13.5 Cómo viaja tu información

Cada llamada a la API incluye el encabezado **`Authorization: Bearer [token]`**. Si despliegas AhorroGo en producción, asegúrate de hacerlo bajo HTTPS para que el token y los datos viajen cifrados en tránsito; en el entorno de desarrollo local de este curso, ambos extremos viven en `localhost`.

Las rutas internas están protegidas por dos middlewares:

- `auth`: comprueba que el token sea válido y no haya expirado.
- `requireRole` y `denyRole`: restringen ciertas rutas a usuarios con un rol específico (por ejemplo, todo `/api/admin/*` exige rol "admin") o las bloquean explícitamente para otros (por ejemplo, los administradores no pueden tocar `/api/transactions`).

### 13.6 Recomendaciones de buen uso

- **Cierra sesión cuando uses un equipo compartido.** Pulsa **Salir** en lugar de cerrar simplemente la pestaña.
- **No reutilices la contraseña de AhorroGo en otros servicios.** Aunque la guardemos cifrada, un compromiso en otro sitio podría afectarte indirectamente.
- **Vigila los mensajes de bloqueo.** Si recibes un mensaje de bloqueo sin haber intentado entrar, alguien más puede estar intentando acceder a tu cuenta: contacta al administrador del sistema.
- **Refresca la pantalla si algo se ve raro.** En particular, si el Dashboard muestra errores tras varias horas, probablemente tu token expiró: cierra sesión y vuelve a entrar.

## Lista de capturas a tomar

### CAPTURA U-25
- **Pantalla:** Cualquier vista interna (por ejemplo `/dashboard`) mostrando el botón **Salir** y, justo después de pulsarlo, la pantalla de inicio de sesión.
- **Cuenta a usar:** `demo@correo.com`.
- **Estado previo necesario:**
  - Iniciar sesión con la cuenta demo y situarse en el Dashboard.
- **Qué debe estar visible:**
  - Una captura cenital con el cursor sobre el botón **Salir** en la barra superior, dejando claro su ubicación.
  - Opcionalmente, una segunda toma de la pantalla `/` con el mensaje toast de aviso si la app lo entrega; si no, basta con la pantalla de inicio de sesión limpia tras el cierre.
- **Qué NO debe aparecer:**
  - Datos personales reales del autor del manual.
  - El menú hamburguesa abierto: el botón **Salir** se aprecia mejor en la barra desplegada de la versión escritorio.
- **Resolución y formato:**
  - 1440x900 mínimo, PNG, en idioma español.
- **Notas adicionales:**
  - Si decides incluir la doble toma (antes de pulsar Salir y después), prepara ambas con la misma resolución para que el manual las muestre alineadas.
