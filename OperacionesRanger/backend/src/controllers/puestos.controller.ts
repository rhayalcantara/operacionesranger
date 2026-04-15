/**
 * Controladores de Puestos
 * Sistema de Gestión de Turnos - OperacionesRanger
 *
 * Maneja las peticiones HTTP para la gestión de puestos de seguridad.
 * Los controladores reciben requests, llaman a los servicios de negocio,
 * y retornan responses apropiadas.
 *
 * @module controllers/puestos.controller
 */

import { Request, Response } from 'express';
import * as puestosService from '../services/puestos.service';
import { CreatePuestoDTO, UpdatePuestoDTO } from '../models/puesto.model';

// ============================================================================
// CONTROLADORES PRINCIPALES
// ============================================================================

/**
 * GET /api/puestos
 *
 * Listar puestos con paginación y filtros
 *
 * Query params:
 * - page: número de página (default: 1)
 * - pageSize: tamaño de página (default: 10)
 * - search: búsqueda por nombre, código o descripción
 * - ubicacion_id: filtrar por ubicación
 * - cliente_id: filtrar por cliente (requiere JOIN)
 * - activo: filtrar por estado (true/false)
 *
 * Response 200:
 * {
 *   data: Puesto[],
 *   total: number,
 *   page: number,
 *   pageSize: number,
 *   totalPages: number
 * }
 *
 * Response 500: Error interno del servidor
 */
export async function getPuestosController(req: Request, res: Response): Promise<void> {
  try {
    const {
      page = 1,
      pageSize = 10,
      search,
      ubicacion_id,
      cliente_id,
      activo
    } = req.query;

    // Convertir query params a tipos correctos
    const filters = {
      page: Number(page),
      pageSize: Number(pageSize),
      search: search as string | undefined,
      ubicacion_id: ubicacion_id ? Number(ubicacion_id) : undefined,
      cliente_id: cliente_id ? Number(cliente_id) : undefined,
      activo: activo !== undefined ? activo === 'true' : undefined
    };

    const result = await puestosService.getPuestos(filters);

    const totalPages = Math.ceil(result.total / filters.pageSize);

    res.status(200).json({
      data: result.data,
      total: result.total,
      page: filters.page,
      pageSize: filters.pageSize,
      totalPages
    });
  } catch (error) {
    console.error('Error en getPuestosController:', error);
    res.status(500).json({
      error: 'Error interno del servidor',
      message: 'No se pudo obtener la lista de puestos'
    });
  }
}

/**
 * GET /api/puestos/:id
 *
 * Obtener puesto por ID con relaciones completas
 *
 * Path params:
 * - id: ID del puesto
 *
 * Response 200: PuestoConRelaciones
 * {
 *   id, ubicacion_id, codigo, nombre, descripcion,
 *   cantidad_guardianes, requiere_turno_diurno, requiere_turno_nocturno,
 *   activo, created_at, updated_at,
 *   ubicacion_nombre, ubicacion_codigo,
 *   cliente_id, cliente_nombre,
 *   turnos_count
 * }
 *
 * Response 404: Puesto no encontrado
 * Response 500: Error interno del servidor
 */
export async function getPuestoByIdController(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;

    const puesto = await puestosService.getPuestoById(Number(id));

    if (!puesto) {
      res.status(404).json({
        error: 'No encontrado',
        message: `Puesto con ID ${id} no encontrado`
      });
      return;
    }

    res.status(200).json(puesto);
  } catch (error) {
    console.error('Error en getPuestoByIdController:', error);
    res.status(500).json({
      error: 'Error interno del servidor',
      message: 'No se pudo obtener el puesto'
    });
  }
}

/**
 * GET /api/puestos/:id/turnos
 *
 * Obtener turnos de un puesto (paginado)
 *
 * Path params:
 * - id: ID del puesto
 *
 * Query params:
 * - page: número de página (default: 1)
 * - pageSize: tamaño de página (default: 10)
 * - fecha_inicio: fecha inicio filtro (YYYY-MM-DD)
 * - fecha_fin: fecha fin filtro (YYYY-MM-DD)
 *
 * Response 200:
 * {
 *   data: Turno[] (actualmente vacío),
 *   total: number (actualmente 0)
 * }
 *
 * Response 404: Puesto no encontrado
 * Response 500: Error interno del servidor
 *
 * NOTA: Tabla 'turnos' NO existe aún, retorna array vacío
 */
export async function getTurnosByPuestoController(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const {
      page = 1,
      pageSize = 10,
      fecha_inicio,
      fecha_fin
    } = req.query;

    const filters = {
      page: Number(page),
      pageSize: Number(pageSize),
      fecha_inicio: fecha_inicio as string | undefined,
      fecha_fin: fecha_fin as string | undefined
    };

    const result = await puestosService.getTurnosByPuesto(Number(id), filters);

    res.status(200).json(result);
  } catch (error) {
    // Si el error es "Puesto no encontrado", retornar 404
    if (error instanceof Error && error.message === 'Puesto no encontrado') {
      res.status(404).json({
        error: 'No encontrado',
        message: error.message
      });
      return;
    }

    console.error('Error en getTurnosByPuestoController:', error);
    res.status(500).json({
      error: 'Error interno del servidor',
      message: 'No se pudo obtener los turnos del puesto'
    });
  }
}

/**
 * POST /api/puestos
 *
 * Crear nuevo puesto
 *
 * Body (CreatePuestoDTO):
 * {
 *   ubicacion_id: number,
 *   codigo: string,
 *   nombre: string,
 *   descripcion?: string,
 *   cantidad_guardianes?: number (default: 1),
 *   requiere_turno_diurno?: boolean (default: true),
 *   requiere_turno_nocturno?: boolean (default: true)
 * }
 *
 * Response 201: Puesto creado con relaciones (PuestoConRelaciones)
 * Response 400: Validación fallida o código duplicado
 * Response 404: Ubicación no encontrada
 * Response 500: Error interno del servidor
 */
export async function createPuestoController(req: Request, res: Response): Promise<void> {
  try {
    const data: CreatePuestoDTO = req.body;

    const puesto = await puestosService.createPuesto(data);

    res.status(201).json(puesto);
  } catch (error) {
    console.error('Error en createPuestoController:', error);

    // Manejar errores específicos de validación
    if (error instanceof Error) {
      if (error.message === 'Ubicación no encontrada') {
        res.status(404).json({
          error: 'No encontrado',
          message: error.message
        });
        return;
      }

      if (
        error.message.includes('ya existe') ||
        error.message === 'La ubicación no está activa'
      ) {
        res.status(400).json({
          error: 'Validación fallida',
          message: error.message
        });
        return;
      }
    }

    res.status(500).json({
      error: 'Error interno del servidor',
      message: 'No se pudo crear el puesto'
    });
  }
}

/**
 * PUT /api/puestos/:id
 *
 * Actualizar puesto existente
 *
 * Path params:
 * - id: ID del puesto
 *
 * Body (UpdatePuestoDTO - todos opcionales):
 * {
 *   codigo?: string,
 *   nombre?: string,
 *   descripcion?: string,
 *   cantidad_guardianes?: number,
 *   requiere_turno_diurno?: boolean,
 *   requiere_turno_nocturno?: boolean,
 *   activo?: boolean
 * }
 *
 * Response 200: Puesto actualizado con relaciones (PuestoConRelaciones)
 * Response 400: Validación fallida o código duplicado
 * Response 404: Puesto no encontrado
 * Response 500: Error interno del servidor
 */
export async function updatePuestoController(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const data: UpdatePuestoDTO = req.body;

    const puesto = await puestosService.updatePuesto(Number(id), data);

    res.status(200).json(puesto);
  } catch (error) {
    console.error('Error en updatePuestoController:', error);

    // Manejar errores específicos
    if (error instanceof Error) {
      if (error.message === 'Puesto no encontrado') {
        res.status(404).json({
          error: 'No encontrado',
          message: error.message
        });
        return;
      }

      if (error.message.includes('ya existe')) {
        res.status(400).json({
          error: 'Validación fallida',
          message: error.message
        });
        return;
      }
    }

    res.status(500).json({
      error: 'Error interno del servidor',
      message: 'No se pudo actualizar el puesto'
    });
  }
}

/**
 * DELETE /api/puestos/:id
 *
 * Eliminar puesto (soft delete)
 *
 * Path params:
 * - id: ID del puesto
 *
 * Response 200:
 * {
 *   message: "Puesto desactivado",
 *   id: number
 * }
 *
 * Response 400: Puesto tiene turnos registrados (no se puede eliminar)
 * Response 404: Puesto no encontrado
 * Response 500: Error interno del servidor
 */
export async function deletePuestoController(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;

    const result = await puestosService.deletePuesto(Number(id));

    res.status(200).json(result);
  } catch (error) {
    console.error('Error en deletePuestoController:', error);

    // Manejar errores específicos
    if (error instanceof Error) {
      if (error.message === 'Puesto no encontrado') {
        res.status(404).json({
          error: 'No encontrado',
          message: error.message
        });
        return;
      }

      if (error.message.includes('tiene') && error.message.includes('turno')) {
        res.status(400).json({
          error: 'Validación fallida',
          message: error.message
        });
        return;
      }
    }

    res.status(500).json({
      error: 'Error interno del servidor',
      message: 'No se pudo eliminar el puesto'
    });
  }
}
