/**
 * Controlador RRHH - Sistema de Gestión de Turnos
 *
 * Controladores HTTP para endpoints de consulta de guardianes
 * desde la base de datos RRHH externa.
 *
 * Todos los endpoints son READ-ONLY y requieren autenticación.
 * Permisos: ADMIN, SUPERVISOR, CONSULTA (todos pueden consultar).
 *
 * @module controllers/rrhh.controller
 */

import { Request, Response } from 'express';
import * as rrhhService from '../services/rrhh.service';

/**
 * GET /api/rrhh/guardianes
 *
 * Obtener lista paginada de guardianes activos
 *
 * **Query Parameters**:
 * - page (number, optional): Número de página (default: 1)
 * - pageSize (number, optional): Registros por página (default: 10, max: 100)
 * - search (string, optional): Término de búsqueda (nombres, apellidos, cédula)
 *
 * **Responses**:
 * - 200: Lista de guardianes con total
 * - 400: Parámetros inválidos
 * - 500: Error al consultar BD RRHH
 * - 503: BD RRHH no disponible
 *
 * @param req - Request de Express con query params
 * @param res - Response de Express
 *
 * @example
 * GET /api/rrhh/guardianes?page=1&pageSize=20
 * GET /api/rrhh/guardianes?search=Juan
 * GET /api/rrhh/guardianes?page=2&pageSize=50&search=Pérez
 *
 * Response:
 * {
 *   "data": [
 *     {
 *       "id_empleado": 1001,
 *       "cedula_empleado": "001-1234567-8",
 *       "nombre_completo": "Juan Pérez",
 *       ...
 *     }
 *   ],
 *   "total": 515
 * }
 */
export async function getGuardianes(req: Request, res: Response): Promise<void> {
  try {
    // Parsear query parameters
    const page = req.query.page ? parseInt(req.query.page as string, 10) : undefined;
    const pageSize = req.query.pageSize
      ? parseInt(req.query.pageSize as string, 10)
      : undefined;
    const search = req.query.search as string | undefined;

    // Validar parámetros numéricos
    if (page !== undefined && (isNaN(page) || page < 1)) {
      res.status(400).json({
        error: 'Parámetro inválido',
        message: 'El parámetro "page" debe ser un número entero mayor a 0',
      });
      return;
    }

    if (pageSize !== undefined && (isNaN(pageSize) || pageSize < 1)) {
      res.status(400).json({
        error: 'Parámetro inválido',
        message: 'El parámetro "pageSize" debe ser un número entero mayor a 0',
      });
      return;
    }

    // Llamar al servicio
    const result = await rrhhService.getGuardianes({
      page,
      pageSize,
      search,
    });

    // Retornar respuesta
    res.status(200).json(result);
  } catch (error) {
    console.error('[Controller RRHH] Error en getGuardianes:', error);

    // Determinar código de error apropiado
    if (error instanceof Error) {
      if (error.message.includes('no disponible')) {
        res.status(503).json({
          error: 'Servicio no disponible',
          message: error.message,
        });
        return;
      }

      if (error.message.includes('ETIMEDOUT') || error.message.includes('timeout')) {
        res.status(504).json({
          error: 'Gateway Timeout',
          message: 'Timeout al consultar base de datos RRHH',
        });
        return;
      }

      res.status(500).json({
        error: 'Error interno',
        message: 'Error al consultar guardianes',
      });
      return;
    }

    res.status(500).json({
      error: 'Error interno',
      message: 'Error desconocido al consultar guardianes',
    });
  }
}

/**
 * GET /api/rrhh/guardianes/:id
 *
 * Obtener guardián específico por ID
 *
 * **Path Parameters**:
 * - id (number): ID del empleado (id_empleado)
 *
 * **Responses**:
 * - 200: Guardián encontrado
 * - 400: ID inválido
 * - 404: Guardián no encontrado o no está activo
 * - 500: Error al consultar BD RRHH
 * - 503: BD RRHH no disponible
 *
 * @param req - Request de Express con path param :id
 * @param res - Response de Express
 *
 * @example
 * GET /api/rrhh/guardianes/1001
 *
 * Response 200:
 * {
 *   "id_empleado": 1001,
 *   "cedula_empleado": "001-1234567-8",
 *   "nombre_completo": "Juan Pérez",
 *   ...
 * }
 *
 * Response 404:
 * {
 *   "error": "No encontrado",
 *   "message": "Guardián con ID 1001 no encontrado o no está activo"
 * }
 */
export async function getGuardianById(req: Request, res: Response): Promise<void> {
  try {
    // Parsear ID desde path params
    const id = parseInt(req.params.id, 10);

    // Validar ID
    if (isNaN(id) || id < 1) {
      res.status(400).json({
        error: 'Parámetro inválido',
        message: 'El ID debe ser un número entero mayor a 0',
      });
      return;
    }

    // Llamar al servicio
    const guardian = await rrhhService.getGuardianById(id);

    // Verificar si se encontró
    if (!guardian) {
      res.status(404).json({
        error: 'No encontrado',
        message: `Guardián con ID ${id} no encontrado o no está activo`,
      });
      return;
    }

    // Retornar guardián encontrado
    res.status(200).json(guardian);
  } catch (error) {
    console.error('[Controller RRHH] Error en getGuardianById:', error);

    // Determinar código de error apropiado
    if (error instanceof Error) {
      if (error.message.includes('no disponible')) {
        res.status(503).json({
          error: 'Servicio no disponible',
          message: error.message,
        });
        return;
      }

      if (error.message.includes('ETIMEDOUT') || error.message.includes('timeout')) {
        res.status(504).json({
          error: 'Gateway Timeout',
          message: 'Timeout al consultar base de datos RRHH',
        });
        return;
      }

      res.status(500).json({
        error: 'Error interno',
        message: 'Error al consultar guardián',
      });
      return;
    }

    res.status(500).json({
      error: 'Error interno',
      message: 'Error desconocido al consultar guardián',
    });
  }
}

/**
 * GET /api/rrhh/guardianes/buscar/:search
 *
 * Buscar guardianes por término de búsqueda (búsqueda rápida)
 *
 * **Path Parameters**:
 * - search (string): Término de búsqueda (nombre, apellido o cédula)
 *
 * **Responses**:
 * - 200: Lista de guardianes encontrados (máximo 20)
 * - 400: Término de búsqueda inválido
 * - 500: Error al consultar BD RRHH
 * - 503: BD RRHH no disponible
 *
 * @param req - Request de Express con path param :search
 * @param res - Response de Express
 *
 * @example
 * GET /api/rrhh/guardianes/buscar/Juan
 * GET /api/rrhh/guardianes/buscar/001-1234567
 *
 * Response 200:
 * [
 *   {
 *     "id_empleado": 1001,
 *     "nombre_completo": "Juan Pérez",
 *     ...
 *   },
 *   {
 *     "id_empleado": 1005,
 *     "nombre_completo": "Juan García",
 *     ...
 *   }
 * ]
 */
export async function buscarGuardianes(req: Request, res: Response): Promise<void> {
  try {
    // Obtener término de búsqueda desde path params
    const search = req.params.search;

    // Validar término de búsqueda
    if (!search || search.trim().length === 0) {
      res.status(400).json({
        error: 'Parámetro inválido',
        message: 'El término de búsqueda no puede estar vacío',
      });
      return;
    }

    // Validar longitud mínima (al menos 2 caracteres)
    if (search.trim().length < 2) {
      res.status(400).json({
        error: 'Parámetro inválido',
        message: 'El término de búsqueda debe tener al menos 2 caracteres',
      });
      return;
    }

    // Llamar al servicio
    const resultados = await rrhhService.buscarGuardianes(search);

    // Retornar resultados (puede ser array vacío)
    res.status(200).json(resultados);
  } catch (error) {
    console.error('[Controller RRHH] Error en buscarGuardianes:', error);

    // Determinar código de error apropiado
    if (error instanceof Error) {
      if (error.message.includes('no disponible')) {
        res.status(503).json({
          error: 'Servicio no disponible',
          message: error.message,
        });
        return;
      }

      if (error.message.includes('ETIMEDOUT') || error.message.includes('timeout')) {
        res.status(504).json({
          error: 'Gateway Timeout',
          message: 'Timeout al consultar base de datos RRHH',
        });
        return;
      }

      res.status(500).json({
        error: 'Error interno',
        message: 'Error al buscar guardianes',
      });
      return;
    }

    res.status(500).json({
      error: 'Error interno',
      message: 'Error desconocido al buscar guardianes',
    });
  }
}

/**
 * POST /api/rrhh/cache/clear
 *
 * Limpiar caché de guardianes
 *
 * Elimina todas las entradas del caché forzando que las próximas consultas
 * vayan directo a la base de datos RRHH.
 *
 * **Permisos**: Solo ADMIN
 *
 * **Responses**:
 * - 200: Caché limpiado exitosamente con estadísticas
 * - 500: Error al limpiar caché
 *
 * @param req - Request de Express
 * @param res - Response de Express
 *
 * @example
 * POST /api/rrhh/cache/clear
 *
 * Response:
 * {
 *   "message": "Caché limpiado exitosamente",
 *   "cacheEnabled": true,
 *   "statsBeforeClear": {
 *     "keys": 15,
 *     "hits": 320,
 *     "misses": 45
 *   }
 * }
 */
export async function clearCache(req: Request, res: Response): Promise<void> {
  try {
    const result = await rrhhService.clearGuardianesCache();

    console.log(
      `[Controller RRHH] Caché limpiado por usuario ${req.user?.id} (${req.user?.username})`
    );

    res.status(200).json(result);
  } catch (error) {
    console.error('[Controller RRHH] Error en clearCache:', error);

    res.status(500).json({
      error: 'Error interno',
      message: 'Error al limpiar caché',
    });
  }
}

/**
 * GET /api/rrhh/cache/stats
 *
 * Obtener estadísticas del caché de guardianes
 *
 * Retorna información sobre el uso del caché incluyendo:
 * - Estado habilitado/deshabilitado
 * - Número de claves
 * - Hits y misses
 * - Hit rate (porcentaje de aciertos)
 * - Tamaño de memoria
 * - TTL configurado
 *
 * **Permisos**: ADMIN, SUPERVISOR
 *
 * **Responses**:
 * - 200: Estadísticas del caché
 * - 500: Error al obtener estadísticas
 *
 * @param req - Request de Express
 * @param res - Response de Express
 *
 * @example
 * GET /api/rrhh/cache/stats
 *
 * Response:
 * {
 *   "enabled": true,
 *   "keys": 15,
 *   "hits": 320,
 *   "misses": 45,
 *   "hitRate": 87.67,
 *   "memorySizeKB": 125.45,
 *   "ttlSeconds": 300
 * }
 */
export async function getCacheStats(_req: Request, res: Response): Promise<void> {
  try {
    const stats = await rrhhService.getGuardianesCacheStats();

    res.status(200).json(stats);
  } catch (error) {
    console.error('[Controller RRHH] Error en getCacheStats:', error);

    res.status(500).json({
      error: 'Error interno',
      message: 'Error al obtener estadísticas de caché',
    });
  }
}
