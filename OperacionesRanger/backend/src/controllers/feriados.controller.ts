/**
 * Controladores HTTP: Feriados
 *
 * Controladores para manejar peticiones HTTP de endpoints de feriados.
 * Validan inputs, llaman a servicios, y formatean respuestas.
 *
 * @module controllers/feriados.controller
 */

import { Request, Response } from 'express';
import { ZodError } from 'zod';
import * as FeriadosService from '../services/feriados.service';
import {
  feriadoCreateSchema,
  feriadoUpdateSchema,
  feriadoIdParamSchema,
  feriadoFechaParamSchema,
  feriadoQuerySchema,
} from '../schemas/feriado.schema';

/**
 * GET /api/feriados
 *
 * Obtener todos los feriados con paginación y filtros
 *
 * **Query params**:
 * - page: número de página (default: 1)
 * - pageSize: registros por página (default: 10, max: 100)
 * - año: filtrar por año (ej: 2026)
 * - tipo: filtrar por tipo (NACIONAL o DECRETO)
 *
 * **Respuesta**: 200 OK con lista paginada de feriados
 *
 * @example
 * ```
 * GET /api/feriados?año=2026&tipo=NACIONAL&page=1&pageSize=10
 * ```
 */
export async function getAllFeriados(
  req: Request,
  res: Response
): Promise<void> {
  try {
    // Validar query params
    const query = feriadoQuerySchema.parse(req.query);

    // Llamar al servicio
    const resultado = await FeriadosService.getAll(query);

    res.status(200).json(resultado);
  } catch (error) {
    if (error instanceof ZodError) {
      res.status(400).json({
        error: 'Parámetros de búsqueda inválidos',
        details: error.issues,
      });
      return;
    }

    console.error('[FeriadosController] Error en getAllFeriados:', error);
    res.status(500).json({
      error: 'Error interno del servidor',
      message: 'Error al obtener feriados',
    });
  }
}

/**
 * GET /api/feriados/:id
 *
 * Obtener un feriado por ID
 *
 * **Respuestas**:
 * - 200 OK: feriado encontrado
 * - 404 Not Found: feriado no existe
 * - 400 Bad Request: ID inválido
 *
 * @example
 * ```
 * GET /api/feriados/1
 * ```
 */
export async function getFeriadoById(
  req: Request,
  res: Response
): Promise<void> {
  try {
    // Validar parámetro ID
    const { id } = feriadoIdParamSchema.parse(req.params);

    // Llamar al servicio
    const feriado = await FeriadosService.getById(id);

    if (!feriado) {
      res.status(404).json({
        error: 'No encontrado',
        message: `Feriado con ID ${id} no existe`,
      });
      return;
    }

    res.status(200).json(feriado);
  } catch (error) {
    if (error instanceof ZodError) {
      res.status(400).json({
        error: 'ID inválido',
        details: error.issues,
      });
      return;
    }

    console.error('[FeriadosController] Error en getFeriadoById:', error);
    res.status(500).json({
      error: 'Error interno del servidor',
      message: 'Error al obtener feriado',
    });
  }
}

/**
 * GET /api/feriados/verificar/:fecha
 *
 * Verificar si una fecha es feriado usando stored procedure
 *
 * **Respuestas**:
 * - 200 OK: verificación exitosa (siempre retorna 200, aunque no sea feriado)
 * - 400 Bad Request: fecha inválida
 *
 * **Respuesta**:
 * ```json
 * {
 *   "fecha": "2026-01-01",
 *   "es_feriado": true,
 *   "feriado": {
 *     "id": 1,
 *     "nombre": "Año Nuevo",
 *     "tipo": "NACIONAL"
 *   }
 * }
 * ```
 *
 * @example
 * ```
 * GET /api/feriados/verificar/2026-01-01
 * ```
 */
export async function verificarFeriado(
  req: Request,
  res: Response
): Promise<void> {
  try {
    // Validar parámetro fecha
    const { fecha } = feriadoFechaParamSchema.parse(req.params);

    // Llamar al servicio (usa stored procedure)
    const resultado = await FeriadosService.verificarFeriado(fecha);

    res.status(200).json(resultado);
  } catch (error) {
    if (error instanceof ZodError) {
      res.status(400).json({
        error: 'Fecha inválida',
        details: error.issues,
      });
      return;
    }

    console.error('[FeriadosController] Error en verificarFeriado:', error);
    res.status(500).json({
      error: 'Error interno del servidor',
      message: 'Error al verificar feriado',
    });
  }
}

/**
 * POST /api/feriados
 *
 * Crear un nuevo feriado
 *
 * **Body**:
 * ```json
 * {
 *   "fecha": "2026-12-25",
 *   "nombre": "Día de Navidad",
 *   "tipo": "NACIONAL",
 *   "descripcion": "Celebración del nacimiento de Jesucristo"
 * }
 * ```
 *
 * **Respuestas**:
 * - 201 Created: feriado creado exitosamente
 * - 400 Bad Request: datos inválidos
 * - 409 Conflict: fecha ya existe
 *
 * @example
 * ```
 * POST /api/feriados
 * Content-Type: application/json
 * ```
 */
export async function createFeriado(
  req: Request,
  res: Response
): Promise<void> {
  try {
    // Validar body
    const data = feriadoCreateSchema.parse(req.body);

    // Llamar al servicio
    const feriadoCreado = await FeriadosService.create(data);

    res.status(201).json({
      message: 'Feriado creado exitosamente',
      data: feriadoCreado,
    });
  } catch (error: any) {
    if (error instanceof ZodError) {
      res.status(400).json({
        error: 'Datos inválidos',
        details: error.issues,
      });
      return;
    }

    // Error de duplicado (fecha ya existe)
    if (error.statusCode === 409) {
      res.status(409).json({
        error: 'Conflicto',
        message: error.message,
      });
      return;
    }

    console.error('[FeriadosController] Error en createFeriado:', error);
    res.status(500).json({
      error: 'Error interno del servidor',
      message: 'Error al crear feriado',
    });
  }
}

/**
 * PUT /api/feriados/:id
 *
 * Actualizar un feriado existente
 *
 * **Body** (todos los campos son opcionales):
 * ```json
 * {
 *   "nombre": "Año Nuevo (actualizado)",
 *   "descripcion": "Primer día del año calendario"
 * }
 * ```
 *
 * **Respuestas**:
 * - 200 OK: feriado actualizado exitosamente
 * - 404 Not Found: feriado no existe
 * - 400 Bad Request: datos inválidos o ID inválido
 * - 409 Conflict: nueva fecha ya existe
 *
 * @example
 * ```
 * PUT /api/feriados/1
 * Content-Type: application/json
 * ```
 */
export async function updateFeriado(
  req: Request,
  res: Response
): Promise<void> {
  try {
    // Validar parámetro ID
    const { id } = feriadoIdParamSchema.parse(req.params);

    // Validar body
    const data = feriadoUpdateSchema.parse(req.body);

    // Llamar al servicio
    const feriadoActualizado = await FeriadosService.update(id, data);

    if (!feriadoActualizado) {
      res.status(404).json({
        error: 'No encontrado',
        message: `Feriado con ID ${id} no existe`,
      });
      return;
    }

    res.status(200).json({
      message: 'Feriado actualizado exitosamente',
      data: feriadoActualizado,
    });
  } catch (error: any) {
    if (error instanceof ZodError) {
      res.status(400).json({
        error: 'Datos inválidos',
        details: error.issues,
      });
      return;
    }

    // Error de duplicado (fecha ya existe)
    if (error.statusCode === 409) {
      res.status(409).json({
        error: 'Conflicto',
        message: error.message,
      });
      return;
    }

    console.error('[FeriadosController] Error en updateFeriado:', error);
    res.status(500).json({
      error: 'Error interno del servidor',
      message: 'Error al actualizar feriado',
    });
  }
}

/**
 * DELETE /api/feriados/:id
 *
 * Eliminar un feriado (hard delete)
 *
 * **Respuestas**:
 * - 200 OK: feriado eliminado exitosamente
 * - 404 Not Found: feriado no existe
 * - 400 Bad Request: ID inválido
 *
 * @example
 * ```
 * DELETE /api/feriados/1
 * ```
 */
export async function deleteFeriado(
  req: Request,
  res: Response
): Promise<void> {
  try {
    // Validar parámetro ID
    const { id } = feriadoIdParamSchema.parse(req.params);

    // Llamar al servicio
    const eliminado = await FeriadosService.deleteFeriado(id);

    if (!eliminado) {
      res.status(404).json({
        error: 'No encontrado',
        message: `Feriado con ID ${id} no existe`,
      });
      return;
    }

    res.status(200).json({
      message: 'Feriado eliminado exitosamente',
    });
  } catch (error) {
    if (error instanceof ZodError) {
      res.status(400).json({
        error: 'ID inválido',
        details: error.issues,
      });
      return;
    }

    console.error('[FeriadosController] Error en deleteFeriado:', error);
    res.status(500).json({
      error: 'Error interno del servidor',
      message: 'Error al eliminar feriado',
    });
  }
}
