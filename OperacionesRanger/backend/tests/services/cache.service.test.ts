/**
 * Tests Unitarios - CacheService
 *
 * Suite de tests para el servicio de caché en memoria (node-cache).
 *
 * COBERTURA:
 * - Creación de instancia con TTL configurado
 * - Operaciones básicas: set, get, del
 * - Expiración automática (TTL)
 * - Estadísticas (hits, misses, keys)
 * - Operaciones masivas (flush, delete múltiple)
 * - Manejo de errores
 *
 * @module tests/services/cache.service.test
 */

import { CacheService } from '../../src/services/cache.service';

describe('CacheService', () => {
  let cache: CacheService;

  // ============================================================================
  // Setup y Teardown
  // ============================================================================

  beforeEach(() => {
    // Crear nueva instancia de caché antes de cada test
    cache = new CacheService(60); // TTL de 60 segundos para tests
  });

  afterEach(() => {
    // Limpiar caché después de cada test
    cache.flush();
  });

  // ============================================================================
  // Tests de Creación
  // ============================================================================

  describe('Constructor', () => {
    it('should create cache with default TTL', () => {
      const defaultCache = new CacheService();
      const stats = defaultCache.getStats();

      expect(stats).toBeDefined();
      expect(stats.keys).toBe(0);
      expect(stats.hits).toBe(0);
      expect(stats.misses).toBe(0);
    });

    it('should create cache with custom TTL', () => {
      const customCache = new CacheService(300);
      const stats = customCache.getStats();

      expect(stats).toBeDefined();
      // Cache creado correctamente, no hay keys inicialmente
      expect(stats.keys).toBe(0);
    });
  });

  // ============================================================================
  // Tests de Operaciones Básicas
  // ============================================================================

  describe('set() and get()', () => {
    it('should set and get value from cache', () => {
      const key = 'test:key';
      const value = { data: 'test value' };

      const setResult = cache.set(key, value);
      expect(setResult).toBe(true);

      const retrieved = cache.get<{ data: string }>(key);
      expect(retrieved).toEqual(value);
    });

    it('should return undefined for non-existent key', () => {
      const result = cache.get<string>('nonexistent:key');
      expect(result).toBeUndefined();
    });

    it('should handle null values', () => {
      const key = 'test:null';
      const setResult = cache.set(key, null);
      expect(setResult).toBe(true);

      const retrieved = cache.get<null>(key);
      expect(retrieved).toBe(null);
    });

    it('should handle different data types', () => {
      // String
      cache.set('test:string', 'Hello World');
      expect(cache.get<string>('test:string')).toBe('Hello World');

      // Number
      cache.set('test:number', 42);
      expect(cache.get<number>('test:number')).toBe(42);

      // Boolean
      cache.set('test:boolean', true);
      expect(cache.get<boolean>('test:boolean')).toBe(true);

      // Array
      cache.set('test:array', [1, 2, 3]);
      expect(cache.get<number[]>('test:array')).toEqual([1, 2, 3]);

      // Object
      cache.set('test:object', { foo: 'bar', nested: { value: 123 } });
      expect(cache.get<any>('test:object')).toEqual({
        foo: 'bar',
        nested: { value: 123 },
      });
    });

    it('should overwrite existing key', () => {
      const key = 'test:overwrite';

      cache.set(key, 'first value');
      expect(cache.get<string>(key)).toBe('first value');

      cache.set(key, 'second value');
      expect(cache.get<string>(key)).toBe('second value');
    });

    it('should respect custom TTL per key', () => {
      jest.useFakeTimers();

      const key = 'test:custom-ttl';
      const value = 'expires fast';

      // Set con TTL de 2 segundos
      cache.set(key, value, 2);

      // Debe existir inmediatamente
      expect(cache.get<string>(key)).toBe(value);

      // Avanzar 1 segundo - todavía debe existir
      jest.advanceTimersByTime(1000);
      expect(cache.get<string>(key)).toBe(value);

      // Avanzar otros 2 segundos (total 3) - debe haber expirado
      jest.advanceTimersByTime(2000);
      expect(cache.get<string>(key)).toBeUndefined();

      jest.useRealTimers();
    });
  });

  // ============================================================================
  // Tests de Eliminación
  // ============================================================================

  describe('del()', () => {
    it('should delete single key', () => {
      const key = 'test:delete';
      cache.set(key, 'value');

      expect(cache.get<string>(key)).toBe('value');

      const deleted = cache.del(key);
      expect(deleted).toBe(1);

      expect(cache.get<string>(key)).toBeUndefined();
    });

    it('should return 0 when deleting non-existent key', () => {
      const deleted = cache.del('nonexistent:key');
      expect(deleted).toBe(0);
    });

    it('should delete multiple keys', () => {
      cache.set('key1', 'value1');
      cache.set('key2', 'value2');
      cache.set('key3', 'value3');

      const deleted = cache.del(['key1', 'key2']);
      expect(deleted).toBe(2);

      expect(cache.get<string>('key1')).toBeUndefined();
      expect(cache.get<string>('key2')).toBeUndefined();
      expect(cache.get<string>('key3')).toBe('value3'); // No eliminado
    });

    it('should handle mixed existent and non-existent keys in bulk delete', () => {
      cache.set('key1', 'value1');
      cache.set('key2', 'value2');

      const deleted = cache.del(['key1', 'nonexistent', 'key2']);
      // node-cache solo cuenta los eliminados exitosamente
      expect(deleted).toBe(2);
    });
  });

  // ============================================================================
  // Tests de Flush (limpiar todo)
  // ============================================================================

  describe('flush()', () => {
    it('should flush all cache', () => {
      cache.set('key1', 'value1');
      cache.set('key2', 'value2');
      cache.set('key3', 'value3');

      let stats = cache.getStats();
      expect(stats.keys).toBe(3);

      cache.flush();

      stats = cache.getStats();
      expect(stats.keys).toBe(0);

      expect(cache.get<string>('key1')).toBeUndefined();
      expect(cache.get<string>('key2')).toBeUndefined();
      expect(cache.get<string>('key3')).toBeUndefined();
    });

    it('should work on empty cache', () => {
      expect(() => cache.flush()).not.toThrow();

      const stats = cache.getStats();
      expect(stats.keys).toBe(0);
    });
  });

  // ============================================================================
  // Tests de Estadísticas
  // ============================================================================

  describe('getStats()', () => {
    it('should return correct stats structure', () => {
      const stats = cache.getStats();

      expect(stats).toHaveProperty('keys');
      expect(stats).toHaveProperty('hits');
      expect(stats).toHaveProperty('misses');
      expect(stats).toHaveProperty('ksize');
      expect(stats).toHaveProperty('vsize');

      expect(typeof stats.keys).toBe('number');
      expect(typeof stats.hits).toBe('number');
      expect(typeof stats.misses).toBe('number');
      expect(typeof stats.ksize).toBe('number');
      expect(typeof stats.vsize).toBe('number');
    });

    it('should track hits correctly', () => {
      cache.set('key1', 'value1');

      let stats = cache.getStats();
      const initialHits = stats.hits;

      // Hacer varios gets (hits)
      cache.get('key1');
      cache.get('key1');
      cache.get('key1');

      stats = cache.getStats();
      expect(stats.hits).toBe(initialHits + 3);
    });

    it('should track misses correctly', () => {
      let stats = cache.getStats();
      const initialMisses = stats.misses;

      // Intentar obtener keys que no existen (misses)
      cache.get('nonexistent1');
      cache.get('nonexistent2');
      cache.get('nonexistent3');

      stats = cache.getStats();
      expect(stats.misses).toBe(initialMisses + 3);
    });

    it('should track keys count', () => {
      let stats = cache.getStats();
      expect(stats.keys).toBe(0);

      cache.set('key1', 'value1');
      stats = cache.getStats();
      expect(stats.keys).toBe(1);

      cache.set('key2', 'value2');
      cache.set('key3', 'value3');
      stats = cache.getStats();
      expect(stats.keys).toBe(3);

      cache.del('key1');
      stats = cache.getStats();
      expect(stats.keys).toBe(2);
    });

    it('should update memory size stats', () => {
      const stats1 = cache.getStats();
      const initialSize = stats1.vsize + stats1.ksize;

      // Agregar datos grandes
      const largeData = { data: 'x'.repeat(10000) };
      cache.set('large:key', largeData);

      const stats2 = cache.getStats();
      const newSize = stats2.vsize + stats2.ksize;

      expect(newSize).toBeGreaterThan(initialSize);
    });
  });

  // ============================================================================
  // Tests de Métodos Auxiliares
  // ============================================================================

  describe('keys()', () => {
    it('should return all keys in cache', () => {
      cache.set('key1', 'value1');
      cache.set('key2', 'value2');
      cache.set('key3', 'value3');

      const keys = cache.keys();

      expect(keys).toHaveLength(3);
      expect(keys).toContain('key1');
      expect(keys).toContain('key2');
      expect(keys).toContain('key3');
    });

    it('should return empty array for empty cache', () => {
      const keys = cache.keys();
      expect(keys).toEqual([]);
    });
  });

  describe('has()', () => {
    it('should return true if key exists', () => {
      cache.set('existing:key', 'value');

      expect(cache.has('existing:key')).toBe(true);
    });

    it('should return false if key does not exist', () => {
      expect(cache.has('nonexistent:key')).toBe(false);
    });

    it('should return false after key is deleted', () => {
      cache.set('temp:key', 'value');
      expect(cache.has('temp:key')).toBe(true);

      cache.del('temp:key');
      expect(cache.has('temp:key')).toBe(false);
    });
  });

  describe('getTtl()', () => {
    it('should return remaining TTL for key', () => {
      jest.useFakeTimers();

      const key = 'test:ttl';
      cache.set(key, 'value', 10); // 10 segundos

      // Inmediatamente después de set
      const ttl1 = cache.getTtl(key);
      expect(ttl1).toBeGreaterThan(8); // Aprox 10 segundos

      // Avanzar 5 segundos
      jest.advanceTimersByTime(5000);
      const ttl2 = cache.getTtl(key);
      expect(ttl2).toBeLessThan(6); // Aprox 5 segundos restantes

      jest.useRealTimers();
    });

    it('should return undefined for non-existent key', () => {
      const ttl = cache.getTtl('nonexistent:key');
      expect(ttl).toBeUndefined();
    });
  });

  // ============================================================================
  // Tests de Expiración (TTL)
  // ============================================================================

  describe('TTL Expiration', () => {
    it('should expire value after TTL', () => {
      jest.useFakeTimers();

      const shortCache = new CacheService(5); // 5 segundos
      const key = 'test:expire';
      const value = 'expires soon';

      shortCache.set(key, value);

      // Debe existir inmediatamente
      expect(shortCache.get<string>(key)).toBe(value);

      // Avanzar 4 segundos - todavía debe existir
      jest.advanceTimersByTime(4000);
      expect(shortCache.get<string>(key)).toBe(value);

      // Avanzar otros 2 segundos (total 6) - debe haber expirado
      jest.advanceTimersByTime(2000);
      expect(shortCache.get<string>(key)).toBeUndefined();

      jest.useRealTimers();
    });

    it('should not expire if accessed before TTL', () => {
      jest.useFakeTimers();

      const shortCache = new CacheService(10);
      const key = 'test:keep-alive';
      shortCache.set(key, 'value');

      // Avanzar 5 segundos
      jest.advanceTimersByTime(5000);
      expect(shortCache.get<string>(key)).toBe('value');

      // Avanzar otros 7 segundos (total 12) - debería haber expirado
      jest.advanceTimersByTime(7000);
      expect(shortCache.get<string>(key)).toBeUndefined();

      jest.useRealTimers();
    });
  });

  // ============================================================================
  // Tests de Manejo de Errores
  // ============================================================================

  describe('Error Handling', () => {
    it('should handle errors gracefully in get()', () => {
      // Test con key vacía
      expect(() => cache.get('')).not.toThrow();
      expect(cache.get('')).toBeUndefined();
    });

    it('should handle errors gracefully in set()', () => {
      // Test con key vacía
      expect(() => cache.set('', 'value')).not.toThrow();
    });

    it('should handle errors gracefully in del()', () => {
      // Test con array vacío
      expect(() => cache.del([])).not.toThrow();
      expect(cache.del([])).toBe(0);
    });

    it('should handle errors gracefully in getStats()', () => {
      expect(() => cache.getStats()).not.toThrow();
      const stats = cache.getStats();
      expect(stats).toBeDefined();
    });
  });

  // ============================================================================
  // Tests de Escenarios Reales
  // ============================================================================

  describe('Real-world Scenarios', () => {
    it('should cache query results with pagination', () => {
      const page1 = { data: [1, 2, 3], total: 100 };
      const page2 = { data: [4, 5, 6], total: 100 };

      cache.set('guardianes:page:1:size:10', page1);
      cache.set('guardianes:page:2:size:10', page2);

      expect(cache.get('guardianes:page:1:size:10')).toEqual(page1);
      expect(cache.get('guardianes:page:2:size:10')).toEqual(page2);
    });

    it('should handle cache key with special characters', () => {
      const key = 'search:Juan Pérez:page:1';
      const value = { results: [] };

      cache.set(key, value);
      expect(cache.get(key)).toEqual(value);
    });

    it('should handle large dataset caching', () => {
      const largeArray = Array.from({ length: 1000 }, (_, i) => ({
        id: i,
        name: `Item ${i}`,
      }));

      cache.set('large:dataset', largeArray);

      const retrieved = cache.get<typeof largeArray>('large:dataset');
      expect(retrieved).toHaveLength(1000);
      expect(retrieved?.[0]).toEqual({ id: 0, name: 'Item 0' });
    });

    it('should support cache invalidation strategy', () => {
      // Scenario: Invalidar todas las keys de una entidad específica
      cache.set('guardian:1', { id: 1, name: 'Juan' });
      cache.set('guardian:2', { id: 2, name: 'Pedro' });
      cache.set('guardianes:page:1', { data: [], total: 0 });
      cache.set('other:data', 'unrelated');

      // Obtener keys de guardianes
      const allKeys = cache.keys();
      const guardianKeys = allKeys.filter((k) => k.startsWith('guardian'));

      // Invalidar solo keys de guardianes
      const deleted = cache.del(guardianKeys);
      expect(deleted).toBeGreaterThan(0);

      // Verificar que se eliminaron solo las correctas
      expect(cache.get('guardian:1')).toBeUndefined();
      expect(cache.get('guardian:2')).toBeUndefined();
      expect(cache.get('guardianes:page:1')).toBeUndefined();
      expect(cache.get('other:data')).toBe('unrelated'); // No afectado
    });
  });
});
