/**
 * Middleware de Autorización por Roles
 *
 * Verifica que el usuario autenticado tenga uno de los roles permitidos
 * para acceder a un recurso. Debe usarse DESPUÉS de authMiddleware.
 *
 * Uso:
 * ```typescript
 * import { authMiddleware } from './middlewares/auth.middleware';
 * import { requireRole } from './middlewares/role.middleware';
 *
 * // Solo ADMIN puede acceder
 * router.delete('/usuarios/:id', authMiddleware, requireRole('ADMIN'), deleteUsuario);
 *
 * // ADMIN o SUPERVISOR pueden acceder
 * router.post('/turnos', authMiddleware, requireRole('ADMIN', 'SUPERVISOR'), createTurno);
 * ```
 *
 * @module middlewares/role.middleware
 */

import { Request, Response, NextFunction, RequestHandler } from 'express';
import { UserRole } from '../models/auth.model';

/**
 * Factory function para crear middleware de autorización por roles
 *
 * Genera un middleware de Express que verifica si el usuario autenticado
 * tiene uno de los roles especificados.
 *
 * **Prerequisito**: Este middleware DEBE usarse DESPUÉS de authMiddleware,
 * ya que depende de `req.user` para verificar el rol del usuario.
 *
 * **Flujo**:
 * 1. Verifica que req.user existe (usuario autenticado)
 * 2. Verifica que req.user.rol está en la lista de roles permitidos
 * 3. Si tiene permiso: llama next()
 * 4. Si no tiene permiso: responde 403 Forbidden
 *
 * **Errores**:
 * - 401: Usuario no autenticado (req.user no existe) - failsafe
 * - 403: Usuario autenticado pero sin el rol requerido
 *
 * @param roles - Lista de roles permitidos (al menos uno)
 * @returns Middleware de Express que verifica roles
 *
 * @example
 * ```typescript
 * // Solo administradores
 * router.get(
 *   '/usuarios',
 *   authMiddleware,
 *   requireRole('ADMIN'),
 *   getUsuarios
 * );
 * ```
 *
 * @example
 * ```typescript
 * // Administradores y supervisores
 * router.post(
 *   '/turnos',
 *   authMiddleware,
 *   requireRole('ADMIN', 'SUPERVISOR'),
 *   createTurno
 * );
 * ```
 *
 * @example
 * ```typescript
 * // Todos los usuarios autenticados (cualquier rol)
 * router.get(
 *   '/reportes',
 *   authMiddleware,
 *   requireRole('ADMIN', 'SUPERVISOR', 'CONSULTA'),
 *   getReportes
 * );
 * ```
 *
 * @example
 * ```typescript
 * // Usar en grupo de rutas
 * const adminRouter = express.Router();
 * adminRouter.use(authMiddleware);
 * adminRouter.use(requireRole('ADMIN'));
 * adminRouter.get('/usuarios', getUsuarios);
 * adminRouter.post('/usuarios', createUsuario);
 * adminRouter.delete('/usuarios/:id', deleteUsuario);
 * ```
 */
export function requireRole(...roles: (UserRole | keyof typeof UserRole)[]): RequestHandler {
  // Validar que se proporcionen roles
  if (roles.length === 0) {
    throw new Error(
      'requireRole: Debe especificar al menos un rol permitido'
    );
  }

  // Normalizar roles (convertir strings a UserRole enum)
  const normalizedRoles = roles.map(role => {
    if (typeof role === 'string') {
      return UserRole[role as keyof typeof UserRole];
    }
    return role;
  });

  // Validar que todos los roles sean válidos
  const validRoles = Object.values(UserRole);
  for (const role of normalizedRoles) {
    if (!validRoles.includes(role)) {
      throw new Error(
        `requireRole: Rol inválido "${role}". Roles válidos: ${validRoles.join(', ')}`
      );
    }
  }

  // Retornar middleware
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      // 1. Verificar que req.user existe (failsafe)
      if (!req.user) {
        console.debug(
          'requireRole: req.user no existe. authMiddleware debe ejecutarse primero.'
        );
        res.status(401).json({
          error: 'No autorizado',
          message: 'Usuario no autenticado',
        });
        return;
      }

      // 2. Verificar que el rol del usuario está en la lista de roles permitidos
      const userRole = req.user.rol;

      if (!normalizedRoles.includes(userRole)) {
        // Usuario autenticado pero sin el rol requerido
        console.debug(
          `requireRole: Acceso denegado. Usuario: ${req.user.username}, Rol: ${userRole}, Roles requeridos: [${normalizedRoles.join(', ')}]`
        );

        res.status(403).json({
          error: 'Acceso denegado',
          message: `Acceso denegado. Rol requerido: ${normalizedRoles.join(' o ')}`,
        });
        return;
      }

      // 3. Usuario tiene el rol requerido: continuar
      console.debug(
        `requireRole: Acceso permitido. Usuario: ${req.user.username}, Rol: ${userRole}`
      );
      next();
    } catch (error) {
      // Error inesperado
      console.error('requireRole: Error inesperado', error);
      res.status(500).json({
        error: 'Error interno',
        message: 'Error al verificar permisos',
      });
    }
  };
}

/**
 * Middleware de autorización por permisos granulares (para uso futuro)
 *
 * Similar a requireRole, pero verifica permisos específicos en lugar de roles.
 * Útil cuando se necesita control de acceso más granular.
 *
 * **Nota**: Actualmente el sistema usa roles simples (ADMIN, SUPERVISOR, CONSULTA).
 * Esta función está preparada para expansión futura si se requiere un sistema
 * de permisos más complejo.
 *
 * @param permissions - Lista de permisos requeridos
 * @returns Middleware de Express que verifica permisos
 *
 * @example
 * ```typescript
 * // Ejemplo de uso futuro (requiere implementar sistema de permisos)
 * router.delete(
 *   '/turnos/:id',
 *   authMiddleware,
 *   requirePermission('TURNOS_ELIMINAR'),
 *   deleteTurno
 * );
 * ```
 */
export function requirePermission(...permissions: string[]): RequestHandler {
  // Placeholder para implementación futura
  // Por ahora, usar requireRole para control de acceso basado en roles

  if (permissions.length === 0) {
    throw new Error(
      'requirePermission: Debe especificar al menos un permiso'
    );
  }

  return (req: Request, res: Response, next: NextFunction): void => {
    // Verificar usuario autenticado
    if (!req.user) {
      res.status(401).json({
        error: 'No autorizado',
        message: 'Usuario no autenticado',
      });
      return;
    }

    // TODO: Implementar verificación de permisos granulares
    // Por ahora, solo permitir a ADMIN
    if (req.user.rol !== UserRole.ADMIN) {
      res.status(403).json({
        error: 'Acceso denegado',
        message: 'Permisos insuficientes',
      });
      return;
    }

    next();
  };
}

/**
 * Helper: Verifica si un usuario tiene un rol específico
 *
 * Función utilitaria para verificar roles en controllers o services.
 * No es un middleware, sino una función helper.
 *
 * @param req - Request de Express (debe tener req.user)
 * @param role - Rol a verificar
 * @returns true si el usuario tiene el rol, false en caso contrario
 *
 * @example
 * ```typescript
 * function getTurnos(req: Request, res: Response) {
 *   if (hasRole(req, UserRole.ADMIN)) {
 *     // Mostrar todos los turnos (incluyendo eliminados)
 *     return res.json({ turnos: getAllTurnosIncludingDeleted() });
 *   } else {
 *     // Mostrar solo turnos activos
 *     return res.json({ turnos: getActiveTurnos() });
 *   }
 * }
 * ```
 */
export function hasRole(req: Request, role: UserRole): boolean {
  return req.user?.rol === role;
}

/**
 * Helper: Verifica si un usuario tiene al menos uno de los roles especificados
 *
 * @param req - Request de Express (debe tener req.user)
 * @param roles - Lista de roles a verificar
 * @returns true si el usuario tiene al menos uno de los roles, false en caso contrario
 *
 * @example
 * ```typescript
 * function createTurno(req: Request, res: Response) {
 *   if (!hasAnyRole(req, [UserRole.ADMIN, UserRole.SUPERVISOR])) {
 *     return res.status(403).json({ error: 'Acceso denegado' });
 *   }
 *   // ... continuar con lógica de creación
 * }
 * ```
 */
export function hasAnyRole(req: Request, roles: UserRole[]): boolean {
  if (!req.user) return false;
  return roles.includes(req.user.rol);
}

/**
 * Helper: Verifica si el usuario autenticado es administrador
 *
 * Shortcut para verificar si el usuario es ADMIN.
 *
 * @param req - Request de Express (debe tener req.user)
 * @returns true si el usuario es ADMIN, false en caso contrario
 *
 * @example
 * ```typescript
 * function deleteUsuario(req: Request, res: Response) {
 *   if (!isAdmin(req)) {
 *     return res.status(403).json({ error: 'Solo administradores' });
 *   }
 *   // ... continuar con lógica de eliminación
 * }
 * ```
 */
export function isAdmin(req: Request): boolean {
  return req.user?.rol === UserRole.ADMIN;
}
