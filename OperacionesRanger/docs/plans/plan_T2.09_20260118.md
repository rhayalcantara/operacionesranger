# Plan: T2.09 - Implementar CRUD de Puestos

**Fecha**: 2026-01-18
**Tarea padre**: T2.09
**Fase**: Fase 2 - Backend Core
**Estimación**: 4-5 horas

## Objetivo

Implementar endpoints CRUD completos para la gestión de puestos de seguridad (estaciones donde se asignan guardianes) incluyendo filtrado por ubicación y cliente, validaciones de negocio, y preparación para relación con turnos.

## Contexto

- **Dependencias completadas**:
  - T2.08 (CRUD Ubicaciones) ✓
  - T2.04 (Middleware auth y role) ✓
- **Tabla BD**: `puestos` en `turnos_guardianes`
- **Campos relevantes**: id, ubicacion_id, codigo, nombre, descripcion, cantidad_guardianes, requiere_turno_diurno, requiere_turno_nocturno, activo
- **Relaciones**: `puestos` pertenece a `ubicaciones`, `ubicaciones` pertenece a `clientes`
- **Constraint único**: `uk_ubicacion_codigo` (codigo único dentro de ubicación)
- **Turnos**: Tabla `turnos` no existe aún, endpoint GET /api/puestos/:id/turnos debe retornar array vacío

## Subtareas

### 1. Crear modelo TypeScript de Puesto

**Descripción**: Definir interfaces, tipos, DTOs y funciones helper para puestos

**Archivos a crear**:
- `backend/src/models/puesto.model.ts`

**Contenido**:
- Interface `Puesto` (mapeo 1:1 con tabla BD)
- DTOs: `CreatePuestoDTO`, `UpdatePuestoDTO`, `PaginatedPuestosDTO`
- Interface extendida: `PuestoConRelaciones` (incluye cliente_nombre, ubicacion_nombre)
- Type utilities: `NuevoPuestoDB`, `PuestoActualizable`
- Constantes de validación: `PUESTO_VALIDATION`
- Helper functions: `normalizeCodigo`, `dtoToNuevoPuestoDB`, `dtoToPuestoActualizable`
- Type guards: `isPuesto`, `isValidCodigo`

**Resultado esperado**: Modelo TypeScript completo con toda la lógica de tipos y validaciones

### 2. Crear schemas de validación Zod

**Descripción**: Definir schemas Zod para validación de request bodies

**Archivos a crear**:
- `backend/src/schemas/puesto.schema.ts`

**Contenido**:
- `createPuestoSchema`: Validar POST body
  - ubicacion_id: number, required, positive
  - codigo: string, required, min 2, max 20, regex alfanumérico
  - nombre: string, required, min 1, max 150
  - descripcion: string, optional, max 1000
  - cantidad_guardianes: number, optional, default 1, min 1
  - requiere_turno_diurno: boolean, optional, default true
  - requiere_turno_nocturno: boolean, optional, default true
- `updatePuestoSchema`: Validar PUT body (todos opcionales excepto cantidad_guardianes >= 1)
- `puestoIdSchema`: Validar path param :id (number positive)
- `getPuestosQuerySchema`: Validar query params (page, pageSize, search, ubicacion_id?, cliente_id?)

**Resultado esperado**: Schemas Zod funcionando para todas las validaciones

### 3. Crear servicio de Puestos (lógica de negocio)

**Descripción**: Implementar lógica de negocio para operaciones CRUD

**Archivos a crear**:
- `backend/src/services/puestos.service.ts`

**Métodos a implementar**:

**3.1. getPuestos(filters)**
- Params: page, pageSize, search, ubicacion_id?, cliente_id?
- Query: SELECT con JOINs (ubicaciones, clientes)
- Filtros:
  - search: nombre LIKE, codigo LIKE, descripcion LIKE
  - ubicacion_id: WHERE ubicacion_id = ?
  - cliente_id: JOIN ubicaciones, WHERE ubicaciones.cliente_id = ?
- Response: `{ data: Puesto[], total: number }`

**3.2. getPuestoById(id)**
- Params: id
- Query: SELECT con JOINs (ubicaciones, clientes) + count de turnos
- Count turnos: `(SELECT COUNT(*) FROM turnos WHERE puesto_id = puestos.id) as turnos_count`
- Response: `PuestoConRelaciones` con cliente_nombre, ubicacion_nombre, turnos_count
- Error: 404 si no existe

**3.3. getTurnosByPuesto(puestoId, filters)**
- Params: puestoId, page, pageSize, fecha_inicio?, fecha_fin?
- **NOTA**: Tabla `turnos` NO existe aún, retornar:
  ```typescript
  return { data: [], total: 0 };
  ```
- Preparado para futura implementación con query:
  ```sql
  SELECT * FROM turnos
  WHERE puesto_id = ?
  AND (fecha BETWEEN ? AND ?)
  ORDER BY fecha DESC
  LIMIT ? OFFSET ?
  ```

**3.4. createPuesto(data)**
- Validar: ubicacion_id existe y está activa
- Validar: codigo único dentro de ubicacion (uk_ubicacion_codigo)
- Normalizar: codigo a mayúsculas (usando helper)
- INSERT con valores por defecto (activo = true)
- Response: Puesto creado con relaciones (JOIN)
- Errores: 404 ubicacion no existe, 400 codigo duplicado

**3.5. updatePuesto(id, data)**
- Validar: puesto existe
- Validar: si actualiza codigo, verificar único dentro de ubicacion
- Normalizar: codigo si se proporciona
- UPDATE solo campos proporcionados
- Response: Puesto actualizado con relaciones
- Error: 404 si no existe, 400 codigo duplicado

**3.6. deletePuesto(id)**
- Validar: puesto existe
- Validar: NO tiene turnos registrados (preparar query para cuando exista tabla turnos)
  ```sql
  SELECT COUNT(*) FROM turnos WHERE puesto_id = ?
  ```
  - Si count > 0: Error 400 "No se puede eliminar puesto con turnos registrados"
- Soft delete: UPDATE activo = false
- Response: `{ message: "Puesto desactivado", id }`
- Error: 404 si no existe, 400 si tiene turnos

**Validaciones de negocio**:
- ubicacion_id debe existir en tabla `ubicaciones` con `activo = true`
- codigo único dentro de ubicacion (constraint uk_ubicacion_codigo)
- cantidad_guardianes >= 1
- No eliminar si tiene turnos (validación futura)

**Resultado esperado**: Servicio completo con toda la lógica de negocio y validaciones

### 4. Crear controladores de Puestos

**Descripción**: Implementar controllers que manejen requests HTTP

**Archivos a crear**:
- `backend/src/controllers/puestos.controller.ts`

**Controladores a implementar**:

**4.1. getPuestosController**
- Extraer query params: page, pageSize, search, ubicacion_id, cliente_id
- Llamar: `puestosService.getPuestos(filters)`
- Response: 200 con `{ data, total, page, pageSize, totalPages }`
- Error handling: 500 con mensaje claro

**4.2. getPuestoByIdController**
- Extraer: path param :id
- Llamar: `puestosService.getPuestoById(id)`
- Response: 200 con puesto completo (incluye relaciones y turnos_count)
- Errors: 404 puesto no encontrado, 500 error interno

**4.3. getTurnosByPuestoController**
- Extraer: path param :id, query params page, pageSize, fecha_inicio?, fecha_fin?
- Llamar: `puestosService.getTurnosByPuesto(id, filters)`
- Response: 200 con `{ data: [], total: 0 }` (array vacío por ahora)
- Errors: 404 puesto no encontrado, 500 error interno

**4.4. createPuestoController**
- Extraer: body (ya validado por middleware)
- Llamar: `puestosService.createPuesto(body)`
- Response: 201 con puesto creado
- Errors: 400 validación fallida, 404 ubicacion no existe, 500 error interno

**4.5. updatePuestoController**
- Extraer: path param :id, body
- Llamar: `puestosService.updatePuesto(id, body)`
- Response: 200 con puesto actualizado
- Errors: 400 validación, 404 no encontrado, 500 error interno

**4.6. deletePuestoController**
- Extraer: path param :id
- Llamar: `puestosService.deletePuesto(id)`
- Response: 200 con `{ message: "Puesto desactivado", id }`
- Errors: 400 tiene turnos, 404 no encontrado, 500 error interno

**Resultado esperado**: Controllers funcionando correctamente con manejo de errores

### 5. Crear rutas de Puestos

**Descripción**: Definir rutas protegidas con middlewares de auth y validación

**Archivos a crear**:
- `backend/src/routes/puestos.routes.ts`

**Rutas a implementar**:

```typescript
import { Router } from 'express';
import { authMiddleware } from '../middlewares/auth.middleware';
import { requireRole } from '../middlewares/role.middleware';
import { validateRequest } from '../middlewares/validation.middleware';
import * as schemas from '../schemas/puesto.schema';
import * as controller from '../controllers/puestos.controller';

const router = Router();

// GET /api/puestos - Listar puestos (paginado, filtros)
// Permisos: ADMIN, SUPERVISOR, CONSULTA (todos)
router.get(
  '/',
  authMiddleware,
  requireRole('ADMIN', 'SUPERVISOR', 'CONSULTA'),
  validateRequest({ query: schemas.getPuestosQuerySchema }),
  controller.getPuestosController
);

// GET /api/puestos/:id - Obtener puesto por ID
// Permisos: Todos autenticados
router.get(
  '/:id',
  authMiddleware,
  requireRole('ADMIN', 'SUPERVISOR', 'CONSULTA'),
  validateRequest({ params: schemas.puestoIdSchema }),
  controller.getPuestoByIdController
);

// GET /api/puestos/:id/turnos - Obtener turnos de un puesto
// Permisos: Todos autenticados
router.get(
  '/:id/turnos',
  authMiddleware,
  requireRole('ADMIN', 'SUPERVISOR', 'CONSULTA'),
  validateRequest({ params: schemas.puestoIdSchema }),
  controller.getTurnosByPuestoController
);

// POST /api/puestos - Crear nuevo puesto
// Permisos: ADMIN, SUPERVISOR
router.post(
  '/',
  authMiddleware,
  requireRole('ADMIN', 'SUPERVISOR'),
  validateRequest({ body: schemas.createPuestoSchema }),
  controller.createPuestoController
);

// PUT /api/puestos/:id - Actualizar puesto
// Permisos: ADMIN, SUPERVISOR
router.put(
  '/:id',
  authMiddleware,
  requireRole('ADMIN', 'SUPERVISOR'),
  validateRequest({
    params: schemas.puestoIdSchema,
    body: schemas.updatePuestoSchema
  }),
  controller.updatePuestoController
);

// DELETE /api/puestos/:id - Soft delete de puesto
// Permisos: ADMIN solamente
router.delete(
  '/:id',
  authMiddleware,
  requireRole('ADMIN'),
  validateRequest({ params: schemas.puestoIdSchema }),
  controller.deletePuestoController
);

export default router;
```

**Resultado esperado**: Rutas configuradas con permisos y validaciones correctas

### 6. Registrar rutas en server.ts

**Descripción**: Agregar rutas de puestos al servidor Express

**Archivos a modificar**:
- `backend/src/server.ts`

**Cambios**:
```typescript
import puestosRoutes from './routes/puestos.routes';

// ... otras rutas ...

// Rutas de puestos
app.use('/api/puestos', puestosRoutes);
```

**Resultado esperado**: Rutas accesibles en `/api/puestos`

### 7. Crear tests de integración

**Descripción**: Crear suite completa de tests para todos los endpoints

**Archivos a crear**:
- `backend/tests/integration/puestos.test.ts`

**Tests a implementar** (>15 casos):

**Setup/Teardown**:
- beforeAll: Crear datos de prueba (cliente, ubicacion, puesto)
- afterAll: Limpiar datos de prueba

**Grupo 1: GET /api/puestos (5 tests)**
1. Listar puestos sin filtros (200)
2. Listar con paginación (page=2, pageSize=5)
3. Filtrar por ubicacion_id (200)
4. Filtrar por cliente_id (200, JOIN correcto)
5. Buscar por nombre/codigo (search query)

**Grupo 2: GET /api/puestos/:id (3 tests)**
6. Obtener puesto por ID válido (200, incluye relaciones)
7. Obtener puesto inexistente (404)
8. Verificar turnos_count = 0 (campo presente)

**Grupo 3: GET /api/puestos/:id/turnos (2 tests)**
9. Obtener turnos de puesto (200, array vacío por ahora)
10. Obtener turnos con puesto inexistente (404)

**Grupo 4: POST /api/puestos (4 tests)**
11. Crear puesto válido (201)
12. Crear con ubicacion_id inexistente (404)
13. Crear con codigo duplicado en misma ubicacion (400)
14. Crear con campos inválidos (400 validación)

**Grupo 5: PUT /api/puestos/:id (3 tests)**
15. Actualizar puesto válido (200)
16. Actualizar con codigo duplicado (400)
17. Actualizar puesto inexistente (404)

**Grupo 6: DELETE /api/puestos/:id (3 tests)**
18. Eliminar puesto sin turnos (200, soft delete)
19. Eliminar puesto inexistente (404)
20. Verificar que ADMIN puede eliminar (403 si no es ADMIN)

**Grupo 7: Validación de roles (2 tests)**
21. POST sin rol ADMIN/SUPERVISOR (403)
22. DELETE sin rol ADMIN (403)

**Total**: 20 tests (supera requisito de >15)

**Resultado esperado**: Suite de tests completa, todos pasando

### 8. Validar funcionamiento completo

**Descripción**: Verificar manualmente que todos los endpoints funcionan

**Pruebas manuales**:
1. Ejecutar tests: `npm test -- puestos.test.ts`
2. Verificar que 20/20 tests pasan
3. Probar endpoints con Postman/Thunder Client:
   - Listar puestos con filtros
   - Crear puesto nuevo
   - Actualizar puesto
   - Eliminar puesto (verificar soft delete)
4. Verificar logs del servidor (sin errores)
5. Verificar respuestas tienen estructura correcta

**Resultado esperado**: Todos los endpoints funcionando correctamente

## Criterios de Aceptación (checklist)

- [ ] Modelo TypeScript creado (`puesto.model.ts`)
- [ ] Schemas Zod creados (`puesto.schema.ts`)
- [ ] Servicio implementado con 6 métodos (`puestos.service.ts`)
- [ ] Controllers implementados con 6 endpoints (`puestos.controller.ts`)
- [ ] Rutas configuradas con permisos correctos (`puestos.routes.ts`)
- [ ] Rutas registradas en `server.ts`
- [ ] 6 endpoints funcionando:
  - [ ] GET /api/puestos (con filtros ubicacion_id, cliente_id)
  - [ ] GET /api/puestos/:id (con JOINs y turnos_count)
  - [ ] GET /api/puestos/:id/turnos (retorna array vacío preparado)
  - [ ] POST /api/puestos
  - [ ] PUT /api/puestos/:id
  - [ ] DELETE /api/puestos/:id (soft delete)
- [ ] Validaciones implementadas:
  - [ ] ubicacion_id existe y está activa
  - [ ] Código único dentro de ubicacion (uk_ubicacion_codigo)
  - [ ] cantidad_guardianes >= 1
  - [ ] Preparado para validar "no eliminar con turnos"
- [ ] Tests de integración: 20+ tests pasando (>15 requeridos)
- [ ] Permisos correctos por endpoint
- [ ] JOINs con ubicación y cliente funcionando
- [ ] Endpoint de turnos preparado (retorna [] por ahora)

## Archivos a Generar

1. `backend/src/models/puesto.model.ts` - Modelo TypeScript completo
2. `backend/src/schemas/puesto.schema.ts` - Schemas de validación Zod
3. `backend/src/services/puestos.service.ts` - Lógica de negocio
4. `backend/src/controllers/puestos.controller.ts` - Controllers HTTP
5. `backend/src/routes/puestos.routes.ts` - Rutas protegidas
6. `backend/tests/integration/puestos.test.ts` - Suite de tests (20+ casos)

## Archivos a Modificar

1. `backend/src/server.ts` - Registrar rutas de puestos

## Riesgos y Consideraciones

1. **Tabla turnos no existe aún**: Endpoint GET /api/puestos/:id/turnos debe retornar array vacío, pero preparado para futura implementación
2. **Validación "no eliminar con turnos"**: Preparar query comentada para cuando exista tabla turnos
3. **Constraint uk_ubicacion_codigo**: Manejar error de MySQL correctamente (código duplicado dentro de ubicación)
4. **Filtro por cliente_id**: Requiere JOIN con tabla ubicaciones, verificar performance si hay muchos registros
5. **Normalización de código**: Aplicar mayúsculas automáticamente para consistencia
6. **Soft delete**: Asegurar que `activo = false` funciona correctamente
7. **Ejecución en paralelo**: Esta tarea se ejecuta en paralelo con T2.17 (Caché guardianes). NO tocar archivos de caché ni rrhh.

## Notas Adicionales

- **Patrón consistente**: Seguir mismo patrón que T2.07 (Clientes) y T2.08 (Ubicaciones)
- **Campos especiales en BD**:
  - `cantidad_guardianes`: cuántos guardianes se necesitan en este puesto
  - `requiere_turno_diurno`: si el puesto requiere cobertura diurna
  - `requiere_turno_nocturno`: si el puesto requiere cobertura nocturna
- **Preparación futura**: Código preparado para cuando se implemente tabla `turnos`
- **Documentación**: Comentarios JSDoc en todos los métodos públicos
- **Typescript estricto**: No usar `any`, tipar todo correctamente
- **Manejo de errores**: Try-catch en todos los controllers y services
- **Logs**: Debug logs para troubleshooting sin afectar producción
