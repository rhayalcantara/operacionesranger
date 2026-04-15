/**
 * Middleware de Validación de Requests
 * Sistema de Gestión de Turnos - OperacionesRanger
 *
 * Middleware genérico para validar requests usando schemas Zod.
 * Simplifica la validación de body, query y params en controllers.
 *
 * Características:
 * - Validación automática con Zod
 * - Formateo consistente de errores de validación
 * - Datos validados disponibles en req.validatedData
 * - Respuesta 400 automática si validación falla
 *
 * @module middlewares/validation.middleware
 */

import { Request, Response, NextFunction, RequestHandler } from 'express';
import { z, ZodError } from 'zod';

// ============================================================================
// EXTENSIÓN DE TIPOS EXPRESS
// ============================================================================

declare global {
  namespace Express {
    interface Request {
      /**
       * Datos validados por el middleware de validación
       * Disponibles después de pasar validateRequest()
       */
      validatedData?: any;
    }
  }
}

// ============================================================================
// TIPOS
// ============================================================================

/**
 * Parte del request a validar
 */
export type ValidationSource = 'body' | 'query' | 'params';

// ============================================================================
// HELPER: FORMATEO DE ERRORES ZOD
// ============================================================================

/**
 * Formatea errores de Zod a formato amigable para API
 *
 * Convierte los issues de ZodError en un array de objetos
 * con campo y mensaje.
 *
 * @param error - ZodError de validación
 * @returns Array de errores formateados
 *
 * @example
 * ```typescript
 * const formatted = formatZodErrors(error);
 * // [
 * //   { field: 'email', message: 'Email inválido' },
 * //   { field: 'password', message: 'Mínimo 8 caracteres' }
 * // ]
 * ```
 */
export function formatZodErrors(error: ZodError): Array<{ field: string; message: string }> {
  return error.issues.map((issue) => ({
    field: issue.path.join('.') || 'unknown',
    message: issue.message
  }));
}

// ============================================================================
// MIDDLEWARE PRINCIPAL
// ============================================================================

/**
 * Crea un middleware de validación para requests
 *
 * Valida automáticamente la parte especificada del request (body, query, params)
 * usando un schema Zod. Si la validación falla, responde 400 con errores
 * formateados. Si pasa, agrega los datos validados a req.validatedData.
 *
 * **Flujo**:
 * 1. Extrae datos de req[source] (body, query, o params)
 * 2. Valida con schema.safeParse()
 * 3. Si falla: responde 400 con detalles de error
 * 4. Si pasa: agrega datos a req.validatedData y llama next()
 *
 * **Ventajas**:
 * - Elimina código de validación repetitivo en controllers
 * - Formateo consistente de errores
 * - Datos ya transformados por Zod (trim, uppercase, etc.)
 * - Type-safe si se usa con TypeScript
 *
 * @param schema - Schema Zod para validación
 * @param source - Parte del request a validar (default: 'body')
 * @returns Express middleware function
 *
 * @example
 * ```typescript
 * // En routes:
 * import { validateRequest } from '../middlewares/validation.middleware';
 * import { createClienteSchema } from '../schemas/cliente.schema';
 *
 * router.post(
 *   '/clientes',
 *   validateRequest(createClienteSchema, 'body'),
 *   clientesController.createCliente
 * );
 *
 * // En controller:
 * export async function createCliente(req: Request, res: Response) {
 *   const clienteData = req.validatedData; // Datos ya validados
 *   // ...
 * }
 * ```
 *
 * @example
 * ```typescript
 * // Validar query params:
 * router.get(
 *   '/clientes',
 *   validateRequest(paginationQuerySchema, 'query'),
 *   clientesController.getClientes
 * );
 * ```
 *
 * @example
 * ```typescript
 * // Validar params:
 * router.get(
 *   '/clientes/:id',
 *   validateRequest(clienteIdParamSchema, 'params'),
 *   clientesController.getClienteById
 * );
 * ```
 */
export function validateRequest(
  schema: z.ZodSchema,
  source: ValidationSource = 'body'
): RequestHandler {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      // 1. Extraer datos de la fuente especificada
      const dataToValidate = req[source];

      // 2. Validar con Zod (safeParse no lanza error)
      const validationResult = schema.safeParse(dataToValidate);

      // 3. Si validación falla, responder 400
      if (!validationResult.success) {
        res.status(400).json({
          error: 'Datos de entrada inválidos',
          details: formatZodErrors(validationResult.error)
        });
        return;
      }

      // 4. Si validación pasa, agregar datos validados a req y continuar
      req.validatedData = validationResult.data;
      next();
    } catch (error) {
      // Error inesperado durante validación
      console.error('[VALIDATION] Error inesperado en validateRequest:', error);
      res.status(500).json({
        error: 'Error interno del servidor',
        message: 'Error al validar datos de entrada'
      });
    }
  };
}

// ============================================================================
// VARIANTES ESPECIALIZADAS (OPCIONAL)
// ============================================================================

/**
 * Middleware de validación específico para body
 *
 * Alias de validateRequest(schema, 'body') para mayor claridad
 *
 * @param schema - Schema Zod
 * @returns Express middleware
 *
 * @example
 * ```typescript
 * router.post('/clientes', validateBody(createClienteSchema), controller);
 * ```
 */
export function validateBody(schema: z.ZodSchema): RequestHandler {
  return validateRequest(schema, 'body');
}

/**
 * Middleware de validación específico para query
 *
 * Alias de validateRequest(schema, 'query') para mayor claridad
 *
 * @param schema - Schema Zod
 * @returns Express middleware
 *
 * @example
 * ```typescript
 * router.get('/clientes', validateQuery(paginationSchema), controller);
 * ```
 */
export function validateQuery(schema: z.ZodSchema): RequestHandler {
  return validateRequest(schema, 'query');
}

/**
 * Middleware de validación específico para params
 *
 * Alias de validateRequest(schema, 'params') para mayor claridad
 *
 * @param schema - Schema Zod
 * @returns Express middleware
 *
 * @example
 * ```typescript
 * router.get('/clientes/:id', validateParams(idParamSchema), controller);
 * ```
 */
export function validateParams(schema: z.ZodSchema): RequestHandler {
  return validateRequest(schema, 'params');
}

// ============================================================================
// EXPORTACIONES
// ============================================================================

/**
 * Exportar todas las funciones de validación
 */
export default {
  validateRequest,
  validateBody,
  validateQuery,
  validateParams,
  formatZodErrors
};
