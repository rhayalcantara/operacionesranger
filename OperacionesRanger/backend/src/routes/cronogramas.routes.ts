/**
 * Rutas de Cronogramas
 * Sistema de Gestión de Turnos - OperacionesRanger
 *
 * Define las rutas HTTP para la gestión de cronogramas semanales.
 * Todas las rutas están protegidas por autenticación JWT y controladas
 * por roles de usuario.
 *
 * @module routes/cronogramas.routes
 */

import { Router } from 'express';
import { authMiddleware } from '../middlewares/auth.middleware';
import { requireRole } from '../middlewares/role.middleware';
import { auditMiddleware } from '../middlewares/audit.middleware';
import { validateQuery, validateParams, validateBody } from '../middlewares/validation.middleware';
import {
  createCronogramaSchema,
  updateCronogramaSchema,
  cronogramaIdSchema,
  getCronogramasQuerySchema,
} from '../schemas/cronograma.schema';
import {
  getCronogramasController,
  getCronogramaByIdController,
  createCronogramaController,
  updateCronogramaController,
  deleteCronogramaController,
} from '../controllers/cronogramas.controller';

const router = Router();

// ============================================================================
// RUTAS DE CONSULTA (GET)
// ============================================================================

/**
 * @swagger
 * /api/cronogramas:
 *   get:
 *     summary: Listar cronogramas con paginación y filtros
 *     description: Obtiene lista paginada de cronogramas semanales con opciones de búsqueda y filtro por estado
 *     tags: [Cronogramas]
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
 *         description: Filtrar por estado activo (true) o inactivo (false)
 *     responses:
 *       200:
 *         description: Lista de cronogramas obtenida exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/CronogramaEnListado'
 *                 total:
 *                   type: integer
 *                 page:
 *                   type: integer
 *                 pageSize:
 *                   type: integer
 *                 totalPages:
 *                   type: integer
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.get(
  '/',
  authMiddleware,
  requireRole('ADMIN', 'SUPERVISOR', 'CONSULTA'),
  validateQuery(getCronogramasQuerySchema),
  getCronogramasController
);

/**
 * @swagger
 * /api/cronogramas/{id}:
 *   get:
 *     summary: Obtener cronograma por ID con detalles completos
 *     description: Obtiene un cronograma con todos sus detalles incluyendo nombres de empleados y puestos
 *     tags: [Cronogramas]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *           minimum: 1
 *         description: ID del cronograma
 *     responses:
 *       200:
 *         description: Cronograma encontrado con detalles
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/CronogramaConDetalle'
 *       404:
 *         description: Cronograma no encontrado
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.get(
  '/:id',
  authMiddleware,
  requireRole('ADMIN', 'SUPERVISOR', 'CONSULTA'),
  validateParams(cronogramaIdSchema),
  getCronogramaByIdController
);

// ============================================================================
// RUTAS DE MODIFICACIÓN (POST, PUT, DELETE)
// ============================================================================

/**
 * @swagger
 * /api/cronogramas:
 *   post:
 *     summary: Crear nuevo cronograma semanal
 *     description: |
 *       Crea un cronograma con asignaciones de empleados a puestos por día de la semana.
 *       Valida que cada empleado tenga al menos 1 día libre (máximo 6 de 7 días asignados).
 *     tags: [Cronogramas]
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
 *                 example: 'Cronograma Enero Semana 1'
 *               descripcion:
 *                 type: string
 *                 example: 'Planificación primera semana de enero'
 *               detalles:
 *                 type: array
 *                 items:
 *                   type: object
 *                   required:
 *                     - dia_semana
 *                     - puesto_id
 *                     - empleado_id
 *                     - tipo_turno
 *                   properties:
 *                     dia_semana:
 *                       type: integer
 *                       minimum: 0
 *                       maximum: 6
 *                       description: '0=Domingo, 1=Lunes, ..., 6=Sábado'
 *                     puesto_id:
 *                       type: integer
 *                     empleado_id:
 *                       type: integer
 *                     tipo_turno:
 *                       type: string
 *                       enum: [DIURNO, NOCTURNO]
 *     responses:
 *       201:
 *         description: Cronograma creado exitosamente
 *       400:
 *         description: Validación fallida (empleado sin día libre, etc.)
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         description: Requiere rol ADMIN o SUPERVISOR
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.post(
  '/',
  authMiddleware,
  requireRole('ADMIN', 'SUPERVISOR'),
  auditMiddleware('ot_cronogramas'),
  validateBody(createCronogramaSchema),
  createCronogramaController
);

/**
 * @swagger
 * /api/cronogramas/{id}:
 *   put:
 *     summary: Actualizar cronograma existente
 *     description: |
 *       Actualiza nombre/descripción y/o detalles de un cronograma.
 *       Si se proporcionan detalles, reemplaza completamente los existentes (estrategia de reemplazo).
 *       Valida regla de día libre para cada empleado.
 *     tags: [Cronogramas]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               nombre:
 *                 type: string
 *               descripcion:
 *                 type: string
 *               detalles:
 *                 type: array
 *                 items:
 *                   $ref: '#/components/schemas/CronogramaDetalleInput'
 *     responses:
 *       200:
 *         description: Cronograma actualizado exitosamente
 *       400:
 *         description: Validación fallida
 *       404:
 *         description: Cronograma no encontrado
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.put(
  '/:id',
  authMiddleware,
  requireRole('ADMIN', 'SUPERVISOR'),
  auditMiddleware('ot_cronogramas'),
  validateParams(cronogramaIdSchema),
  validateBody(updateCronogramaSchema),
  updateCronogramaController
);

/**
 * @swagger
 * /api/cronogramas/{id}:
 *   delete:
 *     summary: Eliminar cronograma (soft delete)
 *     description: Desactiva un cronograma (activo = false). Solo ADMIN puede ejecutar esta acción.
 *     tags: [Cronogramas]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Cronograma desactivado exitosamente
 *       400:
 *         description: Cronograma ya está inactivo
 *       404:
 *         description: Cronograma no encontrado
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.delete(
  '/:id',
  authMiddleware,
  requireRole('ADMIN'),
  auditMiddleware('ot_cronogramas'),
  validateParams(cronogramaIdSchema),
  deleteCronogramaController
);

// ============================================================================
// EXPORTAR ROUTER
// ============================================================================

export default router;
