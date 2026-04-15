import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface Puesto {
  id: number;
  ubicacion_id: number;
  codigo: string;
  nombre: string;
  descripcion?: string;
  cantidad_guardianes?: number;
  requiere_turno_diurno?: boolean;
  requiere_turno_nocturno?: boolean;
  activo: boolean;
  created_at?: string;
  updated_at?: string;
  ubicacion?: {
    id: number;
    nombre: string;
    cliente: {
      id: number;
      nombre: string;
    };
  };
}

export interface PuestosResponse {
  data: Puesto[];
  total: number;
}

export interface PuestosFilters {
  page?: number;
  pageSize?: number;
  search?: string;
  ubicacion_id?: number;
  cliente_id?: number;
  activo?: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class PuestosService {
  private apiUrl = `${environment.apiBaseUrl}/puestos`;

  constructor(private http: HttpClient) {}

  /**
   * Obtiene todos los puestos con filtros opcionales
   */
  getAll(filters?: PuestosFilters): Observable<PuestosResponse> {
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
      if (filters.ubicacion_id !== undefined) {
        params = params.set('ubicacion_id', filters.ubicacion_id.toString());
      }
      if (filters.cliente_id !== undefined) {
        params = params.set('cliente_id', filters.cliente_id.toString());
      }
      if (filters.activo !== undefined) {
        params = params.set('activo', filters.activo.toString());
      }
    }

    return this.http.get<PuestosResponse>(this.apiUrl, { params });
  }

  /**
   * Obtiene un puesto por ID
   */
  getById(id: number): Observable<Puesto> {
    return this.http.get<Puesto>(`${this.apiUrl}/${id}`);
  }

  /**
   * Obtiene todos los puestos de una ubicación específica
   */
  getByUbicacion(ubicacionId: number): Observable<Puesto[]> {
    const params = new HttpParams()
      .set('ubicacion_id', ubicacionId.toString())
      .set('pageSize', '1000'); // Obtener todos

    return this.http.get<Puesto[]>(this.apiUrl, { params });
  }

  /**
   * Obtiene todos los puestos de un cliente específico
   */
  getByCliente(clienteId: number): Observable<Puesto[]> {
    const params = new HttpParams()
      .set('cliente_id', clienteId.toString())
      .set('pageSize', '1000'); // Obtener todos

    return this.http.get<Puesto[]>(this.apiUrl, { params });
  }

  /**
   * Obtiene los turnos asociados a un puesto
   */
  getTurnosByPuesto(puestoId: number): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/${puestoId}/turnos`);
  }

  /**
   * Crea un nuevo puesto
   */
  create(puesto: Partial<Puesto>): Observable<Puesto> {
    return this.http.post<Puesto>(this.apiUrl, puesto);
  }

  /**
   * Actualiza un puesto existente
   */
  update(id: number, puesto: Partial<Puesto>): Observable<Puesto> {
    return this.http.put<Puesto>(`${this.apiUrl}/${id}`, puesto);
  }

  /**
   * Elimina un puesto
   */
  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  /**
   * Valida si un código es único dentro de una ubicación
   */
  validarCodigoUnico(
    ubicacionId: number,
    codigo: string,
    excludeId?: number
  ): Observable<boolean> {
    let params = new HttpParams()
      .set('ubicacion_id', ubicacionId.toString())
      .set('codigo', codigo);

    if (excludeId !== undefined) {
      params = params.set('excludeId', excludeId.toString());
    }

    return this.http.get<boolean>(`${this.apiUrl}/validar-codigo`, { params });
  }
}
