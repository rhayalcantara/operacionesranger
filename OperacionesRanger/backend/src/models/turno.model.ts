/**
 * Modelo de Turno
 * Sistema de Gestión de Turnos - OperacionesRanger
 *
 * Define las interfaces, tipos y DTOs para la entidad Turno.
 * Los turnos representan los registros de trabajo diario de los guardianes
 * de seguridad en puestos específicos.
 *
 * IMPORTANTE:
 * - tipo_turno es auto-calculado por sp_registrar_turno (DIURNO/NOCTURNO)
 * - es_feriado es auto-calculado por sp_registrar_turno
 * - feriado_id es auto-asignado si es_feriado = true
 * - Estos campos NO deben estar en DTOs de entrada
 *
 * @module models/turno.model
 */

// ============================================================================
// ENUMS
// ============================================================================

/**
 * Tipo de turno según horario de entrada
 *
 * - DIURNO: Entrada entre 06:00-18:00 (configurable en configuracion_turnos)
 * - NOCTURNO: Entrada entre 18:00-06:00 (configurable en configuracion_turnos)
 *
 * Este valor es determinado automáticamente por sp_determinar_tipo_turno
 */
import { TipoTurno } from './config-turnos.model';
export { TipoTurno };

// ============================================================================
// MODELO DE BASE DE DATOS
// ============================================================================

/**
 * Turno (tabla: turnos)
 *
 * Representa un turno trabajado por un guardián en un puesto específico.
 * Contiene información sobre horarios, horas trabajadas, clasificación del turno
 * y vínculo con el proceso de nómina.
 */
export interface Turno {
  /** ID único del turno (auto-increment) */
  id: number;

  /** ID del empleado (FK → db_aae4a2_ranger.rh_empleado.id_empleado) */
  empleado_id: number;

  /** ID del puesto (FK → puestos.id) */
  puesto_id: number;

  /** Fecha del turno (formato: YYYY-MM-DD) */
  fecha: string;

  /** Hora de entrada (formato: HH:MM:SS) */
  hora_entrada: string;

  /** Hora de salida (formato: HH:MM:SS) */
  hora_salida: string;

  /** Horas normales trabajadas (0-12, validado por trigger) */
  horas_normales: number;

  /** Horas extras trabajadas (0-4, validado por trigger) */
  horas_extras: number;

  /** Tipo de turno (auto-calculado por sp_registrar_turno) */
  tipo_turno: TipoTurno;

  /** Indica si el turno fue en día feriado (auto-calculado) */
  es_feriado: boolean;

  /** ID del feriado si aplica (FK → feriados.id, nullable) */
  feriado_id: number | null;

  /** ID de nómina asignado por sistema externo (nullable) */
  nomina_id: number | null;

  /** Indica si el turno ya fue procesado en nómina */
  procesado_nomina: boolean;

  /** Fecha en que fue procesado en nómina (nullable) */
  fecha_procesado: Date | null;

  /** Observaciones adicionales del turno (nullable) */
  observaciones: string | null;

  /** ID del usuario que registró el turno */
  created_by: number;

  /** Fecha de creación del registro */
  created_at: Date;

  /** Fecha de última modificación */
  updated_at: Date;
}

// ============================================================================
// DATA TRANSFER OBJECTS (DTOs)
// ============================================================================

/**
 * DTO para crear nuevo turno
 *
 * Usado en: POST /api/turnos
 *
 * NOTA: tipo_turno, es_feriado y feriado_id son calculados automáticamente
 * por el stored procedure sp_registrar_turno y NO deben ser proporcionados
 * por el usuario.
 */
export interface CreateTurnoDTO {
  /** ID del empleado (requerido, debe existir en BD RRHH y estar activo) */
  empleado_id: number;

  /** ID del puesto (requerido, debe existir y estar activo) */
  puesto_id: number;

  /** Fecha del turno (requerido, formato YYYY-MM-DD) */
  fecha: string;

  /** Hora de entrada (requerido, formato HH:MM:SS) */
  hora_entrada: string;

  /** Hora de salida (requerido, formato HH:MM:SS) */
  hora_salida: string;

  /** Horas normales trabajadas (requerido, 0-12) */
  horas_normales: number;

  /** Horas extras trabajadas (requerido, 0-4) */
  horas_extras: number;

  /** Observaciones (opcional, max 1000 caracteres) */
  observaciones?: string | null;
}

/**
 * DTO para actualizar turno existente
 *
 * Todos los campos son opcionales.
 * Usado en: PUT /api/turnos/:id
 *
 * RESTRICCIONES:
 * - No se puede cambiar empleado_id (riesgo de inconsistencias)
 * - No se puede cambiar puesto_id (riesgo de inconsistencias)
 * - No se puede cambiar fecha (crear nuevo turno en su lugar)
 * - No se puede editar si procesado_nomina = true
 */
export interface UpdateTurnoDTO {
  /** Hora de entrada */
  hora_entrada?: string;

  /** Hora de salida */
  hora_salida?: string;

  /** Horas normales trabajadas (0-12) */
  horas_normales?: number;

  /** Horas extras trabajadas (0-4) */
  horas_extras?: number;

  /** Observaciones */
  observaciones?: string | null;
}

/**
 * DTO para respuesta paginada de turnos
 *
 * Usado en: GET /api/turnos
 */
export interface PaginatedTurnosDTO {
  /** Array de turnos en la página actual */
  data: Turno[];

  /** Total de registros que coinciden con la búsqueda */
  total: number;

  /** Número de página actual (1-indexed) */
  page: number;

  /** Tamaño de página (cantidad de registros por página) */
  pageSize: number;

  /** Total de páginas disponibles */
  totalPages: number;
}

/**
 * DTO para turno con información adicional (empleado, puesto, ubicación, cliente)
 *
 * Usado en: GET /api/turnos/:id
 */
export interface TurnoConRelaciones extends Turno {
  /** Nombre completo del empleado */
  empleado_nombre: string;

  /** Cédula del empleado */
  empleado_cedula: string;

  /** Código del puesto */
  puesto_codigo: string;

  /** Nombre del puesto */
  puesto_nombre: string;

  /** ID de la ubicación del puesto */
  ubicacion_id: number;

  /** Nombre de la ubicación */
  ubicacion_nombre: string;

  /** ID del cliente de la ubicación */
  cliente_id: number;

  /** Nombre del cliente */
  cliente_nombre: string;

  /** Nombre del feriado si aplica */
  feriado_nombre: string | null;

  /** Tipo de feriado si aplica (NACIONAL o DECRETO) */
  feriado_tipo: string | null;
}

/**
 * DTO para filtros de búsqueda de turnos
 *
 * Usado en query params de GET /api/turnos
 */
export interface TurnoFilters {
  /** Fecha de inicio del rango (YYYY-MM-DD) */
  fecha_inicio?: string;

  /** Fecha de fin del rango (YYYY-MM-DD) */
  fecha_fin?: string;

  /** Filtrar por empleado */
  empleado_id?: number;

  /** Filtrar por puesto */
  puesto_id?: number;

  /** Filtrar por ubicación */
  ubicacion_id?: number;

  /** Filtrar por cliente */
  cliente_id?: number;

  /** Filtrar por tipo de turno */
  tipo_turno?: TipoTurno;

  /** Filtrar por turnos en feriados */
  es_feriado?: boolean;

  /** Filtrar por turnos procesados en nómina */
  procesado_nomina?: boolean;

  /** Número de página (1-indexed) */
  page?: number;

  /** Registros por página */
  pageSize?: number;
}

// ============================================================================
// UTILITY TYPES
// ============================================================================

/**
 * Campos requeridos para insertar turno en BD usando stored procedure
 *
 * El stored procedure sp_registrar_turno calcula automáticamente:
 * - tipo_turno (DIURNO/NOCTURNO)
 * - es_feriado (true/false)
 * - feriado_id (si es_feriado = true)
 */
export type NuevoTurnoDB = {
  empleado_id: number;
  puesto_id: number;
  fecha: string;
  hora_entrada: string;
  hora_salida: string;
  horas_normales: number;
  horas_extras: number;
  observaciones: string | null;
  created_by: number;
};

/**
 * Campos actualizables de turno
 *
 * Excluye:
 * - id, empleado_id, puesto_id, fecha (no modificables)
 * - tipo_turno, es_feriado, feriado_id (auto-calculados)
 * - procesado_nomina, nomina_id, fecha_procesado (solo por sistema de nómina)
 * - created_by, created_at, updated_at (audit fields)
 */
export type TurnoActualizable = {
  hora_entrada?: string;
  hora_salida?: string;
  horas_normales?: number;
  horas_extras?: number;
  observaciones?: string | null;
};

// ============================================================================
// CONSTANTES DE VALIDACIÓN
// ============================================================================

/**
 * Configuración de validación para campos de turno
 *
 * Estas validaciones se aplican tanto en schemas Zod como en triggers de BD.
 */
export const TURNO_VALIDATION = {
  HORAS_NORMALES: {
    MIN: 0,
    MAX: 12,
  },
  HORAS_EXTRAS: {
    MIN: 0,
    MAX: 4,
  },
  HORAS_TOTALES: {
    MAX: 16, // horas_normales + horas_extras <= 16 (validado por trigger)
  },
  FECHA: {
    // Formato: YYYY-MM-DD
    REGEX: /^\d{4}-\d{2}-\d{2}$/,
    // No permitir fechas futuras más allá de 7 días
    MAX_DIAS_FUTURO: 7,
  },
  HORA: {
    // Formato: HH:MM:SS (24 horas)
    REGEX: /^([01]\d|2[0-3]):([0-5]\d):([0-5]\d)$/,
  },
  OBSERVACIONES: {
    MAX_LENGTH: 1000,
  },
} as const;

// ============================================================================
// TYPE GUARDS
// ============================================================================

/**
 * Verifica si un valor es un Turno válido
 *
 * @param value - Valor a verificar
 * @returns true si es un Turno válido
 */
export function isTurno(value: unknown): value is Turno {
  if (!value || typeof value !== 'object') return false;

  const turno = value as Turno;

  return (
    typeof turno.id === 'number' &&
    typeof turno.empleado_id === 'number' &&
    typeof turno.puesto_id === 'number' &&
    typeof turno.fecha === 'string' &&
    typeof turno.hora_entrada === 'string' &&
    typeof turno.hora_salida === 'string' &&
    typeof turno.horas_normales === 'number' &&
    typeof turno.horas_extras === 'number' &&
    isTipoTurno(turno.tipo_turno) &&
    typeof turno.es_feriado === 'boolean' &&
    typeof turno.procesado_nomina === 'boolean'
  );
}

/**
 * Verifica si un valor es un TipoTurno válido
 *
 * @param value - Valor a verificar
 * @returns true si es TipoTurno.DIURNO o TipoTurno.NOCTURNO
 */
export function isTipoTurno(value: unknown): value is TipoTurno {
  return Object.values(TipoTurno).includes(value as TipoTurno);
}

/**
 * Verifica si una fecha tiene formato válido YYYY-MM-DD
 *
 * @param fecha - Fecha a validar
 * @returns true si el formato es válido
 */
export function isValidFecha(fecha: string): boolean {
  if (!TURNO_VALIDATION.FECHA.REGEX.test(fecha)) return false;

  // Verificar que sea una fecha válida
  const date = new Date(fecha);
  return !isNaN(date.getTime()) && fecha === date.toISOString().split('T')[0];
}

/**
 * Verifica si una hora tiene formato válido HH:MM:SS
 *
 * @param hora - Hora a validar
 * @returns true si el formato es válido
 */
export function isValidHora(hora: string): boolean {
  return TURNO_VALIDATION.HORA.REGEX.test(hora);
}

/**
 * Verifica si las horas normales están en rango válido (0-12)
 *
 * @param horas - Horas a validar
 * @returns true si está en el rango válido
 */
export function isValidHorasNormales(horas: number): boolean {
  return (
    horas >= TURNO_VALIDATION.HORAS_NORMALES.MIN &&
    horas <= TURNO_VALIDATION.HORAS_NORMALES.MAX
  );
}

/**
 * Verifica si las horas extras están en rango válido (0-4)
 *
 * @param horas - Horas a validar
 * @returns true si está en el rango válido
 */
export function isValidHorasExtras(horas: number): boolean {
  return (
    horas >= TURNO_VALIDATION.HORAS_EXTRAS.MIN &&
    horas <= TURNO_VALIDATION.HORAS_EXTRAS.MAX
  );
}

/**
 * Verifica si el total de horas (normales + extras) está en rango válido (<=16)
 *
 * @param horasNormales - Horas normales trabajadas
 * @param horasExtras - Horas extras trabajadas
 * @returns true si el total está en el rango válido
 */
export function isValidHorasTotales(horasNormales: number, horasExtras: number): boolean {
  return horasNormales + horasExtras <= TURNO_VALIDATION.HORAS_TOTALES.MAX;
}

/**
 * Verifica si una fecha está dentro del rango permitido para registro
 *
 * No permite fechas futuras más allá de MAX_DIAS_FUTURO (7 días por defecto)
 *
 * @param fecha - Fecha a validar (formato YYYY-MM-DD)
 * @returns true si la fecha está en el rango permitido
 */
export function isValidFechaRango(fecha: string): boolean {
  if (!isValidFecha(fecha)) return false;

  const fechaTurno = new Date(fecha);
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);

  const maxFechaFutura = new Date(hoy);
  maxFechaFutura.setDate(maxFechaFutura.getDate() + TURNO_VALIDATION.FECHA.MAX_DIAS_FUTURO);

  return fechaTurno <= maxFechaFutura;
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Convierte CreateTurnoDTO a NuevoTurnoDB
 *
 * Prepara el DTO para llamada a sp_registrar_turno.
 *
 * @param dto - DTO de creación
 * @param created_by - ID del usuario que crea el turno
 * @returns Objeto listo para stored procedure
 *
 * @example
 * const dto: CreateTurnoDTO = {
 *   empleado_id: 1001,
 *   puesto_id: 42,
 *   fecha: "2026-01-15",
 *   hora_entrada: "06:00:00",
 *   hora_salida: "18:00:00",
 *   horas_normales: 10.0,
 *   horas_extras: 2.0
 * };
 *
 * const dbData = dtoToNuevoTurnoDB(dto, 5);
 * // Llamar: CALL sp_registrar_turno(1001, 42, '2026-01-15', '06:00:00', '18:00:00', 10.0, 2.0, 5)
 */
export function dtoToNuevoTurnoDB(dto: CreateTurnoDTO, created_by: number): NuevoTurnoDB {
  return {
    empleado_id: dto.empleado_id,
    puesto_id: dto.puesto_id,
    fecha: dto.fecha,
    hora_entrada: dto.hora_entrada,
    hora_salida: dto.hora_salida,
    horas_normales: dto.horas_normales,
    horas_extras: dto.horas_extras,
    observaciones: dto.observaciones || null,
    created_by,
  };
}

/**
 * Convierte UpdateTurnoDTO a TurnoActualizable
 *
 * Solo incluye campos que fueron proporcionados.
 *
 * @param dto - DTO de actualización
 * @returns Objeto con campos a actualizar
 *
 * @example
 * const dto: UpdateTurnoDTO = {
 *   horas_normales: 11.0,
 *   horas_extras: 3.0
 * };
 *
 * const updateData = dtoToTurnoActualizable(dto);
 * // {
 * //   horas_normales: 11.0,
 * //   horas_extras: 3.0
 * // }
 */
export function dtoToTurnoActualizable(dto: UpdateTurnoDTO): TurnoActualizable {
  const result: TurnoActualizable = {};

  if (dto.hora_entrada !== undefined) result.hora_entrada = dto.hora_entrada;
  if (dto.hora_salida !== undefined) result.hora_salida = dto.hora_salida;
  if (dto.horas_normales !== undefined) result.horas_normales = dto.horas_normales;
  if (dto.horas_extras !== undefined) result.horas_extras = dto.horas_extras;
  if (dto.observaciones !== undefined) result.observaciones = dto.observaciones;

  return result;
}

/**
 * Calcula el total de horas trabajadas en un turno
 *
 * @param turno - Turno o DTO con horas_normales y horas_extras
 * @returns Total de horas trabajadas
 *
 * @example
 * const turno = { horas_normales: 10, horas_extras: 2 };
 * calcularHorasTotales(turno); // 12
 */
export function calcularHorasTotales(turno: { horas_normales: number; horas_extras: number }): number {
  return turno.horas_normales + turno.horas_extras;
}

/**
 * Verifica si un turno puede ser editado
 *
 * Un turno NO puede ser editado si:
 * - Ya fue procesado en nómina (procesado_nomina = true)
 *
 * @param turno - Turno a verificar
 * @returns true si el turno puede ser editado
 */
export function canEditTurno(turno: Turno): boolean {
  return !turno.procesado_nomina;
}

/**
 * Verifica si un turno puede ser eliminado
 *
 * Un turno NO puede ser eliminado si:
 * - Ya fue procesado en nómina (procesado_nomina = true)
 *
 * @param turno - Turno a verificar
 * @returns true si el turno puede ser eliminado
 */
export function canDeleteTurno(turno: Turno): boolean {
  return !turno.procesado_nomina;
}

/**
 * Formatea una fecha YYYY-MM-DD a formato legible
 *
 * @param fecha - Fecha en formato YYYY-MM-DD
 * @returns Fecha en formato DD/MM/YYYY
 *
 * @example
 * formatearFecha("2026-01-15"); // "15/01/2026"
 */
export function formatearFecha(fecha: string): string {
  if (!isValidFecha(fecha)) return fecha;

  const [year, month, day] = fecha.split('-');
  return `${day}/${month}/${year}`;
}

/**
 * Formatea una hora HH:MM:SS a formato corto HH:MM
 *
 * @param hora - Hora en formato HH:MM:SS
 * @returns Hora en formato HH:MM
 *
 * @example
 * formatearHora("06:00:00"); // "06:00"
 */
export function formatearHora(hora: string): string {
  if (!isValidHora(hora)) return hora;

  return hora.substring(0, 5); // Tomar solo HH:MM
}

// ============================================================================
// INTERFACES PARA CALENDARIO MENSUAL
// ============================================================================

/**
 * DTO para turno en vista de calendario (versión simplificada)
 *
 * Usado en la respuesta de GET /api/turnos/calendario/:año/:mes
 * Contiene solo los datos esenciales para mostrar en un calendario.
 */
export interface TurnoCalendarioDTO {
  /** ID del turno */
  id: number;

  /** Información del empleado */
  empleado: {
    id: number;
    nombre: string;
  };

  /** Información del puesto */
  puesto: {
    id: number;
    codigo: string;
    nombre: string;
  };

  /** Información de la ubicación */
  ubicacion: {
    id: number;
    nombre: string;
  };

  /** Información del cliente */
  cliente: {
    id: number;
    nombre: string;
  };

  /** Hora de entrada (HH:MM:SS) */
  hora_entrada: string;

  /** Hora de salida (HH:MM:SS) */
  hora_salida: string;

  /** Tipo de turno */
  tipo_turno: TipoTurno;

  /** Horas normales trabajadas */
  horas_normales: number;

  /** Horas extras trabajadas */
  horas_extras: number;

  /** Total de horas trabajadas */
  horas_totales: number;
}

/**
 * DTO para un día en el calendario
 *
 * Representa un día del mes con sus turnos y si es feriado.
 */
export interface DiaCalendarioDTO {
  /** Fecha del día (formato YYYY-MM-DD) */
  fecha: string;

  /** Indica si el día es feriado */
  es_feriado: boolean;

  /** Nombre del feriado si aplica */
  nombre_feriado: string | null;

  /** Tipo de feriado (NACIONAL o DECRETO) si aplica */
  tipo_feriado: string | null;

  /** Lista de turnos del día */
  turnos: TurnoCalendarioDTO[];
}

/**
 * DTO para respuesta de calendario mensual
 *
 * Usado en: GET /api/turnos/calendario/:año/:mes
 * Contiene todos los días del mes con sus turnos agrupados.
 */
export interface CalendarioMensualDTO {
  /** Año del calendario */
  año: number;

  /** Mes del calendario (1-12) */
  mes: number;

  /** Array de días del mes (1 al último día) */
  dias: DiaCalendarioDTO[];
}
