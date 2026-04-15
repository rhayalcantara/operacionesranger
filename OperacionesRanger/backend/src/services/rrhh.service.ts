/**
 * Servicio RRHH - Sistema de Gestión de Turnos
 *
 * Servicio para consultar información de empleados (guardianes de seguridad)
 * desde la base de datos RRHH externa (db_aae4a2_ranger.rh_empleado).
 *
 * IMPORTANTE:
 * - Acceso READ-ONLY a BD RRHH
 * - Filtro base: WHERE id_puesto = 97 AND status = 1
 * - Pool de conexión: getTurnosPool() de database.ts
 *
 * @module services/rrhh.service
 */

import { RowDataPacket } from 'mysql2/promise';
import { getTurnosPool } from '../config/database';
import {
  Guardian,
  GuardianDB,
  GuardianFilters,
  GuardianPaginatedResponse,
  transformGuardian,
  GUARDIAN_CONSTANTS,
} from '../models/guardian.model';
import { CacheService } from './cache.service';
import { env } from '../config/env';

/**
 * Instancia de caché para guardianes
 * TTL configurable desde variables de entorno
 */
const guardianesCache = new CacheService(env.cache.ttlSeconds);

/**
 * Flag para habilitar/deshabilitar caché desde variables de entorno
 */
const cacheEnabled = env.cache.enabled;

/**
 * Obtener lista de guardianes activos con paginación y búsqueda
 *
 * Retorna lista paginada de guardianes (id_puesto = 97, status = 1) con
 * capacidad de búsqueda por nombre, apellido o cédula.
 *
 * **Filtros aplicados automáticamente**:
 * - id_puesto = 97 (VIGILANTE DE SEGURIDAD)
 * - status = 1 (activo)
 *
 * **Búsqueda**:
 * Si se proporciona `search`, busca en:
 * - nombres (LIKE %search%)
 * - apellidos (LIKE %search%)
 * - cedula_empleado (LIKE %search%)
 *
 * @param filters - Filtros de búsqueda y paginación
 * @param filters.page - Número de página (default: 1)
 * @param filters.pageSize - Registros por página (default: 10, max: 100)
 * @param filters.search - Término de búsqueda opcional
 *
 * @returns Promise con { data: Guardian[], total: number }
 *
 * @throws Error si falla la conexión a BD RRHH o la query
 *
 * @example
 * ```typescript
 * // Listar primera página (10 registros)
 * const result = await getGuardianes({ page: 1, pageSize: 10 });
 * console.log(`Total guardianes: ${result.total}`);
 * console.log(`Guardianes en página 1: ${result.data.length}`);
 *
 * // Buscar guardianes con término "Juan"
 * const result = await getGuardianes({ page: 1, pageSize: 20, search: 'Juan' });
 * ```
 */
export async function getGuardianes(
  filters: GuardianFilters = {}
): Promise<GuardianPaginatedResponse> {
  const pool = getTurnosPool();

  // Validar y normalizar parámetros de paginación
  const page = Math.max(1, filters.page || 1);
  const pageSize = Math.min(
    GUARDIAN_CONSTANTS.MAX_PAGE_SIZE,
    Math.max(1, filters.pageSize || GUARDIAN_CONSTANTS.DEFAULT_PAGE_SIZE)
  );
  const offset = (page - 1) * pageSize;

  // Término de búsqueda (opcional)
  const search = filters.search?.trim() || '';

  // Generar cache key única para esta consulta
  const cacheKey = `guardianes:active:page:${page}:size:${pageSize}:search:${search}`;

  // Intentar obtener del caché primero (si está habilitado)
  if (cacheEnabled) {
    const cached = guardianesCache.get<GuardianPaginatedResponse>(cacheKey);
    if (cached) {
      console.log(`[RRHH] getGuardianes: Retornando desde caché (${cached.data.length} de ${cached.total})`);
      return cached;
    }
  }

  try {
    // Construir query base
    let whereClause = 'WHERE e.id_puesto = ? AND e.status = ?';
    const queryParams: any[] = [
      GUARDIAN_CONSTANTS.ID_PUESTO_VIGILANTE,
      GUARDIAN_CONSTANTS.STATUS_ACTIVO,
    ];

    // Agregar búsqueda si se proporciona
    if (search) {
      whereClause += ` AND (
        e.nombres LIKE ? OR
        e.apellidos LIKE ? OR
        e.cedula_empleado LIKE ?
      )`;
      const searchPattern = `%${search}%`;
      queryParams.push(searchPattern, searchPattern, searchPattern);
    }

    // Query para obtener total de registros
    const countQuery = `
      SELECT COUNT(*) AS total
      FROM rh_empleado e
      ${whereClause}
    `;

    const [countRows] = await pool.execute<RowDataPacket[]>(
      countQuery,
      queryParams
    );
    const total = countRows[0]?.total || 0;

    // Si no hay registros, retornar vacío
    if (total === 0) {
      return { data: [], total: 0 };
    }

    // Query para obtener registros paginados
    const dataQuery = `
      SELECT
        e.id_empleado,
        e.cedula_empleado AS codigo_empleado,
        e.cedula_empleado,
        e.nombres,
        e.apellidos,
        CONCAT(e.nombres, ' ', e.apellidos) AS nombre_completo,
        e.fecha_ingreso,
        e.id_puesto,
        e.status
      FROM rh_empleado e
      ${whereClause}
      ORDER BY e.apellidos ASC, e.nombres ASC
      LIMIT ? OFFSET ?
    `;

    const dataParams = [...queryParams, String(pageSize), String(offset)];

    const [rows] = await pool.execute<RowDataPacket[]>(dataQuery, dataParams);

    // Transformar registros a interface Guardian
    const data: Guardian[] = rows.map((row) => transformGuardian(row as GuardianDB));

    const result = { data, total };

    // Guardar en caché (si está habilitado)
    if (cacheEnabled) {
      guardianesCache.set(cacheKey, result);
    }

    console.log(
      `[RRHH] getGuardianes: Retornando ${data.length} de ${total} guardianes (página ${page}, tamaño ${pageSize}) [BD]`
    );

    return result;
  } catch (error) {
    console.error('[RRHH] Error en getGuardianes:', error);

    // Determinar tipo de error para logging
    if (error instanceof Error) {
      if (error.message.includes('ECONNREFUSED') || error.message.includes('ETIMEDOUT')) {
        throw new Error('Base de datos RRHH no disponible. Intente nuevamente más tarde.');
      }
      throw new Error(`Error al consultar guardianes: ${error.message}`);
    }

    throw new Error('Error desconocido al consultar guardianes');
  }
}

/**
 * Obtener guardián por ID
 *
 * Busca un guardián específico por su id_empleado.
 * Valida que el empleado sea guardián activo (id_puesto = 97, status = 1).
 *
 * @param id - ID del empleado (id_empleado)
 *
 * @returns Promise con Guardian si existe, null si no existe o no es guardián activo
 *
 * @throws Error si falla la conexión a BD RRHH o la query
 *
 * @example
 * ```typescript
 * const guardian = await getGuardianById(1001);
 * if (guardian) {
 *   console.log(`Guardián encontrado: ${guardian.nombre_completo}`);
 * } else {
 *   console.log('Guardián no encontrado o no está activo');
 * }
 * ```
 */
export async function getGuardianById(id: number): Promise<Guardian | null> {
  const pool = getTurnosPool();

  // Generar cache key para este guardián
  const cacheKey = `guardian:${id}`;

  // Intentar obtener del caché primero (si está habilitado)
  if (cacheEnabled) {
    const cached = guardianesCache.get<Guardian | null>(cacheKey);
    if (cached !== undefined) {
      console.log(`[RRHH] getGuardianById: Guardián ${id} retornado desde caché`);
      return cached;
    }
  }

  try {
    const query = `
      SELECT
        e.id_empleado,
        e.cedula_empleado AS codigo_empleado,
        e.cedula_empleado,
        e.nombres,
        e.apellidos,
        CONCAT(e.nombres, ' ', e.apellidos) AS nombre_completo,
        e.fecha_ingreso,
        e.id_puesto,
        e.status
      FROM rh_empleado e
      WHERE e.id_empleado = ?
        AND e.id_puesto = ?
        AND e.status = ?
    `;

    const [rows] = await pool.query<RowDataPacket[]>(query, [
      id,
      GUARDIAN_CONSTANTS.ID_PUESTO_VIGILANTE,
      GUARDIAN_CONSTANTS.STATUS_ACTIVO,
    ]);

    if (rows.length === 0) {
      console.log(`[RRHH] getGuardianById: Guardián con ID ${id} no encontrado o no está activo`);

      // Cachear null para evitar consultas repetidas de IDs inexistentes
      if (cacheEnabled) {
        guardianesCache.set(cacheKey, null);
      }

      return null;
    }

    const guardian = transformGuardian(rows[0] as GuardianDB);

    // Guardar en caché (si está habilitado)
    if (cacheEnabled) {
      guardianesCache.set(cacheKey, guardian);
    }

    console.log(`[RRHH] getGuardianById: Guardián ${guardian.nombre_completo} (ID: ${id}) encontrado [BD]`);

    return guardian;
  } catch (error) {
    console.error(`[RRHH] Error en getGuardianById (ID: ${id}):`, error);

    if (error instanceof Error) {
      if (error.message.includes('ECONNREFUSED') || error.message.includes('ETIMEDOUT')) {
        throw new Error('Base de datos RRHH no disponible. Intente nuevamente más tarde.');
      }
      throw new Error(`Error al consultar guardián: ${error.message}`);
    }

    throw new Error('Error desconocido al consultar guardián');
  }
}

/**
 * Buscar guardianes por término de búsqueda (búsqueda rápida)
 *
 * Realiza búsqueda rápida de guardianes por nombre completo o cédula.
 * Retorna máximo 20 resultados para optimizar performance.
 *
 * **Búsqueda en**:
 * - nombres (LIKE %search%)
 * - apellidos (LIKE %search%)
 * - cedula_empleado (LIKE %search%)
 *
 * **Ordenamiento**: Por apellidos ASC, nombres ASC
 *
 * @param search - Término de búsqueda (nombre, apellido o cédula)
 *
 * @returns Promise con array de hasta 20 guardianes que coincidan
 *
 * @throws Error si falla la conexión a BD RRHH o la query
 *
 * @example
 * ```typescript
 * // Buscar por nombre
 * const resultados = await buscarGuardianes('Juan');
 *
 * // Buscar por apellido
 * const resultados = await buscarGuardianes('Pérez');
 *
 * // Buscar por cédula
 * const resultados = await buscarGuardianes('001-1234567');
 * ```
 */
export async function buscarGuardianes(search: string): Promise<Guardian[]> {
  const pool = getTurnosPool();

  const searchTerm = search.trim();

  // Si no hay término de búsqueda, retornar vacío
  if (!searchTerm) {
    console.log('[RRHH] buscarGuardianes: Término de búsqueda vacío');
    return [];
  }

  try {
    const query = `
      SELECT
        e.id_empleado,
        e.cedula_empleado AS codigo_empleado,
        e.cedula_empleado,
        e.nombres,
        e.apellidos,
        CONCAT(e.nombres, ' ', e.apellidos) AS nombre_completo,
        e.fecha_ingreso,
        e.id_puesto,
        e.status
      FROM rh_empleado e
      WHERE e.id_puesto = ?
        AND e.status = ?
        AND (
          e.nombres LIKE ? OR
          e.apellidos LIKE ? OR
          e.cedula_empleado LIKE ?
        )
      ORDER BY e.apellidos ASC, e.nombres ASC
      LIMIT ?
    `;

    const searchPattern = `%${searchTerm}%`;
    const [rows] = await pool.query<RowDataPacket[]>(query, [
      GUARDIAN_CONSTANTS.ID_PUESTO_VIGILANTE,
      GUARDIAN_CONSTANTS.STATUS_ACTIVO,
      searchPattern,
      searchPattern,
      searchPattern,
      GUARDIAN_CONSTANTS.SEARCH_LIMIT,
    ]);

    const resultados = rows.map((row) => transformGuardian(row as GuardianDB));

    console.log(
      `[RRHH] buscarGuardianes: Encontrados ${resultados.length} guardianes con término "${searchTerm}"`
    );

    return resultados;
  } catch (error) {
    console.error(`[RRHH] Error en buscarGuardianes (término: "${searchTerm}"):`, error);

    if (error instanceof Error) {
      if (error.message.includes('ECONNREFUSED') || error.message.includes('ETIMEDOUT')) {
        throw new Error('Base de datos RRHH no disponible. Intente nuevamente más tarde.');
      }
      throw new Error(`Error al buscar guardianes: ${error.message}`);
    }

    throw new Error('Error desconocido al buscar guardianes');
  }
}

/**
 * Validar que un empleado es guardián activo
 *
 * Verifica rápidamente si un empleado existe, es guardián (id_puesto = 97)
 * y está activo (status = 1).
 *
 * **Uso principal**: Validación antes de asignar turnos a un empleado.
 *
 * @param id - ID del empleado (id_empleado)
 *
 * @returns Promise con true si es guardián activo, false en caso contrario
 *
 * @throws Error si falla la conexión a BD RRHH o la query
 *
 * @example
 * ```typescript
 * // Validar antes de crear turno
 * const esValido = await validarGuardianActivo(1001);
 * if (!esValido) {
 *   throw new Error('El empleado no es un guardián activo');
 * }
 * // Continuar con creación de turno...
 * ```
 */
export async function validarGuardianActivo(id: number): Promise<boolean> {
  const pool = getTurnosPool();

  try {
    const query = `
      SELECT COUNT(*) AS es_valido
      FROM rh_empleado
      WHERE id_empleado = ?
        AND id_puesto = ?
        AND status = ?
    `;

    const [rows] = await pool.query<RowDataPacket[]>(query, [
      id,
      GUARDIAN_CONSTANTS.ID_PUESTO_VIGILANTE,
      GUARDIAN_CONSTANTS.STATUS_ACTIVO,
    ]);

    const esValido = rows[0]?.es_valido === 1;

    console.log(
      `[RRHH] validarGuardianActivo: Empleado ${id} es ${esValido ? 'guardián activo' : 'NO guardián activo'}`
    );

    return esValido;
  } catch (error) {
    console.error(`[RRHH] Error en validarGuardianActivo (ID: ${id}):`, error);

    if (error instanceof Error) {
      if (error.message.includes('ECONNREFUSED') || error.message.includes('ETIMEDOUT')) {
        throw new Error('Base de datos RRHH no disponible. Intente nuevamente más tarde.');
      }
      throw new Error(`Error al validar guardián: ${error.message}`);
    }

    throw new Error('Error desconocido al validar guardián');
  }
}

/**
 * Limpiar todo el caché de guardianes
 *
 * Elimina todas las entradas cacheadas de guardianes (lista paginada e individuales).
 * Útil para forzar actualización de datos después de cambios en BD RRHH.
 *
 * **Permisos**: Solo ADMIN puede ejecutar
 *
 * @returns Promise con estadísticas del caché antes de limpiar
 *
 * @example
 * ```typescript
 * const stats = await clearGuardianesCache();
 * console.log(`Cache cleared. ${stats.keys} keys deleted`);
 * ```
 */
export async function clearGuardianesCache(): Promise<{
  message: string;
  cacheEnabled: boolean;
  statsBeforeClear: {
    keys: number;
    hits: number;
    misses: number;
  };
}> {
  const statsBeforeClear = guardianesCache.getStats();

  if (cacheEnabled) {
    guardianesCache.flush();
    console.log(
      `[RRHH] Cache limpiado manualmente: ${statsBeforeClear.keys} claves eliminadas`
    );
  } else {
    console.log('[RRHH] Cache deshabilitado, no hay nada que limpiar');
  }

  return {
    message: cacheEnabled
      ? 'Caché limpiado exitosamente'
      : 'Caché deshabilitado, no hay nada que limpiar',
    cacheEnabled,
    statsBeforeClear: {
      keys: statsBeforeClear.keys,
      hits: statsBeforeClear.hits,
      misses: statsBeforeClear.misses,
    },
  };
}

/**
 * Obtener estadísticas del caché de guardianes
 *
 * Retorna información sobre el uso del caché:
 * - Número de claves
 * - Hits (aciertos)
 * - Misses (fallos)
 * - Tamaño de memoria
 * - Hit rate calculado
 *
 * **Permisos**: ADMIN y SUPERVISOR pueden ver estadísticas
 *
 * @returns Promise con estadísticas del caché
 *
 * @example
 * ```typescript
 * const stats = await getGuardianesCacheStats();
 * console.log(`Hit rate: ${stats.hitRate}%`);
 * console.log(`Memory: ${stats.memorySizeKB} KB`);
 * ```
 */
export async function getGuardianesCacheStats(): Promise<{
  enabled: boolean;
  keys: number;
  hits: number;
  misses: number;
  hitRate: number;
  memorySizeKB: number;
  ttlSeconds: number;
}> {
  const stats = guardianesCache.getStats();
  const totalRequests = stats.hits + stats.misses;
  const hitRate = totalRequests > 0 ? (stats.hits / totalRequests) * 100 : 0;
  const memorySizeKB = (stats.vsize + stats.ksize) / 1024;

  return {
    enabled: cacheEnabled,
    keys: stats.keys,
    hits: stats.hits,
    misses: stats.misses,
    hitRate: parseFloat(hitRate.toFixed(2)),
    memorySizeKB: parseFloat(memorySizeKB.toFixed(2)),
    ttlSeconds: env.cache.ttlSeconds,
  };
}
