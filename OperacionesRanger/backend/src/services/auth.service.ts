/**
 * Servicio de Autenticación
 * Sistema de Gestión de Turnos - OperacionesRanger
 *
 * Proporciona lógica de negocio para:
 * - Login de usuarios
 * - Logout (revocación de refresh tokens)
 * - Renovación de access tokens (refresh)
 * - Cambio de contraseñas
 * - Auditoría de eventos de autenticación
 *
 * Estrategia: JWT con Refresh Tokens (ADR-002)
 */

import crypto from 'crypto';
import { RowDataPacket } from 'mysql2/promise';
import { getTurnosPool } from '../config/database';
import { hashPassword, verifyPassword } from './password.service';
import { generateAccessToken, generateRefreshToken, verifyRefreshToken } from './jwt.service';
import {
  Usuario,
  LoginResponseDTO,
  AuthEvent,
  CreateAuditoriaDTO,
  toUserSafeDTO,
  isUserLocked,
  LOGIN_SECURITY
} from '../models/auth.model';

// ============================================================================
// CONSTANTES
// ============================================================================

/**
 * Duración del bloqueo por intentos fallidos (en minutos)
 */
const LOCKOUT_DURATION_MINUTES = LOGIN_SECURITY.LOCKOUT_DURATION_MINUTES;

/**
 * Máximo de intentos de login antes de bloqueo
 */
const MAX_LOGIN_ATTEMPTS = LOGIN_SECURITY.MAX_LOGIN_ATTEMPTS;

/**
 * Duración de refresh token en días
 */
const REFRESH_TOKEN_DAYS = 7;

// ============================================================================
// TIPOS INTERNOS
// ============================================================================

interface UsuarioRow extends RowDataPacket, Usuario {}

interface RefreshTokenRow extends RowDataPacket {
  id_token: number;
  id_usuario: number;
  token_hash: string;
  fecha_expiracion: Date;
  revocado: boolean;
}

// ============================================================================
// FUNCIONES DE AUDITORÍA
// ============================================================================

/**
 * Registra un evento de auditoría en sys_auditoria_auth
 *
 * @param auditData - Datos del evento de auditoría
 */
export async function createAuditLog(auditData: CreateAuditoriaDTO): Promise<void> {
  const pool = getTurnosPool();

  try {
    // Convertir detalles a JSON string si es objeto
    const detalles = auditData.detalles
      ? (typeof auditData.detalles === 'string' ? auditData.detalles : JSON.stringify(auditData.detalles))
      : null;

    await pool.execute(
      `INSERT INTO ot_sys_auditoria_auth
       (id_usuario, username, evento, ip_address, user_agent, detalles, fecha_evento)
       VALUES (?, ?, ?, ?, ?, ?, NOW())`,
      [
        auditData.id_usuario,
        auditData.username,
        auditData.evento,
        auditData.ip_address || null,
        auditData.user_agent || null,
        detalles
      ]
    );
  } catch (error) {
    // Log error pero no fallar la operación principal
    console.error('[AUTH] Error al crear log de auditoría:', error);
  }
}

// ============================================================================
// FUNCIONES DE UTILIDAD
// ============================================================================

/**
 * Hashea un refresh token usando SHA-256
 *
 * @param token - Refresh token en texto plano
 * @returns Hash SHA-256 del token (hex string)
 */
function hashRefreshToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

/**
 * Calcula fecha de expiración para refresh token
 *
 * @param days - Número de días de validez
 * @returns Fecha de expiración
 */
function calculateRefreshTokenExpiration(days: number = REFRESH_TOKEN_DAYS): Date {
  const expiration = new Date();
  expiration.setDate(expiration.getDate() + days);
  return expiration;
}

// ============================================================================
// FUNCIONES PRINCIPALES DE AUTENTICACIÓN
// ============================================================================

/**
 * Autentica un usuario con username y password
 *
 * Flujo:
 * 1. Buscar usuario por username
 * 2. Validar que esté activo y no bloqueado
 * 3. Verificar password con bcrypt
 * 4. Si password correcto: generar tokens, registrar login exitoso
 * 5. Si password incorrecto: incrementar intentos, bloquear si necesario
 *
 * @param username - Nombre de usuario
 * @param password - Contraseña en texto plano
 * @param ip - IP del cliente (opcional)
 * @param userAgent - User-Agent del cliente (opcional)
 * @returns Tokens y datos del usuario
 * @throws Error si credenciales inválidas, usuario bloqueado, o no activo
 */
export async function login(
  username: string,
  password: string,
  ip?: string,
  userAgent?: string
): Promise<LoginResponseDTO> {
  const pool = getTurnosPool();

  // 1. Buscar usuario por username
  const [rows] = await pool.execute<UsuarioRow[]>(
    'SELECT * FROM ot_sys_usuarios WHERE username = ?',
    [username]
  );

  // Si usuario no existe, retornar error genérico (no revelar que no existe)
  if (rows.length === 0) {
    // Registrar intento fallido
    await createAuditLog({
      id_usuario: null,
      username,
      evento: AuthEvent.LOGIN_FAILED,
      ip_address: ip || null,
      user_agent: userAgent || null,
      detalles: JSON.stringify({ reason: 'Usuario no existe' })
    });

    throw new Error('Credenciales inválidas');
  }

  const usuario = rows[0];

  // 2. Validar que usuario esté activo
  if (!usuario.activo) {
    await createAuditLog({
      id_usuario: usuario.id_usuario,
      username,
      evento: AuthEvent.LOGIN_FAILED,
      ip_address: ip || null,
      user_agent: userAgent || null,
      detalles: JSON.stringify({ reason: 'Usuario inactivo' })
    });

    throw new Error('Usuario inactivo');
  }

  // 3. Validar que usuario no esté bloqueado temporalmente
  if (isUserLocked(usuario)) {
    const minutosRestantes = Math.ceil(
      (new Date(usuario.bloqueado_hasta!).getTime() - Date.now()) / (1000 * 60)
    );

    await createAuditLog({
      id_usuario: usuario.id_usuario,
      username,
      evento: AuthEvent.LOGIN_FAILED,
      ip_address: ip || null,
      user_agent: userAgent || null,
      detalles: JSON.stringify({
        reason: 'Usuario bloqueado temporalmente',
        minutosRestantes
      })
    });

    throw new Error(
      `Usuario bloqueado temporalmente por múltiples intentos fallidos. ` +
      `Intente nuevamente en ${minutosRestantes} minuto(s).`
    );
  }

  // 4. Verificar password con bcrypt
  const passwordValido = await verifyPassword(password, usuario.password_hash);

  // Si password es incorrecto
  if (!passwordValido) {
    // Incrementar intentos fallidos
    const nuevosIntentos = usuario.intentos_fallidos + 1;

    let bloqueadoHasta: Date | null = null;

    // Si alcanza máximo de intentos, bloquear temporalmente
    if (nuevosIntentos >= MAX_LOGIN_ATTEMPTS) {
      bloqueadoHasta = new Date();
      bloqueadoHasta.setMinutes(bloqueadoHasta.getMinutes() + LOCKOUT_DURATION_MINUTES);
    }

    // Actualizar intentos fallidos y bloqueo
    await pool.execute(
      `UPDATE ot_sys_usuarios
       SET intentos_fallidos = ?, bloqueado_hasta = ?
       WHERE id_usuario = ?`,
      [nuevosIntentos, bloqueadoHasta, usuario.id_usuario]
    );

    // Registrar intento fallido
    await createAuditLog({
      id_usuario: usuario.id_usuario,
      username,
      evento: AuthEvent.LOGIN_FAILED,
      ip_address: ip || null,
      user_agent: userAgent || null,
      detalles: JSON.stringify({
        reason: 'Password incorrecto',
        intentos: nuevosIntentos,
        bloqueado: bloqueadoHasta !== null
      })
    });

    throw new Error('Credenciales inválidas');
  }

  // 5. Password correcto - Resetear intentos fallidos y actualizar último login
  await pool.execute(
    `UPDATE ot_sys_usuarios
     SET intentos_fallidos = 0, bloqueado_hasta = NULL, ultimo_login = NOW()
     WHERE id_usuario = ?`,
    [usuario.id_usuario]
  );

  // 6. Generar access token
  const accessToken = generateAccessToken({
    id: usuario.id_usuario,
    sub: usuario.id_usuario,
    username: usuario.username,
    rol: usuario.rol
  });

  // 7. Generar refresh token
  const refreshToken = generateRefreshToken();

  // 8. Almacenar refresh token en BD (hash SHA-256)
  const tokenHash = hashRefreshToken(refreshToken);
  const fechaExpiracion = calculateRefreshTokenExpiration();

  await pool.execute(
    `INSERT INTO ot_sys_refresh_tokens
     (id_usuario, token_hash, fecha_expiracion, ip_address, user_agent)
     VALUES (?, ?, ?, ?, ?)`,
    [usuario.id_usuario, tokenHash, fechaExpiracion, ip || null, userAgent || null]
  );

  // 9. Registrar login exitoso en auditoría
  await createAuditLog({
    id_usuario: usuario.id_usuario,
    username: usuario.username,
    evento: AuthEvent.LOGIN_SUCCESS,
    ip_address: ip || null,
    user_agent: userAgent || null,
    detalles: null
  });

  // 10. Retornar tokens y usuario (sin password_hash)
  const userSafe = toUserSafeDTO(usuario);

  return {
    accessToken,
    refreshToken,
    user: userSafe
  };
}

/**
 * Renueva un access token usando un refresh token válido
 *
 * Flujo:
 * 1. Verificar firma y expiración del refresh token (JWT)
 * 2. Hashear refresh token y buscar en BD
 * 3. Validar que no esté revocado y no esté expirado
 * 4. Obtener usuario asociado y validar que esté activo
 * 5. Generar nuevo access token
 * 6. Registrar evento de refresh en auditoría
 *
 * @param refreshToken - Refresh token en texto plano
 * @returns Nuevo access token
 * @throws Error si token inválido, expirado, revocado, o usuario inactivo
 */
export async function refreshAccessToken(refreshToken: string): Promise<{ accessToken: string }> {
  const pool = getTurnosPool();

  // 1. Verificar firma y expiración del refresh token (JWT)
  const tokenValido = verifyRefreshToken(refreshToken);

  if (!tokenValido) {
    throw new Error('Refresh token inválido o expirado');
  }

  // 2. Hashear refresh token y buscar en BD
  const tokenHash = hashRefreshToken(refreshToken);

  const [rows] = await pool.execute<RefreshTokenRow[]>(
    `SELECT * FROM ot_sys_refresh_tokens
     WHERE token_hash = ?`,
    [tokenHash]
  );

  if (rows.length === 0) {
    throw new Error('Refresh token no encontrado');
  }

  const tokenRecord = rows[0];

  // 3. Validar que no esté revocado
  if (tokenRecord.revocado) {
    throw new Error('Refresh token ha sido revocado');
  }

  // 4. Validar que no esté expirado en BD (doble verificación)
  if (new Date(tokenRecord.fecha_expiracion) < new Date()) {
    throw new Error('Refresh token ha expirado');
  }

  // 5. Obtener usuario asociado
  const [userRows] = await pool.execute<UsuarioRow[]>(
    'SELECT * FROM ot_sys_usuarios WHERE id_usuario = ?',
    [tokenRecord.id_usuario]
  );

  if (userRows.length === 0) {
    throw new Error('Usuario no encontrado');
  }

  const usuario = userRows[0];

  // 6. Validar que usuario siga activo
  if (!usuario.activo) {
    throw new Error('Usuario inactivo');
  }

  // 7. Generar nuevo access token
  const accessToken = generateAccessToken({
    id: usuario.id_usuario,
    sub: usuario.id_usuario,
    username: usuario.username,
    rol: usuario.rol
  });

  // 8. Registrar evento de refresh en auditoría
  await createAuditLog({
    id_usuario: usuario.id_usuario,
    username: usuario.username,
    evento: AuthEvent.TOKEN_REFRESH,
    ip_address: null,
    user_agent: null,
    detalles: null
  });

  return { accessToken };
}

/**
 * Cierra sesión revocando un refresh token
 *
 * Flujo:
 * 1. Hashear refresh token
 * 2. Buscar token en BD
 * 3. Marcar como revocado con fecha de revocación
 * 4. Registrar logout en auditoría
 *
 * @param refreshToken - Refresh token a revocar
 * @param userId - ID del usuario (para auditoría)
 * @throws Error si token no encontrado
 */
export async function logout(refreshToken: string, userId: number): Promise<void> {
  const pool = getTurnosPool();

  // 1. Hashear refresh token
  const tokenHash = hashRefreshToken(refreshToken);

  // 2. Buscar token en BD
  const [rows] = await pool.execute<RefreshTokenRow[]>(
    'SELECT * FROM ot_sys_refresh_tokens WHERE token_hash = ?',
    [tokenHash]
  );

  if (rows.length === 0) {
    throw new Error('Refresh token no encontrado');
  }

  const tokenRecord = rows[0];

  // 3. Marcar como revocado
  await pool.execute(
    `UPDATE ot_sys_refresh_tokens
     SET revocado = TRUE, fecha_revocacion = NOW()
     WHERE id_token = ?`,
    [tokenRecord.id_token]
  );

  // 4. Obtener username para auditoría
  const [userRows] = await pool.execute<UsuarioRow[]>(
    'SELECT username FROM ot_sys_usuarios WHERE id_usuario = ?',
    [userId]
  );

  const username = userRows.length > 0 ? userRows[0].username : 'unknown';

  // 5. Registrar logout en auditoría
  await createAuditLog({
    id_usuario: userId,
    username,
    evento: AuthEvent.LOGOUT,
    ip_address: null,
    user_agent: null,
    detalles: null
  });
}

/**
 * Cambia la contraseña de un usuario
 *
 * Flujo:
 * 1. Buscar usuario por ID
 * 2. Verificar que password actual sea correcta
 * 3. Hashear nueva password con bcrypt
 * 4. Actualizar password_hash en BD
 * 5. Registrar cambio de password en auditoría
 *
 * @param userId - ID del usuario
 * @param currentPassword - Contraseña actual en texto plano
 * @param newPassword - Nueva contraseña en texto plano
 * @throws Error si password actual incorrecta o usuario no encontrado
 */
export async function changePassword(
  userId: number,
  currentPassword: string,
  newPassword: string
): Promise<void> {
  const pool = getTurnosPool();

  // 1. Buscar usuario por ID
  const [rows] = await pool.execute<UsuarioRow[]>(
    'SELECT * FROM ot_sys_usuarios WHERE id_usuario = ?',
    [userId]
  );

  if (rows.length === 0) {
    throw new Error('Usuario no encontrado');
  }

  const usuario = rows[0];

  // 2. Verificar password actual con bcrypt
  const passwordValido = await verifyPassword(currentPassword, usuario.password_hash);

  if (!passwordValido) {
    // Registrar intento fallido de cambio de password
    await createAuditLog({
      id_usuario: userId,
      username: usuario.username,
      evento: AuthEvent.PASSWORD_CHANGE,
      ip_address: null,
      user_agent: null,
      detalles: JSON.stringify({ success: false, reason: 'Password actual incorrecta' })
    });

    throw new Error('Contraseña actual incorrecta');
  }

  // 3. Hashear nueva password con bcrypt
  const newPasswordHash = await hashPassword(newPassword);

  // 4. Actualizar password_hash en BD
  await pool.execute(
    `UPDATE ot_sys_usuarios
     SET password_hash = ?, fecha_modificacion = NOW()
     WHERE id_usuario = ?`,
    [newPasswordHash, userId]
  );

  // 5. Registrar cambio exitoso en auditoría
  await createAuditLog({
    id_usuario: userId,
    username: usuario.username,
    evento: AuthEvent.PASSWORD_CHANGE,
    ip_address: null,
    user_agent: null,
    detalles: JSON.stringify({ success: true })
  });
}
