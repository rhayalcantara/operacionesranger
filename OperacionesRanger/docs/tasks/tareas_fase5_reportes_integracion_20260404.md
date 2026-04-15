# Tareas: Fase 5 - Reportes e Integracion con Nomina

**Fase**: Fase 5 - Reportes e Integracion
**Fecha de creacion**: 2026-04-04
**Estado general**: Completada
**Plan general**: `docs/tasks/PLAN_GENERAL_PROYECTO.md`
**Fase anterior**: Fase 3 Completada (17/17 tareas)

---

## Leyenda de Estados

- `[ ]` **Pendiente**: No iniciada
- `[->]` **En progreso**: Actualmente trabajando en ella
- `[ok]` **Completada**: Terminada y documentada
- `[x]` **Bloqueada**: No se puede avanzar por dependencia
- `[~]` **Cancelada**: Ya no es necesaria

---

## Resumen de Progreso

| Estado | Cantidad |
|--------|----------|
| Pendiente | 0 |
| En progreso | 0 |
| Completada | 7 |
| Bloqueada | 0 |
| Cancelada | 0 |
| **TOTAL** | **7** |

**Progreso Fase 5**: 7/7 tareas completadas (100%)

---

## Objetivo de la Fase 5

Completar los gaps de reportes e integracion con nomina: endpoint vista-previa faltante en backend, componente de historial de reportes, dialog para marcar turnos como procesados, y actualizacion de rutas/navegacion.

---

## Tareas

### T5.01 - Backend: Endpoint Vista Previa Nomina
- **Estado**: [ok] Completada
- **Descripcion**: Crear GET /api/reportes/nomina/vista-previa. El frontend lo llamaba pero no existia.
- **Archivos modificados**:
  - `backend/src/schemas/reporte.schema.ts` - Schema vistaPreviaQuerySchema
  - `backend/src/services/reportes.service.ts` - Funcion getVistaPrevia()
  - `backend/src/controllers/reportes.controller.ts` - Controller getVistaPreviaNominaController
  - `backend/src/routes/reportes.routes.ts` - Ruta GET /nomina/vista-previa

### T5.02 - Frontend: Metodos faltantes en reportes.service.ts
- **Estado**: [ok] Completada
- **Descripcion**: Agregar interfaces y metodos para historial, marcar-procesados y re-descarga.
- **Archivos modificados**:
  - `frontend/src/app/core/services/reportes.service.ts` - Interfaces + 3 metodos nuevos

### T5.03 - Frontend: Componente Historial de Reportes
- **Estado**: [ok] Completada
- **Descripcion**: Tabla paginada de reportes generados con acciones descargar y marcar procesado.
- **Archivos creados**:
  - `frontend/src/app/modules/reportes/historial-reportes/historial-reportes.component.ts`
  - `frontend/src/app/modules/reportes/historial-reportes/historial-reportes.component.html`
  - `frontend/src/app/modules/reportes/historial-reportes/historial-reportes.component.scss`

### T5.04 - Frontend: Dialog Marcar como Procesado
- **Estado**: [ok] Completada
- **Descripcion**: Dialog de confirmacion con input nomina_id para marcar turnos como procesados.
- **Archivos creados**:
  - `frontend/src/app/modules/reportes/historial-reportes/marcar-procesados-dialog.component.ts`

### T5.05 - Frontend: Rutas y Navegacion
- **Estado**: [ok] Completada
- **Descripcion**: Registrar ruta reportes/historial, actualizar cards de reportes, agregar item menu.
- **Archivos modificados**:
  - `frontend/src/app/app.routes.ts` - Ruta reportes/historial
  - `frontend/src/app/modules/reportes/reportes.component.ts` - Cards actualizadas (3 habilitadas)
  - `frontend/src/app/layout/navmenu/navmenu.component.ts` - Item "Historial Reportes" en menu

### T5.06 - Frontend: Boton Marcar Procesado en Reporte Nomina
- **Estado**: [ok] Completada
- **Descripcion**: Boton post-descarga CSV para marcar como procesado directamente.
- **Archivos modificados**:
  - `frontend/src/app/modules/reportes/reporte-nomina/reporte-nomina.component.ts` - Metodo + imports
  - `frontend/src/app/modules/reportes/reporte-nomina/reporte-nomina.component.html` - Boton condicional

### T5.07 - Frontend: Indicador de Estado Procesado en Lista de Turnos
- **Estado**: [ok] Completada (ya existia)
- **Descripcion**: La columna 'procesado' con chips PROCESADO/PENDIENTE ya estaba implementada en turnos-list.
