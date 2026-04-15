/**
 * Schemas de Validacion para Reporte de Horas Trabajadas
 * Sistema de Gestion de Turnos - OperacionesRanger
 *
 * Define los schemas Zod para validacion de query params del reporte de horas.
 * Valida formato de fechas, rango maximo de 31 dias, y filtros opcionales.
 *
 * @module schemas/reporte-horas.schema
 */

import { z } from 'zod';

// ============================================================================
// HELPERS
// ============================================================================

/** Regex para formato de fecha YYYY-MM-DD */
const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;

// ============================================================================
// SCHEMA DE QUERY PARAMS
// ============================================================================

/**
 * Schema para query params del reporte de horas trabajadas
 *
 * Usado en: GET /api/reportes/horas
 *
 * Valida:
 * - fecha_inicio: string YYYY-MM-DD requerido
 * - fecha_fin: string YYYY-MM-DD requerido, >= fecha_inicio
 * - tipo: enum 'empleado' | 'puesto' requerido
 * - empleado_id: numero positivo opcional
 * - puesto_id: numero positivo opcional
 * - Rango maximo: 31 dias
 */
export const reporteHorasQuerySchema = z
  .object({
    fecha_inicio: z
      .string()
      .regex(DATE_REGEX, 'fecha_inicio debe tener formato YYYY-MM-DD'),

    fecha_fin: z
      .string()
      .regex(DATE_REGEX, 'fecha_fin debe tener formato YYYY-MM-DD'),

    tipo: z
      .enum(['empleado', 'puesto'], {
        message: 'tipo debe ser "empleado" o "puesto"',
      }),

    empleado_id: z
      .string()
      .regex(/^\d+$/, 'empleado_id debe ser un numero')
      .transform((val) => parseInt(val, 10))
      .refine((val) => val > 0, 'empleado_id debe ser positivo')
      .optional(),

    puesto_id: z
      .string()
      .regex(/^\d+$/, 'puesto_id debe ser un numero')
      .transform((val) => parseInt(val, 10))
      .refine((val) => val > 0, 'puesto_id debe ser positivo')
      .optional(),
  })
  .refine(
    (data) => {
      const inicio = new Date(data.fecha_inicio);
      const fin = new Date(data.fecha_fin);
      return fin >= inicio;
    },
    {
      message: 'fecha_fin debe ser mayor o igual a fecha_inicio',
      path: ['fecha_fin'],
    }
  )
  .refine(
    (data) => {
      const inicio = new Date(data.fecha_inicio);
      const fin = new Date(data.fecha_fin);
      const diffMs = fin.getTime() - inicio.getTime();
      const diffDays = diffMs / (1000 * 60 * 60 * 24);
      return diffDays <= 31;
    },
    {
      message: 'El rango maximo permitido es de 31 dias',
      path: ['fecha_fin'],
    }
  );

// ============================================================================
// TYPES INFERIDOS
// ============================================================================

/** Type inferido del schema de query params */
export type ReporteHorasQueryInput = z.infer<typeof reporteHorasQuerySchema>;
