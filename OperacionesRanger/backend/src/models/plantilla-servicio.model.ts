/**
 * Modelo de Plantilla de Servicio
 * Sistema de Gestión de Turnos - OperacionesRanger
 *
 * Define las interfaces, tipos y DTOs para la entidad PlantillaServicio.
 * Las plantillas de servicio son configuraciones reutilizables maestro-detalle
 * que definen qué servicios por puesto conforman una plantilla estándar.
 *
 * Estructura maestro-detalle:
 * - plantillas_servicio (header): nombre, descripcion, activo
 * - plantillas_servicio_detalle (detail): puesto_id, servicio_puesto_id
 *
 * @module models/plantilla-servicio.model
 */

// ============================================================================
// MODELO DE BASE DE DATOS - HEADER
// ============================================================================

/**
 * PlantillaServicio (tabla: plantillas_servicio)
 *
 * Representa el encabezado de una plantilla de servicio.
 * Contiene la información general de la plantilla.
 */
export interface PlantillaServicio {
  /** ID único de la plantilla (auto-increment) */
  id: number;

  /** Nombre de la plantilla */
  nombre: string;

  /** Descripción opcional de la plantilla */
  descripcion: string | null;

  /** Indica si la plantilla está activa (soft delete) */
  activo: boolean;

  /** ID del usuario que creó el registro */
  created_by: number | null;

  /** Fecha de creación del registro */
  created_at: Date;

  /** Fecha de última modificación */
  updated_at: Date;
}

// ============================================================================
// MODELO DE BASE DE DATOS - DETALLE
// ============================================================================

/**
 * PlantillaServicioDetalle (tabla: plantillas_servicio_detalle)
 *
 * Representa una línea de detalle de la plantilla.
 * Vincula un servicio por puesto a la plantilla.
 */
export interface PlantillaServicioDetalle {
  /** ID único del detalle (auto-increment) */
  id: number;

  /** ID de la plantilla padre (FK -> plantillas_servicio.id) */
  plantilla_id: number;

  /** ID del puesto (FK -> puestos.id) */
  puesto_id: number;

  /** ID del servicio por puesto (FK -> servicios_puesto.id) */
  servicio_puesto_id: number;

  /** Fecha de creación del registro */
  created_at: Date;
}

// ============================================================================
// MODELO CON RELACIONES
// ============================================================================

/**
 * Detalle de plantilla con información de relaciones (JOINs)
 *
 * Incluye nombre del puesto, código y tipo de turno del servicio.
 */
export interface PlantillaServicioDetalleConRelaciones extends PlantillaServicioDetalle {
  /** Nombre del puesto */
  puesto_nombre: string;

  /** Código del puesto */
  puesto_codigo: string;

  /** Tipo de turno del servicio por puesto (DIURNO/NOCTURNO) */
  servicio_tipo_turno: string;
}

/**
 * Plantilla completa con detalles y relaciones
 *
 * Usado en: GET /api/plantillas-servicio/:id (detalle completo)
 */
export interface PlantillaConDetalle extends PlantillaServicio {
  /** Array de detalles con relaciones */
  detalles: PlantillaServicioDetalleConRelaciones[];
}

/**
 * Plantilla en listado con conteo de detalles
 *
 * Usado en: GET /api/plantillas-servicio (listado paginado)
 */
export interface PlantillaEnListado extends PlantillaServicio {
  /** Cantidad de detalles asociados a la plantilla */
  detalles_count: number;
}

// ============================================================================
// DATA TRANSFER OBJECTS (DTOs)
// ============================================================================

/**
 * DTO para un detalle al crear/actualizar plantilla
 */
export interface PlantillaDetalleDTO {
  /** ID del puesto (requerido) */
  puesto_id: number;

  /** ID del servicio por puesto (requerido) */
  servicio_puesto_id: number;
}

/**
 * DTO para crear nueva plantilla de servicio
 *
 * Usado en: POST /api/plantillas-servicio
 */
export interface CreatePlantillaDTO {
  /** Nombre de la plantilla (requerido) */
  nombre: string;

  /** Descripción opcional */
  descripcion?: string | null;

  /** Array de detalles (requerido, al menos uno) */
  detalles: PlantillaDetalleDTO[];
}

/**
 * DTO para actualizar plantilla de servicio existente
 *
 * Todos los campos son opcionales.
 * Usado en: PUT /api/plantillas-servicio/:id
 */
export interface UpdatePlantillaDTO {
  /** Nombre de la plantilla */
  nombre?: string;

  /** Descripción */
  descripcion?: string | null;

  /** Array de detalles (si se proporciona, reemplaza todos los existentes) */
  detalles?: PlantillaDetalleDTO[];
}

/**
 * DTO para respuesta paginada de plantillas
 *
 * Usado en: GET /api/plantillas-servicio
 */
export interface PaginatedPlantillasDTO {
  /** Array de plantillas en la página actual */
  data: PlantillaEnListado[];

  /** Total de registros que coinciden con los filtros */
  total: number;

  /** Número de página actual (1-indexed) */
  page: number;

  /** Tamaño de página */
  pageSize: number;

  /** Total de páginas disponibles */
  totalPages: number;
}
