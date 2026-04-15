/**
 * Servicio de Clientes
 * Sistema de Gestión de Turnos - OperacionesRanger
 *
 * Proporciona lógica de negocio para:
 * - Listar clientes con paginación y búsqueda
 * - Obtener cliente por ID
 * - Crear nuevos clientes
 * - Actualizar clientes existentes
 * - Eliminar clientes (soft delete) con validaciones
 *
 * @module services/clientes.service
 */

import { RowDataPacket, ResultSetHeader } from 'mysql2/promise';
import { getTurnosPool } from '../config/database';
import {
  Cliente,
  CreateClienteDTO,
  UpdateClienteDTO,
  PaginatedClientesDTO,
  ClienteConUbicaciones,
  dtoToNuevoClienteDB,
  normalizeRNC
} from '../models/cliente.model';

// ============================================================================
// TIPOS INTERNOS
// ============================================================================

interface ClienteRow extends RowDataPacket, Cliente {}

interface ClienteConUbicacionesRow extends RowDataPacket, ClienteConUbicaciones {}

interface CountRow extends RowDataPacket {
  count: number;
}

// ============================================================================
// FUNCIONES PRINCIPALES
// ============================================================================

/**
 * Obtiene lista paginada de clientes con búsqueda opcional
 *
 * Búsqueda por:
 * - Nombre del cliente (LIKE %search%)
 * - Código del cliente (LIKE %search%)
 * - RNC (LIKE %search%)
 *
 * @param page - Número de página (1-indexed)
 * @param pageSize - Cantidad de registros por página
 * @param search - Término de búsqueda opcional
 * @param activo - Filtro por estado activo/inactivo (opcional)
 * @returns Datos paginados de clientes
 *
 * @example
 * const result = await getClientes(1, 20, 'banco', true);
 * // { data: [...], total: 5, page: 1, pageSize: 20, totalPages: 1 }
 */
export async function getClientes(
  page: number = 1,
  pageSize: number = 20,
  search?: string,
  activo?: boolean
): Promise<PaginatedClientesDTO> {
  const pool = getTurnosPool();

  // Calcular offset para paginación
  const offset = (page - 1) * pageSize;

  // Construir WHERE clause para búsqueda y filtro activo
  let whereClause = '';
  const queryParams: any[] = [];

  // Filtro de búsqueda
  if (search && search.trim() !== '') {
    const searchTerm = `%${search.trim()}%`;
    whereClause = `
      WHERE (nombre LIKE ?
         OR codigo LIKE ?
         OR rnc LIKE ?)
    `;
    queryParams.push(searchTerm, searchTerm, searchTerm);
  }

  // Filtro por activo
  if (activo !== undefined) {
    if (whereClause) {
      whereClause += ' AND activo = ?';
    } else {
      whereClause = ' WHERE activo = ?';
    }
    queryParams.push(activo);
  }

  // Query para obtener total de registros
  const countQuery = `
    SELECT COUNT(*) as count
    FROM ot_clientes
    ${whereClause}
  `;

  const [countRows] = await pool.execute<CountRow[]>(countQuery, queryParams);
  const total = countRows[0].count;

  // Query para obtener registros paginados
  const dataQuery = `
    SELECT *
    FROM ot_clientes
    ${whereClause}
    ORDER BY nombre ASC
    LIMIT ? OFFSET ?
  `;

  const [dataRows] = await pool.execute<ClienteRow[]>(
    dataQuery,
    [...queryParams, String(pageSize), String(offset)]
  );

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
 * Obtiene un cliente por su ID con información adicional
 *
 * Incluye:
 * - Datos completos del cliente
 * - Cantidad de ubicaciones activas
 *
 * @param id - ID del cliente
 * @returns Cliente con información adicional
 * @throws Error si cliente no existe
 *
 * @example
 * const cliente = await getClienteById(42);
 * // { id: 42, nombre: 'Banco Popular', ubicaciones_count: 5, ... }
 */
export async function getClienteById(id: number): Promise<ClienteConUbicaciones> {
  const pool = getTurnosPool();

  // Query para obtener cliente con count de ubicaciones
  const query = `
    SELECT
      c.*,
      COALESCE(COUNT(u.id), 0) as ubicaciones_count
    FROM ot_clientes c
    LEFT JOIN ot_ubicaciones u ON c.id = u.cliente_id AND u.activo = TRUE
    WHERE c.id = ?
    GROUP BY c.id
  `;

  const [rows] = await pool.execute<ClienteConUbicacionesRow[]>(query, [id]);

  if (rows.length === 0) {
    throw new Error(`Cliente con ID ${id} no encontrado`);
  }

  return rows[0];
}

/**
 * Crea un nuevo cliente
 *
 * Validaciones:
 * - Código debe ser único
 * - RNC debe ser único (si se provee)
 *
 * @param data - Datos del nuevo cliente
 * @returns Cliente creado con ID asignado
 * @throws Error si código o RNC duplicados
 *
 * @example
 * const cliente = await createCliente({
 *   codigo: 'BANCO01',
 *   nombre: 'Banco Popular',
 *   rnc: '123456789',
 *   email: 'contacto@bancopopular.com.do'
 * });
 */
export async function createCliente(data: CreateClienteDTO): Promise<Cliente> {
  const pool = getTurnosPool();

  // 1. Validar que código sea único
  const [codigoRows] = await pool.execute<ClienteRow[]>(
    'SELECT id FROM ot_clientes WHERE codigo = ?',
    [data.codigo]
  );

  if (codigoRows.length > 0) {
    throw new Error(`Ya existe un cliente con el código "${data.codigo}"`);
  }

  // 2. Validar que RNC sea único (si se provee)
  if (data.rnc) {
    const rncNormalizado = normalizeRNC(data.rnc);

    const [rncRows] = await pool.execute<ClienteRow[]>(
      'SELECT id FROM ot_clientes WHERE rnc = ?',
      [rncNormalizado]
    );

    if (rncRows.length > 0) {
      throw new Error(`Ya existe un cliente con el RNC "${data.rnc}"`);
    }
  }

  // 3. Preparar datos para INSERT
  const nuevoCliente = dtoToNuevoClienteDB(data);

  // Normalizar RNC si existe
  if (nuevoCliente.rnc) {
    nuevoCliente.rnc = normalizeRNC(nuevoCliente.rnc);
  }

  // 4. INSERT en base de datos
  const insertQuery = `
    INSERT INTO ot_clientes
    (codigo, nombre, rnc, telefono, email, direccion, contacto_nombre, contacto_telefono, activo)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;

  const [result] = await pool.execute<ResultSetHeader>(insertQuery, [
    nuevoCliente.codigo,
    nuevoCliente.nombre,
    nuevoCliente.rnc,
    nuevoCliente.telefono,
    nuevoCliente.email,
    nuevoCliente.direccion,
    nuevoCliente.contacto_nombre,
    nuevoCliente.contacto_telefono,
    nuevoCliente.activo
  ]);

  // 5. Obtener cliente creado con ID
  const clienteId = result.insertId;

  const [clienteRows] = await pool.execute<ClienteRow[]>(
    'SELECT * FROM ot_clientes WHERE id = ?',
    [clienteId]
  );

  return clienteRows[0];
}

/**
 * Actualiza un cliente existente
 *
 * Validaciones:
 * - Cliente debe existir
 * - Si se cambia código, debe ser único
 * - Si se cambia RNC, debe ser único
 *
 * @param id - ID del cliente a actualizar
 * @param data - Datos a actualizar (campos opcionales)
 * @returns Cliente actualizado
 * @throws Error si cliente no existe o validaciones fallan
 *
 * @example
 * const cliente = await updateCliente(42, {
 *   email: 'nuevo@email.com',
 *   telefono: '809-555-1234'
 * });
 */
export async function updateCliente(id: number, data: UpdateClienteDTO): Promise<Cliente> {
  const pool = getTurnosPool();

  // 1. Verificar que cliente existe
  const [existingRows] = await pool.execute<ClienteRow[]>(
    'SELECT * FROM ot_clientes WHERE id = ?',
    [id]
  );

  if (existingRows.length === 0) {
    throw new Error(`Cliente con ID ${id} no encontrado`);
  }

  // 2. Validar código único (si se está cambiando)
  if (data.codigo) {
    const [codigoRows] = await pool.execute<ClienteRow[]>(
      'SELECT id FROM ot_clientes WHERE codigo = ? AND id != ?',
      [data.codigo, id]
    );

    if (codigoRows.length > 0) {
      throw new Error(`Ya existe otro cliente con el código "${data.codigo}"`);
    }
  }

  // 3. Validar RNC único (si se está cambiando)
  if (data.rnc) {
    const rncNormalizado = normalizeRNC(data.rnc);

    const [rncRows] = await pool.execute<ClienteRow[]>(
      'SELECT id FROM ot_clientes WHERE rnc = ? AND id != ?',
      [rncNormalizado, id]
    );

    if (rncRows.length > 0) {
      throw new Error(`Ya existe otro cliente con el RNC "${data.rnc}"`);
    }

    // Normalizar RNC
    data.rnc = rncNormalizado;
  }

  // 4. Construir query UPDATE dinámicamente
  const updateFields: string[] = [];
  const updateValues: any[] = [];

  if (data.codigo !== undefined) {
    updateFields.push('codigo = ?');
    updateValues.push(data.codigo);
  }

  if (data.nombre !== undefined) {
    updateFields.push('nombre = ?');
    updateValues.push(data.nombre);
  }

  if (data.rnc !== undefined) {
    updateFields.push('rnc = ?');
    updateValues.push(data.rnc);
  }

  if (data.telefono !== undefined) {
    updateFields.push('telefono = ?');
    updateValues.push(data.telefono);
  }

  if (data.email !== undefined) {
    updateFields.push('email = ?');
    updateValues.push(data.email);
  }

  if (data.direccion !== undefined) {
    updateFields.push('direccion = ?');
    updateValues.push(data.direccion);
  }

  if (data.contacto_nombre !== undefined) {
    updateFields.push('contacto_nombre = ?');
    updateValues.push(data.contacto_nombre);
  }

  if (data.contacto_telefono !== undefined) {
    updateFields.push('contacto_telefono = ?');
    updateValues.push(data.contacto_telefono);
  }

  if (data.activo !== undefined) {
    updateFields.push('activo = ?');
    updateValues.push(data.activo);
  }

  // Si no hay campos para actualizar, retornar cliente sin cambios
  if (updateFields.length === 0) {
    return existingRows[0];
  }

  // Agregar updated_at
  updateFields.push('updated_at = NOW()');

  // 5. Ejecutar UPDATE
  const updateQuery = `
    UPDATE ot_clientes
    SET ${updateFields.join(', ')}
    WHERE id = ?
  `;

  await pool.execute(updateQuery, [...updateValues, id]);

  // 6. Obtener cliente actualizado
  const [updatedRows] = await pool.execute<ClienteRow[]>(
    'SELECT * FROM ot_clientes WHERE id = ?',
    [id]
  );

  return updatedRows[0];
}

/**
 * Elimina un cliente (soft delete)
 *
 * Validaciones:
 * - Cliente debe existir
 * - Cliente NO debe tener ubicaciones activas
 *
 * Acción: Marca el cliente como inactivo (activo = FALSE)
 *
 * @param id - ID del cliente a eliminar
 * @throws Error si cliente no existe o tiene ubicaciones activas
 *
 * @example
 * await deleteCliente(42);
 * // Cliente marcado como inactivo
 */
export async function deleteCliente(id: number): Promise<void> {
  const pool = getTurnosPool();

  // 1. Verificar que cliente existe
  const [existingRows] = await pool.execute<ClienteRow[]>(
    'SELECT * FROM ot_clientes WHERE id = ?',
    [id]
  );

  if (existingRows.length === 0) {
    throw new Error(`Cliente con ID ${id} no encontrado`);
  }

  // 2. Verificar que NO tenga ubicaciones activas
  const [ubicacionesRows] = await pool.execute<CountRow[]>(
    'SELECT COUNT(*) as count FROM ot_ubicaciones WHERE cliente_id = ? AND activo = TRUE',
    [id]
  );

  const ubicacionesActivas = ubicacionesRows[0].count;

  if (ubicacionesActivas > 0) {
    throw new Error(
      `No se puede eliminar el cliente porque tiene ${ubicacionesActivas} ubicación(es) activa(s). ` +
      `Desactive las ubicaciones primero.`
    );
  }

  // 3. Soft delete: marcar como inactivo
  await pool.execute(
    'UPDATE ot_clientes SET activo = FALSE, updated_at = NOW() WHERE id = ?',
    [id]
  );
}

// ============================================================================
// FUNCIONES DE VALIDACIÓN
// ============================================================================

/**
 * Verifica si un código de cliente ya existe
 *
 * @param codigo - Código a verificar
 * @param excludeId - ID de cliente a excluir (para updates)
 * @returns true si existe, false si no existe
 */
export async function codigoExists(codigo: string, excludeId?: number): Promise<boolean> {
  const pool = getTurnosPool();

  let query = 'SELECT id FROM ot_clientes WHERE codigo = ?';
  const params: any[] = [codigo];

  if (excludeId) {
    query += ' AND id != ?';
    params.push(excludeId);
  }

  const [rows] = await pool.execute<ClienteRow[]>(query, params);

  return rows.length > 0;
}

/**
 * Verifica si un RNC ya existe
 *
 * @param rnc - RNC a verificar (se normaliza automáticamente)
 * @param excludeId - ID de cliente a excluir (para updates)
 * @returns true si existe, false si no existe
 */
export async function rncExists(rnc: string, excludeId?: number): Promise<boolean> {
  const pool = getTurnosPool();

  const rncNormalizado = normalizeRNC(rnc);

  let query = 'SELECT id FROM ot_clientes WHERE rnc = ?';
  const params: any[] = [rncNormalizado];

  if (excludeId) {
    query += ' AND id != ?';
    params.push(excludeId);
  }

  const [rows] = await pool.execute<ClienteRow[]>(query, params);

  return rows.length > 0;
}

/**
 * Verifica si un cliente tiene ubicaciones activas
 *
 * @param clienteId - ID del cliente
 * @returns Cantidad de ubicaciones activas
 */
export async function countUbicacionesActivas(clienteId: number): Promise<number> {
  const pool = getTurnosPool();

  const [rows] = await pool.execute<CountRow[]>(
    'SELECT COUNT(*) as count FROM ot_ubicaciones WHERE cliente_id = ? AND activo = TRUE',
    [clienteId]
  );

  return rows[0].count;
}
