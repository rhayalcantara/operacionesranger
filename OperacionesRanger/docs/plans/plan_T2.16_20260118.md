# Plan: T2.16 - Implementar servicio de consulta de empleados RRHH

**Fecha**: 2026-01-18
**Tarea padre**: T2.16
**Fase**: Fase 2 - Backend Core
**Estimación**: 3-4 horas

## Objetivo

Crear servicio y endpoints para consultar empleados (guardianes de seguridad) desde la base de datos RRHH externa (`db_aae4a2_ranger.rh_empleado`) con acceso de solo lectura. El servicio permitirá listar, buscar y validar guardianes activos que serán asignados a turnos.

## Contexto

**Integración con BD RRHH**:
- Base de datos externa: `db_aae4a2_ranger`
- Tabla: `rh_empleado`
- Acceso: **READ-ONLY** (solo consultas SELECT)
- Conexión ya configurada en `backend/src/config/database.ts` (pool `dbRRHH`)

**Filtro base para guardianes**:
```sql
WHERE id_puesto = 97 AND status = 1
```
- `id_puesto = 97`: Puesto "VIGILANTE DE SEGURIDAD"
- `status = 1`: Empleado activo

**Campos relevantes de `rh_empleado`** (según T002_investigacion_rrhh.md):
- `id_empleado` (INT, PK)
- `codigo_empleado` (VARCHAR)
- `cedula_empleado` (VARCHAR, UNIQUE)
- `nombres` (VARCHAR)
- `apellidos` (VARCHAR)
- `email` (VARCHAR, NULL)
- `telefono` (VARCHAR, NULL)
- `fecha_ingreso` (DATE)
- `id_puesto` (INT, FK) - Siempre 97 para guardianes
- `status` (TINYINT) - Siempre 1 para activos
- `created_at`, `updated_at` (TIMESTAMP)

**Datos esperados**: Aproximadamente 515 guardianes activos según investigación T002.

## Subtareas

### 1. Crear modelo Guardian (TypeScript interfaces)
- **Descripción**: Definir interfaces TypeScript para representar datos de guardianes
- **Archivos a crear**: `backend/src/models/guardian.model.ts`
- **Contenido**:
  - Interface `Guardian`: campos principales del guardián
  - Interface `GuardianFilters`: filtros de búsqueda (page, pageSize, search)
  - Interface `GuardianPaginatedResponse`: respuesta con paginación
- **Resultado esperado**: Interfaces bien tipadas para uso en servicio y controladores

### 2. Crear servicio RRHH
- **Descripción**: Implementar lógica de consulta a BD RRHH
- **Archivos a crear**: `backend/src/services/rrhh.service.ts`
- **Métodos a implementar**:
  1. `getGuardianes(filters)`: Listar guardianes con paginación y búsqueda
     - Filtros: page, pageSize, search
     - Search busca en: nombres, apellidos, cedula_empleado
     - Retorna: `{ data: Guardian[], total: number }`
  2. `getGuardianById(id)`: Obtener guardián por id_empleado
     - Valida que sea guardián activo (id_puesto=97, status=1)
     - Retorna: `Guardian | null`
  3. `buscarGuardianes(search)`: Búsqueda rápida por nombre o cédula
     - Límite: 20 resultados
     - Retorna: `Guardian[]`
  4. `validarGuardianActivo(id)`: Verificar si empleado es guardián activo
     - Retorna: `boolean`
     - Usado por otros servicios antes de asignar turnos
- **Comandos/herramientas**: Usar pool `getRRHHPool()` de database.ts
- **Resultado esperado**: Servicio completo con 4 métodos funcionales

### 3. Crear controladores RRHH
- **Descripción**: Implementar controladores HTTP para endpoints
- **Archivos a crear**: `backend/src/controllers/rrhh.controller.ts`
- **Controladores a implementar**:
  1. `getGuardianes`: GET /api/rrhh/guardianes
     - Query params: page, pageSize, search
     - Llama a `rrhhService.getGuardianes()`
     - Response 200: `{ data: Guardian[], total: number }`
  2. `getGuardianById`: GET /api/rrhh/guardianes/:id
     - Param: id_empleado
     - Llama a `rrhhService.getGuardianById()`
     - Response 200: Guardian completo
     - Response 404: Si no existe o no es guardián activo
  3. `buscarGuardianes`: GET /api/rrhh/guardianes/buscar/:search
     - Param: search (nombre o cédula)
     - Llama a `rrhhService.buscarGuardianes()`
     - Response 200: `Guardian[]` (máximo 20)
- **Resultado esperado**: 3 controladores con manejo de errores

### 4. Crear rutas RRHH
- **Descripción**: Definir rutas protegidas para endpoints
- **Archivos a crear**: `backend/src/routes/rrhh.routes.ts`
- **Rutas a definir**:
  - `GET /api/rrhh/guardianes` - Todos los roles (ADMIN, SUPERVISOR, CONSULTA)
  - `GET /api/rrhh/guardianes/:id` - Todos los roles
  - `GET /api/rrhh/guardianes/buscar/:search` - Todos los roles
- **Middlewares**:
  - `authMiddleware`: Autenticación JWT
  - `requireRole('ADMIN', 'SUPERVISOR', 'CONSULTA')`: Todos pueden ver
- **Resultado esperado**: Archivo de rutas con 3 endpoints protegidos

### 5. Integrar rutas en servidor principal
- **Descripción**: Agregar rutas RRHH al servidor Express
- **Archivos a modificar**: `backend/src/server.ts`
- **Acción**:
  - Importar `rrhhRoutes`
  - Registrar con `app.use('/api/rrhh', rrhhRoutes)`
- **Importante**:
  - Agregar al FINAL del archivo (antes del export)
  - NO modificar secciones de otras tareas en paralelo (ubicaciones)
- **Resultado esperado**: Rutas RRHH disponibles en servidor

### 6. Crear tests de integración
- **Descripción**: Implementar tests completos para servicio y endpoints
- **Archivos a crear**: `backend/tests/integration/rrhh.test.ts`
- **Tests a implementar** (>10 casos):

  **Servicio (rrhhService)**:
  1. getGuardianes() retorna lista paginada
  2. getGuardianes() con search filtra correctamente
  3. getGuardianes() con paginación funciona
  4. getGuardianById() retorna guardián existente
  5. getGuardianById() retorna null si no existe
  6. getGuardianById() retorna null si no es guardián (id_puesto != 97)
  7. buscarGuardianes() encuentra por nombre
  8. buscarGuardianes() encuentra por cédula
  9. buscarGuardianes() limita a 20 resultados
  10. validarGuardianActivo() retorna true para guardián activo
  11. validarGuardianActivo() retorna false para inactivo

  **Endpoints (API)**:
  12. GET /guardianes sin autenticación retorna 401
  13. GET /guardianes con autenticación retorna 200
  14. GET /guardianes/:id retorna 200 si existe
  15. GET /guardianes/:id retorna 404 si no existe
  16. GET /guardianes/buscar/:search retorna resultados

- **Setup**: Usar BD RRHH real o mock según disponibilidad
- **Resultado esperado**: >10 tests pasando, coverage >80%

### 7. Manejo de errores especial BD RRHH
- **Descripción**: Implementar manejo robusto si BD RRHH no está disponible
- **Archivos a modificar**: `backend/src/services/rrhh.service.ts`
- **Casos de error**:
  - BD RRHH no disponible → Response 503 Service Unavailable
  - Timeout de conexión → Response 504 Gateway Timeout
  - Error de query → Response 500 Internal Server Error
- **Logging**: Registrar errores de BD RRHH para debugging
- **Resultado esperado**: Errores claros, no crashes del servidor

## Criterios de Aceptación (checklist)

- [ ] Servicio rrhh.service.ts creado con 4 métodos
- [ ] Modelo guardian.model.ts creado con interfaces TypeScript
- [ ] Controlador rrhh.controller.ts creado con 3 funciones
- [ ] Rutas rrhh.routes.ts creadas con protección por roles
- [ ] Rutas integradas en server.ts
- [ ] Tests de integración implementados (>10 casos)
- [ ] Conexión a BD RRHH read-only usando pool existente
- [ ] Paginación implementada (page, pageSize)
- [ ] Búsqueda implementada (search en nombres, apellidos, cédula)
- [ ] Filtro `id_puesto = 97 AND status = 1` aplicado en todas las queries
- [ ] Manejo de errores si BD RRHH no disponible
- [ ] Documentación de código completa (JSDoc)

## Archivos a Generar

- `backend/src/models/guardian.model.ts` - Interfaces TypeScript
- `backend/src/services/rrhh.service.ts` - Lógica de consulta RRHH
- `backend/src/controllers/rrhh.controller.ts` - Controladores HTTP
- `backend/src/routes/rrhh.routes.ts` - Rutas protegidas
- `backend/tests/integration/rrhh.test.ts` - Tests de integración

## Archivos a Modificar

- `backend/src/server.ts` - Agregar rutas RRHH (solo al final)

## Riesgos y Consideraciones

### Riesgo 1: BD RRHH no disponible en desarrollo
- **Mitigación**: Implementar manejo robusto de errores
- **Alternativa**: Crear mock data para desarrollo local

### Riesgo 2: Performance con 515+ guardianes
- **Mitigación**: Implementar paginación obligatoria
- **Optimización**: Límite de pageSize máximo (100)

### Riesgo 3: Conflicto con tarea T2.08 en paralelo
- **Mitigación**:
  - T2.08 trabaja con ubicaciones (archivos diferentes)
  - T2.16 trabaja con guardianes (archivos diferentes)
  - Único archivo compartido: `server.ts`
  - **Solución**: Agregar rutas al FINAL de server.ts, coordinador resolverá conflictos si existen

### Riesgo 4: Queries lentas a BD RRHH externa
- **Mitigación**:
  - Usar índices existentes (idx_puesto, idx_status)
  - Limit queries a campos necesarios (no SELECT *)
  - Implementar timeout de conexión razonable

## Notas Adicionales

**Conexión a BD RRHH**:
- Ya está configurada en `src/config/database.ts`
- Función: `getRRHHPool()`
- Variables de entorno necesarias:
  - `DB_RRHH_HOST` (default: localhost)
  - `DB_RRHH_PORT` (default: 3306)
  - `DB_RRHH_NAME` (default: db_aae4a2_ranger)
  - `DB_RRHH_USER` (default: root)
  - `DB_RRHH_PASSWORD` (requerida)

**Permisos de endpoints**:
- Todos los endpoints permiten acceso a ADMIN, SUPERVISOR, CONSULTA
- Razón: Consultar guardianes es necesario para todos los usuarios del sistema

**Campos sensibles**:
- NO exponer: `salario_base`, `cuenta_bancaria`, `id_banco`
- SÍ exponer: id, cédula, nombres, apellidos, contacto, fecha_ingreso

**Query de ejemplo**:
```typescript
const query = `
  SELECT
    id_empleado,
    codigo_empleado,
    cedula_empleado,
    nombres,
    apellidos,
    CONCAT(nombres, ' ', apellidos) AS nombre_completo,
    email,
    telefono,
    fecha_ingreso,
    id_puesto,
    status,
    created_at,
    updated_at
  FROM rh_empleado
  WHERE id_puesto = 97 AND status = 1
  ORDER BY apellidos, nombres
  LIMIT ? OFFSET ?
`;
```

---

**Plan creado**: 2026-01-18
**Listo para ejecución**: ✅ SÍ
**Dependencias bloqueadas**: ❌ NINGUNA (T2.04 completada)
**Tareas en paralelo**: T2.08 (CRUD ubicaciones) - Sin conflictos
