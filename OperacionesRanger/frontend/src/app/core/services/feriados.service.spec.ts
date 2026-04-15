import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { FeriadosService, Feriado, FeriadosResponse, TipoFeriado } from './feriados.service';
import { environment } from '../../../environments/environment';

describe('FeriadosService', () => {
  let service: FeriadosService;
  let httpMock: HttpTestingController;
  const apiUrl = `${environment.apiBaseUrl}/feriados`;

  const mockFeriado: Feriado = {
    id: 1,
    fecha: '2026-01-01',
    nombre: 'Ano Nuevo',
    tipo: TipoFeriado.NACIONAL,
    descripcion: null,
    created_at: '2026-01-01',
  };

  const mockResponse: FeriadosResponse = {
    data: [mockFeriado],
    total: 1,
    page: 1,
    pageSize: 10,
    totalPages: 1,
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [FeriadosService, provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(FeriadosService);
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
    it('should GET feriados without filters', () => {
      service.getAll().subscribe((resp) => {
        expect(resp.data.length).toBe(1);
      });

      const req = httpMock.expectOne(apiUrl);
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });

    it('should pass año and tipo filters', () => {
      service.getAll({ año: 2026, tipo: TipoFeriado.DECRETO }).subscribe();

      const req = httpMock.expectOne((r) => r.url === apiUrl);
      expect(req.request.params.get('año')).toBe('2026');
      expect(req.request.params.get('tipo')).toBe('DECRETO');
      req.flush(mockResponse);
    });
  });

  // ============================================================================
  // getById
  // ============================================================================

  describe('getById()', () => {
    it('should GET feriado by ID', () => {
      service.getById(1).subscribe((f) => {
        expect(f.nombre).toBe('Ano Nuevo');
      });

      const req = httpMock.expectOne(`${apiUrl}/1`);
      expect(req.request.method).toBe('GET');
      req.flush(mockFeriado);
    });
  });

  // ============================================================================
  // verificarFeriado
  // ============================================================================

  describe('verificarFeriado()', () => {
    it('should GET verificar endpoint with fecha', () => {
      service.verificarFeriado('2026-01-01').subscribe((result) => {
        expect(result.es_feriado).toBe(true);
      });

      const req = httpMock.expectOne(`${apiUrl}/verificar/2026-01-01`);
      expect(req.request.method).toBe('GET');
      req.flush({ fecha: '2026-01-01', es_feriado: true, feriado: { id: 1, nombre: 'Ano Nuevo', tipo: 'NACIONAL' } });
    });
  });

  // ============================================================================
  // create / update / delete
  // ============================================================================

  describe('create()', () => {
    it('should POST new feriado', () => {
      const newData = { fecha: '2026-02-27', nombre: 'Independencia', tipo: TipoFeriado.NACIONAL };

      service.create(newData).subscribe((created) => {
        expect(created.id).toBe(2);
      });

      const req = httpMock.expectOne(apiUrl);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(newData);
      req.flush({ ...newData, id: 2 });
    });
  });

  describe('update()', () => {
    it('should PUT updated feriado', () => {
      service.update(1, { nombre: 'Updated' }).subscribe();

      const req = httpMock.expectOne(`${apiUrl}/1`);
      expect(req.request.method).toBe('PUT');
      req.flush({ ...mockFeriado, nombre: 'Updated' });
    });
  });

  describe('delete()', () => {
    it('should DELETE feriado', () => {
      service.delete(1).subscribe();

      const req = httpMock.expectOne(`${apiUrl}/1`);
      expect(req.request.method).toBe('DELETE');
      req.flush(null);
    });
  });

  // ============================================================================
  // validarFechaUnica
  // ============================================================================

  describe('validarFechaUnica()', () => {
    it('should return true when date has no feriado', () => {
      service.validarFechaUnica('2026-03-15').subscribe((isUnique) => {
        expect(isUnique).toBe(true);
      });

      const req = httpMock.expectOne(`${apiUrl}/verificar/2026-03-15`);
      req.flush({ fecha: '2026-03-15', es_feriado: false, feriado: null });
    });

    it('should return true when editing the same feriado', () => {
      service.validarFechaUnica('2026-01-01', 1).subscribe((isUnique) => {
        expect(isUnique).toBe(true);
      });

      const req = httpMock.expectOne(`${apiUrl}/verificar/2026-01-01`);
      req.flush({ fecha: '2026-01-01', es_feriado: true, feriado: { id: 1, nombre: 'Ano Nuevo', tipo: 'NACIONAL' } });
    });

    it('should return false when date is already a different feriado', () => {
      service.validarFechaUnica('2026-01-01').subscribe((isUnique) => {
        expect(isUnique).toBe(false);
      });

      const req = httpMock.expectOne(`${apiUrl}/verificar/2026-01-01`);
      req.flush({ fecha: '2026-01-01', es_feriado: true, feriado: { id: 1, nombre: 'Ano Nuevo', tipo: 'NACIONAL' } });
    });

    it('should return true on error (fail-safe)', () => {
      service.validarFechaUnica('bad-date').subscribe((isUnique) => {
        expect(isUnique).toBe(true);
      });

      const req = httpMock.expectOne(`${apiUrl}/verificar/bad-date`);
      req.flush(null, { status: 500, statusText: 'Error' });
    });
  });

  // ============================================================================
  // getFeriadosPorAño
  // ============================================================================

  describe('getFeriadosPorAño()', () => {
    it('should return data array from response', () => {
      service.getFeriadosPorAño(2026).subscribe((feriados) => {
        expect(feriados).toEqual([mockFeriado]);
      });

      const req = httpMock.expectOne((r) => r.url === apiUrl);
      expect(req.request.params.get('año')).toBe('2026');
      expect(req.request.params.get('pageSize')).toBe('1000');
      req.flush(mockResponse);
    });
  });

  // ============================================================================
  // getAñosDisponibles (synchronous)
  // ============================================================================

  describe('getAñosDisponibles()', () => {
    it('should return array of years from 2024 to 2030', () => {
      const años = service.getAñosDisponibles();
      expect(años).toEqual([2024, 2025, 2026, 2027, 2028, 2029, 2030]);
      expect(años.length).toBe(7);
    });
  });
});
