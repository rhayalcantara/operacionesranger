/**
 * Modelos de Autenticación y Autorización
 * Sistema de Gestión de Turnos - OperacionesRanger
 *
 * Este archivo contiene todas las interfaces, tipos y DTOs relacionados con
 * autenticación, usuarios, refresh tokens y auditoría.
 *
 * Estrategia: JWT (JSON Web Tokens) con Refresh Tokens
 * Ver: docs/decisions/002_estrategia_autenticacion.md
 */

// ============================================================================
// ENUMS Y TYPES
// ============================================================================

/**
 * Roles de usuario del sistema
 */
export enum UserRole {
  ADMIN = 'ADMIN',           // Control total del sistema
  SUPERVISOR = 'SUPERVISOR', // Operación diaria, gestión de turnos
  CONSULTA = 'CONSULTA'      // Solo lectura
}

/**
 * Eventos de auditoría de autenticación
 */
export enum AuthEvent {
  LOGIN_SUCCESS = 'LOGIN_SUCCESS',     // Login exitoso
  LOGIN_FAILED = 'LOGIN_FAILED',       // Intento fallido de login
  LOGOUT = 'LOGOUT',                   // Cierre de sesión
  TOKEN_REFRESH = 'TOKEN_REFRESH',     // Renovación de access token
  PASSWORD_CHANGE = 'PASSWORD_CHANGE'  // Cambio de contraseña
}

/**
 * Payload del JWT (Access Token)
 */
export interface JWTPayload {
  id?: number;              // User ID (alias for compatibility - optional)
  sub: number;              // User ID (subject - JWT standard)
  username: string;         // Nombre de usuario
  rol: UserRole;            // Rol del usuario
  iat: number;              // Issued at (timestamp)
  exp: number;              // Expires (timestamp)
}

// ============================================================================
// MODELOS DE BASE DE DATOS
// ============================================================================

/**
 * Usuario del sistema (tabla: sys_usuarios)
 *
 * Representa un usuario con credenciales y permisos para acceder al sistema.
 */
export interface Usuario {
  id_usuario: number;
  username: string;
  password_hash: string;
  email: string | null;
  nombre_completo: string;
  rol: UserRole;
  activo: boolean;
  fecha_creacion: Date;
  fecha_modificacion: Date;
  ultimo_login: Date | null;
  intentos_fallidos: number;
  bloqueado_hasta: Date | null;
  created_by: number | null;
  modified_by: number | null;
}

/**
 * Refresh Token (tabla: sys_refresh_tokens)
 *
 * Tokens de larga duración para renovar access tokens sin re-autenticación.
 * Almacenados como hash SHA-256 para seguridad.
 */
export interface RefreshToken {
  id_token: number;
  id_usuario: number;
  token_hash: string;
  fecha_emision: Date;
  fecha_expiracion: Date;
  revocado: boolean;
  fecha_revocacion: Date | null;
  ip_address: string | null;
  user_agent: string | null;
}

/**
 * Auditoría de Autenticación (tabla: sys_auditoria_auth)
 *
 * Registro de todos los eventos de autenticación para trazabilidad y seguridad.
 */
export interface AuditoriaAuth {
  id_auditoria: number;
  id_usuario: number | null;  // Null si el usuario no existe (login failed)
  username: string;            // Username intentado
  evento: AuthEvent;
  ip_address: string | null;
  user_agent: string | null;
  detalles: string | null;     // JSON con información adicional
  fecha_evento: Date;
}

// ============================================================================
// DATA TRANSFER OBJECTS (DTOs)
// ============================================================================

/**
 * DTO para solicitud de login
 */
export interface LoginDTO {
  username: string;
  password: string;
}

/**
 * DTO de usuario seguro (sin password_hash)
 *
 * Usado en respuestas de API para evitar exponer el hash de la contraseña.
 */
export interface UserSafeDTO {
  id_usuario: number;
  username: string;
  email: string | null;
  nombre_completo: string;
  rol: UserRole;
  activo: boolean;
  fecha_creacion: Date;
  fecha_modificacion: Date;
  ultimo_login: Date | null;
}

/**
 * DTO para respuesta de login exitoso
 */
export interface LoginResponseDTO {
  accessToken: string;
  refreshToken: string;
  user: UserSafeDTO;
}

/**
 * DTO para solicitud de refresh token
 */
export interface RefreshTokenDTO {
  refreshToken: string;
}

/**
 * DTO para respuesta de refresh token
 */
export interface RefreshTokenResponseDTO {
  accessToken: string;
}

/**
 * DTO para solicitud de cambio de contraseña
 */
export interface ChangePasswordDTO {
  currentPassword: string;
  newPassword: string;
}

/**
 * DTO para crear nuevo usuario
 */
export interface CreateUserDTO {
  username: string;
  password: string;
  email?: string | null;
  nombre_completo: string;
  rol: UserRole;
}

/**
 * DTO para actualizar usuario existente
 *
 * Todos los campos son opcionales excepto el ID (pasado como param en ruta).
 * NO incluye password (usar endpoint específico de cambio de password).
 */
export interface UpdateUserDTO {
  email?: string | null;
  nombre_completo?: string;
  rol?: UserRole;
  activo?: boolean;
}

/**
 * DTO para paginación de usuarios
 */
export interface PaginatedUsersDTO {
  data: UserSafeDTO[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

/**
 * DTO para crear entrada de auditoría
 */
export interface CreateAuditoriaDTO {
  id_usuario: number | null;
  username: string;
  evento: AuthEvent;
  ip_address: string | null;
  user_agent: string | null;
  detalles?: string | null;
}

// ============================================================================
// UTILITY TYPES
// ============================================================================

/**
 * Usuario sin campos sensibles (para uso interno)
 */
export type UsuarioSinPassword = Omit<Usuario, 'password_hash'>;

/**
 * Campos requeridos para crear usuario en BD
 */
export type NuevoUsuarioDB = Omit<Usuario, 'id_usuario' | 'fecha_creacion' | 'fecha_modificacion' | 'ultimo_login' | 'intentos_fallidos' | 'bloqueado_hasta'>;

/**
 * Campos actualizables de usuario
 */
export type UsuarioActualizable = Partial<Pick<Usuario, 'email' | 'nombre_completo' | 'rol' | 'activo' | 'modified_by'>>;

// ============================================================================
// VALIDACIONES Y CONSTANTES
// ============================================================================

/**
 * Configuración de seguridad para passwords
 */
export const PASSWORD_CONFIG = {
  MIN_LENGTH: 8,
  MAX_LENGTH: 100,
  REQUIRE_UPPERCASE: true,
  REQUIRE_LOWERCASE: true,
  REQUIRE_NUMBER: true,
  REQUIRE_SPECIAL: false,  // Opcional para mejor UX
  BCRYPT_ROUNDS: 10
} as const;

/**
 * Configuración de JWT
 */
export const JWT_CONFIG = {
  ACCESS_TOKEN_EXPIRY: '30m',    // 30 minutos
  REFRESH_TOKEN_EXPIRY: '7d',    // 7 días
  ALGORITHM: 'HS256'
} as const;

/**
 * Configuración de seguridad de login
 */
export const LOGIN_SECURITY = {
  MAX_LOGIN_ATTEMPTS: 5,
  LOCKOUT_DURATION_MINUTES: 15,
  MAX_REFRESH_TOKENS_PER_USER: 5
} as const;

/**
 * Mapeo de roles a permisos (para autorización futura)
 *
 * Define qué operaciones puede realizar cada rol.
 * Usado por middleware de autorización.
 */
export const ROLE_PERMISSIONS = {
  ADMIN: [
    // Usuarios
    'usuarios:read',
    'usuarios:create',
    'usuarios:update',
    'usuarios:delete',

    // Clientes
    'clientes:read',
    'clientes:create',
    'clientes:update',
    'clientes:delete',

    // Ubicaciones
    'ubicaciones:read',
    'ubicaciones:create',
    'ubicaciones:update',
    'ubicaciones:delete',

    // Puestos
    'puestos:read',
    'puestos:create',
    'puestos:update',
    'puestos:delete',

    // Turnos
    'turnos:read',
    'turnos:create',
    'turnos:update',
    'turnos:delete',
    'turnos:process',

    // Incentivos
    'incentivos:read',
    'incentivos:create',
    'incentivos:update',
    'incentivos:delete',

    // Reportes
    'reportes:read',
    'reportes:generate',
    'reportes:export',

    // Configuración
    'config:read',
    'config:update',

    // Auditoría
    'auditoria:read'
  ],

  SUPERVISOR: [
    // Clientes (sin delete)
    'clientes:read',
    'clientes:create',
    'clientes:update',

    // Ubicaciones (sin delete)
    'ubicaciones:read',
    'ubicaciones:create',
    'ubicaciones:update',

    // Puestos (sin delete)
    'puestos:read',
    'puestos:create',
    'puestos:update',

    // Turnos (sin delete y process)
    'turnos:read',
    'turnos:create',
    'turnos:update',

    // Incentivos (sin delete)
    'incentivos:read',
    'incentivos:create',
    'incentivos:update',

    // Reportes (todos)
    'reportes:read',
    'reportes:generate',
    'reportes:export',

    // Configuración (solo read)
    'config:read'
  ],

  CONSULTA: [
    // Solo lectura en todo
    'clientes:read',
    'ubicaciones:read',
    'puestos:read',
    'turnos:read',
    'incentivos:read',
    'reportes:read',
    'config:read'
  ]
} as const;

// ============================================================================
// TYPE GUARDS
// ============================================================================

/**
 * Verifica si un valor es un UserRole válido
 */
export function isValidUserRole(role: unknown): role is UserRole {
  return typeof role === 'string' && Object.values(UserRole).includes(role as UserRole);
}

/**
 * Verifica si un valor es un AuthEvent válido
 */
export function isValidAuthEvent(event: unknown): event is AuthEvent {
  return typeof event === 'string' && Object.values(AuthEvent).includes(event as AuthEvent);
}

/**
 * Verifica si un usuario tiene un rol específico
 */
export function hasRole(user: Usuario | UserSafeDTO, role: UserRole): boolean {
  return user.rol === role;
}

/**
 * Verifica si un usuario tiene permiso para una acción
 */
export function hasPermission(user: Usuario | UserSafeDTO, permission: string): boolean {
  const permissions = ROLE_PERMISSIONS[user.rol];
  return permissions.includes(permission as any);
}

/**
 * Verifica si un usuario está bloqueado temporalmente
 */
export function isUserLocked(user: Usuario): boolean {
  if (!user.bloqueado_hasta) return false;
  return new Date(user.bloqueado_hasta) > new Date();
}

/**
 * Convierte Usuario a UserSafeDTO (elimina password_hash)
 */
export function toUserSafeDTO(user: Usuario): UserSafeDTO {
  const { password_hash, intentos_fallidos, bloqueado_hasta, created_by, modified_by, ...safe } = user;
  return safe;
}
