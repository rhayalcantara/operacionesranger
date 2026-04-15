# Plan: T2.10 - Implementar CRUD de Feriados

**Fecha**: 2026-01-18
**Tarea padre**: T2.10
**Fase**: Fase 2 - Backend Core
**Estimación**: 3-4 horas

## Objetivo

Crear endpoints CRUD completos para la gestión de feriados nacionales y por decreto, incluyendo un endpoint especial que utiliza el stored procedure `sp_verificar_feriado` para determinar si una fecha específica es feriado.

## Contexto

- **Tabla**: `feriados` (ya existe en la base de datos `turnos_guardianes`)
- **Campos**: id, fecha, nombre, tipo (NACIONAL | DECRETO), descripcion, created_at
- **Stored Procedure existente**: `sp_verificar_feriado(p_fecha, OUT es_feriado, OUT feriado_id, OUT tipo_feriado)`
- **Sistema de autenticación**: Ya implementado (T2.01-T2.04 completadas)
- **Middlewares disponibles**: `authMiddleware`, `requireRole`
- **Permisos**: ADMIN para CUD, todos autenticados para R
- **Ejecución en paralelo**: Trabajando con subagentes en T2.05 (usuarios), T2.07 (clientes), T2.11 (config turnos)

## Subtareas

### 1. Crear modelo de datos TypeScript
- **Descripción**: Definir interfaces y tipos para la entidad Feriado
- **Archivos a crear**: `backend/src/models/feriado.model.ts`
- **Resultado esperado**: Interfaces `Feriado`, `FeriadoCreateDTO`, `FeriadoUpdateDTO`, `FeriadoVerificacionResponse`

### 2. Crear schemas de validación con Zod
- **Descripción**: Definir schemas Zod para validación de inputs
- **Archivos a crear**: `backend/src/schemas/feriado.schema.ts`
- **Resultado esperado**: Schemas `feriadoCreateSchema`, `feriadoUpdateSchema`, validaciones de fecha y tipo

### 3. Implementar servicio de lógica de negocio
- **Descripción**: Crear capa de servicio con métodos CRUD y verificación usando SP
- **Archivos a crear**: `backend/src/services/feriados.service.ts`
- **Resultado esperado**:
  - Métodos: `getAll`, `getById`, `verificarFeriado` (llama a SP), `create`, `update`, `delete`
  - Paginación server-side
  - Filtrado por año y tipo
  - Validación de duplicados

### 4. Implementar controladores
- **Descripción**: Crear controladores para manejar requests HTTP
- **Archivos a crear**: `backend/src/controllers/feriados.controller.ts`
- **Resultado esperado**: 6 controladores mapeados a servicios con manejo de errores

### 5. Implementar rutas
- **Descripción**: Definir endpoints REST con middlewares apropiados
- **Archivos a crear**: `backend/src/routes/feriados.routes.ts`
- **Resultado esperado**:
  - GET /api/feriados (todos autenticados)
  - GET /api/feriados/:id (todos autenticados)
  - GET /api/feriados/verificar/:fecha (todos autenticados)
  - POST /api/feriados (solo ADMIN)
  - PUT /api/feriados/:id (solo ADMIN)
  - DELETE /api/feriados/:id (solo ADMIN)

### 6. Crear tests de integración
- **Descripción**: Suite completa de tests con Supertest
- **Archivos a crear**: `backend/tests/integration/feriados.test.ts`
- **Resultado esperado**:
  - Mínimo 12 tests cubriendo:
    - GET all con paginación y filtros
    - GET by ID (success y not found)
    - GET verificar (feriado y no feriado)
    - POST (success, duplicado, validaciones)
    - PUT (success, not found)
    - DELETE (success, not found)
    - Tests de autorización (ADMIN vs otros roles)

### 7. Registrar rutas en server.ts
- **Descripción**: Agregar rutas de feriados al servidor Express
- **Archivos a modificar**: `backend/src/server.ts`
- **Resultado esperado**: Import y uso de feriadosRouter con prefijo `/api/feriados`

### 8. Ejecutar tests y validar funcionamiento
- **Descripción**: Ejecutar suite de tests y validar todos los endpoints
- **Comando**: `npm test -- feriados.test.ts`
- **Resultado esperado**: Todos los tests pasando (>= 12/12)

## Criterios de Aceptación (checklist)

- [ ] Modelo `feriado.model.ts` creado con interfaces completas
- [ ] Schemas Zod en `feriado.schema.ts` con validaciones
- [ ] Servicio `feriados.service.ts` con 6 métodos
- [ ] Endpoint GET /api/feriados con paginación y filtros (año, tipo)
- [ ] Endpoint GET /api/feriados/:id funcionando
- [ ] Endpoint GET /api/feriados/verificar/:fecha usando SP `sp_verificar_feriado`
- [ ] Endpoint POST con validación de duplicados
- [ ] Endpoint PUT funcionando
- [ ] Endpoint DELETE funcionando (hard delete)
- [ ] Middlewares de autenticación y autorización aplicados
- [ ] Tests de integración >= 12 casos
- [ ] Todos los tests pasando
- [ ] Rutas registradas en server.ts
- [ ] Sin conflictos con archivos de otros subagentes

## Archivos a Generar

- `backend/src/models/feriado.model.ts` - Interfaces TypeScript
- `backend/src/schemas/feriado.schema.ts` - Schemas de validación Zod
- `backend/src/services/feriados.service.ts` - Lógica de negocio
- `backend/src/controllers/feriados.controller.ts` - Controladores HTTP
- `backend/src/routes/feriados.routes.ts` - Definición de rutas
- `backend/tests/integration/feriados.test.ts` - Suite de tests

## Archivos a Modificar

- `backend/src/server.ts` - Registrar rutas de feriados

## Riesgos y Consideraciones

1. **Stored Procedure `sp_verificar_feriado`**: Debe llamarse correctamente desde Node.js usando conexión MySQL
   - Mitigación: Usar `connection.query('CALL sp_verificar_feriado(?, @es_feriado, @feriado_id, @tipo_feriado)', [fecha])` seguido de `SELECT @es_feriado, @feriado_id, @tipo_feriado`

2. **Validación de duplicados**: Fecha ya existe en BD
   - Mitigación: Catch error de constraint `uk_fecha` y retornar 409 Conflict

3. **Formato de fecha**: Debe ser YYYY-MM-DD
   - Mitigación: Validar con Zod schema usando `z.string().date()` o regex

4. **Paralelización**: Otros subagentes trabajando simultáneamente
   - Mitigación: NO tocar archivos de otros (usuarios.*, clientes.*, config-turnos.*), solo archivos de feriados

5. **Integración con server.ts**: Posible conflicto si otro subagente modifica simultáneamente
   - Mitigación: Agregar import y router al final del archivo, área de bajo conflicto

## Notas Adicionales

- La tabla `feriados` NO tiene campo `activo`, solo `created_at`
- El campo `recurrente` mencionado en la task NO existe en el schema actual - usar solo `tipo` (NACIONAL = recurrente, DECRETO = no recurrente)
- Los feriados NACIONALES son anuales y recurrentes (Año Nuevo, Independencia, etc.)
- Los feriados por DECRETO son especiales y no recurrentes (eventos únicos)
- Domingo NO es feriado a menos que esté explícitamente en la tabla
- El SP `sp_verificar_feriado` retorna OUT parameters, no un result set directo

## Dependencias de Base de Datos

```sql
-- Stored Procedure a utilizar:
CALL sp_verificar_feriado(
    IN p_fecha DATE,
    OUT p_es_feriado BOOLEAN,
    OUT p_feriado_id INT,
    OUT p_tipo_feriado VARCHAR(20)
)

-- Estructura de la tabla:
CREATE TABLE feriados (
    id INT AUTO_INCREMENT PRIMARY KEY,
    fecha DATE NOT NULL,
    nombre VARCHAR(100) NOT NULL,
    tipo ENUM('NACIONAL', 'DECRETO') NOT NULL DEFAULT 'NACIONAL',
    descripcion TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uk_fecha (fecha),
    INDEX idx_fecha (fecha),
    INDEX idx_tipo (tipo)
)
```

## Orden de Ejecución

1. Modelo (interfaces base)
2. Schemas (validaciones)
3. Servicio (lógica con DB)
4. Controladores (handlers HTTP)
5. Rutas (endpoints)
6. Tests (validación)
7. Registro en server.ts
8. Validación final

## Estimación de Tiempo por Subtarea

1. Modelo: 20 minutos
2. Schemas: 25 minutos
3. Servicio: 60 minutos (incluye SP call)
4. Controladores: 30 minutos
5. Rutas: 20 minutos
6. Tests: 60 minutos
7. Registro server.ts: 5 minutos
8. Validación: 20 minutos

**Total estimado**: 3h 40min (dentro del rango 3-4h)
