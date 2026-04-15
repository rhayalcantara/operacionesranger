# Plan: T2.26 - Implementar reportes adicionales (resúmenes)

**Fecha**: 2026-01-19
**Tarea padre**: T2.26
**Fase**: Fase 2 - Backend Core
**Módulo**: Módulo 5 - Reportes
**Estimación**: 3-4 horas

---

## Objetivo

Crear 3 endpoints REST para generar reportes de resumen (JSON) de turnos:
1. Resumen de quincena (estadísticas agregadas del período)
2. Resumen por guardián (estadísticas individuales o paginadas)
3. Resumen por puesto (estadísticas por puesto con filtros)

Estos endpoints complementan el reporte CSV de nómina (T2.23) proporcionando vistas estadísticas para dashboards y análisis.

---

## Contexto

### Archivos existentes relevantes

**Service Layer** (ya existe, extender):
- `backend/src/services/reportes.service.ts` - Servicio de reportes (generarReporteNomina, marcarTurnosProcesados)

**Controller Layer** (ya existe, extender):
- `backend/src/controllers/reportes.controller.ts` - Controladores de reportes (2 funciones existentes)

**Routes** (ya existe, extender):
- `backend/src/routes/reportes.routes.ts` - Rutas de reportes (2 rutas POST existentes)

**Schemas de validación** (ya existen, completos):
- `backend/src/schemas/reporte.schema.ts` - Schemas Zod para validación
  - `resumenQuincenaQuerySchema` ✅ Ya definido
  - `resumenPorGuardianQuerySchema` ✅ Ya definido
  - `resumenPorPuestoQuerySchema` ✅ Ya definido

**Models** (ya existen, completos):
- `backend/src/models/reporte.model.ts` - Interfaces TypeScript
  - `ResumenQuincenaDTO` ✅ Ya definido
  - `ResumenGuardianDTO` ✅ Ya definido
  - `ResumenPuestoDTO` ✅ Ya definido
  - `PaginatedResumenResponse<T>` ✅ Ya definido

**Base de datos**:
- Tabla `turnos` - Registros de turnos con horas, tipo, feriados
- Tabla `rh_empleado` (BD RRHH) - Datos de guardianes
- Tabla `puestos` - Puestos de trabajo
- Tabla `ubicaciones` - Ubicaciones de los puestos
- Tabla `clientes` - Clientes dueños de ubicaciones
- Tabla `incentivos_puesto` - Incentivos por puesto

**Decisión de arquitectura**:
- Los 3 endpoints retornan **JSON** (no CSV)
- Accesibles por **todos los usuarios autenticados** (ADMIN, SUPERVISOR, CONSULTA)
- Paginación en endpoints de múltiples registros (guardian y puesto)
- Sin paginación en endpoint de resumen quincena (un solo objeto de respuesta)
- Queries optimizadas con GROUP BY y JOINs
- Filtros opcionales por empleado, puesto, ubicación, cliente

---

## Subtareas

### 1. Implementar funciones de servicio en reportes.service.ts

**Descripción**: Agregar 3 funciones de servicio para generar resúmenes

**Funciones a crear**:

**1.1. getResumenQuincena(fecha_inicio, fecha_fin): Promise<ResumenQuincenaDTO>**
- Query SQL con GROUP BY y agregaciones (SUM, COUNT, COUNT DISTINCT)
- Campos calculados:
  - total_turnos: COUNT(*)
  - total_horas_normales: SUM(horas_normales)
  - total_horas_extras: SUM(horas_extras)
  - total_guardianes: COUNT(DISTINCT empleado_id)
  - turnos_por_tipo: GROUP BY tipo_turno con COUNT
  - turnos_feriados: SUM(CASE WHEN es_feriado = 1 THEN 1 ELSE 0 END)
  - total_incentivos: Calcular desde turnos con JOINs a incentivos_puesto
- Retornar un único objeto ResumenQuincenaDTO
- Validar que rango no exceda 93 días (trimestre máximo)
- Manejo de resultado vacío (retornar zeros)

**1.2. getResumenPorGuardian(filtros, paginacion): Promise<PaginatedResumenResponse<ResumenGuardianDTO>>**
- Query SQL con GROUP BY empleado_id y JOINs a rh_empleado
- Filtros opcionales:
  - empleado_id (si se provee, retornar solo ese guardián)
  - fecha_inicio, fecha_fin (rango de fechas)
- Paginación:
  - page, pageSize (default: 1, 10)
  - Retornar total de registros y datos paginados
- Campos calculados por guardián:
  - total_turnos, total_horas_normales, total_horas_extras
  - turnos_diurnos, turnos_nocturnos, turnos_feriados
  - total_incentivos
- Incluir datos del empleado: cedula, nombre completo
- Ordenar por total_turnos DESC (más activos primero)

**1.3. getResumenPorPuesto(filtros, paginacion): Promise<PaginatedResumenResponse<ResumenPuestoDTO>>**
- Query SQL con GROUP BY puesto_id y JOINs a puestos, ubicaciones, clientes
- Filtros opcionales:
  - puesto_id (filtrar por un puesto específico)
  - ubicacion_id (filtrar por ubicación)
  - cliente_id (filtrar por cliente)
  - fecha_inicio, fecha_fin (rango de fechas)
- Paginación:
  - page, pageSize (default: 1, 10)
  - Retornar total de registros y datos paginados
- Campos calculados por puesto:
  - total_turnos, total_horas_normales, total_horas_extras
  - guardianes_distintos: COUNT(DISTINCT empleado_id)
  - turnos_diurnos, turnos_nocturnos
  - total_incentivos
- Incluir datos relacionados: puesto_codigo, puesto_nombre, ubicacion_nombre, cliente_nombre
- Ordenar por total_turnos DESC (puestos más utilizados primero)

**Archivos a modificar**:
- `backend/src/services/reportes.service.ts`

**Resultado esperado**:
- 3 funciones exportadas con lógica de negocio completa
- Queries SQL optimizadas con índices existentes
- Validaciones de rangos de fechas
- Manejo de errores con try/catch
- Logging de operaciones

---

### 2. Implementar controladores en reportes.controller.ts

**Descripción**: Agregar 3 controladores HTTP para manejar requests

**Controladores a crear**:

**2.1. getResumenQuincenaController(req, res)**
- Extraer fecha_inicio, fecha_fin de req.query
- Llamar a ReportesService.getResumenQuincena()
- Retornar JSON 200 con ResumenQuincenaDTO
- Manejo de errores 400 (rango inválido), 500 (error interno)

**2.2. getResumenPorGuardianController(req, res)**
- Extraer filtros de req.query: fecha_inicio, fecha_fin, empleado_id (opcional)
- Extraer paginación de req.query: page, pageSize
- Llamar a ReportesService.getResumenPorGuardian()
- Retornar JSON 200 con PaginatedResumenResponse<ResumenGuardianDTO>
- Manejo de errores 400, 500

**2.3. getResumenPorPuestoController(req, res)**
- Extraer filtros de req.query: fecha_inicio, fecha_fin, puesto_id, ubicacion_id, cliente_id (opcionales)
- Extraer paginación de req.query: page, pageSize
- Llamar a ReportesService.getResumenPorPuesto()
- Retornar JSON 200 con PaginatedResumenResponse<ResumenPuestoDTO>
- Manejo de errores 400, 500

**Archivos a modificar**:
- `backend/src/controllers/reportes.controller.ts`

**Resultado esperado**:
- 3 funciones controladoras exportadas
- Validación mediante middleware (ya configurado con Zod)
- Respuestas HTTP consistentes (200, 400, 500)
- Logging de operaciones

---

### 3. Agregar rutas en reportes.routes.ts

**Descripción**: Definir 3 rutas GET con middlewares de autenticación y validación

**Rutas a crear**:

**3.1. GET /api/reportes/resumen-quincena**
- Middlewares:
  - authMiddleware (verificar JWT)
  - requireRole('ADMIN', 'SUPERVISOR', 'CONSULTA') - Todos los usuarios
  - validateRequest({ query: resumenQuincenaQuerySchema })
- Controller: getResumenQuincenaController
- Permisos: Todos los usuarios autenticados

**3.2. GET /api/reportes/resumen-por-guardian**
- Middlewares:
  - authMiddleware
  - requireRole('ADMIN', 'SUPERVISOR', 'CONSULTA')
  - validateRequest({ query: resumenPorGuardianQuerySchema })
- Controller: getResumenPorGuardianController
- Permisos: Todos los usuarios autenticados

**3.3. GET /api/reportes/resumen-por-puesto**
- Middlewares:
  - authMiddleware
  - requireRole('ADMIN', 'SUPERVISOR', 'CONSULTA')
  - validateRequest({ query: resumenPorPuestoQuerySchema })
- Controller: getResumenPorPuestoController
- Permisos: Todos los usuarios autenticados

**Archivos a modificar**:
- `backend/src/routes/reportes.routes.ts`

**Resultado esperado**:
- 3 rutas GET registradas en router
- Middlewares aplicados correctamente
- Permisos configurados (todos los usuarios autenticados)
- Documentación inline en comentarios

---

### 4. Crear tests de integración

**Descripción**: Crear suite de tests para los 3 endpoints usando Jest + Supertest

**Tests a crear**:

**Archivo**: `backend/tests/integration/reportes-resumen.test.ts`

**Test suites**:

**Suite 1: GET /api/reportes/resumen-quincena (6 tests)**
1. Debe retornar resumen válido para rango de 15 días
2. Debe retornar estructura correcta con todos los campos
3. Debe calcular correctamente turnos_por_tipo (DIURNO/NOCTURNO)
4. Debe requerir autenticación (401 sin token)
5. Debe permitir acceso a todos los roles (ADMIN, SUPERVISOR, CONSULTA)
6. Debe rechazar rango de fechas inválido (400)

**Suite 2: GET /api/reportes/resumen-por-guardian (6 tests)**
1. Debe retornar lista paginada de resúmenes por guardián
2. Debe filtrar por empleado_id si se provee
3. Debe incluir datos del empleado (nombre, cédula)
4. Debe respetar paginación (page, pageSize)
5. Debe ordenar por total_turnos DESC
6. Debe requerir autenticación (401)

**Suite 3: GET /api/reportes/resumen-por-puesto (6 tests)**
1. Debe retornar lista paginada de resúmenes por puesto
2. Debe filtrar por puesto_id si se provee
3. Debe filtrar por ubicacion_id si se provee
4. Debe filtrar por cliente_id si se provee
5. Debe incluir datos relacionados (puesto, ubicación, cliente)
6. Debe respetar paginación

**Total de tests**: 18 tests mínimo (objetivo: 15+)

**Archivos a crear**:
- `backend/tests/integration/reportes-resumen.test.ts`

**Resultado esperado**:
- 18+ tests implementados y pasando
- Cobertura > 80% en funciones creadas
- Tests independientes (sin efectos secundarios)
- Setup/teardown de datos de prueba

---

## Criterios de Aceptación (checklist)

- [ ] **Servicio**: 3 funciones en reportes.service.ts (getResumenQuincena, getResumenPorGuardian, getResumenPorPuesto)
- [ ] **Controladores**: 3 controladores en reportes.controller.ts
- [ ] **Rutas**: 3 rutas GET en reportes.routes.ts con middlewares correctos
- [ ] **Validación**: Schemas Zod aplicados correctamente (ya existen)
- [ ] **Permisos**: Todos los endpoints accesibles por ADMIN, SUPERVISOR, CONSULTA
- [ ] **Paginación**: Implementada en resumen-por-guardian y resumen-por-puesto
- [ ] **Queries optimizadas**: GROUP BY con JOINs eficientes
- [ ] **Cálculos correctos**: Totales, sumas, conteos verificados
- [ ] **Tests**: Mínimo 18 tests de integración (objetivo: 15+)
- [ ] **Documentación**: Comentarios JSDoc en funciones exportadas
- [ ] **Manejo de errores**: Try/catch con mensajes claros
- [ ] **Logging**: Console.log de operaciones importantes
- [ ] **Performance**: Queries con LIMIT para paginación, índices utilizados

---

## Archivos a Generar/Modificar

### Modificar (extender)
- `backend/src/services/reportes.service.ts` - Agregar 3 funciones de servicio (~250 líneas)
- `backend/src/controllers/reportes.controller.ts` - Agregar 3 controladores (~150 líneas)
- `backend/src/routes/reportes.routes.ts` - Agregar 3 rutas GET (~80 líneas)

### Crear (nuevo)
- `backend/tests/integration/reportes-resumen.test.ts` - Suite de tests de integración (~400 líneas)

### Total estimado de líneas de código: ~880 líneas

---

## Riesgos y Consideraciones

### Riesgo 1: Performance con grandes volúmenes de datos
**Mitigación**:
- Usar índices existentes en turnos (fecha, empleado_id, puesto_id)
- Limitar paginación a máximo 100 registros por página
- Limitar rango de fechas a máximo 93 días (trimestre)
- Queries optimizadas con EXPLAIN ANALYZE (si necesario)

### Riesgo 2: Cálculo incorrecto de incentivos
**Mitigación**:
- Revisar lógica de JOIN con incentivos_puesto
- Validar que valor_hora sea calculado correctamente (monto / 360)
- Tests de integración con datos de prueba conocidos

### Riesgo 3: Respuesta vacía si no hay datos
**Mitigación**:
- Manejar arrays vacíos correctamente en paginación
- Retornar zeros en resumen de quincena si no hay turnos
- Documentar comportamiento en comentarios

### Riesgo 4: Tests bloqueados por errores pre-existentes
**Consideración**:
- El archivo de tareas indica que tests están bloqueados por errores en ubicaciones.service.ts
- Implementar tests pero NO ejecutarlos si fallan por errores externos
- Documentar el bloqueo en el archivo de completitud

---

## Decisiones Técnicas

### Decisión 1: Permisos para todos los usuarios autenticados
**Justificación**: Los reportes de resumen son informativos y no modifican datos. Todos los roles (ADMIN, SUPERVISOR, CONSULTA) pueden beneficiarse de vistas estadísticas.

### Decisión 2: Paginación solo en resúmenes múltiples
**Justificación**:
- Resumen de quincena retorna 1 objeto (sin paginación)
- Resumen por guardián y por puesto pueden retornar muchos registros (con paginación)

### Decisión 3: Formato JSON en lugar de CSV
**Justificación**: Estos endpoints son para dashboards y vistas estadísticas en frontend, no para exportación a nómina. JSON es más apropiado para consumo de APIs.

### Decisión 4: Validación con Zod en middleware
**Justificación**: Schemas Zod ya están definidos en reporte.schema.ts. Reutilizar middleware existente (validateRequest) para consistencia.

### Decisión 5: Queries SQL directas (no stored procedures)
**Justificación**:
- Los stored procedures existentes (sp_generar_reporte_nomina) son para operaciones críticas de nómina
- Reportes de resumen son consultas simples de agregación (GROUP BY)
- SQL directo es más flexible para filtros opcionales

---

## Notas Adicionales

**Diferencia con T2.23 (Reporte CSV nómina)**:
- T2.23: Genera CSV para importación en sistema de nómina externo (POST, solo ADMIN/SUPERVISOR)
- T2.26: Genera resúmenes JSON para dashboards y análisis (GET, todos los usuarios)

**Uso esperado en frontend (Fase 3)**:
- Resumen quincena → Card de estadísticas en dashboard principal
- Resumen por guardián → Tabla paginada de performance de guardianes
- Resumen por puesto → Tabla paginada de utilización de puestos

**Próximas tareas relacionadas**:
- T2.27: Documentación Swagger/OpenAPI (incluirá estos endpoints)
- T2.28: Suite completa de tests de integración (ampliará estos tests)

---

**Tiempo estimado total**: 3-4 horas
- Subtarea 1 (Servicio): 1h 30min
- Subtarea 2 (Controladores): 45min
- Subtarea 3 (Rutas): 30min
- Subtarea 4 (Tests): 1h 30min

**Autor del plan**: Subagente T2.26
**Fecha de creación**: 2026-01-19
