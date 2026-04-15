/**
 * Controladores de Ubicaciones
 * Sistema de Gestión de Turnos - OperacionesRanger
 *
 * Maneja las peticiones HTTP para endpoints de ubicaciones.
 * Valida inputs, llama a servicios, y formatea responses.
 *
 * @module controllers/ubicaciones.controller
 */

import { Request, Response } from 'express';
import {
  createUbicacionSchema,
  updateUbicacionSchema,
  ubicacionIdParamSchema,
  ubicacionesPaginationQuerySchema,
  formatZodErrors
} from '../schemas/ubicacion.schema';
import {
  getUbicaciones,
  getUbicacionById,
  createUbicacion,
  updateUbicacion,
  deleteUbicacion
} from '../services/ubicaciones.service';

// ============================================================================
// CONTROLADORES
// ============================================================================

/**
 * GET /api/ubicaciones
 *
 * Obtiene lista paginada de ubicaciones con búsqueda y filtro opcionales
 *
 * Query params:
 * - page: número de página (default: 1)
 * - pageSize: registros por página (default: 20)
 * - search: búsqueda por nombre, dirección, provincia, municipio
 * - cliente_id: filtrar por cliente específico
 *
 * Permisos: ADMIN, SUPERVISOR, CONSULTA
 *
 * @param req - Express Request
 * @param res - Express Response
 */
export async function getUbicacionesController(
  req: Request,
  res: Response
): Promise<void> {
  try {
    // Validar query params
    const queryValidation = ubicacionesPaginationQuerySchema.safeParse(req.query);

    if (!queryValidation.success) {
      res.status(400).json({
        error: 'Parámetros de consulta inválidos',
        message: 'Los parámetros de paginación o filtro son incorrectos',
        details: formatZodErrors(queryValidation.error)
      });
      return;
    }

    const { page, pageSize, search, cliente_id } = queryValidation.data;

    // Llamar al servicio
    const result = await getUbicaciones(page, pageSize, search, cliente_id);

    // Retornar respuesta exitosa
    res.status(200).json(result);
  } catch (error) {
    console.error('Error en getUbicacionesController:', error);

    res.status(500).json({
      error: 'Error interno del servidor',
      message: 'Ocurrió un error al obtener las ubicaciones',
      details: process.env.NODE_ENV === 'development' ? error : undefined
    });
  }
}

/**
 * GET /api/ubicaciones/:id
 *
 * Obtiene una ubicación por su ID con información adicional
 * (nombre del cliente, cantidad de puestos activos)
 *
 * Params:
 * - id: ID de la ubicación
 *
 * Permisos: ADMIN, SUPERVISOR, CONSULTA
 *
 * @param req - Express Request
 * @param res - Express Response
 */
export async function getUbicacionByIdController(
  req: Request,
  res: Response
): Promise<void> {
  try {
    // Validar parámetro ID
    const paramValidation = ubicacionIdParamSchema.safeParse(req.params);

    if (!paramValidation.success) {
      res.status(400).json({
        error: 'Parámetro inválido',
        message: 'El ID de ubicación proporcionado es inválido',
        details: formatZodErrors(paramValidation.error)
      });
      return;
    }

    const { id } = paramValidation.data;

    // Llamar al servicio
    const ubicacion = await getUbicacionById(id);

    // Retornar respuesta exitosa
    res.status(200).json(ubicacion);
  } catch (error: any) {
    console.error('Error en getUbicacionByIdController:', error);

    // Error específico: ubicación no encontrada
    if (error.message && error.message.includes('no encontrada')) {
      res.status(404).json({
        error: 'No encontrado',
        message: error.message
      });
      return;
    }

    // Error genérico
    res.status(500).json({
      error: 'Error interno del servidor',
      message: 'Ocurrió un error al obtener la ubicación',
      details: process.env.NODE_ENV === 'development' ? error : undefined
    });
  }
}

/**
 * POST /api/ubicaciones
 *
 * Crea una nueva ubicación
 *
 * Body:
 * - cliente_id: ID del cliente (requerido)
 * - codigo: código único dentro del cliente (requerido)
 * - nombre: nombre de la ubicación (requerido)
 * - direccion, provincia, municipio, sector: opcionales
 * - coordenadas_gps: formato "latitud,longitud" (opcional)
 * - telefono, contacto_nombre, contacto_telefono: opcionales
 *
 * Permisos: ADMIN, SUPERVISOR
 *
 * @param req - Express Request
 * @param res - Express Response
 */
export async function createUbicacionController(
  req: Request,
  res: Response
): Promise<void> {
  try {
    // Validar body
    const bodyValidation = createUbicacionSchema.safeParse(req.body);

    if (!bodyValidation.success) {
      res.status(400).json({
        error: 'Datos de entrada inválidos',
        message: 'Los datos proporcionados para crear la ubicación son incorrectos',
        details: formatZodErrors(bodyValidation.error)
      });
      return;
    }

    const dto = bodyValidation.data;

    // Llamar al servicio
    const ubicacion = await createUbicacion(dto);

    // Retornar respuesta exitosa
    res.status(201).json(ubicacion);
  } catch (error: any) {
    console.error('Error en createUbicacionController:', error);

    // Errores específicos de validación de negocio
    if (error.message) {
      // Cliente no existe o inactivo
      if (error.message.includes('no existe o está inactivo')) {
        res.status(400).json({
          error: 'Validación fallida',
          message: error.message
        });
        return;
      }

      // Código duplicado
      if (error.message.includes('ya existe para este cliente')) {
        res.status(400).json({
          error: 'Código duplicado',
          message: error.message
        });
        return;
      }
    }

    // Error genérico
    res.status(500).json({
      error: 'Error interno del servidor',
      message: 'Ocurrió un error al crear la ubicación',
      details: process.env.NODE_ENV === 'development' ? error : undefined
    });
  }
}

/**
 * PUT /api/ubicaciones/:id
 *
 * Actualiza una ubicación existente
 *
 * Params:
 * - id: ID de la ubicación
 *
 * Body:
 * - codigo, nombre, direccion, provincia, municipio, sector: opcionales
 * - coordenadas_gps: formato "latitud,longitud" (opcional)
 * - telefono, contacto_nombre, contacto_telefono: opcionales
 * - activo: boolean (opcional)
 *
 * Nota: cliente_id NO se puede cambiar
 *
 * Permisos: ADMIN, SUPERVISOR
 *
 * @param req - Express Request
 * @param res - Express Response
 */
export async function updateUbicacionController(
  req: Request,
  res: Response
): Promise<void> {
  try {
    // Validar parámetro ID
    const paramValidation = ubicacionIdParamSchema.safeParse(req.params);

    if (!paramValidation.success) {
      res.status(400).json({
        error: 'Parámetro inválido',
        message: 'El ID de ubicación proporcionado es inválido',
        details: formatZodErrors(paramValidation.error)
      });
      return;
    }

    const { id } = paramValidation.data;

    // Validar body
    const bodyValidation = updateUbicacionSchema.safeParse(req.body);

    if (!bodyValidation.success) {
      res.status(400).json({
        error: 'Datos de entrada inválidos',
        message: 'Los datos proporcionados para actualizar la ubicación son incorrectos',
        details: formatZodErrors(bodyValidation.error)
      });
      return;
    }

    const dto = bodyValidation.data;

    // Llamar al servicio
    const ubicacion = await updateUbicacion(id, dto);

    // Retornar respuesta exitosa
    res.status(200).json(ubicacion);
  } catch (error: any) {
    console.error('Error en updateUbicacionController:', error);

    // Errores específicos de validación de negocio
    if (error.message) {
      // Ubicación no encontrada
      if (error.message.includes('no encontrada')) {
        res.status(404).json({
          error: 'No encontrado',
          message: error.message
        });
        return;
      }

      // Código duplicado
      if (error.message.includes('ya existe para este cliente')) {
        res.status(400).json({
          error: 'Código duplicado',
          message: error.message
        });
        return;
      }
    }

    // Error genérico
    res.status(500).json({
      error: 'Error interno del servidor',
      message: 'Ocurrió un error al actualizar la ubicación',
      details: process.env.NODE_ENV === 'development' ? error : undefined
    });
  }
}

/**
 * DELETE /api/ubicaciones/:id
 *
 * Elimina una ubicación (soft delete: activo = false)
 *
 * Validación: No se puede eliminar si tiene puestos activos
 *
 * Params:
 * - id: ID de la ubicación
 *
 * Permisos: ADMIN (solo administradores)
 *
 * @param req - Express Request
 * @param res - Express Response
 */
export async function deleteUbicacionController(
  req: Request,
  res: Response
): Promise<void> {
  try {
    // Validar parámetro ID
    const paramValidation = ubicacionIdParamSchema.safeParse(req.params);

    if (!paramValidation.success) {
      res.status(400).json({
        error: 'Parámetro inválido',
        message: 'El ID de ubicación proporcionado es inválido',
        details: formatZodErrors(paramValidation.error)
      });
      return;
    }

    const { id } = paramValidation.data;

    // Llamar al servicio
    await deleteUbicacion(id);

    // Retornar respuesta exitosa
    res.status(200).json({
      message: 'Ubicación desactivada exitosamente'
    });
  } catch (error: any) {
    console.error('Error en deleteUbicacionController:', error);

    // Errores específicos de validación de negocio
    if (error.message) {
      // Ubicación no encontrada
      if (error.message.includes('no encontrada')) {
        res.status(404).json({
          error: 'No encontrado',
          message: error.message
        });
        return;
      }

      // Tiene puestos activos
      if (error.message.includes('tiene') && error.message.includes('puesto')) {
        res.status(400).json({
          error: 'Validación fallida',
          message: error.message
        });
        return;
      }
    }

    // Error genérico
    res.status(500).json({
      error: 'Error interno del servidor',
      message: 'Ocurrió un error al eliminar la ubicación',
      details: process.env.NODE_ENV === 'development' ? error : undefined
    });
  }
}
