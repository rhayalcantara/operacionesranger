import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

/**
 * Interface para una fila del reporte de horas trabajadas
 */
export interface ReporteHorasFila {
  id: number;
  nombre: string;
  codigo: string;
  total_horas: number;
  total_dias: number;
  dias: { [fecha: string]: number };
}

/**
 * Interface para la respuesta del reporte de horas trabajadas
 */
export interface ReporteHorasResult {
  tipo: 'empleado' | 'puesto';
  fecha_inicio: string;
  fecha_fin: string;
  fechas: string[];
  filas: ReporteHorasFila[];
  total_registros: number;
}

/**
 * Interface para los filtros del reporte
 */
export interface ReporteHorasFilters {
  fecha_inicio: string;
  fecha_fin: string;
  tipo: 'empleado' | 'puesto';
  empleado_id?: number;
  puesto_id?: number;
}

/**
 * Servicio para el reporte de horas trabajadas (tabla pivot)
 * Genera reporte cruzado de horas por empleado o puesto vs fechas
 */
@Injectable({
  providedIn: 'root'
})
export class ReporteHorasService {
  private apiUrl = `${environment.apiBaseUrl}/reportes`;

  constructor(private http: HttpClient) {}

  /**
   * Obtener reporte de horas trabajadas con tabla pivot
   */
  getReporte(filters: ReporteHorasFilters): Observable<ReporteHorasResult> {
    let params = new HttpParams()
      .set('fecha_inicio', filters.fecha_inicio)
      .set('fecha_fin', filters.fecha_fin)
      .set('tipo', filters.tipo);

    if (filters.empleado_id !== undefined && filters.empleado_id !== null) {
      params = params.set('empleado_id', filters.empleado_id.toString());
    }
    if (filters.puesto_id !== undefined && filters.puesto_id !== null) {
      params = params.set('puesto_id', filters.puesto_id.toString());
    }

    return this.http.get<ReporteHorasResult>(`${this.apiUrl}/horas`, { params });
  }

  /**
   * Exportar datos del reporte a CSV y disparar descarga
   */
  exportToCsv(data: ReporteHorasResult): void {
    const tipoLabel = data.tipo === 'empleado' ? 'Empleado' : 'Puesto';

    // Construir encabezados
    const headers = [
      'Codigo',
      tipoLabel,
      'Total Horas',
      'Total Dias',
      ...data.fechas.map(f => this.formatFechaShort(f))
    ];

    // Construir filas
    const rows = data.filas.map(fila => {
      const values = [
        fila.codigo,
        `"${fila.nombre}"`,
        fila.total_horas.toFixed(2),
        fila.total_dias.toString(),
        ...data.fechas.map(fecha => {
          const valor = fila.dias[fecha];
          return valor !== undefined && valor !== null ? valor.toFixed(2) : '0';
        })
      ];
      return values.join(',');
    });

    // Construir CSV completo
    const csvContent = [headers.join(','), ...rows].join('\n');

    // BOM para soporte de caracteres especiales en Excel
    const bom = '\uFEFF';
    const blob = new Blob([bom + csvContent], { type: 'text/csv;charset=utf-8;' });

    const filename = `horas_trabajadas_${data.tipo}_${data.fecha_inicio.replace(/-/g, '')}_${data.fecha_fin.replace(/-/g, '')}.csv`;
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    window.URL.revokeObjectURL(url);
  }

  /**
   * Formatea fecha YYYY-MM-DD a DD/MM
   */
  private formatFechaShort(fecha: string): string {
    const parts = fecha.split('-');
    return `${parts[2]}/${parts[1]}`;
  }
}
