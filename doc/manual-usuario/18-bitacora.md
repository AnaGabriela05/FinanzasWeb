# Capítulo 18. Bitácora de auditoría

## Texto narrativo (para pegar en el .docx)

La sección **Auditoría · Exportaciones** (ruta `/admin/audit`, ícono **📋** del sidebar) registra cuándo, por quién y bajo qué filtros se generan los **archivos de exportación** que los usuarios descargan desde el módulo Reportes. Es la única bitácora persistente que expone la versión actual del Panel de Administración. Su objetivo es dejar trazabilidad sobre la salida de datos hacia archivos PDF o Excel.

### 18.1 Qué se registra

Cada vez que un usuario descarga un reporte desde `/reports` (Capítulo 8), el backend escribe una entrada en la tabla `ExportLog` con los siguientes campos:

- `userId`, junto con `nombre` y `correo` del usuario (resueltos al renderizar la tabla).
- `formato`: **`pdf`** o **`xlsx`**.
- `desde` y `hasta` con el rango de fechas filtrado por el usuario.
- `transactionType` con el tipo de movimiento aplicado: **"ingreso"**, **"gasto"** o nulo si no se filtró.
- `nombreArchivo` con el nombre del archivo descargado (por ejemplo `reporte_transacciones_2026-01-01_a_2026-03-31.pdf`).
- `createdAt` con la fecha y hora exacta de la operación.

> **Importante.** La bitácora **no almacena el contenido del archivo** ni los importes. Solo guarda el metadato necesario para auditar quién, cuándo, en qué formato y para qué rango se generó la exportación.

### 18.2 Encabezado

La cabecera muestra:

- **Título:** **"Auditoría · Exportaciones"**.
- **Subtítulo:** **"Registro de reportes exportados por los usuarios"**.
- Badge **"Total: [count]"** con la cantidad de entradas que coinciden con los filtros activos.

### 18.3 Filtros

Hay cuatro controles para acotar los resultados:

- **Buscar usuario.** Campo de texto que busca por correo o nombre.
- **Formato.** Desplegable con **"Todos"**, **"PDF"** y **"XLSX"**.
- **Desde** y **Hasta.** Dos selectores de fecha que filtran por `createdAt`.

### 18.4 Tabla

Las columnas que ves son:

| Columna | Render |
|--------|--------|
| **Fecha/Hora** | Fecha y hora con formato `dd/mm/aaaa HH:mm` (locale es-PE). |
| **Usuario** | Nombre en negrita y, debajo, correo en gris. Si el usuario fue eliminado, aparece el texto **"Usuario eliminado"**. |
| **Formato** | Pill: rojo para **PDF**, verde para **XLSX**. |
| **Período exportado** | `{desde} → {hasta}` (con guiones si alguno es nulo). |
| **Tipo** | `ingreso` o `gasto` (o guion si no se aplicó filtro). |
| **Archivo** | Nombre del archivo descargado. |

### 18.5 Cómo se usa

- Para revisar **exportaciones masivas** en momentos atípicos (madrugada, días no laborables) ordena por **Fecha/Hora** descendente y aplica filtros de rango.
- Para responder a una consulta del estilo "Necesito saber cuántas exportaciones hice este trimestre" basta con buscar al usuario y ajustar **Desde/Hasta**; el badge **"Total"** te dará la cifra inmediatamente.
- Para validar el cumplimiento normativo o académico, exporta los criterios y conserva el listado.

### 18.6 Lo que no incluye esta bitácora

- **No registra las acciones del propio administrador** (creación de categorías globales, bloqueos de usuarios, etc.) en una tabla separada. Esa información queda en los `updatedAt` y en el propio registro afectado, pero no en una bitácora dedicada en esta versión.
- **No registra inicios de sesión exitosos ni fallidos** explícitamente. La política de bloqueos contra fuerza bruta protege esos accesos, pero la trazabilidad detallada de inicios de sesión no está expuesta en el panel.

Estas observaciones quedan documentadas también en `99-funcionalidades-adicionales.md` por si conviene tratarlas en próximas iteraciones del manual o del sistema.

## Lista de capturas a tomar

### CAPTURA A-08
- **Pantalla:** `/admin/audit` (tabla de auditoría de exportaciones con datos).
- **Cuenta a usar:** `admin@correo.com`.
- **Estado previo necesario:**
  - Iniciar sesión con la cuenta administradora.
  - Asegurarse de que la base tenga al menos cinco o seis registros de exportación de varios usuarios con formatos mezclados (PDF y XLSX). Si no los hay, inicia sesión con la cuenta `demo@correo.com`, genera varias exportaciones desde Reportes, y vuelve a la cuenta administradora.
- **Qué debe estar visible:**
  - Sidebar con **Auditoría** marcado como activo.
  - Encabezado **"Auditoría · Exportaciones"** con el subtítulo "Registro de reportes exportados por los usuarios" y el badge **"Total: N"**.
  - Fila de filtros (**Buscar usuario**, **Formato**, **Desde**, **Hasta**).
  - Tabla con al menos cinco filas mostrando los dos pills de formato (PDF rojo y XLSX verde), distintos rangos exportados y los nombres de archivo.
- **Qué NO debe aparecer:**
  - Información personal real fuera del entorno de pruebas.
- **Resolución y formato:**
  - 1440x900 mínimo, PNG, en idioma español.
- **Notas adicionales:**
  - Si la columna **Archivo** se ve cortada, considera capturar a una resolución ligeramente mayor o destacar la celda en el manual; el nombre del archivo es parte clave del registro.
