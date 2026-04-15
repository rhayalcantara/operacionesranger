/**
 * Modelo de Cliente
 * Representa una empresa que contrata servicios de seguridad
 */

export interface Cliente {
  id: number;
  codigo: string;
  nombre: string;
  ruc: string;
  direccion?: string;
  telefono?: string;
  email?: string;
  contacto_nombre?: string;
  activo: boolean;
  created_at?: string;
  updated_at?: string;
}

/**
 * DTO para crear/actualizar clientes
 */
export interface CreateClienteDto {
  codigo?: string;
  nombre: string;
  ruc: string;
  direccion?: string;
  telefono?: string;
  email?: string;
  contacto_nombre?: string;
  activo?: boolean;
}

/**
 * Respuesta paginada de clientes
 */
export interface ClientesPaginatedResponse {
  data: Cliente[];
  total: number;
  page: number;
  pageSize: number;
}

/**
 * Filtros para búsqueda de clientes
 */
export interface ClienteFilters {
  page?: number;
  pageSize?: number;
  search?: string;
  activo?: boolean;
}
