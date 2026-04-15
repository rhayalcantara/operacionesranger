import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { UbicacionesService, Ubicacion, UbicacionesResponse } from './ubicaciones.service';
import { environment } from '../../../environments/environment';

describe('UbicacionesService', () => {
  let service: UbicacionesService;
  let httpMock: HttpTestingController;
  const apiUrl = `${environment.apiBaseUrl}/ubicaciones`;

  const mockUbicacion: Ubicacion = {
    id: 1,
    cliente_id: 10,
    codigo: 'UB-001',
    nombre: 'Ubicacion Test',
    direccion: 'Calle 1',
    activo: true,
    created_at: '2026-01-01',
  };

  const mockResponse: UbicacionesResponse = {
    data: [mockUbicacion],
    total: 1,
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [UbicacionesService, provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(UbicacionesService);
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
    it('should GET ubicaciones without filters', () => {
      service.getAll().subscribe((resp) => {
        expect(resp.data.length).toBe(1);
        expect(resp.total).toBe(1);
      });

      const req = httpMock.expectOne(apiUrl);
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });

    it('should pass pagination and search params', () => {
      service.getAll({ page: 2, pageSize: 25, search: 'test' }).subscribe();

      const req = httpMock.expectOne((r) => r.url === apiUrl);
      expect(req.request.params.get('page')).toBe('2');
      expect(req.request.params.get('pageSize')).toBe('25');
      expect(req.request.params.get('search')).toBe('test');
      req.flush(mockResponse);
    });

    it('should pass cliente_id and activo filters', () => {
      service.getAll({ cliente_id: 10, activo: true }).subscribe();

      const req = httpMock.expectOne((r) => r.url === apiUrl);
      expect(req.request.params.get('cliente_id')).toBe('10');
      expect(req.request.params.get('activo')).toBe('true');
      req.flush(mockResponse);
    });
  });

  // ============================================================================
  // getById
  // ============================================================================

  describe('getById()', () => {
    it('should GET ubicacion by ID', () => {
      service.getById(1).subscribe((ubicacion) => {
        expect(ubicacion.id).toBe(1);
        expect(ubicacion.nombre).toBe('Ubicacion Test');
      });

      const req = httpMock.expectOne(`${apiUrl}/1`);
      expect(req.request.method).toBe('GET');
      req.flush(mockUbicacion);
    });
  });

  // ============================================================================
  // getByCliente
  // ============================================================================

  describe('getByCliente()', () => {
    it('should GET ubicaciones by cliente_id with pageSize 1000', () => {
      service.getByCliente(10).subscribe((ubicaciones) => {
        expect(ubicaciones).toEqual([mockUbicacion]);
      });

      const req = httpMock.expectOne((r) => r.url === apiUrl);
      expect(req.request.params.get('cliente_id')).toBe('10');
      expect(req.request.params.get('pageSize')).toBe('1000');
      req.flush([mockUbicacion]);
    });
  });

  // ============================================================================
  // create / update / delete
  // ============================================================================

  describe('create()', () => {
    it('should POST new ubicacion', () => {
      const newData = { codigo: 'UB-002', nombre: 'Nueva', cliente_id: 10 };

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
    it('should PUT updated ubicacion', () => {
      const updates = { nombre: 'Updated' };

      service.update(1, updates).subscribe((updated) => {
        expect(updated.nombre).toBe('Updated');
      });

      const req = httpMock.expectOne(`${apiUrl}/1`);
      expect(req.request.method).toBe('PUT');
      expect(req.request.body).toEqual(updates);
      req.flush({ ...mockUbicacion, nombre: 'Updated' });
    });
  });

  describe('delete()', () => {
    it('should DELETE ubicacion', () => {
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
    it('should GET validar-codigo with cliente_id and codigo', () => {
      service.validarCodigoUnico(10, 'UB-001').subscribe();

      const req = httpMock.expectOne((r) => r.url === `${apiUrl}/validar-codigo`);
      expect(req.request.params.get('cliente_id')).toBe('10');
      expect(req.request.params.get('codigo')).toBe('UB-001');
      req.flush(true);
    });

    it('should pass excludeId when provided', () => {
      service.validarCodigoUnico(10, 'UB-001', 5).subscribe();

      const req = httpMock.expectOne((r) => r.url === `${apiUrl}/validar-codigo`);
      expect(req.request.params.get('excludeId')).toBe('5');
      req.flush(true);
    });
  });
});
