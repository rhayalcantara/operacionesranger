/**
 * Rutas de Diario de Puesto
 * Sistema de Gestión de Turnos - OperacionesRanger
 *
 * Define las rutas HTTP para la gestión de registros diarios de asistencia
 * de empleados en puestos de seguridad.
 * Todas las rutas están protegidas por autenticación JWT y controladas
 * por roles de usuario.
 *
 * @module routes/diario-puesto.routes
 */

import { Router } from 'express';
import { authMiddleware } from '../middlewares/auth.middleware';
import { requireRole } from '../middlewares/role.middleware';
import { auditMiddleware } from '../middlewares/audit.middleware';
import { validateQuery, validateParams, validateBody } from '../middlewares/validation.middleware';
import {
  createDiarioPuestoSchema,
  updateDiarioPuestoSchema,
  poblarPlantillaSchema,
  poblarServiciosSchema,
  diarioPuestoIdSchema,
  getDiarioPuestoQuerySchema,
} from '../schemas/diario-puesto.schema';
import {
  getDiarioPuestoController,
  getDiarioPuestoByIdController,
  createDiarioPuestoController,
  updateDiarioPuestoController,
  deleteDiarioPuestoController,
  poblarPlantillaController,
  poblarServiciosController,
} from '../controllers/diario-puesto.controller';

const router = Router();

// ============================================================================
// RUTAS DE CONSULTA (GET)
// ============================================================================

/**
 * @swagger
 * /api/diario-puesto:
 *   get:
 *     summary: Listar registros de diario de puesto con paginación y filtros
 *     description: Obtiene lista paginada de registros diarios de asistencia con opciones de búsqueda y filtros
 *     tags: [Diario de Puesto]
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
 *         name: fecha
 *         schema:
 *           type: string
 *           format: date
 *         description: Filtrar por fecha (YYYY-MM-DD)
 *       - in: query
 *         name: puesto_id
 *         schema:
 *           type: integer
 *         description: Filtrar por ID de puesto
 *       - in: query
 *         name: empleado_id
 *         schema:
 *           type: integer
 *         description: Filtrar por ID de empleado
 *       - in: query
 *         name: tipo_turno
 *         schema:
 *           type: string
 *           enum: [DIURNO, NOCTURNO]
 *         description: Filtrar por tipo de turno
 *       - in: query
 *         name: activo
 *         schema:
 *           type: boolean
 *         description: Filtrar por estado activo
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Búsqueda por nombre de puesto, código, ubicación, cliente o empleado
 *     responses:
 *       200:
 *         description: Lista de registros obtenida exitosamente
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.get(
  '/',
  authMiddleware,
  requireRole('ADMIN', 'SUPERVISOR', 'CONSULTA'),
  validateQuery(getDiarioPuestoQuerySchema),
  getDiarioPuestoController
);

/**
 * @swagger
 * /api/diario-puesto/{id}:
 *   get:
 *     summary: Obtener registro de diario de puesto por ID con relaciones
 *     description: Obtiene un registro específico con información detallada incluyendo puesto, ubicación, cliente y empleado
 *     tags: [Diario de Puesto]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *           minimum: 1
 *         description: ID único del registro
 *     responses:
 *       200:
 *         description: Registro encontrado exitosamente
 *       404:
 *         description: Registro no encontrado
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.get(
  '/:id',
  authMiddleware,
  requireRole('ADMIN', 'SUPERVISOR', 'CONSULTA'),
  validateParams(diarioPuestoIdSchema),
  getDiarioPuestoByIdController
);

// ============================================================================
// RUTAS DE MODIFICACIÓN (POST, PUT, DELETE)
// ============================================================================

/**
 * @swagger
 * /api/diario-puesto:
 *   post:
 *     summary: Crear nuevo registro de diario de puesto
 *     description: Crea un nuevo registro diario de asistencia para un empleado en un puesto
 *     tags: [Diario de Puesto]
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
 *               - empleado_id
 *               - fecha
 *               - horas
 *               - tipo_turno
 *             properties:
 *               puesto_id:
 *                 type: integer
 *               empleado_id:
 *                 type: integer
 *               fecha:
 *                 type: string
 *                 format: date
 *               horas:
 *                 type: number
 *                 minimum: 0
 *                 maximum: 24
 *               tipo_turno:
 *                 type: string
 *                 enum: [DIURNO, NOCTURNO]
 *               servicio_puesto_id:
 *                 type: integer
 *                 nullable: true
 *     responses:
 *       201:
 *         description: Registro creado exitosamente
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
  auditMiddleware('ot_diario_puesto'),
  validateBody(createDiarioPuestoSchema),
  createDiarioPuestoController
);

/**
 * @swagger
 * /api/diario-puesto/poblar-plantilla:
 *   post:
 *     summary: Poblar diario de puesto desde plantilla de servicio
 *     description: >
 *       Genera automáticamente registros de diario de puesto a partir de una plantilla.
 *       Para cada servicio_puesto en la plantilla, determina el empleado asignado
 *       para el día de la semana correspondiente a la fecha y lo inserta.
 *       Registros duplicados se omiten sin error.
 *     tags: [Diario de Puesto]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - plantilla_id
 *               - fecha
 *             properties:
 *               plantilla_id:
 *                 type: integer
 *                 description: ID de la plantilla de servicio
 *               fecha:
 *                 type: string
 *                 format: date
 *                 description: Fecha para la cual generar los registros
 *     responses:
 *       200:
 *         description: Operación completada exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 insertados:
 *                   type: integer
 *                 omitidos:
 *                   type: integer
 *                 detalles:
 *                   type: array
 *                   items:
 *                     type: string
 *       400:
 *         description: Plantilla no activa
 *       404:
 *         description: Plantilla no encontrada
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.post(
  '/poblar-plantilla',
  authMiddleware,
  requireRole('ADMIN', 'SUPERVISOR'),
  auditMiddleware('ot_diario_puesto'),
  validateBody(poblarPlantillaSchema),
  poblarPlantillaController
);

/**
 * @swagger
 * /api/diario-puesto/poblar-servicios:
 *   post:
 *     summary: Poblar diario de puesto desde servicios por puesto activos
 *     description: >
 *       Genera registros de diario de puesto a partir de todos los servicios
 *       por puesto activos. Para cada servicio, determina el empleado asignado
 *       para el día de la semana correspondiente a la fecha y lo inserta.
 *     tags: [Diario de Puesto]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - fecha
 *             properties:
 *               fecha:
 *                 type: string
 *                 format: date
 *     responses:
 *       200:
 *         description: Operación completada exitosamente
 */
router.post(
  '/poblar-servicios',
  authMiddleware,
  requireRole('ADMIN', 'SUPERVISOR'),
  auditMiddleware('ot_diario_puesto'),
  validateBody(poblarServiciosSchema),
  poblarServiciosController
);

/**
 * @swagger
 * /api/diario-puesto/{id}:
 *   put:
 *     summary: Actualizar registro de diario de puesto existente
 *     description: Actualiza los datos de un registro. Todos los campos son opcionales.
 *     tags: [Diario de Puesto]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *           minimum: 1
 *         description: ID del registro a actualizar
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               puesto_id:
 *                 type: integer
 *               empleado_id:
 *                 type: integer
 *               fecha:
 *                 type: string
 *                 format: date
 *               horas:
 *                 type: number
 *                 minimum: 0
 *                 maximum: 24
 *               tipo_turno:
 *                 type: string
 *                 enum: [DIURNO, NOCTURNO]
 *               servicio_puesto_id:
 *                 type: integer
 *                 nullable: true
 *               activo:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Registro actualizado exitosamente
 *       400:
 *         description: Error de validación o duplicado
 *       404:
 *         description: Registro no encontrado
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.put(
  '/:id',
  authMiddleware,
  requireRole('ADMIN', 'SUPERVISOR'),
  auditMiddleware('ot_diario_puesto'),
  validateParams(diarioPuestoIdSchema),
  validateBody(updateDiarioPuestoSchema),
  updateDiarioPuestoController
);

/**
 * @swagger
 * /api/diario-puesto/{id}:
 *   delete:
 *     summary: Eliminar registro de diario de puesto (soft delete)
 *     description: Desactiva un registro (activo = false). Solo ADMIN puede ejecutar esta acción.
 *     tags: [Diario de Puesto]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *           minimum: 1
 *         description: ID del registro a desactivar
 *     responses:
 *       200:
 *         description: Registro desactivado exitosamente
 *       404:
 *         description: Registro no encontrado
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.delete(
  '/:id',
  authMiddleware,
  requireRole('ADMIN'),
  auditMiddleware('ot_diario_puesto'),
  validateParams(diarioPuestoIdSchema),
  deleteDiarioPuestoController
);

// ============================================================================
// EXPORTAR ROUTER
// ============================================================================

export default router;
