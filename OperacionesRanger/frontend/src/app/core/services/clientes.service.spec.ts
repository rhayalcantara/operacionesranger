import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ClientesService, Cliente, ClientesResponse } from './clientes.service';
import { environment } from '../../../environments/environment';

describe('ClientesService', () => {
  let service: ClientesService;
  let httpMock: HttpTestingController;
  const apiUrl = `${environment.apiBaseUrl}/clientes`;

  const mockCliente: Cliente = {
    id: 1,
    codigo: 'CLI-001',
    nombre: 'Cliente Test',
    ruc: '123456789',
    activo: true,
    created_at: '2026-01-01',
  };

  const mockResponse: ClientesResponse = {
    data: [mockCliente],
    total: 1,
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [ClientesService, provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(ClientesService);
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
    it('should GET clientes without filters', () => {
      service.getAll().subscribe((resp) => {
        expect(resp.data.length).toBe(1);
        expect(resp.total).toBe(1);
      });

      const req = httpMock.expectOne(apiUrl);
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });

    it('should pass pagination params', () => {
      service.getAll({ page: 2, pageSize: 20 }).subscribe();

      const req = httpMock.expectOne((r) => r.url === apiUrl);
      expect(req.request.params.get('page')).toBe('2');
      expect(req.request.params.get('pageSize')).toBe('20');
      req.flush(mockResponse);
    });

    it('should pass search param', () => {
      service.getAll({ search: 'test' }).subscribe();

      const req = httpMock.expectOne((r) => r.url === apiUrl);
      expect(req.request.params.get('search')).toBe('test');
      req.flush(mockResponse);
    });

    it('should pass activo filter', () => {
      service.getAll({ activo: true }).subscribe();

      const req = httpMock.expectOne((r) => r.url === apiUrl);
      expect(req.request.params.get('activo')).toBe('true');
      req.flush(mockResponse);
    });
  });

  // ============================================================================
  // getById
  // ============================================================================

  describe('getById()', () => {
    it('should GET cliente by ID', () => {
      service.getById(1).subscribe((cliente) => {
        expect(cliente.id).toBe(1);
        expect(cliente.nombre).toBe('Cliente Test');
      });

      const req = httpMock.expectOne(`${apiUrl}/1`);
      expect(req.request.method).toBe('GET');
      req.flush(mockCliente);
    });
  });

  // ============================================================================
  // create
  // ============================================================================

  describe('create()', () => {
    it('should POST new cliente', () => {
      const newCliente = { codigo: 'CLI-002', nombre: 'Nuevo', ruc: '987654321' };

      service.create(newCliente).subscribe((created) => {
        expect(created.id).toBe(2);
      });

      const req = httpMock.expectOne(apiUrl);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(newCliente);
      req.flush({ ...newCliente, id: 2, activo: true });
    });
  });

  // ============================================================================
  // update
  // ============================================================================

  describe('update()', () => {
    it('should PUT updated cliente', () => {
      const updates = { nombre: 'Updated' };

      service.update(1, updates).subscribe((updated) => {
        expect(updated.nombre).toBe('Updated');
      });

      const req = httpMock.expectOne(`${apiUrl}/1`);
      expect(req.request.method).toBe('PUT');
      expect(req.request.body).toEqual(updates);
      req.flush({ ...mockCliente, nombre: 'Updated' });
    });
  });

  // ============================================================================
  // delete
  // ============================================================================

  describe('delete()', () => {
    it('should DELETE cliente', () => {
      service.delete(1).subscribe();

      const req = httpMock.expectOne(`${apiUrl}/1`);
      expect(req.request.method).toBe('DELETE');
      req.flush(null);
    });
  });

  // ============================================================================
  // validarRucUnico
  // ============================================================================

  describe('validarRucUnico()', () => {
    it('should return true when RUC does not exist', () => {
      service.validarRucUnico('123456789').subscribe((isUnique) => {
        expect(isUnique).toBe(true);
      });

      const req = httpMock.expectOne((r) => r.url === `${apiUrl}/validate-ruc`);
      expect(req.request.params.get('ruc')).toBe('123456789');
      req.flush({ exists: false });
    });

    it('should return false when RUC exists', () => {
      service.validarRucUnico('123456789').subscribe((isUnique) => {
        expect(isUnique).toBe(false);
      });

      const req = httpMock.expectOne((r) => r.url === `${apiUrl}/validate-ruc`);
      req.flush({ exists: true });
    });

    it('should pass excludeId when provided', () => {
      service.validarRucUnico('123456789', 5).subscribe();

      const req = httpMock.expectOne((r) => r.url === `${apiUrl}/validate-ruc`);
      expect(req.request.params.get('excludeId')).toBe('5');
      req.flush({ exists: false });
    });

    it('should return true on error (fail-safe)', () => {
      service.validarRucUnico('bad').subscribe((isUnique) => {
        expect(isUnique).toBe(true);
      });

      const req = httpMock.expectOne((r) => r.url === `${apiUrl}/validate-ruc`);
      req.flush(null, { status: 500, statusText: 'Error' });
    });
  });

  // ============================================================================
  // getActiveClientes
  // ============================================================================

  describe('getActiveClientes()', () => {
    it('should return only data array from response', () => {
      service.getActiveClientes().subscribe((clientes) => {
        expect(clientes).toEqual([mockCliente]);
      });

      const req = httpMock.expectOne((r) => r.url === apiUrl);
      expect(req.request.params.get('activo')).toBe('true');
      expect(req.request.params.get('pageSize')).toBe('1000');
      req.flush(mockResponse);
    });
  });

  // ============================================================================
  // searchByName
  // ============================================================================

  describe('searchByName()', () => {
    it('should return empty array for empty search', () => {
      service.searchByName('').subscribe((result) => {
        expect(result).toEqual([]);
      });
      // No HTTP request should be made
    });

    it('should search with pageSize 10', () => {
      service.searchByName('test').subscribe((result) => {
        expect(result).toEqual([mockCliente]);
      });

      const req = httpMock.expectOne((r) => r.url === apiUrl);
      expect(req.request.params.get('search')).toBe('test');
      expect(req.request.params.get('pageSize')).toBe('10');
      req.flush(mockResponse);
    });
  });
});
