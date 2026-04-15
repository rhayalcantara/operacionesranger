# Plan: T2.07 - Implementar CRUD de Clientes

**Fecha**: 2026-01-18
**Tarea padre**: T2.07
**Fase**: Fase 2 - Backend Core
**Estimación**: 3-4 horas

## Objetivo

Crear endpoints CRUD completos para gestión de clientes (empresas contratantes de servicios de seguridad), incluyendo validaciones, paginación, búsqueda, y protección por roles.

## Contexto

### Tabla de Base de Datos

Tabla `clientes` en BD `turnos_guardianes`:
- `id` (INT, PRIMARY KEY, AUTO_INCREMENT)
- `codigo` (VARCHAR(20), UNIQUE, NOT NULL) - Código único del cliente
- `nombre` (VARCHAR(150), NOT NULL)
- `rnc` (VARCHAR(15)) - RNC o Cédula (formato RD: 9 dígitos)
- `telefono` (VARCHAR(20))
- `email` (VARCHAR(100))
- `direccion` (TEXT)
- `contacto_nombre` (VARCHAR(100))
- `contacto_telefono` (VARCHAR(20))
- `activo` (BOOLEAN, DEFAULT TRUE)
- `created_at` (TIMESTAMP)
- `updated_at` (TIMESTAMP)

### Arquitectura Existente

El proyecto sigue el patrón:
- **Model**: Interfaces TypeScript y tipos (sin ORM)
- **Schema**: Validación con Zod
- **Service**: Lógica de negocio con queries SQL directos
- **Controller**: Handlers de Express
- **Routes**: Definición de rutas con middlewares de auth y roles

### Permisos por Rol

- **GET** (listar/obtener): ADMIN, SUPERVISOR, CONSULTA (todos)
- **POST** (crear): ADMIN, SUPERVISOR
- **PUT** (actualizar): ADMIN, SUPERVISOR
- **DELETE** (eliminar): Solo ADMIN

## Subtareas

### 1. Crear archivo de modelo cliente.model.ts

**Descripción**: Definir interfaces, DTOs y tipos para entidad Cliente

**Archivos a crear**: `backend/src/models/cliente.model.ts`

**Contenido**:
```typescript
// Interface principal Cliente (tabla clientes)
export interface Cliente {
  id: number;
  codigo: string;
  nombre: string;
  rnc: string | null;
  telefono: string | null;
  email: string | null;
  direccion: string | null;
  contacto_nombre: string | null;
  contacto_telefono: string | null;
  activo: boolean;
  created_at: Date;
  updated_at: Date;
}

// DTOs
export interface CreateClienteDTO {
  codigo: string;
  nombre: string;
  rnc?: string | null;
  telefono?: string | null;
  email?: string | null;
  direccion?: string | null;
  contacto_nombre?: string | null;
  contacto_telefono?: string | null;
}

export interface UpdateClienteDTO {
  codigo?: string;
  nombre?: string;
  rnc?: string | null;
  telefono?: string | null;
  email?: string | null;
  direccion?: string | null;
  contacto_nombre?: string | null;
  contacto_telefono?: string | null;
  activo?: boolean;
}

export interface PaginatedClientesDTO {
  data: Cliente[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}
```

**Resultado esperado**: Interfaces TypeScript bien tipadas y DTOs completos

---

### 2. Crear schemas de validación cliente.schema.ts

**Descripción**: Definir schemas Zod para validación de requests

**Archivos a crear**: `backend/src/schemas/cliente.schema.ts`

**Contenido**:
- **createClienteSchema**: Validar body de POST
  - codigo: required, 3-20 chars, alfanumérico con guiones
  - nombre: required, 1-150 chars
  - rnc: optional, 9-11 dígitos (formato RD)
  - email: optional, valid email format
  - otros campos opcionales

- **updateClienteSchema**: Validar body de PUT
  - Todos los campos opcionales
  - Al menos 1 campo requerido

- **clienteIdParamSchema**: Validar :id en rutas
  - Número positivo

- **paginationQuerySchema**: Reutilizar de auth.schema.ts o crear nuevo
  - page: number > 0
  - pageSize: number 1-100
  - search: string opcional

**Validaciones especiales**:
- RNC: 9 dígitos (RD estándar)
- Email: formato válido
- Código: único (validación en service)

**Resultado esperado**: Schemas Zod funcionando con mensajes de error claros

---

### 3. Crear servicio clientes.service.ts

**Descripción**: Lógica de negocio para operaciones CRUD de clientes

**Archivos a crear**: `backend/src/services/clientes.service.ts`

**Funciones a implementar**:

1. **getClientes(page, pageSize, search)**:
   - Query SQL con LIMIT/OFFSET para paginación
   - Búsqueda por nombre, RNC, o código (LIKE %search%)
   - Retornar `{ data, total, page, pageSize, totalPages }`

2. **getClienteById(id)**:
   - Query SQL con WHERE id = ?
   - Incluir ubicaciones activas relacionadas (opcional, solo count)
   - Throw error si no existe

3. **createCliente(data)**:
   - Validar código único (query SELECT)
   - Validar RNC único si provisto (query SELECT)
   - INSERT INTO clientes
   - Retornar cliente creado con id

4. **updateCliente(id, data)**:
   - Validar que cliente existe
   - Si se cambia código, validar que sea único
   - Si se cambia RNC, validar que sea único
   - UPDATE clientes SET ... WHERE id = ?
   - Retornar cliente actualizado

5. **deleteCliente(id)** (soft delete):
   - Validar que cliente existe
   - Validar que NO tenga ubicaciones activas:
     ```sql
     SELECT COUNT(*) FROM ubicaciones
     WHERE cliente_id = ? AND activo = TRUE
     ```
   - Si tiene ubicaciones activas, throw error
   - UPDATE clientes SET activo = FALSE WHERE id = ?
   - Retornar mensaje de éxito

**Manejo de errores**:
- Validar duplicados (código, RNC)
- Validar FK constraints (ubicaciones activas)
- Database errors → Error messages amigables

**Resultado esperado**: Servicio con 5 funciones funcionando y testeado manualmente

---

### 4. Crear controlador clientes.controller.ts

**Descripción**: Request handlers para endpoints de clientes

**Archivos a crear**: `backend/src/controllers/clientes.controller.ts`

**Controladores a implementar**:

1. **getClientes**:
   - Validar query params con paginationQuerySchema
   - Llamar clientesService.getClientes()
   - Responder 200 con datos paginados

2. **getClienteById**:
   - Validar param :id
   - Llamar clientesService.getClienteById()
   - Responder 200 con cliente
   - Catch 404 si no existe

3. **createCliente**:
   - Validar body con createClienteSchema
   - Llamar clientesService.createCliente()
   - Responder 201 con cliente creado

4. **updateCliente**:
   - Validar param :id
   - Validar body con updateClienteSchema
   - Llamar clientesService.updateCliente()
   - Responder 200 con cliente actualizado

5. **deleteCliente**:
   - Validar param :id
   - Llamar clientesService.deleteCliente()
   - Responder 200 con mensaje de éxito

**Manejo de errores**:
- try/catch en cada controller
- Responder con códigos HTTP apropiados:
  - 200: Success
  - 201: Created
  - 400: Validation error
  - 404: Not found
  - 409: Conflict (duplicados)
  - 500: Server error

**Resultado esperado**: 5 controladores bien estructurados con manejo de errores

---

### 5. Crear rutas clientes.routes.ts

**Descripción**: Definición de rutas con middlewares de auth y roles

**Archivos a crear**: `backend/src/routes/clientes.routes.ts`

**Rutas a definir**:

```typescript
import { Router } from 'express';
import { authMiddleware } from '../middlewares/auth.middleware';
import { requireRole } from '../middlewares/role.middleware';
import * as clientesController from '../controllers/clientes.controller';

const router = Router();

// Todas las rutas requieren autenticación
router.use(authMiddleware);

// GET /api/clientes - Listar (todos los roles)
router.get(
  '/',
  requireRole('ADMIN', 'SUPERVISOR', 'CONSULTA'),
  clientesController.getClientes
);

// GET /api/clientes/:id - Obtener uno (todos los roles)
router.get(
  '/:id',
  requireRole('ADMIN', 'SUPERVISOR', 'CONSULTA'),
  clientesController.getClienteById
);

// POST /api/clientes - Crear (ADMIN, SUPERVISOR)
router.post(
  '/',
  requireRole('ADMIN', 'SUPERVISOR'),
  clientesController.createCliente
);

// PUT /api/clientes/:id - Actualizar (ADMIN, SUPERVISOR)
router.put(
  '/:id',
  requireRole('ADMIN', 'SUPERVISOR'),
  clientesController.updateCliente
);

// DELETE /api/clientes/:id - Eliminar (solo ADMIN)
router.delete(
  '/:id',
  requireRole('ADMIN'),
  clientesController.deleteCliente
);

export default router;
```

**Integración con server.ts**:
- Importar router en `backend/src/server.ts`
- Montar en `/api/clientes`

**Resultado esperado**: Rutas definidas y montadas en servidor

---

### 6. Crear tests de integración clientes.test.ts

**Descripción**: Tests de integración con Supertest para todos los endpoints

**Archivos a crear**: `backend/tests/integration/clientes.test.ts`

**Tests a implementar** (mínimo 12):

**Setup**:
- beforeAll: Crear usuario de prueba, obtener tokens (admin, supervisor, consulta)
- afterAll: Limpiar datos de prueba
- afterEach: Limpiar clientes de prueba

**Tests**:

1. **GET /api/clientes**:
   - ✅ Listar clientes con token válido (200)
   - ✅ Listar con paginación (page=2, pageSize=10)
   - ✅ Buscar clientes (search="test")
   - ❌ Sin token (401)

2. **GET /api/clientes/:id**:
   - ✅ Obtener cliente existente (200)
   - ❌ Cliente no existente (404)
   - ❌ ID inválido (400)

3. **POST /api/clientes**:
   - ✅ Crear cliente con todos los campos (ADMIN - 201)
   - ✅ Crear cliente campos mínimos (SUPERVISOR - 201)
   - ❌ Código duplicado (409)
   - ❌ RNC duplicado (409)
   - ❌ Email inválido (400)
   - ❌ CONSULTA intenta crear (403)

4. **PUT /api/clientes/:id**:
   - ✅ Actualizar cliente (ADMIN - 200)
   - ✅ Actualizar cliente (SUPERVISOR - 200)
   - ❌ Cliente no existe (404)
   - ❌ CONSULTA intenta actualizar (403)

5. **DELETE /api/clientes/:id**:
   - ✅ Eliminar cliente sin ubicaciones (ADMIN - 200)
   - ❌ Eliminar cliente con ubicaciones activas (409)
   - ❌ SUPERVISOR intenta eliminar (403)

**Objetivo cobertura**: > 80%

**Resultado esperado**: 12+ tests pasando, todos los casos críticos cubiertos

---

### 7. Validar criterios de aceptación

**Descripción**: Verificar que todos los criterios de la tarea se cumplan

**Checklist**:
- [ ] 5 endpoints CRUD funcionando (GET list, GET one, POST, PUT, DELETE)
- [ ] Paginación implementada (page, pageSize, totalPages)
- [ ] Búsqueda por nombre, código, RNC implementada
- [ ] Validaciones completas:
  - [ ] RNC único y formato válido (9 dígitos)
  - [ ] Email válido
  - [ ] Código único
  - [ ] Nombre requerido
  - [ ] No eliminar cliente con ubicaciones activas
- [ ] Protección por roles correcta:
  - [ ] GET: todos los roles
  - [ ] POST: ADMIN, SUPERVISOR
  - [ ] PUT: ADMIN, SUPERVISOR
  - [ ] DELETE: solo ADMIN
- [ ] Tests de integración > 12 casos
- [ ] Manejo de errores robusto
- [ ] Respuestas HTTP apropiadas

**Método de validación**:
- Ejecutar tests: `npm test backend/tests/integration/clientes.test.ts`
- Verificar cobertura con Jest
- Probar manualmente con Postman/curl (opcional)

**Resultado esperado**: Todos los criterios cumplidos

---

### 8. Documentar resultado

**Descripción**: Crear archivo de completitud en docs/completed/

**Archivos a crear**: `docs/completed/T2.07_crud_clientes.md`

**Contenido**:
- Resumen de lo realizado
- Archivos generados/modificados
- Criterios de aceptación cumplidos
- Comandos ejecutados (tests)
- Pruebas realizadas
- Decisiones técnicas
- Tiempo invertido

**Resultado esperado**: Documentación completa de la tarea

---

## Criterios de Aceptación (checklist)

- [ ] Modelo cliente.model.ts creado con interfaces completas
- [ ] Schemas cliente.schema.ts con validaciones Zod
- [ ] Servicio clientes.service.ts con 5 funciones CRUD
- [ ] Controlador clientes.controller.ts con 5 handlers
- [ ] Rutas clientes.routes.ts con protección por roles
- [ ] Tests clientes.test.ts con > 12 casos
- [ ] 5 endpoints funcionando correctamente
- [ ] Paginación y búsqueda operativas
- [ ] Validaciones de negocio implementadas (código único, RNC, email, FK ubicaciones)
- [ ] Solo ADMIN puede eliminar
- [ ] Tests pasando al 100%

## Archivos a Generar

1. `backend/src/models/cliente.model.ts` - Interfaces y DTOs
2. `backend/src/schemas/cliente.schema.ts` - Schemas Zod
3. `backend/src/services/clientes.service.ts` - Lógica de negocio
4. `backend/src/controllers/clientes.controller.ts` - Controllers
5. `backend/src/routes/clientes.routes.ts` - Rutas
6. `backend/tests/integration/clientes.test.ts` - Tests
7. `docs/completed/T2.07_crud_clientes.md` - Documentación

## Archivos a Modificar

1. `backend/src/server.ts` - Montar router de clientes
2. `backend/src/models/index.ts` - Exportar modelo cliente (opcional)
3. `backend/src/services/index.ts` - Exportar servicio clientes (opcional)
4. `backend/src/controllers/index.ts` - Exportar controllers (opcional)
5. `backend/src/routes/index.ts` - Exportar router (opcional)

## Riesgos y Consideraciones

### Riesgo 1: Validación de RNC

**Descripción**: RNC en RD puede tener varios formatos (9 o 11 dígitos)

**Mitigación**:
- Aceptar 9-11 dígitos en schema
- Documentar formato esperado
- Permitir null si no se provee

### Riesgo 2: Soft Delete con Ubicaciones

**Descripción**: Cliente con ubicaciones activas no debe poder eliminarse

**Mitigación**:
- Query COUNT en ubicaciones antes de soft delete
- Retornar error 409 si tiene ubicaciones activas
- Mensaje claro al usuario

### Riesgo 3: Códigos Únicos

**Descripción**: Validar unicidad de código y RNC antes de INSERT/UPDATE

**Mitigación**:
- Query SELECT antes de INSERT
- Excluir ID actual en UPDATE (WHERE codigo = ? AND id != ?)
- Catch MySQL duplicate key error (ER_DUP_ENTRY)

### Riesgo 4: Paralelización con T2.05, T2.10, T2.11

**Descripción**: Otros subagentes trabajando en paralelo

**Mitigación**:
- NO tocar archivos: usuarios.*, feriados.*, config-turnos.*
- NO modificar server.ts hasta el final (o coordinar cambios)
- Usar archivos propios: cliente.*

## Notas Adicionales

- **Base de datos**: Usar pool `getTurnosPool()` de `backend/src/config/database.ts`
- **Estilo de código**: Seguir convenciones del proyecto (ver auth.service.ts)
- **Comentarios**: JSDoc para funciones públicas
- **Commits**: NO commitear hasta completar y validar (responsabilidad del coordinador)
- **Testing**: Ejecutar tests después de cada subtarea mayor

---

**Estimación de tiempo por subtarea**:
1. Modelo (20 min)
2. Schemas (30 min)
3. Servicio (60 min)
4. Controller (40 min)
5. Rutas (20 min)
6. Tests (60 min)
7. Validación (20 min)
8. Documentación (30 min)

**Total estimado**: 4 horas 20 minutos
