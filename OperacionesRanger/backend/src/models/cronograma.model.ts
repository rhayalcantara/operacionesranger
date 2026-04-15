/**
 * Modelo de Cronograma
 * Sistema de Gestión de Turnos - OperacionesRanger
 *
 * Define las interfaces, tipos y DTOs para la entidad Cronograma.
 * Los cronogramas representan la planificación semanal de guardianes
 * en puestos de seguridad, con la regla de negocio de al menos
 * un día libre por empleado.
 *
 * @module models/cronograma.model
 */

import { TipoTurno } from './config-turnos.model';
export { TipoTurno };

// ============================================================================
// ENUMS Y CONSTANTES
// ============================================================================

/**
 * Nombres de los días de la semana indexados por número (0=Domingo...6=Sábado)
 */
export const DIAS_SEMANA = [
  'Domingo',
  'Lunes',
  'Martes',
  'Miércoles',
  'Jueves',
  'Viernes',
  'Sábado',
] as const;

/**
 * Máximo de días que un empleado puede trabajar en una semana
 * (debe tener al menos 1 día libre)
 */
export const MAX_DIAS_TRABAJO_POR_EMPLEADO = 6;

/**
 * Total de días en una semana
 */
export const DIAS_EN_SEMANA = 7;

// ============================================================================
// MODELO DE BASE DE DATOS - HEADER
// ============================================================================

/**
 * Cronograma (tabla: cronogramas)
 *
 * Representa un cronograma semanal de asignación de guardianes.
 * Cada cronograma tiene un nombre identificador y puede contener
 * múltiples asignaciones de empleados a puestos por día de la semana.
 */
export interface Cronograma {
  /** ID único del cronograma (auto-increment) */
  id: number;

  /** Nombre identificador del cronograma */
  nombre: string;

  /** Descripción opcional del cronograma */
  descripcion: string | null;

  /** Indica si el cronograma está activo (soft delete) */
  activo: boolean;

  /** ID del usuario que creó el cronograma */
  created_by: number | null;

  /** Fecha de creación del registro */
  created_at: Date;

  /** Fecha de última modificación */
  updated_at: Date;
}

// ============================================================================
// MODELO DE BASE DE DATOS - DETALLE
// ============================================================================

/**
 * CronogramaDetalle (tabla: cronogramas_detalle)
 *
 * Representa una asignación de un empleado a un puesto en un día
 * específico de la semana dentro de un cronograma.
 *
 * CONSTRAINT UNIQUE: (cronograma_id, empleado_id, dia_semana)
 * Un empleado solo puede estar asignado una vez por día en un cronograma.
 */
export interface CronogramaDetalle {
  /** ID único del detalle (auto-increment) */
  id: number;

  /** ID del cronograma al que pertenece (FK → cronogramas.id) */
  cronograma_id: number;

  /** Día de la semana (0=Domingo, 1=Lunes, ..., 6=Sábado) */
  dia_semana: number;

  /** ID del puesto asignado (FK → puestos.id) */
  puesto_id: number;

  /** ID del empleado asignado (ref rh_empleado.id_empleado) */
  empleado_id: number;

  /** Tipo de turno asignado */
  tipo_turno: TipoTurno;

  /** Fecha de creación del registro */
  created_at: Date;
}

// ============================================================================
// MODELO CON RELACIONES
// ============================================================================

/**
 * Detalle de cronograma con información de relaciones (empleado, puesto)
 *
 * Usado en: GET /api/cronogramas/:id
 */
export interface CronogramaDetalleConRelaciones extends CronogramaDetalle {
  /** Nombre completo del empleado (CONCAT nombres + apellidos) */
  empleado_nombre: string;

  /** Código del puesto */
  puesto_codigo: string;

  /** Nombre del puesto */
  puesto_nombre: string;
}

/**
 * Cronograma completo con detalles y relaciones
 *
 * Usado en: GET /api/cronogramas/:id
 */
export interface CronogramaConDetalle extends Cronograma {
  /** Array de detalles con información de empleado y puesto */
  detalles: CronogramaDetalleConRelaciones[];
}

/**
 * Cronograma en listado con conteo de detalles
 *
 * Usado en: GET /api/cronogramas
 */
export interface CronogramaEnListado extends Cronograma {
  /** Cantidad de asignaciones (detalles) en el cronograma */
  detalles_count: number;
}

// ============================================================================
// DATA TRANSFER OBJECTS (DTOs)
// ============================================================================

/**
 * DTO para crear un detalle de cronograma
 */
export interface CreateCronogramaDetalleDTO {
  /** Día de la semana (0-6, 0=Domingo) */
  dia_semana: number;

  /** ID del puesto (debe existir y estar activo) */
  puesto_id: number;

  /** ID del empleado (debe existir en BD RRHH) */
  empleado_id: number;

  /** Tipo de turno (DIURNO o NOCTURNO) */
  tipo_turno: TipoTurno;
}

/**
 * DTO para crear nuevo cronograma con detalles
 *
 * Usado en: POST /api/cronogramas
 */
export interface CreateCronogramaDTO {
  /** Nombre del cronograma (requerido) */
  nombre: string;

  /** Descripción opcional */
  descripcion?: string | null;

  /** Array de asignaciones de empleados a puestos por día */
  detalles: CreateCronogramaDetalleDTO[];
}

/**
 * DTO para actualizar cronograma existente
 *
 * Usado en: PUT /api/cronogramas/:id
 * Si detalles es proporcionado, se reemplaza completamente (DELETE + INSERT)
 */
export interface UpdateCronogramaDTO {
  /** Nombre del cronograma (opcional) */
  nombre?: string;

  /** Descripción (opcional) */
  descripcion?: string | null;

  /** Array de asignaciones (opcional, si se proporciona reemplaza todos los detalles) */
  detalles?: CreateCronogramaDetalleDTO[];
}

/**
 * DTO para respuesta paginada de cronogramas
 *
 * Usado en: GET /api/cronogramas
 */
export interface PaginatedCronogramasDTO {
  /** Array de cronogramas en la página actual */
  data: CronogramaEnListado[];

  /** Total de registros que coinciden con la búsqueda */
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
 * Configuración de validación para campos de cronograma
 */
export const CRONOGRAMA_VALIDATION = {
  NOMBRE: {
    MIN_LENGTH: 1,
    MAX_LENGTH: 100,
  },
  DESCRIPCION: {
    MAX_LENGTH: 500,
  },
  DIA_SEMANA: {
    MIN: 0,
    MAX: 6,
  },
} as const;

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Obtiene el nombre del día de la semana por número
 *
 * @param dia - Número del día (0-6)
 * @returns Nombre del día en español
 *
 * @example
 * getNombreDia(0); // "Domingo"
 * getNombreDia(1); // "Lunes"
 */
export function getNombreDia(dia: number): string {
  if (dia < 0 || dia > 6) return 'Desconocido';
  return DIAS_SEMANA[dia];
}

/**
 * Valida la regla de día libre por empleado
 *
 * Cada empleado debe tener al menos 1 día libre en la semana
 * (máximo 6 de 7 días asignados).
 *
 * @param detalles - Array de asignaciones a validar
 * @returns Array de empleados que violan la regla (vacío si todo OK)
 *
 * @example
 * const violaciones = validarDiaLibre(detalles);
 * if (violaciones.length > 0) {
 *   throw new Error(`Empleados sin día libre: ${violaciones.join(', ')}`);
 * }
 */
export function validarDiaLibre(
  detalles: CreateCronogramaDetalleDTO[]
): number[] {
  // Agrupar días únicos por empleado
  const diasPorEmpleado = new Map<number, Set<number>>();

  for (const detalle of detalles) {
    if (!diasPorEmpleado.has(detalle.empleado_id)) {
      diasPorEmpleado.set(detalle.empleado_id, new Set());
    }
    diasPorEmpleado.get(detalle.empleado_id)!.add(detalle.dia_semana);
  }

  // Encontrar empleados que trabajan los 7 días
  const empleadosSinDiaLibre: number[] = [];
  for (const [empleadoId, dias] of diasPorEmpleado) {
    if (dias.size > MAX_DIAS_TRABAJO_POR_EMPLEADO) {
      empleadosSinDiaLibre.push(empleadoId);
    }
  }

  return empleadosSinDiaLibre;
}
