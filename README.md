# AhorroGo

Sistema web de gestión de finanzas personales: registra ingresos y gastos, organízalos por categoría y método de pago, define presupuestos mensuales, consulta reportes con gráficos y exporta a PDF/Excel. Incluye un módulo de aprendizaje con videos y notas personales.

## Stack

- **Backend**: Node.js + Express + Sequelize (SQLite) + JWT + bcrypt
- **Frontend**: React 19 + Vite + react-router
- **Reportes**: pdfkit + chartjs-node-canvas + exceljs
---

## Tabla de contenidos

1. [Resumen ](#1-resumen-)
2. [Características principales](#2-características-principales)
3. [Stack tecnológico](#3-stack-tecnológico)
4. [Arquitectura del sistema](#4-arquitectura-del-sistema)
5. [Estructura del proyecto](#5-estructura-del-proyecto)
6. [Requisitos previos](#6-requisitos-previos)
7. [Instalación y ejecución](#7-instalación-y-ejecución)
8. [Variables de entorno](#8-variables-de-entorno)
9. [Scripts disponibles](#9-scripts-disponibles)
10. [Modelo de datos](#10-modelo-de-datos)
11. [API REST](#11-api-rest)
12. [Salud Financiera — cálculo](#12-salud-financiera--cálculo)
13. [Seguridad](#13-seguridad)
14. [Despliegue](#14-despliegue)
15. [Equipo y contexto académico](#15-equipo-y-contexto-académico)
16. [Licencia](#16-licencia)

---

## 1. Resumen 

**AhorroGo** es una aplicación web de finanzas personales que permite a los usuarios registrar ingresos y gastos, organizarlos por categoría y método de pago, definir presupuestos mensuales, analizar su comportamiento financiero mediante reportes y exportar la información en formato PDF o Excel. Incluye un módulo de aprendizaje con videos y notas personales para fomentar la educación financiera.

El sistema fue desarrollado como Producto Mínimo Viable (MVP) en el marco del curso **Integrador I — Sistemas Software** de la Universidad Tecnológica del Perú, sección 22007, durante el ciclo 2026.

---

## 2. Características principales

- **Autenticación segura** con JWT y bloqueo automático por intentos fallidos
- **Soporte multi-moneda** (Soles PEN como moneda base, Dólares USD con conversión aproximada)
- **Indicador visual de salud financiera** tipo semáforo (rojo / amarillo / verde / neutral) calculado en backend
- **Dashboard interactivo** con KPIs y gráficos dinámicos (Recharts)
- **Reportes filtrados** con exportación a PDF (con gráficos) y Excel
- **Auditoría de exportaciones** persistida en base de datos
- **Categorías globales** (creadas por el administrador) y **personales** del usuario
- **Módulo de aprendizaje** con notas y checklist persistentes por video
- **Consejos personalizados por IA** mediante integración con OpenAI API

---

## 3. Stack tecnológico

### Backend

| Tecnología | Versión | Uso |
|---|---|---|
| Node.js | ≥ 20.19 | Runtime de JavaScript |
| Express | 4.x | Framework HTTP |
| Sequelize | 6.x | ORM |
| SQLite | 3.x | Base de datos relacional embebida |
| jsonwebtoken | — | Autenticación stateless (JWT) |
| bcryptjs | — | Hash de contraseñas |
| express-validator | — | Validación declarativa de requests |
| express-rate-limit | — | Protección contra fuerza bruta |
| pdfkit + chartjs-node-canvas | — | Generación de PDF con gráficos |
| exceljs | — | Exportación a Excel |
| morgan | — | Logging HTTP |

### Frontend

| Tecnología | Versión | Uso |
|---|---|---|
| React | 19 | Librería UI |
| Vite | 8 | Build tool y dev server |
| react-router-dom | 7 | Routing SPA |
| Tailwind CSS | — | Sistema de estilos utility-first |
| Recharts | — | Gráficos dinámicos |
| Axios | — | Cliente HTTP |

### Servicios externos

| Servicio | Uso |
|---|---|
| OpenAI API | Generación de consejos financieros personalizados (RF-10) |

---

## 4. Arquitectura del sistema

El sistema sigue el **patrón de capas** con separación estricta entre frontend, backend, base de datos y servicios externos.

```
┌─────────────────────────────────────────────────────────────────┐
│                    FRONTEND (Navegador Web)                     │
│              SPA — React 19 + Vite + Tailwind CSS               │
│  ┌────────────┐  ┌──────────────┐  ┌──────────────────────┐    │
│  │ UI/Gráficos│  │ Enrutamiento │  │ Cliente HTTP (Axios) │    │
│  └────────────┘  └──────────────┘  └──────────────────────┘    │
└───────────────────────────┬─────────────────────────────────────┘
                            │ HTTP/REST (JSON)
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│                  BACKEND (Servidor Node.js)                     │
│                   API REST — Express.js                         │
│  ┌────────────────────────────────────────────────────────┐    │
│  │ Seguridad y Core: CORS · dotenv · Rutas                │    │
│  ├──────────────────────────┬─────────────────────────────┤    │
│  │ Autenticación            │ Herramientas                │    │
│  │ JWT · bcrypt · Lockout   │ pdfkit · exceljs · chartjs  │    │
│  ├──────────────────────────┴─────────────────────────────┤    │
│  │ Lógica de Negocio: Services                            │    │
│  │ (Auth · Transaction · Report · Budget · Category…)     │    │
│  ├────────────────────────────────────────────────────────┤    │
│  │ Capa de Datos: Sequelize ORM · Repositorios            │    │
│  ├────────────────────────────────────────────────────────┤    │
│  │ Domain Helpers: FinancialHealthAnalyzer ·              │    │
│  │ PasswordHasher · TokenIssuer · LoginAttemptPolicy      │    │
│  └─────────┬──────────────────────────────────────┬───────┘    │
└────────────┼──────────────────────────────────────┼─────────────┘
             │ SQL                                  │ REST
             ▼                                      ▼
   ┌──────────────────┐                  ┌──────────────────┐
   │  BASE DE DATOS   │                  │  OpenAI API      │
   │     SQLite       │                  │ (Consejos IA)    │
   └──────────────────┘                  └──────────────────┘
```

### Responsabilidades por capa

- **Routes** — declaran endpoints REST y aplican middlewares (auth, validators)
- **Controllers** — extraen datos del request, llaman al service y delegan la respuesta a `BaseController.execute`. Sin lógica de negocio.
- **Services** — contienen las reglas de negocio. Reciben DTOs simples (no tocan `req` / `res`)
- **Repositories** — único punto que toca los modelos Sequelize. Abstrae el ORM.
- **Domain helpers** — encapsulan lógica técnica reutilizable
- **Composition Root** (`src/container.js`) — instancia repositorios, servicios y controladores e inyecta dependencias

---

## 5. Estructura del proyecto

```
AhorroGo/
├── src/                              ← Backend
│   ├── config/
│   │   ├── auth.js                   ← Configuración JWT y políticas
│   │   ├── currency.js               ← Tasa de cambio USD→PEN
│   │   └── database.js               ← Conexión Sequelize a SQLite
│   ├── controllers/
│   │   ├── BaseController.js         ← execute() unificado
│   │   ├── classes/                  ← Controladores reales (clases)
│   │   └── *.js                      ← Proxies hacia el container
│   ├── domain/
│   │   ├── analyzers/                ← FinancialHealthAnalyzer
│   │   ├── auth/                     ← PasswordHasher, TokenIssuer, LoginAttemptPolicy
│   │   ├── exporters/                ← PdfReportExporter, ExcelReportExporter
│   │   └── resolvers/                ← CategoryDependencyResolver, etc.
│   ├── errors/
│   │   └── HttpError.js              ← Error tipado con status + details
│   ├── middlewares/
│   │   ├── auth.js                   ← Verificación JWT
│   │   └── validateRequest.js        ← Resultado de express-validator
│   ├── models/                       ← Sequelize models
│   ├── repositories/                 ← Acceso a datos
│   ├── routes/                       ← Endpoints REST
│   ├── services/                     ← Lógica de negocio
│   ├── validators/                   ← Reglas express-validator
│   ├── app.js                        ← Express app
│   └── container.js                  ← Composition Root (DI)
├── frontend/                         ← Frontend React
│   ├── src/
│   │   ├── components/
│   │   │   ├── Layout.jsx            ← Navbar + main + hamburguesa
│   │   │   ├── Modal.jsx, ConfirmModal.jsx, DependencyActionModal.jsx
│   │   │   ├── Skeleton.jsx          ← Skeletons de carga
│   │   │   ├── Toast.jsx             ← Sistema de toasts
│   │   │   ├── learning/
│   │   │   └── report/
│   │   ├── data/videos.js            ← Catálogo de videos
│   │   ├── lib/
│   │   │   ├── api.js                ← Cliente fetch wrapper
│   │   │   ├── auth.js               ← Token + user en localStorage
│   │   │   └── currency.js           ← Formato de monedas + tasa
│   │   ├── pages/                    ← Login, Register, Dashboard, etc.
│   │   ├── routes/PrivateRoute.jsx
│   │   ├── services/                 ← Clientes API por módulo
│   │   ├── App.jsx, main.jsx, App.css
│   └── vite.config.js                ← Proxy /api → :3000
├── scripts/
│   ├── sync.js                       ← Recrea esquema BD
│   └── seed.js                       ← Inserta roles + usuarios demo
├── server.js                         ← Entrypoint del backend
├── database.sqlite                   ← Base de datos local
├── package.json
├── .env.example
├── .gitignore
└── README.md
```

---

## 6. Requisitos previos

Antes de instalar AhorroGo, asegúrate de tener instalado:

- **Node.js** versión `20.19` o superior (`22.12+` recomendado)
- **npm** (incluido con Node.js)
- **Git** para clonar el repositorio

Verifica tu instalación:

```bash
node --version    # debería mostrar v20.19.x o superior
npm --version     # debería mostrar 10.x o superior
git --version
```

---

## 7. Instalación y ejecución

### 7.1 Clonar el repositorio

```bash
git clone https://github.com/<usuario>/AhorroGo.git
cd AhorroGo
```

### 7.2 Configurar variables de entorno

Copia el archivo de plantilla y edítalo:

```bash
# Windows
copy .env.example .env

# macOS / Linux
cp .env.example .env
```

Edita `.env` con un editor de texto y ajusta los valores según tu entorno. La sección [Variables de entorno](#8-variables-de-entorno) detalla cada variable.

### 7.3 Instalar dependencias del backend

```bash
npm install
```

### 7.4 Preparar la base de datos

```bash
npm run db:sync     # crea las tablas (modo force)
npm run db:seed     # inserta roles + usuarios demo
```

### 7.5 Ejecutar el backend

```bash
npm run dev
```

El servidor backend quedará disponible en **http://localhost:3000**.

### 7.6 Instalar y ejecutar el frontend

En **otra terminal** (deja el backend corriendo):

```bash
cd frontend
npm install
npm run dev
```

La aplicación frontend quedará disponible en **http://localhost:5173**.

### 7.7 Credenciales de prueba

Después del seed están disponibles dos usuarios:

| Rol | Correo | Contraseña |
|---|---|---|
| Administrador | `admin@correo.com` | `admin123` |
| Usuario | `demo@correo.com` | `123456` |

> ⚠️ **No usar estas credenciales en producción.** Son únicamente para desarrollo local y validación académica.

---

## 8. Variables de entorno

El archivo `.env` controla la configuración del backend. Las variables se cargan con `dotenv` al arrancar el servidor.

| Variable | Default | Descripción |
|---|---|---|
| `PORT` | `3000` | Puerto del backend |
| `NODE_ENV` | `development` | Entorno de ejecución; en `production` exige `JWT_SECRET` |
| `DB_STORAGE` | `./database.sqlite` | Ruta del archivo SQLite |
| `JWT_SECRET` | `dev_secret` (warning) | Secreto para firmar tokens. **Cambiar obligatoriamente en producción** |
| `JWT_EXPIRES_IN` | `8h` | Duración del token (formato compatible con `jsonwebtoken`) |
| `LOGIN_MAX_ATTEMPTS` | `3` | Intentos fallidos antes del bloqueo |
| `LOGIN_LOCK_MINUTES` | `10` | Minutos que dura el bloqueo |
| `PASSWORD_HASH_ROUNDS` | `10` | Rounds de bcrypt para hash de contraseñas |
| `CORS_ORIGINS` | `http://localhost:5173` | Orígenes permitidos (coma-separados) |
| `EXCHANGE_USD_TO_PEN` | `3.75` | Tasa aproximada USD → PEN |
| `OPENAI_API_KEY` | _(opcional)_ | Clave para integración de consejos IA |

> 🔒 **Importante:** si `NODE_ENV=production` y `JWT_SECRET` no está configurado, la aplicación **falla al arrancar** intencionalmente como medida de seguridad.

---

## 9. Scripts disponibles

### Backend (`package.json` raíz)

| Script | Comando | Descripción |
|---|---|---|
| `dev` | `npm run dev` | Arranca el backend con hot-reload |
| `start` | `npm start` | Arranca el backend en modo producción |
| `db:sync` | `npm run db:sync` | Recrea el esquema de la base de datos (force) |
| `db:seed` | `npm run db:seed` | Inserta roles + usuarios demo |

### Frontend (`frontend/package.json`)

| Script | Comando | Descripción |
|---|---|---|
| `dev` | `npm run dev` | Servidor de desarrollo Vite |
| `build` | `npm run build` | Build de producción optimizado |
| `preview` | `npm run preview` | Previsualiza el build de producción |

---

## 10. Modelo de datos

El sistema cuenta con **9 entidades** alineadas con la implementación. La notación utilizada en el modelo entidad-relación es **Crow's Foot**.

### 10.1 Entidades

| # | Entidad | Tabla SQL | Propósito |
|---|---|---|---|
| 1 | Rol | `roles` | Catálogo de roles (admin, usuario) |
| 2 | Usuario | `users` | Datos personales + credenciales + control de bloqueo |
| 3 | Categoría | `categories` | Clasificación de movimientos (ingreso/gasto), global o personal |
| 4 | Método de pago | `payment_methods` | Medios con que el usuario registra sus movimientos |
| 5 | Transacción | `transactions` | Cada ingreso o gasto registrado |
| 6 | Presupuesto | `budgets` | Límite mensual de gasto por categoría |
| 7 | CategoríaOculta | `user_category_hides` | Tabla puente que permite ocultar categorías globales por usuario |
| 8 | EstadoAprendizaje | `learning_states` | Notas y checklist por video, persistidas por usuario |
| 9 | ExportaciónReporte | `export_logs` | Bitácora de exportaciones PDF/Excel realizadas |

### 10.2 Relaciones (resumen)

```
Rol           1───n  Usuario
Usuario       1───n  Categoría (personales)
Usuario       1───n  MétodoPago
Usuario       1───n  Transacción
Usuario       1───n  Presupuesto
Usuario       1───n  CategoríaOculta  n───1  Categoría
Usuario       1───n  EstadoAprendizaje
Usuario       1───n  ExportaciónReporte
Categoría     1───n  Transacción
Categoría     1───n  Presupuesto
MétodoPago    1───n  Transacción
```

### 10.3 Esquema físico

Resumen de columnas relevantes por tabla:

| Tabla | Columnas relevantes |
|---|---|
| `roles` | `id` (PK), `nombre` |
| `users` | `id` (PK), `roleId` (FK), `nombre`, `correo` (UNIQUE), `passwordHash`, `failedLoginAttempts`, `lockUntil` |
| `categories` | `id` (PK), `userId` (FK, NULL para globales), `nombre`, `tipo` ENUM, `global` BOOLEAN, `activo` BOOLEAN |
| `payment_methods` | `id` (PK), `userId` (FK), `nombre`, `activo` |
| `transactions` | `id` (PK), `userId`, `categoryId`, `paymentMethodId`, `fecha`, `monto` DECIMAL(12,2), `currency` ENUM('PEN','USD'), `descripcion` |
| `budgets` | `id` (PK), `userId`, `categoryId`, `montoMensual` DECIMAL(12,2), `mes` (1-12), `anio` + UNIQUE (user, category, mes, anio) |
| `user_category_hides` | `userId`, `categoryId`, `hidden` + UNIQUE (user, category) |
| `learning_states` | `id` (PK), `userId`, `videoId`, `notes`, `checklist` (JSON) + UNIQUE (user, video) |
| `export_logs` | `id` (PK), `userId`, `formato`, `desde`, `hasta`, `categoryId`, `paymentMethodId`, `transactionType`, `nombreArchivo`, `createdAt` |

### 10.4 Justificación de normalización

- **1FN — atomicidad:** todas las columnas son atómicas. La columna `checklist` de `learning_states` guarda JSON serializado por decisión de diseño (datos siempre del mismo usuario+video, no se consultan entre filas).
- **2FN — sin dependencias parciales:** todas las PKs son `id` autoincrement (simples). La única tabla con PK compuesta (`user_category_hides`) tiene su único atributo no clave (`hidden`) dependiente de la combinación completa.
- **3FN — sin dependencias transitivas:** `tipo` y `global` en `categories` son enumeraciones cerradas sin atributos derivados.

---

## 11. API REST

### 11.1 Endpoints públicos

| Método | Ruta | Descripción |
|---|---|---|
| `GET` | `/api/health` | Verificación del servicio |
| `GET` | `/api/config/currency` | Tasa actual USD → PEN |
| `POST` | `/api/auth/register` | Registrar un nuevo usuario |
| `POST` | `/api/auth/login` | Iniciar sesión y obtener JWT |

### 11.2 Endpoints autenticados

> Todos los endpoints requieren header: `Authorization: Bearer <token>`

| Método | Ruta | Descripción |
|---|---|---|
| `GET / POST / PUT / DELETE` | `/api/categories` | CRUD de categorías |
| `GET` | `/api/categories/:id/usage` | Cuenta dependencias de una categoría |
| `POST` | `/api/categories/:id/restore` | Restaurar categoría global oculta |
| `GET / POST / PUT / DELETE` | `/api/payment-methods` | CRUD de métodos de pago |
| `GET / POST / PUT / DELETE` | `/api/transactions` | CRUD de transacciones (con paginación opcional) |
| `GET / POST / PUT / DELETE` | `/api/budgets` | CRUD de presupuestos |
| `GET` | `/api/reports/insights` | Análisis de transacciones del rango |
| `GET` | `/api/reports/overview` | Datos completos del dashboard |
| `GET` | `/api/reports/transactions/export?format=pdf\|xlsx` | Exporta reporte filtrado |
| `GET` | `/api/reports/exports` | Historial de exportaciones |
| `GET / PUT` | `/api/learning/:videoId/state` | Notas y checklist por video |
| `GET` | `/api/roles` | Listar roles del sistema |

### 11.3 Ejemplo de uso — Iniciar sesión

```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "correo": "demo@correo.com",
    "password": "123456"
  }'
```

**Respuesta exitosa (200 OK):**

```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 2,
    "correo": "demo@correo.com",
    "nombre": "Usuario Demo",
    "role": "usuario"
  }
}
```

### 11.4 Ejemplo de uso — Crear una transacción

```bash
curl -X POST http://localhost:3000/api/transactions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{
    "fecha": "2026-05-10",
    "monto": 250.50,
    "currency": "PEN",
    "descripcion": "Compra mensual de víveres",
    "categoryId": 3,
    "paymentMethodId": 1
  }'
```

---

## 12. Salud Financiera — cálculo

El score 0-100 se calcula en backend a partir de **4 métricas ponderadas**, sobre una ventana de análisis de **90 días** (configurable).

| Métrica | Peso | Cálculo |
|---|---|---|
| Tasa de ahorro | **40 %** | `(ingresos − gastos) / ingresos` |
| Gastos / Ingresos | **30 %** | ratio de gastos sobre ingresos |
| Cumplimiento de presupuesto | **20 %** | desfase relativo vs presupuesto activo del mes |
| Carga de deuda | **10 %** | gastos en categorías "deuda/crédito/tarjeta/préstamo/cuota" / ingresos |

### Niveles del semáforo

| Color | Condición |
|---|---|
| 🔴 **Rojo** | Gastos > ingresos, saldo negativo o score < 50 |
| 🟡 **Amarillo** | Score < 75 o gastos ≥ 90 % de ingresos |
| 🟢 **Verde** | Score ≥ 75 con margen sano |
| ⚪ **Neutral** | Sin datos suficientes en el período |

### Casos especiales

- **Sin transacciones** → estado neutral, no rojo
- **Sin ingresos pero con gastos** → `expenseRatio = ∞` (penaliza)
- **Sin presupuestos definidos** → excluye la métrica de cumplimiento y renormaliza pesos

---

## 13. Seguridad

El sistema implementa los siguientes controles a nivel de aplicación y base de datos:

### Autenticación

- **Hash de contraseñas** con `bcrypt` (10 rounds, configurable)
- **JWT firmado** con secreto en `JWT_SECRET`
  - Obligatorio en producción: la app **falla al arrancar** si `NODE_ENV=production` y no está definido
- **Política de bloqueo:** 3 intentos fallidos consecutivos → 10 minutos de lockout
- **Rate limiting por IP:** 10 peticiones cada 15 minutos en `/api/auth/*`

### Protección de la API

- **CORS restringido** a orígenes en `CORS_ORIGINS`
- **Validación declarativa** en todas las rutas (`express-validator`)
- **Aislamiento de datos por usuario:** services validan ownership antes de cualquier mutación
- **Consultas parametrizadas:** Sequelize escapa parámetros automáticamente (anti SQL injection)

### Controles a nivel de base de datos

| Mecanismo | Implementación |
|---|---|
| Unicidad de correo | `UNIQUE` en `users.correo` previene cuentas duplicadas y enumeración |
| Constraint CHECK | `monto > 0`, `mes BETWEEN 1 AND 12`, `hasta >= desde` |
| Auditoría | Tabla `export_logs` registra todas las descargas con timestamp y filtros |

> ⚠️ **Aviso académico:** este sistema es un MVP educativo. Para un despliegue real en producción se recomienda añadir: HTTPS obligatorio (TLS), Helmet con CSP estricta, refresh tokens, rotación de secretos, monitoreo de seguridad y auditorías OWASP ASVS nivel 2 como mínimo.

---

## 14. Despliegue

### Despliegue recomendado (académico)

| Capa | Servicio | Plan |
|---|---|---|
| Frontend | [Vercel](https://vercel.com/) | Hobby (gratuito) |
| Backend | [Railway](https://railway.app/) | Trial (gratuito limitado) |
| Repositorio | [GitHub](https://github.com/) | Público o privado |
| CI/CD | GitHub Actions / Vercel auto-deploy | — |

### Migración a otra base de datos

El diseño permite migrar de SQLite a MySQL o PostgreSQL **sin tocar el código de aplicación**, ya que Sequelize abstrae el motor. Solo es necesario:

1. Actualizar `src/config/database.js` con el nuevo dialect
2. Ajustar variables de entorno (`DB_HOST`, `DB_USER`, `DB_PASSWORD`, etc.)
3. Ejecutar las migraciones / `db:sync` contra el nuevo motor

---

## 15. Equipo y contexto académico

### Información académica

| Campo | Detalle |
|---|---|
| Universidad | Universidad Tecnológica del Perú (UTP) |
| Facultad | Facultad de Ingeniería |
| Curso | Integrador I — Sistemas Software |
| Sección | 22007 |
| Ciclo | 2026 |
| Docente | Ruby Donna Villaseca Núñez |

### Equipo de desarrollo

| Integrante | Rol |
|---|---|
| Ana Gabriela Vilchez Sullón | Patrocinadora / Cofundadora |
| Vicente Abel Paz Vílchez | Director del Proyecto |

### Documentación complementaria

- **Avance de Proyecto Final 1 (APF1):** análisis del contexto, alternativas, requerimientos SRS y diseño preliminar
- **Avance de Proyecto Final 2 (APF2):** modelado BPMN, diseño lógico y físico de BD, diagrama de clases, prototipos UX/UI
- **Anexo Casos de Uso:** especificación detallada de los 12 casos de uso (CU-01 a CU-12)
- **Anexo Notación BPMN:** notación BPM utilizada y ejemplo paso a paso del proceso Inicio de Sesión
- **Anexo Mapeo de Reportes:** identificación y priorización de los 7 reportes del sistema según formato S07

---

## 16. Licencia

Proyecto académico desarrollado para el curso **Integrador I — Sistemas Software** de la Universidad Tecnológica del Perú. Uso restringido al ámbito académico y educativo. La reproducción, distribución o uso comercial requiere autorización explícita de los autores.

---

<div align="center">

**AhorroGo** — *"Controla tus gastos y ahorra de forma simple, práctica y constante."*

Hecho con ❤️ en Lima, Perú · 2026

</div>
