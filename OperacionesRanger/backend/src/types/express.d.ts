/**
 * Extensiones de tipos de Express
 *
 * Este archivo extiende la interfaz Request de Express para incluir
 * propiedades personalizadas usadas en la autenticación y autorización.
 *
 * Uso de Declaration Merging de TypeScript para agregar propiedades
 * a la interfaz Request sin romper la definición original.
 */

import { JWTPayload } from '../models/auth.model';

/**
 * Declaración global que extiende el namespace Express
 */
declare global {
  namespace Express {
    /**
     * Extensión de la interfaz Request de Express
     *
     * Agrega la propiedad `user` que contiene la información del usuario
     * autenticado extraída del JWT.
     *
     * @property user - Payload del JWT decodificado, o undefined si no está autenticado
     *
     * @example
     * ```typescript
     * // En un middleware o controller
     * app.get('/protected', authMiddleware, (req: Request, res: Response) => {
     *   if (req.user) {
     *     console.log(`Usuario autenticado: ${req.user.username}`);
     *     console.log(`Rol: ${req.user.rol}`);
     *   }
     * });
     * ```
     */
    interface Request {
      /**
       * Información del usuario autenticado
       *
       * Populated by authMiddleware after successful token verification.
       * Contains user ID, username, role, and token metadata.
       *
       * - `undefined` if user is not authenticated or token is invalid
       * - `JWTPayload` if token was successfully verified
       */
      user?: JWTPayload;

      /**
       * Información de paginación parseada
       *
       * Populated by paginationMiddleware from query parameters.
       * Contains validated pagination values and calculated offset.
       *
       * - `undefined` if paginationMiddleware is not applied
       * - `PaginationParams` if middleware was executed
       */
      pagination?: {
        /**
         * Número de página actual (1-indexed)
         * @default 1
         */
        page: number;

        /**
         * Cantidad de registros por página
         * @default 10
         * @max 100
         */
        pageSize: number;

        /**
         * Offset calculado para consultas SQL
         * @formula (page - 1) * pageSize
         */
        offset: number;
      };
    }
  }
}

/**
 * Export vacío para convertir este archivo en un módulo
 *
 * TypeScript requiere que los archivos de declaración tengan al menos
 * una declaración export/import para funcionar correctamente.
 */
export {};
