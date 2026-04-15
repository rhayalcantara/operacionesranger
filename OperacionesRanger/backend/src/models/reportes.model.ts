/**
 * Modelos para el sistema de reportes y su historial
 * T2.25 - Implementar historial de reportes generados
 */

/**
 * Registro de reporte generado en historial
 */
export interface ReporteGenerado {
  id: number;
  user_id: number;
  fecha_inicio: string;
  fecha_fin: string;
  cantidad_turnos: number;
  fecha_generacion: Date;
  nomina_id: number | null;
  nombre_archivo: string;
}

/**
 * Reporte generado con información de usuario (JOIN)
 */
export interface ReporteGeneradoConUsuario extends ReporteGenerado {
  usuario_nombre: string;
}

/**
 * Datos para crear nuevo registro de reporte
 */
export interface CrearReporteGenerado {
  user_id: number;
  fecha_inicio: string;
  fecha_fin: string;
  cantidad_turnos: number;
  nombre_archivo: string;
}

/**
 * Fila de reporte CSV para nómina
 */
export interface ReporteNominaRow {
  fecha: string | Date;
  empleado_id: number;
  puesto_codigo: string;
  horas_normales: number;
  horas_extras: number;
  tipo_turno: 'DIURNO' | 'NOCTURNO';
  es_feriado: 'SI' | 'NO';
  tipo_feriado: 'NACIONAL' | 'DECRETO' | 'N/A';
  incentivo: number;
}

/**
 * Respuesta paginada de historial de reportes
 */
export interface HistorialReportesResponse {
  data: ReporteGeneradoConUsuario[];
  total: number;
  page: number;
  pageSize: number;
}
