/**
 * Script de carga de feriados nacionales
 * OperacionesRanger - Sistema de Gestión de Turnos
 *
 * Este script carga los feriados nacionales de República Dominicana
 * para un año específico, incluyendo el cálculo automático de fechas móviles
 * (Viernes Santo y Corpus Christi).
 *
 * Uso:
 *   npm run db:seed                  # Cargar feriados del próximo año
 *   npm run db:seed -- --year=2027   # Cargar feriados de un año específico
 *   npm run db:seed -- -y 2027       # Forma corta
 *   npm run db:seed -- --year=2027 --force  # Eliminar existentes y recargar
 *
 * Flags:
 *   --year=YYYY, -y YYYY  : Año a cargar (por defecto: año actual + 1)
 *   --force, -f           : Eliminar feriados existentes del año antes de insertar
 *
 * Retorna:
 *   - Código 0: Feriados cargados exitosamente
 *   - Código 1: Error durante carga
 */

import { getTurnosPool, closeConnections } from '../src/config/database';
import * as readline from 'readline';

/**
 * Interfaz para argumentos de línea de comandos
 */
interface Args {
  year: number;
  force: boolean;
}

/**
 * Interfaz para feriado
 */
interface Feriado {
  fecha: string;
  nombre: string;
  tipo: 'NACIONAL' | 'DECRETO';
  descripcion: string;
}

/**
 * Parsear argumentos de línea de comandos
 */
function parseArgs(): Args {
  const args = process.argv.slice(2);
  const currentYear = new Date().getFullYear();

  // Buscar parámetro --year o -y
  let year = currentYear + 1; // Por defecto: próximo año
  const yearArg = args.find(
    (arg) => arg.startsWith('--year=') || arg.startsWith('-y')
  );

  if (yearArg) {
    if (yearArg.startsWith('--year=')) {
      year = parseInt(yearArg.split('=')[1], 10);
    } else if (yearArg === '-y') {
      const index = args.indexOf(yearArg);
      if (index !== -1 && args[index + 1]) {
        year = parseInt(args[index + 1], 10);
      }
    }
  }

  return {
    year,
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
 * Calcular fecha de Pascua (Domingo de Resurrección) usando el algoritmo de Computus
 * Basado en el algoritmo anónimo gregoriano
 *
 * @param year Año para calcular la Pascua
 * @returns Date objeto con la fecha de Pascua
 */
function calcularPascua(year: number): Date {
  const a = year % 19;
  const b = Math.floor(year / 100);
  const c = year % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31);
  const day = ((h + l - 7 * m + 114) % 31) + 1;

  return new Date(year, month - 1, day);
}

/**
 * Calcular fecha de Viernes Santo (2 días antes de Pascua)
 */
function calcularViernesSanto(year: number): Date {
  const pascua = calcularPascua(year);
  const viernesSanto = new Date(pascua);
  viernesSanto.setDate(pascua.getDate() - 2);
  return viernesSanto;
}

/**
 * Calcular fecha de Corpus Christi (60 días después de Pascua)
 */
function calcularCorpusChristi(year: number): Date {
  const pascua = calcularPascua(year);
  const corpus = new Date(pascua);
  corpus.setDate(pascua.getDate() + 60);
  return corpus;
}

/**
 * Formatear fecha a formato ISO (YYYY-MM-DD)
 */
function formatearFecha(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Generar lista de feriados nacionales de RD para un año específico
 */
function generarFeriados(year: number): Feriado[] {
  const viernesSanto = calcularViernesSanto(year);
  const corpusChristi = calcularCorpusChristi(year);

  const feriados: Feriado[] = [
    {
      fecha: `${year}-01-01`,
      nombre: 'Año Nuevo',
      tipo: 'NACIONAL',
      descripcion: 'Celebración del primer día del año - No se cambia',
    },
    {
      fecha: `${year}-01-06`,
      nombre: 'Día de los Santos Reyes',
      tipo: 'NACIONAL',
      descripcion: 'Día de Reyes - Festividad religiosa',
    },
    {
      fecha: `${year}-01-21`,
      nombre: 'Día de Nuestra Señora de la Altagracia',
      tipo: 'NACIONAL',
      descripcion: 'Patrona del pueblo dominicano - No se cambia',
    },
    {
      fecha: `${year}-01-26`,
      nombre: 'Día del Padre de la Patria (Juan Pablo Duarte)',
      tipo: 'NACIONAL',
      descripcion: 'Natalicio de Juan Pablo Duarte - No se cambia',
    },
    {
      fecha: `${year}-02-27`,
      nombre: 'Día de la Independencia Nacional',
      tipo: 'NACIONAL',
      descripcion: 'Independencia de la República Dominicana - No se cambia',
    },
    {
      fecha: formatearFecha(viernesSanto),
      nombre: 'Viernes Santo',
      tipo: 'NACIONAL',
      descripcion: `Festividad religiosa, conmemoración de la muerte de Jesucristo - Fecha móvil (calculada: ${formatearFecha(viernesSanto)})`,
    },
    {
      fecha: `${year}-05-01`,
      nombre: 'Día del Trabajo',
      tipo: 'NACIONAL',
      descripcion: 'Día Internacional del Trabajo',
    },
    {
      fecha: formatearFecha(corpusChristi),
      nombre: 'Corpus Christi',
      tipo: 'NACIONAL',
      descripcion: `Festividad religiosa - Fecha móvil (calculada: ${formatearFecha(corpusChristi)})`,
    },
    {
      fecha: `${year}-08-16`,
      nombre: 'Día de la Restauración',
      tipo: 'NACIONAL',
      descripcion: 'Conmemoración de la Restauración de la República',
    },
    {
      fecha: `${year}-09-24`,
      nombre: 'Día de Nuestra Señora de las Mercedes',
      tipo: 'NACIONAL',
      descripcion: 'Festividad religiosa - Patrona de la República Dominicana',
    },
    {
      fecha: `${year}-11-06`,
      nombre: 'Día de la Constitución',
      tipo: 'NACIONAL',
      descripcion: 'Día de la Constitución Dominicana',
    },
    {
      fecha: `${year}-12-25`,
      nombre: 'Día de Navidad',
      tipo: 'NACIONAL',
      descripcion: 'Natividad de Jesucristo',
    },
  ];

  return feriados;
}

/**
 * Función principal
 */
async function main(): Promise<void> {
  console.log('╔════════════════════════════════════════════════════════════════╗');
  console.log('║  Carga de Feriados Nacionales - OperacionesRanger             ║');
  console.log('╚════════════════════════════════════════════════════════════════╝\n');

  const args = parseArgs();
  const currentYear = new Date().getFullYear();

  // Validar año
  if (isNaN(args.year)) {
    console.error('❌ ERROR: Año inválido\n');
    console.error('   Uso: npm run db:seed -- --year=2027\n');
    process.exit(1);
  }

  if (args.year < currentYear) {
    console.error(`❌ ERROR: El año debe ser >= ${currentYear}\n`);
    console.error('   No tiene sentido cargar feriados de años pasados\n');
    process.exit(1);
  }

  console.log(`📅 Año a cargar: ${args.year}`);
  console.log(`🔧 Modo: ${args.force ? 'Forzar recarga (eliminar existentes)' : 'Insertar nuevos'}\n`);

  // Generar feriados
  const feriados = generarFeriados(args.year);

  console.log(`📋 Feriados generados: ${feriados.length}`);
  console.log('');

  // Mostrar fechas móviles calculadas
  const viernesSanto = feriados.find((f) => f.nombre === 'Viernes Santo');
  const corpusChristi = feriados.find((f) => f.nombre === 'Corpus Christi');

  if (viernesSanto) {
    console.log(`🔢 Viernes Santo (calculado): ${viernesSanto.fecha}`);
  }
  if (corpusChristi) {
    console.log(`🔢 Corpus Christi (calculado): ${corpusChristi.fecha}`);
  }
  console.log('');

  try {
    const pool = getTurnosPool();

    // Si modo force, eliminar feriados existentes del año
    if (args.force) {
      console.log(`⚠️  ADVERTENCIA: Eliminar feriados existentes del año ${args.year}\n`);

      const confirmed = await askConfirmation(
        `¿Estás seguro de eliminar feriados del año ${args.year}? (s/n): `
      );

      if (!confirmed) {
        console.log('\n[SEED] Operación cancelada por el usuario');
        await closeConnections();
        process.exit(0);
      }

      console.log(`\n[SEED] Eliminando feriados del año ${args.year}...`);
      const [result]: any = await pool.query(
        'DELETE FROM ot_feriados WHERE YEAR(fecha) = ?',
        [args.year]
      );

      console.log(`[SEED] ✓ Feriados eliminados: ${result.affectedRows}\n`);
    }

    // Verificar feriados existentes
    console.log('[SEED] Verificando feriados existentes...');
    const [existentes]: any = await pool.query(
      'SELECT fecha, nombre FROM ot_feriados WHERE YEAR(fecha) = ?',
      [args.year]
    );

    if (Array.isArray(existentes) && existentes.length > 0) {
      console.log(`[SEED] ℹ️  Feriados ya existentes: ${existentes.length}`);

      if (!args.force) {
        console.log('[SEED] ℹ️  Se insertarán solo los feriados nuevos (sin duplicados)\n');
      }
    } else {
      console.log('[SEED] ✓ No hay feriados existentes para este año\n');
    }

    // Insertar feriados (usando INSERT IGNORE para evitar duplicados)
    console.log('[SEED] Insertando feriados...\n');

    let insertados = 0;
    let duplicados = 0;

    for (const feriado of feriados) {
      try {
        const [result]: any = await pool.query(
          'INSERT IGNORE INTO ot_feriados (fecha, nombre, tipo, descripcion) VALUES (?, ?, ?, ?)',
          [feriado.fecha, feriado.nombre, feriado.tipo, feriado.descripcion]
        );

        if (result.affectedRows > 0) {
          console.log(`[SEED] ✓ ${feriado.fecha} - ${feriado.nombre}`);
          insertados++;
        } else {
          console.log(`[SEED] ⊗ ${feriado.fecha} - ${feriado.nombre} (ya existe)`);
          duplicados++;
        }
      } catch (error) {
        if (error instanceof Error) {
          console.error(`[SEED] ✗ Error insertando ${feriado.fecha}: ${error.message}`);
        }
      }
    }

    console.log('\n╔════════════════════════════════════════════════════════════════╗');
    console.log('║  Resumen de Carga de Feriados                                  ║');
    console.log('╚════════════════════════════════════════════════════════════════╝\n');
    console.log(`📅 Año: ${args.year}`);
    console.log(`✅ Feriados insertados: ${insertados}`);
    console.log(`⊗  Feriados duplicados (omitidos): ${duplicados}`);
    console.log(`📊 Total procesados: ${feriados.length}`);
    console.log('');

    if (insertados > 0) {
      console.log('✅ ÉXITO: Feriados cargados correctamente');
    } else if (duplicados === feriados.length) {
      console.log('ℹ️  INFO: Todos los feriados ya existían en la base de datos');
      console.log('   Usa --force para eliminar y recargar');
    }

    console.log('');
    console.log('Próximos pasos:');
    console.log('  - Verificar feriados: npm run db:examples');
    console.log(`  - Cargar otro año: npm run db:seed -- --year=${args.year + 1}`);
    console.log('');

    await closeConnections();
    process.exit(0);
  } catch (error) {
    console.error('\n❌ ERROR CRÍTICO durante la carga de feriados:\n');

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
    console.log('  2. Verifica que la tabla ot_feriados existe');
    console.log('  3. Verifica conexión a la BD: npm run db:test');
    console.log('  4. Verifica credenciales en el archivo .env');
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
