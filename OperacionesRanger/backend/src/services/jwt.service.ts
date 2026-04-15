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
import crypto from 'crypto';
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
 * });
 * ```
 */
export function generateAccessToken(payload: Omit<JWTPayload, 'iat' | 'exp'>): string {
  // Validar payload
  validateAccessTokenPayload(payload);

  try {
    // Generar token
    const token = jwt.sign(
      payload as object,
      env.security.jwtSecret,
      {
        expiresIn: env.security.jwtAccessExpiresIn,
      } as jwt.SignOptions
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
    }) as unknown;

    return decoded as JWTPayload;
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
      jti: crypto.randomUUID(),
    };

    // Generar token
    const token = jwt.sign(
      payload as object,
      env.security.jwtRefreshSecret,
      {
        expiresIn: env.security.jwtRefreshExpiresIn,
      } as jwt.SignOptions
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
