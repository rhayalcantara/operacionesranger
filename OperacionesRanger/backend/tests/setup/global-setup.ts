/**
 * Jest Global Setup - Configuración antes de ejecutar tests
 * Sistema de Gestión de Turnos - OperacionesRanger
 *
 * Se ejecuta UNA VEZ antes de todos los tests
 *
 * Acciones:
 * - Verificar que base de datos de prueba existe
 * - Crear tablas si no existen (usando schema SQL)
 * - Cargar datos de configuración inicial (feriados, config_turnos)
 * - Verificar conexión a BD RRHH (read-only)
 *
 * @module tests/setup/global-setup
 */

import mysql from 'mysql2/promise';
import * as dotenv from 'dotenv';
import * as path from 'path';
import * as fs from 'fs';

// Cargar variables de entorno de prueba
const envPath = path.join(__dirname, '../../.env.test');
if (fs.existsSync(envPath)) {
  dotenv.config({ path: envPath });
  console.log('✓ Loaded .env.test file');
} else {
  console.warn('⚠ .env.test file not found, using environment variables');
}

/**
 * Setup global de Jest
 * Configurar base de datos de prueba antes de ejecutar tests
 */
export default async function globalSetup() {
  console.log('\n=================================================');
  console.log('JEST GLOBAL SETUP - Configurando tests');
  console.log('=================================================\n');

  try {
    // 1. Verificar variables de entorno
    await verifyEnvironmentVariables();

    // 2. Verificar/crear base de datos de prueba
    await verifyTestDatabase();

    // 3. Verificar que tablas existen
    await verifyTables();

    // 4. Cargar datos de configuración inicial
    await seedInitialData();

    console.log('\n=================================================');
    console.log('✓ JEST GLOBAL SETUP COMPLETADO');
    console.log('=================================================\n');
  } catch (error) {
    console.error('\n❌ ERROR EN GLOBAL SETUP:');
    console.error(error);
    console.log('\n=================================================');
    console.log('❌ JEST GLOBAL SETUP FALLÓ');
    console.log('=================================================\n');
    throw error;
  }
}

/**
 * Verificar que variables de entorno necesarias existen
 */
async function verifyEnvironmentVariables() {
  console.log('1. Verificando variables de entorno...');

  const required = [
    'DB_TURNOS_HOST',
    'DB_TURNOS_USER',
    'DB_TURNOS_PASSWORD',
    'DB_TURNOS_NAME',
    'JWT_SECRET',
  ];

  const missing: string[] = [];

  for (const varName of required) {
    if (!process.env[varName]) {
      missing.push(varName);
    }
  }

  if (missing.length > 0) {
    throw new Error(
      `Variables de entorno faltantes: ${missing.join(', ')}\n` +
        'Crear archivo .env.test basado en .env.test.example'
    );
  }

  console.log('   ✓ Todas las variables de entorno están configuradas');
}

/**
 * Verificar que base de datos de prueba existe
 * Si no existe, crear base de datos
 */
async function verifyTestDatabase() {
  console.log('2. Verificando base de datos de prueba...');

  const dbName = process.env.DB_TURNOS_NAME!;

  // Conectar sin especificar base de datos
  const connection = await mysql.createConnection({
    host: process.env.DB_TURNOS_HOST,
    port: parseInt(process.env.DB_TURNOS_PORT || '3306'),
    user: process.env.DB_TURNOS_USER,
    password: process.env.DB_TURNOS_PASSWORD,
  });

  try {
    // Verificar si BD existe
    const [databases] = await connection.query<any[]>(
      'SHOW DATABASES LIKE ?',
      [dbName]
    );

    if (databases.length === 0) {
      console.log(`   ⚠ Base de datos '${dbName}' no existe, creando...`);

      // Crear base de datos
      await connection.query(
        `CREATE DATABASE ${dbName} CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`
      );

      console.log(`   ✓ Base de datos '${dbName}' creada`);
    } else {
      console.log(`   ✓ Base de datos '${dbName}' existe`);
    }
  } finally {
    await connection.end();
  }
}

/**
 * Verificar que tablas necesarias existen
 * Si no existen, mostrar advertencia (no crearlas automáticamente)
 */
async function verifyTables() {
  console.log('3. Verificando tablas del sistema...');

  const connection = await mysql.createConnection({
    host: process.env.DB_TURNOS_HOST,
    port: parseInt(process.env.DB_TURNOS_PORT || '3306'),
    user: process.env.DB_TURNOS_USER,
    password: process.env.DB_TURNOS_PASSWORD,
    database: process.env.DB_TURNOS_NAME,
  });

  try {
    const requiredTables = [
      'ot_sys_usuarios',
      'ot_sys_refresh_tokens',
      'ot_sys_auditoria_auth',
      'ot_sys_auditoria',
      'ot_clientes',
      'ot_ubicaciones',
      'ot_puestos',
      'ot_feriados',
      'ot_configuracion_turnos',
      'ot_incentivos_puesto',
      'ot_turnos',
    ];

    const [tables] = await connection.query<any[]>('SHOW TABLES');
    const existingTables = tables.map((t: any) => Object.values(t)[0]);

    const missingTables = requiredTables.filter(
      (t) => !existingTables.includes(t)
    );

    if (missingTables.length > 0) {
      console.warn(
        `   ⚠ Tablas faltantes: ${missingTables.join(', ')}`
      );
      console.warn('   ℹ Ejecutar script SQL del schema antes de los tests');
      console.warn(
        '   ℹ Comando: mysql -u root -p < sistema_turnos_guardianes.sql'
      );

      throw new Error(
        `Tablas faltantes en base de datos de prueba. ` +
          `Ejecutar schema SQL primero.`
      );
    }

    console.log(`   ✓ Todas las tablas necesarias existen (${requiredTables.length})`);
  } finally {
    await connection.end();
  }
}

/**
 * Cargar datos de configuración inicial
 * Solo si las tablas están vacías
 */
async function seedInitialData() {
  console.log('4. Verificando datos de configuración inicial...');

  const connection = await mysql.createConnection({
    host: process.env.DB_TURNOS_HOST,
    port: parseInt(process.env.DB_TURNOS_PORT || '3306'),
    user: process.env.DB_TURNOS_USER,
    password: process.env.DB_TURNOS_PASSWORD,
    database: process.env.DB_TURNOS_NAME,
  });

  try {
    // Verificar configuracion_turnos (debe tener 2 registros: DIURNO, NOCTURNO)
    const [configRows] = await connection.query<any[]>(
      'SELECT COUNT(*) as count FROM ot_configuracion_turnos'
    );

    if (configRows[0].count === 0) {
      console.log('   ⚠ Tabla configuracion_turnos vacía, insertando datos...');

      // Reset auto_increment para que IDs sean 1 y 2 (schema valida max 2)
      await connection.query('ALTER TABLE ot_configuracion_turnos AUTO_INCREMENT = 1');
      await connection.query(`
        INSERT INTO ot_configuracion_turnos (tipo_turno, hora_inicio, hora_fin, descripcion, activo)
        VALUES
          ('DIURNO', '06:00:00', '18:00:00', 'Turno diurno (6 AM - 6 PM)', TRUE),
          ('NOCTURNO', '18:00:00', '06:00:00', 'Turno nocturno (6 PM - 6 AM)', TRUE)
      `);

      console.log('   ✓ Configuración de turnos insertada');
    } else {
      console.log('   ✓ Configuración de turnos existe');
    }

    // Verificar feriados (cargar algunos feriados de prueba si está vacío)
    const [feriadosRows] = await connection.query<any[]>(
      'SELECT COUNT(*) as count FROM ot_feriados'
    );

    if (feriadosRows[0].count === 0) {
      console.log('   ⚠ Tabla feriados vacía, insertando feriados de prueba...');

      // Insertar feriados nacionales básicos para 2026
      await connection.query(`
        INSERT INTO ot_feriados (fecha, nombre, tipo)
        VALUES
          ('2026-01-01', 'Año Nuevo', 'NACIONAL'),
          ('2026-01-06', 'Día de los Reyes Magos', 'NACIONAL'),
          ('2026-01-21', 'Día de la Altagracia', 'NACIONAL'),
          ('2026-01-26', 'Día del Padre de la Patria', 'NACIONAL'),
          ('2026-02-27', 'Día de la Independencia', 'NACIONAL'),
          ('2026-05-01', 'Día del Trabajo', 'NACIONAL'),
          ('2026-08-16', 'Día de la Restauración', 'NACIONAL'),
          ('2026-09-24', 'Día de las Mercedes', 'NACIONAL'),
          ('2026-11-06', 'Día de la Constitución', 'NACIONAL'),
          ('2026-12-25', 'Día de Navidad', 'NACIONAL')
      `);

      console.log('   ✓ Feriados de prueba insertados (10 feriados)');
    } else {
      console.log('   ✓ Feriados existen');
    }
  } finally {
    await connection.end();
  }
}

