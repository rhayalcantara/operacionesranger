/**
 * Common Schemas - Schemas Reutilizables
 * Sistema de Gestión de Turnos - OperacionesRanger
 *
 * Define schemas Zod comunes que se utilizan en múltiples módulos.
 * Reduce duplicación de código y asegura consistencia en validaciones.
 *
 * @module schemas/common.schema
 */

import { z } from 'zod';

// ============================================================================
// SCHEMAS DE QUERY PARAMS COMUNES
// ============================================================================

/**
 * Schema para parámetro 'activo' en query strings
 *
 * Convierte string 'true'/'false' a boolean.
 * Usado para filtrado de soft-delete en endpoints de listado.
 *
 * Valores aceptados:
 * - 'true', '1' → true
 * - 'false', '0' → false
 * - undefined → undefined (sin filtro)
 *
 * @example
 * GET /api/clientes?activo=true → activo = true
 * GET /api/clientes?activo=false → activo = false
 * GET /api/clientes → activo = undefined (todos)
 */
export const activoQueryParam = z
  .string()
  .optional()
  .transform((val) => {
    if (val === undefined) return undefined;
    return val === 'true' || val === '1';
  });

/**
 * Schema para parámetro 'page' en paginación
 *
 * Reglas:
 * - String convertido a número
 * - Valor por defecto: 1
 * - Mínimo: 1
 */
export const pageQueryParam = z
  .string()
  .optional()
  .default('1')
  .transform(Number)
  .refine((n) => n > 0, 'La página debe ser mayor a 0');

/**
 * Schema para parámetro 'pageSize' en paginación
 *
 * Reglas:
 * - String convertido a número
 * - Valor por defecto: 20
 * - Mínimo: 1
 * - Máximo: 100
 */
export const pageSizeQueryParam = z
  .string()
  .optional()
  .default('20')
  .transform(Number)
  .refine((n) => n > 0 && n <= 1000, 'El tamaño de página debe estar entre 1 y 1000');

/**
 * Schema para parámetro 'search' en búsquedas
 *
 * Reglas:
 * - Trim de espacios
 * - Si está vacío, retorna undefined
 */
export const searchQueryParam = z
  .string()
  .optional()
  .transform((val) => val?.trim() || undefined);

// ============================================================================
// SCHEMAS COMPUESTOS REUTILIZABLES
// ============================================================================

/**
 * Schema base para paginación estándar con búsqueda y filtro activo
 *
 * Incluye:
 * - page: número de página (default: 1)
 * - pageSize: tamaño de página (default: 20, max: 1000)
 * - search: término de búsqueda opcional
 * - activo: filtro por estado activo/inactivo
 *
 * Uso en otros schemas:
 * ```typescript
 * import { basePaginationSchema } from './common.schema';
 *
 * export const clientesPaginationQuerySchema = basePaginationSchema.extend({
 *   // campos adicionales específicos del módulo
 * });
 * ```
 */
export const basePaginationSchema = z.object({
  page: pageQueryParam,
  pageSize: pageSizeQueryParam,
  search: searchQueryParam,
  activo: activoQueryParam
});

/**
 * Tipo inferido del basePaginationSchema
 */
export type BasePaginationQuery = z.infer<typeof basePaginationSchema>;

// ============================================================================
// SCHEMAS DE PARAMS COMUNES
// ============================================================================

/**
 * Schema para parámetro ID en rutas (/:id)
 *
 * Valida que el ID sea un número entero positivo
 *
 * @example
 * GET /api/clientes/:id
 * PUT /api/clientes/:id
 * DELETE /api/clientes/:id
 */
export const idParamSchema = z.object({
  id: z
    .string()
    .regex(/^\d+$/, 'ID inválido')
    .transform(Number)
    .refine((n) => n > 0, 'ID debe ser positivo')
});

/**
 * Tipo inferido del idParamSchema
 */
export type IdParam = z.infer<typeof idParamSchema>;

// ============================================================================
// HELPERS DE FECHAS
// ============================================================================

/**
 * Schema para fecha en formato ISO (YYYY-MM-DD)
 *
 * Valida formato y que sea una fecha válida
 */
export const isoDateSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'Fecha debe tener formato YYYY-MM-DD')
  .refine(
    (dateStr) => {
      const date = new Date(dateStr);
      return !isNaN(date.getTime());
    },
    { message: 'Fecha inválida' }
  );

/**
 * Schema para rango de fechas opcional
 *
 * Incluye:
 * - fecha_inicio: fecha de inicio (opcional)
 * - fecha_fin: fecha de fin (opcional)
 */
export const dateRangeSchema = z.object({
  fecha_inicio: isoDateSchema.optional(),
  fecha_fin: isoDateSchema.optional()
});

/**
 * Tipo inferido del dateRangeSchema
 */
export type DateRangeQuery = z.infer<typeof dateRangeSchema>;

// ============================================================================
// SCHEMAS DE RESPUESTAS COMUNES
// ============================================================================

/**
 * Schema para respuesta de paginación estándar
 *
 * Formato esperado:
 * ```json
 * {
 *   "data": [...],
 *   "total": 100,
 *   "page": 1,
 *   "pageSize": 20,
 *   "totalPages": 5
 * }
 * ```
 */
export const paginatedResponseSchema = z.object({
  data: z.array(z.unknown()),
  total: z.number().int().nonnegative(),
  page: z.number().int().positive(),
  pageSize: z.number().int().positive(),
  totalPages: z.number().int().nonnegative()
});

/**
 * Tipo inferido del paginatedResponseSchema
 */
export type PaginatedResponse<T = unknown> = Omit<z.infer<typeof paginatedResponseSchema>, 'data'> & {
  data: T[];
};

/**
 * Schema para respuesta de éxito simple
 *
 * Formato:
 * ```json
 * {
 *   "message": "Operación exitosa"
 * }
 * ```
 */
export const successMessageSchema = z.object({
  message: z.string()
});

/**
 * Schema para respuesta de error
 *
 * Formato:
 * ```json
 * {
 *   "error": "Tipo de error",
 *   "message": "Descripción del error"
 * }
 * ```
 */
export const errorResponseSchema = z.object({
  error: z.string(),
  message: z.string(),
  details: z.array(z.object({
    field: z.string(),
    message: z.string()
  })).optional()
});

// ============================================================================
// EXPORTACIONES
// ============================================================================

/**
 * Todos los schemas comunes agrupados
 */
export const commonSchemas = {
  // Query params
  activoQueryParam,
  pageQueryParam,
  pageSizeQueryParam,
  searchQueryParam,
  basePaginationSchema,

  // Params
  idParamSchema,

  // Fechas
  isoDateSchema,
  dateRangeSchema,

  // Respuestas
  paginatedResponseSchema,
  successMessageSchema,
  errorResponseSchema
} as const;

/**
 * Tipo para los nombres de schemas disponibles
 */
export type CommonSchemaName = keyof typeof commonSchemas;
