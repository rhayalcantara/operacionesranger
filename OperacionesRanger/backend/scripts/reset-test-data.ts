/**
 * Script de reset de datos de prueba
 * OperacionesRanger - Sistema de Gestión de Turnos
 *
 * Este script elimina y recarga datos de prueba en ambiente de desarrollo.
 * SOLO funciona en NODE_ENV=development para evitar pérdida accidental de datos.
 *
 * Uso:
 *   npm run db:reset
 *
 * Retorna:
 *   - Código 0: Datos reseteados exitosamente
 *   - Código 1: Error durante reset o ambiente no permitido
 */

import { getTurnosPool, closeConnections } from '../src/config/database';
import * as readline from 'readline';

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
 * Eliminar datos de prueba
 */
async function deleteTestData(pool: any): Promise<void> {
  console.log('\n[RESET] Eliminando datos de prueba...\n');

  // Eliminar en orden de dependencias (de hijos a padres)
  const tablas = [
    { nombre: 'turnos', descripcion: 'Turnos registrados' },
    { nombre: 'incentivos_puesto', descripcion: 'Incentivos por puesto' },
    { nombre: 'puestos', descripcion: 'Puestos de vigilancia' },
    { nombre: 'ubicaciones', descripcion: 'Ubicaciones de clientes' },
    { nombre: 'clientes', descripcion: 'Clientes' },
  ];

  let totalEliminados = 0;

  for (const tabla of tablas) {
    const [result]: any = await pool.query(`DELETE FROM ${tabla.nombre}`);
    console.log(`[RESET] ✓ ${tabla.descripcion}: ${result.affectedRows} registros eliminados`);
    totalEliminados += result.affectedRows;
  }

  console.log(`\n[RESET] Total eliminados: ${totalEliminados} registros\n`);
}

/**
 * Cargar datos de prueba frescos
 */
async function loadTestData(pool: any): Promise<void> {
  console.log('[RESET] Cargando datos de prueba frescos...\n');

  let totalInsertados = 0;

  // 1. Insertar clientes de prueba
  console.log('[RESET] Insertando clientes de prueba...');
  const clientes = [
    {
      codigo: 'CLI-001',
      nombre: 'Empresa Banco Central',
      rnc: '401-50625-9',
      telefono: '809-221-9111',
      email: 'seguridad@bancocentral.gob.do',
      direccion: 'Av. Pedro Henríquez Ureña, Santo Domingo',
      contacto_nombre: 'Juan Pérez',
      contacto_telefono: '809-555-0001',
    },
    {
      codigo: 'CLI-002',
      nombre: 'Centro Comercial Ágora Mall',
      rnc: '131-48259-7',
      telefono: '809-683-2888',
      email: 'seguridad@agoramall.com.do',
      direccion: 'Av. Abraham Lincoln, Santo Domingo',
      contacto_nombre: 'María González',
      contacto_telefono: '809-555-0002',
    },
  ];

  const clienteIds: number[] = [];

  for (const cliente of clientes) {
    const [result]: any = await pool.query(
      `INSERT INTO clientes (codigo, nombre, rnc, telefono, email, direccion, contacto_nombre, contacto_telefono)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        cliente.codigo,
        cliente.nombre,
        cliente.rnc,
        cliente.telefono,
        cliente.email,
        cliente.direccion,
        cliente.contacto_nombre,
        cliente.contacto_telefono,
      ]
    );
    clienteIds.push(result.insertId);
    console.log(`[RESET]   ✓ Cliente: ${cliente.nombre} (ID: ${result.insertId})`);
    totalInsertados++;
  }

  // 2. Insertar ubicaciones de prueba
  console.log('\n[RESET] Insertando ubicaciones de prueba...');
  const ubicaciones = [
    {
      cliente_id: clienteIds[0], // Banco Central
      codigo: 'UBI-001',
      nombre: 'Oficina Principal Banco Central',
      direccion: 'Av. Pedro Henríquez Ureña, Santo Domingo',
      provincia: 'Distrito Nacional',
      municipio: 'Santo Domingo',
      sector: 'Gazcue',
    },
    {
      cliente_id: clienteIds[0], // Banco Central
      codigo: 'UBI-002',
      nombre: 'Sucursal Banco Central - Santiago',
      direccion: 'Calle del Sol, Santiago',
      provincia: 'Santiago',
      municipio: 'Santiago',
      sector: 'Centro',
    },
    {
      cliente_id: clienteIds[1], // Ágora Mall
      codigo: 'UBI-003',
      nombre: 'Ágora Mall - Edificio Principal',
      direccion: 'Av. Abraham Lincoln, Santo Domingo',
      provincia: 'Distrito Nacional',
      municipio: 'Santo Domingo',
      sector: 'Ensanche Piantini',
    },
  ];

  const ubicacionIds: number[] = [];

  for (const ubicacion of ubicaciones) {
    const [result]: any = await pool.query(
      `INSERT INTO ubicaciones (cliente_id, codigo, nombre, direccion, provincia, municipio, sector)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        ubicacion.cliente_id,
        ubicacion.codigo,
        ubicacion.nombre,
        ubicacion.direccion,
        ubicacion.provincia,
        ubicacion.municipio,
        ubicacion.sector,
      ]
    );
    ubicacionIds.push(result.insertId);
    console.log(`[RESET]   ✓ Ubicación: ${ubicacion.nombre} (ID: ${result.insertId})`);
    totalInsertados++;
  }

  // 3. Insertar puestos de prueba
  console.log('\n[RESET] Insertando puestos de prueba...');
  const puestos = [
    {
      ubicacion_id: ubicacionIds[0], // Oficina Principal Banco Central
      codigo: 'P-001',
      nombre: 'Entrada Principal',
      descripcion: 'Control de acceso entrada principal',
      cantidad_guardianes: 2,
    },
    {
      ubicacion_id: ubicacionIds[0], // Oficina Principal Banco Central
      codigo: 'P-002',
      nombre: 'Bóveda Principal',
      descripcion: 'Vigilancia de bóveda principal',
      cantidad_guardianes: 1,
    },
    {
      ubicacion_id: ubicacionIds[1], // Sucursal Santiago
      codigo: 'P-003',
      nombre: 'Entrada Santiago',
      descripcion: 'Control de acceso sucursal Santiago',
      cantidad_guardianes: 1,
    },
    {
      ubicacion_id: ubicacionIds[2], // Ágora Mall
      codigo: 'P-004',
      nombre: 'Estacionamiento Ágora',
      descripcion: 'Vigilancia de estacionamiento',
      cantidad_guardianes: 2,
    },
    {
      ubicacion_id: ubicacionIds[2], // Ágora Mall
      codigo: 'P-005',
      nombre: 'Entrada Principal Mall',
      descripcion: 'Control de acceso entrada principal del mall',
      cantidad_guardianes: 3,
    },
  ];

  const puestoIds: number[] = [];

  for (const puesto of puestos) {
    const [result]: any = await pool.query(
      `INSERT INTO puestos (ubicacion_id, codigo, nombre, descripcion, cantidad_guardianes)
       VALUES (?, ?, ?, ?, ?)`,
      [
        puesto.ubicacion_id,
        puesto.codigo,
        puesto.nombre,
        puesto.descripcion,
        puesto.cantidad_guardianes,
      ]
    );
    puestoIds.push(result.insertId);
    console.log(`[RESET]   ✓ Puesto: ${puesto.nombre} (ID: ${result.insertId})`);
    totalInsertados++;
  }

  // 4. Insertar turnos de prueba (últimos 7 días)
  console.log('\n[RESET] Insertando turnos de prueba (últimos 7 días)...');

  // IDs de empleados de ejemplo (guardianes ficticios)
  // En producción, estos IDs deberían existir en la tabla rh_empleado
  const empleadosEjemplo = [1001, 1002, 1003, 1004, 1005];

  const today = new Date();
  let turnosInsertados = 0;

  for (let i = 0; i < 7; i++) {
    const fecha = new Date(today);
    fecha.setDate(today.getDate() - i);
    const fechaStr = fecha.toISOString().split('T')[0];

    // Crear 2 turnos por día (diferentes empleados y puestos)
    for (let j = 0; j < 2; j++) {
      const empleadoId = empleadosEjemplo[j % empleadosEjemplo.length];
      const puestoId = puestoIds[j % puestoIds.length]; // Usar IDs reales de puestos
      const esDiurno = j % 2 === 0;

      try {
        await pool.query(
          `INSERT INTO turnos
           (empleado_id, puesto_id, fecha, hora_entrada, hora_salida, horas_normales, horas_extras, created_by)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            empleadoId,
            puestoId,
            fechaStr,
            esDiurno ? '06:00:00' : '18:00:00',
            esDiurno ? '16:00:00' : '04:00:00',
            10.0,
            0.0,
            1, // created_by (usuario admin)
          ]
        );
        turnosInsertados++;
      } catch (error) {
        // Ignorar errores de duplicado (mismo empleado, puesto, fecha)
      }
    }
  }

  console.log(`[RESET]   ✓ Turnos: ${turnosInsertados} turnos insertados`);
  totalInsertados += turnosInsertados;

  // 5. Insertar incentivos de prueba
  console.log('\n[RESET] Insertando incentivos de prueba...');

  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth() + 1; // 1-12
  const currentQuincena = new Date().getDate() <= 15 ? 1 : 2;
  const quincenaGlobal = (currentMonth - 1) * 2 + currentQuincena; // 1-24

  // Calcular fechas de la quincena actual
  const fechaInicio = new Date(
    currentYear,
    currentMonth - 1,
    currentQuincena === 1 ? 1 : 16
  );
  const fechaFin = new Date(
    currentYear,
    currentMonth - 1,
    currentQuincena === 1 ? 15 : new Date(currentYear, currentMonth, 0).getDate()
  );

  const incentivos = [
    {
      puesto_id: puestoIds[0], // Entrada Principal
      monto: 5400.0, // RD$5,400 / quincena
      observaciones: 'Incentivo por puesto crítico - Entrada Principal',
    },
    {
      puesto_id: puestoIds[1], // Bóveda Principal
      monto: 7200.0, // RD$7,200 / quincena
      observaciones: 'Incentivo por puesto de alta seguridad - Bóveda',
    },
  ];

  for (const incentivo of incentivos) {
    await pool.query(
      `INSERT INTO incentivos_puesto
       (puesto_id, anio, quincena, monto, fecha_inicio, fecha_fin, observaciones)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        incentivo.puesto_id,
        currentYear,
        quincenaGlobal,
        incentivo.monto,
        fechaInicio.toISOString().split('T')[0],
        fechaFin.toISOString().split('T')[0],
        incentivo.observaciones,
      ]
    );
    console.log(
      `[RESET]   ✓ Incentivo: Puesto ${incentivo.puesto_id} - RD$${incentivo.monto.toFixed(2)}`
    );
    totalInsertados++;
  }

  console.log(`\n[RESET] Total insertados: ${totalInsertados} registros\n`);
}

/**
 * Función principal
 */
async function main(): Promise<void> {
  console.log('╔════════════════════════════════════════════════════════════════╗');
  console.log('║  Reset de Datos de Prueba - OperacionesRanger                 ║');
  console.log('╚════════════════════════════════════════════════════════════════╝\n');

  // Validar ambiente de desarrollo
  if (process.env.NODE_ENV !== 'development') {
    console.error('❌ ERROR: Este script SOLO puede ejecutarse en ambiente de desarrollo\n');
    console.error(`   NODE_ENV actual: ${process.env.NODE_ENV || 'no definido'}`);
    console.error('   NODE_ENV requerido: development\n');
    console.error('💡 Para usar este script, configura en tu archivo .env:');
    console.error('   NODE_ENV=development\n');
    process.exit(1);
  }

  console.log('⚠️  ADVERTENCIA: Este script eliminará TODOS los datos de prueba\n');
  console.log('Datos que se eliminarán:');
  console.log('  - Todos los turnos registrados');
  console.log('  - Todos los incentivos por puesto');
  console.log('  - Todos los puestos de vigilancia');
  console.log('  - Todas las ubicaciones');
  console.log('  - Todos los clientes');
  console.log('');
  console.log('Datos que NO se tocarán:');
  console.log('  - Feriados');
  console.log('  - Configuración de turnos');
  console.log('  - Empleados (tabla en BD RRHH)');
  console.log('');

  const confirmed = await askConfirmation(
    '¿Estás seguro de que deseas ELIMINAR y RECARGAR datos de prueba? (s/n): '
  );

  if (!confirmed) {
    console.log('\n[RESET] Operación cancelada por el usuario');
    process.exit(0);
  }

  try {
    const pool = getTurnosPool();

    // Eliminar datos existentes
    await deleteTestData(pool);

    // Cargar datos de prueba frescos
    await loadTestData(pool);

    console.log('╔════════════════════════════════════════════════════════════════╗');
    console.log('║  Resumen de Reset de Datos                                     ║');
    console.log('╚════════════════════════════════════════════════════════════════╝\n');
    console.log('✅ Datos de prueba eliminados correctamente');
    console.log('✅ Datos de prueba frescos cargados correctamente');
    console.log('');
    console.log('Datos cargados:');
    console.log('  - 2 Clientes de ejemplo');
    console.log('  - 3 Ubicaciones de ejemplo');
    console.log('  - 5 Puestos de vigilancia de ejemplo');
    console.log('  - ~14 Turnos de ejemplo (últimos 7 días)');
    console.log('  - 2 Incentivos de ejemplo');
    console.log('');
    console.log('Próximos pasos:');
    console.log('  - Ver datos cargados: npm run db:examples');
    console.log('  - Probar conexiones: npm run db:test');
    console.log('');

    await closeConnections();
    process.exit(0);
  } catch (error) {
    console.error('\n❌ ERROR CRÍTICO durante el reset de datos:\n');

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
    console.log('  2. Verifica conexión: npm run db:test');
    console.log('  3. Verifica que NODE_ENV=development en .env');
    console.log('  4. Inicializa la BD si no existe: npm run db:init');
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
