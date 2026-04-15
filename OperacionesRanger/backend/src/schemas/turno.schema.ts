/**
 * Schemas de Validación para Turnos
 * Sistema de Gestión de Turnos - OperacionesRanger
 *
 * Define los schemas Zod para validación de requests de la API de turnos.
 * Estos schemas se usan en el middleware de validación para asegurar
 * que los datos recibidos cumplen con los requisitos de negocio.
 *
 * VALIDACIONES CLAVE:
 * - Horas normales: 0-12
 * - Horas extras: 0-4
 * - Horas totales: horas_normales + horas_extras <= 16
 * - Fecha: no futura > 7 días
 * - Horarios: formato HH:MM:SS
 *
 * @module schemas/turno.schema
 */

import { z } from 'zod';
import { TipoTurno, TURNO_VALIDATION } from '../models/turno.model';

// ============================================================================
// SCHEMAS DE VALIDACIÓN PARA BODY
// ============================================================================

/**
 * Schema para crear nuevo turno
 *
 * Usado en: POST /api/turnos
 *
 * VALIDACIONES DE NEGOCIO:
 * - empleado_id: número entero positivo (debe existir en BD RRHH - validado en controller)
 * - puesto_id: número entero positivo (debe existir y estar activo - validado en controller)
 * - fecha: formato YYYY-MM-DD, no futura > 7 días
 * - hora_entrada, hora_salida: formato HH:MM:SS
 * - horas_normales: 0-12 horas
 * - horas_extras: 0-4 horas
 * - horas_totales: normales + extras <= 16 horas (validación custom)
 * - observaciones: opcional, max 1000 caracteres
 *
 * NOTA: tipo_turno, es_feriado, feriado_id son auto-calculados por sp_registrar_turno
 */
export const createTurnoSchema = z
  .object({
    empleado_id: z
      .number({
        message: 'empleado_id es requerido y debe ser un número',
      })
      .int('empleado_id debe ser un número entero')
      .positive('empleado_id debe ser positivo'),

    puesto_id: z
      .number({
        message: 'puesto_id es requerido y debe ser un número',
      })
      .int('puesto_id debe ser un número entero')
      .positive('puesto_id debe ser positivo'),

    fecha: z
      .string({ message: 'fecha es requerida' })
      .regex(
        TURNO_VALIDATION.FECHA.REGEX,
        'fecha debe tener formato YYYY-MM-DD'
      )
      .refine(
        (dateStr) => {
          // Validar que sea una fecha válida
          const date = new Date(dateStr);
          return !isNaN(date.getTime()) && dateStr === date.toISOString().split('T')[0];
        },
        { message: 'fecha inválida' }
      )
      .refine(
        (dateStr) => {
          // Validar que no sea fecha futura más allá de MAX_DIAS_FUTURO
          const fechaTurno = new Date(dateStr);
          const hoy = new Date();
          hoy.setHours(0, 0, 0, 0);

          const maxFechaFutura = new Date(hoy);
          maxFechaFutura.setDate(
            maxFechaFutura.getDate() + TURNO_VALIDATION.FECHA.MAX_DIAS_FUTURO
          );

          return fechaTurno <= maxFechaFutura;
        },
        {
          message: `fecha no puede ser futura más allá de ${TURNO_VALIDATION.FECHA.MAX_DIAS_FUTURO} días`,
        }
      ),

    hora_entrada: z
      .string({ message: 'hora_entrada es requerida' })
      .regex(
        TURNO_VALIDATION.HORA.REGEX,
        'hora_entrada debe tener formato HH:MM:SS (24 horas)'
      )
      .trim(),

    hora_salida: z
      .string({ message: 'hora_salida es requerida' })
      .regex(
        TURNO_VALIDATION.HORA.REGEX,
        'hora_salida debe tener formato HH:MM:SS (24 horas)'
      )
      .trim(),

    horas_normales: z
      .number({ message: 'horas_normales es requerido y debe ser un número' })
      .min(
        TURNO_VALIDATION.HORAS_NORMALES.MIN,
        `horas_normales debe ser al menos ${TURNO_VALIDATION.HORAS_NORMALES.MIN}`
      )
      .max(
        TURNO_VALIDATION.HORAS_NORMALES.MAX,
        `horas_normales debe ser máximo ${TURNO_VALIDATION.HORAS_NORMALES.MAX}`
      )
      .refine(
        (val) => {
          // Validar que tenga máximo 2 decimales
          const decimals = val.toString().split('.')[1];
          return !decimals || decimals.length <= 2;
        },
        { message: 'horas_normales debe tener máximo 2 decimales' }
      ),

    horas_extras: z
      .number({ message: 'horas_extras es requerido y debe ser un número' })
      .min(
        TURNO_VALIDATION.HORAS_EXTRAS.MIN,
        `horas_extras debe ser al menos ${TURNO_VALIDATION.HORAS_EXTRAS.MIN}`
      )
      .max(
        TURNO_VALIDATION.HORAS_EXTRAS.MAX,
        `horas_extras debe ser máximo ${TURNO_VALIDATION.HORAS_EXTRAS.MAX}`
      )
      .refine(
        (val) => {
          // Validar que tenga máximo 2 decimales
          const decimals = val.toString().split('.')[1];
          return !decimals || decimals.length <= 2;
        },
        { message: 'horas_extras debe tener máximo 2 decimales' }
      ),

    observaciones: z
      .string()
      .max(
        TURNO_VALIDATION.OBSERVACIONES.MAX_LENGTH,
        `observaciones debe tener máximo ${TURNO_VALIDATION.OBSERVACIONES.MAX_LENGTH} caracteres`
      )
      .trim()
      .nullable()
      .optional()
      .transform((val) => (val === '' ? null : val)),
  })
  .refine(
    (data) => {
      // Validación custom: horas_normales + horas_extras <= 16
      return data.horas_normales + data.horas_extras <= TURNO_VALIDATION.HORAS_TOTALES.MAX;
    },
    {
      message: `horas totales (normales + extras) no puede exceder ${TURNO_VALIDATION.HORAS_TOTALES.MAX} horas`,
      path: ['horas_totales'], // Path para el error
    }
  );

/**
 * Schema para actualizar turno existente
 *
 * Usado en: PUT /api/turnos/:id
 *
 * Todos los campos son opcionales.
 * Validaciones iguales a createTurnoSchema pero opcionales.
 *
 * RESTRICCIONES:
 * - No se puede cambiar empleado_id (omitido intencionalmente)
 * - No se puede cambiar puesto_id (omitido intencionalmente)
 * - No se puede cambiar fecha (omitido intencionalmente)
 * - No se puede editar si procesado_nomina = true (validado en controller)
 */
export const updateTurnoSchema = z
  .object({
    hora_entrada: z
      .string()
      .regex(
        TURNO_VALIDATION.HORA.REGEX,
        'hora_entrada debe tener formato HH:MM:SS (24 horas)'
      )
      .trim()
      .optional(),

    hora_salida: z
      .string()
      .regex(
        TURNO_VALIDATION.HORA.REGEX,
        'hora_salida debe tener formato HH:MM:SS (24 horas)'
      )
      .trim()
      .optional(),

    horas_normales: z
      .number()
      .min(
        TURNO_VALIDATION.HORAS_NORMALES.MIN,
        `horas_normales debe ser al menos ${TURNO_VALIDATION.HORAS_NORMALES.MIN}`
      )
      .max(
        TURNO_VALIDATION.HORAS_NORMALES.MAX,
        `horas_normales debe ser máximo ${TURNO_VALIDATION.HORAS_NORMALES.MAX}`
      )
      .refine(
        (val) => {
          const decimals = val.toString().split('.')[1];
          return !decimals || decimals.length <= 2;
        },
        { message: 'horas_normales debe tener máximo 2 decimales' }
      )
      .optional(),

    horas_extras: z
      .number()
      .min(
        TURNO_VALIDATION.HORAS_EXTRAS.MIN,
        `horas_extras debe ser al menos ${TURNO_VALIDATION.HORAS_EXTRAS.MIN}`
      )
      .max(
        TURNO_VALIDATION.HORAS_EXTRAS.MAX,
        `horas_extras debe ser máximo ${TURNO_VALIDATION.HORAS_EXTRAS.MAX}`
      )
      .refine(
        (val) => {
          const decimals = val.toString().split('.')[1];
          return !decimals || decimals.length <= 2;
        },
        { message: 'horas_extras debe tener máximo 2 decimales' }
      )
      .optional(),

    observaciones: z
      .string()
      .max(
        TURNO_VALIDATION.OBSERVACIONES.MAX_LENGTH,
        `observaciones debe tener máximo ${TURNO_VALIDATION.OBSERVACIONES.MAX_LENGTH} caracteres`
      )
      .trim()
      .nullable()
      .optional()
      .transform((val) => (val === '' ? null : val)),
  })
  .refine(
    (data) => {
      // Al menos un campo debe estar presente para actualizar
      return Object.keys(data).length > 0;
    },
    {
      message: 'Debe proporcionar al menos un campo para actualizar',
    }
  )
  .refine(
    (data) => {
      // Validación custom: si se proporcionan ambas horas, validar total
      // Si solo se proporciona una, la validación se hará en el controller
      // con el valor actual del turno
      if (data.horas_normales !== undefined && data.horas_extras !== undefined) {
        return data.horas_normales + data.horas_extras <= TURNO_VALIDATION.HORAS_TOTALES.MAX;
      }
      return true;
    },
    {
      message: `horas totales (normales + extras) no puede exceder ${TURNO_VALIDATION.HORAS_TOTALES.MAX} horas`,
      path: ['horas_totales'],
    }
  );

// ============================================================================
// SCHEMAS DE VALIDACIÓN PARA PARAMS
// ============================================================================

/**
 * Schema para validar ID de turno en path params
 *
 * Usado en:
 * - GET /api/turnos/:id
 * - PUT /api/turnos/:id
 * - DELETE /api/turnos/:id
 *
 * Valida que el ID sea un número entero positivo
 */
export const turnoIdSchema = z.object({
  id: z
    .string()
    .regex(/^\d+$/, 'ID debe ser un número')
    .transform((val) => parseInt(val, 10))
    .refine((val) => val > 0, 'ID debe ser positivo'),
});

// ============================================================================
// SCHEMAS DE VALIDACIÓN PARA QUERY PARAMS
// ============================================================================

/**
 * Schema para query params de listado de turnos
 *
 * Usado en: GET /api/turnos
 *
 * Valida:
 * - page: número >= 1, default 1
 * - pageSize: número 1-1000, default 10
 * - fecha_inicio: fecha YYYY-MM-DD opcional
 * - fecha_fin: fecha YYYY-MM-DD opcional (debe ser >= fecha_inicio)
 * - empleado_id: número positivo opcional
 * - puesto_id: número positivo opcional
 * - ubicacion_id: número positivo opcional
 * - cliente_id: número positivo opcional
 * - tipo_turno: DIURNO o NOCTURNO opcional
 * - es_feriado: booleano opcional
 * - procesado_nomina: booleano opcional
 */
export const getTurnosQuerySchema = z
  .object({
    page: z
      .string()
      .optional()
      .default('1')
      .transform((val) => parseInt(val, 10))
      .refine((val) => val >= 1, 'page debe ser >= 1'),

    pageSize: z
      .string()
      .optional()
      .default('10')
      .transform((val) => parseInt(val, 10))
      .refine((val) => val >= 1, 'PageSize debe ser mayor o igual a 1')
      .refine((val) => val <= 1000, 'PageSize no puede exceder 100'),

    fecha_inicio: z
      .string()
      .regex(TURNO_VALIDATION.FECHA.REGEX, 'fecha_inicio debe tener formato YYYY-MM-DD')
      .refine(
        (dateStr) => {
          const date = new Date(dateStr);
          return !isNaN(date.getTime()) && dateStr === date.toISOString().split('T')[0];
        },
        { message: 'fecha_inicio inválida' }
      )
      .optional(),

    fecha_fin: z
      .string()
      .regex(TURNO_VALIDATION.FECHA.REGEX, 'fecha_fin debe tener formato YYYY-MM-DD')
      .refine(
        (dateStr) => {
          const date = new Date(dateStr);
          return !isNaN(date.getTime()) && dateStr === date.toISOString().split('T')[0];
        },
        { message: 'fecha_fin inválida' }
      )
      .optional(),

    empleado_id: z
      .string()
      .regex(/^\d+$/, 'empleado_id debe ser un número')
      .transform((val) => parseInt(val, 10))
      .refine((val) => val > 0, 'empleado_id debe ser positivo')
      .optional(),

    puesto_id: z
      .string()
      .regex(/^\d+$/, 'puesto_id debe ser un número')
      .transform((val) => parseInt(val, 10))
      .refine((val) => val > 0, 'puesto_id debe ser positivo')
      .optional(),

    ubicacion_id: z
      .string()
      .regex(/^\d+$/, 'ubicacion_id debe ser un número')
      .transform((val) => parseInt(val, 10))
      .refine((val) => val > 0, 'ubicacion_id debe ser positivo')
      .optional(),

    cliente_id: z
      .string()
      .regex(/^\d+$/, 'cliente_id debe ser un número')
      .transform((val) => parseInt(val, 10))
      .refine((val) => val > 0, 'cliente_id debe ser positivo')
      .optional(),

    tipo_turno: z
      .string()
      .optional()
      .refine(
        (val) => val === undefined || Object.values(TipoTurno).includes(val as TipoTurno),
        'tipo_turno debe ser DIURNO o NOCTURNO'
      )
      .transform((val) => (val as TipoTurno | undefined)),

    es_feriado: z
      .string()
      .refine((val) => val === 'true' || val === 'false', 'es_feriado debe ser true o false')
      .transform((val) => val === 'true')
      .optional(),

    procesado_nomina: z
      .string()
      .refine(
        (val) => val === 'true' || val === 'false',
        'procesado_nomina debe ser true o false'
      )
      .transform((val) => val === 'true')
      .optional(),
  })
  .refine(
    (data) => {
      // Si ambas fechas están presentes, fecha_inicio debe ser <= fecha_fin
      if (data.fecha_inicio && data.fecha_fin) {
        return data.fecha_inicio <= data.fecha_fin;
      }
      return true;
    },
    {
      message: 'fecha_inicio debe ser anterior o igual a fecha_fin',
    }
  );

/**
 * Schema para query params de turnos por empleado
 *
 * Usado en: GET /api/empleados/:empleado_id/turnos
 *
 * Similar a getTurnosQuerySchema pero sin filtro de empleado_id
 */
export const getTurnosByEmpleadoQuerySchema = z
  .object({
    page: z
      .string()
      .optional()
      .default('1')
      .transform((val) => parseInt(val, 10))
      .refine((val) => val >= 1, 'page debe ser >= 1'),

    pageSize: z
      .string()
      .optional()
      .default('10')
      .transform((val) => parseInt(val, 10))
      .refine((val) => val >= 1, 'PageSize debe ser mayor o igual a 1')
      .refine((val) => val <= 1000, 'PageSize no puede exceder 100'),

    fecha_inicio: z
      .string()
      .regex(TURNO_VALIDATION.FECHA.REGEX, 'fecha_inicio debe tener formato YYYY-MM-DD')
      .refine(
        (dateStr) => {
          const date = new Date(dateStr);
          return !isNaN(date.getTime()) && dateStr === date.toISOString().split('T')[0];
        },
        { message: 'fecha_inicio inválida' }
      )
      .optional(),

    fecha_fin: z
      .string()
      .regex(TURNO_VALIDATION.FECHA.REGEX, 'fecha_fin debe tener formato YYYY-MM-DD')
      .refine(
        (dateStr) => {
          const date = new Date(dateStr);
          return !isNaN(date.getTime()) && dateStr === date.toISOString().split('T')[0];
        },
        { message: 'fecha_fin inválida' }
      )
      .optional(),

    tipo_turno: z
      .string()
      .optional()
      .refine(
        (val) => val === undefined || Object.values(TipoTurno).includes(val as TipoTurno),
        'tipo_turno debe ser DIURNO o NOCTURNO'
      )
      .transform((val) => (val as TipoTurno | undefined)),

    procesado_nomina: z
      .string()
      .refine(
        (val) => val === 'true' || val === 'false',
        'procesado_nomina debe ser true o false'
      )
      .transform((val) => val === 'true')
      .optional(),
  })
  .refine(
    (data) => {
      if (data.fecha_inicio && data.fecha_fin) {
        return data.fecha_inicio <= data.fecha_fin;
      }
      return true;
    },
    {
      message: 'fecha_inicio debe ser anterior o igual a fecha_fin',
    }
  );

// ============================================================================
// TYPES INFERIDOS DE SCHEMAS
// ============================================================================

/**
 * Type inferido del schema de creación
 */
export type CreateTurnoInput = z.infer<typeof createTurnoSchema>;

/**
 * Type inferido del schema de actualización
 */
export type UpdateTurnoInput = z.infer<typeof updateTurnoSchema>;

/**
 * Type inferido del schema de ID
 */
export type TurnoIdInput = z.infer<typeof turnoIdSchema>;

/**
 * Type inferido del schema de query params para listado
 */
export type GetTurnosQueryInput = z.infer<typeof getTurnosQuerySchema>;

/**
 * Type inferido del schema de query params para turnos por empleado
 */
export type GetTurnosByEmpleadoQueryInput = z.infer<typeof getTurnosByEmpleadoQuerySchema>;

/**
 * Schema para query params del resumen de empleado
 *
 * Usado en: GET /api/turnos/empleado/:empleado_id/resumen
 *
 * Fechas opcionales: si no se proporcionan, el controller usará defaults
 */
export const getResumenEmpleadoQuerySchema = z
  .object({
    fecha_inicio: z
      .string()
      .regex(TURNO_VALIDATION.FECHA.REGEX, 'fecha_inicio debe tener formato YYYY-MM-DD')
      .refine(
        (dateStr) => {
          const date = new Date(dateStr);
          return !isNaN(date.getTime()) && dateStr === date.toISOString().split('T')[0];
        },
        { message: 'fecha_inicio inválida' }
      )
      .optional(),

    fecha_fin: z
      .string()
      .regex(TURNO_VALIDATION.FECHA.REGEX, 'fecha_fin debe tener formato YYYY-MM-DD')
      .refine(
        (dateStr) => {
          const date = new Date(dateStr);
          return !isNaN(date.getTime()) && dateStr === date.toISOString().split('T')[0];
        },
        { message: 'fecha_fin inválida' }
      )
      .optional(),
  })
  .refine(
    (data) => {
      if (data.fecha_inicio && data.fecha_fin) {
        return data.fecha_inicio <= data.fecha_fin;
      }
      return true;
    },
    {
      message: 'fecha_inicio debe ser anterior o igual a fecha_fin',
    }
  );

/**
 * Type inferido del schema de query params para resumen de empleado
 */
export type GetResumenEmpleadoQueryInput = z.infer<typeof getResumenEmpleadoQuerySchema>;

// ============================================================================
// SCHEMAS PARA CALENDARIO MENSUAL
// ============================================================================

/**
 * Schema para path params :año/:mes del calendario
 *
 * Usado en: GET /api/turnos/calendario/:año/:mes
 *
 * Valida que el año esté entre 2000 y 2100 y el mes entre 1 y 12.
 */
export const calendarioParamsSchema = z.object({
  año: z
    .string()
    .regex(/^\d{4}$/, 'año debe ser un número de 4 dígitos')
    .transform((val) => parseInt(val, 10))
    .refine((val) => val >= 2000 && val <= 2100, 'año debe estar entre 2000 y 2100'),

  mes: z
    .string()
    .regex(/^\d{1,2}$/, 'mes debe ser un número de 1 o 2 dígitos')
    .transform((val) => parseInt(val, 10))
    .refine((val) => val >= 1 && val <= 12, 'mes debe estar entre 1 y 12'),
});

/**
 * Schema para query params del calendario (filtros opcionales)
 *
 * Usado en: GET /api/turnos/calendario/:año/:mes
 *
 * Todos los filtros son opcionales.
 */
export const calendarioQuerySchema = z.object({
  empleado_id: z
    .string()
    .regex(/^\d+$/, 'empleado_id debe ser un número')
    .transform((val) => parseInt(val, 10))
    .refine((val) => val > 0, 'empleado_id debe ser positivo')
    .optional(),

  puesto_id: z
    .string()
    .regex(/^\d+$/, 'puesto_id debe ser un número')
    .transform((val) => parseInt(val, 10))
    .refine((val) => val > 0, 'puesto_id debe ser positivo')
    .optional(),

  ubicacion_id: z
    .string()
    .regex(/^\d+$/, 'ubicacion_id debe ser un número')
    .transform((val) => parseInt(val, 10))
    .refine((val) => val > 0, 'ubicacion_id debe ser positivo')
    .optional(),

  cliente_id: z
    .string()
    .regex(/^\d+$/, 'cliente_id debe ser un número')
    .transform((val) => parseInt(val, 10))
    .refine((val) => val > 0, 'cliente_id debe ser positivo')
    .optional(),
});

/**
 * Type inferido del schema de path params para calendario
 */
export type CalendarioParamsInput = z.infer<typeof calendarioParamsSchema>;

/**
 * Type inferido del schema de query params para calendario
 */
export type CalendarioQueryInput = z.infer<typeof calendarioQuerySchema>;
