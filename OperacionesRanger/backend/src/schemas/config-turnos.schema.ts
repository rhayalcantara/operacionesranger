/**
 * Schemas de Validación de Configuración de Turnos
 * Sistema de Gestión de Turnos - OperacionesRanger
 *
 * Este archivo contiene todos los schemas de validación Zod para endpoints
 * de configuración de turnos (horarios DIURNO y NOCTURNO).
 *
 * Uso:
 * ```typescript
 * import { updateConfigTurnoSchema } from '@schemas/config-turnos.schema';
 *
 * const result = updateConfigTurnoSchema.safeParse(req.body);
 * if (!result.success) {
 *   return res.status(400).json({ errors: result.error.errors });
 * }
 * ```
 */

import { z } from 'zod';
import { TipoTurno, HORARIOS_CONFIG } from '../models/config-turnos.model';

// ============================================================================
// SCHEMAS REUTILIZABLES (BUILDING BLOCKS)
// ============================================================================

/**
 * Schema base para validar formato TIME
 *
 * Acepta formatos:
 * - HH:MM:SS (ej: '06:00:00')
 * - HH:MM (ej: '06:00')
 *
 * Valida que:
 * - Hora esté entre 00-23
 * - Minutos estén entre 00-59
 * - Segundos (si se proporcionan) estén entre 00-59
 */
const timeSchema = z.string()
  .regex(
    HORARIOS_CONFIG.TIME_REGEX,
    'Formato de hora inválido. Use HH:MM:SS o HH:MM (ej: 06:00:00 o 06:00)'
  )
  .transform((time) => {
    // Normalizar a HH:MM:SS si solo se proporciona HH:MM
    if (time.split(':').length === 2) {
      return `${time}:00`;
    }
    return time;
  });

/**
 * Schema base para descripción
 */
const descripcionSchema = z.string()
  .min(1, 'La descripción no puede estar vacía')
  .max(100, 'La descripción no puede exceder 100 caracteres')
  .trim()
  .optional()
  .nullable();

/**
 * Schema base para campo activo
 */
const activoSchema = z.boolean({
  message: 'El campo activo debe ser true o false'
}).optional();

// ============================================================================
// SCHEMAS DE ENDPOINTS
// ============================================================================

/**
 * Schema para actualizar configuración de turno
 *
 * PUT /api/configuracion-turnos/:id
 * Body: { hora_inicio?, hora_fin?, descripcion?, activo? }
 *
 * Todos los campos son opcionales, pero al menos uno debe ser proporcionado.
 */
export const updateConfigTurnoSchema = z.object({
  hora_inicio: timeSchema.optional(),
  hora_fin: timeSchema.optional(),
  descripcion: descripcionSchema,
  activo: activoSchema
}).refine(
  (data) => {
    // Al menos un campo debe ser proporcionado
    const fields = ['hora_inicio', 'hora_fin', 'descripcion', 'activo'];
    return fields.some((field) => data[field as keyof typeof data] !== undefined);
  },
  {
    message: 'Debe proporcionar al menos un campo para actualizar (hora_inicio, hora_fin, descripcion, o activo)'
  }
).refine(
  (data) => {
    // Si se proporciona hora_inicio o hora_fin, ambas deben estar presentes
    const hasInicio = data.hora_inicio !== undefined;
    const hasFin = data.hora_fin !== undefined;

    // Ambas o ninguna
    return hasInicio === hasFin || (!hasInicio && !hasFin);
  },
  {
    message: 'Si actualiza horarios, debe proporcionar tanto hora_inicio como hora_fin',
    path: ['hora_inicio']
  }
);

/**
 * Tipo inferido del updateConfigTurnoSchema
 */
export type UpdateConfigTurnoInput = z.infer<typeof updateConfigTurnoSchema>;

/**
 * Schema para parámetro ID de configuración en rutas
 *
 * GET /api/configuracion-turnos/:id
 * PUT /api/configuracion-turnos/:id
 *
 * Valida que el ID sea un número entero positivo.
 */
export const configTurnoIdParamSchema = z.object({
  id: z.string()
    .regex(/^\d+$/, 'ID de configuración inválido. Debe ser un número entero positivo')
    .transform(Number)
    .refine((n) => n > 0, 'ID de configuración debe ser mayor a 0')
    .refine(
      (n) => n <= HORARIOS_CONFIG.TOTAL_CONFIGURACIONES,
      `ID de configuración inválido. Solo existen ${HORARIOS_CONFIG.TOTAL_CONFIGURACIONES} configuraciones (DIURNO y NOCTURNO)`
    )
});

/**
 * Tipo inferido del configTurnoIdParamSchema
 */
export type ConfigTurnoIdParam = z.infer<typeof configTurnoIdParamSchema>;

// ============================================================================
// SCHEMAS DE VALIDACIÓN DE RESPONSES (OPCIONAL)
// ============================================================================

/**
 * Schema para validar response de configuración individual
 *
 * Útil para tests o validación de responses de API
 */
export const configTurnoResponseSchema = z.object({
  id: z.number().int().positive(),
  tipo_turno: z.enum([TipoTurno.DIURNO, TipoTurno.NOCTURNO]),
  hora_inicio: z.string(),
  hora_fin: z.string(),
  descripcion: z.string().nullable(),
  activo: z.preprocess(v => v === 1 ? true : v === 0 ? false : v, z.boolean()),
  created_at: z.date(),
  updated_at: z.date()
});

/**
 * Schema para validar response de lista de configuraciones
 */
export const configTurnosListResponseSchema = z.object({
  data: z.array(configTurnoResponseSchema),
  total: z.number().int()
    .refine(
      (n) => n === HORARIOS_CONFIG.TOTAL_CONFIGURACIONES,
      `El total debe ser siempre ${HORARIOS_CONFIG.TOTAL_CONFIGURACIONES} (DIURNO y NOCTURNO)`
    )
});

/**
 * Schema para validar mensaje de actualización exitosa
 */
export const updateSuccessResponseSchema = z.object({
  message: z.string(),
  data: configTurnoResponseSchema
});

// ============================================================================
// UTILIDADES DE VALIDACIÓN
// ============================================================================

/**
 * Helper para validar y extraer datos de request
 *
 * Uso:
 * ```typescript
 * const data = await validateRequest(updateConfigTurnoSchema, req.body);
 * ```
 */
export async function validateRequest<T extends z.ZodTypeAny>(
  schema: T,
  data: unknown
): Promise<z.infer<T>> {
  return schema.parseAsync(data);
}

/**
 * Helper para validación segura (no lanza error)
 *
 * Uso:
 * ```typescript
 * const result = safeValidate(updateConfigTurnoSchema, req.body);
 * if (!result.success) {
 *   return res.status(400).json({ errors: result.error.issues });
 * }
 * const data = result.data;
 * ```
 */
export function safeValidate<T extends z.ZodTypeAny>(
  schema: T,
  data: unknown
) {
  return schema.safeParse(data);
}

/**
 * Helper para formatear errores de validación Zod
 *
 * Convierte errores de Zod a formato amigable para API
 *
 * @param error - Error de Zod
 * @returns Array de objetos con campo y mensaje de error
 *
 * @example
 * ```typescript
 * try {
 *   const data = updateConfigTurnoSchema.parse(req.body);
 * } catch (error) {
 *   if (error instanceof z.ZodError) {
 *     return res.status(400).json({
 *       error: 'Validación fallida',
 *       details: formatZodErrors(error)
 *     });
 *   }
 * }
 * ```
 */
export function formatZodErrors(error: z.ZodError): Array<{ field: string; message: string }> {
  return error.issues.map((err: z.ZodIssue) => ({
    field: err.path.join('.') || 'root',
    message: err.message
  }));
}

/**
 * Validación personalizada: Verificar que horarios no se solapen
 *
 * Esta función NO está integrada en el schema Zod porque requiere
 * consultar la base de datos para obtener la otra configuración.
 * Se usa en el servicio de negocio.
 *
 * @param tipoTurno - Tipo de turno que se está actualizando
 * @param hora_inicio - Nueva hora de inicio
 * @param hora_fin - Nueva hora de fin
 * @param otraConfiguracion - La otra configuración (DIURNO si actualizando NOCTURNO, y viceversa)
 * @returns true si no hay solapamiento, false si hay solapamiento
 */
export function validarNoSolapamiento(
  tipoTurno: TipoTurno,
  hora_inicio: string,
  hora_fin: string,
  otraConfiguracion: { hora_inicio: string; hora_fin: string }
): { valid: boolean; error?: string } {
  // Los horarios DEBEN ser complementarios (uno termina donde el otro empieza)

  // Si actualizando DIURNO:
  // - DIURNO.hora_fin debe ser igual a NOCTURNO.hora_inicio
  // - NOCTURNO.hora_fin debe ser igual a DIURNO.hora_inicio (puede cruzar medianoche)

  if (hora_fin !== otraConfiguracion.hora_inicio) {
    return {
      valid: false,
      error: `El horario ${tipoTurno} debe terminar (${hora_fin}) donde empieza el otro turno (${otraConfiguracion.hora_inicio})`
    };
  }

  if (otraConfiguracion.hora_fin !== hora_inicio) {
    return {
      valid: false,
      error: `El otro turno debe terminar (${otraConfiguracion.hora_fin}) donde empieza ${tipoTurno} (${hora_inicio})`
    };
  }

  return { valid: true };
}

/**
 * Validación personalizada: Verificar que horarios cubren exactamente 24 horas
 *
 * @param diurno - Configuración del turno DIURNO
 * @param nocturno - Configuración del turno NOCTURNO
 * @returns true si cubren 24 horas, false si no
 */
export function validarCobertura24Horas(
  diurno: { hora_inicio: string; hora_fin: string },
  nocturno: { hora_inicio: string; hora_fin: string }
): { valid: boolean; error?: string } {
  // DIURNO debe terminar donde empieza NOCTURNO
  if (diurno.hora_fin !== nocturno.hora_inicio) {
    return {
      valid: false,
      error: `El turno DIURNO debe terminar (${diurno.hora_fin}) donde empieza el NOCTURNO (${nocturno.hora_inicio})`
    };
  }

  // NOCTURNO debe terminar donde empieza DIURNO
  if (nocturno.hora_fin !== diurno.hora_inicio) {
    return {
      valid: false,
      error: `El turno NOCTURNO debe terminar (${nocturno.hora_fin}) donde empieza el DIURNO (${diurno.hora_inicio})`
    };
  }

  return { valid: true };
}

/**
 * Helper para validar formato de tiempo
 *
 * Verifica que un string tiene formato TIME válido sin usar el schema Zod
 *
 * @param time - String a validar
 * @returns true si tiene formato válido
 */
export function isValidTime(time: unknown): time is string {
  if (typeof time !== 'string') return false;
  return HORARIOS_CONFIG.TIME_REGEX.test(time);
}

/**
 * Helper para validar que un ID corresponde a una configuración válida
 *
 * @param id - ID a validar
 * @returns true si es 1 o 2
 */
export function isValidConfigId(id: number): boolean {
  return id === 1 || id === 2;
}

// ============================================================================
// EXPORTACIONES
// ============================================================================

/**
 * Exportar todos los schemas para uso en controladores y middlewares
 */
export const configTurnosSchemas = {
  updateConfigTurno: updateConfigTurnoSchema,
  configTurnoIdParam: configTurnoIdParamSchema,
  configTurnoResponse: configTurnoResponseSchema,
  configTurnosListResponse: configTurnosListResponseSchema,
  updateSuccessResponse: updateSuccessResponseSchema
} as const;

/**
 * Tipo para los nombres de schemas disponibles
 */
export type ConfigTurnosSchemaName = keyof typeof configTurnosSchemas;
