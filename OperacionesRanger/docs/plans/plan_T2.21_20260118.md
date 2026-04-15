# Plan: T2.21 - Implementar endpoints de actualización y eliminación de turnos

**Fecha**: 2026-01-18
**Tarea padre**: T2.21
**Fase**: Fase 2 - Backend Core
**Sprint**: Sprint 3 - Integración RRHH y Turnos
**Estimación**: 3-4 horas

---

## Objetivo

Implementar endpoints PUT /api/turnos/:id y DELETE /api/turnos/:id para permitir la modificación y eliminación de turnos de guardianes, con la restricción crítica de que solo pueden modificarse turnos NO procesados en nómina (procesado_nomina = FALSE).

---

## Contexto

### Archivos Existentes

De las tareas T2.19 y T2.20, ya existen:
- `backend/src/services/turnos.service.ts` (725 líneas) - Métodos: registrarTurno, getTurnos, getTurnoById, getResumenEmpleado
- `backend/src/controllers/turnos.controller.ts` (321 líneas) - Controllers: POST, GET, GET/:id, GET/resumen
- `backend/src/routes/turnos.routes.ts` (247 líneas) - Rutas: POST, GET, GET/:id, GET/resumen
- `backend/src/models/turno.model.ts` (611 líneas) - Incluye UpdateTurnoDTO, canEditTurno, canDeleteTurno
- `backend/tests/integration/turnos.integration.test.ts` (~600 líneas con 35 tests)

### Reglas de Negocio Críticas

1. **Inmutabilidad de turnos procesados**: Si procesado_nomina = TRUE, el turno NO puede ser modificado ni eliminado (403 Forbidden)
2. **Estrategia de UPDATE**: Eliminar turno existente + Crear nuevo (para re-ejecutar SP con validaciones)
3. **Permisos**:
   - PUT: ADMIN, SUPERVISOR
   - DELETE: Solo ADMIN
4. **No modificables vía PUT**: empleado_id, puesto_id, fecha (usar DELETE + POST si se necesita cambiar)

### Custom Errors Ya Existentes (Reutilizar)

- `TurnoNoExisteError` (404)
- `EmpleadoNoExisteError` (404)
- `EmpleadoInactivoError` (400)
- `PuestoNoExisteError` (404)
- `PuestoInactivoError` (400)
- `TurnoDuplicadoError` (409)
- `HorasExcedidasError` (400)

### Nuevos Custom Errors a Crear

- `TurnoProcesadoError` (403) - Turno ya procesado, inmutable
- `TurnoNoExisteError` (404) - Turno no existe (¿ya existe? revisar)

---

## Subtareas

### Subtarea 1: Crear custom errors para UPDATE/DELETE

**Descripción**: Agregar custom errors específicos para validación de turnos procesados

**Archivos a modificar**:
- `backend/src/services/turnos.service.ts`

**Resultado esperado**:
```typescript
/**
 * Error cuando se intenta modificar/eliminar turno procesado en nómina
 */
export class TurnoProcesadoError extends Error {
  constructor(id: number) {
    super(`El turno ${id} ya fue procesado en nómina y no puede ser modificado`);
    this.name = 'TurnoProcesadoError';
  }
}

/**
 * Error cuando el turno no existe en BD (si no existe ya)
 */
export class TurnoNoExisteError extends Error {
  constructor(id: number) {
    super(`El turno ${id} no existe`);
    this.name = 'TurnoNoExisteError';
  }
}
```

**Ubicación**: Después de la sección "CUSTOM ERRORS" (~línea 80-145)

---

### Subtarea 2: Implementar método verificarTurnoNoProcesado (helper privado)

**Descripción**: Función auxiliar para verificar que un turno existe y no está procesado

**Archivos a modificar**:
- `backend/src/services/turnos.service.ts`

**Resultado esperado**:
```typescript
/**
 * Verificar que turno existe y NO está procesado
 *
 * @param id - ID del turno a verificar
 * @throws TurnoNoExisteError si turno no existe
 * @throws TurnoProcesadoError si procesado_nomina = TRUE
 */
async function verificarTurnoNoProcesado(id: number): Promise<void> {
  const pool = getTurnosPool();

  const [rows] = await pool.execute<RowDataPacket[]>(
    'SELECT procesado_nomina FROM turnos WHERE id = ? LIMIT 1',
    [id]
  );

  if (rows.length === 0) {
    throw new TurnoNoExisteError(id);
  }

  const turno = rows[0];
  if (turno.procesado_nomina) {
    throw new TurnoProcesadoError(id);
  }
}
```

**Ubicación**: En sección "FUNCIONES AUXILIARES" (~línea 148-276), después de validarPuestoActivo

---

### Subtarea 3: Implementar método actualizarTurno en service

**Descripción**: Método para actualizar turno usando estrategia DELETE + CREATE

**Archivos a modificar**:
- `backend/src/services/turnos.service.ts`

**Resultado esperado**:
```typescript
/**
 * Actualizar turno existente
 *
 * Estrategia: DELETE turno antiguo + INSERT nuevo (vía sp_registrar_turno)
 * para re-ejecutar validaciones y cálculos automáticos.
 *
 * RESTRICCIÓN CRÍTICA: Solo si procesado_nomina = FALSE
 *
 * @param id - ID del turno a actualizar
 * @param dto - Datos actualizados (solo campos editables)
 * @param userId - ID del usuario que actualiza
 * @returns Turno actualizado con campos recalculados
 *
 * @throws TurnoNoExisteError si turno no existe
 * @throws TurnoProcesadoError si procesado_nomina = TRUE
 * @throws EmpleadoInactivoError si empleado se volvió inactivo
 * @throws PuestoInactivoError si puesto se volvió inactivo
 * @throws HorasExcedidasError si nuevas horas exceden límite
 */
export async function actualizarTurno(
  id: number,
  dto: UpdateTurnoDTO,
  userId: number
): Promise<Turno> {
  console.log(`[Turnos Service] Actualizando turno ${id}`);

  // VALIDACIÓN 1: Verificar que turno existe y NO está procesado
  await verificarTurnoNoProcesado(id);

  // PASO 2: Obtener turno actual para tener datos completos
  const turnoActual = await getTurnoByIdSimple(id);

  if (!turnoActual) {
    throw new TurnoNoExisteError(id);
  }

  // PASO 3: Construir CreateTurnoDTO con datos actuales + cambios
  const createDto: CreateTurnoDTO = {
    empleado_id: turnoActual.empleado_id, // NO modificable
    puesto_id: turnoActual.puesto_id,     // NO modificable
    fecha: turnoActual.fecha,             // NO modificable
    hora_entrada: dto.hora_entrada ?? turnoActual.hora_entrada,
    hora_salida: dto.hora_salida ?? turnoActual.hora_salida,
    horas_normales: dto.horas_normales ?? turnoActual.horas_normales,
    horas_extras: dto.horas_extras ?? turnoActual.horas_extras,
    observaciones: dto.observaciones !== undefined ? dto.observaciones : turnoActual.observaciones
  };

  // PASO 4: Iniciar transacción
  const pool = getTurnosPool();
  const connection = await pool.getConnection();
  await connection.beginTransaction();

  try {
    // PASO 5: DELETE turno antiguo
    await connection.execute('DELETE FROM turnos WHERE id = ?', [id]);
    console.log(`[Turnos Service] Turno ${id} eliminado para actualización`);

    // PASO 6: Convertir DTO a formato de BD
    const data = dtoToNuevoTurnoDB(createDto, userId);

    // PASO 7: Llamar a SP para crear turno nuevo (con re-cálculos)
    await connection.execute(
      `CALL sp_registrar_turno(?, ?, ?, ?, ?, ?, ?, ?, ?, @turno_id, @mensaje)`,
      [
        data.empleado_id,
        data.puesto_id,
        data.fecha,
        data.hora_entrada,
        data.hora_salida,
        data.horas_normales,
        data.horas_extras,
        data.observaciones,
        data.created_by,
      ]
    );

    // PASO 8: Obtener OUT parameters
    const [outParams] = await connection.execute<RowDataPacket[]>(
      'SELECT @turno_id AS turno_id, @mensaje AS mensaje'
    );

    const result = outParams[0] as { turno_id: number | null; mensaje: string };

    if (result.turno_id === null) {
      throw new Error(`Error al actualizar turno: ${result.mensaje}`);
    }

    // PASO 9: Commit transacción
    await connection.commit();
    console.log(`[Turnos Service] Turno actualizado exitosamente. Nuevo ID: ${result.turno_id}`);

    // PASO 10: Obtener turno recién creado
    const turnoNuevo = await getTurnoByIdSimple(result.turno_id);

    if (!turnoNuevo) {
      throw new Error(`Turno fue actualizado pero no se pudo recuperar`);
    }

    return turnoNuevo;
  } catch (error: any) {
    // Rollback en caso de error
    await connection.rollback();
    console.error(`[Turnos Service] Error al actualizar turno ${id}:`, error);

    // Re-lanzar custom errors
    if (
      error instanceof EmpleadoInactivoError ||
      error instanceof PuestoInactivoError ||
      error instanceof HorasExcedidasError
    ) {
      throw error;
    }

    // Error genérico
    throw new Error(`Error al actualizar turno: ${error.message}`);
  } finally {
    connection.release();
  }
}
```

**Ubicación**: Al final de sección "SERVICIO PRINCIPAL" (~línea 724), después de registrarTurno

---

### Subtarea 4: Implementar método eliminarTurno en service

**Descripción**: Método para eliminar turno (hard delete)

**Archivos a modificar**:
- `backend/src/services/turnos.service.ts`

**Resultado esperado**:
```typescript
/**
 * Eliminar turno
 *
 * RESTRICCIÓN CRÍTICA: Solo si procesado_nomina = FALSE
 *
 * @param id - ID del turno a eliminar
 * @param userId - ID del usuario que elimina (para auditoría)
 * @returns void
 *
 * @throws TurnoNoExisteError si turno no existe
 * @throws TurnoProcesadoError si procesado_nomina = TRUE
 */
export async function eliminarTurno(id: number, userId: number): Promise<void> {
  console.log(`[Turnos Service] Eliminando turno ${id} (usuario: ${userId})`);

  // VALIDACIÓN 1: Verificar que turno existe y NO está procesado
  await verificarTurnoNoProcesado(id);

  // PASO 2: DELETE del turno
  const pool = getTurnosPool();

  const [result] = await pool.execute<ResultSetHeader>(
    'DELETE FROM turnos WHERE id = ?',
    [id]
  );

  if (result.affectedRows === 0) {
    throw new TurnoNoExisteError(id);
  }

  console.log(`[Turnos Service] Turno ${id} eliminado exitosamente`);
}
```

**Ubicación**: Después de actualizarTurno

---

### Subtarea 5: Crear controller actualizarTurnoController

**Descripción**: Handler para PUT /api/turnos/:id

**Archivos a modificar**:
- `backend/src/controllers/turnos.controller.ts`

**Imports a agregar**:
```typescript
import { UpdateTurnoDTO } from '../models/turno.model';
import {
  TurnoProcesadoError,
  TurnoNoExisteError, // Si no existe ya
} from '../services/turnos.service';
```

**Resultado esperado**:
```typescript
/**
 * PUT /api/turnos/:id
 *
 * Actualizar turno existente
 *
 * Path params:
 * - id: ID del turno
 *
 * Body (UpdateTurnoDTO):
 * {
 *   hora_entrada?: string (HH:MM:SS),
 *   hora_salida?: string (HH:MM:SS),
 *   horas_normales?: number,
 *   horas_extras?: number,
 *   observaciones?: string | null
 * }
 *
 * Response 200: Turno actualizado
 * {
 *   message: "Turno actualizado exitosamente",
 *   data: Turno (con campos recalculados: tipo_turno, es_feriado)
 * }
 *
 * Response 400: Validación fallida (horas excedidas, empleado inactivo, puesto inactivo)
 * Response 403: Turno ya procesado en nómina (inmutable)
 * Response 404: Turno no existe
 * Response 500: Error interno del servidor
 */
export async function actualizarTurnoController(req: Request, res: Response): Promise<void> {
  try {
    const id = Number(req.params.id);
    const dto: UpdateTurnoDTO = req.body;

    // Obtener userId del token
    const userId = (req as any).user?.sub;

    if (!userId) {
      res.status(401).json({
        error: 'No autenticado',
        message: 'Usuario no identificado'
      });
      return;
    }

    // Llamar al servicio para actualizar turno
    const turno = await turnosService.actualizarTurno(id, dto, userId);

    res.status(200).json({
      message: 'Turno actualizado exitosamente',
      data: turno
    });
  } catch (error: any) {
    console.error('Error en actualizarTurnoController:', error);

    // Mapear custom errors a códigos HTTP
    if (error instanceof TurnoNoExisteError) {
      res.status(404).json({
        error: 'Turno no encontrado',
        message: error.message
      });
      return;
    }

    if (error instanceof TurnoProcesadoError) {
      res.status(403).json({
        error: 'Operación no permitida',
        message: error.message
      });
      return;
    }

    if (
      error instanceof EmpleadoInactivoError ||
      error instanceof PuestoInactivoError ||
      error instanceof HorasExcedidasError
    ) {
      res.status(400).json({
        error: 'Validación fallida',
        message: error.message
      });
      return;
    }

    // Error genérico
    res.status(500).json({
      error: 'Error interno del servidor',
      message: 'No se pudo actualizar el turno'
    });
  }
}
```

**Ubicación**: Después de registrarTurnoController (~línea 320)

---

### Subtarea 6: Crear controller eliminarTurnoController

**Descripción**: Handler para DELETE /api/turnos/:id

**Archivos a modificar**:
- `backend/src/controllers/turnos.controller.ts`

**Resultado esperado**:
```typescript
/**
 * DELETE /api/turnos/:id
 *
 * Eliminar turno
 *
 * Path params:
 * - id: ID del turno
 *
 * Response 200: Turno eliminado
 * {
 *   message: "Turno eliminado exitosamente"
 * }
 *
 * Response 403: Turno ya procesado en nómina (no puede eliminarse)
 * Response 404: Turno no existe
 * Response 500: Error interno del servidor
 */
export async function eliminarTurnoController(req: Request, res: Response): Promise<void> {
  try {
    const id = Number(req.params.id);

    // Obtener userId del token
    const userId = (req as any).user?.sub;

    if (!userId) {
      res.status(401).json({
        error: 'No autenticado',
        message: 'Usuario no identificado'
      });
      return;
    }

    // Llamar al servicio para eliminar turno
    await turnosService.eliminarTurno(id, userId);

    res.status(200).json({
      message: 'Turno eliminado exitosamente'
    });
  } catch (error: any) {
    console.error('Error en eliminarTurnoController:', error);

    // Mapear custom errors a códigos HTTP
    if (error instanceof TurnoNoExisteError) {
      res.status(404).json({
        error: 'Turno no encontrado',
        message: error.message
      });
      return;
    }

    if (error instanceof TurnoProcesadoError) {
      res.status(403).json({
        error: 'Operación no permitida',
        message: error.message
      });
      return;
    }

    // Error genérico
    res.status(500).json({
      error: 'Error interno del servidor',
      message: 'No se pudo eliminar el turno'
    });
  }
}
```

**Ubicación**: Después de actualizarTurnoController

---

### Subtarea 7: Crear schema de validación updateTurnoSchema

**Descripción**: Schema Zod para validar body de PUT /api/turnos/:id

**Archivos a modificar**:
- `backend/src/schemas/turno.schema.ts`

**Resultado esperado**:
```typescript
/**
 * Schema para actualizar turno existente
 * Validación de body para PUT /api/turnos/:id
 *
 * Todos los campos son opcionales
 */
export const updateTurnoBodySchema = z.object({
  hora_entrada: z
    .string()
    .regex(/^\d{2}:\d{2}:\d{2}$/, 'Hora de entrada debe tener formato HH:MM:SS')
    .optional(),
  hora_salida: z
    .string()
    .regex(/^\d{2}:\d{2}:\d{2}$/, 'Hora de salida debe tener formato HH:MM:SS')
    .optional(),
  horas_normales: z
    .number()
    .min(TURNO_VALIDATION.HORAS_NORMALES.MIN, 'Horas normales mínimo 0')
    .max(TURNO_VALIDATION.HORAS_NORMALES.MAX, 'Horas normales máximo 12')
    .optional(),
  horas_extras: z
    .number()
    .min(TURNO_VALIDATION.HORAS_EXTRAS.MIN, 'Horas extras mínimo 0')
    .max(TURNO_VALIDATION.HORAS_EXTRAS.MAX, 'Horas extras máximo 4')
    .optional(),
  observaciones: z
    .string()
    .max(TURNO_VALIDATION.OBSERVACIONES.MAX_LENGTH, 'Observaciones máximo 1000 caracteres')
    .nullable()
    .optional()
}).refine(
  (data) => {
    // Si ambos campos de horas están presentes, validar total <= 16
    if (data.horas_normales !== undefined && data.horas_extras !== undefined) {
      return data.horas_normales + data.horas_extras <= TURNO_VALIDATION.HORAS_TOTALES.MAX;
    }
    return true;
  },
  {
    message: 'Total de horas (normales + extras) no puede exceder 16 horas',
    path: ['horas_totales']
  }
);

/**
 * Schema completo para PUT /api/turnos/:id
 * Incluye validación de params (id) y body (UpdateTurnoDTO)
 */
export const updateTurnoSchema = {
  params: turnoIdSchema,
  body: updateTurnoBodySchema
};
```

**Ubicación**: Después de createTurnoSchema (~línea 580)

---

### Subtarea 8: Agregar rutas PUT y DELETE

**Descripción**: Registrar rutas con middlewares apropiados

**Archivos a modificar**:
- `backend/src/routes/turnos.routes.ts`

**Imports a agregar**:
```typescript
import { updateTurnoSchema } from '../schemas/turno.schema';
import {
  actualizarTurnoController,
  eliminarTurnoController
} from '../controllers/turnos.controller';
```

**Resultado esperado**:
```typescript
// ============================================================================
// RUTAS DE ACTUALIZACIÓN Y ELIMINACIÓN (PUT, DELETE)
// ============================================================================

/**
 * PUT /api/turnos/:id
 *
 * Actualizar turno existente
 *
 * Permisos: ADMIN, SUPERVISOR
 *
 * RESTRICCIÓN CRÍTICA: Solo si procesado_nomina = FALSE
 *
 * Body (UpdateTurnoDTO):
 * {
 *   hora_entrada?: string,      // Hora de entrada (HH:MM:SS)
 *   hora_salida?: string,        // Hora de salida (HH:MM:SS)
 *   horas_normales?: number,     // Horas normales (0-12)
 *   horas_extras?: number,       // Horas extras (0-4)
 *   observaciones?: string | null // Observaciones opcionales
 * }
 *
 * Campos NO modificables:
 * - empleado_id
 * - puesto_id
 * - fecha
 * (Si necesita cambiar estos, usar DELETE + POST)
 *
 * Validaciones:
 * - Turno debe existir
 * - Turno NO debe estar procesado (procesado_nomina = false)
 * - Empleado sigue activo
 * - Puesto sigue activo
 * - Horas normales <= 12
 * - Horas extras <= 4
 * - Horas totales <= 16
 *
 * Estrategia de actualización:
 * DELETE turno antiguo + INSERT nuevo (vía sp_registrar_turno)
 * para re-ejecutar validaciones y cálculos automáticos (tipo_turno, es_feriado)
 *
 * Response 200: Turno actualizado
 * {
 *   message: "Turno actualizado exitosamente",
 *   data: Turno (con campos recalculados)
 * }
 *
 * Response 400: Validación fallida
 * Response 403: Turno ya procesado (inmutable)
 * Response 404: Turno no existe
 */
router.put(
  '/:id',
  authMiddleware,
  requireRole('ADMIN', 'SUPERVISOR'),
  validateRequest(updateTurnoSchema),
  actualizarTurnoController
);

/**
 * DELETE /api/turnos/:id
 *
 * Eliminar turno
 *
 * Permisos: Solo ADMIN
 *
 * RESTRICCIÓN CRÍTICA: Solo si procesado_nomina = FALSE
 *
 * Path params:
 * - id: ID del turno a eliminar
 *
 * Validaciones:
 * - Turno debe existir
 * - Turno NO debe estar procesado (procesado_nomina = false)
 *
 * Response 200:
 * {
 *   message: "Turno eliminado exitosamente"
 * }
 *
 * Response 403: Turno ya procesado (no puede eliminarse)
 * Response 404: Turno no existe
 */
router.delete(
  '/:id',
  authMiddleware,
  requireRole('ADMIN'), // Solo ADMIN puede eliminar
  validateRequest({ params: turnoIdSchema }),
  eliminarTurnoController
);
```

**Ubicación**: Después de la ruta GET /:id (~línea 241), ANTES de `export default router;`

---

### Subtarea 9: Agregar tests de integración para PUT /api/turnos/:id

**Descripción**: Tests para actualización de turnos

**Archivos a modificar**:
- `backend/tests/integration/turnos.integration.test.ts`

**Resultado esperado**: 7 tests (tests 36-42)

```typescript
// ============================================================================
// GRUPO 10: PUT /api/turnos/:id (7 tests)
// ============================================================================

describe('PUT /api/turnos/:id', () => {
  let turnoId: number;

  beforeEach(async () => {
    // Crear turno de prueba NO procesado
    const response = await request(app)
      .post('/api/turnos')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        empleado_id: testEmpleadoId,
        puesto_id: testPuestoId,
        fecha: testFecha,
        hora_entrada: '06:00:00',
        hora_salida: '18:00:00',
        horas_normales: 10.0,
        horas_extras: 2.0
      });

    turnoId = response.body.data.id;
  });

  // Test 36: Actualización exitosa
  it('debe actualizar turno válido y retornar 200', async () => {
    const response = await request(app)
      .put(`/api/turnos/${turnoId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        horas_normales: 11.0,
        horas_extras: 1.0,
        observaciones: 'Turno actualizado'
      });

    expect(response.status).toBe(200);
    expect(response.body.message).toBe('Turno actualizado exitosamente');
    expect(response.body.data.horas_normales).toBe(11.0);
    expect(response.body.data.horas_extras).toBe(1.0);
    expect(response.body.data.observaciones).toBe('Turno actualizado');
    // Verificar que tipo_turno se recalculó
    expect(response.body.data.tipo_turno).toBeDefined();
  });

  // Test 37: Actualización falla si turno procesado
  it('debe rechazar actualización de turno procesado → 403', async () => {
    // Marcar turno como procesado
    await db.execute(
      'UPDATE turnos SET procesado_nomina = TRUE, nomina_id = 999 WHERE id = ?',
      [turnoId]
    );

    const response = await request(app)
      .put(`/api/turnos/${turnoId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        horas_normales: 11.0
      });

    expect(response.status).toBe(403);
    expect(response.body.error).toContain('no permitida');
    expect(response.body.message).toContain('procesado en nómina');
  });

  // Test 38: Actualización falla si turno no existe
  it('debe rechazar actualización de turno inexistente → 404', async () => {
    const response = await request(app)
      .put('/api/turnos/99999')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        horas_normales: 11.0
      });

    expect(response.status).toBe(404);
    expect(response.body.error).toContain('no encontrado');
  });

  // Test 39: Validación de horas totales > 16
  it('debe rechazar actualización con horas totales > 16 → 400', async () => {
    const response = await request(app)
      .put(`/api/turnos/${turnoId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        horas_normales: 12.0,
        horas_extras: 5.0 // Total = 17 > 16
      });

    expect(response.status).toBe(400);
  });

  // Test 40: Sin autenticación
  it('debe rechazar actualización sin token → 401', async () => {
    const response = await request(app)
      .put(`/api/turnos/${turnoId}`)
      .send({
        horas_normales: 11.0
      });

    expect(response.status).toBe(401);
  });

  // Test 41: Rol CONSULTA no puede actualizar
  it('debe rechazar actualización con rol CONSULTA → 403', async () => {
    const response = await request(app)
      .put(`/api/turnos/${turnoId}`)
      .set('Authorization', `Bearer ${consultaToken}`)
      .send({
        horas_normales: 11.0
      });

    expect(response.status).toBe(403);
  });

  // Test 42: Rol SUPERVISOR puede actualizar
  it('debe permitir actualización con rol SUPERVISOR → 200', async () => {
    const response = await request(app)
      .put(`/api/turnos/${turnoId}`)
      .set('Authorization', `Bearer ${supervisorToken}`)
      .send({
        horas_normales: 9.0
      });

    expect(response.status).toBe(200);
  });
});
```

**Ubicación**: Al final del archivo, después de tests existentes (~línea 800+)

---

### Subtarea 10: Agregar tests de integración para DELETE /api/turnos/:id

**Descripción**: Tests para eliminación de turnos

**Archivos a modificar**:
- `backend/tests/integration/turnos.integration.test.ts`

**Resultado esperado**: 6 tests (tests 43-48)

```typescript
// ============================================================================
// GRUPO 11: DELETE /api/turnos/:id (6 tests)
// ============================================================================

describe('DELETE /api/turnos/:id', () => {
  let turnoId: number;

  beforeEach(async () => {
    // Crear turno de prueba NO procesado
    const response = await request(app)
      .post('/api/turnos')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        empleado_id: testEmpleadoId,
        puesto_id: testPuestoId,
        fecha: testFecha,
        hora_entrada: '06:00:00',
        hora_salida: '18:00:00',
        horas_normales: 10.0,
        horas_extras: 2.0
      });

    turnoId = response.body.data.id;
  });

  // Test 43: Eliminación exitosa
  it('debe eliminar turno válido y retornar 200', async () => {
    const response = await request(app)
      .delete(`/api/turnos/${turnoId}`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(response.status).toBe(200);
    expect(response.body.message).toBe('Turno eliminado exitosamente');

    // Verificar que turno ya no existe
    const getTurnoResponse = await request(app)
      .get(`/api/turnos/${turnoId}`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(getTurnoResponse.status).toBe(404);
  });

  // Test 44: Eliminación falla si turno procesado
  it('debe rechazar eliminación de turno procesado → 403', async () => {
    // Marcar turno como procesado
    await db.execute(
      'UPDATE turnos SET procesado_nomina = TRUE, nomina_id = 999 WHERE id = ?',
      [turnoId]
    );

    const response = await request(app)
      .delete(`/api/turnos/${turnoId}`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(response.status).toBe(403);
    expect(response.body.error).toContain('no permitida');
    expect(response.body.message).toContain('procesado en nómina');
  });

  // Test 45: Eliminación falla si turno no existe
  it('debe rechazar eliminación de turno inexistente → 404', async () => {
    const response = await request(app)
      .delete('/api/turnos/99999')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(response.status).toBe(404);
    expect(response.body.error).toContain('no encontrado');
  });

  // Test 46: Sin autenticación
  it('debe rechazar eliminación sin token → 401', async () => {
    const response = await request(app)
      .delete(`/api/turnos/${turnoId}`);

    expect(response.status).toBe(401);
  });

  // Test 47: Rol SUPERVISOR no puede eliminar
  it('debe rechazar eliminación con rol SUPERVISOR → 403', async () => {
    const response = await request(app)
      .delete(`/api/turnos/${turnoId}`)
      .set('Authorization', `Bearer ${supervisorToken}`);

    expect(response.status).toBe(403);
  });

  // Test 48: Solo ADMIN puede eliminar
  it('debe permitir eliminación solo con rol ADMIN → 200', async () => {
    const response = await request(app)
      .delete(`/api/turnos/${turnoId}`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(response.status).toBe(200);
  });
});
```

**Ubicación**: Después de tests de PUT (~línea 900+)

---

### Subtarea 11: Ejecutar tests de integración

**Descripción**: Ejecutar suite completa de tests

**Comando**:
```bash
cd "E:\ranger sistemas\OperacionesRanger\backend"
npm test -- turnos.integration.test.ts --no-coverage
```

**Resultado esperado**:
- Total: 48 tests (16 POST + 19 GET + 7 PUT + 6 DELETE)
- Objetivo: 100% pasando
- Si hay errores pre-existentes en ubicaciones.service.ts, documentar que están fuera del alcance

---

### Subtarea 12: Documentar resultado

**Descripción**: Crear archivo de completitud completo

**Archivo a crear**: `docs/completed/T2.21_actualizar_eliminar_turnos.md`

**Contenido**:
- Resumen de implementación
- Subtareas completadas
- Archivos modificados (con líneas agregadas)
- Criterios de aceptación cumplidos
- Comandos ejecutados
- Pruebas realizadas
- Decisiones técnicas tomadas
- Próximos pasos
- Notas adicionales

---

## Criterios de Aceptación (checklist)

- [ ] Custom errors creados (TurnoProcesadoError, TurnoNoExisteError)
- [ ] Método verificarTurnoNoProcesado() implementado
- [ ] Método actualizarTurno() implementado
- [ ] Método eliminarTurno() implementado
- [ ] Validación procesado_nomina funcionando (403 si true)
- [ ] 2 handlers de controller agregados (PUT, DELETE)
- [ ] 2 rutas agregadas (PUT /:id, DELETE /:id)
- [ ] PUT accesible por ADMIN y SUPERVISOR
- [ ] DELETE solo accesible por ADMIN
- [ ] Schema updateTurnoSchema creado
- [ ] Tests PUT >= 7 tests agregados
- [ ] Tests DELETE >= 6 tests agregados
- [ ] Total tests >= 13 tests agregados
- [ ] Documentación completa creada

---

## Archivos a Generar/Modificar

**Modificados** (agregar funcionalidad):
- `backend/src/services/turnos.service.ts` (+200 líneas aprox)
- `backend/src/controllers/turnos.controller.ts` (+150 líneas aprox)
- `backend/src/routes/turnos.routes.ts` (+120 líneas aprox)
- `backend/src/schemas/turno.schema.ts` (+60 líneas aprox)
- `backend/tests/integration/turnos.integration.test.ts` (+300 líneas aprox)

**Creados**:
- `docs/completed/T2.21_actualizar_eliminar_turnos.md`

**Total**: ~830 líneas de código agregadas

---

## Riesgos y Consideraciones

### Riesgo 1: Transacciones en actualizarTurno

**Descripción**: La estrategia DELETE + INSERT requiere transacción para garantizar atomicidad

**Mitigación**:
- Usar `connection.beginTransaction()` y `connection.commit()`
- Rollback en caso de error con `connection.rollback()`
- Release de connection en bloque `finally`

---

### Riesgo 2: ID del turno cambia al actualizar

**Descripción**: Al eliminar y crear nuevo, el ID cambia

**Mitigación**:
- Documentar en response que el ID puede cambiar
- Retornar nuevo turno completo con nuevo ID
- Frontend debe usar el nuevo ID retornado

---

### Riesgo 3: Race condition con procesado_nomina

**Descripción**: Entre verificación y DELETE, el turno podría ser marcado como procesado

**Mitigación**:
- Usar transacciones para toda la operación
- Considerar agregar constraint CHECK en BD (futuro)
- Por ahora, aceptar riesgo mínimo (sistema de nómina externo marca turnos en batch)

---

### Riesgo 4: Tests bloqueados por errores pre-existentes

**Descripción**: ubicaciones.service.ts tiene exports faltantes

**Mitigación**:
- Documentar que errores son de T2.08
- Código de T2.21 es correcto
- Tests están bien implementados, solo necesitan que errores pre-existentes se corrijan

---

## Notas Adicionales

### Estrategia de Actualización: DELETE + INSERT

**¿Por qué no UPDATE directo?**

1. **Re-ejecutar validaciones**: El SP sp_registrar_turno hace validaciones complejas (duplicados, horas)
2. **Re-calcular campos**: tipo_turno y es_feriado deben recalcularse si cambian hora_entrada o fecha
3. **Simplicidad**: Reutilizar lógica existente en vez de duplicar validaciones en UPDATE
4. **Consistencia**: Garantiza que UPDATE tiene mismas validaciones que INSERT

**Desventaja**: El ID del turno cambia

**Solución**: Documentar claramente y retornar nuevo turno completo con nuevo ID

---

### Campos NO Modificables vía PUT

- `empleado_id`: Cambiaría la persona que trabajó el turno (incorrecto)
- `puesto_id`: Cambiaría el lugar de trabajo (incorrecto)
- `fecha`: Cambiaría el día del turno (incorrecto)

**Si necesita cambiar estos**: Usar DELETE + POST manual

---

### Inmutabilidad de Turnos Procesados

Una vez que `procesado_nomina = TRUE`:
- El turno ya fue exportado a sistema de nómina
- Modificarlo causaría inconsistencias con la nómina generada
- El turno debe permanecer inmutable

**Solución**: Bloquear UPDATE y DELETE con validación `verificarTurnoNoProcesado()`

---

### Permisos Diferenciados

**PUT /api/turnos/:id**:
- ADMIN: Puede actualizar ✅
- SUPERVISOR: Puede actualizar ✅
- CONSULTA: No puede actualizar ❌

**DELETE /api/turnos/:id**:
- ADMIN: Puede eliminar ✅
- SUPERVISOR: No puede eliminar ❌
- CONSULTA: No puede eliminar ❌

**Justificación**: Eliminar es más peligroso que actualizar, solo ADMIN debe poder hacerlo

---

## Referencias

- **Tarea anterior**: `docs/completed/T2.19_endpoint_registro_turno.md`
- **Tarea anterior**: `docs/completed/T2.20_endpoints_consulta_turnos.md`
- **Modelo**: `backend/src/models/turno.model.ts`
- **Middlewares**: `backend/src/middlewares/auth.middleware.ts`, `role.middleware.ts`
- **SP**: `sistema_turnos_guardianes.sql` (sp_registrar_turno)
- **Documentación de proyecto**: `CLAUDE.md`
- **Metodología**: `Metodologia.md`

---

**Plan creado**: 2026-01-18
**Estimación total**: 3-4 horas
**Complejidad**: Media (uso de transacciones, estrategia DELETE+INSERT)
**Bloqueadores**: Ninguno (errores pre-existentes no bloquean implementación)
**Listo para ejecución**: ✅ SÍ
