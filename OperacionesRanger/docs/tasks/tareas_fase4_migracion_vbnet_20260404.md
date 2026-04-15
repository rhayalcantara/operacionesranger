# Tareas: Fase 4 - Migración de Módulos VB.NET

**Fase**: Fase 4 - Migración de funcionalidades del sistema VB.NET original
**Fecha de creación**: 2026-04-04
**Estado general**: ✅ Completada (2026-04-04)
**Plan general**: `docs/tasks/PLAN_GENERAL_PROYECTO.md`
**Fase anterior**: Fase 3 ✅ Completada (17/17 tareas - 2026-04-04)

---

## Leyenda de Estados

- `[ ]` **Pendiente**: No iniciada
- `[→]` **En progreso**: Actualmente trabajando en ella
- `[✓]` **Completada**: Terminada y documentada
- `[x]` **Bloqueada**: No se puede avanzar por dependencia
- `[~]` **Cancelada**: Ya no es necesaria

---

## Resumen de Progreso

| Estado | Cantidad |
|--------|----------|
| Pendiente | 0 |
| En progreso | 0 |
| Completada | 14 |
| Bloqueada | 0 |
| Cancelada | 0 |
| **TOTAL** | **14** |

**Progreso Fase 4**: 14/14 tareas completadas (100%) ✅
**Fecha completado**: 2026-04-04

---

## Objetivo de la Fase 4

Migrar las funcionalidades operativas del sistema VB.NET original (`opracionesranger`) al stack moderno:
- Asignación semanal de guardianes a puestos (Servicios por Puesto)
- Plantillas reutilizables de servicios
- Registro diario de asistencia (Diario de Puesto)
- Cronogramas semanales de trabajo
- Reporte de horas trabajadas

### Entregables Principales
- [ ] Módulo Servicios por Puesto (backend + frontend)
- [ ] Módulo Plantillas de Servicios (backend + frontend)
- [ ] Módulo Diario de Puesto con auto-poblado desde plantilla
- [ ] Módulo Cronogramas con validación de día libre
- [ ] Reporte de Horas Trabajadas (pivot por empleado/puesto)

---

## Grupo A — Migraciones DB (completadas)

### T4.01 - Migración DB: tabla `servicios_puesto`
- **Estado**: [✓] Completada
- **Tiempo real**: 30min
- **Fecha**: 2026-04-04
- **Archivo**: `database/migrations/002_create_servicios_puesto.sql`

### T4.10 - Migración DB: tablas `cronogramas` + `cronogramas_detalle`
- **Estado**: [✓] Completada
- **Tiempo real**: 30min
- **Fecha**: 2026-04-04
- **Archivo**: `database/migrations/005_create_cronogramas.sql`

---

## Grupo B — Backend módulos base (en paralelo)

### T4.02 - Backend CRUD: Servicios por Puesto
- **Estado**: [→] En progreso
- **Dependencias**: T4.01
- **Estimación**: 4h
- **Descripción**: Model, schema Zod, service con JOINs a puestos+ubicaciones+clientes+rh_empleado (7 LEFT JOINs para nombres de empleados por día), controller, routes.
- **Archivos**: `backend/src/{models,schemas,services,controllers,routes}/servicio-puesto*` + `server.ts`

### T4.11 - Backend: Cronograma con validación día libre
- **Estado**: [→] En progreso
- **Dependencias**: T4.10
- **Estimación**: 4h
- **Descripción**: CRUD master-detail transaccional. Regla de negocio: cada empleado máximo 6 de 7 días (1 día libre obligatorio).
- **Archivos**: `backend/src/{models,schemas,services,controllers,routes}/cronograma*` + `server.ts`

---

## Grupo C — Frontend base + DB dependientes (paralelo)

### T4.03 - Frontend: Servicios por Puesto
- **Estado**: [ ] Pendiente
- **Dependencias**: T4.02
- **Estimación**: 5h
- **Descripción**: Lista con filtros cascada (cliente→ubicación→puesto), form dialog con 7 autocompletes de guardián (uno por día). Nuevo submenu "Operaciones" en navmenu.
- **Archivos**: `frontend/src/app/modules/servicios-puesto/`, `app.routes.ts`, `navmenu.component.ts`

### T4.04 - Migración DB: tablas `plantillas_servicio` + detalle
- **Estado**: [ ] Pendiente
- **Dependencias**: T4.01
- **Estimación**: 30min
- **Archivo**: `database/migrations/003_create_plantillas_servicio.sql`

### T4.12 - Frontend: Cronograma (grid 7 columnas)
- **Estado**: [ ] Pendiente
- **Dependencias**: T4.11
- **Estimación**: 6h
- **Descripción**: Lista + formulario página completa con grid semanal. Cada celda: puesto + empleado + turno. Validación client-side: 1 día libre por empleado.
- **Archivos**: `frontend/src/app/modules/cronogramas/`

---

## Grupo D — Backend plantillas + DB diario (paralelo)

### T4.05 - Backend CRUD: Plantillas de Servicios
- **Estado**: [ ] Pendiente
- **Dependencias**: T4.04
- **Estimación**: 4h
- **Descripción**: Master-detail transaccional. GET by id retorna plantilla + detalles con JOINs a servicios_puesto y puestos.
- **Archivos**: `backend/src/{models,schemas,services,controllers,routes}/plantilla*` + `server.ts`

### T4.07 - Migración DB: tabla `diario_puesto`
- **Estado**: [ ] Pendiente
- **Dependencias**: T4.01
- **Estimación**: 30min
- **Archivo**: `database/migrations/004_create_diario_puesto.sql`

---

## Grupo E — Frontend plantillas + Backend diario (paralelo)

### T4.06 - Frontend: Plantillas de Servicios
- **Estado**: [ ] Pendiente
- **Dependencias**: T4.05
- **Estimación**: 4h
- **Descripción**: Lista + form dialog con tabla dinámica de detalles (add/remove rows por servicio_puesto).
- **Archivos**: `frontend/src/app/modules/plantillas-servicio/`

### T4.08 - Backend: Diario de Puesto + auto-populate
- **Estado**: [ ] Pendiente
- **Dependencias**: T4.05, T4.07
- **Estimación**: 5h
- **Descripción**: CRUD + endpoint `POST /api/diario-puesto/poblar-plantilla` que acepta `{plantilla_id, fecha}`, resuelve día de semana, busca empleado en cada servicio, batch INSERT IGNORE.
- **Archivos**: `backend/src/{models,schemas,services,controllers,routes}/diario-puesto*` + `server.ts`

---

## Grupo F — Frontend diario + Backend reporte (paralelo)

### T4.09 - Frontend: Diario de Puesto
- **Estado**: [ ] Pendiente
- **Dependencias**: T4.08
- **Estimación**: 6h
- **Descripción**: Date picker, tabla de registros del día, botón "Poblar desde Plantilla" con dialog selector, add/edit manual.
- **Archivos**: `frontend/src/app/modules/diario-puesto/` (incluye `poblar-plantilla-dialog/`)

### T4.13 - Backend: Reporte Horas Trabajadas
- **Estado**: [ ] Pendiente
- **Dependencias**: T4.07
- **Estimación**: 3h
- **Descripción**: Queries pivot sobre `diario_puesto`: por empleado y por puesto con rango de fechas. Genera columnas dinámicas por día + totales.
- **Archivos**: `backend/src/{models,schemas,services,controllers,routes}/reporte-horas*` + `server.ts`

---

## Grupo G — Frontend reporte

### T4.14 - Frontend: Reporte Horas Trabajadas
- **Estado**: [ ] Pendiente
- **Dependencias**: T4.13
- **Estimación**: 4h
- **Descripción**: Date range picker, toggle "por empleado"/"por puesto", filtro opcional, tabla pivot dinámica, export CSV.
- **Archivos**: `frontend/src/app/modules/reportes/reporte-horas/`

---

## Paralelización

| Grupo | Tareas | Tiempo paralelo |
|-------|--------|----------------|
| A | T4.01 + T4.10 | 30min |
| B | T4.02 + T4.11 | 4h |
| C | T4.03 + T4.04 + T4.12 | 6h |
| D | T4.05 + T4.07 | 4h |
| E | T4.06 + T4.08 | 5h |
| F | T4.09 + T4.13 | 6h |
| G | T4.14 | 4h |
| **Total paralelo** | | **~28h** |

---

## Cambios al NavMenu

```
Operaciones (icon: engineering) — ADMIN, SUPERVISOR
├── Servicios por Puesto   /servicios-puesto
├── Plantillas de Servicio /plantillas-servicio
├── Diario de Puesto       /diario-puesto
└── Cronogramas            /cronogramas

Reportes (expandir a submenu)
├── Reporte Nómina CSV     /reportes/nomina
└── Horas Trabajadas       /reportes/horas
```

---

## Notas

⚠️ Cada módulo sigue el patrón establecido en Fases 2-3:
- Backend: Model → Schema → Service → Controller → Routes → server.ts
- Frontend: Service → List Component → Form Dialog → app.routes.ts → navmenu

⚠️ Empleados se referencian desde `db_aae4a2_ranger.rh_empleado` (read-only)
⚠️ Todas las eliminaciones son soft delete (activo=false)
⚠️ Transacciones para operaciones master-detail
