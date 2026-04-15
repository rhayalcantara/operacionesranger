/**
 * Modelo de Servicio por Puesto
 * Sistema de Gestión de Turnos - OperacionesRanger
 *
 * Define las interfaces, tipos y DTOs para la entidad ServicioPuesto.
 * Los servicios por puesto representan la asignación semanal de empleados
 * (guardianes de seguridad) a cada puesto, por turno (DIURNO/NOCTURNO).
 *
 * @module models/servicio-puesto.model
 */

// ============================================================================
// TIPOS ENUM
// ============================================================================

/**
 * Tipos de turno válidos para un servicio por puesto
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
 * ServicioPuesto (tabla: servicios_puesto)
 *
 * Representa la asignación semanal de empleados a un puesto de seguridad
 * para un tipo de turno específico (DIURNO o NOCTURNO).
 * Cada día de la semana puede tener un empleado diferente asignado.
 */
export interface ServicioPuesto {
  /** ID único del servicio (auto-increment) */
  id: number;

  /** ID del puesto al que se asigna (FK -> puestos.id) */
  puesto_id: number;

  /** Tipo de turno: DIURNO o NOCTURNO */
  tipo_turno: TipoTurno;

  /** ID del empleado asignado el domingo (nullable) */
  domingo_empleado_id: number | null;

  /** ID del empleado asignado el lunes (nullable) */
  lunes_empleado_id: number | null;

  /** ID del empleado asignado el martes (nullable) */
  martes_empleado_id: number | null;

  /** ID del empleado asignado el miércoles (nullable) */
  miercoles_empleado_id: number | null;

  /** ID del empleado asignado el jueves (nullable) */
  jueves_empleado_id: number | null;

  /** ID del empleado asignado el viernes (nullable) */
  viernes_empleado_id: number | null;

  /** ID del empleado asignado el sábado (nullable) */
  sabado_empleado_id: number | null;

  /** Indica si el servicio ha sido cobrado */
  cobrada: boolean;

  /** Indica si el servicio está activo (soft delete) */
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
 * ServicioPuesto con información de relaciones (JOINs)
 *
 * Incluye nombres del puesto, ubicación, cliente y empleados asignados.
 * Usado en: GET /api/servicios-puesto (listado) y GET /api/servicios-puesto/:id (detalle)
 */
export interface ServicioPuestoConRelaciones extends ServicioPuesto {
  /** Nombre del puesto */
  puesto_nombre: string;

  /** Código del puesto */
  puesto_codigo: string;

  /** Nombre de la ubicación del puesto */
  ubicacion_nombre: string;

  /** Nombre del cliente de la ubicación */
  cliente_nombre: string;

  /** Nombre del empleado asignado el domingo */
  domingo_empleado_nombre: string | null;

  /** Nombre del empleado asignado el lunes */
  lunes_empleado_nombre: string | null;

  /** Nombre del empleado asignado el martes */
  martes_empleado_nombre: string | null;

  /** Nombre del empleado asignado el miércoles */
  miercoles_empleado_nombre: string | null;

  /** Nombre del empleado asignado el jueves */
  jueves_empleado_nombre: string | null;

  /** Nombre del empleado asignado el viernes */
  viernes_empleado_nombre: string | null;

  /** Nombre del empleado asignado el sábado */
  sabado_empleado_nombre: string | null;
}

// ============================================================================
// DATA TRANSFER OBJECTS (DTOs)
// ============================================================================

/**
 * DTO para crear nuevo servicio por puesto
 *
 * Usado en: POST /api/servicios-puesto
 */
export interface CreateServicioPuestoDTO {
  /** ID del puesto (requerido, debe existir y estar activo) */
  puesto_id: number;

  /** Tipo de turno (requerido) */
  tipo_turno: TipoTurno;

  /** ID del empleado asignado el domingo (opcional) */
  domingo_empleado_id?: number | null;

  /** ID del empleado asignado el lunes (opcional) */
  lunes_empleado_id?: number | null;

  /** ID del empleado asignado el martes (opcional) */
  martes_empleado_id?: number | null;

  /** ID del empleado asignado el miércoles (opcional) */
  miercoles_empleado_id?: number | null;

  /** ID del empleado asignado el jueves (opcional) */
  jueves_empleado_id?: number | null;

  /** ID del empleado asignado el viernes (opcional) */
  viernes_empleado_id?: number | null;

  /** ID del empleado asignado el sábado (opcional) */
  sabado_empleado_id?: number | null;

  /** Indica si el servicio ha sido cobrado (opcional, default: false) */
  cobrada?: boolean;
}

/**
 * DTO para actualizar servicio por puesto existente
 *
 * Todos los campos son opcionales.
 * Usado en: PUT /api/servicios-puesto/:id
 */
export interface UpdateServicioPuestoDTO {
  /** Tipo de turno */
  tipo_turno?: TipoTurno;

  /** ID del empleado asignado el domingo */
  domingo_empleado_id?: number | null;

  /** ID del empleado asignado el lunes */
  lunes_empleado_id?: number | null;

  /** ID del empleado asignado el martes */
  martes_empleado_id?: number | null;

  /** ID del empleado asignado el miércoles */
  miercoles_empleado_id?: number | null;

  /** ID del empleado asignado el jueves */
  jueves_empleado_id?: number | null;

  /** ID del empleado asignado el viernes */
  viernes_empleado_id?: number | null;

  /** ID del empleado asignado el sábado */
  sabado_empleado_id?: number | null;

  /** Indica si el servicio ha sido cobrado */
  cobrada?: boolean;

  /** Estado activo/inactivo */
  activo?: boolean;
}

/**
 * DTO para respuesta paginada de servicios por puesto
 *
 * Usado en: GET /api/servicios-puesto
 */
export interface PaginatedServiciosPuestoDTO {
  /** Array de servicios en la página actual */
  data: ServicioPuestoConRelaciones[];

  /** Total de registros que coinciden con los filtros */
  total: number;

  /** Número de página actual (1-indexed) */
  page: number;

  /** Tamaño de página (cantidad de registros por página) */
  pageSize: number;

  /** Total de páginas disponibles */
  totalPages: number;
}

// ============================================================================
// CONSTANTES DE VALIDACIÓN
// ============================================================================

/**
 * Nombres de los días de la semana con sus columnas correspondientes
 */
export const DIAS_SEMANA = [
  'domingo',
  'lunes',
  'martes',
  'miercoles',
  'jueves',
  'viernes',
  'sabado',
] as const;

/**
 * Columnas de empleado por día (para construir queries dinámicamente)
 */
export const EMPLOYEE_DAY_COLUMNS = DIAS_SEMANA.map(dia => `${dia}_empleado_id`);

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
export function buildUpdateFields(dto: UpdateServicioPuestoDTO): Record<string, unknown> {
  const result: Record<string, unknown> = {};

  if (dto.tipo_turno !== undefined) result.tipo_turno = dto.tipo_turno;
  if (dto.domingo_empleado_id !== undefined) result.domingo_empleado_id = dto.domingo_empleado_id;
  if (dto.lunes_empleado_id !== undefined) result.lunes_empleado_id = dto.lunes_empleado_id;
  if (dto.martes_empleado_id !== undefined) result.martes_empleado_id = dto.martes_empleado_id;
  if (dto.miercoles_empleado_id !== undefined) result.miercoles_empleado_id = dto.miercoles_empleado_id;
  if (dto.jueves_empleado_id !== undefined) result.jueves_empleado_id = dto.jueves_empleado_id;
  if (dto.viernes_empleado_id !== undefined) result.viernes_empleado_id = dto.viernes_empleado_id;
  if (dto.sabado_empleado_id !== undefined) result.sabado_empleado_id = dto.sabado_empleado_id;
  if (dto.cobrada !== undefined) result.cobrada = dto.cobrada;
  if (dto.activo !== undefined) result.activo = dto.activo;

  return result;
}
