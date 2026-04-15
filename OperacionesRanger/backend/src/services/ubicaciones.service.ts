/**
 * Servicio de Ubicaciones
 * Sistema de Gestión de Turnos - OperacionesRanger
 *
 * Proporciona lógica de negocio para:
 * - Listar ubicaciones con paginación, búsqueda y filtro por cliente
 * - Obtener ubicación por ID con información de cliente y puestos
 * - Crear nuevas ubicaciones
 * - Actualizar ubicaciones existentes
 * - Eliminar ubicaciones (soft delete) con validaciones
 *
 * @module services/ubicaciones.service
 */

import { RowDataPacket, ResultSetHeader } from 'mysql2/promise';
import { getTurnosPool } from '../config/database';
import {
  Ubicacion,
  CreateUbicacionDTO,
  UpdateUbicacionDTO,
  PaginatedUbicacionesDTO,
  UbicacionConRelaciones,
  dtoToNuevaUbicacionDB,
  dtoToUbicacionActualizable
} from '../models/ubicacion.model';

// ============================================================================
// TIPOS INTERNOS
// ============================================================================

interface UbicacionRow extends RowDataPacket, Ubicacion {}

interface UbicacionConRelacionesRow extends RowDataPacket, UbicacionConRelaciones {}

interface CountRow extends RowDataPacket {
  count: number;
}

// ============================================================================
// FUNCIONES PRINCIPALES
// ============================================================================

/**
 * Obtiene lista paginada de ubicaciones con búsqueda y filtro opcional por cliente
 *
 * Búsqueda por:
 * - Nombre de la ubicación (LIKE %search%)
 * - Dirección (LIKE %search%)
 * - Provincia (LIKE %search%)
 * - Municipio (LIKE %search%)
 *
 * Filtro:
 * - cliente_id: filtrar por cliente específico
 *
 * @param page - Número de página (1-indexed)
 * @param pageSize - Cantidad de registros por página
 * @param search - Término de búsqueda opcional
 * @param cliente_id - ID del cliente para filtrar (opcional)
 * @returns Datos paginados de ubicaciones
 *
 * @example
 * const result = await getUbicaciones(1, 20, 'principal', 42);
 * // { data: [...], total: 3, page: 1, pageSize: 20, totalPages: 1 }
 */
export async function getUbicaciones(
  page: number = 1,
  pageSize: number = 20,
  search?: string,
  cliente_id?: number
): Promise<PaginatedUbicacionesDTO> {
  const pool = getTurnosPool();

  // Calcular offset para paginación
  const offset = (page - 1) * pageSize;

  // Construir WHERE clause para búsqueda y filtro
  const whereConditions: string[] = [];
  const queryParams: any[] = [];

  // Filtro por cliente_id (si se proporciona)
  if (cliente_id !== undefined) {
    whereConditions.push('u.cliente_id = ?');
    queryParams.push(cliente_id);
  }

  // Búsqueda por texto (si se proporciona)
  if (search && search.trim() !== '') {
    const searchTerm = `%${search.trim()}%`;
    whereConditions.push(`(
      u.nombre LIKE ?
      OR u.direccion LIKE ?
      OR u.provincia LIKE ?
      OR u.municipio LIKE ?
    )`);
    queryParams.push(searchTerm, searchTerm, searchTerm, searchTerm);
  }

  const whereClause =
    whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

  // Query para obtener total de registros
  const countQuery = `
    SELECT COUNT(*) as count
    FROM ot_ubicaciones u
    ${whereClause}
  `;

  const [countRows] = await pool.execute<CountRow[]>(countQuery, queryParams);
  const total = countRows[0].count;

  // Query para obtener registros paginados (con nombre del cliente)
  const dataQuery = `
    SELECT u.*, c.nombre AS cliente_nombre
    FROM ot_ubicaciones u
    LEFT JOIN ot_clientes c ON u.cliente_id = c.id
    ${whereClause}
    ORDER BY u.nombre ASC
    LIMIT ? OFFSET ?
  `;

  const [dataRows] = await pool.execute<UbicacionRow[]>(dataQuery, [
    ...queryParams,
    String(pageSize),
    String(offset)
  ]);

  // Calcular total de páginas
  const totalPages = Math.ceil(total / pageSize);

  return {
    data: dataRows,
    total,
    page,
    pageSize,
    totalPages
  };
}

/**
 * Obtiene una ubicación por su ID con información adicional
 *
 * Incluye:
 * - Datos completos de la ubicación
 * - Nombre del cliente (JOIN)
 * - Cantidad de puestos activos (COUNT)
 *
 * @param id - ID de la ubicación
 * @returns Ubicación con información adicional
 * @throws Error si ubicación no existe
 *
 * @example
 * const ubicacion = await getUbicacionById(42);
 * // {
 * //   id: 42,
 * //   nombre: 'Sede Principal',
 * //   cliente_nombre: 'Banco Popular',
 * //   puestos_count: 3,
 * //   ...
 * // }
 */
export async function getUbicacionById(id: number): Promise<UbicacionConRelaciones> {
  const pool = getTurnosPool();

  // Query para obtener ubicación con JOIN a cliente y COUNT de puestos
  const query = `
    SELECT
      u.*,
      c.nombre as cliente_nombre,
      COALESCE(COUNT(p.id), 0) as puestos_count
    FROM ot_ubicaciones u
    INNER JOIN ot_clientes c ON u.cliente_id = c.id
    LEFT JOIN ot_puestos p ON u.id = p.ubicacion_id AND p.activo = TRUE
    WHERE u.id = ?
    GROUP BY u.id, c.nombre
  `;

  const [rows] = await pool.execute<UbicacionConRelacionesRow[]>(query, [id]);

  if (rows.length === 0) {
    throw new Error(`Ubicación con ID ${id} no encontrada`);
  }

  return rows[0];
}

/**
 * Crea una nueva ubicación
 *
 * Validaciones:
 * - cliente_id debe existir y estar activo
 * - código debe ser único dentro del cliente
 *
 * @param dto - DTO con datos de la nueva ubicación
 * @returns Ubicación creada
 * @throws Error si cliente no existe, está inactivo, o código duplicado
 *
 * @example
 * const dto: CreateUbicacionDTO = {
 *   cliente_id: 42,
 *   codigo: 'SEDE01',
 *   nombre: 'Sede Principal',
 *   coordenadas_gps: '18.486058,-69.931212'
 * };
 *
 * const ubicacion = await createUbicacion(dto);
 * // { id: 123, codigo: 'SEDE01', nombre: 'Sede Principal', ... }
 */
export async function createUbicacion(dto: CreateUbicacionDTO): Promise<Ubicacion> {
  const pool = getTurnosPool();

  // 1. Validar que cliente existe y está activo
  const clienteActivo = await _clienteExisteYActivo(dto.cliente_id);
  if (!clienteActivo) {
    throw new Error(
      `Cliente con ID ${dto.cliente_id} no existe o está inactivo`
    );
  }

  // 2. Validar que código sea único dentro del cliente
  const codigoUnico = await _codigoUnicoEnCliente(dto.cliente_id, dto.codigo);
  if (!codigoUnico) {
    throw new Error(
      `El código "${dto.codigo}" ya existe para este cliente`
    );
  }

  // 3. Convertir DTO a formato de BD
  const nuevaUbicacion = dtoToNuevaUbicacionDB(dto);

  // 4. Insertar en BD
  const insertQuery = `
    INSERT INTO ot_ubicaciones (
      cliente_id, codigo, nombre, direccion,
      provincia, municipio, sector,
      latitud, longitud,
      telefono, contacto_nombre, contacto_telefono,
      activo
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;

  const [result] = await pool.execute<ResultSetHeader>(insertQuery, [
    nuevaUbicacion.cliente_id,
    nuevaUbicacion.codigo,
    nuevaUbicacion.nombre,
    nuevaUbicacion.direccion,
    nuevaUbicacion.provincia,
    nuevaUbicacion.municipio,
    nuevaUbicacion.sector,
    nuevaUbicacion.latitud,
    nuevaUbicacion.longitud,
    nuevaUbicacion.telefono,
    nuevaUbicacion.contacto_nombre,
    nuevaUbicacion.contacto_telefono,
    nuevaUbicacion.activo
  ]);

  const insertId = result.insertId;

  // 5. Obtener ubicación recién creada
  const selectQuery = `SELECT * FROM ot_ubicaciones WHERE id = ?`;
  const [rows] = await pool.execute<UbicacionRow[]>(selectQuery, [insertId]);

  return rows[0];
}

/**
 * Actualiza una ubicación existente
 *
 * Validaciones:
 * - Si se cambia código, debe ser único dentro del cliente
 *
 * @param id - ID de la ubicación a actualizar
 * @param dto - DTO con campos a actualizar
 * @returns Ubicación actualizada
 * @throws Error si ubicación no existe o código duplicado
 *
 * @example
 * const dto: UpdateUbicacionDTO = {
 *   nombre: 'Sede Principal Actualizada',
 *   coordenadas_gps: '18.5,-69.9'
 * };
 *
 * const ubicacion = await updateUbicacion(42, dto);
 * // { id: 42, nombre: 'Sede Principal Actualizada', ... }
 */
export async function updateUbicacion(
  id: number,
  dto: UpdateUbicacionDTO
): Promise<Ubicacion> {
  const pool = getTurnosPool();

  // 1. Verificar que ubicación existe y obtener cliente_id
  const ubicacionExistente = await _getUbicacionSinRelaciones(id);
  if (!ubicacionExistente) {
    throw new Error(`Ubicación con ID ${id} no encontrada`);
  }

  // 2. Si se cambia código, validar unicidad
  if (dto.codigo && dto.codigo !== ubicacionExistente.codigo) {
    const codigoUnico = await _codigoUnicoEnCliente(
      ubicacionExistente.cliente_id,
      dto.codigo,
      id
    );
    if (!codigoUnico) {
      throw new Error(
        `El código "${dto.codigo}" ya existe para este cliente`
      );
    }
  }

  // 3. Convertir DTO a formato de BD
  const updateData = dtoToUbicacionActualizable(dto);

  // 4. Construir query de UPDATE dinámicamente
  const updateFields: string[] = [];
  const updateValues: any[] = [];

  for (const [key, value] of Object.entries(updateData)) {
    updateFields.push(`${key} = ?`);
    updateValues.push(value);
  }

  if (updateFields.length === 0) {
    // No hay campos para actualizar, retornar ubicación sin cambios
    return ubicacionExistente;
  }

  const updateQuery = `
    UPDATE ot_ubicaciones
    SET ${updateFields.join(', ')}
    WHERE id = ?
  `;

  await pool.execute(updateQuery, [...updateValues, id]);

  // 5. Obtener ubicación actualizada
  const selectQuery = `SELECT * FROM ot_ubicaciones WHERE id = ?`;
  const [rows] = await pool.execute<UbicacionRow[]>(selectQuery, [id]);

  return rows[0];
}

/**
 * Elimina una ubicación (soft delete)
 *
 * Validaciones:
 * - No se puede eliminar si tiene puestos activos
 *
 * @param id - ID de la ubicación a eliminar
 * @throws Error si ubicación no existe o tiene puestos activos
 *
 * @example
 * await deleteUbicacion(42);
 * // Ubicación desactivada (activo = false)
 */
export async function deleteUbicacion(id: number): Promise<void> {
  const pool = getTurnosPool();

  // 1. Verificar que ubicación existe
  const ubicacionExiste = await _ubicacionExiste(id);
  if (!ubicacionExiste) {
    throw new Error(`Ubicación con ID ${id} no encontrada`);
  }

  // 2. Verificar que no tenga puestos activos
  const tienePuestosActivos = await _ubicacionTienePuestosActivos(id);
  if (tienePuestosActivos) {
    const countQuery = `
      SELECT COUNT(*) as count
      FROM ot_puestos
      WHERE ubicacion_id = ? AND activo = TRUE
    `;
    const [countRows] = await pool.execute<CountRow[]>(countQuery, [id]);
    const cantidad = countRows[0].count;

    throw new Error(
      `No se puede eliminar la ubicación porque tiene ${cantidad} puesto${
        cantidad !== 1 ? 's' : ''
      } activo${cantidad !== 1 ? 's' : ''}. Desactive los puestos primero.`
    );
  }

  // 3. Soft delete: marcar como inactivo
  const updateQuery = `
    UPDATE ot_ubicaciones
    SET activo = FALSE
    WHERE id = ?
  `;

  await pool.execute(updateQuery, [id]);
}

// ============================================================================
// FUNCIONES AUXILIARES (PRIVADAS)
// ============================================================================

/**
 * Verifica si un cliente existe y está activo
 *
 * @param cliente_id - ID del cliente
 * @returns true si existe y está activo, false en caso contrario
 */
async function _clienteExisteYActivo(cliente_id: number): Promise<boolean> {
  const pool = getTurnosPool();

  const query = `
    SELECT COUNT(*) as count
    FROM ot_clientes
    WHERE id = ? AND activo = TRUE
  `;

  const [rows] = await pool.execute<CountRow[]>(query, [cliente_id]);
  return rows[0].count > 0;
}

/**
 * Verifica si un código es único dentro de un cliente
 *
 * @param cliente_id - ID del cliente
 * @param codigo - Código a verificar
 * @param excludeId - ID de ubicación a excluir (para updates)
 * @returns true si es único, false si ya existe
 */
async function _codigoUnicoEnCliente(
  cliente_id: number,
  codigo: string,
  excludeId?: number
): Promise<boolean> {
  const pool = getTurnosPool();

  let query = `
    SELECT COUNT(*) as count
    FROM ot_ubicaciones
    WHERE cliente_id = ? AND codigo = ?
  `;
  const queryParams: any[] = [cliente_id, codigo];

  // Si estamos actualizando, excluir el registro actual
  if (excludeId !== undefined) {
    query += ' AND id != ?';
    queryParams.push(excludeId);
  }

  const [rows] = await pool.execute<CountRow[]>(query, queryParams);
  return rows[0].count === 0;
}

/**
 * Verifica si una ubicación tiene puestos activos
 *
 * @param ubicacion_id - ID de la ubicación
 * @returns true si tiene puestos activos, false en caso contrario
 */
async function _ubicacionTienePuestosActivos(ubicacion_id: number): Promise<boolean> {
  const pool = getTurnosPool();

  const query = `
    SELECT COUNT(*) as count
    FROM ot_puestos
    WHERE ubicacion_id = ? AND activo = TRUE
  `;

  const [rows] = await pool.execute<CountRow[]>(query, [ubicacion_id]);
  return rows[0].count > 0;
}

/**
 * Verifica si una ubicación existe
 *
 * @param id - ID de la ubicación
 * @returns true si existe, false en caso contrario
 */
async function _ubicacionExiste(id: number): Promise<boolean> {
  const pool = getTurnosPool();

  const query = `
    SELECT COUNT(*) as count
    FROM ot_ubicaciones
    WHERE id = ?
  `;

  const [rows] = await pool.execute<CountRow[]>(query, [id]);
  return rows[0].count > 0;
}

/**
 * Obtiene una ubicación sin relaciones (solo datos de la tabla ubicaciones)
 *
 * Helper interno para actualizaciones
 *
 * @param id - ID de la ubicación
 * @returns Ubicación o null si no existe
 */
async function _getUbicacionSinRelaciones(id: number): Promise<Ubicacion | null> {
  const pool = getTurnosPool();

  const query = `SELECT * FROM ot_ubicaciones WHERE id = ?`;
  const [rows] = await pool.execute<UbicacionRow[]>(query, [id]);

  return rows.length > 0 ? rows[0] : null;
}
