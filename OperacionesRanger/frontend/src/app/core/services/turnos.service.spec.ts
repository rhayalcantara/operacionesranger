import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TurnosService, Turno, TurnosResponse, TurnosEstadisticas } from './turnos.service';
import { environment } from '../../../environments/environment';

describe('TurnosService', () => {
  let service: TurnosService;
  let httpMock: HttpTestingController;
  const apiUrl = `${environment.apiBaseUrl}/turnos`;

  const mockTurno: Turno = {
    id: 1,
    empleado_id: 100,
    puesto_id: 10,
    fecha: '2026-01-15',
    hora_entrada: '06:00:00',
    hora_salida: '18:00:00',
    horas_normales: 10,
    horas_extras: 2,
    tipo_turno: 'DIURNO',
    es_feriado: false,
    procesado_nomina: false,
  };

  const mockResponse: TurnosResponse = {
    data: [mockTurno],
    total: 1,
  };

  const mockEstadisticas: TurnosEstadisticas = {
    total_turnos: 50,
    total_horas_normales: 450,
    total_horas_extras: 30,
    turnos_procesados: 20,
    turnos_pendientes: 30,
    turnos_en_feriado: 5,
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [TurnosService, provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(TurnosService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  // ============================================================================
  // getAll
  // ============================================================================

  describe('getAll()', () => {
    it('should GET turnos without filters', () => {
      service.getAll().subscribe((resp) => {
        expect(resp.data.length).toBe(1);
      });

      const req = httpMock.expectOne(apiUrl);
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });

    it('should pass date range and other filters', () => {
      service.getAll({ fecha_inicio: '2026-01-01', fecha_fin: '2026-01-15', empleado_id: 100, tipo_turno: 'DIURNO' }).subscribe();

      const req = httpMock.expectOne((r) => r.url === apiUrl);
      expect(req.request.params.get('fecha_inicio')).toBe('2026-01-01');
      expect(req.request.params.get('fecha_fin')).toBe('2026-01-15');
      expect(req.request.params.get('empleado_id')).toBe('100');
      expect(req.request.params.get('tipo_turno')).toBe('DIURNO');
      req.flush(mockResponse);
    });
  });

  // ============================================================================
  // getById / create / update / delete
  // ============================================================================

  describe('getById()', () => {
    it('should GET turno by ID', () => {
      service.getById(1).subscribe((t) => {
        expect(t.tipo_turno).toBe('DIURNO');
      });

      const req = httpMock.expectOne(`${apiUrl}/1`);
      expect(req.request.method).toBe('GET');
      req.flush(mockTurno);
    });
  });

  describe('create()', () => {
    it('should POST new turno', () => {
      const newData = {
        empleado_id: 100,
        puesto_id: 10,
        fecha: '2026-01-16',
        hora_entrada: '06:00:00',
        hora_salida: '18:00:00',
        horas_normales: 10,
        horas_extras: 2,
      };

      service.create(newData).subscribe((created) => {
        expect(created.id).toBe(2);
      });

      const req = httpMock.expectOne(apiUrl);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(newData);
      req.flush({ ...mockTurno, id: 2 });
    });
  });

  describe('delete()', () => {
    it('should DELETE turno', () => {
      service.delete(1).subscribe();

      const req = httpMock.expectOne(`${apiUrl}/1`);
      expect(req.request.method).toBe('DELETE');
      req.flush(null);
    });
  });

  // ============================================================================
  // getEstadisticas
  // ============================================================================

  describe('getEstadisticas()', () => {
    it('should GET estadisticas with date range params', () => {
      service.getEstadisticas('2026-01-01', '2026-01-15').subscribe((stats) => {
        expect(stats.total_turnos).toBe(50);
        expect(stats.turnos_pendientes).toBe(30);
      });

      const req = httpMock.expectOne((r) => r.url === `${apiUrl}/estadisticas`);
      expect(req.request.params.get('fecha_inicio')).toBe('2026-01-01');
      expect(req.request.params.get('fecha_fin')).toBe('2026-01-15');
      req.flush(mockEstadisticas);
    });
  });

  // ============================================================================
  // marcarProcesados
  // ============================================================================

  describe('marcarProcesados()', () => {
    it('should POST turnoIds and nominaId to marcar-procesados', () => {
      service.marcarProcesados([1, 2, 3], 42).subscribe();

      const req = httpMock.expectOne(`${apiUrl}/marcar-procesados`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({ turnoIds: [1, 2, 3], nominaId: 42 });
      req.flush(null);
    });
  });

  // ============================================================================
  // getByEmpleado / getByPuesto / getPendientes
  // ============================================================================

  describe('getByEmpleado()', () => {
    it('should call getAll with empleado_id filter', () => {
      service.getByEmpleado(100, '2026-01-01', '2026-01-15').subscribe();

      const req = httpMock.expectOne((r) => r.url === apiUrl);
      expect(req.request.params.get('empleado_id')).toBe('100');
      expect(req.request.params.get('fecha_inicio')).toBe('2026-01-01');
      req.flush(mockResponse);
    });
  });

  describe('getByPuesto()', () => {
    it('should call getAll with puesto_id filter', () => {
      service.getByPuesto(10).subscribe();

      const req = httpMock.expectOne((r) => r.url === apiUrl);
      expect(req.request.params.get('puesto_id')).toBe('10');
      req.flush(mockResponse);
    });
  });

  describe('getPendientes()', () => {
    it('should call getAll with procesado_nomina false', () => {
      service.getPendientes().subscribe();

      const req = httpMock.expectOne((r) => r.url === apiUrl);
      expect(req.request.params.get('procesado_nomina')).toBe('false');
      req.flush(mockResponse);
    });
  });

  // ============================================================================
  // Pure functions: calcularHorasNormales
  // ============================================================================

  describe('calcularHorasNormales()', () => {
    it('should calculate normal day shift hours', () => {
      expect(service.calcularHorasNormales('06:00', '18:00')).toBe(12);
    });

    it('should calculate partial shift hours', () => {
      expect(service.calcularHorasNormales('08:00', '16:00')).toBe(8);
    });

    it('should handle overnight shifts (e.g. 22:00 to 06:00)', () => {
      expect(service.calcularHorasNormales('22:00', '06:00')).toBe(8);
    });

    it('should return 0 for empty input', () => {
      expect(service.calcularHorasNormales('', '06:00')).toBe(0);
      expect(service.calcularHorasNormales('06:00', '')).toBe(0);
    });
  });

  // ============================================================================
  // Pure functions: formatTimeForBackend / formatTimeForForm
  // ============================================================================

  describe('formatTimeForBackend()', () => {
    it('should add :00 to HH:mm format', () => {
      expect(service.formatTimeForBackend('06:00')).toBe('06:00:00');
    });

    it('should return HH:mm:ss as-is', () => {
      expect(service.formatTimeForBackend('06:00:00')).toBe('06:00:00');
    });

    it('should return empty for empty input', () => {
      expect(service.formatTimeForBackend('')).toBe('');
    });
  });

  describe('formatTimeForForm()', () => {
    it('should strip seconds from HH:mm:ss', () => {
      expect(service.formatTimeForForm('06:00:00')).toBe('06:00');
    });

    it('should return HH:mm as-is', () => {
      expect(service.formatTimeForForm('06:00')).toBe('06:00');
    });

    it('should return empty for empty input', () => {
      expect(service.formatTimeForForm('')).toBe('');
    });
  });
});
