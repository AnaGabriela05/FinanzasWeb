# Capítulo 1. Requisitos previos

## Texto narrativo (para pegar en el .docx)

Antes de empezar a usar AhorroGo conviene revisar que tu equipo y tu navegador cumplan unos requisitos mínimos. AhorroGo es una aplicación web; no se instala nada en tu computadora, basta con abrirla en un navegador moderno y conectarte a internet.

### Equipo y navegador

- **Computadora o laptop con conexión a internet.** La aplicación también funciona en dispositivos móviles porque su interfaz se adapta al ancho de pantalla, pero el manual está pensado para una experiencia de escritorio con resoluciones de 1440x900 o superiores.
- **Navegador moderno actualizado:** Google Chrome, Microsoft Edge, Mozilla Firefox o un navegador basado en Chromium reciente. AhorroGo utiliza React y JavaScript moderno, así que un navegador con dos o tres años de antigüedad es suficiente.
- **JavaScript habilitado.** Si por alguna razón tu navegador tiene deshabilitado JavaScript, la aplicación no podrá cargarse.
- **Cookies y almacenamiento local permitidos.** AhorroGo guarda tu sesión (token de acceso e información básica del usuario) en el almacenamiento local del navegador (`localStorage`). Si bloqueas el almacenamiento del sitio tendrás que iniciar sesión cada vez.

### Conexión y entorno de uso

- **Conexión estable a internet.** Todas las operaciones (crear una transacción, generar un reporte, recibir un consejo de IA, completar un quiz) hablan con el servidor en tiempo real.
- **Idioma del sistema:** la interfaz está en español. Las fechas se muestran en formato ISO (AAAA-MM-DD) o en el formato corto en español peruano (dd-mes-aaaa) según la pantalla.
- **Moneda base:** soles peruanos (PEN). Puedes registrar transacciones en dólares (USD) y la aplicación muestra automáticamente la equivalencia aproximada usando la tasa de cambio configurada en el servidor (3.75 PEN por USD por defecto).

### Lo que necesitas tener a la mano

- **Un correo electrónico válido** para crear tu cuenta. AhorroGo no envía correos de verificación, pero el correo es tu identificador único en el sistema y será exigido en formato válido (por ejemplo, `tucorreo@ejemplo.com`).
- **Una contraseña** que solo tú conozcas, de al menos seis caracteres. Más adelante, en el Capítulo 13, explicamos cómo se almacena de forma segura.
- **Una idea aproximada de tus categorías de gasto e ingreso y de los métodos de pago que utilizas** (efectivo, tarjetas, transferencias). Con eso podrás aprovechar mejor las primeras pantallas del sistema.

### Datos y privacidad

AhorroGo es una aplicación académica desarrollada en la Universidad Tecnológica del Perú para el curso Integrador I. No se comparte tu información financiera con terceros; los movimientos que registres permanecen asociados únicamente a tu usuario, y el rol de administrador no tiene acceso a tus montos individuales (esto se describe a fondo en la Parte II de este manual).

Con estos requisitos cubiertos, ya puedes pasar al Capítulo 2 y crear tu cuenta.

## Lista de capturas a tomar

Este capítulo no requiere capturas.
