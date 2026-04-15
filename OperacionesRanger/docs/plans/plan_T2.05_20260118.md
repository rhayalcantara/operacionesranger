# Plan: T2.05 - Implementar CRUD de usuarios

**Fecha**: 2026-01-18
**Tarea padre**: T2.05
**Fase**: Fase 2 - Backend Core
**Estimación**: 4-5 horas
**Prioridad**: Alta
**Ejecución**: Paralela (Subagente 1 de 4)

## Objetivo

Implementar endpoints REST completos para la gestión de usuarios del sistema (CRUD + reset password), accesibles únicamente por usuarios con rol ADMIN. El sistema debe incluir paginación server-side, búsqueda, validaciones completas y tests de integración exhaustivos.

## Contexto

### Tareas Completadas (Dependencias)
- ✅ **T2.01**: Modelos y esquemas de autenticación creados
  - Interfaces: `Usuario`, `CreateUserDTO`, `UpdateUserDTO`, `UserSafeDTO`
  - Schemas Zod: `createUserSchema`, `updateUserSchema`, `paginationQuerySchema`
  - Tabla DB: `sys_usuarios` con campos completos

- ✅ **T2.02**: Servicios de hashing y JWT implementados
  - `PasswordService`: `hashPassword()`, `verifyPassword()`
  - Bcrypt configurado con 10 rounds

- ✅ **T2.04**: Middlewares de autenticación y autorización
  - `authMiddleware`: Verifica JWT en header Authorization
  - `requireRole(...roles)`: Middleware de autorización por rol
  - Solo ADMIN puede acceder a CRUD de usuarios

### Archivos Existentes a Utilizar
- `backend/src/models/auth.model.ts`: Interfaces y tipos
- `backend/src/schemas/auth.schema.ts`: Schemas de validación Zod
- `backend/src/services/password.service.ts`: Hasheo de passwords
- `backend/src/middlewares/auth.middleware.ts`: Autenticación JWT
- `backend/src/middlewares/role.middleware.ts`: Autorización por rol
- `database/migrations/001_create_auth_tables.sql`: Tabla `sys_usuarios`

### Tabla de Base de Datos

**Tabla**: `sys_usuarios`

Campos principales:
- `id_usuario` (PK, AUTO_INCREMENT)
- `username` (VARCHAR(50), UNIQUE, NOT NULL)
- `password_hash` (VARCHAR(255), NOT NULL)
- `email` (VARCHAR(100), UNIQUE, NULL)
- `nombre_completo` (VARCHAR(150), NOT NULL)
- `rol` (ENUM: 'ADMIN', 'SUPERVISOR', 'CONSULTA')
- `activo` (BOOLEAN, DEFAULT TRUE)
- `fecha_creacion`, `fecha_modificacion`
- `ultimo_login`, `intentos_fallidos`, `bloqueado_hasta`
- `created_by`, `modified_by` (FK a sys_usuarios)

### Restricciones de Paralelización

**IMPORTANTE**: Esta tarea se ejecuta EN PARALELO con:
- **Subagente 2**: T2.07 (CRUD clientes)
- **Subagente 3**: T2.10 (CRUD feriados)
- **Subagente 4**: T2.11 (CRUD config turnos)

**Ámbito de esta tarea**:
- ✅ Crear: `usuarios.service.ts`, `usuarios.controller.ts`, `usuarios.routes.ts`
- ✅ Crear: `tests/integration/usuarios.test.ts`
- ❌ NO modificar: `server.ts` (se integrará después)
- ❌ NO modificar: Archivos de otros CRUDs (clientes.*, feriados.*, config-turnos.*)

## Subtareas

### 1. Implementar Service Layer - usuarios.service.ts

**Descripción**: Crear servicio con toda la lógica de negocio para gestión de usuarios.

**Archivo a crear**: `backend/src/services/usuarios.service.ts`

**Funciones a implementar**:

```typescript
// 1. getUsuarios(page, pageSize, search)
// - Paginación server-side con LIMIT y OFFSET
// - Búsqueda por username, email, nombre_completo (LIKE %search%)
// - Retorna: { data: UserSafeDTO[], total: number }
// - Excluye password_hash en respuesta

// 2. getUsuarioById(id)
// - Busca usuario por ID
// - Retorna UserSafeDTO (sin password_hash)
// - Lanza error 404 si no existe

// 3. createUsuario(dto, createdBy)
// - Valida username único
// - Hashea password con PasswordService
// - Inserta en BD con created_by
// - Retorna UserSafeDTO del usuario creado

// 4. updateUsuario(id, dto, modifiedBy)
// - Permite actualizar: email, nombre_completo, rol, activo
// - NO permite cambiar password (endpoint separado)
// - Actualiza modified_by
// - Retorna UserSafeDTO actualizado

// 5. deleteUsuario(id)
// - Soft delete: activo = false
// - Validación: NO permitir eliminar último ADMIN
// - Cuenta admins activos antes de eliminar
// - Retorna mensaje de éxito

// 6. resetPassword(id)
// - Genera password temporal aleatorio (12 chars, seguro)
// - Hashea con PasswordService
// - Actualiza password_hash en BD
// - Retorna password temporal en plaintext (única vez)

// 7. countAdminsActivos()
// - Helper: cuenta usuarios con rol=ADMIN y activo=true
// - Usado por deleteUsuario para validar
```

**Validaciones de negocio**:
- Username único (antes de crear)
- No eliminar último admin activo
- Password temporal fuerte (min 12 chars, mezcla de caracteres)
- Email único si se proporciona

**Conexión a BD**:
```typescript
import { pool } from '../config/database';
```

**Resultado esperado**: Service completo con manejo de errores robusto.

---

### 2. Implementar Controller Layer - usuarios.controller.ts

**Descripción**: Crear controladores Express para los 6 endpoints.

**Archivo a crear**: `backend/src/controllers/usuarios.controller.ts`

**Controladores a implementar**:

```typescript
// GET /api/usuarios
export async function getUsuarios(req, res)
// - Extrae query params: page, pageSize, search
// - Valida con paginationQuerySchema
// - Llama usuariosService.getUsuarios()
// - Responde 200 con { data, total, page, pageSize, totalPages }

// GET /api/usuarios/:id
export async function getUsuarioById(req, res)
// - Extrae id de params
// - Valida con userIdParamSchema
// - Llama usuariosService.getUsuarioById()
// - Responde 200 con UserSafeDTO
// - Maneja error 404 si no existe

// POST /api/usuarios
export async function createUsuario(req, res)
// - Valida body con createUserSchema
// - Extrae created_by de req.user.sub
// - Llama usuariosService.createUsuario()
// - Responde 201 con usuario creado
// - Maneja error 409 si username duplicado

// PUT /api/usuarios/:id
export async function updateUsuario(req, res)
// - Valida params con userIdParamSchema
// - Valida body con updateUserSchema
// - Extrae modified_by de req.user.sub
// - Llama usuariosService.updateUsuario()
// - Responde 200 con usuario actualizado

// DELETE /api/usuarios/:id
export async function deleteUsuario(req, res)
// - Valida params con userIdParamSchema
// - Llama usuariosService.deleteUsuario()
// - Responde 200 con { message: "Usuario desactivado" }
// - Maneja error 400 si es último admin

// POST /api/usuarios/:id/reset-password
export async function resetPassword(req, res)
// - Valida params con userIdParamSchema
// - Llama usuariosService.resetPassword()
// - Responde 200 con { temporaryPassword: "..." }
// - Advierte que password debe cambiarse
```

**Manejo de errores**:
- Try-catch en cada controlador
- Transformar errores de servicio a HTTP status codes apropiados
- Respuestas consistentes con formato: `{ error, message }`

**Resultado esperado**: 6 controladores funcionando correctamente.

---

### 3. Implementar Routes - usuarios.routes.ts

**Descripción**: Definir rutas con middlewares de autenticación y autorización.

**Archivo a crear**: `backend/src/routes/usuarios.routes.ts`

**Rutas a definir**:

```typescript
import express from 'express';
import { authMiddleware } from '../middlewares/auth.middleware';
import { requireRole } from '../middlewares/role.middleware';
import * as controller from '../controllers/usuarios.controller';

const router = express.Router();

// Todas las rutas requieren autenticación + rol ADMIN
router.use(authMiddleware);
router.use(requireRole('ADMIN'));

// GET /api/usuarios - Listar usuarios (paginado)
router.get('/', controller.getUsuarios);

// GET /api/usuarios/:id - Obtener usuario por ID
router.get('/:id', controller.getUsuarioById);

// POST /api/usuarios - Crear nuevo usuario
router.post('/', controller.createUsuario);

// PUT /api/usuarios/:id - Actualizar usuario
router.put('/:id', controller.updateUsuario);

// DELETE /api/usuarios/:id - Desactivar usuario (soft delete)
router.delete('/:id', controller.deleteUsuario);

// POST /api/usuarios/:id/reset-password - Resetear password
router.post('/:id/reset-password', controller.resetPassword);

export default router;
```

**Middlewares aplicados**:
- `authMiddleware`: Verifica JWT válido
- `requireRole('ADMIN')`: Solo ADMIN puede acceder

**Resultado esperado**: Rutas correctamente configuradas con seguridad.

---

### 4. Crear Tests de Integración - usuarios.test.ts

**Descripción**: Suite completa de tests de integración usando Jest + Supertest.

**Archivo a crear**: `backend/tests/integration/usuarios.test.ts`

**Setup de tests**:
```typescript
import request from 'supertest';
import { app } from '../../src/server';
import { pool } from '../../src/config/database';

let adminToken: string;
let testUserId: number;

beforeAll(async () => {
  // Autenticar como admin para obtener token
  const loginRes = await request(app)
    .post('/api/auth/login')
    .send({ username: 'admin', password: 'Admin123!' });

  adminToken = loginRes.body.accessToken;
});

afterAll(async () => {
  // Limpiar usuarios de prueba
  await pool.end();
});
```

**Casos de prueba** (mínimo 15):

1. **GET /api/usuarios**
   - ✅ Listar usuarios con paginación
   - ✅ Búsqueda por username
   - ✅ Búsqueda por email
   - ✅ Sin autenticación (401)
   - ✅ Con rol SUPERVISOR (403)

2. **GET /api/usuarios/:id**
   - ✅ Obtener usuario existente
   - ✅ Usuario no existente (404)
   - ✅ ID inválido (400)

3. **POST /api/usuarios**
   - ✅ Crear usuario válido
   - ✅ Username duplicado (409)
   - ✅ Email duplicado (409)
   - ✅ Password débil (400)
   - ✅ Campos faltantes (400)

4. **PUT /api/usuarios/:id**
   - ✅ Actualizar email
   - ✅ Actualizar rol
   - ✅ Desactivar usuario
   - ✅ Sin cambios (400)

5. **DELETE /api/usuarios/:id**
   - ✅ Eliminar usuario normal
   - ✅ Intentar eliminar último admin (400)
   - ✅ Usuario ya inactivo

6. **POST /api/usuarios/:id/reset-password**
   - ✅ Generar password temporal
   - ✅ Verificar que password es válido
   - ✅ Usuario no existente (404)

**Cobertura esperada**: > 90% de líneas del servicio y controlador.

**Resultado esperado**: Todos los tests pasando.

---

### 5. Ejecutar Tests y Validar Criterios de Aceptación

**Descripción**: Ejecutar suite de tests y verificar todos los criterios de aceptación.

**Comandos**:
```bash
# Ejecutar tests de usuarios
npm test -- usuarios.test.ts

# Ver cobertura
npm test -- --coverage usuarios
```

**Criterios de Aceptación a Validar**:

- [ ] Los 6 endpoints funcionando correctamente
- [ ] Paginación server-side implementada (LIMIT, OFFSET)
- [ ] Búsqueda por username, email, nombre funcionando
- [ ] Validaciones completas con schemas Zod
- [ ] Solo ADMIN puede acceder (403 para otros roles)
- [ ] Tests de integración > 15 casos, todos pasando
- [ ] Soft delete funcionando (activo = false)
- [ ] No se puede eliminar último admin
- [ ] Password temporal generado es seguro (min 12 chars)
- [ ] Sin conflictos con archivos de otros subagentes

**Resultado esperado**: Todos los criterios cumplidos.

---

### 6. Documentar Resultado en docs/completed/

**Descripción**: Crear archivo de documentación de tarea completada.

**Archivo a crear**: `docs/completed/T2.05_crud_usuarios.md`

**Contenido del archivo**:
- Resumen de implementación
- Archivos generados
- Endpoints implementados
- Resultados de tests
- Problemas encontrados y soluciones
- Decisiones técnicas tomadas
- Próximos pasos

**Resultado esperado**: Documentación completa y clara.

---

## Archivos a Generar

| Archivo | Descripción | Líneas Estimadas |
|---------|-------------|------------------|
| `backend/src/services/usuarios.service.ts` | Lógica de negocio CRUD | ~300-400 |
| `backend/src/controllers/usuarios.controller.ts` | Controladores Express | ~200-250 |
| `backend/src/routes/usuarios.routes.ts` | Definición de rutas | ~30-40 |
| `backend/tests/integration/usuarios.test.ts` | Tests de integración | ~400-500 |
| `docs/completed/T2.05_crud_usuarios.md` | Documentación de resultado | ~100-150 |

**Total estimado**: ~1,030-1,340 líneas de código

---

## Riesgos y Consideraciones

### Riesgo 1: Conflictos con Otros Subagentes
**Descripción**: Ejecución en paralelo con T2.07, T2.10, T2.11
**Mitigación**:
- NO modificar `server.ts` (integración después)
- Solo trabajar en archivos `usuarios.*`
- Evitar cambios en archivos compartidos

### Riesgo 2: Eliminar Último Admin
**Descripción**: Usuario podría quedar sin acceso al sistema
**Mitigación**:
- Validación en `deleteUsuario()`: contar admins activos
- Solo permitir si hay al menos 2 admins activos

### Riesgo 3: Password Temporal Inseguro
**Descripción**: Password generado podría ser débil
**Mitigación**:
- Usar generador criptográfico (`crypto.randomBytes`)
- Mezclar mayúsculas, minúsculas, números, símbolos
- Longitud mínima: 12 caracteres

### Riesgo 4: Búsqueda Lenta con Muchos Usuarios
**Descripción**: Query con LIKE puede ser lento
**Mitigación**:
- Usar índices en BD (ya creados en migración)
- Limitar pageSize máximo a 100
- Considerar full-text search si >10,000 usuarios

---

## Dependencias Técnicas

### NPM Packages (ya instalados)
- `express` - Framework web
- `mysql2` - Driver MySQL
- `zod` - Validación de schemas
- `bcryptjs` - Hashing de passwords
- `jsonwebtoken` - JWT
- `jest` - Testing framework
- `supertest` - Tests de API

### Variables de Entorno Requeridas
```env
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=RHoss.1234
DB_NAME=turnos_guardianes
JWT_SECRET=<secret>
BCRYPT_ROUNDS=10
```

---

## Notas Adicionales

### Paginación Server-Side
```sql
SELECT * FROM sys_usuarios
WHERE (username LIKE ? OR email LIKE ? OR nombre_completo LIKE ?)
LIMIT ? OFFSET ?
```

### Generación de Password Temporal
```typescript
import crypto from 'crypto';

function generateTempPassword(): string {
  const length = 12;
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%';
  const bytes = crypto.randomBytes(length);
  return Array.from(bytes)
    .map(byte => chars[byte % chars.length])
    .join('');
}
```

### Formato de Respuesta Paginada
```json
{
  "data": [UserSafeDTO],
  "total": 42,
  "page": 1,
  "pageSize": 20,
  "totalPages": 3
}
```

---

## Checklist de Completitud

Antes de marcar tarea como completada, verificar:

- [ ] Service implementado con 7 funciones
- [ ] Controller implementado con 6 endpoints
- [ ] Routes configuradas con authMiddleware + requireRole
- [ ] Tests de integración > 15 casos
- [ ] Todos los tests pasando (0 errores)
- [ ] Paginación funcionando correctamente
- [ ] Búsqueda funcionando (username, email, nombre)
- [ ] Soft delete implementado
- [ ] Validación de último admin
- [ ] Password temporal seguro
- [ ] Sin conflictos con otros subagentes
- [ ] Documentación en docs/completed/
- [ ] Código limpio y bien comentado

---

**Tiempo estimado total**: 4-5 horas
**Complejidad**: Media-Alta
**Prioridad**: Alta
**Bloqueadores**: Ninguno
