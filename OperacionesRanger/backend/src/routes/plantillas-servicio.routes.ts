/**
 * Rutas de Plantillas de Servicio
 * Sistema de Gestión de Turnos - OperacionesRanger
 *
 * Define las rutas HTTP para la gestión de plantillas de servicio.
 * Todas las rutas están protegidas por autenticación JWT y controladas
 * por roles de usuario.
 *
 * @module routes/plantillas-servicio.routes
 */

import { Router } from 'express';
import { authMiddleware } from '../middlewares/auth.middleware';
import { requireRole } from '../middlewares/role.middleware';
import { auditMiddleware } from '../middlewares/audit.middleware';
import { validateQuery, validateParams, validateBody } from '../middlewares/validation.middleware';
import {
  createPlantillaServicioSchema,
  updatePlantillaServicioSchema,
  plantillaServicioIdSchema,
  getPlantillasServicioQuerySchema,
} from '../schemas/plantilla-servicio.schema';
import {
  getPlantillasServicioController,
  getPlantillaServicioByIdController,
  createPlantillaServicioController,
  updatePlantillaServicioController,
  deletePlantillaServicioController,
} from '../controllers/plantillas-servicio.controller';

const router = Router();

// ============================================================================
// RUTAS DE CONSULTA (GET)
// ============================================================================

/**
 * @swagger
 * /api/plantillas-servicio:
 *   get:
 *     summary: Listar plantillas de servicio con paginación y filtros
 *     description: Obtiene lista paginada de plantillas de servicio con conteo de detalles
 *     tags: [Plantillas de Servicio]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *           minimum: 1
 *         description: Número de página
 *       - in: query
 *         name: pageSize
 *         schema:
 *           type: integer
 *           default: 10
 *           minimum: 1
 *           maximum: 100
 *         description: Cantidad de registros por página
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Búsqueda por nombre o descripción
 *       - in: query
 *         name: activo
 *         schema:
 *           type: boolean
 *         description: Filtrar por estado activo
 *     responses:
 *       200:
 *         description: Lista de plantillas obtenida exitosamente
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.get(
  '/',
  authMiddleware,
  requireRole('ADMIN', 'SUPERVISOR', 'CONSULTA'),
  validateQuery(getPlantillasServicioQuerySchema),
  getPlantillasServicioController
);

/**
 * @swagger
 * /api/plantillas-servicio/{id}:
 *   get:
 *     summary: Obtener plantilla de servicio por ID con detalles
 *     description: Obtiene una plantilla con sus detalles incluyendo nombre de puesto, código y tipo de turno del servicio
 *     tags: [Plantillas de Servicio]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *           minimum: 1
 *         description: ID de la plantilla
 *     responses:
 *       200:
 *         description: Plantilla encontrada exitosamente
 *       404:
 *         description: Plantilla no encontrada
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.get(
  '/:id',
  authMiddleware,
  requireRole('ADMIN', 'SUPERVISOR', 'CONSULTA'),
  validateParams(plantillaServicioIdSchema),
  getPlantillaServicioByIdController
);

// ============================================================================
// RUTAS DE MODIFICACIÓN (POST, PUT, DELETE)
// ============================================================================

/**
 * @swagger
 * /api/plantillas-servicio:
 *   post:
 *     summary: Crear nueva plantilla de servicio
 *     description: Crea una plantilla con sus detalles en una transacción. Valida nombre único y detalles no duplicados.
 *     tags: [Plantillas de Servicio]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - nombre
 *               - detalles
 *             properties:
 *               nombre:
 *                 type: string
 *                 maxLength: 100
 *               descripcion:
 *                 type: string
 *                 maxLength: 500
 *                 nullable: true
 *               detalles:
 *                 type: array
 *                 minItems: 1
 *                 items:
 *                   type: object
 *                   required:
 *                     - puesto_id
 *                     - servicio_puesto_id
 *                   properties:
 *                     puesto_id:
 *                       type: integer
 *                     servicio_puesto_id:
 *                       type: integer
 *     responses:
 *       201:
 *         description: Plantilla creada exitosamente
 *       400:
 *         description: Error de validación o duplicado
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.post(
  '/',
  authMiddleware,
  requireRole('ADMIN', 'SUPERVISOR'),
  auditMiddleware('ot_plantillas_servicio'),
  validateBody(createPlantillaServicioSchema),
  createPlantillaServicioController
);

/**
 * @swagger
 * /api/plantillas-servicio/{id}:
 *   put:
 *     summary: Actualizar plantilla de servicio existente
 *     description: Actualiza header y/o detalles. Si se proporcionan detalles, reemplaza todos los existentes.
 *     tags: [Plantillas de Servicio]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *           minimum: 1
 *         description: ID de la plantilla a actualizar
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               nombre:
 *                 type: string
 *                 maxLength: 100
 *               descripcion:
 *                 type: string
 *                 maxLength: 500
 *                 nullable: true
 *               detalles:
 *                 type: array
 *                 minItems: 1
 *                 items:
 *                   type: object
 *                   required:
 *                     - puesto_id
 *                     - servicio_puesto_id
 *                   properties:
 *                     puesto_id:
 *                       type: integer
 *                     servicio_puesto_id:
 *                       type: integer
 *     responses:
 *       200:
 *         description: Plantilla actualizada exitosamente
 *       400:
 *         description: Error de validación o duplicado
 *       404:
 *         description: Plantilla no encontrada
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.put(
  '/:id',
  authMiddleware,
  requireRole('ADMIN', 'SUPERVISOR'),
  auditMiddleware('ot_plantillas_servicio'),
  validateParams(plantillaServicioIdSchema),
  validateBody(updatePlantillaServicioSchema),
  updatePlantillaServicioController
);

/**
 * @swagger
 * /api/plantillas-servicio/{id}:
 *   delete:
 *     summary: Eliminar plantilla de servicio (soft delete)
 *     description: Desactiva una plantilla (activo = false). Solo ADMIN puede ejecutar esta acción.
 *     tags: [Plantillas de Servicio]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *           minimum: 1
 *         description: ID de la plantilla a desactivar
 *     responses:
 *       200:
 *         description: Plantilla desactivada exitosamente
 *       400:
 *         description: Plantilla ya está inactiva
 *       404:
 *         description: Plantilla no encontrada
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.delete(
  '/:id',
  authMiddleware,
  requireRole('ADMIN'),
  auditMiddleware('ot_plantillas_servicio'),
  validateParams(plantillaServicioIdSchema),
  deletePlantillaServicioController
);

// ============================================================================
// EXPORTAR ROUTER
// ============================================================================

export default router;
