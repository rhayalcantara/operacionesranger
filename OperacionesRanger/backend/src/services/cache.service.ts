/**
 * Servicio de Caché - Sistema de Gestión de Turnos
 *
 * Servicio genérico de caché en memoria usando node-cache.
 * Proporciona operaciones básicas de cache con TTL configurable.
 *
 * CARACTERÍSTICAS:
 * - TTL configurable por instancia
 * - TTL personalizable por clave
 * - Estadísticas de hits/misses
 * - Limpieza automática de claves expiradas
 * - Gestión de memoria eficiente
 *
 * @module services/cache.service
 */

import NodeCache from 'node-cache';

/**
 * Constantes de configuración de caché
 */
export const CACHE_CONSTANTS = {
  /** TTL por defecto: 5 minutos (300 segundos) */
  DEFAULT_TTL: 300,

  /** Período de chequeo para limpieza automática: 10 minutos (600 segundos) */
  CHECK_PERIOD: 600,
};

/**
 * Estadísticas del caché
 */
export interface CacheStats {
  /** Número de claves en caché */
  keys: number;

  /** Número de hits (aciertos) */
  hits: number;

  /** Número de misses (fallos) */
  misses: number;

  /** Tamaño aproximado de claves (bytes) */
  ksize: number;

  /** Tamaño aproximado de valores (bytes) */
  vsize: number;
}

/**
 * Servicio de Caché Genérico
 *
 * Encapsula node-cache con API simplificada y tipado TypeScript.
 * Puede ser usado para cualquier tipo de datos con tipado genérico.
 *
 * @example
 * ```typescript
 * // Crear caché con TTL de 5 minutos
 * const cache = new CacheService(300);
 *
 * // Guardar valor
 * cache.set('key1', { data: 'value' });
 *
 * // Obtener valor
 * const value = cache.get<{ data: string }>('key1');
 *
 * // Limpiar todo
 * cache.flush();
 * ```
 */
export class CacheService {
  private cache: NodeCache;
  private ttlSeconds: number;

  /**
   * Crear instancia de CacheService
   *
   * @param ttlSeconds - Time To Live en segundos (default: 300)
   */
  constructor(ttlSeconds: number = CACHE_CONSTANTS.DEFAULT_TTL) {
    this.ttlSeconds = ttlSeconds;
    this.cache = new NodeCache({
      stdTTL: ttlSeconds,
      checkperiod: CACHE_CONSTANTS.CHECK_PERIOD,
      useClones: false, // Mejora performance, pero requiere cuidado con mutaciones
    });

    console.log(
      `[Cache] Instancia creada con TTL=${ttlSeconds}s, checkPeriod=${CACHE_CONSTANTS.CHECK_PERIOD}s`
    );
  }

  /**
   * Obtener valor del caché por clave
   *
   * @param key - Clave del caché
   * @returns Valor si existe, undefined si no existe o expiró
   *
   * @example
   * ```typescript
   * const user = cache.get<User>('user:123');
   * if (user) {
   *   console.log(`User found: ${user.name}`);
   * } else {
   *   console.log('User not in cache');
   * }
   * ```
   */
  get<T>(key: string): T | undefined {
    try {
      const value = this.cache.get<T>(key);

      if (value !== undefined) {
        console.log(`[Cache] HIT: ${key}`);
      } else {
        console.log(`[Cache] MISS: ${key}`);
      }

      return value;
    } catch (error) {
      console.error(`[Cache] Error getting key "${key}":`, error);
      return undefined;
    }
  }

  /**
   * Guardar valor en caché
   *
   * @param key - Clave del caché
   * @param value - Valor a almacenar
   * @param ttl - TTL personalizado en segundos (opcional, usa default si no se proporciona)
   * @returns true si se guardó exitosamente, false en caso contrario
   *
   * @example
   * ```typescript
   * // Guardar con TTL default (300s)
   * cache.set('user:123', { id: 123, name: 'John' });
   *
   * // Guardar con TTL personalizado (60s)
   * cache.set('temp:data', { temp: true }, 60);
   * ```
   */
  set<T>(key: string, value: T, ttl?: number): boolean {
    try {
      const effectiveTTL = ttl ?? this.ttlSeconds;
      const success = this.cache.set(key, value, effectiveTTL);

      if (success) {
        console.log(`[Cache] SET: ${key} (TTL=${effectiveTTL}s)`);
      } else {
        console.warn(`[Cache] FAILED SET: ${key}`);
      }

      return success;
    } catch (error) {
      console.error(`[Cache] Error setting key "${key}":`, error);
      return false;
    }
  }

  /**
   * Eliminar clave(s) del caché
   *
   * @param keys - Clave única o array de claves a eliminar
   * @returns Número de claves eliminadas
   *
   * @example
   * ```typescript
   * // Eliminar una clave
   * const deleted = cache.del('user:123');
   *
   * // Eliminar múltiples claves
   * const deleted = cache.del(['user:123', 'user:456']);
   * console.log(`Deleted ${deleted} keys`);
   * ```
   */
  del(keys: string | string[]): number {
    try {
      const deleted = this.cache.del(keys);

      if (Array.isArray(keys)) {
        console.log(`[Cache] DELETED: ${deleted} keys (requested: ${keys.length})`);
      } else {
        console.log(`[Cache] DELETED: ${keys} (success: ${deleted === 1})`);
      }

      return deleted;
    } catch (error) {
      console.error(`[Cache] Error deleting keys:`, error);
      return 0;
    }
  }

  /**
   * Limpiar todo el caché
   *
   * Elimina todas las claves del caché inmediatamente.
   *
   * @example
   * ```typescript
   * cache.flush();
   * console.log('Cache cleared');
   * ```
   */
  flush(): void {
    try {
      const keysBefore = this.cache.keys().length;
      this.cache.flushAll();
      console.log(`[Cache] FLUSH: ${keysBefore} keys deleted`);
    } catch (error) {
      console.error(`[Cache] Error flushing cache:`, error);
    }
  }

  /**
   * Obtener estadísticas del caché
   *
   * Retorna información sobre el estado actual del caché:
   * - Número de claves
   * - Hits (aciertos)
   * - Misses (fallos)
   * - Tamaño de memoria (estimado)
   *
   * @returns Objeto con estadísticas del caché
   *
   * @example
   * ```typescript
   * const stats = cache.getStats();
   * console.log(`Cache keys: ${stats.keys}`);
   * console.log(`Hit rate: ${(stats.hits / (stats.hits + stats.misses) * 100).toFixed(2)}%`);
   * console.log(`Memory: ${(stats.vsize / 1024).toFixed(2)} KB`);
   * ```
   */
  getStats(): CacheStats {
    try {
      const stats = this.cache.getStats();

      return {
        keys: stats.keys,
        hits: stats.hits,
        misses: stats.misses,
        ksize: stats.ksize,
        vsize: stats.vsize,
      };
    } catch (error) {
      console.error(`[Cache] Error getting stats:`, error);
      return {
        keys: 0,
        hits: 0,
        misses: 0,
        ksize: 0,
        vsize: 0,
      };
    }
  }

  /**
   * Obtener todas las claves del caché
   *
   * @returns Array de claves actualmente en caché
   *
   * @example
   * ```typescript
   * const keys = cache.keys();
   * console.log(`Cache contains ${keys.length} keys`);
   * ```
   */
  keys(): string[] {
    try {
      return this.cache.keys();
    } catch (error) {
      console.error(`[Cache] Error getting keys:`, error);
      return [];
    }
  }

  /**
   * Verificar si una clave existe en caché
   *
   * @param key - Clave a verificar
   * @returns true si la clave existe, false en caso contrario
   *
   * @example
   * ```typescript
   * if (cache.has('user:123')) {
   *   console.log('User is cached');
   * }
   * ```
   */
  has(key: string): boolean {
    try {
      return this.cache.has(key);
    } catch (error) {
      console.error(`[Cache] Error checking key "${key}":`, error);
      return false;
    }
  }

  /**
   * Obtener TTL restante de una clave
   *
   * @param key - Clave a verificar
   * @returns Segundos restantes de TTL, undefined si no existe o no tiene TTL
   *
   * @example
   * ```typescript
   * const ttl = cache.getTtl('user:123');
   * if (ttl !== undefined) {
   *   console.log(`Key expires in ${Math.floor(ttl / 1000)} seconds`);
   * }
   * ```
   */
  getTtl(key: string): number | undefined {
    try {
      const ttl = this.cache.getTtl(key);
      return ttl ? Math.floor((ttl - Date.now()) / 1000) : undefined;
    } catch (error) {
      console.error(`[Cache] Error getting TTL for key "${key}":`, error);
      return undefined;
    }
  }
}
