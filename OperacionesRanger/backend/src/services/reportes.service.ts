/**
 * Servicio de Reportes
 * Sistema de Gestión de Turnos - OperacionesRanger
 *
 * Implementa la lógica de negocio para generar reportes CSV
 * para integración con el sistema de nómina.
 *
 * @module services/reportes.service
 */

import { RowDataPacket, ResultSetHeader } from 'mysql2/promise';
import { getTurnosPool } from '../config/database';
import {
  ResumenQuincenaDTO,
  ResumenGuardianDTO,
  ResumenPuestoDTO,
  PaginatedResumenResponse,
  ResumenGuardianFiltros,
  ResumenPuestoFiltros,
  PaginacionOpciones,
  CreateHistorialReporteDTO,
  HistorialReporteDTO,
  PaginatedHistorialDTO,
  HISTORIAL_PAGINATION,
} from '../models/reporte.model';

// ============================================================================
// INTERFACES
// ============================================================================

/**
 * Estructura de un registro del reporte de nómina
 * (resultado del SP sp_generar_reporte_nomina)
 */
interface ReporteNominaRow {
  fecha: string | Date;
  empleado_id: number;
  puesto_codigo: string;
  horas_normales: number;
  horas_extras: number;
  tipo_turno: 'DIURNO' | 'NOCTURNO';
  es_feriado: 'SI' | 'NO';
  tipo_feriado: string | null;
  incentivo: number;
}

// ============================================================================
// CUSTOM ERRORS
// ============================================================================

/**
 * Error cuando el rango de fechas es inválido
 */
export class RangoFechasInvalidoError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'RangoFechasInvalidoError';
  }
}

// ============================================================================
// FUNCIONES AUXILIARES
// ============================================================================

/**
 * Calcular diferencia de días entre dos fechas
 *
 * @param fecha_inicio - Fecha de inicio (YYYY-MM-DD)
 * @param fecha_fin - Fecha de fin (YYYY-MM-DD)
 * @returns Número de días de diferencia
 */
function calcularDiferenciaDias(fecha_inicio: string, fecha_fin: string): number {
  const inicio = new Date(fecha_inicio);
  const fin = new Date(fecha_fin);

  const diffMs = fin.getTime() - inicio.getTime();
  const diffDias = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

  return diffDias;
}

/**
 * Formatear fecha de YYYY-MM-DD a YYYYMMDD (para nombre de archivo)
 *
 * @param fecha - Fecha en formato YYYY-MM-DD
 * @returns Fecha en formato YYYYMMDD
 */
export function formatearFechaParaArchivo(fecha: string): string {
  return fecha.replace(/-/g, '');
}

/**
 * Formatear un valor numérico con 2 decimales
 *
 * @param valor - Número a formatear
 * @returns String con 2 decimales (ej: "10.00")
 */
function formatearDecimal(valor: number | null | undefined): string {
  if (valor === null || valor === undefined) {
    return '0.00';
  }

  return Number(valor).toFixed(2);
}

/**
 * Escapar valor para CSV si contiene caracteres especiales
 *
 * @param valor - Valor a escapar
 * @returns Valor escapado (entre comillas si contiene coma, salto de línea, o comillas)
 */
function escaparValorCSV(valor: string | number | null | undefined): string {
  if (valor === null || valor === undefined) {
    return 'N/A';
  }

  const valorStr = String(valor);

  // Si contiene coma, comillas, o salto de línea, envolver en comillas
  if (valorStr.includes(',') || valorStr.includes('"') || valorStr.includes('\n')) {
    // Escapar comillas dobles duplicándolas
    const escapado = valorStr.replace(/"/g, '""');
    return `"${escapado}"`;
  }

  return valorStr;
}

/**
 * Formatear fecha de Date a YYYY-MM-DD
 *
 * @param fecha - Fecha de tipo Date o string
 * @returns String en formato YYYY-MM-DD
 */
function formatearFecha(fecha: Date | string): string {
  if (typeof fecha === 'string') {
    // Si ya es string, asumimos formato correcto
    return fecha.substring(0, 10); // YYYY-MM-DD
  }

  // Si es Date, convertir a YYYY-MM-DD
  const year = fecha.getFullYear();
  const month = String(fecha.getMonth() + 1).padStart(2, '0');
  const day = String(fecha.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
}

/**
 * Convertir array de objetos a formato CSV
 *
 * Genera un string CSV con las siguientes características:
 * - Encoding UTF-8 con BOM (\uFEFF) para compatibilidad con Excel
 * - Headers: fecha,empleado_id,puesto_codigo,horas_normales,horas_extras,tipo_turno,es_feriado,tipo_feriado,incentivo
 * - Decimales con 2 posiciones (XX.XX)
 * - Valores booleanos como "SI" o "NO"
 * - Valores null como "N/A" o "0.00" según campo
 * - Line ending: \n (LF)
 *
 * @param data - Array de objetos con datos del reporte
 * @returns String CSV con BOM y headers
 *
 * @example
 * const data = [
 *   { fecha: '2026-01-02', empleado_id: 1001, puesto_codigo: 'P001', ... }
 * ];
 * const csv = convertToCSV(data);
 * // ﻿fecha,empleado_id,puesto_codigo,...
 * // 2026-01-02,1001,P001,10.00,2.00,DIURNO,NO,N/A,120.00
 */
function convertToCSV(data: ReporteNominaRow[]): string {
  // BOM UTF-8 para compatibilidad con Excel
  const BOM = '\uFEFF';

  // Headers del CSV
  const headers = [
    'fecha',
    'empleado_id',
    'puesto_codigo',
    'horas_normales',
    'horas_extras',
    'tipo_turno',
    'es_feriado',
    'tipo_feriado',
    'incentivo',
  ];

  // Línea de headers
  const headerLine = headers.join(',');

  // Si no hay datos, retornar solo headers con BOM
  if (data.length === 0) {
    return BOM + headerLine + '\n';
  }

  // Procesar cada fila de datos
  const rows = data.map((row) => {
    const fecha = formatearFecha(row.fecha);
    const empleado_id = String(row.empleado_id);
    const puesto_codigo = escaparValorCSV(row.puesto_codigo);
    const horas_normales = formatearDecimal(row.horas_normales);
    const horas_extras = formatearDecimal(row.horas_extras);
    const tipo_turno = row.tipo_turno;
    const es_feriado = row.es_feriado;
    const tipo_feriado = escaparValorCSV(row.tipo_feriado || 'N/A');
    const incentivo = formatearDecimal(row.incentivo);

    return [
      fecha,
      empleado_id,
      puesto_codigo,
      horas_normales,
      horas_extras,
      tipo_turno,
      es_feriado,
      tipo_feriado,
      incentivo,
    ].join(',');
  });

  // Unir headers + rows con saltos de línea
  const csvContent = [headerLine, ...rows].join('\n') + '\n';

  return BOM + csvContent;
}

// ============================================================================
// SERVICIO PRINCIPAL
// ============================================================================

/**
 * Generar reporte CSV para nómina
 *
 * Ejecuta el stored procedure sp_generar_reporte_nomina que retorna
 * los turnos NO procesados (procesado_nomina = FALSE) en el rango de fechas.
 *
 * Luego convierte el resultado a formato CSV con encoding UTF-8 BOM para
 * compatibilidad con Excel.
 *
 * **NUEVO (T2.25)**: Ahora también guarda el reporte en el historial
 * (tabla ot_sys_reportes_generados) automáticamente después de generar el CSV.
 *
 * @param fecha_inicio - Fecha de inicio del rango (YYYY-MM-DD)
 * @param fecha_fin - Fecha de fin del rango (YYYY-MM-DD)
 * @param user_id - ID del usuario que genera el reporte (para historial)
 * @returns String CSV con BOM y datos
 *
 * @throws RangoFechasInvalidoError si fecha_inicio > fecha_fin o rango > 31 días
 * @throws Error si hay error al ejecutar el SP o guardar historial
 *
 * @example
 * ```typescript
 * const csv = await generarReporteNomina('2026-01-01', '2026-01-15', 1);
 * console.log(csv);
 * // ﻿fecha,empleado_id,puesto_codigo,...
 * // 2026-01-02,1001,P001,10.00,2.00,DIURNO,NO,N/A,120.00
 * ```
 */
export async function generarReporteNomina(
  fecha_inicio: string,
  fecha_fin: string,
  user_id: number
): Promise<string> {
  console.log(
    `[Reportes Service] Generando reporte de nómina para rango: ${fecha_inicio} - ${fecha_fin}, user_id: ${user_id}`
  );

  // VALIDACIÓN 1: Verificar que fecha_inicio < fecha_fin
  if (fecha_inicio > fecha_fin) {
    throw new RangoFechasInvalidoError(
      `Fecha de inicio (${fecha_inicio}) no puede ser mayor que fecha de fin (${fecha_fin})`
    );
  }

  // VALIDACIÓN 2: Verificar que rango no exceda 31 días
  const diferenciaDias = calcularDiferenciaDias(fecha_inicio, fecha_fin);

  if (diferenciaDias > 31) {
    throw new RangoFechasInvalidoError(
      `El rango de fechas (${diferenciaDias} días) excede el máximo permitido de 31 días`
    );
  }

  console.log(`[Reportes Service] Rango válido: ${diferenciaDias} días`);

  // PASO 1: Llamar al stored procedure sp_generar_reporte_nomina
  const pool = getTurnosPool();

  try {
    console.log('[Reportes Service] Ejecutando SP sp_generar_reporte_nomina...');

    const [rows] = await pool.execute<RowDataPacket[]>(
      'CALL ot_sp_generar_reporte_nomina(?, ?)',
      [fecha_inicio, fecha_fin]
    );

    // El resultado del SP está en rows[0] (primer result set)
    const data = (rows[0] as ReporteNominaRow[]) || [];

    console.log(`[Reportes Service] SP retornó ${data.length} registros`);

    // PASO 2: Convertir resultado a CSV
    const csv = convertToCSV(data);

    console.log(
      `[Reportes Service] CSV generado exitosamente (${csv.length} caracteres)`
    );

    // PASO 3 (NUEVO T2.25): Guardar en historial
    const cantidad_turnos = data.length;
    const nombre_archivo = getFilename(fecha_inicio, fecha_fin);

    try {
      await guardarHistorialReporte({
        user_id,
        fecha_inicio,
        fecha_fin,
        cantidad_turnos,
        nombre_archivo,
      });

      console.log('[Reportes Service] Reporte guardado en historial exitosamente');
    } catch (historialError: any) {
      // Si falla el guardado en historial, logear error pero no fallar la generación
      console.error(
        '[Reportes Service] ADVERTENCIA: Error al guardar historial, pero CSV generado correctamente:',
        historialError.message
      );
    }

    return csv;
  } catch (error: any) {
    console.error('[Reportes Service] Error al generar reporte:', error);
    throw new Error(`Error al generar reporte de nómina: ${error.message}`);
  }
}

/**
 * Obtener nombre de archivo sugerido para el CSV
 *
 * Formato: nomina_YYYYMMDD_YYYYMMDD.csv
 *
 * @param fecha_inicio - Fecha de inicio (YYYY-MM-DD)
 * @param fecha_fin - Fecha de fin (YYYY-MM-DD)
 * @returns Nombre de archivo sugerido
 *
 * @example
 * getFilename('2026-01-01', '2026-01-15')
 * // => "nomina_20260101_20260115.csv"
 */
export function getFilename(fecha_inicio: string, fecha_fin: string): string {
  const inicio = formatearFechaParaArchivo(fecha_inicio);
  const fin = formatearFechaParaArchivo(fecha_fin);

  return `nomina_${inicio}_${fin}.csv`;
}

/**
 * Obtener vista previa de turnos no procesados para nómina
 *
 * Retorna datos JSON con los turnos pendientes de procesar en un rango de fechas,
 * incluyendo información del empleado, puesto, incentivos y resumen estadístico.
 * Limitado a 50 registros para la vista previa.
 *
 * @param fecha_inicio - Fecha de inicio del rango (YYYY-MM-DD)
 * @param fecha_fin - Fecha de fin del rango (YYYY-MM-DD)
 * @returns Objeto con data (max 50 rows), total count y resumen estadístico
 * @throws RangoFechasInvalidoError si el rango es inválido o excede 31 días
 */
export async function getVistaPrevia(
  fecha_inicio: string,
  fecha_fin: string
): Promise<{
  data: Array<{
    fecha: string;
    empleado_id: number;
    empleado_nombre: string;
    empleado_cedula: string;
    puesto_codigo: string;
    puesto_nombre: string;
    horas_normales: number;
    horas_extras: number;
    tipo_turno: 'DIURNO' | 'NOCTURNO';
    es_feriado: boolean;
    tipo_feriado?: string;
    incentivo: number;
  }>;
  total: number;
  resumen: {
    total_horas_normales: number;
    total_horas_extras: number;
    total_turnos: number;
    turnos_diurnos: number;
    turnos_nocturnos: number;
    turnos_feriados: number;
    total_incentivos: number;
  };
}> {
  console.log(
    `[Reportes Service] Obteniendo vista previa: ${fecha_inicio} - ${fecha_fin}`
  );

  // VALIDACIÓN 1: Verificar que fecha_inicio <= fecha_fin
  if (fecha_inicio > fecha_fin) {
    throw new RangoFechasInvalidoError(
      `Fecha de inicio (${fecha_inicio}) no puede ser mayor que fecha de fin (${fecha_fin})`
    );
  }

  // VALIDACIÓN 2: Verificar que rango no exceda 31 días
  const diferenciaDias = calcularDiferenciaDias(fecha_inicio, fecha_fin);

  if (diferenciaDias > 31) {
    throw new RangoFechasInvalidoError(
      `El rango de fechas (${diferenciaDias} días) excede el máximo permitido de 31 días`
    );
  }

  console.log(`[Reportes Service] Rango válido: ${diferenciaDias} días`);

  const pool = getTurnosPool();

  try {
    // PASO 1: Obtener datos de turnos no procesados (max 50)
    const [dataRows] = await pool.execute<RowDataPacket[]>(
      `SELECT
        t.fecha,
        t.empleado_id,
        CONCAT(e.nombres, ' ', e.apellidos) as empleado_nombre,
        e.cedula_empleado as empleado_cedula,
        p.codigo as puesto_codigo,
        p.nombre as puesto_nombre,
        t.horas_normales,
        t.horas_extras,
        t.tipo_turno,
        t.es_feriado,
        COALESCE(f.tipo, 'N/A') as tipo_feriado,
        COALESCE((t.horas_normales + t.horas_extras) * ip.valor_hora, 0) as incentivo
      FROM ot_turnos t
      LEFT JOIN rh_empleado e ON t.empleado_id = e.id_empleado
      LEFT JOIN ot_puestos p ON t.puesto_id = p.id
      LEFT JOIN ot_feriados f ON t.fecha = f.fecha AND t.es_feriado = 1
      LEFT JOIN ot_incentivos_puesto ip ON p.id = ip.puesto_id
        AND t.fecha BETWEEN ip.fecha_inicio AND ip.fecha_fin
      WHERE t.fecha BETWEEN ? AND ?
        AND t.procesado_nomina = FALSE
      ORDER BY t.fecha, t.empleado_id
      LIMIT 50`,
      [fecha_inicio, fecha_fin]
    );

    // PASO 2: Obtener total de turnos no procesados
    const [countRows] = await pool.execute<RowDataPacket[]>(
      `SELECT COUNT(*) as total FROM ot_turnos WHERE fecha BETWEEN ? AND ? AND procesado_nomina = FALSE`,
      [fecha_inicio, fecha_fin]
    );

    const total = countRows[0]?.total || 0;

    // PASO 3: Obtener resumen estadístico
    const [summaryRows] = await pool.execute<RowDataPacket[]>(
      `SELECT
        COUNT(*) as total_turnos,
        COALESCE(SUM(horas_normales), 0) as total_horas_normales,
        COALESCE(SUM(horas_extras), 0) as total_horas_extras,
        SUM(CASE WHEN tipo_turno = 'DIURNO' THEN 1 ELSE 0 END) as turnos_diurnos,
        SUM(CASE WHEN tipo_turno = 'NOCTURNO' THEN 1 ELSE 0 END) as turnos_nocturnos,
        SUM(CASE WHEN es_feriado = 1 THEN 1 ELSE 0 END) as turnos_feriados
      FROM ot_turnos
      WHERE fecha BETWEEN ? AND ? AND procesado_nomina = FALSE`,
      [fecha_inicio, fecha_fin]
    );

    const summary = summaryRows[0];

    // PASO 4: Calcular total de incentivos
    const [incentivosRows] = await pool.execute<RowDataPacket[]>(
      `SELECT COALESCE(SUM((t.horas_normales + t.horas_extras) * ip.valor_hora), 0) as total_incentivos
      FROM ot_turnos t
      LEFT JOIN ot_puestos p ON t.puesto_id = p.id
      LEFT JOIN ot_incentivos_puesto ip ON p.id = ip.puesto_id
        AND t.fecha BETWEEN ip.fecha_inicio AND ip.fecha_fin
      WHERE t.fecha BETWEEN ? AND ? AND t.procesado_nomina = FALSE`,
      [fecha_inicio, fecha_fin]
    );

    const total_incentivos = incentivosRows[0]?.total_incentivos || 0;

    // PASO 5: Formatear datos
    const data = dataRows.map((row) => ({
      fecha: row.fecha instanceof Date
        ? row.fecha.toISOString().split('T')[0]
        : String(row.fecha).split('T')[0],
      empleado_id: Number(row.empleado_id),
      empleado_nombre: row.empleado_nombre || '',
      empleado_cedula: row.empleado_cedula || '',
      puesto_codigo: row.puesto_codigo || '',
      puesto_nombre: row.puesto_nombre || '',
      horas_normales: parseFloat(row.horas_normales) || 0,
      horas_extras: parseFloat(row.horas_extras) || 0,
      tipo_turno: row.tipo_turno as 'DIURNO' | 'NOCTURNO',
      es_feriado: Boolean(row.es_feriado),
      tipo_feriado: row.tipo_feriado !== 'N/A' ? row.tipo_feriado : undefined,
      incentivo: parseFloat(row.incentivo) || 0,
    }));

    const resumen = {
      total_turnos: Number(summary?.total_turnos) || 0,
      total_horas_normales: parseFloat(summary?.total_horas_normales) || 0,
      total_horas_extras: parseFloat(summary?.total_horas_extras) || 0,
      turnos_diurnos: Number(summary?.turnos_diurnos) || 0,
      turnos_nocturnos: Number(summary?.turnos_nocturnos) || 0,
      turnos_feriados: Number(summary?.turnos_feriados) || 0,
      total_incentivos: parseFloat(total_incentivos) || 0,
    };

    console.log(
      `[Reportes Service] Vista previa generada: ${data.length} registros (total: ${total}), ${resumen.total_turnos} turnos`
    );

    return { data, total, resumen };
  } catch (error: any) {
    console.error('[Reportes Service] Error al obtener vista previa:', error);
    throw new Error(`Error al obtener vista previa de nómina: ${error.message}`);
  }
}

/**
 * Marcar turnos como procesados para nómina
 *
 * Actualiza los turnos en el rango de fechas para marcarlos como procesados
 * y asociarlos a una nómina específica. Solo actualiza turnos NO procesados.
 *
 * Esta función se ejecuta después de que el archivo CSV ha sido importado
 * exitosamente en el sistema de nómina, para mantener trazabilidad y
 * evitar duplicación de datos en futuros reportes.
 *
 * **NUEVO (T2.25)**: Ahora también actualiza el nomina_id en el historial
 * de reportes (tabla ot_sys_reportes_generados) para vincular el reporte con
 * la nómina procesada.
 *
 * **Lógica SQL**:
 * ```sql
 * UPDATE ot_turnos
 * SET procesado_nomina = TRUE,
 *     nomina_id = ?,
 *     updated_at = CURRENT_TIMESTAMP
 * WHERE fecha BETWEEN ? AND ?
 *   AND procesado_nomina = FALSE
 * ```
 *
 * **Inmutabilidad**: Turnos ya procesados (procesado_nomina = TRUE) NO se actualizan.
 *
 * @param fecha_inicio - Fecha de inicio del rango (YYYY-MM-DD)
 * @param fecha_fin - Fecha de fin del rango (YYYY-MM-DD)
 * @param nomina_id - ID de la nómina en el sistema de nómina
 * @returns Objeto con cantidad de turnos procesados y datos del rango
 *
 * @throws Error si hay error en la actualización de la base de datos
 *
 * @example
 * ```typescript
 * const result = await marcarTurnosProcesados('2026-01-01', '2026-01-15', 125);
 * console.log(`Procesados: ${result.turnos_procesados} turnos`);
 * // => Procesados: 45 turnos
 * ```
 */
export async function marcarTurnosProcesados(
  fecha_inicio: string,
  fecha_fin: string,
  nomina_id: number
): Promise<{
  turnos_procesados: number;
  nomina_id: number;
  fecha_inicio: string;
  fecha_fin: string;
}> {
  console.log(
    `[Reportes Service] Marcando turnos como procesados para nómina ${nomina_id}, rango: ${fecha_inicio} - ${fecha_fin}`
  );

  const pool = getTurnosPool();

  try {
    // PASO 1: Ejecutar UPDATE para marcar turnos como procesados
    // IMPORTANTE: Solo actualizar turnos NO procesados (procesado_nomina = FALSE)
    const [result] = await pool.execute<ResultSetHeader>(
      `UPDATE ot_turnos
       SET procesado_nomina = TRUE,
           nomina_id = ?,
           updated_at = CURRENT_TIMESTAMP
       WHERE fecha BETWEEN ? AND ?
         AND procesado_nomina = FALSE`,
      [nomina_id, fecha_inicio, fecha_fin]
    );

    const turnosProcesados = result.affectedRows;

    console.log(
      `[Reportes Service] ${turnosProcesados} turnos marcados como procesados para nómina ${nomina_id}`
    );

    // PASO 2 (NUEVO T2.25): Actualizar nomina_id en historial
    try {
      await actualizarNominaIdHistorial(fecha_inicio, fecha_fin, nomina_id);
      console.log('[Reportes Service] Historial actualizado con nomina_id exitosamente');
    } catch (historialError: any) {
      // Si falla la actualización del historial, logear error pero no fallar la operación
      console.error(
        '[Reportes Service] ADVERTENCIA: Error al actualizar historial, pero turnos marcados correctamente:',
        historialError.message
      );
    }

    return {
      turnos_procesados: turnosProcesados,
      nomina_id,
      fecha_inicio,
      fecha_fin,
    };
  } catch (error: any) {
    console.error('[Reportes Service] Error al marcar turnos como procesados:', error);
    throw new Error(`Error al marcar turnos como procesados: ${error.message}`);
  }
}

// ============================================================================
// HISTORIAL DE REPORTES GENERADOS
// ============================================================================

/**
 * Contar turnos NO procesados en un rango de fechas
 *
 * Retorna la cantidad de turnos que serán incluidos en un reporte CSV
 * para el rango de fechas especificado (procesado_nomina = FALSE).
 *
 * @param fecha_inicio - Fecha de inicio del rango (YYYY-MM-DD)
 * @param fecha_fin - Fecha de fin del rango (YYYY-MM-DD)
 * @returns Cantidad de turnos NO procesados en el rango
 *
 * @throws Error si hay error en la consulta a la base de datos
 *
 * @example
 * ```typescript
 * const cantidad = await contarTurnosEnRango('2026-01-01', '2026-01-15');
 * console.log(`Turnos a incluir: ${cantidad}`);
 * // => Turnos a incluir: 45
 * ```
 */
export async function contarTurnosEnRango(
  fecha_inicio: string,
  fecha_fin: string
): Promise<number> {
  console.log(
    `[Reportes Service] Contando turnos NO procesados en rango: ${fecha_inicio} - ${fecha_fin}`
  );

  const pool = getTurnosPool();

  try {
    const [rows] = await pool.execute<RowDataPacket[]>(
      `SELECT COUNT(*) as total
       FROM ot_turnos
       WHERE fecha BETWEEN ? AND ?
         AND procesado_nomina = FALSE`,
      [fecha_inicio, fecha_fin]
    );

    const total = rows[0]?.total || 0;

    console.log(`[Reportes Service] ${total} turnos NO procesados en rango`);

    return total;
  } catch (error: any) {
    console.error('[Reportes Service] Error al contar turnos en rango:', error);
    throw new Error(`Error al contar turnos en rango: ${error.message}`);
  }
}

/**
 * Guardar historial de reporte generado
 *
 * Crea un registro en la tabla ot_sys_reportes_generados con los datos
 * del reporte CSV generado. Se ejecuta inmediatamente después de generar
 * el CSV exitosamente.
 *
 * @param data - Datos del reporte a guardar
 * @returns ID del registro creado
 *
 * @throws Error si hay error al insertar en la base de datos
 *
 * @example
 * ```typescript
 * const id = await guardarHistorialReporte({
 *   user_id: 1,
 *   fecha_inicio: '2026-01-01',
 *   fecha_fin: '2026-01-15',
 *   cantidad_turnos: 45,
 *   nombre_archivo: 'nomina_20260101_20260115.csv'
 * });
 * console.log(`Historial guardado con ID: ${id}`);
 * ```
 */
export async function guardarHistorialReporte(
  data: CreateHistorialReporteDTO
): Promise<number> {
  console.log(
    `[Reportes Service] Guardando historial de reporte: ${data.nombre_archivo}`
  );

  const pool = getTurnosPool();

  try {
    const [result] = await pool.execute<ResultSetHeader>(
      `INSERT INTO ot_sys_reportes_generados
       (user_id, fecha_inicio, fecha_fin, cantidad_turnos, nombre_archivo)
       VALUES (?, ?, ?, ?, ?)`,
      [
        data.user_id,
        data.fecha_inicio,
        data.fecha_fin,
        data.cantidad_turnos,
        data.nombre_archivo,
      ]
    );

    const insertedId = result.insertId;

    console.log(`[Reportes Service] Historial guardado con ID: ${insertedId}`);

    return insertedId;
  } catch (error: any) {
    console.error('[Reportes Service] Error al guardar historial de reporte:', error);
    throw new Error(`Error al guardar historial de reporte: ${error.message}`);
  }
}

/**
 * Obtener historial de reportes paginado
 *
 * Retorna la lista de reportes CSV generados con información del usuario
 * que los generó. Incluye paginación y ordenamiento por fecha de generación DESC.
 *
 * **Query SQL**:
 * ```sql
 * SELECT
 *   h.id,
 *   h.user_id,
 *   u.username,
 *   u.nombre_completo,
 *   h.fecha_inicio,
 *   h.fecha_fin,
 *   h.cantidad_turnos,
 *   h.fecha_generacion,
 *   h.nomina_id,
 *   h.nombre_archivo
 * FROM ot_sys_reportes_generados h
 * INNER JOIN ot_sys_usuarios u ON h.user_id = u.id_usuario
 * ORDER BY h.fecha_generacion DESC
 * LIMIT ? OFFSET ?
 * ```
 *
 * @param page - Número de página (1-indexed, default: 1)
 * @param pageSize - Tamaño de página (default: 10, max: 100)
 * @returns Resultado paginado con datos de historial
 *
 * @throws Error si hay error en la consulta a la base de datos
 *
 * @example
 * ```typescript
 * const resultado = await getHistorialReportes(1, 10);
 * console.log(`Total: ${resultado.total}, Página ${resultado.page} de ${resultado.totalPages}`);
 * resultado.data.forEach(h => {
 *   console.log(`${h.nombre_archivo} generado por ${h.usuario.nombre_completo}`);
 * });
 * ```
 */
export async function getHistorialReportes(
  page: number = HISTORIAL_PAGINATION.DEFAULT_PAGE,
  pageSize: number = HISTORIAL_PAGINATION.DEFAULT_PAGE_SIZE
): Promise<PaginatedHistorialDTO> {
  console.log(`[Reportes Service] Obteniendo historial de reportes (página ${page}, ${pageSize} registros)`);

  // Validar y limitar pageSize
  const validPageSize = Math.min(
    Math.max(pageSize, 1),
    HISTORIAL_PAGINATION.MAX_PAGE_SIZE
  );

  // Validar page
  const validPage = Math.max(page, 1);

  // Calcular offset
  const offset = (validPage - 1) * validPageSize;

  const pool = getTurnosPool();

  try {
    // 1. Contar total de registros
    const [countRows] = await pool.execute<RowDataPacket[]>(
      'SELECT COUNT(*) as total FROM ot_sys_reportes_generados'
    );

    const total = countRows[0]?.total || 0;

    // 2. Si no hay registros, retornar resultado vacío
    if (total === 0) {
      console.log('[Reportes Service] No hay reportes en el historial');
      return {
        data: [],
        total: 0,
        page: validPage,
        pageSize: validPageSize,
        totalPages: 0,
      };
    }

    // 3. Obtener registros paginados con JOIN a sys_usuarios
    const [rows] = await pool.execute<RowDataPacket[]>(
      `SELECT
         h.id,
         h.user_id,
         u.username,
         u.nombre_completo,
         h.fecha_inicio,
         h.fecha_fin,
         h.cantidad_turnos,
         h.fecha_generacion,
         h.nomina_id,
         h.nombre_archivo
       FROM ot_sys_reportes_generados h
       INNER JOIN ot_sys_usuarios u ON h.user_id = u.id_usuario
       ORDER BY h.fecha_generacion DESC
       LIMIT ? OFFSET ?`,
      [String(validPageSize), String(offset)]
    );

    // 4. Formatear resultados
    const data: HistorialReporteDTO[] = rows.map((row) => ({
      id: row.id,
      usuario: {
        id: row.user_id,
        username: row.username,
        nombre_completo: row.nombre_completo,
      },
      fecha_inicio: row.fecha_inicio,
      fecha_fin: row.fecha_fin,
      cantidad_turnos: row.cantidad_turnos,
      fecha_generacion: row.fecha_generacion,
      nomina_id: row.nomina_id,
      nombre_archivo: row.nombre_archivo,
    }));

    const totalPages = Math.ceil(total / validPageSize);

    console.log(
      `[Reportes Service] ${data.length} registros obtenidos (total: ${total}, páginas: ${totalPages})`
    );

    return {
      data,
      total,
      page: validPage,
      pageSize: validPageSize,
      totalPages,
    };
  } catch (error: any) {
    console.error('[Reportes Service] Error al obtener historial de reportes:', error);
    throw new Error(`Error al obtener historial de reportes: ${error.message}`);
  }
}

/**
 * Obtener un registro de historial por ID
 *
 * Retorna un registro específico del historial con información del usuario.
 * Usado para validar existencia antes de regenerar CSV.
 *
 * @param id - ID del registro de historial
 * @returns Registro de historial o null si no existe
 *
 * @throws Error si hay error en la consulta a la base de datos
 *
 * @example
 * ```typescript
 * const reporte = await getHistorialReporteById(5);
 * if (reporte) {
 *   console.log(`Reporte: ${reporte.nombre_archivo}`);
 * } else {
 *   console.log('Reporte no encontrado');
 * }
 * ```
 */
export async function getHistorialReporteById(
  id: number
): Promise<HistorialReporteDTO | null> {
  console.log(`[Reportes Service] Obteniendo historial de reporte ID: ${id}`);

  const pool = getTurnosPool();

  try {
    const [rows] = await pool.execute<RowDataPacket[]>(
      `SELECT
         h.id,
         h.user_id,
         u.username,
         u.nombre_completo,
         h.fecha_inicio,
         h.fecha_fin,
         h.cantidad_turnos,
         h.fecha_generacion,
         h.nomina_id,
         h.nombre_archivo
       FROM ot_sys_reportes_generados h
       INNER JOIN ot_sys_usuarios u ON h.user_id = u.id_usuario
       WHERE h.id = ?`,
      [id]
    );

    if (rows.length === 0) {
      console.log(`[Reportes Service] Reporte ID ${id} no encontrado`);
      return null;
    }

    const row = rows[0];

    const reporte: HistorialReporteDTO = {
      id: row.id,
      usuario: {
        id: row.user_id,
        username: row.username,
        nombre_completo: row.nombre_completo,
      },
      fecha_inicio: row.fecha_inicio,
      fecha_fin: row.fecha_fin,
      cantidad_turnos: row.cantidad_turnos,
      fecha_generacion: row.fecha_generacion,
      nomina_id: row.nomina_id,
      nombre_archivo: row.nombre_archivo,
    };

    console.log(`[Reportes Service] Reporte ID ${id} obtenido: ${reporte.nombre_archivo}`);

    return reporte;
  } catch (error: any) {
    console.error('[Reportes Service] Error al obtener reporte por ID:', error);
    throw new Error(`Error al obtener reporte por ID: ${error.message}`);
  }
}

/**
 * Actualizar nomina_id en historial
 *
 * Actualiza el campo nomina_id en el registro de historial correspondiente
 * al rango de fechas especificado. Se ejecuta después de marcar turnos como
 * procesados para vincular el reporte con la nómina en el sistema externo.
 *
 * **Query SQL**:
 * ```sql
 * UPDATE ot_sys_reportes_generados
 * SET nomina_id = ?
 * WHERE fecha_inicio = ?
 *   AND fecha_fin = ?
 *   AND nomina_id IS NULL
 * ORDER BY fecha_generacion DESC
 * LIMIT 1
 * ```
 *
 * **Nota**: Solo actualiza el registro MÁS RECIENTE con nomina_id = NULL
 * para el rango de fechas especificado.
 *
 * @param fecha_inicio - Fecha de inicio del rango (YYYY-MM-DD)
 * @param fecha_fin - Fecha de fin del rango (YYYY-MM-DD)
 * @param nomina_id - ID de la nómina en el sistema externo
 * @returns Cantidad de registros actualizados (0 o 1)
 *
 * @throws Error si hay error en la actualización de la base de datos
 *
 * @example
 * ```typescript
 * const actualizados = await actualizarNominaIdHistorial('2026-01-01', '2026-01-15', 125);
 * console.log(`Registros actualizados: ${actualizados}`);
 * // => Registros actualizados: 1
 * ```
 */
export async function actualizarNominaIdHistorial(
  fecha_inicio: string,
  fecha_fin: string,
  nomina_id: number
): Promise<number> {
  console.log(
    `[Reportes Service] Actualizando nomina_id en historial: ${fecha_inicio} - ${fecha_fin}, nómina ${nomina_id}`
  );

  const pool = getTurnosPool();

  try {
    // Actualizar solo el registro más reciente con nomina_id = NULL
    // para el rango de fechas especificado
    const [result] = await pool.execute<ResultSetHeader>(
      `UPDATE ot_sys_reportes_generados
       SET nomina_id = ?
       WHERE fecha_inicio = ?
         AND fecha_fin = ?
         AND nomina_id IS NULL
       ORDER BY fecha_generacion DESC
       LIMIT 1`,
      [nomina_id, fecha_inicio, fecha_fin]
    );

    const registrosActualizados = result.affectedRows;

    console.log(
      `[Reportes Service] ${registrosActualizados} registro(s) de historial actualizado(s) con nomina_id ${nomina_id}`
    );

    return registrosActualizados;
  } catch (error: any) {
    console.error('[Reportes Service] Error al actualizar nomina_id en historial:', error);
    throw new Error(`Error al actualizar nomina_id en historial: ${error.message}`);
  }
}

// ============================================================================
// REPORTES DE RESUMEN (JSON)
// ============================================================================

/**
 * Obtener resumen estadístico de quincena
 *
 * Genera un resumen con estadísticas agregadas de todos los turnos
 * en el rango de fechas especificado. Incluye:
 * - Total de turnos, horas normales, horas extras
 * - Cantidad de guardianes distintos
 * - Distribución por tipo de turno (DIURNO/NOCTURNO)
 * - Turnos en días feriados
 * - Total de incentivos generados
 *
 * **Uso típico**: Dashboard principal, resumen de período.
 *
 * **Límite de rango**: Máximo 93 días (trimestre).
 *
 * @param fecha_inicio - Fecha de inicio del período (YYYY-MM-DD)
 * @param fecha_fin - Fecha de fin del período (YYYY-MM-DD)
 * @returns Objeto ResumenQuincenaDTO con estadísticas agregadas
 *
 * @throws RangoFechasInvalidoError si el rango excede 93 días o fecha_inicio > fecha_fin
 * @throws Error si hay error en la consulta a la base de datos
 *
 * @example
 * ```typescript
 * const resumen = await getResumenQuincena('2026-01-01', '2026-01-15');
 * console.log(`Total turnos: ${resumen.total_turnos}`);
 * console.log(`Guardianes: ${resumen.total_guardianes}`);
 * console.log(`Diurnos: ${resumen.turnos_por_tipo.DIURNO}, Nocturnos: ${resumen.turnos_por_tipo.NOCTURNO}`);
 * ```
 */
export async function getResumenQuincena(
  fecha_inicio: string,
  fecha_fin: string
): Promise<ResumenQuincenaDTO> {
  console.log(
    `[Reportes Service] Obteniendo resumen de quincena: ${fecha_inicio} - ${fecha_fin}`
  );

  // VALIDACIÓN 1: Verificar que fecha_inicio <= fecha_fin
  if (fecha_inicio > fecha_fin) {
    throw new RangoFechasInvalidoError(
      `Fecha de inicio (${fecha_inicio}) no puede ser mayor que fecha de fin (${fecha_fin})`
    );
  }

  // VALIDACIÓN 2: Verificar que rango no exceda 93 días (trimestre)
  const diferenciaDias = calcularDiferenciaDias(fecha_inicio, fecha_fin);

  if (diferenciaDias > 93) {
    throw new RangoFechasInvalidoError(
      `El rango de fechas (${diferenciaDias} días) excede el máximo permitido de 93 días`
    );
  }

  console.log(`[Reportes Service] Rango válido: ${diferenciaDias} días`);

  const pool = getTurnosPool();

  try {
    // PASO 1: Obtener estadísticas generales
    const [statsRows] = await pool.execute<RowDataPacket[]>(
      `SELECT
         COUNT(*) as total_turnos,
         COALESCE(SUM(horas_normales), 0) as total_horas_normales,
         COALESCE(SUM(horas_extras), 0) as total_horas_extras,
         COUNT(DISTINCT empleado_id) as total_guardianes,
         SUM(CASE WHEN es_feriado = 1 THEN 1 ELSE 0 END) as turnos_feriados
       FROM ot_turnos
       WHERE fecha BETWEEN ? AND ?`,
      [fecha_inicio, fecha_fin]
    );

    const stats = statsRows[0];

    // PASO 2: Obtener distribución por tipo de turno
    const [tipoRows] = await pool.execute<RowDataPacket[]>(
      `SELECT
         tipo_turno,
         COUNT(*) as cantidad
       FROM ot_turnos
       WHERE fecha BETWEEN ? AND ?
       GROUP BY tipo_turno`,
      [fecha_inicio, fecha_fin]
    );

    // Convertir array a objeto { DIURNO: X, NOCTURNO: Y }
    const turnos_por_tipo = {
      DIURNO: 0,
      NOCTURNO: 0,
    };

    tipoRows.forEach((row) => {
      if (row.tipo_turno === 'DIURNO') {
        turnos_por_tipo.DIURNO = row.cantidad;
      } else if (row.tipo_turno === 'NOCTURNO') {
        turnos_por_tipo.NOCTURNO = row.cantidad;
      }
    });

    // PASO 3: Calcular total de incentivos
    // JOIN con incentivos_puesto para obtener valor_hora (monto / 360)
    // Incentivos se calculan por turno: (horas_normales + horas_extras) * valor_hora
    const [incentivosRows] = await pool.execute<RowDataPacket[]>(
      `SELECT
         COALESCE(SUM((t.horas_normales + t.horas_extras) * ip.valor_hora), 0) as total_incentivos
       FROM ot_turnos t
       LEFT JOIN ot_puestos p ON t.puesto_id = p.id
       LEFT JOIN ot_incentivos_puesto ip ON p.id = ip.puesto_id
         AND t.fecha BETWEEN ip.fecha_inicio AND ip.fecha_fin
        WHERE t.fecha BETWEEN ? AND ?`,
      [fecha_inicio, fecha_fin]
    );

    const total_incentivos = incentivosRows[0]?.total_incentivos || 0;

    // PASO 4: Construir DTO de respuesta
    const resumen: ResumenQuincenaDTO = {
      fecha_inicio,
      fecha_fin,
      total_turnos: stats.total_turnos,
      total_horas_normales: parseFloat(stats.total_horas_normales),
      total_horas_extras: parseFloat(stats.total_horas_extras),
      total_guardianes: stats.total_guardianes,
      turnos_por_tipo,
      turnos_feriados: stats.turnos_feriados,
      total_incentivos: parseFloat(total_incentivos),
    };

    console.log(
      `[Reportes Service] Resumen de quincena generado: ${resumen.total_turnos} turnos, ${resumen.total_guardianes} guardianes`
    );

    return resumen;
  } catch (error: any) {
    console.error('[Reportes Service] Error al obtener resumen de quincena:', error);
    throw new Error(`Error al obtener resumen de quincena: ${error.message}`);
  }
}

/**
 * Obtener resumen estadístico por guardián
 *
 * Genera un resumen con estadísticas de turnos agrupadas por empleado (guardián).
 * Incluye filtros opcionales y paginación para listas grandes.
 *
 * **Características**:
 * - Paginación configurable (default: 10 registros por página)
 * - Filtro opcional por empleado_id (un guardián específico)
 * - Incluye datos del empleado desde BD RRHH (nombre, cédula)
 * - Ordenado por total_turnos DESC (más activos primero)
 *
 * **Uso típico**: Tabla de performance de guardianes, análisis individual.
 *
 * @param filtros - Filtros de búsqueda (fecha_inicio, fecha_fin, empleado_id opcional)
 * @param paginacion - Opciones de paginación (page, pageSize)
 * @returns Resultado paginado con array de ResumenGuardianDTO
 *
 * @throws RangoFechasInvalidoError si fecha_inicio > fecha_fin
 * @throws Error si hay error en la consulta a la base de datos
 *
 * @example
 * ```typescript
 * // Todos los guardianes (paginado)
 * const resultado = await getResumenPorGuardian(
 *   { fecha_inicio: '2026-01-01', fecha_fin: '2026-01-15' },
 *   { page: 1, pageSize: 10 }
 * );
 * console.log(`Total guardianes: ${resultado.total}`);
 * resultado.data.forEach(g => console.log(`${g.nombre_empleado}: ${g.total_turnos} turnos`));
 *
 * // Un guardián específico
 * const resultadoIndividual = await getResumenPorGuardian(
 *   { fecha_inicio: '2026-01-01', fecha_fin: '2026-01-15', empleado_id: 1001 },
 *   { page: 1, pageSize: 1 }
 * );
 * ```
 */
export async function getResumenPorGuardian(
  filtros: ResumenGuardianFiltros,
  paginacion: PaginacionOpciones
): Promise<PaginatedResumenResponse<ResumenGuardianDTO>> {
  console.log(
    `[Reportes Service] Obteniendo resumen por guardián: ${filtros.fecha_inicio} - ${filtros.fecha_fin}, empleado_id: ${filtros.empleado_id || 'todos'}`
  );

  const { fecha_inicio, fecha_fin, empleado_id } = filtros;
  const { page, pageSize } = paginacion;

  // VALIDACIÓN: Verificar que fecha_inicio <= fecha_fin
  if (fecha_inicio > fecha_fin) {
    throw new RangoFechasInvalidoError(
      `Fecha de inicio (${fecha_inicio}) no puede ser mayor que fecha de fin (${fecha_fin})`
    );
  }

  // Calcular offset para paginación
  const offset = (page - 1) * pageSize;

  const pool = getTurnosPool();
  const poolRRHH = getTurnosPool();

  try {
    // PASO 1: Construir WHERE clause con filtros opcionales
    const whereConditions = ['t.fecha BETWEEN ? AND ?'];
    const queryParams: any[] = [fecha_inicio, fecha_fin];

    if (empleado_id) {
      whereConditions.push('t.empleado_id = ?');
      queryParams.push(empleado_id);
    }

    const whereClause = whereConditions.join(' AND ');

    // PASO 2: Contar total de registros (sin paginación)
    const countQuery = `
      SELECT COUNT(DISTINCT t.empleado_id) as total
      FROM ot_turnos t
      WHERE ${whereClause}
    `;

    const [countRows] = await pool.execute<RowDataPacket[]>(countQuery, queryParams);
    const total = countRows[0]?.total || 0;

    // Si no hay registros, retornar resultado vacío
    if (total === 0) {
      console.log('[Reportes Service] No hay guardianes con turnos en el rango especificado');
      return {
        data: [],
        total: 0,
        page,
        pageSize,
      };
    }

    // PASO 3: Obtener datos agregados por guardián con paginación
    const dataQuery = `
      SELECT
        t.empleado_id,
        COUNT(*) as total_turnos,
        COALESCE(SUM(t.horas_normales), 0) as total_horas_normales,
        COALESCE(SUM(t.horas_extras), 0) as total_horas_extras,
        SUM(CASE WHEN t.tipo_turno = 'DIURNO' THEN 1 ELSE 0 END) as turnos_diurnos,
        SUM(CASE WHEN t.tipo_turno = 'NOCTURNO' THEN 1 ELSE 0 END) as turnos_nocturnos,
        SUM(CASE WHEN t.es_feriado = 1 THEN 1 ELSE 0 END) as turnos_feriados,
        COALESCE(SUM((t.horas_normales + t.horas_extras) * ip.valor_hora), 0) as total_incentivos
      FROM ot_turnos t
      LEFT JOIN ot_puestos p ON t.puesto_id = p.id
      LEFT JOIN ot_incentivos_puesto ip ON p.id = ip.puesto_id
        AND t.fecha BETWEEN ip.fecha_inicio AND ip.fecha_fin
      WHERE ${whereClause}
      GROUP BY t.empleado_id
      ORDER BY total_turnos DESC
      LIMIT ? OFFSET ?
    `;

    const dataParams = [...queryParams, String(pageSize), String(offset)];
    const [dataRows] = await pool.execute<RowDataPacket[]>(dataQuery, dataParams);

    // PASO 4: Obtener datos de empleados desde BD RRHH
    const empleadosIds = dataRows.map((row) => row.empleado_id);

    if (empleadosIds.length === 0) {
      return {
        data: [],
        total,
        page,
        pageSize,
      };
    }

    // Query a BD RRHH para obtener nombres y cédulas
    const empleadosQuery = `
      SELECT
        id_empleado,
        cedula_empleado,
        CONCAT(nombres, ' ', apellidos) as nombre_completo
      FROM rh_empleado
      WHERE id_empleado IN (${empleadosIds.map(() => '?').join(',')})
    `;

    const [empleadosRows] = await poolRRHH.execute<RowDataPacket[]>(
      empleadosQuery,
      empleadosIds
    );

    // Crear mapa de empleados para acceso rápido
    const empleadosMap = new Map<number, { cedula: string; nombre: string }>();
    empleadosRows.forEach((row) => {
      empleadosMap.set(row.id_empleado, {
        cedula: row.cedula_empleado,
        nombre: row.nombre_completo,
      });
    });

    // PASO 5: Construir DTOs de respuesta
    const data: ResumenGuardianDTO[] = dataRows.map((row) => {
      const empleado = empleadosMap.get(row.empleado_id);

      return {
        empleado_id: row.empleado_id,
        nombre_empleado: empleado?.nombre || 'Desconocido',
        cedula: empleado?.cedula || 'N/A',
        total_turnos: row.total_turnos,
        total_horas_normales: parseFloat(row.total_horas_normales),
        total_horas_extras: parseFloat(row.total_horas_extras),
        turnos_diurnos: row.turnos_diurnos,
        turnos_nocturnos: row.turnos_nocturnos,
        turnos_feriados: row.turnos_feriados,
        total_incentivos: parseFloat(row.total_incentivos),
      };
    });

    console.log(
      `[Reportes Service] ${data.length} guardianes obtenidos (total: ${total}, página ${page})`
    );

    return {
      data,
      total,
      page,
      pageSize,
    };
  } catch (error: any) {
    console.error('[Reportes Service] Error al obtener resumen por guardián:', error);
    throw new Error(`Error al obtener resumen por guardián: ${error.message}`);
  }
}

/**
 * Obtener resumen estadístico por puesto
 *
 * Genera un resumen con estadísticas de turnos agrupadas por puesto de trabajo.
 * Incluye filtros opcionales (puesto, ubicación, cliente) y paginación.
 *
 * **Características**:
 * - Paginación configurable (default: 10 registros por página)
 * - Filtros opcionales: puesto_id, ubicacion_id, cliente_id
 * - Incluye datos relacionados: puesto, ubicación, cliente (via JOINs)
 * - Ordenado por total_turnos DESC (puestos más utilizados primero)
 *
 * **Uso típico**: Tabla de utilización de puestos, análisis por cliente/ubicación.
 *
 * @param filtros - Filtros de búsqueda (fecha_inicio, fecha_fin, puesto_id, ubicacion_id, cliente_id)
 * @param paginacion - Opciones de paginación (page, pageSize)
 * @returns Resultado paginado con array de ResumenPuestoDTO
 *
 * @throws RangoFechasInvalidoError si fecha_inicio > fecha_fin
 * @throws Error si hay error en la consulta a la base de datos
 *
 * @example
 * ```typescript
 * // Todos los puestos (paginado)
 * const resultado = await getResumenPorPuesto(
 *   { fecha_inicio: '2026-01-01', fecha_fin: '2026-01-15' },
 *   { page: 1, pageSize: 10 }
 * );
 *
 * // Filtrar por cliente
 * const resultadoPorCliente = await getResumenPorPuesto(
 *   { fecha_inicio: '2026-01-01', fecha_fin: '2026-01-15', cliente_id: 5 },
 *   { page: 1, pageSize: 10 }
 * );
 * ```
 */
export async function getResumenPorPuesto(
  filtros: ResumenPuestoFiltros,
  paginacion: PaginacionOpciones
): Promise<PaginatedResumenResponse<ResumenPuestoDTO>> {
  console.log(
    `[Reportes Service] Obteniendo resumen por puesto: ${filtros.fecha_inicio} - ${filtros.fecha_fin}`
  );

  const { fecha_inicio, fecha_fin, puesto_id, ubicacion_id, cliente_id } = filtros;
  const { page, pageSize } = paginacion;

  // VALIDACIÓN: Verificar que fecha_inicio <= fecha_fin
  if (fecha_inicio > fecha_fin) {
    throw new RangoFechasInvalidoError(
      `Fecha de inicio (${fecha_inicio}) no puede ser mayor que fecha de fin (${fecha_fin})`
    );
  }

  // Calcular offset para paginación
  const offset = (page - 1) * pageSize;

  const pool = getTurnosPool();

  try {
    // PASO 1: Construir WHERE clause con filtros opcionales
    const whereConditions = ['t.fecha BETWEEN ? AND ?'];
    const queryParams: any[] = [fecha_inicio, fecha_fin];

    if (puesto_id) {
      whereConditions.push('t.puesto_id = ?');
      queryParams.push(puesto_id);
    }

    if (ubicacion_id) {
      whereConditions.push('p.ubicacion_id = ?');
      queryParams.push(ubicacion_id);
    }

    if (cliente_id) {
      whereConditions.push('u.cliente_id = ?');
      queryParams.push(cliente_id);
    }

    const whereClause = whereConditions.join(' AND ');

    // PASO 2: Contar total de registros (sin paginación)
    const countQuery = `
      SELECT COUNT(DISTINCT t.puesto_id) as total
      FROM ot_turnos t
      INNER JOIN ot_puestos p ON t.puesto_id = p.id
      INNER JOIN ot_ubicaciones u ON p.ubicacion_id = u.id
      INNER JOIN ot_clientes c ON u.cliente_id = c.id
      WHERE ${whereClause}
    `;

    const [countRows] = await pool.execute<RowDataPacket[]>(countQuery, queryParams);
    const total = countRows[0]?.total || 0;

    // Si no hay registros, retornar resultado vacío
    if (total === 0) {
      console.log('[Reportes Service] No hay puestos con turnos en el rango especificado');
      return {
        data: [],
        total: 0,
        page,
        pageSize,
      };
    }

    // PASO 3: Obtener datos agregados por puesto con paginación
    const dataQuery = `
      SELECT
        t.puesto_id,
        p.codigo as puesto_codigo,
        p.nombre as puesto_nombre,
        u.nombre as ubicacion_nombre,
        c.nombre as cliente_nombre,
        COUNT(*) as total_turnos,
        COALESCE(SUM(t.horas_normales), 0) as total_horas_normales,
        COALESCE(SUM(t.horas_extras), 0) as total_horas_extras,
        COUNT(DISTINCT t.empleado_id) as guardianes_distintos,
        SUM(CASE WHEN t.tipo_turno = 'DIURNO' THEN 1 ELSE 0 END) as turnos_diurnos,
        SUM(CASE WHEN t.tipo_turno = 'NOCTURNO' THEN 1 ELSE 0 END) as turnos_nocturnos,
        COALESCE(SUM((t.horas_normales + t.horas_extras) * ip.valor_hora), 0) as total_incentivos
      FROM ot_turnos t
      INNER JOIN ot_puestos p ON t.puesto_id = p.id
      INNER JOIN ot_ubicaciones u ON p.ubicacion_id = u.id
      INNER JOIN ot_clientes c ON u.cliente_id = c.id
      LEFT JOIN ot_incentivos_puesto ip ON p.id = ip.puesto_id
        AND t.fecha BETWEEN ip.fecha_inicio AND ip.fecha_fin
      WHERE ${whereClause}
      GROUP BY t.puesto_id, p.codigo, p.nombre, u.nombre, c.nombre
      ORDER BY total_turnos DESC
      LIMIT ? OFFSET ?
    `;

    const dataParams = [...queryParams, String(pageSize), String(offset)];
    const [dataRows] = await pool.execute<RowDataPacket[]>(dataQuery, dataParams);

    // PASO 4: Construir DTOs de respuesta
    const data: ResumenPuestoDTO[] = dataRows.map((row) => ({
      puesto_id: row.puesto_id,
      puesto_codigo: row.puesto_codigo,
      puesto_nombre: row.puesto_nombre,
      ubicacion_nombre: row.ubicacion_nombre,
      cliente_nombre: row.cliente_nombre,
      total_turnos: row.total_turnos,
      total_horas_normales: parseFloat(row.total_horas_normales),
      total_horas_extras: parseFloat(row.total_horas_extras),
      guardianes_distintos: row.guardianes_distintos,
      turnos_diurnos: row.turnos_diurnos,
      turnos_nocturnos: row.turnos_nocturnos,
      total_incentivos: parseFloat(row.total_incentivos),
    }));

    console.log(
      `[Reportes Service] ${data.length} puestos obtenidos (total: ${total}, página ${page})`
    );

    return {
      data,
      total,
      page,
      pageSize,
    };
  } catch (error: any) {
    console.error('[Reportes Service] Error al obtener resumen por puesto:', error);
    throw new Error(`Error al obtener resumen por puesto: ${error.message}`);
  }
}
