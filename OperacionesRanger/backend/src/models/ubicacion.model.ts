/**
 * Modelo de Ubicación
 * Sistema de Gestión de Turnos - OperacionesRanger
 *
 * Define las interfaces, tipos y DTOs para la entidad Ubicación.
 * Las ubicaciones son sitios físicos donde los clientes requieren
 * servicios de seguridad (guardianes).
 *
 * @module models/ubicacion.model
 */

// ============================================================================
// MODELO DE BASE DE DATOS
// ============================================================================

/**
 * Ubicación (tabla: ubicaciones)
 *
 * Representa un lugar físico donde un cliente requiere servicio de seguridad.
 * Cada ubicación pertenece a un cliente y puede tener múltiples puestos.
 */
export interface Ubicacion {
  /** ID único de la ubicación (auto-increment) */
  id: number;

  /** ID del cliente al que pertenece (FK → clientes.id) */
  cliente_id: number;

  /** Código único de ubicación dentro del cliente */
  codigo: string;

  /** Nombre de la ubicación */
  nombre: string;

  /** Dirección física completa */
  direccion: string | null;

  /** Provincia de República Dominicana */
  provincia: string | null;

  /** Municipio */
  municipio: string | null;

  /** Sector o barrio */
  sector: string | null;

  /** Coordenada GPS: Latitud (rango: -90 a 90) */
  latitud: number | null;

  /** Coordenada GPS: Longitud (rango: -180 a 180) */
  longitud: number | null;

  /** Teléfono de la ubicación */
  telefono: string | null;

  /** Nombre de la persona de contacto */
  contacto_nombre: string | null;

  /** Teléfono de la persona de contacto */
  contacto_telefono: string | null;

  /** Indica si la ubicación está activa (soft delete) */
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
 * DTO para crear nueva ubicación
 *
 * Usado en: POST /api/ubicaciones
 */
export interface CreateUbicacionDTO {
  /** ID del cliente (requerido, debe existir y estar activo) */
  cliente_id: number;

  /** Código único de ubicación (requerido) */
  codigo: string;

  /** Nombre de la ubicación (requerido) */
  nombre: string;

  /** Dirección física (opcional) */
  direccion?: string | null;

  /** Provincia (opcional) */
  provincia?: string | null;

  /** Municipio (opcional) */
  municipio?: string | null;

  /** Sector (opcional) */
  sector?: string | null;

  /**
   * Coordenadas GPS en formato "latitud,longitud" (opcional)
   * Ejemplo: "18.486058,-69.931212"
   *
   * Se parsean y almacenan en campos separados (latitud, longitud)
   */
  coordenadas_gps?: string | null;

  /** Teléfono (opcional) */
  telefono?: string | null;

  /** Nombre del contacto (opcional) */
  contacto_nombre?: string | null;

  /** Teléfono del contacto (opcional) */
  contacto_telefono?: string | null;
}

/**
 * DTO para actualizar ubicación existente
 *
 * Todos los campos son opcionales.
 * Usado en: PUT /api/ubicaciones/:id
 *
 * Nota: cliente_id NO se puede cambiar (omitido intencionalmente)
 */
export interface UpdateUbicacionDTO {
  /** Código único de ubicación */
  codigo?: string;

  /** Nombre de la ubicación */
  nombre?: string;

  /** Dirección física */
  direccion?: string | null;

  /** Provincia */
  provincia?: string | null;

  /** Municipio */
  municipio?: string | null;

  /** Sector */
  sector?: string | null;

  /**
   * Coordenadas GPS en formato "latitud,longitud"
   * Ejemplo: "18.486058,-69.931212"
   */
  coordenadas_gps?: string | null;

  /** Teléfono */
  telefono?: string | null;

  /** Nombre del contacto */
  contacto_nombre?: string | null;

  /** Teléfono del contacto */
  contacto_telefono?: string | null;

  /** Estado activo/inactivo */
  activo?: boolean;
}

/**
 * DTO para respuesta paginada de ubicaciones
 *
 * Usado en: GET /api/ubicaciones
 */
export interface PaginatedUbicacionesDTO {
  /** Array de ubicaciones en la página actual */
  data: Ubicacion[];

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
 * DTO para ubicación con información adicional (cliente y puestos)
 *
 * Usado en: GET /api/ubicaciones/:id
 */
export interface UbicacionConRelaciones extends Ubicacion {
  /** Nombre del cliente al que pertenece */
  cliente_nombre: string;

  /** Cantidad de puestos activos en esta ubicación */
  puestos_count: number;
}

// ============================================================================
// UTILITY TYPES
// ============================================================================

/**
 * Campos requeridos para insertar ubicación en BD
 * (excluye id, timestamps)
 */
export type NuevaUbicacionDB = Omit<Ubicacion, 'id' | 'created_at' | 'updated_at'>;

/**
 * Campos actualizables de ubicación
 * (excluye id, cliente_id, timestamps)
 *
 * Nota: cliente_id no se puede cambiar después de crear
 */
export type UbicacionActualizable = Partial<
  Omit<Ubicacion, 'id' | 'cliente_id' | 'created_at' | 'updated_at'>
>;

// ============================================================================
// CONSTANTES DE VALIDACIÓN
// ============================================================================

/**
 * Configuración de validación para campos de ubicación
 */
export const UBICACION_VALIDATION = {
  CODIGO: {
    MIN_LENGTH: 2,
    MAX_LENGTH: 20,
    REGEX: /^[A-Z0-9_-]+$/i // Letras, números, guiones y guiones bajos
  },
  NOMBRE: {
    MIN_LENGTH: 1,
    MAX_LENGTH: 150
  },
  PROVINCIA: {
    MAX_LENGTH: 50
  },
  MUNICIPIO: {
    MAX_LENGTH: 50
  },
  SECTOR: {
    MAX_LENGTH: 100
  },
  COORDENADAS: {
    LATITUD_MIN: -90,
    LATITUD_MAX: 90,
    LONGITUD_MIN: -180,
    LONGITUD_MAX: 180,
    // Formato esperado: "latitud,longitud"
    REGEX: /^-?\d+\.?\d*\s*,\s*-?\d+\.?\d*$/
  },
  TELEFONO: {
    MIN_LENGTH: 10, // Teléfono RD: (809) 555-1234
    MAX_LENGTH: 20
  },
  DIRECCION: {
    MAX_LENGTH: 500
  },
  CONTACTO_NOMBRE: {
    MAX_LENGTH: 100
  }
} as const;

// ============================================================================
// TYPE GUARDS
// ============================================================================

/**
 * Verifica si un valor es una Ubicación válida
 *
 * @param value - Valor a verificar
 * @returns true si es una Ubicación válida
 */
export function isUbicacion(value: unknown): value is Ubicacion {
  if (!value || typeof value !== 'object') return false;

  const ubicacion = value as Ubicacion;

  return (
    typeof ubicacion.id === 'number' &&
    typeof ubicacion.cliente_id === 'number' &&
    typeof ubicacion.codigo === 'string' &&
    typeof ubicacion.nombre === 'string' &&
    typeof ubicacion.activo === 'boolean'
  );
}

/**
 * Verifica si una latitud tiene valor válido
 *
 * Rango válido: -90 a 90
 *
 * @param lat - Latitud a validar
 * @returns true si es válida
 */
export function isValidLatitud(lat: number): boolean {
  return (
    lat >= UBICACION_VALIDATION.COORDENADAS.LATITUD_MIN &&
    lat <= UBICACION_VALIDATION.COORDENADAS.LATITUD_MAX
  );
}

/**
 * Verifica si una longitud tiene valor válido
 *
 * Rango válido: -180 a 180
 *
 * @param lng - Longitud a validar
 * @returns true si es válida
 */
export function isValidLongitud(lng: number): boolean {
  return (
    lng >= UBICACION_VALIDATION.COORDENADAS.LONGITUD_MIN &&
    lng <= UBICACION_VALIDATION.COORDENADAS.LONGITUD_MAX
  );
}

/**
 * Verifica si un código de ubicación tiene formato válido
 *
 * Código válido: 2-20 caracteres alfanuméricos, guiones y guiones bajos
 * Ejemplos: "UB001", "SEDE-PRINCIPAL", "ubicacion_1"
 *
 * @param codigo - Código a validar
 * @returns true si el formato es válido
 */
export function isValidCodigo(codigo: string): boolean {
  return (
    codigo.length >= UBICACION_VALIDATION.CODIGO.MIN_LENGTH &&
    codigo.length <= UBICACION_VALIDATION.CODIGO.MAX_LENGTH &&
    UBICACION_VALIDATION.CODIGO.REGEX.test(codigo)
  );
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Parsea coordenadas GPS desde formato string a objeto
 *
 * Formato esperado: "latitud,longitud"
 * Ejemplo: "18.486058,-69.931212"
 *
 * @param coordenadas - String con coordenadas GPS
 * @returns Objeto con latitud y longitud, o null si formato inválido
 *
 * @example
 * const coords = parseCoordenadasGPS("18.486058,-69.931212");
 * // { latitud: 18.486058, longitud: -69.931212 }
 *
 * const invalid = parseCoordenadasGPS("invalid");
 * // null
 */
export function parseCoordenadasGPS(coordenadas: string): {
  latitud: number;
  longitud: number;
} | null {
  if (!coordenadas || !UBICACION_VALIDATION.COORDENADAS.REGEX.test(coordenadas)) {
    return null;
  }

  const parts = coordenadas.split(',');
  if (parts.length !== 2) return null;

  const latitud = parseFloat(parts[0].trim());
  const longitud = parseFloat(parts[1].trim());

  if (isNaN(latitud) || isNaN(longitud)) return null;

  if (!isValidLatitud(latitud) || !isValidLongitud(longitud)) {
    return null;
  }

  return { latitud, longitud };
}

/**
 * Formatea coordenadas GPS desde BD a string
 *
 * Si ambas coordenadas son válidas, retorna "latitud,longitud"
 * Si alguna es null, retorna null
 *
 * @param latitud - Latitud desde BD
 * @param longitud - Longitud desde BD
 * @returns String formateado o null
 *
 * @example
 * formatCoordenadasGPS(18.486058, -69.931212) // "18.486058,-69.931212"
 * formatCoordenadasGPS(null, -69.931212)      // null
 * formatCoordenadasGPS(18.486058, null)       // null
 */
export function formatCoordenadasGPS(
  latitud: number | null,
  longitud: number | null
): string | null {
  if (latitud === null || longitud === null) return null;
  return `${latitud},${longitud}`;
}

/**
 * Limpia y normaliza un código de ubicación
 *
 * - Convierte a mayúsculas
 * - Elimina espacios
 * - Reemplaza espacios por guiones
 *
 * @param codigo - Código a normalizar
 * @returns Código normalizado
 *
 * @example
 * normalizeCodigo("sede principal") // "SEDE-PRINCIPAL"
 * normalizeCodigo("ub 001")         // "UB-001"
 */
export function normalizeCodigo(codigo: string): string {
  return codigo.toUpperCase().trim().replace(/\s+/g, '-');
}

/**
 * Convierte CreateUbicacionDTO a NuevaUbicacionDB
 *
 * Prepara el DTO para inserción en BD, estableciendo valores por defecto
 * y parseando coordenadas GPS si se proporcionan.
 *
 * @param dto - DTO de creación
 * @returns Objeto listo para INSERT
 *
 * @example
 * const dto: CreateUbicacionDTO = {
 *   cliente_id: 42,
 *   codigo: "SEDE01",
 *   nombre: "Sede Principal",
 *   coordenadas_gps: "18.486058,-69.931212"
 * };
 *
 * const dbData = dtoToNuevaUbicacionDB(dto);
 * // {
 * //   cliente_id: 42,
 * //   codigo: "SEDE01",
 * //   nombre: "Sede Principal",
 * //   latitud: 18.486058,
 * //   longitud: -69.931212,
 * //   direccion: null,
 * //   ...
 * //   activo: true
 * // }
 */
export function dtoToNuevaUbicacionDB(dto: CreateUbicacionDTO): NuevaUbicacionDB {
  // Parsear coordenadas GPS si se proporcionan
  let latitud: number | null = null;
  let longitud: number | null = null;

  if (dto.coordenadas_gps) {
    const coords = parseCoordenadasGPS(dto.coordenadas_gps);
    if (coords) {
      latitud = coords.latitud;
      longitud = coords.longitud;
    }
  }

  return {
    cliente_id: dto.cliente_id,
    codigo: dto.codigo,
    nombre: dto.nombre,
    direccion: dto.direccion || null,
    provincia: dto.provincia || null,
    municipio: dto.municipio || null,
    sector: dto.sector || null,
    latitud,
    longitud,
    telefono: dto.telefono || null,
    contacto_nombre: dto.contacto_nombre || null,
    contacto_telefono: dto.contacto_telefono || null,
    activo: true // Por defecto activo al crear
  };
}

/**
 * Convierte UpdateUbicacionDTO a UbicacionActualizable
 *
 * Similar a dtoToNuevaUbicacionDB pero para actualizaciones.
 * Solo incluye campos que fueron proporcionados.
 *
 * @param dto - DTO de actualización
 * @returns Objeto con campos a actualizar
 *
 * @example
 * const dto: UpdateUbicacionDTO = {
 *   nombre: "Sede Principal Actualizada",
 *   coordenadas_gps: "18.5,-69.9"
 * };
 *
 * const updateData = dtoToUbicacionActualizable(dto);
 * // {
 * //   nombre: "Sede Principal Actualizada",
 * //   latitud: 18.5,
 * //   longitud: -69.9
 * // }
 */
export function dtoToUbicacionActualizable(dto: UpdateUbicacionDTO): UbicacionActualizable {
  const result: UbicacionActualizable = {};

  // Copiar campos simples si existen
  if (dto.codigo !== undefined) result.codigo = dto.codigo;
  if (dto.nombre !== undefined) result.nombre = dto.nombre;
  if (dto.direccion !== undefined) result.direccion = dto.direccion;
  if (dto.provincia !== undefined) result.provincia = dto.provincia;
  if (dto.municipio !== undefined) result.municipio = dto.municipio;
  if (dto.sector !== undefined) result.sector = dto.sector;
  if (dto.telefono !== undefined) result.telefono = dto.telefono;
  if (dto.contacto_nombre !== undefined) result.contacto_nombre = dto.contacto_nombre;
  if (dto.contacto_telefono !== undefined) result.contacto_telefono = dto.contacto_telefono;
  if (dto.activo !== undefined) result.activo = dto.activo;

  // Parsear coordenadas GPS si se proporcionan
  if (dto.coordenadas_gps !== undefined) {
    if (dto.coordenadas_gps === null) {
      // Usuario quiere borrar coordenadas
      result.latitud = null;
      result.longitud = null;
    } else {
      const coords = parseCoordenadasGPS(dto.coordenadas_gps);
      if (coords) {
        result.latitud = coords.latitud;
        result.longitud = coords.longitud;
      }
    }
  }

  return result;
}

/**
 * Agrega campo coordenadas_gps calculado a una ubicación
 *
 * Útil para agregar el campo virtual coordenadas_gps en responses de API.
 * Retorna nueva ubicación con campo adicional.
 *
 * @param ubicacion - Ubicación desde BD
 * @returns Ubicación con campo coordenadas_gps agregado
 *
 * @example
 * const ubicacionDB: Ubicacion = {
 *   id: 1,
 *   latitud: 18.486058,
 *   longitud: -69.931212,
 *   ...
 * };
 *
 * const ubicacionConCoords = agregarCoordenadasGPS(ubicacionDB);
 * // {
 * //   id: 1,
 * //   latitud: 18.486058,
 * //   longitud: -69.931212,
 * //   coordenadas_gps: "18.486058,-69.931212",
 * //   ...
 * // }
 */
export function agregarCoordenadasGPS<T extends Ubicacion>(
  ubicacion: T
): T & { coordenadas_gps: string | null } {
  return {
    ...ubicacion,
    coordenadas_gps: formatCoordenadasGPS(ubicacion.latitud, ubicacion.longitud)
  };
}
