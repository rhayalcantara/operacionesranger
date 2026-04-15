/**
 * Tests para Validation Middleware
 * Sistema de Gestión de Turnos - OperacionesRanger
 *
 * Tests unitarios para el middleware de validación de requests.
 *
 * @module tests/middlewares/validation.middleware.test
 */

import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import {
  validateRequest,
  validateBody,
  validateQuery,
  validateParams,
  formatZodErrors,
} from '../../src/middlewares/validation.middleware';

// ============================================================================
// MOCKS
// ============================================================================

const createMockRequest = (overrides: Partial<Request> = {}): Partial<Request> => ({
  body: {},
  query: {},
  params: {},
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

// ============================================================================
// TEST SCHEMAS
// ============================================================================

const testBodySchema = z.object({
  name: z.string().min(1, 'El nombre es requerido'),
  email: z.string().email('Email inválido'),
  age: z.number().min(18, 'Debe ser mayor de 18'),
});

const testQuerySchema = z.object({
  page: z.string().transform(Number).refine((n) => n > 0, 'Página debe ser mayor a 0'),
  search: z.string().optional(),
});

const testParamSchema = z.object({
  id: z.string().regex(/^\d+$/, 'ID inválido').transform(Number),
});

// ============================================================================
// TESTS: formatZodErrors
// ============================================================================

describe('Validation Middleware - formatZodErrors', () => {
  test('formatea errores de Zod correctamente', () => {
    const schema = z.object({
      email: z.string().email(),
      password: z.string().min(8),
    });

    const result = schema.safeParse({ email: 'invalid', password: '123' });

    if (!result.success) {
      const formatted = formatZodErrors(result.error);

      expect(formatted).toHaveLength(2);
      expect(formatted[0]).toHaveProperty('field');
      expect(formatted[0]).toHaveProperty('message');
      expect(formatted.find((e) => e.field === 'email')).toBeDefined();
      expect(formatted.find((e) => e.field === 'password')).toBeDefined();
    }
  });

  test('maneja errores anidados correctamente', () => {
    const schema = z.object({
      user: z.object({
        name: z.string().min(1),
      }),
    });

    const result = schema.safeParse({ user: { name: '' } });

    if (!result.success) {
      const formatted = formatZodErrors(result.error);

      expect(formatted[0].field).toBe('user.name');
    }
  });
});

// ============================================================================
// TESTS: validateRequest - BODY
// ============================================================================

describe('Validation Middleware - validateRequest (body)', () => {
  test('valida body correctamente y llama next()', () => {
    const req = createMockRequest({
      body: { name: 'Juan', email: 'juan@example.com', age: 25 },
    }) as Request;
    const res = createMockResponse() as Response;
    const next = createMockNext();

    const middleware = validateRequest(testBodySchema, 'body');
    middleware(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(req.validatedData).toEqual({ name: 'Juan', email: 'juan@example.com', age: 25 });
    expect(res.status).not.toHaveBeenCalled();
  });

  test('responde 400 si validación falla', () => {
    const req = createMockRequest({
      body: { name: '', email: 'invalid', age: 15 },
    }) as Request;
    const res = createMockResponse() as Response;
    const next = createMockNext();

    const middleware = validateRequest(testBodySchema, 'body');
    middleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        error: 'Datos de entrada inválidos',
        details: expect.any(Array),
      })
    );
    expect(next).not.toHaveBeenCalled();
  });

  test('incluye detalles de errores de validación', () => {
    const req = createMockRequest({
      body: { name: '', email: 'bad-email', age: 10 },
    }) as Request;
    const res = createMockResponse() as Response;
    const next = createMockNext();

    const middleware = validateRequest(testBodySchema, 'body');
    middleware(req, res, next);

    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        details: expect.arrayContaining([
          expect.objectContaining({ field: 'name' }),
          expect.objectContaining({ field: 'email' }),
          expect.objectContaining({ field: 'age' }),
        ]),
      })
    );
  });

  test('transforma datos según schema (trim, uppercase, etc.)', () => {
    const transformSchema = z.object({
      code: z.string().trim().toUpperCase(),
    });

    const req = createMockRequest({
      body: { code: '  abc123  ' },
    }) as Request;
    const res = createMockResponse() as Response;
    const next = createMockNext();

    const middleware = validateRequest(transformSchema, 'body');
    middleware(req, res, next);

    expect(req.validatedData).toEqual({ code: 'ABC123' });
    expect(next).toHaveBeenCalled();
  });
});

// ============================================================================
// TESTS: validateRequest - QUERY
// ============================================================================

describe('Validation Middleware - validateRequest (query)', () => {
  test('valida query params correctamente', () => {
    const req = createMockRequest({
      query: { page: '1', search: 'test' },
    }) as Request;
    const res = createMockResponse() as Response;
    const next = createMockNext();

    const middleware = validateRequest(testQuerySchema, 'query');
    middleware(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(req.validatedData).toEqual({ page: 1, search: 'test' });
  });

  test('responde 400 si query inválido', () => {
    const req = createMockRequest({
      query: { page: '0' }, // Falla refine(n > 0)
    }) as Request;
    const res = createMockResponse() as Response;
    const next = createMockNext();

    const middleware = validateRequest(testQuerySchema, 'query');
    middleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(next).not.toHaveBeenCalled();
  });

  test('maneja query params opcionales', () => {
    const req = createMockRequest({
      query: { page: '1' }, // search es opcional
    }) as Request;
    const res = createMockResponse() as Response;
    const next = createMockNext();

    const middleware = validateRequest(testQuerySchema, 'query');
    middleware(req, res, next);

    expect(next).toHaveBeenCalled();
    expect(req.validatedData).toEqual({ page: 1 });
  });
});

// ============================================================================
// TESTS: validateRequest - PARAMS
// ============================================================================

describe('Validation Middleware - validateRequest (params)', () => {
  test('valida params correctamente', () => {
    const req = createMockRequest({
      params: { id: '123' },
    }) as Request;
    const res = createMockResponse() as Response;
    const next = createMockNext();

    const middleware = validateRequest(testParamSchema, 'params');
    middleware(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(req.validatedData).toEqual({ id: 123 });
  });

  test('responde 400 si param inválido', () => {
    const req = createMockRequest({
      params: { id: 'abc' }, // Falla regex /^\d+$/
    }) as Request;
    const res = createMockResponse() as Response;
    const next = createMockNext();

    const middleware = validateRequest(testParamSchema, 'params');
    middleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(next).not.toHaveBeenCalled();
  });
});

// ============================================================================
// TESTS: Aliases (validateBody, validateQuery, validateParams)
// ============================================================================

describe('Validation Middleware - Aliases', () => {
  test('validateBody funciona correctamente', () => {
    const req = createMockRequest({
      body: { name: 'Test', email: 'test@test.com', age: 25 },
    }) as Request;
    const res = createMockResponse() as Response;
    const next = createMockNext();

    const middleware = validateBody(testBodySchema);
    middleware(req, res, next);

    expect(next).toHaveBeenCalled();
  });

  test('validateQuery funciona correctamente', () => {
    const req = createMockRequest({
      query: { page: '1' },
    }) as Request;
    const res = createMockResponse() as Response;
    const next = createMockNext();

    const middleware = validateQuery(testQuerySchema);
    middleware(req, res, next);

    expect(next).toHaveBeenCalled();
  });

  test('validateParams funciona correctamente', () => {
    const req = createMockRequest({
      params: { id: '99' },
    }) as Request;
    const res = createMockResponse() as Response;
    const next = createMockNext();

    const middleware = validateParams(testParamSchema);
    middleware(req, res, next);

    expect(next).toHaveBeenCalled();
  });
});

// ============================================================================
// TESTS: Edge Cases
// ============================================================================

describe('Validation Middleware - Edge Cases', () => {
  test('maneja esquemas vacíos', () => {
    const emptySchema = z.object({});

    const req = createMockRequest({
      body: { extra: 'field' },
    }) as Request;
    const res = createMockResponse() as Response;
    const next = createMockNext();

    const middleware = validateRequest(emptySchema, 'body');
    middleware(req, res, next);

    expect(next).toHaveBeenCalled();
    expect(req.validatedData).toEqual({});
  });

  test('maneja datos undefined', () => {
    const req = createMockRequest({
      body: undefined as any,
    }) as Request;
    const res = createMockResponse() as Response;
    const next = createMockNext();

    const middleware = validateRequest(testBodySchema, 'body');
    middleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(400);
  });

  test('maneja datos null', () => {
    const req = createMockRequest({
      body: null as any,
    }) as Request;
    const res = createMockResponse() as Response;
    const next = createMockNext();

    const middleware = validateRequest(testBodySchema, 'body');
    middleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(400);
  });
});
