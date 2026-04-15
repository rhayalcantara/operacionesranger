# Plan de Ejecución - T2.13: Validaciones y Middleware Común

**Tarea**: T2.13 - Implementar validaciones y middleware común para CRUDs
**Fecha**: 2026-01-19
**Estimación**: 3-4 horas

## Objetivo

Crear middlewares y utilidades comunes para validación, paginación y manejo de errores que estandaricen el comportamiento de todos los endpoints CRUD del sistema.

## Análisis de Requisitos

### Middlewares a Implementar

1. **validationMiddleware.ts**
   - Validar body, query, params usando schemas Zod
   - Responder con 400 y errores formateados
   - Flexible para validar diferentes partes del request

2. **paginationMiddleware.ts**
   - Parsear y validar parámetros de paginación
   - Defaults: page=1, pageSize=10
   - Límite máximo: pageSize=100
   - Calcular offset automáticamente

3. **errorHandlerMiddleware.ts**
   - Capturar todos los errores no manejados
   - Formatear respuestas de error consistentes
   - Logging apropiado según nivel
   - Ocultar stack traces en producción

### Utilidades de Soporte

1. **buildPaginationResponse()**
   - Crear respuesta paginada estándar
   - Incluir metadata (total, page, pageSize, totalPages)

2. **handleDatabaseError()**
   - Transformar errores MySQL a mensajes legibles
   - Mapear códigos de error SQL a HTTP status

## Arquitectura

### Estructura de Archivos

```
backend/src/
├── middlewares/
│   ├── validation.middleware.ts      (nuevo)
│   ├── pagination.middleware.ts      (nuevo)
│   └── error-handler.middleware.ts   (actualizar existente)
├── utils/
│   ├── response.utils.ts             (nuevo)
│   └── database-error.utils.ts       (nuevo)
└── types/
    └── express.d.ts                   (actualizar para pagination)
```

### Flujo de Middleware en Express

```
Request
  → authMiddleware
  → roleMiddleware
  → paginationMiddleware (para GET list)
  → validationMiddleware (para POST/PUT/PATCH)
  → Controller
  → errorHandlerMiddleware (global)
```

## Plan de Implementación

### Paso 1: Extender Types de Express (5 min)

- Actualizar `src/types/express.d.ts`
- Agregar interface para pagination en Request

```typescript
declare namespace Express {
  interface Request {
    user?: {
      id: number;
      username: string;
      rol: string;
    };
    pagination?: {
      page: number;
      pageSize: number;
      offset: number;
    };
  }
}
```

### Paso 2: Crear Utilidades de Respuesta (15 min)

**Archivo**: `src/utils/response.utils.ts`

Funciones:
- `buildPaginationResponse<T>(data, total, page, pageSize)`
- `buildSuccessResponse<T>(data, message?)`
- `buildErrorResponse(message, errors?)`

### Paso 3: Crear Utilidades de Database Error (20 min)

**Archivo**: `src/utils/database-error.utils.ts`

Funciones:
- `handleDatabaseError(error)` - mapear errores MySQL
- `getDatabaseErrorMessage(code)` - mensajes legibles
- Mapear códigos comunes:
  - ER_DUP_ENTRY (1062) → 409 Conflict
  - ER_NO_REFERENCED_ROW (1216) → 400 Bad Request
  - ER_ROW_IS_REFERENCED (1217) → 409 Conflict

### Paso 4: Implementar validationMiddleware (30 min)

**Archivo**: `src/middlewares/validation.middleware.ts`

Características:
- Factory function: `validate(schema, source)`
- Source: 'body' | 'query' | 'params'
- Usar Zod para validación
- Responder con errores formateados

Uso:
```typescript
router.post('/',
  authMiddleware,
  validate(createClienteSchema, 'body'),
  createCliente
);
```

### Paso 5: Implementar paginationMiddleware (25 min)

**Archivo**: `src/middlewares/pagination.middleware.ts`

Características:
- Parsear `page` y `pageSize` de query
- Validar valores numéricos positivos
- Aplicar defaults y límites
- Calcular offset
- Agregar a `req.pagination`

### Paso 6: Actualizar errorHandlerMiddleware (30 min)

**Archivo**: `src/middlewares/error-handler.middleware.ts` (ya existe)

Mejoras:
- Integrar `handleDatabaseError()`
- Distinguir entre development/production
- Logging estructurado
- Soporte para custom error classes
- Formato de respuesta consistente

### Paso 7: Crear Tests Unitarios (60 min)

**Archivos**:
- `tests/middlewares/validation.middleware.test.ts`
- `tests/middlewares/pagination.middleware.test.ts`
- `tests/middlewares/error-handler.middleware.test.ts`
- `tests/utils/response.utils.test.ts`
- `tests/utils/database-error.utils.test.ts`

Cobertura:
- Casos exitosos
- Validaciones fallidas
- Límites y defaults
- Diferentes tipos de errores

### Paso 8: Aplicar a Endpoints Existentes (30 min)

Actualizar:
- `src/routes/clientes.routes.ts`
- `src/routes/ubicaciones.routes.ts`
- `src/routes/puestos.routes.ts`
- `src/routes/feriados.routes.ts`
- `src/routes/configuracion-turnos.routes.ts`
- `src/routes/incentivos.routes.ts`

### Paso 9: Documentación (20 min)

- Crear `docs/completed/T2.13_validaciones_middleware.md`
- Documentar uso de cada middleware
- Ejemplos de integración
- Actualizar estado de tarea

## Schemas de Validación Zod

Crear schemas para cada entidad:

```typescript
// src/schemas/clientes.schema.ts
import { z } from 'zod';

export const createClienteSchema = z.object({
  nombre: z.string().min(1).max(200),
  ruc: z.string().length(11).regex(/^\d{11}$/),
  activo: z.boolean().optional()
});

export const updateClienteSchema = createClienteSchema.partial();
```

## Formato de Respuestas Estandarizado

### Éxito con Datos

```json
{
  "success": true,
  "data": { ... }
}
```

### Éxito con Paginación

```json
{
  "success": true,
  "data": [...],
  "pagination": {
    "page": 1,
    "pageSize": 10,
    "total": 45,
    "totalPages": 5
  }
}
```

### Error de Validación

```json
{
  "success": false,
  "message": "Error de validación",
  "errors": [
    {
      "field": "nombre",
      "message": "El nombre es requerido"
    }
  ]
}
```

### Error de Base de Datos

```json
{
  "success": false,
  "message": "Ya existe un registro con ese código",
  "code": "DUPLICATE_ENTRY"
}
```

## Criterios de Aceptación

- [x] validationMiddleware implementado con Zod
- [x] paginationMiddleware con defaults y límites
- [x] errorHandlerMiddleware mejorado
- [x] Utilidades de respuesta creadas
- [x] Utilidades de database error creadas
- [x] Types de Express extendidos
- [x] Tests unitarios para cada middleware (>80% coverage)
- [x] Aplicado a todos los endpoints CRUD
- [x] Respuestas de error consistentes
- [x] Documentación completa

## Riesgos y Mitigaciones

### Riesgo 1: Cambios Breaking en Endpoints Existentes
**Probabilidad**: Media
**Impacto**: Alto
**Mitigación**: Aplicar middlewares gradualmente, mantener backward compatibility

### Riesgo 2: Performance con Validación Zod
**Probabilidad**: Baja
**Impacidad**: Medio
**Mitigación**: Zod es muy performante, pero monitorear tiempos de respuesta

### Riesgo 3: Errores No Capturados
**Probabilidad**: Media
**Impacto**: Alto
**Mitigación**: Agregar fallback genérico en errorHandler

## Notas de Implementación

- Usar Zod en lugar de Joi (más moderno, mejor TypeScript)
- Mantener consistencia con middlewares existentes (auth, role)
- No modificar comportamiento de endpoints, solo estandarizar
- Logging con diferentes niveles según tipo de error
- Stack traces solo en development

## Estimación de Tiempo

| Paso | Tiempo Estimado |
|------|----------------|
| 1. Types | 5 min |
| 2. Response Utils | 15 min |
| 3. Database Error Utils | 20 min |
| 4. Validation Middleware | 30 min |
| 5. Pagination Middleware | 25 min |
| 6. Error Handler | 30 min |
| 7. Tests | 60 min |
| 8. Aplicar a Endpoints | 30 min |
| 9. Documentación | 20 min |
| **TOTAL** | **3h 55min** |

## Resultado Esperado

Sistema con:
- Validación consistente en todos los endpoints
- Paginación estandarizada
- Manejo de errores robusto
- Respuestas uniformes
- Código mantenible y testeable
- Documentación clara para futuros desarrolladores

---

**Estado**: Listo para ejecutar
**Próximo Paso**: Implementar tipos y utilidades
