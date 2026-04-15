/**
 * Rutas de Servicios por Puesto
 * Sistema de Gestión de Turnos - OperacionesRanger
 *
 * Define las rutas HTTP para la gestión de asignaciones semanales
 * de empleados a puestos de seguridad.
 * Todas las rutas están protegidas por autenticación JWT y controladas
 * por roles de usuario.
 *
 * @module routes/servicios-puesto.routes
 */

import { Router } from 'express';
import { authMiddleware } from '../middlewares/auth.middleware';
import { requireRole } from '../middlewares/role.middleware';
import { auditMiddleware } from '../middlewares/audit.middleware';
import { validateQuery, validateParams, validateBody } from '../middlewares/validation.middleware';
import {
  createServicioPuestoSchema,
  updateServicioPuestoSchema,
  servicioPuestoIdSchema,
  getServiciosPuestoQuerySchema,
} from '../schemas/servicio-puesto.schema';
import {
  getServiciosPuestoController,
  getServicioPuestoByIdController,
  createServicioPuestoController,
  updateServicioPuestoController,
  deleteServicioPuestoController,
} from '../controllers/servicios-puesto.controller';

const router = Router();

// ============================================================================
// RUTAS DE CONSULTA (GET)
// ============================================================================

/**
 * @swagger
 * /api/servicios-puesto:
 *   get:
 *     summary: Listar servicios por puesto con paginación y filtros
 *     description: Obtiene lista paginada de asignaciones semanales de empleados a puestos con opciones de búsqueda y filtros
 *     tags: [Servicios por Puesto]
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
 *         description: Búsqueda por nombre de puesto, código, ubicación o cliente
 *       - in: query
 *         name: puesto_id
 *         schema:
 *           type: integer
 *         description: Filtrar por ID de puesto
 *       - in: query
 *         name: ubicacion_id
 *         schema:
 *           type: integer
 *         description: Filtrar por ID de ubicación
 *       - in: query
 *         name: cliente_id
 *         schema:
 *           type: integer
 *         description: Filtrar por ID de cliente
 *       - in: query
 *         name: tipo_turno
 *         schema:
 *           type: string
 *           enum: [DIURNO, NOCTURNO]
 *         description: Filtrar por tipo de turno
 *       - in: query
 *         name: cobrada
 *         schema:
 *           type: boolean
 *         description: Filtrar por estado de cobro
 *       - in: query
 *         name: activo
 *         schema:
 *           type: boolean
 *         description: Filtrar por estado activo
 *     responses:
 *       200:
 *         description: Lista de servicios por puesto obtenida exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/ServicioPuesto'
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
  validateQuery(getServiciosPuestoQuerySchema),
  getServiciosPuestoController
);

/**
 * @swagger
 * /api/servicios-puesto/{id}:
 *   get:
 *     summary: Obtener servicio por puesto por ID con relaciones
 *     description: Obtiene un servicio específico con información detallada incluyendo puesto, ubicación, cliente y nombres de empleados asignados
 *     tags: [Servicios por Puesto]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *           minimum: 1
 *         description: ID único del servicio por puesto
 *     responses:
 *       200:
 *         description: Servicio por puesto encontrado exitosamente
 *       404:
 *         description: Servicio por puesto no encontrado
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.get(
  '/:id',
  authMiddleware,
  requireRole('ADMIN', 'SUPERVISOR', 'CONSULTA'),
  validateParams(servicioPuestoIdSchema),
  getServicioPuestoByIdController
);

// ============================================================================
// RUTAS DE MODIFICACIÓN (POST, PUT, DELETE)
// ============================================================================

/**
 * @swagger
 * /api/servicios-puesto:
 *   post:
 *     summary: Crear nuevo servicio por puesto
 *     description: Crea una nueva asignación semanal de empleados a un puesto para un tipo de turno. Valida que el puesto exista y esté activo, y que no exista ya un servicio para la misma combinación puesto+turno.
 *     tags: [Servicios por Puesto]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - puesto_id
 *               - tipo_turno
 *             properties:
 *               puesto_id:
 *                 type: integer
 *                 description: ID del puesto
 *               tipo_turno:
 *                 type: string
 *                 enum: [DIURNO, NOCTURNO]
 *               domingo_empleado_id:
 *                 type: integer
 *                 nullable: true
 *               lunes_empleado_id:
 *                 type: integer
 *                 nullable: true
 *               martes_empleado_id:
 *                 type: integer
 *                 nullable: true
 *               miercoles_empleado_id:
 *                 type: integer
 *                 nullable: true
 *               jueves_empleado_id:
 *                 type: integer
 *                 nullable: true
 *               viernes_empleado_id:
 *                 type: integer
 *                 nullable: true
 *               sabado_empleado_id:
 *                 type: integer
 *                 nullable: true
 *               cobrada:
 *                 type: boolean
 *                 default: false
 *     responses:
 *       201:
 *         description: Servicio por puesto creado exitosamente
 *       400:
 *         description: Error de validación o duplicado
 *       404:
 *         description: Puesto no encontrado
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.post(
  '/',
  authMiddleware,
  requireRole('ADMIN', 'SUPERVISOR'),
  auditMiddleware('ot_servicios_puesto'),
  validateBody(createServicioPuestoSchema),
  createServicioPuestoController
);

/**
 * @swagger
 * /api/servicios-puesto/{id}:
 *   put:
 *     summary: Actualizar servicio por puesto existente
 *     description: Actualiza los datos de un servicio por puesto. Todos los campos son opcionales.
 *     tags: [Servicios por Puesto]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *           minimum: 1
 *         description: ID del servicio a actualizar
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               tipo_turno:
 *                 type: string
 *                 enum: [DIURNO, NOCTURNO]
 *               domingo_empleado_id:
 *                 type: integer
 *                 nullable: true
 *               lunes_empleado_id:
 *                 type: integer
 *                 nullable: true
 *               martes_empleado_id:
 *                 type: integer
 *                 nullable: true
 *               miercoles_empleado_id:
 *                 type: integer
 *                 nullable: true
 *               jueves_empleado_id:
 *                 type: integer
 *                 nullable: true
 *               viernes_empleado_id:
 *                 type: integer
 *                 nullable: true
 *               sabado_empleado_id:
 *                 type: integer
 *                 nullable: true
 *               cobrada:
 *                 type: boolean
 *               activo:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Servicio por puesto actualizado exitosamente
 *       400:
 *         description: Error de validación o duplicado
 *       404:
 *         description: Servicio por puesto no encontrado
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.put(
  '/:id',
  authMiddleware,
  requireRole('ADMIN', 'SUPERVISOR'),
  auditMiddleware('ot_servicios_puesto'),
  validateParams(servicioPuestoIdSchema),
  validateBody(updateServicioPuestoSchema),
  updateServicioPuestoController
);

/**
 * @swagger
 * /api/servicios-puesto/{id}:
 *   delete:
 *     summary: Eliminar servicio por puesto (soft delete)
 *     description: Desactiva un servicio por puesto (activo = false). Solo ADMIN puede ejecutar esta acción.
 *     tags: [Servicios por Puesto]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *           minimum: 1
 *         description: ID del servicio a desactivar
 *     responses:
 *       200:
 *         description: Servicio por puesto desactivado exitosamente
 *       404:
 *         description: Servicio por puesto no encontrado
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.delete(
  '/:id',
  authMiddleware,
  requireRole('ADMIN'),
  auditMiddleware('ot_servicios_puesto'),
  validateParams(servicioPuestoIdSchema),
  deleteServicioPuestoController
);

// ============================================================================
// EXPORTAR ROUTER
// ============================================================================

export default router;
