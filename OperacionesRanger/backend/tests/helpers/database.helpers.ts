/**
 * Database Helpers - Utilidades compartidas para tests con base de datos
 * Sistema de Gestión de Turnos - OperacionesRanger
 *
 * Funciones helper para:
 * - Limpiar tablas de prueba
 * - Insertar datos de seed
 * - Contar registros
 * - Resetear secuencias
 * - Verificar datos
 *
 * @module tests/helpers/database.helpers
 */

import { getTurnosPool } from '../../src/config/database';
import type { Pool, RowDataPacket, ResultSetHeader } from 'mysql2/promise';

// ============================================================================
// TIPOS
// ============================================================================

/**
 * Nombres de tablas del sistema de turnos
 */
export type TurnosTable =
  | 'ot_sys_usuarios'
  | 'ot_sys_refresh_tokens'
  | 'ot_sys_auditoria_auth'
  | 'ot_sys_auditoria'
  | 'ot_sys_reportes_generados'
  | 'ot_clientes'
  | 'ot_ubicaciones'
  | 'ot_puestos'
  | 'ot_feriados'
  | 'ot_configuracion_turnos'
  | 'ot_incentivos_puesto'
  | 'ot_turnos';

/**
 * Opciones para limpieza de tabla
 */
export interface CleanTableOptions {
  resetAutoIncrement?: boolean;
  cascade?: boolean;
}

/**
 * Datos de seed genéricos
 */
export type SeedData = Record<string, any>;

// ============================================================================
// FUNCIONES DE LIMPIEZA
// ============================================================================

/**
 * Limpiar tabla específica (DELETE)
 * Por defecto también resetea el auto_increment
 *
 * @param tableName - Nombre de la tabla a limpiar
 * @param options - Opciones de limpieza
 *
 * @example
 * ```typescript
 * await cleanTable('clientes'); // Limpia y resetea auto_increment
 * await cleanTable('usuarios', { resetAutoIncrement: false }); // Solo limpia
 * ```
 */
export async function cleanTable(
  tableName: TurnosTable,
  options: CleanTableOptions = {}
): Promise<void> {
  const { resetAutoIncrement = true, cascade = false } = options;

  const pool = getTurnosPool();

  // Deshabilitar foreign key checks si cascade es true
  if (cascade) {
    await pool.execute('SET FOREIGN_KEY_CHECKS = 0');
  }

  // Limpiar tabla
  await pool.execute(`DELETE FROM ${tableName}`);

  // Resetear auto_increment
  if (resetAutoIncrement) {
    await pool.execute(`ALTER TABLE ${tableName} AUTO_INCREMENT = 1`);
  }

  // Re-habilitar foreign key checks
  if (cascade) {
    await pool.execute('SET FOREIGN_KEY_CHECKS = 1');
  }
}

/**
 * Truncar tabla (TRUNCATE)
 * Más rápido que DELETE pero reinicia auto_increment siempre
 *
 * @param tableName - Nombre de la tabla a truncar
 *
 * @example
 * ```typescript
 * await truncateTable('turnos');
 * ```
 */
export async function truncateTable(tableName: TurnosTable): Promise<void> {
  const pool = getTurnosPool();

  // TRUNCATE requiere deshabilitar FK checks
  await pool.execute('SET FOREIGN_KEY_CHECKS = 0');
  await pool.execute(`TRUNCATE TABLE ${tableName}`);
  await pool.execute('SET FOREIGN_KEY_CHECKS = 1');
}

/**
 * Limpiar todas las tablas de prueba en orden correcto
 * Respeta foreign keys eliminando en orden inverso de dependencias
 *
 * @example
 * ```typescript
 * // Después de todos los tests
 * afterAll(async () => {
 *   await cleanAllTestData();
 * });
 * ```
 */
export async function cleanAllTestData(): Promise<void> {
  const pool = getTurnosPool();

  // Deshabilitar foreign key checks
  await pool.execute('SET FOREIGN_KEY_CHECKS = 0');

  // Orden de limpieza (de hoja a raíz)
  const tables: TurnosTable[] = [
    'ot_sys_reportes_generados',
    'ot_sys_auditoria',
    'ot_sys_auditoria_auth',
    'ot_sys_refresh_tokens',
    'ot_turnos',
    'ot_incentivos_puesto',
    'ot_puestos',
    'ot_ubicaciones',
    'ot_clientes',
    'ot_feriados',
    // ot_configuracion_turnos NO se limpia (datos de sistema)
    // ot_sys_usuarios NO se limpia automáticamente (usar cleanupTestUsers)
  ];

  // Limpiar cada tabla
  for (const table of tables) {
    await pool.execute(`DELETE FROM ${table}`);
    await pool.execute(`ALTER TABLE ${table} AUTO_INCREMENT = 1`);
  }

  // Re-habilitar foreign key checks
  await pool.execute('SET FOREIGN_KEY_CHECKS = 1');
}

/**
 * Limpiar solo datos de prueba (excluye datos de sistema)
 * Preserva configuración de turnos y usuarios de sistema
 *
 * @example
 * ```typescript
 * // Limpiar datos de prueba pero mantener configuración
 * await cleanTestDataOnly();
 * ```
 */
export async function cleanTestDataOnly(): Promise<void> {
  const pool = getTurnosPool();

  await pool.execute('SET FOREIGN_KEY_CHECKS = 0');

  // Limpiar solo tablas de datos transaccionales
  const tables: TurnosTable[] = [
    'ot_sys_reportes_generados',
    'ot_sys_auditoria',
    'ot_turnos',
    'ot_incentivos_puesto',
  ];

  for (const table of tables) {
    await pool.execute(`DELETE FROM ${table}`);
    await pool.execute(`ALTER TABLE ${table} AUTO_INCREMENT = 1`);
  }

  await pool.execute('SET FOREIGN_KEY_CHECKS = 1');
}

// ============================================================================
// FUNCIONES DE SEED
// ============================================================================

/**
 * Insertar múltiples registros en una tabla
 * Retorna los IDs de los registros insertados
 *
 * @param tableName - Nombre de la tabla
 * @param data - Array de objetos con datos a insertar
 * @returns Array de IDs insertados
 *
 * @example
 * ```typescript
 * const ids = await seedTestData('clientes', [
 *   { nombre: 'Cliente 1', ruc: '123456789', activo: true },
 *   { nombre: 'Cliente 2', ruc: '987654321', activo: true }
 * ]);
 * console.log(`Insertados ${ids.length} clientes`);
 * ```
 */
export async function seedTestData(
  tableName: TurnosTable,
  data: SeedData[]
): Promise<number[]> {
  if (data.length === 0) return [];

  const pool = getTurnosPool();
  const ids: number[] = [];

  for (const record of data) {
    const fields = Object.keys(record);
    const values = Object.values(record);
    const placeholders = fields.map(() => '?').join(', ');

    const query = `INSERT INTO ${tableName} (${fields.join(', ')}) VALUES (${placeholders})`;

    const [result] = await pool.execute<ResultSetHeader>(query, values);
    ids.push(result.insertId);
  }

  return ids;
}

/**
 * Insertar un registro y retornar su ID
 * Atajo para seedTestData con un solo registro
 *
 * @param tableName - Nombre de la tabla
 * @param data - Objeto con datos a insertar
 * @returns ID del registro insertado
 *
 * @example
 * ```typescript
 * const clienteId = await seedRecord('clientes', {
 *   nombre: 'Cliente Test',
 *   ruc: '123456789',
 *   activo: true
 * });
 * ```
 */
export async function seedRecord(
  tableName: TurnosTable,
  data: SeedData
): Promise<number> {
  const [id] = await seedTestData(tableName, [data]);
  return id;
}

/**
 * Cargar clientes de prueba estándar
 * Retorna IDs de los clientes creados
 *
 * @returns Array de IDs de clientes
 *
 * @example
 * ```typescript
 * const [cliente1Id, cliente2Id] = await seedTestClientes();
 * ```
 */
export async function seedTestClientes(): Promise<number[]> {
  return seedTestData('ot_clientes', [
    {
      nombre: 'Cliente Test 1',
      ruc: '111111111',
      direccion: 'Av. Test 123',
      telefono: '809-555-0001',
      email: 'cliente1@test.com',
      contacto_nombre: 'Contacto 1',
      activo: true,
    },
    {
      nombre: 'Cliente Test 2',
      ruc: '222222222',
      direccion: 'Calle Test 456',
      telefono: '809-555-0002',
      email: 'cliente2@test.com',
      contacto_nombre: 'Contacto 2',
      activo: true,
    },
  ]);
}

/**
 * Cargar ubicaciones de prueba para un cliente
 *
 * @param clienteId - ID del cliente
 * @returns Array de IDs de ubicaciones
 *
 * @example
 * ```typescript
 * const clienteId = await seedRecord('clientes', {...});
 * const ubicacionesIds = await seedTestUbicaciones(clienteId);
 * ```
 */
export async function seedTestUbicaciones(clienteId: number): Promise<number[]> {
  return seedTestData('ot_ubicaciones', [
    {
      cliente_id: clienteId,
      codigo: 'UB001',
      nombre: 'Ubicación Test 1',
      direccion: 'Dirección Test 1',
      provincia: 'Santo Domingo',
      municipio: 'Distrito Nacional',
      activo: true,
    },
    {
      cliente_id: clienteId,
      codigo: 'UB002',
      nombre: 'Ubicación Test 2',
      direccion: 'Dirección Test 2',
      provincia: 'Santo Domingo',
      municipio: 'Santo Domingo Este',
      activo: true,
    },
  ]);
}

/**
 * Cargar puestos de prueba para una ubicación
 *
 * @param ubicacionId - ID de la ubicación
 * @returns Array de IDs de puestos
 *
 * @example
 * ```typescript
 * const ubicacionId = await seedRecord('ubicaciones', {...});
 * const puestosIds = await seedTestPuestos(ubicacionId);
 * ```
 */
export async function seedTestPuestos(ubicacionId: number): Promise<number[]> {
  return seedTestData('ot_puestos', [
    {
      ubicacion_id: ubicacionId,
      codigo: 'P001',
      nombre: 'Puesto Test 1',
      descripcion: 'Puesto de prueba 1',
      horario_esperado: 'Lunes a Viernes 8:00-17:00',
      requiere_armado: false,
      activo: true,
    },
    {
      ubicacion_id: ubicacionId,
      codigo: 'P002',
      nombre: 'Puesto Test 2',
      descripcion: 'Puesto de prueba 2',
      horario_esperado: '24/7',
      requiere_armado: true,
      activo: true,
    },
  ]);
}

/**
 * Cargar estructura completa de prueba (cliente → ubicaciones → puestos)
 * Retorna IDs de todas las entidades creadas
 *
 * @returns Objeto con arrays de IDs
 *
 * @example
 * ```typescript
 * const { clientes, ubicaciones, puestos } = await seedTestStructure();
 * // Ahora puedes crear turnos en los puestos creados
 * ```
 */
export async function seedTestStructure(): Promise<{
  clientes: number[];
  ubicaciones: number[];
  puestos: number[];
}> {
  const clientes = await seedTestClientes();
  const ubicaciones: number[] = [];
  const puestos: number[] = [];

  for (const clienteId of clientes) {
    const ubicIds = await seedTestUbicaciones(clienteId);
    ubicaciones.push(...ubicIds);

    for (const ubicacionId of ubicIds) {
      const puestoIds = await seedTestPuestos(ubicacionId);
      puestos.push(...puestoIds);
    }
  }

  return { clientes, ubicaciones, puestos };
}

// ============================================================================
// FUNCIONES DE CONSULTA
// ============================================================================

/**
 * Contar registros en una tabla
 * Opcionalmente con condición WHERE
 *
 * @param tableName - Nombre de la tabla
 * @param where - Condición WHERE (sin la palabra WHERE)
 * @param params - Parámetros para la condición
 * @returns Cantidad de registros
 *
 * @example
 * ```typescript
 * const total = await countRecords('clientes');
 * const activos = await countRecords('clientes', 'activo = ?', [true]);
 * ```
 */
export async function countRecords(
  tableName: TurnosTable,
  where?: string,
  params: any[] = []
): Promise<number> {
  const pool = getTurnosPool();

  const query = where
    ? `SELECT COUNT(*) as count FROM ${tableName} WHERE ${where}`
    : `SELECT COUNT(*) as count FROM ${tableName}`;

  const [rows] = await pool.query<RowDataPacket[]>(query, params);

  return rows[0].count;
}

/**
 * Verificar si existe un registro
 *
 * @param tableName - Nombre de la tabla
 * @param where - Condición WHERE
 * @param params - Parámetros para la condición
 * @returns true si existe, false si no
 *
 * @example
 * ```typescript
 * const existe = await recordExists('clientes', 'ruc = ?', ['123456789']);
 * ```
 */
export async function recordExists(
  tableName: TurnosTable,
  where: string,
  params: any[] = []
): Promise<boolean> {
  const count = await countRecords(tableName, where, params);
  return count > 0;
}

/**
 * Obtener un registro por ID
 *
 * @param tableName - Nombre de la tabla
 * @param id - ID del registro
 * @returns Registro encontrado o null
 *
 * @example
 * ```typescript
 * const cliente = await getRecordById('clientes', 123);
 * if (cliente) {
 *   console.log(cliente.nombre);
 * }
 * ```
 */
export async function getRecordById(
  tableName: TurnosTable,
  id: number
): Promise<RowDataPacket | null> {
  const pool = getTurnosPool();

  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT * FROM ${tableName} WHERE id = ?`,
    [id]
  );

  return rows.length > 0 ? rows[0] : null;
}

/**
 * Obtener múltiples registros con condición
 *
 * @param tableName - Nombre de la tabla
 * @param where - Condición WHERE
 * @param params - Parámetros para la condición
 * @returns Array de registros
 *
 * @example
 * ```typescript
 * const activos = await getRecords('clientes', 'activo = ?', [true]);
 * ```
 */
export async function getRecords(
  tableName: TurnosTable,
  where?: string,
  params: any[] = []
): Promise<RowDataPacket[]> {
  const pool = getTurnosPool();

  const query = where
    ? `SELECT * FROM ${tableName} WHERE ${where}`
    : `SELECT * FROM ${tableName}`;

  const [rows] = await pool.query<RowDataPacket[]>(query, params);

  return rows;
}

// ============================================================================
// FUNCIONES DE VERIFICACIÓN
// ============================================================================

/**
 * Verificar que tabla existe
 *
 * @param tableName - Nombre de la tabla
 * @returns true si existe, false si no
 *
 * @example
 * ```typescript
 * if (await tableExists('turnos')) {
 *   console.log('Tabla turnos existe');
 * }
 * ```
 */
export async function tableExists(tableName: string): Promise<boolean> {
  const pool = getTurnosPool();

  const [rows] = await pool.query<RowDataPacket[]>(
    `SHOW TABLES LIKE ?`,
    [tableName]
  );

  return rows.length > 0;
}

/**
 * Obtener schema de una tabla
 * Retorna información de columnas
 *
 * @param tableName - Nombre de la tabla
 * @returns Array con información de columnas
 *
 * @example
 * ```typescript
 * const schema = await getTableSchema('clientes');
 * schema.forEach(col => console.log(col.Field, col.Type));
 * ```
 */
export async function getTableSchema(
  tableName: TurnosTable
): Promise<RowDataPacket[]> {
  const pool = getTurnosPool();

  const [rows] = await pool.query<RowDataPacket[]>(
    `DESCRIBE ${tableName}`
  );

  return rows;
}

/**
 * Obtener valor de AUTO_INCREMENT actual
 *
 * @param tableName - Nombre de la tabla
 * @returns Próximo valor de AUTO_INCREMENT
 *
 * @example
 * ```typescript
 * const nextId = await getAutoIncrement('clientes');
 * console.log(`Próximo ID: ${nextId}`);
 * ```
 */
export async function getAutoIncrement(
  tableName: TurnosTable
): Promise<number> {
  const pool = getTurnosPool();

  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT AUTO_INCREMENT FROM information_schema.TABLES
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ?`,
    [tableName]
  );

  return rows[0]?.AUTO_INCREMENT || 1;
}

// ============================================================================
// FUNCIONES DE UTILIDAD
// ============================================================================

/**
 * Ejecutar query SQL directamente (para casos especiales)
 * Usar con precaución
 *
 * @param query - Query SQL
 * @param params - Parámetros del query
 * @returns Resultado del query
 *
 * @example
 * ```typescript
 * const result = await executeQuery('UPDATE clientes SET activo = ? WHERE id = ?', [false, 123]);
 * ```
 */
export async function executeQuery(
  query: string,
  params: any[] = []
): Promise<any> {
  const pool = getTurnosPool();
  return pool.query(query, params);
}

/**
 * Comenzar transacción
 * Retorna la conexión para commit/rollback
 *
 * @returns Conexión con transacción activa
 *
 * @example
 * ```typescript
 * const conn = await beginTransaction();
 * try {
 *   await conn.query('INSERT INTO clientes ...');
 *   await conn.query('INSERT INTO ubicaciones ...');
 *   await conn.commit();
 * } catch (error) {
 *   await conn.rollback();
 *   throw error;
 * } finally {
 *   conn.release();
 * }
 * ```
 */
export async function beginTransaction() {
  const pool = getTurnosPool();
  const conn = await pool.getConnection();
  await conn.beginTransaction();
  return conn;
}

/**
 * Esperar a que se cumplan N registros en una tabla
 * Útil para tests asíncronos
 *
 * @param tableName - Nombre de la tabla
 * @param expectedCount - Cantidad esperada de registros
 * @param timeout - Timeout en milisegundos (default: 5000)
 * @returns true si se alcanzó el count, false si timeout
 *
 * @example
 * ```typescript
 * // Esperar que se inserten 5 turnos
 * const success = await waitForCount('turnos', 5, 10000);
 * expect(success).toBe(true);
 * ```
 */
export async function waitForCount(
  tableName: TurnosTable,
  expectedCount: number,
  timeout: number = 5000
): Promise<boolean> {
  const startTime = Date.now();

  while (Date.now() - startTime < timeout) {
    const count = await countRecords(tableName);
    if (count >= expectedCount) {
      return true;
    }
    // Esperar 100ms antes de volver a verificar
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  return false;
}

/**
 * Deshabilitar foreign key checks temporalmente
 * Útil para operaciones que requieren violar FK temporalmente
 *
 * @example
 * ```typescript
 * await disableForeignKeyChecks();
 * // ... operaciones ...
 * await enableForeignKeyChecks();
 * ```
 */
export async function disableForeignKeyChecks(): Promise<void> {
  const pool = getTurnosPool();
  await pool.execute('SET FOREIGN_KEY_CHECKS = 0');
}

/**
 * Habilitar foreign key checks
 */
export async function enableForeignKeyChecks(): Promise<void> {
  const pool = getTurnosPool();
  await pool.execute('SET FOREIGN_KEY_CHECKS = 1');
}
