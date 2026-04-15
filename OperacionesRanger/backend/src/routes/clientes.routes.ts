/**
 * Rutas de Clientes
 * Sistema de Gestión de Turnos - OperacionesRanger
 *
 * Define las rutas HTTP para gestión de clientes con protección
 * por autenticación y autorización basada en roles.
 *
 * Permisos:
 * - GET (listar/obtener): ADMIN, SUPERVISOR, CONSULTA (todos)
 * - POST (crear): ADMIN, SUPERVISOR
 * - PUT (actualizar): ADMIN, SUPERVISOR
 * - DELETE (eliminar): Solo ADMIN
 *
 * @module routes/clientes.routes
 */

import { Router } from 'express';
import { authMiddleware } from '../middlewares/auth.middleware';
import { requireRole } from '../middlewares/role.middleware';
import { auditMiddleware } from '../middlewares/audit.middleware';
import { validateBody, validateParams } from '../middlewares/validation.middleware';
import { paginationMiddleware } from '../middlewares/pagination.middleware';
import { UserRole } from '../models/auth.model';
import {
  createClienteSchema,
  updateClienteSchema,
  clienteIdParamSchema
} from '../schemas/cliente.schema';
import * as clientesController from '../controllers/clientes.controller';

const router = Router();

// ============================================================================
// TODAS LAS RUTAS REQUIEREN AUTENTICACIÓN
// ============================================================================

router.use(authMiddleware);

// ============================================================================
// RUTAS DE CLIENTES
// ============================================================================

/**
 * @swagger
 * /api/clientes:
 *   get:
 *     tags:
 *       - Clientes
 *     summary: Listar clientes (paginado)
 *     description: Obtiene lista paginada de clientes con búsqueda opcional por código, nombre, RUC o email.
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Número de página
 *       - in: query
 *         name: pageSize
 *         schema:
 *           type: integer
 *           default: 20
 *           maximum: 100
 *         description: Elementos por página
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Término de búsqueda (código, nombre, RUC, email)
 *     responses:
 *       200:
 *         description: Lista de clientes obtenida exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/PaginatedResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Cliente'
 *       400:
 *         description: Parámetros de query inválidos
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ValidationError'
 *       401:
 *         description: No autenticado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         description: Error interno del servidor
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get(
  '/',
  requireRole(UserRole.ADMIN, UserRole.SUPERVISOR, UserRole.CONSULTA),
  paginationMiddleware,
  clientesController.getClientes
);

/**
 * @swagger
 * /api/clientes/{id}:
 *   get:
 *     tags:
 *       - Clientes
 *     summary: Obtener cliente por ID
 *     description: Obtiene un cliente específico por su ID con información adicional (incluye cantidad de ubicaciones activas).
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID del cliente
 *     responses:
 *       200:
 *         description: Cliente encontrado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Cliente'
 *       400:
 *         description: ID inválido
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ValidationError'
 *       401:
 *         description: No autenticado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: Cliente no encontrado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         description: Error interno del servidor
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get(
  '/:id',
  requireRole(UserRole.ADMIN, UserRole.SUPERVISOR, UserRole.CONSULTA),
  validateParams(clienteIdParamSchema),
  clientesController.getClienteById
);

/**
 * @swagger
 * /api/clientes:
 *   post:
 *     tags:
 *       - Clientes
 *     summary: Crear nuevo cliente
 *     description: Crea un nuevo cliente en el sistema con código único, nombre, RUC, y datos de contacto.
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - codigo
 *               - nombre
 *             properties:
 *               codigo:
 *                 type: string
 *                 example: CLI001
 *               nombre:
 *                 type: string
 *                 example: Banco Popular Dominicano
 *               ruc:
 *                 type: string
 *                 example: '101234567'
 *               telefono:
 *                 type: string
 *                 example: 809-544-5000
 *               email:
 *                 type: string
 *                 format: email
 *                 example: contacto@bancopopular.com.do
 *               direccion:
 *                 type: string
 *                 example: Av. Winston Churchill, Torre Popular
 *               contacto_nombre:
 *                 type: string
 *                 example: María González
 *     responses:
 *       201:
 *         description: Cliente creado exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Cliente'
 *       400:
 *         description: Datos de entrada inválidos
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ValidationError'
 *       401:
 *         description: No autenticado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       403:
 *         description: Sin permisos (requiere ADMIN o SUPERVISOR)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       409:
 *         description: Código o RNC duplicados
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         description: Error interno del servidor
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post(
  '/',
  requireRole(UserRole.ADMIN, UserRole.SUPERVISOR),
  auditMiddleware('ot_clientes'),
  validateBody(createClienteSchema),
  clientesController.createCliente
);

/**
 * @swagger
 * /api/clientes/{id}:
 *   put:
 *     tags:
 *       - Clientes
 *     summary: Actualizar cliente
 *     description: Actualiza un cliente existente. Todos los campos son opcionales, al menos uno requerido.
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID del cliente
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               codigo:
 *                 type: string
 *               nombre:
 *                 type: string
 *               ruc:
 *                 type: string
 *               telefono:
 *                 type: string
 *               email:
 *                 type: string
 *               direccion:
 *                 type: string
 *               contacto_nombre:
 *                 type: string
 *               activo:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Cliente actualizado exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Cliente'
 *       400:
 *         description: ID o datos inválidos
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ValidationError'
 *       401:
 *         description: No autenticado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       403:
 *         description: Sin permisos (requiere ADMIN o SUPERVISOR)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: Cliente no encontrado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       409:
 *         description: Código o RNC duplicados
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         description: Error interno del servidor
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.put(
  '/:id',
  requireRole(UserRole.ADMIN, UserRole.SUPERVISOR),
  auditMiddleware('ot_clientes'),
  validateParams(clienteIdParamSchema),
  validateBody(updateClienteSchema),
  clientesController.updateCliente
);

/**
 * @swagger
 * /api/clientes/{id}:
 *   delete:
 *     tags:
 *       - Clientes
 *     summary: Desactivar cliente (soft delete)
 *     description: Marca el cliente como inactivo. NO elimina el registro. Validación - no permitir si tiene ubicaciones activas.
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID del cliente
 *     responses:
 *       200:
 *         description: Cliente desactivado exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessMessage'
 *       400:
 *         description: ID inválido
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ValidationError'
 *       401:
 *         description: No autenticado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       403:
 *         description: Sin permisos (requiere rol ADMIN)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: Cliente no encontrado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       409:
 *         description: Cliente tiene ubicaciones activas (no se puede eliminar)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         description: Error interno del servidor
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.delete(
  '/:id',
  requireRole(UserRole.ADMIN),
  auditMiddleware('ot_clientes'),
  validateParams(clienteIdParamSchema),
  clientesController.deleteCliente
);

// ============================================================================
// EXPORTAR ROUTER
// ============================================================================

export default router;
