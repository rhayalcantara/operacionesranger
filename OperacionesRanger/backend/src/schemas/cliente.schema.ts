/**
 * Schemas de Validación de Cliente
 * Sistema de Gestión de Turnos - OperacionesRanger
 *
 * Define todos los schemas Zod para validación de endpoints de clientes.
 * Los schemas validan requests, queries y params para asegurar datos correctos.
 *
 * @module schemas/cliente.schema
 */

import { z } from 'zod';
import { CLIENTE_VALIDATION } from '../models/cliente.model';

// ============================================================================
// SCHEMAS REUTILIZABLES (BUILDING BLOCKS)
// ============================================================================

/**
 * Schema base para código de cliente
 *
 * Reglas:
 * - 2-20 caracteres
 * - Solo letras, números, guiones y guiones bajos
 * - Se convierte a mayúsculas automáticamente
 */
const codigoSchema = z.string()
  .min(
    CLIENTE_VALIDATION.CODIGO.MIN_LENGTH,
    `El código debe tener al menos ${CLIENTE_VALIDATION.CODIGO.MIN_LENGTH} caracteres`
  )
  .max(
    CLIENTE_VALIDATION.CODIGO.MAX_LENGTH,
    `El código no puede exceder ${CLIENTE_VALIDATION.CODIGO.MAX_LENGTH} caracteres`
  )
  .regex(
    CLIENTE_VALIDATION.CODIGO.REGEX,
    'El código solo puede contener letras, números, guiones (-) y guiones bajos (_)'
  )
  .trim()
  .transform((val) => val.toUpperCase());

/**
 * Schema base para nombre de cliente
 *
 * Reglas:
 * - 1-150 caracteres
 * - Requerido
 */
const nombreSchema = z.string()
  .min(1, 'El nombre del cliente es requerido')
  .max(
    CLIENTE_VALIDATION.NOMBRE.MAX_LENGTH,
    `El nombre no puede exceder ${CLIENTE_VALIDATION.NOMBRE.MAX_LENGTH} caracteres`
  )
  .trim();

/**
 * Schema base para RNC
 *
 * Reglas:
 * - 9-11 dígitos (formato República Dominicana)
 * - Solo números (se eliminan guiones y espacios automáticamente)
 * - Opcional (nullable)
 *
 * Formatos aceptados:
 * - 123456789 (9 dígitos)
 * - 12345678901 (11 dígitos)
 * - 123-4567890-1 (se normaliza a 12345678901)
 */
const rncSchema = z.string()
  .trim()
  .transform((val) => val.replace(/[\s-]/g, ''))  // Eliminar espacios y guiones
  .refine(
    (val) => CLIENTE_VALIDATION.RNC.REGEX.test(val),
    'El RNC debe tener 9-11 dígitos'
  )
  .optional()
  .nullable();

/**
 * Schema base para email
 *
 * Reglas:
 * - Formato de email válido
 * - Máximo 100 caracteres
 * - Se convierte a minúsculas
 * - Opcional (nullable)
 */
const emailSchema = z.string()
  .email('Email inválido')
  .max(
    CLIENTE_VALIDATION.EMAIL.MAX_LENGTH,
    `El email no puede exceder ${CLIENTE_VALIDATION.EMAIL.MAX_LENGTH} caracteres`
  )
  .trim()
  .toLowerCase()
  .optional()
  .nullable();

/**
 * Schema base para teléfono
 *
 * Reglas:
 * - 10-20 caracteres
 * - Opcional (nullable)
 *
 * Nota: No validamos formato específico para permitir flexibilidad
 * (teléfonos internacionales, extensiones, etc.)
 */
const telefonoSchema = z.string()
  .min(
    CLIENTE_VALIDATION.TELEFONO.MIN_LENGTH,
    `El teléfono debe tener al menos ${CLIENTE_VALIDATION.TELEFONO.MIN_LENGTH} caracteres`
  )
  .max(
    CLIENTE_VALIDATION.TELEFONO.MAX_LENGTH,
    `El teléfono no puede exceder ${CLIENTE_VALIDATION.TELEFONO.MAX_LENGTH} caracteres`
  )
  .trim()
  .optional()
  .nullable();

/**
 * Schema base para dirección
 *
 * Reglas:
 * - Máximo 500 caracteres
 * - Opcional (nullable)
 */
const direccionSchema = z.string()
  .max(
    CLIENTE_VALIDATION.DIRECCION.MAX_LENGTH,
    `La dirección no puede exceder ${CLIENTE_VALIDATION.DIRECCION.MAX_LENGTH} caracteres`
  )
  .trim()
  .optional()
  .nullable();

/**
 * Schema base para nombre de contacto
 *
 * Reglas:
 * - Máximo 100 caracteres
 * - Opcional (nullable)
 */
const contactoNombreSchema = z.string()
  .max(
    CLIENTE_VALIDATION.CONTACTO_NOMBRE.MAX_LENGTH,
    `El nombre del contacto no puede exceder ${CLIENTE_VALIDATION.CONTACTO_NOMBRE.MAX_LENGTH} caracteres`
  )
  .trim()
  .optional()
  .nullable();

/**
 * Schema base para teléfono de contacto
 *
 * Mismas reglas que telefonoSchema
 */
const contactoTelefonoSchema = telefonoSchema;

/**
 * Schema base para estado activo
 *
 * Reglas:
 * - Boolean
 * - Opcional
 */
const activoSchema = z.preprocess(v => v === 1 ? true : v === 0 ? false : v, z.boolean()).optional();

// ============================================================================
// SCHEMAS DE ENDPOINTS
// ============================================================================

/**
 * Schema para crear nuevo cliente
 *
 * POST /api/clientes
 * Body: { codigo, nombre, rnc?, telefono?, email?, direccion?, contacto_nombre?, contacto_telefono? }
 */
export const createClienteSchema = z.object({
  codigo: codigoSchema,
  nombre: nombreSchema,
  rnc: rncSchema,
  telefono: telefonoSchema,
  email: emailSchema,
  direccion: direccionSchema,
  contacto_nombre: contactoNombreSchema,
  contacto_telefono: contactoTelefonoSchema
});

/**
 * Tipo inferido del createClienteSchema
 */
export type CreateClienteInput = z.infer<typeof createClienteSchema>;

/**
 * Schema para actualizar cliente existente
 *
 * PUT /api/clientes/:id
 * Body: { codigo?, nombre?, rnc?, telefono?, email?, direccion?, contacto_nombre?, contacto_telefono?, activo? }
 *
 * Nota: Todos los campos son opcionales, pero al menos uno debe ser proporcionado
 */
export const updateClienteSchema = z.object({
  codigo: codigoSchema.optional(),
  nombre: nombreSchema.optional(),
  rnc: rncSchema,
  telefono: telefonoSchema,
  email: emailSchema,
  direccion: direccionSchema,
  contacto_nombre: contactoNombreSchema,
  contacto_telefono: contactoTelefonoSchema,
  activo: activoSchema
}).refine(
  (data) => Object.keys(data).length > 0,
  {
    message: 'Debe proporcionar al menos un campo para actualizar'
  }
);

/**
 * Tipo inferido del updateClienteSchema
 */
export type UpdateClienteInput = z.infer<typeof updateClienteSchema>;

/**
 * Schema para parámetro ID de cliente en rutas
 *
 * GET /api/clientes/:id
 * PUT /api/clientes/:id
 * DELETE /api/clientes/:id
 *
 * Valida que el ID sea un número positivo
 */
export const clienteIdParamSchema = z.object({
  id: z.string()
    .regex(/^\d+$/, 'ID de cliente inválido')
    .transform(Number)
    .refine((n) => n > 0, 'ID de cliente debe ser positivo')
});

/**
 * Tipo inferido del clienteIdParamSchema
 */
export type ClienteIdParam = z.infer<typeof clienteIdParamSchema>;

/**
 * Schema para query params de paginación y búsqueda
 *
 * GET /api/clientes?page=1&pageSize=20&search=banco&activo=true
 */
export const clientesPaginationQuerySchema = z.object({
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
    .transform((val) => val?.trim() || undefined),
  activo: z.string()
    .optional()
    .transform((val) => {
      if (val === undefined) return undefined;
      return val === 'true' || val === '1';
    })
});

/**
 * Tipo inferido del clientesPaginationQuerySchema
 */
export type ClientesPaginationQuery = z.infer<typeof clientesPaginationQuerySchema>;

// ============================================================================
// SCHEMAS DE VALIDACIÓN DE RESPONSES (OPCIONAL)
// ============================================================================

/**
 * Schema para validar response de cliente individual
 *
 * Útil para tests o validación de responses de API
 */
export const clienteResponseSchema = z.object({
  id: z.number(),
  codigo: z.string(),
  nombre: z.string(),
  rnc: z.string().nullable(),
  telefono: z.string().nullable(),
  email: z.string().nullable(),
  direccion: z.string().nullable(),
  contacto_nombre: z.string().nullable(),
  contacto_telefono: z.string().nullable(),
  activo: z.preprocess(v => v === 1 ? true : v === 0 ? false : v, z.boolean()),
  created_at: z.union([z.string(), z.date()]),  // Puede ser string (JSON) o Date
  updated_at: z.union([z.string(), z.date()])
});

/**
 * Schema para validar response de listado paginado
 */
export const paginatedClientesResponseSchema = z.object({
  data: z.array(clienteResponseSchema),
  total: z.number(),
  page: z.number(),
  pageSize: z.number(),
  totalPages: z.number()
});

// ============================================================================
// UTILIDADES DE VALIDACIÓN
// ============================================================================

/**
 * Helper para validar y extraer datos de request
 *
 * @param schema - Schema Zod a usar
 * @param data - Datos a validar
 * @returns Datos validados y transformados
 * @throws ZodError si validación falla
 *
 * @example
 * const data = await validateRequest(createClienteSchema, req.body);
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
 * @param schema - Schema Zod a usar
 * @param data - Datos a validar
 * @returns Resultado de validación (success + data o error)
 *
 * @example
 * const result = safeValidate(createClienteSchema, req.body);
 * if (!result.success) {
 *   return res.status(400).json({ errors: result.error.issues });
 * }
 * const data = result.data;
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
 *
 * @param error - ZodError
 * @returns Array de errores formateados
 *
 * @example
 * const formatted = formatZodErrors(error);
 * // [{ field: 'codigo', message: 'El código es requerido' }]
 */
export function formatZodErrors(error: z.ZodError): Array<{ field: string; message: string }> {
  return error.issues.map((issue: z.ZodIssue) => ({
    field: issue.path.join('.'),
    message: issue.message
  }));
}

// ============================================================================
// EXPORTACIONES
// ============================================================================

/**
 * Exportar todos los schemas para uso en controladores y middlewares
 */
export const clienteSchemas = {
  createCliente: createClienteSchema,
  updateCliente: updateClienteSchema,
  clienteIdParam: clienteIdParamSchema,
  paginationQuery: clientesPaginationQuerySchema,
  clienteResponse: clienteResponseSchema,
  paginatedResponse: paginatedClientesResponseSchema
} as const;

/**
 * Tipo para los nombres de schemas disponibles
 */
export type ClienteSchemaName = keyof typeof clienteSchemas;
