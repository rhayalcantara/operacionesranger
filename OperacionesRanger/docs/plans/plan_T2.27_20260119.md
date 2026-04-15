# Plan: T2.27 - Implementar documentación Swagger/OpenAPI

**Fecha**: 2026-01-19
**Tarea padre**: T2.27
**Fase**: Fase 2 - Backend Core
**Estimación**: 4-5 horas

## Objetivo

Implementar documentación interactiva de API usando Swagger/OpenAPI con swagger-ui-express y swagger-jsdoc. La documentación debe incluir TODOS los endpoints existentes (30+ endpoints), schemas de request/response, códigos de respuesta HTTP, autenticación JWT, y ejemplos de requests.

## Contexto

El backend tiene 11 archivos de rutas implementados con los siguientes módulos:
- **Autenticación**: `/api/auth` (4 endpoints)
- **Usuarios**: `/api/usuarios` (6 endpoints)
- **Clientes**: `/api/clientes` (5 endpoints)
- **Ubicaciones**: `/api/ubicaciones` (5 endpoints)
- **Puestos**: `/api/puestos` (6 endpoints)
- **Feriados**: `/api/feriados` (6 endpoints)
- **Configuración Turnos**: `/api/configuracion-turnos` (3 endpoints)
- **Incentivos**: `/api/incentivos` (6 endpoints)
- **RRHH**: `/api/rrhh` (5 endpoints)
- **Turnos**: `/api/turnos` (7 endpoints)
- **Reportes**: `/api/reportes` (7 endpoints)

**Total estimado**: ~60 endpoints

La API usa autenticación JWT Bearer con roles (ADMIN, SUPERVISOR, CONSULTA) y todos los endpoints retornan JSON con estructura consistente.

## Subtareas

### 1. Instalar dependencias de Swagger
- **Descripción**: Instalar swagger-ui-express y swagger-jsdoc con sus tipos TypeScript
- **Archivos a modificar**: `backend/package.json`
- **Comando/herramienta**: `npm install --save swagger-ui-express swagger-jsdoc` + `npm install --save-dev @types/swagger-ui-express @types/swagger-jsdoc`
- **Resultado esperado**: Dependencias instaladas en package.json y node_modules

### 2. Crear configuración de Swagger
- **Descripción**: Crear archivo de configuración central de Swagger/OpenAPI con metadatos del proyecto, servidores, y configuración de seguridad JWT
- **Archivos a crear**: `backend/src/config/swagger.ts`
- **Resultado esperado**: Configuración OpenAPI 3.0 con:
  - Info: título, versión, descripción, contacto
  - Servers: localhost:3000 (dev) y producción (si aplica)
  - Security: JWT Bearer token scheme
  - Tags: agrupación por módulos (Auth, Usuarios, Clientes, etc.)

### 3. Integrar Swagger UI en server.ts
- **Descripción**: Importar y montar Swagger UI en la ruta `/api-docs` usando swagger-ui-express y swagger-jsdoc
- **Archivos a modificar**: `backend/src/server.ts`
- **Resultado esperado**: Ruta `/api-docs` accesible con Swagger UI funcionando

### 4. Documentar módulo de Autenticación
- **Descripción**: Agregar anotaciones JSDoc con @swagger en auth.routes.ts para documentar los 4 endpoints de autenticación
- **Archivos a modificar**: `backend/src/routes/auth.routes.ts`
- **Endpoints a documentar**:
  - POST /api/auth/login (username, password → accessToken, refreshToken, user)
  - POST /api/auth/refresh (refreshToken → accessToken)
  - POST /api/auth/logout (revocar refreshToken)
  - POST /api/auth/change-password (cambiar contraseña)
- **Resultado esperado**: 4 endpoints documentados con schemas, ejemplos, y respuestas

### 5. Documentar módulo de Usuarios
- **Descripción**: Agregar anotaciones JSDoc en usuarios.routes.ts para los 6 endpoints de gestión de usuarios
- **Archivos a modificar**: `backend/src/routes/usuarios.routes.ts`
- **Endpoints a documentar**:
  - GET /api/usuarios (lista paginada, requiere ADMIN)
  - GET /api/usuarios/:id (obtener usuario por ID)
  - POST /api/usuarios (crear usuario, requiere ADMIN)
  - PUT /api/usuarios/:id (actualizar usuario)
  - DELETE /api/usuarios/:id (soft delete)
  - POST /api/usuarios/:id/reset-password (resetear password)
- **Resultado esperado**: 6 endpoints documentados con seguridad JWT y roles

### 6. Documentar módulos de Maestros (Clientes, Ubicaciones, Puestos, Feriados, Config Turnos, Incentivos)
- **Descripción**: Agregar anotaciones JSDoc en todos los archivos de rutas de maestros
- **Archivos a modificar**:
  - `backend/src/routes/clientes.routes.ts` (5 endpoints)
  - `backend/src/routes/ubicaciones.routes.ts` (5 endpoints)
  - `backend/src/routes/puestos.routes.ts` (6 endpoints)
  - `backend/src/routes/feriados.routes.ts` (6 endpoints)
  - `backend/src/routes/config-turnos.routes.ts` (3 endpoints)
  - `backend/src/routes/incentivos.routes.ts` (6 endpoints)
- **Resultado esperado**: 31 endpoints documentados con schemas de modelos, validaciones, y respuestas

### 7. Documentar módulo de RRHH
- **Descripción**: Agregar anotaciones JSDoc en rrhh.routes.ts para consultas de guardianes
- **Archivos a modificar**: `backend/src/routes/rrhh.routes.ts`
- **Endpoints a documentar**:
  - GET /api/rrhh/guardianes (lista paginada de guardianes activos)
  - GET /api/rrhh/guardianes/:id (obtener guardián por ID)
  - GET /api/rrhh/guardianes/buscar/:search (buscar por nombre o cédula)
  - POST /api/rrhh/cache/clear (limpiar caché, ADMIN)
  - GET /api/rrhh/cache/stats (estadísticas de caché)
- **Resultado esperado**: 5 endpoints documentados con integración a BD RRHH

### 8. Documentar módulo de Turnos
- **Descripción**: Agregar anotaciones JSDoc en turnos.routes.ts para gestión de turnos
- **Archivos a modificar**: `backend/src/routes/turnos.routes.ts`
- **Endpoints a documentar**:
  - POST /api/turnos (registrar turno)
  - GET /api/turnos (lista paginada con filtros)
  - GET /api/turnos/:id (obtener turno por ID)
  - GET /api/turnos/empleado/:empleado_id/resumen (resumen de turnos por empleado)
  - GET /api/turnos/calendario/:año/:mes (vista de calendario mensual)
  - PUT /api/turnos/:id (actualizar turno no procesado)
  - DELETE /api/turnos/:id (eliminar turno no procesado)
- **Resultado esperado**: 7 endpoints documentados con validaciones de horas, tipos de turno, feriados

### 9. Documentar módulo de Reportes
- **Descripción**: Agregar anotaciones JSDoc en reportes.routes.ts para generación de reportes CSV y resúmenes
- **Archivos a modificar**: `backend/src/routes/reportes.routes.ts`
- **Endpoints a documentar**:
  - POST /api/reportes/nomina (generar CSV para nómina)
  - POST /api/reportes/marcar-procesados (marcar turnos como procesados)
  - GET /api/reportes/historial (historial de reportes generados)
  - GET /api/reportes/:id/descargar (re-descargar reporte)
  - GET /api/reportes/resumen-quincena (resumen de quincena)
  - GET /api/reportes/resumen-por-guardian (resumen por guardián)
  - GET /api/reportes/resumen-por-puesto (resumen por puesto)
- **Resultado esperado**: 7 endpoints documentados con respuestas CSV y JSON

### 10. Crear schemas reutilizables
- **Descripción**: Definir componentes/schemas reutilizables en la configuración de Swagger para reducir duplicación
- **Archivos a modificar**: `backend/src/config/swagger.ts`
- **Schemas a crear**:
  - Usuario, Cliente, Ubicacion, Puesto, Feriado, ConfiguracionTurno, Incentivo
  - Guardian (empleado RRHH), Turno, Reporte
  - PaginatedResponse, ErrorResponse, ValidationError
  - LoginRequest, LoginResponse, RefreshTokenRequest, etc.
- **Resultado esperado**: Schemas centralizados y reutilizables en toda la documentación

### 11. Agregar ejemplos de requests y responses
- **Descripción**: Incluir ejemplos realistas en cada endpoint documentado para facilitar testing desde Swagger UI
- **Archivos a modificar**: Todos los archivos de rutas (anotaciones @swagger)
- **Resultado esperado**: Cada endpoint tiene al menos 1 ejemplo de request y múltiples ejemplos de responses (200, 400, 401, 403, 404, 500)

### 12. Actualizar README con link a documentación
- **Descripción**: Agregar sección de "Documentación de API" en README.md con link a Swagger UI
- **Archivos a modificar**: `backend/README.md`
- **Resultado esperado**: README menciona `/api-docs` y cómo acceder a la documentación interactiva

### 13. Validar documentación completa
- **Descripción**: Revisar Swagger UI en navegador y probar autenticación JWT desde la interfaz
- **Comando/herramienta**: Abrir http://localhost:3000/api-docs en navegador (sin iniciar servidor, solo revisar configuración)
- **Resultado esperado**: Todos los endpoints visibles, organizados por tags, con schemas correctos

## Criterios de Aceptación (checklist)

- [ ] Dependencias swagger-ui-express y swagger-jsdoc instaladas
- [ ] Configuración de Swagger creada en src/config/swagger.ts
- [ ] Swagger UI accesible en /api-docs (configurado en server.ts)
- [ ] Todos los endpoints de autenticación documentados (4)
- [ ] Todos los endpoints de usuarios documentados (6)
- [ ] Todos los endpoints de maestros documentados (31: clientes, ubicaciones, puestos, feriados, config-turnos, incentivos)
- [ ] Todos los endpoints de RRHH documentados (5)
- [ ] Todos los endpoints de turnos documentados (7)
- [ ] Todos los endpoints de reportes documentados (7)
- [ ] Schemas reutilizables creados (modelos, errores, paginación)
- [ ] Autenticación JWT Bearer documentada y probable desde UI
- [ ] Ejemplos de requests incluidos en cada endpoint
- [ ] README actualizado con link a /api-docs
- [ ] Total de endpoints documentados: 60+

## Archivos a Generar/Modificar

**Nuevos**:
- `backend/src/config/swagger.ts` - Configuración central de OpenAPI 3.0

**Modificados**:
- `backend/package.json` - Agregar dependencias
- `backend/src/server.ts` - Integrar Swagger UI en /api-docs
- `backend/src/routes/auth.routes.ts` - Agregar anotaciones @swagger
- `backend/src/routes/usuarios.routes.ts` - Agregar anotaciones @swagger
- `backend/src/routes/clientes.routes.ts` - Agregar anotaciones @swagger
- `backend/src/routes/ubicaciones.routes.ts` - Agregar anotaciones @swagger
- `backend/src/routes/puestos.routes.ts` - Agregar anotaciones @swagger
- `backend/src/routes/feriados.routes.ts` - Agregar anotaciones @swagger
- `backend/src/routes/config-turnos.routes.ts` - Agregar anotaciones @swagger
- `backend/src/routes/incentivos.routes.ts` - Agregar anotaciones @swagger
- `backend/src/routes/rrhh.routes.ts` - Agregar anotaciones @swagger
- `backend/src/routes/turnos.routes.ts` - Agregar anotaciones @swagger
- `backend/src/routes/reportes.routes.ts` - Agregar anotaciones @swagger
- `backend/README.md` - Agregar sección de documentación

## Riesgos y Consideraciones

**Riesgo 1**: Gran cantidad de endpoints (60+) puede tomar más tiempo del estimado
- **Mitigación**: Crear plantillas de anotaciones reutilizables para endpoints similares (GET, POST, PUT, DELETE). Priorizar endpoints críticos primero (auth, turnos, reportes).

**Riesgo 2**: Conflictos con TypeScript strict mode en anotaciones JSDoc
- **Mitigación**: Usar sintaxis estándar de OpenAPI 3.0 en comentarios JSDoc. Validar con ejemplos de swagger-jsdoc.

**Riesgo 3**: No poder probar servidor debido a errores de compilación pre-existentes
- **Mitigación**: Según instrucciones del usuario, NO se debe iniciar el servidor. Solo validar que la configuración de Swagger esté correcta (sintaxis, imports, estructura).

**Riesgo 4**: Schemas complejos (especialmente Turno con campos auto-calculados)
- **Mitigación**: Documentar campos readonly y auto-calculados con descripciones claras. Usar ejemplos realistas.

## Notas Adicionales

- **NO iniciar servidor**: Según instrucciones, pueden haber errores de compilación pre-existentes. Solo implementar la configuración de Swagger.
- **Enfoque en cobertura completa**: Todos los 60+ endpoints deben documentarse, no solo los principales.
- **Ejemplos realistas**: Usar datos del dominio (nombres de clientes reales como "Banco Popular", cédulas dominicanas formato 001-1234567-8, etc.)
- **Organización por tags**: Agrupar endpoints por módulo (Auth, Usuarios, Maestros, Turnos, Reportes) para facilitar navegación.
- **Security schemes**: Documentar que la mayoría de endpoints requieren JWT Bearer token en header Authorization.
- **Respuestas de error consistentes**: Documentar estructura estándar de errores (status, message, details).
