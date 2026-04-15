/**
 * Schemas de Validación para Plantillas de Servicio
 * Sistema de Gestión de Turnos - OperacionesRanger
 *
 * Define los schemas Zod para validación de requests de la API de plantillas de servicio.
 * Estos schemas se usan en el middleware de validación para asegurar
 * que los datos recibidos cumplen con los requisitos.
 *
 * @module schemas/plantilla-servicio.schema
 */

import { z } from 'zod';

// ============================================================================
// HELPERS
// ============================================================================

/**
 * Schema reutilizable para un detalle de plantilla
 */
const detalleSchema = z.object({
  puesto_id: z
    .number()
    .int('puesto_id debe ser un número entero')
    .positive('puesto_id debe ser positivo'),

  servicio_puesto_id: z
    .number()
    .int('servicio_puesto_id debe ser un número entero')
    .positive('servicio_puesto_id debe ser positivo'),
});

// ============================================================================
// SCHEMAS DE VALIDACIÓN PARA BODY
// ============================================================================

/**
 * Schema para crear nueva plantilla de servicio
 *
 * Usado en: POST /api/plantillas-servicio
 *
 * Valida:
 * - nombre: string 1-1000 chars requerido
 * - descripcion: string 0-500 chars opcional
 * - detalles: array de {puesto_id, servicio_puesto_id} con al menos 1 elemento
 */
export const createPlantillaServicioSchema = z.object({
  nombre: z
    .string()
    .trim()
    .min(1, 'nombre es requerido')
    .max(100, 'nombre no puede exceder 100 caracteres'),

  descripcion: z
    .string()
    .trim()
    .max(500, 'descripcion no puede exceder 500 caracteres')
    .nullable()
    .optional(),

  detalles: z
    .array(detalleSchema)
    .min(1, 'Debe incluir al menos un detalle'),
});

/**
 * Schema para actualizar plantilla de servicio existente
 *
 * Usado en: PUT /api/plantillas-servicio/:id
 *
 * Todos los campos son opcionales.
 */
export const updatePlantillaServicioSchema = z.object({
  nombre: z
    .string()
    .trim()
    .min(1, 'nombre no puede estar vacío')
    .max(100, 'nombre no puede exceder 100 caracteres')
    .optional(),

  descripcion: z
    .string()
    .trim()
    .max(500, 'descripcion no puede exceder 500 caracteres')
    .nullable()
    .optional(),

  detalles: z
    .array(detalleSchema)
    .min(1, 'Si se proporcionan detalles, debe incluir al menos uno')
    .optional(),
});

// ============================================================================
// SCHEMAS DE VALIDACIÓN PARA PARAMS
// ============================================================================

/**
 * Schema para validar ID de plantilla en path params
 *
 * Usado en: GET, PUT, DELETE /api/plantillas-servicio/:id
 */
export const plantillaServicioIdSchema = z.object({
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
 * Schema para query params de listado de plantillas
 *
 * Usado en: GET /api/plantillas-servicio
 *
 * Valida:
 * - page: número >= 1, default 1
 * - pageSize: número 1-1000, default 10
 * - search: string opcional para búsqueda por nombre/descripcion
 * - activo: booleano opcional
 */
export const getPlantillasServicioQuerySchema = z.object({
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
export type CreatePlantillaServicioInput = z.infer<typeof createPlantillaServicioSchema>;

/** Type inferido del schema de actualización */
export type UpdatePlantillaServicioInput = z.infer<typeof updatePlantillaServicioSchema>;

/** Type inferido del schema de ID */
export type PlantillaServicioIdInput = z.infer<typeof plantillaServicioIdSchema>;

/** Type inferido del schema de query params para listado */
export type GetPlantillasServicioQueryInput = z.infer<typeof getPlantillasServicioQuerySchema>;
