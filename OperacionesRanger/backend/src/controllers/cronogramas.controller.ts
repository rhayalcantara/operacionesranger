/**
 * Controladores de Cronogramas
 * Sistema de Gestión de Turnos - OperacionesRanger
 *
 * Maneja las peticiones HTTP para la gestión de cronogramas semanales.
 * Los controladores reciben requests, llaman a los servicios de negocio,
 * y retornan responses apropiadas.
 *
 * @module controllers/cronogramas.controller
 */

import { Request, Response } from 'express';
import * as cronogramasService from '../services/cronogramas.service';
import { CreateCronogramaDTO, UpdateCronogramaDTO } from '../models/cronograma.model';

// ============================================================================
// CONTROLADORES PRINCIPALES
// ============================================================================

/**
 * GET /api/cronogramas
 *
 * Listar cronogramas con paginación y filtros
 *
 * Query params:
 * - page: número de página (default: 1)
 * - pageSize: tamaño de página (default: 10)
 * - search: búsqueda por nombre o descripción
 * - activo: filtrar por estado (true/false)
 *
 * Response 200:
 * {
 *   data: CronogramaEnListado[],
 *   total: number,
 *   page: number,
 *   pageSize: number,
 *   totalPages: number
 * }
 */
export async function getCronogramasController(req: Request, res: Response): Promise<void> {
  try {
    const {
      page = 1,
      pageSize = 10,
      search,
      activo,
    } = req.query;

    const filters = {
      page: Number(page),
      pageSize: Number(pageSize),
      search: search as string | undefined,
      activo: activo !== undefined ? activo === 'true' : undefined,
    };

    const result = await cronogramasService.getCronogramas(filters);

    const totalPages = Math.ceil(result.total / filters.pageSize);

    res.status(200).json({
      data: result.data,
      total: result.total,
      page: filters.page,
      pageSize: filters.pageSize,
      totalPages,
    });
  } catch (error) {
    console.error('Error en getCronogramasController:', error);
    res.status(500).json({
      error: 'Error interno del servidor',
      message: 'No se pudo obtener la lista de cronogramas',
    });
  }
}

/**
 * GET /api/cronogramas/:id
 *
 * Obtener cronograma por ID con detalles completos
 *
 * Retorna header + array de detalles con nombres de empleados y puestos.
 *
 * Response 200: CronogramaConDetalle
 * Response 404: Cronograma no encontrado
 * Response 500: Error interno del servidor
 */
export async function getCronogramaByIdController(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;

    const cronograma = await cronogramasService.getCronogramaById(Number(id));

    if (!cronograma) {
      res.status(404).json({
        error: 'No encontrado',
        message: `Cronograma con ID ${id} no encontrado`,
      });
      return;
    }

    res.status(200).json(cronograma);
  } catch (error) {
    console.error('Error en getCronogramaByIdController:', error);
    res.status(500).json({
      error: 'Error interno del servidor',
      message: 'No se pudo obtener el cronograma',
    });
  }
}

/**
 * POST /api/cronogramas
 *
 * Crear nuevo cronograma con detalles
 *
 * Body (CreateCronogramaDTO):
 * {
 *   nombre: string,
 *   descripcion?: string,
 *   detalles: [{
 *     dia_semana: number (0-6),
 *     puesto_id: number,
 *     empleado_id: number,
 *     tipo_turno: 'DIURNO' | 'NOCTURNO'
 *   }]
 * }
 *
 * Response 201: CronogramaConDetalle
 * Response 400: Validación fallida (empleado sin día libre, etc.)
 * Response 500: Error interno del servidor
 */
export async function createCronogramaController(req: Request, res: Response): Promise<void> {
  try {
    const data: CreateCronogramaDTO = req.body;
    const userId = (req as any).user?.id || 0;

    const cronograma = await cronogramasService.createCronograma(data, userId);

    res.status(201).json(cronograma);
  } catch (error) {
    console.error('Error en createCronogramaController:', error);

    if (error instanceof Error) {
      // Errores de regla de negocio (día libre, duplicados, etc.)
      if (
        error.message.includes('día libre') ||
        error.message.includes('sin día libre') ||
        error.message.includes('Duplicate entry')
      ) {
        res.status(400).json({
          error: 'Validación fallida',
          message: error.message,
        });
        return;
      }
    }

    res.status(500).json({
      error: 'Error interno del servidor',
      message: 'No se pudo crear el cronograma',
    });
  }
}

/**
 * PUT /api/cronogramas/:id
 *
 * Actualizar cronograma existente
 *
 * Body (UpdateCronogramaDTO):
 * {
 *   nombre?: string,
 *   descripcion?: string,
 *   detalles?: [{ dia_semana, puesto_id, empleado_id, tipo_turno }]
 * }
 *
 * Si detalles se proporciona, reemplaza completamente los existentes.
 *
 * Response 200: CronogramaConDetalle
 * Response 400: Validación fallida
 * Response 404: Cronograma no encontrado
 * Response 500: Error interno del servidor
 */
export async function updateCronogramaController(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const data: UpdateCronogramaDTO = req.body;
    const userId = (req as any).user?.id || 0;

    const cronograma = await cronogramasService.updateCronograma(Number(id), data, userId);

    res.status(200).json(cronograma);
  } catch (error) {
    console.error('Error en updateCronogramaController:', error);

    if (error instanceof Error) {
      if (error.message === 'Cronograma no encontrado') {
        res.status(404).json({
          error: 'No encontrado',
          message: error.message,
        });
        return;
      }

      if (
        error.message.includes('día libre') ||
        error.message.includes('sin día libre') ||
        error.message.includes('inactivo') ||
        error.message.includes('Duplicate entry')
      ) {
        res.status(400).json({
          error: 'Validación fallida',
          message: error.message,
        });
        return;
      }
    }

    res.status(500).json({
      error: 'Error interno del servidor',
      message: 'No se pudo actualizar el cronograma',
    });
  }
}

/**
 * DELETE /api/cronogramas/:id
 *
 * Eliminar cronograma (soft delete)
 *
 * Response 200: { message: string, id: number }
 * Response 400: Cronograma ya inactivo
 * Response 404: Cronograma no encontrado
 * Response 500: Error interno del servidor
 */
export async function deleteCronogramaController(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;

    const result = await cronogramasService.deleteCronograma(Number(id));

    res.status(200).json(result);
  } catch (error) {
    console.error('Error en deleteCronogramaController:', error);

    if (error instanceof Error) {
      if (error.message === 'Cronograma no encontrado') {
        res.status(404).json({
          error: 'No encontrado',
          message: error.message,
        });
        return;
      }

      if (error.message.includes('inactivo')) {
        res.status(400).json({
          error: 'Validación fallida',
          message: error.message,
        });
        return;
      }
    }

    res.status(500).json({
      error: 'Error interno del servidor',
      message: 'No se pudo eliminar el cronograma',
    });
  }
}
