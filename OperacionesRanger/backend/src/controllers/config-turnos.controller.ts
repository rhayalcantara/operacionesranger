/**
 * Controladores de Configuración de Turnos
 * Sistema de Gestión de Turnos - OperacionesRanger
 *
 * Este archivo contiene los handlers de rutas HTTP para endpoints
 * de configuración de turnos (horarios DIURNO y NOCTURNO).
 *
 * Endpoints:
 * - GET /api/configuracion-turnos - Obtener todas las configuraciones
 * - GET /api/configuracion-turnos/:id - Obtener configuración por ID
 * - PUT /api/configuracion-turnos/:id - Actualizar configuración (solo ADMIN)
 */

import { Request, Response } from 'express';
import * as configTurnosService from '../services/config-turnos.service';
import {
  updateConfigTurnoSchema,
  configTurnoIdParamSchema,
  formatZodErrors
} from '../schemas/config-turnos.schema';

// ============================================================================
// HANDLERS DE RUTAS
// ============================================================================

/**
 * GET /api/configuracion-turnos
 *
 * Obtener todas las configuraciones de turnos (DIURNO y NOCTURNO).
 * Siempre retorna 2 configuraciones.
 *
 * **Permisos**: Todos los usuarios autenticados
 *
 * **Response**:
 * ```json
 * {
 *   "data": [
 *     {
 *       "id": 1,
 *       "tipo_turno": "DIURNO",
 *       "hora_inicio": "06:00:00",
 *       "hora_fin": "18:00:00",
 *       "descripcion": "Turno diurno: 6:00 AM a 6:00 PM",
 *       "activo": true,
 *       "created_at": "2026-01-17T12:00:00.000Z",
 *       "updated_at": "2026-01-17T12:00:00.000Z"
 *     },
 *     {
 *       "id": 2,
 *       "tipo_turno": "NOCTURNO",
 *       "hora_inicio": "18:00:00",
 *       "hora_fin": "06:00:00",
 *       "descripcion": "Turno nocturno: 6:00 PM a 6:00 AM",
 *       "activo": true,
 *       "created_at": "2026-01-17T12:00:00.000Z",
 *       "updated_at": "2026-01-17T12:00:00.000Z"
 *     }
 *   ],
 *   "total": 2
 * }
 * ```
 *
 * **Errores**:
 * - 401: Usuario no autenticado
 * - 500: Error del servidor
 */
export async function getConfiguraciones(
  _req: Request,
  res: Response
): Promise<void> {
  try {
    console.log('[ConfigTurnosController] GET /api/configuracion-turnos');

    const result = await configTurnosService.getAllConfiguraciones();

    res.status(200).json(result);
  } catch (error) {
    console.error('[ConfigTurnosController] Error al obtener configuraciones:', error);

    res.status(500).json({
      error: 'Error interno del servidor',
      message: 'No se pudieron obtener las configuraciones de turnos'
    });
  }
}

/**
 * GET /api/configuracion-turnos/:id
 *
 * Obtener una configuración de turno específica por ID.
 *
 * **Permisos**: Todos los usuarios autenticados
 *
 * **Parámetros**:
 * - `id` (path): ID de la configuración (1 o 2)
 *
 * **Response**:
 * ```json
 * {
 *   "id": 1,
 *   "tipo_turno": "DIURNO",
 *   "hora_inicio": "06:00:00",
 *   "hora_fin": "18:00:00",
 *   "descripcion": "Turno diurno: 6:00 AM a 6:00 PM",
 *   "activo": true,
 *   "created_at": "2026-01-17T12:00:00.000Z",
 *   "updated_at": "2026-01-17T12:00:00.000Z"
 * }
 * ```
 *
 * **Errores**:
 * - 400: ID inválido
 * - 401: Usuario no autenticado
 * - 404: Configuración no encontrada
 * - 500: Error del servidor
 */
export async function getConfiguracionById(
  req: Request,
  res: Response
): Promise<void> {
  try {
    console.log(`[ConfigTurnosController] GET /api/configuracion-turnos/${req.params.id}`);

    // Validar parámetro ID
    const validationResult = configTurnoIdParamSchema.safeParse(req.params);

    if (!validationResult.success) {
      console.debug('[ConfigTurnosController] Validación de ID fallida:', validationResult.error);

      res.status(400).json({
        error: 'Parámetro inválido',
        message: 'ID de configuración inválido',
        details: formatZodErrors(validationResult.error)
      });
      return;
    }

    const { id } = validationResult.data;

    // Obtener configuración
    const result = await configTurnosService.getConfiguracionById(id);

    res.status(200).json(result);
  } catch (error) {
    console.error('[ConfigTurnosController] Error al obtener configuración:', error);

    // Distinguir entre not found y error del servidor
    if (error instanceof Error && error.message.includes('no encontrada')) {
      res.status(404).json({
        error: 'No encontrado',
        message: error.message
      });
      return;
    }

    res.status(500).json({
      error: 'Error interno del servidor',
      message: 'No se pudo obtener la configuración de turno'
    });
  }
}

/**
 * PUT /api/configuracion-turnos/:id
 *
 * Actualizar una configuración de turno.
 *
 * **Permisos**: Solo ADMIN
 *
 * **Parámetros**:
 * - `id` (path): ID de la configuración (1 o 2)
 *
 * **Body**:
 * ```json
 * {
 *   "hora_inicio": "07:00:00",
 *   "hora_fin": "19:00:00",
 *   "descripcion": "Turno diurno actualizado",
 *   "activo": true
 * }
 * ```
 *
 * Todos los campos son opcionales, pero al menos uno debe ser proporcionado.
 * Si se actualizan horarios (hora_inicio o hora_fin), ambos deben ser proporcionados.
 *
 * **Validaciones**:
 * - Los horarios deben tener formato TIME válido (HH:MM:SS o HH:MM)
 * - Los horarios deben ser complementarios con el otro turno
 * - Los horarios deben cubrir exactamente 24 horas
 *
 * **Response**:
 * ```json
 * {
 *   "message": "Configuración actualizada exitosamente",
 *   "data": {
 *     "id": 1,
 *     "tipo_turno": "DIURNO",
 *     "hora_inicio": "07:00:00",
 *     "hora_fin": "19:00:00",
 *     "descripcion": "Turno diurno actualizado",
 *     "activo": true,
 *     "created_at": "2026-01-17T12:00:00.000Z",
 *     "updated_at": "2026-01-18T15:30:00.000Z"
 *   }
 * }
 * ```
 *
 * **Errores**:
 * - 400: Datos de entrada inválidos o validación de horarios fallida
 * - 401: Usuario no autenticado
 * - 403: Usuario sin permisos (no ADMIN)
 * - 404: Configuración no encontrada
 * - 500: Error del servidor
 */
export async function updateConfiguracion(
  req: Request,
  res: Response
): Promise<void> {
  try {
    console.log(`[ConfigTurnosController] PUT /api/configuracion-turnos/${req.params.id}`);
    console.debug('[ConfigTurnosController] Body:', req.body);

    // 1. Validar parámetro ID
    const paramValidation = configTurnoIdParamSchema.safeParse(req.params);

    if (!paramValidation.success) {
      console.debug('[ConfigTurnosController] Validación de ID fallida:', paramValidation.error);

      res.status(400).json({
        error: 'Parámetro inválido',
        message: 'ID de configuración inválido',
        details: formatZodErrors(paramValidation.error)
      });
      return;
    }

    const { id } = paramValidation.data;

    // 2. Validar body
    const bodyValidation = updateConfigTurnoSchema.safeParse(req.body);

    if (!bodyValidation.success) {
      console.debug('[ConfigTurnosController] Validación de body fallida:', bodyValidation.error);

      res.status(400).json({
        error: 'Datos inválidos',
        message: 'Los datos proporcionados no son válidos',
        details: formatZodErrors(bodyValidation.error)
      });
      return;
    }

    const updateData = bodyValidation.data;

    // 3. Actualizar configuración
    const result = await configTurnosService.updateConfiguracion(id, updateData as any);

    console.log(`[ConfigTurnosController] Configuración ${id} actualizada exitosamente`);

    res.status(200).json({
      message: 'Configuración actualizada exitosamente',
      data: result
    });
  } catch (error) {
    console.error('[ConfigTurnosController] Error al actualizar configuración:', error);

    // Distinguir tipos de errores

    // Error de validación de negocio (ej: horarios incompatibles)
    if (
      error instanceof Error &&
      (error.message.includes('debe terminar') ||
        error.message.includes('debe empezar') ||
        error.message.includes('complementarios') ||
        error.message.includes('24 horas'))
    ) {
      res.status(400).json({
        error: 'Validación fallida',
        message: error.message
      });
      return;
    }

    // Error de not found
    if (error instanceof Error && error.message.includes('no encontrada')) {
      res.status(404).json({
        error: 'No encontrado',
        message: error.message
      });
      return;
    }

    // Error de formato de hora inválido
    if (error instanceof Error && error.message.includes('Formato de hora inválido')) {
      res.status(400).json({
        error: 'Formato inválido',
        message: error.message
      });
      return;
    }

    // Error genérico del servidor
    res.status(500).json({
      error: 'Error interno del servidor',
      message: 'No se pudo actualizar la configuración de turno'
    });
  }
}

// ============================================================================
// EXPORTACIONES
// ============================================================================

/**
 * Exportar todos los controladores
 */
export const configTurnosControllers = {
  getConfiguraciones,
  getConfiguracionById,
  updateConfiguracion
} as const;
