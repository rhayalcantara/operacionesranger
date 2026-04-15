/**
 * Servicio de Gestión de Usuarios
 * Sistema de Gestión de Turnos - OperacionesRanger
 *
 * Este servicio proporciona toda la lógica de negocio para el CRUD de usuarios del sistema.
 * Funcionalidades:
 * - Listar usuarios con paginación y búsqueda
 * - Crear nuevos usuarios con validaciones
 * - Actualizar información de usuarios
 * - Soft delete de usuarios (desactivación)
 * - Reset de contraseñas (generación de password temporal)
 *
 * Validaciones importantes:
 * - Username único en el sistema
 * - Email único si se proporciona
 * - No permitir eliminar el último administrador activo
 * - Passwords hasheados con bcrypt
 *
 * @module services/usuarios.service
 */

import { getTurnosPool } from '../config/database';
import { hashPassword } from './password.service';
import {
  UserSafeDTO,
  CreateUserDTO,
  UpdateUserDTO,
  UserRole,
} from '../models/auth.model';
import { RowDataPacket, ResultSetHeader } from 'mysql2/promise';
import * as crypto from 'crypto';

// ============================================================================
// TYPES Y CONSTANTES
// ============================================================================

/**
 * Tipo para resultado de paginación
 */
export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

/**
 * Opciones de búsqueda para usuarios
 */
export interface SearchOptions {
  page: number;
  pageSize: number;
  search?: string;
}

/**
 * Configuración para password temporal
 */
const TEMP_PASSWORD_CONFIG = {
  LENGTH: 12,
  CHARS: 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*',
} as const;

// ============================================================================
// FUNCIONES PRIVADAS (HELPERS)
// ============================================================================

/**
 * Convierte row de BD a interfaz Usuario
 * NOTA: Comentado temporalmente para evitar warning TS6133
 */
// function mapRowToUsuario(row: any): Usuario {
//   return {
//     id_usuario: row.id_usuario,
//     username: row.username,
//     password_hash: row.password_hash,
//     email: row.email,
//     nombre_completo: row.nombre_completo,
//     rol: row.rol as UserRole,
//     activo: Boolean(row.activo),
//     fecha_creacion: new Date(row.fecha_creacion),
//     fecha_modificacion: new Date(row.fecha_modificacion),
//     ultimo_login: row.ultimo_login ? new Date(row.ultimo_login) : null,
//     intentos_fallidos: row.intentos_fallidos,
//     bloqueado_hasta: row.bloqueado_hasta ? new Date(row.bloqueado_hasta) : null,
//     created_by: row.created_by,
//     modified_by: row.modified_by,
//   };
// }

/**
 * Genera password temporal seguro
 *
 * Usa crypto.randomBytes para generar bytes aleatorios criptográficamente seguros
 * y los mapea a caracteres del conjunto permitido.
 *
 * @returns Password temporal de 12 caracteres
 */
function generateTempPassword(): string {
  const { LENGTH, CHARS } = TEMP_PASSWORD_CONFIG;
  const bytes = crypto.randomBytes(LENGTH);

  return Array.from(bytes)
    .map((byte: number) => CHARS[byte % CHARS.length])
    .join('');
}

/**
 * Construye condición WHERE para búsqueda
 *
 * Busca en username, email y nombre_completo usando LIKE %search%
 *
 * @param search - Término de búsqueda
 * @returns Objeto con WHERE clause y values para prepared statement
 */
function buildSearchCondition(search?: string): {
  whereClause: string;
  values: string[];
} {
  if (!search || search.trim() === '') {
    return { whereClause: '', values: [] };
  }

  const searchTerm = `%${search.trim()}%`;

  return {
    whereClause: `
      WHERE (
        username LIKE ? OR
        email LIKE ? OR
        nombre_completo LIKE ?
      )
    `,
    values: [searchTerm, searchTerm, searchTerm],
  };
}

// ============================================================================
// FUNCIONES DE VALIDACIÓN
// ============================================================================

/**
 * Verifica si un username ya existe en la BD
 *
 * @param username - Username a verificar
 * @param excludeId - ID de usuario a excluir (para updates)
 * @returns true si el username existe, false en caso contrario
 */
async function usernameExists(
  username: string,
  excludeId?: number
): Promise<boolean> {
  const pool = getTurnosPool();

  const query = excludeId
    ? 'SELECT COUNT(*) as count FROM ot_sys_usuarios WHERE username = ? AND id_usuario != ?'
    : 'SELECT COUNT(*) as count FROM ot_sys_usuarios WHERE username = ?';

  const params = excludeId ? [username, excludeId] : [username];

  const [rows] = await pool.query<RowDataPacket[]>(query, params);

  return rows[0].count > 0;
}

/**
 * Verifica si un email ya existe en la BD
 *
 * @param email - Email a verificar
 * @param excludeId - ID de usuario a excluir (para updates)
 * @returns true si el email existe, false en caso contrario
 */
async function emailExists(
  email: string,
  excludeId?: number
): Promise<boolean> {
  const pool = getTurnosPool();

  const query = excludeId
    ? 'SELECT COUNT(*) as count FROM ot_sys_usuarios WHERE email = ? AND id_usuario != ?'
    : 'SELECT COUNT(*) as count FROM ot_sys_usuarios WHERE email = ?';

  const params = excludeId ? [email, excludeId] : [email];

  const [rows] = await pool.query<RowDataPacket[]>(query, params);

  return rows[0].count > 0;
}

/**
 * Cuenta administradores activos en el sistema
 *
 * Usado para validar que no se elimine el último admin.
 *
 * @returns Cantidad de administradores activos
 */
async function countAdminsActivos(): Promise<number> {
  const pool = getTurnosPool();

  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT COUNT(*) as count
     FROM ot_sys_usuarios
     WHERE rol = 'ADMIN' AND activo = TRUE`
  );

  return rows[0].count;
}

/**
 * Verifica si un usuario es el último admin activo
 *
 * @param userId - ID del usuario a verificar
 * @returns true si es el último admin activo, false en caso contrario
 */
async function isLastAdmin(userId: number): Promise<boolean> {
  const pool = getTurnosPool();

  // Obtener información del usuario
  const [userRows] = await pool.query<RowDataPacket[]>(
    'SELECT rol, activo FROM ot_sys_usuarios WHERE id_usuario = ?',
    [userId]
  );

  if (userRows.length === 0) {
    return false; // Usuario no existe
  }

  const user = userRows[0];

  // Solo verificar si el usuario es admin activo
  if (user.rol !== 'ADMIN' || !user.activo) {
    return false;
  }

  // Contar admins activos
  const totalAdmins = await countAdminsActivos();

  return totalAdmins === 1;
}

// ============================================================================
// FUNCIONES PÚBLICAS DEL SERVICIO
// ============================================================================

/**
 * Obtiene lista paginada de usuarios con búsqueda opcional
 *
 * Características:
 * - Paginación server-side con LIMIT y OFFSET
 * - Búsqueda por username, email o nombre_completo
 * - Excluye password_hash en respuesta (UserSafeDTO)
 * - Ordenado por fecha de creación (más recientes primero)
 *
 * @param options - Opciones de paginación y búsqueda
 * @returns Lista paginada de usuarios
 *
 * @example
 * ```typescript
 * const result = await getUsuarios({ page: 1, pageSize: 20, search: 'admin' });
 * // { data: [...], total: 5, page: 1, pageSize: 20, totalPages: 1 }
 * ```
 */
export async function getUsuarios(
  options: SearchOptions
): Promise<PaginatedResult<UserSafeDTO>> {
  const pool = getTurnosPool();
  const { page, pageSize, search } = options;

  // Validar parámetros
  if (page < 1) {
    throw new Error('La página debe ser mayor o igual a 1');
  }

  if (pageSize < 1 || pageSize > 100) {
    throw new Error('El tamaño de página debe estar entre 1 y 100');
  }

  // Construir condición de búsqueda
  const { whereClause, values: searchValues } = buildSearchCondition(search);

  // Contar total de registros
  const countQuery = `
    SELECT COUNT(*) as total
    FROM ot_sys_usuarios
    ${whereClause}
  `;

  const [countRows] = await pool.execute<RowDataPacket[]>(
    countQuery,
    searchValues
  );

  const total = countRows[0].total;

  // Si no hay resultados, retornar vacío
  if (total === 0) {
    return {
      data: [],
      total: 0,
      page,
      pageSize,
      totalPages: 0,
    };
  }

  // Calcular offset
  const offset = (page - 1) * pageSize;

  // Obtener usuarios (sin password_hash)
  const query = `
    SELECT
      id_usuario,
      username,
      email,
      nombre_completo,
      rol,
      activo,
      fecha_creacion,
      fecha_modificacion,
      ultimo_login
    FROM ot_sys_usuarios
    ${whereClause}
    ORDER BY fecha_creacion DESC
    LIMIT ? OFFSET ?
  `;

  const queryParams = [...searchValues, String(pageSize), String(offset)];

  const [rows] = await pool.execute<RowDataPacket[]>(query, queryParams);

  // Mapear a UserSafeDTO
  const data: UserSafeDTO[] = rows.map((row) => ({
    id_usuario: row.id_usuario,
    username: row.username,
    email: row.email,
    nombre_completo: row.nombre_completo,
    rol: row.rol as UserRole,
    activo: Boolean(row.activo),
    fecha_creacion: new Date(row.fecha_creacion),
    fecha_modificacion: new Date(row.fecha_modificacion),
    ultimo_login: row.ultimo_login ? new Date(row.ultimo_login) : null,
  }));

  // Calcular total de páginas
  const totalPages = Math.ceil(total / pageSize);

  return {
    data,
    total,
    page,
    pageSize,
    totalPages,
  };
}

/**
 * Obtiene un usuario por su ID
 *
 * @param id - ID del usuario
 * @returns Usuario encontrado (sin password_hash)
 * @throws Error si el usuario no existe
 *
 * @example
 * ```typescript
 * const usuario = await getUsuarioById(1);
 * // { id_usuario: 1, username: 'admin', ... }
 * ```
 */
export async function getUsuarioById(id: number): Promise<UserSafeDTO> {
  const pool = getTurnosPool();

  const query = `
    SELECT
      id_usuario,
      username,
      email,
      nombre_completo,
      rol,
      activo,
      fecha_creacion,
      fecha_modificacion,
      ultimo_login
    FROM ot_sys_usuarios
    WHERE id_usuario = ?
  `;

  const [rows] = await pool.query<RowDataPacket[]>(query, [id]);

  if (rows.length === 0) {
    throw new Error(`Usuario con ID ${id} no encontrado`);
  }

  const row = rows[0];

  return {
    id_usuario: row.id_usuario,
    username: row.username,
    email: row.email,
    nombre_completo: row.nombre_completo,
    rol: row.rol as UserRole,
    activo: Boolean(row.activo),
    fecha_creacion: new Date(row.fecha_creacion),
    fecha_modificacion: new Date(row.fecha_modificacion),
    ultimo_login: row.ultimo_login ? new Date(row.ultimo_login) : null,
  };
}

/**
 * Crea un nuevo usuario en el sistema
 *
 * Validaciones:
 * - Username único
 * - Email único (si se proporciona)
 * - Password hasheado con bcrypt
 *
 * @param dto - Datos del usuario a crear
 * @param createdBy - ID del usuario que crea este registro
 * @returns Usuario creado (sin password_hash)
 * @throws Error si username o email duplicado
 *
 * @example
 * ```typescript
 * const nuevoUsuario = await createUsuario({
 *   username: 'supervisor1',
 *   password: 'Secure123!',
 *   email: 'supervisor@example.com',
 *   nombre_completo: 'Juan Pérez',
 *   rol: UserRole.SUPERVISOR
 * }, 1); // Creado por admin (id 1)
 * ```
 */
export async function createUsuario(
  dto: CreateUserDTO,
  createdBy: number
): Promise<UserSafeDTO> {
  const pool = getTurnosPool();

  // Validar username único
  if (await usernameExists(dto.username)) {
    throw new Error(`El username '${dto.username}' ya está en uso`);
  }

  // Validar email único (si se proporciona)
  if (dto.email && (await emailExists(dto.email))) {
    throw new Error(`El email '${dto.email}' ya está en uso`);
  }

  // Hashear password
  const passwordHash = await hashPassword(dto.password);

  // Insertar usuario
  const query = `
    INSERT INTO ot_sys_usuarios (
      username,
      password_hash,
      email,
      nombre_completo,
      rol,
      activo,
      created_by
    ) VALUES (?, ?, ?, ?, ?, TRUE, ?)
  `;

  const params = [
    dto.username,
    passwordHash,
    dto.email || null,
    dto.nombre_completo,
    dto.rol,
    createdBy,
  ];

  const [result] = await pool.query<ResultSetHeader>(query, params);

  // Obtener usuario creado
  return getUsuarioById(result.insertId);
}

/**
 * Actualiza información de un usuario existente
 *
 * Campos actualizables:
 * - email (único si se proporciona)
 * - nombre_completo
 * - rol
 * - activo
 *
 * NO permite cambiar:
 * - username (campo único inmutable)
 * - password (usar resetPassword)
 *
 * @param id - ID del usuario a actualizar
 * @param dto - Datos a actualizar (parciales)
 * @param modifiedBy - ID del usuario que modifica
 * @returns Usuario actualizado
 * @throws Error si usuario no existe o email duplicado
 *
 * @example
 * ```typescript
 * const actualizado = await updateUsuario(5, {
 *   email: 'nuevo@example.com',
 *   rol: UserRole.ADMIN
 * }, 1); // Modificado por admin (id 1)
 * ```
 */
export async function updateUsuario(
  id: number,
  dto: UpdateUserDTO,
  modifiedBy: number
): Promise<UserSafeDTO> {
  const pool = getTurnosPool();

  // Verificar que usuario existe
  const usuario = await getUsuarioById(id);

  // Validar email único (si se está cambiando)
  if (dto.email && dto.email !== usuario.email) {
    if (await emailExists(dto.email, id)) {
      throw new Error(`El email '${dto.email}' ya está en uso`);
    }
  }

  // Construir query de actualización dinámicamente
  const updates: string[] = [];
  const values: any[] = [];

  if (dto.email !== undefined) {
    updates.push('email = ?');
    values.push(dto.email || null);
  }

  if (dto.nombre_completo !== undefined) {
    updates.push('nombre_completo = ?');
    values.push(dto.nombre_completo);
  }

  if (dto.rol !== undefined) {
    updates.push('rol = ?');
    values.push(dto.rol);
  }

  if (dto.activo !== undefined) {
    updates.push('activo = ?');
    values.push(dto.activo);
  }

  updates.push('modified_by = ?');
  values.push(modifiedBy);

  // Agregar ID al final
  values.push(id);

  const query = `
    UPDATE ot_sys_usuarios
    SET ${updates.join(', ')}
    WHERE id_usuario = ?
  `;

  await pool.query(query, values);

  // Retornar usuario actualizado
  return getUsuarioById(id);
}

/**
 * Desactiva un usuario (soft delete)
 *
 * Valida que no se elimine el último administrador activo del sistema.
 *
 * @param id - ID del usuario a desactivar
 * @throws Error si es el último admin o usuario no existe
 *
 * @example
 * ```typescript
 * await deleteUsuario(5);
 * // Usuario desactivado exitosamente
 * ```
 */
export async function deleteUsuario(id: number): Promise<void> {
  const pool = getTurnosPool();

  // Verificar que usuario existe
  await getUsuarioById(id);

  // Validar que no es el último admin
  if (await isLastAdmin(id)) {
    throw new Error(
      'No se puede desactivar el último administrador activo del sistema'
    );
  }

  // Desactivar usuario (soft delete)
  const query = `
    UPDATE ot_sys_usuarios
    SET activo = FALSE
    WHERE id_usuario = ?
  `;

  await pool.query(query, [id]);
}

/**
 * Resetea el password de un usuario generando uno temporal
 *
 * Genera un password aleatorio seguro de 12 caracteres y lo hashea.
 * El password temporal debe ser cambiado en el primer login.
 *
 * @param id - ID del usuario
 * @returns Password temporal generado (en texto plano, única vez)
 * @throws Error si usuario no existe
 *
 * @example
 * ```typescript
 * const tempPassword = await resetPassword(5);
 * // "aB3$xY9@kL2#" (ejemplo)
 * ```
 */
export async function resetPassword(id: number): Promise<string> {
  const pool = getTurnosPool();

  // Verificar que usuario existe
  await getUsuarioById(id);

  // Generar password temporal
  const tempPassword = generateTempPassword();

  // Hashear password
  const passwordHash = await hashPassword(tempPassword);

  // Actualizar password en BD
  const query = `
    UPDATE ot_sys_usuarios
    SET password_hash = ?,
        intentos_fallidos = 0,
        bloqueado_hasta = NULL
    WHERE id_usuario = ?
  `;

  await pool.query(query, [passwordHash, id]);

  // Retornar password temporal en texto plano
  return tempPassword;
}
