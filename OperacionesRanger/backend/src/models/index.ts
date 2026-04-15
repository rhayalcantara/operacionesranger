/**
 * Index de Modelos
 * Sistema de Gestión de Turnos - OperacionesRanger
 *
 * Exportación centralizada de todos los modelos del sistema.
 * Facilita las importaciones desde otros módulos.
 *
 * @module models
 */

// ============================================================================
// AUTENTICACIÓN Y USUARIOS
// ============================================================================

export * from './auth.model';

// ============================================================================
// CATÁLOGOS MAESTROS
// ============================================================================

// Exportar tipos e interfaces principales sin conflictos de funciones helper
export type {
  Cliente,
  ClienteConUbicaciones,
  CreateClienteDTO,
  UpdateClienteDTO
} from './cliente.model';

export type {
  Ubicacion,
  UbicacionConRelaciones,
  CreateUbicacionDTO,
  UpdateUbicacionDTO
} from './ubicacion.model';

export type {
  Puesto,
  PuestoConRelaciones,
  CreatePuestoDTO,
  UpdatePuestoDTO
} from './puesto.model';

export * from './feriado.model';
export * from './config-turnos.model';

// ============================================================================
// GESTIÓN DE TURNOS
// ============================================================================

export * from './turno.model';

// ============================================================================
// INTEGRACIÓN RRHH
// ============================================================================

export * from './guardian.model';
