/**
 * Servicio de Diario de Puesto
 * Sistema de Gestión de Turnos - OperacionesRanger
 *
 * Implementa la lógica de negocio para la gestión de registros diarios
 * de asistencia de empleados en puestos de seguridad. Incluye operaciones
 * CRUD estándar y una función especial para poblar registros automáticamente
 * desde plantillas de servicio.
 *
 * @module services/diario-puesto.service
 */

import { RowDataPacket, ResultSetHeader } from 'mysql2/promise';
import { getTurnosPool } from '../config/database';
import {
  DiarioPuestoConRelaciones,
  CreateDiarioPuestoDTO,
  UpdateDiarioPuestoDTO,
  PoblarPlantillaDTO,
  PoblarPlantillaResult,
  PoblarServiciosDTO,
  buildUpdateFields,
} from '../models/diario-puesto.model';

// ============================================================================
// INTERFACES PARA QUERIES
// ============================================================================

interface GetDiarioPuestoFilters {
  page?: number;
  pageSize?: number;
  search?: string;
  fecha?: string;
  puesto_id?: number;
  empleado_id?: number;
  tipo_turno?: string;
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
 * Incluye puesto, ubicación, cliente y nombre del empleado.
 *
 * Usa LEFT JOIN a rh_empleado para obtener el nombre completo.
 */
const SELECT_WITH_RELATIONS = `
  SELECT
    dp.*,
    p.nombre AS puesto_nombre,
    p.codigo AS puesto_codigo,
    u.nombre AS ubicacion_nombre,
    c.nombre AS cliente_nombre,
    CONCAT(e.nombres, ' ', e.apellidos) AS empleado_nombre
  FROM ot_diario_puesto dp
  INNER JOIN ot_puestos p ON dp.puesto_id = p.id
  INNER JOIN ot_ubicaciones u ON p.ubicacion_id = u.id
  INNER JOIN ot_clientes c ON u.cliente_id = c.id
  LEFT JOIN rh_empleado e ON dp.empleado_id = e.id_empleado
`;

/**
 * Fragmento SQL para COUNT con los mismos JOINs (necesarios para filtros por search)
 */
const COUNT_WITH_RELATIONS = `
  SELECT COUNT(*) AS total
  FROM ot_diario_puesto dp
  INNER JOIN ot_puestos p ON dp.puesto_id = p.id
  INNER JOIN ot_ubicaciones u ON p.ubicacion_id = u.id
  INNER JOIN ot_clientes c ON u.cliente_id = c.id
  LEFT JOIN rh_empleado e ON dp.empleado_id = e.id_empleado
`;

// ============================================================================
// SERVICIO PRINCIPAL
// ============================================================================

/**
 * Obtener lista paginada de registros de diario de puesto con filtros
 *
 * @param filters - Filtros de búsqueda y paginación
 * @returns Lista paginada de registros con relaciones
 *
 * @throws Error si hay un problema con la base de datos
 *
 * @example
 * const result = await getDiarioPuesto({ fecha: '2026-04-04', page: 1, pageSize: 10 });
 */
export async function getDiarioPuesto(
  filters: GetDiarioPuestoFilters = {}
): Promise<PaginatedResult<DiarioPuestoConRelaciones>> {
  const {
    page = 1,
    pageSize = 10,
    search,
    fecha,
    puesto_id,
    empleado_id,
    tipo_turno,
    activo,
  } = filters;

  const offset = (page - 1) * pageSize;

  // Build WHERE clauses
  let whereClause = ' WHERE 1=1';
  const params: any[] = [];

  if (fecha) {
    whereClause += ` AND dp.fecha = ?`;
    params.push(fecha);
  }

  if (puesto_id) {
    whereClause += ` AND dp.puesto_id = ?`;
    params.push(puesto_id);
  }

  if (empleado_id) {
    whereClause += ` AND dp.empleado_id = ?`;
    params.push(empleado_id);
  }

  if (tipo_turno) {
    whereClause += ` AND dp.tipo_turno = ?`;
    params.push(tipo_turno);
  }

  if (activo !== undefined) {
    whereClause += ` AND dp.activo = ?`;
    params.push(activo);
  }

  if (search) {
    whereClause += ` AND (
      p.nombre LIKE ? OR
      p.codigo LIKE ? OR
      u.nombre LIKE ? OR
      c.nombre LIKE ? OR
      CONCAT(e.nombres, ' ', e.apellidos) LIKE ?
    )`;
    const searchPattern = `%${search}%`;
    params.push(searchPattern, searchPattern, searchPattern, searchPattern, searchPattern);
  }

  // Count query
  const countQuery = COUNT_WITH_RELATIONS + whereClause;
  const [countRows] = await getTurnosPool().query<RowDataPacket[]>(countQuery, params);
  const total = countRows[0]?.total || 0;

  // Data query with pagination
  const dataQuery = SELECT_WITH_RELATIONS + whereClause + ` ORDER BY dp.fecha DESC, p.nombre ASC LIMIT ? OFFSET ?`;
  const dataParams = [...params, Number(pageSize), Number(offset)];
  const [rows] = await getTurnosPool().query<RowDataPacket[]>(dataQuery, dataParams);

  return {
    data: rows as DiarioPuestoConRelaciones[],
    total,
  };
}

/**
 * Obtener registro de diario de puesto por ID con relaciones completas
 *
 * @param id - ID del registro
 * @returns Registro con relaciones o null si no existe
 *
 * @throws Error si hay un problema con la base de datos
 */
export async function getDiarioPuestoById(id: number): Promise<DiarioPuestoConRelaciones | null> {
  const query = SELECT_WITH_RELATIONS + ` WHERE dp.id = ?`;

  const [rows] = await getTurnosPool().query<RowDataPacket[]>(query, [id]);

  if (rows.length === 0) {
    return null;
  }

  return rows[0] as DiarioPuestoConRelaciones;
}

/**
 * Crear nuevo registro de diario de puesto
 *
 * @param data - Datos del nuevo registro
 * @param userId - ID del usuario que crea el registro
 * @returns Registro creado con relaciones
 *
 * @throws Error si puesto_id no existe
 * @throws Error si ya existe un registro para la misma combinación (puesto, empleado, fecha)
 */
export async function createDiarioPuesto(
  data: CreateDiarioPuestoDTO,
  userId: number | null
): Promise<DiarioPuestoConRelaciones> {
  // 1. Validar que puesto_id existe
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

  // 2. Insertar registro
  const [result] = await getTurnosPool().query<ResultSetHeader>(
    `INSERT INTO ot_diario_puesto (
      puesto_id, empleado_id, fecha, horas, tipo_turno,
      servicio_puesto_id, activo, created_by
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      data.puesto_id,
      data.empleado_id,
      data.fecha,
      data.horas,
      data.tipo_turno,
      data.servicio_puesto_id ?? null,
      data.activo ?? true,
      userId,
    ]
  );

  const insertedId = result.insertId;

  // 3. Retornar registro creado con relaciones
  const created = await getDiarioPuestoById(insertedId);

  if (!created) {
    throw new Error('Error al recuperar el registro creado');
  }

  return created;
}

/**
 * Actualizar registro de diario de puesto existente
 *
 * @param id - ID del registro a actualizar
 * @param data - Datos a actualizar (campos opcionales)
 * @param userId - ID del usuario que actualiza
 * @returns Registro actualizado con relaciones
 *
 * @throws Error si registro no existe
 */
export async function updateDiarioPuesto(
  id: number,
  data: UpdateDiarioPuestoDTO,
  _userId: number | null
): Promise<DiarioPuestoConRelaciones> {
  // 1. Verificar que registro existe
  const existing = await getDiarioPuestoById(id);
  if (!existing) {
    throw new Error('Registro de diario de puesto no encontrado');
  }

  // 2. Preparar datos para UPDATE
  const updateData = buildUpdateFields(data);

  // 3. Construir query dinámica (solo campos proporcionados)
  const fields = Object.keys(updateData);
  if (fields.length === 0) {
    // No hay nada que actualizar, retornar registro actual
    return existing;
  }

  const setClause = fields.map(field => `${field} = ?`).join(', ');
  const values = fields.map(field => updateData[field]);

  // 4. Ejecutar UPDATE
  await getTurnosPool().query(
    `UPDATE ot_diario_puesto SET ${setClause} WHERE id = ?`,
    [...values, id]
  );

  // 5. Retornar registro actualizado con relaciones
  const updated = await getDiarioPuestoById(id);

  if (!updated) {
    throw new Error('Error al recuperar el registro actualizado');
  }

  return updated;
}

/**
 * Eliminar registro de diario de puesto (soft delete)
 *
 * Establece activo = false en lugar de eliminar el registro.
 *
 * @param id - ID del registro a eliminar
 * @returns Objeto con mensaje y ID del registro eliminado
 *
 * @throws Error si registro no existe
 */
export async function deleteDiarioPuesto(id: number): Promise<{ message: string; id: number }> {
  // 1. Verificar que registro existe
  const existing = await getDiarioPuestoById(id);
  if (!existing) {
    throw new Error('Registro de diario de puesto no encontrado');
  }

  // 2. Soft delete: UPDATE activo = false
  await getTurnosPool().query(
    'UPDATE ot_diario_puesto SET activo = false WHERE id = ?',
    [id]
  );

  return {
    message: 'Registro de diario de puesto desactivado',
    id,
  };
}

// ============================================================================
// FUNCIÓN ESPECIAL: POBLAR DESDE PLANTILLA
// ============================================================================

/**
 * Mapeo de día de la semana (getDay()) a columna de empleado en servicios_puesto
 *
 * getDay() retorna: 0=Domingo, 1=Lunes, ..., 6=Sábado
 */
const DAY_TO_COLUMN: Record<number, string> = {
  0: 'domingo_empleado_id',
  1: 'lunes_empleado_id',
  2: 'martes_empleado_id',
  3: 'miercoles_empleado_id',
  4: 'jueves_empleado_id',
  5: 'viernes_empleado_id',
  6: 'sabado_empleado_id',
};

/**
 * Nombres de los días para mensajes descriptivos
 */
const DAY_NAMES: Record<number, string> = {
  0: 'domingo',
  1: 'lunes',
  2: 'martes',
  3: 'miércoles',
  4: 'jueves',
  5: 'viernes',
  6: 'sábado',
};

/**
 * Poblar el diario de puesto desde una plantilla de servicio
 *
 * Para cada servicio_puesto en la plantilla:
 * 1. Determina el día de la semana de la fecha proporcionada
 * 2. Obtiene el empleado asignado a ese día en el servicio_puesto
 * 3. Si hay empleado asignado, intenta insertar en diario_puesto (INSERT IGNORE)
 * 4. Registros duplicados se omiten sin error
 *
 * @param data - plantilla_id y fecha
 * @param userId - ID del usuario que ejecuta la operación
 * @returns Resultado con conteo de insertados, omitidos y detalles
 *
 * @throws Error si la plantilla no existe o no está activa
 */
export async function poblarDesdePlantilla(
  data: PoblarPlantillaDTO,
  userId: number | null
): Promise<PoblarPlantillaResult> {
  const { plantilla_id, fecha } = data;

  // 1. Validar que la plantilla existe y está activa
  const [plantillaRows] = await getTurnosPool().query<RowDataPacket[]>(
    'SELECT id, nombre, activo FROM ot_plantillas_servicio WHERE id = ?',
    [plantilla_id]
  );

  if (plantillaRows.length === 0) {
    throw new Error('Plantilla de servicio no encontrada');
  }

  if (!plantillaRows[0].activo) {
    throw new Error('La plantilla de servicio no está activa');
  }

  const plantillaNombre = plantillaRows[0].nombre;

  // 2. Obtener detalles de la plantilla (servicio_puesto_ids)
  const [detalleRows] = await getTurnosPool().query<RowDataPacket[]>(
    `SELECT psd.servicio_puesto_id, psd.puesto_id
     FROM ot_plantillas_servicio_detalle psd
     WHERE psd.plantilla_id = ?`,
    [plantilla_id]
  );

  if (detalleRows.length === 0) {
    return {
      insertados: 0,
      omitidos: 0,
      detalles: [`Plantilla "${plantillaNombre}" no tiene detalles configurados`],
    };
  }

  // 3. Determinar día de la semana para la fecha
  const dayOfWeek = new Date(fecha).getDay();
  const columnName = DAY_TO_COLUMN[dayOfWeek];
  const dayName = DAY_NAMES[dayOfWeek];

  // 4. Obtener todos los servicios_puesto referenciados
  const spIds = detalleRows.map((d: RowDataPacket) => d.servicio_puesto_id);
  const placeholders = spIds.map(() => '?').join(',');

  const [spRows] = await getTurnosPool().query<RowDataPacket[]>(
    `SELECT id, puesto_id, tipo_turno, ${columnName} AS empleado_id_dia
     FROM ot_servicios_puesto
     WHERE id IN (${placeholders})`,
    spIds
  );

  // Crear mapa para acceso rápido
  const spMap = new Map<number, RowDataPacket>();
  for (const sp of spRows) {
    spMap.set(sp.id, sp);
  }

  // 5. Procesar cada detalle de la plantilla
  let insertados = 0;
  let omitidos = 0;
  const detalles: string[] = [];

  for (const detalle of detalleRows) {
    const sp = spMap.get(detalle.servicio_puesto_id);

    if (!sp) {
      detalles.push(
        `Servicio puesto #${detalle.servicio_puesto_id} no encontrado, omitido`
      );
      omitidos++;
      continue;
    }

    const empleadoId = sp.empleado_id_dia;

    if (!empleadoId) {
      detalles.push(
        `Puesto #${sp.puesto_id} (${sp.tipo_turno}): sin empleado asignado para ${dayName}, omitido`
      );
      omitidos++;
      continue;
    }

    // Determinar horas del turno desde el servicio_puesto (usar default si no existe columna)
    const horas = sp.horas ?? 12;

    // INSERT IGNORE para evitar error por duplicado (UNIQUE: puesto_id, empleado_id, fecha)
    const [insertResult] = await getTurnosPool().query<ResultSetHeader>(
      `INSERT IGNORE INTO ot_diario_puesto (
        puesto_id, empleado_id, fecha, horas, tipo_turno,
        servicio_puesto_id, activo, created_by
      ) VALUES (?, ?, ?, ?, ?, ?, true, ?)`,
      [
        sp.puesto_id,
        empleadoId,
        fecha,
        horas,
        sp.tipo_turno,
        sp.id,
        userId,
      ]
    );

    if (insertResult.affectedRows > 0) {
      insertados++;
      detalles.push(
        `Puesto #${sp.puesto_id} (${sp.tipo_turno}): empleado #${empleadoId} insertado para ${dayName}`
      );
    } else {
      omitidos++;
      detalles.push(
        `Puesto #${sp.puesto_id} (${sp.tipo_turno}): empleado #${empleadoId} ya existe para ${fecha}, omitido`
      );
    }
  }

  return {
    insertados,
    omitidos,
    detalles,
  };
}

// ============================================================================
// FUNCIÓN ESPECIAL: POBLAR DESDE SERVICIOS POR PUESTO ACTIVOS
// ============================================================================

/**
 * Poblar el diario de puesto desde todos los servicios por puesto activos
 *
 * Para cada servicio_puesto activo:
 * 1. Determina el día de la semana de la fecha proporcionada
 * 2. Obtiene el empleado asignado a ese día
 * 3. Si hay empleado asignado, intenta insertar en diario_puesto (INSERT IGNORE)
 * 4. Registros duplicados se omiten sin error
 *
 * @param data - fecha
 * @param userId - ID del usuario que ejecuta la operación
 * @returns Resultado con conteo de insertados, omitidos y detalles
 */
export async function poblarDesdeServiciosPuesto(
  data: PoblarServiciosDTO,
  userId: number | null
): Promise<PoblarPlantillaResult> {
  const { fecha } = data;

  // 1. Determinar día de la semana para la fecha
  const dayOfWeek = new Date(fecha).getDay();
  const columnName = DAY_TO_COLUMN[dayOfWeek];
  const dayName = DAY_NAMES[dayOfWeek];

  // 2. Obtener todos los servicios por puesto activos con empleado asignado para ese día
  const [spRows] = await getTurnosPool().query<RowDataPacket[]>(
    `SELECT sp.id, sp.puesto_id, sp.tipo_turno, sp.${columnName} AS empleado_id_dia,
            p.nombre AS puesto_nombre, p.codigo AS puesto_codigo
     FROM ot_servicios_puesto sp
     INNER JOIN ot_puestos p ON sp.puesto_id = p.id
     WHERE sp.activo = true`
  );

  if (spRows.length === 0) {
    return {
      insertados: 0,
      omitidos: 0,
      detalles: ['No hay servicios por puesto activos configurados'],
    };
  }

  // 3. Procesar cada servicio por puesto
  let insertados = 0;
  let omitidos = 0;
  const detalles: string[] = [];

  for (const sp of spRows) {
    const empleadoId = sp.empleado_id_dia;

    if (!empleadoId) {
      detalles.push(
        `${sp.puesto_nombre} (${sp.tipo_turno}): sin guardián asignado para ${dayName}, omitido`
      );
      omitidos++;
      continue;
    }

    const horas = 12;

    // INSERT IGNORE para evitar duplicados
    const [insertResult] = await getTurnosPool().query<ResultSetHeader>(
      `INSERT IGNORE INTO ot_diario_puesto (
        puesto_id, empleado_id, fecha, horas, tipo_turno,
        servicio_puesto_id, activo, created_by
      ) VALUES (?, ?, ?, ?, ?, ?, true, ?)`,
      [
        sp.puesto_id,
        empleadoId,
        fecha,
        horas,
        sp.tipo_turno,
        sp.id,
        userId,
      ]
    );

    if (insertResult.affectedRows > 0) {
      insertados++;
      detalles.push(
        `${sp.puesto_nombre} (${sp.tipo_turno}): guardián #${empleadoId} insertado para ${dayName}`
      );
    } else {
      omitidos++;
      detalles.push(
        `${sp.puesto_nombre} (${sp.tipo_turno}): guardián #${empleadoId} ya existe para ${fecha}, omitido`
      );
    }
  }

  return {
    insertados,
    omitidos,
    detalles,
  };
}
