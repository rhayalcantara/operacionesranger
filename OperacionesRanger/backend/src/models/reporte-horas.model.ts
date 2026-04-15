/**
 * Modelos de Reporte de Horas Trabajadas
 * Sistema de Gestion de Turnos - OperacionesRanger
 *
 * Define las interfaces TypeScript para el reporte pivot de horas trabajadas,
 * generado a partir de datos de diario_puesto. Soporta agrupacion por empleado
 * o por puesto, con desglose diario de horas.
 *
 * @module models/reporte-horas.model
 */

// ============================================================================
// INTERFACES DE FILTROS
// ============================================================================

/**
 * Filtros para generar el reporte de horas trabajadas
 *
 * @property fecha_inicio - Fecha de inicio del rango (YYYY-MM-DD)
 * @property fecha_fin - Fecha de fin del rango (YYYY-MM-DD)
 * @property tipo - Tipo de agrupacion: por empleado o por puesto
 * @property empleado_id - Filtrar por empleado especifico (opcional)
 * @property puesto_id - Filtrar por puesto especifico (opcional)
 */
export interface ReporteHorasFilters {
  fecha_inicio: string;
  fecha_fin: string;
  tipo: 'empleado' | 'puesto';
  empleado_id?: number;
  puesto_id?: number;
}

// ============================================================================
// INTERFACES DE RESULTADO
// ============================================================================

/**
 * Una fila del reporte pivot de horas trabajadas
 *
 * Representa un empleado o puesto con sus horas desglosadas por dia.
 *
 * @property id - ID del empleado o puesto segun el tipo de agrupacion
 * @property nombre - Nombre del empleado o puesto
 * @property codigo - Cedula del empleado o codigo del puesto (opcional)
 * @property total_horas - Total de horas trabajadas en el rango
 * @property total_dias - Total de dias con horas registradas
 * @property dias - Mapa de fecha (YYYY-MM-DD) a horas trabajadas ese dia
 */
export interface ReporteHorasRow {
  id: number;
  nombre: string;
  codigo?: string;
  total_horas: number;
  total_dias: number;
  dias: { [fecha: string]: number };
}

/**
 * Resultado completo del reporte de horas trabajadas
 *
 * Contiene la estructura pivot lista para renderizar en una tabla
 * donde las columnas son las fechas y las filas son empleados o puestos.
 *
 * @property tipo - Tipo de agrupacion utilizado
 * @property fecha_inicio - Fecha de inicio del rango consultado
 * @property fecha_fin - Fecha de fin del rango consultado
 * @property fechas - Lista ordenada de todas las fechas en el rango
 * @property filas - Filas del reporte (una por empleado o puesto)
 * @property total_registros - Cantidad total de filas
 */
export interface ReporteHorasResult {
  tipo: 'empleado' | 'puesto';
  fecha_inicio: string;
  fecha_fin: string;
  fechas: string[];
  filas: ReporteHorasRow[];
  total_registros: number;
}
