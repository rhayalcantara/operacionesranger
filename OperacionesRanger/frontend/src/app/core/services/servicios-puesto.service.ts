import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

/**
 * Interface para representar un servicio semanal por puesto
 */
export interface ServicioPuesto {
  id: number;
  puesto_id: number;
  tipo_turno: 'DIURNO' | 'NOCTURNO';
  domingo_empleado_id: number | null;
  lunes_empleado_id: number | null;
  martes_empleado_id: number | null;
  miercoles_empleado_id: number | null;
  jueves_empleado_id: number | null;
  viernes_empleado_id: number | null;
  sabado_empleado_id: number | null;
  domingo_empleado_nombre: string | null;
  lunes_empleado_nombre: string | null;
  martes_empleado_nombre: string | null;
  miercoles_empleado_nombre: string | null;
  jueves_empleado_nombre: string | null;
  viernes_empleado_nombre: string | null;
  sabado_empleado_nombre: string | null;
  puesto_nombre: string;
  puesto_codigo: string;
  ubicacion_nombre: string;
  cliente_nombre: string;
  cobrada: boolean;
  activo: boolean;
  created_at?: string;
  updated_at?: string;
}

/**
 * Interface para la respuesta paginada de servicios por puesto
 */
export interface ServiciosPuestoResponse {
  data: ServicioPuesto[];
  total: number;
}

/**
 * Interface para filtros de consulta
 */
export interface ServiciosPuestoFilters {
  page?: number;
  pageSize?: number;
  search?: string;
  cliente_id?: number;
  ubicacion_id?: number;
  puesto_id?: number;
  tipo_turno?: string;
  cobrada?: boolean;
  activo?: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class ServiciosPuestoService {
  private apiUrl = `${environment.apiBaseUrl}/servicios-puesto`;

  constructor(private http: HttpClient) {}

  /**
   * Obtiene todos los servicios por puesto con filtros opcionales
   */
  getAll(filters?: ServiciosPuestoFilters): Observable<ServiciosPuestoResponse> {
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
      if (filters.cliente_id !== undefined) {
        params = params.set('cliente_id', filters.cliente_id.toString());
      }
      if (filters.ubicacion_id !== undefined) {
        params = params.set('ubicacion_id', filters.ubicacion_id.toString());
      }
      if (filters.puesto_id !== undefined) {
        params = params.set('puesto_id', filters.puesto_id.toString());
      }
      if (filters.tipo_turno) {
        params = params.set('tipo_turno', filters.tipo_turno);
      }
      if (filters.cobrada !== undefined) {
        params = params.set('cobrada', filters.cobrada.toString());
      }
      if (filters.activo !== undefined) {
        params = params.set('activo', filters.activo.toString());
      }
    }

    return this.http.get<ServiciosPuestoResponse>(this.apiUrl, { params });
  }

  /**
   * Obtiene un servicio por puesto por ID
   */
  getById(id: number): Observable<ServicioPuesto> {
    return this.http.get<ServicioPuesto>(`${this.apiUrl}/${id}`);
  }

  /**
   * Crea un nuevo servicio por puesto
   */
  create(data: Partial<ServicioPuesto>): Observable<ServicioPuesto> {
    return this.http.post<ServicioPuesto>(this.apiUrl, data);
  }

  /**
   * Actualiza un servicio por puesto existente
   */
  update(id: number, data: Partial<ServicioPuesto>): Observable<ServicioPuesto> {
    return this.http.put<ServicioPuesto>(`${this.apiUrl}/${id}`, data);
  }

  /**
   * Elimina un servicio por puesto
   */
  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}
