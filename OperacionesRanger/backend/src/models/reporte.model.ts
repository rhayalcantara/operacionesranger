/**
 * Modelos TypeScript: Reportes
 *
 * Define interfaces TypeScript para DTOs (Data Transfer Objects)
 * de reportes de resumen.
 *
 * @module models/reporte.model
 */

// ============================================================================
// REPORTES DE RESUMEN
// ============================================================================

/**
 * DTO para resumen de quincena
 *
 * Estadísticas agregadas de turnos en un período específico.
 * Endpoint: GET /api/reportes/resumen-quincena
 *
 * @example
 * ```json
 * {
 *   "fecha_inicio": "2026-01-01",
 *   "fecha_fin": "2026-01-15",
 *   "total_turnos": 450,
 *   "total_horas_normales": 4500.0,
 *   "total_horas_extras": 900.0,
 *   "total_guardianes": 30,
 *   "turnos_por_tipo": {
 *     "DIURNO": 300,
 *     "NOCTURNO": 150
 *   },
 *   "turnos_feriados": 25,
 *   "total_incentivos": 54000.00
 * }
 * ```
 */
export interface ResumenQuincenaDTO {
  /** Fecha de inicio del período (YYYY-MM-DD) */
  fecha_inicio: string;

  /** Fecha de fin del período (YYYY-MM-DD) */
  fecha_fin: string;

  /** Total de turnos registrados en el período */
  total_turnos: number;

  /** Total de horas normales (suma de todos los turnos) */
  total_horas_normales: number;

  /** Total de horas extras (suma de todos los turnos) */
  total_horas_extras: number;

  /** Cantidad de guardianes distintos que trabajaron */
  total_guardianes: number;

  /** Distribución de turnos por tipo (DIURNO/NOCTURNO) */
  turnos_por_tipo: {
    /** Cantidad de turnos diurnos */
    DIURNO: number;

    /** Cantidad de turnos nocturnos */
    NOCTURNO: number;
  };

  /** Cantidad de turnos en días feriados */
  turnos_feriados: number;

  /** Total de incentivos generados (suma de todos los incentivos) */
  total_incentivos: number;
}

/**
 * DTO para resumen por guardián
 *
 * Estadísticas agregadas de turnos por guardián (empleado).
 * Endpoint: GET /api/reportes/resumen-por-guardian
 *
 * @example
 * ```json
 * {
 *   "empleado_id": 1001,
 *   "nombre_empleado": "Juan Pérez",
 *   "cedula": "001-1234567-8",
 *   "total_turnos": 15,
 *   "total_horas_normales": 150.0,
 *   "total_horas_extras": 30.0,
 *   "turnos_diurnos": 10,
 *   "turnos_nocturnos": 5,
 *   "turnos_feriados": 2,
 *   "total_incentivos": 1800.00
 * }
 * ```
 */
export interface ResumenGuardianDTO {
  /** ID del empleado (FK a rh_empleado) */
  empleado_id: number;

  /** Nombre completo del empleado */
  nombre_empleado: string;

  /** Cédula del empleado */
  cedula: string;

  /** Total de turnos trabajados por el empleado */
  total_turnos: number;

  /** Total de horas normales del empleado */
  total_horas_normales: number;

  /** Total de horas extras del empleado */
  total_horas_extras: number;

  /** Cantidad de turnos diurnos del empleado */
  turnos_diurnos: number;

  /** Cantidad de turnos nocturnos del empleado */
  turnos_nocturnos: number;

  /** Cantidad de turnos en feriados del empleado */
  turnos_feriados: number;

  /** Total de incentivos generados por el empleado */
  total_incentivos: number;
}

/**
 * DTO para resumen por puesto
 *
 * Estadísticas agregadas de turnos por puesto de trabajo.
 * Endpoint: GET /api/reportes/resumen-por-puesto
 *
 * @example
 * ```json
 * {
 *   "puesto_id": 42,
 *   "puesto_codigo": "P001",
 *   "puesto_nombre": "Entrada Principal",
 *   "ubicacion_nombre": "Sucursal Centro",
 *   "cliente_nombre": "Banco Popular",
 *   "total_turnos": 30,
 *   "total_horas_normales": 300.0,
 *   "total_horas_extras": 60.0,
 *   "guardianes_distintos": 5,
 *   "turnos_diurnos": 20,
 *   "turnos_nocturnos": 10,
 *   "total_incentivos": 3600.00
 * }
 * ```
 */
export interface ResumenPuestoDTO {
  /** ID del puesto */
  puesto_id: number;

  /** Código único del puesto */
  puesto_codigo: string;

  /** Nombre descriptivo del puesto */
  puesto_nombre: string;

  /** Nombre de la ubicación donde está el puesto */
  ubicacion_nombre: string;

  /** Nombre del cliente dueño de la ubicación */
  cliente_nombre: string;

  /** Total de turnos en este puesto */
  total_turnos: number;

  /** Total de horas normales en este puesto */
  total_horas_normales: number;

  /** Total de horas extras en este puesto */
  total_horas_extras: number;

  /** Cantidad de guardianes distintos que trabajaron en este puesto */
  guardianes_distintos: number;

  /** Cantidad de turnos diurnos en este puesto */
  turnos_diurnos: number;

  /** Cantidad de turnos nocturnos en este puesto */
  turnos_nocturnos: number;

  /** Total de incentivos generados en este puesto */
  total_incentivos: number;
}

/**
 * Response paginado genérico para reportes de resumen
 *
 * Usado por endpoints que retornan múltiples registros con paginación.
 *
 * @template T Tipo de datos en el array (ResumenGuardianDTO o ResumenPuestoDTO)
 *
 * @example
 * ```json
 * {
 *   "data": [{ ... }, { ... }],
 *   "total": 30,
 *   "page": 1,
 *   "pageSize": 10
 * }
 * ```
 */
export interface PaginatedResumenResponse<T> {
  /** Array de datos del resumen */
  data: T[];

  /** Total de registros disponibles (sin paginación) */
  total: number;

  /** Número de página actual (base 1) */
  page: number;

  /** Cantidad de registros por página */
  pageSize: number;
}

// ============================================================================
// TIPOS AUXILIARES
// ============================================================================

/**
 * Filtros opcionales para resumen por guardián
 */
export interface ResumenGuardianFiltros {
  /** Fecha de inicio del período (YYYY-MM-DD) */
  fecha_inicio: string;

  /** Fecha de fin del período (YYYY-MM-DD) */
  fecha_fin: string;

  /** ID del empleado (opcional, filtra por un guardián específico) */
  empleado_id?: number;
}

/**
 * Filtros opcionales para resumen por puesto
 */
export interface ResumenPuestoFiltros {
  /** Fecha de inicio del período (YYYY-MM-DD) */
  fecha_inicio: string;

  /** Fecha de fin del período (YYYY-MM-DD) */
  fecha_fin: string;

  /** ID del puesto (opcional, filtra por un puesto específico) */
  puesto_id?: number;

  /** ID de ubicación (opcional, filtra por ubicación) */
  ubicacion_id?: number;

  /** ID de cliente (opcional, filtra por cliente) */
  cliente_id?: number;
}

/**
 * Opciones de paginación
 */
export interface PaginacionOpciones {
  /** Número de página (base 1, default: 1) */
  page: number;

  /** Registros por página (default: 10, max: 100) */
  pageSize: number;
}

// ============================================================================
// HISTORIAL DE REPORTES CSV GENERADOS
// ============================================================================

/**
 * Historial de Reporte (tabla: sys_reportes_generados)
 *
 * Representa un registro de un reporte CSV generado para nómina.
 * Mantiene trazabilidad de quién generó qué reporte y cuándo.
 */
export interface HistorialReporte {
  /** ID único del registro de historial */
  id: number;

  /** ID del usuario que generó el reporte (FK a sys_usuarios) */
  user_id: number;

  /** Fecha de inicio del rango del reporte (YYYY-MM-DD) */
  fecha_inicio: string;

  /** Fecha de fin del rango del reporte (YYYY-MM-DD) */
  fecha_fin: string;

  /** Cantidad de turnos incluidos en el reporte generado */
  cantidad_turnos: number;

  /** Timestamp de cuando se generó el reporte */
  fecha_generacion: Date;

  /** ID de la nómina en el sistema externo (NULL hasta que se procese) */
  nomina_id: number | null;

  /** Nombre del archivo CSV generado (formato: nomina_YYYYMMDD_YYYYMMDD.csv) */
  nombre_archivo: string;
}

/**
 * DTO para crear historial de reporte
 *
 * Usado al guardar un nuevo registro de historial después de generar un CSV.
 */
export interface CreateHistorialReporteDTO {
  /** ID del usuario que generó el reporte */
  user_id: number;

  /** Fecha de inicio del rango (YYYY-MM-DD) */
  fecha_inicio: string;

  /** Fecha de fin del rango (YYYY-MM-DD) */
  fecha_fin: string;

  /** Cantidad de turnos incluidos en el reporte */
  cantidad_turnos: number;

  /** Nombre del archivo CSV generado */
  nombre_archivo: string;
}

/**
 * DTO para respuesta de historial con datos de usuario
 *
 * Incluye información del usuario que generó el reporte (JOIN con sys_usuarios).
 * Usado en GET /api/reportes/historial
 */
export interface HistorialReporteDTO {
  /** ID único del registro de historial */
  id: number;

  /** Información del usuario que generó el reporte */
  usuario: {
    /** ID del usuario */
    id: number;

    /** Nombre de usuario */
    username: string;

    /** Nombre completo del usuario */
    nombre_completo: string;
  };

  /** Fecha de inicio del rango (YYYY-MM-DD) */
  fecha_inicio: string;

  /** Fecha de fin del rango (YYYY-MM-DD) */
  fecha_fin: string;

  /** Cantidad de turnos incluidos en el reporte */
  cantidad_turnos: number;

  /** Timestamp de cuando se generó el reporte */
  fecha_generacion: Date;

  /** ID de la nómina en el sistema externo (NULL si no se ha procesado) */
  nomina_id: number | null;

  /** Nombre del archivo CSV generado */
  nombre_archivo: string;
}

/**
 * DTO para respuesta paginada de historial
 *
 * Usado en GET /api/reportes/historial con paginación.
 */
export interface PaginatedHistorialDTO {
  /** Array de registros de historial */
  data: HistorialReporteDTO[];

  /** Total de registros (sin paginación) */
  total: number;

  /** Página actual (1-indexed) */
  page: number;

  /** Tamaño de página */
  pageSize: number;

  /** Total de páginas */
  totalPages: number;
}

/**
 * Resultado de generación de reporte CSV
 *
 * Retornado por generarReporteNomina() en el servicio.
 */
export interface GenerarReporteResult {
  /** Contenido del CSV (string con BOM UTF-8) */
  csv: string;

  /** Cantidad de turnos incluidos en el reporte */
  cantidad_turnos: number;

  /** Nombre de archivo sugerido */
  nombre_archivo: string;
}

/**
 * Resultado de marcar turnos como procesados
 *
 * Retornado por marcarTurnosProcesados() en el servicio.
 */
export interface MarcarProcesadosResult {
  /** Cantidad de turnos marcados como procesados */
  turnos_procesados: number;

  /** ID de la nómina asignada */
  nomina_id: number;

  /** Fecha de inicio del rango */
  fecha_inicio: string;

  /** Fecha de fin del rango */
  fecha_fin: string;
}

// ============================================================================
// CONSTANTES - HISTORIAL
// ============================================================================

/**
 * Configuración de paginación para historial
 */
export const HISTORIAL_PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_PAGE_SIZE: 10,
  MAX_PAGE_SIZE: 100,
} as const;
