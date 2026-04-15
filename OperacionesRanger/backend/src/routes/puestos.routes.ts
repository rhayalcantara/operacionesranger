/**
 * Rutas de Puestos
 * Sistema de Gestión de Turnos - OperacionesRanger
 *
 * Define las rutas HTTP para la gestión de puestos de seguridad.
 * Todas las rutas están protegidas por autenticación JWT y controladas
 * por roles de usuario.
 *
 * @module routes/puestos.routes
 */

import { Router } from 'express';
import { authMiddleware } from '../middlewares/auth.middleware';
import { requireRole } from '../middlewares/role.middleware';
import { auditMiddleware } from '../middlewares/audit.middleware';
import { validateQuery, validateParams, validateBody } from '../middlewares/validation.middleware';
import {
  createPuestoSchema,
  updatePuestoSchema,
  puestoIdSchema,
  getPuestosQuerySchema,
  getTurnosByPuestoQuerySchema
} from '../schemas/puesto.schema';
import {
  getPuestosController,
  getPuestoByIdController,
  getTurnosByPuestoController,
  createPuestoController,
  updatePuestoController,
  deletePuestoController
} from '../controllers/puestos.controller';

const router = Router();

// ============================================================================
// RUTAS DE CONSULTA (GET)
// ============================================================================

/**
 * @swagger
 * /api/puestos:
 *   get:
 *     summary: Listar puestos con paginación y filtros
 *     description: Obtiene lista paginada de puestos de seguridad con opciones de búsqueda y filtros por ubicación, cliente y estado activo
 *     tags: [Puestos]
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
 *         description: Búsqueda por nombre, código o descripción del puesto
 *       - in: query
 *         name: ubicacion_id
 *         schema:
 *           type: integer
 *         description: Filtrar puestos por ID de ubicación
 *       - in: query
 *         name: cliente_id
 *         schema:
 *           type: integer
 *         description: Filtrar puestos por ID de cliente
 *       - in: query
 *         name: activo
 *         schema:
 *           type: boolean
 *         description: Filtrar por estado activo (true) o inactivo (false)
 *     responses:
 *       200:
 *         description: Lista de puestos obtenida exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Puesto'
 *                 total:
 *                   type: integer
 *                   example: 100
 *                 page:
 *                   type: integer
 *                   example: 1
 *                 pageSize:
 *                   type: integer
 *                   example: 10
 *                 totalPages:
 *                   type: integer
 *                   example: 10
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.get(
  '/',
  authMiddleware,
  requireRole('ADMIN', 'SUPERVISOR', 'CONSULTA'),
  validateQuery(getPuestosQuerySchema),
  getPuestosController
);

/**
 * @swagger
 * /api/puestos/{id}:
 *   get:
 *     summary: Obtener puesto por ID con relaciones
 *     description: Obtiene un puesto específico con información detallada incluyendo datos de ubicación y cliente relacionados
 *     tags: [Puestos]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *           minimum: 1
 *         description: ID único del puesto
 *     responses:
 *       200:
 *         description: Puesto encontrado exitosamente con relaciones
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/Puesto'
 *                 - type: object
 *                   properties:
 *                     ubicacion_nombre:
 *                       type: string
 *                       example: 'Sucursal Churchill'
 *                     cliente_nombre:
 *                       type: string
 *                       example: 'Banco Popular'
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       404:
 *         description: Puesto no encontrado
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
  requireRole('ADMIN', 'SUPERVISOR', 'CONSULTA'),
  validateParams(puestoIdSchema),
  getPuestoByIdController
);

/**
 * @swagger
 * /api/puestos/{id}/turnos:
 *   get:
 *     summary: Obtener turnos de un puesto
 *     description: Obtiene lista paginada de turnos registrados para un puesto específico con opciones de filtro por rango de fechas
 *     tags: [Puestos]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *           minimum: 1
 *         description: ID del puesto
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
 *         name: fecha_inicio
 *         schema:
 *           type: string
 *           format: date
 *           example: '2026-01-01'
 *         description: Fecha de inicio del rango (YYYY-MM-DD)
 *       - in: query
 *         name: fecha_fin
 *         schema:
 *           type: string
 *           format: date
 *           example: '2026-01-31'
 *         description: Fecha de fin del rango (YYYY-MM-DD)
 *     responses:
 *       200:
 *         description: Lista de turnos del puesto obtenida exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Turno'
 *                 total:
 *                   type: integer
 *                   example: 50
 *                 page:
 *                   type: integer
 *                   example: 1
 *                 pageSize:
 *                   type: integer
 *                   example: 10
 *                 totalPages:
 *                   type: integer
 *                   example: 5
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       404:
 *         description: Puesto no encontrado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.get(
  '/:id/turnos',
  authMiddleware,
  requireRole('ADMIN', 'SUPERVISOR', 'CONSULTA'),
  validateParams(puestoIdSchema),
  validateQuery(getTurnosByPuestoQuerySchema),
  getTurnosByPuestoController
);

// ============================================================================
// RUTAS DE MODIFICACIÓN (POST, PUT, DELETE)
// ============================================================================

/**
 * @swagger
 * /api/puestos:
 *   post:
 *     summary: Crear nuevo puesto de seguridad
 *     description: Crea un nuevo puesto/estación de seguridad en una ubicación. Valida que la ubicación exista y esté activa, y que el código sea único dentro de la ubicación.
 *     tags: [Puestos]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - ubicacion_id
 *               - codigo
 *               - nombre
 *             properties:
 *               ubicacion_id:
 *                 type: integer
 *                 example: 1
 *                 description: ID de la ubicación donde se creará el puesto
 *               codigo:
 *                 type: string
 *                 example: 'P001'
 *                 minLength: 2
 *                 maxLength: 20
 *                 description: Código único del puesto dentro de la ubicación
 *               nombre:
 *                 type: string
 *                 example: 'Entrada Principal'
 *                 minLength: 1
 *                 maxLength: 150
 *                 description: Nombre descriptivo del puesto
 *               descripcion:
 *                 type: string
 *                 example: 'Puesto de vigilancia en entrada principal con control de acceso'
 *                 maxLength: 1000
 *                 description: Descripción detallada del puesto (opcional)
 *               cantidad_guardianes:
 *                 type: integer
 *                 default: 1
 *                 minimum: 1
 *                 maximum: 10
 *                 description: Cantidad de guardianes requeridos simultáneamente
 *               requiere_turno_diurno:
 *                 type: boolean
 *                 default: true
 *                 description: Si el puesto requiere cobertura diurna
 *               requiere_turno_nocturno:
 *                 type: boolean
 *                 default: true
 *                 description: Si el puesto requiere cobertura nocturna
 *     responses:
 *       201:
 *         description: Puesto creado exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: 'Puesto creado exitosamente'
 *                 data:
 *                   $ref: '#/components/schemas/Puesto'
 *       400:
 *         description: Error de validación (ubicación inactiva, código duplicado, etc.)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ValidationError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         description: Acceso denegado (requiere rol ADMIN o SUPERVISOR)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: Ubicación no encontrada
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.post(
  '/',
  authMiddleware,
  requireRole('ADMIN', 'SUPERVISOR'),
  auditMiddleware('ot_puestos'),
  validateBody(createPuestoSchema),
  createPuestoController
);

/**
 * @swagger
 * /api/puestos/{id}:
 *   put:
 *     summary: Actualizar puesto existente
 *     description: Actualiza los datos de un puesto. Todos los campos son opcionales. El ubicacion_id NO puede ser modificado.
 *     tags: [Puestos]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *           minimum: 1
 *         description: ID del puesto a actualizar
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               codigo:
 *                 type: string
 *                 minLength: 2
 *                 maxLength: 20
 *               nombre:
 *                 type: string
 *                 minLength: 1
 *                 maxLength: 150
 *               descripcion:
 *                 type: string
 *                 maxLength: 1000
 *               cantidad_guardianes:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 10
 *               requiere_turno_diurno:
 *                 type: boolean
 *               requiere_turno_nocturno:
 *                 type: boolean
 *               activo:
 *                 type: boolean
 *                 description: Estado activo/inactivo del puesto
 *     responses:
 *       200:
 *         description: Puesto actualizado exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: 'Puesto actualizado exitosamente'
 *                 data:
 *                   $ref: '#/components/schemas/Puesto'
 *       400:
 *         description: Error de validación (código duplicado, etc.)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ValidationError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         description: Acceso denegado (requiere rol ADMIN o SUPERVISOR)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: Puesto no encontrado
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
  requireRole('ADMIN', 'SUPERVISOR'),
  auditMiddleware('ot_puestos'),
  validateParams(puestoIdSchema),
  validateBody(updatePuestoSchema),
  updatePuestoController
);

/**
 * @swagger
 * /api/puestos/{id}:
 *   delete:
 *     summary: Eliminar puesto (soft delete)
 *     description: Desactiva un puesto (activo = false). No se puede eliminar si tiene turnos registrados. Solo ADMIN puede ejecutar esta acción.
 *     tags: [Puestos]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *           minimum: 1
 *         description: ID del puesto a desactivar
 *     responses:
 *       200:
 *         description: Puesto desactivado exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: 'Puesto desactivado'
 *                 id:
 *                   type: integer
 *                   example: 42
 *       400:
 *         description: No se puede eliminar porque tiene turnos registrados
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         description: Acceso denegado (requiere rol ADMIN)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: Puesto no encontrado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.delete(
  '/:id',
  authMiddleware,
  requireRole('ADMIN'),
  auditMiddleware('ot_puestos'),
  validateParams(puestoIdSchema),
  deletePuestoController
);

// ============================================================================
// EXPORTAR ROUTER
// ============================================================================

export default router;
