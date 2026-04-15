# Plan: T2.03 - Implementar endpoints de autenticación

**Fecha**: 2026-01-18
**Tarea padre**: T2.03
**Fase**: Fase 2 - Backend Core
**Estimación**: 4-5 horas

---

## Objetivo

Implementar los 4 endpoints REST para autenticación (login, logout, refresh token, cambio de password) con lógica completa de negocio, validación de inputs, auditoría de acciones, y manejo de refresh tokens en base de datos.

---

## Contexto

### Contexto Previo
- **T2.01 Completada**: Modelos TypeScript, interfaces y schemas de BD creados
  - Interfaces: `Usuario`, `RefreshToken`, `AuditoriaAuth`
  - DTOs: `LoginDTO`, `LoginResponseDTO`, `RefreshTokenDTO`, etc.
  - Schemas Zod completos en `backend/src/schemas/auth.schema.ts`

- **T2.02 Completada**: Servicios de hashing y JWT implementados
  - `password.service.ts`: `hashPassword()`, `verifyPassword()`
  - `jwt.service.ts`: `generateAccessToken()`, `generateRefreshToken()`, `verifyAccessToken()`, `verifyRefreshToken()`
  - 51 tests pasando con ~95% cobertura

### Arquitectura de Autenticación (ADR-002)
- **Estrategia**: JWT con Refresh Tokens
- **Access Token**: Corta duración (30 minutos), contiene información del usuario
- **Refresh Token**: Larga duración (7 días), almacenado hasheado en BD
- **Auditoría**: Todos los eventos de autenticación registrados en `sys_auditoria_auth`

### Estructura de BD Disponible
Tablas creadas en T2.01:
- `sys_usuarios`: Usuarios del sistema con credenciales
- `sys_refresh_tokens`: Tokens de larga duración (hash SHA-256)
- `sys_auditoria_auth`: Registro de eventos de autenticación

### Archivos Existentes a Utilizar
- `backend/src/models/auth.model.ts`: Interfaces y DTOs
- `backend/src/schemas/auth.schema.ts`: Schemas de validación Zod
- `backend/src/services/password.service.ts`: Hashing de contraseñas
- `backend/src/services/jwt.service.ts`: Generación y verificación de tokens
- `backend/src/config/database.ts`: Pool de conexión a BD principal
- `backend/src/config/env.ts`: Variables de entorno

---

## Subtareas

### 1. Crear servicio de autenticación (auth.service.ts)
**Descripción**: Implementar lógica de negocio para login, logout, refresh y cambio de password.

**Archivos a crear/modificar**:
- `backend/src/services/auth.service.ts` (CREAR)

**Funciones del servicio**:

#### 1.1. `login(username: string, password: string, ip?: string, userAgent?: string): Promise<LoginResponseDTO>`
- Buscar usuario por username en `sys_usuarios`
- Validar que usuario exista y esté activo
- Verificar que no esté bloqueado temporalmente (campo `bloqueado_hasta`)
- Comparar password con `password_hash` usando `password.service.verifyPassword()`
- Si password es incorrecto:
  - Incrementar `intentos_fallidos`
  - Si alcanza 5 intentos, bloquear por 15 minutos (`bloqueado_hasta`)
  - Registrar auditoría `LOGIN_FAILED`
  - Lanzar error 401
- Si password es correcto:
  - Resetear `intentos_fallidos` a 0
  - Actualizar `ultimo_login` con timestamp actual
  - Generar access token con `jwt.service.generateAccessToken()`
  - Generar refresh token con `jwt.service.generateRefreshToken()`
  - Hashear refresh token (SHA-256) y almacenar en `sys_refresh_tokens`
  - Registrar auditoría `LOGIN_SUCCESS`
  - Retornar `{ accessToken, refreshToken, user: UserSafeDTO }`

#### 1.2. `refreshAccessToken(refreshToken: string): Promise<{ accessToken: string }>`
- Verificar firma y expiración del refresh token con `jwt.service.verifyRefreshToken()`
- Hashear refresh token recibido (SHA-256)
- Buscar token en `sys_refresh_tokens` por `token_hash`
- Validar que token:
  - Exista en BD
  - No esté revocado (`revocado = false`)
  - No esté expirado (`fecha_expiracion > NOW()`)
- Obtener usuario asociado (`id_usuario`)
- Validar que usuario siga activo
- Generar nuevo access token con `jwt.service.generateAccessToken()`
- Registrar auditoría `TOKEN_REFRESH`
- Retornar `{ accessToken }`

#### 1.3. `logout(refreshToken: string, userId: number): Promise<void>`
- Hashear refresh token (SHA-256)
- Buscar token en `sys_refresh_tokens`
- Marcar como revocado: `UPDATE sys_refresh_tokens SET revocado = true, fecha_revocacion = NOW() WHERE token_hash = ?`
- Registrar auditoría `LOGOUT`
- Retornar sin error

#### 1.4. `changePassword(userId: number, currentPassword: string, newPassword: string): Promise<void>`
- Buscar usuario por `id_usuario`
- Verificar password actual con `password.service.verifyPassword()`
- Si password actual es incorrecto, lanzar error 401
- Validar que nueva password cumple requisitos (delegado a schema Zod)
- Hashear nueva password con `password.service.hashPassword()`
- Actualizar `password_hash` en `sys_usuarios`
- Actualizar `fecha_modificacion`
- Registrar auditoría `PASSWORD_CHANGE`
- Retornar sin error

#### 1.5. `createAuditLog(auditData: CreateAuditoriaDTO): Promise<void>`
- Helper interno para registrar eventos en `sys_auditoria_auth`
- `INSERT INTO sys_auditoria_auth (id_usuario, username, evento, ip_address, user_agent, detalles, fecha_evento)`
- Convertir `detalles` a JSON string si es objeto

**Resultado esperado**:
- Servicio completo con 5 funciones implementadas
- Manejo de transacciones donde sea necesario
- Manejo robusto de errores con tipos específicos

---

### 2. Crear controlador de autenticación (auth.controller.ts)
**Descripción**: Implementar controllers para los 4 endpoints HTTP.

**Archivos a crear/modificar**:
- `backend/src/controllers/auth.controller.ts` (CREAR)

**Funciones del controller**:

#### 2.1. `loginController(req: Request, res: Response, next: NextFunction)`
- Validar body con `loginSchema` usando Zod
- Extraer `{ username, password }` del body validado
- Extraer IP del request: `req.ip` o `req.headers['x-forwarded-for']`
- Extraer User-Agent: `req.headers['user-agent']`
- Llamar a `auth.service.login(username, password, ip, userAgent)`
- Si éxito:
  - Responder `200 OK` con `{ accessToken, refreshToken, user }`
- Si error:
  - Capturar error y pasar a middleware de manejo de errores
  - Errores esperados: 401 (credenciales inválidas), 403 (usuario bloqueado)

#### 2.2. `refreshTokenController(req: Request, res: Response, next: NextFunction)`
- Validar body con `refreshTokenSchema`
- Extraer `{ refreshToken }` del body validado
- Llamar a `auth.service.refreshAccessToken(refreshToken)`
- Si éxito:
  - Responder `200 OK` con `{ accessToken }`
- Si error:
  - Errores esperados: 401 (token inválido o expirado)

#### 2.3. `logoutController(req: Request, res: Response, next: NextFunction)`
- **Prerequisito**: Middleware `authMiddleware` debe haber ejecutado (req.user existe)
- Validar body con `logoutSchema`
- Extraer `{ refreshToken }` del body
- Extraer `userId` de `req.user.sub` (agregado por middleware auth)
- Llamar a `auth.service.logout(refreshToken, userId)`
- Responder `200 OK` con `{ message: "Logout exitoso" }`

#### 2.4. `changePasswordController(req: Request, res: Response, next: NextFunction)`
- **Prerequisito**: Middleware `authMiddleware` debe haber ejecutado
- Validar body con `changePasswordSchema`
- Extraer `{ currentPassword, newPassword }` del body validado
- Extraer `userId` de `req.user.sub`
- Llamar a `auth.service.changePassword(userId, currentPassword, newPassword)`
- Responder `200 OK` con `{ message: "Contraseña actualizada exitosamente" }`

**Resultado esperado**:
- 4 controllers implementados
- Validación de inputs con Zod antes de llamar servicios
- Respuestas HTTP consistentes
- Errores propagados al middleware de manejo de errores

---

### 3. Crear rutas de autenticación (auth.routes.ts)
**Descripción**: Definir rutas HTTP para los endpoints de autenticación.

**Archivos a crear/modificar**:
- `backend/src/routes/auth.routes.ts` (CREAR)

**Rutas a definir**:

```typescript
import { Router } from 'express';
import * as authController from '../controllers/auth.controller';
// Importar middleware de validación (si se crea)
// Importar authMiddleware (si existe, para logout y changePassword)

const router = Router();

/**
 * POST /api/auth/login
 * Body: { username: string, password: string }
 * Response: { accessToken, refreshToken, user }
 * Público (sin autenticación)
 */
router.post('/login', authController.loginController);

/**
 * POST /api/auth/refresh
 * Body: { refreshToken: string }
 * Response: { accessToken: string }
 * Público (sin autenticación)
 */
router.post('/refresh', authController.refreshTokenController);

/**
 * POST /api/auth/logout
 * Headers: Authorization: Bearer <accessToken>
 * Body: { refreshToken: string }
 * Response: { message: string }
 * Requiere autenticación (middleware authMiddleware)
 *
 * NOTA: Si authMiddleware NO está disponible (T2.04 pendiente),
 * implementar versión sin middleware y marcar como TODO
 */
router.post('/logout', /* authMiddleware si disponible, */ authController.logoutController);

/**
 * POST /api/auth/change-password
 * Headers: Authorization: Bearer <accessToken>
 * Body: { currentPassword: string, newPassword: string }
 * Response: { message: string }
 * Requiere autenticación
 */
router.post('/change-password', /* authMiddleware si disponible, */ authController.changePasswordController);

export default router;
```

**Consideración importante**:
- T2.04 (middleware de autenticación) se está ejecutando EN PARALELO
- Si `authMiddleware` NO está disponible al momento de implementar:
  - Implementar rutas sin middleware
  - Agregar comentario `// TODO: Agregar authMiddleware cuando T2.04 complete`
  - Los endpoints `/logout` y `/change-password` NO funcionarán sin `req.user`
  - Opción temporal: Extraer `userId` del body (INSEGURO, solo para testing)

**Resultado esperado**:
- Archivo de rutas completo
- 4 rutas REST configuradas
- Exportación default del router
- Comentarios claros sobre dependencias de T2.04

---

### 4. Integrar rutas en servidor principal
**Descripción**: Registrar rutas de autenticación en el servidor Express.

**Archivos a modificar**:
- `backend/src/server.ts` o `backend/src/index.ts` (el archivo principal del servidor)

**Cambios a realizar**:
```typescript
import authRoutes from './routes/auth.routes';

// ... configuración de Express ...

// Registrar rutas de autenticación
app.use('/api/auth', authRoutes);

// ... otras rutas ...
```

**Resultado esperado**:
- Rutas accesibles en `http://localhost:3333/api/auth/login`, etc.
- Servidor compila sin errores

---

### 5. Crear tests de integración (auth.test.ts)
**Descripción**: Crear suite de tests de integración usando Supertest para probar todos los endpoints.

**Archivos a crear**:
- `backend/tests/integration/auth.test.ts` (CREAR)

**Casos de prueba a implementar** (mínimo 10):

#### Setup y Teardown
- `beforeAll()`: Crear usuario de prueba en BD
- `afterAll()`: Limpiar BD (eliminar usuario, tokens, auditoría de prueba)

#### Tests de Login
1. **Login exitoso con credenciales válidas**
   - POST /api/auth/login con credenciales correctas
   - Esperar 200 OK
   - Validar que respuesta incluya `accessToken`, `refreshToken`, `user`
   - Validar que `user` NO incluya `password_hash`
   - Validar que refresh token esté en BD (tabla `sys_refresh_tokens`)
   - Validar auditoría `LOGIN_SUCCESS`

2. **Login fallido con password incorrecto**
   - POST /api/auth/login con password incorrecto
   - Esperar 401 Unauthorized
   - Validar mensaje de error claro
   - Validar que `intentos_fallidos` incrementó en BD
   - Validar auditoría `LOGIN_FAILED`

3. **Login fallido con usuario inexistente**
   - POST /api/auth/login con username que no existe
   - Esperar 401 Unauthorized
   - Validar que NO se revele si el usuario existe o no (mensaje genérico)

4. **Login bloqueado por múltiples intentos fallidos**
   - Hacer 5 intentos fallidos consecutivos
   - Intentar login con credenciales correctas
   - Esperar 403 Forbidden
   - Validar mensaje sobre bloqueo temporal
   - Validar campo `bloqueado_hasta` en BD

5. **Validación de inputs en login**
   - POST /api/auth/login con body vacío
   - Esperar 400 Bad Request
   - Validar errores de validación Zod

#### Tests de Refresh Token
6. **Refresh token exitoso**
   - Hacer login para obtener refresh token
   - POST /api/auth/refresh con refresh token válido
   - Esperar 200 OK
   - Validar que respuesta incluya nuevo `accessToken`
   - Validar auditoría `TOKEN_REFRESH`

7. **Refresh token inválido**
   - POST /api/auth/refresh con token falso
   - Esperar 401 Unauthorized

8. **Refresh token revocado**
   - Hacer login, obtener refresh token
   - Revocar token manualmente en BD
   - POST /api/auth/refresh con token revocado
   - Esperar 401 Unauthorized

#### Tests de Logout
9. **Logout exitoso**
   - Hacer login para obtener tokens
   - POST /api/auth/logout con refresh token (y access token en header si middleware disponible)
   - Esperar 200 OK
   - Validar que refresh token esté marcado como revocado en BD
   - Validar auditoría `LOGOUT`

#### Tests de Change Password
10. **Cambio de password exitoso**
    - Hacer login para obtener access token
    - POST /api/auth/change-password con password actual y nueva
    - Esperar 200 OK
    - Validar que `password_hash` cambió en BD
    - Validar que login con nueva password funciona
    - Validar auditoría `PASSWORD_CHANGE`

11. **Cambio de password con password actual incorrecta**
    - POST /api/auth/change-password con password actual incorrecta
    - Esperar 401 Unauthorized

12. **Cambio de password con nueva password inválida**
    - POST /api/auth/change-password con nueva password débil (< 8 chars)
    - Esperar 400 Bad Request
    - Validar errores de validación Zod

**Configuración de tests**:
- Usar base de datos de prueba separada (configurar en `.env.test`)
- Mock de servicios externos (si aplica)
- Cleanup completo entre tests

**Resultado esperado**:
- Mínimo 12 tests de integración
- Todos los tests pasando
- Cobertura de casos exitosos y errores
- Validación de respuestas HTTP y estados de BD

---

### 6. Crear middleware de validación (OPCIONAL)
**Descripción**: Crear middleware genérico para validación con Zod (opcional, puede hacerse inline en controllers).

**Archivos a crear** (OPCIONAL):
- `backend/src/middlewares/validate.middleware.ts`

**Función**:
```typescript
import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';

export function validate(schema: z.ZodSchema) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      req.body = await schema.parseAsync(req.body);
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          error: 'Validación fallida',
          errors: error.errors.map(e => ({
            field: e.path.join('.'),
            message: e.message
          }))
        });
      }
      next(error);
    }
  };
}
```

**Uso**:
```typescript
router.post('/login', validate(loginSchema), authController.loginController);
```

**Resultado esperado**:
- Middleware reutilizable creado (OPCIONAL)
- Si no se crea, validación se hace inline en controllers

---

## Archivos a Generar

### Archivos nuevos a crear:
1. `backend/src/services/auth.service.ts` - Lógica de negocio de autenticación
2. `backend/src/controllers/auth.controller.ts` - Controllers HTTP
3. `backend/src/routes/auth.routes.ts` - Definición de rutas
4. `backend/tests/integration/auth.test.ts` - Tests de integración
5. `backend/src/middlewares/validate.middleware.ts` - Middleware de validación (OPCIONAL)

### Archivos a modificar:
1. `backend/src/server.ts` (o `index.ts`) - Registrar rutas de autenticación

---

## Criterios de Aceptación (Checklist)

- [ ] **Servicio de autenticación** (`auth.service.ts`) creado con 5 funciones
  - [ ] `login()` implementado con validación de credenciales y bloqueo por intentos
  - [ ] `refreshAccessToken()` implementado con validación de token en BD
  - [ ] `logout()` implementado con revocación de refresh token
  - [ ] `changePassword()` implementado con verificación de password actual
  - [ ] `createAuditLog()` implementado para auditoría

- [ ] **Controllers** (`auth.controller.ts`) creados para 4 endpoints
  - [ ] `loginController` con validación Zod
  - [ ] `refreshTokenController` con validación Zod
  - [ ] `logoutController` (con o sin middleware auth)
  - [ ] `changePasswordController` (con o sin middleware auth)

- [ ] **Rutas** (`auth.routes.ts`) definidas y registradas
  - [ ] POST /api/auth/login
  - [ ] POST /api/auth/refresh
  - [ ] POST /api/auth/logout
  - [ ] POST /api/auth/change-password
  - [ ] Rutas integradas en servidor principal

- [ ] **Validación de inputs** con Zod schemas
  - [ ] Todos los endpoints validan body antes de procesar
  - [ ] Errores de validación retornan 400 con mensajes claros

- [ ] **Auditoría** de acciones implementada
  - [ ] Login exitoso registrado en `sys_auditoria_auth`
  - [ ] Login fallido registrado
  - [ ] Logout registrado
  - [ ] Cambio de password registrado
  - [ ] Refresh token registrado

- [ ] **Manejo de refresh tokens** en BD
  - [ ] Tokens almacenados hasheados (SHA-256) en `sys_refresh_tokens`
  - [ ] Verificación de revocación implementada
  - [ ] Revocación al logout implementada

- [ ] **Respuestas HTTP apropiadas**
  - [ ] 200 OK para operaciones exitosas
  - [ ] 400 Bad Request para validación fallida
  - [ ] 401 Unauthorized para credenciales inválidas
  - [ ] 403 Forbidden para usuario bloqueado

- [ ] **Tests de integración** con Supertest
  - [ ] Mínimo 12 tests implementados
  - [ ] Todos los tests pasando
  - [ ] Coverage de casos exitosos y errores
  - [ ] Validación de estados de BD (tokens, auditoría)

- [ ] **Manejo robusto de errores**
  - [ ] Errores específicos lanzados con códigos HTTP correctos
  - [ ] Stack traces NO expuestos en respuestas (solo en desarrollo)
  - [ ] Logging de errores implementado

- [ ] **Integración con BD funcionando**
  - [ ] Queries a `sys_usuarios` funcionando
  - [ ] Queries a `sys_refresh_tokens` funcionando
  - [ ] Queries a `sys_auditoria_auth` funcionando
  - [ ] Transacciones usadas donde sea necesario

---

## Riesgos y Consideraciones

### Riesgo 1: Dependencia de T2.04 (Middleware de autenticación)
**Descripción**: Los endpoints `/logout` y `/change-password` requieren `authMiddleware` que se está desarrollando en paralelo.

**Mitigación**:
- Opción A: Implementar rutas sin middleware, agregar TODOs, esperar a T2.04
- Opción B: Implementar versión temporal insegura (userId en body) solo para testing
- Opción C: Coordinar con agente de T2.04 para usar versión básica de authMiddleware

**Decisión**: Opción A (implementar sin middleware, agregar TODOs)

### Riesgo 2: Hashing de refresh tokens
**Descripción**: Debe usarse SHA-256 para hashear tokens antes de almacenar.

**Mitigación**:
- Usar módulo nativo `crypto` de Node.js
- Ejemplo: `crypto.createHash('sha256').update(token).digest('hex')`
- Probar hashing en tests unitarios

### Riesgo 3: Expiración de tokens en BD
**Descripción**: Tokens expirados deben rechazarse incluso si están en BD.

**Mitigación**:
- Validar `fecha_expiracion > NOW()` en query SQL
- Validar expiración JWT con `jwt.service.verifyRefreshToken()` ANTES de consultar BD

### Riesgo 4: Límite de refresh tokens por usuario
**Descripción**: ADR-002 menciona máximo 5 refresh tokens activos por usuario.

**Mitigación**:
- Implementar en iteración futura (no crítico para MVP)
- Agregar TODO en código
- Por ahora, permitir tokens ilimitados

### Riesgo 5: Rate limiting de login
**Descripción**: ADR-002 menciona rate limiting (5 intentos/15min por IP).

**Mitigación**:
- NO implementar en esta tarea (será T2.13 o posterior)
- El bloqueo por usuario (campo `bloqueado_hasta`) SÍ se implementa aquí
- Agregar TODO sobre rate limiting por IP

---

## Notas Adicionales

### Sobre ejecución en paralelo con T2.04
- Esta tarea (T2.03) implementa **servicios, controllers y rutas**
- T2.04 implementa **middlewares de autenticación y autorización**
- **NO hay conflictos de archivos** entre ambas tareas
- Coordinación necesaria: Los endpoints `/logout` y `/change-password` necesitarán el middleware de T2.04

### Sobre seguridad
- Nunca exponer `password_hash` en respuestas
- Usar `UserSafeDTO` para respuestas de usuario
- Hashear refresh tokens antes de almacenar (SHA-256)
- Validar todos los inputs con Zod
- No revelar si un usuario existe o no (mensajes genéricos de error)

### Sobre auditoría
- Registrar TODOS los eventos de autenticación
- Incluir IP y User-Agent en auditoría
- Almacenar información adicional en campo `detalles` (JSON)

### Sobre testing
- Usar base de datos de prueba separada
- Limpiar BD entre tests
- Probar casos exitosos Y fallidos
- Validar estados de BD después de operaciones

---

## Dependencias Externas

### Paquetes NPM requeridos (ya instalados):
- `express` - Framework HTTP
- `mysql2` - Driver MySQL
- `zod` - Validación de schemas
- `jsonwebtoken` - Generación y verificación de JWT
- `bcryptjs` - Hashing de contraseñas
- `dotenv` - Variables de entorno

### Paquetes NPM para testing (ya instalados):
- `jest` - Framework de testing
- `supertest` - Testing de APIs HTTP
- `@types/supertest` - Types para Supertest

### Paquetes adicionales necesarios:
- Ninguno (crypto es built-in de Node.js)

---

## Estimación de Tiempo por Subtarea

| Subtarea | Tiempo Estimado |
|----------|----------------|
| 1. Crear auth.service.ts | 1.5 horas |
| 2. Crear auth.controller.ts | 1 hora |
| 3. Crear auth.routes.ts | 30 minutos |
| 4. Integrar rutas en servidor | 15 minutos |
| 5. Crear tests de integración | 1.5 horas |
| 6. Middleware validación (opcional) | 30 minutos |
| **TOTAL** | **4-5 horas** |

---

## Referencias

- **ADR-002**: `docs/decisions/002_estrategia_autenticacion.md` - Estrategia completa de autenticación
- **T2.01**: `docs/completed/T2.01_modelos_autenticacion.md` - Modelos y schemas creados
- **T2.02**: `docs/completed/T2.02_servicio_hashing_jwt.md` - Servicios de password y JWT
- **Modelos**: `backend/src/models/auth.model.ts`
- **Schemas Zod**: `backend/src/schemas/auth.schema.ts`
- **Servicios**: `backend/src/services/password.service.ts`, `backend/src/services/jwt.service.ts`
- **BD Config**: `backend/src/config/database.ts`

---

**Plan creado**: 2026-01-18
**Estado**: Listo para ejecutar
**Próximo paso**: Comenzar ejecución usando TodoWrite para trackear subtareas
