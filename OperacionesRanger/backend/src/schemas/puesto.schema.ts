/**
 * Schemas de Validación para Puestos
 * Sistema de Gestión de Turnos - OperacionesRanger
 *
 * Define los schemas Zod para validación de requests de la API de puestos.
 * Estos schemas se usan en el middleware de validación para asegurar
 * que los datos recibidos cumplen con los requisitos.
 *
 * @module schemas/puesto.schema
 */

import { z } from 'zod';
import { PUESTO_VALIDATION } from '../models/puesto.model';

// ============================================================================
// SCHEMAS DE VALIDACIÓN PARA BODY
// ============================================================================

/**
 * Schema para crear nuevo puesto
 *
 * Usado en: POST /api/puestos
 *
 * Valida:
 * - ubicacion_id: número positivo requerido
 * - codigo: string 2-20 caracteres, alfanumérico
 * - nombre: string 1-150 caracteres, requerido
 * - descripcion: string opcional, max 1000 caracteres
 * - cantidad_guardianes: número entero positivo, min 1, max 10, default 1
 * - requiere_turno_diurno: booleano, default true
 * - requiere_turno_nocturno: booleano, default true
 */
export const createPuestoSchema = z.object({
  ubicacion_id: z
    .number()
    .int('ubicacion_id debe ser un número entero')
    .positive('ubicacion_id debe ser positivo'),

  codigo: z
    .string()
    .min(
      PUESTO_VALIDATION.CODIGO.MIN_LENGTH,
      `codigo debe tener al menos ${PUESTO_VALIDATION.CODIGO.MIN_LENGTH} caracteres`
    )
    .max(
      PUESTO_VALIDATION.CODIGO.MAX_LENGTH,
      `codigo debe tener máximo ${PUESTO_VALIDATION.CODIGO.MAX_LENGTH} caracteres`
    )
    .regex(
      PUESTO_VALIDATION.CODIGO.REGEX,
      'codigo solo puede contener letras, números, guiones y guiones bajos'
    )
    .trim()
    .transform(val => val.toUpperCase()), // Normalizar a mayúsculas

  nombre: z
    .string()
    .min(
      PUESTO_VALIDATION.NOMBRE.MIN_LENGTH,
      `nombre debe tener al menos ${PUESTO_VALIDATION.NOMBRE.MIN_LENGTH} caracteres`
    )
    .max(
      PUESTO_VALIDATION.NOMBRE.MAX_LENGTH,
      `nombre debe tener máximo ${PUESTO_VALIDATION.NOMBRE.MAX_LENGTH} caracteres`
    )
    .trim(),

  descripcion: z
    .string()
    .max(
      PUESTO_VALIDATION.DESCRIPCION.MAX_LENGTH,
      `descripcion debe tener máximo ${PUESTO_VALIDATION.DESCRIPCION.MAX_LENGTH} caracteres`
    )
    .trim()
    .nullable()
    .optional(),

  cantidad_guardianes: z
    .number()
    .int('cantidad_guardianes debe ser un número entero')
    .min(
      PUESTO_VALIDATION.CANTIDAD_GUARDIANES.MIN,
      `cantidad_guardianes debe ser al menos ${PUESTO_VALIDATION.CANTIDAD_GUARDIANES.MIN}`
    )
    .max(
      PUESTO_VALIDATION.CANTIDAD_GUARDIANES.MAX,
      `cantidad_guardianes debe ser máximo ${PUESTO_VALIDATION.CANTIDAD_GUARDIANES.MAX}`
    )
    .default(1)
    .optional(),

  requiere_turno_diurno: z
    .preprocess(v => v === 1 ? true : v === 0 ? false : v, z.boolean())
    .default(true)
    .optional(),

  requiere_turno_nocturno: z
    .preprocess(v => v === 1 ? true : v === 0 ? false : v, z.boolean())
    .default(true)
    .optional()
});

/**
 * Schema para actualizar puesto existente
 *
 * Usado en: PUT /api/puestos/:id
 *
 * Todos los campos son opcionales.
 * Validaciones iguales a createPuestoSchema pero opcionales.
 */
export const updatePuestoSchema = z.object({
  codigo: z
    .string()
    .min(
      PUESTO_VALIDATION.CODIGO.MIN_LENGTH,
      `codigo debe tener al menos ${PUESTO_VALIDATION.CODIGO.MIN_LENGTH} caracteres`
    )
    .max(
      PUESTO_VALIDATION.CODIGO.MAX_LENGTH,
      `codigo debe tener máximo ${PUESTO_VALIDATION.CODIGO.MAX_LENGTH} caracteres`
    )
    .regex(
      PUESTO_VALIDATION.CODIGO.REGEX,
      'codigo solo puede contener letras, números, guiones y guiones bajos'
    )
    .trim()
    .transform(val => val.toUpperCase())
    .optional(),

  nombre: z
    .string()
    .min(
      PUESTO_VALIDATION.NOMBRE.MIN_LENGTH,
      `nombre debe tener al menos ${PUESTO_VALIDATION.NOMBRE.MIN_LENGTH} caracteres`
    )
    .max(
      PUESTO_VALIDATION.NOMBRE.MAX_LENGTH,
      `nombre debe tener máximo ${PUESTO_VALIDATION.NOMBRE.MAX_LENGTH} caracteres`
    )
    .trim()
    .optional(),

  descripcion: z
    .string()
    .max(
      PUESTO_VALIDATION.DESCRIPCION.MAX_LENGTH,
      `descripcion debe tener máximo ${PUESTO_VALIDATION.DESCRIPCION.MAX_LENGTH} caracteres`
    )
    .trim()
    .nullable()
    .optional(),

  cantidad_guardianes: z
    .number()
    .int('cantidad_guardianes debe ser un número entero')
    .min(
      PUESTO_VALIDATION.CANTIDAD_GUARDIANES.MIN,
      `cantidad_guardianes debe ser al menos ${PUESTO_VALIDATION.CANTIDAD_GUARDIANES.MIN}`
    )
    .max(
      PUESTO_VALIDATION.CANTIDAD_GUARDIANES.MAX,
      `cantidad_guardianes debe ser máximo ${PUESTO_VALIDATION.CANTIDAD_GUARDIANES.MAX}`
    )
    .optional(),

  requiere_turno_diurno: z
    .preprocess(v => v === 1 ? true : v === 0 ? false : v, z.boolean())
    .optional(),

  requiere_turno_nocturno: z
    .preprocess(v => v === 1 ? true : v === 0 ? false : v, z.boolean())
    .optional(),

  activo: z
    .preprocess(v => v === 1 ? true : v === 0 ? false : v, z.boolean())
    .optional()
});

// ============================================================================
// SCHEMAS DE VALIDACIÓN PARA PARAMS
// ============================================================================

/**
 * Schema para validar ID de puesto en path params
 *
 * Usado en: GET /api/puestos/:id, PUT /api/puestos/:id, DELETE /api/puestos/:id
 *
 * Valida que el ID sea un número entero positivo
 */
export const puestoIdSchema = z.object({
  id: z
    .string()
    .regex(/^\d+$/, 'ID debe ser un número')
    .transform(val => parseInt(val, 10))
    .refine(val => val > 0, 'ID debe ser positivo')
});

// ============================================================================
// SCHEMAS DE VALIDACIÓN PARA QUERY PARAMS
// ============================================================================

/**
 * Schema para query params de listado de puestos
 *
 * Usado en: GET /api/puestos
 *
 * Valida:
 * - page: número >= 1, default 1
 * - pageSize: número 1-1000, default 10
 * - search: string opcional para búsqueda
 * - ubicacion_id: número positivo opcional
 * - cliente_id: número positivo opcional
 * - activo: booleano opcional para filtrar por estado
 */
export const getPuestosQuerySchema = z.object({
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

  activo: z
    .string()
    .refine(val => val === 'true' || val === 'false', 'activo debe ser true o false')
    .transform(val => val === 'true')
    .optional()
});

/**
 * Schema para query params de turnos por puesto
 *
 * Usado en: GET /api/puestos/:id/turnos
 *
 * Valida:
 * - page: número >= 1, default 1
 * - pageSize: número 1-1000, default 10
 * - fecha_inicio: fecha ISO opcional
 * - fecha_fin: fecha ISO opcional
 */
export const getTurnosByPuestoQuerySchema = z.object({
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

  fecha_inicio: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'fecha_inicio debe tener formato YYYY-MM-DD')
    .optional(),

  fecha_fin: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'fecha_fin debe tener formato YYYY-MM-DD')
    .optional()
}).refine(
  data => {
    // Si ambas fechas están presentes, fecha_inicio debe ser <= fecha_fin
    if (data.fecha_inicio && data.fecha_fin) {
      return data.fecha_inicio <= data.fecha_fin;
    }
    return true;
  },
  {
    message: 'fecha_inicio debe ser anterior o igual a fecha_fin'
  }
);

// ============================================================================
// TYPES INFERIDOS DE SCHEMAS
// ============================================================================

/**
 * Type inferido del schema de creación
 */
export type CreatePuestoInput = z.infer<typeof createPuestoSchema>;

/**
 * Type inferido del schema de actualización
 */
export type UpdatePuestoInput = z.infer<typeof updatePuestoSchema>;

/**
 * Type inferido del schema de ID
 */
export type PuestoIdInput = z.infer<typeof puestoIdSchema>;

/**
 * Type inferido del schema de query params para listado
 */
export type GetPuestosQueryInput = z.infer<typeof getPuestosQuerySchema>;

/**
 * Type inferido del schema de query params para turnos
 */
export type GetTurnosByPuestoQueryInput = z.infer<typeof getTurnosByPuestoQuerySchema>;
