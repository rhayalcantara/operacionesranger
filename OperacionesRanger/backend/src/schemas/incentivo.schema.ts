/**
 * Schemas de Validacion para Incentivos
 * Sistema de Gestion de Turnos - OperacionesRanger
 *
 * Define los schemas Zod para validacion de requests de la API de incentivos.
 *
 * @module schemas/incentivo.schema
 */

import { z } from 'zod';
import { INCENTIVO_VALIDATION } from '../models/incentivo.model';

// ============================================================================
// SCHEMAS DE VALIDACION PARA BODY
// ============================================================================

/**
 * Schema para crear nuevo incentivo
 *
 * Usado en: POST /api/incentivos
 */
export const createIncentivoSchema = z.object({
  puesto_id: z
    .number()
    .int('puesto_id debe ser un numero entero')
    .positive('puesto_id debe ser positivo'),

  monto: z
    .number()
    .positive('monto debe ser mayor que 0')
    .max(
      INCENTIVO_VALIDATION.MONTO.MAX,
      `monto debe ser maximo ${INCENTIVO_VALIDATION.MONTO.MAX}`
    )
    .refine(
      val => {
        const decimalPart = val.toString().split('.')[1];
        return !decimalPart || decimalPart.length <= INCENTIVO_VALIDATION.MONTO.DECIMALS;
      },
      {
        message: `monto debe tener maximo ${INCENTIVO_VALIDATION.MONTO.DECIMALS} decimales`
      }
    ),

  concepto: z
    .string()
    .max(
      INCENTIVO_VALIDATION.CONCEPTO.MAX_LENGTH,
      `concepto debe tener maximo ${INCENTIVO_VALIDATION.CONCEPTO.MAX_LENGTH} caracteres`
    )
    .trim()
    .nullable()
    .optional(),

  activo: z
    .preprocess(
      (val) => {
        if (val === 1 || val === '1' || val === 'true' || val === true) return true;
        if (val === 0 || val === '0' || val === 'false' || val === false) return false;
        return val;
      },
      z.boolean()
    )
    .optional()
    .default(true)
});

/**
 * Schema para actualizar incentivo existente
 *
 * Usado en: PUT /api/incentivos/:id
 */
export const updateIncentivoSchema = z.object({
  monto: z
    .number()
    .positive('monto debe ser mayor que 0')
    .max(
      INCENTIVO_VALIDATION.MONTO.MAX,
      `monto debe ser maximo ${INCENTIVO_VALIDATION.MONTO.MAX}`
    )
    .refine(
      val => {
        const decimalPart = val.toString().split('.')[1];
        return !decimalPart || decimalPart.length <= INCENTIVO_VALIDATION.MONTO.DECIMALS;
      },
      {
        message: `monto debe tener maximo ${INCENTIVO_VALIDATION.MONTO.DECIMALS} decimales`
      }
    )
    .optional(),

  concepto: z
    .string()
    .max(
      INCENTIVO_VALIDATION.CONCEPTO.MAX_LENGTH,
      `concepto debe tener maximo ${INCENTIVO_VALIDATION.CONCEPTO.MAX_LENGTH} caracteres`
    )
    .trim()
    .nullable()
    .optional(),

  activo: z
    .preprocess(
      (val) => {
        if (val === 1 || val === '1' || val === 'true' || val === true) return true;
        if (val === 0 || val === '0' || val === 'false' || val === false) return false;
        return val;
      },
      z.boolean()
    )
    .optional()
});

// ============================================================================
// SCHEMAS DE VALIDACION PARA PARAMS
// ============================================================================

/**
 * Schema para validar ID de incentivo en path params
 */
export const incentivoIdSchema = z.object({
  id: z
    .string()
    .regex(/^\d+$/, 'ID debe ser un numero')
    .transform(val => parseInt(val, 10))
    .refine(val => val > 0, 'ID debe ser positivo')
});

// ============================================================================
// SCHEMAS DE VALIDACION PARA QUERY PARAMS
// ============================================================================

/**
 * Schema para query params de listado de incentivos
 *
 * Usado en: GET /api/incentivos
 */
export const getIncentivosQuerySchema = z.object({
  page: z
    .string()
    .regex(/^\d+$/, 'page debe ser un numero')
    .transform((val) => parseInt(val, 10))
    .refine((val) => val >= 1, 'page debe ser >= 1')
    .optional()
    .default(1),

  pageSize: z
    .string()
    .regex(/^\d+$/, 'pageSize debe ser un numero')
    .transform((val) => parseInt(val, 10))
    .refine((val) => val >= 1 && val <= 1000, 'pageSize debe estar entre 1 y 1000')
    .optional()
    .default(10),

  puesto_id: z
    .string()
    .regex(/^\d+$/, 'puesto_id debe ser un numero')
    .transform(val => parseInt(val, 10))
    .refine(val => val > 0, 'puesto_id debe ser positivo')
    .optional(),

  activo: z
    .string()
    .regex(/^(true|false|1|0)$/, 'activo debe ser true/false o 1/0')
    .transform(val => val === 'true' || val === '1')
    .optional(),

  search: z
    .string()
    .max(200, 'search debe tener maximo 200 caracteres')
    .optional()
});

// ============================================================================
// TYPES INFERIDOS DE SCHEMAS
// ============================================================================

export type CreateIncentivoInput = z.infer<typeof createIncentivoSchema>;
export type UpdateIncentivoInput = z.infer<typeof updateIncentivoSchema>;
export type IncentivoIdInput = z.infer<typeof incentivoIdSchema>;
export type GetIncentivosQueryInput = z.infer<typeof getIncentivosQuerySchema>;
