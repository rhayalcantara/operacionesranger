# Plan de Implementación - T2.26: Reportes Adicionales (Resúmenes)

**Tarea**: T2.26 - Implementar reportes adicionales (resúmenes)
**Fecha**: 2026-01-18
**Estimación**: 4 horas
**Ejecutor**: Subagente Claude

## Objetivo

Implementar endpoints de reportes de resumen (formato JSON) que proporcionen estadísticas agregadas sobre turnos para:
1. Resumen de quincena (período completo)
2. Resumen por guardián (individual o todos)
3. Resumen por puesto (individual o todos)

## Análisis de Requisitos

### Endpoints a Implementar

#### 1. GET /api/reportes/resumen-quincena
- **Permisos**: ADMIN, SUPERVISOR, CONSULTA
- **Query Params**: fecha_inicio, fecha_fin (ambos requeridos)
- **Response**: Estadísticas agregadas del período
- **Validaciones**: Rango válido, máximo 93 días

#### 2. GET /api/reportes/resumen-por-guardian
- **Permisos**: ADMIN, SUPERVISOR, CONSULTA
- **Query Params**: fecha_inicio, fecha_fin (requeridos), empleado_id (opcional), page, pageSize
- **Response**: Estadísticas por guardián con paginación
- **Validaciones**: Rango válido, máximo 93 días

#### 3. GET /api/reportes/resumen-por-puesto
- **Permisos**: ADMIN, SUPERVISOR, CONSULTA
- **Query Params**: fecha_inicio, fecha_fin (requeridos), puesto_id, ubicacion_id, cliente_id (opcionales), page, pageSize
- **Response**: Estadísticas por puesto con paginación
- **Validaciones**: Rango válido, máximo 93 días

## Arquitectura de la Solución

### 1. Schemas de Validación (Zod)

**Archivo**: `backend/src/schemas/reporte.schema.ts`

```typescript
// Query params para resumen-quincena
resumenQuincenaQuerySchema = z.object({
  fecha_inicio: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  fecha_fin: z.string().regex(/^\d{4}-\d{2}-\d{2}$/)
}).refine(validarRangoFechas, validarMaximo93Dias)

// Query params para resumen-por-guardian
resumenPorGuardianQuerySchema = z.object({
  fecha_inicio: z.string().required(),
  fecha_fin: z.string().required(),
  empleado_id: z.number().optional(),
  page: z.number().optional(),
  pageSize: z.number().optional()
})

// Query params para resumen-por-puesto
resumenPorPuestoQuerySchema = z.object({
  fecha_inicio: z.string().required(),
  fecha_fin: z.string().required(),
  puesto_id: z.number().optional(),
  ubicacion_id: z.number().optional(),
  cliente_id: z.number().optional(),
  page: z.number().optional(),
  pageSize: z.number().optional()
})
```

### 2. Modelos TypeScript

**Archivo**: `backend/src/models/reporte.model.ts`

```typescript
export interface ResumenQuincenaDTO {
  fecha_inicio: string;
  fecha_fin: string;
  total_turnos: number;
  total_horas_normales: number;
  total_horas_extras: number;
  total_guardianes: number;
  turnos_por_tipo: {
    DIURNO: number;
    NOCTURNO: number;
  };
  turnos_feriados: number;
  total_incentivos: number;
}

export interface ResumenGuardianDTO {
  empleado_id: number;
  nombre_empleado: string;
  cedula: string;
  total_turnos: number;
  total_horas_normales: number;
  total_horas_extras: number;
  turnos_diurnos: number;
  turnos_nocturnos: number;
  turnos_feriados: number;
  total_incentivos: number;
}

export interface ResumenPuestoDTO {
  puesto_id: number;
  puesto_codigo: string;
  puesto_nombre: string;
  ubicacion_nombre: string;
  cliente_nombre: string;
  total_turnos: number;
  total_horas_normales: number;
  total_horas_extras: number;
  guardianes_distintos: number;
  turnos_diurnos: number;
  turnos_nocturnos: number;
  total_incentivos: number;
}
```

### 3. Service Layer

**Archivo**: `backend/src/services/reportes.service.ts`

#### Query SQL 1: Resumen Quincena
```sql
SELECT
  COUNT(*) as total_turnos,
  COALESCE(SUM(horas_normales), 0) as total_horas_normales,
  COALESCE(SUM(horas_extras), 0) as total_horas_extras,
  COUNT(DISTINCT empleado_id) as total_guardianes,
  SUM(CASE WHEN tipo_turno = 'DIURNO' THEN 1 ELSE 0 END) as turnos_diurnos,
  SUM(CASE WHEN tipo_turno = 'NOCTURNO' THEN 1 ELSE 0 END) as turnos_nocturnos,
  SUM(CASE WHEN es_feriado = 1 THEN 1 ELSE 0 END) as turnos_feriados,
  COALESCE(SUM(
    (horas_normales + horas_extras) * IFNULL(ip.valor_hora, 0)
  ), 0) as total_incentivos
FROM turnos t
LEFT JOIN incentivos_puesto ip ON t.puesto_id = ip.puesto_id
  AND t.fecha BETWEEN ip.fecha_inicio_quincena AND ip.fecha_fin_quincena
WHERE t.fecha BETWEEN ? AND ?
```

#### Query SQL 2: Resumen Por Guardián
```sql
SELECT
  t.empleado_id,
  CONCAT(e.nombres, ' ', e.apellidos) as nombre_empleado,
  e.cedula_empleado as cedula,
  COUNT(*) as total_turnos,
  COALESCE(SUM(t.horas_normales), 0) as total_horas_normales,
  COALESCE(SUM(t.horas_extras), 0) as total_horas_extras,
  SUM(CASE WHEN t.tipo_turno = 'DIURNO' THEN 1 ELSE 0 END) as turnos_diurnos,
  SUM(CASE WHEN t.tipo_turno = 'NOCTURNO' THEN 1 ELSE 0 END) as turnos_nocturnos,
  SUM(CASE WHEN t.es_feriado = 1 THEN 1 ELSE 0 END) as turnos_feriados,
  COALESCE(SUM(
    (t.horas_normales + t.horas_extras) * IFNULL(ip.valor_hora, 0)
  ), 0) as total_incentivos
FROM turnos t
INNER JOIN db_aae4a2_ranger.rh_empleado e ON t.empleado_id = e.id_empleado
LEFT JOIN incentivos_puesto ip ON t.puesto_id = ip.puesto_id
  AND t.fecha BETWEEN ip.fecha_inicio_quincena AND ip.fecha_fin_quincena
WHERE t.fecha BETWEEN ? AND ?
  AND (? IS NULL OR t.empleado_id = ?)
GROUP BY t.empleado_id, e.nombres, e.apellidos, e.cedula_empleado
ORDER BY nombre_empleado
LIMIT ? OFFSET ?
```

#### Query SQL 3: Resumen Por Puesto
```sql
SELECT
  p.id as puesto_id,
  p.codigo as puesto_codigo,
  p.nombre as puesto_nombre,
  u.nombre as ubicacion_nombre,
  c.nombre as cliente_nombre,
  COUNT(*) as total_turnos,
  COALESCE(SUM(t.horas_normales), 0) as total_horas_normales,
  COALESCE(SUM(t.horas_extras), 0) as total_horas_extras,
  COUNT(DISTINCT t.empleado_id) as guardianes_distintos,
  SUM(CASE WHEN t.tipo_turno = 'DIURNO' THEN 1 ELSE 0 END) as turnos_diurnos,
  SUM(CASE WHEN t.tipo_turno = 'NOCTURNO' THEN 1 ELSE 0 END) as turnos_nocturnos,
  COALESCE(SUM(
    (t.horas_normales + t.horas_extras) * IFNULL(ip.valor_hora, 0)
  ), 0) as total_incentivos
FROM turnos t
INNER JOIN puestos p ON t.puesto_id = p.id
INNER JOIN ubicaciones u ON p.ubicacion_id = u.id
INNER JOIN clientes c ON u.cliente_id = c.id
LEFT JOIN incentivos_puesto ip ON t.puesto_id = ip.puesto_id
  AND t.fecha BETWEEN ip.fecha_inicio_quincena AND ip.fecha_fin_quincena
WHERE t.fecha BETWEEN ? AND ?
  AND (? IS NULL OR t.puesto_id = ?)
  AND (? IS NULL OR p.ubicacion_id = ?)
  AND (? IS NULL OR u.cliente_id = ?)
  AND p.activo = 1
  AND u.activo = 1
  AND c.activo = 1
GROUP BY p.id, p.codigo, p.nombre, u.nombre, c.nombre
ORDER BY c.nombre, u.nombre, p.nombre
LIMIT ? OFFSET ?
```

### 4. Controller Layer

**Archivo**: `backend/src/controllers/reportes.controller.ts`

- `getResumenQuincenaController()`: Validar params, llamar service, retornar JSON
- `getResumenPorGuardianController()`: Validar params, paginación, llamar service, retornar JSON con metadata
- `getResumenPorPuestoController()`: Validar params, paginación, llamar service, retornar JSON con metadata

### 5. Routes Layer

**Archivo**: `backend/src/routes/reportes.routes.ts`

```typescript
router.get('/resumen-quincena',
  authMiddleware,
  validateQuery(resumenQuincenaQuerySchema),
  getResumenQuincenaController
);

router.get('/resumen-por-guardian',
  authMiddleware,
  validateQuery(resumenPorGuardianQuerySchema),
  getResumenPorGuardianController
);

router.get('/resumen-por-puesto',
  authMiddleware,
  validateQuery(resumenPorPuestoQuerySchema),
  getResumenPorPuestoController
);
```

### 6. Tests de Integración

**Archivo**: `backend/tests/integration/reportes.integration.test.ts`

**Tests para resumen-quincena (5 tests)**:
1. Debe retornar resumen correcto para período con turnos
2. Debe retornar resumen vacío para período sin turnos
3. Debe rechazar si falta fecha_inicio o fecha_fin
4. Debe rechazar si fecha_inicio > fecha_fin
5. Debe rechazar si rango > 93 días

**Tests para resumen-por-guardian (5 tests)**:
6. Debe retornar resumen de todos los guardianes con paginación
7. Debe retornar resumen de un guardián específico
8. Debe retornar lista vacía si no hay turnos
9. Debe aplicar paginación correctamente
10. Debe calcular incentivos correctamente

**Tests para resumen-por-puesto (5 tests)**:
11. Debe retornar resumen de todos los puestos con paginación
12. Debe retornar resumen de un puesto específico
13. Debe filtrar por ubicacion_id correctamente
14. Debe filtrar por cliente_id correctamente
15. Debe calcular guardianes distintos correctamente

## Plan de Ejecución

### Paso 1: Crear Schemas de Validación
- Archivo: `backend/src/schemas/reporte.schema.ts`
- Tiempo estimado: 30 minutos
- Schemas: resumenQuincenaQuerySchema, resumenPorGuardianQuerySchema, resumenPorPuestoQuerySchema

### Paso 2: Crear Modelos TypeScript
- Archivo: `backend/src/models/reporte.model.ts`
- Tiempo estimado: 20 minutos
- Interfaces: ResumenQuincenaDTO, ResumenGuardianDTO, ResumenPuestoDTO

### Paso 3: Implementar Service Layer
- Archivo: `backend/src/services/reportes.service.ts`
- Tiempo estimado: 1 hora 30 minutos
- Métodos:
  - `getResumenQuincena(fecha_inicio, fecha_fin)`
  - `getResumenPorGuardian(filtros, paginacion)`
  - `getResumenPorPuesto(filtros, paginacion)`

### Paso 4: Implementar Controller Layer
- Archivo: `backend/src/controllers/reportes.controller.ts`
- Tiempo estimado: 30 minutos
- Controllers:
  - `getResumenQuincenaController()`
  - `getResumenPorGuardianController()`
  - `getResumenPorPuestoController()`

### Paso 5: Implementar Routes
- Archivo: `backend/src/routes/reportes.routes.ts`
- Tiempo estimado: 20 minutos
- Rutas: GET /resumen-quincena, /resumen-por-guardian, /resumen-por-puesto

### Paso 6: Tests de Integración
- Archivo: `backend/tests/integration/reportes.integration.test.ts`
- Tiempo estimado: 1 hora
- Mínimo 15 tests (5 por endpoint)

### Paso 7: Documentación
- Archivo: `docs/completed/T2.26_reportes_resumen.md`
- Tiempo estimado: 20 minutos
- Documentar implementación, ejemplos de uso, queries SQL

## Validaciones Implementadas

1. **Rango de fechas**:
   - fecha_inicio y fecha_fin son requeridos
   - Formato ISO 8601: YYYY-MM-DD
   - fecha_inicio <= fecha_fin
   - Máximo 93 días de diferencia

2. **Paginación**:
   - page >= 1 (default: 1)
   - pageSize 1-100 (default: 10)

3. **Filtros opcionales**:
   - empleado_id: debe existir en RRHH
   - puesto_id: debe existir y estar activo
   - ubicacion_id: debe existir y estar activa
   - cliente_id: debe existir y estar activo

## Performance y Optimización

1. **Índices utilizados**:
   - `idx_turnos_fecha` (WHERE fecha BETWEEN)
   - `idx_turnos_empleado_id` (GROUP BY empleado_id)
   - `idx_turnos_puesto_id` (GROUP BY puesto_id)

2. **Optimizaciones**:
   - LEFT JOIN para incentivos (puede ser NULL)
   - INNER JOIN para jerarquía (clientes/ubicaciones/puestos)
   - COALESCE para evitar NULL en sumas
   - COUNT DISTINCT optimizado con índice

3. **Límites**:
   - Rango máximo de 93 días para evitar queries pesadas
   - Paginación obligatoria en resúmenes por guardián/puesto

## Criterios de Aceptación

- [x] Plan de implementación completo
- [ ] 3 endpoints implementados y funcionando
- [ ] Service layer con queries SQL optimizados
- [ ] Controller layer manejando requests/responses
- [ ] Routes layer con validación y autenticación
- [ ] Schemas Zod para validación de query params
- [ ] Modelos TypeScript para DTOs
- [ ] 15+ tests de integración (5 por endpoint)
- [ ] Cálculos de incentivos correctos
- [ ] Performance optimizado con índices
- [ ] Documentación completa

## Riesgos y Mitigaciones

| Riesgo | Probabilidad | Impacto | Mitigación |
|--------|-------------|---------|------------|
| Queries lentos con muchos turnos | Media | Alto | Limitar a 93 días, usar índices |
| Cálculo incorrecto de incentivos | Baja | Alto | Tests exhaustivos con data conocida |
| Error en JOINs cross-database | Baja | Medio | Validar permisos RRHH, tests |
| Paginación incorrecta | Baja | Bajo | Tests de paginación, LIMIT/OFFSET |

## Entregables

1. **Código fuente**:
   - `backend/src/schemas/reporte.schema.ts`
   - `backend/src/models/reporte.model.ts`
   - `backend/src/services/reportes.service.ts`
   - `backend/src/controllers/reportes.controller.ts`
   - `backend/src/routes/reportes.routes.ts`

2. **Tests**:
   - `backend/tests/integration/reportes.integration.test.ts` (15+ tests)

3. **Documentación**:
   - `docs/completed/T2.26_reportes_resumen.md`

## Notas Adicionales

- Todos los endpoints requieren autenticación JWT
- Todos los roles (ADMIN, SUPERVISOR, CONSULTA) pueden acceder
- Los incentivos se calculan usando `valor_hora` de la tabla `incentivos_puesto`
- La fórmula de incentivos es: `(horas_normales + horas_extras) * valor_hora`
- El campo `valor_hora` es un GENERATED column: `monto / 360`
- Los datos de empleados vienen de la BD RRHH (cross-database JOIN)

---

**Estimación total**: 4 horas
**Prioridad**: Alta
**Dependencias**: T2.23 (Reportes CSV) - Completada
