import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

/**
 * Interface para representar un guardián (empleado de seguridad)
 */
export interface Guardian {
  id_empleado: number;
  cedula_empleado: string;
  nombres: string;
  apellidos: string;
  nombre_completo?: string;
  status: number;
  id_puesto?: number;
  puesto?: string;
  fecha_ingreso?: string;
  telefono?: string;
  email?: string;
  direccion?: string;
  foto?: string;
}

/**
 * Interface para la respuesta paginada de guardianes
 */
export interface GuardianesResponse {
  data: Guardian[];
  total: number;
  page?: number;
  pageSize?: number;
  totalPages?: number;
}

/**
 * Interface para filtros de consulta de guardianes
 */
export interface GuardianesFilters {
  status?: number;
  search?: string;
  page?: number;
  pageSize?: number;
}

/**
 * Interface para estadísticas de guardianes
 */
export interface GuardianesEstadisticas {
  total_guardianes: number;
  guardianes_activos: number;
  guardianes_inactivos: number;
}

/**
 * Servicio para integración con el sistema RRHH
 * Maneja consultas de información de empleados (guardianes de seguridad)
 * IMPORTANTE: Este servicio solo tiene acceso de LECTURA a la base de datos RRHH
 */
@Injectable({
  providedIn: 'root'
})
export class RrhhService {
  private apiUrl = `${environment.apiBaseUrl}/rrhh`;

  constructor(private http: HttpClient) {}

  /**
   * Obtener todos los guardianes activos
   * Por defecto solo retorna guardianes con status = 1 (activos)
   */
  getGuardianes(filters?: GuardianesFilters): Observable<GuardianesResponse> {
    let params = new HttpParams();

    // Por defecto, filtrar solo activos
    if (filters) {
      Object.keys(filters).forEach(key => {
        const value = filters[key as keyof GuardianesFilters];
        if (value !== undefined && value !== null) {
          params = params.set(key, String(value));
        }
      });
    } else {
      // Si no se especifican filtros, retornar solo activos
      params = params.set('status', '1');
    }

    return this.http.get<GuardianesResponse>(`${this.apiUrl}/guardianes`, { params });
  }

  /**
   * Obtener un guardián por ID
   */
  getGuardianById(id: number): Observable<Guardian> {
    return this.http.get<Guardian>(`${this.apiUrl}/guardianes/${id}`);
  }

  /**
   * Obtener un guardián por cédula
   */
  getGuardianByCedula(cedula: string): Observable<Guardian> {
    return this.http.get<Guardian>(`${this.apiUrl}/guardianes/cedula/${cedula}`);
  }

  /**
   * Buscar guardianes por nombre, apellido o cédula
   */
  buscarGuardianes(searchTerm: string): Observable<GuardianesResponse> {
    return this.getGuardianes({
      search: searchTerm,
      status: 1 // Solo activos
    });
  }

  /**
   * Obtener todos los guardianes activos (sin paginación)
   */
  getGuardianesActivos(): Observable<GuardianesResponse> {
    return this.getGuardianes({
      status: 1,
      pageSize: 9999 // Obtener todos
    });
  }

  /**
   * Obtener estadísticas de guardianes
   */
  getEstadisticas(): Observable<GuardianesEstadisticas> {
    return this.http.get<GuardianesEstadisticas>(`${this.apiUrl}/guardianes/estadisticas`);
  }

  /**
   * Validar si un empleado es guardián activo
   */
  isGuardianActivo(empleadoId: number): Observable<boolean> {
    return this.http.get<boolean>(`${this.apiUrl}/guardianes/${empleadoId}/is-activo`);
  }

  /**
   * Obtener información básica de múltiples guardianes
   */
  getGuardianesByIds(empleadoIds: number[]): Observable<Guardian[]> {
    const params = new HttpParams().set('ids', empleadoIds.join(','));
    return this.http.get<Guardian[]>(`${this.apiUrl}/guardianes/batch`, { params });
  }
}
