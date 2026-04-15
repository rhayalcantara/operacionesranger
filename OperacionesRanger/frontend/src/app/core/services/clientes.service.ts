import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

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

export interface ClientesResponse {
  data: Cliente[];
  total: number;
}

export interface ClientesFilters {
  page?: number;
  pageSize?: number;
  search?: string;
  activo?: boolean;
}

/**
 * Servicio para gestión de clientes
 * Maneja todas las operaciones CRUD para clientes
 */
@Injectable({
  providedIn: 'root'
})
export class ClientesService {
  private readonly apiUrl = `${environment.apiBaseUrl}/clientes`;

  constructor(private http: HttpClient) {}

  /**
   * Obtiene lista paginada de clientes
   */
  getAll(filters?: ClientesFilters): Observable<ClientesResponse> {
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

    return this.http.get<ClientesResponse>(this.apiUrl, { params });
  }

  /**
   * Obtiene un cliente por ID
   */
  getById(id: number): Observable<Cliente> {
    return this.http.get<Cliente>(`${this.apiUrl}/${id}`);
  }

  /**
   * Crea un nuevo cliente
   */
  create(cliente: Partial<Cliente>): Observable<Cliente> {
    return this.http.post<Cliente>(this.apiUrl, cliente);
  }

  /**
   * Actualiza un cliente existente
   */
  update(id: number, cliente: Partial<Cliente>): Observable<Cliente> {
    return this.http.put<Cliente>(`${this.apiUrl}/${id}`, cliente);
  }

  /**
   * Elimina un cliente
   */
  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  /**
   * Valida si un RUC es único
   * @param ruc RUC a validar
   * @param excludeId ID del cliente a excluir (para edición)
   * @returns Observable<boolean> - true si el RUC es único (válido)
   */
  validarRucUnico(ruc: string, excludeId?: number): Observable<boolean> {
    let params = new HttpParams().set('ruc', ruc);

    if (excludeId !== undefined) {
      params = params.set('excludeId', excludeId.toString());
    }

    // El endpoint debe retornar { exists: boolean }
    return this.http.get<{ exists: boolean }>(`${this.apiUrl}/validate-ruc`, { params })
      .pipe(
        map(response => !response.exists), // Retorna true si NO existe (es válido)
        catchError(() => of(true)) // En caso de error, asumir que es válido
      );
  }

  /**
   * Obtiene clientes activos (para selectores)
   */
  getActiveClientes(): Observable<Cliente[]> {
    return this.getAll({ activo: true, pageSize: 1000 }).pipe(
      map(response => response.data)
    );
  }

  /**
   * Busca clientes por nombre (para autocomplete)
   */
  searchByName(searchTerm: string): Observable<Cliente[]> {
    if (!searchTerm || searchTerm.trim().length === 0) {
      return of([]);
    }

    return this.getAll({ search: searchTerm, pageSize: 10 }).pipe(
      map(response => response.data)
    );
  }
}
