/**
 * Rutas de Turnos
 * Sistema de Gestión de Turnos - OperacionesRanger
 *
 * Define las rutas HTTP para la consulta de turnos de guardianes.
 * Todas las rutas están protegidas por autenticación JWT y son accesibles
 * por todos los roles (ADMIN, SUPERVISOR, CONSULTA).
 *
 * @module routes/turnos.routes
 */

import { Router } from 'express';
import { authMiddleware } from '../middlewares/auth.middleware';
import { requireRole } from '../middlewares/role.middleware';
import { auditMiddleware } from '../middlewares/audit.middleware';
import { validateQuery, validateParams, validateBody } from '../middlewares/validation.middleware';
import {
  turnoIdSchema,
  getTurnosQuerySchema,
  getResumenEmpleadoQuerySchema,
  createTurnoSchema,
  updateTurnoSchema,
  calendarioParamsSchema,
  calendarioQuerySchema
} from '../schemas/turno.schema';
import {
  getTurnosController,
  getTurnoByIdController,
  getResumenEmpleadoController,
  registrarTurnoController,
  actualizarTurnoController,
  eliminarTurnoController,
  getCalendarioController
} from '../controllers/turnos.controller';

const router = Router();

// ============================================================================
// RUTAS DE REGISTRO (POST)
// ============================================================================

/**
 * POST /api/turnos
 *
 * Registrar nuevo turno
 *
 * Permisos: ADMIN, SUPERVISOR únicamente
 *
 * Body (CreateTurnoDTO):
 * {
 *   empleado_id: number,         // ID del empleado en BD RRHH
 *   puesto_id: number,            // ID del puesto donde trabajará
 *   fecha: string,                // Fecha del turno (YYYY-MM-DD)
 *   hora_entrada: string,         // Hora de entrada (HH:MM:SS)
 *   hora_salida: string,          // Hora de salida (HH:MM:SS)
 *   horas_normales: number,       // Horas normales trabajadas (0-12)
 *   horas_extras: number,         // Horas extras trabajadas (0-4)
 *   observaciones?: string | null // Observaciones opcionales (max 1000 chars)
 * }
 *
 * Validaciones automáticas (Schema Zod):
 * - empleado_id > 0
 * - puesto_id > 0
 * - fecha formato YYYY-MM-DD, no futura > 7 días
 * - horas_normales entre 0 y 12
 * - horas_extras entre 0 y 4
 * - horas_normales + horas_extras <= 16
 *
 * Validaciones de negocio (Service):
 * - Empleado existe y está activo en BD RRHH (id_puesto=97, status=1)
 * - Puesto existe y está activo en BD turnos
 * - No existe turno duplicado para mismo empleado+puesto+fecha
 *
 * Campos auto-calculados por SP sp_registrar_turno:
 * - tipo_turno: DIURNO o NOCTURNO (según hora_entrada)
 * - es_feriado: true/false (según fecha)
 * - feriado_id: ID del feriado si aplica
 *
 * Response 201: Turno creado exitosamente
 * {
 *   message: "Turno registrado exitosamente",
 *   data: Turno (con todos los campos, incluyendo auto-calculados)
 * }
 *
 * Response 400: Validación fallida (empleado inactivo, puesto inactivo, horas excedidas)
 * Response 404: Empleado no existe o puesto no existe
 * Response 409: Turno duplicado (ya existe turno para empleado+puesto+fecha)
 *
 * Ejemplos de uso:
 * ```json
 * // Turno diurno normal
 * {
 *   "empleado_id": 1001,
 *   "puesto_id": 42,
 *   "fecha": "2026-01-20",
 *   "hora_entrada": "06:00:00",
 *   "hora_salida": "18:00:00",
 *   "horas_normales": 10.0,
 *   "horas_extras": 2.0
 * }
 *
 * // Turno nocturno
 * {
 *   "empleado_id": 1002,
 *   "puesto_id": 43,
 *   "fecha": "2026-01-20",
 *   "hora_entrada": "18:00:00",
 *   "hora_salida": "06:00:00",
 *   "horas_normales": 10.0,
 *   "horas_extras": 2.0,
 *   "observaciones": "Turno de cobertura"
 * }
 * ```
 */
router.post(
  '/',
  authMiddleware,
  requireRole('ADMIN', 'SUPERVISOR'),
  auditMiddleware('ot_turnos'),
  validateBody(createTurnoSchema),
  registrarTurnoController
);

// ============================================================================
// RUTAS DE CONSULTA (GET)
// ============================================================================

/**
 * GET /api/turnos/empleado/:empleado_id/resumen
 *
 * Obtener resumen de turnos de un empleado en un rango de fechas
 *
 * Permisos: ADMIN, SUPERVISOR, CONSULTA (todos los usuarios autenticados)
 *
 * Path params:
 * - empleado_id: ID del empleado en BD RRHH
 *
 * Query params (opcionales):
 * - fecha_inicio: Fecha inicio del rango (YYYY-MM-DD)
 * - fecha_fin: Fecha fin del rango (YYYY-MM-DD)
 *
 * Si no se proporcionan fechas:
 * - fecha_inicio = primer día del mes actual
 * - fecha_fin = hoy
 *
 * Response 200:
 * {
 *   empleado_id: number,
 *   nombre_empleado: string,
 *   total_turnos: number,
 *   total_horas_normales: number,
 *   total_horas_extras: number,
 *   turnos_diurnos: number,
 *   turnos_nocturnos: number,
 *   turnos_feriados: number
 * }
 *
 * Response 404: Empleado no encontrado
 *
 * NOTA: Esta ruta debe ir ANTES de /:id para evitar conflictos de routing
 */
router.get(
  '/empleado/:empleado_id/resumen',
  authMiddleware,
  requireRole('ADMIN', 'SUPERVISOR', 'CONSULTA'),
  validateQuery(getResumenEmpleadoQuerySchema),
  getResumenEmpleadoController
);

/**
 * GET /api/turnos/calendario/:año/:mes
 *
 * Obtener calendario mensual de turnos
 *
 * Permisos: Todos los usuarios autenticados (ADMIN, SUPERVISOR, CONSULTA)
 *
 * Path params:
 * - año: Año del calendario (2000-2100)
 * - mes: Mes del calendario (1-12)
 *
 * Query params (opcionales):
 * - empleado_id: Filtrar turnos por empleado específico
 * - puesto_id: Filtrar turnos por puesto específico
 * - ubicacion_id: Filtrar turnos por ubicación
 * - cliente_id: Filtrar turnos por cliente
 *
 * Response 200:
 * {
 *   "año": 2026,
 *   "mes": 1,
 *   "dias": [
 *     {
 *       "fecha": "2026-01-01",
 *       "es_feriado": true,
 *       "nombre_feriado": "Año Nuevo",
 *       "tipo_feriado": "NACIONAL",
 *       "turnos": [
 *         {
 *           "id": 1,
 *           "empleado": { "id": 1001, "nombre": "Juan Pérez" },
 *           "puesto": { "id": 42, "codigo": "P001", "nombre": "Entrada Principal" },
 *           "ubicacion": { "id": 10, "nombre": "Sucursal Centro" },
 *           "cliente": { "id": 5, "nombre": "Banco Popular" },
 *           "hora_entrada": "06:00:00",
 *           "hora_salida": "18:00:00",
 *           "tipo_turno": "DIURNO",
 *           "horas_normales": 10.0,
 *           "horas_extras": 2.0,
 *           "horas_totales": 12.0
 *         }
 *       ]
 *     }
 *   ]
 * }
 *
 * Características:
 * - Retorna TODOS los días del mes (1 al último día), incluso si no tienen turnos
 * - Días sin turnos tendrán array vacío: "turnos": []
 * - Identifica feriados automáticamente desde tabla feriados
 * - Optimizado para consultas de 1 mes (máximo ~1,500 registros)
 *
 * Casos de uso:
 * - Vista de calendario en frontend (FullCalendar, etc.)
 * - Planificación mensual de turnos
 * - Identificación de días feriados
 * - Dashboard de resumen mensual
 *
 * IMPORTANTE: Esta ruta debe ir ANTES de /:id para evitar que "calendario"
 * se interprete como un ID numérico.
 */
router.get(
  '/calendario/:año/:mes',
  authMiddleware,
  requireRole('ADMIN', 'SUPERVISOR', 'CONSULTA'),
  validateParams(calendarioParamsSchema),
  validateQuery(calendarioQuerySchema),
  getCalendarioController
);

/**
 * GET /api/turnos
 *
 * Listar turnos con paginación y filtros
 *
 * Permisos: ADMIN, SUPERVISOR, CONSULTA (todos los usuarios autenticados)
 *
 * Query params (todos opcionales):
 * - page: Número de página, default 1
 * - pageSize: Tamaño de página, default 10, max 100
 * - search: Búsqueda por nombre o cédula de empleado
 * - empleado_id: Filtrar por empleado específico
 * - puesto_id: Filtrar por puesto específico
 * - ubicacion_id: Filtrar por ubicación
 * - cliente_id: Filtrar por cliente
 * - fecha_inicio: Filtrar desde fecha (YYYY-MM-DD)
 * - fecha_fin: Filtrar hasta fecha (YYYY-MM-DD)
 * - tipo_turno: Filtrar por tipo (DIURNO | NOCTURNO)
 * - es_feriado: Filtrar por feriado (true | false)
 * - procesado_nomina: Filtrar por procesado (true | false)
 *
 * Response 200:
 * {
 *   data: Turno[],
 *   total: number,
 *   page: number,
 *   pageSize: number,
 *   totalPages: number
 * }
 *
 * Ejemplos:
 * - GET /api/turnos?page=1&pageSize=20
 * - GET /api/turnos?empleado_id=1001
 * - GET /api/turnos?fecha_inicio=2026-01-01&fecha_fin=2026-01-31
 * - GET /api/turnos?search=Juan&tipo_turno=NOCTURNO
 */
router.get(
  '/',
  authMiddleware,
  requireRole('ADMIN', 'SUPERVISOR', 'CONSULTA'),
  validateQuery(getTurnosQuerySchema),
  getTurnosController
);

/**
 * GET /api/turnos/:id
 *
 * Obtener turno por ID con relaciones completas
 *
 * Permisos: ADMIN, SUPERVISOR, CONSULTA
 *
 * Path params:
 * - id: ID del turno
 *
 * Response 200: TurnoConRelaciones con todos los campos y relaciones
 * {
 *   id, empleado_id, puesto_id, fecha, hora_entrada, hora_salida,
 *   horas_normales, horas_extras, tipo_turno, es_feriado, feriado_id,
 *   procesado_nomina, nomina_id, fecha_procesado, observaciones,
 *   created_by, created_at, updated_at,
 *   cedula_empleado, empleado_nombres, empleado_apellidos, empleado_nombre_completo,
 *   puesto_codigo, puesto_nombre,
 *   ubicacion_id, ubicacion_nombre, ubicacion_codigo,
 *   cliente_id, cliente_nombre,
 *   feriado_nombre, feriado_tipo
 * }
 *
 * Response 404: Turno no encontrado
 */
router.get(
  '/:id',
  authMiddleware,
  requireRole('ADMIN', 'SUPERVISOR', 'CONSULTA'),
  validateParams(turnoIdSchema),
  getTurnoByIdController
);

// ============================================================================
// RUTAS DE ACTUALIZACIÓN Y ELIMINACIÓN (PUT, DELETE)
// ============================================================================

/**
 * PUT /api/turnos/:id
 *
 * Actualizar turno existente
 *
 * Permisos: ADMIN, SUPERVISOR
 *
 * RESTRICCIÓN CRÍTICA: Solo si procesado_nomina = FALSE
 *
 * Path params:
 * - id: ID del turno a actualizar
 *
 * Body (UpdateTurnoDTO - todos los campos opcionales):
 * {
 *   hora_entrada?: string,      // Hora de entrada (HH:MM:SS)
 *   hora_salida?: string,        // Hora de salida (HH:MM:SS)
 *   horas_normales?: number,     // Horas normales (0-12)
 *   horas_extras?: number,       // Horas extras (0-4)
 *   observaciones?: string | null // Observaciones opcionales
 * }
 *
 * Campos NO modificables:
 * - empleado_id
 * - puesto_id
 * - fecha
 * (Si necesita cambiar estos, usar DELETE + POST)
 *
 * Validaciones:
 * - Turno debe existir
 * - Turno NO debe estar procesado (procesado_nomina = false)
 * - Empleado sigue activo
 * - Puesto sigue activo
 * - Horas normales <= 12
 * - Horas extras <= 4
 * - Horas totales <= 16
 *
 * Estrategia de actualización:
 * DELETE turno antiguo + INSERT nuevo (vía sp_registrar_turno)
 * para re-ejecutar validaciones y cálculos automáticos (tipo_turno, es_feriado)
 *
 * Response 200: Turno actualizado
 * {
 *   message: "Turno actualizado exitosamente",
 *   data: Turno (con campos recalculados)
 * }
 *
 * Response 400: Validación fallida
 * Response 403: Turno ya procesado (inmutable)
 * Response 404: Turno no existe
 *
 * Ejemplos:
 * ```json
 * // Actualizar solo horas
 * {
 *   "horas_normales": 11.0,
 *   "horas_extras": 1.0
 * }
 *
 * // Actualizar observaciones
 * {
 *   "observaciones": "Turno modificado por cambio de horario"
 * }
 * ```
 */
router.put(
  '/:id',
  authMiddleware,
  requireRole('ADMIN', 'SUPERVISOR'),
  auditMiddleware('ot_turnos'),
  validateParams(turnoIdSchema),
  validateBody(updateTurnoSchema),
  actualizarTurnoController
);

/**
 * DELETE /api/turnos/:id
 *
 * Eliminar turno
 *
 * Permisos: Solo ADMIN
 *
 * RESTRICCIÓN CRÍTICA: Solo si procesado_nomina = FALSE
 *
 * Path params:
 * - id: ID del turno a eliminar
 *
 * Validaciones:
 * - Turno debe existir
 * - Turno NO debe estar procesado (procesado_nomina = false)
 *
 * Response 200:
 * {
 *   message: "Turno eliminado exitosamente"
 * }
 *
 * Response 403: Turno ya procesado (no puede eliminarse)
 * Response 404: Turno no existe
 *
 * IMPORTANTE: Solo ADMIN puede eliminar turnos. SUPERVISOR puede actualizar
 * pero NO puede eliminar. Esta restricción es más estricta que PUT para
 * prevenir pérdida accidental de datos.
 */
router.delete(
  '/:id',
  authMiddleware,
  requireRole('ADMIN'), // Solo ADMIN puede eliminar
  auditMiddleware('ot_turnos'),
  validateParams(turnoIdSchema),
  eliminarTurnoController
);

// ============================================================================
// EXPORTAR ROUTER
// ============================================================================

export default router;
