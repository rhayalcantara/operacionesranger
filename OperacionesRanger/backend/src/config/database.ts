/**
 * Configuración de conexión a base de datos MySQL
 * Sistema de Gestión de Turnos - OperacionesRanger
 *
 * Pool único de conexión a db_aae4a2_ranger
 * (Nómina + Operaciones comparten la misma base de datos)
 */

import * as mysql from 'mysql2/promise';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Cargar variables de entorno (respeta .env.test en modo test)
if (process.env.NODE_ENV === 'test') {
  dotenv.config({ path: path.join(__dirname, '../../.env.test') });
} else {
  dotenv.config();
}

/**
 * Configuración del pool de conexión a BD principal (db_aae4a2_ranger)
 * Contiene tablas de Nómina (no_, rh_, ct_) y Operaciones (ot_)
 */
const poolConfig: mysql.PoolOptions = {
  host: process.env.DB_TURNOS_HOST || 'localhost',
  port: Number(process.env.DB_TURNOS_PORT) || 3306,
  database: process.env.DB_TURNOS_NAME || 'db_aae4a2_ranger',
  user: process.env.DB_TURNOS_USER || 'root',
  password: process.env.DB_TURNOS_PASSWORD,

  // Configuración del pool
  connectionLimit: 15,
  queueLimit: 0,
  waitForConnections: true,
  enableKeepAlive: true,
  keepAliveInitialDelay: 0,

  // Configuración adicional
  timezone: '+00:00',
  charset: 'utf8mb4',

  // Timeouts
  connectTimeout: 10000,
};

/**
 * Pool de conexión singleton
 */
let turnosPool: mysql.Pool | null = null;

/**
 * Obtener pool de conexión a BD
 * Implementa patrón singleton
 */
export function getTurnosPool(): mysql.Pool {
  if (!turnosPool) {
    if (!process.env.DB_TURNOS_PASSWORD) {
      throw new Error(
        'Variable de entorno DB_TURNOS_PASSWORD no está configurada. ' +
        'Verifica tu archivo .env'
      );
    }

    console.log('[DB] Creando pool de conexión a BD (db_aae4a2_ranger)...');
    turnosPool = mysql.createPool(poolConfig);
    console.log('[DB] Pool de BD creado exitosamente');
  }

  return turnosPool;
}

/**
 * Alias para compatibilidad — ambos apuntan al mismo pool
 */
export const getRRHHPool = getTurnosPool;

/**
 * Proxy alias para uso directo: import { db } from '../config/database';
 */
function createPoolProxy(getPool: () => mysql.Pool): mysql.Pool {
  return new Proxy({} as mysql.Pool, {
    get(_target, prop: string | symbol) {
      const pool = getPool();
      const value = (pool as any)[prop];
      return typeof value === 'function' ? value.bind(pool) : value;
    }
  });
}

export const db = createPoolProxy(getTurnosPool);
export const dbRRHH = createPoolProxy(getTurnosPool);

/**
 * Probar conectividad a la base de datos
 */
export async function testConnections(): Promise<boolean> {
  console.log('\n=== Probando conexión a base de datos ===\n');

  try {
    console.log('[TEST] Probando conexión a BD (db_aae4a2_ranger)...');
    const pool = getTurnosPool();
    const [rows] = await pool.query('SELECT 1 AS test');

    if (Array.isArray(rows) && rows.length > 0) {
      console.log('[TEST] ✓ Conexión exitosa');

      const [dbInfo]: any = await pool.query(
        'SELECT DATABASE() as db_name, VERSION() as version, @@hostname as host'
      );

      if (Array.isArray(dbInfo) && dbInfo.length > 0) {
        console.log(`[TEST]   Base de datos: ${dbInfo[0].db_name}`);
        console.log(`[TEST]   Versión MySQL: ${dbInfo[0].version}`);
      }

      // Verificar tablas de operaciones
      const [otTables]: any = await pool.query("SHOW TABLES LIKE 'ot\\_%'");
      console.log(`[TEST]   Tablas operaciones (ot_): ${otTables.length}`);

      // Verificar guardianes activos
      const [count]: any = await pool.query(
        'SELECT COUNT(*) as total FROM rh_empleado WHERE id_puesto = 97 AND status = 1'
      );
      if (Array.isArray(count) && count.length > 0) {
        console.log(`[TEST]   Guardianes activos: ${count[0].total}`);
      }

      console.log('\n=== Conexión OK ===\n');
      return true;
    }

    return false;
  } catch (error) {
    console.error('[TEST] ✗ Error al conectar:');
    if (error instanceof Error) {
      console.error(`[TEST]   ${error.message}`);
    }
    throw new Error('Fallo la conexión a BD (db_aae4a2_ranger)');
  }
}

/**
 * Cerrar pool de conexión
 */
export async function closeConnections(): Promise<void> {
  console.log('[DB] Cerrando conexiones...');

  if (turnosPool) {
    await turnosPool.end();
    turnosPool = null;
  }

  console.log('[DB] Conexiones cerradas');
}

/**
 * Obtener información del pool
 */
export function getPoolsInfo() {
  return {
    turnos: {
      host: poolConfig.host,
      port: poolConfig.port,
      database: poolConfig.database,
      user: poolConfig.user,
      connectionLimit: poolConfig.connectionLimit,
    },
  };
}

export { turnosPool };
