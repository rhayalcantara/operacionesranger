/**
 * Rutas de Configuración de Turnos
 * Sistema de Gestión de Turnos - OperacionesRanger
 *
 * Este archivo define las rutas HTTP para gestión de configuración de turnos.
 *
 * Endpoints:
 * - GET    /api/configuracion-turnos        - Obtener todas (todos autenticados)
 * - GET    /api/configuracion-turnos/:id    - Obtener por ID (todos autenticados)
 * - PUT    /api/configuracion-turnos/:id    - Actualizar (solo ADMIN)
 *
 * NO implementado:
 * - POST   /api/configuracion-turnos        - Crear (no permitido, solo 2 registros)
 * - DELETE /api/configuracion-turnos/:id    - Eliminar (no permitido, solo 2 registros)
 */

import { Router } from 'express';
import { authMiddleware } from '../middlewares/auth.middleware';
import { requireRole } from '../middlewares/role.middleware';
import { auditMiddleware } from '../middlewares/audit.middleware';
import { validateBody, validateParams } from '../middlewares/validation.middleware';
import { UserRole } from '../models/auth.model';
import {
  updateConfigTurnoSchema,
  configTurnoIdParamSchema
} from '../schemas/config-turnos.schema';
import * as configTurnosController from '../controllers/config-turnos.controller';

/**
 * Router de configuración de turnos
 */
const router = Router();

// ============================================================================
// RUTAS PÚBLICAS (REQUIEREN AUTENTICACIÓN)
// ============================================================================

/**
 * @swagger
 * /api/configuracion-turnos:
 *   get:
 *     summary: Obtener todas las configuraciones de turnos
 *     description: Obtiene las dos configuraciones de turnos del sistema (DIURNO y NOCTURNO) con sus horarios y descripciones. Solo existen 2 registros fijos.
 *     tags: [Configuración Turnos]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Configuraciones obtenidas exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/ConfiguracionTurno'
 *                   minItems: 2
 *                   maxItems: 2
 *                 total:
 *                   type: integer
 *                   example: 2
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.get(
  '/',
  authMiddleware,
  configTurnosController.getConfiguraciones
);

/**
 * @swagger
 * /api/configuracion-turnos/{id}:
 *   get:
 *     summary: Obtener configuración de turno por ID
 *     description: Obtiene una configuración específica de turno (DIURNO o NOCTURNO) con todos sus detalles. Solo existen configuraciones con ID 1 y 2.
 *     tags: [Configuración Turnos]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *           enum: [1, 2]
 *           example: 1
 *         description: ID de la configuración (1 = DIURNO, 2 = NOCTURNO)
 *     responses:
 *       200:
 *         description: Configuración encontrada exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ConfiguracionTurno'
 *       400:
 *         description: ID inválido (debe ser 1 o 2)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ValidationError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       404:
 *         description: Configuración no encontrada
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.get(
  '/:id',
  authMiddleware,
  validateParams(configTurnoIdParamSchema),
  configTurnosController.getConfiguracionById
);

// ============================================================================
// RUTAS RESTRINGIDAS (SOLO ADMIN)
// ============================================================================

/**
 * @swagger
 * /api/configuracion-turnos/{id}:
 *   put:
 *     summary: Actualizar configuración de turno
 *     description: |
 *       Actualiza los horarios y descripción de una configuración de turno. Solo ADMIN puede modificar.
 *
 *       **Validaciones importantes:**
 *       - Si actualiza horarios, ambos (hora_inicio y hora_fin) deben ser proporcionados
 *       - Los horarios deben ser complementarios con el otro turno
 *       - Los dos turnos deben cubrir exactamente 24 horas
 *       - El tipo_turno (DIURNO/NOCTURNO) NO se puede modificar
 *     tags: [Configuración Turnos]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *           enum: [1, 2]
 *           example: 1
 *         description: ID de la configuración a actualizar (1 = DIURNO, 2 = NOCTURNO)
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               hora_inicio:
 *                 type: string
 *                 format: time
 *                 example: '07:00:00'
 *                 pattern: '^([0-1][0-9]|2[0-3]):[0-5][0-9](:[0-5][0-9])?$'
 *                 description: Hora de inicio del turno (formato HH:MM:SS o HH:MM)
 *               hora_fin:
 *                 type: string
 *                 format: time
 *                 example: '19:00:00'
 *                 pattern: '^([0-1][0-9]|2[0-3]):[0-5][0-9](:[0-5][0-9])?$'
 *                 description: Hora de fin del turno (formato HH:MM:SS o HH:MM)
 *               descripcion:
 *                 type: string
 *                 example: 'Turno diurno actualizado de 7:00 AM a 7:00 PM'
 *                 maxLength: 100
 *                 description: Descripción del turno
 *               activo:
 *                 type: boolean
 *                 example: true
 *                 description: Estado activo/inactivo de la configuración
 *           examples:
 *             actualizarHorario:
 *               summary: Actualizar horarios del turno diurno
 *               value:
 *                 hora_inicio: '07:00:00'
 *                 hora_fin: '19:00:00'
 *                 descripcion: 'Turno diurno de 7:00 AM a 7:00 PM'
 *             actualizarDescripcion:
 *               summary: Actualizar solo descripción
 *               value:
 *                 descripcion: 'Turno diurno actualizado'
 *     responses:
 *       200:
 *         description: Configuración actualizada exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: 'Configuración actualizada exitosamente'
 *                 data:
 *                   $ref: '#/components/schemas/ConfiguracionTurno'
 *       400:
 *         description: Error de validación (horarios incompatibles, formato inválido, etc.)
 *         content:
 *           application/json:
 *             schema:
 *               oneOf:
 *                 - $ref: '#/components/schemas/ValidationError'
 *                 - type: object
 *                   properties:
 *                     error:
 *                       type: string
 *                       example: 'Validación fallida'
 *                     message:
 *                       type: string
 *                       example: 'El turno DIURNO debe terminar (19:00:00) donde empieza el turno NOCTURNO (18:00:00)'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         description: Acceso denegado (requiere rol ADMIN)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: Configuración no encontrada
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.put(
  '/:id',
  authMiddleware,
  requireRole(UserRole.ADMIN),
  auditMiddleware('ot_configuracion_turnos'),
  validateParams(configTurnoIdParamSchema),
  validateBody(updateConfigTurnoSchema),
  configTurnosController.updateConfiguracion
);

// ============================================================================
// MÉTODOS NO PERMITIDOS
// ============================================================================

/**
 * POST /api/configuracion-turnos
 *
 * NO IMPLEMENTADO - Crear configuración no permitido.
 *
 * Solo existen 2 configuraciones (DIURNO y NOCTURNO) que ya están creadas
 * en el schema de la base de datos. No se permiten crear nuevas.
 *
 * **Response 405**: Method Not Allowed
 */
router.post(
  '/',
  (_req, res) => {
    res.status(405).json({
      error: 'Método no permitido',
      message: 'No se pueden crear nuevas configuraciones. ' +
               'Solo existen 2 configuraciones (DIURNO y NOCTURNO) que no se crean ni eliminan.'
    });
  }
);

/**
 * DELETE /api/configuracion-turnos/:id
 *
 * NO IMPLEMENTADO - Eliminar configuración no permitido.
 *
 * Las configuraciones DIURNO y NOCTURNO son esenciales para el sistema
 * y no pueden ser eliminadas. Solo pueden ser actualizadas.
 *
 * **Response 405**: Method Not Allowed
 */
router.delete(
  '/:id',
  (_req, res) => {
    res.status(405).json({
      error: 'Método no permitido',
      message: 'No se pueden eliminar configuraciones. ' +
               'Las configuraciones DIURNO y NOCTURNO son esenciales para el sistema.'
    });
  }
);

// ============================================================================
// EXPORTAR ROUTER
// ============================================================================

export default router;
