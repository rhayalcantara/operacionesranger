/**
 * Servicio de Cronogramas
 * Sistema de Gestión de Turnos - OperacionesRanger
 *
 * Implementa la lógica de negocio para la gestión de cronogramas semanales.
 * Maneja operaciones CRUD con validación de regla de día libre por empleado,
 * transacciones para integridad de datos y JOINs a BD RRHH para nombres.
 *
 * REGLA DE NEGOCIO CLAVE:
 * Cada empleado debe tener al menos 1 día libre por semana.
 * Es decir, un empleado puede aparecer en máximo 6 de 7 días.
 *
 * @module services/cronogramas.service
 */

import { RowDataPacket, ResultSetHeader } from 'mysql2/promise';
import { getTurnosPool } from '../config/database';
import {
  Cronograma,
  CronogramaConDetalle,
  CronogramaDetalleConRelaciones,
  CronogramaEnListado,
  CreateCronogramaDTO,
  CreateCronogramaDetalleDTO,
  UpdateCronogramaDTO,
  validarDiaLibre,
} from '../models/cronograma.model';

// ============================================================================
// INTERFACES PARA QUERIES
// ============================================================================

/**
 * Filtros para listar cronogramas
 */
interface GetCronogramasFilters {
  page?: number;
  pageSize?: number;
  search?: string;
  activo?: boolean;
}

/**
 * Resultado paginado genérico
 */
interface PaginatedResult<T> {
  data: T[];
  total: number;
}

// ============================================================================
// SERVICIO PRINCIPAL
// ============================================================================

/**
 * Obtener lista paginada de cronogramas con filtros
 *
 * Retorna los cronogramas (header) con conteo de detalles.
 *
 * @param filters - Filtros de búsqueda y paginación
 * @returns Lista paginada de cronogramas
 *
 * @example
 * const result = await getCronogramas({ page: 1, pageSize: 10, activo: true });
 */
export async function getCronogramas(
  filters: GetCronogramasFilters = {}
): Promise<PaginatedResult<CronogramaEnListado>> {
  const {
    page = 1,
    pageSize = 10,
    search,
    activo,
  } = filters;

  const offset = (page - 1) * pageSize;

  // Construir query base
  let query = `
    SELECT
      c.*,
      (SELECT COUNT(*) FROM ot_cronogramas_detalle cd WHERE cd.cronograma_id = c.id) AS detalles_count
    FROM ot_cronogramas c
    WHERE 1=1
  `;

  const params: any[] = [];

  // Aplicar filtros
  if (search) {
    query += ` AND (
      c.nombre LIKE ? OR
      c.descripcion LIKE ?
    )`;
    const searchPattern = `%${search}%`;
    params.push(searchPattern, searchPattern);
  }

  if (activo !== undefined) {
    query += ` AND c.activo = ?`;
    params.push(activo);
  }

  // Query para contar total
  const countQuery = `
    SELECT COUNT(*) as total
    FROM ot_cronogramas c
    WHERE 1=1
    ${search ? ` AND (c.nombre LIKE ? OR c.descripcion LIKE ?)` : ''}
    ${activo !== undefined ? ` AND c.activo = ?` : ''}
  `;

  // Ejecutar query de conteo
  const [countRows] = await getTurnosPool().query<RowDataPacket[]>(countQuery, params);
  const total = countRows[0]?.total || 0;

  // Agregar ordenamiento y paginación
  query += ` ORDER BY c.created_at DESC LIMIT ? OFFSET ?`;
  params.push(Number(pageSize), Number(offset));

  // Ejecutar query de datos
  const [rows] = await getTurnosPool().query<RowDataPacket[]>(query, params);

  return {
    data: rows as CronogramaEnListado[],
    total,
  };
}

/**
 * Obtener cronograma por ID con todos sus detalles y relaciones
 *
 * Incluye:
 * - Header del cronograma
 * - Array de detalles con JOINs a puestos (nombre, codigo) y rh_empleado (nombre completo)
 *
 * @param id - ID del cronograma
 * @returns Cronograma completo con detalles o null si no existe
 *
 * @example
 * const cronograma = await getCronogramaById(1);
 * // cronograma.detalles[0].empleado_nombre = "Juan Pérez"
 */
export async function getCronogramaById(id: number): Promise<CronogramaConDetalle | null> {
  // 1. Obtener header del cronograma
  const [headerRows] = await getTurnosPool().query<RowDataPacket[]>(
    'SELECT * FROM ot_cronogramas WHERE id = ?',
    [id]
  );

  if (headerRows.length === 0) {
    return null;
  }

  const cronograma = headerRows[0] as Cronograma;

  // 2. Obtener detalles con JOIN a puestos
  const [detalleRows] = await getTurnosPool().query<RowDataPacket[]>(
    `SELECT
      cd.*,
      p.codigo AS puesto_codigo,
      p.nombre AS puesto_nombre
    FROM ot_cronogramas_detalle cd
    INNER JOIN ot_puestos p ON cd.puesto_id = p.id
    WHERE cd.cronograma_id = ?
    ORDER BY cd.dia_semana ASC, cd.puesto_id ASC`,
    [id]
  );

  // 3. Obtener nombres de empleados desde BD RRHH
  const empleadoIds = [...new Set(detalleRows.map(d => d.empleado_id))];

  let empleadoNombres = new Map<number, string>();

  if (empleadoIds.length > 0) {
    const placeholders = empleadoIds.map(() => '?').join(',');
    const [empRows] = await getTurnosPool().query<RowDataPacket[]>(
      `SELECT id_empleado, CONCAT(nombres, ' ', apellidos) AS nombre_completo
       FROM rh_empleado
       WHERE id_empleado IN (${placeholders})`,
      empleadoIds
    );

    for (const emp of empRows) {
      empleadoNombres.set(emp.id_empleado, emp.nombre_completo);
    }
  }

  // 4. Combinar detalles con nombres de empleados
  const detalles: CronogramaDetalleConRelaciones[] = detalleRows.map(d => ({
    ...d,
    empleado_nombre: empleadoNombres.get(d.empleado_id) || `Empleado #${d.empleado_id}`,
  })) as CronogramaDetalleConRelaciones[];

  return {
    ...cronograma,
    detalles,
  };
}

/**
 * Crear nuevo cronograma con detalles
 *
 * Usa transacción para garantizar integridad:
 * 1. Inserta header del cronograma
 * 2. Valida regla de día libre
 * 3. Inserta detalles en batch
 *
 * @param data - Datos del cronograma a crear
 * @param userId - ID del usuario que crea el cronograma
 * @returns Cronograma creado con detalles y relaciones
 *
 * @throws Error si algún empleado no tiene día libre (trabaja 7 días)
 * @throws Error si hay violación de unique constraint (empleado+día duplicado)
 */
export async function createCronograma(
  data: CreateCronogramaDTO,
  userId: number
): Promise<CronogramaConDetalle> {
  // 1. Validar regla de día libre ANTES de la transacción
  const empleadosSinDiaLibre = validarDiaLibre(data.detalles);

  if (empleadosSinDiaLibre.length > 0) {
    // Obtener nombres de los empleados para mensaje descriptivo
    const nombres = await obtenerNombresEmpleados(empleadosSinDiaLibre);
    const listaEmpleados = empleadosSinDiaLibre
      .map(id => nombres.get(id) || `Empleado #${id}`)
      .join(', ');

    throw new Error(
      `Los siguientes empleados están asignados los 7 días de la semana sin día libre: ${listaEmpleados}. ` +
      `Cada empleado debe tener al menos 1 día libre por semana (máximo 6 días de trabajo).`
    );
  }

  // 2. Iniciar transacción
  const conn = await getTurnosPool().getConnection();
  await conn.beginTransaction();

  try {
    // 3. Insertar header del cronograma
    const [headerResult] = await conn.query(
      `INSERT INTO ot_cronogramas (nombre, descripcion, activo, created_by)
       VALUES (?, ?, true, ?)`,
      [data.nombre, data.descripcion || null, userId]
    ) as any;

    const cronogramaId = (headerResult as ResultSetHeader).insertId;

    // 4. Insertar detalles en batch
    if (data.detalles.length > 0) {
      await insertDetalles(conn, cronogramaId, data.detalles);
    }

    // 5. Commit
    await conn.commit();

    // 6. Retornar cronograma creado con relaciones
    const cronograma = await getCronogramaById(cronogramaId);

    if (!cronograma) {
      throw new Error('Error al recuperar el cronograma creado');
    }

    return cronograma;
  } catch (error) {
    await conn.rollback();
    throw error;
  } finally {
    conn.release();
  }
}

/**
 * Actualizar cronograma existente
 *
 * Usa transacción para garantizar integridad:
 * 1. Actualiza campos del header si se proporcionan
 * 2. Si detalles se proporcionan: DELETE todos los existentes + INSERT nuevos (replace strategy)
 *
 * @param id - ID del cronograma a actualizar
 * @param data - Datos a actualizar
 * @param userId - ID del usuario que actualiza
 * @returns Cronograma actualizado con detalles y relaciones
 *
 * @throws Error si cronograma no existe
 * @throws Error si cronograma no está activo
 * @throws Error si algún empleado no tiene día libre
 */
export async function updateCronograma(
  id: number,
  data: UpdateCronogramaDTO,
  _userId: number
): Promise<CronogramaConDetalle> {
  // 1. Verificar que cronograma existe y está activo
  const [existingRows] = await getTurnosPool().query<RowDataPacket[]>(
    'SELECT id, activo FROM ot_cronogramas WHERE id = ?',
    [id]
  );

  if (existingRows.length === 0) {
    throw new Error('Cronograma no encontrado');
  }

  if (!existingRows[0].activo) {
    throw new Error('No se puede modificar un cronograma inactivo');
  }

  // 2. Validar regla de día libre si se proporcionan detalles
  if (data.detalles) {
    const empleadosSinDiaLibre = validarDiaLibre(data.detalles);

    if (empleadosSinDiaLibre.length > 0) {
      const nombres = await obtenerNombresEmpleados(empleadosSinDiaLibre);
      const listaEmpleados = empleadosSinDiaLibre
        .map(id => nombres.get(id) || `Empleado #${id}`)
        .join(', ');

      throw new Error(
        `Los siguientes empleados están asignados los 7 días de la semana sin día libre: ${listaEmpleados}. ` +
        `Cada empleado debe tener al menos 1 día libre por semana (máximo 6 días de trabajo).`
      );
    }
  }

  // 3. Iniciar transacción
  const conn = await getTurnosPool().getConnection();
  await conn.beginTransaction();

  try {
    // 4. Actualizar header si hay campos para actualizar
    const headerUpdates: string[] = [];
    const headerParams: any[] = [];

    if (data.nombre !== undefined) {
      headerUpdates.push('nombre = ?');
      headerParams.push(data.nombre);
    }

    if (data.descripcion !== undefined) {
      headerUpdates.push('descripcion = ?');
      headerParams.push(data.descripcion);
    }

    if (headerUpdates.length > 0) {
      headerParams.push(id);
      await conn.query(
        `UPDATE ot_cronogramas SET ${headerUpdates.join(', ')} WHERE id = ?`,
        headerParams
      );
    }

    // 5. Si detalles proporcionados: replace strategy (DELETE + INSERT)
    if (data.detalles) {
      // Eliminar todos los detalles existentes
      await conn.query(
        'DELETE FROM ot_cronogramas_detalle WHERE cronograma_id = ?',
        [id]
      );

      // Insertar nuevos detalles
      if (data.detalles.length > 0) {
        await insertDetalles(conn, id, data.detalles);
      }
    }

    // 6. Commit
    await conn.commit();

    // 7. Retornar cronograma actualizado
    const cronograma = await getCronogramaById(id);

    if (!cronograma) {
      throw new Error('Error al recuperar el cronograma actualizado');
    }

    return cronograma;
  } catch (error) {
    await conn.rollback();
    throw error;
  } finally {
    conn.release();
  }
}

/**
 * Eliminar cronograma (soft delete)
 *
 * Marca el cronograma como inactivo (activo = false).
 * Los detalles se mantienen en la BD pero no son accesibles
 * a través de la API cuando el cronograma está inactivo.
 *
 * @param id - ID del cronograma a desactivar
 * @returns Mensaje de éxito con ID
 *
 * @throws Error si cronograma no existe
 * @throws Error si cronograma ya está inactivo
 */
export async function deleteCronograma(
  id: number
): Promise<{ message: string; id: number }> {
  // 1. Verificar que cronograma existe
  const [existingRows] = await getTurnosPool().query<RowDataPacket[]>(
    'SELECT id, activo FROM ot_cronogramas WHERE id = ?',
    [id]
  );

  if (existingRows.length === 0) {
    throw new Error('Cronograma no encontrado');
  }

  if (!existingRows[0].activo) {
    throw new Error('El cronograma ya está inactivo');
  }

  // 2. Soft delete
  await getTurnosPool().query<ResultSetHeader>(
    'UPDATE ot_cronogramas SET activo = false WHERE id = ?',
    [id]
  );

  return {
    message: 'Cronograma desactivado',
    id,
  };
}

// ============================================================================
// FUNCIONES AUXILIARES PRIVADAS
// ============================================================================

/**
 * Inserta detalles de cronograma en batch usando una conexión de transacción
 *
 * @param conn - Conexión de BD (dentro de transacción)
 * @param cronogramaId - ID del cronograma padre
 * @param detalles - Array de detalles a insertar
 */
async function insertDetalles(
  conn: any,
  cronogramaId: number,
  detalles: CreateCronogramaDetalleDTO[]
): Promise<void> {
  // Construir INSERT con múltiples VALUES para eficiencia
  const values: any[] = [];
  const placeholders: string[] = [];

  for (const detalle of detalles) {
    placeholders.push('(?, ?, ?, ?, ?)');
    values.push(
      cronogramaId,
      detalle.dia_semana,
      detalle.puesto_id,
      detalle.empleado_id,
      detalle.tipo_turno
    );
  }

  await conn.query(
    `INSERT INTO ot_cronogramas_detalle (cronograma_id, dia_semana, puesto_id, empleado_id, tipo_turno)
     VALUES ${placeholders.join(', ')}`,
    values
  );
}

/**
 * Obtiene nombres de empleados desde BD RRHH
 *
 * @param empleadoIds - Array de IDs de empleados
 * @returns Map de empleado_id → nombre completo
 */
async function obtenerNombresEmpleados(
  empleadoIds: number[]
): Promise<Map<number, string>> {
  const nombres = new Map<number, string>();

  if (empleadoIds.length === 0) {
    return nombres;
  }

  const placeholders = empleadoIds.map(() => '?').join(',');
  const [rows] = await getTurnosPool().query<RowDataPacket[]>(
    `SELECT id_empleado, CONCAT(nombres, ' ', apellidos) AS nombre_completo
     FROM rh_empleado
     WHERE id_empleado IN (${placeholders})`,
    empleadoIds
  );

  for (const row of rows) {
    nombres.set(row.id_empleado, row.nombre_completo);
  }

  return nombres;
}
