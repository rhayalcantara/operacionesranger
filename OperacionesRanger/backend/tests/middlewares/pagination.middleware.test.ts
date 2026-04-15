/**
 * Tests para Pagination Middleware
 * Sistema de Gestión de Turnos - OperacionesRanger
 *
 * Tests unitarios para el middleware de paginación.
 *
 * @module tests/middlewares/pagination.middleware.test
 */

import { Request, Response, NextFunction } from 'express';
import {
  paginationMiddleware,
  calculateTotalPages,
  isPageValid,
  PAGINATION_CONFIG,
} from '../../src/middlewares/pagination.middleware';

// ============================================================================
// MOCKS
// ============================================================================

const createMockRequest = (query: any = {}): Partial<Request> => ({
  query,
});

const createMockResponse = (): Partial<Response> => ({
  status: jest.fn().mockReturnThis(),
  json: jest.fn().mockReturnThis(),
});

const createMockNext = (): NextFunction => jest.fn();

// ============================================================================
// TESTS: paginationMiddleware - Defaults
// ============================================================================

describe('Pagination Middleware - Defaults', () => {
  test('aplica defaults cuando no hay query params', () => {
    const req = createMockRequest({}) as Request;
    const res = createMockResponse() as Response;
    const next = createMockNext();

    paginationMiddleware(req, res, next);

    expect(req.pagination).toEqual({
      page: PAGINATION_CONFIG.DEFAULT_PAGE,
      pageSize: PAGINATION_CONFIG.DEFAULT_PAGE_SIZE,
      offset: 0,
    });
    expect(next).toHaveBeenCalledTimes(1);
  });

  test('aplica default de page cuando solo se envía pageSize', () => {
    const req = createMockRequest({ pageSize: '20' }) as Request;
    const res = createMockResponse() as Response;
    const next = createMockNext();

    paginationMiddleware(req, res, next);

    expect(req.pagination).toEqual({
      page: 1,
      pageSize: 20,
      offset: 0,
    });
  });

  test('aplica default de pageSize cuando solo se envía page', () => {
    const req = createMockRequest({ page: '3' }) as Request;
    const res = createMockResponse() as Response;
    const next = createMockNext();

    paginationMiddleware(req, res, next);

    expect(req.pagination).toEqual({
      page: 3,
      pageSize: 10,
      offset: 20, // (3-1) * 10
    });
  });
});

// ============================================================================
// TESTS: paginationMiddleware - Parseo Correcto
// ============================================================================

describe('Pagination Middleware - Parseo Correcto', () => {
  test('parsea page y pageSize correctamente', () => {
    const req = createMockRequest({ page: '2', pageSize: '20' }) as Request;
    const res = createMockResponse() as Response;
    const next = createMockNext();

    paginationMiddleware(req, res, next);

    expect(req.pagination).toEqual({
      page: 2,
      pageSize: 20,
      offset: 20, // (2-1) * 20
    });
  });

  test('calcula offset correctamente para diferentes páginas', () => {
    const testCases = [
      { page: 1, pageSize: 10, expectedOffset: 0 },
      { page: 2, pageSize: 10, expectedOffset: 10 },
      { page: 5, pageSize: 20, expectedOffset: 80 },
      { page: 10, pageSize: 50, expectedOffset: 450 },
    ];

    testCases.forEach(({ page, pageSize, expectedOffset }) => {
      const req = createMockRequest({ page: page.toString(), pageSize: pageSize.toString() }) as Request;
      const res = createMockResponse() as Response;
      const next = createMockNext();

      paginationMiddleware(req, res, next);

      expect(req.pagination?.offset).toBe(expectedOffset);
    });
  });
});

// ============================================================================
// TESTS: paginationMiddleware - Validaciones y Límites
// ============================================================================

describe('Pagination Middleware - Validaciones y Límites', () => {
  test('limita page a mínimo 1 si es 0 o negativo', () => {
    const testCases = ['0', '-1', '-100'];

    testCases.forEach((page) => {
      const req = createMockRequest({ page }) as Request;
      const res = createMockResponse() as Response;
      const next = createMockNext();

      paginationMiddleware(req, res, next);

      expect(req.pagination?.page).toBe(1);
    });
  });

  test('limita pageSize a máximo 100', () => {
    const req = createMockRequest({ pageSize: '200' }) as Request;
    const res = createMockResponse() as Response;
    const next = createMockNext();

    paginationMiddleware(req, res, next);

    expect(req.pagination?.pageSize).toBe(PAGINATION_CONFIG.MAX_PAGE_SIZE);
  });

  test('limita pageSize a mínimo 1 si es 0 o negativo', () => {
    const testCases = ['0', '-5'];

    testCases.forEach((pageSize) => {
      const req = createMockRequest({ pageSize }) as Request;
      const res = createMockResponse() as Response;
      const next = createMockNext();

      paginationMiddleware(req, res, next);

      expect(req.pagination?.pageSize).toBe(1);
    });
  });
});

// ============================================================================
// TESTS: paginationMiddleware - Valores Inválidos
// ============================================================================

describe('Pagination Middleware - Valores Inválidos', () => {
  test('usa defaults si page no es número', () => {
    const testCases = ['abc', 'xyz', 'null', 'undefined', ''];

    testCases.forEach((page) => {
      const req = createMockRequest({ page }) as Request;
      const res = createMockResponse() as Response;
      const next = createMockNext();

      paginationMiddleware(req, res, next);

      expect(req.pagination?.page).toBe(1);
    });
  });

  test('usa defaults si pageSize no es número', () => {
    const testCases = ['abc', 'xyz', 'null', 'undefined', ''];

    testCases.forEach((pageSize) => {
      const req = createMockRequest({ pageSize }) as Request;
      const res = createMockResponse() as Response;
      const next = createMockNext();

      paginationMiddleware(req, res, next);

      expect(req.pagination?.pageSize).toBe(10);
    });
  });

  test('usa defaults si valores son null o undefined', () => {
    const req = createMockRequest({ page: null, pageSize: undefined }) as Request;
    const res = createMockResponse() as Response;
    const next = createMockNext();

    paginationMiddleware(req, res, next);

    expect(req.pagination).toEqual({
      page: 1,
      pageSize: 10,
      offset: 0,
    });
  });

  test('ignora decimales y usa parte entera', () => {
    const req = createMockRequest({ page: '2.7', pageSize: '15.9' }) as Request;
    const res = createMockResponse() as Response;
    const next = createMockNext();

    paginationMiddleware(req, res, next);

    expect(req.pagination?.page).toBe(2);
    expect(req.pagination?.pageSize).toBe(15);
  });
});

// ============================================================================
// TESTS: calculateTotalPages
// ============================================================================

describe('Pagination Helpers - calculateTotalPages', () => {
  test('calcula total de páginas correctamente', () => {
    expect(calculateTotalPages(100, 10)).toBe(10);
    expect(calculateTotalPages(95, 10)).toBe(10);
    expect(calculateTotalPages(101, 10)).toBe(11);
    expect(calculateTotalPages(50, 20)).toBe(3);
    expect(calculateTotalPages(1, 10)).toBe(1);
  });

  test('retorna 0 si total de registros es 0', () => {
    expect(calculateTotalPages(0, 10)).toBe(0);
  });

  test('retorna 0 si total de registros es negativo', () => {
    expect(calculateTotalPages(-10, 10)).toBe(0);
  });

  test('maneja tamaños de página grandes', () => {
    expect(calculateTotalPages(50, 100)).toBe(1);
  });
});

// ============================================================================
// TESTS: isPageValid
// ============================================================================

describe('Pagination Helpers - isPageValid', () => {
  test('valida páginas existentes', () => {
    expect(isPageValid(1, 50, 10)).toBe(true); // Páginas 1-5 existen
    expect(isPageValid(5, 50, 10)).toBe(true);
    expect(isPageValid(3, 50, 10)).toBe(true);
  });

  test('rechaza páginas fuera de rango', () => {
    expect(isPageValid(6, 50, 10)).toBe(false); // Solo hay 5 páginas
    expect(isPageValid(100, 50, 10)).toBe(false);
  });

  test('rechaza páginas menores a 1', () => {
    expect(isPageValid(0, 50, 10)).toBe(false);
    expect(isPageValid(-1, 50, 10)).toBe(false);
  });

  test('acepta página 1 si no hay registros (caso especial)', () => {
    expect(isPageValid(1, 0, 10)).toBe(true);
  });

  test('rechaza páginas mayores a 1 si no hay registros', () => {
    expect(isPageValid(2, 0, 10)).toBe(false);
  });
});

// ============================================================================
// TESTS: Edge Cases
// ============================================================================

describe('Pagination Middleware - Edge Cases', () => {
  test('maneja query con múltiples parámetros (ignora extras)', () => {
    const req = createMockRequest({
      page: '2',
      pageSize: '20',
      search: 'test',
      filter: 'active',
    }) as Request;
    const res = createMockResponse() as Response;
    const next = createMockNext();

    paginationMiddleware(req, res, next);

    expect(req.pagination).toEqual({
      page: 2,
      pageSize: 20,
      offset: 20,
    });
    expect(next).toHaveBeenCalled();
  });

  test('maneja query vacío', () => {
    const req = createMockRequest() as Request;
    const res = createMockResponse() as Response;
    const next = createMockNext();

    paginationMiddleware(req, res, next);

    expect(req.pagination).toBeDefined();
    expect(next).toHaveBeenCalled();
  });

  test('continúa ejecución incluso con errores inesperados', () => {
    // Caso extremo: query es null (no debería ocurrir, pero por robustez)
    const req = { query: null } as any as Request;
    const res = createMockResponse() as Response;
    const next = createMockNext();

    paginationMiddleware(req, res, next);

    expect(next).toHaveBeenCalled();
    // Debe usar defaults en caso de error
    expect(req.pagination).toBeDefined();
  });
});
