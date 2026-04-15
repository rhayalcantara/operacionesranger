/**
 * Servicio de Configuración de Turnos
 * Sistema de Gestión de Turnos - OperacionesRanger
 *
 * Este servicio gestiona las operaciones CRUD de configuración de turnos
 * (horarios DIURNO y NOCTURNO).
 *
 * Reglas de negocio:
 * - Solo existen 2 configuraciones (DIURNO y NOCTURNO)
 * - NO se crean ni eliminan, solo se consultan y actualizan
 * - Los horarios deben cubrir exactamente 24 horas
 * - No puede haber solapamiento entre turnos
 */

import { RowDataPacket, ResultSetHeader } from 'mysql2';
import { getTurnosPool } from '../config/database';
import {
  UpdateConfigTurnoDTO,
  ConfigTurnoResponseDTO,
  ConfigTurnosListDTO,
  TipoTurno,
  normalizeTime,
  HORARIOS_CONFIG
} from '../models/config-turnos.model';

// ============================================================================
// INTERFACES DE BASE DE DATOS
// ============================================================================

/**
 * Interfaz para filas de configuracion_turnos de MySQL
 */
interface ConfiguracionTurnoRow extends RowDataPacket {
  id: number;
  tipo_turno: 'DIURNO' | 'NOCTURNO';
  hora_inicio: string;
  hora_fin: string;
  descripcion: string | null;
  activo: number; // MySQL devuelve BOOLEAN como 0 o 1
  created_at: Date;
  updated_at: Date;
}

// ============================================================================
// FUNCIONES PRINCIPALES DEL SERVICIO
// ============================================================================

/**
 * Obtener todas las configuraciones de turnos
 *
 * Siempre retorna 2 configuraciones (DIURNO y NOCTURNO).
 *
 * @returns Lista de configuraciones con total
 * @throws Error si hay problema con la BD
 *
 * @example
 * ```typescript
 * const configs = await getAllConfiguraciones();
 * console.log(configs.total); // 2
 * console.log(configs.data[0].tipo_turno); // 'DIURNO'
 * ```
 */
export async function getAllConfiguraciones(): Promise<ConfigTurnosListDTO> {
  const pool = getTurnosPool();

  const [rows] = await pool.execute<ConfiguracionTurnoRow[]>(
    `SELECT
      id, tipo_turno, hora_inicio, hora_fin, descripcion, activo, created_at, updated_at
     FROM ot_configuracion_turnos
     ORDER BY id ASC`
  );

  // Convertir rows de BD a modelos
  const data: ConfigTurnoResponseDTO[] = rows.map((row) => ({
    id: row.id,
    tipo_turno: row.tipo_turno === 'DIURNO' ? TipoTurno.DIURNO : TipoTurno.NOCTURNO,
    hora_inicio: row.hora_inicio,
    hora_fin: row.hora_fin,
    descripcion: row.descripcion,
    activo: row.activo === 1,
    created_at: row.created_at,
    updated_at: row.updated_at
  }));

  // Validar que siempre haya 2 configuraciones
  if (data.length !== HORARIOS_CONFIG.TOTAL_CONFIGURACIONES) {
    console.error(
      `[ConfigTurnosService] ERROR: Se esperaban ${HORARIOS_CONFIG.TOTAL_CONFIGURACIONES} configuraciones, ` +
      `pero se encontraron ${data.length}`
    );
  }

  return {
    data,
    total: data.length
  };
}

/**
 * Obtener una configuración de turno por ID
 *
 * @param id - ID de la configuración (1 o 2)
 * @returns Configuración encontrada
 * @throws Error si la configuración no existe
 *
 * @example
 * ```typescript
 * const diurno = await getConfiguracionById(1);
 * console.log(diurno.tipo_turno); // 'DIURNO'
 * ```
 */
export async function getConfiguracionById(id: number): Promise<ConfigTurnoResponseDTO> {
  const pool = getTurnosPool();

  const [rows] = await pool.execute<ConfiguracionTurnoRow[]>(
    `SELECT
      id, tipo_turno, hora_inicio, hora_fin, descripcion, activo, created_at, updated_at
     FROM ot_configuracion_turnos
     WHERE id = ?`,
    [id]
  );

  if (rows.length === 0) {
    throw new Error(`Configuración de turno con ID ${id} no encontrada`);
  }

  const row = rows[0];

  return {
    id: row.id,
    tipo_turno: row.tipo_turno === 'DIURNO' ? TipoTurno.DIURNO : TipoTurno.NOCTURNO,
    hora_inicio: row.hora_inicio,
    hora_fin: row.hora_fin,
    descripcion: row.descripcion,
    activo: row.activo === 1,
    created_at: row.created_at,
    updated_at: row.updated_at
  };
}

/**
 * Actualizar una configuración de turno
 *
 * Validaciones realizadas:
 * 1. La configuración debe existir
 * 2. Si se actualizan horarios, deben tener formato TIME válido
 * 3. Si se actualizan horarios, deben ser complementarios con el otro turno
 * 4. Los horarios deben cubrir exactamente 24 horas
 *
 * @param id - ID de la configuración a actualizar (1 o 2)
 * @param data - Datos a actualizar
 * @returns Configuración actualizada
 * @throws Error si validaciones fallan o configuración no existe
 *
 * @example
 * ```typescript
 * const updated = await updateConfiguracion(1, {
 *   hora_inicio: '07:00:00',
 *   hora_fin: '19:00:00'
 * });
 * ```
 */
export async function updateConfiguracion(
  id: number,
  data: UpdateConfigTurnoDTO
): Promise<ConfigTurnoResponseDTO> {
  const pool = getTurnosPool();

  // 1. Verificar que la configuración existe
  const currentConfig = await getConfiguracionById(id);

  // 2. Validar que al menos un campo se está actualizando
  const hasChanges = Object.keys(data).length > 0;
  if (!hasChanges) {
    throw new Error('Debe proporcionar al menos un campo para actualizar');
  }

  // 3. Si se están actualizando horarios, validar
  if (data.hora_inicio || data.hora_fin) {
    // Normalizar horarios (agregar :00 si solo es HH:MM)
    const nuevaHoraInicio = data.hora_inicio
      ? normalizeTime(data.hora_inicio)
      : currentConfig.hora_inicio;

    const nuevaHoraFin = data.hora_fin
      ? normalizeTime(data.hora_fin)
      : currentConfig.hora_fin;

    // Validar que los nuevos horarios sean compatibles con el otro turno
    await validateHorariosConOtroTurno(
      id,
      currentConfig.tipo_turno,
      nuevaHoraInicio,
      nuevaHoraFin
    );

    // Actualizar data con horarios normalizados
    data.hora_inicio = nuevaHoraInicio;
    data.hora_fin = nuevaHoraFin;
  }

  // 4. Construir query de actualización dinámicamente
  const updates: string[] = [];
  const values: any[] = [];

  if (data.hora_inicio) {
    updates.push('hora_inicio = ?');
    values.push(data.hora_inicio);
  }

  if (data.hora_fin) {
    updates.push('hora_fin = ?');
    values.push(data.hora_fin);
  }

  if (data.descripcion !== undefined) {
    updates.push('descripcion = ?');
    values.push(data.descripcion);
  }

  if (data.activo !== undefined) {
    updates.push('activo = ?');
    values.push(data.activo ? 1 : 0);
  }

  // Agregar ID al final de los valores
  values.push(id);

  // 5. Ejecutar UPDATE
  const query = `
    UPDATE ot_configuracion_turnos
    SET ${updates.join(', ')}, updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `;

  await pool.execute<ResultSetHeader>(query, values);

  console.log(`[ConfigTurnosService] Configuración ${id} actualizada exitosamente`);

  // 6. Retornar configuración actualizada
  return await getConfiguracionById(id);
}

// ============================================================================
// FUNCIONES DE VALIDACIÓN
// ============================================================================

/**
 * Validar que los nuevos horarios de un turno sean compatibles con el otro turno
 *
 * Esta función verifica:
 * 1. El turno actual debe terminar donde empieza el otro turno
 * 2. El otro turno debe terminar donde empieza el turno actual
 * 3. Ambos turnos deben cubrir exactamente 24 horas
 *
 * @param id - ID de la configuración que se está actualizando
 * @param tipoTurno - Tipo del turno que se está actualizando
 * @param nuevaHoraInicio - Nueva hora de inicio
 * @param nuevaHoraFin - Nueva hora de fin
 * @throws Error si los horarios no son compatibles
 *
 * @private
 */
async function validateHorariosConOtroTurno(
  id: number,
  tipoTurno: TipoTurno,
  nuevaHoraInicio: string,
  nuevaHoraFin: string
): Promise<void> {
  // Obtener el otro turno
  const otroId = id === 1 ? 2 : 1;
  const otroTurno = await getConfiguracionById(otroId);

  // Validación: El turno actual debe terminar donde empieza el otro
  if (nuevaHoraFin !== otroTurno.hora_inicio) {
    throw new Error(
      `El turno ${tipoTurno} debe terminar (${nuevaHoraFin}) donde empieza ` +
      `el turno ${otroTurno.tipo_turno} (${otroTurno.hora_inicio})`
    );
  }

  // Validación: El otro turno debe terminar donde empieza el turno actual
  if (otroTurno.hora_fin !== nuevaHoraInicio) {
    throw new Error(
      `El turno ${otroTurno.tipo_turno} debe terminar (${otroTurno.hora_fin}) ` +
      `donde empieza el turno ${tipoTurno} (${nuevaHoraInicio})`
    );
  }

  console.log(
    `[ConfigTurnosService] Validación de horarios OK: ` +
    `${tipoTurno} (${nuevaHoraInicio}-${nuevaHoraFin}) complementa ` +
    `${otroTurno.tipo_turno} (${otroTurno.hora_inicio}-${otroTurno.hora_fin})`
  );
}

/**
 * Validar que ambas configuraciones cubren exactamente 24 horas
 *
 * Esta función verifica que DIURNO y NOCTURNO sean complementarios
 * y cubran todo el día sin solapamientos ni huecos.
 *
 * @returns true si cubren 24 horas, false si no
 *
 * @example
 * ```typescript
 * const valido = await validateCobertura24Horas();
 * if (!valido) {
 *   console.error('Los horarios no cubren 24 horas');
 * }
 * ```
 */
export async function validateCobertura24Horas(): Promise<boolean> {
  const configs = await getAllConfiguraciones();

  if (configs.total !== 2) {
    console.error(
      `[ConfigTurnosService] ERROR: Se requieren 2 configuraciones, ` +
      `pero hay ${configs.total}`
    );
    return false;
  }

  const diurno = configs.data.find((c) => c.tipo_turno === TipoTurno.DIURNO);
  const nocturno = configs.data.find((c) => c.tipo_turno === TipoTurno.NOCTURNO);

  if (!diurno || !nocturno) {
    console.error(
      '[ConfigTurnosService] ERROR: Falta configuración DIURNO o NOCTURNO'
    );
    return false;
  }

  // DIURNO debe terminar donde empieza NOCTURNO
  if (diurno.hora_fin !== nocturno.hora_inicio) {
    console.error(
      `[ConfigTurnosService] ERROR: DIURNO termina en ${diurno.hora_fin} ` +
      `pero NOCTURNO empieza en ${nocturno.hora_inicio}`
    );
    return false;
  }

  // NOCTURNO debe terminar donde empieza DIURNO
  if (nocturno.hora_fin !== diurno.hora_inicio) {
    console.error(
      `[ConfigTurnosService] ERROR: NOCTURNO termina en ${nocturno.hora_fin} ` +
      `pero DIURNO empieza en ${diurno.hora_inicio}`
    );
    return false;
  }

  console.log('[ConfigTurnosService] Validación: Configuraciones cubren 24 horas ✓');
  return true;
}

// ============================================================================
// FUNCIONES DE UTILIDAD
// ============================================================================

/**
 * Obtener configuración por tipo de turno
 *
 * @param tipoTurno - DIURNO o NOCTURNO
 * @returns Configuración del tipo especificado
 * @throws Error si no se encuentra
 *
 * @example
 * ```typescript
 * const diurno = await getConfiguracionByTipo(TipoTurno.DIURNO);
 * ```
 */
export async function getConfiguracionByTipo(
  tipoTurno: TipoTurno
): Promise<ConfigTurnoResponseDTO> {
  const pool = getTurnosPool();

  const [rows] = await pool.execute<ConfiguracionTurnoRow[]>(
    `SELECT
      id, tipo_turno, hora_inicio, hora_fin, descripcion, activo, created_at, updated_at
     FROM ot_configuracion_turnos
     WHERE tipo_turno = ?`,
    [tipoTurno]
  );

  if (rows.length === 0) {
    throw new Error(`Configuración de turno ${tipoTurno} no encontrada`);
  }

  const row = rows[0];

  return {
    id: row.id,
    tipo_turno: row.tipo_turno === 'DIURNO' ? TipoTurno.DIURNO : TipoTurno.NOCTURNO,
    hora_inicio: row.hora_inicio,
    hora_fin: row.hora_fin,
    descripcion: row.descripcion,
    activo: row.activo === 1,
    created_at: row.created_at,
    updated_at: row.updated_at
  };
}

/**
 * Determinar tipo de turno según una hora
 *
 * Esta función replica la lógica del stored procedure `sp_determinar_tipo_turno`.
 * Usa las configuraciones actuales de la BD para determinar si una hora
 * pertenece al turno DIURNO o NOCTURNO.
 *
 * @param hora - Hora en formato HH:MM:SS o HH:MM
 * @returns DIURNO o NOCTURNO
 *
 * @example
 * ```typescript
 * const tipo = await determinarTipoTurno('08:00:00'); // DIURNO
 * const tipo2 = await determinarTipoTurno('20:00:00'); // NOCTURNO
 * ```
 */
export async function determinarTipoTurno(hora: string): Promise<TipoTurno> {
  const diurno = await getConfiguracionByTipo(TipoTurno.DIURNO);

  // Normalizar hora
  const horaNormalizada = normalizeTime(hora);

  // Comparar: si hora >= hora_inicio_diurno AND hora < hora_fin_diurno → DIURNO
  if (
    horaNormalizada >= diurno.hora_inicio &&
    horaNormalizada < diurno.hora_fin
  ) {
    return TipoTurno.DIURNO;
  }

  return TipoTurno.NOCTURNO;
}

/**
 * Resetear configuraciones a valores por defecto
 *
 * ADVERTENCIA: Esta función resetea ambas configuraciones a los valores
 * iniciales del schema SQL. Usar solo en desarrollo o tests.
 *
 * @returns Configuraciones reseteadas
 *
 * @example
 * ```typescript
 * // Solo en tests
 * await resetToDefaults();
 * ```
 */
export async function resetToDefaults(): Promise<ConfigTurnosListDTO> {
  const pool = getTurnosPool();

  console.warn('[ConfigTurnosService] Reseteando configuraciones a valores por defecto');

  // Resetear DIURNO
  await pool.execute(
    `UPDATE ot_configuracion_turnos
     SET hora_inicio = '06:00:00',
         hora_fin = '18:00:00',
         descripcion = 'Turno diurno: 6:00 AM a 6:00 PM',
         activo = TRUE,
         updated_at = CURRENT_TIMESTAMP
     WHERE tipo_turno = 'DIURNO'`
  );

  // Resetear NOCTURNO
  await pool.execute(
    `UPDATE ot_configuracion_turnos
     SET hora_inicio = '18:00:00',
         hora_fin = '06:00:00',
         descripcion = 'Turno nocturno: 6:00 PM a 6:00 AM',
         activo = TRUE,
         updated_at = CURRENT_TIMESTAMP
     WHERE tipo_turno = 'NOCTURNO'`
  );

  console.log('[ConfigTurnosService] Configuraciones reseteadas exitosamente');

  return await getAllConfiguraciones();
}
