/**
 * Controladores de Plantillas de Servicio
 * Sistema de Gestión de Turnos - OperacionesRanger
 *
 * Maneja las peticiones HTTP para la gestión de plantillas de servicio.
 * Los controladores reciben requests, llaman a los servicios de negocio,
 * y retornan responses apropiadas.
 *
 * @module controllers/plantillas-servicio.controller
 */

import { Request, Response } from 'express';
import * as plantillasServicioService from '../services/plantillas-servicio.service';
import { CreatePlantillaDTO, UpdatePlantillaDTO } from '../models/plantilla-servicio.model';

// ============================================================================
// CONTROLADORES PRINCIPALES
// ============================================================================

/**
 * GET /api/plantillas-servicio
 *
 * Listar plantillas de servicio con paginación y filtros
 *
 * Query params:
 * - page: número de página (default: 1)
 * - pageSize: tamaño de página (default: 10)
 * - search: búsqueda por nombre o descripción
 * - activo: filtrar por estado activo (true/false)
 *
 * Response 200:
 * {
 *   data: PlantillaEnListado[],
 *   total: number,
 *   page: number,
 *   pageSize: number,
 *   totalPages: number
 * }
 *
 * Response 500: Error interno del servidor
 */
export async function getPlantillasServicioController(req: Request, res: Response): Promise<void> {
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
      activo: activo !== undefined ? String(activo) === 'true' : undefined,
    };

    const result = await plantillasServicioService.getPlantillas(filters);

    const totalPages = Math.ceil(result.total / filters.pageSize);

    res.status(200).json({
      data: result.data,
      total: result.total,
      page: filters.page,
      pageSize: filters.pageSize,
      totalPages,
    });
  } catch (error) {
    console.error('Error en getPlantillasServicioController:', error);
    res.status(500).json({
      error: 'Error interno del servidor',
      message: 'No se pudo obtener la lista de plantillas de servicio',
    });
  }
}

/**
 * GET /api/plantillas-servicio/:id
 *
 * Obtener plantilla de servicio por ID con detalles y relaciones
 *
 * Path params:
 * - id: ID de la plantilla
 *
 * Response 200: PlantillaConDetalle
 * Response 404: Plantilla no encontrada
 * Response 500: Error interno del servidor
 */
export async function getPlantillaServicioByIdController(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;

    const plantilla = await plantillasServicioService.getPlantillaById(Number(id));

    if (!plantilla) {
      res.status(404).json({
        error: 'No encontrado',
        message: `Plantilla de servicio con ID ${id} no encontrada`,
      });
      return;
    }

    res.status(200).json(plantilla);
  } catch (error) {
    console.error('Error en getPlantillaServicioByIdController:', error);
    res.status(500).json({
      error: 'Error interno del servidor',
      message: 'No se pudo obtener la plantilla de servicio',
    });
  }
}

/**
 * POST /api/plantillas-servicio
 *
 * Crear nueva plantilla de servicio con detalles
 *
 * Body (CreatePlantillaDTO):
 * {
 *   nombre: string,
 *   descripcion?: string | null,
 *   detalles: { puesto_id: number, servicio_puesto_id: number }[]
 * }
 *
 * Response 201: Plantilla creada con detalles y relaciones
 * Response 400: Validación fallida o duplicado
 * Response 500: Error interno del servidor
 */
export async function createPlantillaServicioController(req: Request, res: Response): Promise<void> {
  try {
    const data: CreatePlantillaDTO = req.body;
    const userId = req.user?.sub ?? null;

    const plantilla = await plantillasServicioService.createPlantilla(data, userId!);

    res.status(201).json(plantilla);
  } catch (error) {
    console.error('Error en createPlantillaServicioController:', error);

    if (error instanceof Error) {
      if (error.message.includes('Ya existe')) {
        res.status(400).json({
          error: 'Validación fallida',
          message: error.message,
        });
        return;
      }

      // Duplicate entry en unique constraint de detalles
      if (error.message.includes('Duplicate entry') || error.message.includes('ER_DUP_ENTRY')) {
        res.status(400).json({
          error: 'Validación fallida',
          message: 'Detalle duplicado: el mismo servicio por puesto ya existe en esta plantilla',
        });
        return;
      }
    }

    res.status(500).json({
      error: 'Error interno del servidor',
      message: 'No se pudo crear la plantilla de servicio',
    });
  }
}

/**
 * PUT /api/plantillas-servicio/:id
 *
 * Actualizar plantilla de servicio existente
 *
 * Path params:
 * - id: ID de la plantilla
 *
 * Body (UpdatePlantillaDTO - todos opcionales):
 * {
 *   nombre?: string,
 *   descripcion?: string | null,
 *   detalles?: { puesto_id: number, servicio_puesto_id: number }[]
 * }
 *
 * Response 200: Plantilla actualizada con detalles y relaciones
 * Response 400: Validación fallida o duplicado
 * Response 404: Plantilla no encontrada
 * Response 500: Error interno del servidor
 */
export async function updatePlantillaServicioController(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const data: UpdatePlantillaDTO = req.body;
    const userId = req.user?.sub ?? null;

    const plantilla = await plantillasServicioService.updatePlantilla(Number(id), data, userId!);

    res.status(200).json(plantilla);
  } catch (error) {
    console.error('Error en updatePlantillaServicioController:', error);

    if (error instanceof Error) {
      if (error.message === 'Plantilla de servicio no encontrada') {
        res.status(404).json({
          error: 'No encontrado',
          message: error.message,
        });
        return;
      }

      if (error.message.includes('Ya existe')) {
        res.status(400).json({
          error: 'Validación fallida',
          message: error.message,
        });
        return;
      }

      if (error.message.includes('Duplicate entry') || error.message.includes('ER_DUP_ENTRY')) {
        res.status(400).json({
          error: 'Validación fallida',
          message: 'Detalle duplicado: el mismo servicio por puesto ya existe en esta plantilla',
        });
        return;
      }
    }

    res.status(500).json({
      error: 'Error interno del servidor',
      message: 'No se pudo actualizar la plantilla de servicio',
    });
  }
}

/**
 * DELETE /api/plantillas-servicio/:id
 *
 * Eliminar plantilla de servicio (soft delete)
 *
 * Path params:
 * - id: ID de la plantilla
 *
 * Response 200:
 * {
 *   message: "Plantilla de servicio desactivada",
 *   id: number
 * }
 *
 * Response 404: Plantilla no encontrada
 * Response 400: Plantilla ya inactiva
 * Response 500: Error interno del servidor
 */
export async function deletePlantillaServicioController(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;

    const result = await plantillasServicioService.deletePlantilla(Number(id));

    res.status(200).json(result);
  } catch (error) {
    console.error('Error en deletePlantillaServicioController:', error);

    if (error instanceof Error) {
      if (error.message === 'Plantilla de servicio no encontrada') {
        res.status(404).json({
          error: 'No encontrado',
          message: error.message,
        });
        return;
      }

      if (error.message === 'La plantilla ya está inactiva') {
        res.status(400).json({
          error: 'Validación fallida',
          message: error.message,
        });
        return;
      }
    }

    res.status(500).json({
      error: 'Error interno del servidor',
      message: 'No se pudo eliminar la plantilla de servicio',
    });
  }
}
