import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface Ubicacion {
  id: number;
  cliente_id: number;
  codigo: string;
  nombre: string;
  direccion?: string;
  provincia?: string;
  municipio?: string;
  coordenadas_gps?: string;
  activo: boolean;
  created_at?: string;
  updated_at?: string;
  cliente?: { id: number; nombre: string }; // Join
}

export interface UbicacionesResponse {
  data: Ubicacion[];
  total: number;
}

export interface UbicacionesFilters {
  page?: number;
  pageSize?: number;
  search?: string;
  cliente_id?: number;
  activo?: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class UbicacionesService {
  private apiUrl = `${environment.apiBaseUrl}/ubicaciones`;

  constructor(private http: HttpClient) {}

  /**
   * Obtiene todas las ubicaciones con filtros opcionales
   */
  getAll(filters?: UbicacionesFilters): Observable<UbicacionesResponse> {
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
      if (filters.activo !== undefined) {
        params = params.set('activo', filters.activo.toString());
      }
    }

    return this.http.get<UbicacionesResponse>(this.apiUrl, { params });
  }

  /**
   * Obtiene una ubicación por ID
   */
  getById(id: number): Observable<Ubicacion> {
    return this.http.get<Ubicacion>(`${this.apiUrl}/${id}`);
  }

  /**
   * Obtiene todas las ubicaciones de un cliente específico
   */
  getByCliente(clienteId: number): Observable<Ubicacion[]> {
    const params = new HttpParams()
      .set('cliente_id', clienteId.toString())
      .set('pageSize', '1000'); // Obtener todas

    return this.http.get<Ubicacion[]>(this.apiUrl, { params });
  }

  /**
   * Crea una nueva ubicación
   */
  create(ubicacion: Partial<Ubicacion>): Observable<Ubicacion> {
    return this.http.post<Ubicacion>(this.apiUrl, ubicacion);
  }

  /**
   * Actualiza una ubicación existente
   */
  update(id: number, ubicacion: Partial<Ubicacion>): Observable<Ubicacion> {
    return this.http.put<Ubicacion>(`${this.apiUrl}/${id}`, ubicacion);
  }

  /**
   * Elimina una ubicación
   */
  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  /**
   * Valida si un código es único dentro de un cliente
   */
  validarCodigoUnico(
    clienteId: number,
    codigo: string,
    excludeId?: number
  ): Observable<boolean> {
    let params = new HttpParams()
      .set('cliente_id', clienteId.toString())
      .set('codigo', codigo);

    if (excludeId !== undefined) {
      params = params.set('excludeId', excludeId.toString());
    }

    return this.http.get<boolean>(`${this.apiUrl}/validar-codigo`, { params });
  }
}
