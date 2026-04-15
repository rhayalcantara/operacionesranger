/**
 * Modelos e interfaces para autenticación
 * Sistema de Gestión de Turnos - OperacionesRanger
 */

/**
 * Tipo de roles de usuario en el sistema
 */
export type UserRole = 'ADMIN' | 'SUPERVISOR' | 'CONSULTA';

/**
 * Credenciales de inicio de sesión
 */
export interface LoginCredentials {
  username: string;
  password: string;
}

/**
 * Datos del usuario autenticado
 */
export interface User {
  id_usuario: number;
  username: string;
  email: string;
  nombre_completo: string;
  rol: UserRole;
  nivel: number;
  activo: boolean | number;
  fecha_creacion?: string;
  fecha_modificacion?: string;
  ultimo_login?: string | null;
}

/**
 * Respuesta del endpoint de login
 */
export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  user: User;
}

/**
 * Payload decodificado del JWT token
 */
export interface JWTPayload {
  sub: number;        // ID del usuario
  username: string;   // Username del usuario
  rol: UserRole;      // Rol del usuario
  iat: number;        // Timestamp de emisión
  exp: number;        // Timestamp de expiración
}

/**
 * Request para cambio de contraseña
 */
export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}

/**
 * Respuesta del endpoint de refresh token
 */
export interface RefreshTokenResponse {
  accessToken: string;
}

/**
 * Respuesta del endpoint de logout
 */
export interface LogoutResponse {
  message?: string;
}

/**
 * Estado de autenticación del usuario
 */
export interface AuthState {
  isAuthenticated: boolean;
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
}

/**
 * Constantes de localStorage
 */
export const AUTH_STORAGE_KEYS = {
  ACCESS_TOKEN: 'access_token',
  REFRESH_TOKEN: 'refresh_token',
  CURRENT_USER: 'current_user'
} as const;

/**
 * Constantes de endpoints de autenticación
 */
export const AUTH_ENDPOINTS = {
  LOGIN: '/auth/login',
  LOGOUT: '/auth/logout',
  REFRESH: '/auth/refresh',
  CHANGE_PASSWORD: '/auth/change-password'
} as const;
