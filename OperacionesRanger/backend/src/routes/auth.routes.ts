/**
 * Rutas de Autenticación
 * Sistema de Gestión de Turnos - OperacionesRanger
 *
 * Define las rutas HTTP para endpoints de autenticación:
 * - POST /api/auth/login - Iniciar sesión
 * - POST /api/auth/refresh - Renovar access token
 * - POST /api/auth/logout - Cerrar sesión (requiere auth)
 * - POST /api/auth/change-password - Cambiar contraseña (requiere auth)
 *
 * Middleware de autenticación (authMiddleware) se integrará cuando T2.04 complete.
 */

import { Router } from 'express';
import * as authController from '../controllers/auth.controller';

// TODO: Importar authMiddleware cuando T2.04 (middleware de autenticación) esté completo
// import { authMiddleware } from '../middlewares/auth.middleware';

const router = Router();

// ========================================
// SWAGGER DOCUMENTATION
// ========================================

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     tags:
 *       - Auth
 *     summary: Iniciar sesión
 *     description: Autentica un usuario con username y password, retornando tokens JWT de acceso y refresco.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/LoginRequest'
 *           examples:
 *             admin:
 *               summary: Usuario administrador
 *               value:
 *                 username: admin
 *                 password: Admin123!
 *             supervisor:
 *               summary: Usuario supervisor
 *               value:
 *                 username: supervisor
 *                 password: Super123!
 *     responses:
 *       200:
 *         description: Login exitoso
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/LoginResponse'
 *             example:
 *               accessToken: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwidXNlcm5hbWUiOiJhZG1pbiIsInJvbCI6IkFETUlOIiwiaWF0IjoxNjQwMDAwMDAwLCJleHAiOjE2NDAwMDA5MDB9.abc123
 *               refreshToken: a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6
 *               user:
 *                 id: 1
 *                 username: admin
 *                 email: admin@operacionesranger.com
 *                 nombre_completo: Administrador del Sistema
 *                 rol: ADMIN
 *                 activo: true
 *       400:
 *         description: Error de validación
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ValidationError'
 *       401:
 *         description: Credenciales incorrectas
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               status: error
 *               message: Usuario o contraseña incorrectos
 *       403:
 *         description: Usuario bloqueado temporalmente
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               status: error
 *               message: Usuario bloqueado temporalmente por múltiples intentos fallidos. Intente nuevamente en 15 minuto(s).
 *       500:
 *         description: Error interno del servidor
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post('/login', authController.loginController);

/**
 * @swagger
 * /api/auth/refresh:
 *   post:
 *     tags:
 *       - Auth
 *     summary: Renovar token de acceso
 *     description: Genera un nuevo access token usando un refresh token válido. Útil cuando el access token expira (15 minutos).
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/RefreshTokenRequest'
 *           example:
 *             refreshToken: a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6
 *     responses:
 *       200:
 *         description: Nuevo access token generado exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/RefreshTokenResponse'
 *             example:
 *               accessToken: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.newtoken.signature
 *       400:
 *         description: Error de validación
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ValidationError'
 *       401:
 *         description: Refresh token inválido o expirado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               status: error
 *               message: Refresh token inválido o expirado
 *       500:
 *         description: Error interno del servidor
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post('/refresh', authController.refreshTokenController);

/**
 * @swagger
 * /api/auth/logout:
 *   post:
 *     tags:
 *       - Auth
 *     summary: Cerrar sesión
 *     description: Revoca el refresh token del usuario, invalidando futuras renovaciones de access token.
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/RefreshTokenRequest'
 *           example:
 *             refreshToken: a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6
 *     responses:
 *       200:
 *         description: Logout exitoso
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessMessage'
 *             example:
 *               message: Logout exitoso
 *       400:
 *         description: Error de validación
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ValidationError'
 *       401:
 *         description: No autenticado (token inválido o expirado)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               status: error
 *               message: Token JWT inválido o expirado
 *       500:
 *         description: Error interno del servidor
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post(
  '/logout',
  // authMiddleware,  // TODO: Descomentar cuando T2.04 complete
  authController.logoutController
);

/**
 * @swagger
 * /api/auth/change-password:
 *   post:
 *     tags:
 *       - Auth
 *     summary: Cambiar contraseña
 *     description: Permite al usuario autenticado cambiar su contraseña proporcionando la contraseña actual y la nueva.
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ChangePasswordRequest'
 *           example:
 *             currentPassword: OldPass123!
 *             newPassword: NewPass456!
 *     responses:
 *       200:
 *         description: Contraseña actualizada exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessMessage'
 *             example:
 *               message: Contraseña actualizada exitosamente
 *       400:
 *         description: Error de validación (nueva contraseña no cumple requisitos)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ValidationError'
 *             example:
 *               status: error
 *               message: Error de validación
 *               errors:
 *                 - field: newPassword
 *                   message: La contraseña debe tener al menos 8 caracteres
 *       401:
 *         description: Contraseña actual incorrecta o token inválido
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             examples:
 *               passwordIncorrecta:
 *                 summary: Contraseña actual incorrecta
 *                 value:
 *                   status: error
 *                   message: Contraseña actual incorrecta
 *               tokenInvalido:
 *                 summary: Token JWT inválido
 *                 value:
 *                   status: error
 *                   message: Token JWT inválido o expirado
 *       500:
 *         description: Error interno del servidor
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post(
  '/change-password',
  // authMiddleware,  // TODO: Descomentar cuando T2.04 complete
  authController.changePasswordController
);

export default router;
