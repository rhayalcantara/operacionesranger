/**
 * Modelo de Puesto
 * Sistema de Gestión de Turnos - OperacionesRanger
 *
 * Define las interfaces, tipos y DTOs para la entidad Puesto.
 * Los puestos son estaciones específicas dentro de una ubicación donde
 * se asignan guardianes de seguridad.
 *
 * @module models/puesto.model
 */

// ============================================================================
// MODELO DE BASE DE DATOS
// ============================================================================

/**
 * Puesto (tabla: puestos)
 *
 * Representa un puesto de vigilancia dentro de una ubicación.
 * Cada puesto pertenece a una ubicación y puede tener múltiples turnos asignados.
 */
export interface Puesto {
  /** ID único del puesto (auto-increment) */
  id: number;

  /** ID de la ubicación a la que pertenece (FK → ubicaciones.id) */
  ubicacion_id: number;

  /** Código único del puesto dentro de la ubicación */
  codigo: string;

  /** Nombre descriptivo del puesto */
  nombre: string;

  /** Descripción detallada del puesto y sus funciones */
  descripcion: string | null;

  /** Cantidad de guardianes requeridos en este puesto */
  cantidad_guardianes: number;

  /** Indica si el puesto requiere cobertura en turno diurno */
  requiere_turno_diurno: boolean;

  /** Indica si el puesto requiere cobertura en turno nocturno */
  requiere_turno_nocturno: boolean;

  /** Indica si el puesto está activo (soft delete) */
  activo: boolean;

  /** Fecha de creación del registro */
  created_at: Date;

  /** Fecha de última modificación */
  updated_at: Date;
}

// ============================================================================
// DATA TRANSFER OBJECTS (DTOs)
// ============================================================================

/**
 * DTO para crear nuevo puesto
 *
 * Usado en: POST /api/puestos
 */
export interface CreatePuestoDTO {
  /** ID de la ubicación (requerido, debe existir y estar activa) */
  ubicacion_id: number;

  /** Código único del puesto (requerido) */
  codigo: string;

  /** Nombre del puesto (requerido) */
  nombre: string;

  /** Descripción (opcional) */
  descripcion?: string | null;

  /** Cantidad de guardianes requeridos (opcional, default: 1) */
  cantidad_guardianes?: number;

  /** Requiere turno diurno (opcional, default: true) */
  requiere_turno_diurno?: boolean;

  /** Requiere turno nocturno (opcional, default: true) */
  requiere_turno_nocturno?: boolean;
}

/**
 * DTO para actualizar puesto existente
 *
 * Todos los campos son opcionales.
 * Usado en: PUT /api/puestos/:id
 *
 * Nota: ubicacion_id NO se puede cambiar (omitido intencionalmente)
 */
export interface UpdatePuestoDTO {
  /** Código único del puesto */
  codigo?: string;

  /** Nombre del puesto */
  nombre?: string;

  /** Descripción */
  descripcion?: string | null;

  /** Cantidad de guardianes requeridos */
  cantidad_guardianes?: number;

  /** Requiere turno diurno */
  requiere_turno_diurno?: boolean;

  /** Requiere turno nocturno */
  requiere_turno_nocturno?: boolean;

  /** Estado activo/inactivo */
  activo?: boolean;
}

/**
 * DTO para respuesta paginada de puestos
 *
 * Usado en: GET /api/puestos
 */
export interface PaginatedPuestosDTO {
  /** Array de puestos en la página actual */
  data: Puesto[];

  /** Total de registros que coinciden con la búsqueda */
  total: number;

  /** Número de página actual (1-indexed) */
  page: number;

  /** Tamaño de página (cantidad de registros por página) */
  pageSize: number;

  /** Total de páginas disponibles */
  totalPages: number;
}

/**
 * DTO para puesto con información adicional (ubicación, cliente y turnos)
 *
 * Usado en: GET /api/puestos/:id
 */
export interface PuestoConRelaciones extends Puesto {
  /** Nombre de la ubicación a la que pertenece */
  ubicacion_nombre: string;

  /** Código de la ubicación */
  ubicacion_codigo: string;

  /** ID del cliente de la ubicación */
  cliente_id: number;

  /** Nombre del cliente de la ubicación */
  cliente_nombre: string;

  /** Cantidad de turnos registrados en este puesto */
  turnos_count: number;
}

// ============================================================================
// UTILITY TYPES
// ============================================================================

/**
 * Campos requeridos para insertar puesto en BD
 * (excluye id, timestamps)
 */
export type NuevoPuestoDB = Omit<Puesto, 'id' | 'created_at' | 'updated_at'>;

/**
 * Campos actualizables de puesto
 * (excluye id, ubicacion_id, timestamps)
 *
 * Nota: ubicacion_id no se puede cambiar después de crear
 */
export type PuestoActualizable = Partial<
  Omit<Puesto, 'id' | 'ubicacion_id' | 'created_at' | 'updated_at'>
>;

// ============================================================================
// CONSTANTES DE VALIDACIÓN
// ============================================================================

/**
 * Configuración de validación para campos de puesto
 */
export const PUESTO_VALIDATION = {
  CODIGO: {
    MIN_LENGTH: 2,
    MAX_LENGTH: 20,
    REGEX: /^[A-Z0-9_-]+$/i // Letras, números, guiones y guiones bajos
  },
  NOMBRE: {
    MIN_LENGTH: 1,
    MAX_LENGTH: 150
  },
  DESCRIPCION: {
    MAX_LENGTH: 1000
  },
  CANTIDAD_GUARDIANES: {
    MIN: 1,
    MAX: 10 // Máximo razonable de guardianes por puesto
  }
} as const;

// ============================================================================
// TYPE GUARDS
// ============================================================================

/**
 * Verifica si un valor es un Puesto válido
 *
 * @param value - Valor a verificar
 * @returns true si es un Puesto válido
 */
export function isPuesto(value: unknown): value is Puesto {
  if (!value || typeof value !== 'object') return false;

  const puesto = value as Puesto;

  return (
    typeof puesto.id === 'number' &&
    typeof puesto.ubicacion_id === 'number' &&
    typeof puesto.codigo === 'string' &&
    typeof puesto.nombre === 'string' &&
    typeof puesto.cantidad_guardianes === 'number' &&
    typeof puesto.requiere_turno_diurno === 'boolean' &&
    typeof puesto.requiere_turno_nocturno === 'boolean' &&
    typeof puesto.activo === 'boolean'
  );
}

/**
 * Verifica si un código de puesto tiene formato válido
 *
 * Código válido: 2-20 caracteres alfanuméricos, guiones y guiones bajos
 * Ejemplos: "P001", "ENTRADA-PRINCIPAL", "puesto_1"
 *
 * @param codigo - Código a validar
 * @returns true si el formato es válido
 */
export function isValidCodigo(codigo: string): boolean {
  return (
    codigo.length >= PUESTO_VALIDATION.CODIGO.MIN_LENGTH &&
    codigo.length <= PUESTO_VALIDATION.CODIGO.MAX_LENGTH &&
    PUESTO_VALIDATION.CODIGO.REGEX.test(codigo)
  );
}

/**
 * Verifica si una cantidad de guardianes es válida
 *
 * @param cantidad - Cantidad a validar
 * @returns true si es válida (>= 1)
 */
export function isValidCantidadGuardianes(cantidad: number): boolean {
  return (
    cantidad >= PUESTO_VALIDATION.CANTIDAD_GUARDIANES.MIN &&
    cantidad <= PUESTO_VALIDATION.CANTIDAD_GUARDIANES.MAX &&
    Number.isInteger(cantidad)
  );
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Limpia y normaliza un código de puesto
 *
 * - Convierte a mayúsculas
 * - Elimina espacios
 * - Reemplaza espacios por guiones
 *
 * @param codigo - Código a normalizar
 * @returns Código normalizado
 *
 * @example
 * normalizeCodigo("entrada principal") // "ENTRADA-PRINCIPAL"
 * normalizeCodigo("p 001")              // "P-001"
 */
export function normalizeCodigo(codigo: string): string {
  return codigo.toUpperCase().trim().replace(/\s+/g, '-');
}

/**
 * Convierte CreatePuestoDTO a NuevoPuestoDB
 *
 * Prepara el DTO para inserción en BD, estableciendo valores por defecto.
 *
 * @param dto - DTO de creación
 * @returns Objeto listo para INSERT
 *
 * @example
 * const dto: CreatePuestoDTO = {
 *   ubicacion_id: 5,
 *   codigo: "ENT01",
 *   nombre: "Entrada Principal"
 * };
 *
 * const dbData = dtoToNuevoPuestoDB(dto);
 * // {
 * //   ubicacion_id: 5,
 * //   codigo: "ENT01",
 * //   nombre: "Entrada Principal",
 * //   descripcion: null,
 * //   cantidad_guardianes: 1,
 * //   requiere_turno_diurno: true,
 * //   requiere_turno_nocturno: true,
 * //   activo: true
 * // }
 */
export function dtoToNuevoPuestoDB(dto: CreatePuestoDTO): NuevoPuestoDB {
  return {
    ubicacion_id: dto.ubicacion_id,
    codigo: dto.codigo,
    nombre: dto.nombre,
    descripcion: dto.descripcion || null,
    cantidad_guardianes: dto.cantidad_guardianes ?? 1, // Default: 1
    requiere_turno_diurno: dto.requiere_turno_diurno ?? true, // Default: true
    requiere_turno_nocturno: dto.requiere_turno_nocturno ?? true, // Default: true
    activo: true // Por defecto activo al crear
  };
}

/**
 * Convierte UpdatePuestoDTO a PuestoActualizable
 *
 * Similar a dtoToNuevoPuestoDB pero para actualizaciones.
 * Solo incluye campos que fueron proporcionados.
 *
 * @param dto - DTO de actualización
 * @returns Objeto con campos a actualizar
 *
 * @example
 * const dto: UpdatePuestoDTO = {
 *   nombre: "Entrada Principal Actualizada",
 *   cantidad_guardianes: 2
 * };
 *
 * const updateData = dtoToPuestoActualizable(dto);
 * // {
 * //   nombre: "Entrada Principal Actualizada",
 * //   cantidad_guardianes: 2
 * // }
 */
export function dtoToPuestoActualizable(dto: UpdatePuestoDTO): PuestoActualizable {
  const result: PuestoActualizable = {};

  // Copiar campos si existen
  if (dto.codigo !== undefined) result.codigo = dto.codigo;
  if (dto.nombre !== undefined) result.nombre = dto.nombre;
  if (dto.descripcion !== undefined) result.descripcion = dto.descripcion;
  if (dto.cantidad_guardianes !== undefined) result.cantidad_guardianes = dto.cantidad_guardianes;
  if (dto.requiere_turno_diurno !== undefined) result.requiere_turno_diurno = dto.requiere_turno_diurno;
  if (dto.requiere_turno_nocturno !== undefined) result.requiere_turno_nocturno = dto.requiere_turno_nocturno;
  if (dto.activo !== undefined) result.activo = dto.activo;

  return result;
}

/**
 * Genera un código sugerido para un puesto basado en el nombre
 *
 * Útil para UI/UX cuando el usuario crea un nuevo puesto.
 *
 * @param nombre - Nombre del puesto
 * @param ubicacionCodigo - Código de la ubicación (opcional)
 * @returns Código sugerido
 *
 * @example
 * generarCodigoSugerido("Entrada Principal") // "ENT-PRINCIPAL"
 * generarCodigoSugerido("Sala de monitoreo", "UB01") // "UB01-SALA"
 */
export function generarCodigoSugerido(nombre: string, ubicacionCodigo?: string): string {
  // Tomar primeras 3 letras de cada palabra
  const palabras = nombre
    .toUpperCase()
    .trim()
    .split(/\s+/)
    .filter(p => p.length > 0);

  let codigo = '';

  if (palabras.length === 1) {
    // Una palabra: tomar hasta 6 caracteres
    codigo = palabras[0].slice(0, 6);
  } else {
    // Múltiples palabras: tomar primeras 3 letras de primeras 2 palabras
    codigo = palabras
      .slice(0, 2)
      .map(p => p.slice(0, 3))
      .join('-');
  }

  // Agregar prefijo de ubicación si se proporciona
  if (ubicacionCodigo) {
    codigo = `${ubicacionCodigo}-${codigo}`;
  }

  return codigo;
}

/**
 * Verifica si un puesto requiere cobertura 24/7
 *
 * Un puesto requiere cobertura 24/7 si necesita tanto turno diurno como nocturno.
 *
 * @param puesto - Puesto a verificar
 * @returns true si requiere cobertura 24/7
 */
export function requiereCobertura24x7(puesto: Puesto): boolean {
  return puesto.requiere_turno_diurno && puesto.requiere_turno_nocturno;
}

/**
 * Obtiene el tipo de cobertura requerida para un puesto
 *
 * @param puesto - Puesto a analizar
 * @returns Tipo de cobertura: "24/7", "SOLO_DIURNO", "SOLO_NOCTURNO", o "NINGUNO"
 */
export function getTipoCobertura(puesto: Puesto): '24/7' | 'SOLO_DIURNO' | 'SOLO_NOCTURNO' | 'NINGUNO' {
  if (puesto.requiere_turno_diurno && puesto.requiere_turno_nocturno) {
    return '24/7';
  } else if (puesto.requiere_turno_diurno) {
    return 'SOLO_DIURNO';
  } else if (puesto.requiere_turno_nocturno) {
    return 'SOLO_NOCTURNO';
  } else {
    return 'NINGUNO';
  }
}
