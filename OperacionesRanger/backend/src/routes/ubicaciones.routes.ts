/**
 * Rutas de Ubicaciones
 * Sistema de Gestión de Turnos - OperacionesRanger
 *
 * Define las rutas HTTP para endpoints de ubicaciones.
 * Todas las rutas requieren autenticación JWT y tienen control de acceso por roles.
 *
 * @module routes/ubicaciones.routes
 */

import { Router } from 'express';
import { authMiddleware } from '../middlewares/auth.middleware';
import { requireRole } from '../middlewares/role.middleware';
import { auditMiddleware } from '../middlewares/audit.middleware';
import { validateBody, validateParams } from '../middlewares/validation.middleware';
import { paginationMiddleware } from '../middlewares/pagination.middleware';
import {
  createUbicacionSchema,
  updateUbicacionSchema,
  ubicacionIdParamSchema
} from '../schemas/ubicacion.schema';
import {
  getUbicacionesController,
  getUbicacionByIdController,
  createUbicacionController,
  updateUbicacionController,
  deleteUbicacionController
} from '../controllers/ubicaciones.controller';

const router = Router();

// ============================================================================
// MIDDLEWARE GLOBAL: TODAS LAS RUTAS REQUIEREN AUTENTICACIÓN
// ============================================================================

router.use(authMiddleware);

// ============================================================================
// RUTAS DE UBICACIONES
// ============================================================================

/**
 * @swagger
 * /api/ubicaciones:
 *   get:
 *     summary: Obtener lista paginada de ubicaciones
 *     description: Obtiene todas las ubicaciones con opciones de búsqueda y filtro por cliente. Soporta paginación para manejar listas grandes eficientemente.
 *     tags: [Ubicaciones]
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
 *           default: 20
 *           minimum: 1
 *           maximum: 100
 *         description: Cantidad de registros por página
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Búsqueda por nombre, dirección, provincia o municipio
 *       - in: query
 *         name: cliente_id
 *         schema:
 *           type: integer
 *         description: Filtrar ubicaciones por ID de cliente específico
 *     responses:
 *       200:
 *         description: Lista de ubicaciones obtenida exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Ubicacion'
 *                 total:
 *                   type: integer
 *                   example: 150
 *                 page:
 *                   type: integer
 *                   example: 1
 *                 pageSize:
 *                   type: integer
 *                   example: 20
 *                 totalPages:
 *                   type: integer
 *                   example: 8
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.get('/', requireRole('ADMIN', 'SUPERVISOR', 'CONSULTA'), paginationMiddleware, getUbicacionesController);

/**
 * @swagger
 * /api/ubicaciones/{id}:
 *   get:
 *     summary: Obtener ubicación por ID
 *     description: Obtiene una ubicación específica con información detallada incluyendo nombre del cliente y cantidad de puestos asociados
 *     tags: [Ubicaciones]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *           minimum: 1
 *         description: ID único de la ubicación
 *     responses:
 *       200:
 *         description: Ubicación encontrada exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/Ubicacion'
 *                 - type: object
 *                   properties:
 *                     cliente_nombre:
 *                       type: string
 *                       example: 'Banco Popular Dominicano'
 *                     puestos_count:
 *                       type: integer
 *                       example: 5
 *                       description: Cantidad de puestos asociados a esta ubicación
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       404:
 *         description: Ubicación no encontrada
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.get('/:id', requireRole('ADMIN', 'SUPERVISOR', 'CONSULTA'), validateParams(ubicacionIdParamSchema), getUbicacionByIdController);

/**
 * @swagger
 * /api/ubicaciones:
 *   post:
 *     summary: Crear nueva ubicación
 *     description: Crea una nueva ubicación física donde se prestará servicio de seguridad. Valida que el cliente exista y esté activo, y que el código sea único.
 *     tags: [Ubicaciones]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - cliente_id
 *               - codigo
 *               - nombre
 *             properties:
 *               cliente_id:
 *                 type: integer
 *                 example: 1
 *                 description: ID del cliente al que pertenece la ubicación
 *               codigo:
 *                 type: string
 *                 example: 'UBI001'
 *                 minLength: 2
 *                 maxLength: 20
 *                 description: Código único de la ubicación
 *               nombre:
 *                 type: string
 *                 example: 'Sucursal Churchill'
 *                 minLength: 1
 *                 maxLength: 150
 *                 description: Nombre de la ubicación
 *               direccion:
 *                 type: string
 *                 example: 'Av. Winston Churchill #1100'
 *                 maxLength: 255
 *               provincia:
 *                 type: string
 *                 example: 'Distrito Nacional'
 *                 maxLength: 100
 *               municipio:
 *                 type: string
 *                 example: 'Santo Domingo'
 *                 maxLength: 100
 *               sector:
 *                 type: string
 *                 example: 'Piantini'
 *                 maxLength: 100
 *               coordenadas_gps:
 *                 type: string
 *                 example: '18.4861,-69.9312'
 *                 pattern: '^-?\\d+\\.\\d+,-?\\d+\\.\\d+$'
 *                 description: Coordenadas GPS en formato latitud,longitud
 *               telefono:
 *                 type: string
 *                 example: '809-544-5000'
 *                 maxLength: 20
 *               contacto_nombre:
 *                 type: string
 *                 example: 'María González'
 *                 maxLength: 150
 *               contacto_telefono:
 *                 type: string
 *                 example: '809-555-1234'
 *                 maxLength: 20
 *     responses:
 *       201:
 *         description: Ubicación creada exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: 'Ubicación creada exitosamente'
 *                 data:
 *                   $ref: '#/components/schemas/Ubicacion'
 *       400:
 *         description: Error de validación (cliente inactivo, código duplicado, etc.)
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
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.post('/', requireRole('ADMIN', 'SUPERVISOR'), auditMiddleware('ot_ubicaciones'), validateBody(createUbicacionSchema), createUbicacionController);

/**
 * @swagger
 * /api/ubicaciones/{id}:
 *   put:
 *     summary: Actualizar ubicación existente
 *     description: Actualiza los datos de una ubicación. Todos los campos son opcionales. El cliente_id NO puede ser modificado.
 *     tags: [Ubicaciones]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *           minimum: 1
 *         description: ID de la ubicación a actualizar
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               codigo:
 *                 type: string
 *                 example: 'UBI002'
 *                 minLength: 2
 *                 maxLength: 20
 *               nombre:
 *                 type: string
 *                 example: 'Sucursal Churchill Renovada'
 *                 minLength: 1
 *                 maxLength: 150
 *               direccion:
 *                 type: string
 *                 maxLength: 255
 *               provincia:
 *                 type: string
 *                 maxLength: 100
 *               municipio:
 *                 type: string
 *                 maxLength: 100
 *               sector:
 *                 type: string
 *                 maxLength: 100
 *               coordenadas_gps:
 *                 type: string
 *                 pattern: '^-?\\d+\\.\\d+,-?\\d+\\.\\d+$'
 *               telefono:
 *                 type: string
 *                 maxLength: 20
 *               contacto_nombre:
 *                 type: string
 *                 maxLength: 150
 *               contacto_telefono:
 *                 type: string
 *                 maxLength: 20
 *               activo:
 *                 type: boolean
 *                 description: Estado activo/inactivo de la ubicación
 *     responses:
 *       200:
 *         description: Ubicación actualizada exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: 'Ubicación actualizada exitosamente'
 *                 data:
 *                   $ref: '#/components/schemas/Ubicacion'
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
 *         description: Ubicación no encontrada
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.put('/:id', requireRole('ADMIN', 'SUPERVISOR'), auditMiddleware('ot_ubicaciones'), validateParams(ubicacionIdParamSchema), validateBody(updateUbicacionSchema), updateUbicacionController);

/**
 * @swagger
 * /api/ubicaciones/{id}:
 *   delete:
 *     summary: Eliminar ubicación (soft delete)
 *     description: Desactiva una ubicación (activo = false). No se puede eliminar si tiene puestos activos asociados. Solo ADMIN puede ejecutar esta acción.
 *     tags: [Ubicaciones]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *           minimum: 1
 *         description: ID de la ubicación a desactivar
 *     responses:
 *       200:
 *         description: Ubicación desactivada exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: 'Ubicación desactivada exitosamente'
 *       400:
 *         description: No se puede eliminar porque tiene puestos activos asociados
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
 *         description: Ubicación no encontrada
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.delete('/:id', requireRole('ADMIN'), auditMiddleware('ot_ubicaciones'), validateParams(ubicacionIdParamSchema), deleteUbicacionController);

// ============================================================================
// EXPORTAR ROUTER
// ============================================================================

export default router;
