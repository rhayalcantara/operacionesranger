/**
 * Script de carga de datos maestros de prueba
 * OperacionesRanger - Sistema de Gestión de Turnos
 *
 * Este script carga datos de prueba realistas de República Dominicana para:
 * - Clientes (empresas contratantes)
 * - Ubicaciones (sitios físicos)
 * - Puestos (estaciones de guardián)
 * - Incentivos por puesto
 *
 * Uso:
 *   npm run db:seed:maestros           # Cargar datos (preserva existentes)
 *   npm run db:seed:maestros -- --clean  # Eliminar existentes y recargar
 *
 * Flags:
 *   --clean  : Eliminar datos existentes antes de insertar (solicita confirmación)
 *
 * Retorna:
 *   - Código 0: Datos cargados exitosamente
 *   - Código 1: Error durante carga
 */

import { getTurnosPool, closeConnections } from '../src/config/database';
import * as readline from 'readline';
import { RowDataPacket, ResultSetHeader } from 'mysql2';

/**
 * Interfaz para argumentos de línea de comandos
 */
interface Args {
  clean: boolean;
}

/**
 * Interface para datos de cliente
 */
interface ClienteData {
  codigo: string;
  nombre: string;
  rnc: string;
  direccion: string;
  telefono: string;
  email: string;
  contacto_nombre: string;
}

/**
 * Interface para datos de ubicación
 */
interface UbicacionData {
  cliente_codigo: string;  // Referencia a cliente por código
  codigo: string;
  nombre: string;
  direccion: string;
  provincia: string;
  municipio: string;
  latitud: number;
  longitud: number;
}

/**
 * Interface para datos de puesto
 */
interface PuestoData {
  ubicacion_codigo: string;  // Referencia a ubicación por código
  codigo: string;
  nombre: string;
  descripcion: string;
  cantidad_guardianes: number;
  requiere_turno_diurno: boolean;
  requiere_turno_nocturno: boolean;
}

/**
 * Interface para datos de incentivo
 */
interface IncentivoData {
  puesto_codigo: string;  // Referencia a puesto por código
  anio: number;
  quincena: number;
  fecha_inicio: string;
  fecha_fin: string;
  monto: number;
  observaciones: string;
}

/**
 * Parsear argumentos de línea de comandos
 */
function parseArgs(): Args {
  const args = process.argv.slice(2);

  return {
    clean: args.includes('--clean'),
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
 * Generar datos de clientes
 */
function generarClientes(): ClienteData[] {
  return [
    {
      codigo: 'BPD001',
      nombre: 'Banco Popular Dominicano',
      rnc: '101234567',
      direccion: 'Av. John F. Kennedy No. 20, Piantini',
      telefono: '809-544-5000',
      email: 'seguridad@bpd.com.do',
      contacto_nombre: 'María Rodríguez García',
    },
    {
      codigo: 'NACIO001',
      nombre: 'Supermercados Nacional',
      rnc: '102345678',
      direccion: 'Av. 27 de Febrero No. 1762, Ensanche Naco',
      telefono: '809-566-7777',
      email: 'seguridad.corporativa@nacional.com.do',
      contacto_nombre: 'Carlos Martínez Pérez',
    },
    {
      codigo: 'AGORA001',
      nombre: 'Centro Comercial Ágora Mall',
      rnc: '103456789',
      direccion: 'Av. Abraham Lincoln No. 1000, Piantini',
      telefono: '809-955-8000',
      email: 'seguridad@agoramall.com.do',
      contacto_nombre: 'Ana Pérez Santos',
    },
  ];
}

/**
 * Generar datos de ubicaciones (2 por cliente)
 */
function generarUbicaciones(): UbicacionData[] {
  return [
    // Banco Popular Dominicano - 2 ubicaciones
    {
      cliente_codigo: 'BPD001',
      codigo: 'SUC-CENTRO',
      nombre: 'Sucursal Centro (Calle El Conde)',
      direccion: 'Calle El Conde No. 253, Zona Colonial',
      provincia: 'Distrito Nacional',
      municipio: 'Santo Domingo de Guzmán',
      latitud: 18.473611,
      longitud: -69.885556,
    },
    {
      cliente_codigo: 'BPD001',
      codigo: 'SUC-NACO',
      nombre: 'Sucursal Naco (Av. Tiradentes)',
      direccion: 'Av. Tiradentes No. 45, Ensanche Naco',
      provincia: 'Distrito Nacional',
      municipio: 'Santo Domingo de Guzmán',
      latitud: 18.475000,
      longitud: -69.930000,
    },

    // Supermercados Nacional - 2 ubicaciones
    {
      cliente_codigo: 'NACIO001',
      codigo: 'LOPEVEGA',
      nombre: 'Nacional Lope de Vega',
      direccion: 'Av. Lope de Vega esq. Gustavo Mejía Ricart, Naco',
      provincia: 'Distrito Nacional',
      municipio: 'Santo Domingo de Guzmán',
      latitud: 18.478056,
      longitud: -69.931944,
    },
    {
      cliente_codigo: 'NACIO001',
      codigo: 'CHURCHILL',
      nombre: 'Nacional Churchill',
      direccion: 'Av. Winston Churchill No. 88, Piantini',
      provincia: 'Distrito Nacional',
      municipio: 'Santo Domingo de Guzmán',
      latitud: 18.482500,
      longitud: -69.936111,
    },

    // Ágora Mall - 2 ubicaciones
    {
      cliente_codigo: 'AGORA001',
      codigo: 'AREACOMERCIAL',
      nombre: 'Ágora Mall - Área Comercial',
      direccion: 'Av. Abraham Lincoln No. 1000 (Interior), Piantini',
      provincia: 'Distrito Nacional',
      municipio: 'Santo Domingo de Guzmán',
      latitud: 18.476389,
      longitud: -69.932778,
    },
    {
      cliente_codigo: 'AGORA001',
      codigo: 'ESTACIONAMIENTO',
      nombre: 'Ágora Mall - Estacionamientos',
      direccion: 'Av. Abraham Lincoln No. 1000 (Sótanos), Piantini',
      provincia: 'Distrito Nacional',
      municipio: 'Santo Domingo de Guzmán',
      latitud: 18.476200,
      longitud: -69.933000,
    },
  ];
}

/**
 * Generar datos de puestos (2 por ubicación)
 */
function generarPuestos(): PuestoData[] {
  return [
    // BPD Centro - 2 puestos
    {
      ubicacion_codigo: 'SUC-CENTRO',
      codigo: 'ENTRADA-PRIN',
      nombre: 'Entrada Principal',
      descripcion: 'Control de acceso principal - Zona Colonial (alta peligrosidad)',
      cantidad_guardianes: 2,
      requiere_turno_diurno: true,
      requiere_turno_nocturno: true,
    },
    {
      ubicacion_codigo: 'SUC-CENTRO',
      codigo: 'CAJA-FUERTE',
      nombre: 'Caja Fuerte',
      descripcion: 'Área de bóveda y manejo de efectivo - Máxima seguridad',
      cantidad_guardianes: 1,
      requiere_turno_diurno: true,
      requiere_turno_nocturno: true,
    },

    // BPD Naco - 2 puestos
    {
      ubicacion_codigo: 'SUC-NACO',
      codigo: 'ENTRADA-NACO',
      nombre: 'Entrada Principal Naco',
      descripcion: 'Control de acceso - Zona comercial',
      cantidad_guardianes: 2,
      requiere_turno_diurno: true,
      requiere_turno_nocturno: true,
    },
    {
      ubicacion_codigo: 'SUC-NACO',
      codigo: 'ATM-EXTERNO',
      nombre: 'Cajeros Automáticos Externos',
      descripcion: 'Vigilancia de ATM externos - Prevención de fraudes',
      cantidad_guardianes: 1,
      requiere_turno_diurno: true,
      requiere_turno_nocturno: true,
    },

    // Nacional Lope de Vega - 2 puestos
    {
      ubicacion_codigo: 'LOPEVEGA',
      codigo: 'ESTAC-LOPEV',
      nombre: 'Estacionamiento',
      descripcion: 'Seguridad vehicular y control de acceso',
      cantidad_guardianes: 1,
      requiere_turno_diurno: true,
      requiere_turno_nocturno: true,  // Hasta 22:00
    },
    {
      ubicacion_codigo: 'LOPEVEGA',
      codigo: 'PISO-VENTAS',
      nombre: 'Piso de Ventas',
      descripcion: 'Vigilancia interna y prevención de hurtos',
      cantidad_guardianes: 2,
      requiere_turno_diurno: true,
      requiere_turno_nocturno: true,  // Hasta 22:00
    },

    // Nacional Churchill - 2 puestos
    {
      ubicacion_codigo: 'CHURCHILL',
      codigo: 'ENTRADA-CHURCH',
      nombre: 'Entrada Churchill',
      descripcion: 'Control de acceso principal - Alto flujo',
      cantidad_guardianes: 2,
      requiere_turno_diurno: true,
      requiere_turno_nocturno: true,  // Hasta 22:00
    },
    {
      ubicacion_codigo: 'CHURCHILL',
      codigo: 'CARGA-DESCARGA',
      nombre: 'Área de Carga',
      descripcion: 'Seguridad en recepción de mercancía',
      cantidad_guardianes: 1,
      requiere_turno_diurno: true,
      requiere_turno_nocturno: false,  // Solo diurno 06:00-18:00
    },

    // Ágora Mall Área Comercial - 2 puestos
    {
      ubicacion_codigo: 'AREACOMERCIAL',
      codigo: 'MALL-ENTRADA-A',
      nombre: 'Entrada A (Principal)',
      descripcion: 'Control de acceso principal del mall - Alto flujo de personas',
      cantidad_guardianes: 2,
      requiere_turno_diurno: true,
      requiere_turno_nocturno: true,  // Hasta 00:00
    },
    {
      ubicacion_codigo: 'AREACOMERCIAL',
      codigo: 'MALL-CENTRO',
      nombre: 'Centro Comercial',
      descripcion: 'Patrullaje y vigilancia general del área comercial',
      cantidad_guardianes: 2,
      requiere_turno_diurno: true,
      requiere_turno_nocturno: true,  // Hasta 00:00
    },

    // Ágora Mall Estacionamientos - 2 puestos
    {
      ubicacion_codigo: 'ESTACIONAMIENTO',
      codigo: 'ESTAC-NIVEL1',
      nombre: 'Estacionamiento Nivel 1',
      descripcion: 'Seguridad vehicular nivel superficie',
      cantidad_guardianes: 1,
      requiere_turno_diurno: true,
      requiere_turno_nocturno: true,  // Hasta 00:00
    },
    {
      ubicacion_codigo: 'ESTACIONAMIENTO',
      codigo: 'ESTAC-SOTANO',
      nombre: 'Estacionamiento Sótano',
      descripcion: 'Seguridad vehicular niveles subterráneos',
      cantidad_guardianes: 1,
      requiere_turno_diurno: true,
      requiere_turno_nocturno: true,  // Hasta 00:00
    },
  ];
}

/**
 * Generar datos de incentivos (5 incentivos diferentes)
 */
function generarIncentivos(): IncentivoData[] {
  return [
    {
      puesto_codigo: 'ENTRADA-PRIN',
      anio: 2026,
      quincena: 1,
      fecha_inicio: '2026-01-01',
      fecha_fin: '2026-01-15',
      monto: 3600.00,
      observaciones: 'Incentivo zona alta peligrosidad - Zona Colonial',
    },
    {
      puesto_codigo: 'CAJA-FUERTE',
      anio: 2026,
      quincena: 1,
      fecha_inicio: '2026-01-01',
      fecha_fin: '2026-01-15',
      monto: 5400.00,
      observaciones: 'Incentivo área crítica - Manejo de efectivo',
    },
    {
      puesto_codigo: 'MALL-ENTRADA-A',
      anio: 2026,
      quincena: 1,
      fecha_inicio: '2026-01-01',
      fecha_fin: '2026-01-15',
      monto: 2700.00,
      observaciones: 'Incentivo alto flujo de personas',
    },
    {
      puesto_codigo: 'ESTAC-LOPEV',
      anio: 2026,
      quincena: 2,
      fecha_inicio: '2026-01-16',
      fecha_fin: '2026-01-31',
      monto: 1800.00,
      observaciones: 'Incentivo seguridad vehicular',
    },
    {
      puesto_codigo: 'ENTRADA-NACO',
      anio: 2026,
      quincena: 2,
      fecha_inicio: '2026-01-16',
      fecha_fin: '2026-01-31',
      monto: 3240.00,
      observaciones: 'Incentivo zona comercial - Alto tráfico',
    },
  ];
}

/**
 * Insertar clientes y retornar mapa de IDs
 */
async function insertClientes(
  pool: any,
  clientes: ClienteData[]
): Promise<Map<string, number>> {
  const clienteIds = new Map<string, number>();

  console.log('[SEED] Insertando clientes...\n');

  for (const cliente of clientes) {
    try {
      // Intentar insertar (INSERT IGNORE evita error en duplicado)
      const [result] = (await pool.query(
        `INSERT IGNORE INTO ot_clientes
         (codigo, nombre, rnc, direccion, telefono, email, contacto_nombre, activo)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          cliente.codigo,
          cliente.nombre,
          cliente.rnc,
          cliente.direccion,
          cliente.telefono,
          cliente.email,
          cliente.contacto_nombre,
          true,
        ]
      )) as [ResultSetHeader, any];

      if (result.affectedRows > 0) {
        // Insertado exitosamente, obtener ID
        const id = result.insertId;
        clienteIds.set(cliente.codigo, id);
        console.log(
          `[SEED] ✓ Cliente: ${cliente.codigo.padEnd(10)} - ${cliente.nombre}`
        );
      } else {
        // Ya existe, obtener ID
        const [rows] = (await pool.query(
          'SELECT id FROM ot_clientes WHERE codigo = ?',
          [cliente.codigo]
        )) as [RowDataPacket[], any];

        if (rows.length > 0) {
          clienteIds.set(cliente.codigo, rows[0].id);
          console.log(
            `[SEED] ⊗ Cliente: ${cliente.codigo.padEnd(10)} - ${cliente.nombre} (ya existe)`
          );
        }
      }
    } catch (error) {
      if (error instanceof Error) {
        console.error(
          `[SEED] ✗ Error insertando cliente ${cliente.codigo}: ${error.message}`
        );
      }
    }
  }

  console.log('');
  return clienteIds;
}

/**
 * Insertar ubicaciones y retornar mapa de IDs
 */
async function insertUbicaciones(
  pool: any,
  ubicaciones: UbicacionData[],
  clienteIds: Map<string, number>
): Promise<Map<string, number>> {
  const ubicacionIds = new Map<string, number>();

  console.log('[SEED] Insertando ubicaciones...\n');

  for (const ubicacion of ubicaciones) {
    const cliente_id = clienteIds.get(ubicacion.cliente_codigo);

    if (!cliente_id) {
      console.error(
        `[SEED] ✗ Cliente ${ubicacion.cliente_codigo} no encontrado para ubicación ${ubicacion.codigo}`
      );
      continue;
    }

    try {
      const [result] = (await pool.query(
        `INSERT IGNORE INTO ot_ubicaciones
         (cliente_id, codigo, nombre, direccion, provincia, municipio, latitud, longitud, activo)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          cliente_id,
          ubicacion.codigo,
          ubicacion.nombre,
          ubicacion.direccion,
          ubicacion.provincia,
          ubicacion.municipio,
          ubicacion.latitud,
          ubicacion.longitud,
          true,
        ]
      )) as [ResultSetHeader, any];

      if (result.affectedRows > 0) {
        ubicacionIds.set(ubicacion.codigo, result.insertId);
        console.log(
          `[SEED] ✓ Ubicación: ${ubicacion.codigo.padEnd(15)} - ${ubicacion.nombre}`
        );
      } else {
        // Ya existe, obtener ID
        const [rows] = (await pool.query(
          'SELECT id FROM ot_ubicaciones WHERE cliente_id = ? AND codigo = ?',
          [cliente_id, ubicacion.codigo]
        )) as [RowDataPacket[], any];

        if (rows.length > 0) {
          ubicacionIds.set(ubicacion.codigo, rows[0].id);
          console.log(
            `[SEED] ⊗ Ubicación: ${ubicacion.codigo.padEnd(15)} - ${ubicacion.nombre} (ya existe)`
          );
        }
      }
    } catch (error) {
      if (error instanceof Error) {
        console.error(
          `[SEED] ✗ Error insertando ubicación ${ubicacion.codigo}: ${error.message}`
        );
      }
    }
  }

  console.log('');
  return ubicacionIds;
}

/**
 * Insertar puestos y retornar mapa de IDs
 */
async function insertPuestos(
  pool: any,
  puestos: PuestoData[],
  ubicacionIds: Map<string, number>
): Promise<Map<string, number>> {
  const puestoIds = new Map<string, number>();

  console.log('[SEED] Insertando puestos...\n');

  for (const puesto of puestos) {
    const ubicacion_id = ubicacionIds.get(puesto.ubicacion_codigo);

    if (!ubicacion_id) {
      console.error(
        `[SEED] ✗ Ubicación ${puesto.ubicacion_codigo} no encontrada para puesto ${puesto.codigo}`
      );
      continue;
    }

    try {
      const [result] = (await pool.query(
        `INSERT IGNORE INTO ot_puestos
         (ubicacion_id, codigo, nombre, descripcion, cantidad_guardianes,
          requiere_turno_diurno, requiere_turno_nocturno, activo)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          ubicacion_id,
          puesto.codigo,
          puesto.nombre,
          puesto.descripcion,
          puesto.cantidad_guardianes,
          puesto.requiere_turno_diurno,
          puesto.requiere_turno_nocturno,
          true,
        ]
      )) as [ResultSetHeader, any];

      if (result.affectedRows > 0) {
        puestoIds.set(puesto.codigo, result.insertId);
        console.log(
          `[SEED] ✓ Puesto: ${puesto.codigo.padEnd(15)} - ${puesto.nombre}`
        );
      } else {
        // Ya existe, obtener ID
        const [rows] = (await pool.query(
          'SELECT id FROM ot_puestos WHERE ubicacion_id = ? AND codigo = ?',
          [ubicacion_id, puesto.codigo]
        )) as [RowDataPacket[], any];

        if (rows.length > 0) {
          puestoIds.set(puesto.codigo, rows[0].id);
          console.log(
            `[SEED] ⊗ Puesto: ${puesto.codigo.padEnd(15)} - ${puesto.nombre} (ya existe)`
          );
        }
      }
    } catch (error) {
      if (error instanceof Error) {
        console.error(
          `[SEED] ✗ Error insertando puesto ${puesto.codigo}: ${error.message}`
        );
      }
    }
  }

  console.log('');
  return puestoIds;
}

/**
 * Insertar incentivos
 */
async function insertIncentivos(
  pool: any,
  incentivos: IncentivoData[],
  puestoIds: Map<string, number>
): Promise<number> {
  let insertados = 0;

  console.log('[SEED] Insertando incentivos...\n');

  for (const incentivo of incentivos) {
    const puesto_id = puestoIds.get(incentivo.puesto_codigo);

    if (!puesto_id) {
      console.error(
        `[SEED] ✗ Puesto ${incentivo.puesto_codigo} no encontrado para incentivo`
      );
      continue;
    }

    try {
      // Verificar si ya existe incentivo para mismo puesto/año/quincena
      const [existing] = (await pool.query(
        `SELECT id FROM ot_incentivos_puesto
         WHERE puesto_id = ? AND anio = ? AND quincena = ?`,
        [puesto_id, incentivo.anio, incentivo.quincena]
      )) as [RowDataPacket[], any];

      if (existing.length > 0) {
        console.log(
          `[SEED] ⊗ Incentivo: ${incentivo.puesto_codigo.padEnd(15)} - ${incentivo.anio}-Q${incentivo.quincena} (ya existe)`
        );
        continue;
      }

      // Insertar incentivo (valor_hora se calcula automáticamente en BD)
      const [result] = (await pool.query(
        `INSERT INTO ot_incentivos_puesto
         (puesto_id, anio, quincena, fecha_inicio, fecha_fin, monto, observaciones)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          puesto_id,
          incentivo.anio,
          incentivo.quincena,
          incentivo.fecha_inicio,
          incentivo.fecha_fin,
          incentivo.monto,
          incentivo.observaciones,
        ]
      )) as [ResultSetHeader, any];

      if (result.affectedRows > 0) {
        insertados++;
        const valorHora = (incentivo.monto / 360).toFixed(2);
        console.log(
          `[SEED] ✓ Incentivo: ${incentivo.puesto_codigo.padEnd(15)} - ${incentivo.anio}-Q${incentivo.quincena} - $${incentivo.monto.toFixed(2)} (valor_hora: $${valorHora})`
        );
      }
    } catch (error) {
      if (error instanceof Error) {
        console.error(
          `[SEED] ✗ Error insertando incentivo para ${incentivo.puesto_codigo}: ${error.message}`
        );
      }
    }
  }

  console.log('');
  return insertados;
}

/**
 * Limpiar datos existentes (en orden inverso por FK)
 */
async function cleanDatabase(pool: any): Promise<void> {
  console.log('[SEED] Eliminando datos existentes...\n');

  try {
    // Orden inverso: incentivos → puestos → ubicaciones → clientes

    // 1. Eliminar incentivos de puestos relacionados
    console.log('[SEED] Eliminando incentivos...');
    const [incResult] = (await pool.query(`
      DELETE i FROM ot_incentivos_puesto i
      JOIN ot_puestos p ON i.puesto_id = p.id
      JOIN ot_ubicaciones u ON p.ubicacion_id = u.id
      JOIN ot_clientes c ON u.cliente_id = c.id
      WHERE c.codigo IN ('BPD001', 'NACIO001', 'AGORA001')
    `)) as [ResultSetHeader, any];
    console.log(`[SEED] ✓ Incentivos eliminados: ${incResult.affectedRows}\n`);

    // 2. Eliminar puestos de ubicaciones relacionadas
    console.log('[SEED] Eliminando puestos...');
    const [puestoResult] = (await pool.query(`
      DELETE p FROM ot_puestos p
      JOIN ot_ubicaciones u ON p.ubicacion_id = u.id
      JOIN ot_clientes c ON u.cliente_id = c.id
      WHERE c.codigo IN ('BPD001', 'NACIO001', 'AGORA001')
    `)) as [ResultSetHeader, any];
    console.log(`[SEED] ✓ Puestos eliminados: ${puestoResult.affectedRows}\n`);

    // 3. Eliminar ubicaciones de clientes
    console.log('[SEED] Eliminando ubicaciones...');
    const [ubicResult] = (await pool.query(`
      DELETE u FROM ot_ubicaciones u
      JOIN ot_clientes c ON u.cliente_id = c.id
      WHERE c.codigo IN ('BPD001', 'NACIO001', 'AGORA001')
    `)) as [ResultSetHeader, any];
    console.log(`[SEED] ✓ Ubicaciones eliminadas: ${ubicResult.affectedRows}\n`);

    // 4. Eliminar clientes
    console.log('[SEED] Eliminando clientes...');
    const [clienteResult] = (await pool.query(
      `DELETE FROM ot_clientes WHERE codigo IN ('BPD001', 'NACIO001', 'AGORA001')`
    )) as [ResultSetHeader, any];
    console.log(`[SEED] ✓ Clientes eliminados: ${clienteResult.affectedRows}\n`);
  } catch (error) {
    if (error instanceof Error) {
      console.error(`[SEED] ✗ Error durante limpieza: ${error.message}`);
      throw error;
    }
  }
}

/**
 * Función principal
 */
async function main(): Promise<void> {
  console.log('╔════════════════════════════════════════════════════════════════╗');
  console.log('║  Carga de Datos Maestros de Prueba - OperacionesRanger        ║');
  console.log('╚════════════════════════════════════════════════════════════════╝\n');

  const args = parseArgs();

  // VALIDACIÓN DE SEGURIDAD: Solo ejecutar en development o test
  const nodeEnv = process.env.NODE_ENV || 'development';

  if (nodeEnv === 'production') {
    console.error('❌ ERROR: Este script NO puede ejecutarse en producción\n');
    console.error('   NODE_ENV actual: production');
    console.error('   Este script es solo para ambientes de desarrollo y testing\n');
    console.error('💡 Si necesitas crear datos en producción, usa los endpoints');
    console.error('   POST de cada entidad con credenciales de administrador\n');
    process.exit(1);
  }

  console.log(`🔧 Ambiente: ${nodeEnv}`);
  console.log(`🔧 Modo: ${args.clean ? 'Limpiar y recargar' : 'Insertar nuevos'}\n`);

  // Generar datos
  const clientes = generarClientes();
  const ubicaciones = generarUbicaciones();
  const puestos = generarPuestos();
  const incentivos = generarIncentivos();

  console.log(`📋 Datos a cargar:`);
  console.log(`   - Clientes: ${clientes.length}`);
  console.log(`   - Ubicaciones: ${ubicaciones.length}`);
  console.log(`   - Puestos: ${puestos.length}`);
  console.log(`   - Incentivos: ${incentivos.length}`);
  console.log('');

  try {
    const pool = getTurnosPool();

    // Si modo clean, eliminar datos existentes
    if (args.clean) {
      console.log('⚠️  ADVERTENCIA: Eliminar datos maestros existentes\n');

      const confirmed = await askConfirmation(
        '¿Estás seguro de eliminar todos los datos de prueba? (s/n): '
      );

      if (!confirmed) {
        console.log('\n[SEED] Operación cancelada por el usuario');
        await closeConnections();
        process.exit(0);
      }

      await cleanDatabase(pool);
    }

    // Insertar datos en orden: clientes → ubicaciones → puestos → incentivos
    const clienteIds = await insertClientes(pool, clientes);
    const ubicacionIds = await insertUbicaciones(pool, ubicaciones, clienteIds);
    const puestoIds = await insertPuestos(pool, puestos, ubicacionIds);
    const incentivosInsertados = await insertIncentivos(pool, incentivos, puestoIds);

    // Resumen
    console.log('╔════════════════════════════════════════════════════════════════╗');
    console.log('║  Resumen de Carga de Datos Maestros                            ║');
    console.log('╚════════════════════════════════════════════════════════════════╝\n');
    console.log(`✅ Clientes: ${clienteIds.size}/${clientes.length}`);
    console.log(`✅ Ubicaciones: ${ubicacionIds.size}/${ubicaciones.length}`);
    console.log(`✅ Puestos: ${puestoIds.size}/${puestos.length}`);
    console.log(`✅ Incentivos: ${incentivosInsertados}/${incentivos.length}`);
    console.log('');

    if (clienteIds.size > 0) {
      console.log('✅ ÉXITO: Datos maestros cargados correctamente\n');
      console.log('📊 Datos creados:\n');
      console.log('  Clientes:');
      console.log('    - Banco Popular Dominicano (BPD001)');
      console.log('    - Supermercados Nacional (NACIO001)');
      console.log('    - Centro Comercial Ágora Mall (AGORA001)');
      console.log('');
      console.log('  Ubicaciones por cliente: 2');
      console.log('  Puestos por ubicación: 2');
      console.log('  Incentivos totales: ' + incentivosInsertados);
      console.log('');
    }

    console.log('Próximos pasos:');
    console.log('  - Verificar datos: SELECT * FROM ot_clientes WHERE codigo IN (\'BPD001\', \'NACIO001\', \'AGORA001\');');
    console.log('  - Probar endpoints: GET /api/clientes, /api/ubicaciones, /api/puestos, /api/incentivos');
    console.log('  - Ver incentivos con valor_hora: SELECT i.*, p.nombre, i.valor_hora FROM ot_incentivos_puesto i JOIN ot_puestos p ON i.puesto_id = p.id;');
    console.log('');

    await closeConnections();
    process.exit(0);
  } catch (error) {
    console.error('\n❌ ERROR CRÍTICO durante la carga de datos maestros:\n');

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
    console.log('  2. Verifica que todas las tablas existen (ot_clientes, ot_ubicaciones, ot_puestos, ot_incentivos_puesto)');
    console.log('  3. Verifica conexión a la BD: npm run db:test');
    console.log('  4. Verifica credenciales en el archivo .env');
    console.log('  5. Verifica que las migraciones de las tablas se ejecutaron (Fase 1)');
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
