/**
 * Tests para Response Utils
 * Sistema de Gestión de Turnos - OperacionesRanger
 *
 * Tests unitarios para utilidades de respuesta y manejo de errores.
 *
 * @module tests/utils/response.utils.test
 */

import {
  buildPaginationResponse,
  handleDatabaseError,
  NotFoundError,
  ConflictError,
  ValidationError,
  ForbiddenError,
  ServiceUnavailableError,
} from '../../src/utils/response.utils';

// ============================================================================
// TESTS: buildPaginationResponse
// ============================================================================

describe('Response Utils - buildPaginationResponse', () => {
  test('construye respuesta paginada correctamente', () => {
    const data = [{ id: 1 }, { id: 2 }, { id: 3 }];
    const result = buildPaginationResponse(data, 100, 1, 10);

    expect(result).toEqual({
      data: [{ id: 1 }, { id: 2 }, { id: 3 }],
      total: 100,
      page: 1,
      pageSize: 10,
      totalPages: 10,
    });
  });

  test('calcula totalPages correctamente', () => {
    expect(buildPaginationResponse([], 95, 1, 10).totalPages).toBe(10);
    expect(buildPaginationResponse([], 100, 1, 10).totalPages).toBe(10);
    expect(buildPaginationResponse([], 101, 1, 10).totalPages).toBe(11);
  });

  test('maneja total 0 correctamente', () => {
    const result = buildPaginationResponse([], 0, 1, 10);

    expect(result).toEqual({
      data: [],
      total: 0,
      page: 1,
      pageSize: 10,
      totalPages: 0,
    });
  });

  test('maneja diferentes tamaños de página', () => {
    expect(buildPaginationResponse([], 50, 1, 20).totalPages).toBe(3);
    expect(buildPaginationResponse([], 50, 1, 50).totalPages).toBe(1);
    expect(buildPaginationResponse([], 50, 1, 100).totalPages).toBe(1);
  });

  test('preserva estructura de datos original', () => {
    interface Cliente {
      id: number;
      nombre: string;
    }

    const clientes: Cliente[] = [
      { id: 1, nombre: 'Cliente A' },
      { id: 2, nombre: 'Cliente B' },
    ];

    const result = buildPaginationResponse(clientes, 50, 2, 10);

    expect(result.data).toEqual(clientes);
    expect(result.data[0].nombre).toBe('Cliente A');
  });
});

// ============================================================================
// TESTS: Custom Error Classes
// ============================================================================

describe('Response Utils - Custom Error Classes', () => {
  test('NotFoundError tiene statusCode 404', () => {
    const error = new NotFoundError('Recurso no encontrado');

    expect(error).toBeInstanceOf(Error);
    expect(error).toBeInstanceOf(NotFoundError);
    expect(error.statusCode).toBe(404);
    expect(error.message).toBe('Recurso no encontrado');
    expect(error.name).toBe('NotFoundError');
  });

  test('ConflictError tiene statusCode 409', () => {
    const error = new ConflictError('Conflicto de datos');

    expect(error).toBeInstanceOf(Error);
    expect(error).toBeInstanceOf(ConflictError);
    expect(error.statusCode).toBe(409);
    expect(error.message).toBe('Conflicto de datos');
    expect(error.name).toBe('ConflictError');
  });

  test('ValidationError tiene statusCode 400', () => {
    const error = new ValidationError('Validación fallida');

    expect(error).toBeInstanceOf(Error);
    expect(error).toBeInstanceOf(ValidationError);
    expect(error.statusCode).toBe(400);
    expect(error.message).toBe('Validación fallida');
    expect(error.name).toBe('ValidationError');
  });

  test('ValidationError puede incluir details', () => {
    const error = new ValidationError('Validación fallida', { field: 'email' });

    expect(error.details).toEqual({ field: 'email' });
  });

  test('ForbiddenError tiene statusCode 403', () => {
    const error = new ForbiddenError('Acceso denegado');

    expect(error).toBeInstanceOf(Error);
    expect(error).toBeInstanceOf(ForbiddenError);
    expect(error.statusCode).toBe(403);
    expect(error.message).toBe('Acceso denegado');
    expect(error.name).toBe('ForbiddenError');
  });

  test('ServiceUnavailableError tiene statusCode 503', () => {
    const error = new ServiceUnavailableError('Servicio no disponible');

    expect(error).toBeInstanceOf(Error);
    expect(error).toBeInstanceOf(ServiceUnavailableError);
    expect(error.statusCode).toBe(503);
    expect(error.message).toBe('Servicio no disponible');
    expect(error.name).toBe('ServiceUnavailableError');
  });
});

// ============================================================================
// TESTS: handleDatabaseError - Duplicate Entry
// ============================================================================

describe('Response Utils - handleDatabaseError (ER_DUP_ENTRY)', () => {
  test('transforma ER_DUP_ENTRY a ConflictError', () => {
    const dbError = {
      code: 'ER_DUP_ENTRY',
      sqlMessage: "Duplicate entry 'CLI001' for key 'uk_codigo'",
    };

    const result = handleDatabaseError(dbError);

    expect(result).toBeInstanceOf(ConflictError);
    expect((result as ConflictError).statusCode).toBe(409);
    expect(result.message).toContain('Ya existe');
  });

  test('extrae nombre de campo del error duplicado', () => {
    const dbError = {
      code: 'ER_DUP_ENTRY',
      sqlMessage: "Duplicate entry 'test@email.com' for key 'uk_email'",
    };

    const result = handleDatabaseError(dbError);

    expect(result.message).toContain('email');
  });
});

// ============================================================================
// TESTS: handleDatabaseError - Foreign Key Errors
// ============================================================================

describe('Response Utils - handleDatabaseError (Foreign Keys)', () => {
  test('transforma ER_NO_REFERENCED_ROW a NotFoundError', () => {
    const dbError = {
      code: 'ER_NO_REFERENCED_ROW',
      sqlMessage: 'Cannot add or update a child row',
    };

    const result = handleDatabaseError(dbError);

    expect(result).toBeInstanceOf(NotFoundError);
    expect((result as NotFoundError).statusCode).toBe(404);
    expect(result.message).toContain('no encontrada');
  });

  test('transforma ER_NO_REFERENCED_ROW_2 a NotFoundError', () => {
    const dbError = {
      code: 'ER_NO_REFERENCED_ROW_2',
      sqlMessage: 'Cannot add or update a child row',
    };

    const result = handleDatabaseError(dbError);

    expect(result).toBeInstanceOf(NotFoundError);
    expect((result as NotFoundError).statusCode).toBe(404);
  });

  test('transforma ER_ROW_IS_REFERENCED a ConflictError', () => {
    const dbError = {
      code: 'ER_ROW_IS_REFERENCED',
      sqlMessage: 'Cannot delete or update a parent row',
    };

    const result = handleDatabaseError(dbError);

    expect(result).toBeInstanceOf(ConflictError);
    expect((result as ConflictError).statusCode).toBe(409);
    expect(result.message).toContain('dependencias');
  });

  test('transforma ER_ROW_IS_REFERENCED_2 a ConflictError', () => {
    const dbError = {
      code: 'ER_ROW_IS_REFERENCED_2',
      sqlMessage: 'Cannot delete or update a parent row',
    };

    const result = handleDatabaseError(dbError);

    expect(result).toBeInstanceOf(ConflictError);
  });
});

// ============================================================================
// TESTS: handleDatabaseError - Validation Errors
// ============================================================================

describe('Response Utils - handleDatabaseError (Validation)', () => {
  test('transforma ER_BAD_NULL_ERROR a ValidationError', () => {
    const dbError = {
      code: 'ER_BAD_NULL_ERROR',
      sqlMessage: "Column 'nombre' cannot be null",
    };

    const result = handleDatabaseError(dbError);

    expect(result).toBeInstanceOf(ValidationError);
    expect((result as ValidationError).statusCode).toBe(400);
    expect(result.message).toContain('requerido');
  });

  test('extrae nombre de campo de ER_BAD_NULL_ERROR', () => {
    const dbError = {
      code: 'ER_BAD_NULL_ERROR',
      sqlMessage: "Column 'email' cannot be null",
    };

    const result = handleDatabaseError(dbError);

    expect(result.message).toContain('email');
  });

  test('transforma ER_DATA_TOO_LONG a ValidationError', () => {
    const dbError = {
      code: 'ER_DATA_TOO_LONG',
      sqlMessage: "Data too long for column 'descripcion' at row 1",
    };

    const result = handleDatabaseError(dbError);

    expect(result).toBeInstanceOf(ValidationError);
    expect((result as ValidationError).statusCode).toBe(400);
    expect(result.message).toContain('longitud');
  });

  test('extrae nombre de campo de ER_DATA_TOO_LONG', () => {
    const dbError = {
      code: 'ER_DATA_TOO_LONG',
      sqlMessage: "Data too long for column 'nombre' at row 1",
    };

    const result = handleDatabaseError(dbError);

    expect(result.message).toContain('nombre');
  });
});

// ============================================================================
// TESTS: handleDatabaseError - Connection Errors
// ============================================================================

describe('Response Utils - handleDatabaseError (Connection)', () => {
  test('transforma ECONNREFUSED a ServiceUnavailableError', () => {
    const dbError = {
      code: 'ECONNREFUSED',
      message: 'Connection refused',
    };

    const result = handleDatabaseError(dbError);

    expect(result).toBeInstanceOf(ServiceUnavailableError);
    expect((result as ServiceUnavailableError).statusCode).toBe(503);
    expect(result.message).toContain('conectar');
  });
});

// ============================================================================
// TESTS: handleDatabaseError - Non-Database Errors
// ============================================================================

describe('Response Utils - handleDatabaseError (Non-DB Errors)', () => {
  test('retorna error sin modificar si no es error de BD', () => {
    const genericError = new Error('Error genérico');

    const result = handleDatabaseError(genericError);

    expect(result).toBe(genericError);
    expect(result.message).toBe('Error genérico');
  });

  test('retorna custom error sin modificar', () => {
    const customError = new NotFoundError('Ya transformado');

    const result = handleDatabaseError(customError);

    expect(result).toBe(customError);
  });

  test('maneja error sin code ni sqlMessage', () => {
    const error = { message: 'Algo salió mal' };

    const result = handleDatabaseError(error);

    expect(result).toBe(error);
  });
});

// ============================================================================
// TESTS: Edge Cases
// ============================================================================

describe('Response Utils - Edge Cases', () => {
  test('buildPaginationResponse maneja array vacío', () => {
    const result = buildPaginationResponse([], 0, 1, 10);

    expect(result.data).toEqual([]);
    expect(result.total).toBe(0);
  });

  test('handleDatabaseError maneja error null', () => {
    const result = handleDatabaseError(null as any);

    expect(result).toBeInstanceOf(Error);
    expect(result.message).toBe('Error desconocido');
  });

  test('handleDatabaseError maneja error undefined', () => {
    const result = handleDatabaseError(undefined as any);

    expect(result).toBeInstanceOf(Error);
    expect(result.message).toBe('Error desconocido');
  });

  test('ValidationError puede no tener details', () => {
    const error = new ValidationError('Error sin detalles');

    expect(error.details).toBeUndefined();
  });
});
