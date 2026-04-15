/**
 * Jest Global Teardown - Limpieza después de ejecutar tests
 * Sistema de Gestión de Turnos - OperacionesRanger
 *
 * Se ejecuta UNA VEZ después de todos los tests
 *
 * Acciones:
 * - Limpiar datos de prueba de todas las tablas
 * - Cerrar conexiones a base de datos
 * - Logging de resumen
 *
 * @module tests/setup/global-teardown
 */

import mysql from 'mysql2/promise';
import * as dotenv from 'dotenv';
import * as path from 'path';
import * as fs from 'fs';

// Cargar variables de entorno de prueba
const envPath = path.join(__dirname, '../../.env.test');
if (fs.existsSync(envPath)) {
  dotenv.config({ path: envPath });
}

/**
 * Teardown global de Jest
 * Limpiar datos de prueba después de ejecutar todos los tests
 */
export default async function globalTeardown() {
  console.log('\n=================================================');
  console.log('JEST GLOBAL TEARDOWN - Limpiando después de tests');
  console.log('=================================================\n');

  try {
    // 1. Limpiar datos de prueba
    await cleanupTestData();

    // 2. Logging de resumen
    await logSummary();

    console.log('\n=================================================');
    console.log('✓ JEST GLOBAL TEARDOWN COMPLETADO');
    console.log('=================================================\n');
  } catch (error) {
    console.error('\n❌ ERROR EN GLOBAL TEARDOWN:');
    console.error(error);
    console.log('\n=================================================');
    console.log('⚠ JEST GLOBAL TEARDOWN COMPLETÓ CON ERRORES');
    console.log('=================================================\n');
    // No lanzar error para no fallar los tests
  }
}

/**
 * Limpiar datos de prueba de todas las tablas
 * Solo limpia datos de prueba, NO datos de configuración
 */
async function cleanupTestData() {
  console.log('1. Limpiando datos de prueba...');

  const connection = await mysql.createConnection({
    host: process.env.DB_TURNOS_HOST,
    port: parseInt(process.env.DB_TURNOS_PORT || '3306'),
    user: process.env.DB_TURNOS_USER,
    password: process.env.DB_TURNOS_PASSWORD,
    database: process.env.DB_TURNOS_NAME,
  });

  try {
    // Deshabilitar foreign key checks
    await connection.query('SET FOREIGN_KEY_CHECKS = 0');

    // Limpiar tablas de datos transaccionales
    const tablesToClean = [
      'ot_sys_reportes_generados',
      'ot_sys_auditoria',
      'ot_sys_auditoria_auth',
      'ot_sys_refresh_tokens',
      'ot_turnos',
      'ot_incentivos_puesto',
      'ot_puestos',
      'ot_ubicaciones',
      'ot_clientes',
    ];

    for (const table of tablesToClean) {
      try {
        // Contar registros antes
        const [countBefore] = await connection.query<any[]>(
          `SELECT COUNT(*) as count FROM ${table}`
        );

        const before = countBefore[0].count;

        if (before > 0) {
          // Limpiar tabla
          await connection.query(`DELETE FROM ${table}`);
          await connection.query(`ALTER TABLE ${table} AUTO_INCREMENT = 1`);

          console.log(`   ✓ ${table}: ${before} registros eliminados`);
        } else {
          console.log(`   ○ ${table}: ya estaba vacía`);
        }
      } catch (error: any) {
        console.warn(`   ⚠ Error limpiando ${table}: ${error.message}`);
      }
    }

    // Limpiar usuarios de prueba (solo los que empiezan con 'test_' o 'temp_')
    const [testUsers] = await connection.query<any[]>(
      "SELECT COUNT(*) as count FROM ot_sys_usuarios WHERE username LIKE 'test_%' OR username LIKE 'temp_%'"
    );

    if (testUsers[0].count > 0) {
      await connection.query(
        "DELETE FROM ot_sys_usuarios WHERE username LIKE 'test_%' OR username LIKE 'temp_%'"
      );
      console.log(
        `   ✓ ot_sys_usuarios: ${testUsers[0].count} usuarios de prueba eliminados`
      );
    } else {
      console.log(`   ○ ot_sys_usuarios: sin usuarios de prueba`);
    }

    // Re-habilitar foreign key checks
    await connection.query('SET FOREIGN_KEY_CHECKS = 1');

    console.log('   ✓ Limpieza de datos completada');
  } finally {
    await connection.end();
  }
}

/**
 * Logging de resumen de tests
 */
async function logSummary() {
  console.log('\n2. Resumen de la ejecución de tests:');

  const connection = await mysql.createConnection({
    host: process.env.DB_TURNOS_HOST,
    port: parseInt(process.env.DB_TURNOS_PORT || '3306'),
    user: process.env.DB_TURNOS_USER,
    password: process.env.DB_TURNOS_PASSWORD,
    database: process.env.DB_TURNOS_NAME,
  });

  try {
    // Contar registros en tablas principales
    const tables = [
      'ot_sys_usuarios',
      'ot_clientes',
      'ot_ubicaciones',
      'ot_puestos',
      'ot_turnos',
      'ot_feriados',
    ];

    console.log('   Estado final de tablas:');

    for (const table of tables) {
      try {
        const [rows] = await connection.query<any[]>(
          `SELECT COUNT(*) as count FROM ${table}`
        );
        const count = rows[0].count;
        console.log(`     - ${table}: ${count} registros`);
      } catch (error) {
        console.warn(`     - ${table}: error al contar`);
      }
    }

    console.log('\n   ℹ Base de datos de prueba lista para próxima ejecución');
  } finally {
    await connection.end();
  }
}
