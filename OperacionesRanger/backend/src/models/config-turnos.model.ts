/**
 * Modelos de Configuración de Turnos
 * Sistema de Gestión de Turnos - OperacionesRanger
 *
 * Este archivo contiene las interfaces, tipos y DTOs relacionados con
 * la configuración de horarios de turnos (DIURNO y NOCTURNO).
 *
 * Tabla: configuracion_turnos
 * Nota: Esta tabla contiene SOLO 2 registros (DIURNO y NOCTURNO) que
 * NO se crean ni eliminan, solo se actualizan.
 */

// ============================================================================
// ENUMS Y TYPES
// ============================================================================

/**
 * Tipos de turno del sistema
 *
 * Solo existen 2 tipos de turno en el sistema:
 * - DIURNO: Turno de día (por defecto 06:00-18:00)
 * - NOCTURNO: Turno de noche (por defecto 18:00-06:00, cruza medianoche)
 */
export enum TipoTurno {
  DIURNO = 'DIURNO',
  NOCTURNO = 'NOCTURNO'
}

// ============================================================================
// MODELOS DE BASE DE DATOS
// ============================================================================

/**
 * Configuración de Turno (tabla: configuracion_turnos)
 *
 * Define los rangos horarios para clasificar turnos como diurnos o nocturnos.
 * Estos horarios son usados por el stored procedure `sp_determinar_tipo_turno`
 * para clasificar automáticamente cada turno registrado.
 *
 * **Invariante del sistema**: Siempre hay exactamente 2 registros en la tabla.
 */
export interface ConfiguracionTurno {
  /** ID único de la configuración */
  id: number;

  /** Tipo de turno (DIURNO o NOCTURNO) */
  tipo_turno: TipoTurno;

  /**
   * Hora de inicio del rango
   * Formato: HH:MM:SS (TIME de MySQL)
   * Ejemplo: '06:00:00'
   */
  hora_inicio: string;

  /**
   * Hora de fin del rango
   * Formato: HH:MM:SS (TIME de MySQL)
   * Ejemplo: '18:00:00'
   *
   * Nota: Puede ser menor que hora_inicio si el turno cruza medianoche
   * (ej: NOCTURNO: 18:00:00 - 06:00:00)
   */
  hora_fin: string;

  /** Descripción legible del turno */
  descripcion: string | null;

  /** Si la configuración está activa */
  activo: boolean;

  /** Fecha de creación del registro */
  created_at: Date;

  /** Fecha de última actualización */
  updated_at: Date;
}

// ============================================================================
// DATA TRANSFER OBJECTS (DTOs)
// ============================================================================

/**
 * DTO para actualizar configuración de turno
 *
 * PUT /api/configuracion-turnos/:id
 *
 * Todos los campos son opcionales. Solo se actualizan los campos proporcionados.
 */
export interface UpdateConfigTurnoDTO {
  /**
   * Nueva hora de inicio
   * Formato: HH:MM:SS o HH:MM
   */
  hora_inicio?: string;

  /**
   * Nueva hora de fin
   * Formato: HH:MM:SS o HH:MM
   */
  hora_fin?: string;

  /** Nueva descripción */
  descripcion?: string;

  /** Cambiar estado activo/inactivo */
  activo?: boolean;
}

/**
 * DTO para respuesta de configuración de turno
 *
 * Usado en respuestas de API para endpoints GET y PUT.
 * Incluye todos los campos de ConfiguracionTurno.
 */
export interface ConfigTurnoResponseDTO {
  id: number;
  tipo_turno: TipoTurno;
  hora_inicio: string;
  hora_fin: string;
  descripcion: string | null;
  activo: boolean;
  created_at: Date;
  updated_at: Date;
}

/**
 * DTO para respuesta paginada de configuraciones
 *
 * Aunque siempre hay 2 registros, mantenemos consistencia con otros endpoints
 * que usan paginación.
 */
export interface ConfigTurnosListDTO {
  data: ConfigTurnoResponseDTO[];
  total: number;
}

// ============================================================================
// UTILITY TYPES
// ============================================================================

/**
 * Campos actualizables de ConfiguracionTurno
 *
 * Solo se pueden actualizar: hora_inicio, hora_fin, descripcion, activo
 * NO se puede cambiar: id, tipo_turno, created_at, updated_at
 */
export type ConfigTurnoActualizable = Pick<
  ConfiguracionTurno,
  'hora_inicio' | 'hora_fin' | 'descripcion' | 'activo'
>;

/**
 * Resultado de validación de horarios
 *
 * Usado internamente por el servicio para validar que los horarios
 * de DIURNO y NOCTURNO cubren exactamente 24 horas sin solapamiento.
 */
export interface HorariosValidationResult {
  valid: boolean;
  errors: string[];
}

// ============================================================================
// CONSTANTES
// ============================================================================

/**
 * Horarios por defecto del sistema
 *
 * Estos son los horarios iniciales configurados en el schema SQL.
 */
export const DEFAULT_HORARIOS = {
  DIURNO: {
    tipo_turno: TipoTurno.DIURNO,
    hora_inicio: '06:00:00',
    hora_fin: '18:00:00',
    descripcion: 'Turno diurno: 6:00 AM a 6:00 PM'
  },
  NOCTURNO: {
    tipo_turno: TipoTurno.NOCTURNO,
    hora_inicio: '18:00:00',
    hora_fin: '06:00:00',
    descripcion: 'Turno nocturno: 6:00 PM a 6:00 AM'
  }
} as const;

/**
 * Configuración de validación de horarios
 */
export const HORARIOS_CONFIG = {
  /** Formato regex para validar TIME (HH:MM:SS o HH:MM) */
  TIME_REGEX: /^([01]\d|2[0-3]):([0-5]\d)(:([0-5]\d))?$/,

  /** Minutos totales en un día */
  MINUTOS_DIA: 24 * 60,

  /** Cantidad exacta de configuraciones en el sistema */
  TOTAL_CONFIGURACIONES: 2
} as const;

// ============================================================================
// TYPE GUARDS
// ============================================================================

/**
 * Verifica si un valor es un TipoTurno válido
 *
 * @param tipo - Valor a verificar
 * @returns true si es DIURNO o NOCTURNO
 *
 * @example
 * ```typescript
 * if (isValidTipoTurno('DIURNO')) {
 *   // tipo es TipoTurno
 * }
 * ```
 */
export function isValidTipoTurno(tipo: unknown): tipo is TipoTurno {
  return (
    typeof tipo === 'string' &&
    Object.values(TipoTurno).includes(tipo as TipoTurno)
  );
}

/**
 * Verifica si un string es un horario TIME válido
 *
 * Acepta formatos:
 * - HH:MM:SS (ej: '06:00:00')
 * - HH:MM (ej: '06:00')
 *
 * @param time - String a verificar
 * @returns true si tiene formato TIME válido
 *
 * @example
 * ```typescript
 * isValidTimeFormat('06:00:00') // true
 * isValidTimeFormat('06:00')    // true
 * isValidTimeFormat('25:00')    // false
 * isValidTimeFormat('6:00')     // false (debe tener 2 dígitos en hora)
 * ```
 */
export function isValidTimeFormat(time: unknown): time is string {
  if (typeof time !== 'string') return false;
  return HORARIOS_CONFIG.TIME_REGEX.test(time);
}

/**
 * Verifica si un horario cruza medianoche
 *
 * Un horario cruza medianoche si hora_fin < hora_inicio.
 * Ejemplo: 18:00 - 06:00 cruza medianoche.
 *
 * @param hora_inicio - Hora de inicio (HH:MM:SS o HH:MM)
 * @param hora_fin - Hora de fin (HH:MM:SS o HH:MM)
 * @returns true si el horario cruza medianoche
 *
 * @example
 * ```typescript
 * cruzaMedianoche('18:00:00', '06:00:00') // true (NOCTURNO)
 * cruzaMedianoche('06:00:00', '18:00:00') // false (DIURNO)
 * ```
 */
export function cruzaMedianoche(
  hora_inicio: string,
  hora_fin: string
): boolean {
  const inicio = timeToMinutes(hora_inicio);
  const fin = timeToMinutes(hora_fin);
  return fin < inicio;
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Convierte un TIME string a minutos desde medianoche
 *
 * @param time - Hora en formato HH:MM:SS o HH:MM
 * @returns Minutos desde 00:00 (0-1439)
 *
 * @example
 * ```typescript
 * timeToMinutes('00:00:00') // 0
 * timeToMinutes('06:00:00') // 360
 * timeToMinutes('12:30:00') // 750
 * timeToMinutes('23:59:59') // 1439
 * ```
 */
export function timeToMinutes(time: string): number {
  const parts = time.split(':');
  const hours = parseInt(parts[0], 10);
  const minutes = parseInt(parts[1], 10);
  return hours * 60 + minutes;
}

/**
 * Convierte minutos desde medianoche a TIME string
 *
 * @param minutes - Minutos desde 00:00 (0-1439)
 * @returns Hora en formato HH:MM:SS
 *
 * @example
 * ```typescript
 * minutesToTime(0)    // '00:00:00'
 * minutesToTime(360)  // '06:00:00'
 * minutesToTime(750)  // '12:30:00'
 * minutesToTime(1439) // '23:59:00'
 * ```
 */
export function minutesToTime(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:00`;
}

/**
 * Normaliza un TIME string a formato HH:MM:SS
 *
 * Si el input es HH:MM, agrega :00 al final.
 * Si el input ya es HH:MM:SS, lo devuelve sin cambios.
 *
 * @param time - Hora en formato HH:MM:SS o HH:MM
 * @returns Hora en formato HH:MM:SS
 *
 * @example
 * ```typescript
 * normalizeTime('06:00')    // '06:00:00'
 * normalizeTime('06:00:00') // '06:00:00'
 * ```
 */
export function normalizeTime(time: string): string {
  if (!isValidTimeFormat(time)) {
    throw new Error(`Formato de hora inválido: ${time}`);
  }

  // Si ya tiene segundos, retornar como está
  if (time.split(':').length === 3) {
    return time;
  }

  // Si solo tiene HH:MM, agregar :00
  return `${time}:00`;
}

/**
 * Convierte ConfiguracionTurno a DTO de respuesta
 *
 * @param config - Configuración de turno de BD
 * @returns DTO para respuesta de API
 */
export function toConfigTurnoResponseDTO(
  config: ConfiguracionTurno
): ConfigTurnoResponseDTO {
  return {
    id: config.id,
    tipo_turno: config.tipo_turno,
    hora_inicio: config.hora_inicio,
    hora_fin: config.hora_fin,
    descripcion: config.descripcion,
    activo: config.activo,
    created_at: config.created_at,
    updated_at: config.updated_at
  };
}

/**
 * Formatea hora TIME para visualización
 *
 * Convierte formato 24h a formato AM/PM más legible.
 *
 * @param time - Hora en formato HH:MM:SS
 * @returns Hora en formato legible (ej: '6:00 AM')
 *
 * @example
 * ```typescript
 * formatTimeDisplay('06:00:00') // '6:00 AM'
 * formatTimeDisplay('18:00:00') // '6:00 PM'
 * formatTimeDisplay('00:00:00') // '12:00 AM'
 * formatTimeDisplay('12:00:00') // '12:00 PM'
 * ```
 */
export function formatTimeDisplay(time: string): string {
  const parts = time.split(':');
  let hours = parseInt(parts[0], 10);
  const minutes = parts[1];

  const ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12 || 12; // Convertir 0 a 12

  return `${hours}:${minutes} ${ampm}`;
}
