/**
 * Middleware de Manejo Global de Errores
 * Sistema de Gestión de Turnos - OperacionesRanger
 *
 * Error handler global para Express que captura todos los errores
 * no manejados y los formatea de forma consistente.
 *
 * Características:
 * - Catch-all para errores no manejados
 * - Formateo consistente de respuestas de error
 * - Diferenciación por tipo de error (Zod, Custom, Database, Generic)
 * - Logging con contexto (método, ruta, timestamp)
 * - Stack traces ocultos en producción
 *
 * IMPORTANTE: Este middleware debe ser el ÚLTIMO en app.ts
 *
 * @module middlewares/error-handler.middleware
 */

import { Request, Response, NextFunction, ErrorRequestHandler } from 'express';
import { ZodError } from 'zod';
import { formatZodErrors } from './validation.middleware';
import logger from '@/config/logger';

// ============================================================================
// TIPOS
// ============================================================================

/**
 * Interface para errores con código de estado HTTP
 */
export interface ErrorWithStatus extends Error {
  statusCode?: number;
  details?: any;
}

/**
 * Formato estándar de respuesta de error
 */
export interface ErrorResponse {
  error: string;
  message: string;
  details?: any;
  stack?: string;
  timestamp: string;
  path: string;
  method: string;
}

// ============================================================================
// HELPERS: DETECCIÓN DE TIPO DE ERROR
// ============================================================================

/**
 * Verifica si un error es de tipo ZodError
 *
 * @param error - Error a verificar
 * @returns true si es ZodError
 */
function isZodError(error: any): error is ZodError {
  return error instanceof ZodError || error.name === 'ZodError';
}

/**
 * Verifica si un error tiene statusCode personalizado
 *
 * @param error - Error a verificar
 * @returns true si tiene statusCode
 */
function hasStatusCode(error: any): error is ErrorWithStatus {
  return typeof error.statusCode === 'number';
}

/**
 * Verifica si un error es de base de datos MySQL
 *
 * @param error - Error a verificar
 * @returns true si es error de MySQL
 */
function isDatabaseError(error: any): boolean {
  return (
    error.code?.startsWith('ER_') ||
    error.code === 'ECONNREFUSED' ||
    error.sqlMessage !== undefined ||
    error.errno !== undefined
  );
}

// ============================================================================
// HELPERS: FORMATEO DE ERRORES
// ============================================================================

/**
 * Formatea error de Zod a respuesta estándar
 *
 * @param error - ZodError
 * @returns Respuesta formateada (400 Bad Request)
 */
function formatZodErrorResponse(error: ZodError): {
  statusCode: number;
  response: Partial<ErrorResponse>;
} {
  return {
    statusCode: 400,
    response: {
      error: 'Validation Error',
      message: 'Los datos de entrada no cumplen con el formato esperado',
      details: formatZodErrors(error)
    }
  };
}

/**
 * Formatea error de base de datos MySQL a respuesta estándar
 *
 * Detecta códigos de error comunes y los transforma en mensajes amigables
 *
 * @param error - Error de MySQL
 * @returns Respuesta formateada
 */
function formatDatabaseErrorResponse(error: any): {
  statusCode: number;
  response: Partial<ErrorResponse>;
} {
  const code = error.code || '';
  let statusCode = 500;
  let message = 'Error de base de datos';

  // Detectar errores comunes
  if (code === 'ER_DUP_ENTRY') {
    statusCode = 409;
    message = 'El registro ya existe (duplicado)';
  } else if (code === 'ER_NO_REFERENCED_ROW' || code === 'ER_NO_REFERENCED_ROW_2') {
    statusCode = 404;
    message = 'Referencia no encontrada';
  } else if (code === 'ER_ROW_IS_REFERENCED' || code === 'ER_ROW_IS_REFERENCED_2') {
    statusCode = 409;
    message = 'No se puede eliminar: registro tiene dependencias';
  } else if (code === 'ER_BAD_NULL_ERROR') {
    statusCode = 400;
    message = 'Campo requerido faltante';
  } else if (code === 'ER_DATA_TOO_LONG') {
    statusCode = 400;
    message = 'Datos exceden longitud permitida';
  } else if (code === 'ECONNREFUSED') {
    statusCode = 503;
    message = 'No se pudo conectar a la base de datos';
  }

  return {
    statusCode,
    response: {
      error: 'Database Error',
      message,
      details: process.env.NODE_ENV === 'development' ? {
        code: error.code,
        errno: error.errno,
        sqlMessage: error.sqlMessage
      } : undefined
    }
  };
}

/**
 * Formatea error genérico a respuesta estándar
 *
 * @param error - Error genérico
 * @returns Respuesta formateada (500 Internal Server Error)
 */
function formatGenericErrorResponse(error: Error): {
  statusCode: number;
  response: Partial<ErrorResponse>;
} {
  return {
    statusCode: 500,
    response: {
      error: 'Internal Server Error',
      message: error.message || 'Ha ocurrido un error inesperado'
    }
  };
}

// ============================================================================
// HELPERS: LOGGING
// ============================================================================

/**
 * Loguea error con contexto usando Winston logger
 *
 * @param error - Error a loguear
 * @param req - Request de Express
 */
function logError(error: any, req: Request): void {
  const method = req.method;
  const url = req.originalUrl || req.url;
  const ip = req.ip || req.socket.remoteAddress;

  // Log with Winston logger
  logger.error('Request error', {
    method,
    url,
    ip,
    error: error.message,
    name: error.name,
    code: error.code,
    statusCode: error.statusCode,
    // Stack trace only in development
    stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
  });
}

// ============================================================================
// MIDDLEWARE PRINCIPAL
// ============================================================================

/**
 * Error Handler Middleware
 *
 * Middleware global de manejo de errores para Express.
 * Captura todos los errores no manejados en la aplicación y
 * los formatea de forma consistente.
 *
 * **Tipos de errores manejados**:
 * - ZodError → 400 Bad Request
 * - Errores con statusCode → Usa statusCode personalizado
 * - Errores de MySQL → Detecta código y responde apropiadamente
 * - Errores genéricos → 500 Internal Server Error
 *
 * **Respuesta estándar**:
 * ```json
 * {
 *   "error": "Error type",
 *   "message": "Mensaje descriptivo",
 *   "details": {...},  // Opcional
 *   "stack": "...",    // Solo en development
 *   "timestamp": "2026-01-18T10:30:00.000Z",
 *   "path": "/api/clientes",
 *   "method": "POST"
 * }
 * ```
 *
 * **Configuración**:
 * - Stack traces solo visibles si NODE_ENV=development
 * - Detalles de errores SQL solo en development
 *
 * **Uso en app.ts**:
 * ```typescript
 * import { errorHandlerMiddleware } from './middlewares/error-handler.middleware';
 *
 * // ... definir todas las rutas ...
 *
 * // IMPORTANTE: Error handler debe ser el ÚLTIMO middleware
 * app.use(errorHandlerMiddleware);
 * ```
 *
 * @param error - Error capturado
 * @param req - Request de Express
 * @param res - Response de Express
 * @param next - Next function (requerido por Express, no usado)
 */
export const errorHandlerMiddleware: ErrorRequestHandler = (
  error: any,
  req: Request,
  res: Response,
  _next: NextFunction
): void => {
  // 1. Loguear error con contexto
  logError(error, req);

  // 2. Determinar tipo de error y formatear respuesta
  let statusCode: number;
  let responseBody: Partial<ErrorResponse>;

  if (isZodError(error)) {
    // Error de validación Zod
    const formatted = formatZodErrorResponse(error);
    statusCode = formatted.statusCode;
    responseBody = formatted.response;
  } else if (hasStatusCode(error)) {
    // Error con statusCode personalizado (NotFoundError, ConflictError, etc.)
    statusCode = error.statusCode!; // Non-null assertion porque hasStatusCode ya lo validó
    responseBody = {
      error: error.name || 'Error',
      message: error.message,
      details: error.details
    };
  } else if (isDatabaseError(error)) {
    // Error de base de datos MySQL
    const formatted = formatDatabaseErrorResponse(error);
    statusCode = formatted.statusCode;
    responseBody = formatted.response;
  } else {
    // Error genérico
    const formatted = formatGenericErrorResponse(error);
    statusCode = formatted.statusCode;
    responseBody = formatted.response;
  }

  // 3. Agregar metadatos de contexto
  const fullResponse: ErrorResponse = {
    error: responseBody.error || 'Error',
    message: responseBody.message || 'Ha ocurrido un error',
    details: responseBody.details,
    timestamp: new Date().toISOString(),
    path: req.originalUrl || req.url,
    method: req.method,
    // Stack trace solo en development
    ...(process.env.NODE_ENV === 'development' && error.stack
      ? { stack: error.stack }
      : {})
  };

  // 4. Enviar respuesta
  res.status(statusCode).json(fullResponse);
};

// ============================================================================
// EXPORTACIONES
// ============================================================================

export default errorHandlerMiddleware;
