# Capítulo 2. Crear tu cuenta y primer ingreso

## Texto narrativo (para pegar en el .docx)

AhorroGo distingue dos tipos de usuario: el **usuario regular**, que registra y consulta sus propias finanzas, y el **administrador**, que gestiona el sistema sin tocar datos personales. Este capítulo te lleva paso a paso por la creación de una cuenta nueva (rol usuario) y por tu primer inicio de sesión.

### 2.1 Abrir la aplicación

Cuando ingresas a la dirección de AhorroGo en el navegador llegas a la pantalla de inicio de sesión. A la izquierda hay un panel de bienvenida con el lema "Ingresa y toma el control de tu dinero." y tres etiquetas que resumen las herramientas principales: **Transacciones**, **Presupuestos** y **Reportes**. A la derecha está el formulario de inicio de sesión con el título **"Iniciar sesion"** y el subtítulo **"Usa tu correo y tu contraseña."**.

Si aún no tienes cuenta, fíjate en el enlace inferior **"¿No tienes cuenta? Crear una"**. Al hacer clic en **Crear una** llegarás a la pantalla de registro.

### 2.2 Crear una cuenta nueva

La pantalla de registro reutiliza el mismo diseño en dos paneles. El panel izquierdo te recibe con la frase "Crea tu cuenta y empieza a controlar tu dinero." y tres badges: **Seguro**, **Personalizado** y **Rápido**. El panel derecho contiene el formulario **"Crear cuenta"** con el subtítulo **"Llena tus datos para registrarte."**.

El formulario tiene cuatro campos, todos obligatorios:

1. **Nombre.** Placeholder: "Tu nombre". Se exige que no esté vacío una vez recortados los espacios.
2. **Correo.** Placeholder: "tucorreo@ejemplo.com". Debe tener formato de correo válido; el sistema usa la validación estándar de `express-validator` y devuelve el mensaje **"Correo invalido"** cuando el formato no se reconoce.
3. **Contraseña.** Placeholder: "Mínimo 6 caracteres". La aplicación rechaza contraseñas de menos de seis caracteres tanto en el cliente como en el servidor; el mensaje de error visible es **"La contraseña debe tener al menos 6 caracteres"**.
4. **Confirmar contraseña.** Placeholder: "Repite tu contraseña". Debe coincidir exactamente con la anterior. Si difieren, el formulario muestra **"Las contraseñas no coinciden"** sin enviar la petición al servidor.

Al pulsar **Registrarme**, el botón cambia su texto a **"Creando cuenta..."** mientras se procesa la solicitud. Si el correo ya está registrado, el servidor responde con código 409 y el mensaje **"El correo ya esta registrado"**, que aparece en una alerta roja debajo del formulario.

Cuando el registro es exitoso, la aplicación te devuelve automáticamente a la pantalla de inicio de sesión y muestra un mensaje de éxito en forma de notificación verde (toast) que dice **"Cuenta creada correctamente. Inicia sesión."**.

> **Importante:** la contraseña se guarda en el servidor cifrada con un algoritmo de hashing estándar (bcrypt). Ni siquiera el equipo de desarrollo puede leerla en texto plano. Trátala como un secreto personal.

### 2.3 Iniciar sesión por primera vez

Con tu cuenta creada, vuelve al formulario **Iniciar sesion** e ingresa tu correo y tu contraseña. Al pulsar **Entrar** el botón cambia a **"Ingresando..."** durante unos instantes. Si los datos coinciden:

- El servidor devuelve un **token de sesión (JWT)** con duración de **8 horas** y los datos básicos de tu perfil.
- La aplicación guarda ese token y la información del usuario en el almacenamiento local del navegador.
- Te redirige automáticamente al **Dashboard** (`/dashboard`).

Si las credenciales son incorrectas verás en rojo el mensaje **"Credenciales invalidas"**. AhorroGo aplica una política simple de bloqueo: tras **3 intentos fallidos** la cuenta queda bloqueada durante **10 minutos** y verás un mensaje del tipo **"Cuenta bloqueada por 10 minutos por multiples intentos."** o, si ya estabas bloqueado, **"Cuenta bloqueada por multiples intentos. Intenta de nuevo en ~X min."**. El bloqueo se libera solo al cumplirse el tiempo; no hay forma de adelantarlo desde la pantalla de usuario.

Adicionalmente existe un límite de protección por dirección IP: **10 intentos cada 15 minutos** al endpoint de autenticación. Si lo superas verás el mensaje **"Demasiados intentos. Intenta de nuevo en unos minutos."**. Este límite protege contra ataques automatizados.

### 2.4 Después del primer ingreso

Una vez dentro, ya estás en el Dashboard. Más arriba aparece la barra superior con la marca **AhorroGo** y el subtítulo **"Tus finanzas, en orden"**. A la derecha tienes el menú principal (Dashboard, Categorias, Metodos de pago, Transacciones, Presupuestos, Reportes, Aprendizaje) y el botón **Salir** para cerrar sesión. En pantallas pequeñas la barra colapsa y aparece un botón con el icono de hamburguesa.

> **Para esta primera vez te recomendamos:**
> 1. Recorrer brevemente el Dashboard (Capítulo 3) para familiarizarte con la idea de "salud financiera".
> 2. Crear al menos dos o tres **categorías personales** antes de registrar transacciones (Capítulo 4).
> 3. Definir uno o dos **métodos de pago** que utilices habitualmente (Capítulo 5).
> 4. Recién entonces registrar tu primera transacción (Capítulo 6).

## Lista de capturas a tomar

### CAPTURA U-01
- **Pantalla:** `/` (pantalla de inicio de sesión, sin sesión activa).
- **Cuenta a usar:** no aplica (sesión cerrada).
- **Estado previo necesario:**
  - Cerrar cualquier sesión activa antes de tomar la captura.
  - Borrar el almacenamiento local del sitio para asegurar que aparezca la pantalla pública.
- **Qué debe estar visible:**
  - Panel izquierdo con el lema "Ingresa y toma el control de tu dinero." y los badges Transacciones, Presupuestos, Reportes.
  - Panel derecho con el título **"Iniciar sesion"**, el subtítulo "Usa tu correo y tu contraseña.", los campos Correo y Contraseña vacíos, el botón **Entrar** y el enlace **"¿No tienes cuenta? Crear una"**.
- **Qué NO debe aparecer:**
  - Ningún correo recordado por el navegador (limpiar el autocompletado o usar pestaña en incógnito).
  - Toasts o mensajes de error.
- **Resolución y formato:**
  - 1440x900 mínimo, PNG, en idioma español.
- **Notas adicionales:**
  - Captura completa de la pantalla, no solo del formulario.

### CAPTURA U-02
- **Pantalla:** `/register` (formulario de registro).
- **Cuenta a usar:** no aplica (sesión cerrada).
- **Estado previo necesario:**
  - Llegar desde la pantalla de inicio de sesión haciendo clic en **Crear una** o ingresar directamente a `/register`.
- **Qué debe estar visible:**
  - Panel izquierdo con el lema "Crea tu cuenta y empieza a controlar tu dinero." y los badges Seguro, Personalizado, Rápido.
  - Panel derecho con el título **"Crear cuenta"**, los cuatro campos (Nombre, Correo, Contraseña, Confirmar contraseña) con sus placeholders correspondientes, el botón **Registrarme** y el enlace **"¿Ya tienes cuenta? Inicia sesión"**.
- **Qué NO debe aparecer:**
  - Campos rellenados con datos personales reales del autor del manual.
  - Alertas o mensajes.
- **Resolución y formato:**
  - 1440x900 mínimo, PNG, en idioma español.
- **Notas adicionales:**
  - Toma la captura con los campos vacíos para mostrar los placeholders.

### CAPTURA U-03
- **Pantalla:** `/register` (formulario con un error de validación).
- **Cuenta a usar:** no aplica.
- **Estado previo necesario:**
  - Rellenar Nombre con "Demo", Correo con "demo@correo.com", Contraseña con "abcdef" y Confirmar contraseña con "abcde**g**" (distinta).
  - Pulsar **Registrarme** para activar la validación cliente.
- **Qué debe estar visible:**
  - Alerta roja con el texto exacto **"Las contraseñas no coinciden"**.
  - Botón **Registrarme** habilitado de nuevo (no en estado "Creando cuenta...").
- **Qué NO debe aparecer:**
  - Datos sensibles reales.
- **Resolución y formato:**
  - 1440x900 mínimo, PNG, en idioma español.
- **Notas adicionales:**
  - El propósito es documentar el formato típico de error inline; si prefieres mostrar otro mensaje (por ejemplo "La contraseña debe tener al menos 6 caracteres"), repite con una contraseña corta.

### CAPTURA U-04
- **Pantalla:** `/` (inicio de sesión después de registrar la cuenta).
- **Cuenta a usar:** no aplica (la captura debe mostrarse antes de iniciar sesión).
- **Estado previo necesario:**
  - Completar el registro con un correo nuevo (por ejemplo `demo-temporal@correo.com`).
  - Justo después del registro la app redirige a `/` y muestra el toast verde **"Cuenta creada correctamente. Inicia sesión."**.
- **Qué debe estar visible:**
  - Pantalla de inicio de sesión con el toast verde sobre la esquina inferior derecha o donde corresponda según el componente Toast.
  - Campos del formulario vacíos.
- **Qué NO debe aparecer:**
  - Datos en los campos.
- **Resolución y formato:**
  - 1440x900 mínimo, PNG, en idioma español.
- **Notas adicionales:**
  - Si el toast desaparece antes de que captures, repite el flujo o ajusta temporalmente la duración del toast desde DevTools; el texto debe mostrarse íntegro.
