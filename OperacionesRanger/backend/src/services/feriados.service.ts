/**
 * Servicio de lógica de negocio: Feriados
 *
 * Implementa la lógica de negocio para gestión de feriados nacionales y por decreto.
 * Incluye operaciones CRUD y endpoint especial para verificar si una fecha es feriado
 * utilizando el stored procedure sp_verificar_feriado.
 *
 * @module services/feriados.service
 */

import { RowDataPacket, ResultSetHeader } from 'mysql2/promise';
import { getTurnosPool } from '../config/database';
import {
  Feriado,
  FeriadoCreateDTO,
  FeriadoUpdateDTO,
  FeriadoVerificacionResponse,
  FeriadoPaginatedResponse,
  FeriadoFilters,
} from '../models/feriado.model';

/**
 * Obtener todos los feriados con paginación y filtros
 *
 * **Filtros disponibles**:
 * - año: Filtrar feriados de un año específico
 * - tipo: Filtrar por NACIONAL o DECRETO
 *
 * **Paginación**:
 * - page: Número de página (default: 1)
 * - pageSize: Registros por página (default: 10, max: 100)
 *
 * @param filters - Filtros y parámetros de paginación
 * @returns Promise con respuesta paginada de feriados
 *
 * @example
 * ```typescript
 * const resultado = await getAll({ año: 2026, tipo: TipoFeriado.NACIONAL, page: 1, pageSize: 10 });
 * // resultado.data contiene los feriados
 * // resultado.total contiene el total de registros
 * ```
 */
export async function getAll(
  filters: FeriadoFilters
): Promise<FeriadoPaginatedResponse> {
  const pool = getTurnosPool();

  // Valores por defecto
  const page = filters.page || 1;
  const pageSize = filters.pageSize || 10;
  const offset = (page - 1) * pageSize;

  // Construir cláusula WHERE dinámicamente
  const whereClauses: string[] = [];
  const params: any[] = [];

  if (filters.año) {
    whereClauses.push('YEAR(fecha) = ?');
    params.push(filters.año);
  }

  if (filters.tipo) {
    whereClauses.push('tipo = ?');
    params.push(filters.tipo);
  }

  const whereSQL =
    whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

  // Query para contar total de registros
  const countSQL = `SELECT COUNT(*) as total FROM ot_feriados ${whereSQL}`;

  // Query para obtener registros paginados
  const dataSQL = `
    SELECT id, fecha, nombre, tipo, descripcion, created_at
    FROM ot_feriados
    ${whereSQL}
    ORDER BY fecha DESC
    LIMIT ? OFFSET ?
  `;

  try {
    // Ejecutar ambas queries en paralelo
    const [countResult, dataResult] = await Promise.all([
      pool.execute<RowDataPacket[]>(countSQL, params),
      pool.execute<RowDataPacket[]>(dataSQL, [...params, String(pageSize), String(offset)]),
    ]);

    const total = countResult[0][0].total;
    const feriados = dataResult[0] as Feriado[];

    return {
      data: feriados,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    };
  } catch (error) {
    console.error('[FeriadosService] Error en getAll:', error);
    throw new Error('Error al obtener feriados');
  }
}

/**
 * Obtener un feriado por ID
 *
 * @param id - ID del feriado
 * @returns Promise con el feriado o null si no existe
 *
 * @example
 * ```typescript
 * const feriado = await getById(1);
 * if (feriado) {
 *   console.log(feriado.nombre);
 * } else {
 *   console.log('Feriado no encontrado');
 * }
 * ```
 */
export async function getById(id: number): Promise<Feriado | null> {
  const pool = getTurnosPool();

  const sql = `
    SELECT id, fecha, nombre, tipo, descripcion, created_at
    FROM ot_feriados
    WHERE id = ?
  `;

  try {
    const [rows] = await pool.query<RowDataPacket[]>(sql, [id]);

    if (rows.length === 0) {
      return null;
    }

    return rows[0] as Feriado;
  } catch (error) {
    console.error('[FeriadosService] Error en getById:', error);
    throw new Error('Error al obtener feriado por ID');
  }
}

/**
 * Verificar si una fecha es feriado usando stored procedure
 *
 * Utiliza el stored procedure `sp_verificar_feriado` para determinar
 * si una fecha específica es un feriado nacional o por decreto.
 *
 * **Stored Procedure**:
 * ```sql
 * CALL ot_sp_verificar_feriado(
 *   IN p_fecha DATE,
 *   OUT p_es_feriado BOOLEAN,
 *   OUT p_feriado_id INT,
 *   OUT p_tipo_feriado VARCHAR(20)
 * )
 * ```
 *
 * @param fecha - Fecha a verificar (formato YYYY-MM-DD)
 * @returns Promise con información de verificación
 *
 * @example
 * ```typescript
 * const resultado = await verificarFeriado('2026-01-01');
 * if (resultado.es_feriado) {
 *   console.log(`${resultado.fecha} es feriado: ${resultado.feriado?.nombre}`);
 * } else {
 *   console.log(`${resultado.fecha} NO es feriado`);
 * }
 * ```
 */
export async function verificarFeriado(
  fecha: string
): Promise<FeriadoVerificacionResponse> {
  const pool = getTurnosPool();

  try {
    // Llamar al stored procedure
    // Nota: MySQL stored procedures con OUT params requieren dos queries:
    // 1. CALL sp_nombre(@out1, @out2)
    // 2. SELECT @out1, @out2

    await pool.query('CALL ot_sp_verificar_feriado(?, @es_feriado, @feriado_id, @tipo_feriado)', [fecha]);

    const [resultRows] = await pool.query<RowDataPacket[]>(
      'SELECT @es_feriado as es_feriado, @feriado_id as feriado_id, @tipo_feriado as tipo_feriado'
    );

    const result = resultRows[0];

    // Si es feriado, obtener información completa
    if (result.es_feriado && result.feriado_id) {
      const feriado = await getById(result.feriado_id);

      if (feriado) {
        return {
          fecha,
          es_feriado: true,
          feriado: {
            id: feriado.id,
            nombre: feriado.nombre,
            tipo: feriado.tipo,
          },
        };
      }
    }

    // No es feriado
    return {
      fecha,
      es_feriado: false,
      feriado: null,
    };
  } catch (error) {
    console.error('[FeriadosService] Error en verificarFeriado:', error);
    throw new Error('Error al verificar feriado');
  }
}

/**
 * Crear un nuevo feriado
 *
 * **Validaciones**:
 * - Fecha no duplicada (constraint uk_fecha)
 * - Tipo válido (NACIONAL o DECRETO)
 *
 * @param data - Datos del feriado a crear
 * @returns Promise con el feriado creado
 * @throws Error si la fecha ya existe (409 Conflict)
 *
 * @example
 * ```typescript
 * const nuevoFeriado = await create({
 *   fecha: '2026-12-25',
 *   nombre: 'Día de Navidad',
 *   tipo: TipoFeriado.NACIONAL,
 *   descripcion: 'Celebración del nacimiento de Jesucristo'
 * });
 * ```
 */
export async function create(data: FeriadoCreateDTO): Promise<Feriado> {
  const pool = getTurnosPool();

  const sql = `
    INSERT INTO ot_feriados (fecha, nombre, tipo, descripcion)
    VALUES (?, ?, ?, ?)
  `;

  try {
    const [result] = await pool.query<ResultSetHeader>(sql, [
      data.fecha,
      data.nombre,
      data.tipo,
      data.descripcion || null,
    ]);

    const insertedId = result.insertId;

    // Obtener el feriado creado
    const feriadoCreado = await getById(insertedId);

    if (!feriadoCreado) {
      throw new Error('Feriado creado pero no se pudo recuperar');
    }

    console.log(
      `[FeriadosService] Feriado creado: ID ${insertedId}, Fecha: ${data.fecha}, Nombre: ${data.nombre}`
    );

    return feriadoCreado;
  } catch (error: any) {
    console.error('[FeriadosService] Error en create:', error);

    // Error de duplicate key (uk_fecha)
    if (error.code === 'ER_DUP_ENTRY') {
      const err = new Error(`Ya existe un feriado registrado para la fecha ${data.fecha}`);
      (err as any).statusCode = 409; // Conflict
      throw err;
    }

    throw new Error('Error al crear feriado');
  }
}

/**
 * Actualizar un feriado existente
 *
 * **Campos actualizables**:
 * - fecha (puede causar conflicto con uk_fecha)
 * - nombre
 * - tipo
 * - descripcion
 *
 * @param id - ID del feriado a actualizar
 * @param data - Datos a actualizar (campos opcionales)
 * @returns Promise con el feriado actualizado o null si no existe
 * @throws Error si la nueva fecha ya existe (409 Conflict)
 *
 * @example
 * ```typescript
 * const actualizado = await update(1, {
 *   nombre: 'Año Nuevo (actualizado)',
 *   descripcion: 'Primer día del año calendario'
 * });
 * ```
 */
export async function update(
  id: number,
  data: FeriadoUpdateDTO
): Promise<Feriado | null> {
  const pool = getTurnosPool();

  // Verificar que el feriado existe
  const feriadoExistente = await getById(id);
  if (!feriadoExistente) {
    return null;
  }

  // Construir cláusula SET dinámicamente
  const setClauses: string[] = [];
  const params: any[] = [];

  if (data.fecha !== undefined) {
    setClauses.push('fecha = ?');
    params.push(data.fecha);
  }

  if (data.nombre !== undefined) {
    setClauses.push('nombre = ?');
    params.push(data.nombre);
  }

  if (data.tipo !== undefined) {
    setClauses.push('tipo = ?');
    params.push(data.tipo);
  }

  if (data.descripcion !== undefined) {
    setClauses.push('descripcion = ?');
    params.push(data.descripcion);
  }

  // Si no hay campos para actualizar, retornar el feriado sin cambios
  if (setClauses.length === 0) {
    return feriadoExistente;
  }

  const sql = `
    UPDATE ot_feriados
    SET ${setClauses.join(', ')}
    WHERE id = ?
  `;

  params.push(id);

  try {
    await pool.query(sql, params);

    console.log(
      `[FeriadosService] Feriado actualizado: ID ${id}, Campos: ${Object.keys(data).join(', ')}`
    );

    // Obtener el feriado actualizado
    return await getById(id);
  } catch (error: any) {
    console.error('[FeriadosService] Error en update:', error);

    // Error de duplicate key (uk_fecha)
    if (error.code === 'ER_DUP_ENTRY') {
      const err = new Error(`Ya existe un feriado registrado para la fecha ${data.fecha}`);
      (err as any).statusCode = 409; // Conflict
      throw err;
    }

    throw new Error('Error al actualizar feriado');
  }
}

/**
 * Eliminar un feriado (hard delete)
 *
 * **Nota**: Esta operación NO es reversible. El feriado se elimina permanentemente.
 *
 * @param id - ID del feriado a eliminar
 * @returns Promise con true si se eliminó, false si no existía
 *
 * @example
 * ```typescript
 * const eliminado = await deleteFeriado(1);
 * if (eliminado) {
 *   console.log('Feriado eliminado exitosamente');
 * } else {
 *   console.log('Feriado no encontrado');
 * }
 * ```
 */
export async function deleteFeriado(id: number): Promise<boolean> {
  const pool = getTurnosPool();

  // Verificar que el feriado existe antes de eliminar
  const feriadoExistente = await getById(id);
  if (!feriadoExistente) {
    return false;
  }

  const sql = 'DELETE FROM ot_feriados WHERE id = ?';

  try {
    const [result] = await pool.query<ResultSetHeader>(sql, [id]);

    const eliminado = result.affectedRows > 0;

    if (eliminado) {
      console.log(
        `[FeriadosService] Feriado eliminado: ID ${id}, Fecha: ${feriadoExistente.fecha}, Nombre: ${feriadoExistente.nombre}`
      );
    }

    return eliminado;
  } catch (error) {
    console.error('[FeriadosService] Error en delete:', error);
    throw new Error('Error al eliminar feriado');
  }
}
