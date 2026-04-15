/**
 * Schemas de Validación de Autenticación
 * Sistema de Gestión de Turnos - OperacionesRanger
 *
 * Este archivo contiene todos los schemas de validación Zod para endpoints
 * de autenticación y gestión de usuarios.
 *
 * Zod es una biblioteca de validación TypeScript-first que permite:
 * - Validación en tiempo de ejecución
 * - Inferencia de tipos TypeScript
 * - Mensajes de error personalizados
 * - Transformaciones de datos
 *
 * Uso:
 * ```typescript
 * import { loginSchema } from '@schemas/auth.schema';
 *
 * const result = loginSchema.safeParse(req.body);
 * if (!result.success) {
 *   return res.status(400).json({ errors: result.error.errors });
 * }
 * const { username, password } = result.data;
 * ```
 */

import { z } from 'zod';
import { UserRole } from '../models/auth.model';

// ============================================================================
// CONSTANTES DE VALIDACIÓN
// ============================================================================

/**
 * Requisitos de contraseña según ADR-002
 */
const PASSWORD_REQUIREMENTS = {
  MIN_LENGTH: 8,
  MAX_LENGTH: 100,
  // Regex: al menos 1 mayúscula, 1 minúscula, 1 número
  REGEX: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).+$/
} as const;

/**
 * Requisitos de username
 */
const USERNAME_REQUIREMENTS = {
  MIN_LENGTH: 3,
  MAX_LENGTH: 50,
  // Regex: solo letras, números y guiones bajos
  REGEX: /^[a-zA-Z0-9_]+$/
} as const;

// ============================================================================
// SCHEMAS REUTILIZABLES (BUILDING BLOCKS)
// ============================================================================

/**
 * Schema base para username
 */
const usernameSchema = z.string()
  .min(
    USERNAME_REQUIREMENTS.MIN_LENGTH,
    `El usuario debe tener al menos ${USERNAME_REQUIREMENTS.MIN_LENGTH} caracteres`
  )
  .max(
    USERNAME_REQUIREMENTS.MAX_LENGTH,
    `El usuario no puede exceder ${USERNAME_REQUIREMENTS.MAX_LENGTH} caracteres`
  )
  .regex(
    USERNAME_REQUIREMENTS.REGEX,
    'El usuario solo puede contener letras, números y guiones bajos (_)'
  )
  .trim();

/**
 * Schema base para password (con requisitos de seguridad)
 */
const passwordSchema = z.string()
  .min(
    PASSWORD_REQUIREMENTS.MIN_LENGTH,
    `La contraseña debe tener al menos ${PASSWORD_REQUIREMENTS.MIN_LENGTH} caracteres`
  )
  .max(
    PASSWORD_REQUIREMENTS.MAX_LENGTH,
    `La contraseña no puede exceder ${PASSWORD_REQUIREMENTS.MAX_LENGTH} caracteres`
  )
  .regex(
    PASSWORD_REQUIREMENTS.REGEX,
    'La contraseña debe contener al menos una mayúscula, una minúscula y un número'
  );

/**
 * Schema base para password simple (sin requisitos de seguridad)
 * Usado para validar password actual al cambiar
 */
const passwordSimpleSchema = z.string()
  .min(1, 'La contraseña es requerida');

/**
 * Schema base para email
 */
const emailSchema = z.string()
  .email('Email inválido')
  .max(100, 'El email no puede exceder 100 caracteres')
  .trim()
  .toLowerCase()
  .optional()
  .nullable();

/**
 * Schema base para nombre completo
 */
const nombreCompletoSchema = z.string()
  .min(1, 'El nombre completo es requerido')
  .max(150, 'El nombre completo no puede exceder 150 caracteres')
  .trim();

/**
 * Schema base para rol de usuario
 */
const rolSchema = z.nativeEnum(UserRole, {
  message: 'Rol inválido. Debe ser ADMIN, SUPERVISOR o CONSULTA'
});

// ============================================================================
// SCHEMAS DE AUTENTICACIÓN
// ============================================================================

/**
 * Schema para validar request de login
 *
 * POST /api/auth/login
 * Body: { username: string, password: string }
 */
export const loginSchema = z.object({
  username: usernameSchema,
  password: passwordSimpleSchema  // No validar requisitos en login
});

/**
 * Tipo inferido del loginSchema
 */
export type LoginInput = z.infer<typeof loginSchema>;

/**
 * Schema para validar request de refresh token
 *
 * POST /api/auth/refresh
 * Body: { refreshToken: string }
 */
export const refreshTokenSchema = z.object({
  refreshToken: z.string()
    .min(1, 'El refresh token es requerido')
});

/**
 * Tipo inferido del refreshTokenSchema
 */
export type RefreshTokenInput = z.infer<typeof refreshTokenSchema>;

/**
 * Schema para validar request de cambio de contraseña
 *
 * POST /api/auth/change-password
 * Body: { currentPassword: string, newPassword: string }
 */
export const changePasswordSchema = z.object({
  currentPassword: passwordSimpleSchema,
  newPassword: passwordSchema
}).refine(
  (data) => data.currentPassword !== data.newPassword,
  {
    message: 'La nueva contraseña debe ser diferente a la actual',
    path: ['newPassword']
  }
);

/**
 * Tipo inferido del changePasswordSchema
 */
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;

/**
 * Schema para validar logout
 *
 * POST /api/auth/logout
 * Body: { refreshToken: string }
 */
export const logoutSchema = z.object({
  refreshToken: z.string()
    .min(1, 'El refresh token es requerido')
});

/**
 * Tipo inferido del logoutSchema
 */
export type LogoutInput = z.infer<typeof logoutSchema>;

// ============================================================================
// SCHEMAS DE GESTIÓN DE USUARIOS
// ============================================================================

/**
 * Schema para crear nuevo usuario
 *
 * POST /api/usuarios
 * Body: { username, password, email?, nombre_completo, rol }
 */
export const createUserSchema = z.object({
  username: usernameSchema,
  password: passwordSchema,
  email: emailSchema,
  nombre_completo: nombreCompletoSchema,
  rol: rolSchema
});

/**
 * Tipo inferido del createUserSchema
 */
export type CreateUserInput = z.infer<typeof createUserSchema>;

/**
 * Schema para actualizar usuario existente
 *
 * PUT /api/usuarios/:id
 * Body: { email?, nombre_completo?, rol?, activo? }
 *
 * Nota: NO incluye password (usar endpoint específico)
 */
export const updateUserSchema = z.object({
  email: emailSchema,
  nombre_completo: nombreCompletoSchema.optional(),
  rol: rolSchema.optional(),
  activo: z.preprocess(v => v === 1 ? true : v === 0 ? false : v, z.boolean()).optional()
}).refine(
  (data) => Object.keys(data).length > 0,
  {
    message: 'Debe proporcionar al menos un campo para actualizar'
  }
);

/**
 * Tipo inferido del updateUserSchema
 */
export type UpdateUserInput = z.infer<typeof updateUserSchema>;

/**
 * Schema para parámetro ID de usuario en rutas
 *
 * GET /api/usuarios/:id
 * PUT /api/usuarios/:id
 * DELETE /api/usuarios/:id
 */
export const userIdParamSchema = z.object({
  id: z.string()
    .regex(/^\d+$/, 'ID de usuario inválido')
    .transform(Number)
    .refine((n) => n > 0, 'ID de usuario debe ser positivo')
});

/**
 * Tipo inferido del userIdParamSchema
 */
export type UserIdParam = z.infer<typeof userIdParamSchema>;

/**
 * Schema para query params de paginación
 *
 * GET /api/usuarios?page=1&pageSize=20&search=admin
 */
export const paginationQuerySchema = z.object({
  page: z.string()
    .optional()
    .default('1')
    .transform(Number)
    .refine((n) => n > 0, 'La página debe ser mayor a 0'),
  pageSize: z.string()
    .optional()
    .default('20')
    .transform(Number)
    .refine((n) => n > 0 && n <= 1000, 'El tamaño de página debe estar entre 1 y 1000'),
  search: z.string()
    .optional()
    .transform((val) => val?.trim())
});

/**
 * Tipo inferido del paginationQuerySchema
 */
export type PaginationQuery = z.infer<typeof paginationQuerySchema>;

/**
 * Schema para reset de password por administrador
 *
 * POST /api/usuarios/:id/reset-password
 * (No requiere body, genera password temporal)
 */
export const resetPasswordSchema = z.object({
  // Ningún campo en el body
}).strict();

/**
 * Tipo inferido del resetPasswordSchema
 */
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;

// ============================================================================
// SCHEMAS DE VALIDACIÓN DE RESPONSES (OPCIONAL)
// ============================================================================

/**
 * Schema para validar response de login
 *
 * Útil para tests o validación de responses de API
 */
export const loginResponseSchema = z.object({
  accessToken: z.string(),
  refreshToken: z.string(),
  user: z.object({
    id_usuario: z.number(),
    username: z.string(),
    email: z.string().nullable(),
    nombre_completo: z.string(),
    rol: rolSchema,
    activo: z.preprocess(v => v === 1 ? true : v === 0 ? false : v, z.boolean()),
    fecha_creacion: z.date(),
    fecha_modificacion: z.date(),
    ultimo_login: z.date().nullable()
  })
});

/**
 * Schema para validar response de refresh token
 */
export const refreshTokenResponseSchema = z.object({
  accessToken: z.string()
});

// ============================================================================
// SCHEMAS DE VALIDACIÓN DE AUDITORÍA
// ============================================================================

/**
 * Schema para crear entrada de auditoría
 * (Usado internamente por servicios)
 */
export const createAuditoriaSchema = z.object({
  id_usuario: z.number().nullable(),
  username: z.string(),
  evento: z.enum(['LOGIN_SUCCESS', 'LOGIN_FAILED', 'LOGOUT', 'TOKEN_REFRESH', 'PASSWORD_CHANGE']),
  ip_address: z.string()
    .max(45, 'IP address demasiado larga')
    .nullable()
    .optional(),
  user_agent: z.string()
    .nullable()
    .optional(),
  detalles: z.string()
    .nullable()
    .optional()
});

/**
 * Tipo inferido del createAuditoriaSchema
 */
export type CreateAuditoriaInput = z.infer<typeof createAuditoriaSchema>;

// ============================================================================
// UTILIDADES DE VALIDACIÓN
// ============================================================================

/**
 * Helper para validar y extraer datos de request
 *
 * Uso:
 * ```typescript
 * const data = await validateRequest(loginSchema, req.body);
 * ```
 */
export async function validateRequest<T extends z.ZodTypeAny>(
  schema: T,
  data: unknown
): Promise<z.infer<T>> {
  return schema.parseAsync(data);
}

/**
 * Helper para validación segura (no lanza error)
 *
 * Uso:
 * ```typescript
 * const result = safeValidate(loginSchema, req.body);
 * if (!result.success) {
 *   return res.status(400).json({ errors: result.error.issues });
 * }
 * const data = result.data;
 * ```
 */
export function safeValidate<T extends z.ZodTypeAny>(
  schema: T,
  data: unknown
) {
  return schema.safeParse(data);
}

/**
 * Helper para formatear errores de validación Zod
 *
 * Convierte errores de Zod a formato amigable para API
 */
export function formatZodErrors(error: z.ZodError): Array<{ field: string; message: string }> {
  return error.issues.map((err: z.ZodIssue) => ({
    field: err.path.join('.'),
    message: err.message
  }));
}

/**
 * Helper para validar rol de usuario
 *
 * Uso:
 * ```typescript
 * if (!isValidRole(req.body.rol)) {
 *   return res.status(400).json({ error: 'Rol inválido' });
 * }
 * ```
 */
export function isValidRole(role: unknown): role is UserRole {
  return typeof role === 'string' && ['ADMIN', 'SUPERVISOR', 'CONSULTA'].includes(role);
}

// ============================================================================
// EXPORTACIONES
// ============================================================================

/**
 * Exportar todos los schemas para uso en controladores y middlewares
 */
export const authSchemas = {
  login: loginSchema,
  refreshToken: refreshTokenSchema,
  changePassword: changePasswordSchema,
  logout: logoutSchema,
  createUser: createUserSchema,
  updateUser: updateUserSchema,
  userIdParam: userIdParamSchema,
  paginationQuery: paginationQuerySchema,
  resetPassword: resetPasswordSchema,
  loginResponse: loginResponseSchema,
  refreshTokenResponse: refreshTokenResponseSchema,
  createAuditoria: createAuditoriaSchema
} as const;

/**
 * Tipo para los nombres de schemas disponibles
 */
export type AuthSchemaName = keyof typeof authSchemas;
