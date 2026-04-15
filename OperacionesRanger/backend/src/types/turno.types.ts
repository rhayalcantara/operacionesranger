/**
 * Tipos compartidos para Turnos
 * Sistema de Gestión de Turnos - OperacionesRanger
 *
 * Centraliza la exportación de tipos relacionados con turnos
 * para facilitar las importaciones en controllers, services y routes.
 *
 * @module types/turno.types
 */

// ============================================================================
// RE-EXPORTAR DESDE MODELO
// ============================================================================

export {
  // Enum
  TipoTurno,

  // Interfaces principales
  type Turno,
  type CreateTurnoDTO,
  type UpdateTurnoDTO,
  type PaginatedTurnosDTO,
  type TurnoConRelaciones,
  type TurnoFilters,

  // Utility types
  type NuevoTurnoDB,
  type TurnoActualizable,

  // Constantes
  TURNO_VALIDATION,

  // Type guards
  isTurno,
  isTipoTurno,
  isValidFecha,
  isValidHora,
  isValidHorasNormales,
  isValidHorasExtras,
  isValidHorasTotales,
  isValidFechaRango,

  // Helper functions
  dtoToNuevoTurnoDB,
  dtoToTurnoActualizable,
  calcularHorasTotales,
  canEditTurno,
  canDeleteTurno,
  formatearFecha,
  formatearHora,
} from '../models/turno.model';

// ============================================================================
// RE-EXPORTAR DESDE SCHEMAS
// ============================================================================

export {
  // Schemas Zod
  createTurnoSchema,
  updateTurnoSchema,
  turnoIdSchema,
  getTurnosQuerySchema,
  getTurnosByEmpleadoQuerySchema,

  // Types inferidos de schemas
  type CreateTurnoInput,
  type UpdateTurnoInput,
  type TurnoIdInput,
  type GetTurnosQueryInput,
  type GetTurnosByEmpleadoQueryInput,
} from '../schemas/turno.schema';
