# Plan: T2.01 - Implementar modelos y esquemas de autenticación

**Fecha**: 2026-01-18
**Tarea padre**: T2.01
**Fase**: Fase 2 - Backend Core
**Estimación**: 3-4 horas

---

## Objetivo

Crear los modelos TypeScript, interfaces, schemas de validación y scripts de base de datos para el sistema de autenticación JWT + Refresh Tokens siguiendo la decisión de arquitectura ADR-002.

---

## Contexto

### Documentación relevante

- **ADR-002**: `docs/decisions/002_estrategia_autenticacion.md` define la estrategia de autenticación JWT con Refresh Tokens
- **Tareas de Fase 2**: `docs/tasks/tareas_fase2_backend_core_20260118.md` define los requisitos de esta tarea
- **Backend README**: `backend/README.md` contiene la estructura actual del proyecto

### Decisiones arquitectónicas clave

Según ADR-002:
- Usar JWT (JSON Web Tokens) para autenticación stateless
- Access Token: corta duración (15-30 min)
- Refresh Token: larga duración (7 días), almacenado en BD
- Roles: ADMIN, SUPERVISOR, CONSULTA
- Auditoría de todas las operaciones de autenticación
- Hashing de passwords con bcrypt

### Estructura del backend

```
backend/
├── src/
│   ├── config/           # Configuración (database, env)
│   ├── controllers/      # Controladores de rutas
│   ├── models/           # Modelos e interfaces TypeScript
│   ├── schemas/          # Schemas de validación (Zod)
│   ├── services/         # Lógica de negocio
│   ├── routes/           # Definición de rutas
│   ├── middlewares/      # Middlewares
│   └── types/            # Tipos TypeScript globales
└── database/
    └── migrations/       # Scripts SQL de migración
```

---

## Subtareas

### 1. Crear interfaces TypeScript en `backend/src/models/auth.model.ts`

**Descripción**: Definir todas las interfaces TypeScript para las entidades de autenticación.

**Archivos a crear**:
- `backend/src/models/auth.model.ts`

**Interfaces a definir**:

1. **Usuario** (tabla: `sys_usuarios`):
   - `id_usuario`: number
   - `username`: string
   - `password_hash`: string
   - `email`: string | null
   - `nombre_completo`: string
   - `rol`: 'ADMIN' | 'SUPERVISOR' | 'CONSULTA'
   - `activo`: boolean
   - `fecha_creacion`: Date
   - `fecha_modificacion`: Date
   - `ultimo_login`: Date | null
   - `intentos_fallidos`: number
   - `bloqueado_hasta`: Date | null
   - `created_by`: number | null
   - `modified_by`: number | null

2. **RefreshToken** (tabla: `sys_refresh_tokens`):
   - `id_token`: number
   - `id_usuario`: number
   - `token_hash`: string
   - `fecha_emision`: Date
   - `fecha_expiracion`: Date
   - `revocado`: boolean
   - `fecha_revocacion`: Date | null
   - `ip_address`: string | null
   - `user_agent`: string | null

3. **AuditoriaAuth** (tabla: `sys_auditoria_auth`):
   - `id_auditoria`: number
   - `id_usuario`: number | null
   - `username`: string
   - `evento`: 'LOGIN_SUCCESS' | 'LOGIN_FAILED' | 'LOGOUT' | 'TOKEN_REFRESH' | 'PASSWORD_CHANGE'
   - `ip_address`: string | null
   - `user_agent`: string | null
   - `detalles`: string | null
   - `fecha_evento`: Date

4. **DTOs (Data Transfer Objects)**:
   - `LoginDTO`: { username: string, password: string }
   - `LoginResponseDTO`: { accessToken: string, refreshToken: string, user: UserSafeDTO }
   - `UserSafeDTO`: Usuario sin password_hash
   - `RefreshTokenDTO`: { refreshToken: string }
   - `ChangePasswordDTO`: { currentPassword: string, newPassword: string }
   - `CreateUserDTO`: { username: string, password: string, email?: string, nombre_completo: string, rol: UserRole }
   - `UpdateUserDTO`: Partial de CreateUserDTO sin password

5. **Types y Enums**:
   - `UserRole`: enum 'ADMIN' | 'SUPERVISOR' | 'CONSULTA'
   - `AuthEvent`: enum de eventos de auditoría
   - `JWTPayload`: { sub: number, username: string, rol: UserRole, iat: number, exp: number }

**Resultado esperado**: Archivo TypeScript con todas las interfaces exportadas, correctamente tipadas, sin uso de `any`.

---

### 2. Crear script SQL para tablas de autenticación

**Descripción**: Crear script de migración SQL para crear las 3 tablas de autenticación en la base de datos `turnos_guardianes`.

**Archivos a crear**:
- `database/migrations/001_create_auth_tables.sql`

**Tablas a crear**:

#### 2.1. Tabla `sys_usuarios`

Basada en definición de ADR-002 sección "Modelo de Datos":

```sql
CREATE TABLE sys_usuarios (
    id_usuario INT PRIMARY KEY AUTO_INCREMENT,
    username VARCHAR(50) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    email VARCHAR(100) UNIQUE,
    nombre_completo VARCHAR(150) NOT NULL,
    rol ENUM('ADMIN', 'SUPERVISOR', 'CONSULTA') NOT NULL DEFAULT 'CONSULTA',
    activo BOOLEAN NOT NULL DEFAULT TRUE,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_modificacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    ultimo_login TIMESTAMP NULL,
    intentos_fallidos INT DEFAULT 0,
    bloqueado_hasta TIMESTAMP NULL,
    created_by INT NULL,
    modified_by INT NULL,

    INDEX idx_username (username),
    INDEX idx_rol (rol),
    INDEX idx_activo (activo),
    FOREIGN KEY (created_by) REFERENCES sys_usuarios(id_usuario) ON DELETE SET NULL,
    FOREIGN KEY (modified_by) REFERENCES sys_usuarios(id_usuario) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Usuarios del sistema de turnos';
```

**Características**:
- Auto-increment primary key
- Username único (UNIQUE constraint)
- Email único y opcional
- Rol con valores restringidos (ENUM)
- Índices para optimizar queries por username, rol, activo
- Seguridad: bloqueo temporal tras intentos fallidos
- Auditoría: created_by, modified_by con FK a misma tabla

#### 2.2. Tabla `sys_refresh_tokens`

```sql
CREATE TABLE sys_refresh_tokens (
    id_token INT PRIMARY KEY AUTO_INCREMENT,
    id_usuario INT NOT NULL,
    token_hash VARCHAR(255) NOT NULL UNIQUE,
    fecha_emision TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_expiracion TIMESTAMP NOT NULL,
    revocado BOOLEAN DEFAULT FALSE,
    fecha_revocacion TIMESTAMP NULL,
    ip_address VARCHAR(45),
    user_agent TEXT,

    INDEX idx_usuario (id_usuario),
    INDEX idx_token_hash (token_hash),
    INDEX idx_expiracion (fecha_expiracion),
    INDEX idx_revocado (revocado),
    FOREIGN KEY (id_usuario) REFERENCES sys_usuarios(id_usuario) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Refresh tokens para renovación de acceso';
```

**Características**:
- Token almacenado como hash SHA-256 (no plaintext)
- FK a sys_usuarios con CASCADE (eliminar tokens al eliminar usuario)
- Índices para búsquedas por token, expiración, revocación
- ip_address soporta IPv4 (15 chars) y IPv6 (45 chars)
- user_agent como TEXT para flexibilidad

#### 2.3. Tabla `sys_auditoria_auth`

```sql
CREATE TABLE sys_auditoria_auth (
    id_auditoria INT PRIMARY KEY AUTO_INCREMENT,
    id_usuario INT NULL,
    username VARCHAR(50),
    evento ENUM('LOGIN_SUCCESS', 'LOGIN_FAILED', 'LOGOUT', 'TOKEN_REFRESH', 'PASSWORD_CHANGE') NOT NULL,
    ip_address VARCHAR(45),
    user_agent TEXT,
    detalles TEXT,
    fecha_evento TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    INDEX idx_usuario (id_usuario),
    INDEX idx_evento (evento),
    INDEX idx_fecha (fecha_evento),
    FOREIGN KEY (id_usuario) REFERENCES sys_usuarios(id_usuario) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Auditoría de eventos de autenticación';
```

**Características**:
- id_usuario NULL para registrar intentos fallidos (usuario no encontrado)
- username registrado siempre (incluso si login falla)
- Evento restringido por ENUM
- detalles como TEXT para JSON o información adicional
- FK con SET NULL (preservar auditoría aunque se elimine usuario)

**Resultado esperado**: Script SQL ejecutable que crea las 3 tablas sin errores.

---

### 3. Crear schemas de validación con Zod

**Descripción**: Crear schemas de validación para requests de autenticación usando Zod (biblioteca de validación TypeScript-first).

**Archivos a crear**:
- `backend/src/schemas/auth.schema.ts`

**Schemas a crear**:

#### 3.1. Login Schema

```typescript
import { z } from 'zod';

export const loginSchema = z.object({
  username: z.string()
    .min(3, 'El usuario debe tener al menos 3 caracteres')
    .max(50, 'El usuario no puede exceder 50 caracteres')
    .regex(/^[a-zA-Z0-9_]+$/, 'El usuario solo puede contener letras, números y guiones bajos'),
  password: z.string()
    .min(8, 'La contraseña debe tener al menos 8 caracteres')
    .max(100, 'La contraseña no puede exceder 100 caracteres')
});
```

#### 3.2. Refresh Token Schema

```typescript
export const refreshTokenSchema = z.object({
  refreshToken: z.string()
    .min(1, 'El refresh token es requerido')
});
```

#### 3.3. Change Password Schema

```typescript
export const changePasswordSchema = z.object({
  currentPassword: z.string()
    .min(1, 'La contraseña actual es requerida'),
  newPassword: z.string()
    .min(8, 'La nueva contraseña debe tener al menos 8 caracteres')
    .max(100, 'La nueva contraseña no puede exceder 100 caracteres')
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
      'La contraseña debe contener al menos una mayúscula, una minúscula y un número'
    )
});
```

#### 3.4. Create User Schema

```typescript
export const createUserSchema = z.object({
  username: z.string()
    .min(3, 'El usuario debe tener al menos 3 caracteres')
    .max(50, 'El usuario no puede exceder 50 caracteres')
    .regex(/^[a-zA-Z0-9_]+$/, 'El usuario solo puede contener letras, números y guiones bajos'),
  password: z.string()
    .min(8, 'La contraseña debe tener al menos 8 caracteres')
    .max(100, 'La contraseña no puede exceder 100 caracteres')
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
      'La contraseña debe contener al menos una mayúscula, una minúscula y un número'
    ),
  email: z.string()
    .email('Email inválido')
    .max(100, 'El email no puede exceder 100 caracteres')
    .optional()
    .nullable(),
  nombre_completo: z.string()
    .min(1, 'El nombre completo es requerido')
    .max(150, 'El nombre completo no puede exceder 150 caracteres'),
  rol: z.enum(['ADMIN', 'SUPERVISOR', 'CONSULTA'], {
    errorMap: () => ({ message: 'Rol inválido. Debe ser ADMIN, SUPERVISOR o CONSULTA' })
  })
});
```

#### 3.5. Update User Schema

```typescript
export const updateUserSchema = z.object({
  email: z.string()
    .email('Email inválido')
    .max(100, 'El email no puede exceder 100 caracteres')
    .optional()
    .nullable(),
  nombre_completo: z.string()
    .min(1, 'El nombre completo es requerido')
    .max(150, 'El nombre completo no puede exceder 150 caracteres')
    .optional(),
  rol: z.enum(['ADMIN', 'SUPERVISOR', 'CONSULTA'])
    .optional(),
  activo: z.boolean()
    .optional()
});
```

**Instalación de dependencias**:

```bash
npm install zod
```

**Resultado esperado**: Archivo TypeScript con todos los schemas exportados, con validaciones completas y mensajes de error en español.

---

### 4. Actualizar documentación en backend/README.md

**Descripción**: Agregar sección documentando los modelos y schemas de autenticación creados.

**Archivo a modificar**:
- `backend/README.md`

**Sección a agregar** (después de la sección "Estructura del proyecto"):

```markdown
## Modelos de Datos

### Modelos de Autenticación

El sistema utiliza 3 tablas para gestionar autenticación y autorización:

#### 1. `sys_usuarios`

Usuarios del sistema con roles y permisos.

**Campos principales**:
- `id_usuario`: Identificador único (INT, PK, AUTO_INCREMENT)
- `username`: Nombre de usuario (VARCHAR(50), UNIQUE, NOT NULL)
- `password_hash`: Hash bcrypt de la contraseña (VARCHAR(255), NOT NULL)
- `email`: Email del usuario (VARCHAR(100), UNIQUE, NULLABLE)
- `nombre_completo`: Nombre completo del usuario (VARCHAR(150), NOT NULL)
- `rol`: Rol del usuario - ENUM('ADMIN', 'SUPERVISOR', 'CONSULTA')
- `activo`: Estado del usuario (BOOLEAN, DEFAULT TRUE)
- `ultimo_login`: Fecha del último login exitoso (TIMESTAMP, NULLABLE)
- `intentos_fallidos`: Contador de intentos fallidos de login (INT, DEFAULT 0)
- `bloqueado_hasta`: Fecha hasta la cual está bloqueado (TIMESTAMP, NULLABLE)

**Roles**:
- **ADMIN**: Control total del sistema (usuarios, configuración, todos los módulos)
- **SUPERVISOR**: Operación diaria (registro de turnos, gestión, reportes)
- **CONSULTA**: Solo lectura (visualización de turnos y reportes)

**Seguridad**:
- Bloqueo temporal tras 5 intentos fallidos (15 minutos)
- Passwords hasheados con bcrypt (10 rounds)
- Auditoría de creación y modificación (created_by, modified_by)

#### 2. `sys_refresh_tokens`

Tokens de renovación para mantener sesiones activas.

**Campos principales**:
- `id_token`: Identificador único (INT, PK, AUTO_INCREMENT)
- `id_usuario`: Usuario propietario del token (INT, FK → sys_usuarios)
- `token_hash`: Hash SHA-256 del refresh token (VARCHAR(255), UNIQUE, NOT NULL)
- `fecha_emision`: Fecha de emisión (TIMESTAMP, DEFAULT CURRENT_TIMESTAMP)
- `fecha_expiracion`: Fecha de expiración (TIMESTAMP, NOT NULL)
- `revocado`: Indica si el token fue revocado (BOOLEAN, DEFAULT FALSE)
- `ip_address`: IP desde donde se emitió (VARCHAR(45), NULLABLE)
- `user_agent`: User agent del navegador (TEXT, NULLABLE)

**Características**:
- Expiración: 7 días por defecto
- Revocación manual: permite invalidar tokens (logout)
- Almacenamiento seguro: solo hash, nunca plaintext
- Límite de tokens activos: máximo 5 por usuario

#### 3. `sys_auditoria_auth`

Registro de todos los eventos de autenticación.

**Campos principales**:
- `id_auditoria`: Identificador único (INT, PK, AUTO_INCREMENT)
- `id_usuario`: Usuario relacionado (INT, FK → sys_usuarios, NULLABLE)
- `username`: Username del intento (VARCHAR(50), NOT NULL)
- `evento`: Tipo de evento - ENUM('LOGIN_SUCCESS', 'LOGIN_FAILED', 'LOGOUT', 'TOKEN_REFRESH', 'PASSWORD_CHANGE')
- `ip_address`: IP desde donde se originó (VARCHAR(45), NULLABLE)
- `user_agent`: User agent del navegador (TEXT, NULLABLE)
- `detalles`: Información adicional en JSON (TEXT, NULLABLE)
- `fecha_evento`: Timestamp del evento (TIMESTAMP, DEFAULT CURRENT_TIMESTAMP)

**Eventos auditados**:
- LOGIN_SUCCESS: Login exitoso
- LOGIN_FAILED: Intento fallido de login
- LOGOUT: Cierre de sesión
- TOKEN_REFRESH: Renovación de access token
- PASSWORD_CHANGE: Cambio de contraseña

### Schemas de Validación

El sistema utiliza **Zod** para validación de datos de entrada en tiempo de ejecución.

**Ubicación**: `src/schemas/auth.schema.ts`

**Schemas disponibles**:
- `loginSchema`: Validación de login (username + password)
- `refreshTokenSchema`: Validación de refresh token
- `changePasswordSchema`: Validación de cambio de contraseña
- `createUserSchema`: Validación de creación de usuario
- `updateUserSchema`: Validación de actualización de usuario

**Ejemplo de uso**:

```typescript
import { loginSchema } from '@schemas/auth.schema';

// Validar request body
const result = loginSchema.safeParse(req.body);

if (!result.success) {
  // Manejar errores de validación
  return res.status(400).json({
    error: 'Datos inválidos',
    details: result.error.errors
  });
}

// Usar datos validados
const { username, password } = result.data;
```

### TypeScript Interfaces

**Ubicación**: `src/models/auth.model.ts`

**Interfaces principales**:
- `Usuario`: Modelo completo de usuario
- `RefreshToken`: Modelo de refresh token
- `AuditoriaAuth`: Modelo de auditoría
- `LoginDTO`: DTO para login request
- `LoginResponseDTO`: DTO para login response
- `UserSafeDTO`: Usuario sin password_hash (para responses)
- `CreateUserDTO`: DTO para crear usuario
- `UpdateUserDTO`: DTO para actualizar usuario

**Enums y Types**:
- `UserRole`: 'ADMIN' | 'SUPERVISOR' | 'CONSULTA'
- `AuthEvent`: Eventos de auditoría
- `JWTPayload`: Payload del JWT

Ver archivo `src/models/auth.model.ts` para documentación completa.
```

**Resultado esperado**: README.md actualizado con sección de modelos de autenticación completa.

---

## Criterios de Aceptación (checklist)

- [ ] Interfaces TypeScript creadas en `src/models/auth.model.ts`
- [ ] Todas las interfaces exportadas correctamente
- [ ] No se usa el tipo `any` en ninguna parte
- [ ] DTOs definidos para requests y responses
- [ ] Enums y types auxiliares creados
- [ ] Script SQL creado en `database/migrations/001_create_auth_tables.sql`
- [ ] Script SQL crea 3 tablas (sys_usuarios, sys_refresh_tokens, sys_auditoria_auth)
- [ ] Todas las tablas tienen índices apropiados
- [ ] FK constraints definidos correctamente
- [ ] Charset utf8mb4 configurado
- [ ] Schemas Zod creados en `src/schemas/auth.schema.ts`
- [ ] 5 schemas de validación implementados
- [ ] Validaciones incluyen mensajes de error en español
- [ ] Reglas de negocio validadas (min length, regex, etc.)
- [ ] Dependencia `zod` instalada
- [ ] README.md actualizado con documentación de modelos
- [ ] Sección de modelos incluye ejemplos de uso
- [ ] Documentación clara y completa

---

## Archivos a Generar

1. **`backend/src/models/auth.model.ts`** - Interfaces TypeScript (nuevo)
2. **`database/migrations/001_create_auth_tables.sql`** - Script de migración (nuevo)
3. **`backend/src/schemas/auth.schema.ts`** - Schemas de validación Zod (nuevo)
4. **`backend/README.md`** - Documentación actualizada (modificar)

---

## Riesgos y Consideraciones

### Riesgo 1: Compatibilidad de tipos TypeScript

**Descripción**: Los tipos de las interfaces TypeScript deben coincidir exactamente con los tipos de la BD MySQL.

**Mitigación**:
- Usar `number` para INT
- Usar `string` para VARCHAR, TEXT
- Usar `boolean` para BOOLEAN
- Usar `Date` para TIMESTAMP
- Usar `null` para campos NULLABLE (tipo unión: `string | null`)

### Riesgo 2: Foreign Keys circulares en sys_usuarios

**Descripción**: La tabla `sys_usuarios` tiene FK a sí misma (created_by, modified_by), lo que puede causar problemas al crear el primer usuario.

**Mitigación**:
- FK con `ON DELETE SET NULL` (no bloqueante)
- created_by y modified_by son NULLABLE
- El primer usuario (seed admin) tendrá created_by = NULL

### Riesgo 3: Validación de password strength

**Descripción**: La validación de contraseña debe balancear seguridad y usabilidad.

**Decisión**:
- Mínimo 8 caracteres
- Al menos 1 mayúscula, 1 minúscula, 1 número
- NO requerir caracteres especiales (puede dificultar uso)
- Validación adicional se hará en Fase 2 (no reutilizar últimas 5 passwords)

### Riesgo 4: Instalación de dependencias

**Descripción**: Se requiere instalar `zod` como nueva dependencia.

**Mitigación**:
- Agregar a package.json: `npm install zod`
- Verificar versión compatible con TypeScript 5.3
- Versión recomendada: zod@^3.22.0

---

## Notas Adicionales

### Orden de ejecución recomendado

1. Crear interfaces TypeScript primero (define contratos)
2. Crear schemas de validación Zod (usa las interfaces)
3. Crear script SQL (implementación en BD)
4. Actualizar README (documentación)

### Referencias importantes

- **ADR-002**: Sección "Modelo de Datos (Base de Datos)" - páginas 463-530
- **Tareas Fase 2**: `docs/tasks/tareas_fase2_backend_core_20260118.md` - líneas 54-87
- **Backend README**: `backend/README.md` - estructura de directorios líneas 669-693

### Comandos útiles

```bash
# Instalar dependencia Zod
cd backend
npm install zod

# Verificar TypeScript compila sin errores
npm run build

# Ejecutar linter
npm run lint

# Ejecutar script SQL (para validar sintaxis)
mysql -u root -p turnos_guardianes < database/migrations/001_create_auth_tables.sql
```

### Validación final

Antes de marcar como completada:
1. Compilar TypeScript: `npm run build` → sin errores
2. Linter: `npm run lint` → sin warnings
3. Revisar que todos los archivos estén creados
4. Verificar que README esté actualizado
5. Comprobar que no hay uso de `any`
6. Confirmar que mensajes de error están en español

---

**Tiempo estimado total**: 3-4 horas

**Desglose**:
- Subtarea 1 (Interfaces TS): 1-1.5 horas
- Subtarea 2 (Script SQL): 1-1.5 horas
- Subtarea 3 (Schemas Zod): 0.5-1 hora
- Subtarea 4 (Documentación): 0.5 hora

---

**Última actualización**: 2026-01-18
**Estado**: Plan aprobado, listo para ejecución
