# Plan de Ejecución: T2.20 - Endpoints de consulta de turnos

**Tarea**: T2.20 - Implementar endpoints de consulta de turnos
**Fecha de creación**: 2026-01-18
**Estimación**: 4-5 horas
**Dependencias**: T2.18 ✓ (Modelo y validaciones de turnos)

## Contexto

Esta tarea implementa los 3 endpoints de consulta de turnos que permitirán al frontend obtener, listar y analizar los turnos registrados. Se requiere implementar filtros avanzados, paginación server-side y un endpoint de resumen con estadísticas por empleado.

**Archivos clave de referencia**:
- `backend/src/models/turno.model.ts` - Modelo completo con interfaces ✓
- `backend/src/schemas/turno.schema.ts` - Schemas Zod de validación ✓
- `backend/src/controllers/puestos.controller.ts` - Patrón de controladores
- `backend/src/services/puestos.service.ts` - Patrón de servicios
- `backend/src/routes/puestos.routes.ts` - Patrón de rutas
- `sistema_turnos_guardianes.sql` - Estructura de tabla turnos

## Objetivo

Implementar 3 endpoints de consulta de turnos con:
1. **GET /api/turnos**: Listado con paginación y 10 filtros posibles
2. **GET /api/turnos/:id**: Obtener un turno por ID con relaciones
3. **GET /api/turnos/empleado/:empleado_id/resumen**: Estadísticas agregadas

Todos los endpoints deben:
- Incluir JOINs con BD RRHH (rh_empleado) y tabla puestos
- Estar accesibles por todos los roles autenticados (ADMIN, SUPERVISOR, CONSULTA)
- Incluir validación con schemas Zod
- Manejar errores apropiadamente

## Subtareas Detalladas

### Subtarea 1: Crear servicio de turnos con queries de consulta
**Archivo**: `backend/src/services/turnos.service.ts`
**Estimación**: 1.5 horas

**Implementación**:

1. **Método `getTurnos(filters)`**:
   - Parámetros: `GetTurnosFilters` (empleado_id, puesto_id, fecha_inicio, fecha_fin, tipo_turno, es_feriado, procesado_nomina, page, pageSize, search)
   - Query SQL con JOINs:
     - INNER JOIN puestos p
     - INNER JOIN ubicaciones u (via puestos)
     - INNER JOIN clientes c (via ubicaciones)
     - LEFT JOIN db_aae4a2_ranger.rh_empleado e (BD RRHH, read-only)
   - Campos a retornar del empleado: id_empleado, cedula_empleado, nombres, apellidos
   - Construir WHERE dinámico según filtros presentes
   - Search en: CONCAT(e.nombres, ' ', e.apellidos), e.cedula_empleado
   - ORDER BY t.fecha DESC, t.hora_entrada ASC
   - Implementar LIMIT y OFFSET para paginación
   - Retornar `{ data: Turno[], total: number }`
   - Incluir query COUNT(*) separado para total

2. **Método `getTurnoById(id)`**:
   - Parámetro: id (number)
   - Query SQL con mismos JOINs que getTurnos
   - WHERE t.id = ?
   - Retornar TurnoConRelaciones o null si no existe
   - Incluir todos los campos de relaciones (empleado, puesto, ubicación, cliente, feriado)

3. **Método `getResumenEmpleado(empleado_id, fecha_inicio, fecha_fin)`**:
   - Parámetros: empleado_id (number), fecha_inicio (string), fecha_fin (string)
   - Validar que empleado existe en BD RRHH (usar rrhhService.validarGuardianActivo)
   - Query SQL con agregaciones:
     ```sql
     SELECT
       t.empleado_id,
       CONCAT(e.nombres, ' ', e.apellidos) AS nombre_empleado,
       COUNT(*) AS total_turnos,
       SUM(t.horas_normales) AS total_horas_normales,
       SUM(t.horas_extras) AS total_horas_extras,
       SUM(CASE WHEN t.tipo_turno = 'DIURNO' THEN 1 ELSE 0 END) AS turnos_diurnos,
       SUM(CASE WHEN t.tipo_turno = 'NOCTURNO' THEN 1 ELSE 0 END) AS turnos_nocturnos,
       SUM(CASE WHEN t.es_feriado = TRUE THEN 1 ELSE 0 END) AS turnos_feriados
     FROM turnos t
     LEFT JOIN db_aae4a2_ranger.rh_empleado e ON t.empleado_id = e.id_empleado
     WHERE t.empleado_id = ?
       AND t.fecha BETWEEN ? AND ?
     GROUP BY t.empleado_id, e.nombres, e.apellidos
     ```
   - Retornar objeto ResumenEmpleadoDTO
   - Si no hay turnos, retornar objeto con valores en 0

**Validaciones**:
- Validar tipos de filtros
- Validar rangos de paginación (page >= 1, pageSize 1-100)
- Validar formato de fechas (YYYY-MM-DD)
- Validar que fecha_inicio <= fecha_fin

**Manejo de errores**:
- Error de BD: throw error con mensaje descriptivo
- Empleado no existe (resumen): return null o throw 404

**Test manual**:
```typescript
// Verificar que compile sin errores
npm run build
```

---

### Subtarea 2: Crear controlador de turnos con 3 métodos
**Archivo**: `backend/src/controllers/turnos.controller.ts`
**Estimación**: 1 hora

**Implementación**:

1. **Método `getTurnosController`**:
   - Extraer query params de req.query
   - Convertir a tipos correctos (Number para IDs, Boolean para flags)
   - Llamar a `turnosService.getTurnos(filters)`
   - Calcular totalPages = Math.ceil(total / pageSize)
   - Retornar status 200 con:
     ```json
     {
       "data": Turno[],
       "total": number,
       "page": number,
       "pageSize": number,
       "totalPages": number
     }
     ```
   - Catch error: status 500 con mensaje genérico

2. **Método `getTurnoByIdController`**:
   - Extraer id de req.params
   - Convertir a Number
   - Llamar a `turnosService.getTurnoById(id)`
   - Si null: status 404 con `{ error: 'Turno no encontrado' }`
   - Si existe: status 200 con TurnoConRelaciones
   - Catch error: status 500

3. **Método `getResumenEmpleadoController`**:
   - Extraer empleado_id de req.params
   - Extraer fecha_inicio, fecha_fin de req.query
   - Si faltan fechas: usar defaults (inicio de mes actual, hoy)
   - Llamar a `turnosService.getResumenEmpleado(empleado_id, fecha_inicio, fecha_fin)`
   - Si null: status 404 con `{ error: 'Empleado no encontrado o sin turnos' }`
   - Si existe: status 200 con ResumenEmpleadoDTO
   - Catch error: status 500

**Documentación JSDoc**:
- Documentar cada método con descripción completa
- Incluir parámetros de query/params
- Incluir formatos de respuesta
- Incluir códigos HTTP posibles

**Test manual**:
```typescript
// Verificar que compile sin errores
npm run build
```

---

### Subtarea 3: Crear rutas de turnos con validaciones
**Archivo**: `backend/src/routes/turnos.routes.ts`
**Estimación**: 45 minutos

**Implementación**:

1. **Importaciones**:
   ```typescript
   import { Router } from 'express';
   import { authMiddleware } from '../middlewares/auth.middleware';
   import { requireRole } from '../middlewares/role.middleware';
   import { validateRequest } from '../middlewares/validation.middleware';
   import { turnoIdSchema, getTurnosQuerySchema, getResumenEmpleadoQuerySchema } from '../schemas/turno.schema';
   import { getTurnosController, getTurnoByIdController, getResumenEmpleadoController } from '../controllers/turnos.controller';
   ```

2. **Rutas**:
   ```typescript
   // GET /api/turnos
   router.get(
     '/',
     authMiddleware,
     requireRole('ADMIN', 'SUPERVISOR', 'CONSULTA'),
     validateRequest({ query: getTurnosQuerySchema }),
     getTurnosController
   );

   // GET /api/turnos/:id
   router.get(
     '/:id',
     authMiddleware,
     requireRole('ADMIN', 'SUPERVISOR', 'CONSULTA'),
     validateRequest({ params: turnoIdSchema }),
     getTurnoByIdController
   );

   // GET /api/turnos/empleado/:empleado_id/resumen
   router.get(
     '/empleado/:empleado_id/resumen',
     authMiddleware,
     requireRole('ADMIN', 'SUPERVISOR', 'CONSULTA'),
     validateRequest({
       params: turnoIdSchema, // reutilizar para validar empleado_id
       query: getResumenEmpleadoQuerySchema
     }),
     getResumenEmpleadoController
   );
   ```

**IMPORTANTE**:
- La ruta `/empleado/:empleado_id/resumen` debe ir ANTES de `/:id` para evitar conflictos
- Todos accesibles por roles: ADMIN, SUPERVISOR, CONSULTA

**Documentación JSDoc**:
- Documentar cada ruta con descripción, permisos, params, query, response

**Test manual**:
```typescript
// Verificar que compile sin errores
npm run build
```

---

### Subtarea 4: Actualizar index de servicios, controladores y rutas
**Archivos**:
- `backend/src/services/index.ts`
- `backend/src/controllers/index.ts`
- `backend/src/routes/index.ts`
**Estimación**: 15 minutos

**Implementación**:

1. **Actualizar `services/index.ts`**:
   ```typescript
   export * from './turnos.service';
   ```

2. **Actualizar `controllers/index.ts`**:
   ```typescript
   export * from './turnos.controller';
   ```

3. **Actualizar `routes/index.ts`**:
   ```typescript
   import turnosRoutes from './turnos.routes';

   // En la función registerRoutes:
   app.use('/api/turnos', turnosRoutes);
   ```

**Test manual**:
```typescript
// Verificar que compile sin errores
npm run build
```

---

### Subtarea 5: Crear tests de integración
**Archivo**: `backend/tests/integration/turnos.integration.test.ts`
**Estimación**: 1.5 horas

**Setup de tests**:
```typescript
describe('Endpoints de consulta de turnos', () => {
  let authToken: string;
  let testTurnoId: number;
  let testEmpleadoId: number = 1001; // Usar un empleado de prueba de BD RRHH

  beforeAll(async () => {
    // Login para obtener token
    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({ username: 'admin', password: 'Admin123!' });

    authToken = loginRes.body.accessToken;

    // Crear turno de prueba usando sp_registrar_turno
    const [result] = await db.query(
      'CALL sp_registrar_turno(?, ?, ?, ?, ?, ?, ?, ?)',
      [testEmpleadoId, 1, '2026-01-15', '06:00:00', '18:00:00', 10.0, 2.0, 1]
    );
    testTurnoId = result[0][0].id;
  });

  afterAll(async () => {
    // Limpiar: eliminar turno de prueba
    await db.query('DELETE FROM turnos WHERE id = ?', [testTurnoId]);
  });
});
```

**Tests a implementar** (20+ tests):

**Grupo 1: GET /api/turnos (10 tests)**
1. ✅ Listar turnos sin filtros (página 1)
2. ✅ Listar con paginación (page=2, pageSize=5)
3. ✅ Filtrar por empleado_id
4. ✅ Filtrar por puesto_id
5. ✅ Filtrar por rango de fechas (fecha_inicio, fecha_fin)
6. ✅ Filtrar por tipo_turno (DIURNO/NOCTURNO)
7. ✅ Filtrar por es_feriado (true/false)
8. ✅ Filtrar por procesado_nomina (true/false)
9. ✅ Búsqueda por nombre de empleado (search)
10. ✅ Sin token: debe retornar 401

**Grupo 2: GET /api/turnos/:id (5 tests)**
11. ✅ Obtener turno existente por ID (debe incluir relaciones)
12. ✅ Obtener turno inexistente (debe retornar 404)
13. ✅ ID inválido (string): debe retornar 400
14. ✅ ID negativo: debe retornar 400
15. ✅ Sin token: debe retornar 401

**Grupo 3: GET /api/turnos/empleado/:empleado_id/resumen (6 tests)**
16. ✅ Resumen de empleado con turnos en el rango
17. ✅ Resumen de empleado sin turnos en el rango (valores en 0)
18. ✅ Resumen con fecha_inicio y fecha_fin personalizadas
19. ✅ Resumen sin fechas (debe usar defaults)
20. ✅ Empleado inexistente (debe retornar 404)
21. ✅ Sin token: debe retornar 401

**Grupo 4: Validaciones (4+ tests adicionales)**
22. ✅ pageSize > 100: debe limitar a 100
23. ✅ page < 1: debe usar 1
24. ✅ fecha_inicio > fecha_fin: debe retornar 400
25. ✅ tipo_turno inválido: debe retornar 400

**Objetivo**: Mínimo 20 tests, ideal 25+

**Comandos de ejecución**:
```bash
# Ejecutar tests de integración de turnos
npm test -- turnos.integration.test.ts

# Ejecutar con cobertura
npm test -- turnos.integration.test.ts --coverage
```

---

### Subtarea 6: Ejecutar tests y corregir errores
**Estimación**: 30 minutos

**Proceso**:
1. Ejecutar tests: `npm test -- turnos.integration.test.ts`
2. Analizar resultados
3. Corregir errores encontrados
4. Re-ejecutar tests hasta que todos pasen
5. Verificar cobertura de código

**Criterios de éxito**:
- Todos los tests pasando (20+/20+)
- Sin errores de TypeScript
- Sin warnings de seguridad

---

## Resumen de Archivos a Crear/Modificar

### Archivos a CREAR:
1. `backend/src/services/turnos.service.ts` (~400 líneas)
2. `backend/src/controllers/turnos.controller.ts` (~250 líneas)
3. `backend/src/routes/turnos.routes.ts` (~150 líneas)
4. `backend/tests/integration/turnos.integration.test.ts` (~600 líneas)

### Archivos a MODIFICAR:
5. `backend/src/services/index.ts` (agregar export)
6. `backend/src/controllers/index.ts` (agregar export)
7. `backend/src/routes/index.ts` (agregar ruta)

## Criterios de Aceptación

- [x] Servicio turnos.service.ts creado con 3 métodos
- [x] Controlador turnos.controller.ts creado con 3 métodos
- [x] Rutas turnos.routes.ts creadas y registradas
- [x] GET /api/turnos funcionando con 10 filtros
- [x] GET /api/turnos/:id funcionando con relaciones
- [x] GET /api/turnos/empleado/:empleado_id/resumen funcionando
- [x] JOINs con BD RRHH (rh_empleado) implementados
- [x] JOINs con puestos, ubicaciones, clientes implementados
- [x] Paginación server-side funcionando
- [x] Todos los endpoints accesibles por ADMIN, SUPERVISOR, CONSULTA
- [x] Validación de params y query con Zod
- [x] 20+ tests de integración implementados
- [x] Todos los tests pasando
- [x] Sin errores de TypeScript ni build

## Dependencias Externas

- Base de datos MySQL con tabla `turnos` creada ✓
- Base de datos RRHH con tabla `rh_empleado` accesible ✓
- Modelo turno.model.ts completo (T2.18) ✓
- Schemas turno.schema.ts completos (T2.18) ✓
- Middleware de autenticación (authMiddleware) ✓
- Middleware de roles (requireRole) ✓
- Middleware de validación (validateRequest) ✓
- Servicio RRHH para validar empleados (T2.16) ✓

## Riesgos y Mitigaciones

| Riesgo | Probabilidad | Impacto | Mitigación |
|--------|--------------|---------|------------|
| JOINs con BD RRHH lentos | Media | Alto | Usar índices apropiados, limitar resultados con paginación |
| Tabla turnos vacía en tests | Baja | Medio | Crear turnos de prueba en beforeAll usando sp_registrar_turno |
| Conflicto de rutas /:id vs /empleado/:id | Alta | Alto | Definir ruta específica ANTES de ruta genérica |
| Empleado no existe en BD RRHH | Media | Medio | Validar empleado antes de queries, retornar 404 apropiado |

## Estimación de Tiempo por Subtarea

| Subtarea | Estimación | Tiempo Acumulado |
|----------|------------|------------------|
| 1. Servicio | 1.5h | 1.5h |
| 2. Controlador | 1h | 2.5h |
| 3. Rutas | 45min | 3.25h |
| 4. Index updates | 15min | 3.5h |
| 5. Tests | 1.5h | 5h |
| 6. Correcciones | 30min | 5.5h |
| **TOTAL** | **5.5 horas** | - |

**Nota**: Estimación original era 4-5h, pero se agregó buffer para correcciones.

## Comandos Útiles

```bash
# Compilar TypeScript
npm run build

# Ejecutar tests de integración
npm test -- turnos.integration.test.ts

# Ejecutar tests con cobertura
npm test -- turnos.integration.test.ts --coverage

# Ejecutar servidor en desarrollo
npm run dev

# Probar endpoints manualmente con curl
curl -H "Authorization: Bearer <token>" http://localhost:3000/api/turnos
curl -H "Authorization: Bearer <token>" http://localhost:3000/api/turnos/1
curl -H "Authorization: Bearer <token>" "http://localhost:3000/api/turnos/empleado/1001/resumen?fecha_inicio=2026-01-01&fecha_fin=2026-01-31"
```

## Notas Adicionales

- **Orden de rutas**: Asegurar que `/empleado/:empleado_id/resumen` vaya ANTES de `/:id`
- **Paginación**: Default page=1, pageSize=10, max pageSize=100
- **Search**: Buscar en nombre completo del empleado y cédula
- **Filtros múltiples**: Permitir combinar múltiples filtros (AND lógico)
- **Formato de fechas**: YYYY-MM-DD estricto
- **NULL handling**: LEFT JOIN para empleado por si fue eliminado de BD RRHH
- **Performance**: Crear índices en tabla turnos si no existen

---

**Creado por**: Subagente T2.20
**Fecha**: 2026-01-18
**Estado**: Listo para ejecución
