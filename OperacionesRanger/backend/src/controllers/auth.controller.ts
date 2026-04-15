/**
 * Controladores de Autenticación
 * Sistema de Gestión de Turnos - OperacionesRanger
 *
 * Controllers HTTP para endpoints de autenticación:
 * - POST /api/auth/login - Iniciar sesión
 * - POST /api/auth/refresh - Renovar access token
 * - POST /api/auth/logout - Cerrar sesión
 * - POST /api/auth/change-password - Cambiar contraseña
 *
 * Responsabilidades:
 * - Validar inputs con schemas Zod
 * - Extraer datos del request (IP, User-Agent)
 * - Llamar a servicios de autenticación
 * - Formatear respuestas HTTP
 * - Manejar errores y pasar al middleware de errores
 */

import { Request, Response, NextFunction } from 'express';
import * as authService from '../services/auth.service';
import {
  loginSchema,
  refreshTokenSchema,
  logoutSchema,
  changePasswordSchema,
  formatZodErrors
} from '../schemas/auth.schema';
import { JWTPayload } from '../models/auth.model';

// ============================================================================
// TIPOS EXTENDIDOS DE REQUEST
// ============================================================================

/**
 * Request extendido con información de usuario autenticado
 * (agregada por middleware authMiddleware de T2.04)
 */
export interface AuthenticatedRequest extends Request {
  user?: JWTPayload;
}

// ============================================================================
// FUNCIONES DE UTILIDAD
// ============================================================================

/**
 * Extrae la IP del cliente del request
 *
 * Prioriza headers de proxy (X-Forwarded-For) sobre req.ip
 *
 * @param req - Request de Express
 * @returns IP del cliente
 */
function getClientIp(req: Request): string | undefined {
  // Intentar obtener de header X-Forwarded-For (si está detrás de proxy)
  const forwardedFor = req.headers['x-forwarded-for'];

  if (forwardedFor) {
    // X-Forwarded-For puede contener múltiples IPs separadas por coma
    // La primera es la IP del cliente original
    if (Array.isArray(forwardedFor)) {
      return forwardedFor[0];
    }
    return forwardedFor.split(',')[0].trim();
  }

  // Fallback a req.ip de Express
  return req.ip;
}

/**
 * Extrae el User-Agent del request
 *
 * @param req - Request de Express
 * @returns User-Agent string
 */
function getUserAgent(req: Request): string | undefined {
  return req.headers['user-agent'];
}

// ============================================================================
// CONTROLLERS
// ============================================================================

/**
 * POST /api/auth/login
 * Iniciar sesión con username y password
 *
 * Body: { username: string, password: string }
 * Response: { accessToken, refreshToken, user }
 * Errores: 400 (validación), 401 (credenciales inválidas), 403 (usuario bloqueado)
 */
export async function loginController(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    // 1. Validar body con schema Zod
    const result = loginSchema.safeParse(req.body);

    if (!result.success) {
      res.status(400).json({
        error: 'Validación fallida',
        errors: formatZodErrors(result.error)
      });
      return;
    }

    const { username, password } = result.data;

    // 2. Extraer IP y User-Agent
    const ip = getClientIp(req);
    const userAgent = getUserAgent(req);

    // 3. Llamar a servicio de login
    const loginResponse = await authService.login(username, password, ip, userAgent);

    // 4. Responder con tokens y usuario
    res.status(200).json(loginResponse);
  } catch (error) {
    // Manejar errores específicos de autenticación
    if (error instanceof Error) {
      const errorMessage = error.message.toLowerCase();

      // Usuario bloqueado temporalmente
      if (errorMessage.includes('bloqueado')) {
        res.status(403).json({
          error: 'Usuario bloqueado',
          message: error.message
        });
        return;
      }

      // Credenciales inválidas o usuario inactivo
      if (
        errorMessage.includes('credenciales inválidas') ||
        errorMessage.includes('usuario inactivo')
      ) {
        res.status(401).json({
          error: 'Autenticación fallida',
          message: 'Usuario o contraseña incorrectos'
        });
        return;
      }
    }

    // Otros errores - pasar al middleware de manejo de errores
    next(error);
  }
}

/**
 * POST /api/auth/refresh
 * Renovar access token usando refresh token
 *
 * Body: { refreshToken: string }
 * Response: { accessToken: string }
 * Errores: 400 (validación), 401 (token inválido/expirado/revocado)
 */
export async function refreshTokenController(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    // 1. Validar body con schema Zod
    const result = refreshTokenSchema.safeParse(req.body);

    if (!result.success) {
      res.status(400).json({
        error: 'Validación fallida',
        errors: formatZodErrors(result.error)
      });
      return;
    }

    const { refreshToken } = result.data;

    // 2. Llamar a servicio de refresh
    const response = await authService.refreshAccessToken(refreshToken);

    // 3. Responder con nuevo access token
    res.status(200).json(response);
  } catch (error) {
    // Refresh token inválido, expirado, revocado, o usuario inactivo
    if (error instanceof Error) {
      res.status(401).json({
        error: 'Token inválido',
        message: error.message
      });
      return;
    }

    // Otros errores
    next(error);
  }
}

/**
 * POST /api/auth/logout
 * Cerrar sesión revocando refresh token
 *
 * Headers: Authorization: Bearer <accessToken>
 * Body: { refreshToken: string }
 * Response: { message: string }
 * Errores: 400 (validación), 401 (no autenticado)
 *
 * NOTA: Requiere middleware authMiddleware (de T2.04) que agregue req.user
 *       Si middleware no está disponible, este endpoint NO funcionará.
 *
 * TODO: Integrar authMiddleware cuando T2.04 esté completo
 */
export async function logoutController(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    // 0. Verificar que usuario esté autenticado (middleware authMiddleware debe haber ejecutado)
    if (!req.user) {
      res.status(401).json({
        error: 'No autenticado',
        message: 'Este endpoint requiere autenticación. Proporcione un access token válido en el header Authorization.'
      });
      return;
    }

    // 1. Validar body con schema Zod
    const result = logoutSchema.safeParse(req.body);

    if (!result.success) {
      res.status(400).json({
        error: 'Validación fallida',
        errors: formatZodErrors(result.error)
      });
      return;
    }

    const { refreshToken } = result.data;

    // 2. Extraer userId de req.user (agregado por authMiddleware)
    const userId = req.user.sub;

    // 3. Llamar a servicio de logout
    await authService.logout(refreshToken, userId);

    // 4. Responder con mensaje de éxito
    res.status(200).json({
      message: 'Logout exitoso'
    });
  } catch (error) {
    // Refresh token no encontrado o error de BD
    if (error instanceof Error) {
      res.status(400).json({
        error: 'Error al cerrar sesión',
        message: error.message
      });
      return;
    }

    // Otros errores
    next(error);
  }
}

/**
 * POST /api/auth/change-password
 * Cambiar contraseña del usuario autenticado
 *
 * Headers: Authorization: Bearer <accessToken>
 * Body: { currentPassword: string, newPassword: string }
 * Response: { message: string }
 * Errores: 400 (validación), 401 (password actual incorrecta o no autenticado)
 *
 * NOTA: Requiere middleware authMiddleware (de T2.04) que agregue req.user
 *
 * TODO: Integrar authMiddleware cuando T2.04 esté completo
 */
export async function changePasswordController(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    // 0. Verificar que usuario esté autenticado
    if (!req.user) {
      res.status(401).json({
        error: 'No autenticado',
        message: 'Este endpoint requiere autenticación. Proporcione un access token válido en el header Authorization.'
      });
      return;
    }

    // 1. Validar body con schema Zod
    const result = changePasswordSchema.safeParse(req.body);

    if (!result.success) {
      res.status(400).json({
        error: 'Validación fallida',
        errors: formatZodErrors(result.error)
      });
      return;
    }

    const { currentPassword, newPassword } = result.data;

    // 2. Extraer userId de req.user
    const userId = req.user.sub;

    // 3. Llamar a servicio de cambio de password
    await authService.changePassword(userId, currentPassword, newPassword);

    // 4. Responder con mensaje de éxito
    res.status(200).json({
      message: 'Contraseña actualizada exitosamente'
    });
  } catch (error) {
    // Password actual incorrecta o usuario no encontrado
    if (error instanceof Error) {
      const errorMessage = error.message.toLowerCase();

      if (errorMessage.includes('incorrecta')) {
        res.status(401).json({
          error: 'Password actual incorrecta',
          message: error.message
        });
        return;
      }

      if (errorMessage.includes('no encontrado')) {
        res.status(404).json({
          error: 'Usuario no encontrado',
          message: error.message
        });
        return;
      }
    }

    // Otros errores
    next(error);
  }
}
