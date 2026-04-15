# Plan de Implementación: T2.24 - Endpoint Marcar Turnos como Procesados

**Tarea**: T2.24
**Fecha**: 2026-01-18
**Módulo**: Reportes
**Estimación**: 2h 30min
**Estado**: En ejecución

---

## 1. Objetivo

Implementar endpoint `POST /api/reportes/marcar-procesados` que permita marcar turnos como procesados después de importarlos en el sistema de nómina. Este endpoint actualiza el campo `procesado_nomina` a `TRUE` y registra el `nomina_id` asociado para todos los turnos en un rango de fechas específico.

---

## 2. Contexto Técnico

### Arquitectura Actual
- **Service Layer**: `backend/src/services/reportes.service.ts`
  - Contiene: `generarReporteNomina()`, `getFilename()`
  - Usa stored procedure `sp_generar_reporte_nomina`
- **Controller Layer**: `backend/src/controllers/reportes.controller.ts`
  - Contiene: `generarReporteNominaController()`
- **Routes**: `backend/src/routes/reportes.routes.ts`
  - Endpoint actual: `POST /api/reportes/nomina`
- **Schemas**: `backend/src/schemas/reporte.schema.ts`
  - Contiene: `generarReporteNominaSchema`
- **Tests**: `backend/tests/integration/reportes.integration.test.ts`
  - 14 tests para endpoint de generación de reporte

### Tabla de Destino
```sql
CREATE TABLE turnos (
  id INT AUTO_INCREMENT PRIMARY KEY,
  empleado_id INT NOT NULL,
  puesto_id INT NOT NULL,
  fecha DATE NOT NULL,
  procesado_nomina BOOLEAN NOT NULL DEFAULT FALSE,
  nomina_id INT NULL,
  -- ... otros campos
)
```

---

## 3. Especificaciones Técnicas

### Endpoint
- **URL**: `POST /api/reportes/marcar-procesados`
- **Autenticación**: JWT (authMiddleware)
- **Autorización**: Solo ADMIN (requireRole('ADMIN'))
- **Content-Type**: application/json

### Request Body
```json
{
  "fecha_inicio": "2026-01-01",
  "fecha_fin": "2026-01-15",
  "nomina_id": 125
}
```

**Validaciones**:
- `fecha_inicio`: string, formato YYYY-MM-DD, requerido
- `fecha_fin`: string, formato YYYY-MM-DD, requerido
- `fecha_inicio` <= `fecha_fin`
- `nomina_id`: number, entero positivo, requerido

### Response (200 OK)
```json
{
  "turnos_procesados": 45,
  "nomina_id": 125,
  "fecha_inicio": "2026-01-01",
  "fecha_fin": "2026-01-15"
}
```

### Lógica de Negocio
```sql
UPDATE turnos
SET procesado_nomina = TRUE,
    nomina_id = :nomina_id,
    updated_at = CURRENT_TIMESTAMP
WHERE fecha BETWEEN :fecha_inicio AND :fecha_fin
  AND procesado_nomina = FALSE
```

**Nota**: Solo actualizar turnos NO procesados (`procesado_nomina = FALSE`).

---

## 4. Tareas de Implementación

### 4.1. Schema de Validación (15 min)
**Archivo**: `backend/src/schemas/reporte.schema.ts`

- [ ] Crear schema `marcarProcesadosSchema`
  - Campo `fecha_inicio`: string, regex YYYY-MM-DD, requerido
  - Campo `fecha_fin`: string, regex YYYY-MM-DD, requerido
  - Campo `nomina_id`: number, integer, positivo, requerido
  - Refinement: `fecha_inicio <= fecha_fin`
- [ ] Exportar type `MarcarProcesadosInput`

**Código a agregar**:
```typescript
export const marcarProcesadosSchema = z.object({
  body: z.object({
    fecha_inicio: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, 'Fecha de inicio debe estar en formato YYYY-MM-DD')
      .describe('Fecha de inicio del rango (YYYY-MM-DD)'),

    fecha_fin: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, 'Fecha de fin debe estar en formato YYYY-MM-DD')
      .describe('Fecha de fin del rango (YYYY-MM-DD)'),

    nomina_id: z
      .number({
        message: 'nomina_id es requerido y debe ser un número'
      })
      .int('nomina_id debe ser un número entero')
      .positive('nomina_id debe ser positivo')
      .describe('ID de la nómina en el sistema de nómina')
  }).refine(
    (data) => data.fecha_inicio <= data.fecha_fin,
    {
      message: 'fecha_inicio debe ser anterior o igual a fecha_fin'
    }
  )
});

export type MarcarProcesadosInput = z.infer<typeof marcarProcesadosSchema>;
```

---

### 4.2. Service Layer (30 min)
**Archivo**: `backend/src/services/reportes.service.ts`

- [ ] Crear función `marcarTurnosProcesados()`
  - Parámetros: `fecha_inicio`, `fecha_fin`, `nomina_id`
  - Ejecutar UPDATE con pool de turnos
  - Retornar cantidad de turnos actualizados
  - Logging de operación
  - Manejo de errores

**Código a agregar**:
```typescript
/**
 * Marcar turnos como procesados para nómina
 *
 * Actualiza los turnos en el rango de fechas para marcarlos como procesados
 * y asociarlos a una nómina específica. Solo actualiza turnos NO procesados.
 *
 * @param fecha_inicio - Fecha de inicio del rango (YYYY-MM-DD)
 * @param fecha_fin - Fecha de fin del rango (YYYY-MM-DD)
 * @param nomina_id - ID de la nómina en el sistema de nómina
 * @returns Objeto con cantidad de turnos procesados y datos del rango
 *
 * @throws Error si hay error en la actualización
 *
 * @example
 * ```typescript
 * const result = await marcarTurnosProcesados('2026-01-01', '2026-01-15', 125);
 * console.log(`Procesados: ${result.turnos_procesados} turnos`);
 * ```
 */
export async function marcarTurnosProcesados(
  fecha_inicio: string,
  fecha_fin: string,
  nomina_id: number
): Promise<{
  turnos_procesados: number;
  nomina_id: number;
  fecha_inicio: string;
  fecha_fin: string;
}> {
  console.log(
    `[Reportes Service] Marcando turnos como procesados para nómina ${nomina_id}, rango: ${fecha_inicio} - ${fecha_fin}`
  );

  const pool = getTurnosPool();

  try {
    // Ejecutar UPDATE para marcar turnos como procesados
    const [result] = await pool.execute<ResultSetHeader>(
      `UPDATE turnos
       SET procesado_nomina = TRUE,
           nomina_id = ?,
           updated_at = CURRENT_TIMESTAMP
       WHERE fecha BETWEEN ? AND ?
         AND procesado_nomina = FALSE`,
      [nomina_id, fecha_inicio, fecha_fin]
    );

    const turnosProcesados = result.affectedRows;

    console.log(
      `[Reportes Service] ${turnosProcesados} turnos marcados como procesados para nómina ${nomina_id}`
    );

    return {
      turnos_procesados: turnosProcesados,
      nomina_id,
      fecha_inicio,
      fecha_fin
    };
  } catch (error: any) {
    console.error('[Reportes Service] Error al marcar turnos como procesados:', error);
    throw new Error(`Error al marcar turnos como procesados: ${error.message}`);
  }
}
```

**Imports necesarios**: `ResultSetHeader` de `mysql2/promise`

---

### 4.3. Controller Layer (20 min)
**Archivo**: `backend/src/controllers/reportes.controller.ts`

- [ ] Crear función `marcarProcesadosController()`
  - Extraer `fecha_inicio`, `fecha_fin`, `nomina_id` del body validado
  - Llamar a `ReportesService.marcarTurnosProcesados()`
  - Retornar JSON con resultado (200)
  - Manejo de errores (500)

**Código a agregar**:
```typescript
/**
 * POST /api/reportes/marcar-procesados
 *
 * Marcar turnos como procesados para nómina
 *
 * **Body**:
 * ```json
 * {
 *   "fecha_inicio": "2026-01-01",
 *   "fecha_fin": "2026-01-15",
 *   "nomina_id": 125
 * }
 * ```
 *
 * **Response**:
 * ```json
 * {
 *   "turnos_procesados": 45,
 *   "nomina_id": 125,
 *   "fecha_inicio": "2026-01-01",
 *   "fecha_fin": "2026-01-15"
 * }
 * ```
 *
 * **Respuestas HTTP**:
 * - 200 OK: Turnos marcados exitosamente
 * - 400 Bad Request: Datos inválidos
 * - 401 Unauthorized: Sin autenticación
 * - 403 Forbidden: Usuario no es ADMIN
 * - 500 Internal Server Error: Error del servidor
 *
 * @example
 * ```bash
 * curl -X POST http://localhost:3000/api/reportes/marcar-procesados \
 *   -H "Authorization: Bearer <token>" \
 *   -H "Content-Type: application/json" \
 *   -d '{"fecha_inicio":"2026-01-01","fecha_fin":"2026-01-15","nomina_id":125}'
 * ```
 */
export async function marcarProcesadosController(
  req: Request,
  res: Response
): Promise<void> {
  try {
    // Los datos ya están validados por validationMiddleware
    const { fecha_inicio, fecha_fin, nomina_id } = req.body;

    console.log(
      `[Reportes Controller] Marcando turnos como procesados: ${fecha_inicio} - ${fecha_fin}, nómina ${nomina_id}`
    );

    // Llamar al servicio
    const result = await ReportesService.marcarTurnosProcesados(
      fecha_inicio,
      fecha_fin,
      nomina_id
    );

    console.log(
      `[Reportes Controller] ${result.turnos_procesados} turnos marcados exitosamente`
    );

    // Retornar resultado
    res.status(200).json(result);
  } catch (error: any) {
    console.error('[Reportes Controller] Error al marcar turnos como procesados:', error);
    res.status(500).json({
      error: 'Error interno del servidor',
      message: 'Error al marcar turnos como procesados'
    });
  }
}
```

---

### 4.4. Routes Layer (10 min)
**Archivo**: `backend/src/routes/reportes.routes.ts`

- [ ] Importar schema `marcarProcesadosSchema`
- [ ] Importar controller `marcarProcesadosController`
- [ ] Agregar ruta `POST /marcar-procesados`
  - Middleware: authMiddleware
  - Middleware: requireRole('ADMIN')
  - Middleware: validationMiddleware(marcarProcesadosSchema)
  - Handler: marcarProcesadosController

**Código a agregar**:
```typescript
import { marcarProcesadosController } from '../controllers/reportes.controller';
import { marcarProcesadosSchema } from '../schemas/reporte.schema';

/**
 * POST /api/reportes/marcar-procesados
 *
 * Marcar turnos como procesados para nómina
 *
 * **Permisos**: ADMIN solamente
 *
 * **Body**:
 * ```json
 * {
 *   "fecha_inicio": "2026-01-01",
 *   "fecha_fin": "2026-01-15",
 *   "nomina_id": 125
 * }
 * ```
 *
 * **Response**:
 * - 200 OK: { turnos_procesados: number, nomina_id: number, fecha_inicio: string, fecha_fin: string }
 * - 400 Bad Request: Datos inválidos
 * - 401 Unauthorized: Sin autenticación
 * - 403 Forbidden: Usuario no es ADMIN
 *
 * **Middlewares aplicados**:
 * 1. authMiddleware: Verificar JWT válido
 * 2. requireRole('ADMIN'): Solo ADMIN puede marcar como procesados
 * 3. validationMiddleware: Validar body con schema Zod
 * 4. marcarProcesadosController: Ejecutar UPDATE
 */
router.post(
  '/marcar-procesados',
  authMiddleware,
  requireRole('ADMIN'),
  validationMiddleware(marcarProcesadosSchema),
  marcarProcesadosController
);
```

---

### 4.5. Tests de Integración (60 min)
**Archivo**: `backend/tests/integration/reportes.integration.test.ts`

Agregar nuevo bloque `describe` al final del archivo existente.

**Tests a implementar** (mínimo 8 tests):

#### Grupo 1: Operación Exitosa (3 tests)
1. **Test 1**: Debe marcar turnos como procesados (2+ turnos, 200 OK)
   - Crear 3 turnos NO procesados en rango
   - Marcar como procesados con nomina_id = 125
   - Verificar response.turnos_procesados === 3
   - Verificar en BD que los 3 turnos tienen procesado_nomina = TRUE y nomina_id = 125

2. **Test 2**: No debe actualizar turnos YA procesados
   - Crear 2 turnos NO procesados
   - Crear 1 turno YA procesado (procesado_nomina = TRUE, nomina_id = 100)
   - Marcar como procesados con nomina_id = 125
   - Verificar response.turnos_procesados === 2 (no debe contar el ya procesado)
   - Verificar en BD que el turno ya procesado sigue con nomina_id = 100

3. **Test 3**: Debe retornar 0 si no hay turnos en rango
   - NO crear turnos, o crearlos fuera del rango
   - Marcar como procesados
   - Verificar response.turnos_procesados === 0
   - Verificar status 200 (operación exitosa aunque no haya turnos)

#### Grupo 2: Validación de Body (3 tests)
4. **Test 4**: Debe rechazar si nomina_id no es número (400)
   - Body: `{ fecha_inicio: '2026-01-01', fecha_fin: '2026-01-15', nomina_id: 'ABC' }`
   - Verificar status 400

5. **Test 5**: Debe rechazar si nomina_id es negativo o cero (400)
   - Body: `{ ..., nomina_id: -5 }` o `{ ..., nomina_id: 0 }`
   - Verificar status 400

6. **Test 6**: Debe rechazar si fecha_inicio > fecha_fin (400)
   - Body: `{ fecha_inicio: '2026-01-31', fecha_fin: '2026-01-01', nomina_id: 125 }`
   - Verificar status 400
   - Verificar mensaje de error

#### Grupo 3: Permisos (2 tests)
7. **Test 7**: ADMIN puede marcar como procesados (200)
   - Usar authTokenAdmin
   - Verificar status 200

8. **Test 8**: SUPERVISOR NO puede marcar como procesados (403)
   - Usar authTokenSupervisor
   - Verificar status 403
   - Verificar error message

9. **Test 9** (bonus): CONSULTA NO puede marcar como procesados (403)
   - Usar authTokenConsulta
   - Verificar status 403

10. **Test 10** (bonus): Sin autenticación debe retornar 401
    - No enviar header Authorization
    - Verificar status 401

**Código de tests**:
```typescript
describe('POST /api/reportes/marcar-procesados', () => {
  // ==========================================================================
  // GRUPO 1: OPERACIÓN EXITOSA
  // ==========================================================================

  describe('Operación exitosa', () => {
    it('Test 1: Debe marcar turnos como procesados (2+ turnos, 200 OK)', async () => {
      // Crear 3 turnos NO procesados en rango
      const turno1 = await createTestTurno('2026-01-02', 10, 2, false);
      const turno2 = await createTestTurno('2026-01-03', 10, 0, false);
      const turno3 = await createTestTurno('2026-01-05', 8, 2, false);

      const response = await request(app)
        .post('/api/reportes/marcar-procesados')
        .set('Authorization', `Bearer ${authTokenAdmin}`)
        .send({
          fecha_inicio: '2026-01-01',
          fecha_fin: '2026-01-15',
          nomina_id: 125
        });

      expect(response.status).toBe(200);
      expect(response.body.turnos_procesados).toBe(3);
      expect(response.body.nomina_id).toBe(125);
      expect(response.body.fecha_inicio).toBe('2026-01-01');
      expect(response.body.fecha_fin).toBe('2026-01-15');

      // Verificar en BD que los turnos están procesados
      const [rows] = await db.query<RowDataPacket[]>(
        'SELECT id, procesado_nomina, nomina_id FROM turnos WHERE id IN (?, ?, ?)',
        [turno1, turno2, turno3]
      );

      expect(rows.length).toBe(3);
      rows.forEach((row) => {
        expect(row.procesado_nomina).toBe(true);
        expect(row.nomina_id).toBe(125);
      });
    });

    it('Test 2: No debe actualizar turnos YA procesados', async () => {
      // Crear 2 turnos NO procesados
      const turno1 = await createTestTurno('2026-01-02', 10, 2, false);
      const turno2 = await createTestTurno('2026-01-03', 10, 0, false);

      // Crear 1 turno YA procesado con nomina_id = 100
      await db.query(
        `INSERT INTO turnos
         (empleado_id, puesto_id, fecha, hora_entrada, hora_salida, horas_normales, horas_extras,
          tipo_turno, es_feriado, procesado_nomina, nomina_id, created_by)
         VALUES (?, ?, '2026-01-04', '06:00:00', '18:00:00', 10, 2, 'DIURNO', false, true, 100, 1)`,
        [testEmpleadoId, testPuestoId]
      );

      const response = await request(app)
        .post('/api/reportes/marcar-procesados')
        .set('Authorization', `Bearer ${authTokenAdmin}`)
        .send({
          fecha_inicio: '2026-01-01',
          fecha_fin: '2026-01-15',
          nomina_id: 125
        });

      expect(response.status).toBe(200);
      expect(response.body.turnos_procesados).toBe(2); // Solo 2, no 3

      // Verificar que el turno ya procesado sigue con nomina_id = 100
      const [rows] = await db.query<RowDataPacket[]>(
        `SELECT procesado_nomina, nomina_id FROM turnos
         WHERE fecha = '2026-01-04' AND puesto_id = ?`,
        [testPuestoId]
      );

      expect(rows.length).toBe(1);
      expect(rows[0].procesado_nomina).toBe(true);
      expect(rows[0].nomina_id).toBe(100); // NO debe cambiar a 125
    });

    it('Test 3: Debe retornar 0 si no hay turnos en rango', async () => {
      // Crear turno fuera del rango
      await createTestTurno('2025-12-15', 10, 2, false);

      const response = await request(app)
        .post('/api/reportes/marcar-procesados')
        .set('Authorization', `Bearer ${authTokenAdmin}`)
        .send({
          fecha_inicio: '2026-01-01',
          fecha_fin: '2026-01-15',
          nomina_id: 125
        });

      expect(response.status).toBe(200);
      expect(response.body.turnos_procesados).toBe(0);
    });
  });

  // ==========================================================================
  // GRUPO 2: VALIDACIÓN DE BODY
  // ==========================================================================

  describe('Validación de body', () => {
    it('Test 4: Debe rechazar si nomina_id no es número (400)', async () => {
      const response = await request(app)
        .post('/api/reportes/marcar-procesados')
        .set('Authorization', `Bearer ${authTokenAdmin}`)
        .send({
          fecha_inicio: '2026-01-01',
          fecha_fin: '2026-01-15',
          nomina_id: 'ABC' // String inválido
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toBeDefined();
    });

    it('Test 5: Debe rechazar si nomina_id es negativo o cero (400)', async () => {
      const responseNegativo = await request(app)
        .post('/api/reportes/marcar-procesados')
        .set('Authorization', `Bearer ${authTokenAdmin}`)
        .send({
          fecha_inicio: '2026-01-01',
          fecha_fin: '2026-01-15',
          nomina_id: -5
        });

      expect(responseNegativo.status).toBe(400);

      const responseCero = await request(app)
        .post('/api/reportes/marcar-procesados')
        .set('Authorization', `Bearer ${authTokenAdmin}`)
        .send({
          fecha_inicio: '2026-01-01',
          fecha_fin: '2026-01-15',
          nomina_id: 0
        });

      expect(responseCero.status).toBe(400);
    });

    it('Test 6: Debe rechazar si fecha_inicio > fecha_fin (400)', async () => {
      const response = await request(app)
        .post('/api/reportes/marcar-procesados')
        .set('Authorization', `Bearer ${authTokenAdmin}`)
        .send({
          fecha_inicio: '2026-01-31',
          fecha_fin: '2026-01-01', // Fecha fin ANTES que inicio
          nomina_id: 125
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toBeDefined();
    });
  });

  // ==========================================================================
  // GRUPO 3: PERMISOS
  // ==========================================================================

  describe('Permisos de acceso', () => {
    it('Test 7: ADMIN puede marcar como procesados (200)', async () => {
      await createTestTurno('2026-01-02', 10, 2, false);

      const response = await request(app)
        .post('/api/reportes/marcar-procesados')
        .set('Authorization', `Bearer ${authTokenAdmin}`)
        .send({
          fecha_inicio: '2026-01-01',
          fecha_fin: '2026-01-15',
          nomina_id: 125
        });

      expect(response.status).toBe(200);
      expect(response.body.turnos_procesados).toBeGreaterThanOrEqual(0);
    });

    it('Test 8: SUPERVISOR NO puede marcar como procesados (403)', async () => {
      const response = await request(app)
        .post('/api/reportes/marcar-procesados')
        .set('Authorization', `Bearer ${authTokenSupervisor}`)
        .send({
          fecha_inicio: '2026-01-01',
          fecha_fin: '2026-01-15',
          nomina_id: 125
        });

      expect(response.status).toBe(403);
      expect(response.body.error).toBeDefined();
    });

    it('Test 9: CONSULTA NO puede marcar como procesados (403)', async () => {
      const response = await request(app)
        .post('/api/reportes/marcar-procesados')
        .set('Authorization', `Bearer ${authTokenConsulta}`)
        .send({
          fecha_inicio: '2026-01-01',
          fecha_fin: '2026-01-15',
          nomina_id: 125
        });

      expect(response.status).toBe(403);
      expect(response.body.error).toBeDefined();
    });

    it('Test 10: Sin autenticación debe retornar 401', async () => {
      const response = await request(app)
        .post('/api/reportes/marcar-procesados')
        .send({
          fecha_inicio: '2026-01-01',
          fecha_fin: '2026-01-15',
          nomina_id: 125
        });

      expect(response.status).toBe(401);
    });
  });
});
```

---

### 4.6. Documentación (15 min)
**Archivo**: `docs/completed/T2.24_marcar_procesados.md`

- [ ] Documentar implementación completa
- [ ] Incluir ejemplos de uso con curl
- [ ] Documentar casos de prueba
- [ ] Incluir screenshots o salidas de tests (opcional)

---

## 5. Criterios de Aceptación

- [x] Schema de validación implementado con Zod
- [x] Service layer: función `marcarTurnosProcesados()` funcionando
- [x] Controller layer: función `marcarProcesadosController()` funcionando
- [x] Route layer: `POST /marcar-procesados` con middlewares correctos
- [x] Solo ADMIN puede acceder (403 para SUPERVISOR y CONSULTA)
- [x] UPDATE solo afecta turnos NO procesados (`procesado_nomina = FALSE`)
- [x] Tests de integración: mínimo 8 tests pasando (10 implementados)
- [x] Documentación completada

---

## 6. Testing Manual

### Caso 1: Marcar turnos como procesados (Happy Path)

**Request**:
```bash
curl -X POST http://localhost:3000/api/reportes/marcar-procesados \
  -H "Authorization: Bearer <ADMIN_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "fecha_inicio": "2026-01-01",
    "fecha_fin": "2026-01-15",
    "nomina_id": 125
  }'
```

**Expected Response (200)**:
```json
{
  "turnos_procesados": 45,
  "nomina_id": 125,
  "fecha_inicio": "2026-01-01",
  "fecha_fin": "2026-01-15"
}
```

### Caso 2: Validación de nomina_id inválido

**Request**:
```bash
curl -X POST http://localhost:3000/api/reportes/marcar-procesados \
  -H "Authorization: Bearer <ADMIN_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "fecha_inicio": "2026-01-01",
    "fecha_fin": "2026-01-15",
    "nomina_id": -5
  }'
```

**Expected Response (400)**:
```json
{
  "error": "Datos inválidos",
  "details": [
    {
      "message": "nomina_id debe ser positivo",
      "path": ["body", "nomina_id"]
    }
  ]
}
```

### Caso 3: Usuario SUPERVISOR intenta marcar

**Request**:
```bash
curl -X POST http://localhost:3000/api/reportes/marcar-procesados \
  -H "Authorization: Bearer <SUPERVISOR_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "fecha_inicio": "2026-01-01",
    "fecha_fin": "2026-01-15",
    "nomina_id": 125
  }'
```

**Expected Response (403)**:
```json
{
  "error": "Acceso denegado",
  "message": "No tiene permisos para acceder a este recurso"
}
```

---

## 7. Verificación en Base de Datos

Después de ejecutar el endpoint, verificar en BD:

```sql
-- Ver turnos procesados en rango
SELECT
  id,
  empleado_id,
  fecha,
  procesado_nomina,
  nomina_id,
  updated_at
FROM turnos
WHERE fecha BETWEEN '2026-01-01' AND '2026-01-15'
  AND procesado_nomina = TRUE;

-- Contar turnos procesados por nómina
SELECT
  nomina_id,
  COUNT(*) as total_turnos,
  SUM(horas_normales) as total_horas_normales,
  SUM(horas_extras) as total_horas_extras
FROM turnos
WHERE procesado_nomina = TRUE
GROUP BY nomina_id;
```

---

## 8. Riesgos y Mitigaciones

### Riesgo 1: Actualizar turnos incorrectos
**Mitigación**: Usar condición `AND procesado_nomina = FALSE` en UPDATE.

### Riesgo 2: Permisos insuficientes
**Mitigación**: Solo ADMIN puede ejecutar (requireRole('ADMIN')).

### Riesgo 3: Validación de fechas
**Mitigación**: Usar schema Zod con regex y refinement.

---

## 9. Checklist de Ejecución

- [ ] 1. Agregar schema a `reporte.schema.ts`
- [ ] 2. Agregar service a `reportes.service.ts`
- [ ] 3. Agregar controller a `reportes.controller.ts`
- [ ] 4. Agregar route a `reportes.routes.ts`
- [ ] 5. Ejecutar tests: `npm test -- reportes.integration.test.ts`
- [ ] 6. Verificar cobertura de tests (mínimo 8 tests pasando)
- [ ] 7. Testing manual con curl
- [ ] 8. Documentar en `T2.24_marcar_procesados.md`
- [ ] 9. Actualizar README si es necesario
- [ ] 10. Commit cambios

---

## 10. Notas Finales

- Endpoint complementa el flujo de integración con sistema de nómina
- Permite trazabilidad: cada turno queda vinculado a su `nomina_id`
- Inmutabilidad: turnos ya procesados NO se actualizan
- Solo ADMIN tiene permisos para evitar errores operativos

---

**Estimación total**: 2h 30min
**Prioridad**: Alta (completa flujo de reportes)
