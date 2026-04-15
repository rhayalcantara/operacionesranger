/**
 * Modelo Guardian - Sistema de Gestión de Turnos
 *
 * Interfaces TypeScript para representar guardianes de seguridad
 * obtenidos desde la base de datos RRHH externa (db_aae4a2_ranger.rh_empleado).
 *
 * IMPORTANTE: Los guardianes son empleados con id_puesto = 97 (VIGILANTE DE SEGURIDAD)
 * y status = 1 (activos).
 *
 * @module models/guardian.model
 */

/**
 * Interface Guardian
 *
 * Representa un guardián de seguridad activo del sistema RRHH.
 * Esta interface mapea los campos relevantes de la tabla rh_empleado
 * para guardianes (id_puesto = 97, status = 1).
 *
 * Origen: Base de datos db_aae4a2_ranger.rh_empleado (READ-ONLY)
 *
 * @interface Guardian
 */
export interface Guardian {
  /** ID único del empleado (Primary Key de rh_empleado) */
  id_empleado: number;

  /** Código de empleado (puede ser igual a cédula) */
  codigo_empleado: string;

  /** Cédula de identidad dominicana (formato: XXX-XXXXXXX-X) */
  cedula_empleado: string;

  /** Nombres del empleado */
  nombres: string;

  /** Apellidos del empleado */
  apellidos: string;

  /** Nombre completo (computed: nombres + apellidos) */
  nombre_completo?: string;

  /** Email de contacto (nullable) */
  email?: string | null;

  /** Teléfono de contacto (nullable) */
  telefono?: string | null;

  /** Fecha de ingreso a la empresa */
  fecha_ingreso: Date;

  /** ID del puesto (SIEMPRE 97 para guardianes: VIGILANTE DE SEGURIDAD) */
  id_puesto: number;

  /** Estado del empleado (SIEMPRE 1 para activos: 1 = activo, 0 = inactivo) */
  status: number;

  /** Fecha de creación del registro */
  created_at: Date;

  /** Fecha de última actualización del registro */
  updated_at: Date;
}

/**
 * Interface GuardianFilters
 *
 * Parámetros de filtrado para consulta de guardianes.
 * Usada en el servicio rrhh.service.ts para listar guardianes con paginación.
 *
 * @interface GuardianFilters
 */
export interface GuardianFilters {
  /** Número de página (default: 1) */
  page?: number;

  /** Cantidad de registros por página (default: 10, max: 100) */
  pageSize?: number;

  /**
   * Término de búsqueda (busca en: nombres, apellidos, cedula_empleado)
   * Ejemplo: "Juan", "Pérez", "001-1234567-8"
   */
  search?: string;
}

/**
 * Interface GuardianPaginatedResponse
 *
 * Respuesta paginada de consulta de guardianes.
 * Formato estándar para endpoints que retornan listas paginadas.
 *
 * @interface GuardianPaginatedResponse
 *
 * @example
 * ```json
 * {
 *   "data": [
 *     {
 *       "id_empleado": 1001,
 *       "cedula_empleado": "001-1234567-8",
 *       "nombre_completo": "Juan Pérez",
 *       ...
 *     }
 *   ],
 *   "total": 515
 * }
 * ```
 */
export interface GuardianPaginatedResponse {
  /** Array de guardianes */
  data: Guardian[];

  /** Cantidad total de guardianes (sin paginación) */
  total: number;
}

/**
 * Interface GuardianDB
 *
 * Representación de registro raw de base de datos antes de transformación.
 * Usada internamente en el servicio para mapear resultados de queries SQL.
 *
 * Diferencia con Guardian: Algunos campos pueden venir como strings desde MySQL
 * que necesitan ser transformados (fechas, etc.)
 *
 * @interface GuardianDB
 */
export interface GuardianDB {
  id_empleado: number;
  codigo_empleado: string | null;
  cedula_empleado: string;
  nombres: string;
  apellidos: string;
  email: string | null;
  telefono: string | null;
  fecha_ingreso: Date | string;
  id_puesto: number;
  status: number;
  created_at: Date | string;
  updated_at: Date | string;
}

/**
 * Type Guard: Verificar si un objeto es un Guardian válido
 *
 * Valida que un objeto tenga la estructura mínima de un Guardian.
 * Útil para validaciones en runtime.
 *
 * @param obj - Objeto a verificar
 * @returns true si es un Guardian válido, false en caso contrario
 *
 * @example
 * ```typescript
 * if (isGuardian(data)) {
 *   console.log(data.nombre_completo); // TypeScript sabe que es Guardian
 * }
 * ```
 */
export function isGuardian(obj: any): obj is Guardian {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    typeof obj.id_empleado === 'number' &&
    typeof obj.cedula_empleado === 'string' &&
    typeof obj.nombres === 'string' &&
    typeof obj.apellidos === 'string' &&
    typeof obj.id_puesto === 'number' &&
    typeof obj.status === 'number' &&
    obj.id_puesto === 97 &&
    obj.status === 1
  );
}

/**
 * Helper: Transformar GuardianDB a Guardian
 *
 * Convierte registro raw de BD a interface Guardian con tipos correctos.
 * Realiza:
 * - Conversión de fechas string a Date objects
 * - Generación de nombre_completo
 * - Manejo de campos nullables
 *
 * @param dbRecord - Registro raw de la base de datos
 * @returns Guardian con tipos correctos
 *
 * @example
 * ```typescript
 * const [rows] = await pool.query('SELECT * FROM rh_empleado WHERE id_empleado = ?', [1001]);
 * const guardian = transformGuardian(rows[0]);
 * ```
 */
export function transformGuardian(dbRecord: GuardianDB): Guardian {
  return {
    id_empleado: dbRecord.id_empleado,
    codigo_empleado: dbRecord.codigo_empleado || dbRecord.cedula_empleado,
    cedula_empleado: dbRecord.cedula_empleado,
    nombres: dbRecord.nombres,
    apellidos: dbRecord.apellidos,
    nombre_completo: `${dbRecord.nombres} ${dbRecord.apellidos}`,
    email: dbRecord.email,
    telefono: dbRecord.telefono,
    fecha_ingreso:
      typeof dbRecord.fecha_ingreso === 'string'
        ? new Date(dbRecord.fecha_ingreso)
        : dbRecord.fecha_ingreso,
    id_puesto: dbRecord.id_puesto,
    status: dbRecord.status,
    created_at:
      typeof dbRecord.created_at === 'string'
        ? new Date(dbRecord.created_at)
        : dbRecord.created_at,
    updated_at:
      typeof dbRecord.updated_at === 'string'
        ? new Date(dbRecord.updated_at)
        : dbRecord.updated_at,
  };
}

/**
 * Constantes de guardianes
 */
export const GUARDIAN_CONSTANTS = {
  /** ID del puesto "VIGILANTE DE SEGURIDAD" */
  ID_PUESTO_VIGILANTE: 97,

  /** Estado activo */
  STATUS_ACTIVO: 1,

  /** Estado inactivo */
  STATUS_INACTIVO: 0,

  /** Page size por defecto */
  DEFAULT_PAGE_SIZE: 10,

  /** Page size máximo permitido */
  MAX_PAGE_SIZE: 100,

  /** Límite de resultados para búsqueda rápida */
  SEARCH_LIMIT: 20,
} as const;
