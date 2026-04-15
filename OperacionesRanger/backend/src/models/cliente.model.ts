/**
 * Modelo de Cliente
 * Sistema de Gestión de Turnos - OperacionesRanger
 *
 * Define las interfaces, tipos y DTOs para la entidad Cliente.
 * Los clientes son las empresas o personas que contratan servicios
 * de seguridad (guardianes) de Guardianes Ranger.
 *
 * @module models/cliente.model
 */

// ============================================================================
// MODELO DE BASE DE DATOS
// ============================================================================

/**
 * Cliente (tabla: clientes)
 *
 * Representa una empresa o persona que contrata servicios de seguridad.
 * Un cliente puede tener múltiples ubicaciones donde se presta el servicio.
 */
export interface Cliente {
  /** ID único del cliente (auto-increment) */
  id: number;

  /** Código único identificador del cliente (ej: "CLI001", "BANCO01") */
  codigo: string;

  /** Nombre completo o razón social del cliente */
  nombre: string;

  /** RNC (Registro Nacional de Contribuyentes) o Cédula (9-11 dígitos RD) */
  rnc: string | null;

  /** Teléfono de contacto */
  telefono: string | null;

  /** Email de contacto */
  email: string | null;

  /** Dirección física del cliente */
  direccion: string | null;

  /** Nombre de la persona de contacto principal */
  contacto_nombre: string | null;

  /** Teléfono de la persona de contacto */
  contacto_telefono: string | null;

  /** Indica si el cliente está activo (soft delete) */
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
 * DTO para crear nuevo cliente
 *
 * Usado en: POST /api/clientes
 */
export interface CreateClienteDTO {
  /** Código único identificador (requerido) */
  codigo: string;

  /** Nombre del cliente (requerido) */
  nombre: string;

  /** RNC o Cédula (opcional) */
  rnc?: string | null;

  /** Teléfono (opcional) */
  telefono?: string | null;

  /** Email (opcional) */
  email?: string | null;

  /** Dirección (opcional) */
  direccion?: string | null;

  /** Nombre del contacto (opcional) */
  contacto_nombre?: string | null;

  /** Teléfono del contacto (opcional) */
  contacto_telefono?: string | null;
}

/**
 * DTO para actualizar cliente existente
 *
 * Todos los campos son opcionales.
 * Usado en: PUT /api/clientes/:id
 */
export interface UpdateClienteDTO {
  /** Código único identificador */
  codigo?: string;

  /** Nombre del cliente */
  nombre?: string;

  /** RNC o Cédula */
  rnc?: string | null;

  /** Teléfono */
  telefono?: string | null;

  /** Email */
  email?: string | null;

  /** Dirección */
  direccion?: string | null;

  /** Nombre del contacto */
  contacto_nombre?: string | null;

  /** Teléfono del contacto */
  contacto_telefono?: string | null;

  /** Estado activo/inactivo */
  activo?: boolean;
}

/**
 * DTO para respuesta paginada de clientes
 *
 * Usado en: GET /api/clientes
 */
export interface PaginatedClientesDTO {
  /** Array de clientes en la página actual */
  data: Cliente[];

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
 * DTO para cliente con información adicional (ubicaciones count)
 *
 * Usado en: GET /api/clientes/:id
 */
export interface ClienteConUbicaciones extends Cliente {
  /** Cantidad de ubicaciones activas del cliente */
  ubicaciones_count: number;
}

// ============================================================================
// UTILITY TYPES
// ============================================================================

/**
 * Campos requeridos para insertar cliente en BD
 * (excluye id, timestamps)
 */
export type NuevoClienteDB = Omit<Cliente, 'id' | 'created_at' | 'updated_at'>;

/**
 * Campos actualizables de cliente
 * (excluye id, timestamps)
 */
export type ClienteActualizable = Partial<Omit<Cliente, 'id' | 'created_at' | 'updated_at'>>;

// ============================================================================
// CONSTANTES DE VALIDACIÓN
// ============================================================================

/**
 * Configuración de validación para campos de cliente
 */
export const CLIENTE_VALIDATION = {
  CODIGO: {
    MIN_LENGTH: 2,
    MAX_LENGTH: 20,
    REGEX: /^[A-Z0-9_-]+$/i  // Letras, números, guiones y guiones bajos
  },
  NOMBRE: {
    MIN_LENGTH: 1,
    MAX_LENGTH: 150
  },
  RNC: {
    MIN_LENGTH: 9,  // RNC estándar RD: 9 dígitos
    MAX_LENGTH: 11, // RNC con formato: 000-0000000-0 (11 dígitos)
    REGEX: /^\d{9,11}$/  // Solo dígitos, 9-11 caracteres
  },
  EMAIL: {
    MAX_LENGTH: 100
  },
  TELEFONO: {
    MIN_LENGTH: 10,  // Teléfono RD: (809) 555-1234
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
 * Verifica si un valor es un Cliente válido
 *
 * @param value - Valor a verificar
 * @returns true si es un Cliente válido
 */
export function isCliente(value: unknown): value is Cliente {
  if (!value || typeof value !== 'object') return false;

  const cliente = value as Cliente;

  return (
    typeof cliente.id === 'number' &&
    typeof cliente.codigo === 'string' &&
    typeof cliente.nombre === 'string' &&
    typeof cliente.activo === 'boolean'
  );
}

/**
 * Verifica si un RNC tiene formato válido (República Dominicana)
 *
 * RNC válido: 9-11 dígitos
 * Ejemplos: 123456789, 12345678901
 *
 * @param rnc - RNC a validar
 * @returns true si el formato es válido
 */
export function isValidRNC(rnc: string): boolean {
  return CLIENTE_VALIDATION.RNC.REGEX.test(rnc);
}

/**
 * Verifica si un código de cliente tiene formato válido
 *
 * Código válido: 2-20 caracteres alfanuméricos, guiones y guiones bajos
 * Ejemplos: "CLI001", "BANCO-POPULAR", "cliente_1"
 *
 * @param codigo - Código a validar
 * @returns true si el formato es válido
 */
export function isValidCodigo(codigo: string): boolean {
  return (
    codigo.length >= CLIENTE_VALIDATION.CODIGO.MIN_LENGTH &&
    codigo.length <= CLIENTE_VALIDATION.CODIGO.MAX_LENGTH &&
    CLIENTE_VALIDATION.CODIGO.REGEX.test(codigo)
  );
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Limpia y normaliza un código de cliente
 *
 * - Convierte a mayúsculas
 * - Elimina espacios
 * - Reemplaza espacios por guiones
 *
 * @param codigo - Código a normalizar
 * @returns Código normalizado
 *
 * @example
 * normalizeCodigo("banco popular") // "BANCO-POPULAR"
 * normalizeCodigo("cli 001") // "CLI-001"
 */
export function normalizeCodigo(codigo: string): string {
  return codigo
    .toUpperCase()
    .trim()
    .replace(/\s+/g, '-');
}

/**
 * Limpia y normaliza un RNC
 *
 * - Elimina guiones y espacios
 * - Deja solo dígitos
 *
 * @param rnc - RNC a normalizar
 * @returns RNC normalizado (solo dígitos)
 *
 * @example
 * normalizeRNC("123-4567890-1") // "12345678901"
 * normalizeRNC("123 456 789") // "123456789"
 */
export function normalizeRNC(rnc: string): string {
  return rnc.replace(/[\s-]/g, '');
}

/**
 * Formatea un RNC para visualización
 *
 * Formato: XXX-XXXXXXX-X (si tiene 11 dígitos)
 * Formato: XXXXXXXXX (si tiene 9 dígitos)
 *
 * @param rnc - RNC a formatear (solo dígitos)
 * @returns RNC formateado
 *
 * @example
 * formatRNC("12345678901") // "123-4567890-1"
 * formatRNC("123456789") // "123456789"
 */
export function formatRNC(rnc: string): string {
  if (rnc.length === 11) {
    return `${rnc.slice(0, 3)}-${rnc.slice(3, 10)}-${rnc.slice(10)}`;
  }
  return rnc;
}

/**
 * Convierte CreateClienteDTO a NuevoClienteDB
 *
 * Prepara el DTO para inserción en BD, estableciendo valores por defecto.
 *
 * @param dto - DTO de creación
 * @returns Objeto listo para INSERT
 */
export function dtoToNuevoClienteDB(dto: CreateClienteDTO): NuevoClienteDB {
  return {
    codigo: dto.codigo,
    nombre: dto.nombre,
    rnc: dto.rnc || null,
    telefono: dto.telefono || null,
    email: dto.email || null,
    direccion: dto.direccion || null,
    contacto_nombre: dto.contacto_nombre || null,
    contacto_telefono: dto.contacto_telefono || null,
    activo: true  // Por defecto activo al crear
  };
}
