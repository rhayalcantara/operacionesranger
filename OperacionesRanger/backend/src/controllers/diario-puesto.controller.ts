/**
 * Controladores de Diario de Puesto
 * Sistema de Gestión de Turnos - OperacionesRanger
 *
 * Maneja las peticiones HTTP para la gestión de registros diarios
 * de asistencia de empleados en puestos de seguridad.
 * Incluye CRUD estándar y endpoint especial para poblar desde plantillas.
 *
 * @module controllers/diario-puesto.controller
 */

import { Request, Response } from 'express';
import * as diarioPuestoService from '../services/diario-puesto.service';
import { CreateDiarioPuestoDTO, UpdateDiarioPuestoDTO, PoblarPlantillaDTO, PoblarServiciosDTO, TipoTurno } from '../models/diario-puesto.model';

// ============================================================================
// CONTROLADORES PRINCIPALES
// ============================================================================

/**
 * GET /api/diario-puesto
 *
 * Listar registros de diario de puesto con paginación y filtros
 *
 * Query params:
 * - page: número de página (default: 1)
 * - pageSize: tamaño de página (default: 10)
 * - fecha: filtrar por fecha (YYYY-MM-DD)
 * - puesto_id: filtrar por puesto
 * - empleado_id: filtrar por empleado
 * - tipo_turno: filtrar por tipo de turno (DIURNO/NOCTURNO)
 * - activo: filtrar por estado activo (true/false)
 * - search: búsqueda por nombre de puesto, código, ubicación, cliente o empleado
 *
 * Response 200:
 * {
 *   data: DiarioPuestoConRelaciones[],
 *   total: number,
 *   page: number,
 *   pageSize: number,
 *   totalPages: number
 * }
 */
export async function getDiarioPuestoController(req: Request, res: Response): Promise<void> {
  try {
    const {
      page = 1,
      pageSize = 10,
      fecha,
      puesto_id,
      empleado_id,
      tipo_turno,
      activo,
      search,
    } = req.query;

    // Convertir query params a tipos correctos
    const filters = {
      page: Number(page),
      pageSize: Number(pageSize),
      fecha: fecha as string | undefined,
      puesto_id: puesto_id ? Number(puesto_id) : undefined,
      empleado_id: empleado_id ? Number(empleado_id) : undefined,
      tipo_turno: tipo_turno as TipoTurno | undefined,
      activo: activo !== undefined ? String(activo) === 'true' : undefined,
      search: search as string | undefined,
    };

    const result = await diarioPuestoService.getDiarioPuesto(filters);

    const totalPages = Math.ceil(result.total / filters.pageSize);

    res.status(200).json({
      data: result.data,
      total: result.total,
      page: filters.page,
      pageSize: filters.pageSize,
      totalPages,
    });
  } catch (error) {
    console.error('Error en getDiarioPuestoController:', error);
    res.status(500).json({
      error: 'Error interno del servidor',
      message: 'No se pudo obtener la lista de registros de diario de puesto',
    });
  }
}

/**
 * GET /api/diario-puesto/:id
 *
 * Obtener registro de diario de puesto por ID con relaciones completas
 *
 * Response 200: DiarioPuestoConRelaciones
 * Response 404: Registro no encontrado
 * Response 500: Error interno del servidor
 */
export async function getDiarioPuestoByIdController(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;

    const registro = await diarioPuestoService.getDiarioPuestoById(Number(id));

    if (!registro) {
      res.status(404).json({
        error: 'No encontrado',
        message: `Registro de diario de puesto con ID ${id} no encontrado`,
      });
      return;
    }

    res.status(200).json(registro);
  } catch (error) {
    console.error('Error en getDiarioPuestoByIdController:', error);
    res.status(500).json({
      error: 'Error interno del servidor',
      message: 'No se pudo obtener el registro de diario de puesto',
    });
  }
}

/**
 * POST /api/diario-puesto
 *
 * Crear nuevo registro de diario de puesto
 *
 * Response 201: Registro creado con relaciones
 * Response 400: Validación fallida o duplicado
 * Response 404: Puesto no encontrado
 * Response 500: Error interno del servidor
 */
export async function createDiarioPuestoController(req: Request, res: Response): Promise<void> {
  try {
    const data: CreateDiarioPuestoDTO = req.body;
    const userId = req.user?.sub ?? null;

    const registro = await diarioPuestoService.createDiarioPuesto(data, userId);

    res.status(201).json(registro);
  } catch (error) {
    console.error('Error en createDiarioPuestoController:', error);

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
        error.message === 'El puesto no está activo' ||
        error.message.includes('Duplicate entry')
      ) {
        res.status(400).json({
          error: 'Validación fallida',
          message: error.message.includes('Duplicate entry')
            ? 'Ya existe un registro para este puesto, empleado y fecha'
            : error.message,
        });
        return;
      }
    }

    res.status(500).json({
      error: 'Error interno del servidor',
      message: 'No se pudo crear el registro de diario de puesto',
    });
  }
}

/**
 * PUT /api/diario-puesto/:id
 *
 * Actualizar registro de diario de puesto existente
 *
 * Response 200: Registro actualizado con relaciones
 * Response 400: Validación fallida
 * Response 404: Registro no encontrado
 * Response 500: Error interno del servidor
 */
export async function updateDiarioPuestoController(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const data: UpdateDiarioPuestoDTO = req.body;
    const userId = req.user?.sub ?? null;

    const registro = await diarioPuestoService.updateDiarioPuesto(Number(id), data, userId);

    res.status(200).json(registro);
  } catch (error) {
    console.error('Error en updateDiarioPuestoController:', error);

    if (error instanceof Error) {
      if (error.message === 'Registro de diario de puesto no encontrado') {
        res.status(404).json({
          error: 'No encontrado',
          message: error.message,
        });
        return;
      }

      if (error.message.includes('Duplicate entry')) {
        res.status(400).json({
          error: 'Validación fallida',
          message: 'Ya existe un registro para este puesto, empleado y fecha',
        });
        return;
      }
    }

    res.status(500).json({
      error: 'Error interno del servidor',
      message: 'No se pudo actualizar el registro de diario de puesto',
    });
  }
}

/**
 * DELETE /api/diario-puesto/:id
 *
 * Eliminar registro de diario de puesto (soft delete)
 *
 * Response 200: { message, id }
 * Response 404: Registro no encontrado
 * Response 500: Error interno del servidor
 */
export async function deleteDiarioPuestoController(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;

    const result = await diarioPuestoService.deleteDiarioPuesto(Number(id));

    res.status(200).json(result);
  } catch (error) {
    console.error('Error en deleteDiarioPuestoController:', error);

    if (error instanceof Error) {
      if (error.message === 'Registro de diario de puesto no encontrado') {
        res.status(404).json({
          error: 'No encontrado',
          message: error.message,
        });
        return;
      }
    }

    res.status(500).json({
      error: 'Error interno del servidor',
      message: 'No se pudo eliminar el registro de diario de puesto',
    });
  }
}

// ============================================================================
// CONTROLADOR ESPECIAL: POBLAR DESDE PLANTILLA
// ============================================================================

/**
 * POST /api/diario-puesto/poblar-plantilla
 *
 * Poblar el diario de puesto automáticamente desde una plantilla de servicio.
 * Para cada servicio_puesto en la plantilla, determina el empleado asignado
 * para el día de la semana correspondiente a la fecha y lo inserta.
 *
 * Body (PoblarPlantillaDTO):
 * {
 *   plantilla_id: number,
 *   fecha: string (YYYY-MM-DD)
 * }
 *
 * Response 200:
 * {
 *   insertados: number,
 *   omitidos: number,
 *   detalles: string[]
 * }
 *
 * Response 400: Validación fallida
 * Response 404: Plantilla no encontrada
 * Response 500: Error interno del servidor
 */
export async function poblarPlantillaController(req: Request, res: Response): Promise<void> {
  try {
    const data: PoblarPlantillaDTO = req.body;
    const userId = req.user?.sub ?? null;

    const result = await diarioPuestoService.poblarDesdePlantilla(data, userId);

    res.status(200).json(result);
  } catch (error) {
    console.error('Error en poblarPlantillaController:', error);

    if (error instanceof Error) {
      if (error.message === 'Plantilla de servicio no encontrada') {
        res.status(404).json({
          error: 'No encontrado',
          message: error.message,
        });
        return;
      }

      if (error.message === 'La plantilla de servicio no está activa') {
        res.status(400).json({
          error: 'Validación fallida',
          message: error.message,
        });
        return;
      }
    }

    res.status(500).json({
      error: 'Error interno del servidor',
      message: 'No se pudo poblar el diario de puesto desde la plantilla',
    });
  }
}

// ============================================================================
// CONTROLADOR ESPECIAL: POBLAR DESDE SERVICIOS POR PUESTO
// ============================================================================

/**
 * POST /api/diario-puesto/poblar-servicios
 *
 * Poblar el diario de puesto desde todos los servicios por puesto activos.
 */
export async function poblarServiciosController(req: Request, res: Response): Promise<void> {
  try {
    const data: PoblarServiciosDTO = req.body;
    const userId = req.user?.sub ?? null;

    const result = await diarioPuestoService.poblarDesdeServiciosPuesto(data, userId);

    res.status(200).json(result);
  } catch (error) {
    console.error('Error en poblarServiciosController:', error);

    res.status(500).json({
      error: 'Error interno del servidor',
      message: 'No se pudo poblar el diario de puesto desde los servicios',
    });
  }
}
