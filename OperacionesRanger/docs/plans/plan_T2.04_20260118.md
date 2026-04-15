# Plan: T2.04 - Implementar Middleware de Autenticación y Autorización

**Fecha**: 2026-01-18
**Tarea padre**: T2.04
**Fase**: Fase 2 - Backend Core
**Estimación**: 3-4 horas

---

## Objetivo

Crear middlewares de Express para proteger rutas mediante autenticación JWT y verificar permisos basados en roles (ADMIN, SUPERVISOR, CONSULTA). Los middlewares deben validar tokens, extraer información del usuario, y controlar el acceso según el rol.

---

## Contexto

### Archivos existentes relevantes:
- `backend/src/models/auth.model.ts`: Define interfaces JWTPayload, UserRole, constantes
- `backend/src/services/jwt.service.ts`: Proporciona `verifyAccessToken()` para validar tokens
- `backend/src/config/env.ts`: Configuración de variables de entorno
- `docs/decisions/002_estrategia_autenticacion.md`: Estrategia de autenticación JWT

### Decisiones previas:
- **ADR-002**: Autenticación con JWT (Access Tokens de 30 min, Refresh Tokens de 7 días)
- **T2.01 ✓**: Modelos de autenticación creados
- **T2.02 ✓**: Servicios de hashing y JWT implementados (51 tests pasando)
- **T2.03 [→]**: Endpoints de autenticación (en progreso en PARALELO - otro subagente)

### Roles del sistema:
- **ADMIN**: Control total
- **SUPERVISOR**: Operaciones diarias, gestión de turnos
- **CONSULTA**: Solo lectura

### Estrategia de tokens:
- Access Token en header `Authorization: Bearer <token>`
- Validación con `JWTService.verifyAccessToken(token)`
- Payload contiene: `{ sub, username, rol, iat, exp }`

---

## Subtareas

### 1. Crear tipos de Express para req.user
- **Descripción**: Extender la interfaz Request de Express para incluir el campo `user` con tipo JWTPayload
- **Archivos a crear**: `backend/src/types/express.d.ts`
- **Resultado esperado**: TypeScript reconoce `req.user` como `JWTPayload | undefined`

### 2. Implementar authMiddleware
- **Descripción**: Middleware que verifica presencia y validez del token JWT en el header Authorization
- **Archivos a crear**: `backend/src/middlewares/auth.middleware.ts`
- **Lógica**:
  1. Extraer header `Authorization`
  2. Validar formato `Bearer <token>`
  3. Extraer token
  4. Validar con `JWTService.verifyAccessToken()`
  5. Si válido: agregar payload a `req.user` y llamar `next()`
  6. Si inválido: responder 401 Unauthorized
- **Manejo de errores**:
  - Sin header: 401 "Token no proporcionado"
  - Formato inválido: 401 "Formato de token inválido"
  - Token inválido/expirado: 401 "Token inválido o expirado"
- **Logging**: console.debug para errores (no exponer detalles en producción)
- **Resultado esperado**: Middleware funcional que protege rutas

### 3. Implementar roleMiddleware (requireRole)
- **Descripción**: Factory function que retorna middleware para verificar que el usuario tenga uno de los roles permitidos
- **Archivos a crear**: `backend/src/middlewares/role.middleware.ts`
- **Lógica**:
  1. Verificar que `req.user` existe (debe ejecutarse DESPUÉS de authMiddleware)
  2. Verificar que `req.user.rol` está en la lista de roles permitidos
  3. Si tiene permiso: llamar `next()`
  4. Si no tiene permiso: responder 403 Forbidden
- **Signature**: `requireRole(...roles: UserRole[]): RequestHandler`
- **Ejemplo de uso**:
  ```typescript
  router.get('/usuarios', authMiddleware, requireRole('ADMIN'), getUsuarios);
  router.get('/turnos', authMiddleware, requireRole('ADMIN', 'SUPERVISOR', 'CONSULTA'), getTurnos);
  ```
- **Manejo de errores**:
  - Sin req.user: 401 "Usuario no autenticado" (failsafe, no debería ocurrir)
  - Sin permiso: 403 "Acceso denegado. Rol requerido: [ADMIN, SUPERVISOR]"
- **Resultado esperado**: Middleware factory funcional que controla acceso por rol

### 4. Crear barrel export para middlewares
- **Descripción**: Crear index.ts para exportar todos los middlewares
- **Archivos a crear**: `backend/src/middlewares/index.ts`
- **Resultado esperado**: Importación simplificada `import { authMiddleware, requireRole } from './middlewares'`

### 5. Escribir tests unitarios para authMiddleware
- **Descripción**: Suite de tests para authMiddleware usando Jest y mocks de Express
- **Archivos a crear**: `backend/tests/middlewares/auth.middleware.test.ts`
- **Casos de prueba** (mínimo 8):
  1. Token válido → agrega req.user y llama next()
  2. Sin header Authorization → 401
  3. Header sin "Bearer" → 401
  4. Token vacío → 401
  5. Token con formato inválido → 401
  6. Token expirado → 401
  7. Token con firma inválida → 401
  8. Header con espacios extras → manejo correcto
- **Mocks**: Mock de JWTService.verifyAccessToken()
- **Resultado esperado**: 8+ tests pasando

### 6. Escribir tests unitarios para roleMiddleware
- **Descripción**: Suite de tests para requireRole usando Jest y mocks de Express
- **Archivos a crear**: `backend/tests/middlewares/role.middleware.test.ts`
- **Casos de prueba** (mínimo 7):
  1. Usuario con rol ADMIN accediendo a ruta ADMIN → next()
  2. Usuario con rol SUPERVISOR accediendo a ruta [ADMIN, SUPERVISOR] → next()
  3. Usuario con rol CONSULTA accediendo a ruta ADMIN → 403
  4. Usuario sin req.user → 401
  5. Múltiples roles permitidos → verifica correctamente
  6. Rol inexistente → 403
  7. Array vacío de roles → 403
- **Resultado esperado**: 7+ tests pasando

### 7. Documentar middlewares con JSDoc
- **Descripción**: Agregar documentación JSDoc completa a ambos middlewares
- **Elementos a documentar**:
  - Descripción del middleware
  - Parámetros (si aplica)
  - Retorno
  - Ejemplos de uso
  - Errores que puede lanzar (respuestas HTTP)
- **Resultado esperado**: Documentación clara y completa

### 8. Validar integración con proyecto existente
- **Descripción**: Verificar que los middlewares funcionan correctamente con el setup de Express
- **Comando**: `npm run build` (compilar TypeScript)
- **Validaciones**:
  - Sin errores de TypeScript
  - Tipos correctamente inferidos
  - Imports funcionando
- **Resultado esperado**: Compilación exitosa sin errores

---

## Criterios de Aceptación (checklist)

- [ ] authMiddleware funciona correctamente
  - [ ] Extrae token del header Authorization
  - [ ] Valida formato Bearer <token>
  - [ ] Verifica token con JWTService
  - [ ] Agrega payload a req.user
  - [ ] Responde 401 en casos de error
- [ ] roleMiddleware valida permisos según rol
  - [ ] Verifica que req.user existe
  - [ ] Valida que rol está en lista permitida
  - [ ] Responde 403 si no tiene permiso
  - [ ] Acepta múltiples roles
- [ ] Respuestas de error claras (401 para auth, 403 para roles)
- [ ] req.user correctamente tipado (TypeScript)
- [ ] Tests unitarios para cada middleware (>15 casos de prueba total)
- [ ] Manejo de errores robusto
- [ ] Documentación JSDoc completa
- [ ] Compilación de TypeScript exitosa
- [ ] Exports organizados en barrel file

---

## Archivos a Generar

- `backend/src/types/express.d.ts` - Extensión de tipos Express
- `backend/src/middlewares/auth.middleware.ts` - Middleware de autenticación
- `backend/src/middlewares/role.middleware.ts` - Middleware de autorización por roles
- `backend/src/middlewares/index.ts` - Barrel export
- `backend/tests/middlewares/auth.middleware.test.ts` - Tests de authMiddleware
- `backend/tests/middlewares/role.middleware.test.ts` - Tests de roleMiddleware

---

## Riesgos y Consideraciones

### Riesgo 1: Conflicto de archivos con T2.03 (ejecutándose en paralelo)
- **Descripción**: El otro subagente (T2.03) está implementando endpoints de autenticación en paralelo
- **Mitigación**:
  - Este subagente NO debe modificar archivos de controllers/, routes/, services/auth.service.ts
  - Solo trabajar en middlewares/, types/, tests/middlewares/
  - Los archivos son completamente independientes
  - Verificar que T2.03 no modifique express.d.ts

### Riesgo 2: Dependencia de JWTService
- **Descripción**: authMiddleware depende de JWTService.verifyAccessToken()
- **Mitigación**:
  - JWTService ya está implementado y testeado (T2.02 ✓)
  - Usar mocks en tests unitarios
  - Validar imports correctamente

### Riesgo 3: Tipos de Express
- **Descripción**: Extender tipos de Express puede causar conflictos de tipos
- **Mitigación**:
  - Usar declaration merging de TypeScript correctamente
  - Declarar en namespace global
  - Verificar que tsconfig.json incluye types/

### Riesgo 4: Orden de ejecución de middlewares
- **Descripción**: roleMiddleware DEBE ejecutarse DESPUÉS de authMiddleware
- **Mitigación**:
  - Documentar claramente el orden requerido
  - Agregar verificación en roleMiddleware (if !req.user → error)
  - Ejemplos de uso en JSDoc

---

## Notas Adicionales

### Diferencias con Ranger Nomina (sistema relacionado):
- Este sistema usa TRES roles (ADMIN, SUPERVISOR, CONSULTA)
- Ranger Nomina usa niveles numéricos (nivel 9 = admin)
- Mismo patrón de JWT en header Authorization
- Lógica de middleware similar pero adaptada

### Testing:
- Usar Jest (ya configurado en backend)
- Mock de Request, Response, NextFunction de Express
- Mock de JWTService
- Cobertura objetivo: >90% en middlewares (código crítico de seguridad)

### Seguridad:
- NO exponer detalles del error en respuestas (solo en logs)
- Usar console.debug (no console.error) para no llenar logs en producción
- Validar que tokens expirados sean rechazados correctamente
- Verificar que roles inexistentes sean rechazados

### Compatibilidad:
- Compatible con Express 4.x
- Compatible con TypeScript 5.x
- No requiere dependencias adicionales (solo las ya instaladas)

---

## Dependencias

**Bloqueantes** (deben estar completadas):
- [✓] T2.01 - Modelos de autenticación
- [✓] T2.02 - Servicio de hashing y JWT

**No bloqueantes** (pueden ejecutarse en paralelo):
- [→] T2.03 - Endpoints de autenticación (EN PROGRESO en otro subagente)

**Dependientes** (esperan esta tarea):
- [ ] T2.05 - CRUD de usuarios (necesita authMiddleware y requireRole)
- [ ] Todas las tareas de Módulo 2 (CRUDs de maestros)
- [ ] Todas las tareas de Módulo 3, 4, 5 (requieren protección de rutas)

---

## Estimación de Tiempo por Subtarea

1. Tipos Express: 15 min
2. authMiddleware: 45 min
3. roleMiddleware: 30 min
4. Barrel export: 5 min
5. Tests authMiddleware: 60 min
6. Tests roleMiddleware: 45 min
7. Documentación JSDoc: 20 min
8. Validación integración: 10 min

**Total estimado**: 3 horas 30 minutos (dentro del rango 3-4h)

---

## Estrategia de Ejecución

1. **Setup inicial** (Subtarea 1): Crear tipos Express primero (base para todo)
2. **Implementación core** (Subtareas 2-3): Crear ambos middlewares
3. **Organización** (Subtarea 4): Barrel export
4. **Testing** (Subtareas 5-6): Tests completos de ambos middlewares
5. **Documentación** (Subtarea 7): JSDoc
6. **Validación final** (Subtarea 8): Compilación y verificación

---

**Inicio de ejecución**: Inmediato
**Tiempo estimado**: 3-4 horas
**Prioridad**: Alta
**Estado**: Listo para comenzar
