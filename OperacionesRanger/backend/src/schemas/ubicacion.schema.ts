/**
 * Schemas de Validación de Ubicación
 * Sistema de Gestión de Turnos - OperacionesRanger
 *
 * Define todos los schemas Zod para validación de endpoints de ubicaciones.
 * Los schemas validan requests, queries y params para asegurar datos correctos.
 *
 * @module schemas/ubicacion.schema
 */

import { z } from 'zod';
import { UBICACION_VALIDATION } from '../models/ubicacion.model';

// ============================================================================
// SCHEMAS REUTILIZABLES (BUILDING BLOCKS)
// ============================================================================

/**
 * Schema base para código de ubicación
 *
 * Reglas:
 * - 2-20 caracteres
 * - Solo letras, números, guiones y guiones bajos
 * - Se convierte a mayúsculas automáticamente
 */
const codigoSchema = z
  .string()
  .min(
    UBICACION_VALIDATION.CODIGO.MIN_LENGTH,
    `El código debe tener al menos ${UBICACION_VALIDATION.CODIGO.MIN_LENGTH} caracteres`
  )
  .max(
    UBICACION_VALIDATION.CODIGO.MAX_LENGTH,
    `El código no puede exceder ${UBICACION_VALIDATION.CODIGO.MAX_LENGTH} caracteres`
  )
  .regex(
    UBICACION_VALIDATION.CODIGO.REGEX,
    'El código solo puede contener letras, números, guiones (-) y guiones bajos (_)'
  )
  .trim()
  .transform((val) => val.toUpperCase());

/**
 * Schema base para nombre de ubicación
 *
 * Reglas:
 * - 1-150 caracteres
 * - Requerido
 */
const nombreSchema = z
  .string()
  .min(1, 'El nombre de la ubicación es requerido')
  .max(
    UBICACION_VALIDATION.NOMBRE.MAX_LENGTH,
    `El nombre no puede exceder ${UBICACION_VALIDATION.NOMBRE.MAX_LENGTH} caracteres`
  )
  .trim();

/**
 * Schema base para cliente_id
 *
 * Reglas:
 * - Número entero positivo
 * - Requerido en create
 */
const clienteIdSchema = z
  .number()
  .int('El cliente_id debe ser un número entero')
  .positive('El cliente_id debe ser un número positivo');

/**
 * Schema base para coordenadas GPS
 *
 * Reglas:
 * - Formato: "latitud,longitud"
 * - Ejemplo: "18.486058,-69.931212"
 * - Latitud: -90 a 90
 * - Longitud: -180 a 180
 * - Opcional (nullable)
 *
 * Validaciones:
 * 1. Formato correcto (regex)
 * 2. Valores numéricos parseables
 * 3. Rangos válidos de lat/lng
 */
const coordenadasGPSSchema = z.preprocess(
  (val) => {
    if (val === '' || val === null || val === undefined) return null;
    return typeof val === 'string' ? val.trim() : val;
  },
  z.string().regex(
    UBICACION_VALIDATION.COORDENADAS.REGEX,
    'Formato inválido. Use: latitud,longitud (ej: "18.486058,-69.931212")'
  )
  .refine(
    (val) => {
      const parts = val.split(',').map(s => s.trim());
      if (parts.length !== 2) return false;
      const lat = parseFloat(parts[0]);
      const lng = parseFloat(parts[1]);
      return !isNaN(lat) && !isNaN(lng);
    },
    {
      message: 'Las coordenadas deben ser números válidos'
    }
  )
  .refine(
    (val) => {
      const [lat, lng] = val.split(',').map(parseFloat);

      const latValid =
        lat >= UBICACION_VALIDATION.COORDENADAS.LATITUD_MIN &&
        lat <= UBICACION_VALIDATION.COORDENADAS.LATITUD_MAX;

      const lngValid =
        lng >= UBICACION_VALIDATION.COORDENADAS.LONGITUD_MIN &&
        lng <= UBICACION_VALIDATION.COORDENADAS.LONGITUD_MAX;

      return latValid && lngValid;
    },
    {
      message: `Coordenadas fuera de rango. Latitud: ${UBICACION_VALIDATION.COORDENADAS.LATITUD_MIN} a ${UBICACION_VALIDATION.COORDENADAS.LATITUD_MAX}, Longitud: ${UBICACION_VALIDATION.COORDENADAS.LONGITUD_MIN} a ${UBICACION_VALIDATION.COORDENADAS.LONGITUD_MAX}`
    }
  )
  .nullable()
).optional();

/**
 * Schema base para provincia
 *
 * Reglas:
 * - Máximo 50 caracteres
 * - Opcional (nullable)
 */
const provinciaSchema = z
  .string()
  .max(
    UBICACION_VALIDATION.PROVINCIA.MAX_LENGTH,
    `La provincia no puede exceder ${UBICACION_VALIDATION.PROVINCIA.MAX_LENGTH} caracteres`
  )
  .trim()
  .optional()
  .nullable();

/**
 * Schema base para municipio
 *
 * Reglas:
 * - Máximo 50 caracteres
 * - Opcional (nullable)
 */
const municipioSchema = z
  .string()
  .max(
    UBICACION_VALIDATION.MUNICIPIO.MAX_LENGTH,
    `El municipio no puede exceder ${UBICACION_VALIDATION.MUNICIPIO.MAX_LENGTH} caracteres`
  )
  .trim()
  .optional()
  .nullable();

/**
 * Schema base para sector
 *
 * Reglas:
 * - Máximo 100 caracteres
 * - Opcional (nullable)
 */
const sectorSchema = z
  .string()
  .max(
    UBICACION_VALIDATION.SECTOR.MAX_LENGTH,
    `El sector no puede exceder ${UBICACION_VALIDATION.SECTOR.MAX_LENGTH} caracteres`
  )
  .trim()
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
const telefonoSchema = z
  .string()
  .min(
    UBICACION_VALIDATION.TELEFONO.MIN_LENGTH,
    `El teléfono debe tener al menos ${UBICACION_VALIDATION.TELEFONO.MIN_LENGTH} caracteres`
  )
  .max(
    UBICACION_VALIDATION.TELEFONO.MAX_LENGTH,
    `El teléfono no puede exceder ${UBICACION_VALIDATION.TELEFONO.MAX_LENGTH} caracteres`
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
const direccionSchema = z
  .string()
  .max(
    UBICACION_VALIDATION.DIRECCION.MAX_LENGTH,
    `La dirección no puede exceder ${UBICACION_VALIDATION.DIRECCION.MAX_LENGTH} caracteres`
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
const contactoNombreSchema = z
  .string()
  .max(
    UBICACION_VALIDATION.CONTACTO_NOMBRE.MAX_LENGTH,
    `El nombre del contacto no puede exceder ${UBICACION_VALIDATION.CONTACTO_NOMBRE.MAX_LENGTH} caracteres`
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
 * Schema para crear nueva ubicación
 *
 * POST /api/ubicaciones
 * Body: {
 *   cliente_id,
 *   codigo,
 *   nombre,
 *   direccion?,
 *   provincia?,
 *   municipio?,
 *   sector?,
 *   coordenadas_gps?,
 *   telefono?,
 *   contacto_nombre?,
 *   contacto_telefono?
 * }
 */
export const createUbicacionSchema = z.object({
  cliente_id: clienteIdSchema,
  codigo: codigoSchema,
  nombre: nombreSchema,
  direccion: direccionSchema,
  provincia: provinciaSchema,
  municipio: municipioSchema,
  sector: sectorSchema,
  coordenadas_gps: coordenadasGPSSchema,
  telefono: telefonoSchema,
  contacto_nombre: contactoNombreSchema,
  contacto_telefono: contactoTelefonoSchema
});

/**
 * Tipo inferido del createUbicacionSchema
 */
export type CreateUbicacionInput = z.infer<typeof createUbicacionSchema>;

/**
 * Schema para actualizar ubicación existente
 *
 * PUT /api/ubicaciones/:id
 * Body: {
 *   codigo?,
 *   nombre?,
 *   direccion?,
 *   provincia?,
 *   municipio?,
 *   sector?,
 *   coordenadas_gps?,
 *   telefono?,
 *   contacto_nombre?,
 *   contacto_telefono?,
 *   activo?
 * }
 *
 * Nota 1: Todos los campos son opcionales, pero al menos uno debe ser proporcionado
 * Nota 2: cliente_id NO se puede cambiar (omitido intencionalmente)
 */
export const updateUbicacionSchema = z
  .object({
    codigo: codigoSchema.optional(),
    nombre: nombreSchema.optional(),
    direccion: direccionSchema,
    provincia: provinciaSchema,
    municipio: municipioSchema,
    sector: sectorSchema,
    coordenadas_gps: coordenadasGPSSchema,
    telefono: telefonoSchema,
    contacto_nombre: contactoNombreSchema,
    contacto_telefono: contactoTelefonoSchema,
    activo: activoSchema
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: 'Debe proporcionar al menos un campo para actualizar'
  });

/**
 * Tipo inferido del updateUbicacionSchema
 */
export type UpdateUbicacionInput = z.infer<typeof updateUbicacionSchema>;

/**
 * Schema para parámetro ID de ubicación en rutas
 *
 * GET /api/ubicaciones/:id
 * PUT /api/ubicaciones/:id
 * DELETE /api/ubicaciones/:id
 *
 * Valida que el ID sea un número positivo
 */
export const ubicacionIdParamSchema = z.object({
  id: z
    .string()
    .regex(/^\d+$/, 'ID de ubicación inválido')
    .transform(Number)
    .refine((n) => n > 0, 'ID de ubicación debe ser positivo')
});

/**
 * Tipo inferido del ubicacionIdParamSchema
 */
export type UbicacionIdParam = z.infer<typeof ubicacionIdParamSchema>;

/**
 * Schema para query params de paginación, búsqueda y filtro
 *
 * GET /api/ubicaciones?page=1&pageSize=20&search=principal&cliente_id=42
 *
 * Query params:
 * - page: número de página (default: 1)
 * - pageSize: registros por página (default: 20, max: 1000)
 * - search: búsqueda por nombre, dirección, provincia, municipio
 * - cliente_id: filtrar por cliente específico (opcional)
 */
export const ubicacionesPaginationQuerySchema = z.object({
  page: z
    .string()
    .optional()
    .default('1')
    .transform(Number)
    .refine((n) => n > 0, 'La página debe ser mayor a 0'),
  pageSize: z
    .string()
    .optional()
    .default('20')
    .transform(Number)
    .refine((n) => n > 0 && n <= 1000, 'El tamaño de página debe estar entre 1 y 1000'),
  search: z
    .string()
    .optional()
    .transform((val) => (val?.trim() ? val.trim() : undefined)),
  cliente_id: z
    .string()
    .optional()
    .transform((val) => (val ? Number(val) : undefined))
    .refine((n) => n === undefined || (Number.isInteger(n) && n > 0), {
      message: 'El cliente_id debe ser un número entero positivo'
    })
});

/**
 * Tipo inferido del ubicacionesPaginationQuerySchema
 */
export type UbicacionesPaginationQuery = z.infer<typeof ubicacionesPaginationQuerySchema>;

// ============================================================================
// SCHEMAS DE VALIDACIÓN DE RESPONSES (OPCIONAL)
// ============================================================================

/**
 * Schema para validar response de ubicación individual
 *
 * Útil para tests o validación de responses de API
 */
export const ubicacionResponseSchema = z.object({
  id: z.number(),
  cliente_id: z.number(),
  codigo: z.string(),
  nombre: z.string(),
  direccion: z.string().nullable(),
  provincia: z.string().nullable(),
  municipio: z.string().nullable(),
  sector: z.string().nullable(),
  latitud: z.number().nullable(),
  longitud: z.number().nullable(),
  telefono: z.string().nullable(),
  contacto_nombre: z.string().nullable(),
  contacto_telefono: z.string().nullable(),
  activo: z.preprocess(v => v === 1 ? true : v === 0 ? false : v, z.boolean()),
  created_at: z.union([z.string(), z.date()]), // Puede ser string (JSON) o Date
  updated_at: z.union([z.string(), z.date()])
});

/**
 * Schema para validar response de listado paginado
 */
export const paginatedUbicacionesResponseSchema = z.object({
  data: z.array(ubicacionResponseSchema),
  total: z.number(),
  page: z.number(),
  pageSize: z.number(),
  totalPages: z.number()
});

/**
 * Schema para validar response de ubicación con relaciones
 *
 * Usado en GET /api/ubicaciones/:id
 */
export const ubicacionConRelacionesResponseSchema = ubicacionResponseSchema.extend({
  cliente_nombre: z.string(),
  puestos_count: z.number()
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
 * const data = await validateRequest(createUbicacionSchema, req.body);
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
 * const result = safeValidate(createUbicacionSchema, req.body);
 * if (!result.success) {
 *   return res.status(400).json({ errors: result.error.issues });
 * }
 * const data = result.data;
 */
export function safeValidate<T extends z.ZodTypeAny>(schema: T, data: unknown) {
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
export const ubicacionSchemas = {
  createUbicacion: createUbicacionSchema,
  updateUbicacion: updateUbicacionSchema,
  ubicacionIdParam: ubicacionIdParamSchema,
  paginationQuery: ubicacionesPaginationQuerySchema,
  ubicacionResponse: ubicacionResponseSchema,
  paginatedResponse: paginatedUbicacionesResponseSchema,
  ubicacionConRelaciones: ubicacionConRelacionesResponseSchema
} as const;

/**
 * Tipo para los nombres de schemas disponibles
 */
export type UbicacionSchemaName = keyof typeof ubicacionSchemas;
