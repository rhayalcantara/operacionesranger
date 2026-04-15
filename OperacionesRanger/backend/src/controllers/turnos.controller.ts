/**
 * Controladores de Turnos
 * Sistema de Gestión de Turnos - OperacionesRanger
 *
 * Maneja las peticiones HTTP para la consulta de turnos de guardianes.
 * Los controladores reciben requests, llaman a los servicios de negocio,
 * y retornan responses apropiadas.
 *
 * @module controllers/turnos.controller
 */

import { Request, Response } from 'express';
import * as turnosService from '../services/turnos.service';
import { TipoTurno, CreateTurnoDTO, UpdateTurnoDTO } from '../models/turno.model';
import {
  EmpleadoNoExisteError,
  EmpleadoInactivoError,
  PuestoNoExisteError,
  PuestoInactivoError,
  TurnoDuplicadoError,
  HorasExcedidasError,
  TurnoNoExisteError,
  TurnoProcesadoError,
} from '../services/turnos.service';

// ============================================================================
// CONTROLADORES DE CONSULTA
// ============================================================================

/**
 * GET /api/turnos
 *
 * Listar turnos con paginación y filtros
 *
 * Query params:
 * - page: número de página (default: 1)
 * - pageSize: tamaño de página (default: 10, max: 100)
 * - search: búsqueda por nombre o cédula de empleado
 * - empleado_id: filtrar por empleado
 * - puesto_id: filtrar por puesto
 * - ubicacion_id: filtrar por ubicación
 * - cliente_id: filtrar por cliente
 * - fecha_inicio: filtrar desde fecha (YYYY-MM-DD)
 * - fecha_fin: filtrar hasta fecha (YYYY-MM-DD)
 * - tipo_turno: filtrar por tipo (DIURNO | NOCTURNO)
 * - es_feriado: filtrar por feriado (true | false)
 * - procesado_nomina: filtrar por procesado (true | false)
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
 * Response 500: Error interno del servidor
 */
export async function getTurnosController(req: Request, res: Response): Promise<void> {
  try {
    const {
      page = 1,
      pageSize = 10,
      search,
      empleado_id,
      puesto_id,
      ubicacion_id,
      cliente_id,
      fecha_inicio,
      fecha_fin,
      tipo_turno,
      es_feriado,
      procesado_nomina
    } = req.query;

    // Convertir query params a tipos correctos
    const filters = {
      page: Number(page),
      pageSize: Number(pageSize),
      search: search as string | undefined,
      empleado_id: empleado_id ? Number(empleado_id) : undefined,
      puesto_id: puesto_id ? Number(puesto_id) : undefined,
      ubicacion_id: ubicacion_id ? Number(ubicacion_id) : undefined,
      cliente_id: cliente_id ? Number(cliente_id) : undefined,
      fecha_inicio: fecha_inicio as string | undefined,
      fecha_fin: fecha_fin as string | undefined,
      tipo_turno: tipo_turno as TipoTurno | undefined,
      es_feriado: es_feriado !== undefined ? es_feriado === 'true' : undefined,
      procesado_nomina: procesado_nomina !== undefined ? procesado_nomina === 'true' : undefined
    };

    const result = await turnosService.getTurnos(filters);

    const totalPages = Math.ceil(result.total / filters.pageSize);

    res.status(200).json({
      data: result.data,
      total: result.total,
      page: filters.page,
      pageSize: filters.pageSize,
      totalPages
    });
  } catch (error) {
    console.error('Error en getTurnosController:', error);
    res.status(500).json({
      error: 'Error interno del servidor',
      message: 'No se pudo obtener la lista de turnos'
    });
  }
}

/**
 * GET /api/turnos/:id
 *
 * Obtener turno por ID con relaciones completas
 *
 * Path params:
 * - id: ID del turno
 *
 * Response 200: TurnoConRelaciones
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
 * Response 500: Error interno del servidor
 */
export async function getTurnoByIdController(req: Request, res: Response): Promise<void> {
  try {
    const id = Number(req.params.id);

    const turno = await turnosService.getTurnoById(id);

    if (!turno) {
      res.status(404).json({
        error: 'Turno no encontrado',
        message: `No existe un turno con ID ${id}`
      });
      return;
    }

    res.status(200).json(turno);
  } catch (error) {
    console.error('Error en getTurnoByIdController:', error);
    res.status(500).json({
      error: 'Error interno del servidor',
      message: 'No se pudo obtener el turno'
    });
  }
}

/**
 * GET /api/turnos/empleado/:empleado_id/resumen
 *
 * Obtener resumen de turnos de un empleado en un rango de fechas
 *
 * Path params:
 * - empleado_id: ID del empleado en BD RRHH
 *
 * Query params:
 * - fecha_inicio: fecha inicio del rango (YYYY-MM-DD) (opcional)
 * - fecha_fin: fecha fin del rango (YYYY-MM-DD) (opcional)
 *
 * Si no se proporcionan fechas, usa defaults:
 * - fecha_inicio: primer día del mes actual
 * - fecha_fin: hoy
 *
 * Response 200: ResumenEmpleadoDTO
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
 * Response 500: Error interno del servidor
 */
export async function getResumenEmpleadoController(req: Request, res: Response): Promise<void> {
  try {
    const empleado_id = Number(req.params.empleado_id);
    let { fecha_inicio, fecha_fin } = req.query;

    // Si no se proporcionan fechas, usar defaults
    if (!fecha_inicio || !fecha_fin) {
      const today = new Date();
      const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

      fecha_inicio = fecha_inicio || firstDayOfMonth.toISOString().split('T')[0];
      fecha_fin = fecha_fin || today.toISOString().split('T')[0];
    }

    const resumen = await turnosService.getResumenEmpleado(
      empleado_id,
      fecha_inicio as string,
      fecha_fin as string
    );

    if (!resumen) {
      res.status(404).json({
        error: 'Empleado no encontrado',
        message: `No existe un empleado con ID ${empleado_id} en el sistema de RRHH`
      });
      return;
    }

    res.status(200).json(resumen);
  } catch (error) {
    console.error('Error en getResumenEmpleadoController:', error);
    res.status(500).json({
      error: 'Error interno del servidor',
      message: 'No se pudo obtener el resumen del empleado'
    });
  }
}

// ============================================================================
// CONTROLADORES DE REGISTRO
// ============================================================================

/**
 * POST /api/turnos
 *
 * Registrar nuevo turno
 *
 * Body (CreateTurnoDTO):
 * {
 *   empleado_id: number,
 *   puesto_id: number,
 *   fecha: string (YYYY-MM-DD),
 *   hora_entrada: string (HH:MM:SS),
 *   hora_salida: string (HH:MM:SS),
 *   horas_normales: number,
 *   horas_extras: number,
 *   observaciones?: string | null
 * }
 *
 * Response 201: Turno creado
 * {
 *   message: "Turno registrado exitosamente",
 *   data: Turno (con campos auto-calculados: tipo_turno, es_feriado, feriado_id)
 * }
 *
 * Response 400: Validación fallida (horas excedidas, empleado inactivo, puesto inactivo)
 * Response 404: Empleado no existe o puesto no existe
 * Response 409: Turno duplicado (mismo empleado+puesto+fecha)
 * Response 500: Error interno del servidor
 */
export async function registrarTurnoController(req: Request, res: Response): Promise<void> {
  try {
    const dto: CreateTurnoDTO = req.body;

    // Obtener userId del token (inyectado por authMiddleware en req.user)
    const userId = (req as any).user?.sub;

    if (!userId) {
      res.status(401).json({
        error: 'No autenticado',
        message: 'Usuario no identificado'
      });
      return;
    }

    // Llamar al servicio para registrar turno
    const turno = await turnosService.registrarTurno(dto, userId);

    res.status(201).json({
      message: 'Turno registrado exitosamente',
      data: turno
    });
  } catch (error: any) {
    console.error('Error en registrarTurnoController:', error);

    // Mapear custom errors a códigos HTTP apropiados
    if (error instanceof EmpleadoNoExisteError || error instanceof PuestoNoExisteError) {
      res.status(404).json({
        error: 'Recurso no encontrado',
        message: error.message
      });
      return;
    }

    if (
      error instanceof EmpleadoInactivoError ||
      error instanceof PuestoInactivoError ||
      error instanceof HorasExcedidasError
    ) {
      res.status(400).json({
        error: 'Validación fallida',
        message: error.message
      });
      return;
    }

    if (error instanceof TurnoDuplicadoError) {
      res.status(409).json({
        error: 'Conflicto',
        message: error.message
      });
      return;
    }

    // Error genérico
    res.status(500).json({
      error: 'Error interno del servidor',
      message: 'No se pudo registrar el turno'
    });
  }
}

// ============================================================================
// CONTROLADORES DE ACTUALIZACIÓN Y ELIMINACIÓN
// ============================================================================

/**
 * PUT /api/turnos/:id
 *
 * Actualizar turno existente
 *
 * Path params:
 * - id: ID del turno
 *
 * Body (UpdateTurnoDTO):
 * {
 *   hora_entrada?: string (HH:MM:SS),
 *   hora_salida?: string (HH:MM:SS),
 *   horas_normales?: number,
 *   horas_extras?: number,
 *   observaciones?: string | null
 * }
 *
 * Response 200: Turno actualizado
 * {
 *   message: "Turno actualizado exitosamente",
 *   data: Turno (con campos recalculados: tipo_turno, es_feriado)
 * }
 *
 * Response 400: Validación fallida (horas excedidas, empleado inactivo, puesto inactivo)
 * Response 403: Turno ya procesado en nómina (inmutable)
 * Response 404: Turno no existe
 * Response 500: Error interno del servidor
 */
export async function actualizarTurnoController(req: Request, res: Response): Promise<void> {
  try {
    const id = Number(req.params.id);
    const dto: UpdateTurnoDTO = req.body;

    // Obtener userId del token
    const userId = (req as any).user?.sub;

    if (!userId) {
      res.status(401).json({
        error: 'No autenticado',
        message: 'Usuario no identificado'
      });
      return;
    }

    // Llamar al servicio para actualizar turno
    const turno = await turnosService.actualizarTurno(id, dto, userId);

    res.status(200).json({
      message: 'Turno actualizado exitosamente',
      data: turno
    });
  } catch (error: any) {
    console.error('Error en actualizarTurnoController:', error);

    // Mapear custom errors a códigos HTTP
    if (error instanceof TurnoNoExisteError) {
      res.status(404).json({
        error: 'Turno no encontrado',
        message: error.message
      });
      return;
    }

    if (error instanceof TurnoProcesadoError) {
      res.status(403).json({
        error: 'Operación no permitida',
        message: error.message
      });
      return;
    }

    if (
      error instanceof EmpleadoInactivoError ||
      error instanceof PuestoInactivoError ||
      error instanceof HorasExcedidasError
    ) {
      res.status(400).json({
        error: 'Validación fallida',
        message: error.message
      });
      return;
    }

    // Error genérico
    res.status(500).json({
      error: 'Error interno del servidor',
      message: 'No se pudo actualizar el turno'
    });
  }
}

/**
 * DELETE /api/turnos/:id
 *
 * Eliminar turno
 *
 * Path params:
 * - id: ID del turno
 *
 * Response 200: Turno eliminado
 * {
 *   message: "Turno eliminado exitosamente"
 * }
 *
 * Response 403: Turno ya procesado en nómina (no puede eliminarse)
 * Response 404: Turno no existe
 * Response 500: Error interno del servidor
 */
export async function eliminarTurnoController(req: Request, res: Response): Promise<void> {
  try {
    const id = Number(req.params.id);

    // Obtener userId del token
    const userId = (req as any).user?.sub;

    if (!userId) {
      res.status(401).json({
        error: 'No autenticado',
        message: 'Usuario no identificado'
      });
      return;
    }

    // Llamar al servicio para eliminar turno
    await turnosService.eliminarTurno(id, userId);

    res.status(200).json({
      message: 'Turno eliminado exitosamente'
    });
  } catch (error: any) {
    console.error('Error en eliminarTurnoController:', error);

    // Mapear custom errors a códigos HTTP
    if (error instanceof TurnoNoExisteError) {
      res.status(404).json({
        error: 'Turno no encontrado',
        message: error.message
      });
      return;
    }

    if (error instanceof TurnoProcesadoError) {
      res.status(403).json({
        error: 'Operación no permitida',
        message: error.message
      });
      return;
    }

    // Error genérico
    res.status(500).json({
      error: 'Error interno del servidor',
      message: 'No se pudo eliminar el turno'
    });
  }
}

// ============================================================================
// CONTROLADOR DE CALENDARIO
// ============================================================================

/**
 * GET /api/turnos/calendario/:año/:mes
 *
 * Obtener calendario mensual de turnos
 *
 * Path params:
 * - año: Año del calendario (2000-2100)
 * - mes: Mes del calendario (1-12)
 *
 * Query params (opcionales):
 * - empleado_id: Filtrar por empleado
 * - puesto_id: Filtrar por puesto
 * - ubicacion_id: Filtrar por ubicación
 * - cliente_id: Filtrar por cliente
 *
 * Response 200: CalendarioMensualDTO
 * {
 *   año: number,
 *   mes: number,
 *   dias: DiaCalendarioDTO[]
 * }
 *
 * Cada día incluye:
 * - fecha: YYYY-MM-DD
 * - es_feriado: boolean
 * - nombre_feriado: string | null
 * - tipo_feriado: string | null
 * - turnos: TurnoCalendarioDTO[]
 *
 * Response 400: Parámetros inválidos (año/mes fuera de rango)
 * Response 500: Error interno del servidor
 */
export async function getCalendarioController(req: Request, res: Response): Promise<void> {
  try {
    const { año, mes } = req.params as unknown as { año: number; mes: number };
    const { empleado_id, puesto_id, ubicacion_id, cliente_id } = req.query as any;

    console.log(`[Turnos Controller] GET /calendario/${año}/${mes}`);

    const filtros = {
      empleado_id: empleado_id ? Number(empleado_id) : undefined,
      puesto_id: puesto_id ? Number(puesto_id) : undefined,
      ubicacion_id: ubicacion_id ? Number(ubicacion_id) : undefined,
      cliente_id: cliente_id ? Number(cliente_id) : undefined,
    };

    const calendario = await turnosService.getCalendarioMensual(año, mes, filtros);

    res.status(200).json(calendario);
  } catch (error) {
    console.error('Error en getCalendarioController:', error);
    res.status(500).json({
      error: 'Error interno del servidor',
      message: 'No se pudo obtener el calendario de turnos',
    });
  }
}
