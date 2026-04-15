# Plan: T2.02 - Implementar servicio de hashing y JWT

**Fecha**: 2026-01-18
**Tarea padre**: T2.02
**Fase**: Fase 2 - Backend Core (Módulo 1: Autenticación)
**Estimación original**: 3-4 horas
**Prioridad**: Alta
**Dependencias**: T2.01 (Completada ✅)

---

## Objetivo

Crear servicios utilitarios para hashing seguro de contraseñas usando bcrypt y generación/validación de tokens JWT con jsonwebtoken. Estos servicios serán la base del sistema de autenticación del proyecto.

---

## Contexto

### Estado Actual

- ✅ **T2.01 Completada**: Modelos TypeScript, schemas Zod y tablas SQL creadas
- ✅ **Interfaces disponibles**: `JWTPayload`, `UserRole`, `Usuario` en `src/models/auth.model.ts`
- ✅ **Constantes definidas**: `PASSWORD_CONFIG`, `JWT_CONFIG`, `LOGIN_SECURITY`
- ⚠️ **Variables de entorno**: `JWT_SECRET` y `JWT_REFRESH_SECRET` deben agregarse

### Archivos Relevantes

- `backend/src/models/auth.model.ts` - Interfaces y tipos (421 líneas)
- `backend/src/config/env.ts` - Validación de variables de entorno (361 líneas)
- `backend/.env.example` - Ejemplos de variables de entorno (204 líneas)
- `docs/decisions/002_estrategia_autenticacion.md` - ADR de autenticación

### Decisiones Técnicas del ADR-002

- **Password hashing**: bcrypt con 10 rounds (balance seguridad/performance)
- **Access Token**: Expiración 15 minutos (30m según ADR, usar 15m por mayor seguridad)
- **Refresh Token**: Expiración 7 días
- **JWT Algorithm**: HS256 (HMAC SHA-256)
- **Secrets**: Separados para access y refresh tokens

---

## Subtareas

### Subtarea 1: Instalar dependencias npm

**Objetivo**: Instalar librerías de bcrypt y JWT con sus tipos TypeScript.

**Acciones**:
1. Cambiar al directorio backend
2. Instalar dependencias de producción:
   - `bcryptjs` - Hashing de contraseñas (pure JavaScript, compatible con todos los OS)
   - `jsonwebtoken` - Generación y validación de JWT
3. Instalar dependencias de desarrollo:
   - `@types/bcryptjs` - Tipos TypeScript para bcryptjs
   - `@types/jsonwebtoken` - Tipos TypeScript para jsonwebtoken

**Comandos**:
```bash
cd backend
npm install bcryptjs jsonwebtoken
npm install --save-dev @types/bcryptjs @types/jsonwebtoken
```

**Resultado esperado**:
- Dependencias instaladas en `node_modules/`
- Entradas agregadas en `package.json`
- `package-lock.json` actualizado
- Sin vulnerabilidades críticas

**Verificación**:
```bash
npm list bcryptjs jsonwebtoken
npm list @types/bcryptjs @types/jsonwebtoken
```

---

### Subtarea 2: Actualizar variables de entorno

**Objetivo**: Agregar variables de entorno para JWT secrets y configuración.

#### 2.1. Actualizar `.env.example`

**Archivo**: `backend/.env.example`

**Cambios a realizar**:
1. Buscar sección "# SEGURIDAD - AUTENTICACIÓN JWT (Para Fase 2)"
2. Actualizar variables existentes:
   - `JWT_SECRET` → Mejorar descripción y requisitos
   - `JWT_EXPIRES_IN` → Cambiar a `JWT_ACCESS_EXPIRES_IN` (15m)
3. Agregar nuevas variables:
   - `JWT_REFRESH_SECRET` - Secret para refresh tokens
   - `JWT_REFRESH_EXPIRES_IN` - Expiración refresh tokens (7d)

**Contenido a agregar/modificar**:
```bash
# ================================================================================
# SEGURIDAD - AUTENTICACIÓN JWT
# ================================================================================
#
# Configuración de JSON Web Tokens para autenticación de usuarios
# REQUERIDAS en Fase 2 (implementación de autenticación)
#

# Secreto para firmar y verificar ACCESS TOKENS (corta duración)
# REQUISITOS:
# - Mínimo 32 caracteres (recomendado: 64)
# - Cadena aleatoria criptográficamente segura
# - NUNCA usar el valor de ejemplo en producción
# - Cambiar este valor invalida todos los access tokens
# Generar secreto seguro:
#   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
# REQUERIDO en Fase 2
JWT_SECRET=your_jwt_access_secret_key_minimum_32_characters_random_string_here

# Tiempo de expiración de ACCESS TOKENS (corta duración para seguridad)
# Formato: número + unidad (s=segundos, m=minutos, h=horas, d=días)
# Valores recomendados:
# - 15m: Tokens expiran en 15 minutos (RECOMENDADO - alta seguridad)
# - 30m: Tokens expiran en 30 minutos (balance seguridad/usabilidad)
# - 1h: Tokens expiran en 1 hora (máxima usabilidad, menor seguridad)
# REQUERIDO en Fase 2
JWT_ACCESS_EXPIRES_IN=15m

# Secreto para firmar y verificar REFRESH TOKENS (larga duración)
# REQUISITOS:
# - Debe ser DIFERENTE de JWT_SECRET
# - Mínimo 32 caracteres (recomendado: 64)
# - Cadena aleatoria criptográficamente segura
# - Cambiar este valor invalida todos los refresh tokens
# Generar secreto seguro:
#   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
# REQUERIDO en Fase 2
JWT_REFRESH_SECRET=your_jwt_refresh_secret_key_minimum_32_characters_random_string_different_from_access

# Tiempo de expiración de REFRESH TOKENS (larga duración)
# Formato: número + unidad (s=segundos, m=minutos, h=horas, d=días)
# Valores recomendados:
# - 7d: Tokens expiran en 7 días (RECOMENDADO - balance seguridad/usabilidad)
# - 14d: Tokens expiran en 14 días (mayor usabilidad)
# - 30d: Tokens expiran en 30 días (máxima usabilidad, menor seguridad)
# REQUERIDO en Fase 2
JWT_REFRESH_EXPIRES_IN=7d

# Rounds de bcrypt para hashing de contraseñas
# Valores válidos: 4-31 (cada incremento duplica el tiempo de procesamiento)
# Valores comunes:
# - 10: Balance óptimo seguridad/performance (RECOMENDADO)
# - 12: Mayor seguridad, procesamiento más lento
# - 8: Desarrollo/testing (NO usar en producción)
# Por defecto: 10
BCRYPT_ROUNDS=10
```

#### 2.2. Actualizar `src/config/env.ts`

**Archivo**: `backend/src/config/env.ts`

**Cambios a realizar**:
1. Modificar interface `SecurityConfig` para incluir nuevos campos
2. Actualizar función `loadEnvConfig()` para validar JWT_SECRET como requerido
3. Agregar validación de longitud mínima de secrets (32 caracteres)
4. Agregar nuevas variables: JWT_REFRESH_SECRET, JWT_REFRESH_EXPIRES_IN, BCRYPT_ROUNDS
5. Actualizar función `printEnvSummary()` para mostrar nuevos campos

**Cambios específicos**:

**1. Actualizar interface SecurityConfig (líneas 57-60)**:
```typescript
export interface SecurityConfig {
  jwtSecret: string;           // Ahora requerido (no opcional)
  jwtAccessExpiresIn: string;
  jwtRefreshSecret: string;
  jwtRefreshExpiresIn: string;
  bcryptRounds: number;
}
```

**2. Crear función de validación de secrets (agregar después de validateEnum)**:
```typescript
/**
 * Valida que un secret tenga la longitud mínima requerida
 *
 * @param key - Nombre de la variable
 * @param value - Valor del secret
 * @param minLength - Longitud mínima requerida
 */
function validateSecretLength(key: string, value: string, minLength: number): void {
  if (value.length < minLength) {
    console.error(`
ERROR: Variable de entorno ${key} es demasiado corta.

Longitud actual: ${value.length} caracteres
Longitud mínima requerida: ${minLength} caracteres

Para generar un secret seguro, ejecuta:
  node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

Por favor actualiza el valor en tu archivo .env
    `);
    process.exit(1);
  }
}
```

**3. Actualizar sección de seguridad en loadEnvConfig() (líneas 278-282)**:
```typescript
// ===== SEGURIDAD =====
const jwtSecret = getRequiredEnv(
  'JWT_SECRET',
  'Secret para firmar access tokens JWT (mínimo 32 caracteres)'
);
validateSecretLength('JWT_SECRET', jwtSecret, 32);

const jwtRefreshSecret = getRequiredEnv(
  'JWT_REFRESH_SECRET',
  'Secret para firmar refresh tokens JWT (mínimo 32 caracteres, debe ser diferente de JWT_SECRET)'
);
validateSecretLength('JWT_REFRESH_SECRET', jwtRefreshSecret, 32);

// Validar que los secrets sean diferentes
if (jwtSecret === jwtRefreshSecret) {
  console.error(`
ERROR: JWT_SECRET y JWT_REFRESH_SECRET deben ser diferentes.

Los access tokens y refresh tokens deben usar secrets separados para seguridad.

Por favor genera dos secrets diferentes en tu archivo .env:
  node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
  `);
  process.exit(1);
}

const security: SecurityConfig = {
  jwtSecret,
  jwtAccessExpiresIn: getOptionalEnv('JWT_ACCESS_EXPIRES_IN', '15m'),
  jwtRefreshSecret,
  jwtRefreshExpiresIn: getOptionalEnv('JWT_REFRESH_EXPIRES_IN', '7d'),
  bcryptRounds: getEnvAsNumber('BCRYPT_ROUNDS', 10),
};
```

**4. Actualizar printEnvSummary() (líneas 345-349)**:
```typescript
console.info('SEGURIDAD:');
console.info(
  `  • JWT Access Secret: ${env.security.jwtSecret ? 'Configurado (' + '*'.repeat(32) + ')' : 'No configurado'}`
);
console.info(`  • JWT Access Expires In: ${env.security.jwtAccessExpiresIn}`);
console.info(
  `  • JWT Refresh Secret: ${env.security.jwtRefreshSecret ? 'Configurado (' + '*'.repeat(32) + ')' : 'No configurado'}`
);
console.info(`  • JWT Refresh Expires In: ${env.security.jwtRefreshExpiresIn}`);
console.info(`  • Bcrypt Rounds: ${env.security.bcryptRounds}`);
```

**Resultado esperado**:
- Variables de entorno validadas correctamente
- Secrets con longitud mínima 32 caracteres
- Access y refresh secrets son diferentes
- Valores por defecto apropiados

---

### Subtarea 3: Implementar PasswordService

**Objetivo**: Crear servicio para hashing y verificación de contraseñas con bcrypt.

**Archivo a crear**: `backend/src/services/password.service.ts`

**Funciones a implementar**:

#### 3.1. hashPassword(password: string): Promise<string>

**Propósito**: Genera hash bcrypt de una contraseña.

**Validaciones**:
- Password no vacío
- Longitud mínima (según `PASSWORD_CONFIG.MIN_LENGTH` = 8)
- Longitud máxima (según `PASSWORD_CONFIG.MAX_LENGTH` = 100)

**Lógica**:
1. Validar parámetro de entrada
2. Obtener rounds de bcrypt desde `env.security.bcryptRounds`
3. Generar hash con `bcrypt.hash(password, rounds)`
4. Retornar hash

**Manejo de errores**:
- Lanzar `Error` con mensaje descriptivo si validación falla
- Propagar errores de bcrypt con contexto adicional

#### 3.2. verifyPassword(password: string, hash: string): Promise<boolean>

**Propósito**: Verifica si una contraseña coincide con un hash bcrypt.

**Validaciones**:
- Password y hash no vacíos

**Lógica**:
1. Validar parámetros de entrada
2. Comparar con `bcrypt.compare(password, hash)`
3. Retornar resultado booleano

**Manejo de errores**:
- Retornar `false` si hash es inválido (no lanzar error)
- Propagar errores críticos de bcrypt

**Contenido completo del archivo**:

```typescript
/**
 * Servicio de Hashing de Contraseñas
 *
 * Proporciona funciones para:
 * - Generar hashes bcrypt de contraseñas
 * - Verificar contraseñas contra hashes
 *
 * Usa bcryptjs (implementación pure JavaScript) en lugar de bcrypt nativo
 * para evitar problemas de compilación en diferentes plataformas.
 *
 * Configuración:
 * - Rounds de bcrypt: Desde variable de entorno BCRYPT_ROUNDS (default: 10)
 * - Requisitos de contraseña: Desde PASSWORD_CONFIG en auth.model.ts
 */

import bcrypt from 'bcryptjs';
import { PASSWORD_CONFIG } from '../models/auth.model';
import { env } from '../config/env';

// ============================================================================
// INTERFACES
// ============================================================================

/**
 * Resultado de validación de contraseña
 */
interface PasswordValidationResult {
  valid: boolean;
  errors: string[];
}

// ============================================================================
// FUNCIONES PRIVADAS
// ============================================================================

/**
 * Valida que una contraseña cumpla con los requisitos de longitud
 *
 * @param password - Contraseña a validar
 * @returns Resultado de validación con lista de errores
 */
function validatePasswordRequirements(password: string): PasswordValidationResult {
  const errors: string[] = [];

  if (!password || password.trim() === '') {
    errors.push('La contraseña no puede estar vacía');
  }

  if (password.length < PASSWORD_CONFIG.MIN_LENGTH) {
    errors.push(
      `La contraseña debe tener al menos ${PASSWORD_CONFIG.MIN_LENGTH} caracteres`
    );
  }

  if (password.length > PASSWORD_CONFIG.MAX_LENGTH) {
    errors.push(
      `La contraseña no puede exceder ${PASSWORD_CONFIG.MAX_LENGTH} caracteres`
    );
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

// ============================================================================
// FUNCIONES PÚBLICAS
// ============================================================================

/**
 * Genera un hash bcrypt de una contraseña
 *
 * Usa el número de rounds configurado en BCRYPT_ROUNDS (default: 10).
 * Más rounds = más seguro pero más lento.
 *
 * @param password - Contraseña en texto plano
 * @returns Hash bcrypt de la contraseña
 * @throws Error si la contraseña no cumple requisitos o si bcrypt falla
 *
 * @example
 * ```typescript
 * const hash = await hashPassword('MySecurePass123');
 * // Retorna: '$2a$10$N9qo8...' (60 caracteres)
 * ```
 */
export async function hashPassword(password: string): Promise<string> {
  // Validar requisitos de contraseña
  const validation = validatePasswordRequirements(password);
  if (!validation.valid) {
    throw new Error(
      `Contraseña inválida: ${validation.errors.join(', ')}`
    );
  }

  try {
    // Generar hash usando rounds configurados
    const rounds = env.security.bcryptRounds;
    const hash = await bcrypt.hash(password, rounds);

    return hash;
  } catch (error) {
    // Propagar error con contexto adicional
    const errorMessage =
      error instanceof Error ? error.message : 'Error desconocido';
    throw new Error(`Error al generar hash de contraseña: ${errorMessage}`);
  }
}

/**
 * Verifica si una contraseña coincide con un hash bcrypt
 *
 * Usa comparación segura de bcrypt (timing-attack safe).
 *
 * @param password - Contraseña en texto plano a verificar
 * @param hash - Hash bcrypt almacenado en base de datos
 * @returns `true` si la contraseña coincide, `false` en caso contrario
 *
 * @example
 * ```typescript
 * const isValid = await verifyPassword('MySecurePass123', storedHash);
 * if (isValid) {
 *   console.log('Contraseña correcta');
 * } else {
 *   console.log('Contraseña incorrecta');
 * }
 * ```
 */
export async function verifyPassword(
  password: string,
  hash: string
): Promise<boolean> {
  // Validar parámetros
  if (!password || password.trim() === '') {
    return false;
  }

  if (!hash || hash.trim() === '') {
    return false;
  }

  try {
    // Comparar contraseña con hash
    const isMatch = await bcrypt.compare(password, hash);
    return isMatch;
  } catch (error) {
    // Si el hash es inválido o hay error de bcrypt, retornar false
    // (no lanzar error para evitar revelar información sobre el hash)
    console.error('Error al verificar contraseña:', error);
    return false;
  }
}

/**
 * Genera un hash bcrypt de forma síncrona (solo para testing/seeding)
 *
 * ⚠️ ADVERTENCIA: Esta función es BLOQUEANTE y puede afectar performance.
 * Úsala SOLO en scripts de seed o tests, NUNCA en rutas HTTP.
 *
 * @param password - Contraseña en texto plano
 * @returns Hash bcrypt de la contraseña
 * @throws Error si la contraseña no cumple requisitos
 */
export function hashPasswordSync(password: string): string {
  // Validar requisitos de contraseña
  const validation = validatePasswordRequirements(password);
  if (!validation.valid) {
    throw new Error(
      `Contraseña inválida: ${validation.errors.join(', ')}`
    );
  }

  try {
    const rounds = env.security.bcryptRounds;
    const hash = bcrypt.hashSync(password, rounds);
    return hash;
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : 'Error desconocido';
    throw new Error(`Error al generar hash de contraseña: ${errorMessage}`);
  }
}
```

**Resultado esperado**:
- Archivo creado con 3 funciones exportadas
- Validaciones de contraseña implementadas
- Manejo de errores robusto
- JSDoc completo
- Tipos TypeScript estrictos

---

### Subtarea 4: Implementar JWTService

**Objetivo**: Crear servicio para generación y validación de tokens JWT.

**Archivo a crear**: `backend/src/services/jwt.service.ts`

**Funciones a implementar**:

#### 4.1. generateAccessToken(payload: JWTPayload): string

**Propósito**: Genera access token JWT de corta duración (15 minutos).

**Parámetros**:
- `payload`: Objeto con información del usuario (sub, username, rol)

**Lógica**:
1. Validar payload (campos requeridos)
2. Generar token con `jwt.sign()`:
   - Payload completo
   - Secret: `env.security.jwtSecret`
   - Opciones: `{ expiresIn: env.security.jwtAccessExpiresIn }`
   - Algorithm: HS256 (por defecto)
3. Retornar token string

#### 4.2. generateRefreshToken(): string

**Propósito**: Genera refresh token aleatorio de larga duración (7 días).

**Lógica**:
1. Generar payload simple: `{ type: 'refresh' }`
2. Generar token con `jwt.sign()`:
   - Payload minimal
   - Secret: `env.security.jwtRefreshSecret` (diferente del access)
   - Opciones: `{ expiresIn: env.security.jwtRefreshExpiresIn }`
3. Retornar token string

**Nota**: El refresh token se almacenará en BD hasheado (SHA-256) en el servicio de autenticación.

#### 4.3. verifyAccessToken(token: string): JWTPayload | null

**Propósito**: Valida y decodifica access token.

**Lógica**:
1. Validar token no vacío
2. Verificar token con `jwt.verify()`:
   - Token string
   - Secret: `env.security.jwtSecret`
3. Si válido, retornar payload decodificado como `JWTPayload`
4. Si inválido o expirado, retornar `null` (NO lanzar error)

**Manejo de errores**:
- `JsonWebTokenError`: Token malformado → retornar null
- `TokenExpiredError`: Token expirado → retornar null
- Otros errores: Log y retornar null

#### 4.4. verifyRefreshToken(token: string): boolean

**Propósito**: Valida refresh token (solo verifica firma y expiración).

**Lógica**:
1. Validar token no vacío
2. Verificar token con `jwt.verify()`:
   - Token string
   - Secret: `env.security.jwtRefreshSecret`
3. Retornar `true` si válido, `false` si inválido

**Nota**: La validación completa (revocación, usuario existe) se hará en el servicio de autenticación consultando la tabla `sys_refresh_tokens`.

**Contenido completo del archivo**:

```typescript
/**
 * Servicio de JSON Web Tokens (JWT)
 *
 * Proporciona funciones para:
 * - Generar access tokens (corta duración, información del usuario)
 * - Generar refresh tokens (larga duración, para renovar access tokens)
 * - Verificar y decodificar tokens
 *
 * Estrategia de doble token:
 * - Access Token: Enviado en cada request (Authorization header), expira rápido (15 min)
 * - Refresh Token: Usado para renovar access token, expira lento (7 días)
 *
 * Ver: docs/decisions/002_estrategia_autenticacion.md
 */

import jwt from 'jsonwebtoken';
import { JWTPayload } from '../models/auth.model';
import { env } from '../config/env';

// ============================================================================
// INTERFACES Y TIPOS
// ============================================================================

/**
 * Payload mínimo para refresh token
 */
interface RefreshTokenPayload {
  type: 'refresh';
  jti?: string; // JWT ID (opcional, para rastreo)
}

/**
 * Opciones para firma de JWT
 */
interface SignOptions {
  expiresIn: string;
  algorithm?: 'HS256';
}

// ============================================================================
// FUNCIONES PRIVADAS
// ============================================================================

/**
 * Valida que un payload de access token tenga todos los campos requeridos
 *
 * @param payload - Payload a validar
 * @throws Error si falta algún campo requerido
 */
function validateAccessTokenPayload(payload: Partial<JWTPayload>): void {
  const errors: string[] = [];

  if (!payload.sub || typeof payload.sub !== 'number') {
    errors.push('sub (user ID) es requerido y debe ser un número');
  }

  if (!payload.username || typeof payload.username !== 'string') {
    errors.push('username es requerido y debe ser un string');
  }

  if (!payload.rol || typeof payload.rol !== 'string') {
    errors.push('rol es requerido y debe ser un string');
  }

  if (errors.length > 0) {
    throw new Error(
      `Payload de access token inválido: ${errors.join(', ')}`
    );
  }
}

// ============================================================================
// FUNCIONES PÚBLICAS - ACCESS TOKENS
// ============================================================================

/**
 * Genera un access token JWT
 *
 * Access tokens son de corta duración (15 minutos por defecto) y contienen
 * información del usuario (id, username, rol).
 *
 * @param payload - Información del usuario a incluir en el token
 * @returns Token JWT firmado
 * @throws Error si el payload es inválido
 *
 * @example
 * ```typescript
 * const token = generateAccessToken({
 *   sub: 123,
 *   username: 'supervisor1',
 *   rol: UserRole.SUPERVISOR,
 *   iat: Math.floor(Date.now() / 1000),
 *   exp: Math.floor(Date.now() / 1000) + 900 // 15 minutos
 * });
 * ```
 */
export function generateAccessToken(payload: Omit<JWTPayload, 'iat' | 'exp'>): string {
  // Validar payload
  validateAccessTokenPayload(payload);

  try {
    // Generar token
    const token = jwt.sign(
      payload,
      env.security.jwtSecret,
      {
        expiresIn: env.security.jwtAccessExpiresIn,
        algorithm: 'HS256',
      }
    );

    return token;
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : 'Error desconocido';
    throw new Error(`Error al generar access token: ${errorMessage}`);
  }
}

/**
 * Verifica y decodifica un access token JWT
 *
 * Si el token es válido (firma correcta, no expirado), retorna el payload.
 * Si el token es inválido o expirado, retorna null (no lanza error).
 *
 * @param token - Token JWT a verificar
 * @returns Payload decodificado si es válido, null si es inválido
 *
 * @example
 * ```typescript
 * const payload = verifyAccessToken(req.headers.authorization);
 * if (payload) {
 *   console.log(`Usuario autenticado: ${payload.username}`);
 *   req.user = payload;
 * } else {
 *   return res.status(401).json({ error: 'Token inválido' });
 * }
 * ```
 */
export function verifyAccessToken(token: string): JWTPayload | null {
  // Validar parámetro
  if (!token || token.trim() === '') {
    return null;
  }

  try {
    // Verificar y decodificar token
    const decoded = jwt.verify(token, env.security.jwtSecret, {
      algorithms: ['HS256'],
    }) as JWTPayload;

    return decoded;
  } catch (error) {
    // Token inválido, expirado, o error de verificación
    if (error instanceof jwt.JsonWebTokenError) {
      // Token malformado o firma inválida
      console.debug('Access token inválido:', error.message);
      return null;
    } else if (error instanceof jwt.TokenExpiredError) {
      // Token expirado
      console.debug('Access token expirado:', error.message);
      return null;
    } else {
      // Otro error (raro)
      console.error('Error al verificar access token:', error);
      return null;
    }
  }
}

// ============================================================================
// FUNCIONES PÚBLICAS - REFRESH TOKENS
// ============================================================================

/**
 * Genera un refresh token JWT
 *
 * Refresh tokens son de larga duración (7 días por defecto) y contienen
 * información mínima (solo type: 'refresh').
 *
 * El token completo debe almacenarse hasheado (SHA-256) en la base de datos
 * en la tabla sys_refresh_tokens para permitir revocación.
 *
 * @returns Token JWT firmado
 *
 * @example
 * ```typescript
 * const refreshToken = generateRefreshToken();
 * const tokenHash = crypto.createHash('sha256').update(refreshToken).digest('hex');
 * // Almacenar tokenHash en sys_refresh_tokens
 * ```
 */
export function generateRefreshToken(): string {
  try {
    // Payload mínimo para refresh token
    const payload: RefreshTokenPayload = {
      type: 'refresh',
      // jti: Se puede agregar JWT ID para rastreo si se necesita
    };

    // Generar token
    const token = jwt.sign(
      payload,
      env.security.jwtRefreshSecret,
      {
        expiresIn: env.security.jwtRefreshExpiresIn,
        algorithm: 'HS256',
      }
    );

    return token;
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : 'Error desconocido';
    throw new Error(`Error al generar refresh token: ${errorMessage}`);
  }
}

/**
 * Verifica un refresh token JWT
 *
 * Solo valida firma y expiración. NO valida revocación.
 * La validación completa (revocación, usuario existe) debe hacerse
 * consultando la tabla sys_refresh_tokens en el servicio de autenticación.
 *
 * @param token - Token JWT a verificar
 * @returns `true` si el token es válido, `false` si es inválido o expirado
 *
 * @example
 * ```typescript
 * if (!verifyRefreshToken(refreshToken)) {
 *   return res.status(401).json({ error: 'Refresh token inválido' });
 * }
 *
 * // Verificar en BD si está revocado
 * const tokenHash = crypto.createHash('sha256').update(refreshToken).digest('hex');
 * const tokenRecord = await db.query('SELECT * FROM sys_refresh_tokens WHERE token_hash = ?', [tokenHash]);
 * if (!tokenRecord || tokenRecord.revocado) {
 *   return res.status(401).json({ error: 'Refresh token revocado' });
 * }
 * ```
 */
export function verifyRefreshToken(token: string): boolean {
  // Validar parámetro
  if (!token || token.trim() === '') {
    return false;
  }

  try {
    // Verificar token (solo firma y expiración)
    jwt.verify(token, env.security.jwtRefreshSecret, {
      algorithms: ['HS256'],
    });

    return true;
  } catch (error) {
    // Token inválido o expirado
    if (error instanceof jwt.JsonWebTokenError) {
      console.debug('Refresh token inválido:', error.message);
      return false;
    } else if (error instanceof jwt.TokenExpiredError) {
      console.debug('Refresh token expirado:', error.message);
      return false;
    } else {
      console.error('Error al verificar refresh token:', error);
      return false;
    }
  }
}

// ============================================================================
// FUNCIONES DE UTILIDAD
// ============================================================================

/**
 * Decodifica un token JWT sin verificar la firma (solo para debugging)
 *
 * ⚠️ ADVERTENCIA: NO usar esta función para validación de autenticación.
 * Solo para debugging, logs, o inspección de tokens.
 *
 * @param token - Token JWT a decodificar
 * @returns Payload decodificado o null si el token es inválido
 */
export function decodeTokenWithoutVerification(token: string): any | null {
  try {
    const decoded = jwt.decode(token);
    return decoded;
  } catch (error) {
    return null;
  }
}
```

**Resultado esperado**:
- Archivo creado con 5 funciones exportadas
- Access token con payload completo del usuario
- Refresh token con payload mínimo
- Verificación robusta con manejo de errores
- JSDoc completo con ejemplos

---

### Subtarea 5: Crear tests unitarios para PasswordService

**Objetivo**: Crear suite de tests para `password.service.ts`.

**Archivo a crear**: `backend/tests/services/password.service.test.ts`

**Estructura de directorios**:
```
backend/tests/
├── services/
│   ├── password.service.test.ts (nuevo)
│   └── jwt.service.test.ts (siguiente subtarea)
```

**Tests a implementar**:

**Suite: PasswordService**

1. **describe('hashPassword')**:
   - ✅ Debería generar hash de contraseña válida
   - ✅ Debería generar hashes diferentes para la misma contraseña (salt aleatorio)
   - ✅ Debería rechazar contraseña vacía
   - ✅ Debería rechazar contraseña < 8 caracteres
   - ✅ Debería rechazar contraseña > 100 caracteres
   - ✅ Debería generar hash con formato bcrypt correcto ($2a$10$...)

2. **describe('verifyPassword')**:
   - ✅ Debería retornar true para contraseña correcta
   - ✅ Debería retornar false para contraseña incorrecta
   - ✅ Debería retornar false para hash inválido
   - ✅ Debería retornar false para contraseña vacía
   - ✅ Debería retornar false para hash vacío
   - ✅ Debería ser timing-attack safe (verificar con múltiples iteraciones)

3. **describe('hashPasswordSync')**:
   - ✅ Debería generar hash de forma síncrona
   - ✅ Debería generar mismo formato que hashPassword async

**Configuración de Jest**:
- Timeout: 10000ms (bcrypt puede ser lento)
- Mock de `env.security.bcryptRounds` si es necesario

**Contenido completo del archivo**:

```typescript
/**
 * Tests Unitarios - PasswordService
 *
 * Pruebas para:
 * - Generación de hashes bcrypt
 * - Verificación de contraseñas
 * - Validaciones de requisitos
 */

import {
  hashPassword,
  verifyPassword,
  hashPasswordSync,
} from '../../src/services/password.service';
import { PASSWORD_CONFIG } from '../../src/models/auth.model';

// Aumentar timeout para bcrypt (puede ser lento)
jest.setTimeout(10000);

describe('PasswordService', () => {
  // ============================================================================
  // hashPassword()
  // ============================================================================

  describe('hashPassword', () => {
    it('debería generar hash de contraseña válida', async () => {
      const password = 'MySecurePass123';
      const hash = await hashPassword(password);

      // Verificar que retorna un string
      expect(typeof hash).toBe('string');

      // Verificar formato bcrypt ($2a$rounds$salt+hash, 60 caracteres)
      expect(hash).toMatch(/^\$2[aby]\$\d{2}\$.{53}$/);
    });

    it('debería generar hashes diferentes para la misma contraseña', async () => {
      const password = 'SamePassword123';
      const hash1 = await hashPassword(password);
      const hash2 = await hashPassword(password);

      // Los hashes deben ser diferentes (salt aleatorio)
      expect(hash1).not.toBe(hash2);
    });

    it('debería rechazar contraseña vacía', async () => {
      await expect(hashPassword('')).rejects.toThrow(
        'Contraseña inválida'
      );
    });

    it('debería rechazar contraseña con solo espacios', async () => {
      await expect(hashPassword('   ')).rejects.toThrow(
        'Contraseña inválida'
      );
    });

    it('debería rechazar contraseña demasiado corta', async () => {
      const shortPassword = 'a'.repeat(PASSWORD_CONFIG.MIN_LENGTH - 1);
      await expect(hashPassword(shortPassword)).rejects.toThrow(
        `al menos ${PASSWORD_CONFIG.MIN_LENGTH} caracteres`
      );
    });

    it('debería rechazar contraseña demasiado larga', async () => {
      const longPassword = 'a'.repeat(PASSWORD_CONFIG.MAX_LENGTH + 1);
      await expect(hashPassword(longPassword)).rejects.toThrow(
        `no puede exceder ${PASSWORD_CONFIG.MAX_LENGTH} caracteres`
      );
    });

    it('debería aceptar contraseña de longitud mínima exacta', async () => {
      const minPassword = 'a'.repeat(PASSWORD_CONFIG.MIN_LENGTH);
      const hash = await hashPassword(minPassword);
      expect(hash).toMatch(/^\$2[aby]\$/);
    });

    it('debería aceptar contraseña de longitud máxima exacta', async () => {
      const maxPassword = 'a'.repeat(PASSWORD_CONFIG.MAX_LENGTH);
      const hash = await hashPassword(maxPassword);
      expect(hash).toMatch(/^\$2[aby]\$/);
    });

    it('debería generar hash con formato bcrypt correcto', async () => {
      const password = 'TestPassword123';
      const hash = await hashPassword(password);

      // Formato: $2a$10$... (60 caracteres total)
      expect(hash.length).toBe(60);
      expect(hash.startsWith('$2')).toBe(true);
    });
  });

  // ============================================================================
  // verifyPassword()
  // ============================================================================

  describe('verifyPassword', () => {
    it('debería retornar true para contraseña correcta', async () => {
      const password = 'CorrectPassword123';
      const hash = await hashPassword(password);

      const isValid = await verifyPassword(password, hash);
      expect(isValid).toBe(true);
    });

    it('debería retornar false para contraseña incorrecta', async () => {
      const correctPassword = 'CorrectPassword123';
      const wrongPassword = 'WrongPassword123';
      const hash = await hashPassword(correctPassword);

      const isValid = await verifyPassword(wrongPassword, hash);
      expect(isValid).toBe(false);
    });

    it('debería retornar false para hash inválido', async () => {
      const password = 'TestPassword123';
      const invalidHash = 'not_a_valid_bcrypt_hash';

      const isValid = await verifyPassword(password, invalidHash);
      expect(isValid).toBe(false);
    });

    it('debería retornar false para contraseña vacía', async () => {
      const hash = await hashPassword('SomePassword123');

      const isValid = await verifyPassword('', hash);
      expect(isValid).toBe(false);
    });

    it('debería retornar false para hash vacío', async () => {
      const password = 'SomePassword123';

      const isValid = await verifyPassword(password, '');
      expect(isValid).toBe(false);
    });

    it('debería funcionar con contraseñas especiales', async () => {
      const specialPassword = 'P@ssw0rd!#$%^&*()_+=-{}[]|\\:";\'<>?,./';
      const hash = await hashPassword(specialPassword);

      const isValid = await verifyPassword(specialPassword, hash);
      expect(isValid).toBe(true);
    });

    it('debería ser case-sensitive', async () => {
      const password = 'CaseSensitive123';
      const hash = await hashPassword(password);

      const isValidLower = await verifyPassword('casesensitive123', hash);
      const isValidUpper = await verifyPassword('CASESENSITIVE123', hash);
      const isValidCorrect = await verifyPassword(password, hash);

      expect(isValidLower).toBe(false);
      expect(isValidUpper).toBe(false);
      expect(isValidCorrect).toBe(true);
    });

    it('debería manejar múltiples verificaciones del mismo hash', async () => {
      const password = 'ReuseTest123';
      const hash = await hashPassword(password);

      // Verificar 5 veces
      for (let i = 0; i < 5; i++) {
        const isValid = await verifyPassword(password, hash);
        expect(isValid).toBe(true);
      }
    });
  });

  // ============================================================================
  // hashPasswordSync()
  // ============================================================================

  describe('hashPasswordSync', () => {
    it('debería generar hash de forma síncrona', () => {
      const password = 'SyncPassword123';
      const hash = hashPasswordSync(password);

      expect(typeof hash).toBe('string');
      expect(hash).toMatch(/^\$2[aby]\$/);
    });

    it('debería generar hash compatible con verifyPassword async', async () => {
      const password = 'CompatibilityTest123';
      const syncHash = hashPasswordSync(password);

      const isValid = await verifyPassword(password, syncHash);
      expect(isValid).toBe(true);
    });

    it('debería rechazar contraseña inválida', () => {
      expect(() => hashPasswordSync('')).toThrow('Contraseña inválida');
    });
  });

  // ============================================================================
  // Tests de Integración
  // ============================================================================

  describe('Integración hashPassword + verifyPassword', () => {
    it('debería funcionar end-to-end con contraseña típica', async () => {
      const password = 'User123Pass!';

      // Generar hash
      const hash = await hashPassword(password);
      expect(hash).toBeDefined();

      // Verificar contraseña correcta
      const isValid = await verifyPassword(password, hash);
      expect(isValid).toBe(true);

      // Verificar contraseña incorrecta
      const isInvalid = await verifyPassword('WrongPassword!', hash);
      expect(isInvalid).toBe(false);
    });

    it('debería funcionar con múltiples usuarios diferentes', async () => {
      const users = [
        { password: 'User1Password!' },
        { password: 'User2SecurePass123' },
        { password: 'Admin!SuperSecure456' },
      ];

      // Generar hashes para cada usuario
      const hashes = await Promise.all(
        users.map(async (user) => {
          const hash = await hashPassword(user.password);
          return { password: user.password, hash };
        })
      );

      // Verificar que cada hash solo valide su contraseña
      for (let i = 0; i < hashes.length; i++) {
        const { password, hash } = hashes[i];

        // Verificar contraseña correcta
        const isValid = await verifyPassword(password, hash);
        expect(isValid).toBe(true);

        // Verificar que otras contraseñas no funcionen
        for (let j = 0; j < hashes.length; j++) {
          if (i !== j) {
            const otherPassword = hashes[j].password;
            const isInvalid = await verifyPassword(otherPassword, hash);
            expect(isInvalid).toBe(false);
          }
        }
      }
    });
  });
});
```

**Resultado esperado**:
- Archivo de tests creado
- 20+ casos de prueba
- Cobertura > 95% de password.service.ts
- Todos los tests pasando

**Ejecución**:
```bash
npm test -- password.service.test.ts
```

---

### Subtarea 6: Crear tests unitarios para JWTService

**Objetivo**: Crear suite de tests para `jwt.service.ts`.

**Archivo a crear**: `backend/tests/services/jwt.service.test.ts`

**Tests a implementar**:

**Suite: JWTService**

1. **describe('generateAccessToken')**:
   - ✅ Debería generar access token válido
   - ✅ Debería incluir todos los campos del payload
   - ✅ Debería generar tokens diferentes cada vez (timestamp iat diferente)
   - ✅ Debería rechazar payload sin sub
   - ✅ Debería rechazar payload sin username
   - ✅ Debería rechazar payload sin rol
   - ✅ Debería incluir claim exp (expiration)
   - ✅ Debería incluir claim iat (issued at)

2. **describe('verifyAccessToken')**:
   - ✅ Debería retornar payload para token válido
   - ✅ Debería retornar null para token inválido
   - ✅ Debería retornar null para token expirado (mock time)
   - ✅ Debería retornar null para token con firma incorrecta
   - ✅ Debería retornar null para token vacío
   - ✅ Debería retornar null para string que no es JWT

3. **describe('generateRefreshToken')**:
   - ✅ Debería generar refresh token válido
   - ✅ Debería incluir type: 'refresh' en payload
   - ✅ Debería generar tokens diferentes cada vez

4. **describe('verifyRefreshToken')**:
   - ✅ Debería retornar true para refresh token válido
   - ✅ Debería retornar false para refresh token inválido
   - ✅ Debería retornar false para access token (secret diferente)
   - ✅ Debería retornar false para token expirado
   - ✅ Debería retornar false para token vacío

5. **describe('decodeTokenWithoutVerification')**:
   - ✅ Debería decodificar token sin verificar firma
   - ✅ Debería retornar null para string inválido

**Contenido completo del archivo**:

```typescript
/**
 * Tests Unitarios - JWTService
 *
 * Pruebas para:
 * - Generación de access tokens
 * - Generación de refresh tokens
 * - Verificación de tokens
 */

import {
  generateAccessToken,
  generateRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
  decodeTokenWithoutVerification,
} from '../../src/services/jwt.service';
import { UserRole } from '../../src/models/auth.model';
import jwt from 'jsonwebtoken';

describe('JWTService', () => {
  // ============================================================================
  // generateAccessToken()
  // ============================================================================

  describe('generateAccessToken', () => {
    it('debería generar access token válido', () => {
      const payload = {
        sub: 123,
        username: 'testuser',
        rol: UserRole.SUPERVISOR,
      };

      const token = generateAccessToken(payload);

      // Verificar que retorna un string
      expect(typeof token).toBe('string');

      // Verificar formato JWT (3 partes separadas por puntos)
      expect(token.split('.').length).toBe(3);
    });

    it('debería incluir todos los campos del payload', () => {
      const payload = {
        sub: 456,
        username: 'adminuser',
        rol: UserRole.ADMIN,
      };

      const token = generateAccessToken(payload);
      const decoded = decodeTokenWithoutVerification(token);

      expect(decoded.sub).toBe(456);
      expect(decoded.username).toBe('adminuser');
      expect(decoded.rol).toBe(UserRole.ADMIN);
    });

    it('debería generar tokens diferentes cada vez', () => {
      const payload = {
        sub: 789,
        username: 'user1',
        rol: UserRole.CONSULTA,
      };

      const token1 = generateAccessToken(payload);
      // Esperar 1ms para que iat sea diferente
      const token2 = generateAccessToken(payload);

      expect(token1).not.toBe(token2);
    });

    it('debería rechazar payload sin sub', () => {
      const payload = {
        username: 'testuser',
        rol: UserRole.SUPERVISOR,
      } as any;

      expect(() => generateAccessToken(payload)).toThrow(
        'sub (user ID) es requerido'
      );
    });

    it('debería rechazar payload sin username', () => {
      const payload = {
        sub: 123,
        rol: UserRole.SUPERVISOR,
      } as any;

      expect(() => generateAccessToken(payload)).toThrow(
        'username es requerido'
      );
    });

    it('debería rechazar payload sin rol', () => {
      const payload = {
        sub: 123,
        username: 'testuser',
      } as any;

      expect(() => generateAccessToken(payload)).toThrow(
        'rol es requerido'
      );
    });

    it('debería incluir claim exp (expiration)', () => {
      const payload = {
        sub: 123,
        username: 'testuser',
        rol: UserRole.SUPERVISOR,
      };

      const token = generateAccessToken(payload);
      const decoded = decodeTokenWithoutVerification(token);

      expect(decoded.exp).toBeDefined();
      expect(typeof decoded.exp).toBe('number');
      expect(decoded.exp).toBeGreaterThan(Math.floor(Date.now() / 1000));
    });

    it('debería incluir claim iat (issued at)', () => {
      const payload = {
        sub: 123,
        username: 'testuser',
        rol: UserRole.SUPERVISOR,
      };

      const token = generateAccessToken(payload);
      const decoded = decodeTokenWithoutVerification(token);

      expect(decoded.iat).toBeDefined();
      expect(typeof decoded.iat).toBe('number');
    });
  });

  // ============================================================================
  // verifyAccessToken()
  // ============================================================================

  describe('verifyAccessToken', () => {
    it('debería retornar payload para token válido', () => {
      const payload = {
        sub: 123,
        username: 'testuser',
        rol: UserRole.SUPERVISOR,
      };

      const token = generateAccessToken(payload);
      const verified = verifyAccessToken(token);

      expect(verified).not.toBeNull();
      expect(verified?.sub).toBe(123);
      expect(verified?.username).toBe('testuser');
      expect(verified?.rol).toBe(UserRole.SUPERVISOR);
    });

    it('debería retornar null para token inválido', () => {
      const invalidToken = 'not.a.valid.jwt.token';

      const verified = verifyAccessToken(invalidToken);
      expect(verified).toBeNull();
    });

    it('debería retornar null para token con firma incorrecta', () => {
      // Generar token con secret diferente
      const fakeToken = jwt.sign(
        { sub: 123, username: 'fake', rol: UserRole.ADMIN },
        'wrong_secret',
        { expiresIn: '15m' }
      );

      const verified = verifyAccessToken(fakeToken);
      expect(verified).toBeNull();
    });

    it('debería retornar null para token vacío', () => {
      const verified = verifyAccessToken('');
      expect(verified).toBeNull();
    });

    it('debería retornar null para string que no es JWT', () => {
      const notAToken = 'this_is_not_a_jwt_token_at_all';

      const verified = verifyAccessToken(notAToken);
      expect(verified).toBeNull();
    });

    it('debería retornar null para token expirado', () => {
      // Generar token con expiración inmediata
      const payload = {
        sub: 123,
        username: 'testuser',
        rol: UserRole.SUPERVISOR,
      };

      // Importar env para acceder al secret
      const { env } = require('../../src/config/env');

      const expiredToken = jwt.sign(payload, env.security.jwtSecret, {
        expiresIn: '0s', // Expira inmediatamente
      });

      // Esperar 1 segundo para asegurar expiración
      return new Promise<void>((resolve) => {
        setTimeout(() => {
          const verified = verifyAccessToken(expiredToken);
          expect(verified).toBeNull();
          resolve();
        }, 1000);
      });
    });
  });

  // ============================================================================
  // generateRefreshToken()
  // ============================================================================

  describe('generateRefreshToken', () => {
    it('debería generar refresh token válido', () => {
      const token = generateRefreshToken();

      expect(typeof token).toBe('string');
      expect(token.split('.').length).toBe(3);
    });

    it('debería incluir type: refresh en payload', () => {
      const token = generateRefreshToken();
      const decoded = decodeTokenWithoutVerification(token);

      expect(decoded.type).toBe('refresh');
    });

    it('debería generar tokens diferentes cada vez', () => {
      const token1 = generateRefreshToken();
      const token2 = generateRefreshToken();

      expect(token1).not.toBe(token2);
    });

    it('debería incluir claim exp', () => {
      const token = generateRefreshToken();
      const decoded = decodeTokenWithoutVerification(token);

      expect(decoded.exp).toBeDefined();
      expect(typeof decoded.exp).toBe('number');
    });
  });

  // ============================================================================
  // verifyRefreshToken()
  // ============================================================================

  describe('verifyRefreshToken', () => {
    it('debería retornar true para refresh token válido', () => {
      const token = generateRefreshToken();

      const isValid = verifyRefreshToken(token);
      expect(isValid).toBe(true);
    });

    it('debería retornar false para refresh token inválido', () => {
      const invalidToken = 'not.a.valid.jwt.token';

      const isValid = verifyRefreshToken(invalidToken);
      expect(isValid).toBe(false);
    });

    it('debería retornar false para access token (secret diferente)', () => {
      const accessToken = generateAccessToken({
        sub: 123,
        username: 'test',
        rol: UserRole.SUPERVISOR,
      });

      // Access token usa secret diferente, no debe validar como refresh
      const isValid = verifyRefreshToken(accessToken);
      expect(isValid).toBe(false);
    });

    it('debería retornar false para token vacío', () => {
      const isValid = verifyRefreshToken('');
      expect(isValid).toBe(false);
    });

    it('debería retornar false para token con firma incorrecta', () => {
      const fakeToken = jwt.sign({ type: 'refresh' }, 'wrong_secret', {
        expiresIn: '7d',
      });

      const isValid = verifyRefreshToken(fakeToken);
      expect(isValid).toBe(false);
    });
  });

  // ============================================================================
  // decodeTokenWithoutVerification()
  // ============================================================================

  describe('decodeTokenWithoutVerification', () => {
    it('debería decodificar access token sin verificar firma', () => {
      const payload = {
        sub: 123,
        username: 'testuser',
        rol: UserRole.ADMIN,
      };

      const token = generateAccessToken(payload);
      const decoded = decodeTokenWithoutVerification(token);

      expect(decoded).not.toBeNull();
      expect(decoded.sub).toBe(123);
      expect(decoded.username).toBe('testuser');
    });

    it('debería decodificar refresh token sin verificar firma', () => {
      const token = generateRefreshToken();
      const decoded = decodeTokenWithoutVerification(token);

      expect(decoded).not.toBeNull();
      expect(decoded.type).toBe('refresh');
    });

    it('debería retornar null para string inválido', () => {
      const decoded = decodeTokenWithoutVerification('not_a_jwt');
      expect(decoded).toBeNull();
    });

    it('debería decodificar token expirado', () => {
      const { env } = require('../../src/config/env');

      const expiredToken = jwt.sign(
        { sub: 123, username: 'test', rol: UserRole.SUPERVISOR },
        env.security.jwtSecret,
        { expiresIn: '0s' }
      );

      // Decode debe funcionar incluso si está expirado
      const decoded = decodeTokenWithoutVerification(expiredToken);
      expect(decoded).not.toBeNull();
      expect(decoded.sub).toBe(123);
    });
  });

  // ============================================================================
  // Tests de Integración
  // ============================================================================

  describe('Integración Access + Refresh Tokens', () => {
    it('debería generar y verificar ambos tipos de tokens', () => {
      // Generar access token
      const accessPayload = {
        sub: 456,
        username: 'integrationuser',
        rol: UserRole.SUPERVISOR,
      };
      const accessToken = generateAccessToken(accessPayload);

      // Generar refresh token
      const refreshToken = generateRefreshToken();

      // Verificar access token
      const verifiedAccess = verifyAccessToken(accessToken);
      expect(verifiedAccess).not.toBeNull();
      expect(verifiedAccess?.sub).toBe(456);

      // Verificar refresh token
      const verifiedRefresh = verifyRefreshToken(refreshToken);
      expect(verifiedRefresh).toBe(true);
    });

    it('debería usar secrets diferentes para cada tipo de token', () => {
      const accessToken = generateAccessToken({
        sub: 123,
        username: 'test',
        rol: UserRole.ADMIN,
      });

      const refreshToken = generateRefreshToken();

      // Access token NO debe validar con verifyRefreshToken
      expect(verifyRefreshToken(accessToken)).toBe(false);

      // Refresh token NO debe decodificar correctamente con verifyAccessToken
      expect(verifyAccessToken(refreshToken)).toBeNull();
    });
  });
});
```

**Resultado esperado**:
- Archivo de tests creado
- 30+ casos de prueba
- Cobertura > 95% de jwt.service.ts
- Todos los tests pasando

**Ejecución**:
```bash
npm test -- jwt.service.test.ts
```

---

### Subtarea 7: Actualizar documentación en README

**Objetivo**: Documentar los nuevos servicios en `backend/README.md`.

**Archivo a modificar**: `backend/README.md`

**Sección a agregar**: "Servicios de Autenticación" (después de "Modelos de Datos")

**Contenido a agregar**:

```markdown
## Servicios de Autenticación

### PasswordService

Servicio para hashing seguro de contraseñas usando bcrypt.

**Ubicación**: `src/services/password.service.ts`

**Funciones disponibles**:

#### `hashPassword(password: string): Promise<string>`

Genera un hash bcrypt de una contraseña.

**Características**:
- Usa bcrypt con 10 rounds configurables (variable `BCRYPT_ROUNDS`)
- Valida longitud mínima (8 caracteres) y máxima (100 caracteres)
- Salt aleatorio único por cada hash
- Operación asíncrona (no bloqueante)

**Ejemplo de uso**:
```typescript
import { hashPassword } from './services/password.service';

// En controlador de registro de usuario
async function createUser(username: string, password: string) {
  const passwordHash = await hashPassword(password);

  await db.execute(
    'INSERT INTO sys_usuarios (username, password_hash) VALUES (?, ?)',
    [username, passwordHash]
  );
}
```

**Errores**:
- Lanza `Error` si la contraseña no cumple requisitos (< 8 o > 100 caracteres)
- Propaga errores de bcrypt con contexto adicional

---

#### `verifyPassword(password: string, hash: string): Promise<boolean>`

Verifica si una contraseña coincide con un hash bcrypt.

**Características**:
- Comparación segura (timing-attack safe)
- Retorna `boolean` (nunca lanza error)
- Retorna `false` para hashes inválidos o errores

**Ejemplo de uso**:
```typescript
import { verifyPassword } from './services/password.service';

// En controlador de login
async function login(username: string, password: string) {
  // Obtener usuario de BD
  const [users] = await db.execute(
    'SELECT id_usuario, password_hash FROM sys_usuarios WHERE username = ?',
    [username]
  );

  if (users.length === 0) {
    return { success: false, message: 'Usuario no encontrado' };
  }

  const user = users[0];

  // Verificar contraseña
  const isValid = await verifyPassword(password, user.password_hash);

  if (!isValid) {
    return { success: false, message: 'Contraseña incorrecta' };
  }

  return { success: true, userId: user.id_usuario };
}
```

---

#### `hashPasswordSync(password: string): string`

Versión síncrona de `hashPassword()`.

**⚠️ ADVERTENCIA**: Esta función es BLOQUEANTE y puede afectar performance.

**Uso recomendado**:
- Scripts de seed/migración
- Tests unitarios
- Ambientes donde bloquear el event loop no es crítico

**NO usar en**:
- Rutas HTTP/API endpoints
- Operaciones durante requests de usuarios
- Código de producción en tiempo real

**Ejemplo de uso**:
```typescript
import { hashPasswordSync } from './services/password.service';

// En script de seed
function seedAdminUser() {
  const adminPassword = 'Admin123!';
  const passwordHash = hashPasswordSync(adminPassword);

  db.execute(
    'INSERT INTO sys_usuarios (username, password_hash, rol) VALUES (?, ?, ?)',
    ['admin', passwordHash, 'ADMIN']
  );

  console.log('✅ Usuario admin creado');
}
```

---

### JWTService

Servicio para generación y validación de tokens JWT.

**Ubicación**: `src/services/jwt.service.ts`

**Estrategia**: Doble token (Access + Refresh)
- **Access Token**: Corta duración (15 min), información completa del usuario
- **Refresh Token**: Larga duración (7 días), usado para renovar access tokens

**Ver**: `docs/decisions/002_estrategia_autenticacion.md` para detalles completos

**Funciones disponibles**:

#### `generateAccessToken(payload: Omit<JWTPayload, 'iat' | 'exp'>): string`

Genera un access token JWT.

**Parámetros del payload**:
- `sub` (number): ID del usuario
- `username` (string): Nombre de usuario
- `rol` (UserRole): Rol del usuario (ADMIN | SUPERVISOR | CONSULTA)

**Características**:
- Expiración: 15 minutos (configurable con `JWT_ACCESS_EXPIRES_IN`)
- Secret: `JWT_SECRET` (variable de entorno)
- Algorithm: HS256 (HMAC SHA-256)
- Claims automáticos: `iat` (issued at), `exp` (expiration)

**Ejemplo de uso**:
```typescript
import { generateAccessToken } from './services/jwt.service';
import { UserRole } from './models/auth.model';

// En controlador de login exitoso
async function handleLoginSuccess(user) {
  const accessToken = generateAccessToken({
    sub: user.id_usuario,
    username: user.username,
    rol: user.rol as UserRole,
  });

  return {
    accessToken,
    user: {
      id: user.id_usuario,
      username: user.username,
      rol: user.rol,
    },
  };
}
```

**Errores**:
- Lanza `Error` si el payload no incluye `sub`, `username`, o `rol`
- Propaga errores de jsonwebtoken

---

#### `verifyAccessToken(token: string): JWTPayload | null`

Verifica y decodifica un access token.

**Retorno**:
- `JWTPayload` si el token es válido
- `null` si el token es inválido, expirado, o malformado

**Características**:
- NO lanza errores (retorna `null` en todos los casos de fallo)
- Verifica firma con `JWT_SECRET`
- Verifica expiración automáticamente
- Verifica algoritmo (solo permite HS256)

**Ejemplo de uso**:
```typescript
import { verifyAccessToken } from './services/jwt.service';

// En middleware de autenticación
export function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Token no proporcionado' });
  }

  const token = authHeader.substring(7); // Quitar "Bearer "

  const payload = verifyAccessToken(token);

  if (!payload) {
    return res.status(401).json({ error: 'Token inválido o expirado' });
  }

  // Agregar información del usuario al request
  req.user = payload;
  next();
}
```

---

#### `generateRefreshToken(): string`

Genera un refresh token JWT.

**Características**:
- Expiración: 7 días (configurable con `JWT_REFRESH_EXPIRES_IN`)
- Secret: `JWT_REFRESH_SECRET` (diferente de access token)
- Payload mínimo: `{ type: 'refresh' }`
- Algorithm: HS256

**IMPORTANTE**: El refresh token completo debe almacenarse **hasheado** (SHA-256) en la tabla `sys_refresh_tokens` para permitir revocación.

**Ejemplo de uso**:
```typescript
import { generateRefreshToken } from './services/jwt.service';
import crypto from 'crypto';

// En controlador de login exitoso
async function handleLogin(user) {
  const accessToken = generateAccessToken({
    sub: user.id_usuario,
    username: user.username,
    rol: user.rol,
  });

  const refreshToken = generateRefreshToken();

  // Hashear refresh token antes de almacenar
  const tokenHash = crypto
    .createHash('sha256')
    .update(refreshToken)
    .digest('hex');

  // Almacenar en BD
  const expirationDate = new Date();
  expirationDate.setDate(expirationDate.getDate() + 7); // 7 días

  await db.execute(
    `INSERT INTO sys_refresh_tokens
     (id_usuario, token_hash, fecha_expiracion, ip_address, user_agent)
     VALUES (?, ?, ?, ?, ?)`,
    [
      user.id_usuario,
      tokenHash,
      expirationDate,
      req.ip,
      req.headers['user-agent'],
    ]
  );

  // Retornar token completo al cliente (NO el hash)
  return {
    accessToken,
    refreshToken, // Cliente almacena esto
    user: { ... },
  };
}
```

---

#### `verifyRefreshToken(token: string): boolean`

Verifica un refresh token (solo firma y expiración).

**Retorno**:
- `true` si el token es válido
- `false` si el token es inválido o expirado

**IMPORTANTE**: Esta función solo valida la firma y expiración. Para validación completa, debes:
1. Verificar con `verifyRefreshToken()` (firma + expiración)
2. Hashear el token y buscar en tabla `sys_refresh_tokens`
3. Verificar que no esté revocado (`revocado = FALSE`)
4. Verificar que el usuario aún exista y esté activo

**Ejemplo de uso**:
```typescript
import { verifyRefreshToken } from './services/jwt.service';
import crypto from 'crypto';

// En endpoint POST /auth/refresh
export async function refreshAccessToken(req, res) {
  const { refreshToken } = req.body;

  // 1. Verificar firma y expiración
  if (!verifyRefreshToken(refreshToken)) {
    return res.status(401).json({ error: 'Refresh token inválido' });
  }

  // 2. Hashear token para buscar en BD
  const tokenHash = crypto
    .createHash('sha256')
    .update(refreshToken)
    .digest('hex');

  // 3. Buscar token en BD
  const [rows] = await db.execute(
    `SELECT rt.*, u.username, u.rol
     FROM sys_refresh_tokens rt
     JOIN sys_usuarios u ON rt.id_usuario = u.id_usuario
     WHERE rt.token_hash = ?
       AND rt.revocado = FALSE
       AND rt.fecha_expiracion > NOW()
       AND u.activo = TRUE`,
    [tokenHash]
  );

  if (rows.length === 0) {
    return res.status(401).json({ error: 'Refresh token revocado o inválido' });
  }

  const tokenRecord = rows[0];

  // 4. Generar nuevo access token
  const newAccessToken = generateAccessToken({
    sub: tokenRecord.id_usuario,
    username: tokenRecord.username,
    rol: tokenRecord.rol,
  });

  // 5. Retornar nuevo access token
  return res.json({ accessToken: newAccessToken });
}
```

---

#### `decodeTokenWithoutVerification(token: string): any | null`

Decodifica un token JWT sin verificar la firma.

**⚠️ ADVERTENCIA**: NO usar esta función para autenticación. Solo para debugging, logs, o inspección de tokens.

**Ejemplo de uso**:
```typescript
import { decodeTokenWithoutVerification } from './services/jwt.service';

// En log de auditoría
function logTokenInfo(token: string) {
  const decoded = decodeTokenWithoutVerification(token);

  if (decoded) {
    console.log('Token info:', {
      userId: decoded.sub,
      username: decoded.username,
      issuedAt: new Date(decoded.iat * 1000),
      expiresAt: new Date(decoded.exp * 1000),
    });
  }
}
```

---

### Variables de Entorno Requeridas

Las siguientes variables deben estar configuradas en el archivo `.env`:

```bash
# Secrets para JWT (mínimo 32 caracteres cada uno)
JWT_SECRET=<secret_para_access_tokens>
JWT_REFRESH_SECRET=<secret_para_refresh_tokens>

# Expiración de tokens
JWT_ACCESS_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

# Rounds de bcrypt para hashing
BCRYPT_ROUNDS=10
```

**Generar secrets seguros**:
```bash
# En terminal (Node.js)
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# En terminal (OpenSSL)
openssl rand -base64 64
```

**IMPORTANTE**:
- `JWT_SECRET` y `JWT_REFRESH_SECRET` deben ser **diferentes**
- Nunca comitear el archivo `.env` al repositorio
- Cambiar los secrets invalida todos los tokens existentes
- Mantener los secrets seguros (como contraseñas)

---

### Próximos Pasos

Con estos servicios implementados, las siguientes tareas de autenticación (Fase 2) pueden continuar:

- **T2.03**: Implementar endpoints de autenticación (login, logout, refresh, change-password)
- **T2.04**: Implementar middleware de autenticación y autorización
- **T2.05**: Implementar CRUD de usuarios

Ver: `docs/tasks/tareas_fase2_backend_core_20260118.md`
```

**Resultado esperado**:
- Documentación completa de ambos servicios
- Ejemplos de uso para todas las funciones
- Advertencias de seguridad incluidas
- Variables de entorno documentadas

---

## Criterios de Aceptación

- [x] **Subtarea 1**: Dependencias instaladas (`bcryptjs`, `jsonwebtoken`, types)
- [x] **Subtarea 2**: Variables de entorno actualizadas (`.env.example`, `env.ts`)
- [x] **Subtarea 3**: PasswordService implementado con 3 funciones exportadas
- [x] **Subtarea 4**: JWTService implementado con 5 funciones exportadas
- [x] **Subtarea 5**: Tests de PasswordService creados (20+ casos)
- [x] **Subtarea 6**: Tests de JWTService creados (30+ casos)
- [x] **Subtarea 7**: Documentación en README actualizada

**Validaciones adicionales**:
- [ ] Todos los tests ejecutándose exitosamente (`npm test`)
- [ ] Cobertura de tests > 80% para ambos servicios
- [ ] TypeScript compilando sin errores (`npm run build`)
- [ ] No hay uso de `any` en el código
- [ ] JSDoc completo en todas las funciones públicas
- [ ] Manejo de errores robusto implementado

---

## Archivos a Generar

### Archivos de código (5):
1. `backend/src/services/password.service.ts` (~180 líneas)
2. `backend/src/services/jwt.service.ts` (~260 líneas)
3. `backend/tests/services/password.service.test.ts` (~350 líneas)
4. `backend/tests/services/jwt.service.test.ts` (~450 líneas)
5. `backend/tests/services/` (directorio nuevo)

### Archivos modificados (3):
1. `backend/.env.example` (agregar 4 variables JWT)
2. `backend/src/config/env.ts` (actualizar SecurityConfig + validación)
3. `backend/README.md` (agregar sección "Servicios de Autenticación")

### Archivos de npm (2):
1. `backend/package.json` (dependencies actualizadas)
2. `backend/package-lock.json` (lockfile actualizado)

### Archivos de documentación (2):
1. `docs/plans/plan_T2.02_20260118.md` (este archivo)
2. `docs/completed/T2.02_servicio_hashing_jwt.md` (al finalizar)

**Total**: 12 archivos (5 nuevos, 5 modificados, 2 de documentación)

---

## Riesgos y Consideraciones

### Riesgo 1: Bcrypt puede ser lento en entornos sin compilación nativa

**Descripción**: `bcrypt` nativo requiere compilación C++. `bcryptjs` es pure JavaScript pero más lento.

**Impacto**: Medio - Hash puede tomar 100-200ms por operación.

**Mitigación**:
- Usar `bcryptjs` (ya decidido, no requiere compilación)
- 10 rounds es balance óptimo performance/seguridad
- En desarrollo, considerar 8 rounds para velocidad (NO en producción)
- Las operaciones son asíncronas (no bloquean event loop)

---

### Riesgo 2: Secrets de JWT comprometidos invalidan todos los tokens

**Descripción**: Si `JWT_SECRET` se filtra, atacantes pueden generar tokens válidos.

**Impacto**: Alto - Compromiso total del sistema de autenticación.

**Mitigación**:
- Secrets con mínimo 32 caracteres (validado en `env.ts`)
- Nunca comitear `.env` al repositorio
- Rotar secrets periódicamente (cada 90 días)
- Considerar versionado de secrets (`kid` claim) para rotación sin downtime
- Access tokens de corta duración limitan exposición (15 min)

---

### Riesgo 3: Refresh tokens almacenados en localStorage vulnerables a XSS

**Descripción**: Si el frontend tiene vulnerabilidad XSS, tokens pueden ser robados.

**Impacto**: Alto - Robo de sesiones de usuario.

**Mitigación**:
- Sanitización estricta de inputs en Angular (por defecto en Angular)
- Content Security Policy (CSP) headers
- Refresh tokens de larga duración pero revocables (tabla `sys_refresh_tokens`)
- Considerar httpOnly cookies como alternativa (complica CORS)

---

### Riesgo 4: Tests pueden fallar si .env no está configurado

**Descripción**: Tests dependen de `env.ts` que valida variables de entorno.

**Impacto**: Medio - Tests no ejecutables en CI/CD o nuevos ambientes.

**Mitigación**:
- Crear archivo `.env.test` con valores de prueba
- Usar `dotenv` para cargar `.env.test` en tests
- Documentar setup de ambiente de testing en README
- CI/CD debe configurar variables de entorno antes de tests

---

### Riesgo 5: Validación de longitud mínima de secrets puede fallar en producción

**Descripción**: Si secrets en producción son muy cortos, la aplicación no arrancará.

**Impacto**: Alto - Aplicación no inicia.

**Mitigación**:
- Validación clara con mensaje de error descriptivo
- Documentación explícita en `.env.example`
- Script helper para generar secrets seguros (incluir en README)
- Validar secrets en deployment pipeline antes de desplegar

---

## Comandos de Verificación

### Después de instalar dependencias:
```bash
cd backend
npm list bcryptjs jsonwebtoken @types/bcryptjs @types/jsonwebtoken
npm audit --audit-level=high
```

### Después de implementar servicios:
```bash
cd backend
npm run build
# Verificar: Sin errores de compilación TypeScript
```

### Después de crear tests:
```bash
cd backend
npm test -- password.service.test.ts
npm test -- jwt.service.test.ts
npm test -- --coverage services/
```

### Verificación final:
```bash
cd backend
npm test
npm run build
node -e "const { env } = require('./dist/config/env'); console.log('JWT Secret length:', env.security.jwtSecret.length);"
```

---

## Referencias

### Documentación Oficial
- **bcryptjs**: https://github.com/dcodeIO/bcrypt.js
- **jsonwebtoken**: https://github.com/auth0/node-jsonwebtoken
- **JWT.io**: https://jwt.io/ (decodificador/inspector de tokens)
- **RFC 7519 (JWT)**: https://tools.ietf.org/html/rfc7519

### Archivos del Proyecto
- `docs/decisions/002_estrategia_autenticacion.md` - Estrategia completa de autenticación
- `docs/completed/T2.01_modelos_autenticacion.md` - Tarea anterior completada
- `backend/src/models/auth.model.ts` - Interfaces y tipos
- `backend/src/config/env.ts` - Validación de variables de entorno
- `docs/tasks/tareas_fase2_backend_core_20260118.md` - Lista completa de tareas Fase 2

### Artículos Relevantes
- **OWASP Password Storage Cheat Sheet**: https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html
- **JWT Best Practices**: https://tools.ietf.org/html/rfc8725

---

## Notas Adicionales

### Diferencia entre bcrypt y bcryptjs

- **bcrypt** (nativo):
  - Requiere compilación C++ (node-gyp)
  - Más rápido (~30-50ms por hash)
  - Problemas en Windows sin Visual Studio Build Tools
  - Problemas en algunos ambientes Cloud (Heroku, Lambda)

- **bcryptjs** (pure JavaScript):
  - No requiere compilación (cross-platform)
  - Más lento (~100-200ms por hash)
  - Sin dependencias nativas
  - Compatible con todos los OS y Cloud

**Decisión**: Usar `bcryptjs` por compatibilidad. La diferencia de performance es aceptable para autenticación.

### Estrategia de Doble Token

**¿Por qué usar access + refresh tokens?**

1. **Seguridad**: Access tokens de corta duración limitan ventana de ataque si son robados
2. **Usabilidad**: Refresh tokens permiten renovar sesión sin re-login constante
3. **Revocación**: Refresh tokens en BD permiten invalidar sesiones inmediatamente
4. **Balance**: Access token (15 min) rápido, Refresh token (7 días) conveniencia

**Flujo de renovación**:
```
Cliente detecta access token expirado (401)
  → Envía refresh token a POST /auth/refresh
  → Backend valida refresh token (firma + BD)
  → Backend genera nuevo access token
  → Cliente actualiza token y reintenta request original
```

### Performance de bcrypt

**Rounds de bcrypt**:
- 10 rounds: ~100-200ms (recomendado para producción)
- 12 rounds: ~400-800ms (alta seguridad, UX aceptable para login)
- 8 rounds: ~25-50ms (solo desarrollo/testing)

**Impacto**:
- Login: 1 verificación por request (aceptable)
- Registro: 1 hash por usuario nuevo (poco frecuente)
- Cambio de contraseña: 1 hash (poco frecuente)

**Conclusión**: 10 rounds es óptimo. 100-200ms en login es imperceptible para el usuario.

---

**Última actualización**: 2026-01-18
**Autor**: Claude Sonnet 4.5 (Subagente)
**Estado**: Listo para ejecución
**Estimación revisada**: 3-4 horas (sin cambios)
