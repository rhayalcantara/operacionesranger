/**
 * Rutas RRHH - Sistema de Gestión de Turnos
 *
 * Definición de rutas HTTP para consulta de guardianes
 * desde la base de datos RRHH externa.
 *
 * **Base path**: /api/rrhh
 *
 * **Autenticación**: Todas las rutas requieren JWT token válido
 * **Autorización**: Todos los roles pueden acceder (ADMIN, SUPERVISOR, CONSULTA)
 *
 * @module routes/rrhh.routes
 */

import { Router } from 'express';
import { authMiddleware } from '../middlewares/auth.middleware';
import { requireRole } from '../middlewares/role.middleware';
import { UserRole } from '../models/auth.model';
import * as rrhhController from '../controllers/rrhh.controller';

const router = Router();

/**
 * Middleware global de autenticación para todas las rutas
 * Todas las rutas de RRHH requieren token JWT válido
 */
router.use(authMiddleware);

// ============================================================================
// RUTAS DE CACHÉ (solo ADMIN y SUPERVISOR)
// ============================================================================

/**
 * POST /api/rrhh/cache/clear
 *
 * Limpiar caché de guardianes
 *
 * **Permisos**: Solo ADMIN
 *
 * **Responses**:
 * - 200: { message, cacheEnabled, statsBeforeClear }
 * - 401: No autenticado
 * - 403: No autorizado (no es ADMIN)
 * - 500: Error al limpiar caché
 *
 * @route POST /api/rrhh/cache/clear
 * @access Solo ADMIN
 */
router.post('/cache/clear', requireRole(UserRole.ADMIN), rrhhController.clearCache);

/**
 * GET /api/rrhh/cache/stats
 *
 * Obtener estadísticas del caché de guardianes
 *
 * **Permisos**: ADMIN, SUPERVISOR
 *
 * **Responses**:
 * - 200: { enabled, keys, hits, misses, hitRate, memorySizeKB, ttlSeconds }
 * - 401: No autenticado
 * - 403: No autorizado (no es ADMIN ni SUPERVISOR)
 * - 500: Error al obtener estadísticas
 *
 * @route GET /api/rrhh/cache/stats
 * @access ADMIN, SUPERVISOR
 */
router.get(
  '/cache/stats',
  requireRole(UserRole.ADMIN, UserRole.SUPERVISOR),
  rrhhController.getCacheStats
);

// ============================================================================
// RUTAS DE CONSULTA DE GUARDIANES (todos los roles autenticados)
// ============================================================================

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
 * **Permisos**: ADMIN, SUPERVISOR, CONSULTA
 *
 * **Responses**:
 * - 200: { data: Guardian[], total: number }
 * - 400: Parámetros inválidos
 * - 401: No autenticado
 * - 500: Error al consultar BD RRHH
 * - 503: BD RRHH no disponible
 *
 * @route GET /api/rrhh/guardianes
 * @access Todos los usuarios autenticados
 */
router.get(
  '/guardianes',
  requireRole(UserRole.ADMIN, UserRole.SUPERVISOR, UserRole.CONSULTA),
  rrhhController.getGuardianes
);

/**
 * GET /api/rrhh/guardianes/:id
 *
 * Obtener guardián específico por ID
 *
 * **Path Parameters**:
 * - id (number): ID del empleado (id_empleado)
 *
 * **Permisos**: ADMIN, SUPERVISOR, CONSULTA
 *
 * **Responses**:
 * - 200: Guardian object
 * - 400: ID inválido
 * - 401: No autenticado
 * - 404: Guardián no encontrado o no está activo
 * - 500: Error al consultar BD RRHH
 * - 503: BD RRHH no disponible
 *
 * @route GET /api/rrhh/guardianes/:id
 * @access Todos los usuarios autenticados
 */
router.get(
  '/guardianes/:id',
  requireRole(UserRole.ADMIN, UserRole.SUPERVISOR, UserRole.CONSULTA),
  rrhhController.getGuardianById
);

/**
 * GET /api/rrhh/guardianes/buscar/:search
 *
 * Buscar guardianes por término de búsqueda (búsqueda rápida)
 *
 * **Path Parameters**:
 * - search (string): Término de búsqueda (nombre, apellido o cédula)
 *   - Mínimo 2 caracteres
 *
 * **Permisos**: ADMIN, SUPERVISOR, CONSULTA
 *
 * **Responses**:
 * - 200: Guardian[] (máximo 20 resultados)
 * - 400: Término de búsqueda inválido
 * - 401: No autenticado
 * - 500: Error al consultar BD RRHH
 * - 503: BD RRHH no disponible
 *
 * @route GET /api/rrhh/guardianes/buscar/:search
 * @access Todos los usuarios autenticados
 *
 * @note Esta ruta DEBE estar ANTES de /guardianes/:id para evitar conflicto
 * de rutas (Express matchea rutas en orden de definición)
 */
router.get(
  '/guardianes/buscar/:search',
  requireRole(UserRole.ADMIN, UserRole.SUPERVISOR, UserRole.CONSULTA),
  rrhhController.buscarGuardianes
);

export default router;
