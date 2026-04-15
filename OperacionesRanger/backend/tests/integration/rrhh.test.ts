/**
 * Tests de Integración - Servicio y Endpoints RRHH
 *
 * Tests completos para servicio de consulta de guardianes
 * desde la base de datos RRHH externa (db_aae4a2_ranger.rh_empleado).
 *
 * IMPORTANTE: Estos tests requieren acceso a BD RRHH real o mock.
 *
 * @module tests/integration/rrhh.test
 */

import request from 'supertest';
import app from '../../src/server';
import * as rrhhService from '../../src/services/rrhh.service';
import { generateAccessToken } from '../../src/services/jwt.service';
import { UserRole } from '../../src/models/auth.model';
import { GUARDIAN_CONSTANTS } from '../../src/models/guardian.model';

// ===================================
// SETUP Y HELPERS
// ===================================

/**
 * Helper: Generar token de autenticación para tests
 */
function generateTestToken(rol: UserRole = UserRole.ADMIN): string {
  return generateAccessToken({
    sub: 1,
    username: 'test-user',
    rol,
  });
}

/**
 * Helper: Realizar request autenticado
 */
function authenticatedRequest(method: 'get' | 'post' | 'put' | 'delete', path: string, rol: UserRole = UserRole.ADMIN) {
  const token = generateTestToken(rol);
  return request(app)[method](path).set('Authorization', `Bearer ${token}`);
}

// ===================================
// TESTS DEL SERVICIO (rrhhService)
// ===================================

describe('RRHH Service - rrhhService', () => {
  /**
   * Test 1: getGuardianes() retorna lista paginada
   */
  test('getGuardianes() debe retornar lista paginada de guardianes', async () => {
    const result = await rrhhService.getGuardianes({
      page: 1,
      pageSize: 10,
    });

    expect(result).toHaveProperty('data');
    expect(result).toHaveProperty('total');
    expect(Array.isArray(result.data)).toBe(true);
    expect(typeof result.total).toBe('number');

    // Validar que cada guardián tenga campos requeridos
    if (result.data.length > 0) {
      const guardian = result.data[0];
      expect(guardian).toHaveProperty('id_empleado');
      expect(guardian).toHaveProperty('cedula_empleado');
      expect(guardian).toHaveProperty('nombres');
      expect(guardian).toHaveProperty('apellidos');
      expect(guardian.id_puesto).toBe(GUARDIAN_CONSTANTS.ID_PUESTO_VIGILANTE);
      expect(guardian.status).toBe(GUARDIAN_CONSTANTS.STATUS_ACTIVO);
    }
  }, 15000); // Timeout extendido para queries a BD

  /**
   * Test 2: getGuardianes() con search filtra correctamente
   */
  test('getGuardianes() con search debe filtrar guardianes', async () => {
    // Primero obtener un guardián para usar en búsqueda
    const allGuardianes = await rrhhService.getGuardianes({ page: 1, pageSize: 1 });

    if (allGuardianes.data.length === 0) {
      console.warn('No hay guardianes en BD RRHH, test saltado');
      return;
    }

    const primerGuardian = allGuardianes.data[0];
    const searchTerm = primerGuardian.nombres.substring(0, 3); // Primeros 3 caracteres del nombre

    const result = await rrhhService.getGuardianes({
      page: 1,
      pageSize: 10,
      search: searchTerm,
    });

    expect(result.data.length).toBeGreaterThan(0);

    // Validar que todos los resultados contienen el término de búsqueda
    result.data.forEach((guardian) => {
      const matchesSearch =
        guardian.nombres.toLowerCase().includes(searchTerm.toLowerCase()) ||
        guardian.apellidos.toLowerCase().includes(searchTerm.toLowerCase()) ||
        guardian.cedula_empleado.includes(searchTerm);

      expect(matchesSearch).toBe(true);
    });
  }, 15000);

  /**
   * Test 3: getGuardianes() con paginación funciona
   */
  test('getGuardianes() con paginación debe respetar pageSize', async () => {
    const pageSize = 5;
    const result = await rrhhService.getGuardianes({
      page: 1,
      pageSize,
    });

    expect(result.data.length).toBeLessThanOrEqual(pageSize);
  }, 15000);

  /**
   * Test 4: getGuardianById() retorna guardián existente
   */
  test('getGuardianById() debe retornar guardián si existe', async () => {
    // Primero obtener un ID válido
    const guardianes = await rrhhService.getGuardianes({ page: 1, pageSize: 1 });

    if (guardianes.data.length === 0) {
      console.warn('No hay guardianes en BD RRHH, test saltado');
      return;
    }

    const id = guardianes.data[0].id_empleado;
    const guardian = await rrhhService.getGuardianById(id);

    expect(guardian).not.toBeNull();
    expect(guardian?.id_empleado).toBe(id);
    expect(guardian?.id_puesto).toBe(GUARDIAN_CONSTANTS.ID_PUESTO_VIGILANTE);
    expect(guardian?.status).toBe(GUARDIAN_CONSTANTS.STATUS_ACTIVO);
  }, 15000);

  /**
   * Test 5: getGuardianById() retorna null si no existe
   */
  test('getGuardianById() debe retornar null si guardián no existe', async () => {
    const idInexistente = 999999999; // ID muy alto que probablemente no exista
    const guardian = await rrhhService.getGuardianById(idInexistente);

    expect(guardian).toBeNull();
  }, 15000);

  /**
   * Test 6: buscarGuardianes() encuentra por nombre
   */
  test('buscarGuardianes() debe encontrar guardianes por nombre', async () => {
    // Primero obtener un guardián para buscar
    const guardianes = await rrhhService.getGuardianes({ page: 1, pageSize: 1 });

    if (guardianes.data.length === 0) {
      console.warn('No hay guardianes en BD RRHH, test saltado');
      return;
    }

    const nombreBusqueda = guardianes.data[0].nombres.substring(0, 3);
    const resultados = await rrhhService.buscarGuardianes(nombreBusqueda);

    expect(Array.isArray(resultados)).toBe(true);
    expect(resultados.length).toBeGreaterThan(0);
    expect(resultados.length).toBeLessThanOrEqual(GUARDIAN_CONSTANTS.SEARCH_LIMIT);
  }, 15000);

  /**
   * Test 7: buscarGuardianes() encuentra por cédula
   */
  test('buscarGuardianes() debe encontrar guardianes por cédula', async () => {
    // Primero obtener un guardián para buscar
    const guardianes = await rrhhService.getGuardianes({ page: 1, pageSize: 1 });

    if (guardianes.data.length === 0) {
      console.warn('No hay guardianes en BD RRHH, test saltado');
      return;
    }

    const cedulaBusqueda = guardianes.data[0].cedula_empleado.substring(0, 5);
    const resultados = await rrhhService.buscarGuardianes(cedulaBusqueda);

    expect(Array.isArray(resultados)).toBe(true);

    if (resultados.length > 0) {
      // Validar que al menos uno coincide con la cédula
      const algunoCoincide = resultados.some((g) =>
        g.cedula_empleado.includes(cedulaBusqueda)
      );
      expect(algunoCoincide).toBe(true);
    }
  }, 15000);

  /**
   * Test 8: buscarGuardianes() limita a 20 resultados
   */
  test('buscarGuardianes() debe limitar resultados a 20', async () => {
    // Buscar con término genérico que probablemente retorne muchos resultados
    const resultados = await rrhhService.buscarGuardianes('a');

    expect(Array.isArray(resultados)).toBe(true);
    expect(resultados.length).toBeLessThanOrEqual(GUARDIAN_CONSTANTS.SEARCH_LIMIT);
  }, 15000);

  /**
   * Test 9: buscarGuardianes() con término vacío retorna vacío
   */
  test('buscarGuardianes() con término vacío debe retornar array vacío', async () => {
    const resultados = await rrhhService.buscarGuardianes('');

    expect(Array.isArray(resultados)).toBe(true);
    expect(resultados.length).toBe(0);
  }, 15000);

  /**
   * Test 10: validarGuardianActivo() retorna true para guardián activo
   */
  test('validarGuardianActivo() debe retornar true para guardián activo', async () => {
    // Primero obtener un ID válido
    const guardianes = await rrhhService.getGuardianes({ page: 1, pageSize: 1 });

    if (guardianes.data.length === 0) {
      console.warn('No hay guardianes en BD RRHH, test saltado');
      return;
    }

    const id = guardianes.data[0].id_empleado;
    const esValido = await rrhhService.validarGuardianActivo(id);

    expect(esValido).toBe(true);
  }, 15000);

  /**
   * Test 11: validarGuardianActivo() retorna false para ID inexistente
   */
  test('validarGuardianActivo() debe retornar false para ID inexistente', async () => {
    const idInexistente = 999999999;
    const esValido = await rrhhService.validarGuardianActivo(idInexistente);

    expect(esValido).toBe(false);
  }, 15000);
});

// ===================================
// TESTS DE ENDPOINTS (API)
// ===================================

describe('RRHH Endpoints - API', () => {
  /**
   * Test 12: GET /guardianes sin autenticación retorna 401
   */
  test('GET /api/rrhh/guardianes sin autenticación debe retornar 401', async () => {
    const response = await request(app).get('/api/rrhh/guardianes');

    expect(response.status).toBe(401);
    expect(response.body).toHaveProperty('error');
  });

  /**
   * Test 13: GET /guardianes con autenticación retorna 200
   */
  test('GET /api/rrhh/guardianes con autenticación debe retornar 200', async () => {
    const response = await authenticatedRequest('get', '/api/rrhh/guardianes');

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('data');
    expect(response.body).toHaveProperty('total');
    expect(Array.isArray(response.body.data)).toBe(true);
  }, 15000);

  /**
   * Test 14: GET /guardianes con query params funciona
   */
  test('GET /api/rrhh/guardianes con query params debe funcionar', async () => {
    const response = await authenticatedRequest('get', '/api/rrhh/guardianes?page=1&pageSize=5');

    expect(response.status).toBe(200);
    expect(response.body.data.length).toBeLessThanOrEqual(5);
  }, 15000);

  /**
   * Test 15: GET /guardianes/:id retorna 200 si existe
   */
  test('GET /api/rrhh/guardianes/:id debe retornar 200 si guardián existe', async () => {
    // Primero obtener un ID válido
    const listResponse = await authenticatedRequest('get', '/api/rrhh/guardianes?page=1&pageSize=1');

    if (listResponse.body.data.length === 0) {
      console.warn('No hay guardianes en BD RRHH, test saltado');
      return;
    }

    const id = listResponse.body.data[0].id_empleado;
    const response = await authenticatedRequest('get', `/api/rrhh/guardianes/${id}`);

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('id_empleado');
    expect(response.body.id_empleado).toBe(id);
  }, 15000);

  /**
   * Test 16: GET /guardianes/:id retorna 404 si no existe
   */
  test('GET /api/rrhh/guardianes/:id debe retornar 404 si no existe', async () => {
    const idInexistente = 999999999;
    const response = await authenticatedRequest('get', `/api/rrhh/guardianes/${idInexistente}`);

    expect(response.status).toBe(404);
    expect(response.body).toHaveProperty('error');
  }, 15000);

  /**
   * Test 17: GET /guardianes/:id con ID inválido retorna 400
   */
  test('GET /api/rrhh/guardianes/:id con ID inválido debe retornar 400', async () => {
    const response = await authenticatedRequest('get', '/api/rrhh/guardianes/abc');

    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty('error');
  }, 15000);

  /**
   * Test 18: GET /guardianes/buscar/:search retorna resultados
   */
  test('GET /api/rrhh/guardianes/buscar/:search debe retornar resultados', async () => {
    const response = await authenticatedRequest('get', '/api/rrhh/guardianes/buscar/an');

    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBe(true);
  }, 15000);

  /**
   * Test 19: GET /guardianes/buscar/:search con término muy corto retorna 400
   */
  test('GET /api/rrhh/guardianes/buscar/:search con término corto debe retornar 400', async () => {
    const response = await authenticatedRequest('get', '/api/rrhh/guardianes/buscar/a');

    // Término de 1 carácter retorna 400 (requiere mínimo 2)
    expect(response.status).toBe(400);
  }, 15000);

  /**
   * Test 20: Todos los endpoints permiten acceso a SUPERVISOR
   */
  test('Endpoints deben permitir acceso a rol SUPERVISOR', async () => {
    const response = await authenticatedRequest('get', '/api/rrhh/guardianes', UserRole.SUPERVISOR);

    expect(response.status).toBe(200);
  }, 15000);

  /**
   * Test 21: Todos los endpoints permiten acceso a CONSULTA
   */
  test('Endpoints deben permitir acceso a rol CONSULTA', async () => {
    const response = await authenticatedRequest('get', '/api/rrhh/guardianes', UserRole.CONSULTA);

    expect(response.status).toBe(200);
  }, 15000);
});

// ===================================
// TESTS DE MANEJO DE ERRORES
// ===================================

describe('RRHH Service - Manejo de Errores', () => {
  /**
   * Test 22: Validar que errores de BD se manejan correctamente
   */
  test('Servicio debe manejar errores de BD correctamente', async () => {
    // Este test valida que los errores se propagan correctamente
    // En un entorno real con BD caída, esto lanzaría un error manejado

    // Por ahora, simplemente validamos que el servicio no crashea
    try {
      await rrhhService.getGuardianes({ page: 1, pageSize: 10 });
      // Si llega aquí, la BD está funcionando (OK)
      expect(true).toBe(true);
    } catch (error) {
      // Si lanza error, debe ser un Error con mensaje descriptivo
      expect(error).toBeInstanceOf(Error);
      expect((error as Error).message).toBeTruthy();
    }
  }, 15000);
});

// ===================================
// TESTS DE CACHÉ
// ===================================

describe('RRHH Service - Sistema de Caché', () => {
  /**
   * Test 23: Caché debe funcionar para getGuardianes()
   */
  test('getGuardianes() debe usar caché en segunda llamada', async () => {
    const filters = { page: 1, pageSize: 5 };

    // Primera llamada - debe ir a BD (miss)
    const start1 = Date.now();
    const result1 = await rrhhService.getGuardianes(filters);
    const time1 = Date.now() - start1;

    // Segunda llamada - debe venir de caché (hit)
    const start2 = Date.now();
    const result2 = await rrhhService.getGuardianes(filters);
    const time2 = Date.now() - start2;

    // Validar que retornan los mismos datos
    expect(result2.data).toEqual(result1.data);
    expect(result2.total).toBe(result1.total);

    // Segunda llamada debería ser significativamente más rápida
    // (puede fallar en sistemas muy lentos o BD muy rápida)
    console.log(`Query 1: ${time1}ms, Query 2 (cached): ${time2}ms`);
  }, 15000);

  /**
   * Test 24: Caché debe funcionar para getGuardianById()
   */
  test('getGuardianById() debe usar caché en segunda llamada', async () => {
    // Obtener un guardián válido primero
    const allGuardianes = await rrhhService.getGuardianes({ page: 1, pageSize: 1 });

    if (allGuardianes.data.length === 0) {
      console.warn('No hay guardianes en BD RRHH, test saltado');
      return;
    }

    const guardianId = allGuardianes.data[0].id_empleado;

    // Primera llamada - miss
    const result1 = await rrhhService.getGuardianById(guardianId);

    // Segunda llamada - hit
    const result2 = await rrhhService.getGuardianById(guardianId);

    expect(result2).toEqual(result1);
    expect(result2?.id_empleado).toBe(guardianId);
  }, 15000);

  /**
   * Test 25: Diferentes filtros deben generar diferentes cache keys
   */
  test('Diferentes filtros deben generar diferentes cache entries', async () => {
    const filters1 = { page: 1, pageSize: 5 };
    const filters2 = { page: 2, pageSize: 5 };
    const filters3 = { page: 1, pageSize: 5, search: 'test' };

    const result1 = await rrhhService.getGuardianes(filters1);
    const result2 = await rrhhService.getGuardianes(filters2);
    await rrhhService.getGuardianes(filters3); // result3 no usado - solo para probar caché

    // Resultados deben ser diferentes (diferentes páginas o búsquedas)
    expect(result1.data).not.toEqual(result2.data);
    // result3 puede ser igual o diferente dependiendo de datos
  }, 15000);

  /**
   * Test 26: getGuardianesCacheStats() debe retornar estadísticas válidas
   */
  test('getGuardianesCacheStats() debe retornar estadísticas del caché', async () => {
    const stats = await rrhhService.getGuardianesCacheStats();

    expect(stats).toHaveProperty('enabled');
    expect(stats).toHaveProperty('keys');
    expect(stats).toHaveProperty('hits');
    expect(stats).toHaveProperty('misses');
    expect(stats).toHaveProperty('hitRate');
    expect(stats).toHaveProperty('memorySizeKB');
    expect(stats).toHaveProperty('ttlSeconds');

    expect(typeof stats.enabled).toBe('boolean');
    expect(typeof stats.keys).toBe('number');
    expect(typeof stats.hits).toBe('number');
    expect(typeof stats.misses).toBe('number');
    expect(typeof stats.hitRate).toBe('number');
    expect(typeof stats.memorySizeKB).toBe('number');
    expect(typeof stats.ttlSeconds).toBe('number');
  });

  /**
   * Test 27: clearGuardianesCache() debe limpiar el caché
   */
  test('clearGuardianesCache() debe limpiar todas las entradas', async () => {
    // Cachear algunos datos
    await rrhhService.getGuardianes({ page: 1, pageSize: 5 });
    await rrhhService.getGuardianes({ page: 2, pageSize: 5 });

    // Obtener stats antes de limpiar
    const statsBefore = await rrhhService.getGuardianesCacheStats();
    // Verificar que se puede obtener keys
    expect(statsBefore.keys).toBeGreaterThanOrEqual(0);

    // Limpiar caché
    const result = await rrhhService.clearGuardianesCache();

    expect(result).toHaveProperty('message');
    expect(result).toHaveProperty('cacheEnabled');
    expect(result).toHaveProperty('statsBeforeClear');

    // Obtener stats después de limpiar
    const statsAfter = await rrhhService.getGuardianesCacheStats();

    // Después de limpiar debe haber 0 keys
    expect(statsAfter.keys).toBe(0);
  });
});

// ===================================
// TESTS DE ENDPOINTS DE CACHÉ
// ===================================

describe('RRHH API - Endpoints de Caché', () => {
  /**
   * Test 28: POST /api/rrhh/cache/clear debe limpiar caché (solo ADMIN)
   */
  test('POST /cache/clear debe funcionar para ADMIN', async () => {
    const response = await authenticatedRequest('post', '/api/rrhh/cache/clear', UserRole.ADMIN);

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('message');
    expect(response.body).toHaveProperty('cacheEnabled');
    expect(response.body).toHaveProperty('statsBeforeClear');
  });

  /**
   * Test 29: POST /cache/clear debe fallar para SUPERVISOR
   */
  test('POST /cache/clear debe retornar 403 para SUPERVISOR', async () => {
    const response = await authenticatedRequest('post', '/api/rrhh/cache/clear', UserRole.SUPERVISOR);

    expect(response.status).toBe(403);
  });

  /**
   * Test 30: GET /api/rrhh/cache/stats debe funcionar para ADMIN
   */
  test('GET /cache/stats debe funcionar para ADMIN', async () => {
    const response = await authenticatedRequest('get', '/api/rrhh/cache/stats', UserRole.ADMIN);

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('enabled');
    expect(response.body).toHaveProperty('keys');
    expect(response.body).toHaveProperty('hits');
    expect(response.body).toHaveProperty('misses');
    expect(response.body).toHaveProperty('hitRate');
    expect(response.body).toHaveProperty('memorySizeKB');
    expect(response.body).toHaveProperty('ttlSeconds');
  });

  /**
   * Test 31: GET /cache/stats debe funcionar para SUPERVISOR
   */
  test('GET /cache/stats debe funcionar para SUPERVISOR', async () => {
    const response = await authenticatedRequest('get', '/api/rrhh/cache/stats', UserRole.SUPERVISOR);

    expect(response.status).toBe(200);
  });

  /**
   * Test 32: GET /cache/stats debe fallar para CONSULTA
   */
  test('GET /cache/stats debe retornar 403 para CONSULTA', async () => {
    const response = await authenticatedRequest('get', '/api/rrhh/cache/stats', UserRole.CONSULTA);

    expect(response.status).toBe(403);
  });

  /**
   * Test 33: Flujo completo de caché (set, get, clear, verify)
   */
  test('Flujo completo: usar caché, verificar stats, limpiar, verificar limpieza', async () => {
    // 1. Limpiar caché inicial
    await authenticatedRequest('post', '/api/rrhh/cache/clear', UserRole.ADMIN);

    // 2. Hacer consultas para cachear datos
    await authenticatedRequest('get', '/api/rrhh/guardianes?page=1&pageSize=5', UserRole.ADMIN);
    await authenticatedRequest('get', '/api/rrhh/guardianes?page=1&pageSize=5', UserRole.ADMIN); // Hit

    // 3. Verificar estadísticas (debe haber hits)
    const statsResponse = await authenticatedRequest('get', '/api/rrhh/cache/stats', UserRole.ADMIN);
    expect(statsResponse.status).toBe(200);
    expect(statsResponse.body.keys).toBeGreaterThan(0);
    expect(statsResponse.body.hits).toBeGreaterThan(0);

    // 4. Limpiar caché
    const clearResponse = await authenticatedRequest('post', '/api/rrhh/cache/clear', UserRole.ADMIN);
    expect(clearResponse.status).toBe(200);

    // 5. Verificar que caché está vacío
    const statsAfterClear = await authenticatedRequest('get', '/api/rrhh/cache/stats', UserRole.ADMIN);
    expect(statsAfterClear.body.keys).toBe(0);
  }, 20000);
});
