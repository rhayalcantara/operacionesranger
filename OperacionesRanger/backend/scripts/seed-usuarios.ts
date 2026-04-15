/**
 * Script de carga de usuarios de prueba
 * OperacionesRanger - Sistema de Gestión de Turnos
 *
 * Este script carga usuarios de prueba en la tabla sys_usuarios
 * para facilitar el desarrollo y testing del sistema.
 *
 * Uso:
 *   npm run db:seed:usuarios           # Cargar usuarios (solo si no existen)
 *   npm run db:seed:usuarios -- --force  # Eliminar existentes y recargar
 *   npm run db:seed:usuarios -- -f       # Forma corta de --force
 *
 * Flags:
 *   --force, -f  : Eliminar usuarios existentes antes de insertar
 *
 * Retorna:
 *   - Código 0: Usuarios cargados exitosamente
 *   - Código 1: Error durante carga
 */

import { getTurnosPool, closeConnections } from '../src/config/database';
import { hashPasswordSync } from '../src/services/password.service';
import * as readline from 'readline';

/**
 * Interfaz para argumentos de línea de comandos
 */
interface Args {
  force: boolean;
}

/**
 * Interfaz para usuario de prueba
 */
interface Usuario {
  username: string;
  password: string;  // Texto plano (se hasheará)
  email: string;
  nombre_completo: string;
  rol: 'ADMIN' | 'SUPERVISOR' | 'CONSULTA';
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
 * Generar lista de usuarios de prueba
 */
function generarUsuarios(): Usuario[] {
  const usuarios: Usuario[] = [
    {
      username: 'admin',
      password: 'Admin123!',
      email: 'admin@operacionesranger.com',
      nombre_completo: 'Administrador del Sistema',
      rol: 'ADMIN',
    },
    {
      username: 'supervisor',
      password: 'Super123!',
      email: 'supervisor@operacionesranger.com',
      nombre_completo: 'Supervisor de Turnos',
      rol: 'SUPERVISOR',
    },
    {
      username: 'consulta',
      password: 'Consulta123!',
      email: 'consulta@operacionesranger.com',
      nombre_completo: 'Usuario de Consulta',
      rol: 'CONSULTA',
    },
  ];

  return usuarios;
}

/**
 * Función principal
 */
async function main(): Promise<void> {
  console.log('╔════════════════════════════════════════════════════════════════╗');
  console.log('║  Carga de Usuarios de Prueba - OperacionesRanger              ║');
  console.log('╚════════════════════════════════════════════════════════════════╝\n');

  const args = parseArgs();

  // VALIDACIÓN DE SEGURIDAD: Solo ejecutar en development o test
  const nodeEnv = process.env.NODE_ENV || 'development';

  if (nodeEnv === 'production') {
    console.error('❌ ERROR: Este script NO puede ejecutarse en producción\n');
    console.error('   NODE_ENV actual: production');
    console.error('   Este script es solo para ambientes de desarrollo y testing\n');
    console.error('💡 Si necesitas crear usuarios en producción, usa el endpoint');
    console.error('   POST /api/usuarios con credenciales de administrador\n');
    process.exit(1);
  }

  console.log(`🔧 Ambiente: ${nodeEnv}`);
  console.log(`🔧 Modo: ${args.force ? 'Forzar recarga (eliminar existentes)' : 'Insertar nuevos'}\n`);

  // Generar usuarios
  const usuarios = generarUsuarios();

  console.log(`📋 Usuarios de prueba a cargar: ${usuarios.length}\n`);

  // Mostrar usuarios que se van a crear
  console.log('Usuarios a crear:');
  usuarios.forEach((u, index) => {
    console.log(`${index + 1}. ${u.username.padEnd(15)} (${u.rol.padEnd(10)}) - ${u.nombre_completo}`);
  });
  console.log('');

  try {
    const pool = getTurnosPool();

    // Si modo force, eliminar usuarios existentes
    if (args.force) {
      console.log('⚠️  ADVERTENCIA: Eliminar usuarios de prueba existentes\n');

      const confirmed = await askConfirmation(
        '¿Estás seguro de eliminar usuarios de prueba? (s/n): '
      );

      if (!confirmed) {
        console.log('\n[SEED] Operación cancelada por el usuario');
        await closeConnections();
        process.exit(0);
      }

      console.log('\n[SEED] Eliminando usuarios de prueba...');

      // Eliminar solo usuarios con los usernames específicos
      const usernamesToDelete = usuarios.map((u) => u.username);

      const placeholders = usernamesToDelete.map(() => '?').join(',');
      const [result]: any = await pool.query(
        `DELETE FROM ot_sys_usuarios WHERE username IN (${placeholders})`,
        usernamesToDelete
      );

      console.log(`[SEED] ✓ Usuarios eliminados: ${result.affectedRows}\n`);
    }

    // Verificar usuarios existentes
    console.log('[SEED] Verificando usuarios existentes...');
    const [existentes]: any = await pool.query(
      'SELECT username FROM ot_sys_usuarios WHERE username IN (?, ?, ?)',
      usuarios.map((u) => u.username)
    );

    if (Array.isArray(existentes) && existentes.length > 0) {
      console.log(`[SEED] ℹ️  Usuarios ya existentes: ${existentes.length}`);
      existentes.forEach((u: any) => {
        console.log(`[SEED]   - ${u.username}`);
      });

      if (!args.force) {
        console.log('[SEED] ℹ️  Se insertarán solo los usuarios nuevos (sin duplicados)\n');
      }
    } else {
      console.log('[SEED] ✓ No hay usuarios de prueba existentes\n');
    }

    // Insertar usuarios
    console.log('[SEED] Insertando usuarios...\n');

    let insertados = 0;
    let duplicados = 0;
    let errores = 0;

    for (const usuario of usuarios) {
      try {
        // Hashear password
        const passwordHash = hashPasswordSync(usuario.password);

        // Intentar insertar usuario
        const [result]: any = await pool.query(
          `INSERT IGNORE INTO ot_sys_usuarios
           (username, password_hash, email, nombre_completo, rol, activo)
           VALUES (?, ?, ?, ?, ?, ?)`,
          [
            usuario.username,
            passwordHash,
            usuario.email,
            usuario.nombre_completo,
            usuario.rol,
            true,
          ]
        );

        if (result.affectedRows > 0) {
          console.log(
            `[SEED] ✓ ${usuario.username.padEnd(15)} - ${usuario.rol.padEnd(10)} (insertado)`
          );
          insertados++;
        } else {
          console.log(
            `[SEED] ⊗ ${usuario.username.padEnd(15)} - ${usuario.rol.padEnd(10)} (ya existe)`
          );
          duplicados++;
        }
      } catch (error) {
        errores++;
        if (error instanceof Error) {
          console.error(
            `[SEED] ✗ ${usuario.username.padEnd(15)} - Error: ${error.message}`
          );
        } else {
          console.error(
            `[SEED] ✗ ${usuario.username.padEnd(15)} - Error desconocido`
          );
        }
      }
    }

    console.log('\n╔════════════════════════════════════════════════════════════════╗');
    console.log('║  Resumen de Carga de Usuarios                                  ║');
    console.log('╚════════════════════════════════════════════════════════════════╝\n');
    console.log(`✅ Usuarios insertados: ${insertados}`);
    console.log(`⊗  Usuarios duplicados (omitidos): ${duplicados}`);
    console.log(`✗  Errores: ${errores}`);
    console.log(`📊 Total procesados: ${usuarios.length}`);
    console.log('');

    if (insertados > 0) {
      console.log('✅ ÉXITO: Usuarios de prueba cargados correctamente\n');
      console.log('Credenciales de acceso:\n');

      usuarios.forEach((u) => {
        console.log(`  ${u.rol}:`);
        console.log(`    Username: ${u.username}`);
        console.log(`    Password: ${u.password}`);
        console.log(`    Email: ${u.email}`);
        console.log('');
      });

      console.log('⚠️  IMPORTANTE: Estos passwords son solo para desarrollo/testing.');
      console.log('   En producción, crear usuarios con passwords seguros únicos.\n');
    } else if (duplicados === usuarios.length) {
      console.log('ℹ️  INFO: Todos los usuarios ya existían en la base de datos');
      console.log('   Usa --force para eliminar y recargar\n');
    }

    if (errores > 0) {
      console.log('⚠️  ADVERTENCIA: Algunos usuarios no se pudieron cargar');
      console.log('   Revisa los errores anteriores para más detalles\n');
    }

    console.log('Próximos pasos:');
    console.log('  - Probar login: POST /api/auth/login con credenciales de prueba');
    console.log('  - Listar usuarios: GET /api/usuarios (requiere token ADMIN)');
    console.log('  - Verificar BD: SELECT * FROM ot_sys_usuarios;');
    console.log('');

    await closeConnections();
    process.exit(errores > 0 ? 1 : 0);
  } catch (error) {
    console.error('\n❌ ERROR CRÍTICO durante la carga de usuarios:\n');

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
    console.log('  1. Verifica que la BD turnos_guardianes existe');
    console.log('  2. Verifica que la tabla ot_sys_usuarios existe');
    console.log('  3. Verifica conexión a la BD: npm run db:test');
    console.log('  4. Verifica credenciales en el archivo .env');
    console.log('  5. Verifica que las migraciones de auth se ejecutaron (T2.01)');
    console.log('');

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
