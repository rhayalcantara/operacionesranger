/**
 * Rutas REST: Feriados
 *
 * Define los endpoints para gestión de feriados nacionales y por decreto.
 * Incluye middlewares de autenticación y autorización por roles.
 *
 * **Permisos**:
 * - GET (listar, obtener, verificar): Todos los usuarios autenticados
 * - POST, PUT, DELETE: Solo ADMIN
 *
 * @module routes/feriados.routes
 */

import { Router } from 'express';
import * as FeriadosController from '../controllers/feriados.controller';
import { authMiddleware } from '../middlewares/auth.middleware';
import { requireRole } from '../middlewares/role.middleware';
import { auditMiddleware } from '../middlewares/audit.middleware';
import { validateBody, validateParams } from '../middlewares/validation.middleware';
import { paginationMiddleware } from '../middlewares/pagination.middleware';
import {
  feriadoCreateSchema,
  feriadoUpdateSchema,
  feriadoIdParamSchema,
  feriadoFechaParamSchema
} from '../schemas/feriado.schema';
import { UserRole } from '../models/auth.model';

const router = Router();

/**
 * @swagger
 * /api/feriados:
 *   get:
 *     summary: Obtener lista paginada de feriados
 *     description: Obtiene todos los feriados con opciones de filtrado por año y tipo (NACIONAL o DECRETO). Soporta paginación para manejar listas grandes.
 *     tags: [Feriados]
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
 *         name: año
 *         schema:
 *           type: integer
 *           example: 2026
 *         description: Filtrar feriados por año específico
 *       - in: query
 *         name: tipo
 *         schema:
 *           type: string
 *           enum: [NACIONAL, DECRETO]
 *         description: Filtrar por tipo de feriado
 *     responses:
 *       200:
 *         description: Lista de feriados obtenida exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Feriado'
 *                 total:
 *                   type: integer
 *                   example: 15
 *                 page:
 *                   type: integer
 *                   example: 1
 *                 pageSize:
 *                   type: integer
 *                   example: 10
 *                 totalPages:
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
  paginationMiddleware,
  FeriadosController.getAllFeriados
);

/**
 * @swagger
 * /api/feriados/verificar/{fecha}:
 *   get:
 *     summary: Verificar si una fecha es feriado
 *     description: Verifica si una fecha específica es un feriado registrado utilizando stored procedure. Retorna información del feriado si existe. Esta ruta debe estar ANTES de /{id} para evitar conflictos.
 *     tags: [Feriados]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: fecha
 *         required: true
 *         schema:
 *           type: string
 *           format: date
 *           example: '2026-01-01'
 *         description: Fecha a verificar en formato YYYY-MM-DD
 *     responses:
 *       200:
 *         description: Verificación completada (siempre retorna 200, incluso si no es feriado)
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 fecha:
 *                   type: string
 *                   format: date
 *                   example: '2026-01-01'
 *                 es_feriado:
 *                   type: boolean
 *                   example: true
 *                 feriado:
 *                   type: object
 *                   nullable: true
 *                   properties:
 *                     id:
 *                       type: integer
 *                       example: 1
 *                     nombre:
 *                       type: string
 *                       example: 'Año Nuevo'
 *                     tipo:
 *                       type: string
 *                       enum: [NACIONAL, DECRETO]
 *                       example: 'NACIONAL'
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.get(
  '/verificar/:fecha',
  authMiddleware,
  validateParams(feriadoFechaParamSchema),
  FeriadosController.verificarFeriado
);

/**
 * @swagger
 * /api/feriados/{id}:
 *   get:
 *     summary: Obtener feriado por ID
 *     description: Obtiene un feriado específico con toda su información detallada
 *     tags: [Feriados]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *           minimum: 1
 *         description: ID único del feriado
 *     responses:
 *       200:
 *         description: Feriado encontrado exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Feriado'
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       404:
 *         description: Feriado no encontrado
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
  validateParams(feriadoIdParamSchema),
  FeriadosController.getFeriadoById
);

/**
 * @swagger
 * /api/feriados:
 *   post:
 *     summary: Crear nuevo feriado
 *     description: Crea un nuevo feriado nacional o por decreto. Valida que la fecha no esté duplicada. Solo ADMIN puede crear feriados.
 *     tags: [Feriados]
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
 *               - nombre
 *               - tipo
 *             properties:
 *               fecha:
 *                 type: string
 *                 format: date
 *                 example: '2026-12-25'
 *                 description: Fecha del feriado en formato YYYY-MM-DD
 *               nombre:
 *                 type: string
 *                 example: 'Día de Navidad'
 *                 minLength: 1
 *                 maxLength: 100
 *                 description: Nombre del feriado
 *               tipo:
 *                 type: string
 *                 enum: [NACIONAL, DECRETO]
 *                 example: 'NACIONAL'
 *                 description: NACIONAL para feriados anuales recurrentes, DECRETO para feriados especiales
 *               descripcion:
 *                 type: string
 *                 example: 'Celebración del nacimiento de Jesucristo'
 *                 maxLength: 500
 *                 description: Descripción adicional del feriado (opcional)
 *     responses:
 *       201:
 *         description: Feriado creado exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: 'Feriado creado exitosamente'
 *                 data:
 *                   $ref: '#/components/schemas/Feriado'
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         description: Acceso denegado (requiere rol ADMIN)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       409:
 *         description: Conflicto - La fecha ya existe como feriado
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
  requireRole(UserRole.ADMIN),
  auditMiddleware('ot_feriados'),
  validateBody(feriadoCreateSchema),
  FeriadosController.createFeriado
);

/**
 * @swagger
 * /api/feriados/{id}:
 *   put:
 *     summary: Actualizar feriado existente
 *     description: Actualiza los datos de un feriado. Todos los campos son opcionales. Valida que la nueva fecha no esté duplicada. Solo ADMIN puede actualizar feriados.
 *     tags: [Feriados]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *           minimum: 1
 *         description: ID del feriado a actualizar
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               fecha:
 *                 type: string
 *                 format: date
 *                 example: '2026-01-01'
 *               nombre:
 *                 type: string
 *                 example: 'Año Nuevo (actualizado)'
 *                 minLength: 1
 *                 maxLength: 100
 *               tipo:
 *                 type: string
 *                 enum: [NACIONAL, DECRETO]
 *               descripcion:
 *                 type: string
 *                 example: 'Primer día del año calendario'
 *                 maxLength: 500
 *     responses:
 *       200:
 *         description: Feriado actualizado exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: 'Feriado actualizado exitosamente'
 *                 data:
 *                   $ref: '#/components/schemas/Feriado'
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         description: Acceso denegado (requiere rol ADMIN)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: Feriado no encontrado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       409:
 *         description: Conflicto - La nueva fecha ya existe como feriado
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
  auditMiddleware('ot_feriados'),
  validateParams(feriadoIdParamSchema),
  validateBody(feriadoUpdateSchema),
  FeriadosController.updateFeriado
);

/**
 * @swagger
 * /api/feriados/{id}:
 *   delete:
 *     summary: Eliminar feriado (hard delete)
 *     description: Elimina permanentemente un feriado de la base de datos. Esta operación no se puede deshacer. Solo ADMIN puede eliminar feriados.
 *     tags: [Feriados]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *           minimum: 1
 *         description: ID del feriado a eliminar
 *     responses:
 *       200:
 *         description: Feriado eliminado exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: 'Feriado eliminado exitosamente'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         description: Acceso denegado (requiere rol ADMIN)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: Feriado no encontrado
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
  requireRole(UserRole.ADMIN),
  auditMiddleware('ot_feriados'),
  validateParams(feriadoIdParamSchema),
  FeriadosController.deleteFeriado
);

export default router;
