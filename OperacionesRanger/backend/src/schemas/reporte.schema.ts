/**
 * Schemas de validación: Reportes
 *
 * Schemas Zod para validar requests de endpoints de reportes.
 * Usado por validationMiddleware para validar automáticamente.
 *
 * @module schemas/reporte.schema
 */

import { z } from 'zod';

/**
 * Schema para validar body de POST /api/reportes/nomina
 *
 * Genera reporte CSV de turnos para nómina en un rango de fechas.
 *
 * **Campos requeridos**:
 * - fecha_inicio: fecha de inicio en formato YYYY-MM-DD
 * - fecha_fin: fecha de fin en formato YYYY-MM-DD
 *
 * **Validaciones**:
 * - Ambas fechas deben estar en formato YYYY-MM-DD
 * - fecha_inicio debe ser <= fecha_fin (validado en servicio)
 * - Rango debe ser <= 31 días (validado en servicio)
 *
 * @example
 * ```json
 * {
 *   "fecha_inicio": "2026-01-01",
 *   "fecha_fin": "2026-01-15"
 * }
 * ```
 */
export const generarReporteNominaSchema = z.object({
  fecha_inicio: z
    .string()
    .regex(
      /^\d{4}-\d{2}-\d{2}$/,
      'Fecha de inicio debe estar en formato YYYY-MM-DD'
    )
    .describe('Fecha de inicio del rango de reporte (YYYY-MM-DD)'),

  fecha_fin: z
    .string()
    .regex(
      /^\d{4}-\d{2}-\d{2}$/,
      'Fecha de fin debe estar en formato YYYY-MM-DD'
    )
    .describe('Fecha de fin del rango de reporte (YYYY-MM-DD)'),
});

/**
 * Type inference para el schema de generación de reporte
 */
export type GenerarReporteNominaInput = z.infer<
  typeof generarReporteNominaSchema
>;

/**
 * Schema para validar body de POST /api/reportes/marcar-procesados
 *
 * Marca turnos como procesados después de importarlos en el sistema de nómina.
 *
 * **Campos requeridos**:
 * - fecha_inicio: fecha de inicio en formato YYYY-MM-DD
 * - fecha_fin: fecha de fin en formato YYYY-MM-DD
 * - nomina_id: ID de la nómina en el sistema de nómina (número entero positivo)
 *
 * **Validaciones**:
 * - Ambas fechas deben estar en formato YYYY-MM-DD
 * - fecha_inicio debe ser <= fecha_fin
 * - nomina_id debe ser número entero positivo
 *
 * @example
 * ```json
 * {
 *   "fecha_inicio": "2026-01-01",
 *   "fecha_fin": "2026-01-15",
 *   "nomina_id": 125
 * }
 * ```
 */
export const marcarProcesadosSchema = z
  .object({
    fecha_inicio: z
      .string()
      .regex(
        /^\d{4}-\d{2}-\d{2}$/,
        'Fecha de inicio debe estar en formato YYYY-MM-DD'
      )
      .describe('Fecha de inicio del rango (YYYY-MM-DD)'),

    fecha_fin: z
      .string()
      .regex(
        /^\d{4}-\d{2}-\d{2}$/,
        'Fecha de fin debe estar en formato YYYY-MM-DD'
      )
      .describe('Fecha de fin del rango (YYYY-MM-DD)'),

    nomina_id: z
      .number({
        message: 'nomina_id es requerido y debe ser un número',
      })
      .int('nomina_id debe ser un número entero')
      .positive('nomina_id debe ser positivo')
      .describe('ID de la nómina en el sistema de nómina'),
  })
  .refine((data) => data.fecha_inicio <= data.fecha_fin, {
    message: 'fecha_inicio debe ser anterior o igual a fecha_fin',
  });

/**
 * Type inference para el schema de marcar procesados
 */
export type MarcarProcesadosInput = z.infer<typeof marcarProcesadosSchema>;

// ============================================================================
// SCHEMAS PARA REPORTES DE RESUMEN (GET endpoints con query params)
// ============================================================================

/**
 * Schema para validar query params de GET /api/reportes/resumen-quincena
 *
 * Genera resumen estadístico de turnos en un período (quincena).
 *
 * **Query params requeridos**:
 * - fecha_inicio: fecha de inicio en formato YYYY-MM-DD
 * - fecha_fin: fecha de fin en formato YYYY-MM-DD
 *
 * **Validaciones**:
 * - Ambas fechas deben estar en formato YYYY-MM-DD
 * - fecha_inicio debe ser <= fecha_fin
 * - Rango debe ser <= 93 días (validado en servicio)
 *
 * @example
 * GET /api/reportes/resumen-quincena?fecha_inicio=2026-01-01&fecha_fin=2026-01-15
 */
export const resumenQuincenaQuerySchema = z
  .object({
    fecha_inicio: z
      .string()
      .regex(
        /^\d{4}-\d{2}-\d{2}$/,
        'fecha_inicio debe estar en formato YYYY-MM-DD'
      )
      .describe('Fecha de inicio del período (YYYY-MM-DD)'),

    fecha_fin: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, 'fecha_fin debe estar en formato YYYY-MM-DD')
      .describe('Fecha de fin del período (YYYY-MM-DD)'),
  })
  .refine((data) => data.fecha_inicio <= data.fecha_fin, {
    message: 'fecha_inicio debe ser anterior o igual a fecha_fin',
  });

/**
 * Type inference para el schema de resumen quincena
 */
export type ResumenQuincenaQueryInput = z.infer<typeof resumenQuincenaQuerySchema>;

/**
 * Schema para validar query params de GET /api/reportes/resumen-por-guardian
 *
 * Genera resumen estadístico por guardián (individual o todos).
 *
 * **Query params**:
 * - fecha_inicio (requerido): fecha de inicio en formato YYYY-MM-DD
 * - fecha_fin (requerido): fecha de fin en formato YYYY-MM-DD
 * - empleado_id (opcional): ID del empleado para filtrar (número entero positivo)
 * - page (opcional): número de página (default: 1, min: 1)
 * - pageSize (opcional): registros por página (default: 10, min: 1, max: 1000)
 *
 * **Validaciones**:
 * - Ambas fechas deben estar en formato YYYY-MM-DD
 * - fecha_inicio debe ser <= fecha_fin
 * - empleado_id debe ser número entero positivo si se provee
 * - page debe ser >= 1
 * - pageSize debe estar entre 1 y 1000
 *
 * @example
 * GET /api/reportes/resumen-por-guardian?fecha_inicio=2026-01-01&fecha_fin=2026-01-15&page=1&pageSize=10
 * GET /api/reportes/resumen-por-guardian?fecha_inicio=2026-01-01&fecha_fin=2026-01-15&empleado_id=1001
 */
export const resumenPorGuardianQuerySchema = z
  .object({
    fecha_inicio: z
      .string()
      .regex(
        /^\d{4}-\d{2}-\d{2}$/,
        'fecha_inicio debe estar en formato YYYY-MM-DD'
      )
      .describe('Fecha de inicio del período (YYYY-MM-DD)'),

    fecha_fin: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, 'fecha_fin debe estar en formato YYYY-MM-DD')
      .describe('Fecha de fin del período (YYYY-MM-DD)'),

    empleado_id: z
      .string()
      .regex(/^\d+$/, 'empleado_id debe ser un número entero')
      .transform(Number)
      .refine((val) => val > 0, 'empleado_id debe ser positivo')
      .optional()
      .describe('ID del empleado (opcional, filtra por un guardián específico)'),

    page: z
      .string()
      .regex(/^\d+$/, 'page debe ser un número entero')
      .transform(Number)
      .refine((val) => val >= 1, 'page debe ser >= 1')
      .optional()
      .default(1)
      .describe('Número de página (default: 1)'),

    pageSize: z
      .string()
      .regex(/^\d+$/, 'pageSize debe ser un número entero')
      .transform(Number)
      .refine((val) => val >= 1 && val <= 1000, 'pageSize debe estar entre 1 y 1000')
      .optional()
      .default(10)
      .describe('Registros por página (default: 10, max: 1000)'),
  })
  .refine((data) => data.fecha_inicio <= data.fecha_fin, {
    message: 'fecha_inicio debe ser anterior o igual a fecha_fin',
  });

/**
 * Type inference para el schema de resumen por guardián
 */
export type ResumenPorGuardianQueryInput = z.infer<
  typeof resumenPorGuardianQuerySchema
>;

/**
 * Schema para validar query params de GET /api/reportes/resumen-por-puesto
 *
 * Genera resumen estadístico por puesto (individual o todos).
 *
 * **Query params**:
 * - fecha_inicio (requerido): fecha de inicio en formato YYYY-MM-DD
 * - fecha_fin (requerido): fecha de fin en formato YYYY-MM-DD
 * - puesto_id (opcional): ID del puesto para filtrar (número entero positivo)
 * - ubicacion_id (opcional): ID de ubicación para filtrar (número entero positivo)
 * - cliente_id (opcional): ID de cliente para filtrar (número entero positivo)
 * - page (opcional): número de página (default: 1, min: 1)
 * - pageSize (opcional): registros por página (default: 10, min: 1, max: 1000)
 *
 * **Validaciones**:
 * - Ambas fechas deben estar en formato YYYY-MM-DD
 * - fecha_inicio debe ser <= fecha_fin
 * - Todos los IDs deben ser números enteros positivos si se proveen
 * - page debe ser >= 1
 * - pageSize debe estar entre 1 y 1000
 *
 * @example
 * GET /api/reportes/resumen-por-puesto?fecha_inicio=2026-01-01&fecha_fin=2026-01-15&page=1&pageSize=10
 * GET /api/reportes/resumen-por-puesto?fecha_inicio=2026-01-01&fecha_fin=2026-01-15&cliente_id=5
 * GET /api/reportes/resumen-por-puesto?fecha_inicio=2026-01-01&fecha_fin=2026-01-15&puesto_id=42
 */
export const resumenPorPuestoQuerySchema = z
  .object({
    fecha_inicio: z
      .string()
      .regex(
        /^\d{4}-\d{2}-\d{2}$/,
        'fecha_inicio debe estar en formato YYYY-MM-DD'
      )
      .describe('Fecha de inicio del período (YYYY-MM-DD)'),

    fecha_fin: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, 'fecha_fin debe estar en formato YYYY-MM-DD')
      .describe('Fecha de fin del período (YYYY-MM-DD)'),

    puesto_id: z
      .string()
      .regex(/^\d+$/, 'puesto_id debe ser un número entero')
      .transform(Number)
      .refine((val) => val > 0, 'puesto_id debe ser positivo')
      .optional()
      .describe('ID del puesto (opcional, filtra por un puesto específico)'),

    ubicacion_id: z
      .string()
      .regex(/^\d+$/, 'ubicacion_id debe ser un número entero')
      .transform(Number)
      .refine((val) => val > 0, 'ubicacion_id debe ser positivo')
      .optional()
      .describe('ID de ubicación (opcional, filtra por ubicación)'),

    cliente_id: z
      .string()
      .regex(/^\d+$/, 'cliente_id debe ser un número entero')
      .transform(Number)
      .refine((val) => val > 0, 'cliente_id debe ser positivo')
      .optional()
      .describe('ID de cliente (opcional, filtra por cliente)'),

    page: z
      .string()
      .regex(/^\d+$/, 'page debe ser un número entero')
      .transform(Number)
      .refine((val) => val >= 1, 'page debe ser >= 1')
      .optional()
      .default(1)
      .describe('Número de página (default: 1)'),

    pageSize: z
      .string()
      .regex(/^\d+$/, 'pageSize debe ser un número entero')
      .transform(Number)
      .refine((val) => val >= 1 && val <= 1000, 'pageSize debe estar entre 1 y 1000')
      .optional()
      .default(10)
      .describe('Registros por página (default: 10, max: 1000)'),
  })
  .refine((data) => data.fecha_inicio <= data.fecha_fin, {
    message: 'fecha_inicio debe ser anterior o igual a fecha_fin',
  });

/**
 * Type inference para el schema de resumen por puesto
 */
export type ResumenPorPuestoQueryInput = z.infer<typeof resumenPorPuestoQuerySchema>;

// ============================================================================
// SCHEMAS PARA HISTORIAL DE REPORTES (T2.25)
// ============================================================================

/**
 * Schema para validar query params de GET /api/reportes/historial
 *
 * Obtiene historial paginado de reportes generados.
 *
 * **Query params**:
 * - page (opcional): número de página (default: 1, min: 1)
 * - pageSize (opcional): registros por página (default: 10, min: 1, max: 1000)
 *
 * **Validaciones**:
 * - page debe ser >= 1
 * - pageSize debe estar entre 1 y 1000
 *
 * @example
 * GET /api/reportes/historial?page=1&pageSize=10
 */
export const getHistorialReportesSchema = z.object({
  page: z
    .string()
    .regex(/^\d+$/, 'page debe ser un número entero')
    .transform(Number)
    .refine((val) => val >= 1, 'page debe ser >= 1')
    .optional()
    .default(1),

  pageSize: z
    .string()
    .regex(/^\d+$/, 'pageSize debe ser un número entero')
    .transform(Number)
    .refine((val) => val >= 1 && val <= 1000, 'pageSize debe estar entre 1 y 1000')
    .optional()
    .default(10),
});

/**
 * Type inference para el schema de historial de reportes
 */
export type GetHistorialReportesInput = z.infer<typeof getHistorialReportesSchema>;

/**
 * Schema para validar params de GET /api/reportes/:id/descargar
 *
 * Descarga reporte histórico regenerándolo con los mismos parámetros.
 *
 * **Params requeridos**:
 * - id: ID del reporte en historial (número entero positivo)
 *
 * **Validaciones**:
 * - id debe ser un número entero positivo
 *
 * @example
 * GET /api/reportes/123/descargar
 */
export const descargarReporteSchema = z.object({
  id: z
    .string()
    .regex(/^\d+$/, 'ID debe ser un número entero')
    .transform(Number)
    .refine((val) => val > 0, 'ID debe ser positivo')
    .describe('ID del reporte en el historial'),
});

/**
 * Type inference para el schema de descarga de reporte
 */
export type DescargarReporteInput = z.infer<typeof descargarReporteSchema>;

// ============================================================================
// SCHEMAS PARA VISTA PREVIA DE NÓMINA
// ============================================================================

/**
 * Schema para validar query params de GET /api/reportes/nomina/vista-previa
 *
 * Genera vista previa JSON de turnos no procesados en un rango de fechas.
 *
 * **Query params requeridos**:
 * - fecha_inicio: fecha de inicio en formato YYYY-MM-DD
 * - fecha_fin: fecha de fin en formato YYYY-MM-DD
 *
 * **Validaciones**:
 * - Ambas fechas deben estar en formato YYYY-MM-DD
 * - fecha_inicio debe ser <= fecha_fin
 *
 * @example
 * GET /api/reportes/nomina/vista-previa?fecha_inicio=2026-01-01&fecha_fin=2026-01-15
 */
export const vistaPreviaQuerySchema = z
  .object({
    fecha_inicio: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, 'fecha_inicio debe estar en formato YYYY-MM-DD'),
    fecha_fin: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, 'fecha_fin debe estar en formato YYYY-MM-DD'),
  })
  .refine((data) => data.fecha_inicio <= data.fecha_fin, {
    message: 'fecha_inicio debe ser anterior o igual a fecha_fin',
  });

/**
 * Type inference para el schema de vista previa
 */
export type VistaPreviaQueryInput = z.infer<typeof vistaPreviaQuerySchema>;
