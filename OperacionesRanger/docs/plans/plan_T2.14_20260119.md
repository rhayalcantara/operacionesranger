# Plan: T2.14 - Implementar logging y auditoría de operaciones

**Fecha**: 2026-01-19
**Tarea padre**: T2.14
**Fase**: Fase 2 - Backend Core (Módulo 2: Maestros CRUD)
**Estimación**: 3-4 horas
**Prioridad**: Media
**Dependencias**: T2.13 ✓

---

## Objetivo

Implementar un sistema completo de logging usando Winston y un middleware de auditoría para registrar todas las operaciones CRUD en la tabla `sys_auditoria`. El sistema debe ser configurable mediante variables de entorno y no debe exponer información sensible en los logs.

---

## Contexto

- La tabla `sys_auditoria_auth` ya existe para auditoría de autenticación
- El error handler `error-handler.middleware.ts` ya está implementado
- Todas las rutas CRUD ya tienen middlewares aplicados (validación, paginación, autenticación, roles)
- El sistema necesita logging centralizado para:
  - Debugging en desarrollo
  - Monitoreo en producción
  - Auditoría de operaciones de escritura
  - Trazabilidad de acciones por usuario

---

## Subtareas

### 1. Instalar Winston y dependencias
- **Descripción**: Instalar Winston y winston-daily-rotate-file para logging
- **Comando**:
  ```bash
  npm install winston winston-daily-rotate-file
  npm install --save-dev @types/winston
  ```
- **Resultado esperado**: Dependencias instaladas correctamente

### 2. Crear configuración de logger con Winston
- **Descripción**: Crear servicio de logger centralizado con niveles, formatos y transports
- **Archivo a crear**: `backend/src/config/logger.ts`
- **Funcionalidades**:
  - Niveles: error, warn, info, debug
  - Formato JSON en producción, pretty-print en desarrollo
  - Transport a consola (siempre)
  - Transport a archivo con rotación diaria (producible)
  - Sanitización de información sensible (passwords, tokens)
- **Resultado esperado**: Logger configurado y exportado

### 3. Crear tabla sys_auditoria para auditoría general
- **Descripción**: Crear migración SQL para tabla de auditoría de operaciones CRUD
- **Archivo a crear**: `backend/database/migrations/002_create_sys_auditoria.sql`
- **Campos de la tabla**:
  - id (INT, PK, AUTO_INCREMENT)
  - user_id (INT, FK a sys_usuarios)
  - accion (ENUM: CREATE, UPDATE, DELETE)
  - entidad (VARCHAR: nombre de la tabla/recurso)
  - entidad_id (INT, ID del registro afectado)
  - ip_address (VARCHAR, IP del cliente)
  - datos_anteriores (JSON, datos antes del cambio)
  - datos_nuevos (JSON, datos después del cambio)
  - created_at (TIMESTAMP)
- **Índices**: user_id, entidad, created_at
- **Resultado esperado**: Tabla creada correctamente en la base de datos

### 4. Implementar middleware de auditoría
- **Descripción**: Crear middleware para registrar operaciones de escritura
- **Archivo a crear**: `backend/src/middlewares/audit.middleware.ts`
- **Funcionalidades**:
  - Solo registrar POST, PUT, DELETE (no GET)
  - Capturar: user_id, acción, entidad, entidad_id, ip_address
  - Para UPDATE: capturar datos anteriores (buscar registro antes de actualizar)
  - Para DELETE: capturar datos eliminados
  - Para CREATE: capturar datos nuevos
  - Wrapper asíncrono para no bloquear request
  - Configuración habilitada/deshabilitada mediante AUDIT_ENABLED
- **Resultado esperado**: Middleware funcional que registra en sys_auditoria

### 5. Integrar logger con error handler
- **Descripción**: Modificar error-handler.middleware.ts para usar logger de Winston
- **Archivo a modificar**: `backend/src/middlewares/error-handler.middleware.ts`
- **Cambios**:
  - Importar logger de config/logger.ts
  - Reemplazar console.error con logger.error
  - Formatear logs con contexto (req.method, req.url, error.stack)
  - No exponer stack traces en producción
- **Resultado esperado**: Errores logueados con Winston

### 6. Aplicar middleware de auditoría a rutas CRUD
- **Descripción**: Agregar auditMiddleware a todas las rutas de escritura (POST, PUT, DELETE)
- **Archivos a modificar**:
  - `backend/src/routes/usuarios.routes.ts`
  - `backend/src/routes/clientes.routes.ts`
  - `backend/src/routes/ubicaciones.routes.ts`
  - `backend/src/routes/puestos.routes.ts`
  - `backend/src/routes/feriados.routes.ts`
  - `backend/src/routes/configuracion-turnos.routes.ts`
  - `backend/src/routes/incentivos.routes.ts`
  - `backend/src/routes/turnos.routes.ts`
  - `backend/src/routes/reportes.routes.ts`
- **Patrón de aplicación**:
  ```typescript
  router.post('/', authMiddleware, requireRole('ADMIN'), auditMiddleware('clientes'), createController);
  router.put('/:id', authMiddleware, requireRole('ADMIN'), auditMiddleware('clientes'), updateController);
  router.delete('/:id', authMiddleware, requireRole('ADMIN'), auditMiddleware('clientes'), deleteController);
  ```
- **Resultado esperado**: Todas las rutas de escritura tienen auditoría

### 7. Agregar variables de entorno para configuración
- **Descripción**: Actualizar schema de validación de environment variables
- **Archivo a modificar**: `backend/src/config/env.ts`
- **Variables a agregar**:
  - `LOG_LEVEL` (default: 'info', opciones: error, warn, info, debug)
  - `LOG_FILE_PATH` (default: 'logs', path relativo o absoluto)
  - `AUDIT_ENABLED` (default: true, boolean)
- **Archivo a actualizar**: `backend/.env.example`
- **Resultado esperado**: Variables validadas con Zod y documentadas

### 8. Crear tests unitarios para middleware de auditoría
- **Descripción**: Crear tests para verificar funcionamiento del auditMiddleware
- **Archivo a crear**: `backend/tests/middlewares/audit.middleware.test.ts`
- **Casos de prueba** (mínimo 15 tests):
  1. ✅ Debe registrar auditoría para POST (CREATE)
  2. ✅ Debe registrar auditoría para PUT (UPDATE)
  3. ✅ Debe registrar auditoría para DELETE
  4. ✅ NO debe registrar auditoría para GET
  5. ✅ Debe capturar user_id del req.user
  6. ✅ Debe capturar IP del cliente (req.ip)
  7. ✅ Debe capturar entidad del parámetro
  8. ✅ Para UPDATE: debe buscar datos anteriores
  9. ✅ Para DELETE: debe capturar datos antes de eliminar
  10. ✅ Debe continuar si AUDIT_ENABLED = false
  11. ✅ Debe manejar errores sin romper request
  12. ✅ Debe sanitizar passwords en datos auditados
  13. ✅ Debe sanitizar tokens en datos auditados
  14. ✅ Debe funcionar con diferentes entidades (usuarios, clientes, turnos)
  15. ✅ Debe registrar correctamente entidad_id desde params o body
- **Mocks**: Mock de conexión a base de datos (turnosPool)
- **Resultado esperado**: 15+ tests pasando

### 9. Documentar uso de logger y auditoría
- **Descripción**: Actualizar README.md con sección de logging y auditoría
- **Archivo a modificar**: `backend/README.md`
- **Contenido a agregar**:
  - Cómo usar el logger en código (`import logger from '@/config/logger'`)
  - Niveles de log disponibles
  - Cómo configurar variables de entorno
  - Ubicación de archivos de logs
  - Rotación de logs (daily)
  - Cómo consultar tabla sys_auditoria
  - Ejemplo de query SQL para ver auditoría
- **Resultado esperado**: Documentación clara y completa

---

## Criterios de Aceptación (checklist)

- [ ] Winston instalado y configurado
- [ ] Logger exportado desde config/logger.ts con niveles: error, warn, info, debug
- [ ] Formato JSON en producción, pretty-print en desarrollo
- [ ] Logs a consola y archivo con rotación diaria
- [ ] Tabla sys_auditoria creada con todos los campos necesarios
- [ ] auditMiddleware implementado y funcional
- [ ] Middleware registra solo POST, PUT, DELETE (no GET)
- [ ] Middleware captura: user_id, acción, entidad, entidad_id, ip_address
- [ ] Middleware NO expone información sensible (passwords, tokens)
- [ ] auditMiddleware aplicado a TODAS las rutas CRUD de escritura
- [ ] Error handler integrado con logger de Winston
- [ ] Variables de entorno agregadas: LOG_LEVEL, LOG_FILE_PATH, AUDIT_ENABLED
- [ ] Tests unitarios del auditMiddleware (15+ tests)
- [ ] README.md actualizado con documentación de logging y auditoría

---

## Archivos a Generar/Modificar

### Nuevos:
- `backend/src/config/logger.ts` - Configuración de Winston logger
- `backend/database/migrations/002_create_sys_auditoria.sql` - Migración de tabla
- `backend/src/middlewares/audit.middleware.ts` - Middleware de auditoría
- `backend/tests/middlewares/audit.middleware.test.ts` - Tests unitarios

### Modificados:
- `backend/src/config/env.ts` - Agregar validación de variables LOG_LEVEL, LOG_FILE_PATH, AUDIT_ENABLED
- `backend/src/middlewares/error-handler.middleware.ts` - Integrar logger de Winston
- `backend/src/routes/*.routes.ts` (9 archivos) - Aplicar auditMiddleware
- `backend/.env.example` - Documentar nuevas variables
- `backend/README.md` - Documentar logging y auditoría
- `backend/package.json` - Agregar dependencias de Winston (si no están)

---

## Riesgos y Consideraciones

### Riesgo 1: Performance del middleware de auditoría
**Descripción**: Registrar auditoría puede agregar latencia a requests de escritura
**Mitigación**:
- Usar INSERT asíncrono sin bloquear response
- Considerar queue o background job para auditoría (opcional, futuro)
- No hacer queries complejas en el middleware (solo INSERT simple)

### Riesgo 2: Datos sensibles en logs
**Descripción**: Passwords, tokens, secretos podrían loguearse accidentalmente
**Mitigación**:
- Implementar función sanitize() que remueva campos sensibles
- Lista de campos a sanitizar: password, password_hash, token, refreshToken, jwt, secret
- Aplicar sanitización en logger y en auditMiddleware

### Riesgo 3: Rotación de logs puede llenar disco
**Descripción**: Logs sin límite pueden consumir espacio en disco
**Mitigación**:
- Configurar winston-daily-rotate-file con maxSize (50MB por archivo)
- Configurar maxFiles (7 días de retención)
- Documentar en README cómo limpiar logs antiguos

### Riesgo 4: Tests bloqueados por errores pre-existentes
**Descripción**: Errores de compilación en otros archivos pueden bloquear ejecución de tests
**Mitigación**:
- Seguir instrucciones: NO ejecutar tests si están bloqueados
- Crear tests completos igualmente
- Documentar en resultado que tests están listos pero no ejecutados

---

## Notas Adicionales

- **Winston vs Pino**: Elegimos Winston porque es más popular, tiene más plugins, y la sintaxis es más familiar para equipos JavaScript
- **Auditoría vs Logging**: Son complementarios:
  - **Logging**: Para debugging, monitoreo, errores (consola + archivo)
  - **Auditoría**: Para trazabilidad legal, "quién hizo qué y cuándo" (base de datos)
- **Performance**: Si la auditoría se vuelve un cuello de botella en producción, considerar:
  - Queue (ej: Bull + Redis)
  - Background workers
  - Batch inserts
- **Consulta de auditoría**: Los endpoints de consulta de sys_auditoria se implementarán en futuras tareas si son necesarios
- **Diferencia con sys_auditoria_auth**:
  - `sys_auditoria_auth`: Solo autenticación (login, logout, refresh)
  - `sys_auditoria`: Operaciones CRUD en todas las entidades

---

## Estructura del Logger

```typescript
// Ejemplo de uso del logger en código
import logger from '@/config/logger';

logger.info('Usuario creado exitosamente', { userId: 123, username: 'admin' });
logger.warn('Intento de acceso a recurso restringido', { userId: 456, resource: '/admin' });
logger.error('Error al conectar a base de datos', { error: err.message, stack: err.stack });
logger.debug('Query SQL ejecutado', { query: 'SELECT * FROM usuarios', duration: 45 });
```

---

## Ejemplo de Registro de Auditoría

```sql
-- Consulta para ver auditoría de un usuario
SELECT
  a.id,
  a.accion,
  a.entidad,
  a.entidad_id,
  u.username,
  a.ip_address,
  a.created_at
FROM sys_auditoria a
JOIN sys_usuarios u ON a.user_id = u.id
WHERE a.user_id = 1
ORDER BY a.created_at DESC
LIMIT 20;

-- Consulta para ver cambios en un registro específico
SELECT
  a.accion,
  a.datos_anteriores,
  a.datos_nuevos,
  u.username,
  a.created_at
FROM sys_auditoria a
JOIN sys_usuarios u ON a.user_id = u.id
WHERE a.entidad = 'clientes'
  AND a.entidad_id = 5
ORDER BY a.created_at DESC;
```

---

**Tiempo estimado total**: 3-4 horas
**Complejidad**: Media
**Impacto**: Alto (infraestructura crítica para producción)
