/**
 * Utilidades de Respuesta
 * Sistema de Gestión de Turnos - OperacionesRanger
 *
 * Funciones helper para construir respuestas HTTP consistentes
 * y transformar errores de base de datos.
 *
 * Características:
 * - Builder de respuestas paginadas
 * - Transformación de errores SQL a errores de aplicación
 * - Custom error classes con statusCode
 *
 * @module utils/response.utils
 */

import { calculateTotalPages } from '../middlewares/pagination.middleware';

// ============================================================================
// TIPOS
// ============================================================================

/**
 * Formato estándar de respuesta paginada
 */
export interface PaginatedResponse<T> {
  /** Array de datos de la página actual */
  data: T[];
  /** Total de registros en la base de datos */
  total: number;
  /** Número de página actual */
  page: number;
  /** Tamaño de página (registros por página) */
  pageSize: number;
  /** Total de páginas calculado */
  totalPages: number;
}

// ============================================================================
// CUSTOM ERROR CLASSES
// ============================================================================

/**
 * Error de Recurso No Encontrado (404)
 *
 * Se lanza cuando un recurso solicitado no existe en la base de datos
 *
 * @example
 * ```typescript
 * throw new NotFoundError('Cliente con ID 999 no encontrado');
 * ```
 */
export class NotFoundError extends Error {
  statusCode = 404;

  constructor(message: string) {
    super(message);
    this.name = 'NotFoundError';
    // Mantener prototype chain para instanceof
    Object.setPrototypeOf(this, NotFoundError.prototype);
  }
}

/**
 * Error de Conflicto (409)
 *
 * Se lanza cuando hay conflictos de datos:
 * - Duplicados (unique constraint)
 * - Referencias que impiden eliminar
 * - Validaciones de negocio que fallan
 *
 * @example
 * ```typescript
 * throw new ConflictError('Ya existe un cliente con ese código');
 * throw new ConflictError('No se puede eliminar: cliente tiene ubicaciones activas');
 * ```
 */
export class ConflictError extends Error {
  statusCode = 409;

  constructor(message: string) {
    super(message);
    this.name = 'ConflictError';
    Object.setPrototypeOf(this, ConflictError.prototype);
  }
}

/**
 * Error de Validación (400)
 *
 * Se lanza cuando los datos de entrada no cumplen las validaciones de negocio
 * (diferente a errores de schema Zod)
 *
 * @example
 * ```typescript
 * throw new ValidationError('Las horas normales no pueden exceder 12');
 * ```
 */
export class ValidationError extends Error {
  statusCode = 400;
  details?: any;

  constructor(message: string, details?: any) {
    super(message);
    this.name = 'ValidationError';
    this.details = details;
    Object.setPrototypeOf(this, ValidationError.prototype);
  }
}

/**
 * Error de Forbidden (403)
 *
 * Se lanza cuando el usuario no tiene permisos para realizar una acción
 * (diferente a 401 Unauthorized que es para autenticación)
 *
 * @example
 * ```typescript
 * throw new ForbiddenError('No tiene permisos para eliminar usuarios');
 * ```
 */
export class ForbiddenError extends Error {
  statusCode = 403;

  constructor(message: string) {
    super(message);
    this.name = 'ForbiddenError';
    Object.setPrototypeOf(this, ForbiddenError.prototype);
  }
}

/**
 * Error de Servicio No Disponible (503)
 *
 * Se lanza cuando un servicio externo no está disponible
 * (base de datos, API externa, etc.)
 *
 * @example
 * ```typescript
 * throw new ServiceUnavailableError('Base de datos RRHH no disponible');
 * ```
 */
export class ServiceUnavailableError extends Error {
  statusCode = 503;

  constructor(message: string) {
    super(message);
    this.name = 'ServiceUnavailableError';
    Object.setPrototypeOf(this, ServiceUnavailableError.prototype);
  }
}

// ============================================================================
// BUILDER DE RESPUESTAS PAGINADAS
// ============================================================================

/**
 * Construye respuesta paginada estándar
 *
 * Toma los datos de una consulta paginada y construye un objeto
 * con el formato estándar de respuesta paginada.
 *
 * **Formato de respuesta**:
 * ```json
 * {
 *   "data": [...],
 *   "total": 95,
 *   "page": 2,
 *   "pageSize": 20,
 *   "totalPages": 5
 * }
 * ```
 *
 * @template T - Tipo de datos en el array
 * @param data - Array de datos de la página actual
 * @param total - Total de registros en la base de datos
 * @param page - Número de página actual (base 1)
 * @param pageSize - Tamaño de página (registros por página)
 * @returns Objeto con formato de respuesta paginada
 *
 * @example
 * ```typescript
 * // En servicio:
 * const clientes = await db.query('SELECT * FROM clientes LIMIT ? OFFSET ?', [pageSize, offset]);
 * const [countResult] = await db.query('SELECT COUNT(*) as total FROM clientes');
 * const total = countResult[0].total;
 *
 * return buildPaginationResponse(clientes, total, page, pageSize);
 * ```
 *
 * @example
 * ```typescript
 * // Resultado:
 * {
 *   data: [{ id: 1, nombre: 'Cliente A' }, ...],
 *   total: 95,
 *   page: 2,
 *   pageSize: 20,
 *   totalPages: 5
 * }
 * ```
 */
export function buildPaginationResponse<T>(
  data: T[],
  total: number,
  page: number,
  pageSize: number
): PaginatedResponse<T> {
  // Calcular total de páginas
  const totalPages = calculateTotalPages(total, pageSize);

  return {
    data,
    total,
    page,
    pageSize,
    totalPages
  };
}

// ============================================================================
// TRANSFORMACIÓN DE ERRORES DE BASE DE DATOS
// ============================================================================

/**
 * Códigos de error MySQL comunes
 */
const MYSQL_ERROR_CODES = {
  DUPLICATE_ENTRY: 'ER_DUP_ENTRY',
  NO_REFERENCED_ROW: 'ER_NO_REFERENCED_ROW',
  NO_REFERENCED_ROW_2: 'ER_NO_REFERENCED_ROW_2',
  ROW_IS_REFERENCED: 'ER_ROW_IS_REFERENCED',
  ROW_IS_REFERENCED_2: 'ER_ROW_IS_REFERENCED_2',
  BAD_NULL_ERROR: 'ER_BAD_NULL_ERROR',
  DATA_TOO_LONG: 'ER_DATA_TOO_LONG',
  PARSE_ERROR: 'ER_PARSE_ERROR',
  ACCESS_DENIED: 'ER_ACCESS_DENIED_ERROR',
  CONNECTION_REFUSED: 'ECONNREFUSED'
} as const;

/**
 * Transforma errores SQL de MySQL en errores de aplicación
 *
 * Detecta códigos de error comunes de MySQL y los convierte en
 * custom errors con statusCode apropiado y mensajes amigables.
 *
 * **Errores detectados**:
 * - ER_DUP_ENTRY → ConflictError (409)
 * - ER_NO_REFERENCED_ROW → NotFoundError (404)
 * - ER_ROW_IS_REFERENCED → ConflictError (409)
 * - ER_BAD_NULL_ERROR → ValidationError (400)
 * - ER_DATA_TOO_LONG → ValidationError (400)
 * - ECONNREFUSED → ServiceUnavailableError (503)
 *
 * Si el error no es de MySQL, lo retorna sin modificar.
 *
 * @param error - Error de MySQL o cualquier otro error
 * @returns Error transformado con statusCode, o el error original
 *
 * @example
 * ```typescript
 * try {
 *   await db.query('INSERT INTO clientes (codigo) VALUES (?)', [codigo]);
 * } catch (error) {
 *   throw handleDatabaseError(error);
 *   // Si código duplicado → ConflictError (409)
 * }
 * ```
 *
 * @example
 * ```typescript
 * // En controller con try-catch:
 * try {
 *   await clientesService.createCliente(data);
 * } catch (error) {
 *   const appError = handleDatabaseError(error);
 *   throw appError; // Error handler lo capturará
 * }
 * ```
 */
export function handleDatabaseError(error: any): Error {
  // Validar que error existe
  if (!error) {
    return new Error('Error desconocido');
  }

  // Si no es error de MySQL, retornar sin modificar
  if (!error.code && !error.sqlMessage) {
    return error;
  }

  const code = error.code || '';
  const message = error.sqlMessage || error.message || '';

  // Duplicado (unique constraint)
  if (code === MYSQL_ERROR_CODES.DUPLICATE_ENTRY) {
    // Intentar extraer campo duplicado del mensaje
    let field = 'campo';
    const keyMatch = message.match(/for key '([^']+)'/);
    if (keyMatch) {
      field = keyMatch[1].replace(/^uk_|^idx_/, ''); // Eliminar prefijos
    }

    return new ConflictError(
      `Ya existe un registro con ese ${field}. Por favor use un valor diferente.`
    );
  }

  // Referencia no encontrada (foreign key)
  if (
    code === MYSQL_ERROR_CODES.NO_REFERENCED_ROW ||
    code === MYSQL_ERROR_CODES.NO_REFERENCED_ROW_2
  ) {
    return new NotFoundError(
      'Referencia no encontrada. Verifique que los datos relacionados existan.'
    );
  }

  // Registro tiene dependencias (no se puede eliminar)
  if (
    code === MYSQL_ERROR_CODES.ROW_IS_REFERENCED ||
    code === MYSQL_ERROR_CODES.ROW_IS_REFERENCED_2
  ) {
    return new ConflictError(
      'No se puede eliminar: el registro tiene dependencias activas.'
    );
  }

  // Campo requerido es null
  if (code === MYSQL_ERROR_CODES.BAD_NULL_ERROR) {
    let field = 'campo requerido';
    const fieldMatch = message.match(/Column '([^']+)'/);
    if (fieldMatch) {
      field = fieldMatch[1];
    }

    return new ValidationError(`El campo '${field}' es requerido y no puede estar vacío.`);
  }

  // Datos exceden longitud permitida
  if (code === MYSQL_ERROR_CODES.DATA_TOO_LONG) {
    let field = 'campo';
    const fieldMatch = message.match(/column '([^']+)'/);
    if (fieldMatch) {
      field = fieldMatch[1];
    }

    return new ValidationError(
      `El valor del campo '${field}' excede la longitud máxima permitida.`
    );
  }

  // Conexión rechazada (BD no disponible)
  if (code === MYSQL_ERROR_CODES.CONNECTION_REFUSED) {
    return new ServiceUnavailableError(
      'No se pudo conectar a la base de datos. Intente nuevamente más tarde.'
    );
  }

  // Error SQL genérico
  return error;
}

// ============================================================================
// EXPORTACIONES
// ============================================================================

/**
 * Exportar todas las utilidades y error classes
 */
export default {
  // Funciones
  buildPaginationResponse,
  handleDatabaseError,
  // Error classes
  NotFoundError,
  ConflictError,
  ValidationError,
  ForbiddenError,
  ServiceUnavailableError
};
