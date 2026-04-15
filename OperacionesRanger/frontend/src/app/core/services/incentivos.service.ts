import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

export interface Incentivo {
  id: number;
  puesto_id: number;
  monto: number;
  concepto?: string;
  valor_hora: number; // Auto-calculado por backend (GENERATED: monto / 360)
  activo: boolean;
  created_at?: string;
  updated_at?: string;
  puesto?: {
    id: number;
    codigo: string;
    nombre: string;
    ubicacion: {
      id: number;
      nombre: string;
      cliente: {
        id: number;
        nombre: string;
      };
    };
  };
}

export interface IncentivosResponse {
  data: Incentivo[];
  total: number;
}

export interface IncentivosFilters {
  page?: number;
  pageSize?: number;
  puesto_id?: number;
  activo?: boolean;
  search?: string;
}

/**
 * Servicio para gestión de incentivos por puesto.
 * Los incentivos son permanentes (activos hasta que el usuario cambie el status).
 * valor_hora = monto / 360 (15 días × 24 horas) - calculado automáticamente en BD.
 */
@Injectable({
  providedIn: 'root'
})
export class IncentivosService {
  private readonly apiUrl = `${environment.apiBaseUrl}/incentivos`;

  constructor(private http: HttpClient) {}

  /**
   * Obtiene lista paginada de incentivos
   */
  getAll(filters?: IncentivosFilters): Observable<IncentivosResponse> {
    let params = new HttpParams();

    if (filters) {
      if (filters.page !== undefined) {
        params = params.set('page', filters.page.toString());
      }
      if (filters.pageSize !== undefined) {
        params = params.set('pageSize', filters.pageSize.toString());
      }
      if (filters.puesto_id !== undefined) {
        params = params.set('puesto_id', filters.puesto_id.toString());
      }
      if (filters.search) {
        params = params.set('search', filters.search);
      }
      if (filters.activo !== undefined) {
        params = params.set('activo', filters.activo.toString());
      }
    }

    return this.http.get<any>(this.apiUrl, { params }).pipe(
      map(response => ({
        ...response,
        data: response.data.map((item: any) => this.mapIncentivo(item))
      }))
    );
  }

  /**
   * Obtiene un incentivo por ID
   */
  getById(id: number): Observable<Incentivo> {
    return this.http.get<any>(`${this.apiUrl}/${id}`).pipe(
      map(item => this.mapIncentivo(item))
    );
  }

  /**
   * Mapea la respuesta plana del backend a la estructura anidada del frontend
   */
  private mapIncentivo(item: any): Incentivo {
    return {
      id: item.id,
      puesto_id: item.puesto_id,
      monto: item.monto,
      valor_hora: item.valor_hora,
      concepto: item.concepto,
      activo: item.activo,
      created_at: item.created_at,
      updated_at: item.updated_at,
      puesto: item.puesto_nombre ? {
        id: item.puesto_id,
        codigo: item.puesto_codigo,
        nombre: item.puesto_nombre,
        ubicacion: {
          id: item.ubicacion_id,
          nombre: item.ubicacion_nombre,
          cliente: {
            id: item.cliente_id,
            nombre: item.cliente_nombre
          }
        }
      } : item.puesto
    };
  }

  /**
   * Crea un nuevo incentivo
   * El valor_hora se calcula automáticamente en el backend
   */
  create(incentivo: Partial<Incentivo>): Observable<Incentivo> {
    return this.http.post<Incentivo>(this.apiUrl, incentivo);
  }

  /**
   * Actualiza un incentivo existente
   */
  update(id: number, incentivo: Partial<Incentivo>): Observable<Incentivo> {
    return this.http.put<Incentivo>(`${this.apiUrl}/${id}`, incentivo);
  }

  /**
   * Elimina un incentivo
   */
  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  /**
   * Calcula el valor por hora dado un monto
   * Fórmula: valor_hora = monto / 360 (15 días × 24 horas)
   * Esta es una función auxiliar para mostrar el cálculo en el frontend
   * El valor oficial se calcula en el backend como GENERATED column
   */
  calcularValorHora(monto: number): number {
    return monto / 360;
  }

  /**
   * Obtiene incentivos activos (para selectores)
   */
  getActiveIncentivos(): Observable<Incentivo[]> {
    return this.getAll({ activo: true, pageSize: 1000 }).pipe(
      map(response => response.data)
    );
  }
}
