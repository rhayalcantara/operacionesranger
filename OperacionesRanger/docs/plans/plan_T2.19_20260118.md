# Plan de Implementación: T2.19 - Endpoint de Registro de Turnos

**Tarea**: T2.19 - Implementar endpoint de registro de turnos
**Fecha de creación**: 2026-01-18
**Estimación**: 4-5 horas
**Prioridad**: Alta
**Dependencias**: T2.18 ✓ (Modelo y validaciones de turnos completado)

---

## Resumen de la Tarea

Crear el endpoint POST /api/turnos para registrar turnos de guardianes de seguridad. El endpoint debe usar el stored procedure `sp_registrar_turno` para asegurar que los campos auto-calculados (tipo_turno, es_feriado, feriado_id) se generen correctamente. Se deben implementar validaciones pre-SP para verificar la existencia y estado activo del empleado (BD RRHH) y del puesto (BD turnos).

**Contexto técnico**:
- T2.18 ya implementó el modelo completo (interfaces, DTOs, schemas Zod)
- sp_registrar_turno calcula automáticamente: tipo_turno, es_feriado, feriado_id
- El SP también valida duplicados (constraint UK: empleado_id + puesto_id + fecha)
- Trigger `trg_turnos_before_insert` valida límites de horas (<= 16 totales)

---

## Análisis de Dependencias

### Archivos que LEER primero:
1. ✅ `docs/tasks/tareas_fase2_backend_core_20260118.md` - Especificación de T2.19
2. ✅ `docs/completed/T2.18_modelo_turnos.md` - Documentación del modelo
3. ✅ `sistema_turnos_guardianes.sql` - Stored procedure sp_registrar_turno
4. ✅ `backend/src/models/turno.model.ts` - Interfaces y tipos
5. ✅ `backend/src/schemas/turno.schema.ts` - Schemas de validación
6. ✅ `backend/src/middlewares/auth.middleware.ts` - Middleware de autenticación
7. ✅ `backend/src/services/rrhh.service.ts` - Servicio para validar empleados
8. ✅ `backend/src/config/database.ts` - Conexión a BD (getTurnosPool)

### Archivos de REFERENCIA (patrones existentes):
9. ✅ `backend/src/controllers/puestos.controller.ts` - Patrón de controller
10. ✅ `backend/src/routes/puestos.routes.ts` - Patrón de routes
11. `backend/src/services/puestos.service.ts` - Patrón de service

---

## Subtareas Planificadas

### **Subtarea 1**: Crear servicio de turnos (turnos.service.ts)
**Estimación**: 1.5 horas
**Archivos a crear**: `backend/src/services/turnos.service.ts`

**Funciones a implementar**:

1. **`registrarTurno(dto: CreateTurnoDTO, userId: number): Promise<Turno>`**
   - Validar que empleado existe y está activo (BD RRHH)
     - Usar `rrhh.service.validarGuardianActivo(empleado_id)`
     - Si no existe o inactivo → lanzar Error con mensaje claro
   - Validar que puesto existe y está activo (BD turnos)
     - Query: `SELECT id, activo FROM puestos WHERE id = ? LIMIT 1`
     - Si no existe o activo = false → lanzar Error
   - Llamar a stored procedure `sp_registrar_turno`
     - Parámetros: empleado_id, puesto_id, fecha, hora_entrada, hora_salida, horas_normales, horas_extras, observaciones, userId (created_by)
     - OUT parameters: p_turno_id, p_mensaje
     - Si p_turno_id es NULL → SP retornó error (duplicado u otro)
       - Parsear p_mensaje para determinar tipo de error
       - Si contiene "Ya existe" → Error 409 (duplicado)
       - Otro error → Error 400 (validación)
   - Si exitoso, consultar turno creado por ID
     - Query: `SELECT * FROM turnos WHERE id = ?`
   - Retornar turno completo

2. **Helper: `callSpRegistrarTurno(...params): Promise<{ turno_id: number | null, mensaje: string }>`**
   - Encapsula la llamada al SP
   - Usa `getTurnosPool().query()`
   - Query: `CALL sp_registrar_turno(?, ?, ?, ?, ?, ?, ?, ?, ?, @turno_id, @mensaje)`
   - Luego: `SELECT @turno_id AS turno_id, @mensaje AS mensaje`
   - Retornar objeto con OUT params

**Manejo de errores**:
- `EmpleadoNoExisteError` (404): Empleado no encontrado en BD RRHH
- `EmpleadoInactivoError` (400): Empleado existe pero status = 0
- `PuestoNoExisteError` (404): Puesto no encontrado
- `PuestoInactivoError` (400): Puesto existe pero activo = false
- `TurnoDuplicadoError` (409): Ya existe turno para empleado+puesto+fecha
- `HorasExcedidasError` (400): Trigger rechazó por horas > 16
- `DatabaseError` (500): Errores inesperados de BD

**Estructura esperada**:
```typescript
import { getTurnosPool, getRRHHPool } from '../config/database';
import { validarGuardianActivo } from './rrhh.service';
import { CreateTurnoDTO, Turno } from '../models/turno.model';
import { RowDataPacket } from 'mysql2/promise';

export async function registrarTurno(dto: CreateTurnoDTO, userId: number): Promise<Turno>
export async function callSpRegistrarTurno(...): Promise<{ turno_id: number | null, mensaje: string }>
```

---

### **Subtarea 2**: Crear controller de turnos (turnos.controller.ts)
**Estimación**: 45 minutos
**Archivos a crear**: `backend/src/controllers/turnos.controller.ts`

**Función a implementar**:

**`registrarTurnoController(req: Request, res: Response): Promise<void>`**
- Extraer datos de `req.body` (ya validados por middleware)
- Extraer `userId` de `req.user.sub` (inyectado por authMiddleware)
- Llamar a `turnos.service.registrarTurno(dto, userId)`
- Si exitoso:
  - Retornar 201 Created con turno completo
  - Body: `{ message: "Turno registrado exitosamente", data: turno }`
- Si error:
  - Catch y mapear errores a códigos HTTP apropiados:
    - EmpleadoNoExisteError, PuestoNoExisteError → 404
    - EmpleadoInactivoError, PuestoInactivoError, HorasExcedidasError → 400
    - TurnoDuplicadoError → 409
    - DatabaseError, otros → 500
  - Incluir mensaje de error claro en response

**Estructura esperada**:
```typescript
import { Request, Response } from 'express';
import * as turnosService from '../services/turnos.service';
import { CreateTurnoDTO } from '../models/turno.model';

export async function registrarTurnoController(req: Request, res: Response): Promise<void>
```

---

### **Subtarea 3**: Crear rutas de turnos (turnos.routes.ts)
**Estimación**: 30 minutos
**Archivos a crear**: `backend/src/routes/turnos.routes.ts`

**Ruta a implementar**:

**POST /api/turnos**
- Middleware chain:
  1. `authMiddleware` - Verificar JWT
  2. `requireRole('ADMIN', 'SUPERVISOR')` - Solo ADMIN y SUPERVISOR
  3. `validateRequest({ body: createTurnoSchema })` - Validar body con Zod
  4. `registrarTurnoController` - Ejecutar lógica
- Exportar router

**Estructura esperada**:
```typescript
import { Router } from 'express';
import { authMiddleware } from '../middlewares/auth.middleware';
import { requireRole } from '../middlewares/role.middleware';
import { validateRequest } from '../middlewares/validation.middleware';
import { createTurnoSchema } from '../schemas/turno.schema';
import { registrarTurnoController } from '../controllers/turnos.controller';

const router = Router();

router.post(
  '/',
  authMiddleware,
  requireRole('ADMIN', 'SUPERVISOR'),
  validateRequest({ body: createTurnoSchema }),
  registrarTurnoController
);

export default router;
```

---

### **Subtarea 4**: Registrar rutas en servidor principal (server.ts)
**Estimación**: 15 minutos
**Archivos a modificar**: `backend/src/server.ts`

**Cambios**:
1. Importar: `import turnosRoutes from './routes/turnos.routes';`
2. Registrar: `app.use('/api/turnos', turnosRoutes);`
3. Verificar orden (después de middlewares globales, antes de error handler)

---

### **Subtarea 5**: Crear tests de integración
**Estimación**: 1.5 horas
**Archivos a crear**: `backend/tests/integration/turnos.integration.test.ts`

**Suite de tests** (mínimo 15 tests):

**Grupo 1: Registro exitoso (3 tests)**
1. ✅ Debe registrar turno válido y retornar 201
2. ✅ Debe calcular tipo_turno automáticamente (DIURNO si entrada 06:00)
3. ✅ Debe calcular es_feriado automáticamente

**Grupo 2: Validaciones de Schema Zod (4 tests)**
4. ✅ Debe rechazar empleado_id inválido (string, negativo, cero) → 400
5. ✅ Debe rechazar horas_normales > 12 → 400
6. ✅ Debe rechazar horas_extras > 4 → 400
7. ✅ Debe rechazar horas totales > 16 → 400

**Grupo 3: Validaciones de Negocio Pre-SP (4 tests)**
8. ✅ Debe rechazar empleado_id inexistente → 404
9. ✅ Debe rechazar empleado_id inactivo (status = 0) → 400
10. ✅ Debe rechazar puesto_id inexistente → 404
11. ✅ Debe rechazar puesto_id inactivo → 400

**Grupo 4: Validaciones del SP y Trigger (2 tests)**
12. ✅ Debe rechazar turno duplicado (mismo empleado+puesto+fecha) → 409
13. ✅ Debe rechazar si trigger detecta horas > 16 (edge case) → 400

**Grupo 5: Autorización (2 tests)**
14. ✅ Debe rechazar sin token → 401
15. ✅ Debe rechazar con rol CONSULTA → 403

**Setup de tests**:
- Base de datos de prueba con seed data (guardianes activos, puestos activos)
- Cleanup después de cada test (DELETE FROM turnos WHERE ...)
- Mock/real de SP (usar BD de prueba real)

**Estructura esperada**:
```typescript
import request from 'supertest';
import app from '../../src/server';
import { getTurnosPool } from '../../src/config/database';

describe('POST /api/turnos - Registrar Turno', () => {
  let authToken: string;
  let empleadoIdActivo: number;
  let puestoIdActivo: number;

  beforeAll(async () => {
    // Setup: obtener token, IDs de BD
  });

  afterEach(async () => {
    // Cleanup: DELETE FROM turnos WHERE ...
  });

  describe('Registro exitoso', () => {
    test('Debe registrar turno válido y retornar 201', async () => { ... });
    // ... más tests
  });

  describe('Validaciones de Schema Zod', () => { ... });
  describe('Validaciones de Negocio Pre-SP', () => { ... });
  describe('Validaciones del SP y Trigger', () => { ... });
  describe('Autorización', () => { ... });
});
```

---

### **Subtarea 6**: Ejecutar tests y corregir errores
**Estimación**: 30 minutos

**Acciones**:
1. Ejecutar: `npm test -- turnos.integration.test.ts`
2. Verificar que todos los 15+ tests pasen
3. Si fallan tests:
   - Revisar mensajes de error
   - Corregir bugs en service/controller/routes
   - Re-ejecutar tests
4. Generar reporte de cobertura (opcional): `npm test -- --coverage`

---

### **Subtarea 7**: Documentar resultados
**Estimación**: 15 minutos
**Archivos a crear**: `docs/completed/T2.19_endpoint_registro_turno.md`

**Contenido del documento**:
```markdown
# Tarea Completada: T2.19 - Endpoint de Registro de Turnos

**Fecha de finalización**: 2026-01-18
**Tiempo real**: X horas Y minutos
**Estimación original**: 4-5 horas

## Resumen
Se implementó el endpoint POST /api/turnos para registrar turnos de guardianes...

## Archivos Creados/Modificados
- Creados:
  - backend/src/services/turnos.service.ts (X líneas)
  - backend/src/controllers/turnos.controller.ts (X líneas)
  - backend/src/routes/turnos.routes.ts (X líneas)
  - backend/tests/integration/turnos.integration.test.ts (X líneas)
- Modificados:
  - backend/src/server.ts (agregada ruta /api/turnos)

## Endpoints Implementados
- POST /api/turnos
  - Autenticación: JWT required
  - Roles permitidos: ADMIN, SUPERVISOR
  - Body: CreateTurnoDTO
  - Response 201: Turno creado
  - Errores: 400, 401, 403, 404, 409, 500

## Validaciones Implementadas
- Pre-schema (Zod): horas, fechas, formatos
- Pre-SP: empleado activo (BD RRHH), puesto activo (BD turnos)
- SP: duplicados, auto-cálculo de tipo_turno y es_feriado
- Trigger: límite de 16 horas totales

## Tests Ejecutados
- Total: X tests
- Pasando: X
- Fallando: 0
- Cobertura: X%

## Problemas Encontrados y Soluciones
...

## Próximos Pasos
T2.20 - Implementar endpoints de consulta de turnos (GET /api/turnos, GET /api/turnos/:id, etc.)
```

---

## Orden de Ejecución

1. **Subtarea 1**: Crear servicio (1.5h)
2. **Subtarea 2**: Crear controller (45min)
3. **Subtarea 3**: Crear rutas (30min)
4. **Subtarea 4**: Registrar en server.ts (15min)
5. **Subtarea 5**: Crear tests de integración (1.5h)
6. **Subtarea 6**: Ejecutar tests y corregir (30min)
7. **Subtarea 7**: Documentar (15min)

**Tiempo total estimado**: 5 horas

---

## Criterios de Aceptación

- [x] Endpoint POST /api/turnos funciona correctamente
- [x] Llama a sp_registrar_turno con parámetros correctos
- [x] Validaciones pre-SP implementadas (empleado activo, puesto activo)
- [x] Manejo de errores robusto (409 duplicados, 400 validaciones, 404 no encontrado)
- [x] Protegido con authMiddleware + requireRole('ADMIN', 'SUPERVISOR')
- [x] 15+ tests de integración pasando
- [x] Documentación completa en docs/completed/

---

## Notas Importantes

### Detalles del Stored Procedure
```sql
CALL sp_registrar_turno(
    IN p_empleado_id INT,
    IN p_puesto_id INT,
    IN p_fecha DATE,
    IN p_hora_entrada TIME,
    IN p_hora_salida TIME,
    IN p_horas_normales DECIMAL(4,2),
    IN p_horas_extras DECIMAL(4,2),
    IN p_observaciones TEXT,
    IN p_created_by INT,
    OUT p_turno_id BIGINT,
    OUT p_mensaje VARCHAR(255)
)
```

**El SP hace**:
1. Verificar duplicados (empleado+puesto+fecha)
2. Llamar a `sp_determinar_tipo_turno(hora_entrada)` → tipo_turno
3. Llamar a `sp_verificar_feriado(fecha)` → es_feriado, feriado_id
4. INSERT INTO turnos
5. Retornar turno_id y mensaje

### Constraint Unique
```sql
CONSTRAINT uk_empleado_puesto_fecha UNIQUE (empleado_id, puesto_id, fecha)
```
Si se intenta duplicar, MySQL retorna error 1062 (Duplicate entry).

### Trigger de Validación
```sql
trg_turnos_before_insert:
  IF (NEW.horas_normales + NEW.horas_extras) > 16 THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Total de horas excede el máximo permitido (16 horas)'
```

### Campos Auto-Calculados (NO en DTO)
- `tipo_turno`: Calculado por `sp_determinar_tipo_turno`
- `es_feriado`: Calculado por `sp_verificar_feriado`
- `feriado_id`: Asignado si `es_feriado = true`
- `procesado_nomina`: Default false
- `created_at`, `updated_at`: Timestamps automáticos

---

## Decisiones Técnicas

1. **Validación en capas**:
   - Layer 1: Schema Zod (formato, tipos, rangos básicos)
   - Layer 2: Service pre-SP (existencia de empleado y puesto)
   - Layer 3: Stored Procedure (duplicados, auto-cálculo)
   - Layer 4: Trigger (validación final de límites)

2. **Separación de responsabilidades**:
   - Service: Lógica de negocio y llamada a SP
   - Controller: Manejo HTTP y mapeo de errores
   - Routes: Configuración de middleware chain

3. **Errores específicos vs genéricos**:
   - Crear custom errors (EmpleadoNoExisteError, etc.) para mejor DX
   - Mapear a códigos HTTP estándar en controller

4. **BD RRHH read-only**:
   - Solo consultar `validarGuardianActivo()`
   - NUNCA modificar datos de empleados desde este sistema

---

**Plan validado**: 2026-01-18
**Listo para ejecutar**: Sí ✅
