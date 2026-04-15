/**
 * Servicio de Reporte de Horas Trabajadas
 * Sistema de Gestion de Turnos - OperacionesRanger
 *
 * Genera reportes pivot de horas trabajadas a partir de la tabla diario_puesto.
 * Soporta agrupacion por empleado o por puesto, con desglose diario de horas
 * y totales calculados.
 *
 * @module services/reporte-horas.service
 */

import { RowDataPacket } from 'mysql2/promise';
import { getTurnosPool } from '../config/database';
import {
  ReporteHorasFilters,
  ReporteHorasRow,
  ReporteHorasResult,
} from '../models/reporte-horas.model';

// ============================================================================
// INTERFACES INTERNAS PARA QUERIES
// ============================================================================

interface EmpleadoHorasRow extends RowDataPacket {
  empleado_id: number;
  fecha: string | Date;
  horas: number;
  empleado_nombre: string;
  cedula_empleado: string;
}

interface PuestoHorasRow extends RowDataPacket {
  puesto_id: number;
  fecha: string | Date;
  horas: number;
  puesto_nombre: string;
  puesto_codigo: string;
}

// ============================================================================
// HELPERS
// ============================================================================

/**
 * Genera un array ordenado de todas las fechas en un rango (inclusive)
 *
 * @param fechaInicio - Fecha de inicio (YYYY-MM-DD)
 * @param fechaFin - Fecha de fin (YYYY-MM-DD)
 * @returns Array de strings YYYY-MM-DD
 */
function generarRangoFechas(fechaInicio: string, fechaFin: string): string[] {
  const fechas: string[] = [];
  const current = new Date(fechaInicio + 'T00:00:00');
  const end = new Date(fechaFin + 'T00:00:00');

  while (current <= end) {
    const yyyy = current.getFullYear();
    const mm = String(current.getMonth() + 1).padStart(2, '0');
    const dd = String(current.getDate()).padStart(2, '0');
    fechas.push(`${yyyy}-${mm}-${dd}`);
    current.setDate(current.getDate() + 1);
  }

  return fechas;
}

/**
 * Convierte un valor fecha (string o Date) a formato YYYY-MM-DD
 */
function formatearFecha(fecha: string | Date): string {
  if (fecha instanceof Date) {
    // Usar UTC para evitar desfase de timezone con fechas DATE de MySQL
    const yyyy = fecha.getUTCFullYear();
    const mm = String(fecha.getUTCMonth() + 1).padStart(2, '0');
    const dd = String(fecha.getUTCDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  }
  // Si ya es string, tomar solo la parte de fecha
  return String(fecha).substring(0, 10);
}

// ============================================================================
// SERVICIO PRINCIPAL
// ============================================================================

/**
 * Genera reporte pivot de horas trabajadas
 *
 * Consulta diario_puesto agrupando por empleado o por puesto,
 * luego pivotea los resultados en TypeScript para generar una
 * estructura de tabla con fechas como columnas.
 *
 * @param filters - Filtros del reporte (fechas, tipo, filtros opcionales)
 * @returns Resultado del reporte con filas pivoteadas
 *
 * @throws Error si hay un problema con la base de datos
 *
 * @example
 * const result = await getReporteHoras({
 *   fecha_inicio: '2026-04-01',
 *   fecha_fin: '2026-04-15',
 *   tipo: 'empleado',
 * });
 */
export async function getReporteHoras(
  filters: ReporteHorasFilters
): Promise<ReporteHorasResult> {
  const { fecha_inicio, fecha_fin, tipo, empleado_id, puesto_id } = filters;

  // 1. Generar rango de fechas
  const fechas = generarRangoFechas(fecha_inicio, fecha_fin);

  // 2. Ejecutar query segun tipo de agrupacion
  let filas: ReporteHorasRow[];

  if (tipo === 'empleado') {
    filas = await queryPorEmpleado(fecha_inicio, fecha_fin, empleado_id);
  } else {
    filas = await queryPorPuesto(fecha_inicio, fecha_fin, puesto_id);
  }

  // 3. Retornar resultado
  return {
    tipo,
    fecha_inicio,
    fecha_fin,
    fechas,
    filas,
    total_registros: filas.length,
  };
}

// ============================================================================
// QUERIES ESPECIALIZADAS
// ============================================================================

/**
 * Query y pivot de horas agrupadas por empleado
 */
async function queryPorEmpleado(
  fechaInicio: string,
  fechaFin: string,
  empleadoId?: number
): Promise<ReporteHorasRow[]> {
  let query = `
    SELECT dp.empleado_id, dp.fecha, SUM(dp.horas) as horas,
           CONCAT(e.nombres, ' ', e.apellidos) as empleado_nombre,
           e.cedula_empleado
    FROM ot_diario_puesto dp
    LEFT JOIN rh_empleado e ON dp.empleado_id = e.id_empleado
    WHERE dp.fecha BETWEEN ? AND ? AND dp.activo = 1
  `;
  const params: any[] = [fechaInicio, fechaFin];

  if (empleadoId) {
    query += ` AND dp.empleado_id = ?`;
    params.push(empleadoId);
  }

  query += ` GROUP BY dp.empleado_id, dp.fecha ORDER BY empleado_nombre, dp.fecha`;

  const [rows] = await getTurnosPool().query<EmpleadoHorasRow[]>(query, params);

  // Pivot: agrupar por empleado_id
  return pivotRows(
    rows,
    (row) => row.empleado_id,
    (row) => row.empleado_nombre || `Empleado ${row.empleado_id}`,
    (row) => row.cedula_empleado || undefined
  );
}

/**
 * Query y pivot de horas agrupadas por puesto
 */
async function queryPorPuesto(
  fechaInicio: string,
  fechaFin: string,
  puestoId?: number
): Promise<ReporteHorasRow[]> {
  let query = `
    SELECT dp.puesto_id, dp.fecha, SUM(dp.horas) as horas,
           p.nombre as puesto_nombre, p.codigo as puesto_codigo
    FROM ot_diario_puesto dp
    INNER JOIN ot_puestos p ON dp.puesto_id = p.id
    WHERE dp.fecha BETWEEN ? AND ? AND dp.activo = 1
  `;
  const params: any[] = [fechaInicio, fechaFin];

  if (puestoId) {
    query += ` AND dp.puesto_id = ?`;
    params.push(puestoId);
  }

  query += ` GROUP BY dp.puesto_id, dp.fecha ORDER BY puesto_nombre, dp.fecha`;

  const [rows] = await getTurnosPool().query<PuestoHorasRow[]>(query, params);

  // Pivot: agrupar por puesto_id
  return pivotRows(
    rows,
    (row) => row.puesto_id,
    (row) => row.puesto_nombre || `Puesto ${row.puesto_id}`,
    (row) => row.puesto_codigo || undefined
  );
}

// ============================================================================
// FUNCION DE PIVOT GENERICA
// ============================================================================

/**
 * Pivotea filas planas (id, fecha, horas) en estructura de reporte
 *
 * @param rows - Filas de la query SQL
 * @param getId - Funcion para extraer el ID de agrupacion
 * @param getNombre - Funcion para extraer el nombre
 * @param getCodigo - Funcion para extraer el codigo (opcional)
 * @returns Array de ReporteHorasRow pivoteadas
 */
function pivotRows<T extends RowDataPacket & { fecha: string | Date; horas: number }>(
  rows: T[],
  getId: (row: T) => number,
  getNombre: (row: T) => string,
  getCodigo: (row: T) => string | undefined
): ReporteHorasRow[] {
  const gruposMap = new Map<
    number,
    { nombre: string; codigo?: string; dias: Map<string, number> }
  >();

  for (const row of rows) {
    const id = getId(row);
    const fechaStr = formatearFecha(row.fecha);
    const horas = Number(row.horas) || 0;

    if (!gruposMap.has(id)) {
      gruposMap.set(id, {
        nombre: getNombre(row),
        codigo: getCodigo(row),
        dias: new Map<string, number>(),
      });
    }

    const grupo = gruposMap.get(id)!;
    const horasExistentes = grupo.dias.get(fechaStr) || 0;
    grupo.dias.set(fechaStr, horasExistentes + horas);
  }

  // Convertir Map a array de ReporteHorasRow
  const filas: ReporteHorasRow[] = [];

  for (const [id, grupo] of gruposMap) {
    const diasObj: { [fecha: string]: number } = {};
    let totalHoras = 0;

    for (const [fecha, horas] of grupo.dias) {
      diasObj[fecha] = horas;
      totalHoras += horas;
    }

    filas.push({
      id,
      nombre: grupo.nombre,
      codigo: grupo.codigo,
      total_horas: Math.round(totalHoras * 100) / 100,
      total_dias: grupo.dias.size,
      dias: diasObj,
    });
  }

  return filas;
}
