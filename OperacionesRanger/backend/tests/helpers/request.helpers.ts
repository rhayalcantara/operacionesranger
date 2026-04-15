/**
 * Request Helpers - Utilidades compartidas para tests con Supertest
 * Sistema de Gestión de Turnos - OperacionesRanger
 *
 * Funciones helper para:
 * - Requests autenticados
 * - Parseo de respuestas (CSV, JSON)
 * - Utilidades de polling/wait
 * - Validación de respuestas
 *
 * @module tests/helpers/request.helpers
 */

import request from 'supertest';
import type { Response, Test } from 'supertest';
import app from '../../src/server';

// ============================================================================
// TIPOS
// ============================================================================

/**
 * Métodos HTTP soportados
 */
export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';

/**
 * Opciones para request autenticado
 */
export interface AuthRequestOptions {
  token?: string;
  method?: HttpMethod;
  body?: any;
  query?: Record<string, any>;
  headers?: Record<string, string>;
}

/**
 * Resultado de parseo de CSV
 */
export interface CSVRow {
  [key: string]: string;
}

// ============================================================================
// FUNCIONES DE REQUEST AUTENTICADO
// ============================================================================

/**
 * Crear request autenticado con token JWT
 * Builder pattern para facilitar construcción de requests
 *
 * @param token - JWT access token
 * @returns Objeto con métodos para construir el request
 *
 * @example
 * ```typescript
 * const token = await getAuthToken('admin', 'password');
 * const response = await authenticatedRequest(token)
 *   .get('/api/usuarios')
 *   .query({ page: 1, pageSize: 10 });
 * ```
 */
export function authenticatedRequest(token: string) {
  return {
    /**
     * GET request autenticado
     */
    get(url: string): Test {
      return request(app)
        .get(url)
        .set('Authorization', `Bearer ${token}`);
    },

    /**
     * POST request autenticado
     */
    post(url: string): Test {
      return request(app)
        .post(url)
        .set('Authorization', `Bearer ${token}`);
    },

    /**
     * PUT request autenticado
     */
    put(url: string): Test {
      return request(app)
        .put(url)
        .set('Authorization', `Bearer ${token}`);
    },

    /**
     * DELETE request autenticado
     */
    delete(url: string): Test {
      return request(app)
        .delete(url)
        .set('Authorization', `Bearer ${token}`);
    },

    /**
     * PATCH request autenticado
     */
    patch(url: string): Test {
      return request(app)
        .patch(url)
        .set('Authorization', `Bearer ${token}`);
    },
  };
}

/**
 * GET request autenticado (atajo)
 *
 * @param url - URL del endpoint
 * @param token - JWT token
 * @returns SuperTest request
 *
 * @example
 * ```typescript
 * const response = await authGet('/api/usuarios', token);
 * expect(response.status).toBe(200);
 * ```
 */
export function authGet(url: string, token: string): Test {
  return request(app)
    .get(url)
    .set('Authorization', `Bearer ${token}`);
}

/**
 * POST request autenticado (atajo)
 *
 * @param url - URL del endpoint
 * @param token - JWT token
 * @param body - Cuerpo del request
 * @returns SuperTest request
 *
 * @example
 * ```typescript
 * const response = await authPost('/api/clientes', token, {
 *   nombre: 'Cliente Test',
 *   ruc: '123456789'
 * });
 * ```
 */
export function authPost(url: string, token: string, body?: any): Test {
  const req = request(app)
    .post(url)
    .set('Authorization', `Bearer ${token}`);

  return body ? req.send(body) : req;
}

/**
 * PUT request autenticado (atajo)
 */
export function authPut(url: string, token: string, body?: any): Test {
  const req = request(app)
    .put(url)
    .set('Authorization', `Bearer ${token}`);

  return body ? req.send(body) : req;
}

/**
 * DELETE request autenticado (atajo)
 */
export function authDelete(url: string, token: string): Test {
  return request(app)
    .delete(url)
    .set('Authorization', `Bearer ${token}`);
}

// ============================================================================
// FUNCIONES DE PARSEO
// ============================================================================

/**
 * Parsear respuesta CSV a array de objetos
 * Asume primera línea como headers
 *
 * @param csvText - Texto CSV
 * @returns Array de objetos (uno por fila)
 *
 * @example
 * ```typescript
 * const response = await authPost('/api/reportes/nomina', token, { ... });
 * const rows = parseCSVResponse(response.text);
 * expect(rows.length).toBeGreaterThan(0);
 * expect(rows[0]).toHaveProperty('empleado_id');
 * ```
 */
export function parseCSVResponse(csvText: string): CSVRow[] {
  // Remover BOM si existe
  const text = csvText.replace(/^\uFEFF/, '');

  const lines = text.trim().split('\n');
  if (lines.length === 0) return [];

  // Primera línea son los headers
  const headers = lines[0].split(',').map(h => h.trim());

  // Resto de líneas son datos
  const rows: CSVRow[] = [];

  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(',').map(v => v.trim());
    const row: CSVRow = {};

    headers.forEach((header, index) => {
      row[header] = values[index] || '';
    });

    rows.push(row);
  }

  return rows;
}

/**
 * Parsear respuesta paginada estándar
 * Valida estructura { data: [], total: number }
 *
 * @param response - Response de Supertest
 * @returns Objeto con data y total validados
 *
 * @example
 * ```typescript
 * const response = await authGet('/api/clientes', token);
 * const { data, total } = parsePaginatedResponse(response);
 * expect(data).toBeInstanceOf(Array);
 * expect(total).toBeGreaterThanOrEqual(data.length);
 * ```
 */
export function parsePaginatedResponse<T = any>(response: Response): {
  data: T[];
  total: number;
} {
  const body = response.body;

  if (!body || typeof body !== 'object') {
    throw new Error('Response body is not an object');
  }

  if (!Array.isArray(body.data)) {
    throw new Error('Response body.data is not an array');
  }

  if (typeof body.total !== 'number') {
    throw new Error('Response body.total is not a number');
  }

  return {
    data: body.data as T[],
    total: body.total,
  };
}

/**
 * Extraer mensaje de error de respuesta
 *
 * @param response - Response de Supertest
 * @returns Mensaje de error o string vacío
 *
 * @example
 * ```typescript
 * const response = await authPost('/api/clientes', token, {});
 * if (response.status === 400) {
 *   const errorMsg = getErrorMessage(response);
 *   expect(errorMsg).toContain('nombre es requerido');
 * }
 * ```
 */
export function getErrorMessage(response: Response): string {
  if (response.body && typeof response.body === 'object') {
    return response.body.message || response.body.error || '';
  }
  return '';
}

/**
 * Verificar que respuesta tiene estructura de error
 *
 * @param response - Response de Supertest
 * @param expectedStatus - Status esperado (default: 400)
 * @param expectedMessage - Substring esperado en mensaje (opcional)
 *
 * @example
 * ```typescript
 * const response = await authPost('/api/clientes', token, {});
 * expectErrorResponse(response, 400, 'nombre es requerido');
 * ```
 */
export function expectErrorResponse(
  response: Response,
  expectedStatus: number = 400,
  expectedMessage?: string
): void {
  expect(response.status).toBe(expectedStatus);
  expect(response.body).toHaveProperty('message');

  if (expectedMessage) {
    const errorMsg = getErrorMessage(response);
    expect(errorMsg.toLowerCase()).toContain(expectedMessage.toLowerCase());
  }
}

// ============================================================================
// FUNCIONES DE ESPERA / POLLING
// ============================================================================

/**
 * Esperar hasta que una condición sea verdadera (polling)
 * Útil para tests asíncronos
 *
 * @param condition - Función que retorna booleano o Promise<boolean>
 * @param timeout - Timeout en milisegundos (default: 5000)
 * @param interval - Intervalo de polling en ms (default: 100)
 * @returns true si condición se cumplió, false si timeout
 *
 * @example
 * ```typescript
 * // Esperar que un turno sea procesado
 * const success = await waitFor(async () => {
 *   const turno = await getTurno(turnoId);
 *   return turno.procesado_nomina === true;
 * }, 10000);
 * expect(success).toBe(true);
 * ```
 */
export async function waitFor(
  condition: () => boolean | Promise<boolean>,
  timeout: number = 5000,
  interval: number = 100
): Promise<boolean> {
  const startTime = Date.now();

  while (Date.now() - startTime < timeout) {
    try {
      const result = await condition();
      if (result) {
        return true;
      }
    } catch (error) {
      // Ignorar errores durante polling
    }

    // Esperar antes de siguiente intento
    await sleep(interval);
  }

  return false;
}

/**
 * Esperar N milisegundos
 * Utility para tests asíncronos
 *
 * @param ms - Milisegundos a esperar
 *
 * @example
 * ```typescript
 * await sleep(1000); // Esperar 1 segundo
 * ```
 */
export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Reintentar una operación hasta que tenga éxito
 * Útil para operaciones que pueden fallar temporalmente
 *
 * @param operation - Función a ejecutar
 * @param maxRetries - Máximo de intentos (default: 3)
 * @param delay - Delay entre intentos en ms (default: 1000)
 * @returns Resultado de la operación
 * @throws Error si todos los intentos fallan
 *
 * @example
 * ```typescript
 * const response = await retry(
 *   () => authGet('/api/usuarios', token),
 *   3,
 *   500
 * );
 * ```
 */
export async function retry<T>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
  delay: number = 1000
): Promise<T> {
  let lastError: Error;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error as Error;

      if (attempt < maxRetries) {
        await sleep(delay);
      }
    }
  }

  throw new Error(
    `Operation failed after ${maxRetries} attempts: ${lastError!.message}`
  );
}

// ============================================================================
// FUNCIONES DE VALIDACIÓN
// ============================================================================

/**
 * Verificar que respuesta es exitosa (200-299)
 *
 * @param response - Response de Supertest
 *
 * @example
 * ```typescript
 * const response = await authGet('/api/usuarios', token);
 * expectSuccess(response);
 * ```
 */
export function expectSuccess(response: Response): void {
  expect(response.status).toBeGreaterThanOrEqual(200);
  expect(response.status).toBeLessThan(300);
}

/**
 * Verificar que respuesta es 401 Unauthorized
 *
 * @param response - Response de Supertest
 *
 * @example
 * ```typescript
 * const response = await request(app).get('/api/usuarios'); // Sin token
 * expectUnauthorized(response);
 * ```
 */
export function expectUnauthorized(response: Response): void {
  expect(response.status).toBe(401);
  expect(response.body).toHaveProperty('message');
}

/**
 * Verificar que respuesta es 403 Forbidden
 *
 * @param response - Response de Supertest
 *
 * @example
 * ```typescript
 * // Usuario sin permisos intentando acceder a endpoint ADMIN
 * const response = await authDelete('/api/usuarios/1', consultaToken);
 * expectForbidden(response);
 * ```
 */
export function expectForbidden(response: Response): void {
  expect(response.status).toBe(403);
  expect(response.body).toHaveProperty('message');
}

/**
 * Verificar que respuesta es 404 Not Found
 *
 * @param response - Response de Supertest
 *
 * @example
 * ```typescript
 * const response = await authGet('/api/clientes/99999', token);
 * expectNotFound(response);
 * ```
 */
export function expectNotFound(response: Response): void {
  expect(response.status).toBe(404);
  expect(response.body).toHaveProperty('message');
}

/**
 * Verificar que respuesta es 409 Conflict
 * Típicamente usado para duplicados
 *
 * @param response - Response de Supertest
 *
 * @example
 * ```typescript
 * // Intentar crear cliente con RUC duplicado
 * const response = await authPost('/api/clientes', token, { ruc: '123' });
 * expectConflict(response);
 * ```
 */
export function expectConflict(response: Response): void {
  expect(response.status).toBe(409);
  expect(response.body).toHaveProperty('message');
}

/**
 * Verificar que respuesta tiene estructura de paginación válida
 *
 * @param response - Response de Supertest
 *
 * @example
 * ```typescript
 * const response = await authGet('/api/clientes', token);
 * expectPaginatedResponse(response);
 * ```
 */
export function expectPaginatedResponse(response: Response): void {
  expectSuccess(response);
  expect(response.body).toHaveProperty('data');
  expect(response.body).toHaveProperty('total');
  expect(Array.isArray(response.body.data)).toBe(true);
  expect(typeof response.body.total).toBe('number');
}

/**
 * Verificar que respuesta es CSV válido
 *
 * @param response - Response de Supertest
 *
 * @example
 * ```typescript
 * const response = await authPost('/api/reportes/nomina', token, {...});
 * expectCSVResponse(response);
 * ```
 */
export function expectCSVResponse(response: Response): void {
  expectSuccess(response);
  expect(response.headers['content-type']).toContain('text/csv');
  expect(response.headers['content-disposition']).toContain('attachment');
  expect(response.text).toBeTruthy();
  expect(response.text.split('\n').length).toBeGreaterThan(1);
}

// ============================================================================
// FUNCIONES DE COMPARACIÓN
// ============================================================================

/**
 * Comparar dos objetos ignorando campos específicos
 * Útil para comparar objetos de BD que tienen created_at, updated_at, etc.
 *
 * @param obj1 - Primer objeto
 * @param obj2 - Segundo objeto
 * @param ignoreFields - Array de campos a ignorar
 * @returns true si los objetos son iguales (ignorando campos especificados)
 *
 * @example
 * ```typescript
 * const cliente1 = await getCliente(1);
 * const cliente2 = { ...dataEnviada, id: 1 };
 * expect(objectsEqual(cliente1, cliente2, ['created_at', 'updated_at'])).toBe(true);
 * ```
 */
export function objectsEqual(
  obj1: any,
  obj2: any,
  ignoreFields: string[] = []
): boolean {
  const filtered1 = { ...obj1 };
  const filtered2 = { ...obj2 };

  ignoreFields.forEach(field => {
    delete filtered1[field];
    delete filtered2[field];
  });

  return JSON.stringify(filtered1) === JSON.stringify(filtered2);
}

/**
 * Verificar que objeto contiene todas las propiedades esperadas
 *
 * @param obj - Objeto a verificar
 * @param expectedProps - Array de propiedades esperadas
 *
 * @example
 * ```typescript
 * const cliente = response.body;
 * expectObjectProps(cliente, ['id', 'nombre', 'ruc', 'activo']);
 * ```
 */
export function expectObjectProps(obj: any, expectedProps: string[]): void {
  expectedProps.forEach(prop => {
    expect(obj).toHaveProperty(prop);
  });
}

/**
 * Verificar que array de objetos tiene propiedades esperadas
 *
 * @param array - Array de objetos
 * @param expectedProps - Array de propiedades esperadas
 *
 * @example
 * ```typescript
 * const { data } = parsePaginatedResponse(response);
 * expectArrayProps(data, ['id', 'nombre', 'activo']);
 * ```
 */
export function expectArrayProps(array: any[], expectedProps: string[]): void {
  expect(array.length).toBeGreaterThan(0);
  array.forEach(item => {
    expectObjectProps(item, expectedProps);
  });
}

// ============================================================================
// FUNCIONES DE GENERACIÓN DE DATOS
// ============================================================================

/**
 * Generar RUC aleatorio válido (9 dígitos)
 * Para tests de clientes
 *
 * @returns RUC de 9 dígitos
 *
 * @example
 * ```typescript
 * const cliente = {
 *   nombre: 'Cliente Test',
 *   ruc: generateRandomRUC()
 * };
 * ```
 */
export function generateRandomRUC(): string {
  const num = Math.floor(100000000 + Math.random() * 900000000);
  return num.toString();
}

/**
 * Generar código único para tests
 * Formato: PREFIX_TIMESTAMP_RANDOM
 *
 * @param prefix - Prefijo del código (default: 'TEST')
 * @returns Código único
 *
 * @example
 * ```typescript
 * const ubicacion = {
 *   codigo: generateUniqueCode('UB'),
 *   nombre: 'Ubicación Test'
 * };
 * ```
 */
export function generateUniqueCode(prefix: string = 'TEST'): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 7).toUpperCase();
  return `${prefix}_${timestamp}_${random}`;
}

/**
 * Generar email de prueba único
 *
 * @param username - Username base (default: 'test')
 * @returns Email único
 *
 * @example
 * ```typescript
 * const usuario = {
 *   username: 'user_test',
 *   email: generateTestEmail('user_test')
 * };
 * ```
 */
export function generateTestEmail(username: string = 'test'): string {
  const timestamp = Date.now();
  return `${username}_${timestamp}@test.com`;
}
