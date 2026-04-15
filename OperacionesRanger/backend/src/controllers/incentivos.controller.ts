/**
 * Controladores de Incentivos por Puesto
 * Sistema de Gestion de Turnos - OperacionesRanger
 *
 * Maneja las peticiones HTTP para la gestion de incentivos permanentes
 * asignados a puestos.
 *
 * @module controllers/incentivos.controller
 */

import { Request, Response } from 'express';
import * as incentivosService from '../services/incentivos.service';
import { CreateIncentivoDTO, UpdateIncentivoDTO } from '../models/incentivo.model';

// ============================================================================
// CONTROLADORES PRINCIPALES
// ============================================================================

/**
 * GET /api/incentivos
 *
 * Listar incentivos con paginacion y filtros
 */
export async function getIncentivosController(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const {
      page = 1,
      pageSize = 10,
      puesto_id,
      activo,
      search
    } = req.query;

    const filters = {
      page: Number(page),
      pageSize: Number(pageSize),
      puesto_id: puesto_id ? Number(puesto_id) : undefined,
      activo: activo !== undefined ? (activo === 'true' || activo === '1') : undefined,
      search: search as string | undefined
    };

    const result = await incentivosService.getIncentivos(filters);

    const totalPages = Math.ceil(result.total / filters.pageSize);

    res.status(200).json({
      data: result.data,
      total: result.total,
      page: filters.page,
      pageSize: filters.pageSize,
      totalPages
    });
  } catch (error) {
    console.error('Error en getIncentivosController:', error);
    res.status(500).json({
      error: 'Error interno del servidor',
      message: 'No se pudo obtener la lista de incentivos'
    });
  }
}

/**
 * GET /api/incentivos/:id
 *
 * Obtener incentivo por ID con relaciones completas
 */
export async function getIncentivoByIdController(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const { id } = req.params;

    const incentivo = await incentivosService.getIncentivoById(Number(id));

    if (!incentivo) {
      res.status(404).json({
        error: 'No encontrado',
        message: `Incentivo con ID ${id} no encontrado`
      });
      return;
    }

    res.status(200).json(incentivo);
  } catch (error) {
    console.error('Error en getIncentivoByIdController:', error);
    res.status(500).json({
      error: 'Error interno del servidor',
      message: 'No se pudo obtener el incentivo'
    });
  }
}

/**
 * GET /api/incentivos/activos
 *
 * Obtener todos los incentivos activos (para calculo de turnos)
 */
export async function getIncentivosActivosController(
  _req: Request,
  res: Response
): Promise<void> {
  try {
    const incentivos = await incentivosService.getIncentivosActivos();

    res.status(200).json(incentivos);
  } catch (error) {
    console.error('Error en getIncentivosActivosController:', error);
    res.status(500).json({
      error: 'Error interno del servidor',
      message: 'No se pudo obtener los incentivos activos'
    });
  }
}

/**
 * POST /api/incentivos
 *
 * Crear nuevo incentivo
 */
export async function createIncentivoController(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const data: CreateIncentivoDTO = req.body;

    const incentivo = await incentivosService.createIncentivo(data);

    res.status(201).json(incentivo);
  } catch (error) {
    console.error('Error en createIncentivoController:', error);

    if (error instanceof Error) {
      if (error.message === 'Puesto no encontrado') {
        res.status(404).json({
          error: 'No encontrado',
          message: error.message
        });
        return;
      }

      if (
        error.message.includes('Ya existe') ||
        error.message === 'El puesto no esta activo'
      ) {
        res.status(400).json({
          error: 'Validacion fallida',
          message: error.message
        });
        return;
      }
    }

    res.status(500).json({
      error: 'Error interno del servidor',
      message: 'No se pudo crear el incentivo'
    });
  }
}

/**
 * PUT /api/incentivos/:id
 *
 * Actualizar incentivo existente
 */
export async function updateIncentivoController(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const { id } = req.params;
    const data: UpdateIncentivoDTO = req.body;

    const incentivo = await incentivosService.updateIncentivo(Number(id), data);

    res.status(200).json(incentivo);
  } catch (error) {
    console.error('Error en updateIncentivoController:', error);

    if (error instanceof Error) {
      if (error.message === 'Incentivo no encontrado') {
        res.status(404).json({
          error: 'No encontrado',
          message: error.message
        });
        return;
      }
    }

    res.status(500).json({
      error: 'Error interno del servidor',
      message: 'No se pudo actualizar el incentivo'
    });
  }
}

/**
 * DELETE /api/incentivos/:id
 *
 * Desactivar incentivo (soft delete)
 */
export async function deleteIncentivoController(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const { id } = req.params;

    const result = await incentivosService.deleteIncentivo(Number(id));

    res.status(200).json(result);
  } catch (error) {
    console.error('Error en deleteIncentivoController:', error);

    if (error instanceof Error) {
      if (error.message === 'Incentivo no encontrado') {
        res.status(404).json({
          error: 'No encontrado',
          message: error.message
        });
        return;
      }
    }

    res.status(500).json({
      error: 'Error interno del servidor',
      message: 'No se pudo desactivar el incentivo'
    });
  }
}
