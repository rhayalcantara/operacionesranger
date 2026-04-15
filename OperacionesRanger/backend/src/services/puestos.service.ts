/**
 * Servicio de Puestos
 * Sistema de Gestión de Turnos - OperacionesRanger
 *
 * Implementa la lógica de negocio para la gestión de puestos de seguridad.
 * Maneja operaciones CRUD con validaciones de negocio y relaciones con
 * ubicaciones, clientes y turnos.
 *
 * @module services/puestos.service
 */

import { RowDataPacket, ResultSetHeader } from 'mysql2/promise';
import { getTurnosPool } from '../config/database';
import {
  Puesto,
  PuestoConRelaciones,
  CreatePuestoDTO,
  UpdatePuestoDTO,
  dtoToNuevoPuestoDB,
  dtoToPuestoActualizable,
  normalizeCodigo
} from '../models/puesto.model';

// ============================================================================
// INTERFACES PARA QUERIES
// ============================================================================

interface GetPuestosFilters {
  page?: number;
  pageSize?: number;
  search?: string;
  ubicacion_id?: number;
  cliente_id?: number;
  activo?: boolean;
}

interface GetTurnosFilters {
  page?: number;
  pageSize?: number;
  fecha_inicio?: string;
  fecha_fin?: string;
}

interface PaginatedResult<T> {
  data: T[];
  total: number;
}

// ============================================================================
// SERVICIO PRINCIPAL
// ============================================================================

/**
 * Obtener lista paginada de puestos con filtros
 *
 * @param filters - Filtros de búsqueda y paginación
 * @returns Lista paginada de puestos con relaciones
 *
 * @throws Error si hay un problema con la base de datos
 *
 * @example
 * // Listar todos los puestos (página 1)
 * const result = await getPuestos({ page: 1, pageSize: 10 });
 *
 * @example
 * // Filtrar por ubicación
 * const result = await getPuestos({ ubicacion_id: 5 });
 *
 * @example
 * // Filtrar por cliente (requiere JOIN con ubicaciones)
 * const result = await getPuestos({ cliente_id: 3 });
 *
 * @example
 * // Buscar por nombre o código
 * const result = await getPuestos({ search: "entrada" });
 */
export async function getPuestos(
  filters: GetPuestosFilters = {}
): Promise<PaginatedResult<Puesto>> {
  const {
    page = 1,
    pageSize = 10,
    search,
    ubicacion_id,
    cliente_id,
    activo
  } = filters;

  const offset = (page - 1) * pageSize;

  // Construir query base con JOINs
  let query = `
    SELECT
      p.*,
      u.nombre AS ubicacion_nombre,
      u.codigo AS ubicacion_codigo,
      c.id AS cliente_id,
      c.nombre AS cliente_nombre
    FROM ot_puestos p
    INNER JOIN ot_ubicaciones u ON p.ubicacion_id = u.id
    INNER JOIN ot_clientes c ON u.cliente_id = c.id
    WHERE 1=1
  `;

  const params: any[] = [];

  // Aplicar filtros
  if (search) {
    query += ` AND (
      p.nombre LIKE ? OR
      p.codigo LIKE ? OR
      p.descripcion LIKE ?
    )`;
    const searchPattern = `%${search}%`;
    params.push(searchPattern, searchPattern, searchPattern);
  }

  if (ubicacion_id) {
    query += ` AND p.ubicacion_id = ?`;
    params.push(ubicacion_id);
  }

  if (cliente_id) {
    query += ` AND u.cliente_id = ?`;
    params.push(cliente_id);
  }

  if (activo !== undefined) {
    query += ` AND p.activo = ?`;
    params.push(activo);
  }

  // Query para contar total
  const countQuery = query.replace(
    /SELECT .* FROM/,
    'SELECT COUNT(*) as total FROM'
  );

  // Ejecutar query de conteo
  const [countRows] = await getTurnosPool().execute<RowDataPacket[]>(countQuery, params);
  const total = countRows[0]?.total || 0;

  // Agregar ordenamiento y paginación
  query += ` ORDER BY p.created_at DESC LIMIT ? OFFSET ?`;
  const dataParams = [...params, String(pageSize), String(offset)];

  // Ejecutar query de datos
  const [rows] = await getTurnosPool().execute<RowDataPacket[]>(query, dataParams);

  return {
    data: rows as Puesto[],
    total
  };
}

/**
 * Obtener puesto por ID con relaciones completas
 *
 * Incluye:
 * - Información del puesto
 * - Ubicación (nombre, código)
 * - Cliente (id, nombre)
 * - Count de turnos registrados
 *
 * @param id - ID del puesto
 * @returns Puesto con relaciones o null si no existe
 *
 * @throws Error si hay un problema con la base de datos
 *
 * @example
 * const puesto = await getPuestoById(42);
 * if (!puesto) {
 *   throw new Error('Puesto no encontrado');
 * }
 * console.log(puesto.cliente_nombre); // Nombre del cliente
 * console.log(puesto.turnos_count);   // Cantidad de turnos
 */
export async function getPuestoById(id: number): Promise<PuestoConRelaciones | null> {
  const query = `
    SELECT
      p.*,
      u.nombre AS ubicacion_nombre,
      u.codigo AS ubicacion_codigo,
      c.id AS cliente_id,
      c.nombre AS cliente_nombre,
      0 AS turnos_count
    FROM ot_puestos p
    INNER JOIN ot_ubicaciones u ON p.ubicacion_id = u.id
    INNER JOIN ot_clientes c ON u.cliente_id = c.id
    WHERE p.id = ?
  `;

  // NOTA: turnos_count siempre es 0 porque tabla 'turnos' no existe aún
  // Cuando se implemente, cambiar a:
  // (SELECT COUNT(*) FROM ot_turnos WHERE puesto_id = p.id) AS turnos_count

  const [rows] = await getTurnosPool().query<RowDataPacket[]>(query, [id]);

  if (rows.length === 0) {
    return null;
  }

  return rows[0] as PuestoConRelaciones;
}

/**
 * Obtener turnos de un puesto (con paginación y filtros)
 *
 * NOTA: Tabla 'turnos' NO existe aún. Esta función retorna array vacío
 * pero está preparada para futura implementación.
 *
 * @param puestoId - ID del puesto
 * @param filters - Filtros de fecha y paginación
 * @returns Lista paginada de turnos (actualmente vacía)
 *
 * @example
 * const result = await getTurnosByPuesto(42, {
 *   fecha_inicio: '2026-01-01',
 *   fecha_fin: '2026-01-31'
 * });
 * // result = { data: [], total: 0 }
 */
export async function getTurnosByPuesto(
  puestoId: number,
  _filters: GetTurnosFilters = {}
): Promise<PaginatedResult<any>> {
  // Verificar que el puesto existe
  const puesto = await getPuestoById(puestoId);
  if (!puesto) {
    throw new Error('Puesto no encontrado');
  }

  // NOTA: Tabla 'turnos' NO existe aún
  // Retornar array vacío por ahora
  // Cuando se implemente la tabla turnos, descomentar el código siguiente:

  /*
  const {
    page = 1,
    pageSize = 10,
    fecha_inicio,
    fecha_fin
  } = filters;

  const offset = (page - 1) * pageSize;

  let query = `
    SELECT
      t.*,
      e.nombres,
      e.apellidos,
      e.cedula_empleado
    FROM ot_turnos t
    INNER JOIN rh_empleado e ON t.empleado_id = e.id_empleado
    WHERE t.puesto_id = ?
  `;

  const params: any[] = [puestoId];

  if (fecha_inicio) {
    query += ` AND t.fecha >= ?`;
    params.push(fecha_inicio);
  }

  if (fecha_fin) {
    query += ` AND t.fecha <= ?`;
    params.push(fecha_fin);
  }

  // Count query
  const countQuery = query.replace(
    /SELECT .* FROM/,
    'SELECT COUNT(*) as total FROM'
  ).replace(/INNER JOIN.*WHERE/, 'WHERE');

  const [countRows] = await getTurnosPool().query<RowDataPacket[]>(countQuery, params);
  const total = countRows[0]?.total || 0;

  // Data query
  query += ` ORDER BY t.fecha DESC, t.hora_entrada ASC LIMIT ? OFFSET ?`;
  params.push(pageSize, offset);

  const [rows] = await getTurnosPool().query<RowDataPacket[]>(query, params);

  return {
    data: rows,
    total
  };
  */

  // Por ahora, retornar array vacío
  return {
    data: [],
    total: 0
  };
}

/**
 * Crear nuevo puesto
 *
 * Validaciones:
 * - ubicacion_id debe existir y estar activa
 * - codigo debe ser único dentro de la ubicación (constraint uk_ubicacion_codigo)
 * - codigo se normaliza a mayúsculas automáticamente
 *
 * @param data - Datos del nuevo puesto
 * @returns Puesto creado con relaciones
 *
 * @throws Error si ubicacion_id no existe o está inactiva
 * @throws Error si codigo ya existe en la ubicación (violación de unique constraint)
 * @throws Error si hay un problema con la base de datos
 *
 * @example
 * const puesto = await createPuesto({
 *   ubicacion_id: 5,
 *   codigo: "ENT01",
 *   nombre: "Entrada Principal",
 *   cantidad_guardianes: 2
 * });
 */
export async function createPuesto(data: CreatePuestoDTO): Promise<PuestoConRelaciones> {
  // 1. Validar que ubicacion_id existe y está activa
  const [ubicacionRows] = await getTurnosPool().query<RowDataPacket[]>(
    'SELECT id, activo FROM ot_ubicaciones WHERE id = ?',
    [data.ubicacion_id]
  );

  if (ubicacionRows.length === 0) {
    throw new Error('Ubicación no encontrada');
  }

  if (!ubicacionRows[0].activo) {
    throw new Error('La ubicación no está activa');
  }

  // 2. Normalizar código (mayúsculas)
  const codigoNormalizado = normalizeCodigo(data.codigo);

  // 3. Verificar que código sea único dentro de la ubicación
  const [existingRows] = await getTurnosPool().query<RowDataPacket[]>(
    'SELECT id FROM ot_puestos WHERE ubicacion_id = ? AND codigo = ?',
    [data.ubicacion_id, codigoNormalizado]
  );

  if (existingRows.length > 0) {
    throw new Error(`El código '${codigoNormalizado}' ya existe en esta ubicación`);
  }

  // 4. Preparar datos para INSERT
  const newPuesto = dtoToNuevoPuestoDB(data);
  newPuesto.codigo = codigoNormalizado;

  // 5. Insertar puesto
  const [result] = await getTurnosPool().query<ResultSetHeader>(
    `INSERT INTO ot_puestos (
      ubicacion_id, codigo, nombre, descripcion,
      cantidad_guardianes, requiere_turno_diurno, requiere_turno_nocturno, activo
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      newPuesto.ubicacion_id,
      newPuesto.codigo,
      newPuesto.nombre,
      newPuesto.descripcion,
      newPuesto.cantidad_guardianes,
      newPuesto.requiere_turno_diurno,
      newPuesto.requiere_turno_nocturno,
      newPuesto.activo
    ]
  );

  const insertedId = result.insertId;

  // 6. Retornar puesto creado con relaciones
  const createdPuesto = await getPuestoById(insertedId);

  if (!createdPuesto) {
    throw new Error('Error al recuperar el puesto creado');
  }

  return createdPuesto;
}

/**
 * Actualizar puesto existente
 *
 * Validaciones:
 * - Puesto debe existir
 * - Si actualiza codigo, debe ser único dentro de la ubicación
 * - codigo se normaliza a mayúsculas automáticamente
 *
 * Nota: ubicacion_id NO se puede cambiar
 *
 * @param id - ID del puesto a actualizar
 * @param data - Datos a actualizar (campos opcionales)
 * @returns Puesto actualizado con relaciones
 *
 * @throws Error si puesto no existe
 * @throws Error si nuevo codigo ya existe en la ubicación
 * @throws Error si hay un problema con la base de datos
 *
 * @example
 * const puesto = await updatePuesto(42, {
 *   nombre: "Entrada Principal Actualizada",
 *   cantidad_guardianes: 3
 * });
 */
export async function updatePuesto(
  id: number,
  data: UpdatePuestoDTO
): Promise<PuestoConRelaciones> {
  // 1. Verificar que puesto existe
  const existingPuesto = await getPuestoById(id);
  if (!existingPuesto) {
    throw new Error('Puesto no encontrado');
  }

  // 2. Si actualiza codigo, normalizarlo y verificar unicidad
  if (data.codigo) {
    const codigoNormalizado = normalizeCodigo(data.codigo);

    // Verificar que código no exista en otra fila de la misma ubicación
    const [existingRows] = await getTurnosPool().query<RowDataPacket[]>(
      'SELECT id FROM ot_puestos WHERE ubicacion_id = ? AND codigo = ? AND id != ?',
      [existingPuesto.ubicacion_id, codigoNormalizado, id]
    );

    if (existingRows.length > 0) {
      throw new Error(`El código '${codigoNormalizado}' ya existe en esta ubicación`);
    }

    data.codigo = codigoNormalizado;
  }

  // 3. Preparar datos para UPDATE
  const updateData = dtoToPuestoActualizable(data);

  // 4. Construir query dinámica (solo campos proporcionados)
  const fields = Object.keys(updateData);
  if (fields.length === 0) {
    // No hay nada que actualizar, retornar puesto actual
    return existingPuesto;
  }

  const setClause = fields.map(field => `${field} = ?`).join(', ');
  const values = fields.map(field => (updateData as any)[field]);

  // 5. Ejecutar UPDATE
  await getTurnosPool().query(
    `UPDATE ot_puestos SET ${setClause} WHERE id = ?`,
    [...values, id]
  );

  // 6. Retornar puesto actualizado con relaciones
  const updatedPuesto = await getPuestoById(id);

  if (!updatedPuesto) {
    throw new Error('Error al recuperar el puesto actualizado');
  }

  return updatedPuesto;
}

/**
 * Eliminar puesto (soft delete)
 *
 * Validaciones:
 * - Puesto debe existir
 * - Puesto NO debe tener turnos registrados
 *
 * Nota: Es un soft delete (activo = false), NO elimina el registro.
 *
 * @param id - ID del puesto a eliminar
 * @returns Objeto con mensaje y ID del puesto eliminado
 *
 * @throws Error si puesto no existe
 * @throws Error si puesto tiene turnos registrados (cuando se implemente tabla turnos)
 * @throws Error si hay un problema con la base de datos
 *
 * @example
 * const result = await deletePuesto(42);
 * // result = { message: "Puesto desactivado", id: 42 }
 */
export async function deletePuesto(id: number): Promise<{ message: string; id: number }> {
  // 1. Verificar que puesto existe
  const existingPuesto = await getPuestoById(id);
  if (!existingPuesto) {
    throw new Error('Puesto no encontrado');
  }

  // 2. Verificar que NO tenga turnos registrados
  // NOTA: Tabla 'turnos' NO existe aún, por ahora siempre pasa esta validación
  // Cuando se implemente, descomentar el código siguiente:

  /*
  const [turnosRows] = await getTurnosPool().query<RowDataPacket[]>(
    'SELECT COUNT(*) as count FROM ot_turnos WHERE puesto_id = ?',
    [id]
  );

  const turnosCount = turnosRows[0]?.count || 0;

  if (turnosCount > 0) {
    throw new Error(
      `No se puede eliminar el puesto porque tiene ${turnosCount} turno(s) registrado(s)`
    );
  }
  */

  // 3. Soft delete: UPDATE activo = false
  await getTurnosPool().query(
    'UPDATE ot_puestos SET activo = false WHERE id = ?',
    [id]
  );

  return {
    message: 'Puesto desactivado',
    id
  };
}

// ============================================================================
// FUNCIONES AUXILIARES
// ============================================================================

/**
 * Verificar si un puesto existe
 *
 * @param id - ID del puesto
 * @returns true si existe, false si no
 */
export async function puestoExists(id: number): Promise<boolean> {
  const [rows] = await getTurnosPool().query<RowDataPacket[]>(
    'SELECT id FROM ot_puestos WHERE id = ?',
    [id]
  );

  return rows.length > 0;
}

/**
 * Verificar si un código de puesto existe en una ubicación
 *
 * @param ubicacionId - ID de la ubicación
 * @param codigo - Código del puesto
 * @param excludeId - ID a excluir de la verificación (para updates)
 * @returns true si existe, false si no
 */
export async function codigoExistsInUbicacion(
  ubicacionId: number,
  codigo: string,
  excludeId?: number
): Promise<boolean> {
  const codigoNormalizado = normalizeCodigo(codigo);

  let query = 'SELECT id FROM ot_puestos WHERE ubicacion_id = ? AND codigo = ?';
  const params: any[] = [ubicacionId, codigoNormalizado];

  if (excludeId) {
    query += ' AND id != ?';
    params.push(excludeId);
  }

  const [rows] = await getTurnosPool().query<RowDataPacket[]>(query, params);

  return rows.length > 0;
}

/**
 * Obtener cantidad de puestos por ubicación
 *
 * @param ubicacionId - ID de la ubicación
 * @param activosOnly - Si true, solo cuenta puestos activos (default: true)
 * @returns Cantidad de puestos
 */
export async function countPuestosByUbicacion(
  ubicacionId: number,
  activosOnly: boolean = true
): Promise<number> {
  let query = 'SELECT COUNT(*) as count FROM ot_puestos WHERE ubicacion_id = ?';
  const params: any[] = [ubicacionId];

  if (activosOnly) {
    query += ' AND activo = true';
  }

  const [rows] = await getTurnosPool().query<RowDataPacket[]>(query, params);

  return rows[0]?.count || 0;
}
