import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { DiarioPuestoService, DiarioPuesto, DiarioPuestoResponse } from './diario-puesto.service';
import { environment } from '../../../environments/environment';

describe('DiarioPuestoService', () => {
  let service: DiarioPuestoService;
  let httpMock: HttpTestingController;
  const apiUrl = `${environment.apiBaseUrl}/diario-puesto`;

  const mockDiario: DiarioPuesto = {
    id: 1,
    puesto_id: 10,
    empleado_id: 100,
    fecha: '2026-01-15',
    horas: 10,
    tipo_turno: 'DIURNO',
    origen: 'MANUAL',
    puesto_nombre: 'Puesto A',
    puesto_codigo: 'P-001',
    ubicacion_nombre: 'Ubicacion 1',
    cliente_nombre: 'Cliente 1',
    empleado_nombre: 'Juan Perez',
    empleado_cedula: '001-0000001-1',
  };

  const mockResponse: DiarioPuestoResponse = {
    data: [mockDiario],
    total: 1,
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [DiarioPuestoService, provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(DiarioPuestoService);
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
    it('should GET diario entries without filters', () => {
      service.getAll().subscribe((resp) => {
        expect(resp.data.length).toBe(1);
      });

      const req = httpMock.expectOne(apiUrl);
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });

    it('should pass all filter params', () => {
      service.getAll({
        page: 1,
        pageSize: 25,
        fecha: '2026-01-15',
        cliente_id: 5,
        ubicacion_id: 3,
        puesto_id: 10,
        empleado_id: 100,
        tipo_turno: 'NOCTURNO',
      }).subscribe();

      const req = httpMock.expectOne((r) => r.url === apiUrl);
      expect(req.request.params.get('fecha')).toBe('2026-01-15');
      expect(req.request.params.get('cliente_id')).toBe('5');
      expect(req.request.params.get('empleado_id')).toBe('100');
      expect(req.request.params.get('tipo_turno')).toBe('NOCTURNO');
      req.flush(mockResponse);
    });
  });

  // ============================================================================
  // getById
  // ============================================================================

  describe('getById()', () => {
    it('should GET diario entry by ID', () => {
      service.getById(1).subscribe((d) => {
        expect(d.empleado_nombre).toBe('Juan Perez');
      });

      const req = httpMock.expectOne(`${apiUrl}/1`);
      expect(req.request.method).toBe('GET');
      req.flush(mockDiario);
    });
  });

  // ============================================================================
  // create / update / delete
  // ============================================================================

  describe('create()', () => {
    it('should POST new diario entry', () => {
      const newData = { puesto_id: 10, empleado_id: 100, fecha: '2026-01-16', horas: 8, tipo_turno: 'DIURNO' as const };

      service.create(newData).subscribe((created) => {
        expect(created.id).toBe(2);
      });

      const req = httpMock.expectOne(apiUrl);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(newData);
      req.flush({ ...mockDiario, id: 2 });
    });
  });

  describe('update()', () => {
    it('should PUT updated diario entry', () => {
      service.update(1, { horas: 12 }).subscribe();

      const req = httpMock.expectOne(`${apiUrl}/1`);
      expect(req.request.method).toBe('PUT');
      req.flush({ ...mockDiario, horas: 12 });
    });
  });

  describe('delete()', () => {
    it('should DELETE diario entry', () => {
      service.delete(1).subscribe();

      const req = httpMock.expectOne(`${apiUrl}/1`);
      expect(req.request.method).toBe('DELETE');
      req.flush(null);
    });
  });

  // ============================================================================
  // poblarDesdePlantilla
  // ============================================================================

  describe('poblarDesdePlantilla()', () => {
    it('should POST to poblar-plantilla endpoint', () => {
      service.poblarDesdePlantilla(5, '2026-01-15').subscribe((result) => {
        expect(result.insertados).toBe(10);
        expect(result.omitidos).toBe(2);
      });

      const req = httpMock.expectOne(`${apiUrl}/poblar-plantilla`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({ plantilla_id: 5, fecha: '2026-01-15' });
      req.flush({ insertados: 10, omitidos: 2, mensaje: 'OK' });
    });
  });
});
