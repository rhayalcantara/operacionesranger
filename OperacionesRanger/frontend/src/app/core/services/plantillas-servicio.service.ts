import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

/**
 * Detalle de una plantilla de servicio (un servicio-puesto asignado)
 */
export interface PlantillaDetalle {
  id?: number;
  plantilla_id?: number;
  puesto_id: number;
  servicio_puesto_id: number;
  puesto_nombre?: string;
  puesto_codigo?: string;
  servicio_tipo_turno?: string;
  ubicacion_nombre?: string;
  cliente_nombre?: string;
}

/**
 * Plantilla de servicio (cabecera)
 */
export interface PlantillaServicio {
  id: number;
  nombre: string;
  descripcion: string | null;
  activo: boolean;
  cantidad_detalles?: number;
  created_at?: string;
  updated_at?: string;
}

/**
 * Plantilla con sus detalles incluidos
 */
export interface PlantillaConDetalle extends PlantillaServicio {
  detalles: PlantillaDetalle[];
}

/**
 * Respuesta paginada de plantillas
 */
export interface PlantillasServicioResponse {
  data: PlantillaServicio[];
  total: number;
}

/**
 * Filtros de consulta para plantillas
 */
export interface PlantillasServicioFilters {
  page?: number;
  pageSize?: number;
  search?: string;
  activo?: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class PlantillasServicioService {
  private apiUrl = `${environment.apiBaseUrl}/plantillas-servicio`;

  constructor(private http: HttpClient) {}

  /**
   * Obtiene todas las plantillas con filtros opcionales
   */
  getAll(filters?: PlantillasServicioFilters): Observable<PlantillasServicioResponse> {
    let params = new HttpParams();

    if (filters) {
      if (filters.page !== undefined) {
        params = params.set('page', filters.page.toString());
      }
      if (filters.pageSize !== undefined) {
        params = params.set('pageSize', filters.pageSize.toString());
      }
      if (filters.search) {
        params = params.set('search', filters.search);
      }
      if (filters.activo !== undefined) {
        params = params.set('activo', filters.activo.toString());
      }
    }

    return this.http.get<PlantillasServicioResponse>(this.apiUrl, { params });
  }

  /**
   * Obtiene una plantilla por ID con sus detalles
   */
  getById(id: number): Observable<PlantillaConDetalle> {
    return this.http.get<PlantillaConDetalle>(`${this.apiUrl}/${id}`);
  }

  /**
   * Crea una nueva plantilla con sus detalles
   */
  create(data: { nombre: string; descripcion?: string; activo?: boolean; detalles: Partial<PlantillaDetalle>[] }): Observable<PlantillaConDetalle> {
    return this.http.post<PlantillaConDetalle>(this.apiUrl, data);
  }

  /**
   * Actualiza una plantilla existente y sus detalles
   */
  update(id: number, data: { nombre: string; descripcion?: string; activo?: boolean; detalles: Partial<PlantillaDetalle>[] }): Observable<PlantillaConDetalle> {
    return this.http.put<PlantillaConDetalle>(`${this.apiUrl}/${id}`, data);
  }

  /**
   * Elimina una plantilla
   */
  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}
