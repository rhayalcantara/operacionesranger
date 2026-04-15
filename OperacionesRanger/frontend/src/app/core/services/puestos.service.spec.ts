import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { PuestosService, Puesto, PuestosResponse } from './puestos.service';
import { environment } from '../../../environments/environment';

describe('PuestosService', () => {
  let service: PuestosService;
  let httpMock: HttpTestingController;
  const apiUrl = `${environment.apiBaseUrl}/puestos`;

  const mockPuesto: Puesto = {
    id: 1,
    ubicacion_id: 5,
    codigo: 'P-001',
    nombre: 'Puesto Test',
    cantidad_guardianes: 2,
    activo: true,
    created_at: '2026-01-01',
  };

  const mockResponse: PuestosResponse = {
    data: [mockPuesto],
    total: 1,
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [PuestosService, provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(PuestosService);
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
    it('should GET puestos without filters', () => {
      service.getAll().subscribe((resp) => {
        expect(resp.data.length).toBe(1);
      });

      const req = httpMock.expectOne(apiUrl);
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });

    it('should pass all filter params', () => {
      service.getAll({ page: 1, pageSize: 10, search: 'x', ubicacion_id: 5, cliente_id: 3, activo: true }).subscribe();

      const req = httpMock.expectOne((r) => r.url === apiUrl);
      expect(req.request.params.get('ubicacion_id')).toBe('5');
      expect(req.request.params.get('cliente_id')).toBe('3');
      expect(req.request.params.get('activo')).toBe('true');
      req.flush(mockResponse);
    });
  });

  // ============================================================================
  // getById
  // ============================================================================

  describe('getById()', () => {
    it('should GET puesto by ID', () => {
      service.getById(1).subscribe((p) => {
        expect(p.id).toBe(1);
      });

      const req = httpMock.expectOne(`${apiUrl}/1`);
      expect(req.request.method).toBe('GET');
      req.flush(mockPuesto);
    });
  });

  // ============================================================================
  // getByUbicacion / getByCliente
  // ============================================================================

  describe('getByUbicacion()', () => {
    it('should GET puestos by ubicacion_id with pageSize 1000', () => {
      service.getByUbicacion(5).subscribe();

      const req = httpMock.expectOne((r) => r.url === apiUrl);
      expect(req.request.params.get('ubicacion_id')).toBe('5');
      expect(req.request.params.get('pageSize')).toBe('1000');
      req.flush([mockPuesto]);
    });
  });

  describe('getByCliente()', () => {
    it('should GET puestos by cliente_id with pageSize 1000', () => {
      service.getByCliente(3).subscribe();

      const req = httpMock.expectOne((r) => r.url === apiUrl);
      expect(req.request.params.get('cliente_id')).toBe('3');
      expect(req.request.params.get('pageSize')).toBe('1000');
      req.flush([mockPuesto]);
    });
  });

  // ============================================================================
  // getTurnosByPuesto
  // ============================================================================

  describe('getTurnosByPuesto()', () => {
    it('should GET turnos for a puesto', () => {
      service.getTurnosByPuesto(1).subscribe((turnos) => {
        expect(turnos.length).toBe(1);
      });

      const req = httpMock.expectOne(`${apiUrl}/1/turnos`);
      expect(req.request.method).toBe('GET');
      req.flush([{ id: 10, tipo_turno: 'DIURNO' }]);
    });
  });

  // ============================================================================
  // create / update / delete
  // ============================================================================

  describe('create()', () => {
    it('should POST new puesto', () => {
      const newData = { codigo: 'P-002', nombre: 'Nuevo', ubicacion_id: 5 };

      service.create(newData).subscribe((created) => {
        expect(created.id).toBe(2);
      });

      const req = httpMock.expectOne(apiUrl);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(newData);
      req.flush({ ...newData, id: 2, activo: true });
    });
  });

  describe('update()', () => {
    it('should PUT updated puesto', () => {
      service.update(1, { nombre: 'Updated' }).subscribe();

      const req = httpMock.expectOne(`${apiUrl}/1`);
      expect(req.request.method).toBe('PUT');
      req.flush({ ...mockPuesto, nombre: 'Updated' });
    });
  });

  describe('delete()', () => {
    it('should DELETE puesto', () => {
      service.delete(1).subscribe();

      const req = httpMock.expectOne(`${apiUrl}/1`);
      expect(req.request.method).toBe('DELETE');
      req.flush(null);
    });
  });

  // ============================================================================
  // validarCodigoUnico
  // ============================================================================

  describe('validarCodigoUnico()', () => {
    it('should GET validar-codigo with ubicacion_id and codigo', () => {
      service.validarCodigoUnico(5, 'P-001').subscribe();

      const req = httpMock.expectOne((r) => r.url === `${apiUrl}/validar-codigo`);
      expect(req.request.params.get('ubicacion_id')).toBe('5');
      expect(req.request.params.get('codigo')).toBe('P-001');
      req.flush(true);
    });

    it('should pass excludeId when provided', () => {
      service.validarCodigoUnico(5, 'P-001', 3).subscribe();

      const req = httpMock.expectOne((r) => r.url === `${apiUrl}/validar-codigo`);
      expect(req.request.params.get('excludeId')).toBe('3');
      req.flush(false);
    });
  });
});
