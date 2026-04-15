/**
 * Schemas de Validación para Cronogramas
 * Sistema de Gestión de Turnos - OperacionesRanger
 *
 * Define los schemas Zod para validación de requests de la API de cronogramas.
 * Estos schemas se usan en el middleware de validación para asegurar
 * que los datos recibidos cumplen con los requisitos.
 *
 * @module schemas/cronograma.schema
 */

import { z } from 'zod';
import { CRONOGRAMA_VALIDATION } from '../models/cronograma.model';

// ============================================================================
// SCHEMAS DE DETALLE (reutilizable)
// ============================================================================

/**
 * Schema para un detalle de cronograma
 *
 * Valida:
 * - dia_semana: entero 0-6 (0=Domingo, 6=Sábado)
 * - puesto_id: entero positivo
 * - empleado_id: entero positivo
 * - tipo_turno: 'DIURNO' o 'NOCTURNO'
 */
const cronogramaDetalleSchema = z.object({
  dia_semana: z
    .number()
    .int('dia_semana debe ser un número entero')
    .min(
      CRONOGRAMA_VALIDATION.DIA_SEMANA.MIN,
      `dia_semana debe ser al menos ${CRONOGRAMA_VALIDATION.DIA_SEMANA.MIN} (Domingo)`
    )
    .max(
      CRONOGRAMA_VALIDATION.DIA_SEMANA.MAX,
      `dia_semana debe ser máximo ${CRONOGRAMA_VALIDATION.DIA_SEMANA.MAX} (Sábado)`
    ),

  puesto_id: z
    .number()
    .int('puesto_id debe ser un número entero')
    .positive('puesto_id debe ser positivo'),

  empleado_id: z
    .number()
    .int('empleado_id debe ser un número entero')
    .positive('empleado_id debe ser positivo'),

  tipo_turno: z
    .enum(['DIURNO', 'NOCTURNO'], {
      message: 'tipo_turno debe ser DIURNO o NOCTURNO',
    }),
});

// ============================================================================
// SCHEMAS DE VALIDACIÓN PARA BODY
// ============================================================================

/**
 * Schema para crear nuevo cronograma
 *
 * Usado en: POST /api/cronogramas
 *
 * Valida:
 * - nombre: string 1-1000 caracteres, requerido
 * - descripcion: string opcional, max 500 caracteres
 * - detalles: array de asignaciones, al menos 1 elemento
 */
export const createCronogramaSchema = z.object({
  nombre: z
    .string()
    .min(
      CRONOGRAMA_VALIDATION.NOMBRE.MIN_LENGTH,
      `nombre debe tener al menos ${CRONOGRAMA_VALIDATION.NOMBRE.MIN_LENGTH} caracteres`
    )
    .max(
      CRONOGRAMA_VALIDATION.NOMBRE.MAX_LENGTH,
      `nombre debe tener máximo ${CRONOGRAMA_VALIDATION.NOMBRE.MAX_LENGTH} caracteres`
    )
    .trim(),

  descripcion: z
    .string()
    .max(
      CRONOGRAMA_VALIDATION.DESCRIPCION.MAX_LENGTH,
      `descripcion debe tener máximo ${CRONOGRAMA_VALIDATION.DESCRIPCION.MAX_LENGTH} caracteres`
    )
    .trim()
    .nullable()
    .optional(),

  detalles: z
    .array(cronogramaDetalleSchema)
    .min(1, 'Debe incluir al menos una asignación en detalles'),
});

/**
 * Schema para actualizar cronograma existente
 *
 * Usado en: PUT /api/cronogramas/:id
 *
 * Todos los campos son opcionales.
 * Si detalles se proporciona, reemplaza completamente los existentes.
 */
export const updateCronogramaSchema = z.object({
  nombre: z
    .string()
    .min(
      CRONOGRAMA_VALIDATION.NOMBRE.MIN_LENGTH,
      `nombre debe tener al menos ${CRONOGRAMA_VALIDATION.NOMBRE.MIN_LENGTH} caracteres`
    )
    .max(
      CRONOGRAMA_VALIDATION.NOMBRE.MAX_LENGTH,
      `nombre debe tener máximo ${CRONOGRAMA_VALIDATION.NOMBRE.MAX_LENGTH} caracteres`
    )
    .trim()
    .optional(),

  descripcion: z
    .string()
    .max(
      CRONOGRAMA_VALIDATION.DESCRIPCION.MAX_LENGTH,
      `descripcion debe tener máximo ${CRONOGRAMA_VALIDATION.DESCRIPCION.MAX_LENGTH} caracteres`
    )
    .trim()
    .nullable()
    .optional(),

  detalles: z
    .array(cronogramaDetalleSchema)
    .min(1, 'Si se proporcionan detalles, debe incluir al menos una asignación')
    .optional(),
});

// ============================================================================
// SCHEMAS DE VALIDACIÓN PARA PARAMS
// ============================================================================

/**
 * Schema para validar ID de cronograma en path params
 *
 * Usado en: GET/PUT/DELETE /api/cronogramas/:id
 */
export const cronogramaIdSchema = z.object({
  id: z
    .string()
    .regex(/^\d+$/, 'ID debe ser un número')
    .transform(val => parseInt(val, 10))
    .refine(val => val > 0, 'ID debe ser positivo'),
});

// ============================================================================
// SCHEMAS DE VALIDACIÓN PARA QUERY PARAMS
// ============================================================================

/**
 * Schema para query params de listado de cronogramas
 *
 * Usado en: GET /api/cronogramas
 *
 * Valida:
 * - page: número >= 1, default 1
 * - pageSize: número 1-1000, default 10
 * - search: string opcional para búsqueda por nombre/descripción
 * - activo: booleano opcional para filtrar por estado
 */
export const getCronogramasQuerySchema = z.object({
  page: z
    .string()
    .regex(/^\d+$/, 'page debe ser un número')
    .default('1')
    .transform((val: string) => parseInt(val, 10))
    .refine((val: number) => val >= 1, 'page debe ser >= 1')
    .optional(),

  pageSize: z
    .string()
    .regex(/^\d+$/, 'pageSize debe ser un número')
    .default('10')
    .transform((val: string) => parseInt(val, 10))
    .refine((val: number) => val >= 1 && val <= 1000, 'pageSize debe estar entre 1 y 1000')
    .optional(),

  search: z
    .string()
    .trim()
    .min(1, 'search no puede estar vacío si se proporciona')
    .optional(),

  activo: z
    .string()
    .refine(val => val === 'true' || val === 'false', 'activo debe ser true o false')
    .transform(val => val === 'true')
    .optional(),
});

// ============================================================================
// TYPES INFERIDOS DE SCHEMAS
// ============================================================================

/** Type inferido del schema de creación */
export type CreateCronogramaInput = z.infer<typeof createCronogramaSchema>;

/** Type inferido del schema de actualización */
export type UpdateCronogramaInput = z.infer<typeof updateCronogramaSchema>;

/** Type inferido del schema de ID */
export type CronogramaIdInput = z.infer<typeof cronogramaIdSchema>;

/** Type inferido del schema de query params */
export type GetCronogramasQueryInput = z.infer<typeof getCronogramasQuerySchema>;
