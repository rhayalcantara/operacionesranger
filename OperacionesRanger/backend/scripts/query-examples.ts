/**
 * Script de queries de ejemplo
 * OperacionesRanger - Sistema de Gestión de Turnos
 *
 * Este script ejecuta queries comunes del sistema para demostrar
 * su funcionamiento y ayudar a los desarrolladores a entender
 * la estructura de datos.
 *
 * Uso:
 *   npm run db:examples
 *
 * Retorna:
 *   - Código 0: Queries ejecutados exitosamente
 *   - Código 1: Error durante ejecución
 */

import { getTurnosPool, getRRHHPool, closeConnections } from '../src/config/database';

/**
 * Interfaz para resultado de query con tiempo de ejecución
 */
interface QueryResult {
  title: string;
  sql: string;
  rows: any[];
  executionTime: number;
}

/**
 * Ejecutar query y medir tiempo de ejecución
 */
async function executeQuery(
  pool: any,
  title: string,
  sql: string,
  params: any[] = []
): Promise<QueryResult> {
  const startTime = Date.now();

  const [rows] = await pool.query(sql, params);

  const executionTime = Date.now() - startTime;

  return {
    title,
    sql,
    rows: Array.isArray(rows) ? rows : [],
    executionTime,
  };
}

/**
 * Mostrar resultado de query en formato tabla
 */
function displayResult(result: QueryResult): void {
  console.log('─'.repeat(80));
  console.log(`📊 ${result.title}`);
  console.log('─'.repeat(80));
  console.log(`SQL: ${result.sql}`);
  console.log(`Tiempo: ${result.executionTime}ms`);
  console.log(`Resultados: ${result.rows.length} filas\n`);

  if (result.rows.length > 0) {
    console.table(result.rows);
  } else {
    console.log('  (Sin resultados)\n');
  }

  console.log('');
}

/**
 * Función principal
 */
async function main(): Promise<void> {
  console.log('╔════════════════════════════════════════════════════════════════╗');
  console.log('║  Queries de Ejemplo - OperacionesRanger                       ║');
  console.log('╚════════════════════════════════════════════════════════════════╝\n');

  console.log('Este script ejecuta queries comunes del sistema para demostrar');
  console.log('su funcionamiento y estructura de datos.\n');

  try {
    const turnosPool = getTurnosPool();
    const rrhhPool = getRRHHPool();

    console.log('═'.repeat(80));
    console.log('  SECCIÓN 1: BASE DE DATOS RRHH (db_aae4a2_ranger)');
    console.log('═'.repeat(80));
    console.log('');

    // Query 1: Listar guardianes activos
    const query1 = await executeQuery(
      rrhhPool,
      'Listar Guardianes Activos (Primeros 10)',
      `SELECT
        id_empleado,
        cedula_empleado,
        CONCAT(nombres, ' ', apellidos) AS nombre_completo,
        status
      FROM rh_empleado
      WHERE id_puesto = 97 AND status = 1
      ORDER BY apellidos, nombres
      LIMIT 10`
    );
    displayResult(query1);

    // Query 2: Contar guardianes por status
    const query2 = await executeQuery(
      rrhhPool,
      'Resumen de Guardianes por Status',
      `SELECT
        status,
        CASE
          WHEN status = 1 THEN 'Activo'
          WHEN status = 0 THEN 'Inactivo'
          ELSE 'Desconocido'
        END as status_descripcion,
        COUNT(*) as cantidad
      FROM rh_empleado
      WHERE id_puesto = 97
      GROUP BY status
      ORDER BY status DESC`
    );
    displayResult(query2);

    console.log('═'.repeat(80));
    console.log('  SECCIÓN 2: BASE DE DATOS TURNOS (turnos_guardianes)');
    console.log('═'.repeat(80));
    console.log('');

    // Query 3: Configuración de turnos
    const query3 = await executeQuery(
      turnosPool,
      'Configuración de Turnos (Diurno/Nocturno)',
      `SELECT
        id,
        tipo_turno,
        TIME_FORMAT(hora_inicio, '%h:%i %p') as hora_inicio,
        TIME_FORMAT(hora_fin, '%h:%i %p') as hora_fin,
        descripcion,
        activo
      FROM configuracion_turnos
      ORDER BY tipo_turno`
    );
    displayResult(query3);

    // Query 4: Feriados del año actual
    const query4 = await executeQuery(
      turnosPool,
      'Feriados del Año Actual',
      `SELECT
        DATE_FORMAT(fecha, '%Y-%m-%d') as fecha,
        DATE_FORMAT(fecha, '%W, %M %d, %Y') as fecha_legible,
        nombre,
        tipo,
        descripcion
      FROM feriados
      WHERE YEAR(fecha) = YEAR(CURDATE())
      ORDER BY fecha`
    );
    displayResult(query4);

    // Query 5: Clientes registrados
    const query5 = await executeQuery(
      turnosPool,
      'Clientes Registrados',
      `SELECT
        id,
        codigo,
        nombre,
        rnc,
        telefono,
        activo
      FROM clientes
      ORDER BY nombre
      LIMIT 10`
    );
    displayResult(query5);

    // Query 6: Ubicaciones por cliente
    const query6 = await executeQuery(
      turnosPool,
      'Ubicaciones Registradas',
      `SELECT
        u.id,
        u.codigo,
        u.nombre as ubicacion,
        c.nombre as cliente,
        u.provincia,
        u.municipio,
        u.activo
      FROM ubicaciones u
      INNER JOIN clientes c ON u.cliente_id = c.id
      ORDER BY c.nombre, u.nombre
      LIMIT 10`
    );
    displayResult(query6);

    // Query 7: Puestos con información de cliente y ubicación
    const query7 = await executeQuery(
      turnosPool,
      'Puestos de Vigilancia Registrados',
      `SELECT
        p.id,
        p.codigo,
        p.nombre as puesto,
        u.nombre as ubicacion,
        c.nombre as cliente,
        p.cantidad_guardianes,
        p.activo
      FROM puestos p
      INNER JOIN ubicaciones u ON p.ubicacion_id = u.id
      INNER JOIN clientes c ON u.cliente_id = c.id
      ORDER BY c.nombre, u.nombre, p.nombre
      LIMIT 10`
    );
    displayResult(query7);

    // Query 8: Turnos registrados (últimos 30 días)
    const query8 = await executeQuery(
      turnosPool,
      'Turnos Registrados (Últimos 30 Días)',
      `SELECT
        t.id as id_turno,
        DATE_FORMAT(t.fecha, '%Y-%m-%d') as fecha,
        t.empleado_id,
        p.nombre as puesto,
        t.horas_normales,
        t.horas_extras,
        t.tipo_turno,
        CASE WHEN t.es_feriado = 1 THEN 'Sí' ELSE 'No' END as es_feriado
      FROM turnos t
      INNER JOIN puestos p ON t.puesto_id = p.id
      WHERE t.fecha >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)
      ORDER BY t.fecha DESC, t.empleado_id
      LIMIT 20`
    );
    displayResult(query8);

    // Query 9: Resumen de horas por empleado (últimos 15 días)
    const query9 = await executeQuery(
      turnosPool,
      'Resumen de Horas por Empleado (Últimos 15 Días)',
      `SELECT
        empleado_id,
        COUNT(*) as total_turnos,
        SUM(horas_normales) as total_horas_normales,
        SUM(horas_extras) as total_horas_extras,
        SUM(horas_normales + horas_extras) as total_horas
      FROM turnos
      WHERE fecha >= DATE_SUB(CURDATE(), INTERVAL 15 DAY)
      GROUP BY empleado_id
      ORDER BY total_horas DESC
      LIMIT 10`
    );
    displayResult(query9);

    // Query 10: Incentivos por puesto
    const query10 = await executeQuery(
      turnosPool,
      'Incentivos Asignados por Puesto',
      `SELECT
        i.id,
        p.codigo as codigo_puesto,
        p.nombre as puesto,
        i.anio,
        i.quincena,
        FORMAT(i.monto, 2) as monto,
        FORMAT(i.valor_hora, 4) as valor_hora,
        DATE_FORMAT(i.fecha_inicio, '%Y-%m-%d') as fecha_inicio,
        DATE_FORMAT(i.fecha_fin, '%Y-%m-%d') as fecha_fin
      FROM incentivos_puesto i
      INNER JOIN puestos p ON i.puesto_id = p.id
      ORDER BY i.anio DESC, i.quincena DESC, p.codigo
      LIMIT 10`
    );
    displayResult(query10);

    console.log('═'.repeat(80));
    console.log('  SECCIÓN 3: PROCEDIMIENTOS ALMACENADOS');
    console.log('═'.repeat(80));
    console.log('');

    // Query 11: Llamar sp_verificar_feriado con fecha actual
    const query11 = await executeQuery(
      turnosPool,
      'Verificar si Hoy es Feriado (sp_verificar_feriado)',
      `CALL sp_verificar_feriado(CURDATE())`
    );
    displayResult(query11);

    // Query 12: Llamar sp_verificar_feriado con Año Nuevo
    const currentYear = new Date().getFullYear();
    const query12 = await executeQuery(
      turnosPool,
      'Verificar Año Nuevo como Feriado (sp_verificar_feriado)',
      `CALL sp_verificar_feriado('${currentYear}-01-01')`
    );
    displayResult(query12);

    // Query 13: Llamar sp_determinar_tipo_turno con hora diurna
    const query13 = await executeQuery(
      turnosPool,
      'Determinar Tipo de Turno - 08:00 (sp_determinar_tipo_turno)',
      `CALL sp_determinar_tipo_turno('08:00:00')`
    );
    displayResult(query13);

    // Query 14: Llamar sp_determinar_tipo_turno con hora nocturna
    const query14 = await executeQuery(
      turnosPool,
      'Determinar Tipo de Turno - 20:00 (sp_determinar_tipo_turno)',
      `CALL sp_determinar_tipo_turno('20:00:00')`
    );
    displayResult(query14);

    console.log('═'.repeat(80));
    console.log('  SECCIÓN 4: VISTAS DEL SISTEMA');
    console.log('═'.repeat(80));
    console.log('');

    // Query 15: Vista de reporte de nómina (si existe y hay datos)
    try {
      const query15 = await executeQuery(
        turnosPool,
        'Vista de Reporte de Nómina (v_reporte_nomina)',
        `SELECT * FROM v_reporte_nomina LIMIT 10`
      );
      displayResult(query15);
    } catch (error) {
      console.log('📊 Vista de Reporte de Nómina (v_reporte_nomina)');
      console.log('   (Vista no disponible o sin datos)\n');
    }

    // Query 16: Vista de resumen de quincena (si existe y hay datos)
    try {
      const query16 = await executeQuery(
        turnosPool,
        'Vista de Resumen de Quincena (v_resumen_quincena)',
        `SELECT * FROM v_resumen_quincena LIMIT 10`
      );
      displayResult(query16);
    } catch (error) {
      console.log('📊 Vista de Resumen de Quincena (v_resumen_quincena)');
      console.log('   (Vista no disponible o sin datos)\n');
    }

    console.log('╔════════════════════════════════════════════════════════════════╗');
    console.log('║  Resumen de Queries Ejecutados                                 ║');
    console.log('╚════════════════════════════════════════════════════════════════╝\n');
    console.log('✅ Queries ejecutados exitosamente');
    console.log('✅ Todas las queries de ejemplo funcionaron correctamente');
    console.log('');
    console.log('💡 Estos queries están disponibles en:');
    console.log('   backend/scripts/query-examples.ts');
    console.log('');
    console.log('Próximos pasos:');
    console.log('  - Registrar turnos de prueba: npm run db:reset');
    console.log('  - Cargar más feriados: npm run db:seed -- --year=2027');
    console.log('');

    await closeConnections();
    process.exit(0);
  } catch (error) {
    console.error('\n❌ ERROR CRÍTICO durante la ejecución de queries:\n');

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
    console.log('  1. Verifica que las bases de datos existen');
    console.log('  2. Verifica conexión: npm run db:test');
    console.log('  3. Verifica que hay datos en las tablas');
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
