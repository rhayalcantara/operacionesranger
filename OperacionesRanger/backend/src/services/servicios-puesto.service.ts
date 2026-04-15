/**
 * Servicio de Servicios por Puesto
 * Sistema de Gestión de Turnos - OperacionesRanger
 *
 * Implementa la lógica de negocio para la gestión de asignaciones semanales
 * de empleados a puestos de seguridad. Cada servicio por puesto define qué
 * empleado cubre cada día de la semana para un turno específico (DIURNO/NOCTURNO).
 *
 * @module services/servicios-puesto.service
 */

import { RowDataPacket, ResultSetHeader } from 'mysql2/promise';
import { getTurnosPool } from '../config/database';
import {
  ServicioPuestoConRelaciones,
  CreateServicioPuestoDTO,
  UpdateServicioPuestoDTO,
  TipoTurno,
  buildUpdateFields,
} from '../models/servicio-puesto.model';

// ============================================================================
// INTERFACES PARA QUERIES
// ============================================================================

interface GetServiciosPuestoFilters {
  page?: number;
  pageSize?: number;
  search?: string;
  puesto_id?: number;
  ubicacion_id?: number;
  cliente_id?: number;
  tipo_turno?: TipoTurno;
  cobrada?: boolean;
  activo?: boolean;
}

interface PaginatedResult<T> {
  data: T[];
  total: number;
}

// ============================================================================
// SQL FRAGMENTS
// ============================================================================

/**
 * Fragmento SQL para SELECT con JOINs de relaciones.
 * Incluye puesto, ubicación, cliente y nombres de empleados para cada día.
 *
 * Usa LEFT JOINs a rh_empleado para cada día de la semana
 * para obtener el nombre completo del empleado asignado.
 */
const SELECT_WITH_RELATIONS = `
  SELECT
    sp.*,
    p.nombre AS puesto_nombre,
    p.codigo AS puesto_codigo,
    u.nombre AS ubicacion_nombre,
    c.nombre AS cliente_nombre,
    CONCAT(e_dom.nombres, ' ', e_dom.apellidos) AS domingo_empleado_nombre,
    CONCAT(e_lun.nombres, ' ', e_lun.apellidos) AS lunes_empleado_nombre,
    CONCAT(e_mar.nombres, ' ', e_mar.apellidos) AS martes_empleado_nombre,
    CONCAT(e_mie.nombres, ' ', e_mie.apellidos) AS miercoles_empleado_nombre,
    CONCAT(e_jue.nombres, ' ', e_jue.apellidos) AS jueves_empleado_nombre,
    CONCAT(e_vie.nombres, ' ', e_vie.apellidos) AS viernes_empleado_nombre,
    CONCAT(e_sab.nombres, ' ', e_sab.apellidos) AS sabado_empleado_nombre
  FROM ot_servicios_puesto sp
  INNER JOIN ot_puestos p ON sp.puesto_id = p.id
  INNER JOIN ot_ubicaciones u ON p.ubicacion_id = u.id
  INNER JOIN ot_clientes c ON u.cliente_id = c.id
  LEFT JOIN rh_empleado e_dom ON sp.domingo_empleado_id = e_dom.id_empleado
  LEFT JOIN rh_empleado e_lun ON sp.lunes_empleado_id = e_lun.id_empleado
  LEFT JOIN rh_empleado e_mar ON sp.martes_empleado_id = e_mar.id_empleado
  LEFT JOIN rh_empleado e_mie ON sp.miercoles_empleado_id = e_mie.id_empleado
  LEFT JOIN rh_empleado e_jue ON sp.jueves_empleado_id = e_jue.id_empleado
  LEFT JOIN rh_empleado e_vie ON sp.viernes_empleado_id = e_vie.id_empleado
  LEFT JOIN rh_empleado e_sab ON sp.sabado_empleado_id = e_sab.id_empleado
`;

/**
 * Fragmento SQL para COUNT con los mismos JOINs (necesarios para filtros por ubicación/cliente/search)
 */
const COUNT_WITH_RELATIONS = `
  SELECT COUNT(*) AS total
  FROM ot_servicios_puesto sp
  INNER JOIN ot_puestos p ON sp.puesto_id = p.id
  INNER JOIN ot_ubicaciones u ON p.ubicacion_id = u.id
  INNER JOIN ot_clientes c ON u.cliente_id = c.id
`;

// ============================================================================
// SERVICIO PRINCIPAL
// ============================================================================

/**
 * Obtener lista paginada de servicios por puesto con filtros
 *
 * @param filters - Filtros de búsqueda y paginación
 * @returns Lista paginada de servicios con relaciones
 *
 * @throws Error si hay un problema con la base de datos
 *
 * @example
 * const result = await getServiciosPuesto({ page: 1, pageSize: 10 });
 *
 * @example
 * const result = await getServiciosPuesto({ puesto_id: 5, tipo_turno: 'DIURNO' });
 */
export async function getServiciosPuesto(
  filters: GetServiciosPuestoFilters = {}
): Promise<PaginatedResult<ServicioPuestoConRelaciones>> {
  const {
    page = 1,
    pageSize = 10,
    search,
    puesto_id,
    ubicacion_id,
    cliente_id,
    tipo_turno,
    cobrada,
    activo,
  } = filters;

  const offset = (page - 1) * pageSize;

  // Build WHERE clauses
  let whereClause = ' WHERE 1=1';
  const params: any[] = [];

  if (search) {
    whereClause += ` AND (
      p.nombre LIKE ? OR
      p.codigo LIKE ? OR
      u.nombre LIKE ? OR
      c.nombre LIKE ?
    )`;
    const searchPattern = `%${search}%`;
    params.push(searchPattern, searchPattern, searchPattern, searchPattern);
  }

  if (puesto_id) {
    whereClause += ` AND sp.puesto_id = ?`;
    params.push(puesto_id);
  }

  if (ubicacion_id) {
    whereClause += ` AND p.ubicacion_id = ?`;
    params.push(ubicacion_id);
  }

  if (cliente_id) {
    whereClause += ` AND u.cliente_id = ?`;
    params.push(cliente_id);
  }

  if (tipo_turno) {
    whereClause += ` AND sp.tipo_turno = ?`;
    params.push(tipo_turno);
  }

  if (cobrada !== undefined) {
    whereClause += ` AND sp.cobrada = ?`;
    params.push(cobrada);
  }

  if (activo !== undefined) {
    whereClause += ` AND sp.activo = ?`;
    params.push(activo);
  }

  // Count query
  const countQuery = COUNT_WITH_RELATIONS + whereClause;
  const [countRows] = await getTurnosPool().query<RowDataPacket[]>(countQuery, params);
  const total = countRows[0]?.total || 0;

  // Data query with pagination
  const dataQuery = SELECT_WITH_RELATIONS + whereClause + ` ORDER BY sp.created_at DESC LIMIT ? OFFSET ?`;
  const dataParams = [...params, Number(pageSize), Number(offset)];
  const [rows] = await getTurnosPool().query<RowDataPacket[]>(dataQuery, dataParams);

  return {
    data: rows as ServicioPuestoConRelaciones[],
    total,
  };
}

/**
 * Obtener servicio por puesto por ID con relaciones completas
 *
 * Incluye:
 * - Información del servicio
 * - Puesto (nombre, código)
 * - Ubicación (nombre)
 * - Cliente (nombre)
 * - Nombres de empleados asignados cada día
 *
 * @param id - ID del servicio por puesto
 * @returns Servicio con relaciones o null si no existe
 *
 * @throws Error si hay un problema con la base de datos
 *
 * @example
 * const servicio = await getServicioPuestoById(1);
 * if (!servicio) {
 *   throw new Error('Servicio no encontrado');
 * }
 */
export async function getServicioPuestoById(id: number): Promise<ServicioPuestoConRelaciones | null> {
  const query = SELECT_WITH_RELATIONS + ` WHERE sp.id = ?`;

  const [rows] = await getTurnosPool().query<RowDataPacket[]>(query, [id]);

  if (rows.length === 0) {
    return null;
  }

  return rows[0] as ServicioPuestoConRelaciones;
}

/**
 * Crear nuevo servicio por puesto
 *
 * Validaciones:
 * - puesto_id debe existir y estar activo
 * - La combinación (puesto_id, tipo_turno) debe ser única
 *
 * @param data - Datos del nuevo servicio
 * @param userId - ID del usuario que crea el registro
 * @returns Servicio creado con relaciones
 *
 * @throws Error si puesto_id no existe o está inactivo
 * @throws Error si ya existe un servicio para el mismo puesto y tipo de turno
 * @throws Error si hay un problema con la base de datos
 *
 * @example
 * const servicio = await createServicioPuesto({
 *   puesto_id: 5,
 *   tipo_turno: 'DIURNO',
 *   lunes_empleado_id: 1001,
 *   martes_empleado_id: 1002,
 * }, 1);
 */
export async function createServicioPuesto(
  data: CreateServicioPuestoDTO,
  userId: number | null
): Promise<ServicioPuestoConRelaciones> {
  // 1. Validar que puesto_id existe y está activo
  const [puestoRows] = await getTurnosPool().query<RowDataPacket[]>(
    'SELECT id, activo FROM ot_puestos WHERE id = ?',
    [data.puesto_id]
  );

  if (puestoRows.length === 0) {
    throw new Error('Puesto no encontrado');
  }

  if (!puestoRows[0].activo) {
    throw new Error('El puesto no está activo');
  }

  // 2. Verificar que no exista ya un servicio para el mismo puesto y tipo de turno
  const [existingRows] = await getTurnosPool().query<RowDataPacket[]>(
    'SELECT id FROM ot_servicios_puesto WHERE puesto_id = ? AND tipo_turno = ?',
    [data.puesto_id, data.tipo_turno]
  );

  if (existingRows.length > 0) {
    throw new Error(
      `Ya existe un servicio para este puesto con turno ${data.tipo_turno}`
    );
  }

  // 3. Insertar servicio
  const [result] = await getTurnosPool().query<ResultSetHeader>(
    `INSERT INTO ot_servicios_puesto (
      puesto_id, tipo_turno,
      domingo_empleado_id, lunes_empleado_id, martes_empleado_id,
      miercoles_empleado_id, jueves_empleado_id, viernes_empleado_id,
      sabado_empleado_id, cobrada, activo, created_by
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      data.puesto_id,
      data.tipo_turno,
      data.domingo_empleado_id ?? null,
      data.lunes_empleado_id ?? null,
      data.martes_empleado_id ?? null,
      data.miercoles_empleado_id ?? null,
      data.jueves_empleado_id ?? null,
      data.viernes_empleado_id ?? null,
      data.sabado_empleado_id ?? null,
      data.cobrada ?? false,
      true, // activo por defecto
      userId,
    ]
  );

  const insertedId = result.insertId;

  // 4. Retornar servicio creado con relaciones
  const createdServicio = await getServicioPuestoById(insertedId);

  if (!createdServicio) {
    throw new Error('Error al recuperar el servicio creado');
  }

  return createdServicio;
}

/**
 * Actualizar servicio por puesto existente
 *
 * Validaciones:
 * - Servicio debe existir
 * - Si actualiza tipo_turno, la combinación (puesto_id, tipo_turno) debe ser única
 *
 * @param id - ID del servicio a actualizar
 * @param data - Datos a actualizar (campos opcionales)
 * @param userId - ID del usuario que actualiza
 * @returns Servicio actualizado con relaciones
 *
 * @throws Error si servicio no existe
 * @throws Error si nuevo tipo_turno ya existe para el puesto
 * @throws Error si hay un problema con la base de datos
 *
 * @example
 * const servicio = await updateServicioPuesto(1, {
 *   lunes_empleado_id: 1003,
 *   cobrada: true,
 * }, 1);
 */
export async function updateServicioPuesto(
  id: number,
  data: UpdateServicioPuestoDTO,
  _userId: number | null
): Promise<ServicioPuestoConRelaciones> {
  // 1. Verificar que servicio existe
  const existingServicio = await getServicioPuestoById(id);
  if (!existingServicio) {
    throw new Error('Servicio por puesto no encontrado');
  }

  // 2. Si actualiza tipo_turno, verificar unicidad
  if (data.tipo_turno && data.tipo_turno !== existingServicio.tipo_turno) {
    const [existingRows] = await getTurnosPool().query<RowDataPacket[]>(
      'SELECT id FROM ot_servicios_puesto WHERE puesto_id = ? AND tipo_turno = ? AND id != ?',
      [existingServicio.puesto_id, data.tipo_turno, id]
    );

    if (existingRows.length > 0) {
      throw new Error(
        `Ya existe un servicio para este puesto con turno ${data.tipo_turno}`
      );
    }
  }

  // 3. Preparar datos para UPDATE
  const updateData = buildUpdateFields(data);

  // 4. Construir query dinámica (solo campos proporcionados)
  const fields = Object.keys(updateData);
  if (fields.length === 0) {
    // No hay nada que actualizar, retornar servicio actual
    return existingServicio;
  }

  const setClause = fields.map(field => `${field} = ?`).join(', ');
  const values = fields.map(field => updateData[field]);

  // 5. Ejecutar UPDATE
  await getTurnosPool().query(
    `UPDATE ot_servicios_puesto SET ${setClause} WHERE id = ?`,
    [...values, id]
  );

  // 6. Retornar servicio actualizado con relaciones
  const updatedServicio = await getServicioPuestoById(id);

  if (!updatedServicio) {
    throw new Error('Error al recuperar el servicio actualizado');
  }

  return updatedServicio;
}

/**
 * Eliminar servicio por puesto (soft delete)
 *
 * Establece activo = false en lugar de eliminar el registro.
 *
 * @param id - ID del servicio a eliminar
 * @returns Objeto con mensaje y ID del servicio eliminado
 *
 * @throws Error si servicio no existe
 * @throws Error si hay un problema con la base de datos
 *
 * @example
 * const result = await deleteServicioPuesto(1);
 * // result = { message: "Servicio por puesto desactivado", id: 1 }
 */
export async function deleteServicioPuesto(id: number): Promise<{ message: string; id: number }> {
  // 1. Verificar que servicio existe
  const existingServicio = await getServicioPuestoById(id);
  if (!existingServicio) {
    throw new Error('Servicio por puesto no encontrado');
  }

  // 2. Soft delete: UPDATE activo = false
  await getTurnosPool().query(
    'UPDATE ot_servicios_puesto SET activo = false WHERE id = ?',
    [id]
  );

  return {
    message: 'Servicio por puesto desactivado',
    id,
  };
}

// ============================================================================
// FUNCIONES AUXILIARES
// ============================================================================

/**
 * Verificar si un servicio por puesto existe
 *
 * @param id - ID del servicio
 * @returns true si existe, false si no
 */
export async function servicioPuestoExists(id: number): Promise<boolean> {
  const [rows] = await getTurnosPool().query<RowDataPacket[]>(
    'SELECT id FROM ot_servicios_puesto WHERE id = ?',
    [id]
  );

  return rows.length > 0;
}
