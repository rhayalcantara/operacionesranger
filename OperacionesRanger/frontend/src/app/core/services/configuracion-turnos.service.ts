import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

/**
 * Tipo de turno (DIURNO o NOCTURNO)
 */
export enum TipoTurno {
  DIURNO = 'DIURNO',
  NOCTURNO = 'NOCTURNO'
}

/**
 * Interface para configuración de turno
 */
export interface ConfiguracionTurno {
  id: number;
  tipo: TipoTurno;
  hora_inicio: string; // Formato: "HH:mm:ss"
  hora_fin: string; // Formato: "HH:mm:ss"
  descripcion?: string;
  activo: boolean;
  created_at?: string;
  updated_at?: string;
}

/**
 * Interface para actualizar configuración de turno
 */
export interface UpdateConfiguracionTurnoDto {
  hora_inicio?: string;
  hora_fin?: string;
  descripcion?: string;
  activo?: boolean;
}

/**
 * Servicio para gestión de configuración de turnos
 * Maneja las operaciones de lectura y actualización de horarios día/noche
 */
@Injectable({
  providedIn: 'root'
})
export class ConfiguracionTurnosService {
  private readonly apiUrl = `${environment.apiBaseUrl}/configuracion-turnos`;

  constructor(private http: HttpClient) {}

  /**
   * Obtiene todas las configuraciones de turnos (DIURNO y NOCTURNO)
   */
  getAll(): Observable<ConfiguracionTurno[]> {
    return this.http.get<{ data: ConfiguracionTurno[] }>(this.apiUrl).pipe(
      map(response => response.data)
    );
  }

  /**
   * Obtiene una configuración de turno por ID
   */
  getById(id: number): Observable<ConfiguracionTurno> {
    return this.http.get<ConfiguracionTurno>(`${this.apiUrl}/${id}`);
  }

  /**
   * Obtiene la configuración de un tipo específico (DIURNO o NOCTURNO)
   */
  getByTipo(tipo: TipoTurno): Observable<ConfiguracionTurno> {
    const params = new HttpParams().set('tipo', tipo);
    return this.http.get<ConfiguracionTurno>(`${this.apiUrl}/tipo`, { params });
  }

  /**
   * Actualiza una configuración de turno existente
   * @param id ID de la configuración a actualizar
   * @param config Datos a actualizar
   */
  update(id: number, config: UpdateConfiguracionTurnoDto): Observable<ConfiguracionTurno> {
    return this.http.put<ConfiguracionTurno>(`${this.apiUrl}/${id}`, config);
  }

  /**
   * Convierte hora en formato "HH:mm" a "HH:mm:ss" para el backend
   */
  formatTimeForBackend(time: string): string {
    if (!time) return '';

    // Si ya tiene formato HH:mm:ss, retornar tal cual
    if (time.match(/^\d{2}:\d{2}:\d{2}$/)) {
      return time;
    }

    // Si tiene formato HH:mm, agregar :00
    if (time.match(/^\d{2}:\d{2}$/)) {
      return `${time}:00`;
    }

    return time;
  }

  /**
   * Convierte hora en formato "HH:mm:ss" a "HH:mm" para el formulario
   */
  formatTimeForForm(time: string): string {
    if (!time) return '';

    // Extraer solo HH:mm
    const match = time.match(/^(\d{2}:\d{2})/);
    return match ? match[1] : time;
  }

  /**
   * Valida que los horarios no se solapen
   * @param diurnoInicio Hora inicio del turno diurno
   * @param diurnoFin Hora fin del turno diurno
   * @param nocturnoInicio Hora inicio del turno nocturno
   * @param nocturnoFin Hora fin del turno nocturno
   * @returns true si no hay solapamiento
   */
  validateNoOverlap(
    diurnoInicio: string,
    diurnoFin: string,
    nocturnoInicio: string,
    nocturnoFin: string
  ): { valid: boolean; message?: string } {
    // Convertir a minutos desde medianoche para comparar
    const parseTime = (time: string): number => {
      const [hours, minutes] = time.split(':').map(Number);
      return hours * 60 + minutes;
    };

    const diInicio = parseTime(diurnoInicio);
    const diFin = parseTime(diurnoFin);
    const noInicio = parseTime(nocturnoInicio);
    const noFin = parseTime(nocturnoFin);

    // Validar que hora_inicio < hora_fin para cada turno
    if (diInicio >= diFin) {
      return {
        valid: false,
        message: 'Turno DIURNO: La hora de inicio debe ser menor a la hora de fin'
      };
    }

    // Para turno nocturno, permitir que hora_fin sea menor (cruce de medianoche)
    // Ejemplo: 18:00 - 06:00 es válido

    // Validar que los turnos no se solapen
    // Turno diurno debe terminar cuando comienza el nocturno
    if (diFin !== noInicio) {
      return {
        valid: false,
        message: 'El turno DIURNO debe terminar exactamente cuando comienza el turno NOCTURNO'
      };
    }

    // Turno nocturno debe terminar cuando comienza el diurno
    // (considerando el cruce de medianoche)
    if (noFin !== diInicio) {
      return {
        valid: false,
        message: 'El turno NOCTURNO debe terminar exactamente cuando comienza el turno DIURNO'
      };
    }

    return { valid: true };
  }
}
