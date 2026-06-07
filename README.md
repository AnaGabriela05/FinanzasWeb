# AhorroGo

Sistema web de gestión de finanzas personales: registra ingresos y gastos, organízalos por categoría y método de pago, define presupuestos mensuales, consulta reportes con gráficos y exporta a PDF/Excel. Incluye un módulo de aprendizaje con videos, notas personales, quizzes gamificados, consejos financieros con IA y un panel de administración con separación estricta de funciones.

## Stack

- **Backend**: Node.js + Express + Sequelize (SQLite) + JWT + bcrypt
- **Frontend**: React 19 + Vite + react-router
- **Reportes**: pdfkit + chartjs-node-canvas + exceljs
- **Pruebas**: Vitest + Supertest
---

## Tabla de contenidos

1. [Resumen ](#1-resumen-)
2. [Características principales](#2-características-principales)
3. [Stack tecnológico](#3-stack-tecnológico)
4. [Arquitectura del sistema](#4-arquitectura-del-sistema)
5. [Patrones de diseño y principios SOLID](#5-patrones-de-diseño-y-principios-solid)
6. [Estructura del proyecto](#6-estructura-del-proyecto)
7. [Requisitos previos](#7-requisitos-previos)
8. [Instalación y ejecución](#8-instalación-y-ejecución)
9. [Variables de entorno](#9-variables-de-entorno)
10. [Scripts disponibles](#10-scripts-disponibles)
11. [Modelo de datos](#11-modelo-de-datos)
12. [API REST](#12-api-rest)
13. [Módulos destacados](#13-módulos-destacados)
14. [Salud Financiera — cálculo](#14-salud-financiera--cálculo)
15. [Seguridad](#15-seguridad)
16. [Pruebas (Testing)](#16-pruebas-testing)
17. [Equivalencias Node.js ↔ Java](#17-equivalencias-nodejs--java)
18. [Despliegue](#18-despliegue)
19. [Equipo y contexto académico](#19-equipo-y-contexto-académico)
20. [Licencia](#20-licencia)

---

## 1. Resumen 

**AhorroGo** es una aplicación web de finanzas personales que permite a los usuarios registrar ingresos y gastos, organizarlos por categoría y método de pago, definir presupuestos mensuales, analizar su comportamiento financiero mediante reportes y exportar la información en formato PDF o Excel. Incluye un módulo de aprendizaje con videos, notas personales, quizzes gamificados y consejos personalizados generados con IA, además de un panel de administración con separación estricta de funciones (SoD).

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
- **Quizzes gamificados** con sistema de niveles (Aprendiz → Maestro) y puntaje por primer intento
- **Consejos personalizados por IA** (GPT-4o-mini) con fallback MOCK y caché de 7 días
- **Panel de administración** con **Segregación de Funciones (SoD)**: el administrador gestiona el catálogo global sin acceder a datos financieros personales

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
| Vitest | 4.x | Framework de pruebas (unitarias) |
| Supertest | 7.x | Pruebas de integración sobre la API HTTP |

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
| OpenAI API (GPT-4o-mini) | Generación de consejos financieros personalizados (RF-10), con fallback MOCK si no hay API key |

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
│  │ Seguridad y Core: CORS · dotenv · Rutas · requireRole  │    │
│  ├──────────────────────────┬─────────────────────────────┤    │
│  │ Autenticación            │ Herramientas                │    │
│  │ JWT · bcrypt · Lockout   │ pdfkit · exceljs · chartjs  │    │
│  ├──────────────────────────┴─────────────────────────────┤    │
│  │ Lógica de Negocio: Services                            │    │
│  │ (Auth · Transaction · Report · Budget · Category ·     │    │
│  │  Advice · Quiz · Learning · Admin)                     │    │
│  ├────────────────────────────────────────────────────────┤    │
│  │ Capa de Datos: Sequelize ORM · Repositorios (DAO)      │    │
│  ├────────────────────────────────────────────────────────┤    │
│  │ Domain Helpers: FinancialHealthAnalyzer ·              │    │
│  │ PasswordHasher · TokenIssuer · LoginAttemptPolicy ·    │    │
│  │ MockAdvisor / OpenAiAdvisor                            │    │
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

- **Routes** — declaran endpoints REST y aplican middlewares (auth, validators, control de rol)
- **Controllers** — extraen datos del request, llaman al service y delegan la respuesta a `BaseController.execute`. Sin lógica de negocio.
- **Services** — contienen las reglas de negocio. Reciben DTOs simples (no tocan `req` / `res`)
- **Repositories** — único punto que toca los modelos Sequelize. Abstrae el ORM (rol de DAO).
- **Domain helpers** — encapsulan lógica técnica reutilizable
- **Composition Root** (`src/container.js`) — instancia repositorios, servicios y controladores e inyecta dependencias

> El backend es una **API REST pura**: no renderiza vistas. La capa de presentación es la SPA de React, que consume la API por HTTP. Esto es una arquitectura en capas que *contiene* al MVC en su fachada HTTP (Route → Controller → modelo de respuesta) y lo extiende con dos capas adicionales —Service y Repository— para aislar reglas de negocio y persistencia.

---

## 5. Patrones de diseño y principios SOLID

Esta sección documenta las decisiones de diseño que sostienen el criterio de calidad del código (MVC, DAO, SOLID) y cómo se aplican en la implementación real.

### 5.1 Arquitectura en capas + MVC

El proyecto implementa **MVC en la fachada HTTP** (Route → Controller → Model de respuesta) y lo extiende a una **arquitectura en capas** completa:

```
Route → Controller → Service → Repository → Model (Sequelize) → SQLite
```

Cada capa solo conoce a la inmediatamente inferior. Los controladores no contienen lógica de negocio (esa vive en los Services) y los Services nunca tocan Sequelize directamente (eso es responsabilidad de los Repositories). Es un diseño más riguroso que el MVC clásico, no menos.

### 5.2 Patrón Repository como DAO (Data Access Object)

Cada entidad tiene su repositorio (`UserRepository`, `TransactionRepository`, `CategoryRepository`, `BudgetRepository`, `ConsejoIaRepository`, `QuizQuestionRepository`, `QuizAttemptRepository`, etc.). Estos repositorios cumplen exactamente la responsabilidad de un **DAO**: aislar el acceso a datos detrás de métodos con intención de negocio (`findByEmail`, `incrementFailedAttempts`, `create`, `save`), de modo que ninguna otra capa dependa del ORM. Si mañana se cambia Sequelize por otro ORM, solo cambian los repositorios.

> En la teoría purista, "Repository" y "DAO" no son idénticos (el Repository suele ser más rico en lógica de dominio), pero en la práctica industrial y académica se consideran equivalentes. Aquí cumplen el rol de DAO.

### 5.3 Inyección de dependencias (Composition Root)

Todo el cableado de la aplicación ocurre en un único lugar: **`src/container.js`**. Allí se instancian los repositorios, se inyectan en los servicios por constructor, y los servicios se inyectan en los controladores. Ninguna clase de negocio importa sus dependencias con `require` directo; las recibe ya construidas.

```js
// Ejemplo conceptual (src/container.js)
const authService = new AuthService({
  userRepository,
  passwordHasher,
  tokenIssuer,
  loginAttemptPolicy,
});
```

Esta decisión es la que hace que el código sea **testeable**: en las pruebas se inyectan dobles (mocks) en lugar de las dependencias reales, sin tocar la base de datos (ver sección 16).

### 5.4 Principios SOLID en la práctica

| Principio | Cómo se aplica en AhorroGo |
|---|---|
| **S** — Responsabilidad Única | Cada helper hace una sola cosa: `PasswordHasher` solo hashea, `TokenIssuer` solo firma JWT, `LoginAttemptPolicy` solo administra bloqueos, `AuthService` solo orquesta el flujo de login. |
| **O** — Abierto/Cerrado | El módulo de consejos soporta dos motores intercambiables, `MockAdvisor` y `OpenAiAdvisor`, sin modificar `AdviceService`. Se podría añadir un tercer proveedor sin tocar el código existente. |
| **L** — Sustitución de Liskov | `MockAdvisor` y `OpenAiAdvisor` cumplen el mismo contrato y son intercambiables sin romper a `AdviceService`. |
| **I** — Segregación de Interfaces | Cada servicio recibe solo las dependencias que necesita (p.ej. `AuthService` recibe `{ userRepository, passwordHasher, tokenIssuer, loginAttemptPolicy }`), no un "súper-objeto" con todo. |
| **D** — Inversión de Dependencias | Los servicios dependen de abstracciones inyectadas por constructor, no de implementaciones importadas con `require`. El `container.js` decide qué implementación concreta se inyecta. |

---

## 6. Estructura del proyecto

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
│   │   ├── ai/                       ← MockAdvisor, OpenAiAdvisor (consejos IA)
│   │   ├── quiz/                     ← Lógica de puntaje y niveles
│   │   ├── exporters/                ← PdfReportExporter, ExcelReportExporter
│   │   └── resolvers/                ← CategoryDependencyResolver, etc.
│   ├── errors/
│   │   └── HttpError.js              ← Error tipado con status + details
│   ├── middlewares/
│   │   ├── auth.js                   ← Verificación JWT
│   │   ├── requireRole.js            ← Control de rol (requireRole / denyRole) — SoD
│   │   └── validateRequest.js        ← Resultado de express-validator
│   ├── models/                       ← Sequelize models
│   ├── repositories/                 ← Acceso a datos (DAO)
│   ├── routes/                       ← Endpoints REST
│   ├── services/                     ← Lógica de negocio
│   ├── validators/                   ← Reglas express-validator
│   ├── app.js                        ← Express app (exportable para tests)
│   └── container.js                  ← Composition Root (DI)
├── frontend/                         ← Frontend React
│   ├── src/
│   │   ├── components/
│   │   │   ├── Layout.jsx            ← Navbar + main + hamburguesa
│   │   │   ├── Modal.jsx, ConfirmModal.jsx, DependencyActionModal.jsx
│   │   │   ├── Skeleton.jsx          ← Skeletons de carga
│   │   │   ├── Toast.jsx             ← Sistema de toasts
│   │   │   ├── admin/                ← UI del panel de administración
│   │   │   ├── advice/               ← UI del asesor IA
│   │   │   ├── learning/
│   │   │   ├── quiz/                 ← UI de quizzes y niveles
│   │   │   └── report/
│   │   ├── data/videos.js            ← Catálogo de videos
│   │   ├── lib/
│   │   │   ├── api.js                ← Cliente fetch wrapper
│   │   │   ├── auth.js               ← Token + user en localStorage
│   │   │   └── currency.js           ← Formato de monedas + tasa
│   │   ├── layouts/                  ← Layouts por rol
│   │   ├── pages/                    ← Login, Register, Dashboard, admin/, etc.
│   │   ├── routes/                   ← PrivateRoute, AdminRoute, UserRoute
│   │   ├── services/                 ← Clientes API por módulo
│   │   ├── App.jsx, main.jsx, App.css
│   └── vite.config.js                ← Proxy /api → :3000
├── scripts/
│   ├── sync.js                       ← Recrea esquema BD
│   ├── seed.js                       ← Inserta roles + usuarios demo
│   └── seedQuizQuestions.js          ← Inserta el banco de preguntas de quizzes
├── tests/                            ← Suite de pruebas (Vitest)
│   ├── unit/                         ← Pruebas unitarias de servicios y dominio
│   ├── integration/                  ← Pruebas de integración HTTP (Supertest)
│   └── helpers/                      ← App de prueba + BD en memoria + seed
├── vitest.config.mjs                 ← Configuración de Vitest
├── server.js                         ← Entrypoint del backend
├── database.sqlite                   ← Base de datos local (no versionada)
├── package.json
├── .env.example
├── .gitignore
└── README.md
```

---

## 7. Requisitos previos

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

## 8. Instalación y ejecución

### 8.1 Clonar el repositorio

```bash
git clone https://github.com/<usuario>/AhorroGo.git
cd AhorroGo
```

### 8.2 Configurar variables de entorno

Copia el archivo de plantilla y edítalo:

```bash
# Windows
copy .env.example .env

# macOS / Linux
cp .env.example .env
```

Edita `.env` con un editor de texto y ajusta los valores según tu entorno. La sección [Variables de entorno](#9-variables-de-entorno) detalla cada variable.

### 8.3 Instalar dependencias del backend

```bash
npm install
```

### 8.4 Preparar la base de datos

```bash
npm run db:sync         # crea las tablas (modo force)
npm run db:seed         # inserta roles + usuarios demo
npm run db:seed-quiz    # inserta el banco de preguntas de los quizzes
```

### 8.5 Ejecutar el backend

```bash
npm run dev
```

El servidor backend quedará disponible en **http://localhost:3000**.

### 8.6 Instalar y ejecutar el frontend

En **otra terminal** (deja el backend corriendo):

```bash
cd frontend
npm install
npm run dev
```

La aplicación frontend quedará disponible en **http://localhost:5173**.

### 8.7 Ejecutar las pruebas

```bash
npm test          # corre toda la suite una vez
npm run test:watch  # modo watch interactivo
```

### 8.8 Credenciales de prueba

Después del seed están disponibles dos usuarios:

| Rol | Correo | Contraseña |
|---|---|---|
| Administrador | `admin@correo.com` | `admin123` |
| Usuario | `demo@correo.com` | `123456` |

> ⚠️ **No usar estas credenciales en producción.** Son únicamente para desarrollo local y validación académica.

---

## 9. Variables de entorno

El archivo `.env` controla la configuración del backend. Las variables se cargan con `dotenv` al arrancar el servidor.

| Variable | Default | Descripción |
|---|---|---|
| `PORT` | `3000` | Puerto del backend |
| `NODE_ENV` | `development` | Entorno de ejecución; en `production` exige `JWT_SECRET`; en `test` aísla la BD y desactiva el rate-limit |
| `DB_STORAGE` | `./database.sqlite` | Ruta del archivo SQLite |
| `JWT_SECRET` | `dev_secret` (warning) | Secreto para firmar tokens. **Cambiar obligatoriamente en producción** |
| `JWT_EXPIRES_IN` | `8h` | Duración del token (formato compatible con `jsonwebtoken`) |
| `LOGIN_MAX_ATTEMPTS` | `3` | Intentos fallidos antes del bloqueo |
| `LOGIN_LOCK_MINUTES` | `10` | Minutos que dura el bloqueo |
| `PASSWORD_HASH_ROUNDS` | `10` | Rounds de bcrypt para hash de contraseñas |
| `CORS_ORIGINS` | `http://localhost:5173` | Orígenes permitidos (coma-separados) |
| `EXCHANGE_USD_TO_PEN` | `3.75` | Tasa aproximada USD → PEN |
| `OPENAI_API_KEY` | _(opcional)_ | Clave para integración de consejos IA. Sin ella, el sistema usa el proveedor MOCK |

> 🔒 **Importante:** si `NODE_ENV=production` y `JWT_SECRET` no está configurado, la aplicación **falla al arrancar** intencionalmente como medida de seguridad.

---

## 10. Scripts disponibles

### Backend (`package.json` raíz)

| Script | Comando | Descripción |
|---|---|---|
| `dev` | `npm run dev` | Arranca el backend con hot-reload |
| `start` | `npm start` | Arranca el backend en modo producción |
| `db:sync` | `npm run db:sync` | Recrea el esquema de la base de datos (force) |
| `db:seed` | `npm run db:seed` | Inserta roles + usuarios demo |
| `db:seed-quiz` | `npm run db:seed-quiz` | Inserta el banco de preguntas de los quizzes |
| `test` | `npm test` | Ejecuta toda la suite de pruebas una vez (Vitest) |
| `test:watch` | `npm run test:watch` | Ejecuta las pruebas en modo watch interactivo |

### Frontend (`frontend/package.json`)

| Script | Comando | Descripción |
|---|---|---|
| `dev` | `npm run dev` | Servidor de desarrollo Vite |
| `build` | `npm run build` | Build de producción optimizado |
| `preview` | `npm run preview` | Previsualiza el build de producción |

---

## 11. Modelo de datos

El sistema cuenta con **13 entidades** alineadas con la implementación. La notación utilizada en el modelo entidad-relación es **Crow's Foot**.

### 11.1 Entidades

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
| 10 | ConsejoIA | `consejos_ia` | Consejos financieros generados (IA o MOCK), con vigencia/caché |
| 11 | PreguntaQuiz | `quiz_questions` | Banco de preguntas por video (con opciones y dificultad) |
| 12 | IntentoQuiz | `quiz_attempts` | Intento de un usuario en el quiz de un video (puntaje, primer intento) |
| 13 | RespuestaQuiz | `quiz_answers` | Respuesta concreta dada en un intento |

### 11.2 Relaciones (resumen)

```
Rol           1───n  Usuario
Usuario       1───n  Categoría (personales)
Usuario       1───n  MétodoPago
Usuario       1───n  Transacción
Usuario       1───n  Presupuesto
Usuario       1───n  CategoríaOculta  n───1  Categoría
Usuario       1───n  EstadoAprendizaje
Usuario       1───n  ExportaciónReporte
Usuario       1───n  ConsejoIA
Usuario       1───n  IntentoQuiz
Categoría     1───n  Transacción
Categoría     1───n  Presupuesto
MétodoPago    1───n  Transacción
PreguntaQuiz  1───n  RespuestaQuiz   n───1  IntentoQuiz
```

### 11.3 Esquema físico

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
| `consejos_ia` | `id` (PK), `userId`, `tipo` (ahorro/presupuesto/gasto/deuda), `contenido`, `fuente` (mock/openai), `createdAt`, vigencia/caché |
| `quiz_questions` | `id` (PK), `videoId`, `pregunta`, `opciones` (JSON), `respuestaCorrecta`, `dificultad` |
| `quiz_attempts` | `id` (PK), `userId`, `videoId`, `puntaje`, `esPrimerIntento`, `createdAt` |
| `quiz_answers` | `id` (PK), `attemptId` (FK), `questionId` (FK), `respuestaElegida`, `esCorrecta` |

> 📝 **Nota:** los nombres de columna de las 4 tablas nuevas (`consejos_ia`, `quiz_questions`, `quiz_attempts`, `quiz_answers`) son un resumen funcional; conviene verificarlos contra las definiciones reales en `src/models/` y ajustar cualquier diferencia antes de la entrega.

### 11.4 Justificación de normalización

- **1FN — atomicidad:** todas las columnas son atómicas. Las columnas `checklist` (`learning_states`) y `opciones` (`quiz_questions`) guardan JSON serializado por decisión de diseño (datos siempre del mismo agregado, no se consultan entre filas).
- **2FN — sin dependencias parciales:** todas las PKs son `id` autoincrement (simples). La única tabla con PK compuesta (`user_category_hides`) tiene su único atributo no clave (`hidden`) dependiente de la combinación completa.
- **3FN — sin dependencias transitivas:** `tipo` y `global` en `categories` son enumeraciones cerradas sin atributos derivados.

---

## 12. API REST

### 12.1 Endpoints públicos

| Método | Ruta | Descripción |
|---|---|---|
| `GET` | `/api/health` | Verificación del servicio |
| `GET` | `/api/config/currency` | Tasa actual USD → PEN |
| `POST` | `/api/auth/register` | Registrar un nuevo usuario |
| `POST` | `/api/auth/login` | Iniciar sesión y obtener JWT |

### 12.2 Endpoints autenticados

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
| `GET` | `/api/advice` | Consejos IA vigentes del usuario |
| `POST` | `/api/advice/generate` | Generar nuevos consejos (IA o MOCK) |
| `GET` | `/api/quiz/:videoId` | Obtener las preguntas del quiz de un video |
| `POST` | `/api/quiz/:videoId/attempt` | Enviar un intento y obtener puntaje/nivel |
| `GET` | `/api/quiz/progress` | Progreso, puntaje total y nivel del usuario |
| `GET` | `/api/roles` | Listar roles del sistema |

### 12.3 Endpoints de administración (solo rol `admin`)

> Requieren `Authorization: Bearer <token>` **y** rol administrador (`requireRole('admin')`).

| Método | Ruta | Descripción |
|---|---|---|
| `GET / POST / PUT / DELETE` | `/api/admin/categories` | Gestión del catálogo de categorías globales |
| `GET` | `/api/admin/users` | Listado de usuarios (sin acceso a sus datos financieros) |
| `GET` | `/api/admin/exports` | Auditoría global de exportaciones |

> Las rutas exactas pueden variar; confirmar los prefijos reales en `src/routes/`. El control de acceso se aplica con los middlewares `requireRole` / `denyRole` (ver sección 15).

### 12.4 Ejemplo de uso — Iniciar sesión

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

### 12.5 Ejemplo de uso — Crear una transacción

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

## 13. Módulos destacados

### 13.1 Consejos financieros con IA (RF-10)

Genera recomendaciones personalizadas a partir de la actividad del usuario en los últimos 90 días, clasificadas en cuatro tipos: **ahorro, presupuesto, gasto y deuda**.

- **Proveedor intercambiable** (principio Open/Closed): `OpenAiAdvisor` usa **GPT-4o-mini**; si no hay `OPENAI_API_KEY`, el sistema usa automáticamente `MockAdvisor` con consejos basados en reglas. La aplicación funciona en cualquier entorno, con o sin clave.
- **Caché de 7 días:** los consejos generados se mantienen vigentes una semana para dar tiempo a aplicarlos y evitar que cambien en cada visita. El usuario puede regenerarlos manualmente cuando quiera.

### 13.2 Quizzes gamificados

Cada video del módulo de aprendizaje tiene un quiz de 5 preguntas (elegidas al azar de un banco por video).

- **Puntaje:** 20 puntos por respuesta correcta (máximo 100 por quiz). **Solo el primer intento** de cada video suma al puntaje oficial.
- **Niveles por puntos acumulados:** Aprendiz 🌱 (0–199), Explorador 🚀 (200–499), Conocedor 💎 (500–999), Experto 🏆 (1000–1999), Maestro 👑 (2000+).

### 13.3 Panel de administración con Segregación de Funciones (SoD)

El rol administrador gestiona el catálogo global del sistema (categorías globales, usuarios, auditoría) pero **no posee datos financieros personales** y **no puede registrar transacciones, presupuestos ni movimientos**. Esto implementa el principio de seguridad de **Segregación de Funciones**: quien administra el sistema no opera como usuario financiero.

- Existe un modo **"Vista como usuario"** (preview) señalizado con un banner ámbar, para que el administrador pueda *ver* la experiencia de usuario sin *actuar* sobre datos personales.
- El control se aplica con dos middlewares complementarios: `requireRole('admin')` (rutas exclusivas de admin) y `denyRole('admin')` (rutas que el admin tiene prohibido usar). Este comportamiento está cubierto por una prueba de integración automatizada (ver sección 16).

---

## 14. Salud Financiera — cálculo

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

## 15. Seguridad

El sistema implementa los siguientes controles a nivel de aplicación y base de datos:

### Autenticación

- **Hash de contraseñas** con `bcrypt` (10 rounds, configurable)
- **JWT firmado** con secreto en `JWT_SECRET`
  - Obligatorio en producción: la app **falla al arrancar** si `NODE_ENV=production` y no está definido
- **Política de bloqueo:** 3 intentos fallidos consecutivos → 10 minutos de lockout
- **Rate limiting por IP:** 10 peticiones cada 15 minutos en `/api/auth/*`

### Segregación de Funciones (SoD)

- **Control de rol por middleware:** `requireRole('admin')` protege las rutas exclusivas de administración; `denyRole('admin')` impide que el administrador opere sobre datos financieros personales (transacciones, presupuestos, etc.).
- **El administrador no tiene datos financieros propios:** su función es gestionar el catálogo global y la auditoría, no operar como usuario. Esto separa la administración del sistema de la operación financiera.
- **Modo "Vista como usuario"** con banner de advertencia: permite previsualizar sin actuar.

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

## 16. Pruebas (Testing)

El proyecto incluye una suite de **41 pruebas automatizadas** (35 unitarias + 6 de integración) ejecutadas con **Vitest** y **Supertest**.

```bash
npm test            # corre toda la suite una vez
npm run test:watch  # modo watch interactivo
```

### 16.1 Estrategia

Las pruebas aprovechan la **inyección de dependencias** del diseño (sección 5.3): los servicios se prueban inyectando dobles de prueba (mocks) en lugar de las dependencias reales, de modo que **las pruebas no tocan la base de datos de producción**. Las pruebas de integración usan una **base de datos SQLite en memoria** aislada y siembran sus propios datos.

### 16.2 Cobertura

| Archivo | Tipo | Qué cubre |
|---|---|---|
| `tests/unit/FinancialHealthAnalyzer.test.js` | Unitaria (pura) | Cálculo del score y niveles del semáforo: sin datos → neutral, perfil sano → verde, ajustado → amarillo, negativo → rojo, redistribución de pesos sin presupuesto |
| `tests/unit/AuthService.test.js` | Unitaria (mocks) | Login correcto/incorrecto, correo inexistente, cuenta bloqueada, hasheo en registro, y la política `LoginAttemptPolicy` (umbral de 3 fallidos → bloqueo) |
| `tests/unit/TransactionService.test.js` | Unitaria (mocks) | Validación de referencias, persistencia con `userId`, moneda por defecto PEN, conversión USD→PEN leída de config, aislamiento por usuario en update/remove |
| `tests/integration/auth_sod.test.js` | Integración (Supertest) | Flujo real de login (200/401) y **enforcement de Segregación de Funciones**: un admin recibe **403** al intentar `POST /api/transactions` |

### 16.3 Prueba destacada — Segregación de Funciones

La prueba de integración verifica de punta a punta que un administrador autenticado **no puede crear transacciones** (responde `403`), validando automáticamente el control de seguridad descrito en la sección 15.

> **Nota metodológica:** las pruebas se incorporaron para cubrir la lógica de negocio crítica y demostrar que el diseño es testeable (gracias a la inyección de dependencias). No constituyen un proceso estricto de TDD *test-first*, sino una suite de pruebas unitarias y de integración sobre el código existente.

---

## 17. Equivalencias Node.js ↔ Java

El proyecto está implementado en Node.js. La siguiente tabla mapea cada necesidad técnica a la librería utilizada y su equivalente en el ecosistema Java, para referencia y trazabilidad académica.

| Necesidad técnica | Librería en Node.js (usada) | Equivalente en Java |
|---|---|---|
| Framework web / API REST | Express | Spring Boot / Spark Java |
| ORM (mapeo objeto-relacional) | Sequelize | Hibernate / JPA |
| Driver de base de datos | sqlite3 | JDBC (SQLite JDBC Driver) |
| Hash de contraseñas | bcryptjs | jBCrypt / Spring Security `BCryptPasswordEncoder` |
| Tokens JWT | jsonwebtoken | java-jwt (Auth0) / jjwt |
| Validación de entrada | express-validator | Hibernate Validator (Bean Validation, JSR 380) |
| Generación de Excel | exceljs | **Apache POI** |
| Generación de PDF | pdfkit | Apache PDFBox / iText |
| Gráficos en el servidor | chartjs-node-canvas / skia-canvas | JFreeChart |
| Logging de peticiones HTTP | morgan | **Logback** + SLF4J |
| Rate limiting | express-rate-limit | Bucket4j / Resilience4j |
| Utilidades y colecciones | librería estándar de JS | **Google Guava** / **Apache Commons Lang** |
| Variables de entorno | dotenv | `application.properties` + Spring `@Value` / dotenv-java |
| CORS | cors | Configuración CORS de Spring |
| Pruebas unitarias | Vitest | JUnit 5 |
| Pruebas de integración HTTP | Supertest | Spring MockMvc / REST Assured |

> En Node.js, muchas utilidades de colecciones y cadenas que en Java requerirían **Guava** o **Apache Commons** ya vienen en la librería estándar del lenguaje (`Array`, `Map`, `Object`, `String`), por lo que no se añadió una dependencia equivalente.

---

## 18. Despliegue

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

## 19. Equipo y contexto académico

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
- **Avance de Proyecto Final 3 (APF3):** patrones de diseño (MVC/DAO/SOLID), control de versiones, suite de pruebas, manuales de usuario y desarrollador
- **Anexo Casos de Uso:** especificación detallada de los 12 casos de uso (CU-01 a CU-12)
- **Anexo Notación BPMN:** notación BPM utilizada y ejemplo paso a paso del proceso Inicio de Sesión
- **Anexo Mapeo de Reportes:** identificación y priorización de los 7 reportes del sistema según formato S07

---

## 20. Licencia

Proyecto académico desarrollado para el curso **Integrador I — Sistemas Software** de la Universidad Tecnológica del Perú. Uso restringido al ámbito académico y educativo. La reproducción, distribución o uso comercial requiere autorización explícita de los autores.

---

<div align="center">

**AhorroGo** — *"Controla tus gastos y ahorra de forma simple, práctica y constante."*

Hecho con ❤️ en Lima, Perú · 2026

</div>
