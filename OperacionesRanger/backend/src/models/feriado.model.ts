/**
 * Modelo de datos: Feriado
 *
 * Define las interfaces TypeScript para la entidad Feriado,
 * que representa días feriados nacionales y por decreto presidencial
 * en República Dominicana.
 *
 * Tabla: feriados
 * Base de datos: turnos_guardianes
 *
 * @module models/feriado.model
 */

/**
 * Tipo de feriado
 *
 * - NACIONAL: Feriados anuales recurrentes (Año Nuevo, Independencia, etc.)
 * - DECRETO: Feriados especiales declarados por decreto presidencial (no recurrentes)
 */
export enum TipoFeriado {
  NACIONAL = 'NACIONAL',
  DECRETO = 'DECRETO',
}

/**
 * Interfaz: Feriado
 *
 * Representa un feriado completo con todos sus campos de base de datos.
 *
 * **Características**:
 * - Fecha única (constraint uk_fecha)
 * - Tipo: NACIONAL (recurrente) o DECRETO (especial)
 * - Descripción opcional para detalles adicionales
 * - Timestamp de creación automático
 *
 * @example
 * ```typescript
 * const feriado: Feriado = {
 *   id: 1,
 *   fecha: '2026-01-01',
 *   nombre: 'Año Nuevo',
 *   tipo: TipoFeriado.NACIONAL,
 *   descripcion: 'Celebración del inicio del año',
 *   created_at: new Date('2026-01-01T00:00:00Z')
 * };
 * ```
 */
export interface Feriado {
  id: number;
  fecha: string; // Formato: YYYY-MM-DD (ISO 8601 date)
  nombre: string;
  tipo: TipoFeriado;
  descripcion: string | null;
  created_at: Date;
}

/**
 * DTO: Crear Feriado
 *
 * Datos requeridos para crear un nuevo feriado.
 * No incluye id ni created_at (generados por BD).
 *
 * **Validaciones esperadas**:
 * - fecha: formato YYYY-MM-DD, no duplicada
 * - nombre: requerido, max 100 caracteres
 * - tipo: NACIONAL o DECRETO
 * - descripcion: opcional, max 500 caracteres
 *
 * @example
 * ```typescript
 * const nuevoFeriado: FeriadoCreateDTO = {
 *   fecha: '2026-12-25',
 *   nombre: 'Día de Navidad',
 *   tipo: TipoFeriado.NACIONAL,
 *   descripcion: 'Celebración del nacimiento de Jesucristo'
 * };
 * ```
 */
export interface FeriadoCreateDTO {
  fecha: string; // YYYY-MM-DD
  nombre: string;
  tipo: TipoFeriado;
  descripcion?: string | null;
}

/**
 * DTO: Actualizar Feriado
 *
 * Datos permitidos para actualizar un feriado existente.
 * Todos los campos son opcionales.
 *
 * **Nota**: Actualizar la fecha puede causar conflicto con constraint uk_fecha.
 *
 * @example
 * ```typescript
 * const actualizacion: FeriadoUpdateDTO = {
 *   nombre: 'Día de la Constitución (actualizado)',
 *   descripcion: 'Conmemoración de la primera constitución'
 * };
 * ```
 */
export interface FeriadoUpdateDTO {
  fecha?: string; // YYYY-MM-DD
  nombre?: string;
  tipo?: TipoFeriado;
  descripcion?: string | null;
}

/**
 * DTO: Respuesta de Verificación de Feriado
 *
 * Respuesta del endpoint GET /api/feriados/verificar/:fecha
 * que utiliza el stored procedure sp_verificar_feriado.
 *
 * **Stored Procedure**:
 * ```sql
 * CALL sp_verificar_feriado(
 *   IN p_fecha DATE,
 *   OUT p_es_feriado BOOLEAN,
 *   OUT p_feriado_id INT,
 *   OUT p_tipo_feriado VARCHAR(20)
 * )
 * ```
 *
 * @example
 * ```typescript
 * // Fecha es feriado
 * const response1: FeriadoVerificacionResponse = {
 *   fecha: '2026-01-01',
 *   es_feriado: true,
 *   feriado: {
 *     id: 1,
 *     nombre: 'Año Nuevo',
 *     tipo: TipoFeriado.NACIONAL
 *   }
 * };
 *
 * // Fecha NO es feriado
 * const response2: FeriadoVerificacionResponse = {
 *   fecha: '2026-01-10',
 *   es_feriado: false,
 *   feriado: null
 * };
 * ```
 */
export interface FeriadoVerificacionResponse {
  fecha: string; // Fecha verificada
  es_feriado: boolean; // Resultado de la verificación
  feriado: {
    id: number;
    nombre: string;
    tipo: TipoFeriado;
  } | null; // Datos del feriado si existe, null si no
}

/**
 * Interfaz: Respuesta Paginada de Feriados
 *
 * Estructura estándar para respuestas paginadas de feriados.
 *
 * @example
 * ```typescript
 * const response: FeriadoPaginatedResponse = {
 *   data: [feriado1, feriado2, feriado3],
 *   total: 15,
 *   page: 1,
 *   pageSize: 10,
 *   totalPages: 2
 * };
 * ```
 */
export interface FeriadoPaginatedResponse {
  data: Feriado[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

/**
 * Interfaz: Filtros de Búsqueda de Feriados
 *
 * Filtros opcionales para endpoint GET /api/feriados
 *
 * **Filtros disponibles**:
 * - año: Filtrar feriados de un año específico (ej: 2026)
 * - tipo: Filtrar por tipo (NACIONAL o DECRETO)
 * - page: Número de página (default: 1)
 * - pageSize: Cantidad de registros por página (default: 10)
 *
 * @example
 * ```typescript
 * const filtros: FeriadoFilters = {
 *   año: 2026,
 *   tipo: TipoFeriado.NACIONAL,
 *   page: 1,
 *   pageSize: 20
 * };
 * ```
 */
export interface FeriadoFilters {
  año?: number; // Año calendario (ej: 2026)
  tipo?: TipoFeriado; // NACIONAL o DECRETO
  page?: number; // Número de página (1-indexed)
  pageSize?: number; // Registros por página
}

/**
 * Type Guard: Verificar si un valor es TipoFeriado válido
 *
 * @param value - Valor a verificar
 * @returns true si es TipoFeriado válido, false en caso contrario
 *
 * @example
 * ```typescript
 * const tipo = 'NACIONAL';
 * if (isTipoFeriado(tipo)) {
 *   // tipo es TipoFeriado.NACIONAL
 * }
 * ```
 */
export function isTipoFeriado(value: any): value is TipoFeriado {
  return Object.values(TipoFeriado).includes(value);
}
