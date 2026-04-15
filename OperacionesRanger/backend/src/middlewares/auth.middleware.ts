/**
 * Middleware de Autenticación
 *
 * Verifica la presencia y validez del token JWT en el header Authorization
 * de las peticiones HTTP. Si el token es válido, agrega la información del
 * usuario a `req.user` para su uso en controllers y otros middlewares.
 *
 * Uso:
 * ```typescript
 * import { authMiddleware } from './middlewares/auth.middleware';
 *
 * // Proteger una ruta
 * router.get('/protected', authMiddleware, controller);
 * ```
 *
 * @module middlewares/auth.middleware
 */

import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken } from '../services/jwt.service';

/**
 * Middleware de Autenticación JWT
 *
 * Extrae el token JWT del header Authorization, lo verifica, y si es válido,
 * agrega el payload decodificado a req.user.
 *
 * **Header esperado**:
 * ```
 * Authorization: Bearer <token>
 * ```
 *
 * **Flujo**:
 * 1. Verifica presencia del header Authorization
 * 2. Valida formato "Bearer <token>"
 * 3. Extrae el token
 * 4. Verifica token con JWTService.verifyAccessToken()
 * 5. Si válido: agrega payload a req.user y llama next()
 * 6. Si inválido: responde 401 Unauthorized
 *
 * **Errores**:
 * - 401: Token no proporcionado, formato inválido, o token expirado/inválido
 *
 * @param req - Request de Express (modificado para incluir req.user)
 * @param res - Response de Express
 * @param next - Función para continuar al siguiente middleware
 *
 * @example
 * ```typescript
 * // Proteger ruta individual
 * router.get('/turnos', authMiddleware, getTurnos);
 *
 * // Proteger grupo de rutas
 * router.use('/api', authMiddleware);
 * router.get('/api/turnos', getTurnos);
 * router.post('/api/turnos', createTurno);
 * ```
 *
 * @example
 * ```typescript
 * // Usar información del usuario en controller
 * function getTurnos(req: Request, res: Response) {
 *   // req.user está disponible gracias a authMiddleware
 *   console.log(`Usuario: ${req.user?.username}`);
 *   console.log(`Rol: ${req.user?.rol}`);
 *   // ...
 * }
 * ```
 */
export function authMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  try {
    // 1. Verificar presencia del header Authorization
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      console.debug('authMiddleware: Header Authorization no proporcionado');
      res.status(401).json({
        error: 'No autorizado',
        message: 'Token de autenticación no proporcionado',
      });
      return;
    }

    // 2. Validar formato "Bearer <token>"
    const parts = authHeader.split(' ');

    if (parts.length !== 2 || parts[0] !== 'Bearer') {
      console.debug(
        `authMiddleware: Formato inválido del header Authorization: "${authHeader}"`
      );
      res.status(401).json({
        error: 'No autorizado',
        message: 'Formato de token inválido. Use: Bearer <token>',
      });
      return;
    }

    // 3. Extraer token
    const token = parts[1];

    if (!token || token.trim() === '') {
      console.debug('authMiddleware: Token vacío');
      res.status(401).json({
        error: 'No autorizado',
        message: 'Token vacío',
      });
      return;
    }

    // 4. Verificar token con JWTService
    const payload = verifyAccessToken(token);

    if (!payload) {
      // Token inválido o expirado
      console.debug('authMiddleware: Token inválido o expirado');
      res.status(401).json({
        error: 'No autorizado',
        message: 'Token inválido o expirado',
      });
      return;
    }

    // 5. Token válido: agregar payload a req.user
    req.user = payload;

    console.debug(
      `authMiddleware: Usuario autenticado - ID: ${payload.sub}, Username: ${payload.username}, Rol: ${payload.rol}`
    );

    // 6. Continuar al siguiente middleware
    next();
  } catch (error) {
    // Error inesperado durante la verificación
    console.error('authMiddleware: Error inesperado', error);
    res.status(500).json({
      error: 'Error interno',
      message: 'Error al verificar token de autenticación',
    });
  }
}

/**
 * Middleware opcional de autenticación
 *
 * Similar a authMiddleware, pero NO falla si no hay token.
 * Si hay token válido, lo agrega a req.user.
 * Si no hay token o es inválido, simplemente continúa sin req.user.
 *
 * Útil para rutas que tienen contenido público y privado.
 *
 * @param req - Request de Express
 * @param res - Response de Express
 * @param next - Función para continuar al siguiente middleware
 *
 * @example
 * ```typescript
 * // Ruta con contenido público pero con opciones adicionales si está autenticado
 * router.get('/reportes', optionalAuthMiddleware, (req, res) => {
 *   if (req.user) {
 *     // Usuario autenticado: mostrar reportes completos
 *     return res.json({ reportes: getAllReports() });
 *   } else {
 *     // Usuario no autenticado: mostrar solo reportes públicos
 *     return res.json({ reportes: getPublicReports() });
 *   }
 * });
 * ```
 */
export function optionalAuthMiddleware(
  req: Request,
  _res: Response,
  next: NextFunction
): void {
  const authHeader = req.headers.authorization;

  // Si no hay header, continuar sin autenticación
  if (!authHeader) {
    return next();
  }

  // Si hay header, intentar autenticar
  const parts = authHeader.split(' ');

  if (parts.length !== 2 || parts[0] !== 'Bearer') {
    // Formato inválido, continuar sin autenticación
    console.debug('optionalAuthMiddleware: Formato inválido, continuando sin auth');
    return next();
  }

  const token = parts[1];

  if (!token || token.trim() === '') {
    // Token vacío, continuar sin autenticación
    return next();
  }

  // Verificar token
  const payload = verifyAccessToken(token);

  if (payload) {
    // Token válido: agregar a req.user
    req.user = payload;
    console.debug(
      `optionalAuthMiddleware: Usuario autenticado - ${payload.username}`
    );
  }

  // Continuar (con o sin req.user)
  next();
}
