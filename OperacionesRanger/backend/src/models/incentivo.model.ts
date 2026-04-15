/**
 * Modelo de Incentivo por Puesto
 * Sistema de Gestion de Turnos - OperacionesRanger
 *
 * Define las interfaces, tipos y DTOs para la entidad Incentivo.
 * Los incentivos son montos permanentes asignados a puestos especificos
 * que se mantienen activos hasta ser desactivados.
 *
 * El valor por hora se calcula automaticamente como: monto / 360
 * (15 dias x 24 horas = 360 horas por quincena)
 *
 * @module models/incentivo.model
 */

// ============================================================================
// MODELO DE BASE DE DATOS
// ============================================================================

/**
 * Incentivo por Puesto (tabla: ot_incentivos_puesto)
 *
 * Representa un incentivo monetario permanente asignado a un puesto especifico.
 * Los guardianes que trabajen en ese puesto reciben el incentivo proporcional
 * a sus horas trabajadas mientras el incentivo este activo.
 */
export interface Incentivo {
  /** ID unico del incentivo (auto-increment) */
  id: number;

  /** ID del puesto al que aplica el incentivo (FK -> puestos.id) */
  puesto_id: number;

  /** Monto total del incentivo */
  monto: number;

  /**
   * Valor por hora del incentivo
   * GENERATED STORED column: monto / 360
   * (360 = 15 dias x 24 horas)
   * NO se debe proporcionar en INSERT/UPDATE
   */
  valor_hora: number;

  /** Si el incentivo esta activo (true) o desactivado (false) */
  activo: boolean;

  /** ID del usuario que creo el incentivo */
  created_by: number | null;

  /** Descripcion o concepto del incentivo */
  concepto: string | null;

  /** Fecha de creacion del registro */
  created_at: Date;

  /** Fecha de ultima modificacion */
  updated_at: Date;
}

// ============================================================================
// DATA TRANSFER OBJECTS (DTOs)
// ============================================================================

/**
 * DTO para crear nuevo incentivo
 *
 * Usado en: POST /api/incentivos
 */
export interface CreateIncentivoDTO {
  /** ID del puesto (requerido, debe existir y estar activo) */
  puesto_id: number;

  /** Monto total del incentivo (requerido, > 0) */
  monto: number;

  /** Descripcion del incentivo (opcional) */
  concepto?: string | null;

  /** Si esta activo (opcional, default true) */
  activo?: boolean;
}

/**
 * DTO para actualizar incentivo existente
 *
 * Todos los campos son opcionales.
 * Usado en: PUT /api/incentivos/:id
 */
export interface UpdateIncentivoDTO {
  /** Monto total del incentivo */
  monto?: number;

  /** Descripcion del incentivo */
  concepto?: string | null;

  /** Si esta activo */
  activo?: boolean;
}

/**
 * DTO para respuesta paginada de incentivos
 *
 * Usado en: GET /api/incentivos
 */
export interface PaginatedIncentivosDTO {
  /** Array de incentivos en la pagina actual */
  data: Incentivo[];

  /** Total de registros que coinciden con la busqueda */
  total: number;

  /** Numero de pagina actual (1-indexed) */
  page: number;

  /** Tamano de pagina (cantidad de registros por pagina) */
  pageSize: number;

  /** Total de paginas disponibles */
  totalPages: number;
}

/**
 * DTO para incentivo con informacion adicional (puesto, ubicacion, cliente)
 *
 * Usado en: GET /api/incentivos/:id, respuestas de POST/PUT
 */
export interface IncentivoConRelaciones extends Incentivo {
  /** Codigo del puesto */
  puesto_codigo: string;

  /** Nombre del puesto */
  puesto_nombre: string;

  /** ID de la ubicacion del puesto */
  ubicacion_id: number;

  /** Nombre de la ubicacion */
  ubicacion_nombre: string;

  /** ID del cliente de la ubicacion */
  cliente_id: number;

  /** Nombre del cliente */
  cliente_nombre: string;
}

// ============================================================================
// CONSTANTES DE VALIDACION
// ============================================================================

/**
 * Configuracion de validacion para campos de incentivo
 */
export const INCENTIVO_VALIDATION = {
  MONTO: {
    MIN: 0.01,
    MAX: 999999999.99,
    DECIMALS: 2
  },
  CONCEPTO: {
    MAX_LENGTH: 255
  },
  HORAS_POR_QUINCENA: 360 // 15 dias x 24 horas
} as const;

// ============================================================================
// TYPE GUARDS
// ============================================================================

/**
 * Verifica si un valor es un Incentivo valido
 */
export function isIncentivo(value: unknown): value is Incentivo {
  if (!value || typeof value !== 'object') return false;

  const incentivo = value as Incentivo;

  return (
    typeof incentivo.id === 'number' &&
    typeof incentivo.puesto_id === 'number' &&
    typeof incentivo.monto === 'number' &&
    typeof incentivo.valor_hora === 'number'
  );
}

/**
 * Verifica si un monto es valido
 */
export function isValidMonto(monto: number): boolean {
  return monto >= INCENTIVO_VALIDATION.MONTO.MIN && monto <= INCENTIVO_VALIDATION.MONTO.MAX;
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Calcula el valor por hora de un incentivo
 *
 * Formula: monto / 360
 * (360 = 15 dias x 24 horas)
 *
 * Nota: Esta funcion es solo para referencia.
 * En BD, el campo valor_hora es GENERATED STORED y se calcula automaticamente.
 */
export function calcularValorHora(monto: number): number {
  const valorHora = monto / INCENTIVO_VALIDATION.HORAS_POR_QUINCENA;
  return Math.round(valorHora * 10000) / 10000;
}
