/**
 * Rutas de Incentivos por Puesto
 * Sistema de Gestion de Turnos - OperacionesRanger
 *
 * Define las rutas HTTP para la gestion de incentivos permanentes
 * asignados a puestos. Todas las rutas estan protegidas por autenticacion
 * JWT y controladas por roles de usuario.
 *
 * @module routes/incentivos.routes
 */

import { Router } from 'express';
import { authMiddleware } from '../middlewares/auth.middleware';
import { requireRole } from '../middlewares/role.middleware';
import { auditMiddleware } from '../middlewares/audit.middleware';
import { validateQuery, validateParams, validateBody } from '../middlewares/validation.middleware';
import {
  createIncentivoSchema,
  updateIncentivoSchema,
  incentivoIdSchema,
  getIncentivosQuerySchema
} from '../schemas/incentivo.schema';
import {
  getIncentivosController,
  getIncentivoByIdController,
  getIncentivosActivosController,
  createIncentivoController,
  updateIncentivoController,
  deleteIncentivoController
} from '../controllers/incentivos.controller';

const router = Router();

// ============================================================================
// RUTAS DE CONSULTA (GET)
// ============================================================================

/**
 * GET /api/incentivos
 * Listar incentivos con paginacion y filtros
 */
router.get(
  '/',
  authMiddleware,
  requireRole('ADMIN', 'SUPERVISOR', 'CONSULTA'),
  validateQuery(getIncentivosQuerySchema),
  getIncentivosController
);

/**
 * GET /api/incentivos/activos
 * Obtener todos los incentivos activos (para calculo de turnos)
 * IMPORTANTE: Esta ruta debe ir ANTES de /:id para evitar conflictos de routing
 */
router.get(
  '/activos',
  authMiddleware,
  requireRole('ADMIN', 'SUPERVISOR', 'CONSULTA'),
  getIncentivosActivosController
);

/**
 * GET /api/incentivos/:id
 * Obtener incentivo por ID con relaciones
 */
router.get(
  '/:id',
  authMiddleware,
  requireRole('ADMIN', 'SUPERVISOR', 'CONSULTA'),
  validateParams(incentivoIdSchema),
  getIncentivoByIdController
);

// ============================================================================
// RUTAS DE MODIFICACION (POST, PUT, DELETE)
// ============================================================================

/**
 * POST /api/incentivos
 * Crear nuevo incentivo permanente para un puesto
 */
router.post(
  '/',
  authMiddleware,
  requireRole('ADMIN', 'SUPERVISOR'),
  auditMiddleware('ot_incentivos_puesto'),
  validateBody(createIncentivoSchema),
  createIncentivoController
);

/**
 * PUT /api/incentivos/:id
 * Actualizar incentivo existente (monto, concepto, activo)
 */
router.put(
  '/:id',
  authMiddleware,
  requireRole('ADMIN', 'SUPERVISOR'),
  auditMiddleware('ot_incentivos_puesto'),
  validateParams(incentivoIdSchema),
  validateBody(updateIncentivoSchema),
  updateIncentivoController
);

/**
 * DELETE /api/incentivos/:id
 * Desactivar incentivo (soft delete: activo = false)
 */
router.delete(
  '/:id',
  authMiddleware,
  requireRole('ADMIN'),
  auditMiddleware('ot_incentivos_puesto'),
  validateParams(incentivoIdSchema),
  deleteIncentivoController
);

// ============================================================================
// EXPORTAR ROUTER
// ============================================================================

export default router;
