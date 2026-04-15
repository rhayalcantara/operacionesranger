# Módulo Novedades de Salud - Interfaz Standalone

**Fecha:** 2026-03-16
**Estado:** Implementado

---

## Resumen

Se rediseñó el módulo de Novedades de Salud para que funcione como un registro independiente de RRHH, desacoplado de la nómina. Anteriormente las novedades estaban atadas a una nómina específica (`id_nomina` requerido). Ahora el personal de RRHH registra novedades de salud de forma libre, y es el recálculo de nómina el que busca novedades aplicables por solapamiento de fechas.

Se creó una página standalone accesible desde el menú RRHH con formulario de captura, listado completo y soporte para archivos adjuntos.

---

## Cambios en Base de Datos

**Tabla:** `no_novedades_salud`

| Cambio | Detalle |
|--------|---------|
| Eliminada columna `id_nomina` | La novedad ya no pertenece a una nómina |
| Eliminado FK `no_novedades_salud_ibfk_1` | Referencia a `no_nominas` removida |
| Eliminado UNIQUE `uk_novedad_nomina_emp` | Ya no aplica constraint por nómina+empleado |
| Nueva columna `estado` | VARCHAR(20), default 'activo'. Controla si la novedad está vigente |
| Nueva columna `archivo` | VARCHAR(500), nullable. Ruta del archivo adjunto de soporte |
| Nuevo UNIQUE `uk_novedad_empleado_fecha` | Un empleado no puede tener dos novedades en la misma fecha |

**Estructura final:**
```
id_novedad      INT AUTO_INCREMENT PRIMARY KEY
id_empleado     INT NOT NULL (FK → rh_empleado)
fecha_inicio    DATE NOT NULL
dias_licencia   INT NOT NULL
tipo_novedad    VARCHAR(100) DEFAULT 'Licencia Médica'
observacion     VARCHAR(255) NULL
estado          VARCHAR(20) DEFAULT 'activo'
archivo         VARCHAR(500) NULL
fecha_creacion  DATETIME DEFAULT NOW()
```

**Migración:** `backend-ranger-nomina/migrations/alter_novedades_salud_standalone.sql`

---

## Cambios en Backend

### Modelo (`models/novedadSaludModel.js`)

| Método | Descripción |
|--------|-------------|
| `create(data)` | Crea novedad sin requerir `id_nomina`. Acepta campo `archivo` |
| `getById(id)` | Obtiene novedad con nombre de empleado (JOIN) |
| `getAll()` | Lista todas las novedades ordenadas por fecha de creación DESC |
| `getByEmpleado(id_empleado)` | Lista novedades de un empleado específico |
| `getByRangoFechas(fechaDesde, fechaHasta)` | Busca novedades activas que se solapan con un rango de fechas. Usado por el recálculo de nómina |
| `update(id, data)` | Actualiza novedad. Acepta campo `archivo` |
| `delete(id)` | Elimina novedad |

**Eliminado:** Toda dependencia de `_verificarNominaAbierta()` y de `nominaModel`.

### Rutas (`routes/novedadSalud.js`)

| Endpoint | Método | Descripción |
|----------|--------|-------------|
| `/api/novedades-salud/` | GET | Listar todas las novedades |
| `/api/novedades-salud/empleado/:id` | GET | Listar por empleado |
| `/api/novedades-salud/:id` | GET | Obtener una novedad |
| `/api/novedades-salud/` | POST | Crear (con archivo opcional via multer) |
| `/api/novedades-salud/:id` | PUT | Actualizar (con archivo opcional) |
| `/api/novedades-salud/:id` | DELETE | Eliminar |
| `/api/novedades-salud/:id/archivo` | GET | Descargar archivo adjunto |

**Upload de archivos:** Configurado con multer, almacena en `uploads/novedades-salud/`. Tipos permitidos: PDF, JPG, PNG, DOC, DOCX. Límite: 5MB.

### Recálculo de Nómina (`models/nominaModel.js`)

**Antes:** `SELECT ... FROM no_novedades_salud WHERE id_nomina = ?`

**Ahora:** Busca novedades activas cuyo rango de fechas se solapa con el período de la nómina:
```sql
SELECT id_empleado, dias_licencia, fecha_inicio
FROM no_novedades_salud
WHERE estado = 'activo'
  AND fecha_inicio <= [fecha_hasta_nomina]
  AND DATE_ADD(fecha_inicio, INTERVAL dias_licencia DAY) >= [fecha_desde_nomina]
```

---

## Cambios en Frontend

### Service (`services/novedad-salud.service.ts`)

Reescrito completamente:
- `getAll()` - Obtener todas las novedades
- `getByEmpleado(id)` - Por empleado
- `getById(id)` - Individual
- `create(FormData)` - Crear con soporte de archivo
- `update(id, FormData)` - Actualizar con soporte de archivo
- `delete(id)` - Eliminar
- `getArchivoUrl(id)` - URL de descarga

**Eliminados:** `getByNomina()`, `getByNominaAndEmpleado()` (ya no aplican).

### Dialog de Captura (`components/nomina/novedad-salud-form/`)

| Cambio | Detalle |
|--------|---------|
| Interface `NovedadSaludDialogData` | Ya no requiere `id_nomina`. Acepta `empleados[]` para modo selector |
| Modo selector de empleado | Si no se pasa `id_empleado`, muestra un `mat-select` con lista de empleados |
| Upload de archivo | Campo de archivo con soporte para PDF, JPG, PNG, DOC, DOCX |
| FormData | Envía datos como `FormData` en vez de JSON para soportar archivos |

### Página Standalone (`components/novedades-salud/`)

**Archivos creados:**
- `novedades-salud.ts` - Componente principal
- `novedades-salud.html` - Template
- `novedades-salud.css` - Estilos

**Funcionalidad:**
- Tabla Material con columnas: Empleado, Fecha Inicio, Días Licencia, Tipo, Observación, Archivo, Acciones
- Botón "Agregar Novedad" que abre dialog con selector de empleados activos
- Editar: abre dialog con datos precargados
- Eliminar: dialog de confirmación
- Descarga de archivo adjunto

### Nomina Detalle (`components/nomina/nomina-detalle/`)

Adaptado para el nuevo modelo:
- Carga todas las novedades con `getAll()` en vez de `getByNomina()`
- Filtra client-side por solapamiento de fechas con el período de la nómina
- El botón `local_hospital` sigue funcionando igual en la vista de detalle

### Ruta y Menú

| Archivo | Cambio |
|---------|--------|
| `app.routes.ts` | Ruta `/novedades-salud` con lazy loading |
| `navmenu/navmenu.ts` | Item "Novedades de Salud" en menú RRHH |

---

## Archivos Modificados

| Archivo | Acción |
|---------|--------|
| `backend-ranger-nomina/migrations/alter_novedades_salud_standalone.sql` | Creado |
| `backend-ranger-nomina/models/novedadSaludModel.js` | Reescrito |
| `backend-ranger-nomina/routes/novedadSalud.js` | Reescrito |
| `backend-ranger-nomina/models/nominaModel.js` | Modificado (query novedades por fechas) |
| `rangernomina-frontend/src/app/services/novedad-salud.service.ts` | Reescrito |
| `rangernomina-frontend/src/app/components/nomina/novedad-salud-form/novedad-salud-form.ts` | Reescrito |
| `rangernomina-frontend/src/app/components/nomina/novedad-salud-form/novedad-salud-form.html` | Reescrito |
| `rangernomina-frontend/src/app/components/nomina/novedad-salud-form/novedad-salud-form.css` | Modificado |
| `rangernomina-frontend/src/app/components/novedades-salud/novedades-salud.ts` | Creado |
| `rangernomina-frontend/src/app/components/novedades-salud/novedades-salud.html` | Creado |
| `rangernomina-frontend/src/app/components/novedades-salud/novedades-salud.css` | Creado |
| `rangernomina-frontend/src/app/components/nomina/nomina-detalle/nomina-detalle.ts` | Modificado |
| `rangernomina-frontend/src/app/app.routes.ts` | Modificado |
| `rangernomina-frontend/src/app/navmenu/navmenu.ts` | Modificado |

---

## Verificación

1. Menú RRHH → "Novedades de Salud" abre la página `/novedades-salud`
2. Tabla muestra todas las novedades registradas (vacía inicialmente)
3. "Agregar Novedad" → dialog con selector de empleados activos, campos de fecha, días, tipo, observación, archivo
4. Editar novedad → dialog con datos precargados y nombre de empleado
5. Eliminar → confirmación → se remueve de la tabla
6. Archivo adjunto → columna con ícono de clip para descarga
7. Botón `local_hospital` en nomina-detalle sigue funcionando (filtra por fechas de la nómina)
8. Recálculo de nómina busca novedades activas por solapamiento de fechas del período
