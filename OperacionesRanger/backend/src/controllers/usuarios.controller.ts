/**
 * Controladores de Usuarios
 * Sistema de Gestión de Turnos - OperacionesRanger
 *
 * Maneja todas las solicitudes HTTP relacionadas con gestión de usuarios.
 * Todos los endpoints requieren autenticación y rol ADMIN.
 *
 * Endpoints:
 * - GET /api/usuarios - Listar usuarios (paginado)
 * - GET /api/usuarios/:id - Obtener usuario por ID
 * - POST /api/usuarios - Crear nuevo usuario
 * - PUT /api/usuarios/:id - Actualizar usuario
 * - DELETE /api/usuarios/:id - Desactivar usuario
 * - POST /api/usuarios/:id/reset-password - Resetear password
 *
 * @module controllers/usuarios.controller
 */

import { Request, Response } from 'express';
import * as usuariosService from '../services/usuarios.service';
import {
  createUserSchema,
  updateUserSchema,
  userIdParamSchema,
  paginationQuerySchema,
  formatZodErrors,
} from '../schemas/auth.schema';

// ============================================================================
// UTILIDADES
// ============================================================================

/**
 * Maneja errores y los transforma en respuestas HTTP apropiadas
 *
 * Códigos de respuesta:
 * - 400: Errores de validación o parámetros inválidos
 * - 404: Recurso no encontrado
 * - 409: Conflicto (username/email duplicado)
 * - 500: Error interno del servidor
 *
 * @param error - Error capturado
 * @param res - Response de Express
 */
function handleError(error: unknown, res: Response): void {
  console.error('[UsuariosController] Error:', error);

  if (error instanceof Error) {
    const message = error.message;

    // 404: Usuario no encontrado
    if (message.includes('no encontrado')) {
      res.status(404).json({
        error: 'No encontrado',
        message,
      });
      return;
    }

    // 409: Username o email duplicado
    if (message.includes('ya está en uso')) {
      res.status(409).json({
        error: 'Conflicto',
        message,
      });
      return;
    }

    // 400: Validaciones de negocio
    if (
      message.includes('último administrador') ||
      message.includes('página debe ser') ||
      message.includes('tamaño de página')
    ) {
      res.status(400).json({
        error: 'Solicitud inválida',
        message,
      });
      return;
    }

    // 500: Error genérico
    res.status(500).json({
      error: 'Error interno',
      message: 'Error al procesar la solicitud',
    });
    return;
  }

  // Error desconocido
  res.status(500).json({
    error: 'Error interno',
    message: 'Error inesperado al procesar la solicitud',
  });
}

// ============================================================================
// CONTROLADORES
// ============================================================================

/**
 * GET /api/usuarios
 *
 * Obtiene lista paginada de usuarios con búsqueda opcional
 *
 * Query params:
 * - page: número de página (default: 1)
 * - pageSize: tamaño de página (default: 20, max: 100)
 * - search: término de búsqueda opcional
 *
 * Responses:
 * - 200: Lista de usuarios con metadatos de paginación
 * - 400: Parámetros de paginación inválidos
 * - 401: No autenticado
 * - 403: No es ADMIN
 * - 500: Error interno
 */
export async function getUsuarios(req: Request, res: Response): Promise<void> {
  try {
    // Validar query params
    const validationResult = paginationQuerySchema.safeParse(req.query);

    if (!validationResult.success) {
      res.status(400).json({
        error: 'Parámetros inválidos',
        details: formatZodErrors(validationResult.error),
      });
      return;
    }

    const { page, pageSize, search } = validationResult.data;

    // Llamar al servicio
    const result = await usuariosService.getUsuarios({
      page,
      pageSize,
      search,
    });

    // Responder con resultado paginado
    res.status(200).json(result);
  } catch (error) {
    handleError(error, res);
  }
}

/**
 * GET /api/usuarios/:id
 *
 * Obtiene un usuario específico por su ID
 *
 * Path params:
 * - id: ID del usuario
 *
 * Responses:
 * - 200: Usuario encontrado
 * - 400: ID inválido
 * - 404: Usuario no encontrado
 * - 401: No autenticado
 * - 403: No es ADMIN
 * - 500: Error interno
 */
export async function getUsuarioById(
  req: Request,
  res: Response
): Promise<void> {
  try {
    // Validar parámetro ID
    const validationResult = userIdParamSchema.safeParse(req.params);

    if (!validationResult.success) {
      res.status(400).json({
        error: 'ID inválido',
        details: formatZodErrors(validationResult.error),
      });
      return;
    }

    const { id } = validationResult.data;

    // Llamar al servicio
    const usuario = await usuariosService.getUsuarioById(id);

    // Responder con usuario
    res.status(200).json(usuario);
  } catch (error) {
    handleError(error, res);
  }
}

/**
 * POST /api/usuarios
 *
 * Crea un nuevo usuario en el sistema
 *
 * Body:
 * - username: string (3-50 chars, único, alfanumérico + _)
 * - password: string (8-100 chars, 1 mayúscula, 1 minúscula, 1 número)
 * - email: string? (opcional, único si existe)
 * - nombre_completo: string (1-150 chars)
 * - rol: 'ADMIN' | 'SUPERVISOR' | 'CONSULTA'
 *
 * Responses:
 * - 201: Usuario creado exitosamente
 * - 400: Datos inválidos
 * - 409: Username o email duplicado
 * - 401: No autenticado
 * - 403: No es ADMIN
 * - 500: Error interno
 */
export async function createUsuario(
  req: Request,
  res: Response
): Promise<void> {
  try {
    // Validar body
    const validationResult = createUserSchema.safeParse(req.body);

    if (!validationResult.success) {
      res.status(400).json({
        error: 'Datos inválidos',
        details: formatZodErrors(validationResult.error),
      });
      return;
    }

    const dto = validationResult.data;

    // Obtener ID del usuario que crea (desde token JWT)
    const createdBy = (req as any).user!.sub; // Garantizado por authMiddleware

    // Llamar al servicio
    const nuevoUsuario = await usuariosService.createUsuario(dto, createdBy);

    // Responder con usuario creado
    res.status(201).json(nuevoUsuario);
  } catch (error) {
    handleError(error, res);
  }
}

/**
 * PUT /api/usuarios/:id
 *
 * Actualiza información de un usuario existente
 *
 * Path params:
 * - id: ID del usuario
 *
 * Body (todos opcionales, al menos uno requerido):
 * - email: string?
 * - nombre_completo: string?
 * - rol: 'ADMIN' | 'SUPERVISOR' | 'CONSULTA'?
 * - activo: boolean?
 *
 * Nota: NO permite cambiar password (usar /reset-password)
 *
 * Responses:
 * - 200: Usuario actualizado exitosamente
 * - 400: Datos inválidos o sin cambios
 * - 404: Usuario no encontrado
 * - 409: Email duplicado
 * - 401: No autenticado
 * - 403: No es ADMIN
 * - 500: Error interno
 */
export async function updateUsuario(
  req: Request,
  res: Response
): Promise<void> {
  try {
    // Validar parámetro ID
    const paramsValidation = userIdParamSchema.safeParse(req.params);

    if (!paramsValidation.success) {
      res.status(400).json({
        error: 'ID inválido',
        details: formatZodErrors(paramsValidation.error),
      });
      return;
    }

    const { id } = paramsValidation.data;

    // Validar body
    const bodyValidation = updateUserSchema.safeParse(req.body);

    if (!bodyValidation.success) {
      res.status(400).json({
        error: 'Datos inválidos',
        details: formatZodErrors(bodyValidation.error),
      });
      return;
    }

    const dto = bodyValidation.data;

    // Obtener ID del usuario que modifica (desde token JWT)
    const modifiedBy = (req as any).user!.sub;

    // Llamar al servicio
    const usuarioActualizado = await usuariosService.updateUsuario(
      id,
      dto,
      modifiedBy
    );

    // Responder con usuario actualizado
    res.status(200).json(usuarioActualizado);
  } catch (error) {
    handleError(error, res);
  }
}

/**
 * DELETE /api/usuarios/:id
 *
 * Desactiva un usuario (soft delete)
 *
 * Path params:
 * - id: ID del usuario
 *
 * Validación: No permite desactivar el último administrador activo
 *
 * Responses:
 * - 200: Usuario desactivado exitosamente
 * - 400: ID inválido o es el último admin
 * - 404: Usuario no encontrado
 * - 401: No autenticado
 * - 403: No es ADMIN
 * - 500: Error interno
 */
export async function deleteUsuario(
  req: Request,
  res: Response
): Promise<void> {
  try {
    // Validar parámetro ID
    const validationResult = userIdParamSchema.safeParse(req.params);

    if (!validationResult.success) {
      res.status(400).json({
        error: 'ID inválido',
        details: formatZodErrors(validationResult.error),
      });
      return;
    }

    const { id } = validationResult.data;

    // Llamar al servicio
    await usuariosService.deleteUsuario(id);

    // Responder con mensaje de éxito
    res.status(200).json({
      message: 'Usuario desactivado exitosamente',
    });
  } catch (error) {
    handleError(error, res);
  }
}

/**
 * POST /api/usuarios/:id/reset-password
 *
 * Resetea el password de un usuario generando uno temporal
 *
 * Path params:
 * - id: ID del usuario
 *
 * El password temporal:
 * - Es generado aleatoriamente (12 caracteres)
 * - Cumple requisitos de seguridad
 * - Debe ser cambiado por el usuario en su primer login
 *
 * Responses:
 * - 200: Password reseteado, retorna password temporal
 * - 400: ID inválido
 * - 404: Usuario no encontrado
 * - 401: No autenticado
 * - 403: No es ADMIN
 * - 500: Error interno
 */
export async function resetPassword(
  req: Request,
  res: Response
): Promise<void> {
  try {
    // Validar parámetro ID
    const validationResult = userIdParamSchema.safeParse(req.params);

    if (!validationResult.success) {
      res.status(400).json({
        error: 'ID inválido',
        details: formatZodErrors(validationResult.error),
      });
      return;
    }

    const { id } = validationResult.data;

    // Llamar al servicio
    const temporaryPassword = await usuariosService.resetPassword(id);

    // Responder con password temporal
    res.status(200).json({
      message: 'Password reseteado exitosamente',
      temporaryPassword,
      warning:
        'Este password temporal debe ser cambiado en el primer login del usuario',
    });
  } catch (error) {
    handleError(error, res);
  }
}
