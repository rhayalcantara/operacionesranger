import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

/**
 * Tipo de feriado
 */
export enum TipoFeriado {
  NACIONAL = 'NACIONAL',
  DECRETO = 'DECRETO'
}

/**
 * Interfaz: Feriado
 */
export interface Feriado {
  id: number;
  fecha: string; // ISO date: YYYY-MM-DD
  nombre: string;
  tipo: TipoFeriado;
  descripcion?: string | null;
  created_at?: string;
}

/**
 * Respuesta paginada de feriados
 */
export interface FeriadosResponse {
  data: Feriado[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

/**
 * Filtros para búsqueda de feriados
 */
export interface FeriadosFilters {
  año?: number;
  tipo?: TipoFeriado;
  page?: number;
  pageSize?: number;
}

/**
 * Respuesta de verificación de feriado
 */
export interface FeriadoVerificacion {
  fecha: string;
  es_feriado: boolean;
  feriado: {
    id: number;
    nombre: string;
    tipo: TipoFeriado;
  } | null;
}

/**
 * Servicio para gestión de feriados nacionales y por decreto
 * Maneja todas las operaciones CRUD para feriados
 */
@Injectable({
  providedIn: 'root'
})
export class FeriadosService {
  private readonly apiUrl = `${environment.apiBaseUrl}/feriados`;

  constructor(private http: HttpClient) {}

  /**
   * Obtiene lista paginada de feriados con filtros
   */
  getAll(filters?: FeriadosFilters): Observable<FeriadosResponse> {
    let params = new HttpParams();

    if (filters) {
      if (filters.page !== undefined) {
        params = params.set('page', filters.page.toString());
      }
      if (filters.pageSize !== undefined) {
        params = params.set('pageSize', filters.pageSize.toString());
      }
      if (filters.año !== undefined) {
        params = params.set('año', filters.año.toString());
      }
      if (filters.tipo) {
        params = params.set('tipo', filters.tipo);
      }
    }

    return this.http.get<FeriadosResponse>(this.apiUrl, { params });
  }

  /**
   * Obtiene un feriado por ID
   */
  getById(id: number): Observable<Feriado> {
    return this.http.get<Feriado>(`${this.apiUrl}/${id}`);
  }

  /**
   * Verifica si una fecha es feriado usando stored procedure
   * @param fecha Fecha en formato YYYY-MM-DD
   */
  verificarFeriado(fecha: string): Observable<FeriadoVerificacion> {
    return this.http.get<FeriadoVerificacion>(`${this.apiUrl}/verificar/${fecha}`);
  }

  /**
   * Crea un nuevo feriado
   */
  create(feriado: Partial<Feriado>): Observable<Feriado> {
    return this.http.post<Feriado>(this.apiUrl, feriado);
  }

  /**
   * Actualiza un feriado existente
   */
  update(id: number, feriado: Partial<Feriado>): Observable<Feriado> {
    return this.http.put<Feriado>(`${this.apiUrl}/${id}`, feriado);
  }

  /**
   * Elimina un feriado
   */
  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  /**
   * Valida si una fecha es única (no existe otro feriado en esa fecha)
   * @param fecha Fecha a validar en formato YYYY-MM-DD
   * @param excludeId ID del feriado a excluir (para edición)
   * @returns Observable<boolean> - true si la fecha es única (válida)
   */
  validarFechaUnica(fecha: string, excludeId?: number): Observable<boolean> {
    // Usar verificarFeriado para validar si ya existe
    return this.verificarFeriado(fecha).pipe(
      map(response => {
        if (!response.es_feriado) {
          return true; // No existe feriado, fecha es válida
        }
        // Si existe, verificar si es el mismo que estamos editando
        if (excludeId !== undefined && response.feriado?.id === excludeId) {
          return true; // Es el mismo feriado que estamos editando
        }
        return false; // Fecha duplicada
      }),
      catchError(() => of(true)) // En caso de error, asumir que es válido
    );
  }

  /**
   * Obtiene feriados por año (sin paginación, para calendario)
   */
  getFeriadosPorAño(año: number): Observable<Feriado[]> {
    return this.getAll({ año, pageSize: 1000 }).pipe(
      map(response => response.data)
    );
  }

  /**
   * Obtiene lista de años disponibles para el selector
   * Retorna años del 2024 al 2030
   */
  getAñosDisponibles(): number[] {
    const añoActual = new Date().getFullYear();
    const años: number[] = [];
    for (let año = 2024; año <= 2030; año++) {
      años.push(año);
    }
    return años;
  }
}
