/**
 * Rutas de Reporte de Horas Trabajadas
 * Sistema de Gestion de Turnos - OperacionesRanger
 *
 * Define la ruta HTTP para generar reportes pivot de horas trabajadas.
 * Protegida por autenticacion JWT y roles ADMIN/SUPERVISOR.
 *
 * @module routes/reporte-horas.routes
 */

import { Router } from 'express';
import { authMiddleware } from '../middlewares/auth.middleware';
import { requireRole } from '../middlewares/role.middleware';
import { validateQuery } from '../middlewares/validation.middleware';
import { reporteHorasQuerySchema } from '../schemas/reporte-horas.schema';
import { getReporteHorasController } from '../controllers/reporte-horas.controller';

const router = Router();

// ============================================================================
// RUTAS
// ============================================================================

/**
 * @swagger
 * /api/reportes/horas:
 *   get:
 *     summary: Generar reporte pivot de horas trabajadas
 *     description: >
 *       Genera un reporte pivot con horas trabajadas por dia, agrupado por
 *       empleado o por puesto. Los datos provienen de la tabla diario_puesto.
 *       El rango maximo permitido es de 31 dias.
 *     tags: [Reportes]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: fecha_inicio
 *         required: true
 *         schema:
 *           type: string
 *           format: date
 *         description: Fecha de inicio del rango (YYYY-MM-DD)
 *       - in: query
 *         name: fecha_fin
 *         required: true
 *         schema:
 *           type: string
 *           format: date
 *         description: Fecha de fin del rango (YYYY-MM-DD)
 *       - in: query
 *         name: tipo
 *         required: true
 *         schema:
 *           type: string
 *           enum: [empleado, puesto]
 *         description: Tipo de agrupacion del reporte
 *       - in: query
 *         name: empleado_id
 *         schema:
 *           type: integer
 *         description: Filtrar por ID de empleado (opcional)
 *       - in: query
 *         name: puesto_id
 *         schema:
 *           type: integer
 *         description: Filtrar por ID de puesto (opcional)
 *     responses:
 *       200:
 *         description: Reporte generado exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 tipo:
 *                   type: string
 *                   enum: [empleado, puesto]
 *                 fecha_inicio:
 *                   type: string
 *                   format: date
 *                 fecha_fin:
 *                   type: string
 *                   format: date
 *                 fechas:
 *                   type: array
 *                   items:
 *                     type: string
 *                     format: date
 *                 filas:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: integer
 *                       nombre:
 *                         type: string
 *                       codigo:
 *                         type: string
 *                       total_horas:
 *                         type: number
 *                       total_dias:
 *                         type: integer
 *                       dias:
 *                         type: object
 *                         additionalProperties:
 *                           type: number
 *                 total_registros:
 *                   type: integer
 *       400:
 *         description: Parametros de consulta invalidos
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         description: Rol insuficiente
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.get(
  '/',
  authMiddleware,
  requireRole('ADMIN', 'SUPERVISOR'),
  validateQuery(reporteHorasQuerySchema),
  getReporteHorasController
);

// ============================================================================
// EXPORTAR ROUTER
// ============================================================================

export default router;
