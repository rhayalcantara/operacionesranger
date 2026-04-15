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
