/**
 * Modelo de Diario de Puesto
 * Sistema de Gestión de Turnos - OperacionesRanger
 *
 * Define las interfaces, tipos y DTOs para la entidad DiarioPuesto.
 * El diario de puesto registra la asistencia diaria de empleados
 * (guardianes de seguridad) en cada puesto, incluyendo horas trabajadas
 * y tipo de turno.
 *
 * @module models/diario-puesto.model
 */

// ============================================================================
// TIPOS ENUM
// ============================================================================

/**
 * Tipos de turno válidos para un registro de diario
 */
export type TipoTurno = 'DIURNO' | 'NOCTURNO';

/**
 * Array de tipos de turno válidos (para validaciones)
 */
export const TIPOS_TURNO: TipoTurno[] = ['DIURNO', 'NOCTURNO'];

// ============================================================================
// MODELO DE BASE DE DATOS
// ============================================================================

/**
 * DiarioPuesto (tabla: diario_puesto)
 *
 * Representa un registro diario de asistencia de un empleado en un puesto
 * de seguridad. Almacena la fecha, horas trabajadas y tipo de turno.
 *
 * Restricciones:
 * - UNIQUE(puesto_id, empleado_id, fecha)
 * - CHECK horas 0-24
 */
export interface DiarioPuesto {
  /** ID único del registro (auto-increment) */
  id: number;

  /** ID del puesto (FK -> puestos.id) */
  puesto_id: number;

  /** ID del empleado asignado */
  empleado_id: number;

  /** Fecha del registro */
  fecha: string;

  /** Horas trabajadas (0-24, DECIMAL(4,2)) */
  horas: number;

  /** Tipo de turno: DIURNO o NOCTURNO */
  tipo_turno: TipoTurno;

  /** ID del servicio por puesto de origen (FK -> servicios_puesto.id, nullable) */
  servicio_puesto_id: number | null;

  /** Indica si el registro está activo (soft delete) */
  activo: boolean;

  /** ID del usuario que creó el registro */
  created_by: number | null;

  /** Fecha de creación del registro */
  created_at: Date;

  /** Fecha de última modificación */
  updated_at: Date;
}

// ============================================================================
// MODELO CON RELACIONES
// ============================================================================

/**
 * DiarioPuesto con información de relaciones (JOINs)
 *
 * Incluye nombres del puesto, ubicación, cliente y empleado.
 * Usado en: GET /api/diario-puesto (listado) y GET /api/diario-puesto/:id (detalle)
 */
export interface DiarioPuestoConRelaciones extends DiarioPuesto {
  /** Nombre del puesto */
  puesto_nombre: string;

  /** Código del puesto */
  puesto_codigo: string;

  /** Nombre completo del empleado */
  empleado_nombre: string;

  /** Nombre de la ubicación del puesto */
  ubicacion_nombre: string;

  /** Nombre del cliente de la ubicación */
  cliente_nombre: string;
}

// ============================================================================
// DATA TRANSFER OBJECTS (DTOs)
// ============================================================================

/**
 * DTO para crear nuevo registro de diario de puesto
 *
 * Usado en: POST /api/diario-puesto
 */
export interface CreateDiarioPuestoDTO {
  /** ID del puesto (requerido) */
  puesto_id: number;

  /** ID del empleado (requerido) */
  empleado_id: number;

  /** Fecha del registro (requerido, formato YYYY-MM-DD) */
  fecha: string;

  /** Horas trabajadas (requerido, 0-24) */
  horas: number;

  /** Tipo de turno (requerido) */
  tipo_turno: TipoTurno;

  /** ID del servicio por puesto de origen (opcional) */
  servicio_puesto_id?: number | null;

  /** Estado activo (opcional, default: true) */
  activo?: boolean;
}

/**
 * DTO para actualizar registro de diario de puesto existente
 *
 * Todos los campos son opcionales.
 * Usado en: PUT /api/diario-puesto/:id
 */
export interface UpdateDiarioPuestoDTO {
  /** ID del puesto */
  puesto_id?: number;

  /** ID del empleado */
  empleado_id?: number;

  /** Fecha del registro (formato YYYY-MM-DD) */
  fecha?: string;

  /** Horas trabajadas (0-24) */
  horas?: number;

  /** Tipo de turno */
  tipo_turno?: TipoTurno;

  /** ID del servicio por puesto de origen */
  servicio_puesto_id?: number | null;

  /** Estado activo/inactivo */
  activo?: boolean;
}

// ============================================================================
// DTOs PARA POBLAR DESDE PLANTILLA
// ============================================================================

/**
 * DTO para poblar diario de puesto desde una plantilla de servicio
 *
 * Usado en: POST /api/diario-puesto/poblar-plantilla
 */
export interface PoblarPlantillaDTO {
  /** ID de la plantilla de servicio a usar */
  plantilla_id: number;

  /** Fecha para la cual generar los registros (formato YYYY-MM-DD) */
  fecha: string;
}

/**
 * DTO para poblar diario de puesto desde servicios por puesto activos
 *
 * Usado en: POST /api/diario-puesto/poblar-servicios
 */
export interface PoblarServiciosDTO {
  /** Fecha para la cual generar los registros (formato YYYY-MM-DD) */
  fecha: string;
}

/**
 * Resultado de la operación de poblar desde plantilla
 */
export interface PoblarPlantillaResult {
  /** Cantidad de registros insertados exitosamente */
  insertados: number;

  /** Cantidad de registros omitidos (ya existían - duplicados) */
  omitidos: number;

  /** Detalles descriptivos de cada operación */
  detalles: string[];
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Construye el objeto de campos actualizables a partir del DTO de update
 *
 * Solo incluye campos que fueron proporcionados (no undefined).
 *
 * @param dto - DTO de actualización
 * @returns Objeto con solo los campos a actualizar
 */
export function buildUpdateFields(dto: UpdateDiarioPuestoDTO): Record<string, unknown> {
  const result: Record<string, unknown> = {};

  if (dto.puesto_id !== undefined) result.puesto_id = dto.puesto_id;
  if (dto.empleado_id !== undefined) result.empleado_id = dto.empleado_id;
  if (dto.fecha !== undefined) result.fecha = dto.fecha;
  if (dto.horas !== undefined) result.horas = dto.horas;
  if (dto.tipo_turno !== undefined) result.tipo_turno = dto.tipo_turno;
  if (dto.servicio_puesto_id !== undefined) result.servicio_puesto_id = dto.servicio_puesto_id;
  if (dto.activo !== undefined) result.activo = dto.activo;

  return result;
}
