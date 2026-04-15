# Plan de Ejecución - T2.13: Validaciones y Middleware Común para CRUDs

**Tarea**: T2.13 - Implementar validaciones y middleware común para CRUDs
**Fecha de creación**: 2026-01-18
**Subagente**: Especialista en Middlewares y Validaciones
**Estimación**: 3-4 horas

---

## 1. ANÁLISIS DE LA SITUACIÓN ACTUAL

### Estado del Proyecto

**Tareas previas completadas**:
- ✅ T2.07 - CRUD Clientes
- ✅ T2.08 - CRUD Ubicaciones
- ✅ T2.09 - CRUD Puestos
- ✅ T2.10 - CRUD Feriados
- ✅ T2.11 - CRUD Configuración de Turnos
- ✅ T2.12 - CRUD Incentivos

**Observaciones del código existente**:

1. **Patrones de validación repetidos**:
   - Cada controller valida manualmente con `schema.safeParse()`
   - Respuestas de error con formato repetitivo (400, 404, 409, 500)
   - Código de validación duplicado en cada endpoint

2. **Paginación implementada pero no centralizada**:
   - Query params `page`, `pageSize`, `search` parseados en cada controller
   - Defaults hardcodeados (page=1, pageSize=20)
   - Max pageSize (100) validado en schemas

3. **Manejo de errores inconsistente**:
   - Errores logueados con `console.error()` en cada controller
   - Respuestas de error sin formato estándar
   - No hay manejo global de errores inesperados

4. **Helpers de validación ya existen**:
   - `formatZodErrors()` en schemas (pero se usa manualmente)
   - Schemas Zod bien estructurados

### Oportunidades de Mejora

1. **Middleware de validación genérico**: Un middleware que valide automáticamente body/query/params según schema
2. **Middleware de paginación**: Parsear y validar parámetros de paginación de forma centralizada
3. **Error handler global**: Catch all para errores no manejados y formateo consistente
4. **Utilidades de respuesta**: Builders para respuestas paginadas y manejo de errores SQL

---

## 2. OBJETIVOS DE LA TAREA

### Objetivos Principales

1. **Crear 3 middlewares reutilizables**:
   - `validation.middleware.ts`: Validación de requests con Zod
   - `pagination.middleware.ts`: Parseo de parámetros de paginación
   - `error-handler.middleware.ts`: Manejo global de errores

2. **Crear utilidades helper**:
   - `response.utils.ts`: Builders de respuestas y transformadores de errores

3. **Aplicar middlewares a endpoints existentes**:
   - Refactorizar al menos 2-3 CRUDs como ejemplo
   - Simplificar código de controllers

4. **Tests exhaustivos**:
   - Mínimo 25 tests unitarios
   - Tests de integración aplicados a endpoints

### Criterios de Aceptación

- [x] 3 middlewares creados y funcionando
- [x] Aplicados a endpoints CRUD existentes
- [x] Respuestas de error consistentes
- [x] 25+ tests unitarios
- [x] Documentación actualizada

---

## 3. DISEÑO DE LA SOLUCIÓN

### 3.1. Middleware de Validación

**Ubicación**: `backend/src/middlewares/validation.middleware.ts`

**Funcionalidad**:
```typescript
/**
 * Crea un middleware de validación para requests
 *
 * @param schema - Schema Zod para validación
 * @param source - Parte del request a validar ('body', 'query', 'params')
 * @returns Express middleware
 */
export function validateRequest(
  schema: z.ZodSchema,
  source: 'body' | 'query' | 'params' = 'body'
): RequestHandler;
```

**Características**:
- Valida automáticamente la parte especificada del request
- Si validación falla: responde 400 con errores formateados
- Si validación pasa: agrega datos validados a `req.validatedData` y llama `next()`
- Usa `formatZodErrors()` para formateo consistente

**Ejemplo de uso**:
```typescript
router.post(
  '/clientes',
  validateRequest(createClienteSchema, 'body'),
  clientesController.createCliente
);
```

---

### 3.2. Middleware de Paginación

**Ubicación**: `backend/src/middlewares/pagination.middleware.ts`

**Funcionalidad**:
```typescript
/**
 * Middleware para parsear parámetros de paginación
 *
 * Agrega a req.pagination:
 * - page: número de página (default: 1)
 * - pageSize: tamaño de página (default: 10)
 * - offset: offset para SQL (calculado)
 */
export const paginationMiddleware: RequestHandler;
```

**Características**:
- Parsea `page` y `pageSize` de query params
- Defaults: `page=1`, `pageSize=10`
- Max `pageSize`: 100
- Calcula `offset` automáticamente: `(page - 1) * pageSize`
- Valida que sean números positivos
- Agrega objeto `req.pagination` con datos procesados

**Ejemplo de uso**:
```typescript
router.get(
  '/clientes',
  paginationMiddleware,
  clientesController.getClientes
);

// En controller:
const { page, pageSize, offset } = req.pagination;
```

---

### 3.3. Middleware de Error Handler

**Ubicación**: `backend/src/middlewares/error-handler.middleware.ts`

**Funcionalidad**:
```typescript
/**
 * Error handler global para Express
 *
 * Debe ser el ÚLTIMO middleware en app.ts
 */
export const errorHandlerMiddleware: ErrorRequestHandler;
```

**Características**:
- Catch errores no manejados (throw en controllers)
- Formatear respuestas de error consistentes
- Diferenciar entre tipos de error:
  - ZodError → 400 Bad Request
  - Custom errors con `statusCode` → usar código específico
  - Otros errores → 500 Internal Server Error
- Log de errores con contexto (método, ruta, timestamp)
- **No exponer stack traces en producción** (solo en NODE_ENV=development)

**Formato de respuesta**:
```json
{
  "error": "Error type (string)",
  "message": "Error message (string)",
  "details": [...],  // Opcional (validaciones, etc.)
  "stack": "..."     // Solo en development
}
```

---

### 3.4. Utilidades de Respuesta

**Ubicación**: `backend/src/utils/response.utils.ts`

**Funciones a implementar**:

1. **buildPaginationResponse**:
```typescript
/**
 * Construye respuesta paginada estándar
 *
 * @param data - Array de datos
 * @param total - Total de registros
 * @param page - Página actual
 * @param pageSize - Tamaño de página
 * @returns Objeto con formato estándar
 */
export function buildPaginationResponse<T>(
  data: T[],
  total: number,
  page: number,
  pageSize: number
): PaginatedResponse<T>;

// Formato:
// {
//   data: T[],
//   total: number,
//   page: number,
//   pageSize: number,
//   totalPages: number
// }
```

2. **handleDatabaseError**:
```typescript
/**
 * Transforma errores SQL en errores de aplicación
 *
 * Detecta errores comunes:
 * - ER_DUP_ENTRY → ConflictError (409)
 * - ER_NO_REFERENCED_ROW → NotFoundError (404)
 * - ER_ROW_IS_REFERENCED → ConflictError (409)
 *
 * @param error - Error de MySQL
 * @returns Error transformado con statusCode
 */
export function handleDatabaseError(error: any): Error;
```

3. **Custom Error Classes**:
```typescript
export class NotFoundError extends Error {
  statusCode = 404;
  constructor(message: string) { ... }
}

export class ConflictError extends Error {
  statusCode = 409;
  constructor(message: string) { ... }
}

export class ValidationError extends Error {
  statusCode = 400;
  constructor(message: string) { ... }
}
```

---

## 4. PLAN DE IMPLEMENTACIÓN

### Fase 1: Crear Middlewares (1.5h)

**Tareas**:
1. Crear `validation.middleware.ts`:
   - Función `validateRequest(schema, source)`
   - Manejo de errores Zod
   - Agregar `req.validatedData`
   - Documentación JSDoc completa

2. Crear `pagination.middleware.ts`:
   - Parsear `page`, `pageSize` de query
   - Aplicar defaults y límites
   - Calcular offset
   - Agregar `req.pagination`
   - Documentación JSDoc completa

3. Crear `error-handler.middleware.ts`:
   - Catch errores globales
   - Formatear respuestas por tipo
   - Logging con contexto
   - Proteger stack traces en producción
   - Documentación JSDoc completa

4. Actualizar tipos TypeScript:
   - Extender `Express.Request` con `validatedData` y `pagination`
   - Archivo `express.d.ts` o en el middleware mismo

---

### Fase 2: Crear Utilidades (1h)

**Tareas**:
1. Crear `response.utils.ts`:
   - Función `buildPaginationResponse()`
   - Función `handleDatabaseError()`
   - Custom error classes (NotFoundError, ConflictError, ValidationError)
   - Tipos TypeScript para respuestas
   - Tests unitarios inline (opcional)

2. Documentación:
   - JSDoc completa
   - Ejemplos de uso
   - Tipos exportados

---

### Fase 3: Aplicar a Endpoints Existentes (1h)

**Endpoints a refactorizar (ejemplos)**:

1. **Clientes CRUD** (2-3 endpoints):
   - GET /api/clientes → usar `paginationMiddleware`
   - POST /api/clientes → usar `validateRequest(createClienteSchema)`
   - PUT /api/clientes/:id → usar `validateRequest(updateClienteSchema)`

2. **Usuarios CRUD** (2-3 endpoints):
   - GET /api/usuarios → usar `paginationMiddleware`
   - POST /api/usuarios → usar `validateRequest(createUsuarioSchema)`

3. **App.ts**:
   - Agregar `errorHandlerMiddleware` como último middleware

**Objetivo**: Simplificar código de controllers, eliminar validaciones manuales repetitivas

---

### Fase 4: Tests (1-1.5h)

**Tests Unitarios** (objetivo: 25+):

1. **validation.middleware.test.ts** (10-12 tests):
   - Validación exitosa (body, query, params)
   - Validación fallida (errores Zod)
   - Múltiples sources
   - Datos transformados correctamente

2. **pagination.middleware.test.ts** (8-10 tests):
   - Defaults aplicados correctamente
   - Parseo de page/pageSize
   - Límites validados (max pageSize)
   - Offset calculado correctamente
   - Valores inválidos rechazados

3. **error-handler.middleware.test.ts** (8-10 tests):
   - Errores 400, 404, 409, 500
   - ZodError formateado
   - Custom errors procesados
   - Stack trace oculto en producción
   - Logging funcionando

4. **response.utils.test.ts** (5-8 tests):
   - buildPaginationResponse formato correcto
   - handleDatabaseError transforma correctamente
   - Custom errors funcionan

**Tests de Integración** (5-8 tests):
- Endpoints refactorizados funcionan correctamente
- Validaciones aplicadas
- Paginación funcionando
- Errores formateados correctamente

---

## 5. ESTRUCTURA DE ARCHIVOS

```
backend/
├── src/
│   ├── middlewares/
│   │   ├── validation.middleware.ts       ← NUEVO
│   │   ├── pagination.middleware.ts       ← NUEVO
│   │   ├── error-handler.middleware.ts    ← NUEVO
│   │   ├── auth.middleware.ts             (existente)
│   │   ├── role.middleware.ts             (existente)
│   │   └── index.ts                       (actualizar exports)
│   ├── utils/
│   │   ├── response.utils.ts              ← NUEVO
│   │   └── index.ts                       ← NUEVO
│   ├── controllers/
│   │   ├── clientes.controller.ts         (refactorizar)
│   │   └── usuarios.controller.ts         (refactorizar)
│   ├── routes/
│   │   ├── clientes.routes.ts             (refactorizar)
│   │   └── usuarios.routes.ts             (refactorizar)
│   └── app.ts                             (agregar error handler)
└── tests/
    ├── middlewares/
    │   ├── validation.middleware.test.ts  ← NUEVO
    │   ├── pagination.middleware.test.ts  ← NUEVO
    │   └── error-handler.middleware.test.ts ← NUEVO
    ├── utils/
    │   └── response.utils.test.ts         ← NUEVO
    └── integration/
        └── crud-middleware.test.ts        ← NUEVO (opcional)
```

---

## 6. CONSIDERACIONES TÉCNICAS

### Extensión de tipos Express

Para agregar `req.validatedData` y `req.pagination`, necesitamos extender los tipos de Express:

**Opción 1: En el mismo middleware**
```typescript
// validation.middleware.ts
declare global {
  namespace Express {
    interface Request {
      validatedData?: any;
      pagination?: {
        page: number;
        pageSize: number;
        offset: number;
      };
    }
  }
}
```

**Opción 2: Archivo separado** (`src/types/express.d.ts`)
```typescript
import { Request } from 'express';

declare global {
  namespace Express {
    interface Request {
      validatedData?: any;
      pagination?: {
        page: number;
        pageSize: number;
        offset: number;
      };
    }
  }
}
```

### Orden de middlewares en app.ts

```typescript
// 1. Middlewares globales (cors, json, etc.)
app.use(cors());
app.use(express.json());

// 2. Rutas
app.use('/api/auth', authRoutes);
app.use('/api/usuarios', usuariosRoutes);
app.use('/api/clientes', clientesRoutes);
// ...

// 3. Error handler DEBE SER EL ÚLTIMO
app.use(errorHandlerMiddleware);
```

### Logging

Por ahora usaremos `console.error()` con formato mejorado. En T2.14 se implementará Winston/Pino.

Formato propuesto:
```typescript
console.error('[ERROR]', {
  timestamp: new Date().toISOString(),
  method: req.method,
  url: req.originalUrl,
  error: error.message,
  stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
});
```

---

## 7. RIESGOS Y MITIGACIONES

| Riesgo | Probabilidad | Impacto | Mitigación |
|--------|--------------|---------|------------|
| Romper endpoints existentes al refactorizar | Media | Alto | Ejecutar tests existentes después de cada cambio |
| Conflicto de tipos TypeScript | Baja | Medio | Revisar types de Express, usar `declare global` |
| Performance degradado por middlewares | Baja | Bajo | Middlewares ligeros, sin operaciones pesadas |
| Formato de error incompatible con frontend | Media | Medio | Mantener formato consistente con respuestas actuales |

---

## 8. VALIDACIONES Y PRUEBAS

### Casos de Prueba Críticos

**Validation Middleware**:
- ✓ Validación exitosa de body/query/params
- ✓ Errores Zod formateados correctamente
- ✓ Datos transformados (trim, uppercase, etc.)
- ✓ Multiple sources (body, query, params)

**Pagination Middleware**:
- ✓ Defaults aplicados (page=1, pageSize=10)
- ✓ Max pageSize respetado (100)
- ✓ Offset calculado correctamente
- ✓ Valores inválidos rechazados (negativos, strings, etc.)

**Error Handler**:
- ✓ ZodError → 400 con detalles
- ✓ NotFoundError → 404
- ✓ ConflictError → 409
- ✓ Generic Error → 500
- ✓ Stack trace solo en development

**Response Utils**:
- ✓ buildPaginationResponse calcula totalPages correctamente
- ✓ handleDatabaseError detecta ER_DUP_ENTRY
- ✓ Custom errors tienen statusCode correcto

---

## 9. DOCUMENTACIÓN A GENERAR

**Archivo de Resultado**: `docs/completed/T2.13_validaciones_middleware.md`

**Contenido**:
1. Resumen de la tarea
2. Middlewares creados (3):
   - validation.middleware.ts
   - pagination.middleware.ts
   - error-handler.middleware.ts
3. Utilidades creadas:
   - response.utils.ts (funciones y classes)
4. Ejemplos de uso:
   - Antes y después de refactorizar
   - Simplificación de código
5. Tests:
   - Cantidad de tests (desglose por archivo)
   - Resultados de ejecución
   - Cobertura (si disponible)
6. Endpoints refactorizados:
   - Lista de endpoints actualizados
   - Beneficios obtenidos
7. Próximos pasos:
   - Aplicar a todos los CRUDs restantes
   - Considerar logging avanzado (T2.14)

---

## 10. ESTIMACIÓN DE TIEMPO

| Fase | Tareas | Tiempo Estimado |
|------|--------|-----------------|
| 1. Crear Middlewares | validation, pagination, error-handler | 1.5h |
| 2. Crear Utilidades | response.utils.ts, custom errors | 1h |
| 3. Aplicar a Endpoints | Refactorizar 2-3 CRUDs, app.ts | 1h |
| 4. Tests | 25+ tests unitarios + integración | 1.5h |
| 5. Documentación | Archivo resultado completo | 0.5h |
| **TOTAL** | | **5.5h** |

**Estimación oficial**: 3-4 horas (optimista)
**Estimación realista**: 5-6 horas (con pruebas exhaustivas)

---

## 11. CHECKLIST DE EJECUCIÓN

### Pre-implementación
- [x] Leer especificaciones de T2.13
- [x] Analizar código existente (CRUDs implementados)
- [x] Identificar patrones comunes
- [x] Diseñar API de middlewares
- [x] Crear plan de ejecución

### Implementación
- [ ] Crear `validation.middleware.ts`
- [ ] Crear `pagination.middleware.ts`
- [ ] Crear `error-handler.middleware.ts`
- [ ] Crear `response.utils.ts`
- [ ] Extender tipos Express (req.validatedData, req.pagination)
- [ ] Refactorizar clientes.routes.ts
- [ ] Refactorizar clientes.controller.ts
- [ ] Refactorizar usuarios.routes.ts (opcional)
- [ ] Agregar error-handler a app.ts

### Testing
- [ ] Tests unitarios validation.middleware (10+ tests)
- [ ] Tests unitarios pagination.middleware (8+ tests)
- [ ] Tests unitarios error-handler.middleware (8+ tests)
- [ ] Tests unitarios response.utils (5+ tests)
- [ ] Tests de integración (endpoints refactorizados)
- [ ] Ejecutar tests existentes (regresión)
- [ ] Verificar 25+ tests pasando

### Documentación
- [ ] JSDoc completo en todos los middlewares
- [ ] Ejemplos de uso en comentarios
- [ ] Crear `docs/completed/T2.13_validaciones_middleware.md`
- [ ] Registrar cantidad de tests y tiempo invertido
- [ ] Actualizar README (opcional)

### Validación Final
- [ ] Todos los tests pasando (25+)
- [ ] Endpoints refactorizados funcionando
- [ ] Respuestas de error consistentes
- [ ] No hay regresiones en tests existentes
- [ ] Documentación completa

---

## 12. CRITERIOS DE ÉXITO

✅ **La tarea se considerará exitosa si**:

1. Se crean 3 middlewares funcionando correctamente
2. Se crean utilidades de respuesta (buildPaginationResponse, handleDatabaseError)
3. Al menos 2-3 CRUDs refactorizados usan los nuevos middlewares
4. Respuestas de error son consistentes en toda la API
5. Mínimo 25 tests unitarios pasando
6. Tests de integración verifican endpoints refactorizados
7. No hay regresiones en tests existentes
8. Documentación completa generada

---

**Última actualización**: 2026-01-18
**Estado**: Plan aprobado - Listo para implementación
**Siguiente paso**: Fase 1 - Crear Middlewares
