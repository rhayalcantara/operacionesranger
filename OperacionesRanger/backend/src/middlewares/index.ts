/**
 * Barrel Export para Middlewares
 *
 * Exporta todos los middlewares del sistema para facilitar las importaciones.
 *
 * Uso:
 * ```typescript
 * import { authMiddleware, requireRole } from './middlewares';
 * ```
 *
 * En lugar de:
 * ```typescript
 * import { authMiddleware } from './middlewares/auth.middleware';
 * import { requireRole } from './middlewares/role.middleware';
 * ```
 */

// Middleware de autenticación
export {
  authMiddleware,
  optionalAuthMiddleware,
} from './auth.middleware';

// Middleware de autorización por roles
export {
  requireRole,
  requirePermission,
  hasRole,
  hasAnyRole,
  isAdmin,
} from './role.middleware';

// Middleware de validación de requests
export {
  validateRequest,
  validateBody,
  validateQuery,
  validateParams,
  formatZodErrors,
} from './validation.middleware';

// Middleware de paginación
export {
  paginationMiddleware,
  calculateTotalPages,
  isPageValid,
  PAGINATION_CONFIG,
} from './pagination.middleware';

// Middleware de manejo global de errores
export { errorHandlerMiddleware } from './error-handler.middleware';
