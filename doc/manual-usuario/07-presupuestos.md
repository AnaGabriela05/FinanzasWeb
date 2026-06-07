# Capítulo 7. Crear y monitorear presupuestos

## Texto narrativo (para pegar en el .docx)

Un **presupuesto** en AhorroGo es un límite mensual de gasto que defines para una categoría. Por ejemplo, "S/ 500 al mes para Alimentación" o "S/ 200 al mes para Transporte". Los presupuestos no impiden gastar más, pero AhorroGo los utiliza para alimentar el indicador de **salud financiera** y para señalarte cuándo estás cerca o por encima del límite mensual.

### 7.1 Pantalla principal

Accede al módulo desde la opción **Presupuestos** del menú superior. Verás:

- **Encabezado del módulo** con el subtítulo **"Define un límite mensual de gasto por categoría"** y dos badges: **"Activos"** (cuántos presupuestos tienes registrados) y **"Al límite"** (cuántos están actualmente cerca o por encima del límite).
- **Formulario** para asignar o editar un presupuesto, a la izquierda.
- **Listado de presupuestos** a la derecha con el título **"Listado de presupuestos"**, la línea descriptiva **"{count} presupuestos cargados desde la API real."** y, si no hay nada, el mensaje **"No hay presupuestos registrados todavia."**.

La tabla tiene cuatro columnas:

1. **Categoria** (nombre + pill **"ingreso"** o **"gasto"**).
2. **Periodo** en formato **mes/año** (ejemplo: **5/2026**).
3. **Monto** (mostrado en soles).
4. **Acciones** (**Editar** y **Eliminar**).

Sobre la tabla hay un pequeño bloque de **filtros**: dos campos numéricos para **Mes** (1-12) y **Anio** (2000-2100), junto con los botones **Buscar** y **Quitar filtros**.

### 7.2 Crear un presupuesto

1. Pulsa el botón **Asignar presupuesto** o sitúate en el formulario de la izquierda.
2. Completa los campos:
   - **Categoría.** Desplegable con tus categorías visibles (mostrando nombre y tipo). Es obligatoria.
   - **Monto Mensual.** Placeholder "Ej. 500000". Debe ser mayor a cero; el servidor responde **"montoMensual debe ser mayor a 0"** si no lo es.
   - **Mes.** Número de 1 a 12. Por defecto el mes en curso. Validación: **"mes debe estar entre 1 y 12"**.
   - **Año.** Número de 2000 a 2100. Por defecto el año en curso. Validación: **"anio invalido"**.
3. Pulsa **Guardar presupuesto**. Aparece el modal **"Confirmar guardado de presupuesto"** con el texto **"Se registrara un nuevo presupuesto con los datos ingresados."**. Pulsa **Guardar** para confirmar o **Cancelar**.

Si todo va bien aparece el toast verde **"Presupuesto guardado correctamente"** y el presupuesto se ve en la tabla.

> **Nota.** Solo se permite un presupuesto por **categoría + mes + año**. Si intentas crear un duplicado, el servidor responde con código 409 y el mensaje **"Ya existe un presupuesto para esa categoria, mes y anio"**.

### 7.3 Editar un presupuesto

Pulsa **Editar** en la fila. El formulario cambia a **"Editar presupuesto"** y el botón principal a **Guardar cambios**. Si cambias de opinión, el botón **Limpiar** restablece los campos.

Al confirmar verás el modal **"Confirmar cambios en presupuesto"** con el texto **"Se guardaran los cambios de este presupuesto."**, y luego el toast **"Presupuesto actualizado correctamente"**.

Las mismas reglas se aplican al editar: el monto debe ser mayor a cero, el mes entre 1 y 12, el año entre 2000 y 2100. Si intentas mover el presupuesto a un par categoría/mes/año ya ocupado, recibirás el error 409 mencionado arriba.

### 7.4 Eliminar un presupuesto

Pulsa **Eliminar** en la fila. Aparece el modal **"Confirmar eliminacion"** con el texto **«Se eliminara el presupuesto de "Categoría" para 5/2026.»**. Confirma con el botón rojo **Eliminar**.

Toast de éxito: **"Presupuesto eliminado correctamente"**. En caso de error: **"No se pudo eliminar el presupuesto"**.

### 7.5 Cómo monitoreas el cumplimiento

Aunque la tabla por sí sola lista los presupuestos definidos, el grado de cumplimiento se observa en otros lugares del sistema:

- En el **Dashboard**, la métrica **"Desfase vs presupuesto"** dentro de la tarjeta de Salud Financiera te dice qué tanto te has pasado en promedio (o si vas por debajo, no aparece desfase).
- En el módulo **Reportes** verás la composición de gastos por categoría y puedes comparar visualmente con tus presupuestos.
- El badge **"Al límite"** del encabezado de este módulo se incrementa cuando el backend marca un presupuesto como cercano al límite o sobrepasado.

> **Importante.** Los presupuestos solo se calculan en moneda local (soles peruanos). Las transacciones registradas en dólares se convierten internamente con la tasa configurada para incluirse en el cómputo.

### 7.6 Restricción por rol

Igual que las transacciones, los presupuestos **no están disponibles para administradores**. Cualquier intento devuelve código 403 con el mensaje **"Esta operacion no esta disponible para administradores."**.

## Lista de capturas a tomar

### CAPTURA U-14
- **Pantalla:** `/budgets` (vista principal con presupuestos cargados).
- **Cuenta a usar:** `demo@correo.com`.
- **Estado previo necesario:**
  - Iniciar sesión con la cuenta demo.
  - La cuenta debe tener al menos tres presupuestos registrados para el mes en curso, idealmente sobre categorías distintas y montos representativos.
  - El formulario debe estar en modo **Asignar presupuesto** (vacío).
- **Qué debe estar visible:**
  - Encabezado **"Presupuestos"** con el subtítulo "Define un límite mensual de gasto por categoría" y los badges **Activos** y **Al límite**.
  - Formulario "Asignar presupuesto" con los campos Categoría, Monto Mensual, Mes y Año, y los botones **Guardar presupuesto** y **Limpiar**.
  - Tabla con las cuatro columnas (Categoria, Periodo, Monto, Acciones) y al menos tres filas.
  - Bloque de filtros Mes/Año con los botones **Buscar** y **Quitar filtros**.
- **Qué NO debe aparecer:**
  - Modales abiertos.
  - Toasts.
- **Resolución y formato:**
  - 1440x900 mínimo, PNG, en idioma español.
- **Notas adicionales:**
  - Si el badge **Al límite** muestra un número mayor a cero, mejor: refuerza el mensaje del manual.

### CAPTURA U-15
- **Pantalla:** `/budgets` con el modal **"Confirmar guardado de presupuesto"** abierto.
- **Cuenta a usar:** `demo@correo.com`.
- **Estado previo necesario:**
  - Rellenar el formulario con una categoría nueva (por ejemplo "Educación"), monto 300, mes en curso y año en curso.
  - Pulsar **Guardar presupuesto** para que se abra el modal de confirmación.
- **Qué debe estar visible:**
  - Modal centrado con el título **"Confirmar guardado de presupuesto"** y el texto **"Se registrara un nuevo presupuesto con los datos ingresados."**.
  - Botones **Cancelar** y **Guardar**.
- **Qué NO debe aparecer:**
  - Toast de éxito (todavía no se ha confirmado).
- **Resolución y formato:**
  - 1440x900 mínimo, PNG, en idioma español.
- **Notas adicionales:**
  - Es buen detalle dejar entrever, detrás del modal, el formulario con los datos rellenados para mostrar contexto.
