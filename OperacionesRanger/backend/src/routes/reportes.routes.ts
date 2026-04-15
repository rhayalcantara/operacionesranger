/**
 * Rutas: Reportes
 *
 * Define endpoints para generación de reportes CSV para nómina.
 * Aplica middlewares de autenticación, autorización y validación.
 *
 * @module routes/reportes.routes
 */

import { Router } from 'express';
import { authMiddleware } from '../middlewares/auth.middleware';
import { requireRole } from '../middlewares/role.middleware';
import { auditMiddleware } from '../middlewares/audit.middleware';
import { validateBody, validateQuery, validateParams } from '../middlewares/validation.middleware';
import {
  generarReporteNominaController,
  marcarProcesadosController,
  getVistaPreviaNominaController,
  getResumenQuincenaController,
  getResumenPorGuardianController,
  getResumenPorPuestoController,
  getHistorialReportesController,
  descargarReporteController,
} from '../controllers/reportes.controller';
import {
  generarReporteNominaSchema,
  marcarProcesadosSchema,
  vistaPreviaQuerySchema,
  resumenQuincenaQuerySchema,
  resumenPorGuardianQuerySchema,
  resumenPorPuestoQuerySchema,
  getHistorialReportesSchema,
  descargarReporteSchema,
} from '../schemas/reporte.schema';

const router = Router();

/**
 * POST /api/reportes/nomina
 *
 * Generar reporte CSV para nómina
 *
 * **Permisos**: ADMIN, SUPERVISOR
 *
 * **Body**:
 * ```json
 * {
 *   "fecha_inicio": "2026-01-01",
 *   "fecha_fin": "2026-01-15"
 * }
 * ```
 *
 * **Response**:
 * - 200 OK: CSV file (text/csv)
 * - 400 Bad Request: rango de fechas inválido
 * - 401 Unauthorized: sin autenticación
 * - 403 Forbidden: usuario no es ADMIN o SUPERVISOR
 *
 * **Middlewares aplicados**:
 * 1. authMiddleware: Verificar JWT válido
 * 2. requireRole('ADMIN', 'SUPERVISOR'): Solo ADMIN y SUPERVISOR
 * 3. validationMiddleware: Validar body con schema Zod
 * 4. generarReporteNominaController: Generar CSV
 */
router.post(
  '/nomina',
  authMiddleware,
  requireRole('ADMIN', 'SUPERVISOR'),
  auditMiddleware('ot_sys_reportes_generados'),
  validateBody(generarReporteNominaSchema),
  generarReporteNominaController
);

/**
 * GET /api/reportes/nomina/vista-previa
 *
 * Obtener vista previa JSON de turnos no procesados para nómina
 *
 * **Permisos**: ADMIN, SUPERVISOR, CONSULTA
 *
 * **Query params**:
 * - fecha_inicio (requerido): YYYY-MM-DD
 * - fecha_fin (requerido): YYYY-MM-DD
 *
 * **Response**:
 * - 200 OK: JSON con data, total y resumen
 * - 400 Bad Request: rango de fechas inválido
 * - 401 Unauthorized: sin autenticación
 * - 403 Forbidden: usuario sin permisos
 *
 * **IMPORTANTE**: Esta ruta debe estar ANTES de /:id/descargar para evitar
 * que Express interprete "nomina" como un :id.
 */
router.get(
  '/nomina/vista-previa',
  authMiddleware,
  requireRole('ADMIN', 'SUPERVISOR', 'CONSULTA'),
  validateQuery(vistaPreviaQuerySchema),
  getVistaPreviaNominaController
);

/**
 * POST /api/reportes/marcar-procesados
 *
 * Marcar turnos como procesados para nómina
 *
 * Este endpoint se ejecuta DESPUÉS de importar el CSV en el sistema de nómina.
 * Marca los turnos del rango como procesados (procesado_nomina = TRUE) y
 * registra el nomina_id para trazabilidad.
 *
 * **Permisos**: ADMIN solamente
 *
 * **Flujo de trabajo**:
 * 1. Generar reporte CSV con POST /api/reportes/nomina
 * 2. Importar CSV en sistema de nómina (externo)
 * 3. Marcar turnos como procesados con este endpoint
 * 4. Futuros reportes NO incluirán estos turnos (procesado_nomina = TRUE)
 *
 * **Body**:
 * ```json
 * {
 *   "fecha_inicio": "2026-01-01",
 *   "fecha_fin": "2026-01-15",
 *   "nomina_id": 125
 * }
 * ```
 *
 * **Response**:
 * - 200 OK: { turnos_procesados: number, nomina_id: number, fecha_inicio: string, fecha_fin: string }
 * - 400 Bad Request: Datos inválidos
 * - 401 Unauthorized: Sin autenticación
 * - 403 Forbidden: Usuario no es ADMIN
 *
 * **Middlewares aplicados**:
 * 1. authMiddleware: Verificar JWT válido
 * 2. requireRole('ADMIN'): Solo ADMIN puede marcar como procesados
 * 3. validationMiddleware: Validar body con schema Zod
 * 4. marcarProcesadosController: Ejecutar UPDATE
 */
router.post(
  '/marcar-procesados',
  authMiddleware,
  requireRole('ADMIN'),
  auditMiddleware('ot_turnos'),
  validateBody(marcarProcesadosSchema),
  marcarProcesadosController
);

// ============================================================================
// RUTAS: REPORTES DE RESUMEN (JSON)
// ============================================================================

// ============================================================================
// RUTAS: HISTORIAL DE REPORTES (T2.25)
// ============================================================================

/**
 * GET /api/reportes/historial
 *
 * Obtener historial paginado de reportes CSV generados
 *
 * Retorna lista de todos los reportes CSV que se han generado,
 * con información del usuario que los generó y si fueron procesados.
 *
 * **Permisos**: ADMIN, SUPERVISOR, CONSULTA (todos los usuarios autenticados)
 *
 * **Query params**:
 * - page (opcional): Número de página (default: 1, min: 1)
 * - pageSize (opcional): Registros por página (default: 10, min: 1, max: 100)
 *
 * **Response 200**:
 * ```json
 * {
 *   "data": [
 *     {
 *       "id": 5,
 *       "usuario": {
 *         "id": 1,
 *         "username": "admin",
 *         "nombre_completo": "Administrador del Sistema"
 *       },
 *       "fecha_inicio": "2026-01-01",
 *       "fecha_fin": "2026-01-15",
 *       "cantidad_turnos": 45,
 *       "fecha_generacion": "2026-01-18T14:30:00.000Z",
 *       "nomina_id": 125,
 *       "nombre_archivo": "nomina_20260101_20260115.csv"
 *     }
 *   ],
 *   "total": 50,
 *   "page": 1,
 *   "pageSize": 10,
 *   "totalPages": 5
 * }
 * ```
 *
 * **Uso típico**: Ver historial de reportes generados, auditar generación.
 *
 * **IMPORTANTE**: Esta ruta debe estar ANTES de /:id/descargar para evitar
 * que Express interprete "historial" como un ID.
 *
 * **Middlewares aplicados**:
 * 1. authMiddleware: Verificar JWT válido
 * 2. requireRole('ADMIN', 'SUPERVISOR', 'CONSULTA'): Todos pueden ver historial
 * 3. validationMiddleware: Validar query params con schema Zod
 * 4. getHistorialReportesController: Obtener historial paginado
 */
router.get(
  '/historial',
  authMiddleware,
  requireRole('ADMIN', 'SUPERVISOR', 'CONSULTA'),
  validateQuery(getHistorialReportesSchema),
  getHistorialReportesController
);

/**
 * GET /api/reportes/:id/descargar
 *
 * Regenerar y descargar un reporte histórico
 *
 * Obtiene un reporte del historial por su ID y regenera el CSV
 * con los mismos parámetros (fecha_inicio, fecha_fin) usados originalmente.
 *
 * **Permisos**: ADMIN, SUPERVISOR, CONSULTA (todos los usuarios autenticados)
 *
 * **Params**:
 * - id (requerido): ID del reporte en el historial (número entero positivo)
 *
 * **Response 200**:
 * - Headers:
 *   - Content-Type: text/csv; charset=utf-8
 *   - Content-Disposition: attachment; filename="nomina_20260101_20260115.csv"
 * - Body: CSV file (string)
 *
 * **Response 404**:
 * ```json
 * {
 *   "error": "Reporte no encontrado",
 *   "message": "No existe un reporte con ID 123 en el historial"
 * }
 * ```
 *
 * **IMPORTANTE**:
 * - El CSV regenerado contiene los datos ACTUALES de la base de datos,
 *   no los datos del momento original de generación.
 * - Esta ruta debe estar DESPUÉS de /historial para evitar conflictos.
 *
 * **Uso típico**: Re-descargar un reporte antiguo, revisar datos históricos.
 *
 * **Middlewares aplicados**:
 * 1. authMiddleware: Verificar JWT válido
 * 2. requireRole('ADMIN', 'SUPERVISOR', 'CONSULTA'): Todos pueden descargar
 * 3. validationMiddleware: Validar params con schema Zod
 * 4. descargarReporteController: Regenerar CSV y retornar
 */
router.get(
  '/:id/descargar',
  authMiddleware,
  requireRole('ADMIN', 'SUPERVISOR', 'CONSULTA'),
  validateParams(descargarReporteSchema),
  descargarReporteController
);

// ============================================================================
// RUTAS: REPORTES DE RESUMEN (JSON)
// ============================================================================

/**
 * GET /api/reportes/resumen-quincena
 *
 * Obtener resumen estadístico de quincena/período
 *
 * Retorna estadísticas agregadas de todos los turnos en el rango de fechas:
 * - Total de turnos, horas normales, horas extras
 * - Cantidad de guardianes distintos que trabajaron
 * - Distribución por tipo de turno (DIURNO/NOCTURNO)
 * - Cantidad de turnos en días feriados
 * - Total de incentivos generados
 *
 * **Permisos**: ADMIN, SUPERVISOR, CONSULTA (todos los usuarios autenticados)
 *
 * **Query params**:
 * - fecha_inicio (requerido): Fecha de inicio del período (YYYY-MM-DD)
 * - fecha_fin (requerido): Fecha de fin del período (YYYY-MM-DD)
 *
 * **Validaciones**:
 * - Rango de fechas <= 93 días (trimestre)
 * - fecha_inicio <= fecha_fin
 *
 * **Response 200**:
 * ```json
 * {
 *   "fecha_inicio": "2026-01-01",
 *   "fecha_fin": "2026-01-15",
 *   "total_turnos": 450,
 *   "total_horas_normales": 4500.0,
 *   "total_horas_extras": 900.0,
 *   "total_guardianes": 30,
 *   "turnos_por_tipo": {
 *     "DIURNO": 300,
 *     "NOCTURNO": 150
 *   },
 *   "turnos_feriados": 25,
 *   "total_incentivos": 54000.00
 * }
 * ```
 *
 * **Uso típico**: Dashboard principal, card de estadísticas, resumen mensual.
 *
 * **Middlewares aplicados**:
 * 1. authMiddleware: Verificar JWT válido
 * 2. requireRole('ADMIN', 'SUPERVISOR', 'CONSULTA'): Todos los usuarios autenticados
 * 3. validationMiddleware: Validar query params con schema Zod
 * 4. getResumenQuincenaController: Generar resumen
 */
router.get(
  '/resumen-quincena',
  authMiddleware,
  requireRole('ADMIN', 'SUPERVISOR', 'CONSULTA'),
  validateQuery(resumenQuincenaQuerySchema),
  getResumenQuincenaController
);

/**
 * GET /api/reportes/resumen-por-guardian
 *
 * Obtener resumen estadístico por guardián
 *
 * Retorna estadísticas de turnos agrupadas por empleado (guardián).
 * Incluye filtros opcionales y paginación para listas grandes.
 *
 * **Permisos**: ADMIN, SUPERVISOR, CONSULTA (todos los usuarios autenticados)
 *
 * **Query params**:
 * - fecha_inicio (requerido): Fecha de inicio del período (YYYY-MM-DD)
 * - fecha_fin (requerido): Fecha de fin del período (YYYY-MM-DD)
 * - empleado_id (opcional): ID del empleado para filtrar (un guardián específico)
 * - page (opcional): Número de página (default: 1, min: 1)
 * - pageSize (opcional): Registros por página (default: 10, min: 1, max: 100)
 *
 * **Validaciones**:
 * - fecha_inicio <= fecha_fin
 * - page >= 1
 * - pageSize entre 1 y 100
 *
 * **Response 200**:
 * ```json
 * {
 *   "data": [
 *     {
 *       "empleado_id": 1001,
 *       "nombre_empleado": "Juan Pérez",
 *       "cedula": "001-1234567-8",
 *       "total_turnos": 15,
 *       "total_horas_normales": 150.0,
 *       "total_horas_extras": 30.0,
 *       "turnos_diurnos": 10,
 *       "turnos_nocturnos": 5,
 *       "turnos_feriados": 2,
 *       "total_incentivos": 1800.00
 *     }
 *   ],
 *   "total": 30,
 *   "page": 1,
 *   "pageSize": 10
 * }
 * ```
 *
 * **Características**:
 * - Paginación configurable
 * - Incluye datos del empleado desde BD RRHH (nombre, cédula)
 * - Ordenado por total_turnos DESC (más activos primero)
 * - Filtro opcional por empleado_id (análisis individual)
 *
 * **Uso típico**: Tabla de performance de guardianes, análisis de productividad.
 *
 * **Middlewares aplicados**:
 * 1. authMiddleware: Verificar JWT válido
 * 2. requireRole('ADMIN', 'SUPERVISOR', 'CONSULTA'): Todos los usuarios autenticados
 * 3. validationMiddleware: Validar query params con schema Zod
 * 4. getResumenPorGuardianController: Generar resumen paginado
 */
router.get(
  '/resumen-por-guardian',
  authMiddleware,
  requireRole('ADMIN', 'SUPERVISOR', 'CONSULTA'),
  validateQuery(resumenPorGuardianQuerySchema),
  getResumenPorGuardianController
);

/**
 * GET /api/reportes/resumen-por-puesto
 *
 * Obtener resumen estadístico por puesto
 *
 * Retorna estadísticas de turnos agrupadas por puesto de trabajo.
 * Incluye filtros opcionales (puesto, ubicación, cliente) y paginación.
 *
 * **Permisos**: ADMIN, SUPERVISOR, CONSULTA (todos los usuarios autenticados)
 *
 * **Query params**:
 * - fecha_inicio (requerido): Fecha de inicio del período (YYYY-MM-DD)
 * - fecha_fin (requerido): Fecha de fin del período (YYYY-MM-DD)
 * - puesto_id (opcional): ID del puesto para filtrar (un puesto específico)
 * - ubicacion_id (opcional): ID de ubicación para filtrar (todos los puestos de una ubicación)
 * - cliente_id (opcional): ID de cliente para filtrar (todos los puestos de un cliente)
 * - page (opcional): Número de página (default: 1, min: 1)
 * - pageSize (opcional): Registros por página (default: 10, min: 1, max: 100)
 *
 * **Validaciones**:
 * - fecha_inicio <= fecha_fin
 * - page >= 1
 * - pageSize entre 1 y 100
 *
 * **Response 200**:
 * ```json
 * {
 *   "data": [
 *     {
 *       "puesto_id": 42,
 *       "puesto_codigo": "P001",
 *       "puesto_nombre": "Entrada Principal",
 *       "ubicacion_nombre": "Sucursal Centro",
 *       "cliente_nombre": "Banco Popular",
 *       "total_turnos": 30,
 *       "total_horas_normales": 300.0,
 *       "total_horas_extras": 60.0,
 *       "guardianes_distintos": 5,
 *       "turnos_diurnos": 20,
 *       "turnos_nocturnos": 10,
 *       "total_incentivos": 3600.00
 *     }
 *   ],
 *   "total": 15,
 *   "page": 1,
 *   "pageSize": 10
 * }
 * ```
 *
 * **Características**:
 * - Paginación configurable
 * - Incluye datos relacionados: puesto, ubicación, cliente (via JOINs)
 * - Ordenado por total_turnos DESC (puestos más utilizados primero)
 * - Filtros opcionales jerárquicos (cliente → ubicación → puesto)
 *
 * **Uso típico**: Tabla de utilización de puestos, análisis por cliente/ubicación.
 *
 * **Middlewares aplicados**:
 * 1. authMiddleware: Verificar JWT válido
 * 2. requireRole('ADMIN', 'SUPERVISOR', 'CONSULTA'): Todos los usuarios autenticados
 * 3. validationMiddleware: Validar query params con schema Zod
 * 4. getResumenPorPuestoController: Generar resumen paginado
 */
router.get(
  '/resumen-por-puesto',
  authMiddleware,
  requireRole('ADMIN', 'SUPERVISOR', 'CONSULTA'),
  validateQuery(resumenPorPuestoQuerySchema),
  getResumenPorPuestoController
);

export default router;
