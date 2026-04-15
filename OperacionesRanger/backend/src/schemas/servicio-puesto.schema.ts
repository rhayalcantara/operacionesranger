/**
 * Schemas de Validación para Servicios por Puesto
 * Sistema de Gestión de Turnos - OperacionesRanger
 *
 * Define los schemas Zod para validación de requests de la API de servicios por puesto.
 * Estos schemas se usan en el middleware de validación para asegurar
 * que los datos recibidos cumplen con los requisitos.
 *
 * @module schemas/servicio-puesto.schema
 */

import { z } from 'zod';
// Note: TIPOS_TURNO from model not imported here - using literal enum values
// to match Zod's type inference requirements

// ============================================================================
// HELPERS
// ============================================================================

/**
 * Schema reutilizable para un ID de empleado opcional (nullable)
 * Acepta número entero positivo o null
 */
const optionalEmployeeId = z
  .number()
  .int('empleado_id debe ser un número entero')
  .positive('empleado_id debe ser positivo')
  .nullable()
  .optional();

// ============================================================================
// SCHEMAS DE VALIDACIÓN PARA BODY
// ============================================================================

/**
 * Schema para crear nuevo servicio por puesto
 *
 * Usado en: POST /api/servicios-puesto
 *
 * Valida:
 * - puesto_id: número positivo requerido
 * - tipo_turno: enum DIURNO | NOCTURNO requerido
 * - 7 campos de empleado por día: número positivo nullable opcional
 * - cobrada: booleano opcional (default: false)
 */
export const createServicioPuestoSchema = z.object({
  puesto_id: z
    .number()
    .int('puesto_id debe ser un número entero')
    .positive('puesto_id debe ser positivo'),

  tipo_turno: z
    .enum(['DIURNO', 'NOCTURNO']),

  domingo_empleado_id: optionalEmployeeId,
  lunes_empleado_id: optionalEmployeeId,
  martes_empleado_id: optionalEmployeeId,
  miercoles_empleado_id: optionalEmployeeId,
  jueves_empleado_id: optionalEmployeeId,
  viernes_empleado_id: optionalEmployeeId,
  sabado_empleado_id: optionalEmployeeId,

  cobrada: z
    .preprocess(v => v === 1 ? true : v === 0 ? false : v, z.boolean())
    .default(false)
    .optional(),
});

/**
 * Schema para actualizar servicio por puesto existente
 *
 * Usado en: PUT /api/servicios-puesto/:id
 *
 * Todos los campos son opcionales.
 */
export const updateServicioPuestoSchema = z.object({
  tipo_turno: z
    .enum(['DIURNO', 'NOCTURNO'])
    .optional(),

  domingo_empleado_id: optionalEmployeeId,
  lunes_empleado_id: optionalEmployeeId,
  martes_empleado_id: optionalEmployeeId,
  miercoles_empleado_id: optionalEmployeeId,
  jueves_empleado_id: optionalEmployeeId,
  viernes_empleado_id: optionalEmployeeId,
  sabado_empleado_id: optionalEmployeeId,

  cobrada: z
    .preprocess(v => v === 1 ? true : v === 0 ? false : v, z.boolean())
    .optional(),

  activo: z
    .preprocess(v => v === 1 ? true : v === 0 ? false : v, z.boolean())
    .optional(),
});

// ============================================================================
// SCHEMAS DE VALIDACIÓN PARA PARAMS
// ============================================================================

/**
 * Schema para validar ID de servicio por puesto en path params
 *
 * Usado en: GET, PUT, DELETE /api/servicios-puesto/:id
 *
 * Valida que el ID sea un número entero positivo
 */
export const servicioPuestoIdSchema = z.object({
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
 * Schema para query params de listado de servicios por puesto
 *
 * Usado en: GET /api/servicios-puesto
 *
 * Valida:
 * - page: número >= 1, default 1
 * - pageSize: número 1-1000, default 10
 * - search: string opcional para búsqueda
 * - puesto_id: número positivo opcional
 * - ubicacion_id: número positivo opcional
 * - cliente_id: número positivo opcional
 * - tipo_turno: enum DIURNO | NOCTURNO opcional
 * - cobrada: booleano opcional
 * - activo: booleano opcional
 */
export const getServiciosPuestoQuerySchema = z.object({
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

  puesto_id: z
    .string()
    .regex(/^\d+$/, 'puesto_id debe ser un número')
    .transform(val => parseInt(val, 10))
    .refine(val => val > 0, 'puesto_id debe ser positivo')
    .optional(),

  ubicacion_id: z
    .string()
    .regex(/^\d+$/, 'ubicacion_id debe ser un número')
    .transform(val => parseInt(val, 10))
    .refine(val => val > 0, 'ubicacion_id debe ser positivo')
    .optional(),

  cliente_id: z
    .string()
    .regex(/^\d+$/, 'cliente_id debe ser un número')
    .transform(val => parseInt(val, 10))
    .refine(val => val > 0, 'cliente_id debe ser positivo')
    .optional(),

  tipo_turno: z
    .enum(['DIURNO', 'NOCTURNO'])
    .optional(),

  cobrada: z
    .string()
    .refine(val => val === 'true' || val === 'false', 'cobrada debe ser true o false')
    .transform(val => val === 'true')
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
export type CreateServicioPuestoInput = z.infer<typeof createServicioPuestoSchema>;

/** Type inferido del schema de actualización */
export type UpdateServicioPuestoInput = z.infer<typeof updateServicioPuestoSchema>;

/** Type inferido del schema de ID */
export type ServicioPuestoIdInput = z.infer<typeof servicioPuestoIdSchema>;

/** Type inferido del schema de query params para listado */
export type GetServiciosPuestoQueryInput = z.infer<typeof getServiciosPuestoQuerySchema>;
