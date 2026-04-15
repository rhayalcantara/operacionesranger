/**
 * Controlador de Reporte de Horas Trabajadas
 * Sistema de Gestion de Turnos - OperacionesRanger
 *
 * Maneja las peticiones HTTP para generar reportes pivot de horas trabajadas
 * a partir de datos de diario_puesto.
 *
 * @module controllers/reporte-horas.controller
 */

import { Request, Response } from 'express';
import * as reporteHorasService from '../services/reporte-horas.service';
import { ReporteHorasFilters } from '../models/reporte-horas.model';

// ============================================================================
// CONTROLADORES
// ============================================================================

/**
 * GET /api/reportes/horas
 *
 * Generar reporte pivot de horas trabajadas
 *
 * Query params (validados por middleware):
 * - fecha_inicio: string YYYY-MM-DD (requerido)
 * - fecha_fin: string YYYY-MM-DD (requerido)
 * - tipo: 'empleado' | 'puesto' (requerido)
 * - empleado_id: number (opcional, filtra por empleado)
 * - puesto_id: number (opcional, filtra por puesto)
 *
 * Response 200: ReporteHorasResult
 * Response 400: Validacion fallida (manejado por middleware)
 * Response 500: Error interno del servidor
 */
export async function getReporteHorasController(req: Request, res: Response): Promise<void> {
  try {
    const {
      fecha_inicio,
      fecha_fin,
      tipo,
      empleado_id,
      puesto_id,
    } = req.query;

    const filters: ReporteHorasFilters = {
      fecha_inicio: fecha_inicio as string,
      fecha_fin: fecha_fin as string,
      tipo: tipo as 'empleado' | 'puesto',
      empleado_id: empleado_id ? Number(empleado_id) : undefined,
      puesto_id: puesto_id ? Number(puesto_id) : undefined,
    };

    const result = await reporteHorasService.getReporteHoras(filters);

    res.status(200).json(result);
  } catch (error) {
    console.error('Error en getReporteHorasController:', error);
    res.status(500).json({
      error: 'Error interno del servidor',
      message: 'No se pudo generar el reporte de horas trabajadas',
    });
  }
}
