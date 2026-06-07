# Resumen del manual de usuario AhorroGo

Este directorio contiene el contenido detallado del **Manual de Usuario AhorroGo**, listo para pegar en la plantilla `.docx` académica. Cada capítulo es un archivo Markdown independiente con dos secciones:

1. **Texto narrativo (para pegar en el .docx).** Contenido del capítulo en español, tono conversacional pero preciso, basado en lectura del código real del repositorio.
2. **Lista de capturas a tomar.** Instrucciones para tomar cada una de las 34 capturas con datos consistentes (cuentas `demo@correo.com` y `admin@correo.com`).

## Cuentas de demostración

- **Rol User:** `demo@correo.com` — datos sintéticos representativos para usuario regular.
- **Rol Admin:** `admin@correo.com` — sin datos financieros propios, por separación de funciones.

## Índice de capítulos

### Parte I — Usuario

| Cap. | Archivo | Tema | Capturas |
|------|---------|------|----------|
| 1 | [01-requisitos-previos.md](01-requisitos-previos.md) | Requisitos previos | — |
| 2 | [02-crear-cuenta.md](02-crear-cuenta.md) | Crear tu cuenta y primer ingreso | U-01, U-02, U-03, U-04 |
| 3 | [03-dashboard.md](03-dashboard.md) | Recorrido por el Dashboard | U-05, U-06 |
| 4 | [04-categorias.md](04-categorias.md) | Gestión de categorías | U-07, U-08, U-09 |
| 5 | [05-metodos-pago.md](05-metodos-pago.md) | Gestión de métodos de pago | U-10 |
| 6 | [06-transacciones.md](06-transacciones.md) | Registrar transacciones | U-11, U-12, U-13 |
| 7 | [07-presupuestos.md](07-presupuestos.md) | Crear y monitorear presupuestos | U-14, U-15 |
| 8 | [08-reportes.md](08-reportes.md) | Generar y exportar reportes | U-16, U-17 |
| 9 | [09-salud-financiera.md](09-salud-financiera.md) | Salud Financiera | U-18 |
| 10 | [10-aprendizaje.md](10-aprendizaje.md) | Módulo de Aprendizaje | U-19, U-20 |
| 11 | [11-consejos-ia.md](11-consejos-ia.md) | Consejos IA personalizados | U-21, U-22 |
| 12 | [12-quizzes.md](12-quizzes.md) | Quizzes y sistema de puntos | U-23, U-24 |
| 13 | [13-seguridad.md](13-seguridad.md) | Cerrar sesión y seguridad | U-25 |

### Parte II — Administrador

| Cap. | Archivo | Tema | Capturas |
|------|---------|------|----------|
| 14 | [14-acceso-admin.md](14-acceso-admin.md) | Acceso al Panel de Administración | A-01, A-02 |
| 15 | [15-metricas-admin.md](15-metricas-admin.md) | Métricas y KPIs del sistema | A-03 |
| 16 | [16-gestion-usuarios.md](16-gestion-usuarios.md) | Gestión de usuarios | A-04, A-05 |
| 17 | [17-categorias-globales.md](17-categorias-globales.md) | Gestión de categorías globales | A-06, A-07 |
| 18 | [18-bitacora.md](18-bitacora.md) | Bitácora de auditoría | A-08 |
| 19 | [19-vista-usuario.md](19-vista-usuario.md) | Modo «Vista como usuario» | A-09 |

### Documentos auxiliares

- [99-funcionalidades-adicionales.md](99-funcionalidades-adicionales.md): funcionalidades detectadas que no estaban en la plantilla del manual y discrepancias entre código y plantilla.
- [capturas-checklist.md](capturas-checklist.md): checklist consolidada de las 34 capturas en orden secuencial, para usar al momento de tomar las imágenes.

## Notas generales

- Todas las capturas deben tomarse en español, mínimo 1440x900, formato PNG.
- Mantener cerrado el menú hamburguesa en las versiones de escritorio.
- Cuando una pantalla requiera estado previo (por ejemplo, varias transacciones cargadas), conseguirlo con la cuenta `demo@correo.com` antes de capturar.
- En las cuentas de demostración, los datos son sintéticos. Si las semillas (`scripts/seed.js`, `scripts/seedQuizQuestions.js`) cambian, conviene regenerar capturas que dependan de valores concretos.

## Resumen técnico transversal (referencia rápida)

- **Backend:** Node.js + Express + Sequelize + SQLite. Estructura por capas (routes → controllers → services → repositories) con inyección de dependencias en `src/container.js`.
- **Frontend:** React 18 con React Router v6, BrowserRouter en `frontend/src/App.jsx`. Servicios HTTP centralizados en `frontend/src/lib/api.js`.
- **Autenticación:** JWT con expiración por defecto de 8 horas y hashing bcrypt (10 rondas).
- **Política de bloqueo:** 3 intentos fallidos por usuario activan bloqueo de 10 minutos; 10 intentos por IP cada 15 minutos para `/api/auth/*`.
- **Separación de funciones (SoD):** todas las rutas de uso financiero rechazan al rol `admin` y todas las rutas `/api/admin/*` rechazan a los usuarios regulares.
