/**
 * Tests para Error Handler Middleware
 * Sistema de Gestión de Turnos - OperacionesRanger
 *
 * Tests unitarios para el middleware de manejo global de errores.
 *
 * @module tests/middlewares/error-handler.middleware.test
 */

import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { errorHandlerMiddleware } from '../../src/middlewares/error-handler.middleware';
import {
  NotFoundError,
  ConflictError,
  ValidationError,
  ForbiddenError,
} from '../../src/utils/response.utils';

// ============================================================================
// MOCKS
// ============================================================================

// Mock del logger
jest.mock('@/config/logger', () => ({
  __esModule: true,
  default: {
    error: jest.fn(),
    warn: jest.fn(),
    info: jest.fn(),
    debug: jest.fn(),
  }
}));

const createMockRequest = (overrides: Partial<Request> = {}): Partial<Request> => ({
  method: 'GET',
  originalUrl: '/api/test',
  url: '/api/test',
  ip: '127.0.0.1',
  socket: { remoteAddress: '127.0.0.1' } as any,
  ...overrides,
});

const createMockResponse = (): Partial<Response> => {
  const res: Partial<Response> = {
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
  };
  return res;
};

const createMockNext = (): NextFunction => jest.fn();

// Mock console.error para evitar ruido en tests
const originalConsoleError = console.error;
beforeAll(() => {
  console.error = jest.fn();
});

afterAll(() => {
  console.error = originalConsoleError;
});

// ============================================================================
// TESTS: ZodError
// ============================================================================

describe('Error Handler - ZodError', () => {
  test('maneja ZodError y responde 400', () => {
    const schema = z.object({ email: z.string().email() });
    const validationResult = schema.safeParse({ email: 'invalid' });

    const req = createMockRequest() as Request;
    const res = createMockResponse() as Response;
    const next = createMockNext();

    if (!validationResult.success) {
      errorHandlerMiddleware(validationResult.error, req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: 'Validation Error',
          message: expect.any(String),
          details: expect.any(Array),
        })
      );
    }
  });

  test('incluye detalles de errores de validación', () => {
    const schema = z.object({
      name: z.string().min(1),
      age: z.number().min(18),
    });
    const validationResult = schema.safeParse({ name: '', age: 10 });

    const req = createMockRequest() as Request;
    const res = createMockResponse() as Response;
    const next = createMockNext();

    if (!validationResult.success) {
      errorHandlerMiddleware(validationResult.error, req, res, next);

      const jsonCall = (res.json as jest.Mock).mock.calls[0][0];
      expect(jsonCall.details).toHaveLength(2);
      expect(jsonCall.details).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ field: 'name' }),
          expect.objectContaining({ field: 'age' }),
        ])
      );
    }
  });
});

// ============================================================================
// TESTS: Custom Errors (con statusCode)
// ============================================================================

describe('Error Handler - Custom Errors', () => {
  test('maneja NotFoundError (404)', () => {
    const error = new NotFoundError('Cliente no encontrado');

    const req = createMockRequest() as Request;
    const res = createMockResponse() as Response;
    const next = createMockNext();

    errorHandlerMiddleware(error, req, res, next);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        error: 'NotFoundError',
        message: 'Cliente no encontrado',
      })
    );
  });

  test('maneja ConflictError (409)', () => {
    const error = new ConflictError('Código duplicado');

    const req = createMockRequest() as Request;
    const res = createMockResponse() as Response;
    const next = createMockNext();

    errorHandlerMiddleware(error, req, res, next);

    expect(res.status).toHaveBeenCalledWith(409);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        error: 'ConflictError',
        message: 'Código duplicado',
      })
    );
  });

  test('maneja ValidationError (400)', () => {
    const error = new ValidationError('Datos inválidos', { field: 'email' });

    const req = createMockRequest() as Request;
    const res = createMockResponse() as Response;
    const next = createMockNext();

    errorHandlerMiddleware(error, req, res, next);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        error: 'ValidationError',
        message: 'Datos inválidos',
        details: { field: 'email' },
      })
    );
  });

  test('maneja ForbiddenError (403)', () => {
    const error = new ForbiddenError('Sin permisos');

    const req = createMockRequest() as Request;
    const res = createMockResponse() as Response;
    const next = createMockNext();

    errorHandlerMiddleware(error, req, res, next);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        error: 'ForbiddenError',
        message: 'Sin permisos',
      })
    );
  });
});

// ============================================================================
// TESTS: Database Errors
// ============================================================================

describe('Error Handler - Database Errors', () => {
  test('maneja ER_DUP_ENTRY (409 Conflict)', () => {
    const error = {
      code: 'ER_DUP_ENTRY',
      sqlMessage: "Duplicate entry 'CLI001' for key 'uk_codigo'",
    };

    const req = createMockRequest() as Request;
    const res = createMockResponse() as Response;
    const next = createMockNext();

    errorHandlerMiddleware(error, req, res, next);

    expect(res.status).toHaveBeenCalledWith(409);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        error: 'Database Error',
        message: expect.stringContaining('duplicado'),
      })
    );
  });

  test('maneja ER_NO_REFERENCED_ROW (404 Not Found)', () => {
    const error = {
      code: 'ER_NO_REFERENCED_ROW',
      sqlMessage: 'Cannot add or update a child row',
    };

    const req = createMockRequest() as Request;
    const res = createMockResponse() as Response;
    const next = createMockNext();

    errorHandlerMiddleware(error, req, res, next);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        error: 'Database Error',
        message: expect.stringContaining('no encontrada'),
      })
    );
  });

  test('maneja ER_ROW_IS_REFERENCED (409 Conflict)', () => {
    const error = {
      code: 'ER_ROW_IS_REFERENCED',
      sqlMessage: 'Cannot delete or update a parent row',
    };

    const req = createMockRequest() as Request;
    const res = createMockResponse() as Response;
    const next = createMockNext();

    errorHandlerMiddleware(error, req, res, next);

    expect(res.status).toHaveBeenCalledWith(409);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        error: 'Database Error',
        message: expect.stringContaining('dependencias'),
      })
    );
  });

  test('maneja ECONNREFUSED (503 Service Unavailable)', () => {
    const error = {
      code: 'ECONNREFUSED',
      message: 'Connection refused',
    };

    const req = createMockRequest() as Request;
    const res = createMockResponse() as Response;
    const next = createMockNext();

    errorHandlerMiddleware(error, req, res, next);

    expect(res.status).toHaveBeenCalledWith(503);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        error: 'Database Error',
        message: expect.stringContaining('conectar'),
      })
    );
  });
});

// ============================================================================
// TESTS: Generic Errors
// ============================================================================

describe('Error Handler - Generic Errors', () => {
  test('maneja errores genéricos (500)', () => {
    const error = new Error('Algo salió mal');

    const req = createMockRequest() as Request;
    const res = createMockResponse() as Response;
    const next = createMockNext();

    errorHandlerMiddleware(error, req, res, next);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        error: 'Internal Server Error',
        message: 'Algo salió mal',
      })
    );
  });

  test('incluye mensaje por defecto si error no tiene mensaje', () => {
    const error = new Error();

    const req = createMockRequest() as Request;
    const res = createMockResponse() as Response;
    const next = createMockNext();

    errorHandlerMiddleware(error, req, res, next);

    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        message: expect.stringContaining('error'),
      })
    );
  });
});

// ============================================================================
// TESTS: Metadata y Contexto
// ============================================================================

describe('Error Handler - Metadata y Contexto', () => {
  test('incluye timestamp en respuesta', () => {
    const error = new Error('Test error');

    const req = createMockRequest() as Request;
    const res = createMockResponse() as Response;
    const next = createMockNext();

    errorHandlerMiddleware(error, req, res, next);

    const jsonCall = (res.json as jest.Mock).mock.calls[0][0];
    expect(jsonCall.timestamp).toBeDefined();
    expect(typeof jsonCall.timestamp).toBe('string');
  });

  test('incluye path y method en respuesta', () => {
    const error = new Error('Test error');

    const req = createMockRequest({
      method: 'POST',
      originalUrl: '/api/clientes',
    }) as Request;
    const res = createMockResponse() as Response;
    const next = createMockNext();

    errorHandlerMiddleware(error, req, res, next);

    const jsonCall = (res.json as jest.Mock).mock.calls[0][0];
    expect(jsonCall.path).toBe('/api/clientes');
    expect(jsonCall.method).toBe('POST');
  });

  test('loguea error con logger.error', () => {
    const error = new Error('Test error');
    const logger = require('@/config/logger').default;
    (logger.error as jest.Mock).mockClear();

    const req = createMockRequest() as Request;
    const res = createMockResponse() as Response;
    const next = createMockNext();

    errorHandlerMiddleware(error, req, res, next);

    expect(logger.error).toHaveBeenCalled();
  });
});

// ============================================================================
// TESTS: Stack Traces (Development vs Production)
// ============================================================================

describe('Error Handler - Stack Traces', () => {
  const originalEnv = process.env.NODE_ENV;

  afterEach(() => {
    process.env.NODE_ENV = originalEnv;
  });

  test('incluye stack trace en development', () => {
    process.env.NODE_ENV = 'development';

    const error = new Error('Test error');
    error.stack = 'Stack trace here';

    const req = createMockRequest() as Request;
    const res = createMockResponse() as Response;
    const next = createMockNext();

    errorHandlerMiddleware(error, req, res, next);

    const jsonCall = (res.json as jest.Mock).mock.calls[0][0];
    expect(jsonCall.stack).toBeDefined();
    expect(jsonCall.stack).toBe('Stack trace here');
  });

  test('NO incluye stack trace en production', () => {
    process.env.NODE_ENV = 'production';

    const error = new Error('Test error');
    error.stack = 'Stack trace here';

    const req = createMockRequest() as Request;
    const res = createMockResponse() as Response;
    const next = createMockNext();

    errorHandlerMiddleware(error, req, res, next);

    const jsonCall = (res.json as jest.Mock).mock.calls[0][0];
    expect(jsonCall.stack).toBeUndefined();
  });
});
