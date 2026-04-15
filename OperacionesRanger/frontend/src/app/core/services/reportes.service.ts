import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

/**
 * Interface para los parámetros del reporte de nómina
 */
export interface ReporteNominaParams {
  fecha_inicio: string; // YYYY-MM-DD
  fecha_fin: string;    // YYYY-MM-DD
}

/**
 * Interface para un item de vista previa del reporte
 */
export interface VistaPreviaItem {
  fecha: string;
  empleado_id: number;
  empleado_nombre: string;
  empleado_cedula: string;
  puesto_codigo: string;
  puesto_nombre: string;
  horas_normales: number;
  horas_extras: number;
  tipo_turno: 'DIURNO' | 'NOCTURNO';
  es_feriado: boolean;
  tipo_feriado?: string;
  incentivo: number;
}

/**
 * Interface para el resumen del reporte
 */
export interface ResumenReporte {
  total_horas_normales: number;
  total_horas_extras: number;
  total_turnos: number;
  turnos_diurnos: number;
  turnos_nocturnos: number;
  turnos_feriados: number;
  total_incentivos: number;
}

/**
 * Interface para la respuesta de vista previa
 */
export interface VistaPreviaResponse {
  data: VistaPreviaItem[];
  total: number;
  resumen: ResumenReporte;
}

/**
 * Interface para un registro del historial de reportes
 */
export interface HistorialReporte {
  id: number;
  usuario: {
    id: number;
    username: string;
    nombre_completo: string;
  };
  fecha_inicio: string;
  fecha_fin: string;
  cantidad_turnos: number;
  fecha_generacion: string;
  nomina_id: number | null;
  nombre_archivo: string;
}

/**
 * Interface para respuesta paginada del historial
 */
export interface HistorialResponse {
  data: HistorialReporte[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

/**
 * Interface para marcar turnos como procesados
 */
export interface MarcarProcesadosParams {
  fecha_inicio: string;
  fecha_fin: string;
  nomina_id: number;
}

/**
 * Interface para respuesta de marcar procesados
 */
export interface MarcarProcesadosResponse {
  turnos_procesados: number;
  nomina_id: number;
  fecha_inicio: string;
  fecha_fin: string;
}

/**
 * Servicio para gestión de reportes
 * Maneja la generación de reportes CSV para integración con sistema de nómina
 */
@Injectable({
  providedIn: 'root'
})
export class ReportesService {
  private apiUrl = `${environment.apiBaseUrl}/reportes`;

  constructor(private http: HttpClient) {}

  /**
   * Obtener vista previa de los datos que se exportarán
   * Limitado a 50 registros para rendimiento
   */
  vistaPrevia(fechaInicio: string, fechaFin: string): Observable<VistaPreviaResponse> {
    const params = new HttpParams()
      .set('fecha_inicio', fechaInicio)
      .set('fecha_fin', fechaFin);

    return this.http.get<VistaPreviaResponse>(`${this.apiUrl}/nomina/vista-previa`, { params });
  }

  /**
   * Generar y descargar reporte CSV completo
   * Retorna un Blob con el archivo CSV
   */
  generarReporteNomina(params: ReporteNominaParams): Observable<Blob> {
    return this.http.post(`${this.apiUrl}/nomina`, params, {
      responseType: 'blob',
      observe: 'body'
    });
  }

  /**
   * Obtener historial de reportes generados (paginado)
   */
  getHistorial(page: number = 1, pageSize: number = 10): Observable<HistorialResponse> {
    const params = new HttpParams()
      .set('page', page.toString())
      .set('pageSize', pageSize.toString());

    return this.http.get<HistorialResponse>(`${this.apiUrl}/historial`, { params });
  }

  /**
   * Marcar turnos como procesados en nómina
   */
  marcarProcesados(data: MarcarProcesadosParams): Observable<MarcarProcesadosResponse> {
    return this.http.post<MarcarProcesadosResponse>(`${this.apiUrl}/marcar-procesados`, data);
  }

  /**
   * Descargar reporte histórico por ID
   */
  descargarReporte(id: number): Observable<Blob> {
    return this.http.get(`${this.apiUrl}/${id}/descargar`, {
      responseType: 'blob',
      observe: 'body'
    });
  }

  /**
   * Helper para formatear fecha a YYYY-MM-DD
   */
  formatDate(date: Date | string): string {
    if (typeof date === 'string') return date;

    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  /**
   * Helper para calcular quincena actual
   * Retorna objeto con fecha_inicio y fecha_fin
   */
  getQuincenaActual(): { fecha_inicio: string; fecha_fin: string } {
    const hoy = new Date();
    const dia = hoy.getDate();

    if (dia <= 15) {
      // Primera quincena (1-15)
      return {
        fecha_inicio: this.formatDate(new Date(hoy.getFullYear(), hoy.getMonth(), 1)),
        fecha_fin: this.formatDate(new Date(hoy.getFullYear(), hoy.getMonth(), 15))
      };
    } else {
      // Segunda quincena (16-fin de mes)
      return {
        fecha_inicio: this.formatDate(new Date(hoy.getFullYear(), hoy.getMonth(), 16)),
        fecha_fin: this.formatDate(new Date(hoy.getFullYear(), hoy.getMonth() + 1, 0))
      };
    }
  }

  /**
   * Helper para calcular quincena anterior
   */
  getQuincenaAnterior(): { fecha_inicio: string; fecha_fin: string } {
    const hoy = new Date();
    const dia = hoy.getDate();

    if (dia <= 15) {
      // Si estamos en la primera quincena, devolver segunda del mes anterior
      return {
        fecha_inicio: this.formatDate(new Date(hoy.getFullYear(), hoy.getMonth() - 1, 16)),
        fecha_fin: this.formatDate(new Date(hoy.getFullYear(), hoy.getMonth(), 0))
      };
    } else {
      // Si estamos en la segunda quincena, devolver primera del mes actual
      return {
        fecha_inicio: this.formatDate(new Date(hoy.getFullYear(), hoy.getMonth(), 1)),
        fecha_fin: this.formatDate(new Date(hoy.getFullYear(), hoy.getMonth(), 15))
      };
    }
  }

  /**
   * Helper para calcular mes actual
   */
  getMesActual(): { fecha_inicio: string; fecha_fin: string } {
    const hoy = new Date();
    return {
      fecha_inicio: this.formatDate(new Date(hoy.getFullYear(), hoy.getMonth(), 1)),
      fecha_fin: this.formatDate(new Date(hoy.getFullYear(), hoy.getMonth() + 1, 0))
    };
  }

  /**
   * Helper para calcular mes anterior
   */
  getMesAnterior(): { fecha_inicio: string; fecha_fin: string } {
    const hoy = new Date();
    return {
      fecha_inicio: this.formatDate(new Date(hoy.getFullYear(), hoy.getMonth() - 1, 1)),
      fecha_fin: this.formatDate(new Date(hoy.getFullYear(), hoy.getMonth(), 0))
    };
  }
}
