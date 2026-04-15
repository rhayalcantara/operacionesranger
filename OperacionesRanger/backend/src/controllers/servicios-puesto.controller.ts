/**
 * Controladores de Servicios por Puesto
 * Sistema de Gestión de Turnos - OperacionesRanger
 *
 * Maneja las peticiones HTTP para la gestión de asignaciones semanales
 * de empleados a puestos de seguridad.
 * Los controladores reciben requests, llaman a los servicios de negocio,
 * y retornan responses apropiadas.
 *
 * @module controllers/servicios-puesto.controller
 */

import { Request, Response } from 'express';
import * as serviciosPuestoService from '../services/servicios-puesto.service';
import { CreateServicioPuestoDTO, UpdateServicioPuestoDTO, TipoTurno } from '../models/servicio-puesto.model';

// ============================================================================
// CONTROLADORES PRINCIPALES
// ============================================================================

/**
 * GET /api/servicios-puesto
 *
 * Listar servicios por puesto con paginación y filtros
 *
 * Query params:
 * - page: número de página (default: 1)
 * - pageSize: tamaño de página (default: 10)
 * - search: búsqueda por nombre de puesto, código, ubicación o cliente
 * - puesto_id: filtrar por puesto
 * - ubicacion_id: filtrar por ubicación
 * - cliente_id: filtrar por cliente
 * - tipo_turno: filtrar por tipo de turno (DIURNO/NOCTURNO)
 * - cobrada: filtrar por estado de cobro (true/false)
 * - activo: filtrar por estado activo (true/false)
 *
 * Response 200:
 * {
 *   data: ServicioPuestoConRelaciones[],
 *   total: number,
 *   page: number,
 *   pageSize: number,
 *   totalPages: number
 * }
 *
 * Response 500: Error interno del servidor
 */
export async function getServiciosPuestoController(req: Request, res: Response): Promise<void> {
  try {
    const {
      page = 1,
      pageSize = 10,
      search,
      puesto_id,
      ubicacion_id,
      cliente_id,
      tipo_turno,
      cobrada,
      activo,
    } = req.query;

    // Convertir query params a tipos correctos
    const filters = {
      page: Number(page),
      pageSize: Number(pageSize),
      search: search as string | undefined,
      puesto_id: puesto_id ? Number(puesto_id) : undefined,
      ubicacion_id: ubicacion_id ? Number(ubicacion_id) : undefined,
      cliente_id: cliente_id ? Number(cliente_id) : undefined,
      tipo_turno: tipo_turno as TipoTurno | undefined,
      cobrada: cobrada !== undefined ? String(cobrada) === 'true' : undefined,
      activo: activo !== undefined ? String(activo) === 'true' : undefined,
    };

    const result = await serviciosPuestoService.getServiciosPuesto(filters);

    const totalPages = Math.ceil(result.total / filters.pageSize);

    res.status(200).json({
      data: result.data,
      total: result.total,
      page: filters.page,
      pageSize: filters.pageSize,
      totalPages,
    });
  } catch (error) {
    console.error('Error en getServiciosPuestoController:', error);
    res.status(500).json({
      error: 'Error interno del servidor',
      message: 'No se pudo obtener la lista de servicios por puesto',
    });
  }
}

/**
 * GET /api/servicios-puesto/:id
 *
 * Obtener servicio por puesto por ID con relaciones completas
 *
 * Path params:
 * - id: ID del servicio por puesto
 *
 * Response 200: ServicioPuestoConRelaciones
 * Response 404: Servicio no encontrado
 * Response 500: Error interno del servidor
 */
export async function getServicioPuestoByIdController(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;

    const servicio = await serviciosPuestoService.getServicioPuestoById(Number(id));

    if (!servicio) {
      res.status(404).json({
        error: 'No encontrado',
        message: `Servicio por puesto con ID ${id} no encontrado`,
      });
      return;
    }

    res.status(200).json(servicio);
  } catch (error) {
    console.error('Error en getServicioPuestoByIdController:', error);
    res.status(500).json({
      error: 'Error interno del servidor',
      message: 'No se pudo obtener el servicio por puesto',
    });
  }
}

/**
 * POST /api/servicios-puesto
 *
 * Crear nuevo servicio por puesto
 *
 * Body (CreateServicioPuestoDTO):
 * {
 *   puesto_id: number,
 *   tipo_turno: 'DIURNO' | 'NOCTURNO',
 *   domingo_empleado_id?: number | null,
 *   lunes_empleado_id?: number | null,
 *   martes_empleado_id?: number | null,
 *   miercoles_empleado_id?: number | null,
 *   jueves_empleado_id?: number | null,
 *   viernes_empleado_id?: number | null,
 *   sabado_empleado_id?: number | null,
 *   cobrada?: boolean
 * }
 *
 * Response 201: Servicio creado con relaciones
 * Response 400: Validación fallida o duplicado
 * Response 404: Puesto no encontrado
 * Response 500: Error interno del servidor
 */
export async function createServicioPuestoController(req: Request, res: Response): Promise<void> {
  try {
    const data: CreateServicioPuestoDTO = req.body;
    const userId = req.user?.sub ?? null;

    const servicio = await serviciosPuestoService.createServicioPuesto(data, userId);

    res.status(201).json(servicio);
  } catch (error) {
    console.error('Error en createServicioPuestoController:', error);

    // Manejar errores específicos de validación
    if (error instanceof Error) {
      if (error.message === 'Puesto no encontrado') {
        res.status(404).json({
          error: 'No encontrado',
          message: error.message,
        });
        return;
      }

      if (
        error.message.includes('Ya existe') ||
        error.message === 'El puesto no está activo'
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
      message: 'No se pudo crear el servicio por puesto',
    });
  }
}

/**
 * PUT /api/servicios-puesto/:id
 *
 * Actualizar servicio por puesto existente
 *
 * Path params:
 * - id: ID del servicio
 *
 * Body (UpdateServicioPuestoDTO - todos opcionales):
 * {
 *   tipo_turno?: 'DIURNO' | 'NOCTURNO',
 *   domingo_empleado_id?: number | null,
 *   ...
 *   cobrada?: boolean,
 *   activo?: boolean
 * }
 *
 * Response 200: Servicio actualizado con relaciones
 * Response 400: Validación fallida o duplicado
 * Response 404: Servicio no encontrado
 * Response 500: Error interno del servidor
 */
export async function updateServicioPuestoController(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const data: UpdateServicioPuestoDTO = req.body;
    const userId = req.user?.sub ?? null;

    const servicio = await serviciosPuestoService.updateServicioPuesto(Number(id), data, userId);

    res.status(200).json(servicio);
  } catch (error) {
    console.error('Error en updateServicioPuestoController:', error);

    // Manejar errores específicos
    if (error instanceof Error) {
      if (error.message === 'Servicio por puesto no encontrado') {
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
    }

    res.status(500).json({
      error: 'Error interno del servidor',
      message: 'No se pudo actualizar el servicio por puesto',
    });
  }
}

/**
 * DELETE /api/servicios-puesto/:id
 *
 * Eliminar servicio por puesto (soft delete)
 *
 * Path params:
 * - id: ID del servicio
 *
 * Response 200:
 * {
 *   message: "Servicio por puesto desactivado",
 *   id: number
 * }
 *
 * Response 404: Servicio no encontrado
 * Response 500: Error interno del servidor
 */
export async function deleteServicioPuestoController(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;

    const result = await serviciosPuestoService.deleteServicioPuesto(Number(id));

    res.status(200).json(result);
  } catch (error) {
    console.error('Error en deleteServicioPuestoController:', error);

    // Manejar errores específicos
    if (error instanceof Error) {
      if (error.message === 'Servicio por puesto no encontrado') {
        res.status(404).json({
          error: 'No encontrado',
          message: error.message,
        });
        return;
      }
    }

    res.status(500).json({
      error: 'Error interno del servidor',
      message: 'No se pudo eliminar el servicio por puesto',
    });
  }
}
