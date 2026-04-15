/**
 * Servicio de Incentivos por Puesto
 * Sistema de Gestion de Turnos - OperacionesRanger
 *
 * Implementa la logica de negocio para la gestion de incentivos permanentes
 * asignados a puestos. Solo se permite UN incentivo activo por puesto.
 *
 * @module services/incentivos.service
 */

import { RowDataPacket, ResultSetHeader } from 'mysql2/promise';
import { db } from '../config/database';
import {
  Incentivo,
  IncentivoConRelaciones,
  CreateIncentivoDTO,
  UpdateIncentivoDTO
} from '../models/incentivo.model';

// ============================================================================
// INTERFACES PARA QUERIES
// ============================================================================

interface GetIncentivosFilters {
  page?: number;
  pageSize?: number;
  puesto_id?: number;
  activo?: boolean;
  search?: string;
}

interface PaginatedResult<T> {
  data: T[];
  total: number;
}

// ============================================================================
// BASE QUERY
// ============================================================================

const BASE_SELECT = `
  SELECT
    i.*,
    p.codigo AS puesto_codigo,
    p.nombre AS puesto_nombre,
    u.id AS ubicacion_id,
    u.nombre AS ubicacion_nombre,
    c.id AS cliente_id,
    c.nombre AS cliente_nombre
  FROM ot_incentivos_puesto i
  INNER JOIN ot_puestos p ON i.puesto_id = p.id
  INNER JOIN ot_ubicaciones u ON p.ubicacion_id = u.id
  INNER JOIN ot_clientes c ON u.cliente_id = c.id
`;

// ============================================================================
// SERVICIO PRINCIPAL
// ============================================================================

/**
 * Obtener lista paginada de incentivos con filtros
 */
export async function getIncentivos(
  filters: GetIncentivosFilters = {}
): Promise<PaginatedResult<Incentivo>> {
  const {
    page = 1,
    pageSize = 10,
    puesto_id,
    activo,
    search
  } = filters;

  const offset = (page - 1) * pageSize;

  let query = `${BASE_SELECT} WHERE 1=1`;
  const params: any[] = [];

  if (puesto_id) {
    query += ` AND i.puesto_id = ?`;
    params.push(puesto_id);
  }

  if (activo !== undefined) {
    query += ` AND i.activo = ?`;
    params.push(activo ? 1 : 0);
  }

  if (search) {
    query += ` AND (i.concepto LIKE ? OR p.nombre LIKE ? OR p.codigo LIKE ? OR c.nombre LIKE ?)`;
    const searchTerm = `%${search}%`;
    params.push(searchTerm, searchTerm, searchTerm, searchTerm);
  }

  // Query para contar total
  const countQuery = query.replace(
    /SELECT[\s\S]*?FROM/,
    'SELECT COUNT(*) as total FROM'
  );

  const [countRows] = await db.execute<RowDataPacket[]>(countQuery, params);
  const total = countRows[0]?.total || 0;

  // Agregar ordenamiento y paginacion
  query += ` ORDER BY i.activo DESC, c.nombre ASC, u.nombre ASC, p.nombre ASC LIMIT ? OFFSET ?`;
  const dataParams = [...params, String(pageSize), String(offset)];

  const [rows] = await db.execute<RowDataPacket[]>(query, dataParams);

  return {
    data: rows as Incentivo[],
    total
  };
}

/**
 * Obtener incentivo por ID con relaciones completas
 */
export async function getIncentivoById(id: number): Promise<IncentivoConRelaciones | null> {
  const query = `${BASE_SELECT} WHERE i.id = ?`;

  const [rows] = await db.query<RowDataPacket[]>(query, [id]);

  if (rows.length === 0) {
    return null;
  }

  return rows[0] as IncentivoConRelaciones;
}

/**
 * Obtener el incentivo activo para un puesto especifico
 */
export async function getIncentivoActivoPorPuesto(puesto_id: number): Promise<IncentivoConRelaciones | null> {
  const query = `${BASE_SELECT} WHERE i.puesto_id = ? AND i.activo = 1`;

  const [rows] = await db.query<RowDataPacket[]>(query, [puesto_id]);

  if (rows.length === 0) {
    return null;
  }

  return rows[0] as IncentivoConRelaciones;
}

/**
 * Obtener todos los incentivos activos (para calculo de turnos)
 */
export async function getIncentivosActivos(): Promise<Incentivo[]> {
  const query = `
    ${BASE_SELECT}
    WHERE i.activo = 1 AND p.activo = TRUE
    ORDER BY i.puesto_id
  `;

  const [rows] = await db.query<RowDataPacket[]>(query);

  return rows as Incentivo[];
}

/**
 * Crear nuevo incentivo
 *
 * Validaciones:
 * - puesto_id debe existir y estar activo
 * - NO debe existir ya un incentivo para el mismo puesto
 * - valor_hora se calcula automaticamente por GENERATED column (monto / 360)
 */
export async function createIncentivo(
  data: CreateIncentivoDTO
): Promise<IncentivoConRelaciones> {
  // 1. Validar que puesto_id existe y esta activo
  const [puestoRows] = await db.query<RowDataPacket[]>(
    'SELECT id, activo FROM ot_puestos WHERE id = ?',
    [data.puesto_id]
  );

  if (puestoRows.length === 0) {
    throw new Error('Puesto no encontrado');
  }

  if (!puestoRows[0].activo) {
    throw new Error('El puesto no esta activo');
  }

  // 2. Verificar que NO exista ya un incentivo para este puesto
  const [existingRows] = await db.query<RowDataPacket[]>(
    'SELECT id FROM ot_incentivos_puesto WHERE puesto_id = ?',
    [data.puesto_id]
  );

  if (existingRows.length > 0) {
    throw new Error('Ya existe un incentivo para este puesto');
  }

  // 3. Insertar incentivo
  // IMPORTANTE: NO incluir valor_hora en INSERT, es GENERATED column
  const [result] = await db.query<ResultSetHeader>(
    `INSERT INTO ot_incentivos_puesto (
      puesto_id, monto, concepto, activo, created_by
    ) VALUES (?, ?, ?, ?, ?)`,
    [
      data.puesto_id,
      data.monto,
      data.concepto || null,
      data.activo !== undefined ? (data.activo ? 1 : 0) : 1,
      null // created_by can be set from auth context if needed
    ]
  );

  const insertedId = result.insertId;

  // 4. Retornar incentivo creado con relaciones
  const createdIncentivo = await getIncentivoById(insertedId);

  if (!createdIncentivo) {
    throw new Error('Error al recuperar el incentivo creado');
  }

  return createdIncentivo;
}

/**
 * Actualizar incentivo existente
 *
 * Nota: puesto_id NO se puede cambiar
 * valor_hora se recalcula automaticamente si se actualiza monto
 */
export async function updateIncentivo(
  id: number,
  data: UpdateIncentivoDTO
): Promise<IncentivoConRelaciones> {
  // 1. Verificar que incentivo existe
  const existingIncentivo = await getIncentivoById(id);
  if (!existingIncentivo) {
    throw new Error('Incentivo no encontrado');
  }

  // 2. Construir campos a actualizar
  const fields: string[] = [];
  const values: any[] = [];

  if (data.monto !== undefined) {
    fields.push('monto = ?');
    values.push(data.monto);
  }

  if (data.concepto !== undefined) {
    fields.push('concepto = ?');
    values.push(data.concepto);
  }

  if (data.activo !== undefined) {
    fields.push('activo = ?');
    values.push(data.activo ? 1 : 0);
  }

  if (fields.length === 0) {
    return existingIncentivo;
  }

  // 3. Ejecutar UPDATE
  await db.query(
    `UPDATE ot_incentivos_puesto SET ${fields.join(', ')} WHERE id = ?`,
    [...values, id]
  );

  // 4. Retornar incentivo actualizado con relaciones
  const updatedIncentivo = await getIncentivoById(id);

  if (!updatedIncentivo) {
    throw new Error('Error al recuperar el incentivo actualizado');
  }

  return updatedIncentivo;
}

/**
 * Eliminar incentivo (soft delete: activo = false)
 */
export async function deleteIncentivo(id: number): Promise<{ message: string; id: number }> {
  // 1. Verificar que incentivo existe
  const existingIncentivo = await getIncentivoById(id);
  if (!existingIncentivo) {
    throw new Error('Incentivo no encontrado');
  }

  // 2. Soft delete: set activo = 0
  await db.query('UPDATE ot_incentivos_puesto SET activo = 0 WHERE id = ?', [id]);

  return {
    message: 'Incentivo desactivado',
    id
  };
}

// ============================================================================
// FUNCIONES AUXILIARES
// ============================================================================

/**
 * Verificar si un incentivo existe
 */
export async function incentivoExists(id: number): Promise<boolean> {
  const [rows] = await db.query<RowDataPacket[]>(
    'SELECT id FROM ot_incentivos_puesto WHERE id = ?',
    [id]
  );

  return rows.length > 0;
}
