/**
 * Script de inicialización de base de datos
 * OperacionesRanger - Sistema de Gestión de Turnos
 *
 * Este script crea la base de datos turnos_guardianes desde cero
 * ejecutando el schema SQL completo.
 *
 * Uso:
 *   npm run db:init              # Crear BD si no existe
 *   npm run db:init -- --force   # Forzar recreación (DROP + CREATE)
 *
 * Flags:
 *   --force, -f  : Eliminar BD existente y recrear desde cero (DESTRUCTIVO)
 *
 * Retorna:
 *   - Código 0: BD creada exitosamente
 *   - Código 1: Error durante creación
 */

import * as mysql from 'mysql2/promise';
import * as fs from 'fs/promises';
import * as path from 'path';
import { closeConnections } from '../src/config/database';
import * as readline from 'readline';

/**
 * Interfaz para argumentos de línea de comandos
 */
interface Args {
  force: boolean;
}

/**
 * Parsear argumentos de línea de comandos
 */
function parseArgs(): Args {
  const args = process.argv.slice(2);

  return {
    force: args.includes('--force') || args.includes('-f'),
  };
}

/**
 * Solicitar confirmación al usuario
 */
function askConfirmation(question: string): Promise<boolean> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer.toLowerCase() === 's' || answer.toLowerCase() === 'y');
    });
  });
}

/**
 * Verificar si la base de datos existe
 */
async function databaseExists(connection: mysql.Connection): Promise<boolean> {
  const [rows]: any = await connection.query(
    "SELECT SCHEMA_NAME FROM INFORMATION_SCHEMA.SCHEMATA WHERE SCHEMA_NAME = 'turnos_guardianes'"
  );

  return Array.isArray(rows) && rows.length > 0;
}

/**
 * Obtener información de objetos creados en la BD
 */
async function getDatabaseInfo(connection: mysql.Connection) {
  const [tables]: any = await connection.query('SHOW TABLES');
  const [procedures]: any = await connection.query(
    "SHOW PROCEDURE STATUS WHERE Db = 'turnos_guardianes'"
  );
  const [triggers]: any = await connection.query(
    "SHOW TRIGGERS FROM turnos_guardianes"
  );

  // Contar vistas (las tablas que son vistas tienen TABLE_TYPE = 'VIEW')
  const [views]: any = await connection.query(
    `SELECT COUNT(*) as count
     FROM INFORMATION_SCHEMA.TABLES
     WHERE TABLE_SCHEMA = 'turnos_guardianes'
     AND TABLE_TYPE = 'VIEW'`
  );

  return {
    tables: tables.length,
    procedures: procedures.length,
    triggers: triggers.length,
    views: Array.isArray(views) && views.length > 0 ? views[0].count : 0,
  };
}

/**
 * Ejecutar archivo SQL completo
 */
async function executeSQLFile(
  connection: mysql.Connection,
  filePath: string
): Promise<void> {
  console.log(`[INIT] Leyendo archivo SQL: ${filePath}`);

  const sqlContent = await fs.readFile(filePath, 'utf-8');

  console.log(`[INIT] Archivo leído: ${sqlContent.length} caracteres`);

  // Dividir el contenido en statements individuales
  // Separar por punto y coma, pero ignorar los que están dentro de procedimientos
  const statements = sqlContent
    .split(';')
    .map((stmt) => stmt.trim())
    .filter((stmt) => stmt.length > 0 && !stmt.startsWith('--'));

  console.log(`[INIT] Statements encontrados: ${statements.length}`);
  console.log('[INIT] Ejecutando statements...\n');

  let currentDelimiter = ';';
  let procedureBuffer = '';
  let insideProcedure = false;

  for (let i = 0; i < statements.length; i++) {
    let stmt = statements[i];

    // Detectar si estamos dentro de un procedimiento/trigger/función
    if (
      stmt.toUpperCase().includes('DELIMITER') &&
      stmt.toUpperCase().includes('$$')
    ) {
      currentDelimiter = '$$';
      insideProcedure = true;
      continue;
    }

    if (
      stmt.toUpperCase().includes('DELIMITER') &&
      stmt.toUpperCase().includes(';')
    ) {
      currentDelimiter = ';';
      insideProcedure = false;
      continue;
    }

    // Si estamos dentro de un procedimiento, acumular en buffer
    if (insideProcedure) {
      procedureBuffer += stmt + ';';

      // Si encontramos END$$, ejecutar el procedimiento completo
      if (stmt.toUpperCase().includes('END$$')) {
        const finalStmt = procedureBuffer.replace(/\$\$/g, '');

        try {
          await connection.query(finalStmt);
          console.log(
            `[INIT] ✓ Procedimiento/Trigger/Función creado (${finalStmt.substring(0, 50)}...)`
          );
        } catch (error) {
          if (error instanceof Error) {
            console.error(`[INIT] ✗ Error ejecutando procedimiento:`);
            console.error(`       ${error.message}`);
          }
        }

        procedureBuffer = '';
        insideProcedure = false;
        currentDelimiter = ';';
        continue;
      }

      continue;
    }

    // Statements normales (fuera de procedimientos)
    if (stmt.length === 0) continue;

    // Ignorar comentarios
    if (stmt.startsWith('--')) continue;

    // Ignorar líneas de solo comentarios o espacios
    if (stmt.replace(/\s/g, '').length === 0) continue;

    try {
      await connection.query(stmt);

      // Log reducido para no saturar la consola
      if (
        stmt.toUpperCase().startsWith('CREATE TABLE') ||
        stmt.toUpperCase().startsWith('CREATE VIEW')
      ) {
        const match = stmt.match(
          /CREATE\s+(TABLE|VIEW)\s+(\w+)/i
        );
        if (match) {
          console.log(
            `[INIT] ✓ ${match[1] === 'TABLE' ? 'Tabla' : 'Vista'} creada: ${match[2]}`
          );
        }
      } else if (stmt.toUpperCase().startsWith('INSERT INTO')) {
        const match = stmt.match(/INSERT\s+(?:IGNORE\s+)?INTO\s+(\w+)/i);
        if (match) {
          // No loggear cada INSERT, solo resumir al final
        }
      }
    } catch (error) {
      // Ignorar errores de "ya existe" si no estamos en modo force
      if (error instanceof Error) {
        if (
          !error.message.includes('already exists') &&
          !error.message.includes('Duplicate entry')
        ) {
          console.error(`[INIT] ✗ Error ejecutando statement:`);
          console.error(`       ${stmt.substring(0, 100)}...`);
          console.error(`       ${error.message}`);
        }
      }
    }
  }
}

/**
 * Función principal
 */
async function main(): Promise<void> {
  console.log('╔════════════════════════════════════════════════════════════════╗');
  console.log('║  Inicialización de Base de Datos - OperacionesRanger          ║');
  console.log('╚════════════════════════════════════════════════════════════════╝\n');

  const args = parseArgs();

  // Validar ambiente de producción para operaciones destructivas
  if (args.force && process.env.NODE_ENV === 'production') {
    console.error('❌ ERROR: No se puede usar --force en ambiente de producción\n');
    console.error('   NODE_ENV=production detectado');
    console.error('   Las operaciones destructivas están bloqueadas por seguridad\n');
    process.exit(1);
  }

  // Crear conexión SIN seleccionar base de datos específica
  const connection = await mysql.createConnection({
    host: process.env.DB_TURNOS_HOST || 'localhost',
    port: Number(process.env.DB_TURNOS_PORT) || 3306,
    user: process.env.DB_TURNOS_USER || 'root',
    password: process.env.DB_TURNOS_PASSWORD,
    multipleStatements: true, // Permitir múltiples statements
  });

  try {
    console.log('[INIT] Conectado a MySQL');

    // Verificar si la BD ya existe
    const exists = await databaseExists(connection);

    if (exists) {
      if (args.force) {
        console.log('\n⚠️  ADVERTENCIA: La base de datos turnos_guardianes ya existe');
        console.log('⚠️  El flag --force eliminará TODOS los datos existentes\n');

        const confirmed = await askConfirmation(
          '¿Estás seguro de que deseas ELIMINAR y RECREAR la base de datos? (s/n): '
        );

        if (!confirmed) {
          console.log('\n[INIT] Operación cancelada por el usuario');
          await connection.end();
          process.exit(0);
        }

        console.log('\n[INIT] Eliminando base de datos existente...');
        await connection.query('DROP DATABASE IF EXISTS turnos_guardianes');
        console.log('[INIT] ✓ Base de datos eliminada\n');
      } else {
        console.log('ℹ️  La base de datos turnos_guardianes ya existe\n');
        console.log('   Opciones:');
        console.log('   1. Usar --force para forzar recreación (DESTRUCTIVO)');
        console.log('      npm run db:init -- --force\n');
        console.log('   2. Usar la base de datos existente sin cambios\n');

        await connection.end();
        process.exit(0);
      }
    }

    // Ejecutar archivo SQL
    const sqlFilePath = path.join(
      __dirname,
      '..',
      '..',
      'sistema_turnos_guardianes.sql'
    );

    console.log('[INIT] Ruta del archivo SQL:');
    console.log(`       ${sqlFilePath}\n`);

    // Verificar que el archivo existe
    try {
      await fs.access(sqlFilePath);
    } catch (error) {
      console.error(`❌ ERROR: Archivo SQL no encontrado: ${sqlFilePath}\n`);
      console.error('   Verifica que el archivo sistema_turnos_guardianes.sql existe');
      console.error('   en la raíz del proyecto\n');
      await connection.end();
      process.exit(1);
    }

    await executeSQLFile(connection, sqlFilePath);

    // Seleccionar la BD recién creada
    await connection.query('USE turnos_guardianes');

    // Obtener información de objetos creados
    const info = await getDatabaseInfo(connection);

    console.log('\n╔════════════════════════════════════════════════════════════════╗');
    console.log('║  Resumen de Inicialización                                     ║');
    console.log('╚════════════════════════════════════════════════════════════════╝\n');
    console.log(`✅ Base de datos: turnos_guardianes`);
    console.log(`✅ Tablas creadas: ${info.tables}`);
    console.log(`✅ Procedimientos almacenados: ${info.procedures}`);
    console.log(`✅ Triggers: ${info.triggers}`);
    console.log(`✅ Vistas: ${info.views}`);
    console.log('');
    console.log('✅ ÉXITO: Base de datos inicializada correctamente');
    console.log('');
    console.log('Próximos pasos:');
    console.log('  1. Probar conexiones: npm run db:test');
    console.log('  2. Cargar feriados: npm run db:seed');
    console.log('  3. Ver queries de ejemplo: npm run db:examples');
    console.log('');

    await connection.end();
    await closeConnections();

    process.exit(0);
  } catch (error) {
    console.error('\n❌ ERROR CRÍTICO durante la inicialización:\n');

    if (error instanceof Error) {
      console.error(`  ${error.message}\n`);

      if (process.env.LOG_LEVEL === 'debug') {
        console.error('Stack trace:');
        console.error(error.stack);
      }
    } else {
      console.error('  Error desconocido');
    }

    console.log('\n💡 Troubleshooting:\n');
    console.log('  1. Verifica que MySQL está corriendo');
    console.log('  2. Verifica las credenciales en el archivo .env');
    console.log('  3. Verifica que el archivo sistema_turnos_guardianes.sql existe');
    console.log('  4. Verifica permisos del usuario MySQL para crear BDs');
    console.log('');

    try {
      await connection.end();
      await closeConnections();
    } catch (closeError) {
      // Ignorar errores al cerrar
    }

    process.exit(1);
  }
}

// Ejecutar función principal
main();
