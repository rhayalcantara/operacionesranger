import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface CronogramaDetalle {
  id?: number;
  cronograma_id?: number;
  dia_semana: number; // 0=Domingo, 1=Lunes ... 6=Sabado
  puesto_id: number;
  empleado_id: number;
  tipo_turno: 'DIURNO' | 'NOCTURNO';
  puesto_nombre?: string;
  empleado_nombre?: string;
}

export interface Cronograma {
  id: number;
  nombre: string;
  descripcion?: string;
  activo: boolean;
  detalles_count?: number;
  created_at?: string;
  updated_at?: string;
}

export interface CronogramaConDetalle extends Cronograma {
  detalles: CronogramaDetalle[];
}

export interface CronogramasResponse {
  data: Cronograma[];
  total: number;
}

export interface CronogramasFilters {
  page?: number;
  pageSize?: number;
  search?: string;
  activo?: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class CronogramasService {
  private apiUrl = `${environment.apiBaseUrl}/cronogramas`;

  constructor(private http: HttpClient) {}

  /**
   * Obtiene todos los cronogramas con filtros opcionales
   */
  getAll(filters?: CronogramasFilters): Observable<CronogramasResponse> {
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

    return this.http.get<CronogramasResponse>(this.apiUrl, { params });
  }

  /**
   * Obtiene un cronograma por ID con sus detalles
   */
  getById(id: number): Observable<CronogramaConDetalle> {
    return this.http.get<CronogramaConDetalle>(`${this.apiUrl}/${id}`);
  }

  /**
   * Crea un nuevo cronograma con detalles
   */
  create(data: { nombre: string; descripcion?: string; activo?: boolean; detalles: CronogramaDetalle[] }): Observable<CronogramaConDetalle> {
    return this.http.post<CronogramaConDetalle>(this.apiUrl, data);
  }

  /**
   * Actualiza un cronograma existente con detalles
   */
  update(id: number, data: { nombre?: string; descripcion?: string; activo?: boolean; detalles?: CronogramaDetalle[] }): Observable<CronogramaConDetalle> {
    return this.http.put<CronogramaConDetalle>(`${this.apiUrl}/${id}`, data);
  }

  /**
   * Elimina un cronograma (soft delete)
   */
  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}
