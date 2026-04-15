/**
 * Script de prueba de conexión a bases de datos
 * OperacionesRanger - Sistema de Gestión de Turnos
 *
 * Este script valida que las conexiones a ambas bases de datos funcionan correctamente.
 *
 * Uso:
 *   ts-node scripts/test-connection.ts
 *
 * Retorna:
 *   - Código 0: Conexiones exitosas
 *   - Código 1: Error en una o ambas conexiones
 */

import { testConnections, closeConnections, getPoolsInfo } from '../src/config/database';

/**
 * Función principal
 */
async function main(): Promise<void> {
  console.log('╔════════════════════════════════════════════════════════════════╗');
  console.log('║  Test de Conexión a Bases de Datos - OperacionesRanger        ║');
  console.log('╚════════════════════════════════════════════════════════════════╝');

  // Mostrar configuración de los pools
  const poolsInfo = getPoolsInfo();

  console.log('\n📋 Configuración de Pools de Conexión:\n');

  console.log('BD Principal (turnos_guardianes):');
  console.log(`  Host: ${poolsInfo.turnos.host}:${poolsInfo.turnos.port}`);
  console.log(`  Database: ${poolsInfo.turnos.database}`);
  console.log(`  User: ${poolsInfo.turnos.user}`);
  console.log(`  Connection Limit: ${poolsInfo.turnos.connectionLimit}`);

  console.log('\nBD RRHH (db_aae4a2_ranger):');
  console.log(`  Host: ${poolsInfo.rrhh.host}:${poolsInfo.rrhh.port}`);
  console.log(`  Database: ${poolsInfo.rrhh.database}`);
  console.log(`  User: ${poolsInfo.rrhh.user}`);
  console.log(`  Connection Limit: ${poolsInfo.rrhh.connectionLimit}`);

  try {
    // Ejecutar pruebas de conexión
    const success = await testConnections();

    if (success) {
      console.log('✅ ÉXITO: Todas las conexiones funcionan correctamente');
      console.log('');

      // Cerrar conexiones
      await closeConnections();

      process.exit(0);
    } else {
      console.error('❌ ERROR: Una o más conexiones fallaron');
      console.log('');

      // Cerrar conexiones
      await closeConnections();

      process.exit(1);
    }
  } catch (error) {
    console.error('\n❌ ERROR CRÍTICO durante las pruebas de conexión:\n');

    if (error instanceof Error) {
      console.error(`  ${error.message}\n`);

      // Mostrar stack trace en modo debug
      if (process.env.LOG_LEVEL === 'debug') {
        console.error('Stack trace:');
        console.error(error.stack);
      }
    } else {
      console.error('  Error desconocido');
    }

    console.log('\n💡 Troubleshooting:\n');
    console.log('  1. Verifica que MySQL está corriendo:');
    console.log('     mysql -u root -p');
    console.log('');
    console.log('  2. Verifica las credenciales en el archivo .env:');
    console.log('     DB_TURNOS_HOST, DB_TURNOS_PORT, DB_TURNOS_NAME, etc.');
    console.log('');
    console.log('  3. Verifica que las bases de datos existen:');
    console.log('     mysql -u root -p -e "SHOW DATABASES;"');
    console.log('');
    console.log('  4. Verifica permisos del usuario:');
    console.log('     mysql -u root -p -e "SHOW GRANTS FOR \'root\'@\'localhost\';"');
    console.log('');

    // Cerrar conexiones si existen
    try {
      await closeConnections();
    } catch (closeError) {
      // Ignorar errores al cerrar
    }

    process.exit(1);
  }
}

// Ejecutar función principal
main();
