/**
 * Controladores HTTP: Reportes
 *
 * Controladores para manejar peticiones HTTP de endpoints de reportes.
 * Validan inputs, llaman a servicios, y formatean respuestas.
 *
 * @module controllers/reportes.controller
 */

import { Request, Response } from 'express';
import * as ReportesService from '../services/reportes.service';
import { RangoFechasInvalidoError } from '../services/reportes.service';
import { ZodError } from 'zod';

/**
 * POST /api/reportes/nomina
 *
 * Generar reporte CSV para nómina
 *
 * **Body**:
 * ```json
 * {
 *   "fecha_inicio": "2026-01-01",
 *   "fecha_fin": "2026-01-15"
 * }
 * ```
 *
 * **Response**:
 * - Headers:
 *   - Content-Type: text/csv; charset=utf-8
 *   - Content-Disposition: attachment; filename="nomina_20260101_20260115.csv"
 * - Body: CSV file (string)
 *
 * **Respuestas HTTP**:
 * - 200 OK: CSV generado exitosamente
 * - 400 Bad Request: rango de fechas inválido
 * - 401 Unauthorized: sin autenticación
 * - 403 Forbidden: usuario no tiene permiso (solo ADMIN y SUPERVISOR)
 * - 500 Internal Server Error: error del servidor
 *
 * **Formato CSV**:
 * ```csv
 * fecha,empleado_id,puesto_codigo,horas_normales,horas_extras,tipo_turno,es_feriado,tipo_feriado,incentivo
 * 2026-01-02,1001,P001,10.00,2.00,DIURNO,NO,N/A,120.00
 * 2026-01-03,1001,P001,10.00,0.00,NOCTURNO,NO,N/A,100.00
 * ```
 *
 * @example
 * ```bash
 * curl -X POST http://localhost:3333/api/reportes/nomina \
 *   -H "Authorization: Bearer <token>" \
 *   -H "Content-Type: application/json" \
 *   -d '{"fecha_inicio":"2026-01-01","fecha_fin":"2026-01-15"}' \
 *   --output nomina_20260101_20260115.csv
 * ```
 */
export async function generarReporteNominaController(
  req: Request,
  res: Response
): Promise<void> {
  try {
    // Los datos ya están validados por validationMiddleware
    const { fecha_inicio, fecha_fin } = req.body;

    console.log(
      `[Reportes Controller] Generando reporte para ${fecha_inicio} - ${fecha_fin}`
    );

    // PASO 1: Obtener user_id del usuario autenticado
    const user_id = req.user!.sub;  // req.user está disponible por authMiddleware

    // PASO 2: Llamar al servicio para generar CSV (incluye conteo y guardado en historial)
    const csv = await ReportesService.generarReporteNomina(
      fecha_inicio,
      fecha_fin,
      user_id
    );

    // PASO 3: Construir nombre de archivo
    const filename = ReportesService.getFilename(fecha_inicio, fecha_fin);

    console.log(
      `[Reportes Controller] CSV generado exitosamente. Archivo: ${filename}`
    );

    // PASO 4: Set headers HTTP para descarga de archivo CSV
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

    // PASO 5: Enviar CSV como respuesta
    res.status(200).send(csv);
  } catch (error: any) {
    // Error de validación Zod (no debería llegar aquí si middleware funciona)
    if (error instanceof ZodError) {
      res.status(400).json({
        error: 'Datos inválidos',
        details: error.issues,
      });
      return;
    }

    // Error de rango de fechas inválido
    if (error instanceof RangoFechasInvalidoError) {
      console.warn('[Reportes Controller] Rango de fechas inválido:', error.message);
      res.status(400).json({
        error: 'Rango de fechas inválido',
        message: error.message,
      });
      return;
    }

    // Error genérico del servicio
    console.error('[Reportes Controller] Error al generar reporte:', error);
    res.status(500).json({
      error: 'Error interno del servidor',
      message: 'Error al generar reporte de nómina',
    });
  }
}

/**
 * POST /api/reportes/marcar-procesados
 *
 * Marcar turnos como procesados para nómina
 *
 * Este endpoint se ejecuta DESPUÉS de que el archivo CSV generado por
 * /api/reportes/nomina ha sido importado exitosamente en el sistema de nómina.
 * Marca los turnos como procesados para evitar duplicación en futuros reportes
 * y mantiene trazabilidad mediante el campo nomina_id.
 *
 * **Body**:
 * ```json
 * {
 *   "fecha_inicio": "2026-01-01",
 *   "fecha_fin": "2026-01-15",
 *   "nomina_id": 125
 * }
 * ```
 *
 * **Response**:
 * ```json
 * {
 *   "turnos_procesados": 45,
 *   "nomina_id": 125,
 *   "fecha_inicio": "2026-01-01",
 *   "fecha_fin": "2026-01-15"
 * }
 * ```
 *
 * **Respuestas HTTP**:
 * - 200 OK: Turnos marcados exitosamente (puede ser 0 turnos si no hay en rango)
 * - 400 Bad Request: Datos inválidos (fechas o nomina_id)
 * - 401 Unauthorized: Sin autenticación
 * - 403 Forbidden: Usuario no es ADMIN
 * - 500 Internal Server Error: Error del servidor
 *
 * **Permisos**: Solo ADMIN
 *
 * **Inmutabilidad**: Turnos ya procesados (procesado_nomina = TRUE) NO se modifican.
 *
 * @example
 * ```bash
 * curl -X POST http://localhost:3000/api/reportes/marcar-procesados \
 *   -H "Authorization: Bearer <token>" \
 *   -H "Content-Type: application/json" \
 *   -d '{"fecha_inicio":"2026-01-01","fecha_fin":"2026-01-15","nomina_id":125}'
 * ```
 */
export async function marcarProcesadosController(
  req: Request,
  res: Response
): Promise<void> {
  try {
    // Los datos ya están validados por validationMiddleware
    const { fecha_inicio, fecha_fin, nomina_id } = req.body;

    console.log(
      `[Reportes Controller] Marcando turnos como procesados: ${fecha_inicio} - ${fecha_fin}, nómina ${nomina_id}`
    );

    // PASO 1: Llamar al servicio para marcar turnos como procesados
    const result = await ReportesService.marcarTurnosProcesados(
      fecha_inicio,
      fecha_fin,
      nomina_id
    );

    console.log(
      `[Reportes Controller] ${result.turnos_procesados} turnos marcados exitosamente para nómina ${nomina_id}`
    );

    // PASO 2: Actualizar nomina_id en historial
    try {
      const registrosActualizados = await ReportesService.actualizarNominaIdHistorial(
        fecha_inicio,
        fecha_fin,
        nomina_id
      );

      console.log(
        `[Reportes Controller] ${registrosActualizados} registro(s) de historial actualizado(s) con nomina_id ${nomina_id}`
      );
    } catch (historialError: any) {
      // Log error pero NO fallar la operación principal
      console.error('[Reportes Controller] Error al actualizar historial (no crítico):', historialError);
    }

    // PASO 3: Retornar resultado JSON
    res.status(200).json(result);
  } catch (error: any) {
    console.error('[Reportes Controller] Error al marcar turnos como procesados:', error);
    res.status(500).json({
      error: 'Error interno del servidor',
      message: 'Error al marcar turnos como procesados',
    });
  }
}

/**
 * GET /api/reportes/nomina/vista-previa
 *
 * Obtener vista previa de turnos no procesados para nómina
 *
 * **Query params**:
 * - fecha_inicio (requerido): YYYY-MM-DD
 * - fecha_fin (requerido): YYYY-MM-DD
 *
 * **Response 200**:
 * ```json
 * {
 *   "data": [...],
 *   "total": 120,
 *   "resumen": { ... }
 * }
 * ```
 */
export async function getVistaPreviaNominaController(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const { fecha_inicio, fecha_fin } = req.query as {
      fecha_inicio: string;
      fecha_fin: string;
    };

    console.log(
      `[Reportes Controller] Obteniendo vista previa de nómina: ${fecha_inicio} - ${fecha_fin}`
    );

    const resultado = await ReportesService.getVistaPrevia(fecha_inicio, fecha_fin);

    console.log(
      `[Reportes Controller] Vista previa obtenida: ${resultado.data.length} registros (total: ${resultado.total})`
    );

    res.status(200).json(resultado);
  } catch (error: any) {
    if (error instanceof ReportesService.RangoFechasInvalidoError) {
      console.warn('[Reportes Controller] Rango de fechas inválido:', error.message);
      res.status(400).json({
        error: 'Rango de fechas inválido',
        message: error.message,
      });
      return;
    }

    console.error('[Reportes Controller] Error al obtener vista previa:', error);
    res.status(500).json({
      error: 'Error interno del servidor',
      message: 'Error al obtener vista previa de nómina',
    });
  }
}

// ============================================================================
// CONTROLADORES: REPORTES DE RESUMEN (JSON)
// ============================================================================

/**
 * GET /api/reportes/resumen-quincena
 *
 * Obtener resumen estadístico de quincena/período
 *
 * Retorna estadísticas agregadas de todos los turnos en el rango de fechas:
 * - Total de turnos, horas normales, horas extras
 * - Cantidad de guardianes distintos
 * - Distribución por tipo de turno (DIURNO/NOCTURNO)
 * - Turnos en días feriados
 * - Total de incentivos generados
 *
 * **Query params**:
 * - fecha_inicio (requerido): YYYY-MM-DD
 * - fecha_fin (requerido): YYYY-MM-DD
 *
 * **Response 200**:
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
 *
 * **Respuestas HTTP**:
 * - 200 OK: Resumen generado exitosamente
 * - 400 Bad Request: Rango de fechas inválido (> 93 días o fecha_inicio > fecha_fin)
 * - 401 Unauthorized: Sin autenticación
 * - 403 Forbidden: Sin permisos (requiere autenticación)
 * - 500 Internal Server Error: Error del servidor
 *
 * **Permisos**: ADMIN, SUPERVISOR, CONSULTA (todos los usuarios autenticados)
 *
 * @example
 * ```bash
 * curl -X GET "http://localhost:3000/api/reportes/resumen-quincena?fecha_inicio=2026-01-01&fecha_fin=2026-01-15" \
 *   -H "Authorization: Bearer <token>"
 * ```
 */
export async function getResumenQuincenaController(
  req: Request,
  res: Response
): Promise<void> {
  try {
    // Los datos ya están validados por validationMiddleware
    const { fecha_inicio, fecha_fin } = req.query as {
      fecha_inicio: string;
      fecha_fin: string;
    };

    console.log(
      `[Reportes Controller] Obteniendo resumen de quincena: ${fecha_inicio} - ${fecha_fin}`
    );

    // Llamar al servicio para obtener resumen
    const resumen = await ReportesService.getResumenQuincena(fecha_inicio, fecha_fin);

    console.log(
      `[Reportes Controller] Resumen obtenido: ${resumen.total_turnos} turnos, ${resumen.total_guardianes} guardianes`
    );

    // Retornar JSON 200
    res.status(200).json(resumen);
  } catch (error: any) {
    // Error de rango de fechas inválido
    if (error instanceof ReportesService.RangoFechasInvalidoError) {
      console.warn('[Reportes Controller] Rango de fechas inválido:', error.message);
      res.status(400).json({
        error: 'Rango de fechas inválido',
        message: error.message,
      });
      return;
    }

    // Error genérico del servicio
    console.error('[Reportes Controller] Error al obtener resumen de quincena:', error);
    res.status(500).json({
      error: 'Error interno del servidor',
      message: 'Error al obtener resumen de quincena',
    });
  }
}

/**
 * GET /api/reportes/resumen-por-guardian
 *
 * Obtener resumen estadístico por guardián
 *
 * Retorna estadísticas de turnos agrupadas por empleado (guardián).
 * Incluye filtros opcionales y paginación.
 *
 * **Query params**:
 * - fecha_inicio (requerido): YYYY-MM-DD
 * - fecha_fin (requerido): YYYY-MM-DD
 * - empleado_id (opcional): ID del empleado para filtrar
 * - page (opcional): Número de página (default: 1)
 * - pageSize (opcional): Registros por página (default: 10, max: 100)
 *
 * **Response 200**:
 * ```json
 * {
 *   "data": [
 *     {
 *       "empleado_id": 1001,
 *       "nombre_empleado": "Juan Pérez",
 *       "cedula": "001-1234567-8",
 *       "total_turnos": 15,
 *       "total_horas_normales": 150.0,
 *       "total_horas_extras": 30.0,
 *       "turnos_diurnos": 10,
 *       "turnos_nocturnos": 5,
 *       "turnos_feriados": 2,
 *       "total_incentivos": 1800.00
 *     }
 *   ],
 *   "total": 30,
 *   "page": 1,
 *   "pageSize": 10
 * }
 * ```
 *
 * **Respuestas HTTP**:
 * - 200 OK: Resumen obtenido exitosamente (puede retornar array vacío)
 * - 400 Bad Request: Parámetros inválidos
 * - 401 Unauthorized: Sin autenticación
 * - 500 Internal Server Error: Error del servidor
 *
 * **Permisos**: ADMIN, SUPERVISOR, CONSULTA
 *
 * @example
 * ```bash
 * # Todos los guardianes (paginado)
 * curl -X GET "http://localhost:3000/api/reportes/resumen-por-guardian?fecha_inicio=2026-01-01&fecha_fin=2026-01-15&page=1&pageSize=10" \
 *   -H "Authorization: Bearer <token>"
 *
 * # Un guardián específico
 * curl -X GET "http://localhost:3000/api/reportes/resumen-por-guardian?fecha_inicio=2026-01-01&fecha_fin=2026-01-15&empleado_id=1001" \
 *   -H "Authorization: Bearer <token>"
 * ```
 */
export async function getResumenPorGuardianController(
  req: Request,
  res: Response
): Promise<void> {
  try {
    // Los datos ya están validados por validationMiddleware
    const { fecha_inicio, fecha_fin, empleado_id, page, pageSize } = req.query as {
      fecha_inicio: string;
      fecha_fin: string;
      empleado_id?: string;
      page?: string;
      pageSize?: string;
    };

    console.log(
      `[Reportes Controller] Obteniendo resumen por guardián: ${fecha_inicio} - ${fecha_fin}, empleado_id: ${empleado_id || 'todos'}`
    );

    // Construir filtros
    const filtros = {
      fecha_inicio,
      fecha_fin,
      empleado_id: empleado_id ? parseInt(empleado_id, 10) : undefined,
    };

    // Construir paginación (defaults manejados por schema Zod)
    const paginacion = {
      page: page ? parseInt(page, 10) : 1,
      pageSize: pageSize ? parseInt(pageSize, 10) : 10,
    };

    // Llamar al servicio
    const resultado = await ReportesService.getResumenPorGuardian(filtros, paginacion);

    console.log(
      `[Reportes Controller] ${resultado.data.length} guardianes obtenidos (total: ${resultado.total})`
    );

    // Retornar JSON 200
    res.status(200).json(resultado);
  } catch (error: any) {
    // Error de rango de fechas inválido
    if (error instanceof ReportesService.RangoFechasInvalidoError) {
      console.warn('[Reportes Controller] Rango de fechas inválido:', error.message);
      res.status(400).json({
        error: 'Rango de fechas inválido',
        message: error.message,
      });
      return;
    }

    // Error genérico del servicio
    console.error('[Reportes Controller] Error al obtener resumen por guardián:', error);
    res.status(500).json({
      error: 'Error interno del servidor',
      message: 'Error al obtener resumen por guardián',
    });
  }
}

/**
 * GET /api/reportes/resumen-por-puesto
 *
 * Obtener resumen estadístico por puesto
 *
 * Retorna estadísticas de turnos agrupadas por puesto de trabajo.
 * Incluye filtros opcionales (puesto, ubicación, cliente) y paginación.
 *
 * **Query params**:
 * - fecha_inicio (requerido): YYYY-MM-DD
 * - fecha_fin (requerido): YYYY-MM-DD
 * - puesto_id (opcional): ID del puesto para filtrar
 * - ubicacion_id (opcional): ID de ubicación para filtrar
 * - cliente_id (opcional): ID de cliente para filtrar
 * - page (opcional): Número de página (default: 1)
 * - pageSize (opcional): Registros por página (default: 10, max: 100)
 *
 * **Response 200**:
 * ```json
 * {
 *   "data": [
 *     {
 *       "puesto_id": 42,
 *       "puesto_codigo": "P001",
 *       "puesto_nombre": "Entrada Principal",
 *       "ubicacion_nombre": "Sucursal Centro",
 *       "cliente_nombre": "Banco Popular",
 *       "total_turnos": 30,
 *       "total_horas_normales": 300.0,
 *       "total_horas_extras": 60.0,
 *       "guardianes_distintos": 5,
 *       "turnos_diurnos": 20,
 *       "turnos_nocturnos": 10,
 *       "total_incentivos": 3600.00
 *     }
 *   ],
 *   "total": 15,
 *   "page": 1,
 *   "pageSize": 10
 * }
 * ```
 *
 * **Respuestas HTTP**:
 * - 200 OK: Resumen obtenido exitosamente (puede retornar array vacío)
 * - 400 Bad Request: Parámetros inválidos
 * - 401 Unauthorized: Sin autenticación
 * - 500 Internal Server Error: Error del servidor
 *
 * **Permisos**: ADMIN, SUPERVISOR, CONSULTA
 *
 * @example
 * ```bash
 * # Todos los puestos (paginado)
 * curl -X GET "http://localhost:3000/api/reportes/resumen-por-puesto?fecha_inicio=2026-01-01&fecha_fin=2026-01-15&page=1&pageSize=10" \
 *   -H "Authorization: Bearer <token>"
 *
 * # Filtrar por cliente
 * curl -X GET "http://localhost:3000/api/reportes/resumen-por-puesto?fecha_inicio=2026-01-01&fecha_fin=2026-01-15&cliente_id=5" \
 *   -H "Authorization: Bearer <token>"
 * ```
 */
export async function getResumenPorPuestoController(
  req: Request,
  res: Response
): Promise<void> {
  try {
    // Los datos ya están validados por validationMiddleware
    const {
      fecha_inicio,
      fecha_fin,
      puesto_id,
      ubicacion_id,
      cliente_id,
      page,
      pageSize,
    } = req.query as {
      fecha_inicio: string;
      fecha_fin: string;
      puesto_id?: string;
      ubicacion_id?: string;
      cliente_id?: string;
      page?: string;
      pageSize?: string;
    };

    console.log(
      `[Reportes Controller] Obteniendo resumen por puesto: ${fecha_inicio} - ${fecha_fin}`
    );

    // Construir filtros
    const filtros = {
      fecha_inicio,
      fecha_fin,
      puesto_id: puesto_id ? parseInt(puesto_id, 10) : undefined,
      ubicacion_id: ubicacion_id ? parseInt(ubicacion_id, 10) : undefined,
      cliente_id: cliente_id ? parseInt(cliente_id, 10) : undefined,
    };

    // Construir paginación
    const paginacion = {
      page: page ? parseInt(page, 10) : 1,
      pageSize: pageSize ? parseInt(pageSize, 10) : 10,
    };

    // Llamar al servicio
    const resultado = await ReportesService.getResumenPorPuesto(filtros, paginacion);

    console.log(
      `[Reportes Controller] ${resultado.data.length} puestos obtenidos (total: ${resultado.total})`
    );

    // Retornar JSON 200
    res.status(200).json(resultado);
  } catch (error: any) {
    // Error de rango de fechas inválido
    if (error instanceof ReportesService.RangoFechasInvalidoError) {
      console.warn('[Reportes Controller] Rango de fechas inválido:', error.message);
      res.status(400).json({
        error: 'Rango de fechas inválido',
        message: error.message,
      });
      return;
    }

    // Error genérico del servicio
    console.error('[Reportes Controller] Error al obtener resumen por puesto:', error);
    res.status(500).json({
      error: 'Error interno del servidor',
      message: 'Error al obtener resumen por puesto',
    });
  }
}

// ============================================================================
// CONTROLADORES: HISTORIAL DE REPORTES (T2.25)
// ============================================================================

/**
 * GET /api/reportes/historial
 *
 * Obtener historial paginado de reportes CSV generados
 *
 * Retorna lista de todos los reportes CSV que se han generado,
 * con información del usuario que los generó y si fueron procesados.
 *
 * **Query params**:
 * - page (opcional): Número de página (default: 1)
 * - pageSize (opcional): Registros por página (default: 10, max: 100)
 *
 * **Response 200**:
 * ```json
 * {
 *   "data": [
 *     {
 *       "id": 5,
 *       "usuario": {
 *         "id": 1,
 *         "username": "admin",
 *         "nombre_completo": "Administrador del Sistema"
 *       },
 *       "fecha_inicio": "2026-01-01",
 *       "fecha_fin": "2026-01-15",
 *       "cantidad_turnos": 45,
 *       "fecha_generacion": "2026-01-18T14:30:00.000Z",
 *       "nomina_id": 125,
 *       "nombre_archivo": "nomina_20260101_20260115.csv"
 *     }
 *   ],
 *   "total": 50,
 *   "page": 1,
 *   "pageSize": 10,
 *   "totalPages": 5
 * }
 * ```
 *
 * **Respuestas HTTP**:
 * - 200 OK: Historial obtenido exitosamente (puede retornar array vacío)
 * - 400 Bad Request: Parámetros inválidos
 * - 401 Unauthorized: Sin autenticación
 * - 500 Internal Server Error: Error del servidor
 *
 * **Permisos**: ADMIN, SUPERVISOR, CONSULTA (todos los usuarios autenticados)
 *
 * @example
 * ```bash
 * curl -X GET "http://localhost:3000/api/reportes/historial?page=1&pageSize=10" \
 *   -H "Authorization: Bearer <token>"
 * ```
 */
export async function getHistorialReportesController(
  req: Request,
  res: Response
): Promise<void> {
  try {
    // Los datos ya están validados por validationMiddleware
    const { page, pageSize } = req.query as {
      page?: string;
      pageSize?: string;
    };

    const pageNum = page ? parseInt(page, 10) : 1;
    const pageSizeNum = pageSize ? parseInt(pageSize, 10) : 10;

    console.log(
      `[Reportes Controller] Obteniendo historial de reportes (página ${pageNum}, ${pageSizeNum} registros)`
    );

    // Llamar al servicio
    const resultado = await ReportesService.getHistorialReportes(pageNum, pageSizeNum);

    console.log(
      `[Reportes Controller] ${resultado.data.length} reportes obtenidos (total: ${resultado.total}, páginas: ${resultado.totalPages})`
    );

    // Retornar JSON 200
    res.status(200).json(resultado);
  } catch (error: any) {
    console.error('[Reportes Controller] Error al obtener historial de reportes:', error);
    res.status(500).json({
      error: 'Error interno del servidor',
      message: 'Error al obtener historial de reportes',
    });
  }
}

/**
 * GET /api/reportes/:id/descargar
 *
 * Regenerar y descargar un reporte histórico
 *
 * Obtiene un reporte del historial por su ID y regenera el CSV
 * con los mismos parámetros (fecha_inicio, fecha_fin) usados originalmente.
 *
 * **IMPORTANTE**: El CSV regenerado contiene los datos ACTUALES de la base
 * de datos para ese rango de fechas, no los datos del momento original.
 * Esto es útil si los turnos fueron modificados y se necesita un reporte actualizado.
 *
 * **Params**:
 * - id (requerido): ID del reporte en el historial (número entero positivo)
 *
 * **Response 200**:
 * - Headers:
 *   - Content-Type: text/csv; charset=utf-8
 *   - Content-Disposition: attachment; filename="nomina_20260101_20260115.csv"
 * - Body: CSV file (string)
 *
 * **Respuestas HTTP**:
 * - 200 OK: CSV regenerado exitosamente
 * - 404 Not Found: Reporte no encontrado en historial
 * - 401 Unauthorized: Sin autenticación
 * - 500 Internal Server Error: Error del servidor
 *
 * **Permisos**: ADMIN, SUPERVISOR, CONSULTA (todos los usuarios autenticados)
 *
 * **Auditoría**: El user_id usado para regenerar el CSV es el del usuario ACTUAL,
 * no el del usuario que generó el reporte originalmente.
 *
 * @example
 * ```bash
 * curl -X GET http://localhost:3000/api/reportes/5/descargar \
 *   -H "Authorization: Bearer <token>" \
 *   --output reporte_regenerado.csv
 * ```
 */
export async function descargarReporteController(
  req: Request,
  res: Response
): Promise<void> {
  try {
    // Los datos ya están validados por validationMiddleware
    const id = parseInt(req.params.id, 10);
    const user_id = req.user!.sub;  // Usuario actual que descarga

    console.log(
      `[Reportes Controller] Descargando reporte ID ${id} por user_id ${user_id}`
    );

    // PASO 1: Obtener registro del historial
    const reporte = await ReportesService.getHistorialReporteById(id);

    if (!reporte) {
      console.warn(`[Reportes Controller] Reporte ID ${id} no encontrado en historial`);
      res.status(404).json({
        error: 'Reporte no encontrado',
        message: `No existe un reporte con ID ${id} en el historial`,
      });
      return;
    }

    console.log(
      `[Reportes Controller] Reporte encontrado: ${reporte.nombre_archivo} (${reporte.fecha_inicio} - ${reporte.fecha_fin})`
    );

    // PASO 2: Regenerar CSV con los mismos parámetros
    // NOTA: user_id es el del usuario ACTUAL (para auditoría), no el original
    const csv = await ReportesService.generarReporteNomina(
      reporte.fecha_inicio,
      reporte.fecha_fin,
      user_id
    );

    console.log(
      `[Reportes Controller] CSV regenerado exitosamente (${csv.length} caracteres)`
    );

    // PASO 3: Set headers HTTP para descarga de archivo CSV
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${reporte.nombre_archivo}"`);

    // PASO 4: Enviar CSV como respuesta
    res.status(200).send(csv);
  } catch (error: any) {
    // Error de rango de fechas inválido (poco probable en re-descarga)
    if (error instanceof RangoFechasInvalidoError) {
      console.warn('[Reportes Controller] Rango de fechas inválido al regenerar:', error.message);
      res.status(400).json({
        error: 'Rango de fechas inválido',
        message: error.message,
      });
      return;
    }

    // Error genérico del servicio
    console.error('[Reportes Controller] Error al descargar reporte:', error);
    res.status(500).json({
      error: 'Error interno del servidor',
      message: 'Error al regenerar y descargar reporte',
    });
  }
}
