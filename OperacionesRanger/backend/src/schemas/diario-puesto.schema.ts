/**
 * Schemas de Validación para Diario de Puesto
 * Sistema de Gestión de Turnos - OperacionesRanger
 *
 * Define los schemas Zod para validación de requests de la API de diario de puesto.
 * Estos schemas se usan en el middleware de validación para asegurar
 * que los datos recibidos cumplen con los requisitos.
 *
 * @module schemas/diario-puesto.schema
 */

import { z } from 'zod';

// ============================================================================
// SCHEMAS DE VALIDACIÓN PARA BODY
// ============================================================================

/**
 * Schema para crear nuevo registro de diario de puesto
 *
 * Usado en: POST /api/diario-puesto
 *
 * Valida:
 * - puesto_id: número entero positivo requerido
 * - empleado_id: número entero positivo requerido
 * - fecha: string formato YYYY-MM-DD requerido
 * - horas: número decimal 0-24 requerido
 * - tipo_turno: enum DIURNO | NOCTURNO requerido
 * - servicio_puesto_id: número entero positivo nullable opcional
 * - activo: booleano opcional (default: true)
 */
export const createDiarioPuestoSchema = z.object({
  puesto_id: z
    .number()
    .int('puesto_id debe ser un número entero')
    .positive('puesto_id debe ser positivo'),

  empleado_id: z
    .number()
    .int('empleado_id debe ser un número entero')
    .positive('empleado_id debe ser positivo'),

  fecha: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'fecha debe tener formato YYYY-MM-DD'),

  horas: z
    .number()
    .min(0, 'horas debe ser >= 0')
    .max(24, 'horas debe ser <= 24'),

  tipo_turno: z
    .enum(['DIURNO', 'NOCTURNO']),

  servicio_puesto_id: z
    .number()
    .int('servicio_puesto_id debe ser un número entero')
    .positive('servicio_puesto_id debe ser positivo')
    .nullable()
    .optional(),

  activo: z
    .preprocess(v => v === 1 ? true : v === 0 ? false : v, z.boolean())
    .default(true)
    .optional(),
});

/**
 * Schema para actualizar registro de diario de puesto existente
 *
 * Usado en: PUT /api/diario-puesto/:id
 *
 * Todos los campos son opcionales.
 */
export const updateDiarioPuestoSchema = z.object({
  puesto_id: z
    .number()
    .int('puesto_id debe ser un número entero')
    .positive('puesto_id debe ser positivo')
    .optional(),

  empleado_id: z
    .number()
    .int('empleado_id debe ser un número entero')
    .positive('empleado_id debe ser positivo')
    .optional(),

  fecha: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'fecha debe tener formato YYYY-MM-DD')
    .optional(),

  horas: z
    .number()
    .min(0, 'horas debe ser >= 0')
    .max(24, 'horas debe ser <= 24')
    .optional(),

  tipo_turno: z
    .enum(['DIURNO', 'NOCTURNO'])
    .optional(),

  servicio_puesto_id: z
    .number()
    .int('servicio_puesto_id debe ser un número entero')
    .positive('servicio_puesto_id debe ser positivo')
    .nullable()
    .optional(),

  activo: z
    .preprocess(v => v === 1 ? true : v === 0 ? false : v, z.boolean())
    .optional(),
});

/**
 * Schema para poblar diario de puesto desde plantilla
 *
 * Usado en: POST /api/diario-puesto/poblar-plantilla
 *
 * Valida:
 * - plantilla_id: número entero positivo requerido
 * - fecha: string formato YYYY-MM-DD requerido
 */
export const poblarPlantillaSchema = z.object({
  plantilla_id: z
    .number()
    .int('plantilla_id debe ser un número entero')
    .positive('plantilla_id debe ser positivo'),

  fecha: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'fecha debe tener formato YYYY-MM-DD'),
});

/**
 * Schema para poblar diario de puesto desde servicios por puesto activos
 *
 * Usado en: POST /api/diario-puesto/poblar-servicios
 *
 * Valida:
 * - fecha: string formato YYYY-MM-DD requerido
 */
export const poblarServiciosSchema = z.object({
  fecha: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'fecha debe tener formato YYYY-MM-DD'),
});

// ============================================================================
// SCHEMAS DE VALIDACIÓN PARA PARAMS
// ============================================================================

/**
 * Schema para validar ID de diario de puesto en path params
 *
 * Usado en: GET, PUT, DELETE /api/diario-puesto/:id
 *
 * Valida que el ID sea un número entero positivo
 */
export const diarioPuestoIdSchema = z.object({
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
 * Schema para query params de listado de diario de puesto
 *
 * Usado en: GET /api/diario-puesto
 *
 * Valida:
 * - page: número >= 1, default 1
 * - pageSize: número 1-1000, default 10
 * - fecha: string formato YYYY-MM-DD opcional
 * - puesto_id: número positivo opcional
 * - empleado_id: número positivo opcional
 * - tipo_turno: enum DIURNO | NOCTURNO opcional
 * - activo: booleano opcional
 * - search: string opcional para búsqueda
 */
export const getDiarioPuestoQuerySchema = z.object({
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

  fecha: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'fecha debe tener formato YYYY-MM-DD')
    .optional(),

  puesto_id: z
    .string()
    .regex(/^\d+$/, 'puesto_id debe ser un número')
    .transform(val => parseInt(val, 10))
    .refine(val => val > 0, 'puesto_id debe ser positivo')
    .optional(),

  empleado_id: z
    .string()
    .regex(/^\d+$/, 'empleado_id debe ser un número')
    .transform(val => parseInt(val, 10))
    .refine(val => val > 0, 'empleado_id debe ser positivo')
    .optional(),

  tipo_turno: z
    .enum(['DIURNO', 'NOCTURNO'])
    .optional(),

  activo: z
    .string()
    .refine(val => val === 'true' || val === 'false', 'activo debe ser true o false')
    .transform(val => val === 'true')
    .optional(),

  search: z
    .string()
    .trim()
    .min(1, 'search no puede estar vacío si se proporciona')
    .optional(),
});

// ============================================================================
// TYPES INFERIDOS DE SCHEMAS
// ============================================================================

/** Type inferido del schema de creación */
export type CreateDiarioPuestoInput = z.infer<typeof createDiarioPuestoSchema>;

/** Type inferido del schema de actualización */
export type UpdateDiarioPuestoInput = z.infer<typeof updateDiarioPuestoSchema>;

/** Type inferido del schema de poblar plantilla */
export type PoblarPlantillaInput = z.infer<typeof poblarPlantillaSchema>;

/** Type inferido del schema de ID */
export type DiarioPuestoIdInput = z.infer<typeof diarioPuestoIdSchema>;

/** Type inferido del schema de query params para listado */
export type GetDiarioPuestoQueryInput = z.infer<typeof getDiarioPuestoQuerySchema>;
