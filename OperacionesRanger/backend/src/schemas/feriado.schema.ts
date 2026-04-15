/**
 * Schemas de Validación: Feriado
 *
 * Define los schemas Zod para validar inputs de endpoints de feriados.
 * Garantiza que los datos recibidos cumplan con las reglas de negocio
 * antes de ser procesados.
 *
 * @module schemas/feriado.schema
 */

import { z } from 'zod';
import { TipoFeriado } from '../models/feriado.model';

/**
 * Schema de validación para crear feriado
 *
 * **Validaciones**:
 * - fecha: formato YYYY-MM-DD, fecha válida
 * - nombre: requerido, 1-1000 caracteres
 * - tipo: NACIONAL o DECRETO
 * - descripcion: opcional, max 500 caracteres
 *
 * **Uso en endpoint**: POST /api/feriados
 *
 * @example
 * ```typescript
 * const body = feriadoCreateSchema.parse(req.body);
 * // body tiene tipos correctos y está validado
 * ```
 */
export const feriadoCreateSchema = z.object({
  fecha: z
    .string({ message: 'Fecha es requerida' })
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Fecha debe tener formato YYYY-MM-DD')
    .refine(
      (dateStr) => {
        // Validar que sea una fecha válida
        const date = new Date(dateStr);
        return !isNaN(date.getTime()) && dateStr === date.toISOString().split('T')[0];
      },
      { message: 'Fecha inválida' }
    ),

  nombre: z
    .string({ message: 'Nombre es requerido' })
    .min(1, 'Nombre no puede estar vacío')
    .max(100, 'Nombre no puede exceder 100 caracteres')
    .trim(),

  tipo: z.nativeEnum(TipoFeriado, {
    message: 'Tipo debe ser NACIONAL o DECRETO',
  }),

  descripcion: z
    .string()
    .max(500, 'Descripción no puede exceder 500 caracteres')
    .trim()
    .nullable()
    .optional()
    .transform((val) => (val === '' ? null : val)),
});

/**
 * Schema de validación para actualizar feriado
 *
 * Similar a feriadoCreateSchema pero con todos los campos opcionales.
 * Al menos un campo debe estar presente para que la actualización tenga sentido.
 *
 * **Validaciones**:
 * - Todos los campos son opcionales
 * - Mismas reglas de validación que el create cuando están presentes
 *
 * **Uso en endpoint**: PUT /api/feriados/:id
 *
 * @example
 * ```typescript
 * const body = feriadoUpdateSchema.parse(req.body);
 * // body contiene solo los campos que se quieren actualizar
 * ```
 */
export const feriadoUpdateSchema = z
  .object({
    fecha: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, 'Fecha debe tener formato YYYY-MM-DD')
      .refine(
        (dateStr) => {
          const date = new Date(dateStr);
          return !isNaN(date.getTime()) && dateStr === date.toISOString().split('T')[0];
        },
        { message: 'Fecha inválida' }
      )
      .optional(),

    nombre: z
      .string()
      .min(1, 'Nombre no puede estar vacío')
      .max(100, 'Nombre no puede exceder 100 caracteres')
      .trim()
      .optional(),

    tipo: z.nativeEnum(TipoFeriado).optional(),

    descripcion: z
      .string()
      .max(500, 'Descripción no puede exceder 500 caracteres')
      .trim()
      .nullable()
      .optional()
      .transform((val) => (val === '' ? null : val)),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: 'Debe proporcionar al menos un campo para actualizar',
  });

/**
 * Schema de validación para parámetros de ruta (ID)
 *
 * Valida que el parámetro :id sea un número entero positivo.
 *
 * **Uso en endpoints**:
 * - GET /api/feriados/:id
 * - PUT /api/feriados/:id
 * - DELETE /api/feriados/:id
 *
 * @example
 * ```typescript
 * const { id } = feriadoIdParamSchema.parse(req.params);
 * // id es un número entero positivo
 * ```
 */
export const feriadoIdParamSchema = z.object({
  id: z
    .string()
    .regex(/^\d+$/, 'ID debe ser un número entero positivo')
    .transform((val) => parseInt(val, 10))
    .refine((val) => val > 0, 'ID debe ser mayor que 0'),
});

/**
 * Schema de validación para parámetro de fecha en verificación
 *
 * Valida que el parámetro :fecha tenga formato YYYY-MM-DD.
 *
 * **Uso en endpoint**: GET /api/feriados/verificar/:fecha
 *
 * @example
 * ```typescript
 * const { fecha } = feriadoFechaParamSchema.parse(req.params);
 * // fecha es un string con formato válido YYYY-MM-DD
 * ```
 */
export const feriadoFechaParamSchema = z.object({
  fecha: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Fecha debe tener formato YYYY-MM-DD')
    .refine(
      (dateStr) => {
        const date = new Date(dateStr);
        return !isNaN(date.getTime()) && dateStr === date.toISOString().split('T')[0];
      },
      { message: 'Fecha inválida' }
    ),
});

/**
 * Schema de validación para query params de paginación y filtros
 *
 * Valida los parámetros de query para listar feriados con paginación y filtros.
 *
 * **Parámetros**:
 * - page: número de página (default: 1, min: 1)
 * - pageSize: registros por página (default: 10, min: 1, max: 1000)
 * - año: año calendario para filtrar (ej: 2026)
 * - tipo: tipo de feriado (NACIONAL o DECRETO)
 *
 * **Uso en endpoint**: GET /api/feriados
 *
 * @example
 * ```typescript
 * const query = feriadoQuerySchema.parse(req.query);
 * // query tiene valores validados y parseados
 * // query.page es un número (no string)
 * ```
 */
export const feriadoQuerySchema = z.object({
  page: z
    .string()
    .optional()
    .default('1')
    .transform((val) => parseInt(val, 10))
    .refine((val) => val >= 1, 'Page debe ser mayor o igual a 1'),

  pageSize: z
    .string()
    .optional()
    .default('10')
    .transform((val) => parseInt(val, 10))
    .refine((val) => val >= 1, 'PageSize debe ser mayor o igual a 1')
    .refine((val) => val <= 1000, 'PageSize no puede exceder 100'),

  año: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val, 10) : undefined))
    .refine(
      (val) => val === undefined || (val >= 2000 && val <= 2100),
      'Año debe estar entre 2000 y 2100'
    ),

  tipo: z
    .string()
    .optional()
    .refine(
      (val) => val === undefined || Object.values(TipoFeriado).includes(val as TipoFeriado),
      'Tipo debe ser NACIONAL o DECRETO'
    )
    .transform((val) => val as TipoFeriado | undefined),
});

/**
 * Tipos TypeScript inferidos de los schemas
 *
 * Estos tipos se pueden usar en controllers y services para garantizar
 * type safety con los datos ya validados por Zod.
 */
export type FeriadoCreateInput = z.infer<typeof feriadoCreateSchema>;
export type FeriadoUpdateInput = z.infer<typeof feriadoUpdateSchema>;
export type FeriadoIdParam = z.infer<typeof feriadoIdParamSchema>;
export type FeriadoFechaParam = z.infer<typeof feriadoFechaParamSchema>;
export type FeriadoQuery = z.infer<typeof feriadoQuerySchema>;
