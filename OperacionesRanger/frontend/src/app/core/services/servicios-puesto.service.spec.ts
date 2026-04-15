import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ServiciosPuestoService, ServicioPuesto, ServiciosPuestoResponse } from './servicios-puesto.service';
import { environment } from '../../../environments/environment';

describe('ServiciosPuestoService', () => {
  let service: ServiciosPuestoService;
  let httpMock: HttpTestingController;
  const apiUrl = `${environment.apiBaseUrl}/servicios-puesto`;

  const mockServicio: ServicioPuesto = {
    id: 1,
    puesto_id: 10,
    tipo_turno: 'DIURNO',
    domingo_empleado_id: null,
    lunes_empleado_id: 100,
    martes_empleado_id: 100,
    miercoles_empleado_id: 100,
    jueves_empleado_id: 100,
    viernes_empleado_id: 100,
    sabado_empleado_id: null,
    domingo_empleado_nombre: null,
    lunes_empleado_nombre: 'Juan Perez',
    martes_empleado_nombre: 'Juan Perez',
    miercoles_empleado_nombre: 'Juan Perez',
    jueves_empleado_nombre: 'Juan Perez',
    viernes_empleado_nombre: 'Juan Perez',
    sabado_empleado_nombre: null,
    puesto_nombre: 'Puesto A',
    puesto_codigo: 'P-001',
    ubicacion_nombre: 'Ubicacion 1',
    cliente_nombre: 'Cliente 1',
    cobrada: false,
    activo: true,
  };

  const mockResponse: ServiciosPuestoResponse = {
    data: [mockServicio],
    total: 1,
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [ServiciosPuestoService, provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(ServiciosPuestoService);
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
    it('should GET servicios without filters', () => {
      service.getAll().subscribe((resp) => {
        expect(resp.data.length).toBe(1);
        expect(resp.total).toBe(1);
      });

      const req = httpMock.expectOne(apiUrl);
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });

    it('should pass all filter params', () => {
      service.getAll({ page: 1, pageSize: 10, cliente_id: 5, ubicacion_id: 3, tipo_turno: 'NOCTURNO', cobrada: true, activo: true }).subscribe();

      const req = httpMock.expectOne((r) => r.url === apiUrl);
      expect(req.request.params.get('cliente_id')).toBe('5');
      expect(req.request.params.get('ubicacion_id')).toBe('3');
      expect(req.request.params.get('tipo_turno')).toBe('NOCTURNO');
      expect(req.request.params.get('cobrada')).toBe('true');
      req.flush(mockResponse);
    });
  });

  // ============================================================================
  // getById
  // ============================================================================

  describe('getById()', () => {
    it('should GET servicio by ID', () => {
      service.getById(1).subscribe((s) => {
        expect(s.puesto_nombre).toBe('Puesto A');
      });

      const req = httpMock.expectOne(`${apiUrl}/1`);
      expect(req.request.method).toBe('GET');
      req.flush(mockServicio);
    });
  });

  // ============================================================================
  // create / update / delete
  // ============================================================================

  describe('create()', () => {
    it('should POST new servicio', () => {
      const newData = { puesto_id: 10, tipo_turno: 'DIURNO' as const };

      service.create(newData).subscribe((created) => {
        expect(created.id).toBe(2);
      });

      const req = httpMock.expectOne(apiUrl);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(newData);
      req.flush({ ...mockServicio, id: 2 });
    });
  });

  describe('update()', () => {
    it('should PUT updated servicio', () => {
      const updates = { lunes_empleado_id: 200 };

      service.update(1, updates).subscribe();

      const req = httpMock.expectOne(`${apiUrl}/1`);
      expect(req.request.method).toBe('PUT');
      expect(req.request.body).toEqual(updates);
      req.flush({ ...mockServicio, lunes_empleado_id: 200 });
    });
  });

  describe('delete()', () => {
    it('should DELETE servicio', () => {
      service.delete(1).subscribe();

      const req = httpMock.expectOne(`${apiUrl}/1`);
      expect(req.request.method).toBe('DELETE');
      req.flush(null);
    });
  });
});
