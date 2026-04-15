# Plan: T2.25 - Implementar historial de reportes generados

**Fecha**: 2026-01-19
**Tarea padre**: T2.25
**Fase**: Fase 2 - Backend Core
**Estimación**: 3-4 horas

---

## Objetivo

Crear sistema de historial de reportes CSV generados, permitiendo:
1. Registro automático de cada reporte generado
2. Consulta paginada del historial
3. Re-descarga de reportes históricos con mismos parámetros
4. Trazabilidad entre reportes y nóminas procesadas

---

## Contexto

**Estado actual**:
- T2.23 ✓: Endpoint POST /api/reportes/nomina genera CSV pero no guarda historial
- T2.24 ✓: Endpoint POST /api/reportes/marcar-procesados actualiza nomina_id pero no vincula con historial

**Necesidad**:
- Sistema debe mantener registro de todos los reportes generados
- Usuarios deben poder ver qué reportes se generaron, cuándo y por quién
- Debe ser posible re-descargar un reporte antiguo con exactamente los mismos datos

**Integración**:
- Al generar reporte (T2.23), guardar registro en tabla nueva
- Al marcar como procesados (T2.24), actualizar nomina_id en historial
- Nuevo endpoint GET /historial para consultar registros
- Nuevo endpoint GET /:id/descargar para re-generar CSV

---

## Subtareas

### Subtarea 1: Crear migración para tabla `sys_reportes_generados`

**Descripción**: Crear script SQL para tabla de historial

**Archivo a crear**: `backend/database/migrations/003_sys_reportes_generados.sql`

**Esquema**:
```sql
CREATE TABLE sys_reportes_generados (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    fecha_inicio DATE NOT NULL,
    fecha_fin DATE NOT NULL,
    cantidad_turnos INT NOT NULL,
    fecha_generacion DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    nomina_id INT NULL,
    nombre_archivo VARCHAR(100) NOT NULL,

    -- Foreign keys
    CONSTRAINT fk_reportes_user FOREIGN KEY (user_id)
        REFERENCES sys_usuarios(id),

    -- Indices
    INDEX idx_user_fecha (user_id, fecha_generacion),
    INDEX idx_fecha_generacion (fecha_generacion),
    INDEX idx_nomina (nomina_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

**Resultado esperado**: Script SQL ejecutable

---

### Subtarea 2: Ejecutar migración

**Descripción**: Ejecutar script SQL en base de datos

**Comando**:
```bash
mysql -u root -p turnos_guardianes < backend/database/migrations/003_sys_reportes_generados.sql
```

**Resultado esperado**: Tabla `sys_reportes_generados` creada en BD

---

### Subtarea 3: Crear modelo TypeScript para historial

**Descripción**: Definir interfaces y tipos

**Archivo a crear**: `backend/src/models/reportes.model.ts`

**Interfaces**:
```typescript
export interface ReporteGenerado {
  id: number;
  user_id: number;
  fecha_inicio: string;
  fecha_fin: string;
  cantidad_turnos: number;
  fecha_generacion: Date;
  nomina_id: number | null;
  nombre_archivo: string;
}

export interface ReporteGeneradoConUsuario extends ReporteGenerado {
  usuario_nombre: string;
}

export interface CrearReporteGenerado {
  user_id: number;
  fecha_inicio: string;
  fecha_fin: string;
  cantidad_turnos: number;
  nombre_archivo: string;
}
```

**Resultado esperado**: Archivo de modelos con tipos completos

---

### Subtarea 4: Extender schema de validación

**Descripción**: Agregar schemas Zod para nuevos endpoints

**Archivo a modificar**: `backend/src/schemas/reporte.schema.ts`

**Schemas a agregar**:
```typescript
// Validar query params de historial
export const getHistorialReportesSchema = z.object({
  query: z.object({
    page: z.string().optional().default('1'),
    pageSize: z.string().optional().default('10')
  })
});

// Validar params de descargar
export const descargarReporteSchema = z.object({
  params: z.object({
    id: z.string().regex(/^\d+$/, 'ID debe ser un número')
  })
});
```

**Resultado esperado**: Schemas Zod validados

---

### Subtarea 5: Extender service de reportes

**Descripción**: Agregar métodos para gestionar historial

**Archivo a modificar**: `backend/src/services/reportes.service.ts`

**Métodos a agregar**:

```typescript
// 1. Guardar reporte en historial
async function guardarReporteEnHistorial(
  user_id: number,
  fecha_inicio: string,
  fecha_fin: string,
  cantidad_turnos: number,
  nombre_archivo: string
): Promise<number> // Retorna ID del registro insertado

// 2. Obtener historial paginado
async function getHistorialReportes(
  page: number,
  pageSize: number
): Promise<{
  data: ReporteGeneradoConUsuario[];
  total: number;
  page: number;
  pageSize: number;
}>

// 3. Obtener reporte por ID
async function getReportePorId(id: number): Promise<ReporteGenerado | null>

// 4. Actualizar nomina_id de reporte
async function actualizarNominaId(
  fecha_inicio: string,
  fecha_fin: string,
  nomina_id: number
): Promise<void>
```

**Query SQL para historial**:
```sql
SELECT
  r.*,
  u.nombre_completo AS usuario_nombre
FROM sys_reportes_generados r
INNER JOIN sys_usuarios u ON r.user_id = u.id
ORDER BY r.fecha_generacion DESC
LIMIT ? OFFSET ?
```

**Resultado esperado**: Service con 4 nuevos métodos funcionando

---

### Subtarea 6: Modificar generarReporteNomina para guardar historial

**Descripción**: Integrar historial en generación de reportes

**Archivo a modificar**: `backend/src/services/reportes.service.ts`

**Lógica**:
```typescript
async function generarReporteNomina(
  fecha_inicio: string,
  fecha_fin: string,
  user_id: number // NUEVO parámetro
): Promise<string> {
  // 1. Validar rango de fechas (existente)
  // 2. Llamar a SP sp_generar_reporte_nomina (existente)
  // 3. Convertir a CSV (existente)

  // 4. NUEVO: Guardar en historial
  const cantidad_turnos = data.length;
  const nombre_archivo = getFilename(fecha_inicio, fecha_fin);
  await guardarReporteEnHistorial(
    user_id,
    fecha_inicio,
    fecha_fin,
    cantidad_turnos,
    nombre_archivo
  );

  // 5. Retornar CSV (existente)
  return csv;
}
```

**Resultado esperado**: Generación de reporte registra automáticamente en historial

---

### Subtarea 7: Modificar marcarTurnosProcesados para actualizar historial

**Descripción**: Vincular nomina_id con reportes en historial

**Archivo a modificar**: `backend/src/services/reportes.service.ts`

**Lógica**:
```typescript
async function marcarTurnosProcesados(
  fecha_inicio: string,
  fecha_fin: string,
  nomina_id: number
): Promise<number> {
  // 1. UPDATE turnos... (existente)

  // 2. NUEVO: Actualizar historial
  await actualizarNominaId(fecha_inicio, fecha_fin, nomina_id);

  // 3. Retornar cantidad (existente)
  return affectedRows;
}
```

**Resultado esperado**: Marcar procesados actualiza nomina_id en historial

---

### Subtarea 8: Crear controladores para nuevos endpoints

**Descripción**: Handlers HTTP para historial y descarga

**Archivo a modificar**: `backend/src/controllers/reportes.controller.ts`

**Controllers a agregar**:

```typescript
// 1. GET /api/reportes/historial
export async function getHistorialReportesController(
  req: Request,
  res: Response
): Promise<void> {
  const page = parseInt(req.query.page as string) || 1;
  const pageSize = parseInt(req.query.pageSize as string) || 10;

  const result = await ReportesService.getHistorialReportes(page, pageSize);
  res.status(200).json(result);
}

// 2. GET /api/reportes/:id/descargar
export async function descargarReporteController(
  req: Request,
  res: Response
): Promise<void> {
  const id = parseInt(req.params.id);

  // Obtener registro del historial
  const reporte = await ReportesService.getReportePorId(id);
  if (!reporte) {
    return res.status(404).json({ error: 'Reporte no encontrado' });
  }

  // Regenerar CSV con mismos parámetros
  const csv = await ReportesService.generarReporteNomina(
    reporte.fecha_inicio,
    reporte.fecha_fin,
    req.user!.id  // user_id actual (para auditoría)
  );

  // Enviar CSV
  res.set({
    'Content-Type': 'text/csv; charset=utf-8',
    'Content-Disposition': `attachment; filename="${reporte.nombre_archivo}"`
  });
  res.status(200).send(csv);
}
```

**Resultado esperado**: 2 controllers nuevos funcionando

---

### Subtarea 9: Agregar rutas para nuevos endpoints

**Descripción**: Registrar endpoints en routes

**Archivo a modificar**: `backend/src/routes/reportes.routes.ts`

**Rutas a agregar**:
```typescript
// GET /api/reportes/historial
router.get(
  '/historial',
  authMiddleware,
  requireRole('ADMIN', 'SUPERVISOR', 'CONSULTA'),  // Todos pueden ver historial
  validationMiddleware(getHistorialReportesSchema),
  getHistorialReportesController
);

// GET /api/reportes/:id/descargar
router.get(
  '/:id/descargar',
  authMiddleware,
  requireRole('ADMIN', 'SUPERVISOR', 'CONSULTA'),  // Todos pueden descargar
  validationMiddleware(descargarReporteSchema),
  descargarReporteController
);
```

**Orden de rutas** (importante):
```typescript
router.post('/nomina', ...);                   // 1. Generar reporte
router.post('/marcar-procesados', ...);        // 2. Marcar procesados
router.get('/historial', ...);                 // 3. Historial (ANTES de /:id)
router.get('/:id/descargar', ...);             // 4. Descargar (DESPUÉS de /historial)
```

**Resultado esperado**: Rutas registradas en orden correcto

---

### Subtarea 10: Actualizar controller existente para pasar user_id

**Descripción**: Modificar generarReporteNominaController para pasar user_id

**Archivo a modificar**: `backend/src/controllers/reportes.controller.ts`

**Cambio**:
```typescript
export async function generarReporteNominaController(
  req: Request,
  res: Response
): Promise<void> {
  const { fecha_inicio, fecha_fin } = req.body;
  const user_id = req.user!.id;  // NUEVO: obtener user_id del token JWT

  // Generar CSV con user_id
  const csv = await ReportesService.generarReporteNomina(
    fecha_inicio,
    fecha_fin,
    user_id  // NUEVO parámetro
  );

  // ... resto del código
}
```

**Resultado esperado**: generarReporteNomina recibe user_id

---

### Subtarea 11: Crear tests de integración para historial

**Descripción**: Tests para nuevos endpoints

**Archivo a crear**: `backend/tests/integration/reportes-historial.integration.test.ts`

**Tests a implementar** (12 tests):

**Grupo 1: GET /historial (5 tests)**
- Test 1: Obtener historial vacío (sin reportes)
- Test 2: Obtener historial con 3 reportes
- Test 3: Paginación funcionando (page=2, pageSize=2)
- Test 4: Verificar campos de respuesta
- Test 5: Verificar ordenamiento (DESC por fecha_generacion)

**Grupo 2: GET /:id/descargar (4 tests)**
- Test 6: Descargar reporte existente (200, CSV generado)
- Test 7: Descargar reporte inexistente (404)
- Test 8: Verificar CSV generado es igual al original
- Test 9: Verificar headers HTTP correctos

**Grupo 3: Permisos (3 tests)**
- Test 10: ADMIN puede ver historial
- Test 11: SUPERVISOR puede ver historial
- Test 12: CONSULTA puede ver historial

**Resultado esperado**: 12 tests implementados

---

### Subtarea 12: Actualizar tests existentes

**Descripción**: Modificar tests de T2.23 y T2.24 para verificar historial

**Archivos a modificar**:
1. `backend/tests/integration/reportes.integration.test.ts`
2. Buscar test de generarReporteNomina
3. Agregar verificación de que se creó registro en historial

**Test adicional**:
```typescript
it('Debe guardar reporte en historial al generar', async () => {
  // Generar reporte
  await request(app)
    .post('/api/reportes/nomina')
    .set('Authorization', `Bearer ${adminToken}`)
    .send({ fecha_inicio: '2026-01-01', fecha_fin: '2026-01-15' })
    .expect(200);

  // Verificar que se guardó en historial
  const [rows] = await turnosPool.query(
    'SELECT * FROM sys_reportes_generados WHERE user_id = ?',
    [adminUserId]
  );

  expect(rows).toHaveLength(1);
  expect(rows[0].cantidad_turnos).toBeGreaterThan(0);
});
```

**Resultado esperado**: Test verificando integración con historial

---

### Subtarea 13: Documentar resultado

**Descripción**: Crear archivo de documentación completo

**Archivo a crear**: `docs/completed/T2.25_historial_reportes.md`

**Contenido**:
- Resumen de lo implementado
- Archivos creados/modificados
- Endpoints nuevos con ejemplos
- Schema de base de datos
- Tests realizados
- Criterios de aceptación cumplidos

**Resultado esperado**: Documentación completa

---

## Criterios de Aceptación (checklist)

- [ ] Tabla `sys_reportes_generados` creada con schema correcto
- [ ] Modelos TypeScript para ReporteGenerado creados
- [ ] Schema Zod para validación de historial
- [ ] Service con 4 métodos nuevos: guardar, getHistorial, getPorId, actualizarNominaId
- [ ] generarReporteNomina modificado para guardar historial automáticamente
- [ ] marcarTurnosProcesados modificado para actualizar nomina_id en historial
- [ ] Controller getHistorialReportesController implementado
- [ ] Controller descargarReporteController implementado
- [ ] Rutas GET /historial y GET /:id/descargar registradas
- [ ] Permisos: ADMIN, SUPERVISOR, CONSULTA pueden acceder a ambos endpoints
- [ ] Tests de integración >= 12 tests implementados
- [ ] Re-descarga de reporte genera CSV idéntico al original
- [ ] Documentación completa

---

## Archivos a Generar

### Nuevos archivos:
1. `backend/database/migrations/003_sys_reportes_generados.sql` - Migración de tabla
2. `backend/src/models/reportes.model.ts` - Modelos TypeScript
3. `backend/tests/integration/reportes-historial.integration.test.ts` - Tests

### Archivos a modificar:
1. `backend/src/schemas/reporte.schema.ts` - Agregar schemas
2. `backend/src/services/reportes.service.ts` - Agregar 4 métodos, modificar 2 existentes
3. `backend/src/controllers/reportes.controller.ts` - Agregar 2 controllers, modificar 1
4. `backend/src/routes/reportes.routes.ts` - Agregar 2 rutas
5. `backend/tests/integration/reportes.integration.test.ts` - Agregar 1 test

---

## Riesgos y Consideraciones

### Riesgo 1: Desincronización entre historial y realidad
**Descripción**: Si se regenera un CSV, los datos pueden ser diferentes si se modificaron turnos
**Mitigación**: El historial guarda parámetros (fecha_inicio, fecha_fin) no los datos exactos. La re-descarga regenera el CSV con datos actuales de la BD. Esto es esperado y útil.

### Riesgo 2: Orden de rutas en express
**Descripción**: Si /:id/descargar está antes de /historial, Express puede interpretar "historial" como un ID
**Mitigación**: Registrar rutas estáticas (/historial) ANTES de rutas dinámicas (/:id)

### Riesgo 3: Performance en historial con muchos registros
**Descripción**: Si hay miles de reportes, query puede ser lento
**Mitigación**: Índices en tabla (idx_user_fecha, idx_fecha_generacion), paginación obligatoria, LIMIT en SQL

### Riesgo 4: user_id puede ser undefined
**Descripción**: req.user puede ser undefined si authMiddleware falla
**Mitigación**: authMiddleware garantiza req.user existe. TypeScript: usar req.user! (non-null assertion)

---

## Dependencias

- T2.23 ✓: Endpoint POST /api/reportes/nomina (base para historial)
- T2.24 ✓: Endpoint POST /api/reportes/marcar-procesados (actualizar nomina_id)
- T2.01 ✓: Tabla sys_usuarios (FK para user_id)
- T2.04 ✓: authMiddleware (req.user)

---

## Notas Adicionales

### Diferencia entre "guardar CSV" vs "guardar parámetros"

Esta tarea NO guarda el contenido del CSV en base de datos (sería innecesario y ocuparía mucho espacio). En su lugar:
- Guarda **parámetros** de generación: fecha_inicio, fecha_fin, user_id
- Guarda **metadata**: cantidad_turnos, nombre_archivo, fecha_generacion
- Al re-descargar, **regenera** el CSV con los mismos parámetros

**Ventaja**: Datos siempre actualizados (si un turno se modifica, la re-descarga lo refleja)
**Desventaja**: CSV re-generado puede ser diferente al original (esto es aceptable)

### Flujo completo con historial

```
1. Usuario genera reporte (T2.23):
   POST /api/reportes/nomina { fecha_inicio, fecha_fin }
   → Retorna CSV
   → Guarda registro en sys_reportes_generados (T2.25)

2. Usuario importa CSV en sistema de nómina (externo)

3. Usuario marca turnos como procesados (T2.24):
   POST /api/reportes/marcar-procesados { fecha_inicio, fecha_fin, nomina_id }
   → UPDATE turnos SET procesado_nomina = TRUE, nomina_id = ?
   → UPDATE sys_reportes_generados SET nomina_id = ? (T2.25)

4. Usuario consulta historial (T2.25):
   GET /api/reportes/historial?page=1&pageSize=10
   → Retorna lista de reportes con nomina_id vinculado

5. Usuario re-descarga reporte antiguo (T2.25):
   GET /api/reportes/123/descargar
   → Regenera CSV con mismos parámetros
```

---

**Tiempo estimado total**: 3-4 horas
**Complejidad**: Media (integración con sistema existente)
**Prioridad**: Baja (funcionalidad de auditoría/trazabilidad)
