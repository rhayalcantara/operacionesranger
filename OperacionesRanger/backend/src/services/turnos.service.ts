/**
 * Servicio de Turnos
 * Sistema de Gestión de Turnos - OperacionesRanger
 *
 * Implementa la lógica de negocio para la consulta de turnos de guardianes.
 * Maneja operaciones de lectura con JOINs a BD RRHH y relaciones con
 * puestos, ubicaciones y clientes.
 *
 * @module services/turnos.service
 */

import { RowDataPacket, ResultSetHeader } from 'mysql2/promise';
import { db, getTurnosPool } from '../config/database';
import { validarGuardianActivo } from './rrhh.service';
import {
  Turno,
  TurnoConRelaciones,
  TipoTurno,
  CreateTurnoDTO,
  UpdateTurnoDTO,
  NuevoTurnoDB,
  dtoToNuevoTurnoDB,
  CalendarioMensualDTO,
  DiaCalendarioDTO,
  TurnoCalendarioDTO,
} from '../models/turno.model';

// ============================================================================
// INTERFACES PARA QUERIES
// ============================================================================

/**
 * Filtros para listar turnos
 */
export interface GetTurnosFilters {
  page?: number;
  pageSize?: number;
  search?: string;
  empleado_id?: number;
  puesto_id?: number;
  ubicacion_id?: number;
  cliente_id?: number;
  fecha_inicio?: string;
  fecha_fin?: string;
  tipo_turno?: TipoTurno;
  es_feriado?: boolean;
  procesado_nomina?: boolean;
}

/**
 * Resultado paginado genérico
 */
export interface PaginatedResult<T> {
  data: T[];
  total: number;
}

/**
 * Resultado de llamada a stored procedure sp_registrar_turno
 */
interface SpRegistrarTurnoResult {
  /** ID del turno creado (NULL si hubo error) */
  turno_id: number | null;
  /** Mensaje del SP (éxito o error) */
  mensaje: string;
}

/**
 * Resumen de turnos por empleado
 */
export interface ResumenEmpleadoDTO {
  empleado_id: number;
  nombre_empleado: string;
  cedula_empleado?: string;
  total_turnos: number;
  total_horas_normales: number;
  total_horas_extras: number;
  total_horas: number; // Normales + Extras
  turnos_diurnos: number;
  turnos_nocturnos: number;
  turnos_feriados: number;
  turnos?: Turno[]; // Lista detallada de turnos
}

// ============================================================================
// CUSTOM ERRORS
// ============================================================================

/**
 * Error cuando el empleado no existe en BD RRHH
 */
export class EmpleadoNoExisteError extends Error {
  constructor(empleadoId: number) {
    super(`Empleado ${empleadoId} no existe en sistema RRHH`);
    this.name = 'EmpleadoNoExisteError';
  }
}

/**
 * Error cuando el empleado existe pero está inactivo
 */
export class EmpleadoInactivoError extends Error {
  constructor(empleadoId: number) {
    super(`Empleado ${empleadoId} está inactivo y no puede trabajar turnos`);
    this.name = 'EmpleadoInactivoError';
  }
}

/**
 * Error cuando el puesto no existe en BD turnos
 */
export class PuestoNoExisteError extends Error {
  constructor(puestoId: number) {
    super(`Puesto ${puestoId} no existe`);
    this.name = 'PuestoNoExisteError';
  }
}

/**
 * Error cuando el puesto existe pero está inactivo
 */
export class PuestoInactivoError extends Error {
  constructor(puestoId: number) {
    super(`Puesto ${puestoId} está inactivo y no puede recibir turnos`);
    this.name = 'PuestoInactivoError';
  }
}

/**
 * Error cuando ya existe un turno para el mismo empleado+puesto+fecha
 */
export class TurnoDuplicadoError extends Error {
  constructor(empleadoId: number, puestoId: number, fecha: string) {
    super(
      `Ya existe un turno para empleado ${empleadoId} en puesto ${puestoId} el día ${fecha}`
    );
    this.name = 'TurnoDuplicadoError';
  }
}

/**
 * Error cuando el total de horas excede el límite de 16 horas
 */
export class HorasExcedidasError extends Error {
  constructor(horasNormales: number, horasExtras: number) {
    super(
      `Total de horas (${horasNormales + horasExtras}) excede el máximo permitido de 16 horas`
    );
    this.name = 'HorasExcedidasError';
  }
}

/**
 * Error cuando el turno no existe en BD
 */
export class TurnoNoExisteError extends Error {
  constructor(id: number) {
    super(`El turno ${id} no existe`);
    this.name = 'TurnoNoExisteError';
  }
}

/**
 * Error cuando se intenta modificar/eliminar turno procesado en nómina
 */
export class TurnoProcesadoError extends Error {
  constructor(id: number) {
    super(`El turno ${id} ya fue procesado en nómina y no puede ser modificado`);
    this.name = 'TurnoProcesadoError';
  }
}

// ============================================================================
// FUNCIONES AUXILIARES
// ============================================================================

/**
 * Validar que el puesto existe y está activo
 *
 * @param puestoId - ID del puesto a validar
 * @throws PuestoNoExisteError si el puesto no existe
 * @throws PuestoInactivoError si el puesto está inactivo
 */
async function validarPuestoActivo(puestoId: number): Promise<void> {
  const pool = getTurnosPool();

  const [rows] = await pool.execute<RowDataPacket[]>(
    'SELECT id, activo FROM ot_puestos WHERE id = ? LIMIT 1',
    [puestoId]
  );

  if (rows.length === 0) {
    throw new PuestoNoExisteError(puestoId);
  }

  const puesto = rows[0];
  if (!puesto.activo) {
    throw new PuestoInactivoError(puestoId);
  }
}

/**
 * Verificar que turno existe y NO está procesado
 *
 * @param id - ID del turno a verificar
 * @throws TurnoNoExisteError si turno no existe
 * @throws TurnoProcesadoError si procesado_nomina = TRUE
 */
async function verificarTurnoNoProcesado(id: number): Promise<void> {
  const pool = getTurnosPool();

  const [rows] = await pool.execute<RowDataPacket[]>(
    'SELECT procesado_nomina FROM ot_turnos WHERE id = ? LIMIT 1',
    [id]
  );

  if (rows.length === 0) {
    throw new TurnoNoExisteError(id);
  }

  const turno = rows[0];
  if (turno.procesado_nomina) {
    throw new TurnoProcesadoError(id);
  }
}

/**
 * Llamar al stored procedure sp_registrar_turno
 *
 * El SP realiza las siguientes acciones:
 * 1. Verifica duplicados (empleado+puesto+fecha)
 * 2. Determina tipo_turno usando sp_determinar_tipo_turno(hora_entrada)
 * 3. Verifica si es feriado usando sp_verificar_feriado(fecha)
 * 4. Inserta el turno en la tabla turnos
 * 5. Retorna el ID del turno creado y un mensaje
 *
 * @param data - Datos del turno a registrar
 * @returns Resultado del SP con turno_id y mensaje
 * @throws TurnoDuplicadoError si ya existe turno para empleado+puesto+fecha
 * @throws HorasExcedidasError si el trigger rechaza por horas > 16
 * @throws Error para otros errores del SP
 */
async function callSpRegistrarTurno(
  data: NuevoTurnoDB
): Promise<SpRegistrarTurnoResult> {
  const pool = getTurnosPool();

  try {
    // Llamar al stored procedure
    // sp_registrar_turno(empleado_id, puesto_id, fecha, hora_entrada, hora_salida,
    //                    horas_normales, horas_extras, observaciones, created_by,
    //                    OUT turno_id, OUT mensaje)
    await pool.execute(
      `CALL ot_sp_registrar_turno(?, ?, ?, ?, ?, ?, ?, ?, ?, @turno_id, @mensaje)`,
      [
        data.empleado_id,
        data.puesto_id,
        data.fecha,
        data.hora_entrada,
        data.hora_salida,
        data.horas_normales,
        data.horas_extras,
        data.observaciones,
        data.created_by,
      ]
    );

    // Obtener valores de OUT parameters
    const [outParams] = await pool.execute<RowDataPacket[]>(
      'SELECT @turno_id AS turno_id, @mensaje AS mensaje'
    );

    const result = outParams[0] as SpRegistrarTurnoResult;

    // Si turno_id es NULL, el SP retornó un error
    if (result.turno_id === null || result.turno_id === undefined) {
      const mensaje = result.mensaje || 'Error desconocido al registrar turno';

      // Detectar tipo de error según mensaje del SP
      if (mensaje.includes('Ya existe')) {
        throw new TurnoDuplicadoError(
          data.empleado_id,
          data.puesto_id,
          data.fecha
        );
      }

      if (mensaje.includes('excede') || mensaje.includes('máximo')) {
        throw new HorasExcedidasError(data.horas_normales, data.horas_extras);
      }

      // Error genérico del SP
      throw new Error(`Error del stored procedure: ${mensaje}`);
    }

    return result;
  } catch (error: any) {
    // Re-lanzar custom errors
    if (
      error instanceof TurnoDuplicadoError ||
      error instanceof HorasExcedidasError
    ) {
      throw error;
    }

    // Detectar error de constraint duplicado (UK empleado+puesto+fecha)
    if (error.code === 'ER_DUP_ENTRY' || error.errno === 1062) {
      throw new TurnoDuplicadoError(
        data.empleado_id,
        data.puesto_id,
        data.fecha
      );
    }

    // Detectar error de trigger (SQLSTATE 45000)
    if (error.sqlState === '45000') {
      const mensaje = error.sqlMessage || error.message || '';
      if (mensaje.includes('excede') || mensaje.includes('máximo')) {
        throw new HorasExcedidasError(data.horas_normales, data.horas_extras);
      }
    }

    // Error genérico de BD
    console.error('[Turnos Service] Error al llamar a sp_registrar_turno:', error);
    throw new Error(`Error al registrar turno: ${error.message}`);
  }
}

/**
 * Obtener turno simple por ID (sin relaciones)
 *
 * @param turnoId - ID del turno a obtener
 * @returns Turno completo o null si no existe
 */
async function getTurnoByIdSimple(turnoId: number): Promise<Turno | null> {
  const pool = getTurnosPool();

  const [rows] = await pool.execute<RowDataPacket[]>(
    'SELECT * FROM ot_turnos WHERE id = ? LIMIT 1',
    [turnoId]
  );

  if (rows.length === 0) {
    return null;
  }

  return rows[0] as Turno;
}

// ============================================================================
// SERVICIO PRINCIPAL
// ============================================================================

/**
 * Obtener lista paginada de turnos con filtros
 *
 * @param filters - Filtros de búsqueda y paginación
 * @returns Lista paginada de turnos con relaciones
 *
 * @throws Error si hay un problema con la base de datos
 *
 * @example
 * // Listar todos los turnos (página 1)
 * const result = await getTurnos({ page: 1, pageSize: 10 });
 *
 * @example
 * // Filtrar por empleado
 * const result = await getTurnos({ empleado_id: 1001 });
 *
 * @example
 * // Filtrar por rango de fechas
 * const result = await getTurnos({
 *   fecha_inicio: '2026-01-01',
 *   fecha_fin: '2026-01-31'
 * });
 *
 * @example
 * // Buscar por nombre de empleado
 * const result = await getTurnos({ search: 'Juan' });
 */
export async function getTurnos(
  filters: GetTurnosFilters = {}
): Promise<PaginatedResult<Turno>> {
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
  } = filters;

  // Validar y limitar paginación
  const validPage = Math.max(1, page);
  const validPageSize = Math.min(Math.max(1, pageSize), 100);
  const offset = (validPage - 1) * validPageSize;

  // Construir query base con JOINs
  let queryBase = `
    SELECT
      t.*,
      e.cedula_empleado,
      e.nombres AS empleado_nombres,
      e.apellidos AS empleado_apellidos,
      CONCAT(e.nombres, ' ', e.apellidos) AS empleado_nombre_completo,
      p.codigo AS puesto_codigo,
      p.nombre AS puesto_nombre,
      u.id AS ubicacion_id,
      u.nombre AS ubicacion_nombre,
      u.codigo AS ubicacion_codigo,
      c.id AS cliente_id,
      c.nombre AS cliente_nombre,
      f.nombre AS feriado_nombre,
      f.tipo AS feriado_tipo
    FROM ot_turnos t
    INNER JOIN ot_puestos p ON t.puesto_id = p.id
    INNER JOIN ot_ubicaciones u ON p.ubicacion_id = u.id
    INNER JOIN ot_clientes c ON u.cliente_id = c.id
    LEFT JOIN rh_empleado e ON t.empleado_id = e.id_empleado
    LEFT JOIN ot_feriados f ON t.feriado_id = f.id
  `;

  // Construir WHERE dinámico
  const whereClauses: string[] = [];
  const queryParams: any[] = [];

  if (empleado_id !== undefined) {
    whereClauses.push('t.empleado_id = ?');
    queryParams.push(empleado_id);
  }

  if (puesto_id !== undefined) {
    whereClauses.push('t.puesto_id = ?');
    queryParams.push(puesto_id);
  }

  if (ubicacion_id !== undefined) {
    whereClauses.push('p.ubicacion_id = ?');
    queryParams.push(ubicacion_id);
  }

  if (cliente_id !== undefined) {
    whereClauses.push('u.cliente_id = ?');
    queryParams.push(cliente_id);
  }

  if (fecha_inicio !== undefined) {
    whereClauses.push('t.fecha >= ?');
    queryParams.push(fecha_inicio);
  }

  if (fecha_fin !== undefined) {
    whereClauses.push('t.fecha <= ?');
    queryParams.push(fecha_fin);
  }

  if (tipo_turno !== undefined) {
    whereClauses.push('t.tipo_turno = ?');
    queryParams.push(tipo_turno);
  }

  if (es_feriado !== undefined) {
    whereClauses.push('t.es_feriado = ?');
    queryParams.push(es_feriado);
  }

  if (procesado_nomina !== undefined) {
    whereClauses.push('t.procesado_nomina = ?');
    queryParams.push(procesado_nomina);
  }

  if (search !== undefined && search.trim() !== '') {
    whereClauses.push(
      '(CONCAT(e.nombres, " ", e.apellidos) LIKE ? OR e.cedula_empleado LIKE ?)'
    );
    const searchPattern = `%${search.trim()}%`;
    queryParams.push(searchPattern, searchPattern);
  }

  // Agregar WHERE si hay cláusulas
  if (whereClauses.length > 0) {
    queryBase += ' WHERE ' + whereClauses.join(' AND ');
  }

  // Query COUNT para total
  const countQuery = queryBase.replace(
    /SELECT[\s\S]*?FROM/,
    'SELECT COUNT(*) as total FROM'
  );

  // Query de datos con ORDER BY, LIMIT, OFFSET
  const dataQuery = queryBase + `
    ORDER BY t.fecha DESC, t.hora_entrada ASC
    LIMIT ? OFFSET ?
  `;

  try {
    // Ejecutar COUNT query
    const [countRows] = await db.execute(
      countQuery,
      queryParams
    ) as [RowDataPacket[], any];
    const total = countRows[0]?.total || 0;

    // Ejecutar data query
    const [rows] = await db.execute(
      dataQuery,
      [...queryParams, String(validPageSize), String(offset)]
    ) as [RowDataPacket[], any];

    const data = rows as Turno[];

    return { data, total };
  } catch (error) {
    console.error('Error en getTurnos:', error);
    throw new Error('Error al obtener lista de turnos');
  }
}

/**
 * Obtener turno por ID con relaciones completas
 *
 * @param id - ID del turno
 * @returns Turno con relaciones completas o null si no existe
 *
 * @throws Error si hay un problema con la base de datos
 *
 * @example
 * const turno = await getTurnoById(123);
 * if (!turno) {
 *   // Turno no encontrado
 * }
 */
export async function getTurnoById(id: number): Promise<TurnoConRelaciones | null> {
  const query = `
    SELECT
      t.*,
      e.cedula_empleado,
      e.nombres AS empleado_nombres,
      e.apellidos AS empleado_apellidos,
      CONCAT(e.nombres, ' ', e.apellidos) AS empleado_nombre_completo,
      p.codigo AS puesto_codigo,
      p.nombre AS puesto_nombre,
      u.id AS ubicacion_id,
      u.nombre AS ubicacion_nombre,
      u.codigo AS ubicacion_codigo,
      c.id AS cliente_id,
      c.nombre AS cliente_nombre,
      f.nombre AS feriado_nombre,
      f.tipo AS feriado_tipo
    FROM ot_turnos t
    INNER JOIN ot_puestos p ON t.puesto_id = p.id
    INNER JOIN ot_ubicaciones u ON p.ubicacion_id = u.id
    INNER JOIN ot_clientes c ON u.cliente_id = c.id
    LEFT JOIN rh_empleado e ON t.empleado_id = e.id_empleado
    LEFT JOIN ot_feriados f ON t.feriado_id = f.id
    WHERE t.id = ?
  `;

  try {
    const [rows] = await db.query(query, [id]) as [RowDataPacket[], any];

    if (rows.length === 0) {
      return null;
    }

    return rows[0] as TurnoConRelaciones;
  } catch (error) {
    console.error('Error en getTurnoById:', error);
    throw new Error('Error al obtener turno por ID');
  }
}

/**
 * Obtener resumen de turnos por empleado en un rango de fechas
 *
 * @param empleado_id - ID del empleado en BD RRHH
 * @param fecha_inicio - Fecha de inicio del rango (YYYY-MM-DD)
 * @param fecha_fin - Fecha de fin del rango (YYYY-MM-DD)
 * @returns Resumen con estadísticas agregadas o null si empleado no existe
 *
 * @throws Error si hay un problema con la base de datos
 *
 * @example
 * const resumen = await getResumenEmpleado(1001, '2026-01-01', '2026-01-31');
 */
export async function getResumenEmpleado(
  empleado_id: number,
  fecha_inicio: string,
  fecha_fin: string
): Promise<ResumenEmpleadoDTO | null> {
  // Primero verificar que empleado existe en BD RRHH
  const empleadoQuery = `
    SELECT
      id_empleado,
      cedula_empleado,
      CONCAT(nombres, ' ', apellidos) AS nombre_completo
    FROM rh_empleado
    WHERE id_empleado = ?
  `;

  try {
    const [empleadoRows] = await db.query(
      empleadoQuery,
      [empleado_id]
    ) as [RowDataPacket[], any];

    if (empleadoRows.length === 0) {
      // Empleado no existe
      return null;
    }

    const nombreEmpleado = empleadoRows[0].nombre_completo;

    // Query de resumen con agregaciones
    const resumenQuery = `
      SELECT
        t.empleado_id,
        COUNT(*) AS total_turnos,
        COALESCE(SUM(t.horas_normales), 0) AS total_horas_normales,
        COALESCE(SUM(t.horas_extras), 0) AS total_horas_extras,
        SUM(CASE WHEN t.tipo_turno = 'DIURNO' THEN 1 ELSE 0 END) AS turnos_diurnos,
        SUM(CASE WHEN t.tipo_turno = 'NOCTURNO' THEN 1 ELSE 0 END) AS turnos_nocturnos,
        SUM(CASE WHEN t.es_feriado = TRUE THEN 1 ELSE 0 END) AS turnos_feriados
      FROM ot_turnos t
      WHERE t.empleado_id = ?
        AND t.fecha BETWEEN ? AND ?
      GROUP BY t.empleado_id
    `;

    const [resumenRows] = await db.query(
      resumenQuery,
      [empleado_id, fecha_inicio, fecha_fin]
    ) as [RowDataPacket[], any];

    const cedula = empleadoRows[0].cedula_empleado;

    // Si no hay turnos, retornar resumen con valores en 0
    if (resumenRows.length === 0) {
      return {
        empleado_id,
        nombre_empleado: nombreEmpleado,
        cedula_empleado: cedula,
        total_turnos: 0,
        total_horas_normales: 0,
        total_horas_extras: 0,
        total_horas: 0,
        turnos_diurnos: 0,
        turnos_nocturnos: 0,
        turnos_feriados: 0,
        turnos: []
      };
    }

    // Obtener turnos detallados
    const turnosDetallados = await getTurnos({
      empleado_id,
      fecha_inicio,
      fecha_fin,
      pageSize: 9999 // Sin paginación, obtener todos
    });

    // Construir DTO de resumen
    const totalHorasNormales = Number(resumenRows[0].total_horas_normales) || 0;
    const totalHorasExtras = Number(resumenRows[0].total_horas_extras) || 0;

    const resumen: ResumenEmpleadoDTO = {
      empleado_id: resumenRows[0].empleado_id,
      nombre_empleado: nombreEmpleado,
      cedula_empleado: cedula,
      total_turnos: Number(resumenRows[0].total_turnos) || 0,
      total_horas_normales: totalHorasNormales,
      total_horas_extras: totalHorasExtras,
      total_horas: totalHorasNormales + totalHorasExtras,
      turnos_diurnos: Number(resumenRows[0].turnos_diurnos) || 0,
      turnos_nocturnos: Number(resumenRows[0].turnos_nocturnos) || 0,
      turnos_feriados: Number(resumenRows[0].turnos_feriados) || 0,
      turnos: turnosDetallados.data
    };

    return resumen;
  } catch (error) {
    console.error('Error en getResumenEmpleado:', error);
    throw new Error('Error al obtener resumen de empleado');
  }
}

/**
 * Registrar nuevo turno
 *
 * Realiza las siguientes validaciones y acciones:
 * 1. Valida que el empleado existe y está activo (BD RRHH)
 * 2. Valida que el puesto existe y está activo (BD turnos)
 * 3. Llama a sp_registrar_turno para insertar el turno
 * 4. El SP calcula automáticamente: tipo_turno, es_feriado, feriado_id
 * 5. Retorna el turno completo recién creado
 *
 * @param dto - Datos del turno a crear
 * @param userId - ID del usuario que registra el turno (para auditoría)
 * @returns Turno creado con todos los campos (incluyendo auto-calculados)
 *
 * @throws EmpleadoNoExisteError si el empleado no existe
 * @throws EmpleadoInactivoError si el empleado está inactivo
 * @throws PuestoNoExisteError si el puesto no existe
 * @throws PuestoInactivoError si el puesto está inactivo
 * @throws TurnoDuplicadoError si ya existe turno para empleado+puesto+fecha
 * @throws HorasExcedidasError si las horas totales exceden 16
 * @throws Error para otros errores inesperados
 *
 * @example
 * ```typescript
 * try {
 *   const turno = await registrarTurno({
 *     empleado_id: 1001,
 *     puesto_id: 42,
 *     fecha: '2026-01-15',
 *     hora_entrada: '06:00:00',
 *     hora_salida: '18:00:00',
 *     horas_normales: 10.0,
 *     horas_extras: 2.0,
 *     observaciones: 'Turno normal'
 *   }, 5);
 *
 *   console.log('Turno registrado:', turno.id);
 *   console.log('Tipo turno:', turno.tipo_turno); // Auto-calculado por SP
 *   console.log('Es feriado:', turno.es_feriado); // Auto-calculado por SP
 * } catch (error) {
 *   if (error instanceof TurnoDuplicadoError) {
 *     console.error('Turno ya existe');
 *   }
 * }
 * ```
 */
export async function registrarTurno(
  dto: CreateTurnoDTO,
  userId: number
): Promise<Turno> {
  console.log(
    `[Turnos Service] Registrando turno para empleado ${dto.empleado_id} en puesto ${dto.puesto_id} el ${dto.fecha}`
  );

  // VALIDACIÓN 1: Verificar que empleado existe y está activo (BD RRHH)
  try {
    const empleadoActivo = await validarGuardianActivo(dto.empleado_id);

    if (!empleadoActivo) {
      throw new EmpleadoInactivoError(dto.empleado_id);
    }

    console.log(`[Turnos Service] Empleado ${dto.empleado_id} validado (activo)`);
  } catch (error: any) {
    // Si validarGuardianActivo lanza error, el empleado no existe
    if (error instanceof EmpleadoInactivoError) {
      throw error;
    }

    console.error(`[Turnos Service] Empleado ${dto.empleado_id} no existe en BD RRHH`);
    throw new EmpleadoNoExisteError(dto.empleado_id);
  }

  // VALIDACIÓN 2: Verificar que puesto existe y está activo (BD turnos)
  await validarPuestoActivo(dto.puesto_id);
  console.log(`[Turnos Service] Puesto ${dto.puesto_id} validado (activo)`);

  // PASO 3: Convertir DTO a formato de BD
  const data = dtoToNuevoTurnoDB(dto, userId);

  // PASO 4: Llamar al stored procedure para registrar turno
  console.log(`[Turnos Service] Llamando a sp_registrar_turno...`);
  const result = await callSpRegistrarTurno(data);

  console.log(
    `[Turnos Service] Turno registrado exitosamente. ID: ${result.turno_id}, Mensaje: ${result.mensaje}`
  );

  // PASO 5: Obtener turno completo recién creado
  const turno = await getTurnoByIdSimple(result.turno_id!);

  if (!turno) {
    throw new Error(
      `Turno fue creado (ID ${result.turno_id}) pero no se pudo recuperar`
    );
  }

  console.log(
    `[Turnos Service] Turno recuperado: tipo=${turno.tipo_turno}, es_feriado=${turno.es_feriado}`
  );

  return turno;
}

/**
 * Actualizar turno existente
 *
 * Estrategia: DELETE turno antiguo + INSERT nuevo (vía sp_registrar_turno)
 * para re-ejecutar validaciones y cálculos automáticos.
 *
 * RESTRICCIÓN CRÍTICA: Solo si procesado_nomina = FALSE
 *
 * @param id - ID del turno a actualizar
 * @param dto - Datos actualizados (solo campos editables)
 * @param userId - ID del usuario que actualiza
 * @returns Turno actualizado con campos recalculados
 *
 * @throws TurnoNoExisteError si turno no existe
 * @throws TurnoProcesadoError si procesado_nomina = TRUE
 * @throws EmpleadoInactivoError si empleado se volvió inactivo
 * @throws PuestoInactivoError si puesto se volvió inactivo
 * @throws HorasExcedidasError si nuevas horas exceden límite
 *
 * @example
 * ```typescript
 * const turno = await actualizarTurno(123, {
 *   horas_normales: 11.0,
 *   horas_extras: 1.0,
 *   observaciones: 'Turno modificado'
 * }, 5);
 * // Turno actualizado con tipo_turno y es_feriado recalculados
 * ```
 */
export async function actualizarTurno(
  id: number,
  dto: UpdateTurnoDTO,
  userId: number
): Promise<Turno> {
  console.log(`[Turnos Service] Actualizando turno ${id}`);

  // VALIDACIÓN 1: Verificar que turno existe y NO está procesado
  await verificarTurnoNoProcesado(id);

  // PASO 2: Obtener turno actual para tener datos completos
  const turnoActual = await getTurnoByIdSimple(id);

  if (!turnoActual) {
    throw new TurnoNoExisteError(id);
  }

  // PASO 3: Construir CreateTurnoDTO con datos actuales + cambios
  const createDto: CreateTurnoDTO = {
    empleado_id: turnoActual.empleado_id, // NO modificable
    puesto_id: turnoActual.puesto_id,     // NO modificable
    fecha: turnoActual.fecha,             // NO modificable
    hora_entrada: dto.hora_entrada ?? turnoActual.hora_entrada,
    hora_salida: dto.hora_salida ?? turnoActual.hora_salida,
    horas_normales: dto.horas_normales ?? turnoActual.horas_normales,
    horas_extras: dto.horas_extras ?? turnoActual.horas_extras,
    observaciones: dto.observaciones !== undefined ? dto.observaciones : turnoActual.observaciones
  };

  // PASO 4: Iniciar transacción
  const pool = getTurnosPool();
  const connection = await pool.getConnection();
  await connection.beginTransaction();

  try {
    // PASO 5: DELETE turno antiguo
    await connection.execute('DELETE FROM ot_turnos WHERE id = ?', [id]);
    console.log(`[Turnos Service] Turno ${id} eliminado para actualización`);

    // PASO 6: Convertir DTO a formato de BD
    const data = dtoToNuevoTurnoDB(createDto, userId);

    // PASO 7: Llamar a SP para crear turno nuevo (con re-cálculos)
    await connection.execute(
      `CALL ot_sp_registrar_turno(?, ?, ?, ?, ?, ?, ?, ?, ?, @turno_id, @mensaje)`,
      [
        data.empleado_id,
        data.puesto_id,
        data.fecha,
        data.hora_entrada,
        data.hora_salida,
        data.horas_normales,
        data.horas_extras,
        data.observaciones,
        data.created_by,
      ]
    );

    // PASO 8: Obtener OUT parameters
    const [outParams] = await connection.execute<RowDataPacket[]>(
      'SELECT @turno_id AS turno_id, @mensaje AS mensaje'
    );

    const result = outParams[0] as { turno_id: number | null; mensaje: string };

    if (result.turno_id === null) {
      throw new Error(`Error al actualizar turno: ${result.mensaje}`);
    }

    // PASO 9: Commit transacción
    await connection.commit();
    console.log(`[Turnos Service] Turno actualizado exitosamente. Nuevo ID: ${result.turno_id}`);

    // PASO 10: Obtener turno recién creado
    const turnoNuevo = await getTurnoByIdSimple(result.turno_id);

    if (!turnoNuevo) {
      throw new Error(`Turno fue actualizado pero no se pudo recuperar`);
    }

    return turnoNuevo;
  } catch (error: any) {
    // Rollback en caso de error
    await connection.rollback();
    console.error(`[Turnos Service] Error al actualizar turno ${id}:`, error);

    // Re-lanzar custom errors
    if (
      error instanceof EmpleadoInactivoError ||
      error instanceof PuestoInactivoError ||
      error instanceof HorasExcedidasError
    ) {
      throw error;
    }

    // Error genérico
    throw new Error(`Error al actualizar turno: ${error.message}`);
  } finally {
    connection.release();
  }
}

/**
 * Eliminar turno
 *
 * RESTRICCIÓN CRÍTICA: Solo si procesado_nomina = FALSE
 *
 * @param id - ID del turno a eliminar
 * @param userId - ID del usuario que elimina (para auditoría)
 * @returns void
 *
 * @throws TurnoNoExisteError si turno no existe
 * @throws TurnoProcesadoError si procesado_nomina = TRUE
 *
 * @example
 * ```typescript
 * await eliminarTurno(123, 5);
 * // Turno eliminado
 * ```
 */
export async function eliminarTurno(id: number, userId: number): Promise<void> {
  console.log(`[Turnos Service] Eliminando turno ${id} (usuario: ${userId})`);

  // VALIDACIÓN 1: Verificar que turno existe y NO está procesado
  await verificarTurnoNoProcesado(id);

  // PASO 2: DELETE del turno
  const pool = getTurnosPool();

  const [result] = await pool.execute<ResultSetHeader>(
    'DELETE FROM ot_turnos WHERE id = ?',
    [id]
  );

  if (result.affectedRows === 0) {
    throw new TurnoNoExisteError(id);
  }

  console.log(`[Turnos Service] Turno ${id} eliminado exitosamente`);
}

/**
 * Obtener calendario mensual de turnos
 *
 * Agrupa turnos por día del mes especificado.
 * Incluye información de feriados para cada día.
 * Retorna TODOS los días del mes (1 al último día), incluso si no tienen turnos.
 *
 * @param año - Año del calendario (2000-2100)
 * @param mes - Mes del calendario (1-12)
 * @param filtros - Filtros opcionales (empleado_id, puesto_id, ubicacion_id, cliente_id)
 * @returns Calendario mensual con turnos agrupados por día
 *
 * @throws Error si hay problema con la base de datos
 *
 * @example
 * ```typescript
 * const calendario = await getCalendarioMensual(2026, 1, { empleado_id: 1001 });
 * // Retorna:
 * // {
 * //   año: 2026,
 * //   mes: 1,
 * //   dias: [
 * //     { fecha: "2026-01-01", es_feriado: true, nombre_feriado: "Año Nuevo", turnos: [...] },
 * //     { fecha: "2026-01-02", es_feriado: false, nombre_feriado: null, turnos: [...] },
 * //     ...
 * //   ]
 * // }
 * ```
 */
export async function getCalendarioMensual(
  año: number,
  mes: number,
  filtros: {
    empleado_id?: number;
    puesto_id?: number;
    ubicacion_id?: number;
    cliente_id?: number;
  } = {}
): Promise<CalendarioMensualDTO> {
  console.log(`[Turnos Service] Obteniendo calendario para ${año}-${mes}`);

  // PASO 1: Calcular rango de fechas del mes
  const fecha_inicio = `${año}-${mes.toString().padStart(2, '0')}-01`;
  const ultimoDia = new Date(año, mes, 0).getDate();
  const fecha_fin = `${año}-${mes.toString().padStart(2, '0')}-${ultimoDia.toString().padStart(2, '0')}`;

  console.log(`[Turnos Service] Rango: ${fecha_inicio} a ${fecha_fin} (${ultimoDia} días)`);

  // PASO 2: Obtener todos los turnos del mes con filtros
  const { data: turnos } = await getTurnos({
    fecha_inicio,
    fecha_fin,
    empleado_id: filtros.empleado_id,
    puesto_id: filtros.puesto_id,
    ubicacion_id: filtros.ubicacion_id,
    cliente_id: filtros.cliente_id,
    page: 1,
    pageSize: 1000, // Máximo estimado de turnos en un mes
  });

  console.log(`[Turnos Service] Turnos obtenidos: ${turnos.length}`);

  // PASO 3: Agrupar turnos por fecha
  const turnosPorFecha = new Map<string, Turno[]>();
  for (const turno of turnos) {
    const fecha = turno.fecha;
    if (!turnosPorFecha.has(fecha)) {
      turnosPorFecha.set(fecha, []);
    }
    turnosPorFecha.get(fecha)!.push(turno);
  }

  // PASO 4: Obtener feriados del mes
  const pool = getTurnosPool();
  const [feriadosRows] = await pool.execute<RowDataPacket[]>(
    `SELECT fecha, nombre, tipo
     FROM ot_feriados
     WHERE YEAR(fecha) = ? AND MONTH(fecha) = ?
       AND activo = 1`,
    [año, mes]
  );

  const feriados = new Map<string, { nombre: string; tipo: string }>();
  for (const row of feriadosRows) {
    // Convertir Date a YYYY-MM-DD (manejar zona horaria)
    const fecha = new Date(row.fecha);
    const fechaStr = `${fecha.getFullYear()}-${(fecha.getMonth() + 1).toString().padStart(2, '0')}-${fecha.getDate().toString().padStart(2, '0')}`;
    feriados.set(fechaStr, {
      nombre: row.nombre,
      tipo: row.tipo,
    });
  }

  console.log(`[Turnos Service] Feriados en el mes: ${feriados.size}`);

  // PASO 5: Generar array de días del mes
  const dias: DiaCalendarioDTO[] = [];

  for (let dia = 1; dia <= ultimoDia; dia++) {
    const fecha = `${año}-${mes.toString().padStart(2, '0')}-${dia.toString().padStart(2, '0')}`;
    const turnosDelDia = turnosPorFecha.get(fecha) || [];
    const feriadoInfo = feriados.get(fecha);

    // Transformar turnos a formato simplificado
    const turnosCalendario: TurnoCalendarioDTO[] = turnosDelDia.map((turno) => ({
      id: turno.id,
      empleado: {
        id: turno.empleado_id,
        nombre: (turno as any).empleado_nombre_completo || 'Desconocido',
      },
      puesto: {
        id: turno.puesto_id,
        codigo: (turno as any).puesto_codigo || '',
        nombre: (turno as any).puesto_nombre || 'Desconocido',
      },
      ubicacion: {
        id: (turno as any).ubicacion_id || 0,
        nombre: (turno as any).ubicacion_nombre || 'Desconocido',
      },
      cliente: {
        id: (turno as any).cliente_id || 0,
        nombre: (turno as any).cliente_nombre || 'Desconocido',
      },
      hora_entrada: turno.hora_entrada,
      hora_salida: turno.hora_salida,
      tipo_turno: turno.tipo_turno,
      horas_normales: turno.horas_normales,
      horas_extras: turno.horas_extras,
      horas_totales: turno.horas_normales + turno.horas_extras,
    }));

    dias.push({
      fecha,
      es_feriado: !!feriadoInfo,
      nombre_feriado: feriadoInfo?.nombre || null,
      tipo_feriado: feriadoInfo?.tipo || null,
      turnos: turnosCalendario,
    });
  }

  console.log(`[Turnos Service] Calendario generado con ${dias.length} días`);

  return {
    año,
    mes,
    dias,
  };
}
