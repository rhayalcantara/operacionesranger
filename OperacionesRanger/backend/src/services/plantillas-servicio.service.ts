/**
 * Servicio de Plantillas de Servicio
 * Sistema de Gestión de Turnos - OperacionesRanger
 *
 * Implementa la lógica de negocio para la gestión de plantillas de servicio.
 * Las plantillas son configuraciones maestro-detalle reutilizables que agrupan
 * servicios por puesto en una plantilla estándar.
 *
 * Operaciones de escritura (create, update) usan transacciones para garantizar
 * integridad entre header y detalles.
 *
 * @module services/plantillas-servicio.service
 */

import { RowDataPacket, ResultSetHeader } from 'mysql2/promise';
import { getTurnosPool } from '../config/database';
import {
  PlantillaConDetalle,
  PlantillaEnListado,
  PlantillaServicioDetalleConRelaciones,
  CreatePlantillaDTO,
  UpdatePlantillaDTO,
  PlantillaDetalleDTO,
  PlantillaServicio,
} from '../models/plantilla-servicio.model';

// ============================================================================
// INTERFACES PARA QUERIES
// ============================================================================

/**
 * Filtros para listar plantillas de servicio
 */
interface GetPlantillasFilters {
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
 * Obtener lista paginada de plantillas de servicio con filtros
 *
 * Retorna los headers con conteo de detalles.
 *
 * @param filters - Filtros de búsqueda y paginación
 * @returns Lista paginada de plantillas
 *
 * @example
 * const result = await getPlantillas({ page: 1, pageSize: 10, activo: true });
 */
export async function getPlantillas(
  filters: GetPlantillasFilters = {}
): Promise<PaginatedResult<PlantillaEnListado>> {
  const {
    page = 1,
    pageSize = 10,
    search,
    activo,
  } = filters;

  const offset = (page - 1) * pageSize;

  // Construir WHERE
  let whereClause = ' WHERE 1=1';
  const params: any[] = [];

  if (search) {
    whereClause += ` AND (
      ps.nombre LIKE ? OR
      ps.descripcion LIKE ?
    )`;
    const searchPattern = `%${search}%`;
    params.push(searchPattern, searchPattern);
  }

  if (activo !== undefined) {
    whereClause += ` AND ps.activo = ?`;
    params.push(activo);
  }

  // Query para contar total
  const countQuery = `
    SELECT COUNT(*) AS total
    FROM ot_plantillas_servicio ps
    ${whereClause}
  `;
  const [countRows] = await getTurnosPool().query<RowDataPacket[]>(countQuery, params);
  const total = countRows[0]?.total || 0;

  // Query de datos con conteo de detalles
  const dataQuery = `
    SELECT
      ps.*,
      (SELECT COUNT(*) FROM ot_plantillas_servicio_detalle psd WHERE psd.plantilla_id = ps.id) AS detalles_count
    FROM ot_plantillas_servicio ps
    ${whereClause}
    ORDER BY ps.created_at DESC
    LIMIT ? OFFSET ?
  `;
  const dataParams = [...params, Number(pageSize), Number(offset)];
  const [rows] = await getTurnosPool().query<RowDataPacket[]>(dataQuery, dataParams);

  return {
    data: rows as PlantillaEnListado[],
    total,
  };
}

/**
 * Obtener plantilla por ID con todos sus detalles y relaciones
 *
 * Incluye:
 * - Header de la plantilla
 * - Array de detalles con JOINs a puestos (nombre, codigo) y servicios_puesto (tipo_turno)
 *
 * @param id - ID de la plantilla
 * @returns Plantilla completa con detalles o null si no existe
 *
 * @example
 * const plantilla = await getPlantillaById(1);
 * // plantilla.detalles[0].puesto_nombre = "Puesto Central"
 */
export async function getPlantillaById(id: number): Promise<PlantillaConDetalle | null> {
  // 1. Obtener header de la plantilla
  const [headerRows] = await getTurnosPool().query<RowDataPacket[]>(
    'SELECT * FROM ot_plantillas_servicio WHERE id = ?',
    [id]
  );

  if (headerRows.length === 0) {
    return null;
  }

  const plantilla = headerRows[0] as PlantillaServicio;

  // 2. Obtener detalles con JOINs a puestos y servicios_puesto
  const [detalleRows] = await getTurnosPool().query<RowDataPacket[]>(
    `SELECT
      psd.*,
      p.nombre AS puesto_nombre,
      p.codigo AS puesto_codigo,
      sp.tipo_turno AS servicio_tipo_turno
    FROM ot_plantillas_servicio_detalle psd
    INNER JOIN ot_puestos p ON psd.puesto_id = p.id
    INNER JOIN ot_servicios_puesto sp ON psd.servicio_puesto_id = sp.id
    WHERE psd.plantilla_id = ?
    ORDER BY p.nombre ASC, sp.tipo_turno ASC`,
    [id]
  );

  return {
    ...plantilla,
    detalles: detalleRows as PlantillaServicioDetalleConRelaciones[],
  };
}

/**
 * Crear nueva plantilla de servicio con detalles
 *
 * Usa transacción para garantizar integridad:
 * 1. Inserta header de la plantilla
 * 2. Inserta detalles en batch
 *
 * @param data - Datos de la plantilla a crear
 * @param userId - ID del usuario que crea la plantilla
 * @returns Plantilla creada con detalles y relaciones
 *
 * @throws Error si nombre ya existe
 * @throws Error si hay violación de unique constraint en detalles
 */
export async function createPlantilla(
  data: CreatePlantillaDTO,
  userId: number
): Promise<PlantillaConDetalle> {
  // 1. Verificar que nombre no esté duplicado
  const [existingRows] = await getTurnosPool().query<RowDataPacket[]>(
    'SELECT id FROM ot_plantillas_servicio WHERE nombre = ?',
    [data.nombre]
  );

  if (existingRows.length > 0) {
    throw new Error('Ya existe una plantilla con ese nombre');
  }

  // 2. Iniciar transacción
  const conn = await getTurnosPool().getConnection();
  await conn.beginTransaction();

  try {
    // 3. Insertar header de la plantilla
    const [headerResult] = await conn.query(
      `INSERT INTO ot_plantillas_servicio (nombre, descripcion, activo, created_by)
       VALUES (?, ?, true, ?)`,
      [data.nombre, data.descripcion || null, userId]
    ) as any;

    const plantillaId = (headerResult as ResultSetHeader).insertId;

    // 4. Insertar detalles en batch
    if (data.detalles.length > 0) {
      await insertDetalles(conn, plantillaId, data.detalles);
    }

    // 5. Commit
    await conn.commit();

    // 6. Retornar plantilla creada con relaciones
    const plantilla = await getPlantillaById(plantillaId);

    if (!plantilla) {
      throw new Error('Error al recuperar la plantilla creada');
    }

    return plantilla;
  } catch (error) {
    await conn.rollback();
    throw error;
  } finally {
    conn.release();
  }
}

/**
 * Actualizar plantilla de servicio existente
 *
 * Usa transacción para garantizar integridad:
 * 1. Actualiza campos del header si se proporcionan
 * 2. Si detalles se proporcionan: DELETE todos los existentes + INSERT nuevos (replace strategy)
 *
 * @param id - ID de la plantilla a actualizar
 * @param data - Datos a actualizar
 * @param userId - ID del usuario que actualiza
 * @returns Plantilla actualizada con detalles y relaciones
 *
 * @throws Error si plantilla no existe
 * @throws Error si nombre duplicado
 */
export async function updatePlantilla(
  id: number,
  data: UpdatePlantillaDTO,
  _userId: number
): Promise<PlantillaConDetalle> {
  // 1. Verificar que plantilla existe
  const [existingRows] = await getTurnosPool().query<RowDataPacket[]>(
    'SELECT id, activo FROM ot_plantillas_servicio WHERE id = ?',
    [id]
  );

  if (existingRows.length === 0) {
    throw new Error('Plantilla de servicio no encontrada');
  }

  // 2. Si actualiza nombre, verificar unicidad
  if (data.nombre !== undefined) {
    const [dupeRows] = await getTurnosPool().query<RowDataPacket[]>(
      'SELECT id FROM ot_plantillas_servicio WHERE nombre = ? AND id != ?',
      [data.nombre, id]
    );

    if (dupeRows.length > 0) {
      throw new Error('Ya existe otra plantilla con ese nombre');
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
        `UPDATE ot_plantillas_servicio SET ${headerUpdates.join(', ')} WHERE id = ?`,
        headerParams
      );
    }

    // 5. Si detalles proporcionados: replace strategy (DELETE + INSERT)
    if (data.detalles) {
      // Eliminar todos los detalles existentes
      await conn.query(
        'DELETE FROM ot_plantillas_servicio_detalle WHERE plantilla_id = ?',
        [id]
      );

      // Insertar nuevos detalles
      if (data.detalles.length > 0) {
        await insertDetalles(conn, id, data.detalles);
      }
    }

    // 6. Commit
    await conn.commit();

    // 7. Retornar plantilla actualizada
    const plantilla = await getPlantillaById(id);

    if (!plantilla) {
      throw new Error('Error al recuperar la plantilla actualizada');
    }

    return plantilla;
  } catch (error) {
    await conn.rollback();
    throw error;
  } finally {
    conn.release();
  }
}

/**
 * Eliminar plantilla de servicio (soft delete)
 *
 * Marca la plantilla como inactiva (activo = false).
 *
 * @param id - ID de la plantilla a desactivar
 * @returns Mensaje de éxito con ID
 *
 * @throws Error si plantilla no existe
 */
export async function deletePlantilla(
  id: number
): Promise<{ message: string; id: number }> {
  // 1. Verificar que plantilla existe
  const [existingRows] = await getTurnosPool().query<RowDataPacket[]>(
    'SELECT id, activo FROM ot_plantillas_servicio WHERE id = ?',
    [id]
  );

  if (existingRows.length === 0) {
    throw new Error('Plantilla de servicio no encontrada');
  }

  if (!existingRows[0].activo) {
    throw new Error('La plantilla ya está inactiva');
  }

  // 2. Soft delete
  await getTurnosPool().query<ResultSetHeader>(
    'UPDATE ot_plantillas_servicio SET activo = false WHERE id = ?',
    [id]
  );

  return {
    message: 'Plantilla de servicio desactivada',
    id,
  };
}

// ============================================================================
// FUNCIONES AUXILIARES PRIVADAS
// ============================================================================

/**
 * Inserta detalles de plantilla en batch usando una conexión de transacción
 *
 * @param conn - Conexión de BD (dentro de transacción)
 * @param plantillaId - ID de la plantilla padre
 * @param detalles - Array de detalles a insertar
 */
async function insertDetalles(
  conn: any,
  plantillaId: number,
  detalles: PlantillaDetalleDTO[]
): Promise<void> {
  // Construir INSERT con múltiples VALUES para eficiencia
  const values: any[] = [];
  const placeholders: string[] = [];

  for (const detalle of detalles) {
    placeholders.push('(?, ?, ?)');
    values.push(
      plantillaId,
      detalle.puesto_id,
      detalle.servicio_puesto_id
    );
  }

  await conn.query(
    `INSERT INTO ot_plantillas_servicio_detalle (plantilla_id, puesto_id, servicio_puesto_id)
     VALUES ${placeholders.join(', ')}`,
    values
  );
}
