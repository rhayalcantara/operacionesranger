/**
 * Auth Helpers - Utilidades compartidas para tests de autenticación
 * Sistema de Gestión de Turnos - OperacionesRanger
 *
 * Funciones helper para:
 * - Crear usuarios de prueba
 * - Obtener tokens de autenticación
 * - Login con diferentes roles
 * - Limpieza de datos de prueba
 *
 * @module tests/helpers/auth.helpers
 */

import request from 'supertest';
import crypto from 'crypto';
import app from '../../src/server';
import { getTurnosPool } from '../../src/config/database';
import { hashPasswordSync } from '../../src/services/password.service';
import { UserRole } from '../../src/models/auth.model';
import type { RowDataPacket, ResultSetHeader } from 'mysql2';

// ============================================================================
// TIPOS
// ============================================================================

/**
 * Datos parciales de usuario para creación de prueba
 */
export interface TestUserData {
  username: string;
  password: string;
  email?: string;
  nombre_completo?: string;
  rol?: UserRole;
  activo?: boolean;
}

/**
 * Usuario de prueba completo
 */
export interface TestUser extends TestUserData {
  id: number;
  email: string;
  nombre_completo: string;
  rol: UserRole;
  activo: boolean;
}

/**
 * Tokens de autenticación
 */
export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

// ============================================================================
// USUARIOS PRE-DEFINIDOS PARA TESTING
// ============================================================================

/**
 * Usuario ADMIN de prueba (reutilizable)
 */
export const TEST_ADMIN = {
  username: 'test_admin_helper',
  password: 'AdminTest123!',
  email: 'test_admin_helper@operacionesranger.com',
  nombre_completo: 'Admin de Prueba (Helper)',
  rol: UserRole.ADMIN,
  activo: true,
};

/**
 * Usuario SUPERVISOR de prueba (reutilizable)
 */
export const TEST_SUPERVISOR = {
  username: 'test_supervisor_helper',
  password: 'SupervisorTest123!',
  email: 'test_supervisor_helper@operacionesranger.com',
  nombre_completo: 'Supervisor de Prueba (Helper)',
  rol: UserRole.SUPERVISOR,
  activo: true,
};

/**
 * Usuario CONSULTA de prueba (reutilizable)
 */
export const TEST_CONSULTA = {
  username: 'test_consulta_helper',
  password: 'ConsultaTest123!',
  email: 'test_consulta_helper@operacionesranger.com',
  nombre_completo: 'Consulta de Prueba (Helper)',
  rol: UserRole.CONSULTA,
  activo: true,
};

// ============================================================================
// FUNCIONES DE CREACIÓN DE USUARIOS
// ============================================================================

/**
 * Crear usuario de prueba en la base de datos
 *
 * @param userData - Datos del usuario (username y password son requeridos)
 * @returns ID del usuario creado
 *
 * @example
 * ```typescript
 * const userId = await createTestUser({
 *   username: 'test_user',
 *   password: 'Password123!',
 *   rol: UserRole.SUPERVISOR
 * });
 * ```
 */
export async function createTestUser(
  userData: TestUserData
): Promise<number> {
  const pool = getTurnosPool();

  // Valores por defecto
  const user = {
    username: userData.username,
    password: userData.password,
    email: userData.email || `${userData.username}@test.com`,
    nombre_completo: userData.nombre_completo || `Usuario Test ${userData.username}`,
    rol: userData.rol || UserRole.CONSULTA,
    activo: userData.activo !== undefined ? userData.activo : true,
  };

  // Hashear password
  const passwordHash = hashPasswordSync(user.password);

  // Eliminar usuario previo si existe (idempotencia)
  await pool.execute('DELETE FROM ot_sys_usuarios WHERE username = ?', [
    user.username,
  ]);

  // Crear usuario
  const [result] = await pool.execute<ResultSetHeader>(
    `INSERT INTO ot_sys_usuarios
     (username, password_hash, email, nombre_completo, rol, activo)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [
      user.username,
      passwordHash,
      user.email,
      user.nombre_completo,
      user.rol,
      user.activo,
    ]
  );

  return result.insertId;
}

/**
 * Crear usuario ADMIN de prueba
 * Usa el usuario predefinido TEST_ADMIN
 *
 * @returns ID del usuario creado
 *
 * @example
 * ```typescript
 * const adminId = await createTestAdmin();
 * const token = await getAuthToken(TEST_ADMIN.username, TEST_ADMIN.password);
 * ```
 */
export async function createTestAdmin(): Promise<number> {
  return createTestUser(TEST_ADMIN);
}

/**
 * Crear usuario SUPERVISOR de prueba
 * Usa el usuario predefinido TEST_SUPERVISOR
 *
 * @returns ID del usuario creado
 */
export async function createTestSupervisor(): Promise<number> {
  return createTestUser(TEST_SUPERVISOR);
}

/**
 * Crear usuario CONSULTA de prueba
 * Usa el usuario predefinido TEST_CONSULTA
 *
 * @returns ID del usuario creado
 */
export async function createTestConsulta(): Promise<number> {
  return createTestUser(TEST_CONSULTA);
}

/**
 * Crear usuario temporal con username único
 * Útil para tests que necesitan usuarios únicos sin colisiones
 *
 * @param rol - Rol del usuario (default: CONSULTA)
 * @returns Objeto con id y datos del usuario
 *
 * @example
 * ```typescript
 * const { id, username, password } = await createTempUser(UserRole.SUPERVISOR);
 * const token = await getAuthToken(username, password);
 * await cleanupTestUsers([username]);
 * ```
 */
export async function createTempUser(
  rol: UserRole = UserRole.CONSULTA
): Promise<TestUser> {
  const timestamp = Date.now();
  const random = crypto.randomBytes(4).toString('hex');
  const username = `temp_${rol.toLowerCase()}_${timestamp}_${random}`;
  const password = `TempPass123!`;

  const id = await createTestUser({
    username,
    password,
    rol,
    email: `${username}@test.com`,
    nombre_completo: `Usuario Temporal ${username}`,
  });

  return {
    id,
    username,
    password,
    email: `${username}@test.com`,
    nombre_completo: `Usuario Temporal ${username}`,
    rol,
    activo: true,
  };
}

// ============================================================================
// FUNCIONES DE AUTENTICACIÓN
// ============================================================================

/**
 * Obtener token de autenticación mediante login
 *
 * @param username - Nombre de usuario
 * @param password - Contraseña
 * @returns Access token JWT
 * @throws Error si el login falla
 *
 * @example
 * ```typescript
 * const token = await getAuthToken('admin', 'Password123!');
 * const response = await request(app)
 *   .get('/api/usuarios')
 *   .set('Authorization', `Bearer ${token}`);
 * ```
 */
export async function getAuthToken(
  username: string,
  password: string
): Promise<string> {
  const response = await request(app).post('/api/auth/login').send({
    username,
    password,
  });

  if (response.status !== 200) {
    throw new Error(
      `Login failed for ${username}: ${response.status} ${response.body.message || ''}`
    );
  }

  return response.body.accessToken;
}

/**
 * Obtener access token y refresh token mediante login
 *
 * @param username - Nombre de usuario
 * @param password - Contraseña
 * @returns Objeto con accessToken y refreshToken
 * @throws Error si el login falla
 *
 * @example
 * ```typescript
 * const { accessToken, refreshToken } = await getAuthTokens('admin', 'Password123!');
 * // Usar refreshToken para renovar accessToken
 * const newToken = await refreshAccessToken(refreshToken);
 * ```
 */
export async function getAuthTokens(
  username: string,
  password: string
): Promise<AuthTokens> {
  const response = await request(app).post('/api/auth/login').send({
    username,
    password,
  });

  if (response.status !== 200) {
    throw new Error(
      `Login failed for ${username}: ${response.status} ${response.body.message || ''}`
    );
  }

  return {
    accessToken: response.body.accessToken,
    refreshToken: response.body.refreshToken,
  };
}

/**
 * Login como ADMIN y obtener token
 * Usa el usuario predefinido TEST_ADMIN
 *
 * @returns Access token JWT
 * @throws Error si TEST_ADMIN no existe (debe crearse con createTestAdmin primero)
 *
 * @example
 * ```typescript
 * await createTestAdmin();
 * const token = await loginAsAdmin();
 * ```
 */
export async function loginAsAdmin(): Promise<string> {
  return getAuthToken(TEST_ADMIN.username, TEST_ADMIN.password);
}

/**
 * Login como SUPERVISOR y obtener token
 * Usa el usuario predefinido TEST_SUPERVISOR
 *
 * @returns Access token JWT
 * @throws Error si TEST_SUPERVISOR no existe
 */
export async function loginAsSupervisor(): Promise<string> {
  return getAuthToken(TEST_SUPERVISOR.username, TEST_SUPERVISOR.password);
}

/**
 * Login como CONSULTA y obtener token
 * Usa el usuario predefinido TEST_CONSULTA
 *
 * @returns Access token JWT
 * @throws Error si TEST_CONSULTA no existe
 */
export async function loginAsConsulta(): Promise<string> {
  return getAuthToken(TEST_CONSULTA.username, TEST_CONSULTA.password);
}

/**
 * Renovar access token usando refresh token
 *
 * @param refreshToken - Refresh token JWT
 * @returns Nuevo access token
 * @throws Error si el refresh token es inválido
 *
 * @example
 * ```typescript
 * const { accessToken, refreshToken } = await getAuthTokens('admin', 'Password123!');
 * // Esperar que expire el access token...
 * const newAccessToken = await refreshAccessToken(refreshToken);
 * ```
 */
export async function refreshAccessToken(
  refreshToken: string
): Promise<string> {
  const response = await request(app)
    .post('/api/auth/refresh')
    .send({ refreshToken });

  if (response.status !== 200) {
    throw new Error(
      `Refresh token failed: ${response.status} ${response.body.message || ''}`
    );
  }

  return response.body.accessToken;
}

// ============================================================================
// FUNCIONES DE LIMPIEZA
// ============================================================================

/**
 * Limpiar usuarios de prueba por username
 * Elimina refresh tokens, auditoría y usuario
 *
 * @param usernames - Array de usernames a eliminar
 *
 * @example
 * ```typescript
 * await cleanupTestUsers(['test_user_1', 'test_user_2']);
 * ```
 */
export async function cleanupTestUsers(usernames: string[]): Promise<void> {
  if (usernames.length === 0) return;

  const pool = getTurnosPool();

  // Obtener IDs de usuarios
  const placeholders = usernames.map(() => '?').join(',');
  const [users] = await pool.query<RowDataPacket[]>(
    `SELECT id FROM ot_sys_usuarios WHERE username IN (${placeholders})`,
    usernames
  );

  const userIds = users.map((u) => u.id);

  if (userIds.length === 0) return;

  // Eliminar refresh tokens
  const idPlaceholders = userIds.map(() => '?').join(',');
  await pool.query(
    `DELETE FROM ot_sys_refresh_tokens WHERE id_usuario IN (${idPlaceholders})`,
    userIds
  );

  // Eliminar auditoría
  await pool.query(
    `DELETE FROM ot_sys_auditoria_auth WHERE id_usuario IN (${idPlaceholders})`,
    userIds
  );
  await pool.query(
    `DELETE FROM ot_sys_auditoria_auth WHERE username IN (${placeholders})`,
    usernames
  );

  // Eliminar usuarios
  await pool.query(
    `DELETE FROM ot_sys_usuarios WHERE username IN (${placeholders})`,
    usernames
  );
}

/**
 * Limpiar usuario de prueba por ID
 * Elimina refresh tokens, auditoría y usuario
 *
 * @param userId - ID del usuario a eliminar
 *
 * @example
 * ```typescript
 * const userId = await createTestUser({ username: 'test', password: 'pass' });
 * // ... hacer tests ...
 * await cleanupTestUser(userId);
 * ```
 */
export async function cleanupTestUser(userId: number): Promise<void> {
  const pool = getTurnosPool();

  // Eliminar refresh tokens
  await pool.execute('DELETE FROM ot_sys_refresh_tokens WHERE id_usuario = ?', [
    userId,
  ]);

  // Eliminar auditoría
  await pool.execute('DELETE FROM ot_sys_auditoria_auth WHERE id_usuario = ?', [
    userId,
  ]);

  // Eliminar usuario
  await pool.execute('DELETE FROM ot_sys_usuarios WHERE id = ?', [userId]);
}

/**
 * Limpiar todos los usuarios de prueba predefinidos
 * Elimina TEST_ADMIN, TEST_SUPERVISOR, TEST_CONSULTA
 *
 * @example
 * ```typescript
 * // Después de todos los tests
 * afterAll(async () => {
 *   await cleanupAllTestUsers();
 * });
 * ```
 */
export async function cleanupAllTestUsers(): Promise<void> {
  await cleanupTestUsers([
    TEST_ADMIN.username,
    TEST_SUPERVISOR.username,
    TEST_CONSULTA.username,
  ]);
}

/**
 * Limpiar todos los usuarios temporales
 * Elimina usuarios con username que empiece con 'temp_'
 *
 * @example
 * ```typescript
 * // Limpiar usuarios temporales huérfanos
 * await cleanupTempUsers();
 * ```
 */
export async function cleanupTempUsers(): Promise<void> {
  const pool = getTurnosPool();

  // Obtener IDs de usuarios temporales
  const [users] = await pool.query<RowDataPacket[]>(
    "SELECT id FROM ot_sys_usuarios WHERE username LIKE 'temp_%'"
  );

  const userIds = users.map((u) => u.id);

  if (userIds.length === 0) return;

  const placeholders = userIds.map(() => '?').join(',');

  // Eliminar refresh tokens
  await pool.query(
    `DELETE FROM ot_sys_refresh_tokens WHERE id_usuario IN (${placeholders})`,
    userIds
  );

  // Eliminar auditoría
  await pool.query(
    `DELETE FROM ot_sys_auditoria_auth WHERE id_usuario IN (${placeholders})`,
    userIds
  );

  // Eliminar usuarios
  await pool.query(
    "DELETE FROM ot_sys_usuarios WHERE username LIKE 'temp_%'"
  );
}

// ============================================================================
// FUNCIONES AUXILIARES
// ============================================================================

/**
 * Verificar si un usuario existe
 *
 * @param username - Nombre de usuario
 * @returns true si el usuario existe, false si no
 *
 * @example
 * ```typescript
 * if (await userExists('admin')) {
 *   console.log('Usuario admin ya existe');
 * }
 * ```
 */
export async function userExists(username: string): Promise<boolean> {
  const pool = getTurnosPool();

  const [users] = await pool.query<RowDataPacket[]>(
    'SELECT id FROM ot_sys_usuarios WHERE username = ?',
    [username]
  );

  return users.length > 0;
}

/**
 * Obtener ID de usuario por username
 *
 * @param username - Nombre de usuario
 * @returns ID del usuario o null si no existe
 *
 * @example
 * ```typescript
 * const userId = await getUserId('admin');
 * if (userId) {
 *   console.log(`ID del usuario admin: ${userId}`);
 * }
 * ```
 */
export async function getUserId(username: string): Promise<number | null> {
  const pool = getTurnosPool();

  const [users] = await pool.query<RowDataPacket[]>(
    'SELECT id FROM ot_sys_usuarios WHERE username = ?',
    [username]
  );

  return users.length > 0 ? users[0].id : null;
}

/**
 * Contar refresh tokens de un usuario
 * Útil para verificar que se limpian correctamente
 *
 * @param userId - ID del usuario
 * @returns Cantidad de refresh tokens activos
 *
 * @example
 * ```typescript
 * const count = await countRefreshTokens(userId);
 * expect(count).toBe(0); // Verificar que se limpiaron
 * ```
 */
export async function countRefreshTokens(userId: number): Promise<number> {
  const pool = getTurnosPool();

  const [result] = await pool.query<RowDataPacket[]>(
    'SELECT COUNT(*) as count FROM ot_sys_refresh_tokens WHERE id_usuario = ?',
    [userId]
  );

  return result[0].count;
}

/**
 * Revocar todos los refresh tokens de un usuario
 * Útil para simular logout o forzar re-login
 *
 * @param userId - ID del usuario
 *
 * @example
 * ```typescript
 * await revokeAllRefreshTokens(userId);
 * // Ahora el usuario debe hacer login de nuevo
 * ```
 */
export async function revokeAllRefreshTokens(userId: number): Promise<void> {
  const pool = getTurnosPool();

  await pool.execute(
    'UPDATE ot_sys_refresh_tokens SET revoked = TRUE WHERE id_usuario = ?',
    [userId]
  );
}
