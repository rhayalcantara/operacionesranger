/**
 * Controlador de Clientes
 * Sistema de Gestión de Turnos - OperacionesRanger
 *
 * Request handlers para endpoints de gestión de clientes.
 * Maneja validación de entrada, llamadas al servicio, y respuestas HTTP.
 *
 * @module controllers/clientes.controller
 */

import { Request, Response } from 'express';
import * as clientesService from '../services/clientes.service';
import { CreateClienteDTO } from '../models/cliente.model';
import {
  createClienteSchema,
  updateClienteSchema,
  clienteIdParamSchema,
  clientesPaginationQuerySchema,
  formatZodErrors
} from '../schemas/cliente.schema';

// ============================================================================
// CONTROLADORES
// ============================================================================

/**
 * GET /api/clientes
 *
 * Obtiene lista paginada de clientes con búsqueda opcional
 *
 * Query params:
 * - page: número de página (default: 1)
 * - pageSize: tamaño de página (default: 20, max: 100)
 * - search: término de búsqueda (opcional)
 *
 * Respuestas:
 * - 200: Lista de clientes paginada
 * - 400: Parámetros de query inválidos
 * - 500: Error interno del servidor
 */
export async function getClientes(req: Request, res: Response): Promise<void> {
  try {
    // 1. Validar query params
    const validationResult = clientesPaginationQuerySchema.safeParse(req.query);

    if (!validationResult.success) {
      res.status(400).json({
        error: 'Parámetros de búsqueda inválidos',
        details: formatZodErrors(validationResult.error)
      });
      return;
    }

    const { page, pageSize, search, activo } = validationResult.data;

    // 2. Llamar al servicio
    const result = await clientesService.getClientes(page, pageSize, search, activo);

    // 3. Responder con éxito
    res.status(200).json(result);
  } catch (error) {
    console.error('[CLIENTES] Error en getClientes:', error);
    res.status(500).json({
      error: 'Error interno del servidor',
      message: 'No se pudo obtener la lista de clientes'
    });
  }
}

/**
 * GET /api/clientes/:id
 *
 * Obtiene un cliente por su ID con información adicional
 *
 * Params:
 * - id: ID del cliente
 *
 * Respuestas:
 * - 200: Cliente encontrado
 * - 400: ID inválido
 * - 404: Cliente no encontrado
 * - 500: Error interno del servidor
 */
export async function getClienteById(req: Request, res: Response): Promise<void> {
  try {
    // 1. Validar parámetro ID
    const validationResult = clienteIdParamSchema.safeParse(req.params);

    if (!validationResult.success) {
      res.status(400).json({
        error: 'ID de cliente inválido',
        details: formatZodErrors(validationResult.error)
      });
      return;
    }

    const { id } = validationResult.data;

    // 2. Llamar al servicio
    const cliente = await clientesService.getClienteById(id);

    // 3. Responder con éxito
    res.status(200).json(cliente);
  } catch (error: any) {
    // Error 404 si cliente no existe
    if (error.message?.includes('no encontrado')) {
      res.status(404).json({
        error: 'Cliente no encontrado',
        message: error.message
      });
      return;
    }

    console.error('[CLIENTES] Error en getClienteById:', error);
    res.status(500).json({
      error: 'Error interno del servidor',
      message: 'No se pudo obtener el cliente'
    });
  }
}

/**
 * POST /api/clientes
 *
 * Crea un nuevo cliente
 *
 * Body:
 * - codigo: string (requerido, único)
 * - nombre: string (requerido)
 * - rnc: string (opcional, único, 9-11 dígitos)
 * - telefono: string (opcional)
 * - email: string (opcional, válido)
 * - direccion: string (opcional)
 * - contacto_nombre: string (opcional)
 * - contacto_telefono: string (opcional)
 *
 * Respuestas:
 * - 201: Cliente creado exitosamente
 * - 400: Datos de entrada inválidos
 * - 409: Código o RNC duplicados
 * - 500: Error interno del servidor
 */
export async function createCliente(req: Request, res: Response): Promise<void> {
  try {
    // 1. Validar body
    const validationResult = createClienteSchema.safeParse(req.body);

    if (!validationResult.success) {
      res.status(400).json({
        error: 'Datos de entrada inválidos',
        details: formatZodErrors(validationResult.error)
      });
      return;
    }

    const clienteData = validationResult.data as CreateClienteDTO;

    // 2. Llamar al servicio
    const nuevoCliente = await clientesService.createCliente(clienteData);

    // 3. Responder con éxito (201 Created)
    res.status(201).json(nuevoCliente);
  } catch (error: any) {
    // Error 409 si código o RNC duplicados
    if (error.message?.includes('Ya existe')) {
      res.status(409).json({
        error: 'Conflicto',
        message: error.message
      });
      return;
    }

    console.error('[CLIENTES] Error en createCliente:', error);
    res.status(500).json({
      error: 'Error interno del servidor',
      message: 'No se pudo crear el cliente'
    });
  }
}

/**
 * PUT /api/clientes/:id
 *
 * Actualiza un cliente existente
 *
 * Params:
 * - id: ID del cliente
 *
 * Body (todos opcionales, al menos uno requerido):
 * - codigo: string
 * - nombre: string
 * - rnc: string
 * - telefono: string
 * - email: string
 * - direccion: string
 * - contacto_nombre: string
 * - contacto_telefono: string
 * - activo: boolean
 *
 * Respuestas:
 * - 200: Cliente actualizado exitosamente
 * - 400: ID o datos inválidos
 * - 404: Cliente no encontrado
 * - 409: Código o RNC duplicados
 * - 500: Error interno del servidor
 */
export async function updateCliente(req: Request, res: Response): Promise<void> {
  try {
    // 1. Validar parámetro ID
    const paramValidation = clienteIdParamSchema.safeParse(req.params);

    if (!paramValidation.success) {
      res.status(400).json({
        error: 'ID de cliente inválido',
        details: formatZodErrors(paramValidation.error)
      });
      return;
    }

    const { id } = paramValidation.data;

    // 2. Validar body
    const bodyValidation = updateClienteSchema.safeParse(req.body);

    if (!bodyValidation.success) {
      res.status(400).json({
        error: 'Datos de entrada inválidos',
        details: formatZodErrors(bodyValidation.error)
      });
      return;
    }

    const updateData = bodyValidation.data;

    // 3. Llamar al servicio
    const clienteActualizado = await clientesService.updateCliente(id, updateData);

    // 4. Responder con éxito
    res.status(200).json(clienteActualizado);
  } catch (error: any) {
    // Error 404 si cliente no existe
    if (error.message?.includes('no encontrado')) {
      res.status(404).json({
        error: 'Cliente no encontrado',
        message: error.message
      });
      return;
    }

    // Error 409 si código o RNC duplicados
    if (error.message?.includes('Ya existe')) {
      res.status(409).json({
        error: 'Conflicto',
        message: error.message
      });
      return;
    }

    console.error('[CLIENTES] Error en updateCliente:', error);
    res.status(500).json({
      error: 'Error interno del servidor',
      message: 'No se pudo actualizar el cliente'
    });
  }
}

/**
 * DELETE /api/clientes/:id
 *
 * Elimina un cliente (soft delete)
 *
 * Validaciones:
 * - Cliente debe existir
 * - Cliente NO debe tener ubicaciones activas
 *
 * Acción: Marca el cliente como inactivo (activo = FALSE)
 *
 * Params:
 * - id: ID del cliente
 *
 * Respuestas:
 * - 200: Cliente eliminado exitosamente
 * - 400: ID inválido
 * - 404: Cliente no encontrado
 * - 409: Cliente tiene ubicaciones activas (no se puede eliminar)
 * - 500: Error interno del servidor
 */
export async function deleteCliente(req: Request, res: Response): Promise<void> {
  try {
    // 1. Validar parámetro ID
    const validationResult = clienteIdParamSchema.safeParse(req.params);

    if (!validationResult.success) {
      res.status(400).json({
        error: 'ID de cliente inválido',
        details: formatZodErrors(validationResult.error)
      });
      return;
    }

    const { id } = validationResult.data;

    // 2. Llamar al servicio (soft delete)
    await clientesService.deleteCliente(id);

    // 3. Responder con éxito
    res.status(200).json({
      message: 'Cliente desactivado exitosamente',
      id
    });
  } catch (error: any) {
    // Error 404 si cliente no existe
    if (error.message?.includes('no encontrado')) {
      res.status(404).json({
        error: 'Cliente no encontrado',
        message: error.message
      });
      return;
    }

    // Error 409 si tiene ubicaciones activas
    if (error.message?.includes('ubicación')) {
      res.status(409).json({
        error: 'No se puede eliminar',
        message: error.message
      });
      return;
    }

    console.error('[CLIENTES] Error en deleteCliente:', error);
    res.status(500).json({
      error: 'Error interno del servidor',
      message: 'No se pudo eliminar el cliente'
    });
  }
}
