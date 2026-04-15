import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

/**
 * Interface para representar un turno
 */
export interface Turno {
  id: number;
  empleado_id: number;
  puesto_id: number;
  fecha: string;
  hora_entrada: string;
  hora_salida: string;
  horas_normales: number;
  horas_extras: number;
  tipo_turno: 'DIURNO' | 'NOCTURNO';
  es_feriado: boolean;
  tipo_feriado?: 'NACIONAL' | 'DECRETO';
  procesado_nomina: boolean;
  nomina_id?: number;
  observaciones?: string;
  created_at?: string;
  updated_at?: string;
  created_by?: number;
  updated_by?: number;
  // Joined data
  empleado?: {
    id: number;
    nombre: string;
    cedula: string;
  };
  puesto?: {
    id: number;
    nombre: string;
    codigo: string;
  };
  // Flat joined fields from backend
  ubicacion_id?: number;
  ubicacion_nombre?: string;
  ubicacion_codigo?: string;
  cliente_id?: number;
  cliente_nombre?: string;
}

/**
 * Interface para la respuesta paginada de turnos
 */
export interface TurnosResponse {
  data: Turno[];
  total: number;
  page?: number;
  pageSize?: number;
  totalPages?: number;
}

/**
 * Interface para filtros de consulta
 */
export interface TurnosFilters {
  fecha_inicio?: string;
  fecha_fin?: string;
  empleado_id?: number;
  puesto_id?: number;
  procesado_nomina?: boolean;
  tipo_turno?: 'DIURNO' | 'NOCTURNO';
  es_feriado?: boolean;
  page?: number;
  pageSize?: number;
  search?: string;
}

/**
 * Interface para crear/actualizar turno
 */
export interface TurnoCreateUpdate {
  empleado_id: number;
  puesto_id: number;
  fecha: string;
  hora_entrada: string;
  hora_salida: string;
  horas_normales: number;
  horas_extras: number;
  observaciones?: string;
}

/**
 * Alias para crear turno (compatibilidad con la nomenclatura del plan)
 */
export type TurnoCreateRequest = TurnoCreateUpdate;

/**
 * Interface para estadísticas de turnos
 */
export interface TurnosEstadisticas {
  total_turnos: number;
  total_horas_normales: number;
  total_horas_extras: number;
  turnos_procesados: number;
  turnos_pendientes: number;
  turnos_en_feriado: number;
}

/**
 * Interface para resumen de empleado
 */
export interface ResumenEmpleado {
  empleado_id: number;
  nombre_empleado: string;
  cedula_empleado?: string;
  total_turnos: number;
  total_horas_normales: number;
  total_horas_extras: number;
  total_horas: number; // Normales + Extras
  turnos_diurnos: number;
  turnos_nocturnos: number;
  turnos_feriados: number;
  turnos?: Turno[]; // Lista detallada de turnos
}

/**
 * Servicio para gestión de turnos
 * Maneja todas las operaciones CRUD y consultas relacionadas con turnos
 */
@Injectable({
  providedIn: 'root'
})
export class TurnosService {
  private apiUrl = `${environment.apiBaseUrl}/turnos`;

  constructor(private http: HttpClient) {}

  /**
   * Obtener todos los turnos con filtros opcionales
   */
  getAll(filters?: TurnosFilters): Observable<TurnosResponse> {
    let params = new HttpParams();

    if (filters) {
      Object.keys(filters).forEach(key => {
        const value = filters[key as keyof TurnosFilters];
        if (value !== undefined && value !== null) {
          params = params.set(key, String(value));
        }
      });
    }

    return this.http.get<TurnosResponse>(this.apiUrl, { params });
  }

  /**
   * Obtener un turno por ID
   */
  getById(id: number): Observable<Turno> {
    return this.http.get<Turno>(`${this.apiUrl}/${id}`);
  }

  /**
   * Crear un nuevo turno
   */
  create(turno: TurnoCreateUpdate): Observable<Turno> {
    return this.http.post<Turno>(this.apiUrl, turno);
  }

  /**
   * Actualizar un turno existente
   */
  update(id: number, turno: Partial<TurnoCreateUpdate>): Observable<Turno> {
    return this.http.put<Turno>(`${this.apiUrl}/${id}`, turno);
  }

  /**
   * Eliminar un turno
   */
  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  /**
   * Obtener estadísticas de turnos para un rango de fechas
   */
  getEstadisticas(fechaInicio: string, fechaFin: string): Observable<TurnosEstadisticas> {
    const params = new HttpParams()
      .set('fecha_inicio', fechaInicio)
      .set('fecha_fin', fechaFin);

    return this.http.get<TurnosEstadisticas>(`${this.apiUrl}/estadisticas`, { params });
  }

  /**
   * Marcar turnos como procesados en nómina
   */
  marcarProcesados(turnoIds: number[], nominaId: number): Observable<void> {
    return this.http.post<void>(`${this.apiUrl}/marcar-procesados`, {
      turnoIds,
      nominaId
    });
  }

  /**
   * Obtener turnos por empleado
   */
  getByEmpleado(empleadoId: number, fechaInicio?: string, fechaFin?: string): Observable<TurnosResponse> {
    return this.getAll({
      empleado_id: empleadoId,
      fecha_inicio: fechaInicio,
      fecha_fin: fechaFin
    });
  }

  /**
   * Obtener turnos por puesto
   */
  getByPuesto(puestoId: number, fechaInicio?: string, fechaFin?: string): Observable<TurnosResponse> {
    return this.getAll({
      puesto_id: puestoId,
      fecha_inicio: fechaInicio,
      fecha_fin: fechaFin
    });
  }

  /**
   * Obtener turnos pendientes de procesar
   */
  getPendientes(): Observable<TurnosResponse> {
    return this.getAll({
      procesado_nomina: false
    });
  }

  /**
   * Obtener turnos del mes actual
   */
  getTurnosMesActual(): Observable<TurnosResponse> {
    const hoy = new Date();
    const primerDia = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
    const ultimoDia = new Date(hoy.getFullYear(), hoy.getMonth() + 1, 0);

    return this.getAll({
      fecha_inicio: this.formatDate(primerDia),
      fecha_fin: this.formatDate(ultimoDia)
    });
  }

  /**
   * Validar si existe un turno duplicado
   * Returns true if unique (no duplicate), false if duplicate exists
   */
  validarDuplicado(
    empleadoId: number,
    puestoId: number,
    fecha: string,
    excludeId?: number
  ): Observable<boolean> {
    let params = new HttpParams()
      .set('empleado_id', empleadoId.toString())
      .set('puesto_id', puestoId.toString())
      .set('fecha', fecha);

    if (excludeId) {
      params = params.set('exclude_id', excludeId.toString());
    }

    return this.http.get<boolean>(`${this.apiUrl}/validar-duplicado`, { params });
  }

  /**
   * Get employee summary for a date range
   */
  getResumenEmpleado(
    empleadoId: number,
    fechaInicio: string,
    fechaFin: string
  ): Observable<ResumenEmpleado> {
    const params = new HttpParams()
      .set('fecha_inicio', fechaInicio)
      .set('fecha_fin', fechaFin);

    return this.http.get<ResumenEmpleado>(`${this.apiUrl}/empleado/${empleadoId}/resumen`, { params });
  }

  /**
   * Calculate normal hours from entry and exit times
   * Handles overnight shifts
   */
  calcularHorasNormales(horaEntrada: string, horaSalida: string): number {
    const entrada = this.parseTime(horaEntrada);
    const salida = this.parseTime(horaSalida);

    if (!entrada || !salida) {
      return 0;
    }

    let diff = salida - entrada;

    // Handle overnight shift (e.g., 22:00 to 06:00)
    if (diff < 0) {
      diff += 24 * 60; // Add 24 hours in minutes
    }

    // Convert to hours with 2 decimal precision
    return Math.round((diff / 60) * 100) / 100;
  }

  /**
   * Format time for backend (HH:mm → HH:mm:ss)
   */
  formatTimeForBackend(time: string): string {
    if (!time) return '';

    // If already in HH:mm:ss format, return as is
    if (time.match(/^\d{2}:\d{2}:\d{2}$/)) {
      return time;
    }

    // If in HH:mm format, add seconds
    if (time.match(/^\d{2}:\d{2}$/)) {
      return `${time}:00`;
    }

    return time;
  }

  /**
   * Format time for form (HH:mm:ss → HH:mm)
   */
  formatTimeForForm(time: string): string {
    if (!time) return '';

    // If already in HH:mm format, return as is
    if (time.match(/^\d{2}:\d{2}$/)) {
      return time;
    }

    // If in HH:mm:ss format, remove seconds
    if (time.match(/^\d{2}:\d{2}:\d{2}$/)) {
      return time.substring(0, 5);
    }

    return time;
  }

  /**
   * Parse time string (HH:mm or HH:mm:ss) to minutes since midnight
   */
  private parseTime(time: string): number | null {
    if (!time) return null;

    const parts = time.split(':');
    if (parts.length < 2) return null;

    const hours = parseInt(parts[0], 10);
    const minutes = parseInt(parts[1], 10);

    if (isNaN(hours) || isNaN(minutes)) return null;

    return hours * 60 + minutes;
  }

  /**
   * Formatear fecha a YYYY-MM-DD
   */
  private formatDate(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
}
