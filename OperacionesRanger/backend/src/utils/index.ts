/**
 * Barrel Export para Utilidades
 * Sistema de Gestión de Turnos - OperacionesRanger
 *
 * Exporta todas las utilidades del sistema para facilitar las importaciones.
 *
 * Uso:
 * ```typescript
 * import { buildPaginationResponse, NotFoundError } from './utils';
 * ```
 */

// Utilidades de respuesta
export {
  buildPaginationResponse,
  handleDatabaseError,
  NotFoundError,
  ConflictError,
  ValidationError,
  ForbiddenError,
  ServiceUnavailableError,
} from './response.utils';

// Tipos
export type {
  PaginatedResponse,
} from './response.utils';
