/**
 * Middleware de Paginación
 * Sistema de Gestión de Turnos - OperacionesRanger
 *
 * Middleware para parsear y validar parámetros de paginación de forma centralizada.
 * Simplifica el manejo de paginación en endpoints de listado.
 *
 * Características:
 * - Parsea page y pageSize de query params
 * - Aplica valores por defecto (page=1, pageSize=10)
 * - Valida límites (pageSize máximo: 100)
 * - Calcula offset automáticamente
 * - Agrega datos a req.pagination
 *
 * @module middlewares/pagination.middleware
 */

import { Request, Response, NextFunction, RequestHandler } from 'express';

// ============================================================================
// EXTENSIÓN DE TIPOS EXPRESS
// ============================================================================

declare global {
  namespace Express {
    interface Request {
      /**
       * Datos de paginación parseados por paginationMiddleware
       * Disponibles después de pasar por el middleware
       */
      pagination?: {
        /** Número de página actual (base 1) */
        page: number;
        /** Tamaño de página (registros por página) */
        pageSize: number;
        /** Offset para SQL (calculado: (page - 1) * pageSize) */
        offset: number;
      };
    }
  }
}

// ============================================================================
// CONSTANTES DE CONFIGURACIÓN
// ============================================================================

/**
 * Valores por defecto y límites de paginación
 */
export const PAGINATION_CONFIG = {
  /** Página por defecto si no se especifica */
  DEFAULT_PAGE: 1,
  /** Tamaño de página por defecto */
  DEFAULT_PAGE_SIZE: 10,
  /** Tamaño de página mínimo permitido */
  MIN_PAGE_SIZE: 1,
  /** Tamaño de página máximo permitido */
  MAX_PAGE_SIZE: 100
} as const;

// ============================================================================
// TIPOS
// ============================================================================

/**
 * Tipo para datos de paginación procesados
 */
export interface PaginationData {
  page: number;
  pageSize: number;
  offset: number;
}

// ============================================================================
// HELPER: PARSEAR NÚMERO
// ============================================================================

/**
 * Parsea un string a número entero positivo
 *
 * @param value - Valor a parsear (puede ser string, number, undefined)
 * @param defaultValue - Valor por defecto si parseo falla
 * @param min - Valor mínimo permitido
 * @param max - Valor máximo permitido (opcional)
 * @returns Número parseado o default
 *
 * @example
 * ```typescript
 * parsePositiveInt('10', 1, 1, 100); // 10
 * parsePositiveInt('abc', 1, 1, 100); // 1 (default)
 * parsePositiveInt('200', 10, 1, 100); // 100 (capped)
 * ```
 */
function parsePositiveInt(
  value: any,
  defaultValue: number,
  min: number,
  max?: number
): number {
  // Si es undefined o null, usar default
  if (value === undefined || value === null || value === '') {
    return defaultValue;
  }

  // Convertir a número
  const parsed = typeof value === 'string' ? parseInt(value, 10) : Number(value);

  // Si no es número válido, usar default
  if (isNaN(parsed) || !isFinite(parsed)) {
    return defaultValue;
  }

  // Aplicar mínimo
  let result = Math.max(min, parsed);

  // Aplicar máximo si existe
  if (max !== undefined) {
    result = Math.min(max, result);
  }

  return result;
}

// ============================================================================
// MIDDLEWARE PRINCIPAL
// ============================================================================

/**
 * Middleware de Paginación
 *
 * Parsea y valida parámetros de paginación de query params.
 * Agrega objeto `req.pagination` con datos procesados.
 *
 * **Query params esperados**:
 * - `page`: número de página (default: 1, min: 1)
 * - `pageSize`: tamaño de página (default: 10, min: 1, max: 100)
 *
 * **Datos agregados a req.pagination**:
 * - `page`: número de página validado
 * - `pageSize`: tamaño de página validado
 * - `offset`: offset para SQL ((page - 1) * pageSize)
 *
 * **Validaciones**:
 * - page >= 1 (si es menor, usa 1)
 * - pageSize >= 1 (si es menor, usa 1)
 * - pageSize <= 100 (si es mayor, usa 100)
 * - Valores no numéricos usan defaults
 *
 * **Uso en SQL**:
 * ```sql
 * SELECT * FROM tabla
 * LIMIT ${pageSize}
 * OFFSET ${offset}
 * ```
 *
 * @param req - Request de Express
 * @param res - Response de Express
 * @param next - Next function
 *
 * @example
 * ```typescript
 * // En routes:
 * import { paginationMiddleware } from '../middlewares/pagination.middleware';
 *
 * router.get('/clientes', paginationMiddleware, clientesController.getClientes);
 * ```
 *
 * @example
 * ```typescript
 * // En controller:
 * export async function getClientes(req: Request, res: Response) {
 *   const { page, pageSize, offset } = req.pagination!;
 *
 *   const query = `
 *     SELECT * FROM clientes
 *     LIMIT ? OFFSET ?
 *   `;
 *   const result = await db.query(query, [pageSize, offset]);
 *   // ...
 * }
 * ```
 *
 * @example
 * ```typescript
 * // Request: GET /api/clientes?page=2&pageSize=20
 * // req.pagination = { page: 2, pageSize: 20, offset: 20 }
 *
 * // Request: GET /api/clientes (sin params)
 * // req.pagination = { page: 1, pageSize: 10, offset: 0 }
 *
 * // Request: GET /api/clientes?page=abc&pageSize=999
 * // req.pagination = { page: 1, pageSize: 100, offset: 0 }
 * ```
 */
export const paginationMiddleware: RequestHandler = (
  req: Request,
  _res: Response,
  next: NextFunction
): void => {
  try {
    // 1. Extraer query params
    const { page: pageParam, pageSize: pageSizeParam } = req.query;

    // 2. Parsear y validar page
    const page = parsePositiveInt(
      pageParam,
      PAGINATION_CONFIG.DEFAULT_PAGE,
      1 // min: 1
    );

    // 3. Parsear y validar pageSize
    const pageSize = parsePositiveInt(
      pageSizeParam,
      PAGINATION_CONFIG.DEFAULT_PAGE_SIZE,
      PAGINATION_CONFIG.MIN_PAGE_SIZE,
      PAGINATION_CONFIG.MAX_PAGE_SIZE
    );

    // 4. Calcular offset para SQL
    const offset = (page - 1) * pageSize;

    // 5. Agregar datos de paginación a request
    req.pagination = {
      page,
      pageSize,
      offset
    };

    // 6. Continuar al siguiente middleware
    next();
  } catch (error) {
    // Error inesperado durante parseo (no debería ocurrir)
    console.error('[PAGINATION] Error inesperado en paginationMiddleware:', error);

    // Usar valores por defecto en caso de error
    req.pagination = {
      page: PAGINATION_CONFIG.DEFAULT_PAGE,
      pageSize: PAGINATION_CONFIG.DEFAULT_PAGE_SIZE,
      offset: 0
    };

    next();
  }
};

// ============================================================================
// HELPERS PARA SERVICIOS
// ============================================================================

/**
 * Calcula el número total de páginas
 *
 * @param totalRecords - Total de registros en la base de datos
 * @param pageSize - Tamaño de página
 * @returns Número total de páginas
 *
 * @example
 * ```typescript
 * calculateTotalPages(95, 10); // 10 páginas
 * calculateTotalPages(100, 10); // 10 páginas
 * calculateTotalPages(0, 10); // 0 páginas
 * ```
 */
export function calculateTotalPages(totalRecords: number, pageSize: number): number {
  if (totalRecords <= 0) return 0;
  return Math.ceil(totalRecords / pageSize);
}

/**
 * Valida si una página existe dado el total de registros
 *
 * @param page - Página a validar
 * @param totalRecords - Total de registros
 * @param pageSize - Tamaño de página
 * @returns true si la página existe, false si no
 *
 * @example
 * ```typescript
 * isPageValid(1, 50, 10); // true (páginas 1-5 existen)
 * isPageValid(6, 50, 10); // false (solo hay 5 páginas)
 * ```
 */
export function isPageValid(page: number, totalRecords: number, pageSize: number): boolean {
  if (page < 1) return false;
  const totalPages = calculateTotalPages(totalRecords, pageSize);
  // Si no hay registros, solo página 1 es válida
  if (totalPages === 0) return page === 1;
  return page <= totalPages;
}

// ============================================================================
// EXPORTACIONES
// ============================================================================

export default paginationMiddleware;
