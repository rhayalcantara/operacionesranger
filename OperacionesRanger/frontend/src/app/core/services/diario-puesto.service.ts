import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

/**
 * Interface para representar un registro de diario de puesto
 */
export interface DiarioPuesto {
  id: number;
  puesto_id: number;
  empleado_id: number;
  fecha: string;
  horas: number;
  tipo_turno: 'DIURNO' | 'NOCTURNO';
  origen: 'MANUAL' | 'PLANTILLA';
  puesto_nombre: string;
  puesto_codigo: string;
  ubicacion_nombre: string;
  cliente_nombre: string;
  empleado_nombre: string;
  empleado_cedula: string;
  created_at?: string;
  updated_at?: string;
}

/**
 * Interface para la respuesta paginada del diario de puesto
 */
export interface DiarioPuestoResponse {
  data: DiarioPuesto[];
  total: number;
}

/**
 * Interface para el resultado de poblar desde plantilla
 */
export interface PoblarPlantillaResult {
  insertados: number;
  omitidos: number;
  mensaje?: string;
}

/**
 * Interface para filtros de consulta del diario de puesto
 */
export interface DiarioPuestoFilters {
  page?: number;
  pageSize?: number;
  search?: string;
  fecha?: string;
  cliente_id?: number;
  ubicacion_id?: number;
  puesto_id?: number;
  empleado_id?: number;
  tipo_turno?: string;
}

@Injectable({
  providedIn: 'root'
})
export class DiarioPuestoService {
  private apiUrl = `${environment.apiBaseUrl}/diario-puesto`;

  constructor(private http: HttpClient) {}

  /**
   * Obtiene todos los registros del diario de puesto con filtros opcionales
   */
  getAll(filters?: DiarioPuestoFilters): Observable<DiarioPuestoResponse> {
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
      if (filters.fecha) {
        params = params.set('fecha', filters.fecha);
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
      if (filters.empleado_id !== undefined) {
        params = params.set('empleado_id', filters.empleado_id.toString());
      }
      if (filters.tipo_turno) {
        params = params.set('tipo_turno', filters.tipo_turno);
      }
    }

    return this.http.get<DiarioPuestoResponse>(this.apiUrl, { params });
  }

  /**
   * Obtiene un registro del diario de puesto por ID
   */
  getById(id: number): Observable<DiarioPuesto> {
    return this.http.get<DiarioPuesto>(`${this.apiUrl}/${id}`);
  }

  /**
   * Crea un nuevo registro en el diario de puesto
   */
  create(data: Partial<DiarioPuesto>): Observable<DiarioPuesto> {
    return this.http.post<DiarioPuesto>(this.apiUrl, data);
  }

  /**
   * Actualiza un registro del diario de puesto existente
   */
  update(id: number, data: Partial<DiarioPuesto>): Observable<DiarioPuesto> {
    return this.http.put<DiarioPuesto>(`${this.apiUrl}/${id}`, data);
  }

  /**
   * Elimina un registro del diario de puesto
   */
  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  /**
   * Puebla el diario de puesto desde una plantilla de servicio para una fecha dada
   */
  poblarDesdePlantilla(plantilla_id: number, fecha: string): Observable<PoblarPlantillaResult> {
    return this.http.post<PoblarPlantillaResult>(`${this.apiUrl}/poblar-plantilla`, {
      plantilla_id,
      fecha
    });
  }

  /**
   * Puebla el diario de puesto desde todos los servicios por puesto activos para una fecha dada
   */
  poblarDesdeServicios(fecha: string): Observable<PoblarPlantillaResult> {
    return this.http.post<PoblarPlantillaResult>(`${this.apiUrl}/poblar-servicios`, {
      fecha
    });
  }
}
